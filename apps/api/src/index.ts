import { Hono } from 'hono'
import { serve } from '@hono/node-server'
import { logger } from 'hono/logger'
import { secureHeaders } from 'hono/secure-headers'
import { healthRoute } from './routes/health'
import { corsMiddleware } from './middleware/cors'

const app = new Hono()

app.use('*', corsMiddleware)
app.use('*', logger())
app.use('*', secureHeaders())

app.route('/health', healthRoute)

app.onError((err, c) => {
  console.error(err)
  return c.json({ error: 'Internal server error' }, 500)
})

const port = parseInt(process.env.PORT || '3001')
serve({ fetch: app.fetch, port }, () => console.log(`API running on :${port}`))

export { app }
