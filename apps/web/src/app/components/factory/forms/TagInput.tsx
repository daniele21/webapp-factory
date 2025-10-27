type Props = { label?: string; suggestions?: { label: string; value: string }[] }

export function TagInput({ label }: Props) {
	return (
		<label className="flex flex-col gap-1">
			{label && <span className="text-sm font-medium">{label}</span>}
			<input className="input" placeholder="Add tags" />
		</label>
	)
}

export default TagInput
