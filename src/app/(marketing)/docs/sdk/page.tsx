import type { Metadata } from 'next'
import { createMetadata } from '@/lib/metadata'
import DocsLayout from '@/components/docs/DocsLayout'
import Callout from '@/components/docs/Callout'
import CodeBlock from '@/components/docs/CodeBlock'

export const metadata: Metadata = createMetadata({
  title: 'TypeScript & Python SDKs',
  description:
    'Official ForjeGames SDKs for TypeScript and Python. Typed clients, streaming helpers, and project management — installed from npm or pip.',
  path: '/docs/sdk',
})

const TOC = [
  { id: 'install', label: 'Install' },
  { id: 'auth', label: 'Authentication' },
  { id: 'quickstart', label: 'Quick start' },
  { id: 'streaming', label: 'Streaming generations' },
  { id: 'projects', label: 'Working with projects' },
  { id: 'errors', label: 'Errors & retries' },
]

export default function SdkPage() {
  return (
    <DocsLayout
      eyebrow="Reference"
      title="SDKs"
      description="Official typed clients for the ForjeGames API. Use them to embed ForjeGames in your own CLI tools, bots, or backend services."
      toc={TOC}
    >
      <h2 id="install">Install</h2>
      <CodeBlock
        tabs={[
          { label: 'npm', language: 'bash', code: `npm install @forjegames/sdk` },
          { label: 'pnpm', language: 'bash', code: `pnpm add @forjegames/sdk` },
          { label: 'pip', language: 'bash', code: `pip install forjegames` },
        ]}
      />

      <Callout variant="info">
        Both SDKs are thin wrappers over the <a href="/docs/api">REST API</a>. Anything
        you can do in the SDK you can do directly over HTTPS.
      </Callout>

      <h2 id="auth">Authentication</h2>
      <p>
        Both SDKs read <code>FORJEGAMES_API_KEY</code> from the environment by default.
        You can also pass the key explicitly to the constructor.
      </p>
      <CodeBlock
        tabs={[
          {
            label: 'TypeScript',
            language: 'typescript',
            code: `import { ForjeGames } from '@forjegames/sdk'

const fg = new ForjeGames() // reads FORJEGAMES_API_KEY
// or
const fg2 = new ForjeGames({ apiKey: 'fjg_live_...' })`,
          },
          {
            label: 'Python',
            language: 'python',
            code: `from forjegames import ForjeGames

fg = ForjeGames()  # reads FORJEGAMES_API_KEY
# or
fg = ForjeGames(api_key="fjg_live_...")`,
          },
        ]}
      />

      <h2 id="quickstart">Quick start</h2>
      <p>Generate a game and print the summary:</p>
      <CodeBlock
        tabs={[
          {
            label: 'TypeScript',
            language: 'typescript',
            code: `import { ForjeGames } from '@forjegames/sdk'

const fg = new ForjeGames()

const result = await fg.generate({
  mode: 'build',
  prompt: 'A cosy log cabin in a snowy forest',
})

console.log(result.output.summary)
console.log(\`Used \${result.credits_used} credits\`)`,
          },
          {
            label: 'Python',
            language: 'python',
            code: `from forjegames import ForjeGames

fg = ForjeGames()

result = fg.generate(
    mode="build",
    prompt="A cosy log cabin in a snowy forest",
)

print(result.output.summary)
print(f"Used {result.credits_used} credits")`,
          },
        ]}
      />

      <h2 id="streaming">Streaming generations</h2>
      <p>
        Both SDKs expose a <code>stream</code> method that returns an async iterator over
        SSE events. Use it to show progress in long builds.
      </p>
      <CodeBlock
        tabs={[
          {
            label: 'TypeScript',
            language: 'typescript',
            code: `for await (const event of fg.generate.stream({
  mode: 'build',
  prompt: 'A top-down zombie arena',
})) {
  switch (event.type) {
    case 'thought':
      process.stdout.write(event.delta)
      break
    case 'file':
      console.log(\`\\nWrote \${event.path}\`)
      break
    case 'done':
      console.log('\\nDone:', event.summary)
      break
  }
}`,
          },
          {
            label: 'Python',
            language: 'python',
            code: `for event in fg.generate.stream(
    mode="build",
    prompt="A top-down zombie arena",
):
    if event.type == "thought":
        print(event.delta, end="", flush=True)
    elif event.type == "file":
        print(f"\\nWrote {event.path}")
    elif event.type == "done":
        print("\\nDone:", event.summary)`,
          },
        ]}
      />

      <h2 id="projects">Working with projects</h2>
      <p>
        To keep multiple generations attached to the same game, pass a{' '}
        <code>project_id</code>. Create one with <code>projects.create()</code>:
      </p>
      <CodeBlock
        tabs={[
          {
            label: 'TypeScript',
            language: 'typescript',
            code: `const project = await fg.projects.create({ name: 'Snowy Cabin' })

await fg.generate({ project_id: project.id, mode: 'build', prompt: 'Initial map' })
await fg.generate({ project_id: project.id, mode: 'script', prompt: 'Add a fireplace particle effect' })

const updated = await fg.projects.get(project.id)
console.log(updated.chat_history.length, 'turns')`,
          },
          {
            label: 'Python',
            language: 'python',
            code: `project = fg.projects.create(name="Snowy Cabin")

fg.generate(project_id=project.id, mode="build", prompt="Initial map")
fg.generate(project_id=project.id, mode="script", prompt="Add a fireplace particle effect")

updated = fg.projects.get(project.id)
print(len(updated.chat_history), "turns")`,
          },
        ]}
      />

      <h2 id="errors">Errors & retries</h2>
      <p>
        SDK errors are typed subclasses of <code>ForjeGamesError</code> so you can catch
        them specifically:
      </p>
      <CodeBlock
        tabs={[
          {
            label: 'TypeScript',
            language: 'typescript',
            code: `import {
  InsufficientCreditsError,
  RateLimitError,
} from '@forjegames/sdk'

try {
  await fg.generate({ mode: 'build', prompt: 'castle' })
} catch (err) {
  if (err instanceof InsufficientCreditsError) {
    // top up and retry
  } else if (err instanceof RateLimitError) {
    await new Promise((r) => setTimeout(r, err.retryAfter * 1000))
  } else {
    throw err
  }
}`,
          },
          {
            label: 'Python',
            language: 'python',
            code: `from forjegames import InsufficientCreditsError, RateLimitError

try:
    fg.generate(mode="build", prompt="castle")
except InsufficientCreditsError:
    # top up and retry
    pass
except RateLimitError as e:
    import time
    time.sleep(e.retry_after)`,
          },
        ]}
      />

      <p>
        Both SDKs automatically retry 429 and transient 5xx errors with exponential
        backoff. You can disable this by passing <code>maxRetries: 0</code> to the
        constructor.
      </p>
    </DocsLayout>
  )
}
