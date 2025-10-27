import { Outlet } from 'react-router-dom'
import { useIsDesktop } from './lib/responsive'
import DesktopLayout from './layouts/DesktopLayout'
import MobileLayout from './layouts/MobileLayout'
import { ToastProvider } from './components/factory'

export default function App() {
  const isDesktop = useIsDesktop()
  const Shell = isDesktop ? DesktopLayout : MobileLayout
  return (
    <ToastProvider>
      <Shell>
        <Outlet />
      </Shell>
    </ToastProvider>
  )
}
