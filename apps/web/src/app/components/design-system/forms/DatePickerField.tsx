type Props = { label?: string }

export function DatePickerField({ label }: Props) {
	return (
		<label className="flex flex-col gap-1">
			{label && <span className="text-sm font-medium">{label}</span>}
			<input type="date" className="input" />
		</label>
	)
}

export default DatePickerField
