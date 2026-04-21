'use client'

import { useState } from 'react'

const FAQS = [
  {
    q: 'Is ForjeGames free?',
    a: 'Yes. You get 1,000 free tokens every month — no credit card required. Paid plans start at $10/month for 5,000 tokens. That\'s enough to prototype a full game concept, generate scripts, and test the Studio sync before you commit.',
  },
  {
    q: 'How is this different from Lemonade?',
    a: 'Lemonade generates scripts. ForjeGames builds complete games. That means terrain shaping, 3D asset generation, UI design, economy balancing, and Luau scripting — all from a single platform. We run multiple AI models behind the scenes and automatically pick the best one for each task.',
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
    <section className="py-16 sm:py-20 px-6" style={{ background: '#050810' }}>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10 sm:mb-14">
          <p
            className="text-[12px] font-medium uppercase tracking-widest mb-3"
            style={{ color: 'var(--gold, #D4AF37)' }}
          >
            FAQ
          </p>
          <h2 className="font-bold tracking-tight mb-4" style={{ color: 'var(--text-primary, rgba(255,255,255,0.9))', fontSize: 'clamp(1.75rem, 5vw, 2.25rem)' }}>
            Frequently Asked.
          </h2>
          <p className="text-base sm:text-lg" style={{ color: '#8B95B0' }}>
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
                  background: isOpen ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.02)',
                  border: isOpen ? '1px solid rgba(212,175,55,0.22)' : '1px solid rgba(255,255,255,0.07)',
                  boxShadow: isOpen ? '0 0 24px rgba(212,175,55,0.05)' : 'none',
                  transition: 'background 200ms ease, border-color 200ms ease, box-shadow 200ms ease',
                }}
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  className="w-full flex items-center justify-between gap-3 px-4 sm:px-6 py-4 text-left min-w-0"
                  style={{ color: isOpen ? 'var(--text-primary, rgba(255,255,255,0.9))' : 'var(--text-secondary, rgba(255,255,255,0.6))' }}
                  aria-expanded={isOpen}
                  onMouseEnter={(e) => {
                    if (!isOpen) (e.currentTarget as HTMLElement).style.color = 'var(--text-primary, rgba(255,255,255,0.9))'
                  }}
                  onMouseLeave={(e) => {
                    if (!isOpen) (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary, rgba(255,255,255,0.6))'
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
                    className="px-4 sm:px-6 pb-5 text-sm leading-relaxed"
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
            style={{ color: 'var(--gold, #D4AF37)' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.textDecoration = 'underline' }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.textDecoration = 'none' }}
          >
            Contact support
          </a>{' '}
          or{' '}
          <a
            href="/editor"
            className="transition-colors duration-150"
            style={{ color: 'var(--gold, #D4AF37)' }}
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
