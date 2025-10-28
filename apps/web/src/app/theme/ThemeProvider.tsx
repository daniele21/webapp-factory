import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { Brand, isBrand } from './brands'
import { VisualStyle, isVisualStyle } from './visualStyles'

type ThemeMode = 'light' | 'dark' | 'system'

type Ctx = {
  mode: ThemeMode
  brand: Brand
  visual: VisualStyle
  setMode: (m: ThemeMode) => void
  setBrand: (b: Brand) => void
  setVisual: (style: VisualStyle) => void
  lockBrand: boolean
  lockVisual: boolean
}

const ThemeCtx = createContext<Ctx | null>(null)
const kMode = 'wf:mode'; const kBrand = 'wf:brand'; const kVisual = 'wf:visual'

const readStorage = (key: string): string | null => (typeof window !== 'undefined' ? localStorage.getItem(key) : null)

const safeBrand = (): Brand => (isBrand(readStorage(kBrand)) ? (readStorage(kBrand) as Brand) : 'default')
const safeMode = (): ThemeMode => {
  const stored = readStorage(kMode) as ThemeMode | null
  return stored === 'dark' || stored === 'light' || stored === 'system' ? stored : 'system'
}
const safeVisual = (): VisualStyle => (isVisualStyle(readStorage(kVisual)) ? (readStorage(kVisual) as VisualStyle) : 'aurora')

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>(safeMode)
  const [brand, setBrandState] = useState<Brand>(safeBrand)
  const [visual, setVisualState] = useState<VisualStyle>(safeVisual)
  const [lockBrand, setLockBrand] = useState<boolean>(() => !!(typeof window !== 'undefined' && localStorage.getItem('wf:brand:locked')))
  const [lockVisual, setLockVisual] = useState<boolean>(() => !!(typeof window !== 'undefined' && localStorage.getItem('wf:visual:locked')))

  const setBrand = (b: Brand) => {
    if (lockBrand) return
    setBrandState(b)
    try { localStorage.setItem(kBrand, b) } catch {}
  }

  const setVisual = (v: VisualStyle) => {
    if (lockVisual) return
    setVisualState(v)
    try { localStorage.setItem(kVisual, v) } catch {}
  }

  useEffect(() => {
    const root = document.documentElement
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
    const applied = mode === 'system' ? (prefersDark ? 'dark' : 'light') : mode

    // keep compatibility with existing code that toggles .dark
    root.classList.toggle('dark', applied === 'dark')

    // Apply brand and visual (palettes)
    root.setAttribute('data-theme', brand)
    root.setAttribute('data-visual', visual)

  // Persist user's explicit choice (store the selected mode key)
  try { localStorage.setItem(kMode, mode) } catch {}
  // brand/visual are persisted in wrapper functions which respect locks

    // Update PWA theme-color meta tag to the resolved surface color
    const meta = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement | null
    if (meta) {
      const computed = getComputedStyle(root).getPropertyValue('--surface-1') || getComputedStyle(root).getPropertyValue('--card')
      const color = computed.trim() || (applied === 'dark' ? '#0b0f19' : '#ffffff')
      // color may be '222 23% 10%' or 'hsl(...)' depending; if it's HSL raw tokens, wrap in hsl()
      const final = color.startsWith('hsl(') || color.startsWith('#') ? color : `hsl(${color})`
      meta.setAttribute('content', final)
    }
  }, [mode, brand, visual])

  // Observe external changes to data-theme/data-visual/.dark so the provider
  // stays in sync if something else (like AppConfigProvider) sets defaults.
  useEffect(() => {
    if (typeof window === 'undefined') return
    const root = document.documentElement
    const mo = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.type !== 'attributes') continue
        const attr = (m as MutationRecord).attributeName
        if (attr === 'data-theme') {
          const t = (root.getAttribute('data-theme') || 'default') as Brand
          if (isBrand(t) && t !== brand) setBrand(t)
        }
        if (attr === 'data-visual') {
          const v = (root.getAttribute('data-visual') || 'aurora') as VisualStyle
          if (isVisualStyle(v) && v !== visual) setVisual(v)
        }
        if (attr === 'class') {
          // sync dark class to mode when external code toggles it
          const hasDark = root.classList.contains('dark')
          if (hasDark && mode !== 'dark') setMode('dark')
          if (!hasDark && mode === 'dark') setMode('light')
        }
      }
    })

    mo.observe(root, { attributes: true, attributeFilter: ['data-theme', 'data-visual', 'class'] })
    return () => mo.disconnect()
  }, [brand, visual, mode])

  const value = useMemo(() => ({ mode, brand, visual, setMode, setBrand, setVisual, lockBrand, lockVisual }), [mode, brand, visual, lockBrand, lockVisual])
  return <ThemeCtx.Provider value={value}>{children}</ThemeCtx.Provider>
}

export const useTheme = () => {
  const ctx = useContext(ThemeCtx)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
