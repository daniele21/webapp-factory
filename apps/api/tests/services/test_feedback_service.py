from __future__ import annotations

import pytest
from unittest.mock import AsyncMock, patch

import httpx

from api.schemas.feedback import FeedbackPayload
from api.services.feedback_service import (
    FeedbackConfigurationError,
    FeedbackDeliveryError,
    FeedbackService,
)
from api.settings import settings


def test_build_message_includes_metadata():
    service = FeedbackService()
    payload = FeedbackPayload(
        name="Alice",
        email="alice@example.com",
        message="This is a detailed feedback message.",
        page_url="https://example.com/page",
        metadata={"priority": "high", "details": {"step": 3}},
    )

    text = service._build_message(payload)

    assert "Name: Alice" in text
    assert "Email: alice@example.com" in text
    assert "Page: https://example.com/page" in text
    assert "Metadata:" in text
    assert "- details: {\"step\": 3}" in text
    assert text.endswith("This is a detailed feedback message.")


def test_build_message_truncates_long_body():
    service = FeedbackService()
    long_message = "x" * 4000
    payload = FeedbackPayload(message=long_message)

    text = service._build_message(payload)

    assert len(text) <= service._message_limit + 5
    assert text.endswith("...(truncated)")


@pytest.mark.asyncio
async def test_submit_feedback_requires_configuration(monkeypatch):
    monkeypatch.setattr(settings, "telegram_bot_token", None, raising=False)
    monkeypatch.setattr(settings, "telegram_chat_id", None, raising=False)
    monkeypatch.delenv("APP_TELEGRAM_BOT_TOKEN", raising=False)
    monkeypatch.delenv("APP_TELEGRAM_CHAT_ID", raising=False)

    service = FeedbackService()

    with pytest.raises(FeedbackConfigurationError):
        await service.submit_feedback(FeedbackPayload(message="Hello"))


@pytest.mark.asyncio
async def test_submit_feedback_reports_network_error(monkeypatch):
    monkeypatch.setattr(settings, "telegram_bot_token", None, raising=False)
    monkeypatch.setattr(settings, "telegram_chat_id", None, raising=False)
    monkeypatch.setenv("APP_TELEGRAM_BOT_TOKEN", "token")
    monkeypatch.setenv("APP_TELEGRAM_CHAT_ID", "123")

    service = FeedbackService()

    inner_client = AsyncMock()
    inner_client.post.side_effect = httpx.HTTPError("boom")

    async_client_mock = AsyncMock()
    async_client_mock.__aenter__.return_value = inner_client

    with patch("api.services.feedback_service.httpx.AsyncClient", return_value=async_client_mock):
        with pytest.raises(FeedbackDeliveryError):
            await service.submit_feedback(FeedbackPayload(message="Hello world"))

    inner_client.post.assert_awaited_once()
