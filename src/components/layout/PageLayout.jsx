import './PageLayout.css'

/**
 * PageLayout — Standard 2-column layout wrapper across Pillar modules.
 *
 * Structure:
 * - Full-width optional header (e.g. date strip, toolbar, page title)
 * - Main content area (left on LTR, right on RTL) taking primary space (1fr)
 * - Optional context/stats sidebar (right on LTR, left on RTL) with fixed width (~340px)
 * - Automatic responsive stacking on viewports <= 1024px
 */
export default function PageLayout({
  children,
  sidebar,
  header,
  className = '',
  mainClassName = '',
  sidebarClassName = '',
  bodyClassName = '',
  sidebarWidth = '340px',
  style = {},
}) {
  const hasSidebar = Boolean(sidebar)

  return (
    <div
      className={`page-layout ${className}`}
      style={{
        '--page-sidebar-width': typeof sidebarWidth === 'number' ? `${sidebarWidth}px` : sidebarWidth,
        ...style,
      }}
    >
      {header && <header className="page-layout__header">{header}</header>}

      <div className={`page-layout__body ${!hasSidebar ? 'page-layout__body--no-sidebar' : ''} ${bodyClassName}`}>
        <main className={`page-layout__main ${mainClassName}`}>
          {children}
        </main>

        {hasSidebar && (
          <aside className={`page-layout__sidebar ${sidebarClassName}`}>
            {sidebar}
          </aside>
        )}
      </div>
    </div>
  )
}
