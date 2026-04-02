/**
 * Shared SSE pub/sub bus for Studio sessions.
 * Imported by both stream/route.ts and update/route.ts to avoid
 * cross-bundle globalThis splits on Vercel serverless.
 */

interface SseController {
  write: (data: string) => void
  close: () => void
}

type SubscriberMap = Map<string, Set<SseController>>

// Singleton on globalThis survives hot-reloads
const G = globalThis as unknown as { __fjSseBus?: SubscriberMap }
if (!G.__fjSseBus) G.__fjSseBus = new Map()

export const subscribers: SubscriberMap = G.__fjSseBus

export function addSubscriber(sessionId: string, controller: SseController): void {
  let set = subscribers.get(sessionId)
  if (!set) {
    set = new Set()
    subscribers.set(sessionId, set)
  }
  set.add(controller)
}

export function removeSubscriber(sessionId: string, controller: SseController): void {
  const set = subscribers.get(sessionId)
  if (set) {
    set.delete(controller)
    if (set.size === 0) subscribers.delete(sessionId)
  }
}

/**
 * Push an SSE event to all browser connections watching this session.
 * Returns the number of subscribers that received the event.
 */
export function pushToSession(sessionId: string, event: string, data: unknown): number {
  const set = subscribers.get(sessionId)
  if (!set || set.size === 0) return 0

  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
  let delivered = 0
  for (const ctrl of set) {
    try {
      ctrl.write(payload)
      delivered++
    } catch {
      // Connection dead — remove on next cleanup
      set.delete(ctrl)
    }
  }
  return delivered
}
