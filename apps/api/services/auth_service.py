from dataclasses import dataclass
from typing import Optional, Dict, Any
import jwt
import os
import secrets
import time
import httpx
from urllib.parse import urlencode
from fastapi import HTTPException
from ..settings import settings
import logging

logger = logging.getLogger("uvicorn.error")


@dataclass
class Session:
    token: str


@dataclass
class OAuthProvider:
    """OAuth provider configuration"""
    name: str
    authorization_url: str
    token_url: str
    user_info_url: str
    scopes: list[str]
    client_id_env: str
    client_secret_env: str
    
    def get_credentials(self) -> tuple[str, str]:
        """Get client ID and secret from environment"""
        # Try APP_ prefixed env vars first (project convention), then plain env names
        app_prefixed_id = f"APP_{self.client_id_env}"
        app_prefixed_secret = f"APP_{self.client_secret_env}"

        client_id = os.getenv(app_prefixed_id) or os.getenv(self.client_id_env)
        client_secret = os.getenv(app_prefixed_secret) or os.getenv(self.client_secret_env)

        # Fallback to settings for backward-compatible configuration (e.g. Settings.GOOGLE_CLIENT_ID)
        if not client_id:
            # settings has backward-compat properties like GOOGLE_CLIENT_ID
            try:
                client_id = getattr(settings, self.client_id_env, None)
            except Exception:
                client_id = None

        if not client_secret:
            try:
                client_secret = getattr(settings, self.client_secret_env, None)
            except Exception:
                client_secret = None

        if not client_id or not client_secret:
            missing = []
            if not client_id:
                missing.append(f"{app_prefixed_id} or {self.client_id_env}")
            if not client_secret:
                missing.append(f"{app_prefixed_secret} or {self.client_secret_env}")
            raise HTTPException(
                status_code=500,
                detail=(
                    f"{self.name} OAuth is not configured. Missing: {', '.join(missing)}. "
                    "Set the environment variables or configure auth in settings."
                ),
            )

        return client_id, client_secret


# Provider configurations
OAUTH_PROVIDERS: Dict[str, OAuthProvider] = {
    "google": OAuthProvider(
        name="Google",
        authorization_url="https://accounts.google.com/o/oauth2/v2/auth",
        token_url="https://oauth2.googleapis.com/token",
        user_info_url="https://www.googleapis.com/oauth2/v2/userinfo",
        scopes=["openid", "email", "profile"],
        client_id_env="GOOGLE_CLIENT_ID",
        client_secret_env="GOOGLE_CLIENT_SECRET",
    )
}


def get_provider(provider_name: str) -> OAuthProvider:
    """Get OAuth provider configuration by name"""
    provider = OAUTH_PROVIDERS.get(provider_name.lower())
    if not provider:
        raise HTTPException(
            status_code=400,
            detail=f"Unknown OAuth provider: {provider_name}. Supported providers: {', '.join(OAUTH_PROVIDERS.keys())}"
        )
    return provider


def _get_redirect_uri(provider_name: str) -> str:
    """Resolve redirect URI using environment or settings without hardcoded defaults.

    Order of precedence:
      1. APP_OAUTH_REDIRECT_URI_TEMPLATE (supports '{provider}')
      2. APP_OAUTH_REDIRECT_URI
      3. settings.OAUTH_REDIRECT_URI

    If the chosen value contains '{provider}' it will be formatted. If it ends with
    '/auth/callback' but doesn't include provider, the provider segment will be
    inserted (e.g. '/auth/callback' -> '/auth/{provider}/callback').
    """
    template = (
        os.getenv("APP_OAUTH_REDIRECT_URI_TEMPLATE")
        or os.getenv("APP_OAUTH_REDIRECT_URI")
        or getattr(settings, "OAUTH_REDIRECT_URI", None)
    )

    if not template:
        raise HTTPException(
            status_code=500,
            detail=(
                "OAuth redirect URI is not configured. Set APP_OAUTH_REDIRECT_URI_TEMPLATE or "
                "APP_OAUTH_REDIRECT_URI or configure auth.oauth_redirect_uri in settings."
            ),
        )

    # If template contains formatting placeholder, use it
    if "{provider}" in template:
        try:
            return template.format(provider=provider_name)
        except Exception:
            raise HTTPException(status_code=500, detail="Invalid APP_OAUTH_REDIRECT_URI_TEMPLATE format")

    # If template is a generic callback path, insert provider segment
    if template.endswith("/auth/callback"):
        return template.replace("/auth/callback", f"/auth/{provider_name}/callback")

    # If template ends with slash, append provider callback
    if template.endswith("/"):
        return template.rstrip("/") + f"/auth/{provider_name}/callback"

    # Otherwise, return as-is (assume provider-specific registration handled externally)
    return template


def build_login_url(provider_name: str, redirect: str) -> str:
    """
    Build OAuth authorization URL for any provider.
    
    Args:
        provider_name: OAuth provider (google, github, slack, etc.)
        redirect: The frontend URL to redirect back to after OAuth
        
    Returns:
        OAuth authorization URL
    """
    provider = get_provider(provider_name)
    client_id, _ = provider.get_credentials()
    
    # Resolve redirect URI from env/settings (no hardcoded defaults)
    redirect_uri = _get_redirect_uri(provider_name)

    # The route accepts a `redirect` query param (frontend where to land after auth)
    # but the provider needs a server-side redirect URI that matches the one
    # registered in the OAuth app. Warn if the caller passed a frontend redirect
    # and it doesn't match our resolved server redirect URI (common source of 400s).
    if redirect and redirect != redirect_uri:
        logger.debug("OAuth login: caller provided redirect '%s' which differs from server redirect_uri '%s'", redirect, redirect_uri)
    
    # Generate state for CSRF protection
    state = secrets.token_urlsafe(32)
    
    # Build authorization URL
    params = {
        "client_id": client_id,
        "redirect_uri": redirect_uri,
        "response_type": "code",
        "scope": " ".join(provider.scopes),
        "state": state,
    }
    
    # Provider-specific parameters
    if provider_name == "google":
        params.update({
            "access_type": "offline",
            "prompt": "consent",
        })
    auth_url = f"{provider.authorization_url}?{urlencode(params)}"
    return auth_url


async def exchange_code(provider_name: str, code: str, state: str) -> Session:
    """
    Exchange authorization code for access token and create session.
    
    Args:
        provider_name: OAuth provider (google, github, slack, etc.)
        code: Authorization code from provider
        state: State parameter for CSRF protection
        
    Returns:
        Session with JWT token
    """
    provider = get_provider(provider_name)
    client_id, client_secret = provider.get_credentials()
    
    redirect_uri = _get_redirect_uri(provider_name)
    
    # TODO: Validate state parameter against stored value (requires session/cache)
    
    # Exchange code for tokens
    token_data = {
        "code": code,
        "client_id": client_id,
        "client_secret": client_secret,
        "redirect_uri": redirect_uri,
        "grant_type": "authorization_code",
    }
    
    async with httpx.AsyncClient() as client:
        # Get access token
        headers = {"Accept": "application/json"}
        
        # GitHub requires specific accept header
        if provider_name == "github":
            headers["Accept"] = "application/json"
        
        token_response = await client.post(
            provider.token_url,
            data=token_data,
            headers=headers
        )
        # Log response details for debugging (redirect_uri mismatch or invalid client credentials
        # commonly produce 4xx responses here). Keep logs concise but include provider body.
        if token_response.status_code != 200:
            logger.error("Token exchange failed for provider %s: status=%s body=%s", provider_name, token_response.status_code, token_response.text)
            raise HTTPException(
                status_code=400,
                detail=f"Failed to exchange code for token: {token_response.text}"
            )
        
        tokens = token_response.json()
        access_token = tokens.get("access_token")
        
        if not access_token:
            raise HTTPException(status_code=400, detail="No access token received")
        
        # Get user info from provider
        try:
            user_info = await _get_user_info(client, provider, access_token)
        except HTTPException as e:
            logger.error("Failed to fetch user info for provider %s: %s", provider_name, getattr(e, 'detail', e))
            raise
    
    # Normalize user info across providers
    normalized_user = _normalize_user_info(provider_name, user_info)
    
    # Get JWT config
    jwt_secret = os.getenv("APP_JWT_SECRET", "dev-secret-key")
    jwt_algorithm = "HS256"
    jwt_expire_minutes = 60
    
    auth_config = settings.auth_config
    if auth_config and auth_config.jwt:
        jwt_secret = auth_config.jwt.secret_key
        jwt_algorithm = auth_config.jwt.algorithm
        jwt_expire_minutes = auth_config.jwt.access_token_expire_minutes
    
    # Create JWT with user information
    claims = {
        "sub": normalized_user["id"],
        "email": normalized_user["email"],
        "name": normalized_user.get("name"),
        "picture": normalized_user.get("picture"),
        "provider": provider_name,
        "roles": ["user"],  # Default role, customize as needed
        "plan": "free",     # Default plan, customize as needed
        "iat": int(time.time()),
        "exp": int(time.time()) + jwt_expire_minutes * 60,
    }
    
    token = jwt.encode(claims, jwt_secret, algorithm=jwt_algorithm)
    
    return Session(token=token)


async def _get_user_info(client: httpx.AsyncClient, provider: OAuthProvider, access_token: str) -> Dict[str, Any]:
    """Get user info from OAuth provider"""
    headers = {"Authorization": f"Bearer {access_token}"}
    
    # GitHub requires User-Agent header
    if provider.name == "GitHub":
        headers["User-Agent"] = "Webapp-Factory"
    
    user_response = await client.get(provider.user_info_url, headers=headers)
    if user_response.status_code != 200:
        logger.error("User info request failed for provider %s: status=%s body=%s", provider.name, user_response.status_code, user_response.text)
        raise HTTPException(
            status_code=400,
            detail=f"Failed to get user info: {user_response.text}"
        )
    
    return user_response.json()


def _normalize_user_info(provider_name: str, user_info: Dict[str, Any]) -> Dict[str, Any]:
    """Normalize user info across different OAuth providers"""
    
    if provider_name == "google":
        return {
            "id": user_info.get("id", user_info.get("sub")),
            "email": user_info.get("email"),
            "name": user_info.get("name"),
            "picture": user_info.get("picture"),
        }
    
    elif provider_name == "github":
        return {
            "id": str(user_info.get("id")),
            "email": user_info.get("email"),
            "name": user_info.get("name") or user_info.get("login"),
            "picture": user_info.get("avatar_url"),
        }
    
    elif provider_name == "slack":
        user_data = user_info.get("user", {})
        return {
            "id": user_data.get("id"),
            "email": user_data.get("email"),
            "name": user_data.get("name"),
            "picture": user_data.get("image_192"),
        }
    
    # Default fallback
    return {
        "id": user_info.get("id", user_info.get("sub")),
        "email": user_info.get("email"),
        "name": user_info.get("name"),
        "picture": user_info.get("picture"),
    }


async def get_current_user(request) -> Optional[dict]:
    """
    Get current user from session cookie.
    
    Args:
        request: FastAPI request object
        
    Returns:
        User dict or None
    """
    session_token = request.cookies.get("session")
    
    if not session_token:
        return None
    
    try:
        # Get JWT config
        jwt_secret = os.getenv("APP_JWT_SECRET", "dev-secret-key")
        jwt_algorithm = "HS256"
        
        auth_config = settings.auth_config
        if auth_config and auth_config.jwt:
            jwt_secret = auth_config.jwt.secret_key
            jwt_algorithm = auth_config.jwt.algorithm
            
        # Decode and verify JWT
        payload = jwt.decode(
            session_token,
            jwt_secret,
            algorithms=[jwt_algorithm],
            options={"verify_exp": True}
        )
        
        return {
            "id": payload.get("sub"),
            "email": payload.get("email"),
            "name": payload.get("name"),
            "picture": payload.get("picture"),
            "roles": payload.get("roles", []),
            "plan": payload.get("plan"),
        }
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None


def logout_user(response):
    """Delete session cookie."""
    response.delete_cookie("session")

