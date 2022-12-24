import { useEffect, useRef } from 'react';
import { animate } from '../lib/utils';

const Rect = () => {
  const blueRect = useRef(null);
  const maskRect = useRef(null);
  const pinkRect = useRef(null);

  function animatePath(el, distance) {
    if (el !== null) {
      animate({
        duration: 200,
        timing(timeFraction) {
          return timeFraction;
        },
        draw(progress) {
          el.style.strokeDashoffset = (-1000 - (progress * distance));
        }
      });
    }
  }

    if (typeof window !== 'undefined') {
      useEffect(() => {

        setTimeout(() => {
          blueRect.current.style.opacity = 1;
          animatePath(blueRect.current, 500);
        }, 2000);
      }, [])
    }

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
