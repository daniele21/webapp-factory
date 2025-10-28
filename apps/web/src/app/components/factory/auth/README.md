# Google OAuth Authentication Components

Secure Google OAuth authentication using **Google Identity Services (GIS)** with the **Authorization Code flow** in **popup mode**.

## Features

✅ **Popup UX** - No full-page redirects, better user experience  
✅ **Server-side security** - Tokens never exposed to frontend  
✅ **ID token verification** - Validates signature and claims  
✅ **CSRF protection** - Custom headers and origin verification  
✅ **Refresh token rotation** - Encrypted server-side storage  
✅ **Secure cookies** - HttpOnly, Secure, SameSite=Lax  
✅ **Workspace restriction** - Optional domain-based access control  
✅ **TypeScript** - Full type safety  

## Quick Start

### 1. Backend Setup

See [GOOGLE_OAUTH_SETUP.md](../../../../api/GOOGLE_OAUTH_SETUP.md) for detailed backend configuration.

Quick checklist:
- [ ] Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in environment
- [ ] Configure `APP_CORS_ORIGINS` with your frontend URL
- [ ] Set `APP_JWT_SECRET` for session tokens
- [ ] (Production) Set `APP_REFRESH_TOKEN_KEY` for encryption
- [ ] Add routes from `google_auth.py` to your FastAPI app

### 2. Frontend Setup

```tsx
import { GoogleOAuthPopup } from '@/components/factory/auth'

function LoginPage() {
  const handleSuccess = (user) => {
    console.log('Logged in:', user)
    // User is authenticated, session cookie is set
  }

  const handleError = (error) => {
    console.error('Login failed:', error)
  }

  return (
    <GoogleOAuthPopup 
      onSuccess={handleSuccess}
      onError={handleError}
    >
      <button>Sign in with Google</button>
    </GoogleOAuthPopup>
  )
}
```

## Components

### GoogleOAuthPopup

Main component for Google OAuth popup flow.

**Props:**

```typescript
interface GoogleOAuthPopupProps {
  // Callback when authentication succeeds
  onSuccess?: (user: GoogleUser) => void
  
  // Callback when authentication fails
  onError?: (error: Error) => void
  
  // API base URL (default: '/api')
  apiBaseUrl?: string
  
  // Custom button component
  children?: React.ReactNode
  
  // CSS classes for default button
  className?: string
  
  // Disabled state
  disabled?: boolean
  
  // Google Workspace domain restriction (optional)
  hostedDomain?: string
}

interface GoogleUser {
  id: string
  email: string
  name?: string
  picture?: string
}
```

**Usage:**

```tsx
// Basic
<GoogleOAuthPopup onSuccess={handleSuccess}>
  <button>Sign in</button>
</GoogleOAuthPopup>

// With custom styling
<GoogleOAuthPopup onSuccess={handleSuccess}>
  <Button variant="outline" className="w-full">
    <GoogleIcon /> Continue with Google
  </Button>
</GoogleOAuthPopup>

// Workspace restriction
<GoogleOAuthPopup 
  hostedDomain="company.com"
  onSuccess={handleSuccess}
>
  <button>Sign in with Work Account</button>
</GoogleOAuthPopup>

// Custom API URL
<GoogleOAuthPopup 
  apiBaseUrl="https://api.example.com/v1"
  onSuccess={handleSuccess}
>
  <button>Sign in</button>
</GoogleOAuthPopup>
```

## Examples

See [GoogleOAuthPopup.examples.tsx](./GoogleOAuthPopup.examples.tsx) for complete examples:

- **Basic Usage** - Minimal setup
- **Styled Example** - Custom Tailwind styling
- **Loading State** - Show loading indicator
- **Workspace Restriction** - Domain-based access
- **Full Auth Flow** - Complete with logout
- **AuthProvider Integration** - Global state management

## Configuration

### GoogleOAuthConfig

Customize OAuth behavior:

```typescript
import { createGoogleOAuthConfig } from '@/components/factory/auth'

const config = createGoogleOAuthConfig({
  apiBaseUrl: '/api',
  hostedDomain: 'company.com',
  debug: true,
  scopes: ['openid', 'email', 'profile'],
})
```

## Security

### What Makes This Secure?

1. **No Token Exposure**: Google tokens never sent to frontend
   - Only app session tokens in HttpOnly cookies
   - Prevents XSS token theft

2. **ID Token Verification**: Backend validates:
   - Signature using Google's public keys (JWKS)
   - Issuer (`iss`): must be `accounts.google.com`
   - Audience (`aud`): must match your client_id
   - Expiration (`exp`): token not expired
   - Issued at (`iat`): token not from future
   - Hosted domain (`hd`): optional workspace restriction

3. **CSRF Protection**:
   - Custom header: `X-Requested-With: XMLHttpRequest`
   - Origin/Referer verification
   - State parameter for additional CSRF protection

4. **Secure Cookies**:
   - `HttpOnly`: JavaScript cannot access
   - `Secure`: HTTPS only (production)
   - `SameSite=Lax`: CSRF protection
   - `__Host-` prefix: Additional security in production

5. **Refresh Token Rotation**:
   - Encrypted with Fernet
   - Stored server-side (not in cookies)
   - Rotated on each use

6. **Content Security Policy**:
   - Restricts resource loading
   - Allows only Google domains for OAuth

### Security Checklist

**Development:**
- [x] CORS limited to localhost origins
- [x] Session cookies with HttpOnly
- [x] Custom CSRF header required
- [x] ID token signature verification

**Production:**
- [ ] Strong `APP_JWT_SECRET` (not default)
- [ ] `APP_REFRESH_TOKEN_KEY` configured
- [ ] CORS limited to production domains only
- [ ] HTTPS enabled (required for Secure cookies)
- [ ] `__Host-` cookie prefix
- [ ] Refresh tokens in secure database
- [ ] Rate limiting enabled
- [ ] Monitoring and alerts

## API Reference

### Backend Endpoints

**`GET /auth/google/config`**
- Returns GIS client configuration
- No authentication required

**`POST /auth/google/exchange`**
- Exchanges authorization code for session
- Requires `X-Requested-With` header
- Sets HttpOnly session cookie
- Returns user info (not tokens)

**`POST /auth/google/revoke`**
- Revokes Google refresh token
- Clears session cookie
- Requires `X-Requested-With` header

**`GET /auth/me`**
- Returns current authenticated user
- Requires session cookie

## Troubleshooting

### Popup Blocked
- Ensure popup triggered directly from user click
- Don't use async operations before opening popup
- Check browser popup blocker settings

### "Origin not allowed"
- Verify `APP_CORS_ORIGINS` matches frontend URL exactly
- No trailing slashes in origins
- Check browser DevTools → Network → Origin header

### "Failed to exchange code"
- Redirect URI must be page origin (e.g., `http://127.0.0.1:5173`)
- Not a callback path like `/callback`
- Check Google Cloud Console → Authorized redirect URIs

### Session cookie not set
- Ensure `credentials: 'include'` in fetch requests
- Production requires HTTPS for Secure cookies
- Check SameSite restrictions for cross-domain

## Migration from Old Flow

If you're currently using the redirect-based flow:

### Before (Redirect Flow)
```tsx
const login = () => {
  window.location.href = '/api/auth/google/login'
}
```

### After (Popup Flow)
```tsx
<GoogleOAuthPopup onSuccess={(user) => {
  console.log('Logged in:', user)
}}>
  <button>Sign in with Google</button>
</GoogleOAuthPopup>
```

**Benefits:**
- No page reload
- Better UX
- More secure (no token exposure)
- Easier to integrate with React state

## Advanced Topics

### Custom Session Duration

```bash
# Backend .env
APP_JWT_ACCESS_TOKEN_EXPIRE_MINUTES=120
```

### Multiple OAuth Providers

This architecture supports multiple providers. See `google_oauth_service.py` as a template.

### Refresh Token Storage

In production, store refresh tokens in a database:

```python
# Example with MongoDB
await db.users.update_one(
  {"id": user_id},
  {"$set": {"refresh_token": encrypted_refresh_token}}
)
```

## References

- [Google Identity Services Documentation](https://developers.google.com/identity/gsi/web)
- [OAuth 2.0 Authorization Code Flow](https://developers.google.com/identity/protocols/oauth2/web-server)
- [ID Token Verification](https://developers.google.com/identity/gsi/web/guides/verify-google-id-token)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)

## License

Part of Webapp Factory - see repository LICENSE
