# User Management Template

This service scaffolds the persistence layer for user metadata so teams can plug in their own identity provider while keeping a consistent Firestore data model.

## Data Model

`users/{userId}` documents store:

| Field            | Type              | Notes |
| ---------------- | ----------------- | ----- |
| `email`          | string (lowercase) | Primary lookup key; always normalised. |
| `name`           | string            | Display name from IdP or profile edit. |
| `picture`        | string (URL)      | Avatar URL. |
| `roles`          | array[string]     | Authorisation roles (e.g. `admin`, `member`). |
| `plan`           | string            | Subscription plan identifier. |
| `credits`        | integer           | Usage or billing credits (defaults to `0`). |
| `metadata`       | map               | Arbitrary JSON-safe attributes. |
| `hd`             | string            | Google Workspace domain (optional). |
| `created_at`     | timestamp         | Set on first write. |
| `updated_at`     | timestamp         | Updated on every write. |
| `last_login_at`  | timestamp         | Timestamp of the most recent login. |

Collection name defaults to `users` and can be overridden via `database.firestore.collections.users` in `config.development.json` (and friends) if you want namespacing.

## Repository Layer

`apps/api/repositories/user_repository.py` exposes a Firestore-backed repository with:

- `get(user_id)` / `get_by_email(email)` lookups
- `upsert(user_id, payload)` create-or-update with automatic timestamp management
- `list(limit, cursor)` simple cursor-based pagination
- `delete(user_id)` document removal

The repository is synchronous under the hood but uses `anyio.to_thread.run_sync` so endpoints remain non-blocking. It reuses a cached Firestore client configured via the shared settings system (emulator support included).

## Service Layer

`apps/api/services/user_service.py` builds on the repository and surfaces high-level helpers:

- `create_user()` – strict create with conflict detection
- `upsert_user()` – idempotent create-or-update, designed for IdP callbacks
- `update_user()` – partial updates for admin consoles
- `list_users()` – paginated listing (returns `[UserProfile], next_cursor`)
- `delete_user()` – ensures existence before deleting
- `get_user_by_id()` / `get_user_by_email()`

The service returns Pydantic `UserProfile` models and translates errors into HTTP-friendly exceptions via `handle_service_error()`.

## API Endpoints

`apps/api/routes/users.py` demonstrates how to expose the service:

- `GET /users` (admin) – paginated list
- `GET /users/{user_id}` – self or admin access
- `POST /users` (admin) – create profile
- `PATCH /users/{user_id}` (admin) – partial updates
- `DELETE /users/{user_id}` (admin) – remove profile

All endpoints use shared auth dependencies (`require_roles`, `auth_required`) so they respect JWT claims produced by your auth provider.

### Sample Request

```http
POST /users
Content-Type: application/json
Authorization: Bearer <admin-token>

{
  "id": "auth0|123",
  "email": "founder@example.com",
  "name": "Founding User",
  "roles": ["admin"],
  "plan": "enterprise",
  "credits": 0,
  "metadata": { "team": "growth" }
}
```

### Sample Response

```json
{
  "id": "auth0|123",
  "email": "founder@example.com",
  "name": "Founding User",
  "roles": ["admin"],
  "plan": "enterprise",
  "credits": 0,
  "metadata": { "team": "growth" },
  "created_at": "2024-01-02T10:00:00+00:00",
  "updated_at": "2024-01-02T10:00:00+00:00",
  "last_login_at": "2024-01-02T10:00:00+00:00"
}
```

## Extending

- Add derived indexes in `infra/firebase/firestore.indexes.json` if you query on new fields.
- Swap the repository implementation if you need another database (e.g. Postgres) – keep the service interface and your routes stay untouched.
- Use feature flags (`packages/feature-flags`) to gate admin-only operations or graduated rollouts.

This template keeps the persistence concerns isolated while offering a ready-to-go Firestore implementation that you can customise per project.
