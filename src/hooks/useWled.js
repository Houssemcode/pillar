/**
 * useWled — WLED HTTP / JSON API integration for Pomodoro LED strip progress bar
 *
 * Designed for ESP32 / ESP8266 running WLED firmware.
 *
 * Behavior:
 *  • Work session (Pomodoro / Custom work): Warm Orange / Red progress bar
 *  • Short break: Emerald Green countdown
 *  • Long break: Electric Blue countdown
 *  • End of session: 3x quick flash alert + 3.5s gentle breathing glow, then standby
 *  • Timer paused / stopped: LEDs turn off (standby)
 *  • Direction modes:
 *      - 'countdown': Starts with ALL LEDs lit, extinguishes one-by-one as time counts down (Default)
 *      - 'fill': Starts with LEDs off, lights up one-by-one as time elapses
 *
 * Settings are persisted in localStorage under 'pillar_wled_prefs'.
 */

import { useRef, useEffect, useCallback, useMemo } from 'react'

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

function rgbToHex(rgb) {
  if (typeof rgb === 'string') return rgb.replace('#', '')
  const [r, g, b] = rgb
  return ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()
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
    // Silent fail so network timeouts don't disrupt timer
    console.warn('[WLED] Network notice:', err?.message)
  }
}

/** Turn off all LEDs (standby) */
export async function wledOff(ip) {
  if (!ip) return
  await sendWled(ip, { on: false })
}

/**
 * Show progress on the strip using WLED individual range addressing `i`.
 * This explicitly turns ON the lit range and turns OFF (black: "000000")
 * the remaining pixels without modifying segment boundaries.
 */
export async function wledProgress(ip, ledCount, ledsLit, color, brightness) {
  if (!ip || !ledCount) return
  const count = Math.max(1, Number(ledCount) || 86)
  const lit = Math.max(0, Math.min(count, Math.round(ledsLit)))
  const hex = rgbToHex(color)

  let iArray = []
  if (lit <= 0) {
    // All off
    iArray = [0, count, '000000']
  } else if (lit >= count) {
    // All on
    iArray = [0, count, hex]
  } else {
    // First `lit` LEDs colored, from `lit` to `count` turned black
    iArray = [0, lit, hex, lit, count, '000000']
  }

  await sendWled(ip, {
    on: true,
    bri: Math.max(5, Math.min(255, Number(brightness) || 128)),
    seg: [
      {
        id: 0,
        start: 0,
        stop: count,
        fx: 0, // Solid
        col: [color],
        i: iArray,
      },
    ],
  })
}

/** Alert effect: 3 quick flashes + 3.5s breathe + off */
export async function wledComplete(ip, ledCount, color, brightness) {
  if (!ip) return
  const count = Math.max(1, Number(ledCount) || 86)
  const bri = Math.max(5, Math.min(255, Number(brightness) || 128))
  const hex = rgbToHex(color)

  // 3 quick flashes
  for (let i = 0; i < 3; i++) {
    await sendWled(ip, {
      on: true,
      bri: 255,
      seg: [{ id: 0, start: 0, stop: count, fx: 0, col: [color], i: [0, count, hex] }],
    })
    await new Promise(r => setTimeout(r, 180))
    await sendWled(ip, { on: false })
    await new Promise(r => setTimeout(r, 180))
  }

  // Gentle breathing effect for 3.5 seconds
  await sendWled(ip, {
    on: true,
    bri,
    seg: [{ id: 0, start: 0, stop: count, fx: 2 /* Breathe */, col: [color] }],
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
        seg: [
          {
            id: 0,
            start: 0,
            stop: count,
            fx: 0,
            col: [[0, 255, 60]],
            i: [0, count, '00FF3C'],
          },
        ],
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
    const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:'
    let errorMsg = 'تعذر الاتصال بالـ ESP32.'

    if (isHttps) {
      errorMsg = 'المتصفح حجب الطلب (Mixed Content): الموقع يعمل عبر HTTPS ولا يمكنه الوصول مباشرة لـ HTTP المحلي. يُرجى السماح بالمحتوى غير الآمن (Insecure content: Allow) في إعدادات الموقع بالمتصفح أو تشغيل التطبيق محلياً عبر localhost.'
    } else if (err.name === 'TimeoutError') {
      errorMsg = 'انتهت مهلة الاتصال (تأكد أن الـ ESP32 على نفس الشبكة المحلية وتأكد من الـ IP).'
    } else {
      errorMsg = `تعذر الاتصال بالـ ESP32. تأكد من تفعيل CORS في WLED: Settings → Security → Allow CORS: ✓ (${err.message || ''})`
    }

    return { ok: false, error: errorMsg }
  }
}

/* ─── Hook ──────────────────────────────────────────────────── */
/**
 * @param {object} prefs - { enabled, ip, ledCount, brightness, mode }
 * @param {Array} modes  - modes list from Focus.jsx
 */
export function useWled(prefs, modes) {
  const modesRef = useRef(modes)
  const prefsRef = useRef(prefs)
  const lastTickRef = useRef(0)
  const lastSentLitRef = useRef(-1)

  useEffect(() => { modesRef.current = modes }, [modes])
  useEffect(() => { prefsRef.current = prefs }, [prefs])

  const isActive = Boolean(
    prefs &&
    prefs.enabled &&
    prefs.ip &&
    prefs.ip.trim().length > 0 &&
    Number(prefs.ledCount) > 0
  )

  /**
   * Called every tick while countdown is running.
   * Only transmits when ledsLit changes or on 15s keep-alive.
   */
  const onTick = useCallback((modeIndex, secondsLeft) => {
    const p = prefsRef.current
    if (!p?.enabled || !p?.ip || !Number(p?.ledCount)) return

    const ms = modesRef.current
    const currentMode = ms[modeIndex]
    if (!currentMode || currentMode.duration <= 0) return // skip stopwatch

    const phase = modeToPhase(currentMode.key)
    const color = PHASE_COLORS[phase]
    const totalSecs = currentMode.duration
    const ledCount = Number(p.ledCount) || 86

    let ledsLit = ledCount
    if (p.mode === 'fill') {
      // Ascending (fills up)
      const elapsed = Math.max(0, totalSecs - secondsLeft)
      ledsLit = Math.min(ledCount, Math.ceil((elapsed / totalSecs) * ledCount))
    } else {
      // Countdown: extinguish one by one as secondsLeft decreases
      const ratio = Math.max(0, Math.min(1, secondsLeft / totalSecs))
      ledsLit = Math.round(ratio * ledCount)
    }

    const now = Date.now()
    if (ledsLit !== lastSentLitRef.current || (now - lastTickRef.current > 15000)) {
      lastSentLitRef.current = ledsLit
      lastTickRef.current = now
      wledProgress(p.ip, ledCount, ledsLit, color, p.brightness)
    }
  }, [])

  /** Called when timer starts */
  const onStart = useCallback((modeIndex) => {
    const p = prefsRef.current
    if (!p?.enabled || !p?.ip || !Number(p?.ledCount)) return

    const ms = modesRef.current
    const currentMode = ms[modeIndex]
    if (!currentMode || currentMode.duration <= 0) return

    const phase = modeToPhase(currentMode.key)
    const color = PHASE_COLORS[phase]
    const ledCount = Number(p.ledCount) || 86

    const ledsLit = p.mode === 'fill' ? 1 : ledCount
    lastSentLitRef.current = ledsLit
    lastTickRef.current = Date.now()
    wledProgress(p.ip, ledCount, ledsLit, color, p.brightness)
  }, [])

  /** Called when timer is paused or reset */
  const onPause = useCallback(() => {
    const p = prefsRef.current
    if (!p?.enabled || !p?.ip) return
    lastSentLitRef.current = -1
    wledOff(p.ip)
  }, [])

  /** Called when timer completes */
  const onComplete = useCallback((modeKey) => {
    const p = prefsRef.current
    if (!p?.enabled || !p?.ip || !Number(p?.ledCount)) return

    const phase = modeToPhase(modeKey)
    const color = PHASE_COLORS[phase]
    const ledCount = Number(p.ledCount) || 86
    lastSentLitRef.current = -1
    wledComplete(p.ip, ledCount, color, p.brightness)
  }, [])

  return useMemo(() => ({
    isActive,
    onTick,
    onStart,
    onPause,
    onComplete,
  }), [isActive, onTick, onStart, onPause, onComplete])
}
