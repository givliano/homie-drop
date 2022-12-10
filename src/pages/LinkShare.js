export function LinkShare({ active }) {
  return (
    <div className={`linkShare ${active === true ? 'active' : ''}`}>
      <div className="link url">
        <span className="link-text">Share URL</span>
      </div>
      <div className="link qrcode">
        <span className="link-text">QR Code</span>
      </div>
    </div>
  );
}
