# Authentication System - Webapp Factory

A comprehensive, secure-by-default JWT-based authentication system for the Webapp Factory backend.

## Architecture Overview

This authentication system provides:

- **JWT Access Tokens**: Short-lived (15m), stateless, bearer tokens
- **Role-Based Access Control (RBAC)**: Fine-grained permissions with roles
- **Plan-Based Authorization**: Subscription tier enforcement  
- **Feature Flags**: Per-user feature access control
- **Organization Scoping**: Multi-tenant authorization
- **FastAPI Dependencies**: Easy-to-use route decorators
- **Service Layer Guards**: Python decorators for business logic

## Core Components

### 1. JWT Utilities (`auth/jwt.py`)
- `sign_access_jwt()`: Create signed JWT tokens
- `verify_access_jwt()`: Validate and decode tokens
- `create_test_jwt()`: Development helper

### 2. Auth Models (`auth/models.py`)
- `AuthClaims`: Pydantic model for JWT payload
- Helper methods for role/plan/feature checking

### 3. FastAPI Dependencies (`auth/deps.py`)
- `auth_required`: Basic authentication requirement
- `require_roles()`: Role-based access control
- `require_plan()`: Subscription plan enforcement
- `require_feature()`: Feature flag authorization
- `require_org()`: Organization membership validation
- `optional_auth`: Optional authentication for public endpoints

### 4. Service Decorators (`auth/decorators.py`)
- `@guard_roles()`: Protect service functions with role requirements
- `@guard_plan()`: Enforce subscription plans on business logic
- `@guard_feature()`: Feature flag protection
- `@guard_org()`: Organization membership validation
- `@guard_authenticated`: Simple auth requirement

## Quick Start

### 1. Install Dependencies

```bash
cd apps/api
pip install -e .
```

### 2. Configure Environment

Copy `.env.example` to `.env` and configure:

```bash
# JWT Configuration
APP_JWT_SECRET="your-secret-key-change-in-production"
APP_JWT_AUDIENCE="webapp-factory"
APP_JWT_ISSUER="https://api.example.com"
```

### 3. Generate Test Tokens

```bash
# Using the JWT utility
python auth/jwt.py

# Using the test helper script
python scripts/jwt_test_helper.py --preset admin
python scripts/jwt_test_helper.py --custom --user-id user123 --roles owner --plan pro
```

### 4. Start the API

```bash
uvicorn main:app --reload --port 8000
```

## Usage Examples

### Route Protection

```python
from fastapi import APIRouter, Depends
from auth.deps import auth_required, require_roles, require_plan
from auth.models import AuthClaims

router = APIRouter()

@router.get("/profile")
def get_profile(claims: AuthClaims = Depends(auth_required)):
    return {"userId": claims.sub, "email": claims.email}

@router.get("/admin/users") 
def list_users(claims: AuthClaims = Depends(require_roles("admin", "owner"))):
    return {"users": [...], "requestedBy": claims.sub}

@router.get("/pro/export")
def export_data(claims: AuthClaims = Depends(require_plan("pro", "enterprise"))):
    return {"status": "queued", "orgId": claims.orgId}

@router.get("/org/{org_id}/settings")
def org_settings(org_id: str, claims: AuthClaims = Depends(require_org("org_id"))):
    return {"orgId": org_id, "settings": {...}}
```

### Service Layer Protection

```python
from auth.decorators import guard_roles, guard_plan
from auth.models import AuthClaims

@guard_roles("admin", "owner")
def delete_user(*, claims: AuthClaims, user_id: str):
    # Business logic here
    pass

@guard_plan("pro", "enterprise") 
def generate_report(*, claims: AuthClaims, report_type: str):
    # Premium feature logic
    pass

# Usage in routes
@router.delete("/users/{user_id}")
def delete_user_endpoint(user_id: str, claims: AuthClaims = Depends(auth_required)):
    delete_user(claims=claims, user_id=user_id)
    return {"deleted": user_id}
```

### Custom Authorization Logic

```python
@router.get("/custom")
def custom_endpoint(claims: AuthClaims = Depends(auth_required)):
    # Check multiple conditions
    if not claims.has_any_role("admin", "moderator"):
        raise HTTPException(403, "Admin or moderator required")
    
    if not claims.has_plan("pro", "enterprise"):
        raise HTTPException(402, "Pro plan required")
    
    if not claims.has_feature("advanced_search"):
        raise HTTPException(403, "Advanced search not enabled")
    
    return {"message": "Access granted"}
```

## Testing

### 1. Generate Test Tokens

```bash
# List available presets
python scripts/jwt_test_helper.py --list-presets

# Generate admin token
python scripts/jwt_test_helper.py --preset admin

# Generate custom token
python scripts/jwt_test_helper.py --custom \
  --user-id test123 \
  --email test@example.com \
  --roles member \
  --plan pro \
  --features vector_search
```

### 2. Test Protected Endpoints

```bash
# Export token
export TOKEN="eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."

# Test basic auth
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8000/protected/me

# Test role requirement
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8000/protected/admin/users

# Test plan requirement  
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8000/protected/pro/export

# Test organization scoping
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8000/protected/org/org_abc/settings
```

### 3. Test Error Cases

```bash
# No token (401)
curl http://localhost:8000/protected/me

# Invalid token (401)
curl -H "Authorization: Bearer invalid-token" \
  http://localhost:8000/protected/me

# Insufficient role (403)
curl -H "Authorization: Bearer $MEMBER_TOKEN" \
  http://localhost:8000/protected/admin/users

# Plan upgrade required (402)
curl -H "Authorization: Bearer $FREE_TOKEN" \
  http://localhost:8000/protected/pro/export
```

## Security Features

### Token Security
- Short-lived access tokens (15 minutes default)
- Strong secret key requirement (`APP_JWT_SECRET`)
- Audience and issuer validation
- Cryptographic signing with HS256 (configurable)

### Authorization Layers
- **Authentication**: Valid JWT required
- **Role-Based**: User roles (admin, owner, member, etc.)
- **Plan-Based**: Subscription tiers (free, pro, enterprise)
- **Feature-Based**: Granular feature flags
- **Organization**: Multi-tenant isolation

### Error Handling
- `401 Unauthorized`: Missing or invalid token
- `403 Forbidden`: Insufficient permissions
- `402 Payment Required`: Plan upgrade needed
- Detailed error messages for debugging

## Configuration

### Environment Variables

```bash
# Required
APP_JWT_SECRET="change-me-in-production"

# Optional (with defaults)
APP_JWT_AUDIENCE="webapp-factory"
APP_JWT_ISSUER="https://api.example.com"  
APP_JWT_ALG="HS256"
```

### JWT Payload Structure

```json
{
  "sub": "user_123",
  "email": "user@example.com", 
  "orgId": "org_abc",
  "roles": ["owner"],
  "plan": "pro",
  "features": ["vector_search", "ai_assistant"],
  "iat": 1640995200,
  "exp": 1640996100,
  "aud": "webapp-factory",
  "iss": "https://api.example.com"
}
```

## Extension Points

### Custom Claims
Add new fields to `AuthClaims` model and JWT signing:

```python
# In auth/models.py
class AuthClaims(BaseModel):
    # ... existing fields
    custom_field: Optional[str] = None

# In auth/jwt.py  
def sign_access_jwt(*, custom_field: Optional[str] = None, **kwargs):
    payload = {
        # ... existing payload
        "custom_field": custom_field,
    }
```

### Custom Guards
Create domain-specific authorization:

```python
def require_project_access(project_id_param: str = "project_id"):
    def _dep(claims: AuthClaims = Depends(auth_required), request: Request):
        project_id = request.path_params.get(project_id_param)
        # Custom logic to check project access
        if not user_has_project_access(claims.sub, project_id):
            raise HTTPException(403, "Project access denied")
        return claims
    return _dep
```

## Integration with OAuth

This system focuses on JWT validation and authorization. For OAuth integration:

1. Implement OAuth flow in `routes/auth.py`
2. Exchange OAuth tokens for app JWTs using `sign_access_jwt()`
3. Store refresh tokens in database
4. Use this system for API authorization

See the main architecture document for complete OAuth implementation details.

## Best Practices

1. **Keep tokens short-lived** (15 minutes max)
2. **Use HTTPS in production** for token transmission
3. **Store JWT secrets securely** (environment variables, secret managers)
4. **Validate all claims** (audience, issuer, expiration)
5. **Use specific error messages** for debugging
6. **Combine guards thoughtfully** (role + plan requirements)
7. **Test authorization paths** with different user types
8. **Monitor token usage** for security patterns

## Troubleshooting

### Common Issues

**"Missing bearer token"**
- Check `Authorization: Bearer <token>` header format
- Ensure token is not empty or malformed

**"Token expired"**
- Generate new token with longer TTL for testing
- Check system clock synchronization

**"Insufficient role"**  
- Verify user has required roles in JWT claims
- Check role name spelling (case-insensitive)

**"Upgrade required"**
- Verify user plan in JWT claims
- Check plan name spelling (case-insensitive)

### Debug Mode

```python
# Add to route for debugging
@router.get("/debug/claims")
def debug_claims(claims: AuthClaims = Depends(auth_required)):
    return {
        "sub": claims.sub,
        "roles": claims.roles, 
        "plan": claims.plan,
        "features": claims.features,
        "orgId": claims.orgId,
    }
```