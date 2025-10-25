import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { Brand, isBrand } from './brands'
import { VisualStyle, isVisualStyle } from './visualStyles'

type ThemeMode = 'light' | 'dark'

type Ctx = {
  mode: ThemeMode
  brand: Brand
  visual: VisualStyle
  setMode: (m: ThemeMode) => void
  setBrand: (b: Brand) => void
  setVisual: (style: VisualStyle) => void
}

const ThemeCtx = createContext<Ctx | null>(null)
const kMode = 'wf:mode'; const kBrand = 'wf:brand'; const kVisual = 'wf:visual'

const readStorage = (key: string): string | null => (typeof window !== 'undefined' ? localStorage.getItem(key) : null)

const safeBrand = (): Brand => (isBrand(readStorage(kBrand)) ? (readStorage(kBrand) as Brand) : 'default')
const safeMode = (): ThemeMode => {
  const stored = readStorage(kMode) as ThemeMode | null
  return stored === 'dark' || stored === 'light' ? stored : 'light'
}
const safeVisual = (): VisualStyle => (isVisualStyle(readStorage(kVisual)) ? (readStorage(kVisual) as VisualStyle) : 'aurora')

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>(safeMode)
  const [brand, setBrand] = useState<Brand>(safeBrand)
  const [visual, setVisual] = useState<VisualStyle>(safeVisual)

  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('dark', mode === 'dark')
    root.setAttribute('data-theme', brand)
    root.setAttribute('data-visual', visual)
    localStorage.setItem(kMode, mode)
    localStorage.setItem(kBrand, brand)
    localStorage.setItem(kVisual, visual)
    // PWA theme-color sync
    const meta = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement | null
    if (meta) meta.content = mode === 'dark' ? '#0b0f19' : '#ffffff'
  }, [mode, brand, visual])

  const value = useMemo(() => ({ mode, brand, visual, setMode, setBrand, setVisual }), [mode, brand, visual])
  return <ThemeCtx.Provider value={value}>{children}</ThemeCtx.Provider>
}

export const useTheme = () => {
  const ctx = useContext(ThemeCtx)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
