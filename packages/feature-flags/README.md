# Feature Flags Toolkit

This tiny package contains the shared feature guard helpers used by both the
frontend (`apps/web`) and backend (`apps/api`). It lets you toggle functionality
by plan or any other rule without scattering ad‑hoc checks across the codebase.

## Exposed API

```ts
import { allowed, Plan, FEATURES } from '@repo/feature-flags'
```

- `Plan` – canonical plan ids your product recognises.
- `FEATURES` – declarative map of feature keys → metadata (e.g. which plans can
  access them). Extend this object when you introduce new features.
- `allowed(plan, feature)` – runtime helper that returns `true` when the given
  plan is permitted to use the feature.

## Defining Features

Edit `index.ts` to add or adjust flags:

```ts
export const FEATURES = {
  'dashboard.view': { plans: ['free', 'pro', 'enterprise'] },
  'reports.generate': { plans: ['pro', 'enterprise'] },
  'ai.assistant': { plans: ['enterprise'] },
} as const
```

You can also extend the metadata structure (for example, add `roles` or
`requiresBetaAccess`) – the helper is just plain TypeScript.

## Frontend Usage (`apps/web`)

1. Load the current plan from runtime config or the authenticated user:

```ts
import { allowed } from '@repo/feature-flags'
import { useAppConfig } from '@config/src/provider'
import { useAuth } from '@/app/providers/AuthProvider'

export function useFeatureGuard(key: keyof typeof FEATURES) {
  const { config } = useAppConfig()
  const { user } = useAuth()
  const plan = (user?.plan ?? config?.plan ?? 'free') as Plan
  return allowed(plan, key)
}
```

2. Guard UI affordances:

```tsx
const canGenerate = useFeatureGuard('reports.generate')
return canGenerate ? <GenerateReportButton /> : null
```

3. Gate navigation items or entire routes by checking `useFeatureGuard` before
   rendering them. Because the new `AppShell` funnels all top‑level navigation,
   you can hide links and tabs in one place.

## Backend Usage (`apps/api`)

The API already ships a Python feature-flag system in
`apps/api/config/features.py`. Keep the **feature keys** aligned with the ones
defined in this package so the UI and API speak the same language. When you add
or rename a key in `FEATURES`, mirror the change in the Python config and in the
route dependencies under `apps/api/auth/deps.py`.

_Tip_: many teams generate the TypeScript constants from the Python source (or
vice versa) during CI to avoid drift. For now the contract is “same key names in
both stacks.”

## Keeping Frontend & Backend in Sync

- Use the **same feature keys** in both stacks (`reports.generate`,
  `ai.assistant`, …).
- Update `packages/feature-flags/index.ts` whenever you add or rename a flag.
- If you expose runtime configuration (`app.config.json`), include a `features`
  section so the frontend can reflect server‑side toggles without redeploying.

## Next Steps

- Expand the metadata to cover roles, beta access, time windows, etc.
- Wrap the helpers in higher-level hooks/dependencies that match your domain
  (e.g. `useCanGenerateReports`, `require_feature('ai.assistant')`).
- Add automated tests around critical feature boundaries to avoid regressions.

With this shared toolkit in place, enabling or disabling functionality is a
single change that propagates across the entire product surface.*** End Patch
