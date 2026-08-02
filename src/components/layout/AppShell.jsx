import Sidebar from './Sidebar'
import BottomNav from './BottomNav'
import TopBar from './TopBar'
import { Outlet } from 'react-router-dom'

export default function AppShell() {
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
          <Outlet />
        </div>
      </main>

      {/* Mobile bottom nav */}
      <BottomNav />
    </div>
  )
}
