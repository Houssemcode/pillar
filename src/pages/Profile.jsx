import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useUser } from '../context/UserContext'
import { useToast } from '../context/ToastContext'
import { authApi } from '../api/auth'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import Input from '../components/ui/Input'
import Checkbox from '../components/ui/Checkbox'
/* ─── Avatar Presets ─────────────────────────────────────────── */
const AVATAR_PRESETS = [
  { id: 'avatar-1', label: 'Cosmic Violet', bg: 'linear-gradient(135deg, #6366F1, #8B5CF6, #D946EF)', emoji: '✨' },
  { id: 'avatar-2', label: 'Emerald Oasis', bg: 'linear-gradient(135deg, #059669, #10B981, #34D399)', emoji: '🌿' },
  { id: 'avatar-3', label: 'Ocean Tide',    bg: 'linear-gradient(135deg, #0284C7, #3B82F6, #60A5FA)', emoji: '🌊' },
  { id: 'avatar-4', label: 'Sunset Amber',  bg: 'linear-gradient(135deg, #D97706, #F59E0B, #FCD34D)', emoji: '🌅' },
  { id: 'avatar-5', label: 'Rose Quartz',   bg: 'linear-gradient(135deg, #E11D48, #F43F5E, #FB7185)', emoji: '⚡' },
  { id: 'avatar-6', label: 'Cyber Teal',    bg: 'linear-gradient(135deg, #0D9488, #14B8A6, #5EEAD4)', emoji: '💎' },
  { id: 'avatar-7', label: 'Dark Obsidian', bg: 'linear-gradient(135deg, #18181B, #27272A, #3F3F46)', emoji: '🌙' },
  { id: 'avatar-8', label: 'Pure Monogram', bg: 'linear-gradient(135deg, var(--color-primary), #8B5CF6)', emoji: '👤' },
]

export default function Profile() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()
  const {
    userName, setUserName,
    firstName, setFirstName,
    lastName, setLastName,
    headline, setHeadline,
    bio, setBio,
    avatar, setAvatar,
    gender, setGender,
    updateProfile,
    accentColor,
  } = useUser()
  const { showToast } = useToast()

  // ── Local Form State ──
  const [formData, setFormData] = useState({
    username: userName || user?.username || '',
    first_name: firstName || user?.first_name || '',
    last_name: lastName || user?.last_name || '',
    email: user?.email || '',
    headline: headline || user?.headline || '',
    bio: bio || user?.bio || '',
    gender: gender || user?.gender || 'male',
  })

  // ── Password Form State ──
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [passwordLoading, setPasswordLoading] = useState(false)

  // ── Stats State ──
  const [stats, setStats] = useState(null)
  const [statsLoading, setStatsLoading] = useState(true)

  // ── UI Modals & State ──
  const [savingProfile, setSavingProfile] = useState(false)
  const [showAvatarModal, setShowAvatarModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [deletePassword, setDeletePassword] = useState('')
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [exporting, setExporting] = useState(false)

  // Sync form data when user context hydrates
  useEffect(() => {
    setFormData({
      username: userName || user?.username || '',
      first_name: firstName || user?.first_name || '',
      last_name: lastName || user?.last_name || '',
      email: user?.email || '',
      headline: headline || user?.headline || '',
      bio: bio || user?.bio || '',
      gender: gender || user?.gender || 'male',
    })
  }, [userName, firstName, lastName, user, headline, bio, gender])

  // Load stats
  useEffect(() => {
    authApi.getProfileStats()
      .then(data => setStats(data))
      .catch(err => console.warn('Could not load profile stats:', err))
      .finally(() => setStatsLoading(false))
  }, [])

  // Derived identity
  const displayName = [formData.first_name, formData.last_name].filter(Boolean).join(' ') || formData.username || 'Pillar Member'
  const initials = displayName
    ? displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U'
  const currentAvatarPreset = AVATAR_PRESETS.find(p => p.id === avatar) || AVATAR_PRESETS[0]

  const joinedDate = user?.date_joined
    ? new Date(user.date_joined).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : 'Member since 2026'

  // Handle profile save
  const handleSaveProfile = async (e) => {
    e?.preventDefault()
    setSavingProfile(true)
    try {
      await updateProfile(formData)
      showToast('Profile updated successfully!', 'success')
    } catch (err) {
      const msg = err.response?.data?.username?.[0] || err.response?.data?.email?.[0] || err.message || 'Failed to update profile'
      showToast(msg, 'error')
    } finally {
      setSavingProfile(false)
    }
  }

  // Handle password update
  const handlePasswordChange = async (e) => {
    e.preventDefault()
    if (!passwordData.currentPassword || !passwordData.newPassword) {
      showToast('Please provide current and new password', 'error')
      return
    }
    if (passwordData.newPassword.length < 8) {
      showToast('New password must be at least 8 characters', 'error')
      return
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showToast('New passwords do not match', 'error')
      return
    }

    setPasswordLoading(true)
    try {
      await authApi.changePassword({
        current_password: passwordData.currentPassword,
        new_password: passwordData.newPassword,
        confirm_password: passwordData.confirmPassword,
      })
      showToast('Password changed successfully!', 'success')
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (err) {
      const msg = err.response?.data?.current_password?.[0] || err.response?.data?.new_password?.[0] || err.response?.data?.detail || 'Failed to update password'
      showToast(msg, 'error')
    } finally {
      setPasswordLoading(false)
    }
  }

  // Handle data export
  const handleExportData = async () => {
    setExporting(true)
    try {
      const data = await authApi.exportData()
      const jsonStr = JSON.stringify(data, null, 2)
      const blob = new Blob([jsonStr], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `pillar-backup-${formData.username || 'user'}-${new Date().toISOString().slice(0, 10)}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      showToast('Data exported successfully!', 'success')
    } catch (err) {
      showToast('Export failed: ' + (err.message || 'Server error'), 'error')
    } finally {
      setExporting(false)
    }
  }

  // Handle account deletion
  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== `delete-${formData.username}`) {
      showToast(`Please type delete-${formData.username} to confirm`, 'error')
      return
    }
    if (!deletePassword) {
      showToast('Please enter your password', 'error')
      return
    }
    setDeleteLoading(true)
    try {
      await authApi.deleteAccount({
        confirm: deleteConfirmText,
        password: deletePassword,
      })
      showToast('Account deleted. Goodbye!', 'info')
      logout()
    } catch (err) {
      const msg = err.response?.data?.detail || err.response?.data?.password?.[0] || 'Deletion failed'
      showToast(msg, 'error')
    } finally {
      setDeleteLoading(false)
    }
  }

  return (
    <div className="profile-page" style={{ padding: '2rem 1.5rem', maxWidth: '1080px', margin: '0 auto' }}>
      
      {/* ── Top Sub-navigation Switcher ── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '2rem',
        flexWrap: 'wrap',
        gap: '1rem',
      }}>
        <div style={{
          display: 'inline-flex',
          background: 'var(--color-surface-2)',
          padding: '4px',
          borderRadius: '12px',
          border: '1px solid var(--color-border)',
        }}>
          <Button
            variant="secondary"
            onClick={() => navigate('/profile')}
            style={{
              border: 'none',
              background: 'var(--color-surface-3)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            }}
            icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>}
          >
            Profile & Account
          </Button>
          <Button
            variant="ghost"
            onClick={() => navigate('/preferences')}
            icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="3" /><path d="M19.07 4.93l-1.41 1.41M4.93 4.93l1.41 1.41M4.93 19.07l1.41-1.41M19.07 19.07l-1.41-1.41M20 12h2M2 12h2M12 20v2M12 2v2" /></svg>}
          >
            Preferences
          </Button>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <Button
            variant="secondary"
            onClick={handleExportData}
            disabled={exporting}
            icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>}
          >
            {exporting ? 'Exporting...' : 'Export Data'}
          </Button>
          <Button
            variant="danger"
            onClick={logout}
            icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" /><polyline points="16,17 21,12 16,7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>}
          >
            Sign Out
          </Button>
        </div>
      </div>

      {/* ── Hero Identity Banner ── */}
      <Card style={{
        position: 'relative',
        overflow: 'hidden',
        padding: '2.5rem',
        borderRadius: '24px',
        marginBottom: '2rem',
        border: '1px solid var(--color-border)',
        background: 'linear-gradient(145deg, var(--color-surface), var(--color-surface-2))',
      }}>
        {/* Ambient Glow Backdrop */}
        <div style={{
          position: 'absolute',
          top: '-60px',
          right: '-40px',
          width: '320px',
          height: '320px',
          background: 'var(--color-primary-glow)',
          filter: 'blur(80px)',
          borderRadius: '50%',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute',
          bottom: '-60px',
          left: '10%',
          width: '240px',
          height: '240px',
          background: 'rgba(139, 92, 246, 0.12)',
          filter: 'blur(70px)',
          borderRadius: '50%',
          pointerEvents: 'none',
        }} />

        <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: '2rem', flexWrap: 'wrap' }}>
          
          {/* Avatar with preset badge & edit trigger */}
          <div style={{ position: 'relative' }}>
            <div style={{
              width: '104px',
              height: '104px',
              borderRadius: '50%',
              background: currentAvatarPreset.bg,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 32px var(--color-primary-glow)',
              border: '3px solid var(--color-border)',
              position: 'relative',
            }}>
              {avatar === 'avatar-8' || !currentAvatarPreset.emoji ? (
                <span style={{ fontSize: '32px', fontWeight: 800, color: '#fff', letterSpacing: '-0.5px' }}>
                  {initials}
                </span>
              ) : (
                <span style={{ fontSize: '42px', userSelect: 'none' }}>
                  {currentAvatarPreset.emoji}
                </span>
              )}
            </div>

            <button
              onClick={() => setShowAvatarModal(true)}
              style={{
                position: 'absolute',
                bottom: 0,
                right: 0,
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'var(--color-surface-3)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                transition: 'transform 150ms ease',
              }}
              title="Change Avatar"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>
            </button>
          </div>

          {/* Identity details */}
          <div style={{ flex: 1, minWidth: '240px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
              <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-text)', letterSpacing: '-0.5px' }}>
                {displayName}
              </h1>
              <span style={{
                fontSize: '11px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                padding: '2px 8px',
                borderRadius: '20px',
                background: 'var(--color-primary-subtle)',
                color: 'var(--color-primary)',
                border: '1px solid var(--color-primary-muted)',
              }}>
                Pro
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--color-text-secondary)', fontSize: '0.9rem', marginBottom: '10px', flexWrap: 'wrap' }}>
              <span>@{formData.username || 'username'}</span>
              <span>•</span>
              <span>{formData.email || 'user@pillar.app'}</span>
              <span>•</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--color-text-muted)' }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                {joinedDate}
              </span>
            </div>

            <p style={{
              margin: 0,
              color: formData.headline ? 'var(--color-text)' : 'var(--color-text-muted)',
              fontSize: '0.95rem',
              fontStyle: formData.headline ? 'normal' : 'italic',
              maxWidth: '600px',
            }}>
              {formData.headline || 'No professional headline set yet. Click below to add one.'}
            </p>
          </div>
        </div>
      </Card>

      {/* ── Bento Grid: Live Stats & Milestones ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
        gap: '1.25rem',
        marginBottom: '2rem',
      }}>
        
        {/* Card 1: Tasks */}
        <Card style={{
          background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.05), var(--color-surface))',
        }}>
          <Card.Body>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Tasks Velocity</span>
              <div style={{
                width: '32px', height: '32px', borderRadius: '8px',
                background: 'rgba(59, 130, 246, 0.12)', color: '#3B82F6',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 11 12 14 22 4" /><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" /></svg>
              </div>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-text)', marginBottom: '6px' }}>
              {statsLoading ? '—' : (stats?.tasks?.completed ?? 0)}
              <span style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--color-text-muted)', marginLeft: '6px' }}>
                / {stats?.tasks?.total ?? 0}
              </span>
            </div>
            <div style={{
              height: '6px',
              borderRadius: '3px',
              background: 'var(--color-surface-3)',
              overflow: 'hidden',
              marginBottom: '8px',
            }}>
              <div style={{
                height: '100%',
                width: `${stats?.tasks?.rate ?? 0}%`,
                background: '#3B82F6',
                borderRadius: '3px',
                transition: 'width 600ms ease',
              }} />
            </div>
            <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
              {stats?.tasks?.rate ?? 0}% completion rate • {stats?.tasks?.active ?? 0} active
            </div>
          </Card.Body>
        </Card>

        {/* Card 2: Habits */}
        <Card style={{
          background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.05), var(--color-surface))',
        }}>
          <Card.Body>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Habits Consistency</span>
              <div style={{
                width: '32px', height: '32px', borderRadius: '8px',
                background: 'rgba(245, 158, 11, 0.12)', color: '#F59E0B',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>
              </div>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-text)', marginBottom: '6px' }}>
              {statsLoading ? '—' : (stats?.habits?.longest_streak ?? 0)}
              <span style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--color-text-muted)', marginLeft: '6px' }}>
                days streak 🔥
              </span>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '14px' }}>
              {stats?.habits?.active ?? 0} active habits • {stats?.habits?.total_completions ?? 0} total check-ins
            </div>
          </Card.Body>
        </Card>

        {/* Card 3: Focus */}
        <Card style={{
          background: 'linear-gradient(135deg, rgba(244, 63, 94, 0.05), var(--color-surface))',
        }}>
          <Card.Body>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Focus Deep Work</span>
              <div style={{
                width: '32px', height: '32px', borderRadius: '8px',
                background: 'rgba(244, 63, 94, 0.12)', color: '#F43F5E',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
              </div>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-text)', marginBottom: '6px' }}>
              {statsLoading ? '—' : (stats?.focus?.total_hours ?? 0)}
              <span style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--color-text-muted)', marginLeft: '6px' }}>
                hours logged
              </span>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '14px' }}>
              {stats?.focus?.sessions_count ?? 0} completed pomodoro sessions
            </div>
          </Card.Body>
        </Card>

        {/* Card 4: Faith */}
        <Card style={{
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.05), var(--color-surface))',
        }}>
          <Card.Body>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Faith & Quran</span>
              <div style={{
                width: '32px', height: '32px', borderRadius: '8px',
                background: 'rgba(16, 185, 129, 0.12)', color: '#10B981',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
              </div>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-text)', marginBottom: '6px' }}>
              {statsLoading ? '—' : (stats?.faith?.khatmah_page ?? 0)}
              <span style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--color-text-muted)', marginLeft: '6px' }}>
                / 604 p.
              </span>
            </div>
            <div style={{
              height: '6px',
              borderRadius: '3px',
              background: 'var(--color-surface-3)',
              overflow: 'hidden',
              marginBottom: '8px',
            }}>
              <div style={{
                height: '100%',
                width: `${stats?.faith?.khatmah_percent ?? 0}%`,
                background: '#10B981',
                borderRadius: '3px',
                transition: 'width 600ms ease',
              }} />
            </div>
            <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
              {stats?.faith?.khatmah_percent ?? 0}% Khatmah • {stats?.faith?.prayers_logged ?? 0} prayers logged
            </div>
          </Card.Body>
        </Card>

      </div>

      {/* ── Main Edit Sections Grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem', marginBottom: '2.5rem' }}>
        
        {/* Personal Details Form */}
        <Card>
          <Card.Header 
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '36px', height: '36px', borderRadius: '10px',
                  background: 'var(--color-primary-subtle)', color: 'var(--color-primary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                </div>
                <span>Personal Information</span>
              </div>
            }
            subtitle="Manage how you appear across Pillar" 
          />
          <Card.Body>
            <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              <div className="responsive-grid-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '6px' }}>First Name</label>
                  <Input
                    value={formData.first_name}
                    onChange={e => setFormData({ ...formData, first_name: e.target.value })}
                    placeholder="e.g. John"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '6px' }}>Last Name</label>
                  <Input
                    value={formData.last_name}
                    onChange={e => setFormData({ ...formData, last_name: e.target.value })}
                    placeholder="e.g. Doe"
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '6px' }}>Username</label>
                <Input
                  value={formData.username}
                  onChange={e => setFormData({ ...formData, username: e.target.value })}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '6px' }}>Email Address</label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  placeholder="name@example.com"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '6px' }}>Professional Headline / Motto</label>
                <Input
                  value={formData.headline}
                  onChange={e => setFormData({ ...formData, headline: e.target.value })}
                  placeholder="e.g. Software Craftsman | Aiming for Ihsan"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '6px' }}>Bio</label>
                <textarea
                  value={formData.bio}
                  onChange={e => setFormData({ ...formData, bio: e.target.value })}
                  placeholder="Write a few sentences about your journey, priorities, or goals..."
                  rows={3}
                  style={{
                    width: '100%', padding: '10px 14px', borderRadius: '10px',
                    background: 'var(--color-surface-2)', border: '1px solid var(--color-border)',
                    color: 'var(--color-text)', fontSize: '14px', outline: 'none', resize: 'vertical'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '6px' }}>Gender</label>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, gender: 'male' })}
                    style={{
                      flex: 1,
                      padding: '10px',
                      borderRadius: '10px',
                      border: `1px solid ${formData.gender === 'male' ? 'var(--color-primary)' : 'var(--color-border)'}`,
                      background: formData.gender === 'male' ? 'var(--color-primary-subtle)' : 'var(--color-surface-2)',
                      color: formData.gender === 'male' ? 'var(--color-primary)' : 'var(--color-text-muted)',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 150ms ease',
                    }}
                  >
                    Male (ذكر)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, gender: 'female' })}
                    style={{
                      flex: 1,
                      padding: '10px',
                      borderRadius: '10px',
                      border: `1px solid ${formData.gender === 'female' ? 'var(--color-primary)' : 'var(--color-border)'}`,
                      background: formData.gender === 'female' ? 'var(--color-primary-subtle)' : 'var(--color-surface-2)',
                      color: formData.gender === 'female' ? 'var(--color-primary)' : 'var(--color-text-muted)',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 150ms ease',
                    }}
                  >
                    Female (أنثى)
                  </button>
                </div>
              </div>

              <Button type="submit" variant="primary" disabled={savingProfile} style={{ marginTop: '0.5rem', width: '100%' }}>
                {savingProfile ? 'Saving...' : 'Save Profile Changes'}
              </Button>
            </form>
          </Card.Body>
        </Card>

        {/* Security & Password Card */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          <Card>
            <Card.Header 
              title={
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '36px', height: '36px', borderRadius: '10px',
                    background: 'rgba(139, 92, 246, 0.12)', color: '#8B5CF6',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0110 0v4" /></svg>
                  </div>
                  <span>Security & Password</span>
                </div>
              }
              subtitle="Keep your Pillar account safe"
            />
            <Card.Body>
              <form onSubmit={handlePasswordChange} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '6px' }}>Current Password</label>
                  <div style={{ position: 'relative' }}>
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      value={passwordData.currentPassword}
                      onChange={e => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                      placeholder="Enter current password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                        background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', padding: 0
                      }}
                    >
                      {showPassword ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '6px' }}>New Password</label>
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={passwordData.newPassword}
                    onChange={e => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    placeholder="At least 8 characters"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '6px' }}>Confirm New Password</label>
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={passwordData.confirmPassword}
                    onChange={e => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    placeholder="Repeat new password"
                  />
                </div>

                <Button type="submit" variant="secondary" disabled={passwordLoading}>
                  {passwordLoading ? 'Updating...' : 'Change Password'}
                </Button>
              </form>
            </Card.Body>
          </Card>

          {/* Danger Zone */}
          <Card style={{ border: '1px solid rgba(244, 63, 94, 0.25)', background: 'linear-gradient(135deg, rgba(244, 63, 94, 0.04), var(--color-surface))' }}>
            <Card.Header 
              title={
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '32px', height: '32px', borderRadius: '8px',
                    background: 'rgba(244, 63, 94, 0.15)', color: '#F43F5E',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
                  </div>
                  <span style={{ color: '#F43F5E' }}>Danger Zone</span>
                </div>
              }
              subtitle="Permanent account actions"
            />
            <Card.Body>
              <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '1.25rem', lineHeight: 1.4 }}>
                Deleting your account will permanently erase your profile, tasks, habits, streak history, calendar events, and focus logs.
              </p>

              <Button
                variant="danger"
                onClick={() => setShowDeleteModal(true)}
              >
                Delete Account...
              </Button>
            </Card.Body>
          </Card>

        </div>

      </div>

      {/* ── Avatar Preset Selector Modal ── */}
      <Modal isOpen={showAvatarModal} onClose={() => setShowAvatarModal(false)}>
        <Modal.Header title="Choose Your Avatar" showCloseButton />
        <Modal.Body>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', padding: '1rem 0 2rem' }}>
            {AVATAR_PRESETS.map((p) => {
              const isSelected = avatar === p.id
              return (
                <button
                  key={p.id}
                  onClick={() => { setAvatar(p.id); setShowAvatarModal(false) }}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '8px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '8px',
                    borderRadius: '12px',
                  }}
                >
                  <div style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    background: p.bg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: isSelected ? '3px solid var(--color-primary)' : '2px solid transparent',
                    boxShadow: isSelected ? '0 0 16px var(--color-primary)' : 'none',
                    transition: 'all 200ms ease',
                  }}>
                    {p.id === 'avatar-8' ? (
                      <span style={{ color: '#fff', fontWeight: 700, fontSize: '20px' }}>{initials}</span>
                    ) : (
                      <span style={{ fontSize: '26px' }}>{p.emoji}</span>
                    )}
                  </div>
                  <span style={{ fontSize: '11px', color: isSelected ? 'var(--color-primary)' : 'var(--color-text-muted)', fontWeight: isSelected ? 700 : 500 }}>
                    {p.label}
                  </span>
                </button>
              )
            })}
          </div>
        </Modal.Body>
      </Modal>

      {/* ── Delete Account Confirmation Modal ── */}
      <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)}>
        <Modal.Header 
          title={<span style={{ color: '#F43F5E' }}>Are you absolutely sure?</span>}
          showCloseButton 
        />
        <Modal.Body>
          <div style={{ padding: '0.5rem 0' }}>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', marginBottom: '1.25rem', lineHeight: 1.5 }}>
              This will permanently wipe all your data. To proceed, please type <strong style={{ color: 'var(--color-text)' }}>delete-{formData.username}</strong> below and enter your password.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
              <Input
                placeholder={`delete-${formData.username}`}
                value={deleteConfirmText}
                onChange={e => setDeleteConfirmText(e.target.value)}
              />
              <Input
                type="password"
                placeholder="Your password"
                value={deletePassword}
                onChange={e => setDeletePassword(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <Button variant="ghost" onClick={() => setShowDeleteModal(false)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleDeleteAccount}
                disabled={deleteLoading || deleteConfirmText !== `delete-${formData.username}`}
                style={{ opacity: deleteConfirmText !== `delete-${formData.username}` ? 0.5 : 1 }}
              >
                {deleteLoading ? 'Deleting...' : 'Delete Permanently'}
              </Button>
            </div>
          </div>
        </Modal.Body>
      </Modal>

    </div>
  )
}
