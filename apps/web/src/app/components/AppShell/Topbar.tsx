import { useTheme } from '../../theme/ThemeProvider'

export function Topbar() {
  const { mode, setMode } = useTheme()

  return (
    <header
      className="sticky top-0 z-40 h-14 w-full border-b border-border
                 bg-surface1/95 backdrop-blur supports-[backdrop-filter]:bg-surface1/80"
    >
      <div className="mx-auto flex h-full items-center gap-2 px-3 md:px-4">
        {/* Mobile menu button */}
        <button
          className="md:hidden inline-flex h-9 w-9 items-center justify-center rounded-lg
                     border border-border hover:bg-surface2 transition focus-visible:outline-2
                     focus-visible:outline-offset-2 focus-visible:outline-[hsl(var(--ring))]"
          aria-label="Open navigation"
        >
          ☰
        </button>

        {/* Brand */}
        <div className="flex items-center gap-2">
          <img src="/icons/logo-192.png" alt="" className="h-6 w-6 rounded" />
          <span className="font-semibold hidden sm:inline text-text">Webapp Factory</span>
        </div>

        {/* Search / Command palette */}
        <div className="mx-2 flex-1 max-w-xl">
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

        {/* Actions: theme, notifications, account */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMode(mode === 'dark' ? 'light' : mode === 'light' ? 'system' : 'dark')}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border hover:bg-surface2 transition
                       focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[hsl(var(--ring))]"
            aria-label="Toggle theme"
          >
            {mode === 'dark' ? '🌙' : mode === 'light' ? '☀️' : '🌓'}
          </button>
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
          <button
            className="inline-flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-border
                       focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[hsl(var(--ring))]"
            aria-label="Account"
          >
            <div className="h-full w-full bg-gradient-primary flex items-center justify-center text-white font-semibold text-sm">
              U
            </div>
          </button>
        </div>
      </div>
    </header>
  )
}
