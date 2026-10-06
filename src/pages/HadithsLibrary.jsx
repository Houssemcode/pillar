import { useState, useEffect, useCallback, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import faithService from '../api/faithService'
import FullscreenReader from '../components/ui/FullscreenReader'

const EM = '#10B981'
const EM_BG = '#10B98114'
const EM_BD = '#10B98130'

const GRADE_COLOR = {
  'صحيح': '#10B981',
  'حسن': '#F59E0B',
  'حسن صحيح': '#10B981',
  'متفق عليه': '#10B981',
  'sahih': '#10B981',
  'hasan': '#F59E0B',
  'hasan_sahih': '#10B981',
  'muttafaqun_alayh': '#10B981',
}

function HadithCard({ hadith, onExpand, isAr }) {
  const [expanded, setExpanded] = useState(false)
  const gradeLabel = hadith.grade_display || hadith.grade || ''
  const gradeColor = GRADE_COLOR[hadith.grade] || GRADE_COLOR[gradeLabel] || '#a1a1aa'

  return (
    <div
      style={{
        padding: '18px 20px',
        borderRadius: 14,
        background: 'var(--color-surface-2)',
        border: `1px solid ${expanded ? EM + '40' : 'var(--color-border)'}`,
        transition: 'all 150ms',
      }}
    >
      <div
        dir="rtl"
        style={{
          fontSize: 16,
          fontFamily: 'var(--font-arabic, "Traditional Arabic", serif)',
          lineHeight: 2.1,
          color: 'var(--color-text)',
          fontWeight: 500,
          cursor: 'pointer',
        }}
        onClick={() => setExpanded(s => !s)}
      >
        «&nbsp;{hadith.text}&nbsp;»
      </div>

      {/* Strict bilingual rule: hide English translation if isAr is true */}
      {!isAr && hadith.translation && (
        <p
          dir="ltr"
          style={{
            fontSize: 13,
            color: 'var(--color-text-muted)',
            marginTop: 8,
            lineHeight: 1.6,
            fontStyle: 'italic',
          }}
        >
          "{hadith.translation}"
        </p>
      )}

      {expanded && (
        <div
          dir={isAr ? 'rtl' : 'ltr'}
          style={{
            marginTop: 14,
            paddingTop: 14,
            borderTop: '1px solid var(--color-border)',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', fontSize: 12, color: 'var(--color-text-muted)' }}>
            {hadith.narrator && (
              <div>
                <span style={{ fontWeight: 700, color: 'var(--color-text)' }}>
                  {isAr ? 'الراوي: ' : 'Narrator: '}
                </span>
                {hadith.narrator}
              </div>
            )}
            {hadith.narrator && hadith.source && <span>·</span>}
            {hadith.source && (
              <div>
                <span style={{ fontWeight: 700, color: 'var(--color-text)' }}>
                  {isAr ? 'المصدر: ' : 'Source: '}
                </span>
                {hadith.source}
              </div>
            )}
          </div>
        </div>
      )}

      <div
        style={{
          display: 'flex',
          gap: 8,
          marginTop: 12,
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
          {hadith.source && (
            <span
              style={{
                fontSize: 10,
                padding: '2px 10px',
                borderRadius: 20,
                background: 'var(--color-surface-3)',
                color: 'var(--color-text-muted)',
                fontWeight: 600,
              }}
            >
              {hadith.source}
            </span>
          )}
          {hadith.category && (
            <span
              style={{
                fontSize: 10,
                padding: '2px 10px',
                borderRadius: 20,
                background: `${EM}15`,
                color: EM,
                fontWeight: 600,
              }}
            >
              {hadith.category}
            </span>
          )}
          {gradeLabel && (
            <span
              style={{
                fontSize: 10,
                padding: '2px 10px',
                borderRadius: 20,
                background: `${gradeColor}18`,
                color: gradeColor,
                fontWeight: 700,
              }}
            >
              {gradeLabel}
            </span>
          )}
        </div>

        {/* Expand button */}
        <button
          onClick={() => onExpand(hadith)}
          title={isAr ? 'عرض ملء الشاشة' : 'Fullscreen view'}
          style={{
            width: 30,
            height: 30,
            borderRadius: 8,
            flexShrink: 0,
            background: 'var(--color-surface-3)',
            border: '1px solid var(--color-border)',
            color: 'var(--color-text-muted)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 150ms',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = `${EM}20`
            e.currentTarget.style.color = EM
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'var(--color-surface-3)'
            e.currentTarget.style.color = 'var(--color-text-muted)'
          }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <polyline points="15,3 21,3 21,9" /><polyline points="9,21 3,21 3,15" />
            <line x1="21" y1="3" x2="14" y2="10" /><line x1="3" y1="21" x2="10" y2="14" />
          </svg>
        </button>
      </div>
    </div>
  )
}

function HadithsSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {[1, 2, 3, 4, 5].map(i => (
        <div
          key={i}
          style={{
            padding: '20px',
            borderRadius: 14,
            background: 'var(--color-surface-2)',
            border: '1px solid var(--color-border)',
            opacity: Math.max(0.2, 0.7 - i * 0.1),
          }}
        >
          <div
            style={{
              height: 20,
              width: `${Math.max(40, 80 - i * 8)}%`,
              background: 'var(--color-surface-3)',
              borderRadius: 6,
              marginBottom: 14,
            }}
          />
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ height: 18, width: 70, background: 'var(--color-surface-3)', borderRadius: 12 }} />
            <div style={{ height: 18, width: 55, background: 'var(--color-surface-3)', borderRadius: 12 }} />
          </div>
        </div>
      ))}
    </div>
  )
}

export default function HadithsLibrary() {
  const { t, i18n } = useTranslation()
  const isAr = i18n.language === 'ar' || i18n.language?.startsWith('ar')

  const [hadiths, setHadiths] = useState([])
  const [categories, setCategories] = useState(['الكل'])
  const [category, setCategory] = useState('الكل')
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [todayHadith, setTodayHadith] = useState(null)
  const [fullscreenItem, setFullscreenItem] = useState(null)

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  // Fetch categories & today's hadith on mount
  const loadInitialData = useCallback(async () => {
    try {
      const [catsRes, todayRes] = await Promise.all([
        faithService.getHadithCategories().catch(err => {
          console.warn('[HadithsLibrary] Error loading categories:', err)
          return ['الكل']
        }),
        faithService.getHadithOfTheDay().catch(err => {
          console.warn('[HadithsLibrary] Error loading today hadith:', err)
          return null
        }),
      ])
      if (Array.isArray(catsRes) && catsRes.length > 0) {
        const unique = Array.from(new Set(catsRes.filter(Boolean).map(c => typeof c === 'string' ? c.trim() : String(c))))
        setCategories(unique)
      }
      if (todayRes) {
        setTodayHadith(todayRes)
      }
    } catch (err) {
      console.error('[HadithsLibrary] Initialization error:', err)
    }
  }, [])

  useEffect(() => {
    loadInitialData()
  }, [loadInitialData])

  // Guaranteed distinct categories list for rendering chips
  const distinctCategories = useMemo(() => {
    const raw = Array.isArray(categories) ? categories : ['الكل']
    const unique = Array.from(new Set(raw.filter(Boolean).map(c => typeof c === 'string' ? c.trim() : String(c))))
    const withoutAll = unique.filter(c => c !== 'الكل' && c !== 'All')
    return ['الكل', ...withoutAll]
  }, [categories])

  // Fetch hadiths list when category or search changes
  const fetchHadiths = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = {}
      if (category && category !== 'الكل' && category !== 'All') {
        params.category = category
      }
      if (debouncedSearch && debouncedSearch.trim()) {
        params.search = debouncedSearch.trim()
      }
      const data = await faithService.getHadiths(params)
      const list = Array.isArray(data) ? data : (data?.results ?? [])
      setHadiths(list)
    } catch (err) {
      console.error('[HadithsLibrary] Error fetching hadiths:', err)
      setError(err?.message || (isAr ? 'فشل تحميل الأحاديث' : 'Failed to load Hadiths'))
    } finally {
      setLoading(false)
    }
  }, [category, debouncedSearch, isAr])

  useEffect(() => {
    fetchHadiths()
  }, [fetchHadiths])

  return (
    <div className="page" style={{ display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <div style={{ marginBottom: 20, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <Link
            to="/faith"
            style={{
              fontSize: 12,
              color: 'var(--color-text-muted)',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <polyline points="15,18 9,12 15,6" />
            </svg>
            {t('faith.title', 'الإيمان')}
          </Link>
          <span style={{ color: 'var(--color-text-muted)', fontSize: 12 }}>/</span>
          <span style={{ fontSize: 12, color: EM, fontWeight: 600 }}>
            {t('faith.hadithsLibrary', 'مكتبة الأحاديث')}
          </span>
          <Link
            to="/adhkar"
            style={{
              marginLeft: isAr ? 0 : 'auto',
              marginRight: isAr ? 'auto' : 0,
              fontSize: 12,
              color: EM,
              textDecoration: 'none',
              padding: '4px 12px',
              borderRadius: 20,
              border: `1px solid ${EM_BD}`,
              background: EM_BG,
            }}
          >
            📿 {t('faith.adhkarAndSupplications', 'الأذكار والأدعية')} {isAr ? '←' : '→'}
          </Link>
        </div>
        <h1
          style={{
            fontSize: 22,
            fontWeight: 800,
            color: 'var(--color-text)',
            fontFamily: isAr ? 'var(--font-arabic)' : 'inherit',
          }}
        >
          📚 {isAr ? 'مكتبة الأحاديث النبوية' : 'Prophetic Hadiths Library'}
        </h1>
        <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginTop: 4 }}>
          {isAr
            ? 'مجموعة من الأحاديث النبوية الشريفة المصنفة بحسب الموضوع'
            : 'Curated collection of authentic prophetic traditions categorized by topic'}
        </p>
      </div>

      {/* Today's Hadith Banner */}
      {todayHadith && (
        <div
          style={{
            padding: '18px 22px',
            borderRadius: 16,
            marginBottom: 20,
            background: `linear-gradient(135deg, ${EM}18, ${EM}06)`,
            border: `1px solid ${EM}35`,
            flexShrink: 0,
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 10,
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 700, color: EM, letterSpacing: '0.07em', textTransform: 'uppercase' }}>
              ✨ {t('faith.hadithOfTheDay', 'حديث اليوم')}
            </div>
            <button
              onClick={() => setFullscreenItem(todayHadith)}
              style={{
                background: 'transparent',
                border: 'none',
                color: EM,
                cursor: 'pointer',
                fontSize: 11,
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <span>{isAr ? 'عرض ملء الشاشة' : 'Fullscreen'}</span>
            </button>
          </div>
          <div
            dir="rtl"
            style={{
              fontSize: 16,
              fontFamily: 'var(--font-arabic, "Traditional Arabic", serif)',
              lineHeight: 2.1,
              color: 'var(--color-text)',
              fontWeight: 500,
            }}
          >
            «&nbsp;{todayHadith.text}&nbsp;»
          </div>
          {!isAr && todayHadith.translation && (
            <p
              dir="ltr"
              style={{
                fontSize: 13,
                color: 'var(--color-text-muted)',
                marginTop: 8,
                lineHeight: 1.6,
                fontStyle: 'italic',
              }}
            >
              "{todayHadith.translation}"
            </p>
          )}
          <div
            dir={isAr ? 'rtl' : 'ltr'}
            style={{ display: 'flex', gap: 10, marginTop: 10, flexWrap: 'wrap', alignItems: 'center' }}
          >
            {todayHadith.narrator && (
              <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                {isAr ? `رواه ${todayHadith.narrator}` : `Narrated by ${todayHadith.narrator}`}
              </span>
            )}
            {todayHadith.narrator && todayHadith.source && (
              <span style={{ color: 'var(--color-text-muted)' }}>·</span>
            )}
            {todayHadith.source && (
              <span style={{ fontSize: 11, color: EM, fontWeight: 600 }}>{todayHadith.source}</span>
            )}
            {(todayHadith.grade_display || todayHadith.grade) && (
              <>
                <span style={{ color: 'var(--color-text-muted)' }}>·</span>
                <span
                  style={{
                    fontSize: 11,
                    color: GRADE_COLOR[todayHadith.grade] || GRADE_COLOR[todayHadith.grade_display] || '#a1a1aa',
                    fontWeight: 700,
                  }}
                >
                  {todayHadith.grade_display || todayHadith.grade}
                </span>
              </>
            )}
          </div>
        </div>
      )}

      {/* Search + Filter */}
      <div className="glass-card" style={{ marginBottom: 16, flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 14 }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              style={{
                position: 'absolute',
                [isAr ? 'right' : 'left']: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                opacity: 0.4,
              }}
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              className="input"
              dir={isAr ? 'rtl' : 'ltr'}
              placeholder={isAr ? 'ابحث في الأحاديث...' : 'Search in hadiths...'}
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width: '100%',
                boxSizing: 'border-box',
                paddingRight: isAr ? 36 : 12,
                paddingLeft: isAr ? 12 : 36,
                fontFamily: isAr ? 'var(--font-arabic)' : 'inherit',
              }}
            />
          </div>
          <span
            style={{
              fontSize: 12,
              color: 'var(--color-text-muted)',
              flexShrink: 0,
              background: 'var(--color-surface-3)',
              padding: '4px 12px',
              borderRadius: 20,
              fontWeight: 600,
            }}
          >
            {loading ? '…' : `${hadiths.length} ${isAr ? 'حديث' : 'hadiths'}`}
          </span>
        </div>

        {/* Category pills */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {distinctCategories.map((cat, index) => {
            const isSelected = category === cat
            return (
              <button
                key={index}
                onClick={() => setCategory(cat)}
                style={{
                  padding: '5px 14px',
                  borderRadius: 20,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: isAr ? 'var(--font-arabic)' : 'inherit',
                  background: isSelected ? EM_BG : 'transparent',
                  color: isSelected ? EM : 'var(--color-text-muted)',
                  border: `1px solid ${isSelected ? EM_BD : 'var(--color-border)'}`,
                  transition: 'all 150ms',
                }}
              >
                {cat}
              </button>
            )
          })}
        </div>
      </div>

      {/* Hadith list area */}
      <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
        {error ? (
          <div
            style={{
              textAlign: 'center',
              padding: '40px 20px',
              background: 'var(--color-surface-2)',
              borderRadius: 14,
              border: '1px solid var(--color-border)',
              margin: '20px 0',
            }}
          >
            <div style={{ fontSize: 32, marginBottom: 8 }}>⚠️</div>
            <div style={{ fontSize: 14, color: 'var(--color-danger, #EF4444)', fontWeight: 600, marginBottom: 14 }}>
              {error}
            </div>
            <button
              onClick={fetchHadiths}
              style={{
                padding: '6px 18px',
                borderRadius: 8,
                background: EM,
                color: '#fff',
                border: 'none',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {isAr ? 'إعادة المحاولة' : 'Retry'}
            </button>
          </div>
        ) : loading ? (
          <HadithsSkeleton />
        ) : hadiths.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--color-text-muted)' }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>📭</div>
            <div style={{ fontFamily: isAr ? 'var(--font-arabic)' : 'inherit' }}>
              {isAr ? 'لا توجد أحاديث مطابقة للبحث' : 'No hadiths found matching your query'}
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {hadiths.map(h => (
              <HadithCard key={h.id} hadith={h} onExpand={setFullscreenItem} isAr={isAr} />
            ))}
          </div>
        )}
      </div>

      {fullscreenItem && (
        <FullscreenReader
          item={{
            ...fullscreenItem,
            translation: !isAr ? fullscreenItem.translation : null,
          }}
          color={EM}
          type="hadith"
          onClose={() => setFullscreenItem(null)}
        />
      )}
    </div>
  )
}
