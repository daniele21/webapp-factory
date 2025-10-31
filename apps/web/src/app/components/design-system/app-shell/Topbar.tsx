import type { ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, Moon, Search, Sun } from 'lucide-react'
import { useTheme } from '../../../theme/ThemeProvider'
import { useAppConfig } from '@config/src/provider'
import { Drawer } from '../overlays/Drawer'
import type { AppShellNavItem } from './navItems'
import { DEFAULT_NAV_ITEMS } from './navItems'
import { NotificationCenterButton } from '@/app/components/notifications/NotificationCenter'
import { Button } from '@/app/components/ui/button'
import { useTransparencyPreference } from '@/app/lib/useTransparencyPreference'
import { cn } from '@/app/lib/cn'

export type TopbarProps = {
  actions?: ReactNode
  navItems?: AppShellNavItem[]
  /** If provided, overrides config.layout.topbar.showThemeToggle */
  showThemeToggle?: boolean
}

export function Topbar({ actions, navItems = DEFAULT_NAV_ITEMS, showThemeToggle }: TopbarProps = {}) {
  const { mode, setMode } = useTheme()
  const { config } = useAppConfig()
  const transparencyEnabled = useTransparencyPreference()
  const configShowTheme = config?.layout?.topbar?.showThemeToggle
  const shouldShowTheme = typeof showThemeToggle === 'boolean' ? showThemeToggle : configShowTheme ?? true
  const showNotifications = config?.layout?.topbar?.showNotifications ?? true
  const location = useLocation()

  return (
    <header
      className={cn(
        'sticky top-0 z-40 w-full border-b border-border/80 transition-colors',
        transparencyEnabled
          ? 'bg-surface1/95 backdrop-blur supports-[backdrop-filter]:bg-surface1/75'
          : 'bg-surface1 shadow-[0_1px_0_rgba(0,0,0,0.03)]'
      )}
    >
      <div className="mx-auto grid h-14 w-full max-w-6xl grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 px-3 sm:gap-3 md:px-4 lg:px-6">
        {/* Mobile menu button */}
        <div className="flex items-center gap-2 justify-self-start">
          <div className="md:hidden">
            <Drawer
              title="Navigate"
              side="left"
              contentClassName="bg-surface1 text-fg"
              trigger={
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className={cn(
                    'h-9 w-9 rounded-xl p-0 text-muted-fg hover:text-fg',
                    transparencyEnabled ? 'border-border/70 bg-surface1/80 hover:bg-surface2' : 'border-border hover:bg-surface2'
                  )}
                  aria-label="Open navigation"
                >
                  <Menu className="h-4 w-4" aria-hidden />
                </Button>
              }
            >
              <nav className="mt-4 flex flex-col gap-1" aria-label="Mobile navigation">
                {navItems.map((item) => {
                  const active = location.pathname.startsWith(item.to)
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      className={cn(
                        'flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition',
                        active ? 'bg-primary/10 text-primary' : 'text-muted-fg hover:bg-muted/50 hover:text-fg'
                      )}
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
          <Link to="/" className="flex items-center gap-2 rounded-xl px-2 py-1 transition hover:bg-muted/60">
            <img src="/icons/logo-192.png" alt="" className="h-7 w-7 rounded" />
            <span className="hidden text-sm font-semibold text-text sm:inline">Webapp Factory</span>
          </Link>
        </div>

        {/* Search / Command palette */}
        <div className="hidden w-full justify-self-center px-2 lg:flex lg:justify-center">
          <div className="w-full max-w-lg">
            <Button
              type="button"
              variant="outline"
              className={cn(
                'group flex w-full items-center gap-3 rounded-2xl border-border/70 bg-surface1 px-3 py-2 text-left text-sm text-muted',
                'hover:border-border/90 hover:bg-surface2 hover:text-fg'
              )}
              onClick={() => {
                /* open command palette */
              }}
              aria-label="Search (⌘K)"
            >
              <Search className="h-4 w-4 opacity-70 transition group-hover:opacity-90" aria-hidden />
              <span className="truncate">Search or jump to…</span>
              <kbd className="ml-auto flex items-center gap-1 rounded border border-border/80 px-1.5 py-0.5 text-[11px] text-muted">
                ⌘
                <span className="text-xs">K</span>
              </kbd>
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-end gap-1 justify-self-end sm:gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="inline-flex h-9 w-9 rounded-xl p-0 text-muted-fg hover:text-fg sm:hidden"
            onClick={() => {
              /* open command palette */
            }}
            aria-label="Open search"
          >
            <Search className="h-4 w-4" aria-hidden />
          </Button>

          {/* Actions: theme, notifications, account */}
          {shouldShowTheme ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="inline-flex h-9 w-9 rounded-xl p-0 text-muted-fg hover:text-fg"
              onClick={() => setMode(mode === 'dark' ? 'light' : 'dark')}
              aria-label={`Switch to ${mode === 'dark' ? 'light' : 'dark'} mode`}
            >
              {mode === 'dark' ? <Moon className="h-4 w-4" aria-hidden /> : <Sun className="h-4 w-4" aria-hidden />}
            </Button>
          ) : null}
          {showNotifications ? <NotificationCenterButton /> : null}
          {actions ?? (
            <button
              className={cn(
                'inline-flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-border transition',
                'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[hsl(var(--ring))]'
              )}
              aria-label="Account"
            >
              <div className="flex h-full w-full items-center justify-center rounded-full bg-gradient-primary text-sm font-semibold text-white">
                U
              </div>
            </button>
          )}
        </div>
      </div>
    </header>
  )
}
