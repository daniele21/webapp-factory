import { Link, useLocation } from 'react-router-dom'
import { features } from '../lib/featureFlags'
import { NAV } from '../../../../../packages/config/nav'
import { useTheme } from '../theme/ThemeProvider'

type Props = {
  mobile?: boolean
  onClose?: () => void
}

export default function NavSidebar({ mobile = false, onClose }: Props) {
  const { pathname } = useLocation()
  const { brand, visual, mode } = useTheme()
  const containerClass = mobile
    ? 'w-full max-w-xs h-full p-4 space-y-4 bg-card border-r border-border'
    : 'relative w-64 min-h-screen p-5 space-y-6 bg-card/80 border-r border-border backdrop-blur-md overflow-hidden'

  return (
    <aside className={`app-sidebar ${containerClass}`}>
      {!mobile && (
        <div className="pointer-events-none absolute -top-16 -right-10 h-48 w-48 rounded-full bg-gradient-to-br from-primary/20 via-secondary/10 to-accent/5 blur-3xl opacity-70" />
      )}

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



      <div className="relative z-10">
        <p className="text-[11px] uppercase tracking-[0.3em] text-muted-fg mb-2">Navigation</p>
      </div>

      <nav aria-label="Primary" className="relative z-10 space-y-1.5">
        {NAV.map((item) => {
          // feature flag check (some NAV entries may include a `feature` key)
          // use a safe cast to avoid TS index complaints
          const feature = (item as any).feature
          if (feature && !(features as any)[feature]?.enabled) return null
          const active = pathname === (item as any).to
          const base =
            'group flex items-center gap-3 rounded-xl border px-3 py-2.5 focus-visible-only transition-all duration-150'
          const activeClasses =
            'border-primary/30 bg-gradient-to-r from-primary/15 to-primary/5 text-primary shadow-sm shadow-primary/20'
          const inactiveClasses = 'border-transparent text-muted-fg hover:border-border/80 hover:bg-muted/20'
          return (
            <Link
              key={(item as any).to}
              to={(item as any).to}
              onClick={onClose}
              className={`${base} ${active ? activeClasses : inactiveClasses}`}
            >
              <span
                className={`h-2 w-2 rounded-full ${active ? 'bg-primary shadow shadow-primary/50' : 'bg-muted'}`}
              ></span>
              <span className="text-sm font-medium">{(item as any).label}</span>
              <span className="ml-auto text-[11px] uppercase tracking-wide text-muted-fg/70 group-hover:text-muted-fg/100">
                {active ? 'Active' : 'Go'}
              </span>
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
