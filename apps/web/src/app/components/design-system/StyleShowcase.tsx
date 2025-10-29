import { Card } from './display/Card'
import { Chip } from './primitives/Chip'
import { Modal } from './overlays/Modal'
import { Button } from '../ui/button'
import { useTheme } from '../../theme/ThemeProvider'

/**
 * StyleShowcase - Demonstrates how components adapt to different visual styles
 * This component shows the same elements rendered with different design tokens
 * based on the selected visual style (aurora, carbon, neon, etc.)
 */
export const StyleShowcase = () => {
  const { visual, setVisual, brand, setBrand } = useTheme()

  const visualStyles = [
    { id: 'aurora', name: 'Aurora Minimal', description: 'Soft, airy Scandinavian design' },
    { id: 'carbon', name: 'Carbon Pro', description: 'Enterprise grid with compact density' },
    { id: 'neon', name: 'Neon Pulse', description: 'Bold synthwave with glows' },
    { id: 'editorial', name: 'Editorial Classic', description: 'Magazine-quality typography' },
    { id: 'playful', name: 'Playful Pop', description: 'Rounded, friendly system' },
    { id: 'finance', name: 'Atlas Ledger', description: 'Finance-grade institutional' },
  ] as const

  const brands = [
    { id: 'default', name: 'Product Blue' },
    { id: 'sky', name: 'Calm Sky' },
    { id: 'darkbrand', name: 'Midnight Pulse' },
    { id: 'sunset', name: 'Sunset Glow' },
    { id: 'forest', name: 'Forest Calm' },
  ] as const

  return (
    <div className="space-y-8">
      <Card title="Design System Showcase" description="See how components adapt to different visual styles and brands">
        <div className="space-y-6">
          {/* Visual Style Selector */}
          <div>
            <h4 className="mb-3 text-sm font-semibold text-fg">Visual Style</h4>
            <div className="flex flex-wrap gap-2">
              {visualStyles.map((style) => (
                <Button
                  key={style.id}
                  size="sm"
                  variant={visual === style.id ? 'default' : 'secondary'}
                  onClick={() => setVisual(style.id as any)}
                  className="component-motion"
                >
                  {style.name}
                </Button>
              ))}
            </div>
            <p className="mt-2 text-xs text-muted-fg">
              Current: {visualStyles.find(s => s.id === visual)?.description}
            </p>
          </div>

          {/* Brand Selector */}
          <div>
            <h4 className="mb-3 text-sm font-semibold text-fg">Brand Theme</h4>
            <div className="flex flex-wrap gap-2">
              {brands.map((brandOption) => (
                <Chip
                  key={brandOption.id}
                  label={brandOption.name}
                  onRemove={brand === brandOption.id ? undefined : () => setBrand(brandOption.id as any)}
                />
              ))}
            </div>
          </div>

          {/* Component Examples */}
          <div>
            <h4 className="mb-3 text-sm font-semibold text-fg">Component Examples</h4>
            <div className="grid gap-4 sm:grid-cols-2">
              <Card 
                title="Adaptive Card" 
                description="This card uses component design tokens"
                elevation="raised"
              >
                <p className="text-sm text-muted-fg">
                  Notice how the border radius, spacing, and elevation change with different visual styles.
                </p>
              </Card>

              <Card 
                title="Glow Effect" 
                description="Brand-aware elevation"
                elevation="glow"
              >
                <p className="text-sm text-muted-fg">
                  This card's glow adapts to the selected brand colors.
                </p>
              </Card>
            </div>
          </div>

          {/* Design Token Display */}
          <div className="component-radius component-border bg-muted/30 component-spacing-sm">
            <h4 className="mb-3 text-sm font-semibold text-fg">Active Design Tokens</h4>
            <div className="grid gap-2 text-xs font-mono text-muted-fg sm:grid-cols-2">
              <div>Radius: var(--component-radius)</div>
              <div>Spacing: var(--component-spacing)</div>
              <div>Elevation: var(--component-elevation)</div>
              <div>Motion: var(--component-motion)</div>
            </div>
          </div>
        </div>
      </Card>

      {/* Modal Example */}
      <Modal
        title="Adaptive Modal"
        description="This modal also uses the component design tokens"
        trigger={
          <Button className="component-motion">Open Design-Aware Modal</Button>
        }
      >
        <p className="text-sm text-muted-fg">
          This modal's appearance (radius, spacing, elevation) adapts to the selected visual style.
          Try switching between Aurora (large radius), Carbon (compact), and Neon (glowing effects).
        </p>
      </Modal>
    </div>
  )
}

export default StyleShowcase
