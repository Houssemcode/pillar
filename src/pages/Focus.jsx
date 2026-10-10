import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import ProgressRing from '../components/ui/ProgressRing'
import { useToast } from '../context/ToastContext'
import focusService from '../api/focusService'
import tasksService from '../api/tasksService'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import IconButton from '../components/ui/IconButton'
import Input from '../components/ui/Input'
import EmptyState from '../components/ui/EmptyState'
import FocusSettingsModal from '../components/focus/FocusSettingsModal'
import PageLayout from '../components/layout/PageLayout'
import { useWled, loadWledPrefs } from '../hooks/useWled'

/* ─── Config & Storage Defaults ────────────────────────────── */
const DEFAULT_PREFS = {
  pomodoro: 25,
  short_break: 5,
  long_break: 15,
}

function loadFocusPrefs() {
  try {
    const saved = localStorage.getItem('pillar_focus_prefs')
    if (saved) return { ...DEFAULT_PREFS, ...JSON.parse(saved) }
  } catch {}
  return DEFAULT_PREFS
}

const DAILY_GOAL = 8  // sessions target per day

// Week day labels
const WEEK_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

/* ─── Helpers ─────────────────────────────────────────────── */
const PRIMARY = 'var(--color-primary)'

function pad(n) { return String(n).padStart(2, '0') }

/* ─── Mini Circular Progress ─────────────────────────────── */
function CircularGoal({ done, goal, unitLabel = 'sessions' }) {
  const pct = Math.min((done / goal) * 100, 100)
  const r = 52
  const circ = 2 * Math.PI * r
  const dash = (pct / 100) * circ

  return (
    <div className="focus-goal-ring-wrap">
      <svg width="130" height="130" viewBox="0 0 130 130">
        <circle cx="65" cy="65" r={r} fill="none" stroke="var(--color-surface-3)" strokeWidth="8" />
        <circle
          cx="65" cy="65" r={r} fill="none"
          stroke={PRIMARY}
          strokeWidth="8"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          transform="rotate(-90 65 65)"
          style={{ transition: 'stroke-dasharray 600ms ease' }}
        />
        {/* Dot at tip */}
        {pct > 2 && (
          <circle
            cx={65 + r * Math.cos((pct / 100 * 360 - 90) * Math.PI / 180)}
            cy={65 + r * Math.sin((pct / 100 * 360 - 90) * Math.PI / 180)}
            r="5" fill={PRIMARY}
          />
        )}
      </svg>
      <div className="focus-goal-ring-label">
        <span className="focus-goal-ring-done">{done}</span>
        <span className="focus-goal-ring-sep">/{goal}</span>
        <span className="focus-goal-ring-unit">{unitLabel}</span>
      </div>
    </div>
  )
}

/* ─── Pip Set Counter ────────────────────────────────────── */
function SetPips({ pomodoros, label }) {
  const { t } = useTranslation()
  const pipLabel = label || t('focus.set')
  const filled = pomodoros % 4 === 0 && pomodoros > 0 ? 4 : pomodoros % 4
  const setNum = Math.floor(pomodoros / 4)
  return (
    <div className="focus-set-pips">
      {[0, 1, 2, 3].map(i => (
        <div
          key={i}
          className={`focus-set-pip ${i < filled ? 'focus-set-pip--filled' : ''}`}
        />
      ))}
      <span className="focus-set-label">{pipLabel} {setNum}</span>
    </div>
  )
}

/* ─── Weekly Bar Chart ───────────────────────────────────── */
function WeeklyChart({ weekData }) {
  const { i18n } = useTranslation()
  const isAr = i18n.language === 'ar' || i18n.language?.startsWith('ar')
  const locale = isAr ? 'ar-EG' : 'en-US'

  // Monday to Sunday: 2023-01-02 was a Monday
  const weekDays = useMemo(() => {
    const monday = new Date(2023, 0, 2)
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday)
      d.setDate(monday.getDate() + i)
      return new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(d)
    })
  }, [locale])

  const todayIdx = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1
  const bars = weekDays.map((d, i) => ({
    day: d,
    count: weekData[i] ?? 0,
    isToday: i === todayIdx,
  }))
  const max = Math.max(...bars.map(b => b.count), 1)

  return (
    <div className="focus-weekly-chart">
      {bars.map(b => (
        <div key={b.day} className="focus-weekly-bar-col">
          <div className="focus-weekly-bar-track">
            <div
              className={`focus-weekly-bar-fill ${b.isToday ? 'focus-weekly-bar-fill--today' : ''}`}
              style={{ height: `${(b.count / max) * 100}%` }}
            />
          </div>
          <span className={`focus-weekly-bar-label ${b.isToday ? 'focus-weekly-bar-label--today' : ''}`}>
            {b.day}
          </span>
        </div>
      ))}
    </div>
  )
}

/* ─── Session Row ────────────────────────────────────────── */
function SessionRow({ s, isBreak }) {
  return (
    <div className="focus-session-row">
      <div className={`focus-session-icon ${isBreak ? 'focus-session-icon--break' : ''}`}>
        {isBreak ? '☕' : '🍅'}
      </div>
      <div className="focus-session-info">
        <span className="focus-session-time">{s.time}</span>
        <span className="focus-session-label">{s.label}</span>
      </div>
      <span className="focus-session-dur">{s.duration}</span>
    </div>
  )
}

/* ─── Main Component ─────────────────────────────────────── */
export default function Focus() {
  const { t } = useTranslation()
  const { toastFocus, toastStreak } = useToast()

  // Pro settings state
  const [prefs, setPrefs] = useState(loadFocusPrefs)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isFullScreen, setIsFullScreen] = useState(false)
  const containerRef = useRef(null)

  // Mode & Timer state
  const [mode, setMode] = useState(0) // 0: pomodoro, 1: short, 2: long, 3: custom, 4: stopwatch
  const [customMinutes, setCustomMinutes] = useState(30)
  const [stopwatchSeconds, setStopwatchSeconds] = useState(0)
  const [secondsLeft, setSecondsLeft] = useState(() => (loadFocusPrefs().pomodoro || 25) * 60)
  const [running, setRunning] = useState(false)
  const [pomodoros, setPomodoros] = useState(0)
  const [sessions, setSessions] = useState([])
  const [weekData, setWeekData] = useState(Array(7).fill(0))
  const [stats, setStats] = useState({
    today_seconds: 0,
    week_seconds: 0,
    today_sessions: 0,
    today_minutes: 0,
    week_minutes: 0,
  })
  const [availableTasks, setAvailableTasks] = useState([])
  const [task, setTask] = useState('')
  const [selectedTaskId, setSelectedTaskId] = useState(null)

  const startedAtRef = useRef(null)
  const intervalRef = useRef(null)

  // Modes definition based on user preferences and custom timer
  const modes = useMemo(() => [
    { key: 'pomodoro', labelKey: 'focus.pomodoro', defaultLabel: 'Pomodoro', duration: (prefs.pomodoro || 25) * 60 },
    { key: 'short',    labelKey: 'focus.shortBreak', defaultLabel: 'Short Break', duration: (prefs.short_break || 5) * 60 },
    { key: 'long',     labelKey: 'focus.longBreak', defaultLabel: 'Long Break', duration: (prefs.long_break || 15) * 60 },
    { key: 'custom',   labelKey: 'focus.customTimer', defaultLabel: 'Custom', duration: (customMinutes || 30) * 60 },
    { key: 'stopwatch',labelKey: 'focus.stopwatch', defaultLabel: 'Stopwatch', duration: 0 },
  ], [prefs, customMinutes])

  // Stable refs so interval callbacks always read the freshest state
  const taskRef = useRef(task)
  const selectedTaskIdRef = useRef(selectedTaskId)
  const modeRef = useRef(mode)
  const modesRef = useRef(modes)

  useEffect(() => { taskRef.current = task }, [task])
  useEffect(() => { selectedTaskIdRef.current = selectedTaskId }, [selectedTaskId])
  useEffect(() => { modeRef.current = mode }, [mode])
  useEffect(() => { modesRef.current = modes }, [modes])

  /* ── WLED Smart LED Strip Integration ── */
  const [wledPrefs, setWledPrefs] = useState(loadWledPrefs)
  const wled = useWled(wledPrefs, modes)

  /* ── Fullscreen API Synchronization ── */
  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      if (containerRef.current?.requestFullscreen) {
        containerRef.current.requestFullscreen().catch(err => {
          console.warn('[Focus] Failed to enter fullscreen:', err)
        })
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(err => {
          console.warn('[Focus] Failed to exit fullscreen:', err)
        })
      }
    }
  }

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullScreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  /* ── Preferences Update ── */
  const handleSavePrefs = (newPrefs) => {
    const { wled: newWled, ...timerPrefs } = newPrefs
    setPrefs(timerPrefs)
    localStorage.setItem('pillar_focus_prefs', JSON.stringify(timerPrefs))
    if (newWled) setWledPrefs(newWled)
    // If timer is idle, immediately update duration for active standard mode
    if (!running) {
      if (mode === 0) setSecondsLeft(timerPrefs.pomodoro * 60)
      else if (mode === 1) setSecondsLeft(timerPrefs.short_break * 60)
      else if (mode === 2) setSecondsLeft(timerPrefs.long_break * 60)
    }
    toastFocus?.(t('focus.saveSettings'), '')
  }

  /* ── Fetch all focus data and telemetry from Django backend ── */
  const loadFocusData = useCallback(async () => {
    try {
      const [statsRes, weeklyRes, todayRes, tasksRes] = await Promise.all([
        focusService.getStats().catch(err => {
          console.warn('[Focus] Failed to fetch stats:', err)
          return null
        }),
        focusService.getWeeklyStats().catch(err => {
          console.warn('[Focus] Failed to fetch weekly stats:', err)
          return []
        }),
        focusService.getTodaySessions().catch(err => {
          console.warn('[Focus] Failed to fetch today sessions:', err)
          return null
        }),
        tasksService.getTasks({ is_completed: 'false', trash: 'false' }).catch(err => {
          console.warn('[Focus] Failed to fetch tasks:', err)
          return []
        }),
      ])

      if (statsRes) {
        setStats(statsRes)
        setPomodoros(statsRes.today_sessions ?? 0)
      }

      if (Array.isArray(weeklyRes) && weeklyRes.length > 0) {
        setWeekData(weeklyRes.map(d => d.count))
      }

      if (todayRes?.sessions) {
        setSessions(todayRes.sessions.map(s => ({
          id: s.id,
          label: s.label || s.task_title || (s.mode === 'pomodoro' ? t('focus.title') : t('focus.shortBreak')),
          duration: `${s.duration_minutes || Math.round((s.duration || 1500) / 60)}m`,
          time: s.completed_at || s.end_time || s.created_at
            ? new Date(s.completed_at || s.end_time || s.created_at).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit', hour12: false })
            : '',
          isBreak: s.mode !== 'pomodoro',
        })))
        if (!statsRes) {
          setPomodoros(todayRes.count ?? 0)
        }
      }

      const activeTasks = Array.isArray(tasksRes) ? tasksRes : (tasksRes?.results ?? [])
      setAvailableTasks(activeTasks)
    } catch (err) {
      console.error('[Focus] Error loading focus data:', err)
    }
  }, [t])

  useEffect(() => {
    loadFocusData()
  }, [loadFocusData])

  /* ── Handle Countdown Timer Completion ── */
  const handleComplete = useCallback(async () => {
    setRunning(false)
    const currentMode = modesRef.current[modeRef.current] || modesRef.current[0]
    const currentTaskText = taskRef.current
    const currentTaskId = selectedTaskIdRef.current
    const timeInMinutes = Math.max(1, Math.round(currentMode.duration / 60))
    const isPomodoroOrCustom = currentMode.key === 'pomodoro' || currentMode.key === 'custom'
    const backendMode = currentMode.key === 'short'
      ? 'short_break'
      : currentMode.key === 'long'
      ? 'long_break'
      : 'pomodoro'

    // Fire WLED completion flash + breathe alert
    wledRef.current.onComplete(currentMode.key)

    const now = new Date()
    const timeStr = `${pad(now.getHours())}:${pad(now.getMinutes())}`
    const defaultLabel = currentMode.key === 'custom'
      ? t('focus.customTimer')
      : isPomodoroOrCustom ? t('focus.title') : t('focus.shortBreak')

    const sessionEntry = {
      label: currentTaskText || defaultLabel,
      duration: `${timeInMinutes}m`,
      time: timeStr,
      isBreak: !isPomodoroOrCustom,
    }

    // Optimistic UI update
    setSessions(prev => [sessionEntry, ...prev].slice(0, 20))
    if (isPomodoroOrCustom) {
      setPomodoros(prev => prev + 1)
    }

    try {
      await focusService.saveSession({
        mode: backendMode,
        duration_minutes: timeInMinutes,
        duration: currentMode.duration,
        status: 'completed',
        task: currentTaskId || null,
        label: currentTaskText || defaultLabel,
        start_time: startedAtRef.current || new Date(Date.now() - currentMode.duration * 1000).toISOString(),
        end_time: now.toISOString(),
      })
      // Refetch stats to keep entire UI, metric cards & weekly breakdown synchronized
      await loadFocusData()
    } catch (err) {
      console.error('[Focus] Failed to save session:', err)
    } finally {
      startedAtRef.current = null
    }

    // Notifications
    if (isPomodoroOrCustom) {
      const nextCount = pomodoros + 1
      if (nextCount % 4 === 0) {
        toastStreak?.(t('focus.fourSessionsToast'), '')
      } else {
        toastFocus?.(t('focus.sessionDoneToast'), currentTaskText ? `"${currentTaskText}"` : '')
      }
    } else {
      toastFocus?.(t('focus.breakOverToast'), '')
    }
  }, [loadFocusData, pomodoros, toastFocus, toastStreak, t])

  /* ── Handle Stopwatch Stop/Completion ── */
  const handleStopwatchComplete = useCallback(async () => {
    if (stopwatchSeconds < 1) return
    setRunning(false)
    const elapsedSecs = stopwatchSeconds
    const elapsedMins = Math.max(1, Math.round(elapsedSecs / 60))
    const currentTaskText = taskRef.current
    const currentTaskId = selectedTaskIdRef.current
    const now = new Date()
    const timeStr = `${pad(now.getHours())}:${pad(now.getMinutes())}`
    const defaultLabel = t('focus.stopwatch')

    const sessionEntry = {
      label: currentTaskText || defaultLabel,
      duration: `${elapsedMins}m`,
      time: timeStr,
      isBreak: false,
    }

    setSessions(prev => [sessionEntry, ...prev].slice(0, 20))
    setPomodoros(prev => prev + 1)

    try {
      await focusService.saveSession({
        mode: 'pomodoro',
        duration_minutes: elapsedMins,
        duration: elapsedSecs,
        status: 'completed',
        task: currentTaskId || null,
        label: currentTaskText || defaultLabel,
        start_time: startedAtRef.current || new Date(Date.now() - elapsedSecs * 1000).toISOString(),
        end_time: now.toISOString(),
      })
      await loadFocusData()
    } catch (err) {
      console.error('[Focus] Failed to save stopwatch session:', err)
    } finally {
      startedAtRef.current = null
      setStopwatchSeconds(0)
    }

    toastFocus?.(t('focus.sessionDoneToast'), currentTaskText ? `"${currentTaskText}"` : '')
  }, [stopwatchSeconds, loadFocusData, toastFocus, t])

  /* ── Stable ref for WLED to prevent timer restarts ── */
  const wledRef = useRef(wled)
  useEffect(() => { wledRef.current = wled }, [wled])

  /* ── Universal Timer Tick (Handles both count-down and count-up) ── */
  useEffect(() => {
    if (!running) {
      clearInterval(intervalRef.current)
      wledRef.current.onPause()
      return
    }

    // Light WLED strip ONLY once when timer starts
    if (!startedAtRef.current) {
      startedAtRef.current = new Date().toISOString()
      wledRef.current.onStart(mode)
    }

    if (mode === 4) {
      // Stopwatch: count UP
      intervalRef.current = setInterval(() => {
        setStopwatchSeconds(prev => prev + 1)
      }, 1000)
    } else {
      // Countdown: count DOWN & sync WLED progress
      intervalRef.current = setInterval(() => {
        setSecondsLeft(prev => {
          if (prev <= 1) {
            handleComplete()
            return 0
          }
          const next = prev - 1
          wledRef.current.onTick(modeRef.current, next)
          return next
        })
      }, 1000)
    }

    return () => clearInterval(intervalRef.current)
  }, [running, mode, handleComplete])

  /* ── Mode switching & reset ── */
  const switchMode = (idx) => {
    setMode(idx)
    setRunning(false)
    wledRef.current.onPause()
    startedAtRef.current = null
    if (idx === 4) {
      setStopwatchSeconds(0)
    } else if (idx === 3) {
      setSecondsLeft(customMinutes * 60)
    } else {
      setSecondsLeft(modes[idx].duration)
    }
  }

  const reset = () => {
    setRunning(false)
    wledRef.current.onPause()
    startedAtRef.current = null
    if (mode === 4) {
      setStopwatchSeconds(0)
    } else if (mode === 3) {
      setSecondsLeft(customMinutes * 60)
    } else {
      setSecondsLeft(modes[mode].duration)
    }
  }

  const toggleTimer = () => {
    if (mode === 4) {
      setRunning(r => !r)
    } else {
      if (secondsLeft === 0) reset()
      else setRunning(r => !r)
    }
  }

  const handleCustomMinutesChange = (newVal) => {
    const mins = Math.max(1, Math.min(360, Number(newVal) || 1))
    setCustomMinutes(mins)
    if (mode === 3 && !running) {
      setSecondsLeft(mins * 60)
    }
  }

  const handleTaskInputChange = (e) => {
    const val = e.target.value
    setTask(val)
    const matched = availableTasks.find(tItem => (tItem.title || tItem.text)?.toLowerCase() === val.trim().toLowerCase())
    setSelectedTaskId(matched ? matched.id : null)
  }

  // Display values
  const isStopwatch = mode === 4
  let progress = 0
  let displayMinutes = '00'
  let displaySecs = '00'

  if (isStopwatch) {
    progress = Math.min(100, (stopwatchSeconds / 3600) * 100)
    displayMinutes = pad(Math.floor(stopwatchSeconds / 60))
    displaySecs = pad(stopwatchSeconds % 60)
  } else {
    const totalSecs = modes[mode]?.duration || 1500
    progress = totalSecs > 0 ? ((totalSecs - secondsLeft) / totalSecs) * 100 : 0
    displayMinutes = pad(Math.floor(secondsLeft / 60))
    displaySecs = pad(secondsLeft % 60)
  }

  const todaySessions = Array.isArray(sessions) ? sessions : []

  return (
    <div
      ref={containerRef}
      className={`page focus-page ${isFullScreen ? 'focus-page--fullscreen' : ''}`}
    >
      {/* ── Main 2-column dashboard via PageLayout ── */}
      <PageLayout
        className="focus-dashboard-layout"
        sidebarWidth="320px"
        bodyClassName="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start w-full"
        mainClassName="w-full flex-1 min-w-0"
        sidebarClassName="w-full lg:w-80 lg:shrink-0"
        header={
          <div className="focus-top-bar">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div className="focus-badge">
                🍅 <strong>{stats.today_sessions ?? pomodoros}</strong> {t('focus.sessions')}
              </div>
              {wled.isActive && (
                <div
                  title={`WLED Connected · ${wledPrefs.ip} · ${wledPrefs.ledCount} LEDs${wledPrefs.hyperionSync ? ' · Hyperion Sync Active' : ''}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '3px 10px',
                    borderRadius: 20,
                    background: 'rgba(16,185,129,.12)',
                    border: '1px solid rgba(16,185,129,.25)',
                    fontSize: 11,
                    fontWeight: 600,
                    color: '#10b981',
                    userSelect: 'none',
                  }}
                >
                  <span
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: '50%',
                      background: '#10b981',
                      boxShadow: '0 0 6px #10b981',
                      animation: running ? 'pulse 1.5s infinite' : 'none',
                    }}
                  />
                  <span>WLED ({wledPrefs.ledCount} LEDs{wledPrefs.hyperionSync ? ' + Hyperion' : ''})</span>
                </div>
              )}
            </div>

            <div className="focus-top-actions">
              <IconButton
                variant="ghost"
                size="md"
                onClick={toggleFullScreen}
                ariaLabel={isFullScreen ? t('focus.exitFullScreen') : t('focus.fullScreen')}
                title={isFullScreen ? t('focus.exitFullScreen') : t('focus.fullScreen')}
                icon={
                  isFullScreen ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 14h6m0 0v6m0-6-7 7m17-11h-6m0 0V4m0 6 7-7m-7 17v-6m0 0h6m-6 0 7 7M10 4v6m0 0H4m6 0L3 3" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
                    </svg>
                  )
                }
              />
              <IconButton
                variant="ghost"
                size="md"
                onClick={() => setIsSettingsOpen(true)}
                ariaLabel={t('focus.settings')}
                title={t('focus.settings')}
                icon={
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="3" />
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                  </svg>
                }
              />
            </div>
          </div>
        }
        sidebar={
          !isFullScreen ? (
            <div className="focus-analytics-col">
              <div className="focus-analytics-header">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
                </svg>
                {t('focus.title')}
              </div>

              {/* Quick Metric Cards: Today's Sessions & Focus Hours */}
              <div className="focus-quick-metrics grid grid-cols-2 gap-3 mb-4 w-full">
                <Card className="p-3 sm:p-4 overflow-hidden flex flex-col justify-between" style={{ padding: '12px 14px' }}>
                  <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {t('focus.todaySessions')}
                  </div>
                  <div style={{ fontSize: '20px', fontWeight: '700', color: 'var(--color-primary)', marginTop: '4px' }}>
                    {stats.today_sessions ?? pomodoros}{' '}
                    <span style={{ fontSize: '12px', fontWeight: '400', color: 'var(--color-text-secondary)' }}>
                      / {DAILY_GOAL}
                    </span>
                  </div>
                </Card>
                <Card className="p-3 sm:p-4 overflow-hidden flex flex-col justify-between" style={{ padding: '12px 14px' }}>
                  <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {t('focus.focusHours')}
                  </div>
                  <div style={{ fontSize: '20px', fontWeight: '700', color: 'var(--color-text-primary)', marginTop: '4px' }}>
                    {((stats.today_seconds || 0) / 3600).toFixed(1)}{' '}
                    <span style={{ fontSize: '12px', fontWeight: '400', color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>
                      {t('common.hours')} <span className="hidden sm:inline">({Math.round(stats.today_minutes || 0)}{t('common.minutes')})</span>
                    </span>
                  </div>
                </Card>
              </div>

              {/* Goal progress ring */}
              <Card className="focus-analytics-card">
                <div className="focus-analytics-card-title">{t('focus.dailyGoal')}</div>
                <CircularGoal done={stats.today_sessions ?? pomodoros} goal={DAILY_GOAL} unitLabel={t('focus.sessions')} />
              </Card>

              {/* Recent sessions list */}
              <Card className="focus-analytics-card">
                <div className="focus-analytics-card-title">{t('focus.todaySessions')}</div>
                {todaySessions.length === 0 ? (
                  <div className="focus-analytics-empty">{t('focus.noSessionsYet')}</div>
                ) : (
                  <div className="focus-session-list">
                    {todaySessions.map((s, i) => (
                      <SessionRow key={s.id || i} s={s} isBreak={s.isBreak} />
                    ))}
                  </div>
                )}
              </Card>

              {/* Weekly chart */}
              <Card className="focus-analytics-card">
                <div className="focus-analytics-card-title">{t('focus.weeklyBreakdown')}</div>
                <WeeklyChart weekData={weekData} />
              </Card>
            </div>
          ) : null
        }
      >
        {/* ═══ LEFT — Timer ═══ */}
        <Card className="focus-timer-col">

          {/* Mode tabs */}
          <div className="focus-mode-tabs flex flex-nowrap overflow-x-auto hide-scrollbar gap-2 px-1.5 py-1 w-full max-w-full lg:max-w-[540px]">
            {modes.map((m, i) => (
              <button
                key={m.key}
                id={`focus-mode-${m.key}`}
                onClick={() => switchMode(i)}
                className={`focus-mode-tab flex-shrink-0 lg:flex-1 whitespace-nowrap ${mode === i ? 'focus-mode-tab--active' : ''}`}
              >
                {t(m.labelKey)}
              </button>
            ))}
          </div>

          {/* Custom Duration Stepper (Rendered when Custom mode is active) */}
          {mode === 3 && (
            <div className="focus-custom-duration-wrap">
              <span className="focus-custom-duration-label">{t('focus.enterMinutes')}:</span>
              <button
                type="button"
                className="focus-ctrl-btn"
                style={{ width: 28, height: 28, fontSize: 14 }}
                onClick={() => handleCustomMinutesChange(customMinutes - 5)}
                disabled={running || customMinutes <= 5}
              >
                −
              </button>
              <input
                type="number"
                min="1"
                max="360"
                value={customMinutes}
                disabled={running}
                onChange={(e) => handleCustomMinutesChange(e.target.value)}
                className="focus-custom-duration-input"
              />
              <span style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>{t('common.minutes')}</span>
              <button
                type="button"
                className="focus-ctrl-btn"
                style={{ width: 28, height: 28, fontSize: 14 }}
                onClick={() => handleCustomMinutesChange(customMinutes + 5)}
                disabled={running || customMinutes >= 360}
              >
                +
              </button>
            </div>
          )}

          {/* Active task input with autocomplete from database tasks */}
          <div className="focus-active-task-wrap w-full max-w-[440px]">
            <Input
              id="focus-active-task"
              placeholder={t('focus.workingOn')}
              value={task}
              onChange={handleTaskInputChange}
              list="focus-available-tasks-list"
              leadingIcon={
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
              }
            />
            {availableTasks.length > 0 && (
              <datalist id="focus-available-tasks-list">
                {availableTasks.map(tItem => (
                  <option key={tItem.id} value={tItem.title || tItem.text}>
                    {tItem.priority ? `[${tItem.priority.toUpperCase()}]` : ''}
                  </option>
                ))}
              </datalist>
            )}
          </div>

          {/* Timer ring */}
          <div className="focus-ring-wrap w-56 h-56 sm:w-64 sm:h-64 lg:w-[260px] lg:h-[260px] max-w-[80vw] aspect-square">
            <ProgressRing
              radius={120}
              strokeWidth={8}
              progress={progress}
              size={260}
              className="w-full h-full"
              style={{ width: '100%', height: '100%' }}
            >
              <div className="focus-ring-inner">
                <div className="focus-ring-time">{displayMinutes}:{displaySecs}</div>
                <div className="focus-ring-mode">{t(modes[mode]?.labelKey || 'focus.pomodoro')}</div>
                {running && task && (
                  <div className="focus-ring-task">{task}</div>
                )}
              </div>
            </ProgressRing>
          </div>

          {/* Controls */}
          <div className="focus-controls">
            <IconButton variant="ghost" size="lg" onClick={reset} ariaLabel={t('focus.reset')} icon={
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <polyline points="1,4 1,10 7,10" /><path d="M3.51 15a9 9 0 1 0 .49-4.44" />
              </svg>
            } />
            
            <Button
              variant="primary"
              size="lg"
              onClick={toggleTimer}
              className="focus-play-btn"
              icon={
                running ? (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <rect x="6" y="4" width="4" height="16" rx="1" /><rect x="14" y="4" width="4" height="16" rx="1" />
                  </svg>
                ) : (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <polygon points="5,3 19,12 5,21" />
                  </svg>
                )
              }
            >
              {running ? t('focus.pause') : t('focus.start')}
            </Button>
            
            {isStopwatch ? (
              <IconButton
                variant="ghost"
                size="lg"
                onClick={handleStopwatchComplete}
                disabled={stopwatchSeconds === 0}
                ariaLabel={t('common.done')}
                title={t('common.done')}
                icon={
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--color-success, #10B981)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                }
              />
            ) : (
              <IconButton
                variant="ghost"
                size="lg"
                onClick={() => switchMode((mode + 1) % modes.length)}
                ariaLabel={t('focus.skip')}
                title={t('focus.skip')}
                icon={
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <polygon points="5,4 15,12 5,20" /><line x1="19" y1="5" x2="19" y2="19" />
                  </svg>
                }
              />
            )}
          </div>

          {/* Set pips */}
          <SetPips pomodoros={stats.today_sessions ?? pomodoros} />

        </Card>
      </PageLayout>

      {/* ── Settings Modal ── */}
      <FocusSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        prefs={prefs}
        onSave={handleSavePrefs}
      />
    </div>
  )
}
