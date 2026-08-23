import { useState, useRef } from 'react'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

const EVENTS = {
  3: [{ label: 'Design Review', color: '#6366F1' }],
  7: [{ label: 'Team Retro', color: '#3B82F6' }],
  10: [{ label: 'Deep Work', color: '#F43F5E' }, { label: 'Morning Habit', color: '#F59E0B' }],
  14: [{ label: 'Product Demo', color: '#6366F1' }],
  17: [{ label: 'Focus Session', color: '#F43F5E' }],
  21: [{ label: 'Sprint Planning', color: '#6366F1' }],
  24: [{ label: 'Client Call', color: '#3B82F6' }],
  28: [{ label: 'Weekly Review', color: '#6366F1' }],
}

function getCalendarDays(year, month) {
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  return { firstDay, daysInMonth }
}

function getWeekDays(date) {
  const start = new Date(date)
  start.setDate(date.getDate() - date.getDay())
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    return d
  })
}

export default function Calendar() {
  const today = new Date()
  const [currentMonth, setCurrentMonth] = useState(today.getMonth())
  const [currentYear, setCurrentYear] = useState(today.getFullYear())
  const [selected, setSelected] = useState(today.getDate())
  const [weekAnchor, setWeekAnchor] = useState(today)
  const weekStripRef = useRef(null)

  const { firstDay, daysInMonth } = getCalendarDays(currentYear, currentMonth)
  const isCurrentMonth = currentMonth === today.getMonth() && currentYear === today.getFullYear()

  const prevMonth = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1) }
    else setCurrentMonth(m => m - 1)
    setSelected(null)
  }
  const nextMonth = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1) }
    else setCurrentMonth(m => m + 1)
    setSelected(null)
  }

  const selectedEvents = EVENTS[selected] || []

  // Build grid cells
  const cells = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  // Week strip data
  const weekDays = getWeekDays(weekAnchor)

  const prevWeek = () => {
    const d = new Date(weekAnchor)
    d.setDate(d.getDate() - 7)
    setWeekAnchor(d)
  }
  const nextWeek = () => {
    const d = new Date(weekAnchor)
    d.setDate(d.getDate() + 7)
    setWeekAnchor(d)
  }

  return (
    <div className="page">
      {/* Header */}
      <div className="page-header">
        <div>
          <div className="page-subtitle">{MONTHS[currentMonth]} {currentYear}</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost btn-icon" onClick={prevMonth} aria-label="Previous month">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15,18 9,12 15,6" /></svg>
          </button>
          <button className="btn btn-ghost btn-icon" onClick={nextMonth} aria-label="Next month">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9,18 15,12 9,6" /></svg>
          </button>
        </div>
      </div>

      <div className="calendar-layout">
        {/* Mobile: Weekly strip */}
        <div className="calendar-week-strip">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <button className="btn btn-ghost btn-icon" style={{ width: 28, height: 28 }} onClick={prevWeek}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15,18 9,12 15,6" /></svg>
            </button>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-secondary)' }}>
              {MONTHS[weekDays[0].getMonth()].slice(0, 3)} {weekDays[0].getDate()} – {weekDays[6].getDate()}
            </span>
            <button className="btn btn-ghost btn-icon" style={{ width: 28, height: 28 }} onClick={nextWeek}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9,18 15,12 9,6" /></svg>
            </button>
          </div>
          <div ref={weekStripRef} style={{ display: 'flex', gap: 6, justifyContent: 'space-between' }}>
            {weekDays.map((wd, i) => {
              const dayNum = wd.getDate()
              const isToday = wd.toDateString() === today.toDateString()
              const isSelected = dayNum === selected && wd.getMonth() === currentMonth
              const dayEvents = EVENTS[dayNum] || []
              return (
                <button
                  key={i}
                  onClick={() => { setSelected(dayNum); setCurrentMonth(wd.getMonth()); setCurrentYear(wd.getFullYear()) }}
                  style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 4,
                    padding: '10px 0',
                    borderRadius: 12,
                    border: 'none',
                    background: isSelected ? 'var(--color-primary)' : isToday ? 'var(--color-primary-subtle)' : 'var(--color-surface-2)',
                    cursor: 'pointer',
                    transition: 'all 150ms ease',
                  }}
                >
                  <span style={{ fontSize: 10, fontWeight: 500, color: isSelected ? 'rgba(255,255,255,0.7)' : 'var(--color-text-muted)' }}>
                    {DAYS[i]}
                  </span>
                  <span style={{
                    fontSize: 16, fontWeight: 700,
                    color: isSelected ? '#fff' : isToday ? 'var(--color-primary)' : 'var(--color-text)',
                  }}>
                    {dayNum}
                  </span>
                  {dayEvents.length > 0 && (
                    <div style={{ width: 5, height: 5, borderRadius: '50%', background: isSelected ? '#fff' : dayEvents[0].color }} />
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Desktop: Full month grid */}
        <div className="calendar-month-grid glass-card" style={{ padding: 0, overflow: 'hidden' }}>
          {/* Day labels */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '1px solid var(--color-border)' }}>
            {DAYS.map(d => (
              <div key={d} style={{
                padding: '12px 0',
                textAlign: 'center',
                fontSize: 11,
                fontWeight: 600,
                color: 'var(--color-text-muted)',
                letterSpacing: '0.05em',
              }}>
                {d}
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
            {cells.map((day, i) => {
              const isToday = isCurrentMonth && day === today.getDate()
              const isSel = day === selected
              const events = day ? (EVENTS[day] || []) : []
              return (
                <div
                  key={i}
                  onClick={() => day && setSelected(day)}
                  style={{
                    minHeight: 64,
                    padding: '10px 8px 8px',
                    borderRight: (i + 1) % 7 !== 0 ? '1px solid var(--color-border-subtle)' : 'none',
                    borderBottom: '1px solid var(--color-border-subtle)',
                    cursor: day ? 'pointer' : 'default',
                    background: isSel ? 'var(--color-primary-subtle)' : 'transparent',
                    transition: 'background 150ms ease',
                    position: 'relative',
                  }}
                >
                  {day && (
                    <>
                      <div style={{
                        width: 26, height: 26,
                        borderRadius: '50%',
                        background: isToday ? 'var(--color-primary)' : 'transparent',
                        border: isSel && !isToday ? '2px solid var(--color-primary)' : 'none',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 13,
                        fontWeight: isToday ? 700 : 400,
                        color: isToday ? '#fff' : isSel ? 'var(--color-primary)' : 'var(--color-text)',
                        marginBottom: 4,
                      }}>
                        {day}
                      </div>
                      {/* Event dots */}
                      <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                        {events.slice(0, 3).map((ev, j) => (
                          <div key={j} style={{ width: 6, height: 6, borderRadius: '50%', background: ev.color }} />
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Selected day events */}
        {selected && (
          <div className="calendar-events-panel">
            <div className="section-label">
              {MONTHS[currentMonth]} {selected} — {selectedEvents.length === 0 ? 'No events' : `${selectedEvents.length} event${selectedEvents.length > 1 ? 's' : ''}`}
            </div>
            {selectedEvents.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {selectedEvents.map((ev, i) => (
                  <div key={i} className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px' }}>
                    <div style={{ width: 4, height: 36, borderRadius: 2, background: ev.color, flexShrink: 0 }} />
                    <div style={{ fontSize: 14, fontWeight: 500 }}>{ev.label}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="glass-card" style={{ textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 13 }}>
                No events scheduled. A free day 🎉
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
