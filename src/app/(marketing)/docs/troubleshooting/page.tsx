import type { Metadata } from 'next'
import { createMetadata } from '@/lib/metadata'
import DocsLayout from '@/components/docs/DocsLayout'
import Callout from '@/components/docs/Callout'

export const metadata: Metadata = createMetadata({
  title: 'Troubleshooting',
  description:
    'Fixes for the most common ForjeGames issues: plugin connection errors, stuck generations, failing voice input, image-to-map failures, credit problems.',
  path: '/docs/troubleshooting',
})

const TOC = [
  { id: 'generations', label: 'Generations' },
  { id: 'studio-plugin', label: 'Studio plugin' },
  { id: 'voice', label: 'Voice input' },
  { id: 'image-to-map', label: 'Image to Map' },
  { id: 'credits', label: 'Credits & billing' },
  { id: 'editor-ui', label: 'Editor UI' },
  { id: 'contact', label: 'Still stuck?' },
]

export default function TroubleshootingPage() {
  return (
    <DocsLayout
      eyebrow="Help"
      title="Troubleshooting"
      description="Quick fixes for the issues we see most often. If your problem isn't here, reach out — we read every support email."
      toc={TOC}
    >
      <h2 id="generations">Generations</h2>

      <h3>Build gets stuck on &quot;Thinking…&quot;</h3>
      <p>
        Usually caused by an extremely long or ambiguous prompt, or a transient slow
        response from our model provider. Wait 60 seconds, then click{' '}
        <strong>Regenerate</strong>. If it still hangs, shorten your prompt to one or
        two sentences and try again.
      </p>

      <h3>&quot;Generation failed&quot; with no details</h3>
      <p>
        Open the output dock (<kbd>⌘ /</kbd>) and check the logs tab for the actual
        error. Most &quot;failed&quot; generations are either a timeout or a tool-call
        error in the pipeline — both usually clear on retry.
      </p>

      <h3>Output is empty or nearly blank</h3>
      <p>
        The model sometimes ignores prompts that are too abstract (e.g.
        &quot;make it fun&quot;). Add concrete nouns: what should appear on screen, what
        should the player do, what is the goal.
      </p>

      <h2 id="studio-plugin">Studio plugin</h2>

      <h3>No ForjeGames tab in the Studio ribbon</h3>
      <p>
        The .rbxm file is in the wrong folder, or you didn&apos;t restart Studio after
        dropping it in. Re-check the paths in the{' '}
        <a href="/docs/studio-plugin">Studio Plugin guide</a> and restart.
      </p>

      <h3>&quot;HTTP 403&quot; or &quot;HttpService not enabled&quot;</h3>
      <p>
        The plugin couldn&apos;t call our API because HttpService is off for the current
        place. Open <em>Game Settings → Security</em> and toggle{' '}
        <strong>Allow HTTP Requests</strong> on.
      </p>

      <Callout variant="warning">
        HttpService is a <em>per-place</em> setting. If you open a new place, you need
        to enable it again there.
      </Callout>

      <h3>&quot;Invalid sync code&quot;</h3>
      <p>
        Sync codes expire after 15 minutes and can only be used once. Generate a new
        one from <em>Export → Copy Sync Code</em> in the editor and paste it
        immediately.
      </p>

      <h3>Sync hangs on &quot;Downloading…&quot;</h3>
      <p>
        Your network is probably blocking <code>api.forjegames.com</code>. Try a
        different network (mobile hotspot is a good test) or ask your IT team to
        allowlist the domain.
      </p>

      <h2 id="voice">Voice input</h2>

      <h3>Mic button is greyed out</h3>
      <p>
        The browser doesn&apos;t have permission to access your microphone. Click the
        padlock icon in the address bar, allow microphone, and reload the page.
      </p>

      <h3>Transcription is garbled or empty</h3>
      <ul>
        <li>Check that the correct mic is selected in your OS audio settings.</li>
        <li>Pause any background music before speaking.</li>
        <li>
          If you&apos;re in a noisy room, pull the mic closer. Whisper is robust but
          not magic.
        </li>
      </ul>

      <h3>The transcript keeps getting cut off</h3>
      <p>
        Always-listening mode uses silence detection to end clips. If you pause
        mid-sentence, it thinks you&apos;re done. Switch to push-to-talk (
        <kbd>⌘ ;</kbd>) for long prompts.
      </p>

      <h2 id="image-to-map">Image to Map</h2>

      <h3>Output doesn&apos;t resemble the image</h3>
      <p>
        Image to Map recreates the <em>layout and mood</em>, not the exact pixels. If
        the output is way off, add a text description alongside the image saying what
        you want preserved. See{' '}
        <a href="/docs/image-to-map">Image to Map tips</a>.
      </p>

      <h3>&quot;Image too large&quot;</h3>
      <p>
        The max size is 10 MB per image. Compress your image (tools like{' '}
        <a href="https://squoosh.app/">squoosh.app</a> are great for this) or crop it
        to just the relevant area.
      </p>

      <h2 id="credits">Credits & billing</h2>

      <h3>Credits haven&apos;t refilled this month</h3>
      <p>
        Plan credits refill on the 1st of each month at 00:00 UTC. If it&apos;s been
        more than 12 hours since the 1st and you still don&apos;t see new credits,
        email <a href="mailto:billing@forjegames.com">billing@forjegames.com</a> with
        your account email and we&apos;ll investigate within 24 hours.
      </p>

      <h3>Charged for a failed generation</h3>
      <p>
        We refund credits automatically for any generation that errors server-side.
        Transient client-side errors (like closing the tab mid-generation) also get
        refunded within 15 minutes. If a failed generation still shows as charged after
        that window, reach out and we&apos;ll refund it manually.
      </p>

      <h2 id="editor-ui">Editor UI</h2>

      <h3>Preview is black or stuck</h3>
      <p>
        The Three.js preview can fail to initialise on very old GPUs or in browsers
        with hardware acceleration disabled. Check{' '}
        <em>Settings → Preview → Diagnostics</em> for the specific error, and try
        enabling hardware acceleration in your browser.
      </p>

      <h3>Editor feels slow</h3>
      <p>
        Very large projects (5,000+ parts) can slow the preview down. Toggle{' '}
        <em>Settings → Preview → Low-detail mode</em> to reduce draw calls.
      </p>

      <h2 id="contact">Still stuck?</h2>
      <p>
        If none of the above helps, please get in touch. Include your account email,
        the project ID (found in the URL or <em>Project → Info</em>), and a screenshot
        if applicable.
      </p>
      <ul>
        <li>Email: <a href="mailto:support@forjegames.com">support@forjegames.com</a></li>
        <li>Discord: <a href="https://discord.gg/forjegames">discord.gg/forjegames</a></li>
        <li>Status page: <a href="https://status.forjegames.com">status.forjegames.com</a></li>
      </ul>
    </DocsLayout>
  )
}
