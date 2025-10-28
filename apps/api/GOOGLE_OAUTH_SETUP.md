# Google OAuth Configuration Guide

This guide shows you how to set up Google OAuth authentication for the Webapp Factory.

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
   - Authorized redirect URIs:
     - `http://localhost:5173/auth/callback` (frontend callback)
     - `http://localhost:8000/auth/google/callback` (backend callback - **USE THIS ONE**)

7. Copy the **Client ID** and **Client Secret**

### 2. Set Environment Variables

Create or update `apps/api/.env.development`:

```bash
# Google OAuth Configuration
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret

# OAuth Redirect URI (where Google sends the user after auth)
APP_OAUTH_REDIRECT_URI=http://localhost:8000/auth/google/callback

# CORS Origins (allow frontend to call backend)
APP_CORS_ORIGINS=http://localhost:5173,http://localhost:3000

# JWT Configuration
APP_JWT_SECRET=dev-secret-change-in-production
APP_JWT_AUDIENCE=webapp-factory
APP_JWT_ISSUER=https://api.dev.com
APP_JWT_ACCESS_TOKEN_EXPIRE_MINUTES=60
```

### 3. Update Configuration File

Create or update `apps/api/config.development.json`:

```json
{
  "auth": {
    "google_oauth": {
      "client_id": "${GOOGLE_CLIENT_ID}",
      "client_secret": "${GOOGLE_CLIENT_SECRET}",
      "scopes": ["openid", "email", "profile"]
    },
    "oauth_redirect_uri": "http://localhost:8000/auth/google/callback",
    "cors_origins": [
      "http://localhost:5173",
      "http://localhost:3000"
    ]
  }
}
```

### 4. Restart the API Server

```bash
# If running via VS Code debugger, just restart the debug session
# Or from terminal:
cd apps/api
uvicorn main:app --reload --port 8000
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

2. **Open the app**: `http://localhost:5173`

3. **Click the login button** (top-right corner)

4. **Expected flow**:
   - ✅ Redirects to Google login page
   - ✅ You log in with your Google account
   - ✅ Google redirects back to `http://localhost:8000/auth/google/callback`
   - ✅ Backend sets a session cookie
   - ✅ Backend redirects to `http://localhost:5173`
   - ✅ Frontend loads, sees the cookie, shows your avatar/name

## Troubleshooting

### "redirect_uri_mismatch" error

**Problem**: Google shows an error about redirect URI mismatch.

**Solution**: Make sure the redirect URI in Google Cloud Console **exactly matches** the one in your config:
- Use: `http://localhost:8000/auth/google/callback` (backend URL)
- NOT: `http://localhost:5173/auth/callback` (frontend URL)

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
APP_CORS_ORIGINS=http://localhost:5173,http://localhost:3000
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
