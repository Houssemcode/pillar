import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider } from './theme/ThemeContext'
import ThemeController from './theme/ThemeController'
import AppShell from './components/layout/AppShell'
import Today from './pages/Today'
import Tasks from './pages/Tasks'
import Habits from './pages/Habits'
import Calendar from './pages/Calendar'
import Faith from './pages/Faith'
import Focus from './pages/Focus'
import Preferences from './pages/Preferences'
import Login from './pages/Login'
import { UserProvider, useUser } from './context/UserContext'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'
import GenderSelection from './components/auth/GenderSelection'

/* ── Loading spinner while checking stored token ─────────── */
function AuthLoader() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: '100vh', background: 'var(--color-bg)',
    }}>
      <div style={{
        width: 40, height: 40, borderRadius: '50%',
        border: '3px solid var(--color-surface-3)',
        borderTopColor: 'var(--color-primary)',
        animation: 'spin 0.8s linear infinite',
      }} />
    </div>
  )
}

function AppContent() {
  const { gender } = useUser()
  const { user, loading } = useAuth()

  if (loading) return <AuthLoader />
  if (!user)   return <Login />

  return (
    <>
      {!gender && <GenderSelection />}
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/"            element={<Today />} />
          <Route path="/tasks"       element={<Tasks />} />
          <Route path="/habits"      element={<Habits />} />
          <Route path="/calendar"    element={<Calendar />} />
          <Route path="/faith"       element={<Faith />} />
          <Route path="/focus"       element={<Focus />} />
          <Route path="/preferences" element={<Preferences />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <ThemeController>
          <AuthProvider>
            <UserProvider>
              <ToastProvider>
                <AppContent />
              </ToastProvider>
            </UserProvider>
          </AuthProvider>
        </ThemeController>
      </ThemeProvider>
    </BrowserRouter>
  )
}
