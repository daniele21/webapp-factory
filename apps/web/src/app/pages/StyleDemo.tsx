import { BRAND_PRESETS } from '../theme/brands'
import { VISUAL_STYLE_PRESETS } from '../theme/visualStyles'
import { useTheme } from '../theme/ThemeProvider'

const modeOptions: Array<'light' | 'dark'> = ['light', 'dark']

const buttonVariants = [
  {
    label: 'Primary action',
    helper: 'High emphasis CTA',
    className: 'bg-primary text-primary-fg shadow-sm hover:-translate-y-0.5',
  },
  {
    label: 'Secondary action',
    helper: 'Default surface action',
    className: 'bg-card border border-border hover:bg-muted/40',
  },
  {
    label: 'Quiet / ghost',
    helper: 'Low emphasis utility',
    className: 'btn-ghost hover:bg-muted/40',
  },
  {
    label: 'Gradient action',
    helper: 'Marketing CTA',
    className: 'btn-gradient font-semibold',
  },
]

const statBlocks = [
  { label: 'MRR', value: '$48.2k', delta: '+12% MoM' },
  { label: 'Active seats', value: '1,204', delta: '+86 new' },
  { label: 'NPS', value: '64', delta: '+6 pts' },
]

const statusPills = [
  { label: 'Online', className: 'status-dot status-online' },
  { label: 'Busy', className: 'status-dot status-busy' },
  { label: 'Offline', className: 'status-dot status-offline' },
  { label: 'Error', className: 'status-dot status-error' },
]

const checklist = [
  'Built with semantic tokens',
  'Glass & gradient utilities',
  'Interactive + motion affordances',
  'Ready for marketing or app surfaces',
]

export default function StyleDemo() {
  const { mode, setMode, brand, setBrand, visual, setVisual, lockBrand, lockVisual } = useTheme()

  return (
    <div className="style-demo min-h-screen bg-bg px-4 py-10 sm:px-8 space-y-12">
      <section className="text-center space-y-6 max-w-5xl mx-auto">
        <p className="text-sm uppercase tracking-[0.3em] text-muted-fg">Design system preview</p>
        <h1 className="text-4xl sm:text-5xl font-bold text-gradient-animated">Composable UI kit for any web app</h1>
        <p className="text-lg text-muted-fg leading-relaxed">
          Browse every reusable building block—cards, inputs, nav, skeletons—and toggle between five brand palettes and five
          graphic styles to see how your product can adapt without touching component code.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <div className="inline-flex rounded-xl border border-border p-1 bg-card/70 backdrop-blur-sm">
            {modeOptions.map((option) => (
              <button
                key={option}
                type="button"
                aria-pressed={mode === option}
                onClick={() => setMode(option)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  mode === option ? 'bg-primary text-primary-fg shadow-sm' : 'text-muted-fg hover:text-fg'
                }`}
              >
                {option === 'light' ? '☀️ Light' : '🌙 Dark'}
              </button>
            ))}
          </div>
          <ul className="flex flex-wrap justify-center gap-3 text-sm text-muted-fg">
            {checklist.map((item) => (
              <li key={item} className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-success/20 text-success flex-center text-xs">✓</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-wide text-muted-fg">Theme presets</p>
            <h2 className="text-2xl font-semibold">Five ready-to-brand palettes</h2>
          </div>
          <p className="text-sm text-muted-fg max-w-xl">
            Pick a brand to immediately preview the token swaps. Click any preset below to change the entire application theme.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {BRAND_PRESETS.map((preset) => {
            const active = brand === preset.id
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => !lockBrand && setBrand(preset.id)}
                disabled={lockBrand}
                title={lockBrand ? 'Brand palette locked by site configuration' : undefined}
                className={`card-elevated text-left p-5 rounded-2xl border transition focus-visible-only ${
                  active ? 'ring-2 ring-offset-2 ring-primary' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm uppercase tracking-wide text-muted-fg">{preset.id}</p>
                    <h3 className="text-xl font-semibold">{preset.name}</h3>
                    <p className="text-sm text-muted-fg mt-1">{preset.description}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${active ? 'bg-primary text-primary-fg' : 'bg-muted text-muted-fg'}`}>
                    {active ? 'Active' : 'Preview'}
                  </span>
                </div>
                <div className="mt-4 h-16 rounded-xl" style={{ background: preset.preview }}></div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {preset.swatches.map((color) => (
                    <span key={color} className="w-10 h-10 rounded-full border border-border" style={{ backgroundColor: color }}></span>
                  ))}
                </div>
                <div className="mt-4 flex gap-2 text-xs text-muted-fg">
                  {preset.strengths.map((strength) => (
                    <span key={strength} className="px-2 py-1 rounded-full border border-border">
                      {strength}
                    </span>
                  ))}
                </div>
              </button>
            )
          })}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-wide text-muted-fg">Graphic styles</p>
            <h2 className="text-2xl font-semibold">Five layout &amp; surface systems</h2>
          </div>
          <p className="text-sm text-muted-fg max-w-xl">
            Palette stays untouched while geometry, depth, and backgrounds shift to match the selected visual language.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {VISUAL_STYLE_PRESETS.map((preset) => {
            const active = visual === preset.id
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => !lockVisual && setVisual(preset.id)}
                disabled={lockVisual}
                title={lockVisual ? 'Visual style locked by site configuration' : undefined}
                className={`card-elevated text-left p-5 rounded-2xl border transition focus-visible-only ${
                  active ? 'ring-2 ring-offset-2 ring-accent' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm uppercase tracking-wide text-muted-fg">{preset.id}</p>
                    <h3 className="text-xl font-semibold">{preset.name}</h3>
                    <p className="text-sm text-muted-fg mt-1">{preset.description}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${active ? 'bg-accent text-accent-fg' : 'bg-muted text-muted-fg'}`}>
                    {active ? 'Active' : 'Preview'}
                  </span>
                </div>
                <div className="mt-4 h-16 rounded-xl border border-border" style={{ background: preset.surface }}></div>
                <div className="mt-4 grid gap-1 text-sm text-muted-fg">
                  <p><span className="font-semibold text-fg">Type:</span> {preset.typography}</p>
                  <p><span className="font-semibold text-fg">Density:</span> {preset.density}</p>
                  <p><span className="font-semibold text-fg">Radii:</span> {preset.radii}</p>
                  <p><span className="font-semibold text-fg">Motion:</span> {preset.motion}</p>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {preset.accents.map((accent) => (
                    <span key={accent} className="w-8 h-8 rounded-full border border-border" style={{ background: accent }}></span>
                  ))}
                </div>
                <ul className="mt-4 flex flex-wrap gap-2 text-xs text-muted-fg">
                  {preset.vibe.map((tag) => (
                    <li key={tag} className="px-2 py-1 rounded-full border border-border">{tag}</li>
                  ))}
                </ul>
                <div className="mt-4 text-xs text-muted-fg">
                  <p className="font-semibold text-fg uppercase tracking-wide mb-1">Ideal for</p>
                  <p>{preset.useCases.join(' • ')}</p>
                </div>
              </button>
            )
          })}
        </div>
      </section>

      <section className="space-y-6">
        <header className="flex flex-col gap-2 text-center">
          <p className="text-sm uppercase tracking-wide text-muted-fg">Component catalog</p>
          <h2 className="text-3xl font-semibold">Buttons & interactions</h2>
          <p className="text-muted-fg">High-emphasis CTAs, surface buttons, and gradient marketing affordances.</p>
        </header>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {buttonVariants.map((variant) => (
            <div key={variant.label} className="card-elevated p-4 rounded-2xl space-y-3">
              <p className="text-sm text-muted-fg">{variant.helper}</p>
              <button className={`w-full rounded-xl px-5 py-3 font-medium transition hover:shadow-md ${variant.className}`}>
                {variant.label}
              </button>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-4 justify-center">
          <button className="hover-lift px-5 py-3 rounded-full border border-border">Hover lift</button>
          <button className="hover-scale px-5 py-3 rounded-full border border-border">Hover scale</button>
          <button className="hover-glow px-5 py-3 rounded-full border border-border">Hover glow</button>
        </div>
      </section>

      <section className="space-y-6">
        <header className="flex flex-col gap-2 text-center">
          <p className="text-sm uppercase tracking-wide text-muted-fg">Surface system</p>
          <h2 className="text-3xl font-semibold">Cards & content blocks</h2>
          <p className="text-muted-fg">Mix elevated, glass, and gradient surfaces to match the selected brand.</p>
        </header>
        <div className="grid gap-6 md:grid-cols-3">
          <div className="card-elevated p-6 rounded-2xl space-y-4">
            <div className="status-dot status-online"></div>
            <h3 className="text-xl font-semibold">Elevated card</h3>
            <p className="text-muted-fg text-sm">Uses semantic tokens for background, border, and elevation shadows.</p>
            <button className="btn-ghost px-4 py-2 rounded-lg">Learn more</button>
          </div>
          <div className="card-glass p-6 rounded-2xl space-y-4 border border-glow">
            <div className="status-dot status-busy"></div>
            <h3 className="text-xl font-semibold">Glass morphism</h3>
            <p className="text-muted-fg text-sm">Pairs backdrop blur with brand tinted borders for premium overlays.</p>
            <button className="btn-gradient px-4 py-2 rounded-lg">Explore</button>
          </div>
          <div className="card-gradient p-6 rounded-2xl space-y-4">
            <div className="status-dot status-online"></div>
            <h3 className="text-xl font-semibold">Gradient hero</h3>
            <p className="text-muted-fg text-sm">Use for spotlight moments, onboarding, or marketing callouts.</p>
            <button className="px-4 py-2 rounded-lg bg-primary text-primary-fg hover:-translate-y-0.5 transition">Get started</button>
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <header className="flex flex-col gap-2 text-center">
          <p className="text-sm uppercase tracking-wide text-muted-fg">Data & feedback</p>
          <h2 className="text-3xl font-semibold">Stats, statuses, and skeletons</h2>
          <p className="text-muted-fg">Every theme keeps semantic colors for KPI blocks and loading states.</p>
        </header>
        <div className="grid gap-4 md:grid-cols-3">
          {statBlocks.map((stat) => (
            <div key={stat.label} className="card-elevated p-5 rounded-2xl space-y-2">
              <p className="text-sm text-muted-fg">{stat.label}</p>
              <p className="text-3xl font-semibold">{stat.value}</p>
              <p className="text-sm text-success">{stat.delta}</p>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap justify-center gap-6 text-center">
          {statusPills.map((status) => (
            <div key={status.label} className="flex items-center gap-2 text-sm">
              <span className={status.className}></span>
              {status.label}
            </div>
          ))}
        </div>
        <div className="space-y-4 max-w-2xl mx-auto">
          <div className="skeleton-text"></div>
          <div className="skeleton-text w-3/4"></div>
          <div className="skeleton-button"></div>
          <div className="flex items-center gap-4">
            <div className="skeleton-avatar w-12 h-12"></div>
            <div className="flex-1 space-y-2">
              <div className="skeleton-text"></div>
              <div className="skeleton-text w-2/3"></div>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <header className="flex flex-col gap-2 text-center">
          <p className="text-sm uppercase tracking-wide text-muted-fg">Forms</p>
          <h2 className="text-3xl font-semibold">Inputs & text areas</h2>
        </header>
        <div className="grid gap-4 max-w-3xl mx-auto">
          <input type="text" placeholder="Standard input" className="input-modern w-full" />
          <input type="email" placeholder="Glass input" className="input-glass w-full" />
          <textarea placeholder="Message..." rows={4} className="input-modern w-full resize-none" />
        </div>
      </section>

      <section className="space-y-8">
        <header className="text-center space-y-2">
          <p className="text-sm uppercase tracking-wide text-muted-fg">Navigation</p>
          <h2 className="text-3xl font-semibold">Glass navigation example</h2>
          <p className="text-muted-fg">Tokens drive icon color, blur strength, and hover treatments.</p>
        </header>
        <nav className="glass max-w-3xl mx-auto rounded-2xl p-4 border border-glow backdrop-blur-xl">
          <ul className="flex flex-wrap justify-around gap-2 text-sm">
            {['Home', 'Dashboard', 'Profile', 'Settings'].map((label, index) => (
              <li key={label}>
                <a href="#" className="flex-center-col space-y-1 p-2 rounded-lg hover-scale text-muted-fg hover:text-fg transition">
                  <div
                    className="w-8 h-8 rounded-xl"
                    style={{
                      background:
                        index === 0
                          ? 'hsl(var(--primary))'
                          : index === 1
                          ? 'hsl(var(--secondary))'
                          : index === 2
                          ? 'hsl(var(--accent))'
                          : 'hsl(var(--warning))',
                    }}
                  ></div>
                  <span className="text-xs">{label}</span>
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </section>
    </div>
  )
}
