# Quick Start: Google Auth UI

This guide will help you get the Google authentication UI up and running in under 5 minutes.

## ✅ Already Implemented

The Google auth UI is **already integrated** into both desktop and mobile layouts! You should see it in the top-right corner of your app.

## What You See

### Desktop View
- Top-right corner: Theme switcher + Auth menu
- **Not logged in**: "Continue with Google" button
- **Logged in**: Your avatar + name

### Mobile View  
- Top bar with drawer navigation button
- Right side: Auth menu (same as desktop)

## Test It Out

1. **Start the dev server** (if not already running):
   ```bash
   pnpm run dev:web
   ```

2. **Open your browser** to `http://localhost:5173`

3. **Look at the top-right corner** - you'll see the auth UI

4. **Click the login button** (if you're not logged in)
   - Should redirect to Google OAuth (or your configured endpoint)

## How It Works

### Component Flow

```
App
├── DesktopLayout (on desktop)
│   └── Header
│       └── AuthMenuConnected ✓
│
└── MobileLayout (on mobile)
    └── TopBar
        └── AuthMenuConnected ✓
```

### State Management

```typescript
// The AuthProvider manages auth state globally
<AuthProvider>  // In main.tsx
  <App>
    <AuthMenuConnected />  // Automatically connects to AuthProvider
  </App>
</AuthProvider>
```

## Files Created/Modified

### New Files
- ✅ `apps/web/src/app/components/factory/navigation/AuthMenu.tsx`
- ✅ `apps/web/src/app/components/factory/navigation/auth.config.ts`
- ✅ `apps/web/src/app/components/factory/navigation/AuthMenu.examples.tsx`
- ✅ `apps/web/src/app/components/factory/navigation/README.md`
- ✅ `apps/web/src/app/components/AuthMenuConnected.tsx`

### Modified Files
- ✅ `apps/web/src/app/layouts/DesktopLayout.tsx` - Added AuthMenuConnected
- ✅ `apps/web/src/app/layouts/MobileLayout.tsx` - Added AuthMenuConnected
- ✅ `apps/web/src/app/components/TopBar.tsx` - Added AuthMenuConnected (deprecated wrapper)
- ✅ `apps/web/src/app/components/factory/navigation.ts` - Added exports
- ✅ `apps/web/src/app/components/factory/index.ts` - Added exports

## Customization

### Change the OAuth Provider

In your layout file:

```tsx
<AuthMenuConnected 
  loginProvider="github"  // or 'slack', 'email'
  loginLabel="Sign in with GitHub"
/>
```

### Hide Settings Menu

```tsx
<AuthMenuConnected showSettings={false} />
```

### Add Custom Settings Handler

```tsx
import { useNavigate } from 'react-router-dom'

function MyLayout() {
  const navigate = useNavigate()
  
  return (
    <AuthMenuConnected 
      onSettingsClick={() => navigate('/settings')}
    />
  )
}
```

## Add to Other Pages

Want to add auth to a specific page? Just use the `Header` component:

```tsx
import { Header } from './components/factory'
import { AuthMenuConnected } from './components/AuthMenuConnected'

function MyPage() {
  return (
    <>
      <Header
        title="My Dashboard"
        subtitle="Welcome back!"
        actions={<AuthMenuConnected />}
      />
      <div className="p-6">
        {/* Your page content */}
      </div>
    </>
  )
}
```

## Protect Routes

Make a route require authentication:

```tsx
import { Navigate } from 'react-router-dom'
import { useAuth } from './providers/AuthProvider'

function ProtectedPage() {
  const { user, loading } = useAuth()

  if (loading) return <div>Loading...</div>
  if (!user) return <Navigate to="/" />

  return <div>Protected content!</div>
}
```

## Troubleshooting

### Auth button doesn't appear
- Check that `AuthProvider` is wrapping your app in `main.tsx` ✓ (it is)
- Verify imports are correct
- Check browser console for errors

### Login doesn't work
- Make sure backend is running (`pnpm run dev:api`)
- Check `VITE_API_BASE_URL` in your `.env` file
- Verify backend auth endpoints are configured

### User info doesn't persist
- Check that backend sets session cookies correctly
- Look for CORS errors in browser console
- Verify cookie settings in `apps/api/config/auth.py`

## Next Steps

1. **Test the full flow**: Login → See user info → Logout
2. **Style it**: Customize colors, sizes, etc.
3. **Add features**: Profile page, settings page, etc.
4. **Add navigation**: Wire up Profile and Settings buttons

## Learn More

- 📖 **Full Documentation**: See `apps/web/src/app/components/factory/navigation/README.md`
- 💡 **Examples**: See `apps/web/src/app/components/factory/navigation/AuthMenu.examples.tsx`
- 🎨 **Component API**: See `AuthMenu.tsx` for all props and options
- 🔧 **Configuration**: See `auth.config.ts` for customization options

## Support

If you run into issues:

1. Check the README.md (comprehensive troubleshooting section)
2. Look at the examples file (10 real-world scenarios)
3. Review the implementation summary for architecture details

---

**That's it!** Your app now has Google authentication UI. 🎉
