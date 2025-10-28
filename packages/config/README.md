# Config-Driven Layout System

This template provides a 100% config-driven navigation and theming system that allows you to reskin, rebrand, and restructure your application without touching components.

## Features

✅ **Single source of truth**: `public/app.config.json` controls brand, theme, layout, and navigation  
✅ **Runtime updates**: No rebuild needed - swap JSON per environment/tenant  
✅ **Type-safe with Zod**: Invalid configs fail gracefully with clear errors  
✅ **Role/plan-based navigation**: Show/hide nav items based on user permissions  
✅ **Multi-tenant ready**: Serve different configs per domain or tenant  
✅ **Integrates with dark mode**: Uses the CSS variable system for seamless theming

## Configuration

### Location

- **Development**: `apps/web/public/app.config.json`
- **Production**: Customize via `VITE_APP_CONFIG_URL` environment variable
- **Multi-tenant**: Fetch from backend endpoint like `/api/config?tenant=acme`

### Schema

```typescript
{
  brand: {
    name: string              // Application name
    logoUrl?: string          // Logo path or URL
    faviconUrl?: string       // Favicon path
  },
  theme: {
    light: TokenSet           // Light theme color tokens
    dark: TokenSet            // Dark theme color tokens
    radius: number            // Border radius (0-24px)
    fontFamily?: string       // Custom font stack
  },
  layout: {
    sidebar: {
      enabled: boolean        // Show/hide desktop sidebar
      width: number           // Expanded width (default: 264px)
      collapsedWidth: number  // Collapsed width (default: 72px)
      defaultCollapsed: boolean
      showPlanCard: boolean   // Show plan upgrade card
    },
    topbar: {
      search: boolean         // Show search bar
      commandPalette: boolean // Enable ⌘K command palette
      showNotifications: boolean
      showThemeToggle: boolean
    },
    mobileTabs: {
      enabled: boolean        // Show bottom tabs on mobile
    }
  },
  navigation: NavItem[],      // Navigation items (see below)
  features: {
    nprogress: boolean        // Route transition progress bar
  }
}
```

### Navigation Items

```typescript
{
  id: string                  // Unique identifier
  label: string               // Display text
  to: string                  // Route path
  icon?: string               // Lucide icon name or emoji
  external?: boolean          // Opens in new tab
  roles?: string[]            // Visible to specific roles only
  plans?: string[]            // Visible to specific plans only
}
```

### Token Set (Colors)

All colors use HSL format without `hsl()` wrapper (e.g., `"222 84% 56%"`):

```typescript
{
  bg: string                  // Page background
  surface1: string            // Primary surface (cards, panels)
  surface2: string            // Secondary surface (hover states)
  text: string                // Primary text color
  muted: string               // Muted/secondary text
  border: string              // Border color
  accent: string              // Brand/accent color
  accentFg: string            // Text on accent background
  ring: string                // Focus ring color
  chart1?: string             // Chart color 1
  chart2?: string             // Chart color 2
  chart3?: string             // Chart color 3
  chartGrid?: string          // Chart grid lines
  chartAxis?: string          // Chart axis labels
}
```

## Usage

### 1. AppConfigProvider

Wrap your app root with `AppConfigProvider` (already done in `src/main.tsx`):

```tsx
import { AppConfigProvider } from '@config/src/provider'

<AppConfigProvider>
  <App />
</AppConfigProvider>
```

### 2. Using Config in Components

```tsx
import { useAppConfig } from '@config/src/provider'

function MyComponent() {
  const { config, theme, setTheme } = useAppConfig()
  
  // Access configuration
  const brandName = config?.brand.name
  const navItems = config?.navigation
  
  // Control theme
  setTheme('dark') // 'light' | 'dark' | 'system'
  
  return <div>...</div>
}
```

### 3. Role/Plan-Based Navigation

```tsx
import { getVisibleNav } from '@config/nav'
import { useAppConfig } from '@config/src/provider'

function Navigation() {
  const { config } = useAppConfig()
  const user = { role: 'admin', plan: 'pro' }
  
  // Filter nav items based on user permissions
  const visibleItems = getVisibleNav(config, user)
  
  return (
    <nav>
      {visibleItems.map(item => (
        <a key={item.id} href={item.to}>{item.label}</a>
      ))}
    </nav>
  )
}
```

## How It Works

1. **Provider loads config**: On mount, `AppConfigProvider` fetches `app.config.json`
2. **Zod validates**: Schema validation ensures config integrity
3. **Tokens applied**: CSS custom properties are set on `document.documentElement`
4. **Components consume**: Use `useAppConfig()` hook to access config reactively
5. **Theme syncs**: Theme changes update CSS variables and `localStorage`

## Multi-Tenant Setup

### Option 1: Different JSON Files

```bash
public/
  app.config.json           # Default
  tenants/
    acme/app.config.json    # Acme Corp theme
    stark/app.config.json   # Stark Industries theme
```

Set environment variable:
```bash
VITE_APP_CONFIG_URL=/tenants/acme/app.config.json
```

### Option 2: Backend Endpoint

```typescript
// In provider.tsx, modify the fetch URL:
const url = `/api/config?tenant=${tenantId}`
```

Backend returns tenant-specific config:
```typescript
// apps/api/routes/config.py
@router.get("/config")
def get_config(tenant: str):
    config = load_tenant_config(tenant)
    return config
```

## Advanced Customization

### Custom Token Mapping

Override specific tokens at runtime:

```typescript
const { config, setConfig } = useAppConfig()

// Deep merge custom tokens
setConfig({
  ...config,
  theme: {
    ...config.theme,
    light: {
      ...config.theme.light,
      accent: '142 76% 36%', // Custom green accent
    }
  }
})
```

### Dynamic Navigation

Add/remove nav items programmatically:

```typescript
const { config, setConfig } = useAppConfig()

const newItem = {
  id: 'analytics',
  label: 'Analytics',
  to: '/analytics',
  icon: 'BarChart'
}

setConfig({
  ...config,
  navigation: [...config.navigation, newItem]
})
```

## Migration from Hardcoded Config

If you have existing hardcoded navigation:

1. Export to JSON format matching schema
2. Place in `public/app.config.json`
3. Components automatically pick up from provider
4. Remove hardcoded constants

## TypeScript Support

All config types are fully typed:

```typescript
import type { AppConfig, NavItem } from '@config/src/schema'

const config: AppConfig = { /* ... */ }
const navItem: NavItem = { /* ... */ }
```

## Performance

- Config loads once on app mount
- Changes to `app.config.json` require page reload in dev
- Production: Cache config response or preload via link preload
- Theme changes are instant (CSS variable updates only)

## Debugging

Check console for validation errors:

```
Invalid app.config.json: ZodError: [
  {
    "code": "invalid_type",
    "expected": "string",
    "received": "undefined",
    "path": ["brand", "name"]
  }
]
```

## Examples

See `apps/web/public/app.config.json` for a complete working example.

---

**Next steps:**
- Customize `app.config.json` for your brand
- Add role-based navigation rules
- Set up multi-tenant routing if needed
- Configure backend endpoint for dynamic configs
