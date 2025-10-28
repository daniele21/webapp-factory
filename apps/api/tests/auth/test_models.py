"""
Tests for AuthClaims model - validation and helper methods.
"""

import pytest
from pydantic import ValidationError

from auth.models import AuthClaims


class TestAuthClaimsValidation:
    """Test AuthClaims model validation."""
    
    def test_create_minimal_claims(self):
        """Test creating AuthClaims with minimal required fields."""
        claims = AuthClaims(sub="user_123")
        
        assert claims.sub == "user_123"
        assert claims.email is None
        assert claims.orgId is None
        assert claims.roles == []
        assert claims.plan is None
        assert claims.features == []
    
    def test_create_full_claims(self):
        """Test creating AuthClaims with all fields."""
        claims = AuthClaims(
            sub="user_123",
            email="test@example.com",
            orgId="org_abc",
            roles=["admin", "owner"],
            plan="enterprise",
            features=["feature1", "feature2"],
        )
        
        assert claims.sub == "user_123"
        assert claims.email == "test@example.com"
        assert claims.orgId == "org_abc"
        assert claims.roles == ["admin", "owner"]
        assert claims.plan == "enterprise"
        assert claims.features == ["feature1", "feature2"]
    
    def test_missing_required_sub(self):
        """Test validation error when subject is missing."""
        with pytest.raises(ValidationError) as exc_info:
            AuthClaims()
        
        errors = exc_info.value.errors()
        assert len(errors) == 1
        assert errors[0]["field"] == "sub"
        assert errors[0]["type"] == "missing"
    
    def test_empty_sub_invalid(self):
        """Test validation error when subject is empty."""
        with pytest.raises(ValidationError) as exc_info:
            AuthClaims(sub="")
        
        # Empty string should be invalid for sub
        errors = exc_info.value.errors()
        assert len(errors) == 1
    
    def test_default_values(self):
        """Test default values for optional fields."""
        claims = AuthClaims(sub="user_123")
        
        assert claims.roles == []
        assert claims.features == []
        assert claims.email is None
        assert claims.orgId is None
        assert claims.plan is None
    
    def test_type_validation(self):
        """Test type validation for fields."""
        # Valid types
        claims = AuthClaims(
            sub="user_123",
            email="test@example.com",
            orgId="org_123",
            roles=["role1", "role2"],
            plan="pro",
            features=["feat1", "feat2"],
        )
        assert isinstance(claims.roles, list)
        assert isinstance(claims.features, list)
        
        # Invalid types should raise ValidationError
        with pytest.raises(ValidationError):
            AuthClaims(sub="user_123", roles="not_a_list")
        
        with pytest.raises(ValidationError):
            AuthClaims(sub="user_123", features="not_a_list")


class TestAuthClaimsHelperMethods:
    """Test AuthClaims helper methods."""
    
    def test_has_role_single(self):
        """Test has_role method with single role."""
        claims = AuthClaims(sub="user_123", roles=["admin", "member"])
        
        assert claims.has_role("admin") is True
        assert claims.has_role("member") is True
        assert claims.has_role("owner") is False
        assert claims.has_role("guest") is False
    
    def test_has_role_case_insensitive(self):
        """Test has_role method is case insensitive."""
        claims = AuthClaims(sub="user_123", roles=["Admin", "MEMBER"])
        
        assert claims.has_role("admin") is True
        assert claims.has_role("ADMIN") is True
        assert claims.has_role("member") is True
        assert claims.has_role("MEMBER") is True
        assert claims.has_role("Member") is True
    
    def test_has_role_empty_roles(self):
        """Test has_role with empty roles list."""
        claims = AuthClaims(sub="user_123", roles=[])
        
        assert claims.has_role("admin") is False
        assert claims.has_role("member") is False
    
    def test_has_any_role_multiple(self):
        """Test has_any_role method with multiple roles."""
        claims = AuthClaims(sub="user_123", roles=["member", "viewer"])
        
        assert claims.has_any_role("admin", "member") is True
        assert claims.has_any_role("owner", "admin") is False
        assert claims.has_any_role("member") is True
        assert claims.has_any_role("admin", "owner", "guest") is False
    
    def test_has_any_role_case_insensitive(self):
        """Test has_any_role is case insensitive."""
        claims = AuthClaims(sub="user_123", roles=["Admin", "VIEWER"])
        
        assert claims.has_any_role("admin", "member") is True
        assert claims.has_any_role("ADMIN", "MEMBER") is True
        assert claims.has_any_role("viewer") is True
        assert claims.has_any_role("VIEWER") is True
    
    def test_has_any_role_empty_roles(self):
        """Test has_any_role with empty roles list."""
        claims = AuthClaims(sub="user_123", roles=[])
        
        assert claims.has_any_role("admin", "member") is False
        assert claims.has_any_role() is False
    
    def test_has_plan_single(self):
        """Test has_plan method with single plan."""
        claims = AuthClaims(sub="user_123", plan="pro")
        
        assert claims.has_plan("pro") is True
        assert claims.has_plan("enterprise") is False
        assert claims.has_plan("free") is False
    
    def test_has_plan_multiple(self):
        """Test has_plan method with multiple allowed plans."""
        claims = AuthClaims(sub="user_123", plan="pro")
        
        assert claims.has_plan("pro", "enterprise") is True
        assert claims.has_plan("free", "pro") is True
        assert claims.has_plan("enterprise", "premium") is False
    
    def test_has_plan_case_insensitive(self):
        """Test has_plan is case insensitive."""
        claims = AuthClaims(sub="user_123", plan="Pro")
        
        assert claims.has_plan("pro") is True
        assert claims.has_plan("PRO") is True
        assert claims.has_plan("Pro") is True
    
    def test_has_plan_none(self):
        """Test has_plan with no plan set."""
        claims = AuthClaims(sub="user_123", plan=None)
        
        assert claims.has_plan("pro") is False
        assert claims.has_plan("free", "pro") is False
    
    def test_has_plan_empty_string(self):
        """Test has_plan with empty string plan."""
        claims = AuthClaims(sub="user_123", plan="")
        
        assert claims.has_plan("pro") is False
        assert claims.has_plan("") is True
    
    def test_has_feature_single(self):
        """Test has_feature method with single feature."""
        claims = AuthClaims(sub="user_123", features=["vector_search", "ai_assistant"])
        
        assert claims.has_feature("vector_search") is True
        assert claims.has_feature("ai_assistant") is True
        assert claims.has_feature("advanced_analytics") is False
    
    def test_has_feature_case_insensitive(self):
        """Test has_feature is case insensitive."""
        claims = AuthClaims(sub="user_123", features=["Vector_Search", "AI_ASSISTANT"])
        
        assert claims.has_feature("vector_search") is True
        assert claims.has_feature("VECTOR_SEARCH") is True
        assert claims.has_feature("ai_assistant") is True
        assert claims.has_feature("AI_ASSISTANT") is True
    
    def test_has_feature_empty_features(self):
        """Test has_feature with empty features list."""
        claims = AuthClaims(sub="user_123", features=[])
        
        assert claims.has_feature("vector_search") is False
        assert claims.has_feature("any_feature") is False
    
    def test_belongs_to_org_match(self):
        """Test belongs_to_org with matching organization."""
        claims = AuthClaims(sub="user_123", orgId="org_abc")
        
        assert claims.belongs_to_org("org_abc") is True
        assert claims.belongs_to_org("org_xyz") is False
    
    def test_belongs_to_org_string_conversion(self):
        """Test belongs_to_org with string conversion."""
        claims = AuthClaims(sub="user_123", orgId="123")
        
        # Should handle string conversion
        assert claims.belongs_to_org("123") is True
        assert claims.belongs_to_org(123) is True
    
    def test_belongs_to_org_none(self):
        """Test belongs_to_org with no organization set."""
        claims = AuthClaims(sub="user_123", orgId=None)
        
        assert claims.belongs_to_org("any_org") is False
        assert claims.belongs_to_org(None) is False
    
    def test_belongs_to_org_empty_string(self):
        """Test belongs_to_org with empty string organization."""
        claims = AuthClaims(sub="user_123", orgId="")
        
        assert claims.belongs_to_org("") is True
        assert claims.belongs_to_org("any_org") is False


class TestAuthClaimsComplexScenarios:
    """Test AuthClaims in complex scenarios."""
    
    def test_admin_user_scenario(self):
        """Test typical admin user claims."""
        claims = AuthClaims(
            sub="admin_001",
            email="admin@company.com",
            orgId="company_org",
            roles=["admin", "owner"],
            plan="enterprise",
            features=["all_features", "admin_panel", "analytics"],
        )
        
        # Admin should have admin role
        assert claims.has_role("admin") is True
        assert claims.has_any_role("admin", "member") is True
        
        # Admin should have enterprise plan
        assert claims.has_plan("enterprise") is True
        assert claims.has_plan("pro", "enterprise") is True
        
        # Admin should have features
        assert claims.has_feature("admin_panel") is True
        assert claims.has_feature("analytics") is True
        
        # Admin should belong to org
        assert claims.belongs_to_org("company_org") is True
    
    def test_free_user_scenario(self):
        """Test typical free user claims."""
        claims = AuthClaims(
            sub="free_001",
            email="free@example.com",
            orgId="personal_org",
            roles=["member"],
            plan="free",
            features=[],
        )
        
        # Free user should have member role only
        assert claims.has_role("member") is True
        assert claims.has_role("admin") is False
        assert claims.has_any_role("member") is True
        assert claims.has_any_role("admin", "owner") is False
        
        # Free user should have free plan
        assert claims.has_plan("free") is True
        assert claims.has_plan("pro", "enterprise") is False
        
        # Free user should have no features
        assert claims.has_feature("any_feature") is False
        
        # Free user should belong to personal org
        assert claims.belongs_to_org("personal_org") is True
        assert claims.belongs_to_org("other_org") is False
    
    def test_pro_user_scenario(self):
        """Test typical pro user claims."""
        claims = AuthClaims(
            sub="pro_001",
            email="pro@startup.com",
            orgId="startup_org",
            roles=["member", "editor"],
            plan="pro",
            features=["vector_search", "export"],
        )
        
        # Pro user should have member and editor roles
        assert claims.has_any_role("member", "admin") is True
        assert claims.has_role("editor") is True
        assert claims.has_role("admin") is False
        
        # Pro user should have pro plan
        assert claims.has_plan("pro") is True
        assert claims.has_plan("pro", "enterprise") is True
        assert claims.has_plan("enterprise") is False
        
        # Pro user should have some features
        assert claims.has_feature("vector_search") is True
        assert claims.has_feature("export") is True
        assert claims.has_feature("advanced_analytics") is False
    
    def test_cross_org_scenario(self):
        """Test user accessing different organization data."""
        claims = AuthClaims(
            sub="user_001",
            orgId="org_a",
            roles=["admin"],
            plan="enterprise",
        )
        
        # User should belong to their own org
        assert claims.belongs_to_org("org_a") is True
        
        # User should NOT belong to other orgs
        assert claims.belongs_to_org("org_b") is False
        assert claims.belongs_to_org("org_c") is False
        
        # Even admin users can't access other orgs without proper checks
        assert claims.has_role("admin") is True
        assert claims.belongs_to_org("other_org") is False


class TestAuthClaimsEdgeCases:
    """Test AuthClaims edge cases and error conditions."""
    
    def test_special_characters_in_fields(self):
        """Test fields with special characters."""
        claims = AuthClaims(
            sub="user@123",
            email="test+tag@example.com",
            orgId="org-with-dashes_and_underscores",
            roles=["role-with-dashes", "role_with_underscores"],
            plan="plan-name",
            features=["feature.with.dots", "feature-with-dashes"],
        )
        
        assert claims.sub == "user@123"
        assert claims.email == "test+tag@example.com"
        assert claims.orgId == "org-with-dashes_and_underscores"
    
    def test_unicode_characters(self):
        """Test fields with unicode characters."""
        claims = AuthClaims(
            sub="user_123",
            email="tëst@éxample.com",
            orgId="org_üñícödé",
        )
        
        assert claims.email == "tëst@éxample.com"
        assert claims.orgId == "org_üñícödé"
    
    def test_very_long_strings(self):
        """Test with very long string values."""
        long_string = "a" * 1000
        
        claims = AuthClaims(
            sub="user_123",
            email=f"{long_string}@example.com",
            orgId=long_string,
        )
        
        assert len(claims.email) > 1000
        assert len(claims.orgId) == 1000
    
    def test_empty_lists_vs_none(self):
        """Test behavior with empty lists vs None."""
        claims = AuthClaims(
            sub="user_123",
            roles=[],
            features=[],
        )
        
        assert claims.roles == []
        assert claims.features == []
        assert claims.has_any_role() is False
        assert claims.has_feature("any") is False
    
    def test_duplicate_roles_and_features(self):
        """Test with duplicate roles and features."""
        claims = AuthClaims(
            sub="user_123",
            roles=["admin", "admin", "member"],
            features=["feat1", "feat1", "feat2"],
        )
        
        # Duplicates should be preserved (not deduplicated by model)
        assert claims.roles == ["admin", "admin", "member"]
        assert claims.features == ["feat1", "feat1", "feat2"]
        
        # But helper methods should still work
        assert claims.has_role("admin") is True
        assert claims.has_feature("feat1") is True