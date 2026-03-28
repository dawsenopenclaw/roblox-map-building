---
phase: "02"
plan: "02"
subsystem: "legal-compliance"
tags: ["legal", "tos", "privacy", "coppa", "gdpr", "ccpa", "dmca", "geo-blocking", "rosca"]
dependency_graph:
  requires: ["01-foundation"]
  provides: ["legal-pages", "geo-blocking", "dmca-process", "footer"]
  affects: ["src/middleware.ts", "src/app/(legal)/", "src/components/Footer.tsx"]
tech_stack:
  added: []
  patterns: ["Next.js route groups for legal", "edge middleware geo-blocking", "RFC 7725 HTTP 451"]
key_files:
  created:
    - src/app/(legal)/layout.tsx
    - src/app/(legal)/terms/page.tsx
    - src/app/(legal)/privacy/page.tsx
    - src/app/(legal)/dmca/page.tsx
    - src/app/(legal)/acceptable-use/page.tsx
    - src/app/(legal)/blocked/page.tsx
    - src/components/Footer.tsx
    - docs/dmca-agent-registration.md
    - docs/vendor-dpas.md
  modified:
    - src/middleware.ts
decisions:
  - "Geo-blocking via x-vercel-ip-country header (Vercel edge) with Cloudflare cf-ipcountry fallback"
  - "HTTP 307 redirect to /blocked page rather than inline 451 response (Next.js edge runtime constraint)"
  - "OFAC embargoed list: KP, IR, SY, CU, RU — Crimea documented as edge case requiring Cloudflare Worker"
  - "ROSCA compliance via account billing settings one-click cancel (Stripe portal)"
  - "Stripe SCA handled automatically by Stripe Checkout (no custom code needed)"
  - "Charity disclosure in ToS §12: 10% donation, explicitly non-tax-deductible for customers"
  - "AI content ownership: assign all rights to user, with AI copyright uncertainty disclaimer"
  - "DPAs: 9 vendors identified, all flagged PENDING/INVESTIGATE for pre-launch completion"
metrics:
  duration: "~25 minutes"
  completed: "2026-03-28"
  tasks_completed: 10
  files_created: 9
  files_modified: 1
---

# Phase 02: Legal & Compliance Summary

**One-liner:** Full legal stack for RobloxForge — 18-section ToS, GDPR/CCPA/COPPA privacy policy, DMCA agent process, AUP, edge geo-blocking for OFAC embargoed countries, HTTP 451 blocked page, and Footer.

---

## What Was Built

### 1. Terms of Service (`/terms`)
18 sections as specified:
1. Acceptance & Age (COPPA under-13 consent requirements, minor guardian consent)
2. Account Security
3. Service Description (Roblox Corp non-affiliation disclaimer)
4. Token & Credit System (no cash value, expiry, non-refundable)
5. Subscription Terms (ROSCA one-click cancel, EU 14-day cooling-off, Stripe SCA disclosure)
6. AI-Generated Content Ownership (user assignment with AI copyright uncertainty disclaimer)
7. Marketplace Terms
8. Plugin Developer Terms
9. Acceptable Use (cross-references /acceptable-use)
10. IP & DMCA (48-hour SLA, repeat infringer policy)
11. Privacy (incorporates Privacy Policy by reference)
12. **Charity Donation Disclosure** (10% of revenue, explicitly NOT tax-deductible for customers)
13. Disclaimers & Limitation of Liability
14. Indemnification
15. Dispute Resolution (AAA arbitration, class action waiver, EU/UK carve-out, COPPA arbitration exclusion)
16. Termination
17. Modification of Terms (30-day notice for material changes)
18. Governing Law (Wyoming, with EU consumer law carve-out)

### 2. Privacy Policy (`/privacy`)
- **GDPR section** (blue callout): All 8 rights (Art. 15-21), SCCs for EU-US transfers, DPA contact
- **CCPA/CPRA section** (purple callout): Know, Delete, Correct, Opt-out, Non-discrimination
- **COPPA section** (green callout): Verifiable consent methods, data minimization, no behavioral advertising to under-13, 5-year consent record retention, parental rights
- Data collection table, usage/legal basis table, retention periods table, cookie table

### 3. DMCA Policy (`/dmca`)
- Designated agent: Dawsen Porter — dmca@robloxforge.gg
- **48-hour acknowledgment SLA** prominently displayed
- 6-element takedown notice requirements (17 U.S.C. § 512(c)(3))
- 5-step takedown process with timeline
- Counter-notification process (§ 512(g)(3))
- Repeat infringer 3-strike policy

### 4. Acceptable Use Policy (`/acceptable-use`)
- Prohibited content: illegal, child harm (CSAM zero-tolerance + NCMEC reporting), IP violations, hate speech/harmful content
- Prohibited technical activities: unauthorized access, scraping, reverse engineering, spam
- AI-specific rules: jailbreaking, synthetic fraud, competing products
- Roblox platform compliance section
- Export control section (mirrors geo-blocking list)
- 3-tier enforcement ladder

### 5. Geo-Blocking Middleware (enhanced `src/middleware.ts`)
- Blocks: KP (North Korea), IR (Iran), SY (Syria), CU (Cuba), RU (Russia)
- Headers read: `x-vercel-ip-country` (Vercel) → `cf-ipcountry` (Cloudflare) fallback
- Response: HTTP 307 redirect to `/blocked` with RFC 7725 `Link: <https://ofac.treasury.gov/>; rel="blocked-by"` header
- `/blocked` route is geo-exempt (accessible to show explanation)
- Legal routes (`/terms`, `/dmca`, etc.) added to public route matcher

### 6. HTTP 451 Blocked Page (`/blocked`)
- Displays embargoed country list
- Legal citations: IEEPA (50 U.S.C. § 1701), AECA (22 U.S.C. § 2778), EAR (15 C.F.R. Part 730)
- Instructions for false-positive VPN users
- Contact: legal@robloxforge.gg

### 7. Footer Component (`src/components/Footer.tsx`)
- Product links, Legal links (ToS, Privacy, DMCA, AUP), Company/contact links
- Charity disclosure with link to Terms §12
- "Not affiliated with Roblox Corporation" disclaimer

### 8. DMCA Agent Registration Guide (`docs/dmca-agent-registration.md`)
- Step-by-step Form HAL filing at dmca.copyright.gov
- Fee: $6.00, renewal every 3 years
- Ongoing safe harbor maintenance requirements
- Repeat-infringer policy documentation

### 9. Vendor DPA Tracker (`docs/vendor-dpas.md`)
All 9 vendors documented with DPA status:
| Vendor | Status |
|---|---|
| Stripe | PENDING — self-service at dashboard |
| Clerk | PENDING — self-service |
| Vercel | PENDING — self-service (Pro plan) |
| Sentry | PENDING — self-service |
| PostHog | PENDING — self-service |
| Anthropic | PENDING — contact sales |
| Meshy | INVESTIGATE — DPA availability unknown |
| Fal.ai | INVESTIGATE — DPA availability unknown |
| Resend | INVESTIGATE — DPA availability unknown |

---

## Stripe SCA / ROSCA Compliance

**Stripe SCA (3D Secure):** Stripe Checkout automatically handles Strong Customer Authentication for EU/UK users under PSD2 — no custom code required. Disclosed in ToS §5.

**ROSCA compliance:** ToS §5 explicitly states one-click cancellation is available in account Billing Settings. This satisfies California's Automatic Renewal Law (Cal. Bus. & Prof. Code § 17600) and ROSCA. The actual cancel button implementation is in the billing portal (Stripe Customer Portal), which has a native cancel subscription button.

---

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing] Added legal routes to public route matcher in middleware**
- **Found during:** Task 7 (middleware geo-blocking)
- **Issue:** Existing middleware didn't have `/terms`, `/dmca`, `/acceptable-use`, `/blocked` as public routes — unauthenticated users would be redirected to /sign-in before seeing legal pages
- **Fix:** Added all legal routes to `isPublicRoute` matcher
- **Files modified:** src/middleware.ts
- **Commit:** cc96098

**2. [Rule 2 - Missing] Added Crimea technical limitation documentation**
- **Found during:** Geo-blocking implementation
- **Issue:** Vercel/Cloudflare report Crimea IPs as Ukraine country code (UA) — cannot block UA wholesale without blocking legitimate Ukrainian users
- **Fix:** Added code comment documenting this as known limitation requiring Cloudflare Worker for sub-region blocking; mentioned in docs/vendor-dpas.md
- **Files modified:** src/middleware.ts, docs/vendor-dpas.md
- **Commit:** cc96098

---

## Pre-Launch Action Items (Not Blocking MVP)

These are documentation-only — no code changes needed, but required before public launch:

1. **File DMCA Form HAL** — see `docs/dmca-agent-registration.md`
2. **Accept vendor DPAs** — Stripe, Clerk, Vercel, Sentry, PostHog (all self-service, ~30 minutes total)
3. **Request enterprise DPAs** — Anthropic, Meshy, Fal.ai, Resend
4. **Attorney review** — full Terms and Privacy Policy review before Series A / public launch (deferred per context)
5. **Crimea geo-blocking** — deploy Cloudflare Worker for sub-region blocking if needed

---

## Self-Check: PASSED

Files verified present:
- src/app/(legal)/layout.tsx — FOUND
- src/app/(legal)/terms/page.tsx — FOUND
- src/app/(legal)/privacy/page.tsx — FOUND
- src/app/(legal)/dmca/page.tsx — FOUND
- src/app/(legal)/acceptable-use/page.tsx — FOUND
- src/app/(legal)/blocked/page.tsx — FOUND
- src/components/Footer.tsx — FOUND
- docs/dmca-agent-registration.md — FOUND
- docs/vendor-dpas.md — FOUND
- src/middleware.ts — FOUND (modified)

Commit cc96098 verified in git log.
