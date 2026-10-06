import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useUser } from '../context/UserContext'

const MILESTONES = [
  {
    phase: 'Phase 1',
    title: 'The Vision',
    description: 'Building the core UI and minimalist design system.',
    badge: 'Foundations',
  },
  {
    phase: 'Phase 2',
    title: 'The Modules',
    description: 'Developing interconnected Tasks, Habits, and Calendar logic.',
    badge: 'Core Suite',
  },
  {
    phase: 'Phase 3',
    title: 'The Architecture',
    description: 'Implementing robust JWT Authentication and secure API routing.',
    badge: 'Full-Stack Security',
  },
  {
    phase: 'Phase 4',
    title: 'The Launch',
    description: 'Deploying the decoupled stack to Vercel and Render.',
    badge: 'Production Cloud',
  },
]

export default function Landing() {
  const { user } = useAuth()
  const { colorTheme, toggleTheme } = useUser()

  return (
    <div className="min-h-screen w-full bg-gray-50 dark:bg-[#0a0a0a] text-gray-900 dark:text-white transition-colors duration-200 flex flex-col selection:bg-emerald-500 selection:text-white overflow-x-hidden">
      {/* ─── Top Navbar ─────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-white/80 dark:bg-[#0a0a0a]/80 border-b border-gray-200/80 dark:border-zinc-800/80 transition-colors">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Brand */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xl shadow-sm transition-transform group-hover:scale-105">
              🏛️
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
                Pillar
              </span>
              <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                Sanctuary
              </span>
            </div>
          </Link>

          {/* Right Action Controls */}
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

            {user ? (
              <Link
                to="/today"
                className="text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white px-4 py-2 rounded-xl shadow-sm shadow-emerald-600/25 transition-all flex items-center gap-1.5"
              >
                <span>Dashboard</span>
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-sm font-semibold text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white px-3 py-2 rounded-xl transition-colors"
                >
                  Sign In
                </Link>
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
              </>
            )}
          </div>
        </div>
      </header>

      {/* ─── Section 1: Hero (Top) ─────────────────────────────────── */}
      <section className="pt-20 pb-20 px-4 sm:px-6 max-w-5xl mx-auto text-center flex flex-col items-center">
        {/* Subtle Pill Tag */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 mb-8 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Mindful Life &amp; Productivity Sanctuary</span>
        </div>

        {/* Gradient Headline */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-gray-900 via-emerald-800 to-gray-900 dark:from-white dark:via-emerald-400 dark:to-zinc-200 leading-[1.12] mb-6 max-w-4xl">
          Your Mindful Life &amp; Productivity Sanctuary.
        </h1>

        {/* Subheadline */}
        <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto font-normal leading-relaxed mb-10">
          Seamlessly integrate your tasks, habits, focus sessions, and faith into one beautifully designed, unified system.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">
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
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-white dark:bg-[#121212] text-gray-800 dark:text-gray-200 border border-gray-300 dark:border-zinc-800 hover:bg-gray-100 dark:hover:bg-zinc-800/80 font-semibold text-base shadow-sm hover:-translate-y-0.5 transition-all duration-150"
          >
            <span>Sign In</span>
          </Link>
        </div>
      </section>

      {/* ─── Section 2: The Journey Timeline (Middle) ──────────────── */}
      <section className="py-20 px-4 sm:px-6 max-w-4xl mx-auto w-full">
        <div className="text-center mb-16">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            Roadmap &amp; Milestones
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white mt-3 tracking-tight">
            The Evolution of Pillar
          </h2>
        </div>

        {/* Vertical Timeline */}
        <div className="relative">
          {/* Vertical central/left spine line */}
          <div className="absolute left-6 sm:left-1/2 top-4 bottom-4 w-0.5 -translate-x-1/2 bg-gradient-to-b from-emerald-500 via-teal-500 to-indigo-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]" />

          <div className="space-y-10 sm:space-y-12">
            {MILESTONES.map((item, index) => {
              const isEven = index % 2 === 0
              return (
                <div
                  key={item.phase}
                  className={`relative flex flex-col sm:flex-row items-start sm:items-center ${
                    isEven ? '' : 'sm:justify-end'
                  }`}
                >
                  {/* Glowing Node Dot */}
                  <div className="absolute left-6 sm:left-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-white dark:bg-[#121212] border-4 border-emerald-500 flex items-center justify-center text-xs font-bold text-emerald-600 dark:text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.4)] z-10">
                    {index + 1}
                  </div>

                  {/* Card Content */}
                  <div
                    className={`ml-14 sm:ml-0 sm:w-1/2 text-left ${
                      isEven ? 'sm:pr-12' : 'sm:pl-12'
                    }`}
                  >
                    <div className="p-6 rounded-3xl bg-white dark:bg-[#121212] border border-gray-200 dark:border-zinc-800 shadow-sm hover:shadow-md transition-all">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                          {item.phase}
                        </span>
                        <span className="text-[11px] text-gray-400">• {item.badge}</span>
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                        {item.title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ─── Section 3: Meet the Developer (Bottom) ────────────────── */}
      <section className="w-full border-t border-gray-200 dark:border-zinc-800/50 bg-white/50 dark:bg-[#121212]/50 py-24 mt-auto">
        <div className="max-w-4xl mx-auto px-4 text-center flex flex-col items-center">
          <span className="text-sm font-semibold tracking-wider text-emerald-600 uppercase mb-4">
            Designed &amp; Engineered By
          </span>
          <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-6 tracking-tight">
            Houssem Eddine Saifi
          </h2>
          <p className="text-lg text-gray-500 dark:text-gray-400 mb-10 max-w-xl mx-auto leading-relaxed">
            Full-Stack Developer building mindful, high-performance applications.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            {/* GitHub Button */}
            <a
              href="https://github.com/Houssemcode"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-8 py-4 rounded-2xl bg-gray-900 text-white dark:bg-white dark:text-gray-900 font-semibold hover:-translate-y-1 transition-all shadow-lg hover:shadow-xl"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" aria-hidden="true">
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                />
              </svg>
              <span>GitHub</span>
            </a>

            {/* Portfolio Button */}
            <a
              href="https://houssemcode.github.io/houssem.me/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-8 py-4 rounded-2xl border-2 border-gray-200 dark:border-zinc-800 bg-white dark:bg-[#121212] text-gray-900 dark:text-white font-semibold hover:border-emerald-500 dark:hover:border-emerald-500 hover:-translate-y-1 transition-all shadow-sm"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="12" cy="12" r="10" strokeWidth="2" />
                <line x1="2" y1="12" x2="22" y2="12" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"
                />
              </svg>
              <span>Portfolio</span>
            </a>
          </div>
        </div>
      </section>

      {/* ─── Footer ───────────────────────────────────────────────── */}
      <footer className="border-t border-gray-200 dark:border-zinc-800/80 py-8 px-4 text-center text-xs text-gray-500 dark:text-gray-400">
        <p>© {new Date().getFullYear()} Pillar. All rights reserved.</p>
      </footer>
    </div>
  )
}
