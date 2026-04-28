import type { Metadata } from 'next'
import { createMetadata } from '@/lib/metadata'
import DocsLayout from '@/components/docs/DocsLayout'
import Callout from '@/components/docs/Callout'
import CodeBlock from '@/components/docs/CodeBlock'

export const metadata: Metadata = createMetadata({
  title: 'MCP Integration — Build Roblox Games from Any Editor',
  description:
    'Connect ForjeGames to Claude Code, Cursor, Windsurf, or any MCP client. Generate Roblox builds, scripts, and templates directly from your editor.',
  path: '/docs/mcp',
  keywords: [
    'ForjeGames MCP',
    'MCP integration Roblox',
    'Claude Code Roblox',
    'Cursor MCP Roblox',
    'Windsurf MCP Roblox',
    'Model Context Protocol',
  ],
})

const TOC = [
  { id: 'overview', label: 'Overview' },
  { id: 'supported-editors', label: 'Supported editors' },
  { id: 'setup', label: 'Setup' },
  { id: 'config-claude-code', label: 'Claude Code config' },
  { id: 'config-cursor', label: 'Cursor config' },
  { id: 'config-windsurf', label: 'Windsurf config' },
  { id: 'available-tools', label: 'Available tools' },
  { id: 'examples', label: 'Example usage' },
  { id: 'troubleshooting', label: 'Troubleshooting' },
]

export default function McpPage() {
  return (
    <DocsLayout
      eyebrow="Integrations"
      title="MCP Integration"
      description="Build Roblox games from Claude Code, Cursor, Windsurf, or any MCP-compatible editor — without leaving your workflow."
      toc={TOC}
    >
      <h2 id="overview">Overview</h2>
      <p>
        The ForjeGames MCP server lets you generate Roblox builds, scripts, and game
        systems directly from any editor that supports the{' '}
        <a href="https://modelcontextprotocol.io">Model Context Protocol (MCP)</a>.
        Instead of switching to the ForjeGames web editor, you stay in your code editor
        and let the AI call ForjeGames tools on your behalf.
      </p>

      <Callout variant="info" title="What is MCP?">
        MCP (Model Context Protocol) is an open standard that lets AI assistants call
        external tools. Think of it as giving your AI editor the ability to talk to
        ForjeGames directly.
      </Callout>

      <h2 id="supported-editors">Supported editors</h2>
      <p>Any editor or client that supports MCP works with ForjeGames. The most popular:</p>
      <ul>
        <li>
          <strong>Claude Code</strong> — Anthropic&apos;s CLI for Claude. Config lives in{' '}
          <code>.claude/settings.json</code>.
        </li>
        <li>
          <strong>Cursor</strong> — AI-native code editor. Config lives in{' '}
          <code>.cursor/mcp.json</code>.
        </li>
        <li>
          <strong>Windsurf</strong> — Codeium&apos;s AI editor. Config lives in{' '}
          <code>.windsurf/mcp.json</code>.
        </li>
        <li>
          <strong>Any MCP client</strong> — anything that speaks the MCP protocol can connect.
        </li>
      </ul>

      <h2 id="setup">Setup</h2>
      <p>Three steps and you&apos;re building:</p>
      <ol>
        <li>
          <strong>Create an API key</strong> — Go to{' '}
          <a href="/settings?tab=api-keys">Settings &rarr; API Keys</a> and generate a new
          key. Copy it immediately — it&apos;s only shown once.
        </li>
        <li>
          <strong>Add the MCP config to your editor</strong> — Paste the config snippet
          below into the right file for your editor.
        </li>
        <li>
          <strong>Start building</strong> — Ask your AI assistant to build something in
          Roblox. It will call the ForjeGames tools automatically.
        </li>
      </ol>

      <Callout variant="warning" title="Keep your API key safe">
        Never commit your API key to a public repository. Use environment variables or
        your editor&apos;s secrets manager when possible.
      </Callout>

      <h2 id="config-claude-code">Claude Code config</h2>
      <p>
        Add this to your <code>.claude/settings.json</code> (or the global settings at{' '}
        <code>~/.claude/settings.json</code>):
      </p>
      <CodeBlock
        filename=".claude/settings.json"
        language="json"
        code={`{
  "mcpServers": {
    "forjegames": {
      "command": "npx",
      "args": ["-y", "@forjegames/mcp-server"],
      "env": {
        "FORJE_API_KEY": "fg_sk_your_api_key_here"
      }
    }
  }
}`}
      />

      <h2 id="config-cursor">Cursor config</h2>
      <p>
        Add this to <code>.cursor/mcp.json</code> in your project root:
      </p>
      <CodeBlock
        filename=".cursor/mcp.json"
        language="json"
        code={`{
  "mcpServers": {
    "forjegames": {
      "command": "npx",
      "args": ["-y", "@forjegames/mcp-server"],
      "env": {
        "FORJE_API_KEY": "fg_sk_your_api_key_here"
      }
    }
  }
}`}
      />

      <h2 id="config-windsurf">Windsurf config</h2>
      <p>
        Add this to <code>.windsurf/mcp.json</code> in your project root:
      </p>
      <CodeBlock
        filename=".windsurf/mcp.json"
        language="json"
        code={`{
  "mcpServers": {
    "forjegames": {
      "command": "npx",
      "args": ["-y", "@forjegames/mcp-server"],
      "env": {
        "FORJE_API_KEY": "fg_sk_your_api_key_here"
      }
    }
  }
}`}
      />

      <h2 id="available-tools">Available tools</h2>
      <p>
        Once connected, your AI assistant can call these tools. You don&apos;t need to
        remember the tool names — just describe what you want and the AI picks the right
        one.
      </p>

      <div className="not-prose overflow-x-auto rounded-xl border border-white/[0.06] mt-4 mb-6">
        <table className="w-full text-sm">
          <thead>
            <tr
              className="border-b border-white/[0.06]"
              style={{ background: 'rgba(5,8,16,0.6)' }}
            >
              <th
                className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-white/50"
              >
                Tool
              </th>
              <th
                className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-white/50"
              >
                Description
              </th>
            </tr>
          </thead>
          <tbody className="text-white/60">
            <tr className="border-b border-white/[0.03]">
              <td className="px-4 py-3">
                <code className="text-[#D4AF37] font-mono text-xs">forje_build</code>
              </td>
              <td className="px-4 py-3">
                Generate a Roblox map or structure from a text description. Returns Luau
                code with parts, terrain, and lighting.
              </td>
            </tr>
            <tr className="border-b border-white/[0.03]">
              <td className="px-4 py-3">
                <code className="text-[#D4AF37] font-mono text-xs">forje_script</code>
              </td>
              <td className="px-4 py-3">
                Generate a Luau game script — leaderboards, shops, combat systems, NPCs,
                UI handlers, DataStore logic, and more.
              </td>
            </tr>
            <tr className="border-b border-white/[0.03]">
              <td className="px-4 py-3">
                <code className="text-[#D4AF37] font-mono text-xs">forje_template</code>
              </td>
              <td className="px-4 py-3">
                Generate a full game from a template — obby, tycoon, simulator, RPG,
                horror, battle royale, and more.
              </td>
            </tr>
            <tr className="border-b border-white/[0.03]">
              <td className="px-4 py-3">
                <code className="text-[#D4AF37] font-mono text-xs">forje_status</code>
              </td>
              <td className="px-4 py-3">
                Check your account status — remaining tokens, current plan, and usage for
                the billing period.
              </td>
            </tr>
            <tr>
              <td className="px-4 py-3">
                <code className="text-[#D4AF37] font-mono text-xs">
                  forje_templates_list
                </code>
              </td>
              <td className="px-4 py-3">
                List all available game templates with descriptions, so you can pick one
                before calling <code className="text-[#D4AF37]">forje_template</code>.
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2 id="examples">Example usage</h2>
      <p>
        Once the MCP server is connected, just talk to your AI assistant naturally. Here
        are some things you can say:
      </p>

      <div className="not-prose space-y-2 mt-4 mb-6">
        {[
          'Build me a medieval castle with a courtyard, two towers, and a drawbridge',
          'Generate a coin collection script with a leaderboard that saves to DataStore',
          'Create a tycoon game template with 3 tiers of upgrades',
          'List all available game templates',
          'Check how many tokens I have left this month',
        ].map((prompt) => (
          <div
            key={prompt}
            className="rounded-lg border border-white/[0.06] px-4 py-2.5 text-xs font-mono"
            style={{ background: 'rgba(15,21,53,0.6)', color: 'rgba(139,149,176,1)' }}
          >
            <span className="text-[#D4AF37] mr-2">&gt;</span>
            {prompt}
          </div>
        ))}
      </div>

      <p>
        The AI will call the appropriate ForjeGames tool, generate the output, and return
        the Luau code directly in your editor. From there you can copy it into Roblox
        Studio or pipe it through the{' '}
        <a href="/docs/studio-plugin">Studio Plugin</a> for live sync.
      </p>

      <Callout variant="info" title="Works with the Studio Plugin">
        MCP-generated builds can be synced to Roblox Studio the same way as builds from
        the web editor. Install the{' '}
        <a href="/docs/studio-plugin">Studio Plugin</a> for the fastest workflow.
      </Callout>

      <h2 id="troubleshooting">Troubleshooting</h2>
      <p>Common issues:</p>
      <ul>
        <li>
          <strong>&quot;Tool not found&quot; or &quot;MCP server not connected&quot;</strong>{' '}
          — Make sure the config file is in the correct location for your editor and
          restart the editor after adding it.
        </li>
        <li>
          <strong>&quot;Invalid API key&quot;</strong> — Double-check you copied the full
          key starting with <code>fg_sk_</code>. Keys are shown only once when created.
        </li>
        <li>
          <strong>&quot;Rate limit exceeded&quot;</strong> — You&apos;ve hit your
          plan&apos;s daily limit. Upgrade your plan or wait for the reset.
        </li>
        <li>
          <strong>npx hangs or fails</strong> — Make sure Node.js 18+ is installed and{' '}
          <code>npx</code> is on your PATH.
        </li>
        <li>
          <strong>Editor doesn&apos;t show ForjeGames tools</strong> — Some editors
          require you to enable MCP in their settings. Check your editor&apos;s MCP
          documentation.
        </li>
      </ul>
      <p>
        Still stuck? Check the full{' '}
        <a href="/docs/troubleshooting">troubleshooting guide</a> or ask in{' '}
        <a href="https://discord.gg/forjegames">Discord</a>.
      </p>
    </DocsLayout>
  )
}
