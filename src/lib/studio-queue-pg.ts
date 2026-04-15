/**
 * Postgres-backed studio session & command queue.
 *
 * Replaces Redis for the critical Studio pipeline:
 *   - Session heartbeats (cross-Lambda discovery)
 *   - Command queue (RPUSH/LRANGE/DEL equivalent)
 *   - Command results (execution confirmation)
 *
 * Uses raw SQL via Prisma.$queryRawUnsafe for performance.
 * No request limits (unlike Upstash free tier's 500K/month).
 *
 * Tables are auto-created on first use (no migration needed).
 */

import { getDb } from './db'

// ── Auto-create tables ──────────────────────────────────────────────────────

let _tablesCreated = false

async function ensureTables(): Promise<void> {
  if (_tablesCreated) return
  const db = getDb()
  try {
    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS studio_session (
        session_id TEXT PRIMARY KEY,
        place_id TEXT NOT NULL DEFAULT 'unknown',
        place_name TEXT NOT NULL DEFAULT 'Studio',
        plugin_version TEXT NOT NULL DEFAULT '4.7.0',
        auth_token TEXT NOT NULL DEFAULT '',
        connected BOOLEAN NOT NULL DEFAULT true,
        last_heartbeat BIGINT NOT NULL DEFAULT 0,
        camera JSONB,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `)
    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS studio_command_queue (
        id BIGSERIAL PRIMARY KEY,
        session_id TEXT NOT NULL,
        command_id TEXT NOT NULL,
        command_type TEXT NOT NULL DEFAULT 'execute_luau',
        data JSONB NOT NULL DEFAULT '{}',
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `)
    await db.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS idx_cmd_queue_session ON studio_command_queue(session_id)
    `)
    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS studio_command_result (
        command_id TEXT PRIMARY KEY,
        success BOOLEAN NOT NULL DEFAULT false,
        parts_created INT NOT NULL DEFAULT 0,
        parts_failed INT NOT NULL DEFAULT 0,
        total_commands INT NOT NULL DEFAULT 0,
        error TEXT,
        method TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `)
    _tablesCreated = true
  } catch (err) {
    console.error('[studio-queue-pg] Failed to create tables:', err instanceof Error ? err.message : err)
  }
}

// ── Session operations ──────────────────────────────────────────────────────

export interface PgSession {
  sessionId: string
  placeId: string
  placeName: string
  pluginVersion: string
  connected: boolean
  lastHeartbeat: number
  camera?: Record<string, unknown>
}

export async function pgUpsertSession(opts: {
  sessionId: string
  placeId?: string
  placeName?: string
  pluginVersion?: string
  authToken?: string
}): Promise<void> {
  await ensureTables()
  const db = getDb()
  const now = Date.now()
  await db.$executeRawUnsafe(
    `INSERT INTO studio_session (session_id, place_id, place_name, plugin_version, auth_token, connected, last_heartbeat, updated_at)
     VALUES ($1, $2, $3, $4, $5, true, $6, now())
     ON CONFLICT (session_id) DO UPDATE SET
       connected = true,
       last_heartbeat = $6,
       updated_at = now(),
       place_id = COALESCE(NULLIF($2, 'unknown'), studio_session.place_id),
       place_name = COALESCE(NULLIF($3, 'Studio'), studio_session.place_name),
       plugin_version = COALESCE(NULLIF($4, '4.7.0'), studio_session.plugin_version)`,
    opts.sessionId,
    opts.placeId ?? 'unknown',
    opts.placeName ?? 'Studio',
    opts.pluginVersion ?? '4.7.0',
    opts.authToken ?? '',
    now,
  )
}

export async function pgTouchHeartbeat(sessionId: string): Promise<void> {
  await ensureTables()
  const db = getDb()
  const now = Date.now()
  await db.$executeRawUnsafe(
    `UPDATE studio_session SET last_heartbeat = $1, connected = true, updated_at = now() WHERE session_id = $2`,
    now, sessionId,
  )
}

export async function pgGetSession(sessionId: string): Promise<PgSession | null> {
  await ensureTables()
  const db = getDb()
  const rows = await db.$queryRawUnsafe<Array<{
    session_id: string; place_id: string; place_name: string;
    plugin_version: string; connected: boolean; last_heartbeat: bigint;
    camera: Record<string, unknown> | null;
  }>>(
    `SELECT session_id, place_id, place_name, plugin_version, connected, last_heartbeat, camera
     FROM studio_session WHERE session_id = $1`,
    sessionId,
  )
  if (rows.length === 0) return null
  const r = rows[0]
  return {
    sessionId: r.session_id,
    placeId: r.place_id,
    placeName: r.place_name,
    pluginVersion: r.plugin_version,
    connected: r.connected,
    lastHeartbeat: Number(r.last_heartbeat),
    camera: r.camera ?? undefined,
  }
}

export async function pgUpdateCamera(sessionId: string, camera: Record<string, unknown>): Promise<void> {
  await ensureTables()
  const db = getDb()
  await db.$executeRawUnsafe(
    `UPDATE studio_session SET camera = $1::jsonb, updated_at = now() WHERE session_id = $2`,
    JSON.stringify(camera), sessionId,
  )
}

// ── Command queue operations ────────────────────────────────────────────────

export async function pgQueueCommand(
  sessionId: string,
  commandId: string,
  commandType: string,
  data: Record<string, unknown>,
): Promise<boolean> {
  await ensureTables()
  const db = getDb()
  try {
    await db.$executeRawUnsafe(
      `INSERT INTO studio_command_queue (session_id, command_id, command_type, data) VALUES ($1, $2, $3, $4::jsonb)`,
      sessionId, commandId, commandType, JSON.stringify(data),
    )
    return true
  } catch {
    return false
  }
}

export async function pgDrainCommands(sessionId: string): Promise<Array<{
  id: string; type: string; data: Record<string, unknown>; timestamp: number
}>> {
  await ensureTables()
  const db = getDb()
  // Atomic drain: SELECT then DELETE in one query using CTE
  const rows = await db.$queryRawUnsafe<Array<{
    command_id: string; command_type: string; data: unknown; created_at: Date
  }>>(
    `WITH drained AS (
       DELETE FROM studio_command_queue WHERE session_id = $1
       RETURNING command_id, command_type, data, created_at
     ) SELECT * FROM drained ORDER BY id`,
    sessionId,
  )
  return rows.map(r => ({
    id: r.command_id,
    type: r.command_type,
    data: (typeof r.data === 'string' ? JSON.parse(r.data) : r.data) as Record<string, unknown>,
    timestamp: new Date(r.created_at).getTime(),
  }))
}

// ── Command result operations ───────────────────────────────────────────────

export interface PgCommandResult {
  success: boolean
  partsCreated: number
  partsFailed: number
  totalCommands: number
  error?: string
  method?: string
}

export async function pgStoreCommandResult(commandId: string, result: PgCommandResult): Promise<void> {
  await ensureTables()
  const db = getDb()
  await db.$executeRawUnsafe(
    `INSERT INTO studio_command_result (command_id, success, parts_created, parts_failed, total_commands, error, method)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (command_id) DO UPDATE SET success = $2, parts_created = $3, parts_failed = $4, total_commands = $5, error = $6, method = $7`,
    commandId, result.success, result.partsCreated, result.partsFailed, result.totalCommands,
    result.error ?? null, result.method ?? null,
  )
}

export async function pgGetCommandResult(commandId: string): Promise<PgCommandResult | null> {
  await ensureTables()
  const db = getDb()
  const rows = await db.$queryRawUnsafe<Array<{
    success: boolean; parts_created: number; parts_failed: number;
    total_commands: number; error: string | null; method: string | null
  }>>(
    `SELECT success, parts_created, parts_failed, total_commands, error, method
     FROM studio_command_result WHERE command_id = $1`,
    commandId,
  )
  if (rows.length === 0) return null
  const r = rows[0]
  return {
    success: r.success,
    partsCreated: r.parts_created,
    partsFailed: r.parts_failed,
    totalCommands: r.total_commands,
    error: r.error ?? undefined,
    method: r.method ?? undefined,
  }
}

// ── Cleanup ─────────────────────────────────────────────────────────────────

export async function pgCleanupStale(): Promise<void> {
  await ensureTables()
  const db = getDb()
  const fiveMinAgo = Date.now() - 300_000
  // Mark stale sessions as disconnected
  await db.$executeRawUnsafe(
    `UPDATE studio_session SET connected = false WHERE last_heartbeat < $1 AND connected = true`,
    fiveMinAgo,
  )
  // Delete old command results (older than 5 minutes)
  await db.$executeRawUnsafe(
    `DELETE FROM studio_command_result WHERE created_at < now() - interval '5 minutes'`,
  )
  // Delete orphaned commands (older than 5 minutes)
  await db.$executeRawUnsafe(
    `DELETE FROM studio_command_queue WHERE created_at < now() - interval '5 minutes'`,
  )
}
