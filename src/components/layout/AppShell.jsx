import Sidebar from './Sidebar'
import BottomNav from './BottomNav'
import TopBar from './TopBar'
import { Outlet } from 'react-router-dom'
import ErrorBoundary from '../ui/ErrorBoundary'
import { useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'

export default function AppShell() {
  const { setSessionExpiredToast } = useAuth()
  const { toastError } = useToast()

  // Inject toast function so client.js can surface session expiry messages
  useEffect(() => {
    setSessionExpiredToast?.((msg) => toastError('Session Expired', msg))
  }, [setSessionExpiredToast, toastError])

  return (
    <div className="app-shell">
      {/* Desktop sidebar */}
      <Sidebar />

      {/* Main content area */}
      <main className="app-main">
        {/* Top bar: clock + profile */}
        <TopBar />

        {/* Page content */}
        <div className="app-content">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </div>
      </main>

      {/* Mobile bottom nav */}
      <BottomNav />
    </div>
  )
}
