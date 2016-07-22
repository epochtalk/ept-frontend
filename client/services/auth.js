module.exports = ['User', 'Session', '$rootScope',
  function(User, Session, $rootScope) {
    // Service API
    var serviceAPI = {
      register: function(user) {
        return User.register(user).$promise
        .then(function(resource) {
          // Set user session if account is already confirmed (log the user in)
          if (!resource.confirm_token) {
            Session.setUser(resource);
            $rootScope.$emit('loginEvent');
          }
          return resource;
        });
      },

      login: function(user) {
        return User.login(user).$promise
        .then(function(resource) { Session.setUser(resource); })
        .then(function() { $rootScope.$emit('loginEvent'); });
      },

      logout: function() {
        return User.logout().$promise
        .then(function() { Session.clearUser(); })
        .finally(function() { $rootScope.$emit('logoffEvent'); });
      },

      authenticate: function() {
        if (Session.getToken()) {
          User.ping().$promise
          .then(function(user) { Session.setUser(user); });
        }
        else { Session.clearUser(); }
      }
    };

    serviceAPI.authenticate();
    return serviceAPI;
  }
];
