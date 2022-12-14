import { useEffect, useState } from 'react';

export const QrModal = ({ img }) => {
  return (
    <div className="modal-wrapper">
      <img src={img} />
      {/* {img} */}
    </div>
  );
}
