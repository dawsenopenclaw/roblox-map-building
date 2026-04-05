'use client'

import { useState } from 'react'

const FAQS = [
  {
    q: 'Is ForjeGames right for me?',
    a: 'If you want to build Roblox games faster — yes. Whether you have zero coding experience or you are a seasoned developer, ForjeGames works for you. Beginners get a full AI co-pilot that handles scripts, terrain, assets, and UI from plain English. Experienced devs get a powerful tool that generates production-ready Luau, syncs live to Studio, and handles the repetitive work so you can focus on the creative parts.',
  },
  {
    q: 'How does the Studio sync work?',
    a: 'Install the free ForjeGames plugin in Roblox Studio — takes under 60 seconds. Once connected, every action you take in the ForjeGames editor (generate a script, place an asset, reshape terrain) is applied directly to your open place in Studio over a secure WebSocket. No copy-pasting, no file exports, no manual imports. Changes appear live as they generate.',
  },
  {
    q: 'Does Roblox allow this?',
    a: 'Yes. ForjeGames operates entirely within Roblox\'s Terms of Service. We use the official Roblox Open Cloud APIs and a standard Studio plugin — the same pathway used by tools like Rojo and many popular Studio plugins. We do not modify your game files externally or use any unauthorized automation. Everything we generate is standard Luau code that you own and control.',
  },
  {
    q: 'How is this different from Lemonade or Roblox Assistant?',
    a: 'Lemonade focuses on scripting and code generation. Roblox Assistant is a lightweight chatbot built into Studio. ForjeGames is the only platform that handles the full game stack: Luau scripts, custom 3D asset generation (text-to-3D via Meshy), terrain shaping, UI design, economy balancing, audio, and more. We also support multiple AI models (Claude, GPT-4o, Gemini) and let you switch mid-session — no other Roblox tool does this.',
  },
  {
    q: 'How much does it cost?',
    a: 'ForjeGames is free to start — no credit card required. Your account comes with 1,000 tokens, enough to prototype a full game concept. Paid plans start at $25/month (Creator) for 7,000 tokens with 3D mesh generation and Image-to-Map. The Studio plan at $50/month adds team collaboration and API access. 10% of every paid subscription goes to charity.',
  },
]

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{
        transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
        transition: 'transform 250ms cubic-bezier(0.16,1,0.3,1)',
        flexShrink: 0,
      }}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
}

export default function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <section className="py-16 px-6" style={{ background: '#0A0E27' }}>
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
                className="rounded-xl overflow-hidden transition-all duration-200"
                style={{
                  background: '#0F1535',
                  border: isOpen ? '1px solid rgba(212,175,55,0.25)' : '1px solid #1A2550',
                  boxShadow: isOpen ? '0 0 20px rgba(212,175,55,0.04)' : 'none',
                }}
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  className="w-full flex items-center justify-between gap-4 px-6 py-4 text-left transition-colors duration-150"
                  style={{ color: isOpen ? '#FFFFFF' : '#D0D4E4' }}
                  aria-expanded={isOpen}
                >
                  <span className="text-sm font-medium leading-relaxed">{faq.q}</span>
                  <span style={{ color: isOpen ? '#D4AF37' : '#8B95B0' }}>
                    <ChevronIcon open={isOpen} />
                  </span>
                </button>

                {/* Animated panel */}
                <div
                  style={{
                    maxHeight: isOpen ? '400px' : '0px',
                    overflow: 'hidden',
                    transition: 'max-height 300ms cubic-bezier(0.16,1,0.3,1)',
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
