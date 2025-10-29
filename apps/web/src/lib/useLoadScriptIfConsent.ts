import { useEffect } from 'react'
import { useAppConfig } from '@config/src/provider'
import { useCookieConsent } from './useCookieConsent'

declare global {
	interface Window {
		dataLayer?: unknown[]
		gtag?: (...args: any[]) => void
		__wfAnalyticsLoaded?: boolean
	}
}

const SCRIPT_ID = 'wf-analytics-script'
const INLINE_ID = 'wf-analytics-inline'

export function useLoadAnalytics() {
	const { config: cfg } = useAppConfig()
	const defaults = cfg?.cookies?.default ?? ['necessary']
	const { consent } = useCookieConsent(defaults)

	useEffect(() => {
		if (typeof document === 'undefined' || typeof window === 'undefined') return
		const analyticsCfg = cfg?.analytics
		const isEnabled = analyticsCfg?.enabled ?? true
		if (!consent.statistics || !isEnabled) {
			if (window.__wfAnalyticsLoaded) {
				document.getElementById(SCRIPT_ID)?.remove()
				document.getElementById(INLINE_ID)?.remove()
				window.__wfAnalyticsLoaded = false
				window.dataLayer = undefined
				window.gtag = undefined
			}
			return
		}

		const gaId =
			analyticsCfg?.googleAnalyticsId ||
			(import.meta.env as Record<string, string | undefined>).VITE_PUBLIC_ANALYTICS_KEY
		if (!gaId) return

		if (window.__wfAnalyticsLoaded) return

		const script = document.createElement('script')
		script.id = SCRIPT_ID
		script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`
		script.async = true

		const inline = document.createElement('script')
		inline.id = INLINE_ID
		const configPayload = analyticsCfg?.googleAnalyticsConfig
			? `, ${JSON.stringify(analyticsCfg.googleAnalyticsConfig)}`
			: ''
		inline.innerHTML = `
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${gaId}'${configPayload});
`.trim()

		document.head.appendChild(script)
		document.head.appendChild(inline)

		window.dataLayer = window.dataLayer || []
		window.gtag =
			window.gtag ||
			function gtag(...args: any[]) {
				window.dataLayer?.push(args)
			}
		window.__wfAnalyticsLoaded = true

		return () => {
			document.getElementById(SCRIPT_ID)?.remove()
			document.getElementById(INLINE_ID)?.remove()
			window.__wfAnalyticsLoaded = false
			window.dataLayer = undefined
			window.gtag = undefined
		}
	}, [cfg, consent.statistics])
}
