import json

from fastapi import APIRouter, HTTPException, Request, status
from fastapi.responses import JSONResponse

from ..providers.stripe import verify_signature
from ..providers.shopify import verify_shopify_signature
from ..services.billing_service import BillingEvent, apply_billing_event
from ..services import user_service

router = APIRouter()

def _coerce_int(value):
    try:
        return int(value)
    except (TypeError, ValueError):
        return None


@router.post('/webhook')
async def billing_webhook_default(request: Request):
    return await billing_webhook("stripe", request)


@router.post('/webhook/{provider}')
async def billing_webhook(provider: str, request: Request):
    payload = await request.body()
    provider_key = provider.lower()

    if provider_key == "stripe":
        sig = request.headers.get('stripe-signature')
        try:
            event = verify_signature(payload, sig)
        except Exception as exc:  # noqa: BLE001
            raise HTTPException(status_code=400, detail=str(exc))

        if hasattr(event, "to_dict_recursive"):
            event_payload = event.to_dict_recursive()
        elif isinstance(event, dict):
            event_payload = event
        else:
            event_payload = {"type": getattr(event, "type", None)}

        event_type = event_payload.get("type")
        event_id = event_payload.get("id")
        data_object = (event_payload.get("data") or {}).get("object") or {}
        metadata = data_object.get("metadata") or {}

        if event_type == "checkout.session.completed":
            user_id = metadata.get("user_id") or metadata.get("userId") or data_object.get("client_reference_id")
            if not user_id:
                return JSONResponse(
                    status_code=status.HTTP_202_ACCEPTED,
                    content={"received": True, "handled": False, "reason": "missing_user_reference"},
                )

            plan_reference = metadata.get("plan_reference") or metadata.get("price_id") or data_object.get("subscription")
            plan = metadata.get("plan")

            credits = _coerce_int(metadata.get("credits"))
            credit_delta = _coerce_int(metadata.get("credit_delta"))

            supplemental_metadata = {
                "customer_id": data_object.get("customer"),
                "subscription_id": data_object.get("subscription"),
                "payment_status": data_object.get("payment_status"),
                "plan_reference": plan_reference,
            }

            event_model = BillingEvent(
                provider=provider_key,
                event_id=event_id,
                event_type=event_type,
                user_id=user_id,
                plan=plan,
                plan_reference=plan_reference,
                credits=credits,
                credit_delta=credit_delta,
                metadata={k: v for k, v in supplemental_metadata.items() if v},
            )
            handled = await apply_billing_event(event_model)

        elif event_type == "customer.subscription.deleted":
            user_id = metadata.get("user_id") or metadata.get("userId")
            if not user_id:
                return JSONResponse(
                    status_code=status.HTTP_202_ACCEPTED,
                    content={"received": True, "handled": False, "reason": "missing_user_reference"},
                )

            fallback_plan = metadata.get("fallback_plan")
            fallback_credits = _coerce_int(metadata.get("fallback_credits"))

            supplemental_metadata = {
                "plan_reference": metadata.get("plan_reference"),
                "status": data_object.get("status"),
                "cancellation_reason": data_object.get("cancellation_details"),
            }

            event_model = BillingEvent(
                provider=provider_key,
                event_id=event_id,
                event_type=event_type,
                user_id=user_id,
                plan=fallback_plan,
                plan_reference=metadata.get("plan_reference"),
                credits=fallback_credits,
                metadata={k: v for k, v in supplemental_metadata.items() if v},
            )
            handled = await apply_billing_event(event_model)

        else:
            handled = False

        status_code = status.HTTP_200_OK if handled else status.HTTP_202_ACCEPTED
        return JSONResponse(status_code=status_code, content={"received": True, "handled": handled})

    if provider_key == "shopify":
        signature = request.headers.get("X-Shopify-Hmac-Sha256")
        topic = (request.headers.get("X-Shopify-Topic") or "").lower()

        try:
            verify_shopify_signature(payload, signature)
        except Exception as exc:  # noqa: BLE001
            raise HTTPException(status_code=400, detail=str(exc))

        try:
            body = json.loads(payload.decode("utf-8") or "{}")
        except json.JSONDecodeError as exc:  # noqa: BLE001
            raise HTTPException(status_code=400, detail=f"Invalid JSON payload: {exc}") from exc

        if topic != "orders/paid":
            return JSONResponse(
                status_code=status.HTTP_202_ACCEPTED,
                content={"received": True, "handled": False, "reason": "unsupported_topic", "topic": topic},
            )

        note_attributes = body.get("note_attributes") or []

        def from_note(*keys: str) -> str | None:
            keys_norm = {key.lower() for key in keys}
            for attr in note_attributes:
                name = (attr.get("name") or attr.get("key") or "").lower()
                if name in keys_norm:
                    return attr.get("value")
            return None

        google_email = from_note("google_email", "email", "google-email")
        if google_email:
            google_email = str(google_email).strip().lower()

        user = None
        if google_email:
            user = await user_service.get_user_by_email(google_email)

        if not user:
            return JSONResponse(
                status_code=status.HTTP_202_ACCEPTED,
                content={"received": True, "handled": False, "reason": "user_not_found"},
            )

        plan_reference = from_note("plan_reference", "price_id", "price") or body.get("id")
        plan = from_note("plan")
        credit_delta = _coerce_int(from_note("credits", "credit_delta", "credits_delta"))

        supplemental_metadata = {
            "order_id": body.get("id"),
            "order_number": body.get("order_number"),
            "currency": body.get("currency"),
            "total_price": body.get("total_price"),
            "plan_reference": plan_reference,
            "google_email": google_email,
        }

        event_model = BillingEvent(
            provider=provider_key,
            event_id=str(body.get("id") or ""),
            event_type=topic,
            user_id=str(user.id),
            plan=plan,
            plan_reference=str(plan_reference) if plan_reference else None,
            credit_delta=credit_delta,
            metadata={k: v for k, v in supplemental_metadata.items() if v},
        )

        handled = await apply_billing_event(event_model)
        status_code = status.HTTP_200_OK if handled else status.HTTP_202_ACCEPTED
        return JSONResponse(status_code=status_code, content={"received": True, "handled": handled})

    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Unsupported provider '{provider}'")
