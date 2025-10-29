import { AuthMenu } from '../components/design-system'
import { useAuth } from '../providers/AuthProvider'
import type { ComponentProps } from 'react'

/**
 * AuthMenuConnected - A connected version of AuthMenu that automatically uses the AuthProvider
 * 
 * This component connects the AuthMenu to the global AuthProvider context,
 * so you don't need to pass user, loading, login, and logout props manually.
 * 
 * @example
 * ```tsx
 * import { Header } from '../components/design-system'
 * import { AuthMenuConnected } from '../components/AuthMenuConnected'
 * 
 * function MyPage() {
 *   return (
 *     <Header
 *       title="Dashboard"
 *       actions={<AuthMenuConnected />}
 *     />
 *   )
 * }
 * ```
 */
export function AuthMenuConnected(
	props: Omit<ComponentProps<typeof AuthMenu>, 'user' | 'loading' | 'onLogin' | 'onLogout'>
) {
	const { user, loading, login, logout } = useAuth()

	return (
		<AuthMenu
			user={user}
			loading={loading}
			onLogin={login}
			onLogout={logout}
			{...props}
		/>
	)
}

export default AuthMenuConnected
