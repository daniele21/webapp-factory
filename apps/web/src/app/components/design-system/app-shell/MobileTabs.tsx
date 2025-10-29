import { Link, useLocation } from 'react-router-dom'
import type { AppShellNavItem } from './navItems'
import { DEFAULT_NAV_ITEMS } from './navItems'

export function MobileTabs({ className = '', items = DEFAULT_NAV_ITEMS }: { className?: string; items?: AppShellNavItem[] }) {
  const location = useLocation()

  return (
    <nav
      className={`${className} fixed bottom-0 inset-x-0 z-40 border-t border-border
                  bg-surface1 pb-[env(safe-area-inset-bottom)]`}
      aria-label="Primary navigation (mobile)"
    >
      <div className="grid grid-cols-4">
        {items.map((item) => {
          const active = location.pathname.startsWith(item.to)
          return (
            <Link
              key={item.to}
              to={item.to}
              aria-current={active ? 'page' : undefined}
              className="flex h-14 flex-col items-center justify-center gap-0.5 text-xs transition
                         focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[hsl(var(--ring))]"
            >
              {item.icon ? <span className={`text-lg ${active ? 'text-accent' : 'opacity-80'}`}>{item.icon}</span> : null}
              <span className={`${active ? 'text-accent' : 'text-muted opacity-80'}`}>{item.shortLabel ?? item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
