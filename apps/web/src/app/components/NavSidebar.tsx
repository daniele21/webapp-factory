import { Link, useLocation } from 'react-router-dom'
import { features } from '../lib/featureFlags'

const nav = [
  { to: '/', label: 'Home' },
  { to: '/dashboard', label: 'Dashboard', feature: 'dashboard.view' as const }
]

export default function NavSidebar() {
  const { pathname } = useLocation()
  return (
    <nav className="p-4 space-y-2">
      {nav.map((item) => {
        if (item.feature && !features[item.feature]?.enabled) return null
        const active = pathname === item.to
        return (
          <Link key={item.to} className={active ? 'font-semibold' : ''} to={item.to}>
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
