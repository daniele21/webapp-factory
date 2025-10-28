"""
Tests for auth decorators - service layer authorization guards.
"""

import pytest
from unittest.mock import Mock

from auth.decorators import (
    guard_roles,
    guard_plan,
    guard_feature,
    guard_org,
    guard_authenticated,
    combine_guards,
    GuardError,
)
from auth.models import AuthClaims


class TestGuardError:
    """Test GuardError exception."""
    
    def test_guard_error_initialization(self):
        """Test GuardError inherits from PermissionError."""
        error = GuardError("Test error")
        assert isinstance(error, PermissionError)
        assert str(error) == "Test error"


class TestGuardRoles:
    """Test guard_roles decorator."""
    
    def test_guard_roles_single_role_allowed(self):
        """Test guard_roles with single allowed role."""
        @guard_roles("admin")
        def test_function(*, claims: AuthClaims):
            return {"success": True, "user": claims.sub}
        
        claims = AuthClaims(sub="user_123", roles=["admin"])
        result = test_function(claims=claims)
        
        assert result["success"] is True
        assert result["user"] == "user_123"
    
    def test_guard_roles_multiple_roles_allowed(self):
        """Test guard_roles with multiple allowed roles."""
        @guard_roles("admin", "owner")
        def test_function(*, claims: AuthClaims):
            return {"success": True}
        
        # Test with admin role
        admin_claims = AuthClaims(sub="admin_123", roles=["admin"])
        result = test_function(claims=admin_claims)
        assert result["success"] is True
        
        # Test with owner role
        owner_claims = AuthClaims(sub="owner_123", roles=["owner"])
        result = test_function(claims=owner_claims)
        assert result["success"] is True
    
    def test_guard_roles_case_insensitive(self):
        """Test guard_roles is case insensitive."""
        @guard_roles("admin")
        def test_function(*, claims: AuthClaims):
            return {"success": True}
        
        claims = AuthClaims(sub="user_123", roles=["ADMIN"])
        result = test_function(claims=claims)
        assert result["success"] is True
    
    def test_guard_roles_insufficient_role(self):
        """Test guard_roles with insufficient role."""
        @guard_roles("admin")
        def test_function(*, claims: AuthClaims):
            return {"success": True}
        
        claims = AuthClaims(sub="user_123", roles=["member"])
        
        with pytest.raises(GuardError) as exc_info:
            test_function(claims=claims)
        
        assert "Insufficient role" in str(exc_info.value)
        assert "admin" in str(exc_info.value)
    
    def test_guard_roles_missing_claims(self):
        """Test guard_roles with missing claims."""
        @guard_roles("admin")
        def test_function(*, claims: AuthClaims):
            return {"success": True}
        
        with pytest.raises(GuardError) as exc_info:
            test_function(claims=None)
        
        assert "Missing authentication claims" in str(exc_info.value)
    
    def test_guard_roles_no_roles(self):
        """Test guard_roles with user having no roles."""
        @guard_roles("admin")
        def test_function(*, claims: AuthClaims):
            return {"success": True}
        
        claims = AuthClaims(sub="user_123", roles=[])
        
        with pytest.raises(GuardError):
            test_function(claims=claims)
    
    def test_guard_roles_with_additional_args(self):
        """Test guard_roles preserves function signature."""
        @guard_roles("admin")
        def test_function(arg1, arg2, *, claims: AuthClaims, kwarg1=None):
            return {
                "arg1": arg1,
                "arg2": arg2,
                "kwarg1": kwarg1,
                "user": claims.sub,
            }
        
        claims = AuthClaims(sub="admin_123", roles=["admin"])
        result = test_function("value1", "value2", claims=claims, kwarg1="kwvalue")
        
        assert result["arg1"] == "value1"
        assert result["arg2"] == "value2"
        assert result["kwarg1"] == "kwvalue"
        assert result["user"] == "admin_123"


class TestGuardPlan:
    """Test guard_plan decorator."""
    
    def test_guard_plan_single_plan_allowed(self):
        """Test guard_plan with single allowed plan."""
        @guard_plan("pro")
        def test_function(*, claims: AuthClaims):
            return {"success": True, "plan": claims.plan}
        
        claims = AuthClaims(sub="user_123", plan="pro")
        result = test_function(claims=claims)
        
        assert result["success"] is True
        assert result["plan"] == "pro"
    
    def test_guard_plan_multiple_plans_allowed(self):
        """Test guard_plan with multiple allowed plans."""
        @guard_plan("pro", "enterprise")
        def test_function(*, claims: AuthClaims):
            return {"success": True}
        
        # Test with pro plan
        pro_claims = AuthClaims(sub="pro_123", plan="pro")
        result = test_function(claims=pro_claims)
        assert result["success"] is True
        
        # Test with enterprise plan
        enterprise_claims = AuthClaims(sub="enterprise_123", plan="enterprise")
        result = test_function(claims=enterprise_claims)
        assert result["success"] is True
    
    def test_guard_plan_case_insensitive(self):
        """Test guard_plan is case insensitive."""
        @guard_plan("pro")
        def test_function(*, claims: AuthClaims):
            return {"success": True}
        
        claims = AuthClaims(sub="user_123", plan="PRO")
        result = test_function(claims=claims)
        assert result["success"] is True
    
    def test_guard_plan_insufficient_plan(self):
        """Test guard_plan with insufficient plan."""
        @guard_plan("pro")
        def test_function(*, claims: AuthClaims):
            return {"success": True}
        
        claims = AuthClaims(sub="user_123", plan="free")
        
        with pytest.raises(GuardError) as exc_info:
            test_function(claims=claims)
        
        assert "Upgrade required" in str(exc_info.value)
        assert "pro" in str(exc_info.value)
    
    def test_guard_plan_missing_claims(self):
        """Test guard_plan with missing claims."""
        @guard_plan("pro")
        def test_function(*, claims: AuthClaims):
            return {"success": True}
        
        with pytest.raises(GuardError) as exc_info:
            test_function(claims=None)
        
        assert "Missing authentication claims" in str(exc_info.value)
    
    def test_guard_plan_no_plan(self):
        """Test guard_plan with user having no plan."""
        @guard_plan("pro")
        def test_function(*, claims: AuthClaims):
            return {"success": True}
        
        claims = AuthClaims(sub="user_123", plan=None)
        
        with pytest.raises(GuardError):
            test_function(claims=claims)


class TestGuardFeature:
    """Test guard_feature decorator."""
    
    def test_guard_feature_has_feature(self):
        """Test guard_feature with user having the feature."""
        @guard_feature("vector_search")
        def test_function(*, claims: AuthClaims):
            return {"success": True, "features": claims.features}
        
        claims = AuthClaims(sub="user_123", features=["vector_search", "export"])
        result = test_function(claims=claims)
        
        assert result["success"] is True
        assert "vector_search" in result["features"]
    
    def test_guard_feature_case_insensitive(self):
        """Test guard_feature is case insensitive."""
        @guard_feature("vector_search")
        def test_function(*, claims: AuthClaims):
            return {"success": True}
        
        claims = AuthClaims(sub="user_123", features=["VECTOR_SEARCH"])
        result = test_function(claims=claims)
        assert result["success"] is True
    
    def test_guard_feature_missing_feature(self):
        """Test guard_feature with user missing the feature."""
        @guard_feature("vector_search")
        def test_function(*, claims: AuthClaims):
            return {"success": True}
        
        claims = AuthClaims(sub="user_123", features=["export"])
        
        with pytest.raises(GuardError) as exc_info:
            test_function(claims=claims)
        
        assert "Feature 'vector_search' not enabled" in str(exc_info.value)
    
    def test_guard_feature_missing_claims(self):
        """Test guard_feature with missing claims."""
        @guard_feature("vector_search")
        def test_function(*, claims: AuthClaims):
            return {"success": True}
        
        with pytest.raises(GuardError) as exc_info:
            test_function(claims=None)
        
        assert "Missing authentication claims" in str(exc_info.value)
    
    def test_guard_feature_no_features(self):
        """Test guard_feature with user having no features."""
        @guard_feature("vector_search")
        def test_function(*, claims: AuthClaims):
            return {"success": True}
        
        claims = AuthClaims(sub="user_123", features=[])
        
        with pytest.raises(GuardError):
            test_function(claims=claims)


class TestGuardOrg:
    """Test guard_org decorator."""
    
    def test_guard_org_matching_org(self):
        """Test guard_org with matching organization."""
        @guard_org("org_id")
        def test_function(*, claims: AuthClaims, org_id: str):
            return {"success": True, "org": org_id, "user_org": claims.orgId}
        
        claims = AuthClaims(sub="user_123", orgId="test_org")
        result = test_function(claims=claims, org_id="test_org")
        
        assert result["success"] is True
        assert result["org"] == "test_org"
        assert result["user_org"] == "test_org"
    
    def test_guard_org_custom_param_name(self):
        """Test guard_org with custom parameter name."""
        @guard_org("organization_id")
        def test_function(*, claims: AuthClaims, organization_id: str):
            return {"success": True}
        
        claims = AuthClaims(sub="user_123", orgId="test_org")
        result = test_function(claims=claims, organization_id="test_org")
        assert result["success"] is True
    
    def test_guard_org_mismatched_org(self):
        """Test guard_org with mismatched organization."""
        @guard_org("org_id")
        def test_function(*, claims: AuthClaims, org_id: str):
            return {"success": True}
        
        claims = AuthClaims(sub="user_123", orgId="user_org")
        
        with pytest.raises(GuardError) as exc_info:
            test_function(claims=claims, org_id="different_org")
        
        assert "Access denied: organization mismatch" in str(exc_info.value)
    
    def test_guard_org_missing_claims(self):
        """Test guard_org with missing claims."""
        @guard_org("org_id")
        def test_function(*, claims: AuthClaims, org_id: str):
            return {"success": True}
        
        with pytest.raises(GuardError) as exc_info:
            test_function(claims=None, org_id="test_org")
        
        assert "Missing authentication claims" in str(exc_info.value)
    
    def test_guard_org_missing_param(self):
        """Test guard_org with missing org parameter."""
        @guard_org("org_id")
        def test_function(*, claims: AuthClaims, org_id: str = None):
            return {"success": True}
        
        claims = AuthClaims(sub="user_123", orgId="test_org")
        
        with pytest.raises(GuardError) as exc_info:
            test_function(claims=claims, org_id=None)
        
        assert "Missing required parameter: org_id" in str(exc_info.value)
    
    def test_guard_org_string_conversion(self):
        """Test guard_org with string conversion."""
        @guard_org("org_id")
        def test_function(*, claims: AuthClaims, org_id: int):
            return {"success": True}
        
        claims = AuthClaims(sub="user_123", orgId="123")
        result = test_function(claims=claims, org_id=123)
        assert result["success"] is True


class TestGuardAuthenticated:
    """Test guard_authenticated decorator."""
    
    def test_guard_authenticated_with_claims(self):
        """Test guard_authenticated with valid claims."""
        @guard_authenticated
        def test_function(*, claims: AuthClaims):
            return {"success": True, "user": claims.sub}
        
        claims = AuthClaims(sub="user_123")
        result = test_function(claims=claims)
        
        assert result["success"] is True
        assert result["user"] == "user_123"
    
    def test_guard_authenticated_missing_claims(self):
        """Test guard_authenticated with missing claims."""
        @guard_authenticated
        def test_function(*, claims: AuthClaims):
            return {"success": True}
        
        with pytest.raises(GuardError) as exc_info:
            test_function(claims=None)
        
        assert "Authentication required" in str(exc_info.value)
    
    def test_guard_authenticated_preserves_function_metadata(self):
        """Test guard_authenticated preserves function metadata."""
        @guard_authenticated
        def test_function(*, claims: AuthClaims):
            """Test function docstring."""
            return {"success": True}
        
        assert test_function.__name__ == "test_function"
        assert "Test function docstring" in test_function.__doc__


class TestCombineGuards:
    """Test combine_guards decorator."""
    
    def test_combine_guards_multiple_guards(self):
        """Test combining multiple guards."""
        @combine_guards(
            guard_roles("admin"),
            guard_plan("enterprise"),
            guard_feature("advanced_analytics")
        )
        def test_function(*, claims: AuthClaims):
            return {"success": True}
        
        claims = AuthClaims(
            sub="admin_123",
            roles=["admin"],
            plan="enterprise",
            features=["advanced_analytics"],
        )
        
        result = test_function(claims=claims)
        assert result["success"] is True
    
    def test_combine_guards_fails_on_first_guard(self):
        """Test combine_guards fails on first guard failure."""
        @combine_guards(
            guard_roles("admin"),
            guard_plan("enterprise"),
        )
        def test_function(*, claims: AuthClaims):
            return {"success": True}
        
        # Fails role check
        claims = AuthClaims(sub="user_123", roles=["member"], plan="enterprise")
        
        with pytest.raises(GuardError) as exc_info:
            test_function(claims=claims)
        
        assert "Insufficient role" in str(exc_info.value)
    
    def test_combine_guards_fails_on_second_guard(self):
        """Test combine_guards fails on second guard failure."""
        @combine_guards(
            guard_roles("admin"),
            guard_plan("enterprise"),
        )
        def test_function(*, claims: AuthClaims):
            return {"success": True}
        
        # Passes role check, fails plan check
        claims = AuthClaims(sub="admin_123", roles=["admin"], plan="free")
        
        with pytest.raises(GuardError) as exc_info:
            test_function(claims=claims)
        
        assert "Upgrade required" in str(exc_info.value)
    
    def test_combine_guards_empty_guards(self):
        """Test combine_guards with no guards."""
        @combine_guards()
        def test_function(*, claims: AuthClaims):
            return {"success": True}
        
        claims = AuthClaims(sub="user_123")
        result = test_function(claims=claims)
        assert result["success"] is True
    
    def test_combine_guards_single_guard(self):
        """Test combine_guards with single guard."""
        @combine_guards(guard_roles("admin"))
        def test_function(*, claims: AuthClaims):
            return {"success": True}
        
        claims = AuthClaims(sub="admin_123", roles=["admin"])
        result = test_function(claims=claims)
        assert result["success"] is True


class TestDecoratorIntegration:
    """Integration tests for decorators in realistic scenarios."""
    
    def test_service_function_with_guards(self):
        """Test realistic service function with multiple guards."""
        @guard_roles("admin", "owner")
        @guard_plan("pro", "enterprise")
        def delete_user_service(*, claims: AuthClaims, user_id: str, reason: str):
            return {
                "deleted_user": user_id,
                "deleted_by": claims.sub,
                "reason": reason,
                "org": claims.orgId,
            }
        
        claims = AuthClaims(
            sub="admin_123",
            orgId="company_org",
            roles=["admin"],
            plan="pro",
        )
        
        result = delete_user_service(
            claims=claims,
            user_id="user_456",
            reason="violation"
        )
        
        assert result["deleted_user"] == "user_456"
        assert result["deleted_by"] == "admin_123"
        assert result["reason"] == "violation"
        assert result["org"] == "company_org"
    
    def test_complex_business_logic_with_guards(self):
        """Test complex business logic with multiple authorization layers."""
        @guard_authenticated
        @guard_org("org_id")
        @guard_feature("export_data")
        def export_org_data(*, claims: AuthClaims, org_id: str, export_format: str):
            # Simulate business logic
            if export_format not in ["csv", "json", "xml"]:
                raise ValueError("Invalid export format")
            
            return {
                "export_id": f"export_{org_id}_{claims.sub}",
                "format": export_format,
                "org": org_id,
                "user": claims.sub,
                "status": "queued",
            }
        
        claims = AuthClaims(
            sub="user_123",
            orgId="test_org",
            features=["export_data"],
        )
        
        result = export_org_data(
            claims=claims,
            org_id="test_org",
            export_format="json"
        )
        
        assert result["export_id"] == "export_test_org_user_123"
        assert result["format"] == "json"
        assert result["status"] == "queued"
    
    def test_error_propagation_through_guards(self):
        """Test that business logic errors propagate through guards."""
        @guard_roles("admin")
        def service_with_business_error(*, claims: AuthClaims):
            raise ValueError("Business logic error")
        
        claims = AuthClaims(sub="admin_123", roles=["admin"])
        
        # Business error should propagate, not guard error
        with pytest.raises(ValueError) as exc_info:
            service_with_business_error(claims=claims)
        
        assert "Business logic error" in str(exc_info.value)
    
    def test_guard_error_precedence(self):
        """Test that guard errors take precedence over business logic."""
        @guard_roles("admin")
        def service_with_business_error(*, claims: AuthClaims):
            raise ValueError("Business logic error")
        
        claims = AuthClaims(sub="user_123", roles=["member"])  # Not admin
        
        # Guard error should occur before business logic
        with pytest.raises(GuardError) as exc_info:
            service_with_business_error(claims=claims)
        
        assert "Insufficient role" in str(exc_info.value)


class TestDecoratorEdgeCases:
    """Test decorator edge cases and error conditions."""
    
    def test_decorator_with_positional_args(self):
        """Test decorators work with positional arguments."""
        @guard_roles("admin")
        def test_function(arg1, arg2, *, claims: AuthClaims):
            return {"arg1": arg1, "arg2": arg2, "user": claims.sub}
        
        claims = AuthClaims(sub="admin_123", roles=["admin"])
        result = test_function("value1", "value2", claims=claims)
        
        assert result["arg1"] == "value1"
        assert result["arg2"] == "value2"
        assert result["user"] == "admin_123"
    
    def test_decorator_with_return_value(self):
        """Test decorators preserve return values."""
        @guard_authenticated
        def test_function(*, claims: AuthClaims):
            return {"status": "success", "data": [1, 2, 3]}
        
        claims = AuthClaims(sub="user_123")
        result = test_function(claims=claims)
        
        assert result["status"] == "success"
        assert result["data"] == [1, 2, 3]
    
    def test_decorator_with_none_return(self):
        """Test decorators work with functions returning None."""
        @guard_authenticated
        def test_function(*, claims: AuthClaims):
            # Function that returns None implicitly
            pass
        
        claims = AuthClaims(sub="user_123")
        result = test_function(claims=claims)
        
        assert result is None
    
    def test_multiple_decorators_order(self):
        """Test multiple decorators are applied in correct order."""
        call_order = []
        
        def tracking_guard(name):
            def decorator(func):
                def wrapper(*args, **kwargs):
                    call_order.append(f"enter_{name}")
                    try:
                        result = func(*args, **kwargs)
                        call_order.append(f"exit_{name}")
                        return result
                    except Exception as e:
                        call_order.append(f"error_{name}")
                        raise
                return wrapper
            return decorator
        
        @tracking_guard("outer")
        @guard_roles("admin")
        @tracking_guard("inner")
        def test_function(*, claims: AuthClaims):
            call_order.append("function_body")
            return {"success": True}
        
        claims = AuthClaims(sub="admin_123", roles=["admin"])
        result = test_function(claims=claims)
        
        # Should execute outer -> guard_roles -> inner -> function -> inner -> outer
        expected_order = ["enter_outer", "enter_inner", "function_body", "exit_inner", "exit_outer"]
        assert call_order == expected_order
        assert result["success"] is True