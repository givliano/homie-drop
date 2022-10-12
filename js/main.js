'use strict';

/****************************************************************************
* Initial setup
****************************************************************************/

// var configuration = {
//   'iceServers': [{
//     'urls': 'stun:stun.l.google.com:19302'
//   }]
// };

var configuration = null;

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
snapBtn.addEventListener('click', snapPhoto);
sendBtn.addEventListener('click', sendPhoto);
snapAndSendBtn.addEventListener('click', snapAndSend);

// Disabled send button by defaul
sendBtn.disabled = true;
snapAndSndBtn.disabled = true;

// Create a random room if not already present in the url.
let isInitiator;
const room = window.location.hash.substring(1);
if (!room) {
  room = window.location.hash = randomToken();
}

/****************************************************************************
* Signaling server
****************************************************************************/

// Connect to the signaling server
var socket = io.connect();

socket.on('ipaddr', function(ipaddr) {
  console.log(`Server IP address is: ${ipaddr}`);
  // updateRoomURL(ipaddr);
});

socket.on('ipaddr', function(ipaddr) {
  console.log('Server IP address is: ' + ipaddr);
});

socket.on('created', function(room, clientId) {
  console.log(`Created room ${room} - my client ID is ${clientId}`);
  isInitiator = false;
  createPeerConnection(isInitiator, configuration);
  grabWebCamVideo();
});

socket.on('full', function(room) {
  alert(`Room ${room} is full. We will create a new room for you`);
  window.location.hash = '';
  window.location.reload();
});

socket.on('ready', function() {
  console.log('Socket is ready');
  createPeerConnection(isInitiator, configuration);
});

socket.log('log', function(array) {
  console.log.apply(console, array);
});

socket.on('message', function(message) {
  console.log('Client received message:', message);
  signalingMessageallback(message);
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

/**
 * Send message to signaling server
 */
function sendMessage(message) {
  console.log('Client sending message', message);
  socket.emit('message', message);
}

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
 * User media (webcao)
 */
function grabWebCamVideo() {
  console.log('Getting user media (video) ...');
  navigator.mediaDevices.getUserMedia({
    audio: false,
    video: true
  })
  .then(gotStream)
  .catch(function(e) {
    console.log('ERROR GETUSERMEDIA()', e);
  });
}

function gotStream(stream) {
  console.log('getUserMedia video stream URL:', stream);
  window.stream = stream;
  video.srcObject = stream.getTracks()[0];
  video.onloadeddata = () => {
    photo.width = photoContextW = video.videoWidth;
    photo.height = photoContextH = video.videoHeight;
    console.log(`gotStream with width and height: ${photoContextW}, ${photoContextH}`);
  };
  show(snapBtn);
}

/**
 * WebRTC peer connection and data channel
 */
var peerConn;
var dataChannel;

function signalingMessageCallback(message) {
  if (message.type === 'offer') {
    console.log('Got offer. Send answer to peer.');
    peerConn.setRemoteDescription(
      new RTCSessionDescription(message),
      function() {},
      logError
    );
    peerConn.createAnswer(onLocalSessionCreated, logError);
  } else if (message.type === 'answer') {
    console.log('Got answer');
    peerConn.setRemoteDescription(
      new RTCSessionDescription(message),
      function() {},
      logError
    );
  } else if (message.type === 'candidate') {
    peerConn.addIceCandidate(new RTCIceCandidate({
      candidate: message.candidate,
      sdpMLineIndex: message.label,
      sdpMid: message.id
    }));
  }
}

function createPeerConnection(isInitiator, config) {
  console.log(`Creating peer connection as initiator? ${isInitiator}, config: ${config}`);
  peerConn = new RTCPeerConnection(config);
}

// send any ice candidates t the other peer
peerConn.onicecandidate = (e) => {
  console.log('icecandidate event: ', e);
  if (e.candidate) {
    sendMessage({
      type: 'candidate',
      label: e.candidate.sdpMLineIndex,
      id: e.candidate.sdpMid,
      candidate: e.candidate.candidate
    });
  } else {
    console.log('End of candidates.');
  }
};

if (isInitiator) {
  console.log('Creating Data Channel');
  dataChannel = peerConn.createDataChannel('photos');
  onDataChannelCreated(dataChannel);

  console.log('Creating an offer');
  peerConn.createOffer().then(offer => {
    return peerConn.setLocalDescription(offer);
  })
  .then(() => {
    console.log('sending local desc:', peerConn.localDescription);
    sendMessage(peerConn.localDescription);
  })
  .catch(logError);
} else {
  peerConn.ondatachannel = (e) => {
    console.log('ondatachannel:', e.channel);

  }
}
