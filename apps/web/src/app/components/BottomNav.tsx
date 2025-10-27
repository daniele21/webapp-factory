import { BottomTabs } from './factory'
import { NAV } from '../../../../../packages/config/nav'

// App-specific bottom navigation: delegate mobile tabs to factory BottomTabs and
// keep a small desktop footer.
export default function BottomNav() {
  return (
    <>
      <BottomTabs items={NAV as any} />

      {/* Desktop footer (subtle) */}
      <footer className="hidden md:flex items-center justify-between p-3 border-t border-border bg-card">
        <div className="text-sm">© {new Date().getFullYear()} Webapp Factory</div>
        <div className="text-sm text-muted-fg">Status: All systems operational</div>
      </footer>
    </>
  )
}
