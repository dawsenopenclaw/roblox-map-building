import type { Metadata } from 'next'
import { createMetadata } from '@/lib/metadata'
import DocsLayout from '@/components/docs/DocsLayout'
import Callout from '@/components/docs/Callout'

export const metadata: Metadata = createMetadata({
  title: 'Editor Overview',
  description:
    'Tour of the ForjeGames editor: chat panel, 3D preview, script output, mode switcher, voice input, asset browser, and keyboard shortcuts.',
  path: '/docs/editor',
})

const TOC = [
  { id: 'layout', label: 'Layout' },
  { id: 'chat-panel', label: 'Chat panel' },
  { id: 'preview', label: 'Live 3D preview' },
  { id: 'output-dock', label: 'Output dock' },
  { id: 'mode-switcher', label: 'Mode switcher' },
  { id: 'voice', label: 'Voice input' },
  { id: 'assets', label: 'Asset browser' },
  { id: 'shortcuts', label: 'Keyboard shortcuts' },
]

export default function EditorPage() {
  return (
    <DocsLayout
      eyebrow="Editor"
      title="Editor Overview"
      description="The ForjeGames editor is a single page, split into four interlocking panels. This page is a tour of every surface and what it does."
      toc={TOC}
    >
      <h2 id="layout">Layout</h2>
      <p>
        The editor uses a fixed three-pane layout plus a dock. Nothing in this layout
        floats or detaches — we optimise for muscle memory and keyboard use over
        customisation.
      </p>
      <ul>
        <li><strong>Chat panel</strong> (left, ~30% width) — where you write prompts and see AI responses.</li>
        <li><strong>3D preview</strong> (right, ~70% width) — real-time render of your game.</li>
        <li><strong>Output dock</strong> (bottom, collapsible) — logs, generated scripts, and assets.</li>
        <li><strong>Top bar</strong> — project name, mode switcher, export, credits balance.</li>
      </ul>

      <h2 id="chat-panel">Chat panel</h2>
      <p>
        The chat panel is where you drive the AI. Each message is a <em>turn</em>.
        Turns are streamed — you&apos;ll see the model reasoning, tool calls, and file
        edits in real time. Hit <kbd>⌘ Enter</kbd> to send, or press{' '}
        <kbd>Shift+Enter</kbd> for a newline.
      </p>
      <p>
        Drag files onto the chat to attach them. Accepted formats include <code>.png</code>,{' '}
        <code>.jpg</code>, <code>.webp</code>, <code>.pdf</code>, and <code>.rbxl</code>.
        Drop a screenshot to run it through <a href="/docs/image-to-map">Image to Map</a>.
      </p>

      <h2 id="preview">Live 3D preview</h2>
      <p>
        The preview runs a lightweight Three.js renderer that mirrors the Roblox scene
        tree. It&apos;s not a full Roblox client — it&apos;s a fast approximation that
        lets you rotate, fly, and click parts without waiting for Studio.
      </p>
      <p>
        Use <kbd>W A S D</kbd> to fly and the mouse to look. Click a part to focus it;
        double-click to frame it. Hit <kbd>P</kbd> to toggle the in-browser playtest.
      </p>

      <h2 id="output-dock">Output dock</h2>
      <p>
        The dock at the bottom collapses to a thin strip and expands to show three tabs:
      </p>
      <ul>
        <li><strong>Logs</strong> — streaming output from the AI&apos;s tool calls.</li>
        <li><strong>Scripts</strong> — every Luau file the AI wrote this session.</li>
        <li><strong>Assets</strong> — generated meshes, images, and audio.</li>
      </ul>

      <h2 id="mode-switcher">Mode switcher</h2>
      <p>
        The dropdown above the chat box selects an AI mode (Build, Think, Plan, Image,
        Script, Terrain, 3D, Debug, Ideas). You can change modes mid-session — the chat
        history carries over. See <a href="/docs/ai-modes">AI Modes</a> for details on each.
      </p>

      <h2 id="voice">Voice input</h2>
      <p>
        Click the microphone icon at the bottom of the chat panel — or hold <kbd>⌘ ;</kbd>{' '}
        — to dictate a prompt. Full details in the{' '}
        <a href="/docs/voice-input">Voice Input guide</a>.
      </p>

      <h2 id="assets">Asset browser</h2>
      <p>
        The asset browser (toggle with <kbd>⌘ I</kbd>) gives you search-based access to
        the 500K+ verified Roblox Marketplace assets. Drag any result into the preview
        to insert it at the cursor.
      </p>
      <Callout variant="info">
        Inserting a marketplace asset is free — it doesn&apos;t consume credits because
        no AI generation runs.
      </Callout>

      <h2 id="shortcuts">Keyboard shortcuts</h2>
      <table>
        <thead>
          <tr><th>Shortcut</th><th>Action</th></tr>
        </thead>
        <tbody>
          <tr><td><kbd>⌘ Enter</kbd></td><td>Send chat message</td></tr>
          <tr><td><kbd>⌘ M</kbd></td><td>Open mode switcher</td></tr>
          <tr><td><kbd>⌘ ;</kbd></td><td>Hold to dictate voice prompt</td></tr>
          <tr><td><kbd>⌘ I</kbd></td><td>Toggle asset browser</td></tr>
          <tr><td><kbd>⌘ K</kbd></td><td>Command palette</td></tr>
          <tr><td><kbd>⌘ /</kbd></td><td>Toggle output dock</td></tr>
          <tr><td><kbd>⌘ S</kbd></td><td>Save project snapshot</td></tr>
          <tr><td><kbd>⌘ Z</kbd></td><td>Undo last AI turn</td></tr>
          <tr><td><kbd>P</kbd></td><td>Toggle playtest</td></tr>
          <tr><td><kbd>F</kbd></td><td>Frame selection in preview</td></tr>
        </tbody>
      </table>
    </DocsLayout>
  )
}
