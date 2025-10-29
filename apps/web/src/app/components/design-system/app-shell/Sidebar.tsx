import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'

const NAV = [
  { label: 'Dashboard', icon: '🏠', to: '/dashboard' },
  { label: 'Users', icon: '👤', to: '/users' },
  { label: 'Billing', icon: '💳', to: '/billing' },
  { label: 'Settings', icon: '⚙️', to: '/settings' },
]

export function Sidebar({ className = '' }: { className?: string }) {
  const location = useLocation()
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    return localStorage.getItem('nav-collapsed') === '1'
  })

  useEffect(() => {
    localStorage.setItem('nav-collapsed', collapsed ? '1' : '0')
  }, [collapsed])

  return (
    <aside
      className={`${className} group relative hidden md:flex flex-col border-r border-border
                  bg-surface1 transition-[width] duration-200
                  ${collapsed ? 'w-[72px]' : 'w-[264px]'}`}
      aria-label="Primary navigation"
    >
      <div className="flex h-14 items-center justify-end px-2 shrink-0">
        <button
          onClick={() => setCollapsed((v) => !v)}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border hover:bg-surface2 transition
                     focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[hsl(var(--ring))]"
          aria-pressed={collapsed}
          aria-label={collapsed ? 'Expand menu' : 'Collapse menu'}
        >
          {collapsed ? '→' : '←'}
        </button>
      </div>

      <nav className="px-2 pb-3 flex-1 overflow-y-auto">
        {NAV.map((item) => {
          const active = location.pathname.startsWith(item.to)
          return (
            <a
              key={item.to}
              href={item.to}
              aria-current={active ? 'page' : undefined}
              className={`relative my-0.5 flex items-center gap-3 rounded-xl px-3 py-2.5
                          hover:bg-surface2 transition
                          focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[hsl(var(--ring))]
                          ${active ? 'bg-surface2' : ''}`}
            >
              {/* Active rail */}
              {active && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 rounded bg-accent" />
              )}
              <span className="text-lg shrink-0">{item.icon}</span>
              <span
                className={`text-sm text-text transition-opacity ${
                  collapsed ? 'opacity-0 pointer-events-none select-none w-0' : 'opacity-100'
                }`}
              >
                {item.label}
              </span>
              {collapsed && (
                <span
                  className="pointer-events-none absolute left-[72px] z-10 rounded-md border border-border
                                  bg-surface1 px-2 py-1 text-xs opacity-0 shadow-lg text-text whitespace-nowrap
                                  transition group-hover:opacity-100"
                >
                  {item.label}
                </span>
              )}
            </a>
          )
        })}
      </nav>

      {/* Plan badge / CTA */}
      <div className={`shrink-0 p-3 ${collapsed ? 'hidden' : 'block'}`}>
        <div className="rounded-xl border border-border bg-surface2 px-3 py-2 text-xs">
          <div className="mb-1 font-medium text-text">Plan: Free</div>
          <a href="/billing" className="inline-flex items-center gap-1 text-accent hover:underline">
            Upgrade →
          </a>
        </div>
      </div>
    </aside>
  )
}
