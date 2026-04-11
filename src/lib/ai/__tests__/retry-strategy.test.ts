/**
 * retry-strategy.test.ts
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// Hoisted mocks — quality-scorer is imported by retry-strategy.
const { mockScoreOutput, mockIsObviouslyBroken } = vi.hoisted(() => ({
  mockScoreOutput: vi.fn(),
  mockIsObviouslyBroken: vi.fn(),
}))

vi.mock('../quality-scorer', () => ({
  scoreOutput: mockScoreOutput,
  isObviouslyBroken: mockIsObviouslyBroken,
}))
vi.mock('@/lib/ai/quality-scorer', () => ({
  scoreOutput: mockScoreOutput,
  isObviouslyBroken: mockIsObviouslyBroken,
}))

import {
  withSmartRetry,
  withParallelRace,
  withFallbackChain,
  recordModelOutcome,
  getModelSuccessRate,
  resetModelStatsForTest,
  type ModelId,
} from '../retry-strategy'

beforeEach(() => {
  resetModelStatsForTest()
  mockScoreOutput.mockReset()
  mockIsObviouslyBroken.mockReset()
  mockIsObviouslyBroken.mockReturnValue(false)
})

describe('ModelFailureTracker', () => {
  it('tracks success rate across outcomes', () => {
    recordModelOutcome('gpt-4o', true)
    recordModelOutcome('gpt-4o', true)
    recordModelOutcome('gpt-4o', false)
    expect(getModelSuccessRate('gpt-4o')).toBeCloseTo(2 / 3, 2)
  })

  it('returns 1.0 for untested models', () => {
    expect(getModelSuccessRate('claude-sonnet-4')).toBe(1.0)
  })
})

describe('withSmartRetry', () => {
  it('returns the first successful result without retrying', async () => {
    const fn = vi.fn().mockResolvedValue('ok')
    const result = await withSmartRetry(fn, {
      models: ['claude-sonnet-4', 'claude-haiku-4'],
      baseBackoffMs: 1,
      capBackoffMs: 1,
    })
    expect(result.value).toBe('ok')
    expect(result.attempts).toBe(1)
    expect(fn).toHaveBeenCalledTimes(1)
    expect(fn).toHaveBeenCalledWith('claude-sonnet-4')
  })

  it('swaps models on failure and succeeds on the second attempt', async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error('boom'))
      .mockResolvedValueOnce('ok')
    const result = await withSmartRetry(fn, {
      models: ['claude-sonnet-4', 'claude-haiku-4'],
      baseBackoffMs: 1,
      capBackoffMs: 1,
    })
    expect(result.value).toBe('ok')
    expect(result.attempts).toBe(2)
    expect(result.model).toBe('claude-haiku-4')
  })

  it('throws when every model fails', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('always fails'))
    await expect(
      withSmartRetry(fn, {
        models: ['gpt-4o'],
        baseBackoffMs: 1,
        capBackoffMs: 1,
      }),
    ).rejects.toThrow(/All 1 attempts failed/)
  })

  it('honours the validate callback', async () => {
    const fn = vi
      .fn()
      .mockResolvedValueOnce('')
      .mockResolvedValueOnce('good')
    const result = await withSmartRetry(fn, {
      models: ['a' as ModelId, 'b' as ModelId],
      baseBackoffMs: 1,
      capBackoffMs: 1,
      validate: (v) => typeof v === 'string' && v.length > 0,
    })
    expect(result.value).toBe('good')
    expect(result.attempts).toBe(2)
  })
})

describe('withParallelRace', () => {
  it('returns the first runner to resolve', async () => {
    const fn = vi.fn().mockImplementation(async (model: ModelId) => {
      if (model === 'gpt-4o') {
        await new Promise((r) => setTimeout(r, 50))
        return 'slow'
      }
      return 'fast'
    })

    const result = await withParallelRace(fn, {
      models: ['gpt-4o', 'gemini-2-flash'],
      timeoutMs: 5000,
    })
    expect(result.value).toBe('fast')
    expect(result.model).toBe('gemini-2-flash')
  })

  it('rejects when every runner fails', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('nope'))
    await expect(
      withParallelRace(fn, { models: ['gpt-4o'], timeoutMs: 500 }),
    ).rejects.toThrow(/All parallel runners failed/)
  })

  it('applies the validator', async () => {
    const fn = vi.fn().mockImplementation(async (model: ModelId) => {
      if (model === 'gpt-4o') return ''
      await new Promise((r) => setTimeout(r, 20))
      return 'valid result'
    })
    const result = await withParallelRace(fn, {
      models: ['gpt-4o', 'gemini-2-flash'],
      validate: (v: string) => v.length > 3,
      timeoutMs: 5000,
    })
    expect(result.value).toBe('valid result')
  })
})

describe('withFallbackChain', () => {
  it('returns as soon as a model produces high-quality output', async () => {
    mockScoreOutput.mockResolvedValueOnce({
      total: 85,
      axes: { relevance: 85, completeness: 85, themeCoherence: 85, technicalCorrectness: 85, polish: 85 },
      reasoning: 'great',
      suggestions: [],
      shouldRetry: false,
      source: 'llm',
      latencyMs: 10,
    })

    const fn = vi.fn().mockResolvedValue('a valid long response')
    const result = await withFallbackChain(fn, {
      models: ['claude-sonnet-4', 'claude-haiku-4'],
      prompt: 'test',
      mode: 'build',
      minQuality: 70,
    })
    expect(result.quality.total).toBe(85)
    expect(result.attempts).toBe(1)
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('walks the chain when the first model scores low', async () => {
    mockScoreOutput
      .mockResolvedValueOnce({
        total: 40,
        axes: { relevance: 40, completeness: 40, themeCoherence: 40, technicalCorrectness: 40, polish: 40 },
        reasoning: 'weak',
        suggestions: [],
        shouldRetry: true,
        source: 'llm',
        latencyMs: 10,
      })
      .mockResolvedValueOnce({
        total: 90,
        axes: { relevance: 90, completeness: 90, themeCoherence: 90, technicalCorrectness: 90, polish: 90 },
        reasoning: 'nailed it',
        suggestions: [],
        shouldRetry: false,
        source: 'llm',
        latencyMs: 10,
      })

    const fn = vi
      .fn()
      .mockResolvedValueOnce('first response')
      .mockResolvedValueOnce('second response')

    const result = await withFallbackChain(fn, {
      models: ['claude-sonnet-4', 'claude-haiku-4'],
      prompt: 'test',
      mode: 'build',
      minQuality: 70,
    })

    expect(result.quality.total).toBe(90)
    expect(result.model).toBe('claude-haiku-4')
    expect(result.attempts).toBe(2)
    expect(result.history).toHaveLength(2)
  })

  it('returns the best candidate when nothing meets minQuality', async () => {
    mockScoreOutput
      .mockResolvedValueOnce({
        total: 45,
        axes: { relevance: 45, completeness: 45, themeCoherence: 45, technicalCorrectness: 45, polish: 45 },
        reasoning: '',
        suggestions: [],
        shouldRetry: true,
        source: 'llm',
        latencyMs: 1,
      })
      .mockResolvedValueOnce({
        total: 55,
        axes: { relevance: 55, completeness: 55, themeCoherence: 55, technicalCorrectness: 55, polish: 55 },
        reasoning: '',
        suggestions: [],
        shouldRetry: true,
        source: 'llm',
        latencyMs: 1,
      })

    const fn = vi.fn().mockResolvedValue('valid text')
    const result = await withFallbackChain(fn, {
      models: ['claude-sonnet-4', 'claude-haiku-4'],
      prompt: 'test',
      mode: 'build',
      minQuality: 80,
    })
    // Should have returned the 55-scoring one as the best candidate.
    expect(result.quality.total).toBe(55)
    expect(result.attempts).toBe(2)
  })

  it('skips obviously broken responses', async () => {
    mockIsObviouslyBroken
      .mockReturnValueOnce(true)
      .mockReturnValueOnce(false)

    mockScoreOutput.mockResolvedValueOnce({
      total: 85,
      axes: { relevance: 85, completeness: 85, themeCoherence: 85, technicalCorrectness: 85, polish: 85 },
      reasoning: 'ok',
      suggestions: [],
      shouldRetry: false,
      source: 'llm',
      latencyMs: 1,
    })

    const fn = vi
      .fn()
      .mockResolvedValueOnce('')
      .mockResolvedValueOnce('good response')

    const result = await withFallbackChain(fn, {
      models: ['claude-sonnet-4', 'claude-haiku-4'],
      prompt: 'test',
      mode: 'build',
      minQuality: 70,
    })

    expect(result.quality.total).toBe(85)
    expect(mockScoreOutput).toHaveBeenCalledTimes(1)
  })
})
