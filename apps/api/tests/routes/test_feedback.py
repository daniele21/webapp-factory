from __future__ import annotations

from unittest.mock import AsyncMock, patch

import pytest

from api.services.feedback_service import FeedbackConfigurationError, FeedbackDeliveryError
from api.settings import settings


@pytest.fixture(autouse=True)
def configure_feedback_env(monkeypatch):
    monkeypatch.setenv("APP_TELEGRAM_BOT_TOKEN", "test-token")
    monkeypatch.setenv("APP_TELEGRAM_CHAT_ID", "123456")
    monkeypatch.delenv("APP_FEEDBACK_REQUIRE_AUTH", raising=False)
    monkeypatch.setattr(settings, "feedback_require_auth", False)
    yield


def test_feedback_submission_success(client):
    payload = {
        "name": "Jane Doe",
        "email": "jane@example.com",
        "message": "Great product! Would love to see more integrations.",
        "page_url": "https://example.com/dashboard",
    }

    with patch("api.routes.feedback.submit_feedback", new=AsyncMock()) as mock_submit:
        response = client.post("/feedback", json=payload)

    assert response.status_code == 201
    assert response.json() == {"status": "accepted"}

    mock_submit.assert_awaited_once()
    submitted_payload = mock_submit.await_args.args[0]
    assert submitted_payload.message == payload["message"]
    # User agent is automatically populated from the request
    assert submitted_payload.user_agent


def test_feedback_submission_missing_configuration(client):
    payload = {
        "message": "Please add an automatic dark mode option.",
    }

    async def _raise(*_, **__):
        raise FeedbackConfigurationError("missing configuration")

    with patch("api.routes.feedback.submit_feedback", new=AsyncMock(side_effect=_raise)):
        response = client.post("/feedback", json=payload)

    assert response.status_code == 503
    assert response.json()["detail"] == "Feedback delivery is not configured."


def test_feedback_submission_delivery_failure(client):
    payload = {
        "message": "There is a bug on the dashboard.",
    }

    async def _raise(*_, **__):
        raise FeedbackDeliveryError("failed to send")

    with patch("api.routes.feedback.submit_feedback", new=AsyncMock(side_effect=_raise)):
        response = client.post("/feedback", json=payload)

    assert response.status_code == 502
    assert response.json()["detail"] == "Failed to deliver feedback message."


def test_feedback_requires_auth_when_enabled(client, monkeypatch):
    monkeypatch.setattr(settings, "feedback_require_auth", True)
    response = client.post("/feedback", json={"message": "Need auth"})
    assert response.status_code == 401
    assert response.json()["detail"] == "Authentication required to send feedback."


def test_feedback_includes_user_metadata_when_authenticated(client, auth_headers, monkeypatch):
    monkeypatch.setattr(settings, "feedback_require_auth", True)
    payload = {
        "message": "Authenticated feedback submission.",
    }

    with patch("api.routes.feedback.submit_feedback", new=AsyncMock()) as mock_submit:
        response = client.post("/feedback", json=payload, headers=auth_headers())

    assert response.status_code == 201
    submitted_payload = mock_submit.await_args.args[0]
    assert submitted_payload.metadata is not None
    assert submitted_payload.metadata.get("user", {}).get("email") == "test@example.com"
    assert submitted_payload.metadata.get("user", {}).get("id") == "test_user_001"
