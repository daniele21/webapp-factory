import React, {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
} from 'react'
import { AppConfigSchema, type AppConfig } from './schema'

type ThemeMode = 'light' | 'dark' | 'system'

type ThemeAdapter = {
	mode: ThemeMode
	setMode: (mode: ThemeMode) => void
}

type Ctx = {
	config: AppConfig | null
	setConfig: (config: AppConfig) => void
	theme: ThemeMode
	resolvedTheme: 'light' | 'dark'
	setTheme: (mode: ThemeMode) => void
}

const ThemeStorageKey = 'wf:mode'

const defaultCtx: Ctx = {
	config: null,
	setConfig: () => {},
	theme: 'system',
	resolvedTheme: 'light',
	setTheme: () => {},
}

const ConfigContext = createContext<Ctx>(defaultCtx)

const readStoredTheme = (): ThemeMode => {
	if (typeof window === 'undefined') return 'system'
	const raw = window.localStorage.getItem(ThemeStorageKey)
	return raw === 'light' || raw === 'dark' || raw === 'system' ? raw : 'system'
}

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
	if (cfg.theme.fontFamily) {
		document.documentElement.style.setProperty('--font-family', cfg.theme.fontFamily)
	}
	if (t.chart1) document.documentElement.style.setProperty('--chart-1', t.chart1)
	if (t.chart2) document.documentElement.style.setProperty('--chart-2', t.chart2)
	if (t.chart3) document.documentElement.style.setProperty('--chart-3', t.chart3)
	if (t.chartGrid) document.documentElement.style.setProperty('--chart-grid', t.chartGrid)
	if (t.chartAxis) document.documentElement.style.setProperty('--chart-axis', t.chartAxis)
	document.documentElement.style.setProperty('--radius', `${cfg.theme.radius}px`)

	const meta = document.querySelector('meta[name="theme-color"]')
	if (meta) {
		const value = t.surface1.trim()
		const content = value.startsWith('hsl(') || value.startsWith('#') ? value : `hsl(${value})`
		meta.setAttribute('content', content)
	}
}

const applyBrandVisualDefaults = (cfg: AppConfig) => {
	if (typeof window === 'undefined') return
	try {
		const root = document.documentElement
		const cfgTheme: any = (cfg as any).theme ?? {}

		const storedBrand = window.localStorage.getItem('wf:brand')
		const storedVisual = window.localStorage.getItem('wf:visual')

		const defaultBrand = cfgTheme.defaultBrand as string | undefined
		const defaultVisual = cfgTheme.defaultVisual as string | undefined
		const lockBrand = Boolean(cfgTheme.lockBrand)
		const lockVisual = Boolean(cfgTheme.lockVisual)

		if ((lockBrand || !storedBrand) && defaultBrand) {
			root.setAttribute('data-theme', defaultBrand)
			window.localStorage.setItem('wf:brand', defaultBrand)
		}
		if ((lockVisual || !storedVisual) && defaultVisual) {
			root.setAttribute('data-visual', defaultVisual)
			window.localStorage.setItem('wf:visual', defaultVisual)
		}
		if (lockBrand) {
			window.localStorage.setItem('wf:brand:locked', '1')
		}
		if (lockVisual) {
			window.localStorage.setItem('wf:visual:locked', '1')
		}
	} catch {
		// Non-browser environments or restricted storage
	}
}

type AppConfigProviderProps = {
	children: React.ReactNode
	themeAdapter?: ThemeAdapter
}

export function AppConfigProvider({ children, themeAdapter }: AppConfigProviderProps) {
	const [config, setConfig] = useState<AppConfig | null>(null)
	const [localTheme, setLocalTheme] = useState<ThemeMode>(() => readStoredTheme())
	const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light')
	const [loaded, setLoaded] = useState(false)

	const theme = themeAdapter?.mode ?? localTheme
	const setTheme = useCallback(
		(mode: ThemeMode) => {
			if (themeAdapter) {
				themeAdapter.setMode(mode)
			} else {
				setLocalTheme(mode)
			}
		},
		[themeAdapter],
	)

	useEffect(() => {
		if (themeAdapter) return
		if (typeof window === 'undefined') return
		try {
			window.localStorage.setItem(ThemeStorageKey, localTheme)
		} catch {
			// ignore storage errors
		}
	}, [localTheme, themeAdapter])

	useEffect(() => {
		const url = (import.meta.env as any).VITE_APP_CONFIG_URL || '/app.config.json'

		async function load() {
			try {
				const response = await fetch(url, { cache: 'no-cache' })
				const json = await response.json()
				const parsed = AppConfigSchema.parse(json)
				const normalized = normalizeConfig(parsed)
				setConfig(normalized)
				applyBrandVisualDefaults(normalized)
				setLoaded(true)
			} catch (error) {
				console.error('Failed to load/parse app.config.json, applying fallback config:', error)
				const fallback = getFallbackConfig()
				setConfig(fallback)
				applyBrandVisualDefaults(fallback)
				setLoaded(true)
			}
		}

		load()
	}, [])

	useEffect(() => {
		if (!config) return
		const mql =
			typeof window !== 'undefined' && window.matchMedia
				? window.matchMedia('(prefers-color-scheme: dark)')
				: null

		const resolveTheme = () => {
			const effective = theme === 'system' ? (mql && mql.matches ? 'dark' : 'light') : theme
			setResolvedTheme(effective)
			applyTokens(effective, config)
		}

		resolveTheme()

		if (!mql) return
		const listener = () => {
			if (theme === 'system') resolveTheme()
		}
		mql.addEventListener('change', listener)
		return () => mql.removeEventListener('change', listener)
	}, [config, theme])

	const value = useMemo(
		() => ({
			config,
			setConfig,
			theme,
			resolvedTheme,
			setTheme,
		}),
		[config, theme, resolvedTheme, setTheme],
	)

	if (!loaded) return null

	return <ConfigContext.Provider value={value}>{children}</ConfigContext.Provider>
}

export const useAppConfig = () => useContext(ConfigContext)

function normalizeConfig(cfg: AppConfig): AppConfig {
	if (!cfg.components?.authMenu) return cfg
	const { loginLabel, loginProvider, providers } = cfg.components.authMenu
	if (!loginLabel || !Array.isArray(providers) || providers.length === 0) return cfg
	const providerId = loginProvider || 'google'
	const normalizedProviders = providers.map((provider) =>
		provider.id === providerId ? { ...provider, label: loginLabel } : provider,
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

function getFallbackConfig(): AppConfig {
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
		layout: {
			sidebar: { enabled: true, width: 264, collapsedWidth: 72, defaultCollapsed: false, showPlanCard: true },
			topbar: { search: true, commandPalette: true, showNotifications: true, showThemeToggle: true },
			mobileTabs: { enabled: true },
		},
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
