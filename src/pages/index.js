import { useState, useEffect } from 'react';
import { randomToken } from '../lib/utils';
import { peer } from '../lib/peer';
import socket from '../lib/socket';

import { FilePicker } from './FilePicker';
import { LinkShare } from './LinkShare';
import { SendButton }from './SendButton';
import { FilePreview } from './FilePreview';

function HomePage() {
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [isInitiator, setIsInitiator] = useState(false);
  const [lastPong, setLastPong] = useState(null);
  const [hasFiles, setHasFiles] = useState(false);

  useEffect(() => {
    let room = window.location.hash.substring(1);
    if (!room) {
      room = window.location.hash = randomToken();
    }

    socket.on('connect', () => {
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('ipaddr', (ipAddr) => {
      console.log(`Server IP address is: ${ipAddr}`);
    });

    socket.on('created', (room, cliendId) => {
      console.log(`Created room ${room} - my cliend ID is ${cliendId}`);
      setIsInitiator(true);
      peer.setInitiator(true);
    });

    socket.on('joined', (room, clientId) => {
      console.log(`This peer has joined room ${room}, with cliendId ${clientId}`);
      setIsInitiator(false);
      peer.setInitiator(false);
      peer.createPeerConnection();
    });

    socket.on('full', (room) => {
      alert(`Room ${room} is full. We wil create a new room for you.`);
      window.location.hash = '';
      window.location.reload();
    });

    socket.on('ready', () => {
      console.log('Socket is ready');
      peer.createPeerConnection();
    });

    socket.on('log', (array) => {
      console.log.apply(console, array);
    });

    socket.on('message', (message) => {
      console.log('Client received message: ', message);
      peer.signalingMessageCallback(message);
    });

    socket.on('disconnect', (reason) => {
      console.log('Disconnected: ', reason);
      // sendBtn.disabled = true;
      // snapAndSendBtn.disabeld = true;
    });

    socket.on('bye', (room) => {
      console.log(`Peer leaving room ${room}`);
      // sendBtn.disabled = true;
      // snapAndSendBtn.disabled = true;

      // If peer did not create the room, re-enter to be creator.
      if (!isInitiator) {
        window.location.reload();
      }
    });

    socket.emit('create or join', room);

    if (location.hostname.match(/localhost|127\.0\.0/)) {
      socket.emit('ipAddr');
    }

    return () => {
      console.log(`Unloading window. Notifying peers in room`);
      socket.emit('bye', room);
      socket.off('connect');
      socket.off('disconnect');
      socket.off('ipaddr');
      socket.off('created');
      socket.off('joined');
      socket.off('full');
      socket.off('ready');
      socket.off('log');
      socket.off('message');
      socket.off('disconnect');
      socket.off('bye');
      socket.leave(room);
    }
  }, []);

  useEffect(() => console.log('HAS FILES', hasFiles), [hasFiles]);

  const handleChange = async (e) => {
    for (const file of e.target.files) {

      if (!(file.type.startsWith('image/') || file.type.startsWith('video/'))) {
        console.warn('File not supported: only images and videos can be shared.');
        return;
      }

      await peer.setFiles(file);
    }

    setHasFiles(true);
  }

  return (
    <div className='container'>
      <h1>opendrop</h1>

      {!hasFiles
        ? <div className='file-wrapper'><FilePreview /><FilePicker onChange={handleInputChange} active='active' /> </div>
        : <div className='file-wrapper'><FilePreview active='active' /><FilePicker onChange={handleInputChange} /> </div>
      }

      {hasFiles && <SendButton />}
      {/* <SendButton /> */}

      <LinkShare active={hasFiles} />
    </div>
  );
}

export default HomePage;
