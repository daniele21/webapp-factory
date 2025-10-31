export type NotificationChannel = 'inApp' | 'webPush' | 'email'
export type NotificationDeliveryStatus = 'pending' | 'delivered' | 'disabled' | 'fallback' | 'unsubscribed'

export type NotificationDeliveryDTO = {
	channel: NotificationChannel
	status: NotificationDeliveryStatus
	detail?: string | null
	updated_at?: string | null
}

export type NotificationDTO = {
	id: string
	tenant_id?: string | null
	title: string
	body: string
	category: string
	created_at: string
	read: boolean
	read_at?: string | null
	action_url?: string | null
	deliveries: NotificationDeliveryDTO[]
}

export type NotificationFeedDTO = {
	items: NotificationDTO[]
	unread_count: number
	last_sync_at: string
}

export type NotificationPreferenceDTO = {
	channel: NotificationChannel
	enabled: boolean
	updated_at: string
}

export type NotificationPreferencesDTO = {
	preferences: NotificationPreferenceDTO[]
	fallback_channel?: NotificationChannel | null
	updated_at: string
}

export type NotificationPreferenceUpdatePayload = {
	preferences: Array<{ channel: NotificationChannel; enabled: boolean }>
}

export type NotificationCreatePayload = {
	title: string
	body: string
	category?: string
	actionUrl?: string
}

export type NotificationMarkRequest = {
	read: boolean
}

export type PushSubscriptionRequest = {
	endpoint: string
	expirationTime?: number | null
	keys: { p256dh: string; auth: string }
}

export type PushSubscriptionResponseDTO = {
	status: 'registered'
	registered_at: string
	web_push_enabled: boolean
	email_fallback_enabled: boolean
}

export type NotificationDelivery = {
	channel: NotificationChannel
	status: NotificationDeliveryStatus
	detail?: string | null
	updatedAt?: string | null
}

export type Notification = {
	id: string
	tenantId?: string | null
	title: string
	body: string
	category: string
	createdAt: string
	read: boolean
	readAt?: string | null
	actionUrl?: string | null
	deliveries: NotificationDelivery[]
}

export type NotificationFeed = {
	items: Notification[]
	unreadCount: number
	lastSyncAt: string
}

export type NotificationPreference = {
	channel: NotificationChannel
	enabled: boolean
	updatedAt: string
}

export type NotificationPreferences = {
	preferences: NotificationPreference[]
	fallbackChannel?: NotificationChannel | null
	updatedAt: string
}

export type PushSubscriptionResponse = {
	status: 'registered'
	registeredAt: string
	webPushEnabled: boolean
	emailFallbackEnabled: boolean
}

const mapDelivery = (dto: NotificationDeliveryDTO): NotificationDelivery => ({
	channel: dto.channel,
	status: dto.status,
	detail: dto.detail ?? null,
	updatedAt: dto.updated_at ?? null,
})

export const mapNotification = (dto: NotificationDTO): Notification => ({
	id: dto.id,
	tenantId: dto.tenant_id ?? null,
	title: dto.title,
	body: dto.body,
	category: dto.category,
	createdAt: dto.created_at,
	read: dto.read,
	readAt: dto.read_at ?? null,
	actionUrl: dto.action_url ?? null,
	deliveries: Array.isArray(dto.deliveries) ? dto.deliveries.map(mapDelivery) : [],
})

export const mapNotificationFeed = (dto: NotificationFeedDTO): NotificationFeed => ({
	items: dto.items.map(mapNotification),
	unreadCount: dto.unread_count,
	lastSyncAt: dto.last_sync_at,
})

export const mapPreferences = (dto: NotificationPreferencesDTO): NotificationPreferences => ({
	preferences: dto.preferences.map((pref) => ({
		channel: pref.channel,
		enabled: pref.enabled,
		updatedAt: pref.updated_at,
	})),
	fallbackChannel: dto.fallback_channel ?? null,
	updatedAt: dto.updated_at,
})

export const mapPushSubscriptionResponse = (dto: PushSubscriptionResponseDTO): PushSubscriptionResponse => ({
	status: dto.status,
	registeredAt: dto.registered_at,
	webPushEnabled: dto.web_push_enabled,
	emailFallbackEnabled: dto.email_fallback_enabled,
})
