import { FilePicker } from './FilePicker';
import { FilePreview } from './FilePreview';
import { Square } from './svg';

export const FileSwitcher = ({ hasFiles, onChange, multipleFiles }) => {
  return (

    hasFiles ?
      <div className='file-wrapper'>
        <Square />
        <FilePreview active='active' multipleFiles={multipleFiles} />
        {/* <FilePicker onChange={onChange} /> */}
      </div> :
      <div className='file-wrapper'>
        <Square />
        <FilePreview />
        <FilePicker onChange={onChange} active='active' />
      </div>
  );
}
