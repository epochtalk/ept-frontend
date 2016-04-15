var route = ['$stateProvider', function($stateProvider) {
  $stateProvider.state('messages', {
    url: '/messages',
    parent: 'public-layout',
    views: {
      'content': {
        controller: 'MessagesCtrl',
        controllerAs: 'MessagesCtrl',
        templateUrl: '/static/templates/messages/messages.html'
      }
    },
    resolve: {
      $title: function() { return 'Private Messages'; },
      loadCtrl: ['$q', '$ocLazyLoad', function($q, $ocLazyLoad) {
        var deferred = $q.defer();
        require.ensure([], function() {
          require('./messages.controller');
          $ocLazyLoad.load({ name: 'ept.messages.ctrl' });
          $ocLazyLoad.load({ name: 'ept.directives.autocomplete-user-id' });
          deferred.resolve();
        });
        return deferred.promise;
      }],
      pageData: ['Session', 'Alert', 'Messages', '$q', function(Session, Alert, Messages, $q) {
        if (Session.isAuthenticated && Session.hasPermission('messages.latest.allow')) {
          return Messages.latest().$promise;
        }
        else {
          Alert.error('You do not have access to this page.');
          return $q.reject('NoPageChange');
        }
      }]
    }
  });
}];

module.exports = angular.module('ept.messages', ['ui.router'])
.config(route)
.name;
