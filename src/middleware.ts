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
  '/showcase(.*)',
  '/about',
  '/blog(.*)',
  '/changelog',
  // Editor — accessible without auth (guest mode with limited free messages)
  '/editor(.*)',
  // AI chat — handles auth internally (guest gets limited demo responses)
  '/api/ai/(.*)',
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
  // Onboarding API routes — must be reachable before a Clerk session is
  // fully established (e.g. age-gate POST runs immediately after sign-up
  // before the session cookie propagates). Each route handles auth internally.
  '/api/onboarding/(.*)',
  // Webhooks — Stripe, Clerk, etc. must always reach these endpoints
  '/api/webhooks/(.*)',
  // Studio plugin + auth — must be public so:
  // 1. Plugin can be downloaded without auth
  // 2. Connection codes can be generated from guest editor
  // 3. Plugin can claim codes and poll sync from Roblox Studio (no cookies)
  '/api/studio/(.*)',
  // Public connect page — shows plugin download + setup instructions.
  // Generating the 6-char code calls /api/studio/auth which is already public.
  // Auth is only needed to redirect into /editor after connection.
  '/connect(.*)',
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
  '/unsubscribe',
  '/api/email/unsubscribe',
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
const ADMIN_EMAIL_SET = new Set(
  (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
)

function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false
  return ADMIN_EMAIL_SET.has(email.toLowerCase())
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
    ALLOWED_ORIGINS.includes(origin)

  if (!origin || !isAllowed) return {}

  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Access-Control-Max-Age': '86400',
    'Access-Control-Allow-Credentials': 'true',
  }
}

function handleCorsPreFlight(request: NextRequest): NextResponse | null {
  if (request.method !== 'OPTIONS') return null
  const headers = getCorsHeaders(request)
  return new NextResponse(null, { status: 204, headers })
}

// ─── Middleware ───────────────────────────────────────────────────────────────

export default clerkMiddleware(async (auth, request) => {
  // ── DEMO_MODE production guard ─────────────────────────────────────────────
  if (process.env.DEMO_MODE === 'true' && process.env.NODE_ENV === 'production' && process.env.ALLOW_DEMO_PROD !== 'true') {
    throw new Error(
      '[SECURITY] DEMO_MODE=true is not permitted in production. ' +
      'Set DEMO_MODE=false or set ALLOW_DEMO_PROD=true to explicitly override.'
    )
  }

  try {
    // ── CORS preflight — must run before any redirect or auth check ────────────
    const preFlightResponse = handleCorsPreFlight(request)
    if (preFlightResponse) return preFlightResponse

    // ── Inject x-pathname header so Server Component layouts can read the
    //    current path without relying on searchParams or unstable headers. ──────
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-pathname', request.nextUrl.pathname)

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
    if (effectiveDemoMode) return NextResponse.next({ request: { headers: requestHeaders } })

    let userId: string | null = null
    let claims: Record<string, unknown> | null = null

    try {
      const session = await auth()
      userId = session.userId
      claims = session.sessionClaims as Record<string, unknown> | null
    } catch {
      // Clerk unreachable — pass all requests through so the site stays up.
      return NextResponse.next({ request: { headers: requestHeaders } })
    }

    // Age-gate guard: authenticated users who have not completed the age gate
    // must be redirected to /onboarding/age-gate before accessing any protected route.
    // Check both top-level claims and publicMetadata (where the age-gate API stores it).
    const meta = ((claims as { publicMetadata?: Record<string, unknown> })?.publicMetadata ?? {}) as Record<string, unknown>
    const dateOfBirth = (claims as { dateOfBirth?: string | null } | null)?.dateOfBirth
      ?? (meta.dateOfBirth as string | null | undefined)
      ?? null
    if (userId && !dateOfBirth && !isPublicRoute(request)) {
      const ageGateUrl = new URL('/onboarding/age-gate', request.url)
      if (request.nextUrl.pathname !== '/onboarding/age-gate') {
        return NextResponse.redirect(ageGateUrl)
      }
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
      // Validate redirect_url to prevent open redirect (must be a relative path)
      const redirectPath = request.nextUrl.pathname
      if (redirectPath.startsWith('/') && !redirectPath.startsWith('//')) {
        signInUrl.searchParams.set('redirect_url', redirectPath)
      }
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

    // Pass-through: forward the injected x-pathname header to all Server Components.
    return NextResponse.next({ request: { headers: requestHeaders } })
  } catch (err) {
    // ── Catch-all: middleware must never crash the app ─────────────────────────
    // Admin routes return 503 on transient failure — never silently pass through
    // to protected admin UI when auth state is unknown.
    if (isAdminRoute(request)) {
      return new NextResponse('Service Unavailable', { status: 503 })
    }
    // For all other routes, pass through so users are not locked out by a
    // transient Clerk or runtime failure.
    // Note: requestHeaders may not be initialised if the error was thrown before
    // that assignment (e.g. the DEMO_MODE production guard). Fall back gracefully.
    try {
      const fallbackHeaders = new Headers(request.headers)
      fallbackHeaders.set('x-pathname', request.nextUrl.pathname)
      return NextResponse.next({ request: { headers: fallbackHeaders } })
    } catch {
      return NextResponse.next()
    }
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
