var ctrl = ['$rootScope', '$scope', '$location', '$timeout', '$anchorScroll', 'Session', 'Alert', 'AdminBans', 'bannedAddresses', function($rootScope, $scope, $location, $timeout, $anchorScroll, Session, Alert, AdminBans, bannedAddresses) {
  var ctrl = this;
  this.parent = $scope.$parent.AdminManagementCtrl;
  this.parent.tab = 'bannedAddresses';

  this.search = bannedAddresses.search;
  this.searchStr = bannedAddresses.search;
  this.page = bannedAddresses.page;
  this.limit = bannedAddresses.limit;
  this.field = bannedAddresses.field;
  this.desc = bannedAddresses.desc;
  this.next = bannedAddresses.next;
  this.prev = bannedAddresses.prev;
  this.addresses = bannedAddresses.data;

  this.setSortField = function(sortField) {
    // Sort Field hasn't changed just toggle desc
    var unchanged = sortField === ctrl.field || (sortField === 'created_at' && !ctrl.field);
    if (unchanged) { ctrl.desc = ctrl.desc.toString() === 'true' ? 'false' : 'true'; } // bool to str
    // Sort Field changed default to ascending order
    else { ctrl.desc = 'false'; }
    ctrl.field = sortField;
    ctrl.page = 1;
    $location.search('page', ctrl.page);
    $location.search('desc', ctrl.desc);
    $location.search('field', sortField);
  };

  this.getSortClass = function(sortField) {
    var sortClass;
    var sortDesc = ctrl.desc.toString() === 'true'; // str to bool
    if (sortField === 'created_at' && !ctrl.field && sortDesc) {
      sortClass = 'fa fa-sort-desc';
    }
    else if (ctrl.field === sortField && sortDesc) {
      sortClass = 'fa fa-sort-desc';
    }
    else if (ctrl.field === sortField && !sortDesc) {
      sortClass = 'fa fa-sort-asc';
    }
    else { sortClass = 'fa fa-sort'; }
    return sortClass;
  };

  this.searchAddresses = function() {
    if (!ctrl.searchStr || !ctrl.searchStr.length) {
      ctrl.clearSearch();
      return;
    }
    $location.search({
      search: ctrl.searchStr || undefined,
      page: undefined
    });
  };

  this.clearSearch = function() {
    $location.search('search', undefined);
    ctrl.searchStr = null;
  };

  $timeout($anchorScroll);

  this.offLCS = $rootScope.$on('$locationChangeSuccess', function() {
    var params = $location.search();
    var page = Number(params.page) || 1;
    var limit = Number(params.limit) || 25;
    var field = params.field;
    var descending = params.desc === 'true' || params.desc === undefined;
    var search = params.search;

    var pageChanged = false;
    var limitChanged = false;
    var fieldChanged = false;
    var descChanged = false;
    var searchChanged = false;

    if ((page === undefined || page) && page !== ctrl.page) {
      pageChanged = true;
      ctrl.page = page;
    }
    if ((limit === undefined || limit) && limit !== ctrl.limit) {
      limitChanged = true;
      ctrl.limit = limit;
    }
    if ((field === undefined || field) && field !== ctrl.field) {
      fieldChanged = true;
      ctrl.field = field;
    }
    if (descending !== ctrl.desc) {
      descChanged = true;
      ctrl.desc = descending.toString();
    }
    if ((search === undefined || search) && search !== ctrl.search) {
      searchChanged = true;
      ctrl.search = search;
    }
    if(pageChanged || limitChanged || fieldChanged || descChanged || searchChanged) { ctrl.pullPage(); }
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

    // replace current users with new users
    AdminBans.pageBannedAddresses(query).$promise
    .then(function(updatedAddresses) {
      ctrl.addresses = updatedAddresses.data;
      ctrl.page = updatedAddresses.page;
      ctrl.limit = updatedAddresses.limit;
      ctrl.field = updatedAddresses.field;
      ctrl.desc = updatedAddresses.desc;
      ctrl.next = updatedAddresses.next;
      ctrl.prev = updatedAddresses.prev;
      ctrl.search = updatedAddresses.search;
      $timeout($anchorScroll);
    });
  };
}];

module.exports = angular.module('ept.admin.management.bannedAddresses.ctrl', [])
.controller('BannedAddressesCtrl', ctrl)
.name;
