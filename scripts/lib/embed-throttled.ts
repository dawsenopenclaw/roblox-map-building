/**
 * Shared throttled embedding helper for all ingest scripts.
 *
 * Gemini free tier for gemini-embedding-001 = 100 RPM.
 * We throttle to ~85 RPM (700ms gap) and retry on 429 with backoff.
 *
 * All ingest scripts (videos, API dump, docs, seed) MUST use this so
 * concurrent ingest jobs don't blow each other up.
 */

const MIN_GAP_MS = 700           // ~85 RPM, leaves headroom under 100 RPM cap
const MAX_RETRIES = 6            // 429 retries before giving up
const BACKOFF_BASE_MS = 4000     // first retry after 4s, then 8/16/32/64/128

let lastRequestAt = 0

async function gate(): Promise<void> {
  const now = Date.now()
  const wait = lastRequestAt + MIN_GAP_MS - now
  if (wait > 0) await new Promise((r) => setTimeout(r, wait))
  lastRequestAt = Date.now()
}

export async function embedThrottled(text: string): Promise<number[]> {
  const key = process.env.GEMINI_API_KEY
  if (!key) throw new Error('GEMINI_API_KEY required')

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    await gate()
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${key}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'models/gemini-embedding-001',
          content: { parts: [{ text: text.slice(0, 2048) }] },
          outputDimensionality: 768,
        }),
      },
    )

    if (res.ok) {
      const data = (await res.json()) as { embedding?: { values?: number[] } }
      return data.embedding?.values ?? []
    }

    if (res.status === 429 && attempt < MAX_RETRIES) {
      const backoff = BACKOFF_BASE_MS * Math.pow(2, attempt)
      console.error(`   ⏳ 429 — backing off ${backoff}ms (attempt ${attempt + 1}/${MAX_RETRIES})`)
      await new Promise((r) => setTimeout(r, backoff))
      continue
    }

    const errText = await res.text().catch(() => '')
    throw new Error(`embed: HTTP ${res.status} ${errText.slice(0, 200)}`)
  }
  throw new Error('embed: exhausted retries on 429')
}
