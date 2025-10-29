type Props = { label?: string; description?: string }

export function FileDropzone({ label, description }: Props) {
	return (
		<label className="flex flex-col gap-2">
			{label && <div className="font-medium">{label}</div>}
			{description && <div className="text-sm text-muted-fg">{description}</div>}
			<input type="file" />
		</label>
	)
}

export default FileDropzone
