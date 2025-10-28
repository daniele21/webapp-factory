# Theming System & AppShell

## Overview

This template provides an intentional, semantic theming system optimized for both light and dark modes. The system uses CSS variables for colors, supports system preference detection, and includes polished UI components for navigation.

## Theming System

### Key Features

- **Semantic tokens**: Uses CSS variables like `--bg`, `--surface-1`, `--text`, `--muted`, `--border`, `--accent` instead of raw color values
- **Intentional dark mode**: Dark theme uses carefully tuned surfaces, borders, and shadows (not just inverted colors)
- **System integration**: Respects `prefers-color-scheme` and updates PWA `theme-color` meta tag
- **Accessible contrast**: Body text ≥ 7:1, UI text ≥ 4.5:1 contrast ratios
- **Chart support**: Includes chart-specific color tokens (`--chart-1`, `--chart-2`, etc.)

### Usage

#### ThemeProvider

The `ThemeProvider` supports three modes: `light`, `dark`, and `system`.

```tsx
import { ThemeProvider, useTheme } from './app/theme/ThemeProvider'

function App() {
  return (
    <ThemeProvider>
      <YourApp />
    </ThemeProvider>
  )
}

// In a component:
function MyComponent() {
  const { mode, setMode, brand, setBrand, visual, setVisual } = useTheme()
  
  return (
    <button onClick={() => setMode('dark')}>
      Switch to dark mode
    </button>
  )
}
```

#### ThemeSwitch Component

Use the built-in `ThemeSwitch` component for a polished theme selector:

```tsx
import { ThemeSwitch } from './app/components/ThemeSwitch'

<ThemeSwitch />
```

This provides:
- Light/Dark/System toggle buttons
- Brand palette selector
- Visual style selector

### CSS Variables

#### Core Tokens

```css
/* Light mode (default) */
--bg:            0 0% 99%;       /* Page background */
--surface-1:     0 0% 100%;      /* Cards, panels */
--surface-2:     0 0% 98%;       /* Elevated surfaces */
--text:          222 47% 11%;    /* Primary text */
--muted:         220 9% 46%;     /* Secondary text */
--border:        220 13% 91%;    /* Borders, dividers */

/* Dark mode */
--bg:            222 29% 8%;     /* Page background */
--surface-1:     222 23% 10%;    /* Cards, panels */
--surface-2:     222 21% 13%;    /* Elevated surfaces */
--text:          210 20% 96%;    /* Primary text */
--muted:         215 16% 72%;    /* Secondary text */
--border:        220 15% 20%;    /* Borders, dividers */
```

#### Using Tokens in Tailwind

Tokens are mapped to Tailwind utilities:

```tsx
<div className="bg-bg text-text border border-border">
  <div className="bg-surface1 p-4 rounded-xl">
    <p className="text-muted">Secondary text</p>
    <button className="bg-accent text-accent-fg">Action</button>
  </div>
</div>
```

Available Tailwind classes:
- `bg-bg`, `bg-surface1`, `bg-surface2`
- `text-text`, `text-muted`
- `border-border`
- `bg-accent`, `text-accent-fg`
- `bg-chart-1`, `bg-chart-2`, `bg-chart-3`
- `shadow-soft` (custom elevation)

### Dark Mode Best Practices

1. **Elevation through borders**: Use `border border-border` with subtle shadows instead of heavy box-shadows
2. **Subtle shadows**: Dark mode uses smaller, lighter shadows (e.g., `0 1px 0 rgba(255,255,255,0.02)`)
3. **Surface hierarchy**: Use `surface-1` and `surface-2` for layered UI (surface-2 is slightly lighter)
4. **Focus states**: Always include visible focus rings with `focus-visible:outline-[hsl(var(--ring))]`
5. **Scrollbars**: Custom styled scrollbars use `--border` color in dark mode

## AppShell Component

### Overview

The `AppShell` provides a responsive navigation structure with:
- Desktop: persistent sidebar (collapsible)
- Mobile: top bar + bottom tabs
- Accessibility: skip link, keyboard navigation, ARIA labels
- UX polish: active indicators, tooltips, safe areas

### Usage

```tsx
import { AppShell } from './app/components/AppShell'

function App() {
  return (
    <AppShell>
      <YourPageContent />
    </AppShell>
  )
}
```

### Features

#### Topbar
- Sticky header with backdrop blur
- Search/command palette trigger (⌘K)
- Theme toggle
- Notifications badge
- User avatar/menu
- Mobile: hamburger menu button

#### Sidebar (Desktop)
- Collapsible (264px → 72px)
- Persistent state in localStorage
- Active route indicator with accent rail
- Tooltips when collapsed
- Plan badge and upgrade CTA
- Keyboard navigable

#### Mobile Tabs (Bottom)
- Fixed bottom navigation
- Safe area support for iOS PWA
- Active state highlighting
- Touch-optimized (44px targets)

### Customization

#### Navigation Items

Edit `NAV` array in `Sidebar.tsx` and `MobileTabs.tsx`:

```tsx
const NAV = [
  { label: 'Dashboard', icon: '🏠', to: '/dashboard' },
  { label: 'Analytics', icon: '📊', to: '/analytics' },
  { label: 'Settings', icon: '⚙️', to: '/settings' },
]
```

Replace emoji icons with Lucide React icons:

```tsx
import { Home, BarChart, Settings } from 'lucide-react'

const NAV = [
  { label: 'Dashboard', icon: Home, to: '/dashboard' },
  { label: 'Analytics', icon: BarChart, to: '/analytics' },
  { label: 'Settings', icon: Settings, to: '/settings' },
]

// In render:
<item.icon className="h-5 w-5" />
```

#### Brand/Logo

Update in `Topbar.tsx`:

```tsx
<div className="flex items-center gap-2">
  <img src="/your-logo.png" alt="" className="h-6 w-6" />
  <span className="font-semibold">Your App</span>
</div>
```

#### Plan Badge

Customize in `Sidebar.tsx`:

```tsx
<div className="rounded-xl border border-border bg-surface2 px-3 py-2 text-xs">
  <div className="mb-1 font-medium text-text">Plan: {userPlan}</div>
  {isPaidPlan ? null : (
    <a href="/billing" className="inline-flex items-center gap-1 text-accent hover:underline">
      Upgrade →
    </a>
  )}
</div>
```

### Accessibility Features

- **Skip link**: Keyboard users can jump directly to main content
- **ARIA labels**: All interactive elements have proper labels
- **Focus visible**: Clear focus indicators on all interactive elements
- **aria-current**: Active navigation items marked with `aria-current="page"`
- **Semantic HTML**: Proper use of `<nav>`, `<header>`, `<main>`, `<aside>`

### Responsive Behavior

- **Desktop (≥768px)**: Sidebar + topbar
- **Mobile (<768px)**: Topbar + bottom tabs
- **Tablet**: Sidebar visible, optimized for touch

## Charts Integration

Use chart color tokens for consistent theming:

```tsx
import { getComputedStyle } from 'react'

function Chart() {
  const get = (v: string) =>
    getComputedStyle(document.documentElement).getPropertyValue(v).trim()

  const chartColors = {
    series1: `hsl(${get('--chart-1')})`,
    series2: `hsl(${get('--chart-2')})`,
    series3: `hsl(${get('--chart-3')})`,
    grid: `hsl(${get('--chart-grid')})`,
    axis: `hsl(${get('--chart-axis')})`,
  }

  return <YourChart colors={chartColors} />
}
```

For Recharts, see `apps/web/src/app/components/ChartTheme.tsx` for a working example.

## Additional Utilities

### Skeleton Loading

```tsx
<div className="skeleton h-20 w-full rounded-xl" />
```

### Glass Morphism

```tsx
<div className="glass rounded-xl p-4">
  Glassmorphic card
</div>
```

### Custom Shadows

```tsx
<div className="shadow-soft rounded-xl">
  Soft shadow card
</div>
```

## Performance Tips

1. **Reduce blur on low-end devices**: Consider using `prefers-reduced-motion` or `prefers-reduced-transparency` media queries
2. **Minimize repaints**: CSS variables update without full repaints
3. **Lazy load themes**: Only load visual style CSS when selected

## Migration from Old Theme

If migrating from a previous theme system:

1. Replace color classes with semantic tokens:
   - `bg-white` → `bg-bg` or `bg-surface1`
   - `text-gray-900` → `text-text`
   - `border-gray-200` → `border-border`
   
2. Update dark mode classes:
   - `dark:bg-gray-900` → `dark:bg-surface1` (handled automatically)
   
3. Replace arbitrary values with tokens:
   - `bg-[#fff]` → `bg-surface1`

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge latest 2 versions)
- CSS variables required
- `prefers-color-scheme` detection
- iOS PWA safe areas (`env(safe-area-inset-bottom)`)
- Backdrop blur (graceful fallback)

## Further Reading

- [CSS Custom Properties (MDN)](https://developer.mozilla.org/en-US/docs/Web/CSS/--*)
- [prefers-color-scheme (MDN)](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-color-scheme)
- [WCAG Contrast Guidelines](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html)
