'use strict';

let localConnection;
let remoteConnection;
let sendChannel;
let receiveChannel;
let pcConstraint;
let dataConstraint;
const dataChannelSend = document.getElementById('dataChannelSend');
const dataChannelReceive = document.getElementById('dataChannelReceive');
const startButton = document.getElementById('startButton');
const sendButton = document.getElementById('sendButton');
const closeButton = document.getElementById('closeButton');

startButton.onclick = createConnection;
sendButton.onclick = sendData;
closeButton.onclick = closeDataChannels;

function enableStartButton() {
  startButton.disabled = false;
}

function disableSendButton() {
  sendButton.disabled = true;
}

async function createConnection() {
  dataChannelSend.placeholder = '';
  const servers = null;
  pcConstraint = null
  dataConstraint = null;

  trace('Using SCTP based data channels.');

  // For SCTP, reliable and ordered delivery is true by default.
  // Add localConnection to global scope to make it visible
  // from the browser console.
  window.localConnection = localConnection = new RTCPeerConnection(servers, pcConstraint);
  trace('Created local peer connection object localConnection');

  sendChannel = localConnection.createDataChannel('sendDataChannel', dataConstraint);
  trace('Created send data channel.');

  localConnection.onicecandidate = iceCallback1;
  sendChannel.onopen = onSendChannelStateChange;
  sendChannel.onclose = onSendChannelStateChange;

  // Add remoteConnection to global scope to make it visible
  // from the browser console.
  window.remoteConnection = remoteConnection = new RTCPeerConnection(servers, pcConstraint);
  trace('Create remote peer connection object remoteConnection');

  remoteConnection.onicecandidate = iceCallback2;
  remoteConnection.ondatachannel = receiveChannelCallback;

  try {
    const localDescription = await localConnection.createOffer();
    gotDescription1(localDescription);
  } catch(error) {
    onCreateSessionDescriptionError(error);
  }

  startButton.disabled = true;
  closeButton.disabled = false;
}

function onCreateSessionDescriptionError(error) {
  trace('Failed to create session description: ' + error.toString());
}

function sendData() {
  const data = dataChannelSend.value;
  sendChannel.send(data);
  trace('Sent data: ' + data)
}

function closeDataChannels() {
  trace('Closing data channels');
  sendChannel.close();
  trace('Closed data channel with label: ' + sendChannel.label);
  receiveChannel.close();
  trace('Closed data channel with label: ' + receiveChannel.label);
  localConnection.close();
  remoteConnection.close();
  localConnection = null
  remoteConnection = null;
  trace('Closed peer connections');
  startButton.disabled = false;
  sendButton.disabled = true;
  closeButton.disabled = true;
  dataChannelSend.value = '';
  dataChannelReceive.value = '';
  dataChannelSend.disabled = true;
  disableSendButton();
  enableStartButton();
}

async function gotDescription1(description) {
  localConnection.setLocalDescription(description);
  trace('Offer from localConnection \n' + description.sdp);

  remoteConnection.setRemoteDescription(description);

  try {
    const remoteDescription = await remoteConnection.createAnswer();
    gotDescription2(remoteDescription);
  } catch (error) {
    onCreateSessionDescriptionError(error);
  }
}

function gotDescription2(description) {
  remoteConnection.setLocalDescription(description);
  trace('Answer from remoteConnection \n' + description.sdp);
  localConnection.setRemoteDescription(description);
}

async function iceCallback1(event) {
  trace('Local ICE callback');

  console.warn('event');
  console.log(event);

  if (event.candidate) {
    try {
      const iceCandidate = remoteConnection.addIceCandidate(event.candidate);
      onAddIceCandidateSuccess(iceCandidate);
    } catch (error) {
      onAddIceCandidateError(error);
    }

    trace('Local ICE candidate: \n' + event.candidate.candidate);
  }
}

async function iceCallback2(event) {
  trace('Remote ICE callback');

  if (event.candidate) {
    try {
      const iceCandidate = localConnection.addIceCandidate(event.candidate);
      onAddIceCandidateSuccess(iceCandidate);
    } catch (error) {
      onAddIceCandidateError(error);
    }

    trace('Remote ICE candidate: \n' + event.candidate.candidate);
  }
}

function onAddIceCandidateSuccess() {
  trace('AddIceCandidates success');
}

function onAddIceCandidateError(error) {
  trace('Failed to add ICE candidate: \n' + error.toString());
}

function receiveChannelCallback(event) {
  trace('Receive channel callback');
  receiveChannel = event.channel;
  receiveChannel.onmessage = onReceiveMessageCallback;
  receiveChannel.onopen = onReceiveChannelStateChange;
  receiveChannel.onclose = onReceiveChannelStateChange;
}

function onReceiveMessageCallback(event) {
  trace('Received Message');
  dataChannelReceive.value = event.data;
}

function onSendChannelStateChange() {
  const readyState = sendChannel.readyState;

  trace('Send channel state is: \n' + readyState);

  if (readyState === 'open') {
    dataChannelSend.disabled = false;
    dataChannelSend.focus();
    sendButton.disabled = false;
    closeButton.disabled = false;
  } else {
    dataChannelSend.disabled = true;
    sendButton.disabled = true;
    closeButton.disabled = true;
  }
}

function onReceiveChannelStateChange() {
  const readyState = receiveChannel.readyState;
  trace('Receive channel state is: \n' + readyState);
}

function trace(text) {
  if (text[text.length - 1] === '\n') {
    text = text.substring(0, text.length - 1);
  }
  if (window.performance) {
    var now = (window.performance.now() / 1000).toFixed(3);
    console.log(now + ': ' + text);
  } else {
    console.log(text);
  }
}
