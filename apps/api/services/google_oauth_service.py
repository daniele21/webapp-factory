"""
Google OAuth Service with GIS Authorization Code Flow (Popup Mode)

This module implements secure Google OAuth authentication using:
- Google Identity Services (GIS) Authorization Code model
- Popup UX (ux_mode: 'popup')
- Server-side token exchange
- ID token verification
- Refresh token rotation
- CSRF protection

References:
- https://developers.google.com/identity/gsi/web/guides/overview
- https://developers.google.com/identity/protocols/oauth2/web-server
"""

import os
import secrets
import logging
import time
from typing import Optional, Dict, Any
from datetime import datetime, timedelta
import httpx
import jwt as pyjwt
from cryptography.fernet import Fernet
from fastapi import HTTPException

from ..settings import settings

logger = logging.getLogger("uvicorn.error")


class GoogleOAuthService:
    """Service for handling Google OAuth with GIS Authorization Code flow"""
    
    TOKEN_URL = "https://oauth2.googleapis.com/token"
    REVOKE_URL = "https://oauth2.googleapis.com/revoke"
    USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo"
    JWKS_URL = "https://www.googleapis.com/oauth2/v3/certs"
    ISSUER = "https://accounts.google.com"
    
    def __init__(self):
        """Initialize Google OAuth service"""
        self.client_id = self._get_client_id()
        self.client_secret = self._get_client_secret()
        self.encryption_key = self._get_encryption_key()
        self.fernet = Fernet(self.encryption_key)
        
        # Cache for JWKS keys (Google's public keys for ID token verification)
        self._jwks_cache: Optional[Dict] = None
        self._jwks_cache_time: Optional[datetime] = None
        self._jwks_cache_ttl = timedelta(hours=1)
    
    def _get_client_id(self) -> str:
        """Get Google OAuth client ID from environment"""
        client_id = (
            os.getenv("APP_GOOGLE_CLIENT_ID") 
            or os.getenv("GOOGLE_CLIENT_ID")
            or getattr(settings, "GOOGLE_CLIENT_ID", None)
        )
        if not client_id:
            raise HTTPException(
                status_code=500,
                detail="Google OAuth not configured. Set APP_GOOGLE_CLIENT_ID or GOOGLE_CLIENT_ID"
            )
        return client_id
    
    def _get_client_secret(self) -> str:
        """Get Google OAuth client secret from environment"""
        client_secret = (
            os.getenv("APP_GOOGLE_CLIENT_SECRET")
            or os.getenv("GOOGLE_CLIENT_SECRET")
            or getattr(settings, "GOOGLE_CLIENT_SECRET", None)
        )
        if not client_secret:
            raise HTTPException(
                status_code=500,
                detail="Google OAuth not configured. Set APP_GOOGLE_CLIENT_SECRET or GOOGLE_CLIENT_SECRET"
            )
        return client_secret
    
    def _get_encryption_key(self) -> bytes:
        """Get or generate encryption key for refresh tokens"""
        key_str = os.getenv("APP_REFRESH_TOKEN_KEY")
        if key_str:
            return key_str.encode()
        
        # Generate a key for development (in production, this MUST be configured)
        if settings.ENV == "production":
            raise HTTPException(
                status_code=500,
                detail="Production requires APP_REFRESH_TOKEN_KEY to be set"
            )
        
        logger.warning("Using generated encryption key for refresh tokens (dev only)")
        return Fernet.generate_key()
    
    def get_authorization_config(self, redirect_uri: str) -> Dict[str, Any]:
        """
        Get configuration for Google Identity Services (GIS) client
        
        This config should be used in the frontend to initialize the GIS client.
        For popup mode, redirect_uri MUST be the page origin.
        
        Args:
            redirect_uri: The origin URL (e.g., https://app.example.com)
            
        Returns:
            Configuration dict for GIS client
        """
        return {
            "client_id": self.client_id,
            "redirect_uri": redirect_uri,
            "scope": "openid email profile",
            "response_type": "code",
            "access_type": "offline",  # Request refresh token
            "prompt": "consent",  # Always show consent to ensure refresh token
            "ux_mode": "popup",  # Use popup mode
            "state": secrets.token_urlsafe(32),  # CSRF protection
        }
    
    async def exchange_code(
        self, 
        code: str, 
        redirect_uri: str,
        state: Optional[str] = None,
        expected_domain: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Exchange authorization code for tokens
        
        This implements the server-side token exchange per Google's OAuth2 spec.
        For popup flow, redirect_uri must match the page origin.
        
        Args:
            code: Authorization code from GIS popup
            redirect_uri: Must match the redirect_uri used in authorization request
            state: CSRF token (should be validated by caller)
            expected_domain: Optional Google Workspace domain (hd claim) to restrict to
            
        Returns:
            Dict with access_token, refresh_token, id_token, user_info
        """
        async with httpx.AsyncClient() as client:
            # Exchange code for tokens
            token_data = {
                "code": code,
                "client_id": self.client_id,
                "client_secret": self.client_secret,
                "redirect_uri": redirect_uri,
                "grant_type": "authorization_code",
            }
            
            logger.info("Exchanging authorization code for tokens")
            response = await client.post(self.TOKEN_URL, data=token_data)
            
            if response.status_code != 200:
                logger.error(
                    "Token exchange failed: status=%s body=%s",
                    response.status_code,
                    response.text
                )
                raise HTTPException(
                    status_code=400,
                    detail=f"Failed to exchange authorization code: {response.text}"
                )
            
            tokens = response.json()
            access_token = tokens.get("access_token")
            refresh_token = tokens.get("refresh_token")
            id_token = tokens.get("id_token")
            
            if not access_token or not id_token:
                raise HTTPException(
                    status_code=400,
                    detail="Missing required tokens in response"
                )
            
            # Verify and decode ID token
            user_info = await self.verify_id_token(id_token, expected_domain)
            
            # Encrypt refresh token if present
            encrypted_refresh_token = None
            if refresh_token:
                encrypted_refresh_token = self.fernet.encrypt(
                    refresh_token.encode()
                ).decode()
            
            return {
                "access_token": access_token,
                "refresh_token": encrypted_refresh_token,
                "id_token": id_token,
                "user_info": user_info,
                "expires_in": tokens.get("expires_in", 3600),
            }
    
    async def verify_id_token(
        self,
        id_token: str,
        expected_domain: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Verify Google ID token and extract claims
        
        Verifies:
        - Signature using Google's public keys
        - Issuer (iss): accounts.google.com or https://accounts.google.com
        - Audience (aud): matches our client_id
        - Expiration (exp): token not expired
        - Issued at (iat): token not issued in future
        - Hosted domain (hd): optional, restrict to Google Workspace domain
        
        Args:
            id_token: The ID token from Google
            expected_domain: Optional Google Workspace domain to restrict to
            
        Returns:
            Decoded and verified claims
        """
        try:
            # Get Google's public keys for verification
            jwks = await self._get_jwks()
            
            # Decode header to get key ID
            unverified_header = pyjwt.get_unverified_header(id_token)
            kid = unverified_header.get("kid")
            
            if not kid:
                raise HTTPException(
                    status_code=400,
                    detail="ID token missing key ID"
                )
            
            # Find the matching public key
            key = None
            for jwk_key in jwks.get("keys", []):
                if jwk_key.get("kid") == kid:
                    key = pyjwt.algorithms.RSAAlgorithm.from_jwk(jwk_key)
                    break
            
            if not key:
                raise HTTPException(
                    status_code=400,
                    detail="Unable to find matching public key for ID token"
                )
            
            # Verify and decode the token
            claims = pyjwt.decode(
                id_token,
                key=key,
                algorithms=["RS256"],
                audience=self.client_id,
                issuer=[self.ISSUER, "accounts.google.com"],
                options={
                    "verify_signature": True,
                    "verify_exp": True,
                    "verify_iat": True,
                    "verify_aud": True,
                    "verify_iss": True,
                }
            )
            
            # Verify hosted domain if specified
            if expected_domain:
                hd = claims.get("hd")
                if hd != expected_domain:
                    raise HTTPException(
                        status_code=403,
                        detail=f"User not from expected domain: {expected_domain}"
                    )
            
            logger.info(
                "ID token verified successfully for user: %s",
                claims.get("email")
            )
            
            return {
                "id": claims.get("sub"),
                "email": claims.get("email"),
                "email_verified": claims.get("email_verified", False),
                "name": claims.get("name"),
                "picture": claims.get("picture"),
                "given_name": claims.get("given_name"),
                "family_name": claims.get("family_name"),
                "locale": claims.get("locale"),
                "hd": claims.get("hd"),  # Hosted domain (for Workspace)
            }
            
        except pyjwt.ExpiredSignatureError:
            raise HTTPException(status_code=401, detail="ID token has expired")
        except pyjwt.InvalidAudienceError:
            raise HTTPException(status_code=401, detail="Invalid ID token audience")
        except pyjwt.InvalidIssuerError:
            raise HTTPException(status_code=401, detail="Invalid ID token issuer")
        except pyjwt.InvalidTokenError as e:
            logger.error("ID token validation failed: %s", str(e))
            raise HTTPException(status_code=401, detail="Invalid ID token")
    
    async def _get_jwks(self) -> Dict:
        """Get Google's JWKS (public keys) with caching"""
        now = datetime.utcnow()
        
        # Return cached keys if still valid
        if (
            self._jwks_cache 
            and self._jwks_cache_time
            and now - self._jwks_cache_time < self._jwks_cache_ttl
        ):
            return self._jwks_cache
        
        # Fetch fresh keys
        async with httpx.AsyncClient() as client:
            response = await client.get(self.JWKS_URL)
            
            if response.status_code != 200:
                logger.error("Failed to fetch JWKS: %s", response.text)
                raise HTTPException(
                    status_code=500,
                    detail="Failed to fetch Google public keys"
                )
            
            self._jwks_cache = response.json()
            self._jwks_cache_time = now
            
            return self._jwks_cache
    
    async def refresh_access_token(self, encrypted_refresh_token: str) -> Dict[str, Any]:
        """
        Refresh access token using refresh token
        
        Implements refresh token rotation: returns new access token and
        optionally a new refresh token.
        
        Args:
            encrypted_refresh_token: Encrypted refresh token
            
        Returns:
            New tokens
        """
        try:
            # Decrypt refresh token
            refresh_token = self.fernet.decrypt(
                encrypted_refresh_token.encode()
            ).decode()
        except Exception as e:
            logger.error("Failed to decrypt refresh token: %s", str(e))
            raise HTTPException(
                status_code=401,
                detail="Invalid refresh token"
            )
        
        async with httpx.AsyncClient() as client:
            token_data = {
                "client_id": self.client_id,
                "client_secret": self.client_secret,
                "refresh_token": refresh_token,
                "grant_type": "refresh_token",
            }
            
            response = await client.post(self.TOKEN_URL, data=token_data)
            
            if response.status_code != 200:
                logger.error(
                    "Token refresh failed: status=%s body=%s",
                    response.status_code,
                    response.text
                )
                raise HTTPException(
                    status_code=401,
                    detail="Failed to refresh access token"
                )
            
            tokens = response.json()
            
            # If Google returns a new refresh token, encrypt it
            new_refresh_token = tokens.get("refresh_token")
            if new_refresh_token:
                encrypted_new_refresh = self.fernet.encrypt(
                    new_refresh_token.encode()
                ).decode()
            else:
                # Reuse the existing refresh token
                encrypted_new_refresh = encrypted_refresh_token
            
            return {
                "access_token": tokens.get("access_token"),
                "refresh_token": encrypted_new_refresh,
                "expires_in": tokens.get("expires_in", 3600),
            }
    
    async def revoke_token(self, encrypted_refresh_token: str) -> bool:
        """
        Revoke a refresh token
        
        This should be called during logout to invalidate the user's
        Google session.
        
        Args:
            encrypted_refresh_token: Encrypted refresh token to revoke
            
        Returns:
            True if revoked successfully
        """
        try:
            # Decrypt refresh token
            refresh_token = self.fernet.decrypt(
                encrypted_refresh_token.encode()
            ).decode()
        except Exception as e:
            logger.error("Failed to decrypt refresh token for revocation: %s", str(e))
            return False
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                self.REVOKE_URL,
                data={"token": refresh_token},
                headers={"Content-Type": "application/x-www-form-urlencoded"}
            )
            
            # Google returns 200 for successful revocation
            if response.status_code == 200:
                logger.info("Successfully revoked refresh token")
                return True
            else:
                logger.warning(
                    "Token revocation returned status %s: %s",
                    response.status_code,
                    response.text
                )
                return False


# Singleton instance
_google_oauth_service: Optional[GoogleOAuthService] = None


def get_google_oauth_service() -> GoogleOAuthService:
    """Get or create GoogleOAuthService singleton"""
    global _google_oauth_service
    if _google_oauth_service is None:
        _google_oauth_service = GoogleOAuthService()
    return _google_oauth_service
