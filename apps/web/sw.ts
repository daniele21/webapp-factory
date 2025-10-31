/// <reference lib="WebWorker" />
import { cleanupOutdatedCaches, matchPrecache, precacheAndRoute } from 'workbox-precaching'
import { registerRoute, setCatchHandler } from 'workbox-routing'
import { BackgroundSyncPlugin } from 'workbox-background-sync'
import { StaleWhileRevalidate, CacheFirst, NetworkFirst, NetworkOnly } from 'workbox-strategies'
import { ExpirationPlugin } from 'workbox-expiration'

declare let self: ServiceWorkerGlobalScope & { __WB_MANIFEST: Array<{ url: string; revision?: string | null }> }

const APP_SHELL_CACHE = 'app-shell'
const API_CACHE = 'api-swr'
const IMAGE_CACHE = 'images'
const DEFAULT_OFFLINE_URL = '/offline.html'

type RuntimeOptions = {
  offlinePage: string
  backgroundSync: boolean
  appShellCaching: boolean
}

const runtimeOptions: RuntimeOptions = {
  offlinePage: DEFAULT_OFFLINE_URL,
  backgroundSync: false,
  appShellCaching: true,
}

const manifest = self.__WB_MANIFEST as Array<{ url: string; revision?: string | null }>
if (!manifest.some((entry) => entry.url === DEFAULT_OFFLINE_URL)) {
  manifest.push({ url: DEFAULT_OFFLINE_URL, revision: null })
}

precacheAndRoute(manifest as any)
cleanupOutdatedCaches()

const appShellStrategy = new NetworkFirst({
  cacheName: APP_SHELL_CACHE,
  networkTimeoutSeconds: 6,
})

registerRoute(
  ({ request }) => request.mode === 'navigate',
  async ({ event }) => {
    if (!runtimeOptions.appShellCaching) {
      return fetch(event.request)
    }
    try {
      const response = await appShellStrategy.handle({ event })
      if (response) return response
    } catch (error) {
      // Fall through to offline fallback below
    }
    const precached = await matchPrecache(runtimeOptions.offlinePage)
    if (precached) return precached
    const cache = await caches.open(APP_SHELL_CACHE)
    const cached = await cache.match(runtimeOptions.offlinePage)
    if (cached) return cached
    return Response.error()
  }
)

registerRoute(
  ({ url, request }) => url.pathname.startsWith('/api/') && request.method === 'GET',
  new StaleWhileRevalidate({ cacheName: API_CACHE })
)

registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: IMAGE_CACHE,
    plugins: [new ExpirationPlugin({ maxEntries: 120, maxAgeSeconds: 60 * 60 * 24 * 7 })],
  })
)

const backgroundSyncPlugin = new BackgroundSyncPlugin('api-write-queue', {
  maxRetentionTime: 60 * 24,
})

const networkOnlyStrategy = new NetworkOnly({ plugins: [backgroundSyncPlugin] })
;(['POST', 'PUT', 'PATCH', 'DELETE'] as const).forEach((method) => {
  registerRoute(
    ({ url }) => url.pathname.startsWith('/api/'),
    async ({ event }) => {
      if (!runtimeOptions.backgroundSync) {
        return fetch(event.request.clone())
      }
      return networkOnlyStrategy.handle({ event })
    },
    method
  )
})

setCatchHandler(async ({ event }) => {
  if (event.request.mode === 'navigate') {
    const precached = await matchPrecache(runtimeOptions.offlinePage)
    if (precached) return precached
    const cache = await caches.open(APP_SHELL_CACHE)
    const cached = await cache.match(runtimeOptions.offlinePage)
    if (cached) return cached
  }
  return Response.error()
})

self.addEventListener('message', (event) => {
  const data = event.data as
    | { type: 'SKIP_WAITING' }
    | { type: 'PWA_CONFIG_UPDATE'; payload: Partial<RuntimeOptions> }
    | undefined

  if (!data) return

  if (data.type === 'SKIP_WAITING') {
    void self.skipWaiting()
    return
  }

  if (data.type === 'PWA_CONFIG_UPDATE') {
    const payload = data.payload ?? {}
    if (typeof payload.backgroundSync === 'boolean') {
      runtimeOptions.backgroundSync = payload.backgroundSync
    }
    if (typeof payload.appShellCaching === 'boolean') {
      runtimeOptions.appShellCaching = payload.appShellCaching
    }
    if (typeof payload.offlinePage === 'string' && payload.offlinePage) {
      runtimeOptions.offlinePage = payload.offlinePage
      caches.open(APP_SHELL_CACHE).then((cache) => cache.add(runtimeOptions.offlinePage)).catch(() => {})
    }
  }
})
