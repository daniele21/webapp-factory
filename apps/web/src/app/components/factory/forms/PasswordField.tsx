import { useEffect, useId, useState } from 'react'
import { cn } from '../../../lib/cn'
import { Minus, Plus } from 'lucide-react'
import type { FieldCommon } from './fieldShell'
import { FieldShell, inputClasses } from './fieldShell'

export type PasswordFieldProps = React.InputHTMLAttributes<HTMLInputElement> & FieldCommon

export const PasswordField = ({ label, description, error, required, id, value, defaultValue, onChange, ...props }: PasswordFieldProps) => {
	const [visible, setVisible] = useState(false)
	const [internal, setInternal] = useState<string>(defaultValue?.toString() ?? '')
	useEffect(() => {
		if (typeof value === 'string') setInternal(value)
	}, [value])
	const current = typeof value === 'string' ? value : internal
	const fieldId = id ?? useId()
	return (
		<FieldShell label={label} description={description} error={error} required={required} labelFor={fieldId}>
			<div className="relative">
				<input
					{...props}
					id={fieldId}
					value={current}
					onChange={(event) => {
						if (value === undefined) setInternal(event.target.value)
						onChange?.(event)
					}}
					type={visible ? 'text' : 'password'}
					className={cn(inputClasses, 'pr-10')}
				/>
				<button
					type="button"
					className="absolute inset-y-0 right-2 flex items-center text-muted-fg"
					aria-label={visible ? 'Hide password' : 'Show password'}
					onClick={() => setVisible((prev) => !prev)}
				>
					{visible ? <Minus className="h-4 w-4" aria-hidden="true" /> : <Plus className="h-4 w-4" aria-hidden="true" />}
				</button>
			</div>
		</FieldShell>
	)
}

export default PasswordField
