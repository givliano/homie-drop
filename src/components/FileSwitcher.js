import { FilePicker } from './FilePicker';
import { FilePreview } from './FilePreview';
import { useInitTransfer } from '../hooks/useInitTransfer';

export const FileSwitcher = ({ hasFiles, onChange, multipleFiles }) => {
  const transferring = useInitTransfer();

  return (
    (hasFiles || transferring) ?
      <>
        <FilePreview active='active' multipleFiles={multipleFiles} transferring={transferring} />
      </> :
      <>
        <FilePreview />
        <FilePicker onChange={onChange} active='active' />
      </>
  );
}
