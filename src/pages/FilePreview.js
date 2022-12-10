export const FilePreview = ({ active = '' }) => {
  return (
    <div className={`file-preview__wrapper ${active}`}>
      <div id="preview"></div>
    </div>
  )
}
