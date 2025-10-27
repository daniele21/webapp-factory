import * as HoverCardPrimitive from '@radix-ui/react-hover-card'
import type { ReactNode } from 'react'

type HoverCardProps = {
	trigger: ReactNode
	children: ReactNode
}

export const HoverCard = ({ trigger, children }: HoverCardProps) => (
	<HoverCardPrimitive.Root>
		<HoverCardPrimitive.Trigger asChild>{trigger}</HoverCardPrimitive.Trigger>
		<HoverCardPrimitive.Content className="rounded-2xl border border-border bg-card/95 p-4 shadow-xl">
			{children}
		</HoverCardPrimitive.Content>
	</HoverCardPrimitive.Root>
)

export default HoverCard
