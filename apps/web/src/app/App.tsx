import { Outlet } from 'react-router-dom'
import { useIsDesktop } from './lib/responsive'
import DesktopLayout from './layouts/DesktopLayout'
import MobileLayout from './layouts/MobileLayout'

export default function App() {
  const isDesktop = useIsDesktop()
  const Shell = isDesktop ? DesktopLayout : MobileLayout
  return (
    <Shell>
      <Outlet />
    </Shell>
  )
}
