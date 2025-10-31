"""Service layer exports."""

from .user_service import (
    UserAlreadyExistsError,
    UserNotFoundError,
    create_user,
    delete_user,
    get_user_by_email,
    get_user_by_id,
    handle_service_error,
    list_users,
    update_user,
    upsert_user,
)
from .notification_service import (
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

__all__ = [
    "UserAlreadyExistsError",
    "UserNotFoundError",
    "create_user",
    "delete_user",
    "get_user_by_email",
    "get_user_by_id",
    "handle_service_error",
    "list_users",
    "update_user",
    "upsert_user",
    "NotificationNotFoundError",
    "get_notification_preferences",
    "list_notifications",
    "mark_all_notifications_read",
    "mark_notification",
    "register_push_subscription",
    "remove_push_subscription",
    "update_notification_preferences",
    "create_notification",
]
