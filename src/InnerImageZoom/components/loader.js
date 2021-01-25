import React from 'react'

const Loader = props => (
  <div className="loader-container" {...props}>
    <svg
      width={100}
      height={100}
      viewBox="0 0 38 38"
      aria-label="Loading"
    >
      <g transform="translate(1 1)" fill="none" fillRule="evenodd">
        <path className="loader-arc" d="M36 18c0-9.94-8.06-18-18-18">
          <animateTransform
            attributeName="transform"
            type="rotate"
            from="0 18 18"
            to="360 18 18"
            dur="0.9s"
            repeatCount="indefinite"
          />
        </path>
        <circle className="loader-tip" cx={36} cy={18} r={1}>
          <animateTransform
            attributeName="transform"
            type="rotate"
            from="0 18 18"
            to="360 18 18"
            dur="0.9s"
            repeatCount="indefinite"
          />
        </circle>
      </g>
    </svg>
  </div>
)

export default Loader
