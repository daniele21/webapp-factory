"""
Authentication configuration for the Webapp Factory API.

This module contains all authentication-related configuration including:
- JWT token settings
- OAuth provider configurations  
- Security policies
- Session management
"""

from typing import List, Optional
from pydantic import Field, validator
from .base import BaseConfig, Environment


class JWTConfig(BaseConfig):
    """JWT token configuration."""
    
    # Core JWT settings
    secret_key: str = Field(
        default="your-secret-key-here-change-in-production",
        description="Secret key for JWT signing (minimum 256 bits for HS256)",
        min_length=32
    )
    
    algorithm: str = Field(
        default="HS256",
        description="JWT signing algorithm"
    )
    
    # Token expiration
    access_token_expire_minutes: int = Field(
        default=15,
        description="Access token expiration in minutes",
        ge=1,
        le=1440  # Max 24 hours
    )
    
    refresh_token_expire_days: int = Field(
        default=30,
        description="Refresh token expiration in days",
        ge=1,
        le=365  # Max 1 year
    )
    
    # JWT Claims
    issuer: str = Field(
        default="webapp-factory-api",
        description="JWT issuer (iss claim)"
    )
    
    audience: str = Field(
        default="webapp-factory-app",
        description="JWT audience (aud claim)"
    )
    
    @validator('secret_key')
    def validate_secret_key(cls, v):
        """Ensure secret key is strong enough for production."""
        if len(v) < 32:
            raise ValueError("JWT secret key must be at least 32 characters long")
        if v == "your-secret-key-here-change-in-production":
            # Allow default only in development/testing
            import os
            env = os.getenv("APP_ENV", "development")
            if env == "production":
                raise ValueError("Must set a custom JWT secret key in production")
        return v


class OAuthProviderConfig(BaseConfig):
    """OAuth provider configuration."""
    
    provider_name: str = Field(description="OAuth provider name (e.g., 'google', 'github')")
    client_id: str = Field(description="OAuth client ID")
    client_secret: str = Field(description="OAuth client secret")
    
    # OAuth 2.0 URLs
    authorization_url: Optional[str] = Field(
        default=None,
        description="OAuth authorization URL"
    )
    token_url: Optional[str] = Field(
        default=None, 
        description="OAuth token exchange URL"
    )
    user_info_url: Optional[str] = Field(
        default=None,
        description="URL to fetch user information"
    )
    
    # Scopes
    scopes: List[str] = Field(
        default_factory=list,
        description="OAuth scopes to request"
    )


class GoogleOAuthConfig(OAuthProviderConfig):
    """Google OAuth configuration with defaults."""
    
    provider_name: str = "google"
    authorization_url: str = "https://accounts.google.com/o/oauth2/v2/auth"
    token_url: str = "https://oauth2.googleapis.com/token"
    user_info_url: str = "https://www.googleapis.com/oauth2/v2/userinfo"
    scopes: List[str] = ["openid", "email", "profile"]


class SecurityPolicyConfig(BaseConfig):
    """Security policy configuration."""
    
    # Password requirements
    min_password_length: int = Field(
        default=8,
        description="Minimum password length",
        ge=6
    )
    
    require_password_uppercase: bool = Field(
        default=True,
        description="Require at least one uppercase letter in passwords"
    )
    
    require_password_lowercase: bool = Field(
        default=True,
        description="Require at least one lowercase letter in passwords"
    )
    
    require_password_numbers: bool = Field(
        default=True,
        description="Require at least one number in passwords"
    )
    
    require_password_special_chars: bool = Field(
        default=False,
        description="Require at least one special character in passwords"
    )
    
    # Session security
    max_sessions_per_user: int = Field(
        default=5,
        description="Maximum concurrent sessions per user",
        ge=1
    )
    
    session_timeout_minutes: int = Field(
        default=60,
        description="Session timeout in minutes",
        ge=5
    )
    
    # Account security
    max_login_attempts: int = Field(
        default=5,
        description="Maximum failed login attempts before lockout",
        ge=1
    )
    
    lockout_duration_minutes: int = Field(
        default=15,
        description="Account lockout duration in minutes",
        ge=1
    )
    
    # Multi-factor authentication
    mfa_enabled: bool = Field(
        default=False,
        description="Enable multi-factor authentication"
    )
    
    mfa_required_for_admin: bool = Field(
        default=True,
        description="Require MFA for admin users"
    )


class RoleConfig(BaseConfig):
    """Role-based access control configuration."""
    
    # Default roles
    default_user_role: str = Field(
        default="user",
        description="Default role assigned to new users"
    )
    
    admin_role: str = Field(
        default="admin",
        description="Admin role name"
    )
    
    # Role hierarchy (higher number = more permissions)
    role_hierarchy: dict = Field(
        default_factory=lambda: {
            "guest": 0,
            "user": 10,
            "moderator": 20,
            "admin": 30,
            "super_admin": 40,
        },
        description="Role hierarchy with permission levels"
    )
    
    # Permission inheritance
    inherit_permissions: bool = Field(
        default=True,
        description="Whether higher roles inherit lower role permissions"
    )


class AuthConfig(BaseConfig):
    """Main authentication configuration."""
    
    environment: Environment = Field(
        default=Environment.DEVELOPMENT,
        description="Application environment"
    )
    
    # Component configurations
    jwt: JWTConfig = Field(default_factory=JWTConfig)
    security_policy: SecurityPolicyConfig = Field(default_factory=SecurityPolicyConfig)
    roles: RoleConfig = Field(default_factory=RoleConfig)
    
    # OAuth providers
    google_oauth: Optional[GoogleOAuthConfig] = Field(
        default=None,
        description="Google OAuth configuration"
    )
    
    # Custom OAuth providers
    oauth_providers: List[OAuthProviderConfig] = Field(
        default_factory=list,
        description="Additional OAuth providers"
    )
    
    # Redirect URLs
    oauth_redirect_uri: str = Field(
        default="http://127.0.0.1:5173/auth/callback",
        description="OAuth redirect URI"
    )
    
    # CORS settings for auth endpoints
    cors_origins: List[str] = Field(
        default_factory=lambda: [
            "http://localhost:3000",
            "http://127.0.0.1:5173",
            "http://localhost:8080",
        ],
        description="Allowed CORS origins for auth endpoints"
    )
    
    # Auth endpoints
    auth_endpoints_enabled: bool = Field(
        default=True,
        description="Enable auth endpoints (/auth/login, /auth/callback, etc.)"
    )
    
    # Cookie settings
    cookie_domain: Optional[str] = Field(
        default=None,
        description="Cookie domain for auth cookies"
    )
    
    cookie_secure: bool = Field(
        default=False,
        description="Use secure cookies (HTTPS only)"
    )
    
    cookie_httponly: bool = Field(
        default=True,
        description="Use HTTP-only cookies"
    )
    
    cookie_samesite: str = Field(
        default="lax",
        description="SameSite cookie policy"
    )
    
    @validator('cors_origins')
    def validate_cors_origins(cls, v):
        """Validate CORS origins format."""
        for origin in v:
            if not origin.startswith(('http://', 'https://')):
                raise ValueError(f"CORS origin must include protocol: {origin}")
        return v
    
    def get_oauth_provider(self, provider_name: str) -> Optional[OAuthProviderConfig]:
        """Get OAuth provider configuration by name."""
        if provider_name == "google" and self.google_oauth:
            return self.google_oauth
        
        for provider in self.oauth_providers:
            if provider.provider_name == provider_name:
                return provider
        
        return None
    
    def is_production_ready(self) -> bool:
        """Check if auth configuration is ready for production."""
        if self.environment != Environment.PRODUCTION:
            return True
        
        # Check JWT secret
        if self.jwt.secret_key == "your-secret-key-here-change-in-production":
            return False
        
        # Check security settings
        if not self.cookie_secure:
            return False
        
        # Check OAuth configuration
        if self.google_oauth and not self.google_oauth.client_secret:
            return False
        
        return True


# Default configuration instances
def get_auth_config() -> AuthConfig:
    """Get authentication configuration from environment variables."""
    return AuthConfig()


def get_jwt_config() -> JWTConfig:
    """Get JWT configuration from environment variables."""
    return JWTConfig()


# Configuration validation
def validate_auth_config(config: AuthConfig) -> List[str]:
    """Validate authentication configuration and return list of issues."""
    issues = []
    
    if config.environment == Environment.PRODUCTION:
        if not config.is_production_ready():
            issues.append("Configuration is not production ready")
        
        if config.jwt.secret_key == "your-secret-key-here-change-in-production":
            issues.append("JWT secret key must be changed in production")
        
        if not config.cookie_secure:
            issues.append("Secure cookies should be enabled in production")
        
        if config.jwt.access_token_expire_minutes > 60:
            issues.append("Consider shorter access token expiration in production")
    
    return issues