import React from "react";

/**
 * Reusable lightweight SVG Donut Chart with Beige theme support
 */
export default function DonutChart({
  size = 148,
  strokeWidth = 18,
  data = [],
  total = 0,
}) {
  const radius = (size - strokeWidth) / 2;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;

  const validData = data.filter((d) => d.value > 0);
  const sum = validData.reduce((acc, cur) => acc + cur.value, 0) || 1;

  let accumulatedPercent = 0;

  return (
    <div className="donut-chart-wrapper" style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Background track circle using theme border-subtle */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="var(--border-subtle, #F5E6CA)"
          strokeWidth={strokeWidth}
        />

        {/* Dynamic Colored Slices */}
        {validData.map((item, index) => {
          const percent = item.value / sum;
          const strokeDasharray = `${percent * circumference} ${circumference}`;
          const strokeDashoffset = -accumulatedPercent * circumference;
          accumulatedPercent += percent;

          return (
            <circle
              key={index}
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke={item.color}
              strokeWidth={strokeWidth}
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="butt"
              transform={`rotate(-90 ${center} ${center})`}
              style={{
                transition: "stroke-dasharray 0.4s ease, stroke-dashoffset 0.4s ease",
              }}
            />
          );
        })}
      </svg>

      {/* Center Total Count */}
      <div className="donut-center-overlay">
        <span className="donut-center-value">{total}</span>
      </div>
    </div>
  );
}
