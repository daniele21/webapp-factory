import { useLocation } from 'react-router-dom'

export function MobileTabs({ className = '' }: { className?: string }) {
  const location = useLocation()
  const items = [
    { label: 'Home', icon: '🏠', to: '/dashboard' },
    { label: 'Users', icon: '👤', to: '/users' },
    { label: 'Bill', icon: '💳', to: '/billing' },
    { label: 'Set', icon: '⚙️', to: '/settings' },
  ]

  return (
    <nav
      className={`${className} fixed bottom-0 inset-x-0 z-40 border-t border-border
                  bg-surface1 pb-[env(safe-area-inset-bottom)]`}
      aria-label="Primary navigation (mobile)"
    >
      <div className="grid grid-cols-4">
        {items.map((it) => {
          const active = location.pathname.startsWith(it.to)
          return (
            <a
              key={it.to}
              href={it.to}
              aria-current={active ? 'page' : undefined}
              className="flex h-14 flex-col items-center justify-center gap-0.5 text-xs transition
                         focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[hsl(var(--ring))]"
            >
              <span className={`text-lg ${active ? 'text-accent' : 'opacity-80'}`}>{it.icon}</span>
              <span className={`${active ? 'text-accent' : 'text-muted opacity-80'}`}>{it.label}</span>
            </a>
          )
        })}
      </div>
    </nav>
  )
}
