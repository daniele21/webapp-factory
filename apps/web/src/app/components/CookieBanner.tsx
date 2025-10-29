/**
 * CookieBanner
 * Improved UI using the project's design-system components.
 * - Uses `SwitchField` and `Button` from design-system
 * - Adds an inline cookie icon and improved layout
 * - Preserves existing consent logic and server notification
 */
import { useEffect, useMemo, useState } from 'react'
import { useAppConfig } from '@config/src/provider'
import { useCookieConsent } from '@/lib/useCookieConsent'
import {
	OPEN_COOKIE_PREFERENCES_EVENT,
	type ConsentMap,
} from '@/lib/cookieConsentEvents'
import { SwitchField } from '@/app/components/design-system'
import { Button } from '@/app/components/design-system/controls'

// Minimal inline cookie SVG to avoid extra icon dependencies
function CookieIconSVG(props: React.SVGProps<SVGSVGElement>) {
	return (
		<svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
			<circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
			<circle cx="9" cy="9" r="0.8" fill="currentColor" />
			<circle cx="14" cy="11" r="0.7" fill="currentColor" />
			<circle cx="11" cy="15" r="0.6" fill="currentColor" />
		</svg>
	)
}

type CookieCategory = {
	id: string
	label: string
	description?: string
	isEssential?: boolean
}

const CONSENT_COOKIE_NAME = 'wf_cookie_consent'

function hasConsentCookie() {
	if (typeof document === 'undefined') return false
	return (document.cookie || '').split('; ').some((item) => item.startsWith(`${CONSENT_COOKIE_NAME}=`))
}

function notifyServer(choices: ConsentMap) {
	if (typeof navigator === 'undefined') return
	const payload = JSON.stringify({ choices })
	if (typeof navigator.sendBeacon === 'function') {
		try {
			const blob = new Blob([payload], { type: 'application/json' })
			navigator.sendBeacon('/api/consent', blob)
			return
		} catch {
			// Fallback to fetch below
		}
	}

	fetch('/api/consent', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: payload,
		keepalive: true,
	}).catch(() => {
		// Ignore failures; client cannot guarantee delivery
	})
}

export function CookieBanner() {
	const { config: cfg } = useAppConfig()
	const categories = useMemo<CookieCategory[]>(() => {
		return cfg?.cookies?.categories ?? [
			{ id: 'necessary', label: 'Strictly necessary', description: 'Required for core functionality', isEssential: true },
		]
	}, [cfg?.cookies?.categories])
	const defaults = cfg?.cookies?.default ?? ['necessary']
	const { consent, acceptAll, rejectAll, update } = useCookieConsent(defaults)
	const [showBanner, setShowBanner] = useState(() => !hasConsentCookie())
	const [manageOpen, setManageOpen] = useState(false)

	useEffect(() => {
		if (typeof window === 'undefined') return
		const open = () => {
			setManageOpen(true)
			setShowBanner(false)
		}
		window.addEventListener(OPEN_COOKIE_PREFERENCES_EVENT, open)
		return () => window.removeEventListener(OPEN_COOKIE_PREFERENCES_EVENT, open)
	}, [])

	useEffect(() => {
		if (hasConsentCookie()) setShowBanner(false)
	}, [consent])

	const allCategoryIds = useMemo(() => categories.map((cat) => cat.id), [categories])

	const handleAcceptAll = () => {
		acceptAll(allCategoryIds)
		setShowBanner(false)
		setManageOpen(false)
		notifyServer(Object.fromEntries(allCategoryIds.map((id) => [id, true])))
	}

	const handleRejectAll = () => {
		rejectAll(allCategoryIds)
		setShowBanner(false)
		setManageOpen(false)
		notifyServer(Object.fromEntries(allCategoryIds.map((id) => [id, id === 'necessary'])))
	}

	const handleSave = () => {
		setManageOpen(false)
		setShowBanner(false)
		notifyServer(consent)
	}

	return (
		<>
			{showBanner && (
				<div aria-live="polite" className="fixed inset-x-4 bottom-6 z-50 md:inset-x-8">
					<div className="mx-auto max-w-3xl">
						<div className="flex flex-col gap-4 rounded-3xl border border-border/70 bg-surface1/95 p-5 shadow-[0_20px_45px_-15px_rgba(15,23,42,0.45)] backdrop-blur-md transition-all duration-200 supports-[backdrop-filter]:backdrop-blur-xl md:flex-row md:items-center md:gap-6">
							<div className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-accent/10 text-accent">
								<CookieIconSVG className="h-6 w-6" />
							</div>
							<div className="flex-1 text-sm text-muted-fg">
								<div className="text-base font-semibold text-text">We use cookies</div>
								<p className="mt-1 leading-relaxed">
									We use essential cookies to make this experience work. Optional analytics help us learn what works best for you.
								</p>
								<Button type="button" variant="ghost" size="sm" className="mt-3 px-0 text-sm font-medium text-accent hover:text-accent" onClick={() => setManageOpen(true)}>
									Review preferences
								</Button>
							</div>
							<div className="flex shrink-0 flex-col gap-2 md:flex-row">
								<Button type="button" variant="outline" className="md:min-w-[120px]" onClick={handleRejectAll}>
									Reject optional
								</Button>
								<Button type="button" variant="default" className="md:min-w-[120px]" onClick={handleAcceptAll}>
									Accept all
								</Button>
							</div>
						</div>
					</div>
				</div>
			)}

			{manageOpen && (
				<div
					role="dialog"
					aria-modal="true"
					aria-label="Cookie preferences"
					className="fixed inset-0 z-[60] flex items-center justify-center p-6"
				>
					<div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setManageOpen(false)} />
					<div className="relative z-10 w-full max-w-2xl rounded-3xl border border-border/60 bg-surface1/98 p-8 font-normal shadow-[0_35px_80px_-40px_rgba(15,23,42,0.8)]">
						<div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
							<div>
								<h2 className="text-lg font-semibold text-text">Cookie preferences</h2>
								<p className="text-sm text-muted-fg">
									Choose which optional cookies we can use. You can update your decision whenever you like.
								</p>
							</div>
							<div className="flex items-center gap-3 rounded-2xl bg-accent/10 px-3 py-2 text-accent">
								<CookieIconSVG className="h-5 w-5" />
								<span className="text-xs font-semibold uppercase tracking-[0.18em]">Privacy first</span>
							</div>
						</div>

						<div className="mt-6 space-y-4">
							{categories.map((category) => {
								const checked = Boolean(consent[category.id])
								return (
									<div
										key={category.id}
										className="flex items-start justify-between gap-4 rounded-2xl border border-border/60 bg-surface2/80 p-5 transition hover:border-accent/50 hover:shadow-md"
									>
										<div>
											<div className="font-medium text-text">
												{category.label}
												{category.isEssential ? ' (required)' : ''}
											</div>
											{category.description && (
												<p className="mt-1 text-sm text-muted-fg">{category.description}</p>
											)}
										</div>
										{category.isEssential ? (
											<span className="text-xs font-medium uppercase tracking-wide text-muted-fg">Always on</span>
										) : (
											<SwitchField
												checked={checked}
												onCheckedChange={(val: boolean) => update(category.id, Boolean(val))}
												aria-label={`Toggle ${category.label}`}
											/>
										)}
									</div>
								)
							})}
						</div>

						<div className="mt-8 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
							<div className="flex gap-2">
								<Button type="button" variant="outline" onClick={handleRejectAll}>
									Reject optional
								</Button>
								<Button type="button" variant="default" onClick={handleAcceptAll}>
									Accept all
								</Button>
							</div>
							<div className="flex gap-2">
								<Button type="button" variant="ghost" onClick={() => setManageOpen(false)}>
									Cancel
								</Button>
								<Button type="button" variant="default" onClick={handleSave}>
									Save preferences
								</Button>
							</div>
						</div>
					</div>
				</div>
			)}
		</>
	)
}


export default CookieBanner
