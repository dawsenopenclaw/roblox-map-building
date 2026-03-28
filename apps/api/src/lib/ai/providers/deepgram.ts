/**
 * Deepgram speech-to-text client
 * Supports: REST transcription (audio buffer), streaming via WebSocket, confidence scoring
 */

export interface TranscriptWord {
  word: string
  start: number
  end: number
  confidence: number
}

export interface TranscriptResult {
  transcript: string
  confidence: number
  words: TranscriptWord[]
  durationSec: number
  costUsd: number
  durationMs: number
}

// Deepgram Nova-2 pricing: $0.0043 per minute
const DEEPGRAM_COST_PER_MINUTE = 0.0043

function estimateDeepgramCost(durationSec: number): number {
  return (durationSec / 60) * DEEPGRAM_COST_PER_MINUTE
}

/**
 * Transcribe an audio buffer using Deepgram REST API
 * Supports: wav, mp3, ogg, flac, m4a, webm
 */
export async function transcribeAudio(
  audioBuffer: Buffer,
  options: {
    mimeType?: string
    model?: string
    language?: string
    punctuate?: boolean
    smartFormat?: boolean
    diarize?: boolean
  } = {}
): Promise<TranscriptResult> {
  const apiKey = process.env.DEEPGRAM_API_KEY
  if (!apiKey) throw new Error('DEEPGRAM_API_KEY not configured')

  const {
    mimeType = 'audio/wav',
    model = 'nova-2',
    language = 'en-US',
    punctuate = true,
    smartFormat = true,
    diarize = false,
  } = options

  const params = new URLSearchParams({
    model,
    language,
    punctuate: String(punctuate),
    smart_format: String(smartFormat),
    diarize: String(diarize),
  })

  const start = Date.now()
  const response = await fetch(
    `https://api.deepgram.com/v1/listen?${params.toString()}`,
    {
      method: 'POST',
      headers: {
        Authorization: `Token ${apiKey}`,
        'Content-Type': mimeType,
      },
      body: audioBuffer,
    }
  )

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Deepgram API error ${response.status}: ${text}`)
  }

  const data = (await response.json()) as {
    results?: {
      channels?: Array<{
        alternatives?: Array<{
          transcript: string
          confidence: number
          words: Array<{
            word: string
            start: number
            end: number
            confidence: number
          }>
        }>
      }>
    }
    metadata?: {
      duration?: number
    }
  }

  const alternative = data.results?.channels?.[0]?.alternatives?.[0]
  if (!alternative) {
    throw new Error('Deepgram returned no transcription alternatives')
  }

  const durationSec = data.metadata?.duration ?? 0

  return {
    transcript: alternative.transcript,
    confidence: alternative.confidence,
    words: alternative.words ?? [],
    durationSec,
    costUsd: estimateDeepgramCost(durationSec),
    durationMs: Date.now() - start,
  }
}

/**
 * WebSocket streaming transcription
 * Returns an async generator that yields partial transcripts as they arrive
 */
export async function* transcribeStream(
  audioChunks: AsyncIterable<Buffer>,
  options: {
    model?: string
    language?: string
    interimResults?: boolean
  } = {}
): AsyncGenerator<{ transcript: string; isFinal: boolean; confidence: number }> {
  const apiKey = process.env.DEEPGRAM_API_KEY
  if (!apiKey) throw new Error('DEEPGRAM_API_KEY not configured')

  const {
    model = 'nova-2',
    language = 'en-US',
    interimResults = true,
  } = options

  const params = new URLSearchParams({
    model,
    language,
    interim_results: String(interimResults),
    punctuate: 'true',
    smart_format: 'true',
  })

  const wsUrl = `wss://api.deepgram.com/v1/listen?${params.toString()}`
  const WebSocket = (await import('ws')).default
  const ws = new WebSocket(wsUrl, {
    headers: { Authorization: `Token ${apiKey}` },
  })

  const results: Array<{ transcript: string; isFinal: boolean; confidence: number }> = []
  let wsError: Error | null = null
  let wsOpen = false
  let wsClosed = false

  ws.on('open', () => { wsOpen = true })
  ws.on('error', (err) => { wsError = err })
  ws.on('close', () => { wsClosed = true })
  ws.on('message', (raw) => {
    try {
      const msg = JSON.parse(raw.toString()) as {
        type: string
        channel?: {
          alternatives?: Array<{ transcript: string; confidence: number }>
        }
        is_final?: boolean
      }
      if (msg.type === 'Results') {
        const alt = msg.channel?.alternatives?.[0]
        if (alt?.transcript) {
          results.push({
            transcript: alt.transcript,
            isFinal: msg.is_final ?? false,
            confidence: alt.confidence ?? 0,
          })
        }
      }
    } catch {
      // ignore parse errors
    }
  })

  // Wait for ws to open
  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Deepgram WS timeout')), 10_000)
    ws.once('open', () => { clearTimeout(timeout); resolve() })
    ws.once('error', (err) => { clearTimeout(timeout); reject(err) })
  })

  // Stream audio chunks
  for await (const chunk of audioChunks) {
    if (ws.readyState === ws.OPEN) {
      ws.send(chunk)
    }
  }

  // Signal end of audio
  if (ws.readyState === ws.OPEN) {
    ws.send(JSON.stringify({ type: 'CloseStream' }))
  }

  // Wait for close and yield results
  await new Promise<void>((resolve) => {
    const check = setInterval(() => {
      if (wsClosed || wsError) { clearInterval(check); resolve() }
    }, 100)
    setTimeout(() => { clearInterval(check); resolve() }, 30_000)
  })

  if (wsError) throw wsError

  for (const result of results) {
    yield result
  }
}

/**
 * Estimate cost for a given audio duration before transcription
 */
export function estimateTranscriptionCost(durationSec: number): {
  estimatedCostUsd: number
  durationSec: number
} {
  return {
    estimatedCostUsd: estimateDeepgramCost(durationSec),
    durationSec,
  }
}
