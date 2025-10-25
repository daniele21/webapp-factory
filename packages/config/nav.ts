export const NAV = [
  { to: '/', label: 'Home' },
  // the app maps '/home' to the dashboard page in routes.tsx
  { to: '/home', label: 'Dashboard', feature: 'dashboard.view' },
  { to: '/style-demo', label: 'Style Demo' },
  { to: '/legal/cookies', label: 'Cookie Policy' },
  { to: '/legal/terms', label: 'Terms' },
] as const
