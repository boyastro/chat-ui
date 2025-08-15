import React from "react";

const CoinIcon = ({ size = 14 }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    style={{ verticalAlign: "middle", marginLeft: "3px" }}
  >
    <circle
      cx="12"
      cy="12"
      r="10"
      fill="#ffe066"
      stroke="#bfa100"
      strokeWidth="2"
    />
    <text
      x="12"
      y="16"
      textAnchor="middle"
      fontSize="12"
      fontWeight="bold"
      fill="#bfa100"
    >
      ₵
    </text>
  </svg>
);

export default CoinIcon;
