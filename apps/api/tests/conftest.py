"""
Pytest configuration and fixtures for the Webapp Factory API tests.
"""

import os
import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch

# Set test environment variables
os.environ["APP_JWT_SECRET"] = "test-secret-key"
os.environ["APP_JWT_AUDIENCE"] = "webapp-factory"
os.environ["APP_JWT_ISSUER"] = "https://api.test.com"
os.environ["APP_ENV"] = "test"

from main import app
from auth.jwt import sign_access_jwt


@pytest.fixture
def client():
    """FastAPI test client fixture."""
    return TestClient(app)


@pytest.fixture
def auth_headers():
    """Factory function to create auth headers with different user types."""
    def _create_headers(
        user_id: str = "test_user_001",
        email: str = "test@example.com",
        org_id: str = "test_org",
        roles: list[str] | None = None,
        plan: str = "pro",
        features: list[str] | None = None,
        ttl_minutes: int = 60,
    ):
        token = sign_access_jwt(
            sub=user_id,
            email=email,
            orgId=org_id,
            roles=roles or ["member"],
            plan=plan,
            features=features or [],
            ttl_minutes=ttl_minutes,
        )
        return {"Authorization": f"Bearer {token}"}
    
    return _create_headers


@pytest.fixture
def admin_token():
    """Admin user JWT token."""
    return sign_access_jwt(
        sub="admin_001",
        email="admin@example.com",
        orgId="test_org",
        roles=["admin", "owner"],
        plan="enterprise",
        features=["vector_search", "ai_assistant", "advanced_analytics"],
        ttl_minutes=60,
    )


@pytest.fixture
def owner_token():
    """Owner user JWT token."""
    return sign_access_jwt(
        sub="owner_001",
        email="owner@example.com",
        orgId="test_org",
        roles=["owner"],
        plan="pro", 
        features=["vector_search", "ai_assistant"],
        ttl_minutes=60,
    )


@pytest.fixture
def pro_user_token():
    """Pro plan user JWT token."""
    return sign_access_jwt(
        sub="pro_user_001",
        email="pro.user@example.com",
        orgId="test_org",
        roles=["member"],
        plan="pro",
        features=["vector_search"],
        ttl_minutes=60,
    )


@pytest.fixture
def free_user_token():
    """Free plan user JWT token."""
    return sign_access_jwt(
        sub="free_user_001",
        email="free.user@example.com",
        orgId="test_org",
        roles=["member"],
        plan="free",
        features=[],
        ttl_minutes=60,
    )


@pytest.fixture
def enterprise_token():
    """Enterprise plan user JWT token."""
    return sign_access_jwt(
        sub="enterprise_001",
        email="enterprise@example.com",
        orgId="test_org",
        roles=["admin", "owner"],
        plan="enterprise",
        features=["vector_search", "ai_assistant", "advanced_analytics", "white_label"],
        ttl_minutes=60,
    )


@pytest.fixture
def different_org_token():
    """User from a different organization."""
    return sign_access_jwt(
        sub="other_user_001",
        email="other@example.com",
        orgId="other_org",
        roles=["member"],
        plan="pro",
        features=["vector_search"],
        ttl_minutes=60,
    )


@pytest.fixture
def expired_token():
    """Expired JWT token for testing expiration."""
    return sign_access_jwt(
        sub="expired_user",
        email="expired@example.com",
        orgId="test_org",
        roles=["member"],
        plan="free",
        features=[],
        ttl_minutes=-1,  # Already expired
    )


@pytest.fixture
def mock_firestore():
    """Mock Firestore client for testing."""
    with patch('providers.firestore.get_firestore_client') as mock:
        yield mock


@pytest.fixture
def mock_redis():
    """Mock Redis client for testing."""
    with patch('providers.redis.get_redis_client') as mock:
        yield mock


# Test data constants
TEST_USER_DATA = {
    "admin": {
        "sub": "admin_001",
        "email": "admin@example.com",
        "orgId": "test_org",
        "roles": ["admin", "owner"],
        "plan": "enterprise",
        "features": ["vector_search", "ai_assistant", "advanced_analytics"],
    },
    "owner": {
        "sub": "owner_001", 
        "email": "owner@example.com",
        "orgId": "test_org",
        "roles": ["owner"],
        "plan": "pro",
        "features": ["vector_search", "ai_assistant"],
    },
    "pro_user": {
        "sub": "pro_user_001",
        "email": "pro.user@example.com",
        "orgId": "test_org",
        "roles": ["member"],
        "plan": "pro",
        "features": ["vector_search"],
    },
    "free_user": {
        "sub": "free_user_001",
        "email": "free.user@example.com",
        "orgId": "test_org",
        "roles": ["member"],
        "plan": "free",
        "features": [],
    },
}


@pytest.fixture(params=["admin", "owner", "pro_user", "free_user"])
def user_type(request):
    """Parametrized fixture for different user types."""
    return request.param


@pytest.fixture
def sample_claims():
    """Sample AuthClaims data for testing."""
    from auth.models import AuthClaims
    return AuthClaims(
        sub="test_user_001",
        email="test@example.com",
        orgId="test_org",
        roles=["member"],
        plan="pro",
        features=["vector_search"],
    )