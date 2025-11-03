import path from 'path'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiProxyTarget = env.VITE_API_BASE_URL || env.VITE_API_PROXY || 'http://127.0.0.1:8000'

  return {
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        // Enable SW in dev if you want to test offline behavior:
        // devOptions: { enabled: true },
        includeAssets: ['favicon.svg', 'icons/maskable-192.png', 'icons/maskable-512.png', 'offline.html'],
        manifest: {
          name: 'Webapp Factory',
          short_name: 'WAF',
          description: 'A factory template to build cool, customizable webapps fast.',
          start_url: '/?source=pwa',
          scope: '/',
          display: 'standalone',
          theme_color: '#0f172a',
          background_color: '#0b1220',
          icons: [
            { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
            { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
            { src: 'icons/maskable-192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
            { src: 'icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }
          ],
          shortcuts: [
            { name: 'Dashboard', url: '/dashboard', description: 'Go to dashboard' },
            { name: 'Profile', url: '/profile', description: 'Open your profile' }
          ]
        },
        workbox: {
          navigateFallback: '/offline.html',
          runtimeCaching: [
            {
              urlPattern: ({ request }) => request.mode === 'navigate',
              handler: 'NetworkFirst',
              options: {
                cacheName: 'pages',
                networkTimeoutSeconds: 3,
                cacheableResponse: { statuses: [200] },
                expiration: {
                  maxEntries: 50,
                  maxAgeSeconds: 60 * 60 * 24 * 7
                }
              }
            },
            {
              urlPattern: ({ sameOrigin, url }) => sameOrigin && url.pathname.startsWith('/assets/'),
              handler: 'CacheFirst',
              options: {
                cacheName: 'assets',
                cacheableResponse: { statuses: [200] },
                expiration: {
                  maxEntries: 300,
                  maxAgeSeconds: 60 * 60 * 24 * 30
                }
              }
            },
            {
              urlPattern: ({ sameOrigin, url }) =>
                sameOrigin && /\.(?:png|jpg|jpeg|svg|gif|webp|avif)$/.test(url.pathname),
              handler: 'StaleWhileRevalidate',
              options: {
                cacheName: 'images',
                cacheableResponse: { statuses: [200] },
                expiration: {
                  maxEntries: 200,
                  maxAgeSeconds: 60 * 60 * 24 * 30
                }
              }
            },
            {
              urlPattern: ({ sameOrigin, url }) =>
                sameOrigin && url.pathname === '/app.config.json',
              handler: 'StaleWhileRevalidate',
              options: {
                cacheName: 'config',
                cacheableResponse: { statuses: [200] },
                expiration: {
                  maxEntries: 5,
                  maxAgeSeconds: 60 * 60 * 24
                }
              }
            },
            {
              urlPattern: ({ sameOrigin, url, request }) =>
                sameOrigin &&
                url.pathname.startsWith('/api/') &&
                request.method === 'GET' &&
                !request.headers.has('Authorization'),
              handler: 'StaleWhileRevalidate',
              options: {
                cacheName: 'api',
                cacheableResponse: { statuses: [200] },
                expiration: {
                  maxEntries: 200,
                  maxAgeSeconds: 60 * 30
                }
              }
            }
          ],
          skipWaiting: true,
          clientsClaim: true
        }
      })
    ],
    // Bind dev server to IPv4 loopback explicitly to avoid 'localhost' resolving
    // to IPv6 (::1) on some systems. This makes the dev server listen on
    // 127.0.0.1 by default.
    server: {
      host: '127.0.0.1',
      port: 5173,
      proxy: {
        '/api': {
          target: apiProxyTarget,
          changeOrigin: true,
          secure: false,
        },
      },
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
        '@config': path.resolve(__dirname, '../../packages/config')
      }
    },
    build: { sourcemap: true }
  }
})
