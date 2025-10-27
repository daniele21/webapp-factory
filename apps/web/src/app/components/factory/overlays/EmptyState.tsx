import { Info } from 'lucide-react'
import type { ReactNode } from 'react'

type EmptyStateProps = {
	icon?: ReactNode
	title: string
	description: string
	primaryAction?: ReactNode
	secondaryAction?: ReactNode
}

export const EmptyState = ({ icon, title, description, primaryAction, secondaryAction }: EmptyStateProps) => (
	<div className="flex flex-col items-center gap-4 rounded-3xl border border-dashed border-border/70 bg-card/70 p-10 text-center">
		<div className="rounded-2xl bg-muted/60 p-4 text-primary">{icon ?? <Info className="h-6 w-6" aria-hidden="true" />}</div>
		<div>
			<p className="text-xl font-semibold">{title}</p>
			<p className="text-sm text-muted-fg">{description}</p>
		</div>
		<div className="flex flex-wrap justify-center gap-3">
			{primaryAction}
			{secondaryAction}
		</div>
	</div>
)

export default EmptyState
