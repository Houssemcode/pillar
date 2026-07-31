import { useState, useEffect } from 'react'
import ProgressRing from '../components/ui/ProgressRing'

const PRAYERS = [
  { name: 'Fajr',    arabic: 'الفجر',   time: '05:12', done: true },
  { name: 'Dhuhr',   arabic: 'الظهر',   time: '12:47', done: true },
  { name: 'Asr',     arabic: 'العصر',   time: '16:20', done: false },
  { name: 'Maghrib', arabic: 'المغرب',  time: '20:04', done: false },
  { name: 'Isha',    arabic: 'العشاء',  time: '21:38', done: false },
]

function timeToMinutes(t) {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

export default function Faith() {
  const [prayers, setPrayers] = useState(PRAYERS)
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  const currentMinutes = now.getHours() * 60 + now.getMinutes()

  // Find next prayer
  const nextPrayer = prayers.find(p => !p.done && timeToMinutes(p.time) > currentMinutes) || null

  const timeUntilNext = nextPrayer ? (() => {
    const diff = timeToMinutes(nextPrayer.time) - currentMinutes
    const h = Math.floor(diff / 60)
    const m = diff % 60
    return h > 0 ? `${h}h ${m}m` : `${m}m`
  })() : '—'

  // Progress through day prayers
  const donePrayers = prayers.filter(p => p.done).length
  const prayerProgress = Math.round((donePrayers / prayers.length) * 100)

  const toggle = (name) => {
    setPrayers(prev => prev.map(p => p.name === name ? { ...p, done: !p.done } : p))
  }

  // Current time display
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })

  return (
    <div className="page">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Faith</h1>
          <div className="page-subtitle">Prayer times & spiritual tracker</div>
        </div>
      </div>

      {/* Live clock + next prayer */}
      <div className="card" style={{ textAlign: 'center', padding: '32px 24px' }}>
        <div style={{
          fontSize: 48, fontWeight: 200, letterSpacing: '-2px',
          color: 'var(--color-text)', fontVariantNumeric: 'tabular-nums',
          marginBottom: 8,
        }}>
          {timeStr}
        </div>
        {nextPrayer ? (
          <>
            <div style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 4 }}>Next prayer</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--color-primary)' }}>
              {nextPrayer.name} <span style={{ fontSize: 18, opacity: 0.6 }}>{nextPrayer.arabic}</span>
            </div>
            <div style={{ fontSize: 14, color: 'var(--color-text-muted)', marginTop: 4 }}>
              at {nextPrayer.time} · in <span style={{ color: 'var(--color-primary)', fontWeight: 600 }}>{timeUntilNext}</span>
            </div>
          </>
        ) : (
          <div style={{ fontSize: 16, color: 'var(--color-primary)', fontWeight: 600 }}>
            All prayers complete today 🌙
          </div>
        )}
      </div>

      {/* Progress ring + stats */}
      <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
        <ProgressRing radius={48} strokeWidth={6} progress={prayerProgress} size={96}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-primary)' }}>{donePrayers}</div>
            <div style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>of 5</div>
          </div>
        </ProgressRing>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div className="card" style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Today's progress</span>
            <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-primary)' }}>{prayerProgress}%</span>
          </div>
          <div className="card" style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Streak</span>
            <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-primary)' }}>🔥 14 days</span>
          </div>
        </div>
      </div>

      {/* Prayer list */}
      <div>
        <div className="section-label">Prayer Times</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {prayers.map(prayer => {
            const isPast = timeToMinutes(prayer.time) < currentMinutes
            const isNext = prayer === (prayers.find(p => !p.done && timeToMinutes(p.time) > currentMinutes))
            return (
              <div
                key={prayer.name}
                onClick={() => toggle(prayer.name)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  padding: '16px 20px',
                  borderRadius: 14,
                  cursor: 'pointer',
                  background: isNext
                    ? 'var(--color-primary-subtle)'
                    : prayer.done
                    ? 'transparent'
                    : 'var(--color-surface-2)',
                  border: `1px solid ${isNext ? 'var(--color-primary-muted)' : prayer.done ? 'transparent' : 'var(--color-border)'}`,
                  opacity: prayer.done ? 0.55 : 1,
                  transition: 'all 200ms ease',
                }}
              >
                {/* Done ring */}
                <div style={{
                  width: 36, height: 36, borderRadius: '50%',
                  border: `2px solid ${prayer.done ? 'var(--color-primary)' : isNext ? 'var(--color-primary)' : 'var(--color-border)'}`,
                  background: prayer.done ? 'var(--color-primary)' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                  transition: 'all 200ms ease',
                }}>
                  {prayer.done ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20,6 9,17 4,12"/>
                    </svg>
                  ) : isNext ? (
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--color-primary)' }} />
                  ) : null}
                </div>

                {/* Name */}
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: isNext ? 600 : 500, color: prayer.done ? 'var(--color-text-muted)' : 'var(--color-text)' }}>
                    {prayer.name}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--color-text-muted)', fontFamily: 'serif', marginTop: 2 }}>
                    {prayer.arabic}
                  </div>
                </div>

                {/* Time */}
                <div style={{
                  fontSize: 15,
                  fontWeight: 600,
                  color: isNext ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                  fontVariantNumeric: 'tabular-nums',
                }}>
                  {prayer.time}
                </div>

                {/* Status chip */}
                {prayer.done && (
                  <span className="badge">Done</span>
                )}
                {isNext && !prayer.done && (
                  <span className="badge">Next</span>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
