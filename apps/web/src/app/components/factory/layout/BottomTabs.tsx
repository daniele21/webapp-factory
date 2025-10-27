import { Link, useLocation } from 'react-router-dom'
import { Home } from 'lucide-react'
import { cn } from '../../../lib/cn'
import type { ReactNode } from 'react'

export function BottomTabs({ items }: { items: any[] }) {
	const location = useLocation()
	const flatItems = items.flatMap((item: any) => item.children ?? [item])
	return (
		<nav
			aria-label="Bottom navigation"
			className="fixed inset-x-0 bottom-0 z-[var(--z-fixed)] border-t border-border/70 bg-card/95 px-2 py-1 shadow-2xl shadow-black/5 md:hidden"
		>
			<ul className="flex items-center justify-around gap-2 text-xs font-medium text-muted-fg">
				{flatItems.slice(0, 4).map((item: any) => {
					const active = item.to === location.pathname
					const icon = item.icon ?? <Home className="h-5 w-5" aria-hidden="true" />
					return (
						<li key={item.id}>
							<Link
								to={item.to ?? '#'}
								className={cn(
									'flex flex-col items-center gap-1 rounded-xl px-3 py-2 transition',
									active ? 'text-primary' : 'hover:text-fg'
								)}
							>
								{icon}
								<span>{item.label}</span>
							</Link>
						</li>
					)
				})}
			</ul>
		</nav>
	)
}

export default BottomTabs
