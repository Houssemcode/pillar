import { useState, useEffect, useRef, useCallback } from 'react'
import { useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useToast } from '../context/ToastContext'
import tasksService from '../api/tasksService'
import SpeedDial from '../components/tasks/SpeedDial'
import { TaskFormModal, ListFormModal, TagFormModal } from '../components/tasks/CreationModals'
import notificationService from '../services/notificationService'
import QuickAddBar from '../components/tasks/QuickAddBar'
import TaskDetailDrawer from '../components/tasks/TaskDetailDrawer'
import BatchActionBar from '../components/tasks/BatchActionBar'
import KanbanColumn from '../components/tasks/KanbanColumn'
import TaskRowEnhanced from '../components/tasks/TaskRowEnhanced'
import Button   from '../components/ui/Button'
import Badge    from '../components/ui/Badge'
import Checkbox from '../components/ui/Checkbox'
import Card     from '../components/ui/Card'
import PageLayout from '../components/layout/PageLayout'
import { motion, AnimatePresence } from 'framer-motion'
import { formatTimeHHmm } from '../utils/timeUtils'

const PRIORITY_BAR          = { high: '#F43F5E', medium: '#F59E0B', low: '#3B82F6', none: '#71717a' }
const PRIORITY_ORDER        = { high: 0, medium: 1, low: 2, none: 3 }
const PRIORITY_LABEL        = { high: 'High', medium: 'Medium', low: 'Low', none: 'None' }
const PRIORITY_BADGE_VARIANT = { high: 'danger', medium: 'warning', low: 'primary', none: 'default' }

function getPriorityLabel(priority, t) {
  if (!t) return PRIORITY_LABEL[priority] || priority
  const map = {
    high: t('tasks.priorityHigh'),
    medium: t('tasks.priorityMedium'),
    low: t('tasks.priorityLow'),
    none: t('tasks.priorityNone'),
  }
  return map[priority] || priority
}

/* ─── Helpers ──────────────────────────────────────────────── */
function getTodayISO() { return new Date().toISOString().split('T')[0] }
function getNext7DaysISO() {
  const d = new Date()
  d.setDate(d.getDate() + 7)
  return d.toISOString().split('T')[0]
}

/* ─── Smart Views ─────────────────────────────────────────── */
const SMART_VIEWS = [
  {
    key: 'today',
    label: 'Today',
    filter: t => t.dueToday || (t.due_date || t.dueDate) === getTodayISO(),
    icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
  },
  {
    key: 'next7',
    label: 'Next 7 days',
    filter: t => {
      const d = t.due_date || t.dueDate
      if (!d) return false
      const today = getTodayISO()
      const maxDate = getNext7DaysISO()
      return d >= today && d <= maxDate
    },
    icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/></svg>
  },
  {
    key: 'all',
    label: 'All',
    filter: () => true,
    icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
  },
]

const GROUP_OPTIONS = ['none', 'list', 'date', 'tag', 'priority']
const SORT_OPTIONS  = ['none', 'list', 'date', 'tag', 'priority']
const VIEW_OPTIONS  = [
  { key: 'list',     label: 'List view',     icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg> },
  { key: 'kanban',   label: 'Kanban view',   icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="5" height="18" rx="1"/><rect x="10" y="3" width="5" height="12" rx="1"/><rect x="17" y="3" width="5" height="15" rx="1"/></svg> },
  { key: 'timeline', label: 'Timeline view', icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="12" x2="21" y2="12"/><polyline points="8,8 3,12 8,16"/><polyline points="16,8 21,12 16,16"/></svg> },
]

function groupTasks(tasks, groupBy, t) {
  if (groupBy === 'none') return [{ key: null, label: null, tasks }]
  if (groupBy === 'date') {
    const todayISO = getTodayISO()
    const overdue  = tasks.filter(t => !t.done && t.due_date && t.due_date < todayISO)
    const today    = tasks.filter(t => t.dueToday || t.due_date === todayISO)
    const tomorrow = tasks.filter(t => {
      const d = new Date(); d.setDate(d.getDate() + 1)
      return (t.due_date || t.dueDate) === d.toISOString().split('T')[0]
    })
    const thisWeek = tasks.filter(t => {
      const d = t.due_date || t.dueDate
      if (!d) return false
      const days = (new Date(d) - new Date(todayISO)) / 86400000
      return days > 1 && days <= 7
    })
    const later    = tasks.filter(t => {
      const d = t.due_date || t.dueDate
      if (!d) return false
      const days = (new Date(d) - new Date(todayISO)) / 86400000
      return days > 7
    })
    const noDate   = tasks.filter(t => !(t.due_date || t.dueDate))
    return [
      overdue.length  && { key: 'overdue',   label: t ? t('tasks.groupOverdue') : '⚠️ Overdue',    tasks: overdue },
      today.length    && { key: 'today',     label: t ? t('tasks.groupToday') : '📅 Today',       tasks: today },
      tomorrow.length && { key: 'tomorrow',  label: t ? t('tasks.groupTomorrow') : '🌅 Tomorrow',    tasks: tomorrow },
      thisWeek.length && { key: 'this_week', label: t ? t('tasks.groupThisWeek') : '🗓️ This Week',  tasks: thisWeek },
      later.length    && { key: 'later',     label: t ? t('tasks.groupLater') : '🔮 Later',       tasks: later },
      noDate.length   && { key: 'no_date',   label: t ? t('tasks.groupNoDate') : '📦 No Due Date', tasks: noDate },
    ].filter(Boolean)
  }
  const map = {}
  tasks.forEach(t => {
    const key = t[groupBy] ?? 'Other'
    if (!map[key]) map[key] = []
    map[key].push(t)
  })
  const keys = groupBy === 'priority'
    ? Object.keys(map).sort((a, b) => PRIORITY_ORDER[a] - PRIORITY_ORDER[b])
    : Object.keys(map).sort()
  return keys.map(key => ({
    key,
    label: groupBy === 'priority' ? (t ? getPriorityLabel(key, t) : key) : (key.charAt(0).toUpperCase() + key.slice(1)),
    tasks: map[key]
  }))
}

function sortTasks(tasks, sortBy) {
  if (sortBy === 'none') return tasks
  return [...tasks].sort((a, b) => {
    if (sortBy === 'priority') return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]
    if (sortBy === 'date') return (b.dueToday ? 1 : 0) - (a.dueToday ? 1 : 0)
    const aVal = (a[sortBy] ?? '').toLowerCase()
    const bVal = (b[sortBy] ?? '').toLowerCase()
    return aVal < bVal ? -1 : aVal > bVal ? 1 : 0
  })
}


/* ─── Hooks ────────────────────────────────────────────────── */
function useDropdown() {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  useEffect(() => {
    if (!open) return
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [open])
  return { open, setOpen, ref }
}

/* ─── Icon helpers ─────────────────────────────────────────── */
const IconChevronDown = () => <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="6,9 12,15 18,9" /></svg>
const IconCheck       = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><polyline points="20,6 9,17 4,12" /></svg>

/* ─── Group header ─────────────────────────────────────────── */
function GroupHeader({ label, count, groupBy }) {
  const isPriority = groupBy === 'priority'
  const priorityKey = label?.toLowerCase()
  return (
    <div className="tasks-group-header">
      {isPriority && <span style={{ width: 8, height: 8, borderRadius: '50%', background: PRIORITY_BAR[priorityKey], display: 'inline-block' }} />}
      <span>{label}</span>
      <span className="tasks-group-count">{count}</span>
    </div>
  )
}

/* ─── Loading skeleton ─────────────────────────────────────── */
function TasksSkeleton() {
  return (
    <div className="tasks-list">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="ter-row" style={{ opacity: 0.5 - i * 0.06 }}>
          <div className="ter-priority-bar" style={{ background: 'var(--color-surface-3)' }} />
          <div style={{ width: 16, height: 16, borderRadius: 4, background: 'var(--color-surface-3)', flexShrink: 0 }} />
          <div style={{ flex: 1, height: 14, borderRadius: 4, background: 'var(--color-surface-3)', maxWidth: `${60 + i * 8}%` }} />
          <div style={{ width: 56, height: 18, borderRadius: 100, background: 'var(--color-surface-3)' }} />
        </div>
      ))}
    </div>
  )
}

/* ─── Error banner ─────────────────────────────────────────── */
function ErrorBanner({ message, onRetry }) {
  const { t } = useTranslation()
  return (
    <div style={{ padding: '12px 16px', borderRadius: 10, marginBottom: 16, background: '#F43F5E18', border: '1px solid #F43F5E40', display: 'flex', alignItems: 'center', gap: 12 }}>
      <span style={{ fontSize: 14, color: '#F43F5E', flex: 1 }}>⚠ {message}</span>
      {onRetry && (
        <Button variant="danger" size="sm" onClick={onRetry}>{t('common.retry')}</Button>
      )}
    </div>
  )
}

/* ─── Timeline Item ────────────────────────────────────────── */
const TAG_PALETTE = [
  { bg: '#3B82F618', color: '#3B82F6', border: '#3B82F640' },
  { bg: '#6366F118', color: '#6366F1', border: '#6366F140' },
  { bg: '#F59E0B18', color: '#F59E0B', border: '#F59E0B40' },
  { bg: '#10B98118', color: '#10B981', border: '#10B98140' },
  { bg: '#F43F5E18', color: '#F43F5E', border: '#F43F5E40' },
  { bg: '#8B5CF618', color: '#8B5CF6', border: '#8B5CF640' },
]
function getTagColor(tagName) {
  if (!tagName) return { bg: '#a1a1aa18', color: '#a1a1aa', border: '#a1a1aa40' }
  let hash = 0
  for (let i = 0; i < tagName.length; i++) hash = tagName.charCodeAt(i) + ((hash << 5) - hash)
  return TAG_PALETTE[Math.abs(hash) % TAG_PALETTE.length]
}

function TimelineItem({ task, onToggle, onOpen, isLast, userTags }) {
  const { t } = useTranslation()
  const tagColor = task.tag_color || task.tagColor || task.tags?.[0]?.color || (Array.isArray(userTags) ? userTags.find(t => (typeof t === 'string' ? t : t?.name)?.toLowerCase() === task.tag?.toLowerCase())?.color : null) || getTagColor(task.tag).color
  const todayISO = getTodayISO()
  const dueISO   = task.due_date || task.dueDate
  const isOverdue = dueISO && dueISO < todayISO && !task.done

  return (
    <div className="timeline-item">
      <div className="timeline-spine">
        <div
          className={`timeline-dot ${task.done ? 'timeline-dot--done' : ''} ${isOverdue ? 'timeline-dot--overdue' : ''}`}
          style={{
            borderColor: task.done ? '#10B981' : isOverdue ? '#F43F5E' : PRIORITY_BAR[task.priority],
            background:  task.done ? '#10B981' : isOverdue ? '#F43F5E18' : 'var(--color-surface-2)',
          }}
        />
        {!isLast && <div className="timeline-line" />}
      </div>

      <div
        className={`timeline-card ${task.done ? 'task-row--done' : ''}`}
        onClick={() => onOpen(task)}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          {/* ── Checkbox — Design System with pathLength animation ── */}
          <div onClick={(e) => { e.stopPropagation(); onToggle(task.id) }}>
            <Checkbox
              checked={task.done}
              onChange={(e) => { e.stopPropagation(); onToggle(task.id) }}
              size="sm"
              aria-label={task.done ? t('common.pending') : t('common.completed')}
            />
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: 14, fontWeight: 500, lineHeight: 1.4,
              color: task.done ? 'var(--color-text-muted)' : 'var(--color-text)',
              textDecoration: task.done ? 'line-through' : 'none',
            }}>
              {task.text}
            </div>
            {task.notes && (
              <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {task.notes}
              </div>
            )}

            {/* ── Badge row ── */}
            <div style={{ display: 'flex', gap: 5, marginTop: 7, flexWrap: 'wrap', alignItems: 'center' }}>
              {task.tag && (
                <span
                  className="task-tag-badge inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border"
                  style={{
                    backgroundColor: `${tagColor}20`,
                    color: tagColor,
                    borderColor: `${tagColor}40`,
                  }}
                >
                  <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: tagColor }} />
                  #{task.tag}
                </span>
              )}
              <Badge variant={PRIORITY_BADGE_VARIANT[task.priority] ?? 'default'} size="sm">
                {getPriorityLabel(task.priority, t)}
              </Badge>
              {isOverdue && <Badge variant="danger" size="sm">{t('tasks.groupOverdue')}</Badge>}
              {task.dueToday && !isOverdue && (
                <Badge variant="primary" size="sm">{t('tasks.groupToday')}</Badge>
              )}
              {(task.due_time || task.dueTime) && (
                <Badge variant="default" size="sm">
                  🕒 {formatTimeHHmm(task.due_time || task.dueTime)}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── Main Component ───────────────────────────────────────── */
export default function Tasks() {
  const { t, i18n } = useTranslation()
  const isAr = i18n?.language === 'ar' || i18n?.language?.startsWith?.('ar')
  const { toastSuccess, toastError } = useToast()
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)

  const location = useLocation()
  const [smartView, setSmartView]       = useState('today')
  const [activeList, setActiveList]     = useState(null)
  const [activeTag, setActiveTag]       = useState(null)
  const [activeModal, setActiveModal]   = useState(null)
  const [selectedTask, setSelectedTask] = useState(null)

  // Close mobile sidebar on Escape key
  useEffect(() => {
    if (!isMobileSidebarOpen) return
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setIsMobileSidebarOpen(false)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isMobileSidebarOpen])

  // Lock body scroll when mobile sidebar drawer is open
  useEffect(() => {
    if (isMobileSidebarOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isMobileSidebarOpen])

  // Auto-open task if navigated from Global Search
  useEffect(() => {
    if (location.state?.openTaskId && tasks.length > 0) {
      const target = tasks.find(t => t.id === location.state.openTaskId)
      if (target) setSelectedTask(target)
    }
  }, [location.state, tasks])

  const [userLists, setUserLists] = useState([])
  const [userTags, setUserTags]   = useState([])
  const [isEditingLists, setIsEditingLists] = useState(false)
  const [isEditingTags, setIsEditingTags]   = useState(false)

  const [groupBy, setGroupBy]           = useState('none')
  const [sortBy, setSortBy]             = useState('none')
  const [viewMode, setViewMode]         = useState('list')
  const [showCompleted, setShowCompleted] = useState(true)
  const [showTrash, setShowTrash]       = useState(false)
  const [showDetails, setShowDetails]   = useState(false)

  const [selectedIds, setSelectedIds]   = useState([])
  const [selectionMode, setSelectionMode] = useState(false)

  const groupDropdown  = useDropdown()
  const moreDropdown   = useDropdown()

  /* ── Fetch tasks, lists & tags from API ── */
  const fetchTasks = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const [tasksData, listsData, tagsData] = await Promise.all([
        tasksService.getTasks({ trash: 'all' }),
        tasksService.getLists().catch(() => []),
        tasksService.getTags().catch(() => []),
      ])
      setTasks(tasksData)
      if (listsData?.length > 0) {
        setUserLists(prev => {
          const map = new Map()
          prev.forEach(l => {
            const n = typeof l === 'string' ? l : l.name
            map.set(n, typeof l === 'string' ? { name: n, default_view: 'list', accent_color: '#10B981', color: '#10B981' } : { ...l, default_view: l.default_view || l.defaultView || 'list', accent_color: l.accent_color || l.accentColor || l.color || '#10B981', color: l.accent_color || l.accentColor || l.color || '#10B981' })
          })
          listsData.forEach(l => {
            const n = typeof l === 'string' ? l : l.name
            const defView = (typeof l === 'object' && (l.default_view || l.defaultView)) ? (l.default_view || l.defaultView) : 'list'
            const accentColor = (typeof l === 'object' && (l.accent_color || l.accentColor || l.color)) ? (l.accent_color || l.accentColor || l.color) : '#10B981'
            map.set(n, typeof l === 'string' ? { name: n, default_view: defView, accent_color: accentColor, color: accentColor } : { ...l, default_view: defView, accent_color: accentColor, color: accentColor })
          })
          return Array.from(map.values())
        })
      }
      if (tagsData?.length > 0) {
        setUserTags(prev => {
          const map = new Map()
          prev.forEach(t => {
            const n = typeof t === 'string' ? t : t?.name
            if (n) map.set(n, typeof t === 'string' ? { name: n, color: getTagColor(n).color } : t)
          })
          tagsData.forEach(t => {
            const n = typeof t === 'string' ? t : t?.name
            if (n) {
              const c = (typeof t === 'object' && t?.color) ? t.color : getTagColor(n).color
              map.set(n, typeof t === 'string' ? { name: n, color: c } : { ...t, color: c })
            }
          })
          return Array.from(map.values())
        })
      }
    } catch (err) {
      console.error('[Tasks] Error fetching tasks:', err)
      setError('Could not load tasks. Check your connection.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchTasks() }, [fetchTasks])

  /* ── Toggle (optimistic) ── */
  const toggle = useCallback(async (id) => {
    const prev = tasks.find(t => t.id === id)
    if (!prev) return
    const newDone = !(prev.is_completed ?? prev.done)
    setTasks(ts => ts.map(t => t.id === id ? { ...t, done: newDone, is_completed: newDone } : t))
    if (selectedTask?.id === id) setSelectedTask(s => ({ ...s, done: newDone, is_completed: newDone }))
    const taskTitle = prev.title || prev.text || ''
    if (newDone) toastSuccess('Task done! ✓', taskTitle.length > 40 ? taskTitle.slice(0, 40) + '…' : taskTitle)
    try {
      await tasksService.toggleTask(id)
      if (newDone && prev.recurrence && typeof prev.recurrence === 'object' && prev.recurrence.freq) fetchTasks()
    } catch {
      setTasks(ts => ts.map(t => t.id === id ? prev : t))
      if (selectedTask?.id === id) setSelectedTask(prev)
      toastError('Failed to update task')
    }
  }, [tasks, selectedTask, toastSuccess, toastError, fetchTasks])

  /* ── Update task (optimistic) ── */
  const updateTask = useCallback(async (id, patch) => {
    const prev = tasks.find(t => t.id === id)
    if (!prev) return
    setTasks(ts => ts.map(t => t.id === id ? { ...t, ...patch } : t))
    if (selectedTask?.id === id) setSelectedTask(s => ({ ...s, ...patch }))
    try {
      const updated = await tasksService.updateTask(id, patch)
      setTasks(ts => ts.map(t => t.id === id ? { ...t, ...updated } : t))
      if (selectedTask?.id === id) setSelectedTask(s => ({ ...s, ...updated }))
    } catch {
      setTasks(ts => ts.map(t => t.id === id ? prev : t))
      if (selectedTask?.id === id) setSelectedTask(prev)
      toastError('Failed to save task changes')
    }
  }, [tasks, selectedTask, toastError])

  /* ── Delete Task ── */
  const deleteTask = useCallback(async (id, permanent = false) => {
    const target = tasks.find(t => t.id === id)
    if (!target) return
    const isAlreadyTrashed = target.in_trash || target.inTrash
    if (isAlreadyTrashed || permanent) {
      if (!window.confirm('Permanently delete this task?')) return
      setTasks(ts => ts.filter(t => t.id !== id))
      if (selectedTask?.id === id) setSelectedTask(null)
      try {
        await tasksService.deleteTask(id, true)
        toastSuccess('Task permanently deleted')
      } catch {
        fetchTasks()
        toastError('Failed to delete task')
      }
    } else {
      setTasks(ts => ts.map(t => t.id === id ? { ...t, in_trash: true, inTrash: true } : t))
      if (selectedTask?.id === id) setSelectedTask(null)
      toastSuccess('Task moved to Trash')
      try {
        await tasksService.deleteTask(id, false)
      } catch {
        setTasks(ts => ts.map(t => t.id === id ? { ...t, in_trash: false, inTrash: false } : t))
        toastError('Failed to move task to trash')
      }
    }
  }, [tasks, selectedTask, fetchTasks, toastSuccess, toastError])

  /* ── Restore Task ── */
  const restoreTask = useCallback(async (id) => {
    setTasks(ts => ts.map(t => t.id === id ? { ...t, in_trash: false, inTrash: false } : t))
    toastSuccess('Task restored')
    try {
      await tasksService.restoreTask(id)
    } catch {
      setTasks(ts => ts.map(t => t.id === id ? { ...t, in_trash: true, inTrash: true } : t))
      toastError('Failed to restore task')
    }
  }, [toastSuccess, toastError])

  /* ── Delete List ── */
  const handleDeleteList = useCallback(async (listIdentifier, e) => {
    if (e) e.stopPropagation()
    const targetObj = typeof listIdentifier === 'object' ? listIdentifier : userLists.find(l => (typeof l === 'object' ? (l.id === listIdentifier || l.name === listIdentifier) : l === listIdentifier))
    const listId = typeof listIdentifier === 'object' ? (listIdentifier.id ?? listIdentifier.name) : (targetObj && typeof targetObj === 'object' ? (targetObj.id ?? targetObj.name) : listIdentifier)
    const listName = typeof listIdentifier === 'object' ? listIdentifier.name : (targetObj && typeof targetObj === 'object' ? targetObj.name : listIdentifier)

    if (!window.confirm(t('tasks.confirmDeleteList', { name: listName, defaultValue: `Are you sure you want to delete list "${listName}"?` }))) return

    setUserLists(prev => prev.filter(l => {
      const n = typeof l === 'string' ? l : l.name
      const id = typeof l === 'object' ? l.id : null
      return n !== listName && id !== listId
    }))
    if (activeList === listName || activeList === listId) setActiveList(null)
    toastSuccess(t('tasks.listDeleted', { name: listName, defaultValue: `List "${listName}" deleted` }))
    try {
      await tasksService.deleteList(listId)
    } catch (err) {
      console.error('[Tasks] Error deleting list:', err)
      toastError('Failed to delete list from server')
      fetchTasks()
    }
  }, [userLists, activeList, fetchTasks, toastSuccess, toastError, t])

  /* ── Delete Tag ── */
  const handleDeleteTag = useCallback(async (tagIdentifier, e) => {
    if (e) e.stopPropagation()
    const tagName = typeof tagIdentifier === 'object' ? tagIdentifier.name : String(tagIdentifier)
    const tagId = typeof tagIdentifier === 'object' && tagIdentifier.id ? tagIdentifier.id : tagName

    if (!window.confirm(t('tasks.confirmDeleteTag', { name: tagName, defaultValue: `Are you sure you want to delete tag "#${tagName}"?` }))) return

    setUserTags(prev => prev.filter(t => {
      const n = typeof t === 'string' ? t : t?.name
      const id = typeof t === 'object' ? t?.id : null
      return n !== tagName && id !== tagId
    }))
    if (activeTag === tagName || activeTag === tagId) setActiveTag(null)
    toastSuccess(t('tasks.tagDeleted', { name: tagName, defaultValue: `Tag "#${tagName}" deleted` }))
    try {
      await tasksService.deleteTag(tagId)
    } catch (err) {
      console.error('[Tasks] Error deleting tag:', err)
      toastError('Failed to delete tag from server')
      fetchTasks()
    }
  }, [activeTag, fetchTasks, toastSuccess, toastError, t])

  /* ── Quick Add ── */
  const handleQuickCreate = useCallback(async (data) => {
    const optimistic = {
      id: `tmp-${Date.now()}`,
      ...data,
      done: false,
      is_completed: false,
      dueToday: data.due_date === getTodayISO()
    }
    setTasks(ts => [optimistic, ...ts])
    try {
      const created = await tasksService.createTask(data)
      setTasks(ts => ts.map(t => t.id === optimistic.id ? created : t))
      const label = data.title || data.text || ''
      toastSuccess('Task created', label.length > 40 ? label.slice(0, 40) + '…' : label)
    } catch {
      setTasks(ts => ts.filter(t => t.id !== optimistic.id))
      toastError('Failed to create task')
    }
  }, [toastSuccess, toastError])

  /* ── Batch actions ── */
  const clearSelection = () => { setSelectedIds([]); setSelectionMode(false) }

  const batchComplete = useCallback(async (done) => {
    setTasks(ts => ts.map(t => selectedIds.includes(t.id) ? { ...t, done, is_completed: done } : t))
    toastSuccess(`${selectedIds.length} tasks ${done ? 'completed' : 'marked active'}`)
    try {
      await tasksService.batchComplete(selectedIds, done)
    } catch {
      await Promise.all(selectedIds.map(id => tasksService.updateTask(id, { is_completed: done }).catch(() => {})))
    }
    clearSelection()
  }, [selectedIds, toastSuccess])

  const batchTrash = useCallback(async () => {
    setTasks(ts => ts.map(t => selectedIds.includes(t.id) ? { ...t, in_trash: true, inTrash: true } : t))
    toastSuccess(`${selectedIds.length} tasks moved to trash`)
    try {
      await tasksService.batchTrash(selectedIds, true)
    } catch {
      await Promise.all(selectedIds.map(id => tasksService.deleteTask(id, false).catch(() => {})))
    }
    clearSelection()
  }, [selectedIds, toastSuccess])

  const batchPriority = useCallback(async (priority) => {
    setTasks(ts => ts.map(t => selectedIds.includes(t.id) ? { ...t, priority } : t))
    toastSuccess(`Priority set to ${priority} for ${selectedIds.length} tasks`)
    await Promise.all(selectedIds.map(id => tasksService.updateTask(id, { priority }).catch(() => {})))
    clearSelection()
  }, [selectedIds, toastSuccess])

  const batchReschedule = useCallback(async (due_date) => {
    const dueToday = due_date === getTodayISO()
    setTasks(ts => ts.map(t => selectedIds.includes(t.id) ? { ...t, due_date, dueDate: due_date, dueToday } : t))
    toastSuccess(`${selectedIds.length} tasks rescheduled`)
    await Promise.all(selectedIds.map(id => tasksService.updateTask(id, { due_date }).catch(() => {})))
    clearSelection()
  }, [selectedIds, toastSuccess])

  const batchMove = useCallback(async (list) => {
    setTasks(ts => ts.map(t => selectedIds.includes(t.id) ? { ...t, list, list_name: list } : t))
    toastSuccess(`${selectedIds.length} tasks moved to ${list}`)
    await Promise.all(selectedIds.map(id => tasksService.updateTask(id, { list }).catch(() => {})))
    clearSelection()
  }, [selectedIds, toastSuccess])

  /* ── Kanban DnD move ── */
  const handleKanbanMove = useCallback(async (taskId, colKey, gBy) => {
    const patch = {}
    if (gBy === 'priority') patch.priority = colKey
    else if (gBy === 'list')  { patch.list = colKey; patch.list_name = colKey }
    else if (gBy === 'tag')   patch.tag = colKey
    else if (gBy === 'date')  {
      if (colKey === 'today') { const d = getTodayISO(); patch.due_date = d; patch.dueDate = d; patch.dueToday = true }
    }
    if (Object.keys(patch).length > 0) updateTask(taskId, patch)
  }, [updateTask])

  /* ── Selection helpers ── */
  const toggleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  /* ── Derived ── */
  const activeTasks = tasks.filter(t => !(t.in_trash || t.inTrash))
  const allTagNames = [...new Set([
    ...(Array.isArray(userTags) ? userTags : []).map(t => typeof t === 'string' ? t : t?.name || ''),
    ...(Array.isArray(tasks) ? tasks : []).map(t => t?.tag)
  ].filter(Boolean))]

  const allTags = allTagNames.map(tagName => {
    const userTagObj = Array.isArray(userTags)
      ? userTags.find(t => (typeof t === 'string' ? t : t?.name) === tagName)
      : null
    const color = (userTagObj && typeof userTagObj === 'object' && userTagObj.color)
      ? userTagObj.color
      : getTagColor(tagName).color
    const id = (userTagObj && typeof userTagObj === 'object' && userTagObj.id)
      ? userTagObj.id
      : tagName
    return { id, name: tagName, color }
  })

  /* ── Filter + sort + group pipeline ── */
  const svFilter = SMART_VIEWS.find(v => v.key === smartView)?.filter ?? (() => true)

  // Scope tasks to the current view (smart view, list, tag)
  const scopedTasks = tasks
    .filter(t => showTrash ? (t.in_trash || t.inTrash) : !(t.in_trash || t.inTrash))
    .filter(svFilter)
    .filter(t => !activeList || t.list === activeList || t.list_name === activeList)
    .filter(t => !activeTag || t.tag === activeTag)

  const scopedDone = scopedTasks.filter(t => t.done).length
  const scopedTotal = scopedTasks.length
  const pct = scopedTotal > 0 ? Math.round((scopedDone / scopedTotal) * 100) : 0

  const filtered = scopedTasks
    .filter(t => showCompleted ? true : !t.done)

  const sorted  = sortTasks(filtered, sortBy)
  const grouped = groupTasks(sorted, groupBy, t)

  const hasGroupSort    = groupBy !== 'none' || sortBy !== 'none'
  const hasMoreActive   = !showCompleted || showTrash || showDetails

  // Keep drawer in sync when tasks change
  useEffect(() => {
    if (selectedTask) {
      const updated = tasks.find(t => t.id === selectedTask.id)
      if (updated) setSelectedTask(updated)
    }
  }, [tasks])

  /* ── Sidebar Content (shared between Desktop & Mobile Off-canvas Drawer) ── */
  const renderSidebarContent = (isMobile = false) => (
    <div className="tasks-sidebar-panel" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* 1. Progress & Summary Card */}
      <div className="bg-gray-50 dark:bg-zinc-900/50 border border-gray-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm dark:shadow-none">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <span className="text-xs font-bold text-gray-900 dark:text-white">
            {t('tasks.todayProgress', 'Progress')}
          </span>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-primary)' }}>
            {pct}%
          </span>
        </div>
        <div className="bg-gray-200 dark:bg-zinc-800" style={{ height: 6, width: '100%', borderRadius: 3, overflow: 'hidden', marginBottom: 14 }}>
          <div style={{ height: '100%', width: `${pct}%`, background: 'var(--color-primary)', borderRadius: 3, transition: 'width 300ms ease' }} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, textAlign: 'center' }}>
          <div className="p-2 bg-white dark:bg-zinc-800/50 border border-gray-100 dark:border-zinc-700 rounded-xl">
            <div className="text-base font-extrabold text-gray-900 dark:text-white">{activeTasks.filter(t => !t.done).length}</div>
            <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">{t('tasks.pending', 'Pending')}</div>
          </div>
          <div className="p-2 bg-white dark:bg-zinc-800/50 border border-gray-100 dark:border-zinc-700 rounded-xl">
            <div className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">{activeTasks.filter(t => t.done).length}</div>
            <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">{t('tasks.done', 'Done')}</div>
          </div>
          <div className="p-2 bg-white dark:bg-zinc-800/50 border border-gray-100 dark:border-zinc-700 rounded-xl">
            <div className="text-base font-extrabold text-rose-500">{activeTasks.filter(t => !t.done && t.due_date && t.due_date < getTodayISO()).length}</div>
            <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">{t('tasks.overdue', 'Overdue')}</div>
          </div>
        </div>
      </div>

      {/* 2. Smart Views Card */}
      <div className="bg-gray-50 dark:bg-zinc-900/50 border border-gray-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm dark:shadow-none">
        <div className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
          {t('tasks.views', 'Views')}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {SMART_VIEWS.map(v => {
            const isActive = smartView === v.key && !showTrash
            const count = tasks.filter(t => !(t.in_trash || t.inTrash)).filter(v.filter).length
            return (
              <button
                key={v.key}
                type="button"
                onClick={() => {
                  setSmartView(v.key)
                  setShowTrash(false)
                  if (isMobile) setIsMobileSidebarOpen(false)
                }}
                className={`flex items-center justify-between p-2 rounded-lg text-xs font-semibold transition-colors ${
                  isActive
                    ? 'bg-white dark:bg-zinc-800/50 border border-gray-100 dark:border-zinc-700 text-gray-900 dark:text-white shadow-sm'
                    : 'bg-transparent text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg'
                }`}
                style={{
                  background: isActive ? undefined : 'transparent',
                  border: isActive ? undefined : 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ display: 'flex', color: isActive ? 'var(--color-primary)' : 'inherit', opacity: isActive ? 1 : 0.7 }}>{v.icon}</span>
                  <span style={{ color: isActive ? 'var(--color-primary)' : 'inherit' }}>
                    {v.key === 'today' ? t('tasks.smartToday') : v.key === 'next7' ? t('tasks.smartNext7') : t('tasks.smartAll')}
                  </span>
                </div>
                <span
                  className="text-[11px] px-2 py-0.5 rounded-full font-semibold"
                  style={{
                    background: isActive ? 'var(--color-primary-subtle, rgba(59,130,246,0.15))' : 'var(--color-surface-3)',
                    color: isActive ? 'var(--color-primary)' : 'var(--color-text-muted)',
                  }}
                >
                  {count}
                </span>
              </button>
            )
          })}

          {/* Trash option */}
          <button
            type="button"
            onClick={() => {
              setShowTrash(s => !s)
              if (isMobile) setIsMobileSidebarOpen(false)
            }}
            className={`flex items-center justify-between p-2 rounded-lg text-xs font-semibold transition-colors ${
              showTrash
                ? 'bg-white dark:bg-zinc-800/50 border border-gray-100 dark:border-zinc-700 text-rose-500 shadow-sm'
                : 'bg-transparent text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg'
            }`}
            style={{
              background: showTrash ? undefined : 'transparent',
              border: showTrash ? undefined : 'none',
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ opacity: 0.6 }}>
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
              <span>{t('tasks.trash', 'Trash')}</span>
            </div>
            <span
              className="text-[11px] px-2 py-0.5 rounded-full font-semibold"
              style={{
                background: showTrash ? 'rgba(244, 63, 94, 0.15)' : 'var(--color-surface-3)',
                color: showTrash ? '#F43F5E' : 'var(--color-text-muted)',
              }}
            >
              {tasks.filter(t => t.in_trash || t.inTrash).length}
            </span>
          </button>
        </div>
      </div>

      {/* 3. Lists Card */}
      <div className="bg-gray-50 dark:bg-zinc-900/50 border border-gray-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm dark:shadow-none">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            {t('tasks.lists', 'Lists')}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {userLists.length > 0 && (
              <button
                type="button"
                onClick={() => setIsEditingLists(prev => !prev)}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white rounded p-1 transition-colors"
                style={{
                  background: isEditingLists ? 'var(--color-primary-subtle, rgba(59, 130, 246, 0.15))' : 'none',
                  border: 'none',
                  color: isEditingLists ? 'var(--color-primary)' : undefined,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                title={isEditingLists ? t('common.done', 'Done') : t('tasks.editLists', 'Manage Lists')}
                aria-label={t('tasks.editLists', 'Manage Lists')}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                </svg>
              </button>
            )}
            <button
              type="button"
              onClick={() => setActiveModal('list')}
              className="hover:opacity-80 p-0.5"
              style={{ background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', fontSize: 16, lineHeight: 1 }}
              title={t('tasks.createList', 'Create List')}
              aria-label={t('tasks.createList', 'Create List')}
            >
              +
            </button>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <button
            type="button"
            onClick={() => {
              setActiveList(null)
              if (isMobile) setIsMobileSidebarOpen(false)
            }}
            className={`flex items-center justify-between p-2 rounded-lg text-xs font-semibold transition-colors ${
              activeList === null
                ? 'bg-white dark:bg-zinc-800/50 border border-gray-100 dark:border-zinc-700 text-gray-900 dark:text-white shadow-sm'
                : 'bg-transparent text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg'
            }`}
            style={{
              background: activeList === null ? undefined : 'transparent',
              border: activeList === null ? undefined : 'none',
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            <span style={{ color: activeList === null ? 'var(--color-primary)' : 'inherit' }}>
              {t('tasks.allLists', 'All Lists')}
            </span>
            <span className="text-[11px] text-gray-500 dark:text-gray-400">{activeTasks.length}</span>
          </button>
          {userLists.map(lObj => {
            const listName = typeof lObj === 'string' ? lObj : lObj.name
            const listAccentColor = (typeof lObj === 'object' && (lObj.accent_color || lObj.accentColor || lObj.color)) ? (lObj.accent_color || lObj.accentColor || lObj.color) : '#10B981'
            const defaultView = (typeof lObj === 'object' && (lObj.default_view || lObj.defaultView)) ? (lObj.default_view || lObj.defaultView) : 'list'
            const count = activeTasks.filter(t => t.list === listName || t.list_name === listName).length
            const isActive = activeList === listName
            return (
              <div
                key={listName}
                role="button"
                tabIndex={0}
                onClick={() => {
                  if (isActive) {
                    setActiveList(null)
                  } else {
                    setActiveList(listName)
                    if (defaultView && ['list', 'kanban', 'timeline'].includes(defaultView)) {
                      setViewMode(defaultView)
                    }
                  }
                  if (isMobile && !isEditingLists) setIsMobileSidebarOpen(false)
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    if (isActive) {
                      setActiveList(null)
                    } else {
                      setActiveList(listName)
                      if (defaultView && ['list', 'kanban', 'timeline'].includes(defaultView)) {
                        setViewMode(defaultView)
                      }
                    }
                    if (isMobile && !isEditingLists) setIsMobileSidebarOpen(false)
                  }
                }}
                className={`flex items-center justify-between p-2 rounded-lg text-xs font-semibold transition-colors ${
                  isActive
                    ? 'bg-white dark:bg-zinc-800/50 border border-gray-100 dark:border-zinc-700 text-gray-900 dark:text-white shadow-sm'
                    : 'bg-transparent text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg'
                }`}
                style={{
                  background: isActive ? undefined : 'transparent',
                  border: isActive ? undefined : 'none',
                  cursor: 'pointer',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, flex: 1 }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: listAccentColor, flexShrink: 0 }}>
                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                  </svg>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: isActive ? 'var(--color-primary)' : 'inherit' }}>
                    {listName}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span className="text-[11px] text-gray-500 dark:text-gray-400">{count}</span>
                  {isEditingLists && (
                    <button
                      type="button"
                      onClick={(e) => handleDeleteList(lObj, e)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#F43F5E',
                        cursor: 'pointer',
                        padding: '2px 4px',
                        borderRadius: 4,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        lineHeight: 1,
                      }}
                      title={`Delete ${listName}`}
                      aria-label={`Delete ${listName}`}
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* 4. Tags Card */}
      <div className="bg-gray-50 dark:bg-zinc-900/50 border border-gray-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm dark:shadow-none">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            {t('tasks.tags', 'Tags')}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {allTags.length > 0 && (
              <button
                type="button"
                onClick={() => setIsEditingTags(prev => !prev)}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white rounded p-1 transition-colors"
                style={{
                  background: isEditingTags ? 'var(--color-primary-subtle, rgba(59, 130, 246, 0.15))' : 'none',
                  border: 'none',
                  color: isEditingTags ? 'var(--color-primary)' : undefined,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                title={isEditingTags ? t('common.done', 'Done') : t('tasks.editTags', 'Manage Tags')}
                aria-label={t('tasks.editTags', 'Manage Tags')}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                </svg>
              </button>
            )}
            <button
              type="button"
              onClick={() => setActiveModal('tag')}
              className="hover:opacity-80 p-0.5"
              style={{ background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', fontSize: 16, lineHeight: 1 }}
              title={t('tasks.createTag', 'Create Tag')}
              aria-label={t('tasks.createTag', 'Create Tag')}
            >
              +
            </button>
          </div>
        </div>
        {allTags.length === 0 ? (
          <div className="text-xs text-gray-500 dark:text-gray-400 italic">
            {t('tasks.noTagsYet', 'No tags yet')}
          </div>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {allTags.map(tag => {
              const tagName = typeof tag === 'object' ? tag.name : tag
              const rawColor = (typeof tag === 'object' && tag.color) ? tag.color : (getTagColor(tagName)?.color || '#10B981')
              const tagColor = (rawColor && rawColor.startsWith('#')) ? rawColor.slice(0, 7) : (rawColor || '#10B981')
              const isActive = activeTag === tagName
              return (
                <span
                  key={tagName}
                  role="button"
                  tabIndex={0}
                  onClick={() => {
                    setActiveTag(isActive ? null : tagName)
                    if (isMobile && !isEditingTags) setIsMobileSidebarOpen(false)
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      setActiveTag(isActive ? null : tagName)
                      if (isMobile && !isEditingTags) setIsMobileSidebarOpen(false)
                    }
                  }}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all cursor-pointer hover:brightness-125"
                  style={{
                    backgroundColor: isActive ? (tagColor + '33') : (tagColor + '1A'),
                    borderColor: isActive ? tagColor : (tagColor + '33'),
                    color: tagColor
                  }}
                >
                  <span 
                    className="w-1.5 h-1.5 rounded-full shrink-0" 
                    style={{ backgroundColor: tagColor }} 
                  />
                  #{tagName}
                  {isEditingTags && (
                    <button
                      type="button"
                      onClick={(e) => handleDeleteTag(tag, e)}
                      className="ml-1 p-0.5 text-rose-500 hover:text-rose-600 dark:text-rose-400 inline-flex items-center justify-center"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', lineHeight: 1 }}
                      title={`Delete #${tagName}`}
                      aria-label={`Delete #${tagName}`}
                    >
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  )}
                </span>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )

  /* ─────────────────────────────────────────────────────────── */
  return (
    <div className={`page tasks-page page--layout ${selectedTask ? 'tasks-page--drawer-open' : ''}`}>

      {/* ── Error ── */}
      {error && <ErrorBanner message={error} onRetry={fetchTasks} />}

      <PageLayout
        sidebarClassName="tasks-desktop-sidebar hidden lg:block"
        header={
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', minWidth: 0 }}>
            {/* ── Quick Add Bar ── */}
            <QuickAddBar
              activeList={activeList}
              userLists={userLists}
              userTags={allTagNames}
              onCreate={handleQuickCreate}
            />
          </div>
        }
        sidebar={
          <div className="tasks-sidebar-panel hidden lg:flex lg:flex-col lg:gap-4" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {renderSidebarContent(false)}
          </div>
        }
      >

      {/* ── Toolbar ── */}
      <div className="tasks-toolbar">
        <div className="tasks-toolbar-info">
          <span>{filtered.length === 1 ? t('tasks.countSummary', { count: filtered.length }) : t('tasks.countSummaryPlural', { count: filtered.length })}</span>
          {scopedTotal > 0 && (
            <span className="tasks-toolbar-hint">{t('tasks.completedSummary', { done: scopedDone, total: scopedTotal })}</span>
          )}
          {hasGroupSort && (
            <span className="tasks-toolbar-hint">
              {[groupBy !== 'none' && t('tasks.groupedBy', { group: groupBy }), sortBy !== 'none' && t('tasks.sortedBy', { sort: sortBy })].filter(Boolean).join(' · ')}
            </span>
          )}
        </div>

        <div className="tasks-toolbar-actions">

          {/* Multi-select toggle */}
          <motion.button
            id="tasks-select-btn"
            whileTap={{ scale: 0.96 }}
            className={`tasks-toolbar-btn ${selectionMode ? 'tasks-toolbar-btn--active' : ''}`}
            onClick={() => { setSelectionMode(s => !s); setSelectedIds([]) }}
            title={t('tasks.multiSelectMode')}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <polyline points="9,11 12,14 22,4" /><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
            </svg>
            <span className="tasks-toolbar-btn-text">{t('tasks.select')}</span>
          </motion.button>

          {/* View mode buttons */}
          <div className="tasks-view-mode-btns">
            {VIEW_OPTIONS.map(v => (
              <motion.button
                key={v.key}
                id={`tasks-view-${v.key}`}
                whileTap={{ scale: 0.96 }}
                className={`tasks-toolbar-btn ${viewMode === v.key ? 'tasks-toolbar-btn--active' : ''}`}
                onClick={() => setViewMode(v.key)}
                title={v.key === 'list' ? t('tasks.viewList') : v.key === 'kanban' ? t('tasks.viewKanban') : t('tasks.viewTimeline')}
              >
                {v.icon}
              </motion.button>
            ))}
          </div>

          {/* Mobile Sidebar Toggle Button (visible on mobile only) */}
          <motion.button
            id="tasks-mobile-sidebar-toggle-btn"
            whileTap={{ scale: 0.96 }}
            className="tasks-toolbar-btn tasks-mobile-sidebar-toggle block lg:hidden"
            onClick={() => setIsMobileSidebarOpen(true)}
            title={t('tasks.viewsAndFilters', 'Views & Lists')}
            aria-label={t('tasks.viewsAndFilters', 'Views & Lists')}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
            <span className="tasks-toolbar-btn-text">{t('tasks.views', 'Views')}</span>
            {(activeList || activeTag || smartView !== 'all') && (
              <span className="tasks-filter-badge">●</span>
            )}
          </motion.button>

          {/* Group & Sort */}
          <div className="tasks-dropdown-root" ref={groupDropdown.ref}>
            <motion.button
              id="tasks-group-sort-btn"
              whileTap={{ scale: 0.98 }}
              className={`tasks-toolbar-btn ${hasGroupSort ? 'tasks-toolbar-btn--active' : ''}`}
              onClick={() => { groupDropdown.setOpen(o => !o); moreDropdown.setOpen(false) }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6" /><line x1="6" y1="12" x2="18" y2="12" /><line x1="9" y1="18" x2="15" y2="18" /></svg>
              <span className="tasks-toolbar-btn-text">{t('tasks.groupAndSort')}</span> <IconChevronDown />
            </motion.button>
            {groupDropdown.open && (
              <div className="tasks-dropdown">
                <div className="tasks-dropdown-section-label">{t('tasks.groupBy')}</div>
                {GROUP_OPTIONS.map(opt => (
                  <button key={opt} className="tasks-dropdown-item" onClick={() => setGroupBy(opt)}>
                    <span className="tasks-dropdown-item-check">{groupBy === opt && <IconCheck />}</span>
                    {opt.charAt(0).toUpperCase() + opt.slice(1)}
                  </button>
                ))}
                <div className="tasks-dropdown-divider" />
                <div className="tasks-dropdown-section-label">{t('tasks.sortBy')}</div>
                {SORT_OPTIONS.map(opt => (
                  <button key={opt} className="tasks-dropdown-item" onClick={() => setSortBy(opt)}>
                    <span className="tasks-dropdown-item-check">{sortBy === opt && <IconCheck />}</span>
                    {opt.charAt(0).toUpperCase() + opt.slice(1)}
                  </button>
                ))}
                {hasGroupSort && (
                  <><div className="tasks-dropdown-divider" /><button className="tasks-dropdown-item tasks-dropdown-item--danger" onClick={() => { setGroupBy('none'); setSortBy('none') }}><span className="tasks-dropdown-item-check" /> {t('tasks.resetAll')}</button></>
                )}
              </div>
            )}
          </div>

          {/* More */}
          <div className="tasks-dropdown-root" ref={moreDropdown.ref}>
            <motion.button
              id="tasks-more-btn"
              whileTap={{ scale: 0.96 }}
              className={`tasks-toolbar-btn ${hasMoreActive ? 'tasks-toolbar-btn--active' : ''}`}
              onClick={() => { moreDropdown.setOpen(o => !o); groupDropdown.setOpen(false) }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="5" r="1" fill="currentColor" /><circle cx="12" cy="12" r="1" fill="currentColor" /><circle cx="12" cy="19" r="1" fill="currentColor" /></svg>
              <span className="tasks-toolbar-btn-text">{t('tasks.more')}</span> <IconChevronDown />
            </motion.button>
            {moreDropdown.open && (
              <div className="tasks-dropdown tasks-dropdown--right">
                <button className="tasks-dropdown-item" onClick={() => setShowDetails(s => !s)}>
                  <span className="tasks-dropdown-item-check">{showDetails && <IconCheck />}</span>
                  {showDetails ? t('tasks.hideDetails') : t('tasks.showDetails')}
                </button>
                <button className="tasks-dropdown-item" onClick={() => setShowCompleted(s => !s)}>
                  <span className="tasks-dropdown-item-check">{showCompleted && <IconCheck />}</span>
                  {showCompleted ? t('tasks.hideCompleted') : t('tasks.showCompleted')}
                </button>
                <button className="tasks-dropdown-item" onClick={() => setShowTrash(s => !s)}>
                  <span className="tasks-dropdown-item-check">{showTrash && <IconCheck />}</span>
                  {showTrash ? t('tasks.hideTrash') : t('tasks.showTrash')}
                </button>
                <div className="tasks-dropdown-divider" />
                <button className="tasks-dropdown-item" onClick={() => window.print()}>
                  <span className="tasks-dropdown-item-check" />
                  <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="6,9 6,2 18,2 18,9" /><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2" /><rect x="6" y="14" width="12" height="8" /></svg>
                    {t('tasks.print')}
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Modals ── */}
      {activeModal === 'list' && (
        <ListFormModal
          onClose={() => setActiveModal(null)}
          onSave={async (data) => {
            const res = await tasksService.createList(data)
            const accentColor = res?.accent_color || res?.accentColor || res?.color || data.accent_color || data.accentColor || data.color || '#10B981'
            const defView = res?.default_view || res?.defaultView || data.default_view || data.defaultView || 'list'
            const newObj = {
              id: res?.id,
              name: res?.name || data.name,
              default_view: defView,
              accent_color: accentColor,
              color: accentColor,
              icon: res?.icon || data.icon || '📋',
            }
            setUserLists(prev => { const f = prev.filter(l => (typeof l === 'string' ? l : l.name) !== newObj.name); return [...f, newObj] })
            setActiveModal(null); toastSuccess('List created', newObj.name)
          }}
        />
      )}
      {activeModal === 'tag' && (
        <TagFormModal
          onClose={() => setActiveModal(null)}
          onSave={async (data) => {
            try {
              const res = await tasksService.createTag(data)
              const newTag = {
                id: res?.id,
                name: res?.name || data.name,
                color: res?.color || data.color || '#10B981',
              }
              setUserTags(prev => {
                const filtered = prev.filter(t => (typeof t === 'string' ? t : t?.name) !== newTag.name)
                return [...filtered, newTag]
              })
              setActiveModal(null)
              toastSuccess('Tag created', `#${newTag.name}`)
            } catch (err) {
              console.error('[Tasks] Error creating tag:', err)
              const newTag = {
                name: data.name,
                color: data.color || '#10B981',
              }
              setUserTags(prev => {
                const filtered = prev.filter(t => (typeof t === 'string' ? t : t?.name) !== newTag.name)
                return [...filtered, newTag]
              })
              setActiveModal(null)
              toastSuccess('Tag created', `#${newTag.name}`)
            }
          }}
        />
      )}
      {activeModal === 'task' && (
        <TaskFormModal
          lists={userLists}
          tags={allTagNames.length ? allTagNames : ['General']}
          onClose={() => setActiveModal(null)}
          onSave={async (data) => {
            const created = await tasksService.createTask(data)
            setTasks(ts => [created, ...ts])
            setActiveModal(null); toastSuccess('Task created', data.title || data.text)
          }}
        />
      )}

      {/* ══════════════════════════════════════════════════════════
          LIST VIEW
          ══════════════════════════════════════════════════════════ */}
      {viewMode === 'list' && (
        loading ? <TasksSkeleton /> :
          <div className="tasks-list">
            {filtered.length === 0 && (
              <div className="empty-state">
                <div className="empty-state-icon">✅</div>
                <div className="empty-state-title">{t('tasks.noTasks')}</div>
                <div className="empty-state-sub">{t('tasks.noTasksDesc')}</div>
              </div>
            )}
            {grouped.map(group => (
              <div key={group.key ?? '_all'}>
                {group.label && <GroupHeader label={group.label} count={group.tasks.length} groupBy={groupBy} />}
                {group.tasks.map(task => (
                  <TaskRowEnhanced
                    key={task.id}
                    task={task}
                    userTags={allTags}
                    showDetails={showDetails}
                    groupBy={groupBy}
                    isSelected={selectedIds.includes(task.id)}
                    selectionMode={selectionMode}
                    onToggle={toggle}
                    onOpen={setSelectedTask}
                    onDelete={deleteTask}
                    onRestore={restoreTask}
                    onSelect={toggleSelect}
                    onUpdate={updateTask}
                  />
                ))}
              </div>
            ))}
          </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          KANBAN VIEW — with DnD
          ══════════════════════════════════════════════════════════ */}
      {viewMode === 'kanban' && (
        <div className="tasks-kanban-wrapper">
          <div className={`tasks-kanban ${grouped.length > 3 ? 'tasks-kanban--wide' : ''}`}>
            {grouped.map(group => (
              <KanbanColumn
                key={group.key ?? '_all'}
                group={group}
                groupBy={groupBy}
                userTags={allTags}
                onToggle={toggle}
                onOpen={setSelectedTask}
                onDelete={deleteTask}
                onMoveTask={handleKanbanMove}
              />
            ))}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          TIMELINE VIEW — enhanced grouping
          ══════════════════════════════════════════════════════════ */}
      {viewMode === 'timeline' && (
        <div className="tasks-timeline">
          {filtered.length === 0 && (
            <div className="empty-state">
              <div className="empty-state-icon">📅</div>
              <div className="empty-state-title">{t('tasks.noTasks')}</div>
              <div className="empty-state-sub">{t('tasks.noTasksDesc')}</div>
            </div>
          )}
          {grouped.map(group => (
            <div key={group.key ?? '_all'} className="timeline-group">
              {group.label && (
                <div className="timeline-group-header">
                  <GroupHeader label={group.label} count={group.tasks.length} groupBy={groupBy} />
                </div>
              )}
              <div className="timeline-list">
                {group.tasks.map((task, i) => (
                  <TimelineItem
                    key={task.id}
                    task={task}
                    userTags={allTags}
                    onToggle={toggle}
                    onOpen={setSelectedTask}
                    onDelete={deleteTask}
                    onRestore={restoreTask}
                    isLast={i === group.tasks.length - 1}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
      </PageLayout>

      {/* ── Speed Dial (hidden during batch selection) ── */}
      {selectedIds.length === 0 && (
        <SpeedDial onSelect={(type) => setActiveModal(type)} />
      )}

      {/* ── Batch Action Bar ── */}
      {selectedIds.length > 0 && (
        <BatchActionBar
          selectedIds={selectedIds}
          tasks={tasks}
          userLists={userLists}
          onClose={clearSelection}
          onBatchComplete={batchComplete}
          onBatchTrash={batchTrash}
          onBatchPriority={batchPriority}
          onBatchReschedule={batchReschedule}
          onBatchMove={batchMove}
        />
      )}

      {/* ── Task Detail Drawer ── */}
      {selectedTask && (
        <TaskDetailDrawer
          task={selectedTask}
          tasks={filtered}
          userLists={userLists}
          userTags={allTagNames}
          onClose={() => setSelectedTask(null)}
          onToggle={toggle}
          onUpdate={updateTask}
          onDelete={deleteTask}
          onRestore={restoreTask}
          onNavigate={setSelectedTask}
        />
      )}

      {/* ── Mobile Sidebar Drawer (Off-canvas) ── */}
      <AnimatePresence>
        {isMobileSidebarOpen && (
          <div
            className="tasks-mobile-sidebar-overlay fixed inset-0 z-50 bg-black/50"
            onClick={() => setIsMobileSidebarOpen(false)}
            role="dialog"
            aria-modal="true"
            aria-label={t('tasks.viewsAndFilters', 'Views & Lists')}
          >
            <motion.aside
              initial={{ x: isAr ? '-100%' : '100%' }}
              animate={{ x: 0 }}
              exit={{ x: isAr ? '-100%' : '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              className="tasks-mobile-sidebar-drawer bg-white dark:bg-[#121212] text-gray-900 dark:text-white"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Drawer Header */}
              <div className="tasks-mobile-sidebar-header bg-white dark:bg-[#121212] border-b border-gray-200 dark:border-zinc-800">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-primary)' }}>
                    <line x1="3" y1="12" x2="21" y2="12" />
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <line x1="3" y1="18" x2="21" y2="18" />
                  </svg>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">
                    {t('tasks.viewsAndFilters', 'Views & Lists')}
                  </span>
                </div>
                <button
                  type="button"
                  className="tasks-mobile-sidebar-close-btn text-gray-500 hover:bg-gray-100 dark:hover:bg-zinc-800 dark:text-gray-400 rounded-lg p-2 transition-colors"
                  onClick={() => setIsMobileSidebarOpen(false)}
                  title={t('common.close', 'Close')}
                  aria-label={t('common.close', 'Close')}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>

              {/* Drawer Body */}
              <div className="tasks-mobile-sidebar-body">
                {renderSidebarContent(true)}
              </div>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
