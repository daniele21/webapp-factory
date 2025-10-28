// NOTE: this is an app-specific wrapper and is deprecated in favor of the
// factory `TopBar` exported from `components/factory`.
//
// The shared `TopBar` provides the canonical mobile behavior (drawer + title)
// and should be imported like:
//   import { TopBar } from './components/factory'
//
// Keep this wrapper only if you need app-specific tweaks. If you remove it,
// update imports in `layouts/MobileLayout.tsx` to use the factory `TopBar`.

import { ThemeSwitch } from './ThemeSwitch'
import { AuthMenuConnected } from './AuthMenuConnected'

type Props = {
  onOpenNav?: () => void
}

// App-specific top bar implemented as a thin composition of factory primitives.
export default function TopBar({ onOpenNav }: Props) {
  return (
    <header className="app-topbar sticky top-0 z-30 border-b border-border p-3 backdrop-blur-glass bg-card/60">
      <div className="flex items-center gap-3 w-full">
        <div className="flex items-center gap-3">
          <button onClick={onOpenNav} aria-label="open navigation" className="md:hidden btn-ghost p-2 rounded-md focus-visible-only">
            {/* simple hamburger */}
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-fg">
              <path d="M3 12h18M3 6h18M3 18h18"></path>
            </svg>
          </button>
          <h1 className="font-semibold text-lg">Webapp Factory</h1>
        </div>

        {/* Use the factory Header to render title/visual and keep actions consistent */}
        <div className="ml-auto flex items-center gap-3">
          <ThemeSwitch />
          <AuthMenuConnected />
        </div>
      </div>
    </header>
  )
}
