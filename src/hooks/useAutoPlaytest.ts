'use client'

/**
 * useAutoPlaytest — Automatically runs the agentic playtest loop
 * after the AI generates Luau code. No human intervention needed.
 *
 * Flow:
 * 1. AI generates code → extracted from response
 * 2. Code sent to /api/ai/playtest SSE endpoint
 * 3. Progress streamed in real-time (testing... fixing... passed!)
 * 4. If code is fixed, the fixed version replaces the original
 * 5. Sound effects and notifications at each step
 */

import { useState, useCallback, useRef } from 'react'
import { playCompletionSound, playErrorSound, playPlaytestStartSound } from '@/lib/sounds'
import { notifyPlaytestStep, notifyPlaytestResult } from '@/lib/notifications'

interface PlaytestStep {
  action: string
  details: string
  timestamp: number
  data?: unknown
}

interface PlaytestState {
  running: boolean
  currentStep: string
  iteration: number
  steps: PlaytestStep[]
  result: 'idle' | 'running' | 'passed' | 'failed'
  fixedCode?: string
  errors?: string[]
}

interface UseAutoPlaytestOptions {
  studioSessionId?: string
  enabled?: boolean
  onCodeFixed?: (fixedCode: string) => void
  onStepUpdate?: (step: PlaytestStep) => void
}

export function useAutoPlaytest(options: UseAutoPlaytestOptions = {}) {
  const { studioSessionId, enabled = true, onCodeFixed, onStepUpdate } = options
  const [state, setState] = useState<PlaytestState>({
    running: false,
    currentStep: '',
    iteration: 0,
    steps: [],
    result: 'idle',
  })
  const abortRef = useRef<AbortController | null>(null)

  /**
   * Extract Luau code blocks from an AI response
   */
  const extractCode = useCallback((text: string): string | null => {
    // Match ```lua or ```luau code blocks
    const matches = text.match(/```(?:lua|luau)\s*\n([\s\S]*?)```/g)
    if (!matches || matches.length === 0) return null

    // Combine all code blocks (multi-file builds)
    return matches
      .map((block) => {
        const inner = block.match(/```(?:lua|luau)\s*\n([\s\S]*?)```/)
        return inner?.[1]?.trim() || ''
      })
      .filter(Boolean)
      .join('\n\n')
  }, [])

  /**
   * Run the autonomous playtest loop
   */
  const runPlaytest = useCallback(
    async (code: string) => {
      if (!enabled || !studioSessionId || !code.trim()) return

      // Cancel any existing playtest
      abortRef.current?.abort()
      const abort = new AbortController()
      abortRef.current = abort

      setState({
        running: true,
        currentStep: 'Starting autonomous playtest...',
        iteration: 0,
        steps: [],
        result: 'running',
      })

      playPlaytestStartSound()

      try {
        const res = await fetch('/api/ai/playtest', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            code,
            sessionId: studioSessionId,
            maxIterations: 3,
          }),
          signal: abort.signal,
        })

        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: 'Playtest failed' }))
          setState((prev) => ({
            ...prev,
            running: false,
            currentStep: err.error || 'Playtest failed',
            result: 'failed',
          }))
          playErrorSound()
          return
        }

        // Read SSE stream
        const reader = res.body?.getReader()
        if (!reader) return

        const decoder = new TextDecoder()
        let buffer = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() || '' // Keep incomplete line in buffer

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue
            try {
              const step = JSON.parse(line.slice(6)) as PlaytestStep & {
                success?: boolean
                finalCode?: string
                errors?: string[]
                iterations?: number
              }

              // Update state with each step
              setState((prev) => ({
                ...prev,
                currentStep: step.details,
                iteration: step.data && typeof step.data === 'object' && 'iteration' in (step.data as Record<string, unknown>)
                  ? (step.data as { iteration: number }).iteration
                  : prev.iteration,
                steps: [...prev.steps, step],
              }))

              onStepUpdate?.(step)
              notifyPlaytestStep(step.details, state.iteration)

              // Check for final result
              if (step.action === 'complete' || step.action === 'failed') {
                const success = step.action === 'complete' || step.success === true

                setState((prev) => ({
                  ...prev,
                  running: false,
                  result: success ? 'passed' : 'failed',
                  fixedCode: step.finalCode,
                  errors: step.errors,
                  iteration: step.iterations || prev.iteration,
                }))

                if (success) {
                  playCompletionSound()
                  if (step.finalCode && step.finalCode !== code) {
                    onCodeFixed?.(step.finalCode)
                  }
                } else {
                  playErrorSound()
                }

                notifyPlaytestResult(success, step.iterations || 0, step.errors)
              }
            } catch {
              // Invalid JSON — skip
            }
          }
        }
      } catch (err) {
        if ((err as Error).name === 'AbortError') return // Cancelled
        setState((prev) => ({
          ...prev,
          running: false,
          currentStep: 'Playtest error',
          result: 'failed',
        }))
        playErrorSound()
      }
    },
    [enabled, studioSessionId, onCodeFixed, onStepUpdate, state.iteration],
  )

  /**
   * Auto-trigger: call this after AI response is received.
   * Extracts code from the response and runs playtest if code found.
   */
  const autoTrigger = useCallback(
    (aiResponse: string) => {
      if (!enabled || !studioSessionId) return false
      const code = extractCode(aiResponse)
      if (!code) return false
      runPlaytest(code)
      return true
    },
    [enabled, studioSessionId, extractCode, runPlaytest],
  )

  const cancelPlaytest = useCallback(() => {
    abortRef.current?.abort()
    setState((prev) => ({
      ...prev,
      running: false,
      currentStep: 'Cancelled',
      result: 'idle',
    }))
  }, [])

  return {
    ...state,
    runPlaytest,
    autoTrigger,
    cancelPlaytest,
    extractCode,
  }
}
