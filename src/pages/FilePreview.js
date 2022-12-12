export const FilePreview = ({ active = '', multipleFiles }) => {
  const adjustWrapper = multipleFiles ? 'adjust-wrapper' : '';

  return (
    <div className={`file-preview__wrapper ${active} ${adjustWrapper}`}>
      <div id='preview' className={adjustWrapper}></div>
    </div>
  );
}
