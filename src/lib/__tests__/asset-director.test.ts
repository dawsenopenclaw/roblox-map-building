import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Hoisted mocks ────────────────────────────────────────────────────────────
// vi.hoisted runs before the import of asset-director so the spies exist when
// the director's `import './mesh-pipeline'` resolves to our fake module.

const {
  mockCallAI,
  mockGetTokenBalance,
  mockSpendTokens,
  mockGenerateMesh,
  mockGenerateMusic,
  mockGenerateSFX,
  mockGenerateVoice,
} = vi.hoisted(() => ({
  mockCallAI: vi.fn(),
  mockGetTokenBalance: vi.fn(),
  mockSpendTokens: vi.fn(),
  mockGenerateMesh: vi.fn(),
  mockGenerateMusic: vi.fn(),
  mockGenerateSFX: vi.fn(),
  mockGenerateVoice: vi.fn(),
}))

vi.mock('@/lib/ai/provider', () => ({
  callAI: mockCallAI,
}))

vi.mock('@/lib/tokens-server', () => ({
  getTokenBalance: mockGetTokenBalance,
  spendTokens: mockSpendTokens,
}))

// Provide fake implementations for the pipeline modules that asset-director
// loads dynamically. The director imports via `import('./mesh-pipeline')`, so
// we register the mock under the same specifier.
vi.mock('@/lib/mesh-pipeline', () => ({
  generateMeshFromPrompt: mockGenerateMesh,
}))

vi.mock('@/lib/audio-pipeline', () => ({
  generateMusic: mockGenerateMusic,
  generateSFX: mockGenerateSFX,
  generateVoice: mockGenerateVoice,
}))

// The director uses a relative `./mesh-pipeline` specifier internally — mock
// that too so the dynamic import resolves in the test environment regardless
// of whether Vitest's resolver treats `@/` and `./` as equivalent.
vi.mock('./mesh-pipeline', () => ({
  generateMeshFromPrompt: mockGenerateMesh,
}))

vi.mock('./audio-pipeline', () => ({
  generateMusic: mockGenerateMusic,
  generateSFX: mockGenerateSFX,
  generateVoice: mockGenerateVoice,
}))

import {
  directBuildAssets,
  detectAssetIntents,
  gateIntentsByCredits,
  ASSET_DIRECTOR_COSTS,
  type AssetIntent,
  type AssetDirectorProgressEvent,
} from '@/lib/asset-director'

// ── Helpers ──────────────────────────────────────────────────────────────────

function intentsJson(intents: AssetIntent[]): string {
  return JSON.stringify({ intents })
}

const sampleIntents: AssetIntent[] = [
  {
    type: 'mesh',
    description: 'medieval iron sword',
    context: 'blacksmith shop',
    priority: 'critical',
  },
  {
    type: 'music',
    description: 'medieval tavern ambient music',
    context: 'village background',
    priority: 'critical',
  },
  {
    type: 'sfx',
    description: 'hammer on anvil',
    context: 'blacksmith interior',
    priority: 'enhancement',
  },
  {
    type: 'voice',
    description: 'gruff blacksmith greeting',
    context: 'NPC shopkeeper',
    priority: 'enhancement',
  },
]

beforeEach(() => {
  vi.clearAllMocks()
  // Default: plenty of credits.
  mockGetTokenBalance.mockResolvedValue({ balance: 10_000 })
  mockSpendTokens.mockResolvedValue({ balance: 9000 })
  // Default: pipelines succeed immediately.
  mockGenerateMesh.mockResolvedValue({ assetId: 'roblox_mesh_1', generatedAssetId: 'ga_1' })
  mockGenerateMusic.mockResolvedValue({ assetId: 'roblox_music_1', generatedAssetId: 'ga_2' })
  mockGenerateSFX.mockResolvedValue({ assetId: 'roblox_sfx_1', generatedAssetId: 'ga_3' })
  mockGenerateVoice.mockResolvedValue({ assetId: 'roblox_voice_1', generatedAssetId: 'ga_4' })
})

// ── detectAssetIntents ───────────────────────────────────────────────────────

describe('detectAssetIntents', () => {
  it('parses a clean JSON response and caps at maxIntents', async () => {
    mockCallAI.mockResolvedValue(intentsJson(sampleIntents))
    const out = await detectAssetIntents('medieval village', { maxIntents: 3 })
    expect(out).toHaveLength(3)
    expect(out[0].type).toBe('mesh')
  })

  it('strips markdown code fences', async () => {
    mockCallAI.mockResolvedValue('```json\n' + intentsJson(sampleIntents) + '\n```')
    const out = await detectAssetIntents('x')
    expect(out).toHaveLength(4)
  })

  it('throws when JSON is malformed', async () => {
    mockCallAI.mockResolvedValue('not json at all')
    await expect(detectAssetIntents('x')).rejects.toThrow(/invalid JSON/i)
  })

  it('throws when schema validation fails', async () => {
    mockCallAI.mockResolvedValue(
      JSON.stringify({ intents: [{ type: 'invalid-type', description: 'x', context: 'y', priority: 'critical' }] }),
    )
    await expect(detectAssetIntents('x')).rejects.toThrow(/schema validation/i)
  })

  it('returns empty array for an empty intents list', async () => {
    mockCallAI.mockResolvedValue(JSON.stringify({ intents: [] }))
    const out = await detectAssetIntents('make a game')
    expect(out).toEqual([])
  })
})

// ── gateIntentsByCredits ─────────────────────────────────────────────────────

describe('gateIntentsByCredits', () => {
  it('approves all intents when budget is ample', async () => {
    mockGetTokenBalance.mockResolvedValue({ balance: 10_000 })
    const gate = await gateIntentsByCredits('user_1', sampleIntents)
    expect(gate.approvedIntents).toHaveLength(4)
    expect(gate.droppedIntents).toHaveLength(0)
    expect(gate.insufficientForCritical).toBe(false)
  })

  it('drops enhancement intents first when budget is tight', async () => {
    // Costs: mesh 50 + music 30 + sfx 10 + voice 15 = 105
    // Budget: 85 — must drop enhancements (sfx + voice = 25) so 80 remains.
    mockGetTokenBalance.mockResolvedValue({ balance: 85 })
    const gate = await gateIntentsByCredits('user_1', sampleIntents)
    expect(gate.approvedIntents.map((i) => i.type)).toEqual(['mesh', 'music'])
    expect(gate.droppedIntents.map((i) => i.type).sort()).toEqual(['sfx', 'voice'])
    expect(gate.totalCost).toBe(80)
    expect(gate.insufficientForCritical).toBe(false)
  })

  it('flags insufficientForCritical when even critical intents exceed budget', async () => {
    mockGetTokenBalance.mockResolvedValue({ balance: 10 })
    const gate = await gateIntentsByCredits('user_1', sampleIntents)
    expect(gate.insufficientForCritical).toBe(true)
  })

  it('handles missing balance record as zero', async () => {
    mockGetTokenBalance.mockResolvedValue(null)
    const gate = await gateIntentsByCredits('user_1', sampleIntents)
    expect(gate.balance).toBe(0)
    expect(gate.insufficientForCritical).toBe(true)
  })
})

// ── directBuildAssets ────────────────────────────────────────────────────────

describe('directBuildAssets — parallel fan-out', () => {
  it('fires all four pipelines in parallel and aggregates the result', async () => {
    mockCallAI.mockResolvedValue(intentsJson(sampleIntents))

    const progress: AssetDirectorProgressEvent[] = []
    const result = await directBuildAssets({
      prompt: 'medieval village',
      userId: 'user_1',
      sessionId: 'sess_1',
      onProgress: (e) => progress.push(e),
    })

    // Every pipeline was invoked exactly once.
    expect(mockGenerateMesh).toHaveBeenCalledTimes(1)
    expect(mockGenerateMusic).toHaveBeenCalledTimes(1)
    expect(mockGenerateSFX).toHaveBeenCalledTimes(1)
    expect(mockGenerateVoice).toHaveBeenCalledTimes(1)

    // Aggregated result mirrors the completed jobs.
    expect(result.results).toHaveLength(4)
    expect(result.results.every((r) => r.status === 'completed')).toBe(true)
    expect(result.totalCreditsUsed).toBe(
      ASSET_DIRECTOR_COSTS.mesh +
        ASSET_DIRECTOR_COSTS.music +
        ASSET_DIRECTOR_COSTS.sfx +
        ASSET_DIRECTOR_COSTS.voice,
    )

    // Progress callback fired a generating + completed event for each job.
    const generatingEvents = progress.filter((p) => p.status === 'generating')
    const completedEvents = progress.filter((p) => p.status === 'completed')
    expect(generatingEvents).toHaveLength(4)
    expect(completedEvents).toHaveLength(4)

    // Spend was called once, for the completed jobs only.
    expect(mockSpendTokens).toHaveBeenCalledTimes(1)
  })

  it('propagates abort signal to all jobs', async () => {
    mockCallAI.mockResolvedValue(intentsJson(sampleIntents))
    const ac = new AbortController()

    // Pipelines inspect the signal and reject if aborted.
    const abortingImpl = (input: { signal?: AbortSignal }) =>
      new Promise((_, reject) => {
        if (input.signal?.aborted) {
          reject(new Error('aborted'))
          return
        }
        input.signal?.addEventListener('abort', () => reject(new Error('aborted')), { once: true })
      })
    mockGenerateMesh.mockImplementation(abortingImpl)
    mockGenerateMusic.mockImplementation(abortingImpl)
    mockGenerateSFX.mockImplementation(abortingImpl)
    mockGenerateVoice.mockImplementation(abortingImpl)

    const run = directBuildAssets({
      prompt: 'medieval village',
      userId: 'user_1',
      sessionId: 'sess_1',
      signal: ac.signal,
    })
    // Fire abort on the next microtask so the jobs have started.
    queueMicrotask(() => ac.abort())

    const result = await run
    expect(result.results.every((r) => r.status === 'failed')).toBe(true)
    expect(result.results.every((r) => (r.error ?? '').includes('abort'))).toBe(true)
    // No credits spent for failed jobs.
    expect(result.totalCreditsUsed).toBe(0)
    expect(mockSpendTokens).not.toHaveBeenCalled()
  })

  it('drops enhancement intents when budget is tight and still runs criticals', async () => {
    mockCallAI.mockResolvedValue(intentsJson(sampleIntents))
    // Budget fits mesh + music (80), but not sfx + voice.
    mockGetTokenBalance.mockResolvedValue({ balance: 80 })

    const progress: AssetDirectorProgressEvent[] = []
    const result = await directBuildAssets({
      prompt: 'medieval village',
      userId: 'user_1',
      sessionId: 'sess_1',
      onProgress: (e) => progress.push(e),
    })

    // Only mesh and music pipelines were called.
    expect(mockGenerateMesh).toHaveBeenCalledTimes(1)
    expect(mockGenerateMusic).toHaveBeenCalledTimes(1)
    expect(mockGenerateSFX).not.toHaveBeenCalled()
    expect(mockGenerateVoice).not.toHaveBeenCalled()

    // sfx + voice rows are marked failed with the drop reason.
    const droppedRows = result.results.filter((r) => ['sfx', 'voice'].includes(r.type))
    expect(droppedRows.every((r) => r.status === 'failed')).toBe(true)
    expect(droppedRows.every((r) => (r.error ?? '').includes('budget'))).toBe(true)

    // mesh + music completed.
    const completedRows = result.results.filter((r) => ['mesh', 'music'].includes(r.type))
    expect(completedRows.every((r) => r.status === 'completed')).toBe(true)

    // Spend only covers the completed jobs.
    expect(result.totalCreditsUsed).toBe(
      ASSET_DIRECTOR_COSTS.mesh + ASSET_DIRECTOR_COSTS.music,
    )
  })

  it('exits early when critical intents exceed budget', async () => {
    mockCallAI.mockResolvedValue(intentsJson(sampleIntents))
    mockGetTokenBalance.mockResolvedValue({ balance: 5 })

    const result = await directBuildAssets({
      prompt: 'medieval village',
      userId: 'user_1',
      sessionId: 'sess_1',
    })

    expect(result.earlyExitReason).toMatch(/insufficient/i)
    expect(result.totalCreditsUsed).toBe(0)
    expect(mockGenerateMesh).not.toHaveBeenCalled()
    expect(mockSpendTokens).not.toHaveBeenCalled()
  })

  it('returns early when detection finds no intents', async () => {
    mockCallAI.mockResolvedValue(JSON.stringify({ intents: [] }))
    const result = await directBuildAssets({
      prompt: 'make a game',
      userId: 'user_1',
      sessionId: 'sess_1',
    })
    expect(result.intents).toHaveLength(0)
    expect(result.results).toHaveLength(0)
    expect(result.earlyExitReason).toMatch(/no asset intents/i)
  })

  it('fires progress callback for every approved job transition', async () => {
    mockCallAI.mockResolvedValue(intentsJson(sampleIntents.slice(0, 2)))

    const events: AssetDirectorProgressEvent[] = []
    await directBuildAssets({
      prompt: 'medieval village',
      userId: 'user_1',
      sessionId: 'sess_1',
      onProgress: (e) => events.push(e),
    })

    // 2 jobs × (generating + completed) = 4 events
    expect(events).toHaveLength(4)
    expect(events.filter((e) => e.status === 'generating')).toHaveLength(2)
    expect(events.filter((e) => e.status === 'completed')).toHaveLength(2)
    // Every completed event carries the Roblox asset id from the mock.
    expect(
      events.filter((e) => e.status === 'completed').every((e) => typeof e.assetId === 'string'),
    ).toBe(true)
  })

  it('surfaces pipeline failures as failed results without tanking the batch', async () => {
    mockCallAI.mockResolvedValue(intentsJson(sampleIntents))
    mockGenerateMesh.mockRejectedValue(new Error('Meshy 503'))

    const result = await directBuildAssets({
      prompt: 'medieval village',
      userId: 'user_1',
      sessionId: 'sess_1',
    })

    const meshRow = result.results.find((r) => r.type === 'mesh')
    expect(meshRow?.status).toBe('failed')
    expect(meshRow?.error).toContain('Meshy 503')

    // The other three still completed.
    const completed = result.results.filter((r) => r.status === 'completed')
    expect(completed).toHaveLength(3)

    // Credits only spent for completed jobs.
    expect(result.totalCreditsUsed).toBe(
      ASSET_DIRECTOR_COSTS.music + ASSET_DIRECTOR_COSTS.sfx + ASSET_DIRECTOR_COSTS.voice,
    )
  })

  it('stubs texture intents as failed with a TODO message', async () => {
    mockCallAI.mockResolvedValue(
      intentsJson([
        {
          type: 'texture',
          description: 'rusty iron plate',
          context: 'blacksmith walls',
          priority: 'critical',
        },
      ]),
    )

    const result = await directBuildAssets({
      prompt: 'medieval village',
      userId: 'user_1',
      sessionId: 'sess_1',
    })
    expect(result.results[0].status).toBe('failed')
    expect(result.results[0].error).toMatch(/texture pipeline/i)
    expect(result.totalCreditsUsed).toBe(0)
  })
})
