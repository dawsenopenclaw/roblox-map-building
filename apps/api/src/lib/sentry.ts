import * as Sentry from '@sentry/node'

export function initSentry() {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV,
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    enabled: !!process.env.SENTRY_DSN,
    integrations: [Sentry.prismaIntegration(), Sentry.httpIntegration()],
  })
}

export function captureException(err: unknown, context?: Record<string, unknown>) {
  Sentry.captureException(err, { extra: context })
}
