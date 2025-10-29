import base64
import copy
import hashlib
import hmac
import json
from datetime import datetime, timezone
import logging
from unittest.mock import AsyncMock

import pytest

from schemas.user import UserProfile


def _sign(payload: bytes, secret: str) -> str:
    digest = hmac.new(secret.encode("utf-8"), payload, hashlib.sha256).digest()
    return base64.b64encode(digest).decode("utf-8")


class InMemoryUserRepo:
    def __init__(self):
        logging.info("Initialising in-memory user repo for webhook tests")
        now = datetime.now(timezone.utc).isoformat()
        self.store = {
            "user-42": {
                "id": "user-42",
                "email": "user@example.com",
                "plan": "free",
                "credits": 10,
                "metadata": {},
                "created_at": now,
                "updated_at": now,
            }
        }

    async def get(self, user_id: str):
        doc = self.store.get(user_id)
        return copy.deepcopy(doc) if doc else None

    async def get_by_email(self, email: str):
        email = email.lower()
        for doc in self.store.values():
            if doc["email"].lower() == email:
                return copy.deepcopy(doc)
        return None

    async def upsert(self, user_id: str, payload: dict):
        existing = self.store.get(user_id, {"id": user_id})
        combined = copy.deepcopy(existing)
        combined.update(payload)
        combined["updated_at"] = datetime.now(timezone.utc).isoformat()
        self.store[user_id] = combined
        return copy.deepcopy(combined)


@pytest.mark.asyncio
async def test_shopify_orders_paid_webhook_triggers_billing_event(client, monkeypatch):
    secret = "shopify-secret"
    logging.info("Starting Shopify webhook -> billing event test")

    from api.providers import shopify as shopify_provider
    shopify_provider.settings.shopify_webhook_secret = secret

    apply_mock = AsyncMock(return_value=True)
    monkeypatch.setattr("api.routes.payments.apply_billing_event", apply_mock)

    user = UserProfile(
        id="user-42",
        email="user@example.com",
        name="Test User",
        plan="free",
        credits=10,
    )
    monkeypatch.setattr("api.routes.payments.user_service.get_user_by_email", AsyncMock(return_value=user))

    payload = {
        "id": 123456789,
        "order_number": 42,
        "currency": "USD",
        "total_price": "19.99",
        "note_attributes": [
            {"name": "google_email", "value": "danielemoltisanti@gmail.com"},
            {"name": "plan", "value": "pro"},
            {"name": "plan_reference", "value": "shopify-pro"},
            {"name": "credits", "value": "250"},
        ],
    }
    body = json.dumps(payload).encode("utf-8")
    signature = _sign(body, secret)

    response = client.post(
        "/payments/webhook/shopify",
        data=body,
        headers={
            "X-Shopify-Hmac-Sha256": signature,
            "X-Shopify-Topic": "orders/paid",
            "Content-Type": "application/json",
        },
    )

    logging.info("Received response: %s %s", response.status_code, response.json())
    assert response.status_code == 200
    assert response.json() == {"received": True, "handled": True}
    apply_mock.assert_awaited_once()
    event = apply_mock.call_args.args[0]
    logging.info("Billing event payload: %s", event)
    assert event.user_id == "user-42"
    assert event.plan == "pro"
    assert event.plan_reference == "shopify-pro"
    assert event.credit_delta == 250
    assert event.provider == "shopify"


@pytest.mark.asyncio
async def test_shopify_webhook_missing_user_returns_accepted(client, monkeypatch):
    secret = "shopify-secret"
    logging.info("Starting Shopify webhook missing-user test")

    from api.providers import shopify as shopify_provider
    shopify_provider.settings.shopify_webhook_secret = secret

    apply_mock = AsyncMock(return_value=True)
    monkeypatch.setattr("api.routes.payments.apply_billing_event", apply_mock)
    monkeypatch.setattr("api.routes.payments.user_service.get_user_by_email", AsyncMock(return_value=None))

    payload = {"note_attributes": [{"name": "google_email", "value": "missing@example.com"}]}
    body = json.dumps(payload).encode("utf-8")
    signature = _sign(body, secret)

    response = client.post(
        "/payments/webhook/shopify",
        data=body,
        headers={
            "X-Shopify-Hmac-Sha256": signature,
            "X-Shopify-Topic": "orders/paid",
            "Content-Type": "application/json",
        },
    )

    logging.info("Missing user response: %s %s", response.status_code, response.json())
    assert response.status_code == 202
    body = response.json()
    assert body["handled"] is False
    assert body["reason"] == "user_not_found"
    apply_mock.assert_not_awaited()


def test_shopify_orders_paid_updates_user_record(client, monkeypatch):
    secret = "shopify-secret"
    logging.info("Starting Shopify webhook -> Firestore update test")

    from api.providers import shopify as shopify_provider
    shopify_provider.settings.shopify_webhook_secret = secret

    repo = InMemoryUserRepo()
    monkeypatch.setattr("api.services.user_service.get_user_repository", lambda: repo)

    payload = {
        "id": 222333444,
        "order_number": 99,
        "currency": "USD",
        "total_price": "49.00",
        "note_attributes": [
            {"name": "google_email", "value": "user@example.com"},
            {"name": "plan", "value": "enterprise"},
            {"name": "credits", "value": "90"},
        ],
    }
    body = json.dumps(payload).encode("utf-8")
    signature = _sign(body, secret)

    response = client.post(
        "/payments/webhook/shopify",
        data=body,
        headers={
            "X-Shopify-Hmac-Sha256": signature,
            "X-Shopify-Topic": "orders/paid",
            "Content-Type": "application/json",
        },
    )

    logging.info("Firestore update response: %s %s", response.status_code, response.json())
    assert response.status_code == 200
    assert response.json() == {"received": True, "handled": True}

    updated = repo.store["user-42"]
    assert updated["plan"] == "enterprise"
    assert updated["credits"] == 100  # original 10 + 90 delta
    billing_meta = updated["metadata"]["billing"]
    assert billing_meta["provider"] == "shopify"
    assert billing_meta["google_email"] == "user@example.com"
    assert billing_meta["order_id"] == 222333444
