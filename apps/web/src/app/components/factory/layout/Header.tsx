import { useTheme } from '../../../theme/ThemeProvider'
import { getBrandPreset } from '../../../theme/brands'
import type { ReactNode } from 'react'

export type HeaderProps = {
	title?: string
	actions?: ReactNode
	subtitle?: string
}

export function Header({ title, subtitle, actions }: HeaderProps) {
	const { brand, visual } = useTheme()
	const preset = getBrandPreset(brand)
	return (
		<div className="flex flex-wrap items-center gap-4 px-4 py-3 sm:px-6 lg:px-10">
			<div className="flex items-center gap-3">
				<span
					className="h-10 w-10 rounded-xl border border-border/60 shadow-sm shadow-primary/20"
					style={{ background: preset.preview }}
					aria-hidden="true"
				/>
				<div>
					<p className="text-xs uppercase tracking-[0.3em] text-muted-fg">{visual}</p>
					<p className="text-base font-semibold leading-tight text-fg">{title ?? 'Untitled route'}</p>
					{subtitle && <p className="text-xs text-muted-fg">{subtitle}</p>}
				</div>
			</div>
			<div className="ml-auto flex items-center gap-3">{actions}</div>
		</div>
	)
}

export default Header
