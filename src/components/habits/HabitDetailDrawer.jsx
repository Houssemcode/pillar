import { useState, useEffect } from 'react'
import { WEEKDAYS } from '../../utils/habitDateUtils'
import { formatTimeHHmm, toTimeInputValue } from '../../utils/timeUtils'

const HABIT_COLORS = [
  '#F43F5E', '#F97316', '#F59E0B', '#10B981',
  '#14B8A6', '#0EA5E9', '#3B82F6', '#6366F1',
  '#8B5CF6', '#EC4899',
]

const EMOJI_LIST = [
  '🏃', '📚', '🧘', '🍎', '💧', '🚿', '✍️', '🚶',
  '🏋️', '🎯', '🌱', '☕', '🥗', '🎨', '💪', '🧠',
  '🛌', '🌅', '📝', '🏊', '🚴', '⚽', '📖', '📿',
]

const DAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function sameDay(a, b) {
  if (!a || !b) return false
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function dateKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function buildHabitHeatmap(habit, weeks = 12) {
  const today = new Date()
  const start = new Date(today)
  start.setDate(today.getDate() - weeks * 7 + 1)
  start.setDate(start.getDate() - start.getDay()) // align to Sunday

  const daysDiff = Math.floor((today - start) / (1000 * 60 * 60 * 24)) + 1
  return Array.from({ length: daysDiff }, (_, i) => {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    const done = habit.completedDates?.has(dateKey(d))
    return { date: d, done }
  })
}

export default function HabitDetailDrawer({
  habit,
  selectedDate = new Date(),
  onClose,
  onToggle,
  onUpdate,
  onTrash,
}) {
  const [isEditing, setIsEditing] = useState(false)
  const today = new Date()

  const defaultDraft = () => ({
    name: habit.name || '',
    emoji: habit.emoji || '🎯',
    color: habit.color || '#3B82F6',
    areas: Array.isArray(habit.areas) && habit.areas.length > 0
      ? habit.areas
      : habit.area ? [habit.area] : ['Morning'],
    notes: habit.notes ?? '',
    goal_amount: habit.goal_amount || 1,
    goal_unit: habit.goal_unit || 'times',
    frequency: habit.frequency || 'daily',
    frequency_days: habit.frequency_days || [0, 1, 2, 3, 4, 5, 6],
    reminder_time: toTimeInputValue(habit.reminder_time),
  })

  const [draft, setDraft] = useState(defaultDraft)

  useEffect(() => {
    if (!isEditing) setDraft(defaultDraft())
  }, [habit, isEditing])

  // ESC key handler
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') {
        if (isEditing) setIsEditing(false)
        else onClose()
      }
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [isEditing, onClose])

  const dk = dateKey(selectedDate)
  const doneToday = habit.completedDates?.has(dk)
  const totalDone = habit.completedDates?.size || 0

  // 30-day rate
  const last30 = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    return dateKey(d)
  })
  const rate30 = Math.round(
    ((last30.filter((k) => habit.completedDates?.has(k)).length) / 30) * 100
  ) || 0

  const heatmap = buildHabitHeatmap(habit, 12)
  const habitColor = isEditing ? draft.color : habit.color || '#F59E0B'

  const setField = (key, val) => setDraft((d) => ({ ...d, [key]: val }))

  const toggleDay = (d) =>
    setDraft((prev) => ({
      ...prev,
      frequency_days: prev.frequency_days.includes(d)
        ? prev.frequency_days.filter((x) => x !== d)
        : [...prev.frequency_days, d].sort(),
    }))

  const toggleArea = (a) =>
    setDraft((prev) => ({
      ...prev,
      areas:
        prev.areas.includes(a) && prev.areas.length > 1
          ? prev.areas.filter((x) => x !== a)
          : prev.areas.includes(a)
          ? prev.areas
          : [...prev.areas, a],
    }))

  const handleSave = () => {
    if (!draft.name.trim()) return
    onUpdate(habit.id, {
      ...draft,
      name: draft.name.trim(),
    })
    setIsEditing(false)
  }

  const handleCancel = () => {
    setDraft(defaultDraft())
    setIsEditing(false)
  }

  return (
    <div className="habit-drawer-backdrop" onClick={onClose}>
      <div
        className="habit-drawer-panel"
        onClick={(e) => e.stopPropagation()}
        style={{ '--habit-theme-color': habitColor }}
      >
        {/* Mobile drag handle */}
        <div className="habit-drawer-drag-handle" />

        {/* ── Drawer Header ── */}
        <div className="habit-drawer-header">
          <div className="habit-drawer-header-left">
            <div
              className="habit-drawer-emoji-box"
              style={{
                background: `${habitColor}20`,
                borderColor: `${habitColor}60`,
              }}
            >
              <span>{isEditing ? draft.emoji : habit.emoji}</span>
            </div>

            {isEditing ? (
              <input
                autoFocus
                className="habit-drawer-name-input input"
                value={draft.name}
                onChange={(e) => setField('name', e.target.value)}
                placeholder="Habit title…"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSave()
                }}
              />
            ) : (
              <div className="habit-drawer-title-wrap">
                <h2 className="habit-drawer-title">{habit.name}</h2>
                <div className="habit-drawer-subtitle">
                  {habit.areas?.join(', ') || habit.area || 'Anytime'}
                  {habit.goal_amount > 1 && ` · ${habit.goal_amount} ${habit.goal_unit} daily`}
                </div>
              </div>
            )}
          </div>

          <div className="habit-drawer-header-actions">
            {!isEditing && (
              <button
                className="habit-drawer-btn-icon"
                onClick={() => setIsEditing(true)}
                title="Edit habit"
                aria-label="Edit habit"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
              </button>
            )}
            <button
              className="habit-drawer-btn-icon"
              onClick={isEditing ? handleCancel : onClose}
              title="Close"
              aria-label="Close"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* ── Drawer Body ── */}
        <div className="habit-drawer-body">
          {isEditing ? (
            /* ── EDIT MODE ── */
            <div className="habit-drawer-edit-form">
              {/* Color swatches */}
              <div className="habit-form-group">
                <label className="habit-form-label">Theme Color</label>
                <div className="habit-color-picker">
                  {HABIT_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setField('color', c)}
                      className={`habit-color-swatch ${draft.color === c ? 'habit-color-swatch--active' : ''}`}
                      style={{ background: c }}
                      aria-label={`Color ${c}`}
                    />
                  ))}
                </div>
              </div>

              {/* Emoji picker */}
              <div className="habit-form-group">
                <label className="habit-form-label">Icon</label>
                <div className="habit-emoji-grid">
                  {EMOJI_LIST.map((em) => (
                    <button
                      key={em}
                      type="button"
                      onClick={() => setField('emoji', em)}
                      className={`habit-emoji-pick-btn ${draft.emoji === em ? 'habit-emoji-pick-btn--active' : ''}`}
                      style={{
                        background: draft.emoji === em ? `${habitColor}25` : undefined,
                        borderColor: draft.emoji === em ? habitColor : undefined,
                      }}
                    >
                      {em}
                    </button>
                  ))}
                </div>
              </div>

              {/* Goal target & frequency */}
              <div className="habit-form-row">
                <div className="habit-form-group" style={{ flex: 1 }}>
                  <label className="habit-form-label">Daily Target</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      type="number"
                      min="1"
                      className="input"
                      value={draft.goal_amount}
                      onChange={(e) => setField('goal_amount', Math.max(1, parseFloat(e.target.value) || 1))}
                      style={{ width: 70, textAlign: 'center' }}
                    />
                    <select
                      className="input"
                      value={draft.goal_unit}
                      onChange={(e) => setField('goal_unit', e.target.value)}
                      style={{ flex: 1 }}
                    >
                      <option value="times">times</option>
                      <option value="mins">minutes</option>
                      <option value="hrs">hours</option>
                      <option value="pages">pages</option>
                      <option value="glasses">glasses</option>
                      <option value="km">km</option>
                      <option value="ml">ml</option>
                    </select>
                  </div>
                </div>

                <div className="habit-form-group" style={{ flex: 1 }}>
                  <label className="habit-form-label">Frequency</label>
                  <select
                    className="input"
                    value={draft.frequency}
                    onChange={(e) => setField('frequency', e.target.value)}
                    style={{ width: '100%' }}
                  >
                    <option value="daily">Every day</option>
                    <option value="specific_days">Specific days of week</option>
                  </select>
                </div>
              </div>

              {/* Specific days */}
              {draft.frequency === 'specific_days' && (
                <div className="habit-form-group">
                  <label className="habit-form-label">Active Days</label>
                  <div className="habit-dow-row">
                    {WEEKDAYS.map(({ day, label }) => {
                      const active = draft.frequency_days?.includes(day)
                      return (
                        <button
                          key={day}
                          type="button"
                          onClick={() => toggleDay(day)}
                          className={`habit-dow-btn ${active ? 'habit-dow-btn--active' : ''}`}
                          style={{
                            background: active ? habitColor : undefined,
                            color: active ? '#fff' : undefined,
                            borderColor: active ? habitColor : undefined,
                          }}
                        >
                          {label}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Time of Day */}
              <div className="habit-form-group">
                <label className="habit-form-label">Time of Day</label>
                <div className="habit-areas-picker">
                  {['Morning', 'Afternoon', 'Evening', 'Anytime'].map((a) => {
                    const active = draft.areas?.includes(a)
                    return (
                      <button
                        key={a}
                        type="button"
                        onClick={() => toggleArea(a)}
                        className={`habit-area-select-pill ${active ? 'habit-area-select-pill--active' : ''}`}
                        style={{
                          background: active ? `${habitColor}22` : undefined,
                          color: active ? habitColor : undefined,
                          borderColor: active ? habitColor : undefined,
                        }}
                      >
                        {a === 'Morning' ? '🌅 ' : a === 'Afternoon' ? '☀️ ' : a === 'Evening' ? '🌙 ' : '🕒 '}
                        {a}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Reminder time */}
              <div className="habit-form-group">
                <label className="habit-form-label">Daily Reminder (Optional)</label>
                <input
                  type="time"
                  className="input"
                  value={toTimeInputValue(draft.reminder_time)}
                  onChange={(e) => setField('reminder_time', e.target.value)}
                  style={{ width: 140 }}
                />
              </div>

              {/* Notes */}
              <div className="habit-form-group">
                <label className="habit-form-label">Notes & Motivation</label>
                <textarea
                  className="habit-drawer-notes input"
                  placeholder="Add why this habit matters to you, or tips…"
                  value={draft.notes}
                  onChange={(e) => setField('notes', e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          ) : (
            /* ── VIEW MODE ── */
            <div className="habit-drawer-view-content">
              {/* 4 Stats Cards */}
              <div className="habit-drawer-stats-grid">
                <div className="habit-drawer-stat-card">
                  <div className="habit-drawer-stat-val" style={{ color: habit.streak > 0 ? '#F59E0B' : undefined }}>
                    {habit.streak > 0 ? `🔥 ${habit.streak}d` : '0d'}
                  </div>
                  <div className="habit-drawer-stat-lbl">Current Streak</div>
                </div>

                <div className="habit-drawer-stat-card">
                  <div className="habit-drawer-stat-val" style={{ color: '#F59E0B' }}>
                    {Math.max(habit.streak || 0, habit.best_streak || 0)}d
                  </div>
                  <div className="habit-drawer-stat-lbl">Best Streak</div>
                </div>

                <div className="habit-drawer-stat-card">
                  <div className="habit-drawer-stat-val">{totalDone}</div>
                  <div className="habit-drawer-stat-lbl">Total Completions</div>
                </div>

                <div className="habit-drawer-stat-card">
                  <div className="habit-drawer-stat-val" style={{ color: rate30 >= 70 ? '#10B981' : undefined }}>
                    {rate30}%
                  </div>
                  <div className="habit-drawer-stat-lbl">30d Consistency</div>
                </div>
              </div>

              {/* Interactive 12-Week Heatmap */}
              <div className="habit-drawer-heatmap-wrap card">
                <div className="habit-drawer-section-title">
                  Activity — Last 12 Weeks
                </div>

                <div className="habit-drawer-heatmap-header">
                  {DAYS_SHORT.map((d) => (
                    <span key={d} className="habit-drawer-hm-col-lbl">
                      {d[0]}
                    </span>
                  ))}
                </div>

                <div className="habit-drawer-heatmap-cells">
                  {heatmap.map((cell, i) => (
                    <div
                      key={i}
                      className="habit-drawer-heatmap-cell"
                      title={`${MONTHS[cell.date.getMonth()]} ${cell.date.getDate()} — ${cell.done ? 'Completed' : 'Not completed'}`}
                      style={{
                        background: cell.done ? habitColor : 'var(--color-surface-3)',
                        opacity: cell.done ? 1 : cell.date > today ? 0.2 : 0.6,
                        outline: sameDay(cell.date, selectedDate) ? `2px solid ${habitColor}` : 'none',
                        outlineOffset: 2,
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Habit Details card */}
              <div className="habit-drawer-info-card card">
                <div className="habit-drawer-section-title">Habit Configuration</div>

                <div className="habit-info-row">
                  <span className="habit-info-key">Frequency:</span>
                  <span className="habit-info-val">
                    {habit.frequency === 'specific_days'
                      ? `Specific days (${(habit.frequency_days || []).map((d) => DAYS_SHORT[d]).filter(Boolean).join(', ')})`
                      : 'Every day'}
                  </span>
                </div>

                {habit.reminder_time && (
                  <div className="habit-info-row">
                    <span className="habit-info-key">Daily Reminder:</span>
                    <span className="habit-info-val">🕒 {formatTimeHHmm(habit.reminder_time)}</span>
                  </div>
                )}

                <div className="habit-info-row">
                  <span className="habit-info-key">Time Block:</span>
                  <span className="habit-info-val">
                    {habit.areas?.join(', ') || habit.area || 'Anytime'}
                  </span>
                </div>

                {habit.notes && (
                  <div className="habit-info-notes">
                    <span className="habit-info-key">Notes & Motivation:</span>
                    <p className="habit-notes-quote">{habit.notes}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── Drawer Footer ── */}
        <div className="habit-drawer-footer">
          {isEditing ? (
            <>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={handleCancel}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleSave}
                style={{ background: habitColor, borderColor: habitColor }}
              >
                Save Changes
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className="btn habit-drawer-complete-btn"
                onClick={() => onToggle(habit.id)}
                style={{
                  background: doneToday ? 'var(--color-surface-3)' : habitColor,
                  color: '#fff',
                  border: 'none',
                }}
              >
                {doneToday ? '✓ Done today' : 'Mark done today'}
              </button>

              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => onUpdate(habit.id, { is_archived: !habit.is_archived })}
                title={habit.is_archived ? 'Restore habit' : 'Archive habit'}
              >
                {habit.is_archived ? 'Restore' : 'Archive'}
              </button>

              {onTrash && (
                <button
                  type="button"
                  className="btn btn-ghost btn-danger"
                  onClick={() => {
                    if (window.confirm(`Move "${habit.name}" to trash? You can recover it from Trash anytime.`)) {
                      onTrash(habit.id)
                      onClose()
                    }
                  }}
                  title="Move to trash"
                >
                  Delete
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
