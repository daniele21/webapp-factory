# Multi-Provider OAuth Setup Guide

## Overview

The Webapp Factory supports **multiple OAuth providers** out of the box:
- ✅ **Google** - `google`
- ✅ **GitHub** - `github`
- ✅ **Slack** - `slack`

You can use any combination of providers, and users can choose which one to use for authentication.

## Supported Providers

### Google OAuth

**Scopes**: `openid`, `email`, `profile`

**Setup**:
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create OAuth 2.0 credentials
3. Set redirect URI: `http://localhost:8000/auth/google/callback`
4. Set environment variables:
   ```bash
   GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=your-client-secret
   ```

### GitHub OAuth

**Scopes**: `user:email`, `read:user`

**Setup**:
1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Create a new OAuth App
3. Set redirect URI: `http://localhost:8000/auth/github/callback`
4. Set environment variables:
   ```bash
   GITHUB_CLIENT_ID=your-client-id
   GITHUB_CLIENT_SECRET=your-client-secret
   ```

### Slack OAuth

**Scopes**: `identity.basic`, `identity.email`

**Setup**:
1. Go to [Slack API](https://api.slack.com/apps)
2. Create a new app
3. Enable Sign in with Slack
4. Set redirect URI: `http://localhost:8000/auth/slack/callback`
5. Set environment variables:
   ```bash
   SLACK_CLIENT_ID=your-client-id
   SLACK_CLIENT_SECRET=your-client-secret
   ```

## Quick Start

### 1. Configure Environment Variables

Create `apps/api/.env.development`:

```bash
# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret

# GitHub OAuth (optional)
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# Slack OAuth (optional)
SLACK_CLIENT_ID=your-slack-client-id
SLACK_CLIENT_SECRET=your-slack-client-secret

# General OAuth settings
APP_OAUTH_REDIRECT_URI=http://localhost:8000/auth/{provider}/callback
APP_JWT_SECRET=dev-secret-key
```

### 2. Use in Frontend

The frontend automatically supports multiple providers:

```tsx
import { useAuth } from './providers/AuthProvider'

function LoginPage() {
  const { login } = useAuth()

  return (
    <div>
      <button onClick={() => login('google')}>Sign in with Google</button>
      <button onClick={() => login('github')}>Sign in with GitHub</button>
      <button onClick={() => login('slack')}>Sign in with Slack</button>
    </div>
  )
}
```

Or use the AuthMenu component:

```tsx
import { AuthMenuConnected } from './components/AuthMenuConnected'

// Use default provider (Google)
<AuthMenuConnected />

// Or specify a provider
<AuthMenuConnected loginProvider="github" />
```

## API Endpoints

### Generalized Endpoints

All OAuth providers use the same endpoint pattern:

#### `GET /auth/{provider}/login`
Initiate OAuth flow for the specified provider.

**Parameters**:
- `provider` (path): `google`, `github`, or `slack`
- `redirect` (query): Frontend URL to return to after auth

**Response**: Redirects to provider's OAuth page

**Example**:
```
GET /auth/google/login?redirect=http://127.0.0.1:5173
GET /auth/github/login?redirect=http://127.0.0.1:5173
```

#### `GET /auth/{provider}/callback`
Handle OAuth callback from provider.

**Parameters**:
- `provider` (path): `google`, `github`, or `slack`
- `code` (query): Authorization code from provider
- `state` (query): CSRF protection token

**Response**: Sets session cookie and redirects to frontend

#### `GET /auth/providers`
List all supported OAuth providers.

**Response**:
```json
{
  "providers": ["google", "github", "slack"],
  "details": {
    "google": {
      "name": "Google",
      "scopes": ["openid", "email", "profile"]
    },
    "github": {
      "name": "GitHub",
      "scopes": ["user:email", "read:user"]
    },
    "slack": {
      "name": "Slack",
      "scopes": ["identity.basic", "identity.email"]
    }
  }
}
```

## Adding a New Provider

To add support for a new OAuth provider (e.g., Microsoft, LinkedIn):

### 1. Add Provider Configuration

Edit `apps/api/services/auth_service.py`:

```python
OAUTH_PROVIDERS: Dict[str, OAuthProvider] = {
    # ... existing providers ...
    
    "microsoft": OAuthProvider(
        name="Microsoft",
        authorization_url="https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
        token_url="https://login.microsoftonline.com/common/oauth2/v2.0/token",
        user_info_url="https://graph.microsoft.com/v1.0/me",
        scopes=["openid", "profile", "email"],
        client_id_env="MICROSOFT_CLIENT_ID",
        client_secret_env="MICROSOFT_CLIENT_SECRET",
    ),
}
```

### 2. Add User Info Normalization

Add a case to `_normalize_user_info()`:

```python
def _normalize_user_info(provider_name: str, user_info: Dict[str, Any]) -> Dict[str, Any]:
    # ... existing providers ...
    
    elif provider_name == "microsoft":
        return {
            "id": user_info.get("id"),
            "email": user_info.get("mail") or user_info.get("userPrincipalName"),
            "name": user_info.get("displayName"),
            "picture": None,  # Microsoft Graph requires separate call
        }
```

### 3. Set Environment Variables

```bash
MICROSOFT_CLIENT_ID=your-microsoft-client-id
MICROSOFT_CLIENT_SECRET=your-microsoft-client-secret
```

### 4. Use in Frontend

```tsx
<button onClick={() => login('microsoft')}>Sign in with Microsoft</button>
```

That's it! The system will automatically handle the new provider.

## Multi-Provider Login UI

Create a login page with multiple options:

```tsx
import { useAuth } from './providers/AuthProvider'
import { OAuthButton } from './components/design-system'

function LoginPage() {
  const { login, loading } = useAuth()

  return (
    <div className="space-y-4">
      <h1>Sign In</h1>
      
      <OAuthButton
        provider="google"
        loading={loading}
        onClick={() => login('google')}
      />
      
      <OAuthButton
        provider="github"
        loading={loading}
        onClick={() => login('github')}
      />
      
      <OAuthButton
        provider="slack"
        loading={loading}
        onClick={() => login('slack')}
      />
    </div>
  )
}
```

## User Object

After authentication, the user object includes the provider information:

```typescript
{
  id: "user-id",
  email: "user@example.com",
  name: "John Doe",
  picture: "https://...",
  roles: ["user"],
  plan: "free",
  provider: "google"  // ← Which provider they used
}
```

## Account Linking

To allow users to link multiple OAuth providers to the same account:

1. Check if a user with the same email already exists
2. Link the new provider to the existing user record
3. Store provider-specific data (provider name, provider user ID)

Example:

```python
# In exchange_code function
user_email = normalized_user["email"]

# Check if user exists
existing_user = await get_user_by_email(user_email)

if existing_user:
    # Link new provider to existing account
    await link_provider(existing_user.id, provider_name, normalized_user["id"])
else:
    # Create new user
    await create_user(normalized_user, provider_name)
```

## Security Best Practices

1. **Always validate the state parameter** (prevents CSRF attacks)
2. **Use HTTPS in production** (secure cookies)
3. **Store secrets in environment variables** (never in code)
4. **Implement rate limiting** on auth endpoints
5. **Log authentication events** for security auditing
6. **Validate provider in endpoints** (prevent arbitrary providers)

## Troubleshooting

### "Unknown OAuth provider" error

**Problem**: The provider name is not recognized.

**Solution**: Check that you're using one of the supported providers: `google`, `github`, `slack`. Provider names are case-insensitive.

### "OAuth is not configured" error

**Problem**: Environment variables are not set.

**Solution**: Make sure you've set both `{PROVIDER}_CLIENT_ID` and `{PROVIDER}_CLIENT_SECRET`.

### Redirect URI mismatch

**Problem**: The redirect URI in the provider console doesn't match the one in your app.

**Solution**: Use the pattern `http://localhost:8000/auth/{provider}/callback` where `{provider}` is the exact provider name (lowercase).

### Provider-specific issues

**GitHub**: Make sure to add the `User-Agent` header (handled automatically).

**Slack**: Use user-scoped tokens, not bot tokens.

**Google**: Enable the Google+ API or People API in your project.

## Configuration Reference

### Environment Variables

```bash
# Provider credentials (set the ones you want to use)
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
SLACK_CLIENT_ID=...
SLACK_CLIENT_SECRET=...

# OAuth redirect URI pattern
# Use {provider} as placeholder for google, github, slack, etc.
APP_OAUTH_REDIRECT_URI=http://localhost:8000/auth/{provider}/callback

# JWT configuration
APP_JWT_SECRET=your-secret-key
APP_JWT_ACCESS_TOKEN_EXPIRE_MINUTES=60

# Frontend URL (for post-login redirect)
FRONTEND_URL=http://127.0.0.1:5173
```

### Provider Comparison

| Feature | Google | GitHub | Slack |
|---------|--------|--------|-------|
| Email | ✅ | ✅ | ✅ |
| Name | ✅ | ✅ | ✅ |
| Avatar | ✅ | ✅ | ✅ |
| Setup Complexity | Medium | Easy | Medium |
| User Base | Everyone | Developers | Teams |
| Best For | General auth | Dev tools | Team apps |

## Next Steps

1. ✅ Multi-provider OAuth is now working
2. 🔄 Implement account linking (same email = same user)
3. 🔄 Add provider-specific data storage
4. 🔄 Allow users to disconnect providers
5. 🔄 Add email/password auth as fallback
6. 🔄 Implement MFA (multi-factor authentication)

## See Also

- [Google OAuth Documentation](https://developers.google.com/identity/protocols/oauth2)
- [GitHub OAuth Documentation](https://docs.github.com/en/developers/apps/building-oauth-apps)
- [Slack OAuth Documentation](https://api.slack.com/authentication/oauth-v2)
