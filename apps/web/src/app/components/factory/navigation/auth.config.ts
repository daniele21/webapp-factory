/**
 * Authentication UI Configuration
 * 
 * Centralized configuration for authentication components.
 * Modify these values to customize auth behavior across the app.
 */

export const authConfig = {
	/**
	 * Default OAuth provider for login button
	 */
	defaultProvider: 'google' as const,

	/**
	 * Default login button label
	 * Set to empty string to use provider-specific default
	 */
	defaultLoginLabel: '',

	/**
	 * Show settings menu item in AuthMenu dropdown
	 */
	showSettings: true,

	/**
	 * Avatar size in pixels
	 */
	avatarSize: 28,

	/**
	 * API endpoints for authentication
	 * These can be overridden via environment variables
	 */
	endpoints: {
		me: '/auth/me',
		login: '/auth/google/login',
		logout: '/auth/logout',
	},

	/**
	 * Menu items configuration
	 */
	menuItems: {
		profile: {
			enabled: true,
			label: 'Profile',
			path: '/profile',
		},
		settings: {
			enabled: true,
			label: 'Settings',
			path: '/settings',
		},
	},

	/**
	 * Visual settings
	 */
	visual: {
		// Show user email in dropdown
		showEmail: true,
		// Show user roles as badges
		showRoles: true,
		// Show user name in trigger button
		showNameInButton: true,
		// Hide name on mobile screens
		hideNameOnMobile: true,
	},
}

/**
 * Provider-specific configuration
 */
export const providerConfig = {
	google: {
		icon: 'Mail',
		label: 'Google',
		color: '#4285F4',
	},
	github: {
		icon: 'Github',
		label: 'GitHub',
		color: '#333333',
	},
	slack: {
		icon: 'Slack',
		label: 'Slack',
		color: '#4A154B',
	},
	email: {
		icon: 'UserPlus',
		label: 'Email',
		color: '#6B7280',
	},
} as const

/**
 * Helper function to get auth configuration
 * Can be extended to read from environment or runtime config
 */
export function getAuthConfig() {
	return {
		...authConfig,
		// Override with environment variables if needed
		endpoints: {
			...authConfig.endpoints,
			// Example: Use env var if available
			// me: import.meta.env.VITE_AUTH_ME_ENDPOINT || authConfig.endpoints.me,
		},
	}
}

export default authConfig
