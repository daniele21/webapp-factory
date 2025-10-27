import { useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu } from 'lucide-react'
import type { ReactNode } from 'react'
import DrawerNav from './DrawerNav'

export type MobileNavProps = {
	items: any[]
	title?: string
	actions?: ReactNode
}

export function TopBar({ items, title, actions }: MobileNavProps) {
	const [open, setOpen] = useState(false)
	const location = useLocation()
	const flatItems = useMemo(() => items.flatMap((item) => item.children ?? [item]), [items])
	const active = flatItems.find((item) => item.to === location.pathname)

	return (
		<>
			<div className="flex h-14 items-center gap-3 border-b border-border/70 bg-bg/90 px-4 backdrop-blur-md md:hidden">
				<button
					type="button"
					aria-label="Open navigation"
					onClick={() => setOpen(true)}
					className="rounded-lg border border-border p-2 text-muted-fg hover:text-fg"
				>
					<Menu className="h-5 w-5" aria-hidden="true" />
				</button>
				<div>
					<p className="text-xs uppercase tracking-[0.3em] text-muted-fg">Factory</p>
					<p className="text-sm font-semibold">{title ?? active?.label ?? 'Navigate'}</p>
				</div>
				<div className="ml-auto flex items-center gap-2">{actions}</div>
			</div>
			<DrawerNav open={open} onOpenChange={setOpen} items={items} />
		</>
	)
}

export default TopBar
