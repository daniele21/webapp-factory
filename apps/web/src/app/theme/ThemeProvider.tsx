import { createContext, useContext, useEffect, useMemo, useState } from 'react'

type ThemeMode = 'light' | 'dark'
export type Brand = 'default' | 'sky' | 'darkbrand'

type Ctx = {
  mode: ThemeMode
  brand: Brand
  setMode: (m: ThemeMode) => void
  setBrand: (b: Brand) => void
}

const ThemeCtx = createContext<Ctx | null>(null)
const kMode = 'wf:mode'; const kBrand = 'wf:brand'

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>(() => (localStorage.getItem(kMode) as ThemeMode) || 'light')
  const [brand, setBrand] = useState<Brand>(() => (localStorage.getItem(kBrand) as Brand) || 'default')

  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('dark', mode === 'dark')
    root.setAttribute('data-theme', brand)
    localStorage.setItem(kMode, mode)
    localStorage.setItem(kBrand, brand)
    // PWA theme-color sync
    const meta = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement | null
    if (meta) meta.content = mode === 'dark' ? '#0b0f19' : '#ffffff'
  }, [mode, brand])

  const value = useMemo(() => ({ mode, brand, setMode, setBrand }), [mode, brand])
  return <ThemeCtx.Provider value={value}>{children}</ThemeCtx.Provider>
}

export const useTheme = () => {
  const ctx = useContext(ThemeCtx)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}