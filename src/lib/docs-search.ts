/**
 * Simple client-side search for the ForjeGames docs.
 *
 * The index is a flat array of documents (one entry per page, plus optional
 * per-section entries so deep-links land on the right heading). Each entry has
 * a rich text blob (title + headings + body) that the ranker tokenizes.
 *
 * Ranking is intentionally tiny and dependency-free:
 *  - tokenize the query into lowercase terms
 *  - for each doc, sum per-term hits weighted by where the term appears
 *    (title > headings > body) and how long the doc is
 *  - return the top N hits with a snippet built around the first match
 *
 * This lives on the client. It's cheap enough (fewer than a hundred entries)
 * that we don't need an inverted index, and the result is trivially
 * replaceable with Algolia or Typesense later — just swap out `searchDocs`.
 */

export interface DocSearchEntry {
  /** Canonical URL including optional `#hash` for a section. */
  href: string
  /** Display title shown in search results. */
  title: string
  /** Section / category label used for grouping (e.g. "Editor"). */
  section: string
  /** Keywords and headings within the page — boosted during ranking. */
  keywords?: string[]
  /** Full-text content of the page/section used for matching + snippets. */
  body: string
}

export interface DocSearchHit {
  href: string
  title: string
  section: string
  snippet: string
  score: number
}

// ─────────────────────────────────────────────────────────────────────────────
// Index. Kept here so docs pages never need to re-declare their metadata.

export const DOCS_SEARCH_INDEX: DocSearchEntry[] = [
  {
    href: '/docs',
    title: 'Documentation Home',
    section: 'Introduction',
    keywords: ['overview', 'docs', 'start', 'guides'],
    body: 'ForjeGames documentation home. Guides, API reference, Studio plugin docs and tutorials for the AI-powered Roblox development platform. Start with Getting Started or jump to the API.',
  },
  {
    href: '/docs/getting-started',
    title: 'Getting Started',
    section: 'Introduction',
    keywords: ['quickstart', 'signup', 'first game', 'tutorial', 'onboarding'],
    body: 'Quick start guide. Create an account, open the editor, type a prompt, watch the AI build your Roblox game. Export to Roblox Studio via the plugin. 5 minute tutorial.',
  },
  {
    href: '/docs/editor',
    title: 'Editor Overview',
    section: 'Editor',
    keywords: ['editor', 'ui', 'panels', 'chat', 'preview', 'shortcuts'],
    body: 'The ForjeGames editor. Chat panel, live 3D preview, script output, mode switcher, voice input, asset inserter and keyboard shortcuts. Split pane layout for prompt and preview.',
  },
  {
    href: '/docs/ai-modes',
    title: 'AI Modes',
    section: 'Editor',
    keywords: [
      'modes',
      'build',
      'think',
      'plan',
      'image',
      'script',
      'terrain',
      '3d',
      'debug',
      'ideas',
    ],
    body: 'Nine AI modes: Build, Think, Plan, Image, Script, Terrain, 3D, Debug, Ideas. Each mode targets a different stage of game development from ideation to debugging Luau scripts.',
  },
  {
    href: '/docs/voice-input',
    title: 'Voice Input',
    section: 'Editor',
    keywords: ['voice', 'microphone', 'speech', 'whisper', 'dictation'],
    body: 'Use voice commands to drive the editor. Click the microphone, speak your prompt, ForjeGames transcribes with Whisper and runs it in the active mode. Works hands-free.',
  },
  {
    href: '/docs/image-to-map',
    title: 'Image to Map',
    section: 'Editor',
    keywords: ['image', 'map', 'vision', 'depth', 'sketch', 'screenshot'],
    body: 'Upload a sketch, screenshot or photograph. Claude Vision + Depth Pro analyze it and generate a matching 3D Roblox map. Great for converting concept art into playable levels.',
  },
  {
    href: '/docs/studio-plugin',
    title: 'Studio Plugin',
    section: 'Integrations',
    keywords: [
      'roblox studio',
      'plugin',
      'install',
      'http service',
      'bridge',
      'sync',
    ],
    body: 'Install the ForjeGames Roblox Studio plugin. Download .rbxm, place in plugins folder, restart Studio, enable HttpService, generate code inside ForjeGames, paste into the plugin to sync.',
  },
  {
    href: '/docs/marketplace',
    title: 'Marketplace',
    section: 'Integrations',
    keywords: ['marketplace', 'templates', 'buy', 'sell', 'revenue', 'share'],
    body: 'Marketplace for buying and selling game templates. Creators upload templates, set a price in credits, and earn 80 percent of each sale. Templates can be one-click remixed.',
  },
  {
    href: '/docs/pricing-credits',
    title: 'Pricing & Credits',
    section: 'Billing',
    keywords: ['pricing', 'credits', 'tokens', 'billing', 'subscription', 'free tier'],
    body: 'How credits work on ForjeGames. Each AI action costs credits based on the model. Plans refill monthly. Buy top-ups anytime. Free tier includes 1000 credits to start.',
  },
  {
    href: '/docs/api',
    title: 'REST API',
    section: 'Developers',
    keywords: ['api', 'rest', 'endpoints', 'authentication', 'rate limits', 'http'],
    body: 'REST API reference. Auth with API keys, POST to /v1/generate, list projects, export builds, manage billing. JSON responses, rate limits documented per endpoint.',
  },
  {
    href: '/docs/sdk',
    title: 'SDKs',
    section: 'Developers',
    keywords: ['sdk', 'typescript', 'python', 'client library', 'npm', 'pip'],
    body: 'Official ForjeGames SDKs for TypeScript and Python. Install from npm or pip. Typed request builders, streaming generation helpers, and examples.',
  },
  {
    href: '/docs/troubleshooting',
    title: 'Troubleshooting',
    section: 'Help',
    keywords: [
      'errors',
      'bugs',
      'fix',
      'problems',
      'http 403',
      'plugin not connecting',
      'credits not refilled',
    ],
    body: 'Common issues and fixes. Plugin not connecting, HTTP 403 errors, credits not refilling, voice input not transcribing, image-to-map failures, studio sync conflicts.',
  },
]

// ─────────────────────────────────────────────────────────────────────────────
// Search.

const STOP_WORDS = new Set([
  'the',
  'a',
  'an',
  'and',
  'or',
  'to',
  'of',
  'for',
  'in',
  'on',
  'with',
  'is',
  'are',
  'how',
  'what',
  'do',
  'i',
])

export function tokenize(input: string): string[] {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 1 && !STOP_WORDS.has(t))
}

function buildSnippet(body: string, terms: string[]): string {
  if (!body) return ''
  const lowered = body.toLowerCase()
  let firstIdx = -1
  for (const term of terms) {
    const idx = lowered.indexOf(term)
    if (idx >= 0 && (firstIdx === -1 || idx < firstIdx)) firstIdx = idx
  }
  if (firstIdx === -1) return body.slice(0, 110) + (body.length > 110 ? '…' : '')
  const start = Math.max(0, firstIdx - 40)
  const end = Math.min(body.length, firstIdx + 90)
  const prefix = start > 0 ? '…' : ''
  const suffix = end < body.length ? '…' : ''
  return prefix + body.slice(start, end).trim() + suffix
}

export function searchDocs(
  query: string,
  index: DocSearchEntry[] = DOCS_SEARCH_INDEX,
  limit = 10,
): DocSearchHit[] {
  const terms = tokenize(query)
  if (terms.length === 0) return []

  const hits: DocSearchHit[] = []

  for (const entry of index) {
    const titleLc = entry.title.toLowerCase()
    const keywordsLc = (entry.keywords ?? []).map((k) => k.toLowerCase())
    const bodyLc = entry.body.toLowerCase()
    let score = 0
    let matchedAny = false

    for (const term of terms) {
      let termScore = 0
      if (titleLc.includes(term)) {
        termScore += titleLc === term ? 20 : 10
      }
      if (titleLc.startsWith(term)) termScore += 4
      for (const kw of keywordsLc) {
        if (kw === term) termScore += 6
        else if (kw.includes(term)) termScore += 3
      }
      if (bodyLc.includes(term)) {
        // count occurrences but cap the contribution so long pages don't win
        // by volume alone
        const occurrences = bodyLc.split(term).length - 1
        termScore += Math.min(4, occurrences)
      }
      if (termScore > 0) {
        matchedAny = true
        score += termScore
      }
    }

    if (matchedAny) {
      hits.push({
        href: entry.href,
        title: entry.title,
        section: entry.section,
        snippet: buildSnippet(entry.body, terms),
        score,
      })
    }
  }

  hits.sort((a, b) => b.score - a.score)
  return hits.slice(0, limit)
}
