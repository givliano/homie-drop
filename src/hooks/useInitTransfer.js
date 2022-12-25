import { useEffect, useState } from "react";

export function useInitTransfer() {
  const [transferring, setTransferring] = useState(null);

  function handleTransferring(data) {
    setTransferring(data);
  }

  useEffect(() => {
    document.addEventListener('initdatatransfer', ({ detail }) => {
      handleTransferring(detail);
    });

    return () => {
      document.removeEventListener('initdatatransfer');
    };
  }, []);

  return transferring;
}
