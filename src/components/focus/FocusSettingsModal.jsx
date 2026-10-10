import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import Modal from '../ui/Modal'
import Input from '../ui/Input'
import Button from '../ui/Button'
import { loadWledPrefs, saveWledPrefs, testWledConnection } from '../../hooks/useWled'

/* ─── Inline Switch Component ──────────────────────────────── */
function ToggleSwitch({ checked, onChange, label, description }) {
  return (
    <label className="flex items-start justify-between gap-4 cursor-pointer select-none">
      <div className="flex flex-col">
        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{label}</span>
        {description && (
          <span className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{description}</span>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200 focus:outline-none ${
          checked ? 'bg-emerald-600' : 'bg-gray-300 dark:bg-zinc-700'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform duration-200 ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </label>
  )
}

/* ─── WLED Test Connection Button ──────────────────────────── */
function WledTestButton({ ip, ledCount, brightness }) {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null) // null | { ok: true } | { ok: false, error: string }

  const handleTest = async () => {
    setLoading(true)
    setResult(null)
    const res = await testWledConnection(ip, ledCount, brightness)
    setLoading(false)
    setResult(res)
  }

  return (
    <div className="flex flex-col gap-2 pt-1">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleTest}
          disabled={loading || !ip?.trim()}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-gray-800 dark:text-gray-200 border border-gray-300 dark:border-zinc-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <span className="w-3.5 h-3.5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              <span>جاري الفحص...</span>
            </>
          ) : (
            <>
              <span>⚡</span>
              <span>اختبار الاتصال بالـ ESP32</span>
            </>
          )}
        </button>

        {result && result.ok && (
          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
            <span>✓</span> متصل بنجاح (أضاء الشريط بالأخضر)
          </span>
        )}
      </div>

      {result && !result.ok && (
        <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-xs text-rose-700 dark:text-rose-300 leading-relaxed">
          <strong>فشل الاتصال:</strong> {result.error}
        </div>
      )}
    </div>
  )
}

/* ─── Main Modal Component ─────────────────────────────────── */
export default function FocusSettingsModal({ isOpen, onClose, prefs, onSave }) {
  const { t } = useTranslation()

  // Standard timer durations
  const [pomodoro, setPomodoro] = useState(prefs?.pomodoro ?? 25)
  const [shortBreak, setShortBreak] = useState(prefs?.short_break ?? 5)
  const [longBreak, setLongBreak] = useState(prefs?.long_break ?? 15)

  // WLED settings
  const [wled, setWled] = useState(loadWledPrefs)

  useEffect(() => {
    if (isOpen) {
      if (prefs) {
        setPomodoro(prefs.pomodoro ?? 25)
        setShortBreak(prefs.short_break ?? 5)
        setLongBreak(prefs.long_break ?? 15)
      }
      setWled(loadWledPrefs())
    }
  }, [isOpen, prefs])

  const patchWled = (patch) => setWled((prev) => ({ ...prev, ...patch }))

  const handleSubmit = (e) => {
    e?.preventDefault()
    const p = Math.max(1, Math.min(180, Number(pomodoro) || 25))
    const s = Math.max(1, Math.min(60, Number(shortBreak) || 5))
    const l = Math.max(1, Math.min(90, Number(longBreak) || 15))

    const cleanWled = {
      enabled: Boolean(wled.enabled),
      ip: (wled.ip || '').trim(),
      ledCount: Math.max(1, Math.min(2000, Number(wled.ledCount) || 86)),
      brightness: Math.max(5, Math.min(255, Number(wled.brightness) || 128)),
      mode: wled.mode === 'fill' ? 'fill' : 'countdown',
    }

    saveWledPrefs(cleanWled)

    onSave({
      pomodoro: p,
      short_break: s,
      long_break: l,
      wled: cleanWled,
    })
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="focus-settings-modal max-w-lg">
      <Modal.Header title={t('focus.settings')} />
      <form onSubmit={handleSubmit}>
        <Modal.Body className="space-y-6 max-h-[75vh] overflow-y-auto px-1">
          {/* ── Section 1: Timer Durations ── */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              مدد المؤقت (دقائق)
            </h4>

            <div>
              <label className="section-label mb-1.5 block text-xs font-semibold text-gray-700 dark:text-gray-300">
                {t('focus.pomodoroDuration')}
              </label>
              <Input
                type="number"
                min="1"
                max="180"
                value={pomodoro}
                onChange={(e) => setPomodoro(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="section-label mb-1.5 block text-xs font-semibold text-gray-700 dark:text-gray-300">
                  {t('focus.shortBreakDuration')}
                </label>
                <Input
                  type="number"
                  min="1"
                  max="60"
                  value={shortBreak}
                  onChange={(e) => setShortBreak(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="section-label mb-1.5 block text-xs font-semibold text-gray-700 dark:text-gray-300">
                  {t('focus.longBreakDuration')}
                </label>
                <Input
                  type="number"
                  min="1"
                  max="90"
                  value={longBreak}
                  onChange={(e) => setLongBreak(e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          {/* ── Section 2: WLED Smart Strip Integration ── */}
          <div className="border-t border-gray-200 dark:border-zinc-800 pt-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">💡</span>
                <div>
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                    شريط الإضاءة الذكي (WLED / ESP32)
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    مزامنة مؤقت بومودورو مع شريط الـ Addressable RGB كـ Progress Bar حقيقي
                  </p>
                </div>
              </div>
            </div>

            <ToggleSwitch
              checked={wled.enabled}
              onChange={(val) => patchWled({ enabled: val })}
              label="تفعيل مزامنة WLED"
              description="إرسال تقدم الجلسة لحظياً إلى شريط الإضاءة عبر الشبكة المحلية"
            />

            {wled.enabled && (
              <div className="p-4 rounded-2xl bg-gray-50 dark:bg-zinc-900/60 border border-gray-200 dark:border-zinc-800 space-y-4 text-right">
                {/* IP Address */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
                    عنوان IP الخاص بالـ ESP32 (WLED IP)
                  </label>
                  <Input
                    placeholder="مثال: 192.168.1.50"
                    value={wled.ip}
                    onChange={(e) => patchWled({ ip: e.target.value })}
                  />
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
                    يمكنك معرفة الـ IP من تطبيق WLED أو من إعدادات الراوتر.
                  </p>
                </div>

                {/* LED Count + Brightness */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
                      عدد المصابيح / اللمبات (LEDs)
                    </label>
                    <Input
                      type="number"
                      min="1"
                      max="2000"
                      value={wled.ledCount}
                      onChange={(e) => patchWled({ ledCount: e.target.value })}
                    />
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
                      مثال: 86 مصباح في شريطك.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
                      درجة السطوع (0 – 255)
                    </label>
                    <Input
                      type="number"
                      min="5"
                      max="255"
                      value={wled.brightness}
                      onChange={(e) => patchWled({ brightness: e.target.value })}
                    />
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
                      الافتراضي: 128 (سطوع مريح).
                    </p>
                  </div>
                </div>

                {/* Progress Direction Mode */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
                    نمط التقدم (Progress Mode)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => patchWled({ mode: 'countdown' })}
                      className={`p-2.5 rounded-xl text-xs font-medium border text-center transition-all ${
                        wled.mode !== 'fill'
                          ? 'bg-emerald-500/10 border-emerald-500 text-emerald-700 dark:text-emerald-300 font-bold'
                          : 'bg-white dark:bg-zinc-800 border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      <div className="font-semibold">تنازلي (موصى به)</div>
                      <div className="text-[10px] opacity-75 mt-0.5">مضاءة كلها وتنطفئ تدريجياً</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => patchWled({ mode: 'fill' })}
                      className={`p-2.5 rounded-xl text-xs font-medium border text-center transition-all ${
                        wled.mode === 'fill'
                          ? 'bg-emerald-500/10 border-emerald-500 text-emerald-700 dark:text-emerald-300 font-bold'
                          : 'bg-white dark:bg-zinc-800 border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      <div className="font-semibold">تصاعدي</div>
                      <div className="text-[10px] opacity-75 mt-0.5">تبدأ مطفأة وتضيء تدريجياً</div>
                    </button>
                  </div>
                </div>

                {/* Phase Colors Legend */}
                <div className="pt-2 border-t border-gray-200/60 dark:border-zinc-800/80">
                  <span className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 mb-2">
                    ألوان المراحل التلقائية:
                  </span>
                  <div className="flex flex-wrap items-center gap-3 text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full bg-[#FF5000] shadow-sm" />
                      <span className="text-gray-700 dark:text-gray-300">العمل (برتقالي دافئ)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full bg-[#00FF3C] shadow-sm" />
                      <span className="text-gray-700 dark:text-gray-300">استراحة قصيرة (أخضر)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full bg-[#0078FF] shadow-sm" />
                      <span className="text-gray-700 dark:text-gray-300">استراحة طويلة (أزرق)</span>
                    </div>
                  </div>
                </div>

                {/* Test Connection Button */}
                <WledTestButton
                  ip={wled.ip}
                  ledCount={wled.ledCount}
                  brightness={wled.brightness}
                />

                {/* CORS Note */}
                <div className="text-[11px] text-gray-500 dark:text-gray-400 leading-normal p-2.5 rounded-xl bg-emerald-500/5 border border-emerald-500/10 space-y-1.5">
                  <div>
                    💡 <strong>معدل التناقص:</strong> ينطفئ مصباح واحد كل <code>(مدة الجلسة ÷ عدد المصابيح)</code> ثانية (مثلاً: في جلسة 25 دقيقة مع 86 مصباح، ينطفئ مصباح كل ~17.5 ثانية).
                  </div>
                  <div>
                    🔒 <strong>تفعيل CORS في WLED:</strong>{' '}
                    <code className="px-1 py-0.5 rounded bg-gray-200 dark:bg-zinc-800 text-[10px]">
                      Settings → Security → Allow CORS: ✓
                    </code>
                  </div>
                  {typeof window !== 'undefined' && window.location.protocol === 'https:' && (
                    <div className="text-amber-600 dark:text-amber-400 font-medium pt-1 border-t border-amber-500/20">
                      ⚠️ <strong>تنبيه المتصفح (HTTPS):</strong> عند استخدام الموقع عبر Vercel (https)، قد يحجب المتصفح الاتصال بالشبكة المحلية (Mixed Content). للسماح به: اضغط على أيقونة القفل بجانب الرابط ← Site settings ← Insecure content: Allow.
                    </div>
                  )}
                </div>
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
