import { z } from 'zod'

const tokens = z.object({
  bg: z.string(),
  surface1: z.string(),
  surface2: z.string(),
  text: z.string(),
  muted: z.string(),
  border: z.string(),
  accent: z.string(),
  accentFg: z.string(),
  ring: z.string(),
  chart1: z.string().optional(),
  chart2: z.string().optional(),
  chart3: z.string().optional(),
  chartGrid: z.string().optional(),
  chartAxis: z.string().optional(),
})

export const AppConfigSchema = z.object({
  brand: z.object({
    name: z.string(),
    logoUrl: z.string().optional(),
    faviconUrl: z.string().optional(),
  }),
  theme: z.object({
    light: tokens,
    dark: tokens,
    radius: z.number().min(0).max(48).default(12),
    fontFamily: z.string().optional(),
  }),
  layout: z.object({
    sidebar: z.object({
      enabled: z.boolean().default(true),
      width: z.number().default(264),
      collapsedWidth: z.number().default(72),
      defaultCollapsed: z.boolean().default(false),
      showPlanCard: z.boolean().default(true),
    }),
    topbar: z.object({
      search: z.boolean().default(true),
      commandPalette: z.boolean().default(true),
      showNotifications: z.boolean().default(true),
      showThemeToggle: z.boolean().default(true),
    }),
    mobileTabs: z.object({ enabled: z.boolean().default(true) }),
  }),
  navigation: z.array(z.object({
    id: z.string(),
    label: z.string(),
    to: z.string(),
    icon: z.string().optional(),
    external: z.boolean().optional(),
    roles: z.array(z.string()).optional(),
    plans: z.array(z.string()).optional(),
  })),
  features: z.object({ nprogress: z.boolean().default(true) }).default({ nprogress: true }),
})

export type AppConfig = z.infer<typeof AppConfigSchema>
