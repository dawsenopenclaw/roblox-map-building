import { initSentry, captureException } from './lib/sentry'
// Sentry must be initialized before any other imports that might throw
initSentry()

import { Hono } from 'hono'
import { serve } from '@hono/node-server'
import { logger as honoLogger } from 'hono/logger'
import { secureHeaders } from 'hono/secure-headers'
import { healthRoute } from './routes/health'
import { authRoutes } from './routes/auth'
import { tokenRoutes } from './routes/tokens'
import { sandboxRoutes } from './routes/sandbox'
import { costTrackerRoutes } from './routes/cost-tracker'
import { voiceRoutes } from './routes/ai/voice'
import { imageRoutes } from './routes/ai/image'
import { generateRoutes } from './routes/ai/generate'
import { studioRoutes } from './routes/studio'
import { screenshotRoutes } from './routes/studio/screenshot'
import { stateRoutes } from './routes/studio/state'
import { executeRoutes } from './routes/studio/execute'
import { dnaRoutes } from './routes/dna/scan'
import { teamRoutes } from './routes/teams'
import { versionRoutes } from './routes/versions'
import { apiKeyRoutes } from './routes/api-keys'
import { webhookRoutes } from './routes/webhooks'
import { referralRoutes } from './routes/referrals'
import { notificationRoutes } from './routes/notifications'
import { earningsRoutes } from './routes/earnings'
import { marketplaceSearchRoutes } from './routes/marketplace/search'
import { adminRoutes } from './routes/admin'
import { corsMiddleware, apiRateLimit, auditMiddleware } from './middleware/security'
import { requestIdMiddleware } from './middleware/requestId'
import { createLogger } from './lib/logger'
import { getMetricsText, getMetricsJson, incrementCounter, recordDuration } from './lib/metrics'
import { errorHandler, AppError } from './lib/errors'

const appLog = createLogger('app')

const app = new Hono()

// Request ID must be first — all downstream middleware/routes read it
app.use('*', requestIdMiddleware)
app.use('*', corsMiddleware)
app.use('*', honoLogger())
app.use('*', secureHeaders())
app.use('/api/*', apiRateLimit)
app.use('/api/*', auditMiddleware)

// ---------------------------------------------------------------------------
// HTTP request metrics + structured logging for every request
// ---------------------------------------------------------------------------
app.use('*', async (c, next) => {
  const start = Date.now()
  const requestId = c.get('requestId') as string
  const userId = c.get('userId') as string | undefined

  appLog.debug('request received', {
    requestId,
    userId,
    method: c.req.method,
    path: c.req.path,
  })

  await next()

  const durationMs = Date.now() - start
  const status = c.res.status
  const labels = { method: c.req.method, path: c.req.path, status: String(status) }

  incrementCounter('http_requests_total', { method: c.req.method, status: String(status) })
  recordDuration('http_request_duration_ms', durationMs, { method: c.req.method, path: c.req.path })

  if (status >= 400) {
    incrementCounter('http_errors_total', { method: c.req.method, path: c.req.path, status: String(status) })
    const logFn = status >= 500 ? 'error' : 'warn'
    appLog[logFn](`${status} response`, { requestId, userId, durationMs, status: String(status), path: c.req.path })
  } else {
    appLog.debug('request complete', { requestId, userId, durationMs, status: String(status), path: c.req.path })
  }

  void labels // suppress unused warning
})

app.route('/health', healthRoute)
app.route('/api/auth', authRoutes)
app.route('/api/tokens', tokenRoutes)
app.route('/api/sandbox', sandboxRoutes)
app.route('/api/costs', costTrackerRoutes)
app.route('/api/ai/voice-to-game', voiceRoutes)
app.route('/api/ai/image-to-map', imageRoutes)
app.route('/api/ai/generate', generateRoutes)
app.route('/api/studio', studioRoutes)
app.route('/api/studio/screenshot', screenshotRoutes)
app.route('/api/studio/state', stateRoutes)
app.route('/api/studio/execute', executeRoutes)
app.route('/api/dna', dnaRoutes)
app.route('/api/teams', teamRoutes)
app.route('/api/projects', versionRoutes)
app.route('/api/keys', apiKeyRoutes)
app.route('/api/webhooks', webhookRoutes)
app.route('/api/referrals', referralRoutes)
app.route('/api/notifications', notificationRoutes)
app.route('/api/earnings', earningsRoutes)
app.route('/api/marketplace/search', marketplaceSearchRoutes)
app.route('/api/admin', adminRoutes)

// ---------------------------------------------------------------------------
// Metrics endpoint — Prometheus text format + optional JSON
// ---------------------------------------------------------------------------
app.get('/api/metrics', (c) => {
  const accept = c.req.header('accept') ?? ''
  if (accept.includes('application/json')) {
    return c.json(getMetricsJson())
  }
  return c.text(getMetricsText(), 200, { 'Content-Type': 'text/plain; version=0.0.4; charset=utf-8' })
})

app.onError((err, c) => {
  const requestId = c.get('requestId') as string | undefined
  const userId = c.get('userId') as string | undefined
  const status = err instanceof AppError ? err.status : 500
  appLog[status >= 500 ? 'error' : 'warn']('request error', {
    requestId,
    userId,
    error: err.message,
    stack: err.stack,
    path: c.req.path,
    method: c.req.method,
  })
  incrementCounter('http_errors_total', { method: c.req.method, path: c.req.path, status: String(status) })
  if (status >= 500) captureException(err, { path: c.req.path, method: c.req.method })
  return errorHandler(err, c)
})

const port = parseInt(process.env.PORT || '3001')
serve({ fetch: app.fetch, port }, () => appLog.info(`API running on :${port}`))

export { app }
