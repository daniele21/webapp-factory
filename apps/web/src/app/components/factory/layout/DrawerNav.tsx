import * as Dialog from '@radix-ui/react-dialog'
import { Link } from 'react-router-dom'
import { X } from 'lucide-react'
import React, { type ReactNode } from 'react'
import type { NavItem } from '../types'

export type DrawerNavProps = {
	items: NavItem[]
	open: boolean
	onOpenChange: (value: boolean) => void
}

export function DrawerNav({ items, open, onOpenChange }: DrawerNavProps) {
	const handleClose = () => onOpenChange(false)
	const renderInteractive = (
		entry: NavItem,
		className: string,
		children: ReactNode,
		key?: string
	) => {
		if (entry.to) {
			return (
				<Link key={key} to={entry.to} className={className} onClick={handleClose}>
					{children}
				</Link>
			)
		}
		return (
			<a
				href={entry.href ?? '#'}
				target={entry.target}
				rel={entry.target === '_blank' ? 'noreferrer' : undefined}
				className={className}
				onClick={handleClose}
				key={key}
			>
				{children}
			</a>
		)
	}

	return (
		<Dialog.Root open={open} onOpenChange={onOpenChange}>
			<Dialog.Portal>
				<Dialog.Overlay className="fixed inset-0 z-[var(--z-modal-backdrop)] bg-black/40 backdrop-blur-sm md:hidden" />
				<Dialog.Content className="fixed inset-y-0 left-0 z-[var(--z-modal)] w-[85vw] max-w-sm bg-card p-4 shadow-2xl md:hidden">
					<div className="mb-4 flex items-center justify-between">
						<p className="text-sm font-semibold">Navigate</p>
						<Dialog.Close className="rounded-lg border border-border p-2" aria-label="Close navigation">
							<X className="h-4 w-4" aria-hidden="true" />
						</Dialog.Close>
					</div>
					<div className="space-y-3">
						{items.map((item) =>
							item.children ? (
								<details key={item.id} className="rounded-xl border border-border/80">
									<summary className="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm font-semibold text-muted-fg">
										{item.icon ?? <span className="h-4 w-4" />}
										{item.label}
									</summary>
									<div className="px-3 pb-2">
										{item.children.map((child) =>
											renderInteractive(
												child,
												'block rounded-lg px-3 py-2 text-sm text-muted-fg hover:bg-muted/50',
												child.label,
												child.id
											)
										)}
									</div>
								</details>
							) : (
								<div key={item.id}>
									{renderInteractive(
										item,
										'flex items-center gap-3 rounded-xl border border-border/70 px-3 py-2 text-sm font-semibold text-fg',
										<>
											{item.icon ?? <span className="h-4 w-4" />}
											{item.label}
										</>
									)}
								</div>
							)
						)}
					</div>
				</Dialog.Content>
			</Dialog.Portal>
		</Dialog.Root>
	)
}

export default DrawerNav
