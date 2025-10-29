import { cn } from '../../../lib/cn'
import type { ReactNode } from 'react'

type TagProps = {
	label: string
	tone?: 'accent' | 'muted'
}

export const Tag = ({ label, tone = 'muted' }: TagProps) => (
	<span className={cn('inline-flex items-center rounded-lg px-2 py-0.5 text-xs uppercase tracking-wide', tone === 'accent' ? 'bg-accent/15 text-accent' : 'bg-muted text-muted-fg')}>
		{label}
	</span>
)

export default Tag
