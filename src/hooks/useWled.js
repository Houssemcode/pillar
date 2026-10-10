/**
 * useWled — WLED HTTP / JSON API integration for Pomodoro LED strip progress bar
 * with Hyperion Ambilight seamless co-existence and synchronization.
 *
 * Designed for ESP32 / ESP8266 running WLED firmware, co-existing with Hyperion.
 *
 * Behavior:
 *  • Work session: Warm White (~2700K-3000K, soft and calming for focus)
 *  • Short break: Emerald Green countdown
 *  • Long break: Electric Blue countdown
 *  • Hyperion synchronization:
 *      - While timer runs: WLED uses `lor: 1` (Live Override) so the timer displays smoothly
 *        without being overwritten by Hyperion's UDP stream.
 *      - When timer pauses/finishes: WLED uses `lor: 0` (Release Override) so Hyperion
 *        seamlessly and immediately resumes ambient lighting without turning off the LEDs!
 *      - Supports dedicated Segment ID (e.g. Segment 1 for timer, Segment 0 for Hyperion).
 *      - Optional Hyperion JSON-RPC API integration for direct component control.
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
  segmentId: 0,      // WLED segment index (0 by default)
  hyperionSync: true,// Seamless handoff with Hyperion
  hyperionIp: '',    // Optional Hyperion IP:port (e.g. 192.168.1.50:8090)
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
  work:       [255, 190, 120],  // Warm White (~2700K-3000K أبيض دافئ مريح للتركيز)
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
    console.warn('[WLED] Network notice:', err?.message)
  }
}

/** Optional direct communication with Hyperion JSON-RPC server */
async function sendHyperion(hyperionHost, isEnabled) {
  if (!hyperionHost || !hyperionHost.trim()) return
  const cleanHost = hyperionHost.trim().replace(/^https?:\/\//, '')
  const url = `http://${cleanHost}/json-rpc`
  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        command: 'componentstate',
        componentstate: {
          component: 'LEDDEVICE',
          state: isEnabled,
        },
      }),
      signal: AbortSignal.timeout(1500),
    })
  } catch (err) {
    console.warn('[Hyperion] Notice:', err?.message)
  }
}

/** Turn off LEDs or hand back control immediately to Hyperion */
export async function wledOff(ip, options = {}) {
  if (!ip) return
  const isHyperion = Boolean(options.hyperionSync)

  if (isHyperion) {
    // Release live data override (lor: 0) so Hyperion resumes streaming ambient colors instantly!
    await sendWled(ip, {
      on: true,
      lor: 0,
    })
    if (options.hyperionIp) {
      sendHyperion(options.hyperionIp, true)
    }
  } else {
    // Standard turn-off when not using Hyperion
    await sendWled(ip, { on: false })
  }
}

/**
 * Show progress on the strip using WLED individual range addressing `i`.
 * Features live override `lor: 1` when Hyperion is synchronized.
 */
export async function wledProgress(ip, ledCount, ledsLit, color, brightness, options = {}) {
  if (!ip || !ledCount) return
  const count = Math.max(1, Number(ledCount) || 86)
  const lit = Math.max(0, Math.min(count, Math.round(ledsLit)))
  const hex = rgbToHex(color)
  const segId = Number(options.segmentId) || 0
  const isHyperion = Boolean(options.hyperionSync)

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

  const payload = {
    on: true,
    bri: Math.max(5, Math.min(255, Number(brightness) || 128)),
    seg: [
      {
        id: segId,
        start: 0,
        stop: count,
        fx: 0, // Solid
        col: [color],
        i: iArray,
      },
    ],
  }

  // Activate live override so Hyperion stream doesn't overwrite the timer
  if (isHyperion) {
    payload.lor = 1
  }

  await sendWled(ip, payload)

  if (isHyperion && options.hyperionIp) {
    sendHyperion(options.hyperionIp, false)
  }
}

/** Alert effect: 3 quick flashes + 3.5s breathe + restore Hyperion / off */
export async function wledComplete(ip, ledCount, color, brightness, options = {}) {
  if (!ip) return
  const count = Math.max(1, Number(ledCount) || 86)
  const bri = Math.max(5, Math.min(255, Number(brightness) || 128))
  const hex = rgbToHex(color)
  const segId = Number(options.segmentId) || 0

  // 3 quick flashes
  for (let i = 0; i < 3; i++) {
    await sendWled(ip, {
      on: true,
      lor: 1,
      bri: 255,
      seg: [{ id: segId, start: 0, stop: count, fx: 0, col: [color], i: [0, count, hex] }],
    })
    await new Promise(r => setTimeout(r, 180))
    await sendWled(ip, { on: false })
    await new Promise(r => setTimeout(r, 180))
  }

  // Gentle breathing effect for 3.5 seconds
  await sendWled(ip, {
    on: true,
    lor: 1,
    bri,
    seg: [{ id: segId, start: 0, stop: count, fx: 2 /* Breathe */, col: [color] }],
  })
  await new Promise(r => setTimeout(r, 3500))
  await wledOff(ip, options)
}

/** Test connection helper with live feedback and Hyperion restoration */
export async function testWledConnection(ip, ledCount, brightness, options = {}) {
  if (!ip || !ip.trim()) {
    return { ok: false, error: 'الرجاء إدخال عنوان IP الخاص بـ WLED أولاً' }
  }

  const count = Math.max(1, Number(ledCount) || 86)
  const bri = Math.max(10, Math.min(255, Number(brightness) || 128))
  const segId = Number(options.segmentId) || 0

  try {
    const url = buildUrl(ip)
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        on: true,
        lor: 1, // override live stream during test
        bri,
        seg: [
          {
            id: segId,
            start: 0,
            stop: count,
            fx: 0,
            col: [[255, 190, 120]], // Warm white
            i: [0, count, 'FFBE78'],
          },
        ],
      }),
      signal: AbortSignal.timeout(3000),
    })

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`)
    }

    // Keep lit warm white for 2.5 seconds then hand back to Hyperion / standby
    setTimeout(() => {
      wledOff(ip, options)
    }, 2500)

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
 * @param {object} prefs - { enabled, ip, ledCount, brightness, mode, segmentId, hyperionSync, hyperionIp }
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
      wledProgress(p.ip, ledCount, ledsLit, color, p.brightness, p)
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
    wledProgress(p.ip, ledCount, ledsLit, color, p.brightness, p)
  }, [])

  /** Called when timer is paused or reset */
  const onPause = useCallback(() => {
    const p = prefsRef.current
    if (!p?.enabled || !p?.ip) return
    lastSentLitRef.current = -1
    wledOff(p.ip, p)
  }, [])

  /** Called when timer completes */
  const onComplete = useCallback((modeKey) => {
    const p = prefsRef.current
    if (!p?.enabled || !p?.ip || !Number(p?.ledCount)) return

    const phase = modeToPhase(modeKey)
    const color = PHASE_COLORS[phase]
    const ledCount = Number(p.ledCount) || 86
    lastSentLitRef.current = -1
    wledComplete(p.ip, ledCount, color, p.brightness, p)
  }, [])

  return useMemo(() => ({
    isActive,
    onTick,
    onStart,
    onPause,
    onComplete,
  }), [isActive, onTick, onStart, onPause, onComplete])
}
