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
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/pricing',
  '/privacy',
  '/terms',
  '/dmca',
  '/acceptable-use',
  '/blocked',
  '/maintenance(.*)',
  '/api/webhooks/(.*)',
  '/error(.*)',
])

const isAdminRoute = createRouteMatcher(['/admin(.*)', '/api/admin(.*)'])

const isAuthRoute = createRouteMatcher(['/sign-in(.*)', '/sign-up(.*)'])

// Routes that bypass geo-blocking (the blocked page itself must be accessible)
const isGeoExempt = createRouteMatcher([
  '/blocked(.*)',
  '/maintenance(.*)',
  '/api/webhooks/(.*)',
  '/_next/(.*)',
  '/favicon.ico',
])

// Routes that admin users (checked via x-robloxforge-role header or env-configured
// admin email list) are allowed to access even during maintenance mode.
// The maintenance page itself is always accessible to everyone.
const isMaintenanceExempt = createRouteMatcher([
  '/maintenance(.*)',
  '/api/webhooks/(.*)',
  '/_next/(.*)',
  '/favicon.ico',
])

// ─── Middleware ───────────────────────────────────────────────────────────────

// ─── Admin e-mail list (comma-separated ADMIN_EMAILS env var) ────────────────
function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false
  const list = (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
  return list.includes(email.toLowerCase())
}

export default clerkMiddleware(async (auth, request) => {
  // ── 0. Maintenance mode (runs before geo and auth checks) ────────────────────
  const maintenanceActive = process.env.MAINTENANCE_MODE === 'true'

  if (maintenanceActive && !isMaintenanceExempt(request)) {
    // Resolve the authenticated user so admins can bypass maintenance.
    // We call auth() without throwing so unauthenticated users are redirected
    // to /maintenance rather than /sign-in.
    const session = await auth()
    const sessionClaims = session.sessionClaims as Record<string, unknown> | null

    // Clerk surfaces the primary email on the session claims as `email`.
    // This avoids a round-trip to the Clerk backend SDK.
    const primaryEmail =
      (sessionClaims?.email as string | undefined) ??
      null

    if (!isAdminEmail(primaryEmail)) {
      return NextResponse.redirect(new URL('/maintenance', request.url))
    }
  }

  // ── 1. Geo-blocking (runs before auth, before all other logic) ───────────────
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

  // ── 2. Auth routing ──────────────────────────────────────────────────────────
  const { userId, sessionClaims: claims } = await auth()

  // Redirect authenticated users away from auth pages
  if (isAuthRoute(request) && userId) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Protect non-public routes
  if (!isPublicRoute(request) && !userId) {
    return NextResponse.redirect(new URL('/sign-in', request.url))
  }

  // ── 3. Admin route guard ──────────────────────────────────────────────────────
  // Admin pages and admin API routes require role === 'ADMIN'.
  // The role is stored in Clerk public metadata and surfaced on session claims
  // under the `publicMetadata` key (not `metadata`).
  if (isAdminRoute(request)) {
    if (!userId) {
      // Unauthenticated: redirect to sign-in (never silently fall through)
      if (request.nextUrl.pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      return NextResponse.redirect(new URL('/sign-in', request.url))
    }

    const meta = (claims?.publicMetadata ?? {}) as Record<string, unknown>
    const role = meta.role as string | undefined
    if (role !== 'ADMIN') {
      // For API routes return 403, for page routes redirect to dashboard
      if (request.nextUrl.pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }
})

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)'],
}
