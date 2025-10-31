import { useCallback, useEffect, useMemo, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { cn } from '@/app/lib/cn'
import { useAppConfig } from '@config/src/provider'
import { useSyncPWAConfig } from '@/app/lib/useSyncPWAConfig'
import { useTransparencyPreference } from '@/app/lib/useTransparencyPreference'

type PromptState = 'idle' | 'update-available'

export function PWAUpdatePrompt() {
  const { config } = useAppConfig()
  useSyncPWAConfig()
  const transparencyEnabled = useTransparencyPreference()

  const [state, setState] = useState<PromptState>('idle')
  const [visible, setVisible] = useState(false)

  const canUseServiceWorker = typeof window !== 'undefined' && 'serviceWorker' in navigator
  const updatePromptEnabled = config?.pwa?.updatePrompt !== false

  const handleNeedRefresh = useCallback(() => {
    setState((prev) => (prev === 'update-available' ? prev : 'update-available'))
    setVisible(true)
  }, [])

  const registerOptions = useMemo(
    () => ({
      onNeedRefresh: handleNeedRefresh,
    }),
    [handleNeedRefresh],
  )

  const { updateServiceWorker } = useRegisterSW(registerOptions)

  useEffect(() => {
    if (!canUseServiceWorker || updatePromptEnabled) return
    setState('idle')
    setVisible(false)
  }, [canUseServiceWorker, updatePromptEnabled])

  useEffect(() => {
    if (!canUseServiceWorker) {
      setState('idle')
      setVisible(false)
    }
  }, [canUseServiceWorker])

  const dismiss = useCallback(() => {
    setVisible(false)
  }, [])

  if (!canUseServiceWorker || !updatePromptEnabled) {
    return null
  }

  if (!visible || state === 'idle') return null

  const title = 'Update available'
  const description = 'We shipped a new version. Reload to get the latest improvements.'

  return (
    <div className="fixed bottom-6 right-6 z-[var(--z-toast)] max-w-xs">
      <div
        className={cn(
          'rounded-2xl border border-border/70 p-4 shadow-xl shadow-black/10',
          transparencyEnabled ? 'bg-card/95 backdrop-blur' : 'bg-card'
        )}
      >
        <div className="flex items-start gap-3">
          <div className={cn('mt-0.5 rounded-full border border-border/60 p-1.5 text-primary')}>
            <RefreshCw className="h-4 w-4 animate-spin" />
          </div>
          <div className="flex-1 space-y-1">
            <p className="text-sm font-semibold">{title}</p>
            <p className="text-xs text-muted-fg">{description}</p>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                className="rounded-xl bg-primary px-3 py-1 text-xs font-semibold text-primary-fg transition hover:bg-primary/90"
                onClick={() => updateServiceWorker(true)}
              >
                Reload now
              </button>
              <button
                type="button"
                className="rounded-xl border border-border/60 px-3 py-1 text-xs font-semibold text-muted-fg transition hover:bg-surface2"
                onClick={dismiss}
              >
                Later
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PWAUpdatePrompt
