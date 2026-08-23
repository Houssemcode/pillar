import { createContext, useContext, useState, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'

const ToastContext = createContext()

let _toastId = 0

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const timers = useRef({})

  const dismiss = useCallback((id) => {
    clearTimeout(timers.current[id])
    delete timers.current[id]
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const toast = useCallback(({ title, message, icon = '✓', duration = 4000, color }) => {
    const id = ++_toastId
    setToasts(prev => [...prev, { id, title, message, icon, duration, color }])
    timers.current[id] = setTimeout(() => dismiss(id), duration)
    return id
  }, [dismiss])

  // Convenience wrappers
  const toastSuccess  = useCallback((title, message) => toast({ title, message, icon: '✅', color: '#10B981' }), [toast])
  const toastPrayer   = useCallback((title, message) => toast({ title, message, icon: '🕌', color: '#10B981', duration: 6000 }), [toast])
  const toastFocus    = useCallback((title, message) => toast({ title, message, icon: '🍅', color: '#F43F5E', duration: 5000 }), [toast])
  const toastStreak   = useCallback((title, message) => toast({ title, message, icon: '🔥', color: '#F59E0B', duration: 5000 }), [toast])
  const toastMilestone = useCallback((title, message) => toast({ title, message, icon: '✨', color: '#8B5CF6', duration: 6000 }), [toast])

  return (
    <ToastContext.Provider value={{ toast, toastSuccess, toastPrayer, toastFocus, toastStreak, toastMilestone, dismiss }}>
      {children}
      {createPortal(
        <div className="toast-container">
          {toasts.map(t => (
            <ToastItem key={t.id} {...t} onDismiss={dismiss} />
          ))}
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  )
}

function ToastItem({ id, title, message, icon, duration, color, onDismiss }) {
  return (
    <div
      className="toast"
      role="alert"
      style={{
        borderLeftWidth: 3,
        borderLeftColor: color || 'var(--color-primary)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <span className="toast-icon">{icon}</span>
      <div className="toast-content">
        <div className="toast-title">{title}</div>
        {message && <div className="toast-message">{message}</div>}
      </div>
      <button className="toast-close" onClick={() => onDismiss(id)} aria-label="Dismiss">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
      {/* Progress bar */}
      <div
        className="toast-progress"
        style={{
          background: color || 'var(--color-primary)',
          '--toast-duration': `${duration}ms`,
        }}
      />
    </div>
  )
}

export function useToast() {
  return useContext(ToastContext)
}
