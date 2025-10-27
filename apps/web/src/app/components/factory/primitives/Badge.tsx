import { cn } from '../../../lib/cn'
import type { ReactNode } from 'react'

type BadgeProps = {
	children: ReactNode
	tone?: 'neutral' | 'brand' | 'success' | 'warning'
}

export const Badge = ({ children, tone = 'neutral' }: BadgeProps) => (
	<span
		className={cn(
			'inline-flex items-center rounded-full px-2 py-1 text-xs font-medium',
			tone === 'neutral' && 'bg-muted text-muted-fg',
			tone === 'brand' && 'bg-primary/15 text-primary',
			tone === 'success' && 'bg-success/15 text-success',
			tone === 'warning' && 'bg-warning/15 text-warning'
		)}
	>
		{children}
	</span>
)

export default Badge
