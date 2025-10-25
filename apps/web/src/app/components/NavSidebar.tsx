import { Link, useLocation } from 'react-router-dom'
import { features } from '../lib/featureFlags'
import { NAV } from '../../../../../packages/config/nav'

export default function NavSidebar() {
  const { pathname } = useLocation()
  return (
    <nav className="p-4 space-y-2">
      {NAV.map((item) => {
        // feature flag check (some NAV entries may include a `feature` key)
        // use a safe cast to avoid TS index complaints
  const feature = (item as any).feature
  if (feature && !(features as any)[feature]?.enabled) return null
        const active = pathname === (item as any).to
        return (
          <Link key={(item as any).to} className={active ? 'font-semibold' : ''} to={(item as any).to}>
            {(item as any).label}
          </Link>
        )
      })}
    </nav>
  )
}
