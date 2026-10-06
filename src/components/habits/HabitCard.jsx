import { useState, useRef, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { formatTimeHHmm } from '../../utils/timeUtils'

const HOLD_DURATION_MS = 550 // 550ms hold to trigger full complete

export default function HabitCard({
  habit,
  done = false,
  currentAmount = 0,
  onToggle,
  onLogProgress,
  onOpen,
  onTrash,
  onArchive,
}) {
  const { t } = useTranslation()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)

  // Hold-to-fill state
  const [isHolding, setIsHolding] = useState(false)
  const [holdProgress, setHoldProgress] = useState(0)
  const holdRafRef = useRef(null)
  const holdStartTimeRef = useRef(null)
  const didLongPressRef = useRef(false)

  // Close menu on click outside
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
  const isDone = Boolean(done || (isGoalHabit ? currentAmount >= habit.goal_amount : false))
  const pct = isGoalHabit
    ? Math.min(100, Math.round((currentAmount / habit.goal_amount) * 100))
    : isDone
    ? 100
    : 0

  /* ── Hold-to-Fill & Tap Handlers ── */
  const handlePointerDown = useCallback(
    (e) => {
      if (e.button && e.button !== 0) return // only left click
      didLongPressRef.current = false
      holdStartTimeRef.current = Date.now()
      setIsHolding(true)

      const loop = () => {
        if (!holdStartTimeRef.current) return
        const elapsed = Date.now() - holdStartTimeRef.current
        const p = Math.min(100, (elapsed / HOLD_DURATION_MS) * 100)
        setHoldProgress(p)

        if (p >= 100) {
          didLongPressRef.current = true
          setIsHolding(false)
          setHoldProgress(0)
          holdStartTimeRef.current = null

          if (navigator.vibrate) {
            try {
              navigator.vibrate([40, 30, 40])
            } catch {}
          }

          if (isGoalHabit) {
            const nextAmount = isDone ? 0 : habit.goal_amount
            onLogProgress(habit.id, nextAmount)
          } else {
            onToggle(habit.id)
          }
          return
        }

        holdRafRef.current = requestAnimationFrame(loop)
      }

      holdRafRef.current = requestAnimationFrame(loop)
    },
    [isDone, habit.id, habit.goal_amount, isGoalHabit, onLogProgress, onToggle]
  )

  const handlePointerUpOrLeave = useCallback(() => {
    if (holdRafRef.current) {
      cancelAnimationFrame(holdRafRef.current)
      holdRafRef.current = null
    }
    holdStartTimeRef.current = null
    setIsHolding(false)
    setHoldProgress(0)
  }, [])

  // Normal quick tap (always works reliably)
  const handleClick = useCallback(
    (e) => {
      e.stopPropagation()
      if (didLongPressRef.current) {
        didLongPressRef.current = false
        return
      }

      if (isGoalHabit) {
        if (isDone) {
          onLogProgress(habit.id, 0)
        } else {
          onLogProgress(habit.id, Math.min(habit.goal_amount, currentAmount + 1))
        }
      } else {
        onToggle(habit.id)
      }
    },
    [isDone, habit.id, habit.goal_amount, isGoalHabit, currentAmount, onLogProgress, onToggle]
  )

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (holdRafRef.current) cancelAnimationFrame(holdRafRef.current)
    }
  }, [])

  /* ── SVG Math for Hold Circle ── */
  const circleRadius = 14
  const circleCircumference = 2 * Math.PI * circleRadius
  const displayPct = isHolding ? holdProgress : pct
  const circleOffset =
    circleCircumference - (displayPct / 100) * circleCircumference

  return (
    <div
      className={`habit-card ${isDone ? 'habit-card--done' : ''}`}
      style={{
        '--habit-color': habitColor,
      }}
    >
      <div className="habit-card-main">
        {/* Emoji icon (sits seamlessly on card background, no boxed container) */}
        <div
          className="habit-card-emoji"
          onClick={() => onOpen(habit)}
          title="Click to view details"
        >
          {habit.emoji || '🎯'}
        </div>

        {/* Title and subtle minimal info */}
        <div
          className="habit-card-info"
          onClick={() => onOpen(habit)}
          title="Click to view details"
        >
          <div className="habit-card-title-row">
            <span
              className="habit-card-title"
              style={{
                textDecoration: isDone ? 'line-through' : 'none',
              }}
            >
              {habit.name}
            </span>
            {habit.streak > 0 && (
              <span
                className="habit-card-streak"
                title={`${habit.streak}-day streak!`}
              >
                🔥 {habit.streak}d
              </span>
            )}
          </div>

          {/* Minimal Meta: only goal progress or reminder if present (no redundant area/schedule tags) */}
          {(isGoalHabit || habit.reminder_time) && (
            <div className="habit-card-meta">
              {isGoalHabit && (
                <span className="habit-card-goal-text">
                  {currentAmount} / {habit.goal_amount} {habit.goal_unit || t('habits.timesUnit')}
                </span>
              )}
              {habit.reminder_time && (
                <span className="habit-card-reminder-text">
                  🕒 {formatTimeHHmm(habit.reminder_time)}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Streamlined Action Buttons: Borderless ghost buttons sitting directly on the card */}
        <div
          className="habit-card-actions"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Borderless Ghost Stepper for Quantified Habits */}
          {isGoalHabit && (
            <div className="habit-ghost-stepper" title="Quantity stepper">
              <button
                type="button"
                className="habit-ghost-btn"
                onClick={() =>
                  onLogProgress(habit.id, Math.max(0, currentAmount - 1))
                }
                disabled={currentAmount <= 0}
                title="Decrease"
                aria-label="Decrease quantity"
              >
                −
              </button>
              <span className="habit-ghost-val">{currentAmount}</span>
              <button
                type="button"
                className="habit-ghost-btn"
                onClick={() =>
                  onLogProgress(habit.id, currentAmount + 1)
                }
                title="Increase"
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>
          )}

          {/* Borderless Ghost Checkmark & Hold-to-fill circle button */}
          <button
            type="button"
            className={`habit-ghost-check ${isDone ? 'habit-ghost-check--done' : ''} ${
              isHolding ? 'habit-ghost-check--holding' : ''
            }`}
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUpOrLeave}
            onPointerCancel={handlePointerUpOrLeave}
            onPointerLeave={handlePointerUpOrLeave}
            onClick={handleClick}
            title={
              isGoalHabit
                ? 'Tap to add 1, hold to complete'
                : isDone
                ? 'Tap to mark incomplete'
                : 'Tap to mark complete'
            }
            aria-label={
              isDone ? `Mark ${habit.name} incomplete` : `Mark ${habit.name} done`
            }
          >
            <svg className="habit-ghost-svg" viewBox="0 0 36 36">
              <circle
                className="habit-ghost-track"
                cx="18"
                cy="18"
                r={circleRadius}
              />
              <circle
                className="habit-ghost-fill"
                cx="18"
                cy="18"
                r={circleRadius}
                stroke={habitColor}
                strokeDasharray={circleCircumference}
                strokeDashoffset={circleOffset}
              />
            </svg>

            <div className="habit-ghost-icon">
              {isDone ? (
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#fff"
                  strokeWidth="3.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20,6 9,17 4,12" />
                </svg>
              ) : isGoalHabit ? (
                <span style={{ fontSize: 11, fontWeight: 800, color: habitColor }}>
                  {isHolding ? `${Math.round(holdProgress)}%` : '+'}
                </span>
              ) : (
                <svg
                  className="habit-check-ghost-icon"
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={habitColor}
                  strokeWidth="2.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20,6 9,17 4,12" />
                </svg>
              )}
            </div>
          </button>

          {/* 3-dots Context Menu */}
          <div className="habit-action-menu-wrap" ref={menuRef}>
            <button
              type="button"
              className="habit-action-btn habit-ghost-more-btn"
              onClick={() => setMenuOpen((v) => !v)}
              title="Habit options"
              aria-label="Habit options"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="5" r="2" />
                <circle cx="12" cy="12" r="2" />
                <circle cx="12" cy="19" r="2" />
              </svg>
            </button>

            {menuOpen && (
              <div
                className="habit-menu-dropdown"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
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
                    type="button"
                    className="habit-menu-item"
                    onClick={() => {
                      setMenuOpen(false)
                      onArchive(habit.id, !habit.is_archived)
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <polyline points="21 8 21 21 3 21 3 8" />
                      <rect x="1" y="3" width="22" height="5" />
                    </svg>
                    <span>{habit.is_archived ? 'Restore' : 'Archive'}</span>
                  </button>
                )}

                {onTrash && (
                  <button
                    type="button"
                    className="habit-menu-item habit-menu-item--danger"
                    onClick={() => {
                      setMenuOpen(false)
                      onTrash(habit.id)
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                    </svg>
                    <span>Move to Trash</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Subtle bottom line progress indicator for quantified habits */}
      {isGoalHabit && pct > 0 && !done && (
        <div className="habit-card-progress-bar">
          <div
            className="habit-card-progress-fill"
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
    </div>
  )
}
