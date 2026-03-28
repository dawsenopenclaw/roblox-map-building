import { initSentry, captureException } from './lib/sentry'
// Sentry must be initialized before any other imports that might throw
initSentry()

import { Hono } from 'hono'
import { serve } from '@hono/node-server'
import { logger } from 'hono/logger'
import { secureHeaders } from 'hono/secure-headers'
import { healthRoute } from './routes/health'
import { authRoutes } from './routes/auth'
import { tokenRoutes } from './routes/tokens'
import { sandboxRoutes } from './routes/sandbox'
import { costTrackerRoutes } from './routes/cost-tracker'
import { voiceRoutes } from './routes/ai/voice'
import { imageRoutes } from './routes/ai/image'
import { generateRoutes } from './routes/ai/generate'
import { corsMiddleware, apiRateLimit, auditMiddleware } from './middleware/security'

const app = new Hono()

app.use('*', corsMiddleware)
app.use('*', logger())
app.use('*', secureHeaders())
app.use('/api/*', apiRateLimit)
app.use('/api/*', auditMiddleware)

app.route('/health', healthRoute)
app.route('/api/auth', authRoutes)
app.route('/api/tokens', tokenRoutes)
app.route('/api/sandbox', sandboxRoutes)
app.route('/api/costs', costTrackerRoutes)
app.route('/api/ai/voice-to-game', voiceRoutes)
app.route('/api/ai/image-to-map', imageRoutes)
app.route('/api/ai/generate', generateRoutes)

app.onError((err, c) => {
  console.error(err)
  captureException(err, { path: c.req.path, method: c.req.method })
  return c.json({ error: 'Internal server error' }, 500)
})

const port = parseInt(process.env.PORT || '3001')
serve({ fetch: app.fetch, port }, () => console.log(`API running on :${port}`))

export { app }
