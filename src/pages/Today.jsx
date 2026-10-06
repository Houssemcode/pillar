/**
 * Today.jsx — Dashboard page, fully integrated with Django Tasks & Faith APIs
 *
 * Integration Architecture:
 * ─────────────────────────────────────────────────────────────
 * 1. Tasks API:
 *    - Real-time active tasks due today fetched via tasksService.getTasks({ due_today: 'true', is_completed: 'false', trash: 'false' }).
 *    - Completed tasks due today also reconciled for accurate daily progress.
 *    - Optimistic task completion toggle synced directly with backend via tasksService.toggleTask(id).
 *
 * 2. Faith API:
 *    - Daily prayer times fetched from Django backend via faithService.getPrayers(todayIso).
 *    - Hadith of the Day curated rotation fetched via faithService.getHadithOfTheDay().
 *    - Faith summary card accurately represents completed / scheduled daily prayers.
 *    - Prominent Hadith of the Day card displays Arabic text, translation, narrator & source.
 *
 * 3. Habits, Focus & Calendar:
 *    - LocalStorage/mock adapters cleanly separated and ready for future phase integrations.
 *
 * 4. Design System & Layout:
 *    - 100% preserves Phase 5 layout grid (.today-page, .today-summary-strip, .today-timeline-section).
 *    - Flawless skeleton loaders for summary cards and timeline rows to eliminate layout shift.
 */

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import ColorDot   from '../components/ui/ColorDot'
import Card       from '../components/ui/Card'
import Badge      from '../components/ui/Badge'
import Button     from '../components/ui/Button'
import { getModuleTheme } from '../theme/moduleThemes'
import { useAuth }        from '../context/AuthContext'
import { useToast }       from '../context/ToastContext'
import tasksService       from '../api/tasksService'
import faithService       from '../api/faithService'
import habitsService      from '../api/habitsService'
import focusService       from '../api/focusService'
import { calendarApi }    from '../api/calendar'
import { formatTimeHHmm } from '../utils/timeUtils'

/* ── Helpers ───────────────────────────────────────────────── */
function getGreeting(t) {
  const h = new Date().getHours()
  if (h < 12) return t('today.greetingMorning')
  if (h < 17) return t('today.greetingAfternoon')
  return t('today.greetingEvening')
}

/* ═══════════════════════════════════════════════════════════
   OFFLINE STORAGE ADAPTERS (HABITS & CALENDAR)
   Used solely for offline fallback when network is unavailable
═══════════════════════════════════════════════════════════ */

function getLocalHabitsData(todayIso) {
  try {
    const raw = localStorage.getItem('pillar_habits')
    if (raw) {
      const parsed = JSON.parse(raw)
      const list = Array.isArray(parsed) ? parsed : (parsed.items || [])
      const done = list.filter(h => (h.completedDates && h.completedDates.includes(todayIso)) || h.done).length
      return { items: list, done, total: list.length }
    }
  } catch (e) {
    console.warn('[Today] Failed to read local habits:', e)
  }
  return { items: [], done: 0, total: 0 }
}

function getLocalCalendarData(todayIso) {
  try {
    const raw = localStorage.getItem('pillar_user_calendars')
    if (raw) {
      const parsed = JSON.parse(raw)
      const events = Array.isArray(parsed) ? parsed : (parsed.events || [])
      const todayEvents = events.filter(e => !e.date || e.date === todayIso)
      return { count: todayEvents.length, events: todayEvents }
    }
  } catch (e) {
    console.warn('[Today] Failed to read local calendar events:', e)
  }
  return { count: 0, events: [] }
}

/* ── Skeleton strip for summary cards ─────────────────────── */
function SummaryCardSkeleton() {
  return (
    <Card className="today-summary-card today-summary-card--skeleton">
      <Card.Body>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="today-summary-skeleton-icon" />
          <div className="today-summary-skeleton-body">
            <div className="today-summary-skeleton-label" />
            <div className="today-summary-skeleton-value" />
          </div>
        </div>
      </Card.Body>
    </Card>
  )
}

/* ═══════════════════════════════════════════════════════════ */

export default function Today() {
  const { t, i18n } = useTranslation()
  const isAr = i18n.language === 'ar' || i18n.language?.startsWith('ar')
  const { user } = useAuth()
  const { toastSuccess, toastError } = useToast() || {}
  const navigate  = useNavigate()

  // Compute dates fresh on each mount or language switch
  const { TODAY_ISO, DATE_STR } = useMemo(() => {
    const now = new Date()
    const iso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
    const locale = i18n.language?.startsWith('ar') ? 'ar-SA' : 'en-US'
    const str = now.toLocaleDateString(locale, { weekday: 'long', month: 'long', day: 'numeric' })
    return { TODAY_ISO: iso, DATE_STR: str }
  }, [i18n.language])

  const [loading,        setLoading]        = useState(true)
  const [refreshing,     setRefreshing]     = useState(false)
  const [todayTasks,     setTodayTasks]     = useState([])
  const [prayers,        setPrayers]        = useState([])
  const [hadithOfTheDay, setHadithOfTheDay] = useState(null)
  const [habitsState,    setHabitsState]    = useState({ done: 0, total: 0, items: [] })
  const [focusState,     setFocusState]     = useState({ minutes: 0, sessionsCount: 0, sessions: [] })
  const [calendarState,  setCalendarState]  = useState({ count: 0, events: [] })

  /* ── Load dashboard data via Promise.all ── */
  const loadDashboardData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    else setRefreshing(true)

    try {
      const [
        activeTasksRes,
        completedTasksRes,
        prayersRes,
        hadithRes,
        habitsRes,
        focusStatsRes,
        focusTodayRes,
        calendarRes,
      ] = await Promise.all([
        tasksService.getTasks({ due_today: 'true', is_completed: 'false', trash: 'false' }).catch(err => {
          console.warn('[Today] Error fetching active tasks:', err)
          return []
        }),
        tasksService.getTasks({ due_today: 'true', is_completed: 'true', trash: 'false' }).catch(err => {
          console.warn('[Today] Error fetching completed tasks:', err)
          return []
        }),
        faithService.getPrayers(TODAY_ISO).catch(err => {
          console.warn('[Today] Error fetching prayers:', err)
          return []
        }),
        faithService.getHadithOfTheDay().catch(err => {
          console.warn('[Today] Error fetching hadith of the day:', err)
          return null
        }),
        habitsService.getHabits().catch(err => {
          console.warn('[Today] Error fetching habits:', err)
          return []
        }),
        focusService.getStats().catch(err => {
          console.warn('[Today] Error fetching focus stats:', err)
          return null
        }),
        focusService.getTodaySessions().catch(err => {
          console.warn('[Today] Error fetching today focus sessions:', err)
          return null
        }),
        calendarApi.range(TODAY_ISO, TODAY_ISO).catch(err => {
          console.warn('[Today] Error fetching calendar events:', err)
          return []
        }),
      ])

      const activeList = Array.isArray(activeTasksRes) ? activeTasksRes : (activeTasksRes?.results ?? [])
      const completedList = Array.isArray(completedTasksRes) ? completedTasksRes : (completedTasksRes?.results ?? [])
      setTodayTasks([...activeList, ...completedList])

      setPrayers(Array.isArray(prayersRes) ? prayersRes : [])
      setHadithOfTheDay(hadithRes || null)

      // Use backend habits if available, else fallback to offline storage
      const habitsList = Array.isArray(habitsRes) ? habitsRes : (habitsRes?.results ?? [])
      if (habitsList.length > 0) {
        const done = habitsList.filter(h =>
          Boolean(
            h.is_completed_today ||
            h.today_log?.is_completed ||
            h.today_log?.done ||
            h.completed_dates?.includes(TODAY_ISO) ||
            h.completedDates?.includes?.(TODAY_ISO) ||
            h.done
          )
        ).length
        setHabitsState({ done, total: habitsList.length, items: habitsList })
      } else if (Array.isArray(habitsRes)) {
        setHabitsState({ done: 0, total: 0, items: [] })
      } else {
        setHabitsState(getLocalHabitsData(TODAY_ISO))
      }

      // Reconcile focus stats and sessions directly from Django backend
      if (focusStatsRes) {
        setFocusState({
          minutes: Math.round(focusStatsRes.today_minutes || (focusStatsRes.today_seconds ? focusStatsRes.today_seconds / 60 : 0)),
          sessionsCount: focusStatsRes.today_sessions || 0,
          sessions: focusTodayRes?.sessions || [],
        })
      } else if (focusTodayRes) {
        setFocusState({
          minutes: Math.round(focusTodayRes.today_minutes || 0),
          sessionsCount: focusTodayRes.count || 0,
          sessions: focusTodayRes.sessions || [],
        })
      } else {
        setFocusState({ minutes: 0, sessionsCount: 0, sessions: [] })
      }

      // Reconcile calendar events directly from Django backend
      const calList = Array.isArray(calendarRes) ? calendarRes : (calendarRes?.results ?? [])
      if (calList && calList.length > 0) {
        setCalendarState({ count: calList.length, events: calList })
      } else if (Array.isArray(calendarRes)) {
        setCalendarState({ count: 0, events: [] })
      } else {
        setCalendarState(getLocalCalendarData(TODAY_ISO))
      }
    } catch (err) {
      console.error('[Today] Unexpected error loading dashboard:', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [TODAY_ISO])

  useEffect(() => {
    loadDashboardData()
  }, [loadDashboardData])

  /* ── Optimistic Task Toggle ── */
  const handleToggleTask = useCallback(async (taskId, taskTitle, e) => {
    if (e) {
      e.stopPropagation()
      e.preventDefault()
    }

    const target = todayTasks.find(t => t.id === taskId)
    const isCurrentlyDone = Boolean(target?.is_completed ?? target?.done)
    const nextState = !isCurrentlyDone

    setTodayTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        return { ...t, is_completed: nextState, done: nextState }
      }
      return t
    }))

    try {
      await tasksService.toggleTask(taskId)
      if (nextState && toastSuccess) {
        toastSuccess('Task completed! ✓', taskTitle || '')
      }
    } catch (err) {
      console.error('[Today] Error toggling task:', err)
      if (toastError) {
        toastError('Failed to update task', 'Reverting status...')
      }
      // Rollback optimistic update
      setTodayTasks(prev => prev.map(t => {
        if (t.id === taskId) {
          return { ...t, is_completed: isCurrentlyDone, done: isCurrentlyDone }
        }
        return t
      }))
    }
  }, [todayTasks, toastSuccess, toastError])

  /* ── Unified Chronological Timeline ── */
  const timeline = useMemo(() => {
    const items = []

    // 1. Faith: Prayers
    prayers.forEach(p => {
      const prayerName = isAr ? (p.ar || p.name_ar || p.name) : (p.en || p.name || p.key)
      const formattedPrayerTime = p.time ? formatTimeHHmm(p.time) : null
      items.push({
        id: `prayer-${p.key}`,
        key: p.key,
        time: formattedPrayerTime,
        label: t('today.prayerItem', { name: prayerName }),
        module: 'faith',
        done: Boolean(p.fardDone),
        sortKey: formattedPrayerTime || '12:00',
        type: 'prayer',
      })
    })

    // 2. Tasks: Real backend tasks due today
    todayTasks.forEach(tItem => {
      const isDone = Boolean(tItem.is_completed ?? tItem.done)
      const taskTime = tItem.time || tItem.due_time || null
      const formattedTaskTime = taskTime ? formatTimeHHmm(taskTime) : null
      items.push({
        id: tItem.id,
        time: formattedTaskTime,
        label: tItem.title || tItem.text || 'Untitled Task',
        module: 'tasks',
        done: isDone,
        sortKey: isDone ? '99:99' : (formattedTaskTime || '08:00'),
        type: 'task',
        raw: tItem,
      })
    })

    // 3. Habits
    habitsState.items.forEach(h => {
      const isDone = Boolean(
        h.is_completed_today ||
        h.today_log?.is_completed ||
        h.today_log?.done ||
        h.completed_dates?.includes(TODAY_ISO) ||
        h.completedDates?.includes?.(TODAY_ISO) ||
        h.done
      )
      const habitTime = h.reminder_time || h.time || null
      const formattedHabitTime = habitTime ? formatTimeHHmm(habitTime) : null
      items.push({
        id: `habit-${h.id}`,
        time: formattedHabitTime,
        label: h.title || h.name || 'Habit',
        module: 'habits',
        done: isDone,
        sortKey: isDone ? '99:99' : (formattedHabitTime || '07:30'),
        type: 'habit',
      })
    })

    // 4. Focus (Real sessions logged today from Django backend)
    focusState.sessions.forEach(s => {
      const timestamp = s.completed_at || s.end_time || s.start_time || s.created_at || s.completedAt
      const timeStr = timestamp ? formatTimeHHmm(timestamp) : null
      const durMins = s.duration_minutes || (s.duration ? Math.round(s.duration / 60) : 25)
      items.push({
        id: `focus-${s.id}`,
        time: timeStr,
        label: s.label || s.task_title || (s.mode === 'pomodoro' ? `Focus Session (${durMins}m)` : `Break (${durMins}m)`),
        module: 'focus',
        done: s.status ? s.status === 'completed' : true,
        sortKey: timeStr || '09:00',
        type: 'focus',
        raw: s,
      })
    })

    // 5. Calendar (real user events from backend)
    calendarState.events.forEach(e => {
      const calTime = e.allDay ? null : (e.startTime || e.time || null)
      const formattedCalTime = calTime ? formatTimeHHmm(calTime) : null
      items.push({
        id: `event-${e.id}`,
        time: formattedCalTime,
        label: e.title || e.label || 'Calendar Event',
        module: 'calendar',
        done: false,
        sortKey: e.allDay ? '00:01' : (formattedCalTime || '10:00'),
        type: 'calendar',
      })
    })

    return items.sort((a, b) => a.sortKey.localeCompare(b.sortKey))
  }, [prayers, todayTasks, habitsState, focusState, calendarState, TODAY_ISO, t, isAr])

  const doneCount = timeline.filter((item) => item.done).length
  const progress  = timeline.length > 0 ? Math.round((doneCount / timeline.length) * 100) : 0

  const tasksDone = todayTasks.filter(item => item.is_completed ?? item.done).length
  const prayersDone = prayers.filter(p => p.fardDone).length

  /* ── Module summary data ──────────────────────────────────── */
  const MODULE_SUMMARY = [
    {
      key:   'tasks',
      label: t('today.tasks'),
      icon:  '✓',
      value: loading ? '…' : `${tasksDone}/${todayTasks.length}`,
    },
    {
      key:   'habits',
      label: t('today.habits'),
      icon:  '⚡',
      value: loading ? '…' : `${habitsState.done}/${habitsState.total}`,
    },
    {
      key:   'faith',
      label: t('today.prayers'),
      icon:  '◈',
      value: loading ? '…' : `${prayersDone}/${prayers.length || 5}`,
    },
    {
      key:   'calendar',
      label: t('today.events'),
      icon:  '📅',
      value: loading ? '…' : `${calendarState.count}`,
    },
    {
      key:   'focus',
      label: t('today.focus'),
      icon:  '⏱️',
      value: loading
        ? '…'
        : (focusState.sessionsCount > 0
            ? `${focusState.sessionsCount} (${focusState.minutes}m)`
            : `${focusState.minutes}m`),
    },
  ]

  /* ── Render ───────────────────────────────────────────────── */
  return (
    <div className="page today-page">

      {/* ── Header ── */}
      <div className="today-header">
        <div className="today-header-left">
          <div className="today-date-label">{DATE_STR.toUpperCase()}</div>
          <h1 className="page-title today-greeting">
            {getGreeting(t)}{user?.username ? `, ${user.username}` : ''}
          </h1>
          <div className="page-subtitle">
            {loading
              ? t('today.loading')
              : t('today.completedSummary', { done: doneCount, total: timeline.length })}
          </div>
        </div>

        <div className="today-progress-chip">
          <div className="today-progress-pct">{progress}%</div>
          <div className="today-progress-label">{t('today.todayProgress')}</div>
        </div>
      </div>

      {/* ── Day progress bar ── */}
      <div className="today-progress-bar-track">
        <div
          className="today-progress-bar-fill"
          style={{ width: `${progress}%` }}
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={t('today.progressAria', { progress })}
        />
      </div>

      {/* ────────────────────────────────────────────────────────
          Module summary strip
          ──────────────────────────────────────────────────────── */}
      <div className="today-summary-strip">
        {MODULE_SUMMARY.map((item) => {
          const theme = getModuleTheme(item.key)
          const route = item.key === 'faith'
            ? '/faith'
            : item.key === 'focus'
            ? '/focus'
            : `/${item.key}`

          if (loading) return <SummaryCardSkeleton key={item.key} />

          return (
            <Card
              key={item.key}
              interactive
              className="today-summary-card"
              onClick={() => navigate(route)}
              role="button"
              tabIndex={0}
              aria-label={`Go to ${item.label}: ${item.value}`}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') navigate(route) }}
            >
              <Card.Body style={{ padding: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  {/* Module icon */}
                  <div
                    className="today-summary-icon"
                    style={{
                      background: `${theme.color}18`,
                      color:       theme.color,
                      border:      `1px solid ${theme.color}35`,
                    }}
                  >
                    {item.icon}
                  </div>

                  {/* Text */}
                  <div className="today-summary-text">
                    <div className="today-summary-module-label">{item.label}</div>
                    <div
                      className="today-summary-module-value"
                      style={{ color: theme.color }}
                    >
                      {item.value}
                    </div>
                  </div>
                </div>
              </Card.Body>
            </Card>
          )
        })}
      </div>

      {/* ────────────────────────────────────────────────────────
          Hadith of the Day Widget
          ──────────────────────────────────────────────────────── */}
      {hadithOfTheDay && (
        <Card className="today-hadith-widget" style={{ marginBottom: 16 }}>
          <Card.Header
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 13, color: 'var(--color-faith, #10B981)' }}>◈</span>
                <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--color-faith, #10B981)' }}>
                  {t('today.hadithOfTheDay')}
                </span>
              </div>
            }
            action={
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/faith')}
                style={{ fontSize: 11, color: 'var(--color-faith, #10B981)', padding: '2px 8px' }}
              >
                {t('faith.title')} →
              </Button>
            }
          />
          <Card.Body style={{ paddingTop: 0 }}>
            <blockquote
              dir="rtl"
              style={{
                fontFamily: 'var(--font-arabic, "Traditional Arabic", serif)',
                fontSize: 16,
                lineHeight: 1.8,
                color: 'var(--color-text)',
                margin: '4px 0 8px',
                textAlign: 'right',
              }}
            >
              « {hadithOfTheDay.text} »
            </blockquote>
            {!isAr && hadithOfTheDay.translation && (
              <p style={{ fontSize: 13, color: 'var(--color-text-muted)', lineHeight: 1.5, margin: '6px 0' }}>
                "{hadithOfTheDay.translation}"
              </p>
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 8, fontSize: 11, color: 'var(--color-text-muted)', marginTop: 8 }}>
              {hadithOfTheDay.narrator && (
                <span>
                  {isAr ? `رواه ${hadithOfTheDay.narrator}` : `Narrated by ${hadithOfTheDay.narrator}`}
                </span>
              )}
              {hadithOfTheDay.source && <span>• {hadithOfTheDay.source}</span>}
              {hadithOfTheDay.grade && (
                <Badge variant="outline" size="sm" style={{ fontSize: 10, padding: '1px 6px' }}>
                  {hadithOfTheDay.grade}
                </Badge>
              )}
            </div>
          </Card.Body>
        </Card>
      )}

      {/* ────────────────────────────────────────────────────────
          Daily Timeline section
          ──────────────────────────────────────────────────────── */}
      <div className="today-timeline-section">
        <div className="section-label today-timeline-header">
          <span>{t('today.unifiedTimeline')}</span>
          {!loading && (
            <Badge variant="default" size="sm">{timeline.length} {t('common.all')}</Badge>
          )}
        </div>

        {loading ? (
          /* Skeleton rows */
          <div className="today-timeline-skeletons">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="today-timeline-skeleton"
                style={{ opacity: Math.max(0.15, 0.6 - i * 0.1) }}
              />
            ))}
          </div>

        ) : timeline.length === 0 ? (
          /* ── Empty state ── */
          <Card className="today-empty">
            <Card.Body style={{ textAlign: 'center', padding: '40px 20px' }}>
              <div className="today-empty-icon">✨</div>
              <div className="today-empty-text">{t('today.emptyTimeline')}</div>
              <Button
                variant="ghost"
                className="today-empty-action"
                onClick={() => navigate('/tasks')}
                style={{ marginTop: 8 }}
              >
                {t('common.add')} {t('nav.tasks')} →
              </Button>
            </Card.Body>
          </Card>

        ) : (
          /* ── Timeline item list ── */
          <div className="today-timeline-list">
            {timeline.map((item, idx) => {
              const theme  = getModuleTheme(item.module)
              const isNext = idx === timeline.findIndex((t) => !t.done)
              const moduleRoute =
                item.module === 'faith' ? '/faith'
                : item.module === 'focus' ? '/focus'
                : `/${item.module}`

              return (
                <div
                  key={item.id || idx}
                  role="button"
                  tabIndex={0}
                  className={[
                    'today-timeline-item',
                    isNext ? 'today-timeline-item--next' : '',
                    item.done ? 'today-timeline-item--done' : '',
                  ].filter(Boolean).join(' ')}
                  style={isNext ? {
                    background:   `${theme.color}12`,
                    borderColor:  `${theme.color}40`,
                  } : {}}
                  onClick={() => navigate(moduleRoute)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      if (e.target === e.currentTarget) navigate(moduleRoute)
                    }
                  }}
                  aria-label={`${item.label} — ${item.module}${item.done ? ' (done)' : ''}`}
                >
                  {/* Time column */}
                  <div
                    className="today-item-time"
                    style={{ color: isNext ? theme.color : undefined }}
                  >
                    {item.time ? formatTimeHHmm(item.time) : '—'}
                  </div>

                  {/* Task checkbox or Module ColorDot */}
                  {item.type === 'task' ? (
                    <button
                      type="button"
                      className="today-task-checkbox-btn"
                      onClick={(e) => handleToggleTask(item.id, item.label, e)}
                      aria-label={item.done ? 'Mark task active' : 'Mark task completed'}
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: 5,
                        border: `1.5px solid ${item.done ? 'var(--color-primary)' : 'var(--color-border)'}`,
                        background: item.done ? 'var(--color-primary)' : 'transparent',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        padding: 0,
                        marginRight: 2,
                        flexShrink: 0,
                        transition: 'all 150ms ease',
                      }}
                    >
                      {item.done && (
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </button>
                  ) : (
                    <div className="today-item-dot">
                      <ColorDot moduleKey={item.module} size={9} />
                    </div>
                  )}

                  {/* Label */}
                  <div className="today-item-label">{item.label}</div>

                  {/* Module badge */}
                  <Badge
                    className="today-item-badge"
                    style={{
                      color:      theme.color,
                      background: `${theme.color}15`,
                      border:     `1px solid ${theme.color}30`,
                    }}
                  >
                    {t(`nav.${item.module}`, item.module)}
                  </Badge>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
