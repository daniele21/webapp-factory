import { AppShell } from '../components/AppShell'

/**
 * Example usage of the AppShell component
 * 
 * The AppShell provides:
 * - Responsive navigation (desktop sidebar + mobile tabs)
 * - Topbar with search, theme toggle, notifications
 * - Skip link for accessibility
 * - Keyboard navigation support
 * - Collapsible sidebar with localStorage persistence
 */
export function ExampleLayout() {
  return (
    <AppShell>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-text">Dashboard</h1>
        
        {/* Example cards using semantic tokens */}
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-border bg-surface1 p-6 shadow-soft">
            <h3 className="text-lg font-semibold text-text">Total Users</h3>
            <p className="mt-2 text-3xl font-bold text-accent">1,234</p>
            <p className="mt-1 text-sm text-muted">+12% from last month</p>
          </div>
          
          <div className="rounded-xl border border-border bg-surface1 p-6 shadow-soft">
            <h3 className="text-lg font-semibold text-text">Revenue</h3>
            <p className="mt-2 text-3xl font-bold text-accent">$12,345</p>
            <p className="mt-1 text-sm text-muted">+8% from last month</p>
          </div>
          
          <div className="rounded-xl border border-border bg-surface1 p-6 shadow-soft">
            <h3 className="text-lg font-semibold text-text">Active Sessions</h3>
            <p className="mt-2 text-3xl font-bold text-accent">456</p>
            <p className="mt-1 text-sm text-muted">Currently online</p>
          </div>
        </div>

        {/* Example of using theme polish classes */}
        <div className="rounded-xl border border-border bg-surface1 p-6">
          <h2 className="text-xl font-semibold text-text mb-4">Recent Activity</h2>
          
          {/* Skeleton loader example */}
          <div className="space-y-3">
            <div className="skeleton h-12 w-full rounded-lg" />
            <div className="skeleton h-12 w-full rounded-lg" />
            <div className="skeleton h-12 w-3/4 rounded-lg" />
          </div>
        </div>

        {/* Example glass morphism */}
        <div className="glass rounded-xl p-6">
          <h2 className="text-xl font-semibold text-text mb-2">Glass Effect</h2>
          <p className="text-muted">
            This card uses the glassmorphic style with backdrop blur.
          </p>
        </div>
      </div>
    </AppShell>
  )
}

/**
 * Example of using the theme in a standalone component
 */
export function ThemedButton() {
  return (
    <button
      className="inline-flex items-center gap-2 rounded-xl px-4 py-2 
                 bg-accent text-accent-fg hover:opacity-95 
                 focus-visible:outline-2 focus-visible:outline-offset-2 
                 focus-visible:outline-[hsl(var(--ring))] 
                 transition shadow-sm"
    >
      Click me
    </button>
  )
}

/**
 * Example of using theme colors programmatically
 */
export function DynamicThemedComponent() {
  // Access CSS variables in JavaScript
  const accentColor = getComputedStyle(document.documentElement)
    .getPropertyValue('--accent')
    .trim()
  
  return (
    <div style={{ backgroundColor: `hsl(${accentColor})` }}>
      Dynamically themed content
    </div>
  )
}
