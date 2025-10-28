import { SidebarNav } from './factory'
import { NAV, getVisibleNav } from '../../../../../packages/config/nav'
import { useAppConfig } from '../../config/provider'
import { useAuth } from '../providers/AuthProvider'
import {
  Home,
  LayoutDashboard,
  Palette,
  Cookie,
  FileText,
  User,
  CreditCard,
  Settings,
} from 'lucide-react'

type Props = {
  mobile?: boolean
  onClose?: () => void
}

// Map route paths to icons (fallback)
const ICON_MAP: Record<string, React.ReactNode> = {
  '/': <Home className="h-4 w-4" aria-hidden="true" />,
  '/home': <LayoutDashboard className="h-4 w-4" aria-hidden="true" />,
  '/ui-library': <Palette className="h-4 w-4" aria-hidden="true" />,
  '/legal/cookies': <Cookie className="h-4 w-4" aria-hidden="true" />,
  '/legal/terms': <FileText className="h-4 w-4" aria-hidden="true" />,
}

// Map icon name strings (from app.config.json) to components
const ICON_NAME_MAP: Record<string, React.ReactNode> = {
  Home: <Home className="h-4 w-4" aria-hidden="true" />,
  Dashboard: <LayoutDashboard className="h-4 w-4" aria-hidden="true" />,
  Users: <User className="h-4 w-4" aria-hidden="true" />,
  CreditCard: <CreditCard className="h-4 w-4" aria-hidden="true" />,
  Settings: <Settings className="h-4 w-4" aria-hidden="true" />,
  Palette: <Palette className="h-4 w-4" aria-hidden="true" />,
  Cookie: <Cookie className="h-4 w-4" aria-hidden="true" />,
  FileText: <FileText className="h-4 w-4" aria-hidden="true" />,
}

// Thin app-specific wrapper that composes the reusable factory SidebarNav
export default function NavSidebar({ mobile = false, onClose }: Props) {
  const containerClass = mobile
    ? 'w-full max-w-xs h-full p-4 space-y-4 bg-card border-r border-border'
    : 'relative w-64 min-h-screen p-5 space-y-6 bg-card/80 border-r border-border backdrop-blur-md overflow-hidden'

  const { config } = useAppConfig()
  const { user } = useAuth()
  // map auth user to the minimal shape expected by getVisibleNav
  // forward roles array and plan (if any)
  const visibleUser = user ? { role: user.roles?.[0], roles: user.roles ?? [], plan: (user as any).plan ?? undefined } : null
  // In dev, if no authenticated user, expose a mock admin/pro user so dev nav items are visible
  const devUser =
    !visibleUser && import.meta.env.MODE !== 'production'
      ? { role: 'admin', plan: 'pro' }
      : visibleUser
  const rawItems = getVisibleNav(config, devUser)
  
  // Enrich items with icons. Prefer `item.icon` (string from runtime config) and fall back to path map.
  const items = rawItems.map((item) => {
    let resolvedIcon: React.ReactNode | undefined
    if (item.icon && typeof item.icon === 'string') {
      resolvedIcon = ICON_NAME_MAP[item.icon] || ICON_MAP[item.to]
    } else {
      resolvedIcon = ICON_MAP[item.to]
    }
    return {
      ...item,
      icon: resolvedIcon,
    }
  })

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
