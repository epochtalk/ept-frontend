'use strict';
/* jslint node: true */

module.exports = ['Session', '$state', '$filter', function(Session, $state, $filter) {
  var message;
  return {
    update: function() {
      var banExpiration = Session.user.ban_expiration;
      var boardBanned = $state.$current.locals.globals.$boardBanned;
      // Clears ban message assuming the ban isn't global
      if (!boardBanned && !banExpiration) { message = undefined; }
      // Sets board ban message, ignored if global ban is set
      else if (boardBanned && !banExpiration && !message) {
        message = 'Read Only Access &mdash; You have been banned from this board';
      }
      // Sets global ban message if not already set
      else if (banExpiration && !message) {
        var expirationStr = $filter('humanDate')(banExpiration, true);
        message = 'You have been banned ' +
          (expirationStr === 'Permanent' ?
          'Permanently' :
          'until ' + expirationStr);
      }
      return message;
    },
    isBanned: function() { return message; },
    banStatus: function() {
      var status = {
        boards: [],
        global: Session.user.ban_expiration ? true : false
      };
      // TODO: this array should contain a list of banned boards in the future
      if ($state.$current.locals.globals.$boardBanned) { status.boards.push(true); }
      return status;
    }
  };
}];
