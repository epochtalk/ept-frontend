var ctrl = ['$rootScope', '$scope', '$anchorScroll','$location', '$timeout', '$stateParams', 'Auth', 'Alert', 'pageData',
  function($rootScope, $scope, $anchorScroll, $location, $timeout, $stateParams, Auth, Alert, pageData) {
    var ctrl = this;
    this.posts = pageData.posts;
    this.count = pageData.count;
    this.page = pageData.page;
    this.limit = pageData.limit;
    this.field = pageData.field;
    this.desc = pageData.desc;
    this.pageCount = pageData.page_count;
    this.search = pageData.search;
    this.queryParams = $location.search();
    this.searchStr = pageData.search;

    this.searchPosts = function() {
      if (!ctrl.searchStr.length) {
        ctrl.clearSearch();
        return;
      }
      ctrl.queryParams = { search: ctrl.searchStr };
      $location.search(ctrl.queryParams);
    };

    this.clearSearch = function() {
      ctrl.queryParams = {};
      $location.search(ctrl.queryParams);
      ctrl.searchStr = null;
    };

    this.avatarHighlight = function(color) {
      var style = {};
      if (color) { style.border = '0.225rem solid ' + color; }
      return style;
    };

    this.usernameHighlight = function(color) {
      var style = {};
      if (color) {
        style.background = color;
        style.padding = '0 0.3rem';
        style.color = '#ffffff';
      }
      return style;
    };

    $timeout($anchorScroll);

    this.offLCS = $rootScope.$on('$locationChangeSuccess', function() {
      var params = $location.search();
      var page = Number(params.page) || 1;
      var limit = Number(params.limit) || 15;
      var field = params.field;
      var search = params.search;
      var descending = params.desc === 'true';
      var pageChanged = false;
      var limitChanged = false;
      var fieldChanged = false;
      var descChanged = false;
      var searchChanged = false;

      if (page && page !== ctrl.page) {
        pageChanged = true;
        ctrl.page = page;
      }
      if (limit && limit !== ctrl.limit) {
        limitChanged = true;
        ctrl.limit = limit;
      }
      if (field && field !== ctrl.field) {
        fieldChanged = true;
        ctrl.field = field;
      }
      if (descending !== ctrl.desc) {
        descChanged = true;
        ctrl.desc = descending;
      }
      if ((search === undefined || search) && search !== ctrl.search) {
        searchChanged = true;
        ctrl.search = search;
        ctrl.searchStr = search;
      }
      // if(pageChanged || limitChanged || fieldChanged || descChanged || searchChanged) { ctrl.pullPage(); }
    });
    $scope.$on('$destroy', function() { ctrl.offLCS(); });

    this.pullPage = function() {
      var query = {
        page: ctrl.page,
        limit: ctrl.limit,
        desc: ctrl.desc,
        field: ctrl.field,
        search: ctrl.search
      };

      // // replace current users with new users
      // User.pagePublic(query).$promise
      // .then(function(updatedData) {
      //   ctrl.posts = updatedData.users;
      //   ctrl.count = updatedData.count;
      //   ctrl.page = updatedData.page;
      //   ctrl.limit = updatedData.limit;
      //   ctrl.field = updatedData.field;
      //   ctrl.desc = updatedData.desc;
      //   ctrl.search = updatedData.search;
      //   ctrl.pageCount = updatedData.page_count;
      //   $timeout($anchorScroll);
      // });
    };

  }
];

module.exports = angular.module('ept.postsearch.ctrl', [])
.controller('PostSearchCtrl', ctrl)
.name;
