'use strict';

/****************************************************************************
* Initial setup
****************************************************************************/
import Peer from './connection.js';

const peer = new Peer();

// var roomURL = document.getElementById('url');
const video = document.getElementById('video');
const photo = document.getElementById('photo');
const photoContext = photo.getContext('2d');
const trail = document.getElementById('trail');
const snapBtn = document.getElementById('snap');
const sendBtn = document.getElementById('send');
const snapAndSendBtn = document.getElementById('snapAndSend');

let photoContextW;
let photoContextH;

// Attach event handlers
snapBtn.addEventListener('click', () => peer.snapPhoto());
sendBtn.addEventListener('click', () => peer.sendPhoto());
snapAndSendBtn.addEventListener('click', snapAndSend);

// Disabled send button by defaul
// sendBtn.disabled = true;
snapAndSendBtn.disabled = true;

// Create a random room if not already present in the url.
let isInitiator;
let room = window.location.hash.substring(1);
if (!room) {
  room = window.location.hash = randomToken();
}

/****************************************************************************
* Signaling server
****************************************************************************/

// Connect to the signaling server
var socket = window.socket = io.connect();

socket.on('ipaddr', function(ipaddr) {
  console.log(`Server IP address is: ${ipaddr}`);
  // updateRoomURL(ipaddr);
});

socket.on('created', function(room, clientId) {
  console.log(`Created room ${room} - my client ID is ${clientId}`);
  isInitiator = true;
  peer.setIntiator(true);
  grabWebCamVideo();
});

socket.on('joined', function(room, clientId) {
  console.log(`This peer has joined room ${room}, with cliend ID ${clientId}`);
  isInitiator = false;
  peer.setIntiator(false);
  peer.createPeerConnection();
  grabWebCamVideo();
});

socket.on('full', function(room) {
  alert(`Room ${room} is full. We will create a new room for you`);
  window.location.hash = '';
  window.location.reload();
});

socket.on('ready', function() {
  console.log('Socket is ready');
  peer.createPeerConnection();
});

socket.on('log', function(array) {
  console.log.apply(console, array);
});

socket.on('message', function(message) {
  console.log('Client received message:', message);
  peer.signalingMessageCallback(message);
});

socket.emit('create or join', room);

if (location.hostname.match(/localhost|127\.0\.0/)) {
  socket.emit('ippaddr');
}

// Leaving rooms and disconnecting from peers.
socket.on('disconnect', function(reason) {
  console.log(`Disconnected: ${reason}`);
  sendBtn.disabled = true;
  snapAndSendBtn.disabled = true;
});

socket.on('bye', function(room) {
  console.log(`Peer leaving room ${room}`);
  sendBtn.disabled = true;
  snapAndSendBtn.disabled = true;

  // If peer did not create the room, re-enter to be creator.
  if (!isInitiator) {
    window.location.reload()
  }
});

window.addEventListener('unload', function() {
  console.log(`Unloading window.Notifying peers in ${room}`);
  socket.emit('bye', room);
})

/**
 * Updates URL on the page so that users can copy&paste it to their peers
 */
// function updateRoomURL(ipaddr) {
  // var url;
  // if (!ipaddr) {
    // url = location.href;
  // } else {
    // url = location.protocol + '//' + ipaddr + ':2013/#' + room;
  // }
  // roomURL.innerHTML = url;
// }

/**
 * User media (webcam)
 */
async function grabWebCamVideo() {
  console.log('Getting user media (video) ...');
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: true
    });
    gotStream(stream);
  } catch (e) {
    console.log('ERROR GETUSERMEDIA()', e);
  }
}

function gotStream(stream) {
  console.log('getUserMedia video stream URL:', stream);
  window.stream = stream;
  video.srcObject = stream;
  video.onloadedmetadata = () => {
    photo.width = photoContextW = video.videoWidth;
    photo.height = photoContextH = video.videoHeight;
    console.log(`gotStream with width and height: ${photoContextW}, ${photoContextH}`);
  };
  show(snapBtn);
}

/**
 * Aux functions, mostrly UI related.
 */

function snapPhoto() {
  photoContext.drawImage(video, 0, 0, photo.width, photo.height);
  show(photo, sendBtn);
}

const input = document.getElementById('input');
input.addEventListener('change', async function(e) {
  for (const file of e.target.files) {
    console.log(file);
    if (!(file.type.startsWith('image/') || file.type.startsWith('video/'))) {
      console.warn('file not supported');
      return;
    }
    console.warn('added files', file);
    await peer.setFiles(file);
  }
}, false);

async function snapAndSend() {
  snapPhoto();
  await peer.sendPhoto();
}

function show() {
  Array.prototype.forEach.call(arguments, function(elem) {
    elem.style.display = null;
  });
}

function hide() {
  Array.prototype.forEach.call(arguments, function(elem) {
    elem.style.display = 'none';
  });
}

function randomToken() {
  return Math.floor((1 + Math.random()) * 1e16).toString(16).substring(1);
}

function logError(err) {
  if (!err) return;
  if (typeof err === 'string') {
    console.warn(err);
  } else {
    console.warn(err.toString(), err);
  }
}
