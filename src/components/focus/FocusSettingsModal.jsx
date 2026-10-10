import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import Modal from '../ui/Modal'
import Input from '../ui/Input'
import Button from '../ui/Button'
import { loadWledPrefs, saveWledPrefs } from '../../hooks/useWled'

/* ─── Small toggle switch ──────────────────────────────────── */
function Toggle({ checked, onChange, label }) {
  return (
    <label
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        cursor: 'pointer',
        userSelect: 'none',
      }}
    >
      <div
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        style={{
          position: 'relative',
          width: 40,
          height: 22,
          borderRadius: 11,
          background: checked ? 'var(--color-primary)' : 'var(--color-border)',
          transition: 'background 200ms',
          cursor: 'pointer',
          flexShrink: 0,
        }}
      >
        <span
          style={{
            position: 'absolute',
            top: 3,
            left: checked ? 21 : 3,
            width: 16,
            height: 16,
            borderRadius: '50%',
            background: '#fff',
            boxShadow: '0 1px 3px rgba(0,0,0,.25)',
            transition: 'left 200ms',
          }}
        />
      </div>
      <span style={{ fontSize: 13, color: 'var(--color-text-primary)' }}>{label}</span>
    </label>
  )
}

/* ─── WLED test button ─────────────────────────────────────── */
function WledTestButton({ ip, ledCount, brightness }) {
  const [status, setStatus] = useState(null) // null | 'ok' | 'err'
  const [busy, setBusy] = useState(false)

  async function test() {
    if (!ip) { setStatus('err'); return }
    setBusy(true)
    setStatus(null)
    try {
      const host = ip.startsWith('http') ? ip : `http://${ip}`
      const res = await fetch(`${host.replace(/\/$/, '')}/json/state`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          on: true,
          bri: brightness,
          seg: [{ id: 0, start: 0, stop: ledCount, fx: 0, col: [[0, 200, 80]] }],
        }),
        signal: AbortSignal.timeout(2500),
      })
      setStatus(res.ok || res.status === 0 ? 'ok' : 'err')
    } catch {
      setStatus('err')
    } finally {
      setBusy(false)
    }
    // Auto-clear after 4s
    setTimeout(() => setStatus(null), 4000)
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
      <button
        type="button"
        onClick={test}
        disabled={busy || !ip}
        style={{
          padding: '6px 14px',
          borderRadius: 8,
          border: '1px solid var(--color-border)',
          background: 'var(--color-surface-2)',
          color: 'var(--color-text-primary)',
          fontSize: 12,
          fontWeight: 500,
          cursor: ip && !busy ? 'pointer' : 'not-allowed',
          opacity: ip ? 1 : 0.4,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          transition: 'opacity .15s',
        }}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
          <polyline points="22 4 12 14.01 9 11.01"/>
        </svg>
        {busy ? 'Testing…' : 'Test Connection'}
      </button>
      {status === 'ok' && (
        <span style={{ fontSize: 12, color: 'var(--color-success, #10b981)', fontWeight: 500 }}>
          ✓ Connected — LEDs lit green
        </span>
      )}
      {status === 'err' && (
        <span style={{ fontSize: 12, color: 'var(--color-danger, #ef4444)', fontWeight: 500 }}>
          ✗ Unreachable
        </span>
      )}
    </div>
  )
}

/* ─── Main Modal ───────────────────────────────────────────── */
export default function FocusSettingsModal({ isOpen, onClose, prefs, onSave }) {
  const { t } = useTranslation()

  // Timer prefs
  const [pomodoro,   setPomodoro]   = useState(prefs?.pomodoro    ?? 25)
  const [shortBreak, setShortBreak] = useState(prefs?.short_break ?? 5)
  const [longBreak,  setLongBreak]  = useState(prefs?.long_break  ?? 15)

  // WLED prefs
  const [wled, setWled] = useState(loadWledPrefs)

  useEffect(() => {
    if (isOpen && prefs) {
      setPomodoro(prefs.pomodoro    ?? 25)
      setShortBreak(prefs.short_break ?? 5)
      setLongBreak(prefs.long_break  ?? 15)
      setWled(loadWledPrefs())
    }
  }, [isOpen, prefs])

  const patchWled = (patch) => setWled(prev => ({ ...prev, ...patch }))

  const handleSubmit = (e) => {
    e?.preventDefault()
    const p = Math.max(1, Math.min(180, Number(pomodoro)   || 25))
    const s = Math.max(1, Math.min(60,  Number(shortBreak) || 5))
    const l = Math.max(1, Math.min(90,  Number(longBreak)  || 15))

    // Validate & clamp WLED settings
    const cleanWled = {
      enabled:    wled.enabled,
      ip:         wled.ip.trim(),
      ledCount:   Math.max(1, Math.min(1000, Number(wled.ledCount)   || 30)),
      brightness: Math.max(10, Math.min(255, Number(wled.brightness) || 128)),
    }
    saveWledPrefs(cleanWled)

    onSave({ pomodoro: p, short_break: s, long_break: l, wled: cleanWled })
    onClose()
  }

  const dividerStyle = {
    borderTop: '1px solid var(--color-border)',
    margin: '4px 0',
    paddingTop: 16,
  }

  const labelStyle = {
    fontSize: 12,
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    color: 'var(--color-text-muted)',
    marginBottom: 6,
    display: 'block',
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="focus-settings-modal">
      <Modal.Header title={t('focus.settings')} />
      <form onSubmit={handleSubmit}>
        <Modal.Body style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

          {/* ── Timer Durations ── */}
          <div>
            <label className="section-label" style={{ marginBottom: 6, display: 'block' }}>
              {t('focus.pomodoroDuration')}
            </label>
            <Input type="number" min="1" max="180" value={pomodoro}
              onChange={e => setPomodoro(e.target.value)} required />
          </div>
          <div>
            <label className="section-label" style={{ marginBottom: 6, display: 'block' }}>
              {t('focus.shortBreakDuration')}
            </label>
            <Input type="number" min="1" max="60" value={shortBreak}
              onChange={e => setShortBreak(e.target.value)} required />
          </div>
          <div>
            <label className="section-label" style={{ marginBottom: 6, display: 'block' }}>
              {t('focus.longBreakDuration')}
            </label>
            <Input type="number" min="1" max="90" value={longBreak}
              onChange={e => setLongBreak(e.target.value)} required />
          </div>

          {/* ── WLED Section ── */}
          <div style={dividerStyle}>
            {/* Section header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="12" r="5"/>
                <line x1="12" y1="1" x2="12" y2="3"/>
                <line x1="12" y1="21" x2="12" y2="23"/>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                <line x1="1" y1="12" x2="3" y2="12"/>
                <line x1="21" y1="12" x2="23" y2="12"/>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
              </svg>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)' }}>
                LED Strip (WLED)
              </span>
            </div>

            <Toggle
              checked={wled.enabled}
              onChange={v => patchWled({ enabled: v })}
              label="Enable WLED Pomodoro Progress"
            />

            {wled.enabled && (
              <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>

                {/* IP */}
                <div>
                  <label style={labelStyle}>WLED IP Address</label>
                  <Input
                    placeholder="192.168.1.xxx"
                    value={wled.ip}
                    onChange={e => patchWled({ ip: e.target.value })}
                  />
                  <p style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 4 }}>
                    Find it in the WLED app → Info tab
                  </p>
                </div>

                {/* LED count + Brightness (two columns) */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={labelStyle}>LED Count</label>
                    <Input
                      type="number"
                      min="1"
                      max="1000"
                      value={wled.ledCount}
                      onChange={e => patchWled({ ledCount: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Brightness (0–255)</label>
                    <Input
                      type="number"
                      min="10"
                      max="255"
                      value={wled.brightness}
                      onChange={e => patchWled({ brightness: e.target.value })}
                    />
                  </div>
                </div>

                {/* Phase colour legend */}
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  {[
                    { label: 'Work',        color: '#FF7800' },
                    { label: 'Short Break', color: '#00C850' },
                    { label: 'Long Break',  color: '#1E64FF' },
                  ].map(({ label, color }) => (
                    <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--color-text-secondary)' }}>
                      <span style={{ width: 12, height: 12, borderRadius: '50%', background: color, flexShrink: 0 }} />
                      {label}
                    </div>
                  ))}
                </div>

                {/* Test button */}
                <WledTestButton
                  ip={wled.ip}
                  ledCount={Number(wled.ledCount) || 30}
                  brightness={Number(wled.brightness) || 128}
                />
              </div>
            )}
          </div>
        </Modal.Body>

        <Modal.Footer>
          <Button type="button" variant="ghost" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" variant="primary">
            {t('focus.saveSettings')}
          </Button>
        </Modal.Footer>
      </form>
    </Modal>
  )
}
