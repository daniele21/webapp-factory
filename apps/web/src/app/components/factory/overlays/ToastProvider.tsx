import { createContext, useContext, useState, type ReactNode } from 'react'
import * as ToastPrimitive from '@radix-ui/react-toast'
import { AlertTriangle, CheckCircle2, Info, Undo2, X } from 'lucide-react'
import { cn } from '../../../lib/cn'
import { Button } from '../../ui/button'

type ToastIntent = 'success' | 'error' | 'info'

type ToastMessage = {
	id: string
	title: string
	description?: string
	intent?: ToastIntent
	actionLabel?: string
	onAction?: () => void
}

type ToastCtx = {
	notify: (toast: Omit<ToastMessage, 'id'>) => void
}

const ToastContext = createContext<ToastCtx | null>(null)

export const useToast = () => {
	const ctx = useContext(ToastContext)
	if (!ctx) throw new Error('useToast must be used within ToastProvider')
	return ctx
}

export function ToastProvider({ children }: { children: ReactNode }) {
	const [toasts, setToasts] = useState<ToastMessage[]>([])

	const notify = (t: Omit<ToastMessage, 'id'>) => {
		const id = String(Math.random()).slice(2, 9)
		setToasts((prev) => [{ id, ...t }, ...prev])
	}

	const remove = (id: string) => setToasts((prev) => prev.filter((t) => t.id !== id))

	return (
		<ToastContext.Provider value={{ notify }}>
			{children}
			<ToastPrimitive.Provider>
				<div className="fixed bottom-6 right-6 z-[var(--z-toast)] space-y-3">
					{toasts.map((toast) => (
						<ToastPrimitive.Root key={toast.id} duration={5000} className={cn('rounded-lg border p-3 shadow-xl')}> 
							<div className="flex items-start gap-3">
								<div className="mt-1">
									{toast.intent === 'success' && <CheckCircle2 className="h-5 w-5 text-emerald-500" />}
									{toast.intent === 'error' && <AlertTriangle className="h-5 w-5 text-rose-500" />}
									{toast.intent === 'info' && <Info className="h-5 w-5 text-sky-500" />}
								</div>
								<div className="flex-1">
									<div className="font-semibold">{toast.title}</div>
									{toast.description && <div className="text-sm text-muted-fg">{toast.description}</div>}
									{toast.actionLabel && (
										<div className="mt-2">
											<Button size="sm" onClick={() => { toast.onAction?.(); remove(toast.id); }}>{toast.actionLabel}</Button>
										</div>
									)}
								</div>
								<div>
									<button type="button" onClick={() => remove(toast.id)} className="rounded-full p-1">
										<X className="h-4 w-4" />
									</button>
								</div>
							</div>
						</ToastPrimitive.Root>
					))}
				</div>
			</ToastPrimitive.Provider>
		</ToastContext.Provider>
	)
}

export default ToastProvider
