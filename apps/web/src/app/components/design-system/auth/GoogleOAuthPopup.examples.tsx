/**
 * GoogleOAuthPopup Component Examples
 * 
 * This file demonstrates various usage patterns for the GoogleOAuthPopup component
 * with Google Identity Services (GIS) Authorization Code flow in popup mode.
 */

import React, { useState } from 'react'
import { GoogleOAuthPopup, type GoogleUser } from './GoogleOAuthPopup'
import { Button } from '../../ui/button'
import { Mail, Loader2 } from 'lucide-react'

/**
 * Example 1: Basic Usage
 * 
 * The simplest way to add Google OAuth to your app.
 */
export function BasicExample() {
	const handleSuccess = (user: GoogleUser) => {
		console.log('User logged in:', user)
		// Redirect or update app state
	}

	const handleError = (error: Error) => {
		console.error('Login failed:', error)
		alert('Login failed: ' + error.message)
	}

	return (
		<GoogleOAuthPopup onSuccess={handleSuccess} onError={handleError}>
			<button>Sign in with Google</button>
		</GoogleOAuthPopup>
	)
}

/**
 * Example 2: Styled with Tailwind
 * 
 * Custom styling with the button as a child.
 */
export function StyledExample() {
	const [user, setUser] = useState<GoogleUser | null>(null)

	if (user) {
		return (
			<div className="flex items-center gap-3">
				<img 
					src={user.picture} 
					alt={user.name} 
					className="w-10 h-10 rounded-full"
				/>
				<div>
					<p className="font-medium">{user.name}</p>
					<p className="text-sm text-gray-500">{user.email}</p>
				</div>
			</div>
		)
	}

	return (
		<GoogleOAuthPopup onSuccess={setUser}>
			<button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
				<Mail className="w-5 h-5" />
				<span className="font-medium">Google Login</span>
			</button>
		</GoogleOAuthPopup>
	)
}

/**
 * Example 3: With Loading State
 * 
 * Shows loading indicator during authentication.
 */
export function LoadingExample() {
	const [isLoading, setIsLoading] = useState(false)

	const handleSuccess = (user: GoogleUser) => {
		setIsLoading(false)
		console.log('Logged in:', user)
	}

	const handleError = (error: Error) => {
		setIsLoading(false)
		console.error('Error:', error)
	}

	return (
		<GoogleOAuthPopup 
			onSuccess={handleSuccess} 
			onError={handleError}
		>
			<Button 
				disabled={isLoading}
				className="w-full"
			>
				{isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
				{isLoading ? 'Signing in...' : 'Sign in with Google'}
			</Button>
		</GoogleOAuthPopup>
	)
}

/**
 * Example 4: Workspace Domain Restriction
 * 
 * Only allow users from a specific Google Workspace domain.
 */
export function WorkspaceExample() {
	return (
		<div className="space-y-4">
			<h2 className="text-lg font-semibold">Company Login</h2>
			<p className="text-sm text-gray-600">
				Sign in with your @company.com email
			</p>
			
			<GoogleOAuthPopup 
				hostedDomain="company.com"
				onSuccess={(user) => {
					console.log('Employee logged in:', user)
				}}
				onError={(error) => {
					alert('Please use your company email address')
				}}
			>
				<Button variant="outline" className="w-full">
					Sign in with Company Account
				</Button>
			</GoogleOAuthPopup>
		</div>
	)
}

/**
 * Example 5: Custom API Base URL
 * 
 * Useful when backend is on a different domain or path.
 */
export function CustomAPIExample() {
	return (
		<GoogleOAuthPopup 
			apiBaseUrl="https://api.example.com/v1"
			onSuccess={(user) => console.log(user)}
		>
			<button>Sign in</button>
		</GoogleOAuthPopup>
	)
}

/**
 * Example 6: Full Auth Flow with State Management
 * 
 * Complete example with user state, logout, and error handling.
 */
export function FullAuthExample() {
	const [user, setUser] = useState<GoogleUser | null>(null)
	const [error, setError] = useState<string | null>(null)
	const [isLoading, setIsLoading] = useState(false)

	const handleLogout = async () => {
		try {
			setIsLoading(true)
			
			// Call backend logout endpoint
			const response = await fetch('/api/auth/google/revoke', {
				method: 'POST',
				headers: {
					'X-Requested-With': 'XMLHttpRequest',
				},
				credentials: 'include',
			})

			if (response.ok) {
				setUser(null)
				setError(null)
			} else {
				throw new Error('Logout failed')
			}
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Logout failed')
		} finally {
			setIsLoading(false)
		}
	}

	if (user) {
		return (
			<div className="space-y-4">
				<div className="flex items-center gap-3 p-4 bg-white rounded-lg border">
					<img 
						src={user.picture} 
						alt={user.name} 
						className="w-12 h-12 rounded-full"
					/>
					<div className="flex-1">
						<p className="font-medium">{user.name}</p>
						<p className="text-sm text-gray-500">{user.email}</p>
					</div>
					<Button 
						variant="outline" 
						onClick={handleLogout}
						disabled={isLoading}
					>
						{isLoading ? 'Logging out...' : 'Logout'}
					</Button>
				</div>
			</div>
		)
	}

	return (
		<div className="space-y-4">
			{error && (
				<div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
					{error}
				</div>
			)}
			
			<GoogleOAuthPopup 
				onSuccess={(user) => {
					setUser(user)
					setError(null)
				}}
				onError={(err) => {
					setError(err.message)
				}}
			>
				<Button className="w-full" variant="outline">
					<Mail className="w-4 h-4 mr-2" />
					Sign in with Google
				</Button>
			</GoogleOAuthPopup>
		</div>
	)
}

/**
 * Example 7: Integration with AuthProvider
 * 
 * Using with the global auth context.
 */
export function AuthProviderExample() {
	// Assuming you have an AuthProvider context
	const { setUser } = useAuth() // Your auth context hook

	return (
		<GoogleOAuthPopup 
			onSuccess={(user) => {
				// Update global auth state
				setUser(user)
				
				// Optionally redirect
				window.location.href = '/dashboard'
			}}
			onError={(error) => {
				console.error('Login failed:', error)
			}}
		>
			<Button>Sign in with Google</Button>
		</GoogleOAuthPopup>
	)
}

// Mock useAuth for example
function useAuth() {
	return {
		setUser: (user: GoogleUser | null) => {
			console.log('Set user:', user)
		}
	}
}

/**
 * Example 8: Disabled State
 * 
 * Prevent login during certain conditions.
 */
export function DisabledExample() {
	const [agreed, setAgreed] = useState(false)

	return (
		<div className="space-y-4">
			<label className="flex items-center gap-2">
				<input 
					type="checkbox" 
					checked={agreed}
					onChange={(e) => setAgreed(e.target.checked)}
				/>
				<span className="text-sm">
					I agree to the Terms of Service
				</span>
			</label>

			<GoogleOAuthPopup 
				disabled={!agreed}
				onSuccess={(user) => console.log(user)}
			>
				<Button disabled={!agreed} className="w-full">
					Sign in with Google
				</Button>
			</GoogleOAuthPopup>
		</div>
	)
}

export default {
	BasicExample,
	StyledExample,
	LoadingExample,
	WorkspaceExample,
	CustomAPIExample,
	FullAuthExample,
	AuthProviderExample,
	DisabledExample,
}
