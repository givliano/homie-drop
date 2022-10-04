'use strict';

const mediaStreamConstraints = {
  video: true
};

// Video element for stream
const localVideo = document.querySelector('video');

// Local stream that will be reproduced on the video
let localStream;

// Handles success by adding the MediaStream to the video element.
function gotLocalMediaStream(mediaStream) {
  localStream = mediaStream;
  localVideo.srcObject = mediaStream;
}

// Handles error by loggin a message to the console
function handleLocalMediaStreamError(error) {
  console.log('navigator.getUserMedia error: ', error);
}

// Initializes media stream
async function initializeMediaStream(constraints) {
  let stream;
  try {
    stream = await navigator.mediaDevices.getUserMedia(constraints);
    gotLocalMediaStream(stream);
  } catch (error) {
    handleLocalMediaStreamError(error);
  }
}

initializeMediaStream(mediaStreamConstraints);
