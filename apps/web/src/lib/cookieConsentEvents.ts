export type ConsentMap = Record<string, boolean>

export const COOKIE_CONSENT_CHANGED_EVENT = 'wf:cookie-consent-changed'
export const OPEN_COOKIE_PREFERENCES_EVENT = 'wf:cookie-preferences-open'

export function emitCookieConsentChange(consent: ConsentMap) {
	if (typeof window === 'undefined') return
	window.dispatchEvent(
		new CustomEvent<ConsentMap>(COOKIE_CONSENT_CHANGED_EVENT, { detail: consent }),
	)
}

export function requestCookiePreferences() {
	if (typeof window === 'undefined') return
	window.dispatchEvent(new Event(OPEN_COOKIE_PREFERENCES_EVENT))
}
