import type { Metadata } from 'next'
import { createMetadata } from '@/lib/metadata'
import DocsLayout from '@/components/docs/DocsLayout'
import Callout from '@/components/docs/Callout'
import CodeBlock from '@/components/docs/CodeBlock'

export const metadata: Metadata = createMetadata({
  title: 'AI Modes — Build, Think, Plan, Image, Script, Terrain, 3D, Debug, Ideas',
  description:
    'Every ForjeGames AI mode explained with examples. Learn when to use Build vs Script vs Terrain, how Think reasons about complex mechanics, and how Ideas brainstorms game concepts.',
  path: '/docs/ai-modes',
  keywords: [
    'ForjeGames AI modes',
    'Build mode',
    'Script mode',
    'Terrain mode',
    'Debug mode',
    'Roblox AI modes',
  ],
})

const TOC = [
  { id: 'overview', label: 'Overview' },
  { id: 'build', label: '1. Build' },
  { id: 'think', label: '2. Think' },
  { id: 'plan', label: '3. Plan' },
  { id: 'image', label: '4. Image' },
  { id: 'script', label: '5. Script' },
  { id: 'terrain', label: '6. Terrain' },
  { id: '3d', label: '7. 3D' },
  { id: 'debug', label: '8. Debug' },
  { id: 'ideas', label: '9. Ideas' },
  { id: 'when-to-use-what', label: 'When to use what' },
]

export default function AiModesPage() {
  return (
    <DocsLayout
      eyebrow="Editor"
      title="AI Modes"
      description="ForjeGames has nine specialised AI modes, each tuned for a different stage of game development. This page explains when to use each one, with concrete example prompts."
      toc={TOC}
    >
      <h2 id="overview">Overview</h2>
      <p>
        A <em>mode</em> is a named pipeline. When you switch modes, ForjeGames swaps the
        system prompt, tools, and post-processing steps so the AI is optimised for the task
        at hand. You switch modes from the dropdown above the chat box, or with the
        keyboard shortcut <kbd>⌘ M</kbd>.
      </p>

      <Callout variant="info" title="Rule of thumb">
        If you don&apos;t know which mode to use, start with <strong>Build</strong>. It
        falls back to the other pipelines internally when it detects a task that needs
        them (e.g. asking for terrain will invoke the Terrain tool under the hood).
      </Callout>

      <h2 id="build">1. Build</h2>
      <p>
        The default mode. Build composes entire game worlds — geometry, lighting, scripts,
        and UI — from a single natural-language description. Use it for new projects and
        broad edits (&quot;add a shop in the middle of the map&quot;, &quot;make the whole
        thing nighttime&quot;).
      </p>
      <p><strong>Example prompts:</strong></p>
      <CodeBlock
        language="text"
        lineNumbers={false}
        code={`A medieval tavern with four tables, a bar, and an NPC bartender that hands out free bread.

Add a leaderboard above the finish line showing the fastest three times. Save times to player data.`}
      />

      <h2 id="think">2. Think</h2>
      <p>
        Think runs a reasoning-heavy model (Claude Opus with extended thinking) before it
        acts. It is slower and costs more credits, but it is the right choice when the
        task requires careful design — balancing an economy, debugging a complex bug, or
        architecting a multi-system feature.
      </p>
      <p><strong>Example prompts:</strong></p>
      <CodeBlock
        language="text"
        lineNumbers={false}
        code={`Design a progression system for a fishing RPG: 50 fish species, rarity tiers, bait requirements, and an XP curve that keeps players engaged for 20 hours.

My round-based shooter has a bug where round 3 never starts. Read the scripts and figure out why.`}
      />

      <h2 id="plan">3. Plan</h2>
      <p>
        Plan generates a structured implementation plan without writing any code. Use it
        when you want to review a proposed approach before committing credits to a full
        build. The output is a numbered checklist that you can edit, then send to Build to
        execute.
      </p>
      <Callout variant="success" title="Plan + Build workflow">
        Plan costs roughly 10× less than Build because it skips the code and asset
        generation. A typical workflow: Plan → tweak → Build from plan.
      </Callout>

      <h2 id="image">4. Image</h2>
      <p>
        Image converts a reference image into game assets. Drop a PNG, JPG, or even a
        hand-drawn sketch into the editor, and Image will use Claude Vision + Depth Pro
        to analyse composition, extract a rough depth map, and build a matching map.
      </p>
      <p>
        For full details and tips on getting good results, see the dedicated{' '}
        <a href="/docs/image-to-map">Image to Map</a> guide.
      </p>

      <h2 id="script">5. Script</h2>
      <p>
        Script only writes Luau. It never touches parts, lighting, or the map. Use it when
        you already have a world and you only want to add or modify behaviour — a new
        weapon, a new dialogue system, a new shop.
      </p>
      <p><strong>Example prompts:</strong></p>
      <CodeBlock
        tabs={[
          {
            label: 'Prompt',
            language: 'text',
            code: `Write a Luau script that teleports the player to spawn if they fall below y = -50.`,
          },
          {
            label: 'Generated Luau',
            language: 'lua',
            code: `-- FallReset.server.lua
local Players = game:GetService("Players")

local SPAWN_CFRAME = CFrame.new(0, 10, 0)
local FALL_Y = -50

Players.PlayerAdded:Connect(function(player)
  player.CharacterAdded:Connect(function(character)
    local root = character:WaitForChild("HumanoidRootPart")
    while character.Parent do
      if root.Position.Y < FALL_Y then
        root.CFrame = SPAWN_CFRAME
      end
      task.wait(0.25)
    end
  end)
end)`,
          },
        ]}
      />

      <h2 id="terrain">6. Terrain</h2>
      <p>
        Terrain specialises in Roblox smooth terrain — hills, valleys, caves, and biomes.
        It uses procedural noise + AI refinement so you can describe a landscape in
        English and get back a playable heightmap.
      </p>
      <p><strong>Example prompts:</strong></p>
      <CodeBlock
        language="text"
        lineNumbers={false}
        code={`A 512x512 tropical island with a central volcano, sandy beaches, a lagoon on the west side, and a small cave behind the waterfall.

Rolling grassland with scattered oak trees, a dirt path winding from south to north, and a river crossing the middle.`}
      />

      <h2 id="3d">7. 3D</h2>
      <p>
        3D generates individual custom meshes via Meshy AI. Describe a prop — a crown, a
        steampunk rifle, a dragon statue — and 3D will produce a textured mesh, insert it
        into the workspace, and optionally rig it for animation.
      </p>
      <Callout variant="warning" title="Credit cost">
        Each 3D mesh generation costs more credits than the text modes because the model
        is much larger. Use <a href="/docs/marketplace">Marketplace</a> first if you can
        find an off-the-shelf asset that matches.
      </Callout>

      <h2 id="debug">8. Debug</h2>
      <p>
        Debug reads your current project&apos;s scripts and output log, then proposes a
        fix. It is most useful when you have a specific error message or a reproducible
        bug. You can click any error in the output dock to auto-populate Debug with the
        context.
      </p>
      <p><strong>Example prompts:</strong></p>
      <CodeBlock
        language="text"
        lineNumbers={false}
        code={`"attempt to index nil with 'Humanoid'" — happens when players join. Find and fix.

The shop GUI opens but the buy button does nothing. Check why.`}
      />

      <h2 id="ideas">9. Ideas</h2>
      <p>
        Ideas is a creative brainstorm mode. It does <em>not</em> build anything — it
        returns a list of game concepts, mechanics, or twists you can pick from. Great
        when you&apos;re staring at a blank editor and don&apos;t know what to make.
      </p>
      <p><strong>Example prompts:</strong></p>
      <CodeBlock
        language="text"
        lineNumbers={false}
        code={`Give me 5 tycoon game ideas that aren't restaurants, farms, or lemonade stands.

What are some unique twists on a tower defense game that would appeal to 10-year-olds?`}
      />

      <h2 id="when-to-use-what">When to use what</h2>
      <table>
        <thead>
          <tr>
            <th>Goal</th>
            <th>Recommended mode</th>
          </tr>
        </thead>
        <tbody>
          <tr><td>Start a new game from scratch</td><td>Build</td></tr>
          <tr><td>Brainstorm concepts</td><td>Ideas</td></tr>
          <tr><td>Review before spending credits</td><td>Plan</td></tr>
          <tr><td>Recreate a reference image</td><td>Image</td></tr>
          <tr><td>Add behaviour to an existing world</td><td>Script</td></tr>
          <tr><td>Shape a landscape</td><td>Terrain</td></tr>
          <tr><td>Generate a custom prop/mesh</td><td>3D</td></tr>
          <tr><td>Fix an error</td><td>Debug</td></tr>
          <tr><td>Balance a complex system</td><td>Think</td></tr>
        </tbody>
      </table>

      <p>
        Still unsure? Start in Build and watch which sub-tools it invokes — that tells you
        which specialist mode to jump into for finer control.
      </p>
    </DocsLayout>
  )
}
