import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from './theme/ThemeContext'
import ThemeController from './theme/ThemeController'
import AppShell from './components/layout/AppShell'
import Today from './pages/Today'
import Tasks from './pages/Tasks'
import Habits from './pages/Habits'
import Calendar from './pages/Calendar'
import Faith from './pages/Faith'
import Focus from './pages/Focus'

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <ThemeController>
          <Routes>
            <Route element={<AppShell />}>
              <Route path="/" element={<Today />} />
              <Route path="/tasks" element={<Tasks />} />
              <Route path="/habits" element={<Habits />} />
              <Route path="/calendar" element={<Calendar />} />
              <Route path="/faith" element={<Faith />} />
              <Route path="/focus" element={<Focus />} />
            </Route>
          </Routes>
        </ThemeController>
      </ThemeProvider>
    </BrowserRouter>
  )
}
