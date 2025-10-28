from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional, Tuple

from fastapi import HTTPException, status

from ..repositories import get_user_repository
from ..schemas.user import UserProfile, UserProfileCreate, UserProfileUpdate


class UserAlreadyExistsError(ValueError):
    """Raised when attempting to create a user that already exists."""


class UserNotFoundError(ValueError):
    """Raised when a user cannot be found."""


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _to_profile(data: dict) -> UserProfile:
    def _parse(value):
        if value is None:
            return None
        if isinstance(value, datetime):
            return value
        if isinstance(value, str):
            try:
                return datetime.fromisoformat(value)
            except ValueError:
                return None
        return None

    return UserProfile(
        **{
            **data,
            "created_at": _parse(data.get("created_at")),
            "updated_at": _parse(data.get("updated_at")),
            "last_login_at": _parse(data.get("last_login_at")),
        }
    )


async def get_user_by_id(user_id: str) -> Optional[UserProfile]:
    repo = get_user_repository()
    record = await repo.get(user_id)
    return _to_profile(record) if record else None


async def get_user_by_email(email: str) -> Optional[UserProfile]:
    repo = get_user_repository()
    record = await repo.get_by_email(email)
    return _to_profile(record) if record else None


async def create_user(profile_in: UserProfileCreate) -> UserProfile:
    repo = get_user_repository()
    existing = await repo.get(profile_in.id)
    if existing:
        raise UserAlreadyExistsError(f"User {profile_in.id} already exists")

    payload = profile_in.model_dump(exclude_none=True)
    payload.setdefault("credits", 0)
    payload["last_login_at"] = payload.get("last_login_at") or _now()
    record = await repo.upsert(profile_in.id, payload)
    return _to_profile(record)


async def upsert_user(profile_in: UserProfileCreate, *, mark_login: bool = False) -> UserProfile:
    """Create or update a user profile. Set `mark_login` to refresh last_login_at."""
    repo = get_user_repository()
    payload = profile_in.model_dump(exclude_none=True)
    payload.setdefault("credits", 0)
    if mark_login:
        payload["last_login_at"] = _now()
    record = await repo.upsert(profile_in.id, payload)
    return _to_profile(record)


async def update_user(user_id: str, profile_update: UserProfileUpdate) -> UserProfile:
    repo = get_user_repository()
    existing = await repo.get(user_id)
    if not existing:
        raise UserNotFoundError(user_id)

    payload = profile_update.model_dump(exclude_none=True)
    record = await repo.upsert(user_id, payload)
    return _to_profile(record)


async def list_users(*, limit: int = 25, cursor: Optional[str] = None) -> Tuple[list[UserProfile], Optional[str]]:
    repo = get_user_repository()
    result = await repo.list(limit=limit, cursor=cursor)
    return [_to_profile(item) for item in result.items], result.next_cursor


async def delete_user(user_id: str) -> None:
    repo = get_user_repository()
    existing = await repo.get(user_id)
    if not existing:
        raise UserNotFoundError(user_id)
    await repo.delete(user_id)


def handle_service_error(exc: Exception) -> None:
    """Translate service-layer exceptions into HTTP errors."""
    if isinstance(exc, UserAlreadyExistsError):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc),
        ) from exc
    if isinstance(exc, UserNotFoundError):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User '{exc.args[0]}' not found",
        ) from exc
    raise exc
