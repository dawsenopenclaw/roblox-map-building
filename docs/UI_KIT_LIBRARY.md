# In-Studio UI Kit Library

The ForjeGames UI Kit is a set of pre-authored, theme-aware ScreenGui templates
that can be dropped into any Roblox place in a single command. Each template is
a TypeScript factory that takes a `ThemePreset` and returns a ready-to-run Luau
source string which builds a styled, functional ScreenGui when executed.

All kit sources live under `src/lib/ui-kit/`. Import them via the barrel:

```ts
import { shopTemplate, hudTemplate, UI_KIT_CATALOG } from '@/lib/ui-kit'
import { THEME_PRESETS } from '@/lib/theme/theme-presets'

const luau = shopTemplate(THEME_PRESETS['medieval-fantasy'])
// -> send `luau` to the Studio plugin as a LocalScript
```

## Catalog

| Id                   | Name                | Parent                 | Description                                                             |
| -------------------- | ------------------- | ---------------------- | ----------------------------------------------------------------------- |
| `hud`                | HUD                 | StarterPlayerScripts   | Health bar, coin counter, level badge, minimap stub.                    |
| `shop`               | Shop                | StarterPlayerScripts   | Grid of items with rarity strokes, buy buttons, currency header.        |
| `inventory`          | Inventory           | StarterPlayerScripts   | 6x5 slot grid with tooltips, drag affordance, item counts.              |
| `settings`           | Settings            | StarterPlayerScripts   | Draggable sliders for master/music/SFX volume and graphics quality.     |
| `leaderboard`        | Leaderboard         | StarterPlayerScripts   | Tabbed leaderboard (daily/weekly/all-time) with gold/silver/bronze.     |
| `main-menu`          | Main Menu           | StarterPlayerScripts   | Fullscreen title with Play/Settings/Credits/Quit and glow orbs.         |
| `pause-menu`         | Pause Menu          | StarterPlayerScripts   | Blur overlay with Resume/Settings/Main Menu/Exit. P or Esc toggles.     |
| `dialogue`           | NPC Dialogue        | StarterPlayerScripts   | Portrait + name plate + typewriter text + choice buttons.               |
| `quest-tracker`      | Quest Tracker       | StarterPlayerScripts   | Pinned right-side panel with title and checkboxed objectives.           |
| `notification-toast` | Notification Toasts | StarterPlayerScripts   | Corner toasts (success/info/warn/error) with auto-dismiss and slide-in. |
| `loading-screen`     | Loading Screen      | ReplicatedFirst        | Fullscreen loader with progress bar and rotating tip line.              |
| `daily-rewards`      | Daily Rewards       | StarterPlayerScripts   | 7-day login calendar with claim buttons and state colors.               |

## Theming

Every template reads the five-color palette (`primary`, `secondary`, `accent`,
`neutral`, `highlight`) from the provided `ThemePreset`. Because the plugin and
the Prompt Amplifier already pick a theme based on the user's prompt, the UI
auto-matches whatever world you're building — a medieval village gets warm
stone/gold UI, a neon cyberpunk build gets purple/cyan.

## Integration example

```ts
import { UI_KIT_CATALOG, generateUiKitLuau } from '@/lib/ui-kit'
import { THEME_PRESETS } from '@/lib/theme/theme-presets'
import type { StructuredCommand } from '@/lib/ai/structured-commands'

/** Emit structured commands that install every UI kit template for a theme. */
export function installAllKitUi(themeId: string): StructuredCommand[] {
  const theme = THEME_PRESETS[themeId]
  return UI_KIT_CATALOG.map((entry): StructuredCommand => ({
    type: 'create_script',
    name: `${entry.id}-ui`,
    scriptType: 'LocalScript',
    source: generateUiKitLuau(entry.id, theme) ?? '',
    parent: entry.parent,
  }))
}
```

## Design constraints

All 12 templates follow the same UI rules:

- UIPadding on every container (8-16px)
- UICorner on every panel (6-18px)
- UIStroke with accent color on every window edge
- UIGradient on hero elements for depth
- `TextScaled = true` on most text so it scales with viewport
- Mobile-friendly hit targets (32-60px minimum)
- `ResetOnSpawn = false` and `IgnoreGuiInset = true` on the root ScreenGui
- Fade/tween on open/close for polish

## Extending the kit

To add a new template:

1. Create `src/lib/ui-kit/<id>-template.ts` that exports a `xxxTemplate(theme)`
   factory returning the Luau string.
2. Add an entry to `UI_KIT_CATALOG` in `src/lib/ui-kit/index.ts`.
3. (Optional) Add a screenshot to this doc.

No other files need to change — the kit is strictly additive.
