# Google Auth UI Architecture

## Component Hierarchy

```
┌─────────────────────────────────────────────────────────────┐
│ main.tsx                                                     │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ <AuthProvider>          (Global auth state)             │ │
│ │ ┌─────────────────────────────────────────────────────┐ │ │
│ │ │ <App>                                               │ │ │
│ │ │ ┌─────────────────────────────────────────────────┐ │ │ │
│ │ │ │ Desktop Layout  OR  Mobile Layout               │ │ │ │
│ │ │ │ ┌─────────────────────────────────────────────┐ │ │ │ │
│ │ │ │ │ <AuthMenuConnected />                       │ │ │ │ │
│ │ │ │ │   ├─ Reads: useAuth()                       │ │ │ │ │
│ │ │ │ │   └─ Renders: <AuthMenu />                  │ │ │ │ │
│ │ │ │ └─────────────────────────────────────────────┘ │ │ │ │
│ │ │ └─────────────────────────────────────────────────┘ │ │ │
│ │ └─────────────────────────────────────────────────────┘ │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Data Flow

```
┌──────────────────┐
│   AuthProvider   │  Manages global auth state
│  (Context API)   │  - user
└────────┬─────────┘  - loading
         │            - login()
         │            - logout()
         ▼
┌──────────────────┐
│ AuthMenuConnected│  Consumes context via useAuth()
│   (Connector)    │  Passes data down as props
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│    AuthMenu      │  Renders UI based on props
│  (Presentation)  │  - Login button (if !user)
└──────────────────┘  - User dropdown (if user)
```

## Component Layers

```
┌─────────────────────────────────────────────────────┐
│ Layer 1: State Management                           │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│ AuthProvider                                        │
│  • Manages authentication state                     │
│  • Provides: user, loading, login(), logout()       │
│  • Location: apps/web/src/app/providers/            │
└─────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────┐
│ Layer 2: Connected Component (Convenience)          │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│ AuthMenuConnected                                   │
│  • Connects AuthMenu to AuthProvider                │
│  • Zero-config usage                                │
│  • Location: apps/web/src/app/components/           │
└─────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────┐
│ Layer 3: Presentation Component (Reusable)          │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│ AuthMenu                                            │
│  • Stateless, prop-driven UI                        │
│  • Works with any auth system                       │
│  • Location: apps/web/.../factory/navigation/       │
└─────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────┐
│ Layer 4: Primitives (Building Blocks)               │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│ OAuthButton, Avatar, Popover                        │
│  • Low-level reusable components                    │
│  • Location: apps/web/.../factory/                  │
└─────────────────────────────────────────────────────┘
```

## Authentication Flow

### Login Flow
```
User clicks          AuthMenu           AuthProvider        Backend
"Login" button       Component          Context             API
     │                   │                   │                │
     │────── onClick ────▶│                   │                │
     │                   │                   │                │
     │                   │── onLogin() ──────▶│                │
     │                   │                   │                │
     │                   │                   │─ GET /login ──▶│
     │                   │                   │                │
     │◀────── redirect URL ──────────────────┼────────────────│
     │                   │                   │                │
     │────────── User redirected to Google OAuth ──────────────▶
     │                   │                   │                │
     │◀────────── User returns with auth code ─────────────────│
     │                   │                   │                │
     │                   │                   │── Cookie set ──│
     │                   │                   │                │
     │                   │                   │─ GET /me ─────▶│
     │                   │                   │                │
     │                   │                   │◀─ User data ───│
     │                   │                   │                │
     │                   │◀─ user updated ───│                │
     │                   │                   │                │
     │◀─ Avatar shown ───│                   │                │
```

### Logout Flow
```
User clicks          AuthMenu           AuthProvider        Backend
"Logout" button      Component          Context             API
     │                   │                   │                │
     │─── onClick ───────▶│                   │                │
     │                   │                   │                │
     │                   │── onLogout() ─────▶│                │
     │                   │                   │                │
     │                   │                   │─ POST /logout ─▶│
     │                   │                   │                │
     │                   │                   │◀ Cookie cleared │
     │                   │                   │                │
     │                   │◀─ user = null ────│                │
     │                   │                   │                │
     │◀ Login btn shown ─│                   │                │
```

## File Organization

```
apps/web/src/app/
│
├── providers/
│   └── AuthProvider.tsx              ← State management
│
├── components/
│   ├── AuthMenuConnected.tsx         ← Connected wrapper
│   └── design-system/
│       ├── navigation/
│       │   ├── AuthMenu.tsx          ← Main component ⭐
│       │   ├── AuthMenu.examples.tsx ← Usage examples
│       │   ├── auth.config.ts        ← Configuration
│       │   ├── README.md             ← Documentation
│       │   ├── QUICK_START.md        ← Quick guide
│       │   └── IMPLEMENTATION_SUMMARY.md
│       │
│       ├── navigation.ts             ← Barrel export
│       ├── index.ts                  ← Main export
│       └── app-shell/
│           └── AppShell.tsx          ← Shared layout frame
│
└── App.tsx                          ← Wraps routes with AppShell
```

## State Management Pattern

```typescript
// 1. Provider declares the contract
type AuthCtx = {
  user: User | null
  loading: boolean
  login: () => void
  logout: () => Promise<void>
}

// 2. Provider implementation
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  
  // ... implementation ...
  
  return <Ctx.Provider value={{ user, loading, login, logout }}>
    {children}
  </Ctx.Provider>
}

// 3. Hook for easy consumption
export const useAuth = () => {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

// 4. Connected component
export function AuthMenuConnected(props) {
  const { user, loading, login, logout } = useAuth()
  return <AuthMenu user={user} loading={loading} 
                   onLogin={login} onLogout={logout} {...props} />
}

// 5. Presentation component
export function AuthMenu({ user, loading, onLogin, onLogout }) {
  return user ? <UserDropdown /> : <LoginButton />
}
```

## Design Patterns Used

### 1. **Container/Presentation Pattern**
- `AuthMenuConnected` = Container (handles state)
- `AuthMenu` = Presentation (handles UI)

### 2. **Context API Pattern**
- Global auth state via React Context
- Avoids prop drilling
- Single source of truth

### 3. **Composition Pattern**
- Small, focused components
- Combined to create complex UI
- Reusable and testable

### 4. **Factory Pattern**
- Components organized in factory library
- Consistent API across components
- Easy to discover and use

### 5. **Configuration Pattern**
- Centralized config file
- Environment-aware
- Easy to customize

## Integration Points

```
Application Entry
       │
       ├─── main.tsx
       │     └─ <AuthProvider>        ← Wraps entire app
       │
       ├─── App.tsx
       │     └─ <AppShell topbarActions={<AuthMenuConnected />}>
       │            └─ <Outlet />
       │
       └─── Pages (e.g. Dashboard)
             └─ <Header actions={<AuthMenuConnected />} />
```

## Why This Architecture?

### ✅ Separation of Concerns
- State management (AuthProvider)
- Business logic (AuthMenuConnected)
- Presentation (AuthMenu)
- Primitives (Avatar, Popover, etc.)

### ✅ Reusability
- AuthMenu can be used anywhere
- Works with any auth provider
- No tight coupling

### ✅ Testability
- Each layer can be tested independently
- Mock props for AuthMenu
- Mock context for AuthMenuConnected

### ✅ Maintainability
- Clear file organization
- Well-documented
- Configuration-driven

### ✅ Extensibility
- Easy to add new providers
- Easy to customize UI
- Easy to add features

## Future Extensions

### Add Role-Based UI
```typescript
function RoleBasedAuthMenu() {
  const { user } = useAuth()
  const isAdmin = user?.roles?.includes('admin')
  
  return (
    <AuthMenuConnected
      showSettings={isAdmin}
      additionalMenuItems={
        isAdmin ? <AdminMenuItem /> : null
      }
    />
  )
}
```

### Add Multi-Provider Support
```typescript
function MultiProviderLogin() {
  return (
    <div>
      <AuthMenu loginProvider="google" />
      <AuthMenu loginProvider="github" />
      <AuthMenu loginProvider="email" />
    </div>
  )
}
```

### Add Notifications
```typescript
function AuthMenuWithNotifications() {
  const notifications = useNotifications()
  
  return (
    <AuthMenuConnected
      badge={notifications.unreadCount}
    />
  )
}
```

---

**This architecture is designed to be:**
- 📦 Modular
- 🔄 Reusable
- 🧪 Testable
- 📖 Documented
- 🎨 Customizable
- 🚀 Production-ready
