import type { ReactNode } from 'react'

export type AppShellProps = {
	sidebar?: ReactNode
	header?: ReactNode
	footer?: ReactNode
	children: ReactNode
}

export function AppShell({ sidebar, header, footer, children }: AppShellProps) {
	return (
		<div className="min-h-screen bg-bg text-fg">
			<a href="#app-main" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:rounded-lg focus:bg-card focus:px-4 focus:py-2 focus:shadow-lg">
				Skip to content
			</a>
			<div className="grid min-h-screen grid-rows-[auto_1fr_auto] md:grid-cols-[280px_minmax(0,1fr)] md:grid-rows-[auto_1fr]">
				{sidebar && (
					<aside className="hidden md:block">{sidebar}</aside>
				)}
				<div className="flex min-h-screen flex-1 flex-col">
					{header && <header>{header}</header>}
					<main id="app-main" className="flex-1">{children}</main>
					{footer && <footer>{footer}</footer>}
				</div>
			</div>
		</div>
	)
}

export default AppShell
