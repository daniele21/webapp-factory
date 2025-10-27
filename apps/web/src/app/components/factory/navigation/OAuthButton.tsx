import { useMemo, type ComponentPropsWithoutRef, type ReactElement } from 'react'
import { Github, Slack, Mail, UserPlus } from 'lucide-react'
import { Button } from '../../ui/button'

type Provider = 'google' | 'github' | 'slack' | 'email'

const iconForProvider: Record<Provider, ReactElement> = {
	google: <Mail className="h-4 w-4" aria-hidden="true" />,
	github: <Github className="h-4 w-4" aria-hidden="true" />,
	slack: <Slack className="h-4 w-4" aria-hidden="true" />,
	email: <UserPlus className="h-4 w-4" aria-hidden="true" />,
}

type OAuthButtonProps = {
	provider?: Provider
	label?: string
	loading?: boolean
} & Omit<ComponentPropsWithoutRef<'button'>, 'type'>

export const OAuthButton = ({ provider = 'github', label, loading = false, disabled, ...props }: OAuthButtonProps) => {
	const content = useMemo(() => {
		const text = label ?? `Continue with ${provider.charAt(0).toUpperCase()}${provider.slice(1)}`
		return (
			<>
				<span className="flex items-center gap-2">
					{iconForProvider[provider]}
					{text}
				</span>
			</>
		)
	}, [label, provider])

	return (
		<Button
			type="button"
			variant="outline"
			className="w-full justify-center gap-2"
			disabled={disabled || loading}
			{...props}
		>
			{loading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-border border-t-transparent" aria-hidden="true" />}
			{content}
		</Button>
	)
}

export default OAuthButton
