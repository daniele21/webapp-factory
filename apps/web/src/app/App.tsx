import { Outlet } from 'react-router-dom'
import { AppShell, ToastProvider } from './components/design-system'
import { AuthMenuConnected } from './components/AuthMenuConnected'

export default function App() {
  return (
    <ToastProvider>
      <AppShell
        topbarActions={(
          <div className="flex items-center gap-2">
            <AuthMenuConnected />
          </div>
        )}
      >
        <Outlet />
      </AppShell>
    </ToastProvider>
  )
}
