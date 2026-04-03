'use client'

import { useState } from 'react'

const FAQS = [
  {
    q: 'How does ForjeGames connect to Roblox Studio?',
    a: 'ForjeGames uses a lightweight Studio plugin that connects to our cloud API over a secure WebSocket. Once installed, every AI action you take in ForjeGames applies directly to your open place in Studio — no copy-pasting, no manual imports.',
  },
  {
    q: 'Is this just for scripting?',
    a: 'Not at all. ForjeGames handles Luau scripts, 3D model generation, terrain shaping, UI design, economy balancing, audio placement, lighting, and more. It\'s a complete AI game development studio — scripting is just one of many tools.',
  },
  {
    q: 'Do I need to know how to code?',
    a: 'No coding knowledge required. You describe what you want in plain English (or speak it using voice input), and ForjeGames generates everything. If you are a developer, you can review, edit, and extend every generated script.',
  },
  {
    q: 'Is it safe for young creators?',
    a: 'Yes. ForjeGames is COPPA-compliant for creators under 13, includes content filtering on all AI outputs, and never collects or stores personal information beyond what is necessary for account operation. Parental consent flows are built in.',
  },
  {
    q: 'What AI models power ForjeGames?',
    a: 'ForjeGames routes tasks to the best model for the job — Claude 3.5 Sonnet for complex reasoning and scripting, GPT-4o for fast generation, Gemini for multimodal tasks like Image-to-Map, and Meshy for 3D asset creation. You can switch models mid-conversation.',
  },
  {
    q: 'Can I use my existing game assets?',
    a: 'Yes. You can import existing assets from your Roblox inventory, reference asset IDs from the marketplace, or upload your own files. ForjeGames integrates with your existing workspace — it never wipes what you have already built.',
  },
  {
    q: 'How is this different from other AI tools?',
    a: 'Most AI coding tools are generic — they generate code but have no idea what Roblox Studio is. ForjeGames is purpose-built for Roblox: it understands the Roblox API, Luau quirks, Studio\'s hierarchy, the marketplace, and game design principles. It builds games, not just code.',
  },
  {
    q: 'How much does it cost?',
    a: 'ForjeGames starts free with 1,000 tokens — enough to build a small game. Paid plans start at $15/month for 50,000 tokens with priority processing and custom mesh generation. Enterprise and team plans are available. 10% of every payment goes to charity.',
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
            style={{ color: '#FFB81C' }}
          >
            FAQ
          </p>
          <h2 className="text-4xl font-bold tracking-tight mb-4" style={{ color: '#FFFFFF' }}>
            Common questions.
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
                  border: isOpen ? '1px solid rgba(255,184,28,0.25)' : '1px solid #1A2550',
                  boxShadow: isOpen ? '0 0 20px rgba(255,184,28,0.04)' : 'none',
                }}
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  className="w-full flex items-center justify-between gap-4 px-6 py-4 text-left transition-colors duration-150"
                  style={{ color: isOpen ? '#FFFFFF' : '#D0D4E4' }}
                  aria-expanded={isOpen}
                >
                  <span className="text-sm font-medium leading-relaxed">{faq.q}</span>
                  <span style={{ color: isOpen ? '#FFB81C' : '#8B95B0' }}>
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
            style={{ color: '#FFB81C' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.textDecoration = 'underline' }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.textDecoration = 'none' }}
          >
            Contact support
          </a>{' '}
          or{' '}
          <a
            href="/editor"
            className="transition-colors duration-150"
            style={{ color: '#FFB81C' }}
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
