import { useTheme } from '../theme/ThemeProvider'
import { BRAND_PRESETS, Brand } from '../theme/brands'
import { VISUAL_STYLE_PRESETS, VisualStyle } from '../theme/visualStyles'

export function ThemeSwitch() {
  const { mode, setMode, brand, setBrand, visual, setVisual } = useTheme()
  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <button
        onClick={() => setMode(mode === 'dark' ? 'light' : 'dark')}
        className="px-3 py-1 rounded border border-border hover:bg-muted transition"
        aria-label="Toggle color mode"
      >
        {mode === 'dark' ? '🌙 Dark' : '☀️ Light'}
      </button>
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
