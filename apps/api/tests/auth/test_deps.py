"""
Tests for FastAPI auth dependencies - auth_required, require_roles, etc.
"""

import pytest
from fastapi import FastAPI, Depends, HTTPException
from fastapi.testclient import TestClient
from unittest.mock import Mock, patch

from auth.deps import (
    auth_required,
    require_roles,
    require_plan,
    require_feature,
    require_org,
    optional_auth,
    _extract_bearer_token,
)
from auth.models import AuthClaims
from auth.jwt import sign_access_jwt


class TestExtractBearerToken:
    """Test helper function for extracting bearer tokens."""
    
    def test_extract_valid_bearer_token(self):
        """Test extracting valid bearer token."""
        token = _extract_bearer_token("Bearer valid-token-123")
        assert token == "valid-token-123"
    
    def test_extract_bearer_token_case_insensitive(self):
        """Test extracting bearer token is case insensitive."""
        token = _extract_bearer_token("bearer valid-token-123")
        assert token == "valid-token-123"
        
        token = _extract_bearer_token("BEARER valid-token-123")
        assert token == "valid-token-123"
    
    def test_extract_bearer_token_with_extra_spaces(self):
        """Test extracting bearer token with extra spaces."""
        token = _extract_bearer_token("Bearer  valid-token-123  ")
        assert token == "valid-token-123"
    
    def test_extract_bearer_token_missing_authorization(self):
        """Test extraction fails with missing authorization header."""
        with pytest.raises(HTTPException) as exc_info:
            _extract_bearer_token(None)
        
        assert exc_info.value.status_code == 401
        assert "Missing bearer token" in exc_info.value.detail
    
    def test_extract_bearer_token_invalid_format(self):
        """Test extraction fails with invalid format."""
        with pytest.raises(HTTPException) as exc_info:
            _extract_bearer_token("Invalid token-123")
        
        assert exc_info.value.status_code == 401
        assert "Missing bearer token" in exc_info.value.detail
    
    def test_extract_bearer_token_empty_string(self):
        """Test extraction fails with empty string."""
        with pytest.raises(HTTPException) as exc_info:
            _extract_bearer_token("")
        
        assert exc_info.value.status_code == 401


class TestAuthRequired:
    """Test auth_required dependency."""
    
    def test_auth_required_valid_token(self):
        """Test auth_required with valid token."""
        token = sign_access_jwt(
            sub="user_123",
            email="test@example.com",
            orgId="org_abc",
            roles=["member"],
            plan="pro",
        )
        
        claims = auth_required(f"Bearer {token}")
        
        assert isinstance(claims, AuthClaims)
        assert claims.sub == "user_123"
        assert claims.email == "test@example.com"
        assert claims.orgId == "org_abc"
        assert claims.roles == ["member"]
        assert claims.plan == "pro"
    
    def test_auth_required_missing_header(self):
        """Test auth_required with missing authorization header."""
        with pytest.raises(HTTPException) as exc_info:
            auth_required(None)
        
        assert exc_info.value.status_code == 401
        assert "Missing bearer token" in exc_info.value.detail
    
    def test_auth_required_invalid_token(self):
        """Test auth_required with invalid token."""
        with pytest.raises(HTTPException) as exc_info:
            auth_required("Bearer invalid-token")
        
        assert exc_info.value.status_code == 401
        assert "Invalid token" in exc_info.value.detail
    
    def test_auth_required_expired_token(self):
        """Test auth_required with expired token."""
        expired_token = sign_access_jwt(sub="user_123", ttl_minutes=-1)
        
        with pytest.raises(HTTPException) as exc_info:
            auth_required(f"Bearer {expired_token}")
        
        assert exc_info.value.status_code == 401
        assert "Token expired" in exc_info.value.detail


class TestRequireRoles:
    """Test require_roles dependency factory."""
    
    def test_require_roles_single_role_allowed(self):
        """Test require_roles with single allowed role."""
        token = sign_access_jwt(sub="user_123", roles=["admin"])
        require_admin = require_roles("admin")
        
        claims = require_admin(f"Bearer {token}")
        
        assert isinstance(claims, AuthClaims)
        assert claims.sub == "user_123"
        assert "admin" in claims.roles
    
    def test_require_roles_multiple_roles_allowed(self):
        """Test require_roles with multiple allowed roles."""
        token = sign_access_jwt(sub="user_123", roles=["member"])
        require_admin_or_member = require_roles("admin", "member")
        
        claims = require_admin_or_member(f"Bearer {token}")
        
        assert isinstance(claims, AuthClaims)
        assert "member" in claims.roles
    
    def test_require_roles_case_insensitive(self):
        """Test require_roles is case insensitive."""
        token = sign_access_jwt(sub="user_123", roles=["Admin"])
        require_admin = require_roles("admin")
        
        claims = require_admin(f"Bearer {token}")
        assert claims.sub == "user_123"
    
    def test_require_roles_insufficient_role(self):
        """Test require_roles with insufficient role."""
        token = sign_access_jwt(sub="user_123", roles=["member"])  
        require_admin = require_roles("admin")
        
        with pytest.raises(HTTPException) as exc_info:
            require_admin(f"Bearer {token}")
        
        assert exc_info.value.status_code == 403
        assert "Insufficient role" in exc_info.value.detail
        assert "admin" in exc_info.value.detail
    
    def test_require_roles_no_roles(self):
        """Test require_roles with user having no roles."""
        token = sign_access_jwt(sub="user_123", roles=[])
        require_admin = require_roles("admin")
        
        with pytest.raises(HTTPException) as exc_info:
            require_admin(f"Bearer {token}")
        
        assert exc_info.value.status_code == 403
    
    def test_require_roles_multiple_user_roles(self):
        """Test require_roles with user having multiple roles."""
        token = sign_access_jwt(sub="user_123", roles=["member", "editor", "admin"])
        require_admin_or_owner = require_roles("admin", "owner")
        
        claims = require_admin_or_owner(f"Bearer {token}")
        assert "admin" in claims.roles


class TestRequirePlan:
    """Test require_plan dependency factory."""
    
    def test_require_plan_single_plan_allowed(self):
        """Test require_plan with single allowed plan."""
        token = sign_access_jwt(sub="user_123", plan="pro")
        require_pro = require_plan("pro")
        
        claims = require_pro(f"Bearer {token}")
        
        assert isinstance(claims, AuthClaims)
        assert claims.plan == "pro"
    
    def test_require_plan_multiple_plans_allowed(self):
        """Test require_plan with multiple allowed plans."""
        token = sign_access_jwt(sub="user_123", plan="enterprise")
        require_pro_or_enterprise = require_plan("pro", "enterprise")
        
        claims = require_pro_or_enterprise(f"Bearer {token}")
        assert claims.plan == "enterprise"
    
    def test_require_plan_case_insensitive(self):
        """Test require_plan is case insensitive."""
        token = sign_access_jwt(sub="user_123", plan="Pro")
        require_pro = require_plan("pro")
        
        claims = require_pro(f"Bearer {token}")
        assert claims.sub == "user_123"
    
    def test_require_plan_insufficient_plan(self):
        """Test require_plan with insufficient plan."""
        token = sign_access_jwt(sub="user_123", plan="free")
        require_pro = require_plan("pro")
        
        with pytest.raises(HTTPException) as exc_info:
            require_pro(f"Bearer {token}")
        
        assert exc_info.value.status_code == 402
        assert "Upgrade required" in exc_info.value.detail
        assert "pro" in exc_info.value.detail
    
    def test_require_plan_no_plan(self):
        """Test require_plan with user having no plan."""
        token = sign_access_jwt(sub="user_123", plan=None)
        require_pro = require_plan("pro")
        
        with pytest.raises(HTTPException) as exc_info:
            require_pro(f"Bearer {token}")
        
        assert exc_info.value.status_code == 402


class TestRequireFeature:
    """Test require_feature dependency factory."""
    
    def test_require_feature_has_feature(self):
        """Test require_feature with user having the feature."""
        token = sign_access_jwt(sub="user_123", features=["vector_search", "export"])
        require_vector_search = require_feature("vector_search")
        
        claims = require_vector_search(f"Bearer {token}")
        
        assert isinstance(claims, AuthClaims)
        assert "vector_search" in claims.features
    
    def test_require_feature_case_insensitive(self):
        """Test require_feature is case insensitive."""
        token = sign_access_jwt(sub="user_123", features=["Vector_Search"])
        require_feature_dep = require_feature("vector_search")
        
        claims = require_feature_dep(f"Bearer {token}")
        assert claims.sub == "user_123"
    
    def test_require_feature_missing_feature(self):
        """Test require_feature with user missing the feature."""
        token = sign_access_jwt(sub="user_123", features=["export"])
        require_vector_search = require_feature("vector_search")
        
        with pytest.raises(HTTPException) as exc_info:
            require_vector_search(f"Bearer {token}")
        
        assert exc_info.value.status_code == 403
        assert "Feature 'vector_search' not enabled" in exc_info.value.detail
    
    def test_require_feature_no_features(self):
        """Test require_feature with user having no features."""
        token = sign_access_jwt(sub="user_123", features=[])
        require_vector_search = require_feature("vector_search")
        
        with pytest.raises(HTTPException) as exc_info:
            require_vector_search(f"Bearer {token}")
        
        assert exc_info.value.status_code == 403


class TestRequireOrg:
    """Test require_org dependency factory."""
    
    def test_require_org_matching_org(self):
        """Test require_org with matching organization."""
        token = sign_access_jwt(sub="user_123", orgId="test_org")
        
        # Mock request with path params
        mock_request = Mock()
        mock_request.path_params = {"org_id": "test_org"}
        mock_request.query_params = {}
        
        require_org_dep = require_org("org_id")
        claims = require_org_dep(f"Bearer {token}", mock_request)
        
        assert isinstance(claims, AuthClaims)
        assert claims.orgId == "test_org"
    
    def test_require_org_from_query_params(self):
        """Test require_org getting org_id from query params."""
        token = sign_access_jwt(sub="user_123", orgId="test_org")
        
        # Mock request with query params
        mock_request = Mock()
        mock_request.path_params = {}
        mock_request.query_params = {"org_id": "test_org"}
        
        require_org_dep = require_org("org_id")
        claims = require_org_dep(f"Bearer {token}", mock_request)
        
        assert claims.orgId == "test_org"
    
    def test_require_org_mismatched_org(self):
        """Test require_org with mismatched organization."""
        token = sign_access_jwt(sub="user_123", orgId="user_org")
        
        # Mock request with different org
        mock_request = Mock()
        mock_request.path_params = {"org_id": "different_org"}
        mock_request.query_params = {}
        
        require_org_dep = require_org("org_id")
        
        with pytest.raises(HTTPException) as exc_info:
            require_org_dep(f"Bearer {token}", mock_request)
        
        assert exc_info.value.status_code == 403
        assert "organization mismatch" in exc_info.value.detail
    
    def test_require_org_missing_param(self):
        """Test require_org with missing org_id parameter."""
        token = sign_access_jwt(sub="user_123", orgId="test_org")
        
        # Mock request without org_id param
        mock_request = Mock()
        mock_request.path_params = {}
        mock_request.query_params = {}
        
        require_org_dep = require_org("org_id")
        
        with pytest.raises(HTTPException) as exc_info:
            require_org_dep(f"Bearer {token}", mock_request)
        
        assert exc_info.value.status_code == 400
        assert "Missing required parameter: org_id" in exc_info.value.detail
    
    def test_require_org_custom_param_name(self):
        """Test require_org with custom parameter name."""
        token = sign_access_jwt(sub="user_123", orgId="test_org")
        
        # Mock request with custom param name
        mock_request = Mock()
        mock_request.path_params = {"organization_id": "test_org"}
        mock_request.query_params = {}
        
        require_org_dep = require_org("organization_id")
        claims = require_org_dep(f"Bearer {token}", mock_request)
        
        assert claims.orgId == "test_org"


class TestOptionalAuth:
    """Test optional_auth dependency."""
    
    def test_optional_auth_with_valid_token(self):
        """Test optional_auth with valid token."""
        token = sign_access_jwt(sub="user_123", email="test@example.com")
        
        claims = optional_auth(f"Bearer {token}")
        
        assert isinstance(claims, AuthClaims)
        assert claims.sub == "user_123"
        assert claims.email == "test@example.com"
    
    def test_optional_auth_with_no_header(self):
        """Test optional_auth with no authorization header."""
        claims = optional_auth(None)
        
        assert claims is None
    
    def test_optional_auth_with_invalid_token(self):
        """Test optional_auth with invalid token."""
        claims = optional_auth("Bearer invalid-token")
        
        # Should return None instead of raising exception
        assert claims is None
    
    def test_optional_auth_with_expired_token(self):
        """Test optional_auth with expired token."""
        expired_token = sign_access_jwt(sub="user_123", ttl_minutes=-1)
        
        claims = optional_auth(f"Bearer {expired_token}")
        
        # Should return None instead of raising exception
        assert claims is None
    
    def test_optional_auth_with_malformed_header(self):
        """Test optional_auth with malformed authorization header."""
        claims = optional_auth("Not a bearer token")
        
        # Should return None instead of raising exception
        assert claims is None


class TestDependenciesIntegration:
    """Integration tests using actual FastAPI app."""
    
    def test_integration_with_fastapi_app(self):
        """Test dependencies integrated with FastAPI routes."""
        # Create minimal FastAPI app for testing
        app = FastAPI()
        
        @app.get("/protected")
        def protected_route(claims: AuthClaims = Depends(auth_required)):
            return {"userId": claims.sub, "email": claims.email}
        
        @app.get("/admin")
        def admin_route(claims: AuthClaims = Depends(require_roles("admin"))):
            return {"message": "admin access", "user": claims.sub}
        
        @app.get("/pro")
        def pro_route(claims: AuthClaims = Depends(require_plan("pro", "enterprise"))):
            return {"message": "pro access", "plan": claims.plan}
        
        @app.get("/optional")
        def optional_route(claims: AuthClaims | None = Depends(optional_auth)):
            if claims:
                return {"message": "authenticated", "user": claims.sub}
            else:
                return {"message": "anonymous"}
        
        client = TestClient(app)
        
        # Test protected route with valid token
        token = sign_access_jwt(sub="user_123", email="test@example.com")
        headers = {"Authorization": f"Bearer {token}"}
        
        response = client.get("/protected", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert data["userId"] == "user_123"
        assert data["email"] == "test@example.com"
        
        # Test protected route without token
        response = client.get("/protected")
        assert response.status_code == 401
        
        # Test admin route with admin token
        admin_token = sign_access_jwt(sub="admin_123", roles=["admin"])
        admin_headers = {"Authorization": f"Bearer {admin_token}"}
        
        response = client.get("/admin", headers=admin_headers)
        assert response.status_code == 200
        assert response.json()["message"] == "admin access"
        
        # Test admin route with non-admin token
        response = client.get("/admin", headers=headers)
        assert response.status_code == 403
        
        # Test pro route with pro token
        pro_token = sign_access_jwt(sub="pro_123", plan="pro")
        pro_headers = {"Authorization": f"Bearer {pro_token}"}
        
        response = client.get("/pro", headers=pro_headers)
        assert response.status_code == 200
        assert response.json()["plan"] == "pro"
        
        # Test pro route with free token
        free_token = sign_access_jwt(sub="free_123", plan="free")
        free_headers = {"Authorization": f"Bearer {free_token}"}
        
        response = client.get("/pro", headers=free_headers)
        assert response.status_code == 402
        
        # Test optional route with token
        response = client.get("/optional", headers=headers)
        assert response.status_code == 200
        assert response.json()["message"] == "authenticated"
        
        # Test optional route without token
        response = client.get("/optional")
        assert response.status_code == 200
        assert response.json()["message"] == "anonymous"


class TestDependenciesErrorMessages:
    """Test error messages from dependencies."""
    
    def test_role_requirement_error_message(self):
        """Test detailed error message for role requirements."""
        token = sign_access_jwt(sub="user_123", roles=["member"])
        require_admin_owner = require_roles("admin", "owner")
        
        with pytest.raises(HTTPException) as exc_info:
            require_admin_owner(f"Bearer {token}")
        
        assert exc_info.value.status_code == 403
        error_detail = exc_info.value.detail
        assert "Insufficient role" in error_detail
        assert "admin" in error_detail or "owner" in error_detail
    
    def test_plan_requirement_error_message(self):
        """Test detailed error message for plan requirements."""
        token = sign_access_jwt(sub="user_123", plan="free")
        require_pro_enterprise = require_plan("pro", "enterprise")
        
        with pytest.raises(HTTPException) as exc_info:
            require_pro_enterprise(f"Bearer {token}")
        
        assert exc_info.value.status_code == 402
        error_detail = exc_info.value.detail
        assert "Upgrade required" in error_detail
        assert "pro" in error_detail or "enterprise" in error_detail
    
    def test_feature_requirement_error_message(self):
        """Test detailed error message for feature requirements."""
        token = sign_access_jwt(sub="user_123", features=[])
        require_vector_search = require_feature("vector_search")
        
        with pytest.raises(HTTPException) as exc_info:
            require_vector_search(f"Bearer {token}")
        
        assert exc_info.value.status_code == 403
        error_detail = exc_info.value.detail
        assert "Feature 'vector_search' not enabled" in error_detail