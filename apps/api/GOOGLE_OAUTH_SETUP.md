# Google OAuth Configuration Guide - Secure Popup Flow

This guide shows you how to set up **secure Google OAuth authentication** using:
- ✅ **Google Identity Services (GIS)** Authorization Code model
- ✅ **Popup UX** (`ux_mode: 'popup'`) - no full-page redirects
- ✅ **Server-side token exchange** - tokens never exposed to frontend
- ✅ **ID token verification** - validates `iss`, `aud`, `exp`, `iat`, `hd` claims
- ✅ **CSRF protection** - custom headers + origin verification
- ✅ **Refresh token rotation** - encrypted server-side storage
- ✅ **Secure cookies** - HttpOnly, Secure, SameSite=Lax, __Host- prefix in production

## Architecture Overview

### Flow

1. **Frontend**: User clicks "Sign in with Google"
2. **Frontend**: `GoogleOAuthPopup` component loads GIS script and opens popup
3. **Popup**: Google authentication (user signs in with Google)
4. **Google**: Returns authorization code to popup
5. **Frontend**: Popup receives code, sends to backend via POST `/auth/google/exchange`
6. **Backend**: Exchanges code for tokens at `https://oauth2.googleapis.com/token`
7. **Backend**: Verifies ID token signature and claims
8. **Backend**: Encrypts and stores refresh token (for future token rotation)
9. **Backend**: Creates app session JWT, sets HttpOnly cookie
10. **Frontend**: Receives user info, popup closes, user is authenticated

### Security Features

- **No token exposure**: Google tokens never sent to frontend
- **CSRF protection**: Custom `X-Requested-With` header required
- **Origin verification**: Origin/Referer headers checked against whitelist
- **ID token verification**: Validates signature using Google's public keys
- **Encrypted refresh tokens**: Fernet encryption for server-side storage
- **Secure cookies**: HttpOnly prevents XSS, Secure enforces HTTPS, SameSite prevents CSRF
- **CSP headers**: Content Security Policy restricts resource loading
- **Token revocation**: Logout revokes Google refresh token

## Quick Setup (Development)

### 1. Get Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Google+ API** (or People API)
4. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
5. Configure the OAuth consent screen:
   - User type: External (for testing)
   - App name: `Webapp Factory Dev`
   - Add your email as a test user
6. Create OAuth Client ID:
   - Application type: **Web application**
   - Name: `Webapp Factory Dev`
   - **Authorized JavaScript origins**: 
     - `http://127.0.0.1:5173`
     - `http://localhost:3000`
   - **Authorized redirect URIs**:
     - `http://127.0.0.1:5173` (must match origin for popup mode)
     - `http://localhost:3000`

7. Copy the **Client ID** and **Client Secret**

**Important**: For popup mode, the redirect URI **must be the page origin** (e.g., `http://127.0.0.1:5173`), not a callback path.

### 2. Set Environment Variables

Create or update `apps/api/.env.development`:

```bash
# Google OAuth Configuration
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret

# CORS Origins (allow frontend to call backend)
APP_CORS_ORIGINS=http://127.0.0.1:5173,http://localhost:3000

# JWT Configuration
APP_JWT_SECRET=dev-secret-change-in-production
APP_JWT_AUDIENCE=webapp-factory
APP_JWT_ISSUER=https://api.dev.com
APP_JWT_ACCESS_TOKEN_EXPIRE_MINUTES=60

# Refresh Token Encryption (REQUIRED in production)
# Generate with: python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
# APP_REFRESH_TOKEN_KEY=your-generated-key-here

# Optional: Restrict to Google Workspace domain
# APP_GOOGLE_WORKSPACE_DOMAIN=example.com
```

### 3. Update Configuration File

Create or update `apps/api/config.development.json`:

```json
{
  "auth": {
    "jwt": {
      "secret_key": "dev-secret-key-not-for-production-use-only",
      "algorithm": "HS256",
      "access_token_expire_minutes": 60,
      "audience": "webapp-factory-dev",
      "issuer": "webapp-factory-dev"
    },
    "oauth": {
      "google": {
        "client_id": "${GOOGLE_CLIENT_ID}",
        "client_secret": "${GOOGLE_CLIENT_SECRET}"
      }
    },
    "cors_origins": [
      "http://localhost:3000",
      "http://127.0.0.1:5173"
    ],
    "cookies": {
      "domain": "localhost",
      "secure": false,
      "httponly": true,
      "samesite": "lax"
    }
  }
}
```

### 4. Install Python Dependencies

```bash
cd apps/api
pip install cryptography pyjwt httpx
```

### 5. Restart the API Server

```bash
# If running via VS Code debugger, just restart the debug session
# Or from terminal:
cd apps/api
uvicorn main:app --reload --port 8000
```

## Frontend Usage

### Basic Example

```tsx
import { GoogleOAuthPopup } from '@/components/factory/auth/GoogleOAuthPopup'

function LoginPage() {
  const handleSuccess = (user) => {
    console.log('Logged in:', user)
    // User is authenticated, session cookie is set
    // Redirect to dashboard or refresh app state
  }

  const handleError = (error) => {
    console.error('Login failed:', error)
    // Show error message to user
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

### With AuthProvider

```tsx
import { useAuth } from '@/providers/AuthProvider'
import { GoogleOAuthPopup } from '@/components/factory/auth/GoogleOAuthPopup'

function Header() {
  const { user, logout } = useAuth()

  if (user) {
    return (
      <div>
        <img src={user.picture} alt={user.name} />
        <span>{user.name}</span>
        <button onClick={logout}>Logout</button>
      </div>
    )
  }

  return (
    <GoogleOAuthPopup 
      apiBaseUrl="/api"
      onSuccess={(user) => {
        // AuthProvider will auto-refresh user state
        console.log('Welcome', user.name)
      }}
    >
      <button className="btn-primary">
        Sign in with Google
      </button>
    </GoogleOAuthPopup>
  )
}
```

### Custom Styling

```tsx
<GoogleOAuthPopup 
  onSuccess={handleSuccess}
  className="w-full bg-white hover:bg-gray-50 text-gray-900"
>
  <div className="flex items-center gap-2">
    <GoogleIcon />
    <span>Continue with Google</span>
  </div>
</GoogleOAuthPopup>
```

### Restrict to Google Workspace Domain

```tsx
// Only allow users from @example.com emails
<GoogleOAuthPopup 
  hostedDomain="example.com"
  onSuccess={handleSuccess}
  onError={handleError}
>
  <button>Sign in with Work Account</button>
</GoogleOAuthPopup>
```

## Testing the Flow

1. **Start both servers**:
   ```bash
   # Terminal 1 - Frontend
   pnpm run dev:web
   
   # Terminal 2 - Backend
   cd apps/api
   uvicorn main:app --reload --port 8000
   ```

2. **Open the app**: `http://127.0.0.1:5173`

3. **Click the login button**

4. **Expected flow**:
   - ✅ Popup window opens with Google sign-in
   - ✅ You sign in with your Google account
   - ✅ Popup closes automatically
   - ✅ Your avatar/name appears (user authenticated)
   - ✅ Session cookie is set (HttpOnly, cannot see in JavaScript)

5. **Verify security**:
   - Open DevTools → Network → look for `/auth/google/exchange` request
   - Check request headers: `X-Requested-With: XMLHttpRequest`
   - Check response: No tokens in body (only user info)
   - Check cookies: `session` cookie with HttpOnly flag

## Production Configuration

### Environment Variables

```bash
# Google OAuth
GOOGLE_CLIENT_ID=your-prod-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-prod-client-secret

# CORS (only your production domains)
APP_CORS_ORIGINS=https://app.example.com,https://www.example.com

# JWT (use strong secret!)
APP_JWT_SECRET=<generate-strong-random-secret>
APP_JWT_AUDIENCE=webapp-factory-prod
APP_JWT_ISSUER=https://api.example.com

# Refresh Token Encryption (REQUIRED!)
APP_REFRESH_TOKEN_KEY=<generate-with-fernet>

# Optional: Workspace domain restriction
# APP_GOOGLE_WORKSPACE_DOMAIN=example.com

# Environment
APP_ENV=production
```

### Google Cloud Console (Production)

1. Update OAuth Client:
   - **Authorized JavaScript origins**: 
     - `https://app.example.com`
   - **Authorized redirect URIs**:
     - `https://app.example.com`

2. Move to production consent screen (if needed)

### Security Checklist

- [ ] Strong `APP_JWT_SECRET` set (not dev default)
- [ ] `APP_REFRESH_TOKEN_KEY` configured (for encryption)
- [ ] `APP_CORS_ORIGINS` limited to production domains only
- [ ] `APP_ENV=production` set
- [ ] HTTPS enabled (required for Secure cookies)
- [ ] Google OAuth credentials from production project
- [ ] Content Security Policy headers configured
- [ ] Refresh tokens stored in secure database (not in JWT)
- [ ] Database encryption at rest enabled
- [ ] Rate limiting configured
- [ ] Monitoring and alerts set up

## API Endpoints

### `GET /auth/google/config`
Get OAuth configuration for GIS client

**Response:**
```json
{
  "client_id": "your-client-id.apps.googleusercontent.com",
  "scope": "openid email profile",
  "ux_mode": "popup"
}
```

### `POST /auth/google/exchange`
Exchange authorization code for session

**Headers:**
- `X-Requested-With: XMLHttpRequest` (required)
- `Origin: http://127.0.0.1:5173` (required)

**Body:**
```json
{
  "code": "authorization_code_from_google",
  "state": "csrf_token",
  "redirect_uri": "http://127.0.0.1:5173"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "google-user-id",
    "email": "user@example.com",
    "name": "User Name",
    "picture": "https://..."
  }
}
```

**Sets cookie:** `session` (HttpOnly, Secure in prod, SameSite=Lax)

### `POST /auth/google/revoke`
Revoke Google token and logout

**Headers:**
- `X-Requested-With: XMLHttpRequest` (required)

**Response:**
```json
{
  "success": true
}
```

**Clears cookie:** `session`

### `GET /auth/me`
Get current authenticated user

**Response:**
```json
{
  "id": "user-id",
  "email": "user@example.com",
  "name": "User Name",
  "picture": "https://...",
  "roles": ["user"],
  "plan": "free"
}
```

## Troubleshooting

### "Origin not allowed" error
- Check `APP_CORS_ORIGINS` matches your frontend URL exactly
- Ensure no trailing slashes in origins
- Check browser DevTools → Network → Request headers → Origin

### "Missing required security header" error
- Ensure `X-Requested-With: XMLHttpRequest` header is sent
- Check if browser extension is blocking headers

### "Failed to exchange authorization code" error
- Verify `redirect_uri` matches what's registered in Google Cloud Console
- For popup mode, it must be the page **origin** (e.g., `http://127.0.0.1:5173`), not a path
- Check Google Cloud Console → Credentials → Authorized redirect URIs

### "Invalid ID token" error
- Check system clock is correct (affects token expiration)
- Verify `GOOGLE_CLIENT_ID` matches the one used in frontend
- Check if Google keys are being fetched (network issues)

### Session cookie not set
- Check if backend returns `Set-Cookie` header
- Verify `credentials: 'include'` in frontend fetch requests
- In production, ensure `Secure` flag requires HTTPS
- Check for SameSite restrictions (cross-domain cookies)

### Popup blocked
- Ensure click event directly triggers `requestCode()`
- Don't use async operations before opening popup
- Check browser popup blocker settings

## Advanced Topics

### Refresh Token Rotation

Refresh tokens are encrypted server-side using Fernet encryption. In production, store them in a secure database:

```python
# Example: Store refresh token
await db.users.update_one(
    {"id": user_id},
    {"$set": {"refresh_token": encrypted_refresh_token}}
)

# Example: Retrieve and refresh
user_data = await db.users.find_one({"id": user_id})
new_tokens = await google_oauth.refresh_access_token(
    user_data["refresh_token"]
)
```

### Workspace Domain Restriction

Restrict login to specific Google Workspace domain:

```bash
# Backend
APP_GOOGLE_WORKSPACE_DOMAIN=example.com
```

This validates the `hd` (hosted domain) claim in the ID token.

### Custom Session Duration

```bash
APP_JWT_ACCESS_TOKEN_EXPIRE_MINUTES=120  # 2 hours
```

Update cookie max_age in `google_auth.py`:

```python
config.update({
    "max_age": 60 * 60 * 2,  # 2 hours
})
```

### Multiple OAuth Providers

The architecture supports multiple providers. Add similar services for GitHub, Microsoft, etc.:

```python
# services/github_oauth_service.py
class GitHubOAuthService:
    # Similar structure to GoogleOAuthService
    ...
```

## Security Best Practices

1. **Never expose tokens to frontend**: Use HttpOnly cookies only
2. **Always verify ID tokens**: Don't trust client-provided user info
3. **Use HTTPS in production**: Required for Secure cookies
4. **Restrict CORS origins**: Only allow known domains
5. **Enable CSRF protection**: Require custom headers
6. **Rotate refresh tokens**: Implement refresh token rotation
7. **Encrypt sensitive data**: Use Fernet or similar for refresh tokens
8. **Monitor auth events**: Log all authentication attempts
9. **Implement rate limiting**: Prevent brute force attacks
10. **Regular security audits**: Review OAuth configuration periodically

## References

- [Google Identity Services](https://developers.google.com/identity/gsi/web/guides/overview)
- [OAuth 2.0 Authorization Code Flow](https://developers.google.com/identity/protocols/oauth2/web-server)
- [ID Token Verification](https://developers.google.com/identity/gsi/web/guides/verify-google-id-token)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)


## Troubleshooting

### "redirect_uri_mismatch" error

**Problem**: Google shows an error about redirect URI mismatch.

**Solution**: Make sure the redirect URI in Google Cloud Console **exactly matches** the one in your config:
- Use: `http://localhost:8000/auth/google/callback` (backend URL)
- NOT: `http://127.0.0.1:5173/auth/callback` (frontend URL)

### "Google OAuth is not configured" error

**Problem**: Backend returns 500 error saying OAuth is not configured.

**Solution**: Check that environment variables are set:
```bash
echo $GOOGLE_CLIENT_ID
echo $GOOGLE_CLIENT_SECRET
```

If empty, source your .env file or restart the server.

### Cookie not being set

**Problem**: After login, user info doesn't persist.

**Solutions**:
1. Check browser console for cookie warnings
2. Make sure `samesite=lax` is set (it is by default)
3. For Chrome, check Settings → Privacy → Cookies → Allow all cookies (for development)

### CORS errors

**Problem**: Frontend can't call backend API.

**Solution**: Add your frontend URL to `APP_CORS_ORIGINS`:
```bash
APP_CORS_ORIGINS=http://127.0.0.1:5173,http://localhost:3000
```

## Production Setup

### 1. Update Redirect URIs

In Google Cloud Console, add your production redirect URI:
```
https://api.yourapp.com/auth/google/callback
```

### 2. Update Environment Variables

```bash
# Production .env
GOOGLE_CLIENT_ID=your-prod-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-prod-client-secret
APP_OAUTH_REDIRECT_URI=https://api.yourapp.com/auth/google/callback
APP_CORS_ORIGINS=https://yourapp.com

# Use secure cookies in production
APP_COOKIE_SECURE=true
```

### 3. Update Cookie Settings

In `apps/api/routes/auth.py`, change the cookie settings:

```python
response.set_cookie(
    key="session",
    value=session.token,
    httponly=True,
    samesite="lax",
    secure=True,  # ← Change to True for HTTPS
    max_age=60 * 60 * 24 * 7,  # 7 days
)
```

### 4. OAuth Consent Screen

Before going live:
1. Complete the OAuth consent screen in Google Cloud Console
2. Add privacy policy and terms of service URLs
3. Submit for verification if needed
4. Add all necessary scopes

## Architecture

### OAuth Flow Diagram

```
User Browser          Frontend              Backend              Google
     │                   │                     │                    │
     │──── Click Login ──│                     │                    │
     │                   │                     │                    │
     │                   │─ GET /auth/google/login ─────────────────│
     │                   │                     │                    │
     │                   │◄── 302 Redirect ───│                    │
     │                   │                     │                    │
     │──────────────────────── Redirect to Google ─────────────────▶│
     │                   │                     │                    │
     │◄──────────────── Google Login Page ────────────────────────┤
     │                   │                     │                    │
     │─────────────────── User Authorizes ────────────────────────▶│
     │                   │                     │                    │
     │◄───────────── Redirect with code ──────────────────────────┤
     │                   │                     │                    │
     │─────── GET /auth/google/callback?code=xxx&state=yyy ────────▶│
     │                   │                     │                    │
     │                   │                     │─ Exchange code ───▶│
     │                   │                     │                    │
     │                   │                     │◄─ Access token ───┤
     │                   │                     │                    │
     │                   │                     │─ Get user info ───▶│
     │                   │                     │                    │
     │                   │                     │◄─ User data ──────┤
     │                   │                     │                    │
     │                   │◄─ 302 + Set-Cookie │                    │
     │                   │     (session JWT)   │                    │
     │                   │                     │                    │
     │◄─ Redirect to frontend with cookie ────│                    │
     │                   │                     │                    │
     │──── GET / ────────▶│                    │                    │
     │     (with cookie)  │                    │                    │
     │                   │                     │                    │
     │                   │─── GET /auth/me ───▶│                    │
     │                   │    (with cookie)    │                    │
     │                   │                     │                    │
     │                   │◄─── User data ─────┤                    │
     │                   │                     │                    │
     │◄─ Show avatar ────│                     │                    │
```

## Configuration Options

### Available Scopes

```python
# Minimal (email only)
scopes: ["openid", "email"]

# Default (email + profile)
scopes: ["openid", "email", "profile"]

# Extended (add calendar, drive, etc.)
scopes: ["openid", "email", "profile", "https://www.googleapis.com/auth/calendar.readonly"]
```

### Cookie Settings

```python
response.set_cookie(
    key="session",           # Cookie name
    value=session.token,     # JWT token
    httponly=True,           # Prevent JavaScript access (security)
    samesite="lax",          # CSRF protection
    secure=True,             # HTTPS only (production)
    max_age=60*60*24*7,      # Expiry in seconds (7 days)
    domain=".yourapp.com",   # Cookie domain (for subdomain sharing)
)
```

### JWT Claims

The JWT token includes:

```json
{
  "sub": "google-user-id",
  "email": "user@example.com",
  "name": "John Doe",
  "picture": "https://...",
  "roles": ["user"],
  "plan": "free",
  "iat": 1640995200,
  "exp": 1640998800
}
```

## Security Best Practices

1. **Always validate state parameter** (prevents CSRF)
2. **Use HTTPS in production** (secure cookies)
3. **Store client_secret securely** (environment variables, never in code)
4. **Set short JWT expiration** (15-60 minutes recommended)
5. **Implement refresh tokens** for long-lived sessions
6. **Validate JWT signature** on every request
7. **Rate limit auth endpoints** (prevent brute force)

## Next Steps

1. ✅ Google OAuth is now working
2. 🔄 Add user creation in database (Firestore)
3. 🔄 Implement role management
4. 🔄 Add refresh token flow
5. 🔄 Add account linking (multiple OAuth providers)
6. 🔄 Add email verification
7. 🔄 Add password auth as fallback

## Support

- **Google OAuth Docs**: https://developers.google.com/identity/protocols/oauth2
- **FastAPI OAuth**: https://fastapi.tiangolo.com/advanced/security/
- **Backend Auth README**: `apps/api/auth/README.md`
- **Frontend Auth README**: `apps/web/src/app/components/factory/navigation/README.md`
