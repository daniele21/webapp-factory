# Webapp Factory Template

Monorepo starter for building SaaS-style products with a **React + Vite** frontend and a **FastAPI** backend. The repository is optimised for reuse: configuration is driven by JSON and shared packages, UI primitives live in a design-system component library, and infrastructure scripts live alongside the code you ship.

## Requirements

- Node.js 18+ and pnpm 9 (`corepack enable`)
- Python 3.11+
- Google OAuth credentials if you want the demo auth flow to work
- (Optional) Docker for running emulators or production parity services

## Quick Start

```bash
pnpm install          # install workspace dependencies
pnpm dev              # run web + api together via Turborepo
```

The default ports are 5173 (web) and 8080 (api). You can run individual apps:

```bash
pnpm dev:web          # frontend only (Vite)
pnpm dev:api          # backend only (uvicorn)
```

## Runtime Configuration

- Frontend runtime settings live in `apps/web/public/app.config.json`. This file drives navigation, layout toggles, theming tokens, and component options such as the auth menu.
- Type-safe access is provided by `AppConfigProvider` from `@config/src/provider`. Wrap your app once (already done in `apps/web/src/main.tsx`) and call `useAppConfig()` inside components.
- Updating the JSON file does **not** require a rebuild; the provider fetches it on load and falls back to a sane default when parsing fails.

## Frontend (apps/web)

- `src/app/components/design-system` is the reusable UI library. Every feature or page should compose these primitives rather than hand-rolling markup.
- Layout helpers: `Page`, `Header`, `SidebarNav`, `BottomTabs`.
- Controls: `Button`, `AuthMenu`, `OAuthButton`, form fields, modals, overlays.
- Features belong in `src/app/features/<domain>` and must ship their own README plus configurable defaults where applicable.
- Global theme state is managed by `ThemeProvider`, while runtime tokens (colours, radius, chart palettes) are applied by `AppConfigProvider`.
- Example routes: `Home`, `Dashboard`, `StyleDemo`, and `features/auth/AuthDemo` demonstrate how to wire pages with design-system components.

Useful scripts:

- `pnpm lint` – run ESLint across the workspace.
- `pnpm test --filter web...` – run frontend tests (set up to use Vitest when added).
- `pnpm build --filter web` – production build.

## Backend (apps/api)

- FastAPI entry point: `apps/api/main.py`.
- Configuration system lives under `apps/api/config/` with environment-specific defaults plus JSON loaders (`config.development.json` etc).
- Authentication helpers (Google OAuth popup flow) sit in `services/google_oauth_service.py`; routes registered in `routes/google_auth.py`.
- Firestore-backed user management template lives in `repositories/user_repository.py` + `services/user_service.py` with docs at `apps/api/docs/USER_MANAGEMENT.md`.
- Middleware: logging, security headers, request ID.
- Tests: `apps/api/tests` uses pytest. Run with `pnpm test --filter api...` or `poetry run pytest` if working inside the app.

Common commands:

```bash
cd apps/api
poetry install         # or pip install -r requirements if you prefer
poetry run pytest
poetry run uvicorn apps.api.main:app --reload
```

## Shared Packages

- `packages/config` – typed schema + provider for `app.config.json`. Consumable by any frontend app through `@config`.
- `packages/feature-flags` – tiny helper around plan-based gating.

When you need functionality across apps, prefer creating a package here rather than duplicating code.

## Development Workflow

- Everything is orchestrated by Turborepo (`turbo.json`). Scripts declared in the root `package.json` run across workspaces.
- Use `pnpm dev` during feature work to run both stacks and keep them hot reloading.
- Keep documentation nearby. Each feature should have a local README and, if configuration is required, a config file with sensible defaults.
- Align UI changes with the design-system library. If you need a component variant, extend the design-system collection instead of bypassing it.

## Next Steps

1. Replace branding, navigation, and auth providers inside `app.config.json`.
2. Flesh out domain features under `apps/web/src/app/features` and back them with FastAPI routes.
3. Wire CI/CD by replicating or extending the workflows in `infra/github/workflows`.
4. Add monitoring, logging sinks, and feature flags by configuring the respective sections under `apps/api/config`.

This template is intentionally opinionated so you can copy, adapt, and build production-ready web applications quickly. Stay within the shared patterns and your future clones will cost you minutes instead of days.
