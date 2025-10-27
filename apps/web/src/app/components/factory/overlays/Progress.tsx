import { cn } from '../../../lib/cn'
import type { ReactNode } from 'react'

type ProgressProps = {
	value: number
	label?: string
}

export const Progress = ({ value, label }: ProgressProps) => (
	<div>
		{label && (
			<div className="mb-1 flex items-center justify-between text-xs text-muted-fg">
				<span>{label}</span>
				<span>{value}%</span>
			</div>
		)}
		<div className="h-2 rounded-full bg-muted">
			<div className="h-full rounded-full bg-primary" style={{ width: `${value}%` }} />
		</div>
	</div>
)

export default Progress
