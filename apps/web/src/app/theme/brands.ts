export type Brand = 'default' | 'sky' | 'darkbrand' | 'sunset' | 'forest'

export type BrandPreset = {
  id: Brand
  name: string
  description: string
  strengths: string[]
  swatches: string[]
  preview: string
}

export const BRAND_PRESETS: BrandPreset[] = [
  {
    id: 'default',
    name: 'Product Blue',
    description: 'Balanced palette designed for enterprise and SaaS dashboards.',
    strengths: ['Accessible', 'Versatile'],
    swatches: ['#2563eb', '#7c3aed', '#0ea5e9'],
    preview: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 50%, #0ea5e9 100%)',
  },
  {
    id: 'sky',
    name: 'Calm Sky',
    description: 'Airy gradient system ideal for wellness or travel products.',
    strengths: ['Aspirational', 'Lightweight'],
    swatches: ['#0ea5e9', '#a5b4fc', '#10b981'],
    preview: 'linear-gradient(135deg, #0ea5e9 0%, #a5b4fc 60%, #10b981 100%)',
  },
  {
    id: 'darkbrand',
    name: 'Midnight Pulse',
    description: 'High-contrast neon accents for tools that live in dark mode.',
    strengths: ['Futuristic', 'High contrast'],
    swatches: ['#a855f7', '#c084fc', '#2dd4bf'],
    preview: 'linear-gradient(135deg, #a855f7 0%, #c084fc 50%, #2dd4bf 100%)',
  },
  {
    id: 'sunset',
    name: 'Sunset Glow',
    description: 'Warm gradient stack that fits storytelling and marketing sites.',
    strengths: ['Expressive', 'Marketing ready'],
    swatches: ['#f97316', '#ec4899', '#facc15'],
    preview: 'linear-gradient(135deg, #f97316 0%, #ec4899 55%, #facc15 100%)',
  },
  {
    id: 'forest',
    name: 'Forest Calm',
    description: 'Grounded greens and ambers tuned for fintech or climate tools.',
    strengths: ['Grounded', 'Trustworthy'],
    swatches: ['#16a34a', '#0f766e', '#f59e0b'],
    preview: 'linear-gradient(135deg, #16a34a 0%, #0f766e 55%, #f59e0b 100%)',
  },
]

export const BRAND_IDS: Brand[] = BRAND_PRESETS.map((preset) => preset.id) as Brand[]

export const isBrand = (value: string | null): value is Brand => {
  if (!value) return false
  return (BRAND_IDS as readonly string[]).includes(value)
}

export const getBrandPreset = (id: Brand) =>
  BRAND_PRESETS.find((preset) => preset.id === id) ?? BRAND_PRESETS[0]
