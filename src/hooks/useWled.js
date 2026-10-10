/**
 * useWled — WLED HTTP / JSON API integration for Pomodoro LED strip progress bar
 *
 * Designed for ESP32 / ESP8266 running WLED firmware.
 *
 * Behavior:
 *  • Work session (Pomodoro / Custom work): Warm Orange / Red progress bar
 *  • Short break: Emerald Green countdown
 *  • Long break: Electric Blue countdown
 *  • End of session: 3x quick flash alert + 3s gentle breathing glow, then standby
 *  • Timer paused / stopped: LEDs turn off (standby)
 *  • Direction modes:
 *      - 'countdown': Starts with ALL LEDs lit, extinguishes one-by-one as time counts down (Default)
 *      - 'fill': Starts with LEDs off, lights up one-by-one as time elapses
 *
 * Settings are persisted in localStorage under 'pillar_wled_prefs'.
 */

import { useRef, useCallback } from 'react'

/* ─── Defaults & Storage ────────────────────────────────────── */
const STORAGE_KEY = 'pillar_wled_prefs'

export const WLED_DEFAULTS = {
  enabled: false,
  ip: '',
  ledCount: 86,
  brightness: 128,
  mode: 'countdown', // 'countdown' | 'fill'
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

/* ─── Phase Colors (RGB arrays for WLED) ────────────────────── */
export const PHASE_COLORS = {
  work:       [255, 80,  0],    // Warm Orange / Red
  shortBreak: [0,   255, 60],   // Emerald Green
  longBreak:  [0,   120, 255],  // Electric Blue
}

function modeToPhase(modeKey) {
  if (modeKey === 'short')  return 'shortBreak'
  if (modeKey === 'long')   return 'longBreak'
  return 'work'
}

/* ─── WLED API Helpers ──────────────────────────────────────── */
function buildUrl(ip) {
  const cleanIp = ip.trim().replace(/^https?:\/\//, '').replace(/\/.*$/, '')
  return `http://${cleanIp}/json/state`
}

async function sendWled(ip, payload) {
  if (!ip) return
  try {
    await fetch(buildUrl(ip), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(1800),
    })
  } catch (err) {
    // Silent fail so network timeouts don't block the UI timer
    console.warn('[WLED] Network notice:', err?.message)
  }
}

/** Turn off all LEDs (standby) */
export async function wledOff(ip) {
  if (!ip) return
  await sendWled(ip, { on: false })
}

/** Show progress on the strip */
export async function wledProgress(ip, ledCount, ledsLit, color, brightness) {
  if (!ip || !ledCount) return
  const count = Math.max(1, Number(ledCount) || 86)
  const lit = Math.max(0, Math.min(count, Math.round(ledsLit)))

  let seg = []
  if (lit === 0) {
    // All off
    seg = [{ id: 0, start: 0, stop: count, col: [[0, 0, 0]], fx: 0 }]
  } else if (lit >= count) {
    // All lit
    seg = [
      { id: 0, start: 0, stop: count, col: [color], fx: 0 },
      { id: 1, start: count, stop: count, col: [[0, 0, 0]], fx: 0 },
    ]
  } else {
    // First `lit` LEDs colored, remaining dark
    seg = [
      { id: 0, start: 0, stop: lit, col: [color], fx: 0 },
      { id: 1, start: lit, stop: count, col: [[0, 0, 0]], fx: 0 },
    ]
  }

  await sendWled(ip, {
    on: true,
    bri: Math.max(5, Math.min(255, Number(brightness) || 128)),
    seg,
  })
}

/** Alert effect: 3 quick flashes + 3s breathe + off */
export async function wledComplete(ip, ledCount, color, brightness) {
  if (!ip) return
  const count = Math.max(1, Number(ledCount) || 86)
  const bri = Math.max(5, Math.min(255, Number(brightness) || 128))

  // 3 quick flashes
  for (let i = 0; i < 3; i++) {
    await sendWled(ip, {
      on: true,
      bri: 255,
      seg: [{ id: 0, start: 0, stop: count, col: [color], fx: 0 }],
    })
    await new Promise(r => setTimeout(r, 180))
    await sendWled(ip, { on: false })
    await new Promise(r => setTimeout(r, 180))
  }

  // Gentle breathing effect for 3.5 seconds
  await sendWled(ip, {
    on: true,
    bri,
    seg: [{ id: 0, start: 0, stop: count, col: [color], fx: 2 /* Breathe */ }],
  })
  await new Promise(r => setTimeout(r, 3500))
  await wledOff(ip)
}

/** Test connection helper with live feedback */
export async function testWledConnection(ip, ledCount, brightness) {
  if (!ip || !ip.trim()) {
    return { ok: false, error: 'الرجاء إدخال عنوان IP الخاص بـ WLED أولاً' }
  }

  const count = Math.max(1, Number(ledCount) || 86)
  const bri = Math.max(10, Math.min(255, Number(brightness) || 128))

  try {
    const url = buildUrl(ip)
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        on: true,
        bri,
        seg: [{ id: 0, start: 0, stop: count, col: [[0, 255, 60]], fx: 0 }],
      }),
      signal: AbortSignal.timeout(3000),
    })

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`)
    }

    // Keep lit green for 2 seconds then turn off
    setTimeout(() => {
      wledOff(ip)
    }, 2000)

    return { ok: true }
  } catch (err) {
    return {
      ok: false,
      error: err.name === 'TimeoutError'
        ? 'انتهت مهلة الاتصال (تأكد أن الجهاز على نفس الشبكة المحلية وتأكد من الـ IP)'
        : 'تعذر الاتصال بالـ ESP32. تأكد من تفعيل CORS في WLED: Settings → Security → Allow CORS: ✓',
    }
  }
}

/* ─── Hook ──────────────────────────────────────────────────── */
/**
 * @param {object} prefs - { enabled, ip, ledCount, brightness, mode }
 * @param {Array} modes  - modes list from Focus.jsx
 */
export function useWled(prefs, modes) {
  const lastTickRef = useRef(0)

  const isActive = Boolean(
    prefs &&
    prefs.enabled &&
    prefs.ip &&
    prefs.ip.trim().length > 0 &&
    Number(prefs.ledCount) > 0
  )

  /**
   * Called every tick while countdown is running.
   * Rate-limited to max 1 request per 900ms.
   */
  const onTick = useCallback((modeIndex, secondsLeft) => {
    if (!isActive) return

    const now = Date.now()
    if (now - lastTickRef.current < 900) return
    lastTickRef.current = now

    const currentMode = modes[modeIndex]
    if (!currentMode || currentMode.duration <= 0) return // skip stopwatch

    const phase = modeToPhase(currentMode.key)
    const color = PHASE_COLORS[phase]
    const totalSecs = currentMode.duration
    const ledCount = Number(prefs.ledCount) || 86

    let ledsLit = ledCount
    if (prefs.mode === 'fill') {
      // Ascending (fills up)
      const elapsed = Math.max(0, totalSecs - secondsLeft)
      ledsLit = Math.ceil((elapsed / totalSecs) * ledCount)
    } else {
      // Countdown (extinguishes one by one, default)
      const ratio = Math.max(0, Math.min(1, secondsLeft / totalSecs))
      ledsLit = Math.ceil(ratio * ledCount)
    }

    wledProgress(prefs.ip, ledCount, ledsLit, color, prefs.brightness)
  }, [isActive, prefs, modes])

  /** Called when timer starts */
  const onStart = useCallback((modeIndex) => {
    if (!isActive) return
    const currentMode = modes[modeIndex]
    if (!currentMode || currentMode.duration <= 0) return

    const phase = modeToPhase(currentMode.key)
    const color = PHASE_COLORS[phase]
    const ledCount = Number(prefs.ledCount) || 86

    // On start:
    // If countdown: all LEDs are lit!
    // If fill: 1st LED is lit!
    const ledsLit = prefs.mode === 'fill' ? 1 : ledCount
    wledProgress(prefs.ip, ledCount, ledsLit, color, prefs.brightness)
  }, [isActive, prefs, modes])

  /** Called when timer is paused or reset */
  const onPause = useCallback(() => {
    if (!isActive) return
    wledOff(prefs.ip)
  }, [isActive, prefs.ip])

  /** Called when timer completes */
  const onComplete = useCallback((modeKey) => {
    if (!isActive) return
    const phase = modeToPhase(modeKey)
    const color = PHASE_COLORS[phase]
    const ledCount = Number(prefs.ledCount) || 86
    wledComplete(prefs.ip, ledCount, color, prefs.brightness)
  }, [isActive, prefs])

  return {
    isActive,
    onTick,
    onStart,
    onPause,
    onComplete,
  }
}
