import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock db and redis before importing the route
const mockQueryRaw = vi.fn()
const mockRedisPing = vi.fn()

vi.mock('../../lib/db', () => ({
  db: {
    $queryRaw: mockQueryRaw,
  },
}))

vi.mock('../../lib/redis', () => ({
  redis: {
    ping: mockRedisPing,
  },
}))

import { healthRoute } from '../../routes/health'

/**
 * Helper: execute the health route handler and return a { status, body } object.
 * Hono routes receive a Context object — we build a minimal mock.
 */
async function callHealth() {
  let responseStatus = 0
  let responseBody: Record<string, unknown> = {}

  const mockContext = {
    json: vi.fn().mockImplementation((body: Record<string, unknown>, status: number) => {
      responseBody = body
      responseStatus = status
      return { body, status }
    }),
  }

  // Grab the registered GET handler from the Hono app
  const routes = healthRoute.routes
  const getRoute = routes.find((r) => r.method === 'GET')
  if (!getRoute) throw new Error('GET route not found on healthRoute')

  await getRoute.handler(mockContext as unknown as Parameters<typeof getRoute.handler>[0], vi.fn())

  return { status: responseStatus, body: responseBody }
}

describe('Health endpoint', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 200 with status ok when DB and Redis are healthy', async () => {
    mockQueryRaw.mockResolvedValue([{ '?column?': 1 }])
    mockRedisPing.mockResolvedValue('PONG')

    const { status, body } = await callHealth()

    expect(status).toBe(200)
    expect(body.status).toBe('ok')
    expect(body.postgres).toBe('ok')
    expect(body.redis).toBe('ok')
  })

  it('returns 503 with status degraded when DB is down', async () => {
    mockQueryRaw.mockRejectedValue(new Error('ECONNREFUSED'))
    mockRedisPing.mockResolvedValue('PONG')

    const { status, body } = await callHealth()

    expect(status).toBe(503)
    expect(body.status).toBe('degraded')
    expect(body.postgres).toBe('down')
    expect(body.redis).toBe('ok')
  })

  it('returns 503 with status degraded when Redis is down', async () => {
    mockQueryRaw.mockResolvedValue([{ '?column?': 1 }])
    mockRedisPing.mockRejectedValue(new Error('Redis connection failed'))

    const { status, body } = await callHealth()

    expect(status).toBe(503)
    expect(body.status).toBe('degraded')
    expect(body.postgres).toBe('ok')
    expect(body.redis).toBe('down')
  })

  it('returns 503 when both DB and Redis are down', async () => {
    mockQueryRaw.mockRejectedValue(new Error('DB down'))
    mockRedisPing.mockRejectedValue(new Error('Redis down'))

    const { status, body } = await callHealth()

    expect(status).toBe(503)
    expect(body.status).toBe('degraded')
    expect(body.postgres).toBe('down')
    expect(body.redis).toBe('down')
  })

  it('includes version field in response', async () => {
    mockQueryRaw.mockResolvedValue([])
    mockRedisPing.mockResolvedValue('PONG')

    const { body } = await callHealth()

    expect(body).toHaveProperty('version')
    expect(typeof body.version).toBe('string')
  })
})
