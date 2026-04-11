/**
 * Unit test for src/lib/mesh-pipeline.ts
 *
 * Mocks fetch + the db + tokens-server so we exercise the full pipeline logic
 * end-to-end without touching the network or the database. Verifies that the
 * expected endpoints are called in order and that error paths mark the row as
 * failed.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// ── DB mock ──────────────────────────────────────────────────────────────────

const {
  mockCreate,
  mockUpdate,
  mockSpendTokens,
} = vi.hoisted(() => ({
  mockCreate: vi.fn(),
  mockUpdate: vi.fn(),
  mockSpendTokens: vi.fn(),
}))

vi.mock('@/lib/db', () => ({
  db: {
    generatedAsset: {
      create: mockCreate,
      update: mockUpdate,
    },
  },
}))

vi.mock('@/lib/tokens-server', () => ({
  spendTokens: mockSpendTokens,
}))

// server-only is a no-op marker used by Next — stub it so vitest can import.
vi.mock('server-only', () => ({}))

import { generateMeshFromPrompt, MESH_GENERATION_COST } from '@/lib/mesh-pipeline'

// ── Helpers for fetch mocking ────────────────────────────────────────────────

interface FetchMock {
  match: (url: string, init?: RequestInit) => boolean
  response: () => Response | Promise<Response>
}

function jsonResponse(body: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
}

function bufferResponse(buf: Uint8Array, init: ResponseInit = {}): Response {
  return new Response(buf, {
    status: 200,
    headers: { 'Content-Type': 'model/gltf-binary' },
    ...init,
  })
}

describe('generateMeshFromPrompt', () => {
  const OLD_ENV = process.env

  beforeEach(() => {
    vi.clearAllMocks()

    process.env = {
      ...OLD_ENV,
      MESHY_API_KEY: 'test-meshy-key',
      ROBLOX_OPEN_CLOUD_KEY: 'test-oc-key',
      ROBLOX_CREATOR_ID: '12345',
      ROBLOX_CREATOR_TYPE: 'User',
    }

    mockCreate.mockResolvedValue({ id: 'ga_abc' })
    mockUpdate.mockResolvedValue({})
    mockSpendTokens.mockResolvedValue({ balance: 100 })
  })

  afterEach(() => {
    process.env = OLD_ENV
    vi.restoreAllMocks()
  })

  it('runs the full pipeline: Meshy preview → refine → download → Open Cloud upload → DB persist', async () => {
    // Track call order so we can assert each fetch hits the right endpoint
    const calls: string[] = []

    const fakeGlbBytes = new Uint8Array([0x67, 0x6c, 0x54, 0x46, 0x02, 0x00, 0x00, 0x00])

    const fetchImpl = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input.toString()
      calls.push(`${init?.method ?? 'GET'} ${url}`)

      // 1. Preview task creation
      if (url === 'https://api.meshy.ai/openapi/v2/text-to-3d' && init?.method === 'POST') {
        // The body distinguishes preview vs refine via the `mode` field
        const body = init.body ? JSON.parse(String(init.body)) : {}
        if (body.mode === 'preview') {
          return jsonResponse({ result: 'preview-task-1' })
        }
        if (body.mode === 'refine') {
          return jsonResponse({ result: 'refine-task-1' })
        }
        throw new Error(`unexpected text-to-3d POST body: ${JSON.stringify(body)}`)
      }

      // 2. Poll preview task
      if (url === 'https://api.meshy.ai/openapi/v2/text-to-3d/preview-task-1') {
        return jsonResponse({
          id: 'preview-task-1',
          status: 'SUCCEEDED',
          model_urls: { glb: 'https://cdn.meshy.ai/preview.glb' },
          polygon_count: 5_000,
        })
      }

      // 3. Poll refine task
      if (url === 'https://api.meshy.ai/openapi/v2/text-to-3d/refine-task-1') {
        return jsonResponse({
          id: 'refine-task-1',
          status: 'SUCCEEDED',
          model_urls: { glb: 'https://cdn.meshy.ai/final.glb' },
          polygon_count: 28_000,
        })
      }

      // 4. Download the GLB
      if (url === 'https://cdn.meshy.ai/final.glb') {
        return bufferResponse(fakeGlbBytes)
      }

      // 5. Open Cloud upload
      if (url === 'https://apis.roblox.com/assets/v1/assets' && init?.method === 'POST') {
        return jsonResponse({
          path: 'operations/op-xyz',
          done: false,
        })
      }

      // 6. Poll the Open Cloud operation
      if (url === 'https://apis.roblox.com/assets/v1/operations/op-xyz') {
        return jsonResponse({
          path: 'operations/op-xyz',
          done: true,
          response: {
            '@type': 'type.googleapis.com/roblox.open_cloud.assets.v1.Asset',
            assetId: '987654321',
          },
        })
      }

      throw new Error(`unexpected fetch: ${init?.method ?? 'GET'} ${url}`)
    })

    vi.stubGlobal('fetch', fetchImpl)

    const result = await generateMeshFromPrompt({
      prompt: 'a sword',
      userId: 'user_abc',
    })

    expect(result).toEqual({
      generatedAssetId: 'ga_abc',
      assetId: '987654321',
      glbUrl: 'https://cdn.meshy.ai/final.glb',
      status: 'completed',
    })

    // The initial row was created queued
    expect(mockCreate).toHaveBeenCalledWith({
      data: {
        userId: 'user_abc',
        prompt: 'a sword',
        type: 'mesh',
        style: 'realistic',
        status: 'queued',
      },
      select: { id: true },
    })

    // Credits were deducted exactly once
    expect(mockSpendTokens).toHaveBeenCalledTimes(1)
    expect(mockSpendTokens).toHaveBeenCalledWith(
      'user_abc',
      MESH_GENERATION_COST,
      expect.stringContaining('Mesh generation'),
      expect.objectContaining({
        robloxAssetId: '987654321',
        generatedAssetId: 'ga_abc',
      }),
    )

    // The row was marked completed at the end
    const finalUpdate = mockUpdate.mock.calls.find(
      (c: unknown[]) =>
        typeof c[0] === 'object' &&
        c[0] !== null &&
        (c[0] as { data?: { status?: string } }).data?.status === 'ready',
    )
    expect(finalUpdate).toBeDefined()
    const finalUpdateArg = finalUpdate![0] as {
      where: { id: string }
      data: {
        status: string
        robloxAssetId: string
        meshUrl: string
        polyCount: number | null
        tokensCost: number
      }
    }
    expect(finalUpdateArg.where).toEqual({ id: 'ga_abc' })
    expect(finalUpdateArg.data.status).toBe('ready')
    expect(finalUpdateArg.data.robloxAssetId).toBe('987654321')
    expect(finalUpdateArg.data.meshUrl).toBe('https://cdn.meshy.ai/final.glb')
    expect(finalUpdateArg.data.polyCount).toBe(28_000)
    expect(finalUpdateArg.data.tokensCost).toBe(MESH_GENERATION_COST)

    // The expected sequence of endpoints was hit
    expect(calls[0]).toBe('POST https://api.meshy.ai/openapi/v2/text-to-3d')
    expect(calls).toContain('POST https://apis.roblox.com/assets/v1/assets')
    expect(calls).toContain('GET https://apis.roblox.com/assets/v1/operations/op-xyz')
  })

  it('marks the row failed and rethrows when Meshy preview fails', async () => {
    const fetchImpl = vi.fn(async (input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : input.toString()
      if (url === 'https://api.meshy.ai/openapi/v2/text-to-3d') {
        return new Response('bad prompt', { status: 400 })
      }
      throw new Error(`unexpected fetch: ${url}`)
    })

    vi.stubGlobal('fetch', fetchImpl)

    await expect(
      generateMeshFromPrompt({ prompt: 'x', userId: 'user_abc' }),
    ).rejects.toThrow(/Meshy preview task creation failed/)

    // The row should have been marked failed
    const failedCall = mockUpdate.mock.calls.find(
      (c: unknown[]) =>
        typeof c[0] === 'object' &&
        c[0] !== null &&
        (c[0] as { data?: { status?: string } }).data?.status === 'failed',
    )
    expect(failedCall).toBeDefined()
    // Credits were NOT deducted
    expect(mockSpendTokens).not.toHaveBeenCalled()
  })

  it('throws when MESHY_API_KEY is missing', async () => {
    delete process.env.MESHY_API_KEY

    await expect(
      generateMeshFromPrompt({ prompt: 'a sword', userId: 'user_abc' }),
    ).rejects.toThrow(/MESHY_API_KEY/)

    // No row should have been created because we fail fast
    expect(mockCreate).not.toHaveBeenCalled()
  })

  it('uses image-to-3d endpoint and skips the refine step when refImageUrl is provided', async () => {
    const calls: string[] = []
    const fakeGlbBytes = new Uint8Array([0x67, 0x6c, 0x54, 0x46, 0x02, 0x00, 0x00, 0x00])

    const fetchImpl = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input.toString()
      calls.push(`${init?.method ?? 'GET'} ${url}`)

      if (url === 'https://api.meshy.ai/openapi/v2/image-to-3d' && init?.method === 'POST') {
        return jsonResponse({ result: 'img-task-1' })
      }

      if (url === 'https://api.meshy.ai/openapi/v2/image-to-3d/img-task-1') {
        return jsonResponse({
          id: 'img-task-1',
          status: 'SUCCEEDED',
          model_urls: { glb: 'https://cdn.meshy.ai/img.glb' },
          polygon_count: 12_000,
        })
      }

      if (url === 'https://cdn.meshy.ai/img.glb') {
        return bufferResponse(fakeGlbBytes)
      }

      if (url === 'https://apis.roblox.com/assets/v1/assets' && init?.method === 'POST') {
        return jsonResponse({
          path: 'operations/op-img',
          done: true,
          response: { assetId: '111222333' },
        })
      }

      throw new Error(`unexpected fetch: ${init?.method ?? 'GET'} ${url}`)
    })

    vi.stubGlobal('fetch', fetchImpl)

    const result = await generateMeshFromPrompt({
      prompt: 'test',
      userId: 'user_abc',
      refImageUrl: 'https://example.com/ref.png',
    })

    expect(result.assetId).toBe('111222333')

    // The refine endpoint should never be called
    const refineCalls = calls.filter(
      (c) => c.includes('text-to-3d') && c.startsWith('POST'),
    )
    expect(refineCalls).toHaveLength(0)

    // image-to-3d endpoint was used instead
    expect(calls).toContain('POST https://api.meshy.ai/openapi/v2/image-to-3d')
  })
})
