import { TrendingDown, TrendingUp } from 'lucide-react'
import { cn } from '../../../lib/cn'
import Card from './Card'
import type { ReactNode } from 'react'

type StatCardProps = {
	label: string
	value: string | number
	delta?: string
	trend?: 'up' | 'down' | 'neutral'
	sparkline?: ReactNode
}

export const StatCard = ({ label, value, delta, trend = 'neutral', sparkline }: StatCardProps) => (
	<Card>
		<p className="text-xs uppercase tracking-[0.2em] text-muted-fg">{label}</p>
		<div className="mt-2 flex items-center gap-3">
			<p className="text-3xl font-semibold">{value}</p>
			{delta && (
				<span
					className={cn(
						'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs',
						trend === 'up' && 'bg-success/15 text-success',
						trend === 'down' && 'bg-destructive/15 text-destructive',
						trend === 'neutral' && 'bg-muted text-muted-fg'
					)}
				>
					{trend === 'up' && <TrendingUp className="h-3 w-3" aria-hidden="true" />}
					{trend === 'down' && <TrendingDown className="h-3 w-3" aria-hidden="true" />}
					{delta}
				</span>
			)}
		</div>
		{sparkline && <div className="mt-4 h-16">{sparkline}</div>}
	</Card>
)

export default StatCard
