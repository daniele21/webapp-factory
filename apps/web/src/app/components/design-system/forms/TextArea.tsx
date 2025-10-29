type Props = { label?: string }

export function TextArea({ label }: Props) {
	return (
		<label className="flex flex-col gap-1">
			{label && <span className="text-sm font-medium">{label}</span>}
			<textarea className="input" />
		</label>
	)
}

export default TextArea
