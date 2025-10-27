import stripe as _stripe
from ..settings import settings

stripe = _stripe
stripe.api_key = settings.stripe_secret_key

def verify_signature(payload: bytes, sig: str | None):
    if not settings.stripe_webhook_secret:
        raise ValueError("Missing STRIPE_WEBHOOK_SECRET")
    return stripe.Webhook.construct_event(payload, sig, settings.stripe_webhook_secret)
