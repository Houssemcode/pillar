import './EmptyState.css'

export default function EmptyState({ icon, title, description, action, className = '' }) {
  return (
    <div className={`pil-empty-state ${className}`.trim()}>
      {icon && (
        <div className="pil-empty-state__icon">
          {icon}
        </div>
      )}
      {title && <h4 className="pil-empty-state__title">{title}</h4>}
      {description && <p className="pil-empty-state__description">{description}</p>}
      {action && <div className="pil-empty-state__action">{action}</div>}
    </div>
  )
}
