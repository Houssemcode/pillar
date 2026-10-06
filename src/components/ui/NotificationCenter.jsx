/**
 * NotificationCenter.jsx
 *
 * A slide-in panel that shows all scheduled notifications,
 * lets users toggle them on/off, and manages permission state.
 */
import { useState, useEffect, useRef } from 'react'
import notificationService from '../../services/notificationService'

const TYPE_ICON = { event: '📅', task: '✅', habit: '🔁', recurring: '🔁' }
const TYPE_LABEL = { event: 'Event', task: 'Task', habit: 'Habit', recurring: 'Habit Reminder', oneshot: 'Reminder' }

function parseId(id) {
  // id format: "event-42", "task-7", "habit-3"
  const [kind] = id.split('-')
  return kind
}

export default function NotificationCenter({ onClose }) {
  const [permission, setPermission] = useState(notificationService.permission)
  const [items, setItems] = useState(() => notificationService.getAll())
  const [requesting, setRequesting] = useState(false)
  const panelRef = useRef(null)

  // Close on outside click
  useEffect(() => {
    const h = e => { if (panelRef.current && !panelRef.current.contains(e.target)) onClose() }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [onClose])

  // Close on ESC
  useEffect(() => {
    const h = e => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [onClose])

  async function handleRequestPermission() {
    setRequesting(true)
    const result = await notificationService.requestPermission()
    setPermission(result)
    setRequesting(false)
    if (result === 'granted') {
      notificationService.rescheduleAll()
    }
  }

  function handleToggle(id, enabled) {
    notificationService.setEnabled(id, enabled)
    setItems(notificationService.getAll())
  }

  function handleRemove(id) {
    notificationService.cancelNotification(id)
    setItems(notificationService.getAll())
  }

  function refresh() {
    setItems(notificationService.getAll())
  }

  const sortedItems = [...items].sort((a, b) => {
    if (a.type === 'oneshot' && b.type === 'oneshot') {
      return new Date(a.fireAt) - new Date(b.fireAt)
    }
    return a.type.localeCompare(b.type)
  })

  return (
    <div
      ref={panelRef}
      className="notification-center-panel"
      style={{
        position: 'fixed',
        top: 0, right: 0, bottom: 0,
        width: 'min(380px, 100vw)',
        maxWidth: '100vw',
        background: 'var(--color-surface)',
        borderLeft: '1px solid var(--color-border)',
        boxShadow: '-8px 0 32px rgba(0,0,0,0.35)',
        display: 'flex', flexDirection: 'column',
        zIndex: 2000,
        animation: 'slideInRight 0.22s cubic-bezier(0.34,1.2,0.64,1)',
      }}
    >
      {/* Header */}
      <div style={{
        padding: '20px 20px 16px',
        borderBottom: '1px solid var(--color-border)',
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: 'var(--color-primary-alpha, #6366F122)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 18,
        }}>🔔</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text)' }}>Notifications</div>
          <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 1 }}>
            {items.length} scheduled
          </div>
        </div>
        <button
          onClick={onClose}
          style={{
            width: 30, height: 30, borderRadius: 8, border: 'none',
            background: 'var(--color-surface-2)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--color-text-muted)',
          }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* Permission banner */}
      {permission !== 'granted' && (
        <div style={{
          margin: '16px 16px 0',
          padding: '14px 16px',
          borderRadius: 12,
          background: permission === 'denied' ? '#F43F5E14' : '#F59E0B14',
          border: `1px solid ${permission === 'denied' ? '#F43F5E40' : '#F59E0B40'}`,
        }}>
          {permission === 'denied' ? (
            <>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#F43F5E', marginBottom: 4 }}>Notifications Blocked</div>
              <div style={{ fontSize: 12, color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
                Notifications are blocked in your browser settings. Please enable them in your browser site settings and reload.
              </div>
            </>
          ) : (
            <>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#F59E0B', marginBottom: 4 }}>Enable Notifications</div>
              <div style={{ fontSize: 12, color: 'var(--color-text-muted)', lineHeight: 1.5, marginBottom: 10 }}>
                Allow notifications to get reminders for events, tasks, and habits.
              </div>
              <button
                onClick={handleRequestPermission}
                disabled={requesting}
                style={{
                  padding: '6px 14px', borderRadius: 8,
                  background: '#F59E0B', color: '#fff',
                  border: 'none', cursor: 'pointer',
                  fontSize: 12, fontWeight: 700,
                  opacity: requesting ? 0.7 : 1,
                }}
              >
                {requesting ? 'Requesting…' : '🔔 Enable Notifications'}
              </button>
            </>
          )}
        </div>
      )}

      {/* Notification list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px 20px' }}>
        {sortedItems.length === 0 ? (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', gap: 12, height: '60%',
            color: 'var(--color-text-muted)',
          }}>
            <div style={{ fontSize: 40 }}>🔕</div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>No notifications scheduled</div>
            <div style={{ fontSize: 12, textAlign: 'center', lineHeight: 1.5 }}>
              Add reminders to events, tasks, or habits to see them here.
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {sortedItems.map(item => {
              const kind = parseId(item.id)
              const icon = TYPE_ICON[kind] || TYPE_ICON[item.type] || '🔔'
              const typeLabel = TYPE_LABEL[kind] || TYPE_LABEL[item.type] || 'Reminder'
              const timeLabel = item.type === 'recurring'
                ? item.timeStr
                  ? `Daily at ${item.timeStr}`
                  : 'Daily'
                : item.fireAt
                  ? formatFireAt(new Date(item.fireAt))
                  : ''

              return (
                <div
                  key={item.id}
                  style={{
                    padding: '12px 14px',
                    borderRadius: 12,
                    background: 'var(--color-surface-2)',
                    border: '1px solid var(--color-border)',
                    display: 'flex', alignItems: 'flex-start', gap: 12,
                    opacity: item.enabled ? 1 : 0.5,
                    transition: 'opacity 0.2s',
                  }}
                >
                  <div style={{ fontSize: 20, marginTop: 1 }}>{icon}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: 13, fontWeight: 600, color: 'var(--color-text)',
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    }}>
                      {item.title}
                    </div>
                    {item.body && (
                      <div style={{
                        fontSize: 11, color: 'var(--color-text-muted)', marginTop: 2,
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      }}>
                        {item.body}
                      </div>
                    )}
                    <div style={{
                      marginTop: 4, fontSize: 11, fontWeight: 600,
                      color: item.enabled ? 'var(--color-primary)' : 'var(--color-text-muted)',
                    }}>
                      {icon} {typeLabel} · {timeLabel}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0, alignItems: 'center', marginTop: 2 }}>
                    {/* Toggle */}
                    <button
                      onClick={() => handleToggle(item.id, !item.enabled)}
                      title={item.enabled ? 'Disable' : 'Enable'}
                      style={{
                        width: 34, height: 20, borderRadius: 10,
                        background: item.enabled ? 'var(--color-primary)' : 'var(--color-surface-3)',
                        border: 'none', cursor: 'pointer', position: 'relative',
                        transition: 'background 0.2s', flexShrink: 0,
                      }}
                    >
                      <div style={{
                        position: 'absolute',
                        top: 2, left: item.enabled ? 16 : 2,
                        width: 16, height: 16, borderRadius: 8,
                        background: '#fff',
                        boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
                        transition: 'left 0.2s',
                      }} />
                    </button>
                    {/* Remove */}
                    <button
                      onClick={() => handleRemove(item.id)}
                      title="Remove notification"
                      style={{
                        width: 26, height: 26, borderRadius: 6, border: 'none',
                        background: 'none', cursor: 'pointer',
                        color: 'var(--color-text-muted)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = '#F43F5E20'; e.currentTarget.style.color = '#F43F5E' }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--color-text-muted)' }}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <polyline points="3,6 5,6 21,6" /><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" /><path d="M10 11v6M14 11v6" />
                      </svg>
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      {sortedItems.length > 0 && (
        <div style={{
          padding: '12px 16px',
          borderTop: '1px solid var(--color-border)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <button
            onClick={refresh}
            style={{
              fontSize: 12, color: 'var(--color-text-muted)', background: 'none',
              border: 'none', cursor: 'pointer', padding: '4px 8px', borderRadius: 6,
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--color-surface-2)'}
            onMouseLeave={e => e.currentTarget.style.background = 'none'}
          >
            ↻ Refresh
          </button>
          <button
            onClick={() => {
              sortedItems.forEach(i => notificationService.cancelNotification(i.id))
              setItems([])
            }}
            style={{
              fontSize: 12, color: '#F43F5E', background: 'none',
              border: 'none', cursor: 'pointer', padding: '4px 8px', borderRadius: 6,
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#F43F5E14'}
            onMouseLeave={e => e.currentTarget.style.background = 'none'}
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  )
}

function formatFireAt(date) {
  if (isNaN(date.getTime())) return ''
  const now = new Date()
  const diff = date - now
  if (diff < 0) return 'Passed'
  if (diff < 60_000) return 'In less than a minute'
  if (diff < 3_600_000) return `In ${Math.round(diff / 60_000)} min`
  if (diff < 86_400_000) return `In ${Math.round(diff / 3_600_000)} hr`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}
