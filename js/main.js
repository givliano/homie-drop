'use strict';

const mediaStreamConstraints = {
  video: true
};

// Set up to exchange only video.
const offerOptions = {
  offerToReceiveVideo: 1
};

// Define initial start time of the call (defined as connection between peers)
let startTime = null

// Define peer connections, streams and video elements.
const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');

let localStream;
let remoteStream;

let localPeerConnection;
let remotePeerConnection;

// Handles success by adding the MediaStream to the video element.
function gotLocalMediaStream(mediaStream) {
  localVideo.srcObject = mediaStream;
  localStream = mediaStream;
  trace('Received local stream');
  callButton.disabled = false;
}

// Handles error by loggin a message to the console
function handleLocalMediaStreamError(error) {
  trace(`navigator.getUserMedia error: ${error.toString()}.`);
}

// Logs a message with the id and size of a video element.
function logVideoLoaded(event) {
  const video = event.target;
  trace(`${video.id} videoWidth: ${video.videoWidth}px,` + `videoHeight: ${video.videoHeight}px`);
}

// Logs a message with the id and size of a video element.
// This event is fired when video begins streamimg.
function logResizedVideo(event) {
  logVideoLoaded(event);

  if (startTime) {
    const elapsedTime = window.performance.now() - startTime;
    startTime = null;
    trace(`Setup time: ${elapsedTime.toFixed(3)}ms.`);
  }
}

localVideo.addEventListener('loadedmetadata', logVideoLoaded);
remoteVideo.addEventListener('loadedmetadata', logVideoLoaded);
remoteVideo.addEventListener('onresize', logResizedVideo);

// Define RTC peer connection behaviour.

// Connects with new peer candidate.
function handleConnection(event) {
  const peerConnection = event.target;
  const iceCandidate = event.candidate;

  if (iceCandidate) {
    const newIceCandidate = new RTCIceCandidate(iceCandidate);
    const otherPeer = getOtherPeer(peerConnection);

    otherPeer.addIceCandidate(newIceCandidate)
      .then(() => handleConnectionSuccess(peerConnection))
      .catch((error) => handleConnectionFailure(peerConnection, error));

    trace(`${getPeerName(peerConnection)} ICE candidate:\n` + `${event.candidate.candidate}`);
  }
}

// Logs that the connection succeeded.
function handleConnectionSuccess(peerConnection) {
  trace(`${getPeerName(peerConnection)} addIceCandidate success.`);
}

// Logs that the connection failed.
function handleConnectionFailure(peerConnection, error) {
  trace(`${getPeerName(peerConnection)} failed to add ICE Candidate:\n` + `${error.toString()}.`);
}

// Logs changes to the connection state.
function handleConnectionChange(event) {
  const peerConnection = event.target;
  console.log('ICE state change event: ', event);
  trace(`${getPeerName(peerConnection)} ICE state: ` + `${peerConnection.iceConnectionState}.`);
}

// Logs error when setting description fails.
function setSessionDescriptionError(error) {
  trace(`Failed to create session description: ${error.toString()}.`);
}

// Logs error when setting session description fails.
function setSessionDescriptionError(error) {
  trace(`Failed to create session description: ${error.toString()}.`);
}

// Logs success when setting session description.
function setDescriptionSuccess(peerConnection, functionName) {
  const peerName = getPeerName(peerConnection);
  trace(`${peerName} ${functionName} complete.`);
}

// Logs success when localDescription is set.
function setLocalDescriptionSuccess(peerConnection) {
  setDescriptionSuccess(peerConnection, 'setLocalDescription');
}

// Logs offer creation and sets peer connection session descriptions.
function setRemoteDescriptionSuccess(peerConnection) {
  setDescriptionSuccess(peerConnection, 'setRemoteDescription');
}

// If successful, Local sets the local description using setLocalDescription() and then sends this session description to Remote via their signaling channel.
// Remote sets the description Local sent him as the remote description using setRemoteDescription().
// Remote runs the RTCPeerConnection createAnswer() method, passing it the remote description he got from Local, so a local session can be generated that is compatible with hers. The createAnswer() promise passes on an RTCSessionDescription: Remote sets that as the local description and sends it to Local.
// When Local gets Remote's session description, she sets that as the remote description with setRemoteDescription().

// Logs offer creation and sets peer connection session description.
function createdOffer(description) {
  trace(`Offer from localPeerConnection:\n${description.sdp}`);

  trace('localPeerConnection setLocalDescription start.');
  localPeerConnection.setLocalDescription(description)
    .then(() => setLocalDescription(localPeerConnection))
    .catch(setSessionDescriptionError);

  trace('remotePeerConnection setRemoteDescription start');
  remotePeerConnection.setRemoteDescription(description)
    .then(() => setRemoteDescriptionSuccess(remotePeerConnection))
    .catch(setSessionDescriptionError);

  trace('remotePeerConnection createAnswer start.');
  remotePeerConnection.createAnswer()
    .then(createdAnswer)
    .catch(setSessionDescriptionError);
}

// Logs answer to offer creation and sets peer connection session descriptions.
function createdAnswer(description) {
  trace(`Answer from remotePeerConnection:\n${description.sdp}`);

  trace('remotePeerConnection setLocalDescription start.');
  remotePeerConnection.setLocalDescription(description)
    .then(() => setLocalDescriptionSuccess(remotePeerConnection))
    .catch(setSessionDescriptionError);

  trace(`localPeerConnection setRemoteDescription start.`);
  localPeerConnection.setRemoteDescription(description)
    .then(() => setRemoteDescriptionSuccess(localPeerConnection))
    .catch(setSessionDescriptionError);
}

// Define and add behavior to buttons.

// Define action buttons.
const startButton = document.getElementById('startButton');
const callButton = document.getElementById('callButton');
const hangupButton = document.getElementById('hangupButton');

// Set up initial action buttons status: disable call and hangup.
callButton.disabled = true;
hangupButton.disabled = true;

// Handles start button action: creates local MediaStream.
function startAction() {
  startButton.disabled = true;
  navigator.mediaDevices.getUserMedia(mediaStreamConstraints)
    .then(gotLocalMediaStream)
    .catch(handleLocalMediaStreamError);

  trace('Requesting local stream.');
}

// Handles call button action: creates peer connection.
function callAction() {
  callButton.disabled = true;
  hangupButton.disabled = false;

  trace('Starting call');
  startTime = window.performance.now();

  // Get local media stream tracks.
  const videoTracks = localStream.getVideoTracks();
  const audioTracks = localStream.getAudioTracks();

  if (videoTracks.length > 0) {
    trace(`Using video device: ${videoTracks[0].label}.`);
  }

  if (audioTracks > 0) {
    trace(`Using audio device: ${audioTracks[0].label}`);
  }
}

const servers = null; // Allows for RTC server configuration

// Create peer connections and behavior.
localPeerConnection = new RTCPeerConnection(servers);
trace('Created local peer connection object localPeerConnection.');

localPeerConnection.addEventListener('icecandidate', handleConnection);
localPeerConnection.addEventListener('iceconnectionstatechange', handleConnectionChange);

remotePeerConnection = new RTCPeerConnection(servers);
trace('Created remote peer connection object remotePeerConnection.');

remotePeerConnection.addEventListener('icecandidate', handleConnection);
remotePeerConnection.addEvenetListener('iceconnectionstatechange', handleConnectionChange);

// Add local stream to connection and create offer to connect.
localPeerConnection.addStream(localStream);
trace('Added local stream to localPeerConnection.');

trace('localPeerConnection createOffer start.');
localPeerConnection.createOffer(offerOptions)
  .then(createdOffer).catch(setSessionDescriptionError);

// Handles hangup action: ends up call, closes connections and resets peers.
function hangupAction() {
  localPeerConnection.close();
  remotePeerConnection.close();
  localPeerConnection = null;
  remotePeerConnection = null;
  hangupButton.disabled = true;
  callButton.disabled = false;
  trace('Ending call.');
}

// Add click event handlers for buttons.
startButton.addEventListener('click', startAction);
callButton.addEventListener('click', callAction);
hangupButton.addEventListener('click', hangupAction);
