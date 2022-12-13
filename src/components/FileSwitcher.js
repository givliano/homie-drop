import { FilePicker } from './FilePicker';
import { FilePreview } from './FilePreview';

export const FileSwitcher = ({ hasFiles, onChange, multipleFiles }) => {
  return (
    hasFiles ?
      <div className='file-wrapper'>
        <FilePreview active='active' multipleFiles={multipleFiles} />
        {/* <FilePicker onChange={onChange} /> */}
      </div> :
      <div className='file-wrapper'>
        <FilePreview />
        <FilePicker onChange={onChange} active='active' />
      </div>
  );
}
