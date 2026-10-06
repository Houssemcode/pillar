import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import Modal from '../ui/Modal'
import Input from '../ui/Input'
import Button from '../ui/Button'

export default function FocusSettingsModal({ isOpen, onClose, prefs, onSave }) {
  const { t } = useTranslation()
  const [pomodoro, setPomodoro] = useState(prefs?.pomodoro ?? 25)
  const [shortBreak, setShortBreak] = useState(prefs?.short_break ?? 5)
  const [longBreak, setLongBreak] = useState(prefs?.long_break ?? 15)

  useEffect(() => {
    if (isOpen && prefs) {
      setPomodoro(prefs.pomodoro ?? 25)
      setShortBreak(prefs.short_break ?? 5)
      setLongBreak(prefs.long_break ?? 15)
    }
  }, [isOpen, prefs])

  const handleSubmit = (e) => {
    e?.preventDefault()
    const p = Math.max(1, Math.min(180, Number(pomodoro) || 25))
    const s = Math.max(1, Math.min(60, Number(shortBreak) || 5))
    const l = Math.max(1, Math.min(90, Number(longBreak) || 15))

    onSave({
      pomodoro: p,
      short_break: s,
      long_break: l,
    })
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="focus-settings-modal">
      <Modal.Header title={t('focus.settings')} />
      <form onSubmit={handleSubmit}>
        <Modal.Body style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div>
            <label className="section-label" style={{ marginBottom: 6, display: 'block' }}>
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

          <div>
            <label className="section-label" style={{ marginBottom: 6, display: 'block' }}>
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
            <label className="section-label" style={{ marginBottom: 6, display: 'block' }}>
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
