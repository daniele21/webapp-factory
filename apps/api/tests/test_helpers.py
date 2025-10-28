"""
Test helpers and utilities for authentication tests.
"""

from datetime import datetime, timezone, timedelta
from typing import Dict, List, Optional, Any
from auth.jwt import sign_access_jwt
from auth.models import AuthClaims


class TokenFactory:
    """Factory class for creating test JWT tokens with various configurations."""
    
    @staticmethod
    def create_admin_token(
        user_id: str = "admin_001",
        email: str = "admin@example.com",
        org_id: str = "test_org",
        ttl_minutes: int = 60,
        **kwargs
    ) -> str:
        """Create an admin user token."""
        return sign_access_jwt(
            sub=user_id,
            email=email,
            orgId=org_id,
            roles=["admin", "owner"],
            plan="enterprise",
            features=["vector_search", "ai_assistant", "advanced_analytics"],
            ttl_minutes=ttl_minutes,
            **kwargs
        )
    
    @staticmethod
    def create_owner_token(
        user_id: str = "owner_001",
        email: str = "owner@example.com",
        org_id: str = "test_org",
        ttl_minutes: int = 60,
        **kwargs
    ) -> str:
        """Create an owner user token."""
        return sign_access_jwt(
            sub=user_id,
            email=email,
            orgId=org_id,
            roles=["owner"],
            plan="pro",
            features=["vector_search", "ai_assistant"],
            ttl_minutes=ttl_minutes,
            **kwargs
        )
    
    @staticmethod
    def create_pro_user_token(
        user_id: str = "pro_user_001",
        email: str = "pro.user@example.com",
        org_id: str = "test_org",
        ttl_minutes: int = 60,
        **kwargs
    ) -> str:
        """Create a pro plan user token."""
        return sign_access_jwt(
            sub=user_id,
            email=email,
            orgId=org_id,
            roles=["member"],
            plan="pro",
            features=["vector_search"],
            ttl_minutes=ttl_minutes,
            **kwargs
        )
    
    @staticmethod
    def create_free_user_token(
        user_id: str = "free_user_001",
        email: str = "free.user@example.com",
        org_id: str = "test_org",
        ttl_minutes: int = 60,
        **kwargs
    ) -> str:
        """Create a free plan user token."""
        return sign_access_jwt(
            sub=user_id,
            email=email,
            orgId=org_id,
            roles=["member"],
            plan="free",
            features=[],
            ttl_minutes=ttl_minutes,
            **kwargs
        )
    
    @staticmethod
    def create_enterprise_token(
        user_id: str = "enterprise_001",
        email: str = "enterprise@example.com",
        org_id: str = "test_org",
        ttl_minutes: int = 60,
        **kwargs
    ) -> str:
        """Create an enterprise plan user token."""
        return sign_access_jwt(
            sub=user_id,
            email=email,
            orgId=org_id,
            roles=["admin", "owner"],
            plan="enterprise",
            features=[
                "vector_search",
                "ai_assistant", 
                "advanced_analytics",
                "white_label",
                "priority_support"
            ],
            ttl_minutes=ttl_minutes,
            **kwargs
        )
    
    @staticmethod
    def create_custom_token(
        user_id: str,
        email: str = None,
        org_id: str = None,
        roles: List[str] = None,
        plan: str = None,
        features: List[str] = None,
        ttl_minutes: int = 60,
        **kwargs
    ) -> str:
        """Create a custom token with specified parameters."""
        return sign_access_jwt(
            sub=user_id,
            email=email,
            orgId=org_id,
            roles=roles or [],
            plan=plan,
            features=features or [],
            ttl_minutes=ttl_minutes,
            **kwargs
        )
    
    @staticmethod
    def create_expired_token(
        user_id: str = "expired_user",
        email: str = "expired@example.com",
        **kwargs
    ) -> str:
        """Create an already expired token."""
        return sign_access_jwt(
            sub=user_id,
            email=email,
            orgId="test_org",
            roles=["member"],
            plan="free",
            features=[],
            ttl_minutes=-1,  # Already expired
            **kwargs
        )
    
    @staticmethod
    def create_different_org_token(
        user_id: str = "other_user_001",
        email: str = "other@example.com",
        org_id: str = "other_org",
        ttl_minutes: int = 60,
        **kwargs
    ) -> str:
        """Create a token for a user from a different organization."""
        return sign_access_jwt(
            sub=user_id,
            email=email,
            orgId=org_id,
            roles=["member"],
            plan="pro",
            features=["vector_search"],
            ttl_minutes=ttl_minutes,
            **kwargs
        )


class ClaimsFactory:
    """Factory class for creating AuthClaims objects for testing."""
    
    @staticmethod
    def create_admin_claims(
        user_id: str = "admin_001",
        email: str = "admin@example.com",
        org_id: str = "test_org",
        **kwargs
    ) -> AuthClaims:
        """Create admin user claims."""
        return AuthClaims(
            sub=user_id,
            email=email,
            orgId=org_id,
            roles=["admin", "owner"],
            plan="enterprise",
            features=["vector_search", "ai_assistant", "advanced_analytics"],
            **kwargs
        )
    
    @staticmethod
    def create_owner_claims(
        user_id: str = "owner_001",
        email: str = "owner@example.com",
        org_id: str = "test_org",
        **kwargs
    ) -> AuthClaims:
        """Create owner user claims."""
        return AuthClaims(
            sub=user_id,
            email=email,
            orgId=org_id,
            roles=["owner"],
            plan="pro",
            features=["vector_search", "ai_assistant"],
            **kwargs
        )
    
    @staticmethod
    def create_member_claims(
        user_id: str = "member_001",
        email: str = "member@example.com",
        org_id: str = "test_org",
        plan: str = "pro",
        features: List[str] = None,
        **kwargs
    ) -> AuthClaims:
        """Create member user claims."""
        return AuthClaims(
            sub=user_id,
            email=email,
            orgId=org_id,
            roles=["member"],
            plan=plan,
            features=features or ["vector_search"],
            **kwargs
        )
    
    @staticmethod
    def create_free_user_claims(
        user_id: str = "free_user_001",
        email: str = "free.user@example.com",
        org_id: str = "test_org",
        **kwargs
    ) -> AuthClaims:
        """Create free user claims."""
        return AuthClaims(
            sub=user_id,
            email=email,
            orgId=org_id,
            roles=["member"],
            plan="free",
            features=[],
            **kwargs
        )
    
    @staticmethod
    def create_custom_claims(
        user_id: str,
        email: str = None,
        org_id: str = None,
        roles: List[str] = None,
        plan: str = None,
        features: List[str] = None,
        **kwargs
    ) -> AuthClaims:
        """Create custom claims with specified parameters."""
        return AuthClaims(
            sub=user_id,
            email=email,
            orgId=org_id,
            roles=roles or [],
            plan=plan,
            features=features or [],
            **kwargs
        )


class TestDataSets:
    """Predefined datasets for testing various scenarios."""
    
    USER_SCENARIOS = {
        "super_admin": {
            "sub": "super_admin_001",
            "email": "super@company.com",
            "orgId": "company_org",
            "roles": ["admin", "owner", "super_admin"],
            "plan": "enterprise",
            "features": ["all_features", "super_admin_panel"],
        },
        "org_admin": {
            "sub": "org_admin_001",
            "email": "admin@startup.com",
            "orgId": "startup_org",
            "roles": ["admin", "owner"],
            "plan": "pro",
            "features": ["vector_search", "ai_assistant", "analytics"],
        },
        "team_lead": {
            "sub": "team_lead_001",
            "email": "lead@team.com",
            "orgId": "team_org",
            "roles": ["member", "editor", "reviewer"],
            "plan": "pro",
            "features": ["vector_search", "team_collaboration"],
        },
        "power_user": {
            "sub": "power_user_001",
            "email": "power@user.com",
            "orgId": "power_org",
            "roles": ["member", "power_user"],
            "plan": "pro",
            "features": ["vector_search", "ai_assistant", "advanced_search"],
        },
        "basic_user": {
            "sub": "basic_user_001",
            "email": "basic@user.com",
            "orgId": "basic_org",
            "roles": ["member"],
            "plan": "pro",
            "features": ["vector_search"],
        },
        "trial_user": {
            "sub": "trial_user_001",
            "email": "trial@user.com",
            "orgId": "trial_org",
            "roles": ["member", "trial"],
            "plan": "trial",
            "features": ["limited_search"],
        },
        "free_user": {
            "sub": "free_user_001",
            "email": "free@user.com",
            "orgId": "free_org",
            "roles": ["member"],
            "plan": "free",
            "features": [],
        },
        "readonly_user": {
            "sub": "readonly_001",
            "email": "readonly@user.com",
            "orgId": "readonly_org",
            "roles": ["viewer", "readonly"],
            "plan": "free",
            "features": [],
        },
    }
    
    ORGANIZATION_SCENARIOS = {
        "enterprise_corp": {
            "org_id": "enterprise_corp",
            "plan": "enterprise",
            "features": ["all_features", "white_label", "sso", "advanced_analytics"],
            "user_count": 500,
        },
        "growing_startup": {
            "org_id": "growing_startup",
            "plan": "pro",
            "features": ["vector_search", "ai_assistant", "team_collaboration"],
            "user_count": 25,
        },
        "small_team": {
            "org_id": "small_team",
            "plan": "pro",
            "features": ["vector_search"],
            "user_count": 5,
        },
        "personal_project": {
            "org_id": "personal_project",
            "plan": "free",
            "features": [],
            "user_count": 1,
        },
    }
    
    FEATURE_FLAG_SCENARIOS = {
        "all_features": [
            "vector_search",
            "ai_assistant",
            "advanced_analytics",
            "export_data",
            "team_collaboration",
            "white_label",
            "sso",
            "priority_support",
        ],
        "pro_features": [
            "vector_search",
            "ai_assistant",
            "export_data",
            "team_collaboration",
        ],
        "basic_features": [
            "vector_search",
        ],
        "trial_features": [
            "limited_search",
            "trial_export",
        ],
        "no_features": [],
    }
    
    @classmethod
    def get_user_token(cls, scenario: str, **overrides) -> str:
        """Get a token for a predefined user scenario."""
        if scenario not in cls.USER_SCENARIOS:
            raise ValueError(f"Unknown user scenario: {scenario}")
        
        user_data = cls.USER_SCENARIOS[scenario].copy()
        user_data.update(overrides)
        
        return TokenFactory.create_custom_token(
            user_id=user_data["sub"],
            email=user_data["email"],
            org_id=user_data["orgId"],
            roles=user_data["roles"],
            plan=user_data["plan"],
            features=user_data["features"],
        )
    
    @classmethod
    def get_user_claims(cls, scenario: str, **overrides) -> AuthClaims:
        """Get claims for a predefined user scenario."""
        if scenario not in cls.USER_SCENARIOS:
            raise ValueError(f"Unknown user scenario: {scenario}")
        
        user_data = cls.USER_SCENARIOS[scenario].copy()
        user_data.update(overrides)
        
        return ClaimsFactory.create_custom_claims(
            user_id=user_data["sub"],
            email=user_data["email"],
            org_id=user_data["orgId"],
            roles=user_data["roles"],
            plan=user_data["plan"],
            features=user_data["features"],
        )


class AuthTestUtils:
    """Utility functions for auth testing."""
    
    @staticmethod
    def create_auth_headers(token: str) -> Dict[str, str]:
        """Create authorization headers from token."""
        return {"Authorization": f"Bearer {token}"}
    
    @staticmethod
    def assert_token_valid(token: str) -> Dict[str, Any]:
        """Assert token is valid and return claims."""
        from auth.jwt import verify_access_jwt
        return verify_access_jwt(token)
    
    @staticmethod
    def assert_claims_match(claims: AuthClaims, expected: Dict[str, Any]) -> None:
        """Assert claims match expected values."""
        for key, expected_value in expected.items():
            actual_value = getattr(claims, key)
            assert actual_value == expected_value, f"Expected {key}={expected_value}, got {actual_value}"
    
    @staticmethod
    def create_test_request_mock(
        path_params: Dict[str, Any] = None,
        query_params: Dict[str, Any] = None
    ):
        """Create a mock request object for testing."""
        from unittest.mock import Mock
        mock_request = Mock()
        mock_request.path_params = path_params or {}
        mock_request.query_params = query_params or {}
        return mock_request
    
    @staticmethod
    def time_until_expiry(token: str) -> float:
        """Get seconds until token expires."""
        from auth.jwt import verify_access_jwt
        claims = verify_access_jwt(token)
        exp_timestamp = claims.get("exp")
        if not exp_timestamp:
            return 0
        
        exp_datetime = datetime.fromtimestamp(exp_timestamp, timezone.utc)
        now = datetime.now(timezone.utc)
        return (exp_datetime - now).total_seconds()
    
    @staticmethod
    def is_token_expired(token: str) -> bool:
        """Check if token is expired."""
        try:
            from auth.jwt import verify_access_jwt
            verify_access_jwt(token)
            return False
        except Exception:
            return True
    
    @staticmethod
    def extract_claim(token: str, claim_name: str) -> Any:
        """Extract specific claim from token."""
        from auth.jwt import verify_access_jwt
        claims = verify_access_jwt(token)
        return claims.get(claim_name)


class TestScenarioBuilder:
    """Builder class for creating complex test scenarios."""
    
    def __init__(self):
        self.users = []
        self.organizations = []
        self.tokens = {}
        self.claims = {}
    
    def add_user(
        self,
        name: str,
        user_id: str = None,
        email: str = None,
        org_id: str = "default_org",
        roles: List[str] = None,
        plan: str = "pro",
        features: List[str] = None,
    ) -> "TestScenarioBuilder":
        """Add a user to the test scenario."""
        user_id = user_id or f"{name}_001"
        email = email or f"{name}@example.com"
        roles = roles or ["member"]
        features = features or ["vector_search"]
        
        user_data = {
            "name": name,
            "sub": user_id,
            "email": email,
            "orgId": org_id,
            "roles": roles,
            "plan": plan,
            "features": features,
        }
        
        self.users.append(user_data)
        
        # Create token and claims
        self.tokens[name] = TokenFactory.create_custom_token(**user_data)
        self.claims[name] = ClaimsFactory.create_custom_claims(**user_data)
        
        return self
    
    def add_organization(
        self,
        org_id: str,
        plan: str = "pro",
        features: List[str] = None,
        user_count: int = 10,
    ) -> "TestScenarioBuilder":
        """Add an organization to the test scenario."""
        org_data = {
            "org_id": org_id,
            "plan": plan,
            "features": features or ["vector_search"],
            "user_count": user_count,
        }
        
        self.organizations.append(org_data)
        return self
    
    def get_token(self, user_name: str) -> str:
        """Get token for a user."""
        if user_name not in self.tokens:
            raise ValueError(f"User {user_name} not found in scenario")
        return self.tokens[user_name]
    
    def get_claims(self, user_name: str) -> AuthClaims:
        """Get claims for a user."""
        if user_name not in self.claims:
            raise ValueError(f"User {user_name} not found in scenario")
        return self.claims[user_name]
    
    def get_auth_headers(self, user_name: str) -> Dict[str, str]:
        """Get auth headers for a user."""
        token = self.get_token(user_name)
        return AuthTestUtils.create_auth_headers(token)
    
    def build(self) -> Dict[str, Any]:
        """Build the complete test scenario."""
        return {
            "users": {user["name"]: user for user in self.users},
            "organizations": {org["org_id"]: org for org in self.organizations},
            "tokens": self.tokens,
            "claims": self.claims,
        }


# Convenience functions for common test scenarios
def create_multi_tenant_scenario() -> TestScenarioBuilder:
    """Create a multi-tenant test scenario."""
    builder = TestScenarioBuilder()
    
    # Organization A - Enterprise
    builder.add_organization("org_a", plan="enterprise", features=TestDataSets.FEATURE_FLAG_SCENARIOS["all_features"])
    builder.add_user("alice_admin", org_id="org_a", roles=["admin", "owner"], plan="enterprise", features=TestDataSets.FEATURE_FLAG_SCENARIOS["all_features"])
    builder.add_user("alice_member", org_id="org_a", roles=["member"], plan="enterprise", features=TestDataSets.FEATURE_FLAG_SCENARIOS["pro_features"])
    
    # Organization B - Pro
    builder.add_organization("org_b", plan="pro", features=TestDataSets.FEATURE_FLAG_SCENARIOS["pro_features"])
    builder.add_user("bob_owner", org_id="org_b", roles=["owner"], plan="pro", features=TestDataSets.FEATURE_FLAG_SCENARIOS["pro_features"])
    builder.add_user("bob_member", org_id="org_b", roles=["member"], plan="pro", features=TestDataSets.FEATURE_FLAG_SCENARIOS["basic_features"])
    
    # Organization C - Free
    builder.add_organization("org_c", plan="free", features=TestDataSets.FEATURE_FLAG_SCENARIOS["no_features"])
    builder.add_user("charlie_owner", org_id="org_c", roles=["owner"], plan="free", features=TestDataSets.FEATURE_FLAG_SCENARIOS["no_features"])
    
    return builder


def create_role_hierarchy_scenario() -> TestScenarioBuilder:
    """Create a role hierarchy test scenario."""
    builder = TestScenarioBuilder()
    
    builder.add_organization("test_org", plan="enterprise")
    builder.add_user("super_admin", roles=["super_admin", "admin", "owner"], plan="enterprise")
    builder.add_user("admin", roles=["admin", "owner"], plan="enterprise")
    builder.add_user("owner", roles=["owner"], plan="pro")
    builder.add_user("editor", roles=["editor", "member"], plan="pro")
    builder.add_user("member", roles=["member"], plan="pro")
    builder.add_user("viewer", roles=["viewer"], plan="free")
    
    return builder