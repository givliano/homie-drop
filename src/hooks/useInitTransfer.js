import { useEffect, useState } from "react";

export function useInitTransfer() {
  const [fileInfo, setFileInfo] = useState(null);

  function handleTransferring({ detail }) {
    setFileInfo(detail);
  }

  useEffect(() => {
    document.addEventListener('transfer:init', handleTransferring);

    return () => {
      document.removeEventListener('transfer:init', handleTransferring);
    };
  }, [fileInfo]);

  return fileInfo;
}
