import { cn } from '../../../lib/cn'
import type { ReactNode } from 'react'

type AvatarProps = {
	src?: string
	fallback: string
	size?: number
	status?: 'online' | 'busy' | 'offline'
}

export const Avatar = ({ src, fallback, size = 40, status }: AvatarProps) => (
	<div className="relative inline-flex" style={{ width: size, height: size }}>
		{src ? (
			<img src={src} alt={fallback} className="h-full w-full rounded-full object-cover" />
		) : (
			<span className="flex h-full w-full items-center justify-center rounded-full bg-primary/15 text-sm font-semibold text-primary">
				{fallback.slice(0, 2).toUpperCase()}
			</span>
		)}
		{status && (
			<span
				className={cn(
					'absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-card',
					status === 'online' && 'bg-success',
					status === 'busy' && 'bg-warning',
					status === 'offline' && 'bg-border'
				)}
				aria-label={status}
			/>
		)}
	</div>
)

export default Avatar
