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
  '/api/webhooks/(.*)',
  '/error(.*)',
])

const isAuthRoute = createRouteMatcher(['/sign-in(.*)', '/sign-up(.*)'])

// Routes that bypass geo-blocking (the blocked page itself must be accessible)
const isGeoExempt = createRouteMatcher([
  '/blocked(.*)',
  '/api/webhooks/(.*)',
  '/_next/(.*)',
  '/favicon.ico',
])

// ─── Middleware ───────────────────────────────────────────────────────────────

export default clerkMiddleware(async (auth, request) => {
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
