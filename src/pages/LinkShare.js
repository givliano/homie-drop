export function LinkShare({ active }) {
  return (
    <div className={`linkShare ${active === true ? 'active' : ''}`}>
      <div className="link url">
        <span>Share URL</span>
      </div>
      <div className="link qrcode">
        <span>QR Code</span>
      </div>
    </div>
  );
}
