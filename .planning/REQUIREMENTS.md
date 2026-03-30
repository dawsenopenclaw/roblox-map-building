# Requirements: ForjeGames

**Defined:** 2026-03-28
**Core Value:** Simple input → professional output. Speak or upload → get a playable Roblox game element in seconds.

## v1 Requirements

### Foundation

- [ ] **FOUND-01**: Next.js 15 app with dark mode (#0A0E27) + gold accents (#FFB81C) deployed on Vercel
- [ ] **FOUND-02**: Hono 4.x backend API deployed on Fly.io with PostgreSQL 16 + Redis 8
- [ ] **FOUND-03**: Clerk auth with signup, login, age gate, COPPA parental consent for under-13
- [ ] **FOUND-04**: Stripe Billing with 4 subscription tiers (Free/Hobby/Creator/Studio) + token metering
- [ ] **FOUND-05**: Token balance system — purchase, track usage, rollover, display in UI
- [ ] **FOUND-06**: 10% charity auto-donation via Stripe Transfer API with cause selection
- [ ] **FOUND-07**: CI/CD pipeline (GitHub Actions → lint → test → staging → production)
- [ ] **FOUND-08**: Rate limiting per user and per API key (Redis sliding window)
- [ ] **FOUND-09**: Secrets management (env vars, 90-day rotation policy)
- [ ] **FOUND-10**: PostgreSQL daily backup + WAL archiving to S3 (RPO <1hr)

### AI Engine

- [ ] **AI-01**: Voice-to-game — Deepgram transcription → Claude intent parsing → game command execution (<2s)
- [ ] **AI-02**: Image-to-map — upload photo → Claude Vision analysis → terrain + building layout generation
- [ ] **AI-03**: Multi-model pipeline orchestration — Claude + Meshy + Fal in parallel with Promise.allSettled
- [ ] **AI-04**: Circuit breakers + fallback chains for all AI providers (retry 3x, degrade gracefully)
- [ ] **AI-05**: Cost estimation before execution ("This will cost ~50 tokens") + real-time token counter
- [ ] **AI-06**: Result caching — same prompt = cached output (Redis, 24hr TTL)
- [ ] **AI-07**: Quality gates — auto-reject bad generations (polygon count, artifact detection), retry with better prompt

### Web Platform

- [ ] **WEB-01**: Landing page with hero, demo video, pricing, social proof, charity section, CTA
- [ ] **WEB-02**: Dashboard — recent projects, token balance widget, streak/XP, quick actions bar
- [ ] **WEB-03**: Voice-to-game interface — mic button, waveform, live transcription, 3D preview, command history
- [ ] **WEB-04**: Image-to-map interface — upload area, processing animation, result preview, feedback loop
- [ ] **WEB-05**: Pricing page — 4 tiers, feature matrix, annual toggle (20% discount), token calculator
- [ ] **WEB-06**: Checkout flow — Stripe Checkout for subs, embedded form for token packs, charity selection
- [ ] **WEB-07**: Billing portal — invoices, update payment, cancel subscription, usage history
- [ ] **WEB-08**: Settings page — account, billing, team, integrations, notification preferences
- [ ] **WEB-09**: Error handling — error boundaries, recovery cards, fallback UI for AI timeouts
- [ ] **WEB-10**: Responsive design — desktop, tablet, mobile breakpoints with dark mode

### MCP Servers (Core 3)

- [ ] **MCP-01**: terrain-forge MCP — procedural terrain from biome descriptions via Claude + heightmaps
- [ ] **MCP-02**: city-architect MCP — road networks, zoning, building placement using layout algorithms
- [ ] **MCP-03**: asset-alchemist MCP — multi-model pipeline (Meshy 3D + Fal textures) as MCP tools

### Roblox Studio Plugin

- [ ] **PLUG-01**: DockWidgetPluginGui with ForjeGames toolbar button and auth flow
- [ ] **PLUG-02**: HTTP polling sync (2-5s) between Studio and web platform
- [ ] **PLUG-03**: Asset injection — insert generated models, terrain, scripts into workspace
- [ ] **PLUG-04**: ChangeHistoryService integration for undo/redo on all operations

### Legal & Compliance

- [ ] **LEGAL-01**: Terms of Service (18 sections including COPPA, arbitration, DMCA, AI content)
- [ ] **LEGAL-02**: Privacy Policy (GDPR, CCPA, COPPA sections)
- [ ] **LEGAL-03**: COPPA parental consent flow — email + card verification, 48hr tokens, 5yr audit trail
- [ ] **LEGAL-04**: DMCA agent registration (Form HAL, Copyright Office)
- [ ] **LEGAL-05**: Content moderation policy + 48-hour DMCA takedown SLA
- [ ] **LEGAL-06**: Stripe SCA (3D Secure) for EU users + ROSCA compliance (one-click cancel)
- [ ] **LEGAL-07**: Vendor DPA coordination (Stripe, Anthropic, Meshy, Fal, Sentry, PostHog)
- [ ] **LEGAL-08**: Export control geo-blocking (embargoed countries)

### Monitoring & Security

- [ ] **MON-01**: Sentry error tracking with source maps for frontend + backend
- [ ] **MON-02**: PostHog analytics — signups, funnels, feature usage, retention cohorts
- [ ] **MON-03**: Cost tracking dashboard — daily API spend by provider, margin alerts
- [ ] **MON-04**: Uptime monitoring + status page (Better Uptime)
- [ ] **SEC-01**: API security — CORS whitelist, request signing, webhook signature verification
- [ ] **SEC-02**: AI code sandboxing — Deno isolate with 5s timeout, 128MB memory limit
- [ ] **SEC-03**: Audit logging — all state-changing operations with user ID + timestamp

### Marketplace (v1)

- [ ] **MARKET-01**: Creator submission flow — upload template, screenshots, description, set price
- [ ] **MARKET-02**: Marketplace browse — categories, search, filters (price/rating/date), trending
- [ ] **MARKET-03**: Template detail page — gallery, reviews, creator profile, purchase button
- [ ] **MARKET-04**: Stripe Connect for creator payouts (70/30 split), monthly minimum $20
- [ ] **MARKET-05**: Review/rating system — verified purchase only, 5-star, creator can respond

### Game DNA Scanner

- [ ] **DNA-01**: Input — paste Roblox game URL, scan button, recent scans history
- [ ] **DNA-02**: Analysis — Roblox API data + Claude Vision screenshots → 12-variable genome extraction
- [ ] **DNA-03**: Report — radar chart, monetization breakdown, progression analysis, recommendations
- [ ] **DNA-04**: Comparison mode — scan your game vs competitor, side-by-side differences

### Team Collaboration

- [ ] **TEAM-01**: Team creation + invite system (email invite, shareable link, role assignment)
- [ ] **TEAM-02**: Real-time presence — Yjs CRDT + Socket.io, cursor awareness, activity feed
- [ ] **TEAM-03**: Permission management — Owner/Admin/Editor/Viewer roles, zone locking
- [ ] **TEAM-04**: Version history — commit timeline, diff view, rollback

### API System

- [ ] **API-01**: API key generation — personal/team/service keys with scoping (terrain-only, full, read-only)
- [ ] **API-02**: API documentation site — auto-generated from OpenAPI spec, interactive playground
- [ ] **API-03**: npm SDK (@forjegames/sdk) + Python SDK (pip install forjegames)
- [ ] **API-04**: Webhook support — send async job results to user's URL, HMAC-SHA256 signatures

### Gamification

- [ ] **GAME-01**: XP system — earn XP from builds, publishes, sales, referrals (daily cap 500)
- [ ] **GAME-02**: 6-tier progression (Novice → Apprentice → Builder → Master → Legend → Mythic)
- [ ] **GAME-03**: 30 achievements across categories (first steps, velocity, marketplace, community)
- [ ] **GAME-04**: Daily/weekly streaks with token bonus rewards

### Growth & Notifications

- [ ] **GROW-01**: Referral program — unique link, $1 free signup + 20% lifetime commission
- [ ] **GROW-02**: "Built with ForjeGames" credit system in published games
- [ ] **GROW-03**: Email system — 18 templates (welcome, verification, COPPA, sales, re-engagement)
- [ ] **GROW-04**: Notification system — push, in-app, email with frequency caps and priority levels
- [ ] **GROW-05**: Creator earnings dashboard — revenue charts, sales breakdown, payout schedule

## v2 Requirements

### Mobile App
- **MOB-01**: React Native companion app — agent monitoring, marketplace browse, team chat
- **MOB-02**: Push notifications with deep linking (Firebase Cloud Messaging)
- **MOB-03**: iOS widgets for agent status + token balance

### Advanced AI
- **ADV-01**: Economy simulation engine — 10K player simulation, exploit detection
- **ADV-02**: Auto-playtest bot — AI plays game, generates heatmaps, scores fun factor
- **ADV-03**: Monetization advisor — pricing optimization, battle pass design
- **ADV-04**: Performance optimizer MCP — instance counting, LOD management

### Advanced Platform
- **PLAT-01**: Plugin ecosystem — third-party MCP submissions, sandboxed execution, rev share
- **PLAT-02**: OAuth app registration — "Login with ForjeGames" for third parties
- **PLAT-03**: Embed widget — "Build with AI" on third-party sites
- **PLAT-04**: Branching/merging for game versions (git-like)
- **PLAT-05**: Voice/video chat during collaboration (WebRTC)
- **PLAT-06**: Internationalization — Spanish, French, Japanese, Portuguese

## Out of Scope

| Feature | Reason |
|---------|--------|
| Game Cloner | DMCA §1201 risk, Roblox ToS violation potential |
| Native desktop app | Web + Studio plugin sufficient |
| Custom game engine | We build ON Roblox, not replacing it |
| Loot boxes / gambling | Legal risk, not aligned with values |
| Real-time multiplayer hosting | Roblox handles this natively |
| SOC 2 certification (v1) | Pursue after Series A, not needed for launch |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| FOUND-01 | Phase 1 | Pending |
| FOUND-02 | Phase 1 | Pending |
| FOUND-03 | Phase 1 | Pending |
| FOUND-04 | Phase 1 | Pending |
| FOUND-05 | Phase 1 | Pending |
| FOUND-06 | Phase 1 | Pending |
| FOUND-07 | Phase 1 | Pending |
| FOUND-08 | Phase 1 | Pending |
| FOUND-09 | Phase 1 | Pending |
| FOUND-10 | Phase 1 | Pending |
| MON-01 | Phase 1 | Pending |
| MON-02 | Phase 1 | Pending |
| MON-03 | Phase 1 | Pending |
| MON-04 | Phase 1 | Pending |
| SEC-01 | Phase 1 | Pending |
| SEC-02 | Phase 1 | Pending |
| SEC-03 | Phase 1 | Pending |
| LEGAL-01 | Phase 2 | Pending |
| LEGAL-02 | Phase 2 | Pending |
| LEGAL-03 | Phase 2 | Pending |
| LEGAL-04 | Phase 2 | Pending |
| LEGAL-05 | Phase 2 | Pending |
| LEGAL-06 | Phase 2 | Pending |
| LEGAL-07 | Phase 2 | Pending |
| LEGAL-08 | Phase 2 | Pending |
| AI-01 | Phase 3 | Pending |
| AI-02 | Phase 3 | Pending |
| AI-03 | Phase 3 | Pending |
| AI-04 | Phase 3 | Pending |
| AI-05 | Phase 3 | Pending |
| AI-06 | Phase 3 | Pending |
| AI-07 | Phase 3 | Pending |
| WEB-01 | Phase 4 | Pending |
| WEB-02 | Phase 4 | Pending |
| WEB-03 | Phase 4 | Pending |
| WEB-04 | Phase 4 | Pending |
| WEB-05 | Phase 4 | Pending |
| WEB-06 | Phase 4 | Pending |
| WEB-07 | Phase 4 | Pending |
| WEB-08 | Phase 4 | Pending |
| WEB-09 | Phase 4 | Pending |
| WEB-10 | Phase 4 | Pending |
| MCP-01 | Phase 5 | Pending |
| MCP-02 | Phase 5 | Pending |
| MCP-03 | Phase 5 | Pending |
| PLUG-01 | Phase 5 | Pending |
| PLUG-02 | Phase 5 | Pending |
| PLUG-03 | Phase 5 | Pending |
| PLUG-04 | Phase 5 | Pending |
| MARKET-01 | Phase 6 | Pending |
| MARKET-02 | Phase 6 | Pending |
| MARKET-03 | Phase 6 | Pending |
| MARKET-04 | Phase 6 | Pending |
| MARKET-05 | Phase 6 | Pending |
| GAME-01 | Phase 6 | Pending |
| GAME-02 | Phase 6 | Pending |
| GAME-03 | Phase 6 | Pending |
| GAME-04 | Phase 6 | Pending |
| DNA-01 | Phase 7 | Pending |
| DNA-02 | Phase 7 | Pending |
| DNA-03 | Phase 7 | Pending |
| DNA-04 | Phase 7 | Pending |
| TEAM-01 | Phase 7 | Pending |
| TEAM-02 | Phase 7 | Pending |
| TEAM-03 | Phase 7 | Pending |
| TEAM-04 | Phase 7 | Pending |
| API-01 | Phase 8 | Pending |
| API-02 | Phase 8 | Pending |
| API-03 | Phase 8 | Pending |
| API-04 | Phase 8 | Pending |
| GROW-01 | Phase 8 | Pending |
| GROW-02 | Phase 8 | Pending |
| GROW-03 | Phase 8 | Pending |
| GROW-04 | Phase 8 | Pending |
| GROW-05 | Phase 8 | Pending |

**Coverage:**
- v1 requirements: 67 total
- Mapped to phases: 67
- Unmapped: 0

---
*Requirements defined: 2026-03-28*
*Last updated: 2026-03-28 — traceability updated after roadmap creation*
