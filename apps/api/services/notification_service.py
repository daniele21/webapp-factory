from __future__ import annotations

import asyncio
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional
from uuid import uuid4

from ..schemas.notification import (
    NotificationFeedResponse,
    NotificationItem,
    NotificationMarkRequest,
    NotificationPreference,
    NotificationPreferenceUpdate,
    NotificationPreferencesResponse,
    PushSubscriptionCreate,
    PushSubscriptionResponse,
    NotificationCreate,
)


NotificationKey = str


def _now() -> datetime:
    return datetime.now(timezone.utc)


DEFAULT_PREFERENCES: Dict[str, Any] = {
    "inApp": True,
    "webPush": False,
    "email": True,
}


class NotificationNotFoundError(LookupError):
    """Raised when a notification cannot be found for the user."""


class NotificationService:
    """In-memory notification service with basic delivery state tracking."""

    def __init__(self) -> None:
        self._lock = asyncio.Lock()
        self._notifications: Dict[NotificationKey, List[Dict[str, Any]]] = {}
        self._preferences: Dict[NotificationKey, Dict[str, Any]] = {}
        self._subscriptions: Dict[NotificationKey, Dict[str, Any]] = {}

    async def list_notifications(self, user_id: str, tenant_id: Optional[str]) -> NotificationFeedResponse:
        key = self._key(user_id, tenant_id)
        async with self._lock:
            records = self._notifications.get(key)
            if records is None:
                records = self._seed_notifications(user_id, tenant_id)
                self._notifications[key] = records

            prefs = self._ensure_preferences(key)
            has_subscription = key in self._subscriptions
            for record in records:
                self._apply_delivery_states(record, prefs, has_subscription)

            items = [
                NotificationItem(**record)
                for record in sorted(records, key=lambda rec: rec["created_at"], reverse=True)
            ]
            unread = sum(1 for record in records if not record["read"])

        return NotificationFeedResponse(items=items, unread_count=unread, last_sync_at=_now())

    async def set_read_state(
        self,
        user_id: str,
        notification_id: str,
        payload: NotificationMarkRequest,
        tenant_id: Optional[str],
    ) -> None:
        key = self._key(user_id, tenant_id)
        async with self._lock:
            records = self._notifications.get(key)
            if not records:
                raise NotificationNotFoundError(notification_id)

            for record in records:
                if record["id"] == notification_id:
                    record["read"] = payload.read
                    record["read_at"] = _now() if payload.read else None
                    prefs = self._ensure_preferences(key)
                    has_subscription = key in self._subscriptions
                    self._apply_delivery_states(record, prefs, has_subscription)
                    break
            else:
                raise NotificationNotFoundError(notification_id)

    async def mark_all_read(self, user_id: str, tenant_id: Optional[str]) -> None:
        key = self._key(user_id, tenant_id)
        async with self._lock:
            records = self._notifications.get(key)
            if not records:
                return
            for record in records:
                record["read"] = True
                record["read_at"] = _now()
            prefs = self._ensure_preferences(key)
            has_subscription = key in self._subscriptions
            for record in records:
                self._apply_delivery_states(record, prefs, has_subscription)

    async def get_preferences(
        self, user_id: str, tenant_id: Optional[str]
    ) -> NotificationPreferencesResponse:
        key = self._key(user_id, tenant_id)
        async with self._lock:
            prefs = self._ensure_preferences(key)
            updated_at: datetime = prefs.get("_updated_at", _now())
            response = NotificationPreferencesResponse(
                preferences=[
                    NotificationPreference(
                        channel="inApp",
                        enabled=bool(prefs.get("inApp", True)),
                        updated_at=updated_at,
                    ),
                    NotificationPreference(
                        channel="webPush",
                        enabled=bool(prefs.get("webPush", False)),
                        updated_at=updated_at,
                    ),
                    NotificationPreference(
                        channel="email",
                        enabled=bool(prefs.get("email", True)),
                        updated_at=updated_at,
                    ),
                ],
                fallback_channel="email" if prefs.get("email", True) else None,
                updated_at=updated_at,
            )
        return response

    async def update_preferences(
        self,
        user_id: str,
        tenant_id: Optional[str],
        payload: NotificationPreferenceUpdate,
    ) -> NotificationPreferencesResponse:
        key = self._key(user_id, tenant_id)
        async with self._lock:
            prefs = self._ensure_preferences(key)
            updated_at = _now()
            for pref in payload.preferences:
                prefs[pref.channel] = pref.enabled
            prefs["_updated_at"] = updated_at
            self._preferences[key] = prefs

            has_subscription = key in self._subscriptions
            for record in self._notifications.get(key, []):
                self._apply_delivery_states(record, prefs, has_subscription)

        return await self.get_preferences(user_id, tenant_id)

    async def register_push_subscription(
        self,
        user_id: str,
        tenant_id: Optional[str],
        payload: PushSubscriptionCreate,
    ) -> PushSubscriptionResponse:
        key = self._key(user_id, tenant_id)
        async with self._lock:
            registered_at = _now()
            self._subscriptions[key] = {
                "subscription": payload.model_dump(by_alias=True),
                "registered_at": registered_at,
            }
            prefs = self._ensure_preferences(key)
            prefs.setdefault("webPush", True)
            prefs["_updated_at"] = registered_at
            self._preferences[key] = prefs

            for record in self._notifications.get(key, []):
                self._apply_delivery_states(record, prefs, has_subscription=True)

        return PushSubscriptionResponse(
            status="registered",
            registered_at=registered_at,
            web_push_enabled=bool(self._preferences[key].get("webPush", False)),
            email_fallback_enabled=bool(self._preferences[key].get("email", True)),
        )

    async def remove_push_subscription(self, user_id: str, tenant_id: Optional[str]) -> None:
        key = self._key(user_id, tenant_id)
        async with self._lock:
            self._subscriptions.pop(key, None)
            prefs = self._ensure_preferences(key)
            for record in self._notifications.get(key, []):
                self._apply_delivery_states(record, prefs, has_subscription=False)

    async def create_notification(
        self,
        user_id: str,
        tenant_id: Optional[str],
        payload: NotificationCreate,
    ) -> NotificationItem:
        key = self._key(user_id, tenant_id)
        async with self._lock:
            record = self._build_record(
                tenant_id=tenant_id,
                title=payload.title,
                body=payload.body,
                category=payload.category,
                created_at=_now(),
                read=False,
                action_url=payload.action_url,
            )
            records = self._notifications.setdefault(key, [])
            records.insert(0, record)
            prefs = self._ensure_preferences(key)
            has_subscription = key in self._subscriptions
            self._apply_delivery_states(record, prefs, has_subscription)
            return NotificationItem(**record)

    def _apply_delivery_states(
        self,
        record: Dict[str, Any],
        preferences: Dict[str, Any],
        has_subscription: bool,
    ) -> None:
        deliveries = {delivery["channel"]: delivery for delivery in record.get("deliveries", [])}
        now = _now()

        def set_state(channel: str, status: str, detail: Optional[str]) -> None:
            deliveries[channel] = {
                "channel": channel,
                "status": status,
                "detail": detail,
                "updated_at": now,
            }

        if preferences.get("inApp", True):
            status = "delivered" if record["read"] else "pending"
            detail = "Opened in app" if record["read"] else "Unread in notification center"
            set_state("inApp", status, detail)
        else:
            set_state("inApp", "disabled", "In-app notifications disabled")

        if preferences.get("webPush", False):
            if has_subscription:
                set_state("webPush", "pending", "Will deliver on next sync")
            else:
                set_state("webPush", "unsubscribed", "Waiting for push permission")
        else:
            set_state("webPush", "disabled", "Push delivery disabled in preferences")

        if preferences.get("email", True):
            if preferences.get("webPush", False) and not has_subscription:
                set_state("email", "fallback", "Fallback email queued while push is unavailable")
            elif record["read"]:
                set_state("email", "delivered", "Included in weekly activity email")
            else:
                set_state("email", "pending", "Email will send if unread after 1 hour")
        else:
            set_state("email", "disabled", "Email fallback disabled")

        order = ("inApp", "webPush", "email")
        record["deliveries"] = [deliveries[ch] for ch in order if ch in deliveries]

    def _ensure_preferences(self, key: NotificationKey) -> Dict[str, Any]:
        if key not in self._preferences:
            self._preferences[key] = {**DEFAULT_PREFERENCES, "_updated_at": _now()}
        return self._preferences[key]

    def _seed_notifications(
        self,
        user_id: str,
        tenant_id: Optional[str],
    ) -> List[Dict[str, Any]]:
        now = _now()
        return [
            self._build_record(
                tenant_id=tenant_id,
                title="You're all set!",
                body="Your workspace is ready. Invite teammates, configure branding, and explore automation recipes.",
                category="product-updates",
                created_at=now - timedelta(minutes=45),
                read=False,
                action_url="/dashboard/get-started",
            ),
            self._build_record(
                tenant_id=tenant_id,
                title="Weekly summary available",
                body="We emailed you a digest with usage, alerts, and insights. Open it for deeper analytics.",
                category="email",
                created_at=now - timedelta(hours=6),
                read=True,
                action_url="/reports/weekly",
            ),
            self._build_record(
                tenant_id=tenant_id,
                title="Maintenance window scheduled",
                body="We will perform maintenance on Saturday at 02:00 UTC. Real-time alerts will continue via email fallback.",
                category="system",
                created_at=now - timedelta(days=1, hours=2),
                read=False,
                action_url="/status",
            ),
        ]

    def _build_record(
        self,
        *,
        tenant_id: Optional[str],
        title: str,
        body: str,
        category: str,
        created_at: datetime,
        read: bool,
        action_url: Optional[str],
    ) -> Dict[str, Any]:
        return {
            "id": str(uuid4()),
            "tenant_id": tenant_id,
            "title": title,
            "body": body,
            "category": category,
            "created_at": created_at,
            "read": read,
            "read_at": created_at if read else None,
            "action_url": action_url,
            "deliveries": [],
        }

    @staticmethod
    def _key(user_id: str, tenant_id: Optional[str]) -> NotificationKey:
        tenant = tenant_id or "default"
        return f"{tenant}:{user_id}"


_SERVICE = NotificationService()


async def list_notifications(user_id: str, tenant_id: Optional[str]) -> NotificationFeedResponse:
    return await _SERVICE.list_notifications(user_id, tenant_id)


async def mark_notification(
    user_id: str,
    notification_id: str,
    payload: NotificationMarkRequest,
    tenant_id: Optional[str],
) -> None:
    await _SERVICE.set_read_state(user_id, notification_id, payload, tenant_id)


async def mark_all_notifications_read(user_id: str, tenant_id: Optional[str]) -> None:
    await _SERVICE.mark_all_read(user_id, tenant_id)


async def get_notification_preferences(
    user_id: str, tenant_id: Optional[str]
) -> NotificationPreferencesResponse:
    return await _SERVICE.get_preferences(user_id, tenant_id)


async def update_notification_preferences(
    user_id: str,
    tenant_id: Optional[str],
    payload: NotificationPreferenceUpdate,
) -> NotificationPreferencesResponse:
    return await _SERVICE.update_preferences(user_id, tenant_id, payload)


async def register_push_subscription(
    user_id: str,
    tenant_id: Optional[str],
    payload: PushSubscriptionCreate,
) -> PushSubscriptionResponse:
    return await _SERVICE.register_push_subscription(user_id, tenant_id, payload)


async def remove_push_subscription(user_id: str, tenant_id: Optional[str]) -> None:
    await _SERVICE.remove_push_subscription(user_id, tenant_id)


async def create_notification(
    user_id: str,
    tenant_id: Optional[str],
    payload: NotificationCreate,
) -> NotificationItem:
    return await _SERVICE.create_notification(user_id, tenant_id, payload)
