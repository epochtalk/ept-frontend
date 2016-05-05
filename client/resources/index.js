require('./admin');

angular.module('ept')
  .factory('Breadcrumbs', require('./breadcrumbs.js'))
  .factory('Categories', require('./categories.js'))
  .factory('Reports', require('./reports.js'))
  .factory('Messages', require('./messages.js'))
  .factory('Conversations', require('./conversations.js'))
  .factory('Watchlist', require('./watchlist.js'))
  .factory('Bans', require('./bans.js'))
  .factory('UserNotes', require('./user-notes.js'))
  .factory('Notifications', require('./notifications.js'));
