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

import React, { useState, useCallback, useEffect, useRef } from 'react'
import { useUser } from '@clerk/nextjs'
import { ChatPanel } from '@/components/editor/ChatPanel'
import { CommandPalette } from '@/components/editor/CommandPalette'
import { useChat, loadSessions, type ChatSession } from './hooks/useChat'
import { useStudioConnection } from './hooks/useStudioConnection'
import { useEditorKeyboard } from './hooks/useEditorKeyboard'
import { ToastProvider, useToast } from '@/components/editor/EditorToasts'
import { ThemeProvider } from '@/components/ThemeProvider'
import { EditorTopBar } from './components/EditorTopBar'
import { WelcomeHero } from './components/WelcomeHero'
import { LeftDrawer } from './components/LeftDrawer'
import ApiKeysModal from './panels/ApiKeysModal'

// ─── Inner component (needs toast + theme providers above) ────────────────

function EditorInner() {
  const { isSignedIn } = useUser()
  const { toast } = useToast()

  // ── State ──
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [apiKeysOpen, setApiKeysOpen] = useState(false)
  const [cmdPaletteOpen, setCmdPaletteOpen] = useState(false)
  const [sessions, setSessions] = useState<ChatSession[]>([])

  // ── Studio connection (lazy — drives Send to Studio button in chat) ──
  const studio = useStudioConnection()

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
        toast('Studio not connected — install the plugin from /download', 'warning')
        return
      }
      fetch('/api/studio/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: luauCode, sessionId: studio.sessionId }),
      })
        .then(() => {
          studio.addActivity('Code sent to Studio')
          toast('Sent to Studio', 'success')
        })
        .catch(() => toast('Failed to send to Studio', 'error'))
    },
    [studio, toast],
  )

  const hasMessages = chat.messages.length > 0

  return (
    <div
      style={{
        position: 'relative',
        width: '100vw',
        height: '100dvh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        background: '#050810',
        color: '#FAFAFA',
        fontFamily: 'Inter, sans-serif',
      }}
    >
      {/* Top bar */}
      <EditorTopBar
        onOpenDrawer={() => setDrawerOpen(true)}
        onOpenApiKeys={() => setApiKeysOpen(true)}
      />

      {/* Main content — either welcome hero OR chat messages */}
      {!hasMessages ? (
        <WelcomeHero
          visible={!hasMessages}
          onQuickAction={handleQuickAction}
        />
      ) : (
        // When messages exist, ChatPanel fills the space (messages + input)
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <ChatPanel
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
            onBuildGame={(prompt) => { if (studio.sessionId) chat.triggerStepByStepBuild(prompt, studio.sessionId) }}
          />
        </div>
      )}

      {/* Floating chat input when in welcome state (no messages yet) */}
      {!hasMessages && (
        <div
          style={{
            padding: '12px 16px 24px',
            borderTop: '1px solid rgba(255,255,255,0.04)',
            background: 'rgba(5,8,16,0.9)',
            backdropFilter: 'blur(12px)',
          }}
        >
          <div style={{ maxWidth: 640, margin: '0 auto' }}>
            {/* AI mode icons — quick-switch between features */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
              {[
                { mode: 'build' as const, icon: '🏗️', label: 'Build', color: '#D4AF37' },
                { mode: 'plan' as const, icon: '📋', label: 'Plan', color: '#60A5FA' },
                { mode: 'script' as const, icon: '📝', label: 'Script', color: '#7C3AED' },
                { mode: 'image' as const, icon: '🎨', label: 'Image', color: '#10B981' },
                { mode: 'mesh' as const, icon: '🧊', label: '3D Model', color: '#F59E0B' },
                { mode: 'think' as const, icon: '🧠', label: 'Think', color: '#EC4899' },
              ].map(({ mode, icon, label, color }) => (
                <button
                  key={mode}
                  onClick={() => chat.setAIMode(mode)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '5px 10px',
                    borderRadius: 8,
                    border: `1px solid ${chat.aiMode === mode ? `${color}55` : 'rgba(255,255,255,0.06)'}`,
                    background: chat.aiMode === mode ? `${color}15` : 'rgba(255,255,255,0.02)',
                    color: chat.aiMode === mode ? color : '#71717A',
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    fontFamily: 'Inter, sans-serif',
                  }}
                >
                  <span style={{ fontSize: 13 }}>{icon}</span>
                  {label}
                </button>
              ))}
            </div>

            {/* Input row */}
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
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
                placeholder={
                  chat.aiMode === 'build' ? 'Describe what you want to build...' :
                  chat.aiMode === 'plan' ? 'Describe the game you want to plan...' :
                  chat.aiMode === 'script' ? 'Describe the script you need...' :
                  chat.aiMode === 'image' ? 'Describe the image to generate...' :
                  chat.aiMode === 'mesh' ? 'Describe the 3D model to generate...' :
                  chat.aiMode === 'think' ? 'Ask me anything — I\'ll think deep...' :
                  'Type what you want to build...'
                }
                rows={1}
                style={{
                  flex: 1,
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 12,
                  padding: '12px 16px',
                  color: '#FAFAFA',
                  fontSize: 14,
                  fontFamily: 'Inter, sans-serif',
                  resize: 'none',
                  outline: 'none',
                  lineHeight: 1.5,
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(212,175,55,0.3)' }}
                onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)' }}
              />
              <button
                onClick={() => { if (chat.input.trim()) chat.sendMessage(chat.input) }}
                disabled={chat.loading || !chat.input.trim()}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  border: 'none',
                  background: chat.input.trim() ? '#D4AF37' : 'rgba(255,255,255,0.06)',
                  color: chat.input.trim() ? '#09090b' : '#52525B',
                  cursor: chat.input.trim() ? 'pointer' : 'default',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  transition: 'all 0.15s',
                }}
                aria-label="Send message"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
                </svg>
              </button>
            </div>
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
