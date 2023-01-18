import { useEffect, useRef, useState } from 'react';
import { useTransferProgress } from '../hooks/useTransferProgress';
import { useInitTransfer } from '../hooks/useInitTransfer';

const INITIAL_OFFSET = 1000;

const Rect = () => {
  const blueRect = useRef(null);
  const maskRect = useRef(null);
  const pinkRect = useRef(null);

  const fileInfo = useInitTransfer();
  const transferProgress = useTransferProgress();

  const [percentage, setPercentage] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  function handleProgress() {
    setPercentage((transferProgress / fileInfo.size * 100).toFixed(2));
  }

  useEffect(() => {
    if (!fileInfo) {
      return;
    }

    handleProgress();
  }, [transferProgress]);

  useEffect(() => {
    if (!fileInfo) {
      return;
    }

    if (!isVisible) {
      blueRect.current.style.opacity = 1;
      setIsVisible(true);
    }

    blueRect.current.style.strokeDashoffset = (INITIAL_OFFSET - (10 * percentage));
    // animatePath(blueRect.current, (percentage * 10));

    if ((percentage == 0) && isVisible) {
      blueRect.current.style.strokeDashoffset = INITIAL_OFFSET;
      blueRect.current.style.opacity = 0;
      setIsVisible(false);
    }
  }, [percentage])

  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="rect" viewBox="0 0 300 200">
      <defs>
        <mask id="rect-mask" className="rect" maskUnits="userSpaceOnUse">
          <path id="mask-path" ref={maskRect} className="rect" d="M 150 0 H 300 V 200 H 0 V 0 z" />
        </mask>
      </defs>
      <g mask="url(#rect-mask)">
        <path id="dashed-path-2" ref={pinkRect} className="rect" d="M 150 0 H 300 V 200 H 0 V 0 z" />
        <path id="dashed-path" ref={blueRect} className="rect" d="M 150 0 H 300 V 200 H 0 V 0 z" />
      </g>
    </svg>
  )
};

export { Rect };
