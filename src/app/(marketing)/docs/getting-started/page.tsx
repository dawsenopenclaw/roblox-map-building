import type { Metadata } from 'next'
import { createMetadata } from '@/lib/metadata'
import DocsLayout from '@/components/docs/DocsLayout'
import Callout from '@/components/docs/Callout'
import CodeBlock from '@/components/docs/CodeBlock'

export const metadata: Metadata = createMetadata({
  title: 'Getting Started',
  description:
    'Ship your first AI-built Roblox game in 5 minutes. Sign up, open the editor, describe what you want, and export to Roblox Studio.',
  path: '/docs/getting-started',
  keywords: [
    'Roblox AI getting started',
    'ForjeGames tutorial',
    'voice to game tutorial',
    'Roblox game development beginner',
  ],
})

const techArticleJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'HowTo',
  name: 'Build your first AI Roblox game with ForjeGames',
  description: 'A 5-minute quick start for creating a Roblox game with ForjeGames.',
  totalTime: 'PT5M',
  step: [
    { '@type': 'HowToStep', name: 'Sign up', text: 'Create a free ForjeGames account.' },
    { '@type': 'HowToStep', name: 'Open the editor', text: 'Click Start Building.' },
    { '@type': 'HowToStep', name: 'Type a prompt', text: 'Describe the game you want.' },
    { '@type': 'HowToStep', name: 'Watch it build', text: 'The AI generates the map, assets and scripts.' },
    { '@type': 'HowToStep', name: 'Export', text: 'Push to Roblox Studio with the plugin.' },
  ],
}

const TOC = [
  { id: 'step-1-sign-up', label: '1. Create your account' },
  { id: 'step-2-open-editor', label: '2. Open the editor' },
  { id: 'step-3-pick-mode', label: '3. Pick a mode' },
  { id: 'step-4-prompt', label: '4. Type your first prompt' },
  { id: 'step-5-watch', label: '5. Watch it build' },
  { id: 'step-6-export', label: '6. Export to Roblox Studio' },
  { id: 'next-steps', label: 'Next steps' },
]

export default function GettingStartedPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(techArticleJsonLd) }}
      />
      <DocsLayout
        eyebrow="Quickstart"
        title="Getting Started"
        description="Go from zero to a playable Roblox game in 5 minutes. No Lua experience required."
        toc={TOC}
      >
        <p>
          This guide walks you through creating your ForjeGames account, opening the
          editor, typing your first prompt, and pushing the result to Roblox Studio.
          Total time: around 5 minutes. You will not write a single line of code.
        </p>

        <Callout variant="info" title="Before you start">
          You need a free ForjeGames account and Roblox Studio installed. Studio is a
          free download from <a href="https://www.roblox.com/create">roblox.com/create</a>.
        </Callout>

        <h2 id="step-1-sign-up">1. Create your account</h2>
        <p>
          Head to <a href="/sign-up">forjegames.com/sign-up</a> and sign up with Google,
          GitHub, or email. Every new account starts with <strong>1,000 free credits</strong>
          — enough for about 40 AI actions, which is more than you need for a first build.
        </p>
        <p>
          You will land on the dashboard. From here you can see your credit balance, your
          projects, recent activity, and the big gold <em>Start Building</em> button.
        </p>

        <h2 id="step-2-open-editor">2. Open the editor</h2>
        <p>
          Click <strong>Start Building</strong>. The editor opens in a split layout:
        </p>
        <ul>
          <li><strong>Left panel</strong> — chat + mode switcher + voice input button</li>
          <li><strong>Right panel</strong> — live 3D preview of your game</li>
          <li><strong>Bottom dock</strong> — script output, logs, and generated assets</li>
        </ul>

        <h2 id="step-3-pick-mode">3. Pick a mode</h2>
        <p>
          ForjeGames has nine AI modes — each one runs a different pipeline behind the
          scenes. For your first build you want <strong>Build</strong>, which is the
          default. It composes map geometry, scripts, and UI in a single pass.
        </p>
        <p>
          If you&apos;re unsure what game to make, switch to <strong>Ideas</strong> first
          and ask for suggestions. We cover all nine modes in detail in the{' '}
          <a href="/docs/ai-modes">AI Modes guide</a>.
        </p>

        <h2 id="step-4-prompt">4. Type your first prompt</h2>
        <p>
          In the chat box, describe the game you want. Be specific about the
          <em> vibe</em>, the <em>mechanics</em>, and any <em>constraints</em>. Here are a few
          prompts that produce good results on a first try:
        </p>

        <CodeBlock
          language="text"
          filename="example-prompts.txt"
          lineNumbers={false}
          code={`A low-poly obby with 10 stages. Each stage has a different theme: lava, ice, jungle, neon city, space station. Checkpoints between stages. Bright colors.

A relaxing fishing game on a wooden dock at sunset. Cast line with click, catch random fish, sell them at the vendor NPC for coins. Simple inventory.

A top-down zombie survival arena. 4 waves, more enemies each wave, pickups for ammo and health. Player starts with a pistol.`}
        />

        <Callout variant="success" title="Pro tip">
          The more <em>specific</em> your prompt, the less you need to iterate. Mention
          scale (&quot;small, single-room&quot; vs &quot;large open world&quot;), art
          style, and exact mechanics.
        </Callout>

        <h2 id="step-5-watch">5. Watch it build</h2>
        <p>
          Hit <kbd>Enter</kbd>. The AI streams its plan into the chat, then starts building.
          You&apos;ll see parts, terrain, and scripts appear in the 3D preview on the right
          in real-time. A typical first build takes 30-90 seconds.
        </p>
        <p>
          When it finishes, you can rotate and fly the preview camera with WASD. Click any
          part to see its properties. Click the <strong>Play</strong> button in the top bar to
          test the game inside the browser.
        </p>

        <Callout variant="warning" title="If the build stalls">
          Generations occasionally timeout on the first attempt — usually when the prompt
          is extremely long. Click <strong>Regenerate</strong> or shorten the prompt and try
          again. See <a href="/docs/troubleshooting">troubleshooting</a> if it keeps failing.
        </Callout>

        <h2 id="step-6-export">6. Export to Roblox Studio</h2>
        <p>
          Ready to publish? You have two options:
        </p>
        <ol>
          <li>
            <strong>Download .rbxl</strong> — click <em>Export → Download place file</em>,
            then drag the .rbxl into Studio.
          </li>
          <li>
            <strong>Studio plugin</strong> — install our plugin for one-click sync from
            the editor straight into an open Studio session. See the{' '}
            <a href="/docs/studio-plugin">Studio Plugin guide</a>.
          </li>
        </ol>

        <p>
          Once the place is open in Studio you can publish to Roblox from{' '}
          <em>File → Publish to Roblox</em>, just like any other place.
        </p>

        <h2 id="next-steps">Next steps</h2>
        <ul>
          <li>
            <a href="/docs/ai-modes">Learn the other 8 AI modes</a> — each is optimised
            for a specific workflow.
          </li>
          <li>
            <a href="/docs/voice-input">Try voice input</a> — describe changes while you
            look at the preview.
          </li>
          <li>
            <a href="/docs/image-to-map">Upload a sketch</a> to convert an image into a 3D
            map.
          </li>
          <li>
            <a href="/docs/studio-plugin">Install the Studio plugin</a> for live sync with
            Roblox Studio.
          </li>
          <li>
            <a href="/docs/pricing-credits">Understand credits</a> so you can budget your
            generations.
          </li>
        </ul>
      </DocsLayout>
    </>
  )
}
