import * as SwitchPrimitive from '@radix-ui/react-switch'
import { useId, type ComponentPropsWithoutRef } from 'react'
import { cn } from '../../../lib/cn'
import type { FieldCommon } from './fieldShell'
import { FieldShell } from './fieldShell'

type RootProps = ComponentPropsWithoutRef<typeof SwitchPrimitive.Root>
type SwitchFieldProps = FieldCommon & Omit<RootProps, 'asChild'>

export const SwitchField = ({ label, description, error, required, disabled, className, ...props }: SwitchFieldProps) => {
	const id = useId()
	return (
		<FieldShell label={label} description={description} error={error} required={required} labelFor={id}>
			<SwitchPrimitive.Root
				id={id}
				disabled={disabled}
				aria-required={required}
				className={cn(
					'relative inline-flex h-6 w-11 items-center rounded-full border border-border/60 bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-bg disabled:cursor-not-allowed disabled:opacity-50',
					'data-[state=checked]:bg-primary data-[state=checked]:border-primary',
					className
				)}
				{...props}
			>
				<SwitchPrimitive.Thumb className="absolute left-0.5 top-1/2 h-5 w-5 -translate-y-1/2 rounded-full bg-card shadow-sm transition-transform data-[state=checked]:translate-x-[18px]" />
			</SwitchPrimitive.Root>
		</FieldShell>
	)
}

export default SwitchField
