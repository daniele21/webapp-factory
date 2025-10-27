import type { ReactNode } from 'react'

type Props = {
	title?: string
	description?: string
	toolbar?: ReactNode
	actions?: ReactNode
	children?: ReactNode
}

export function Page({ title, description, toolbar, actions, children }: Props) {
	return (
		<div className="page container mx-auto py-6">
			<div className="flex items-center justify-between mb-4">
				<div>
					{title && <h1 className="text-xl font-semibold">{title}</h1>}
					{description && <p className="text-sm text-muted-fg">{description}</p>}
				</div>
				<div>{actions}</div>
			</div>
			<div>{toolbar}</div>
			<div className="mt-4">{children}</div>
		</div>
	)
}

export default Page
