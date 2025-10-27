import type { ReactNode } from 'react'

export const inputClasses =
	'w-full component-radius-sm component-border bg-card component-spacing-sm text-sm shadow-sm component-motion focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-50'

export type FieldCommon = {
	label?: string
	description?: string
	error?: string
	required?: boolean
}

type FieldShellProps = FieldCommon & {
	labelFor?: string
	charCount?: { value: number; limit?: number }
	children: ReactNode
}

export const FieldShell = ({ label, description, error, required, labelFor, charCount, children }: FieldShellProps) => (
	<div className="space-y-1.5">
		{(label || charCount) && (
			<div className="flex items-center justify-between text-sm">
				{label && (
					<label htmlFor={labelFor} className="font-medium text-fg">
						{label}
						{required && <span className="ml-1 text-destructive">*</span>}
					</label>
				)}
				{charCount && (
					<span className="text-xs text-muted-fg">
						{charCount.value}
						{charCount.limit ? ` / ${charCount.limit}` : ''}
					</span>
				)}
			</div>
		)}
		{description && <p className="text-xs text-muted-fg">{description}</p>}
		{children}
		{error && <p className="text-xs text-destructive">{error}</p>}
	</div>
)

export default FieldShell
