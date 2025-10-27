import { AlertTriangle, CheckCircle2, Info } from 'lucide-react'
import { cn } from '../../../lib/cn'
import type { ReactNode } from 'react'

type AlertProps = {
	title: string
	description?: string
	intent?: 'info' | 'success' | 'warning' | 'error'
	actions?: ReactNode
}

export const Alert = ({ title, description, intent = 'info', actions }: AlertProps) => {
	const intents: Record<'info' | 'success' | 'warning' | 'error', { icon: ReactNode; classes: string }> = {
		info: { icon: <Info className="h-5 w-5" aria-hidden="true" />, classes: 'border-primary/40 bg-primary/5 text-primary' },
		success: { icon: <CheckCircle2 className="h-5 w-5" aria-hidden="true" />, classes: 'border-success/40 bg-success/5 text-success' },
		warning: { icon: <AlertTriangle className="h-5 w-5" aria-hidden="true" />, classes: 'border-warning/40 bg-warning/5 text-warning' },
		error: { icon: <AlertTriangle className="h-5 w-5 text-destructive" aria-hidden="true" />, classes: 'border-destructive/40 bg-destructive/5 text-destructive' },
	}

	const variant = intents[intent]

	return (
		<div className={cn('rounded-2xl border p-4', variant.classes)}>
			<div className="flex items-start gap-3">
				{variant.icon}
				<div className="flex-1">
					<p className="font-semibold">{title}</p>
					{description && <p className="text-sm opacity-80">{description}</p>}
					{actions && <div className="mt-3 flex flex-wrap gap-2">{actions}</div>}
				</div>
			</div>
		</div>
	)
}

export default Alert
