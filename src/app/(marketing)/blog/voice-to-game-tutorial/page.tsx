import type { Metadata } from 'next'
import Link from 'next/link'
import { createMetadata } from '@/lib/metadata'

export const metadata: Metadata = createMetadata({
  title: 'Voice to Game: Build Without Typing',
  description:
    'Step-by-step tutorial for ForjeGames Voice Commands. Click the mic, speak your game idea, watch it build in the live 3D preview. Works on Chrome, Edge, and Safari.',
  path: '/blog/voice-to-game-tutorial',
  keywords: [
    'Roblox voice commands',
    'voice to game tutorial',
    'ForjeGames voice input',
    'build Roblox without typing',
    'AI voice game builder',
  ],
  jsonLd: {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: 'How to Use ForjeGames Voice Commands',
    description: 'Build a Roblox game using only your voice.',
    step: [
      { '@type': 'HowToStep', name: 'Enable the microphone', text: 'Click the mic icon in the editor toolbar and allow microphone access.' },
      { '@type': 'HowToStep', name: 'Speak your command', text: 'Describe what you want to build in plain English.' },
      { '@type': 'HowToStep', name: 'Review in the 3D preview', text: 'Watch the AI output appear in the live 3D preview panel.' },
    ],
  },
})

const STEPS = [
  {
    num: '01',
    title: 'Open the editor',
    content:
      'Go to forjegames.com/editor. Sign in or use Demo Mode. The editor loads with the AI chat panel on the left and the 3D preview on the right.',
    tip: null,
  },
  {
    num: '02',
    title: 'Enable microphone access',
    content:
      'Click the microphone icon in the editor toolbar (top center). Your browser will ask for microphone permission. Click Allow. This is a one-time step — the editor remembers your choice.',
    tip: 'Chrome and Edge provide the highest transcription accuracy. Safari works but may require an HTTPS connection.',
  },
  {
    num: '03',
    title: 'Speak your first command',
    content:
      'Click and hold the mic button (or press Cmd/Ctrl + Shift + V). Speak clearly. Release to submit. The transcript appears in the chat panel and the AI starts building immediately.',
    tip: null,
  },
  {
    num: '04',
    title: 'Watch it build in real time',
    content:
      'The 3D preview updates as the AI generates output. You can interrupt with another voice command at any time — say "stop" to cancel, or "undo" to revert the last change.',
    tip: null,
  },
  {
    num: '05',
    title: 'Refine with follow-up commands',
    content:
      'Voice Commands understand context. After building a map, say "make the mountains taller" or "add fog" — the AI applies changes to what it just built, not a new blank canvas.',
    tip: null,
  },
]

const EXAMPLE_COMMANDS = [
  { category: 'Terrain', commands: ['Build a volcanic island with a central peak', 'Add fog to the entire map', 'Create a river through the valley', 'Raise the northern hills by 20 studs'] },
  { category: 'Scripting', commands: ['Write a leaderboard that saves kills and deaths', 'Add a sprint mechanic triggered by Shift', 'Create a shop GUI with three items', 'Write a day and night cycle script'] },
  { category: 'NPCs', commands: ['Add a merchant NPC near the spawn', 'Give the guard a patrol route', 'Write dialogue for a quest giver', 'Make the boss NPC drop loot on death'] },
  { category: 'Polish', commands: ['Add ambient wind sound to the outdoor zones', 'Improve the lighting — it feels flat', 'Add a screen shake on explosion', 'Make the UI feel more responsive'] },
]

export default function VoiceToGameTutorial() {
  return (
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
          <span className="text-xs text-white/30">March 29, 2026</span>
          <span className="text-xs text-white/30">6 min read</span>
        </div>

        <h1 className="mb-6 text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
          Voice to Game: Build Without Typing
        </h1>

        <p className="mb-8 text-lg leading-relaxed text-white/55">
          ForjeGames Voice Commands let you build an entire Roblox game using only your voice.
          This tutorial walks through every step — from enabling the mic to publishing your first
          spoken-into-existence game.
        </p>

        <div className="mb-10 h-px bg-white/5" />

        {/* What you need */}
        <div className="mb-10 rounded-2xl border border-white/5 bg-[#141414] p-6">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white/40">What you need</h2>
          <ul className="space-y-2 text-sm text-white/55">
            <li className="flex items-center gap-2"><span className="text-[#D4AF37]">✓</span> A ForjeGames account (free tier works)</li>
            <li className="flex items-center gap-2"><span className="text-[#D4AF37]">✓</span> Chrome, Edge, or Safari browser</li>
            <li className="flex items-center gap-2"><span className="text-[#D4AF37]">✓</span> A microphone (built-in laptop mic works fine)</li>
            <li className="flex items-center gap-2"><span className="text-[#D4AF37]">✓</span> 10 minutes</li>
          </ul>
        </div>

        {/* Steps */}
        <div className="space-y-8 text-base leading-relaxed text-white/60">
          {STEPS.map((step) => (
            <div key={step.num} className="relative pl-12">
              <div className="absolute left-0 top-0.5 flex h-8 w-8 items-center justify-center rounded-xl bg-[#D4AF37]/10 font-mono text-sm font-bold text-[#D4AF37]">
                {step.num}
              </div>
              <h2 className="mb-2 text-lg font-bold text-white">{step.title}</h2>
              <p>{step.content}</p>
              {step.tip && (
                <div className="mt-3 flex gap-2 rounded-xl border border-[#D4AF37]/15 bg-[#D4AF37]/5 p-3">
                  <span className="text-[#D4AF37] shrink-0 text-sm">ℹ</span>
                  <p className="text-sm text-white/50">{step.tip}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Example commands */}
        <div className="mt-14">
          <h2 className="mb-6 text-xl font-bold text-white">Example commands by category</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {EXAMPLE_COMMANDS.map((cat) => (
              <div key={cat.category} className="rounded-2xl border border-white/5 bg-[#141414] p-5">
                <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#D4AF37]">
                  {cat.category}
                </div>
                <ul className="space-y-2">
                  {cat.commands.map((cmd, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-white/50">
                      <span className="mt-1 shrink-0 text-[#D4AF37]/40 text-xs">›</span>
                      <span>&ldquo;{cmd}&rdquo;</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Tips */}
        <div className="mt-14">
          <h2 className="mb-5 text-xl font-bold text-white">Pro tips for voice accuracy</h2>
          <div className="space-y-4 text-sm leading-relaxed text-white/55">
            <p>
              <strong className="text-white">Be specific with dimensions.</strong> &ldquo;Add a wall&rdquo;
              is vague. &ldquo;Add a 10-stud tall stone wall along the northern border&rdquo; gives
              the AI enough context to produce what you actually want on the first try.
            </p>
            <p>
              <strong className="text-white">Use &ldquo;like&rdquo; comparisons.</strong> &ldquo;Build
              a spawn island like Adopt Me&rdquo; or &ldquo;write a combat system like a fighting game&rdquo;
              — the AI understands these references and adjusts its output accordingly.
            </p>
            <p>
              <strong className="text-white">Chain commands naturally.</strong> You do not need to
              restart after each command. Say &ldquo;now add trees&rdquo; or &ldquo;make it bigger&rdquo;
              and the AI applies changes in context.
            </p>
            <p>
              <strong className="text-white">Say &ldquo;explain that&rdquo; for scripts.</strong>
              After the AI writes a script, say &ldquo;explain that code&rdquo; and it will walk
              through what it wrote in plain English — useful for learning or auditing the output.
            </p>
          </div>
        </div>

        {/* Keyboard shortcuts */}
        <div className="mt-10 rounded-2xl border border-white/5 bg-[#141414] p-6">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white/40">Keyboard shortcuts</h3>
          <div className="space-y-2">
            {[
              ['Cmd/Ctrl + Shift + V', 'Hold to record, release to submit'],
              ['Esc', 'Cancel current recording'],
              ['Cmd/Ctrl + Z', 'Undo last AI action'],
              ['Cmd/Ctrl + K', 'Open command palette'],
            ].map(([key, desc]) => (
              <div key={key} className="flex items-center justify-between gap-4">
                <kbd className="rounded bg-white/5 px-2 py-1 font-mono text-xs text-white/50">{key}</kbd>
                <span className="text-sm text-white/40 text-right">{desc}</span>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-14 flex flex-wrap gap-3">
          <Link
            href="/editor"
            className="rounded-xl bg-[#D4AF37] px-6 py-3 text-sm font-semibold text-black transition hover:bg-[#e5c547]"
          >
            Open the editor →
          </Link>
          <Link
            href="/docs/getting-started"
            className="rounded-xl border border-white/10 px-6 py-3 text-sm text-white/50 transition hover:border-white/20 hover:text-white"
          >
            Getting started guide →
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
  )
}
