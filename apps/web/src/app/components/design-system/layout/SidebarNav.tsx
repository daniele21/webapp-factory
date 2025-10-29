import { useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { cva } from 'class-variance-authority'
import { ChevronDown, ChevronRight, LayoutDashboard, ExternalLink } from 'lucide-react'
import { cn } from '../../../lib/cn'
import type { NavItem } from '../types'

const badgeTone = cva('inline-flex min-w-[1.5rem] items-center justify-center rounded-full px-2 text-[11px] font-semibold', {
	variants: {
		tone: {
			neutral: 'bg-muted text-muted-fg',
			accent: 'bg-accent/20 text-accent',
			warning: 'bg-warning/20 text-warning',
			success: 'bg-success/20 text-success',
		},
	},
	defaultVariants: { tone: 'neutral' },
})

const navLinkBase =
	'flex grow items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-bg'

const sectionTitleClasses = 'px-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-fg/80'

export type SidebarNavProps = {
	items: NavItem[]
	footerSlot?: React.ReactNode
}

export function SidebarNav({ items, footerSlot }: SidebarNavProps) {
	const [collapsed, setCollapsed] = useState(false)
	const location = useLocation()
	const renderItem = (item: NavItem, keyOverride?: string | number) => {
		const key = item.id ?? keyOverride ?? item.to ?? item.href ?? item.label
		const to = item.to ?? item.href ?? '#'
		const isExternal = Boolean(item.href && !item.to)
		const active = item.to ? location.pathname === item.to : false
		const Inner = (
			<>
				{item.icon ?? <LayoutDashboard className="h-4 w-4 text-muted-fg" aria-hidden="true" />}
				{!collapsed && (
					<>
						<span className="truncate">{item.label}</span>
						{item.badge && <span className={badgeTone({ tone: item.badgeTone ?? 'neutral' })}>{item.badge}</span>}
						{isExternal && <ExternalLink className="ml-auto h-4 w-4 text-muted-fg" aria-hidden="true" />}
					</>
				)}
			</>
		)
		const className = cn(
			navLinkBase,
			active
				? 'bg-primary/10 text-primary shadow-inner shadow-primary/30'
				: 'text-muted-fg hover:bg-muted/50 hover:text-fg'
		)

		return item.to ? (
			<NavLink key={key} to={item.to} end={item.end} className={className}>
				{Inner}
			</NavLink>
		) : (
			<a key={key} href={item.href} target={item.target} rel="noreferrer" className={className}>
				{Inner}
			</a>
		)
	}

	return (
		<div className="flex h-full flex-col gap-6 px-4 py-6">
			<div className="flex items-center justify-between">
				{!collapsed && (
					<div>
						<p className="text-xs uppercase tracking-[0.3em] text-muted-fg">Navigation</p>
						<p className="text-base font-semibold text-fg">Webapp Factory</p>
					</div>
				)}
				<button
					type="button"
					aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
					onClick={() => setCollapsed((prev) => !prev)}
					className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-fg hover:text-fg"
				>
					{collapsed ? (
						<ChevronRight className="h-4 w-4" aria-hidden="true" />
					) : (
						<ChevronDown className="h-4 w-4" aria-hidden="true" />
					)}
				</button>
			</div>
			<div className="space-y-6">
				{items.map((item, idx) => {
					const itemKey = item.id ?? item.to ?? item.href ?? item.label ?? idx
					return item.children ? (
						<div key={itemKey} className="space-y-2">
							{!collapsed && <p className={sectionTitleClasses}>{item.label}</p>}
							<div className="flex flex-col gap-1.5">
								{item.children.map((child, cidx) => renderItem(child, `${itemKey}-${cidx}`))}
							</div>
						</div>
					) : (
						<div key={itemKey}>{renderItem(item, itemKey)}</div>
					)
				})}
			</div>
			{footerSlot && <div className="mt-auto">{footerSlot}</div>}
		</div>
	)
}

export default SidebarNav
