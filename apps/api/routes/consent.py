from __future__ import annotations

import json
import logging
from datetime import datetime
from typing import Dict

from fastapi import APIRouter, Depends, Request, Response
from pydantic import BaseModel, Field

from api.auth.deps import optional_auth
from api.auth.models import AuthClaims
from api.settings import settings

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["consent"])


class ConsentPayload(BaseModel):
	choices: Dict[str, bool] = Field(default_factory=dict)
	recorded_at: datetime | None = None


@router.get("/consent")
def get_consent(request: Request) -> Dict[str, bool]:
	"""
	Return the consent choices stored in the client cookie, if present.
	"""
	cookie = request.cookies.get("wf_cookie_consent")
	if not cookie:
		return {}

	try:
		parsed = json.loads(cookie)
		if isinstance(parsed, dict):
			return {str(key): bool(value) for key, value in parsed.items()}
	except json.JSONDecodeError:
		logger.warning("Invalid consent cookie payload encountered", exc_info=True)

	return {}


@router.post("/consent")
def set_consent(
	payload: ConsentPayload,
	response: Response,
	request: Request,
	claims: AuthClaims | None = Depends(optional_auth),
) -> Dict[str, bool]:
	"""
	Store consent selections in a readable cookie and optionally audit the change.
	"""
	choices = {str(key): bool(value) for key, value in payload.choices.items()}
	cookie_val = json.dumps(choices, separators=(",", ":"))
	response.set_cookie(
		key="wf_cookie_consent",
		value=cookie_val,
		path="/",
		httponly=False,
		samesite="lax",
		secure=settings.ENV.lower() == "production",
		max_age=60 * 60 * 24 * 365,
	)
	response.headers["Cache-Control"] = "no-store"

	try:
		logger.info(
			"Cookie consent updated",
			extra={
				"user_id": claims.sub if claims else None,
				"choices": choices,
				"ip": request.client.host if request.client else None,
				"user_agent": request.headers.get("user-agent"),
				"recorded_at": (payload.recorded_at or datetime.utcnow()).isoformat(),
			},
		)
	except Exception:
		# Ensure consent updates never fail due to logging/audit issues.
		logger.debug("Failed to log cookie consent update", exc_info=True)

	return {"ok": True}
