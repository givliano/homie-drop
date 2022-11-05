'use strict';

/****************************************************************************
* Static Server
****************************************************************************/

const os = require('os');
const http = require('http');
const path = require('path');
const socketIO = require('socket.io');
const express = require('express');
const app = express();
const server = http.createServer(app);

server.listen(3000);
app.use('/', express.static(path.join(__dirname, 'public')));

/****************************************************************************
* Peer Messaging
****************************************************************************/

const io = socketIO.listen(server);
io.sockets.on('connection', function(socket) {
  // Convenience function to log server messages on the client
  function log() {
    const array = ['Message from server:'];
    array.push.apply(array, arguments);
    socket.emit('log', array);
  }

  socket.on('message', function(message) {
    log('Client said: ', message);
    // For a real app, would be room-only (not broadcast).
    socket.broadcast.emit('message', message);
  });

  socket.on('create or join', function(room) {
    log('Received request to create or join room '+ room);

    const clientsInRoom = io.sockets.adapter.rooms[room];
    const numClients = clientsInRoom ? clientsInRoom.length : 0;

    log(`Room ${room} now has ${numClients + 1} client(s)`);

    if (numClients === 0) {
      log(`Client ID ${socket.id} created room ${room}`);
      socket.join(room);
      socket.emit('created', room, socket.id);
    } else if (numClients === 1) {
      log(`Client ID ${socket.id} joined room ${room}`);
      io.sockets.in(room).emit('join', room);
      socket.join(room);
      socket.emit('joined', room, socket.id);
      io.sockets.in(room).emit('ready');
    } else { // max two clients
      socket.emit('full', room);
    }
  });

  socket.on('ipaddr', function() {
    var ifaces = os.networkInterfaces();

    for (let dev in ifaces) {
      ifaces[dev].forEach(details => {
        if (details.family === 'IPv4' && details.address !== '127.0.0.1') {
          socket.emit('ipaddr', details.address)
        }
      });
    }
  });

  socket.on('bye', function() {
    console.log('Received BYE :^)');
  });
});
