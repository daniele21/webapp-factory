import { api } from '@/app/lib/api'
import type {
	NotificationFeedDTO,
	NotificationMarkRequest,
	NotificationPreferenceUpdatePayload,
	NotificationPreferencesDTO,
	PushSubscriptionRequest,
	PushSubscriptionResponseDTO,
  NotificationCreatePayload,
} from './types'

const BASE_PATH = '/notifications'

export const fetchNotificationFeed = async (): Promise<NotificationFeedDTO> => {
	const { data } = await api.get<NotificationFeedDTO>(`${BASE_PATH}/feed`)
	return data
}

export const markNotificationRead = async (id: string, payload: NotificationMarkRequest): Promise<void> => {
	await api.post(`${BASE_PATH}/${id}/read`, payload)
}

export const markAllNotificationsRead = async (): Promise<void> => {
	await api.post(`${BASE_PATH}/mark-all-read`, {})
}

export const fetchNotificationPreferences = async (): Promise<NotificationPreferencesDTO> => {
	const { data } = await api.get<NotificationPreferencesDTO>(`${BASE_PATH}/preferences`)
	return data
}

export const updateNotificationPreferences = async (
	payload: NotificationPreferenceUpdatePayload
): Promise<NotificationPreferencesDTO> => {
	const { data } = await api.put<NotificationPreferencesDTO>(`${BASE_PATH}/preferences`, payload)
	return data
}

export const registerPushSubscription = async (
	payload: PushSubscriptionRequest,
	target: string | undefined = undefined
): Promise<PushSubscriptionResponseDTO> => {
	const url = target ?? `${BASE_PATH}/subscriptions`
	const { data } = await api.post<PushSubscriptionResponseDTO>(url, payload)
	return data
}

export const removePushSubscription = async (target: string | undefined = undefined): Promise<void> => {
	const url = target ?? `${BASE_PATH}/subscriptions`
	await api.delete(url)
}

export const createDebugNotification = async (payload: NotificationCreatePayload) => {
	const { title, body, category = 'debug', actionUrl } = payload
	const { data } = await api.post(`${BASE_PATH}/debug`, {
		title,
		body,
		category,
		action_url: actionUrl,
	})
	return data
}
