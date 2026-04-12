import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

// Wire next-intl's server config so useTranslations / getTranslations can
// resolve messages on the server. See src/i18n/request.ts.
const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')

// Build-time Clerk key sanity check.
// If we're doing a production build with `pk_test_` / `sk_test_` values, log a
// loud yellow warning so it surfaces in Vercel build logs. See
// docs/CLERK_PRODUCTION_SETUP.md for the full key swap procedure.
;(function warnOnDevClerkKeysInProd() {
  const isProdBuild =
    process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV === 'production'
  if (!isProdBuild) return

  const pk = (process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? '').replace(/\\n$/, '').trim()
  const sk = (process.env.CLERK_SECRET_KEY ?? '').replace(/\\n$/, '').trim()
  const pkIsTest = pk.startsWith('pk_test_')
  const skIsTest = sk.startsWith('sk_test_')

  if (pkIsTest || skIsTest) {
    const yellow = '\x1b[33m'
    const bold = '\x1b[1m'
    const reset = '\x1b[0m'
    const banner = `${yellow}${bold}⚠  Clerk development keys detected in a production build${reset}`
    const which = [pkIsTest && 'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY', skIsTest && 'CLERK_SECRET_KEY']
      .filter(Boolean)
      .join(', ')
    // eslint-disable-next-line no-console
    console.warn(
      `\n${banner}\n${yellow}  ${which} still use pk_test_/sk_test_ values.\n` +
        `  The browser will show a "development keys" warning and Clerk will rate-limit the instance.\n` +
        `  Replace with production keys from https://dashboard.clerk.com\n` +
        `  Full guide: docs/CLERK_PRODUCTION_SETUP.md${reset}\n`,
    )
  }
})()

// Content-Security-Policy directive builder.
// Keep it strict — add sources only when a real integration requires it.
// 'unsafe-inline' for style-src is required by Tailwind's runtime injection in dev;
// in production, switch to a nonce-based approach once SSR nonce support is wired up.
const isDev = process.env.NODE_ENV === 'development'

const cspDirectives = [
  // Only load scripts from our own origin and Clerk's CDN
  "default-src 'self'",
  // 'unsafe-eval' required in dev for Next.js React Fast Refresh — never allowed in prod
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''} https://clerk.forjegames.com https://*.clerk.accounts.dev https://challenges.cloudflare.com https://js.stripe.com`,
  // Styles: self + inline (Tailwind) + Google Fonts
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  // Fonts
  "font-src 'self' https://fonts.gstatic.com",
  // Images: self + Clerk avatars + Roblox CDN + S3/R2 + Meshy thumbnails
  "img-src 'self' data: blob: https://img.clerk.com https://images.clerk.dev https://*.rbxcdn.com https://thumbnails.roblox.com https://*.amazonaws.com https://*.r2.dev https://assets.meshy.ai",
  // Connections: self + API calls to AI providers, payments, auth, analytics + dev HMR
  `connect-src 'self' https://clerk.forjegames.com https://*.clerk.accounts.dev https://clerk-telemetry.com https://api.openai.com https://api.anthropic.com https://generativelanguage.googleapis.com https://api.groq.com https://*.fal.run https://api.meshy.ai https://api.stripe.com https://*.upstash.io https://*.sentry.io https://*.ingest.sentry.io https://thumbnails.roblox.com https://users.roblox.com wss://*.clerk.accounts.dev https://app.posthog.com https://us.i.posthog.com https://eu.i.posthog.com${isDev ? ' ws://localhost:3000 ws://localhost:3001' : ''}`,
  // Frames: Stripe only (for Stripe Elements / payment UI)
  "frame-src https://js.stripe.com https://hooks.stripe.com https://challenges.cloudflare.com",
  // Workers: none
  "worker-src 'self' blob:",
  // Block all object/embed elements
  "object-src 'none'",
  // Block base tag overrides
  "base-uri 'self'",
  // Disallow form submissions to third-party origins
  "form-action 'self'",
  // Defense-in-depth: deny framing (redundant with X-Frame-Options)
  "frame-ancestors 'none'",
  // Upgrade insecure requests in production only (breaks localhost)
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
].join('; ')

const nextConfig: NextConfig = {
  async redirects() {
    return []
  },
  async headers() {
    // Defense-in-depth security headers applied to every route.
    // CSP is kept separate because it's complex and environment-dependent.
    // Note: microphone=(self) is allowed for the voice input feature.
    const securityHeaders = [
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      {
        key: 'Strict-Transport-Security',
        value: 'max-age=63072000; includeSubDomains; preload',
      },
      {
        key: 'Permissions-Policy',
        value: 'camera=(), microphone=(self), geolocation=(), interest-cohort=()',
      },
      { key: 'X-DNS-Prefetch-Control', value: 'on' },
      { key: 'X-XSS-Protection', value: '1; mode=block' },
      { key: 'Content-Security-Policy', value: cspDirectives },
    ]

    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ]
  },
  reactStrictMode: true,
  typescript: {
    // Skip tsc during `next build` for the same reason ESLint is skipped
    // below: the full-project type check OOMs on 8GB workers (verified both
    // locally and on Vercel — the last Ready production deploy was 1 day ago
    // and every build since the mega-session merges has been hung in the
    // "Checking validity of types" phase for 20+ minutes before timing out).
    //
    // We run targeted typechecks via `tsconfig.spotcheck.json` per PR — see
    // session_handoff_apr10_late2.md under "Known quirks discovered this
    // session". CI's `npm run typecheck` still runs the full check, but in a
    // larger runner where OOM is less of a concern.
    //
    // TO RE-ENABLE: split src/ into multiple tsconfig.json projects with
    // references so the type graph fits in memory, then flip back to false.
    ignoreBuildErrors: true,
  },
  eslint: {
    // Skip lint during `next build` — Next runs lint as a separate phase that
    // shells out to ESLint with its own Node process. With ~200 components and
    // many large files, the lint phase has been the OOM hog (8GB heap exhausted
    // after the warning collection step). We run lint separately via
    // `npm run lint` in CI/dev. See COMMIT-NOTES for full reasoning.
    ignoreDuringBuilds: true,
  },
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      'framer-motion',
      'motion',
      'recharts',
      '@clerk/nextjs',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-popover',
      '@radix-ui/react-select',
      '@radix-ui/react-tabs',
      '@radix-ui/react-tooltip',
      'date-fns',
    ],
  },
  // Force the Studio plugin .rbxmx files into the /api/studio/plugin route
  // bundle. Next's file tracer doesn't reliably follow
  // `fs.readFileSync(process.cwd() + "public/...")` because the path is
  // constructed at runtime. Without this, Vercel deploys serve a stale
  // copy of public/plugin/ForjeGames.rbxmx from an older build cache —
  // which is exactly what was happening before this fix.
  outputFileTracingIncludes: {
    '/api/studio/plugin': [
      './public/plugin/ForjeGames.rbxmx',
      './public/plugin/ForjeGames-store.rbxmx',
    ],
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    // Limit generated size variants — reduces cold-start work on the image endpoint
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'img.clerk.com',
      },
      {
        protocol: 'https',
        hostname: 'images.clerk.dev',
      },
      {
        protocol: 'https',
        hostname: 'tr.rbxcdn.com',
      },
      {
        protocol: 'https',
        hostname: '*.rbxcdn.com',
      },
      {
        protocol: 'https',
        hostname: 'thumbnails.roblox.com',
      },
      {
        protocol: 'https',
        hostname: '*.amazonaws.com',
      },
      {
        protocol: 'https',
        hostname: '*.r2.dev',
      },
      {
        protocol: 'https',
        hostname: 'assets.meshy.ai',
      },
    ],
  },
}

// Compose: next-intl wraps nextConfig first, then Sentry wraps the result.
// In development we skip Sentry entirely to avoid Turbopack incompatibilities
// (require-in-the-middle external warnings, instrumentation hook parse errors).
// Production builds still wrap with Sentry for source maps + auto-instrumentation.
const nextConfigWithIntl = withNextIntl(nextConfig)

const isDevelopment = process.env.NODE_ENV !== 'production'
// Escape hatch: when NEXT_SKIP_SENTRY=1 the prod build won't wrap with Sentry.
// Useful to verify a build passes without Sentry's webpack plugin interfering
// with edge route emission (we've seen "Cannot find module for page: /api/og"
// errors during collectPageData when the plugin is active).
const skipSentry = process.env.NEXT_SKIP_SENTRY === '1'

let finalConfig: NextConfig = nextConfigWithIntl

if (!isDevelopment && !skipSentry) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { withSentryConfig } = require('@sentry/nextjs')
  finalConfig = withSentryConfig(nextConfigWithIntl, {
    org: process.env.SENTRY_ORG,
    project: process.env.SENTRY_PROJECT,
    silent: true,
    widenClientFileUpload: true,
    autoInstrumentServerFunctions: true,
    disableLogger: true,
    authToken: process.env.SENTRY_AUTH_TOKEN,
  })
}

export default finalConfig
