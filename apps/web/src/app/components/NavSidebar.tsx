import { SidebarNav } from './factory'
import { NAV, getVisibleNav } from '../../../../../packages/config/nav'
import { useAppConfig } from '../../config/provider'

type Props = {
  mobile?: boolean
  onClose?: () => void
}

// Thin app-specific wrapper that composes the reusable factory SidebarNav
export default function NavSidebar({ mobile = false, onClose }: Props) {
  const containerClass = mobile
    ? 'w-full max-w-xs h-full p-4 space-y-4 bg-card border-r border-border'
    : 'relative w-64 min-h-screen p-5 space-y-6 bg-card/80 border-r border-border backdrop-blur-md overflow-hidden'

  const { config } = useAppConfig()
  const items = getVisibleNav(config, null)

  return (
    <aside className={`app-sidebar ${containerClass}`}>
      {!mobile && (
        <div className="pointer-events-none absolute -top-16 -right-10 h-48 w-48 rounded-full bg-gradient-to-br from-primary/20 via-secondary/10 to-accent/5 blur-3xl opacity-70" />
      )}

      {/* Delegate rendering of the navigation list to the factory component */}
      <SidebarNav items={items as any} footerSlot={mobile ? undefined : undefined} />
    </aside>
  )
}
