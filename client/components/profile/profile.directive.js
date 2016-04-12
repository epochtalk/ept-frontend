module.exports = ['User', 'Session', 'Alert', '$filter', '$state',
function(User, Session, Alert, $filter, $state) {
  return {
    restrict: 'E',
    scope: true,
    bindToController: { user: '=' },
    template: require('./profile.html'),
    controllerAs: 'vm',
    controller: [function() {
      var ctrl = this;

      // Check if user is banned
      this.ban_expiration = function() {
        var result;
        var expiration = this.user.ban_expiration;
        var canBan = Session.hasPermission('adminUsers.privilegedBan');

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

      this.canUpdatePassword = function() { return ctrl.canUpdate() && ctrl.pageOwner(); };

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

      // Edit Profile
      this.editProfile = false;
      this.editProfileUser = {};
      this.openEditProfile = function() {
        this.editProfileUser = angular.copy(this.user);
        this.editProfile = true;
      };
      this.saveProfile = function() {
        User.update({ id: this.user.id }, this.editProfileUser).$promise
        .then(function(data) {
          // redirect page if username changed
          if (ctrl.user.username !== data.username) {
            if (this.pageOwner()) { Session.setUsername(ctrl.user.username); }
            var params = { username: ctrl.user.username};
            $state.go('profile', params, { location: true, reload: false });
          }
          else { angular.extend(ctrl.user, data); }
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
    }]
  };
}];