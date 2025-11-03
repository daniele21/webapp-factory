from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, HTTPException, Request, status

from api.schemas.feedback import FeedbackPayload, FeedbackResponse
from api.services.feedback_service import (
    FeedbackConfigurationError,
    FeedbackDeliveryError,
    submit_feedback,
)
from api.auth.deps import optional_auth
from api.auth.models import AuthClaims
from api.settings import settings

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/feedback", tags=["feedback"])


@router.post(
    "",
    status_code=status.HTTP_201_CREATED,
    response_model=FeedbackResponse,
)
async def create_feedback(
    payload: FeedbackPayload,
    request: Request,
    claims: AuthClaims | None = Depends(optional_auth),
) -> FeedbackResponse:
    require_auth = settings.FEEDBACK_REQUIRE_AUTH
    if require_auth and claims is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required to send feedback.")

    feedback = payload
    user_agent = request.headers.get("user-agent")
    if user_agent and not payload.user_agent:
        feedback = payload.model_copy(update={"user_agent": user_agent})

    if claims:
        metadata = feedback.metadata.copy() if feedback.metadata else {}
        metadata["user"] = {
            "id": claims.sub,
            "email": claims.email,
            "roles": claims.roles,
            "orgId": claims.orgId,
            "plan": claims.plan,
        }
        feedback = feedback.model_copy(update={"metadata": metadata})

    try:
        await submit_feedback(feedback)
    except FeedbackConfigurationError as exc:
        logger.info("Feedback delivery skipped: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Feedback delivery is not configured.",
        ) from exc
    except FeedbackDeliveryError as exc:
        logger.error("Failed to deliver feedback message.")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Failed to deliver feedback message.",
        ) from exc

    return FeedbackResponse()
