import { cn } from '../../../lib/cn'

type SkeletonProps = {
	variant?: 'text' | 'circle' | 'rect'
	className?: string
}

export const Skeleton = ({ variant = 'text', className }: SkeletonProps) => (
	<div
		className={cn(
			'animate-pulse bg-gradient-to-r from-muted via-border to-muted',
			variant === 'text' && 'h-4 w-full rounded-md',
			variant === 'circle' && 'h-12 w-12 rounded-full',
			variant === 'rect' && 'h-24 w-full rounded-2xl',
			className
		)}
	/>
)

export default Skeleton
