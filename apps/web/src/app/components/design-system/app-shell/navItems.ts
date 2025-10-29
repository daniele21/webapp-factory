import type { ReactNode } from 'react'

export type AppShellNavItem = {
	label: string
	to: string
	icon?: ReactNode
	shortLabel?: string
}

export const DEFAULT_NAV_ITEMS: AppShellNavItem[] = [
	{ label: 'Dashboard', shortLabel: 'Home', icon: '🏠', to: '/dashboard' },
	{ label: 'Users', icon: '👤', to: '/users' },
	{ label: 'Billing', shortLabel: 'Bill', icon: '💳', to: '/billing' },
	{ label: 'Settings', shortLabel: 'Set', icon: '⚙️', to: '/settings' },
]

export default DEFAULT_NAV_ITEMS
