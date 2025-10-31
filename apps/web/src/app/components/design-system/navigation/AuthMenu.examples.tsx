import * as React from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../../providers/AuthProvider'
import { AuthMenu, AppShell, Header } from '../../../components/design-system'
import { AuthMenuConnected } from '../../../components/AuthMenuConnected'
import type { AuthUser } from '../../factory/navigation/AuthMenu'

/**
 * Authentication UI Component Examples
 *
 * This file demonstrates various ways to use the AuthMenu component
 * in different scenarios.
 */

/**
 * Example 1: Basic Usage with AuthMenuConnected
 *
 * This is the simplest and recommended approach for most cases.
 * The component automatically connects to the AuthProvider.
 */
export function Example1_BasicUsage() {
	return (
		<Header
			title="Dashboard"
			subtitle="Welcome back!"
			actions={<AuthMenuConnected />}
		/>
	)
}

/**
 * Example 2: Custom Login Provider
 *
 * Use a different OAuth provider (GitHub, Slack, etc.)
 */
export function Example2_CustomProvider() {
	return (
		<Header
			title="Developer Portal"
			actions={
				<AuthMenuConnected
					loginProvider="github"
					loginLabel="Sign in with GitHub"
				/>
			}
		/>
	)
}

/**
 * Example 3: With Custom Settings Handler
 *
 * Add a custom click handler for the settings menu item
 */
export function Example3_CustomSettings() {
	const navigate = useNavigate()

	return (
		<Header
			title="Dashboard"
			actions={
				<AuthMenuConnected
					onSettingsClick={() => navigate('/settings')}
				/>
			}
		/>
	)
}

/**
 * Example 4: Conditional Settings Based on Role
 *
 * Only show settings to admin users
 */
export function Example4_RoleBasedSettings() {
	const navigate = useNavigate()
	const { user } = useAuth()
	const isAdmin = user?.roles?.includes('admin')

	return (
		<Header
			title="Admin Panel"
			actions={
				<AuthMenuConnected
					showSettings={isAdmin}
					onSettingsClick={() => navigate('/admin/settings')}
				/>
			}
		/>
	)
}

/**
 * Example 5: Inside the AppShell layout
 *
 * Combine AuthMenu with the shared AppShell for a consistent frame.
 */
export function Example5_AppShellLayout({ children }: { children: React.ReactNode }) {
	return (
		<AppShell>
			<div className="space-y-6">
				<Header
					title="Webapp Factory"
					subtitle="Build faster, ship better"
					actions={<AuthMenuConnected />}
				/>
				<div>{children}</div>
			</div>
		</AppShell>
	)
}

/**
 * Example 6: Manual Control (without AuthProvider)
 *
 * Use AuthMenu directly with manual state management.
 * Useful for testing or when not using AuthProvider.
 */
export function Example6_ManualControl() {
	const [user, setUser] = React.useState<AuthUser | null>(null)
	const [loading, setLoading] = React.useState(false)

	const handleLogin = () => {
		setLoading(true)
		// Your login logic
		window.location.href = '/api/auth/google/login'
	}

	const handleLogout = async () => {
		await fetch('/api/auth/logout', { method: 'POST' })
		setUser(null)
	}

	return (
		<AuthMenu
			user={user}
			loading={loading}
			onLogin={handleLogin}
			onLogout={handleLogout}
			loginProvider="google"
		/>
	)
}

/**
 * Example 7: Multiple Actions in Header
 *
 * Combine AuthMenu with other action buttons
 */
export function Example7_MultipleActions() {
	return (
		<Header
			title="Dashboard"
			actions={
				<>
					<button className="btn-ghost">Notifications</button>
					<button className="btn-ghost">Help</button>
					<AuthMenuConnected />
				</>
			}
		/>
	)
}

/**
 * Example 8: Protected Route Pattern
 *
 * Show different UI based on authentication state
 */
export function Example8_ProtectedRoute() {
	const { user, loading } = useAuth()
	const navigate = useNavigate()

	if (loading) {
		return <div>Loading...</div>
	}

	if (!user) {
		return (
			<div className="flex flex-col items-center justify-center min-h-screen">
				<h1 className="text-2xl mb-4">Please sign in to continue</h1>
				<AuthMenuConnected loginLabel="Sign In" />
			</div>
		)
	}

	return (
		<div>
			<Header
				title="Protected Content"
				actions={<AuthMenuConnected />}
			/>
			<div className="p-6">
				<p>Welcome, {user.name || user.email}!</p>
				<button
					onClick={() => navigate('/settings')}
					className="btn-ghost mt-4"
				>
					Account settings
				</button>
			</div>
		</div>
	)
}

/**
 * Example 9: Custom Styling
 *
 * Wrap AuthMenu with custom styling
 */
export function Example9_CustomStyling() {
	return (
		<div className="rounded-lg border border-primary p-1">
			<AuthMenuConnected />
		</div>
	)
}
