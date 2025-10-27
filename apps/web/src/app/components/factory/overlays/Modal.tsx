import * as Dialog from '@radix-ui/react-dialog'
import { Button } from '../../ui/button'
import type { ReactNode } from 'react'

type ModalProps = {
	title: string
	description?: string
	trigger: ReactNode
	children: ReactNode
}

export const Modal = ({ title, description, trigger, children }: ModalProps) => (
	<Dialog.Root>
		<Dialog.Trigger asChild>{trigger}</Dialog.Trigger>
		<Dialog.Portal>
			<Dialog.Overlay className="fixed inset-0 z-[var(--z-modal-backdrop)] bg-black/40 backdrop-blur-sm" />
			<Dialog.Content className="fixed inset-0 z-[var(--z-modal)] m-auto h-fit w-full max-w-lg component-radius component-border bg-card/95 component-spacing component-elevation component-backdrop component-motion">
				<Dialog.Title className="text-xl font-semibold">{title}</Dialog.Title>
				{description && <Dialog.Description className="mt-1 text-sm text-muted-fg">{description}</Dialog.Description>}
				<div className="mt-4 space-y-4">{children}</div>
				<Dialog.Close asChild>
					<Button type="button" variant="secondary" className="mt-6 w-full">
						Close
					</Button>
				</Dialog.Close>
			</Dialog.Content>
		</Dialog.Portal>
	</Dialog.Root>
)

export default Modal
