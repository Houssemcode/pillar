import { useState, useEffect, useRef } from 'react'
import ProgressRing from '../components/ui/ProgressRing'
import { useToast } from '../context/ToastContext'
import { focusApi } from '../api/focus'

/* ─── Config ──────────────────────────────────────────────── */
const MODES = [
  { key: 'pomodoro', label: 'Pomodoro', duration: 25 * 60 },
  { key: 'short',    label: 'Short Break', duration: 5 * 60 },
  { key: 'long',     label: 'Long Break', duration: 15 * 60 },
]

const DAILY_GOAL = 8  // sessions target per day

// Week day labels
const WEEK_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

/* ─── Helpers ─────────────────────────────────────────────── */
const PRIMARY = 'var(--color-primary)'

function pad(n) { return String(n).padStart(2, '0') }

/* ─── Mini Circular Progress ─────────────────────────────── */
function CircularGoal({ done, goal }) {
  const pct = Math.min((done / goal) * 100, 100)
  const r = 52
  const circ = 2 * Math.PI * r
  const dash = (pct / 100) * circ

  return (
    <div className="focus-goal-ring-wrap">
      <svg width="130" height="130" viewBox="0 0 130 130">
        <circle cx="65" cy="65" r={r} fill="none" stroke="var(--color-surface-3)" strokeWidth="8" />
        <circle
          cx="65" cy="65" r={r} fill="none"
          stroke={PRIMARY}
          strokeWidth="8"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          transform="rotate(-90 65 65)"
          style={{ transition: 'stroke-dasharray 600ms ease' }}
        />
        {/* Dot at tip */}
        {pct > 2 && (
          <circle
            cx={65 + r * Math.cos((pct / 100 * 360 - 90) * Math.PI / 180)}
            cy={65 + r * Math.sin((pct / 100 * 360 - 90) * Math.PI / 180)}
            r="5" fill={PRIMARY}
          />
        )}
      </svg>
      <div className="focus-goal-ring-label">
        <span className="focus-goal-ring-done">{done}</span>
        <span className="focus-goal-ring-sep">/{goal}</span>
        <span className="focus-goal-ring-unit">sessions</span>
      </div>
    </div>
  )
}

/* ─── Pip Set Counter ────────────────────────────────────── */
function SetPips({ pomodoros }) {
  const filled = pomodoros % 4 === 0 && pomodoros > 0 ? 4 : pomodoros % 4
  const setNum = Math.floor(pomodoros / 4)
  return (
    <div className="focus-set-pips">
      {[0, 1, 2, 3].map(i => (
        <div
          key={i}
          className={`focus-set-pip ${i < filled ? 'focus-set-pip--filled' : ''}`}
        />
      ))}
      <span className="focus-set-label">Set {setNum}</span>
    </div>
  )
}

/* ─── Weekly Bar Chart ───────────────────────────────────── */
function WeeklyChart({ weekData }) {
  const todayIdx = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1
  const bars = WEEK_DAYS.map((d, i) => ({
    day: d,
    count: weekData[i] ?? 0,
    isToday: i === todayIdx,
  }))
  const max = Math.max(...bars.map(b => b.count), 1)

  return (
    <div className="focus-weekly-chart">
      {bars.map(b => (
        <div key={b.day} className="focus-weekly-bar-col">
          <div className="focus-weekly-bar-track">
            <div
              className={`focus-weekly-bar-fill ${b.isToday ? 'focus-weekly-bar-fill--today' : ''}`}
              style={{ height: `${(b.count / max) * 100}%` }}
            />
          </div>
          <span className={`focus-weekly-bar-label ${b.isToday ? 'focus-weekly-bar-label--today' : ''}`}>
            {b.day}
          </span>
        </div>
      ))}
    </div>
  )
}

/* ─── Session Row ────────────────────────────────────────── */
function SessionRow({ s, isBreak }) {
  return (
    <div className="focus-session-row">
      <div className={`focus-session-icon ${isBreak ? 'focus-session-icon--break' : ''}`}>
        {isBreak ? '☕' : '🍅'}
      </div>
      <div className="focus-session-info">
        <span className="focus-session-time">{s.time}</span>
        <span className="focus-session-label">{s.label}</span>
      </div>
      <span className="focus-session-dur">{s.duration}</span>
    </div>
  )
}

/* ─── Main Component ─────────────────────────────────────── */
export default function Focus() {
  const { toastFocus, toastStreak } = useToast()
  const [mode, setMode] = useState(0)
  const [secondsLeft, setSecondsLeft] = useState(MODES[0].duration)
  const [running, setRunning] = useState(false)
  const [pomodoros, setPomodoros] = useState(0)
  const [sessions, setSessions] = useState([])
  const [weekData, setWeekData] = useState(Array(7).fill(0))
  const [task, setTask] = useState('')
  const startedAtRef = useRef(null)
  const intervalRef = useRef(null)

  /* ── Bootstrap: load today's sessions from API ── */
  useEffect(() => {
    focusApi.today()
      .then(data => {
        setPomodoros(data.count)
        setSessions(data.sessions.map(s => ({
          label: s.label,
          duration: `${s.duration_minutes}m`,
          time: s.completed_at ? new Date(s.completed_at).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit', hour12: false }) : '',
          isBreak: s.mode !== 'pomodoro',
        })))
      })
      .catch(() => {}) // silently ignore if offline
    focusApi.weekly()
      .then(data => setWeekData(data.map(d => d.count)))
      .catch(() => {})
  }, [])

  const totalSeconds = MODES[mode].duration
  const progress = ((totalSeconds - secondsLeft) / totalSeconds) * 100
  const minutes = pad(Math.floor(secondsLeft / 60))
  const secs = pad(secondsLeft % 60)

  /* ── Timer tick ── */
  useEffect(() => {
    if (running) {
      if (!startedAtRef.current) startedAtRef.current = new Date().toISOString()
      intervalRef.current = setInterval(() => {
        setSecondsLeft(prev => {
          if (prev <= 1) {
            setRunning(false)
            if (MODES[mode].key === 'pomodoro') {
              const newCount = pomodoros + 1
              setPomodoros(newCount)
              const now = new Date()
              const timeStr = `${pad(now.getHours())}:${pad(now.getMinutes())}`
              const sessionEntry = {
                label: task || 'Focus Session',
                duration: `${MODES[mode].duration / 60}m`,
                time: timeStr,
                isBreak: false,
              }
              setSessions(p => [sessionEntry, ...p].slice(0, 20))
              // Log to backend (fire-and-forget)
              focusApi.logSession({
                label: task || 'Focus Session',
                duration_minutes: MODES[mode].duration / 60,
                mode: 'pomodoro',
                started_at: startedAtRef.current || now.toISOString(),
              }).catch(() => {})
              startedAtRef.current = null
              if (newCount % 4 === 0) {
                toastStreak('4 sessions done! 🎉', 'Take a long break — you earned it.')
              } else {
                toastFocus('Session complete 🍅', task ? `"${task}" — well done!` : 'Take a short break.')
              }
            }
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } else {
      clearInterval(intervalRef.current)
    }
    return () => clearInterval(intervalRef.current)
  }, [running, mode, task, pomodoros])

  const switchMode = idx => { setMode(idx); setSecondsLeft(MODES[idx].duration); setRunning(false) }
  const reset = () => { setSecondsLeft(MODES[mode].duration); setRunning(false) }
  const toggleTimer = () => { if (secondsLeft === 0) reset(); else setRunning(r => !r) }

  return (
    <div className="page focus-page">

      {/* ── Top badge ── */}
      <div className="focus-top-bar">
        <div className="focus-badge">
          🍅 <strong>{pomodoros}</strong> sessions today
        </div>
      </div>

      {/* ── Main 2-column dashboard ── */}
      <div className="focus-dashboard">

        {/* ═══ LEFT — Timer ═══ */}
        <div className="focus-timer-col">

          {/* Mode tabs */}
          <div className="focus-mode-tabs">
            {MODES.map((m, i) => (
              <button
                key={m.key}
                id={`focus-mode-${m.key}`}
                onClick={() => switchMode(i)}
                className={`focus-mode-tab ${mode === i ? 'focus-mode-tab--active' : ''}`}
              >
                {m.label}
              </button>
            ))}
          </div>

          {/* Active task input */}
          <div className="focus-task-input-wrap">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="focus-task-icon">
              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
            <input
              id="focus-active-task"
              className="focus-task-input"
              placeholder="What are you working on?"
              value={task}
              onChange={e => setTask(e.target.value)}
            />
          </div>

          {/* Timer ring */}
          <div className="focus-ring-wrap">
            <ProgressRing radius={120} strokeWidth={8} progress={progress} size={260}>
              <div className="focus-ring-inner">
                <div className="focus-ring-time">{minutes}:{secs}</div>
                <div className="focus-ring-mode">{MODES[mode].label}</div>
                {running && task && (
                  <div className="focus-ring-task">{task}</div>
                )}
              </div>
            </ProgressRing>
          </div>

          {/* Controls */}
          <div className="focus-controls">
            <button className="focus-ctrl-btn" onClick={reset} aria-label="Reset">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <polyline points="1,4 1,10 7,10" /><path d="M3.51 15a9 9 0 1 0 .49-4.44" />
              </svg>
            </button>
            <button className="focus-play-btn" onClick={toggleTimer} aria-label={running ? 'Pause' : 'Start'}>
              {running ? (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="4" width="4" height="16" rx="1" /><rect x="14" y="4" width="4" height="16" rx="1" />
                </svg>
              ) : (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="5,3 19,12 5,21" />
                </svg>
              )}
            </button>
            <button className="focus-ctrl-btn" onClick={() => switchMode((mode + 1) % MODES.length)} aria-label="Skip">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <polygon points="5,4 15,12 5,20" /><line x1="19" y1="5" x2="19" y2="19" />
              </svg>
            </button>
          </div>

          {/* Set pips */}
          <SetPips pomodoros={pomodoros} />

        </div>

        {/* ═══ RIGHT — Analytics ═══ */}
        <div className="focus-analytics-col">
          <div className="focus-analytics-header">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
            </svg>
            Focus Analytics
          </div>

          {/* Goal progress ring */}
          <div className="focus-analytics-card">
            <div className="focus-analytics-card-title">Goal progress in the day</div>
            <CircularGoal done={pomodoros} goal={DAILY_GOAL} />
          </div>

          {/* Set counter */}
          <div className="focus-analytics-card">
            <div className="focus-analytics-card-title">Set counter</div>
            <SetPips pomodoros={pomodoros} />
          </div>

          {/* Recent sessions */}
          <div className="focus-analytics-card focus-analytics-card--sessions">
            <div className="focus-analytics-card-title">Recent Sessions</div>
            {sessions.length === 0 ? (
              <div className="focus-sessions-empty">No sessions yet — start your first one!</div>
            ) : (
              <div className="focus-sessions-list-new">
                {sessions.slice(0, 5).map((s, i) => (
                  <SessionRow key={i} s={s} isBreak={s.isBreak} />
                ))}
              </div>
            )}
          </div>

          {/* Weekly chart */}
          <div className="focus-analytics-card">
            <div className="focus-analytics-card-title">Mini Weekly Focus Breakdown</div>
            <WeeklyChart weekData={weekData} />
          </div>

        </div>
      </div>
    </div>
  )
}
