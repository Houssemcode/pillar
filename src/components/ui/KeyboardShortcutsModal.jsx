import { useEffect } from 'react'

const SHORTCUTS = [
  { section: 'Navigation' },
  { key: 'G then H', desc: 'Go to Today (Home)' },
  { key: 'G then T', desc: 'Go to Tasks' },
  { key: 'G then A', desc: 'Go to Habits' },
  { key: 'G then C', desc: 'Go to Calendar' },
  { key: 'G then F', desc: 'Go to Faith' },
  { key: 'G then O', desc: 'Go to Focus' },
  { section: 'Actions' },
  { key: '⌘ K / Ctrl K', desc: 'Open global search' },
  { key: 'N', desc: 'Create new task (on Tasks page)' },
  { key: 'Esc', desc: 'Close modal / drawer' },
  { key: '?', desc: 'Show this keyboard shortcuts help' },
  { section: 'Tasks' },
  { key: '← / →', desc: 'Navigate between task tabs (Today / Next 7 / All)' },
  { key: 'Enter', desc: 'Open selected task' },
  { section: 'Habits' },
  { key: '← / →', desc: 'Navigate week back/forward' },
  { section: 'Focus' },
  { key: 'Space', desc: 'Start / pause focus timer' },
  { key: 'R', desc: 'Reset focus timer' },
]

export default function KeyboardShortcutsModal({ open, onClose }) {
  // Close on Escape or ? press
  useEffect(() => {
    if (!open) return
    const handler = (e) => {
      if (e.key === 'Escape' || e.key === '?') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 8000,
        background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20,
        animation: 'fadeIn 150ms ease',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 24,
          width: '100%', maxWidth: 540,
          maxHeight: '85vh',
          overflow: 'hidden',
          display: 'flex', flexDirection: 'column',
          boxShadow: '0 32px 80px rgba(0,0,0,0.5)',
          animation: 'slideUp 200ms cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: '20px 24px 16px',
          borderBottom: '1px solid var(--color-border-subtle)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'var(--color-primary-subtle)', border: '1px solid var(--color-primary-muted)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
            }}>⌨️</div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text)' }}>Keyboard Shortcuts</div>
              <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>Press ? anytime to show this</div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 30, height: 30, borderRadius: 8,
              background: 'var(--color-surface-2)', border: '1px solid var(--color-border)',
              color: 'var(--color-text-muted)', cursor: 'pointer', fontSize: 16,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >×</button>
        </div>

        {/* Shortcut list */}
        <div style={{ overflowY: 'auto', padding: '16px 24px 24px', flex: 1 }}>
          {SHORTCUTS.map((item, i) =>
            item.section ? (
              <div key={i} style={{
                fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
                letterSpacing: '0.08em', color: 'var(--color-primary)',
                marginTop: i === 0 ? 0 : 20, marginBottom: 8,
              }}>
                {item.section}
              </div>
            ) : (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '9px 12px', borderRadius: 10, marginBottom: 4,
                transition: 'background 150ms',
              }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--color-surface-2)'}
                onMouseLeave={e => e.currentTarget.style.background = ''}
              >
                <span style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>{item.desc}</span>
                <kbd style={{
                  fontSize: 11, fontWeight: 700, padding: '3px 9px',
                  borderRadius: 7,
                  background: 'var(--color-surface-3)',
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-text)',
                  fontFamily: 'var(--font-mono, monospace)',
                  whiteSpace: 'nowrap', boxShadow: '0 1px 0 var(--color-border)',
                }}>
                  {item.key}
                </kbd>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  )
}
