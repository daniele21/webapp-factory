# Webapp Factory – Monorepo Scaffold & Default Files

A complete, **copy‑pasteable** scaffold for the React + FastAPI + Firestore PWA template. This includes a suggested repo tree **and** default code for the most important files so you can boot a working MVP quickly and reuse it across domains.

> Monorepo tooling: **pnpm workspaces** + **Turborepo**. Frontend: **React 18 + Vite + TS**. Backend: **FastAPI**. DB: **Firestore**. Cache: **Redis**. Deploy: **Cloud Run** (API) + **Firebase Hosting/CDN** (web). Auth: **Google**. PWA: **vite-plugin-pwa** + Workbox.

---

## 0) Repository Tree

```
.
├─ apps/
│  ├─ web/                     # React PWA (Vite + TS)
│  │  ├─ public/
│  │  │  └─ robots.txt
│  │  ├─ src/
│  │  │  ├─ app/
│  │  │  │  ├─ App.tsx
│  │  │  │  ├─ routes.tsx
│  │  │  │  ├─ layouts/
│  │  │  │  │  ├─ DesktopLayout.tsx
│  │  │  │  │  └─ MobileLayout.tsx
│  │  │  │  ├─ components/
│  │  │  │  │  ├─ NavSidebar.tsx
│  │  │  │  │  ├─ TopBar.tsx
│  │  │  │  │  ├─ BottomNav.tsx
│  │  │  │  │  └─ Footer.tsx
│  │  │  │  ├─ pages/
│  │  │  │  │  ├─ Home.tsx
│  │  │  │  │  ├─ Dashboard.tsx
│  │  │  │  │  ├─ legal/CookiePolicy.tsx
│  │  │  │  │  └─ legal/Terms.tsx
│  │  │  │  ├─ providers/
│  │  │  │  │  ├─ AuthProvider.tsx
│  │  │  │  │  └─ QueryProvider.tsx
│  │  │  │  ├─ lib/
│  │  │  │  │  ├─ api.ts
│  │  │  │  │  ├─ analytics.ts
│  │  │  │  │  ├─ featureFlags.ts
│  │  │  │  │  └─ responsive.ts
│  │  │  │  └─ styles/index.css
│  │  │  ├─ main.tsx
│  │  │  └─ vite-env.d.ts
│  │  ├─ index.html
│  │  ├─ manifest.webmanifest
│  │  ├─ sw.ts                  # injected by vite-plugin-pwa
│  │  ├─ tsconfig.json
│  │  ├─ vite.config.ts
│  │  ├─ tailwind.config.ts
│  │  ├─ postcss.config.cjs
│  │  └─ .env.example
│  └─ api/                      # FastAPI service
│     ├─ apps/api/
│     │  ├─ main.py
│     │  ├─ settings.py
│     │  ├─ deps.py
│     │  ├─ middleware/
│     │  │  ├─ logging.py
│     │  │  └─ request_id.py
│     │  ├─ routes/
│     │  │  ├─ health.py
│     │  │  ├─ auth.py
│     │  │  ├─ users.py
│     │  │  └─ payments.py
│     │  ├─ services/
│     │  │  ├─ auth_service.py
│     │  │  ├─ user_service.py
│     │  │  └─ entitlement_service.py
│     │  ├─ providers/
│     │  │  ├─ firestore.py
│     │  │  ├─ redis.py
│     │  │  └─ stripe.py
│     │  ├─ models/
│     │  │  ├─ user.py
│     │  │  └─ common.py
│     │  └─ security/
│     │     ├─ jwt.py
│     │     └─ guards.py
│     ├─ pyproject.toml
│     ├─ requirements-lock.txt
│     ├─ uvicorn.ini
│     ├─ Dockerfile
│     └─ .env.example
├─ packages/
│  ├─ api-client/               # generated from OpenAPI (placeholder)
│  ├─ feature-flags/
│  │  ├─ index.ts
│  │  └─ types.ts
│  ├─ config/
│  │  ├─ nav.ts
│  │  └─ index.ts
│  └─ ui/                        # shared UI components (optional)
├─ infra/
│  ├─ firebase/
│  │  ├─ firebase.json
│  │  ├─ .firebaserc
│  │  ├─ firestore.rules
│  │  ├─ firestore.indexes.json
│  │  └─ hosting.config.json
│  ├─ github/
│  │  ├─ workflows/ci.yml
│  │  └─ workflows/deploy.yml
│  ├─ docker/
│  │  └─ compose.dev.yml
│  └─ scripts/
│     ├─ openapi_export.sh
│     └─ seed_firestore.py
├─ .devcontainer/
│  └─ devcontainer.json
├─ package.json
├─ pnpm-workspace.yaml
├─ turbo.json
└─ README.md
```

> This tree balances clarity and reuse: a clean separation of **apps** and shared **packages**, plus **infra** for deployment/runtime.

---

## 1) Root Monorepo Files

### `package.json`

```json
{
  "name": "webapp-factory",
  "private": true,
  "packageManager": "pnpm@9.0.0",
  "scripts": {
    "dev": "turbo run dev --parallel",
    "build": "turbo run build",
    "lint": "turbo run lint",
    "test": "turbo run test",
    "e2e": "turbo run e2e",
    "openapi:export": "bash infra/scripts/openapi_export.sh"
  },
  "devDependencies": {
    "turbo": "^2.1.0"
  },
  "pnpm": {
    "onlyBuiltDependencies": ["esbuild"]
  }
}
```

### `pnpm-workspace.yaml`

```yaml
packages:
  - apps/*
  - packages/*
```

### `turbo.json`

```json
{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "dev": { "cache": false },
    "build": { "dependsOn": ["^build"], "outputs": ["dist/**"] },
    "lint": {},
    "test": {},
    "e2e": {}
  }
}
```

### `README.md`

```md
# Webapp Factory

Monorepo starter to ship full‑stack PWAs fast. Frontend (React + Vite + TS), Backend (FastAPI), Firestore, Redis, Cloud Run, Firebase Hosting. Google Auth, feature guards, payments‑ready, and typed OpenAPI client.

## Quickstart
1. `pnpm i`
2. Copy `.env.example` files to `.env` and fill values
3. Start dev: `docker compose -f infra/docker/compose.dev.yml up -d` (Redis)
4. `pnpm dev` (web + api + emulators)
5. Open http://127.0.0.1:5173
```

---

## 2) Frontend (apps/web)

### `apps/web/package.json`

```json
{
  "name": "web",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "lint": "eslint src --ext .ts,.tsx",
    "test": "vitest",
    "e2e": "playwright test"
  },
  "dependencies": {
    "@tanstack/react-query": "^5.56.0",
    "axios": "^1.7.7",
    "lucide-react": "^0.460.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.26.2"
  },
  "devDependencies": {
    "@types/node": "^22.7.5",
    "@types/react": "^18.3.4",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react-swc": "^3.7.1",
    "autoprefixer": "^10.4.20",
    "postcss": "^8.4.47",
    "tailwindcss": "^3.4.13",
    "typescript": "^5.6.3",
    "vite": "^5.4.9",
    "vite-plugin-pwa": "^0.20.5",
    "vitest": "^2.1.3"
  }
}
```

### `apps/web/tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "strict": true,
    "jsx": "react-jsx",
    "moduleResolution": "Bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "types": ["vite/client"]
  },
  "include": ["src"]
}
```

### `apps/web/vite.config.ts`

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      srcDir: '.',
      filename: 'sw.ts',
      strategies: 'injectManifest',
      manifest: {
        name: 'Webapp Factory',
        short_name: 'Factory',
        start_url: '/',
        display: 'standalone',
        background_color: '#0b1021',
        theme_color: '#0ea5e9',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' }
        ]
      },
      injectRegister: 'auto',
      devOptions: { enabled: true }
    })
  ],
  server: { port: 5173 },
  build: { sourcemap: true }
})
```

### `apps/web/manifest.webmanifest`

```json
{
  "name": "Webapp Factory",
  "short_name": "Factory",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0b1021",
  "theme_color": "#0ea5e9",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

### `apps/web/sw.ts` (Workbox InjectManifest)

```ts
/// <reference lib="WebWorker" />
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching'
import { registerRoute } from 'workbox-routing'
import { StaleWhileRevalidate, CacheFirst } from 'workbox-strategies'
import { ExpirationPlugin } from 'workbox-expiration'

// self.__WB_MANIFEST is injected at build time
declare let self: ServiceWorkerGlobalScope & { __WB_MANIFEST: any }
precacheAndRoute(self.__WB_MANIFEST || [])
cleanupOutdatedCaches()

// Cache API JSON with SWR
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/'),
  new StaleWhileRevalidate({ cacheName: 'api-swr' })
)

// Cache images
registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: 'images',
    plugins: [new ExpirationPlugin({ maxEntries: 120, maxAgeSeconds: 60 * 60 * 24 * 7 })]
  })
)
```

### `apps/web/index.html`

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="manifest" href="/manifest.webmanifest" />
    <title>Webapp Factory</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

### `apps/web/src/main.tsx`

```tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { routes } from './app/routes'
import { AuthProvider } from './app/providers/AuthProvider'
import { QueryProvider } from './app/providers/QueryProvider'
import './app/styles/index.css'
import { initAnalytics, trackRouteChange } from './app/lib/analytics'

initAnalytics()
const router = createBrowserRouter(routes)
router.subscribe((state) => trackRouteChange(state.location))

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryProvider>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </QueryProvider>
  </React.StrictMode>
)
```

### `apps/web/src/app/routes.tsx`

```tsx
import { createRoutesFromElements, Route } from 'react-router-dom'
import App from './App'
import Home from './pages/Home'
import Dashboard from './pages/Dashboard'
import CookiePolicy from './pages/legal/CookiePolicy'
import Terms from './pages/legal/Terms'

export const routes = createRoutesFromElements(
  <Route element={<App />}>
    <Route index element={<Home />} />
    <Route path="/dashboard" element={<Dashboard />} />
    <Route path="/legal/cookies" element={<CookiePolicy />} />
    <Route path="/legal/terms" element={<Terms />} />
  </Route>
)
```

### `apps/web/src/app/App.tsx`

```tsx
import { Outlet } from 'react-router-dom'
import { useIsDesktop } from './lib/responsive'
import DesktopLayout from './layouts/DesktopLayout'
import MobileLayout from './layouts/MobileLayout'

export default function App() {
  const isDesktop = useIsDesktop()
  const Shell = isDesktop ? DesktopLayout : MobileLayout
  return (
    <Shell>
      <Outlet />
    </Shell>
  )
}
```

### `apps/web/src/app/layouts/DesktopLayout.tsx`

```tsx
import NavSidebar from '../components/NavSidebar'
import Footer from '../components/Footer'

export default function DesktopLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen grid grid-cols-[260px_1fr] grid-rows-[auto_1fr_auto]">
      <aside className="row-span-3 border-r"><NavSidebar /></aside>
      <header className="p-4 border-b">Webapp Factory</header>
      <main className="p-6">{children}</main>
      <footer className="col-start-2"><Footer /></footer>
    </div>
  )
}
```

### `apps/web/src/app/layouts/MobileLayout.tsx`

```tsx
import TopBar from '../components/TopBar'
import BottomNav from '../components/BottomNav'

export default function MobileLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen grid grid-rows-[auto_1fr_auto]">
      <TopBar />
      <main className="p-4">{children}</main>
      <BottomNav />
    </div>
  )
}
```

### `apps/web/src/app/components/NavSidebar.tsx`

```tsx
import { Link, useLocation } from 'react-router-dom'
import { features } from '../../lib/featureFlags'

const nav = [
  { to: '/', label: 'Home' },
  { to: '/dashboard', label: 'Dashboard', feature: 'dashboard.view' as const }
]

export default function NavSidebar() {
  const { pathname } = useLocation()
  return (
    <nav className="p-4 space-y-2">
      {nav.map((item) => {
        if (item.feature && !features[item.feature]?.enabled) return null
        const active = pathname === item.to
        return (
          <Link key={item.to} className={active ? 'font-semibold' : ''} to={item.to}>
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
```

### `apps/web/src/app/providers/AuthProvider.tsx`

```tsx
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
```

### `apps/web/src/app/providers/QueryProvider.tsx`

```tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'

const client = new QueryClient()
export const QueryProvider = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={client}>{children}</QueryClientProvider>
)
```

### `apps/web/src/app/lib/api.ts`

```ts
import axios from 'axios'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true
})

api.interceptors.response.use(
  (r) => r,
  (err) => {
    // Attach request id for debugging if server sends it
    const rid = err?.response?.headers?.['x-request-id']
    if (rid) console.warn('RequestId:', rid)
    return Promise.reject(err)
  }
)
```

### `apps/web/src/app/lib/analytics.ts`

```ts
let loaded = false
export function initAnalytics() {
  const id = import.meta.env.VITE_PUBLIC_ANALYTICS_KEY
  if (!id || loaded) return
  const s = document.createElement('script')
  s.async = true
  s.src = `https://www.googletagmanager.com/gtag/js?id=${id}`
  document.head.appendChild(s)
  const inline = document.createElement('script')
  inline.innerHTML = `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js', new Date());gtag('config','${id}');`
  document.head.appendChild(inline)
  loaded = true
}
export function trackRouteChange(loc: { pathname: string }) {
  const id = (window as any).gtag ? import.meta.env.VITE_PUBLIC_ANALYTICS_KEY : null
  if (id && (window as any).gtag) (window as any).gtag('event', 'page_view', { page_path: loc.pathname })
}
```

### `apps/web/src/app/lib/featureFlags.ts`

```ts
export const features = {
  'dashboard.view': { enabled: true, plans: ['free','pro','enterprise'] },
  'reports.generate': { enabled: false, plans: ['pro','enterprise'] }
} as const
```

### `apps/web/src/app/lib/responsive.ts`

```ts
import { useEffect, useState } from 'react'
export function useIsDesktop(breakpoint = 768) {
  const [is, setIs] = useState(() => window.innerWidth >= breakpoint)
  useEffect(() => {
    const on = () => setIs(window.innerWidth >= breakpoint)
    window.addEventListener('resize', on)
    return () => window.removeEventListener('resize', on)
  }, [breakpoint])
  return is
}
```

### `apps/web/src/app/pages/Home.tsx`

```tsx
import { useAuth } from '../providers/AuthProvider'

export default function Home() {
  const { user, loading, login, logout } = useAuth()
  if (loading) return <p>Loading…</p>
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Welcome</h1>
      {user ? (
        <>
          <p>Signed in as {user.email}</p>
          <button className="border px-3 py-1 rounded" onClick={logout}>Logout</button>
        </>
      ) : (
        <button className="border px-3 py-1 rounded" onClick={login}>Login with Google</button>
      )}
    </div>
  )
}
```

### `apps/web/src/app/pages/Dashboard.tsx`

```tsx
export default function Dashboard() {
  return <div className="prose"><h2>Dashboard</h2><p>Starter page.</p></div>
}
```

### `apps/web/src/app/pages/legal/CookiePolicy.tsx`

```tsx
export default function CookiePolicy(){
  return (
    <article className="prose">
      <h1>Cookie Policy</h1>
      <p>Describe cookies used, purposes, retention, and consent choices.</p>
    </article>
  )
}
```

### `apps/web/src/app/pages/legal/Terms.tsx`

```tsx
export default function Terms(){
  return (
    <article className="prose">
      <h1>Terms & Conditions</h1>
      <p>Provide your service terms, acceptable use, and legal info.</p>
    </article>
  )
}
```

### `apps/web/src/app/styles/index.css`

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root { color-scheme: light dark; }
body { @apply bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100; }
```

### `apps/web/tailwind.config.ts`

```ts
import type { Config } from 'tailwindcss'
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: { extend: {} },
  plugins: []
} satisfies Config
```

### `apps/web/postcss.config.cjs`

```js
module.exports = { plugins: { tailwindcss: {}, autoprefixer: {} } }
```

### `apps/web/.env.example`

```
VITE_API_BASE_URL=http://localhost:8080
VITE_GOOGLE_CLIENT_ID=your-google-client-id
VITE_PUBLIC_ANALYTICS_KEY=G-XXXXXXXXXX
VITE_ENABLE_PWA=true
```

---

## 3) Backend (apps/api)

### `apps/api/pyproject.toml`

```toml
[project]
name = "api"
version = "0.1.0"
dependencies = [
  "fastapi~=0.115",
  "uvicorn[standard]~=0.30",
  "pydantic~=2.9",
  "python-multipart~=0.0",
  "itsdangerous~=2.2",
  "google-cloud-firestore~=2.16",
  "redis~=5.0",
  "fastapi-limiter~=0.1",
  "pyjwt[crypto]~=2.9",
  "httpx~=0.27",
  "opentelemetry-sdk~=1.26",
  "opentelemetry-instrumentation-fastapi~=0.47b0",
  "prometheus-client~=0.21",
  "stripe~=10.10"
]
requires-python = ">=3.11"

[tool.black]
line-length = 100
```

### `apps/api/apps/api/settings.py`

```py
from pydantic import Field
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    project_id: str = "dev-project"
    google_client_id: str
    google_client_secret: str
    oauth_redirect_url: str = "http://127.0.0.1:5173"
    jwt_secret: str
    redis_url: str = "redis://localhost:6379/0"
    rate_limit_per_minute: int = 120
    stripe_public_key: str | None = None
    stripe_secret_key: str | None = None
    stripe_webhook_secret: str | None = None
    cors_origins: list[str] = Field(default_factory=lambda: ["http://127.0.0.1:5173"])

    class Config:
        env_file = ".env"

settings = Settings()
```

### `apps/api/apps/api/main.py`

```py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .settings import settings
from .routes import health, auth, users, payments
from .middleware.request_id import RequestIDMiddleware
from .middleware.logging import LoggingMiddleware

app = FastAPI(title="Webapp Factory API", version="1.0.0")

app.add_middleware(RequestIDMiddleware)
app.add_middleware(LoggingMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(users.router, prefix="/users", tags=["users"])
app.include_router(payments.router, prefix="/payments", tags=["payments"])

# Prometheus metrics endpoint
from prometheus_client import make_asgi_app
metrics_app = make_asgi_app()
app.mount("/metrics", metrics_app)
```

### `apps/api/apps/api/routes/health.py`

```py
from fastapi import APIRouter, Response

router = APIRouter()

@router.get("/healthz")
async def healthz():
    return {"status": "ok"}

@router.get("/readyz")
async def readyz(response: Response):
    # TODO: check Firestore & Redis connectivity
    response.headers['Cache-Control'] = 'no-store'
    return {"ready": True}
```

### `apps/api/apps/api/routes/auth.py`

```py
from fastapi import APIRouter, Depends, Response, Request, HTTPException
from ..services.auth_service import build_login_url, exchange_code, get_current_user, logout_user

router = APIRouter()

@router.get("/google/login")
async def google_login(redirect: str):
    return {"redirect": build_login_url(redirect)}

@router.get("/google/callback")
async def google_callback(code: str, state: str, response: Response):
    # Exchange auth code -> session cookie/JWT
    session = await exchange_code(code, state)
    response.set_cookie("session", session.token, httponly=True, samesite="lax")
    return {"ok": True}

@router.get("/me")
async def me(user=Depends(get_current_user)):
    return user

@router.post('/logout')
async def logout(response: Response):
    logout_user(response)
    return {"ok": True}
```

### `apps/api/apps/api/routes/users.py`

```py
from fastapi import APIRouter, Depends
from ..services.user_service import get_user_by_id
from ..security.guards import require_roles

router = APIRouter()

@router.get("/{user_id}", dependencies=[Depends(require_roles(["admin"]))])
async def get_user(user_id: str):
    return await get_user_by_id(user_id)
```

### `apps/api/apps/api/routes/payments.py` (Stripe webhook stub)

```py
from fastapi import APIRouter, Request, HTTPException
from ..providers.stripe import stripe, verify_signature

router = APIRouter()

@router.post('/webhook')
async def stripe_webhook(request: Request):
    payload = await request.body()
    sig = request.headers.get('stripe-signature')
    try:
        event = verify_signature(payload, sig)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    # TODO: handle events -> update entitlements
    return {"received": True}
```

### `apps/api/apps/api/services/auth_service.py`

```py
from dataclasses import dataclass
from typing import Optional
import jwt, secrets, time
from ..settings import settings

@dataclass
class Session:
    token: str

# NOTE: For template purposes we skip real Google exchange.
# In production, integrate with Google OAuth and verify ID token.

def build_login_url(redirect: str) -> str:
    # Redirect SPA to this URL; backend would normally redirect to Google.
    return f"{redirect}?login=google"

async def exchange_code(code: str, state: str) -> Session:
    claims = {"sub": "user_1", "email": "demo@example.com", "roles": ["user"], "iat": int(time.time())}
    token = jwt.encode(claims, settings.jwt_secret, algorithm="HS256")
    return Session(token=token)

async def get_current_user(token: Optional[str] = None):
    # In real setup, read from cookie; simplified for template
    return {"id": "user_1", "email": "demo@example.com", "roles": ["user"]}

def logout_user(response):
    response.delete_cookie("session")
```

### `apps/api/apps/api/services/entitlement_service.py`

```py
FEATURES = {
    "dashboard.view": {"plans": ["free", "pro", "enterprise"]},
    "reports.generate": {"plans": ["pro", "enterprise"]},
}

def has_feature(plan: str, feature: str) -> bool:
    f = FEATURES.get(feature)
    return bool(f and plan in f["plans"])
```

### `apps/api/apps/api/providers/firestore.py`

```py
from google.cloud import firestore
from ..settings import settings

def client():
    return firestore.Client(project=settings.project_id)
```

### `apps/api/apps/api/providers/redis.py`

```py
import redis
from ..settings import settings

_redis = None

def get_redis():
    global _redis
    if _redis is None:
        _redis = redis.from_url(settings.redis_url, decode_responses=True)
    return _redis
```

### `apps/api/apps/api/providers/stripe.py`

```py
import stripe as _stripe
from ..settings import settings

stripe = _stripe
stripe.api_key = settings.stripe_secret_key

def verify_signature(payload: bytes, sig: str | None):
    if not settings.stripe_webhook_secret:
        raise ValueError("Missing STRIPE_WEBHOOK_SECRET")
    return stripe.Webhook.construct_event(payload, sig, settings.stripe_webhook_secret)
```

### `apps/api/apps/api/middleware/request_id.py`

```py
import uuid
from starlette.types import ASGIApp, Receive, Scope, Send

class RequestIDMiddleware:
    def __init__(self, app: ASGIApp):
        self.app = app
    async def __call__(self, scope: Scope, receive: Receive, send: Send):
        if scope['type'] == 'http':
            scope['headers'].append((b'x-request-id', uuid.uuid4().hex.encode()))
        await self.app(scope, receive, send)
```

### `apps/api/apps/api/middleware/logging.py`

```py
import json, time
from starlette.middleware.base import BaseHTTPMiddleware

class LoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        start = time.time()
        resp = await call_next(request)
        dur = int((time.time() - start) * 1000)
        log = {
            "ts": time.time(),
            "method": request.method,
            "path": request.url.path,
            "status": resp.status_code,
            "duration_ms": dur,
        }
        print(json.dumps(log))
        return resp
```

### `apps/api/apps/api/security/guards.py`

```py
from fastapi import HTTPException, Request

async def require_roles(roles: list[str]):
    async def dep(request: Request):
        # In real setup: parse JWT from cookie/header
        user_roles = ["admin"] if request.headers.get('x-demo-admin') else ["user"]
        if not any(r in user_roles for r in roles):
            raise HTTPException(status_code=403, detail="forbidden")
    return dep
```

### `apps/api/apps/api/models/user.py`

```py
from pydantic import BaseModel

class User(BaseModel):
    id: str
    email: str
    name: str | None = None
    roles: list[str] = []
```

### `apps/api/uvicorn.ini`

```ini
[server]
host = 0.0.0.0
port = 8080
workers = 1
```

### `apps/api/Dockerfile`

```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY pyproject.toml /app/
RUN pip install --no-cache-dir uvicorn gunicorn fastapi pydantic pydantic-settings google-cloud-firestore redis fastapi-limiter pyjwt itsdangerous httpx prometheus-client stripe
COPY apps /app/apps
ENV PYTHONPATH=/app
CMD ["uvicorn", "apps.api.main:app", "--host", "0.0.0.0", "--port", "8080"]
```

### `apps/api/.env.example`

```
PROJECT_ID=your-gcp-project
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
OAUTH_REDIRECT_URL=http://127.0.0.1:5173
JWT_SECRET=dev-secret
REDIS_URL=redis://localhost:6379
RATE_LIMIT_PER_MINUTE=120
STRIPE_PUBLIC_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

---

## 4) Shared Packages

### `packages/feature-flags/index.ts`

```ts
export type Plan = 'free' | 'pro' | 'enterprise'
export const FEATURES = {
  'dashboard.view': { plans: ['free','pro','enterprise'] },
  'reports.generate': { plans: ['pro','enterprise'] }
} as const
export function allowed(plan: Plan, feature: keyof typeof FEATURES) {
  return FEATURES[feature].plans.includes(plan)
}
```

### `packages/config/nav.ts`

```ts
export const NAV = [
  { to: '/', label: 'Home' },
  { to: '/dashboard', label: 'Dashboard', feature: 'dashboard.view' }
] as const
```

---

## 5) Infra & Deployment

### `infra/firebase/firebase.json`

```json
{
  "hosting": {
    "public": "apps/web/dist",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [
      { "source": "**", "destination": "/index.html" },
      { "source": "/api/**", "run": { "serviceId": "webapp-factory-api", "region": "europe-west1" } }
    ]
  }
}
```

### `infra/firebase/.firebaserc`

```json
{ "projects": { "default": "your-firebase-project" } }
```

### `infra/firebase/firestore.rules`

```text
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isSignedIn() { return request.auth != null; }
    function tenant(tid) { return request.auth.token.tenant_id == tid; }

    match /tenants/{tenantId}/{document=**} {
      allow read, write: if isSignedIn() && tenant(tenantId);
    }
  }
}
```

### `infra/firebase/firestore.indexes.json`

```json
{ "indexes": [], "fieldOverrides": [] }
```

### `infra/github/workflows/ci.yml`

```yaml
name: CI
on: [push, pull_request]
jobs:
  ci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: 9 }
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: 'pnpm' }
      - run: pnpm i
      - run: pnpm lint && pnpm build && pnpm test
```

### `infra/github/workflows/deploy.yml`

```yaml
name: Deploy
on:
  push:
    branches: [main]
jobs:
  api:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: google-github-actions/auth@v2
        with:
          workload_identity_provider: ${{ secrets.WIF_PROVIDER }}
          service_account: ${{ secrets.DEPLOY_SA }}
      - uses: google-github-actions/setup-gcloud@v2
      - run: |
          gcloud builds submit --tag europe-west1-docker.pkg.dev/$PROJECT/webapp-factory/api:$(git rev-parse --short HEAD) apps/api
          gcloud run deploy webapp-factory-api \
            --image europe-west1-docker.pkg.dev/$PROJECT/webapp-factory/api:$(git rev-parse --short HEAD) \
            --region europe-west1 --allow-unauthenticated --platform managed
  web:
    needs: api
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: 9 }
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: 'pnpm' }
      - run: pnpm i && pnpm -C apps/web build
      - uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: '${{ secrets.GITHUB_TOKEN }}'
          firebaseServiceAccount: '${{ secrets.FIREBASE_SERVICE_ACCOUNT }}'
          channelId: live
          projectId: ${{ secrets.FIREBASE_PROJECT }}
```

### `infra/docker/compose.dev.yml`

```yaml
version: '3.9'
services:
  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]
```

### `infra/scripts/openapi_export.sh`

```bash
#!/usr/bin/env bash
set -euo pipefail
# Export FastAPI OpenAPI and generate TS client (placeholder)
curl -s http://localhost:8080/openapi.json > packages/api-client/openapi.json || true
# Example: use openapi-typescript or openapi-generator here
```

---

## 6) Devcontainer (optional)

### `.devcontainer/devcontainer.json`

```json
{
  "name": "Webapp Factory",
  "image": "mcr.microsoft.com/devcontainers/typescript-node:20",
  "features": {
    "ghcr.io/devcontainers/features/python:1": { "version": "3.11" }
  },
  "postCreateCommand": "pnpm i"
}
```

---

## 7) Domain Reuse Notes

* **No logic duplication**: routing & data hooks live once; only **layout** swaps between desktop/mobile.
* **Feature flags** in both front & back keep vertical features toggleable per plan/role.
* **Legal** pages + **Analytics** wiring included; swap content & keys per project.
* **CI/CD** wired for PR verification and main deploys; keep env via secrets.

> From here, add vertical packs (booking/marketplace/CRM-lite) as separate packages or routes gated by features.
