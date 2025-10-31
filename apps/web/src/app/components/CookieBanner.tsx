/**
 * CookieBanner
 * Refined UX with configurable transparency, inline toggles, and accessible preference dialog.
 */
import { useCallback, useEffect, useMemo, useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import * as SwitchPrimitive from '@radix-ui/react-switch'
import { X } from 'lucide-react'
import { useAppConfig } from '@config/src/provider'
import { useCookieConsent } from '@/lib/useCookieConsent'
import {
	OPEN_COOKIE_PREFERENCES_EVENT,
	type ConsentMap,
} from '@/lib/cookieConsentEvents'
import { cn } from '@/app/lib/cn'
import { useTransparencyPreference } from '@/app/lib/useTransparencyPreference'
import { Badge, Button } from '@/app/components/design-system/controls'

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

type CategoryToggleProps = {
	category: CookieCategory
	checked: boolean
	onChange: (value: boolean) => void
	compact?: boolean
	transparencyEnabled: boolean
}

function CategoryToggle({ category, checked, onChange, compact = false, transparencyEnabled }: CategoryToggleProps) {
	const isEssential = Boolean(category.isEssential)
	const spacing = compact ? 'p-3' : 'p-5'
	const hoverBorder = compact ? 'hover:border-accent/40' : 'hover:border-accent/60'
	const hoverBg = transparencyEnabled ? 'hover:bg-surface2/90' : compact ? 'hover:bg-surface2' : 'hover:bg-surface3'
	return (
		<div
			className={cn(
				'flex items-start justify-between gap-4 rounded-2xl border border-border/60 transition-colors',
				spacing,
				transparencyEnabled ? 'bg-surface2/80' : 'bg-surface2',
				hoverBorder,
				hoverBg,
				!compact && 'hover:shadow-md'
			)}
		>
			<div className="flex-1 space-y-1">
				<div className={cn('flex items-center gap-2', compact ? 'text-sm' : 'text-base')}>
					<span className="font-medium text-text">{category.label}</span>
					{!compact && (
						<Badge tone={isEssential ? 'neutral' : 'brand'}>{isEssential ? 'Required' : 'Optional'}</Badge>
					)}
				</div>
				{category.description ? (
					<p className={cn('text-muted-fg', compact ? 'text-xs leading-snug' : 'text-sm leading-relaxed')}>
						{category.description}
					</p>
				) : null}
				{compact && !isEssential ? (
					<span className="text-[11px] font-semibold uppercase tracking-wide text-muted-fg">Optional</span>
				) : null}
			</div>
			{isEssential ? (
				<span className="mt-1 text-xs font-semibold uppercase tracking-wide text-muted-fg">Always on</span>
			) : (
				<SwitchPrimitive.Root
					checked={checked}
					onCheckedChange={(value) => onChange(Boolean(value))}
					aria-label={`Toggle ${category.label} cookies`}
					className="relative mt-1 inline-flex h-6 w-11 shrink-0 items-center rounded-full border border-border/60 bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-bg data-[state=checked]:border-primary data-[state=checked]:bg-primary"
				>
					<SwitchPrimitive.Thumb className="absolute left-0.5 top-1/2 h-5 w-5 -translate-y-1/2 rounded-full bg-card shadow-sm transition-transform data-[state=checked]:translate-x-[18px]" />
				</SwitchPrimitive.Root>
			)}
		</div>
	)
}

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
	const transparencyEnabled = useTransparencyPreference()
	const categories = useMemo<CookieCategory[]>(() => {
		return (
			cfg?.cookies?.categories ?? [
				{ id: 'necessary', label: 'Strictly necessary', description: 'Required for core functionality', isEssential: true },
			]
		)
	}, [cfg?.cookies?.categories])
	const defaults = cfg?.cookies?.default ?? ['necessary']
	const { consent, setConsent } = useCookieConsent(defaults)
	const [showBanner, setShowBanner] = useState(() => !hasConsentCookie())
	const [manageOpen, setManageOpen] = useState(false)
	const normalizeConsent = useCallback(
		(source: ConsentMap): ConsentMap =>
			Object.fromEntries(
				categories.map((category) => [category.id, category.isEssential ? true : Boolean(source[category.id])])
			) as ConsentMap,
		[categories]
	)
	const [draft, setDraft] = useState<ConsentMap>(() => normalizeConsent(consent))

	const optionalCategories = useMemo(
		() => categories.filter((category) => !category.isEssential),
		[categories]
	)
	const enabledOptionalCount = useMemo(
		() => optionalCategories.filter((category) => Boolean(draft[category.id])).length,
		[draft, optionalCategories]
	)
	const hasOptional = optionalCategories.length > 0

	const openManage = useCallback(() => {
		setManageOpen(true)
		setShowBanner(false)
	}, [])

	const handleDialogChange = useCallback(
		(open: boolean) => {
			if (open) {
				setManageOpen(true)
				setShowBanner(false)
			} else {
				setManageOpen(false)
				setShowBanner(!hasConsentCookie())
			}
		},
		[]
	)

	useEffect(() => {
		if (typeof window === 'undefined') return
		const openPreferences = () => {
			openManage()
		}
		window.addEventListener(OPEN_COOKIE_PREFERENCES_EVENT, openPreferences)
		return () => window.removeEventListener(OPEN_COOKIE_PREFERENCES_EVENT, openPreferences)
	}, [openManage])

	useEffect(() => {
		setDraft(normalizeConsent(consent))
		if (hasConsentCookie()) setShowBanner(false)
	}, [consent, normalizeConsent])

	const finalizeConsent = (choices: ConsentMap) => {
		notifyServer(choices)
		setManageOpen(false)
		setShowBanner(false)
	}

	const handleAcceptAll = () => {
		const accepted = Object.fromEntries(categories.map((category) => [category.id, true])) as ConsentMap
		const normalized = normalizeConsent(accepted)
		setDraft(normalized)
		setConsent(normalized)
		finalizeConsent(normalized)
	}

	const handleRejectAll = () => {
		const rejected = Object.fromEntries(
			categories.map((category) => [category.id, Boolean(category.isEssential)])
		) as ConsentMap
		const normalized = normalizeConsent(rejected)
		setDraft(normalized)
		setConsent(normalized)
		finalizeConsent(normalized)
	}

const handleSave = () => {
	const normalized = normalizeConsent(draft)
	setConsent(normalized)
		finalizeConsent(normalized)
	}

	const handleCancel = () => {
		setManageOpen(false)
		setShowBanner(!hasConsentCookie())
	}

	const optionalStatus = hasOptional
		? enabledOptionalCount === optionalCategories.length
			? 'All optional cookies enabled'
			: `${enabledOptionalCount} of ${optionalCategories.length} optional cookies enabled`
		: null

	return (
		<>
			{showBanner && (
				<div aria-live="polite" className="fixed inset-x-0 bottom-0 z-50 px-4 pb-4">
					<div
						className={cn(
							'mx-auto flex w-full max-w-5xl flex-col gap-3 rounded-xl border border-border/60 bg-surface1/95 px-4 py-3 shadow-[0_16px_30px_-20px_rgba(15,23,42,0.45)] sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-5 sm:py-3',
							transparencyEnabled ? 'supports-[backdrop-filter]:backdrop-blur-xl' : 'bg-surface1'
						)}
					>
						<div className="flex items-start gap-3 text-sm text-muted-fg sm:flex-1">
							<div className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent/15 text-accent">
								<CookieIconSVG className="h-4 w-4" />
							</div>
							<p className="leading-relaxed">
								We use essential cookies to keep things running. Optional analytics help us improve.
								{optionalStatus ? (
									<span className="ml-1 text-xs text-muted-fg/80">({optionalStatus})</span>
								) : null}{' '}
								<button
									type="button"
									onClick={openManage}
									className="font-semibold text-accent underline underline-offset-4 hover:text-accent/90"
								>
									Learn more
								</button>
							</p>
						</div>
						<div className="flex flex-wrap items-center gap-2 sm:flex-shrink-0">
							<Button type="button" variant="default" size="sm" onClick={handleAcceptAll}>
								Accept all
							</Button>
							<Button type="button" variant="outline" size="sm" onClick={handleRejectAll}>
								Reject optional
							</Button>
							<Button type="button" variant="ghost" size="sm" className="font-semibold text-accent hover:text-accent/90" onClick={openManage}>
								Customize
							</Button>
						</div>
					</div>
				</div>
			)}

			<Dialog.Root open={manageOpen} onOpenChange={handleDialogChange}>
				<Dialog.Portal>
					<Dialog.Overlay
						className={cn(
							'fixed inset-0 z-[60] transition-opacity',
							transparencyEnabled ? 'bg-black/70 backdrop-blur-sm' : 'bg-black/90'
						)}
					/>
					<Dialog.Content
						className={cn(
							'fixed inset-x-4 top-[10%] z-[61] mx-auto max-w-2xl space-y-6 rounded-2xl border border-border/60 p-6 shadow-[0_30px_70px_-35px_rgba(15,23,42,0.75)] focus:outline-none md:top-1/2 md:-translate-y-1/2',
							transparencyEnabled ? 'bg-surface1/98' : 'bg-surface1'
						)}
					>
						<button
							type="button"
							className="absolute right-6 top-6 inline-flex h-9 w-9 items-center justify-center rounded-full border border-border/70 text-muted-fg transition hover:bg-surface2"
							onClick={handleCancel}
							aria-label="Close cookie preferences"
						>
							<X className="h-4 w-4" />
						</button>
						<div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
							<div>
								<Dialog.Title className="text-lg font-semibold text-text">Cookie preferences</Dialog.Title>
								<Dialog.Description className="mt-1 text-sm text-muted-fg">
									Tailor which optional cookies we can use. Your choices stick around for 12 months and sync on this device.
								</Dialog.Description>
							</div>
							<div className="flex items-center gap-3 rounded-2xl bg-accent/10 px-3 py-2 text-accent">
								<CookieIconSVG className="h-5 w-5" />
								<span className="text-xs font-semibold uppercase tracking-[0.18em]">Privacy first</span>
							</div>
						</div>

						<div className="space-y-4">
					{categories.map((category) => (
						<CategoryToggle
							key={category.id}
							category={category}
							checked={category.isEssential ? true : Boolean(draft[category.id])}
							onChange={(value) => setDraft((prev) => normalizeConsent({ ...prev, [category.id]: value }))}
							transparencyEnabled={transparencyEnabled}
						/>
					))}
						</div>

						<div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
							<p className="text-xs text-muted-fg">
								You can revisit this panel anytime from the cookie settings link in the footer.
							</p>
							<div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-2">
								<Button type="button" variant="ghost" onClick={handleCancel}>
									Cancel
								</Button>
								<Button type="button" variant="outline" onClick={handleRejectAll}>
									Reject optional
								</Button>
								<Button type="button" variant="secondary" onClick={handleAcceptAll}>
									Accept all
								</Button>
								<Button type="button" variant="default" onClick={handleSave}>
									Save preferences
								</Button>
							</div>
						</div>
					</Dialog.Content>
				</Dialog.Portal>
			</Dialog.Root>
		</>
	)
}

export default CookieBanner
