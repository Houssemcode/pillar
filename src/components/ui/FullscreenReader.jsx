import { useEffect } from 'react'

/* ─────────────────────────────────────────────────────────
   FullscreenReader
   Props:
     item     – { text, translation?, source?, count?, narrator?, category?, grade? }
     color    – accent color string
     onClose  – callback
     type     – 'adhkar' | 'duaa' | 'hadith'
   ───────────────────────────────────────────────────────── */
export default function FullscreenReader({ item, color = '#10B981', onClose, type = 'adhkar' }) {
  useEffect(() => {
    const handler = e => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handler)
      document.body.style.overflow = ''
    }
  }, [onClose])

  const isHadith = type === 'hadith'

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.88)',
        backdropFilter: 'blur(18px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '24px',
        animation: 'fadeIn 180ms ease',
      }}
    >
      <style>{`@keyframes fadeIn{from{opacity:0;transform:scale(.96)}to{opacity:1;transform:scale(1)}}`}</style>

      <div
        onClick={e => e.stopPropagation()}
        style={{
          maxWidth: 680, width: '100%',
          background: 'var(--color-surface-1)',
          borderRadius: 24,
          border: `1px solid ${color}30`,
          boxShadow: `0 0 80px ${color}20, 0 32px 80px rgba(0,0,0,0.5)`,
          overflow: 'hidden',
          animation: 'fadeIn 200ms ease',
        }}
      >
        {/* Top accent bar */}
        <div style={{ height: 4, background: `linear-gradient(90deg, ${color}, ${color}60)` }} />

        {/* Close button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '14px 18px 0' }}>
          <button
            onClick={onClose}
            style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'var(--color-surface-3)', border: 'none',
              color: 'var(--color-text-muted)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 150ms',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = `${color}30`; e.currentTarget.style.color = color }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--color-surface-3)'; e.currentTarget.style.color = 'var(--color-text-muted)' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Main content */}
        <div style={{ padding: '8px 48px 40px' }}>

          {/* Arabic text */}
          <div
            dir="rtl"
            style={{
              fontSize: isHadith ? 22 : 24,
              fontFamily: 'var(--font-arabic)',
              fontWeight: 600,
              lineHeight: 2.4,
              color: 'var(--color-text)',
              textAlign: 'center',
              marginBottom: 28,
              letterSpacing: '0.02em',
            }}
          >
            {isHadith ? `«\u00a0${item.text}\u00a0»` : item.text}
          </div>

          {/* Divider with color dot */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
            <div style={{ flex: 1, height: 1, background: 'var(--color-border)' }} />
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
            <div style={{ flex: 1, height: 1, background: 'var(--color-border)' }} />
          </div>

          {/* Translation */}
          {item.translation && (
            <div
              dir="ltr"
              style={{
                fontSize: 15, lineHeight: 1.8,
                color: 'var(--color-text-muted)',
                fontStyle: 'italic',
                textAlign: 'center',
                marginBottom: 24,
              }}
            >
              {item.translation}
            </div>
          )}

          {/* Metadata row */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
            {item.source && (
              <span style={{
                fontSize: 12, padding: '5px 16px', borderRadius: 20,
                background: `${color}15`, color, fontWeight: 700,
                fontFamily: 'var(--font-arabic)',
              }}>
                {item.source}
              </span>
            )}
            {item.narrator && (
              <span style={{
                fontSize: 12, padding: '5px 16px', borderRadius: 20,
                background: 'var(--color-surface-3)', color: 'var(--color-text-muted)',
                fontFamily: 'var(--font-arabic)',
              }}>
                رواه {item.narrator}
              </span>
            )}
            {item.category && (
              <span style={{
                fontSize: 12, padding: '5px 16px', borderRadius: 20,
                background: 'var(--color-surface-3)', color: 'var(--color-text-muted)',
                fontFamily: 'var(--font-arabic)',
              }}>
                {item.category}
              </span>
            )}
            {item.grade && (
              <span style={{
                fontSize: 12, padding: '5px 16px', borderRadius: 20,
                background: item.grade === 'صحيح' ? '#10B98118' : '#F59E0B18',
                color: item.grade === 'صحيح' ? '#10B981' : '#F59E0B',
                fontWeight: 700, fontFamily: 'var(--font-arabic)',
              }}>
                {item.grade}
              </span>
            )}
            {item.count > 1 && (
              <span style={{
                fontSize: 12, padding: '5px 16px', borderRadius: 20,
                background: `${color}15`, color, fontWeight: 700,
              }}>
                ×{item.count}
              </span>
            )}
          </div>

          {/* ESC hint */}
          <div style={{ textAlign: 'center', marginTop: 28, fontSize: 11, color: 'var(--color-text-muted)', opacity: 0.5 }}>
            اضغط ESC أو انقر خارج النافذة للإغلاق
          </div>
        </div>
      </div>
    </div>
  )
}
