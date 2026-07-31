import Sidebar from './Sidebar'
import BottomNav from './BottomNav'
import { Outlet } from 'react-router-dom'

export default function AppShell() {
  return (
    <div className="app-shell">
      {/* Desktop sidebar */}
      <Sidebar />

      {/* Main content area */}
      <main className="app-main">
        <Outlet />
      </main>

      {/* Mobile bottom nav */}
      <BottomNav />
    </div>
  )
}
