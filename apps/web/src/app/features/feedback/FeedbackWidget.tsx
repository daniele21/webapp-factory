import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { MessageCircle, X } from 'lucide-react'
import { useToast } from '@/app/components/design-system/overlays/ToastProvider'
import { cn } from '@/app/lib/cn'
import { Button } from '@/app/components/ui/button'
import { useTransparencyPreference } from '@/app/lib/useTransparencyPreference'
import { useAppConfig } from '@config/src/provider'
import { useAuth } from '@/app/providers/AuthProvider'
import { useSubmitFeedback } from './hooks'
import type { FeedbackPayload } from './types'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

type FeedbackFormState = {
	name: string
	email: string
	message: string
	pageUrl: string
}

type FeedbackFormErrors = Partial<Record<keyof FeedbackFormState, string>> & { general?: string }

const initialState: FeedbackFormState = { name: '', email: '', message: '', pageUrl: '' }

export const FeedbackWidget = () => {
	const transparencyEnabled = useTransparencyPreference()
	const { config } = useAppConfig()
	const { user, login } = useAuth()
	const requireAuth = config?.feedback?.requireAuth ?? false
	const { notify } = useToast()
	const [open, setOpen] = useState(false)
	const [form, setForm] = useState<FeedbackFormState>(initialState)
	const [errors, setErrors] = useState<FeedbackFormErrors>({})

	const submitFeedback = useSubmitFeedback()
	const isSubmitting = submitFeedback.isPending

	useEffect(() => {
		if (open && typeof window !== 'undefined') {
			setForm((current) => ({ ...current, pageUrl: window.location.href }))
		}
		if (!open) {
			setForm(initialState)
			setErrors({})
		}
	}, [open])

	const metadata = useMemo(() => {
		if (typeof navigator === 'undefined' && typeof window === 'undefined') return undefined
		const details: Record<string, unknown> = {}
		if (typeof navigator !== 'undefined' && navigator.language) {
			details.locale = navigator.language
		}
		if (typeof window !== 'undefined') {
			details.path = window.location.pathname
			if (typeof document !== 'undefined') {
				details.title = document.title
			}
		}
		return Object.keys(details).length > 0 ? details : undefined
	}, [])

	const overlayClasses = useMemo(() => {
		if (transparencyEnabled) {
			return 'bg-surface1/30 supports-[backdrop-filter]:backdrop-blur-md pointer-events-auto'
		}
		return 'bg-transparent pointer-events-auto'
	}, [transparencyEnabled])

	const panelClasses = useMemo(() => {
		const surface = transparencyEnabled
			? 'bg-surface1/95 supports-[backdrop-filter]:backdrop-blur-xl'
			: 'bg-surface1'
		return cn(
			surface,
			'border border-border text-text'
		)
	}, [transparencyEnabled])

	const handleChange = (field: keyof FeedbackFormState) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
		const value = event.target.value
		setForm((current) => ({ ...current, [field]: value }))
	}

	const validate = (state: FeedbackFormState): FeedbackFormErrors => {
		const nextErrors: FeedbackFormErrors = {}
		const trimmedMessage = state.message.trim()
		if (!trimmedMessage) {
			nextErrors.message = 'Scrivi il tuo feedback.'
		} else if (trimmedMessage.length < 10) {
			nextErrors.message = 'Aggiungi qualche dettaglio in piu.'
		}
		if (state.email.trim() && !EMAIL_REGEX.test(state.email.trim())) {
			nextErrors.email = 'Inserisci un indirizzo email valido.'
		}
		return nextErrors
	}

	const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault()
		const trimmed: FeedbackFormState = {
			name: form.name.trim(),
			email: form.email.trim(),
			message: form.message.trim(),
			pageUrl: form.pageUrl.trim(),
		}

		const fieldErrors = validate(trimmed)
		if (Object.keys(fieldErrors).length > 0) {
			setErrors(fieldErrors)
			return
		}
		setErrors({})

		const payload: FeedbackPayload = {
			name: trimmed.name || undefined,
			email: trimmed.email || undefined,
			message: trimmed.message,
			page_url: trimmed.pageUrl || undefined,
			user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
			metadata,
		}

		try {
			await submitFeedback.mutateAsync(payload)
			setOpen(false)
			notify({
				title: 'Grazie!',
				description: 'Il tuo feedback e stato inviato.',
				intent: 'success',
			})
		} catch (err) {
			console.error('Failed to send feedback', err)
			setErrors({ general: 'Invio non riuscito. Riprova tra poco.' })
			notify({
				title: 'Invio non riuscito',
				description: 'Non siamo riusciti a inviare il feedback. Riprova tra poco.',
				intent: 'error',
			})
		}
	}

	const closeDialog = () => setOpen(false)
	const handleOpenChange = (next: boolean) => {
		if (!next) {
			setOpen(false)
			return
		}
		setOpen(true)
	}
	const canSubmit = !requireAuth || Boolean(user)

	return (
		<Dialog.Root open={open} onOpenChange={handleOpenChange}>
			<Dialog.Trigger asChild>
				<Button
					type="button"
					variant="default"
					size="icon"
					className="fixed bottom-6 right-6 z-[var(--z-fab)] h-12 w-12 rounded-full shadow-xl shadow-black/20"
				>
					<MessageCircle className="h-5 w-5" aria-hidden="true" />
					<span className="sr-only">Apri il feedback</span>
				</Button>
			</Dialog.Trigger>
			<Dialog.Portal>
				<Dialog.Overlay
					className={cn(
						'fixed inset-0 z-[var(--z-modal-backdrop)] transition-colors',
						overlayClasses
					)}
				/>
				<Dialog.Content
					className={cn(
						'fixed bottom-[calc(6rem+env(safe-area-inset-bottom))] right-6 z-[var(--z-modal)] w-[min(92vw,420px)] max-h-[80vh] rounded-3xl border shadow-2xl focus:outline-none sm:bottom-[calc(7rem+env(safe-area-inset-bottom))]',
						panelClasses
					)}
				>
					<div className="flex h-full max-h-[80vh] flex-col overflow-hidden">
						<header className="flex items-start justify-between gap-3 border-b border-border/60 px-5 py-4">
							<div className="flex items-start gap-3">
								<div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
									<MessageCircle className="h-4 w-4" aria-hidden="true" />
								</div>
								<div className="space-y-0.5">
									<Dialog.Title className="text-base font-semibold leading-tight">Invia un feedback</Dialog.Title>
									<Dialog.Description className="text-xs text-muted-fg">
										Condividi idee o problemi: il team li riceve in tempo reale.
									</Dialog.Description>
								</div>
							</div>
							<Dialog.Close asChild>
								<button
									type="button"
									className="rounded-full border border-border/60 p-2 text-muted-fg transition hover:bg-surface2 hover:text-foreground"
									aria-label="Chiudi"
								>
									<X className="h-4 w-4" />
								</button>
							</Dialog.Close>
						</header>

						{canSubmit ? (
							<>
								<div className="px-5 pt-4">
									<p
										className={cn(
											'rounded-xl border border-border px-4 py-3 text-xs leading-relaxed text-muted-fg shadow-sm',
											transparencyEnabled
												? 'bg-surface2/70 supports-[backdrop-filter]:backdrop-blur-md'
												: 'bg-surface2'
										)}
									>
										<span className="font-medium text-text">Consigli rapidi:</span> indica cosa stavi facendo e aggiungi link o screenshot rilevanti.
									</p>
								</div>

								<form id="feedback-form" className="flex flex-1 flex-col gap-4 overflow-y-auto px-5 pb-5 pt-4" onSubmit={handleSubmit}>
									<div className="grid gap-1.5">
										<label className="text-xs font-medium text-muted-fg" htmlFor="feedback-name">Nome</label>
										<input
											id="feedback-name"
											type="text"
											value={form.name}
											onChange={handleChange('name')}
											className="input h-9 text-sm"
											placeholder="Il tuo nome (facoltativo)"
											autoComplete="name"
										/>
									</div>

									<div className="grid gap-1.5">
										<label className="text-xs font-medium text-muted-fg" htmlFor="feedback-email">Email</label>
										<input
											id="feedback-email"
											type="email"
											value={form.email}
											onChange={handleChange('email')}
											className="input h-9 text-sm"
											placeholder="tu@esempio.com (facoltativa)"
											autoComplete="email"
										/>
										{errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
									</div>

									<div className="grid gap-1.5">
										<label className="text-xs font-medium text-muted-fg" htmlFor="feedback-page">Pagina</label>
										<input
											id="feedback-page"
											type="url"
											value={form.pageUrl}
											onChange={handleChange('pageUrl')}
											className="input h-9 text-sm"
											placeholder="https://..."
										/>
									</div>

									<div className="grid gap-1.5">
										<label className="text-xs font-medium text-muted-fg" htmlFor="feedback-message">Dettagli</label>
										<textarea
											id="feedback-message"
											value={form.message}
											onChange={handleChange('message')}
											className="input min-h-[120px] text-sm"
											placeholder="Descrivi il tuo feedback"
										/>
										{errors.message && <p className="text-xs text-destructive">{errors.message}</p>}
									</div>

									{errors.general && <p className="text-xs text-destructive">{errors.general}</p>}
								</form>

								<footer className="border-t border-border/60 px-5 py-4 backdrop-blur supports-[backdrop-filter]:backdrop-blur">
									<div className="flex items-center gap-2">
										<Button type="button" variant="ghost" size="sm" className="text-sm" disabled={isSubmitting} onClick={closeDialog}>
											Annulla
										</Button>
										<Button type="submit" form="feedback-form" size="sm" className="ml-auto px-4 font-semibold" disabled={isSubmitting}>
											{isSubmitting ? 'Invio…' : 'Invia feedback'}
										</Button>
									</div>
								</footer>
							</>
						) : (
							<div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
								<div className="space-y-3">
									<div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
										<MessageCircle className="h-5 w-5" aria-hidden="true" />
									</div>
									<div className="space-y-1">
										<h2 className="text-lg font-semibold text-text">Accedi per inviare feedback</h2>
										<p className="text-sm text-muted-fg">
											Condividi idee o segnala problemi dopo l&apos;autenticazione: ci aiuta a risponderti direttamente.
										</p>
									</div>
								</div>
								<div className="space-y-2">
									<Button type="button" size="sm" className="w-full px-4 font-semibold" onClick={() => { closeDialog(); login(); }}>
										Accedi e continua
									</Button>
									<Button type="button" variant="ghost" size="sm" className="w-full text-sm" onClick={closeDialog}>
										Annulla
									</Button>
								</div>
							</div>
						)}
					</div>
				</Dialog.Content>
			</Dialog.Portal>
		</Dialog.Root>
	)
}

export default FeedbackWidget
