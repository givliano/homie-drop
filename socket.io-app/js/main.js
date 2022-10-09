'use strict';

let isInitiator;

window.room = prompt('Enter room name:');

var socket = io.connect();

if (room !== '') {
  console.log('Message from client: Asking to join room ' + room);
  socket.emit('create or join', room);
}

socket.on('created', function(room, clientId) {
  isInitiator = true;
});

socket.on('full', function(room) {
  console.log('Message from cliente: Room ' + room + ' is full :^(.');
});

socket.on('ipaddr', function(ipaddr) {
  console.log('Message from client: Server IP address is '+ ipaddr);
});

socket.on('joined', function(room, clientId) {
  isInitiator = false;
});

// Logs the message from the backend in the console.
socket.on('log', function(array) {
  console.log.apply(console, array);
});
