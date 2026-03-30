'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ChevronRight,
  Terminal,
  Download,
  Plug,
  AlertTriangle,
  CheckCircle,
  ArrowLeft,
  Copy,
  Check,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface NavItem {
  id: string
  label: string
}

// ─── Navigation ───────────────────────────────────────────────────────────────

const NAV: NavItem[] = [
  { id: 'overview',       label: 'Overview' },
  { id: 'install',        label: 'Installation' },
  { id: 'connect',        label: 'Connecting to Studio' },
  { id: 'usage',          label: 'Using the Plugin' },
  { id: 'troubleshoot',   label: 'Troubleshooting' },
  { id: 'faq',            label: 'FAQ' },
]

// ─── Code block ───────────────────────────────────────────────────────────────

function CodeBlock({ code, lang = 'lua' }: { code: string; lang?: string }) {
  const [copied, setCopied] = useState(false)
  async function copy() {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { /* noop */ }
  }
  return (
    <div className="relative group rounded-xl overflow-hidden border border-white/8 bg-black/60 my-4">
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/6 bg-white/[0.02]">
        <span className="text-[11px] font-mono text-gray-500 uppercase tracking-wider">{lang}</span>
        <button
          onClick={copy}
          className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-200 transition-colors"
        >
          {copied ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre className="p-4 overflow-x-auto text-sm font-mono text-gray-300 leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  )
}

// ─── Callout ──────────────────────────────────────────────────────────────────

function Callout({
  type,
  children,
}: {
  type: 'info' | 'warn' | 'tip'
  children: React.ReactNode
}) {
  const styles = {
    info: { border: 'border-blue-500/25',  bg: 'bg-blue-500/5',  icon: <Plug size={14} className="text-blue-400" />,           label: 'Note',    labelColor: 'text-blue-400' },
    warn: { border: 'border-yellow-500/25', bg: 'bg-yellow-500/5', icon: <AlertTriangle size={14} className="text-yellow-400" />, label: 'Warning', labelColor: 'text-yellow-400' },
    tip:  { border: 'border-green-500/25', bg: 'bg-green-500/5',  icon: <CheckCircle size={14} className="text-green-400" />,    label: 'Tip',     labelColor: 'text-green-400' },
  }
  const s = styles[type]
  return (
    <div className={`flex gap-3 p-4 rounded-xl border ${s.border} ${s.bg} my-4`}>
      <span className="flex-shrink-0 mt-0.5">{s.icon}</span>
      <div className="text-sm text-gray-300 leading-relaxed">
        <span className={`font-bold mr-1 ${s.labelColor}`}>{s.label}:</span>
        {children}
      </div>
    </div>
  )
}

// ─── Section wrapper ─────────────────────────────────────────────────────────

function Section({
  id,
  title,
  children,
}: {
  id: string
  title: string
  children: React.ReactNode
}) {
  return (
    <section id={id} className="mb-14 scroll-mt-24">
      <h2 className="text-xl font-bold text-white mb-4 pb-3 border-b border-white/8">{title}</h2>
      {children}
    </section>
  )
}

// ─── Plugin path diagram (CSS art) ───────────────────────────────────────────

function PluginPathDiagram() {
  const steps = [
    { label: 'Download .lua', icon: <Download size={16} /> },
    { label: 'Plugins Folder', icon: <Terminal size={16} /> },
    { label: 'Studio Plugin', icon: <Plug size={16} /> },
  ]
  return (
    <div className="flex items-center gap-0 my-6 flex-wrap">
      {steps.map((step, i) => (
        <div key={step.label} className="flex items-center">
          <div className="flex flex-col items-center gap-2 px-5 py-3 rounded-xl bg-[#141414] border border-[#2a2a2a]">
            <div className="w-9 h-9 rounded-lg bg-[#D4AF37]/10 border border-[#D4AF37]/20 flex items-center justify-center text-[#D4AF37]">
              {step.icon}
            </div>
            <span className="text-xs font-medium text-gray-400">{step.label}</span>
          </div>
          {i < steps.length - 1 && (
            <ChevronRight size={16} className="text-gray-600 mx-1" />
          )}
        </div>
      ))}
    </div>
  )
}

// ─── Connection flow diagram ──────────────────────────────────────────────────

function ConnectionFlowDiagram() {
  const nodes = [
    { label: 'ForjeGames\nWeb Editor', color: '#D4AF37' },
    { label: 'Auth Code\n6 chars', color: '#6b7280' },
    { label: 'Roblox\nStudio', color: '#3b82f6' },
  ]
  return (
    <div className="flex items-center justify-center gap-1 my-6">
      {nodes.map((node, i) => (
        <div key={node.label} className="flex items-center">
          <div
            className="flex flex-col items-center justify-center w-28 h-20 rounded-2xl border text-xs font-semibold text-center leading-tight"
            style={{
              borderColor: node.color + '40',
              background: node.color + '0d',
              color: node.color,
            }}
          >
            {node.label.split('\n').map((line) => (
              <span key={line}>{line}</span>
            ))}
          </div>
          {i < nodes.length - 1 && (
            <div className="flex flex-col items-center mx-2">
              <div className="h-px w-10 bg-white/10" />
              <ChevronRight size={12} className="text-gray-600 -mt-1" />
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

// ─── Troubleshooting items ────────────────────────────────────────────────────

const TROUBLESHOOT_ITEMS = [
  {
    q: 'The plugin does not appear in the toolbar',
    a: 'Make sure ForjeGames.lua is placed in the Plugins folder (not a subfolder). Restart Roblox Studio completely and check the Plugins tab.',
  },
  {
    q: '"HttpService is not enabled" error',
    a: 'Open Game Settings → Security and enable "Allow HTTP Requests". This is required for the plugin to reach forjegames.com.',
  },
  {
    q: 'Connection code says "expired"',
    a: 'Codes expire after 5 minutes. Go to Settings → Studio in the ForjeGames web app, click "Generate Connection Code" again, and use the new code immediately.',
  },
  {
    q: 'Firewall or corporate proxy blocking requests',
    a: 'Ensure outbound HTTPS to forjegames.com is allowed on port 443. The plugin calls /api/studio/auth, /api/studio/sync, and /api/studio/update.',
  },
  {
    q: 'Plugin was working but disconnected',
    a: 'Sessions expire after 30 days or on explicit disconnect. Re-generate a new connection code from Settings → Studio to reconnect.',
  },
  {
    q: 'loadstring() command throws a sandbox error',
    a: 'Run the loadstring from the Studio Command Bar (View → Command Bar), not the Script Editor. The Command Bar has elevated permissions.',
  },
]

function TroubleshootAccordion() {
  const [open, setOpen] = useState<number | null>(null)
  return (
    <div className="space-y-2">
      {TROUBLESHOOT_ITEMS.map((item, i) => (
        <div
          key={i}
          className="rounded-xl border border-[#2a2a2a] overflow-hidden bg-[#141414]"
        >
          <button
            className="w-full flex items-center justify-between px-4 py-3.5 text-left"
            onClick={() => setOpen(open === i ? null : i)}
          >
            <span className="text-sm font-medium text-gray-200">{item.q}</span>
            <ChevronRight
              size={15}
              className={`text-gray-500 flex-shrink-0 transition-transform ${open === i ? 'rotate-90' : ''}`}
            />
          </button>
          {open === i && (
            <div className="px-4 pb-4 pt-1 border-t border-[#2a2a2a]">
              <p className="text-sm text-gray-400 leading-relaxed">{item.a}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

// ─── Main client ──────────────────────────────────────────────────────────────

export default function StudioDocsClient() {
  const [activeNav, setActiveNav] = useState('overview')

  function handleNavClick(id: string) {
    setActiveNav(id)
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Top bar */}
      <div className="border-b border-white/8 bg-[#0a0a0a]/95 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-5 py-3 flex items-center gap-4">
          <Link href="/docs" className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-200 transition-colors">
            <ArrowLeft size={14} />
            Docs
          </Link>
          <span className="text-gray-700">/</span>
          <span className="text-sm text-gray-300 font-medium">Studio Plugin</span>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-5 py-10 flex gap-10">

        {/* Sidebar nav */}
        <aside className="hidden lg:block w-52 flex-shrink-0 sticky top-20 self-start">
          <p className="text-[11px] text-gray-600 uppercase tracking-widest font-semibold mb-3">
            On this page
          </p>
          <nav className="space-y-0.5">
            {NAV.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                  activeNav === item.id
                    ? 'bg-[#D4AF37]/10 text-[#D4AF37] font-medium'
                    : 'text-gray-500 hover:text-gray-200 hover:bg-white/5'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          <div className="mt-8 pt-5 border-t border-white/8">
            <p className="text-[11px] text-gray-600 uppercase tracking-widest font-semibold mb-3">
              Quick links
            </p>
            <div className="space-y-1">
              <Link href="/settings/studio" className="block text-sm text-gray-500 hover:text-[#D4AF37] transition-colors py-1">
                Studio Settings
              </Link>
              <a href="/api/studio/plugin" download="ForjeGames.lua" className="block text-sm text-gray-500 hover:text-[#D4AF37] transition-colors py-1">
                Download Plugin
              </a>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0 max-w-2xl">

          <Section id="overview" title="Studio Plugin Overview">
            <p className="text-gray-400 leading-relaxed mb-4">
              The ForjeGames Studio plugin bridges your Roblox Studio session and the ForjeGames web
              editor. Once connected, commands you send from the chat interface — like "build a
              castle" or "add NPC patrol AI" — execute directly inside your open place in real time.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-5">
              {[
                { label: 'Real-time sync',  desc: 'Commands execute in Studio within ~1 second' },
                { label: 'Secure auth',     desc: '6-char code, 5-min TTL, 30-day session token' },
                { label: 'No cloud save',   desc: 'Your place file stays local — plugin only pushes commands' },
              ].map((card) => (
                <div key={card.label} className="p-4 rounded-xl bg-[#141414] border border-[#2a2a2a]">
                  <p className="text-sm font-semibold text-white mb-1">{card.label}</p>
                  <p className="text-xs text-gray-500 leading-relaxed">{card.desc}</p>
                </div>
              ))}
            </div>
          </Section>

          <Section id="install" title="Installation">
            <PluginPathDiagram />

            <h3 className="text-base font-semibold text-white mb-2 mt-5">Option A — Download file</h3>
            <ol className="space-y-3 text-sm text-gray-400 leading-relaxed">
              <li className="flex gap-3">
                <span className="w-5 h-5 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37] text-xs font-bold flex-shrink-0 mt-0.5">1</span>
                <span>
                  <a href="/api/studio/plugin" download="ForjeGames.lua"
                    className="text-[#D4AF37] hover:underline inline-flex items-center gap-1">
                    <Download size={12} /> Download ForjeGames.lua
                  </a>
                </span>
              </li>
              <li className="flex gap-3">
                <span className="w-5 h-5 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37] text-xs font-bold flex-shrink-0 mt-0.5">2</span>
                <span>
                  Copy the file to your Roblox Plugins folder:
                  <div className="mt-2 px-3 py-2 rounded-lg bg-black/50 border border-[#2a2a2a] font-mono text-xs text-gray-300">
                    Windows: %LOCALAPPDATA%\Roblox\Plugins\<br />
                    Mac: ~/Documents/Roblox/Plugins/
                  </div>
                </span>
              </li>
              <li className="flex gap-3">
                <span className="w-5 h-5 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37] text-xs font-bold flex-shrink-0 mt-0.5">3</span>
                <span>Restart Roblox Studio. The "ForjeGames" button appears in the Plugins toolbar.</span>
              </li>
            </ol>

            <h3 className="text-base font-semibold text-white mb-2 mt-6">Option B — loadstring (no file download)</h3>
            <p className="text-sm text-gray-400 mb-2">
              Open Roblox Studio, go to <strong className="text-gray-200">View &rarr; Command Bar</strong>, and paste:
            </p>
            <CodeBlock
              code={`loadstring(game:HttpGet("https://forjegames.com/api/studio/plugin"))()`}
              lang="lua"
            />
            <Callout type="warn">
              This loads the plugin into the current session only. It will not persist across
              Studio restarts. Use Option A for a permanent installation.
            </Callout>
          </Section>

          <Section id="connect" title="Connecting to Studio">
            <ConnectionFlowDiagram />

            <ol className="space-y-4 text-sm text-gray-400 leading-relaxed">
              <li className="flex gap-3">
                <span className="w-5 h-5 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37] text-xs font-bold flex-shrink-0 mt-0.5">1</span>
                <span>
                  Open <Link href="/settings/studio" className="text-[#D4AF37] hover:underline">Settings &rarr; Studio</Link> on
                  forjegames.com and click <strong className="text-gray-200">Generate Connection Code</strong>.
                  A 6-character code appears with a 5-minute countdown.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="w-5 h-5 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37] text-xs font-bold flex-shrink-0 mt-0.5">2</span>
                <span>
                  In Roblox Studio, click the <strong className="text-gray-200">ForjeGames</strong> button in
                  the Plugins toolbar. A dialog opens asking for your connection code.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="w-5 h-5 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37] text-xs font-bold flex-shrink-0 mt-0.5">3</span>
                <span>
                  Type the 6-character code and click <strong className="text-gray-200">Connect</strong>.
                  The web settings page updates to show a green "Studio Connected" banner.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="w-5 h-5 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37] text-xs font-bold flex-shrink-0 mt-0.5">4</span>
                <span>
                  The plugin toolbar label changes to <strong className="text-gray-200">● Connected — [Place Name]</strong>.
                  You are now ready to send commands from the ForjeGames editor.
                </span>
              </li>
            </ol>

            <Callout type="tip">
              You can connect multiple Studio sessions simultaneously — each place gets its own
              session token. The Settings page lists all active sessions.
            </Callout>
          </Section>

          <Section id="usage" title="Using the Plugin">
            <p className="text-sm text-gray-400 leading-relaxed mb-4">
              Once connected, type any build instruction in the{' '}
              <Link href="/editor" className="text-[#D4AF37] hover:underline">ForjeGames editor</Link>.
              The AI generates Luau code and the plugin executes it directly in Studio.
            </p>

            <h3 className="text-base font-semibold text-white mb-2 mt-4">Supported command types</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-white/8 text-gray-500 text-xs uppercase tracking-wider">
                    <th className="text-left py-2 pr-6 font-semibold">Command type</th>
                    <th className="text-left py-2 font-semibold">What it does</th>
                  </tr>
                </thead>
                <tbody className="text-gray-400">
                  {[
                    ['execute_luau',    'Runs generated Luau code in Studio'],
                    ['insert_model',    'Inserts a Roblox marketplace asset by ID'],
                    ['update_property', 'Changes a property on an existing instance'],
                    ['delete_model',    'Removes a named instance from the workspace'],
                  ].map(([type, desc]) => (
                    <tr key={type} className="border-b border-white/5">
                      <td className="py-2.5 pr-6 font-mono text-[#D4AF37] text-xs">{type}</td>
                      <td className="py-2.5">{desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <h3 className="text-base font-semibold text-white mb-2 mt-6">Plugin heartbeat</h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              The plugin sends a heartbeat to the server every 5 seconds. If no heartbeat is
              received for 60 seconds the session is marked stale. Closing Studio or your internet
              connection will trigger this. Simply reconnect with a new code.
            </p>

            <CodeBlock
              code={`-- The plugin sync loop (simplified)
RunService.Heartbeat:Connect(function()
    if not sessionToken then return end
    -- polls /api/studio/sync every 1 s for pending commands
    -- sends heartbeat to /api/studio/update every 5 s
end)`}
              lang="lua"
            />
          </Section>

          <Section id="troubleshoot" title="Troubleshooting">
            <TroubleshootAccordion />
          </Section>

          <Section id="faq" title="FAQ">
            <div className="space-y-5 text-sm text-gray-400 leading-relaxed">
              <div>
                <p className="font-semibold text-gray-200 mb-1">Is the plugin free?</p>
                <p>Yes. The plugin itself is free. AI command execution consumes tokens from your ForjeGames plan.</p>
              </div>
              <div>
                <p className="font-semibold text-gray-200 mb-1">Does the plugin upload my place to ForjeGames servers?</p>
                <p>No. The plugin only receives commands from the server and executes them locally. Your .rbxl file never leaves your machine.</p>
              </div>
              <div>
                <p className="font-semibold text-gray-200 mb-1">How do I update the plugin?</p>
                <p>
                  Re-download <a href="/api/studio/plugin" download="ForjeGames.lua" className="text-[#D4AF37] hover:underline">ForjeGames.lua</a> and
                  replace the file in your Plugins folder. The version is shown in the Studio toolbar label.
                </p>
              </div>
              <div>
                <p className="font-semibold text-gray-200 mb-1">Can I use the plugin on a team game?</p>
                <p>Yes. Each Studio session gets its own token. Team members can each install the plugin and connect with their own ForjeGames account.</p>
              </div>
            </div>
          </Section>

        </main>
      </div>
    </div>
  )
}
