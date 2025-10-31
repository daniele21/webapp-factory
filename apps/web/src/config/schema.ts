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

const authProviderId = z.enum(['google', 'github', 'slack', 'email'])

const authProvider = z.object({
  id: authProviderId,
  label: z.string().optional(),
})

const cookieCategory = z.object({
  id: z.string(),
  label: z.string(),
  description: z.string().optional(),
  isEssential: z.boolean().optional(),
})

const notificationChannel = z.object({
  id: z.string(),
  label: z.string(),
  description: z.string().optional(),
  defaultEnabled: z.boolean().default(true),
  channel: z.enum(['inApp', 'webPush', 'email']).default('inApp'),
})

const notificationsConfig = z
  .object({
    inApp: z.boolean().default(true),
    webPush: z.boolean().default(false),
    email: z.boolean().default(false),
    publicKey: z.string().optional(),
    channels: z.array(notificationChannel).optional(),
    inboxUrl: z.string().optional(),
    subscriptionEndpoint: z.string().optional(),
    fallbackEmailTemplate: z.string().optional(),
  })
  .optional()

const cspSourceList = z.array(z.string())

const cspTenantOverrides = z.object({
  default: cspSourceList.optional(),
  script: cspSourceList.optional(),
  style: cspSourceList.optional(),
  img: cspSourceList.optional(),
  connect: cspSourceList.optional(),
  font: cspSourceList.optional(),
  frame: cspSourceList.optional(),
  media: cspSourceList.optional(),
  manifest: cspSourceList.optional(),
  worker: cspSourceList.optional(),
  frameAncestors: cspSourceList.optional(),
  directives: z.record(cspSourceList).optional(),
})

const cspConfig = z
  .object({
    default: cspSourceList.default(["'self'"]),
    script: cspSourceList.default(["'self'"]),
    style: cspSourceList.default(["'self'"]),
    img: cspSourceList.default(["'self'"]),
    connect: cspSourceList.default(["'self'"]),
    font: cspSourceList.default(["'self'"]),
    frame: cspSourceList.default(["'self'"]),
    media: cspSourceList.default(["'self'"]),
    manifest: cspSourceList.default(["'self'"]),
    worker: cspSourceList.default(["'self'"]),
    frameAncestors: cspSourceList.default(["'self'"]),
    directives: z.record(cspSourceList).optional(),
    perTenant: z.record(cspTenantOverrides).optional(),
    reportOnly: z.boolean().optional(),
    reportTo: z.string().optional(),
    reportUri: z.string().optional(),
    upgradeInsecureRequests: z.boolean().default(true),
  })
  .default({
    default: ["'self'"],
    script: ["'self'"],
    style: ["'self'"],
    img: ["'self'"],
    connect: ["'self'"],
    font: ["'self'"],
    frame: ["'self'"],
    media: ["'self'"],
    manifest: ["'self'"],
    worker: ["'self'"],
    frameAncestors: ["'self'"],
    upgradeInsecureRequests: true,
  })

const hstsConfig = z.object({
  maxAge: z.number().int().nonnegative().default(31536000),
  includeSubDomains: z.boolean().default(true),
  preload: z.boolean().default(false),
})

const securityConfig = z
  .object({
    csp: cspConfig,
    hsts: z.union([z.boolean(), hstsConfig]).default(true),
    referrerPolicy: z.string().default('strict-origin-when-cross-origin'),
    permissionsPolicy: z.record(z.string()).optional(),
  })
  .optional()

const pwaConfig = z
  .object({
    backgroundSync: z.boolean().default(false),
    offlinePage: z.string().default('/offline.html'),
    appShellCaching: z.boolean().default(true),
    updatePrompt: z.boolean().default(true),
  })
  .optional()

export const AppConfigSchema = z.object({
  brand: z.object({
    name: z.string(),
    logoUrl: z.string().optional(),
    faviconUrl: z.string().optional(),
  }),
  theme: z.object({
    light: tokens,
    dark: tokens,
    // Optional defaults for the UI brand palette and visual style
    defaultBrand: z.string().optional(),
    defaultVisual: z.string().optional(),
    // Optional locks: when true, the UI should not allow changing brand/visual
    lockBrand: z.boolean().optional(),
    lockVisual: z.boolean().optional(),
    transparency: z.boolean().default(true),
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
  components: z.object({
    authMenu: z.object({
      enabled: z.boolean().default(true),
      loginProvider: authProviderId.default('google'),
      loginLabel: z.string().optional(),
      showSettings: z.boolean().default(true),
      providers: z.array(authProvider).default([{ id: 'google' }]),
    }).default({
      enabled: true,
      loginProvider: 'google',
      showSettings: true,
      providers: [{ id: 'google' }],
    }),
  }).default({
    authMenu: {
      enabled: true,
      loginProvider: 'google',
      showSettings: true,
      providers: [{ id: 'google' }],
    },
  }),
  cookies: z
    .object({
      categories: z.array(cookieCategory),
      default: z.array(z.string()).default(['necessary']),
    })
    .optional(),
  analytics: z
    .object({
      googleAnalyticsId: z.string().optional(),
      enabled: z.boolean().optional(),
      googleAnalyticsConfig: z.record(z.unknown()).optional(),
    })
    .optional(),
  notifications: notificationsConfig,
  security: securityConfig,
  pwa: pwaConfig,
})

export type AppConfig = z.infer<typeof AppConfigSchema>
