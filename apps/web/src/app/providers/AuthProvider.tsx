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

  const refreshUser = useCallback(
    async (token?: string) => {
      try {
        const headers = token ? { Authorization: `Bearer ${token}` } : undefined
        const { data } = await api.get('/auth/me', headers ? { headers } : undefined)
        setUser(data ?? null)
        return data ?? null
      } catch (error) {
        setUser(null)
        throw error
      }
    },
    [],
  )

  // Fetch current user on mount
  useEffect(() => {
    refreshUser().catch(() => setUser(null)).finally(() => setLoading(false))
  }, [refreshUser])

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      const allowedOrigins = [window.location.origin]
      const apiBase = import.meta.env.VITE_API_BASE_URL
      if (apiBase) {
        try {
          allowedOrigins.push(new URL(apiBase).origin)
        } catch {
          // ignore parse errors
        }
      }
      if (!allowedOrigins.includes(event.origin)) return
      const data = event.data as { type?: string; status?: string; provider?: string; token?: string } | undefined
      if (!data || data.type !== 'oauth') return
      if (data.status === 'success') {
        refreshUser(data.token).catch(() => {})
      } else {
        console.warn('OAuth popup reported failure', data)
      }
    }
    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [refreshUser])

  // Legacy redirect-based login (deprecated)
  const login = useCallback((provider: string = 'google') => {
    const redirect = encodeURIComponent(window.location.origin)
    const loginUrl = `${import.meta.env.VITE_API_BASE_URL}/auth/${provider}/login?redirect=${redirect}`
    window.location.href = loginUrl
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
