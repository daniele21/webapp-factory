import { type ComponentPropsWithoutRef, type ReactElement } from 'react'
import { Github, Slack, Mail } from 'lucide-react'
import { Button } from '../../ui/button'
import { useAppConfig } from '@config/src/provider'
import { cn } from '../../../lib/cn'

export type AuthProviderId = 'google' | 'github' | 'slack' | 'email'

const GoogleSvg = (
	<svg viewBox="0 0 533.5 544.3" className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
		<path fill="#4285F4" d="M533.5 278.4c0-18.4-1.5-36.1-4.3-53.3H272v100.8h146.9c-6.4 34.5-25.7 63.8-54.8 83.4v69.2h88.6c51.8-47.7 81.8-118 81.8-200.1z" />
		<path fill="#34A853" d="M272 544.3c73.8 0 135.7-24.5 181-66.7l-88.6-69.2c-24.6 16.5-56 26.2-92.4 26.2-71 0-131.2-47.9-152.7-112.3H28.9v70.5C74.1 492.3 166 544.3 272 544.3z" />
		<path fill="#FBBC05" d="M119.3 322.3c-9.5-28.5-9.5-59 0-87.5V164.3H28.9c-39.3 76.8-39.3 168.8 0 245.6l90.4-70.5z" />
		<path fill="#EA4335" d="M272 107.7c39.9-.6 78.1 13.5 106.9 38.9l80.2-80.2C407.2 23.8 345.3 0 272 0 166 0 74.1 52 28.9 131.5l90.4 70.5C140.8 155.6 201 107.7 272 107.7z" />
	</svg>
)

const iconForProvider: Record<AuthProviderId, ReactElement> = {
	google: GoogleSvg,
	// keep lucide icons but let them inherit current color so they blend nicely with the text
	github: <Github className="h-5 w-5" aria-hidden="true" />,
	slack: <Slack className="h-5 w-5" aria-hidden="true" />,
	email: <Mail className="h-5 w-5" aria-hidden="true" />,
}

type OAuthButtonProps = {
	provider?: AuthProviderId
	label?: string
	loading?: boolean
    compact?: boolean
	fullWidth?: boolean
} & Omit<ComponentPropsWithoutRef<'button'>, 'type'>

export const OAuthButton = ({ provider = 'google', label, loading = false, disabled, compact = false, fullWidth = false, ...props }: OAuthButtonProps) => {
	const { config } = useAppConfig()
	const menuConfig = config?.components?.authMenu
	const providersConfig = (config?.components?.authMenu?.providers ?? []) as { id: AuthProviderId; label?: string }[]
	const configLabel = providersConfig.find((p) => p.id === provider)?.label
	const defaultLabel = `Continue with ${provider.charAt(0).toUpperCase()}${provider.slice(1)}`
	const text = label ?? menuConfig?.loginLabel ?? configLabel ?? defaultLabel

	return (
		<Button
			type="button"
			variant="outline"
			size={compact ? 'sm' : 'lg'}
			className={cn(
				'group relative inline-flex items-center gap-2 rounded-full bg-transparent text-foreground transition-all duration-150 hover:translate-y-0 hover:bg-primary/5 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-60',
				// sizing: if fullWidth is true use full width behavior, otherwise shrink-to-fit with a reasonable min width
				fullWidth ? 'w-full justify-center px-5 py-3 text-sm font-semibold min-w-[220px]' : (compact ? 'min-w-0 px-2 py-1 text-xs' : 'min-w-[140px] px-3 py-2 text-sm'),
				props.className
			)}
			aria-label={text}
			disabled={disabled || loading}
			{...props}
		>
			{/* inline icon, no bubble */}
			<span className={cn('inline-flex items-center justify-center flex-shrink-0', compact ? 'h-4 w-4' : 'h-5 w-5')} aria-hidden="true">
				{iconForProvider[provider]}
			</span>

			<span className={cn('text-center tracking-tight', compact ? 'text-xs font-medium' : 'text-sm font-semibold')}> 
				{text}
			</span>

			{loading ? (
				<span
					className={cn(
						compact ? 'ml-2 h-4 w-4 border-2' : 'ml-2 h-5 w-5 border-2',
						'animate-spin rounded-full border-border/70 border-t-transparent'
					)}
					aria-hidden="true"
				/>
			) : (
				<span className="w-5" aria-hidden="true" />
			)}
		</Button>
	)
}

export default OAuthButton
