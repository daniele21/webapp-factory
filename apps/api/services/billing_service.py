from __future__ import annotations

import copy
import json
import logging
import os
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any, Dict, Optional

from . import user_service
from .user_service import UserNotFoundError
from ..schemas.user import UserProfileUpdate


logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class PlanDetails:
    plan: str
    credits: Optional[int] = None
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass(frozen=True)
class BillingEvent:
    provider: str
    user_id: str
    event_type: Optional[str] = None
    event_id: Optional[str] = None
    plan: Optional[str] = None
    plan_reference: Optional[str] = None
    credits: Optional[int] = None
    credit_delta: Optional[int] = None
    metadata: Dict[str, Any] = field(default_factory=dict)


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _parse_int(value: Any) -> Optional[int]:
    if value is None or value == "":
        return None
    try:
        return int(value)
    except (TypeError, ValueError):
        logger.debug("Unable to coerce value '%s' to int", value)
        return None


def _load_plan_map() -> dict[str, PlanDetails]:
    raw = os.getenv("APP_BILLING_PLAN_MAP") or os.getenv("APP_BILLING_PLAN_MAPPING")
    mapping: dict[str, PlanDetails] = {}

    if raw:
        try:
            data = json.loads(raw)
        except json.JSONDecodeError:
            logger.exception("Failed to parse APP_BILLING_PLAN_MAP JSON")
            data = None

        if isinstance(data, dict):
            for reference, entry in data.items():
                if isinstance(entry, str):
                    mapping[str(reference)] = PlanDetails(plan=str(entry))
                    continue

                if not isinstance(entry, dict):
                    logger.warning("Unsupported plan map entry for %s: %r", reference, entry)
                    continue

                plan_value = entry.get("plan") or entry.get("id") or entry.get("name")
                if not plan_value:
                    logger.warning("Plan mapping for reference %s is missing a 'plan' field", reference)
                    continue

                credits_value = entry.get("credits")
                credits_int = _parse_int(credits_value) if credits_value is not None else None

                metadata_value = entry.get("metadata")
                metadata_dict: Dict[str, Any]
                if metadata_value is None:
                    metadata_dict = {}
                elif isinstance(metadata_value, dict):
                    metadata_dict = metadata_value
                else:
                    logger.warning("Ignoring non-dict metadata for plan %s", reference)
                    metadata_dict = {}

                mapping[str(reference)] = PlanDetails(
                    plan=str(plan_value),
                    credits=credits_int,
                    metadata=metadata_dict,
                )
        elif raw:
            logger.warning("APP_BILLING_PLAN_MAP must be a JSON object when set")

    if not mapping:
        mapping = {
            "price_pro_monthly": PlanDetails(plan="pro", credits=1000),
            "price_enterprise_monthly": PlanDetails(plan="enterprise", credits=5000),
        }

    return mapping


_PLAN_REFERENCE_MAP = _load_plan_map()


def resolve_plan(reference: Optional[str]) -> Optional[PlanDetails]:
    if not reference:
        return None
    return _PLAN_REFERENCE_MAP.get(reference)


async def apply_billing_event(event: BillingEvent) -> bool:
    """
    Apply billing changes for an incoming event from any payment provider.
    """
    try:
        existing = await user_service.get_user_by_id(event.user_id)
    except Exception:  # noqa: BLE001
        logger.exception("Failed fetching user %s during %s billing event", event.user_id, event.provider)
        return False

    if not existing:
        logger.warning("User %s not found while processing %s billing event", event.user_id, event.provider)
        return False

    plan_details = resolve_plan(event.plan_reference)
    plan_value = event.plan or (plan_details.plan if plan_details else None)
    credits_value = event.credits
    if credits_value is None and plan_details and plan_details.credits is not None:
        credits_value = plan_details.credits

    credit_delta = event.credit_delta

    metadata: Dict[str, Any] = copy.deepcopy(existing.metadata or {})
    billing_metadata: Dict[str, Any] = dict(metadata.get("billing") or {})

    update_meta: Dict[str, Any] = {
        "provider": event.provider,
        "last_reference": event.plan_reference or plan_value,
        "last_event_type": event.event_type,
        "synced_at": _now_iso(),
    }
    if event.event_id:
        update_meta["last_event_id"] = event.event_id

    if plan_details and plan_details.metadata:
        update_meta.setdefault("plan_metadata", {}).update(plan_details.metadata)

    if event.metadata:
        update_meta.update(event.metadata)

    billing_metadata.update({k: v for k, v in update_meta.items() if v is not None})
    metadata["billing"] = billing_metadata

    credits_to_set: Optional[int] = None
    if credits_value is not None:
        credits_to_set = max(0, credits_value)
    elif credit_delta is not None:
        current = existing.credits or 0
        credits_to_set = max(0, current + credit_delta)

    update_kwargs: Dict[str, Any] = {"metadata": metadata}
    if plan_value is not None:
        update_kwargs["plan"] = plan_value
    if credits_to_set is not None:
        update_kwargs["credits"] = credits_to_set

    try:
        await user_service.update_user(event.user_id, UserProfileUpdate(**update_kwargs))
    except UserNotFoundError:
        logger.warning("User %s disappeared before update during %s billing event", event.user_id, event.provider)
        return False
    except Exception:  # noqa: BLE001
        logger.exception("Failed updating user %s during %s billing event", event.user_id, event.provider)
        return False

    return True
