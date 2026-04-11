/**
 * ForjeGames UI Kit — production-ready in-Studio ScreenGui templates.
 *
 * Each exported factory takes a ThemePreset and returns a Luau source string
 * that creates the corresponding UI. Use these from the AI prompt enhancer
 * or directly from the Creator Store plugin to drop a styled, working UI
 * into the player's place in a single action.
 */

import type { ThemePreset } from '@/lib/theme/theme-presets'

import { hudTemplate } from './hud-template'
import { shopTemplate } from './shop-template'
import { inventoryTemplate } from './inventory-template'
import { settingsTemplate } from './settings-template'
import { leaderboardTemplate } from './leaderboard-template'
import { mainMenuTemplate } from './main-menu-template'
import { pauseMenuTemplate } from './pause-menu-template'
import { dialogueTemplate } from './dialogue-template'
import { questTrackerTemplate } from './quest-tracker-template'
import { notificationToastTemplate } from './notification-toast-template'
import { loadingScreenTemplate } from './loading-screen-template'
import { dailyRewardsTemplate } from './daily-rewards-template'

export {
  hudTemplate,
  shopTemplate,
  inventoryTemplate,
  settingsTemplate,
  leaderboardTemplate,
  mainMenuTemplate,
  pauseMenuTemplate,
  dialogueTemplate,
  questTrackerTemplate,
  notificationToastTemplate,
  loadingScreenTemplate,
  dailyRewardsTemplate,
}

export type UiKitTemplateId =
  | 'hud'
  | 'shop'
  | 'inventory'
  | 'settings'
  | 'leaderboard'
  | 'main-menu'
  | 'pause-menu'
  | 'dialogue'
  | 'quest-tracker'
  | 'notification-toast'
  | 'loading-screen'
  | 'daily-rewards'

export interface UiKitEntry {
  id: UiKitTemplateId
  name: string
  description: string
  generator: (theme: ThemePreset) => string
  /** Suggested parent service for the generated LocalScript */
  parent: 'StarterPlayerScripts' | 'ReplicatedFirst' | 'StarterGui'
  tags: string[]
}

export const UI_KIT_CATALOG: UiKitEntry[] = [
  {
    id: 'hud',
    name: 'HUD',
    description: 'In-game HUD with health bar, coin counter, level badge, minimap.',
    generator: hudTemplate,
    parent: 'StarterPlayerScripts',
    tags: ['combat', 'survival', 'rpg'],
  },
  {
    id: 'shop',
    name: 'Shop',
    description: 'Grid-of-items shop window with buy button and currency header.',
    generator: shopTemplate,
    parent: 'StarterPlayerScripts',
    tags: ['economy', 'rpg', 'simulator'],
  },
  {
    id: 'inventory',
    name: 'Inventory',
    description: '6x5 slot grid with drag affordance, tooltips, item counts.',
    generator: inventoryTemplate,
    parent: 'StarterPlayerScripts',
    tags: ['rpg', 'survival', 'sandbox'],
  },
  {
    id: 'settings',
    name: 'Settings',
    description: 'Sliders for music/SFX/master volume and graphics quality.',
    generator: settingsTemplate,
    parent: 'StarterPlayerScripts',
    tags: ['core', 'accessibility'],
  },
  {
    id: 'leaderboard',
    name: 'Leaderboard',
    description: 'Tabbed leaderboard with daily / weekly / all-time rankings.',
    generator: leaderboardTemplate,
    parent: 'StarterPlayerScripts',
    tags: ['social', 'competitive'],
  },
  {
    id: 'main-menu',
    name: 'Main Menu',
    description: 'Fullscreen title screen with Play / Settings / Credits / Quit.',
    generator: mainMenuTemplate,
    parent: 'StarterPlayerScripts',
    tags: ['core', 'presentation'],
  },
  {
    id: 'pause-menu',
    name: 'Pause Menu',
    description: 'Blur overlay with Resume / Settings / Main Menu / Exit.',
    generator: pauseMenuTemplate,
    parent: 'StarterPlayerScripts',
    tags: ['core'],
  },
  {
    id: 'dialogue',
    name: 'Dialogue',
    description: 'NPC dialogue box with portrait, name plate, typewriter text, choices.',
    generator: dialogueTemplate,
    parent: 'StarterPlayerScripts',
    tags: ['rpg', 'story'],
  },
  {
    id: 'quest-tracker',
    name: 'Quest Tracker',
    description: 'Pinned right-side panel with quest name + checkboxed objectives.',
    generator: questTrackerTemplate,
    parent: 'StarterPlayerScripts',
    tags: ['rpg', 'quest'],
  },
  {
    id: 'notification-toast',
    name: 'Notification Toasts',
    description: 'Corner toast notifications (success/info/warn/error) with auto-dismiss.',
    generator: notificationToastTemplate,
    parent: 'StarterPlayerScripts',
    tags: ['core', 'feedback'],
  },
  {
    id: 'loading-screen',
    name: 'Loading Screen',
    description: 'Fullscreen loader with progress bar and rotating tips.',
    generator: loadingScreenTemplate,
    parent: 'ReplicatedFirst',
    tags: ['core', 'polish'],
  },
  {
    id: 'daily-rewards',
    name: 'Daily Rewards',
    description: '7-day login reward calendar with claim buttons and states.',
    generator: dailyRewardsTemplate,
    parent: 'StarterPlayerScripts',
    tags: ['retention', 'economy'],
  },
]

export function getUiKitEntry(id: UiKitTemplateId): UiKitEntry | undefined {
  return UI_KIT_CATALOG.find((e) => e.id === id)
}

export function generateUiKitLuau(
  id: UiKitTemplateId,
  theme: ThemePreset,
): string | null {
  const entry = getUiKitEntry(id)
  if (!entry) return null
  return entry.generator(theme)
}
