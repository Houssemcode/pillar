/**
 * Habits.jsx — Dashboard & tracker page, fully integrated with Django Habits API
 *
 * Integration Architecture:
 * ─────────────────────────────────────────────────────────────
 * 1. Habits API:
 *    - Real-time habits fetched via habitsService.getHabits().
 *    - Areas dynamically loaded via habitsService.getAreas().
 *    - Main '+' and hold-to-fill action wired directly to habitsService.toggleHabit(id) with optimistic UI updates.
 *    - Numerical progress logging wired to habitsService.logHabit(id, { date, progress_count }).
 *    - Habit creation and area creation synchronized via habitsService.
 *    - Soft-delete to trash wired via habitsService.deleteHabit(id).
 *
 * 2. Simplified Telemetry:
 *    - Telemetry metrics (is_completed_today, streak, completed_dates) supplied natively by Django HabitSerializer.
 *    - All legacy static DEFAULT_AREAS and localStorage syncing logic removed.
 */

import { useState, useMemo, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { useToast } from '../context/ToastContext'
import notificationService from '../services/notificationService'
import { dateKey, isHabitDueOn } from '../utils/habitDateUtils'
import Button from '../components/ui/Button'
import habitsService from '../api/habitsService'

// Habit components
import HabitDateStrip from '../components/habits/HabitDateStrip'
import HabitToolbar from '../components/habits/HabitToolbar'
import HabitCard from '../components/habits/HabitCard'
import HabitStatsPanel from '../components/habits/HabitStatsPanel'
import HabitDetailDrawer from '../components/habits/HabitDetailDrawer'
import NewHabitModal from '../components/habits/NewHabitModal'
import PageLayout from '../components/layout/PageLayout'

/* ─── Helpers ──────────────────────────────────────────────── */
const today = new Date()

function getWeek(anchor = new Date()) {
  const start = new Date(anchor)
  start.setDate(anchor.getDate() - anchor.getDay())
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    return d
  })
}

function sameDay(a, b) {
  if (!a || !b) return false
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function getHabitAreas(h) {
  if (Array.isArray(h.areas) && h.areas.length > 0) return h.areas
  if (h.area_name) return [h.area_name]
  if (h.area && typeof h.area === 'object' && h.area.name) return [h.area.name]
  return ['Anytime']
}

/**
 * Normalizes backend habit object to match the component interfaces:
 * - completedDates: Set of YYYY-MM-DD strings for O(1) checks
 * - completionsMap: Map of YYYY-MM-DD -> progress_count
 * - aliases: name <-> title, goal_amount <-> target_count, etc.
 */
function normalizeHabit(h) {
  const datesArray = Array.isArray(h.completed_dates)
    ? h.completed_dates
    : Array.isArray(h.completedDates)
    ? h.completedDates
    : []
  const datesSet = new Set(datesArray.map(String))

  const todayKey = dateKey(new Date())
  const isDoneToday = Boolean(
    h.is_completed_today ||
    h.today_log?.is_completed ||
    h.today_log?.done ||
    datesSet.has(todayKey)
  )

  if (isDoneToday) {
    datesSet.add(todayKey)
  }

  const targetCount = h.target_count ?? h.goal_amount ?? 1

  const cMap = new Map()
  if (Array.isArray(h.logs)) {
    h.logs.forEach((log) => {
      if (log.date) {
        cMap.set(String(log.date), log.progress_count ?? log.amount ?? (log.is_completed ? targetCount : 0))
      }
    })
  } else {
    datesSet.forEach((dStr) => {
      cMap.set(dStr, targetCount)
    })
  }

  if (h.today_log && (h.today_log.progress_count != null || h.today_log.amount != null)) {
    const todayProgress = h.today_log.progress_count ?? h.today_log.amount ?? (isDoneToday ? targetCount : 0)
    cMap.set(todayKey, todayProgress)
  } else if (isDoneToday && !cMap.has(todayKey)) {
    cMap.set(todayKey, targetCount)
  }

  const areas = getHabitAreas(h)

  return {
    ...h,
    id: h.id,
    name: h.name || h.title || 'Untitled Habit',
    title: h.title || h.name || 'Untitled Habit',
    notes: h.notes ?? h.description ?? '',
    description: h.description ?? h.notes ?? '',
    goal_amount: targetCount,
    target_count: targetCount,
    goal_unit: h.goal_unit ?? h.target_unit ?? 'times',
    target_unit: h.target_unit ?? h.goal_unit ?? 'times',
    streak: h.streak ?? 0,
    is_completed_today: isDoneToday,
    areas,
    completedDates: datesSet,
    completionsMap: cMap,
  }
}

/* ─── Skeleton ─────────────────────────────────────────────── */
function HabitsSkeleton() {
  return (
    <div className="habit-cards-grid">
      {[...Array(4)].map((_, i) => (
        <div
          key={i}
          className="habit-card"
          style={{ opacity: 0.5 - i * 0.08, height: 110, justifyContent: 'center' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 13,
                background: 'var(--color-surface-3)',
                flexShrink: 0,
              }}
            />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div
                style={{
                  height: 16,
                  borderRadius: 4,
                  background: 'var(--color-surface-3)',
                  width: '45%',
                }}
              />
              <div
                style={{
                  height: 12,
                  borderRadius: 4,
                  background: 'var(--color-surface-3)',
                  width: '28%',
                }}
              />
            </div>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                background: 'var(--color-surface-3)',
              }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

/* ─── Main Component ───────────────────────────────────────── */
export default function Habits() {
  const { t, i18n } = useTranslation()
  const isAr = i18n?.language === 'ar' || i18n?.language?.startsWith('ar')
  const { toastSuccess, toastStreak, toastInfo } = useToast() || {}

  const [habits, setHabits] = useState([])
  const [areas, setAreas]   = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [selectedDate, setSelectedDate] = useState(today)
  const [weekAnchor, setWeekAnchor] = useState(today)

  const [activeArea, setActiveArea] = useState('All')

  const [showNewHabit, setShowNewHabit] = useState(false)
  const [detailHabit, setDetailHabit] = useState(null)
  const [isMobileStatsOpen, setIsMobileStatsOpen] = useState(false)

  // Close mobile stats drawer on Escape key
  useEffect(() => {
    if (!isMobileStatsOpen) return
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setIsMobileStatsOpen(false)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isMobileStatsOpen])

  // Lock body scroll when mobile stats drawer is open
  useEffect(() => {
    if (isMobileStatsOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isMobileStatsOpen])

  const week = useMemo(() => getWeek(weekAnchor), [weekAnchor])

  /* ── Fetch habits and areas concurrently via Promise.all ── */
  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [habitsData, areasData] = await Promise.all([
        habitsService.getHabits(),
        habitsService.getAreas().catch(() => []),
      ])

      let habitsList = habitsData || []
      // If new user with 0 habits, trigger initialization of core faith habits
      if (habitsList.length === 0) {
        try {
          const initRes = await habitsService.initializeCoreHabits()
          if (initRes?.habits?.length > 0) {
            habitsList = initRes.habits
          }
        } catch (initErr) {
          console.warn('[Habits] Auto-initialize core habits error:', initErr)
        }
      }

      setHabits(habitsList.map(normalizeHabit))
      setAreas(areasData || [])
    } catch (err) {
      console.error('[Habits] Fetch error:', err)
      setError('Could not load habits from server. Check your connection.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  /* ── Week navigation ── */
  const prevWeek = () => {
    const a = new Date(weekAnchor)
    a.setDate(a.getDate() - 7)
    setWeekAnchor(a)
  }

  const nextWeek = () => {
    const a = new Date(weekAnchor)
    const next = new Date(a)
    next.setDate(a.getDate() + 7)
    setWeekAnchor(next <= today ? next : today)
  }

  const handleSelectDay = (day) => {
    setSelectedDate(day)
    if (!week.some((d) => sameDay(d, day))) setWeekAnchor(day)
  }

  /* ── Toggle Habit for a given Date (Optimistic) ── */
  const toggleDate = useCallback(
    async (id, targetDate) => {
      const h = habits.find((item) => item.id === id)
      if (!h) return
      const dk = dateKey(targetDate)
      const alreadyDone = h.completedDates?.has(dk)

      const isGoalHabit = h.goal_amount && h.goal_amount > 1
      const newAmount = alreadyDone ? 0 : h.goal_amount || 1

      // 1. Optimistic local update
      setHabits((prev) =>
        prev.map((hab) => {
          if (hab.id !== id) return hab
          const newDates = new Set(hab.completedDates)
          const newMap = new Map(hab.completionsMap || [])
          newMap.set(dk, newAmount)

          let newStreak = hab.streak || 0
          if (alreadyDone) {
            newDates.delete(dk)
            newStreak = Math.max(0, newStreak - 1)
          } else {
            newDates.add(dk)
            newStreak += 1
          }

          const isToday = dk === dateKey(new Date())

          return {
            ...hab,
            completionsMap: newMap,
            completedDates: newDates,
            streak: newStreak,
            is_completed_today: isToday ? !alreadyDone : hab.is_completed_today,
          }
        })
      )

      if (!alreadyDone) {
        const newStreak = (h.streak || 0) + 1
        if (newStreak > 0 && newStreak % 7 === 0) {
          toastStreak?.(`${newStreak}-day streak! 🔥`, `Keep it up with ${h.emoji || '🎯'} ${h.name}!`)
        } else {
          toastSuccess?.(`${h.emoji || '🎯'} ${h.name}`, 'Marked done!')
        }
      }

      // 2. Call backend toggle endpoint
      try {
        const updated = await habitsService.toggleHabit(id, { date: dk })
        setHabits((prev) => prev.map((hab) => (hab.id === id ? normalizeHabit(updated) : hab)))
      } catch (err) {
        console.error('[Habits] Toggle error:', err)
        // Rollback on error
        setHabits((prev) => prev.map((hab) => (hab.id === id ? h : hab)))
      }
    },
    [habits, toastSuccess, toastStreak]
  )

  const toggle = useCallback(
    (id) => {
      toggleDate(id, selectedDate)
    },
    [toggleDate, selectedDate]
  )

  /* ── Log Progress for Quantified Habits ── */
  const logProgress = useCallback(
    async (id, newAmount) => {
      const h = habits.find((item) => item.id === id)
      if (!h) return
      const dk = dateKey(selectedDate)
      const oldAmount = h.completionsMap?.get(dk) || 0

      // Optimistic update
      setHabits((prev) =>
        prev.map((hab) => {
          if (hab.id !== id) return hab
          const newMap = new Map(hab.completionsMap || [])
          newMap.set(dk, newAmount)
          const newDates = new Set(hab.completedDates)
          const isDone = newAmount >= (hab.goal_amount || 1)
          const wasDone = oldAmount >= (hab.goal_amount || 1)
          let newStreak = hab.streak || 0

          if (isDone && !wasDone) {
            newDates.add(dk)
            newStreak += 1
          }
          if (!isDone && wasDone) {
            newDates.delete(dk)
            newStreak = Math.max(0, newStreak - 1)
          }

          return {
            ...hab,
            completionsMap: newMap,
            completedDates: newDates,
            streak: newStreak,
            is_completed_today: dk === dateKey(new Date()) ? isDone : hab.is_completed_today,
          }
        })
      )

      if (newAmount >= (h.goal_amount || 1) && oldAmount < (h.goal_amount || 1)) {
        toastSuccess?.(`${h.emoji || '🎯'} ${h.name}`, 'Target goal reached! 🎉')
      }

      try {
        const res = await habitsService.logHabit(id, { date: dk, progress_count: newAmount })
        const updatedHabit = res?.habit || res
        if (updatedHabit) {
          setHabits((prev) => prev.map((hab) => (hab.id === id ? normalizeHabit(updatedHabit) : hab)))
        }
      } catch (err) {
        console.error('[Habits] Progress log error:', err)
        setHabits((prev) => prev.map((hab) => (hab.id === id ? h : hab)))
      }
    },
    [habits, selectedDate, toastSuccess]
  )

  /* ── Update Habit ── */
  const updateHabit = useCallback(
    async (id, patch) => {
      const prev = habits.find((h) => h.id === id)
      setHabits((ts) => ts.map((h) => (h.id === id ? { ...h, ...patch } : h)))
      if (detailHabit?.id === id) setDetailHabit((d) => ({ ...d, ...patch }))

      try {
        const updated = await habitsService.updateHabit(id, patch)
        setHabits((ts) => ts.map((h) => (h.id === id ? normalizeHabit(updated) : h)))

        // Reminder notifications
        if ('reminder_time' in patch) {
          if (updated.reminder_time) {
            const days =
              updated.frequency === 'specific_days'
                ? (updated.frequency_days || [])
                : []
            notificationService.scheduleRecurring(
              `habit-${id}`,
              `${updated.emoji || '🎯'} ${updated.name || updated.title}`,
              'Time for your habit!',
              updated.reminder_time.slice(0, 5),
              days,
              true
            )
          } else {
            notificationService.cancelNotification(`habit-${id}`)
          }
        }
      } catch (err) {
        console.error('[Habits] Update error:', err)
        setHabits((ts) => ts.map((h) => (h.id === id ? prev : h)))
      }
    },
    [habits, detailHabit]
  )

  /* ── Move Habit to Trash (Soft Delete) ── */
  const trashHabit = useCallback(
    async (id) => {
      const habitToTrash = habits.find((h) => h.id === id)
      if (!habitToTrash) return

      setHabits((ts) => ts.filter((h) => h.id !== id))
      if (detailHabit?.id === id) setDetailHabit(null)

      try {
        await habitsService.deleteHabit(id)
        toastInfo?.(`"${habitToTrash.name}" moved to Trash`, 'Recover anytime from Trash.')
      } catch (err) {
        console.error('[Habits] Trash error:', err)
        setHabits((ts) => [...ts, habitToTrash])
      }
    },
    [habits, detailHabit, toastInfo]
  )

  /* ── Create New Habit ── */
  const saveNewHabit = useCallback(
    async (payload) => {
      try {
        const created = await habitsService.createHabit(payload)
        const normalized = normalizeHabit(created)
        setHabits((prev) => [normalized, ...prev])

        if (created.reminder_time) {
          const days =
            created.frequency === 'specific_days'
              ? (created.frequency_days || [])
              : []
          notificationService.scheduleRecurring(
            `habit-${created.id}`,
            `${created.emoji || '🎯'} ${created.name || created.title}`,
            'Time for your habit!',
            created.reminder_time.slice(0, 5),
            days,
            true
          )
        }
        toastSuccess?.(`${created.emoji || '🎯'} ${created.name || created.title}`, 'Habit created successfully!')
      } catch (err) {
        console.error('[Habits] Create error:', err)
      }
    },
    [toastSuccess]
  )

  /* ── Create New Area ── */
  const handleAddArea = useCallback(async (name) => {
    try {
      const created = await habitsService.createArea({ name, color: '#10B981' })
      setAreas((prev) => [...prev, created])
      toastSuccess?.('Area created', name)
    } catch (err) {
      console.error('[Habits] Create area error:', err)
    }
  }, [toastSuccess])

  // Keep detail drawer in sync
  useEffect(() => {
    if (detailHabit) {
      const updated = habits.find((h) => h.id === detailHabit.id)
      if (updated) setDetailHabit(updated)
    }
  }, [habits])

  /* ── Global Keyboard Shortcuts ── */
  useEffect(() => {
    const handleKeyDown = (e) => {
      const activeTag = document.activeElement?.tagName
      const isInput =
        activeTag === 'INPUT' ||
        activeTag === 'TEXTAREA' ||
        document.activeElement?.isContentEditable
      if (isInput) return

      if (e.key === 't' || e.key === 'T') {
        setSelectedDate(today)
        setWeekAnchor(today)
      } else if (e.key === 'ArrowLeft') {
        setSelectedDate((d) => {
          const prev = new Date(d)
          prev.setDate(prev.getDate() - 1)
          return prev
        })
      } else if (e.key === 'ArrowRight') {
        setSelectedDate((d) => {
          const next = new Date(d)
          next.setDate(next.getDate() + 1)
          return next <= today ? next : d
        })
      } else if (e.key === 'n' || e.key === 'N') {
        e.preventDefault()
        setShowNewHabit(true)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  /* ── Filtering & Areas derived from Backend ── */
  const dk = dateKey(selectedDate)

  // Build dynamic areas tabs from backend areas
  const allAreas = useMemo(() => {
    const areaNames = areas.map((a) => (typeof a === 'string' ? a : a.name)).filter(Boolean)
    const fallback = ['Morning', 'Afternoon', 'Evening', 'Anytime']
    const distinctNames = Array.from(new Set(areaNames.length > 0 ? areaNames : fallback))
    return ['All', ...distinctNames, 'Archived']
  }, [areas])

  const isArchivedView = activeArea === 'Archived'

  // Calculate completed / total for each area for top tabs badges (based on selectedDate)
  const areaCounts = useMemo(() => {
    const counts = {}
    const dueHabits = habits.filter(
      (h) => !h.is_archived && (isHabitDueOn(h, selectedDate) || h.completedDates?.has(dk))
    )

    allAreas.forEach((area) => {
      let list
      if (area === 'Archived') {
        list = habits.filter((h) => h.is_archived)
      } else if (area === 'All') {
        list = dueHabits
      } else {
        list = dueHabits.filter((h) => getHabitAreas(h).includes(area))
      }
      const done = list.filter((h) => h.completedDates?.has(dk)).length
      counts[area] = { done, total: list.length }
    })
    return counts
  }, [allAreas, habits, dk, selectedDate])

  // 1. Base filter: Active vs Archived
  let baseHabits = habits.filter((h) =>
    isArchivedView ? h.is_archived : !h.is_archived
  )

  // 2. Filter active habits by scheduled date (or if already completed on this date)
  if (!isArchivedView) {
    baseHabits = baseHabits.filter(
      (h) => isHabitDueOn(h, selectedDate) || h.completedDates?.has(dk)
    )
  }

  // 3. Area filter
  if (activeArea !== 'All' && activeArea !== 'Archived') {
    baseHabits = baseHabits.filter((h) => getHabitAreas(h).includes(activeArea))
  }

  const sortedHabits = [...baseHabits]

  return (
    <div className="page habits-page page--layout">
      <PageLayout
        sidebarClassName="habits-desktop-sidebar hidden lg:block"
        header={
          error ? (
            <div className="habits-error-banner" style={{ marginBottom: 12 }}>
              <span>⚠ {error}</span>
              <Button variant="ghost" size="sm" onClick={fetchData}>{t('common.retry')}</Button>
            </div>
          ) : null
        }
        sidebar={
          <aside className="habits-sidebar-analytics">
            <HabitStatsPanel
              habits={habits.filter((h) => !h.is_archived)}
              selectedDate={selectedDate}
              today={today}
              onSelectDate={handleSelectDay}
            />
          </aside>
        }
      >
        {/* ── Sleek Integrated Date Strip Header ── */}
        <HabitDateStrip
          week={week}
          selectedDate={selectedDate}
          today={today}
          habits={habits}
          onSelect={handleSelectDay}
          onPrevWeek={prevWeek}
          onNextWeek={nextWeek}
        />

        {/* ── Unified Toolbar: Top Area Tabs & Actions ── */}
        <HabitToolbar
          activeArea={activeArea}
          onAreaChange={setActiveArea}
          allAreas={allAreas}
          onAddArea={handleAddArea}
          areaCounts={areaCounts}
          onNewHabit={() => setShowNewHabit(true)}
          onOpenStats={() => setIsMobileStatsOpen(true)}
        />

        {/* ── DAILY LIST: Centered Minimalist Cards ── */}
        <div className="habits-left-panel">
            {loading ? (
              <HabitsSkeleton />
            ) : sortedHabits.length === 0 ? (
              <div className="habits-empty-state">
                <div className="habits-empty-icon">🎯</div>
                <div className="habits-empty-title">{t('habits.noHabits')}</div>
                <div className="habits-empty-desc">
                  {activeArea !== 'All'
                    ? t('habits.noHabitsInArea', { area: activeArea })
                    : t('habits.createFirstHabit')}
                </div>
                <Button
                  variant="primary"
                  onClick={() => setShowNewHabit(true)}
                  style={{ marginTop: 12 }}
                >
                  {t('habits.addHabitBtn')}
                </Button>
              </div>
            ) : (
              /* Flat list of Cards */
              <div className="habit-cards-grid">
                {sortedHabits.map((habit) => (
                  <HabitCard
                    key={habit.id}
                    habit={habit}
                    done={habit.completedDates?.has(dk)}
                    currentAmount={habit.completionsMap?.get(dk) || 0}
                    onToggle={toggle}
                    onLogProgress={logProgress}
                    onOpen={setDetailHabit}
                    onTrash={trashHabit}
                    onArchive={(id, isArchived) =>
                      updateHabit(id, { is_archived: isArchived })
                    }
                  />
                ))}
              </div>
            )}
          </div>
      </PageLayout>

      {/* Floating Action Button — mobile only (hidden on ≥768px via CSS) */}
      <button
        type="button"
        className="fab habits-fab"
        onClick={() => setShowNewHabit(true)}
        aria-label="Add habit"
        title="Add new habit (N)"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>

      {/* New Habit Creation Modal */}
      {showNewHabit && (
        <NewHabitModal
          areas={areas}
          onSave={saveNewHabit}
          onAreaCreated={(newArea) => setAreas((prev) => [...prev, newArea])}
          onClose={() => setShowNewHabit(false)}
        />
      )}

      {/* Habit Detail Slide-in Drawer */}
      {detailHabit && (
        <HabitDetailDrawer
          habit={detailHabit}
          selectedDate={selectedDate}
          onClose={() => setDetailHabit(null)}
          onToggle={toggle}
          onUpdate={updateHabit}
          onTrash={trashHabit}
        />
      )}

      {/* ── Mobile Stats Drawer (Off-canvas) ── */}
      <AnimatePresence>
        {isMobileStatsOpen && (
          <div
            className="habits-mobile-stats-overlay fixed inset-0 z-50 bg-black/50"
            onClick={() => setIsMobileStatsOpen(false)}
            role="dialog"
            aria-modal="true"
            aria-label={t('habits.stats', 'Stats & Insights')}
          >
            <motion.aside
              initial={{ x: isAr ? '-100%' : '100%' }}
              animate={{ x: 0 }}
              exit={{ x: isAr ? '-100%' : '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              className="habits-mobile-stats-drawer bg-white dark:bg-[#121212] text-gray-900 dark:text-white"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Drawer Header */}
              <div className="habits-mobile-stats-header bg-white dark:bg-[#121212] border-b border-gray-200 dark:border-zinc-800">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ color: 'var(--color-primary)' }}
                  >
                    <line x1="18" y1="20" x2="18" y2="10" />
                    <line x1="12" y1="20" x2="12" y2="4" />
                    <line x1="6" y1="20" x2="6" y2="14" />
                  </svg>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">
                    {t('habits.stats', 'Stats & Insights')}
                  </span>
                </div>
                <button
                  type="button"
                  className="habits-mobile-stats-close-btn text-gray-500 hover:bg-gray-100 dark:hover:bg-zinc-800 dark:text-gray-400 rounded-lg p-2 transition-colors"
                  onClick={() => setIsMobileStatsOpen(false)}
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
              <div className="habits-mobile-stats-body">
                <HabitStatsPanel
                  habits={habits.filter((h) => !h.is_archived)}
                  selectedDate={selectedDate}
                  today={today}
                  onSelectDate={(d) => {
                    handleSelectDay(d)
                    setIsMobileStatsOpen(false)
                  }}
                />
              </div>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
