import { useEffect, useRef, useState } from 'react'
import * as Popover from '@radix-ui/react-popover'
import { Command } from 'cmdk'
import { useVirtualizer } from '@tanstack/react-virtual'
import { Search, ChevronDown } from 'lucide-react'
import { cn } from '../../../lib/cn'
import type { SelectOption } from '../types'
import type { FieldCommon } from './fieldShell'
import { FieldShell, inputClasses } from './fieldShell'

type ComboboxProps = FieldCommon & {
	placeholder?: string
	emptyText?: string
	onSearch: (query: string) => Promise<SelectOption[]>
	onSelect: (option: SelectOption) => void
}

export const ComboboxField = ({ label, description, error, required, placeholder = 'Search records', emptyText = 'No matches', onSearch, onSelect }: ComboboxProps) => {
	const [open, setOpen] = useState(false)
	const [query, setQuery] = useState('')
	const [loading, setLoading] = useState(false)
	const [options, setOptions] = useState<SelectOption[]>([])
	const listRef = useRef<HTMLDivElement>(null)

	useEffect(() => {
		let alive = true
		setLoading(true)
		onSearch(query)
			.then((results) => {
				if (alive) setOptions(results)
			})
			.finally(() => alive && setLoading(false))
		return () => {
			alive = false
		}
	}, [query, onSearch])

	const virtualizer = useVirtualizer({
		count: options.length,
		estimateSize: () => 40,
		getScrollElement: () => listRef.current,
	})

	return (
		<FieldShell label={label} description={description} error={error} required={required}>
			<Popover.Root open={open} onOpenChange={setOpen}>
				<Popover.Trigger asChild>
					<button type="button" className={cn(inputClasses, 'flex items-center justify-between gap-3 text-left')}>
						<span className="text-muted-fg">{placeholder}</span>
						<ChevronDown className="h-4 w-4 text-muted-fg" aria-hidden="true" />
					</button>
				</Popover.Trigger>
				<Popover.Portal>
					<Popover.Content className="z-[var(--z-popover)] w-[360px] rounded-2xl border border-border bg-card/95 p-2 shadow-xl">
						<Command className="w-full" shouldFilter={false}>
							<div className="flex items-center gap-2 rounded-xl border border-border/70 bg-muted/40 px-2">
								<Search className="h-3.5 w-3.5 text-muted-fg" aria-hidden="true" />
								<Command.Input value={query} onValueChange={setQuery} placeholder={placeholder} className="h-9 w-full bg-transparent text-sm outline-none" />
							</div>
							<div ref={listRef} className="mt-2 max-h-64 overflow-auto">
								{loading && <p className="px-3 py-2 text-sm text-muted-fg">Searching…</p>}
								{!loading && options.length === 0 && <p className="px-3 py-4 text-sm text-muted-fg">{emptyText}</p>}
								{!loading && options.length > 0 && (
									<div style={{ height: `${virtualizer.getTotalSize()}px`, position: 'relative' }}>
										{virtualizer.getVirtualItems().map((virtualRow) => {
											const option = options[virtualRow.index]
											return (
												<Command.Item
													key={option.value}
													value={`${option.label}-${option.value}`}
													onSelect={() => {
														onSelect(option)
														setOpen(false)
													}}
													className="absolute inset-x-0 flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-sm hover:bg-muted/40"
													style={{ transform: `translateY(${virtualRow.start}px)` }}
												>
													<Search className="h-4 w-4 text-muted-fg" aria-hidden="true" />
													<div>
														<p className="font-medium">{option.label}</p>
														{option.description && <p className="text-xs text-muted-fg">{option.description}</p>}
													</div>
												</Command.Item>
											)
										})}
									</div>
								)}
							</div>
						</Command>
					</Popover.Content>
				</Popover.Portal>
			</Popover.Root>
		</FieldShell>
	)
}

export default ComboboxField
