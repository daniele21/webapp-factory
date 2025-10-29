import { useMemo, useRef, useState } from 'react'
import * as Popover from '@radix-ui/react-popover'
import { Command } from 'cmdk'
import { useVirtualizer } from '@tanstack/react-virtual'
import { Search, Check } from 'lucide-react'
import { cn } from '../../../lib/cn'
import type { SelectOption } from '../types'
import type { FieldCommon } from './fieldShell'
import { FieldShell, inputClasses } from './fieldShell'
import { useId } from 'react'

const XMark = () => <svg viewBox="0 0 20 20" className="h-3 w-3" aria-hidden="true"><path d="M6 6l8 8M14 6l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>

type MultiSelectProps = FieldCommon & {
	options: SelectOption[]
	placeholder?: string
	values?: string[]
	defaultValues?: string[]
	onChange?: (values: string[]) => void
}

export const MultiSelectField = ({ label, description, error, required, options, placeholder = 'Select values', values, defaultValues = [], onChange }: MultiSelectProps) => {
	const [open, setOpen] = useState(false)
	const [search, setSearch] = useState('')
	const [internal, setInternal] = useState<string[]>(defaultValues)
	const listRef = useRef<HTMLDivElement>(null)
	const selected = values ?? internal
	const filtered = useMemo(() => {
		if (!search) return options
		return options.filter((option) => option.label.toLowerCase().includes(search.toLowerCase()))
	}, [options, search])
	const virtualizer = useVirtualizer({
		count: filtered.length,
		estimateSize: () => 38,
		getScrollElement: () => listRef.current,
	})

	const toggleValue = (value: string) => {
		const next = selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value]
		if (!values) setInternal(next)
		onChange?.(next)
	}

	const fieldId = useId()

	return (
		<FieldShell label={label} description={description} error={error} required={required} labelFor={fieldId}>
			<Popover.Root open={open} onOpenChange={setOpen}>
				<Popover.Trigger asChild>
					<button
						type="button"
						id={fieldId}
						aria-expanded={open}
						className={cn(inputClasses, 'flex min-h-[44px] flex-wrap items-center gap-2 text-left')}
					>
						{selected.length === 0 ? (
							<span className="text-muted-fg">{placeholder}</span>
						) : (
							<div className="flex flex-wrap gap-2">
								{selected.map((value) => {
									const option = options.find((opt) => opt.value === value)
									return (
										<span key={value} className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-1 text-xs text-primary">
											{option?.label ?? value}
											<button type="button" className="text-primary" onClick={(event) => {
												event.stopPropagation()
												toggleValue(value)
											}}>
												<XMark />
											</button>
										</span>
									)
								})}
							</div>
						)}
					</button>
				</Popover.Trigger>
				<Popover.Portal>
					<Popover.Content className="z-[var(--z-popover)] w-[320px] rounded-2xl border border-border bg-card/95 p-2 shadow-xl shadow-black/10">
						<Command className="w-full" shouldFilter={false}>
							<div className="flex items-center gap-2 rounded-xl border border-border/70 bg-muted/40 px-2">
								<Search className="h-3.5 w-3.5 text-muted-fg" aria-hidden="true" />
								<Command.Input value={search} onValueChange={setSearch} placeholder="Search" className="h-9 w-full bg-transparent text-sm outline-none" />
							</div>
							<div ref={listRef} className="mt-2 max-h-60 overflow-auto">
								{filtered.length === 0 && <p className="px-3 py-4 text-sm text-muted-fg">No results</p>}
								{filtered.length > 0 && (
									<div style={{ height: `${virtualizer.getTotalSize()}px`, position: 'relative' }}>
										{virtualizer.getVirtualItems().map((virtualRow) => {
											const option = filtered[virtualRow.index]
											const checked = selected.includes(option.value)
											return (
												<Command.Item
													key={option.value}
													value={`${option.label}-${option.value}`}
													onSelect={() => toggleValue(option.value)}
													className="absolute inset-x-0 flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-sm text-fg hover:bg-muted/40"
													style={{ transform: `translateY(${virtualRow.start}px)` }}
												>
													<span className={cn('inline-flex h-4 w-4 items-center justify-center rounded border border-border', checked && 'bg-primary text-primary-fg')}>{checked && <Check className="h-3 w-3" aria-hidden="true" />}</span>
													<span className="flex-1 truncate">{option.label}</span>
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

export default MultiSelectField
