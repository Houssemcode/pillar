import { useState, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { faithApi } from '../api/faith'
import {
  MORNING_ADHKAR,
  EVENING_ADHKAR,
  DUAS_CATEGORIES,
  HADITHS_LIBRARY,
  HADITH_CATEGORIES,
} from '../data/adhkarData'

const EM = '#10B981'
const EM_BG = '#10B98114'
const EM_BD = '#10B98130'

/* ─── Helpers ──────────────────────────────────────────────── */
function dayOfYear() {
  const now = new Date()
  return Math.floor((now - new Date(now.getFullYear(), 0, 0)) / 86400000)
}

/* ─── Counter Button ────────────────────────────────────────── */
function CounterButton({ count, target, color, onIncrement }) {
  const pct = Math.min(100, Math.round((count / target) * 100))
  return (
    <button
      onClick={onIncrement}
      style={{
        position: 'relative', overflow: 'hidden',
        padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700,
        background: count >= target ? `${color}30` : 'var(--color-surface-3)',
        color: count >= target ? color : 'var(--color-text-muted)',
        border: `1.5px solid ${count >= target ? color + '60' : 'var(--color-border)'}`,
        cursor: 'pointer', flexShrink: 0, transition: 'all 150ms', minWidth: 60,
      }}
    >
      <span style={{ position: 'relative', zIndex: 1 }}>
        {count}/{target}
      </span>
      <div style={{
        position: 'absolute', left: 0, top: 0, height: '100%',
        width: `${pct}%`, background: `${color}20`,
        transition: 'width 300ms ease',
      }} />
    </button>
  )
}

/* ─── Adhkar Item Row ──────────────────────────────────────── */
function AdhkarItem({ item, done, count, color, onToggle, onCount, showTranslation }) {
  const isGoal = item.count > 1
  const isDone = isGoal ? count >= item.count : done

  return (
    <div
      dir="rtl"
      style={{
        display: 'flex', alignItems: 'flex-start', gap: 12,
        padding: '14px 16px', borderRadius: 12,
        background: isDone ? `${color}08` : 'var(--color-surface-2)',
        border: `1px solid ${isDone ? color + '30' : 'var(--color-border)'}`,
        transition: 'all 150ms', opacity: isDone ? 0.75 : 1,
      }}
    >
      {/* Checkbox */}
      <div
        onClick={() => !isGoal && onToggle(item.id)}
        style={{
          flexShrink: 0, width: 22, height: 22, borderRadius: '50%', marginTop: 2,
          background: isDone ? color : 'transparent',
          border: `2px solid ${isDone ? color : 'var(--color-text-muted)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: isGoal ? 'default' : 'pointer', transition: 'all 150ms',
        }}
      >
        {isDone && (
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round">
            <polyline points="20,6 9,17 4,12" />
          </svg>
        )}
      </div>

      {/* Text block */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 15, fontFamily: 'var(--font-arabic)', fontWeight: 500, lineHeight: 1.9,
          color: isDone ? 'var(--color-text-muted)' : 'var(--color-text)',
          textDecoration: isDone ? 'line-through' : 'none',
        }}>
          {item.text}
        </div>
        {showTranslation && item.translation && (
          <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 4, lineHeight: 1.5, fontStyle: 'italic', textAlign: 'right' }}>
            {item.translation}
          </div>
        )}
        <div style={{ display: 'flex', gap: 8, marginTop: 6, justifyContent: 'flex-end' }}>
          <span style={{ fontSize: 10, color: 'var(--color-text-muted)', background: 'var(--color-surface-3)', padding: '2px 8px', borderRadius: 10 }}>
            {item.source}
          </span>
        </div>
      </div>

      {/* Counter or check */}
      {isGoal ? (
        <CounterButton count={count} target={item.count} color={color} onIncrement={() => onCount(item.id, Math.min(item.count, count + 1))} />
      ) : null}
    </div>
  )
}

/* ─── Adhkar Section ────────────────────────────────────────── */
function AdhkarSection({ items, doneIds, counts, color, onToggle, onCount }) {
  const [showTrans, setShowTrans] = useState(false)
  const done = items.filter(i => i.count > 1 ? (counts[i.id] || 0) >= i.count : doneIds.has(i.id)).length
  const pct = Math.round((done / items.length) * 100)

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ height: 24, padding: '0 10px', borderRadius: 20, background: `${color}20`, color, fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center' }}>
            {done}/{items.length} · {pct}%
          </div>
          <div style={{ width: 80, height: 4, borderRadius: 2, background: 'var(--color-surface-3)', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 2, transition: 'width 400ms ease' }} />
          </div>
        </div>
        <button
          onClick={() => setShowTrans(s => !s)}
          style={{ fontSize: 11, padding: '4px 10px', borderRadius: 8, border: '1px solid var(--color-border)', background: 'transparent', color: 'var(--color-text-muted)', cursor: 'pointer' }}
        >
          {showTrans ? 'إخفاء الترجمة' : 'إظهار الترجمة'}
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {items.map(item => (
          <AdhkarItem
            key={item.id}
            item={item}
            done={doneIds.has(item.id)}
            count={counts[item.id] || 0}
            color={color}
            onToggle={onToggle}
            onCount={onCount}
            showTranslation={showTrans}
          />
        ))}
      </div>
    </div>
  )
}

/* ─── Du'aa Card ─────────────────────────────────────────────── */
function DuaaCard({ item, color }) {
  const [expanded, setExpanded] = useState(false)
  return (
    <div
      style={{
        padding: '14px 16px', borderRadius: 12,
        background: 'var(--color-surface-2)',
        border: '1px solid var(--color-border)',
        cursor: 'pointer', transition: 'border 150ms',
      }}
      onClick={() => setExpanded(s => !s)}
    >
      <div dir="rtl" style={{ fontSize: 15, fontFamily: 'var(--font-arabic)', lineHeight: 1.9, color: 'var(--color-text)', fontWeight: 500 }}>
        {item.text}
      </div>
      {expanded && item.translation && (
        <div dir="ltr" style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 8, lineHeight: 1.6, fontStyle: 'italic', borderTop: '1px solid var(--color-border)', paddingTop: 8 }}>
          {item.translation}
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
        <span style={{ fontSize: 10, color: 'var(--color-text-muted)', background: 'var(--color-surface-3)', padding: '2px 8px', borderRadius: 10 }}>{item.source}</span>
        {item.count > 1 && <span style={{ fontSize: 11, color, fontWeight: 700 }}>×{item.count}</span>}
      </div>
    </div>
  )
}

/* ─── Hadith Card ────────────────────────────────────────────── */
function HadithCard({ hadith }) {
  return (
    <div style={{ padding: '16px 18px', borderRadius: 12, background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }}>
      <div dir="rtl" style={{ fontSize: 15, fontFamily: 'var(--font-arabic)', lineHeight: 2, color: 'var(--color-text)', fontWeight: 500, marginBottom: 10 }}>
        «&nbsp;{hadith.text}&nbsp;»
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
        <span style={{ fontSize: 11, color: 'var(--color-text-muted)', background: 'var(--color-surface-3)', padding: '2px 10px', borderRadius: 10 }}>{hadith.source}</span>
        <span style={{ fontSize: 11, color: EM, background: `${EM}15`, padding: '2px 10px', borderRadius: 10 }}>{hadith.category}</span>
        <span style={{ fontSize: 11, color: 'var(--color-text-muted)', background: 'var(--color-surface-3)', padding: '2px 10px', borderRadius: 10 }}>رواه: {hadith.narrator}</span>
      </div>
    </div>
  )
}

/* ─── Tab Button ─────────────────────────────────────────────── */
function TabBtn({ active, onClick, children, color }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '8px 18px', borderRadius: 20, fontSize: 13, fontWeight: 600,
        cursor: 'pointer', fontFamily: 'var(--font-arabic)', whiteSpace: 'nowrap',
        background: active ? (color ? `${color}20` : EM_BG) : 'transparent',
        color: active ? (color || EM) : 'var(--color-text-muted)',
        border: `1.5px solid ${active ? (color ? `${color}40` : EM_BD) : 'var(--color-border)'}`,
        transition: 'all 150ms',
      }}
    >
      {children}
    </button>
  )
}

/* ─── Main Page ──────────────────────────────────────────────── */
export default function AdhkarLibrary() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('morning')   // morning | evening | duas | hadiths
  const [activeDuaaCategory, setActiveDuaaCategory] = useState('sleep')
  const [hadithCategory, setHadithCategory] = useState('الكل')
  const [hadithSearch, setHadithSearch] = useState('')

  // Local counter state for adhkar (counts per item id)
  const [morningDone, setMorningDone] = useState(new Set())
  const [morningCounts, setMorningCounts] = useState({})
  const [eveningDone, setEveningDone] = useState(new Set())
  const [eveningCounts, setEveningCounts] = useState({})

  const toggleMorning = useCallback((id) => {
    setMorningDone(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }, [])

  const setMorningCount = useCallback((id, val) => {
    setMorningCounts(prev => ({ ...prev, [id]: val }))
  }, [])

  const toggleEvening = useCallback((id) => {
    setEveningDone(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }, [])

  const setEveningCount = useCallback((id, val) => {
    setEveningCounts(prev => ({ ...prev, [id]: val }))
  }, [])

  // Filtered hadiths
  const filteredHadiths = useMemo(() => {
    return HADITHS_LIBRARY.filter(h => {
      const matchCat = hadithCategory === 'الكل' || h.category === hadithCategory
      const matchSearch = !hadithSearch || h.text.includes(hadithSearch) || h.source.includes(hadithSearch)
      return matchCat && matchSearch
    })
  }, [hadithCategory, hadithSearch])

  const todayHadith = HADITHS_LIBRARY[dayOfYear() % HADITHS_LIBRARY.length]
  const activeDuaa = DUAS_CATEGORIES.find(c => c.id === activeDuaaCategory)

  const TABS = [
    { key: 'morning', label: '🌅 أذكار الصباح' },
    { key: 'evening', label: '🌆 أذكار المساء' },
    { key: 'duas', label: '🤲 الأدعية' },
    { key: 'hadiths', label: '📚 مكتبة الأحاديث' },
  ]

  return (
    <div className="page" style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexShrink: 0 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              onClick={() => navigate('/faith')}
              style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: 4, fontSize: 13 }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15,18 9,12 15,6" /></svg>
              الإيمان
            </button>
            <span style={{ color: 'var(--color-text-muted)', fontSize: 12 }}>/</span>
            <span style={{ fontSize: 14, fontWeight: 600, color: EM, fontFamily: 'var(--font-arabic)' }}>الأذكار والأدعية</span>
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--color-text)', marginTop: 4, fontFamily: 'var(--font-arabic)' }}>
            📖 مكتبة الأذكار والأحاديث
          </h1>
        </div>
      </div>

      {/* ── Hadith of Day Banner ── */}
      <div style={{
        padding: '16px 20px', borderRadius: 14, marginBottom: 20,
        background: `linear-gradient(135deg, ${EM}15, ${EM}05)`,
        border: `1px solid ${EM}30`, flexShrink: 0,
      }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: EM, letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 8 }}>
          ✨ حديث اليوم
        </div>
        <div dir="rtl" style={{ fontSize: 15, fontFamily: 'var(--font-arabic)', lineHeight: 2, color: 'var(--color-text)', fontWeight: 500 }}>
          «&nbsp;{todayHadith.text}&nbsp;»
        </div>
        <div dir="rtl" style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 6 }}>
          رواه {todayHadith.narrator} — {todayHadith.source}
        </div>
      </div>

      {/* ── Tabs ── */}
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4, flexShrink: 0, marginBottom: 20 }}>
        {TABS.map(tab => (
          <TabBtn key={tab.key} active={activeTab === tab.key} onClick={() => setActiveTab(tab.key)}>
            {tab.label}
          </TabBtn>
        ))}
      </div>

      {/* ── Content ── */}
      <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>

        {/* Morning Adhkar */}
        {activeTab === 'morning' && (
          <div className="glass-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <span style={{ fontSize: 22 }}>🌅</span>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text)', fontFamily: 'var(--font-arabic)' }}>أذكار الصباح</div>
                <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>يقال بعد صلاة الفجر حتى الضحى</div>
              </div>
            </div>
            <AdhkarSection
              items={MORNING_ADHKAR}
              doneIds={morningDone}
              counts={morningCounts}
              color='#F59E0B'
              onToggle={toggleMorning}
              onCount={setMorningCount}
            />
          </div>
        )}

        {/* Evening Adhkar */}
        {activeTab === 'evening' && (
          <div className="glass-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <span style={{ fontSize: 22 }}>🌆</span>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text)', fontFamily: 'var(--font-arabic)' }}>أذكار المساء</div>
                <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>يقال بعد صلاة العصر حتى المغرب</div>
              </div>
            </div>
            <AdhkarSection
              items={EVENING_ADHKAR}
              doneIds={eveningDone}
              counts={eveningCounts}
              color='#6366F1'
              onToggle={toggleEvening}
              onCount={setEveningCount}
            />
          </div>
        )}

        {/* Du'aa Categories */}
        {activeTab === 'duas' && (
          <div style={{ display: 'flex', gap: 20 }}>
            {/* Left: category list */}
            <div style={{ width: 200, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
              {DUAS_CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setActiveDuaaCategory(cat.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 10,
                    textAlign: 'right', cursor: 'pointer', fontFamily: 'var(--font-arabic)', fontSize: 13, fontWeight: 600,
                    background: activeDuaaCategory === cat.id ? `${cat.color}15` : 'transparent',
                    color: activeDuaaCategory === cat.id ? cat.color : 'var(--color-text-muted)',
                    border: `1px solid ${activeDuaaCategory === cat.id ? cat.color + '40' : 'transparent'}`,
                    transition: 'all 150ms',
                  }}
                >
                  <span style={{ fontSize: 18 }}>{cat.icon}</span>
                  <span style={{ flex: 1, textAlign: 'right' }}>{cat.label}</span>
                </button>
              ))}
            </div>

            {/* Right: items */}
            {activeDuaa && (
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="glass-card">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                    <span style={{ fontSize: 24 }}>{activeDuaa.icon}</span>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: activeDuaa.color, fontFamily: 'var(--font-arabic)' }}>{activeDuaa.label}</div>
                      <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{activeDuaa.items.length} أدعية</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {activeDuaa.items.map(item => (
                      <DuaaCard key={item.id} item={item} color={activeDuaa.color} />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Hadith Library */}
        {activeTab === 'hadiths' && (
          <div>
            {/* Search + filter */}
            <div className="glass-card" style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 14 }}>
                <div style={{ flex: 1, position: 'relative' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }}>
                    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  <input
                    className="input"
                    placeholder="ابحث في الأحاديث..."
                    value={hadithSearch}
                    onChange={e => setHadithSearch(e.target.value)}
                    dir="rtl"
                    style={{ width: '100%', boxSizing: 'border-box', paddingLeft: 36, fontFamily: 'var(--font-arabic)' }}
                  />
                </div>
                <span style={{ fontSize: 12, color: 'var(--color-text-muted)', flexShrink: 0 }}>
                  {filteredHadiths.length} حديث
                </span>
              </div>
              {/* Category filter pills */}
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {HADITH_CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setHadithCategory(cat)}
                    style={{
                      padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                      fontFamily: 'var(--font-arabic)',
                      background: hadithCategory === cat ? EM_BG : 'transparent',
                      color: hadithCategory === cat ? EM : 'var(--color-text-muted)',
                      border: `1px solid ${hadithCategory === cat ? EM_BD : 'var(--color-border)'}`,
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {filteredHadiths.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--color-text-muted)' }}>
                لا توجد أحاديث مطابقة
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {filteredHadiths.map(h => <HadithCard key={h.id} hadith={h} />)}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
