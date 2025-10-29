import type { ReactNode } from 'react'

type Props = {
	children?: (props?: any) => ReactNode
	schema?: any
	onSubmit?: (values: any) => Promise<void> | void
}

export function FactoryForm({ children, onSubmit }: Props) {
	return (
		<form
			onSubmit={(e) => {
				e.preventDefault()
				// no-op submit for the stub — call onSubmit if present
				onSubmit?.({})
			}}
		>
			{typeof children === 'function' ? children({}) : children}
			<div className="mt-3">
				<button type="submit" className="btn">Submit</button>
			</div>
		</form>
	)
}

export default FactoryForm
