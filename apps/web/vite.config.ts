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
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' }
        ]
      },
      injectRegister: 'auto',
      devOptions: { enabled: true }
    })
  ],
  server: { port: 5173 },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  },
  build: { sourcemap: true }
})
