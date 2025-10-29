import { useState } from 'react'
import { LogOut, User, Settings, ChevronDown, Loader2 } from 'lucide-react'
import { Avatar } from '../primitives/Avatar'
import { Popover } from '../overlays/Popover'
import { OAuthButton, type AuthProviderId } from './OAuthButton'
import { useAppConfig } from '@config/src/provider'

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

	if (authMenuConfig?.enabled === false) {
		return null
	}

	const resolvedProvider: AuthProviderId = loginProvider ?? authMenuConfig?.loginProvider ?? 'google'
	const resolvedLoginLabel = loginLabel ?? authMenuConfig?.loginLabel
	const shouldShowSettings = showSettings ?? authMenuConfig?.showSettings ?? true
	const [loggingOut, setLoggingOut] = useState(false)

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
			<OAuthButton
				provider={resolvedProvider}
				label={resolvedLoginLabel}
				loading={loading}
				onClick={() => onLogin?.(resolvedProvider)}
				aria-label="Sign in"
			/>
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
					className="group flex items-center gap-2 rounded-full border border-border/60 bg-card px-3 py-2 text-sm shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 hover:border-border hover:bg-card/90"
					aria-label="User menu"
				>
					<Avatar
						src={user.picture}
						fallback={initials}
						size={28}
					/>
					<div className="flex flex-col items-start">
						<span className="font-medium leading-none">{displayName}</span>
						<span className="text-[11px] uppercase tracking-wide text-muted-fg/80">
							{user.roles?.[0] ?? 'Member'}
						</span>
					</div>
					<ChevronDown className="hidden sm:block h-4 w-4 text-muted-fg transition group-hover:translate-y-[1px]" aria-hidden="true" />
				</button>
			}
		>
			<div className="min-w-[220px] space-y-2 rounded-xl border border-border/60 bg-bg/95 p-2 shadow-lg backdrop-blur">
				{/* Name and email (compact) */}
				<div className="rounded-md px-2 py-2">
					<div className="flex items-center gap-2">
						<Avatar src={user.picture} fallback={initials} size={36} />
						<div className="flex flex-col min-w-0">
							<span className="text-sm font-medium text-fg truncate">{displayName}</span>
							<span className="text-xs text-muted-fg/80 truncate">{user.email}</span>
						</div>
					</div>
				</div>

				{/* Role and Plan on same compact row */}
				<div className="flex items-center justify-end gap-2 px-2">
					{(user.roles && user.roles.length > 0) && (
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

				{/* Menu items */}
				<div className="space-y-1">
					<button
						type="button"
						className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
						onClick={() => {/* Navigate to profile or handle profile action */}}
						aria-label="View profile"
					>
						<User className="h-4 w-4 text-muted-fg" aria-hidden="true" />
						<span>Profile</span>
					</button>

					{shouldShowSettings && (
						<button
							type="button"
							className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
							onClick={onSettingsClick}
							aria-label="Settings"
						>
							<Settings className="h-4 w-4 text-muted-fg" aria-hidden="true" />
							<span>Settings</span>
						</button>
					)}

					<div className="border-t border-border/70 pt-2 mt-2">
						<button
							type="button"
							className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-error transition hover:bg-error/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-error/40 disabled:opacity-60"
							onClick={handleLogout}
							disabled={loggingOut}
							aria-label="Sign out"
						>
							{loggingOut ? (
								<Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
							) : (
								<LogOut className="h-4 w-4" aria-hidden="true" />
							)}
							<span>{loggingOut ? 'Signing out…' : 'Sign out'}</span>
						</button>
					</div>
				</div>
			</div>
		</Popover>
	)
}

export default AuthMenu
