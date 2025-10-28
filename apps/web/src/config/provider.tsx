import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { AppConfigSchema, type AppConfig } from './schema'
import { useTheme } from '../app/theme/ThemeProvider'

type ThemeMode = 'light' | 'dark' | 'system'

type Ctx = {
  config: AppConfig | null
  setConfig: (c: AppConfig) => void
  theme: ThemeMode
  resolvedTheme: 'light' | 'dark'
  setTheme: (t: ThemeMode) => void
}

const C = createContext<Ctx>({
  config: null,
  setConfig: () => {},
  theme: 'system',
  resolvedTheme: 'light',
  setTheme: () => {},
})

function applyTokens(theme: 'light' | 'dark', cfg: AppConfig) {
  const root = document.documentElement
  const t = theme === 'dark' ? cfg.theme.dark : cfg.theme.light
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
  const { mode, setMode } = useTheme()
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light')

  useEffect(() => {
    const url = (import.meta.env as any).VITE_APP_CONFIG_URL || '/app.config.json'
    async function load() {
      try {
        const r = await fetch(url, { cache: 'no-cache' })
        const j = await r.json()
        const valid = AppConfigSchema.parse(j)
        setConfig(normalizeConfig(valid))
      } catch (err) {
        console.error('Failed to load/parse app.config.json, applying fallback config:', err)
        setConfig(getFallbackConfig())
      }
    }
    load()
  }, [])

  useEffect(() => {
    if (!config) return

    const mql = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null
    const resolve = (): 'light' | 'dark' => {
      if (mode === 'system') return mql && mql.matches ? 'dark' : 'light'
      return mode
    }

    const apply = () => {
      const eff = resolve()
      setResolvedTheme(eff)
      applyTokens(eff, config)
    }

    apply()

    if (mql) {
      const listener = () => {
        if (mode === 'system') apply()
      }
      mql.addEventListener('change', listener)
      return () => mql.removeEventListener('change', listener)
    }
  }, [config, mode])

  const setTheme = (t: ThemeMode) => setMode(t)
  const value = useMemo(
    () => ({ config, setConfig, theme: mode, resolvedTheme, setTheme }),
    [config, mode, resolvedTheme]
  )
  return <C.Provider value={value}>{children}</C.Provider>
}

export const useAppConfig = () => useContext(C)

function normalizeConfig(cfg: AppConfig): AppConfig {
  if (!cfg.components?.authMenu) return cfg
  const { loginLabel, loginProvider, providers } = cfg.components.authMenu
  if (!loginLabel || !Array.isArray(providers) || providers.length === 0) return cfg
  const providerId = loginProvider || 'google'
  const normalizedProviders = providers.map((provider) =>
    provider.id === providerId ? { ...provider, label: loginLabel } : provider
  )
  return {
    ...cfg,
    components: {
      ...cfg.components,
      authMenu: {
        ...cfg.components.authMenu,
        providers: normalizedProviders,
      },
    },
  }
}

function getFallbackConfig() {
  return normalizeConfig({
    brand: { name: 'Webapp Factory', logoUrl: '/icons/logo-192.png' },
    theme: {
      light: {
        bg: '0 0% 100%',
        surface1: '210 30% 97%',
        surface2: '210 28% 94%',
        text: '222 50% 12%',
        muted: '220 12% 46%',
        border: '213 18% 88%',
        accent: '217 100% 62%',
        accentFg: '0 0% 100%',
        ring: '217 100% 62%',
      },
      dark: {
        bg: '222 34% 7%',
        surface1: '222 28% 11%',
        surface2: '222 24% 15%',
        text: '210 20% 96%',
        muted: '215 14% 70%',
        border: '220 14% 24%',
        accent: '217 100% 74%',
        accentFg: '222 40% 12%',
        ring: '217 100% 74%',
      },
      radius: 14,
      fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto',
    },
    layout: { sidebar: { enabled: true, width: 264, collapsedWidth: 72, defaultCollapsed: false, showPlanCard: true }, topbar: { search: true, commandPalette: true, showNotifications: true, showThemeToggle: true }, mobileTabs: { enabled: true } },
    navigation: [],
    features: { nprogress: true },
    components: {
      authMenu: {
        enabled: true,
        loginProvider: 'google',
        loginLabel: 'Continue with Google',
        showSettings: true,
        providers: [
          { id: 'google' },
          { id: 'github', label: 'Continue with GitHub' },
          { id: 'slack', label: 'Continue with Slack' },
          { id: 'email', label: 'Continue with Email' },
        ],
      },
    },
  } as unknown as AppConfig)
}
