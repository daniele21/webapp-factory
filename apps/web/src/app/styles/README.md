# Component Design System

This webapp factory includes a comprehensive design system that allows components to adapt their visual appearance based on the selected visual style and brand theme.

## Visual Styles

Each visual style defines a complete design language with specific design tokens:

### Aurora Minimal
- **Radius**: Large (24px) for soft, rounded interfaces
- **Density**: Comfortable spacing
- **Elevation**: Soft shadows with glassmorphism
- **Motion**: Gentle spring animations
- **Use case**: Analytics, productivity suites

### Carbon Pro
- **Radius**: Small (8px) for precise, enterprise interfaces
- **Density**: Compact spacing for information density
- **Elevation**: Minimal shadows, flat design
- **Motion**: Linear, reduced motion support
- **Use case**: B2B SaaS, admin consoles

### Neon Pulse
- **Radius**: Medium (16px) with glow effects
- **Density**: Spacious for bold presentation
- **Elevation**: Glowing shadows with synthwave aesthetics
- **Motion**: Bouncy, energetic animations
- **Use case**: Developer tools, innovation portals

### Editorial Classic
- **Radius**: Medium (12px) for balanced presentation
- **Density**: Relaxed spacing for readability
- **Elevation**: Subtle shadows, print-inspired
- **Motion**: Smooth, editorial transitions
- **Use case**: Content platforms, documentation

### Playful Pop
- **Radius**: Extra large (32px) for friendly, approachable design
- **Density**: Comfortable with large touch targets
- **Elevation**: Lift effects with hover animations
- **Motion**: Bouncy, playful interactions
- **Use case**: Consumer apps, onboarding

### Finance/Atlas Ledger
- **Radius**: Small (8px) for institutional precision
- **Density**: Compact for data-heavy interfaces
- **Elevation**: Controlled shadows meeting accessibility standards
- **Motion**: Precise, reduced motion aware
- **Use case**: Fintech, enterprise dashboards

## Design Tokens

### Component Design Variables

Each visual style defines these CSS custom properties:

```css
:root[data-visual="aurora"] {
  --component-radius: 24px;           /* Base border radius */
  --component-radius-sm: 20px;        /* Small elements */
  --component-radius-lg: 32px;        /* Large elements */
  --component-density: comfortable;    /* Spacing density */
  --component-spacing: 1.25rem;       /* Base padding */
  --component-spacing-sm: 1rem;       /* Compact padding */
  --component-elevation: 0 20px 40px hsl(var(--primary) / 0.12);
  --component-elevation-hover: 0 24px 48px hsl(var(--primary) / 0.16);
  --component-border: 1px solid color-mix(in oklab, hsl(var(--fg)) 14%, transparent);
  --component-backdrop: blur(18px);    /* Glassmorphism */
  --component-shadow-color: hsl(var(--primary) / 0.2);
  --component-motion: cubic-bezier(0.4, 0, 0.2, 1);
  --component-motion-duration: 200ms;
}
```

### Utility Classes

Use these classes in components to automatically adapt to the selected visual style:

#### Layout & Spacing
- `.component-radius` - Applies visual style's border radius
- `.component-radius-sm` - Small radius variant
- `.component-radius-lg` - Large radius variant
- `.component-spacing` - Applies visual style's padding
- `.component-spacing-sm` - Compact padding variant
- `.component-dense` - 50% of base spacing
- `.component-comfortable` - Base spacing
- `.component-spacious` - 150% of base spacing

#### Visual Effects
- `.component-elevation` - Applies visual style's shadow
- `.component-border` - Applies visual style's border
- `.component-backdrop` - Applies backdrop filter (glassmorphism)
- `.component-motion` - Applies visual style's transition timing

#### Brand-Aware Classes
- `.bg-brand-highlight` - Subtle brand-tinted background
- `.border-brand-subtle` - Subtle brand border
- `.text-brand` - Primary brand color text
- `.elevation-brand` - Brand-aware shadow with primary color

## Usage Examples

### Basic Card Component
```tsx
export const Card = ({ elevation = 'raised', children }) => (
  <section className={cn(
    'component-radius component-border bg-card/80 component-spacing component-motion component-backdrop',
    elevation === 'raised' && 'component-elevation',
    elevation === 'glow' && 'elevation-brand'
  )}>
    {children}
  </section>
)
```

### Input Field
```tsx
export const inputClasses = 
  'w-full component-radius-sm component-border bg-card component-spacing-sm component-motion focus-visible:ring-2 focus-visible:ring-primary/40'
```

### Modal/Dialog
```tsx
export const Modal = ({ children }) => (
  <Dialog.Content className="component-radius component-border bg-card/95 component-spacing component-elevation component-backdrop component-motion">
    {children}
  </Dialog.Content>
)
```

## Implementation Guidelines

### For Component Authors

1. **Use design tokens instead of hardcoded values**
   ```tsx
   // ❌ Don't use fixed values
   className="rounded-xl p-4 shadow-lg"
   
   // ✅ Use component design utilities
   className="component-radius component-spacing component-elevation"
   ```

2. **Leverage semantic color tokens**
   ```tsx
   // ❌ Don't use arbitrary colors
   className="bg-blue-500 text-white border-blue-600"
   
   // ✅ Use semantic tokens
   className="bg-primary text-primary-fg border-primary"
   ```

3. **Combine with brand-aware utilities**
   ```tsx
   // ✅ Components that adapt to both visual style and brand
   className="component-radius bg-card component-spacing elevation-brand"
   ```

### Testing Visual Styles

Use the `StyleShowcase` component to test how your components adapt:

```tsx
import { StyleShowcase } from './components/design-system'

// In your demo/development page
<StyleShowcase />
```

This will show your components across all visual styles and allow real-time switching.

## CSS Architecture

The design system follows this hierarchy:

1. **Base tokens** (`tokens.css`) - Semantic color and spacing scales
2. **Brand themes** (`brand-*.css`) - Brand-specific color palettes  
3. **Visual styles** (`theme/styles/*.css`) - Complete design languages
4. **Component utilities** (`utilities.css`) - Reusable component classes
5. **Factory components** - Use the utilities and tokens

This architecture ensures components automatically adapt when users switch themes or visual styles through the `ThemeProvider`.