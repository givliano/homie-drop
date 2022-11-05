import { logError } from './utils.js';

/**
 * WebRTC peer connection and data channel
 */
export default class Peer {
  constructor() {
    this.isInitiator = false;
    this.peerConn = null;
    this.dataChannel = null;
    this.files = [];
  }

  #configuration = {
    'iceServers': [{
      'urls': 'stun:stun.l.google.com:19302'
    }]
  };

  setIntiator(isInitiator) {
    this.isInitiator = isInitiator;
  }

  /**
   *
   * @param {*} message
   */
  sendMessage(message) {
    console.log('Peer sending message:', message);
    window.socket.emit('message', message);
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

      // if (this.isInitiator) {
      //   console.log('Initiator peer creating a new Data Channel.');
      //   this.dataChannel = this.peerConn.createDataChannel('data-channel');
      //   this.dataChannel.binaryType = 'arraybuffer';

      //   this.onDataChannelCreated(this.dataChannel);

      //   console.log('Creating an offer.');

      //   try {
      //     const offer = await this.peerConn.createOffer();
      //     console.log('created offer', offer);
      //     this.peerConn.setLocalDescription(offer);
      //     console.log('sending local description:', this.peerConn.localDescription);
      //     this.sendMessage(this.peerConn.localDescription);
      //   } catch (e) {
      //     logError(e);
      //   }
      // } else {
      //   this.peerConn.ondatachannel = (e) => {
      //     console.log('ondatachannel handler', e.channel);
      //     this.dataChannel = e.channel;

      //     this.onDataChannelCreated(this.dataChannel);
      //   }
      // }
    }
  }

  onDataChannelCreated(dataChannel) {
    console.log('Setting onDataChannelCreated handlers', dataChannel);

    dataChannel.onopen = () => {
      console.log(`${dataChannel} channel opened`);
      document.getElementById('send').disabled = false;
      document.getElementById('snapAndSend').disabled = false;
    }

    dataChannel.onclose = () => {
      console.log(`${dataChannel} channel closed`);
      document.getElementById('send').disabled = true;
      document.getElementById('snapAndSend').disabled = true;
    }

    dataChannel.onmessage = this.receiveDataFactory();
  }

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
        // {"name":"test.jpeg","size":317873,"type":"image/jpeg"}
        // Create a buffer for the next data.
        buf = new Uint8ClampedArray(parseInt(dataInfo.size));
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
        console.log(this);
        this.getCompleteFile(buf, dataInfo);
      }
    }
  }

  async setFiles(files) {
    this.files.push(files);
    await this.handleFiles();
  }

  async handleFiles(e) {
    this.files.forEach(file => {
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

  async sendPhoto() {
    // Split data in chunks of maximum allowed in the webRTC spec.
    const CHUNK_LEN = 64000;
    console.log(this);
    for (const file of this.files) {

      const fileBuffer = await file.arrayBuffer();
      const buffer = new Uint8ClampedArray(fileBuffer);
      const bufferLen = buffer.byteLength;
      const nChunks = bufferLen / CHUNK_LEN | 0;

      console.log('****');
      console.log(this.files[0])
      console.log(fileBuffer);
      console.log(buffer);
      // const fileData = {
        // name: f
      // }

      console.log(`Sending a total of ${bufferLen} byte(s).`);

      if (!this.dataChannel) {
        logError('Connection has not been initiated. ' + 'Get two peers in the same room first');
        return;
      } else if (this.dataChannel.readyState === 'closed') {
        logError('Connection was lost. Peer closed the connection.');
        return;
      }

      // Send first message with file buffer length
      this.dataChannel.send(JSON.stringify({
        name: file.name,
        size: file.size,
        type: file.type
      }));

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
        this.dataChannel.send(buffer.subarray(n * CHUNK_LEN));
      }
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

  getCompleteFile(data, info) {
    const fileBuffer = new Uint8Array(data);
    const blob = new Blob([fileBuffer], { type: info.type });

    this.downloadFile(blob, info.name);
  }
}