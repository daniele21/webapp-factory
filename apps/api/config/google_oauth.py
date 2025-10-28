"""
Google OAuth Configuration Module

This module provides configuration management for Google OAuth settings.
It supports both environment variables and JSON configuration files.

Usage:
    from config.google_oauth import get_google_oauth_config
    
    config = get_google_oauth_config()
    print(config.client_id)
"""

import os
from typing import Optional
from pydantic import BaseModel, Field


class GoogleOAuthConfig(BaseModel):
    """Google OAuth configuration"""
    
    client_id: str = Field(
        description="Google OAuth client ID"
    )
    
    client_secret: str = Field(
        description="Google OAuth client secret"
    )
    
    scopes: list[str] = Field(
        default=["openid", "email", "profile"],
        description="OAuth scopes to request"
    )
    
    workspace_domain: Optional[str] = Field(
        default=None,
        description="Optional Google Workspace domain to restrict login to"
    )
    
    refresh_token_key: Optional[str] = Field(
        default=None,
        description="Encryption key for refresh tokens (required in production)"
    )
    
    id_token_verification_enabled: bool = Field(
        default=True,
        description="Whether to verify ID token signature and claims"
    )
    
    jwks_cache_ttl_hours: int = Field(
        default=1,
        description="How long to cache Google's JWKS keys (hours)"
    )


def get_google_oauth_config() -> GoogleOAuthConfig:
    """
    Get Google OAuth configuration from environment or settings.
    
    Priority:
    1. Environment variables (APP_GOOGLE_CLIENT_ID, etc.)
    2. Plain environment variables (GOOGLE_CLIENT_ID, etc.)
    3. Settings object
    
    Returns:
        GoogleOAuthConfig instance
        
    Raises:
        ValueError: If required configuration is missing
    """
    from ..settings import settings
    
    # Get client ID
    client_id = (
        os.getenv("APP_GOOGLE_CLIENT_ID")
        or os.getenv("GOOGLE_CLIENT_ID")
        or getattr(settings, "GOOGLE_CLIENT_ID", None)
    )
    
    if not client_id:
        raise ValueError(
            "Google OAuth client ID not configured. "
            "Set APP_GOOGLE_CLIENT_ID or GOOGLE_CLIENT_ID"
        )
    
    # Get client secret
    client_secret = (
        os.getenv("APP_GOOGLE_CLIENT_SECRET")
        or os.getenv("GOOGLE_CLIENT_SECRET")
        or getattr(settings, "GOOGLE_CLIENT_SECRET", None)
    )
    
    if not client_secret:
        raise ValueError(
            "Google OAuth client secret not configured. "
            "Set APP_GOOGLE_CLIENT_SECRET or GOOGLE_CLIENT_SECRET"
        )
    
    # Get optional settings
    workspace_domain = (
        os.getenv("APP_GOOGLE_WORKSPACE_DOMAIN")
        or os.getenv("GOOGLE_WORKSPACE_DOMAIN")
    )
    
    refresh_token_key = (
        os.getenv("APP_REFRESH_TOKEN_KEY")
        or os.getenv("REFRESH_TOKEN_KEY")
    )
    
    # Scopes (comma-separated in env)
    scopes_str = os.getenv("APP_GOOGLE_OAUTH_SCOPES")
    if scopes_str:
        scopes = [s.strip() for s in scopes_str.split(",")]
    else:
        scopes = ["openid", "email", "profile"]
    
    return GoogleOAuthConfig(
        client_id=client_id,
        client_secret=client_secret,
        scopes=scopes,
        workspace_domain=workspace_domain,
        refresh_token_key=refresh_token_key,
    )


def validate_production_config() -> bool:
    """
    Validate that required configuration for production is present.
    
    Returns:
        True if valid, raises ValueError if invalid
    """
    from ..settings import settings
    
    config = get_google_oauth_config()
    
    # Check refresh token key in production
    if settings.ENV == "production" and not config.refresh_token_key:
        raise ValueError(
            "Production environment requires APP_REFRESH_TOKEN_KEY to be set. "
            "Generate one with: python -c \"from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())\""
        )
    
    # Check HTTPS requirement for production
    cors_origins = getattr(settings, "cors_origins", [])
    if settings.ENV == "production":
        for origin in cors_origins:
            if origin.startswith("http://") and not origin.startswith("http://localhost"):
                raise ValueError(
                    f"Production environment should use HTTPS origins only. Found: {origin}"
                )
    
    return True
