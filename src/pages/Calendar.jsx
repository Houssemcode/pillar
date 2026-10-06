import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { calendarApi } from '../api/calendar'
import { tasksApi } from '../api/tasks'
import { useToast } from '../context/ToastContext'
import RecurrenceEditor from '../components/ui/RecurrenceEditor'
import notificationService from '../services/notificationService'
import Modal from '../components/ui/Modal'
import Input from '../components/ui/Input'
import Checkbox from '../components/ui/Checkbox'
import Button from '../components/ui/Button'
import IconButton from '../components/ui/IconButton'
import Badge from '../components/ui/Badge'
import Card from '../components/ui/Card'
import { formatTimeHHmm, toTimeInputValue } from '../utils/timeUtils'

/* ── Constants ───────────────────────────────────────────────── */
const DAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']
const DAYS_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const DAYS_MINI = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

const COLOR_PALETTE = [
  '#3B82F6', '#6366F1', '#10B981', '#F43F5E',
  '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4'
]

const TASK_COLOR = '#14B8A6'

/* ── Helpers ─────────────────────────────────────────────────── */
const toISO = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

const parseTime = (t) => { if (!t) return 0; const [h, m] = t.split(':').map(Number); return h * 60 + (m || 0) }

const formatTime = (t) => {
  if (!t) return ''
  return formatTimeHHmm(t)
}

const isSameDay = (a, b) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()

/* ── Hijri Calculation ───────────────────────────────────────── */
const HIJRI_MONTHS_EN = [
  'Muharram', 'Safar', 'Rabi al-Awwal', 'Rabi al-Thani',
  'Jumada al-Awwal', 'Jumada al-Thani', 'Rajab', "Sha'ban",
  'Ramadan', 'Shawwal', "Dhul Qa'dah", 'Dhul Hijjah'
]

const HIJRI_MONTHS_AR = [
  'محرم', 'صفر', 'ربيع الأول', 'ربيع الثاني',
  'جمادى الأولى', 'جمادى الثانية', 'رجب', 'شعبان',
  'رمضان', 'شوال', 'ذو القعدة', 'ذو الحجة'
]

function toHijri(date, isAr = false) {
  try {
    const calLocale = isAr ? 'ar-SA-u-ca-islamic' : 'en-TN-u-ca-islamic'
    const parts = new Intl.DateTimeFormat(calLocale, { day: 'numeric', month: 'numeric', year: 'numeric' })
      .formatToParts(date)
    const p = {}
    parts.forEach(({ type, value }) => { p[type] = value })
    const mIdx = parseInt(p.month, 10) - 1
    const monthsList = isAr ? HIJRI_MONTHS_AR : HIJRI_MONTHS_EN
    const monthName = monthsList[mIdx] || p.month
    return {
      day: p.day,
      month: monthName,
      monthShort: isAr ? monthName : monthName.slice(0, 3),
      year: p.year
    }
  } catch { return null }
}

/* ── Shared mini components ──────────────────────────────────── */
function HijriTag({ date, compact = false, isAr = false }) {
  const h = toHijri(date, isAr)
  if (!h) return null
  return (
    <span style={{
      fontSize: compact ? 9 : 10,
      color: '#10B981',
      fontWeight: 600,
      letterSpacing: '0.01em',
      display: 'block',
      lineHeight: 1.3,
    }}>
      {compact ? `${h.day} ${h.monthShort}` : `${h.day} ${h.month} ${h.year}`}
    </span>
  )
}

/* ────────────────────────────────────────────────────────────── */
/*  OTHER CALENDARS DROPDOWN MENU                                 */
/* ────────────────────────────────────────────────────────────── */
function OtherCalendarsMenu({ onSelect, onClose }) {
  const ref = useRef(null)
  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) onClose() }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [onClose])

  const ITEMS = [
    { key: 'create', icon: '➕', label: 'Create new calendar' },
    { key: 'subscribe', icon: '🔔', label: 'Subscribe to calendar' },
    { key: 'browse', icon: '🌐', label: 'Browse calendars of interest' },
    { key: 'url', icon: '🔗', label: 'From URL' },
  ]

  return (
    <div ref={ref} style={{
      position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 300,
      background: 'var(--color-surface-2)',
      border: '1px solid var(--color-border)',
      borderRadius: 12,
      boxShadow: '0 16px 48px rgba(0,0,0,0.4), 0 4px 12px rgba(0,0,0,0.25)',
      minWidth: 230, overflow: 'hidden',
      animation: 'calFadeSlide 0.18s cubic-bezier(0.34,1.56,0.64,1)',
    }}>
      {ITEMS.map(item => (
        <button
          key={item.key}
          onClick={() => { onSelect(item.key); onClose() }}
          style={{
            display: 'flex', alignItems: 'center', gap: 11, width: '100%',
            padding: '11px 16px', background: 'none', border: 'none',
            cursor: 'pointer', color: 'var(--color-text)',
            fontSize: 13, fontWeight: 500, textAlign: 'left',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--color-surface-3)'}
          onMouseLeave={e => e.currentTarget.style.background = 'none'}
        >
          <span style={{ fontSize: 15, minWidth: 22 }}>{item.icon}</span>
          {item.label}
        </button>
      ))}
    </div>
  )
}

/* ────────────────────────────────────────────────────────────── */
/*  NEW CALENDAR MODAL                                            */
/* ────────────────────────────────────────────────────────────── */
function NewCalendarModal({ onSave, onClose }) {
  const [name, setName] = useState('')
  const [color, setColor] = useState(COLOR_PALETTE[0])

  const handleSave = () => {
    if (!name.trim()) return
    onSave({ name: name.trim(), color })
  }

  return (
    <Modal isOpen={true} onClose={onClose}>
      <Modal.Header title="Create Calendar" />
      <Modal.Body style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <div className="section-label" style={{ marginBottom: 6 }}>Calendar Name</div>
          <Input
            autoFocus placeholder="e.g. Work, Fitness, Family"
            value={name} onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSave()}
          />
        </div>

        <div>
          <div className="section-label" style={{ marginBottom: 8 }}>Color</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            {COLOR_PALETTE.map(c => (
              <div
                key={c}
                onClick={() => setColor(c)}
                style={{
                  width: 32, height: 32, borderRadius: 8, background: c, cursor: 'pointer',
                  border: color === c ? '2px solid #fff' : '2px solid transparent',
                  boxShadow: color === c ? '0 0 0 2px var(--color-primary)' : 'none',
                  transition: 'all 0.15s',
                }}
              />
            ))}
            <input
              type="color" value={color} onChange={e => setColor(e.target.value)}
              title="Custom color"
              style={{ width: 32, height: 32, border: 'none', borderRadius: 8, cursor: 'pointer', padding: 0, background: 'none' }}
            />
          </div>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button variant="primary" onClick={handleSave} disabled={!name.trim()}>Create</Button>
      </Modal.Footer>
    </Modal>
  )
}

/* ────────────────────────────────────────────────────────────── */
/*  SUBSCRIBE / URL CALENDAR MODAL                                */
/* ────────────────────────────────────────────────────────────── */
function SubscribeCalendarModal({ mode, onSave, onClose }) {
  const [name, setName] = useState('')
  const [url, setUrl] = useState('')
  const [color, setColor] = useState('#8B5CF6')

  const handleSave = () => {
    if (!name.trim()) return
    onSave({ name: name.trim(), url: url.trim(), color })
  }

  return (
    <Modal isOpen={true} onClose={onClose}>
      <Modal.Header title={mode === 'url' ? 'Add from URL' : 'Subscribe to Calendar'} />
      <Modal.Body style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <div className="section-label" style={{ marginBottom: 6 }}>Calendar Name</div>
          <Input
            autoFocus placeholder="e.g. Holidays, League Schedule"
            value={name} onChange={e => setName(e.target.value)}
          />
        </div>

        <div>
          <div className="section-label" style={{ marginBottom: 6 }}>Calendar URL (.ics / webcal)</div>
          <Input
            placeholder="https://example.com/calendar.ics"
            value={url} onChange={e => setUrl(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSave()}
          />
        </div>

        <div>
          <div className="section-label" style={{ marginBottom: 8 }}>Color</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            {COLOR_PALETTE.map(c => (
              <div
                key={c}
                onClick={() => setColor(c)}
                style={{
                  width: 32, height: 32, borderRadius: 8, background: c, cursor: 'pointer',
                  border: color === c ? '2px solid #fff' : '2px solid transparent',
                  boxShadow: color === c ? '0 0 0 2px var(--color-primary)' : 'none',
                  transition: 'all 0.15s',
                }}
              />
            ))}
          </div>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button variant="primary" onClick={handleSave} disabled={!name.trim()}>Subscribe</Button>
      </Modal.Footer>
    </Modal>
  )
}

/* ────────────────────────────────────────────────────────────── */
/*  SIDEBAR & MOBILE DRAWER                                       */
/* ────────────────────────────────────────────────────────────── */
function CalendarSidebar({
  categories, hiddenCategories, toggleCategory,
  showTasks, setShowTasks, taskCount,
  otherCalendars, hiddenOtherCalendars, toggleOtherCalendar,
  onOpenOtherAction,
  sidebarOpen, setSidebarOpen,
}) {
  const { t } = useTranslation()
  const [showOtherMenu, setShowOtherMenu] = useState(false)
  const otherRef = useRef(null)
  const catEntries = Object.entries(categories)

  return (
    <>
      {/* Mobile backdrop overlay */}
      <div
        className={`cal-sidebar-overlay ${sidebarOpen ? 'cal-sidebar-overlay--visible' : ''}`}
        onClick={() => setSidebarOpen(false)}
        aria-hidden="true"
      />

      <div className={`cal-sidebar ${sidebarOpen ? 'cal-sidebar--open' : ''}`}>
        {/* Mobile drawer header with close button */}
        <div className="cal-sidebar-drawer-header">
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text)' }}>
            {t('calendar.title')}
          </div>
          <IconButton
            variant="ghost"
            onClick={() => setSidebarOpen(false)}
            ariaLabel="Close sidebar"
            icon={
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            }
          />
        </div>

        {/* ── My Calendars ── */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div className="section-label" style={{ marginBottom: 0 }}>{t('calendar.myCalendars')}</div>
            <IconButton
              variant="ghost"
              onClick={() => onOpenOtherAction('create')}
              title={t('calendar.addEvent')}
              icon={
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              }
            />
          </div>

          {catEntries.length === 0 ? (
            <div style={{
              fontSize: 12, color: 'var(--color-text-muted)',
              fontStyle: 'italic', padding: '10px 8px',
              borderRadius: 8,
              background: 'var(--color-surface-2)',
              border: '1px dashed var(--color-border)',
              textAlign: 'center',
            }}>
              {t('calendar.noCalendarsYet')}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {catEntries.map(([catKey, info]) => {
                const hidden = hiddenCategories.has(catKey)
                const col = info.color || '#6366F1'
                return (
                  <label key={catKey} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    cursor: 'pointer', padding: '6px 8px', borderRadius: 8,
                    transition: 'background 0.15s', minHeight: 36,
                  }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--color-surface-2)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <div style={{
                      width: 18, height: 18, borderRadius: 5, flexShrink: 0,
                      border: `2px solid ${col}`,
                      background: hidden ? 'transparent' : col,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all 0.15s',
                    }}>
                      {!hidden && (
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round">
                          <polyline points="20,6 9,17 4,12" />
                        </svg>
                      )}
                    </div>
                    <input type="checkbox" checked={!hidden} onChange={() => toggleCategory(catKey)} style={{ display: 'none' }} />
                    <span style={{
                      fontSize: 13, color: hidden ? 'var(--color-text-muted)' : 'var(--color-text)',
                      textTransform: 'capitalize', lineHeight: 1.3, transition: 'color 0.15s',
                    }}>{info.name}</span>
                  </label>
                )
              })}
            </div>
          )}
        </div>

        {/* ── Tasks ── */}
        <div style={{ marginBottom: 24 }}>
          <div className="section-label">{t('nav.tasks')}</div>
          <label style={{
            display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
            padding: '6px 8px', borderRadius: 8, transition: 'background 0.15s', minHeight: 36,
          }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--color-surface-2)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <div style={{
              width: 18, height: 18, borderRadius: 5, flexShrink: 0,
              border: `2px solid ${TASK_COLOR}`,
              background: showTasks ? TASK_COLOR : 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.15s',
            }}>
              {showTasks && (
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round">
                  <polyline points="20,6 9,17 4,12" />
                </svg>
              )}
            </div>
            <input type="checkbox" checked={showTasks} onChange={() => setShowTasks(v => !v)} style={{ display: 'none' }} />
            <span style={{ fontSize: 13, color: showTasks ? 'var(--color-text)' : 'var(--color-text-muted)' }}>{t('nav.tasks')}</span>
            {taskCount > 0 && (
              <span style={{
                marginLeft: 'auto', fontSize: 10, fontWeight: 700,
                padding: '1px 7px', borderRadius: 100,
                background: `${TASK_COLOR}18`, color: TASK_COLOR,
                border: `1px solid ${TASK_COLOR}30`,
              }}>{taskCount}</span>
            )}
          </label>
        </div>

        {/* ── Other Calendars ── */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div className="section-label" style={{ marginBottom: 0 }}>{t('calendar.otherCalendars')}</div>
            <div style={{ position: 'relative' }} ref={otherRef}>
              <IconButton
                variant="ghost"
                onClick={() => setShowOtherMenu(v => !v)}
                title="Add other calendars"
                ariaLabel="Add other calendars"
                style={showOtherMenu ? { background: 'var(--color-surface-3)' } : {}}
                icon={
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                }
              />
              {showOtherMenu && (
                <OtherCalendarsMenu
                  onSelect={onOpenOtherAction}
                  onClose={() => setShowOtherMenu(false)}
                />
              )}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {otherCalendars.length === 0 ? (
              <div style={{
                fontSize: 12, color: 'var(--color-text-muted)',
                fontStyle: 'italic', padding: '10px 8px',
                borderRadius: 8,
                background: 'var(--color-surface-2)',
                border: '1px dashed var(--color-border)',
                textAlign: 'center',
              }}>
                {t('calendar.noOtherCalendars')}
              </div>
            ) : (
              otherCalendars.map(cal => {
                const hidden = hiddenOtherCalendars.has(cal.id)
                return (
                  <label key={cal.id} style={{
                    display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
                    padding: '6px 8px', borderRadius: 8, transition: 'background 0.15s', minHeight: 36,
                  }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--color-surface-2)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <div style={{
                      width: 18, height: 18, borderRadius: 5, flexShrink: 0,
                      border: `2px solid ${cal.color}`,
                      background: hidden ? 'transparent' : cal.color,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all 0.15s',
                    }}>
                      {!hidden && (
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round">
                          <polyline points="20,6 9,17 4,12" />
                        </svg>
                      )}
                    </div>
                    <input type="checkbox" checked={!hidden} onChange={() => toggleOtherCalendar(cal.id)} style={{ display: 'none' }} />
                    <span style={{ fontSize: 13, color: hidden ? 'var(--color-text-muted)' : 'var(--color-text)' }}>
                      {cal.name}
                    </span>
                  </label>
                )
              })
            )}
          </div>
        </div>
      </div>
    </>
  )
}

/* ────────────────────────────────────────────────────────────── */
/*  MODALS                                                        */
/* ────────────────────────────────────────────────────────────── */
const REMINDER_OPTIONS = [
  { value: null, label: 'No reminder' },
  { value: 0,   label: 'At start time' },
  { value: 5,   label: '5 min before' },
  { value: 15,  label: '15 min before' },
  { value: 30,  label: '30 min before' },
  { value: 60,  label: '1 hour before' },
  { value: 120, label: '2 hours before' },
  { value: 1440,label: '1 day before' },
]

function NewEventModal({ initialDate, categories, onSave, onClose }) {
  const { t } = useTranslation()
  const catKeys = Object.keys(categories)
  const defaultCategory = catKeys[0] ? categories[catKeys[0]].name : 'General'
  const defaultColor = catKeys[0] ? categories[catKeys[0]].color : '#6366F1'

  const [title, setTitle] = useState('')
  const [date, setDate] = useState(initialDate ? toISO(initialDate) : toISO(new Date()))
  const [startTime, setStart] = useState('')
  const [endTime, setEnd] = useState('')
  const [allDay, setAllDay] = useState(false)
  const [category, setCategory] = useState(defaultCategory)
  const [color, setColor] = useState(defaultColor)
  const [location, setLocation] = useState('')
  const [desc, setDesc] = useState('')
  const [recurrence, setRecurrence] = useState(null)
  const [reminderOffset, setReminderOffset] = useState(null)
  const [saving, setSaving] = useState(false)
  const [showRecurrence, setShowRecurrence] = useState(false)

  const handleCategoryChange = v => {
    setCategory(v)
    const lower = v.trim().toLowerCase()
    if (categories[lower]) {
      setColor(categories[lower].color)
    }
  }

  const handleSave = async () => {
    if (!title.trim()) return
    setSaving(true)
    const saved = await onSave({
      title: title.trim(),
      startDate: date,
      startTime: allDay ? null : startTime || null,
      endTime: allDay ? null : endTime || null,
      allDay,
      color,
      category: category.trim() || 'General',
      location: location.trim(),
      description: desc.trim(),
      isRecurring: !!recurrence,
      recurrence: recurrence || null,
    })
    if (saved && reminderOffset !== null && !allDay && startTime) {
      const fireAt = notificationService.reminderDate(date, startTime, reminderOffset)
      if (fireAt && fireAt > new Date()) {
        notificationService.scheduleNotification(
          `event-${saved.id}`,
          `📅 ${title.trim()}`,
          reminderOffset === 0 ? 'Starting now' : notificationService.reminderLabel(reminderOffset),
          fireAt
        )
      }
    }
    setSaving(false)
  }

  return (
    <Modal isOpen={true} onClose={onClose}>
      <Modal.Header
        title={
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-text)' }}>{t('calendar.addEvent')}</span>
            <HijriTag date={date ? new Date(date + 'T12:00:00') : new Date()} />
          </div>
        }
      />
      <Modal.Body style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Title */}
        <Input
          autoFocus placeholder="Event title"
          value={title} onChange={e => setTitle(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSave()}
        />

        {/* Date + All Day */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <label style={{ flex: '1 1 180px' }}>
            <div className="section-label" style={{ marginBottom: 6 }}>Date</div>
            <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
          </label>
          <div style={{ paddingBottom: 6 }}>
            <Checkbox checked={allDay} onChange={e => setAllDay(e.target.checked)} label={t('calendar.allDay')} />
          </div>
        </div>

        {/* Times */}
        {!allDay && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12 }}>
            <label>
              <div className="section-label" style={{ marginBottom: 6 }}>Start</div>
              <Input type="time" value={toTimeInputValue(startTime)} onChange={e => setStart(e.target.value)} />
            </label>
            <label>
              <div className="section-label" style={{ marginBottom: 6 }}>End</div>
              <Input type="time" value={toTimeInputValue(endTime)} onChange={e => setEnd(e.target.value)} />
            </label>
          </div>
        )}

        {/* Category + Color */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, alignItems: 'start' }}>
          <label>
            <div className="section-label" style={{ marginBottom: 6 }}>Calendar / Category</div>
            <Input list="cal-cats" placeholder="e.g. Work, Meeting…"
              value={category} onChange={e => handleCategoryChange(e.target.value)} />
            <datalist id="cal-cats">
              {Object.values(categories).map(c => <option key={c.name} value={c.name} />)}
            </datalist>
          </label>
          <label>
            <div className="section-label" style={{ marginBottom: 6 }}>Color</div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', paddingTop: 4 }}>
              <input type="color" value={color} onChange={e => setColor(e.target.value)}
                style={{ width: 40, height: 40, border: 'none', borderRadius: 10, cursor: 'pointer', padding: 0, background: 'none' }} />
            </div>
          </label>
        </div>

        {/* Location */}
        <label>
          <div className="section-label" style={{ marginBottom: 6 }}>Location</div>
          <Input placeholder="Add location" value={location} onChange={e => setLocation(e.target.value)} />
        </label>

        {/* Reminder */}
        <label>
          <div className="section-label" style={{ marginBottom: 6 }}>🔔 Reminder</div>
          <select
            className="input"
            value={reminderOffset === null ? '' : String(reminderOffset)}
            onChange={e => setReminderOffset(e.target.value === '' ? null : Number(e.target.value))}
            style={{ padding: '10px 14px', width: '100%' }}
          >
            {REMINDER_OPTIONS.map(o => (
              <option key={String(o.value)} value={o.value === null ? '' : String(o.value)}>{o.label}</option>
            ))}
          </select>
        </label>

        {/* Recurrence */}
        <div style={{
          borderRadius: 12, border: '1px solid var(--color-border)',
          overflow: 'hidden',
        }}>
          <button
            type="button"
            onClick={() => setShowRecurrence(v => !v)}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '11px 14px', background: 'none', border: 'none', cursor: 'pointer',
              color: recurrence ? color : 'var(--color-text-muted)',
              fontSize: 13, fontWeight: 600,
            }}
          >
            <span>🔁 {recurrence ? `Repeats ${recurrence.freq}` : 'Does not repeat'}</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
              style={{ transform: showRecurrence ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
              <polyline points="6,9 12,15 18,9" />
            </svg>
          </button>
          {showRecurrence && (
            <div style={{ padding: '0 14px 14px', borderTop: '1px solid var(--color-border)' }}>
              <div style={{ paddingTop: 14 }}>
                <RecurrenceEditor value={recurrence} onChange={setRecurrence} accentColor={color} />
              </div>
            </div>
          )}
        </div>

        {/* Description */}
        <label>
          <div className="section-label" style={{ marginBottom: 6 }}>Description</div>
          <textarea className="input" placeholder="Add notes…" rows={3}
            value={desc} onChange={e => setDesc(e.target.value)}
            style={{ padding: '10px 14px', resize: 'vertical', minHeight: 70, width: '100%' }} />
        </label>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button variant="primary" onClick={handleSave} disabled={saving || !title.trim()}>
          {saving ? 'Saving…' : 'Save Event'}
        </Button>
      </Modal.Footer>
    </Modal>
  )
}

/* ── Recurrence summary helper ───────────────────────────────── */
function buildRecurrenceSummary(rule) {
  if (!rule || !rule.freq) return 'Does not repeat'
  const DOW = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const { freq, interval = 1, ends = 'never', end_date, count, days_of_week = [] } = rule
  let base = ''
  if (freq === 'daily')   base = interval === 1 ? 'Daily' : `Every ${interval} days`
  if (freq === 'weekly')  {
    const days = [...days_of_week].sort().map(d => DOW[d]).join(', ')
    base = interval === 1 ? `Weekly${days ? ' on ' + days : ''}` : `Every ${interval} weeks${days ? ' on ' + days : ''}`
  }
  if (freq === 'monthly') base = interval === 1 ? 'Monthly' : `Every ${interval} months`
  if (freq === 'yearly')  base = interval === 1 ? 'Yearly' : `Every ${interval} years`
  if (ends === 'on_date' && end_date) base += `, until ${end_date}`
  if (ends === 'after_n' && count)    base += `, ${count} time${count === 1 ? '' : 's'}`
  return base
}

function ViewEventModal({ event, onDelete, onClose }) {
  const { t } = useTranslation()
  const col = event.isTask ? TASK_COLOR : (event.color || '#6366F1')
  const [deleting, setDeleting] = useState(false)
  const eventDate = event.startDate ? new Date(event.startDate + 'T12:00:00') : new Date()
  const h = toHijri(eventDate)

  return (
    <Modal isOpen={true} onClose={onClose}>
      <Modal.Header
        title={
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <div style={{
              width: 38, height: 38, borderRadius: 10,
              background: `${col}22`, border: `2px solid ${col}45`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              {event.isTask
                ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={col} strokeWidth="2.5" strokeLinecap="round"><polyline points="9,11 12,14 22,4" /><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" /></svg>
                : <div style={{ width: 12, height: 12, borderRadius: 4, background: col }} />
              }
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: col, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>
                {event.isTask ? t('nav.tasks') : (event.category || 'Event')}
              </div>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--color-text)', lineHeight: 1.3, wordBreak: 'break-word' }}>
                {event.title}
              </h3>
            </div>
          </div>
        }
      />
      <Modal.Body style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Date */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <div style={{ width: 28, display: 'flex', justifyContent: 'center', paddingTop: 2 }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="2" strokeLinecap="round">
                <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </div>
            <div>
              <div style={{ fontSize: 13, color: 'var(--color-text)', fontWeight: 500 }}>
                {eventDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
              </div>
              {h && <div style={{ fontSize: 11, color: '#10B981', fontWeight: 600, marginTop: 2 }}>{h.day} {h.month} {h.year} AH</div>}
            </div>
          </div>

          {/* Time */}
          {(!event.allDay && event.startTime) && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 28, display: 'flex', justifyContent: 'center' }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="2" strokeLinecap="round">
                  <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
              <div style={{ fontSize: 13, color: 'var(--color-text)', fontWeight: 500 }}>
                {formatTime(event.startTime)}{event.endTime ? ` – ${formatTime(event.endTime)}` : ''}
              </div>
            </div>
          )}
          {event.allDay && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 28, display: 'flex', justifyContent: 'center' }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="2" strokeLinecap="round">
                  <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
              <div style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>{t('calendar.allDay')}</div>
            </div>
          )}

          {/* Location */}
          {event.location && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 28, display: 'flex', justifyContent: 'center' }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="2" strokeLinecap="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
                </svg>
              </div>
              <div style={{ fontSize: 13, color: 'var(--color-text)', fontWeight: 500 }}>{event.location}</div>
            </div>
          )}

          {/* Description */}
          {event.description && (
            <div style={{
              marginTop: 4, padding: '10px 14px',
              background: 'var(--color-surface-3)',
              borderRadius: 10, fontSize: 13, color: 'var(--color-text)',
              lineHeight: 1.5, whiteSpace: 'pre-wrap',
            }}>
              {event.description}
            </div>
          )}

          {/* Priority (tasks) */}
          {event.isTask && event.priority && event.priority !== 'none' && (
            <div style={{ display: 'flex', gap: 6 }}>
              <Badge variant="warning" size="sm">
                🚩 {event.priority.charAt(0).toUpperCase() + event.priority.slice(1)} priority
              </Badge>
            </div>
          )}

          {/* Recurrence info */}
          {event.isRecurring && event.recurrence && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 28, display: 'flex', justifyContent: 'center' }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="2" strokeLinecap="round">
                  <polyline points="17,1 21,5 17,9" />
                  <path d="M3 11V9a4 4 0 014-4h14" />
                  <polyline points="7,23 3,19 7,15" />
                  <path d="M21 13v2a4 4 0 01-4 4H3" />
                </svg>
              </div>
              <div style={{ fontSize: 13, color: 'var(--color-text)', fontWeight: 500 }}>
                {buildRecurrenceSummary(event.recurrence)}
              </div>
            </div>
          )}
        </Modal.Body>

        {/* Footer */}
        <Modal.Footer divided>
          {!event.isTask && (
            <Button
              variant="danger"
              onClick={async () => { setDeleting(true); await onDelete(event.id); setDeleting(false) }}
              disabled={deleting}
            >
              {deleting ? t('common.loading') : `🗑 ${t('common.delete')}`}
            </Button>
          )}
          <Button variant="ghost" onClick={onClose}>{t('common.cancel')}</Button>
        </Modal.Footer>
    </Modal>
  )
}

/* ────────────────────────────────────────────────────────────── */
/*  MONTH VIEW                                                    */
/* ────────────────────────────────────────────────────────────── */
function MonthView({ currentDate, eventsByDate, onDateClick, onEventClick }) {
  const { t, i18n } = useTranslation()
  const isAr = i18n.language === 'ar' || i18n.language?.startsWith('ar')
  const locale = isAr ? 'ar-EG' : 'en-US'

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const daysInPrev = new Date(year, month, 0).getDate()
  const today = new Date()

  const weekDayHeaders = useMemo(() => {
    const sunday = new Date(2023, 0, 1)
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(sunday)
      d.setDate(sunday.getDate() + i)
      return new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(d)
    })
  }, [locale])

  // Track selected date on mobile to display day events below month grid
  const [selectedDate, setSelectedDate] = useState(() => new Date(year, month, Math.min(today.getDate(), daysInMonth)))

  // Keep selected date aligned when month changes
  useEffect(() => {
    setSelectedDate(new Date(year, month, 1))
  }, [year, month])

  const cells = []
  for (let i = firstDay - 1; i >= 0; i--) cells.push({ date: new Date(year, month - 1, daysInPrev - i), cur: false })
  for (let i = 1; i <= daysInMonth; i++) cells.push({ date: new Date(year, month, i), cur: true })
  const rem = 42 - cells.length
  for (let i = 1; i <= rem; i++) cells.push({ date: new Date(year, month + 1, i), cur: false })

  const selectedISO = toISO(selectedDate)
  const selectedEvents = eventsByDate[selectedISO] || []
  const selectedHijri = toHijri(selectedDate, isAr)

  const handleCellClick = (date) => {
    setSelectedDate(date)
    // On desktop, call onDateClick which opens NewEventModal
    // On mobile, selecting the cell reveals that day's agenda panel below!
    if (window.innerWidth >= 768) {
      onDateClick(date)
    }
  }

  return (
    <div className="cal-month-wrap">
      {/* Day headers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', background: 'var(--color-surface-2)', borderBottom: '1px solid var(--color-border)', flexShrink: 0 }}>
        {weekDayHeaders.map((d, i) => (
          <div key={i} style={{ padding: '8px 0', textAlign: 'center', fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', letterSpacing: '0.04em' }}>
            {d}
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="cal-month-grid">
        {cells.map((cell, i) => {
          const ds = toISO(cell.date)
          const evs = eventsByDate[ds] || []
          const isToday = isSameDay(cell.date, today)
          const isSelected = isSameDay(cell.date, selectedDate)
          const hDate = cell.cur ? toHijri(cell.date, isAr) : null

          return (
            <div key={i}
              onClick={() => handleCellClick(cell.date)}
              className={`cal-month-cell ${isSelected ? 'cal-month-cell--selected' : ''}`}
              style={{
                opacity: cell.cur ? 1 : 0.3,
                background: isToday ? 'var(--color-primary-subtle)' : isSelected ? 'var(--color-surface-2)' : 'transparent',
              }}
            >
              {/* Date number row */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: 2 }}>
                <div style={{
                  width: 22, height: 22, lineHeight: '22px', textAlign: 'center',
                  borderRadius: '50%', fontSize: 11, fontWeight: isToday ? 700 : 500,
                  background: isToday ? 'var(--color-primary)' : 'transparent',
                  color: isToday ? '#fff' : 'var(--color-text)', flexShrink: 0,
                }}>
                  {cell.date.getDate()}
                </div>
                {hDate && (
                  <div style={{ fontSize: 9, color: '#10B981', fontWeight: 600, paddingRight: 2 }}>
                    {hDate.day}
                  </div>
                )}
              </div>

              {/* Desktop: detailed event pills */}
              <div className="cal-cell-events-desktop hide-scrollbar">
                {evs.slice(0, 3).map((ev, j) => (
                  <div key={j}
                    onClick={e => { e.stopPropagation(); onEventClick(ev) }}
                    style={{
                      background: ev.isTask ? `${TASK_COLOR}18` : ev.allDay ? ev.color : `${ev.color}18`,
                      color: ev.isTask ? TASK_COLOR : ev.allDay ? '#fff' : ev.color,
                      padding: '2px 5px', borderRadius: 4, fontSize: 10, fontWeight: 600,
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      display: 'flex', alignItems: 'center', gap: 4,
                      borderLeft: ev.isTask ? `2px solid ${TASK_COLOR}` : 'none',
                    }}>
                    {ev.isTask
                      ? <svg width="7" height="7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round"><polyline points="20,6 9,17 4,12" /></svg>
                      : (!ev.allDay && <div style={{ width: 5, height: 5, borderRadius: '50%', background: ev.color, flexShrink: 0 }} />)
                    }
                    {!ev.isTask && !ev.allDay && ev.startTime && <span style={{ opacity: 0.75, fontSize: 9 }}>{formatTime(ev.startTime)}</span>}
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{ev.title}</span>
                  </div>
                ))}
                {evs.length > 3 && (
                  <div style={{ fontSize: 9, color: 'var(--color-text-muted)', fontWeight: 600, paddingLeft: 4 }}>
                    +{evs.length - 3} more
                  </div>
                )}
              </div>

              {/* Mobile: compact indicator dots */}
              <div className="cal-cell-dots-mobile">
                {evs.slice(0, 3).map((ev, idx) => (
                  <span
                    key={idx}
                    className="cal-event-dot"
                    style={{ background: ev.isTask ? TASK_COLOR : ev.color || 'var(--color-primary)' }}
                  />
                ))}
                {evs.length > 3 && (
                  <span className="cal-event-dot-more">+{evs.length - 3}</span>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Mobile: Selected day events panel below month grid */}
      <div className="cal-month-selected-day-panel">
        <div className="cal-month-panel-header">
          <div className="cal-month-panel-title">
            <span>📅 {selectedDate.toLocaleDateString(locale, { weekday: 'short', month: 'short', day: 'numeric' })}</span>
            {selectedHijri && (
              <span style={{ fontSize: 11, color: '#10B981', fontWeight: 600 }}>
                ({selectedHijri.day} {selectedHijri.monthShort})
              </span>
            )}
          </div>
          <Button
            variant="ghost"
            onClick={() => onDateClick(selectedDate)}
            style={{ fontSize: 12, padding: '4px 10px', height: 28 }}
          >
            + {t('calendar.addEvent')}
          </Button>
        </div>

        {selectedEvents.length === 0 ? (
          <div className="cal-month-panel-empty">{t('calendar.noEventsDay')}</div>
        ) : (
          <div className="cal-month-panel-events">
            {selectedEvents.map((ev, i) => (
              <div
                key={i}
                className="cal-month-panel-item"
                onClick={() => onEventClick(ev)}
                style={{ borderLeft: `3px solid ${ev.isTask ? TASK_COLOR : ev.color}` }}
              >
                <div style={{ fontSize: 11, color: 'var(--color-text-muted)', fontWeight: 600, width: 44, flexShrink: 0 }}>
                  {ev.allDay ? t('calendar.allDay') : ev.startTime ? formatTime(ev.startTime) : ''}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {ev.title}
                  </div>
                  {ev.location && (
                    <div style={{ fontSize: 11, color: 'var(--color-text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      📍 {ev.location}
                    </div>
                  )}
                </div>
                <Badge size="sm" style={{ background: `${ev.isTask ? TASK_COLOR : ev.color}15`, color: ev.isTask ? TASK_COLOR : ev.color, border: 'none' }}>
                  {ev.isTask ? t('nav.tasks') : ev.category || 'Event'}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

/* ────────────────────────────────────────────────────────────── */
/*  WEEK VIEW (Unified sticky synchronized scroll)                 */
/* ────────────────────────────────────────────────────────────── */
function WeekView({ currentDate, eventsByDate, onDateClick, onEventClick }) {
  const { t, i18n } = useTranslation()
  const isAr = i18n.language === 'ar' || i18n.language?.startsWith('ar')
  const locale = isAr ? 'ar-EG' : 'en-US'

  const startOfWeek = new Date(currentDate)
  startOfWeek.setDate(currentDate.getDate() - currentDate.getDay())

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startOfWeek); d.setDate(startOfWeek.getDate() + i); return d
  })
  const hours = Array.from({ length: 24 }, (_, i) => i)
  const today = new Date()

  const scrollRef = useRef(null)

  // Auto-scroll to 8 AM on mount so user doesn't start in the middle of the night
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 8 * 60 // 8 AM slot
    }
  }, [])

  return (
    <div className="cal-week-scroll-container hide-scrollbar" ref={scrollRef}>
      {/* Sticky Day Headers Row */}
      <div className="cal-week-header-row">
        <div className="cal-week-corner-cell" />
        {weekDays.map((d, i) => {
          const isToday = isSameDay(d, today)
          return (
            <div key={i} onClick={() => onDateClick(d)} className="cal-week-day-header">
              <div style={{ fontSize: 10, color: isToday ? 'var(--color-primary)' : 'var(--color-text-muted)', fontWeight: 700, letterSpacing: '0.04em' }}>
                {new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(d)}
              </div>
              <div style={{
                fontSize: 15, fontWeight: isToday ? 700 : 500,
                color: isToday ? '#fff' : 'var(--color-text)',
                background: isToday ? 'var(--color-primary)' : 'transparent',
                width: 28, height: 28, lineHeight: '28px', borderRadius: '50%', margin: '2px auto',
              }}>
                {d.getDate()}
              </div>
              <HijriTag date={d} compact isAr={isAr} />
            </div>
          )
        })}
      </div>

      {/* Grid Body */}
      <div className="cal-week-body">
        {/* Sticky time column */}
        <div className="cal-week-time-col">
          {hours.map(h => (
            <div key={h} style={{ height: 60, position: 'relative' }}>
              {h > 0 && (
                <div style={{ position: 'absolute', top: -7, right: 6, fontSize: 10, color: 'var(--color-text-muted)', textAlign: 'right', whiteSpace: 'nowrap' }}>
                  {h === 12 ? '12p' : h > 12 ? `${h - 12}p` : `${h}a`}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* 7 day columns */}
        {weekDays.map((d, i) => {
          const ds = toISO(d)
          const evs = eventsByDate[ds] || []
          const timed = evs.filter(e => !e.allDay && e.startTime)
          const allDay = evs.filter(e => e.allDay || !e.startTime)

          return (
            <div key={i} className="cal-week-col">
              {hours.map(h => (
                <div
                  key={h}
                  style={{ height: 60, borderBottom: '1px solid var(--color-border-subtle)', cursor: 'pointer' }}
                  onClick={() => onDateClick(d)}
                />
              ))}

              {/* All-day events strip */}
              <div style={{ position: 'absolute', top: 2, left: 0, right: 0, display: 'flex', flexDirection: 'column', gap: 2, padding: '0 2px', zIndex: 5 }}>
                {allDay.map((ev, j) => (
                  <div key={j} onClick={e => { e.stopPropagation(); onEventClick(ev) }}
                    style={{
                      background: ev.isTask ? `${TASK_COLOR}20` : ev.color,
                      color: ev.isTask ? TASK_COLOR : '#fff',
                      fontSize: 9, padding: '2px 4px', borderRadius: 4, cursor: 'pointer',
                      fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      borderLeft: ev.isTask ? `2px solid ${TASK_COLOR}` : 'none',
                    }}>
                    {ev.title}
                  </div>
                ))}
              </div>

              {/* Timed events */}
              {timed.map((ev, j) => {
                const top = parseTime(ev.startTime)
                const ht = Math.max((ev.endTime ? parseTime(ev.endTime) : top + 60) - top, 22)
                return (
                  <div key={j} onClick={e => { e.stopPropagation(); onEventClick(ev) }}
                    style={{
                      position: 'absolute', top, height: ht, left: 2, right: 2,
                      background: ev.isTask ? `${TASK_COLOR}25` : ev.color,
                      color: ev.isTask ? TASK_COLOR : '#fff',
                      borderRadius: 5, padding: '2px 4px',
                      fontSize: 9, cursor: 'pointer', overflow: 'hidden',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                      border: ev.isTask ? `1px solid ${TASK_COLOR}50` : '1px solid rgba(255,255,255,0.15)',
                      fontWeight: 600, zIndex: 10,
                    }}>
                    <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ev.title}</div>
                    {ht > 26 && <div style={{ fontSize: 8, opacity: 0.85 }}>{formatTime(ev.startTime)}</div>}
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ────────────────────────────────────────────────────────────── */
/*  DAY VIEW                                                      */
/* ────────────────────────────────────────────────────────────── */
function DayView({ currentDate, eventsByDate, onDateClick, onEventClick }) {
  const { t, i18n } = useTranslation()
  const isAr = i18n.language === 'ar' || i18n.language?.startsWith('ar')
  const locale = isAr ? 'ar-EG' : 'en-US'

  const hours = Array.from({ length: 24 }, (_, i) => i)
  const today = new Date()
  const ds = toISO(currentDate)
  const evs = eventsByDate[ds] || []
  const timed = evs.filter(e => !e.allDay && e.startTime)
  const allDay = evs.filter(e => e.allDay || !e.startTime)
  const isToday = isSameDay(currentDate, today)

  const scrollRef = useRef(null)

  // Auto-scroll to 8 AM on mount
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 8 * 60
    }
  }, [])

  return (
    <div className="cal-day-container">
      {/* Header */}
      <div className="cal-day-header">
        <div style={{ flex: 1, textAlign: 'center', cursor: 'pointer' }} onClick={() => onDateClick(currentDate)}>
          <div style={{ fontSize: 11, color: isToday ? 'var(--color-primary)' : 'var(--color-text-muted)', fontWeight: 700, letterSpacing: '0.04em' }}>
            {new Intl.DateTimeFormat(locale, { weekday: 'long' }).format(currentDate)}
          </div>
          <div style={{
            fontSize: 24, fontWeight: isToday ? 700 : 400,
            color: isToday ? '#fff' : 'var(--color-text)',
            background: isToday ? 'var(--color-primary)' : 'transparent',
            width: 38, height: 38, lineHeight: '38px', borderRadius: '50%', margin: '2px auto 2px',
          }}>
            {currentDate.getDate()}
          </div>
          <HijriTag date={currentDate} isAr={isAr} />
        </div>
      </div>

      {/* Body */}
      <div className="cal-day-scroll-body hide-scrollbar" ref={scrollRef}>
        <div className="cal-day-time-col">
          {hours.map(h => (
            <div key={h} style={{ height: 60, position: 'relative' }}>
              {h > 0 && (
                <div style={{ position: 'absolute', top: -7, right: 6, fontSize: 10, color: 'var(--color-text-muted)', textAlign: 'right' }}>
                  {h === 12 ? '12 PM' : h > 12 ? `${h - 12} PM` : `${h} AM`}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="cal-day-slot-area">
          {hours.map(h => (
            <div key={h} style={{ height: 60, borderBottom: '1px solid var(--color-border-subtle)', cursor: 'pointer' }} onClick={() => onDateClick(currentDate)} />
          ))}

          {/* All-day strip */}
          <div style={{ position: 'absolute', top: 2, left: 0, right: 0, display: 'flex', flexDirection: 'column', gap: 3, padding: '0 8px', zIndex: 5 }}>
            {allDay.map((ev, j) => (
              <div key={j} onClick={e => { e.stopPropagation(); onEventClick(ev) }}
                style={{
                  background: ev.isTask ? `${TASK_COLOR}20` : ev.color,
                  color: ev.isTask ? TASK_COLOR : '#fff',
                  fontSize: 12, padding: '5px 10px', borderRadius: 7, cursor: 'pointer', fontWeight: 600,
                  borderLeft: ev.isTask ? `3px solid ${TASK_COLOR}` : 'none',
                  display: 'flex', alignItems: 'center', gap: 6,
                }}>
                {ev.isTask && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><polyline points="20,6 9,17 4,12" /></svg>}
                {ev.title}
              </div>
            ))}
          </div>

          {/* Timed events */}
          {timed.map((ev, j) => {
            const top = parseTime(ev.startTime)
            const ht = Math.max((ev.endTime ? parseTime(ev.endTime) : top + 60) - top, 28)
            return (
              <div key={j} onClick={e => { e.stopPropagation(); onEventClick(ev) }}
                style={{
                  position: 'absolute', top, height: ht, left: 6, right: 10,
                  background: ev.isTask ? `${TASK_COLOR}22` : ev.color,
                  color: ev.isTask ? TASK_COLOR : '#fff',
                  borderRadius: 8, padding: '5px 8px',
                  fontSize: 12, cursor: 'pointer', overflow: 'hidden',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
                  border: ev.isTask ? `1px solid ${TASK_COLOR}50` : '1px solid rgba(255,255,255,0.15)',
                  fontWeight: 600, zIndex: 10,
                }}>
                <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                  {ev.isTask && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><polyline points="20,6 9,17 4,12" /></svg>}
                  {ev.title}
                </div>
                {ht > 34 && <div style={{ fontSize: 10, opacity: 0.85, marginTop: 2 }}>{formatTime(ev.startTime)}{ev.endTime ? ` – ${formatTime(ev.endTime)}` : ''}</div>}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

/* ────────────────────────────────────────────────────────────── */
/*  YEAR VIEW                                                     */
/* ────────────────────────────────────────────────────────────── */
function YearView({ currentDate, eventsByDate, onDateClick }) {
  const { t, i18n } = useTranslation()
  const isAr = i18n.language === 'ar' || i18n.language?.startsWith('ar')
  const locale = isAr ? 'ar-EG' : 'en-US'
  const year = currentDate.getFullYear()
  const today = new Date()

  const yearMiniDays = useMemo(() => {
    const sunday = new Date(2023, 0, 1)
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(sunday)
      d.setDate(sunday.getDate() + i)
      return new Intl.DateTimeFormat(locale, { weekday: 'narrow' }).format(d)
    })
  }, [locale])

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(145px,1fr))', gap: 14, overflowY: 'auto', flex: 1, alignContent: 'start', padding: 2 }} className="hide-scrollbar">
      {Array.from({ length: 12 }, (_, month) => {
        const firstDay = new Date(year, month, 1).getDay()
        const days = new Date(year, month + 1, 0).getDate()
        const cells = Array(firstDay).fill(null)
        for (let i = 1; i <= days; i++) cells.push(new Date(year, month, i))

        return (
          <div key={month} style={{
            background: 'var(--color-surface-2)',
            border: '1px solid var(--color-border)',
            borderRadius: 12, padding: '12px 10px',
          }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)', marginBottom: 8 }}>
              {new Intl.DateTimeFormat(locale, { month: 'long' }).format(new Date(year, month, 1))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: '1px 0', marginBottom: 4 }}>
              {yearMiniDays.map((d, i) => (
                <div key={i} style={{ textAlign: 'center', fontSize: 9, color: 'var(--color-text-muted)', fontWeight: 700 }}>{d}</div>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 1 }}>
              {cells.map((dateObj, i) => {
                if (!dateObj) return <div key={i} />
                const ds = toISO(dateObj)
                const evs = eventsByDate[ds] || []
                const hasEv = evs.some(e => !e.isTask)
                const hasTask = evs.some(e => e.isTask)
                const isToday = isSameDay(dateObj, today)
                return (
                  <div key={i} onClick={() => onDateClick(dateObj)}
                    title={`${dateObj.toDateString()}${evs.length ? ' · ' + evs.length + ' event(s)' : ''}`}
                    style={{
                      aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 10, cursor: 'pointer', borderRadius: '50%',
                      background: isToday ? 'var(--color-primary)' : hasEv ? 'var(--color-surface-3)' : 'transparent',
                      color: isToday ? '#fff' : 'var(--color-text)',
                      fontWeight: isToday || hasEv ? 700 : 400,
                      outline: hasTask && !isToday ? `2px solid ${TASK_COLOR}55` : 'none',
                      outlineOffset: 1,
                      transition: 'all 0.1s',
                    }}
                    onMouseEnter={e => { if (!isToday) e.currentTarget.style.background = 'var(--color-surface-3)' }}
                    onMouseLeave={e => { if (!isToday) e.currentTarget.style.background = hasEv ? 'var(--color-surface-3)' : 'transparent' }}
                  >
                    {dateObj.getDate()}
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

/* ────────────────────────────────────────────────────────────── */
/*  SCHEDULE / AGENDA VIEW                                        */
/* ────────────────────────────────────────────────────────────── */
function ScheduleView({ eventsByDate, onEventClick, onAddClick }) {
  const { t, i18n } = useTranslation()
  const isAr = i18n.language === 'ar' || i18n.language?.startsWith('ar')
  const locale = isAr ? 'ar-EG' : 'en-US'
  const todayStr = toISO(new Date())
  const sorted = Object.keys(eventsByDate).sort().filter(ds => eventsByDate[ds]?.length > 0)

  if (!sorted.length) return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 14, color: 'var(--color-text-muted)', padding: 24, textAlign: 'center' }}>
      <div style={{
        width: 64, height: 64, borderRadius: '50%', background: 'var(--color-surface-2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28,
        border: '1px solid var(--color-border)',
      }}>
        📅
      </div>
      <div>
        <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text)', marginBottom: 4 }}>{t('calendar.noEvents')}</div>
      </div>
      {onAddClick && (
        <Button variant="primary" onClick={onAddClick}>
          {t('calendar.addEvent')}
        </Button>
      )}
    </div>
  )

  return (
    <div className="cal-schedule-wrap hide-scrollbar">
      <div className="cal-schedule-inner">
        {sorted.map(ds => {
          const evs = eventsByDate[ds]
          const d = new Date(ds + 'T12:00:00')
          const isToday = ds === todayStr
          const h = toHijri(d, isAr)
          return (
            <div key={ds} className="cal-schedule-group">
              {/* Date column */}
              <div className="cal-schedule-date-col">
                <div style={{ fontSize: 10, fontWeight: 700, color: isToday ? 'var(--color-primary)' : 'var(--color-text-muted)', letterSpacing: '0.04em' }}>
                  {new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(d)}
                </div>
                <div style={{
                  fontSize: 20, fontWeight: isToday ? 700 : 500,
                  color: isToday ? '#fff' : 'var(--color-text)',
                  background: isToday ? 'var(--color-primary)' : 'transparent',
                  width: 36, height: 36, lineHeight: '36px', borderRadius: '50%', margin: '2px auto 2px',
                }}>
                  {d.getDate()}
                </div>
                {h && <div style={{ fontSize: 9, color: '#10B981', fontWeight: 600, lineHeight: 1.2 }}>{h.day}<br />{h.monthShort}</div>}
              </div>

              {/* Events */}
              <div className="cal-schedule-cards">
                {evs.map((ev, i) => (
                  <Card interactive key={i} onClick={() => onEventClick(ev)}
                    className="cal-schedule-card"
                    style={{ borderLeft: `4px solid ${ev.isTask ? TASK_COLOR : ev.color}` }}
                  >
                    <div style={{
                      width: 44, fontSize: 11, color: 'var(--color-text-muted)', fontWeight: 600, flexShrink: 0,
                    }}>
                      {ev.allDay ? t('calendar.allDay') : ev.startTime ? formatTime(ev.startTime) : ''}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: 6 }}>
                        {ev.isTask && <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={TASK_COLOR} strokeWidth="2.5" strokeLinecap="round"><polyline points="20,6 9,17 4,12" /><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" /></svg>}
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ev.title}</span>
                      </div>
                      {ev.location && <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>📍 {ev.location}</div>}
                    </div>
                    {ev.isTask && (
                      <Badge size="sm" style={{ background: `${TASK_COLOR}14`, color: TASK_COLOR, border: `1px solid ${TASK_COLOR}30` }}>
                        {t('nav.tasks')}
                      </Badge>
                    )}
                  </Card>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ────────────────────────────────────────────────────────────── */
/*  MAIN CALENDAR PAGE                                            */
/* ────────────────────────────────────────────────────────────── */
export default function Calendar() {
  const { t, i18n } = useTranslation()
  const isAr = i18n.language === 'ar' || i18n.language?.startsWith('ar')
  const locale = isAr ? 'ar-EG' : 'en-US'
  const { toastSuccess, toastError } = useToast()

  const [view, setView] = useState('month')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [newDate, setNewDate] = useState(null)
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [hiddenCategories, setHiddenCategories] = useState(new Set())
  const [showTasks, setShowTasks] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Custom user calendars (persisted in localStorage)
  const [customCalendars, setCustomCalendars] = useState(() => {
    try {
      const saved = localStorage.getItem('pillar_user_calendars')
      return saved ? JSON.parse(saved) : []
    } catch { return [] }
  })

  // Other subscribed calendars (persisted in localStorage)
  const [otherCalendars, setOtherCalendars] = useState(() => {
    try {
      const saved = localStorage.getItem('pillar_other_calendars')
      return saved ? JSON.parse(saved) : []
    } catch { return [] }
  })
  const [hiddenOtherCalendars, setHiddenOtherCalendars] = useState(new Set())

  // Other action modal state
  const [activeOtherModal, setActiveOtherModal] = useState(null)

  const saveCustomCalendars = (updated) => {
    setCustomCalendars(updated)
    try { localStorage.setItem('pillar_user_calendars', JSON.stringify(updated)) } catch { }
  }

  const saveOtherCalendars = (updated) => {
    setOtherCalendars(updated)
    try { localStorage.setItem('pillar_other_calendars', JSON.stringify(updated)) } catch { }
  }

  // Derive categories strictly from actual events + user-created custom calendars
  const categories = useMemo(() => {
    const map = {}
    customCalendars.forEach(c => {
      const key = c.name.trim().toLowerCase()
      if (key) map[key] = { name: c.name.trim(), color: c.color || '#6366F1' }
    })
    events.forEach(ev => {
      if (!ev.isTask && ev.category) {
        const cat = ev.category.trim()
        const key = cat.toLowerCase()
        if (key && !map[key]) {
          map[key] = {
            name: cat.charAt(0).toUpperCase() + cat.slice(1),
            color: ev.color || '#6366F1',
          }
        }
      }
    })
    return map
  }, [events, customCalendars])

  const fetchEvents = useCallback(async () => {
    setLoading(true)
    try {
      const y = currentDate.getFullYear()
      const m = currentDate.getMonth() + 1
      const pm = m === 1 ? 12 : m - 1, py = m === 1 ? y - 1 : y
      const nm = m === 12 ? 1 : m + 1, ny = m === 12 ? y + 1 : y

      let calReqs
      // High-performance optimization: for schedule and year views, fetch range in a single query
      if (view === 'year') {
        calReqs = [calendarApi.range(`${y}-01-01`, `${y}-12-31`).catch(() => [])]
      } else if (view === 'schedule') {
        const startISO = toISO(new Date(y, m - 1, 1))
        const endISO = toISO(new Date(y, m + 2, 0))
        calReqs = [calendarApi.range(startISO, endISO).catch(() => [])]
      } else {
        calReqs = [
          calendarApi.month(py, pm).catch(() => []),
          calendarApi.month(y, m).catch(() => []),
          calendarApi.month(ny, nm).catch(() => []),
        ]
      }

      const [calRes, tasksData] = await Promise.all([
        Promise.all(calReqs),
        tasksApi.list({ trash: false }).catch(() => []),
      ])

      const unique = Array.from(new Map(calRes.flat().map(e => [e.id, e])).values())
        .map(ev => ({
          ...ev,
          category: ev.category?.trim() || 'General',
          color: ev.color || '#6366F1',
        }))

      const taskEvs = (tasksData || [])
        .filter(t => (t.due_date || t.dueDate) && !(t.in_trash || t.inTrash) && !t.done)
        .map(t => ({
          id: `task-${t.id}`, taskId: t.id, isTask: true,
          title: t.text,
          startDate: t.due_date || t.dueDate,
          startTime: t.due_time || t.dueTime || null,
          endTime: null,
          allDay: !(t.due_time || t.dueTime),
          color: TASK_COLOR,
          category: t.list || t.list_name || 'Tasks',
          priority: t.priority,
          description: t.notes || '',
        }))

      setEvents([...unique, ...taskEvs])
    } catch {
      toastError('Could not load calendar events')
      setEvents([])
    } finally {
      setLoading(false)
    }
  }, [currentDate.getFullYear(), currentDate.getMonth(), view, toastError])

  useEffect(() => { fetchEvents() }, [fetchEvents])

  const navigate = (dir) => {
    const d = new Date(currentDate)
    if (view === 'year') d.setFullYear(d.getFullYear() + dir)
    else if (view === 'schedule') d.setMonth(d.getMonth() + dir)
    else if (view === 'month') d.setMonth(d.getMonth() + dir)
    else if (view === 'week') d.setDate(d.getDate() + dir * 7)
    else if (view === 'day') d.setDate(d.getDate() + dir)
    setCurrentDate(d)
  }

  const handleCreate = async data => {
    try {
      const ev = await calendarApi.create(data)
      setEvents(p => [...p, { ...ev, category: ev.category?.trim() || 'General', color: ev.color || '#6366F1' }])
      setShowModal(false)
      toastSuccess('Event created')
      return ev
    } catch {
      toastError('Failed to create event')
      return null
    }
  }

  const handleDelete = async id => {
    try {
      await calendarApi.delete(id)
      setEvents(e => e.filter(x => x.id !== id))
      setSelectedEvent(null)
      toastSuccess('Event deleted')
    } catch { toastError('Failed to delete event') }
  }

  const handleDateClick = date => {
    if (view === 'year') { setCurrentDate(date); setView('day'); return }
    setNewDate(date); setShowModal(true)
  }

  const toggleCategory = catKey => {
    setHiddenCategories(p => { const n = new Set(p); n.has(catKey) ? n.delete(catKey) : n.add(catKey); return n })
  }

  const toggleOtherCalendar = id => {
    setHiddenOtherCalendars(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n })
  }

  const visibleEvents = useMemo(() => events.filter(e => {
    if (e.isTask) return showTasks
    const key = (e.category || '').trim().toLowerCase()
    return !hiddenCategories.has(key)
  }), [events, hiddenCategories, showTasks])

  const eventsByDate = useMemo(() => {
    const map = {}
    visibleEvents.forEach(ev => { if (!map[ev.startDate]) map[ev.startDate] = []; map[ev.startDate].push(ev) })
    return map
  }, [visibleEvents])

  // Header text
  let headerText = ''
  if (view === 'year') {
    headerText = `${currentDate.getFullYear()}`
  } else if (view === 'month' || view === 'schedule') {
    headerText = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(currentDate)
  } else if (view === 'week') {
    const s = new Date(currentDate); s.setDate(currentDate.getDate() - currentDate.getDay())
    const e = new Date(s); e.setDate(s.getDate() + 6)
    if (s.getMonth() === e.getMonth()) {
      headerText = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(s)
    } else if (s.getFullYear() === e.getFullYear()) {
      const sM = new Intl.DateTimeFormat(locale, { month: 'short' }).format(s)
      const eM = new Intl.DateTimeFormat(locale, { month: 'short' }).format(e)
      headerText = `${sM} – ${eM} ${s.getFullYear()}`
    } else {
      const sM = new Intl.DateTimeFormat(locale, { month: 'short', year: '2-digit' }).format(s)
      const eM = new Intl.DateTimeFormat(locale, { month: 'short', year: '2-digit' }).format(e)
      headerText = `${sM} – ${eM}`
    }
  } else if (view === 'day') {
    headerText = new Intl.DateTimeFormat(locale, { month: 'long', day: 'numeric', year: 'numeric' }).format(currentDate)
  }

  const hijriHeader = useMemo(() => {
    if (view === 'month' || view === 'schedule') return toHijri(new Date(currentDate.getFullYear(), currentDate.getMonth(), 1), isAr)
    if (view === 'day') return toHijri(currentDate, isAr)
    return null
  }, [view, currentDate, isAr])

  const taskCount = useMemo(() => events.filter(e => e.isTask).length, [events])

  const handleOpenOtherAction = (key) => {
    if (key === 'create') setActiveOtherModal('create')
    else if (key === 'subscribe') setActiveOtherModal('subscribe')
    else if (key === 'url') setActiveOtherModal('url')
    else if (key === 'browse') setActiveOtherModal('subscribe')
  }

  const handleSaveNewCalendar = (data) => {
    const newCal = { id: `cal-${Date.now()}`, ...data }
    saveCustomCalendars([...customCalendars, newCal])
    setActiveOtherModal(null)
    toastSuccess(`Calendar "${data.name}" created`)
  }

  const handleSaveSubscribedCalendar = (data) => {
    const newCal = { id: `sub-${Date.now()}`, ...data }
    saveOtherCalendars([...otherCalendars, newCal])
    setActiveOtherModal(null)
    toastSuccess(`Subscribed to "${data.name}"`)
  }

  return (
    <div className="page cal-page">

      {/* ── Top Bar ── */}
      <div className="cal-topbar">
        {/* Left: menu toggle + navigation + title */}
        <div className="cal-topbar-left">
          {/* Hamburger button (mobile only) */}
          <IconButton
            variant="ghost"
            className="cal-menu-btn"
            onClick={() => setSidebarOpen(v => !v)}
            ariaLabel="Toggle calendar sidebar"
            icon={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            }
          />

          {/* Today button */}
          <Button
            variant="ghost"
            className="cal-today-btn"
            onClick={() => setCurrentDate(new Date())}
          >
            {t('calendar.today')}
          </Button>

          {/* Prev / Next buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton variant="ghost" className="cal-nav-btn" onClick={() => navigate(-1)} ariaLabel="Previous" icon={
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15,18 9,12 15,6" /></svg>
            } />
            <IconButton variant="ghost" className="cal-nav-btn" onClick={() => navigate(1)} ariaLabel="Next" icon={
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9,18 15,12 9,6" /></svg>
            } />
          </div>

          {/* Header title */}
          <div className="cal-header-title-wrap">
            <div className="cal-header-title">
              {headerText}
            </div>
            {hijriHeader && (
              <div className="cal-header-hijri">
                {hijriHeader.day} {hijriHeader.month} {hijriHeader.year} {isAr ? 'هـ' : 'AH'}
              </div>
            )}
          </div>
        </div>

        {/* Right: view select + create button (desktop) */}
        <div className="cal-topbar-right">
          <select
            className="input cal-view-select"
            value={view}
            onChange={e => setView(e.target.value)}
            style={{ padding: '6px 12px', borderRadius: 8, background: 'var(--color-surface-2)', fontWeight: 600, fontSize: 13, height: 34, border: '1px solid var(--color-border)', cursor: 'pointer' }}
          >
            <option value="month">{t('calendar.month')}</option>
            <option value="week">{t('calendar.week')}</option>
            <option value="day">{t('calendar.day')}</option>
            <option value="schedule">{t('calendar.schedule')}</option>
            <option value="year">{t('calendar.year')}</option>
          </select>
          <Button
            variant="primary"
            className="cal-desktop-create"
            onClick={() => { setNewDate(currentDate); setShowModal(true) }}
            style={{ height: 34 }}
            icon={
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            }
          >
            {t('calendar.addEvent')}
          </Button>
        </div>
      </div>

      {/* ── Mobile view selector row ── */}
      <div className="cal-mobile-view-row">
        {[
          { k: 'month', l: t('calendar.month') },
          { k: 'week', l: t('calendar.week') },
          { k: 'day', l: t('calendar.day') },
          { k: 'schedule', l: t('calendar.schedule') },
          { k: 'year', l: t('calendar.year') },
        ].map(v => (
          <button
            key={v.k}
            className={`cal-view-tab ${view === v.k ? 'cal-view-tab--active' : ''}`}
            onClick={() => setView(v.k)}
          >
            {v.l}
          </button>
        ))}
      </div>

      {/* ── Main Body: Sidebar + Views ── */}
      <div className="cal-body">
        {/* Sidebar (desktop static, mobile drawer) */}
        <div className="cal-sidebar-wrapper">
          <CalendarSidebar
            categories={categories}
            hiddenCategories={hiddenCategories}
            toggleCategory={toggleCategory}
            showTasks={showTasks}
            setShowTasks={setShowTasks}
            taskCount={taskCount}
            otherCalendars={otherCalendars}
            hiddenOtherCalendars={hiddenOtherCalendars}
            toggleOtherCalendar={toggleOtherCalendar}
            onOpenOtherAction={handleOpenOtherAction}
            sidebarOpen={sidebarOpen}
            setSidebarOpen={setSidebarOpen}
          />
        </div>

        {/* Calendar View Area */}
        <div className="cal-content">
          {loading ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                border: '3px solid var(--color-border)',
                borderTopColor: 'var(--color-primary)',
                animation: 'spin 0.7s linear infinite',
              }} />
              <div style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>Loading events…</div>
            </div>
          ) : (
            <>
              {view === 'year' && (
                <YearView currentDate={currentDate} eventsByDate={eventsByDate} onDateClick={handleDateClick} />
              )}
              {view === 'month' && (
                <MonthView
                  currentDate={currentDate}
                  eventsByDate={eventsByDate}
                  onDateClick={handleDateClick}
                  onEventClick={setSelectedEvent}
                />
              )}
              {view === 'week' && (
                <WeekView
                  currentDate={currentDate}
                  eventsByDate={eventsByDate}
                  onDateClick={handleDateClick}
                  onEventClick={setSelectedEvent}
                />
              )}
              {view === 'day' && (
                <DayView
                  currentDate={currentDate}
                  eventsByDate={eventsByDate}
                  onDateClick={handleDateClick}
                  onEventClick={setSelectedEvent}
                />
              )}
              {view === 'schedule' && (
                <ScheduleView
                  eventsByDate={eventsByDate}
                  onEventClick={setSelectedEvent}
                  onAddClick={() => { setNewDate(currentDate); setShowModal(true) }}
                />
              )}
            </>
          )}
        </div>
      </div>

      {/* ── Mobile Floating Action Button (FAB) ── */}
      <IconButton
        variant="primary"
        className="cal-fab"
        onClick={() => { setNewDate(currentDate); setShowModal(true) }}
        ariaLabel="Create new event"
        icon={<span style={{ fontSize: 24, lineHeight: 1 }}>+</span>}
      />

      {/* ── Event Modals ── */}
      {showModal && (
        <NewEventModal
          initialDate={newDate}
          categories={categories}
          onSave={handleCreate}
          onClose={() => setShowModal(false)}
        />
      )}
      {selectedEvent && (
        <ViewEventModal
          event={selectedEvent}
          onDelete={handleDelete}
          onClose={() => setSelectedEvent(null)}
        />
      )}

      {/* ── Calendar Management Modals ── */}
      {activeOtherModal === 'create' && (
        <NewCalendarModal
          onSave={handleSaveNewCalendar}
          onClose={() => setActiveOtherModal(null)}
        />
      )}
      {(activeOtherModal === 'subscribe' || activeOtherModal === 'url') && (
        <SubscribeCalendarModal
          mode={activeOtherModal}
          onSave={handleSaveSubscribedCalendar}
          onClose={() => setActiveOtherModal(null)}
        />
      )}
    </div>
  )
}
