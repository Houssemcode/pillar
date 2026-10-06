import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useUser } from '../context/UserContext'

export default function Landing({ forceShow = false }) {
  const { user } = useAuth()
  const { colorTheme, toggleTheme } = useUser()

  // Smoothly redirect authenticated users straight to the dashboard unless previewing
  const isPreview = forceShow || (typeof window !== 'undefined' && window.location.search.includes('preview'))
  if (user && !isPreview) {
    return <Navigate to="/today" replace />
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a] text-gray-900 dark:text-white transition-colors duration-200 selection:bg-emerald-500 selection:text-white">
      {/* ─── Ambient Background Glows ─────────────────────────────── */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[450px] bg-emerald-500/10 dark:bg-emerald-500/15 rounded-full blur-[130px]" />
        <div className="absolute top-[45%] -left-32 w-[500px] h-[350px] bg-teal-500/10 dark:bg-teal-500/10 rounded-full blur-[120px]" />
        <div className="absolute top-[75%] -right-32 w-[550px] h-[400px] bg-indigo-500/10 dark:bg-indigo-500/10 rounded-full blur-[140px]" />
      </div>

      {/* ─── Sticky Navbar ────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-white/80 dark:bg-[#0a0a0a]/80 border-b border-gray-200/80 dark:border-zinc-800/80 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xl shadow-sm">
              🏛️
            </div>
            <div className="flex items-center gap-2.5">
              <span className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
                Pillar
              </span>
              <span className="hidden sm:inline-flex text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                v1.0 Sanctuary
              </span>
            </div>
          </div>

          {/* Nav Anchors */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600 dark:text-gray-400">
            <a href="#features" className="hover:text-gray-900 dark:hover:text-white transition-colors">
              Features
            </a>
            <a href="#pillars" className="hover:text-gray-900 dark:hover:text-white transition-colors">
              The 4 Pillars
            </a>
            <a href="#journey" className="hover:text-gray-900 dark:hover:text-white transition-colors">
              The Journey
            </a>
            <a href="#developer" className="hover:text-gray-900 dark:hover:text-white transition-colors">
              Creator
            </a>
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            {/* Theme Toggle Button */}
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2.5 rounded-xl text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white bg-gray-100 dark:bg-zinc-800/70 border border-gray-200 dark:border-zinc-700/80 transition-all focus:outline-none"
              aria-label={colorTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              title={colorTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {colorTheme === 'dark' ? (
                <svg className="w-4 h-4 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="5" />
                  <line x1="12" y1="1" x2="12" y2="3" />
                  <line x1="12" y1="21" x2="12" y2="23" />
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                  <line x1="1" y1="12" x2="3" y2="12" />
                  <line x1="21" y1="12" x2="23" y2="12" />
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </svg>
              ) : (
                <svg className="w-4 h-4 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              )}
            </button>

            {/* Sign In */}
            <Link
              to="/login"
              className="text-sm font-semibold text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white px-3.5 py-2 rounded-xl transition-colors"
            >
              Sign In
            </Link>

            {/* Get Started */}
            <Link
              to="/register"
              className="text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white px-4 py-2 rounded-xl shadow-sm shadow-emerald-600/25 transition-all flex items-center gap-1.5"
            >
              <span>Get Started</span>
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </Link>
          </div>
        </div>
      </header>

      {/* ─── Hero Section ─────────────────────────────────────────── */}
      <section className="relative z-10 pt-16 sm:pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto text-center">
        {/* Status Pill */}
        <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 mb-8 shadow-sm">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span>A Single Source of Truth for Your Days</span>
        </div>

        {/* Gradient Headline */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-gray-900 via-emerald-800 to-gray-900 dark:from-white dark:via-emerald-400 dark:to-zinc-200 leading-[1.12] max-w-4xl mx-auto mb-6">
          Your Mindful Life &amp; Productivity Sanctuary.
        </h1>

        {/* Subheadline */}
        <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto font-normal leading-relaxed mb-10">
          Seamlessly integrate your tasks, habits, focus sessions, and faith into one beautifully designed, unified system.
        </p>

        {/* Hero CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <Link
            to="/register"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-semibold text-base shadow-xl shadow-emerald-600/25 hover:shadow-emerald-600/35 hover:-translate-y-0.5 transition-all duration-150"
          >
            <span>Get Started Free</span>
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </Link>

          <Link
            to="/login"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-white dark:bg-[#121212] text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-zinc-800 hover:bg-gray-100 dark:hover:bg-zinc-800/80 font-semibold text-base shadow-sm hover:-translate-y-0.5 transition-all duration-150"
          >
            <span>Sign In to Sanctuary</span>
          </Link>
        </div>

        {/* ─── Hero Visual Showcase (Interactive Sanctuary Teaser) ──── */}
        <div className="relative max-w-4xl mx-auto">
          <div className="p-4 sm:p-6 bg-white dark:bg-[#121212] rounded-3xl border border-gray-200 dark:border-zinc-800 shadow-2xl transition-colors">
            {/* Header of Showcase Card */}
            <div className="flex flex-wrap items-center justify-between gap-4 pb-5 mb-5 border-b border-gray-100 dark:border-zinc-800/80 text-left">
              <div>
                <p className="text-xs uppercase tracking-wider font-semibold text-gray-600 dark:text-gray-400">
                  Daily Rhythm • Today
                </p>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mt-0.5">
                  Harmony &amp; Intentional Focus
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  In Flow State
                </span>
                <span className="text-xs font-mono px-3 py-1 rounded-full bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-zinc-700">
                  09:41 AM
                </span>
              </div>
            </div>

            {/* 4 Teaser Mini-Panels Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-left">
              {/* Module 1: Faith Preview */}
              <div className="p-4 rounded-2xl bg-gray-50/80 dark:bg-zinc-900/60 border border-gray-200/70 dark:border-zinc-800/80">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                    <span>🌙</span> Faith &amp; Prayer
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400">
                    Next: Dhuhr
                  </span>
                </div>
                <div className="text-sm font-bold text-gray-900 dark:text-white">12:30 PM</div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">2h 49m remaining • Adhkar ready</p>
                <div className="w-full bg-gray-200 dark:bg-zinc-800 h-1.5 rounded-full mt-3 overflow-hidden">
                  <div className="bg-amber-500 h-full rounded-full w-2/3" />
                </div>
              </div>

              {/* Module 2: Habits Preview */}
              <div className="p-4 rounded-2xl bg-gray-50/80 dark:bg-zinc-900/60 border border-gray-200/70 dark:border-zinc-800/80">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                    <span>🔥</span> Habit Streak
                  </span>
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    14 Days
                  </span>
                </div>
                <div className="text-sm font-bold text-gray-900 dark:text-white">Morning Reflection</div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Completed today at 07:15 AM</p>
                <div className="flex items-center gap-1.5 mt-3">
                  {[1, 2, 3, 4, 5, 6, 7].map((day) => (
                    <span
                      key={day}
                      className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] ${
                        day <= 6
                          ? 'bg-emerald-500 text-white'
                          : 'bg-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                      }`}
                    >
                      ✓
                    </span>
                  ))}
                </div>
              </div>

              {/* Module 3: Tasks Preview */}
              <div className="p-4 rounded-2xl bg-gray-50/80 dark:bg-zinc-900/60 border border-gray-200/70 dark:border-zinc-800/80">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                    <span>✓</span> High Priority
                  </span>
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400">
                    2/3 Done
                  </span>
                </div>
                <div className="text-sm font-bold text-gray-900 dark:text-white truncate">Finalize Design SSOT</div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Due today • #Architecture</p>
                <div className="flex items-center gap-1.5 mt-3">
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-300 border border-blue-200 dark:border-blue-900/40">
                    Pillar v1.0
                  </span>
                </div>
              </div>

              {/* Module 4: Focus Preview */}
              <div className="p-4 rounded-2xl bg-gray-50/80 dark:bg-zinc-900/60 border border-gray-200/70 dark:border-zinc-800/80">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-purple-600 dark:text-purple-400 flex items-center gap-1.5">
                    <span>🎯</span> Deep Focus
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-600 dark:text-purple-400">
                    25:00
                  </span>
                </div>
                <div className="text-sm font-bold text-gray-900 dark:text-white">Rain Soundscape</div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Pomodoro session active</p>
                <div className="flex items-center gap-2 mt-3 text-xs font-medium text-purple-600 dark:text-purple-400">
                  <span className="inline-block w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
                  <span>Zen Mode Active</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Bento Grid: The 4 Core Pillars ───────────────────────── */}
      <section id="pillars" className="relative z-10 py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 mb-3">
            THE FOUR PILLARS
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 dark:text-white mb-4">
            A Cohesive Ecosystem Built for Balance
          </h2>
          <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
            Instead of fragmenting your day across disjointed apps, Pillar brings tasks, habits, focus, and spiritual cadence into a single calm sanctuary.
          </p>
        </div>

        {/* Bento Grid Container */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {/* Bento Card 1: Task Management */}
          <div className="p-8 rounded-3xl bg-white dark:bg-[#121212] border border-gray-200 dark:border-zinc-800 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center text-2xl mb-6 shadow-sm">
                📋
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                Pillar 01
              </span>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1 mb-3">
                Task Management &amp; Kanban
              </h3>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 leading-relaxed mb-6">
                Organize projects without decision fatigue. Prioritize with urgency ratings, custom tags, subtask checklists, and fluid Kanban workflows designed for seamless execution.
              </p>
            </div>
            {/* Visual Micro-Card */}
            <div className="p-4 rounded-2xl bg-gray-50 dark:bg-zinc-900/70 border border-gray-200/80 dark:border-zinc-800/80 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-md bg-emerald-500 text-white flex items-center justify-center text-[10px]">✓</span>
                  <span className="font-semibold text-gray-900 dark:text-white">Design System SSOT Documentation</span>
                </div>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  Done
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-md border border-gray-300 dark:border-zinc-700" />
                  <span className="text-gray-700 dark:text-gray-300">Production JWT Token Rotation</span>
                </div>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400">
                  In Progress
                </span>
              </div>
            </div>
          </div>

          {/* Bento Card 2: Habit Tracking */}
          <div className="p-8 rounded-3xl bg-white dark:bg-[#121212] border border-gray-200 dark:border-zinc-800 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-2xl mb-6 shadow-sm">
                🌱
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Pillar 02
              </span>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1 mb-3">
                Habit Tracking &amp; Consistency Rings
              </h3>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 leading-relaxed mb-6">
                Build durable habits through daily momentum, streak protection freezes, and completion analytics that reward consistency over perfection.
              </p>
            </div>
            {/* Visual Micro-Card */}
            <div className="p-4 rounded-2xl bg-gray-50 dark:bg-zinc-900/70 border border-gray-200/80 dark:border-zinc-800/80 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-900 dark:text-white">Qur'an Recitation &amp; Tadabbur</p>
                <p className="text-[11px] text-gray-600 dark:text-gray-400 mt-0.5">Target: Daily after Fajr</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">🔥 28 Days</span>
                <span className="w-7 h-7 rounded-full bg-emerald-500 text-white text-xs font-bold flex items-center justify-center">
                  100%
                </span>
              </div>
            </div>
          </div>

          {/* Bento Card 3: Faith & Prayers */}
          <div className="p-8 rounded-3xl bg-white dark:bg-[#121212] border border-gray-200 dark:border-zinc-800 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center text-2xl mb-6 shadow-sm">
                🕌
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                Pillar 03
              </span>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1 mb-3">
                Faith, Prayers &amp; Daily Adhkar
              </h3>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 leading-relaxed mb-6">
                Anchor your day around spiritual mindfulness. Accurate astronomical prayer timings, Qibla compass, morning &amp; evening Adhkar with interactive tasbeeh counters, and authentic Hadith library.
              </p>
            </div>
            {/* Visual Micro-Card */}
            <div className="p-4 rounded-2xl bg-gray-50 dark:bg-zinc-900/70 border border-gray-200/80 dark:border-zinc-800/80 grid grid-cols-5 gap-2 text-center text-xs">
              <div className="p-1.5 rounded-lg bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700">
                <p className="text-[10px] text-gray-600 dark:text-gray-400">Fajr</p>
                <p className="font-bold text-gray-900 dark:text-white mt-0.5">05:14</p>
              </div>
              <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400">
                <p className="text-[10px] font-semibold">Dhuhr</p>
                <p className="font-bold mt-0.5">12:30</p>
              </div>
              <div className="p-1.5 rounded-lg bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700">
                <p className="text-[10px] text-gray-600 dark:text-gray-400">Asr</p>
                <p className="font-bold text-gray-900 dark:text-white mt-0.5">15:45</p>
              </div>
              <div className="p-1.5 rounded-lg bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700">
                <p className="text-[10px] text-gray-600 dark:text-gray-400">Maghrib</p>
                <p className="font-bold text-gray-900 dark:text-white mt-0.5">18:22</p>
              </div>
              <div className="p-1.5 rounded-lg bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700">
                <p className="text-[10px] text-gray-600 dark:text-gray-400">Isha</p>
                <p className="font-bold text-gray-900 dark:text-white mt-0.5">19:48</p>
              </div>
            </div>
          </div>

          {/* Bento Card 4: Deep Focus */}
          <div className="p-8 rounded-3xl bg-white dark:bg-[#121212] border border-gray-200 dark:border-zinc-800 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center text-2xl mb-6 shadow-sm">
                ⏱️
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                Pillar 04
              </span>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1 mb-3">
                Deep Focus &amp; Ambient Soundscapes
              </h3>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 leading-relaxed mb-6">
                Cultivate undisturbed flow sessions. Customizable Pomodoro timers, gentle interval chimes, and calming ambient white noise soundscapes that melt away environmental distractions.
              </p>
            </div>
            {/* Visual Micro-Card */}
            <div className="p-4 rounded-2xl bg-gray-50 dark:bg-zinc-900/70 border border-gray-200/80 dark:border-zinc-800/80 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold text-sm">
                  25m
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-900 dark:text-white">Rainforest Stream Ambient</p>
                  <p className="text-[11px] text-gray-600 dark:text-gray-400">Short Break: 5m • Long: 15m</p>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                Zen Mode
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ─── The Journey (Timeline Section) ───────────────────────── */}
      <section id="journey" className="relative z-10 py-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 mb-3">
            THE JOURNEY
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 dark:text-white mb-4">
            From Vision to Production Sanctuary
          </h2>
          <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
            The evolution of Pillar from an ambitious minimalist concept into a robust, high-availability full-stack application.
          </p>
        </div>

        {/* Vertical Timeline Structure */}
        <div className="relative">
          {/* Vertical Glowing Spine */}
          <div className="absolute left-6 sm:left-1/2 top-4 bottom-4 w-0.5 -translate-x-1/2 bg-gradient-to-b from-emerald-500 via-teal-500 via-indigo-500 to-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.4)]" />

          <div className="space-y-12 sm:space-y-16">
            {/* Phase 1 */}
            <div className="relative flex flex-col sm:flex-row items-start sm:items-center">
              {/* Timeline Center Dot */}
              <div className="absolute left-6 sm:left-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-white dark:bg-[#121212] border-4 border-emerald-500 flex items-center justify-center text-xs font-bold text-emerald-600 dark:text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.5)] z-10">
                1
              </div>

              {/* Content Card (Left on Desktop) */}
              <div className="ml-14 sm:ml-0 sm:w-1/2 sm:pr-12 text-left">
                <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-[#121212] border border-gray-200 dark:border-zinc-800 shadow-sm hover:shadow-md transition-all">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                      Phase 1 • Foundations
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    The Vision &amp; Design SSOT
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-4">
                    Formulated the core design philosophy centered on cognitive calm and visual quiet. Created the comprehensive <span className="font-semibold text-gray-900 dark:text-white">DESIGN.md</span> single source of truth, establishing WCAG 2.1 AA dual-theme color architecture, fluid mobile drawer layouts, and unified typography.
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {['DESIGN.md SSOT', 'Zen Philosophy', 'WCAG 2.1 AA', 'Adaptive Layouts'].map((tag) => (
                      <span key={tag} className="text-[11px] px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-zinc-800/80 text-gray-700 dark:text-gray-300 border border-gray-200/80 dark:border-zinc-700/60 font-medium">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Phase 2 */}
            <div className="relative flex flex-col sm:flex-row items-start sm:items-center sm:justify-end">
              {/* Timeline Center Dot */}
              <div className="absolute left-6 sm:left-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-white dark:bg-[#121212] border-4 border-teal-500 flex items-center justify-center text-xs font-bold text-teal-600 dark:text-teal-400 shadow-[0_0_15px_rgba(20,184,166,0.5)] z-10">
                2
              </div>

              {/* Content Card (Right on Desktop) */}
              <div className="ml-14 sm:ml-0 sm:w-1/2 sm:pl-12 text-left">
                <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-[#121212] border border-gray-200 dark:border-zinc-800 shadow-sm hover:shadow-md transition-all">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-teal-500/10 text-teal-600 dark:text-teal-400">
                      Phase 2 • Feature Suite
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    The 5 Interconnected Modules
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-4">
                    Engineered the core modules from the ground up: interactive Task management with Kanban boards, habit streaks with consistency analytics, astronomical prayer calculations, morning and evening Adhkar with digital tasbeeh counters, and Pomodoro focus timers.
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {['Kanban & Tasks', 'Habit Streaks', 'Prayer Calculations', 'Adhkar Tasbeeh', 'Deep Focus'].map((tag) => (
                      <span key={tag} className="text-[11px] px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-zinc-800/80 text-gray-700 dark:text-gray-300 border border-gray-200/80 dark:border-zinc-700/60 font-medium">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Phase 3 */}
            <div className="relative flex flex-col sm:flex-row items-start sm:items-center">
              {/* Timeline Center Dot */}
              <div className="absolute left-6 sm:left-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-white dark:bg-[#121212] border-4 border-indigo-500 flex items-center justify-center text-xs font-bold text-indigo-600 dark:text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.5)] z-10">
                3
              </div>

              {/* Content Card (Left on Desktop) */}
              <div className="ml-14 sm:ml-0 sm:w-1/2 sm:pr-12 text-left">
                <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-[#121212] border border-gray-200 dark:border-zinc-800 shadow-sm hover:shadow-md transition-all">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                      Phase 3 • Full-Stack Security
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    Stateless JWT Authentication
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-4">
                    Architected an enterprise-ready, decoupled authentication pipeline. Implemented Django REST Framework SimpleJWT, CORS policies, Axios bearer interceptors with automatic session recovery, and strictly isolated multi-user data storage.
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {['Stateless JWT', 'Token Rotation', 'CORS Architecture', 'Data Isolation', 'Session Recovery'].map((tag) => (
                      <span key={tag} className="text-[11px] px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-zinc-800/80 text-gray-700 dark:text-gray-300 border border-gray-200/80 dark:border-zinc-700/60 font-medium">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Phase 4 */}
            <div className="relative flex flex-col sm:flex-row items-start sm:items-center sm:justify-end">
              {/* Timeline Center Dot */}
              <div className="absolute left-6 sm:left-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-white dark:bg-[#121212] border-4 border-emerald-500 flex items-center justify-center text-xs font-bold text-emerald-600 dark:text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.5)] z-10">
                4
              </div>

              {/* Content Card (Right on Desktop) */}
              <div className="ml-14 sm:ml-0 sm:w-1/2 sm:pl-12 text-left">
                <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-[#121212] border border-gray-200 dark:border-zinc-800 shadow-sm hover:shadow-md transition-all">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                      Phase 4 • Live Launch
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    Decoupled Cloud Deployment
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-4">
                    Packaged the platform for high availability and zero-downtime scaling: Lightning-fast Vite React frontend deployed to Vercel's Edge Network, connected to a scalable Django backend on Render with PostgreSQL and WhiteNoise asset serving.
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {['Vercel Edge Network', 'Render Cloud Engine', 'PostgreSQL Cloud DB', 'WhiteNoise Assets'].map((tag) => (
                      <span key={tag} className="text-[11px] px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-zinc-800/80 text-gray-700 dark:text-gray-300 border border-gray-200/80 dark:border-zinc-700/60 font-medium">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Bottom CTA Banner ─────────────────────────────────────── */}
      <section className="relative z-10 py-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
        <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-700 text-white shadow-2xl relative overflow-hidden">
          <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          <div className="max-w-2xl relative z-10">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4 text-white">
              Step Into Your Mindful Sanctuary Today.
            </h2>
            <p className="text-base sm:text-lg text-emerald-100 mb-8 leading-relaxed">
              No clutter, no friction. Just you, your daily cadence, and absolute peace of mind.
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <Link
                to="/register"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl bg-white text-emerald-800 hover:bg-emerald-50 font-bold text-base shadow-lg transition-all"
              >
                <span>Create Free Account</span>
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-emerald-700/60 hover:bg-emerald-700 text-white font-semibold text-base border border-emerald-400/30 transition-all"
              >
                <span>Sign In</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Minimalist Brand Footer ───────────────────────────────── */}
      <footer className="relative z-10 border-t border-gray-200 dark:border-zinc-800/80 pt-12 pb-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto transition-colors">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pb-8">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-lg">
              🏛️
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-gray-900 dark:text-white">Pillar</span>
              <p className="text-xs text-gray-600 dark:text-gray-400">Your Mindful Life &amp; Productivity Sanctuary</p>
            </div>
          </div>

          <div className="flex items-center gap-6 text-sm font-medium text-gray-600 dark:text-gray-400">
            <Link to="/login" className="hover:text-gray-900 dark:hover:text-white transition-colors">
              Sign In
            </Link>
            <Link to="/register" className="hover:text-gray-900 dark:hover:text-white transition-colors">
              Create Account
            </Link>
          </div>
        </div>

        <div className="border-t border-gray-100 dark:border-zinc-800/60 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-600 dark:text-gray-400">
          <p>© {new Date().getFullYear()} Pillar. All rights reserved.</p>
          <p>Designed with intentionality, minimalism, and spiritual peace.</p>
        </div>
      </footer>

      {/* ─── Meet the Developer Section ───────────────────────────── */}
      <section id="developer" className="w-full border-t border-gray-200 dark:border-zinc-800/50 bg-gray-50/50 dark:bg-[#0a0a0a]/50 py-24">
        <div className="max-w-4xl mx-auto px-4 text-center flex flex-col items-center">
          <span className="text-sm font-semibold tracking-wider text-emerald-600 uppercase mb-4">
            Designed &amp; Engineered By
          </span>
          <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-6 tracking-tight">
            Houssem Eddine Saifi
          </h2>
          <p className="text-lg text-gray-500 dark:text-gray-400 mb-10 max-w-xl mx-auto leading-relaxed">
            Full-Stack Developer building mindful, high-performance applications bridging the gap between productivity and intentional living.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <a
              href="https://github.com/Houssemcode"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-8 py-4 rounded-2xl bg-gray-900 text-white dark:bg-white dark:text-gray-900 font-semibold hover:-translate-y-1 transition-all shadow-lg hover:shadow-xl"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" aria-hidden="true"><path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"></path></svg>
              GitHub Profile
            </a>
            <a
              href="https://houssemcode.github.io/houssem.me/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-8 py-4 rounded-2xl border-2 border-gray-200 dark:border-zinc-800 bg-white dark:bg-[#121212] text-gray-900 dark:text-white font-semibold hover:border-emerald-500 dark:hover:border-emerald-500 hover:-translate-y-1 transition-all shadow-sm"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"></path></svg>
              Portfolio Site
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}
