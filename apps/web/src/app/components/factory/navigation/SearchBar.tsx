import { useState } from 'react'
import { Search } from 'lucide-react'

type SearchBarProps = {
	placeholder?: string
	onSearch: (value: string) => void
	recent?: string[]
}

export const SearchBar = ({ placeholder = 'Search across app…', onSearch, recent = [] }: SearchBarProps) => {
	const [value, setValue] = useState('')
	return (
		<div className="space-y-2">
			<div className="relative">
				<Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-fg" aria-hidden="true" />
				<input
					value={value}
					onChange={(event) => setValue(event.target.value)}
					onKeyDown={(event) => {
						if (event.key === 'Enter') onSearch(value)
					}}
					placeholder={placeholder}
					className="h-12 w-full rounded-2xl border border-border/70 bg-card pl-10 pr-4 text-sm shadow-sm"
				/>
				<kbd className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded-md border border-border/80 bg-muted px-2 py-1 text-[10px] text-muted-fg">
					⌘ + K
				</kbd>
			</div>
			{recent.length > 0 && (
				<div className="flex flex-wrap gap-2 text-xs">
					{recent.map((item) => (
						<button
							key={item}
							type="button"
							className="rounded-full border border-border/70 px-2 py-1 text-muted-fg hover:border-primary hover:text-primary"
							onClick={() => {
								setValue(item)
								onSearch(item)
							}}
						>
							{item}
						</button>
					))}
				</div>
			)}
		</div>
	)
}

export default SearchBar
