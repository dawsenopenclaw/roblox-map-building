# Phase 1: Foundation - Context

**Gathered:** 2026-03-28
**Status:** Ready for planning
**Mode:** Auto-generated (infrastructure phase — discuss skipped)

<domain>
## Phase Boundary

Deploy the platform skeleton: Next.js 15 + Hono 4.x + PostgreSQL 16 + Redis 8 + Clerk auth + Stripe billing + GitHub Actions CI/CD + Sentry + PostHog + security hardening. The platform is deployed, authenticated users can sign up and pay, and all infrastructure is observable and secure.

Requirements: FOUND-01 through FOUND-10, MON-01 through MON-04, SEC-01 through SEC-03 (17 total)

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion
All implementation choices are at Claude's discretion — pure infrastructure phase. Use ROADMAP phase goal, success criteria, and the researched tech stack to guide decisions.

Key technical decisions from PROJECT.md research:
- Frontend: Next.js 15 App Router + React 19 + TypeScript + shadcn/ui + Tailwind CSS 4
- Backend: Hono 4.x on Node.js 22 LTS
- Database: PostgreSQL 16 + pgvector extension
- Cache: Redis 8.0
- Auth: Clerk (COPPA-compliant, supports age gate + parental consent)
- Payments: Stripe Billing + Connect + Tax
- CI/CD: GitHub Actions (lint → test → staging → production)
- Monitoring: Sentry (errors) + PostHog (analytics) + custom cost tracking
- Deployment: Vercel (frontend) + Fly.io (backend)
- Dark mode: #0A0E27 base, #FFB81C gold accent

Clerk keys available in .env.local. Stripe keys pending (user will add later — use test mode placeholders).

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- None — greenfield project, no existing code

### Established Patterns
- None — first phase establishes all patterns

### Integration Points
- .env.local has Clerk keys configured
- PostgreSQL + Redis URLs defined in .env.local
- Git repo initialized with .gitignore

</code_context>

<specifics>
## Specific Ideas

No specific requirements — infrastructure phase. Build the standard Next.js + Hono + PostgreSQL + Redis stack per the research.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>
