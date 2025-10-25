import { ThemeSwitch } from './ThemeSwitch'

type Props = {
  onOpenNav?: () => void
}

export default function TopBar({ onOpenNav }: Props){
  return (
    <header className="app-topbar sticky top-0 z-30 border-b border-border p-3 flex items-center justify-between backdrop-blur-glass bg-card/60">
      <div className="flex items-center gap-3">
        <button onClick={onOpenNav} aria-label="open navigation" className="md:hidden btn-ghost p-2 rounded-md focus-visible-only">
          {/* simple hamburger */}
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-fg">
            <path d="M3 12h18M3 6h18M3 18h18"></path>
          </svg>
        </button>
        <h1 className="font-semibold text-lg">Webapp Factory</h1>
      </div>
      <div className="flex items-center gap-3">
        <ThemeSwitch />
      </div>
    </header>
  )
}
