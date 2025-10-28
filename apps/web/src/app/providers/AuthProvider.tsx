import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { api } from '../lib/api'

type User = { id: string; email: string; name?: string; picture?: string; roles: string[]; provider?: string }

type AuthCtx = {
  user: User | null
  loading: boolean
  login: (provider?: string) => void
  loginWithPopup: (onSuccess?: (user: User) => void, onError?: (error: Error) => void) => void
  logout: () => Promise<void>
}

const Ctx = createContext<AuthCtx | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // Fetch current user on mount
  useEffect(() => {
    api.get('/auth/me').then(r => setUser(r.data ?? null)).catch(() => setUser(null)).finally(() => setLoading(false))
  }, [])

  // Legacy redirect-based login (deprecated)
  const login = useCallback((provider: string = 'google') => {
    const redirect = encodeURIComponent(window.location.origin)
    window.location.href = `${import.meta.env.VITE_API_BASE_URL}/auth/${provider}/login?redirect=${redirect}`
  }, [])

  // New popup-based login with Google Identity Services
  const loginWithPopup = useCallback((
    onSuccess?: (user: User) => void,
    onError?: (error: Error) => void
  ) => {
    // This will be handled by the GoogleOAuthPopup component
    // The component will call the backend to exchange code and set cookie
    // Then we need to refresh the user state
    
    // Create a callback for the GoogleOAuthPopup component
    const handleSuccess = async (userData: User) => {
      setUser(userData)
      onSuccess?.(userData)
    }

    const handleError = (error: Error) => {
      console.error('Login failed:', error)
      onError?.(error)
    }

    return { onSuccess: handleSuccess, onError: handleError }
  }, [])

  // Logout with token revocation
  const logout = useCallback(async () => {
    try {
      // Call backend to revoke Google token and clear cookie
      await api.post('/auth/google/revoke', {}, {
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
        },
      })
    } catch (error) {
      console.error('Logout error:', error)
      // Continue with logout even if revocation fails
    }
    
    setUser(null)
  }, [])

  return <Ctx.Provider value={{ user, loading, login, loginWithPopup, logout }}>{children}</Ctx.Provider>
}

export const useAuth = () => {
  const v = useContext(Ctx)
  if (!v) throw new Error('useAuth must be used within AuthProvider')
  return v
}
