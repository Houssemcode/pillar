import { useState, useRef, useEffect } from 'react'

const FILTER_PILLS = [
  { key: 'overdue',   label: 'Overdue',       emoji: '🔴', test: (t) => !t.done && t.due_date && new Date(t.due_date) < new Date(new Date().toDateString()) },
  { key: 'today',     label: 'Today',         emoji: '⚡', test: (t) => t.dueToday },
  { key: 'high',      label: 'High Priority', emoji: '🚩', test: (t) => t.priority === 'high' },
  { key: 'subtasks',  label: 'Has Subtasks',  emoji: '📋', test: (t) => t.subtasks && t.subtasks.length > 0 },
  { key: 'recurring', label: 'Recurring',     emoji: '🔁', test: (t) => t.recurrence && typeof t.recurrence === 'object' && t.recurrence.freq },
]

export default function TaskSearchBar({ tasks = [], value, onChange, activePills, onPillToggle, onClear }) {
  const inputRef = useRef(null)

  // keyboard shortcut: '/' or Ctrl+K focuses input
  useEffect(() => {
    const h = (e) => {
      const tag = document.activeElement?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return
      if (e.key === '/' || (e.ctrlKey && e.key === 'k')) {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [])

  const pillCounts = FILTER_PILLS.reduce((acc, pill) => {
    acc[pill.key] = tasks.filter(t => !(t.in_trash || t.inTrash) && pill.test(t)).length
    return acc
  }, {})

  const hasAnyActive = value || activePills.length > 0

  return (
    <div className="tsb-root">
      {/* Search input */}
      <div className="tsb-input-wrap">
        <svg className="tsb-search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          ref={inputRef}
          type="text"
          className="tsb-input"
          placeholder='Search tasks… (press "/" to focus)'
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        {value && (
          <button className="tsb-clear-btn" onClick={() => onChange('')} title="Clear search">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>

      {/* Filter pills row */}
      <div className="tsb-pills-row">
        {FILTER_PILLS.map(pill => {
          const count = pillCounts[pill.key]
          const active = activePills.includes(pill.key)
          if (count === 0 && !active) return null
          return (
            <button
              key={pill.key}
              className={`tsb-pill ${active ? 'tsb-pill--active' : ''}`}
              onClick={() => onPillToggle(pill.key)}
            >
              <span>{pill.emoji}</span>
              <span>{pill.label}</span>
              <span className="tsb-pill-count">{count}</span>
            </button>
          )
        })}
        {hasAnyActive && (
          <button className="tsb-pill tsb-pill--clear" onClick={onClear}>
            ✕ Clear all
          </button>
        )}
      </div>
    </div>
  )
}

// Export the filter test functions so Tasks.jsx can use them
export { FILTER_PILLS }
