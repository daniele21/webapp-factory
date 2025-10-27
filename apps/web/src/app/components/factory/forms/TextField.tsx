import { useEffect, useId, useState } from 'react'
import { cn } from '../../../lib/cn'
import type { FieldCommon } from './fieldShell'
import { FieldShell, inputClasses } from './fieldShell'

export type TextFieldProps = React.InputHTMLAttributes<HTMLInputElement> & FieldCommon

export const TextField = ({ label, description, error, required, maxLength, value, defaultValue, onChange, id, ...props }: TextFieldProps) => {
	const fieldId = id ?? useId()
	const [internal, setInternal] = useState<string>(defaultValue?.toString() ?? '')
	useEffect(() => {
		if (typeof value === 'string') setInternal(value)
	}, [value])
	const current = typeof value === 'string' ? value : internal
	const showCounter = typeof maxLength === 'number'
	return (
		<FieldShell label={label} description={description} error={error} required={required} labelFor={fieldId} charCount={showCounter ? { value: current.length, limit: maxLength } : undefined}>
			<input
				id={fieldId}
				value={current}
				onChange={(event) => {
					if (value === undefined) setInternal(event.target.value)
					onChange?.(event)
				}}
				maxLength={maxLength}
				className={inputClasses}
				{...props}
			/>
		</FieldShell>
	)
}

export default TextField
