import { useEffect, useState } from "react";

import { useTransferProgress } from '../hooks/useTransferProgress';
import { useInitTransfer } from '../hooks/useInitTransfer';
import { SendButton }from '../components/SendButton';

export const FilePreview = ({ active = '', transferring }) => {
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
    <div className={`file-preview__wrapper ${active}`}>
      <div id='preview'>
        {
          fileInfo ?
            <>
              <div className="file-transfer__progress">
                <div>Transfer Progress:</div>
                <div>{percentage}%</div>
              </div>
              <div className="file-transfer__name">
                <div>File Name:</div>
                <div>{fileInfo.name}</div>
              </div>
            </> :
            <SendButton />
        }
      </div>
    </div>
  );
}
