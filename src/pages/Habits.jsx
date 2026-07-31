import { useState } from 'react'
import ProgressRing from '../components/ui/ProgressRing'
import StatCard from '../components/ui/StatCard'

const HABITS = [
  { id: 1, name: 'Morning Run', emoji: '🏃', streak: 12, target: 7, done: true },
  { id: 2, name: 'Read 30 min', emoji: '📚', streak: 5, target: 7, done: true },
  { id: 3, name: 'Meditate', emoji: '🧘', streak: 21, target: 7, done: false },
  { id: 4, name: 'No Sugar', emoji: '🍎', streak: 3, target: 7, done: false },
  { id: 5, name: 'Drink 2L Water', emoji: '💧', streak: 8, target: 7, done: false },
  { id: 6, name: 'Cold Shower', emoji: '🚿', streak: 0, target: 7, done: false },
]

// Generate a simple heatmap for the past 35 days
const HEATMAP = Array.from({ length: 35 }, (_, i) => {
  const rand = Math.random()
  if (rand > 0.7) return 3
  if (rand > 0.4) return 2
  if (rand > 0.2) return 1
  return 0
})

const INTENSITY = ['var(--color-surface-3)', 'var(--color-primary-muted)', 'var(--color-primary)', '#F59E0B']

export default function Habits() {
  const [habits, setHabits] = useState(HABITS)
  const doneToday = habits.filter(h => h.done).length
  const overallProgress = Math.round((doneToday / habits.length) * 100)

  const toggle = (id) => {
    setHabits(prev => prev.map(h =>
      h.id === id ? { ...h, done: !h.done, streak: !h.done ? h.streak + 1 : Math.max(0, h.streak - 1) } : h
    ))
  }

  return (
    <div className="page">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Habits</h1>
          <div className="page-subtitle">Build consistency, day by day</div>
        </div>
        <ProgressRing radius={34} strokeWidth={5} progress={overallProgress} size={68}>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-primary)' }}>
            {doneToday}/{habits.length}
          </span>
        </ProgressRing>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        <StatCard label="Done today" value={doneToday} accent />
        <StatCard label="Best streak" value="21d" />
        <StatCard label="Completion" value={`${overallProgress}%`} accent />
      </div>

      {/* Activity heatmap */}
      <div className="card">
        <div className="section-label" style={{ marginBottom: 14 }}>Activity — Last 5 Weeks</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 5 }}>
          {HEATMAP.map((level, i) => (
            <div
              key={i}
              title={`${level} habits`}
              style={{
                aspectRatio: '1',
                borderRadius: 4,
                background: level === 0 ? 'var(--color-surface-3)' :
                  level === 1 ? 'var(--color-primary-muted)' :
                  level === 2 ? 'var(--color-primary)' : 'var(--color-primary)',
                opacity: level === 0 ? 1 : level === 1 ? 0.4 : level === 2 ? 0.75 : 1,
                transition: 'all 200ms ease',
              }}
            />
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 12 }}>
          <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>Less</span>
          {[0, 1, 2, 3].map(l => (
            <div key={l} style={{
              width: 12, height: 12, borderRadius: 3,
              background: l === 0 ? 'var(--color-surface-3)' : 'var(--color-primary)',
              opacity: l === 0 ? 1 : l === 1 ? 0.4 : l === 2 ? 0.75 : 1,
            }} />
          ))}
          <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>More</span>
        </div>
      </div>

      {/* Habit list */}
      <div>
        <div className="section-label">Today's Habits</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {habits.map(habit => (
            <div
              key={habit.id}
              onClick={() => toggle(habit.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                padding: '16px 18px',
                borderRadius: 14,
                cursor: 'pointer',
                background: habit.done ? 'var(--color-primary-subtle)' : 'var(--color-surface-2)',
                border: `1px solid ${habit.done ? 'var(--color-primary-muted)' : 'var(--color-border)'}`,
                transition: 'all 200ms ease',
              }}
            >
              {/* Emoji */}
              <div style={{
                width: 40, height: 40, borderRadius: 12,
                background: 'var(--color-surface-3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 20, flexShrink: 0,
              }}>
                {habit.emoji}
              </div>

              {/* Name + streak */}
              <div style={{ flex: 1 }}>
                <div style={{
                  fontSize: 14, fontWeight: 500,
                  color: habit.done ? 'var(--color-primary)' : 'var(--color-text)',
                }}>
                  {habit.name}
                </div>
                <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 2 }}>
                  {habit.streak > 0
                    ? <span style={{ color: 'var(--color-primary)' }}>🔥 {habit.streak} day streak</span>
                    : 'Start your streak today'}
                </div>
              </div>

              {/* Check ring */}
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                border: `2px solid ${habit.done ? 'var(--color-primary)' : 'var(--color-border)'}`,
                background: habit.done ? 'var(--color-primary)' : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
                transition: 'all 200ms ease',
              }}>
                {habit.done && (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20,6 9,17 4,12"/>
                  </svg>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
