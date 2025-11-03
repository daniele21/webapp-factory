import { useMutation } from '@tanstack/react-query'
import { submitFeedback } from './api'
import type { FeedbackPayload, FeedbackResponse } from './types'

export const useSubmitFeedback = () =>
	useMutation<FeedbackResponse, Error, FeedbackPayload>({
		mutationFn: submitFeedback,
	})
