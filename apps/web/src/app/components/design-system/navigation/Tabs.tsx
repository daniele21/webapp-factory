import * as TabsPrimitive from '@radix-ui/react-tabs'
import { cn } from '../../../lib/cn'
import type { ReactNode } from 'react'

type TabsProps = {
	value: string
	onValueChange: (value: string) => void
	tabs: Array<{ id: string; label: string; content: ReactNode }>
}

export const Tabs = ({ value, onValueChange, tabs }: TabsProps) => (
	<TabsPrimitive.Root value={value} onValueChange={onValueChange}>
		<TabsPrimitive.List className="flex flex-wrap gap-2 rounded-2xl border border-border/70 bg-muted/30 p-1">
			{tabs.map((tab) => (
				<TabsPrimitive.Trigger
					key={tab.id}
					value={tab.id}
					className="rounded-xl px-4 py-2 text-sm font-medium text-muted-fg data-[state=active]:bg-card data-[state=active]:text-fg"
				>
					{tab.label}
				</TabsPrimitive.Trigger>
			))}
		</TabsPrimitive.List>
		{tabs.map((tab) => (
			<TabsPrimitive.Content key={tab.id} value={tab.id} className="mt-4">
				{tab.content}
			</TabsPrimitive.Content>
		))}
	</TabsPrimitive.Root>
)

export default Tabs
