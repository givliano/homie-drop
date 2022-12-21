import { useState, useEffect, useRef } from 'react';
import { peer } from '../lib/peer';
import { socket } from '../lib/socket';

import { LinkShare } from '../components/LinkShare';
import { SendButton }from '../components/SendButton';
import { FileSwitcher } from '../components/FileSwitcher';
import { QrModal } from '../components/QrModal';
import { Rect } from '../components/Rect';
import { initSocket } from '../lib/initSocket';

function HomePage() {
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [isInitiator, setIsInitiator] = useState(false);
  const [hasFiles, setHasFiles] = useState(false);
  const [moreThanThreeFiles, setMoreThanThreeFiles] = useState(false);
  const [renderQrCode, setRenderQrCode] = useState(false);
  const modal = useRef();

  useEffect(() => {
    const useSocket = initSocket(setIsConnected, setIsInitiator, isInitiator);
    return useSocket;
  }, []);

  const handleQrRender = () => {
    if (renderQrCode === false) {
      setRenderQrCode(true);
    } else {
      setRenderQrCode(false)
    }
  }

  const handleInputChange = async (e) => {
    for (const file of e.target.files) {

      if (!(file.type.startsWith('image/') || file.type.startsWith('video/'))) {
        console.warn('File not supported: only images and videos can be shared.');
        return;
      }

      await peer.setFiles(file);
    }

    setHasFiles(true);

    if (e.target.files.length > 2) {
      setMoreThanThreeFiles(true);
    }
  }

  const handleModalClick = () => {
    modal.current.classList.remove('active');
    handleQrRender();
  }

  return (
    <div className="wrapper">
      <div className={"container"}>
        <div className={`bg-filter ${renderQrCode ? 'active' : ''}`} onClick={handleModalClick} ref={modal}></div>
        <h1>opendrop</h1>

        <div className="media">
          <Rect />
          <div className="file-wrapper">
            <FileSwitcher hasFiles={hasFiles} onChange={handleInputChange} multipleFiles={moreThanThreeFiles} />
          </div>
        </div>

        {hasFiles && <SendButton />}

        <LinkShare active={hasFiles} onClick={handleQrRender} />
      </div>
      <QrModal active={renderQrCode ? 'active' : ''} />
    </div>
  );
}

export default HomePage;
