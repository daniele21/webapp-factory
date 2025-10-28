import { useTheme } from '../theme/ThemeProvider'
import { BRAND_PRESETS, Brand } from '../theme/brands'
import { VISUAL_STYLE_PRESETS, VisualStyle } from '../theme/visualStyles'

export function ThemeSwitch() {
  const { mode, setMode, brand, setBrand, visual, setVisual, lockBrand, lockVisual } = useTheme()
  
  const toggleMode = () => {
    setMode(mode === 'dark' ? 'light' : 'dark')
  }
  
  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <button
        onClick={toggleMode}
        aria-label={`Switch to ${mode === 'dark' ? 'light' : 'dark'} mode`}
        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card hover:bg-surface2 transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[hsl(var(--ring))]"
      >
        {mode === 'dark' ? '🌙' : '☀️'}
      </button>
      <select
        className="px-2 py-1 border border-border rounded bg-card"
        aria-label="Select brand palette"
        value={brand}
        disabled={lockBrand}
        title={lockBrand ? 'Brand palette locked by site configuration' : undefined}
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
        disabled={lockVisual}
        title={lockVisual ? 'Visual style locked by site configuration' : undefined}
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
