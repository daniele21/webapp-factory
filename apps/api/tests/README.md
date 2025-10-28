# Authentication System Tests

Comprehensive test suite for the Webapp Factory authentication system.

## Test Structure

```
tests/
├── __init__.py
├── conftest.py              # Pytest configuration and fixtures
├── test_helpers.py          # Test utilities and helpers
└── auth/
    ├── __init__.py
    ├── test_jwt.py          # JWT utilities tests
    ├── test_models.py       # AuthClaims model tests  
    ├── test_deps.py         # FastAPI dependencies tests
    ├── test_decorators.py   # Service layer decorators tests
    └── test_protected_routes.py  # Integration tests for protected endpoints
```

## Test Categories

### Unit Tests
- **JWT Utilities** (`test_jwt.py`): Token signing, verification, creation
- **Auth Models** (`test_models.py`): AuthClaims validation and helper methods
- **Dependencies** (`test_deps.py`): FastAPI auth dependency functions
- **Decorators** (`test_decorators.py`): Service layer auth guards

### Integration Tests  
- **Protected Routes** (`test_protected_routes.py`): End-to-end API testing

## Running Tests

### Install Test Dependencies

```bash
# Install with test dependencies
pip install -e ".[test]"

# Or install dev dependencies (includes testing tools)
pip install -e ".[dev,test]"
```

### Basic Test Execution

```bash
# Run all tests
pytest

# Run with verbose output
pytest -v

# Run specific test file
pytest tests/auth/test_jwt.py

# Run specific test class
pytest tests/auth/test_jwt.py::TestJWTSigning

# Run specific test function
pytest tests/auth/test_jwt.py::TestJWTSigning::test_sign_basic_jwt
```

### Test Filtering

```bash
# Run only unit tests
pytest -m "unit"

# Run only integration tests
pytest -m "integration"

# Run only auth-related tests
pytest -m "auth"

# Skip slow tests
pytest -m "not slow"

# Run tests matching pattern
pytest -k "test_jwt"
```

### Coverage Reports

```bash
# Run with coverage
pytest --cov=auth --cov=routes

# Generate HTML coverage report
pytest --cov=auth --cov=routes --cov-report=html

# Generate XML coverage report (for CI)
pytest --cov=auth --cov=routes --cov-report=xml
```

### Parallel Test Execution

```bash
# Run tests in parallel (requires pytest-xdist) 
pytest -n auto

# Run with specific number of workers
pytest -n 4
```

## Test Fixtures

### Authentication Fixtures

```python
# Basic fixtures available in all tests
def test_example(client, auth_headers, admin_token):
    # client: FastAPI TestClient
    # auth_headers: Function to create auth headers
    # admin_token: Pre-configured admin JWT token
    
    headers = auth_headers(roles=["admin"], plan="pro")
    response = client.get("/protected/me", headers=headers)
```

### Available Fixtures

- `client`: FastAPI TestClient instance
- `auth_headers`: Factory function for creating auth headers
- `admin_token`: Admin user JWT token
- `owner_token`: Owner user JWT token  
- `pro_user_token`: Pro plan user JWT token
- `free_user_token`: Free plan user JWT token
- `enterprise_token`: Enterprise plan user JWT token
- `different_org_token`: User from different organization
- `expired_token`: Expired JWT token
- `sample_claims`: Sample AuthClaims object

## Test Helpers

### TokenFactory

```python
from tests.test_helpers import TokenFactory

# Create predefined tokens
admin_token = TokenFactory.create_admin_token()
pro_token = TokenFactory.create_pro_user_token()

# Create custom token
custom_token = TokenFactory.create_custom_token(
    user_id="custom_user",
    roles=["editor"],
    plan="pro",
    features=["vector_search"]
)
```

### ClaimsFactory

```python
from tests.test_helpers import ClaimsFactory

# Create predefined claims
admin_claims = ClaimsFactory.create_admin_claims()
member_claims = ClaimsFactory.create_member_claims()

# Create custom claims
custom_claims = ClaimsFactory.create_custom_claims(
    user_id="custom_user",
    roles=["editor"],
    plan="pro"
)
```

### TestDataSets

```python
from tests.test_helpers import TestDataSets

# Get predefined user scenario
token = TestDataSets.get_user_token("power_user")
claims = TestDataSets.get_user_claims("free_user")

# Available scenarios:
# - super_admin, org_admin, team_lead, power_user
# - basic_user, trial_user, free_user, readonly_user
```

### TestScenarioBuilder

```python
from tests.test_helpers import TestScenarioBuilder

# Build complex test scenarios
scenario = (TestScenarioBuilder()
    .add_user("alice", roles=["admin"], plan="enterprise")
    .add_user("bob", roles=["member"], plan="pro")
    .add_organization("test_org", plan="enterprise")
    .build())

# Use in tests
alice_token = scenario.get_token("alice")
bob_headers = scenario.get_auth_headers("bob")
```

## Writing Tests

### Unit Test Example

```python
import pytest
from auth.models import AuthClaims

class TestAuthClaims:
    def test_has_role(self):
        claims = AuthClaims(sub="user_123", roles=["admin", "member"])
        
        assert claims.has_role("admin") is True
        assert claims.has_role("guest") is False
    
    def test_has_role_case_insensitive(self):
        claims = AuthClaims(sub="user_123", roles=["Admin"])
        
        assert claims.has_role("admin") is True
```

### Integration Test Example

```python
import pytest

class TestProtectedRoutes:
    def test_admin_endpoint_success(self, client, admin_token):
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = client.get("/protected/admin/users", headers=headers)
        
        assert response.status_code == 200
        assert "users" in response.json()
    
    def test_admin_endpoint_forbidden(self, client, free_user_token):
        headers = {"Authorization": f"Bearer {free_user_token}"}
        response = client.get("/protected/admin/users", headers=headers)
        
        assert response.status_code == 403
```

### Parameterized Test Example

```python
import pytest

class TestRoleBasedAccess:
    @pytest.mark.parametrize("role,expected_status", [
        ("admin", 200),
        ("owner", 200), 
        ("member", 403),
        ("viewer", 403),
    ])
    def test_admin_endpoint_by_role(self, client, auth_headers, role, expected_status):
        headers = auth_headers(roles=[role])
        response = client.get("/protected/admin/users", headers=headers)
        
        assert response.status_code == expected_status
```

### Mock Example

```python
import pytest
from unittest.mock import patch

class TestServiceIntegration:
    @patch('providers.firestore.get_firestore_client')
    def test_user_service_with_mock(self, mock_firestore, admin_token):
        # Mock Firestore responses
        mock_firestore.return_value.collection.return_value.document.return_value.get.return_value.to_dict.return_value = {
            "email": "admin@example.com",
            "roles": ["admin"]
        }
        
        # Test your service
        # ...
```

## Test Configuration

### Pytest Configuration (`pyproject.toml`)

```toml
[tool.pytest.ini_options]
testpaths = ["tests"]
python_files = "test_*.py"
addopts = [
  "--strict-markers",
  "--verbose",
  "--cov=auth",
  "--cov-report=term-missing",
]
markers = [
  "slow: marks tests as slow",
  "integration: marks tests as integration tests", 
  "unit: marks tests as unit tests",
  "auth: marks tests related to authentication",
]
```

### Environment Variables for Testing

```bash
# Set in conftest.py or environment
APP_JWT_SECRET=test-secret-key
APP_JWT_AUDIENCE=webapp-factory
APP_JWT_ISSUER=https://api.test.com
APP_ENV=test
```

## Test Best Practices

### 1. Test Organization
- Group related tests in classes
- Use descriptive test names
- Follow AAA pattern (Arrange, Act, Assert)

### 2. Test Isolation
- Each test should be independent
- Use fixtures for setup/teardown
- Don't rely on test execution order

### 3. Assertions
- Use specific assertions
- Test both success and failure cases
- Include edge cases and boundary conditions

### 4. Test Data
- Use factories for creating test data
- Parameterize tests for multiple scenarios  
- Keep test data minimal and focused

### 5. Mocking
- Mock external dependencies
- Use realistic mock data
- Don't over-mock (test real code paths when possible)

## Common Test Patterns

### Testing Authorization

```python
def test_authorization_flow(self, client, auth_headers):
    # Test unauthorized access
    response = client.get("/protected/admin/users")
    assert response.status_code == 401
    
    # Test forbidden access
    headers = auth_headers(roles=["member"])
    response = client.get("/protected/admin/users", headers=headers)
    assert response.status_code == 403
    
    # Test authorized access
    headers = auth_headers(roles=["admin"])
    response = client.get("/protected/admin/users", headers=headers)
    assert response.status_code == 200
```

### Testing Plan Requirements

```python
def test_plan_requirements(self, client, auth_headers):
    # Test free plan limitation
    headers = auth_headers(plan="free")
    response = client.get("/protected/pro/export", headers=headers)
    assert response.status_code == 402
    
    # Test pro plan access
    headers = auth_headers(plan="pro")
    response = client.get("/protected/pro/export", headers=headers)
    assert response.status_code == 200
```

### Testing Feature Flags

```python
def test_feature_flags(self, client, auth_headers):
    # Test without feature
    headers = auth_headers(features=[])
    response = client.get("/protected/labs/vector-search", headers=headers)
    assert response.status_code == 403
    
    # Test with feature
    headers = auth_headers(features=["vector_search"])
    response = client.get("/protected/labs/vector-search", headers=headers)
    assert response.status_code == 200
```

## Troubleshooting

### Common Issues

**Test fails with "Missing bearer token"**
- Check that `auth_headers()` is being used correctly
- Verify token generation in fixtures

**Test fails with "Invalid token"**  
- Check JWT secret configuration in test environment
- Verify token hasn't expired

**Import errors**
- Ensure test dependencies are installed: `pip install -e ".[test]"`
- Check Python path configuration

**Fixture not found**
- Verify fixture is defined in `conftest.py`
- Check fixture scope (function, class, session)

### Debug Mode

```python
# Add debug prints in tests
def test_debug_example(self, auth_headers):
    headers = auth_headers(roles=["admin"])
    print(f"Headers: {headers}")
    
    # Use pdb for debugging
    import pdb; pdb.set_trace()
```

### Verbose Output

```bash
# Run with maximum verbosity
pytest -vvv

# Show local variables on failures
pytest --tb=long

# Show full diff on assertion failures
pytest --tb=short -v
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      
      - name: Install dependencies
        run: |
          pip install -e ".[test]"
      
      - name: Run tests
        run: |
          pytest --cov=auth --cov=routes --cov-report=xml
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage.xml
```

This comprehensive test suite ensures the authentication system is robust, secure, and maintainable. All authentication flows, authorization patterns, and edge cases are thoroughly tested.