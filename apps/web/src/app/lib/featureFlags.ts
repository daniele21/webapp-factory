export const features = {
  'dashboard.view': { enabled: true, plans: ['free','pro','enterprise'] },
  'reports.generate': { enabled: false, plans: ['pro','enterprise'] }
} as const
