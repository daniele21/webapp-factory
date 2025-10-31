import { useEffect } from 'react'
import { useAppConfig } from '@config/src/provider'

export const useSyncPWAConfig = () => {
  const { config } = useAppConfig()

  useEffect(() => {
    const pwaConfig = config?.pwa
    if (!pwaConfig) return
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return

    const payload = {
      backgroundSync: Boolean(pwaConfig.backgroundSync),
      appShellCaching: pwaConfig.appShellCaching !== false,
      offlinePage: pwaConfig.offlinePage ?? '/offline.html',
    }

    navigator.serviceWorker
      .ready
      .then((registration) => {
        registration.active?.postMessage({
          type: 'PWA_CONFIG_UPDATE',
          payload,
        })
      })
      .catch(() => {})
  }, [config?.pwa])
}

export default useSyncPWAConfig
