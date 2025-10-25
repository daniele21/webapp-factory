import { Link, useLocation } from 'react-router-dom'
import { NAV } from '../../../../../packages/config/nav'
import { features } from '../lib/featureFlags'

function IconFor(path: string, label: string) {
  // minimal icon set that maps to common routes; fallback is a circle
  if (path === '/' || path === '/home') {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-6 9 6v6a3 3 0 0 1-3 3h-12a3 3 0 0 1-3-3z"></path>
        <path d="M9 22V12h6v10"></path>
      </svg>
    )
  }
  if (label.toLowerCase().includes('dashboard')) {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="9"></rect>
        <rect x="14" y="3" width="7" height="5"></rect>
        <rect x="14" y="12" width="7" height="9"></rect>
        <rect x="3" y="14" width="7" height="7"></rect>
      </svg>
    )
  }
  if (label.toLowerCase().includes('style') || label.toLowerCase().includes('ui')) {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 20l9-7-9-11-9 11 9 7z"></path>
        <path d="M12 3v7"></path>
      </svg>
    )
  }
  if (label.toLowerCase().includes('cookie') || label.toLowerCase().includes('terms')) {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
      </svg>
    )
  }
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"></circle>
    </svg>
  )
}

export default function BottomNav(){
  const { pathname } = useLocation()
  return (
    <>
      {/* Mobile bottom nav */}
      <nav aria-label="Bottom navigation" className="bottom-nav fixed bottom-0 left-0 right-0 md:hidden bg-card border-t border-border flex justify-around items-center p-2 z-40">
        {NAV.map((item) => {
          const feature = (item as any).feature
          if (feature && !(features as any)[feature]?.enabled) return null
          const to = (item as any).to
          const label = (item as any).label
          const active = pathname === to
          return (
            <Link
              key={to}
              to={to}
              aria-label={label}
              className={`flex flex-col items-center gap-1 p-2 rounded-md w-full text-center focus-visible-only transition-colors ${active ? 'text-gradient-primary' : 'text-fg/80 hover:bg-muted/8'}`}
            >
              {IconFor(to, label)}
              <span className="text-[10px] leading-3 mt-1">{label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Desktop footer (subtle) */}
      <footer className="hidden md:flex items-center justify-between p-3 border-t border-border bg-card">
        <div className="text-sm">© {new Date().getFullYear()} Webapp Factory</div>
        <div className="text-sm text-muted-fg">Status: All systems operational</div>
      </footer>
    </>
  )
}
