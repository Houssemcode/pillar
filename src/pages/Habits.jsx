import { useState, useMemo, useEffect } from 'react'
import ProgressRing from '../components/ui/ProgressRing'
import { useToast } from '../context/ToastContext'

/* ─── Helpers ──────────────────────────────────────────────── */
const DAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const DAYS_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function getWeek(anchor = new Date()) {
  const start = new Date(anchor)
  start.setDate(anchor.getDate() - anchor.getDay())
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    return d
  })
}

function sameDay(a, b) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
}

function dateKey(d) {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
}

/* ─── Data ─────────────────────────────────────────────────── */
const today = new Date()

function seedHistory() {
  const dates = new Set()
  for (let i = 1; i <= 35; i++) {
    if (Math.random() > 0.4) {
      const d = new Date(today)
      d.setDate(today.getDate() - i)
      dates.add(dateKey(d))
    }
  }
  return dates
}

const INITIAL_HABITS = [
  { id: 1, name: 'Morning Run', emoji: '🏃', area: 'Morning', streak: 12, notes: '', completedDates: seedHistory() },
  { id: 2, name: 'Read 30 min', emoji: '📚', area: 'Evening', streak: 5, notes: '', completedDates: seedHistory() },
  { id: 3, name: 'Meditate', emoji: '🧘', area: 'Morning', streak: 21, notes: 'Use the Calm app.', completedDates: seedHistory() },
  { id: 4, name: 'No Sugar', emoji: '🍎', area: 'Afternoon', streak: 3, notes: '', completedDates: seedHistory() },
  { id: 5, name: 'Drink 2L Water', emoji: '💧', area: 'Morning', streak: 8, notes: '', completedDates: seedHistory() },
  { id: 6, name: 'Cold Shower', emoji: '🚿', area: 'Morning', streak: 0, notes: '', completedDates: seedHistory() },
  { id: 7, name: 'Evening Journal', emoji: '✍️', area: 'Evening', streak: 4, notes: '', completedDates: seedHistory() },
  { id: 8, name: 'Afternoon Walk', emoji: '🚶', area: 'Afternoon', streak: 7, notes: '', completedDates: seedHistory() },
]

const DEFAULT_AREAS = ['All', 'Morning', 'Afternoon', 'Evening']

const AREA_COLORS = {
  Morning: { color: '#F59E0B', bg: '#F59E0B18', border: '#F59E0B40' },
  Afternoon: { color: '#3B82F6', bg: '#3B82F618', border: '#3B82F640' },
  Evening: { color: '#6366F1', bg: '#6366F118', border: '#6366F140' },
}

function getAreaStyle(area) {
  return AREA_COLORS[area] || { color: '#10B981', bg: '#10B98118', border: '#10B98140' }
}

function buildHeatmap(habits) {
  return Array.from({ length: 35 }, (_, i) => {
    const d = new Date(today)
    d.setDate(today.getDate() - (34 - i))
    const k = dateKey(d)
    const done = habits.filter(h => h.completedDates.has(k)).length
    const pct = habits.length > 0 ? done / habits.length : 0
    return { date: d, done, pct }
  })
}

function buildHabitHeatmap(habit) {
  return Array.from({ length: 35 }, (_, i) => {
    const d = new Date(today)
    d.setDate(today.getDate() - (34 - i))
    const done = habit.completedDates.has(dateKey(d))
    return { date: d, done }
  })
}

const EMOJI_LIST = ['🏃', '📚', '🧘', '🍎', '💧', '🚿', '✍️', '🚶', '🏋️', '🎯', '🎸', '🌱', '☕', '🥗', '🎨', '💪', '🧠', '🛌', '🌅', '📝', '🏊', '🚴', '🎯', '⚽', '🧩']

/* ─── New Habit Modal ──────────────────────────────────────── */
function NewHabitModal({ areas, onSave, onClose }) {
  const [step, setStep] = useState(1) // 1 = name+area, 2 = emoji, 3 = confirm
  const [name, setName] = useState('')
  const [area, setArea] = useState('Morning')
  const [emoji, setEmoji] = useState('🎯')
  const [notes, setNotes] = useState('')
  const [emojiSearch, setEmojiSearch] = useState('')

  useEffect(() => {
    const h = e => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [onClose])

  const nonAllAreas = areas.filter(a => a !== 'All')

  const handleSave = () => {
    if (!name.trim()) return
    onSave({ name: name.trim(), emoji, area, notes })
    onClose()
  }

  return (
    <div className="task-modal-backdrop" onClick={onClose}>
      <div className="task-modal" style={{ maxWidth: 460 }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="task-modal-header">
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>
              New Habit · Step {step} of 3
            </div>
            <h2 className="task-modal-title" style={{ marginTop: 4 }}>
              {step === 1 ? 'Name & Area' : step === 2 ? 'Choose an Emoji' : 'Review & Save'}
            </h2>
          </div>
          <button className="task-modal-close" onClick={onClose}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Step indicator */}
        <div style={{ display: 'flex', gap: 4, padding: '10px 22px 0' }}>
          {[1, 2, 3].map(s => (
            <div key={s} style={{
              flex: 1, height: 3, borderRadius: 2,
              background: s <= step ? 'var(--color-primary)' : 'var(--color-surface-3)',
              transition: 'background 300ms',
            }} />
          ))}
        </div>

        {/* Step 1 — Name + Area */}
        {step === 1 && (
          <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--color-text-muted)', display: 'block', marginBottom: 8 }}>
                Habit name
              </label>
              <input
                autoFocus
                className="input"
                placeholder="e.g. Morning Run, Read 30 min…"
                value={name}
                onChange={e => setName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && name.trim()) setStep(2) }}
                style={{ width: '100%', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--color-text-muted)', display: 'block', marginBottom: 8 }}>
                Area
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {nonAllAreas.map(a => {
                  const s = getAreaStyle(a)
                  const active = area === a
                  return (
                    <button key={a} onClick={() => setArea(a)} style={{
                      padding: '6px 16px', borderRadius: 100, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                      background: active ? s.bg : 'transparent',
                      color: active ? s.color : 'var(--color-text-muted)',
                      border: `1px solid ${active ? s.border : 'var(--color-border)'}`,
                      transition: 'all 150ms',
                      display: 'flex', alignItems: 'center', gap: 5,
                    }}>
                      <span style={{ width: 7, height: 7, borderRadius: '50%', background: active ? s.color : 'var(--color-border)', display: 'inline-block' }} />
                      {a}
                    </button>
                  )
                })}
              </div>
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--color-text-muted)', display: 'block', marginBottom: 8 }}>
                Notes (optional)
              </label>
              <textarea
                className="task-modal-notes"
                placeholder="Any notes or reminders…"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                style={{ minHeight: 60 }}
              />
            </div>
          </div>
        )}

        {/* Step 2 — Emoji picker */}
        {step === 2 && (
          <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
              Pick an emoji to represent <strong style={{ color: 'var(--color-text)' }}>{name}</strong>
            </div>
            {/* Preview */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 4 }}>
              <div style={{
                width: 64, height: 64, borderRadius: 18, fontSize: 32,
                background: `${getAreaStyle(area).color}18`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: `2px solid ${getAreaStyle(area).border}`,
              }}>{emoji}</div>
            </div>
            {/* Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 6 }}>
              {EMOJI_LIST.map(em => (
                <button
                  key={em}
                  onClick={() => setEmoji(em)}
                  style={{
                    aspectRatio: '1', borderRadius: 8, fontSize: 20, cursor: 'pointer',
                    background: emoji === em ? 'var(--color-primary-subtle)' : 'var(--color-surface-3)',
                    border: `1px solid ${emoji === em ? 'var(--color-primary-muted)' : 'transparent'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 150ms',
                  }}
                >{em}</button>
              ))}
            </div>
            {/* Custom emoji input */}
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 4 }}>
              <input
                className="input"
                placeholder="Or type any emoji…"
                value={emojiSearch}
                onChange={e => { setEmojiSearch(e.target.value); if ([...e.target.value].length === 1) setEmoji(e.target.value) }}
                style={{ flex: 1, padding: '6px 10px', fontSize: 14 }}
                maxLength={4}
              />
            </div>
          </div>
        )}

        {/* Step 3 — Review */}
        {step === 3 && (
          <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 16px', background: 'var(--color-surface-3)', borderRadius: 12, border: '1px solid var(--color-border)' }}>
              <div style={{
                width: 48, height: 48, borderRadius: 13, fontSize: 24,
                background: `${getAreaStyle(area).color}18`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>{emoji}</div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-text)' }}>{name}</div>
                <div style={{ fontSize: 12, color: getAreaStyle(area).color, marginTop: 3 }}>● {area}</div>
                {notes && <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 2, fontStyle: 'italic' }}>{notes}</div>}
              </div>
            </div>
            <div style={{ fontSize: 13, color: 'var(--color-text-muted)', textAlign: 'center' }}>
              This habit will appear in your daily list. Tap to mark it done each day.
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="task-modal-footer" style={{ justifyContent: 'space-between' }}>
          <button className="btn btn-ghost" style={{ fontSize: 13 }} onClick={() => step === 1 ? onClose() : setStep(s => s - 1)}>
            {step === 1 ? 'Cancel' : '← Back'}
          </button>
          {step < 3 ? (
            <button
              className="btn btn-primary"
              style={{ fontSize: 13, padding: '9px 22px' }}
              disabled={step === 1 && !name.trim()}
              onClick={() => setStep(s => s + 1)}
            >Next →</button>
          ) : (
            <button
              className="btn btn-primary"
              style={{ fontSize: 13, padding: '9px 22px' }}
              onClick={handleSave}
            >Save Habit 🎉</button>
          )}
        </div>
      </div>
    </div>
  )
}

/* ─── Habit Detail Modal ───────────────────────────────────── */
function HabitDetailModal({ habit, selectedDate, onClose, onToggle, onUpdate }) {
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState({ name: habit.name, emoji: habit.emoji, area: habit.area, notes: habit.notes ?? '' })

  useEffect(() => {
    if (!isEditing) setDraft({ name: habit.name, emoji: habit.emoji, area: habit.area, notes: habit.notes ?? '' })
  }, [habit, isEditing])

  useEffect(() => {
    const h = e => { if (e.key === 'Escape') { isEditing ? handleCancel() : onClose() } }
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [isEditing, onClose])

  const dk = dateKey(selectedDate)
  const doneToday = habit.completedDates.has(dk)
  const heatmap = buildHabitHeatmap(habit)
  const totalDone = habit.completedDates.size
  const last30 = Array.from({ length: 30 }, (_, i) => { const d = new Date(today); d.setDate(today.getDate() - i); return dateKey(d) })
  const rate30 = Math.round((last30.filter(k => habit.completedDates.has(k)).length / 30) * 100)
  const areaStyle = getAreaStyle(habit.area)
  const set = (k, v) => setDraft(d => ({ ...d, [k]: v }))

  const handleSave = () => { onUpdate(habit.id, draft); setIsEditing(false) }
  const handleCancel = () => { setDraft({ name: habit.name, emoji: habit.emoji, area: habit.area, notes: habit.notes ?? '' }); setIsEditing(false) }

  return (
    <div className="task-modal-backdrop" onClick={() => !isEditing && onClose()}>
      <div className="task-modal" style={{ maxWidth: 500 }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="task-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12, fontSize: 22, flexShrink: 0,
              background: doneToday ? `${areaStyle.color}18` : 'var(--color-surface-3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: `1.5px solid ${doneToday ? areaStyle.border : 'var(--color-border)'}`,
            }}>
              {isEditing ? draft.emoji : habit.emoji}
            </div>
            {isEditing ? (
              <input
                autoFocus
                className="task-modal-title-input"
                value={draft.name}
                onChange={e => set('name', e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') handleCancel() }}
              />
            ) : (
              <h2 className="task-modal-title">{habit.name}</h2>
            )}
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {!isEditing && (
              <button className="task-modal-action-btn" onClick={() => setIsEditing(true)} title="Edit habit">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
              </button>
            )}
            <button className="task-modal-close" onClick={isEditing ? handleCancel : onClose}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* Edit fields */}
        {isEditing ? (
          <div style={{ padding: '16px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: 6 }}>Area</div>
              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                {['Morning', 'Afternoon', 'Evening'].map(a => {
                  const s = getAreaStyle(a); const active = draft.area === a
                  return (
                    <button key={a} onClick={() => set('area', a)} style={{
                      padding: '4px 12px', borderRadius: 100, fontSize: 11, fontWeight: 600, cursor: 'pointer',
                      background: active ? s.bg : 'transparent', color: active ? s.color : 'var(--color-text-muted)',
                      border: `1px solid ${active ? s.border : 'var(--color-border)'}`, transition: 'all 150ms',
                    }}>{a}</button>
                  )
                })}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: 6 }}>Emoji</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: 4 }}>
                {EMOJI_LIST.map(em => (
                  <button key={em} onClick={() => set('emoji', em)} style={{
                    aspectRatio: '1', borderRadius: 6, fontSize: 16, cursor: 'pointer',
                    background: draft.emoji === em ? 'var(--color-primary-subtle)' : 'var(--color-surface-3)',
                    border: `1px solid ${draft.emoji === em ? 'var(--color-primary-muted)' : 'transparent'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>{em}</button>
                ))}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: 6 }}>Notes</div>
              <textarea className="task-modal-notes" placeholder="Add notes…" value={draft.notes} onChange={e => set('notes', e.target.value)} style={{ minHeight: 60 }} />
            </div>
          </div>
        ) : (
          <>
            {/* Stats grid */}
            <div className="task-modal-meta" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
              {[
                { label: 'Streak', value: `${habit.streak}d`, color: habit.streak > 0 ? '#F59E0B' : undefined },
                { label: 'Total', value: totalDone },
                { label: '30d rate', value: `${rate30}%`, color: rate30 >= 70 ? '#10B981' : undefined },
                { label: 'Area', value: habit.area, color: areaStyle.color },
              ].map(s => (
                <div key={s.label} className="task-modal-meta-item" style={{ textAlign: 'center', borderBottom: '1px solid var(--color-border)' }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: s.color ?? 'var(--color-text)' }}>{s.value}</div>
                  <div className="task-modal-meta-label">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Mini heatmap */}
            <div style={{ padding: '14px 22px', borderBottom: '1px solid var(--color-border)' }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: 10 }}>
                Activity — Last 5 Weeks
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 4 }}>
                {DAYS_SHORT.map(d => <div key={d} style={{ fontSize: 8, textAlign: 'center', color: 'var(--color-text-muted)', fontWeight: 600 }}>{d[0]}</div>)}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
                {heatmap.map((cell, i) => (
                  <div key={i} title={`${MONTHS[cell.date.getMonth()]} ${cell.date.getDate()}`} style={{
                    aspectRatio: '1', borderRadius: 3,
                    background: cell.done ? areaStyle.color : 'var(--color-surface-3)',
                    opacity: cell.done ? 1 : 1,
                    outline: sameDay(cell.date, selectedDate) ? `2px solid ${areaStyle.color}` : 'none',
                    outlineOffset: 1,
                  }} />
                ))}
              </div>
            </div>

            {/* Notes */}
            {habit.notes && (
              <div className="task-modal-section">
                <div className="task-modal-section-label">Notes</div>
                <div style={{ fontSize: 13, color: 'var(--color-text-muted)', fontStyle: 'italic' }}>{habit.notes}</div>
              </div>
            )}
          </>
        )}

        {/* Footer */}
        <div className="task-modal-footer">
          {isEditing ? (
            <>
              <button className="btn btn-primary" style={{ fontSize: 13, padding: '9px 20px' }} onClick={handleSave}>Save changes</button>
              <button className="btn btn-ghost" style={{ fontSize: 13 }} onClick={handleCancel}>Cancel</button>
            </>
          ) : (
            <>
              <button
                className="btn"
                style={{ background: doneToday ? 'var(--color-surface-3)' : 'var(--color-primary)', color: '#fff', border: 'none', padding: '9px 20px', fontSize: 13 }}
                onClick={() => onToggle(habit.id)}
              >
                {doneToday ? '✓ Done today' : 'Mark done today'}
              </button>
              <button className="btn btn-ghost" style={{ fontSize: 13 }} onClick={() => setIsEditing(true)}>Edit</button>
              <button className="btn btn-ghost" style={{ fontSize: 13 }} onClick={onClose}>Close</button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

/* ─── Week navigator ───────────────────────────────────────── */
function WeekNav({ week, selectedDate, onSelect, onPrevWeek, onNextWeek }) {
  const isCurrentWeek = week.some(d => sameDay(d, today))
  return (
    <div className="habits-week-nav">
      <div className="habits-week-header">
        <button className="habits-week-arrow" onClick={onPrevWeek}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15,18 9,12 15,6" /></svg>
        </button>
        <span className="habits-week-label">
          {MONTHS[week[0].getMonth()]} {week[0].getDate()} – {MONTHS[week[6].getMonth()]} {week[6].getDate()}, {week[6].getFullYear()}
        </span>
        <button className="habits-week-arrow" onClick={onNextWeek} disabled={isCurrentWeek} style={{ opacity: isCurrentWeek ? 0.3 : 1 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9,18 15,12 9,6" /></svg>
        </button>
        {!isCurrentWeek && (
          <button className="habits-week-today-btn" onClick={() => onSelect(today)}>Today</button>
        )}
      </div>
      <div className="habits-week-days">
        {week.map(day => {
          const isSelected = sameDay(day, selectedDate)
          const isToday = sameDay(day, today)
          const isFuture = day > today
          return (
            <button
              key={day.toISOString()}
              onClick={() => !isFuture && onSelect(day)}
              disabled={isFuture}
              className={`habits-day-btn ${isSelected ? 'habits-day-btn--active' : ''} ${isToday && !isSelected ? 'habits-day-btn--today' : ''}`}
              style={{ opacity: isFuture ? 0.35 : 1 }}
            >
              <span className="habits-day-name">{DAYS_SHORT[day.getDay()]}</span>
              <span className="habits-day-num">{day.getDate()}</span>
              {isToday && <span className="habits-day-dot" />}
            </button>
          )
        })}
      </div>
    </div>
  )
}

/* ─── Area filter ──────────────────────────────────────────── */
function AreaFilter({ areas, active, onSelect }) {
  return (
    <>
      {areas.map(area => {
        const isActive = active === area
        const style = area !== 'All' ? getAreaStyle(area) : null
        return (
          <button key={area} onClick={() => onSelect(area)} className="habits-area-pill" style={{
            background: isActive ? (style ? style.bg : 'var(--color-primary-subtle)') : 'transparent',
            color: isActive ? (style ? style.color : 'var(--color-primary)') : 'var(--color-text-muted)',
            border: `1px solid ${isActive ? (style ? style.border : 'var(--color-primary-muted)') : 'var(--color-border)'}`,
          }}>
            {area !== 'All' && (
              <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: isActive && style ? style.color : 'var(--color-text-muted)', transition: 'background 150ms' }} />
            )}
            {area}
          </button>
        )
      })}
    </>
  )
}

/* ─── Habit Row ────────────────────────────────────────────── */
function HabitRow({ habit, done, onToggle, onOpen }) {
  const areaStyle = getAreaStyle(habit.area)
  return (
    <div className={`habit-row ${done ? 'habit-row--done' : ''}`}>
      <div className="habit-area-bar" style={{ background: areaStyle.color }} />

      <div className="habit-emoji" style={{ background: done ? `${areaStyle.color}18` : 'var(--color-surface-3)' }}>
        {habit.emoji}
      </div>

      {/* Info — click to open detail */}
      <div className="habit-info" onClick={() => onOpen(habit)} style={{ cursor: 'pointer' }}>
        <div className="habit-name" style={{ color: done ? 'var(--color-primary)' : 'var(--color-text)' }}>
          {habit.name}
        </div>
        <div className="habit-meta">
          <span className="habit-area-tag" style={{ background: areaStyle.bg, color: areaStyle.color, border: `1px solid ${areaStyle.border}` }}>
            {habit.area}
          </span>
          {habit.streak > 0
            ? <span style={{ color: '#F59E0B', fontSize: 11, fontWeight: 600 }}>🔥 {habit.streak}d streak</span>
            : <span style={{ color: 'var(--color-text-muted)', fontSize: 11 }}>No streak yet</span>}
        </div>
      </div>

      {/* Open detail button */}
      <button
        className="task-open-btn"
        onClick={() => onOpen(habit)}
        title="View details"
        style={{ opacity: 1 }}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
          <polyline points="15,3 21,3 21,9" /><line x1="10" y1="14" x2="21" y2="3" />
        </svg>
      </button>

      {/* Check circle — toggle only */}
      <div
        className={`habit-check ${done ? 'habit-check--done' : ''}`}
        onClick={e => { e.stopPropagation(); onToggle(habit.id) }}
        title={done ? 'Undo' : 'Mark done'}
      >
        {done && (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round">
            <polyline points="20,6 9,17 4,12" />
          </svg>
        )}
      </div>
    </div>
  )
}

/* ─── Stats Panel (right) ──────────────────────────────────── */
function StatsPanel({ habits, selectedDate }) {
  const dk = dateKey(selectedDate)
  const total = habits.length
  const doneToday = habits.filter(h => h.completedDates.has(dk)).length
  const pct = total > 0 ? Math.round((doneToday / total) * 100) : 0
  const bestStreak = Math.max(...habits.map(h => h.streak), 0)
  const heatmap = buildHeatmap(habits)

  return (
    <div className="habits-right-panel">

      {/* Progress ring */}
      <div className="habits-ring-card card">
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: 16 }}>
          {sameDay(selectedDate, today) ? "Today's Progress" : `${DAYS_FULL[selectedDate.getDay()]} · ${MONTHS[selectedDate.getMonth()]} ${selectedDate.getDate()}`}
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
          <ProgressRing radius={46} strokeWidth={6} progress={pct} size={92}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--color-primary)', lineHeight: 1 }}>{pct}%</div>
              <div style={{ fontSize: 10, color: 'var(--color-text-muted)', marginTop: 2 }}>{doneToday}/{total}</div>
            </div>
          </ProgressRing>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {[
            { label: 'Done', value: doneToday, accent: true },
            { label: 'Remaining', value: total - doneToday, accent: false },
            { label: 'Best streak', value: `${bestStreak}d`, accent: true },
            { label: 'Total habits', value: total, accent: false },
          ].map(s => (
            <div key={s.label} className="habits-mini-stat" style={{
              background: s.accent ? 'var(--color-primary-subtle)' : 'var(--color-surface-3)',
              border: `1px solid ${s.accent ? 'var(--color-primary-muted)' : 'var(--color-border)'}`,
            }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: s.accent ? 'var(--color-primary)' : 'var(--color-text)' }}>{s.value}</div>
              <div style={{ fontSize: 10, color: 'var(--color-text-muted)', marginTop: 1 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Streaks (moved above Activity) ── */}
      <div className="glass-card">
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: 12 }}>
          Streaks
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[...habits].sort((a, b) => b.streak - a.streak).slice(0, 5).map(h => {
            const as = getAreaStyle(h.area)
            const maxS = Math.max(...habits.map(x => x.streak), 1)
            const barW = Math.round((h.streak / maxS) * 100)
            return (
              <div key={h.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 16, flexShrink: 0 }}>{h.emoji}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-text)', marginBottom: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {h.name}
                  </div>
                  <div style={{ height: 4, borderRadius: 2, background: 'var(--color-surface-3)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${barW}%`, background: as.color, borderRadius: 2, transition: 'width 600ms ease' }} />
                  </div>
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, color: h.streak > 0 ? '#F59E0B' : 'var(--color-text-muted)', flexShrink: 0 }}>
                  {h.streak > 0 ? `🔥${h.streak}` : '—'}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Activity heatmap (moved below Streaks) ── */}
      <div className="glass-card">
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: 12 }}>
          Activity — Last 5 Weeks
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 4 }}>
          {DAYS_SHORT.map(d => (
            <div key={d} style={{ fontSize: 9, textAlign: 'center', color: 'var(--color-text-muted)', fontWeight: 600 }}>{d[0]}</div>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
          {heatmap.map((cell, i) => {
            const isSelected = sameDay(cell.date, selectedDate)
            const opacity = cell.pct === 0 ? 1 : cell.pct < 0.34 ? 0.4 : cell.pct < 0.67 ? 0.7 : 1
            return (
              <div key={i} title={`${MONTHS[cell.date.getMonth()]} ${cell.date.getDate()} — ${cell.done} done`} style={{
                aspectRatio: '1', borderRadius: 4,
                background: cell.pct === 0 ? 'var(--color-surface-3)' : 'var(--color-primary)',
                opacity,
                outline: isSelected ? '2px solid var(--color-primary)' : 'none',
                outlineOffset: 1,
                transition: 'all 150ms',
              }} />
            )
          })}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 10 }}>
          <span style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>Less</span>
          {[0, 0.33, 0.67, 1].map((o, i) => (
            <div key={i} style={{ width: 10, height: 10, borderRadius: 3, background: i === 0 ? 'var(--color-surface-3)' : 'var(--color-primary)', opacity: i === 0 ? 1 : o }} />
          ))}
          <span style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>More</span>
        </div>
      </div>
    </div>
  )
}

/* ─── Main Component ───────────────────────────────────────── */
/* ── localStorage helpers for Set serialization ── */
const STORAGE_KEY = 'pillar_habits'

function habitsToStorage(habits) {
  return habits.map(h => ({
    ...h,
    completedDates: Array.from(h.completedDates),
  }))
}

function habitsFromStorage(raw) {
  if (!raw || !Array.isArray(raw)) return null
  return raw.map(h => ({
    ...h,
    completedDates: new Set(h.completedDates || []),
  }))
}

export default function Habits() {
  const { toastSuccess, toastStreak } = useToast()
  const [habits, setHabitsRaw] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      const parsed = stored ? habitsFromStorage(JSON.parse(stored)) : null
      return parsed || INITIAL_HABITS
    } catch { return INITIAL_HABITS }
  })

  const setHabits = (updater) => {
    setHabitsRaw(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(habitsToStorage(next))) } catch { /* ignore */ }
      return next
    })
  }
  const [selectedDate, setSelectedDate] = useState(today)
  const [weekAnchor, setWeekAnchor] = useState(today)
  const [activeArea, setActiveArea] = useState('All')
  const [customAreas, setCustomAreas] = useState([])
  const [addingArea, setAddingArea] = useState(false)
  const [newAreaName, setNewAreaName] = useState('')
  const [showNewHabit, setShowNewHabit] = useState(false)
  const [detailHabit, setDetailHabit] = useState(null)

  const week = useMemo(() => getWeek(weekAnchor), [weekAnchor])

  /* ── Week nav ── */
  const prevWeek = () => { const a = new Date(weekAnchor); a.setDate(a.getDate() - 7); setWeekAnchor(a) }
  const nextWeek = () => {
    const a = new Date(weekAnchor)
    const next = new Date(a); next.setDate(a.getDate() + 7)
    setWeekAnchor(next <= today ? next : today)
  }
  const handleSelectDay = (day) => {
    setSelectedDate(day)
    if (!week.some(d => sameDay(d, day))) setWeekAnchor(day)
  }

  /* ── Toggle ── */
  const toggle = (id) => {
    const dk = dateKey(selectedDate)
    setHabits(prev => prev.map(h => {
      if (h.id !== id) return h
      const alreadyDone = h.completedDates.has(dk)
      const newDates = new Set(h.completedDates)
      if (alreadyDone) { newDates.delete(dk); return { ...h, completedDates: newDates, streak: Math.max(0, h.streak - 1) } }
      else { newDates.add(dk); return { ...h, completedDates: newDates, streak: h.streak + 1 } }
    }))

    // Toast feedback
    const h = habits.find(h => h.id === id)
    if (h) {
      const dk = dateKey(selectedDate)
      const wasntDone = !h.completedDates.has(dk)
      if (wasntDone) {
        const newStreak = h.streak + 1
        if (newStreak > 0 && newStreak % 7 === 0) {
          toastStreak(`${newStreak}-day streak! 🔥`, `Keep it up with ${h.emoji} ${h.name}`)
        } else {
          toastSuccess(`${h.emoji} ${h.name}`, `Marked done for today!`)
        }
      }
    }
  }

  /* ── Update habit ── */
  const updateHabit = (id, patch) =>
    setHabits(prev => prev.map(h => h.id === id ? { ...h, ...patch } : h))

  /* ── Save new habit ── */
  const saveNewHabit = ({ name, emoji, area, notes }) => {
    setHabits(prev => [...prev, {
      id: Date.now(), name, emoji, area, notes, streak: 0,
      completedDates: new Set(),
    }])
  }

  // Keep detail modal in sync
  useEffect(() => {
    if (detailHabit) {
      const updated = habits.find(h => h.id === detailHabit.id)
      if (updated) setDetailHabit(updated)
    }
  }, [habits])

  /* ── Filtering ── */
  const dk = dateKey(selectedDate)
  const allAreas = [...DEFAULT_AREAS, ...customAreas]
  const filteredHabits = activeArea === 'All' ? habits : habits.filter(h => h.area === activeArea)
  const doneInView = filteredHabits.filter(h => h.completedDates.has(dk)).length

  const addArea = () => {
    const name = newAreaName.trim()
    if (name && !allAreas.includes(name)) setCustomAreas(prev => [...prev, name])
    setNewAreaName(''); setAddingArea(false)
  }

  return (
    <div className="page habits-page">

      {/* Week nav */}
      <WeekNav week={week} selectedDate={selectedDate} onSelect={handleSelectDay} onPrevWeek={prevWeek} onNextWeek={nextWeek} />

      {/* Area filter */}
      <div className="habits-area-row" style={{ flexShrink: 0 }}>
        <AreaFilter areas={allAreas} active={activeArea} onSelect={setActiveArea} />
        {addingArea ? (
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <input
              autoFocus className="input"
              style={{ padding: '5px 10px', fontSize: 12, width: 130 }}
              placeholder="Area name…" value={newAreaName}
              onChange={e => setNewAreaName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') addArea(); if (e.key === 'Escape') setAddingArea(false) }}
            />
            <button className="btn btn-primary" style={{ padding: '5px 12px', fontSize: 12 }} onClick={addArea}>Add</button>
            <button className="btn btn-ghost" style={{ padding: '5px 10px', fontSize: 12 }} onClick={() => setAddingArea(false)}>✕</button>
          </div>
        ) : (
          <button className="tasks-pill-add" title="Add custom area" onClick={() => setAddingArea(true)}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
        )}
      </div>

      {/* Two-column layout */}
      <div className="habits-layout">

        {/* Left: Habit list */}
        <div className="habits-left-panel">
          <div className="habits-list-header">
            <span className="habits-list-title">{activeArea === 'All' ? 'All Habits' : activeArea}</span>
            <span className="tasks-group-count">{doneInView}/{filteredHabits.length}</span>
            <span style={{ fontSize: 12, color: 'var(--color-text-muted)', marginLeft: 4 }}>
              {sameDay(selectedDate, today) ? 'today' : DAYS_FULL[selectedDate.getDay()]}
            </span>
          </div>
          {filteredHabits.length === 0 ? (
            <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 14 }}>
              No habits in this area
            </div>
          ) : (
            <div className="habits-list">
              {filteredHabits.map(habit => (
                <HabitRow
                  key={habit.id}
                  habit={habit}
                  done={habit.completedDates.has(dk)}
                  onToggle={toggle}
                  onOpen={setDetailHabit}
                />
              ))}
            </div>
          )}
        </div>

        {/* Right: Stats */}
        <StatsPanel habits={habits} selectedDate={selectedDate} />
      </div>

      {/* New Habit Modal */}
      {showNewHabit && (
        <NewHabitModal
          areas={allAreas}
          onSave={saveNewHabit}
          onClose={() => setShowNewHabit(false)}
        />
      )}

      {/* ── FAB ── */}
      <button className="fab" onClick={() => setShowNewHabit(true)} aria-label="Add habit">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>

      {/* Habit Detail Modal */}
      {detailHabit && (
        <HabitDetailModal
          habit={detailHabit}
          selectedDate={selectedDate}
          onClose={() => setDetailHabit(null)}
          onToggle={toggle}
          onUpdate={updateHabit}
        />
      )}
    </div>
  )
}
