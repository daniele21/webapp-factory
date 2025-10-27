import { Link } from 'react-router-dom'
import { useMemo } from 'react'
import { ChevronRight, MoreHorizontal } from 'lucide-react'
import { Popover } from '../overlays/Popover'
import { cn } from '../../../lib/cn'
import type { ReactNode } from 'react'
import type { BreadcrumbItem } from '../types'

export type BreadcrumbsProps = {
	items?: BreadcrumbItem[]
	homeLabel?: string
}

export function Breadcrumbs({ items, homeLabel = 'Home' }: BreadcrumbsProps) {
	const location = { pathname: typeof window !== 'undefined' ? window.location.pathname : '/' }
	const computed = useMemo(() => {
		if (items) return items
		const segments = location.pathname.split('/').filter(Boolean)
		const crumbs: BreadcrumbItem[] = [{ label: homeLabel, href: '/' }]
		segments.forEach((segment, index) => {
			const href = '/' + segments.slice(0, index + 1).join('/')
			crumbs.push({ label: segment.replace(/-/g, ' '), href })
		})
		return crumbs
	}, [items, location.pathname, homeLabel])

	const overflow = computed.length > 4 ? computed.slice(1, -2) : []
	const visible = computed.length > 4 ? [computed[0], ...computed.slice(-2)] : computed

	return (
		<nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-muted-fg">
			{visible.map((crumb, index) => (
				<span key={`${crumb.href ?? crumb.label}-${index}`}>
					{index > 0 && <ChevronRight className="h-4 w-4 text-border" aria-hidden="true" />}
					{index === 1 &&
						overflow.length > 0 && (
							<>
								<Popover
									trigger={
										<button
											type="button"
											className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border/60 bg-card text-muted-fg transition hover:text-fg"
											aria-label="Show more breadcrumbs"
										>
											<MoreHorizontal className="h-4 w-4" aria-hidden="true" />
										</button>
									}
								>
									<div className="min-w-[180px] space-y-1">
										{overflow.map((hiddenCrumb) =>
											hiddenCrumb.href ? (
												<Link
													key={hiddenCrumb.href}
													to={hiddenCrumb.href}
													className="block rounded-lg px-3 py-2 text-sm text-muted-fg transition hover:bg-muted/40 hover:text-fg"
												>
													{hiddenCrumb.label}
												</Link>
											) : (
												<span key={hiddenCrumb.label} className="block rounded-lg px-3 py-2 text-sm text-muted-fg">
													{hiddenCrumb.label}
												</span>
											)
										)}
									</div>
								</Popover>
								<ChevronRight className="h-4 w-4 text-border" aria-hidden="true" />
							</>
						)}
					{crumb.href ? (
						<Link to={crumb.href} className={cn('transition hover:text-fg', index === visible.length - 1 && 'text-fg font-semibold')}>
							{crumb.label}
						</Link>
					) : (
						<span className="text-fg font-semibold">{crumb.label}</span>
					)}
				</span>
			))}
		</nav>
	)
}

export default Breadcrumbs
