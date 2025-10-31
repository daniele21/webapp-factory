from __future__ import annotations

from datetime import datetime
from typing import List, Literal, Optional

from pydantic import BaseModel, Field, ConfigDict


NotificationChannel = Literal["inApp", "webPush", "email"]
DeliveryStatus = Literal["pending", "delivered", "disabled", "fallback", "unsubscribed"]


class NotificationDeliveryState(BaseModel):
    channel: NotificationChannel
    status: DeliveryStatus
    detail: Optional[str] = None
    updated_at: Optional[datetime] = None


class NotificationItem(BaseModel):
    id: str
    tenant_id: Optional[str] = None
    title: str
    body: str
    category: str
    created_at: datetime
    read: bool = False
    read_at: Optional[datetime] = None
    action_url: Optional[str] = None
    deliveries: List[NotificationDeliveryState] = Field(default_factory=list)


class NotificationFeedResponse(BaseModel):
    items: List[NotificationItem]
    unread_count: int
    last_sync_at: datetime


class NotificationPreference(BaseModel):
    channel: NotificationChannel
    enabled: bool
    updated_at: datetime


class NotificationPreferencesResponse(BaseModel):
    preferences: List[NotificationPreference]
    fallback_channel: Optional[NotificationChannel] = None
    updated_at: datetime


class NotificationPreferenceInput(BaseModel):
    channel: NotificationChannel
    enabled: bool


class NotificationPreferenceUpdate(BaseModel):
    preferences: List[NotificationPreferenceInput]


class NotificationMarkRequest(BaseModel):
    read: bool = True


class PushSubscriptionKeys(BaseModel):
    p256dh: str
    auth: str


class PushSubscriptionCreate(BaseModel):
    endpoint: str
    expiration_time: Optional[int] = Field(default=None, alias="expirationTime")
    keys: PushSubscriptionKeys
    user_agent: Optional[str] = None

    model_config = ConfigDict(populate_by_name=True)


class PushSubscriptionResponse(BaseModel):
    status: Literal["registered"]
    registered_at: datetime
    web_push_enabled: bool
    email_fallback_enabled: bool


class NotificationCreate(BaseModel):
    title: str
    body: str
    category: str = Field(default="custom")
    action_url: Optional[str] = None
