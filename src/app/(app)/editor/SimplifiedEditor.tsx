'use client'

/**
 * SimplifiedEditor — chat-first Roblox AI builder.
 *
 * Replaces the 4,344-line NewEditorClient with a clean layout:
 *   TopBar  →  WelcomeHero (empty state) / Messages (active chat)  →  ChatInput
 *
 * All the heavy lifting (messaging, streaming, slash commands, BYOK, Studio
 * sync, persistence) stays in the existing hooks — this file is pure layout.
 */

import React, { useState, useCallback, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { ChatPanel } from '@/components/editor/ChatPanel'
import { CommandPalette } from '@/components/editor/CommandPalette'
import { PublishPanel } from '@/components/editor/PublishPanel'
import { useChat, loadSessions, type ChatSession } from './hooks/useChat'
import { useStudioConnection } from './hooks/useStudioConnection'
import { useEditorKeyboard } from './hooks/useEditorKeyboard'
import { ToastProvider, useToast } from '@/components/editor/EditorToasts'
import { ThemeProvider } from '@/components/ThemeProvider'
import { EditorTopBar } from './components/EditorTopBar'
import { WelcomeHero } from './components/WelcomeHero'
import { LeftDrawer } from './components/LeftDrawer'
import { OnboardingOverlay, useOnboardingOverlay } from './components/OnboardingOverlay'
import ApiKeysModal from './panels/ApiKeysModal'
import { BuildProgressDashboard } from '@/components/editor/BuildProgressDashboard'

// ─── Inner component (needs toast + theme providers above) ────────────────

function EditorInner() {
  const { isSignedIn } = useUser()
  const { toast } = useToast()

  // ── State ──
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [apiKeysOpen, setApiKeysOpen] = useState(false)
  const [cmdPaletteOpen, setCmdPaletteOpen] = useState(false)
  const [publishOpen, setPublishOpen] = useState(false)
  const [activeBuildId, setActiveBuildId] = useState<string | null>(null)
  const [sessions, setSessions] = useState<ChatSession[]>([])

  // ── Studio connection — auto-generate pairing code on mount ──
  const studio = useStudioConnection()

  // Auto-start Studio connect flow so the pairing code is ready in the top bar
  React.useEffect(() => {
    if (isSignedIn && !studio.isConnected && studio.connectFlow === 'idle') {
      studio.generateCode()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSignedIn, studio.isConnected, studio.connectFlow])

  // ── Chat hook — the core of everything ──
  const chat = useChat({
    studioSessionId: studio.sessionId,
    studioConnected: studio.isConnected,
    studioContext: studio.studioContext,
    onBuildComplete: useCallback(
      async (luauCode: string, prompt: string, sessionId: string | null) => {
        if (!sessionId) return
        try {
          await fetch('/api/studio/execute', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code: luauCode, prompt, sessionId }),
          })
          studio.addActivity(`Build sent: ${prompt.slice(0, 60)}`)
        } catch {
          // Non-fatal — chat already shows the code
        }
      },
      [studio],
    ),
  })

  // ── Onboarding overlay — auto-show on first visit ──
  const { shouldShow: showOnboarding, dismiss: dismissOnboarding } = useOnboardingOverlay({
    hasMessages: chat.messages.length > 0,
  })

  // ── Auto-clear chat on ?new=1 and auto-send ?prompt= from onboarding ──
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search)
      if (params.has('new')) {
        chat.newChat()
      }
      // Auto-send the prompt passed from the onboarding wizard
      const promptParam = params.get('prompt')
      if (promptParam && promptParam.trim()) {
        // Small delay so the chat hook is fully initialised
        setTimeout(() => chat.sendMessage(promptParam.trim()), 300)
      }
      // Clean URL params so refresh doesn't re-trigger
      if (params.has('new') || params.has('prompt')) {
        const url = new URL(window.location.href)
        url.searchParams.delete('new')
        url.searchParams.delete('prompt')
        window.history.replaceState({}, '', url.toString())
      }
    } catch { /* ignore */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Load session list for drawer ──
  useEffect(() => {
    setSessions(loadSessions())
  }, [chat.currentSessionId])

  // ── Keyboard shortcuts ──
  useEditorKeyboard({
    openCommandPalette: () => setCmdPaletteOpen(true),
    toggleViewport: () => {},
    closeSidebar: () => setDrawerOpen(false),
    toggleSidebar: () => setDrawerOpen(v => !v),
    toggleShortcutsHelp: () => {},
    focusChatInput: () => chat.textareaRef?.current?.focus(),
    newChat: () => chat.newChat(),
  })

  // ── Quick action handler from WelcomeHero cards ──
  const handleQuickAction = useCallback(
    (prompt: string, autoSend: boolean) => {
      if (autoSend) {
        chat.sendMessage(prompt)
      } else {
        // Focus input with pre-filled text (user completes the prompt)
        chat.setInput(prompt)
        chat.textareaRef?.current?.focus()
      }
    },
    [chat],
  )

  // ── Send to Studio handler for mesh/asset results in chat ──
  const handleSendToStudio = useCallback(
    (luauCode: string) => {
      if (!studio.sessionId || !studio.isConnected) {
        // Pre-flight: open publish panel so user can connect
        toast('Studio not connected — open the Publish panel to pair', 'warning')
        setPublishOpen(true)
        return
      }
      fetch('/api/studio/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: luauCode, sessionId: studio.sessionId }),
      })
        .then(() => {
          studio.addActivity('Code sent to Studio')
          toast('Deployed to Studio', 'success')
        })
        .catch(() => toast('Failed to send to Studio', 'error'))
    },
    [studio, toast],
  )

  const hasMessages = chat.messages.length > 0

  return (
    <div
      style={{
        width: '100%',
        height: '100vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
        background: 'linear-gradient(180deg, #050810 0%, #070B1A 50%, #050810 100%)',
        color: '#FAFAFA',
        fontFamily: 'var(--font-inter, Inter, sans-serif)',
      }}
    >
      {/* Top bar */}
      <EditorTopBar
        onOpenDrawer={() => setDrawerOpen(true)}
        onOpenApiKeys={() => setApiKeysOpen(true)}
        onNewChat={() => chat.newChat()}
        studioConnected={studio.isConnected}
        studioPlaceName={studio.placeName}
        onConnectStudio={() => {
          if (studio.connectFlow === 'idle' || studio.connectFlow === 'code') {
            setPublishOpen(true)
          }
          if (studio.connectFlow === 'idle') studio.generateCode()
        }}
        connectCode={studio.connectCode}
        onOpenPublish={() => setPublishOpen(true)}
      />

      {/* Main content — either welcome hero OR chat messages */}
      {!hasMessages ? (
        <WelcomeHero
          visible={!hasMessages}
          onQuickAction={handleQuickAction}
          onBuildGame={(prompt) => {
            if (studio.isConnected && studio.sessionId) {
              chat.triggerStepByStepBuild(prompt, studio.sessionId)
            } else {
              // No Studio connected — send as normal chat so the AI still
              // generates the full game code. No toast / publish panel needed;
              // users can connect Studio later from the top bar.
              chat.sendMessage(prompt)
            }
          }}
        />
      ) : (
        // When messages exist, ChatPanel fills the space (messages + input)
        <div style={{ flex: '1 1 0%', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <ChatPanel
            simplified
            messages={chat.messages}
            input={chat.input}
            setInput={chat.setInput}
            loading={chat.loading}
            onSend={chat.sendMessage}
            selectedModel={chat.selectedModel}
            setSelectedModel={chat.setSelectedModel}
            totalTokens={chat.totalTokens}
            textareaRef={chat.textareaRef}
            suggestions={chat.suggestions}
            onRetry={chat.resetRetryCount}
            onDismiss={chat.dismissMessage}
            onEditAndResend={chat.editAndResend}
            onSendToStudio={handleSendToStudio}
            studioConnected={studio.isConnected}
            savedAt={chat.savedAt}
            imageFile={chat.imageFile}
            onImageFile={chat.setImageFile}
            aiMode={chat.aiMode}
            onAIModeChange={chat.setAIMode}
            thinkingText={chat.thinkingText}
            isThinking={chat.isThinking}
            planText={chat.planText}
            onApprovePlan={chat.approvePlan}
            onEditPlan={chat.editPlan}
            onCancelPlan={chat.cancelPlan}
            autoEnhanceEnabled={chat.enhancePrompts}
            onAutoEnhanceToggle={chat.setEnhancePrompts}
            sessionId={chat.currentSessionId ?? undefined}
            checkpoints={chat.checkpoints}
            onSaveCheckpoint={chat.saveCheckpoint}
            onRestoreToCheckpoint={chat.restoreToCheckpoint}
            onDeleteCheckpoint={chat.removeCheckpoint}
            imageOptions={chat.imageOptions}
            onImageOptionsChange={chat.setImageOptions}
            buildDirection={chat.buildDirection}
            onBuildDirectionChange={chat.setBuildDirection}
            onBuildGame={(prompt) => {
              if (studio.isConnected && studio.sessionId) {
                chat.triggerStepByStepBuild(prompt, studio.sessionId)
              } else {
                chat.sendMessage(prompt)
              }
            }}
          />
        </div>
      )}

      {/* Build progress dashboard — shows real-time agent progress during builds */}
      {activeBuildId && (
        <BuildProgressDashboard
          buildId={activeBuildId}
          onComplete={(summary) => {
            setActiveBuildId(null)
            toast(summary ?? 'Build complete', 'success')
          }}
          onCancel={() => {
            setActiveBuildId(null)
            toast('Build cancelled', 'warning')
          }}
        />
      )}

      {/* Floating chat input when in welcome state (no messages yet) */}
      {!hasMessages && (
        <div
          style={{
            padding: '16px 20px 28px',
            borderTop: '1px solid rgba(255,255,255,0.05)',
            background: 'linear-gradient(180deg, rgba(5,8,16,0.85) 0%, rgba(5,8,16,0.95) 100%)',
            backdropFilter: 'blur(16px)',
          }}
        >
          <div style={{ maxWidth: 640, margin: '0 auto' }}>
            {/* Input row — clean, no clutter */}
            <div
              style={{
                display: 'flex',
                gap: 8,
                alignItems: 'flex-end',
                background: 'rgba(8,10,22,0.7)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 16,
                padding: '8px 10px 8px 16px',
                transition: 'border-color 0.2s, box-shadow 0.2s',
                backdropFilter: 'blur(16px)',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.03)',
              }}
              onFocusCapture={(e) => {
                e.currentTarget.style.borderColor = 'rgba(212,175,55,0.35)'
                e.currentTarget.style.boxShadow = 'inset 0 1px 0 rgba(255,230,160,0.06), 0 0 0 1px rgba(212,175,55,0.1), 0 0 20px rgba(212,175,55,0.08)'
              }}
              onBlurCapture={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'
                e.currentTarget.style.boxShadow = 'inset 0 1px 0 rgba(255,255,255,0.03)'
              }}
            >
              <textarea
                ref={chat.textareaRef}
                value={chat.input}
                onChange={(e) => chat.setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    if (chat.input.trim()) chat.sendMessage(chat.input)
                  }
                }}
                placeholder="Describe anything — a pirate ship, a tycoon game, a medieval castle..."
                rows={1}
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  padding: '8px 0',
                  color: '#FAFAFA',
                  fontSize: 15,
                  fontFamily: 'Inter, sans-serif',
                  resize: 'none',
                  outline: 'none',
                  lineHeight: 1.5,
                  fontWeight: 500,
                }}
              />
              <button
                onClick={() => { if (chat.input.trim()) chat.sendMessage(chat.input) }}
                disabled={chat.loading || !chat.input.trim()}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  border: 'none',
                  background: chat.input.trim()
                    ? 'linear-gradient(135deg, #D4AF37 0%, #B8962E 100%)'
                    : 'rgba(255,255,255,0.04)',
                  color: chat.input.trim() ? '#09090b' : '#3F3F46',
                  cursor: chat.input.trim() ? 'pointer' : 'default',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  transition: 'all 0.15s',
                  boxShadow: chat.input.trim() ? '0 0 16px rgba(212,175,55,0.3), inset 0 1px 0 rgba(255,230,160,0.25)' : 'none',
                }}
                aria-label="Send message"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </button>
            </div>
            <p style={{ textAlign: 'center', fontSize: 11, color: '#3F3F46', marginTop: 10 }}>
              Press <kbd style={{ padding: '2px 6px', borderRadius: 4, border: '1px solid #27272A', background: '#18181B', fontSize: 10 }}>Enter</kbd> to send &middot; <kbd style={{ padding: '2px 6px', borderRadius: 4, border: '1px solid #27272A', background: '#18181B', fontSize: 10 }}>Shift+Enter</kbd> for new line
            </p>
          </div>
        </div>
      )}

      {/* Left drawer */}
      <LeftDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        sessions={sessions}
        currentSessionId={chat.currentSessionId}
        onLoadSession={chat.loadSession}
        onDeleteSession={chat.deleteSession}
        onNewChat={() => chat.newChat()}
      />

      {/* Command palette (Ctrl+K) */}
      <CommandPalette
        isOpen={cmdPaletteOpen}
        onClose={() => setCmdPaletteOpen(false)}
        onCommand={(cmd) => {
          setCmdPaletteOpen(false)
          if (cmd === 'new-chat') chat.newChat()
          else if (cmd.startsWith('load:')) chat.loadSession(cmd.slice(5))
          else chat.sendMessage(cmd)
        }}
      />

      {/* API Keys modal (BYOK) */}
      {apiKeysOpen && (
        <ApiKeysModal onClose={() => setApiKeysOpen(false)} />
      )}

      {/* Publish to Studio panel */}
      <PublishPanel
        open={publishOpen}
        onClose={() => setPublishOpen(false)}
        studioConnected={studio.isConnected}
        studioPlaceName={studio.placeName}
        connectCode={studio.connectCode}
        connectFlow={studio.connectFlow}
        onGenerateCode={() => {
          // Allow regenerate from idle or when current code expired
          if (studio.connectFlow === 'idle' || (studio.connectFlow === 'code' && studio.connectTimer <= 0)) {
            studio.generateCode()
          }
        }}
        activeBuildId={activeBuildId}
        onBuildComplete={() => {
          setActiveBuildId(null)
          toast('Build deployed to Studio', 'success')
        }}
        sessionId={studio.sessionId}
      />

      {/* Onboarding tour — auto-fires on first editor visit */}
      {showOnboarding && (
        <OnboardingOverlay
          onDone={dismissOnboarding}
          inputRef={chat.textareaRef}
          onPrefill={(prompt) => chat.setInput(prompt)}
          hasMessages={chat.messages.length > 0}
          studioConnected={studio.isConnected}
        />
      )}
    </div>
  )
}

// ─── Exported wrapper with providers ─────────────────────────────────────

export default function SimplifiedEditor() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <EditorInner />
      </ToastProvider>
    </ThemeProvider>
  )
}
