import type { Metadata } from 'next'
import { createMetadata } from '@/lib/metadata'
import DocsLayout from '@/components/docs/DocsLayout'
import Callout from '@/components/docs/Callout'
import CodeBlock from '@/components/docs/CodeBlock'

export const metadata: Metadata = createMetadata({
  title: 'Studio Plugin — Install & Connect',
  description:
    'Install the ForjeGames Roblox Studio plugin in 2 minutes. Download, copy to plugins folder, enable HttpService, and sync generated code straight from the editor.',
  path: '/docs/studio-plugin',
  keywords: [
    'ForjeGames Studio plugin',
    'Roblox Studio plugin install',
    'HttpService enable',
    'Luau plugin',
  ],
})

const TOC = [
  { id: 'overview', label: 'Overview' },
  { id: 'step-1-download', label: '1. Download the plugin' },
  { id: 'step-2-install', label: '2. Install the .rbxm' },
  { id: 'step-3-restart', label: '3. Restart Studio' },
  { id: 'step-4-http', label: '4. Enable HTTP requests' },
  { id: 'step-5-generate', label: '5. Generate code in ForjeGames' },
  { id: 'step-6-connect', label: '6. Connect the plugin' },
  { id: 'usage', label: 'Using the plugin' },
  { id: 'troubleshooting', label: 'Troubleshooting' },
]

export default function StudioPluginPage() {
  return (
    <DocsLayout
      eyebrow="Integrations"
      title="Studio Plugin"
      description="Push ForjeGames output directly into an open Roblox Studio session. Installed in under 2 minutes."
      toc={TOC}
    >
      <h2 id="overview">Overview</h2>
      <p>
        The ForjeGames Studio plugin is a small Luau tool that runs inside Roblox Studio.
        When you connect it to your ForjeGames account, anything the editor generates —
        parts, scripts, terrain, UI — can be streamed directly into your open place file
        with one click. No .rbxl import/export loop.
      </p>

      <Callout variant="info" title="Do I need this?">
        No — you can always export a .rbxl file from the ForjeGames editor and open it
        manually. The plugin is just the fastest way to iterate, especially if you&apos;re
        tweaking scripts or making many small changes.
      </Callout>

      <h2 id="step-1-download">1. Download the plugin</h2>
      <p>
        Go to <a href="/download">forjegames.com/download</a> and click{' '}
        <strong>Download Studio plugin</strong>. You&apos;ll get a file called{' '}
        <code>ForjeGames.rbxm</code> (around 120 KB).
      </p>
      <p>
        You can also install directly from the{' '}
        <a href="https://create.roblox.com/store/asset/forjegames-plugin">
          Roblox Creator Store
        </a>{' '}
        if you prefer — just click <em>Install</em>. Store installs auto-update whenever
        we ship a new version.
      </p>

      <h2 id="step-2-install">2. Install the .rbxm</h2>
      <p>
        If you downloaded the .rbxm manually, drop it into your local Studio plugins
        folder:
      </p>
      <CodeBlock
        tabs={[
          {
            label: 'Windows',
            language: 'bash',
            code: `%LOCALAPPDATA%\\Roblox\\Plugins\\ForjeGames.rbxm`,
          },
          {
            label: 'macOS',
            language: 'bash',
            code: `~/Documents/Roblox/Plugins/ForjeGames.rbxm`,
          },
        ]}
      />

      <p>
        Or, inside Studio, open <em>Plugins → Plugins Folder</em> — this takes you to the
        right location on disk. Drop the .rbxm in and close the window.
      </p>

      <h2 id="step-3-restart">3. Restart Studio</h2>
      <p>
        Close and reopen Roblox Studio. On relaunch, you should see a new
        <strong> ForjeGames</strong> tab in the Studio ribbon. Click it — you&apos;ll see
        two buttons: <em>Connect</em> and <em>Sync</em>.
      </p>
      <Callout variant="warning" title="No ForjeGames tab?">
        If the tab is missing after a restart, the .rbxm was dropped in the wrong folder.
        Confirm the path matches the table above, then restart Studio again.
      </Callout>

      <h2 id="step-4-http">4. Enable HTTP requests</h2>
      <p>
        The plugin talks to our API over HTTPS, so Studio needs HTTP requests enabled for
        the place you&apos;re syncing into. This is a per-place setting and it&apos;s off
        by default.
      </p>
      <ol>
        <li>In Studio, open <em>Game Settings</em> (or <em>File → Game Settings</em>).</li>
        <li>Go to the <strong>Security</strong> tab.</li>
        <li>Toggle <strong>Allow HTTP Requests</strong> to on.</li>
        <li>Click <em>Save</em>.</li>
      </ol>

      <Callout variant="info">
        This enables <code>HttpService</code> for the current place. It does not give us
        any access you didn&apos;t opt into — requests only run when <em>you</em> click
        Sync inside the plugin.
      </Callout>

      <h2 id="step-5-generate">5. Generate code in ForjeGames</h2>
      <p>
        Back in the ForjeGames editor, build or modify your game as normal. Once
        you&apos;re happy with what you see in the preview, click{' '}
        <strong>Export → Copy Sync Code</strong> in the top bar.
      </p>
      <p>
        You&apos;ll get a short one-time pairing code that looks like this:
      </p>
      <CodeBlock
        language="text"
        lineNumbers={false}
        code={`FJG-9K4P-7LX2-MMN8`}
      />
      <p>Each sync code is valid for 15 minutes and can only be used once.</p>

      <h2 id="step-6-connect">6. Connect the plugin</h2>
      <p>
        Switch back to Studio. In the ForjeGames ribbon tab, click <strong>Connect</strong>
        and paste the sync code. The plugin will validate it, download the payload, and
        stream everything into Workspace, ServerScriptService, ReplicatedStorage, and
        StarterGui as appropriate.
      </p>
      <p>You&apos;ll see a toast like this when it succeeds:</p>
      <CodeBlock
        language="text"
        lineNumbers={false}
        code={`[ForjeGames] Synced 1 map, 3 scripts, 2 GUIs. Done in 1.4s.`}
      />

      <h2 id="usage">Using the plugin</h2>
      <p>
        Once connected, subsequent syncs don&apos;t need a new pairing code — the plugin
        remembers your session for 7 days. Just click the <strong>Sync</strong> button in
        the ForjeGames tab any time you want to pull the latest state from the editor.
      </p>
      <ul>
        <li><strong>Sync</strong> — overwrites matching Instances with the editor state.</li>
        <li><strong>Preview diff</strong> — shows what will change before you accept it.</li>
        <li><strong>Disconnect</strong> — logs out of the plugin on this machine.</li>
      </ul>

      <Callout variant="warning" title="Destructive sync">
        The default sync <em>replaces</em> Instances tagged as managed by ForjeGames. If
        you&apos;ve edited one of those Instances manually in Studio, the next sync will
        overwrite your changes. Use <em>Preview diff</em> if you&apos;re unsure, or tag
        an Instance with <code>ForjeGames_Ignore</code> to opt it out.
      </Callout>

      <h2 id="troubleshooting">Troubleshooting</h2>
      <p>Common issues you might hit during install:</p>
      <ul>
        <li>
          <strong>&quot;HTTP 403&quot; in the plugin output</strong> — HttpService is still
          disabled. Re-check step 4.
        </li>
        <li>
          <strong>&quot;Invalid sync code&quot;</strong> — codes expire after 15 minutes.
          Generate a new one from the editor.
        </li>
        <li>
          <strong>Nothing appears in the ribbon</strong> — the .rbxm is in the wrong
          folder, or you skipped the restart.
        </li>
        <li>
          <strong>Sync hangs on &quot;Downloading…&quot;</strong> — a corporate firewall
          is blocking <code>api.forjegames.com</code>. Allowlist it or use a personal
          network.
        </li>
      </ul>
      <p>
        See the full <a href="/docs/troubleshooting">troubleshooting guide</a> for more.
      </p>
    </DocsLayout>
  )
}
