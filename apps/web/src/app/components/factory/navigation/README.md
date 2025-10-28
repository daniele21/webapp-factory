# Authentication UI Components

This directory contains reusable authentication UI components for the Webapp Factory. These components work seamlessly with the `AuthProvider` context to provide a complete authentication experience.

## Components

### AuthMenu

A fully-featured authentication menu component that displays different UI based on the user's authentication state:

- **Not authenticated**: Shows a login button (OAuthButton)
- **Authenticated**: Shows a user avatar with a dropdown menu containing:
  - User information (name, email, roles)
  - Profile link
  - Settings link (optional)
  - Sign out button

#### Usage

**Basic Usage (with AuthProvider):**

```tsx
import { Header } from './components/factory'
import { AuthMenuConnected } from './components/AuthMenuConnected'

function MyPage() {
  return (
    <Header
      title="Dashboard"
      actions={<AuthMenuConnected />}
    />
  )
}
```

**Manual Usage (without AuthProvider):**

```tsx
import { AuthMenu } from './components/factory'

function MyCustomHeader() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleLogin = () => {
    // Your login logic
    window.location.href = '/api/auth/google/login'
  }

  const handleLogout = async () => {
    // Your logout logic
    await fetch('/api/auth/logout', { method: 'POST' })
    setUser(null)
  }

  return (
    <div className="flex items-center justify-between p-4">
      <h1>My App</h1>
      <AuthMenu
        user={user}
        loading={loading}
        onLogin={handleLogin}
        onLogout={handleLogout}
      />
    </div>
  )
}
```

#### Props

```typescript
import type { AuthProviderId } from './OAuthButton'

type AuthMenuProps = {
  user: AuthUser | null              // Current user object
  loading?: boolean                  // Loading state (shows spinner on login button)
  onLogin?: () => void              // Callback when login button is clicked
  onLogout?: () => void | Promise<void>  // Callback when logout is clicked
  loginLabel?: string               // Custom label for login button
  loginProvider?: AuthProviderId    // OAuth provider (defaults from config)
  showSettings?: boolean            // Show/hide settings menu item (default: true)
  onSettingsClick?: () => void     // Callback when settings is clicked
}

type AuthUser = {
  id: string
  email: string
  name?: string
  picture?: string
  roles?: string[]
}
```

> Defaults for the login provider, label, and menu visibility come from `app.config.json` (`components.authMenu`). Override props when you need per-instance customization.

### AuthMenuConnected

A connected wrapper around `AuthMenu` that automatically hooks into the `AuthProvider` context. This is the recommended way to use the auth menu in most cases.

#### Usage

```tsx
import { AuthMenuConnected } from './components/AuthMenuConnected'

<AuthMenuConnected 
  showSettings={false}
  onSettingsClick={() => navigate('/settings')}
/>
```

## Integration Patterns

### 1. In the TopBar (App-wide)

The recommended approach for most applications:

```tsx
// apps/web/src/app/components/TopBar.tsx
import { ThemeSwitch } from './ThemeSwitch'
import { AuthMenuConnected } from './AuthMenuConnected'

export default function TopBar({ onOpenNav }: Props) {
  return (
    <header className="sticky top-0 z-30 border-b border-border p-3">
      <div className="flex items-center gap-3 w-full">
        <h1>Webapp Factory</h1>
        <div className="ml-auto flex items-center gap-3">
          <ThemeSwitch />
          <AuthMenuConnected />
        </div>
      </div>
    </header>
  )
}
```

### 2. In a Page Header

For page-specific authentication UI:

```tsx
import { Header } from './components/factory'
import { AuthMenuConnected } from './components/AuthMenuConnected'

function DashboardPage() {
  return (
    <>
      <Header
        title="Dashboard"
        subtitle="Welcome back!"
        actions={<AuthMenuConnected />}
      />
      <div className="p-6">
        {/* Page content */}
      </div>
    </>
  )
}
```

### 3. In AppShell

For a consistent layout across all pages:

```tsx
import { AppShell, Header } from './components/factory'
import { AuthMenuConnected } from './components/AuthMenuConnected'

function Layout({ children }) {
  return (
    <AppShell
      header={
        <Header
          title="Webapp Factory"
          actions={<AuthMenuConnected />}
        />
      }
      sidebar={<MySidebar />}
    >
      {children}
    </AppShell>
  )
}
```

### 4. Custom Implementation

For complete control over the UI:

```tsx
import { useAuth } from './providers/AuthProvider'
import { Avatar } from './components/factory'
import { Button } from './components/ui/button'

function CustomAuthUI() {
  const { user, loading, login, logout } = useAuth()

  if (!user) {
    return <Button onClick={login}>Sign In</Button>
  }

  return (
    <div className="flex items-center gap-2">
      <Avatar src={user.picture} fallback={user.email.slice(0, 2)} />
      <span>{user.name || user.email}</span>
      <Button onClick={logout} variant="ghost">Logout</Button>
    </div>
  )
}
```

## Customization

### Styling

The `AuthMenu` component uses Tailwind CSS classes and follows the factory design system. You can customize the appearance by:

1. **Modifying the component directly** (for app-wide changes)
2. **Wrapping with custom styles** (for specific instances)

Example of custom wrapper:

```tsx
function CustomAuthMenu() {
  return (
    <div className="custom-auth-wrapper">
      <AuthMenuConnected 
        loginLabel="Get Started"
        loginProvider="github"
      />
    </div>
  )
}
```

### Custom Menu Items

To add custom menu items, you can either:

1. Fork the `AuthMenu` component
2. Use the user state from `AuthProvider` and build your own menu

Example:

```tsx
import { useAuth } from './providers/AuthProvider'
import { Popover } from './components/factory'

function CustomUserMenu() {
  const { user, logout } = useAuth()
  
  return (
    <Popover trigger={<button>Menu</button>}>
      <div>
        <button onClick={() => navigate('/profile')}>Profile</button>
        <button onClick={() => navigate('/billing')}>Billing</button>
        <button onClick={() => navigate('/api-keys')}>API Keys</button>
        <button onClick={logout}>Logout</button>
      </div>
    </Popover>
  )
}
```

## Backend Integration

The auth components expect certain backend endpoints to be available:

### Required Endpoints

1. **`GET /auth/me`** - Get current user
   - Returns: `{ id, email, name?, picture?, roles? }`
   - Status: 200 if authenticated, 401 if not

2. **`GET /auth/google/login`** - Initiate OAuth flow
   - Query params: `redirect` (return URL)
   - Returns: `{ redirect: "https://accounts.google.com/..." }`

3. **`POST /auth/logout`** - Sign out
   - Clears session cookie
   - Returns: `{ ok: true }`

### Backend Setup

See `apps/api/auth/README.md` for backend authentication setup.

## Configuration

### Environment Variables

```bash
# Frontend (.env)
VITE_API_BASE_URL=http://localhost:8000
```

### AuthProvider Configuration

The `AuthProvider` is already configured in `apps/web/src/app/providers/AuthProvider.tsx`:

```tsx
import { AuthProvider } from './providers/AuthProvider'

// In main.tsx
<AuthProvider>
  <App />
</AuthProvider>
```

## Examples

### Example 1: Protected Route

```tsx
import { Navigate } from 'react-router-dom'
import { useAuth } from './providers/AuthProvider'

function ProtectedPage() {
  const { user, loading } = useAuth()

  if (loading) return <div>Loading...</div>
  if (!user) return <Navigate to="/login" />

  return <div>Protected Content</div>
}
```

### Example 2: Role-Based UI

```tsx
import { useAuth } from './providers/AuthProvider'
import { AuthMenuConnected } from './components/AuthMenuConnected'

function AdminPanel() {
  const { user } = useAuth()
  const isAdmin = user?.roles?.includes('admin')

  return (
    <Header
      title={isAdmin ? 'Admin Panel' : 'Dashboard'}
      actions={<AuthMenuConnected />}
    >
      {isAdmin ? <AdminContent /> : <UserContent />}
    </Header>
  )
}
```

### Example 3: Conditional Settings

```tsx
import { useNavigate } from 'react-router-dom'
import { useAuth } from './providers/AuthProvider'
import { AuthMenuConnected } from './components/AuthMenuConnected'

function AppHeader() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const canAccessSettings = user?.roles?.includes('admin') || user?.roles?.includes('owner')

  return (
    <AuthMenuConnected
      showSettings={canAccessSettings}
      onSettingsClick={() => navigate('/settings')}
    />
  )
}
```

## Troubleshooting

### Login button doesn't work

1. Check that `VITE_API_BASE_URL` is set correctly
2. Verify backend auth endpoints are running
3. Check browser console for CORS errors

### User avatar not showing

1. Verify the `picture` field is returned from `/auth/me`
2. Check that the image URL is accessible
3. Fallback to initials should always work

### Session not persisting

1. Check that cookies are being set correctly (see `apps/api/config/auth.py`)
2. Verify `cookie_domain` and `cookie_secure` settings
3. Check browser dev tools > Application > Cookies

## Best Practices

1. **Use AuthMenuConnected** - It automatically connects to the AuthProvider
2. **Place in TopBar or Header** - Consistent placement improves UX
3. **Handle loading states** - The component handles this, but test it
4. **Test logout flow** - Ensure state clears correctly
5. **Mobile responsiveness** - The component is mobile-friendly by default

## Related Components

- `AuthProvider` - Context provider for auth state
- `OAuthButton` - Standalone OAuth login button
- `Header` - Factory header component with actions support
- `TopBar` - Mobile-friendly top navigation bar
- `Avatar` - User avatar component

## Future Enhancements

- [ ] Support for multiple OAuth providers simultaneously
- [ ] Notification badges
- [ ] User preferences in menu
- [ ] Quick account switcher (multi-tenant)
- [ ] Inline profile editor
