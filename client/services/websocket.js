'use strict';
/* jslint node: true */

module.exports = ['$window', 'Session',
  function($window, Session) {
    // Initiate the connection to the server
    var socketcluster = require('socketcluster-client');
    var socket = socketcluster.connect({
      rejectUnauthorized: false,
      secure: JSON.parse(forumData.websocket_secure),
      hostname: forumData.websocket_host,
      port: forumData.websocket_port,
      autoReconnect: true
    })
    .on('error', function(err) {
      console.log('Websocket error:', err);
    });
    return socket;
  }
];
