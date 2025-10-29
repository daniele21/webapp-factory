from __future__ import annotations

import base64
import hmac
import hashlib

from ..settings import settings


def verify_shopify_signature(payload: bytes, signature: str | None) -> None:
    """
    Validate Shopify webhook signature.

    Raises ValueError when the shared secret is missing or the signature is invalid.
    """
    secret = settings.shopify_webhook_secret
    if not secret:
        raise ValueError("Missing SHOPIFY_WEBHOOK_SECRET")
    if not signature:
        raise ValueError("Missing X-Shopify-Hmac-Sha256 header")

    digest = hmac.new(secret.encode("utf-8"), payload, hashlib.sha256).digest()
    expected = base64.b64encode(digest).decode("utf-8")

    if not hmac.compare_digest(expected, signature.strip()):
        raise ValueError("Invalid Shopify webhook signature")
