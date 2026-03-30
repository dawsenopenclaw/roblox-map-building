# Phase 2: Legal & Compliance - Context

**Gathered:** 2026-03-28
**Status:** Ready for planning
**Mode:** Auto-generated (legal/compliance phase)

<domain>
## Phase Boundary

Make the platform legally operable for all ages: Terms of Service (18 sections), Privacy Policy (GDPR/CCPA/COPPA), COPPA parental consent enforcement, DMCA agent registration + takedown process, Stripe SCA for EU, ROSCA one-click cancel, vendor DPAs, export control geo-blocking.

Requirements: LEGAL-01 through LEGAL-08 (8 total)

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion
All implementation choices are at Claude's discretion. Use the extensive legal research from 46 agents to guide decisions.

Key legal decisions from research:
- ToS: 18 sections including COPPA, arbitration, DMCA, AI content ownership, charity disclosure
- Privacy Policy: GDPR (EU), CCPA (CA), COPPA sections required
- COPPA: Email + card parental consent, 48hr tokens, 5-year audit trail (already built in Phase 1)
- DMCA: Register agent with Copyright Office (Form HAL), 48-hour takedown SLA
- Stripe SCA: 3D Secure for EU users (Stripe handles automatically with checkout)
- ROSCA: One-click cancellation (California auto-renewal law)
- Vendor DPAs: Need signed agreements with Stripe, Anthropic, Meshy, Fal, Sentry, PostHog
- Geo-blocking: Block embargoed countries (North Korea, Iran, Syria, Cuba, Crimea) at edge
- Owner: Dawsen Porter, existing LLC

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- Clerk auth already configured (Phase 1 Plan B)
- COPPA age gate + parental consent flow already built
- Stripe billing already integrated
- Hono middleware pattern established

### Integration Points
- Legal pages go in src/app/(legal)/ directory
- Footer component needs links to ToS and Privacy Policy
- Middleware for geo-blocking goes in src/middleware.ts or apps/api/src/middleware/

</code_context>

<specifics>
## Specific Ideas
- Use comprehensive ToS template from research agent (forjegames_tos_comprehensive_draft.md)
- COPPA implementation details from research agent (forjegames-coppa-implementation.md)
- Charity disclosure must be transparent about non-tax-deductible status

</specifics>

<deferred>
## Deferred Ideas
- SOC 2 certification — deferred to post-Series A
- Full legal attorney review — deferred to pre-public launch
- 501(c)(3) nonprofit structure for charity — deferred to Year 2

</deferred>
