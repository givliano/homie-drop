import { peer } from '../lib/peer';

export const SendButton = () => {
  return (
    <div>
      <button
        className='send-button'
        onClick={() => peer.sendFiles()}
      >
        Send
      </button>
    </div>
  )
}
