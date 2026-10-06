import { useState, useEffect } from 'react'
import { trashApi } from '../api/trash'
import { useToast } from '../context/ToastContext'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import IconButton from '../components/ui/IconButton'
import Badge from '../components/ui/Badge'
import EmptyState from '../components/ui/EmptyState'
import Modal from '../components/ui/Modal'

/* ── Helpers ─────────────────────────────────────────────── */
function relativeTime(dateStr) {
  if (!dateStr) return ''
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

const TYPE_META = {
  task:      { label: 'Tasks',          icon: '✓',  color: '#6366F1' },
  habit:     { label: 'Habits',         icon: '⚡', color: '#F59E0B' },
  event:     { label: 'Calendar Events',icon: '📅', color: '#10B981' },
  session:   { label: 'Focus Sessions', icon: '🍅', color: '#F43F5E' },
  task_list: { label: 'Task Lists',     icon: '📋', color: '#8B5CF6' },
  task_tag:  { label: 'Tags',           icon: '🏷️', color: '#06B6D4' },
}

/* ── Custom Confirm Modal ──────────────────────────────── */
function ConfirmModal({ title, message, confirmLabel = 'Delete', onConfirm, onCancel }) {
  return (
    <Modal isOpen={true} onClose={onCancel}>
      <Modal.Body style={{ padding: '28px 28px 24px' }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>🗑️</div>
        <h3 style={{ margin: '0 0 8px', fontSize: 17, fontWeight: 700, color: 'var(--color-text)' }}>{title}</h3>
        <p style={{ margin: '0 0 24px', fontSize: 14, color: 'var(--color-text-muted)', lineHeight: 1.6 }}>{message}</p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="danger" onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </Modal.Body>
    </Modal>
  )
}

/* ── Trash Item Row ────────────────────────────────────── */
function TrashItemRow({ item, onRestore, onDelete }) {
  const meta = TYPE_META[item.type] || { label: item.type, icon: '📄', color: 'var(--color-text-muted)' }
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      padding: '12px 20px',
      borderBottom: '1px solid var(--color-border-subtle)',
      gap: 14,
      transition: 'background 150ms',
    }}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--color-surface-3)'}
      onMouseLeave={e => e.currentTarget.style.background = ''}
    >
      <div style={{
        width: 34, height: 34, borderRadius: 10, flexShrink: 0,
        background: `${meta.color}15`, border: `1px solid ${meta.color}30`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 16,
      }}>
        {meta.icon}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 14, fontWeight: 500, color: 'var(--color-text)',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {item.name}
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 2, alignItems: 'center' }}>
          <Badge size="sm" style={{ background: `${meta.color}15`, color: meta.color, border: 'none', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            {meta.label}
          </Badge>
          {item.deletedAt && (
            <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
              {relativeTime(item.deletedAt)}
            </span>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
        <IconButton
          variant="ghost"
          ariaLabel="Restore"
          onClick={() => onRestore(item)}
          icon={
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <polyline points="3 3 3 8 8 8" />
            </svg>
          }
        />
        <IconButton
          variant="ghost"
          ariaLabel="Delete Permanently"
          onClick={() => onDelete(item)}
          style={{ color: '#F43F5E' }}
          icon={
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M3 6h18" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
          }
        />
      </div>
    </div>
  )
}

/* ── Main Component ────────────────────────────────────── */
export default function Trash() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [confirmModal, setConfirmModal] = useState(null) // { type, item?, action }
  const { toastSuccess, toastError } = useToast()

  const fetchTrash = async () => {
    try {
      setLoading(true)
      const data = await trashApi.list()
      setItems(data)
    } catch (e) {
      toastError('Failed to load trash')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchTrash() }, [])

  const handleRestore = async (item) => {
    try {
      setItems(prev => prev.filter(t => t.id !== item.id || t.type !== item.type))
      await trashApi.restore(item.type, item.id)
      toastSuccess(`Restored "${item.name}"`)
    } catch (e) {
      toastError('Failed to restore item')
      fetchTrash()
    }
  }

  const handleDelete = (item) => {
    setConfirmModal({
      type: 'single',
      item,
      title: 'Delete permanently?',
      message: `"${item.name}" will be permanently deleted and cannot be recovered.`,
      confirmLabel: 'Delete permanently',
    })
  }

  const handleEmptyTrash = () => {
    if (items.length === 0) return
    setConfirmModal({
      type: 'empty',
      title: 'Empty entire trash?',
      message: `All ${items.length} item${items.length > 1 ? 's' : ''} will be permanently deleted. This cannot be undone.`,
      confirmLabel: 'Empty trash',
    })
  }

  const executeConfirm = async () => {
    const modal = confirmModal
    setConfirmModal(null)
    if (!modal) return

    if (modal.type === 'single') {
      try {
        setItems(prev => prev.filter(t => t.id !== modal.item.id || t.type !== modal.item.type))
        await trashApi.remove(modal.item.type, modal.item.id)
        toastSuccess(`Deleted "${modal.item.name}" permanently`)
      } catch (e) {
        toastError('Failed to delete item')
        fetchTrash()
      }
    } else if (modal.type === 'empty') {
      try {
        setLoading(true)
        await trashApi.empty()
        setItems([])
        toastSuccess('Trash emptied')
      } catch (e) {
        toastError('Failed to empty trash')
      } finally {
        setLoading(false)
      }
    }
  }

  // Group items by type
  const grouped = Object.keys(TYPE_META).reduce((acc, type) => {
    const group = items.filter(i => i.type === type)
    if (group.length > 0) acc[type] = group
    return acc
  }, {})

  return (
    <div className="page">
      {/* Header */}
      <div className="page-header" style={{ marginBottom: 20 }}>
        <div>
          <h1 className="page-title">🗑️ Trash</h1>
          <div className="page-subtitle">
            {loading ? 'Loading…' : items.length === 0 ? 'Empty trash' : `${items.length} item${items.length > 1 ? 's' : ''} in trash`}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Button variant="ghost" onClick={fetchTrash}>
            ↻ Refresh
          </Button>
          <Button 
            variant="danger" 
            onClick={handleEmptyTrash} 
            disabled={items.length === 0}
            icon={
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M3 6h18" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
            }
          >
            Empty Trash
          </Button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ padding: 60, textAlign: 'center', color: 'var(--color-text-muted)' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
          Loading trash…
        </div>
      ) : items.length === 0 ? (
        <EmptyState 
          title="Trash is empty"
          description="Items in trash will be permanently deleted after 30 days."
          icon={
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
            </svg>
          }
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {Object.entries(grouped).map(([type, groupItems]) => {
            const meta = TYPE_META[type]
            return (
              <Card key={type} style={{ padding: 0, overflow: 'hidden' }}>
                {/* Group header */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '12px 20px', borderBottom: '1px solid var(--color-border-subtle)',
                  background: `${meta.color}08`,
                }}>
                  <span style={{
                    width: 24, height: 24, borderRadius: 8,
                    background: `${meta.color}18`, border: `1px solid ${meta.color}30`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 13,
                  }}>{meta.icon}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: meta.color }}>{meta.label}</span>
                  <span style={{
                    marginLeft: 'auto', fontSize: 11, fontWeight: 600,
                    background: `${meta.color}15`, color: meta.color,
                    padding: '2px 8px', borderRadius: 20,
                  }}>{groupItems.length}</span>
                </div>

                {/* Items */}
                {groupItems.map(item => (
                  <TrashItemRow
                    key={`${item.type}-${item.id}`}
                    item={item}
                    onRestore={handleRestore}
                    onDelete={handleDelete}
                  />
                ))}
              </Card>
            )
          })}
        </div>
      )}

      {/* Custom confirm modal */}
      {confirmModal && (
        <ConfirmModal
          title={confirmModal.title}
          message={confirmModal.message}
          confirmLabel={confirmModal.confirmLabel}
          onConfirm={executeConfirm}
          onCancel={() => setConfirmModal(null)}
        />
      )}
    </div>
  )
}
