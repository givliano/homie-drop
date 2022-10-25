var configuration = {
  'iceServers': [{
    'urls': 'stun:stun.l.google.com:19302'
  }]
};

class Peer {
  constructor() {
    isInitiator = false;
    peerConn = null;
    dataChannel = null;
  }

  createPeerConnection(isInitiator, config) {
    console.log(`Creating a peer connection as initiator? ${isInitiator}, with config ${config}`)
    this.peerConn = new RTCPeerConnection(config);
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

    if (this._isInitiator) {
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
        this.renderBuf(buf);
      }
    }
  }
}