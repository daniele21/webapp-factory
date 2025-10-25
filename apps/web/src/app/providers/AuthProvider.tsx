import React, { createContext, useContext, useEffect, useState } from 'react'
import { api } from '../lib/api'

type User = { id: string; email: string; name?: string; picture?: string; roles: string[] }

type AuthCtx = {
  user: User | null
  loading: boolean
  login: () => void
  logout: () => Promise<void>
}

const Ctx = createContext<AuthCtx | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/auth/me').then(r => setUser(r.data ?? null)).finally(() => setLoading(false))
  }, [])

  const login = () => {
    const redirect = encodeURIComponent(window.location.origin)
    window.location.href = `${import.meta.env.VITE_API_BASE_URL}/auth/google/login?redirect=${redirect}`
  }

  const logout = async () => {
    await api.post('/auth/logout')
    setUser(null)
  }

  return <Ctx.Provider value={{ user, loading, login, logout }}>{children}</Ctx.Provider>
}

export const useAuth = () => {
  const v = useContext(Ctx)
  if (!v) throw new Error('useAuth must be used within AuthProvider')
  return v
}
