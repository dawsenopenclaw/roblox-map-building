/**
 * low-context-amplifier.test.ts
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockCallAI } = vi.hoisted(() => ({ mockCallAI: vi.fn() }))

vi.mock('@/lib/ai/provider', () => ({ callAI: mockCallAI }))
vi.mock('../provider', () => ({ callAI: mockCallAI }))

import {
  amplifyLowContext,
  detectVagueness,
  _heuristicAmplifyForTest,
} from '../low-context-amplifier'

beforeEach(() => {
  mockCallAI.mockReset()
})

describe('detectVagueness', () => {
  it('scores empty strings as fully vague', () => {
    expect(detectVagueness('')).toBe(1)
  })

  it('scores ultra-short prompts as vague', () => {
    expect(detectVagueness('castle')).toBeGreaterThan(0.5)
  })

  it('scores specific prompts as low vagueness', () => {
    const v = detectVagueness(
      'Build a 50-stud tall gothic stone cathedral with stained glass windows and flying buttresses',
    )
    expect(v).toBeLessThan(0.3)
  })

  it('penalises filler words', () => {
    const vFiller = detectVagueness('just make a cool game thing please')
    const vClean = detectVagueness('build a medieval tavern with oak beams')
    expect(vFiller).toBeGreaterThan(vClean)
  })
})

describe('_heuristicAmplifyForTest', () => {
  it('infers a genre for castle prompts', () => {
    const spec = _heuristicAmplifyForTest('make a castle')
    expect(spec.genre).toBe('medieval-fantasy')
    expect(spec.amplified).toBe(true)
    expect(spec.source).toBe('heuristic')
    expect(spec.technicalConstraints.length).toBeGreaterThan(0)
  })

  it('falls back to generic for unknown prompts', () => {
    const spec = _heuristicAmplifyForTest('thingamajig')
    expect(spec.genre).toBe('generic')
  })
})

describe('amplifyLowContext', () => {
  it('passes through rich prompts without calling the LLM', async () => {
    const richPrompt =
      'Build a 50-stud tall gothic stone cathedral with stained glass windows and flying buttresses on a cliff'
    const spec = await amplifyLowContext(richPrompt)
    expect(spec.amplified).toBe(false)
    expect(spec.source).toBe('passthrough')
    expect(spec.expertBrief).toBe(richPrompt)
    expect(mockCallAI).not.toHaveBeenCalled()
  })

  it('calls the LLM for vague prompts and parses the response', async () => {
    mockCallAI.mockResolvedValueOnce(
      JSON.stringify({
        expertBrief:
          'A medieval stone castle with 30-stud curtain walls, crenellated battlements every 6 studs, and a central keep.',
        genre: 'medieval-fantasy',
        mood: ['grand', 'noble', 'warm'],
        narrative: 'A royal seat overlooking the realm.',
        estimatedParts: 180,
        technicalConstraints: [
          'Use Slate material for walls',
          'Include at least 3 towers',
          'Warm golden-hour lighting',
        ],
      }),
    )

    const spec = await amplifyLowContext('make a castle')
    expect(mockCallAI).toHaveBeenCalledTimes(1)
    expect(spec.amplified).toBe(true)
    expect(spec.source).toBe('llm')
    expect(spec.genre).toBe('medieval-fantasy')
    expect(spec.estimatedParts).toBe(180)
    expect(spec.mood).toEqual(['grand', 'noble', 'warm'])
    expect(spec.technicalConstraints).toHaveLength(3)
  })

  it('falls back to heuristic when the LLM returns garbage', async () => {
    mockCallAI.mockResolvedValueOnce('not json at all')
    const spec = await amplifyLowContext('make a castle')
    expect(spec.source).toBe('heuristic')
    expect(spec.genre).toBe('medieval-fantasy')
  })

  it('falls back to heuristic when the LLM throws', async () => {
    mockCallAI.mockRejectedValueOnce(new Error('network down'))
    const spec = await amplifyLowContext('tycoon game')
    expect(spec.source).toBe('heuristic')
    expect(spec.genre).toBe('tycoon-simulator')
  })

  it('coerces unknown genre from the LLM to the heuristic inference', async () => {
    mockCallAI.mockResolvedValueOnce(
      JSON.stringify({
        expertBrief: 'a haunted old house',
        genre: 'totally-made-up-genre',
        mood: ['spooky'],
        narrative: '',
        estimatedParts: 90,
        technicalConstraints: [],
      }),
    )
    const spec = await amplifyLowContext('haunted mansion')
    expect(spec.genre).toBe('horror-mansion')
  })

  it('records latency', async () => {
    mockCallAI.mockResolvedValueOnce(
      JSON.stringify({
        expertBrief: 'x',
        genre: 'generic',
        mood: [],
        narrative: '',
        estimatedParts: 50,
        technicalConstraints: [],
      }),
    )
    const spec = await amplifyLowContext('build something')
    expect(spec.latencyMs).toBeGreaterThanOrEqual(0)
  })
})
