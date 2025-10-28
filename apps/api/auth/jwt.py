from datetime import datetime, timedelta, timezone
from typing import Optional
import os
import jwt
from fastapi import HTTPException, status

APP_JWT_AUDIENCE = os.getenv("APP_JWT_AUDIENCE", "webapp-factory")
APP_JWT_ISSUER = os.getenv("APP_JWT_ISSUER", "https://api.example.com")
APP_JWT_ALG = os.getenv("APP_JWT_ALG", "HS256")  # For RS256 use public/private keys + JWKS
APP_JWT_SECRET = os.getenv("APP_JWT_SECRET", "dev-secret-change-me")


class JWTError(HTTPException):
    """Custom JWT authentication error."""
    
    def __init__(self, detail: str = "Invalid or expired token"):
        super().__init__(status_code=status.HTTP_401_UNAUTHORIZED, detail=detail)


def sign_access_jwt(
    *,
    sub: str,
    email: Optional[str] = None,
    orgId: Optional[str] = None,
    roles: list[str] | None = None,
    plan: Optional[str] = None,
    features: list[str] | None = None,
    ttl_minutes: int = 15,
) -> str:
    """
    Sign a JWT access token with the provided claims.
    
    Args:
        sub: Subject (user ID)
        email: User email
        orgId: Organization ID
        roles: List of user roles
        plan: User's subscription plan
        features: List of enabled features
        ttl_minutes: Token expiration time in minutes (default: 15)
    
    Returns:
        JWT token string
    """
    now = datetime.now(timezone.utc)
    payload = {
        "sub": sub,
        "email": email,
        "orgId": orgId,
        "roles": roles or [],
        "plan": plan,
        "features": features or [],
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(minutes=ttl_minutes)).timestamp()),
        "aud": APP_JWT_AUDIENCE,
        "iss": APP_JWT_ISSUER,
    }
    return jwt.encode(payload, APP_JWT_SECRET, algorithm=APP_JWT_ALG)


def verify_access_jwt(token: str) -> dict:
    """
    Verify and decode a JWT access token.
    
    Args:
        token: JWT token string
    
    Returns:
        Dictionary containing token claims
    
    Raises:
        JWTError: If token is invalid or expired
    """
    if not token:
        raise JWTError("Invalid token")

    try:
        # Decode and verify signature/audience/issuer/exp automatically.
        # Do not force 'sub' to be required by the jwt library so we can
        # provide a clearer, custom error message when missing.
        claims = jwt.decode(
            token,
            APP_JWT_SECRET,
            algorithms=[APP_JWT_ALG],
            audience=APP_JWT_AUDIENCE,
        )
    except jwt.ExpiredSignatureError:
        raise JWTError("Token expired")
    except jwt.InvalidTokenError:
        raise JWTError("Invalid token")
    
    # Basic sanity checks
    if not claims.get("sub"):
        # If token decoded successfully but subject is missing, raise a
        # specific error to help callers distinguish this case from a
        # generic invalid token.
        raise JWTError("Missing subject")
    
    return claims


# Development helper function
def create_test_jwt(
    user_id: str = "user_123",
    email: str = "demo@example.com",
    org_id: str = "org_abc",
    roles: list[str] | None = None,
    plan: str = "pro",
    features: list[str] | None = None,
    ttl_minutes: int = 60,
) -> str:
    """Create a test JWT token for development purposes."""
    return sign_access_jwt(
        sub=user_id,
        email=email,
        orgId=org_id,
        roles=roles if roles is not None else ["owner"],
        plan=plan,
        features=features if features is not None else ["vector_search"],
        ttl_minutes=ttl_minutes,
    )


def create_preset_tokens() -> dict[str, str]:
    """Create a set of preset JWT tokens for different user scenarios."""
    presets = {
        "admin": create_test_jwt(
            user_id="admin_001",
            email="admin@example.com", 
            org_id="org_main",
            roles=["admin", "owner"],
            plan="enterprise",
            features=["vector_search", "ai_assistant", "advanced_analytics"],
        ),
        "owner": create_test_jwt(
            user_id="owner_001",
            email="owner@example.com",
            org_id="org_startup", 
            roles=["owner"],
            plan="pro",
            features=["vector_search", "ai_assistant"],
        ),
        "pro_user": create_test_jwt(
            user_id="user_pro_001",
            email="pro.user@example.com",
            org_id="org_company",
            roles=["member"],
            plan="pro", 
            features=["vector_search"],
        ),
        "free_user": create_test_jwt(
            user_id="user_free_001",
            email="free.user@example.com",
            org_id="org_personal",
            roles=["member"],
            plan="free",
            features=[],
        ),
    }
    return presets


if __name__ == "__main__":
    # Quick mint helper for development
    print("🔑 Sample JWT Tokens for Testing:\n")
    
    presets = create_preset_tokens()
    
    for name, token in presets.items():
        print(f"{name.upper()}:")
        print(f"  Token: {token}")
        claims = verify_access_jwt(token)
        print(f"  User:  {claims['email']} ({claims['sub']})")
        print(f"  Roles: {', '.join(claims['roles'])}")
        print(f"  Plan:  {claims['plan']}")
        print(f"  Org:   {claims['orgId']}")
        print()
    
    print("🧪 Quick test command:")
    print(f'export TOKEN="{presets["admin"]}"')
    print("curl -H \"Authorization: Bearer $TOKEN\" http://localhost:8000/protected/me")