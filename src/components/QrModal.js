import { useEffect, useState } from 'react';
import { Kjua } from 'react-kjua';

export const QrModal = ({ active }) => {
  const [url, setUrl] = useState(null);

  useEffect(() => {
    setUrl(window.location.href);
  }, []);

  return (
    <div className={`modal-wrapper ${active}`}>
      <button className="btn-close">X</button>
      { url && <Kjua text={url} /> }
    </div>
  );
}
