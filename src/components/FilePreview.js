
export const FilePreview = ({ active = '', multipleFiles, transferring }) => {
  const adjustWrapper = multipleFiles ? 'adjust-wrapper' : '';

  return (
    <div className={`file-preview__wrapper ${active} ${adjustWrapper}`}>
      <div id='preview' className={adjustWrapper}>{transferring &&
        <>
          <div>Percentage: 0</div>
          <div>{transferring.name}</div>
          <div>{transferring.size}</div>
          <div>{transferring.type}</div>
        </>
      }</div>
    </div>
  );
}
