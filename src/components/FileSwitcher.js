import { FilePicker } from './FilePicker';
import { FilePreview } from './FilePreview';
import { useInitTransfer } from '../hooks/useInitTransfer';

export const FileSwitcher = ({ hasFiles, onChange }) => {

  return (
    (hasFiles) ?
      <>
        <FilePreview active='active' />
      </> :
      <>
        <FilePreview />
        <FilePicker onChange={onChange} active='active' />
      </>
  );
}
