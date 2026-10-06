import { useState, useEffect, useRef, useMemo } from 'react'
import RecurrenceEditor from '../ui/RecurrenceEditor'
import Input from '../ui/Input'
import Checkbox from '../ui/Checkbox'
import Button from '../ui/Button'
import IconButton from '../ui/IconButton'
import Badge from '../ui/Badge'
import { toTimeInputValue } from '../../utils/timeUtils'

/* ── Color swatches ── */
const COLOR_SWATCHES = ['#3B82F6','#6366F1','#8B5CF6','#10B981','#F59E0B','#F43F5E','#EC4899','#64748B']

/* ── Priority options ── */
const PRIORITIES = [
  { id: 'high',   label: 'High',   color: '#F43F5E', icon: '🔴' },
  { id: 'medium', label: 'Medium', color: '#F59E0B', icon: '🟡' },
  { id: 'low',    label: 'Low',    color: '#3B82F6', icon: '🔵' },
  { id: 'none',   label: 'None',   color: '#71717a', icon: '⚫' },
]

/* ══════════════════════════════════════════════════
   BASE MODAL SHELL
══════════════════════════════════════════════════ */
import Modal from '../ui/Modal'

function BaseModal({ title, subtitle, icon, color = 'var(--color-primary)', onClose, children, width = 560 }) {
  return (
    <Modal isOpen={true} onClose={onClose}>
      {/* Accent top bar */}
      <div style={{ background: `linear-gradient(90deg, ${color}CC, ${color}33)`, height: 4, width: '100%', flexShrink: 0 }} />

      {/* Header */}
      <Modal.Header
        title={
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: `${color}18`, border: `1px solid ${color}40`, color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {icon}
            </div>
            <div>{title}</div>
          </div>
        }
        subtitle={subtitle}
      />

      {/* Body */}
      <Modal.Body>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {children}
        </div>
      </Modal.Body>
    </Modal>
  )
}

/* ── Field label ── */
function FieldLabel({ children, required }) {
  return (
    <label className="cm-field-label">
      {children}
      {required && <span className="cm-field-required">*</span>}
    </label>
  )
}

/* ══════════════════════════════════════════════════
   TASK FORM MODAL
══════════════════════════════════════════════════ */
export function TaskFormModal({ onClose, onSave, lists = [], tags = [] }) {
  const [title, setTitle]           = useState('')
  const [notes, setNotes]           = useState('')
  const [priority, setPriority]     = useState('medium')

  // Normalize lists whether passed as objects {id, name} or strings
  const normalizedLists = useMemo(() => {
    const raw = Array.isArray(lists) && lists.length > 0 ? lists : ['Personal', 'Work']
    return raw.map((item, idx) => {
      if (item && typeof item === 'object') {
        const id = item.id != null ? item.id : null
        const name = item.name || `List ${idx + 1}`
        return { id, name, key: id != null ? String(id) : name }
      }
      return { id: null, name: String(item), key: String(item) }
    })
  }, [lists])

  const [selectedListKey, setSelectedListKey] = useState(() => {
    return normalizedLists[0]?.key || ''
  })

  useEffect(() => {
    if (normalizedLists.length > 0 && !normalizedLists.some(l => l.key === selectedListKey)) {
      setSelectedListKey(normalizedLists[0].key)
    }
  }, [normalizedLists, selectedListKey])

  const [tag, setTag]               = useState(tags[0] || '')
  const [startDate, setStartDate]   = useState('')
  const [dueDate, setDueDate]       = useState('')
  const [dueTime, setDueTime]       = useState('')
  const [recurrence, setRecurrence] = useState(null)
  const [subtasks, setSubtasks]     = useState([])
  const [subtaskInput, setSubtaskInput] = useState('')
  const [attachments, setAttachments]   = useState([])
  const [attachName, setAttachName]     = useState('')
  const [attachUrl, setAttachUrl]       = useState('')
  const [showAttachForm, setShowAttachForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [activeSection, setActiveSection] = useState('main') // 'main' | 'subtasks' | 'notes'

  const titleRef = useRef(null)
  useEffect(() => { titleRef.current?.focus() }, [])

  const priorityDef = PRIORITIES.find(p => p.id === priority)

  const addSubtask = () => {
    if (!subtaskInput.trim()) return
    const textVal = subtaskInput.trim()
    setSubtasks(prev => [...prev, { id: String(Date.now()), title: textVal, text: textVal, is_completed: false, done: false }])
    setSubtaskInput('')
  }
  const removeSubtask = (id) => setSubtasks(prev => prev.filter(st => st.id !== id))
  const toggleSubtask = (id) => setSubtasks(prev => prev.map(st => {
    if (st.id === id) {
      const isDone = !(st.done ?? st.is_completed)
      return { ...st, done: isDone, is_completed: isDone }
    }
    return st
  }))

  const addAttachment = () => {
    if (!attachName.trim() || !attachUrl.trim()) return
    setAttachments(prev => [...prev, { id: String(Date.now()), name: attachName.trim(), url: attachUrl.trim() }])
    setAttachName(''); setAttachUrl(''); setShowAttachForm(false)
  }

  const handleSubmit = async () => {
    if (!title.trim() || submitting) return
    setSubmitting(true)
    try {
      const chosenList = normalizedLists.find(l => l.key === selectedListKey) || normalizedLists[0]
      const listId = chosenList?.id ?? null
      const listName = chosenList?.name ?? ''

      await onSave({
        title: title.trim(),
        text: title.trim(),
        description: notes.trim(),
        notes: notes.trim(),
        priority: (priority || 'medium').toLowerCase(),
        list: listId,
        list_name: listName,
        tag: tag || '',
        start_date: startDate || null,
        due_date: dueDate || null,
        time: dueTime || '',
        due_time: dueTime || '',
        recurrence: recurrence || null,
        subtasks,
        attachments,
      })
    } finally {
      setSubmitting(false)
    }
  }

  function getTodayISO() { return new Date().toISOString().split('T')[0] }
  function getTomorrowISO() { const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().split('T')[0] }

  return (
    <BaseModal
      title="New Task"
      subtitle="Add details to create a well-defined task"
      icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9,11 12,14 22,4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>}
      onClose={onClose}
    >
      {/* ── Title input ── */}
      <div className="cm-field">
        <Input
          ref={titleRef}
          placeholder="What would you like to do?"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSubmit() }}
          style={{ fontSize: 18, fontWeight: 600, padding: '12px 16px' }}
        />
      </div>

      {/* ── Priority selector ── */}
      <div className="cm-field">
        <FieldLabel>Priority</FieldLabel>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {PRIORITIES.map(p => (
            <Button
              key={p.id}
              variant={priority === p.id ? 'primary' : 'ghost'}
              style={{
                borderColor: priority === p.id ? p.color : 'var(--color-border-subtle)',
                background: priority === p.id ? `${p.color}20` : 'transparent',
                color: priority === p.id ? p.color : 'var(--color-text)',
              }}
              onClick={() => setPriority(p.id)}
            >
              {p.icon} {p.label}
            </Button>
          ))}
        </div>
      </div>

      {/* ── List + Tag row ── */}
      <div className="cm-field-row">
        <div className="cm-field">
          <FieldLabel>List</FieldLabel>
          <div className="cm-select-wrap">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ color: 'var(--color-text-muted)' }}><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>
            <select className="cm-select" value={selectedListKey} onChange={(e) => setSelectedListKey(e.target.value)}>
              {normalizedLists.map(l => <option key={l.key} value={l.key}>{l.name}</option>)}
            </select>
          </div>
        </div>
        <div className="cm-field">
          <FieldLabel>Tag</FieldLabel>
          <div className="cm-select-wrap">
            <span style={{ color: 'var(--color-text-muted)', fontSize: 12 }}>#</span>
            <select className="cm-select" value={tag} onChange={(e) => setTag(e.target.value)}>
              {(tags.length ? tags : ['General']).map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* ── Date row ── */}
      <div className="cm-field-row">
        <div className="cm-field">
          <FieldLabel>Start date</FieldLabel>
          <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </div>
        <div className="cm-field">
          <FieldLabel>Due date</FieldLabel>
          <div style={{ display: 'flex', gap: 6 }}>
            <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            <Button variant="ghost" size="sm" onClick={() => setDueDate(getTodayISO())} title="Today">Today</Button>
            <Button variant="ghost" size="sm" onClick={() => setDueDate(getTomorrowISO())} title="Tomorrow">+1</Button>
          </div>
        </div>
        <div className="cm-field">
          <FieldLabel>Time</FieldLabel>
          <Input type="time" value={toTimeInputValue(dueTime)} onChange={(e) => setDueTime(e.target.value)} />
        </div>
      </div>

      {/* ── Repeat ── */}
      <div className="cm-field">
        <FieldLabel>Repeat</FieldLabel>
        <div className="cm-repeat-row">
          {[['none', 'No repeat'], ['daily', 'Daily'], ['weekly', 'Weekly'], ['monthly', 'Monthly']].map(([val, label]) => (
            <button
              key={val}
              className={`cm-repeat-btn ${(recurrence?.freq ?? 'none') === val && (!recurrence && val === 'none' ? true : !!recurrence) ? 'cm-repeat-btn--active' : ''}`}
              onClick={() => setRecurrence(val === 'none' ? null : { freq: val, interval: 1, ends: 'never' })}
            >
              {label}
            </button>
          ))}
        </div>
        {recurrence && (
          <div className="cm-recur-editor-wrap">
            <RecurrenceEditor value={recurrence} onChange={setRecurrence} />
          </div>
        )}
      </div>

      {/* ── Section tabs ── */}
      <div className="cm-section-tabs">
        {[['main','Overview'],['subtasks','Subtasks'], ['notes','Notes']].map(([key, label]) => (
          <button
            key={key}
            className={`cm-section-tab ${activeSection === key ? 'cm-section-tab--active' : ''}`}
            onClick={() => setActiveSection(key)}
          >
            {label}
            {key === 'subtasks' && subtasks.length > 0 && <span className="cm-tab-badge">{subtasks.length}</span>}
          </button>
        ))}
      </div>

      {/* ── Subtasks panel ── */}
      {activeSection === 'subtasks' && (
        <div className="cm-field">
          <div className="cm-subtask-list" style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
            {subtasks.map(st => (
              <div key={st.id} className="cm-subtask-row" style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <Checkbox
                  checked={st.done}
                  onChange={() => toggleSubtask(st.id)}
                />
                <span className={`cm-subtask-text ${st.done ? 'cm-subtask-text--done' : ''}`} style={{ flex: 1, textDecoration: st.done ? 'line-through' : 'none', color: st.done ? 'var(--color-text-muted)' : 'inherit' }}>{st.text}</span>
                <IconButton variant="ghost" size="sm" onClick={() => removeSubtask(st.id)} ariaLabel="Remove subtask" icon={
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                } />
              </div>
            ))}
          </div>
          <div className="cm-subtask-add-row" style={{ display: 'flex', gap: 8 }}>
            <Input
              placeholder="+ Add a subtask…"
              value={subtaskInput}
              onChange={(e) => setSubtaskInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSubtask() } }}
              autoFocus
            />
            {subtaskInput.trim() && (
              <Button variant="primary" onClick={addSubtask}>Add</Button>
            )}
          </div>
        </div>
      )}

      {/* ── Notes panel ── */}
      {activeSection === 'notes' && (
        <div className="cm-field">
          <textarea
            className="pil-input"
            style={{ minHeight: 120, resize: 'vertical', width: '100%' }}
            placeholder="Add notes, links, markdown…"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={5}
            autoFocus
          />
          {/* Attachments */}
          <div className="cm-attach-section" style={{ marginTop: 16 }}>
            <div className="cm-attach-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span className="cm-attach-title" style={{ fontSize: 13, fontWeight: 600 }}>Attachments</span>
              <Button variant="ghost" size="sm" onClick={() => setShowAttachForm(s => !s)}>+ Add link</Button>
            </div>
            {attachments.map(att => (
              <div key={att.id} className="cm-attach-row" style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>
                <a href={att.url} target="_blank" rel="noopener noreferrer" className="cm-attach-link" style={{ flex: 1, fontSize: 13, color: 'var(--color-primary)' }}>{att.name}</a>
                <IconButton variant="ghost" size="sm" onClick={() => setAttachments(a => a.filter(x => x.id !== att.id))} ariaLabel="Remove attachment" icon={
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                } />
              </div>
            ))}
            {showAttachForm && (
              <div className="cm-attach-form" style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <Input placeholder="Title…" value={attachName} onChange={(e) => setAttachName(e.target.value)} />
                <Input placeholder="https://…" value={attachUrl} onChange={(e) => setAttachUrl(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') addAttachment() }} />
                <Button variant="secondary" onClick={addAttachment} disabled={!attachName.trim() || !attachUrl.trim()}>Save</Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Footer ── */}
      <Modal.Footer spread>
        <span className="cm-footer-hint" style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Ctrl+Enter to save</span>
        <div style={{ display: 'flex', gap: 10 }}>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button
            variant="primary"
            disabled={!title.trim() || submitting}
            onClick={handleSubmit}
            icon={!submitting && <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>}
          >
            {submitting ? 'Saving...' : 'Create task'}
          </Button>
        </div>
      </Modal.Footer>
    </BaseModal>
  )
}

/* ══════════════════════════════════════════════════
   LIST FORM MODAL
══════════════════════════════════════════════════ */
export function ListFormModal({ onClose, onSave }) {
  const [name, setName]               = useState('')
  const [color, setColor]             = useState('#3B82F6')
  const [defaultView, setDefaultView] = useState('list')
  const [submitting, setSubmitting]   = useState(false)

  const handleSubmit = async () => {
    if (!name.trim() || submitting) return
    setSubmitting(true)
    try { await onSave({ name: name.trim(), color, default_view: defaultView }) }
    finally { setSubmitting(false) }
  }

  const views = [
    { id: 'list',     label: 'List',     icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg> },
    { id: 'kanban',   label: 'Kanban',   icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="5" height="18" rx="1"/><rect x="10" y="3" width="5" height="12" rx="1"/><rect x="17" y="3" width="5" height="15" rx="1"/></svg> },
    { id: 'timeline', label: 'Timeline', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="12" x2="21" y2="12"/><polyline points="8,8 3,12 8,16"/><polyline points="16,8 21,12 16,16"/></svg> },
  ]

  return (
    <BaseModal
      title="New List"
      subtitle="Group and organize your tasks by project or area"
      icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>}
      color={color}
      onClose={onClose}
      width={480}
    >
      {/* Name */}
      <div className="cm-field">
        <FieldLabel required>List name</FieldLabel>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ width: 16, height: 16, borderRadius: '50%', background: color, flexShrink: 0 }} />
          <Input
            placeholder="e.g. Work, University, Personal…"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            autoFocus
          />
        </div>
      </div>

      {/* Color */}
      <div className="cm-field">
        <FieldLabel>Accent color</FieldLabel>
        <div className="cm-swatches">
          {COLOR_SWATCHES.map(hex => (
            <button
              key={hex}
              className={`cm-swatch ${color === hex ? 'cm-swatch--active' : ''}`}
              style={{ background: hex, boxShadow: color === hex ? `0 0 0 3px var(--color-bg), 0 0 0 5px ${hex}` : 'none' }}
              onClick={() => setColor(hex)}
            />
          ))}
          <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="cm-color-picker" title="Custom color" />
        </div>
      </div>

      {/* Preview */}
      <div className="cm-field">
        <FieldLabel>Preview</FieldLabel>
        <div className="cm-list-preview" style={{ borderColor: `${color}40`, background: `${color}08` }}>
          <div className="cm-list-preview-icon" style={{ background: color }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>
          </div>
          <span style={{ fontWeight: 600, color: 'var(--color-text)', fontSize: 14 }}>{name || 'List name'}</span>
          <span style={{ fontSize: 11, color: 'var(--color-text-muted)', marginLeft: 'auto' }}>0 tasks</span>
        </div>
      </div>

      {/* Default view */}
      <div className="cm-field">
        <FieldLabel>Default view</FieldLabel>
        <div className="cm-view-picker" style={{ display: 'flex', gap: 8 }}>
          {views.map(v => (
            <Button
              key={v.id}
              variant={defaultView === v.id ? 'primary' : 'ghost'}
              style={{
                flex: 1,
                borderColor: defaultView === v.id ? color : 'var(--color-border-subtle)',
                background: defaultView === v.id ? `${color}20` : 'transparent',
                color: defaultView === v.id ? color : 'var(--color-text)',
              }}
              onClick={() => setDefaultView(v.id)}
              icon={v.icon}
            >
              {v.label}
            </Button>
          ))}
        </div>
      </div>

      <Modal.Footer spread>
        <div /> {/* Spacer */}
        <div style={{ display: 'flex', gap: 10 }}>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" disabled={!name.trim() || submitting} onClick={handleSubmit} style={{ background: color, borderColor: color }}>
            {submitting ? 'Saving...' : 'Create list'}
          </Button>
        </div>
      </Modal.Footer>
    </BaseModal>
  )
}

/* ══════════════════════════════════════════════════
   TAG FORM MODAL
══════════════════════════════════════════════════ */
export function TagFormModal({ onClose, onSave }) {
  const [name, setName]             = useState('')
  const [color, setColor]           = useState('#10B981')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    let cleanName = name.trim()
    if (!cleanName || submitting) return
    if (cleanName.startsWith('#')) cleanName = cleanName.slice(1).trim()
    setSubmitting(true)
    try { await onSave({ name: cleanName, color }) }
    finally { setSubmitting(false) }
  }

  return (
    <BaseModal
      title="New Tag"
      subtitle="Categorize tasks across lists with color-coded tags"
      icon={<span style={{ fontWeight: 700, fontSize: 18 }}>#</span>}
      color={color}
      onClose={onClose}
      width={420}
    >
      {/* Name */}
      <div className="cm-field">
        <FieldLabel required>Tag name</FieldLabel>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 18, color, fontWeight: 700 }}>#</span>
          <Input
            placeholder="e.g. urgent, dev, research…"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            autoFocus
          />
        </div>
      </div>

      {/* Color */}
      <div className="cm-field">
        <FieldLabel>Tag color</FieldLabel>
        <div className="cm-swatches">
          {COLOR_SWATCHES.map(hex => (
            <button
              key={hex}
              className={`cm-swatch ${color === hex ? 'cm-swatch--active' : ''}`}
              style={{ background: hex, boxShadow: color === hex ? `0 0 0 3px var(--color-bg), 0 0 0 5px ${hex}` : 'none' }}
              onClick={() => setColor(hex)}
            />
          ))}
          <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="cm-color-picker" title="Custom color" />
        </div>
      </div>

      {/* Live preview */}
      <div className="cm-field">
        <FieldLabel>Preview</FieldLabel>
        <div className="cm-tag-preview-area">
          <Badge size="sm" style={{ background: `${color}18`, color, border: `1px solid ${color}40` }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: color, display: 'inline-block', marginRight: 4 }} />
            #{name.trim() || 'preview'}
          </Badge>
        </div>
      </div>

      <Modal.Footer spread>
        <div /> {/* Spacer */}
        <div style={{ display: 'flex', gap: 10 }}>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" disabled={!name.trim() || submitting} onClick={handleSubmit} style={{ background: color, borderColor: color }}>
            {submitting ? 'Saving...' : 'Create'}
          </Button>
        </div>
      </Modal.Footer>
    </BaseModal>
  )
}
