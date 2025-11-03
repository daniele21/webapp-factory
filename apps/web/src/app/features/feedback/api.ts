import { api } from '@/app/lib/api'
import type { FeedbackPayload, FeedbackResponse } from './types'

export const submitFeedback = async (payload: FeedbackPayload): Promise<FeedbackResponse> => {
	const { data } = await api.post<FeedbackResponse>('/feedback', payload)
	return data
}
