import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { AppShell, ToastProvider } from './components/design-system'
import { AuthMenuConnected } from './components/AuthMenuConnected'
import { CookieBanner } from './components/CookieBanner'
import { useLoadAnalytics } from '@/lib/useLoadScriptIfConsent'
import { useTransparencyPreference } from '@/app/lib/useTransparencyPreference'

export default function App() {
	useLoadAnalytics()
	const transparencyEnabled = useTransparencyPreference()

	useEffect(() => {
		if (typeof document === 'undefined') return
		const root = document.documentElement
		root.dataset.transparency = transparencyEnabled ? 'on' : 'off'
		return () => {
			root.dataset.transparency = 'on'
		}
	}, [transparencyEnabled])

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
