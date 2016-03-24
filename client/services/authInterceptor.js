'use strict';
/* jslint node: true */

module.exports = ['$q', '$window', 'Session',
  function ($q, $window, Session) {
  return {
    request: function (config) {
      config.headers = config.headers || {};
      var token = Session.getToken();
      if (token) { config.headers.Authorization = 'Bearer ' + token; }
      return config;
    },
    responseError: function(rejection) {
      if (rejection.status === 401) { Session.clearUser(); }
      return $q.reject(rejection);
    }
  };
}];
