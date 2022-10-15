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

socket.on('log', function(array) {
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
  console.log('STREAM');
  console.log(stream);
  console.log(video);
  // video.srcObject = stream.getTracks()[0];
  video.srcObject = stream;
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
      dataChannel = e.channel;
      onDataChannelCreated(dataChannel);
    }
  }
}

function onLocalSessionCreated(description) {
  console.log('Local session created:', description);
  peerConn.setLocalDescription(description)
    .then(() => {
      console.log('Sending local description:', peerConn.localDescription);
      sendMessage(peerConn.localDescription);
    })
    .catch(logError);
}

function onDataChannelCreated(channel) {
  console.log('onDataChannelCreated:', channel);

  channel.onopen = () => {
    console.log('CHANNEL OPENED!');
    sendBtn.disabled = false;
    snapAndSendBtn.disabled = false;
  };

  channel.onclose = () => {
    console.log('CHANNEL CLOSED!');
    sendBtn.disabled = false;
    snapAndSendBtn.disabled = false;
  };

  channel.onmessage = (adapter.browserDetails.browser === 'firefox') ? receiveDataFirefoxFactory() : receiveDataChromeFactory;
}

function receiveDataChromeFactory() {
  let buf;
  let count;

  return function onemssage(event) {
    if (typeof event.data === 'string') {
      buf = window.buf = new Uint8ClampedArray(parseInt(event.data));
      count = 0;
      console.log('Expecting a total of ' + buf.byteLength + ' bytes');
      return;
    }

    const data = new Uint8ClampedArray(event.data);
    buf.set(data, count);

    count += data.byteLength;
    console.log('count: ', + count);

    if (count === buf.byteLength) {
      // We are done, all chunks have been received.
      console.log('DONE. Rendering photo.');
      renderPhoto(buf);
    }
  };
}

function receiveDataFirefoxFactory() {
  let count;
  let total;
  let parts;

  return function onmessage(event) {
    if (typeof event.data === 'string') {
      total = parseInt(event.data);
      parts = [];
      count = 0;
      console.log('Expecting a total of ' + total + ' bytes');
      return;
    }

    parts.push(event.data);
    count += event.data.size;
    console.log(`Got ${event.data.size} byte(s), ${total - count} to go`);

    if (count === total) {
      console.log('Assembling payload');
      const buf = new Uint8ClampedArray(total);
      const compose = (i, pos) => {
        const reader = new FileReader();
        reader.onload = () => {
          buf.set(new Uint8ClampedArray(this.result), pos);

          if ((i + 1) === parts.length) {
            console.log('DONE. Rendering photo');
            renderPhoto(buf);
          } else {
            compose((i + 1), (pos + this.result.byteLength));
          }
        };
        reader.readAsArrayBuffer(parts[i]);
      };
      compose(0, 0);
    }
  };
}

/**
 * Aux functions, mostrly UI related.
 */

function snapPhoto() {
  photoContext.drawImage(video, 0, 0, photo.width, photo.height);
  show(photo, sendBtn);
}

function sendPhoto() {
  // Split data channel message in chunk of this byte length.
  const CHUNK_LEN = 64000;
  console.log('width and height ', photoContextW, photoContextH);
  const img = photoContext.getImageData(0, 0, photoContextW, photoContextH);
  len = img.data.byteLength;
  n = len / CHUNK_LEN | 0; // wtf is this magic?

  console.log('Sending a total of ' + len + ' byte(s)');

  if (!dataChannel) {
    logError('Connection has not been initiated. ' + 'Get two peers in the same room first');
    return;
  } else if (dataChannel.readyState === 'closed') {
    logError('Connection was lost. Peer closed the connection.');
    return;
  }

  dataChannel.send(len);

  // Split the photo and send in chunks of about 64 KB.
  for (let i = 0; i < n; i++) {
    const start = i * CHUNK_LEN;
    const end = (i + 1) * CHUNK_LEN;
    console.log(start + ' - ' + (end - 1));
    dataChannel.send(img.data.subarray(start, end));
  }

  // Send the reminder, if any.
  if (len % CHUNK_LEN) {
    console.log(`Last ${len % CHUNK_LEN} byte(s)`);
    dataChannel.send(img.data.subarray*n * CHUNK_LEN);
  }
}

function renderPhoto(data) {
  const canvas = document.createElement('canvas');
  canvas.width = photoContextW;
  canvas.height = photoContextH;
  canvas.classList.add('incomingPhoto');
  // Trail is the element holding the incoming images
  trail.insertBefore(canvas, trail.firstChild);

  const context = canvas.getContext('2d');
  const img = context.createImageData(photoContextW, photoContextH);
  img.data.set(data);
  context.putImageData(img, 0, 0);
}

function show() {
  Array.prototype.forEach.call(arguments, function(elem) {
    elem.style.display = 'none';
  })
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

