module.exports = ['$stateProvider', '$urlRouterProvider', function($stateProvider, $urlRouterProvider) {
  // Checks if a user is a admin
  var adminCheck = function(route) {
    return ['$q', 'Session', function($q, Session) {
      if (!Session.isAuthenticated()) {  return $q.reject({ status: 401, statusText: 'Unauthorized' }); }
      if (route && Session.hasPermission('adminAccess' + '.' + route)) { return true; }
      else if (!route && Session.hasPermission('adminAccess')) { return true; }
      else { return $q.reject({ status: 403, statusText: 'Forbidden' }); }
    }];
  };

  var adminManagementRedirect = ['$state', 'Session', function($state, Session) {
    if (Session.hasPermission('adminAccess.management.boards')) { $state.go('admin-management.boards'); }
    else if (Session.hasPermission('adminAccess.management.users')) { $state.go('admin-management.users'); }
    else if (Session.hasPermission('adminAccess.management.roles')) { $state.go('admin-management.roles'); }
    else if (Session.hasPermission('adminAccess.management.bannedAddresses')) { $state.go('admin-management.banned-addresses'); }
    else { $state.go('admin'); }
  }];

  // Default child state for admin-management is users
  $urlRouterProvider.when('/admin/management', adminManagementRedirect);
  $urlRouterProvider.when('/admin/management/', adminManagementRedirect);

  $stateProvider.state('admin-management', {
    url: '/admin/management',
    reloadOnSearch: false,
    parent: 'admin-layout',
    views: {
      'content': {
        controller: ['Session', function(Session) {
          this.hasPermission = Session.hasPermission;
          this.tab = null;
          if (Session.hasPermission('adminAccess.management.boards')) { this.tab = 'boards'; }
          else if (Session.hasPermission('adminAccess.management.users')) { this.tab = 'users'; }
          else if (Session.hasPermission('adminAccess.management.roles')) { this.tab = 'roles'; }
        }],
        controllerAs: 'AdminManagementCtrl',
        templateUrl: '/static/templates/admin/management/index.html'
      }
    },
    resolve: { userAccess: adminCheck('management') }
  })
  .state('admin-management.boards', {
    url: '/boards?saved',
    views: {
      'data@admin-management': {
        controller: 'CategoriesCtrl',
        controllerAs: 'AdminManagementCtrl',
        templateUrl: '/static/templates/admin/management/boards.html'
      }
    },
    resolve: {
      userAccess: adminCheck('management.boards'),
      $title: function() { return 'Board Management'; },
      catEditor: ['$q', '$ocLazyLoad', function($q, $ocLazyLoad) {
        var deferred = $q.defer();
        require.ensure([], function() {
          var dir = require('../../components/category_editor/category-editor.directive');
          $ocLazyLoad.load({ name: 'ept.directives.category-editor'});
          deferred.resolve(dir);
        });
        return deferred.promise;
      }],
      nestBoards: ['$q', '$ocLazyLoad', function($q, $ocLazyLoad) {
        var deferred = $q.defer();
        require.ensure([], function() {
          var dir = require('../../components/category_editor/nestable-boards.directive');
          $ocLazyLoad.load({ name: 'ept.directives.nestable-boards'});
          deferred.resolve(dir);
        });
        return deferred.promise;
      }],
      nestCats: ['$q', '$ocLazyLoad', function($q, $ocLazyLoad) {
        var deferred = $q.defer();
        require.ensure([], function() {
          var dir = require('../../components/category_editor/nestable-categories.directive');
          $ocLazyLoad.load({ name: 'ept.directives.nestable-categories'});
          deferred.resolve(dir);
        });
        return deferred.promise;
      }],
      loadCtrl: ['$q', '$ocLazyLoad', function($q, $ocLazyLoad) {
        var deferred = $q.defer();
        require.ensure([], function() {
          var ctrl = require('./boards.controller');
          $ocLazyLoad.load({ name: 'ept.admin.management.boards.ctrl' });
          deferred.resolve(ctrl);
        });
        return deferred.promise;
      }],
      roleData: ['AdminRoles', function(AdminRoles) { return AdminRoles.all().$promise; }],
      categories: ['AdminBoards', function(AdminBoards) { return AdminBoards.categories().$promise; }],
      boards: ['AdminBoards', function(AdminBoards) { return AdminBoards.boards().$promise; }]
    }
  })
  .state('admin-management.users', {
    url: '/users?page&limit&field&desc&filter&search',
    reloadOnSearch: false,
    views: {
      'data@admin-management': {
        controller: 'UsersCtrl',
        controllerAs: 'AdminManagementCtrl',
        templateUrl: '/static/templates/admin/management/users.html'
      }
    },
    resolve: {
      userAccess: adminCheck('management.users'),
      $title: function() { return 'User Management'; },
      loadCtrl: ['$q', '$ocLazyLoad', function($q, $ocLazyLoad) {
        var deferred = $q.defer();
        require.ensure([], function() {
          var ctrl = require('./users.controller');
          $ocLazyLoad.load({ name: 'ept.admin.management.users.ctrl' });
          deferred.resolve(ctrl);
        });
        return deferred.promise;
      }],
      users: ['AdminUsers', '$stateParams', function(AdminUsers, $stateParams) {
        var query = {
          field: $stateParams.field,
          desc: $stateParams.desc,
          limit: Number($stateParams.limit) || 15,
          page: Number($stateParams.page) || 1,
          filter: $stateParams.filter,
          search: $stateParams.search
        };
        return AdminUsers.page(query).$promise;
      }],
      usersCount: ['AdminUsers', '$stateParams', function(AdminUsers, $stateParams) {
        var opts;
        var filter = $stateParams.filter;
        var search = $stateParams.search;
        if (filter || search) {
          opts = {
            filter: filter,
            search: search
          };
        }
        return AdminUsers.count(opts).$promise
        .then(function(usersCount) { return usersCount.count; });
      }],
      field: ['$stateParams', function($stateParams) {
        return $stateParams.field;
      }],
      desc: ['$stateParams', function($stateParams) {
        return $stateParams.desc || false;
      }],
      page: ['$stateParams', function($stateParams) {
        return Number($stateParams.page) || 1;
      }],
      limit: ['$stateParams', function($stateParams) {
        return Number($stateParams.limit) || 15;
      }],
      filter: ['$stateParams', function($stateParams) {
        return $stateParams.filter;
      }],
      search: ['$stateParams', function($stateParams) {
        return $stateParams.search;
      }]
    }
  })
  .state('admin-management.roles', {
    url: '/roles?roleId&page&field&desc&limit&search',
    reloadOnSearch: false,
    views: {
      'data@admin-management': {
        controller: 'RolesCtrl',
        controllerAs: 'AdminManagementCtrl',
        templateUrl: '/static/templates/admin/management/roles.html'
      }
    },
    resolve: {
      userAccess: adminCheck('management.roles'),
      $title: function() { return 'Roles Management'; },
      loadCtrl: ['$q', '$ocLazyLoad', function($q, $ocLazyLoad) {
        var deferred = $q.defer();
        require.ensure([], function() {
          var ctrl = require('./roles.controller');
          $ocLazyLoad.load({ name: 'ept.admin.management.roles.ctrl' });
          deferred.resolve(ctrl);
        });
        return deferred.promise;
      }],
      pageData: ['AdminRoles', function(AdminRoles) {
        return AdminRoles.all().$promise
        .then(function(pageData) { return pageData; });
      }],
      page: ['$stateParams', function($stateParams) {
        return Number($stateParams.page) || 1;
      }],
      limit: ['$stateParams', function($stateParams) {
        return Number($stateParams.limit) || 15;
      }],
      roleId: ['$stateParams', function($stateParams) {
        return $stateParams.roleId;
      }],
      search: ['$stateParams', function($stateParams) {
        return $stateParams.search;
      }],
      userData: ['AdminRoles', '$stateParams', function(AdminRoles, $stateParams) {
        var query = {
          id: $stateParams.roleId,
          page: Number($stateParams.page) || 1,
          limit: Number($stateParams.limit) || 15,
          search: $stateParams.search
        };
        return AdminRoles.users(query).$promise
        .then(function(userData) { return userData; });
      }]
    }
  })
  .state('admin-management.banned-addresses', {
    url: '/bannedaddresses?page&limit&field&desc&search',
    reloadOnSearch: false,
    views: {
      'data@admin-management': {
        controller: 'BannedAddressesCtrl',
        controllerAs: 'AdminManagementCtrl',
        templateUrl: '/static/templates/admin/management/banned-addresses.html'
      }
    },
    resolve: {
      userAccess: adminCheck('management.bannedAddresses'),
      $title: function() { return 'Banned Addresses Management'; },
      addresValidator: ['$q', '$ocLazyLoad', function ($q, $ocLazyLoad) {
        var deferred = $q.defer();
        require.ensure([], function() {
          var dir = require('../../components/address_validator/address-validator.directive');
          $ocLazyLoad.load({ name: 'ept.directives.address-validator'});
          deferred.resolve(dir);
        });
        return deferred.promise;
      }],
      loadCtrl: ['$q', '$ocLazyLoad', function($q, $ocLazyLoad) {
        var deferred = $q.defer();
        require.ensure([], function() {
          var ctrl = require('./banned-addresses.controller');
          $ocLazyLoad.load({ name: 'ept.admin.management.bannedAddresses.ctrl' });
          deferred.resolve(ctrl);
        });
        return deferred.promise;
      }],
      bannedAddresses: ['AdminBans', '$stateParams', function(AdminBans, $stateParams) {
        var query = {
          field: $stateParams.field,
          desc: $stateParams.desc,
          limit: Number($stateParams.limit) || 25,
          page: Number($stateParams.page) || 1,
          search: $stateParams.search
        };
        return AdminBans.pageBannedAddresses(query).$promise;
      }]
    }
  });
}];
