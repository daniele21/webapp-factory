Auth feature

This folder contains a small demo for authenticating against the API's Google OAuth endpoints:

- `authService.ts` — helpers to start Google login, fetch `/api/me`, and `/api/logout`.
- `AuthDemo.tsx` — demo page exposing a "Sign in with Google" button and a `/me` inspector.
- `LoginForm.tsx`, `RegisterForm.tsx` — small form stubs using the factory form primitives (not wired to backend password auth).

Usage:
- Visit `/auth` in the frontend to view the demo. The demo will call `/api/google/login` to obtain the provider URL and redirect the browser to it. The backend is expected to set the session cookie on the callback endpoint.
