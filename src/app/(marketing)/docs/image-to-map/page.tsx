import type { Metadata } from 'next'
import { createMetadata } from '@/lib/metadata'
import DocsLayout from '@/components/docs/DocsLayout'
import Callout from '@/components/docs/Callout'

export const metadata: Metadata = createMetadata({
  title: 'Image to Map',
  description:
    'Turn sketches, screenshots, and concept art into playable Roblox maps. Powered by Claude Vision and Depth Pro.',
  path: '/docs/image-to-map',
})

const TOC = [
  { id: 'overview', label: 'Overview' },
  { id: 'how-it-works', label: 'How it works' },
  { id: 'uploading', label: 'Uploading an image' },
  { id: 'good-inputs', label: 'What makes a good input' },
  { id: 'controlling', label: 'Controlling the output' },
  { id: 'limitations', label: 'Limitations' },
]

export default function ImageToMapPage() {
  return (
    <DocsLayout
      eyebrow="Editor"
      title="Image to Map"
      description="Upload a reference image — a sketch, a screenshot, concept art — and ForjeGames will turn it into a playable 3D map."
      toc={TOC}
    >
      <h2 id="overview">Overview</h2>
      <p>
        Image to Map runs in the <strong>Image</strong> editor mode. You drop an image
        into the chat, add an optional text description, and the AI analyses the picture
        to recreate its layout, colour palette, and atmosphere as a Roblox map. It&apos;s
        the fastest way to turn a mood board or a quick sketch into something playable.
      </p>

      <h2 id="how-it-works">How it works</h2>
      <p>Under the hood, each image goes through three stages:</p>
      <ol>
        <li>
          <strong>Vision analysis</strong> — Claude Vision describes the scene in
          structured form: dominant shapes, objects, colour palette, lighting, mood.
        </li>
        <li>
          <strong>Depth estimation</strong> — Apple&apos;s Depth Pro model estimates a
          relative depth map so we know where the foreground and background sit.
        </li>
        <li>
          <strong>Map composition</strong> — the structured description and depth map are
          combined with the Build pipeline to place terrain, props, and lighting.
        </li>
      </ol>

      <h2 id="uploading">Uploading an image</h2>
      <p>You can attach images in three ways:</p>
      <ul>
        <li>Drag the file onto the chat panel.</li>
        <li>
          Click the <em>+</em> button below the chat box and pick <em>Attach image</em>.
        </li>
        <li>
          Paste directly from the clipboard (<kbd>⌘ V</kbd>). Works with screenshots.
        </li>
      </ul>
      <p>Accepted formats: PNG, JPG, WebP. Max size: 10 MB per image.</p>

      <Callout variant="info">
        You can attach up to 4 images in a single prompt. The AI will try to combine them
        as different views of the same scene.
      </Callout>

      <h2 id="good-inputs">What makes a good input</h2>
      <ul>
        <li>
          <strong>Clear composition</strong> — a single, unambiguous subject beats a busy
          collage.
        </li>
        <li>
          <strong>Readable shapes</strong> — the AI doesn&apos;t need photorealism;
          crude geometric sketches work great.
        </li>
        <li>
          <strong>Distinct colours</strong> — strong colour contrast helps the model
          infer materials.
        </li>
        <li>
          <strong>One viewpoint</strong> — don&apos;t try to show all four walls of a
          room in one picture. Take separate shots instead.
        </li>
      </ul>

      <p>
        Examples of inputs that work well: hand-drawn top-down maps on graph paper,
        screenshots from other games, Pinterest mood boards, concept art, architectural
        elevations.
      </p>

      <h2 id="controlling">Controlling the output</h2>
      <p>
        You can steer the result with a text description alongside the image. Mention
        scale, player count, gameplay loop, and any details the image doesn&apos;t show.
      </p>
      <p>Example:</p>
      <blockquote>
        <em>
          &quot;Use this sketch as the top-down layout. It should be a 4-player horror
          map — dark lighting, fog, distant thunder audio. The red X is the spawn.&quot;
        </em>
      </blockquote>

      <h2 id="limitations">Limitations</h2>
      <ul>
        <li>
          <strong>Text in images is ignored</strong> — we don&apos;t OCR signs or
          labels. Describe them in the prompt instead.
        </li>
        <li>
          <strong>Exact proportions drift</strong> — depth estimation is relative, so
          the output won&apos;t be pixel-accurate to the reference.
        </li>
        <li>
          <strong>Copyrighted art</strong> — don&apos;t upload images you don&apos;t have
          the right to use. The output is yours, but the input must be too.
        </li>
      </ul>
    </DocsLayout>
  )
}
