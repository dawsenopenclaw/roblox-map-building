# Roadmap: RobloxForge

## Overview

RobloxForge ships in 8 phases that follow a strict dependency chain: infrastructure before logic, logic before interfaces, interfaces before ecosystem features. Phase 1 stands up the platform skeleton. Phase 2 makes it legally operable. Phase 3 delivers the core AI magic. Phase 4 wraps it in a usable web product. Phase 5 extends it into Roblox Studio. Phases 6-8 layer on the creator economy, analysis tools, team features, and growth systems that turn the tool into a platform.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Foundation** - Deploy the platform skeleton: Next.js + Hono + PostgreSQL + Redis + auth + billing + CI/CD + monitoring + security
- [ ] **Phase 2: Legal & Compliance** - Make the platform legally operable: ToS, Privacy Policy, COPPA flow, DMCA, SCA, geo-blocking, vendor DPAs
- [ ] **Phase 3: AI Engine** - Ship the core magic: voice-to-game, image-to-map, multi-model pipeline, circuit breakers, caching, cost estimation
- [ ] **Phase 4: Web Platform** - Build the user-facing product: landing page, dashboard, AI interfaces, pricing, billing portal, settings, error handling
- [ ] **Phase 5: MCP Servers + Studio Plugin** - Extend into Roblox Studio: terrain-forge, city-architect, asset-alchemist MCPs + DockWidget plugin with sync
- [ ] **Phase 6: Marketplace + Gamification** - Launch creator economy: template marketplace with Stripe Connect payouts + XP/achievement/streak system
- [ ] **Phase 7: Game DNA + Team Collaboration** - Add analysis and collaboration: DNA scanner with radar charts + real-time team workspaces with Yjs CRDT
- [ ] **Phase 8: API System + Growth** - Grow the platform: API keys + SDKs + webhooks + referral + email system + notification system + creator earnings

## Phase Details

### Phase 1: Foundation
**Goal**: The platform is deployed, authenticated users can sign up and pay, and all infrastructure is observable and secure
**Depends on**: Nothing (first phase)
**Requirements**: FOUND-01, FOUND-02, FOUND-03, FOUND-04, FOUND-05, FOUND-06, FOUND-07, FOUND-08, FOUND-09, FOUND-10, MON-01, MON-02, MON-03, MON-04, SEC-01, SEC-02, SEC-03
**Success Criteria** (what must be TRUE):
  1. User can sign up, log in, and pass the age gate — COPPA parental consent flow works for under-13
  2. User can subscribe to a paid tier and purchase token packs via Stripe Checkout
  3. Token balance is displayed in the UI, tracks usage, and the 10% charity auto-donation fires on every payment
  4. Deployments to staging and production are automated via GitHub Actions with no manual steps
  5. Errors surface in Sentry, user behavior is captured in PostHog, and daily API spend is visible in the cost dashboard
**Plans**: 4 plans
Plans:
- [ ] 01-PLAN-A.md — Monorepo scaffold + Next.js 15 shell + Prisma schema + Hono backend + GitHub Actions CI/CD
- [ ] 01-PLAN-B.md — Clerk auth integration + COPPA age gate + parental consent flow + user sync webhook
- [ ] 01-PLAN-C.md — Stripe Billing + subscription tiers + token packs + token balance system + 10% charity donation
- [ ] 01-PLAN-D.md — Sentry + PostHog + cost tracking dashboard + CORS + rate limiting + audit logging + Deno sandbox
**UI hint**: yes

### Phase 2: Legal & Compliance
**Goal**: The platform can legally serve users of all ages, handle DMCA takedowns, collect EU payments, and operate under signed vendor agreements
**Depends on**: Phase 1
**Requirements**: LEGAL-01, LEGAL-02, LEGAL-03, LEGAL-04, LEGAL-05, LEGAL-06, LEGAL-07, LEGAL-08
**Success Criteria** (what must be TRUE):
  1. Terms of Service and Privacy Policy are live, cover COPPA/GDPR/CCPA, and are linked from every page footer
  2. Under-13 users cannot complete signup without verified parental consent (email + card, 48hr token)
  3. DMCA agent is registered with the Copyright Office and a takedown request results in 48-hour removal
  4. EU users are prompted for 3D Secure on card entry and can cancel in one click (ROSCA compliance)
  5. Users in embargoed countries are geo-blocked at the edge before reaching any authenticated route
**Plans**: TBD

### Phase 3: AI Engine
**Goal**: The core AI pipeline is live — users can speak a command or upload an image and get a game-ready output, with costs estimated upfront and results cached
**Depends on**: Phase 1
**Requirements**: AI-01, AI-02, AI-03, AI-04, AI-05, AI-06, AI-07
**Success Criteria** (what must be TRUE):
  1. User speaks a game command and receives a structured game element output in under 2 seconds
  2. User uploads a photo or sketch and receives a terrain/building layout plan from Claude Vision
  3. Cost estimate ("~50 tokens") appears before any AI operation executes, and a live token counter updates during execution
  4. Identical prompts return cached results from Redis (24hr TTL) without hitting AI provider APIs
  5. When any AI provider fails, the system retries 3 times and degrades gracefully — the user sees a fallback, not a crash
**Plans**: TBD

### Phase 4: Web Platform
**Goal**: Users have a complete web product — they can discover RobloxForge, sign up, use the AI interfaces, manage billing, and the whole experience is responsive and handles errors gracefully
**Depends on**: Phase 2, Phase 3
**Requirements**: WEB-01, WEB-02, WEB-03, WEB-04, WEB-05, WEB-06, WEB-07, WEB-08, WEB-09, WEB-10
**Success Criteria** (what must be TRUE):
  1. Landing page is live with hero, demo video, pricing section, charity section, and a working CTA that drives to signup
  2. Dashboard shows recent projects, token balance widget, streak/XP display, and quick action buttons
  3. Voice-to-game interface has a working mic button, live waveform, real-time transcription display, and command history
  4. Image-to-map interface accepts uploads, shows a processing animation, and displays the result with a feedback mechanism
  5. Pricing page, checkout flow, and billing portal all work end-to-end — user can upgrade, add tokens, view invoices, and cancel
**Plans**: TBD
**UI hint**: yes

### Phase 5: MCP Servers + Studio Plugin
**Goal**: Developers can use RobloxForge AI capabilities directly inside Roblox Studio via a plugin, and three MCP servers expose terrain, city, and asset generation as tool calls
**Depends on**: Phase 3
**Requirements**: MCP-01, MCP-02, MCP-03, PLUG-01, PLUG-02, PLUG-03, PLUG-04
**Success Criteria** (what must be TRUE):
  1. terrain-forge MCP accepts a biome description and returns heightmap data usable by Roblox Studio terrain APIs
  2. city-architect MCP generates a road network and building placement layout from a zone description
  3. asset-alchemist MCP runs the Meshy + Fal pipeline and returns a model asset reference
  4. RobloxForge plugin appears in Roblox Studio toolbar, authenticates the user, and syncs with the web platform on a 2-5s polling interval
  5. Generated assets are injected into the Studio workspace and every operation is undoable via ChangeHistoryService
**Plans**: TBD

### Phase 6: Marketplace + Gamification
**Goal**: Creators can sell templates in the marketplace and receive Stripe Connect payouts, and all users earn XP, unlock achievements, and maintain streaks
**Depends on**: Phase 4
**Requirements**: MARKET-01, MARKET-02, MARKET-03, MARKET-04, MARKET-05, GAME-01, GAME-02, GAME-03, GAME-04
**Success Criteria** (what must be TRUE):
  1. Creator can submit a template with screenshots and pricing, and it appears in the marketplace after review
  2. Buyer can browse, filter by category/price/rating, view a template detail page, and purchase with one click
  3. Creator receives a 70% payout via Stripe Connect once monthly minimum ($20) is met
  4. User earns XP from builds, publishes, and sales — XP advances through 6 visible tiers on their profile
  5. User can view all 30 achievements, see which are unlocked, and daily/weekly streaks display a token bonus reward
**Plans**: TBD
**UI hint**: yes

### Phase 7: Game DNA + Team Collaboration
**Goal**: Users can analyze any Roblox game's DNA with a 12-variable genome report and compare it to competitors, and teams can collaborate in real time with roles, presence, and version history
**Depends on**: Phase 4
**Requirements**: DNA-01, DNA-02, DNA-03, DNA-04, TEAM-01, TEAM-02, TEAM-03, TEAM-04
**Success Criteria** (what must be TRUE):
  1. User pastes a Roblox game URL, clicks scan, and receives a 12-variable genome report with radar chart and recommendations
  2. User can compare their game against a competitor side-by-side with a diff view of all 12 variables
  3. User can create a team, invite members by email or shareable link, and assign Owner/Admin/Editor/Viewer roles
  4. Multiple team members editing simultaneously see each other's cursor position and a live activity feed
  5. Team member can view the full commit timeline, see a diff between any two versions, and roll back to a previous state
**Plans**: TBD
**UI hint**: yes

### Phase 8: API System + Growth
**Goal**: The platform has a public API with SDKs, a referral program, email and notification systems, and a creator earnings dashboard — turning RobloxForge from a tool into a growing platform
**Depends on**: Phase 6
**Requirements**: API-01, API-02, API-03, API-04, GROW-01, GROW-02, GROW-03, GROW-04, GROW-05
**Success Criteria** (what must be TRUE):
  1. User can generate an API key with scoped permissions and use it to call the API from the interactive documentation playground
  2. npm and Python SDKs are published and documented — a developer can install and make a terrain-forge call in under 5 minutes
  3. Referred user signs up via a unique referral link and the referrer receives $1 credit plus 20% lifetime commission tracking
  4. User receives email, in-app, and push notifications for relevant events (sale, payout, build complete) with frequency cap controls
  5. Creator can view their total revenue, per-template sales breakdown, and scheduled payout date from the earnings dashboard
**Plans**: TBD
**UI hint**: yes

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 0/4 | Planned | - |
| 2. Legal & Compliance | 0/TBD | Not started | - |
| 3. AI Engine | 0/TBD | Not started | - |
| 4. Web Platform | 0/TBD | Not started | - |
| 5. MCP Servers + Studio Plugin | 0/TBD | Not started | - |
| 6. Marketplace + Gamification | 0/TBD | Not started | - |
| 7. Game DNA + Team Collaboration | 0/TBD | Not started | - |
| 8. API System + Growth | 0/TBD | Not started | - |
