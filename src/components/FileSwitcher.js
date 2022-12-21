import { FilePicker } from './FilePicker';
import { FilePreview } from './FilePreview';

export const FileSwitcher = ({ hasFiles, onChange, multipleFiles }) => {
  return (

    hasFiles ?
      <>
        <FilePreview active='active' multipleFiles={multipleFiles} />
      </> :
      <>
        <FilePreview />
        <FilePicker onChange={onChange} active='active' />
      </>
  );
}
