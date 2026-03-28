# Phase 4: Web Platform - Context

**Gathered:** 2026-03-28
**Status:** Ready for planning
**Mode:** Auto-generated (frontend phase)

<domain>
## Phase Boundary

Build the complete user-facing web product: marketing landing page with hero/demo/pricing/charity, authenticated dashboard with projects/tokens/streaks/quick-actions, voice-to-game interface (mic/waveform/transcription/3D preview/history), image-to-map interface (upload/processing/result/feedback), pricing page (4 tiers/feature matrix/annual toggle/calculator), checkout flow (Stripe Checkout), billing portal, settings page, error handling with recovery cards, responsive design across all breakpoints.

Requirements: WEB-01 through WEB-10 (10 total)

</domain>

<decisions>
## Implementation Decisions

### Design System (from 46-agent research)
- Dark mode: #0A0E27 base, #FFB81C gold accent, #0D1231 surface
- Typography: Inter (400/600/700), JetBrains Mono for code
- Component library: shadcn/ui with dark theme customization
- Animations: Framer Motion, 150ms transitions
- Responsive: 320px (XS) → 1536px (2XL), mobile-first
- Cards: 12px radius, 20px padding
- Buttons: gold primary, outline secondary, ghost tertiary

### Landing Page (from design agents)
- Hero: "Build Roblox Games in Minutes, Not Months" + CTA + video
- Social proof: live counters (games built, creators, hours saved, donated)
- 6 feature cards, 3-step "how it works", pricing, testimonials, charity section
- Target: 12-15% visitor-to-signup conversion

### Dashboard (from design agents)
- Top nav: logo, search, notifications, token balance, profile
- Sidebar: 8 nav items with icons
- Home: recent projects grid, token widget, streak/XP, quick actions
- Quick actions: New Project, Voice Build, Image to Map, Browse Templates

### Voice Interface (from design agents)
- Split screen: 35% voice panel, 65% 3D viewport
- Mic button with breathing gold glow
- Real-time waveform (64-point FFT)
- Live transcription display
- Command history with undo buttons
- Confidence display + follow-up suggestions

### Claude's Discretion
Implementation details like exact component structure, state management patterns, and animation specifics are at Claude's discretion.

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- src/app/layout.tsx — RootLayout with Inter + JetBrains Mono (Phase 1)
- src/components/TokenBalanceWidget.tsx (Phase 1)
- src/components/CharitySelector.tsx (Phase 1)
- src/components/Footer.tsx (Phase 2)
- src/lib/stripe.ts — Stripe client + checkout sessions (Phase 1)
- src/lib/utils.ts — cn() utility (Phase 1)
- apps/api/src/routes/ai/ — voice, image, generate endpoints (Phase 3)

### Integration Points
- Dashboard routes: src/app/(app)/dashboard/
- Marketing routes: src/app/(marketing)/
- AI interface pages connect to Phase 3 API endpoints
- Pricing page uses subscription tiers from src/lib/subscription-tiers.ts

</code_context>

<specifics>
## Specific Ideas
- Voice interface should feel like Iron Man's JARVIS
- Landing page needs to convert — focus on demo video showing the magic
- Token display should show VALUE not cost ("saved 3 hours" not "spent 50 tokens")
- Error states must never show raw errors — always recovery cards with next steps

</specifics>

<deferred>
## Deferred Ideas
- Mobile companion app — Phase v2
- Marketplace browse UI — Phase 6
- Team collaboration UI — Phase 7
- API documentation site — Phase 8

</deferred>
