import { cn } from '../../../lib/cn'
import type { ReactNode } from 'react'

type PillsProps = {
	items: Array<{ id: string; label: string }>
	value: string
	onChange: (value: string) => void
}

export const Pills = ({ items, value, onChange }: PillsProps) => (
	<div className="flex flex-wrap gap-2">
		{items.map((item) => (
			<button
				key={item.id}
				type="button"
				className={cn(
					'rounded-full border px-3 py-1 text-sm transition',
					value === item.id ? 'border-primary bg-primary/10 text-primary' : 'border-border/70 text-muted-fg hover:border-primary'
				)}
				onClick={() => onChange(item.id)}
			>
				{item.label}
			</button>
		))}
	</div>
)

export default Pills
