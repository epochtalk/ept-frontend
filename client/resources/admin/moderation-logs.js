'use strict';
/* jslint node: true */

module.exports = ['$resource',
  function($resource) {
    return $resource('/api/admin/modlog', {}, {
      page: {
        method: 'GET'
      }
    });
  }
];
