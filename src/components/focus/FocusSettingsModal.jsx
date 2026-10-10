import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import Modal from '../ui/Modal'
import Input from '../ui/Input'
import Button from '../ui/Button'
import {
  loadWledPrefs,
  saveWledPrefs,
  testWledConnection,
  DEFAULT_COLORS,
} from '../../hooks/useWled'

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

/* ─── Phase Color Customizer Component ─────────────────────── */
function PhaseColorPicker({ label, icon, value, onChange, presets = [] }) {
  return (
    <div className="p-3 rounded-xl bg-white dark:bg-zinc-800/60 border border-gray-200/80 dark:border-zinc-700/80 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-800 dark:text-gray-200">
          <span>{icon}</span>
          <span>{label}</span>
        </div>

        {/* Color picker button with live swatch */}
        <label className="relative cursor-pointer flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-gray-300 dark:border-zinc-600 bg-gray-50 dark:bg-zinc-900 hover:opacity-90 transition-opacity">
          <span
            className="w-4 h-4 rounded-full border border-black/15 dark:border-white/20 shadow-xs shrink-0"
            style={{ backgroundColor: value }}
          />
          <span className="text-[11px] font-mono uppercase text-gray-700 dark:text-gray-300">
            {value}
          </span>
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
          />
        </label>
      </div>

      {/* Preset pills */}
      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
        {presets.map((preset) => {
          const isSelected = value?.toLowerCase() === preset.hex.toLowerCase()
          return (
            <button
              key={preset.hex}
              type="button"
              onClick={() => onChange(preset.hex)}
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] transition-all ${
                isSelected
                  ? 'ring-2 ring-emerald-500 bg-gray-100 dark:bg-zinc-700 text-gray-900 dark:text-white font-bold'
                  : 'bg-gray-100/80 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-600 dark:text-gray-400'
              }`}
            >
              <span
                className="w-2 h-2 rounded-full border border-black/10 shadow-xs shrink-0"
                style={{ backgroundColor: preset.hex }}
              />
              <span>{preset.name}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

/* ─── WLED Test Connection Button ──────────────────────────── */
function WledTestButton({ ip, ledCount, brightness, options }) {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null) // null | { ok: true } | { ok: false, error: string }

  const handleTest = async () => {
    setLoading(true)
    setResult(null)
    const res = await testWledConnection(ip, ledCount, brightness, options)
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
              <span>اختبار الإضاءة والمزامنة</span>
            </>
          )}
        </button>

        {result && result.ok && (
          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
            <span>✓</span> متصل بنجاح (أضاء الشريط بلون العمل المحدد)
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

/* ─── Color Presets Collections ────────────────────────────── */
const WORK_PRESETS = [
  { name: 'أبيض دافئ 2700K', hex: '#FFBE78' },
  { name: 'شمعي كهرماني', hex: '#FFAA44' },
  { name: 'أبيض طبيعي 3500K', hex: '#FFF0DC' },
  { name: 'أبيض ناصع 6000K', hex: '#FFFFFF' },
  { name: 'برتقالي هادئ', hex: '#FF7043' },
  { name: 'أرجواني خافت', hex: '#AF52DE' },
]

const SHORT_BREAK_PRESETS = [
  { name: 'أخضر زمردي', hex: '#00FF3C' },
  { name: 'نعناعي منعش', hex: '#30D158' },
  { name: 'فيروزي فاتح', hex: '#00D2D3' },
  { name: 'أصفر مهدئ', hex: '#FFD60A' },
  { name: 'ليموني', hex: '#A8E6CF' },
]

const LONG_BREAK_PRESETS = [
  { name: 'أزرق كهربائي', hex: '#0078FF' },
  { name: 'أزرق محيطي', hex: '#0984E3' },
  { name: 'نيلي عميق', hex: '#5F27CD' },
  { name: 'بنفسجي ملكي', hex: '#9B59B6' },
  { name: 'وردي لطيف', hex: '#FF375F' },
]

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

  const patchColor = (phase, colorHex) => {
    setWled((prev) => ({
      ...prev,
      colors: {
        ...(prev.colors || DEFAULT_COLORS),
        [phase]: colorHex,
      },
    }))
  }

  const resetColorsToDefault = () => {
    setWled((prev) => ({
      ...prev,
      colors: { ...DEFAULT_COLORS },
    }))
  }

  const currentColors = {
    work: wled.colors?.work || DEFAULT_COLORS.work,
    shortBreak: wled.colors?.shortBreak || DEFAULT_COLORS.shortBreak,
    longBreak: wled.colors?.longBreak || DEFAULT_COLORS.longBreak,
  }

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
      segmentId: Math.max(0, Math.min(15, Number(wled.segmentId) || 0)),
      hyperionSync: wled.hyperionSync !== false,
      hyperionIp: (wled.hyperionIp || '').trim(),
      colors: currentColors,
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
                    مزامنة مؤقت بومودورو مع شريط الـ RGB وتوافقه مع Hyperion
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
                      الافتراضي: 128 (سطوع دافئ ومريح).
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

                {/* ── Section 3: Phase Color Customization ── */}
                <div className="pt-2 border-t border-gray-200/60 dark:border-zinc-800/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="text-base">🎨</span>
                      <span className="text-xs font-bold text-gray-900 dark:text-white">
                        تخصيص ألوان المراحل (Phase Colors)
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={resetColorsToDefault}
                      className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline font-medium"
                    >
                      استعادة الافتراضي
                    </button>
                  </div>

                  <p className="text-[11px] text-gray-500 dark:text-gray-400">
                    انقر على المربع لاختيار أي لون تريده من لوحة الألوان، أو اختر من الألوان الجاهزة:
                  </p>

                  <div className="space-y-2">
                    {/* Work Color */}
                    <PhaseColorPicker
                      label="جلسة العمل (Work Session)"
                      icon="🕯️"
                      value={currentColors.work}
                      onChange={(hex) => patchColor('work', hex)}
                      presets={WORK_PRESETS}
                    />

                    {/* Short Break Color */}
                    <PhaseColorPicker
                      label="استراحة قصيرة (Short Break)"
                      icon="🟢"
                      value={currentColors.shortBreak}
                      onChange={(hex) => patchColor('shortBreak', hex)}
                      presets={SHORT_BREAK_PRESETS}
                    />

                    {/* Long Break Color */}
                    <PhaseColorPicker
                      label="استراحة طويلة (Long Break)"
                      icon="🔵"
                      value={currentColors.longBreak}
                      onChange={(hex) => patchColor('longBreak', hex)}
                      presets={LONG_BREAK_PRESETS}
                    />
                  </div>
                </div>

                {/* ── Section 4: Hyperion Ambilight Synchronization ── */}
                <div className="pt-3 border-t border-gray-200/60 dark:border-zinc-800/80 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-base">🌈</span>
                    <span className="text-xs font-bold text-gray-900 dark:text-white">
                      تكامل وتزامن مع برنامج Hyperion (Ambilight)
                    </span>
                  </div>

                  <ToggleSwitch
                    checked={wled.hyperionSync !== false}
                    onChange={(val) => patchWled({ hyperionSync: val })}
                    label="التزامن الذكي مع Hyperion"
                    description="يسمح لـ Hyperion بالعمل على نفس شريط الإضاءة: يعرض المؤقت أثناء العمل، ويستأنف Hyperion فوراً عند الإيقاف المؤقت أو اكتمال الجلسة."
                  />

                  {wled.hyperionSync !== false && (
                    <div className="p-3 rounded-xl bg-white dark:bg-zinc-800/70 border border-gray-200/80 dark:border-zinc-700/80 space-y-3 text-xs">
                      <div className="text-[11px] text-gray-600 dark:text-gray-300 leading-relaxed">
                        ✨ <strong>آلية التزامن التلقائي (Live Hand-off):</strong>
                        <ul className="list-disc list-inside mt-1 space-y-1 text-gray-500 dark:text-gray-400">
                          <li><strong>أثناء تشغيل المؤقت:</strong> يتوقف بث Hyperion مؤقتاً لعرض المؤقت بلون العمل المخصص.</li>
                          <li><strong>عند الإيقاف المؤقت أو انتهاء الجلسة:</strong> يستأنف Hyperion فوراً إضاءته التفاعلية على الشريط دون إطفاء.</li>
                        </ul>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        <div>
                          <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">
                            رقم المقطع (WLED Segment ID)
                          </label>
                          <Input
                            type="number"
                            min="0"
                            max="15"
                            value={wled.segmentId ?? 0}
                            onChange={(e) => patchWled({ segmentId: e.target.value })}
                          />
                          <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">
                            الافتراضي 0 (الشريط كاملاً)، أو رقم مقطع مخصص إذا قسمت الشريط في WLED.
                          </p>
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">
                            عنوان Hyperion (اختياري)
                          </label>
                          <Input
                            placeholder="مثال: 192.168.1.50:8090"
                            value={wled.hyperionIp || ''}
                            onChange={(e) => patchWled({ hyperionIp: e.target.value })}
                          />
                          <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">
                            للتحكم المباشر الإضافي عبر Hyperion API.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Test Connection Button */}
                <WledTestButton
                  ip={wled.ip}
                  ledCount={wled.ledCount}
                  brightness={wled.brightness}
                  options={{
                    segmentId: wled.segmentId,
                    hyperionSync: wled.hyperionSync,
                    hyperionIp: wled.hyperionIp,
                    colors: currentColors,
                  }}
                />

                {/* Guidance & CORS Note */}
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
