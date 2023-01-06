import { logError } from './utils.js';
import { socket } from './socket';

/**
 * WebRTC peer connection and data channel
 */
class Peer {
  constructor() {
    this.isInitiator = false;
    this.peerConn = null;
    this.dataChannel = null;
    this.files = [];
    this.queue = [];
    this.paused = false;
  }

  #configuration = {
    'iceServers': [{
      'urls': 'stun:stun.l.google.com:19302'
    }]
  };

  /**
   *
   * @param {boolean} isInitiator
   * Sets the app as the one that created the app or as the second client.
   */
  setInitiator(isInitiator) {
    this.isInitiator = isInitiator;
  }

  /**
   *
   * @param {string} message
   * Send the message to the subscribed peers through socket.io.
   */
  sendMessage(message) {
    console.log('Peer sending message:', message);
    socket.emit('message', message);
  }

  async signalingMessageCallback(message) {
    if (message.type === 'offer') {
      console.log('Got offer. Sending answer to peer.');
      try {
        await this.peerConn.setRemoteDescription(message);
        const answer = await this.peerConn.createAnswer();
        console.log('Local session created with description:', message);
        await this.peerConn.setLocalDescription(answer);
        console.log(`Sending local description: ${this.peerConn.localDescription}`);
        this.sendMessage(this.peerConn.localDescription);
      } catch (e) {
        logError(e);
      }
    } else if (message.type === 'answer') {
      console.log('Got answer with message:', message);
      await this.peerConn.setRemoteDescription(message);
    } else if (message.type === 'candidate') {
      console.log('Got candidate with message:', message);
      this.peerConn.addIceCandidate(
        new RTCIceCandidate({
          candidate: message.candidate,
          sdpMLineIndex: message.label,
          sdpMid: message.id
        })
      );
    }
  }

  async createPeerConnection() {
    console.log(`Creating a peer connection as initiator? ${this.isInitiator}, with config ${this.#configuration}`)
    this.peerConn = new RTCPeerConnection(this.#configuration);

    if (this.isInitiator) {
      console.log('Initiator peer creating a new Data Channel.');
      this.dataChannel = this.peerConn.createDataChannel('data-channel');
      this.dataChannel.binaryType = 'arraybuffer';

      this.onDataChannelCreated(this.dataChannel);

      console.log('Creating an offer.');

      try {
        const offer = await this.peerConn.createOffer();
        console.log('created offer', offer);
        await this.peerConn.setLocalDescription(offer);
        console.log('sending local description:', this.peerConn.localDescription);
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

    this.peerConn.onicecandidate = async (e) => {
      console.log('icecandidate event:',e);

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
    }
  }

  onDataChannelCreated(dataChannel) {
    console.log('Setting onDataChannelCreated handlers', dataChannel);

    dataChannel.onopen = () => {
      console.log(`${dataChannel} channel opened`);
    }

    dataChannel.onclose = () => {
      console.log(`${dataChannel} channel closed`);
    }

    dataChannel.onmessage = this.receiveDataFactory();
  }

  // Factory for the `onmessage` listener. When a peer will send a new file,
  // the first message will be a stringified object . The next ones are the actual data.
  receiveDataFactory() {
    let buf;
    let count;
    let dataInfo;

    return (e) => {
      // Sending peer will send the size of the buffer and mime
      // before sending the data.
      console.log('****** \n ONMESSAGE', e);
      if (typeof e.data === 'string') {
        dataInfo = JSON.parse(e.data);
        // Create a buffer for the next data.
        buf = new Uint8ClampedArray(parseInt(dataInfo.size));
        count = 0;
        console.log(`Expecting a total of ${buf.byteLength} bytes`);

        document.dispatchEvent(new CustomEvent('initdatatransfer', {
          detail: {
            name: dataInfo.name,
            size: dataInfo.size,
            type: dataInfo.type
          }
        }));

        return;
      }

      const data = new Uint8ClampedArray(e.data);
      buf.set(data, count);

      count += data.byteLength;
      console.log(`Received data count: ${count}`);

      if (count === buf.byteLength) {
        this.getCompleteFile(buf, dataInfo);
      }
    }
  }

  async setFiles(file) {
    this.files.push(file);
    await this.createFilePreview(file);
  }

  // Add data to the queue and send it to the peer if not paused.
  // Otherwise cache it and wait for the buffer to be low.
  // Wrapper for the `dataChannel.send` to add the data queueing capability.
  send(data) {
    this.queue.push(data);

    if (this.paused) {
      return;
    }

    this.shiftQueue();
  }

  // Handles the buffered querer according to the `bufferedamount`,
  // this way the browser doesn't overflow the channel when sending big files.
  shiftQueue() {
    this.paused = false;
    let message = this.queue.shift();

    while (message) {
      if (this.dataChannel.bufferedAmount && this.dataChannel.bufferedAmount > 65535) {
        this.paused = true;
        this.queue.unshift(message);

        const onBufferedAmountLow = () => {
          this.dataChannel.removeEventListener('bufferedamountlow', onBufferedAmountLow);
          this.shiftQueue();
        }

        this.dataChannel.addEventListener('bufferedamountlow', onBufferedAmountLow);
        return;
      }

      try {
        this.dataChannel.send(message);
        message = this.queue.shift();
      } catch (e) {
        logError(e);
      }
    }
  }

  async sendFiles() {
    // Split data in chunks of maximum allowed in the webRTC spec, 64 KiB.
    const CHUNK_LEN = 65535;
    const previewContainer = document.getElementById('preview');

    this.files.forEach(async (file, i) => {
      const isLastElement = (i === this.files.length - 1);

      const fileBuffer = await file.arrayBuffer();
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

      document.dispatchEvent(new CustomEvent('initdatatransfer', {
        detail: {
          name: file.name,
          size: file.size,
          type: file.type
        }
      }));

      // Send first message with file buffer length
      this.send(JSON.stringify({
        name: file.name,
        size: file.size,
        type: file.type
      }));

      // Send the chunks
      for (let i = 0; i < nChunks; i++) {
        const start = i * CHUNK_LEN;
        const end = (i + 1) * CHUNK_LEN;
        // Start is inclusive, end is exclusive
        this.send(buffer.subarray(start, end));
      }

      // Send the remainder, if any.
      if (bufferLen % CHUNK_LEN) {
        console.log(`Last ${bufferLen % CHUNK_LEN} byte(s)`);
        this.send(buffer.subarray(nChunks * CHUNK_LEN));
      }

      // Advance the file preview container to center the download item in the middle.
      if (!isLastElement) {
        const previewStyle = window.getComputedStyle(previewContainer);
        const cssTransformMatrix = new WebKitCSSMatrix(previewStyle.transform);
        cssTransformMatrix.translateSelf(-120, 0, 0);
        previewContainer.style.transform = cssTransformMatrix;
      }
    });
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

  getCompleteFile(data, info) {
    const fileBuffer = new Uint8Array(data);
    const blob = new Blob([fileBuffer], { type: info.type });

    this.downloadFile(blob, info.name);
  }
}

export const peer = new Peer();
