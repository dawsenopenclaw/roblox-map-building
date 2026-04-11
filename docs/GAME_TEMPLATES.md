# Game Template Marketplace

Game templates are complete, playable Roblox experiences expressed as a bundle
of structured commands (for geometry) plus server scripts (for mechanics).
Where the UI kit covers "widgets", game templates cover "genres" — each
template is a production-ready starter game that the ForjeGames plugin can
install into a live place in under a minute.

All templates live under `src/lib/game-templates/`. Import them via the barrel:

```ts
import { GAME_TEMPLATES, loadTemplate } from '@/lib/game-templates'

const tycoon = loadTemplate('tycoon')
// { structuredCommands: [...], serverScripts: [...], monetization: {...}, ... }
```

The HTTP surface is:

| Method | Path                        | Purpose                                      |
| ------ | --------------------------- | -------------------------------------------- |
| GET    | `/api/templates/list`       | Public catalog (no auth)                     |
| GET    | `/api/templates/load?id=…`  | Full template JSON for previewing            |
| POST   | `/api/templates/load`       | Queue template into a live plugin session    |

Installing a template costs **100 credits** (cheap, because templates are
pre-authored and don't run any LLM inference).

## Catalog

### 1. Classic Tycoon (`tycoon`)
A complete progression tycoon: spawn pad, five buy pads, a dropper platform,
a conveyor, a sell pad, and datastore-backed leaderstats.

- **Parts**: 11
- **Scripts**: 5 (Currency, BuyPads, Dropper, Conveyor, SellPad)
- **UI**: HUD, Shop, Daily Rewards, Notification Toasts
- **Monetization**: Dev products (1k/10k/100k cash) + 2x Cash gamepass + VIP Dropper

### 2. 10-Stage Obby (`obby`)
A classic parkour course with lava pits, floating hop blocks, narrow beams,
saving checkpoints and a win zone — 10 stages total, datastore progress.

- **Parts**: ~45 (generated programmatically)
- **Scripts**: 3 (Checkpoints, LavaBricks, WinZone)
- **UI**: HUD, Leaderboard, Notification Toasts
- **Monetization**: Skip Stage dev product + VIP and Low-Gravity gamepasses

### 3. Clicker Simulator (`simulator`)
Tap-to-earn orb with a floating pet companion, rebirth portal, and scaling
reward multipliers based on rebirth count.

- **Parts**: 5
- **Scripts**: 3 (SimServer, SimClient, Pets)
- **UI**: HUD, Shop, Daily Rewards, Toasts
- **Monetization**: Coin bundles + 2x Taps and Auto-Tap gamepasses

### 4. Tower Defense (`tower-defense`)
Enemy path, wave spawner, tower placement zones (click to build), kill rewards
and a lives counter. Drop-in wave difficulty curve.

- **Parts**: 9
- **Scripts**: 2 (TDServer, ZoneClicks)
- **UI**: HUD, Shop, Toasts, Pause Menu
- **Monetization**: Gold bundles + Starter Pack gamepass

### 5. Combat Arena (`combat-arena`)
Walled PvP arena with red/blue team spawns, cover blocks, a respawning weapon
pickup, and kill-streak tracking.

- **Parts**: 11
- **Scripts**: 2 (ArenaCombat, WeaponPickup)
- **UI**: HUD, Leaderboard, Toasts, Pause Menu
- **Monetization**: Revive dev product + Golden Sword gamepass

### 6. Checkpoint Racing (`racing`)
Loop track with three checkpoints, a start/finish line, a vehicle spawner pad
(spawns a kart on click), and a best-lap leaderboard saved across sessions.

- **Parts**: 10
- **Scripts**: 2 (RaceServer, VehicleSpawner)
- **UI**: HUD, Leaderboard, Toasts, Main Menu
- **Monetization**: Turbo Boost + Fast Kart

### 7. Open-World Survival (`survival`)
Hunger and thirst meters drain over time, water pond and berry bush restore
them, a night-time monster spawner wanders toward the nearest player, full
24-hour day/night cycle runs at real-time.

- **Parts**: 8
- **Scripts**: 3 (SurvivalStats, DayNight, MonsterSpawner)
- **UI**: HUD, Inventory, Toasts, Quest Tracker
- **Monetization**: Food Pack + Infinite Water gamepass

### 8. Village Roleplay (`roleplay`)
Town square with a central fountain, three houses, three job NPCs
(Farmer / Miner / Merchant), housing claim pads, passive salary loop, and NPC
dialogue via the UI kit's dialogue template.

- **Parts**: 11
- **Scripts**: 3 (Jobs, Housing, NPCChat)
- **UI**: HUD, Dialogue, Inventory, Shop, Quest Tracker, Toasts
- **Monetization**: Starter money + Landlord gamepass

## How it's executed

When a user clicks "Use this template" in `TemplateGalleryV2`, the client:

1. Calls `POST /api/templates/load` with `{ id, sessionId }`
2. The route resolves the template, appends each server script as an
   additional `create_script` command, and queues the whole bundle via
   `queueCommand(sessionId, { type: 'structured_commands', data: ... })`.
3. The Studio plugin polls `/api/studio/sync`, picks up the command, and
   executes the structured-commands bundle in a single undo group.

Templates never run LLM inference — they are 100% deterministic.

## Extending

To add a new template:

1. Create `src/lib/game-templates/<id>-template.ts` that exports a `GameTemplate`.
2. Register it in `src/lib/game-templates/index.ts` (import + add to `GAME_TEMPLATES`).
3. It will automatically appear in `/api/templates/list` and `TemplateGalleryV2`.

The `countLuauLines(template)` helper is available for quality reporting.
