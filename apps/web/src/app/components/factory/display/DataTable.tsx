import { type ReactNode, useEffect, useMemo, useState } from 'react'
import { flexRender, getCoreRowModel, getSortedRowModel, useReactTable, type ColumnDef, type SortingState, type VisibilityState } from '@tanstack/react-table'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { Check, ChevronsUpDown, Download, ListFilter, Search } from 'lucide-react'
import { cn } from '../../../lib/cn'
import type { TablePage, TableQuery } from '../types'
import { Button } from '../../ui/button'

export type DataTableProps<TData, TValue> = {
	columns: ColumnDef<TData, TValue>[]
	fetcher: (query: TableQuery) => Promise<TablePage<TData>>
	pageSizeOptions?: number[]
	selectable?: boolean
	renderRowActions?: (row: TData) => ReactNode
}

export function DataTable<TData, TValue>({ columns, fetcher, pageSizeOptions = [10, 25, 50], selectable = true, renderRowActions }: DataTableProps<TData, TValue>) {
	const [query, setQuery] = useState<TableQuery>({ page: 0, pageSize: pageSizeOptions[0], sort: null, search: '' })
	const [sorting, setSorting] = useState<SortingState>([])
	const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
	const [density, setDensity] = useState<'comfortable' | 'compact'>('comfortable')
	const [rowSelection, setRowSelection] = useState({})
	const [data, setData] = useState<TData[]>([])
	const [total, setTotal] = useState(0)
	const [loading, setLoading] = useState(false)

	useEffect(() => {
		let alive = true
		setLoading(true)
		fetcher(query)
			.then((page) => {
				if (!alive) return
				setData(page.data)
				setTotal(page.total)
			})
			.finally(() => alive && setLoading(false))
		return () => {
			alive = false
		}
	}, [fetcher, query])

	const augmentedColumns = useMemo<ColumnDef<TData, TValue>[]>(() => {
		const selectionColumn: ColumnDef<TData, TValue> | null = selectable
			? {
					id: 'select',
					header: ({ table }) => (
						<input
							type="checkbox"
							aria-label="Select all"
							className="h-4 w-4 rounded border-border"
							checked={table.getIsAllPageRowsSelected()}
							onChange={(event) => table.toggleAllPageRowsSelected(event.target.checked)}
						/>
					),
					cell: ({ row }) => (
						<input
							type="checkbox"
							aria-label="Select row"
							className="h-4 w-4 rounded border-border"
							checked={row.getIsSelected()}
							onChange={(event) => row.toggleSelected(event.target.checked)}
						/>
					),
				}
			: null
		const actionsColumn: ColumnDef<TData, TValue> | null = renderRowActions
			? {
					id: 'actions',
					header: () => <span className="sr-only">Actions</span>,
					cell: ({ row }) => <div className="flex justify-end">{renderRowActions(row.original)}</div>,
				}
			: null
		return [selectionColumn, ...columns, actionsColumn].filter(Boolean) as ColumnDef<TData, TValue>[]
	}, [columns, selectable, renderRowActions])

	const table = useReactTable({
		data,
		columns: augmentedColumns,
		state: { sorting, columnVisibility, rowSelection },
		onSortingChange: setSorting,
		onColumnVisibilityChange: setColumnVisibility,
		onRowSelectionChange: setRowSelection,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
		manualPagination: true,
		pageCount: Math.ceil(total / query.pageSize) || 1,
		enableRowSelection: selectable,
	})

	useEffect(() => {
		if (sorting.length === 0) {
			setQuery((prev) => ({ ...prev, sort: null }))
		} else {
			const [first] = sorting
			setQuery((prev) => ({ ...prev, sort: { id: first.id, desc: first.desc } }))
		}
	}, [sorting])

	const totalPages = Math.max(1, Math.ceil(total / query.pageSize))

	const exportCsv = () => {
		const visibleColumns = table.getAllLeafColumns().filter((col) => col.getIsVisible() && col.id !== 'select' && col.id !== 'actions')
		const header = visibleColumns.map((col) => col.id)
		const rows = table.getRowModel().rows.map((row) =>
			row
				.getVisibleCells()
				.filter((cell) => cell.column.getIsVisible() && cell.column.id !== 'select' && cell.column.id !== 'actions')
				.map((cell) => {
					const value = cell.getValue() as string | number | null | undefined
					if (value === null || value === undefined) return ''
					const serialized = typeof value === 'string' ? value : String(value)
					return `"${serialized.replace(/"/g, '""')}"`
				})
				.join(',')
		)
		const csv = [header.join(','), ...rows].join('\n')
		const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
		const link = document.createElement('a')
		link.href = URL.createObjectURL(blob)
		link.download = 'export.csv'
		link.click()
	}

	return (
		<div className="space-y-3">
			<div className="flex flex-wrap items-center gap-3">
				<div className="relative">
					<Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-fg" aria-hidden="true" />
					<input
						type="search"
						placeholder="Search table"
						className="h-10 w-64 rounded-xl border border-border/70 bg-card pl-9 pr-3 text-sm"
						value={query.search ?? ''}
						onChange={(event) => setQuery((prev) => ({ ...prev, search: event.target.value, page: 0 }))}
					/>
				</div>
				<DropdownMenu.Root>
					<DropdownMenu.Trigger asChild>
						<Button type="button" variant="outline" className="gap-2">
							<ListFilter className="h-4 w-4" aria-hidden="true" /> Columns
						</Button>
					</DropdownMenu.Trigger>
					<DropdownMenu.Portal>
						<DropdownMenu.Content className="rounded-2xl border border-border bg-card/95 p-2 shadow-xl">
							{table.getAllLeafColumns().map((column) => (
								<DropdownMenu.CheckboxItem
									key={column.id}
									checked={column.getIsVisible()}
									onCheckedChange={(value) => column.toggleVisibility(Boolean(value))}
									className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm"
								>
									<Check className={cn('h-4 w-4 text-transparent', column.getIsVisible() && 'text-primary')} aria-hidden="true" />
									{column.id}
								</DropdownMenu.CheckboxItem>
							))}
						</DropdownMenu.Content>
					</DropdownMenu.Portal>
				</DropdownMenu.Root>
				<Button type="button" variant="outline" onClick={() => setDensity((prev) => (prev === 'compact' ? 'comfortable' : 'compact'))}>
					{density === 'compact' ? 'Comfortable rows' : 'Compact rows'}
				</Button>
				<Button type="button" variant="outline" onClick={exportCsv} className="gap-2">
					<Download className="h-4 w-4" aria-hidden="true" /> Export CSV
				</Button>
			</div>
			<div className="overflow-hidden rounded-2xl border border-border/70">
				<table className="w-full text-sm">
					<thead className="bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-fg">
						{table.getHeaderGroups().map((headerGroup) => (
							<tr key={headerGroup.id}>
								{headerGroup.headers.map((header) => (
									<th key={header.id} className="px-4 py-3">
										{header.isPlaceholder ? null : (
											<button
												type="button"
												className="flex items-center gap-2"
												onClick={header.column.getToggleSortingHandler()}
											>
												{flexRender(header.column.columnDef.header, header.getContext())}
												{header.column.getIsSorted() && (
													<ChevronsUpDown className="h-3.5 w-3.5" aria-hidden="true" />
												)}
											</button>
										)}
									</th>
								))}
							</tr>
						))}
					</thead>
					<tbody>
						{loading
							? Array.from({ length: 5 }).map((_, index) => (
									<tr key={`skeleton-${index}`} className="animate-pulse border-t border-border/50">
										{table.getAllLeafColumns().map((column) => (
											<td key={column.id} className="px-4 py-3">
												<div className="h-4 rounded bg-muted" />
											</td>
										))}
									</tr>
								))
							: table.getRowModel().rows.map((row) => (
									<tr key={row.id} className={cn('border-t border-border/50', density === 'compact' ? 'text-xs' : 'text-sm')}>
										{row.getVisibleCells().map((cell) => (
											<td key={cell.id} className="px-4 py-3">
												{flexRender(cell.column.columnDef.cell, cell.getContext())}
											</td>
										))}
									</tr>
								))}
					</tbody>
				</table>
				<div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/70 bg-muted/30 px-4 py-3 text-sm">
					<div>
						Page {query.page + 1} of {totalPages}
					</div>
					<div className="flex items-center gap-2">
						<select
							className="rounded-xl border border-border/60 bg-card px-2 py-1"
							value={query.pageSize}
							onChange={(event) => setQuery((prev) => ({ ...prev, pageSize: Number(event.target.value), page: 0 }))}
						>
							{pageSizeOptions.map((size) => (
								<option key={size} value={size}>
									{size} / page
								</option>
							))}
						</select>
						<Button type="button" variant="outline" size="sm" disabled={query.page === 0} onClick={() => setQuery((prev) => ({ ...prev, page: Math.max(0, prev.page - 1) }))}>
							Prev
						</Button>
						<Button type="button" variant="outline" size="sm" disabled={query.page + 1 >= totalPages} onClick={() => setQuery((prev) => ({ ...prev, page: Math.min(totalPages - 1, prev.page + 1) }))}>
							Next
						</Button>
					</div>
				</div>
			</div>
		</div>
	)
}

export default DataTable
