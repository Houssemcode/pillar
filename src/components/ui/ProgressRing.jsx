/**
 * ProgressRing — SVG circular progress indicator
 * Driven by --color-primary CSS variable
 */
export default function ProgressRing({
  radius = 40,
  strokeWidth = 6,
  progress = 0,      // 0–100
  color = 'var(--color-primary)',
  trackColor = 'var(--color-surface-3)',
  children,
  size,
  className = '',
  style = {},
}) {
  const r = radius - strokeWidth / 2
  const circumference = 2 * Math.PI * r
  const offset = circumference - (progress / 100) * circumference
  const svgSize = size || radius * 2

  return (
    <div
      className={className}
      style={{
        position: 'relative',
        width: svgSize,
        height: svgSize,
        flexShrink: 0,
        ...style,
      }}
    >
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${svgSize} ${svgSize}`}
        style={{ transform: 'rotate(-90deg)', display: 'block' }}
      >
        {/* Track */}
        <circle
          cx={svgSize / 2}
          cy={svgSize / 2}
          r={r}
          fill="none"
          stroke={trackColor}
          strokeWidth={strokeWidth}
        />
        {/* Progress arc */}
        <circle
          cx={svgSize / 2}
          cy={svgSize / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 600ms cubic-bezier(0.4,0,0.2,1)' }}
        />
      </svg>
      {children && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {children}
        </div>
      )}
    </div>
  )
}
