import { KBarProvider, KBarAnimator, KBarPortal, KBarPositioner, KBarResults, KBarSearch, type Action as KBarAction, useMatches } from 'kbar'
import { cn } from '../../../lib/cn'
import type { ReactNode } from 'react'

type CommandMenuProps = {
	actions: KBarAction[]
}

export function CommandMenu({ actions }: CommandMenuProps) {
	return (
		<KBarProvider actions={actions}>
			<CommandSurface />
		</KBarProvider>
	)
}

function CommandSurface() {
	const { results } = useMatches()
	return (
		<KBarPortal>
			<KBarPositioner className="fixed inset-0 z-[var(--z-modal)] grid place-items-center bg-black/40 backdrop-blur-sm">
				<KBarAnimator className="w-full max-w-2xl overflow-hidden rounded-3xl border border-border/70 bg-card/95 shadow-2xl">
					<KBarSearch className="w-full border-b border-border/70 bg-transparent px-4 py-3 text-sm outline-none" placeholder="Search actions" />
					<KBarResults
						items={results}
						onRender={({ item, active }) =>
							typeof item === 'string' ? (
								<div className="px-4 py-2 text-xs uppercase tracking-wide text-muted-fg">{item}</div>
							) : (
								<div className={cn('px-4 py-3 text-sm', active && 'bg-primary/10 text-primary')}>
									<div className="font-medium">{item.name}</div>
									{item.subtitle && <div className="text-xs text-muted-fg">{item.subtitle}</div>}
								</div>
							)
						}
					/>
				</KBarAnimator>
			</KBarPositioner>
		</KBarPortal>
	)
}

export default CommandMenu
