'use client'

import React, { useState } from 'react'
import { GlassPanel } from './GlassPanel'
import type { StudioActivity, ConnectFlowState } from '@/app/(app)/editor/hooks/useStudioConnection'

interface StudioPanelProps {
  isConnected: boolean
  connectFlow: ConnectFlowState
  connectCode: string
  connectTimer: number
  screenshotUrl: string | null
  placeName: string
  activity: StudioActivity[]
  commandsSent: number
  onGenerateCode: () => void
  onConfirmConnected: () => void
  onDisconnect: () => void
}

function formatTimer(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

function CodeTile({ char }: { char: string }) {
  return (
    <div
      style={{
        width: 56,
        height: 64,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.5)',
        border: '1px solid rgba(212,175,55,0.35)',
        borderRadius: 12,
        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
        fontSize: 28,
        fontWeight: 700,
        color: '#FFB81C',
        textShadow: '0 0 20px rgba(255,184,28,0.6)',
        letterSpacing: 0,
        userSelect: 'none',
        flexShrink: 0,
      }}
    >
      {char}
    </div>
  )
}

function DisconnectedView({
  connectFlow,
  connectCode,
  connectTimer,
  onGenerateCode,
  onConfirmConnected,
}: {
  connectFlow: ConnectFlowState
  connectCode: string
  connectTimer: number
  onGenerateCode: () => void
  onConfirmConnected: () => void
}) {
  const [codeCopied, setCodeCopied] = useState(false)

  const handleCopy = async () => {
    if (!connectCode) return
    await navigator.clipboard.writeText(connectCode).catch(() => {})
    setCodeCopied(true)
    setTimeout(() => setCodeCopied(false), 2000)
  }

  const isIdle = connectFlow === 'idle'
  const isGenerating = connectFlow === 'generating'
  const hasCode = connectFlow === 'code' && connectCode.length > 0

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        padding: '32px 24px',
        gap: 32,
      }}
    >
      {/* Header */}
      <div style={{ textAlign: 'center' }}>
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 16,
            background: 'rgba(255,184,28,0.1)',
            border: '1px solid rgba(255,184,28,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <rect x="2" y="3" width="20" height="15" rx="2" stroke="#FFB81C" strokeWidth="1.5"/>
            <path d="M2 7h20" stroke="#FFB81C" strokeWidth="1.5"/>
            <path d="M7 3v4" stroke="#FFB81C" strokeWidth="1.5" strokeLinecap="round"/>
            <path d="M17 3v4" stroke="#FFB81C" strokeWidth="1.5" strokeLinecap="round"/>
            <path d="M8 19l4 2 4-2" stroke="#FFB81C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12 18v3" stroke="#FFB81C" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </div>
        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'white', fontFamily: 'Inter, sans-serif' }}>
          Connect Roblox Studio
        </h3>
        <p style={{ margin: '6px 0 0', fontSize: 13, color: 'rgba(255,255,255,0.4)', fontFamily: 'Inter, sans-serif' }}>
          Push AI builds live — no copy-paste required
        </p>
      </div>

      {/* Code display area */}
      {hasCode ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, width: '100%' }}>
          <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,0.5)', fontFamily: 'Inter, sans-serif', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Enter this code in the plugin
          </p>

          {/* Big code tiles */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'nowrap' }}>
            {connectCode.split('').map((char, i) => (
              <CodeTile key={i} char={char} />
            ))}
          </div>

          {/* Copy + timer row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              onClick={handleCopy}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 16px',
                borderRadius: 10,
                border: `1px solid ${codeCopied ? 'rgba(74,222,128,0.4)' : 'rgba(255,184,28,0.3)'}`,
                background: codeCopied ? 'rgba(74,222,128,0.12)' : 'rgba(255,184,28,0.1)',
                color: codeCopied ? '#4ADE80' : '#FFB81C',
                fontSize: 13,
                fontWeight: 600,
                fontFamily: 'Inter, sans-serif',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {codeCopied ? (
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M2 7l3.5 3.5 6.5-6.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <rect x="1" y="3" width="8" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
                  <path d="M4.5 3V2a1 1 0 011-1h5.5a1 1 0 011 1v8a1 1 0 01-1 1H10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                </svg>
              )}
              {codeCopied ? 'Copied!' : 'Copy Code'}
            </button>

            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', fontFamily: "'JetBrains Mono', monospace" }}>
              {formatTimer(connectTimer)}
            </span>
          </div>

          {/* Confirm button */}
          <button
            onClick={onConfirmConnected}
            style={{
              padding: '10px 24px',
              borderRadius: 12,
              border: 'none',
              background: 'linear-gradient(135deg, #D4AF37 0%, #FFB81C 100%)',
              color: '#030712',
              fontSize: 14,
              fontWeight: 700,
              fontFamily: 'Inter, sans-serif',
              cursor: 'pointer',
              boxShadow: '0 0 24px rgba(212,175,55,0.3)',
              transition: 'all 0.15s',
            }}
          >
            I entered the code — Connected
          </button>
        </div>
      ) : (
        <button
          onClick={onGenerateCode}
          disabled={isGenerating}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '12px 28px',
            borderRadius: 14,
            border: 'none',
            background: isGenerating
              ? 'rgba(255,184,28,0.15)'
              : 'linear-gradient(135deg, #D4AF37 0%, #FFB81C 100%)',
            color: isGenerating ? '#FFB81C' : '#030712',
            fontSize: 15,
            fontWeight: 700,
            fontFamily: 'Inter, sans-serif',
            cursor: isGenerating ? 'not-allowed' : 'pointer',
            boxShadow: isGenerating ? 'none' : '0 0 32px rgba(212,175,55,0.35)',
            transition: 'all 0.15s',
            opacity: isGenerating ? 0.7 : 1,
          }}
        >
          {isGenerating && (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ animation: 'spin 0.8s linear infinite' }}>
              <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" strokeDasharray="10 8"/>
            </svg>
          )}
          {isGenerating ? 'Generating code...' : 'Generate Connection Code'}
        </button>
      )}

      {/* Step-by-step setup guide */}
      <div
        style={{
          width: '100%',
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.05)',
          borderRadius: 16,
          padding: '20px',
        }}
      >
        <p style={{ margin: '0 0 16px', fontSize: 12, fontWeight: 700, color: 'rgba(255,184,28,0.9)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'Inter, sans-serif' }}>
          Quick Setup (2 minutes)
        </p>

        {/* Step 1 */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'flex-start' }}>
          <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(255,184,28,0.12)', border: '1px solid rgba(255,184,28,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 2v8M5 7l3 3 3-3" stroke="#FFB81C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M3 11v1.5a1 1 0 001 1h8a1 1 0 001-1V11" stroke="#FFB81C" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <div>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.85)', fontFamily: 'Inter, sans-serif' }}>
              Download the plugin
            </p>
            <p style={{ margin: '3px 0 0', fontSize: 12, color: 'rgba(255,255,255,0.4)', fontFamily: 'Inter, sans-serif', lineHeight: 1.4 }}>
              Click the button below to get <span style={{ color: 'rgba(255,184,28,0.8)', fontWeight: 600 }}>ForjeGames.rbxm</span>
            </p>
          </div>
        </div>

        {/* Step 2 */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'flex-start' }}>
          <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(255,184,28,0.12)', border: '1px solid rgba(255,184,28,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M2 4.5A1.5 1.5 0 013.5 3h3.293a1 1 0 01.707.293L8.5 4.293a1 1 0 00.707.293H12.5A1.5 1.5 0 0114 6.086V11.5a1.5 1.5 0 01-1.5 1.5h-9A1.5 1.5 0 012 11.5V4.5z" stroke="#FFB81C" strokeWidth="1.3"/>
            </svg>
          </div>
          <div>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.85)', fontFamily: 'Inter, sans-serif' }}>
              Move it to your Plugins folder
            </p>
            <p style={{ margin: '3px 0 0', fontSize: 12, color: 'rgba(255,255,255,0.4)', fontFamily: 'Inter, sans-serif', lineHeight: 1.4 }}>
              Open File Explorer and paste this path:
            </p>
            <button
              onClick={() => {
                const isWin = typeof navigator !== 'undefined' && navigator.userAgent.includes('Win')
                const path = isWin
                  ? '%LOCALAPPDATA%\\Roblox\\Plugins'
                  : '~/Documents/Roblox/Plugins'
                navigator.clipboard.writeText(path).catch(() => {})
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                marginTop: 6,
                padding: '6px 10px',
                borderRadius: 8,
                border: '1px solid rgba(255,255,255,0.1)',
                background: 'rgba(0,0,0,0.4)',
                color: 'rgba(255,255,255,0.7)',
                fontSize: 11,
                fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                cursor: 'pointer',
                transition: 'all 0.15s',
                width: '100%',
                textAlign: 'left',
              }}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0 }}>
                <rect x="1" y="3" width="7" height="7.5" rx="1" stroke="rgba(255,255,255,0.4)" strokeWidth="1"/>
                <path d="M4 3V2a1 1 0 011-1h4a1 1 0 011 1v6a1 1 0 01-1 1H9" stroke="rgba(255,255,255,0.4)" strokeWidth="1"/>
              </svg>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {typeof navigator !== 'undefined' && navigator.userAgent?.includes('Win')
                  ? '%LOCALAPPDATA%\\Roblox\\Plugins'
                  : '~/Documents/Roblox/Plugins'}
              </span>
              <span style={{ fontSize: 9, color: 'rgba(255,184,28,0.6)', marginLeft: 'auto', flexShrink: 0 }}>click to copy</span>
            </button>
            <p style={{ margin: '4px 0 0', fontSize: 11, color: 'rgba(255,255,255,0.3)', fontFamily: 'Inter, sans-serif' }}>
              Drop the .rbxm file into that folder
            </p>
          </div>
        </div>

        {/* Step 3 */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'flex-start' }}>
          <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(255,184,28,0.12)', border: '1px solid rgba(255,184,28,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M4 2h8a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V4a2 2 0 012-2z" stroke="#FFB81C" strokeWidth="1.3"/>
              <path d="M6 8l2 2 4-4" stroke="#FFB81C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.85)', fontFamily: 'Inter, sans-serif' }}>
              Restart Studio & open the plugin
            </p>
            <p style={{ margin: '3px 0 0', fontSize: 12, color: 'rgba(255,255,255,0.4)', fontFamily: 'Inter, sans-serif', lineHeight: 1.4 }}>
              Fully close and reopen Roblox Studio. Look for <span style={{ color: 'rgba(255,184,28,0.8)', fontWeight: 600 }}>ForjeGames</span> in the Plugins tab at the top.
            </p>
          </div>
        </div>

        {/* Step 4 */}
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(255,184,28,0.12)', border: '1px solid rgba(255,184,28,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M4.5 8h7M8 4.5v7" stroke="#FFB81C" strokeWidth="1.5" strokeLinecap="round"/>
              <circle cx="8" cy="8" r="6" stroke="#FFB81C" strokeWidth="1.3"/>
            </svg>
          </div>
          <div>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.85)', fontFamily: 'Inter, sans-serif' }}>
              Enter the code above
            </p>
            <p style={{ margin: '3px 0 0', fontSize: 12, color: 'rgba(255,255,255,0.4)', fontFamily: 'Inter, sans-serif', lineHeight: 1.4 }}>
              Click the ForjeGames button in Studio, type the 6-character code, and hit Connect. You&apos;re done!
            </p>
          </div>
        </div>
      </div>

      {/* Download button — prominent */}
      <a
        href="/api/studio/plugin"
        download="ForjeGames.rbxm"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
          width: '100%',
          padding: '14px 24px',
          borderRadius: 14,
          border: 'none',
          background: 'linear-gradient(135deg, rgba(212,175,55,0.2) 0%, rgba(255,184,28,0.15) 100%)',
          color: '#FFB81C',
          fontSize: 14,
          fontWeight: 700,
          fontFamily: 'Inter, sans-serif',
          textDecoration: 'none',
          cursor: 'pointer',
          transition: 'all 0.2s',
          boxShadow: '0 0 20px rgba(212,175,55,0.15)',
        }}
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path d="M9 2v10M5.5 8.5L9 12l3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M3 13v1.5a1.5 1.5 0 001.5 1.5h9a1.5 1.5 0 001.5-1.5V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
        Download ForjeGames Plugin
        <span style={{ fontSize: 11, opacity: 0.6, fontWeight: 500 }}>(.rbxm)</span>
      </a>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

function ConnectedView({
  placeName,
  screenshotUrl,
  activity,
  commandsSent,
  onDisconnect,
}: {
  placeName: string
  screenshotUrl: string | null
  activity: StudioActivity[]
  commandsSent: number
  onDisconnect: () => void
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        padding: '20px',
        gap: 16,
        overflowY: 'auto',
      }}
    >
      {/* Connection status badge */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ position: 'relative', width: 10, height: 10 }}>
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: '#4ADE80',
                boxShadow: '0 0 8px #4ADE80',
              }}
            />
            <div
              style={{
                position: 'absolute',
                inset: -3,
                borderRadius: '50%',
                border: '2px solid rgba(74,222,128,0.3)',
                animation: 'ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite',
              }}
            />
          </div>
          <span style={{ fontSize: 14, fontWeight: 700, color: 'white', fontFamily: 'Inter, sans-serif' }}>
            Connected
          </span>
          {placeName && (
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontFamily: 'Inter, sans-serif' }}>
              — {placeName}
            </span>
          )}
        </div>
        <button
          onClick={onDisconnect}
          style={{
            padding: '4px 10px',
            borderRadius: 8,
            border: '1px solid rgba(239,68,68,0.2)',
            background: 'rgba(239,68,68,0.08)',
            color: 'rgba(239,68,68,0.7)',
            fontSize: 11,
            fontWeight: 600,
            fontFamily: 'Inter, sans-serif',
            cursor: 'pointer',
          }}
        >
          Disconnect
        </button>
      </div>

      {/* Screenshot */}
      <div
        style={{
          width: '100%',
          aspectRatio: '16/9',
          borderRadius: 12,
          overflow: 'hidden',
          background: 'rgba(0,0,0,0.4)',
          border: '1px solid rgba(255,255,255,0.06)',
          position: 'relative',
        }}
      >
        {screenshotUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={screenshotUrl}
            alt="Roblox Studio screenshot"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" opacity={0.3}>
              <rect x="2" y="4" width="28" height="20" rx="3" stroke="white" strokeWidth="1.5"/>
              <circle cx="10" cy="12" r="3" stroke="white" strokeWidth="1.5"/>
              <path d="M2 20l7-5 5 4 4-3 12 8" stroke="white" strokeWidth="1.5" strokeLinejoin="round"/>
            </svg>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', fontFamily: 'Inter, sans-serif' }}>
              Waiting for screenshot...
            </span>
          </div>
        )}
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: 10 }}>
        <div
          style={{
            flex: 1,
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 12,
            padding: '10px 14px',
          }}
        >
          <div style={{ fontSize: 20, fontWeight: 700, color: '#FFB81C', fontFamily: 'Inter, sans-serif' }}>
            {commandsSent}
          </div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', fontFamily: 'Inter, sans-serif', marginTop: 2 }}>
            Commands Sent
          </div>
        </div>
        <div
          style={{
            flex: 1,
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 12,
            padding: '10px 14px',
          }}
        >
          <div style={{ fontSize: 20, fontWeight: 700, color: '#4ADE80', fontFamily: 'Inter, sans-serif' }}>
            Live
          </div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', fontFamily: 'Inter, sans-serif', marginTop: 2 }}>
            Build Status
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      {activity.length > 0 && (
        <div>
          <p style={{ margin: '0 0 10px', fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'Inter, sans-serif' }}>
            Recent Activity
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {activity.slice(0, 8).map((item) => (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 8,
                  padding: '8px 12px',
                  background: 'rgba(255,255,255,0.025)',
                  borderRadius: 10,
                  border: '1px solid rgba(255,255,255,0.05)',
                }}
              >
                <div
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: '#4ADE80',
                    flexShrink: 0,
                    marginTop: 4,
                  }}
                />
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', fontFamily: 'Inter, sans-serif', lineHeight: 1.5 }}>
                  {item.message}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <style>{`
        @keyframes ping {
          0%   { transform: scale(1); opacity: 0.6; }
          75%  { transform: scale(1.8); opacity: 0; }
          100% { transform: scale(1.8); opacity: 0; }
        }
      `}</style>
    </div>
  )
}

export function StudioPanel({
  isConnected,
  connectFlow,
  connectCode,
  connectTimer,
  screenshotUrl,
  placeName,
  activity,
  commandsSent,
  onGenerateCode,
  onConfirmConnected,
  onDisconnect,
}: StudioPanelProps) {
  return (
    <GlassPanel
      padding="none"
      style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
    >
      {isConnected || connectFlow === 'connected' ? (
        <ConnectedView
          placeName={placeName}
          screenshotUrl={screenshotUrl}
          activity={activity}
          commandsSent={commandsSent}
          onDisconnect={onDisconnect}
        />
      ) : (
        <DisconnectedView
          connectFlow={connectFlow}
          connectCode={connectCode}
          connectTimer={connectTimer}
          onGenerateCode={onGenerateCode}
          onConfirmConnected={onConfirmConnected}
        />
      )}
    </GlassPanel>
  )
}
