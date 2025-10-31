from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status

from ..auth.deps import auth_required
from ..auth.models import AuthClaims
from ..schemas.notification import (
    NotificationFeedResponse,
    NotificationMarkRequest,
    NotificationPreferenceUpdate,
    NotificationPreferencesResponse,
    PushSubscriptionCreate,
    PushSubscriptionResponse,
    NotificationCreate,
    NotificationItem,
)
from ..services.notification_service import (
    NotificationNotFoundError,
    get_notification_preferences,
    list_notifications,
    mark_all_notifications_read,
    mark_notification,
    register_push_subscription,
    remove_push_subscription,
    update_notification_preferences,
    create_notification,
)

router = APIRouter(prefix="/notifications", tags=["notifications"])


def _tenant_id(claims: AuthClaims) -> str | None:
    return getattr(claims, "orgId", None)


@router.get("/feed", response_model=NotificationFeedResponse)
async def notification_feed(claims: AuthClaims = Depends(auth_required)) -> NotificationFeedResponse:
    return await list_notifications(claims.sub, _tenant_id(claims))


@router.post(
    "/{notification_id}/read",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def set_notification_read(
    notification_id: str,
    payload: NotificationMarkRequest,
    claims: AuthClaims = Depends(auth_required),
) -> Response:
    try:
        await mark_notification(claims.sub, notification_id, payload, _tenant_id(claims))
    except NotificationNotFoundError as exc:  # pragma: no cover - simple guard
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/mark-all-read", status_code=status.HTTP_204_NO_CONTENT)
async def mark_all_read(claims: AuthClaims = Depends(auth_required)) -> Response:
    await mark_all_notifications_read(claims.sub, _tenant_id(claims))
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/preferences", response_model=NotificationPreferencesResponse)
async def notification_preferences(
    claims: AuthClaims = Depends(auth_required),
) -> NotificationPreferencesResponse:
    return await get_notification_preferences(claims.sub, _tenant_id(claims))


@router.put("/preferences", response_model=NotificationPreferencesResponse)
async def update_preferences_endpoint(
    payload: NotificationPreferenceUpdate,
    claims: AuthClaims = Depends(auth_required),
) -> NotificationPreferencesResponse:
    return await update_notification_preferences(claims.sub, _tenant_id(claims), payload)


@router.post(
    "/subscriptions",
    status_code=status.HTTP_201_CREATED,
    response_model=PushSubscriptionResponse,
)
async def register_subscription(
    payload: PushSubscriptionCreate,
    request: Request,
    claims: AuthClaims = Depends(auth_required),
) -> PushSubscriptionResponse:
    data = payload
    if payload.user_agent is None:
        data = payload.model_copy(update={"user_agent": request.headers.get("user-agent")})
    return await register_push_subscription(claims.sub, _tenant_id(claims), data)


@router.delete("/subscriptions", status_code=status.HTTP_204_NO_CONTENT)
async def delete_subscription(claims: AuthClaims = Depends(auth_required)) -> Response:
    await remove_push_subscription(claims.sub, _tenant_id(claims))
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post(
    "/debug",
    status_code=status.HTTP_201_CREATED,
    response_model=NotificationItem,
)
async def create_debug_notification(
    payload: NotificationCreate,
    claims: AuthClaims = Depends(auth_required),
) -> NotificationItem:
    return await create_notification(claims.sub, _tenant_id(claims), payload)
