import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PNG } from 'pngjs'

import {
  runPlaytestLoop,
  parseOutputForErrors,
  compareScreenshots,
  detectVisualBugs,
  type PlaytestLoopOptions,
  type OutputLogEntry,
} from './playtest-loop'

// ---------------------------------------------------------------------------
// Mock fetch globally
// ---------------------------------------------------------------------------

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

beforeEach(() => {
  vi.clearAllMocks()
})

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function jsonResponse(body: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: 'OK',
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(JSON.stringify(body)),
  }
}

function baseOptions(overrides: Partial<PlaytestLoopOptions> = {}): PlaytestLoopOptions {
  return {
    code: 'print("hello")',
    sessionId: 'sess_123',
    apiBaseUrl: 'http://localhost:3000',
    maxIterations: 3,
    playtestDurationSec: 0, // skip waiting in tests
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// parseOutputForErrors
// ---------------------------------------------------------------------------

describe('parseOutputForErrors', () => {
  it('detects entries with messageType "error"', () => {
    const entries: OutputLogEntry[] = [
      { message: 'something went wrong', messageType: 'error', timestamp: 1 },
      { message: 'all good', messageType: 'output', timestamp: 2 },
    ]
    const errors = parseOutputForErrors(entries)
    expect(errors).toEqual(['something went wrong'])
  })

  it('detects "attempt to index nil" in output entries', () => {
    const entries: OutputLogEntry[] = [
      {
        message: 'ServerScriptService.Script:5: attempt to index nil with "Position"',
        messageType: 'output',
        timestamp: 1,
      },
    ]
    const errors = parseOutputForErrors(entries)
    expect(errors).toHaveLength(1)
    expect(errors[0]).toContain('attempt to index nil')
  })

  it('detects "[Error]" prefix', () => {
    const entries: OutputLogEntry[] = [
      { message: '[Error] Failed to load module', messageType: 'output', timestamp: 1 },
    ]
    const errors = parseOutputForErrors(entries)
    expect(errors).toHaveLength(1)
  })

  it('detects "is not a valid member of"', () => {
    const entries: OutputLogEntry[] = [
      {
        message: 'Foo is not a valid member of Workspace',
        messageType: 'output',
        timestamp: 1,
      },
    ]
    const errors = parseOutputForErrors(entries)
    expect(errors).toHaveLength(1)
  })

  it('detects "infinite yield possible"', () => {
    const entries: OutputLogEntry[] = [
      {
        message: 'infinite yield possible on WaitForChild',
        messageType: 'warning',
        timestamp: 1,
      },
    ]
    const errors = parseOutputForErrors(entries)
    expect(errors).toHaveLength(1)
  })

  it('returns empty array for clean output', () => {
    const entries: OutputLogEntry[] = [
      { message: 'Hello world', messageType: 'output', timestamp: 1 },
      { message: 'Script loaded', messageType: 'info', timestamp: 2 },
    ]
    const errors = parseOutputForErrors(entries)
    expect(errors).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// runPlaytestLoop — success on first try
// ---------------------------------------------------------------------------

describe('runPlaytestLoop', () => {
  it('returns success when no errors are found', async () => {
    // Each studioCommand call triggers a fetch to /api/studio/command
    // Then screenshot + output log fetches
    mockFetch.mockImplementation(async (url: string) => {
      if (url.includes('/api/studio/command')) {
        return jsonResponse({ ok: true, commandId: 'cmd_1' })
      }
      if (url.includes('/screenshot')) {
        return jsonResponse({ screenshot: 'data:image/png;base64,abc' })
      }
      if (url.includes('/output')) {
        return jsonResponse([
          { message: 'Hello world', messageType: 'output', timestamp: 1 },
        ])
      }
      return jsonResponse({})
    })

    const result = await runPlaytestLoop(baseOptions())

    expect(result.success).toBe(true)
    expect(result.iterations).toBe(1)
    expect(result.errors).toEqual([])
    expect(result.screenshotUrl).toBe('data:image/png;base64,abc')
    expect(result.finalCode).toBe('print("hello")')
  })

  it('returns failure when errors are found and no fix callback', async () => {
    mockFetch.mockImplementation(async (url: string) => {
      if (url.includes('/api/studio/command')) {
        return jsonResponse({ ok: true })
      }
      if (url.includes('/screenshot')) {
        return jsonResponse({})
      }
      if (url.includes('/output')) {
        return jsonResponse([
          { message: 'attempt to index nil with "Position"', messageType: 'error', timestamp: 1 },
        ])
      }
      return jsonResponse({})
    })

    const result = await runPlaytestLoop(baseOptions())

    expect(result.success).toBe(false)
    expect(result.iterations).toBe(1)
    expect(result.errors.length).toBeGreaterThan(0)
  })

  it('retries with fixed code when onFixCode is provided', async () => {
    let callCount = 0

    mockFetch.mockImplementation(async (url: string) => {
      if (url.includes('/api/studio/command')) {
        return jsonResponse({ ok: true })
      }
      if (url.includes('/screenshot')) {
        return jsonResponse({})
      }
      if (url.includes('/output')) {
        callCount++
        // First iteration: errors. Second iteration: clean.
        if (callCount <= 1) {
          return jsonResponse([
            { message: 'attempt to index nil', messageType: 'error', timestamp: 1 },
          ])
        }
        return jsonResponse([
          { message: 'OK', messageType: 'output', timestamp: 2 },
        ])
      }
      return jsonResponse({})
    })

    const onFixCode = vi.fn().mockResolvedValue('print("fixed")')

    const result = await runPlaytestLoop(
      baseOptions({ onFixCode }),
    )

    expect(result.success).toBe(true)
    expect(result.iterations).toBe(2)
    expect(result.finalCode).toBe('print("fixed")')
    expect(onFixCode).toHaveBeenCalledOnce()
    expect(onFixCode).toHaveBeenCalledWith(
      'print("hello")',
      expect.arrayContaining([expect.stringContaining('attempt to index nil')]),
    )
  })

  it('stops after maxIterations even if errors persist', async () => {
    mockFetch.mockImplementation(async (url: string) => {
      if (url.includes('/api/studio/command')) {
        return jsonResponse({ ok: true })
      }
      if (url.includes('/screenshot')) {
        return jsonResponse({})
      }
      if (url.includes('/output')) {
        return jsonResponse([
          { message: 'attempt to index nil', messageType: 'error', timestamp: 1 },
        ])
      }
      return jsonResponse({})
    })

    const onFixCode = vi.fn().mockResolvedValue('print("still broken")')

    const result = await runPlaytestLoop(
      baseOptions({ maxIterations: 2, onFixCode }),
    )

    expect(result.success).toBe(false)
    expect(result.iterations).toBe(2)
    // onFixCode called once (after first failure, before second attempt)
    expect(onFixCode).toHaveBeenCalledOnce()
  })

  it('returns failure immediately when deploy fails', async () => {
    mockFetch.mockImplementation(async (url: string) => {
      if (url.includes('/api/studio/command')) {
        return jsonResponse({ error: 'session_disconnected' }, 400)
      }
      return jsonResponse({})
    })

    const result = await runPlaytestLoop(baseOptions())

    expect(result.success).toBe(false)
    expect(result.iterations).toBe(1)
    expect(result.errors[0]).toContain('Deploy failed')
  })

  it('invokes onProgress callback at each phase', async () => {
    mockFetch.mockImplementation(async (url: string) => {
      if (url.includes('/api/studio/command')) {
        return jsonResponse({ ok: true })
      }
      if (url.includes('/screenshot')) {
        return jsonResponse({})
      }
      if (url.includes('/output')) {
        return jsonResponse([])
      }
      return jsonResponse({})
    })

    const onProgress = vi.fn()
    await runPlaytestLoop(baseOptions({ onProgress }))

    const phases = onProgress.mock.calls.map((c) => c[0])
    expect(phases).toContain('write-script')
    expect(phases).toContain('start-playtest')
    expect(phases).toContain('waiting')
    expect(phases).toContain('capture-screenshot')
    expect(phases).toContain('read-output')
    expect(phases).toContain('stop-playtest')
    expect(phases).toContain('analyzing')
    expect(phases).toContain('done')
  })
})

// ---------------------------------------------------------------------------
// compareScreenshots / detectVisualBugs
// ---------------------------------------------------------------------------

/** Build a solid-color 10x10 PNG as a base64 data URL. */
function makeSolidPngDataUrl(
  r: number,
  g: number,
  b: number,
  a = 255,
  width = 10,
  height = 10,
): string {
  const png = new PNG({ width, height })
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (width * y + x) << 2
      png.data[idx] = r
      png.data[idx + 1] = g
      png.data[idx + 2] = b
      png.data[idx + 3] = a
    }
  }
  const buffer = PNG.sync.write(png)
  return `data:image/png;base64,${buffer.toString('base64')}`
}

describe('compareScreenshots', () => {
  it('returns score 0 for two identical 10x10 PNGs', async () => {
    const before = makeSolidPngDataUrl(255, 0, 0)
    const after = makeSolidPngDataUrl(255, 0, 0)

    const result = await compareScreenshots(before, after)

    expect(result.score).toBe(0)
    expect(result.summary).toBe('Identical')
    expect(result.diffPixelCount).toBe(0)
    expect(result.totalPixels).toBe(100)
  })

  it('returns score > 0 when images differ', async () => {
    const before = makeSolidPngDataUrl(255, 0, 0)
    const after = makeSolidPngDataUrl(0, 255, 0)

    const result = await compareScreenshots(before, after)

    expect(result.score).toBeGreaterThan(0)
    expect(result.summary).toMatch(/% of pixels differ/)
    expect(result.diffPixelCount).toBeGreaterThan(0)
    expect(result.totalPixels).toBe(100)
  })

  it('returns score -1 with error summary when image fails to load', async () => {
    const before = makeSolidPngDataUrl(255, 0, 0)
    const result = await compareScreenshots(before, 'not a png at all')

    expect(result.score).toBe(-1)
    expect(result.summary).toMatch(/^Error:/)
  })
})

describe('detectVisualBugs', () => {
  it('flags only regions whose score exceeds the threshold', async () => {
    const red = makeSolidPngDataUrl(255, 0, 0)
    const green = makeSolidPngDataUrl(0, 255, 0)

    const regions = await detectVisualBugs([
      { before: red, after: red, label: 'identical' },
      { before: red, after: green, label: 'swapped' },
    ])

    expect(regions).toHaveLength(1)
    expect(regions[0].label).toBe('swapped')
    expect(regions[0].score).toBeGreaterThan(0.05)
  })
})
