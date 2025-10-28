import { defineConfig } from 'vite'
import path from 'path'
import react from '@vitejs/plugin-react'
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
          { src: '/icons/logo-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/logo-512.png', sizes: '512x512', type: 'image/png' }
        ]
      },
      injectRegister: 'auto',
      devOptions: { enabled: true }
    })
  ],
  // Bind dev server to IPv4 loopback explicitly to avoid 'localhost' resolving
  // to IPv6 (::1) on some systems. This makes the dev server listen on
  // 127.0.0.1 by default.
  server: { host: '127.0.0.1', port: 5173 },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  },
  build: { sourcemap: true }
})
