import type { ChatMessage } from '@/app/(app)/editor/hooks/useChat'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface Checkpoint {
  id: string
  messageIndex: number
  timestamp: Date
  label: string
  messages: ChatMessage[]
  aiMode: string
}

/** Serialised shape used for localStorage (Date -> ISO string) */
interface CheckpointSerialized {
  id: string
  messageIndex: number
  timestamp: string
  label: string
  messages: ChatMessage[]
  aiMode: string
}

// ─── Constants ───────────────────────────────────────────────────────────────

export const MAX_CHECKPOINTS = 20
const LS_CHECKPOINTS_KEY = 'forje_checkpoints_v2'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function storageKey(sessionId: string): string {
  return `${LS_CHECKPOINTS_KEY}_${sessionId}`
}

function uid(): string {
  return crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2, 11)
}

/** Auto-generate a label from the last user message (first 50 chars). */
function autoLabel(messages: ChatMessage[]): string {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === 'user') {
      const text = messages[i].content.replace(/^\[AUTO-RETRY[^\]]*\]\s*/, '').trim()
      if (text.length > 0) {
        return text.length > 50 ? text.slice(0, 50) + '...' : text
      }
    }
  }
  return `Checkpoint at ${messages.length} messages`
}

// ─── Persistence ─────────────────────────────────────────────────────────────

function loadRaw(sessionId: string): CheckpointSerialized[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(storageKey(sessionId))
    return raw ? (JSON.parse(raw) as CheckpointSerialized[]) : []
  } catch {
    return []
  }
}

function saveRaw(sessionId: string, checkpoints: CheckpointSerialized[]): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(storageKey(sessionId), JSON.stringify(checkpoints))
  } catch { /* quota exceeded */ }
}

function toSerialized(cp: Checkpoint): CheckpointSerialized {
  return {
    ...cp,
    timestamp: cp.timestamp instanceof Date ? cp.timestamp.toISOString() : (cp.timestamp as unknown as string),
    messages: cp.messages.map((m) => ({
      ...m,
      timestamp: m.timestamp instanceof Date ? m.timestamp.toISOString() : m.timestamp,
    })) as unknown as ChatMessage[],
  }
}

function fromSerialized(s: CheckpointSerialized): Checkpoint {
  return {
    ...s,
    timestamp: new Date(s.timestamp),
    messages: s.messages.map((m) => ({
      ...m,
      timestamp: m.timestamp instanceof Date ? m.timestamp : new Date(m.timestamp as unknown as string),
    })),
  }
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Create a checkpoint that snapshots the current conversation state.
 * Auto-prunes to MAX_CHECKPOINTS (oldest removed first).
 */
export function createCheckpoint(
  sessionId: string,
  messages: ChatMessage[],
  aiMode: string,
  label?: string,
): Checkpoint {
  const cp: Checkpoint = {
    id: uid(),
    messageIndex: messages.length,
    timestamp: new Date(),
    label: label || autoLabel(messages),
    messages: messages.map((m) => ({ ...m })), // shallow clone each message
    aiMode,
  }

  const all = loadRaw(sessionId)
  all.push(toSerialized(cp))

  // Auto-prune oldest when exceeding limit
  while (all.length > MAX_CHECKPOINTS) {
    all.shift()
  }

  saveRaw(sessionId, all)
  return cp
}

/**
 * Return the messages array from a checkpoint, ready to restore.
 * Timestamps are re-hydrated to Date objects.
 */
export function restoreCheckpoint(checkpoint: Checkpoint): ChatMessage[] {
  return checkpoint.messages.map((m) => ({
    ...m,
    timestamp: m.timestamp instanceof Date ? m.timestamp : new Date(m.timestamp as unknown as string),
  }))
}

/** Load all checkpoints for a session, sorted oldest-first. */
export function getCheckpoints(sessionId: string): Checkpoint[] {
  return loadRaw(sessionId).map(fromSerialized)
}

/** Delete a single checkpoint by ID. */
export function deleteCheckpoint(checkpointId: string, sessionId: string): void {
  const all = loadRaw(sessionId).filter((c) => c.id !== checkpointId)
  saveRaw(sessionId, all)
}

/** Clear all checkpoints for a session. */
export function clearCheckpoints(sessionId: string): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(storageKey(sessionId))
  } catch { /* ignore */ }
}
