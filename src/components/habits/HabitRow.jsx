import { useState, useRef, useEffect } from 'react'
import { formatTimeHHmm } from '../../utils/timeUtils'

export default function HabitRow({
  habit,
  done,
  currentAmount = 0,
  onToggle,
  onLogProgress,
  onOpen,
  onTrash,
  onArchive,
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [menuOpen])

  const habitColor = habit.color || '#F59E0B'
  const isGoalHabit = habit.goal_amount && habit.goal_amount > 1
  const pct = isGoalHabit
    ? Math.min(100, Math.round((currentAmount / habit.goal_amount) * 100))
    : done ? 100 : 0

  const areas = Array.isArray(habit.areas) && habit.areas.length > 0
    ? habit.areas
    : habit.area ? [habit.area] : ['Anytime']

  return (
    <div
      className={`habit-row ${done ? 'habit-row--done' : ''}`}
      style={{
        position: 'relative',
        '--habit-color': habitColor,
      }}
    >
      {/* Accent left indicator bar */}
      <div
        className="habit-area-bar"
        style={{ background: habitColor }}
      />

      {/* Emoji icon pill */}
      <div
        className="habit-emoji"
        onClick={() => onOpen(habit)}
        style={{
          background: done ? `${habitColor}22` : 'var(--color-surface-3)',
          border: `1.5px solid ${done ? `${habitColor}55` : 'var(--color-border)'}`,
          cursor: 'pointer',
        }}
        title="View habit details"
      >
        <span>{habit.emoji || '🎯'}</span>
      </div>

      {/* Main Info */}
      <div
        className="habit-info"
        onClick={() => onOpen(habit)}
        style={{ cursor: 'pointer' }}
      >
        <div className="habit-name-row">
          <span className="habit-name">{habit.name}</span>
          {habit.streak > 0 && (
            <span
              className="habit-streak-badge"
              title={`${habit.streak}-day streak!`}
              style={{
                background: habit.streak >= 7 ? 'rgba(245, 158, 11, 0.16)' : 'var(--color-surface-3)',
                borderColor: habit.streak >= 7 ? 'rgba(245, 158, 11, 0.35)' : 'var(--color-border)',
              }}
            >
              <span className="habit-streak-flame">🔥</span>
              <span className="habit-streak-num">{habit.streak}d</span>
            </span>
          )}
        </div>

        <div className="habit-meta">
          <span className="habit-area-tag">
            {areas.join(', ')}
          </span>

          {isGoalHabit && (
            <span
              className="habit-goal-pill"
              style={{
                color: done ? habitColor : 'var(--color-text-muted)',
                fontWeight: 600,
              }}
            >
              {currentAmount} / {habit.goal_amount} {habit.goal_unit || 'times'}
            </span>
          )}

          {habit.reminder_time && (
            <span className="habit-reminder-tag" title="Daily reminder">
              🕒 {formatTimeHHmm(habit.reminder_time)}
            </span>
          )}
        </div>
      </div>

      {/* Stepper controls for quantified targets */}
      {isGoalHabit && (
        <div
          className="habit-stepper"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="habit-step-btn"
            onClick={() => onLogProgress(habit.id, Math.max(0, currentAmount - 1))}
            disabled={currentAmount <= 0}
            title="Decrease 1"
            aria-label="Decrease amount"
          >
            −
          </button>
          <span className="habit-step-count">{currentAmount}</span>
          <button
            className="habit-step-btn habit-step-btn--add"
            onClick={() => onLogProgress(habit.id, currentAmount + 1)}
            style={{
              background: `${habitColor}22`,
              color: habitColor,
              borderColor: `${habitColor}55`,
            }}
            title="Increase 1"
            aria-label="Increase amount"
          >
            +
          </button>
        </div>
      )}

      {/* Actions menu trigger */}
      <div className="habit-action-menu-wrap" ref={menuRef}>
        <button
          className="habit-action-btn"
          onClick={(e) => {
            e.stopPropagation()
            setMenuOpen((v) => !v)
          }}
          title="Habit options"
          aria-label="Habit options"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="12" cy="5" r="2" />
            <circle cx="12" cy="12" r="2" />
            <circle cx="12" cy="19" r="2" />
          </svg>
        </button>

        {menuOpen && (
          <div className="habit-menu-dropdown" onClick={(e) => e.stopPropagation()}>
            <button
              className="habit-menu-item"
              onClick={() => {
                setMenuOpen(false)
                onOpen(habit)
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              <span>Edit Details</span>
            </button>

            {onArchive && (
              <button
                className="habit-menu-item"
                onClick={() => {
                  setMenuOpen(false)
                  onArchive(habit.id, !habit.is_archived)
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <polyline points="21 8 21 21 3 21 3 8" /><rect x="1" y="3" width="22" height="5" />
                </svg>
                <span>{habit.is_archived ? 'Restore' : 'Archive'}</span>
              </button>
            )}

            {onTrash && (
              <button
                className="habit-menu-item habit-menu-item--danger"
                onClick={() => {
                  setMenuOpen(false)
                  onTrash(habit.id)
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                </svg>
                <span>Move to Trash</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Completion checkmark button */}
      <button
        className={`habit-check ${done ? 'habit-check--done' : ''}`}
        onClick={(e) => {
          e.stopPropagation()
          onToggle(habit.id)
        }}
        style={{
          borderColor: done ? habitColor : 'var(--color-border)',
          background: done ? habitColor : 'transparent',
        }}
        title={done ? 'Mark incomplete' : 'Mark done today'}
        aria-label={done ? `Mark ${habit.name} incomplete` : `Mark ${habit.name} done`}
      >
        {done && (
          <svg
            className="habit-check-icon"
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#fff"
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20,6 9,17 4,12" />
          </svg>
        )}
      </button>

      {/* Progress fill line for quantified habits */}
      {isGoalHabit && pct > 0 && !done && (
        <div
          className="habit-progress-track"
          style={{
            width: `${pct}%`,
            background: habitColor,
          }}
        />
      )}
    </div>
  )
}
