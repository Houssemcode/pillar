import { useState, useRef, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'

const PRIORITY_OPTIONS = [
  { value: 'high',   label: 'High',   color: '#F43F5E', emoji: '🔴' },
  { value: 'medium', label: 'Medium', color: '#F59E0B', emoji: '🟡' },
  { value: 'low',    label: 'Low',    color: '#3B82F6', emoji: '🔵' },
  { value: 'none',   label: 'None',   color: '#71717a', emoji: '⚫' },
]
const REPEAT_OPTIONS = [
  { value: 'none',    label: 'No repeat' },
  { value: 'daily',   label: 'Daily' },
  { value: 'weekly',  label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
]

function getTodayISO() {
  return new Date().toISOString().split('T')[0]
}
function getTomorrowISO() {
  const d = new Date(); d.setDate(d.getDate() + 1)
  return d.toISOString().split('T')[0]
}
function getNextMondayISO() {
  const d = new Date()
  const day = d.getDay()
  const diff = (day === 0 ? 1 : 8 - day)
  d.setDate(d.getDate() + diff)
  return d.toISOString().split('T')[0]
}

function Popover({ children, onClose, align = 'left' }) {
  const ref = useRef(null)
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose() }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [onClose])
  return (
    <div ref={ref} className={`qab-popover ${align === 'right' ? 'qab-popover--right' : ''}`}>
      {children}
    </div>
  )
}

export default function QuickAddBar({ activeList, userLists = [], userTags = [], onCreate }) {
  const { t } = useTranslation()
  const [text, setText] = useState('')
  const [expanded, setExpanded] = useState(false)
  const [priority, setPriority] = useState('medium')
  const [dueDate, setDueDate] = useState('')
  const [list, setList] = useState(activeList || (userLists[0]?.name ?? userLists[0] ?? 'Personal'))
  const [tag, setTag] = useState(userTags[0] ?? 'General')
  const [recurrence, setRecurrence] = useState('none')

  const [openPop, setOpenPop] = useState(null) // 'priority' | 'date' | 'list' | 'tag' | 'repeat'

  const inputRef = useRef(null)

  // Sync active list from parent
  useEffect(() => {
    if (activeList) setList(activeList)
  }, [activeList])

  const reset = useCallback(() => {
    setText('')
    setPriority('medium')
    setDueDate('')
    setList(activeList || (userLists[0]?.name ?? userLists[0] ?? 'Personal'))
    setTag(userTags[0] ?? 'General')
    setRecurrence('none')
    setOpenPop(null)
  }, [activeList, userLists, userTags])

  const handleSubmit = useCallback(() => {
    const trimmed = text.trim()
    if (!trimmed) { setExpanded(false); return }

    const listObj = typeof list === 'object' && list !== null
      ? list
      : (userLists.find(l => (typeof l === 'object' ? l.name : l) === list) || null)
    const listId = listObj?.id ?? (typeof list === 'number' ? list : null)
    const listNameStr = typeof list === 'string' ? list : (listObj?.name ?? 'Personal')

    onCreate({
      title: trimmed,
      text: trimmed,
      priority: (priority || 'medium').toLowerCase(),
      due_date: dueDate || null,
      list: listId,
      list_name: listNameStr,
      tag: tag || '',
      recurrence: recurrence !== 'none' ? { freq: recurrence, interval: 1, ends: 'never' } : null,
    })
    reset()
    inputRef.current?.focus()
  }, [text, priority, dueDate, list, tag, recurrence, onCreate, reset, userLists])

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); handleSubmit() }
    if (e.key === 'Escape') { setExpanded(false); setOpenPop(null); inputRef.current?.blur() }
  }

  const priorityDef = PRIORITY_OPTIONS.find(p => p.value === priority)
  const listName = typeof list === 'string' ? list : list?.name ?? 'Personal'

  const dueDateLabel = !dueDate ? null
    : dueDate === getTodayISO() ? t('tasks.todayTag')
    : dueDate === getTomorrowISO() ? t('tasks.tomorrowTag')
    : dueDate

  return (
    <div className={`qab-root ${expanded ? 'qab-root--expanded' : ''}`}>
      {/* ── Input Row ── */}
      <div className="qab-input-row">
        <div className="qab-plus-icon">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </div>
        <input
          ref={inputRef}
          className="qab-input"
          placeholder={t('tasks.addTaskTo', { list: listName })}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onFocus={() => setExpanded(true)}
          onKeyDown={handleKeyDown}
        />
        {expanded && text.trim() && (
          <button className="qab-submit-btn" onClick={handleSubmit} title={t('tasks.newTask')}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <polyline points="20,6 9,17 4,12" />
            </svg>
          </button>
        )}
      </div>

      {/* ── Chip Row (shown when expanded) ── */}
      {expanded && (
        <div className="qab-chips-row">

          {/* Priority chip */}
          <div className="qab-chip-wrap">
            <button
              className="qab-chip"
              style={{ color: priorityDef.color }}
              onClick={() => setOpenPop(p => p === 'priority' ? null : 'priority')}
            >
              {priorityDef.emoji} {priorityDef.label}
            </button>
            {openPop === 'priority' && (
              <Popover onClose={() => setOpenPop(null)}>
                {PRIORITY_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    className={`qab-pop-item ${priority === opt.value ? 'qab-pop-item--active' : ''}`}
                    style={{ '--item-color': opt.color }}
                    onClick={() => { setPriority(opt.value); setOpenPop(null) }}
                  >
                    {opt.emoji} {opt.label}
                  </button>
                ))}
              </Popover>
            )}
          </div>

          {/* Due date chip */}
          <div className="qab-chip-wrap">
            <button
              className={`qab-chip ${dueDate ? 'qab-chip--active' : ''}`}
              onClick={() => setOpenPop(p => p === 'date' ? null : 'date')}
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              {dueDateLabel ?? t('tasks.groupNoDate')}
            </button>
            {openPop === 'date' && (
              <Popover onClose={() => setOpenPop(null)}>
                {[
                  { label: t('tasks.groupToday'), val: getTodayISO() },
                  { label: t('tasks.groupTomorrow'), val: getTomorrowISO() },
                  { label: '🗓️ Next Monday', val: getNextMondayISO() },
                ].map(({ label, val }) => (
                  <button
                    key={val}
                    className={`qab-pop-item ${dueDate === val ? 'qab-pop-item--active' : ''}`}
                    onClick={() => { setDueDate(val); setOpenPop(null) }}
                  >
                    {label}
                  </button>
                ))}
                <div className="qab-pop-divider" />
                <div className="qab-pop-date-wrap">
                  <input
                    type="date"
                    className="qab-pop-date-input"
                    value={dueDate}
                    onChange={(e) => { setDueDate(e.target.value); setOpenPop(null) }}
                  />
                </div>
                {dueDate && (
                  <button className="qab-pop-item qab-pop-item--danger" onClick={() => { setDueDate(''); setOpenPop(null) }}>
                    ✕ Clear date
                  </button>
                )}
              </Popover>
            )}
          </div>

          {/* List chip */}
          <div className="qab-chip-wrap">
            <button
              className="qab-chip"
              onClick={() => setOpenPop(p => p === 'list' ? null : 'list')}
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
              </svg>
              {listName}
            </button>
            {openPop === 'list' && (
              <Popover onClose={() => setOpenPop(null)} align="right">
                {(userLists.length ? userLists : ['Personal', 'Work']).map(l => {
                  const lName = typeof l === 'string' ? l : l.name
                  return (
                    <button
                      key={lName}
                      className={`qab-pop-item ${listName === lName ? 'qab-pop-item--active' : ''}`}
                      onClick={() => { setList(lName); setOpenPop(null) }}
                    >
                      📁 {lName}
                    </button>
                  )
                })}
              </Popover>
            )}
          </div>

          {/* Tag chip */}
          <div className="qab-chip-wrap">
            <button
              className="qab-chip"
              onClick={() => setOpenPop(p => p === 'tag' ? null : 'tag')}
            >
              🏷️ #{tag}
            </button>
            {openPop === 'tag' && (
              <Popover onClose={() => setOpenPop(null)} align="right">
                {(userTags.length ? userTags : ['General']).map(t => {
                  const tName = typeof t === 'string' ? t : t.name
                  return (
                    <button
                      key={tName}
                      className={`qab-pop-item ${tag === tName ? 'qab-pop-item--active' : ''}`}
                      onClick={() => { setTag(tName); setOpenPop(null) }}
                    >
                      #{tName}
                    </button>
                  )
                })}
              </Popover>
            )}
          </div>

          {/* Repeat chip */}
          <div className="qab-chip-wrap">
            <button
              className={`qab-chip ${recurrence !== 'none' ? 'qab-chip--active' : ''}`}
              onClick={() => setOpenPop(p => p === 'repeat' ? null : 'repeat')}
            >
              🔁 {REPEAT_OPTIONS.find(r => r.value === recurrence)?.label ?? 'Repeat'}
            </button>
            {openPop === 'repeat' && (
              <Popover onClose={() => setOpenPop(null)} align="right">
                {REPEAT_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    className={`qab-pop-item ${recurrence === opt.value ? 'qab-pop-item--active' : ''}`}
                    onClick={() => { setRecurrence(opt.value); setOpenPop(null) }}
                  >
                    {opt.label}
                  </button>
                ))}
              </Popover>
            )}
          </div>

          {/* Cancel */}
          <button className="qab-chip qab-chip--cancel" onClick={() => { reset(); setExpanded(false) }}>
            ✕
          </button>
        </div>
      )}
    </div>
  )
}
