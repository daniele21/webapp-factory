# Google OAuth Popup - Quick Reference

## 🚀 Quick Start (5 minutes)

### 1. Backend Setup
```bash
# Set environment variables in apps/api/.env.development
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
APP_CORS_ORIGINS=http://127.0.0.1:5173
APP_JWT_SECRET=dev-secret-key

# Install dependencies (if needed)
pip install cryptography
```

### 2. Google Cloud Console
- Authorized JavaScript origins: `http://127.0.0.1:5173`
- Authorized redirect URIs: `http://127.0.0.1:5173` ⚠️ (origin only, not path!)

### 3. Frontend Usage
```tsx
import { GoogleOAuthPopup } from '@/components/design-system/auth'

<GoogleOAuthPopup 
  onSuccess={(user) => console.log('Logged in:', user)}
  onError={(error) => console.error('Error:', error)}
>
  <button>Sign in with Google</button>
</GoogleOAuthPopup>
```

### 4. Test
```bash
# Terminal 1
cd apps/api && uvicorn main:app --reload --port 8000

# Terminal 2
pnpm run dev:web

# Open http://127.0.0.1:5173 and click login
```

---

## 📚 Common Patterns

### Basic Login
```tsx
<GoogleOAuthPopup onSuccess={(user) => console.log(user)}>
  <button>Sign in with Google</button>
</GoogleOAuthPopup>
```

### With Custom Styling
```tsx
<GoogleOAuthPopup onSuccess={handleSuccess}>
  <Button variant="outline" className="w-full">
    <GoogleIcon /> Google Login
  </Button>
</GoogleOAuthPopup>
```

### With Loading State
```tsx
const [loading, setLoading] = useState(false)

<GoogleOAuthPopup 
  onSuccess={(user) => {
    setLoading(false)
    console.log(user)
  }}
>
  <Button disabled={loading}>
    {loading ? 'Signing in...' : 'Sign in'}
  </Button>
</GoogleOAuthPopup>
```

### Workspace Restriction
```tsx
<GoogleOAuthPopup 
  hostedDomain="company.com"
  onSuccess={handleSuccess}
>
  <button>Sign in with Work Account</button>
</GoogleOAuthPopup>
```

### With Auth Context
```tsx
const { setUser } = useAuth()

<GoogleOAuthPopup 
  onSuccess={(user) => {
    setUser(user)
    navigate('/dashboard')
  }}
>
  <button>Sign in</button>
</GoogleOAuthPopup>
```

### Logout
```tsx
const handleLogout = async () => {
  await fetch('/api/auth/google/revoke', {
    method: 'POST',
    headers: { 'X-Requested-With': 'XMLHttpRequest' },
    credentials: 'include',
  })
  setUser(null)
}

<button onClick={handleLogout}>Logout</button>
```

---

## 🔧 API Reference

### Component Props
```tsx
interface GoogleOAuthPopupProps {
  onSuccess?: (user: GoogleUser) => void
  onError?: (error: Error) => void
  apiBaseUrl?: string          // default: '/api'
  children?: React.ReactNode
  className?: string
  disabled?: boolean
  hostedDomain?: string        // e.g., 'company.com'
}

interface GoogleUser {
  id: string
  email: string
  name?: string
  picture?: string
}
```

### Backend Endpoints

**GET /auth/google/config**
- Returns GIS configuration
- No auth required

**POST /auth/google/exchange**
- Body: `{ code, state, redirect_uri }`
- Headers: `X-Requested-With: XMLHttpRequest`
- Returns: `{ success: true, user: {...} }`
- Sets: `session` cookie (HttpOnly)

**POST /auth/google/revoke**
- Headers: `X-Requested-With: XMLHttpRequest`
- Revokes Google token
- Clears session cookie

**GET /auth/me**
- Returns current user
- Requires session cookie

---

## 🔐 Security Features

✅ **No token exposure** - Tokens stay server-side  
✅ **CSRF protection** - Custom headers + origin check  
✅ **ID token verification** - Signature + claims validation  
✅ **Encrypted refresh tokens** - Fernet encryption  
✅ **Secure cookies** - HttpOnly, Secure, SameSite=Lax  
✅ **CSP headers** - Content Security Policy  
✅ **Token revocation** - Proper logout  

---

## ⚠️ Common Issues

### "Redirect URI mismatch"
**Fix:** In Google Cloud Console, set redirect URI to page **origin** (`http://127.0.0.1:5173`), not a path.

### "Origin not allowed"
**Fix:** Check `APP_CORS_ORIGINS` matches frontend URL exactly (no trailing slash).

### Popup blocked
**Fix:** Ensure popup opens directly from click event (not async callback).

### Session cookie not set
**Fix:** Ensure `credentials: 'include'` in fetch and HTTPS in production.

### "Missing required security header"
**Fix:** Component automatically sends this. Check if custom fetch overrides headers.

---

## 📝 Environment Variables

### Required
```bash
GOOGLE_CLIENT_ID=...          # From Google Cloud Console
GOOGLE_CLIENT_SECRET=...      # From Google Cloud Console
APP_CORS_ORIGINS=...          # Frontend URL(s)
APP_JWT_SECRET=...            # Session signing key
```

### Optional
```bash
APP_REFRESH_TOKEN_KEY=...     # Encryption key (required in prod)
APP_GOOGLE_WORKSPACE_DOMAIN=... # Restrict to domain
APP_JWT_ACCESS_TOKEN_EXPIRE_MINUTES=60
```

---

## 🎯 Production Checklist

- [ ] Set `APP_REFRESH_TOKEN_KEY` (generate with Fernet)
- [ ] Use strong `APP_JWT_SECRET`
- [ ] Limit `APP_CORS_ORIGINS` to production domains
- [ ] Enable HTTPS
- [ ] Update Google Cloud Console URIs
- [ ] Store refresh tokens in database
- [ ] Enable rate limiting
- [ ] Set up monitoring

---

## 📖 Full Documentation

- **Setup Guide:** `apps/api/GOOGLE_OAUTH_SETUP.md`
- **Component Docs:** `apps/web/src/app/components/design-system/auth/README.md`
- **Examples:** `apps/web/src/app/components/design-system/auth/GoogleOAuthPopup.examples.tsx`
- **Migration Guide:** `MIGRATION_OAUTH_POPUP.md`
- **Implementation Details:** `OAUTH_POPUP_IMPLEMENTATION.md`

---

## 🆘 Need Help?

1. Check browser console for errors
2. Check backend logs for detailed messages
3. Verify Google Cloud Console configuration
4. Review troubleshooting in `GOOGLE_OAUTH_SETUP.md`
5. See examples in `GoogleOAuthPopup.examples.tsx`
