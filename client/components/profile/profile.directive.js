var directive = ['Conversations', 'User', 'Session', 'Alert', '$filter', '$state',
function(Conversations, User, Session, Alert, $filter, $state) {
  return {
    restrict: 'E',
    scope: true,
    bindToController: { user: '=' },
    template: require('./profile.html'),
    controllerAs: 'vm',
    controller: [function() {
      var ctrl = this;

      this.isLoggedIn = function() { return Session.isAuthenticated() };

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
    }]
  };
}];

module.exports = angular.module('ept.directives.profile', [])
.directive('profile', directive);
