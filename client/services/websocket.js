'use strict';
/* jslint node: true */

module.exports = ['$window', 'Session',
  function($window, Session) {
    // Initiate the connection to the server
    var socketcluster = require('socketcluster-client');
    var socketOptions = {
      rejectUnauthorized: false,
      secure: JSON.parse(forumData.websocket_secure),
      hostname: forumData.websocket_host,
      port: forumData.websocket_port,
      autoReconnect: true
    };
    var socket = socketcluster.connect(socketOptions)
    .on('error', function(err) {
      console.log('Websocket error:', err);
      console.log(socketOptions);
    });
    return socket;
  }
];
