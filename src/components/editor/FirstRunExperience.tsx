'use client'

import { useState, useEffect, useCallback } from 'react'
import type { ConnectFlowState } from '@/app/(app)/editor/hooks/useStudioConnection'

// ─── Step definitions ─────────────────────────────────────────────────────────

interface Step {
  number: number
  title: string
  description: React.ReactNode
}

// ─── Animated step dot ────────────────────────────────────────────────────────

function StepDot({ n, active }: { n: number; active: boolean }) {
  return (
    <div
      style={{
        width: 28,
        height: 28,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        fontSize: 11,
        fontWeight: 800,
        transition: 'all 0.3s ease-out',
        background: active ? '#D4AF37' : 'rgba(212,175,55,0.12)',
        border: active ? 'none' : '1.5px solid rgba(212,175,55,0.3)',
        color: active ? '#030712' : '#D4AF37',
        boxShadow: active ? '0 0 16px rgba(212,175,55,0.35)' : 'none',
      }}
    >
      {n}
    </div>
  )
}

function StepConnector({ filled }: { filled: boolean }) {
  return (
    <div
      style={{
        flex: 1,
        height: 1,
        background: filled ? 'rgba(212,175,55,0.4)' : 'rgba(255,255,255,0.07)',
        margin: '0 6px',
        marginBottom: 16,
        transition: 'background 0.4s ease-out',
      }}
    />
  )
}

// ─── Code display ─────────────────────────────────────────────────────────────

function CodeDisplay({ code }: { code: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(code).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }, [code])

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12 }}>
      <div style={{ display: 'flex', gap: 5 }}>
        {code.split('').map((char, i) => (
          <div
            key={i}
            style={{
              width: 40,
              height: 48,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(0,0,0,0.5)',
              border: '2px solid rgba(212,175,55,0.45)',
              borderRadius: 8,
              fontSize: 20,
              fontWeight: 800,
              color: '#D4AF37',
              fontFamily: "'JetBrains Mono', monospace",
              textShadow: '0 0 12px rgba(212,175,55,0.5)',
              animation: `codeCharPop 0.3s cubic-bezier(0.16,1,0.3,1) ${i * 60}ms both`,
            }}
          >
            {char}
          </div>
        ))}
      </div>
      <button
        onClick={handleCopy}
        style={{
          padding: '8px 14px',
          borderRadius: 8,
          border: '1px solid rgba(212,175,55,0.3)',
          background: copied ? 'rgba(74,222,128,0.12)' : 'rgba(212,175,55,0.1)',
          color: copied ? '#4ADE80' : '#D4AF37',
          fontSize: 12,
          fontWeight: 600,
          cursor: 'pointer',
          transition: 'all 0.2s',
          fontFamily: 'Inter, sans-serif',
          flexShrink: 0,
        }}
      >
        {copied ? 'Copied!' : 'Copy'}
      </button>
    </div>
  )
}

// ─── Countdown ring ───────────────────────────────────────────────────────────

function CountdownRing({ seconds }: { seconds: number }) {
  const radius = 10
  const circumference = 2 * Math.PI * radius
  const totalSeconds = 5 * 60
  const fraction = Math.max(0, seconds / totalSeconds)
  const dash = fraction * circumference

  return (
    <svg width="28" height="28" viewBox="0 0 28 28" style={{ flexShrink: 0 }}>
      <circle cx="14" cy="14" r={radius} stroke="rgba(212,175,55,0.12)" strokeWidth="2" fill="none" />
      <circle
        cx="14"
        cy="14"
        r={radius}
        stroke="#D4AF37"
        strokeWidth="2"
        fill="none"
        strokeDasharray={`${dash} ${circumference}`}
        strokeLinecap="round"
        transform="rotate(-90 14 14)"
        style={{ transition: 'stroke-dasharray 1s linear' }}
      />
      <text
        x="14"
        y="14"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize="7"
        fontWeight="700"
        fill="#D4AF37"
        fontFamily="'JetBrains Mono', monospace"
      >
        {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, '0')}
      </text>
    </svg>
  )
}

// ─── Main component ────────────────────────────────────────────────────────────

interface FirstRunExperienceProps {
  connectFlow: ConnectFlowState
  connectCode: string
  connectTimer: number
  onGenerateCode: () => void
  onConfirmConnected: () => void
  onSkip: () => void
}

export function FirstRunExperience({
  connectFlow,
  connectCode,
  connectTimer,
  onGenerateCode,
  onConfirmConnected,
  onSkip,
}: FirstRunExperienceProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80)
    return () => clearTimeout(t)
  }, [])

  const hasCode = connectFlow === 'code' && connectCode.length > 0
  const isGenerating = connectFlow === 'generating'
  const isWaiting = hasCode

  // Determine which step is "active" for visual highlighting
  const activeStep = hasCode ? 4 : 1

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
        overflowY: 'auto',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(16px)',
        transition: 'opacity 0.4s ease-out, transform 0.4s cubic-bezier(0.16,1,0.3,1)',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 520,
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
        }}
      >
        {/* Hero heading */}
        <div style={{ textAlign: 'center', paddingBottom: 4 }}>
          {/* Animated icon */}
          <div
            style={{
              width: 56,
              height: 56,
              margin: '0 auto 16px',
              borderRadius: 16,
              background: 'linear-gradient(135deg, rgba(212,175,55,0.15) 0%, rgba(212,175,55,0.05) 100%)',
              border: '1.5px solid rgba(212,175,55,0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 32px rgba(212,175,55,0.12)',
            }}
          >
            {/* Plug icon */}
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M12 2v6M8 4v4M16 4v4" stroke="#D4AF37" strokeWidth="1.8" strokeLinecap="round"/>
              <rect x="7" y="8" width="10" height="7" rx="2" stroke="#D4AF37" strokeWidth="1.8"/>
              <path d="M12 15v4" stroke="#D4AF37" strokeWidth="1.8" strokeLinecap="round"/>
              <circle cx="12" cy="20" r="1.5" fill="#D4AF37"/>
            </svg>
          </div>

          <h2
            style={{
              margin: 0,
              fontSize: 22,
              fontWeight: 800,
              color: 'white',
              letterSpacing: '-0.03em',
              lineHeight: 1.2,
            }}
          >
            Connect Roblox Studio
          </h2>
          <p
            style={{
              margin: '8px 0 0',
              fontSize: 13,
              color: 'rgba(255,255,255,0.4)',
              lineHeight: 1.5,
            }}
          >
            Builds go straight into your place — no copy-paste.
          </p>
        </div>

        {/* Progress indicator */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {[1, 2, 3, 4].map((n, i) => (
            <div key={n} style={{ display: 'flex', alignItems: 'center', flex: n < 4 ? 1 : 'none' }}>
              <StepDot n={n} active={n === activeStep} />
              {i < 3 && <StepConnector filled={n < activeStep} />}
            </div>
          ))}
        </div>

        {/* Step cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

          {/* Step 1: Download */}
          <StepCard number={1} active={activeStep === 1} title="Download the Plugin">
            <a
              href="/plugin/ForjeGames.rbxmx"
              download="ForjeGames.rbxmx"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 7,
                padding: '9px 18px',
                borderRadius: 9,
                background: '#D4AF37',
                color: '#030712',
                fontSize: 13,
                fontWeight: 800,
                textDecoration: 'none',
                boxShadow: '0 4px 18px rgba(212,175,55,0.28)',
                transition: 'all 0.2s',
                width: 'fit-content',
              }}
            >
              <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                <path d="M7 1v9m0 0L3.5 6.5M7 10l3.5-3.5M1 13h12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Download ForjeGames.rbxmx
            </a>
            <p style={{ margin: '6px 0 0', fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>
              96 KB &bull; .rbxmx &bull; Studio 2024+
            </p>
          </StepCard>

          {/* Step 2: Install */}
          <StepCard number={2} active={false} title="Copy to Plugins Folder">
            <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,0.4)', lineHeight: 1.65 }}>
              In Studio: <strong style={{ color: 'rgba(255,255,255,0.65)' }}>Plugins</strong> tab &rarr; <strong style={{ color: 'rgba(255,255,255,0.65)' }}>Plugins Folder</strong> &rarr; drag <code style={{ color: '#D4AF37', fontFamily: 'monospace', fontSize: 11 }}>ForjeGames.rbxmx</code> in.
              <br />
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', marginTop: 4, display: 'block' }}>
                Or copy to: <code style={{ color: 'rgba(212,175,55,0.5)' }}>%LOCALAPPDATA%\Roblox\Plugins\</code>
              </span>
            </p>
          </StepCard>

          {/* Step 3: HTTP */}
          <StepCard number={3} active={false} title="Enable HTTP Requests">
            <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,0.4)', lineHeight: 1.65 }}>
              In Studio: <strong style={{ color: 'rgba(255,255,255,0.65)' }}>Home</strong> &rarr; <strong style={{ color: 'rgba(255,255,255,0.65)' }}>Game Settings</strong> &rarr; <strong style={{ color: 'rgba(255,255,255,0.65)' }}>Security</strong> &rarr; enable <strong style={{ color: '#D4AF37' }}>Allow HTTP Requests</strong>. Then restart Studio.
            </p>
          </StepCard>

          {/* Step 4: Connect code */}
          <StepCard number={4} active={activeStep === 4} title="Enter Your Connection Code">
            {!hasCode && !isGenerating && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>
                  Generate a 6-character code, then enter it in the ForjeGames plugin inside Studio.
                </p>
                <button
                  onClick={onGenerateCode}
                  style={{
                    alignSelf: 'flex-start',
                    padding: '10px 20px',
                    borderRadius: 9,
                    border: 'none',
                    background: 'linear-gradient(135deg, #D4AF37 0%, #F5D060 100%)',
                    color: '#030712',
                    fontSize: 13,
                    fontWeight: 800,
                    cursor: 'pointer',
                    boxShadow: '0 0 20px rgba(212,175,55,0.25)',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.03)' }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)' }}
                >
                  Generate Connection Code
                </button>
              </div>
            )}

            {isGenerating && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 0' }}>
                <div style={{
                  width: 18, height: 18,
                  border: '2px solid rgba(212,175,55,0.25)',
                  borderTopColor: '#D4AF37',
                  borderRadius: '50%',
                  animation: 'spin 0.7s linear infinite',
                  flexShrink: 0,
                }} />
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>Generating code…</span>
              </div>
            )}

            {hasCode && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>
                  Enter this code in the ForjeGames plugin dialog in Studio:
                </p>
                <CodeDisplay code={connectCode} />
                {isWaiting && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                    <CountdownRing seconds={connectTimer} />
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontFamily: "'JetBrains Mono', monospace" }}>
                      Waiting for Studio to connect…
                    </span>
                  </div>
                )}
              </div>
            )}
          </StepCard>
        </div>

        {/* Troubleshooting */}
        <details
          style={{
            background: 'rgba(255,255,255,0.02)',
            borderRadius: 10,
            padding: '10px 14px',
            border: '1px solid rgba(255,255,255,0.05)',
            cursor: 'pointer',
          }}
        >
          <summary style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', fontWeight: 500, listStyle: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ flexShrink: 0 }}>
              <circle cx="5" cy="5" r="4" stroke="currentColor" strokeWidth="1.2"/>
              <path d="M5 7V5M5 3h.01" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
            Having trouble connecting?
          </summary>
          <div style={{ paddingTop: 10, fontSize: 11, color: 'rgba(255,255,255,0.3)', lineHeight: 1.75 }}>
            <strong style={{ color: 'rgba(255,255,255,0.45)', display: 'block', marginBottom: 2 }}>Plugin not showing up?</strong>
            Put <code style={{ color: '#D4AF37' }}>.rbxmx</code> in the <strong style={{ color: 'rgba(255,255,255,0.45)' }}>Plugins</strong> folder (not Models), then fully close and reopen Studio.
            <br /><br />
            <strong style={{ color: 'rgba(255,255,255,0.45)', display: 'block', marginBottom: 2 }}>Code not working?</strong>
            Codes expire after 5 minutes — click &ldquo;Generate Connection Code&rdquo; again.
          </div>
        </details>

        {/* Skip */}
        <div style={{ textAlign: 'center' }}>
          <button
            onClick={onSkip}
            style={{
              background: 'none',
              border: 'none',
              color: 'rgba(255,255,255,0.25)',
              fontSize: 12,
              cursor: 'pointer',
              padding: '4px 8px',
              transition: 'color 0.15s',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.5)' }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.25)' }}
          >
            Skip for now — chat without Studio
          </button>
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes codeCharPop {
          from { opacity: 0; transform: scale(0.75) translateY(6px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  )
}

// ─── Reusable step card ───────────────────────────────────────────────────────

function StepCard({
  number,
  active,
  title,
  children,
}: {
  number: number
  active: boolean
  title: string
  children: React.ReactNode
}) {
  return (
    <div
      style={{
        borderRadius: 12,
        padding: '14px 16px',
        background: active
          ? 'linear-gradient(135deg, rgba(212,175,55,0.07) 0%, rgba(255,255,255,0.02) 100%)'
          : 'rgba(255,255,255,0.025)',
        border: active
          ? '1px solid rgba(212,175,55,0.2)'
          : '1px solid rgba(255,255,255,0.05)',
        transition: 'all 0.3s ease-out',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: children ? 10 : 0 }}>
        <div
          style={{
            width: 24,
            height: 24,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 10,
            fontWeight: 800,
            flexShrink: 0,
            background: active ? 'rgba(212,175,55,0.2)' : 'rgba(212,175,55,0.1)',
            border: '1.5px solid rgba(212,175,55,0.3)',
            color: '#D4AF37',
          }}
        >
          {number}
        </div>
        <span style={{ fontSize: 13, fontWeight: 700, color: active ? 'white' : 'rgba(255,255,255,0.7)' }}>
          {title}
        </span>
      </div>
      {children && <div style={{ paddingLeft: 34 }}>{children}</div>}
    </div>
  )
}
