import { useEffect, useState } from 'react';
import { Kjua } from 'react-kjua';

export const QrModal = ({ active, closeButtonClick }) => {
  const [url, setUrl] = useState(null);

  useEffect(() => {
    setUrl(window.location.href);
  }, []);

  return (
    <div className={`modal-wrapper ${active}`}>
      <button className="btn-close" onClick={closeButtonClick}>
        <svg width="20" height="20" xmlns="http://www.w3.org/2000/svg">
          <path stroke="white" d="M 0 0 L 20 20 M 20 0 L 0 20" />
        </svg>
      </button>
      { url && <Kjua text={url} back='#ebe8ff' quiet='2'/> }
    </div>
  );
}
