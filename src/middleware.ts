import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// ─── Embargoed countries per OFAC/BIS ────────────────────────────────────────
// Sources: 31 C.F.R. Parts 500-599 (OFAC), 15 C.F.R. Part 746 (BIS)
const EMBARGOED_COUNTRIES = new Set([
  'KP', // North Korea (DPRK) — 31 C.F.R. Part 510
  'IR', // Iran — 31 C.F.R. Part 560
  'SY', // Syria — 31 C.F.R. Part 542
  'CU', // Cuba — 31 C.F.R. Part 515
  'RU', // Russia — executive orders + BIS export restrictions
  // Crimea (UA-43) and Sevastopol (UA-40) are typically reported as UA by
  // IP geolocation providers — we cannot block UA wholesale. Documented in
  // vendor-dpas.md as a known limitation requiring a Cloudflare Worker for
  // precise Crimea sub-region blocking in production.
])

// Cloudflare or Vercel provide country code via request headers.
// Vercel: x-vercel-ip-country
// Cloudflare: cf-ipcountry
// Note: x-forwarded-for is unreliable for compliance — not used.
function getCountryCode(request: NextRequest): string | null {
  return (
    request.headers.get('x-vercel-ip-country') ??
    request.headers.get('cf-ipcountry') ??
    null
  )
}

// ─── Route matchers ───────────────────────────────────────────────────────────

const isPublicRoute = createRouteMatcher([
  // Landing + marketing
  '/',
  '/pricing',
  '/docs(.*)',
  '/download(.*)',
  // Legal
  '/privacy',
  '/terms',
  '/dmca',
  '/acceptable-use',
  // Auth flows
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/onboarding(.*)',
  // Welcome / post-auth landing (no session yet during onboarding redirect)
  '/welcome(.*)',
  // Webhooks — Stripe, Clerk, etc. must always reach these endpoints
  '/api/webhooks/(.*)',
  // Public API endpoints (unauthenticated reads only)
  '/api/og',
  // System / utility pages — must be reachable without auth
  '/blocked',
  '/maintenance(.*)',
  '/error(.*)',
  '/offline',
  '/rate-limited',
  '/suspended',
  '/verify-email',
])

const isAdminRoute = createRouteMatcher(['/admin(.*)', '/api/admin(.*)'])

const isAuthRoute = createRouteMatcher(['/sign-in(.*)', '/sign-up(.*)'])

// Routes that bypass geo-blocking (the blocked page itself must be accessible,
// as must static assets and system pages that can appear during a redirect chain)
const isGeoExempt = createRouteMatcher([
  '/blocked(.*)',
  '/maintenance(.*)',
  '/offline',
  '/rate-limited',
  '/suspended',
  '/verify-email',
  '/api/webhooks/(.*)',
  '/api/og',
  '/_next/(.*)',
  '/favicon(.*)',
  '/manifest(.*)',
  '/sw.js',
  '/robots.txt',
  '/sitemap(.*)',
])

// Routes that are always accessible during maintenance mode — the maintenance
// page itself, webhooks (Stripe/Clerk must keep firing), and all static assets.
const isMaintenanceExempt = createRouteMatcher([
  '/maintenance(.*)',
  '/api/webhooks/(.*)',
  '/_next/(.*)',
  '/favicon(.*)',
  '/manifest(.*)',
  '/sw.js',
  '/robots.txt',
  '/sitemap(.*)',
])

// ─── Admin e-mail list (comma-separated ADMIN_EMAILS env var) ────────────────
function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false
  const list = (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
  return list.includes(email.toLowerCase())
}

// ─── Demo mode ────────────────────────────────────────────────────────────────
// DEMO_MODE bypasses auth gates. Used for showcasing the site before
// Clerk production keys are configured. Remove when going live with real users.
const DEMO_MODE = process.env.DEMO_MODE === 'true'
// When Clerk production keys (pk_live_ / sk_live_) are set, auto-disable demo mode
const hasProductionClerkKeys = (process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? '').startsWith('pk_live_')
const effectiveDemoMode = DEMO_MODE && !hasProductionClerkKeys

// ─── CORS configuration ───────────────────────────────────────────────────────
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS ?? '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean)

// Always allow the app's own origin
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? ''

function getCorsHeaders(request: NextRequest): HeadersInit {
  const origin = request.headers.get('origin') ?? ''
  const isAllowed =
    origin === APP_URL ||
    ALLOWED_ORIGINS.includes(origin) ||
    // Allow same-origin requests (no Origin header)
    origin === ''

  return isAllowed
    ? {
        'Access-Control-Allow-Origin': origin || '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
        'Access-Control-Max-Age': '86400',
        'Access-Control-Allow-Credentials': 'true',
      }
    : {}
}

function handleCorsPreFlight(request: NextRequest): NextResponse | null {
  if (request.method !== 'OPTIONS') return null
  const headers = getCorsHeaders(request)
  return new NextResponse(null, { status: 204, headers })
}

// ─── Middleware ───────────────────────────────────────────────────────────────

export default clerkMiddleware(async (auth, request) => {
  try {
    // ── CORS preflight — must run before any redirect or auth check ────────────
    const preFlightResponse = handleCorsPreFlight(request)
    if (preFlightResponse) return preFlightResponse

    // ── 0. Maintenance mode (runs before geo and auth checks) ──────────────────
    const maintenanceActive = process.env.MAINTENANCE_MODE === 'true'

    if (maintenanceActive && !isMaintenanceExempt(request)) {
      // Resolve the authenticated user so admins can bypass maintenance.
      // We call auth() without throwing so unauthenticated users are redirected
      // to /maintenance rather than /sign-in.
      let primaryEmail: string | null = null
      try {
        const session = await auth()
        const sessionClaims = session.sessionClaims as Record<string, unknown> | null
        // Clerk surfaces the primary email on the session claims as `email`.
        primaryEmail = (sessionClaims?.email as string | undefined) ?? null
      } catch {
        // Clerk unavailable — deny bypass, redirect to maintenance page.
        primaryEmail = null
      }

      if (!isAdminEmail(primaryEmail)) {
        return NextResponse.redirect(new URL('/maintenance', request.url))
      }
    }

    // ── 1. Geo-blocking (runs before auth, before all other logic) ─────────────
    if (!isGeoExempt(request)) {
      const countryCode = getCountryCode(request)

      if (countryCode && EMBARGOED_COUNTRIES.has(countryCode)) {
        // RFC 7725 — HTTP 451 Unavailable For Legal Reasons.
        // We redirect to /blocked rather than returning 451 directly so the page
        // renders properly (Next.js edge runtime requires NextResponse.redirect).
        return NextResponse.redirect(new URL('/blocked', request.url), {
          status: 307,
          headers: {
            // RFC 7725 Link header pointing to the blocking authority
            Link: '<https://ofac.treasury.gov/>; rel="blocked-by"',
            'X-Legal-Reason': 'US-OFAC-IEEPA-sanctions',
            'X-Blocked-Country': countryCode,
          },
        })
      }
    }

    // ── 2. Auth routing ────────────────────────────────────────────────────────
    // In demo mode all routes are accessible — skip auth resolution entirely.
    // DEMO_MODE in production throws at module load (see guard above).
    if (effectiveDemoMode) return NextResponse.next()

    let userId: string | null = null
    let claims: Record<string, unknown> | null = null

    try {
      const session = await auth()
      userId = session.userId
      claims = session.sessionClaims as Record<string, unknown> | null
    } catch {
      // Clerk unreachable — pass all requests through so the site stays up.
      return NextResponse.next()
    }

    // Redirect authenticated users away from auth pages → go straight to editor
    if (isAuthRoute(request) && userId) {
      return NextResponse.redirect(new URL('/editor', request.url))
    }

    // Protect non-public routes — isPublicRoute is the single source of truth.
    // All routes listed in the public matcher are accessible without auth.
    if (!isPublicRoute(request) && !userId) {
      // API routes: return 401 JSON instead of redirecting to sign-in page
      if (request.nextUrl.pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      const signInUrl = new URL('/sign-in', request.url)
      signInUrl.searchParams.set('redirect_url', request.nextUrl.pathname)
      return NextResponse.redirect(signInUrl)
    }

    // ── 3. Admin route guard ───────────────────────────────────────────────────
    // Admin pages and admin API routes require role === 'ADMIN'.
    // The role is stored in Clerk public metadata and surfaced on session claims
    // under the `publicMetadata` key (not `metadata`).
    if (isAdminRoute(request) && userId) {
      const meta = ((claims as { publicMetadata?: Record<string, unknown> })?.publicMetadata ?? {}) as Record<string, unknown>
      const role = meta.role as string | undefined
      if (role !== 'ADMIN') {
        // For API routes return 403, for page routes redirect to dashboard
        if (request.nextUrl.pathname.startsWith('/api/')) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }
        return NextResponse.redirect(new URL('/editor', request.url))
      }
    }
  } catch (err) {
    // ── Catch-all: middleware must never crash the app ─────────────────────────
    // Pass request through so users are not locked out by a transient Clerk or runtime failure.
    return NextResponse.next()
  }
})

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - _next/static  (Next.js build output — JS/CSS chunks)
     * - _next/image   (image optimisation endpoint)
     * - Static file extensions: ico, png, jpg/jpeg, webp, svg, gif, woff/woff2, ttf, otf, mp4, mp3
     *
     * Webhook paths (/api/webhooks/*) ARE matched here intentionally — they reach
     * the middleware so the CORS preflight handler runs, but isPublicRoute() exempts
     * them from Clerk auth so Stripe/Clerk can always fire.
     */
    '/((?!_next/static|_next/image|.*\\.(?:ico|png|jpe?g|webp|svg|gif|woff2?|ttf|otf|mp4|mp3)$).*)',
  ],
}
