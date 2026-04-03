---
phase: 04
plan: simplify-and-connect
title: "Simplify UX, Wire Everything, Make It Work"
status: ready
estimated_tasks: 6
---

# Phase 4 Reboot: Simplify & Connect

## Problem

The app has 11 sidebar nav items, 20+ pages, and most features are stubbed. Users need to navigate a maze to do one thing: **tell AI what to build and get it in Studio**. Buying is buried. Nothing feels connected.

## User's Requirements
- **Easier to use** — less clicking, fewer pages
- **Easier to buy** — obvious, low friction
- **Minimal navigation** — 3-4 items max
- **Connect everything** — wire stubs, make it real

## Architecture: The 3-Screen App

Everything collapses into 3 core screens:

### Screen 1: Landing Page (`/`)
- Hero + one CTA ("Start Building Free")
- 3-step how-it-works
- Pricing section (inline, not separate page)
- One testimonial row
- Footer
- **No separate /pricing page needed** — pricing is a section on landing

### Screen 2: Editor (`/editor`) — THE PRODUCT
- Full-screen AI chat + 3D preview + code panel
- Voice input is a MIC BUTTON inside the chat (not a separate page)
- Image upload is a BUTTON inside the chat (not a separate page)
- Token balance chip in top bar (live, from DB)
- "Upgrade" button appears when hitting limits (links to Stripe checkout directly)
- Studio connection status banner
- Build history in a collapsible side panel
- **This IS the app.** Everything happens here.

### Screen 3: Account (`/settings`)
- Single page with tabs: Profile, Billing, Studio Setup
- Billing tab: current plan, upgrade/downgrade, token balance, buy tokens, invoices (Stripe portal link)
- Studio tab: connection guide, plugin download
- **No separate /billing, /dashboard, /tokens pages**

### Navigation (3 items total)
1. **Editor** (main, default after login)
2. **Account** (settings + billing combined)
3. **Sign Out**

That's it. Everything else is either inside the editor or removed.

---

## Plan: 6 Tasks

### Task 1: Collapse Sidebar to 3 Items
**Files:** `src/components/AppSidebar.tsx`, `src/components/AppShell.tsx`
**What:**
- Remove all nav sections (AI Tools, Marketplace, Analytics, Settings)
- Replace with: Editor, Account, Sign Out
- Remove collapsible sections — flat list
- Keep mobile hamburger behavior
- Remove tier badge from sidebar (move to editor top bar)
- Cut sidebar width from ~240px to ~200px or make it a slim icon bar

### Task 2: Gut the Editor — Make Chat King
**Files:** `src/app/(app)/editor/page.tsx`, editor components
**What:**
- Editor = full screen chat panel + preview panel
- Add mic button INSIDE chat input bar (not separate page)
- Add image upload button INSIDE chat input bar (not separate page)
- Token balance chip in top-right corner (real data from `/api/dashboard/stats`)
- "Upgrade" pill appears when balance < 100 tokens → links to Stripe checkout
- Studio connection banner at top (real status from `/api/studio/status`)
- Remove: GameTree, ObjectList, PropertiesPanel, EditorIntegrations (complexity not needed yet)
- Keep: ChatPanel, CodePreview, Viewport3D, StudioConnectionBanner, BuildHistory

### Task 3: Wire Token Balance & Usage (Real Data)
**Files:** `src/components/TokenBalanceWidget.tsx`, `src/app/api/dashboard/stats/route.ts`
**What:**
- TokenBalanceWidget fetches from `/api/dashboard/stats` via SWR (poll every 30s)
- Stats endpoint returns: `{ tokenBalance, plan, usage24h, studioConnected }`
- Wire into editor top bar and account page
- Remove hardcoded stub data from DashboardHomeClient and StreakWidget
- When balance hits 0: show inline "Out of tokens" with upgrade CTA

### Task 4: Simplify Pricing & Checkout Flow
**Files:** `src/app/(marketing)/page.tsx` (landing), `src/app/api/billing/checkout/route.ts`
**What:**
- Move pricing INTO the landing page as a section (remove standalone /pricing page or redirect it)
- 3 tiers only: Free, Pro ($14.99), Studio ($49.99) — kill Hobby tier (too close to free)
- Each tier card has ONE button: "Start Free" / "Go Pro" / "Go Studio"
- Button → `/api/billing/checkout` → Stripe Checkout → redirect back to /editor
- If not logged in: button → `/sign-up?redirect=/editor&plan=pro`
- After checkout success: redirect to `/editor?upgraded=true` → show toast
- Remove: token calculator, feature matrix, annual toggle (add back later)
- In-editor upgrade: "Upgrade" button → same checkout flow, no page navigation

### Task 5: Combine Settings + Billing into Account Page
**Files:** `src/app/(app)/settings/page.tsx`, client components
**What:**
- 3 tabs: Profile, Billing, Studio
- **Profile tab:** name, email, avatar (Clerk UserProfile embedded or custom)
- **Billing tab:**
  - Current plan badge + "Change Plan" button → Stripe portal
  - Token balance + "Buy More" button → Stripe checkout for token pack
  - One token pack option: 5,000 tokens for $25 (simplify from 3 options)
  - "Manage Billing" link → Stripe customer portal (invoices, payment method, cancel)
- **Studio tab:**
  - Connection status (real from `/api/studio/status`)
  - Plugin download button
  - 4-step setup guide (already built)
- Remove: Notifications tab, Charity tab, Team tab, Danger Zone (move delete to Clerk portal)

### Task 6: Remove Dead Pages & Clean Routes
**Files:** multiple page.tsx files, middleware.ts
**What:**
- Remove or redirect these pages (they add navigation complexity):
  - `/dashboard` → redirect to `/editor`
  - `/voice` → removed (mic is in editor)
  - `/image-to-map` → removed (upload is in editor)
  - `/billing` → redirect to `/settings?tab=billing`
  - `/tokens` → redirect to `/settings?tab=billing`
  - `/game-dna` → remove (Phase 7 feature, not needed now)
  - `/marketplace` → remove (Phase 6 feature, not needed now)
  - `/achievements` → remove (Phase 7)
  - `/referrals` → remove (Phase 8)
  - `/growth` → remove (Phase 8)
  - `/community` → remove (Phase 8)
  - `/team` → remove (Phase 7)
  - `/projects` → remove (later feature)
  - `/business` → remove (later feature)
  - `/earnings` → remove (Phase 6)
- Keep: `/editor`, `/settings`, `/connect` (Studio plugin), `/welcome`, auth pages, legal pages, admin pages
- Update middleware public routes list
- Commit the 3 uncommitted files (middleware.ts, redis.ts, chat/route.ts)

---

## Success Criteria
1. User lands on `/` → sees what it does + pricing → clicks "Start Free" → signs up → lands in editor
2. Editor is ONE screen: chat + preview. Mic and image upload are buttons in the chat bar
3. Token balance is REAL and updates live
4. "Upgrade" button → Stripe checkout → back to editor in under 30 seconds
5. Settings page has billing, profile, and studio setup — nothing else
6. Sidebar has 3 items. No confusion about where to go.
7. Zero stub data visible to users — everything is either real or hidden

## Execution Order
Tasks 1 → 2 → 3 → 4 → 5 → 6 (sequential — each builds on previous)

## Estimated Time
~3-4 hours total execution across 6 tasks
