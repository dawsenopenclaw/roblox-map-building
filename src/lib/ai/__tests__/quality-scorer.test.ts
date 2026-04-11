/**
 * quality-scorer.test.ts
 * Unit tests for the LLM-backed output quality scorer.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// Hoisted mock so the provider import in quality-scorer.ts resolves to our spy.
const { mockCallAI } = vi.hoisted(() => ({
  mockCallAI: vi.fn(),
}))

vi.mock('@/lib/ai/provider', () => ({
  callAI: mockCallAI,
}))
vi.mock('../provider', () => ({
  callAI: mockCallAI,
}))

import {
  scoreOutput,
  isObviouslyBroken,
  _weightedTotalForTest,
  type QualityMode,
} from '../quality-scorer'

beforeEach(() => {
  mockCallAI.mockReset()
})

describe('isObviouslyBroken', () => {
  it('returns true for empty string', () => {
    expect(isObviouslyBroken('')).toBe(true)
    expect(isObviouslyBroken('   ')).toBe(true)
  })

  it('returns true for too-short output', () => {
    expect(isObviouslyBroken('ok')).toBe(true)
  })

  it('returns true for known error prefixes', () => {
    expect(isObviouslyBroken('Error: something went wrong')).toBe(true)
    expect(isObviouslyBroken('Sorry, I cannot help with that request.')).toBe(true)
    expect(isObviouslyBroken("I can't fulfill this request at this time."))
      .toBe(true)
  })

  it('returns false for normal responses', () => {
    expect(
      isObviouslyBroken('Here is a 50-stud tall stone tower with crenellations and a wooden door.'),
    ).toBe(false)
  })
})

describe('_weightedTotalForTest', () => {
  it('weights technicalCorrectness heavily in script mode', () => {
    const allEighty = _weightedTotalForTest(
      { relevance: 80, completeness: 80, themeCoherence: 80, technicalCorrectness: 80, polish: 80 },
      'script',
    )
    expect(allEighty).toBe(80)
  })

  it('rewards high tech correctness in script mode', () => {
    const highTech = _weightedTotalForTest(
      { relevance: 50, completeness: 50, themeCoherence: 50, technicalCorrectness: 100, polish: 50 },
      'script',
    )
    const highPolish = _weightedTotalForTest(
      { relevance: 50, completeness: 50, themeCoherence: 50, technicalCorrectness: 50, polish: 100 },
      'script',
    )
    expect(highTech).toBeGreaterThan(highPolish)
  })

  it('clamps to integers', () => {
    const total = _weightedTotalForTest(
      { relevance: 73, completeness: 81, themeCoherence: 66, technicalCorrectness: 92, polish: 58 },
      'build',
    )
    expect(Number.isInteger(total)).toBe(true)
  })
})

describe('scoreOutput', () => {
  it('returns 0 and shouldRetry for empty responses without calling the LLM', async () => {
    const result = await scoreOutput({
      prompt: 'make a castle',
      response: '',
      mode: 'build',
    })
    expect(result.total).toBe(0)
    expect(result.shouldRetry).toBe(true)
    expect(mockCallAI).not.toHaveBeenCalled()
  })

  it('parses a valid JSON judge response', async () => {
    mockCallAI.mockResolvedValueOnce(
      JSON.stringify({
        relevance: 95,
        completeness: 90,
        themeCoherence: 88,
        technicalCorrectness: 85,
        polish: 80,
        reasoning: 'Strong stud values and coherent theme.',
        suggestions: ['Add torch sconces'],
      }),
    )

    const result = await scoreOutput({
      prompt: 'Build a stone castle',
      response: 'Here is a 50-stud stone tower with Slate material walls...',
      mode: 'build',
      theme: 'medieval-fantasy',
    })

    expect(result.source).toBe('llm')
    expect(result.total).toBeGreaterThan(80)
    expect(result.axes.relevance).toBe(95)
    expect(result.shouldRetry).toBe(false)
    expect(result.suggestions).toContain('Add torch sconces')
  })

  it('handles JSON wrapped in markdown fences', async () => {
    mockCallAI.mockResolvedValueOnce(
      '```json\n{"relevance":70,"completeness":70,"themeCoherence":70,"technicalCorrectness":70,"polish":70,"reasoning":"ok","suggestions":[]}\n```',
    )
    const result = await scoreOutput({
      prompt: 'p',
      response: 'some long enough response that passes the length floor check',
      mode: 'chat',
    })
    expect(result.source).toBe('llm')
    expect(result.total).toBe(70)
  })

  it('flags shouldRetry when score < 60', async () => {
    mockCallAI.mockResolvedValueOnce(
      JSON.stringify({
        relevance: 30,
        completeness: 30,
        themeCoherence: 30,
        technicalCorrectness: 30,
        polish: 30,
        reasoning: 'weak',
        suggestions: [],
      }),
    )
    const result = await scoreOutput({
      prompt: 'p',
      response: 'long enough response string to avoid the obvious-broken short-circuit',
      mode: 'build',
    })
    expect(result.total).toBe(30)
    expect(result.shouldRetry).toBe(true)
  })

  it('falls back to heuristic scoring when the judge returns garbage', async () => {
    mockCallAI.mockResolvedValueOnce('totally not json')
    const result = await scoreOutput({
      prompt: 'Write a Luau script',
      response: '```lua\nlocal Players = game:GetService("Players")\nPlayers.PlayerAdded:Connect(function(p) print(p.Name) end)\n```',
      mode: 'script',
      intent: 'script',
    })
    expect(result.source).toBe('heuristic-fallback')
    expect(result.total).toBeGreaterThan(0)
  })

  it('falls back to heuristic scoring when the provider throws', async () => {
    mockCallAI.mockRejectedValueOnce(new Error('network down'))
    const result = await scoreOutput({
      prompt: 'p',
      response: 'a reasonable long response mentioning castle medieval stone 50 studs',
      mode: 'build',
    })
    expect(result.source).toBe('heuristic-fallback')
    expect(result.total).toBeGreaterThanOrEqual(0)
  })

  it('clamps out-of-range axis values', async () => {
    mockCallAI.mockResolvedValueOnce(
      JSON.stringify({
        relevance: 150,
        completeness: -10,
        themeCoherence: 'bad',
        technicalCorrectness: 75,
        polish: 80,
        reasoning: 'ok',
        suggestions: ['a', 'b'],
      }),
    )
    const result = await scoreOutput({
      prompt: 'p',
      response: 'long enough response to bypass short-circuit',
      mode: 'build' as QualityMode,
    })
    expect(result.axes.relevance).toBeLessThanOrEqual(100)
    expect(result.axes.completeness).toBeGreaterThanOrEqual(0)
    expect(result.axes.themeCoherence).toBe(50) // fallback default for non-numeric
  })
})
