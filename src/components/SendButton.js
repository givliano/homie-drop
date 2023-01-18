import { peer } from '../lib/peer';

export const SendButton = () => {
  return (
    <>
      <button
        className='send-button'
        onClick={() => peer.sendFiles()}
      >
        send file(s)
      </button>
    </>
  )
}
