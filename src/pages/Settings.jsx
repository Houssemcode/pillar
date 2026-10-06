import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useUser, ACCENT_COLORS } from '../context/UserContext'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import settingsService from '../api/settingsService'
import './Settings.css'

const PRAYER_CALC_METHODS = [
  { id: 'MWL', name: 'Muslim World League (MWL)' },
  { id: 'Makkah', name: 'Umm al-Qura University, Makkah' },
  { id: 'Egypt', name: 'Egyptian General Authority of Survey' },
  { id: 'ISNA', name: 'Islamic Society of North America (ISNA)' },
  { id: 'Karachi', name: 'University of Islamic Sciences, Karachi' },
]

const POPULAR_LOCATIONS = [
  { city: 'Tunis', country: 'Tunisia' },
  { city: 'Cairo', country: 'Egypt' },
  { city: 'Riyadh', country: 'Saudi Arabia' },
  { city: 'Dubai', country: 'United Arab Emirates' },
  { city: 'Algiers', country: 'Algeria' },
  { city: 'Casablanca', country: 'Morocco' },
  { city: 'London', country: 'United Kingdom' },
  { city: 'Paris', country: 'France' },
  { city: 'Istanbul', country: 'Turkey' },
]

export default function Settings() {
  const { t, i18n } = useTranslation()
  const { user } = useAuth()
  const {
    colorTheme, setColorTheme,
    accentColor, setAccentColor,
    preferences, updatePreferences,
  } = useUser()
  const { showToast } = useToast()

  const [activeTab, setActiveTab] = useState('account') // 'account' | 'appearance' | 'faith'
  const [, setLoading] = useState(true)
  const [savingLocation, setSavingLocation] = useState(false)

  // Local settings state
  const [formData, setFormData] = useState({
    username: user?.username || '',
    email: user?.email || '',
    language: i18n.language?.startsWith('ar') ? 'ar' : 'en',
    theme: colorTheme || 'dark',
    city: 'Tunis',
    country: 'Tunisia',
    calculation_method: 'MWL',
  })

  // Hydrate settings from backend
  useEffect(() => {
    let isMounted = true
    async function fetchUserSettings() {
      try {
        setLoading(true)
        const data = await settingsService.getSettings()
        if (isMounted && data) {
          setFormData({
            username: data.username || user?.username || '',
            email: data.email || user?.email || '',
            language: data.language || (i18n.language?.startsWith('ar') ? 'ar' : 'en'),
            theme: data.theme || colorTheme || 'dark',
            city: data.city || preferences?.prayerCity || 'Tunis',
            country: data.country || preferences?.prayerCountry || 'Tunisia',
            calculation_method: data.calculation_method || preferences?.prayerMethod || 'MWL',
          })
        }
      } catch (err) {
        console.warn('[Settings] Failed to fetch server settings, using local fallback:', err)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    fetchUserSettings()
    return () => { isMounted = false }
  }, [user, colorTheme, preferences, i18n.language])

  // Handle Language Change
  const handleLanguageChange = useCallback(async (lang) => {
    try {
      setFormData(prev => ({ ...prev, language: lang }))
      await i18n.changeLanguage(lang)
      updatePreferences({ language: lang })
      await settingsService.updateSettings({ language: lang })
      showToast(t('settings.savedSuccess'), 'success')
    } catch (err) {
      console.error('[Settings] Error changing language:', err)
      showToast(t('common.error'), 'error')
    }
  }, [i18n, updatePreferences, showToast, t])

  // Handle Theme Mode Change
  const handleThemeChange = useCallback(async (newTheme) => {
    try {
      setFormData(prev => ({ ...prev, theme: newTheme }))
      setColorTheme(newTheme)
      document.documentElement.setAttribute('data-theme', newTheme)
      if (newTheme === 'dark') {
        document.documentElement.classList.add('dark')
        document.body.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
        document.body.classList.remove('dark')
      }
      updatePreferences({ theme: newTheme, colorTheme: newTheme })
      await settingsService.updateSettings({ theme: newTheme })
      showToast(t('settings.savedSuccess'), 'success')
    } catch (err) {
      console.error('[Settings] Error changing theme:', err)
      showToast(t('common.error'), 'error')
    }
  }, [setColorTheme, updatePreferences, showToast, t])

  // Handle Location & Faith Settings Save
  const handleSaveLocation = async (e) => {
    e?.preventDefault()
    if (!formData.city.trim() || !formData.country.trim()) {
      showToast(t('common.error'), 'error')
      return
    }

    try {
      setSavingLocation(true)
      const patch = {
        city: formData.city.trim(),
        country: formData.country.trim(),
        calculation_method: formData.calculation_method,
      }
      await settingsService.updateSettings(patch)
      updatePreferences({
        prayerCity: patch.city,
        prayerCountry: patch.country,
        prayerMethod: patch.calculation_method,
      })
      showToast(t('settings.savedSuccess'), 'success')
    } catch (err) {
      console.error('[Settings] Error saving location:', err)
      showToast(t('common.error'), 'error')
    } finally {
      setSavingLocation(false)
    }
  }

  // Quick Location Selector
  const handleSelectQuickLocation = (loc) => {
    setFormData(prev => ({
      ...prev,
      city: loc.city,
      country: loc.country,
    }))
  }

  return (
    <div className="page settings-page max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full text-gray-900 dark:text-white">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
          {t('settings.title')}
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {t('settings.subtitle')}
        </p>
      </div>

      {/* 1. Refine Tabs/Navigation: Sleek pill toggle group */}
      <div className="flex gap-2 mb-8 bg-gray-100 dark:bg-zinc-900/50 p-1 rounded-xl w-fit overflow-x-auto hide-scrollbar border border-gray-200 dark:border-zinc-800/50">
        <button
          type="button"
          onClick={() => setActiveTab('account')}
          className={`cursor-pointer whitespace-nowrap ${
            activeTab === 'account'
              ? 'bg-white dark:bg-zinc-800 text-gray-900 dark:text-white shadow-sm px-4 py-2 rounded-lg font-medium'
              : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 px-4 py-2 rounded-lg transition-colors'
          }`}
        >
          {t('settings.account')}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('appearance')}
          className={`cursor-pointer whitespace-nowrap ${
            activeTab === 'appearance'
              ? 'bg-white dark:bg-zinc-800 text-gray-900 dark:text-white shadow-sm px-4 py-2 rounded-lg font-medium'
              : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 px-4 py-2 rounded-lg transition-colors'
          }`}
        >
          {t('settings.appearance')}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('faith')}
          className={`cursor-pointer whitespace-nowrap ${
            activeTab === 'faith'
              ? 'bg-white dark:bg-zinc-800 text-gray-900 dark:text-white shadow-sm px-4 py-2 rounded-lg font-medium'
              : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 px-4 py-2 rounded-lg transition-colors'
          }`}
        >
          {t('settings.faith')}
        </button>
      </div>

      {/* ════ TAB 1: GENERAL & ACCOUNT ════ */}
      {activeTab === 'account' && (
        <div className="bg-white dark:bg-[#121212] border border-gray-200 dark:border-zinc-800 rounded-2xl p-6 md:p-8 flex flex-col gap-6 shadow-sm">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {t('settings.account')}
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {t('settings.readOnlyAccountNotice')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">
                {t('settings.username')}
              </label>
              <input
                type="text"
                value={formData.username}
                readOnly
                disabled
                className="w-full bg-gray-50 dark:bg-zinc-900/50 border border-gray-300 dark:border-zinc-800 rounded-xl px-4 py-3 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-emerald-500 transition-all opacity-60 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">
                {t('settings.email')}
              </label>
              <input
                type="email"
                value={formData.email}
                readOnly
                disabled
                className="w-full bg-gray-50 dark:bg-zinc-900/50 border border-gray-300 dark:border-zinc-800 rounded-xl px-4 py-3 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-emerald-500 transition-all opacity-60 cursor-not-allowed"
              />
            </div>
          </div>

          <div className="border-t border-gray-200 dark:border-zinc-800/60 pt-6">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
              {t('settings.language')}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
              {t('settings.languageDesc')}
            </p>

            {/* 3. Fix the Language Selector: Elegant selectable dynamic cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* English */}
              <div
                role="button"
                tabIndex={0}
                onClick={() => handleLanguageChange('en')}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleLanguageChange('en') }}
                className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all ${
                  formData.language === 'en'
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-medium'
                    : 'border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900/50 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl select-none" role="img" aria-label="English">🇬🇧</span>
                  <div>
                    <div className="font-medium text-sm text-gray-900 dark:text-white">English</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Left-to-Right (LTR)</div>
                  </div>
                </div>
                {formData.language === 'en' && (
                  <span className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-bold">
                    ✓
                  </span>
                )}
              </div>

              {/* Arabic */}
              <div
                role="button"
                tabIndex={0}
                onClick={() => handleLanguageChange('ar')}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleLanguageChange('ar') }}
                className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all ${
                  formData.language === 'ar'
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-medium'
                    : 'border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900/50 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl select-none" role="img" aria-label="Arabic">🇸🇦</span>
                  <div>
                    <div className="font-medium text-sm text-gray-900 dark:text-white">العربية</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">من اليمين إلى اليسار (RTL)</div>
                  </div>
                </div>
                {formData.language === 'ar' && (
                  <span className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-bold">
                    ✓
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ════ TAB 2: APPEARANCE ════ */}
      {activeTab === 'appearance' && (
        <div className="bg-white dark:bg-[#121212] border border-gray-200 dark:border-zinc-800 rounded-2xl p-6 md:p-8 flex flex-col gap-6 shadow-sm">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {t('settings.theme')}
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {t('settings.themeDesc')}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Dark Mode */}
            <div
              role="button"
              tabIndex={0}
              onClick={() => handleThemeChange('dark')}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleThemeChange('dark') }}
              className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all ${
                formData.theme === 'dark'
                  ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-white font-medium'
                  : 'border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900/50 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-zinc-700'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 flex items-center justify-center text-indigo-400">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
                  </svg>
                </div>
                <div>
                  <div className="font-medium text-sm text-gray-900 dark:text-white">{t('settings.dark')}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Sleek dark interface</div>
                </div>
              </div>
              {formData.theme === 'dark' && (
                <span className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-bold">
                  ✓
                </span>
              )}
            </div>

            {/* Light Mode */}
            <div
              role="button"
              tabIndex={0}
              onClick={() => handleThemeChange('light')}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleThemeChange('light') }}
              className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all ${
                formData.theme === 'light'
                  ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-white font-medium'
                  : 'border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900/50 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-zinc-700'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 flex items-center justify-center text-amber-500">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="5" />
                    <line x1="12" y1="1" x2="12" y2="3" />
                    <line x1="12" y1="21" x2="12" y2="23" />
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                    <line x1="1" y1="12" x2="3" y2="12" />
                    <line x1="21" y1="12" x2="23" y2="12" />
                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                  </svg>
                </div>
                <div>
                  <div className="font-medium text-sm text-gray-900 dark:text-white">{t('settings.light')}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Clean light interface</div>
                </div>
              </div>
              {formData.theme === 'light' && (
                <span className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-bold">
                  ✓
                </span>
              )}
            </div>
          </div>

          <div className="border-t border-gray-200 dark:border-zinc-800/60 pt-6">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
              {t('common.accentColor')}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
              Personalize your primary focus color across modules
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {ACCENT_COLORS.map(c => {
                const isSelected = accentColor === c.key
                return (
                  <button
                    key={c.key}
                    type="button"
                    onClick={() => {
                      setAccentColor(c.key)
                      showToast(`${c.label} accent applied`, 'success')
                    }}
                    className={`flex items-center gap-3 px-4 py-2 rounded-lg border cursor-pointer transition-colors text-start ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-semibold'
                        : 'border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    <span
                      className="w-4 h-4 rounded-full shrink-0 shadow-sm"
                      style={{ backgroundColor: c.color }}
                    />
                    <span className="text-xs font-medium">{c.label}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* ════ TAB 3: FAITH / PRAYERS ════ */}
      {activeTab === 'faith' && (
        <div className="bg-white dark:bg-[#121212] border border-gray-200 dark:border-zinc-800 rounded-2xl p-6 md:p-8 flex flex-col gap-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 flex items-center justify-center font-bold text-lg">
              🕌
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {t('settings.prayerLocation')}
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {t('settings.prayerLocationDesc')}
              </p>
            </div>
          </div>

          <form onSubmit={handleSaveLocation} className="flex flex-col gap-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">
                  {t('settings.city')}
                </label>
                <input
                  type="text"
                  placeholder={t('settings.cityPlaceholder')}
                  value={formData.city}
                  onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                  required
                  className="w-full bg-gray-50 dark:bg-zinc-900/50 border border-gray-300 dark:border-zinc-800 rounded-xl px-4 py-3 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-emerald-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">
                  {t('settings.country')}
                </label>
                <input
                  type="text"
                  placeholder={t('settings.countryPlaceholder')}
                  value={formData.country}
                  onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
                  required
                  className="w-full bg-gray-50 dark:bg-zinc-900/50 border border-gray-300 dark:border-zinc-800 rounded-xl px-4 py-3 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-emerald-500 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">
                {t('settings.calcMethod')}
              </label>
              <select
                value={formData.calculation_method}
                onChange={(e) => setFormData(prev => ({ ...prev, calculation_method: e.target.value }))}
                className="w-full bg-gray-50 dark:bg-zinc-900/50 border border-gray-300 dark:border-zinc-800 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:ring-emerald-500 transition-all cursor-pointer"
              >
                {PRAYER_CALC_METHODS.map(m => (
                  <option key={m.id} value={m.id} className="bg-white dark:bg-zinc-900 text-gray-900 dark:text-white">
                    {m.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">
                Popular Locations:
              </div>
              <div className="flex flex-wrap gap-2">
                {POPULAR_LOCATIONS.map(loc => {
                  const isMatch = formData.city.toLowerCase() === loc.city.toLowerCase() &&
                                  formData.country.toLowerCase() === loc.country.toLowerCase()
                  return (
                    <button
                      key={`${loc.city}-${loc.country}`}
                      type="button"
                      onClick={() => handleSelectQuickLocation(loc)}
                      className={`px-4 py-2 rounded-lg border cursor-pointer transition-colors text-xs font-medium ${
                        isMatch
                          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                          : 'border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 hover:text-gray-900 dark:hover:text-white'
                      }`}
                    >
                      {loc.city}, {loc.country}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={savingLocation}
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white font-medium rounded-xl transition-colors w-full sm:w-auto inline-flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              >
                {savingLocation ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>{t('common.loading')}</span>
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span>{t('settings.saveChanges')}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
