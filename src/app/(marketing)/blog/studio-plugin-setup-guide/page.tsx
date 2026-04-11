import type { Metadata } from 'next'
import Link from 'next/link'
import { createMetadata } from '@/lib/metadata'

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'HowTo',
  name: 'How to Set Up the ForjeGames Roblox Studio Plugin',
  description: 'Install, connect, and use the ForjeGames plugin in Roblox Studio.',
  step: [
    { '@type': 'HowToStep', name: 'Download the plugin', text: 'Get the ForjeGames plugin from forjegames.com/download or the Roblox marketplace.' },
    { '@type': 'HowToStep', name: 'Install in Roblox Studio', text: 'Open Studio, navigate to the Plugins tab, and install the downloaded plugin file.' },
    { '@type': 'HowToStep', name: 'Connect your account', text: 'Click the ForjeGames panel in Studio and sign in with your forjegames.com credentials.' },
    { '@type': 'HowToStep', name: 'Sync from the web editor', text: 'Make changes in the ForjeGames web editor and click Sync to push them live into your Studio session.' },
  ],
}

export const metadata: Metadata = createMetadata({
  title: 'ForjeGames Studio Plugin — Complete Setup Guide',
  description:
    'Install the ForjeGames Roblox Studio plugin, connect your account, and sync AI-generated builds directly into Studio. Windows and Mac covered.',
  path: '/blog/studio-plugin-setup-guide',
  keywords: [
    'roblox studio plugin',
    'forjegames plugin',
    'roblox studio ai',
    'roblox studio setup',
    'AI roblox development',
    'roblox studio integration',
  ],
  jsonLd,
})

const INSTALL_STEPS_WINDOWS = [
  {
    n: '01',
    title: 'Download the plugin file',
    body: 'Go to forjegames.com/download or search "ForjeGames" in the Roblox plugin marketplace. Download the .rbxm plugin file to your computer. Note where it saves — you will need the file path in the next step.',
    tip: null,
  },
  {
    n: '02',
    title: 'Open Roblox Studio',
    body: 'Open any experience in Roblox Studio. You need an active Studio session for the plugin to install — it does not install from the desktop.',
    tip: 'Create a blank Baseplate experience if you do not have one open. You can discard it after installation.',
  },
  {
    n: '03',
    title: 'Install via the Plugins tab',
    body: 'In Studio, click the Plugins tab in the top menu ribbon. Click "Plugins Folder" to open the plugins directory in Windows Explorer. Drag the downloaded .rbxm file into that folder.',
    tip: null,
  },
  {
    n: '04',
    title: 'Restart Studio',
    body: 'Close and reopen Roblox Studio. The ForjeGames plugin will appear in the Plugins tab after restart. You will see a ForjeGames panel icon in the ribbon.',
    tip: null,
  },
  {
    n: '05',
    title: 'Allow plugin permissions',
    body: 'The first time you open a Studio session with the plugin active, Studio will ask to grant HTTP request permissions. Click Allow. The plugin requires internet access to communicate with the ForjeGames servers.',
    tip: 'This permission prompt is standard for any Studio plugin that connects to external services. The plugin only sends data you explicitly sync — it does not read your Studio session passively.',
  },
]

const INSTALL_STEPS_MAC = [
  {
    n: '01',
    title: 'Download the plugin file',
    body: 'Go to forjegames.com/download and download the .rbxm plugin file. Safari will save it to your Downloads folder by default.',
    tip: null,
  },
  {
    n: '02',
    title: 'Open Roblox Studio',
    body: 'Open Roblox Studio and create or open any experience.',
    tip: null,
  },
  {
    n: '03',
    title: 'Find the plugins folder',
    body: 'In Studio, click the Plugins tab and select "Plugins Folder." On Mac, this opens Finder at ~/Documents/Roblox/Plugins/. Drag the .rbxm file into this folder.',
    tip: 'If the Plugins folder does not exist yet, create it manually at ~/Documents/Roblox/Plugins/.',
  },
  {
    n: '04',
    title: 'Restart Studio',
    body: 'Quit and relaunch Roblox Studio. The ForjeGames plugin panel will appear in the Plugins ribbon.',
    tip: null,
  },
  {
    n: '05',
    title: 'Allow permissions',
    body: 'Grant HTTP request permissions when prompted. On Mac, Studio may also ask for network access via the macOS firewall dialog — click Allow.',
    tip: null,
  },
]

const TROUBLESHOOTING = [
  {
    problem: 'Plugin does not appear after restart',
    solution: 'Verify the .rbxm file is in the correct plugins folder. On Windows: %LOCALAPPDATA%\\Roblox\\Plugins\\. On Mac: ~/Documents/Roblox/Plugins/. The file must be directly in this folder, not in a subfolder.',
  },
  {
    problem: '"Connection failed" when trying to sync',
    solution: 'Check that you are signed into the same ForjeGames account in both the web editor and the Studio plugin. Tokens are account-scoped. If the problem persists, click Disconnect in the plugin panel, then reconnect.',
  },
  {
    problem: 'HTTP request permission error in Studio output',
    solution: 'Go to Studio Settings → Security and ensure "Allow HTTP Requests" is enabled for the plugin. This setting is per-game, so you may need to re-enable it if you open a new experience file.',
  },
  {
    problem: 'Sync pushes to wrong place in the Explorer hierarchy',
    solution: 'In the ForjeGames web editor, check the Target setting in the sync panel. By default, AI output syncs into a folder called "ForjeOutput" in Workspace. You can change the target to any existing folder in your hierarchy.',
  },
  {
    problem: 'Plugin version is outdated',
    solution: 'Open the ForjeGames panel in Studio and click "Check for Updates." If an update is available, it will download automatically. Restart Studio after updating.',
  },
  {
    problem: 'Mac: "Roblox Studio can\'t be opened because it is from an unidentified developer"',
    solution: 'This is a macOS Gatekeeper message for the plugin file, not Studio itself. Right-click the .rbxm file in Finder and choose Open. macOS will ask you to confirm — click Open. The file will be allowed from that point forward.',
  },
]

export default function StudioPluginSetupGuide() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="min-h-screen bg-[#0a0a0a] text-white">
        {/* Breadcrumb */}
        <div className="border-b border-white/5 px-6 py-3 text-xs text-white/30">
          <Link href="/blog" className="hover:text-[#D4AF37]">Blog</Link>
          <span className="mx-2">/</span>
          <span className="text-white/60">Tutorial</span>
        </div>

        <article className="mx-auto max-w-2xl px-6 py-20">
          {/* Meta */}
          <div className="mb-5 flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-blue-400/10 px-2.5 py-0.5 text-[10px] font-semibold text-blue-400">
              Tutorial
            </span>
            <span className="text-xs text-white/30">April 4, 2026</span>
            <span className="text-xs text-white/30">8 min read</span>
          </div>

          <h1 className="mb-6 text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
            Roblox Studio Plugin Guide — How to Connect ForjeGames
          </h1>

          <p className="mb-8 text-lg leading-relaxed text-white/55">
            The ForjeGames Studio plugin is what turns the web editor from a code generator into
            a real development environment. This guide covers installation on Windows and Mac,
            connecting your account, and using AI commands from the web editor to build directly
            in your Studio session.
          </p>

          <div className="mb-10 h-px bg-white/5" />

          {/* What you need */}
          <div className="mb-10 rounded-2xl border border-white/5 bg-[#141414] p-6">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white/40">Before you start</h2>
            <ul className="space-y-2 text-sm text-white/55">
              <li className="flex items-center gap-2"><span className="text-[#D4AF37]">+</span> A ForjeGames account — free at forjegames.com</li>
              <li className="flex items-center gap-2"><span className="text-[#D4AF37]">+</span> Roblox Studio installed (latest version)</li>
              <li className="flex items-center gap-2"><span className="text-[#D4AF37]">+</span> Windows 10/11 or macOS 12+</li>
              <li className="flex items-center gap-2"><span className="text-[#D4AF37]">+</span> About 10 minutes</li>
            </ul>
          </div>

          <div className="space-y-10 text-base leading-relaxed text-white/60">

            {/* Windows install */}
            <div>
              <h2 className="mb-6 text-xl font-bold text-white">
                Installation — Windows
              </h2>
              <div className="space-y-6">
                {INSTALL_STEPS_WINDOWS.map((step) => (
                  <div key={step.n} className="relative pl-12">
                    <div className="absolute left-0 top-0.5 flex h-8 w-8 items-center justify-center rounded-xl bg-[#D4AF37]/10 font-mono text-sm font-bold text-[#D4AF37]">
                      {step.n}
                    </div>
                    <h3 className="mb-1.5 text-base font-bold text-white">{step.title}</h3>
                    <p className="text-sm">{step.body}</p>
                    {step.tip && (
                      <div className="mt-3 flex gap-2 rounded-xl border border-[#D4AF37]/15 bg-[#D4AF37]/5 p-3">
                        <span className="shrink-0 text-sm text-[#D4AF37]">i</span>
                        <p className="text-sm text-white/50">{step.tip}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Mac install */}
            <div>
              <h2 className="mb-6 text-xl font-bold text-white">
                Installation — Mac
              </h2>
              <div className="space-y-6">
                {INSTALL_STEPS_MAC.map((step) => (
                  <div key={step.n} className="relative pl-12">
                    <div className="absolute left-0 top-0.5 flex h-8 w-8 items-center justify-center rounded-xl bg-[#D4AF37]/10 font-mono text-sm font-bold text-[#D4AF37]">
                      {step.n}
                    </div>
                    <h3 className="mb-1.5 text-base font-bold text-white">{step.title}</h3>
                    <p className="text-sm">{step.body}</p>
                    {step.tip && (
                      <div className="mt-3 flex gap-2 rounded-xl border border-[#D4AF37]/15 bg-[#D4AF37]/5 p-3">
                        <span className="shrink-0 text-sm text-[#D4AF37]">i</span>
                        <p className="text-sm text-white/50">{step.tip}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Connecting account */}
            <div>
              <h2 className="mb-4 text-xl font-bold text-white">Connecting your ForjeGames account</h2>

              <p className="mb-4 text-sm">
                With the plugin installed, open any Studio experience and click the ForjeGames icon
                in the Plugins ribbon. A panel will open on the right side of Studio. Click
                &ldquo;Sign In&rdquo; — this opens a browser tab at forjegames.com/studio-auth.
              </p>

              <p className="mb-4 text-sm">
                Sign in with your ForjeGames credentials. The page will display a one-time
                authorization code. Copy this code, return to Studio, paste it into the plugin
                panel, and click Connect. The panel will show your account name and token balance
                when the connection is successful.
              </p>

              <div className="my-5 rounded-2xl border border-white/5 bg-[#141414] p-5">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#D4AF37]">Connection status indicators</p>
                <div className="space-y-2 text-sm">
                  {[
                    ['Green dot', 'Connected and ready to sync'],
                    ['Yellow dot', 'Connecting or refreshing token'],
                    ['Red dot', 'Disconnected — click to reconnect'],
                    ['Grey dot', 'Plugin loaded but not signed in'],
                  ].map(([indicator, desc]) => (
                    <div key={indicator} className="flex items-center gap-3 text-white/50">
                      <span className="shrink-0 font-mono text-xs text-white/30">{indicator}</span>
                      <span>{desc}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Using AI commands */}
            <div>
              <h2 className="mb-4 text-xl font-bold text-white">Using AI commands from the web editor</h2>

              <p className="mb-4 text-sm">
                Once connected, everything you build in the ForjeGames web editor at
                /editor syncs into your active Studio session with one click. The workflow is:
              </p>

              <div className="my-5 space-y-3">
                {[
                  { label: 'Web editor', action: 'Type or speak your AI command — "build a forest zone with a river"' },
                  { label: 'AI agents', action: 'Generate terrain, scripts, and assets in the live 3D preview' },
                  { label: 'Sync button', action: 'Click Sync in the web editor (or press Cmd/Ctrl + S)' },
                  { label: 'Studio', action: 'AI output appears in your Explorer hierarchy instantly' },
                ].map((row, i) => (
                  <div key={i} className="flex items-start gap-4 rounded-xl border border-white/5 bg-[#141414] p-4">
                    <span className="shrink-0 rounded-lg bg-[#D4AF37]/10 px-2 py-0.5 font-mono text-xs font-semibold text-[#D4AF37]">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <div>
                      <p className="text-xs font-semibold text-white/40 uppercase tracking-wide mb-0.5">{row.label}</p>
                      <p className="text-sm text-white/55">{row.action}</p>
                    </div>
                  </div>
                ))}
              </div>

              <p className="mb-4 text-sm">
                You can also use the plugin panel directly in Studio. The panel includes a
                compact command input field — type a prompt and hit Enter to trigger the AI
                without switching to the browser. This is useful for small iterative changes
                while you are deep in a Studio session.
              </p>

              <h3 className="mb-3 text-base font-bold text-white">Useful plugin commands</h3>

              <div className="rounded-2xl border border-white/5 bg-[#141414] p-5">
                <div className="space-y-3">
                  {[
                    ['Sync', 'Push latest web editor output into Studio'],
                    ['Pull', 'Import the current Studio state into the web editor for AI editing'],
                    ['Undo sync', 'Revert the last sync operation (keeps a local snapshot)'],
                    ['Select output', 'Select all objects from the last sync in the Explorer'],
                    ['Clear output', 'Delete all ForjeOutput objects from the current session'],
                  ].map(([cmd, desc]) => (
                    <div key={cmd} className="flex items-start justify-between gap-4">
                      <kbd className="shrink-0 rounded bg-white/5 px-2 py-1 font-mono text-xs text-white/50">{cmd}</kbd>
                      <span className="text-sm text-white/40 text-right">{desc}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Workflow tips */}
            <div>
              <h2 className="mb-4 text-xl font-bold text-white">Workflow tips for faster iteration</h2>

              <p className="mb-3 text-sm">
                <strong className="text-white">Use Pull before major AI edits.</strong> If you have
                been making manual changes in Studio, Pull your current state into the web editor
                before issuing AI commands. This gives the AI accurate context about what already
                exists and prevents it from generating conflicting structures.
              </p>

              <p className="mb-3 text-sm">
                <strong className="text-white">Target specific folders.</strong> By default, AI
                output syncs into a &ldquo;ForjeOutput&rdquo; folder in Workspace. Once you are
                happy with a piece of AI output, move it manually into your actual game hierarchy
                and delete the ForjeOutput copy. This keeps your Explorer clean.
              </p>

              <p className="mb-3 text-sm">
                <strong className="text-white">Keep the web editor and Studio open side by side.</strong>
                On a wide monitor, put the ForjeGames browser on the left half and Studio on the
                right. You can watch changes appear in Studio the moment you sync. The visual
                feedback loop speeds up iteration significantly.
              </p>

              <p className="mb-3 text-sm">
                <strong className="text-white">Use the compact plugin panel for tweaks.</strong>
                For quick changes — &ldquo;make this wall taller&rdquo; or &ldquo;change the ore
                spawn rate to every 5 seconds&rdquo; — the plugin panel&apos;s built-in command
                field is faster than switching to the browser. Save the full editor for complex
                generation tasks.
              </p>
            </div>

            {/* Troubleshooting */}
            <div>
              <h2 className="mb-6 text-xl font-bold text-white">Troubleshooting common issues</h2>
              <div className="space-y-4">
                {TROUBLESHOOTING.map((item) => (
                  <div key={item.problem} className="rounded-2xl border border-white/5 bg-[#141414] p-5">
                    <h3 className="mb-2 text-sm font-semibold text-white">{item.problem}</h3>
                    <p className="text-sm leading-relaxed text-white/50">{item.solution}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Still stuck */}
            <div className="rounded-2xl border border-white/5 bg-[#141414] p-6">
              <h3 className="mb-2 text-sm font-semibold text-white">Still stuck?</h3>
              <p className="text-sm text-white/50">
                Join the ForjeGames Discord — the #plugin-support channel is monitored daily.
                For account and billing issues, email support@forjegames.com. Include your
                Studio version number and operating system when reporting plugin bugs.
              </p>
            </div>
          </div>

          {/* CTA */}
          <div className="mt-14 flex flex-wrap gap-3">
            <Link
              href="/download"
              className="rounded-xl bg-[#D4AF37] px-6 py-3 text-sm font-semibold text-black transition hover:bg-[#e5c547]"
            >
              Download the plugin →
            </Link>
            <Link
              href="/editor"
              className="rounded-xl border border-white/10 px-6 py-3 text-sm text-white/50 transition hover:border-white/20 hover:text-white"
            >
              Open the editor
            </Link>
            <Link
              href="/blog"
              className="rounded-xl border border-white/10 px-6 py-3 text-sm text-white/50 transition hover:border-white/20 hover:text-white"
            >
              ← Back to blog
            </Link>
          </div>
        </article>
      </div>
    </>
  )
}
