import { useCallback, useEffect, useMemo, useState } from 'react'
import {
	useMutation,
	useQuery,
	useQueryClient,
	type MutationFunction,
	type UseMutationResult,
	type UseQueryResult,
} from '@tanstack/react-query'
import { useAppConfig } from '@config/src/provider'
import {
	createDebugNotification,
	fetchNotificationFeed,
	fetchNotificationPreferences,
	markAllNotificationsRead,
	markNotificationRead,
	registerPushSubscription,
	removePushSubscription,
	updateNotificationPreferences,
} from './api'
import {
	mapNotificationFeed,
	mapPreferences,
	mapPushSubscriptionResponse,
	type Notification,
	type NotificationFeed,
	type NotificationPreferences,
	type NotificationPreferenceUpdatePayload,
	type NotificationChannel,
	type PushSubscriptionResponse,
	type PushSubscriptionRequest,
} from './types'
import { hasPushSupport, urlBase64ToUint8Array } from './push'

export const notificationFeedQueryKey = ['notifications', 'feed'] as const
export const notificationPreferencesQueryKey = ['notifications', 'preferences'] as const

export const useNotificationFeed = (enabled: boolean = true): UseQueryResult<NotificationFeed> =>
	useQuery({
		queryKey: notificationFeedQueryKey,
		queryFn: async () => mapNotificationFeed(await fetchNotificationFeed()),
		enabled,
		staleTime: 60_000,
		refetchInterval: enabled ? 120_000 : false,
	})

export const useMarkNotificationRead = (): UseMutationResult<
	void,
	Error,
	{ id: string; read: boolean }
> => {
	const client = useQueryClient()
	const mutation: MutationFunction<void, { id: string; read: boolean }> = ({ id, read }) =>
		markNotificationRead(id, { read })
	return useMutation({
		mutationFn: mutation,
		onSuccess: () => {
			client.invalidateQueries({ queryKey: notificationFeedQueryKey })
		},
	})
}

export const useMarkAllNotificationsRead = (): UseMutationResult<void, Error, void> => {
	const client = useQueryClient()
	return useMutation({
		mutationFn: () => markAllNotificationsRead(),
		onSuccess: () => {
			client.invalidateQueries({ queryKey: notificationFeedQueryKey })
		},
	})
}

export const useCreateDebugNotification = () => {
	const client = useQueryClient()
	return useMutation({
		mutationFn: createDebugNotification,
		onSuccess: () => {
			client.invalidateQueries({ queryKey: notificationFeedQueryKey })
		},
	})
}

export const useNotificationPreferences = (
	enabled: boolean = true
): UseQueryResult<NotificationPreferences> =>
	useQuery({
		queryKey: notificationPreferencesQueryKey,
		queryFn: async () => mapPreferences(await fetchNotificationPreferences()),
		enabled,
		staleTime: 60_000,
	})

export const useUpdateNotificationPreferences = (): UseMutationResult<
	NotificationPreferences,
	Error,
	NotificationPreferenceUpdatePayload
> => {
	const client = useQueryClient()
	return useMutation({
		mutationFn: async (payload) => mapPreferences(await updateNotificationPreferences(payload)),
		onSuccess: (data) => {
			client.setQueryData(notificationPreferencesQueryKey, data)
			client.invalidateQueries({ queryKey: notificationFeedQueryKey })
		},
	})
}

export type PushSubscriptionStatus = 'idle' | 'unsupported' | 'prompt' | 'subscribed' | 'denied' | 'error'

export type PushSubscriptionResult = {
	ok: boolean
	result?: PushSubscriptionResponse
	error?: string
	reason?: 'disabled' | 'unsupported' | 'permission' | 'missing-key' | 'error'
}

export const usePushSubscription = () => {
	const { config } = useAppConfig()
	const client = useQueryClient()
	const webPushEnabled = Boolean(config?.notifications?.webPush)
	const endpointOverride = config?.notifications?.subscriptionEndpoint
	const publicKey = config?.notifications?.publicKey

	const supported = useMemo(() => webPushEnabled && hasPushSupport(), [webPushEnabled])
	const [status, setStatus] = useState<PushSubscriptionStatus>(() => {
		if (!webPushEnabled) return 'idle'
		return hasPushSupport() ? 'prompt' : 'unsupported'
	})
	const [error, setError] = useState<string | null>(null)
	const [response, setResponse] = useState<PushSubscriptionResponse | null>(null)

	useEffect(() => {
		if (!webPushEnabled) {
			setStatus('idle')
			return
		}
		if (!hasPushSupport()) {
			setStatus('unsupported')
			return
		}

		let cancelled = false
		;(async () => {
			try {
				const registration = await navigator.serviceWorker.ready
				const subscription = await registration.pushManager.getSubscription()
				if (cancelled) return
				if (subscription) {
					setStatus('subscribed')
				} else {
					const permission = typeof Notification !== 'undefined' ? Notification.permission : 'default'
					if (permission === 'denied') {
						setStatus('denied')
					} else {
						setStatus('prompt')
					}
				}
			} catch {
				if (!cancelled) setStatus('unsupported')
			}
		})()

		return () => {
			cancelled = true
		}
	}, [webPushEnabled])

	const subscribe = useCallback(async (): Promise<PushSubscriptionResult> => {
		setError(null)
		setResponse(null)
		if (!webPushEnabled) {
			return { ok: false, reason: 'disabled' }
		}
		if (!hasPushSupport()) {
			setStatus('unsupported')
			return { ok: false, reason: 'unsupported' }
		}
		if (!publicKey) {
			const message = 'Missing VAPID public key. Set notifications.publicKey in app.config.json.'
			setError(message)
			setStatus('error')
			return { ok: false, reason: 'missing-key', error: message }
		}

		try {
			const registration = await navigator.serviceWorker.ready
			let permission: NotificationPermission =
				typeof Notification !== 'undefined' ? Notification.permission : 'default'

			if (permission !== 'granted') {
				const request = Notification.requestPermission ? await Notification.requestPermission() : permission
				permission = request ?? permission
			}

			if (permission !== 'granted') {
				setStatus(permission === 'denied' ? 'denied' : 'prompt')
				return { ok: false, reason: 'permission' }
			}

			let subscription = await registration.pushManager.getSubscription()
			if (!subscription) {
				const applicationServerKey = urlBase64ToUint8Array(publicKey)
				subscription = await registration.pushManager.subscribe({
					userVisibleOnly: true,
					applicationServerKey: applicationServerKey as unknown as BufferSource,
				})
			}

			const payload = subscription.toJSON() as PushSubscriptionRequest
			const result = mapPushSubscriptionResponse(
				await registerPushSubscription(payload, endpointOverride)
			)
			setResponse(result)
			setStatus('subscribed')
			await client.invalidateQueries({ queryKey: notificationPreferencesQueryKey })
			return { ok: true, result }
		} catch (err) {
			const message = err instanceof Error ? err.message : 'Failed to enable push notifications'
			setError(message)
			setStatus('error')
			return { ok: false, reason: 'error', error: message }
		}
	}, [client, endpointOverride, publicKey, webPushEnabled])

	const unsubscribe = useCallback(async (): Promise<PushSubscriptionResult> => {
		setError(null)
		if (!webPushEnabled || !hasPushSupport()) {
			return { ok: false, reason: 'unsupported' }
		}
		try {
			const registration = await navigator.serviceWorker.ready
			const subscription = await registration.pushManager.getSubscription()
			if (subscription) {
				await subscription.unsubscribe()
			}
			await removePushSubscription(endpointOverride)
			setStatus('prompt')
			setResponse(null)
			await client.invalidateQueries({ queryKey: notificationPreferencesQueryKey })
			return { ok: true }
		} catch (err) {
			const message = err instanceof Error ? err.message : 'Failed to disable push notifications'
			setError(message)
			setStatus('error')
			return { ok: false, reason: 'error', error: message }
		}
	}, [client, endpointOverride, webPushEnabled])

	return {
		status,
		error,
		response,
		supported,
		webPushEnabled,
		subscribe,
		unsubscribe,
	}
}

export const getPreferenceEnabled = (
	preferences: NotificationPreferences | undefined,
	channel: NotificationChannel
): boolean => {
	if (!preferences) return channel !== 'webPush' // default to enabled for in-app/email, disabled for push
	return preferences.preferences.find((pref) => pref.channel === channel)?.enabled ?? false
}
