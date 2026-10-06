import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { tasksApi } from '../../api/tasks'
import { habitsApi } from '../../api/habits'
import { calendarApi } from '../../api/calendar'
import { MORNING_ADHKAR, EVENING_ADHKAR, DUAS_CATEGORIES, HADITHS_LIBRARY } from '../../data/adhkarData'
import { useUser } from '../../context/UserContext'

/* ─── Static Navigation Pages ─── */
const PAGES = [
  { id: 'page-today',       title: 'Today',            path: '/',            icon: '⚡', category: 'pages', desc: 'Daily dashboard & focus' },
  { id: 'page-tasks',       title: 'Tasks',            path: '/tasks',       icon: '✅', category: 'pages', desc: 'Task lists, kanban & timeline' },
  { id: 'page-habits',      title: 'Habits',           path: '/habits',      icon: '🔁', category: 'pages', desc: 'Habit streaks & consistency' },
  { id: 'page-calendar',    title: 'Calendar',         path: '/calendar',    icon: '📅', category: 'pages', desc: 'Events, agenda & schedule' },
  { id: 'page-faith',       title: 'Faith & Spiritual',path: '/faith',       icon: '🕌', category: 'pages', desc: 'Prayers, khatmah & good deeds' },
  { id: 'page-adhkar',      title: 'Adhkar Library',   path: '/adhkar',      icon: '📖', category: 'pages', desc: 'Morning, evening & daily du\'as' },
  { id: 'page-hadiths',     title: 'Hadiths Library',  path: '/hadiths',     icon: '📜', category: 'pages', desc: 'Authentic prophetic narrations' },
  { id: 'page-focus',       title: 'Focus & Deep Work',path: '/focus',       icon: '🎯', category: 'pages', desc: 'Pomodoro timer & focus logs' },
  { id: 'page-preferences', title: 'Preferences',      path: '/preferences', icon: '⚙️', category: 'pages', desc: 'Theme, accent & notification settings' },
  { id: 'page-profile',     title: 'Profile & Account',path: '/profile',     icon: '👤', category: 'pages', desc: 'Personal identity & stats' },
  { id: 'page-trash',       title: 'Trash Bin',        path: '/trash',       icon: '🗑️', category: 'pages', desc: 'Restore or permanently delete items' },
]

/* ─── Flatten Faith Library Items ─── */
const FAITH_ITEMS = [
  ...MORNING_ADHKAR.map(a => ({
    id: `adhkar-${a.id}`,
    title: a.translation.slice(0, 75) + (a.translation.length > 75 ? '…' : ''),
    arabic: a.text,
    source: a.source,
    category: 'faith',
    subType: 'Morning Dhikr',
    icon: '🌅',
    path: '/adhkar'
  })),
  ...EVENING_ADHKAR.map(a => ({
    id: `adhkar-${a.id}`,
    title: a.translation.slice(0, 75) + (a.translation.length > 75 ? '…' : ''),
    arabic: a.text,
    source: a.source,
    category: 'faith',
    subType: 'Evening Dhikr',
    icon: '🌇',
    path: '/adhkar'
  })),
  ...DUAS_CATEGORIES.flatMap(cat => cat.items.map(d => ({
    id: `dua-${d.id}`,
    title: d.translation.slice(0, 75) + (d.translation.length > 75 ? '…' : ''),
    arabic: d.text,
    source: d.source,
    category: 'faith',
    subType: cat.labelEn,
    icon: cat.icon || '🤲',
    path: '/adhkar'
  }))),
  ...HADITHS_LIBRARY.map(h => ({
    id: `hadith-${h.id}`,
    title: h.translation ? (h.translation.slice(0, 80) + '…') : (h.narrator + ' - ' + h.topic),
    arabic: h.text.slice(0, 70) + '…',
    source: `${h.source} (${h.grade})`,
    category: 'faith',
    subType: 'Hadith',
    icon: '📜',
    path: '/hadiths'
  }))
]

const CATEGORY_META = {
  all:      { label: 'All',      icon: '✨', color: 'var(--color-primary)' },
  tasks:    { label: 'Tasks',    icon: '✅', color: '#3B82F6' },
  habits:   { label: 'Habits',   icon: '🔁', color: '#F59E0B' },
  calendar: { label: 'Calendar', icon: '📅', color: '#6366F1' },
  faith:    { label: 'Faith',    icon: '🕌', color: '#10B981' },
  pages:    { label: 'Pages',    icon: '🧭', color: '#8B5CF6' },
  actions:  { label: 'Actions',  icon: '⚡', color: '#EC4899' },
}

export default function GlobalSearchModal({ open, onClose }) {
  const navigate = useNavigate()
  const { toggleTheme } = useUser()

  const [query, setQuery] = useState('')
  const [activeTab, setActiveTab] = useState('all')
  const [selectedIndex, setSelectedIndex] = useState(0)

  // Remote data state
  const [tasks, setTasks] = useState([])
  const [habits, setHabits] = useState([])
  const [events, setEvents] = useState([])
  const [loadingData, setLoadingData] = useState(false)

  const inputRef = useRef(null)
  const listRef = useRef(null)

  /* ─── Fetch data on open ─── */
  useEffect(() => {
    if (!open) {
      setQuery('')
      setSelectedIndex(0)
      return
    }

    setLoadingData(true)
    Promise.all([
      tasksApi.list({ trash: 'false' }).catch(() => []),
      habitsApi.list().catch(() => []),
      calendarApi.list().catch(() => []),
    ]).then(([tData, hData, cData]) => {
      setTasks(Array.isArray(tData) ? tData : [])
      setHabits(Array.isArray(hData) ? hData : [])
      setEvents(Array.isArray(cData) ? cData : [])
    }).finally(() => {
      setLoadingData(false)
    })

    // Focus input
    setTimeout(() => {
      inputRef.current?.focus()
    }, 50)
  }, [open])

  /* ─── Quick Actions ─── */
  const actions = useMemo(() => [
    {
      id: 'act-new-task',
      title: 'Create new task',
      desc: 'Quickly add a task with priority and due date',
      icon: '➕',
      category: 'actions',
      run: () => { navigate('/tasks'); onClose() }
    },
    {
      id: 'act-new-habit',
      title: 'Create new habit',
      desc: 'Track a new daily, weekly, or periodic routine',
      icon: '🌱',
      category: 'actions',
      run: () => { navigate('/habits'); onClose() }
    },
    {
      id: 'act-new-event',
      title: 'Schedule an event',
      desc: 'Add meeting, reminder, or appointment to calendar',
      icon: '🗓️',
      category: 'actions',
      run: () => { navigate('/calendar'); onClose() }
    },
    {
      id: 'act-toggle-theme',
      title: 'Toggle theme (Light / Dark)',
      desc: 'Switch between Dark Obsidian and Light Porcelain modes',
      icon: '🌓',
      category: 'actions',
      run: () => { toggleTheme(); onClose() }
    },
  ], [navigate, toggleTheme, onClose])

  /* ─── Filter & Search Engine ─── */
  const results = useMemo(() => {
    const q = query.trim().toLowerCase()

    // 1. Pages
    const matchedPages = PAGES.filter(p =>
      !q || p.title.toLowerCase().includes(q) || p.desc.toLowerCase().includes(q)
    )

    // 2. Actions
    const matchedActions = actions.filter(a =>
      !q || a.title.toLowerCase().includes(q) || a.desc.toLowerCase().includes(q)
    )

    // 3. Tasks
    const matchedTasks = tasks
      .filter(t => !(t.in_trash || t.inTrash))
      .filter(t =>
        !q ||
        t.text?.toLowerCase().includes(q) ||
        t.notes?.toLowerCase().includes(q) ||
        t.tag?.toLowerCase().includes(q) ||
        t.list?.toLowerCase().includes(q) ||
        t.list_name?.toLowerCase().includes(q) ||
        (t.subtasks || []).some(st => st.text?.toLowerCase().includes(q))
      )
      .map(t => ({
        id: `task-${t.id}`,
        rawId: t.id,
        title: t.text,
        desc: t.notes || (t.list || t.list_name ? `List: ${t.list || t.list_name}` : ''),
        tag: t.tag,
        priority: t.priority,
        done: t.done,
        dueDate: t.due_date || t.dueDate,
        category: 'tasks',
        icon: t.done ? '✓' : '▢',
        action: () => {
          navigate('/tasks', { state: { openTaskId: t.id } })
          onClose()
        }
      }))

    // 4. Habits
    const matchedHabits = habits.filter(h =>
      !q ||
      h.name?.toLowerCase().includes(q) ||
      h.description?.toLowerCase().includes(q) ||
      h.category?.toLowerCase().includes(q) ||
      (h.tags || []).some(tag => tag.toLowerCase().includes(q))
    ).map(h => ({
      id: `habit-${h.id}`,
      title: h.name,
      desc: h.description || `Category: ${h.category || 'General'}`,
      streak: h.streak || h.current_streak || 0,
      frequency: h.frequency,
      color: h.color || '#F59E0B',
      category: 'habits',
      icon: '🔁',
      action: () => {
        navigate('/habits')
        onClose()
      }
    }))

    // 5. Calendar Events
    const matchedEvents = events.filter(e =>
      !q ||
      e.title?.toLowerCase().includes(q) ||
      e.description?.toLowerCase().includes(q) ||
      e.location?.toLowerCase().includes(q) ||
      e.category?.toLowerCase().includes(q)
    ).map(e => ({
      id: `event-${e.id}`,
      title: e.title,
      desc: [e.start_date || e.date, e.start_time, e.location].filter(Boolean).join(' · '),
      category: 'calendar',
      eventCategory: e.category,
      icon: '📅',
      action: () => {
        navigate('/calendar')
        onClose()
      }
    }))

    // 6. Faith items
    const matchedFaith = FAITH_ITEMS.filter(f =>
      !q ||
      f.title.toLowerCase().includes(q) ||
      f.arabic.toLowerCase().includes(q) ||
      f.subType.toLowerCase().includes(q) ||
      (f.source && f.source.toLowerCase().includes(q))
    ).slice(0, 15).map(f => ({
      id: f.id,
      title: f.title,
      arabic: f.arabic,
      desc: `${f.subType} · ${f.source || ''}`,
      category: 'faith',
      icon: f.icon,
      action: () => {
        navigate(f.path)
        onClose()
      }
    }))

    return {
      pages: matchedPages,
      actions: matchedActions,
      tasks: matchedTasks,
      habits: matchedHabits,
      calendar: matchedEvents,
      faith: matchedFaith,
    }
  }, [query, tasks, habits, events, actions, navigate, onClose])

  /* ─── Flattened items based on activeTab ─── */
  const flatItems = useMemo(() => {
    let list = []
    if (activeTab === 'all') {
      // Prioritize actions & pages when query is empty, otherwise show modules first
      if (!query.trim()) {
        list = [
          ...results.pages.map(p => ({ ...p, action: () => { navigate(p.path); onClose() } })),
          ...results.actions.map(a => ({ ...a, action: a.run })),
        ]
      } else {
        list = [
          ...results.tasks,
          ...results.habits,
          ...results.calendar,
          ...results.faith,
          ...results.pages.map(p => ({ ...p, action: () => { navigate(p.path); onClose() } })),
          ...results.actions.map(a => ({ ...a, action: a.run })),
        ]
      }
    } else if (activeTab === 'tasks') {
      list = results.tasks
    } else if (activeTab === 'habits') {
      list = results.habits
    } else if (activeTab === 'calendar') {
      list = results.calendar
    } else if (activeTab === 'faith') {
      list = results.faith
    } else if (activeTab === 'pages') {
      list = [
        ...results.pages.map(p => ({ ...p, action: () => { navigate(p.path); onClose() } })),
        ...results.actions.map(a => ({ ...a, action: a.run })),
      ]
    }
    return list
  }, [activeTab, results, query, navigate, onClose])

  // Reset selected index when results change
  useEffect(() => {
    setSelectedIndex(0)
  }, [flatItems.length, activeTab, query])

  /* ─── Keyboard navigation ─── */
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(idx => (idx + 1) % (flatItems.length || 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(idx => (idx - 1 + flatItems.length) % (flatItems.length || 1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (flatItems[selectedIndex]?.action) {
        flatItems[selectedIndex].action()
      }
    } else if (e.key === 'Escape') {
      e.preventDefault()
      onClose()
    }
  }, [flatItems, selectedIndex, onClose])

  // Scroll active item into view
  useEffect(() => {
    const activeEl = listRef.current?.querySelector(`[data-index="${selectedIndex}"]`)
    if (activeEl) {
      activeEl.scrollIntoView({ block: 'nearest' })
    }
  }, [selectedIndex])

  if (!open) return null

  const totalCount =
    results.tasks.length +
    results.habits.length +
    results.calendar.length +
    results.faith.length +
    results.pages.length +
    results.actions.length

  return (
    <div className="gsm-backdrop" onClick={onClose}>
      <div className="gsm-modal" onClick={e => e.stopPropagation()}>
        {/* ── Input Header ── */}
        <div className="gsm-input-row">
          <svg className="gsm-search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            className="gsm-input"
            placeholder="Search tasks, habits, calendar, faith, or type a command…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          {query ? (
            <button className="gsm-clear-btn" onClick={() => { setQuery(''); inputRef.current?.focus() }} title="Clear">
              ✕
            </button>
          ) : (
            <span className="gsm-esc-badge" onClick={onClose} title="Press ESC to close">
              ESC
            </span>
          )}
        </div>

        {/* ── Category Tabs ── */}
        <div className="gsm-tabs-row">
          {[
            ['all', `All (${totalCount})`],
            ['tasks', `Tasks (${results.tasks.length})`],
            ['habits', `Habits (${results.habits.length})`],
            ['calendar', `Calendar (${results.calendar.length})`],
            ['faith', `Faith (${results.faith.length})`],
            ['pages', `Pages (${results.pages.length + results.actions.length})`],
          ].map(([key, label]) => (
            <button
              key={key}
              className={`gsm-tab ${activeTab === key ? 'gsm-tab--active' : ''}`}
              onClick={() => setActiveTab(key)}
            >
              {label}
            </button>
          ))}
        </div>

        {/* ── Results Container ── */}
        <div className="gsm-results-list" ref={listRef}>
          {loadingData && (
            <div className="gsm-empty-state">
              <span className="gsm-spinner" />
              <span>Indexing modules…</span>
            </div>
          )}

          {!loadingData && flatItems.length === 0 && (
            <div className="gsm-empty-state">
              <div style={{ fontSize: 28, marginBottom: 6 }}>🔍</div>
              <div style={{ fontWeight: 600, color: 'var(--color-text)' }}>No results found</div>
              <div style={{ fontSize: 13, color: 'var(--color-text-muted)', marginTop: 2 }}>
                No matching items found for &ldquo;{query}&rdquo;
              </div>
            </div>
          )}

          {!loadingData && flatItems.map((item, idx) => {
            const isSelected = idx === selectedIndex
            const meta = CATEGORY_META[item.category] || CATEGORY_META.all

            return (
              <div
                key={item.id}
                data-index={idx}
                className={`gsm-item ${isSelected ? 'gsm-item--active' : ''}`}
                onClick={() => item.action && item.action()}
                onMouseEnter={() => setSelectedIndex(idx)}
              >
                {/* Category Badge & Icon */}
                <div
                  className="gsm-item-icon-box"
                  style={{
                    color: meta.color,
                    background: `color-mix(in srgb, ${meta.color} 12%, transparent)`,
                    border: `1px solid color-mix(in srgb, ${meta.color} 25%, transparent)`,
                  }}
                >
                  {item.icon}
                </div>

                {/* Content */}
                <div className="gsm-item-content">
                  <div className="gsm-item-title-row">
                    <span className={`gsm-item-title ${item.done ? 'gsm-item-title--done' : ''}`}>
                      {item.title}
                    </span>
                    {item.arabic && (
                      <span className="gsm-item-arabic" dir="rtl">{item.arabic}</span>
                    )}
                  </div>

                  {item.desc && (
                    <div className="gsm-item-desc">{item.desc}</div>
                  )}
                </div>

                {/* Tags / Badges on right */}
                <div className="gsm-item-extra">
                  {item.priority && item.priority !== 'none' && (
                    <span className={`gsm-priority-pill gsm-priority-pill--${item.priority}`}>
                      {item.priority}
                    </span>
                  )}
                  {item.streak > 0 && (
                    <span className="gsm-streak-pill">🔥 {item.streak}</span>
                  )}
                  {item.dueDate && (
                    <span className="gsm-date-pill">📅 {item.dueDate}</span>
                  )}
                  <span className="gsm-category-pill" style={{ color: meta.color }}>
                    {meta.label}
                  </span>
                  <span className="gsm-item-enter">↵</span>
                </div>
              </div>
            )
          })}
        </div>

        {/* ── Footer ── */}
        <div className="gsm-footer">
          <div className="gsm-footer-shortcuts">
            <span className="gsm-kbd">↑</span>
            <span className="gsm-kbd">↓</span>
            <span className="gsm-shortcut-label">Navigate</span>
            <span className="gsm-kbd">↵</span>
            <span className="gsm-shortcut-label">Select</span>
            <span className="gsm-kbd">esc</span>
            <span className="gsm-shortcut-label">Close</span>
          </div>

          <div className="gsm-footer-count">
            {flatItems.length} result{flatItems.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>
    </div>
  )
}
