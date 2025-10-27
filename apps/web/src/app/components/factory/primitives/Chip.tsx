import { X } from 'lucide-react'
import { cn } from '../../../lib/cn'
import type { ReactNode } from 'react'

type ChipProps = {
	label: string
	onRemove?: () => void
}

export const Chip = ({ label, onRemove }: ChipProps) => (
	<span className={cn('inline-flex items-center gap-2 component-radius-lg component-border bg-card component-spacing-sm text-sm component-motion')}>
		{label}
		{onRemove && (
			<button type="button" aria-label={`Remove ${label}`} onClick={onRemove}>
				<X className="h-4 w-4" aria-hidden="true" />
			</button>
		)}
	</span>
)

export default Chip
