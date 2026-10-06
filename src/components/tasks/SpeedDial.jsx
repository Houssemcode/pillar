import { useState, useEffect } from 'react'

export default function SpeedDial({ onSelect }) {
  const [open, setOpen] = useState(false)

  // Close speed dial on Escape key
  useEffect(() => {
    if (!open) return
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open])

  const items = [
    {
      id: 'tag',
      label: 'New Tag',
      badge: '#',
      color: '#10B981',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
          <line x1="7" y1="7" x2="7.01" y2="7" />
        </svg>
      ),
    },
    {
      id: 'list',
      label: 'New List',
      badge: '≡',
      color: '#8B5CF6',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
          <line x1="12" y1="11" x2="12" y2="17" />
          <line x1="9" y1="14" x2="15" y2="14" />
        </svg>
      ),
    },
    {
      id: 'task',
      label: 'New Task',
      badge: '✓',
      color: '#3B82F6',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 11 12 14 22 4" />
          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
        </svg>
      ),
    },
  ]

  return (
    <>
      {/* Dimmed backdrop when speed dial is open */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.4)',
            backdropFilter: 'blur(3px)',
            WebkitBackdropFilter: 'blur(3px)',
            zIndex: 99,
            animation: 'fadeIn 200ms ease',
          }}
        />
      )}

      {/* Speed Dial Container */}
      <div className="speed-dial-root">
        {open && (
          <div className="speed-dial-menu">
            {items.map((item, idx) => (
              <div
                key={item.id}
                className="speed-dial-item"
                style={{
                  animationDelay: `${(items.length - 1 - idx) * 30}ms`,
                }}
              >
                <span className="speed-dial-label">{item.label}</span>
                <button
                  type="button"
                  className="speed-dial-btn"
                  onClick={() => {
                    onSelect(item.id)
                    setOpen(false)
                  }}
                  aria-label={item.label}
                  style={{ '--item-accent': item.color }}
                >
                  {item.icon}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Main Trigger FAB */}
        <button
          type="button"
          className={`fab ${open ? 'fab--active' : ''}`}
          onClick={() => setOpen(!open)}
          aria-label={open ? 'Close action menu' : 'Open action menu'}
          style={{
            position: 'relative',
            bottom: 'auto',
            right: 'auto',
            zIndex: 101,
          }}
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            style={{
              transition: 'transform 250ms cubic-bezier(0.34, 1.56, 0.64, 1)',
              transform: open ? 'rotate(135deg)' : 'rotate(0deg)',
            }}
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
      </div>

      <style>{`
        .speed-dial-root {
          position: fixed;
          bottom: calc(var(--bottom-nav-height) + 20px);
          right: 20px;
          z-index: 101;
          display: flex;
          flex-direction: column;
          align-items: flex-end;
        }

        @media (min-width: 768px) {
          .speed-dial-root {
            bottom: 24px;
            right: 24px;
          }
        }

        .speed-dial-menu {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 12px;
          margin-bottom: 14px;
        }

        .speed-dial-item {
          display: flex;
          align-items: center;
          gap: 10px;
          animation: speedDialSlideIn 200ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
          opacity: 0;
          transform: translateY(12px) scale(0.9);
        }

        @keyframes speedDialSlideIn {
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .speed-dial-label {
          background: var(--color-surface-2);
          color: var(--color-text);
          border: 1px solid var(--color-border);
          padding: 5px 12px;
          border-radius: var(--radius-md);
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.01em;
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.4);
          white-space: nowrap;
          user-select: none;
          pointer-events: none;
        }

        .speed-dial-btn {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: var(--color-surface-2);
          color: var(--color-text-secondary);
          border: 1px solid var(--color-border);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 180ms ease;
          box-shadow: 0 6px 18px rgba(0, 0, 0, 0.3);
        }

        .speed-dial-btn:hover {
          background: var(--color-surface-3);
          color: var(--item-accent, var(--color-primary));
          border-color: var(--item-accent, var(--color-primary));
          transform: scale(1.1);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
        }

        .fab--active {
          background: var(--color-surface-3) !important;
          color: var(--color-text) !important;
          border: 1px solid var(--color-border) !important;
          box-shadow: 0 10px 30px rgba(0,0,0,0.5) !important;
        }
      `}</style>
    </>
  )
}
