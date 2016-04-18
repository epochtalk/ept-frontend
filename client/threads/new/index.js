var route = ['$stateProvider', function($stateProvider) {
  $stateProvider.state('newThread', {
    url: '/boards/{boardId}/threads/new',
    parent: 'public-layout',
    views: {
      'content': {
        controller: 'NewThreadCtrl',
        controllerAs: 'NewThreadCtrl',
        templateUrl: '/static/templates/threads/new/new.html'
      }
    },
    resolve: {
      $title: function() { return 'Create New Thread'; },
      loadCtrl: ['$q', '$ocLazyLoad', function($q, $ocLazyLoad) {
        var deferred = $q.defer();
        require.ensure([], function() {
          require('./new.controller');
          $ocLazyLoad.load([
            { name: 'ept.newThread.ctrl' },
            { name: 'ept.directives.poll-creator' },
            { name: 'ept.directives.epochtalk-editor' }
          ]);
          deferred.resolve();
        });
        return deferred.promise;
      }]
    }
  });
}];

module.exports = angular.module('ept.newThread', ['ui.router'])
.config(route)
.name;
