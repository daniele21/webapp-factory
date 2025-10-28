"""
Security Headers Middleware

Adds security headers to all responses:
- Content Security Policy (CSP)
- X-Content-Type-Options
- X-Frame-Options
- X-XSS-Protection
- Referrer-Policy
- Permissions-Policy
"""

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response
import os
from typing import Callable

from ..settings import settings


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Add security headers to all responses"""
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        response = await call_next(request)
        
        # Get allowed origins for CSP
        allowed_origins = self._get_allowed_origins()
        
        # Build CSP header
        csp_directives = [
            "default-src 'self'",
            f"connect-src 'self' {' '.join(allowed_origins)} https://accounts.google.com https://oauth2.googleapis.com",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://accounts.google.com/gsi/client",
            "style-src 'self' 'unsafe-inline' https://accounts.google.com",
            "img-src 'self' data: https: blob:",
            "font-src 'self' data:",
            "frame-src 'self' https://accounts.google.com",
            "frame-ancestors 'self'",
        ]
        
        # Add CSP header
        response.headers["Content-Security-Policy"] = "; ".join(csp_directives)
        
        # Prevent MIME type sniffing
        response.headers["X-Content-Type-Options"] = "nosniff"
        
        # Prevent clickjacking
        response.headers["X-Frame-Options"] = "SAMEORIGIN"
        
        # XSS protection (legacy browsers)
        response.headers["X-XSS-Protection"] = "1; mode=block"
        
        # Referrer policy
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        
        # Permissions policy (disable unnecessary features)
        response.headers["Permissions-Policy"] = (
            "accelerometer=(), camera=(), geolocation=(), gyroscope=(), "
            "magnetometer=(), microphone=(), payment=(), usb=()"
        )
        
        # HSTS (only in production with HTTPS)
        if settings.ENV == "production":
            response.headers["Strict-Transport-Security"] = (
                "max-age=31536000; includeSubDomains; preload"
            )
        
        return response
    
    def _get_allowed_origins(self) -> list[str]:
        """Get list of allowed origins for CSP"""
        origins = []
        
        auth_config = getattr(settings, "auth_config", None)
        if auth_config and hasattr(auth_config, "cors_origins"):
            origins.extend(auth_config.cors_origins)
        
        env_origins = os.getenv("APP_CORS_ORIGINS")
        if env_origins:
            origins.extend(env_origins.split(","))
        
        return [o.strip() for o in origins]
