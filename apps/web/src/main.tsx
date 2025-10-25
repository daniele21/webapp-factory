import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { routes } from './app/routes'
import { AuthProvider } from './app/providers/AuthProvider'
import { QueryProvider } from './app/providers/QueryProvider'
import { ThemeProvider } from './app/theme/ThemeProvider'
import './app/styles/index.css'
import { initAnalytics, trackRouteChange } from './app/lib/analytics'

initAnalytics()
const router = createBrowserRouter(routes)
router.subscribe((state) => trackRouteChange(state.location))

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryProvider>
      <AuthProvider>
        <ThemeProvider>
          <RouterProvider router={router} />
        </ThemeProvider>
      </AuthProvider>
    </QueryProvider>
  </React.StrictMode>
)
