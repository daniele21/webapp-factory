import { cn } from '../../../lib/cn'
import type { ReactNode } from 'react'

export type CardProps = {
	title?: string
	description?: string
	elevation?: 'flat' | 'raised' | 'glow'
	actions?: ReactNode
	children: ReactNode
}

export const Card = ({ title, description, elevation = 'raised', actions, children }: CardProps) => (
	<section
		className={cn(
			'component-radius component-border bg-card/80 component-spacing component-motion component-backdrop',
			elevation === 'raised' && 'component-elevation',
			elevation === 'glow' && 'elevation-brand'
		)}
	>
		{(title || description || actions) && (
			<header className="mb-4 flex flex-wrap items-start gap-3">
				<div className="flex-1">
					{title && <h3 className="text-base font-semibold text-fg">{title}</h3>}
					{description && <p className="text-sm text-muted-fg">{description}</p>}
				</div>
				{actions && <div className="flex gap-2">{actions}</div>}
			</header>
		)}
		{children}
	</section>
)

export default Card
