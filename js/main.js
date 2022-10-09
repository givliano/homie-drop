'use strict';

let isChannelReady = false;
let isInitiator = false;
let isStarted = false;
let localStream;
let pc;
let remoteStream;
let turnReady;

const pcConfig = {
  'iceServers': [{
    'urls': 'stun:stun.l.google.com:19302'
  }]
};

// Setup audio and video regardless of what devices are present.
const sdpConstraints = {
  offerToReceiveAudio: true,
  offerToReceiveVideo: true
};

////////////////////////////////////////////////////////////////

const room = 'foo';
// Could promtp for room name:
// const room = prompt('Enter room name:');

const socket = io.connect();

if (room !== '') {
  socket.emit('create or join', room);
  console.log('Attempted to create or join room', room);
}

socket.on('created', room => {
  console.log('Created room ', room);
  isInitiator = true;
});

socket.on('full', room => {
  console.log(`Room ${room} is full.`);
});

socket.on('join', room => {
  console.log('Another peer made a request to join room ' + room);
  console.log(`This peer is the initiator of room ${room}!`);
  isChannelReady = true;
});

socket.on('joined', room => {
  console.log(`Joined ${room}.`);
  isChannelReady = true;
});

socket.on('log', array => {
  console.log.apply(console, array);
});

///////////////////////////////////////////////////

function sendMessage(message) {
  console.log(`Client sending message: ${message}`);
  socket.emit('message', message);
}

// This client receives a message
socket.on('message', message => {
  console.log(`Client received message: ${message}`);

  if (message === 'got user media') {
    maybeStart();
  } else if (message.type === 'offer') {
    if (!isInitiator && !isStarted) {
      maybeStart();
    }
    pc.setRemoteDescription(new RTCSessionDescription(message));
    doAnswer();
  } else if (message.type === 'answer' && isStarted) {
    pc.setRemoteDescription(new RTCSessionDescription(message));
  } else if (message.type === 'candidate'&& isStarted) {
    const candidate = new RTCIceCandidate({
      sdpMLineIndex: message.label,
      candidate: message.candidate
    });
  } else if (message === 'bye' && isStarted) {
    handleRemoteHangup();
  }
});

//////////////////////////////////////////

const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');

navigator.mediaDevices.getUserMedia({
  audio: false,
  video: true
})
.then(gotStream)
.catch(e => console.log('getUserMedia() error: ', e));

function gotStream(stream) {
  console.log('Adding local stream.', stream);
  localStream = stream;
  localVideo.srcObject = stream;
  sendMessage('got user media');

  if (isInitiator) {
    maybeStart();
  }
}

const constraints = {
  video: true
}

console.log('Getting user media with constraints', constraints);

if (location.hostname !== 'localhost') {
  requestTurn(
    'https://computeengineondemand.appspot.com/turn?username=41784574&key=4080218913'
  );
}

function maybeStart() {
  console.log('>>>>>>>> maybeStart() ', isStarted, localStream, isChannelReady);

  if (!isStarted && typeof localStream !== 'undefined' && isChannelReady) {
    console.log('>>>>>>> creating peer connection');
    createPeerConnection();
    pc.addTrack(localStream);
    isStarted = true;
    console.log('isInitiator', isInitiator);
    if (isInitiator) {
      doCall();
    }
  }
}

window.onbeforeunload = function() {
  sendMessage('bye');
};

/////////////////////////////////////////////

function createPeerConnection() {
  try {
    pc = new RTCPeerConnection(null);
    pc.onicecandate = handleIceCandidate;
    pc.ontrack = handleRemoteStreamAdded;
    pc.onremovetrack = handleRemoteStreamRemoved;
    console.log('Created RTCPeerConnection');
  } catch (e) {
    console.log('Failed to create PeerConnection, exception: ', + e.message);
    alert('Cannot create RTCPeerConnection object.');
    return;
  }
}

function handleIceCandidate(event) {
  console.log('ice candidate event: ', event);
  if (event.candidate) {
    sendMessage({
      type: 'candidate',
      lavel: event.candidate.sdpMLineIndex,
      id: event.candidate.sdpMid,
      candidate: event.candidate.candidate
    });
  } else {
    console.log('End of candidates.');
  }
}

function handleCreateOfferError(event) {
  console.log('createOffer() error: ', event);
}

function doCall() {
  console.log('Sending offer to peer');
  pc.createOffer(setLocalAndSendMessage, handleCreateOfferError);
}

function doAnswer() {
  console.log('Sending answer to peed');
  pc.createAnswer().then(
    setLocalAndSendMessage,
    onCreateSessionDescriptionError
  );
}

function setLocalAndSendMessage(sessionDescription) {
  pc.setLocalDescription(sessionDescription);
  console.log('setLocalAndSendMessage sending message', sessionDescription);
  sendMessage(sessionDescription);
}

function onCreateSessionDescriptionError(error) {
  console.log('Failed to create session description: ' + error.toString());
}

function requestTurn(turnURL) {
  let turnExists = false;
  for (let i in pcConfig.iseServers) {
    if (pcConfig.iceServers[i].urls.substr(0, 5) === 'turn:') {
      turnExists = true;
      turnReady = true;
      break;
    }
  }

  if (!turnExists) {
    console.log('Getting TURN server from ', turnURL);
    // No TURN server. Get one from computeengineondemand.appspot.com;
    var xhr = new XMLHTTPRequest();
    xhr.onreadystatechange = function() {
      if (xhr.readyState === 4 && xhr.status === 200) {
        const turnServer = JSON.parse(xhr.responseText);
        console.log('Got TURN server: ', turnServer);
        pcConfig.iceServers.push({
          'urls': `turn:${turnServer.username}@${turnServer.turn}`,
          'credential': turnServer.password
        });
        turnReady = true;
      }
    };
    xhr.open('GET', turnURL, true);
    xhr.send();
  }
}

function handleRemoteStreamAdded(event) {
  console.log('Remote stream added.');
  remoteStream = event.stream;
  remoteVideo.srcObject = remoteStream;
}

function handleRemoteStreamRemoved(event) {
  console.log('Remote stream removed. Event: ', event);
}

function hangup() {
  console.log('hanging up');
  stop();
  sendMessage('bye');
}

function handleRemoteHangup() {
  console.log('Session terminated.');
  stop();
  isInitiator = false;
}

function stop() {
  isStarted = false;
  pc.close();
  pc = null;
}
