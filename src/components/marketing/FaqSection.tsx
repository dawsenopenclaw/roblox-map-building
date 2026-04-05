'use client'

import { useState } from 'react'

const FAQS = [
  {
    q: 'Is ForjeGames free?',
    a: 'Yes. You get 1,000 free tokens every month — no credit card required. That\'s enough to prototype a full game concept, generate scripts, and test the Studio sync before you commit to anything.',
  },
  {
    q: 'How is this different from Lemonade?',
    a: 'Lemonade generates scripts. ForjeGames builds complete games. That means terrain shaping, 3D asset generation, UI design, economy balancing, and Luau scripting — all from a single platform. We also support multiple AI models (Claude 4, GPT-4o, Gemini 2.0, Grok 3) and let you switch mid-session.',
  },
  {
    q: 'Do I need to know how to code?',
    a: 'No. You can build entirely through voice commands, image uploads, or plain English descriptions. The AI handles all Luau scripting. If you do know code, you get extra control — but it\'s never required.',
  },
  {
    q: 'Does it work with my existing Roblox game?',
    a: 'Yes. Install our Studio plugin, connect it to your place, and ForjeGames builds on top of your existing game. It reads your current structure and generates additions that fit — it doesn\'t start from scratch.',
  },
  {
    q: 'What AI models do you use?',
    a: 'Claude 4, GPT-4o, Gemini 2.0, and Grok 3. You pick the one you prefer from the model switcher in the editor. Each has different strengths — Claude 4 excels at complex systems, GPT-4o is fast for iteration, Gemini handles large context well.',
  },
  {
    q: 'Is my game data safe?',
    a: 'Yes. ForjeGames never stores your game files. All assets and scripts stay in YOUR Roblox Studio — we only send generated code through a secure WebSocket connection that closes when you disconnect. Nothing is persisted on our servers.',
  },
  {
    q: 'Can I use it with a team?',
    a: 'Yes. The Creator plan supports up to 3 team members. The Studio plan supports up to 50 members with shared workspaces, role permissions, and collaborative build history.',
  },
  {
    q: 'How do I get the Studio plugin?',
    a: 'Download it from forjegames.com/download, drag the .rbxm file into your Plugins folder, then restart Studio. The plugin installs in under 60 seconds and connects automatically when you open the ForjeGames editor.',
  },
]

function GoldArrow({ open }: { open: boolean }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{
        transform: open ? 'rotate(90deg)' : 'rotate(0deg)',
        transition: 'transform 280ms cubic-bezier(0.16,1,0.3,1)',
        flexShrink: 0,
      }}
    >
      <polyline points="9 18 15 12 9 6" />
    </svg>
  )
}

export default function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <section className="py-20 px-6" style={{ background: '#0A0E27' }}>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-14">
          <p
            className="text-[12px] font-medium uppercase tracking-widest mb-3"
            style={{ color: '#D4AF37' }}
          >
            FAQ
          </p>
          <h2 className="text-4xl font-bold tracking-tight mb-4" style={{ color: '#FFFFFF' }}>
            Frequently Asked.
          </h2>
          <p className="text-lg" style={{ color: '#8B95B0' }}>
            Everything you need to know before you start building.
          </p>
        </div>

        {/* Accordion */}
        <div className="flex flex-col gap-2">
          {FAQS.map((faq, i) => {
            const isOpen = openIndex === i
            return (
              <div
                key={i}
                className="rounded-xl overflow-hidden"
                style={{
                  background: isOpen ? '#14141A' : '#111113',
                  border: isOpen ? '1px solid rgba(212,175,55,0.22)' : '1px solid rgba(255,255,255,0.07)',
                  boxShadow: isOpen ? '0 0 24px rgba(212,175,55,0.05)' : 'none',
                  transition: 'background 200ms ease, border-color 200ms ease, box-shadow 200ms ease',
                }}
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  className="w-full flex items-center justify-between gap-4 px-6 py-4 text-left"
                  style={{ color: isOpen ? '#FFFFFF' : '#D0D4E4' }}
                  aria-expanded={isOpen}
                  onMouseEnter={(e) => {
                    if (!isOpen) (e.currentTarget as HTMLElement).style.color = '#FFFFFF'
                  }}
                  onMouseLeave={(e) => {
                    if (!isOpen) (e.currentTarget as HTMLElement).style.color = '#D0D4E4'
                  }}
                >
                  <span className="text-sm font-medium leading-relaxed">{faq.q}</span>
                  <span
                    style={{
                      color: isOpen ? '#D4AF37' : '#8B95B0',
                      transition: 'color 200ms ease',
                    }}
                  >
                    <GoldArrow open={isOpen} />
                  </span>
                </button>

                {/* Animated panel */}
                <div
                  style={{
                    maxHeight: isOpen ? '360px' : '0px',
                    overflow: 'hidden',
                    transition: 'max-height 320ms cubic-bezier(0.16,1,0.3,1)',
                  }}
                >
                  <p
                    className="px-6 pb-5 text-sm leading-relaxed"
                    style={{ color: '#8B95B0' }}
                  >
                    {faq.a}
                  </p>
                </div>
              </div>
            )
          })}
        </div>

        {/* Footer note */}
        <p className="text-center text-sm mt-10" style={{ color: '#8B95B0' }}>
          More questions?{' '}
          <a
            href="mailto:support@forjegames.com"
            className="transition-colors duration-150"
            style={{ color: '#D4AF37' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.textDecoration = 'underline' }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.textDecoration = 'none' }}
          >
            Contact support
          </a>{' '}
          or{' '}
          <a
            href="/editor"
            className="transition-colors duration-150"
            style={{ color: '#D4AF37' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.textDecoration = 'underline' }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.textDecoration = 'none' }}
          >
            just start building
          </a>.
        </p>
      </div>
    </section>
  )
}
