import { Sparkles } from 'lucide-react'
import { cn } from '../../../lib/cn'
import type { TimelineItem } from '../types'

type TimelineProps = {
	items: TimelineItem[]
}

export const Timeline = ({ items }: TimelineProps) => (
	<ol className="relative ml-4 border-l border-border/70">
		{items.map((item) => (
			<li key={item.id} className="ml-4 border-b border-border/40 py-4 last:border-b-0">
				<span className="absolute -left-[25px] flex h-8 w-8 items-center justify-center rounded-full border border-border bg-card">
					{item.icon ?? <Sparkles className="h-4 w-4 text-primary" aria-hidden="true" />}
				</span>
				<p className="text-sm font-semibold">{item.title}</p>
				<p className="text-xs text-muted-fg">{new Date(item.timestamp).toLocaleString()}</p>
				{item.description && <p className="mt-1 text-sm text-muted-fg">{item.description}</p>}
				{(item.by || item.badge) && (
					<div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-fg">
						{item.by && <span>By {item.by}</span>}
						{item.badge && <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-primary/15 text-primary">{item.badge}</span>}
					</div>
				)}
			</li>
		))}
	</ol>
)

export default Timeline

