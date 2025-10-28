"""
Google OAuth Routes with Secure Popup Flow

Implements Google OAuth with:
- Popup UX (ux_mode: 'popup')
- CSRF protection via custom headers
- Origin/Referer verification
- Server-side code exchange
- Secure session cookies
"""

from fastapi import APIRouter, Depends, Response, Request, HTTPException, Header
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import logging
import os
from typing import Optional
from urllib.parse import urlparse

from api.services.google_oauth_service import get_google_oauth_service, GoogleOAuthService
from api.services.auth_service import get_current_user
from api.settings import settings
import jwt as pyjwt

logger = logging.getLogger("uvicorn.error")

router = APIRouter()


class TokenExchangeRequest(BaseModel):
    """Request model for token exchange"""
    code: str
    state: Optional[str] = None
    redirect_uri: Optional[str] = None


class RefreshTokenRequest(BaseModel):
    """Request model for token refresh"""
    refresh_token: str


def _verify_origin(request: Request, allowed_origins: list[str]) -> str:
    """
    Verify request origin for CSRF protection
    
    Checks both Origin and Referer headers against allowed origins.
    This is critical for popup flow security.
    
    Args:
        request: FastAPI request
        allowed_origins: List of allowed origin URLs
        
    Returns:
        Verified origin
        
    Raises:
        HTTPException: If origin is not allowed
    """
    # Get origin from header
    origin = request.headers.get("origin") or request.headers.get("referer")
    
    if not origin:
        logger.warning("Request missing Origin and Referer headers")
        raise HTTPException(
            status_code=403,
            detail="Missing origin information"
        )
    
    # Parse origin
    parsed = urlparse(origin)
    origin_base = f"{parsed.scheme}://{parsed.netloc}"
    
    # Check against allowed origins
    if origin_base not in allowed_origins:
        logger.warning(
            "Request from unauthorized origin: %s (allowed: %s)",
            origin_base,
            allowed_origins
        )
        raise HTTPException(
            status_code=403,
            detail="Origin not allowed"
        )
    
    return origin_base


def _verify_csrf_header(x_requested_with: Optional[str]) -> None:
    """
    Verify custom CSRF header
    
    For popup mode, Google recommends sending a custom header
    (e.g., X-Requested-With: XMLHttpRequest) to prevent CSRF attacks.
    
    Args:
        x_requested_with: Value of X-Requested-With header
        
    Raises:
        HTTPException: If header is missing or invalid
    """
    if not x_requested_with or x_requested_with.lower() != "xmlhttprequest":
        logger.warning("Request missing or invalid X-Requested-With header")
        raise HTTPException(
            status_code=403,
            detail="Missing required security header"
        )


def _get_allowed_origins() -> list[str]:
    """Get list of allowed CORS origins from configuration"""
    origins = []
    
    # Get from settings
    auth_config = getattr(settings, "auth_config", None)
    if auth_config and hasattr(auth_config, "cors_origins"):
        origins.extend(auth_config.cors_origins)
    
    # Get from environment
    env_origins = os.getenv("APP_CORS_ORIGINS")
    if env_origins:
        origins.extend(env_origins.split(","))
    
    if not origins:
        logger.warning("No CORS origins configured, using defaults")
        origins = ["http://127.0.0.1:5173", "http://localhost:3000"]
    
    return [o.strip() for o in origins]


def _get_cookie_config() -> dict:
    """Get secure cookie configuration based on environment"""
    is_prod = settings.ENV == "production"
    
    # Base configuration
    config = {
        "httponly": True,
        "samesite": "lax",
        "max_age": 60 * 60 * 24 * 7,  # 7 days
    }
    
    # Production-specific settings
    if is_prod:
        config.update({
            "secure": True,  # HTTPS only
            "domain": None,  # Will be set based on request
            "path": "/",
        })
        # Use __Host- prefix in production for additional security
        # This requires: secure=True, path=/, no domain attribute
        cookie_name = "__Host-session"
    else:
        config.update({
            "secure": False,  # Allow HTTP in development
        })
        cookie_name = "session"
    
    return cookie_name, config


def _create_app_session(user_info: dict, provider: str = "google") -> str:
    """
    Create application session JWT
    
    This is separate from Google's tokens. The frontend only sees this.
    
    Args:
        user_info: User information from ID token
        provider: OAuth provider name
        
    Returns:
        JWT session token
    """
    # Get JWT config
    jwt_secret = os.getenv("APP_JWT_SECRET", "dev-secret-key")
    jwt_algorithm = "HS256"
    jwt_expire_minutes = 60
    
    auth_config = getattr(settings, "auth_config", None)
    if auth_config and hasattr(auth_config, "jwt"):
        jwt_secret = auth_config.jwt.secret_key
        jwt_algorithm = auth_config.jwt.algorithm
        jwt_expire_minutes = auth_config.jwt.access_token_expire_minutes
    
    import time
    
    # Create JWT claims
    claims = {
        "sub": user_info["id"],
        "email": user_info["email"],
        "email_verified": user_info.get("email_verified", False),
        "name": user_info.get("name"),
        "picture": user_info.get("picture"),
        "provider": provider,
        "roles": ["user"],  # Default role
        "plan": "free",     # Default plan
        "iat": int(time.time()),
        "exp": int(time.time()) + jwt_expire_minutes * 60,
    }
    
    # Add audience and issuer if configured
    if auth_config and hasattr(auth_config, "jwt"):
        if hasattr(auth_config.jwt, "audience"):
            claims["aud"] = auth_config.jwt.audience
        if hasattr(auth_config.jwt, "issuer"):
            claims["iss"] = auth_config.jwt.issuer
    
    return pyjwt.encode(claims, jwt_secret, algorithm=jwt_algorithm)


@router.get("/google/config")
async def get_google_config(
    request: Request,
    google_oauth: GoogleOAuthService = Depends(get_google_oauth_service)
):
    """
    Get Google OAuth configuration for GIS client
    
    Returns configuration needed to initialize Google Identity Services
    on the frontend. This includes client_id and other parameters.
    """
    # Verify origin
    allowed_origins = _get_allowed_origins()
    origin = _verify_origin(request, allowed_origins)
    
    # Get configuration
    config = google_oauth.get_authorization_config(redirect_uri=origin)
    
    # Don't send state in config; frontend should generate its own
    config.pop("state", None)
    
    return config


@router.post("/google/exchange")
async def exchange_google_code(
    request: Request,
    body: TokenExchangeRequest,
    response: Response,
    x_requested_with: Optional[str] = Header(None),
    google_oauth: GoogleOAuthService = Depends(get_google_oauth_service)
):
    """
    Exchange Google authorization code for session
    
    This endpoint is called by the frontend after the popup flow completes.
    It exchanges the authorization code for tokens and creates an app session.
    
    Security checks:
    - Verifies X-Requested-With header (CSRF protection)
    - Verifies Origin/Referer (ensures request from allowed origin)
    - Validates authorization code with Google
    - Verifies ID token signature and claims
    
    Returns app session token in secure HttpOnly cookie.
    """
    # CSRF protection: verify custom header
    _verify_csrf_header(x_requested_with)
    
    # Verify origin
    allowed_origins = _get_allowed_origins()
    origin = _verify_origin(request, allowed_origins)
    
    # Use origin as redirect_uri (required for popup flow)
    redirect_uri = body.redirect_uri or origin
    
    # Get expected Workspace domain if configured
    expected_domain = os.getenv("APP_GOOGLE_WORKSPACE_DOMAIN")
    
    # Exchange code for tokens
    try:
        result = await google_oauth.exchange_code(
            code=body.code,
            redirect_uri=redirect_uri,
            state=body.state,
            expected_domain=expected_domain
        )
    except HTTPException as e:
        logger.error("Code exchange failed: %s", e.detail)
        raise
    
    user_info = result["user_info"]
    refresh_token = result.get("refresh_token")
    
    # Create app session JWT
    session_token = _create_app_session(user_info, provider="google")
    
    # Store refresh token server-side (in production, use Redis/DB)
    # For now, we'll include it in the session JWT (encrypted by google_oauth_service)
    # In a real app, store this in a database keyed by user_id
    if refresh_token:
        # TODO: Store refresh_token in database/Redis keyed by user_id
        logger.info("Refresh token received for user %s", user_info["email"])
    
    # Set secure cookie
    cookie_name, cookie_config = _get_cookie_config()
    response.set_cookie(
        key=cookie_name,
        value=session_token,
        **cookie_config
    )
    
    # Return success (don't send token in body, only in cookie)
    return {
        "success": True,
        "user": {
            "id": user_info["id"],
            "email": user_info["email"],
            "name": user_info.get("name"),
            "picture": user_info.get("picture"),
        }
    }


@router.post("/google/refresh")
async def refresh_google_token(
    request: Request,
    body: RefreshTokenRequest,
    x_requested_with: Optional[str] = Header(None),
    google_oauth: GoogleOAuthService = Depends(get_google_oauth_service)
):
    """
    Refresh Google access token
    
    In production, the refresh token should be stored server-side
    and this endpoint should look it up by session/user_id.
    """
    # CSRF protection
    _verify_csrf_header(x_requested_with)
    
    # Verify origin
    allowed_origins = _get_allowed_origins()
    _verify_origin(request, allowed_origins)
    
    # Refresh token
    result = await google_oauth.refresh_access_token(body.refresh_token)
    
    return {
        "access_token": result["access_token"],
        "expires_in": result["expires_in"],
        "refresh_token": result.get("refresh_token"),
    }


@router.post("/google/revoke")
async def revoke_google_token(
    request: Request,
    response: Response,
    x_requested_with: Optional[str] = Header(None),
    google_oauth: GoogleOAuthService = Depends(get_google_oauth_service)
):
    """
    Revoke Google refresh token and logout
    
    This should:
    1. Revoke the Google refresh token
    2. Clear the session cookie
    3. Clear any server-side session data
    """
    # CSRF protection
    _verify_csrf_header(x_requested_with)
    
    # Verify origin
    allowed_origins = _get_allowed_origins()
    _verify_origin(request, allowed_origins)
    
    # Get current user to find their refresh token
    user = await get_current_user(request)
    if not user:
        # Not authenticated, just clear cookie
        cookie_name, _ = _get_cookie_config()
        response.delete_cookie(key=cookie_name)
        return {"success": True}
    
    # TODO: Look up refresh token from database by user_id
    # For now, we don't have the refresh token accessible
    # In production, retrieve it from your database:
    # refresh_token = await get_user_refresh_token(user["id"])
    # if refresh_token:
    #     await google_oauth.revoke_token(refresh_token)
    
    # Clear session cookie
    cookie_name, _ = _get_cookie_config()
    response.delete_cookie(key=cookie_name, path="/")
    
    logger.info("User %s logged out", user.get("email"))
    
    return {"success": True}


@router.get("/me")
async def get_current_user_info(request: Request):
    """Get current user information from session cookie"""
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user
