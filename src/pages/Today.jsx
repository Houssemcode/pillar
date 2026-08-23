import { useState } from 'react'
import ColorDot from '../components/ui/ColorDot'
import { getModuleTheme } from '../theme/moduleThemes'

const TODAY = new Date()
const DATE_STR = TODAY.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

// Sample aggregated day data
const TIMELINE = [
  { time: '06:00', label: 'Fajr Prayer', module: 'faith', done: true },
  { time: '07:30', label: 'Morning Run habit', module: 'habits', done: true },
  { time: '08:00', label: 'Review daily goals', module: 'tasks', done: true },
  { time: '09:00', label: 'Deep work session — Project Docs', module: 'focus', done: false },
  { time: '10:30', label: 'Team stand-up call', module: 'calendar', done: false },
  { time: '12:00', label: 'Dhuhr Prayer', module: 'faith', done: false },
  { time: '13:00', label: 'Lunch break walk', module: 'habits', done: false },
  { time: '14:00', label: 'Finish design spec', module: 'tasks', done: false },
  { time: '15:30', label: 'Asr Prayer', module: 'faith', done: false },
  { time: '16:00', label: 'Pomodoro — Feature build', module: 'focus', done: false },
  { time: '18:00', label: 'Maghrib Prayer', module: 'faith', done: false },
  { time: '19:00', label: 'Weekly planning', module: 'calendar', done: false },
  { time: '20:30', label: 'Read 30 minutes', module: 'habits', done: false },
  { time: '21:30', label: 'Isha Prayer', module: 'faith', done: false },
]

const MODULE_SUMMARY = [
  { key: 'tasks', label: 'Tasks', value: '3/7', icon: '✓' },
  { key: 'habits', label: 'Habits', value: '2/5', icon: '⚡' },
  { key: 'focus', label: 'Focus', value: '1h 20m', icon: '◎' },
  { key: 'faith', label: 'Faith', value: '1/5', icon: '◈' },
]

export default function Today() {
  const [timeline, setTimeline] = useState(TIMELINE)

  const toggleItem = (idx) => {
    setTimeline(prev => prev.map((item, i) =>
      i === idx ? { ...item, done: !item.done } : item
    ))
  }

  const doneCount = timeline.filter(t => t.done).length
  const progress = Math.round((doneCount / timeline.length) * 100)

  return (
    <div className="page">
      {/* Header */}
      <div className="page-header">
        <div>
          <div style={{ fontSize: 12, color: 'var(--color-text-muted)', fontWeight: 500, marginBottom: 4 }}>
            {DATE_STR}
          </div>
          <h1 className="page-title">Good morning 👋</h1>
          <div className="page-subtitle">{doneCount} of {timeline.length} items complete today</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--color-primary)' }}>
            {progress}%
          </div>
          <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>day progress</div>
        </div>
      </div>

      {/* Day progress bar */}
      <div style={{ background: 'var(--color-surface-2)', borderRadius: 8, overflow: 'hidden', height: 6 }}>
        <div style={{
          height: '100%',
          width: `${progress}%`,
          background: 'var(--color-primary)',
          borderRadius: 8,
          transition: 'width 600ms cubic-bezier(0.4, 0, 0.2, 1)'
        }} />
      </div>

      {/* Two-column layout: summary + timeline */}
      <div className="today-layout">

        {/* Module summary cards — horizontal scroll on mobile */}
        <div className="today-summary-strip">
          {MODULE_SUMMARY.map(item => {
            const theme = getModuleTheme(item.key)
            return (
              <div key={item.key} className="today-summary-card glass-card" style={{ padding: '14px 16px' }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 10,
                  background: `${theme.color}18`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14, color: theme.color, flexShrink: 0,
                  border: `1px solid ${theme.color}30`,
                }}>
                  {item.icon}
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--color-text-muted)', fontWeight: 500 }}>{item.label}</div>
                  <div style={{ fontSize: 17, fontWeight: 700, color: theme.color }}>{item.value}</div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Timeline */}
        <div>
          <div className="section-label">Daily Timeline</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {timeline.map((item, idx) => {
              const theme = getModuleTheme(item.module)
              const isNow = idx === timeline.findIndex(t => !t.done)
              return (
                <div
                  key={idx}
                  onClick={() => toggleItem(idx)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    padding: '12px 16px',
                    borderRadius: 10,
                    cursor: 'pointer',
                    background: isNow ? `${theme.color}10` : 'transparent',
                    border: isNow ? `1px solid ${theme.color}30` : '1px solid transparent',
                    opacity: item.done ? 0.5 : 1,
                    transition: 'all 200ms ease',
                  }}
                >
                  {/* Time */}
                  <div style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: 'var(--color-text-muted)',
                    width: 42,
                    flexShrink: 0,
                    fontVariantNumeric: 'tabular-nums',
                  }}>
                    {item.time}
                  </div>

                  {/* Timeline dot */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                    <ColorDot moduleKey={item.module} size={9} />
                  </div>

                  {/* Label */}
                  <div style={{
                    fontSize: 14,
                    color: item.done ? 'var(--color-text-muted)' : 'var(--color-text)',
                    textDecoration: item.done ? 'line-through' : 'none',
                    flex: 1,
                    fontWeight: isNow ? 500 : 400,
                  }}>
                    {item.label}
                  </div>

                  {/* Module badge */}
                  <span className="today-module-badge" style={{
                    color: theme.color,
                    background: `${theme.color}15`,
                    border: `1px solid ${theme.color}30`,
                  }}>
                    {item.module}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
