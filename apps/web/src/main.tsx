import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { routes } from './app/routes'
import { AuthProvider } from './app/providers/AuthProvider'
import { QueryProvider } from './app/providers/QueryProvider'
import { ThemeProvider } from './app/theme/ThemeProvider'
import { AppConfigProvider } from '@config/src/provider'
import './app/styles/index.css'
import { initAnalytics, trackRouteChange } from './app/lib/analytics'
import { useTheme } from './app/theme/ThemeProvider'

initAnalytics()
const router = createBrowserRouter(routes)
router.subscribe((state) => trackRouteChange(state.location))

function AppConfigBridge({ children }: { children: React.ReactNode }) {
	const { mode, setMode } = useTheme()
	return (
		<AppConfigProvider themeAdapter={{ mode, setMode }}>
			{children}
		</AppConfigProvider>
	)
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryProvider>
      <AuthProvider>
        <ThemeProvider>
          <AppConfigBridge>
            <RouterProvider router={router} />
          </AppConfigBridge>
        </ThemeProvider>
      </AuthProvider>
    </QueryProvider>
  </React.StrictMode>
)
