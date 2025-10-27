import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { MoreVertical } from 'lucide-react'
import type { ReactNode } from 'react'

type OverflowMenuAction = {
	id: string
	label: string
	onSelect: () => void
}

type OverflowMenuProps = {
	actions: OverflowMenuAction[]
}

export const OverflowMenu = ({ actions }: OverflowMenuProps) => (
	<DropdownMenu.Root>
		<DropdownMenu.Trigger asChild>
			<button type="button" className="rounded-full border border-border/70 p-2">
				<MoreVertical className="h-4 w-4" aria-hidden="true" />
			</button>
		</DropdownMenu.Trigger>
		<DropdownMenu.Portal>
			<DropdownMenu.Content className="min-w-[200px] rounded-2xl border border-border bg-card/95 p-2 shadow-xl">
				{actions.map((action) => (
					<DropdownMenu.Item
						key={action.id}
						className="cursor-pointer rounded-xl px-3 py-2 text-sm text-muted-fg hover:bg-muted/40 hover:text-fg"
						onSelect={action.onSelect}
					>
						{action.label}
					</DropdownMenu.Item>
				))}
			</DropdownMenu.Content>
		</DropdownMenu.Portal>
	</DropdownMenu.Root>
)

export default OverflowMenu
