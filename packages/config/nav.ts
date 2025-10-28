export const NAV = [
  { to: '/', label: 'Home' },
  // the app maps '/home' to the dashboard page in routes.tsx
  { to: '/home', label: 'Dashboard', feature: 'dashboard.view' },
  { to: '/ui-library', label: 'UI Kit' },
  { to: '/legal/cookies', label: 'Cookie Policy' },
  { to: '/legal/terms', label: 'Terms' },
] as const

export type RawNavItem = {
  id?: string
  label: string
  to: string
  icon?: string
  external?: boolean
  roles?: string[]
  plans?: string[]
}

// Accept either a single `role` string or an array `roles` to support richer auth
type User = { role?: string; roles?: string[]; plan?: string } | null

export function getVisibleNav(cfg: { navigation?: RawNavItem[] } | null | undefined, user: User) {
  const list = cfg?.navigation ?? (NAV as unknown as RawNavItem[])
  return list.filter((item) => {
    // role check: if item has no role restrictions it's visible; otherwise
    // allow match if user's single role or any of user's roles intersects
    const roleOk = !item.roles?.length || (
      (user?.role && item.roles.includes(user.role)) ||
      (user?.roles && user.roles.some((r) => item.roles!.includes(r)))
    )
    const planOk = !item.plans?.length || (user?.plan && item.plans.includes(user.plan))
    return roleOk && planOk
  })
}
