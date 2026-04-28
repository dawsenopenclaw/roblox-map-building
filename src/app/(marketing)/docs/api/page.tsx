import type { Metadata } from 'next'
import { createMetadata } from '@/lib/metadata'
import DocsLayout from '@/components/docs/DocsLayout'
import Callout from '@/components/docs/Callout'
import CodeBlock from '@/components/docs/CodeBlock'

export const metadata: Metadata = createMetadata({
  title: 'REST API Reference',
  description:
    'Full HTTP reference for the ForjeGames API: authentication, generate endpoints, streaming responses, projects, exports, and rate limits.',
  path: '/docs/api',
  keywords: [
    'ForjeGames API',
    'Roblox AI REST API',
    'ForjeGames endpoints',
    'Roblox AI integration',
  ],
})

const techArticleJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'TechArticle',
  headline: 'ForjeGames REST API Reference',
  description:
    'Full REST API documentation for the ForjeGames AI-powered Roblox game development platform.',
  url: 'https://forjegames.com/docs/api',
  datePublished: '2026-03-29',
  dateModified: '2026-04-09',
  author: { '@type': 'Organization', name: 'ForjeGames LLC', url: 'https://forjegames.com' },
  publisher: {
    '@type': 'Organization',
    name: 'ForjeGames LLC',
    logo: { '@type': 'ImageObject', url: 'https://forjegames.com/logo.png' },
  },
  inLanguage: 'en-US',
}

const TOC = [
  { id: 'base-url', label: 'Base URL' },
  { id: 'auth', label: 'Authentication' },
  { id: 'rate-limits', label: 'Rate limits' },
  { id: 'generate', label: 'POST /v1/generate' },
  { id: 'stream', label: 'Streaming' },
  { id: 'projects', label: 'Projects' },
  { id: 'exports', label: 'Exports' },
  { id: 'errors', label: 'Errors' },
]

export default function ApiPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(techArticleJsonLd) }}
      />
      <DocsLayout
        eyebrow="Reference"
        title="REST API"
        description="Build ForjeGames into your own tools. Every editor action is also available over HTTPS."
        toc={TOC}
      >
        <h2 id="base-url">Base URL</h2>
        <p>All API requests go to:</p>
        <CodeBlock language="text" lineNumbers={false} code={`https://api.forjegames.com`} />
        <p>
          The API is versioned with a <code>/v1</code> prefix. We ship non-breaking
          additions freely — breaking changes will be released under <code>/v2</code>{' '}
          with a deprecation window of at least 6 months.
        </p>

        <h2 id="auth">Authentication</h2>
        <p>
          Create an API key at <a href="/settings/api-keys">Settings &rarr; API Keys</a>. Pass
          it as a Bearer token in the <code>Authorization</code> header:
        </p>
        <CodeBlock
          tabs={[
            {
              label: 'curl',
              language: 'bash',
              code: `curl https://api.forjegames.com/v1/me \\
  -H "Authorization: Bearer fjg_live_xxxxxxxxxxxxxxxxxxxx"`,
            },
            {
              label: 'JavaScript',
              language: 'typescript',
              code: `const res = await fetch('https://api.forjegames.com/v1/me', {
  headers: {
    Authorization: \`Bearer \${process.env.FORJEGAMES_API_KEY}\`,
  },
})
const me = await res.json()`,
            },
            {
              label: 'Python',
              language: 'python',
              code: `import os, requests

res = requests.get(
    "https://api.forjegames.com/v1/me",
    headers={"Authorization": f"Bearer {os.environ['FORJEGAMES_API_KEY']}"},
)
me = res.json()`,
            },
          ]}
        />

        <Callout variant="warning" title="Never expose API keys in a client">
          API keys grant access to your credits and projects. Keep them on a server.
          If a key leaks, revoke it from the dashboard immediately.
        </Callout>

        <h2 id="rate-limits">Rate limits</h2>
        <p>
          Default limits are <strong>60 requests/minute</strong> per API key on the
          Creator plan, and <strong>600 requests/minute</strong> on Studio. Every
          response includes:
        </p>
        <ul>
          <li><code>X-RateLimit-Limit</code> — your current per-minute quota</li>
          <li><code>X-RateLimit-Remaining</code> — requests left in the current window</li>
          <li><code>X-RateLimit-Reset</code> — Unix timestamp when the window resets</li>
        </ul>
        <p>
          When you exceed the limit the API returns <code>429 Too Many Requests</code>.
          Back off and retry after <code>X-RateLimit-Reset</code>.
        </p>

        <h2 id="generate">POST /v1/generate</h2>
        <p>The core endpoint. Creates a generation in the specified AI mode.</p>
        <CodeBlock
          language="bash"
          code={`curl https://api.forjegames.com/v1/generate \\
  -H "Authorization: Bearer $FORJEGAMES_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "mode": "build",
    "prompt": "A small medieval tavern with an NPC bartender",
    "project_id": "proj_abc123"
  }'`}
        />
        <p><strong>Request body:</strong></p>
        <ul>
          <li><code>mode</code> (string, required) — one of <code>build</code>, <code>think</code>, <code>plan</code>, <code>image</code>, <code>script</code>, <code>terrain</code>, <code>3d</code>, <code>debug</code>, <code>ideas</code></li>
          <li><code>prompt</code> (string, required) — natural-language input</li>
          <li><code>project_id</code> (string, optional) — attach to an existing project</li>
          <li><code>image_url</code> (string, optional) — reference image for <code>image</code> mode</li>
          <li><code>stream</code> (boolean, default false) — enable Server-Sent Events</li>
        </ul>
        <p><strong>Response:</strong></p>
        <CodeBlock
          language="json"
          code={`{
  "id": "gen_01HE2Z9M5J0XJFKC7Q4YAF1DNX",
  "mode": "build",
  "project_id": "proj_abc123",
  "status": "completed",
  "credits_used": 28,
  "output": {
    "scripts": [
      { "path": "ServerScriptService/Bartender.server.lua", "source": "..." }
    ],
    "parts": [ /* ... */ ],
    "summary": "Built a 12x8 tavern with an NPC bartender script."
  }
}`}
        />

        <h2 id="stream">Streaming</h2>
        <p>
          Pass <code>{'"stream": true'}</code> to receive output as Server-Sent Events.
          Each event is a JSON object with a <code>type</code> discriminator:{' '}
          <code>thought</code>, <code>tool_call</code>, <code>file</code>,{' '}
          <code>done</code>.
        </p>
        <CodeBlock
          language="typescript"
          highlightLines={[5, 6, 7]}
          code={`const res = await fetch('https://api.forjegames.com/v1/generate', {
  method: 'POST',
  headers: { Authorization: \`Bearer \${key}\`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ mode: 'build', prompt, stream: true }),
})
// Parse SSE stream
const reader = res.body!.getReader()
// ... dispatch events as they arrive
`}
        />

        <h2 id="projects">Projects</h2>
        <ul>
          <li><code>GET /v1/projects</code> — list projects</li>
          <li><code>GET /v1/projects/:id</code> — fetch a project including chat history</li>
          <li><code>POST /v1/projects</code> — create an empty project</li>
          <li><code>DELETE /v1/projects/:id</code> — delete a project</li>
        </ul>

        <h2 id="exports">Exports</h2>
        <ul>
          <li><code>POST /v1/projects/:id/export</code> — trigger a .rbxl export</li>
          <li><code>GET /v1/exports/:id</code> — poll status and retrieve download URL</li>
        </ul>

        <h2 id="errors">Errors</h2>
        <p>Errors follow a consistent shape:</p>
        <CodeBlock
          language="json"
          code={`{
  "error": {
    "code": "insufficient_credits",
    "message": "This action requires 28 credits but only 12 are available.",
    "request_id": "req_01HE3A1NZ..."
  }
}`}
        />
        <p>
          Common codes: <code>invalid_api_key</code>, <code>insufficient_credits</code>,{' '}
          <code>rate_limited</code>, <code>invalid_mode</code>,{' '}
          <code>project_not_found</code>, <code>internal_error</code>.
        </p>
      </DocsLayout>
    </>
  )
}
