import { useState } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'

export function usePwaUpdate() {
  const [needRefresh, setNeedRefresh] = useState(false)
  const [offlineReady, setOfflineReady] = useState(false)

  const { updateServiceWorker } = useRegisterSW({
    onRegisteredSW() {
      // optional: console.log('SW registered')
    },
    onOfflineReady() {
      setOfflineReady(true)
      setTimeout(() => setOfflineReady(false), 3000)
    },
    onNeedRefresh() {
      setNeedRefresh(true)
    }
  })

  const refresh = () => updateServiceWorker(true)
  const dismiss = () => setNeedRefresh(false)

  return { needRefresh, offlineReady, refresh, dismiss }
}

export function PwaUpdateToast() {
  const { needRefresh, offlineReady, refresh, dismiss } = usePwaUpdate()

  if (!needRefresh && !offlineReady) return null

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 16,
        left: '50%',
        transform: 'translateX(-50%)',
        padding: '12px 16px',
        background: '#111827',
        color: '#e5e7eb',
        borderRadius: 12,
        boxShadow: '0 8px 24px rgba(0,0,0,.3)',
        display: 'flex',
        gap: 12,
        zIndex: 9999
      }}
    >
      {offlineReady && <span>App ready to work offline.</span>}
      {needRefresh && <span>New version available.</span>}
      {needRefresh && (
        <>
          <button
            type="button"
            onClick={refresh}
            style={{ padding: '6px 10px', borderRadius: 8 }}
          >
            Refresh
          </button>
          <button
            type="button"
            onClick={dismiss}
            style={{ padding: '6px 10px', borderRadius: 8, opacity: 0.8 }}
          >
            Later
          </button>
        </>
      )}
    </div>
  )
}
