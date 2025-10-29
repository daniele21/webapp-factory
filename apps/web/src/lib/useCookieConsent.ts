import { useEffect, useRef, useState } from 'react'
import {
	COOKIE_CONSENT_CHANGED_EVENT,
	emitCookieConsentChange,
	type ConsentMap,
} from './cookieConsentEvents'

const COOKIE_NAME = 'wf_cookie_consent'
const COOKIE_TTL_DAYS = 365

function readCookie(): ConsentMap | null {
	if (typeof document === 'undefined') return null
	const target = (document.cookie || '')
		.split('; ')
		.find((entry) => entry.startsWith(`${COOKIE_NAME}=`))
	if (!target) return null
	try {
		return JSON.parse(decodeURIComponent(target.split('=')[1]))
	} catch {
		return null
	}
}

function writeCookie(data: ConsentMap) {
	if (typeof document === 'undefined') return
	const expires = new Date(Date.now() + COOKIE_TTL_DAYS * 24 * 60 * 60 * 1000).toUTCString()
	const secure = typeof window !== 'undefined' && window.location.protocol === 'https:' ? '; Secure' : ''
	const payload = encodeURIComponent(JSON.stringify(data))
	document.cookie = `${COOKIE_NAME}=${payload}; path=/; SameSite=Lax${secure}; expires=${expires}`
}

function mergeWithDefaults(initialCategories: string[]): ConsentMap {
	const base: ConsentMap = { necessary: true }
	initialCategories.forEach((id) => {
		if (id !== 'necessary') base[id] = true
	})
	return base
}

function isDifferent(a: ConsentMap, b: ConsentMap) {
	const keys = new Set([...Object.keys(a), ...Object.keys(b)])
	for (const key of keys) {
		if (Boolean(a[key]) !== Boolean(b[key])) return true
	}
	return false
}

type SetStateAction<S> = S | ((prev: S) => S)

export function useCookieConsent(initialCategories: string[] = []) {
	const initialFromCookie = readCookie()
	const [consent, setConsentState] = useState<ConsentMap>(() => {
		if (initialFromCookie) return initialFromCookie
		return mergeWithDefaults(initialCategories)
	})
	const consentRef = useRef(consent)
	const shouldPersistRef = useRef(Boolean(initialFromCookie))

	useEffect(() => {
		if (typeof window === 'undefined') return
		const handler = (event: Event) => {
			const detail = (event as CustomEvent<ConsentMap>).detail
			if (!detail) return
			if (!isDifferent(consentRef.current, detail)) return
			consentRef.current = detail
			setConsentState(detail)
		}
		window.addEventListener(COOKIE_CONSENT_CHANGED_EVENT, handler as EventListener)
		return () => {
			window.removeEventListener(COOKIE_CONSENT_CHANGED_EVENT, handler as EventListener)
		}
	}, [])

	useEffect(() => {
		consentRef.current = consent
		if (!shouldPersistRef.current) return
		writeCookie(consent)
		emitCookieConsentChange(consent)
	}, [consent])

	const persistAndSet = (updater: SetStateAction<ConsentMap>) => {
		shouldPersistRef.current = true
		setConsentState((prev) => {
			const next = typeof updater === 'function' ? (updater as (p: ConsentMap) => ConsentMap)(prev) : updater
			return next
		})
	}

	const acceptAll = (categories: string[]) => {
		const updated: ConsentMap = {}
		categories.forEach((category) => {
			updated[category] = true
		})
		persistAndSet(updated)
	}

	const rejectAll = (categories: string[]) => {
		const updated: ConsentMap = {}
		categories.forEach((category) => {
			updated[category] = category === 'necessary'
		})
		persistAndSet(updated)
	}

	const update = (category: string, value: boolean) => {
		persistAndSet((prev) => ({
			...prev,
			[category]: value,
		}))
	}

	return {
		consent,
		setConsent: persistAndSet,
		acceptAll,
		rejectAll,
		update,
	}
}
