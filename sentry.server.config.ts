import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  enabled: !!(process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN),
  integrations: [Sentry.prismaIntegration()],

  // Attach request-scoped user context to every server-side event.
  // Clerk's userId is pulled from the async-local-storage context that
  // @sentry/nextjs sets up — no manual withSentry() wrapper needed.
  // We never forward IP addresses (COPPA / GDPR).
  beforeSend(event) {
    if (event.user) {
      delete event.user.ip_address
      delete event.user.email // strip PII — userId is enough for triage
    }
    return event
  },

  // Global tags attached to every event — useful for filtering in Sentry UI.
  initialScope: {
    tags: {
      app: 'forjegames',
      runtime: 'nodejs',
    },
  },
})
