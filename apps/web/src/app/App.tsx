import { Outlet } from 'react-router-dom'
import { AppShell, ToastProvider } from './components/design-system'
import { AuthMenuConnected } from './components/AuthMenuConnected'
import { CookieBanner } from './components/CookieBanner'
import { useLoadAnalytics } from '@/lib/useLoadScriptIfConsent'

export default function App() {
	useLoadAnalytics()

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
			<CookieBanner />
		</ToastProvider>
	)
}
