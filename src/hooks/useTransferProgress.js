import { useEffect, useState } from "react";

export function useTransferProgress() {
  const [progress, setProgress] = useState(0);

  function handleProgress({ detail }) {
    setProgress(p => p + detail.progress);
  }

  useEffect(() => {
    document.addEventListener('transfer:progress', handleProgress);

    return () => {
      document.removeEventListener('transfer:progress', handleProgress);
    };
  }, []);

  return progress;
}
