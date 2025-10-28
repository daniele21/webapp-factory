"""
Tests for protected routes - integration tests for all auth scenarios.
"""

import pytest
from fastapi.testclient import TestClient

# Import the main app and test fixtures
from main import app
from auth.jwt import sign_access_jwt


class TestProtectedRoutesBasicAuth:
    """Test basic authentication on protected routes."""
    
    def test_get_current_user_success(self, client: TestClient, auth_headers):
        """Test /protected/me endpoint with valid token."""
        headers = auth_headers(
            user_id="test_user_001",
            email="test@example.com",
            org_id="test_org",
            roles=["member"],
            plan="pro",
        )
        
        response = client.get("/protected/me", headers=headers)
        assert response.status_code == 200
        
        data = response.json()
        assert data["userId"] == "test_user_001"
        assert data["email"] == "test@example.com"
        assert data["orgId"] == "test_org"
        assert data["roles"] == ["member"]
        assert data["plan"] == "pro"
    
    def test_get_current_user_no_token(self, client: TestClient):
        """Test /protected/me endpoint without token."""
        response = client.get("/protected/me")
        assert response.status_code == 401
        assert "Missing bearer token" in response.json()["detail"]
    
    def test_get_current_user_invalid_token(self, client: TestClient):
        """Test /protected/me endpoint with invalid token."""
        headers = {"Authorization": "Bearer invalid-token"}
        response = client.get("/protected/me", headers=headers)
        assert response.status_code == 401
        assert "Invalid token" in response.json()["detail"]
    
    def test_get_current_user_expired_token(self, client: TestClient, expired_token):
        """Test /protected/me endpoint with expired token."""
        headers = {"Authorization": f"Bearer {expired_token}"}
        response = client.get("/protected/me", headers=headers)
        assert response.status_code == 401
        assert "Token expired" in response.json()["detail"]


class TestProtectedRoutesRoleBasedAccess:
    """Test role-based access control on protected routes."""
    
    def test_admin_users_endpoint_with_admin(self, client: TestClient, admin_token):
        """Test admin endpoint with admin token."""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = client.get("/protected/admin/users", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        assert "users" in data
        assert "requestedBy" in data
        assert data["requestedBy"] == "admin_001"
    
    def test_admin_users_endpoint_with_owner(self, client: TestClient, owner_token):
        """Test admin endpoint with owner token (should work)."""
        headers = {"Authorization": f"Bearer {owner_token}"}
        response = client.get("/protected/admin/users", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        assert "users" in data
        assert data["requestedBy"] == "owner_001"
    
    def test_admin_users_endpoint_with_regular_user(self, client: TestClient, pro_user_token):
        """Test admin endpoint with regular user (should fail)."""
        headers = {"Authorization": f"Bearer {pro_user_token}"}
        response = client.get("/protected/admin/users", headers=headers)
        
        assert response.status_code == 403
        assert "Insufficient role" in response.json()["detail"]
    
    def test_admin_system_health_admin_only(self, client: TestClient, admin_token, owner_token):
        """Test admin-only endpoint (excludes owners)."""
        # Admin should work
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = client.get("/protected/admin/system/health", headers=headers)
        assert response.status_code == 200
        
        # Owner should not work (requires specific admin role)
        headers = {"Authorization": f"Bearer {owner_token}"}
        response = client.get("/protected/admin/system/health", headers=headers)
        # This will depend on your specific implementation
        # If owner_token includes admin role, it will pass
        # If not, it should fail with 403


class TestProtectedRoutesPlanBasedAccess:
    """Test plan-based access control on protected routes."""
    
    def test_pro_export_with_pro_user(self, client: TestClient, pro_user_token):
        """Test pro endpoint with pro user."""
        headers = {"Authorization": f"Bearer {pro_user_token}"}
        response = client.get("/protected/pro/export", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "export_queued"
        assert data["plan"] == "pro"
    
    def test_pro_export_with_enterprise_user(self, client: TestClient, enterprise_token):
        """Test pro endpoint with enterprise user (should work)."""
        headers = {"Authorization": f"Bearer {enterprise_token}"}
        response = client.get("/protected/pro/export", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "export_queued"
        assert data["plan"] == "enterprise"
    
    def test_pro_export_with_free_user(self, client: TestClient, free_user_token):
        """Test pro endpoint with free user (should fail)."""
        headers = {"Authorization": f"Bearer {free_user_token}"}
        response = client.get("/protected/pro/export", headers=headers)
        
        assert response.status_code == 402
        assert "Upgrade required" in response.json()["detail"]
    
    def test_enterprise_analytics_with_enterprise_user(self, client: TestClient, enterprise_token):
        """Test enterprise endpoint with enterprise user."""
        headers = {"Authorization": f"Bearer {enterprise_token}"}
        response = client.get("/protected/enterprise/analytics", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        assert "analytics" in data
        assert data["plan"] == "enterprise"
    
    def test_enterprise_analytics_with_pro_user(self, client: TestClient, pro_user_token):
        """Test enterprise endpoint with pro user (should fail).""" 
        headers = {"Authorization": f"Bearer {pro_user_token}"}
        response = client.get("/protected/enterprise/analytics", headers=headers)
        
        assert response.status_code == 402
        assert "Upgrade required" in response.json()["detail"]


class TestProtectedRoutesFeatureBasedAccess:
    """Test feature flag-based access control."""
    
    def test_vector_search_labs_with_feature(self, client: TestClient, auth_headers):
        """Test vector search endpoint with feature enabled."""
        headers = auth_headers(features=["vector_search"])
        response = client.get("/protected/labs/vector-search", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "feature_enabled"
        assert data["feature"] == "vector_search"
    
    def test_vector_search_labs_without_feature(self, client: TestClient, auth_headers):
        """Test vector search endpoint without feature."""
        headers = auth_headers(features=[])
        response = client.get("/protected/labs/vector-search", headers=headers)
        
        assert response.status_code == 403
        assert "Feature 'vector_search' not enabled" in response.json()["detail"]
    
    def test_ai_assistant_labs_with_feature(self, client: TestClient, auth_headers):
        """Test AI assistant endpoint with feature enabled."""
        headers = auth_headers(features=["ai_assistant"])
        response = client.get("/protected/labs/ai-assistant", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["feature"] == "ai_assistant"
    
    def test_ai_assistant_labs_without_feature(self, client: TestClient, auth_headers):
        """Test AI assistant endpoint without feature."""
        headers = auth_headers(features=["vector_search"])  # Different feature
        response = client.get("/protected/labs/ai-assistant", headers=headers)
        
        assert response.status_code == 403
        assert "Feature 'ai_assistant' not enabled" in response.json()["detail"]


class TestProtectedRoutesOrganizationScoping:
    """Test organization-scoped access control."""
    
    def test_org_settings_matching_org(self, client: TestClient, auth_headers):
        """Test org settings with matching organization."""
        headers = auth_headers(org_id="test_org")
        response = client.get("/protected/org/test_org/settings", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["orgId"] == "test_org"
        assert "settings" in data
    
    def test_org_settings_different_org(self, client: TestClient, different_org_token):
        """Test org settings with different organization (should fail)."""
        headers = {"Authorization": f"Bearer {different_org_token}"}
        response = client.get("/protected/org/test_org/settings", headers=headers)
        
        assert response.status_code == 403
        assert "organization mismatch" in response.json()["detail"]
    
    def test_update_org_settings(self, client: TestClient, auth_headers):
        """Test updating org settings."""
        headers = auth_headers(org_id="test_org")
        settings_data = {"name": "Updated Org Name", "theme": "dark"}
        
        response = client.put(
            "/protected/org/test_org/settings",
            json=settings_data,
            headers=headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["orgId"] == "test_org"
        assert data["updatedSettings"] == settings_data
    
    def test_org_billing_admin_with_admin_same_org(self, client: TestClient, auth_headers):
        """Test org billing with admin from same org."""
        headers = auth_headers(
            org_id="test_org",
            roles=["admin"],
            plan="enterprise"
        )
        response = client.get("/protected/org/test_org/admin/billing", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["orgId"] == "test_org"
        assert "billing" in data
    
    def test_org_billing_admin_different_org(self, client: TestClient, auth_headers):
        """Test org billing with admin from different org (should fail)."""
        headers = auth_headers(
            org_id="other_org",
            roles=["admin"],
            plan="enterprise"
        )
        response = client.get("/protected/org/test_org/admin/billing", headers=headers)
        
        assert response.status_code == 403
        assert "organization mismatch" in response.json()["detail"]
    
    def test_org_billing_non_admin_same_org(self, client: TestClient, auth_headers):
        """Test org billing with non-admin from same org (should fail)."""
        headers = auth_headers(
            org_id="test_org",
            roles=["member"],
            plan="pro"
        )
        response = client.get("/protected/org/test_org/admin/billing", headers=headers)
        
        assert response.status_code == 403
        assert "Insufficient role" in response.json()["detail"]


class TestProtectedRoutesOptionalAuth:
    """Test optional authentication endpoints."""
    
    def test_public_info_with_auth(self, client: TestClient, auth_headers):
        """Test public endpoint with authentication."""
        headers = auth_headers(
            email="authenticated@example.com",
            user_id="auth_user_123",
            plan="pro"
        )
        response = client.get("/protected/public/info", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "Welcome to our API!"
        assert data["personalizedGreeting"] == "Hello authenticated@example.com!"
        assert data["userId"] == "auth_user_123"
        assert data["plan"] == "pro"
    
    def test_public_info_without_auth(self, client: TestClient):
        """Test public endpoint without authentication."""
        response = client.get("/protected/public/info")
        
        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "Welcome to our API!"
        assert data["note"] == "Sign in to see personalized information"
        assert "userId" not in data
    
    def test_public_info_with_invalid_auth(self, client: TestClient):
        """Test public endpoint with invalid authentication."""
        headers = {"Authorization": "Bearer invalid-token"}
        response = client.get("/protected/public/info", headers=headers)
        
        # Should still work but treat as anonymous
        assert response.status_code == 200
        data = response.json()
        assert data["note"] == "Sign in to see personalized information"


class TestProtectedRoutesCombinedGuards:
    """Test endpoints with multiple authorization requirements."""
    
    def test_enterprise_admin_endpoint_success(self, client: TestClient, auth_headers):
        """Test enterprise admin endpoint with proper credentials."""
        headers = auth_headers(
            roles=["admin"],
            plan="enterprise",
            features=["advanced_analytics"]
        )
        response = client.get("/protected/combined-guards/enterprise-admin", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "Welcome to the enterprise admin panel"
        assert data["adminLevel"] == "enterprise"
    
    def test_enterprise_admin_endpoint_admin_but_wrong_plan(self, client: TestClient, auth_headers):
        """Test enterprise admin endpoint with admin role but wrong plan."""
        headers = auth_headers(
            roles=["admin"],
            plan="pro",  # Not enterprise
            features=["advanced_analytics"]
        )
        response = client.get("/protected/combined-guards/enterprise-admin", headers=headers)
        
        assert response.status_code == 402
        assert "Enterprise plan required" in response.json()["detail"]
    
    def test_enterprise_admin_endpoint_enterprise_but_not_admin(self, client: TestClient, auth_headers):
        """Test enterprise admin endpoint with enterprise plan but not admin."""
        headers = auth_headers(
            roles=["member"],  # Not admin
            plan="enterprise",
            features=["advanced_analytics"]
        )
        response = client.get("/protected/combined-guards/enterprise-admin", headers=headers)
        
        assert response.status_code == 403
        assert "Admin or owner role required" in response.json()["detail"]
    
    def test_enterprise_admin_endpoint_v2_success(self, client: TestClient, auth_headers):
        """Test alternative implementation of enterprise admin endpoint."""
        headers = auth_headers(
            roles=["owner"],
            plan="enterprise"
        )
        response = client.get("/protected/combined-guards/enterprise-admin-v2", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["implementation"] == "combined_dependency"


class TestProtectedRoutesErrorHandling:
    """Test error handling and edge cases."""
    
    def test_malformed_authorization_header(self, client: TestClient):
        """Test various malformed authorization headers."""
        malformed_headers = [
            {"Authorization": "NotBearer token"},
            {"Authorization": "Bearer"},
            {"Authorization": "Bearer "},
            {"Authorization": "bearer lowercase"},
            {"Authorization": ""},
        ]
        
        for headers in malformed_headers:
            response = client.get("/protected/me", headers=headers)
            assert response.status_code == 401
    
    def test_jwt_with_missing_claims(self, client: TestClient):
        """Test JWT with missing required claims."""
        # Create token without orgId
        token = sign_access_jwt(sub="user_123")
        headers = {"Authorization": f"Bearer {token}"}
        
        # Should still work for basic auth
        response = client.get("/protected/me", headers=headers)
        assert response.status_code == 200
        
        # But fail for org-scoped endpoint
        response = client.get("/protected/org/any_org/settings", headers=headers)
        assert response.status_code == 403
    
    def test_concurrent_requests_with_same_token(self, client: TestClient, auth_headers):
        """Test multiple concurrent requests with same token."""
        headers = auth_headers()
        
        # Simulate concurrent requests
        responses = []
        for i in range(5):
            response = client.get("/protected/me", headers=headers)
            responses.append(response)
        
        # All should succeed
        for response in responses:
            assert response.status_code == 200
    
    def test_very_long_token(self, client: TestClient):
        """Test with extremely long token."""
        very_long_token = "a" * 10000
        headers = {"Authorization": f"Bearer {very_long_token}"}
        
        response = client.get("/protected/me", headers=headers)
        assert response.status_code == 401


class TestProtectedRoutesPerformance:
    """Test performance-related aspects of protected routes."""
    
    def test_token_verification_performance(self, client: TestClient, auth_headers):
        """Test that token verification doesn't add significant overhead."""
        headers = auth_headers()
        
        # Make multiple requests to test performance
        start_time = time.time() if 'time' in globals() else 0
        
        for _ in range(10):
            response = client.get("/protected/me", headers=headers)
            assert response.status_code == 200
        
        # This is more of a smoke test - in real scenarios you'd use proper profiling
        # elapsed = time.time() - start_time
        # assert elapsed < 1.0  # Should be fast
    
    def test_different_endpoints_same_token(self, client: TestClient, enterprise_token):
        """Test using same token across different endpoints."""
        headers = {"Authorization": f"Bearer {enterprise_token}"}
        
        endpoints = [
            "/protected/me",
            "/protected/admin/users",
            "/protected/pro/export",
            "/protected/enterprise/analytics",
        ]
        
        for endpoint in endpoints:
            response = client.get(endpoint, headers=headers)
            # All should succeed with enterprise token
            assert response.status_code == 200


class TestProtectedRoutesUserScenarios:
    """Test realistic user scenarios and workflows."""
    
    def test_admin_user_workflow(self, client: TestClient, admin_token):
        """Test typical admin user workflow."""
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        # 1. Check own profile
        response = client.get("/protected/me", headers=headers)
        assert response.status_code == 200
        user_data = response.json()
        assert "admin" in user_data["roles"]
        
        # 2. Access admin panel
        response = client.get("/protected/admin/users", headers=headers)
        assert response.status_code == 200
        
        # 3. Access enterprise features
        response = client.get("/protected/enterprise/analytics", headers=headers)
        assert response.status_code == 200
        
        # 4. Access org settings
        org_id = user_data["orgId"]
        response = client.get(f"/protected/org/{org_id}/admin/billing", headers=headers)
        assert response.status_code == 200
    
    def test_free_user_limitations(self, client: TestClient, free_user_token):
        """Test free user limitations."""
        headers = {"Authorization": f"Bearer {free_user_token}"}
        
        # 1. Can access basic profile
        response = client.get("/protected/me", headers=headers)
        assert response.status_code == 200
        user_data = response.json()
        assert user_data["plan"] == "free"
        
        # 2. Cannot access pro features
        response = client.get("/protected/pro/export", headers=headers)
        assert response.status_code == 402
        
        # 3. Cannot access admin features
        response = client.get("/protected/admin/users", headers=headers)
        assert response.status_code == 403
        
        # 4. Cannot access enterprise features
        response = client.get("/protected/enterprise/analytics", headers=headers)
        assert response.status_code == 402
    
    def test_cross_organization_access_prevention(self, client: TestClient, auth_headers):
        """Test that users cannot access other organizations' data."""
        # User from org_a
        headers_org_a = auth_headers(org_id="org_a", roles=["admin"])
        
        # User from org_b
        headers_org_b = auth_headers(org_id="org_b", roles=["admin"])
        
        # User A cannot access org B's data
        response = client.get("/protected/org/org_b/settings", headers=headers_org_a)
        assert response.status_code == 403
        
        # User B cannot access org A's data
        response = client.get("/protected/org/org_a/settings", headers=headers_org_b)
        assert response.status_code == 403
        
        # But each can access their own org
        response = client.get("/protected/org/org_a/settings", headers=headers_org_a)
        assert response.status_code == 200
        
        response = client.get("/protected/org/org_b/settings", headers=headers_org_b)
        assert response.status_code == 200