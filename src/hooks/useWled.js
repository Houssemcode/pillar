/**
 * useWled — WLED HTTP API integration for Pomodoro LED progress bar
 *
 * Behaviour:
 *  • Work  (mode 0 / custom 3) → orange progress bar fading left→right
 *  • Short break (mode 1)       → green  progress bar
 *  • Long  break (mode 2)       → blue   progress bar
 *  • Session complete           → flash effect then steady glow, then LEDs off
 *  • Timer paused / reset       → LEDs turn off
 *
 * Settings are persisted in localStorage under 'pillar_wled_prefs'.
 */

import { useRef, useCallback } from 'react'

/* ─── Defaults ─────────────────────────────────────────────── */
const STORAGE_KEY = 'pillar_wled_prefs'

export const WLED_DEFAULTS = {
  enabled: false,
  ip: '',
  ledCount: 30,
  brightness: 128,
}

export function loadWledPrefs() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) return { ...WLED_DEFAULTS, ...JSON.parse(saved) }
  } catch {}
  return { ...WLED_DEFAULTS }
}

export function saveWledPrefs(prefs) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...WLED_DEFAULTS, ...prefs }))
  } catch {}
}

/* ─── Phase colour map ──────────────────────────────────────── */
const PHASE_COLORS = {
  work:       [255, 120,  0],   // warm orange
  shortBreak: [0,   200, 80],   // emerald green
  longBreak:  [30,  100, 255],  // calm blue
}

function modeToPhase(modeKey) {
  if (modeKey === 'short')  return 'shortBreak'
  if (modeKey === 'long')   return 'longBreak'
  return 'work'
}

/* ─── WLED API helpers ──────────────────────────────────────── */
function buildUrl(ip) {
  const host = ip.startsWith('http') ? ip : `http://${ip}`
  return `${host.replace(/\/$/, '')}/json/state`
}

async function sendWled(ip, payload) {
  try {
    await fetch(buildUrl(ip), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(1500),
    })
  } catch (err) {
    // Silent — don't disrupt the timer if WLED is unreachable
    console.warn('[WLED] Request failed:', err?.message)
  }
}

/** Turn off all LEDs */
async function wledOff(ip) {
  await sendWled(ip, { on: false })
}

/** Show a solid progress bar: `ledsLit` LEDs lit from index 0 */
async function wledProgress(ip, ledCount, ledsLit, color, brightness) {
  const lit = Math.max(0, Math.min(ledCount, ledsLit))
  await sendWled(ip, {
    on: true,
    bri: brightness,
    seg: [
      {
        id: 0,
        start: 0,
        stop: ledCount,
        fx: 0,       // Solid
        col: [[0, 0, 0]],
      },
      ...(lit > 0
        ? [{
            id: 1,
            start: 0,
            stop: lit,
            fx: 0,
            col: [color],
          }]
        : []),
    ],
  })
}

/** Flash then gentle breathing to signal session end */
async function wledComplete(ip, ledCount, color, brightness) {
  // Flash 3× quickly
  for (let i = 0; i < 3; i++) {
    await sendWled(ip, { on: true, bri: 255, seg: [{ id: 0, start: 0, stop: ledCount, fx: 0, col: [color] }] })
    await new Promise(r => setTimeout(r, 160))
    await sendWled(ip, { on: false })
    await new Promise(r => setTimeout(r, 160))
  }
  // Gentle breathing for 3 seconds then off
  await sendWled(ip, { on: true, bri: brightness, seg: [{ id: 0, start: 0, stop: ledCount, fx: 2 /* Breathe */, col: [color] }] })
  await new Promise(r => setTimeout(r, 3000))
  await wledOff(ip)
}

/* ─── Hook ──────────────────────────────────────────────────── */
/**
 * @param {object} prefs  — { enabled, ip, ledCount, brightness }
 * @param {object} modes  — the modes array from Focus.jsx
 */
export function useWled(prefs, modes) {
  const lastUpdateRef = useRef(0)

  const isActive = prefs.enabled && prefs.ip && prefs.ledCount > 0

  /**
   * Call every second while the timer is running.
   * @param {number} modeIndex  — current mode index
   * @param {number} secondsLeft — remaining seconds
   */
  const onTick = useCallback((modeIndex, secondsLeft) => {
    if (!isActive) return

    // Rate limit: max 1 request per second (skip if called too fast)
    const now = Date.now()
    if (now - lastUpdateRef.current < 900) return
    lastUpdateRef.current = now

    const currentMode = modes[modeIndex]
    if (!currentMode || currentMode.duration === 0) return  // stopwatch: skip

    const phase = modeToPhase(currentMode.key)
    const color = PHASE_COLORS[phase]
    const totalSecs = currentMode.duration
    const elapsed = totalSecs - secondsLeft
    const ledsLit = Math.ceil((elapsed / totalSecs) * prefs.ledCount)

    wledProgress(prefs.ip, prefs.ledCount, ledsLit, color, prefs.brightness)
  }, [isActive, prefs, modes])

  /** Call when the timer is paused or reset */
  const onPause = useCallback(() => {
    if (!isActive) return
    wledOff(prefs.ip)
  }, [isActive, prefs.ip])

  /** Call when a session completes */
  const onComplete = useCallback((modeKey) => {
    if (!isActive) return
    const phase = modeToPhase(modeKey)
    const color = PHASE_COLORS[phase]
    wledComplete(prefs.ip, prefs.ledCount, color, prefs.brightness)
  }, [isActive, prefs])

  /** Call when the timer starts (lights the first LED immediately) */
  const onStart = useCallback((modeIndex) => {
    if (!isActive) return
    const currentMode = modes[modeIndex]
    if (!currentMode || currentMode.duration === 0) return
    const phase = modeToPhase(currentMode.key)
    const color = PHASE_COLORS[phase]
    wledProgress(prefs.ip, prefs.ledCount, 1, color, prefs.brightness)
  }, [isActive, prefs, modes])

  return { onTick, onPause, onComplete, onStart, isActive }
}
