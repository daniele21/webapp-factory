import { useState } from 'react'
import { LogOut, User, Settings, ChevronDown } from 'lucide-react'
import { Avatar } from '../primitives/Avatar'
import { Popover } from '../overlays/Popover'
import { Button } from '../../ui/button'
import { OAuthButton } from './OAuthButton'

export type AuthUser = {
	id: string
	email: string
	name?: string
	picture?: string
	roles?: string[]
}

export type AuthMenuProps = {
	user: AuthUser | null
	loading?: boolean
	onLogin?: (provider?: string) => void
	onLogout?: () => void | Promise<void>
	loginLabel?: string
	loginProvider?: 'google' | 'github' | 'slack' | 'email'
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
	loginProvider = 'google',
	showSettings = true,
	onSettingsClick,
}: AuthMenuProps) {
	const [loggingOut, setLoggingOut] = useState(false)

	// Not authenticated - show login button
	if (!user) {
		return (
			<OAuthButton
				provider={loginProvider}
				label={loginLabel}
				loading={loading}
				onClick={() => onLogin?.(loginProvider)}
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
					className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm hover:bg-card/80 focus:outline-none focus:ring-2 focus:ring-primary/50"
					aria-label="User menu"
				>
					<Avatar
						src={user.picture}
						fallback={initials}
						size={28}
					/>
					<span className="hidden sm:inline font-medium">{displayName}</span>
					<ChevronDown className="h-4 w-4 text-muted-fg" aria-hidden="true" />
				</button>
			}
		>
			<div className="min-w-[200px] space-y-1">
				{/* User info section */}
				<div className="border-b border-border pb-2 mb-2">
					<p className="text-sm font-semibold text-fg">{displayName}</p>
					<p className="text-xs text-muted-fg">{user.email}</p>
					{user.roles && user.roles.length > 0 && (
						<div className="mt-1 flex flex-wrap gap-1">
							{user.roles.map((role) => (
								<span
									key={role}
									className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary"
								>
									{role}
								</span>
							))}
						</div>
					)}
				</div>

				{/* Menu items */}
				<div className="space-y-1">
					<button
						className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-bg/50 focus:outline-none focus:ring-2 focus:ring-primary/50"
						onClick={() => {/* Navigate to profile or handle profile action */}}
						aria-label="View profile"
					>
						<User className="h-4 w-4 text-muted-fg" aria-hidden="true" />
						<span>Profile</span>
					</button>

					{showSettings && (
						<button
							className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-bg/50 focus:outline-none focus:ring-2 focus:ring-primary/50"
							onClick={onSettingsClick}
							aria-label="Settings"
						>
							<Settings className="h-4 w-4 text-muted-fg" aria-hidden="true" />
							<span>Settings</span>
						</button>
					)}

					<div className="border-t border-border pt-1 mt-1">
						<button
							className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-error hover:bg-error/5 focus:outline-none focus:ring-2 focus:ring-error/50 disabled:opacity-50"
							onClick={handleLogout}
							disabled={loggingOut}
							aria-label="Sign out"
						>
							<LogOut className="h-4 w-4" aria-hidden="true" />
							<span>{loggingOut ? 'Signing out...' : 'Sign out'}</span>
						</button>
					</div>
				</div>
			</div>
		</Popover>
	)
}

export default AuthMenu
