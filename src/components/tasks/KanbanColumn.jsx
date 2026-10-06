import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

const PRIORITY_BAR  = { high: '#F43F5E', medium: '#F59E0B', low: '#3B82F6', none: '#71717a' }
const PRIORITY_KEY  = { high: 'tasks.priorityHigh', medium: 'tasks.priorityMedium', low: 'tasks.priorityLow', none: 'tasks.priorityNone' }

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

export default function KanbanColumn({ group, groupBy, onToggle, onOpen, onDelete, onMoveTask, userTags }) {
  const { t } = useTranslation()
  const { key: colKey, label, tasks } = group
  const [isDragOver, setIsDragOver] = useState(false)
  const [addingCard, setAddingCard] = useState(false)
  const [newCardText, setNewCardText] = useState('')
  const addInputRef = useRef(null)

  const accentColor = groupBy === 'priority'
    ? (PRIORITY_BAR[colKey] || 'var(--color-border)')
    : groupBy === 'tag'
      ? ((Array.isArray(userTags) ? userTags.find(t => (typeof t === 'string' ? t : t?.name)?.toLowerCase() === colKey?.toLowerCase())?.color : null) || getTagColor(colKey)?.color || 'var(--color-border)')
      : 'var(--color-primary)'

  const done = tasks.filter(t => t.done).length
  const total = tasks.length
  const pct = total > 0 ? Math.round((done / total) * 100) : 0

  /* ── Drag handlers ── */
  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragOver(true)
  }
  const handleDragLeave = () => setIsDragOver(false)
  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragOver(false)
    const taskId = e.dataTransfer.getData('text/plain')
    if (taskId && onMoveTask) onMoveTask(taskId, colKey, groupBy)
  }

  const completedFirst = [...tasks].sort((a, b) => (a.done === b.done ? 0 : a.done ? 1 : -1))

  return (
    <div
      className={`kc-col ${isDragOver ? 'kc-col--dragover' : ''}`}
      style={{ '--col-accent': accentColor }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Column header */}
      <div className="kc-header">
        <div className="kc-header-left">
          <span className="kc-accent-dot" />
          <span className="kc-title">{label ?? t('tasks.allTasks')}</span>
          <span className="kc-count">{total}</span>
        </div>
        {total > 0 && (
          <div className="kc-progress-wrap" title={`${pct}% done`}>
            <div className="kc-progress-track">
              <div className="kc-progress-fill" style={{ width: `${pct}%` }} />
            </div>
          </div>
        )}
      </div>

      {/* Cards */}
      <div className="kc-cards">
        {completedFirst.length === 0 && !isDragOver && (
          <div className="kc-empty">{t('tasks.dropTasksHere')}</div>
        )}
        {completedFirst.map(task => (
          <KanbanCard key={task.id} task={task} groupBy={groupBy} onToggle={onToggle} onOpen={onOpen} onDelete={onDelete} userTags={userTags} />
        ))}
        {isDragOver && <div className="kc-drop-indicator" />}
      </div>

      {/* Quick add card */}
      <div className="kc-add-area">
        {addingCard ? (
          <div className="kc-add-input-wrap">
            <input
              ref={addInputRef}
              className="kc-add-input"
              placeholder={t('tasks.taskTitlePlaceholder')}
              value={newCardText}
              autoFocus
              onChange={(e) => setNewCardText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newCardText.trim()) {
                  onOpen({ __quickCreate: true, text: newCardText.trim(), colKey, groupBy })
                  setNewCardText(''); setAddingCard(false)
                }
                if (e.key === 'Escape') { setNewCardText(''); setAddingCard(false) }
              }}
            />
          </div>
        ) : (
          <button className="kc-add-btn" onClick={() => setAddingCard(true)}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            {t('tasks.addCard')}
          </button>
        )}
      </div>
    </div>
  )
}

function KanbanCard({ task, groupBy, onToggle, onOpen, onDelete, userTags }) {
  const { t } = useTranslation()
  const tagColor = task.tag_color || task.tagColor || task.tags?.[0]?.color || (Array.isArray(userTags) ? userTags.find(t => (typeof t === 'string' ? t : t?.name)?.toLowerCase() === task.tag?.toLowerCase())?.color : null) || getTagColor(task.tag).color
  const isTrashed = task.in_trash || task.inTrash
  const subtasks = task.subtasks || []
  const subtasksDone = subtasks.filter(s => s.done).length

  const handleDragStart = (e) => {
    e.dataTransfer.setData('text/plain', String(task.id))
    e.dataTransfer.effectAllowed = 'move'
  }

  return (
    <div
      className={`kc-card ${task.done ? 'kc-card--done' : ''} ${isTrashed ? 'kc-card--trashed' : ''}`}
      draggable
      onDragStart={handleDragStart}
      onClick={() => onOpen(task)}
    >
      {/* Priority strip */}
      <div className="kc-card-strip" style={{ background: PRIORITY_BAR[task.priority] }} />

      <div className="kc-card-body">
        {/* Checkbox + title */}
        <div className="kc-card-top">
          <div
            className={`task-checkbox ${task.done ? 'task-checkbox--checked' : ''}`}
            style={{ width: 16, height: 16, flexShrink: 0 }}
            onClick={e => { e.stopPropagation(); onToggle(task.id) }}
          >
            {task.done && (
              <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round">
                <polyline points="20,6 9,17 4,12" />
              </svg>
            )}
          </div>
          <span className="kc-card-title">{task.text}</span>
        </div>

        {/* Badges row */}
        <div className="kc-card-meta">
          {task.tag && (
            <span
              className="kc-badge inline-flex items-center gap-1"
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
          {groupBy !== 'priority' && (
            <span className="kc-badge" style={{ background: `${PRIORITY_BAR[task.priority]}18`, color: PRIORITY_BAR[task.priority], borderColor: `${PRIORITY_BAR[task.priority]}40` }}>
              {t(PRIORITY_KEY[task.priority] || 'tasks.priorityNone')}
            </span>
          )}
          {subtasks.length > 0 && (
            <span className="kc-badge kc-badge--subtasks">
              {subtasksDone}/{subtasks.length}
            </span>
          )}
          {task.dueToday && <span className="kc-badge kc-badge--due">{t('tasks.todayTag')}</span>}
          {task.due_date && !task.dueToday && new Date(task.due_date) < new Date() && !task.done && (
            <span className="kc-badge kc-badge--overdue">{t('tasks.overdueTag')}</span>
          )}
        </div>
      </div>
    </div>
  )
}
