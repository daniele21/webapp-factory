import { cn } from '../../../lib/cn'
import type { Step } from '../types'

type StepperProps = {
	steps: Step[]
}

export const Stepper = ({ steps }: StepperProps) => (
	<ol className="flex flex-wrap gap-4">
		{steps.map((step, index) => (
			<li key={step.id} className="flex items-center gap-2">
				<span
					className={cn(
						'flex h-8 w-8 items-center justify-center rounded-full border text-sm font-semibold',
						step.status === 'complete' && 'border-success bg-success/10 text-success',
						step.status === 'current' && 'border-primary bg-primary/10 text-primary',
						step.status === 'pending' && 'border-border text-muted-fg'
					)}
				>
					{index + 1}
				</span>
				<div>
					<p className="text-sm font-medium">{step.label}</p>
					<p className="text-xs text-muted-fg">{step.status ?? 'pending'}</p>
				</div>
			</li>
		))}
	</ol>
)

export default Stepper
