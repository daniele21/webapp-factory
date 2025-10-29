import { Outlet } from 'react-router-dom'
import { AppShell, ToastProvider } from './components/design-system'
import { AuthMenuConnected } from './components/AuthMenuConnected'

export default function App() {
  return (
    <ToastProvider>
      <AppShell topbarActions={<AuthMenuConnected />}>
        <Outlet />
      </AppShell>
    </ToastProvider>
  )
}
