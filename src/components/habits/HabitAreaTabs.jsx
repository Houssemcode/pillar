import { useState } from 'react'
import { dateKey } from '../../utils/habitDateUtils'

const AREA_META = {
  All: { icon: '✨', color: 'var(--color-primary)' },
  Morning: { icon: '🌅', color: '#F59E0B' },
  Afternoon: { icon: '☀️', color: '#3B82F6' },
  Evening: { icon: '🌙', color: '#6366F1' },
  Anytime: { icon: '⚡', color: '#10B981' },
  Archived: { icon: '📦', color: '#9CA3AF' },
}

function getHabitAreas(h) {
  if (Array.isArray(h.areas) && h.areas.length > 0) return h.areas
  if (h.area) return [h.area]
  return ['Anytime']
}

export default function HabitAreaTabs({
  activeArea = 'All',
  onAreaChange,
  allAreas = [],
  onAddArea,
  habits = [],
  selectedDate = new Date(),
}) {
  const [adding, setAdding] = useState(false)
  const [newName, setNewName] = useState('')

  const dk = dateKey(selectedDate)

  const handleCreate = () => {
    const trimmed = newName.trim()
    if (trimmed && onAddArea) {
      onAddArea(trimmed)
    }
    setNewName('')
    setAdding(false)
  }

  // Calculate completed / total for each area
  const counts = {}
  allAreas.forEach((area) => {
    let list
    if (area === 'Archived') {
      list = habits.filter((h) => h.is_archived)
    } else if (area === 'All') {
      list = habits.filter((h) => !h.is_archived)
    } else {
      list = habits.filter((h) => !h.is_archived && getHabitAreas(h).includes(area))
    }
    const done = list.filter((h) => h.completedDates?.has(dk)).length
    counts[area] = { done, total: list.length }
  })

  return (
    <div className="habit-top-tabs-container">
      <div className="habit-top-tabs-track" role="tablist">
        {allAreas.map((area) => {
          const isActive = activeArea === area
          const meta = AREA_META[area] || { icon: '🏷️', color: 'var(--color-primary)' }
          const { done, total } = counts[area] || { done: 0, total: 0 }

          return (
            <button
              key={area}
              type="button"
              className={`habit-top-tab ${isActive ? 'habit-top-tab--active' : ''}`}
              onClick={() => onAreaChange(area)}
              role="tab"
              aria-selected={isActive}
            >
              <span>{meta.icon}</span>
              <span className="habit-tab-label">{area}</span>
              {total > 0 && (
                <span className="habit-tab-badge">
                  {done}/{total}
                </span>
              )}
            </button>
          )
        })}

        {/* Add custom area button / inline form */}
        {adding ? (
          <div className="habit-add-area-form" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <input
              autoFocus
              className="input habit-add-area-input"
              placeholder="Area name…"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreate()
                if (e.key === 'Escape') setAdding(false)
              }}
            />
            <button
              type="button"
              className="btn btn-primary"
              style={{ padding: '4px 10px', height: 28, fontSize: 11.5 }}
              onClick={handleCreate}
            >
              Add
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              style={{ padding: '4px 8px', height: 28, fontSize: 11.5 }}
              onClick={() => setAdding(false)}
            >
              ✕
            </button>
          </div>
        ) : (
          <button
            type="button"
            className="habit-add-area-btn"
            title="Add new habit area"
            onClick={() => setAdding(true)}
            aria-label="Add new area"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}
