import pytest
from unittest.mock import AsyncMock

from services import billing_service
from services.billing_service import BillingEvent, PlanDetails
from schemas.user import UserProfile


@pytest.mark.asyncio
async def test_apply_billing_event_updates_plan_and_credits(monkeypatch):
    existing_user = UserProfile(
        id="user_123",
        email="user@example.com",
        plan="free",
        credits=25,
        metadata={"billing": {"previous": "data"}},
    )

    get_user = AsyncMock(return_value=existing_user)
    update_user = AsyncMock()

    monkeypatch.setattr(billing_service.user_service, "get_user_by_id", get_user)
    monkeypatch.setattr(billing_service.user_service, "update_user", update_user)

    event = BillingEvent(
        provider="stripe",
        event_id="evt_123",
        event_type="checkout.session.completed",
        user_id="user_123",
        plan="pro",
        credits=150,
        metadata={"customer_id": "cus_001", "subscription_id": "sub_001"},
    )

    handled = await billing_service.apply_billing_event(event)

    assert handled is True
    update_user.assert_awaited_once()
    args, _ = update_user.call_args
    assert args[0] == "user_123"
    payload = args[1]
    assert payload.plan == "pro"
    assert payload.credits == 150
    assert payload.metadata["billing"]["customer_id"] == "cus_001"
    assert payload.metadata["billing"]["subscription_id"] == "sub_001"


@pytest.mark.asyncio
async def test_apply_billing_event_uses_plan_mapping(monkeypatch):
    existing_user = UserProfile(
        id="user_456",
        email="another@example.com",
        plan="free",
        credits=10,
        metadata=None,
    )

    get_user = AsyncMock(return_value=existing_user)
    update_user = AsyncMock()

    monkeypatch.setattr(billing_service.user_service, "get_user_by_id", get_user)
    monkeypatch.setattr(billing_service.user_service, "update_user", update_user)
    monkeypatch.setattr(
        billing_service,
        "_PLAN_REFERENCE_MAP",
        {"price_enterprise": PlanDetails(plan="enterprise", credits=5000, metadata={"tier": "enterprise"})},
    )

    event = BillingEvent(
        provider="stripe",
        event_id="evt_456",
        event_type="checkout.session.completed",
        user_id="user_456",
        plan_reference="price_enterprise",
        metadata={"payment_status": "paid"},
    )

    handled = await billing_service.apply_billing_event(event)

    assert handled is True
    update_user.assert_awaited_once()
    args, _ = update_user.call_args
    payload = args[1]
    assert payload.plan == "enterprise"
    assert payload.credits == 5000
    assert payload.metadata["billing"]["plan_metadata"]["tier"] == "enterprise"


@pytest.mark.asyncio
async def test_apply_billing_event_returns_false_when_no_user(monkeypatch):
    get_user = AsyncMock(return_value=None)
    update_user = AsyncMock()
    monkeypatch.setattr(billing_service.user_service, "get_user_by_id", get_user)
    monkeypatch.setattr(billing_service.user_service, "update_user", update_user)

    event = BillingEvent(provider="stripe", user_id="missing-user")

    handled = await billing_service.apply_billing_event(event)

    assert handled is False
    update_user.assert_not_awaited()
