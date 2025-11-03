from __future__ import annotations

import json
import logging
from typing import Any, Dict

import httpx

from api.schemas.feedback import FeedbackPayload
from api.settings import settings

logger = logging.getLogger(__name__)


class FeedbackConfigurationError(RuntimeError):
    """Raised when the feedback integration is not properly configured."""


class FeedbackDeliveryError(RuntimeError):
    """Raised when a feedback message cannot be delivered to Telegram."""


class FeedbackService:
    """Service responsible for delivering feedback messages to Telegram."""

    _telegram_endpoint = "https://api.telegram.org/bot{token}/sendMessage"
    _message_limit = 3500  # Telegram limits messages to 4096 chars; stay comfortably below.

    async def submit_feedback(self, payload: FeedbackPayload) -> None:
        token = settings.TELEGRAM_BOT_TOKEN
        chat_id = settings.TELEGRAM_CHAT_ID

        if not token or not chat_id:
            logger.warning("Feedback submission skipped because Telegram is not configured.")
            raise FeedbackConfigurationError("Feedback delivery is not configured.")

        text = self._build_message(payload)
        url = self._telegram_endpoint.format(token=token)
        body = {"chat_id": chat_id, "text": text, "disable_web_page_preview": True}

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(url, json=body)
                response.raise_for_status()
                data = response.json()
        except httpx.HTTPError as exc:
            logger.exception("Failed to deliver feedback to Telegram: network error.")
            raise FeedbackDeliveryError("Unable to send feedback to Telegram.") from exc
        except json.JSONDecodeError:
            logger.exception("Failed to decode Telegram response for feedback delivery.")
            raise FeedbackDeliveryError("Unexpected response from Telegram.")

        if not data.get("ok", False):
            logger.error("Telegram rejected feedback payload: %s", data)
            raise FeedbackDeliveryError("Telegram rejected the feedback payload.")

        logger.info("Feedback delivered to Telegram chat %s.", chat_id)

    def _build_message(self, payload: FeedbackPayload) -> str:
        sections = ["Feedback received"]

        if payload.name:
            sections.append(f"Name: {payload.name}")
        if payload.email:
            sections.append(f"Email: {payload.email}")
        if payload.page_url:
            sections.append(f"Page: {payload.page_url}")
        if payload.user_agent:
            sections.append(f"User agent: {payload.user_agent}")

        if payload.metadata:
            sections.append("Metadata:")
            sections.extend(self._format_metadata(payload.metadata))

        sections.append("")
        sections.append(payload.message)

        message = "\n".join(sections)
        if len(message) > self._message_limit:
            truncated = message[: self._message_limit - 20].rstrip()
            message = f"{truncated}\n...(truncated)"
        return message

    def _format_metadata(self, metadata: Dict[str, Any]) -> list[str]:
        formatted: list[str] = []
        for key, value in metadata.items():
            safe_value = self._stringify(value)
            formatted.append(f"- {key}: {safe_value}")
        return formatted

    @staticmethod
    def _stringify(value: Any) -> str:
        if isinstance(value, (str, int, float, bool)) or value is None:
            return str(value)
        try:
            return json.dumps(value, ensure_ascii=False)
        except TypeError:
            return repr(value)


_SERVICE = FeedbackService()


async def submit_feedback(payload: FeedbackPayload) -> None:
    """Submit feedback through the configured delivery channel."""
    await _SERVICE.submit_feedback(payload)
