import { Link, useLocation } from 'react-router-dom'
import { features } from '../lib/featureFlags'
import { NAV } from '../../../../../packages/config/nav'

type Props = {
  mobile?: boolean
  onClose?: () => void
}

export default function NavSidebar({ mobile = false, onClose }: Props) {
  const { pathname } = useLocation()
  const containerClass = mobile
    ? 'w-full max-w-xs h-full p-4 space-y-4 bg-card border-r border-border'
    : 'w-64 min-h-screen p-4 space-y-2'

  return (
    <aside className={`app-sidebar ${containerClass}`}>
      {mobile && (
        <div className="flex items-center justify-between">
          <div className="font-semibold">Menu</div>
          <button aria-label="close navigation" onClick={onClose} className="btn-ghost p-2 rounded-md focus-visible-only">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      )}

      <nav aria-label="Primary" className="space-y-1">
        {NAV.map((item) => {
          // feature flag check (some NAV entries may include a `feature` key)
          // use a safe cast to avoid TS index complaints
          const feature = (item as any).feature
          if (feature && !(features as any)[feature]?.enabled) return null
          const active = pathname === (item as any).to
          const base = 'block px-3 py-2 rounded-md focus-visible-only transition-colors'
          const activeClasses = 'bg-muted/30 text-gradient-primary font-semibold'
          const inactiveClasses = 'text-fg hover:bg-muted/10'
          return (
            <Link
              key={(item as any).to}
              to={(item as any).to}
              onClick={onClose}
              className={`${base} ${active ? activeClasses : inactiveClasses}`}
            >
              {(item as any).label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
