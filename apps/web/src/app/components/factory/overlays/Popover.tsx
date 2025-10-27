import * as PopoverPrimitive from '@radix-ui/react-popover'
import type { ReactNode } from 'react'

type PopoverProps = {
	trigger: ReactNode
	children: ReactNode
}

export const Popover = ({ trigger, children }: PopoverProps) => (
	<PopoverPrimitive.Root>
		<PopoverPrimitive.Trigger asChild>{trigger}</PopoverPrimitive.Trigger>
		<PopoverPrimitive.Portal>
			<PopoverPrimitive.Content sideOffset={8} className="rounded-2xl border border-border bg-card/95 p-4 shadow-xl">
				{children}
			</PopoverPrimitive.Content>
		</PopoverPrimitive.Portal>
	</PopoverPrimitive.Root>
)

export default Popover
