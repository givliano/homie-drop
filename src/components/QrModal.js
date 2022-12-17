import { useEffect, useState } from 'react';

export const QrModal = ({ img, active }) => {
  return (
    <div className={`modal-wrapper ${active}`}>
      <button className="btn-close">X</button>
      <img src={img} />
    </div>
  );
}
