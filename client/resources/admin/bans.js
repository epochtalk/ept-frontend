'use strict';
/* jslint node: true */

module.exports = ['$resource',
  function($resource) {
    return $resource('/api/admin/ban/addresses', {}, {
      pageBannedAddresses: {
        method: 'GET'
      },
      addAddresses: {
        method: 'PUT'
      }
    });
  }
];
