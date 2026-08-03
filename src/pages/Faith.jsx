import { useState, useEffect, useRef } from 'react'
import ProgressRing from '../components/ui/ProgressRing'

/* ─── Theme ────────────────────────────────────────────────── */
const EM = '#10B981'          // emerald
const EM_BG = '#10B98114'
const EM_BD = '#10B98140'

/* ─── Prayer data ──────────────────────────────────────────── */
const INITIAL_PRAYERS = [
  { key: 'fajr', ar: 'الفجر', en: 'Fajr', time: '05:12', fard: 2, sunnah: 2 },
  { key: 'dhuhr', ar: 'الظهر', en: 'Dhuhr', time: '12:47', fard: 4, sunnah: 4 },
  { key: 'asr', ar: 'العصر', en: 'Asr', time: '16:20', fard: 4, sunnah: 0 },
  { key: 'maghrib', ar: 'المغرب', en: 'Maghrib', time: '20:04', fard: 3, sunnah: 2 },
  { key: 'isha', ar: 'العشاء', en: 'Isha', time: '21:38', fard: 4, sunnah: 2 },
]

function timeToMins(t) { const [h, m] = t.split(':').map(Number); return h * 60 + m }



/* ─── Morning/Evening Adhkar ───────────────────────────────── */
const MORNING_ADHKAR = [
  { id: 'm1', text: 'أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ', count: 1 },
  { id: 'm2', text: 'سُبْحَانَ اللهِ وَبِحَمْدِهِ', count: 100 },
  { id: 'm3', text: 'أَعُوذُ بِاللهِ مِنَ الشَّيْطَانِ الرَّجِيمِ', count: 3 },
  { id: 'm4', text: 'بِسْمِ اللهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ', count: 3 },
]

const EVENING_ADHKAR = [
  { id: 'e1', text: 'أَمْسَيْنَا وَأَمْسَى الْمُلْكُ لِلَّهِ', count: 1 },
  { id: 'e2', text: 'سُبْحَانَ اللهِ وَبِحَمْدِهِ', count: 100 },
  { id: 'e3', text: 'اللَّهُمَّ بِكَ أَمْسَيْنَا وَبِكَ أَصْبَحْنَا', count: 1 },
]

/* ─── Hadiths ──────────────────────────────────────────────── */
const HADITHS = [
  { text: 'إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ، وَإِنَّمَا لِكُلِّ امْرِئٍ مَا نَوَى', source: 'متفق عليه' },
  { text: 'الطَّهُورُ شَطْرُ الإِيمَانِ', source: 'صحيح مسلم' },
  { text: 'خَيْرُ النَّاسِ أَنْفَعُهُمْ لِلنَّاسِ', source: 'المعجم الأوسط' },
  { text: 'مَنْ كَانَ يُؤْمِنُ بِاللَّهِ وَالْيَوْمِ الآخِرِ فَلْيَقُلْ خَيْرًا أَوْ لِيَصْمُتْ', source: 'متفق عليه' },
  { text: 'الْمُؤْمِنُ الْقَوِيُّ خَيْرٌ وَأَحَبُّ إِلَى اللَّهِ مِنَ الْمُؤْمِنِ الضَّعِيفِ', source: 'صحيح مسلم' },
  { text: 'لَا يُؤْمِنُ أَحَدُكُمْ حَتَّى يُحِبَّ لِأَخِيهِ مَا يُحِبُّ لِنَفْسِهِ', source: 'متفق عليه' },
  { text: 'مَنْ سَلَكَ طَرِيقًا يَلْتَمِسُ فِيهِ عِلْمًا سَهَّلَ اللَّهُ لَهُ طَرِيقًا إِلَى الْجَنَّةِ', source: 'صحيح مسلم' },
]

/* ─── Good Deeds ───────────────────────────────────────────── */
const GOOD_DEEDS_LIST = [
  { id: 'fast', ar: 'صيام', en: 'Fasting', emoji: '🌙' },
  { id: 'sadaqa', ar: 'صدقة', en: 'Sadaqah', emoji: '💰' },
  { id: 'quran', ar: 'قراءة القرآن', en: 'Read Quran', emoji: '📖' },
  { id: 'qiyam', ar: 'قيام الليل', en: 'Night Prayer', emoji: '🌟' },
  { id: 'sick', ar: 'عيادة مريض', en: 'Visit Sick', emoji: '🤲' },
  { id: 'help', ar: 'مساعدة غيره', en: 'Help Others', emoji: '🫂' },
  { id: 'duaa', ar: 'دعاء', en: 'Make Duaa', emoji: '🙏' },
  { id: 'silah', ar: 'صلة الرحم', en: 'Family Ties', emoji: '❤️' },
]

/* ─── Helper: day-of-year for hadith rotation ─────────────── */
function dayOfYear() {
  const now = new Date()
  const start = new Date(now.getFullYear(), 0, 0)
  return Math.floor((now - start) / 86400000)
}

/* ═══════════════════════════════════════════════════
   SUB-COMPONENTS
   ═══════════════════════════════════════════════════ */

/* Prayer schedule banner & dropdown card */
function PrayerScheduleCard({ prayers, now, onToggleFard }) {
  const [isOpen, setIsOpen] = useState(true) // Open by default
  const mins = now.getHours() * 60 + now.getMinutes()
  const next = prayers.find(p => !p.fardDone && timeToMins(p.time) > mins) || null

  let countdown = '—'
  if (next) {
    const diff = timeToMins(next.time) - mins
    const h = Math.floor(diff / 60), m = diff % 60
    countdown = h > 0 ? `${h}h ${m}m` : `${m}m`
  }

  return (
    <div className="card" style={{ padding: 0, marginBottom: 20 }}>
      {/* Banner Top */}
      <div className="faith-next-banner" style={{ borderRadius: 0, border: 'none' }}>
        <div style={{ flex: 1 }}>
          {next ? (
            <>
              <div className="faith-next-label">الصلاة القادمة</div>
              <div className="faith-next-name">
                <span style={{ fontFamily: 'var(--font-arabic)', fontSize: 22, fontWeight: 700 }}>{next.ar}</span>
                <span style={{ fontSize: 14, opacity: 0.7, marginRight: 8 }}>{next.en}</span>
              </div>
              <div className="faith-next-time">
                {next.time}
                <span style={{ color: EM, fontWeight: 700, marginRight: 6 }}> · بعد {countdown}</span>
              </div>
            </>
          ) : (
            <div className="faith-next-complete">
              <span style={{ fontSize: 22 }}>🌙</span>
              <span>أكملت جميع الصلوات اليوم</span>
            </div>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button
            onClick={() => setIsOpen(!isOpen)}
            style={{
              background: EM, color: '#ffffff', border: 'none',
              borderRadius: 8, padding: '8px 14px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 700,
              boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)',
              transition: 'all 150ms'
            }}
          >
            <span>{isOpen ? 'إخفاء جدول الصلوات' : 'عرض جدول الصلوات'}</span>
            <svg
              width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
              style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 200ms' }}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
        </div>
      </div>

      {/* Dropdown Content */}
      {isOpen && (
        <div style={{ padding: '16px 20px', borderTop: '1px solid var(--color-border)', background: 'var(--color-surface-1)' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-muted)', marginBottom: 12, display: 'flex', justifyContent: 'space-between' }}>
            <span>مواقيت صلوات اليوم</span>
            <span>انقر للتعليم كتمت</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {prayers.map(p => {
              const pMins = timeToMins(p.time)
              const isNext = !p.fardDone && pMins > mins && next?.key === p.key
              return (
                <div
                  key={p.key}
                  onClick={() => onToggleFard(p.key)}
                  style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '12px 16px', borderRadius: 10, cursor: 'pointer',
                    background: p.fardDone ? 'transparent' : isNext ? 'rgba(16, 185, 129, 0.08)' : 'var(--color-surface-2)',
                    border: `1px solid ${p.fardDone ? 'var(--color-border)' : isNext ? EM : 'transparent'}`,
                    transition: 'all 150ms'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      width: 20, height: 20, borderRadius: '50%',
                      background: p.fardDone ? EM : 'transparent',
                      border: `2px solid ${p.fardDone ? EM : 'var(--color-text-muted)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      {p.fardDone && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round"><polyline points="20,6 9,17 4,12" /></svg>}
                    </div>
                    <div>
                      <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text)', fontFamily: 'var(--font-arabic)' }}>صلاة {p.ar}</span>
                      <span style={{ fontSize: 13, color: 'var(--color-text-muted)', marginLeft: 8 }}>({p.en})</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: isNext ? EM : 'var(--color-text-muted)', fontVariantNumeric: 'tabular-nums' }}>{p.time}</span>
                    <div style={{ fontSize: 11, color: 'var(--color-text-muted)', background: 'var(--color-surface-3)', padding: '2px 8px', borderRadius: 6 }}>
                      {p.fard} فرض {p.sunnah > 0 ? `· ${p.sunnah} سنة` : ''}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}





/* Quran / Khatmah tracker — Page Based */
function KhatmahTracker({ currentPage, onUpdate }) {
  const TOTAL_PAGES = 604
  const pct = Math.round((currentPage / TOTAL_PAGES) * 100)
  const remaining = TOTAL_PAGES - currentPage

  return (
    <div className="card" style={{ padding: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(16, 185, 129, 0.15)', color: EM, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" /></svg>
          </div>
          <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text)' }}>Khatmah Tracker</span>
        </div>
        <button style={{ background: 'none', border: 'none', color: 'var(--color-text)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Update</button>
      </div>

      {/* Progress Section */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 24 }}>
        <ProgressRing radius={36} strokeWidth={6} progress={pct} size={72} color={EM} trackColor="var(--color-surface-3)">
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text)', lineHeight: 1 }}>{pct}%</div>
          </div>
        </ProgressRing>
        <div>
          <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 2 }}>Current position</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text)', marginBottom: 2 }}>
            Page {currentPage} <span style={{ color: 'var(--color-text-muted)', fontWeight: 500, fontSize: 14 }}>· Al-Fatihah</span>
          </div>
          <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{remaining} pages remaining</div>
        </div>
      </div>

      {/* Target button */}
      <div style={{ padding: '14px 16px', borderRadius: 10, background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.2)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={EM} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></svg>
        <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-text)' }}>Read 2 pages today</span>
      </div>

      {/* Log button */}
      <button
        onClick={() => onUpdate(Math.min(TOTAL_PAGES, currentPage + 2))}
        style={{ width: '100%', padding: '14px 16px', borderRadius: 10, background: 'transparent', border: '1px solid var(--color-border)', color: 'var(--color-text)', fontSize: 14, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, transition: 'background 150ms' }}
        onMouseEnter={e => e.currentTarget.style.background = 'var(--color-surface-3)'}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" /></svg>
        Log 2 pages read today
      </button>
    </div>
  )
}

/* Morning/Evening Adhkar section */
function AdhkarSection({ list, done, onToggle, title, icon }) {
  const doneCount = list.filter(a => done.has(a.id)).length
  return (
    <div className="card">
      <div className="faith-section-header" style={{ marginBottom: 10 }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)' }}>{icon} {title}</span>
        <span style={{ fontSize: 11, color: EM }}>{doneCount}/{list.length}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {list.map(item => {
          const checked = done.has(item.id)
          return (
            <button
              key={item.id}
              onClick={() => onToggle(item.id)}
              className={`faith-adhkar-item ${checked ? 'faith-adhkar-item--done' : ''}`}
            >
              <div className={`faith-adhkar-check ${checked ? 'faith-adhkar-check--done' : ''}`}>
                {checked && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round"><polyline points="20,6 9,17 4,12" /></svg>}
              </div>
              <span dir="rtl" style={{
                flex: 1, textAlign: 'right', fontSize: 13,
                fontFamily: 'var(--font-arabic)',
                color: checked ? 'var(--color-text-muted)' : 'var(--color-text)',
                textDecoration: checked ? 'line-through' : 'none',
              }}>
                {item.text}
              </span>
              {item.count > 1 && (
                <span style={{ fontSize: 10, color: 'var(--color-text-muted)', flexShrink: 0 }}>×{item.count}</span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

/* Hadith of the Day */
function HadithCard() {
  const hadith = HADITHS[dayOfYear() % HADITHS.length]
  return (
    <div className="faith-hadith-card">
      <div className="faith-section-header" style={{ marginBottom: 10 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: EM }}>
          حديث اليوم
        </div>
        <a href="#" style={{ fontSize: 11, color: EM, textDecoration: 'none', fontWeight: 600, letterSpacing: 'normal', textTransform: 'none' }}>مكتبة الأحاديث</a>
      </div>
      <blockquote dir="rtl" className="faith-hadith-text">
        « {hadith.text} »
      </blockquote>
      <div style={{ textAlign: 'right', fontSize: 11, color: 'var(--color-text-muted)', marginTop: 8, fontStyle: 'italic' }}>
        — {hadith.source}
      </div>
    </div>
  )
}

/* Today's Deeds unified list */
function TodayDeedsList({ prayers, toggleFard, goodDeeds, toggleDeed }) {
  const items = [
    // Deeds mapped from GOOD_DEEDS_LIST
    ...GOOD_DEEDS_LIST.map(d => {
      let color = '#3B82F6' // default blue
      let icon = <span style={{ fontSize: 16 }}>{d.emoji}</span>
      let desc = ''
      if (d.en === 'Sadaqah') {
        color = '#E11D48';
        icon = <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>
        desc = 'Charity extinguishes sin as water extinguishes fire — and it does not decrease wealth'
      } else if (d.en === 'Fasting') {
        color = '#10B981';
      }

      return {
        id: d.id,
        isDone: goodDeeds.has(d.id),
        onToggle: () => toggleDeed(d.id),
        ar: d.ar,
        en: d.en,
        desc,
        icon,
        color
      }
    })
  ]

  const doneCount = items.filter(i => i.isDone).length;

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ padding: '20px 20px 16px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid var(--color-border)' }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(245, 158, 11, 0.15)', color: '#F59E0B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
        </div>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text)' }}>Today's Deeds</div>
          <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 2 }}>{items.length} available · {doneCount} completed</div>
        </div>
      </div>

      {/* Scrollable list */}
      <div className="custom-scrollbar" style={{ maxHeight: 500, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {items.map(item => (
          <div
            key={item.id}
            style={{
              display: 'flex', flexDirection: 'column', gap: 12,
              padding: '16px', borderRadius: 12, border: `1px solid ${item.isDone ? 'var(--color-border)' : item.color + '40'}`,
              background: item.isDone ? 'transparent' : `${item.color}10`,
              transition: 'all 200ms',
              opacity: item.isDone ? 0.6 : 1
            }}
          >
            {/* Header row: clickable to toggle */}
            <div
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', cursor: 'pointer' }}
              onClick={item.onToggle}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ color: item.color, display: 'flex', alignItems: 'center' }}>{item.icon}</span>
                <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-text)' }}>{item.en}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 13, color: 'var(--color-text-muted)', fontFamily: 'var(--font-arabic)' }}>{item.ar}</span>
                <div style={{ width: 22, height: 22, borderRadius: '50%', border: `1.5px solid ${item.isDone ? 'var(--color-text-muted)' : item.color + '50'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {item.isDone && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="3" strokeLinecap="round"><polyline points="20,6 9,17 4,12" /></svg>}
                </div>
              </div>
            </div>

            {/* Description */}
            {item.desc && (
              <div style={{ fontSize: 13, color: 'var(--color-text-muted)', lineHeight: 1.4, width: '100%' }}>
                {item.desc}
              </div>
            )}


          </div>
        ))}
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════ */
export default function Faith() {
  const [now, setNow] = useState(new Date())
  const [prayers, setPrayers] = useState(
    INITIAL_PRAYERS.map(p => ({ ...p, fardDone: false, sunnahDone: 0 }))
  )

  const [khatmahPage, setKhatmahPage] = useState(228)
  const [morningDone, setMorningDone] = useState(new Set())
  const [eveningDone, setEveningDone] = useState(new Set())
  const [goodDeeds, setGoodDeeds] = useState(new Set())
  const [adhkarTab, setAdhkarTab] = useState('morning') // 'morning' | 'evening'

  // Live clock
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  /* ── Prayer handlers ── */
  const toggleFard = key => setPrayers(p => p.map(pr => pr.key === key ? { ...pr, fardDone: !pr.fardDone } : pr))
  const toggleSunnah = (key, idx) =>
    setPrayers(p => p.map(pr => {
      if (pr.key !== key) return pr
      const current = pr.sunnahDone ?? 0
      return { ...pr, sunnahDone: current > idx ? idx : idx + 1 }
    }))




  /* ── Adhkar handler ── */
  const toggleMorning = id => setMorningDone(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s })
  const toggleEvening = id => setEveningDone(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s })

  /* ── Good deeds ── */
  const toggleDeed = id => setGoodDeeds(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s })

  /* ── Stats ── */
  const donePrayers = prayers.filter(p => p.fardDone).length
  const prayerPct = Math.round((donePrayers / prayers.length) * 100)


  return (
    <div className="page faith-page">

      {/* ── Header ── */}
      <div className="tasks-header" style={{ flexShrink: 0 }}>
        <div>
          <h1 className="page-title">Faith · الإيمان</h1>
          <div className="page-subtitle">مواقيت الصلاة · الأذكار · تتبع الختمة</div>
        </div>
      </div>

      {/* ── Prayer schedule banner & dropdown card ── */}
      <PrayerScheduleCard prayers={prayers} now={now} onToggleFard={toggleFard} />

      {/* ── Main two-column layout ── */}
      <div className="faith-layout">

        {/* ═══ LEFT 60% ═══ */}
        <div className="faith-left">

          {/* Khatmah tracker */}
          <KhatmahTracker currentPage={khatmahPage} onUpdate={setKhatmahPage} />

          {/* Adhkar tabs */}
          <div className="card" style={{ padding: '16px 18px' }}>
            <div className="faith-section-header" style={{ marginBottom: 12 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)' }}>الأذكار</span>
              <a href="#" style={{ fontSize: 11, color: EM, textDecoration: 'none', fontWeight: 600 }}>أذكار وأدعية</a>
            </div>
            {/* Tab switcher */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
              {[
                { key: 'morning', label: 'أذكار الصباح', icon: '🌅' },
                { key: 'evening', label: 'أذكار المساء', icon: '🌆' },
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setAdhkarTab(tab.key)}
                  style={{
                    flex: 1, padding: '7px 10px', borderRadius: 10, fontSize: 12, fontWeight: 600,
                    cursor: 'pointer', fontFamily: 'var(--font-arabic)',
                    background: adhkarTab === tab.key ? EM_BG : 'transparent',
                    color: adhkarTab === tab.key ? EM : 'var(--color-text-muted)',
                    border: `1px solid ${adhkarTab === tab.key ? EM_BD : 'var(--color-border)'}`,
                    transition: 'all 150ms',
                  }}
                >
                  {tab.icon} {tab.label}
                </button>
              ))}
            </div>

            {adhkarTab === 'morning' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {MORNING_ADHKAR.map(item => {
                  const checked = morningDone.has(item.id)
                  return (
                    <button key={item.id} onClick={() => toggleMorning(item.id)} className={`faith-adhkar-item ${checked ? 'faith-adhkar-item--done' : ''}`}>
                      <div className={`faith-adhkar-check ${checked ? 'faith-adhkar-check--done' : ''}`}>
                        {checked && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round"><polyline points="20,6 9,17 4,12" /></svg>}
                      </div>
                      <span dir="rtl" style={{ flex: 1, textAlign: 'right', fontSize: 12, fontFamily: 'var(--font-arabic)', color: checked ? 'var(--color-text-muted)' : 'var(--color-text)', textDecoration: checked ? 'line-through' : 'none' }}>{item.text}</span>
                      {item.count > 1 && <span style={{ fontSize: 10, color: 'var(--color-text-muted)', flexShrink: 0 }}>×{item.count}</span>}
                    </button>
                  )
                })}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {EVENING_ADHKAR.map(item => {
                  const checked = eveningDone.has(item.id)
                  return (
                    <button key={item.id} onClick={() => toggleEvening(item.id)} className={`faith-adhkar-item ${checked ? 'faith-adhkar-item--done' : ''}`}>
                      <div className={`faith-adhkar-check ${checked ? 'faith-adhkar-check--done' : ''}`}>
                        {checked && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round"><polyline points="20,6 9,17 4,12" /></svg>}
                      </div>
                      <span dir="rtl" style={{ flex: 1, textAlign: 'right', fontSize: 12, fontFamily: 'var(--font-arabic)', color: checked ? 'var(--color-text-muted)' : 'var(--color-text)', textDecoration: checked ? 'line-through' : 'none' }}>{item.text}</span>
                      {item.count > 1 && <span style={{ fontSize: 10, color: 'var(--color-text-muted)', flexShrink: 0 }}>×{item.count}</span>}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Hadith of the day */}
          <HadithCard />

        </div>

        {/* ═══ RIGHT 40% ═══ */}
        <div className="faith-right">
          {/* Today's Deeds */}
          <TodayDeedsList prayers={prayers} toggleFard={toggleFard} goodDeeds={goodDeeds} toggleDeed={toggleDeed} />
        </div>
      </div>
    </div>
  )
}
