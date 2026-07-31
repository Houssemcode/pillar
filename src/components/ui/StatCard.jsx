/**
 * StatCard — a metric card with an optional colored accent.
 * Uses --color-primary for the accent line/value.
 */
export default function StatCard({ label, value, sub, icon, accent = false, style }) {
  return (
    <div
      className={`card ${accent ? 'card-accent' : ''}`}
      style={{ display: 'flex', flexDirection: 'column', gap: 8, ...style }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 12, color: 'var(--color-text-muted)', fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
          {label}
        </span>
        {icon && (
          <span style={{ color: accent ? 'var(--color-primary)' : 'var(--color-text-muted)', opacity: 0.8 }}>
            {icon}
          </span>
        )}
      </div>
      <div style={{ fontSize: 28, fontWeight: 700, color: accent ? 'var(--color-primary)' : 'var(--color-text)', letterSpacing: '-0.5px' }}>
        {value}
      </div>
      {sub && (
        <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
          {sub}
        </div>
      )}
    </div>
  )
}
