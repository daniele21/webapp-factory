import * as AccordionPrimitive from '@radix-ui/react-accordion'
import { ChevronRight } from 'lucide-react'
import type { ReactNode } from 'react'

type AccordionProps = {
	items: Array<{ id: string; title: string; content: ReactNode }>
}

export const Accordion = ({ items }: AccordionProps) => (
	<AccordionPrimitive.Root type="multiple" className="space-y-2">
		{items.map((item) => (
			<AccordionPrimitive.Item key={item.id} value={item.id} className="overflow-hidden rounded-2xl border border-border/70">
				<AccordionPrimitive.Trigger className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-semibold">
					{item.title}
					<ChevronRight className="h-4 w-4 transition-transform data-[state=open]:rotate-90" aria-hidden="true" />
				</AccordionPrimitive.Trigger>
				<AccordionPrimitive.Content className="px-4 pb-4 text-sm text-muted-fg">
					{item.content}
				</AccordionPrimitive.Content>
			</AccordionPrimitive.Item>
		))}
	</AccordionPrimitive.Root>
)

export default Accordion
