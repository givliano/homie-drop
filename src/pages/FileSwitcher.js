import { FilePicker } from './FilePicker';
import { FilePreview } from './FilePreview';

export const FileSwitcher = ({ hasFiles, onChange }) => {
  return (
    hasFiles ?
      <div className='file-wrapper'>
        <FilePreview active='active' />
        {/* <FilePicker onChange={onChange} /> */}
      </div> :
      <div className='file-wrapper'>
        <FilePreview />
        <FilePicker onChange={onChange} active='active' />
      </div>
  );
}
