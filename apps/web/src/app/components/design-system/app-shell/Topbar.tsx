import type { ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useTheme } from '../../../theme/ThemeProvider'
import { useAppConfig } from '@config/src/provider'
import { Drawer } from '../overlays/Drawer'
import type { AppShellNavItem } from './navItems'
import { DEFAULT_NAV_ITEMS } from './navItems'

export type TopbarProps = {
  actions?: ReactNode
  navItems?: AppShellNavItem[]
  /** If provided, overrides config.layout.topbar.showThemeToggle */
  showThemeToggle?: boolean
}

export function Topbar({ actions, navItems = DEFAULT_NAV_ITEMS, showThemeToggle }: TopbarProps = {}) {
  const { mode, setMode } = useTheme()
  const { config } = useAppConfig()
  const configShowTheme = config?.layout?.topbar?.showThemeToggle
  const shouldShowTheme = typeof showThemeToggle === 'boolean' ? showThemeToggle : configShowTheme ?? true
  const location = useLocation()

  return (
    <header
      className="sticky top-0 z-40 h-14 w-full border-b border-border
                 bg-surface1/95 backdrop-blur supports-[backdrop-filter]:bg-surface1/80"
    >
      <div className="mx-auto flex h-full items-center gap-2 px-3 md:px-4">
        {/* Mobile menu button */}
        <div className="md:hidden">
          <Drawer
            title="Navigate"
            side="left"
            contentClassName="bg-surface1 text-fg"
            trigger={
              <button
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg
                           border border-border bg-surface1/80 hover:bg-surface2 transition focus-visible:outline-2
                           focus-visible:outline-offset-2 focus-visible:outline-[hsl(var(--ring))]"
                aria-label="Open navigation"
              >
                ☰
              </button>
            }
          >
            <nav className="mt-4 flex flex-col gap-1" aria-label="Mobile navigation">
              {navItems.map((item) => {
                const active = location.pathname.startsWith(item.to)
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition
                                ${active ? 'bg-primary/10 text-primary' : 'text-muted-fg hover:bg-muted/50 hover:text-fg'}`}
                  >
                    {item.icon ? <span className="text-lg">{item.icon}</span> : null}
                    <span>{item.label}</span>
                  </Link>
                )
              })}
            </nav>
          </Drawer>
        </div>

        {/* Brand */}
        <div className="flex items-center gap-2">
          <img src="/icons/logo-192.png" alt="" className="h-6 w-6 rounded" />
          <span className="font-semibold hidden sm:inline text-text">Webapp Factory</span>
        </div>

        {/* Search / Command palette */}
        <div className="mx-2 hidden flex-1 max-w-xl sm:flex">
          <button
            onClick={() => {/* open command palette */}}
            className="group flex w-full items-center gap-2 rounded-xl border
                       border-border bg-surface1
                       px-3 py-2 text-left text-sm text-muted
                       hover:bg-surface2 transition
                       focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[hsl(var(--ring))]"
            aria-label="Search (⌘K)"
          >
            <span className="opacity-70">Search or jump to…</span>
            <kbd className="ml-auto rounded border border-border px-1.5 py-0.5 text-xs opacity-70">
              ⌘K
            </kbd>
          </button>
        </div>

        <button
          onClick={() => {/* open command palette */}}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-fg transition hover:bg-surface2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[hsl(var(--ring))] sm:hidden"
          aria-label="Open search"
        >
          🔍
        </button>

        {/* Actions: theme, notifications, account */}
        <div className="flex items-center gap-2 sm:gap-3">
          {shouldShowTheme ? (
            <button
              onClick={() => setMode(mode === 'dark' ? 'light' : 'dark')}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border hover:bg-surface2 transition
                         focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[hsl(var(--ring))]"
              aria-label={`Switch to ${mode === 'dark' ? 'light' : 'dark'} mode`}
            >
              {mode === 'dark' ? '🌙' : '☀️'}
            </button>
          ) : null}
          <button
            className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border hover:bg-surface2 transition
                       focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[hsl(var(--ring))]"
            aria-label="Notifications"
          >
            🔔
            <span className="absolute -right-0.5 -top-0.5 h-4 min-w-4 rounded-full bg-accent text-accent-fg text-[10px] leading-4 text-center px-1">
              3
            </span>
          </button>
          {actions ?? (
            <button
              className="inline-flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-border
                         focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[hsl(var(--ring))]"
              aria-label="Account"
            >
              <div className="h-full w-full bg-gradient-primary flex items-center justify-center text-white font-semibold text-sm">
                U
              </div>
            </button>
          )}
        </div>
        {/* Theme debug (small, non-intrusive) */}
        {/* <div className="ml-3 hidden sm:flex items-center gap-2 text-[12px] text-muted">
          <span title="Theme mode">Mode: <strong className="ml-1">{mode}</strong></span>
          <span title="Brand id">Brand: <strong className="ml-1">{brand}</strong></span>
          <span title="Visual id">Visual: <strong className="ml-1">{visual}</strong></span>
          {lockBrand || lockVisual ? (
            <span className="ml-2 px-2 rounded bg-surface2 text-xs text-muted">Locked</span>
          ) : null}
        </div> */}
      </div>
    </header>
  )
}
