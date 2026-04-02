/**
 * Shared SSE pub/sub bus for Studio sessions.
 * Imported by both stream/route.ts and update/route.ts to avoid
 * cross-bundle globalThis splits on Vercel serverless.
 *
 * IMPORTANT: uses the same globalThis key (__fjSseSubscribers) as
 * stream/route.ts and the same SseController shape { enqueue, close }.
 * Previously this file used __fjSseBus with a { write, close } shape,
 * which meant pushes from update/route.ts never reached browsers because
 * the two registries were completely separate.
 */

interface SseController {
  enqueue: (data: string) => void
  close: () => void
}

type SubscriberMap = Map<string, Set<SseController>>

// Must match the key used in stream/route.ts
const G = globalThis as unknown as { __fjSseSubscribers?: SubscriberMap }
if (!G.__fjSseSubscribers) G.__fjSseSubscribers = new Map()

export const subscribers: SubscriberMap = G.__fjSseSubscribers

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
      ctrl.enqueue(payload)
      delivered++
    } catch {
      // Connection dead — remove on next cleanup
      set.delete(ctrl)
    }
  }
  if (set.size === 0) subscribers.delete(sessionId)
  return delivered
}
