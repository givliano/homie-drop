export function LinkShare({ active }) {
  return (
    <div className={`linkShare ${active === true ? 'active' : ''}`}>
      <div className='link url'>
        <span className='link-text'>
        </span>
      </div>
      <div className='link qrcode'>
        <span className='link-text'>
        </span>
      </div>
    </div>
  );
}
