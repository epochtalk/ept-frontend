var directive = ['$parse', function($parse) {
  return {
    require: 'ngModel',
    link: function(scope, element, attr, ngModel) {
      scope.$watch(attr.ngModel, function(value) {

        var ipRegex = new RegExp(/(^\s*((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?))\s*$)/);

        var hostRegex = new RegExp(/(^\s*((?=.{1,255}$)[0-9A-Za-z\*](?:(?:[0-9A-Za-z\*]|\b-){0,61}[0-9A-Za-z\*])?(?:\.[0-9A-Za-z\*](?:(?:[0-9A-Za-z\*]|\b-){0,61}[0-9A-Za-z\*])?)*\.?)\s*$)/);

        function validAddress(val) {
          val = val ? val.trim() : val;
          var parent = $parse(attr.addressValidator)(scope);
          if (val && ipRegex.test(val)) {
            parent.ip = val;
            delete parent.hostname;
            return true;
          }
          else if (val && hostRegex.test(val)) {
            // replace * wildcard with % db wildcard
            parent.hostname = val.replace(new RegExp('\\*', 'g'), '%');
            delete parent.ip;
            return true;
          }
          else {
            delete parent.hostname;
            delete parent.ip;
            return !val; // blank is valid
          }
        }

        // Set validity of model depending on return state of validAddress
        ngModel.$setValidity(attr.ngModel, validAddress(value));
      });
    }
  };
}];

module.exports = angular.module('ept.directives.address-validator', [])
.directive('addressValidator', directive);
