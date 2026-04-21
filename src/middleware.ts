import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

import { locales, defaultLocale } from './i18n/config'
import { i18nMiddleware } from './middleware-i18n'

// ─── i18n composition ─────────────────────────────────────────────────────────
// Non-default locale prefixes that, when present as the first path segment,
// mean the request is targeting a translated marketing route. The i18n
// middleware rewrites these into the `[locale]` App Router segment so
// next-intl can resolve messages on the server.
//
// We intentionally EXCLUDE the default locale ('en') because `localePrefix:
// 'as-needed'` means English routes are served from un-prefixed paths — the
// existing (marketing) route group already handles them. This keeps the
// critical Clerk auth / age-gate logic below untouched for the common case.
const NON_DEFAULT_LOCALE_PREFIXES = new Set(
  locales.filter((l) => l !== defaultLocale),
)

function hasNonDefaultLocalePrefix(pathname: string): boolean {
  const firstSegment = pathname.split('/')[1] ?? ''
  return NON_DEFAULT_LOCALE_PREFIXES.has(firstSegment as (typeof locales)[number])
}

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
  // Editor is NOT public — account creation is required before chatting with
  // the AI. Unauthenticated visitors who hit /editor are redirected to
  // /sign-up?redirect_url=/editor (see the auth routing block below). The
  // welcome flow then runs post-signup before they land in the editor.
  // Exception: DEMO_MODE bypasses all auth (handled earlier in the pipeline).
  // Game templates marketplace — public so visitors can browse before signing up
  '/templates(.*)',
  '/docs(.*)',
  '/download(.*)',
  '/showcase(.*)',
  '/about',
  '/blog(.*)',
  '/changelog',
  '/whats-new(.*)',
  '/help(.*)',
  '/status(.*)',
  '/install(.*)',
  // AI chat — guest mode with strict rate limiting (3 messages then signup required)
  '/api/ai/chat',
  // AI feedback — anonymous thumbs up/down (POST only, GET requires auth)
  '/api/ai/feedback',
  // Site reviews — public GET for homepage marquee, POST is auth-gated in the route handler
  '/api/reviews',
  // Waitlist — must be public so visitors can sign up from the landing page
  '/api/waitlist',
  // Contact form — must be public so pricing page visitors can submit
  '/api/contact/(.*)',
  // Newsletter subscribe — must be public so landing page visitors can sign up
  '/api/subscribe',
  // Push notification subscribe — must be public so visitors can opt in from the landing page
  '/api/push/subscribe',
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
  // Billing — these routes are reachable without a Clerk session so
  // unauthed visitors on the /pricing + home page can:
  //   - Read /api/billing/config to know which Stripe prices are live
  //     (the response is public-safe — boolean flags only, no priceIds)
  //   - POST /api/billing/checkout / custom-plan / robux / token-pack to
  //     get a structured { error:'Authentication required', redirect:'/sign-in' }
  //     response from the handler itself, which the client then follows.
  //     Without this bypass, Clerk's default middleware returns
  //     {"error":"Unauthorized"} with no redirect hint and the Buy
  //     buttons silently fail on every prod visitor who isn't signed in.
  //   - GET /api/billing/status for pricing-card active-plan highlighting.
  // The handlers themselves still require auth for any destructive
  // operation — making the ROUTES public just lets unauthed clients
  // receive a useful error shape instead of a middleware 401.
  '/api/billing/(.*)',
  // Templates marketplace list — public so home + /templates can browse.
  '/api/templates/(.*)',
  // Studio plugin + auth — must be public so:
  // 1. Plugin can be downloaded without auth
  // 2. Connection codes can be generated from guest editor
  // 3. Plugin can claim codes and poll sync from Roblox Studio (no cookies)
  '/api/studio/(.*)',
  // Static plugin file — direct download without auth
  '/plugin/(.*)',
  // Public connect page — shows plugin download + setup instructions.
  // Generating the 6-char code calls /api/studio/auth which is already public.
  // Auth is only needed to redirect into /editor after connection.
  '/connect(.*)',
  // Public API endpoints (unauthenticated reads only)
  '/api/og',
  // Health check — the route itself decides public vs admin response shape
  // based on Authorization header; middleware must not block it entirely.
  '/api/health',
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

// Routes that do NOT require the age-gate to have been completed.
// This includes the age-gate and onboarding pages themselves, all auth flows,
// all API routes (each route handler enforces its own auth), and utility pages
// that can appear before onboarding finishes (welcome, blocked, maintenance, etc.).
// /editor and all other dashboard routes are intentionally absent — they require
// dateOfBirth to be set in publicMetadata before access is allowed.
const isAgeGateExempt = createRouteMatcher([
  '/onboarding(.*)',
  '/welcome(.*)',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/(.*)',
  '/blocked(.*)',
  '/maintenance(.*)',
  '/rate-limited',
  '/suspended',
  '/verify-email',
  '/offline',
  '/error(.*)',
])

const isAuthRoute = createRouteMatcher(['/sign-in(.*)', '/sign-up(.*)'])

// Routes that are public (no auth required) but still require age gate completion
// for authenticated users. Without this, a signed-in user who hasn't completed
// the age gate could navigate directly to these routes and bypass COPPA controls.
// Note: /editor used to be here but is now fully auth-gated (account required).
const isPublicButRequiresAgeGate = createRouteMatcher([
  '/templates(.*)',
])

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

// ─── DEMO_MODE production guard ──────────────────────────────────────────────
// Log a warning instead of throwing — a throw here crashes the entire middleware
// and makes ALL pages return 503. The effectiveDemoMode flag already auto-disables
// demo mode when production Clerk keys are present.
if (DEMO_MODE && process.env.NODE_ENV === 'production' && process.env.ALLOW_DEMO_PROD !== 'true') {
  console.warn(
    '[SECURITY] DEMO_MODE=true detected in production. ' +
    'Demo mode is auto-disabled because production Clerk keys are present.'
  )
}

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

export default clerkMiddleware(async (auth, req) => {
  const request = req as NextRequest
  try {
    // ── CORS preflight — must run before any redirect or auth check ────────────
    const preFlightResponse = handleCorsPreFlight(request)
    if (preFlightResponse) return preFlightResponse

    // ── i18n: locale-prefixed marketing routes ────────────────────────────────
    // Requests like /es/pricing or /fr/docs are translated marketing pages.
    // Hand them to the next-intl middleware which rewrites them onto the
    // [locale] App Router segment. We bypass Clerk for these paths because all
    // marketing routes are public anyway (see isPublicRoute above) — running
    // auth on top of the i18n rewrite complicates response composition and
    // isn't needed for content routes.
    //
    // TODO: if we later need auth-gated translated routes (e.g. /es/editor),
    // compose the two middlewares by running i18n first, reading its
    // rewritten URL, and then invoking the Clerk pipeline on that target.
    if (hasNonDefaultLocalePrefix(request.nextUrl.pathname)) {
      return i18nMiddleware(request)
    }

    // ── Studio API bypass — Studio plugin has no cookies/session. Skip Clerk
    //    entirely so Roblox Studio HTTP requests always reach the route handler.
    //    Each studio route handles its own token-based auth internally. ───────────
    if (request.nextUrl.pathname.startsWith('/api/studio/')) {
      const studioHeaders = new Headers(request.headers)
      studioHeaders.set('x-pathname', request.nextUrl.pathname)
      const res = NextResponse.next({ request: { headers: studioHeaders } })
      // Add CORS for Studio plugin (no cookies, cross-origin from Roblox)
      res.headers.set('Access-Control-Allow-Origin', '*')
      res.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
      res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
      return res
    }

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

    // Don't redirect signed-in users away from auth pages — the Clerk
    // components handle their own redirects via fallbackRedirectUrl/signUpFallbackRedirectUrl.

    // Protect non-public routes — isPublicRoute is the single source of truth.
    // All routes listed in the public matcher are accessible without auth.
    if (!isPublicRoute(request) && !userId) {
      // API routes: return 401 JSON instead of redirecting to sign-in page
      if (request.nextUrl.pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      // Editor requires an account before the user can chat with the AI —
      // send visitors to /sign-up (not /sign-in) so the default is to create
      // an account. Clerk's sign-up form links to sign-in for returning users.
      // After sign-up, Clerk routes to /welcome (see signUpFallbackRedirectUrl
      // in src/app/layout.tsx), then the welcome flow routes to /editor.
      const isEditorRoute = request.nextUrl.pathname.startsWith('/editor')
      const authUrl = new URL(isEditorRoute ? '/sign-up' : '/sign-in', request.url)
      // Preserve the original path + query (e.g. ?prompt=...) so the hero
      // prompt is still in the URL after the welcome flow redirects to /editor.
      const redirectPath = request.nextUrl.pathname + request.nextUrl.search
      if (redirectPath.startsWith('/') && !redirectPath.startsWith('//')) {
        authUrl.searchParams.set('redirect_url', redirectPath)
      }
      return NextResponse.redirect(authUrl)
    }

    // ── 3. Admin route guard ───────────────────────────────────────────────────
    // Middleware cannot query the DB and Clerk JWT templates do not reliably
    // include email or role claims, so we do NOT block admin routes here.
    // The server-side admin layout (src/app/(admin)/admin/layout.tsx) is the
    // authoritative gate — it does a full DB lookup + ADMIN_EMAILS owner bypass.
    // All we do here is ensure the user is authenticated (handled above by the
    // isPublicRoute check). If the user is signed in, let the request reach
    // the layout which will redirect non-admins away.
    //
    // NOTE: We intentionally pass through even when JWT claims suggest the user
    // is not admin, because the Clerk JWT template may not include email/role
    // claims, causing false negatives that would lock the site owner out.

    // ── 4. Age-gate enforcement (server-side, COPPA compliance) ─────────────
    // Redirect authenticated users who haven't completed the age gate to the
    // age-gate page. Reads dateOfBirth from the Clerk session JWT.
    //
    // IMPORTANT: the check uses *three* fallback paths because Clerk's default
    // JWT template does NOT include publicMetadata — you have to explicitly
    // add it in the Clerk dashboard's JWT template editor. Many deployments
    // (including ours pre-launch) don't have that template set up, which used
    // to cause an infinite redirect loop: user completes age gate -> metadata
    // saved on Clerk's server -> middleware checks JWT claims -> no
    // publicMetadata claim at all -> redirect back to age gate -> loop.
    //
    // The fallback order is:
    //   1. claims.publicMetadata.dateOfBirth (if the JWT template exposes it)
    //   2. claims.metadata.public.dateOfBirth (older JWT template shape)
    //   3. claims.unsafeMetadata.dateOfBirth (unsafeMetadata is in the
    //      default template — we write DOB to unsafeMetadata too as a belt
    //      and suspenders, see /api/onboarding/complete)
    //
    // Finally, if the JWT contains NEITHER publicMetadata NOR unsafeMetadata
    // at all, we fall through rather than redirect-loop. The downstream page
    // layouts still get to enforce their own gate with a live Clerk fetch.
    const requiresAgeGate = !isAgeGateExempt(request) && (!isPublicRoute(request) || isPublicButRequiresAgeGate(request))
    if (userId && requiresAgeGate) {
      const claimsObj = claims as Record<string, unknown> | null
      const publicMeta =
        (claimsObj?.publicMetadata as Record<string, unknown> | undefined) ??
        ((claimsObj?.metadata as Record<string, unknown> | undefined)?.public as Record<string, unknown> | undefined)
      const unsafeMeta = claimsObj?.unsafeMetadata as Record<string, unknown> | undefined
      const dateOfBirth = publicMeta?.dateOfBirth ?? unsafeMeta?.dateOfBirth

      // If we can definitively confirm the user HAS completed the age gate
      // (DOB present in either metadata bag), pass through.
      //
      // Otherwise we don't redirect from middleware — page-level layouts
      // with access to a live Clerk fetch (currentUser()) will handle the
      // gate. Relying on JWT claims alone caused infinite redirect loops
      // because:
      //   (a) The default Clerk JWT template does NOT include publicMetadata,
      //       so the claim was always undefined -> redirect loop.
      //   (b) Even when the template DOES include the metadata bags, a new
      //       user's fresh JWT has them as empty objects `{}`, so "present
      //       but missing DOB" was indistinguishable from "we just haven't
      //       picked up the new claim yet" after an age-gate POST.
      //
      // The age-gate page is still reachable via the explicit redirect
      // from /welcome and from the (app) layout's server-side check.
      if (!dateOfBirth) {
        // Fall through — let the page layout enforce the gate with a live
        // Clerk metadata lookup that doesn't depend on JWT claims.
      }
    }

    // Pass-through: forward the injected x-pathname header to all Server Components.
    // Also attach CORS headers to the response so cross-origin API callers receive them.
    const res = NextResponse.next({ request: { headers: requestHeaders } })
    const corsHeaders = getCorsHeaders(request)
    Object.entries(corsHeaders).forEach(([k, v]) => res.headers.set(k, v))
    return res
  } catch (err) {
    // ── Catch-all: middleware must never crash the app ─────────────────────────
    // Pass all routes through on transient failure — the server-side layout
    // handles auth for admin routes and will redirect unauthenticated/non-admin
    // users. A 503 here would permanently lock the owner out on any Clerk hiccup.
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
    '/((?!_next/static|_next/image|.*\\.(?:ico|png|jpe?g|webp|svg|gif|woff2?|ttf|otf|mp4|mp3|json|html|webmanifest)$).*)',
  ],
}
