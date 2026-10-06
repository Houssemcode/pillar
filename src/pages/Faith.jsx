/**
 * Faith.jsx — Faith & Spiritual Dashboard
 *
 * Fully integrated with Django Backend via `faithService`.
 * Minimalist, zen-like summary dashboard:
 * - Header: Minimalist daily prayer ribbon
 * - Main: Adhkar Summary Cards (Morning / Evening) + Hadith of the Day
 * - Sidebar: Today's Deeds checklist
 * (Khatmah Tracker removed — handled in Habits module)
 */
import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Checkbox from '../components/ui/Checkbox'
import { useUser } from '../context/UserContext'
import faithService from '../api/faithService'
import PageLayout from '../components/layout/PageLayout'
import './Faith.css'

/* ─── Theme constants ──────────────────────────────────────── */
const EM = '#10B981'
const EM_SUBTLE = 'rgba(16, 185, 129, 0.08)'
const EM_BORDER = 'rgba(16, 185, 129, 0.35)'

/* ─── Shared card style ────────────────────────────────────── */
const CARD_CLASSES = 'bg-white dark:bg-[#121212] border border-gray-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm dark:shadow-none transition-all'

function timeToMins(t) {
  if (!t || typeof t !== 'string') return 0
  const [h, m] = t.split(':').map(Number)
  return (h || 0) * 60 + (m || 0)
}

function getTodayDateStr() {
  const today = new Date()
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
}

/* ═══════════════════════════════════════════════════════════
   SUB-COMPONENTS
   ═══════════════════════════════════════════════════════════ */

/* ── Prayer Schedule Card ─────────────────────────────────── */
function PrayerScheduleCard({ prayers, now, onToggleFard, isExcused }) {
  const { t, i18n } = useTranslation()
  const isAr = i18n.language === 'ar' || i18n.language?.startsWith('ar')
  const mins = now.getHours() * 60 + now.getMinutes()
  const next = prayers.find(p => !p.fardDone && timeToMins(p.time) > mins) || null

  let countdown = '—'
  if (next) {
    const diff = timeToMins(next.time) - mins
    const h = Math.floor(diff / 60), m = diff % 60
    countdown = h > 0 ? `${h}h ${m}m` : `${m}m`
  }

  const completedCount = prayers.filter(p => p.fardDone).length

  return (
    <div className={`prayer-schedule-card faith-widget-card w-full ${CARD_CLASSES}`}>
      {/* ── Status row ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
        {isExcused ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--color-text-muted)', fontSize: 13 }}>
            <span>🌸</span>
            <span>{t('faith.excusedPeriod')}</span>
          </div>
        ) : next ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{
              width: 8, height: 8, borderRadius: '50%',
              background: EM, display: 'inline-block',
              boxShadow: `0 0 0 3px ${EM_SUBTLE}`,
              flexShrink: 0,
            }} />
            <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              {t('faith.nextPrayer')}
            </span>
            <span className="text-gray-300 dark:text-zinc-700 select-none">·</span>
            <span className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white" style={{ fontFamily: isAr ? 'var(--font-arabic)' : 'inherit' }}>
              {isAr ? `صلاة ${next.ar}` : `${next.en} Prayer`}
            </span>
            <span style={{ fontSize: 12, fontWeight: 700, color: EM, fontVariantNumeric: 'tabular-nums' }}>
              {next.time}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              ({t('faith.inCountdown', { countdown })})
            </span>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: EM, fontSize: 13, fontWeight: 600 }}>
            <span>🌙</span>
            <span>{t('faith.allPrayersCompleted')}</span>
          </div>
        )}

        <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
          <span>{t('faith.prayerTimesToday')}</span>
          <span className="text-gray-300 dark:text-zinc-700 select-none">·</span>
          <span className="font-semibold text-gray-900 dark:text-white" style={{ fontVariantNumeric: 'tabular-nums' }}>
            {completedCount}/{prayers.length}
          </span>
        </div>
      </div>

      {/* ── 5 Prayer Cards Row (Single horizontal scrollable row on mobile) ── */}
      <div
        className="prayer-schedule-grid flex flex-nowrap overflow-x-auto hide-scrollbar gap-4"
        style={{
          display: 'flex',
          flexWrap: 'nowrap',
          overflowX: 'auto',
          gap: 16,
          paddingBottom: 4,
        }}
      >
        {prayers.map(p => {
          const pMins = timeToMins(p.time)
          const isNext = !isExcused && !p.fardDone && pMins > mins && next?.key === p.key
          const isDone = p.fardDone
          const prayerName = isAr ? p.ar : p.en

          return (
            <button
              key={p.key}
              type="button"
              disabled={isExcused}
              onClick={() => !isExcused && onToggleFard(p.key)}
              className={`prayer-item-pill snap-start flex flex-col justify-between p-3 rounded-xl min-w-[120px] shrink-0 border cursor-pointer transition-all ${
                isNext
                  ? 'border-emerald-500/50 bg-emerald-50 dark:bg-emerald-500/10 shadow-sm'
                  : isDone
                  ? 'border-gray-200 dark:border-zinc-800/60 bg-gray-100/70 dark:bg-zinc-900/40 opacity-70'
                  : 'border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900 hover:border-gray-300 dark:hover:border-zinc-700'
              }`}
              style={{
                flex: '1 0 120px',
                minHeight: 72,
                cursor: isExcused ? 'not-allowed' : 'pointer',
                opacity: isExcused ? 0.45 : isDone ? 0.75 : 1,
                textAlign: isAr ? 'right' : 'left',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <span
                  className={`text-xs sm:text-sm font-bold truncate flex-1 ${
                    isDone
                      ? 'line-through text-gray-400 dark:text-zinc-500'
                      : isNext
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-gray-900 dark:text-white'
                  }`}
                  style={{ fontFamily: isAr ? 'var(--font-arabic)' : 'inherit' }}
                >
                  {prayerName}
                </span>
                <span style={{
                  width: 16, height: 16, borderRadius: '50%', flexShrink: 0,
                  marginLeft: isAr ? 0 : 4, marginRight: isAr ? 4 : 0,
                  border: isDone ? `1.5px solid ${EM}` : isNext ? `1.5px solid ${EM}` : '1.5px solid #d1d5db',
                  background: isDone ? EM : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 9, fontWeight: 800, color: isDone ? '#fff' : 'transparent',
                }}>
                  {isDone ? '✓' : ''}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span
                  className={`text-xs font-semibold ${
                    isNext
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : isDone
                      ? 'text-gray-400 dark:text-zinc-500'
                      : 'text-gray-600 dark:text-gray-400'
                  }`}
                  style={{ fontVariantNumeric: 'tabular-nums' }}
                >
                  {p.time}
                </span>
                <span className="text-[10px] text-gray-400 dark:text-zinc-500">
                  {p.fard}R
                </span>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

/* ── Adhkar Summary Card ──────────────────────────────────── */
function AdhkarSummaryCard({ type, icon, title, description, items = [], onStart }) {
  const { t } = useTranslation()
  const total = items.length
  const doneCount = items.filter(a => a.done).length
  const pct = total > 0 ? Math.round((doneCount / total) * 100) : 0
  const isAllDone = total > 0 && doneCount === total

  const isMorning = type === 'morning'
  const accentColor = isMorning ? '#F59E0B' : '#6366F1'
  const accentBg = isMorning ? 'rgba(245, 158, 11, 0.08)' : 'rgba(99, 102, 241, 0.08)'
  const accentBorder = isMorning ? 'rgba(245, 158, 11, 0.25)' : 'rgba(99, 102, 241, 0.25)'

  return (
    <div className={`faith-widget-card w-full ${CARD_CLASSES} flex flex-col justify-between min-h-[220px]`}>
      {/* Top Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: accentBg, border: `1px solid ${accentBorder}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22,
          }}>
            {icon}
          </div>
          <span
            className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
              isAllDone
                ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30'
                : 'bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-zinc-700/60'
            }`}
            style={{ fontVariantNumeric: 'tabular-nums' }}
          >
            {isAllDone ? `✓ ${t('faith.done')}` : `${doneCount} / ${total}`}
          </span>
        </div>

        <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">
          {title}
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mb-4">
          {description}
        </p>
      </div>

      {/* Progress bar + Action Button */}
      <div>
        {/* Progress Bar */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, fontSize: 11 }}>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {t('faith.adhkarProgress', { count: doneCount, total })}
            </span>
            <span
              className={`text-xs font-bold ${isAllDone ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-900 dark:text-white'}`}
              style={{ fontVariantNumeric: 'tabular-nums' }}
            >
              {pct}%
            </span>
          </div>
          <div className="w-full h-1.5 bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden">
            <div style={{
              height: '100%', borderRadius: 4,
              background: isAllDone ? EM : accentColor,
              width: `${pct}%`, transition: 'width 300ms ease',
            }} />
          </div>
        </div>

        {/* Start Reading Button */}
        <button
          type="button"
          onClick={onStart}
          style={{
            width: '100%',
            padding: '10px 16px',
            borderRadius: 12,
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer',
            background: isAllDone ? 'rgba(16, 185, 129, 0.1)' : accentBg,
            backgroundColor: isAllDone ? 'rgba(16, 185, 129, 0.1)' : accentBg,
            color: isAllDone ? EM : accentColor,
            border: `1px solid ${isAllDone ? 'rgba(16, 185, 129, 0.3)' : accentBorder}`,
            outline: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            transition: 'all 150ms ease',
          }}
          onMouseEnter={e => { e.currentTarget.style.filter = 'brightness(1.15)' }}
          onMouseLeave={e => { e.currentTarget.style.filter = 'none' }}
        >
          <span>{t('faith.startReading')}</span>
          <span style={{ fontSize: 14 }}>→</span>
        </button>
      </div>
    </div>
  )
}

/* ── Hadith of the Day ───────────────────────────────────── */
function HadithCard({ hadith }) {
  const { t, i18n } = useTranslation()
  const isAr = i18n.language === 'ar' || i18n.language?.startsWith('ar')
  if (!hadith) return null

  return (
    <div className={`hadith-card faith-widget-card w-full ${CARD_CLASSES}`}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ color: EM, fontSize: 11 }}>◈</span>
          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
            {t('faith.hadithOfTheDay')}
          </span>
        </div>
        <Link
          to="/hadiths"
          className="text-xs font-semibold text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 flex items-center gap-1 transition-colors"
          style={{ textDecoration: 'none' }}
        >
          <span>{t('faith.hadithsLibrary')}</span>
          <span>→</span>
        </Link>
      </div>

      {/* Arabic text */}
      <blockquote
        dir="rtl"
        className="text-lg leading-loose font-medium text-gray-900 dark:text-white select-text my-4 text-right"
        style={{
          fontFamily: 'var(--font-arabic)',
          margin: 0,
          padding: 0,
          border: 'none',
          background: 'transparent',
        }}
      >
        « {hadith.text} »
      </blockquote>

      {/* English translation */}
      {!isAr && hadith.translation && (
        <p className="text-sm text-gray-600 dark:text-gray-400 italic mt-3 leading-relaxed text-left" dir="ltr">
          "{hadith.translation}"
        </p>
      )}

      {/* Source */}
      <div
        className="mt-4 pt-3 border-t border-gray-100 dark:border-zinc-800/60 text-xs text-gray-500 dark:text-gray-400 italic"
        style={{
          textAlign: isAr ? 'right' : 'left',
          direction: isAr ? 'rtl' : 'ltr',
        }}
      >
        — {hadith.source}{hadith.narrator ? (isAr ? ` (رواه ${hadith.narrator})` : ` (${hadith.narrator})`) : ''}
      </div>
    </div>
  )
}

/* ── Today's Deeds List ──────────────────────────────────── */
function TodayDeedsList({ deeds = [], doneDeeds = new Set(), onToggleDeed, isExcused }) {
  const { t, i18n } = useTranslation()
  const isAr = i18n.language === 'ar' || i18n.language?.startsWith('ar')

  const filteredDeeds = isExcused
    ? deeds.filter(d => !['fast', 'qiyam'].includes(String(d.id).toLowerCase()) && !['fasting', 'night prayer'].includes((d.title_en || '').toLowerCase()))
    : deeds

  const items = filteredDeeds.map(d => {
    const isRecommended = isExcused && (d.is_recommended_excuse || ['sadaqa', 'quran', 'duaa'].includes(String(d.id).toLowerCase()))
    return {
      id: d.id,
      isDone: doneDeeds.has(d.id),
      onToggle: () => onToggleDeed(d.id),
      ar: d.title,
      en: d.title_en || d.title,
      desc: d.description,
      emoji: d.emoji || '🤲',
      isRecommended,
    }
  })

  const doneCount = items.filter(i => i.isDone).length

  return (
    <div className={`today-deeds-card faith-widget-card w-full ${CARD_CLASSES}`}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ color: '#F59E0B', fontSize: 15 }}>✦</span>
          <span className="text-sm font-bold text-gray-900 dark:text-white">
            {t('faith.todayDeeds', "Today's Deeds")}
          </span>
        </div>
        <span className="text-xs text-gray-500 dark:text-gray-400 font-semibold" style={{ fontVariantNumeric: 'tabular-nums' }}>
          {doneCount} / {items.length}
        </span>
      </div>

      {/* Deeds list */}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {items.map((item, idx) => (
          <div
            key={item.id}
            onClick={item.onToggle}
            className={`faith-deed-row flex items-start gap-3 p-2.5 rounded-xl border-b cursor-pointer transition-all hover:bg-gray-50 dark:hover:bg-zinc-800/50 ${
              idx < items.length - 1 ? 'border-gray-100 dark:border-zinc-800/50' : 'border-transparent'
            } ${item.isDone ? 'opacity-60' : 'opacity-100'}`}
          >
            {/* Checkbox */}
            <div style={{ paddingTop: 2, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
              <Checkbox
                checked={item.isDone}
                onChange={item.onToggle}
                size="sm"
                aria-label={isAr ? item.ar : item.en}
              />
            </div>

            {/* Content */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 13 }}>{item.emoji}</span>
                <span
                  className={`text-xs sm:text-sm font-medium ${
                    item.isDone ? 'line-through text-gray-400 dark:text-zinc-500' : 'text-gray-900 dark:text-white'
                  }`}
                  style={{ fontFamily: isAr ? 'var(--font-arabic)' : 'inherit' }}
                >
                  {isAr ? item.ar : item.en}
                </span>
                {item.isRecommended && !item.isDone && (
                  <span style={{
                    fontSize: 10, color: EM, fontWeight: 600,
                    background: EM_SUBTLE, border: `1px solid ${EM_BORDER}`,
                    padding: '1px 7px', borderRadius: 6,
                  }}>
                    {isAr ? 'مُستحب' : 'Recommended'}
                  </span>
                )}
              </div>
              {!isAr && item.desc && (
                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 leading-snug">
                  {item.desc}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── Skeleton Loader ──────────────────────────────────────── */
function FaithSkeleton() {
  const pulse = { background: 'var(--color-surface-3, rgba(125,125,125,0.12))', borderRadius: 8 }

  return (
    <div className="page faith-page page--layout bg-gray-50 dark:bg-[#09090b]">
      <PageLayout
        mainClassName="faith-main-column w-full"
        sidebarClassName="faith-desktop-sidebar hidden lg:block"
        sidebar={
          <div className="flex flex-col gap-6 w-full">
            <div className={`faith-widget-card w-full ${CARD_CLASSES}`} style={{ minHeight: 220 }}>
              <div style={{ ...pulse, height: 44, width: 44, borderRadius: 12, marginBottom: 14 }} />
              <div style={{ ...pulse, height: 18, width: '50%', marginBottom: 8 }} />
              <div style={{ ...pulse, height: 14, width: '70%', marginBottom: 20 }} />
              <div style={{ ...pulse, height: 36, borderRadius: 12 }} />
            </div>
            <div className={`faith-widget-card w-full ${CARD_CLASSES}`} style={{ minHeight: 220 }}>
              <div style={{ ...pulse, height: 44, width: 44, borderRadius: 12, marginBottom: 14 }} />
              <div style={{ ...pulse, height: 18, width: '50%', marginBottom: 8 }} />
              <div style={{ ...pulse, height: 14, width: '70%', marginBottom: 20 }} />
              <div style={{ ...pulse, height: 36, borderRadius: 12 }} />
            </div>
          </div>
        }
      >
        <div className="flex flex-col gap-6 lg:gap-8 w-full">
          <div className={`prayer-schedule-card faith-widget-card w-full ${CARD_CLASSES}`}>
            <div style={{ ...pulse, height: 20, width: '30%', marginBottom: 16 }} />
            <div className="prayer-schedule-grid flex flex-nowrap overflow-x-auto hide-scrollbar gap-4" style={{ gap: 16, paddingBottom: 4 }}>
              {[1, 2, 3, 4, 5].map(i => (
                <div
                  key={i}
                  className="prayer-item-pill snap-start"
                  style={{ ...pulse, height: 72, borderRadius: 12, flex: '1 0 120px', minWidth: 120, flexShrink: 0 }}
                />
              ))}
            </div>
          </div>

          <div className={`hadith-card faith-widget-card w-full ${CARD_CLASSES}`}>
            <div style={{ ...pulse, height: 16, width: '25%', marginBottom: 16 }} />
            <div style={{ ...pulse, height: 24, width: '80%', marginBottom: 12 }} />
            <div style={{ ...pulse, height: 16, width: '50%' }} />
          </div>

          {/* Mobile-only Adhkar Skeleton */}
          <div className="mobile-adhkar flex flex-col gap-6 lg:hidden w-full">
            <div className={`faith-widget-card w-full ${CARD_CLASSES}`} style={{ minHeight: 220 }}>
              <div style={{ ...pulse, height: 44, width: 44, borderRadius: 12, marginBottom: 14 }} />
              <div style={{ ...pulse, height: 18, width: '50%', marginBottom: 8 }} />
              <div style={{ ...pulse, height: 14, width: '70%', marginBottom: 20 }} />
              <div style={{ ...pulse, height: 36, borderRadius: 12 }} />
            </div>
            <div className={`faith-widget-card w-full ${CARD_CLASSES}`} style={{ minHeight: 220 }}>
              <div style={{ ...pulse, height: 44, width: 44, borderRadius: 12, marginBottom: 14 }} />
              <div style={{ ...pulse, height: 18, width: '50%', marginBottom: 8 }} />
              <div style={{ ...pulse, height: 14, width: '70%', marginBottom: 20 }} />
              <div style={{ ...pulse, height: 36, borderRadius: 12 }} />
            </div>
          </div>

          <div className={`today-deeds-card faith-widget-card w-full ${CARD_CLASSES}`}>
            <div style={{ ...pulse, height: 18, width: '35%', marginBottom: 16 }} />
            {[1, 2, 3, 4].map(i => (
              <div key={i} style={{ ...pulse, height: 38, borderRadius: 8, marginBottom: 8 }} />
            ))}
          </div>
        </div>
      </PageLayout>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════
   MAIN FAITH DASHBOARD
   ═══════════════════════════════════════════════════════════ */
export default function Faith() {
  const { t, i18n } = useTranslation()
  const isAr = i18n?.language === 'ar' || i18n?.language?.startsWith('ar')
  const navigate = useNavigate()
  const { isExcused } = useUser()
  const [now, setNow] = useState(new Date())

  const [morningAdhkar, setMorningAdhkar] = useState([])
  const [eveningAdhkar, setEveningAdhkar] = useState([])
  const [hadithOfTheDay, setHadithOfTheDay] = useState(null)
  const [goodDeeds, setGoodDeeds] = useState([])
  const [prayers, setPrayers] = useState([])
  const [doneDeeds, setDoneDeeds] = useState(() => new Set())

  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  const loadData = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    const dateStr = getTodayDateStr()
    try {
      const [morningData, eveningData, hadithData, deedsData, prayersData] = await Promise.all([
        faithService.getAdhkar({ category: 'morning', date: dateStr }).catch(() => []),
        faithService.getAdhkar({ category: 'evening', date: dateStr }).catch(() => []),
        faithService.getHadithOfTheDay().catch(() => null),
        faithService.getGoodDeeds().catch(() => []),
        faithService.getPrayers(dateStr).catch(() => []),
      ])

      setMorningAdhkar(Array.isArray(morningData) ? morningData : [])
      setEveningAdhkar(Array.isArray(eveningData) ? eveningData : [])
      setHadithOfTheDay(hadithData || null)
      setGoodDeeds(deedsData || [])
      setPrayers(prayersData || [])

      if (Array.isArray(deedsData)) {
        const initialDoneDeeds = deedsData.filter(d => d.done).map(d => d.id)
        if (initialDoneDeeds.length > 0) setDoneDeeds(new Set(initialDoneDeeds))
      }
    } catch (err) {
      console.error('[Faith] Failed to load dashboard data:', err)
      setError(err.message + (err.response ? ' (Status: ' + err.response.status + ')' : ' (Network Error)'))
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const toggleFard = useCallback(async (key) => {
    const prev = prayers.find(p => p.key === key)
    if (!prev) return
    const dateStr = getTodayDateStr()
    setPrayers(ps => ps.map(p => p.key === key ? { ...p, fardDone: !p.fardDone } : p))
    try {
      const updated = await faithService.togglePrayer(key, dateStr)
      setPrayers(ps => ps.map(p => p.key === key ? { ...p, fardDone: updated.fardDone } : p))
    } catch {
      setPrayers(ps => ps.map(p => p.key === key ? prev : p))
    }
  }, [prayers])

  const toggleDeedItem = useCallback(async (id) => {
    const isCurrentlyDone = doneDeeds.has(id)
    setDoneDeeds(prev => {
      const next = new Set(prev)
      if (isCurrentlyDone) next.delete(id)
      else next.add(id)
      return next
    })
    try {
      await faithService.toggleGoodDeed({ deed_id: id, date: getTodayDateStr() })
    } catch {
      setDoneDeeds(prev => {
        const next = new Set(prev)
        if (isCurrentlyDone) next.add(id)
        else next.delete(id)
        return next
      })
    }
  }, [doneDeeds])

  if (isLoading) return <FaithSkeleton />

  return (
    <div className="page faith-page page--layout bg-gray-50 dark:bg-[#09090b]">
      <PageLayout
        mainClassName="faith-main-column w-full"
        sidebarClassName="faith-desktop-sidebar hidden lg:block"
        header={
          error ? (
            <div
              className="flex items-center justify-between gap-3 p-3 mb-4 rounded-xl border"
              style={{
                background: 'rgba(244, 63, 94, 0.1)',
                borderColor: 'rgba(244, 63, 94, 0.3)',
              }}
            >
              <span className="text-xs text-[#F43F5E] font-medium">
                ⚠️ {error}
              </span>
              <button
                type="button"
                onClick={loadData}
                className="px-3 py-1 rounded-lg text-xs font-semibold transition-colors"
                style={{
                  background: 'rgba(244, 63, 94, 0.18)',
                  borderColor: 'rgba(244, 63, 94, 0.4)',
                  color: '#FDA4AF',
                }}
              >
                {t('common.retry')}
              </button>
            </div>
          ) : null
        }
        sidebar={
          <div className="flex flex-col gap-6 w-full">
            {/* Morning Adhkar Card */}
            <AdhkarSummaryCard
              type="morning"
              icon="🌅"
              title={t('faith.morningAdhkar')}
              description={t('faith.morningAdhkarDescription')}
              items={morningAdhkar}
              onStart={() => navigate('/faith/adhkar?type=morning')}
            />

            {/* Evening Adhkar Card */}
            <AdhkarSummaryCard
              type="evening"
              icon="🌆"
              title={t('faith.eveningAdhkar')}
              description={t('faith.eveningAdhkarDescription')}
              items={eveningAdhkar}
              onStart={() => navigate('/faith/adhkar?type=evening')}
            />
          </div>
        }
      >
        <div className="flex flex-col gap-6 lg:gap-8 w-full">
          {/* ── Minimalist Prayer Schedule ── */}
          <PrayerScheduleCard
            prayers={prayers}
            now={now}
            onToggleFard={toggleFard}
            isExcused={isExcused}
          />
            {/* ── Hadith of the Day Card ── */}
          <HadithCard hadith={hadithOfTheDay} />

          <div className="mobile-adhkar flex flex-col gap-6 lg:hidden w-full">
            {/* Morning Adhkar Card */}
            <AdhkarSummaryCard
              type="morning"
              icon="🌅"
              title={t('faith.morningAdhkar')}
              description={t('faith.morningAdhkarDescription')}
              items={morningAdhkar}
              onStart={() => navigate('/faith/adhkar?type=morning')}
            />

            {/* Evening Adhkar Card */}
            <AdhkarSummaryCard
              type="evening"
              icon="🌆"
              title={t('faith.eveningAdhkar')}
              description={t('faith.eveningAdhkarDescription')}
              items={eveningAdhkar}
              onStart={() => navigate('/faith/adhkar?type=evening')}
            />
          </div>

          {/* ── Today's Deeds List ── */}
          <TodayDeedsList
            deeds={goodDeeds}
            doneDeeds={doneDeeds}
            onToggleDeed={toggleDeedItem}
            isExcused={isExcused}
          />
        </div>
      </PageLayout>
    </div>
  )
}
