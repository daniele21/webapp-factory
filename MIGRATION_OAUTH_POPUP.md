# Migration Guide: Redirect Flow → Secure Popup Flow

This guide helps you migrate from the old redirect-based OAuth flow to the new secure Google Identity Services (GIS) popup flow.

## What Changed?

### Old Flow (Redirect-based)
1. User clicks login button
2. Browser redirects to `/api/auth/google/login`
3. Backend redirects to Google OAuth
4. User authenticates with Google
5. Google redirects to `/api/auth/google/callback`
6. Backend sets cookie and redirects to frontend
7. Frontend reloads and checks session

**Issues:**
- Full page reload (poor UX)
- Tokens potentially exposed in URL fragments
- Uses deprecated `gapi.auth2` library
- Callback URL must be registered as redirect URI

### New Flow (Popup-based with GIS)
1. User clicks login button
2. Popup opens with Google authentication
3. User authenticates in popup
4. Popup receives authorization code
5. Frontend sends code to `/api/auth/google/exchange` with CSRF headers
6. Backend validates, exchanges code for tokens, verifies ID token
7. Backend sets secure cookie, returns user info
8. Popup closes, user authenticated

**Benefits:**
- ✅ No page reload (better UX)
- ✅ No token exposure (tokens stay server-side)
- ✅ Uses modern Google Identity Services
- ✅ Better CSRF protection
- ✅ ID token verification
- ✅ Encrypted refresh token storage

## Migration Steps

### 1. Backend Migration

#### Install Dependencies

```bash
cd apps/api
pip install cryptography
```

(Already included in `pyproject.toml`)

#### Add New Routes

The new routes are in `apps/api/routes/google_auth.py`. They're already included in `main.py`:

```python
# main.py
from api.routes import google_auth

app.include_router(google_auth.router, prefix="/auth", tags=["auth", "google"])
```

#### Update Environment Variables

```bash
# .env.development or .env.production

# Required (no changes from before)
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret

# NEW: Encryption key for refresh tokens (production only)
# Generate with: python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
APP_REFRESH_TOKEN_KEY=<your-generated-key>

# CORS origins (should already be set)
APP_CORS_ORIGINS=http://127.0.0.1:5173,http://localhost:3000

# JWT secret (should already be set)
APP_JWT_SECRET=<your-secret>
```

#### Update Google Cloud Console

**Important:** Redirect URIs must change!

**Old (Redirect Flow):**
- Authorized redirect URIs: `http://localhost:8000/auth/google/callback`

**New (Popup Flow):**
- Authorized JavaScript origins: `http://127.0.0.1:5173`
- Authorized redirect URIs: `http://127.0.0.1:5173` (page origin, not callback path)

### 2. Frontend Migration

#### Before (Old Redirect Flow)

```tsx
// AuthProvider.tsx (old)
const login = () => {
  window.location.href = '/api/auth/google/login?redirect=/'
}

// Usage
<button onClick={login}>Sign in with Google</button>
```

#### After (New Popup Flow)

```tsx
// Import new component
import { GoogleOAuthPopup } from '@/components/design-system/auth'

// Usage
<GoogleOAuthPopup 
  onSuccess={(user) => {
    console.log('Logged in:', user)
    // Update app state, redirect, etc.
  }}
  onError={(error) => {
    console.error('Login failed:', error)
  }}
>
  <button>Sign in with Google</button>
</GoogleOAuthPopup>
```

#### Update AuthProvider (Optional)

If you want to keep using the `useAuth()` hook pattern:

```tsx
// AuthProvider.tsx (updated)
import { GoogleOAuthPopup } from '@/components/design-system/auth'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)

  // Keep for backward compatibility if needed
  const login = () => {
    window.location.href = '/api/auth/google/login'
  }

  // New popup-based login
  const loginWithPopup = (onSuccess, onError) => {
    return {
      onSuccess: (user) => {
        setUser(user)
        onSuccess?.(user)
      },
      onError: (error) => {
        console.error('Login failed:', error)
        onError?.(error)
      }
    }
  }

  const logout = async () => {
    await fetch('/api/auth/google/revoke', {
      method: 'POST',
      headers: { 'X-Requested-With': 'XMLHttpRequest' },
      credentials: 'include',
    })
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, loginWithPopup, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

// Usage
function LoginButton() {
  const { loginWithPopup } = useAuth()
  const callbacks = loginWithPopup()

  return (
    <GoogleOAuthPopup {...callbacks}>
      <button>Sign in with Google</button>
    </GoogleOAuthPopup>
  )
}
```

### 3. Update Existing Components

Find all instances of the old login flow and replace them:

```bash
# Search for old login pattern
grep -r "auth/google/login" apps/web/src
grep -r "window.location.href.*google" apps/web/src
```

**Example component update:**

```tsx
// Before
function Header() {
  const { login } = useAuth()
  
  return <button onClick={login}>Sign in</button>
}

// After
import { GoogleOAuthPopup } from '@/components/design-system/auth'

function Header() {
  const handleSuccess = (user) => {
    console.log('Welcome', user.name)
  }
  
  return (
    <GoogleOAuthPopup onSuccess={handleSuccess}>
      <button>Sign in</button>
    </GoogleOAuthPopup>
  )
}
```

### 4. Update Tests

#### Backend Tests

Update tests that mock OAuth flow:

```python
# Old test
def test_oauth_callback(client):
    response = client.get("/auth/google/callback?code=test&state=test")
    assert response.status_code == 200

# New test
def test_oauth_exchange(client):
    response = client.post(
        "/auth/google/exchange",
        json={"code": "test_code", "state": "test_state"},
        headers={"X-Requested-With": "XMLHttpRequest", "Origin": "http://127.0.0.1:5173"}
    )
    assert response.status_code == 200
    assert "session" in response.cookies
```

#### Frontend Tests

```tsx
// Mock the GoogleOAuthPopup component
jest.mock('@/components/design-system/auth', () => ({
  GoogleOAuthPopup: ({ children, onSuccess }) => (
    <div data-testid="google-oauth" onClick={() => onSuccess({ id: '1', email: 'test@example.com' })}>
      {children}
    </div>
  ),
}))

// Test
test('login with Google', () => {
  const { getByText } = render(<LoginPage />)
  fireEvent.click(getByText('Sign in with Google'))
  // Assert user is logged in
})
```

### 5. Deprecation Timeline

**Phase 1 (Current):** Both flows supported
- New popup flow available
- Old redirect flow still works
- Gradual migration recommended

**Phase 2 (Next Release):** Popup flow preferred
- Deprecation warnings for redirect flow
- Documentation updated to popup flow only

**Phase 3 (Future):** Redirect flow removed
- Old routes removed
- Only popup flow supported

## Troubleshooting Migration

### "Redirect URI mismatch"

**Problem:** Google returns error about redirect_uri

**Solution:** Update Google Cloud Console:
- Remove callback path redirect URIs (`/auth/google/callback`)
- Add page origin (`http://127.0.0.1:5173`)
- For popup flow, redirect_uri must be origin only

### "Origin not allowed"

**Problem:** Backend rejects request with CORS error

**Solution:** Check `APP_CORS_ORIGINS` environment variable matches frontend URL exactly

### Popup blocked by browser

**Problem:** Popup doesn't open

**Solution:** Ensure popup opens directly from user click event (not async callback)

### Session cookie not set

**Problem:** User not authenticated after popup closes

**Solution:** 
- Check `credentials: 'include'` in fetch requests
- Verify backend sets `Set-Cookie` header
- In production, ensure HTTPS for Secure cookies

### "Missing required security header"

**Problem:** Backend returns 403

**Solution:** Ensure `X-Requested-With: XMLHttpRequest` header is sent (GoogleOAuthPopup does this automatically)

## Rollback Plan

If you need to rollback to the old flow:

1. **Keep old routes active** (they're still in `apps/api/routes/auth.py`)
2. **Revert frontend changes**:
   ```tsx
   // Use old login method
   const login = () => {
     window.location.href = '/api/auth/google/login'
   }
   ```
3. **Update Google Cloud Console** redirect URIs back to callback paths

## Testing Checklist

Before deploying to production:

- [ ] Login flow works in development
- [ ] Session cookie is set with correct flags (HttpOnly, SameSite)
- [ ] User info is displayed after login
- [ ] Logout clears session
- [ ] CORS origins correctly configured
- [ ] ID token verification works
- [ ] Custom headers (X-Requested-With) are sent
- [ ] Origin verification works
- [ ] Google Cloud Console redirect URIs updated
- [ ] HTTPS enabled in production
- [ ] Refresh token encryption key set
- [ ] All existing components updated
- [ ] Tests passing

## Benefits Summary

| Feature | Old Flow | New Flow |
|---------|----------|----------|
| User Experience | Full page reload | Popup (no reload) |
| Security | Tokens in URL | Tokens server-side only |
| Google API | Deprecated gapi.auth2 | Modern GIS |
| CSRF Protection | State parameter | State + custom headers + origin |
| Token Storage | Browser cookies | Encrypted server-side |
| ID Token Verification | ❌ No | ✅ Yes |
| Refresh Token Rotation | ❌ No | ✅ Yes |
| Workspace Restriction | ❌ No | ✅ Yes (hd claim) |
| Cookie Security | Basic | __Host- prefix, Secure, HttpOnly |

## Questions?

See:
- [GOOGLE_OAUTH_SETUP.md](../../../api/GOOGLE_OAUTH_SETUP.md) - Complete setup guide
- [auth/README.md](../../../web/src/app/components/design-system/auth/README.md) - Component documentation
- [GoogleOAuthPopup.examples.tsx](../../../web/src/app/components/design-system/auth/GoogleOAuthPopup.examples.tsx) - Usage examples
