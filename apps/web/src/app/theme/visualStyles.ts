export type VisualStyle = 'aurora' | 'carbon' | 'neon' | 'editorial' | 'playful' | 'finance'

export type VisualStylePreset = {
  id: VisualStyle
  name: string
  description: string
  vibe: string[]
  typography: string
  density: string
  radii: string
  motion: string
  useCases: string[]
  surface: string
  accents: string[]
}

export const VISUAL_STYLE_PRESETS: VisualStylePreset[] = [
  {
    id: 'aurora',
    name: 'Aurora Minimal',
    description: 'Calm, airy, Scandinavian surfaces tuned for effortless analytics & productivity apps.',
    vibe: ['Soft gradients', 'Glassy surfaces', 'Negative space'],
    typography: 'Inter + Outfit · 100/400/600',
    density: 'Relaxed (space-3 / space-4)',
    radii: '2xl surfaces · full chips',
    motion: 'Gentle spring (200, 18, 2) · hover lift 2-4px',
    useCases: ['Analytics', 'Productivity suites', 'Personal finance'],
    surface: 'linear-gradient(135deg, rgba(240,248,255,0.9), rgba(236,254,255,0.7))',
    accents: ['#1ecad3', '#9b8fff', '#def7ec'],
  },
  {
    id: 'carbon',
    name: 'Carbon Pro',
    description: 'Enterprise grid with compact density and disciplined borders for mission-critical ops.',
    vibe: ['Precise grid', 'Neutral palette', 'High clarity'],
    typography: 'IBM Plex Sans + IBM Plex Mono',
    density: 'Compact (space-2 / space-3)',
    radii: 'md controls · crisp corners',
    motion: 'Restrained 120-150ms · respects reduced motion',
    useCases: ['B2B SaaS', 'Admin consoles', 'Observability'],
    surface: 'linear-gradient(180deg, rgba(248,250,252,1), rgba(237,242,247,1))',
    accents: ['#0f62fe', '#6f6f6f', '#08c4ff'],
  },
  {
    id: 'neon',
    name: 'Neon Pulse',
    description: 'Bold synthwave gradients with glow shadows for marketing dashboards & dev tools.',
    vibe: ['Synthwave', 'Glows', 'Kinetic CTAs'],
    typography: 'Space Grotesk + JetBrains Mono',
    density: 'Standard with oversized headlines',
    radii: 'xl cards · pill CTAs',
    motion: 'Playful borders + accent glows',
    useCases: ['Developer platforms', 'Innovation portals', 'Pitch demos'],
    surface: 'linear-gradient(135deg, #26183d, #0f172a)',
    accents: ['#ff51e1', '#7c3aed', '#22d3ee'],
  },
  {
    id: 'editorial',
    name: 'Editorial Classic',
    description: 'Magazine-quality typography with tonal surfaces for content-first experiences.',
    vibe: ['Print-inspired', 'Serif hierarchy', 'Calm rules'],
    typography: 'Source Serif + General Sans',
    density: 'Relaxed text · compact dashboards',
    radii: 'lg cards · square sections',
    motion: 'Fade / slide, optional parallax',
    useCases: ['Knowledge bases', 'Reports', 'Education'],
    surface: 'linear-gradient(180deg, #fcfbf7, #f2efe7)',
    accents: ['#1f2933', '#a7553a', '#2f6b6d'],
  },
  {
    id: 'playful',
    name: 'Playful Pop',
    description: 'Rounded, friendly system with micro-interactions and color-tinted states.',
    vibe: ['Approachable', 'Rounded icons', 'Emoji-friendly'],
    typography: 'Nunito / SF Pro Rounded',
    density: 'Roomy controls · large hit areas',
    radii: '2xl cards · full chips',
    motion: 'Snappy 160ms with 1.02 bounce',
    useCases: ['Consumer apps', 'Onboarding flows', 'Community tools'],
    surface: 'radial-gradient(circle at 20% 20%, #fff7ed, #fef2f2)',
    accents: ['#fb7185', '#34d399', '#38bdf8'],
  },
  {
    id: 'finance',
    name: 'Atlas Ledger',
    description: 'Finance-grade system with Mantine-inspired tokens, disciplined grids, and WCAG AA colors.',
    vibe: ['Institutional', 'WCAG AA', 'Motion-aware'],
    typography: 'Inter UI + Inter Headings · Mono fallback for data',
    density: 'Tight controls, spacing scale 4/8/12/16/24/32',
    radii: 'md base with subtle rounding',
    motion: '175ms ease-in-out · reduced-motion aware',
    useCases: ['Fintech dashboards', 'Investment research', 'Enterprise portals'],
    surface: 'linear-gradient(180deg, #f5f7fb, #eaf1ff)',
    accents: ['#2563eb', '#1e40af', '#71717a'],
  },
]

export const VISUAL_STYLE_IDS: VisualStyle[] = VISUAL_STYLE_PRESETS.map((preset) => preset.id) as VisualStyle[]

export const isVisualStyle = (value: string | null): value is VisualStyle => {
  if (!value) return false
  return (VISUAL_STYLE_IDS as readonly string[]).includes(value)
}
