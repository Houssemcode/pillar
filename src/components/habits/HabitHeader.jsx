import { useMemo } from 'react'
import { dateKey } from '../../utils/habitDateUtils'

function sameDay(a, b) {
  if (!a || !b) return false
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

export default function HabitHeader({
  habits = [],
  selectedDate = new Date(),
  today = new Date(),
}) {
  const dk = useMemo(() => dateKey(selectedDate), [selectedDate])

  const activeHabits = useMemo(
    () => habits.filter((h) => !h.is_archived),
    [habits]
  )

  const total = activeHabits.length
  const completedCount = useMemo(
    () => activeHabits.filter((h) => h.completedDates?.has(dk)).length,
    [activeHabits, dk]
  )

  const pct = total > 0 ? Math.round((completedCount / total) * 100) : 0
  const isToday = sameDay(selectedDate, today)

  // Longest streak among active habits
  const topStreak = useMemo(() => {
    if (activeHabits.length === 0) return 0
    return Math.max(...activeHabits.map((h) => h.streak || 0), 0)
  }, [activeHabits])

  // Circular progress math
  const radius = 26
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (pct / 100) * circumference

  const dateLabel = isToday
    ? 'Today'
    : selectedDate.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      })

  const fullDateLabel = selectedDate.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <div className="habit-header-card">
      <div className="habit-header-left">
        <div className="habit-header-ring-wrap" title={`${pct}% completed`}>
          <svg width="64" height="64" viewBox="0 0 64 64" style={{ transform: 'rotate(-90deg)' }}>
            <circle
              cx="32"
              cy="32"
              r={radius}
              stroke="var(--color-border)"
              strokeWidth="4.5"
              fill="none"
            />
            <circle
              cx="32"
              cy="32"
              r={radius}
              stroke={pct === 100 ? '#10B981' : 'var(--color-primary)'}
              strokeWidth="4.5"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="none"
              style={{
                transition: 'stroke-dashoffset 400ms ease, stroke 300ms ease',
              }}
            />
          </svg>
          <div className="habit-header-ring-text">
            <span>{pct}%</span>
            <span className="habit-header-ring-sub">done</span>
          </div>
        </div>

        <div className="habit-header-title-block">
          <div className="habit-header-date-title">
            {dateLabel} <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-muted)' }}>({fullDateLabel})</span>
          </div>
          <div className="habit-header-progress-desc">
            <span>
              {completedCount} of {total} {total === 1 ? 'habit' : 'habits'} completed
            </span>
            {pct === 100 && total > 0 && (
              <span
                style={{
                  background: 'rgba(16, 185, 129, 0.16)',
                  color: '#10B981',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  padding: '2px 8px',
                  borderRadius: 100,
                  fontSize: 11,
                  fontWeight: 700,
                }}
              >
                🌟 All Done!
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="habit-header-stats">
        {topStreak > 0 && (
          <div className="habit-stat-pill" title="Top streak across your active habits">
            <span>🔥</span>
            <span>{topStreak}d streak</span>
          </div>
        )}
        <div className="habit-stat-pill" style={{ color: '#10B981' }}>
          <span>✓</span>
          <span>{completedCount} done</span>
        </div>
        {total - completedCount > 0 && (
          <div className="habit-stat-pill" style={{ color: 'var(--color-text-secondary)' }}>
            <span>⏳</span>
            <span>{total - completedCount} left</span>
          </div>
        )}
      </div>
    </div>
  )
}
