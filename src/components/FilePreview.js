import { useEffect, useState } from "react";
import { useTransferProgress } from '../hooks/useTransferProgress';
import { useInitTransfer } from '../hooks/useInitTransfer';

export const FilePreview = ({ active = '', multipleFiles, transferring }) => {
  const adjustWrapper = multipleFiles ? 'adjust-wrapper' : '';

  const fileInfo = useInitTransfer();
  // Gets the byte size of the received message from the channel.
  const transferProgress = useTransferProgress();
  // Holds the percentage of the amount transferred compared to the total size.
  const [percentage, setPercentage] = useState(0);

  const handleProgress = () => {
    // Float multiplication is very annoying sometimes. Fixing the decimal
    // for last is necessary so it doesn't generate many decimals points.
    setPercentage((transferProgress / fileInfo.size * 100).toFixed(2));
  }

  useEffect(() => {
    if (!fileInfo) {
      return;
    }

    handleProgress();
  }, [transferProgress])

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
