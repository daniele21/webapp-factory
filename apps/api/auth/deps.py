from fastapi import Depends, Header, HTTPException, Request, status
from .jwt import verify_access_jwt
from .models import AuthClaims


def _extract_bearer_token(authorization: str | None) -> str:
    """Extract bearer token from Authorization header."""
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="Missing bearer token"
        )
    return authorization.split(" ", 1)[1].strip()


def auth_required(authorization: str | None = Header(None)) -> AuthClaims:
    """
    FastAPI dependency that requires a valid JWT token.
    
    Returns:
        AuthClaims: Validated claims from the JWT token
    
    Raises:
        HTTPException: 401 if token is missing or invalid
    """
    token = _extract_bearer_token(authorization)
    claims_dict = verify_access_jwt(token)
    return AuthClaims(**claims_dict)


def require_roles(*allowed: str):
    """
    FastAPI dependency factory that requires specific roles.
    
    Args:
        *allowed: Role names that are allowed (case-insensitive)
    
    Returns:
        Callable dependency function
    
    Raises:
        HTTPException: 403 if user doesn't have required role
    """
    allowed_norm = {r.lower() for r in allowed}
    
    def _dep(claims_or_auth: AuthClaims | str = Depends(auth_required)) -> AuthClaims:
        # Support being called directly in tests with an authorization header
        if isinstance(claims_or_auth, str):
            claims = auth_required(claims_or_auth)
        else:
            claims = claims_or_auth

        user_roles = {r.lower() for r in (claims.roles or [])}
        if not allowed_norm.intersection(user_roles):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Insufficient role. Required: {', '.join(allowed)}"
            )
        return claims
    
    return _dep


def require_plan(*plans: str):
    """
    FastAPI dependency factory that requires specific subscription plans.
    
    Args:
        *plans: Plan names that are allowed (case-insensitive)
    
    Returns:
        Callable dependency function
    
    Raises:
        HTTPException: 402 if user doesn't have required plan
    """
    plans_norm = {p.lower() for p in plans}
    
    def _dep(claims_or_auth: AuthClaims | str = Depends(auth_required)) -> AuthClaims:
        if isinstance(claims_or_auth, str):
            claims = auth_required(claims_or_auth)
        else:
            claims = claims_or_auth

        plan = (claims.plan or "").lower()
        if plan not in plans_norm:
            raise HTTPException(
                status_code=status.HTTP_402_PAYMENT_REQUIRED,
                detail=f"Upgrade required. Required plan: {', '.join(plans)}"
            )
        return claims
    
    return _dep


def require_feature(flag: str):
    """
    FastAPI dependency factory that requires a specific feature flag.
    
    Args:
        flag: Feature flag name (case-insensitive)
    
    Returns:
        Callable dependency function
    
    Raises:
        HTTPException: 403 if feature is not enabled for user
    """
    flag_norm = flag.lower()
    
    def _dep(claims_or_auth: AuthClaims | str = Depends(auth_required)) -> AuthClaims:
        if isinstance(claims_or_auth, str):
            claims = auth_required(claims_or_auth)
        else:
            claims = claims_or_auth

        features = {f.lower() for f in (claims.features or [])}
        if flag_norm not in features:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Feature '{flag}' not enabled"
            )
        return claims
    
    return _dep


def require_org(org_id_param: str = "org_id"):
    """
    FastAPI dependency factory that ensures user belongs to specified org.
    
    The organization ID can come from path parameters or query parameters.
    
    Args:
        org_id_param: Name of the parameter containing the org ID
    
    Returns:
        Callable dependency function
    
    Raises:
        HTTPException: 403 if user doesn't belong to the specified org
    """
    def _dep(
        claims_or_auth: AuthClaims | str = Depends(auth_required),
        request: Request = None
    ) -> AuthClaims:
        # Support direct calls where the first arg is an authorization header
        if isinstance(claims_or_auth, str):
            claims = auth_required(claims_or_auth)
        else:
            claims = claims_or_auth

        # Try to get org_id from path params first, then query params
        param_value = (
            request.path_params.get(org_id_param) or 
            request.query_params.get(org_id_param)
        )

        if not param_value:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Missing required parameter: {org_id_param}"
            )

        if not claims.belongs_to_org(param_value):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: organization mismatch"
            )

        return claims
    
    return _dep


def optional_auth(authorization: str | None = Header(None)) -> AuthClaims | None:
    """
    FastAPI dependency that optionally extracts auth claims if token is present.
    
    Returns:
        AuthClaims or None: Claims if valid token provided, None otherwise
    """
    if not authorization:
        return None
    
    try:
        token = _extract_bearer_token(authorization)
        claims_dict = verify_access_jwt(token)
        return AuthClaims(**claims_dict)
    except HTTPException:
        # Return None instead of raising error for optional auth
        return None