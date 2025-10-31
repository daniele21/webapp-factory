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
        srcDir: '.',
        filename: 'sw.ts',
        strategies: 'injectManifest',
        injectManifest: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest}'],
          additionalManifestEntries: [{ url: '/offline.html', revision: null }],
        },
        manifest: {
          name: 'Webapp Factory',
          short_name: 'Factory',
          start_url: '/',
          display: 'standalone',
          background_color: '#0b1021',
          theme_color: '#0ea5e9',
          icons: [
            { src: '/icons/logo-192.png', sizes: '192x192', type: 'image/png' },
            { src: '/icons/logo-512.png', sizes: '512x512', type: 'image/png' }
          ]
        },
        injectRegister: 'auto',
        // Ensure dev service worker is treated as an ES module since our `sw.ts` uses imports
        devOptions: { enabled: true, type: 'module' }
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
