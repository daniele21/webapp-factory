export const NAV = [
  { to: '/', label: 'Home' },
  // the app maps '/home' to the dashboard page in routes.tsx
  { to: '/home', label: 'Dashboard', feature: 'dashboard.view' },
  { to: '/ui-library', label: 'UI Kit' },
  { to: '/legal/cookies', label: 'Cookie Policy' },
  { to: '/legal/terms', label: 'Terms' },
] as const
