'use strict';

const os = require('os');
const nodeStatic = require('node-static');
const http = require('http');
const socketIO = require('socket.io');

const fileServer = new(nodeStatic.Server)();
const app = http.createServer(function(req, res) {
  fileServer.serve(req, res);
}).listen(8080);

const io = socketIO.listen(app);
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
