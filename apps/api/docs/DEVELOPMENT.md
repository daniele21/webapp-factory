# Backend Development Guide

This guide covers the development workflow for the Webapp Factory API backend, with a focus on the authentication system and testing practices.

## Quick Start

1. **Install dependencies:**
   ```bash
   cd apps/api
   make install
   # or
   pip install -e ".[test,dev]"
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your settings
   ```

3. **Run tests:**
   ```bash
   make test
   # or
   python scripts/run_tests.py --all
   ```

4. **Start development server:**
   ```bash
   make dev
   # or
   uvicorn main:app --reload
   ```

## Authentication System

The authentication system is built on JWT tokens with OAuth 2.0 architecture and supports:

- **JWT Authentication**: Secure token-based authentication
- **Role-based Access Control (RBAC)**: Admin, user, guest roles
- **Plan-based Authorization**: Free, pro, enterprise subscription tiers
- **Feature Flags**: Dynamic feature enablement
- **Organization Scoping**: Multi-tenant organization support

### Key Components

```
auth/
├── __init__.py      # Module exports
├── jwt.py           # JWT utilities (sign, verify, create)
├── models.py        # AuthClaims Pydantic model
├── deps.py          # FastAPI dependencies for routes
└── decorators.py    # Service layer guards
```

### Usage Examples

#### Route Protection

```python
from fastapi import APIRouter, Depends
from auth import auth_required, require_roles, AuthClaims

router = APIRouter()

@router.get("/protected")
async def protected_endpoint(claims: AuthClaims = Depends(auth_required)):
    return {"user_id": claims.user_id}

@router.get("/admin")
async def admin_endpoint(claims: AuthClaims = Depends(require_roles(["admin"]))):
    return {"message": "Admin access granted"}
```

#### Service Layer Guards

```python
from auth.decorators import guard_roles, guard_plan

@guard_roles(["admin", "moderator"])
async def delete_user(user_id: str, claims: AuthClaims):
    # Only admins and moderators can delete users
    pass

@guard_plan(["pro", "enterprise"])
async def export_data(claims: AuthClaims):
    # Only pro and enterprise users can export data
    pass
```

### Creating Test JWTs

```python
from auth.jwt import create_test_jwt

# Create a basic JWT
token = create_test_jwt(user_id="123")

# Create an admin JWT
admin_token = create_test_jwt(
    user_id="admin123",
    roles=["admin"],
    plan="enterprise"
)
```

## Testing

### Test Structure

```
tests/
├── auth/                    # Authentication tests
│   ├── test_jwt.py         # JWT utilities tests
│   ├── test_models.py      # AuthClaims model tests
│   ├── test_deps.py        # FastAPI dependencies tests
│   └── test_decorators.py  # Service layer guards tests
├── routes/                 # Route tests
│   └── test_protected.py   # Protected routes tests
├── conftest.py             # Pytest configuration and fixtures
├── test_helpers.py         # Test utilities and factories
└── README.md               # Testing documentation
```

### Running Tests

```bash
# All tests
make test

# Specific test categories
make test-unit
make test-integration
make test-auth

# Coverage report
make coverage

# Parallel execution
make test-parallel

# Specific test file
python scripts/run_tests.py --specific tests/auth/test_jwt.py
```

### Test Fixtures

The test suite includes several helpful fixtures:

```python
# Available in all tests
def test_example(test_client, auth_headers, mock_claims):
    response = test_client.get("/protected", headers=auth_headers)
    assert response.status_code == 200
```

#### Key Fixtures

- `test_client`: FastAPI test client
- `auth_headers`: HTTP headers with valid JWT
- `admin_headers`: HTTP headers with admin JWT
- `mock_claims`: AuthClaims instance for testing
- `token_factory`: Factory for creating test JWTs
- `claims_factory`: Factory for creating test claims

### Test Markers

Tests are categorized with pytest markers:

```bash
# Run only unit tests
pytest -m unit

# Run only integration tests  
pytest -m integration

# Skip slow tests
pytest -m "not slow"
```

## Development Workflow

### 1. Code Style

The project uses:
- **Black**: Code formatting
- **isort**: Import sorting
- **Flake8**: Linting
- **MyPy**: Type checking

```bash
# Format code
make format

# Run linting
make lint

# Type checking
make type-check

# All checks
make check-all
```

### 2. Pre-commit Workflow

Before committing:

```bash
# Format and lint
make format
make lint

# Run tests
make test

# Check everything
make check-all
```

### 3. Adding New Features

1. **Write tests first** (TDD approach):
   ```bash
   # Create test file
   touch tests/auth/test_new_feature.py
   
   # Write failing tests
   # Implement feature
   # Make tests pass
   ```

2. **Use existing patterns**:
   - Follow the auth module structure
   - Use dependency injection for route protection
   - Add service layer guards for business logic
   - Include comprehensive tests

3. **Update documentation**:
   - Add docstrings to new functions
   - Update this guide if needed
   - Add examples for complex features

### 4. Testing New Features

```python
# Example test structure
def test_new_auth_feature():
    # Arrange
    claims = ClaimsFactory.create(roles=["admin"])
    
    # Act
    result = new_feature(claims)
    
    # Assert
    assert result.success is True
```

## Configuration

### Environment Variables

Key configuration in `.env`:

```bash
# JWT Configuration
JWT_SECRET_KEY=your-secret-key-here
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=15

# Database
DATABASE_URL=sqlite:///./test.db

# Redis (optional)
REDIS_URL=redis://localhost:6379

# Feature Flags
FEATURE_FLAGS_ENABLED=true
```

### Settings

The `settings.py` file contains:
- JWT configuration
- Database settings
- Feature flag settings
- Environment-specific overrides

## Common Tasks

### Adding a New Role

1. **Update AuthClaims validation** (if needed):
   ```python
   # In auth/models.py
   roles: list[str] = Field(
       default_factory=list,
       description="User roles (admin, user, guest, new_role)"
   )
   ```

2. **Create route protection**:
   ```python
   @router.get("/new-role-endpoint")
   async def endpoint(claims: AuthClaims = Depends(require_roles(["new_role"]))):
       pass
   ```

3. **Add tests**:
   ```python
   def test_new_role_access(test_client):
       headers = create_auth_headers(roles=["new_role"])
       response = test_client.get("/new-role-endpoint", headers=headers)
       assert response.status_code == 200
   ```

### Adding a New Plan

1. **Update plan validation** (if needed):
   ```python
   # In auth/models.py - plans already support any string value
   ```

2. **Create plan protection**:
   ```python
   @router.get("/premium-feature")
   async def endpoint(claims: AuthClaims = Depends(require_plan(["premium"]))):
       pass
   ```

3. **Add service layer guard**:
   ```python
   @guard_plan(["premium", "enterprise"])
   async def premium_service(claims: AuthClaims):
       pass
   ```

### Adding Feature Flags

1. **Update feature flag handling**:
   ```python
   @router.get("/beta-feature")
   async def endpoint(claims: AuthClaims = Depends(require_feature("beta_ui"))):
       pass
   ```

2. **Service layer guard**:
   ```python
   @guard_feature("advanced_analytics")
   async def analytics_service(claims: AuthClaims):
       pass
   ```

## Troubleshooting

### Common Issues

1. **JWT Verification Fails**:
   - Check `JWT_SECRET_KEY` in `.env`
   - Ensure clock synchronization
   - Verify token expiration

2. **Tests Failing**:
   ```bash
   # Clean cache and rerun
   make clean
   make test
   ```

3. **Import Errors**:
   ```bash
   # Reinstall in development mode
   pip install -e ".[test,dev]"
   ```

4. **Permission Denied**:
   - Check file permissions on scripts
   - Ensure virtual environment is activated

### Debug Mode

Enable debug logging:

```bash
make dev-debug
```

Or set environment variable:
```bash
export LOG_LEVEL=DEBUG
uvicorn main:app --reload
```

## Production Considerations

### Security

- Use strong `JWT_SECRET_KEY` (256-bit minimum)
- Set appropriate token expiration times
- Implement token refresh mechanism
- Use HTTPS in production
- Enable CORS properly
- Implement rate limiting

### Performance

- Consider JWT token size (keep claims minimal)
- Implement token caching if needed
- Use connection pooling for database
- Monitor authentication endpoint performance

### Monitoring

- Log authentication attempts
- Monitor failed login attempts
- Track token usage patterns
- Set up alerts for security events

## API Documentation

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **OpenAPI JSON**: http://localhost:8000/openapi.json

The authentication endpoints are automatically documented with examples and schemas.

## Contributing

1. Follow the existing code style
2. Write comprehensive tests
3. Update documentation
4. Run all checks before submitting
5. Keep commits focused and well-described

For questions or issues, refer to the test files for examples of proper usage patterns.