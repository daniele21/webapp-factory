import { useTheme } from '../theme/ThemeProvider'

export function ThemeSwitch() {
  const { mode, setMode, brand, setBrand } = useTheme()
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => setMode(mode === 'dark' ? 'light' : 'dark')}
        className="px-3 py-1 rounded border text-sm hover:bg-muted"
      >{mode === 'dark' ? '🌙 Dark' : '☀️ Light'}</button>
      <select
        className="px-2 py-1 border rounded text-sm"
        value={brand}
        onChange={(e) => setBrand(e.target.value as any)}
      >
        <option value="default">Default</option>
        <option value="sky">Sky</option>
        <option value="darkbrand">Darkbrand</option>
      </select>
    </div>
  )
}