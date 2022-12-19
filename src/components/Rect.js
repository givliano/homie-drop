const Rect = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="rect" viewBox="0 0 300 200">
    <defs>
      <mask id="rect-mask" className="rect" maskUnits="userSpaceOnUse">
        <rect id="mask-path" width="300" height="200" x="2" y="2" />
      </mask>
    </defs>
    <g mask="url(#rect-mask)">
      <rect id="dashed-path" className="rect" width="300" height="200" x="2" y="2">
        {/* <animate attributeName="stroke" values="red;blue;red" dur="10s" repeatCount="indefinite" /> */}
      </rect>
      {/* <rect id="dashed-path-2" className="rect" width="300" height="200" x="2" y="2"/> */}
      {/* <rect id="dashed-path-3" className="rect" width="300" height="200" x="2" y="2"/> */}
      {/* <rect id="dashed-path-4" className="rect" width="300" height="200" x="2" y="2"/> */}
    </g>
  </svg>
);

export { Rect };
