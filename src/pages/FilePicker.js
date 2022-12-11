export function FilePicker({ onChange, active='' }) {
  return (
    <div className={`file-picker__wrapper ${active}`}>
      <div className='file-picker__info-container'>
        <p className='file-picker__info-text'>Drag your photos and videos here</p>
        <p className='file-picker__info-text'>Or click on this area</p>
      </div>
      <input
        className='file-picker__input'
        type='file'
        id='input'
        multiple
        onChange={onChange}
      />
    </div>
  )
}
