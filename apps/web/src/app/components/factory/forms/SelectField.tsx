import { useMemo, useRef, useState } from 'react'
import * as Popover from '@radix-ui/react-popover'
import { Command } from 'cmdk'
import { useVirtualizer } from '@tanstack/react-virtual'
import { ChevronDown, Search, Check } from 'lucide-react'
import { cn } from '../../../lib/cn'
import type { SelectOption } from '../types'
import type { FieldCommon } from './fieldShell'
import { FieldShell, inputClasses } from './fieldShell'
import { useId } from 'react'

type SelectBaseProps = FieldCommon & {
	options: SelectOption[]
	placeholder?: string
	value?: string
	defaultValue?: string
	onChange?: (value: string) => void
	creatableLabel?: string
	onCreateOption?: (label: string) => void
}

export const SelectField = ({ label, description, error, required, options, placeholder = 'Select', value, defaultValue, onChange, creatableLabel = 'Create option', onCreateOption }: SelectBaseProps) => {
	const [open, setOpen] = useState(false)
	const [search, setSearch] = useState('')
	const [internal, setInternal] = useState<string>(defaultValue ?? '')
	const listRef = useRef<HTMLDivElement>(null)
	const selected = value ?? internal
	const filtered = useMemo(() => {
		if (!search) return options
		return options.filter((option) => option.label.toLowerCase().includes(search.toLowerCase()))
	}, [options, search])
	const canCreate = Boolean(search && onCreateOption && !options.some((option) => option.label.toLowerCase() === search.toLowerCase()))
	const virtualizedOptions = canCreate
		? [...filtered, { label: `${creatableLabel} "${search}"`, value: '__create__', description: undefined }]
		: filtered
	const virtualizer = useVirtualizer({
		count: virtualizedOptions.length,
		estimateSize: () => 40,
		getScrollElement: () => listRef.current,
	})

	const handleSelect = (next: string) => {
		if (next === '__create__' && onCreateOption && search) {
			onCreateOption(search)
			setSearch('')
			setOpen(false)
			return
		}
		if (value === undefined) setInternal(next)
		onChange?.(next)
		setOpen(false)
	}

	const selectedLabel = options.find((option) => option.value === selected)?.label
	const fieldId = useId()

	return (
		<FieldShell label={label} description={description} error={error} required={required} labelFor={fieldId}>
			<Popover.Root open={open} onOpenChange={setOpen}>
				<Popover.Trigger asChild>
					<button
						type="button"
						id={fieldId}
						aria-haspopup="listbox"
						aria-expanded={open}
						className={cn(inputClasses, 'flex items-center justify-between gap-3 text-left')}
					>
						<span className={cn('truncate', !selected && 'text-muted-fg')}>{selectedLabel ?? placeholder}</span>
						<ChevronDown className="h-4 w-4 text-muted-fg" aria-hidden="true" />
					</button>
				</Popover.Trigger>
				<Popover.Portal>
					<Popover.Content className="z-[var(--z-popover)] w-[320px] rounded-2xl border border-border bg-card/95 p-2 shadow-xl shadow-black/10">
						<Command className="w-full" shouldFilter={false}>
							<div className="flex items-center gap-2 rounded-xl border border-border/70 bg-muted/40 px-2">
								<Search className="h-3.5 w-3.5 text-muted-fg" aria-hidden="true" />
								<Command.Input value={search} onValueChange={setSearch} placeholder="Search options" className="h-9 w-full bg-transparent text-sm outline-none" />
							</div>
							<div ref={listRef} className="mt-2 max-h-60 overflow-auto">
								{virtualizedOptions.length === 0 && <p className="px-3 py-4 text-sm text-muted-fg">No options found</p>}
								{virtualizedOptions.length > 0 && (
									<div style={{ height: `${virtualizer.getTotalSize()}px`, position: 'relative' }}>
										{virtualizer.getVirtualItems().map((virtualRow) => {
											const option = virtualizedOptions[virtualRow.index]
											const isCreate = option.value === '__create__'
											const optionValue = isCreate ? search : option.value
											return (
												<Command.Item
													key={`${option.value}-${virtualRow.index}`}
													value={`${option.label}-${option.value}`}
													onSelect={() => handleSelect(isCreate ? '__create__' : optionValue)}
													className={cn(
														'absolute inset-x-0 flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-sm text-fg hover:bg-muted/40',
														selected === option.value && 'bg-primary/10 text-primary'
													)}
													style={{ transform: `translateY(${virtualRow.start}px)` }}
												>
													<Check className={cn('h-4 w-4 text-transparent', selected === option.value && 'text-primary')} aria-hidden="true" />
													<span className="flex-1 truncate">{option.label}</span>
													{option.description && <span className="text-xs text-muted-fg">{option.description}</span>}
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

export default SelectField
