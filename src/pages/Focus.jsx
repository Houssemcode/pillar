import { useState, useEffect, useRef } from 'react'
import ProgressRing from '../components/ui/ProgressRing'
import StatCard from '../components/ui/StatCard'

const MODES = [
  { key: 'pomodoro', label: 'Pomodoro', duration: 25 * 60, color: 'var(--color-primary)' },
  { key: 'short',    label: 'Short Break', duration: 5 * 60, color: 'var(--color-text-muted)' },
  { key: 'long',     label: 'Long Break', duration: 15 * 60, color: 'var(--color-text-muted)' },
]

const SESSIONS_TODAY = [
  { label: 'Design System Tokens', duration: '25m', time: '09:00' },
  { label: 'Component Architecture', duration: '25m', time: '09:35' },
  { label: 'API Integration Review', duration: '25m', time: '11:00' },
]

export default function Focus() {
  const [mode, setMode] = useState(0)
  const [secondsLeft, setSecondsLeft] = useState(MODES[0].duration)
  const [running, setRunning] = useState(false)
  const [pomodoros, setPomodoros] = useState(3)
  const [sessions] = useState(SESSIONS_TODAY)
  const [task, setTask] = useState('')
  const intervalRef = useRef(null)

  const totalSeconds = MODES[mode].duration
  const progress = ((totalSeconds - secondsLeft) / totalSeconds) * 100

  const minutes = String(Math.floor(secondsLeft / 60)).padStart(2, '0')
  const secs = String(secondsLeft % 60).padStart(2, '0')

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setSecondsLeft(prev => {
          if (prev <= 1) {
            setRunning(false)
            if (MODES[mode].key === 'pomodoro') setPomodoros(p => p + 1)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } else {
      clearInterval(intervalRef.current)
    }
    return () => clearInterval(intervalRef.current)
  }, [running, mode])

  const switchMode = (idx) => {
    setMode(idx)
    setSecondsLeft(MODES[idx].duration)
    setRunning(false)
  }

  const reset = () => {
    setSecondsLeft(MODES[mode].duration)
    setRunning(false)
  }

  const toggleTimer = () => {
    if (secondsLeft === 0) reset()
    else setRunning(r => !r)
  }

  // Build the 4-pomodoro pips row
  const pomSet = Math.ceil(pomodoros / 4)
  const pipCount = 4
  const filledPips = pomodoros % 4 === 0 && pomodoros > 0 ? 4 : pomodoros % 4

  return (
    <div className="page" style={{ alignItems: 'center' }}>
      {/* Header */}
      <div className="page-header" style={{ width: '100%', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Focus</h1>
          <div className="page-subtitle">Deep work, one session at a time</div>
        </div>
        <div className="badge" style={{ fontSize: 13, padding: '6px 14px' }}>
          🍅 {pomodoros} sessions today
        </div>
      </div>

      {/* Mode selector */}
      <div style={{ display: 'flex', background: 'var(--color-surface-2)', borderRadius: 12, padding: 4, gap: 2, width: '100%', border: '1px solid var(--color-border)' }}>
        {MODES.map((m, i) => (
          <button
            key={m.key}
            onClick={() => switchMode(i)}
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: 9,
              border: 'none',
              background: mode === i ? 'var(--color-primary)' : 'transparent',
              color: mode === i ? '#fff' : 'var(--color-text-muted)',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 200ms ease',
            }}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Current task input */}
      <input
        className="input"
        placeholder="What are you working on?"
        value={task}
        onChange={e => setTask(e.target.value)}
        style={{ textAlign: 'center' }}
      />

      {/* Pomodoro pips */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        {Array.from({ length: pipCount }).map((_, i) => (
          <div key={i} style={{
            width: 10, height: 10, borderRadius: '50%',
            background: i < filledPips ? 'var(--color-primary)' : 'var(--color-surface-3)',
            border: `1.5px solid ${i < filledPips ? 'var(--color-primary)' : 'var(--color-border)'}`,
            transition: 'all 300ms ease',
          }} />
        ))}
        <span style={{ fontSize: 11, color: 'var(--color-text-muted)', marginLeft: 4 }}>
          Set {pomSet}
        </span>
      </div>

      {/* Main timer ring */}
      <ProgressRing
        radius={120}
        strokeWidth={8}
        progress={progress}
        size={240}
      >
        <div style={{ textAlign: 'center' }}>
          <div style={{
            fontSize: 52,
            fontWeight: 200,
            letterSpacing: '-3px',
            color: 'var(--color-text)',
            fontVariantNumeric: 'tabular-nums',
            lineHeight: 1,
          }}>
            {minutes}:{secs}
          </div>
          <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 6 }}>
            {MODES[mode].label}
          </div>
          {running && task && (
            <div style={{ fontSize: 11, color: 'var(--color-primary)', marginTop: 8, maxWidth: 160, textAlign: 'center' }}>
              {task}
            </div>
          )}
        </div>
      </ProgressRing>

      {/* Controls */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <button
          className="btn btn-ghost"
          style={{ width: 44, height: 44, borderRadius: '50%', padding: 0 }}
          onClick={reset}
          aria-label="Reset"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <polyline points="1,4 1,10 7,10"/>
            <path d="M3.51 15a9 9 0 1 0 .49-4.44"/>
          </svg>
        </button>

        <button
          onClick={toggleTimer}
          style={{
            width: 72, height: 72, borderRadius: '50%',
            background: 'var(--color-primary)',
            border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 8px 32px var(--color-primary-glow)',
            transition: 'all 250ms ease',
            color: '#fff',
          }}
          aria-label={running ? 'Pause' : 'Start'}
        >
          {running ? (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/>
            </svg>
          ) : (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="5,3 19,12 5,21"/>
            </svg>
          )}
        </button>

        <button
          className="btn btn-ghost"
          style={{ width: 44, height: 44, borderRadius: '50%', padding: 0 }}
          onClick={() => switchMode((mode + 1) % MODES.length)}
          aria-label="Skip"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <polygon points="5,4 15,12 5,20"/><line x1="19" y1="5" x2="19" y2="19"/>
          </svg>
        </button>
      </div>

      {/* Session history */}
      <div style={{ width: '100%' }}>
        <div className="section-label">Today's Sessions</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {sessions.map((s, i) => (
            <div key={i} className="card" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 18px' }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8,
                background: 'var(--color-primary-subtle)',
                border: '1px solid var(--color-primary-muted)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 16, flexShrink: 0,
              }}>🍅</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text)' }}>{s.label}</div>
                <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{s.time} · {s.duration}</div>
              </div>
              <span className="badge">{s.duration}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
