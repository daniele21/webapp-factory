import { useEffect, useMemo, useState } from 'react'

export const seriesPalette = [
  'hsl(var(--primary))',
  'hsl(var(--secondary))',
  'hsl(var(--accent))',
  'hsl(var(--muted))',
]

const VARS = ['--primary', '--secondary', '--accent', '--muted']

function resolveVars(): string[] {
  if (typeof window === 'undefined') return seriesPalette
  const styles = getComputedStyle(document.documentElement)
  return VARS.map((v, i) => {
    const raw = styles.getPropertyValue(v).trim()
    if (!raw) return seriesPalette[i]
    // raw is like "221 83% 53%" -> make a full hsl() string
    return `hsl(${raw})`
  })
}

// Hook that returns resolved series colors and updates when root attributes change
export function useSeriesColors() {
  const [colors, setColors] = useState<string[]>(() => resolveVars())

  useEffect(() => {
    if (typeof window === 'undefined') return

    const root = document.documentElement
    const mo = new MutationObserver(() => {
      setColors(resolveVars())
    })

    mo.observe(root, { attributes: true, attributeFilter: ['class', 'data-theme'] })

    // also listen to resize in case some runtime style changes
    const onThemeChange = () => setColors(resolveVars())
    window.addEventListener('resize', onThemeChange)

    return () => {
      mo.disconnect()
      window.removeEventListener('resize', onThemeChange)
    }
  }, [])

  return colors
}

// Utility to get resolved colors immediately (non-hook)
export function getSeriesColors(): string[] {
  return resolveVars()
}

export default null
