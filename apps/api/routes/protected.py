from fastapi import APIRouter, Depends, HTTPException, status
from typing import Dict, Any
from ..auth.deps import (
    auth_required, 
    require_roles, 
    require_plan, 
    require_feature, 
    require_org,
    optional_auth
)
from ..auth.models import AuthClaims

router = APIRouter(prefix="/protected", tags=["protected"])


@router.get("/me")
def get_current_user(claims: AuthClaims = Depends(auth_required)) -> Dict[str, Any]:
    """
    Get current user information from JWT claims.
    Requires valid authentication token.
    """
    return {
        "userId": claims.sub,
        "email": claims.email,
        "orgId": claims.orgId,
        "roles": claims.roles,
        "plan": claims.plan,
        "features": claims.features,
    }


@router.get("/admin/users")
def list_users_admin(claims: AuthClaims = Depends(require_roles("admin", "owner"))) -> Dict[str, Any]:
    """
    Admin endpoint to list all users.
    Requires 'admin' or 'owner' role.
    """
    return {
        "users": ["user1", "user2", "user3"],
        "total": 3,
        "requestedBy": claims.sub,
        "userRole": claims.roles,
    }


@router.get("/admin/system/health")
def system_health_admin(claims: AuthClaims = Depends(require_roles("admin"))) -> Dict[str, Any]:
    """
    System health endpoint restricted to admins only.
    Requires 'admin' role specifically.
    """
    return {
        "status": "healthy",
        "uptime": "24h 30m",
        "checkedBy": claims.sub,
    }


@router.get("/pro/export")
def export_data_pro(claims: AuthClaims = Depends(require_plan("pro", "enterprise"))) -> Dict[str, Any]:
    """
    Data export feature for Pro+ subscribers.
    Requires 'pro' or 'enterprise' subscription plan.
    """
    return {
        "status": "export_queued",
        "orgId": claims.orgId,
        "plan": claims.plan,
        "estimatedTime": "5 minutes",
    }


@router.get("/enterprise/analytics")
def advanced_analytics(claims: AuthClaims = Depends(require_plan("enterprise"))) -> Dict[str, Any]:
    """
    Advanced analytics for Enterprise customers.
    Requires 'enterprise' subscription plan.
    """
    return {
        "analytics": {
            "users": 150,
            "revenue": 45000,
            "growth": "12%"
        },
        "orgId": claims.orgId,
        "plan": claims.plan,
    }


@router.get("/labs/vector-search")
def vector_search_labs(claims: AuthClaims = Depends(require_feature("vector_search"))) -> Dict[str, Any]:
    """
    Vector search feature in labs.
    Requires 'vector_search' feature flag to be enabled.
    """
    return {
        "status": "feature_enabled",
        "feature": "vector_search",
        "userId": claims.sub,
        "availableModels": ["text-embedding-ada-002", "text-embedding-3-small"],
    }


@router.get("/labs/ai-assistant")
def ai_assistant_labs(claims: AuthClaims = Depends(require_feature("ai_assistant"))) -> Dict[str, Any]:
    """
    AI assistant feature in labs.
    Requires 'ai_assistant' feature flag to be enabled.
    """
    return {
        "status": "feature_enabled", 
        "feature": "ai_assistant",
        "userId": claims.sub,
        "models": ["gpt-4", "gpt-3.5-turbo"],
    }


@router.get("/org/{org_id}/settings")
def get_org_settings(
    org_id: str, 
    claims: AuthClaims = Depends(require_org("org_id"))
) -> Dict[str, Any]:
    """
    Get organization settings.
    Requires user to belong to the specified organization.
    """
    return {
        "orgId": org_id,
        "settings": {
            "name": f"Organization {org_id}",
            "plan": claims.plan,
            "userCount": 25,
        },
        "requestedBy": claims.sub,
    }


@router.put("/org/{org_id}/settings")
def update_org_settings(
    org_id: str,
    settings: Dict[str, Any],
    claims: AuthClaims = Depends(require_org("org_id"))
) -> Dict[str, Any]:
    """
    Update organization settings.
    Requires user to belong to the specified organization.
    """
    # In a real implementation, you'd validate and save the settings
    return {
        "orgId": org_id,
        "updatedSettings": settings,
        "updatedBy": claims.sub,
        "timestamp": "2024-01-01T12:00:00Z",
    }


@router.get("/org/{org_id}/admin/billing")
def org_billing_admin(
    org_id: str,
    claims: AuthClaims = Depends(require_roles("admin", "owner"))
) -> Dict[str, Any]:
    """
    Get organization billing information.
    Requires 'admin' or 'owner' role AND user must belong to the org.
    
    Note: This combines role-based and org-based authorization.
    """
    if not claims.belongs_to_org(org_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: organization mismatch"
        )
    
    return {
        "orgId": org_id,
        "billing": {
            "plan": claims.plan,
            "monthlySpend": 299.99,
            "nextBilling": "2024-02-01",
        },
        "accessedBy": claims.sub,
    }


@router.get("/public/info")
def public_info_with_optional_auth(claims: AuthClaims | None = Depends(optional_auth)) -> Dict[str, Any]:
    """
    Public endpoint that shows different information based on authentication status.
    Authentication is optional - shows basic info for anonymous users, 
    enhanced info for authenticated users.
    """
    base_info = {
        "message": "Welcome to our API!",
        "version": "1.0.0",
        "status": "operational",
    }
    
    if claims:
        # Enhanced info for authenticated users
        base_info.update({
            "personalizedGreeting": f"Hello {claims.email}!",
            "userId": claims.sub,
            "orgId": claims.orgId,
            "plan": claims.plan,
            "availableFeatures": claims.features,
        })
    else:
        # Basic info for anonymous users
        base_info.update({
            "note": "Sign in to see personalized information",
            "signUpLink": "/auth/signup",
        })
    
    return base_info


@router.get("/combined-guards/enterprise-admin")
def enterprise_admin_endpoint(
    claims: AuthClaims = Depends(auth_required)
) -> Dict[str, Any]:
    """
    Endpoint that combines multiple authorization requirements.
    Requires admin/owner role AND enterprise plan.
    """
    if not claims.has_any_role("admin", "owner"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin or owner role required"
        )

    # Additional plan check beyond the role requirement
    if not claims.has_plan("enterprise"):
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail="Enterprise plan required for this feature"
        )
    
    return {
        "message": "Welcome to the enterprise admin panel",
        "adminLevel": "enterprise",
        "userId": claims.sub,
        "orgId": claims.orgId,
        "capabilities": ["user_management", "billing_management", "advanced_analytics"],
    }


# Example of combining guards programmatically
def _require_admin_enterprise():
    """Helper function that combines role and plan requirements."""
    def _combined_guard(claims: AuthClaims = Depends(auth_required)) -> AuthClaims:
        # Check role
        if not claims.has_any_role("admin", "owner"):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Admin or owner role required"
            )
        
        # Check plan
        if not claims.has_plan("enterprise"):
            raise HTTPException(
                status_code=status.HTTP_402_PAYMENT_REQUIRED,
                detail="Enterprise plan required"
            )
        
        return claims
    
    return _combined_guard


@router.get("/combined-guards/enterprise-admin-v2")
def enterprise_admin_endpoint_v2(
    claims: AuthClaims = Depends(_require_admin_enterprise())
) -> Dict[str, Any]:
    """
    Alternative implementation using a custom combined guard.
    Same requirements as above but implemented as a reusable dependency.
    """
    return {
        "message": "Welcome to the enterprise admin panel (v2)",
        "implementation": "combined_dependency",
        "userId": claims.sub,
        "orgId": claims.orgId,
    }
