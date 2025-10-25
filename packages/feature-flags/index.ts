export type Plan = 'free' | 'pro' | 'enterprise'
export const FEATURES = {
  'dashboard.view': { plans: ['free','pro','enterprise'] },
  'reports.generate': { plans: ['pro','enterprise'] }
} as const
export function allowed(plan: Plan, feature: keyof typeof FEATURES) {
  return FEATURES[feature].plans.includes(plan)
}
