import { useEffect, useState } from "react";

export function useTransferProgress() {
  const [progress, setProgress] = useState(0);

  function handleProgress(progress) {
    setProgress(progress);
  }

  useEffect(() => {
    document.addEventListener('transferprogress', ({ detail }) => {
      handleProgress(detail.progress);
    });

    return () => {
      document.removeEventListener('transferprogress');
    };
  }, []);

  return progress;
}
