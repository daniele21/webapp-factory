type Props = { label?: string; description?: string; defaultChecked?: boolean }

export function CheckboxField({ label, description, defaultChecked }: Props) {
	return (
		<label className="flex items-start gap-3">
			<input type="checkbox" defaultChecked={defaultChecked} />
			<div>
				{label && <div className="font-medium">{label}</div>}
				{description && <div className="text-sm text-muted-fg">{description}</div>}
			</div>
		</label>
	)
}

export default CheckboxField
