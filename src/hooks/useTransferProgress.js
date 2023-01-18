import { useEffect, useState } from "react";

export function useTransferProgress() {
  const [progress, setProgress] = useState(0);

  function handleProgress({ detail }) {
    if (detail.progress === 0) {
      setProgress(0);
      return;
    }

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
