import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { cn } from '../../../lib/cn'
import type { ReactNode } from 'react'

type DrawerProps = {
	title: string
	description?: string
	side?: 'left' | 'right'
	trigger: ReactNode
	children: ReactNode
}

export const Drawer = ({ title, description, side = 'right', trigger, children }: DrawerProps) => (
	<Dialog.Root>
		<Dialog.Trigger asChild>{trigger}</Dialog.Trigger>
		<Dialog.Portal>
			<Dialog.Overlay className="fixed inset-0 z-[var(--z-modal-backdrop)] bg-black/40" />
			<Dialog.Content
				className={cn(
					'fixed top-0 z-[var(--z-modal)] h-full w-full max-w-md border-l border-border/70 bg-card/95 p-6 shadow-2xl transition-transform',
					side === 'right' ? 'right-0 animate-slide-in-right' : 'left-0 animate-slide-in-left'
				)}
			>
				<Dialog.Title className="text-lg font-semibold">{title}</Dialog.Title>
				{description && <Dialog.Description className="text-sm text-muted-fg">{description}</Dialog.Description>}
				<div className="mt-4 space-y-4 overflow-y-auto">{children}</div>
				<Dialog.Close className="absolute right-4 top-4 rounded-full border border-border/80 p-2">
					<X className="h-4 w-4" aria-hidden="true" />
				</Dialog.Close>
			</Dialog.Content>
		</Dialog.Portal>
	</Dialog.Root>
)

export default Drawer
