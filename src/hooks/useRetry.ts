import { useState, useRef, useCallback } from 'react'

type RetryStatus = 'idle' | 'loading' | 'success' | 'error'

interface UseRetryOptions {
  maxRetries?: number
  /** Base delay in ms — doubles each attempt (1x, 2x, 4x) */
  baseDelay?: number
  onSuccess?: <T>(data: T) => void
  onError?: (error: Error, attempt: number) => void
  onGiveUp?: (error: Error) => void
}

interface UseRetryReturn<T> {
  status: RetryStatus
  data: T | null
  error: Error | null
  attempt: number
  execute: (fn: () => Promise<T>) => Promise<void>
  cancel: () => void
  reset: () => void
}

/**
 * Hook that wraps an async function with automatic exponential-backoff retry.
 *
 * Default: up to 3 retries with 1s → 2s → 4s delays.
 */
export function useRetry<T = unknown>(options: UseRetryOptions = {}): UseRetryReturn<T> {
  const { maxRetries = 3, baseDelay = 1000, onSuccess, onError, onGiveUp } = options

  const [status, setStatus] = useState<RetryStatus>('idle')
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<Error | null>(null)
  const [attempt, setAttempt] = useState(0)

  const cancelledRef = useRef(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const cancel = useCallback(() => {
    cancelledRef.current = true
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    setStatus('idle')
  }, [])

  const reset = useCallback(() => {
    cancelledRef.current = false
    timeoutRef.current = null
    setStatus('idle')
    setData(null)
    setError(null)
    setAttempt(0)
  }, [])

  const execute = useCallback(
    async (fn: () => Promise<T>) => {
      cancelledRef.current = false
      setStatus('loading')
      setError(null)
      setAttempt(0)

      let lastError: Error = new Error('Unknown error')

      for (let i = 0; i <= maxRetries; i++) {
        if (cancelledRef.current) return

        setAttempt(i)

        try {
          const result = await fn()

          if (cancelledRef.current) return

          setData(result)
          setStatus('success')
          onSuccess?.(result)
          return
        } catch (err) {
          lastError = err instanceof Error ? err : new Error(String(err))

          if (cancelledRef.current) return

          setError(lastError)
          onError?.(lastError, i)

          // No more retries
          if (i === maxRetries) break

          // Exponential backoff wait
          const delay = baseDelay * Math.pow(2, i)
          await new Promise<void>(resolve => {
            timeoutRef.current = setTimeout(resolve, delay)
          })

          if (cancelledRef.current) return
        }
      }

      // All retries exhausted
      setStatus('error')
      onGiveUp?.(lastError)
    },
    [maxRetries, baseDelay, onSuccess, onError, onGiveUp],
  )

  return { status, data, error, attempt, execute, cancel, reset }
}
