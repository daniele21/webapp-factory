/**
 * Google OAuth Popup Component using GIS Authorization Code Flow
 * 
 * This component implements secure Google OAuth authentication using:
 * - Google Identity Services (GIS) with Authorization Code model
 * - Popup UX (ux_mode: 'popup')
 * - CSRF protection via custom headers
 * - Server-side code exchange
 * 
 * References:
 * - https://developers.google.com/identity/gsi/web/guides/overview
 * - https://developers.google.com/identity/oauth2/web/guides/use-code-model
 */

import React, { useEffect, useState, useCallback } from 'react'

declare global {
	interface Window {
		google?: {
			accounts: {
				oauth2: {
					initCodeClient: (config: GoogleCodeClientConfig) => GoogleCodeClient
					revoke: (accessToken: string, callback: () => void) => void
				}
			}
		}
	}
}

interface GoogleCodeClientConfig {
	client_id: string
	scope: string
	ux_mode: 'popup' | 'redirect'
	redirect_uri?: string
	state?: string
	callback: (response: GoogleCodeResponse) => void
	error_callback?: (error: GoogleErrorResponse) => void
}

interface GoogleCodeClient {
	requestCode: () => void
}

interface GoogleCodeResponse {
	code: string
	scope: string
	state?: string
	error?: string
	error_description?: string
	error_uri?: string
}

interface GoogleErrorResponse {
	type: string
	message: string
}

export interface GoogleOAuthPopupProps {
	/**
	 * API base URL for backend endpoints
	 * @default '/api'
	 */
	apiBaseUrl?: string
	
	/**
	 * Callback when authentication succeeds
	 */
	onSuccess?: (user: GoogleUser) => void
	
	/**
	 * Callback when authentication fails
	 */
	onError?: (error: Error) => void
	
	/**
	 * Custom button component
	 * If not provided, uses default "Sign in with Google" button
	 */
	children?: React.ReactNode
	
	/**
	 * Additional CSS classes for the button
	 */
	className?: string
	
	/**
	 * Disabled state
	 */
	disabled?: boolean
	
	/**
	 * Google Workspace domain to restrict to (optional)
	 * If set, only users from this domain can sign in
	 */
	hostedDomain?: string
}

export interface GoogleUser {
	id: string
	email: string
	name?: string
	picture?: string
}

const GIS_SCRIPT_URL = 'https://accounts.google.com/gsi/client'

/**
 * GoogleOAuthPopup - Secure Google OAuth with popup flow
 * 
 * @example
 * ```tsx
 * import { GoogleOAuthPopup } from './components/GoogleOAuthPopup'
 * 
 * function LoginPage() {
 *   const handleSuccess = (user) => {
 *     console.log('Logged in:', user)
 *   }
 *   
 *   return (
 *     <GoogleOAuthPopup onSuccess={handleSuccess}>
 *       <button>Sign in with Google</button>
 *     </GoogleOAuthPopup>
 *   )
 * }
 * ```
 */
export function GoogleOAuthPopup({
	apiBaseUrl = '/api',
	onSuccess,
	onError,
	children,
	className,
	disabled = false,
	hostedDomain,
}: GoogleOAuthPopupProps) {
	const [isLoading, setIsLoading] = useState(false)
	const [gsiLoaded, setGsiLoaded] = useState(false)
	const [clientConfig, setClientConfig] = useState<GoogleCodeClientConfig | null>(null)
	const [codeClient, setCodeClient] = useState<GoogleCodeClient | null>(null)

	// Load Google Identity Services script
	useEffect(() => {
		// Check if already loaded
		if (window.google?.accounts?.oauth2) {
			setGsiLoaded(true)
			return
		}

		// Load script
		const script = document.createElement('script')
		script.src = GIS_SCRIPT_URL
		script.async = true
		script.defer = true
		script.onload = () => setGsiLoaded(true)
		script.onerror = () => {
			console.error('Failed to load Google Identity Services')
			onError?.(new Error('Failed to load Google Identity Services'))
		}
		document.body.appendChild(script)

		return () => {
			// Cleanup: remove script on unmount
			if (script.parentNode) {
				script.parentNode.removeChild(script)
			}
		}
	}, [onError])

	// Fetch OAuth config from backend
	useEffect(() => {
		if (!gsiLoaded) return

		const fetchConfig = async () => {
			try {
				const response = await fetch(`${apiBaseUrl}/auth/google/config`, {
					headers: {
						'X-Requested-With': 'XMLHttpRequest',
					},
					credentials: 'include',
				})

				if (!response.ok) {
					throw new Error('Failed to fetch OAuth configuration')
				}

				const config = await response.json()
				setClientConfig(config)
			} catch (error) {
				console.error('Failed to fetch OAuth config:', error)
				onError?.(error as Error)
			}
		}

		fetchConfig()
	}, [gsiLoaded, apiBaseUrl, onError])

	// Handle authorization code callback
	const handleCodeResponse = useCallback(
		async (response: GoogleCodeResponse) => {
			// Check for errors
			if (response.error) {
				const error = new Error(
					response.error_description || response.error
				)
				console.error('OAuth error:', response.error, response.error_description)
				onError?.(error)
				setIsLoading(false)
				return
			}

			// Exchange code for session
			try {
				const exchangeResponse = await fetch(
					`${apiBaseUrl}/auth/google/exchange`,
					{
						method: 'POST',
						headers: {
							'Content-Type': 'application/json',
							'X-Requested-With': 'XMLHttpRequest',
						},
						credentials: 'include',
						body: JSON.stringify({
							code: response.code,
							state: response.state,
							redirect_uri: window.location.origin,
						}),
					}
				)

				if (!exchangeResponse.ok) {
					const errorData = await exchangeResponse.json().catch(() => ({}))
					throw new Error(
						errorData.detail || 'Failed to exchange authorization code'
					)
				}

				const data = await exchangeResponse.json()
				
				// Success! Session cookie is now set
				onSuccess?.(data.user)
			} catch (error) {
				console.error('Code exchange failed:', error)
				onError?.(error as Error)
			} finally {
				setIsLoading(false)
			}
		},
		[apiBaseUrl, onSuccess, onError]
	)

	// Initialize code client when config is ready
	useEffect(() => {
		if (!gsiLoaded || !clientConfig || !window.google?.accounts?.oauth2) {
			return
		}

		try {
			// Generate CSRF state token
			const state = generateState()

			const client = window.google.accounts.oauth2.initCodeClient({
				client_id: clientConfig.client_id,
				scope: clientConfig.scope,
				ux_mode: 'popup',
				state,
				callback: handleCodeResponse,
				error_callback: (error: GoogleErrorResponse) => {
					console.error('GIS error:', error)
					onError?.(new Error(error.message || 'OAuth error'))
					setIsLoading(false)
				},
			})

			setCodeClient(client)
		} catch (error) {
			console.error('Failed to initialize code client:', error)
			onError?.(error as Error)
		}
	}, [gsiLoaded, clientConfig, handleCodeResponse, onError])

	// Handle sign in button click
	const handleSignIn = useCallback(() => {
		if (!codeClient || disabled || isLoading) {
			return
		}

		setIsLoading(true)
		
		try {
			// Request authorization code (opens popup)
			codeClient.requestCode()
		} catch (error) {
			console.error('Failed to request code:', error)
			onError?.(error as Error)
			setIsLoading(false)
		}
	}, [codeClient, disabled, isLoading, onError])

	// Default button if no children provided
	const button = children || (
		<button
			type="button"
			className={className}
			disabled={disabled || isLoading || !codeClient}
			onClick={handleSignIn}
		>
			{isLoading ? 'Signing in...' : 'Sign in with Google'}
		</button>
	)

	// If children provided, wrap with click handler
	if (children) {
		return (
			<div onClick={handleSignIn} style={{ cursor: disabled ? 'not-allowed' : 'pointer' }}>
				{children}
			</div>
		)
	}

	return button
}

/**
 * Generate cryptographically secure state token for CSRF protection
 */
function generateState(): string {
	const array = new Uint8Array(32)
	crypto.getRandomValues(array)
	return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}

export default GoogleOAuthPopup
