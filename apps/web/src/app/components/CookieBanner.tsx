import { useEffect, useMemo, useState } from 'react'
import { useAppConfig } from '@config/src/provider'
import { useCookieConsent } from '@/lib/useCookieConsent'
import {
	OPEN_COOKIE_PREFERENCES_EVENT,
	type ConsentMap,
} from '@/lib/cookieConsentEvents'

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
					<div className="mx-auto max-w-3xl rounded-2xl border border-border bg-surface1/98 p-4 shadow-lg backdrop-blur">
						<div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
							<div className="space-y-1 text-sm text-muted-fg">
								<div className="text-base font-semibold text-text">We use cookies</div>
								<p>
									We use necessary cookies to make the site work. Optional cookies help us improve analytics and personalise content.
									<button
										type="button"
										onClick={() => setManageOpen(true)}
										className="ml-2 font-medium underline"
									>
										Manage
									</button>
								</p>
							</div>
							<div className="flex shrink-0 gap-2">
								<button
									type="button"
									onClick={handleRejectAll}
									className="rounded-md border border-border px-3 py-2 text-sm font-medium transition hover:bg-surface2"
								>
									Reject all
								</button>
								<button
									type="button"
									onClick={handleAcceptAll}
									className="rounded-md bg-accent px-3 py-2 text-sm font-medium text-accent-fg transition hover:brightness-95"
								>
									Accept all
								</button>
							</div>
						</div>
					</div>
				</div>
			)}

			{manageOpen && (
				<CookieManageModal
					categories={categories}
					consent={consent}
					onClose={() => setManageOpen(false)}
					onToggle={(id, value) => update(id, value)}
					onAcceptAll={handleAcceptAll}
					onRejectAll={handleRejectAll}
					onSave={handleSave}
				/>
			)}
		</>
	)
}

type CookieManageModalProps = {
	categories: CookieCategory[]
	consent: ConsentMap
	onToggle: (id: string, value: boolean) => void
	onClose: () => void
	onSave: () => void
	onAcceptAll: () => void
	onRejectAll: () => void
}

function CookieManageModal({
	categories,
	consent,
	onToggle,
	onClose,
	onSave,
	onAcceptAll,
	onRejectAll,
}: CookieManageModalProps) {
	useEffect(() => {
		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key === 'Escape') onClose()
		}
		window.addEventListener('keydown', onKeyDown)
		return () => window.removeEventListener('keydown', onKeyDown)
	}, [onClose])

	return (
		<div
			role="dialog"
			aria-modal="true"
			aria-label="Cookie preferences"
			className="fixed inset-0 z-[60] flex items-center justify-center p-4"
		>
			<div className="absolute inset-0 bg-black/50" onClick={onClose} />
			<div className="relative z-10 w-full max-w-2xl rounded-2xl border border-border bg-surface1 p-6 shadow-xl">
				<div className="flex flex-col gap-2">
					<h2 className="text-lg font-semibold text-text">Cookie preferences</h2>
					<p className="text-sm text-muted-fg">
						Choose which optional cookies we can use. You can update your choice at any time.
					</p>
				</div>

				<div className="mt-4 space-y-3">
					{categories.map((category) => {
						const checked = Boolean(consent[category.id])
						return (
							<div
								key={category.id}
								className="flex items-start justify-between gap-4 rounded-xl border border-border bg-surface2/60 p-4"
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
									<span className="text-xs font-medium uppercase tracking-wide text-muted-fg">
										Always on
									</span>
								) : (
									<label className="inline-flex items-center gap-2 text-sm text-text">
										<input
											type="checkbox"
											checked={checked}
											onChange={(event) => onToggle(category.id, event.target.checked)}
											className="h-4 w-4 rounded border border-border accent-accent"
										/>
										<span>{checked ? 'Allowed' : 'Blocked'}</span>
									</label>
								)}
							</div>
						)
					})}
				</div>

				<div className="mt-6 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
					<div className="flex gap-2">
						<button
							type="button"
							onClick={onRejectAll}
							className="rounded-md border border-border px-3 py-2 text-sm font-medium transition hover:bg-surface2"
						>
							Reject optional
						</button>
						<button
							type="button"
							onClick={onAcceptAll}
							className="rounded-md bg-accent px-3 py-2 text-sm font-medium text-accent-fg transition hover:brightness-95"
						>
							Accept all
						</button>
					</div>
					<div className="flex gap-2">
						<button
							type="button"
							onClick={onClose}
							className="rounded-md border border-border px-3 py-2 text-sm font-medium transition hover:bg-surface2"
						>
							Cancel
						</button>
						<button
							type="button"
							onClick={onSave}
							className="rounded-md bg-accent px-3 py-2 text-sm font-medium text-accent-fg transition hover:brightness-95"
						>
							Save preferences
						</button>
					</div>
				</div>
			</div>
		</div>
	)
}

export default CookieBanner
