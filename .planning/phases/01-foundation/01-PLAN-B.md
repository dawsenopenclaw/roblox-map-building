---
phase: 01-foundation
plan: B
type: execute
wave: 2
depends_on:
  - 01-PLAN-A
files_modified:
  - src/app/(auth)/sign-in/[[...sign-in]]/page.tsx
  - src/app/(auth)/sign-up/[[...sign-up]]/page.tsx
  - src/app/(auth)/onboarding/page.tsx
  - src/app/(auth)/onboarding/age-gate/page.tsx
  - src/app/(auth)/onboarding/parental-consent/page.tsx
  - src/app/(auth)/onboarding/parental-consent/verify/page.tsx
  - src/middleware.ts
  - src/lib/clerk.ts
  - src/lib/auth.ts
  - apps/api/src/routes/auth.ts
  - apps/api/src/routes/onboarding.ts
  - apps/api/src/middleware/auth.ts
  - apps/api/src/webhooks/clerk.ts
autonomous: true
requirements:
  - FOUND-03

must_haves:
  truths:
    - "User can sign up with email, creates a Clerk account and a database User record"
    - "User born before 13 years ago is routed to the parental consent flow, not the dashboard"
    - "Parental consent sends an email with a 48-hour verification token"
    - "Under-13 account is locked (cannot access app) until parent verifies the token"
    - "Middleware blocks unauthenticated users from /dashboard and /api routes"
    - "Clerk webhook creates the User row in Postgres on first sign-up"
  artifacts:
    - path: "src/middleware.ts"
      provides: "Clerk auth middleware protecting /dashboard and /api"
      contains: "clerkMiddleware"
    - path: "src/app/(auth)/onboarding/age-gate/page.tsx"
      provides: "DOB form that routes under-13 to parental consent"
    - path: "apps/api/src/webhooks/clerk.ts"
      provides: "Webhook handler that creates User row on user.created event"
      exports: ["clerkWebhookRoute"]
    - path: "apps/api/src/middleware/auth.ts"
      provides: "Hono middleware that validates Clerk JWT and sets userId context"
      exports: ["requireAuth"]
  key_links:
    - from: "src/middleware.ts"
      to: "Clerk auth"
      via: "clerkMiddleware from @clerk/nextjs/server"
      pattern: "clerkMiddleware"
    - from: "apps/api/src/webhooks/clerk.ts"
      to: "db.user.create"
      via: "Clerk user.created event"
      pattern: "prisma.user.create"
    - from: "apps/api/src/middleware/auth.ts"
      to: "Clerk JWT verification"
      via: "verifyToken from @clerk/backend"
      pattern: "verifyToken"
---

<objective>
Wire Clerk auth into both the Next.js frontend and the Hono backend, implement the onboarding age gate, and build the COPPA parental consent flow for under-13 users.

Purpose: Auth is the prerequisite for all user-facing features. The COPPA age gate is legally required before any user data is collected for minors. This plan covers FOUND-03.
Output: Sign-in/sign-up pages, Clerk middleware protecting routes, DOB-based age gate, parental consent email flow with 48-hour tokens, and a Clerk webhook that syncs user creation to Postgres.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
@.planning/phases/01-foundation/01-A-SUMMARY.md

<interfaces>
<!-- From Plan A — use these directly -->

From src/lib/db.ts:
```typescript
import { PrismaClient } from '@prisma/client'
export const db: PrismaClient  // singleton
```

From prisma/schema.prisma (relevant models):
```prisma
model User {
  id                    String    @id @default(cuid())
  clerkId               String    @unique
  email                 String    @unique
  dateOfBirth           DateTime?
  isUnder13             Boolean   @default(false)
  parentEmail           String?
  parentConsentAt       DateTime?
  parentConsentToken    String?   @unique
  parentConsentTokenExp DateTime?
}
```
</interfaces>
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Clerk auth middleware + Next.js auth pages</name>
  <files>
    src/middleware.ts
    src/lib/clerk.ts
    src/lib/auth.ts
    src/app/(auth)/sign-in/[[...sign-in]]/page.tsx
    src/app/(auth)/sign-up/[[...sign-up]]/page.tsx
    src/app/(auth)/layout.tsx
  </files>
  <behavior>
    - Middleware protects /dashboard/*, /onboarding/*, and /api/* routes
    - Unauthenticated request to /dashboard redirects to /sign-in
    - Authenticated request to /sign-in redirects to /dashboard
    - getCurrentUser() returns null if no session, User object if authenticated
    - Test: middleware allows public routes (/, /sign-in, /sign-up, /pricing) without auth
    - Test: middleware blocks /dashboard without Clerk session header
  </behavior>
  <action>
Install Clerk: `npm install @clerk/nextjs @clerk/backend --workspace=.` (or ensure it is in package.json).

**src/middleware.ts** — Clerk middleware for Next.js App Router:
```typescript
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/pricing',
  '/api/webhooks/(.*)',
])

const isAuthRoute = createRouteMatcher(['/sign-in(.*)', '/sign-up(.*)'])

export default clerkMiddleware(async (auth, request) => {
  const { userId } = await auth()

  // Redirect authenticated users away from auth pages
  if (isAuthRoute(request) && userId) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Protect non-public routes
  if (!isPublicRoute(request) && !userId) {
    return NextResponse.redirect(new URL('/sign-in', request.url))
  }
})

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)'],
}
```

**src/lib/clerk.ts** — Clerk server helpers:
```typescript
import { auth, currentUser } from '@clerk/nextjs/server'
import { db } from './db'

export async function getAuthUser() {
  const { userId } = await auth()
  if (!userId) return null
  return db.user.findUnique({ where: { clerkId: userId }, include: { subscription: true, tokenBalance: true } })
}

export async function requireAuthUser() {
  const user = await getAuthUser()
  if (!user) throw new Error('Unauthorized')
  return user
}
```

**src/lib/auth.ts** — shared auth utilities:
```typescript
import { auth } from '@clerk/nextjs/server'

export async function getClerkUserId(): Promise<string | null> {
  const { userId } = await auth()
  return userId
}

export function isUnder13(dateOfBirth: Date): boolean {
  const today = new Date()
  const thirteenYearsAgo = new Date(today.getFullYear() - 13, today.getMonth(), today.getDate())
  return dateOfBirth > thirteenYearsAgo
}
```

**src/app/(auth)/layout.tsx** — centered layout with dark background, ForjeGames logo, and gold accent:
```tsx
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0A0E27] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-[#FFB81C]">ForjeGames</h1>
          <p className="text-gray-400 text-sm mt-1">AI-powered game development</p>
        </div>
        {children}
      </div>
    </div>
  )
}
```

**src/app/(auth)/sign-in/[[...sign-in]]/page.tsx** — Clerk SignIn component with dark theme:
```tsx
import { SignIn } from '@clerk/nextjs'
export default function SignInPage() {
  return (
    <SignIn
      appearance={{
        variables: { colorPrimary: '#FFB81C', colorBackground: '#0D1231', colorText: '#ffffff', colorTextSecondary: '#9ca3af' },
        elements: { card: 'shadow-xl border border-white/10', formButtonPrimary: 'bg-[#FFB81C] text-black hover:bg-[#E6A519]' }
      }}
    />
  )
}
```

**src/app/(auth)/sign-up/[[...sign-up]]/page.tsx** — Clerk SignUp component with same dark theme appearance. The Clerk sign-up flow redirects to /onboarding after completion (set NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL="/onboarding" in env).
  </action>
  <verify>
    <automated>cd "C:/Users/Dawse/OneDrive/Desktop/roblox-map-building" && npx tsc --noEmit 2>&1 | grep -i "error" | head -20</automated>
  </verify>
  <done>
    TypeScript compiles without errors.
    `src/middleware.ts` uses clerkMiddleware and exports config with matcher.
    Sign-in and sign-up pages render Clerk components with dark styling.
    Visiting /dashboard without auth redirects to /sign-in.
  </done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: Onboarding age gate + COPPA parental consent flow</name>
  <files>
    src/app/(auth)/onboarding/page.tsx
    src/app/(auth)/onboarding/age-gate/page.tsx
    src/app/(auth)/onboarding/parental-consent/page.tsx
    src/app/(auth)/onboarding/parental-consent/verify/page.tsx
    src/app/api/onboarding/complete/route.ts
    src/app/api/onboarding/parental-consent/route.ts
    src/app/api/onboarding/parental-consent/verify/route.ts
    src/lib/email.ts
    src/lib/tokens.ts
  </files>
  <behavior>
    - POST /api/onboarding/complete with { dateOfBirth } sets isUnder13 if DOB < 13 years ago
    - Under-13 users are redirected to /onboarding/parental-consent after age gate submission
    - POST /api/onboarding/parental-consent sends email with 48-hour token to parentEmail
    - POST /api/onboarding/parental-consent/verify with valid token sets parentConsentAt = now()
    - Expired or invalid token returns 400 with "Token expired or invalid" message
    - Test: isUnder13(new Date('2020-01-01')) returns true (5-year-old)
    - Test: isUnder13(new Date('2005-01-01')) returns false (21-year-old)
    - Test: token generated with generateConsentToken() has 48-hour expiry
  </behavior>
  <action>
**src/lib/tokens.ts** — token generation for parental consent:
```typescript
import crypto from 'crypto'

export function generateConsentToken(): { token: string; expires: Date } {
  const token = crypto.randomBytes(32).toString('hex')
  const expires = new Date(Date.now() + 48 * 60 * 60 * 1000) // 48 hours
  return { token, expires }
}

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex')
}
```

**src/lib/email.ts** — email sending using Resend (or nodemailer with SMTP). Use Resend (`npm install resend`):
```typescript
import { Resend } from 'resend'
const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendParentalConsentEmail({
  parentEmail,
  childName,
  token,
}: {
  parentEmail: string
  childName: string
  token: string
}) {
  const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/onboarding/parental-consent/verify?token=${token}`
  return resend.emails.send({
    from: 'ForjeGames <noreply@forjegames.com>',
    to: parentEmail,
    subject: `Parental consent required for ${childName}'s ForjeGames account`,
    html: `
      <div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;background:#0A0E27;color:white;padding:32px;border-radius:12px">
        <h1 style="color:#FFB81C;margin-bottom:16px">Parental Consent Required</h1>
        <p>Your child <strong>${childName}</strong> (under 13) has signed up for ForjeGames, an AI-powered Roblox game development platform.</p>
        <p>Under the Children's Online Privacy Protection Act (COPPA), we need your consent before ${childName} can use our service.</p>
        <p style="margin:24px 0">
          <a href="${verifyUrl}" style="background:#FFB81C;color:black;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold">Approve Account</a>
        </p>
        <p style="color:#9ca3af;font-size:14px">This link expires in 48 hours. If you did not create this account, you can safely ignore this email.</p>
        <p style="color:#9ca3af;font-size:12px">ForjeGames collects only the minimum data necessary to provide the service. We never sell data. See our <a href="${process.env.NEXT_PUBLIC_APP_URL}/privacy" style="color:#FFB81C">Privacy Policy</a>.</p>
      </div>
    `,
  })
}
```

**src/app/api/onboarding/complete/route.ts** — handles DOB submission:
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { isUnder13 } from '@/lib/auth'
import { z } from 'zod'

const schema = z.object({
  dateOfBirth: z.string().datetime(),
})

export async function POST(req: NextRequest) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid date' }, { status: 400 })

  const dob = new Date(parsed.data.dateOfBirth)
  const under13 = isUnder13(dob)

  await db.user.update({
    where: { clerkId },
    data: { dateOfBirth: dob, isUnder13: under13 },
  })

  return NextResponse.json({ isUnder13: under13, redirect: under13 ? '/onboarding/parental-consent' : '/dashboard' })
}
```

**src/app/api/onboarding/parental-consent/route.ts** — sends consent email:
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { generateConsentToken } from '@/lib/tokens'
import { sendParentalConsentEmail } from '@/lib/email'
import { z } from 'zod'

const schema = z.object({ parentEmail: z.string().email() })

export async function POST(req: NextRequest) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await db.user.findUnique({ where: { clerkId } })
  if (!user?.isUnder13) return NextResponse.json({ error: 'Not applicable' }, { status: 400 })

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid email' }, { status: 400 })

  const { token, expires } = generateConsentToken()

  await db.user.update({
    where: { clerkId },
    data: { parentEmail: parsed.data.parentEmail, parentConsentToken: token, parentConsentTokenExp: expires },
  })

  await sendParentalConsentEmail({
    parentEmail: parsed.data.parentEmail,
    childName: user.displayName || user.email,
    token,
  })

  return NextResponse.json({ ok: true, message: 'Consent email sent. Account locked until parent approves.' })
}
```

**src/app/api/onboarding/parental-consent/verify/route.ts** — verifies consent token (accessed by parent clicking email link):
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')
  if (!token) return NextResponse.redirect(new URL('/error?reason=missing-token', req.url))

  const user = await db.user.findUnique({ where: { parentConsentToken: token } })

  if (!user || !user.parentConsentTokenExp) {
    return NextResponse.redirect(new URL('/error?reason=invalid-token', req.url))
  }

  if (new Date() > user.parentConsentTokenExp) {
    return NextResponse.redirect(new URL('/error?reason=expired-token', req.url))
  }

  await db.user.update({
    where: { id: user.id },
    data: { parentConsentAt: new Date(), parentConsentToken: null, parentConsentTokenExp: null },
  })

  // Audit log this consent event for 5-year retention (per COPPA)
  await db.auditLog.create({
    data: { userId: user.id, action: 'PARENTAL_CONSENT_VERIFIED', resource: 'user', resourceId: user.id, metadata: { parentEmail: user.parentEmail } }
  })

  return NextResponse.redirect(new URL('/onboarding/parental-consent/success', req.url))
}
```

**UI Pages:**

**src/app/(auth)/onboarding/page.tsx** — welcome screen with "Let's get started" heading and a CTA button to the age gate:
```tsx
'use client'
import { useRouter } from 'next/navigation'
export default function OnboardingPage() {
  const router = useRouter()
  return (
    <div className="min-h-screen bg-[#0A0E27] flex items-center justify-center">
      <div className="max-w-md w-full text-center p-8">
        <h1 className="text-3xl font-bold text-white mb-4">Welcome to ForjeGames</h1>
        <p className="text-gray-400 mb-8">Let's set up your account. This takes 30 seconds.</p>
        <button onClick={() => router.push('/onboarding/age-gate')} className="w-full bg-[#FFB81C] text-black font-bold py-3 rounded-lg hover:bg-[#E6A519] transition-colors">
          Get Started
        </button>
      </div>
    </div>
  )
}
```

**src/app/(auth)/onboarding/age-gate/page.tsx** — date of birth form. On submit, POST to /api/onboarding/complete and redirect based on response:
- Input: date picker for date of birth (type="date", max set to today)
- Shows clear label: "When were you born? (required by law)"
- On submit: calls /api/onboarding/complete, redirects to parentalConsent if isUnder13, else /dashboard
- Error state if server returns error

**src/app/(auth)/onboarding/parental-consent/page.tsx** — form asking for parent's email address with explanation of COPPA. On submit, calls /api/onboarding/parental-consent and shows "Check your parent's email" success state.

**src/app/(auth)/onboarding/parental-consent/verify/page.tsx** — success/error page shown after parent clicks link. Shows "Account approved! Tell [child] they can now log in." on success. The actual verification happens in the API route, this is just the landing page.

Add RESEND_API_KEY to .env.example.

Add middleware protection: under-13 users without parentConsentAt cannot access /dashboard — redirect them to /onboarding/parental-consent. Update src/middleware.ts to check this via a DB lookup (or store isUnder13 and parentConsented in Clerk's publicMetadata for edge-friendly access).
  </action>
  <verify>
    <automated>cd "C:/Users/Dawse/OneDrive/Desktop/roblox-map-building" && npx tsc --noEmit 2>&1 | grep -c "error" || echo "0 errors"</automated>
  </verify>
  <done>
    TypeScript compiles without errors.
    Age gate page exists with DOB date input.
    Parental consent API routes exist: POST /api/onboarding/parental-consent sends email, GET /api/onboarding/parental-consent/verify validates token.
    Token expiry logic: tokens created with 48-hour expiry, verified against current time.
    COPPA audit log entry created on consent verification.
    Under-13 users blocked from dashboard until parentConsentAt is set.
  </done>
</task>

<task type="auto">
  <name>Task 3: Clerk webhook → Postgres user sync + Hono auth middleware</name>
  <files>
    apps/api/src/webhooks/clerk.ts
    apps/api/src/middleware/auth.ts
    apps/api/src/routes/auth.ts
    src/app/api/webhooks/clerk/route.ts
  </files>
  <action>
**src/app/api/webhooks/clerk/route.ts** — Clerk webhook handler in Next.js that creates/updates User records in Postgres when Clerk events fire. This is the sync bridge between Clerk (source of auth truth) and Postgres (source of app data):

```typescript
import { headers } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { Webhook } from 'svix'
import { db } from '@/lib/db'

type ClerkUserEvent = {
  type: string
  data: {
    id: string
    email_addresses: Array<{ email_address: string; id: string }>
    primary_email_address_id: string
    first_name: string | null
    last_name: string | null
    image_url: string
    created_at: number
  }
}

export async function POST(req: NextRequest) {
  const body = await req.text()
  const headerPayload = await headers()
  const svixId = headerPayload.get('svix-id')
  const svixTimestamp = headerPayload.get('svix-timestamp')
  const svixSignature = headerPayload.get('svix-signature')

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json({ error: 'Missing svix headers' }, { status: 400 })
  }

  const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET!)
  let event: ClerkUserEvent
  try {
    event = wh.verify(body, { 'svix-id': svixId, 'svix-timestamp': svixTimestamp, 'svix-signature': svixSignature }) as ClerkUserEvent
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (event.type === 'user.created') {
    const primaryEmail = event.data.email_addresses.find(e => e.id === event.data.primary_email_address_id)?.email_address
    if (!primaryEmail) return NextResponse.json({ error: 'No primary email' }, { status: 400 })

    await db.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          clerkId: event.data.id,
          email: primaryEmail,
          displayName: [event.data.first_name, event.data.last_name].filter(Boolean).join(' ') || null,
          avatarUrl: event.data.image_url,
        },
      })
      // Create FREE subscription
      await tx.subscription.create({
        data: {
          userId: user.id,
          stripeCustomerId: `pending_${user.id}`, // will be updated when Stripe customer is created
          tier: 'FREE',
          status: 'ACTIVE',
        },
      })
      // Initialize token balance with 100 free tokens for signup
      await tx.tokenBalance.create({
        data: { userId: user.id, balance: 100, lifetimeEarned: 100 },
      })
      // Audit log
      await tx.auditLog.create({
        data: { userId: user.id, action: 'USER_CREATED', resource: 'user', resourceId: user.id, metadata: { source: 'clerk_webhook' } }
      })
    })
  }

  if (event.type === 'user.updated') {
    const primaryEmail = event.data.email_addresses.find(e => e.id === event.data.primary_email_address_id)?.email_address
    await db.user.update({
      where: { clerkId: event.data.id },
      data: {
        email: primaryEmail,
        displayName: [event.data.first_name, event.data.last_name].filter(Boolean).join(' ') || undefined,
        avatarUrl: event.data.image_url,
      },
    })
  }

  if (event.type === 'user.deleted') {
    await db.user.update({
      where: { clerkId: event.data.id },
      data: { email: `deleted_${event.data.id}@deleted.invalid` }, // soft delete pattern
    })
  }

  return NextResponse.json({ ok: true })
}
```

Install svix: `npm install svix --workspace=.`. Add CLERK_WEBHOOK_SECRET to .env.example.

**apps/api/src/middleware/auth.ts** — Hono middleware that validates Clerk JWT for API routes:
```typescript
import type { Context, Next } from 'hono'
import { createClerkClient } from '@clerk/backend'

const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY! })

export async function requireAuth(c: Context, next: Next) {
  const authHeader = c.req.header('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: 'Missing authorization header' }, 401)
  }
  const token = authHeader.slice(7)
  try {
    const payload = await clerk.verifyToken(token)
    c.set('userId', payload.sub)
    c.set('clerkId', payload.sub)
    await next()
  } catch {
    return c.json({ error: 'Invalid or expired token' }, 401)
  }
}
```

**apps/api/src/routes/auth.ts** — auth-related API routes for Hono (user profile, etc.):
```typescript
import { Hono } from 'hono'
import { requireAuth } from '../middleware/auth'
import { db } from '../lib/db'

export const authRoutes = new Hono()

authRoutes.get('/me', requireAuth, async (c) => {
  const clerkId = c.get('clerkId')
  const user = await db.user.findUnique({
    where: { clerkId },
    include: { subscription: true, tokenBalance: true },
  })
  if (!user) return c.json({ error: 'User not found' }, 404)
  return c.json(user)
})
```

Register authRoutes in apps/api/src/index.ts:
```typescript
import { authRoutes } from './routes/auth'
app.route('/api/auth', authRoutes)
```

Also install `@clerk/backend` in the api workspace: `npm install @clerk/backend --workspace=apps/api`.
  </action>
  <verify>
    <automated>cd "C:/Users/Dawse/OneDrive/Desktop/roblox-map-building" && npx tsc --noEmit 2>&1 | grep -c "error TS" || echo "0"</automated>
  </verify>
  <done>
    TypeScript compiles without errors.
    Webhook route exists at src/app/api/webhooks/clerk/route.ts with svix signature verification.
    On user.created event: creates User, Subscription (FREE tier), TokenBalance (100 tokens) in a single transaction.
    Hono requireAuth middleware validates Bearer token via Clerk's verifyToken.
    GET /api/auth/me returns user profile when authenticated, 401 when not.
  </done>
</task>

</tasks>

<verification>
1. `npx tsc --noEmit` passes — zero TypeScript errors
2. Sign-up flow: create a test account via /sign-up → Clerk account created → webhook fires → User row created in DB with FREE subscription + 100 tokens
3. Age gate: submitting DOB < 13 years ago → redirected to parental consent page
4. Parental consent: submitting parent email → email sent with 48-hour token
5. Token verify: GET /api/onboarding/parental-consent/verify?token=VALID → sets parentConsentAt, logs PARENTAL_CONSENT_VERIFIED audit event
6. Expired token: GET with old token → redirects to /error?reason=expired-token
7. Protected route: GET /dashboard without Clerk session → redirects to /sign-in
8. Hono auth: GET /api/auth/me without Bearer token → 401. With valid token → user object
</verification>

<success_criteria>
- FOUND-03 (all sub-requirements):
  - Clerk sign-up and sign-in pages exist with dark theme
  - Middleware protects /dashboard and /api routes
  - Age gate captures DOB, identifies under-13 users
  - Parental consent flow: email with 48-hour token sent, token verified, parentConsentAt recorded
  - COPPA audit trail: consent events logged with userId + timestamp (AuditLog table)
  - Clerk webhook syncs user creation to Postgres with FREE subscription + 100 token bonus
  - Hono requireAuth middleware validates Clerk JWTs
</success_criteria>

<output>
After completion, create `.planning/phases/01-foundation/01-B-SUMMARY.md` with:
- Auth flow diagram (text-based)
- Clerk webhook events handled and their DB effects
- COPPA consent token TTL and storage pattern
- How other plans should use requireAuth in Hono routes
- Any deviations from the plan
</output>
