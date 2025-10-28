import { Topbar } from './Topbar'
import { Sidebar } from './Sidebar'
import { MobileTabs } from './MobileTabs'

export function AppShell({ children }: { children: React.ReactNode }) {
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

      <Topbar />

      <div className="flex">
        {/* Desktop sidebar */}
        <Sidebar className="hidden md:flex" />
        <main id="main" className="flex-1 min-w-0 px-4 py-4 md:px-6 md:py-6 pb-20 md:pb-6">
          {children}
        </main>
      </div>

      {/* Mobile bottom tabs */}
      <MobileTabs className="md:hidden" />
    </div>
  )
}
