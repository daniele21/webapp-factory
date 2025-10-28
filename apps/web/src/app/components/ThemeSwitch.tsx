import { useTheme } from '../theme/ThemeProvider'
import { BRAND_PRESETS, Brand } from '../theme/brands'
import { VISUAL_STYLE_PRESETS, VisualStyle } from '../theme/visualStyles'

export function ThemeSwitch() {
  const { mode, setMode, brand, setBrand, visual, setVisual } = useTheme()
  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <div className="inline-flex gap-1 rounded-xl border border-border bg-card p-1">
        {(['light', 'dark', 'system'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setMode(t)}
            aria-pressed={mode === t}
            className={`px-3 py-1.5 text-sm rounded-lg transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[hsl(var(--ring))] ${
              mode === t ? 'bg-accent text-accent-fg' : 'text-muted hover:bg-surface-2'
            }`}
          >
            {t === 'light' ? '☀️' : t === 'dark' ? '🌙' : '🖥️'} {t === 'system' ? 'System' : t === 'light' ? 'Light' : 'Dark'}
          </button>
        ))}
      </div>
      <select
        className="px-2 py-1 border border-border rounded bg-card"
        aria-label="Select brand palette"
        value={brand}
        onChange={(e) => setBrand(e.target.value as Brand)}
      >
        {BRAND_PRESETS.map((preset) => (
          <option key={preset.id} value={preset.id}>
            {preset.name}
          </option>
        ))}
      </select>
      <select
        className="px-2 py-1 border border-border rounded bg-card"
        aria-label="Select graphic style"
        value={visual}
        onChange={(e) => setVisual(e.target.value as VisualStyle)}
      >
        {VISUAL_STYLE_PRESETS.map((preset) => (
          <option key={preset.id} value={preset.id}>
            {preset.name}
          </option>
        ))}
      </select>
    </div>
  )
}
