'use client'
import { useState } from 'react'

type Language = 'typescript' | 'python' | 'curl'
type EndpointId = string

const ENDPOINTS = [
  {
    id: 'auth',
    category: 'Authentication',
    method: 'GET',
    path: '/api/auth/me',
    description: 'Get the authenticated user profile.',
    auth: true,
    params: [],
    responseSample: `{
  "id": "usr_abc123",
  "email": "you@example.com",
  "username": "creator",
  "role": "CREATOR"
}`,
  },
  {
    id: 'terrain-generate',
    category: 'Terrain',
    method: 'POST',
    path: '/api/ai/generate/terrain',
    description: 'Generate a Roblox terrain map from a text prompt.',
    auth: true,
    params: [
      { name: 'prompt', type: 'string', required: true, description: 'Natural language description of the terrain' },
      { name: 'style', type: 'string', required: false, description: 'Art style: realistic | cartoon | lowpoly' },
      { name: 'size', type: 'number', required: false, description: 'Map size in studs (512\u20134096)' },
    ],
    responseSample: `{
  "buildId": "bld_xyz789",
  "status": "queued",
  "estimatedSeconds": 45,
  "downloadUrl": null
}`,
  },
  {
    id: 'keys-list',
    category: 'API Keys',
    method: 'GET',
    path: '/api/keys',
    description: 'List all API keys for the authenticated user.',
    auth: true,
    params: [],
    responseSample: `{
  "keys": [
    {
      "id": "key_abc",
      "name": "Production",
      "prefix": "rf_sk_a1b2c3d4...",
      "scopes": ["full"],
      "tier": "CREATOR",
      "lastUsedAt": "2026-03-28T12:00:00Z",
      "createdAt": "2026-01-01T00:00:00Z"
    }
  ]
}`,
  },
  {
    id: 'keys-create',
    category: 'API Keys',
    method: 'POST',
    path: '/api/keys',
    description: 'Create a new API key. The raw key is returned once \u2014 store it securely.',
    auth: true,
    params: [
      { name: 'name', type: 'string', required: true, description: 'Human-readable name for the key' },
      { name: 'scopes', type: 'string[]', required: false, description: 'full | terrain-only | assets-only | read-only' },
      { name: 'expiresAt', type: 'string', required: false, description: 'ISO 8601 expiry date' },
    ],
    responseSample: `{
  "key": {
    "id": "key_new",
    "name": "My Key",
    "prefix": "rf_sk_a1b2...",
    "rawKey": "rf_sk_a1b2c3d4e5f6...",
    "scopes": ["read-only"],
    "createdAt": "2026-03-28T00:00:00Z"
  }
}`,
  },
  {
    id: 'notifications-list',
    category: 'Notifications',
    method: 'GET',
    path: '/api/notifications',
    description: 'List in-app notifications for the user. Supports cursor pagination.',
    auth: true,
    params: [
      { name: 'limit', type: 'number', required: false, description: 'Items per page (max 50)' },
      { name: 'cursor', type: 'string', required: false, description: 'Pagination cursor (ISO timestamp)' },
    ],
    responseSample: `{
  "notifications": [...],
  "unreadCount": 3,
  "hasMore": false,
  "nextCursor": null
}`,
  },
  {
    id: 'earnings-summary',
    category: 'Earnings',
    method: 'GET',
    path: '/api/earnings/summary',
    description: 'Get aggregated earnings statistics with chart data.',
    auth: true,
    params: [
      { name: 'period', type: 'string', required: false, description: 'daily | weekly | monthly (default: monthly)' },
    ],
    responseSample: `{
  "summary": {
    "totalRevenue": "150.00",
    "netRevenue": "105.00",
    "paidOut": "80.00",
    "pending": "25.00",
    "salesCount": 42
  },
  "chart": [{"date": "2026-03", "revenue": "105.00"}],
  "milestones": { "current": 10500, "next": 100000 }
}`,
  },
]

function codeExample(lang: Language, endpoint: (typeof ENDPOINTS)[0]): string {
  const hasBody = endpoint.method === 'POST'
  const bodyParams = endpoint.params.filter((p) => p.required).reduce(
    (acc, p) => ({ ...acc, [p.name]: `<${p.name}>` }),
    {} as Record<string, string>
  )

  if (lang === 'typescript') {
    return `import { RobloxForge } from '@robloxforge/sdk'

const rf = new RobloxForge({ apiKey: 'rf_sk_...' })

${
  hasBody
    ? `const result = await rf.request('${endpoint.method}', '${endpoint.path}', ${JSON.stringify(bodyParams, null, 2)})`
    : `const result = await rf.request('${endpoint.method}', '${endpoint.path}')`
}
console.log(result)`
  }

  if (lang === 'python') {
    return `import robloxforge

rf = robloxforge.Client(api_key="rf_sk_...")

${
  hasBody
    ? `result = rf.request("${endpoint.method}", "${endpoint.path}", data=${JSON.stringify(bodyParams)})`
    : `result = rf.request("${endpoint.method}", "${endpoint.path}")`
}
print(result)`
  }

  // curl
  return `curl -X ${endpoint.method} \\
  https://api.robloxforge.com${endpoint.path} \\
  -H "Authorization: Bearer rf_sk_..." \\
  -H "Content-Type: application/json"${
    hasBody ? ` \\\n  -d '${JSON.stringify(bodyParams)}'` : ''
  }`
}

// Lightweight syntax highlighter with no external dependency.
// HTML-escapes input first, then wraps recognised tokens in colored spans.
function highlight(code: string, lang: Language): string {
  const esc = code
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

  if (lang === 'curl') {
    return esc
      .replace(/(https?:\/\/[^\s\\]+)/g, '<span style="color:#86efac">$1</span>')
      .replace(/\b(GET|POST|PUT|DELETE|PATCH)\b/g, '<span style="color:#c084fc">$1</span>')
      .replace(/((?:^|\s)(?:-X|-H|-d|curl)(?=\s))/gm, '<span style="color:#FFB81C">$1</span>')
      .replace(/(&#39;[^&#]*&#39;|&quot;[^&]*&quot;)/g, '<span style="color:#7dd3fc">$1</span>')
  }

  if (lang === 'python') {
    return esc
      .replace(/(#[^\n]*)/g, '<span style="color:#6b7280">$1</span>')
      .replace(/\b(import|from|as|def|class|return|if|else|elif|for|in|while|True|False|None|print|await|async)\b/g,
        '<span style="color:#c084fc">$1</span>')
      .replace(/(&quot;[^&]*&quot;|&#39;[^&]*&#39;)/g, '<span style="color:#7dd3fc">$1</span>')
      .replace(/\b(\d+)\b/g, '<span style="color:#fb923c">$1</span>')
      .replace(/\b([a-zA-Z_]\w*)(?=\()/g, '<span style="color:#FFB81C">$1</span>')
  }

  // typescript
  return esc
    .replace(/(\/\/[^\n]*)/g, '<span style="color:#6b7280">$1</span>')
    .replace(/\b(import|export|const|let|var|function|return|await|async|new|from|type|interface|class|if|else|for|of|in|true|false|null|undefined)\b/g,
      '<span style="color:#c084fc">$1</span>')
    .replace(/(&quot;[^&]*&quot;|&#39;[^&]*&#39;)/g, '<span style="color:#7dd3fc">$1</span>')
    .replace(/\b(\d+)\b/g, '<span style="color:#fb923c">$1</span>')
    .replace(/\b([a-zA-Z_]\w*)(?=\()/g, '<span style="color:#FFB81C">$1</span>')
}

const CATEGORIES = [...new Set(ENDPOINTS.map((e) => e.category))]

const METHOD_COLOR: Record<string, string> = {
  GET: 'text-green-400 bg-green-400/10 border-green-400/20',
  POST: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
  DELETE: 'text-red-400 bg-red-400/10 border-red-400/20',
  PUT: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
}

export default function DocsClient() {
  const [activeEndpoint, setActiveEndpoint] = useState<EndpointId>(ENDPOINTS[0].id)
  const [lang, setLang] = useState<Language>('typescript')
  const [tryResult, setTryResult] = useState<string | null>(null)
  const [trying, setTrying] = useState(false)
  const [apiKey, setApiKey] = useState('')

  const endpoint = ENDPOINTS.find((e) => e.id === activeEndpoint)!

  async function tryEndpoint() {
    if (!apiKey) return
    setTrying(true)
    setTryResult(null)
    try {
      const hasBody = endpoint.method === 'POST'
      const bodyParams = endpoint.params
        .filter((p) => p.required)
        .reduce((acc, p) => ({ ...acc, [p.name]: `<${p.name}>` }), {} as Record<string, string>)

      const res = await fetch(`https://api.robloxforge.com${endpoint.path}`, {
        method: endpoint.method,
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        ...(hasBody ? { body: JSON.stringify(bodyParams) } : {}),
      })
      const data = await res.json()
      setTryResult(JSON.stringify(data, null, 2))
    } catch (err) {
      setTryResult(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setTrying(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#060918]">
      {/* Docs sub-header — sits below the marketing nav (top-[57px]) */}
      <div className="border-b border-white/10 bg-[#060918]/80 backdrop-blur-xl sticky top-[57px] z-30">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">
          <span className="text-white font-semibold text-sm">API Reference</span>
          <span className="text-xs border border-white/10 text-gray-500 px-2 py-0.5 rounded-md">v1</span>
          <div className="ml-auto">
            <a
              href="https://github.com/robloxforge"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs border border-white/10 hover:border-white/30 text-gray-400 hover:text-white px-3 py-1.5 rounded-lg transition-colors"
            >
              GitHub
            </a>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 flex gap-6">
        {/* Sidebar */}
        <aside className="w-56 flex-shrink-0 hidden lg:block">
          <div className="sticky top-28 space-y-6">
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Introduction
              </h3>
              <ul className="space-y-1">
                <li>
                  <a href="#authentication" className="text-sm text-gray-400 hover:text-white block py-1 transition-colors">
                    Authentication
                  </a>
                </li>
                <li>
                  <a href="#rate-limits" className="text-sm text-gray-400 hover:text-white block py-1 transition-colors">
                    Rate Limits
                  </a>
                </li>
                <li>
                  <a href="#errors" className="text-sm text-gray-400 hover:text-white block py-1 transition-colors">
                    Errors
                  </a>
                </li>
              </ul>
            </div>

            {CATEGORIES.map((cat) => (
              <div key={cat}>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{cat}</h3>
                <ul className="space-y-1">
                  {ENDPOINTS.filter((e) => e.category === cat).map((ep) => (
                    <li key={ep.id}>
                      <button
                        onClick={() => setActiveEndpoint(ep.id)}
                        className={`text-sm text-left w-full py-1 px-2 rounded-lg transition-colors ${
                          activeEndpoint === ep.id
                            ? 'text-[#FFB81C] bg-[#FFB81C]/10'
                            : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        <span className="text-xs text-gray-600 mr-1">{ep.method}</span>
                        {ep.path.split('/').pop()}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0">
          {/* Auth section */}
          <section id="authentication" className="mb-12">
            <h2 className="text-xl font-bold text-white mb-4">Authentication</h2>
            <div className="bg-[#0D1231] border border-white/10 rounded-2xl p-6">
              <p className="text-gray-300 text-sm mb-4">
                All API requests must include a Bearer token in the Authorization header. Generate API keys in{' '}
                <a href="/settings/api-keys" className="text-[#FFB81C] hover:underline">Settings &rarr; API Keys</a>.
              </p>
              <pre className="bg-black/40 rounded-xl p-4 text-sm text-gray-300 font-mono">
                Authorization: Bearer rf_sk_your_key_here
              </pre>
            </div>
          </section>

          {/* Rate limits section */}
          <section id="rate-limits" className="mb-12">
            <h2 className="text-xl font-bold text-white mb-4">Rate Limits</h2>
            <div className="bg-[#0D1231] border border-white/10 rounded-2xl p-6 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-500 border-b border-white/10">
                    <th className="text-left pb-3 pr-4">Tier</th>
                    <th className="text-left pb-3 pr-4">Requests/min</th>
                    <th className="text-left pb-3">Requests/day</th>
                  </tr>
                </thead>
                <tbody className="text-gray-300">
                  {[
                    { tier: 'Free', rpm: '60', rpd: '1,000' },
                    { tier: 'Hobby', rpm: '120', rpd: '10,000' },
                    { tier: 'Creator', rpm: '300', rpd: '50,000' },
                    { tier: 'Studio', rpm: '600', rpd: 'Unlimited' },
                  ].map((row) => (
                    <tr key={row.tier} className="border-b border-white/5">
                      <td className="py-3 pr-4 font-medium">{row.tier}</td>
                      <td className="py-3 pr-4">{row.rpm}</td>
                      <td className="py-3">{row.rpd}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="text-gray-500 text-xs mt-4">
                Rate limit status returned in <code className="text-[#FFB81C]">X-RateLimit-Limit</code> and{' '}
                <code className="text-[#FFB81C]">X-RateLimit-Remaining</code> headers.
              </p>
            </div>
          </section>

          {/* Errors section */}
          <section id="errors" className="mb-12">
            <h2 className="text-xl font-bold text-white mb-4">Errors</h2>
            <div className="bg-[#0D1231] border border-white/10 rounded-2xl p-6 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-500 border-b border-white/10">
                    <th className="text-left pb-3 pr-4">Status</th>
                    <th className="text-left pb-3">Meaning</th>
                  </tr>
                </thead>
                <tbody className="text-gray-300">
                  {[
                    { status: '400', meaning: 'Bad Request \u2014 missing or invalid parameters' },
                    { status: '401', meaning: 'Unauthorized \u2014 missing or invalid API key' },
                    { status: '403', meaning: 'Forbidden \u2014 key lacks required scope' },
                    { status: '429', meaning: 'Too Many Requests \u2014 rate limit exceeded' },
                    { status: '500', meaning: 'Internal Server Error' },
                  ].map((row) => (
                    <tr key={row.status} className="border-b border-white/5">
                      <td className="py-3 pr-4 font-mono text-red-400">{row.status}</td>
                      <td className="py-3">{row.meaning}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Endpoint detail */}
          <section className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <span
                className={`text-xs font-bold px-2.5 py-1 rounded border ${
                  METHOD_COLOR[endpoint.method] ?? 'text-gray-400 bg-white/5 border-white/10'
                }`}
              >
                {endpoint.method}
              </span>
              <code className="text-white text-lg font-mono">{endpoint.path}</code>
            </div>
            <p className="text-gray-400 text-sm mb-6">{endpoint.description}</p>

            {/* Language selector */}
            <div className="flex gap-2 mb-4">
              {(['typescript', 'python', 'curl'] as Language[]).map((l) => (
                <button
                  key={l}
                  onClick={() => setLang(l)}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    lang === l
                      ? 'bg-[#FFB81C]/10 text-[#FFB81C] border border-[#FFB81C]/20'
                      : 'text-gray-400 hover:text-white border border-white/10 hover:border-white/30'
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>

            {/* Syntax-highlighted code block */}
            <pre className="bg-[#0D1231] border border-white/10 rounded-2xl p-6 text-sm font-mono overflow-x-auto mb-6 leading-relaxed">
              <code
                dangerouslySetInnerHTML={{ __html: highlight(codeExample(lang, endpoint), lang) }}
              />
            </pre>

            {/* Parameters */}
            {endpoint.params.length > 0 && (
              <div className="bg-[#0D1231] border border-white/10 rounded-2xl p-6 mb-6">
                <h3 className="text-white font-semibold mb-4">Parameters</h3>
                <div className="space-y-4">
                  {endpoint.params.map((p) => (
                    <div key={p.name} className="flex items-start gap-4">
                      <div className="w-36 flex-shrink-0">
                        <code className="text-[#FFB81C] text-sm font-mono">{p.name}</code>
                        <p className="text-gray-600 text-xs mt-0.5">{p.type}</p>
                      </div>
                      <div>
                        <p className="text-gray-300 text-sm">{p.description}</p>
                        {p.required ? (
                          <span className="text-xs text-red-400">Required</span>
                        ) : (
                          <span className="text-xs text-gray-600">Optional</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Response sample */}
            <div className="bg-[#0D1231] border border-white/10 rounded-2xl p-6 mb-6">
              <h3 className="text-white font-semibold mb-4">Response</h3>
              <pre className="text-sm text-gray-300 font-mono overflow-x-auto">{endpoint.responseSample}</pre>
            </div>

            {/* Interactive playground */}
            <div className="bg-[#0D1231] border border-[#FFB81C]/20 rounded-2xl p-6">
              <h3 className="text-[#FFB81C] font-semibold mb-1">Try it live</h3>
              <p className="text-gray-500 text-xs mb-4">
                Enter your API key to send a real request.
                {endpoint.method === 'POST' && ' Required body parameters are sent as placeholders.'}
              </p>
              <div className="flex gap-3 mb-4">
                <input
                  type="text"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="rf_sk_your_api_key"
                  className="flex-1 bg-[#111640] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm font-mono focus:outline-none focus:border-[#FFB81C]/50 transition-colors"
                />
                <button
                  onClick={tryEndpoint}
                  disabled={trying || !apiKey}
                  className="bg-[#FFB81C] hover:bg-[#E6A519] text-black font-bold px-5 py-2.5 rounded-xl text-sm transition-colors disabled:opacity-50 whitespace-nowrap"
                >
                  {trying ? 'Sending...' : 'Send Request'}
                </button>
              </div>
              {tryResult && (
                <pre className="bg-black/40 rounded-xl p-4 text-sm text-green-300 font-mono overflow-x-auto">
                  {tryResult}
                </pre>
              )}
            </div>
          </section>

          {/* SDK quick links */}
          <section>
            <h2 className="text-xl font-bold text-white mb-4">SDKs</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="bg-[#0D1231] border border-white/10 rounded-2xl p-6">
                <div className="text-2xl mb-3">&#128230;</div>
                <h3 className="text-white font-semibold mb-2">TypeScript / Node.js</h3>
                <pre className="text-sm text-gray-400 font-mono mb-4">npm install @robloxforge/sdk</pre>
                <a href="/docs/sdk/typescript" className="text-[#FFB81C] text-sm hover:underline">
                  View docs &rarr;
                </a>
              </div>
              <div className="bg-[#0D1231] border border-white/10 rounded-2xl p-6">
                <div className="text-2xl mb-3">&#128013;</div>
                <h3 className="text-white font-semibold mb-2">Python</h3>
                <pre className="text-sm text-gray-400 font-mono mb-4">pip install robloxforge</pre>
                <a href="/docs/sdk/python" className="text-[#FFB81C] text-sm hover:underline">
                  View docs &rarr;
                </a>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  )
}
