'use client'

import { useState, useId } from 'react'
import Link from 'next/link'
import { ChevronDown, AlertCircle, HelpCircle, Mail } from 'lucide-react'

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

interface FaqItem {
  q: string
  a: string
}

const FAQ_ITEMS: FaqItem[] = [
  {
    q: 'How do I connect the Studio plugin?',
    a: 'Download the ForjeGames plugin from the Roblox marketplace, then install it in Roblox Studio. Once Studio is open, click the ForjeGames button in the Plugins toolbar and enter the 6-digit connection code shown in the ForjeGames editor. The status indicator will turn green when synced.',
  },
  {
    q: "Why isn't my build appearing in Studio?",
    a: 'The most common cause is HTTP Requests being disabled. Go to Game Settings > Security and toggle "Allow HTTP Requests" on. Then disconnect and reconnect the plugin from the editor. If the issue persists, check that your firewall is not blocking localhost traffic.',
  },
  {
    q: 'How do tokens work?',
    a: 'Every account starts with 1,000 free tokens on sign-up — no card required. Each AI build request costs 5 tokens. When you run low, head to Dashboard > Billing to purchase a token pack, or upgrade to a paid plan for a larger monthly allowance.',
  },
  {
    q: 'Can I use my own AI API key?',
    a: 'Yes. ForjeGames supports Claude (Anthropic), GPT-4 (OpenAI), and Gemini (Google). Add your key in Dashboard > Settings > Model Selector. Your key is encrypted at rest and used only for your own requests — it never counts against your token balance.',
  },
  {
    q: 'How do I get 3D meshes instead of parts?',
    a: 'Every build request automatically generates a 3D mesh alongside the placed primitive parts. You can also explicitly request a mesh by including "generate 3d model" in your prompt, for example: "generate 3d model of a medieval castle tower". The mesh is delivered via Meshy AI and auto-inserted into Studio.',
  },
  {
    q: 'Why does my build look like blocks?',
    a: 'By default the AI places Roblox primitive parts (wedges, blocks, cylinders) for speed. These are great for layout and gameplay geometry. For detailed, high-poly assets include "generate 3d model" in your request to trigger full mesh generation instead.',
  },
  {
    q: 'How do I report a bug?',
    a: 'Email support@forjegames.com with a short description of the problem. Including your browser console output (F12 > Console) speeds up the fix significantly. We aim to respond within 24 hours on business days.',
  },
]

interface TroubleshootItem {
  symptom: string
  fix: string
}

const TROUBLESHOOT_ITEMS: TroubleshootItem[] = [
  {
    symptom: 'Plugin won\'t connect',
    fix: 'Open Roblox Studio > Game Settings > Security and enable "Allow HTTP Requests". Then restart the plugin.',
  },
  {
    symptom: 'Build appears at wrong location',
    fix: 'Position your camera in Studio pointing at the area you want built before triggering the generation. The AI uses camera focus as the placement anchor.',
  },
  {
    symptom: 'Empty or no chat response',
    fix: 'Hard refresh the page with Ctrl+Shift+R (Cmd+Shift+R on Mac) to clear any stale service worker cache, then check your internet connection.',
  },
  {
    symptom: '"Token limit reached" error',
    fix: 'Sign up for a free account to claim 1,000 starter tokens, or go to Dashboard > Billing to buy more. Paid plans include a larger monthly token allowance.',
  },
]

// ---------------------------------------------------------------------------
// Accordion item
// ---------------------------------------------------------------------------

function AccordionItem({ item, defaultOpen = false }: { item: FaqItem; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  const id = useId()
  const panelId = `faq-panel-${id}`
  const buttonId = `faq-btn-${id}`

  return (
    <div
      style={{
        background: open ? '#111827' : '#0d131f',
        border: `1px solid ${open ? 'rgba(212,175,55,0.25)' : 'rgba(255,255,255,0.06)'}`,
        borderRadius: 12,
        overflow: 'hidden',
        transition: 'border-color 0.15s, background 0.15s',
      }}
    >
      <button
        id={buttonId}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          padding: '18px 20px',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
          color: open ? '#D4AF37' : '#e5e7eb',
          fontFamily: 'Inter, sans-serif',
          fontSize: 15,
          fontWeight: 600,
          lineHeight: 1.4,
          transition: 'color 0.15s',
        }}
      >
        <span>{item.q}</span>
        <ChevronDown
          size={16}
          aria-hidden="true"
          style={{
            flexShrink: 0,
            color: '#D4AF37',
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease',
          }}
        />
      </button>

      <div
        id={panelId}
        role="region"
        aria-labelledby={buttonId}
        hidden={!open}
        style={{
          padding: '0 20px 18px',
          color: 'rgba(255,255,255,0.55)',
          fontFamily: 'Inter, sans-serif',
          fontSize: 14,
          lineHeight: 1.7,
        }}
      >
        {item.a}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function HelpClient() {
  return (
    <div style={{ minHeight: '100vh', background: '#050810', color: '#fff', fontFamily: 'Inter, sans-serif' }}>

      {/* Hero */}
      <section
        style={{
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          padding: '96px 24px 64px',
          textAlign: 'center',
        }}
      >
        <p
          style={{
            marginBottom: 16,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: '#D4AF37',
          }}
        >
          Help & Support
        </p>
        <h1
          style={{
            maxWidth: 560,
            margin: '0 auto 16px',
            fontSize: 'clamp(32px, 5vw, 48px)',
            fontWeight: 700,
            letterSpacing: '-0.02em',
            lineHeight: 1.1,
            color: '#fff',
          }}
        >
          How can we help?
        </h1>
        <p
          style={{
            maxWidth: 480,
            margin: '0 auto',
            fontSize: 15,
            lineHeight: 1.6,
            color: 'rgba(255,255,255,0.45)',
          }}
        >
          Browse common questions and quick fixes below. Still stuck?{' '}
          <a
            href="mailto:support@forjegames.com"
            style={{ color: '#D4AF37', textDecoration: 'none' }}
          >
            Email support
          </a>
          .
        </p>
      </section>

      {/* Body */}
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '64px 24px 96px' }}>

        {/* FAQ Section */}
        <section style={{ marginBottom: 72 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 36,
                height: 36,
                borderRadius: 10,
                background: 'rgba(212,175,55,0.1)',
                color: '#D4AF37',
                flexShrink: 0,
              }}
            >
              <HelpCircle size={18} aria-hidden="true" />
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#fff', margin: 0 }}>
              Frequently Asked Questions
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {FAQ_ITEMS.map((item, i) => (
              <AccordionItem key={item.q} item={item} defaultOpen={i === 0} />
            ))}
          </div>
        </section>

        {/* Troubleshooting Section */}
        <section style={{ marginBottom: 72 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 36,
                height: 36,
                borderRadius: 10,
                background: 'rgba(212,175,55,0.1)',
                color: '#D4AF37',
                flexShrink: 0,
              }}
            >
              <AlertCircle size={18} aria-hidden="true" />
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#fff', margin: 0 }}>
              Troubleshooting
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {TROUBLESHOOT_ITEMS.map((item) => (
              <div
                key={item.symptom}
                style={{
                  background: '#0d131f',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: 12,
                  padding: '18px 20px',
                  display: 'grid',
                  gridTemplateColumns: 'auto 1fr',
                  gap: '6px 12px',
                  alignItems: 'start',
                }}
              >
                {/* Left: colored dot */}
                <div
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: '50%',
                    background: '#D4AF37',
                    marginTop: 6,
                    flexShrink: 0,
                  }}
                  aria-hidden="true"
                />
                <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#e5e7eb' }}>
                  {item.symptom}
                </p>

                {/* spacer for grid alignment */}
                <span aria-hidden="true" />
                <p style={{ margin: 0, fontSize: 13, lineHeight: 1.65, color: 'rgba(255,255,255,0.5)' }}>
                  {item.fix}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Contact strip */}
        <section
          style={{
            background: '#0d131f',
            border: '1px solid rgba(212,175,55,0.15)',
            borderRadius: 16,
            padding: '32px 28px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            gap: 12,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 44,
              height: 44,
              borderRadius: 12,
              background: 'rgba(212,175,55,0.1)',
              color: '#D4AF37',
            }}
          >
            <Mail size={20} aria-hidden="true" />
          </div>
          <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: '#fff' }}>
            Still need help?
          </h3>
          <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: 'rgba(255,255,255,0.45)', maxWidth: 380 }}>
            Our support team replies within 24 hours on business days. Join the{' '}
            <a
              href="https://discord.gg/forjegames"
              style={{ color: '#D4AF37', textDecoration: 'none' }}
            >
              Discord community
            </a>{' '}
            for faster answers from other builders.
          </p>
          <a
            href="mailto:support@forjegames.com"
            style={{
              marginTop: 4,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 22px',
              borderRadius: 8,
              background: '#D4AF37',
              color: '#000',
              fontSize: 14,
              fontWeight: 700,
              textDecoration: 'none',
              boxShadow: '0 0 20px rgba(212,175,55,0.25)',
              transition: 'box-shadow 0.15s, opacity 0.15s',
            }}
          >
            Email support@forjegames.com
          </a>
          <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,0.25)' }}>
            Or check the{' '}
            <Link href="/docs" style={{ color: 'rgba(212,175,55,0.7)', textDecoration: 'none' }}>
              full documentation
            </Link>{' '}
            for step-by-step guides.
          </p>
        </section>

      </div>
    </div>
  )
}
