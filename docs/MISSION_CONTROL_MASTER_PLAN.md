# FORJEGAMES MISSION CONTROL — MASTER BUILD PLAN
## 10 Systems + Bonus Discoveries | Ship Order: 1→10+
### Created: Apr 25, 2026 | Mission Controller: Claude Opus 4.6

> Each section is a COMPLETE prompt you can paste into a new Claude Code window.
> Each window works independently. Ship them in parallel or sequential.
> Every prompt references the exact files, functions, and patterns to use.

---

## ═══════════════════════════════════════════════════════════════
## SYSTEM 1: UI/GUI GENERATOR (SHIP FIRST — HIGHEST IMPACT)
## ═══════════════════════════════════════════════════════════════

### WHY FIRST
Every game needs UI. Shops, HUD, menus, inventory — without these, games feel unfinished. The staged pipeline already generates UI SCRIPTS but not the VISUAL layout. Users want to see beautiful ScreenGuis appear in Studio.

### THE PROMPT (paste into new Claude Code window)

```
You are a senior full-stack engineer building ForjeGames (forjegames.com) — an AI-powered Roblox game builder. Project at C:\dev\roblox-map-building.

Call me Vyren. Execute everything. Don't ask permission.

## RULES
- Commit after each major feature. Stage files by name, never git add .
- Type check: npx tsc -p tsconfig.spotcheck.json 2>&1 | head -20
- Never use SmoothPlastic. Never corporate words.
- Real plugin at packages/studio-plugin/ (NOT src/plugin/)
- Max 2 parallel agents. Keep bash output short.

## TASK: Build a Complete UI/GUI Generation System

The AI chat route at src/app/api/ai/chat/route.ts already generates UI scripts via the staged pipeline (system 5: UI/HUD). But the generated code creates basic ScreenGuis. We need PREMIUM UI generation that matches top Roblox games.

### STEP 1: Create src/lib/ai/gui-templates.ts (~800-1000 lines)

Pre-built ScreenGui templates that the AI can customize. Each template is a function that returns complete Luau code creating a full GUI with:
- Dark theme (bg=15,18,30 card=25,28,45 gold=212,175,55)
- UICorner (8-12px), UIStroke (1-2px), UIListLayout/UIGridLayout
- TweenService open/close animations on EVERY panel
- Responsive UDim2 scale sizing
- ScrollingFrame for long content
- Close buttons with hover effects

Templates to create:
1. shopGui(items, currency, columns) — grid of item cards with buy buttons, balance display, category tabs
2. inventoryGui(slots, columns) — backpack grid, equip/drop buttons, item tooltips
3. healthBarGui(maxHP, showNumbers) — animated health bar + name tag
4. hudGui(stats) — top bar with currency, level, XP bar, settings gear
5. settingsGui(options) — toggle switches, sliders, keybind display
6. questLogGui(quests) — quest list with progress bars, accept/complete buttons
7. leaderboardGui(columns) — OrderedDataStore leaderboard with refresh
8. dialogGui(npcName, dialogTree) — NPC conversation with choices
9. notificationGui() — toast notifications that slide in/out
10. loadingScreenGui(gameName, tips) — loading bar with tips rotation
11. tradeGui() — two-player trade window with confirm/cancel
12. petInventoryGui(pets) — egg hatching animation, pet equip grid
13. rebirthGui(cost, multiplier) — confirmation dialog with prestige info
14. dailyRewardGui(day, rewards) — calendar grid with claim button
15. miniMapGui(zones) — corner minimap with player dot

Each function signature: (params) => string (returns complete Luau code)
Each generated GUI MUST include:
- ChangeHistoryService wrapping
- Parent to StarterGui (or player.PlayerGui)
- ResetOnSpawn = false
- All animations via TweenService
- Sound feedback on button clicks (optional)

### STEP 2: Wire into src/app/api/ai/chat/route.ts

When the AI detects UI/GUI intent (user says "make a shop gui", "add inventory", "health bar", etc.):
1. Match to the right template
2. Call the template function with smart defaults
3. Send to Studio via sendCodeToStudio

Detection keywords per template:
- shop/store/buy/purchase → shopGui
- inventory/backpack/items → inventoryGui
- health/hp/damage → healthBarGui
- hud/display/stats → hudGui
- settings/options/controls → settingsGui
- quest/mission/objective → questLogGui
- leaderboard/ranking/top → leaderboardGui
- dialog/npc/talk/conversation → dialogGui
- notification/toast/alert → notificationGui
- loading/splash → loadingScreenGui
- trade/exchange → tradeGui
- pet/egg/hatch → petInventoryGui
- rebirth/prestige/reset → rebirthGui
- daily/reward/login → dailyRewardGui
- minimap/map → miniMapGui

Add to SCRIPT_INTENTS set: 'gui', 'shop_gui', 'hud', 'menu'

### STEP 3: Create src/components/editor/GuiPreview.tsx

A React component that shows a PREVIEW of the GUI in the editor before sending to Studio. Render the GUI layout using HTML/CSS that mimics the Roblox ScreenGui appearance. This lets users see what they're getting before it's built.

### STEP 4: Add GUI knowledge to src/lib/ai/roblox-knowledge.ts

Add 3 new entries:
- ScreenGui Patterns (proper hierarchy, ResetOnSpawn, ZIndexBehavior)
- TweenService UI Animations (open/close/hover patterns)
- ScrollingFrame (proper setup with UIListLayout, AutomaticCanvasSize)

### STEP 5: Test + Deploy

After building:
- npx tsc -p tsconfig.spotcheck.json
- Test: "make a shop gui with 6 items"
- Test: "add a health bar"
- Test: "create an inventory with 20 slots"
- git add + commit + push
- npx vercel deploy --prod --yes

### EXISTING CODE TO REFERENCE
- src/lib/ai/luau-templates.ts — existing template pattern (function returns Luau string)
- src/app/api/ai/chat/route.ts line 4316 — scriptInstruction for UI generation
- src/lib/ai/staged-pipeline.ts — system 5 (UI/HUD) prompt
- The existing script generation prompt at line 4366 already has UI styling rules (dark theme, UICorner, TweenService)

### QUALITY BAR
Every generated GUI must look like it belongs in Pet Simulator X or Adopt Me — not a dev placeholder. That means:
- Gradient backgrounds (UIGradient)
- Smooth animations (0.3s TweenService)
- Gold accent color (#D4AF37)
- Hover states on every button
- Proper padding (UIPadding 8-16px)
- Icons (emoji or text symbols as placeholders)
```

---

## ═══════════════════════════════════════════════════════════════
## SYSTEM 2: PERSISTENT PROJECTS
## ═══════════════════════════════════════════════════════════════

### WHY
Users start building, close the tab, come back — and lose everything. They should be able to continue where they left off. The AI should remember their game, their preferences, their progress.

### THE PROMPT

```
You are a senior full-stack engineer building ForjeGames (forjegames.com). Project at C:\dev\roblox-map-building.

Call me Vyren. Execute everything. Don't ask permission.

## RULES
- Same rules as System 1 above (commit, type check, no SmoothPlastic, etc.)

## TASK: Build Persistent Projects System

Users should be able to:
1. Name their project ("My Tycoon Game")
2. Close the browser, come back days later, continue building
3. See a history of what they've built so far
4. The AI remembers context (what zone they're working on, what systems exist)

### STEP 1: Database Schema (prisma/schema.prisma)

Add these models:

model Project {
  id          String   @id @default(cuid())
  userId      String
  name        String
  description String?  @db.Text
  gameType    String?  // tycoon, rpg, obby, simulator, custom
  style       String?  // vibrant, fantasy, neon, etc.
  status      String   @default("planning") // planning, building, testing, published
  
  // Game design document (from game-dev-planner)
  designDoc   Json?    // Full GameDesignDoc
  
  // Build state
  zonesBuilt     Int      @default(0)
  totalParts     Int      @default(0)
  systemsBuilt   String[] // ["economy", "combat", "ui"]
  
  // AI context (what the AI knows about this project)
  aiContext      Json?    // Accumulated context for the AI
  lastPrompt     String?  @db.Text
  
  // Conversation history
  messages       ProjectMessage[]
  
  // Metadata
  studioSessionId String?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  
  @@index([userId])
  @@index([updatedAt])
}

model ProjectMessage {
  id        String   @id @default(cuid())
  projectId String
  role      String   // user, assistant, system
  content   String   @db.Text
  metadata  Json?    // intent, model, hasCode, score
  createdAt DateTime @default(now())
  
  project   Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  
  @@index([projectId, createdAt])
}

### STEP 2: API Routes

Create:
- POST /api/projects — create new project
- GET /api/projects — list user's projects
- GET /api/projects/[id] — get project with messages
- PATCH /api/projects/[id] — update project
- DELETE /api/projects/[id] — delete project
- POST /api/projects/[id]/continue — resume building with AI context

### STEP 3: Project Selector UI

Create src/components/editor/ProjectSelector.tsx:
- Shows list of user's projects with last-modified date
- "New Project" button → starts planning flow
- "Continue" button → loads project context into chat
- Project cards show: name, game type, status, part count, zones built

### STEP 4: Wire into Chat

When a project is active:
- Every message saves to ProjectMessage
- AI gets project context injected: "You are continuing work on [Project Name], a [gameType] game. So far you've built [zonesBuilt] zones with [totalParts] parts. Systems completed: [systemsBuilt]. The user's design doc: [designDoc summary]"
- This context goes into the system prompt so the AI knows EVERYTHING about the project

### STEP 5: Auto-Save

After every successful build:
- Update project.zonesBuilt, totalParts, systemsBuilt
- Append to aiContext with what was just built
- Save the conversation

### EXISTING CODE TO REFERENCE
- src/app/(app)/editor/hooks/useChat.ts — existing chat state management
- src/lib/session-persistence.ts — existing cloud session CRUD (reuse patterns)
- src/app/(app)/editor/panels/ProjectsSidebarPanel.tsx — existing project UI (might need updating)
- prisma/schema.prisma — existing schema patterns

### QUALITY BAR
- Project list loads in <500ms
- AI context injection adds <200ms to response time
- Conversation history persists indefinitely
- Projects survive account changes (tied to userId)
```

---

## ═══════════════════════════════════════════════════════════════
## SYSTEM 3: IMAGE-TO-BUILD
## ═══════════════════════════════════════════════════════════════

### THE PROMPT

```
You are a senior full-stack engineer building ForjeGames. Project at C:\dev\roblox-map-building.

Call me Vyren. Execute everything.

## TASK: Build Image-to-Build System

Users upload a screenshot/image of a Roblox game or real building → AI analyzes it → generates parts that recreate the structure.

### STEP 1: Image Analysis Pipeline

Create src/lib/ai/image-to-build.ts:

1. Accept image as base64 or URL
2. Send to Gemini Vision (gemini-2.5-flash supports image input):
   - "Analyze this image of a Roblox build. Describe every visible structure: buildings (size, material, color), terrain, trees, paths, decorations. Output a JSON array of parts with name, size, position, material, color."
3. Parse the AI's response into BuildPart[] (from mega-builder.ts)
4. Run through anti-ugly check
5. Convert to Luau via partsToLuau
6. Send to Studio

### STEP 2: Chat Integration

When user uploads an image in chat (already supported via imageFile state in useChat.ts):
- Detect if the image shows a Roblox build or real architecture
- Route to image-to-build pipeline
- Show "Analyzing image..." status
- Generate and deploy the build

### STEP 3: API Route

Create POST /api/ai/image-to-build:
- Accept multipart form data (image file)
- Run through Gemini Vision
- Return structured parts + Luau code

### EXISTING CODE
- src/app/(app)/editor/hooks/useChat.ts — imageFile state already exists
- src/lib/ai/provider.ts — callGemini already works, just need to add image support
- Gemini Vision API: pass image as inline_data with mime_type in contents.parts[]
- src/lib/ai/mega-builder.ts — BuildPart type + partsToLuau conversion

### KEY INSIGHT
Gemini 2.5 Flash supports multimodal input. The API call is:
{
  contents: [{
    parts: [
      { inline_data: { mime_type: "image/jpeg", data: base64String } },
      { text: "Analyze this Roblox build and output parts..." }
    ]
  }]
}
```

---

## ═══════════════════════════════════════════════════════════════
## SYSTEM 4: PLAYTEST + AUTO-FIX
## ═══════════════════════════════════════════════════════════════

### THE PROMPT

```
You are a senior full-stack engineer building ForjeGames. Project at C:\dev\roblox-map-building.

Call me Vyren. Execute everything.

## TASK: Build Automated Playtest System

When the AI generates game scripts, automatically test them and fix errors.

### WHAT EXISTS
- packages/studio-plugin/Sync.lua already hooks LogService (console buffer)
- Console logs push to server via /api/studio/update (output_log event)
- src/lib/ai/error-recovery.ts exists with parseConsoleError + buildFixPrompt
- src/app/api/ai/chat/route.ts lines 5006-5024 already have a self-healing loop:
  - Wait 3s after deployment
  - checkConsoleForErrors(sessionId)
  - attemptErrorRecovery(sessionId, code, errors, prompt)
  - Max 3 retries
  - Appends fix notes to conversation

### WHAT'S NEEDED
1. The playtest system needs to be more robust:
   - Instead of just checking console errors, also verify EXPECTED behavior
   - After building a shop system: verify RemoteEvents were created
   - After building a GUI: verify ScreenGui exists in StarterGui
   - After building terrain: verify terrain was modified

2. Create src/lib/ai/playtest-verifier.ts:
   - defineExpectation(type, check) — what should exist after the build
   - verifyExpectations(sessionId) — check via get_game_tree plugin command
   - generateFixForExpectation(failed) — tell AI what's missing

3. Wire into the post-build flow:
   - After sendCodeToStudio succeeds
   - Wait 3s for execution
   - Run checkConsoleForErrors (errors)
   - Run verifyExpectations (missing features)
   - If issues: auto-fix loop (existing attemptErrorRecovery)

4. UI: Show playtest results in chat
   - "✅ Economy system loaded"
   - "✅ Shop GUI created"  
   - "❌ DataStore error on line 42 — auto-fixing..."
   - "✅ Fixed! DataStore now uses pcall"

### EXISTING CODE
- src/app/api/ai/chat/route.ts lines 1400-1490 — checkConsoleForErrors + attemptErrorRecovery
- packages/studio-plugin/Sync.lua — get_game_tree command returns DataModel hierarchy
- src/app/api/studio/console/route.ts — Redis-backed console log storage
```

---

## ═══════════════════════════════════════════════════════════════
## SYSTEM 5: MESHPART LIBRARY
## ═══════════════════════════════════════════════════════════════

### THE PROMPT

```
You are a senior full-stack engineer building ForjeGames. Project at C:\dev\roblox-map-building.

Call me Vyren. Execute everything.

## TASK: Build a MeshPart Asset Library

Pre-built 3D models that users can place via the AI. These are Roblox Toolbox assets inserted via InsertService.

### STEP 1: Curate Asset Library

Create src/lib/ai/asset-library.ts with a curated list of FREE Roblox Toolbox assets:

interface RobloxAsset {
  id: number         // Roblox asset ID
  name: string
  category: string   // tree, vehicle, furniture, decoration, character, weapon, building
  keywords: string[] // for AI matching
  scale: number      // default scale
  description: string
}

Categories:
- Trees & Nature (10+ assets)
- Vehicles (5+ assets)
- Furniture (10+ assets)
- Buildings (5+ assets)
- Characters/NPCs (5+ assets)
- Weapons (5+ assets)
- Decorations (10+ assets)
- Effects (5+ assets)

### STEP 2: Search Roblox Toolbox API

The Roblox search API: https://search.roblox.com/catalog/json?Category=6&Keyword=tree
Parse results to find free models with good ratings.

### STEP 3: Insert via Plugin

The plugin already has AssetManager.lua with InsertService:LoadAsset().
Create a new command: insert_asset { assetId: number, position: [x,y,z], scale: number }

### STEP 4: AI Integration

When user says "add a tree" or "place a car", match to the asset library and insert the 3D model instead of building from Parts. This gives MUCH better visual quality for organic shapes.

### EXISTING CODE
- packages/studio-plugin/AssetManager.lua — InsertService.LoadAsset already implemented
- src/app/api/ai/chat/route.ts — insert_asset command type exists
- The plugin already handles insert_asset in applyChanges (Sync.lua line 2413)
```

---

## ═══════════════════════════════════════════════════════════════
## SYSTEM 6: MARKETPLACE
## ═══════════════════════════════════════════════════════════════

### THE PROMPT

```
You are a senior full-stack engineer building ForjeGames. Project at C:\dev\roblox-map-building.

Call me Vyren. Execute everything.

## TASK: Build a Creator Marketplace

Users can save, share, and sell their AI-generated builds.

### Database Schema

model MarketplaceItem {
  id          String   @id @default(cuid())
  userId      String
  title       String
  description String   @db.Text
  category    String   // building, game-system, gui, terrain, full-game
  tags        String[]
  
  // The build
  luauCode    String   @db.Text
  partCount   Int
  qualityScore Int
  thumbnail   String?  // Screenshot URL
  
  // Pricing
  price       Int      @default(0) // 0 = free, >0 = token cost
  downloads   Int      @default(0)
  likes       Int      @default(0)
  
  // Status
  status      String   @default("published") // draft, published, featured, removed
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@index([category])
  @@index([downloads])
  @@index([likes])
}

### Pages
- /marketplace — browse/search items
- /marketplace/[id] — item detail with preview + install button
- /marketplace/publish — upload your build

### API Routes
- GET /api/marketplace — list items (filter by category, sort by popular/new)
- GET /api/marketplace/[id] — get item detail
- POST /api/marketplace — publish item
- POST /api/marketplace/[id]/install — install to user's Studio
- POST /api/marketplace/[id]/like — like/unlike

### EXISTING CODE
- src/app/(app)/marketplace/ — marketplace pages already exist (may need updating)
- src/app/api/marketplace/ — some API routes may exist
```

---

## ═══════════════════════════════════════════════════════════════
## SYSTEM 7: TEAM COLLABORATION
## ═══════════════════════════════════════════════════════════════

### THE PROMPT

```
You are a senior full-stack engineer building ForjeGames. Project at C:\dev\roblox-map-building.

Call me Vyren. Execute everything.

## TASK: Build Team Collaboration

Multiple users can work on the same project simultaneously.

### Core Architecture
- Teams linked to Projects (from System 2)
- Real-time presence (who's online, what they're working on)
- Shared chat history
- Role-based permissions (owner, editor, viewer)

### Database
model Team {
  id        String   @id @default(cuid())
  name      String
  ownerId   String
  members   TeamMember[]
  projects  Project[]
  createdAt DateTime @default(now())
}

model TeamMember {
  id     String @id @default(cuid())
  teamId String
  userId String
  role   String @default("editor") // owner, editor, viewer
  team   Team   @relation(fields: [teamId], references: [id])
  @@unique([teamId, userId])
}

### Features
- Invite via link or username
- See teammates' recent builds in project timeline
- Lock zones to prevent conflicts (only one person builds a zone at a time)
- Team chat channel

### EXISTING CODE
- src/app/(app)/team/ — team pages exist
- src/app/api/team/ — team API routes may exist
```

---

## ═══════════════════════════════════════════════════════════════
## SYSTEM 8: MOBILE EDITOR
## ═══════════════════════════════════════════════════════════════

### THE PROMPT

```
You are a senior full-stack engineer building ForjeGames. Project at C:\dev\roblox-map-building.

Call me Vyren. Execute everything.

## TASK: Make the Editor Fully Mobile-Responsive

Lemonade.gg claims "Code from your phone." We need to match and beat this.

### What Needs Work
- Chat panel: full-screen on mobile, swipe to dismiss
- Build progress: compact view
- Console panel: bottom sheet
- Mode selector: horizontal scroll instead of dropdown
- Voice input: prominent microphone button (already exists)
- Touch-friendly: larger tap targets (44px minimum)
- No horizontal scroll anywhere
- Keyboard doesn't push content off-screen

### EXISTING CODE
- src/app/(app)/editor/NewEditorClient.tsx — already has isMobile detection + MobileBottomSheet
- src/hooks/useMediaQuery.ts — useIsMobile() hook exists
- src/components/editor/MobileBottomSheet.tsx — bottom sheet component exists
- The editor already has mobile layout handling but it needs polish

### KEY CHANGES
1. Mobile chat: full-screen with top-bar showing project name + back button
2. Mobile build status: inline in chat, not separate panel
3. Mobile console: bottom sheet that slides up
4. Mobile settings: full-screen overlay
5. Voice-to-build: make the mic button BIG and prominent on mobile
```

---

## ═══════════════════════════════════════════════════════════════
## SYSTEM 9: VERSION HISTORY + ROLLBACK
## ═══════════════════════════════════════════════════════════════

### THE PROMPT

```
You are a senior full-stack engineer building ForjeGames. Project at C:\dev\roblox-map-building.

Call me Vyren. Execute everything.

## TASK: Build Version History with Rollback

Every AI action creates a snapshot. Users can rollback to any point.

### EXISTING CODE
- src/components/editor/CheckpointPanel.tsx — checkpoint UI exists (385 lines)
- src/components/editor/CheckpointTimeline.tsx — timeline UI exists
- src/lib/checkpoints.ts — checkpoint logic may exist
- Plugin: ChangeHistoryService already wraps every build in a recording

### What's Needed
1. Database: store snapshots (code + game tree) after each AI action
2. API: GET /api/scripts/history, POST /api/scripts/rollback
3. UI: timeline showing each AI action with preview
4. Plugin: SET_WAYPOINT command to create named checkpoints
5. Diff view: compare any two versions

### Database
model BuildVersion {
  id          String   @id @default(cuid())
  projectId   String?
  sessionId   String
  version     Int
  description String
  luauCode    String   @db.Text
  partCount   Int
  prompt      String   @db.Text
  createdAt   DateTime @default(now())
  @@index([sessionId, version])
}
```

---

## ═══════════════════════════════════════════════════════════════
## SYSTEM 10: DISCORD BOT BUILDER
## ═══════════════════════════════════════════════════════════════

### THE PROMPT

```
You are a senior full-stack engineer building ForjeGames. Project at C:\dev\roblox-map-building.

Call me Vyren. Execute everything.

## TASK: Build From Discord

Users should be able to build games by sending commands in Discord.

### EXISTING CODE
- scripts/eli-discord-responder.ts — ELI bot already exists and responds in Discord
- Guild ID: 1495863063423746068
- Bot token in DISCORD_BOT_TOKEN env var

### What's Needed
1. New Discord slash commands:
   - /build [prompt] — generate a build and show preview
   - /plan [prompt] — start the planning flow
   - /status — check current build progress
   - /connect [code] — link Discord to Studio session

2. The bot sends build requests to the same /api/ai/chat endpoint
3. Results are posted as embeds with:
   - Part count, quality score
   - Code block (first 500 chars)
   - "Send to Studio" button (if connected)

### Architecture
- Discord bot receives /build command
- Calls ForjeGames API with the prompt
- Streams progress updates as Discord message edits
- Final result posted as embed with code attachment
```

---

## ═══════════════════════════════════════════════════════════════
## BONUS SYSTEMS (Discovered During Analysis)
## ═══════════════════════════════════════════════════════════════

### SYSTEM 11: ROBLOX OPEN CLOUD MODE (like Rebirth)
Execute Luau remotely via Roblox's Open Cloud API — no plugin needed.
Rebirth already does this. Would eliminate the #1 friction point (plugin install).

### SYSTEM 12: AI CODE REVIEW
Before deploying scripts, AI reviews for:
- Security vulnerabilities (RemoteEvent exploit vectors)
- Performance issues (memory leaks, unbounded loops)
- Best practices (pcall on DataStore, task.wait not wait)
Already partially exists in src/lib/ai/build-validator.ts

### SYSTEM 13: TEMPLATE MARKETPLACE
Pre-built game templates users can fork and customize:
- "Tycoon Starter Kit" (complete working tycoon, 3000 parts)
- "Simulator Base" (collecting + selling + zones)
- "RPG Framework" (stats, combat, quests, inventory)
Each template is a one-click install that creates a full working game.

### SYSTEM 14: ANALYTICS DASHBOARD
Show users how their game performs:
- Part count over time
- Script count
- Build quality scores over time
- Most-used features
- Comparison to average ForjeGames builds

### SYSTEM 15: AI VOICE ASSISTANT
Users talk to Forje by voice, Forje talks back:
- "Hey Forje, add a shop to the east side of the map"
- "Forje, make the roof red"
- Already has VoiceInputButton.tsx and VoiceOutputToggle.tsx
- Needs: speech-to-text → chat → text-to-speech pipeline

---

## SHIP ORDER

| Priority | System | Impact | Effort | Status |
|----------|--------|--------|--------|--------|
| 1 | UI/GUI Generator | HUGE | 2-3 days | READY TO SHIP |
| 2 | Persistent Projects | HUGE | 2-3 days | READY TO SHIP |
| 3 | Image-to-Build | MASSIVE | 1-2 days | READY TO SHIP |
| 4 | Playtest + Auto-Fix | HIGH | 1-2 days | READY TO SHIP |
| 5 | MeshPart Library | HIGH | 1 day | READY TO SHIP |
| 6 | Marketplace | MEDIUM | 2-3 days | READY TO SHIP |
| 7 | Team Collaboration | MEDIUM | 3-4 days | READY TO SHIP |
| 8 | Mobile Editor | MEDIUM | 1-2 days | READY TO SHIP |
| 9 | Version History | MEDIUM | 1-2 days | READY TO SHIP |
| 10 | Discord Bot | MEDIUM | 1 day | READY TO SHIP |
| 11 | Open Cloud Mode | HIGH | 2-3 days | BONUS |
| 12 | AI Code Review | LOW | 1 day | BONUS |
| 13 | Template Marketplace | HIGH | 2-3 days | BONUS |
| 14 | Analytics Dashboard | LOW | 1-2 days | BONUS |
| 15 | AI Voice Assistant | MEDIUM | 1-2 days | BONUS |

## HOW TO USE THIS DOCUMENT

1. Open a new Claude Code window
2. Copy the PROMPT section for the system you want to build
3. Paste it and let Claude execute
4. Each system is independent — ship in parallel for speed
5. Systems 1-5 can ALL run in parallel (no dependencies)
6. Systems 6-10 can run after 1-2 are done (some dependencies)

## CRASH PREVENTION
- Max 2 parallel agents per window
- Keep bash output short (| head -20)
- Don't re-read files you just wrote
- Use tsconfig.spotcheck.json not full tsc --noEmit
- Stage files by name, never git add .
- Save session handoff to memory every 30 min
