'use strict';
/* jslint node: true */

module.exports = ['$window', 'Session',
  function($window, Session) {
    // Initiate the connection to the server
    var socketcluster = require('socketcluster-client');
    var socket = socketcluster.connect({
      hostname: forumData.websocket_host,
      port: forumData.websocket_port,
      autoReconnect: true
    })
    .on('subscribe', function(channelName) {
      if (Window.websocketLogs) {
        console.log('Websocket subscribed to', channelName);
      }
    })
    .on('unsubscribe', function(channelName) {
      if (Window.websocketLogs) {
        console.log('Websocket unsubscribed from', channelName);
      }
    })
    .on('error', function(err) {
      console.log('Websocket error:', err);
    });
    return socket;
  }
];
