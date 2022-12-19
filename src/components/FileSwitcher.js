import { FilePicker } from './FilePicker';
import { FilePreview } from './FilePreview';
import { Rect } from './Rect';

export const FileSwitcher = ({ hasFiles, onChange, multipleFiles }) => {
  return (

    hasFiles ?
      <div className='file-wrapper'>
        <Rect />
        <FilePreview active='active' multipleFiles={multipleFiles} />
        {/* <FilePicker onChange={onChange} /> */}
      </div> :
      <div className='file-wrapper'>
        <Rect />
        <FilePreview />
        <FilePicker onChange={onChange} active='active' />
      </div>
  );
}
