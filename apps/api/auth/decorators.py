from functools import wraps
from typing import Callable, Any
from .models import AuthClaims


class GuardError(PermissionError):
    """Exception raised when authorization guards fail."""
    pass


def guard_roles(*allowed: str):
    """
    Decorator that enforces role-based access control on service functions.
    
    Args:
        *allowed: Role names that are allowed (case-insensitive)
    
    Usage:
        @guard_roles("admin", "owner")
        def delete_user(*, claims: AuthClaims, user_id: str):
            # Function implementation
            pass
    
    Raises:
        GuardError: If user doesn't have required role or claims are missing
    """
    allowed_norm = {r.lower() for r in allowed}
    
    def _wrap(fn: Callable) -> Callable:
        @wraps(fn)
        def _inner(*args, **kwargs):
            claims: AuthClaims = kwargs.get("claims")
            if not claims:
                raise GuardError("Missing authentication claims")
            
            user_roles = {r.lower() for r in (claims.roles or [])}
            if not allowed_norm.intersection(user_roles):
                raise GuardError(f"Insufficient role. Required: {', '.join(allowed)}")
            
            return fn(*args, **kwargs)
        return _inner
    return _wrap


def guard_plan(*plans: str):
    """
    Decorator that enforces plan-based access control on service functions.
    
    Args:
        *plans: Plan names that are allowed (case-insensitive)
    
    Usage:
        @guard_plan("pro", "enterprise")
        def advanced_analytics(*, claims: AuthClaims, org_id: str):
            # Function implementation
            pass
    
    Raises:
        GuardError: If user doesn't have required plan or claims are missing
    """
    plans_norm = {p.lower() for p in plans}
    
    def _wrap(fn: Callable) -> Callable:
        @wraps(fn)
        def _inner(*args, **kwargs):
            claims: AuthClaims = kwargs.get("claims")
            if not claims:
                raise GuardError("Missing authentication claims")
            
            plan = (claims.plan or "").lower()
            if plan not in plans_norm:
                raise GuardError(f"Upgrade required. Required plan: {', '.join(plans)}")
            
            return fn(*args, **kwargs)
        return _inner
    return _wrap


def guard_feature(feature: str):
    """
    Decorator that enforces feature flag access control on service functions.
    
    Args:
        feature: Feature flag name (case-insensitive)
    
    Usage:
        @guard_feature("vector_search")
        def vector_similarity_search(*, claims: AuthClaims, query: str):
            # Function implementation  
            pass
    
    Raises:
        GuardError: If feature is not enabled or claims are missing
    """
    feature_norm = feature.lower()
    
    def _wrap(fn: Callable) -> Callable:
        @wraps(fn)
        def _inner(*args, **kwargs):
            claims: AuthClaims = kwargs.get("claims")
            if not claims:
                raise GuardError("Missing authentication claims")
            
            features = {f.lower() for f in (claims.features or [])}
            if feature_norm not in features:
                raise GuardError(f"Feature '{feature}' not enabled")
            
            return fn(*args, **kwargs)
        return _inner
    return _wrap


def guard_org(org_param: str = "org_id"):
    """
    Decorator that enforces organization membership on service functions.
    
    Args:
        org_param: Name of the parameter containing the organization ID
    
    Usage:
        @guard_org("org_id")
        def update_org_settings(*, claims: AuthClaims, org_id: str, settings: dict):
            # Function implementation
            pass
    
    Raises:
        GuardError: If user doesn't belong to org or claims/org_id are missing
    """
    def _wrap(fn: Callable) -> Callable:
        @wraps(fn)
        def _inner(*args, **kwargs):
            claims: AuthClaims = kwargs.get("claims")
            if not claims:
                raise GuardError("Missing authentication claims")
            
            org_id = kwargs.get(org_param)
            if not org_id:
                raise GuardError(f"Missing required parameter: {org_param}")
            
            if not claims.belongs_to_org(org_id):
                raise GuardError("Access denied: organization mismatch")
            
            return fn(*args, **kwargs)
        return _inner
    return _wrap


def guard_authenticated(fn: Callable) -> Callable:
    """
    Simple decorator that ensures authentication claims are present.
    
    Usage:
        @guard_authenticated
        def get_user_profile(*, claims: AuthClaims):
            # Function implementation
            pass
    
    Raises:
        GuardError: If claims are missing
    """
    @wraps(fn)
    def _inner(*args, **kwargs):
        claims: AuthClaims = kwargs.get("claims")
        if not claims:
            raise GuardError("Authentication required")
        return fn(*args, **kwargs)
    return _inner


def combine_guards(*guards):
    """
    Combine multiple guards into a single decorator.
    
    Args:
        *guards: Guard decorators to combine
    
    Usage:
        @combine_guards(guard_roles("admin"), guard_plan("enterprise"))
        def admin_enterprise_function(*, claims: AuthClaims):
            # Function implementation
            pass
    """
    def _wrap(fn: Callable) -> Callable:
        for guard in reversed(guards):
            fn = guard(fn)
        return fn
    return _wrap