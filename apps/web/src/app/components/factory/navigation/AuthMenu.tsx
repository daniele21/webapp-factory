import { useState } from 'react'
import { LogIn, LogOut, User, Settings, Loader2 } from 'lucide-react'
import { Avatar } from '../../design-system/primitives/Avatar'
import { Popover } from '../../design-system/overlays/Popover'
import { type AuthProviderId } from '../../design-system/navigation/OAuthButton'
import { useAppConfig } from '@config/src/provider'
import { useTransparencyPreference } from '@/app/lib/useTransparencyPreference'
import { cn } from '@/app/lib/cn'

export type AuthUser = {
	id: string
	email: string
	name?: string
	picture?: string
	roles?: string[]
	provider?: string
	plan?: string
}

export type AuthMenuProps = {
	user: AuthUser | null
	loading?: boolean
	onLogin?: (provider?: string) => void
	onLogout?: () => void | Promise<void>
	loginLabel?: string
	loginProvider?: AuthProviderId
	showSettings?: boolean
	onSettingsClick?: () => void
}

/**
 * AuthMenu - A reusable authentication menu component
 * 
 * Displays a login button when user is not authenticated, or a user menu
 * with avatar and dropdown when authenticated.
 * 
 * @example
 * ```tsx
 * import { useAuth } from '../providers/AuthProvider'
 * import { AuthMenu } from '../components/factory'
 * 
 * function MyHeader() {
 *   const { user, loading, login, logout } = useAuth()
 *   return (
 *     <Header
 *       title="My App"
 *       actions={
 *         <AuthMenu
 *           user={user}
 *           loading={loading}
 *           onLogin={login}
 *           onLogout={logout}
 *         />
 *       }
 *     />
 *   )
 * }
 * ```
 */
export function AuthMenu({
	user,
	loading = false,
	onLogin,
	onLogout,
	loginLabel,
	loginProvider,
	showSettings,
	onSettingsClick,
}: AuthMenuProps) {
	const { config } = useAppConfig()
	const authMenuConfig = config?.components?.authMenu
	const [loggingOut, setLoggingOut] = useState(false)
	const transparencyEnabled = useTransparencyPreference()

	if (authMenuConfig?.enabled === false) {
		return null
	}

	const resolvedProvider: AuthProviderId = loginProvider ?? authMenuConfig?.loginProvider ?? 'google'
	const resolvedLoginLabel = loginLabel ?? authMenuConfig?.loginLabel
	const shouldShowSettings = showSettings ?? authMenuConfig?.showSettings ?? true

	// Loading state placeholder
	if (loading && !user) {
		return (
			<span
				className="inline-flex h-9 w-[92px] animate-pulse items-center justify-center rounded-full bg-muted/60 text-xs text-muted-fg"
				aria-live="polite"
			>
				Loading…
			</span>
		)
	}

	// Not authenticated - show login button
	if (!user) {
		return (
			<button
				type="button"
				onClick={() => onLogin?.(resolvedProvider)}
				disabled={loading}
				className="flex items-center gap-2 rounded-[var(--button-radius)] bg-[var(--secondary)] px-3 py-2 text-sm font-medium text-[var(--secondary-foreground)] transition-colors hover:bg-[var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)] disabled:cursor-not-allowed disabled:opacity-60"
			>
				{loading ? (
					<Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
				) : (
					<LogIn className="h-4 w-4" aria-hidden="true" />
				)}
				<span>{resolvedLoginLabel ?? 'Login'}</span>
			</button>
		)
	}

	// Authenticated - show user menu with dropdown
	const displayName = user.name || user.email.split('@')[0]
	const initials = user.name
		? user.name.split(' ').map(n => n[0]).join('').slice(0, 2)
		: user.email.slice(0, 2)

	const handleLogout = async () => {
		if (!onLogout) return
		setLoggingOut(true)
		try {
			await onLogout()
		} finally {
			setLoggingOut(false)
		}
	}

	return (
		<Popover
			trigger={
				<button
					className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]"
					aria-label="User menu"
				>
					<Avatar
						src={user.picture}
						fallback={initials}
						size={40}
					/>
				</button>
			}
		>
			<div
				className={cn(
					'min-w-[220px] rounded-xl border border-border/60 p-2 shadow-lg',
					transparencyEnabled ? 'bg-bg/95 backdrop-blur' : 'bg-bg'
				)}
			>
				<div className="rounded-md px-2 py-2">
					<p className="text-sm font-semibold text-fg">{displayName}</p>
					<p className="text-xs text-muted-fg/80">{user.email}</p>
				</div>

				{(user.roles?.length || user.plan) && (
					<div className="flex flex-wrap items-center gap-2 px-2 pb-2">
						{user.roles?.[0] && (
							<span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-primary">
								{user.roles[0]}
							</span>
						)}
						{user.plan && (
							<span className="inline-flex items-center rounded-full bg-primary/5 px-2 py-0.5 text-[11px] font-medium text-primary">
								{user.plan}
							</span>
						)}
					</div>
				)}

				<div className="my-1 border-t border-border/70" />

				<button
					type="button"
					className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-[var(--accent)]"
					onClick={() => { /* reserved for profile navigation */ }}
					aria-label="View profile"
				>
					<User className="h-4 w-4" aria-hidden="true" />
					<span>Profile</span>
				</button>

				{shouldShowSettings && (
					<button
						type="button"
						className="mt-1 flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-[var(--accent)]"
						onClick={onSettingsClick}
						aria-label="Settings"
					>
						<Settings className="h-4 w-4" aria-hidden="true" />
						<span>Settings</span>
					</button>
				)}

				<div className="my-1 border-t border-border/70" />

				<button
					type="button"
					className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium text-error transition-colors hover:bg-error/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-error/40 disabled:opacity-60"
					onClick={handleLogout}
					disabled={loggingOut}
					aria-label="Sign out"
				>
					{loggingOut ? (
						<Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
					) : (
						<LogOut className="h-4 w-4" aria-hidden="true" />
					)}
					<span>{loggingOut ? 'Signing out…' : 'Logout'}</span>
				</button>
			</div>
		</Popover>
	)
}

export default AuthMenu
