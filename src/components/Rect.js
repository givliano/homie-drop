import { useRef } from 'react';
import { animate } from '../lib/utils';

const Rect = () => {
  const blueRect = useRef(null);
  const maskRect = useRef(null);
  const pinkRect = useRef(null);
  const dashLength = 1000;

  // function initRect() {
    // const curLength = blueRect.current.style.strokeDashoffset;
    // const delta = dashLength - curLength

    function animateEl(el, duration) {
      if (el !== null) {
        animate({
          duration,
          timing(timeFraction) {
            return timeFraction;
          },
          draw(progress) {
            el.style.strokeDashoffset = (1000 - progress*1000);
          }
        });
      }
    }

    if (typeof window !== 'undefined') {
      animateEl(maskRect.current, 1000);

      // animate({
      //   duration: 1000,
      //   timing(timeFraction) {
      //     return timeFraction;
      //   },
      //   draw(progress) {
      //     // el.style.strokeDashoffset = progress * 1000 + 7;
      //     // pinkRect.current.style.strokeDasharray = (15 - progress * 15) + ', ' + (10 - progress * 10); // 250 is the distance in px that i want
      //     pinkRect.current.style.strokeDasharray = (30 - progress * 30) + ', ' + (30 - progress * 30); // 250 is the distance in px that i want
      //   }
      // });



      setTimeout(() => {
        blueRect.current.style.opacity = 1;

        animate({
          duration: 200,
          timing(timeFraction) {
            return timeFraction;
          },
          draw(progress) {
            // el.style.strokeDashoffset = progress * 1000 + 7;
            blueRect.current.style.strokeDashoffset = (1000 - progress*250); // 250 is the distance in px that i want
          }
        });
      }, 2000);
    }
    // }
    // setTimeout(() => blueRect.current.style.dash)

  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="rect" viewBox="0 0 300 200">
      <defs>
        <mask id="rect-mask" className="rect" maskUnits="userSpaceOnUse">
          <rect id="mask-path" ref={maskRect} width="300" height="200" x="2" y="2" />
        </mask>
      </defs>
      <g mask="url(#rect-mask)">
        <rect id="dashed-path-2" ref={pinkRect} className="rect" width="300" height="200" x="2" y="2"/>
        <rect id="dashed-path" ref={blueRect} className="rect" width="300" height="200" x="2" y="2" />
        {/* <rect id="dashed-path-3" className="rect" width="300" height="200" x="2" y="2"/> */}
        {/* <rect id="dashed-path-4" className="rect" width="300" height="200" x="2" y="2"/> */}
      </g>
    </svg>
  )
};

export { Rect };
