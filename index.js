'use strict';

/****************************************************************************
* Static Server
****************************************************************************/
import * as os from 'os';
import { createServer } from 'http';
import * as path from 'path';
import { Server } from 'socket.io';
import express from 'express';
import next from 'next';

// Create the variables not available in ES Modules
import { fileURLToPath } from 'url';
import { dirname } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const port = 3000;

const dev = process.env.NODE_ENV !== 'production';
const nextApp = next({ dev })
const nextHandler = nextApp.getRequestHandler();

nextApp.prepare().then(async () => {
  const app = express();
  // Returns a new node http.Server, letting express handle the requests and responses
  const server = createServer(app);
  const io = new Server();
  io.attach(server);

  server.listen(port);
  app.all('*', (req, res) => nextHandler(req, res));
  console.log(__dirname + '/src/public');
  app.use('/', express.static(path.join(__dirname, '/src/public')));

  /****************************************************************************
  * Peer Messaging
  ****************************************************************************/
  io.sockets.on('connection', function(socket) {
    let socketRoom;
    // Convenience function to log server messages on the client
    function log() {
      const array = ['Message from server:'];
      array.push.apply(array, arguments);
      socket.emit('log', array);
    }

    socket.on('message', function(message) {
      if (!socketRoom) {
        log('No room to emit message.');
        return;
      }
      log('Client said: ', message);
      // For a real app, would be room-only (not broadcast).
      // socket.broadcast.emit('message', message);
      // Broadcast to room only
      socket.broadcast.to(socketRoom).emit('message', message);
    });

    socket.on('create or join', function(room) {
      log('Received request to create or join room '+ room);
      socketRoom = room;

      const clientsInRoom = io.sockets.adapter.rooms.get(room);
      const numClients = clientsInRoom ? clientsInRoom.size : 0;

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
});
