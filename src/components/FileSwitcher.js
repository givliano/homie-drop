import { FilePicker } from './FilePicker';
import { FilePreview } from './FilePreview';
import { useInitTransfer } from '../hooks/useInitTransfer';

export const FileSwitcher = ({ hasFiles, onChange }) => {
  // Handles the receiving side rendering the right component.
  const fileInfo = useInitTransfer();

  return (
    (hasFiles || fileInfo) ?
      <>
        <FilePreview active='active' />
      </> :
      <>
        <FilePreview transferring={fileInfo} />
        <FilePicker onChange={onChange} active='active' />
      </>
  );
}
