/**
 * NewHabitModal.jsx — Migrated to Design System
 *
 * Changes from original:
 * - Entire backdrop + dialog shell → <Modal> compound component
 *   (createPortal, AnimatePresence, focus trap, Escape, scroll-lock)
 * - Habit name <input className="input"> → <Input> with autoFocus
 * - Goal amount <input className="input"> → <Input type="number">
 * - Goal unit <select> unchanged (no Select primitive yet)
 * - Notes <textarea> unchanged (no Textarea primitive yet)
 * - Reminder time <input type="time"> → <Input type="time">
 * - Back/Cancel button → <Button variant="ghost">
 * - Next/Save button  → <Button variant="primary"> with accent colour via style override
 * - All .btn / .btn-primary / .btn-ghost classes removed
 */
import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { WEEKDAYS } from '../../utils/habitDateUtils'
import Modal  from '../ui/Modal'
import Button from '../ui/Button'
import Input  from '../ui/Input'
import habitsService from '../../api/habitsService'
import { HABIT_PRESETS } from '../../data/habitPresets'
import { toTimeInputValue } from '../../utils/timeUtils'

/* ── Constants ──────────────────────────────────────────────── */
const HABIT_COLORS = [
  '#F43F5E', '#F97316', '#F59E0B', '#10B981',
  '#14B8A6', '#0EA5E9', '#3B82F6', '#6366F1',
  '#8B5CF6', '#EC4899',
]

const EMOJI_LIST = [
  '🏃', '📚', '🧘', '🍎', '💧', '🚿', '✍️', '🚶',
  '🏋️', '🎯', '🌱', '☕', '🥗', '🎨', '💪', '🧠',
  '🛌', '🌅', '📝', '🏊', '🚴', '⚽', '📖', '📿',
  '🤲', '🌌', '💡', '🎸', '🧹', '🍵', '💻', '⏱️',
]

const STARTER_TEMPLATES = [
  {
    category: 'Faith & Spiritual 🕌',
    category_ar: 'الجانب الإيماني والروحي 🕌',
    items: [
      { name: 'Quran Reading (Khatmah)', name_ar: 'قراءة القرآن (الختمة)', emoji: '📖', color: '#10B981', goal_amount: 2, goal_unit: 'pages', areas: ['Faith'] },
      { name: 'Morning Adhkar', name_ar: 'أذكار الصباح', emoji: '🌅', color: '#F59E0B', goal_amount: 1, goal_unit: 'times', areas: ['Faith'] },
      { name: 'Evening Adhkar', name_ar: 'أذكار المساء', emoji: '🌆', color: '#6366F1', goal_amount: 1, goal_unit: 'times', areas: ['Faith'] },
      { name: 'Tahajjud / Night Prayer', name_ar: 'قيام الليل / التهجد', emoji: '🌌', color: '#6366F1', goal_amount: 1, goal_unit: 'times', areas: ['Faith'] },
      { name: 'Daily Gratitude & Dua', name_ar: 'الدعاء وشكر النعم', emoji: '🤲', color: '#14B8A6', goal_amount: 1, goal_unit: 'times', areas: ['Faith'] },
    ],
  },
  {
    category: 'Mindfulness & Health 🧘',
    category_ar: 'الصحة والنشاط البدني 🧘',
    items: [
      { name: 'Hydration (Drink 2L Water)', name_ar: 'شرب 2 لتر ماء', emoji: '💧', color: '#0EA5E9', goal_amount: 8, goal_unit: 'glasses', areas: ['Health & Fitness'] },
      { name: 'Daily Movement / Walk', name_ar: 'النشاط البدني / المشي', emoji: '🏃', color: '#10B981', goal_amount: 30, goal_unit: 'mins', areas: ['Health & Fitness'] },
      { name: 'Morning Meditation', name_ar: 'التأمل الصباحي', emoji: '🧘', color: '#8B5CF6', goal_amount: 15, goal_unit: 'mins', areas: ['Health & Fitness'] },
      { name: '8 Hours Sleep', name_ar: 'نوم 8 ساعات', emoji: '🛌', color: '#6366F1', goal_amount: 8, goal_unit: 'hrs', areas: ['Health & Fitness'] },
    ],
  },
  {
    category: 'Productivity & Focus 🎯',
    category_ar: 'الإنتاجية والتركيز 🎯',
    items: [
      { name: 'Plan the Day', name_ar: 'تخطيط مهام اليوم', emoji: '📝', color: '#F97316', goal_amount: 1, goal_unit: 'times', areas: ['Productivity'] },
      { name: '90-Min Deep Work Session', name_ar: 'جلسة تركيز 90 دقيقة', emoji: '🎯', color: '#3B82F6', goal_amount: 90, goal_unit: 'mins', areas: ['Productivity'] },
      { name: 'Read 20 Pages', name_ar: 'قراءة 20 صفحة', emoji: '📚', color: '#F59E0B', goal_amount: 20, goal_unit: 'pages', areas: ['Productivity'] },
      { name: 'Clean Desk & Inbox Zero', name_ar: 'ترتيب المكتب وتفريغ البريد', emoji: '🧹', color: '#8B5CF6', goal_amount: 1, goal_unit: 'times', areas: ['Productivity'] },
    ],
  },
  {
    category: 'Fitness 🏋️',
    category_ar: 'اللياقة والقوة 🏋️',
    items: [
      { name: 'Gym / Strength Training', name_ar: 'تمارين القوة / النادي', emoji: '🏋️', color: '#F43F5E', goal_amount: 1, goal_unit: 'times', areas: ['Health & Fitness'] },
      { name: 'Stretching & Mobility', name_ar: 'تمارين الإطالة والمرونة', emoji: '🤸', color: '#10B981', goal_amount: 15, goal_unit: 'mins', areas: ['Health & Fitness'] },
      { name: 'Healthy Nutritious Meal', name_ar: 'وجبة صحية متوازنة', emoji: '🥗', color: '#14B8A6', goal_amount: 3, goal_unit: 'times', areas: ['Health & Fitness'] },
    ],
  },
]

/* ═══════════════════════════════════════════════════════════ */

export default function NewHabitModal({ onSave, onClose, areas = [], onAreaCreated }) {
  const { t, i18n } = useTranslation()
  const isAr = i18n.language?.startsWith('ar')
  const nameRef = useRef(null)

  const [activeTab,      setActiveTab]      = useState('custom')  // 'custom' | 'templates'
  const [step,           setStep]           = useState(1)         // 1..3

  const [name,           setName]           = useState('')
  const [emoji,          setEmoji]          = useState('🎯')
  const [color,          setColor]          = useState(HABIT_COLORS[0])
  const [customEmoji,    setCustomEmoji]    = useState('')

  const [goalAmount,     setGoalAmount]     = useState(1)
  const [goalUnit,       setGoalUnit]       = useState('times')
  const [frequency,      setFrequency]      = useState('daily')
  const [frequencyDays,  setFrequencyDays]  = useState([0,1,2,3,4,5,6])
  const [selectedAreas,  setSelectedAreas]  = useState(['Faith'])
  const [reminder,       setReminder]       = useState('')
  const [notes,          setNotes]          = useState('')

  const [availableAreas, setAvailableAreas] = useState(() => {
    const defaultList = ['Faith', 'Health & Fitness', 'Productivity', 'Morning', 'Afternoon', 'Evening', 'Anytime']
    const names = (areas || []).map(a => typeof a === 'string' ? a : a.name).filter(Boolean)
    return Array.from(new Set([...defaultList, ...names]))
  })
  const [isAddingArea,   setIsAddingArea]   = useState(false)
  const [newAreaInput,   setNewAreaInput]   = useState('')
  const [creatingArea,   setCreatingArea]   = useState(false)
  const [submitting,     setSubmitting]     = useState(false)

  // Fetch areas from backend if none were passed
  useEffect(() => {
    let isMounted = true
    if (!areas || areas.length === 0) {
      habitsService.getAreas().then(res => {
        if (!isMounted) return
        const names = (res || []).map(a => typeof a === 'string' ? a : a.name).filter(Boolean)
        if (names.length > 0) {
          setAvailableAreas(prev => Array.from(new Set([...prev, ...names])))
        }
      }).catch(() => {})
    }
    return () => { isMounted = false }
  }, [areas])

  /* ── Helpers ──────────────────────────────────────────────── */
  const toggleArea = (a) =>
    setSelectedAreas((prev) =>
      prev.includes(a) && prev.length > 1
        ? prev.filter((x) => x !== a)
        : prev.includes(a) ? prev : [...prev, a]
    )

  const toggleDay = (i) =>
    setFrequencyDays((prev) =>
      prev.includes(i) ? prev.filter((d) => d !== i) : [...prev, i].sort()
    )

  const applyTemplate = (tpl) => {
    const habitTitle = isAr && tpl.title_ar ? tpl.title_ar : (isAr && tpl.name_ar ? tpl.name_ar : (tpl.title || tpl.name))
    const habitArea = isAr && tpl.area_ar ? tpl.area_ar : (tpl.area || tpl.areas?.[0] || 'Faith')
    setName(habitTitle)
    setEmoji(tpl.emoji)
    setColor(tpl.color || '#10B981')
    setGoalAmount(tpl.goal_amount || tpl.target_count || 1)
    setGoalUnit(tpl.goal_unit || tpl.target_unit || 'times')
    setFrequency(tpl.frequency || 'daily')
    if (tpl.description || tpl.description_ar || tpl.notes) {
      setNotes(isAr && tpl.description_ar ? tpl.description_ar : (tpl.description || tpl.notes || ''))
    }
    if (habitArea) {
      setAvailableAreas(prev => Array.from(new Set([...prev, habitArea])))
      setSelectedAreas([habitArea])
    }
    setActiveTab('custom')
    setStep(1)
  }

  const handleCreateCustomArea = async () => {
    const trimmed = newAreaInput.trim()
    if (!trimmed || creatingArea) return
    setCreatingArea(true)
    try {
      const created = await habitsService.createArea({ name: trimmed, color })
      const areaName = created?.name || trimmed
      setAvailableAreas(prev => [...new Set([...prev, areaName])])
      setSelectedAreas(prev => [...new Set([...prev, areaName])])
      if (onAreaCreated) onAreaCreated(created)
      setNewAreaInput('')
      setIsAddingArea(false)
    } catch (err) {
      console.error('[NewHabitModal] Failed to create custom area:', err)
    } finally {
      setCreatingArea(false)
    }
  }

  const handleSave = async () => {
    if (!name.trim() || submitting) return
    setSubmitting(true)
    const payload = {
      name:           name.trim(),
      title:          name.trim(),
      emoji,
      color,
      goal_amount:    goalAmount,
      target_count:   goalAmount,
      goal_unit:      goalUnit,
      target_unit:    goalUnit,
      frequency,
      frequency_days: frequencyDays,
      areas:          selectedAreas,
      area:           selectedAreas[0] || null,
      reminder_time:  reminder || null,
      notes,
      description:    notes,
    }
    try {
      if (onSave) {
        await onSave(payload)
      } else {
        await habitsService.createHabit(payload)
      }
      onClose()
    } catch (err) {
      console.error('[NewHabitModal] Error saving habit:', err)
    } finally {
      setSubmitting(false)
    }
  }

  /* Derived styles for accent-coloured interactive elements */
  const accentBg     = `${color}18`
  const accentBorder = `${color}40`

  /* ── Dynamic Modal title & eyebrow ── */
  const eyebrow = activeTab === 'templates'
    ? 'Inspiration'
    : `New Habit · Step ${step} of 3`

  const title = activeTab === 'templates'
    ? 'Starter Habit Templates'
    : step === 1 ? 'Habit Details'
    : step === 2 ? 'Target & Frequency'
    : 'Schedule & Reminder'

  /* ── Render ───────────────────────────────────────────────── */
  return (
    <Modal isOpen onClose={onClose}>

      {/* ── Header ── */}
      <Modal.Header
        title={
          <div>
            <div className="habit-modal-eyebrow">{eyebrow}</div>
            <div style={{ marginTop: 2 }}>{title}</div>
          </div>
        }
        showCloseButton
      />

      {/* ── Custom / Templates Tab Switcher ── */}
      <div className="habit-modal-tabs">
        <button
          type="button"
          className={`habit-modal-tab ${activeTab === 'custom'    ? 'habit-modal-tab--active' : ''}`}
          onClick={() => setActiveTab('custom')}
        >
          Custom Habit
        </button>
        <button
          type="button"
          className={`habit-modal-tab ${activeTab === 'templates' ? 'habit-modal-tab--active' : ''}`}
          onClick={() => setActiveTab('templates')}
        >
          ✨ Starter Templates
        </button>
      </div>

      {/* ── Step progress bar (custom mode only) ── */}
      {activeTab === 'custom' && (
        <div className="habit-step-progress">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className="habit-step-bar"
              style={{ background: s <= step ? color : 'var(--color-surface-3)' }}
            />
          ))}
        </div>
      )}

      {/* ── Body ── */}
      <Modal.Body className="habit-modal-body">

        {/* ══ TEMPLATES BROWSER ══ */}
        {activeTab === 'templates' && (
          <div className="habit-templates-browser">
            {STARTER_TEMPLATES.map((grp) => (
              <div key={grp.category} className="habit-template-group">
                <div className="habit-template-group-title">
                  {isAr && grp.category_ar ? grp.category_ar : grp.category}
                </div>
                <div className="habit-templates-grid">
                  {grp.items.map((tpl) => {
                    const tplTitle = isAr && tpl.name_ar ? tpl.name_ar : tpl.name
                    const tplArea = isAr && tpl.area_ar ? tpl.area_ar : (tpl.areas?.[0] || 'Faith')
                    return (
                      <button
                        key={tpl.name}
                        type="button"
                        className="habit-template-card"
                        onClick={() => applyTemplate(tpl)}
                        style={{ '--tpl-color': tpl.color }}
                      >
                        <span className="habit-template-emoji">{tpl.emoji}</span>
                        <div className="habit-template-info">
                          <span className="habit-template-name">{tplTitle}</span>
                          <span className="habit-template-target">
                            {tpl.goal_amount > 1
                              ? `${tpl.goal_amount} ${tpl.goal_unit} · ${tplArea}`
                              : tplArea}
                          </span>
                        </div>
                        <span className="habit-template-use-btn">
                          {isAr ? '+ استخدام' : '+ Use'}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ══ STEP 1: BASICS ══ */}
        {activeTab === 'custom' && step === 1 && (
          <div className="habit-step-content">
            {/* ── Quick Templates / Presets Bar ── */}
            <div style={{ marginBottom: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <label className="habit-form-label" style={{ margin: 0, fontSize: 12, fontWeight: 700, color: 'var(--color-text-secondary)' }}>
                  {isAr ? '✨ قوالب واقتراحات جاهزة' : '✨ Quick Presets / Templates'}
                </label>
                <button
                  type="button"
                  onClick={() => setActiveTab('templates')}
                  style={{
                    fontSize: 11, color: color || 'var(--color-primary)', background: 'none',
                    border: 'none', cursor: 'pointer', padding: 0, fontWeight: 600,
                  }}
                >
                  {isAr ? 'تصفح كل القوالب ←' : 'Browse all templates →'}
                </button>
              </div>
              <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 6 }}>
                {HABIT_PRESETS.map((p) => {
                  const pTitle = isAr && p.title_ar ? p.title_ar : p.title
                  const isSelected = name === pTitle
                  return (
                    <button
                      key={p.key}
                      type="button"
                      onClick={() => applyTemplate(p)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '6px 12px',
                        borderRadius: 20,
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        background: isSelected ? `${p.color}25` : 'var(--color-surface-2)',
                        color: isSelected ? p.color : 'var(--color-text)',
                        border: `1px solid ${isSelected ? p.color : 'var(--color-border)'}`,
                        transition: 'all 150ms ease',
                      }}
                    >
                      <span>{p.emoji}</span>
                      <span>{pTitle}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="habit-form-group">
              <Input
                ref={nameRef}
                autoFocus
                label={isAr ? 'اسم العادة' : 'Habit Name'}
                placeholder={isAr ? 'مثال: شرب الماء، قراءة القرآن، جلسة تركيز…' : 'e.g. Morning Meditation, Read 20 Pages, Drink Water…'}
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && name.trim()) setStep(2) }}
              />
            </div>

            <div className="habit-emoji-color-row">
              {/* Emoji preview */}
              <div>
                <label className="habit-form-label">Icon Preview</label>
                <div
                  className="habit-big-emoji-preview"
                  style={{ background: accentBg, borderColor: accentBorder }}
                >
                  {emoji}
                </div>
              </div>

              {/* Accent colour + emoji picker */}
              <div style={{ flex: 1 }}>
                <label className="habit-form-label">Accent Color</label>
                <div className="habit-color-picker">
                  {HABIT_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`habit-color-swatch ${color === c ? 'habit-color-swatch--active' : ''}`}
                      style={{ background: c }}
                      aria-label={`Select color ${c}`}
                    />
                  ))}
                </div>

                <label className="habit-form-label" style={{ marginTop: 14 }}>Choose Icon</label>
                <div className="habit-emoji-picker-row">
                  {EMOJI_LIST.slice(0, 12).map((em) => (
                    <button
                      key={em}
                      type="button"
                      onClick={() => setEmoji(em)}
                      className={`habit-emoji-btn ${emoji === em ? 'habit-emoji-btn--active' : ''}`}
                      style={{
                        borderColor: emoji === em ? color     : undefined,
                        background:  emoji === em ? accentBg  : undefined,
                      }}
                    >
                      {em}
                    </button>
                  ))}
                  {/* Custom emoji input — uses Input primitive */}
                  <Input
                    placeholder="Emoji"
                    value={customEmoji}
                    wrapClassName="habit-custom-emoji-input-wrap"
                    onChange={(e) => {
                      setCustomEmoji(e.target.value)
                      if ([...e.target.value].length === 1) setEmoji(e.target.value)
                    }}
                    maxLength={4}
                    size="sm"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══ STEP 2: GOAL & FREQUENCY ══ */}
        {activeTab === 'custom' && step === 2 && (
          <div className="habit-step-content">
            <div className="habit-form-group">
              <label className="habit-form-label">Daily Goal Target</label>
              <div style={{ display: 'flex', gap: 10 }}>
                <Input
                  type="number"
                  min="1"
                  value={goalAmount}
                  onChange={(e) => setGoalAmount(Math.max(1, parseFloat(e.target.value) || 1))}
                  wrapClassName="habit-goal-amount-wrap"
                  style={{ width: 80, fontSize: 16, fontWeight: 700, textAlign: 'center' }}
                  size="md"
                />
                {/* Select not yet a design-system primitive — keeping native */}
                <select
                  className="input"
                  value={goalUnit}
                  onChange={(e) => setGoalUnit(e.target.value)}
                  style={{ flex: 1, fontSize: 14 }}
                >
                  <option value="times">times</option>
                  <option value="mins">minutes</option>
                  <option value="hrs">hours</option>
                  <option value="pages">pages</option>
                  <option value="glasses">glasses</option>
                  <option value="km">km</option>
                  <option value="ml">ml</option>
                  <option value="sessions">sessions</option>
                </select>
              </div>
              <span className="habit-form-hint">
                {goalAmount === 1
                  ? 'Simple binary habit (Done or Not Done each day).'
                  : `Quantified goal: track progress up to ${goalAmount} ${goalUnit} daily.`}
              </span>
            </div>

            <div className="habit-form-group">
              <label className="habit-form-label">Frequency</label>
              <div className="habit-freq-tabs">
                {[
                  { id: 'daily',         label: 'Every Day' },
                  { id: 'specific_days', label: 'Specific Days of Week' },
                ].map(({ id, label }) => {
                  const active = frequency === id
                  return (
                    <button
                      key={id}
                      type="button"
                      className={`habit-freq-tab ${active ? 'habit-freq-tab--active' : ''}`}
                      onClick={() => setFrequency(id)}
                      style={{
                        background:   active ? accentBg     : undefined,
                        color:        active ? color        : undefined,
                        borderColor:  active ? color        : undefined,
                      }}
                    >
                      {label}
                    </button>
                  )
                })}
              </div>

              {frequency === 'specific_days' && (
                <div className="habit-dow-row" style={{ marginTop: 12 }}>
                  {WEEKDAYS.map(({ day, label }) => {
                    const active = frequencyDays.includes(day)
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleDay(day)}
                        className={`habit-dow-btn ${active ? 'habit-dow-btn--active' : ''}`}
                        style={{
                          background:  active ? color  : undefined,
                          color:       active ? '#fff' : undefined,
                          borderColor: active ? color  : undefined,
                        }}
                      >
                        {label}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══ STEP 3: SCHEDULE & NOTES ══ */}
        {activeTab === 'custom' && step === 3 && (
          <div className="habit-step-content">
            <div className="habit-form-group">
              <label className="habit-form-label">Time of Day / Life Area</label>
              <div className="habit-areas-picker">
                {availableAreas.map((a) => {
                  const areaName = typeof a === 'object' ? a.name : a
                  const active = selectedAreas.includes(areaName)
                  const icon = areaName === 'Morning' ? '🌅 '
                    : areaName === 'Afternoon' ? '☀️ '
                    : areaName === 'Evening' ? '🌙 '
                    : areaName === 'Anytime' ? '🕒 '
                    : areaName === 'Faith' || areaName === 'الإيمان' ? '🕌 '
                    : areaName === 'Health & Fitness' || areaName === 'الصحة واللياقة' ? '💧 '
                    : areaName === 'Productivity' || areaName === 'الإنتاجية' ? '🎯 '
                    : '🏷️ '
                  return (
                    <button
                      key={areaName}
                      type="button"
                      onClick={() => toggleArea(areaName)}
                      className={`habit-area-select-pill ${active ? 'habit-area-select-pill--active' : ''}`}
                      style={{
                        background:  active ? accentBg     : undefined,
                        color:       active ? color        : undefined,
                        borderColor: active ? color        : undefined,
                      }}
                    >
                      {icon}
                      {areaName}
                    </button>
                  )
                })}
              </div>

              {/* Add custom area inline */}
              <div style={{ display: 'flex', gap: 8, marginTop: 10, alignItems: 'center' }}>
                {isAddingArea ? (
                  <div style={{ display: 'flex', gap: 6, width: '100%', alignItems: 'center' }}>
                    <Input
                      placeholder="New area name (e.g. Career, Health)"
                      value={newAreaInput}
                      onChange={(e) => setNewAreaInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleCreateCustomArea() }}
                      autoFocus
                      style={{ height: 32, fontSize: 13 }}
                    />
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleCreateCustomArea}
                      disabled={!newAreaInput.trim() || creatingArea}
                      style={{ background: color, borderColor: color }}
                    >
                      {creatingArea ? 'Adding…' : 'Add'}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => { setIsAddingArea(false); setNewAreaInput('') }}
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="habit-area-select-pill"
                    onClick={() => setIsAddingArea(true)}
                    style={{ borderStyle: 'dashed', opacity: 0.8 }}
                  >
                    + Add Custom Area
                  </button>
                )}
              </div>
            </div>

            <div className="habit-form-group">
              <Input
                label="Daily Reminder (Optional)"
                type="time"
                value={toTimeInputValue(reminder)}
                onChange={(e) => setReminder(e.target.value)}
                wrapClassName="habit-reminder-wrap"
              />
            </div>

            <div className="habit-form-group">
              <label className="habit-form-label">Motivation & Notes (Optional)</label>
              <textarea
                className="input habit-drawer-notes"
                placeholder="Why this habit matters, or how to stick to it…"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>
        )}
      </Modal.Body>

      {/* ── Footer (custom mode only) ── */}
      {activeTab === 'custom' && (
        <Modal.Footer spread>
          {/* Back / Cancel */}
          <Button
            variant="ghost"
            onClick={() => (step === 1 ? onClose() : setStep((s) => s - 1))}
          >
            {step === 1 ? 'Cancel' : '← Back'}
          </Button>

          {/* Next / Save — override bg with habit accent colour */}
          {step < 3 ? (
            <Button
              variant="primary"
              disabled={step === 1 && !name.trim()}
              onClick={() => setStep((s) => s + 1)}
              style={{ background: color, borderColor: color }}
            >
              Next →
            </Button>
          ) : (
            <Button
              variant="primary"
              onClick={handleSave}
              style={{ background: color, borderColor: color }}
            >
              Save Habit 🎉
            </Button>
          )}
        </Modal.Footer>
      )}
    </Modal>
  )
}
