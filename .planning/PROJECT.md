# RobloxForge

## What This Is

RobloxForge is an AI-powered game development platform that lets anyone build Roblox games using voice commands, image references, and autonomous AI agents. It's the all-in-one toolkit for Roblox creators — from a 13-year-old building their first game to professional studios shipping hits. Built by Dawsen Porter. 10% of all revenue donated to charity.

## Core Value

**Simple input → professional output.** A user speaks "build me a medieval castle with a moat" and gets a playable Roblox game element in seconds. Everything else (marketplace, teams, analytics) amplifies this core magic.

## Requirements

### Validated

(None yet — ship to validate)

### Active

**Core AI Engine**
- [ ] Voice-to-Game: speak into mic → AI builds game elements in Roblox Studio in real-time (<2s latency)
- [ ] Image-to-Map: upload photo/sketch → AI generates matching Roblox map (terrain, buildings, lighting)
- [ ] Multi-model pipeline: Claude (logic) + Meshy (3D) + Fal (textures) + ElevenLabs (audio) chained in parallel
- [ ] Game DNA Scanner: paste any Roblox game URL → get 12-variable genome report with recommendations
- [ ] Economy Simulation: define economy → AI simulates 10K players → detects exploits, suggests fixes
- [ ] Auto-Playtest: AI bots play your game, generate heatmaps, score fun/frustration/retention

**MCP Server Suite (10 servers)**
- [ ] terrain-forge — procedural terrain from biome descriptions
- [ ] city-architect — urban planning, road networks, building placement
- [ ] npc-director — behavior trees, patrol routes, dialogue systems
- [ ] economy-engine — Markov chain simulation, exploit detection
- [ ] asset-alchemist — multi-model asset generation pipeline
- [ ] game-dna-scanner — game analysis from screenshots/metrics
- [ ] playtest-bot — automated testing, heatmaps, bug detection
- [ ] monetization-advisor — pricing optimization, battle pass design
- [ ] performance-optimizer — instance counting, LOD, streaming
- [ ] voice-to-game — speech-to-game-command orchestration

**Web Platform (SaaS)**
- [ ] Next.js 15 dashboard with dark mode + gold accents (#FFB81C)
- [ ] Clerk auth with COPPA parental consent for under-13
- [ ] Stripe billing: token-based ($0.01/token), 5 tiers ($0-$49.99/mo)
- [ ] Template marketplace with 70/30 creator revenue share via Stripe Connect
- [ ] Plugin ecosystem: third-party MCP tools, sandboxed execution, 70/30 rev share
- [ ] Real-time collaboration (Yjs CRDT + Socket.io, <100ms latency, up to 50 editors)
- [ ] Team workspaces with role-based access (Owner, Admin, Editor, Viewer)
- [ ] Gamification: 6-tier progression, 30 achievements, streaks, leaderboards
- [ ] API key system: personal/team/service keys, OAuth apps, SDKs (npm, Python, Go)

**Roblox Studio Plugin**
- [ ] DockWidgetPluginGui with toolbar integration
- [ ] HTTP polling sync (250ms) between Studio and web platform
- [ ] Asset injection, terrain manipulation, script insertion
- [ ] ChangeHistoryService integration for undo/redo

**Mobile Companion App**
- [ ] React Native app: agent monitoring, marketplace browse, team chat, analytics
- [ ] Push notifications (Firebase Cloud Messaging) with deep linking
- [ ] iOS widgets for agent status + token balance

**Business Infrastructure**
- [ ] LLC: Dawsen Porter, existing LLC with subdomains
- [ ] Stripe: subscriptions + usage metering + Connect payouts + Tax + 10% charity transfers
- [ ] Terms of Service (18 sections, COPPA compliant, arbitration, DMCA)
- [ ] Privacy Policy (GDPR, CCPA, COPPA)
- [ ] COPPA: email + card parental consent, data minimization, 48hr consent tokens

**Charity System**
- [ ] 10% auto-donation via Stripe Transfer API
- [ ] User picks cause from rotating list of 3-5 charities
- [ ] Monthly transparency reports, total donated counter on site
- [ ] Legal disclosure (donations NOT tax-deductible to user unless 501(c)(3))

### Out of Scope

- Native desktop app (Mac/Windows) — web + Studio plugin sufficient
- Real-time multiplayer game hosting — Roblox handles this
- Custom game engine — we build ON Roblox, not replacing it
- Loot boxes / gambling mechanics — legal risk, not aligned with values
- Game Cloner feature — DMCA §1201 risk, Roblox ToS violation potential

## Context

**Owner:** Dawsen Porter (existing LLC, Stripe account, subdomains available)
**Audience:** All Roblox creators ages 13+ (9.5M+ creators, $760M annual payouts)
**Market:** No AI-first Roblox dev platform exists. Zero direct competition. 18-month window before Roblox Inc. could build comparable.
**Revenue model:** Token-based SaaS + marketplace commission + API usage
**Charity angle:** 10% donation is a brand differentiator, drives press coverage and trust

**Technical stack (researched):**
- Frontend: Next.js 15, React 19, TypeScript, shadcn/ui, Tailwind CSS 4, Framer Motion
- Backend: Hono 4.x on Node.js 22 LTS
- Database: PostgreSQL 16 + pgvector + Citus (scaling)
- Cache: Redis 8.0 Cluster
- Queue: BullMQ 5.x
- Real-time: Yjs + Socket.io
- Auth: Clerk (COPPA-compliant)
- Payments: Stripe (Billing + Connect + Tax)
- AI: Claude API + Meshy + Fal + ElevenLabs
- Deployment: Vercel (frontend) + Fly.io (backend)
- Mobile: React Native (bare)
- Monitoring: Sentry + PostHog + Prometheus/Grafana

**Key research findings:**
- Full game generation costs ~$11.65 in API calls (optimized to ~$8)
- Voice-to-game achievable at <2s latency using Deepgram ($0.29/session)
- Image-to-map costs $0.065-0.076 per map
- Break-even at ~50 Starter users ($450 revenue after charity)
- Year 1 revenue projection: $200K-$600K
- Year 2: $500K-$1.5M
- TAM: $400M-$700M (serviceable)

**Legal requirements (researched):**
- COPPA: parental consent (email + card verification), $43,792/violation
- GDPR/CCPA compliance for international users
- Charity donation disclosure (state registration may be needed)
- 1099-NEC for marketplace creators earning $600+
- SOC 2 readiness path for enterprise deals
- E&O + Cyber insurance ($16K/year)
- First-year legal costs: $27K-$45K

**Design system (researched):**
- Dark mode primary (#0A0E27 base)
- Gold accent (#FFB81C, WCAG AAA 7.8:1 contrast)
- Inter font (headings 700, body 400)
- JetBrains Mono for code
- 4px grid spacing
- 12px border radius on cards
- 15 complete UI designs: onboarding, dashboard, marketplace, voice-to-game, pricing, checkout, game DNA, team collab, mobile app, landing page, email templates, notifications, creator earnings, API keys, design system

## Constraints

- **Timeline**: MVP usable by Dawsen before April 8, 2026 (subscription renewal)
- **Budget**: Solo dev, minimize external costs, leverage existing LLC + Stripe
- **COPPA**: All ages including under-13 — parental consent flow non-negotiable
- **Roblox ToS**: Must comply with Roblox third-party tool guidelines
- **API costs**: Must maintain 60%+ margin on AI operations
- **Performance**: Mobile-ready, <20K Roblox instances per build

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Start fresh (not extend roblox-auto-platform) | Clean architecture, no legacy debt | — Pending |
| Next.js 15 + Hono backend | Best DX, streaming, edge support | — Pending |
| Clerk for auth | COPPA compliance built-in, saves weeks | — Pending |
| Stripe for everything payment | Already set up, handles tax/compliance | — Pending |
| Token-based pricing ($0.01/token) | Simple, scalable, matches AI cost model | — Pending |
| 10% charity donation | Brand differentiator, press angle, values | — Pending |
| 70/30 marketplace split | Industry standard, attracts creators | — Pending |
| Yjs CRDT for collaboration | Proven (Figma-scale), works offline, <100ms | — Pending |
| React Native for mobile | Code reuse with web, larger hiring pool | — Pending |
| PostgreSQL + pgvector | Scaling path clear (Citus), embeddings built-in | — Pending |
| No Game Cloner feature | DMCA §1201 risk too high, Roblox ban risk | — Pending |
| 13+ age gate with parental consent for <13 | Serves all ages while staying COPPA compliant | — Pending |
| API key system for ecosystem growth | Turns tool into platform, separate revenue stream | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd:transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-03-28 after initialization*
