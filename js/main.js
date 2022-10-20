'use strict';

/****************************************************************************
* Initial setup
****************************************************************************/

var configuration = {
  'iceServers': [{
    'urls': 'stun:stun.l.google.com:19302'
  }]
};

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
var socket = io.connect();

socket.on('ipaddr', function(ipaddr) {
  console.log(`Server IP address is: ${ipaddr}`);
  // updateRoomURL(ipaddr);
});

socket.on('created', function(room, clientId) {
  console.log(`Created room ${room} - my client ID is ${clientId}`);
  isInitiator = true;
  grabWebCamVideo();
});

socket.on('joined', function(room, clientId) {
  console.log(`This peer has joined room ${room}, with cliend ID ${clientId}`);
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
  signalingMessageCallback(message);
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
    dataChannel.binaryType = 'arraybuffer';

    onDataChannelCreated(dataChannel);

    console.log('Creating an offer');
    peerConn.createOffer()
      .then(offer => peerConn.setLocalDescription(offer))
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
    sendBtn.disabled = true;
    snapAndSendBtn.disabled = true;
  };

  // channel.onmessage = (adapter.browserDetails.browser === 'firefox') ? receiveDataFirefoxFactory() : receiveDataChromeFactory();
  channel.onmessage = receiveDataChromeFactory();
}

function receiveDataChromeFactory() {
  let buf;
  let count;

  return function onemssage(event) {
    // Sending client will send the size of the buffer before
    // sending the data.
    if (typeof event.data === 'string') {
      // Create a buffer for the next data.
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
      console.log(buf);
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

const input = document.getElementById('input');
input.addEventListener('change', handleFiles, false);
var imageFiles = [];

async function handleFiles() {
  for (const file of this.files) {
    if (!file.type.startsWith('image/')) {
      return;
    }
    imageFiles.push(file)

    console.warn('added files', file);
    // const img = document.createElement('img');
    // img.classList.add('obj');
    // img.file = file;

    // const preview = document.getElementById('preview');
    // preview.appendChild(img);

    // const reader = new FileReader();
    // reader.onload = (e) => {
      // console.log(e);
      // img.src = e.target.result;
    // }
    // To trigger the load event we must use one of the read methods of the FileReader.
    // reader.readAsDataURL(file);

    // const url = URL.createObjectURL(file);          // create an Object URL
    // const img = new Image();                         // create a temp. image object

  // img.onload = function() {                    // handle async image loading
    // URL.revokeObjectURL(this.src);             // free memory held by Object URL
    // c.getContext("2d").drawImage(this, 0, 0);  // draw image onto canvas (lazy method™)
  // };

  // img.src = url;

    // const blob = await file.arrayBuffer();
    // const buf = new TypedArray(blob);
    // console.log(buf);
    // console.log(blob);
    // img = blob;
    // return blob;
  }
  imageFiles.forEach(file => {
    const objectURL = window.URL.createObjectURL(file);
    const img = document.createElement('img');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    console.log('file', file);
    canvas.classList.add('image-file', 'img-preview')
    img.onload = () => {
      console.log('loaded img', img);
      ctx.drawImage(
                    img,
                    0, 0, img.width, img.height,
                    0, 0, canvas.width, canvas.height
      );
      document.getElementById('preview').appendChild(canvas);
      window.URL.revokeObjectURL(objectURL);
    }
    img.src = objectURL;
  });


}

async function sendPhoto() {
  // Split data channel message in chunk of this byte length.
  const CHUNK_LEN = 64000;
  console.log('width and height ', photoContextW, photoContextH);
  // const img = photoContext.getImageData(0, 0, photoContextW, photoContextH);
  // Amount of bytes in the image data.
  // const len = img.data.byteLength;
  const buffer = await imageFiles[0].arrayBuffer();
  console.warn('buffer');
  console.log(buffer);
  const img = new Uint8ClampedArray(buffer);
  const len = img.byteLength;
  const n = len / CHUNK_LEN | 0; // wtf is this magic?

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
    // Start is inclusive, end is exclusive.
    dataChannel.send(img.subarray(start, end));
  }

  // Send the reminder, if any.
  if (len % CHUNK_LEN) {
    console.log(`Last ${len % CHUNK_LEN} byte(s)`);
    dataChannel.send(img.subarray(n * CHUNK_LEN));
  }
}

function snapAndSend() {
  snapPhoto();
  sendPhoto();
}

function renderPhoto(data) {
  console.warn('rendering data');
  console.warn('DATA')
  console.log(data);
  // console.log(new Blob(data))

  // var arrayBuffer;
  // var fileReader = new FileReader();
  // fileReader.onload = function(event) {
      // arrayBuffer = event.target.result;
  // };
  // fileReader.readAsArrayBuffer(new Blob(data, { type: 'image/jpeg' }));
  // console.log(fileReader);
  // console.log(arrayBuffer);

  // const objectURL = window.URL.createObjectURL(new Blob(data, { type: 'image/jpeg' }));
  // document.querySelector('#preview').innerHTML = `<a href="${objectURL}" download="foo.jpeg">Download</a>`

  const downloadFile = (blobObject, fileName) => {
    const link = document.createElement("a");
    const href = window.URL.createObjectURL(blobObject);
    link.href = href;
    link.download = fileName;

    link.click();

    window.URL.revokeObjectURL(href);

    link.remove();

    return true;
  };


  let offset = 0;

  const uintArrayBuffer = new Uint8Array(data.length, 0);

  data.forEach((arrayBuffer) => {
    uintArrayBuffer.set(
      new Uint8Array(arrayBuffer.buffer || arrayBuffer, arrayBuffer.byteOffset),
      offset
    );
    offset += arrayBuffer.byteLength;
  });

  const blobObject = new Blob([uintArrayBuffer]);

  downloadFile(blobObject, 'fuck.jpeg');




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
