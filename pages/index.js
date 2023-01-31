import { useState, useEffect, useRef } from 'react';
import { peer } from '../src/lib/peer';
import { socket } from '../src/lib/socket';

import { LinkShare } from '../src/components/LinkShare';
import { FileSwitcher } from '../src/components/FileSwitcher';
import { QrModal } from '../src/components/QrModal';
import { Rect } from '../src/components/Rect';
import { initSocket } from '../src/lib/initSocket';

function HomePage() {
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [isInitiator, setIsInitiator] = useState(false);
  const [hasFiles, setHasFiles] = useState(false);
  const [renderQrCode, setRenderQrCode] = useState(false);
  const modal = useRef();

  useEffect(() => {
    const useSocket = initSocket(setIsConnected, setIsInitiator, isInitiator);
    return useSocket;
  }, []);

  const handleQrRender = () => {
    (renderQrCode === false) ? setRenderQrCode(true) : setRenderQrCode(false);
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
            <FileSwitcher hasFiles={hasFiles} onChange={handleInputChange} />
          </div>
        </div>

        <LinkShare active={hasFiles} onClick={handleQrRender} />
      </div>
      <QrModal active={renderQrCode ? 'active' : ''} closeButtonClick={handleModalClick} />
    </div>
  );
}

export default HomePage;
