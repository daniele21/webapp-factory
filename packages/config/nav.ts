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

type User = { role?: string; plan?: string } | null

export function getVisibleNav(cfg: { navigation?: RawNavItem[] } | null | undefined, user: User) {
  const list = cfg?.navigation ?? (NAV as unknown as RawNavItem[])
  return list.filter((item) => {
    const roleOk = !item.roles?.length || (user?.role && item.roles.includes(user.role))
    const planOk = !item.plans?.length || (user?.plan && item.plans.includes(user.plan))
    return roleOk && planOk
  })
}
