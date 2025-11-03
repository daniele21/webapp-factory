export type FeedbackPayload = {
	name?: string
	email?: string
	message: string
	page_url?: string
	user_agent?: string
	metadata?: Record<string, unknown>
}

export type FeedbackResponse = {
	status: 'accepted'
}
