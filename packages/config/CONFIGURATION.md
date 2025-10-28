# App configuration (app.config.json)

This document explains the shape and supported values of the application's runtime configuration file: `apps/web/public/app.config.json`.

It describes each top-level field, valid values (where constrained), token formats, how the runtime applies the configuration, and how to set an initial brand palette and visual style from the config.

## Location
- The runtime config file served by the web app: `apps/web/public/app.config.json`
- The typed schema used to validate the config: `packages/config/src/schema.ts`
- The provider that applies the config at runtime: `packages/config/src/provider.tsx`
- Theme presets (brand ids): `apps/web/src/app/theme/brands.ts`
- Visual style presets: `apps/web/src/app/theme/visualStyles.ts`

## Purpose
`app.config.json` allows you to customize semantic tokens, initial theme preferences, layout defaults, navigation items, and a few feature/component toggles without changing application source code.

## Top-level shape
(Validated by `AppConfigSchema` — see the implementation in `packages/config/src/schema.ts`)

- `brand` (object)
  - `name` (string) — display name for the product
  - `logoUrl` (string, optional) — path to logo used in topbar
  - `faviconUrl` (string, optional)

- `theme` (object)
  - `light` (object) — semantic tokens used for the light mode
  - `dark` (object) — tokens used for dark mode
  - `defaultBrand` (string, optional) — initial brand palette id (see list below)
  - `defaultVisual` (string, optional) — initial visual style id (see list below)
  - `radius` (number) — global radius in px (min: 0, max: 48)
  - `fontFamily` (string, optional)

- `layout` (object)
  - `sidebar` (object): `enabled` (boolean), 
  - `width` (number), 
  - `collapsedWidth` (number), 
  - `defaultCollapsed` (boolean), 
  - `showPlanCard` (boolean)
  - `topbar` (object): 
    - `search` (boolean), 
    - `commandPalette` (boolean), 
    - `showNotifications` (boolean), 
    - `showThemeToggle` (boolean)
  - `mobileTabs` (object): 
    - `enabled` (boolean)

- `navigation` (array of objects)
  - Each item: `id` (string), 
  - `label` (string), 
  - `to` (string), 
  - `icon` (string, optional), 
  - `external` (boolean, optional), 
  - `roles` (array of strings, optional), 
  - `plans` (array of strings, optional)

- `features` (object)
  - `nprogress` (boolean)

- `components` (object)
  - `authMenu` (object):
    - `enabled` (boolean)
    - `loginProvider` (string) — one of `google`, `github`, `slack`, `email`
    - `loginLabel` (string, optional)
    - `showSettings` (boolean)
    - `providers` (array of provider objects): each provider `{ id: 'google'|'github'|'slack'|'email', label?: string }`

## Theme tokens (light/dark)
Both the `light` and `dark` objects accept the following token keys (strings):

- `bg` — page background token (format: HSL token string)
- `surface1` — primary surface / card color
- `surface2` — secondary surface
- `text` — primary text token
- `muted` — muted background/token
- `border` — border token
- `accent` — accent (used as --accent)
- `accentFg` — accent foreground color
- `ring` — focus ring token
- Optional chart tokens: `chart1`, `chart2`, `chart3`, `chartGrid`, `chartAxis`

### Token format
Most tokens are HSL raw tokens expressed like:

- "222 34% 7%"

This is intentionally a raw HSL token (no `hsl()` wrapper). In CSS the code uses `hsl(var(--bg))` to construct readable colors.

Examples:

- `"bg": "0 0% 100%"` (white)
- `"accent": "217 100% 62%"`

## Default brand & visual
- `theme.defaultBrand` — sets the initial brand palette ID on document start by writing `data-theme="<id>"` on the root element, but only if the user hasn't already chosen a brand (localStorage key `wf:brand`).
- `theme.defaultVisual` — sets the initial visual style by writing `data-visual="<id>"` on the root element, but only if the user hasn't already chosen a visual (localStorage key `wf:visual`).

These will be applied by the `AppConfigProvider` at boot. User selections later are persisted by the `ThemeProvider` and will take precedence.

## Allowed (current) brand ids (palettes)
Defined in `apps/web/src/app/theme/brands.ts`.

- `default`
- `sky`
- `darkbrand`
- `sunset`
- `forest`

Each brand has a corresponding CSS file: `apps/web/src/app/styles/brand-<id>.css` which sets CSS variables under `:root[data-theme="<id>"]` (for example `:root[data-theme="sky"] { --primary: ... }`).

To add a brand: add a `BRAND_PRESETS` entry (id) and provide a `brand-<id>.css` in the styles folder (or add tokens to `tokens.json` and use `apps/web/scripts/build-themes.ts` to generate `brands.generated.css`).

## Allowed visual ids (surface / geometry / depth systems)
Defined in `apps/web/src/app/theme/visualStyles.ts`.

- `aurora`
- `carbon`
- `neon`
- `editorial`
- `playful`
- `finance`

Each visual style has a CSS file under `apps/web/src/app/theme/styles/<id>.css` and is applied by setting `data-visual="<id>"` on the root. Visual CSS targets selectors like `:root[data-visual="finance"]` and `:root[data-visual="finance"][data-theme="dark"]`.

To add a visual: add an entry to `VISUAL_STYLE_PRESETS` and create the corresponding CSS in `apps/web/src/app/theme/styles/`.

## Precedence & runtime behavior (important)
- The app reads `app.config.json` at startup in `AppConfigProvider`.
- `AppConfigProvider` applies semantic tokens by setting inline CSS custom properties (e.g., `--bg`, `--accent`) on `document.documentElement.style`.
- For `defaultBrand` and `defaultVisual`, `AppConfigProvider` sets `data-theme` and `data-visual` on the root element only if the user hasn't previously selected values (it checks `localStorage.getItem('wf:brand')` / `localStorage.getItem('wf:visual')`).
- `ThemeProvider` is responsible for interactive theme changes and persisting user choices (keys: `wf:mode`, `wf:brand`, `wf:visual`). After the initial defaults are applied, `ThemeProvider` will read localStorage and take over.
- Avoid setting `data-theme` in other places (that was a cause of confusion in earlier versions). Prefer `ThemeProvider` as the source of truth for brand & visual changes in the UI.

## Example `app.config.json` snippet

```json
{
  "brand": { "name": "Webapp Factory", "logoUrl": "/icons/logo-192.png" },
  "theme": {
    "light": {
      "bg": "0 0% 100%",
      "surface1": "210 30% 97%",
      "text": "222 50% 12%",
      "accent": "217 100% 62%"
    },
    "dark": {
      "bg": "222 34% 7%",
      "surface1": "222 28% 11%",
      "text": "210 20% 96%",
      "accent": "217 100% 74%"
    },
    "defaultBrand": "sky",
    "defaultVisual": "neon",
    "radius": 14,
    "fontFamily": "Inter, ui-sans-serif, system-ui"
  }
}
```

## Adding new brand tokens via script
There is a small helper script:

`apps/web/scripts/build-themes.ts`

It reads `apps/web/src/app/styles/tokens.json` and writes a generated `brands.generated.css` file containing per-brand `:root[data-theme="<id>"] { --primary:... }` rules. If you prefer authoring CSS by hand, add `brand-<id>.css` and import it from `apps/web/src/app/styles/index.css`.

## How to test locally
- Start the development server and visit the web UI:

```bash
pnpm install
pnpm run dev:web
```

- Open the browser devtools and inspect `document.documentElement`:
  - Confirm `data-theme` is set to the brand id (if no prior localStorage choice, it will be set from `theme.defaultBrand`).
  - Confirm `data-visual` is set if `theme.defaultVisual` is present.
  - Check inline style variables: `getComputedStyle(document.documentElement).getPropertyValue('--bg')`.

- Refresh to pick up updated `app.config.json` changes (dev server serves `apps/web/public/` files).

## Notes & tips
- `theme.defaultBrand` and `theme.defaultVisual` are simply *defaults*. Once a user picks a palette or visual in the UI, the selection is saved to `localStorage` and will override config defaults.
- Keep token values in raw HSL tokens when possible (so CSS uses `hsl(var(--token))` consistently).
- If you add new brand ids, update `apps/web/src/app/theme/brands.ts` so the UI shows the new option in the Theme picker.

---

If you want, I can also:
- Add a short schema-based validator script that verifies `apps/web/public/app.config.json` against `packages/config/src/schema.ts` (useful for CI)
- Add an example `brand-orchid.css` and `visual-smooth.css` to demonstrate adding new palettes/visuals

Which of those would you like next?
