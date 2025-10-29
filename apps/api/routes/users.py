from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import Response

from ..auth.deps import auth_required, require_roles
from ..auth.models import AuthClaims
from ..schemas.user import (
    UserListResponse,
    UserProfile,
    UserProfileCreate,
    UserProfileUpdate,
)
from ..services import user_service
from ..services.user_service import UserNotFoundError, handle_service_error

router = APIRouter()


@router.get("/", response_model=UserListResponse)
async def list_users(
    limit: int = Query(25, ge=1, le=100, description="Number of users to return (max 100)"),
    cursor: str | None = Query(None, description="Document ID to resume pagination from"),
    claims: AuthClaims = Depends(auth_required),
):
    """Admins get full list; everyone else receives their own profile in a list."""
    is_admin = any(role.lower() == "admin" for role in (claims.roles or []))
    if not is_admin:
        profile = await user_service.get_user_by_id(claims.sub)
        return UserListResponse(items=[profile] if profile else [], next_cursor=None)

    items, next_cursor = await user_service.list_users(limit=limit, cursor=cursor)
    return UserListResponse(items=items, next_cursor=next_cursor)


@router.get("/{user_id}", response_model=UserProfile)
async def get_user(user_id: str, claims: AuthClaims = Depends(auth_required)):
    # Allow admins to fetch any user; everyone else can only fetch their own profile
    is_admin = any(role.lower() == "admin" for role in (claims.roles or []))
    if claims.sub != user_id and not is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")

    user = await user_service.get_user_by_id(user_id)
    if not user:
        handle_service_error(UserNotFoundError(user_id))
    return user


@router.post(
    "/",
    response_model=UserProfile,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_roles("admin"))],
)
async def create_user(payload: UserProfileCreate):
    try:
        return await user_service.create_user(payload)
    except Exception as exc:  # noqa: BLE001
        handle_service_error(exc)
        raise  # Unreachable, kept for type checkers


@router.patch(
    "/{user_id}",
    response_model=UserProfile,
    dependencies=[Depends(require_roles("admin"))],
)
async def update_user(user_id: str, payload: UserProfileUpdate):
    try:
        return await user_service.update_user(user_id, payload)
    except Exception as exc:  # noqa: BLE001
        handle_service_error(exc)
        raise  # Unreachable, kept for type checkers


@router.delete(
    "/{user_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(require_roles("admin"))],
)
async def delete_user(user_id: str):
    try:
        await user_service.delete_user(user_id)
    except Exception as exc:  # noqa: BLE001
        handle_service_error(exc)
        raise  # Unreachable, kept for type checkers
    return Response(status_code=status.HTTP_204_NO_CONTENT)
