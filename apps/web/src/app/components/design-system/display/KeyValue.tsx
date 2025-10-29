import { cn } from '../../../lib/cn'
import type { KeyValueItem } from '../types'
import type { ReactNode } from 'react'

export type KeyValueProps = {
	items: KeyValueItem[]
	columns?: 1 | 2
}

export const KeyValue = ({ items, columns = 1 }: KeyValueProps) => (
	<dl className={cn('grid gap-4', columns === 2 && 'sm:grid-cols-2')}>
		{items.map((item) => (
			<div key={String(item.key)} className="rounded-2xl border border-border/60 bg-card/70 p-4">
				<dt className="text-xs uppercase tracking-[0.2em] text-muted-fg">{item.key}</dt>
				<dd className="mt-1 text-sm font-semibold text-fg">
					{item.value}
					{item.copyable && typeof item.value === 'string' && (
						<button
							type="button"
							className="ml-2 text-xs text-primary"
							onClick={() => navigator.clipboard.writeText(item.value as string)}
						>
							Copy
						</button>
					)}
				</dd>
				{item.helpText && <p className="mt-1 text-xs text-muted-fg">{item.helpText}</p>}
			</div>
		))}
	</dl>
)

export default KeyValue
