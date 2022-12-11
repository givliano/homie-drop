export const SendButton = () => {
  return (
    <div>
      <button
        className='send-button'
        onClick={() => peer.sendPhoto()}
      >
        Send
      </button>
    </div>
  )
}
