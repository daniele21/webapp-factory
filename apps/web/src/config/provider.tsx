import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { AppConfigSchema, type AppConfig } from './schema'

type ThemeMode = 'light' | 'dark' | 'system'

type Ctx = {
  config: AppConfig | null
  setConfig: (c: AppConfig) => void
  theme: ThemeMode
  setTheme: (t: ThemeMode) => void
}

const C = createContext<Ctx>({ config: null, setConfig: () => {}, theme: 'system', setTheme: () => {} })

function applyTokens(theme: 'light' | 'dark', cfg: AppConfig) {
  const root = document.documentElement
  const t = theme === 'dark' ? cfg.theme.dark : cfg.theme.light
  // Don't set data-theme here - it's used by ThemeProvider for brand selection
  // Just toggle the .dark class for compatibility
  root.classList.toggle('dark', theme === 'dark')
  root.style.setProperty('--bg', t.bg)
  root.style.setProperty('--surface-1', t.surface1)
  root.style.setProperty('--surface-2', t.surface2)
  root.style.setProperty('--text', t.text)
  root.style.setProperty('--muted', t.muted)
  root.style.setProperty('--border', t.border)
  root.style.setProperty('--accent', t.accent)
  root.style.setProperty('--accent-fg', t.accentFg)
  root.style.setProperty('--ring', t.ring)
  if (cfg.theme.fontFamily) document.documentElement.style.setProperty('--font-family', cfg.theme.fontFamily)
  if (t.chart1) document.documentElement.style.setProperty('--chart-1', t.chart1)
  if (t.chart2) document.documentElement.style.setProperty('--chart-2', t.chart2)
  if (t.chart3) document.documentElement.style.setProperty('--chart-3', t.chart3)
  if (t.chartGrid) document.documentElement.style.setProperty('--chart-grid', t.chartGrid)
  if (t.chartAxis) document.documentElement.style.setProperty('--chart-axis', t.chartAxis)
  document.documentElement.style.setProperty('--radius', `${cfg.theme.radius}px`)

  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) meta.setAttribute('content', `hsl(${t.surface1})`)
}

export function AppConfigProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<AppConfig | null>(null)
  const [theme, setTheme] = useState<ThemeMode>((localStorage.getItem('theme') as ThemeMode) || 'system')

  useEffect(() => {
    const url = (import.meta.env as any).VITE_APP_CONFIG_URL || '/app.config.json'
    fetch(url, { cache: 'no-cache' })
      .then((r) => r.json())
      .then((j) => AppConfigSchema.parse(j))
      .then((valid) => setConfig(valid))
      .catch((err) => console.error('Invalid app.config.json:', err))
  }, [])

  useEffect(() => {
    if (!config) return
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
    const eff = theme === 'system' ? (prefersDark ? 'dark' : 'light') : theme
    applyTokens(eff, config)
    localStorage.setItem('theme', theme)
  }, [theme, config])

  const value = useMemo(() => ({ config, setConfig, theme, setTheme }), [config, theme])
  return <C.Provider value={value}>{children}</C.Provider>
}

export const useAppConfig = () => useContext(C)
