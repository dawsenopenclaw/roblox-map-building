'use client'

import React, { useState, useEffect, useCallback } from 'react'

const LS_ANTHROPIC = 'fg_anthropic_key'
const LS_OPENAI    = 'fg_openai_key'
const LS_GOOGLE    = 'fg_google_key'

interface ApiKeysModalProps {
  onClose: () => void
}

export default function ApiKeysModal({ onClose }: ApiKeysModalProps) {
  const [anthropicKey, setAnthropicKey] = useState('')
  const [openaiKey,    setOpenaiKey]    = useState('')
  const [googleKey,    setGoogleKey]    = useState('')
  const [saved,        setSaved]        = useState(false)

  // Load existing keys on mount
  useEffect(() => {
    if (typeof window === 'undefined') return
    setAnthropicKey(localStorage.getItem(LS_ANTHROPIC) ?? '')
    setOpenaiKey(localStorage.getItem(LS_OPENAI)    ?? '')
    setGoogleKey(localStorage.getItem(LS_GOOGLE)     ?? '')
  }, [])

  const handleSave = useCallback(() => {
    if (typeof window === 'undefined') return
    if (anthropicKey.trim()) localStorage.setItem(LS_ANTHROPIC, anthropicKey.trim())
    else localStorage.removeItem(LS_ANTHROPIC)

    if (openaiKey.trim()) localStorage.setItem(LS_OPENAI, openaiKey.trim())
    else localStorage.removeItem(LS_OPENAI)

    if (googleKey.trim()) localStorage.setItem(LS_GOOGLE, googleKey.trim())
    else localStorage.removeItem(LS_GOOGLE)

    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }, [anthropicKey, openaiKey, googleKey])

  const handleClear = useCallback(() => {
    if (typeof window === 'undefined') return
    localStorage.removeItem(LS_ANTHROPIC)
    localStorage.removeItem(LS_OPENAI)
    localStorage.removeItem(LS_GOOGLE)
    setAnthropicKey('')
    setOpenaiKey('')
    setGoogleKey('')
  }, [])

  // Close on backdrop click
  const handleBackdrop = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose()
  }, [onClose])

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div
      onClick={handleBackdrop}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.65)',
        backdropFilter: 'blur(4px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
    >
      <div
        style={{
          background: '#111113',
          border: '1px solid rgba(212,175,55,0.2)',
          borderRadius: 16,
          width: '100%',
          maxWidth: 420,
          boxShadow: '0 24px 64px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)',
          overflow: 'hidden',
        }}
      >
        {/* Gold top stripe */}
        <div
          style={{
            height: 2,
            background: 'linear-gradient(90deg, transparent, rgba(212,175,55,0.7) 30%, rgba(212,175,55,0.7) 70%, transparent)',
          }}
        />

        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            padding: '20px 24px 0',
          }}
        >
          <div>
            <h2
              style={{
                color: '#fff',
                fontSize: 17,
                fontWeight: 700,
                margin: 0,
                letterSpacing: '-0.01em',
              }}
            >
              Connect your AI
            </h2>
            <p
              style={{
                color: '#71717A',
                fontSize: 12,
                marginTop: 4,
                lineHeight: 1.5,
              }}
            >
              Add your own API key to use any model.
              <br />
              Keys are stored in your browser only.
            </p>
          </div>

          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 8,
              width: 28,
              height: 28,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#71717A',
              flexShrink: 0,
              marginLeft: 12,
            }}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Fields */}
        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <KeyField
            label="Anthropic API Key"
            placeholder="sk-ant-..."
            value={anthropicKey}
            onChange={setAnthropicKey}
            dotColor="#CC785C"
          />
          <KeyField
            label="OpenAI API Key"
            placeholder="sk-..."
            value={openaiKey}
            onChange={setOpenaiKey}
            dotColor="#10A37F"
          />
          <KeyField
            label="Google AI API Key"
            placeholder="AI..."
            value={googleKey}
            onChange={setGoogleKey}
            dotColor="#4285F4"
          />
        </div>

        {/* Security note */}
        <div
          style={{
            margin: '0 24px',
            padding: '10px 12px',
            background: 'rgba(212,175,55,0.04)',
            border: '1px solid rgba(212,175,55,0.12)',
            borderRadius: 10,
            marginBottom: 16,
          }}
        >
          <p style={{ color: '#A1A1AA', fontSize: 11, lineHeight: 1.6, margin: 0 }}>
            <span style={{ color: '#D4AF37', fontWeight: 600 }}>Your keys never leave your browser.</span>
            {' '}API calls are made directly from our server using your key — only for that request, never stored.
          </p>
        </div>

        {/* Actions */}
        <div
          style={{
            display: 'flex',
            gap: 8,
            padding: '0 24px 20px',
          }}
        >
          <button
            onClick={handleSave}
            style={{
              flex: 1,
              background: saved
                ? 'rgba(74,222,128,0.15)'
                : 'linear-gradient(135deg, #D4AF37, #FFB81C)',
              color: saved ? '#4ADE80' : '#09090b',
              border: saved ? '1px solid rgba(74,222,128,0.3)' : 'none',
              borderRadius: 10,
              padding: '10px 0',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            {saved ? 'Saved!' : 'Save Keys'}
          </button>
          <button
            onClick={handleClear}
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 10,
              padding: '10px 16px',
              fontSize: 13,
              color: '#71717A',
              cursor: 'pointer',
              transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.08)' }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.04)' }}
          >
            Clear All
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Reusable key input field ───────────────────────────────────────────────

interface KeyFieldProps {
  label: string
  placeholder: string
  value: string
  onChange: (v: string) => void
  dotColor: string
}

function KeyField({ label, placeholder, value, onChange, dotColor }: KeyFieldProps) {
  const [show, setShow] = useState(false)
  const hasValue = value.trim().length > 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span
          style={{
            width: 7,
            height: 7,
            borderRadius: '50%',
            background: hasValue ? dotColor : '#3F3F46',
            flexShrink: 0,
            transition: 'background 0.2s',
          }}
        />
        <label
          style={{
            color: '#A1A1AA',
            fontSize: 11,
            fontWeight: 500,
            letterSpacing: '0.03em',
            textTransform: 'uppercase',
          }}
        >
          {label}
        </label>
        {hasValue && (
          <span
            style={{
              marginLeft: 'auto',
              fontSize: 10,
              color: dotColor,
              fontWeight: 500,
            }}
          >
            Connected
          </span>
        )}
      </div>
      <div style={{ position: 'relative', display: 'flex' }}>
        <input
          type={show ? 'text' : 'password'}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete="off"
          spellCheck={false}
          style={{
            flex: 1,
            background: 'rgba(255,255,255,0.04)',
            border: `1px solid ${hasValue ? 'rgba(212,175,55,0.25)' : 'rgba(255,255,255,0.08)'}`,
            borderRadius: 8,
            padding: '8px 36px 8px 12px',
            fontSize: 12,
            color: '#E4E4E7',
            fontFamily: 'monospace',
            outline: 'none',
            transition: 'border-color 0.15s',
            width: '100%',
          }}
          onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(212,175,55,0.4)' }}
          onBlur={(e) => { e.currentTarget.style.borderColor = hasValue ? 'rgba(212,175,55,0.25)' : 'rgba(255,255,255,0.08)' }}
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          tabIndex={-1}
          aria-label={show ? 'Hide key' : 'Show key'}
          style={{
            position: 'absolute',
            right: 8,
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'none',
            border: 'none',
            padding: 4,
            cursor: 'pointer',
            color: '#52525B',
            display: 'flex',
          }}
        >
          {show ? (
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M1 7s2.5-4 6-4 6 4 6 4-2.5 4-6 4-6-4-6-4z" stroke="currentColor" strokeWidth="1.2"/>
              <circle cx="7" cy="7" r="1.5" stroke="currentColor" strokeWidth="1.2"/>
              <path d="M2 2l10 10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M1 7s2.5-4 6-4 6 4 6 4-2.5 4-6 4-6-4-6-4z" stroke="currentColor" strokeWidth="1.2"/>
              <circle cx="7" cy="7" r="1.5" stroke="currentColor" strokeWidth="1.2"/>
            </svg>
          )}
        </button>
      </div>
    </div>
  )
}
