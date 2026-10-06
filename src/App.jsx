import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Suspense, lazy, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { ThemeProvider } from './theme/ThemeContext'
import ThemeController from './theme/ThemeController'
import AppShell from './components/layout/AppShell'
import Today from './pages/Today'
import Tasks from './pages/Tasks'
import Habits from './pages/Habits'
import Trash from './pages/Trash'
import Login from './pages/Login'
import Register from './pages/Register'
import ProtectedRoute from './components/auth/ProtectedRoute'
import { UserProvider, useUser, useSyncUserFromAuth } from './context/UserContext'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'
import GenderSelection from './components/auth/GenderSelection'

function DirectionController() {
  const { i18n } = useTranslation()

  useEffect(() => {
    const isRTL = i18n.language?.startsWith('ar')
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr'
    document.documentElement.lang = i18n.language || 'en'
  }, [i18n.language])

  return null
}

// Heavy pages — lazy loaded on first navigation
const Calendar    = lazy(() => import('./pages/Calendar'))
const Faith       = lazy(() => import('./pages/Faith'))
const Focus       = lazy(() => import('./pages/Focus'))
const Settings    = lazy(() => import('./pages/Settings'))
const Profile     = lazy(() => import('./pages/Profile'))
const AdhkarPage  = lazy(() => import('./pages/AdhkarPage'))
const HadithsLibrary = lazy(() => import('./pages/HadithsLibrary'))

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

/* ── Suspense fallback for lazy pages ────────────────────── */
function PageLoader() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: '60vh',
    }}>
      <div style={{
        width: 32, height: 32, borderRadius: '50%',
        border: '3px solid var(--color-surface-3)',
        borderTopColor: 'var(--color-primary)',
        animation: 'spin 0.8s linear infinite',
      }} />
    </div>
  )
}

function AppContent() {
  const { gender } = useUser()
  const { loading } = useAuth()
  useSyncUserFromAuth()

  if (loading) return <AuthLoader />

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public Authentication Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected Application Routes */}
        <Route
          element={
            <ProtectedRoute>
              <>
                {!gender && <GenderSelection />}
                <AppShell />
              </>
            </ProtectedRoute>
          }
        >
          <Route path="/"            element={<Today />} />
          <Route path="/tasks"       element={<Tasks />} />
          <Route path="/habits"      element={<Habits />} />
          <Route path="/calendar"    element={<Calendar />} />
          <Route path="/faith"       element={<Faith />} />
          <Route path="/focus"       element={<Focus />} />
          <Route path="/preferences" element={<Navigate to="/settings" replace />} />
          <Route path="/settings"    element={<Settings />} />
          <Route path="/profile"     element={<Profile />} />
          <Route path="/trash"       element={<Trash />} />
          <Route path="/adhkar"       element={<AdhkarPage />} />
          <Route path="/faith/adhkar" element={<AdhkarPage />} />
          <Route path="/hadiths"      element={<HadithsLibrary />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <ThemeController>
          <DirectionController />
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
