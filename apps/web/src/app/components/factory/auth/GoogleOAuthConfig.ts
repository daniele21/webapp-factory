/**
 * Google OAuth Configuration
 * 
 * Configuration options for Google OAuth popup component
 */

export interface GoogleOAuthConfig {
	/**
	 * API base URL for backend OAuth endpoints
	 * @default '/api'
	 */
	apiBaseUrl: string

	/**
	 * Google Workspace domain to restrict login to (optional)
	 * Example: 'example.com' restricts to @example.com emails
	 */
	hostedDomain?: string

	/**
	 * Enable debug logging
	 * @default false
	 */
	debug: boolean

	/**
	 * Scopes to request from Google
	 * @default ['openid', 'email', 'profile']
	 */
	scopes: string[]
}

/**
 * Default configuration
 */
export const defaultGoogleOAuthConfig: GoogleOAuthConfig = {
	apiBaseUrl: '/api',
	debug: false,
	scopes: ['openid', 'email', 'profile'],
}

/**
 * Create custom configuration by merging with defaults
 */
export function createGoogleOAuthConfig(
	config: Partial<GoogleOAuthConfig>
): GoogleOAuthConfig {
	return {
		...defaultGoogleOAuthConfig,
		...config,
	}
}
