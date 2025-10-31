import { useMemo, useState, type ComponentType } from 'react'
import * as Popover from '@radix-ui/react-popover'
import * as SwitchPrimitive from '@radix-ui/react-switch'
import { formatDistanceToNow } from 'date-fns'
import { AlertTriangle, Bell, BellDot, Globe, Loader2, Mail, RefreshCw, WifiOff, Plus } from 'lucide-react'
import { cn } from '@/app/lib/cn'
import { Tabs } from '@/app/components/design-system/navigation/Tabs'
import { Badge } from '@/app/components/design-system/primitives/Badge'
import { useAppConfig } from '@config/src/provider'
import type { AppConfig } from '@config/src/schema'
import { useAuth } from '@/app/providers/AuthProvider'
import {
  getPreferenceEnabled,
  useCreateDebugNotification,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotificationFeed,
  useNotificationPreferences,
  usePushSubscription,
  useUpdateNotificationPreferences,
} from '@/app/features/notifications/hooks'
import { useToast } from '@/app/components/design-system/overlays/ToastProvider'
import type {
  Notification,
  NotificationChannel,
  NotificationDelivery,
  NotificationDeliveryStatus,
} from '@/app/features/notifications/types'

const deliveryStatusCopy: Record<NotificationDeliveryStatus, { label: string; tone: 'neutral' | 'brand' | 'success' | 'warning' }> = {
  pending: { label: 'Pending', tone: 'brand' },
  delivered: { label: 'Delivered', tone: 'success' },
  disabled: { label: 'Disabled', tone: 'neutral' },
  fallback: { label: 'Fallback', tone: 'warning' },
  unsubscribed: { label: 'Awaiting opt-in', tone: 'warning' },
}

const channelDefaults: Record<NotificationChannel, { label: string; description: string }> = {
  inApp: {
    label: 'In-app center',
    description: 'Keep messages in the activity feed inside the product.',
  },
  webPush: {
    label: 'Web push alerts',
    description: 'Deliver real-time alerts to supported browsers when the app is closed.',
  },
  email: {
    label: 'Email fallback',
    description: 'Send a backup email if push is unavailable or the message stays unread.',
  },
}

type ChannelMeta = Record<NotificationChannel, { label: string; description: string }>

export function NotificationCenterButton() {
  const { config } = useAppConfig()
  const { user } = useAuth()
  const notificationsConfig = config?.notifications
  const topbarConfig = config?.layout?.topbar

  const showNotifications = topbarConfig?.showNotifications ?? true
  const inAppEnabled = notificationsConfig?.inApp !== false
  const isAuthenticated = Boolean(user)

  const feedQuery = useNotificationFeed(showNotifications && inAppEnabled && isAuthenticated)
  const unreadCount = feedQuery.data?.unreadCount ?? 0
  const [open, setOpen] = useState(false)

  const channelMeta: ChannelMeta = useMemo(() => {
    const meta = { ...channelDefaults } as ChannelMeta
    const channels =
      (notificationsConfig?.channels ?? []) as Array<{
        channel: NotificationChannel
        label?: string
        description?: string
      }>

    channels.forEach(({ channel, label, description }) => {
      const id: NotificationChannel = channel
      meta[id] = {
        label: label ?? channelDefaults[id].label,
        description: description ?? channelDefaults[id].description,
      }
    })

    return meta
  }, [notificationsConfig])

  const preferencesQuery = useNotificationPreferences(open)
  const markNotification = useMarkNotificationRead()
  const markAllMutation = useMarkAllNotificationsRead()
  const updatePreferences = useUpdateNotificationPreferences()
  const push = usePushSubscription()

  if (!showNotifications || !inAppEnabled || !isAuthenticated) {
    return null
  }

  const hasUnread = unreadCount > 0
  const badgeLabel = unreadCount > 99 ? '99+' : String(unreadCount)

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          type="button"
          aria-label={hasUnread ? `${unreadCount} unread notifications` : 'Notifications'}
          className={cn(
            'relative inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface1/80 transition',
            'hover:bg-surface2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[hsl(var(--ring))]'
          )}
        >
          {hasUnread ? <BellDot className="h-4 w-4" aria-hidden /> : <Bell className="h-4 w-4" aria-hidden />}
          {hasUnread ? (
            <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-accent px-1 text-[11px] font-semibold text-accent-fg">
              {badgeLabel}
            </span>
          ) : null}
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          sideOffset={12}
          align="end"
          className="z-[var(--z-popover)] w-[380px] max-w-[90vw] rounded-2xl overlay-surface p-4"
        >
          <NotificationPanel
            feedQuery={feedQuery}
            unreadCount={unreadCount}
            markNotification={markNotification}
            markAllMutation={markAllMutation}
            updatePreferences={updatePreferences}
            preferencesQuery={preferencesQuery}
            notificationsConfig={notificationsConfig}
            channelMeta={channelMeta}
            push={push}
          />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}

type NotificationPanelProps = {
  feedQuery: ReturnType<typeof useNotificationFeed>
  unreadCount: number
  markNotification: ReturnType<typeof useMarkNotificationRead>
  markAllMutation: ReturnType<typeof useMarkAllNotificationsRead>
  updatePreferences: ReturnType<typeof useUpdateNotificationPreferences>
  preferencesQuery: ReturnType<typeof useNotificationPreferences>
  notificationsConfig: AppConfig['notifications'] | undefined
  channelMeta: ChannelMeta
  push: ReturnType<typeof usePushSubscription>
}

function NotificationPanel({
  feedQuery,
  unreadCount,
  markNotification,
  markAllMutation,
  updatePreferences,
  preferencesQuery,
  notificationsConfig,
  channelMeta,
  push,
}: NotificationPanelProps) {
  const [activeTab, setActiveTab] = useState<'feed' | 'preferences'>('feed')
  const hasChannelToggles = Boolean(notificationsConfig?.webPush ?? notificationsConfig?.email ?? true)
  const createDebugNotification = useCreateDebugNotification()
  const { notify } = useToast()

  const tabs = useMemo(() => {
    const items = [
      {
        id: 'feed',
        label: 'Feed',
        content: <NotificationFeedList query={feedQuery} markNotification={markNotification} />,
      },
    ]

    if (hasChannelToggles) {
      items.push({
        id: 'preferences',
        label: 'Channels',
        content: (
          <NotificationPreferencesPane
            query={preferencesQuery}
            updatePreferences={updatePreferences}
            notificationsConfig={notificationsConfig}
            channelMeta={channelMeta}
            push={push}
          />
        ),
      })
    }

    return items
  }, [feedQuery, markNotification, hasChannelToggles, preferencesQuery, updatePreferences, notificationsConfig, channelMeta, push])

  const headerStatus = feedQuery.isFetching ? 'Syncing…' : unreadCount === 0 ? 'You’re all caught up' : `${unreadCount} unread`

  const handleCreateDebug = async () => {
    try {
      const now = new Date()
      await createDebugNotification.mutateAsync({
        title: 'Test notification',
        body: `Triggered at ${now.toLocaleTimeString()}`,
        category: 'debug',
      })
      notify({
        title: 'Notification sent',
        description: 'A sample notification was added to your feed.',
        intent: 'success',
      })
    } catch (error) {
      notify({
        title: 'Unable to send notification',
        description: error instanceof Error ? error.message : 'Unknown error',
        intent: 'error',
      })
    }
  }

  return (
    <div className="space-y-4">
      <header className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">Notifications</p>
          <p className="text-xs text-muted-fg">{headerStatus}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCreateDebug}
            className="inline-flex items-center gap-1 rounded-full border border-border/70 px-3 py-1 text-xs font-semibold text-primary transition hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={createDebugNotification.isPending}
          >
            {createDebugNotification.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Plus className="h-3.5 w-3.5" />
            )}
            <span>{createDebugNotification.isPending ? 'Sending…' : 'Send test'}</span>
          </button>
          <button
            type="button"
            onClick={() => feedQuery.refetch()}
            className="rounded-full p-2 text-muted-fg transition hover:text-fg"
            aria-label="Refresh notifications"
          >
            <RefreshCw className={cn('h-4 w-4', feedQuery.isFetching && 'animate-spin')} />
          </button>
          <button
            type="button"
            disabled={unreadCount === 0 || markAllMutation.isPending}
            onClick={() => markAllMutation.mutate()}
            className="rounded-full px-3 py-1 text-xs font-semibold text-primary transition hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {markAllMutation.isPending ? 'Marking…' : 'Mark all read'}
          </button>
        </div>
      </header>
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'feed' | 'preferences')} tabs={tabs} />
    </div>
  )
}

type NotificationFeedListProps = {
  query: ReturnType<typeof useNotificationFeed>
  markNotification: ReturnType<typeof useMarkNotificationRead>
}

function NotificationFeedList({ query, markNotification }: NotificationFeedListProps) {
  const [pendingId, setPendingId] = useState<string | null>(null)

  const onToggleRead = (notification: Notification) => {
    setPendingId(notification.id)
    markNotification.mutate(
      { id: notification.id, read: !notification.read },
      {
        onSettled: () => setPendingId((id) => (id === notification.id ? null : id)),
      }
    )
  }

  if (query.isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, idx) => (
          <div key={idx} className="h-20 animate-pulse rounded-2xl border border-border/50 bg-surface2/60" />
        ))}
      </div>
    )
  }

  if (query.isError) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-border/70 bg-surface2/50 px-3 py-4 text-sm">
        <AlertTriangle className="h-5 w-5 text-warning" />
        <div>
          <p className="font-medium">Unable to load notifications</p>
          <p className="text-xs text-muted-fg">Try refreshing or check your connection.</p>
        </div>
      </div>
    )
  }

  const items = query.data?.items ?? []

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-border/70 bg-surface2/40 p-6 text-center text-sm text-muted-fg">
        You’re up to date. New alerts will show up here.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <NotificationCard
          key={item.id}
          item={item}
          pending={pendingId === item.id}
          onToggle={() => onToggleRead(item)}
        />
      ))}
    </div>
  )
}

type NotificationCardProps = {
  item: Notification
  pending: boolean
  onToggle: () => void
}

function NotificationCard({ item, pending, onToggle }: NotificationCardProps) {
  const unread = !item.read
  const timestamp = useMemo(() => formatDistanceToNow(new Date(item.createdAt), { addSuffix: true }), [item.createdAt])

  return (
    <article
      className={cn(
        'rounded-2xl border px-3 py-3 transition',
        unread ? 'border-primary/40 bg-primary/8' : 'border-border/70 bg-surface2/40'
      )}
    >
      <header className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge tone="brand">{formatCategory(item.category)}</Badge>
            <span className="text-xs text-muted-fg">{timestamp}</span>
          </div>
          <p className="text-sm font-semibold leading-5">{item.title}</p>
        </div>
        <button
          type="button"
          onClick={onToggle}
          disabled={pending}
          className="rounded-full border border-border/60 px-2 py-1 text-xs font-medium text-muted-fg transition hover:bg-surface2 disabled:cursor-wait disabled:opacity-60"
        >
          {pending ? 'Saving…' : unread ? 'Mark read' : 'Mark unread'}
        </button>
      </header>
      <p className="mt-2 text-sm text-muted-fg">{item.body}</p>
      {item.actionUrl ? (
        <a
          href={item.actionUrl}
          className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-primary transition hover:underline"
        >
          View details
        </a>
      ) : null}
      <div className="mt-3 flex flex-wrap gap-2">
        {item.deliveries.map((delivery) => (
          <DeliveryStatusChip key={delivery.channel} delivery={delivery} />
        ))}
      </div>
    </article>
  )
}

const formatCategory = (category: string) =>
  category
    .split(/[\s_-]+/)
    .map((token) => token.charAt(0).toUpperCase() + token.slice(1))
    .join(' ')

type DeliveryStatusChipProps = {
  delivery: NotificationDelivery
}

function DeliveryStatusChip({ delivery }: DeliveryStatusChipProps) {
  const meta = deliveryStatusCopy[delivery.status]
  const Icon = {
    inApp: Bell,
    webPush: Globe,
    email: Mail,
  }[delivery.channel]

  return (
    <div className="flex items-start gap-2 rounded-xl border border-border/60 bg-surface1/70 px-2 py-1">
      <Icon className="mt-0.5 h-3.5 w-3.5 text-muted-fg" />
      <div>
        <Badge tone={meta.tone}>{meta.label}</Badge>
        {delivery.detail ? <p className="mt-1 text-[11px] text-muted-fg">{delivery.detail}</p> : null}
      </div>
    </div>
  )
}

type NotificationPreferencesPaneProps = {
  query: ReturnType<typeof useNotificationPreferences>
  updatePreferences: ReturnType<typeof useUpdateNotificationPreferences>
  notificationsConfig: AppConfig['notifications'] | undefined
  channelMeta: ChannelMeta
  push: ReturnType<typeof usePushSubscription>
}

function NotificationPreferencesPane({
  query,
  updatePreferences,
  notificationsConfig,
  channelMeta,
  push,
}: NotificationPreferencesPaneProps) {
  const [pushActionPending, setPushActionPending] = useState(false)

  if (query.isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, idx) => (
          <div key={idx} className="h-16 animate-pulse rounded-2xl border border-border/50 bg-surface2/60" />
        ))}
      </div>
    )
  }

  if (query.isError) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-border/70 bg-surface2/50 px-3 py-4 text-sm">
        <AlertTriangle className="h-5 w-5 text-warning" />
        <div>
          <p className="font-medium">Unable to load channel preferences</p>
          <p className="text-xs text-muted-fg">Please retry in a moment.</p>
        </div>
      </div>
    )
  }

  const preferences = query.data

  const toggle = async (channel: NotificationChannel, next: boolean) => {
    const payloadChannels: NotificationChannel[] = ['inApp', 'webPush', 'email']
    const current = payloadChannels.map((ch) => ({
      channel: ch,
      enabled: ch === channel ? next : getPreferenceEnabled(preferences, ch),
    }))

    await updatePreferences.mutateAsync({ preferences: current })

    if (channel === 'webPush' && !next && push.status === 'subscribed') {
      setPushActionPending(true)
      try {
        await push.unsubscribe()
      } finally {
        setPushActionPending(false)
      }
    }
  }

  const rows: Array<{ channel: NotificationChannel; icon: ComponentType<{ className?: string }>; disabled: boolean }> = [
    { channel: 'inApp', icon: Bell, disabled: notificationsConfig?.inApp === false },
    {
      channel: 'webPush',
      icon: Globe,
      disabled: (notificationsConfig?.webPush === false) || !push.supported,
    },
    { channel: 'email', icon: Mail, disabled: notificationsConfig?.email === false },
  ]

  const pushStatusCopy: Record<typeof push.status, { label: string; tone: 'neutral' | 'brand' | 'success' | 'warning'; description: string }> = {
    idle: {
      label: 'Disabled in config',
      tone: 'neutral',
      description: 'Enable push alerts in the configuration to allow browser opt-in.',
    },
    unsupported: {
      label: 'Not supported',
      tone: 'warning',
      description: 'This browser does not support service workers or push notifications.',
    },
    prompt: {
      label: 'Not subscribed',
      tone: 'brand',
      description: 'Invite users to opt in for instant alerts using the button below.',
    },
    subscribed: {
      label: 'Active',
      tone: 'success',
      description: 'Browser push is enabled and email fallback will trigger if delivery fails.',
    },
    denied: {
      label: 'Permission denied',
      tone: 'warning',
      description: 'Push permission was denied. Re-enable it from browser settings to receive alerts.',
    },
    error: {
      label: 'Error',
      tone: 'warning',
      description: 'We could not register for push. Try again or check configuration.',
    },
  }

  const pushCopy = pushStatusCopy[push.status]

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {rows.map(({ channel, icon: Icon, disabled }) => {
          const meta = channelMeta[channel]
          const checked = getPreferenceEnabled(preferences, channel)
          const channelDisabled = disabled
          const isUpdating = updatePreferences.isPending
          return (
            <div
              key={channel}
              className={cn(
                'flex items-center justify-between gap-3 rounded-2xl border border-border/70 bg-surface2/40 px-3 py-3',
                (channelDisabled || (!push.supported && channel === 'webPush')) && 'opacity-60'
              )}
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-muted-fg" />
                  <p className="text-sm font-semibold">{meta.label}</p>
                </div>
                <p className="mt-1 text-xs text-muted-fg">{meta.description}</p>
              </div>
              <SwitchPrimitive.Root
                disabled={channelDisabled || isUpdating || (channel === 'webPush' && !push.supported)}
                checked={checked}
                onCheckedChange={(value) => {
                  void toggle(channel, Boolean(value))
                }}
                className="relative inline-flex h-6 w-11 items-center rounded-full border border-border/60 bg-muted transition-colors data-[state=checked]:border-primary data-[state=checked]:bg-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-bg disabled:cursor-not-allowed disabled:opacity-60"
              >
                <SwitchPrimitive.Thumb className="absolute left-0.5 top-1/2 h-5 w-5 -translate-y-1/2 rounded-full bg-card shadow-sm transition-transform data-[state=checked]:translate-x-[18px]" />
              </SwitchPrimitive.Root>
            </div>
          )
        })}
      </div>

      {notificationsConfig?.webPush === false ? (
        <div className="flex items-center gap-2 rounded-2xl border border-border/70 bg-surface2/50 px-3 py-3 text-xs text-muted-fg">
          <WifiOff className="h-4 w-4" />
          Web push is disabled at the tenant level. Enable it in configuration to allow opt‑in.
        </div>
      ) : null}

      {notificationsConfig?.webPush !== false ? (
        <div className="space-y-2 rounded-2xl border border-border/60 bg-surface1/70 px-3 py-3">
          <div className="flex items-center gap-2">
            <Badge tone={pushCopy.tone}>{pushCopy.label}</Badge>
            {pushActionPending && <Loader2 className="h-4 w-4 animate-spin text-muted-fg" />}
          </div>
          <p className="text-xs text-muted-fg">{pushCopy.description}</p>
          {push.error ? <p className="text-xs text-warning">{push.error}</p> : null}
          <div className="flex gap-2">
            {push.status === 'subscribed' ? (
              <button
                type="button"
                className="rounded-xl border border-border/60 px-3 py-1 text-xs font-semibold text-muted-fg transition hover:bg-surface2"
                onClick={async () => {
                  setPushActionPending(true)
                  try {
                    await push.unsubscribe()
                  } finally {
                    setPushActionPending(false)
                  }
                }}
                disabled={pushActionPending}
              >
                Disable push
              </button>
            ) : (
              <button
                type="button"
                className="rounded-xl border border-primary/50 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary transition hover:bg-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
                onClick={async () => {
                  setPushActionPending(true)
                  const result = await push.subscribe()
                  if (!result.ok) {
                    setPushActionPending(false)
                    return
                  }
                  setPushActionPending(false)
                }}
                disabled={pushActionPending || !push.supported}
              >
                Enable push alerts
              </button>
            )}
          </div>
        </div>
      ) : null}

      {notificationsConfig?.email === false ? (
        <div className="rounded-2xl border border-border/70 bg-surface2/50 px-3 py-3 text-xs text-muted-fg">
          Email fallback is disabled in configuration. Critical alerts rely on push delivery.
        </div>
      ) : null}
    </div>
  )
}

export default NotificationCenterButton
