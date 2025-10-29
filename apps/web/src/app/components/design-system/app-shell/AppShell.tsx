import type { ReactNode } from 'react'
import { Topbar } from './Topbar'
import { Sidebar } from './Sidebar'
import { MobileTabs } from './MobileTabs'
import type { AppShellNavItem } from './navItems'
import { DEFAULT_NAV_ITEMS } from './navItems'
import { Footer } from '../layout/Footer'
import { requestCookiePreferences } from '@/lib/cookieConsentEvents'

export type AppShellProps = {
  children: ReactNode
  topbarActions?: ReactNode
  navItems?: AppShellNavItem[]
}

export function AppShell({ children, topbarActions, navItems }: AppShellProps) {
  const items = navItems ?? DEFAULT_NAV_ITEMS
  const year = new Date().getFullYear()

  return (
    <div className="min-h-dvh bg-bg text-text">
      {/* Skip to content link for accessibility */}
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:m-4 focus:rounded-md
                   focus:bg-surface2 focus:px-3 focus:py-2 focus:shadow-md
                   focus:outline-2 focus:outline-offset-2 focus:outline-[hsl(var(--ring))]"
      >
        Skip to content
      </a>

      <Topbar actions={topbarActions} navItems={items} />

      <div className="flex">
        {/* Desktop sidebar */}
        <Sidebar className="hidden md:flex" items={items} />
        <main id="main" className="flex-1 min-w-0 px-4 py-4 md:px-6 md:py-6 pb-20 md:pb-6">
          {children}
        </main>
      </div>

      <Footer className="border-t border-border bg-surface1/80 text-muted-fg">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-4 text-sm md:flex-row md:items-center md:justify-between">
          <span>© {year} Webapp Factory</span>
          <div className="flex flex-wrap items-center gap-3">
            <a href="/legal/cookies" className="transition hover:text-text hover:underline">
              Cookie policy
            </a>
            <a href="/legal/terms" className="transition hover:text-text hover:underline">
              Terms
            </a>
            <button
              type="button"
              onClick={requestCookiePreferences}
              className="transition hover:text-text hover:underline"
            >
              Manage cookies
            </button>
          </div>
        </div>
      </Footer>

      {/* Mobile bottom tabs */}
      <MobileTabs className="md:hidden" items={items} />
    </div>
  )
}
