/**
 * RecurrenceEditor.jsx
 *
 * A self-contained recurrence rule builder.
 * Emits a recurrence object (or null for "does not repeat") via onChange.
 *
 * Output shape (matches backend expand_recurring schema):
 * {
 *   freq: 'daily' | 'weekly' | 'monthly' | 'yearly',
 *   interval: number,          // e.g. 2 = "every 2 weeks"
 *   ends: 'never' | 'on_date' | 'after_n',
 *   end_date: 'YYYY-MM-DD',    // only when ends === 'on_date'
 *   count: number,             // only when ends === 'after_n'
 *   days_of_week: number[],    // only when freq === 'weekly'; 0=Mon…6=Sun
 * }
 */
import { useState } from 'react'

const FREQ_OPTIONS = [
  { value: null,      label: 'Does not repeat' },
  { value: 'daily',   label: 'Daily' },
  { value: 'weekly',  label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly',  label: 'Yearly' },
]

const DOW_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const ENDS_OPTIONS = [
  { value: 'never',   label: 'Never' },
  { value: 'on_date', label: 'On date' },
  { value: 'after_n', label: 'After' },
]

function chipStyle(active, color = 'var(--color-primary)') {
  return {
    padding: '4px 10px',
    borderRadius: 20,
    border: `1px solid ${active ? color : 'var(--color-border)'}`,
    background: active ? `${color}22` : 'var(--color-surface-3)',
    color: active ? color : 'var(--color-text-muted)',
    cursor: 'pointer',
    fontSize: 12,
    fontWeight: 600,
    transition: 'all 0.15s',
    userSelect: 'none',
  }
}

export default function RecurrenceEditor({ value, onChange, accentColor }) {
  const accent = accentColor || 'var(--color-primary)'

  // Derive local state from the value prop
  const freq = value?.freq ?? null
  const interval = value?.interval ?? 1
  const ends = value?.ends ?? 'never'
  const endDate = value?.end_date ?? ''
  const count = value?.count ?? 5
  const dowSet = new Set(value?.days_of_week ?? [])

  function emit(patch) {
    if (!freq && !patch.freq) { onChange(null); return }
    const base = { freq, interval, ends, end_date: endDate, count, days_of_week: [...dowSet] }
    const next = { ...base, ...patch }
    if (!next.freq) { onChange(null); return }
    // Clean up irrelevant fields
    if (next.ends !== 'on_date') delete next.end_date
    if (next.ends !== 'after_n') delete next.count
    if (next.freq !== 'weekly') delete next.days_of_week
    onChange(next)
  }

  function setFreq(f) {
    if (!f) { onChange(null); return }
    emit({ freq: f })
  }

  function setInterval(v) {
    const n = Math.max(1, parseInt(v) || 1)
    emit({ interval: n })
  }

  function toggleDow(d) {
    const next = new Set(dowSet)
    if (next.has(d)) next.delete(d)
    else next.add(d)
    emit({ days_of_week: [...next] })
  }

  const freqLabel = FREQ_OPTIONS.find(o => o.value === freq)?.label ?? 'Daily'

  const intervalUnit = freq === 'daily' ? 'day' : freq === 'weekly' ? 'week' : freq === 'monthly' ? 'month' : 'year'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

      {/* ── Frequency selector ── */}
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: 8 }}>Repeat</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {FREQ_OPTIONS.map(o => (
            <button
              key={String(o.value)}
              type="button"
              style={chipStyle(freq === o.value, accent)}
              onClick={() => setFreq(o.value)}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      {freq && (
        <>
          {/* ── Interval ── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 13, color: 'var(--color-text-muted)', fontWeight: 500 }}>Every</span>
            <input
              type="number"
              min={1}
              max={365}
              value={interval}
              onChange={e => setInterval(e.target.value)}
              style={{
                width: 56, padding: '5px 8px', textAlign: 'center',
                border: '1px solid var(--color-border)', borderRadius: 8,
                background: 'var(--color-surface-3)', color: 'var(--color-text)',
                fontSize: 13, fontWeight: 600,
              }}
            />
            <span style={{ fontSize: 13, color: 'var(--color-text-muted)', fontWeight: 500 }}>
              {interval === 1 ? intervalUnit : `${intervalUnit}s`}
            </span>
          </div>

          {/* ── Days of week (weekly only) ── */}
          {freq === 'weekly' && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: 8 }}>On</div>
              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                {DOW_LABELS.map((d, i) => (
                  <button
                    key={d}
                    type="button"
                    style={{ ...chipStyle(dowSet.has(i), accent), padding: '4px 8px', minWidth: 38, textAlign: 'center' }}
                    onClick={() => toggleDow(i)}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Ends ── */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: 8 }}>Ends</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
              {ENDS_OPTIONS.map(o => (
                <button
                  key={o.value}
                  type="button"
                  style={chipStyle(ends === o.value, accent)}
                  onClick={() => emit({ ends: o.value })}
                >
                  {o.label}
                </button>
              ))}
              {ends === 'on_date' && (
                <input
                  type="date"
                  value={endDate}
                  onChange={e => emit({ end_date: e.target.value })}
                  style={{
                    border: '1px solid var(--color-border)', borderRadius: 8,
                    background: 'var(--color-surface-3)', color: 'var(--color-text)',
                    padding: '4px 10px', fontSize: 12,
                  }}
                />
              )}
              {ends === 'after_n' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <input
                    type="number"
                    min={1}
                    max={999}
                    value={count}
                    onChange={e => emit({ count: Math.max(1, parseInt(e.target.value) || 1) })}
                    style={{
                      width: 52, padding: '4px 8px', textAlign: 'center',
                      border: '1px solid var(--color-border)', borderRadius: 8,
                      background: 'var(--color-surface-3)', color: 'var(--color-text)',
                      fontSize: 13, fontWeight: 600,
                    }}
                  />
                  <span style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>occurrences</span>
                </div>
              )}
            </div>
          </div>

          {/* ── Human-readable summary ── */}
          <div style={{
            padding: '8px 12px', borderRadius: 8,
            background: `${accent}12`,
            border: `1px solid ${accent}30`,
            fontSize: 12, color: accent, fontWeight: 600,
          }}>
            {buildSummary(freq, interval, ends, endDate, count, dowSet)}
          </div>
        </>
      )}
    </div>
  )
}

function buildSummary(freq, interval, ends, endDate, count, dowSet) {
  if (!freq) return 'Does not repeat'
  const DOW = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  let base = ''
  if (freq === 'daily')   base = interval === 1 ? 'Daily' : `Every ${interval} days`
  if (freq === 'weekly')  {
    const days = [...dowSet].sort().map(d => DOW[d]).join(', ')
    base = interval === 1
      ? `Weekly${days ? ' on ' + days : ''}`
      : `Every ${interval} weeks${days ? ' on ' + days : ''}`
  }
  if (freq === 'monthly') base = interval === 1 ? 'Monthly' : `Every ${interval} months`
  if (freq === 'yearly')  base = interval === 1 ? 'Yearly' : `Every ${interval} years`

  if (ends === 'on_date' && endDate) base += `, until ${endDate}`
  if (ends === 'after_n') base += `, ${count} time${count === 1 ? '' : 's'}`
  return base
}
