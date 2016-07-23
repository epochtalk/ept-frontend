var difference = require('lodash/difference');

var directive = ['Conversations', 'User', 'Session', 'Alert', '$filter', '$state', '$q', '$timeout', 'Boards', 'Bans', 'Websocket',
function(Conversations, User, Session, Alert, $filter, $state, $q, $timeout, Boards, Bans, Websocket) {
  return {
    restrict: 'E',
    scope: true,
    bindToController: { user: '=' },
    template: require('./profile.html'),
    controllerAs: 'vm',
    controller: [function() {
      var ctrl = this;

      this.isLoggedIn = function() { return Session.isAuthenticated(); };

      this.canPageUserNotes = function() {
        return Session.isAuthenticated() && Session.hasPermission('userNotes.page');
      };

      // Check if user is banned
      this.ban_expiration = function() {
        var result;
        var expiration = this.user.ban_expiration;
        var canBan = Session.hasPermission('bans.privilegedBan');

        if (canBan && expiration && new Date(expiration) > new Date()) {
          result = $filter('humanDate')(expiration, true);
        }
        return result;
      };

      // Compute user's age
      this.userAge = function(dob) {
        if (!dob) { return; }
        dob = new Date(dob);
        var ageDate = new Date(Date.now() - dob.getTime());
        return Math.abs(ageDate.getUTCFullYear() - 1970);
      };

      // Permissions
      this.pageOwner = function() { return Session.user.id === this.user.id; };

      this.canUpdate = function() {
        if (!Session.isAuthenticated()) { return false; }
        if (!Session.hasPermission('users.update.allow')) { return false; }

        var same = Session.hasPermission('users.update.bypass.priority.admin');
        var lower = Session.hasPermission('users.update.bypass.priority.mod');

        var valid = false;
        if (ctrl.pageOwner()) { valid = true; }
        else if (same) { valid = Session.getPriority() <= this.user.priority; }
        else if (lower) { valid = Session.getPriority() < this.user.priority; }
        return valid;
      };

      this.canUpdatePrivate = function() { return ctrl.canUpdate() && ctrl.pageOwner(); };

      this.canDeactivate = function() {
        if (!Session.isAuthenticated()) { return false; }
        if (!Session.hasPermission('users.deactivate.allow')) { return false; }
        if (ctrl.user.deleted) { return false; }

        var same = Session.hasPermission('users.deactivate.bypass.priority.admin');
        var lower = Session.hasPermission('users.deactivate.bypass.priority.mod');

        var valid = false;
        if (ctrl.pageOwner()) { valid = true; }
        else if (same) { valid = Session.getPriority() <= this.user.priority; }
        else if (lower) { valid = Session.getPriority() < this.user.priority; }
        return valid;
      };

      this.canReactivate = function() {
        if (!Session.isAuthenticated()) { return false; }
        if (!Session.hasPermission('users.reactivate.allow')) { return false; }
        if (!ctrl.user.deleted) { return false; }

        var same = Session.hasPermission('users.reactivate.bypass.priority.admin');
        var lower = Session.hasPermission('users.reactivate.bypass.priority.mod');

        var valid = false;
        if (ctrl.pageOwner()) { valid = true; }
        else if (same) { valid = Session.getPriority() <= ctrl.user.priority; }
        else if (lower) { valid = Session.getPriority() < ctrl.user.priority; }
        return valid;
      };

      this.canDelete = function() {
        if (!Session.isAuthenticated()) { return false; }
        if (!Session.hasPermission('users.delete.allow')) { return false; }

        var same = Session.hasPermission('users.delete.bypass.priority.admin');
        var lower = Session.hasPermission('users.delete.bypass.priority.mod');

        var valid = false;
        if (ctrl.pageOwner()) { valid = true; }
        else if (same) { valid = Session.getPriority() <= this.user.priority; }
        else if (lower) { valid = Session.getPriority() < this.user.priority; }
        return valid;
      };

      this.canMessage = function() {
        var valid = false;
        if (!Session.isAuthenticated()) { return false; }
        if (!Session.hasPermission('conversations.create.allow')) { return false; }
        if (!ctrl.pageOwner()) { valid = true; }
        return valid;
      };

      // Edit Profile
      this.editProfile = false;
      this.editProfileUser = {};
      this.openEditProfile = function() {
        this.editProfileUser = angular.copy(this.user);
        this.editProfileUser.dob = new Date(this.editProfileUser.dob);
        delete this.editProfileUser.email;
        delete this.editProfileUser.raw_signature;
        delete this.editProfileUser.signature;
        delete this.editProfileUser.avatar;
        this.editProfile = true;
      };
      this.saveProfile = function() {
        User.update({ id: this.user.id }, this.editProfileUser).$promise
        .then(function(data) {
          // redirect page if username changed
          if (ctrl.user.username !== data.username) {
            if (this.pageOwner()) { Session.setUsername(ctrl.user.username); }
            var params = { username: ctrl.user.username};
            $state.go('profile.posts', params, { location: true, reload: false });
          }
          else {
            angular.extend(ctrl.user, data);
            ctrl.user.dob = data.dob;
          }
        })
        .then(function() { Alert.success('Successfully saved profile'); })
        .catch(function() { Alert.error('Profile could not be updated'); })
        .finally(function() { ctrl.editProfile = false; });
      };

      // Edit Avatar
      this.editAvatar = false;
      this.editAvatarUser = {};
      this.openEditAvatar = function() {
        this.editAvatarUser = {
          username: this.user.username,
          avatar: this.user.avatar
        };
        this.editAvatar = true;
      };
      this.saveAvatar = function() {
        User.update({ id: this.user.id }, this.editAvatarUser).$promise
        .then(function(data) {
          angular.extend(ctrl.user, data);
          if(ctrl.pageOwner()) { Session.setAvatar(ctrl.user.avatar); }
        })
        .then(function() { Alert.success('Successfully updated avatar'); })
        .catch(function() { Alert.error('Avatar could not be updated'); })
        .finally(function() { ctrl.editAvatar = false; });
      };

      // Edit Signature
      this.editSignature = false;
      this.editSigUser = {};
      this.openEditSignature = function() {
        this.editSigUser = {
          username: this.user.username,
          raw_signature: this.user.raw_signature || this.user.signature
        };
        this.editSignature = true;
      };
      this.saveSignature = function() {
        User.update({ id: this.user.id }, this.editSigUser).$promise
        .then(function(data) { angular.extend(ctrl.user, data); })
        .then(function() { Alert.success('Successfully updated signature'); })
        .catch(function() { Alert.error('Signature could not be updated'); })
        .finally(function() { ctrl.editSignature = false; });
      };

      // Edit Password
      this.editPassword = false;
      this.passData = {};
      this.openEditPassword = function() {
        this.passData = { username: this.user.username };
        this.editPassword = true;
      };
      this.savePassword = function() {
        User.update({ id: this.user.id }, this.passData).$promise
        .then(function() { ctrl.passData = {}; })
        .then(function() { Alert.success('Sucessfully changed account password'); })
        .catch(function() { Alert.error('Error updating password'); })
        .finally(function() { ctrl.editPassword = false; });
      };

      // Edit Email
      this.editEmail = false;
      this.emailData = {};
      this.openEditEmail = function() {
        this.emailData = {
          username: this.user.username,
          email: this.user.email
        };
        this.editEmail = true;
      };
      this.saveEmail = function() {
        User.update({ id: this.user.id }, this.emailData).$promise
        .then(function(data) { ctrl.user.email = data.email; })
        .then(function() { Alert.success('Sucessfully changed account email'); })
        .catch(function() { Alert.error('Invalid Credentials'); })
        .finally(function() { ctrl.editEmail = false; });
      };

      // Deactivate account
      this.deactivateUser = function() {
        User.deactivate({ id: ctrl.user.id }).$promise
        .then(function() { ctrl.user.deleted = true; })
        .then(function() { Alert.success('Account Deactivated.'); })
        .catch(function() { Alert.error('Error Deactivating Account'); })
        .finally(function() { ctrl.showDeactivate = false; });
      };

      // Reactivate account
      this.reactivateUser = function() {
        User.reactivate({ id: ctrl.user.id }).$promise
        .then(function() { ctrl.user.deleted = false; })
        .then(function() { Alert.success('Account Reactivated.'); })
        .catch(function() { Alert.error('Error Reactivating Account'); })
        .finally(function() { ctrl.showReactivate = false; });
      };

      // Delete account
      this.deleteUser = function() {
        User.delete({ id: ctrl.user.id }).$promise
        .then(function() { Alert.success('Account Deleted.'); })
        .catch(function() { Alert.error('Error Deleting Account'); })
        .finally(function() { ctrl.showDelete = false; });
      };

      // Create Conversation
      this.newConversation = {};
      this.showConvoModal = false;
      this.openConvoModal = function() {
        ctrl.newConversation = {};
        ctrl.showConvoModal = true;
      };
      this.createConversation = function() {
        // create a new conversation id to put this message under
        var newMessage = {
          receiver_id: ctrl.user.id,
          body: ctrl.newConversation.body,
        };

        Conversations.save(newMessage).$promise
        .then(function() { Alert.success('New Conversation Started!'); })
        .then(function() { $state.go('messages'); })
        .catch(function(err) {
          var msg = 'Failed to create conversation';
          if (err && err.status === 403) { msg = err.data.message; }
          Alert.error(msg);
        })
        .finally(function() { ctrl.showConvoModal = false; });
      };

      // Banning modal methods and vars
      this.boards = [];

      Boards.query({ stripped: true }).$promise
      .then(function(data) { ctrl.boards = data.boards; });

      // Banning Vars
      this.showManageBansModal = false; // manage ban modal visibility boolean
      this.banSubmitted = false; // form submitted bool
      this.selectedUser = null; //  model backing selected user
      this.confirmBanBtnLabel = 'Confirm'; // modal button label
      this.permanentBan = undefined; // boolean indicating if ban is permanent
      this.banUntil = null; // model backing temporary ban date
      this.boardBanList = []; // model backing list of banned boards
      this.showIpBan = true; // Boolean which hides/shows ip ban checkbox
      this.banUserIp = false; // Model backing ip ban checkbox
      this.modUser = Session.user;
      this.banPermission = Session.hasPermission('bans.privilegedBan');

      this.canBanUser = function() {
        var loggedIn = Session.isAuthenticated();
        var banPermission = Session.hasPermission('bans.privilegedBan');
        var banBoardsPermission = Session.hasPermission('bans.privilegedBanFromBoards');
        if (loggedIn && (banPermission || banBoardsPermission)) { return true; }
        else { return false; }
      };

      this.canGlobalBanUser = function() {
        var loggedIn = Session.isAuthenticated();
        var banPermission = Session.hasPermission('bans.privilegedBan');
        if (loggedIn && banPermission) { return true; }
        else { return false; }
      };

      this.canBoardBanUser = function(boardId) {
        var loggedIn = Session.isAuthenticated();
        if (!loggedIn) { return false; }
        var moderatingBoard = ctrl.modUser.moderating.indexOf(boardId) >= 0;
        var banAllBoardsPermission = Session.hasPermission('bans.privilegedBanFromBoards.all');
        if (moderatingBoard || banAllBoardsPermission) { return true; }
        else { return false; }
      };

      this.loadBoardBans = function(boardId) {
        var banAllBoardsPermission = Session.hasPermission('bans.privilegedBanFromBoards.all');
        if (banAllBoardsPermission && ctrl.allBoardIds.indexOf(boardId) < 0) {
          ctrl.allBoardIds.push(boardId);
        }
      };

      this.minDate = function() {
        var d = new Date();
        var month = '' + (d.getMonth() + 1);
        var day = '' + d.getDate();
        var year = d.getFullYear();
        if (month.length < 2) { month = '0' + month; }
        if (day.length < 2) { day = '0' + day; }
        return [year, month, day].join('-');
      };

      this.showManageBans = function(user) {
        ctrl.selectedUser = user;

        // Pre select Global ban type radio button if the user is banned
        if (user.ban_expiration) {
          var maxDate = new Date(8640000000000000);
          var banDate = new Date(user.ban_expiration);
          ctrl.permanentBan = banDate.getTime() === maxDate.getTime();
          if (ctrl.permanentBan) { ctrl.showIpBan = false; }
          ctrl.banUntil = ctrl.permanentBan ? undefined : banDate;
          ctrl.selectedUser.permanent_ban = ctrl.banUntil ? false : true;
        }

        // Lookup users board bans
        // TODO: make sure user has permissions before doing this
        Bans.getBannedBoards({ username: user.username }).$promise
        .then(function(bannedBoards) {
          // Names of boards the user is currently banned from
          ctrl.selectedUser.banned_board_names = bannedBoards.map(function(board) { return board.name; });
          // Model backing checklist tree of boards to ban user from
          ctrl.boardBanList = bannedBoards.map(function(board) { return board.id; });
          // Store bans that the user is currently banned from for diffing later
          ctrl.selectedUser.banned_board_ids = angular.copy(ctrl.boardBanList);
          ctrl.showManageBansModal = true;
        });
      };

      this.closeManageBans = function() {
        ctrl.selectedUser = null;
        ctrl.permanentBan = undefined;
        ctrl.banUntil = null;
        ctrl.boardBanList = [];
        ctrl.showIpBan = true;
        ctrl.banUserIp = false;
        // Fix for modal not opening after closing
        $timeout(function() { ctrl.showManageBansModal = false; });
      };

      this.allBoardIds = []; // populated by init of inputs

      this.uncheckModBoards = function() {
        var banBoardsPermission = Session.hasPermission('bans.privilegedBanFromBoards.all');
        if (banBoardsPermission) { ctrl.boardBanList = []; }
        else {
          ctrl.modUser.moderating.forEach(function(id) {
            var index = ctrl.boardBanList.indexOf(id);
            if (index > -1) { ctrl.boardBanList.splice(index, 1); }
          });
        }
      };

      this.checkModBoards = function() {
        var banBoardsPermission = Session.hasPermission('bans.privilegedBanFromBoards.all');
        if (banBoardsPermission) { ctrl.boardBanList = ctrl.allBoardIds; }
        else {
          ctrl.modUser.moderating.forEach(function(id) {
            var index = ctrl.boardBanList.indexOf(id);
            if (index < 0) { ctrl.boardBanList.push(id); }
          });
        }
      };

      this.toggleBoardBan = function(boardId) {
        var index = ctrl.boardBanList.indexOf(boardId);
        if (index > -1) { ctrl.boardBanList.splice(index, 1); }
        else { ctrl.boardBanList.push(boardId); }
      };

      this.updateBans = function() {
        ctrl.confirmBanBtnLabel = 'Loading...';
        ctrl.banSubmitted = true;
        // Used to update reports in table
        var results = { user_id: ctrl.selectedUser.id };
        // Used for updating global bans
        var globalBanParams = {
          user_id: ctrl.selectedUser.id,
          expiration: ctrl.permanentBan ? undefined : ctrl.banUntil,
          ip_ban: ctrl.permanentBan && ctrl.banUserIp ? true : undefined
        };
        // Used for updating banned boards
        var banBoardParams = {
          user_id: ctrl.selectedUser.id,
          board_ids: difference(ctrl.boardBanList, ctrl.selectedUser.banned_board_ids)
        };
        // Used for updating unbanned boards
        var unbanBoardParams = {
          user_id: ctrl.selectedUser.id,
          board_ids: difference(ctrl.selectedUser.banned_board_ids, ctrl.boardBanList)
        };

        // Ban diffing variables
        var newBanIsTemp = ctrl.permanentBan === false && ctrl.banUntil;
        var newBanIsPerm = ctrl.permanentBan;
        var newBanIsRemoved = ctrl.permanentBan === undefined;
        var oldBanIsTemp = ctrl.selectedUser.permanent_ban === false;
        var oldBanIsPerm = ctrl.selectedUser.permanent_ban;
        var userWasntBanned = ctrl.selectedUser.permanent_ban === undefined;

        // Check if user wasn't banned and is now banned, or the ban type changed
        var userBanned = (newBanIsTemp && (oldBanIsPerm || userWasntBanned)) || (newBanIsPerm && (oldBanIsTemp || userWasntBanned));
        // Check if user was banned previously and is now unbanned
        var userUnbanned = newBanIsRemoved && (oldBanIsTemp || oldBanIsPerm);

        var promises = [];
        // User is being banned globally either permanently or temporarily
        if (userBanned && ctrl.banPermission) {
          promises.push(Bans.ban(globalBanParams).$promise
            .then(function(banInfo) {
              Alert.success(ctrl.selectedUser.username + ' has been globally banned ' + (ctrl.permanentBan ? 'permanently' : ' until ' + $filter('humanDate')(ctrl.banUntil, true)));
              results = banInfo;
            })
            .catch(function(err) {
              results.banError = err;
              var msg = 'There was an error globally banning ' + ctrl.selectedUser.username;
              if (err.status === 403) { msg = ctrl.selectedUser.username + ' has higher permissions than you, cannot globally ban'; }
              Alert.error(msg);
            })
          );
        }
        // User is being unbanned globally, ensure user is currently banned
        else if (userUnbanned && ctrl.banPermission) {
          promises.push(Bans.unban(globalBanParams).$promise
            .then(function(unbanInfo) {
              Alert.success(ctrl.selectedUser.username + ' has been globally unbanned');
              results = unbanInfo;
            })
            .catch(function(err) {
              results.banError = err;
              var msg = 'There was an error globally unbanning ' + ctrl.selectedUser.username;
              if (err.status === 403) { msg = ctrl.selectedUser.username + ' has higher permissions, cannot globally unban'; }
              Alert.error(msg);
            })
          );
        }
        // User is being banned from new boards
        if (banBoardParams.board_ids.length) {
          promises.push(Bans.banFromBoards(banBoardParams).$promise
            .then(function() {
              Alert.success(ctrl.selectedUser.username + ' has been banned from boards');
            })
            .catch(function(err) {
              results.boardBanError = err;
              var msg = 'There was an error banning ' + ctrl.selectedUser.username + ' from boards';
              if (err.status === 403) { msg = ctrl.selectedUser.username + ' has higher permissions, cannot ban from boards'; }
              Alert.error(msg);
            })
          );
        }
        // User is being unbanned from boards
        if (unbanBoardParams.board_ids.length) {
          promises.push(Bans.unbanFromBoards(unbanBoardParams).$promise
            .then(function() {
              Alert.success(ctrl.selectedUser.username + ' has been unbanned from boards');
            })
            .catch(function(err) {
              results.boardBanError = err;
              var msg = 'There was an error unbanning ' + ctrl.selectedUser.username + ' from boards';
              if (err.status === 403) { msg = ctrl.selectedUser.username + ' has higher permissions, cannot unban from boards'; }
              Alert.error(msg);
            })
          );
        }

        $q.all(promises)
        .then(function() {
          if (ctrl.banPermission) {
            ctrl.user.ban_expiration = new Date(results.expiration) > new Date() ? results.expiration : undefined;
          }
        })
        .finally(function() {
          ctrl.closeManageBans();
          $timeout(function() { // wait for modal to close
            ctrl.confirmBanBtnLabel = 'Confirm';
            ctrl.banSubmitted = false;
          }, 500);
        });
      };

      this.isOnline = false;
      Websocket.isOnline(Session.user.id, function(err, data) {
        if (err) { return console.log(err); }
        else { ctrl.isOnline = data; }
      });
    }]
  };
}];

module.exports = angular.module('ept.directives.profile', [])
.directive('profile', directive);
