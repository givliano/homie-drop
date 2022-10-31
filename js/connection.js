import { logError } from './utils.js';

/**
 * WebRTC peer connection and data channel
 */
export default class Peer {
  constructor(isInitiator, peerConn, dataChannel) {
    isInitiator = false;
    peerConn = null;
    dataChannel = null;
  }

  #configuration = {
    'iceServers': [{
      'urls': 'stun:stun.l.google.com:19302'
    }]
  };

  setIntiator(isInitiator) {
    this.isInitiator = isInitiator;
  }

  signalingMessageCallback(message) {
    if (message.type === 'offer') {
      console.log('Got offer. Sending answer to peer.');
      this.peerConn.setRemoteDescription(
        new RTCSessionDescription(message),
        function() {},
        logError
      );
      this.peerConn.createAnswer(this.onLocalSessionCreated, logError)
    } else if (message.type === 'answer') {
      console.log('Got anwswer.');
      this.peerConn.setRemoteDescription(
        new RTCSessionDescription(message),
        function() {},
        logError
      );
    } else if (message.type === 'candidate') {
      this.peerConn.addIceCandidate(
        new RTCIceCandidate({
          candidate: message.candidate,
          sdpMLineIndex: message.label,
          sdpMid: message.id
        })
      );
    }
  }

  createPeerConnection() {
    console.log(`Creating a peer connection as initiator? ${this.isInitiator}, with config ${this.#configuration}`)
    this.peerConn = new RTCPeerConnection(this.#configuration);
    this.peerConn.onicecandidate = this.onIceCandidate;
  }

  async onIceCandidate(e) {
    console.log(`icecandidate event: ${e}, looking for candidates.`);

    if (e.candidate) {
      this.sendMessage({
        type: 'candidate',
        label: e.candidate.sdpMLineIndex,
        id: e.candidate.sdpMid,
        candidate: e.candidate.candidate
      });
    } else {
      console.log('End of icecandidate candidates');
    }

    if (this.isInitiator) {
      console.log('Initiator peer creating a new Data Channel.');
      this.dataChannel = this.peerConn.createDataChannel('data-channel');
      this.dataChannel.binaryType = 'arraybuffer';

      this.onDataChannelCreated(this.dataChannel);

      console.log('Creating an offer.');

      try {
        const offer = await this.peerConn.createOffer();
        this.peerConn.setLocalDescription(offer);
        this.sendMessage(this.peerConn.localDescription);
      } catch (e) {
        logError(e);
      }
    } else {
      this.peerConn.ondatachannel = (e) => {
        console.log('ondatachannel handler', e.channel);
        this.dataChannel = e.channel;

        this.onDataChannelCreated(this.dataChannel);
      }
    }
  }

  onDataChannelCreated(dataChannel) {
    console.log('Setting onDataChannelCreated handlers', dataChannel);

    dataChannel.onopen = () => {
      console.log(`${dataChannel} channel opened`);
      sendBtn.disabled = false;
      snapAndSendBtn.disabled = false;
    }

    dataChannel.onclose = () => {
      console.log(`${dataChannel} channel closed`);
      sendBtn.disabled = true;
      snapAndSendBtn.disabled = true;
    }

    dataChannel.onmessage = this.receiveDataFactory();
  }

  async onLocalSessionCreated(description) {
    console.log(`Local session created with description: ${description}`);

    try {
      await this.peerConn.setLocalDescription(description);
      console.log(`Sending local description: ${this.peerConn.localDescription}`);
      this.sendMessage(peerConn.localDescription);
    } catch (e) {
      logError(e);
    }
  }

  receiveDataFactory() {
    let buf;
    let count;

    return function onmessage(e) {
      // Sending peer will send the size of the buffer and mime
      // before sending the data.
      if (typeof e.data === 'string') {
        // Create a buffer for the next data.
        buf = new Uint8ClampedArray(parseInt(e.data));
        count = 0;
        console.log(`Expecting a total of ${buf.byteLength} bytes`);
        return;
      }

      const data = new Uint8ClampedArray(e.data);
      buf.set(data, count);

      count += data.byteLength;
      console.log(`Received data count: ${count}`);

      if (count === buf.byteLength) {
        console.log('DONE receive file');
        this.renderPhoto(buf);
      }
    }
  }

  async sendPhoto() {
    // Split data in chunks of maximum allowed in the webRTC spec.
    const CHUNK_LEN = 64000;
    const fileBuffer = await imageFiles[0].arrayBuffer();
    const buffer = new Uint8ClampedArray(fileBuffer);
    const bufferLen = buffer.byteLength;
    const nChunks = bufferLen / CHUNK_LEN | 0;

    console.log(`Sending a total of ${bufferLen} byte(s).`);

    if (!this.dataChannel) {
      logError('Connection has not been initiated. ' + 'Get two peers in the same room first');
      return;
    } else if (this.dataChannel.readyState === 'closed') {
      logError('Connection was lost. Peer closed the connection.');
      return;
    }

    // Send first message with file buffer length
    this.dataChannel.send(bufferLen);

    // Send the chunks
    for (let i = 0; i < nChunks; i++) {
      const start = i * CHUNK_LEN;
      const end = (i + 1) * CHUNK_LEN;
      console.log(start + ' - ' + (end - 1));
      // Start is inclusive, end is exclusive
      this.dataChannel.send(buffer.subarray(start, end));
    }

    // Send the remainder, if any.
    if (bufferLen % CHUNK_LEN) {
      console.log(`Last ${bufferLen % CHUNK_LEN} byte(s)`);
    }
  }

  downloadFile(blob, fileName) {
    const link = document.createElement('a');
    const href = window.URL.createObjectURL(blob);

    link.href = href;
    link.download = fileName;
    link.click();
    window.URL.revokeObjectURL(href);
    link.remove();
  }

  getCompleteFile(data) {
    const fileBuffer = new Uint8Array(data);
    const blob = new Blob([fileBuffer], { type: 'image/jpeg' });

    this.downloadFile(blob, 'hello.jpeg');
  }
}