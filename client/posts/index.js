var route = ['$stateProvider', function($stateProvider) {
  $stateProvider.state('posts', {
    parent: 'public-layout',
    reloadOnSearch: false,
    views: {
      'content': {
        controller: 'PostsParentCtrl',
        controllerAs: 'PostsParentCtrl',
        templateUrl: '/static/templates/posts/posts.html'
      }
    }
  })
  .state('posts.data', {
    url: '/threads/{threadId}/posts?limit&page&start',
    reloadOnSearch: false,
    views: {
      'data@posts': {
        controller: 'PostsCtrl',
        controllerAs: 'PostsCtrl',
        templateUrl: '/static/templates/posts/posts.data.html'
      }
    },
    resolve: {
      $title: ['pageData', function(pageData) { return pageData.thread.title; }],
      $boardBanned: ['pageData', function(pageData) { return pageData.bannedFromBoard; }],
      loadCtrl: ['$q', '$ocLazyLoad', function($q, $ocLazyLoad) {
        var deferred = $q.defer();
        require.ensure([], function() {
          require('./posts.controller');
          $ocLazyLoad.load({ name: 'ept.posts.ctrl' });
          deferred.resolve();
        });
        return deferred.promise;
      }],
      loadParentCtrl: ['$q', '$ocLazyLoad', function($q, $ocLazyLoad) {
        var deferred = $q.defer();
        require.ensure([], function() {
          require('./parent.controller');
          $ocLazyLoad.load([
            { name: 'ept.posts.parentCtrl' },
            { name: 'ept.directives.poll-creator'},
            { name: 'ept.directives.poll-viewer'},
            { name: 'ept.directives.epochtalk-editor' },
            { name: 'ept.directives.image-uploader' },
            { name: 'ept.directives.resizeable' }
          ]);
          deferred.resolve();
        });
        return deferred.promise;
      }],
      pageData: ['Posts', 'Threads', 'PreferencesSvc', '$stateParams', function(Posts, Threads, PreferencesSvc, $stateParams) {
        var pref = PreferencesSvc.preferences;
        var query = {
          thread_id: $stateParams.threadId,
          page: $stateParams.page,
          limit: $stateParams.limit || pref.posts_per_page || 25,
          start: $stateParams.start
        };
        Threads.viewed({ id: $stateParams.threadId });
        return Posts.byThread(query).$promise;
      }]
    }
  })
  .state('search-posts', {
    url: '/search/posts?search&page&limit',
    parent: 'public-layout',
    reloadOnSearch: false,
    views: {
      'content': {
        controller: 'PostSearchCtrl',
        controllerAs: 'PostSearchCtrl',
        templateUrl: '/static/templates/posts/search.html'
      }
    },
    resolve: {
      $title: [function() { return 'Search Posts'; }],
      loadCtrl: ['$q', '$ocLazyLoad', function($q, $ocLazyLoad) {
        var deferred = $q.defer();
        require.ensure([], function() {
          require('./search.controller');
          $ocLazyLoad.load({ name: 'ept.postsearch.ctrl' });
          deferred.resolve();
        });
        return deferred.promise;
      }],
      pageData: ['$stateParams', function($stateParams) {
        return {
          posts: [
            {
              'id':'AAAAAAAAAAAAAAAAEFY5ZA',
              'position':9,
              'thread_id':'AAAAAAAAAAAAAAAAAJZZVw',
              'board_id':'AAAAAAAAAAAAAAAAAAAABg',
              'board_name': 'Development & Technical Discussion',
              'thread_title':'An easy way to remember a bitcoin address',
              'title':'Re: An easy way to remember a bitcoin address',
              'body':'i think someone should start a service where someone can store their bitcoin address online and get a personalized short link that they can open anywhere and get the address they stored there',
              'raw_body':null,
              'locked':false,
              'created_at':'2015-02-24T08:53:53.000Z',
              'updated_at':'1970-01-01T00:00:00.000Z',
              'imported_at':'2015-03-18T13:37:53.774Z',
              'reported':false,
              'avatar':null,
              'user':{
                'id':'AAAAAAAAAAAAAAAAAAJaMw',
                'name':null,
                'username':'JessicaSe',
                'priority':null,
                'signature':null,
                'highlight_color':null,
                'role_name':null,
                'activity':0,
                'stats':{
                  'score':0,
                  'neg':0,
                  'pos':0
                }
              }
            },
            {
              'id':'AAAAAAAAAAAAAAAAEGFpCA',
              'position':33,
              'thread_id':'AAAAAAAAAAAAAAAAAJZZVw',
              'board_id':'AAAAAAAAAAAAAAAAAAAABg',
              'board_name': 'Development & Technical Discussion',
              'thread_title':'An easy way to remember a bitcoin address',
              'title':'Re: An easy way to remember a bitcoin address',
              'body':'Nobody has discussed that this proposal is anglocentric. I speak Spanish, and it\'s as hard for me to learn “car yellow what” than “1hshbx”.',
              'raw_body':null,
              'locked':false,
              'created_at':'2015-03-01T03:19:45.000Z',
              'updated_at':'1970-01-01T00:00:00.000Z',
              'imported_at':'2015-03-18T14:06:35.915Z',
              'reported':false,
              'avatar':null,
              'user':{
                'id':'AAAAAAAAAAAAAAAAAAFvQg',
                'name':null,
                'username':'R2D221',
                'priority':null,
                'signature':null,
                'highlight_color':null,
                'role_name':null,
                'activity':0,
                'stats':{
                  'score':0,
                  'neg':0,
                  'pos':0
                }
              }
            },
            {
              'id':'AAAAAAAAAAAAAAAAEGlkYQ',
              'position':6,
              'thread_id':'AAAAAAAAAAAAAAAAAJgJcA',
              'board_id':'AAAAAAAAAAAAAAAAAAAABA',
              'board_name': 'Technical Support',
              'thread_title':'Need analysis on possible hack',
              'title':'Re: Need analysis on possible hack',
              'body':'Where did you use the internet when you got funds or the such? If it was in a public place there is a chance someone may have been sniffing it (I think that is correct terminology ahah) and seen your address and login info there.',
              'raw_body':null,
              'locked':false,
              'created_at':'2015-03-08T00:54:31.000Z',
              'updated_at':'1970-01-01T00:00:00.000Z',
              'imported_at':'2015-03-18T14:53:36.568Z',
              'reported':false,
              'avatar':null,
              'user':{
                'id':'AAAAAAAAAAAAAAAAAADj1A',
                'name':null,
                'username':'Monetizer',
                'priority':null,
                'signature':null,
                'highlight_color':null,
                'role_name':null,
                'activity':0,
                'stats':{
                  'score':0,
                  'neg':0,
                  'pos':0
                }
              }
            },
            {
              'id':'AAAAAAAAAAAAAAAACUUUNg',
              'position':8,
              'thread_id':'AAAAAAAAAAAAAAAAAIRDNg',
              'board_id':'AAAAAAAAAAAAAAAAAAABZw',
              'board_name': 'New Forum Software',
              'thread_title':'Will the new forum allow upload of avatars?',
              'title':'Re: Will the new forum allow upload of avatars?',
              'body':'I think it should be different sizes for each rank and the only legendary members should be able to upload custom ones any other people should only be able to pick ones out of a list.....maybe people with existing custom avatars keep them though.',
              'raw_body':null,
              'locked':false,
              'created_at':'2014-11-05T23:58:48.000Z',
              'updated_at':'1970-01-01T00:00:00.000Z',
              'imported_at':'2015-03-18T03:34:35.368Z',
              'reported':false,
              'avatar':null,
              'user':{
                'id':'AAAAAAAAAAAAAAAAAAX6Pw',
                'name':null,
                'username':'SuperDex',
                'priority':null,
                'signature':null,
                'highlight_color':null,
                'role_name':null,
                'activity':0,
                'stats':{
                  'score':0,
                  'neg':0,
                  'pos':0
                }
              }
            }
          ],
          count: 4,
          page: 1,
          limit: 15,
          page_count: 1,
          search: $stateParams.search
        };
      }]
    }
  });
}];

module.exports = angular.module('ept.posts', ['ui.router'])
.config(route)
.name;
