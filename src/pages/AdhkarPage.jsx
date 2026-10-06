/**
 * AdhkarPage.jsx — Dedicated Focus Reader for Adhkar & Supplications
 *
 * Fully integrated with Django Backend via `faithService`.
 * Replaces static mock data with live API data.
 * Minimalist, zen-like reading experience with prominent Arabic typography,
 * tactile tap counters, and backend progress synchronization.
 */
import { useState, useEffect, useCallback } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import FullscreenReader from '../components/ui/FullscreenReader'
import Checkbox from '../components/ui/Checkbox'
import faithService from '../api/faithService'

/* ─── Theme constants ──────────────────────────────────────── */
const EM = '#10B981'
const EM_SUBTLE = 'rgba(16, 185, 129, 0.08)'
const EM_BORDER = 'rgba(16, 185, 129, 0.35)'

const CARD = {
  background: 'rgba(18, 18, 18, 0.7)',
  border: '1px solid rgba(255, 255, 255, 0.08)',
  borderRadius: 16,
  padding: '24px 28px',
}

function getTodayDateStr() {
  const today = new Date()
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
}

export default function AdhkarPage() {
  const { t, i18n } = useTranslation()
  const isAr = i18n.language === 'ar' || i18n.language?.startsWith('ar')
  const [searchParams, setSearchParams] = useSearchParams()

  const typeParam = searchParams.get('type') || 'morning'
  const [activeTab, setActiveTab] = useState(typeParam)

  const [items, setItems] = useState([])
  const [counts, setCounts] = useState({})
  const [doneIds, setDoneIds] = useState(() => new Set())
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [fullscreenItem, setFullscreenItem] = useState(null)
  const [showTranslations, setShowTranslations] = useState(false)

  // Synchronize state when URL param changes
  useEffect(() => {
    const p = searchParams.get('type')
    if (p && p !== activeTab) {
      setActiveTab(p)
    }
  }, [searchParams])

  // Fetch Adhkar items from Django backend
  const loadAdhkar = useCallback(async (category) => {
    setIsLoading(true)
    setError(null)
    const dateStr = getTodayDateStr()
    try {
      const data = await faithService.getAdhkar({ category, date: dateStr })
      const list = Array.isArray(data) ? data : []
      setItems(list)

      // Initialize completed set and repetition counts
      const completed = new Set()
      const initialCounts = {}
      list.forEach(item => {
        const target = item.target_count || item.count || 1
        if (item.done) {
          completed.add(item.id)
          initialCounts[item.id] = target
        } else {
          initialCounts[item.id] = 0
        }
      })
      setDoneIds(completed)
      setCounts(initialCounts)
    } catch (err) {
      console.error('[AdhkarPage] Failed to fetch adhkar:', err)
      setError(t('faith.errorLoadingAdhkar') || 'Failed to load Adhkar')
    } finally {
      setIsLoading(false)
    }
  }, [t])

  useEffect(() => {
    loadAdhkar(activeTab)
  }, [activeTab, loadAdhkar])

  const handleTabChange = (tabKey) => {
    setActiveTab(tabKey)
    setSearchParams({ type: tabKey })
  }

  // Increment tap counter for an item
  const handleIncrement = async (item) => {
    const target = item.target_count || item.count || 1
    const current = counts[item.id] || (doneIds.has(item.id) ? target : 0)
    const nextCount = Math.min(target, current + 1)

    setCounts(prev => ({ ...prev, [item.id]: nextCount }))

    if (nextCount >= target && !doneIds.has(item.id)) {
      setDoneIds(prev => new Set([...prev, item.id]))
      try {
        const dateStr = getTodayDateStr()
        await faithService.toggleAdhkar({ item_id: item.id, type: activeTab, date: dateStr })
      } catch (err) {
        console.error('[AdhkarPage] Failed to save adhkar progress:', err)
      }
    }
  }

  // Direct toggle completion for an item
  const handleToggle = async (item) => {
    const isDone = doneIds.has(item.id)
    const target = item.target_count || item.count || 1

    setDoneIds(prev => {
      const next = new Set(prev)
      if (isDone) next.delete(item.id)
      else next.add(item.id)
      return next
    })
    setCounts(prev => ({ ...prev, [item.id]: isDone ? 0 : target }))

    try {
      const dateStr = getTodayDateStr()
      await faithService.toggleAdhkar({ item_id: item.id, type: activeTab, date: dateStr })
    } catch (err) {
      console.error('[AdhkarPage] Failed to toggle adhkar:', err)
      // Revert on failure
      setDoneIds(prev => {
        const next = new Set(prev)
        if (isDone) next.add(item.id)
        else next.delete(item.id)
        return next
      })
      setCounts(prev => ({ ...prev, [item.id]: isDone ? target : 0 }))
    }
  }

  // Derived progress stats
  const totalCount = items.length
  const completedCount = items.filter(i => {
    const target = i.target_count || i.count || 1
    return doneIds.has(i.id) || (counts[i.id] || 0) >= target
  }).length
  const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  const TABS = [
    { key: 'morning', label: t('faith.morningAdhkar'), icon: '🌅', color: '#F59E0B' },
    { key: 'evening', label: t('faith.eveningAdhkar'), icon: '🌆', color: '#6366F1' },
    { key: 'sleep',   label: isAr ? 'أذكار النوم' : 'Sleep Adhkar', icon: '🌙', color: '#10B981' },
  ]

  const activeTabMeta = TABS.find(t => t.key === activeTab) || TABS[0]

  return (
    <div className="page faith-page" style={{ maxWidth: 900, margin: '0 auto', paddingBottom: 60 }}>
      {/* ── Top Navigation Bar ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 20, flexWrap: 'wrap', gap: 12,
      }}>
        <Link
          to="/faith"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            fontSize: 13, fontWeight: 600, color: 'var(--color-text-muted)',
            textDecoration: 'none', transition: 'color 150ms ease',
          }}
          onMouseEnter={e => { e.currentTarget.style.color = EM }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--color-text-muted)' }}
        >
          <span style={{ fontSize: 16 }}>{isAr ? '→' : '←'}</span>
          <span>{t('faith.title')}</span>
        </Link>

        {/* Translation toggle for non-Arabic UI */}
        {!isAr && (
          <button
            type="button"
            onClick={() => setShowTranslations(s => !s)}
            style={{
              fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)',
              background: 'transparent', border: '1px solid rgba(255, 255, 255, 0.1)',
              padding: '5px 12px', borderRadius: 20, cursor: 'pointer',
              outline: 'none', transition: 'all 150ms ease',
            }}
          >
            {showTranslations ? t('faith.hideTranslation') : t('faith.showTranslation')}
          </button>
        )}
      </div>

      {/* ── Focus Header Card ── */}
      <div style={{ ...CARD, marginBottom: 24, padding: '24px 28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 28 }}>{activeTabMeta.icon}</span>
            <div>
              <h1 style={{
                fontSize: 20, fontWeight: 800, color: 'var(--color-text)',
                margin: 0, fontFamily: isAr ? 'var(--font-arabic)' : 'inherit',
              }}>
                {activeTabMeta.label}
              </h1>
              <p style={{ fontSize: 12, color: 'var(--color-text-muted)', margin: '4px 0 0 0' }}>
                {activeTab === 'morning'
                  ? t('faith.morningAdhkarDescription')
                  : activeTab === 'evening'
                  ? t('faith.eveningAdhkarDescription')
                  : isAr ? 'تُقال عند إرادة النوم والاستيقاظ' : 'Supplications before sleep and waking'}
              </p>
            </div>
          </div>

          {/* Progress pill */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '6px 14px', borderRadius: 20,
            background: progressPct === 100 ? 'rgba(16, 185, 129, 0.12)' : 'rgba(255, 255, 255, 0.05)',
            border: `1px solid ${progressPct === 100 ? 'rgba(16, 185, 129, 0.3)' : 'rgba(255, 255, 255, 0.08)'}`,
          }}>
            <span style={{
              fontSize: 12, fontWeight: 700, fontVariantNumeric: 'tabular-nums',
              color: progressPct === 100 ? EM : 'var(--color-text)',
            }}>
              {completedCount} / {totalCount}
            </span>
            <span style={{ color: 'rgba(255, 255, 255, 0.2)' }}>·</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: progressPct === 100 ? EM : activeTabMeta.color }}>
              {progressPct}%
            </span>
          </div>
        </div>

        {/* Global Session Progress Bar */}
        <div style={{ width: '100%', height: 4, background: 'rgba(255, 255, 255, 0.06)', borderRadius: 4, overflow: 'hidden', marginBottom: 20 }}>
          <div style={{
            height: '100%', borderRadius: 4,
            background: progressPct === 100 ? EM : activeTabMeta.color,
            width: `${progressPct}%`, transition: 'width 300ms ease',
          }} />
        </div>

        {/* Category Switcher Tabs */}
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 2 }}>
          {TABS.map(tab => {
            const isActive = activeTab === tab.key
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => handleTabChange(tab.key)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '7px 16px', borderRadius: 20, fontSize: 13, fontWeight: 600,
                  cursor: 'pointer', outline: 'none', transition: 'all 150ms ease',
                  background: isActive ? `${tab.color}18` : 'transparent',
                  backgroundColor: isActive ? `${tab.color}18` : 'transparent',
                  color: isActive ? tab.color : 'var(--color-text-muted)',
                  border: `1px solid ${isActive ? `${tab.color}50` : 'rgba(255, 255, 255, 0.08)'}`,
                  fontFamily: isAr ? 'var(--font-arabic)' : 'inherit',
                  whiteSpace: 'nowrap',
                }}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Loading Skeleton / Error Banner ── */}
      {isLoading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{ ...CARD, minHeight: 120, opacity: 0.5 }}>
              <div style={{ height: 16, width: '25%', background: 'rgba(255, 255, 255, 0.06)', borderRadius: 6, marginBottom: 16 }} />
              <div style={{ height: 48, width: '90%', background: 'rgba(255, 255, 255, 0.04)', borderRadius: 8, margin: '0 auto 16px' }} />
              <div style={{ height: 14, width: '30%', background: 'rgba(255, 255, 255, 0.04)', borderRadius: 6 }} />
            </div>
          ))}
        </div>
      )}

      {error && !isLoading && (
        <div style={{
          ...CARD,
          borderColor: 'rgba(244, 63, 94, 0.3)', background: 'rgba(244, 63, 94, 0.08)',
          textAlign: 'center', padding: '32px 20px',
        }}>
          <div style={{ fontSize: 24, marginBottom: 8 }}>⚠️</div>
          <div style={{ color: '#F43F5E', fontSize: 14, fontWeight: 600, marginBottom: 12 }}>{error}</div>
          <button
            type="button"
            onClick={() => loadAdhkar(activeTab)}
            style={{
              padding: '6px 16px', borderRadius: 8, fontSize: 12, fontWeight: 600,
              background: 'rgba(244, 63, 94, 0.2)', color: '#FDA4AF',
              border: '1px solid rgba(244, 63, 94, 0.4)', cursor: 'pointer',
            }}
          >
            {t('common.retry') || 'Retry'}
          </button>
        </div>
      )}

      {/* ── Empty State ── */}
      {!isLoading && !error && items.length === 0 && (
        <div style={{ ...CARD, textAlign: 'center', padding: '48px 24px', color: 'var(--color-text-muted)' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>📿</div>
          <div style={{ fontSize: 14 }}>{t('faith.noAdhkar')}</div>
        </div>
      )}

      {/* ── Focus Reader Adhkar Items List ── */}
      {!isLoading && !error && items.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {items.map(item => {
            const targetCount = item.target_count || item.count || 1
            const count = doneIds.has(item.id) ? targetCount : (counts[item.id] || 0)
            const isDone = doneIds.has(item.id) || (targetCount > 1 && count >= targetCount)
            const remaining = Math.max(0, targetCount - count)
            const text = item.arabic_text || item.text || ''

            return (
              <div
                key={item.id}
                style={{
                  ...CARD,
                  borderColor: isDone ? 'rgba(16, 185, 129, 0.25)' : 'rgba(255, 255, 255, 0.08)',
                  background: isDone ? 'rgba(16, 185, 129, 0.03)' : 'rgba(18, 18, 18, 0.7)',
                  opacity: isDone ? 0.65 : 1,
                  transition: 'all 200ms ease',
                  position: 'relative',
                }}
              >
                {/* Item Top Bar: Category / Source on left, Fullscreen expand on right */}
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  marginBottom: 16, flexWrap: 'wrap', gap: 8,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {item.source && (
                      <span style={{
                        fontSize: 11, color: 'var(--color-text-muted)',
                        background: 'rgba(255, 255, 255, 0.04)',
                        border: '1px solid rgba(255, 255, 255, 0.06)',
                        padding: '2px 8px', borderRadius: 6,
                      }}>
                        {item.source}
                      </span>
                    )}
                    {item.category && (
                      <span style={{
                        fontSize: 11, color: EM,
                        background: EM_SUBTLE,
                        border: `1px solid ${EM_BORDER}`,
                        padding: '2px 8px', borderRadius: 6,
                        textTransform: 'capitalize',
                      }}>
                        {isAr ? item.category : (item.category_en || item.category)}
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => setFullscreenItem({ ...item, text })}
                    title={t('faith.fullscreenView') || 'Fullscreen View'}
                    style={{
                      width: 28, height: 28, borderRadius: 8,
                      background: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      color: 'var(--color-text-muted)', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      outline: 'none', transition: 'all 150ms ease',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.color = EM }}
                    onMouseLeave={e => { e.currentTarget.style.color = 'var(--color-text-muted)' }}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <polyline points="15,3 21,3 21,9" /><polyline points="9,21 3,21 3,15" />
                      <line x1="21" y1="3" x2="14" y2="10" /><line x1="3" y1="21" x2="10" y2="14" />
                    </svg>
                  </button>
                </div>

                {/* Hero Arabic Typography */}
                <div
                  dir="rtl"
                  onClick={() => handleIncrement(item)}
                  style={{
                    textAlign: 'right',
                    fontSize: 20,
                    lineHeight: 2.3,
                    fontFamily: 'var(--font-arabic)',
                    fontWeight: 500,
                    color: isDone ? 'var(--color-text-muted)' : 'var(--color-text)',
                    textDecoration: isDone ? 'line-through' : 'none',
                    userSelect: 'text',
                    cursor: targetCount > 1 && !isDone ? 'pointer' : 'default',
                    marginBottom: 16,
                  }}
                >
                  {text}
                </div>

                {/* Non-Arabic Translation & Transliteration */}
                {!isAr && (showTranslations || item.transliteration) && (
                  <div style={{ marginBottom: 16, direction: 'ltr', textAlign: 'left' }}>
                    {item.transliteration && (
                      <p style={{
                        fontSize: 12, color: 'rgba(16, 185, 129, 0.85)',
                        fontStyle: 'italic', margin: '0 0 6px 0', lineHeight: 1.5,
                      }}>
                        {item.transliteration}
                      </p>
                    )}
                    {item.translation && showTranslations && (
                      <p style={{
                        fontSize: 13, color: 'var(--color-text-secondary)',
                        margin: 0, lineHeight: 1.6,
                      }}>
                        "{item.translation}"
                      </p>
                    )}
                  </div>
                )}

                {/* Item Bottom Action & Progress Bar */}
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  paddingTop: 14, borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                  flexWrap: 'wrap', gap: 12,
                }}>
                  {/* Left: Quick checkbox toggle */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Checkbox
                      checked={isDone}
                      onChange={() => handleToggle(item)}
                      size="sm"
                      aria-label={text}
                    />
                    <span style={{
                      fontSize: 12, fontWeight: 600,
                      color: isDone ? EM : 'var(--color-text-muted)',
                    }}>
                      {isDone ? `✓ ${t('faith.done')}` : t('faith.repeatCount', { count: targetCount })}
                    </span>
                  </div>

                  {/* Right: Tactile Tap Counter Button */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {targetCount > 1 && !isDone && (
                      <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                        {t('faith.remaining', { count: remaining })}
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={() => handleIncrement(item)}
                      style={{
                        minWidth: 84,
                        height: 38,
                        padding: '0 16px',
                        borderRadius: 20,
                        fontSize: 13,
                        fontFamily: 'monospace',
                        fontWeight: 700,
                        cursor: 'pointer',
                        outline: 'none',
                        boxShadow: 'none',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                        userSelect: 'none',
                        transition: 'all 150ms ease',
                        background: isDone ? 'rgba(16, 185, 129, 0.12)' : 'rgba(16, 185, 129, 0.06)',
                        backgroundColor: isDone ? 'rgba(16, 185, 129, 0.12)' : 'rgba(16, 185, 129, 0.06)',
                        color: EM,
                        border: `1.5px solid ${isDone ? 'rgba(16, 185, 129, 0.3)' : 'rgba(16, 185, 129, 0.45)'}`,
                      }}
                      onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.95)' }}
                      onMouseUp={e => { e.currentTarget.style.transform = 'scale(1)' }}
                      onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)' }}
                      aria-label={t('faith.counter', { count: targetCount })}
                    >
                      {isDone ? (
                        <><span>✓</span><span>{targetCount}/{targetCount}</span></>
                      ) : (
                        <>{count}/{targetCount}</>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Fullscreen Reader Modal ── */}
      {fullscreenItem && (
        <FullscreenReader
          item={fullscreenItem}
          color={activeTabMeta.color}
          type="adhkar"
          onClose={() => setFullscreenItem(null)}
        />
      )}
    </div>
  )
}
