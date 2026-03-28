/**
 * Project Version History API
 * GET  /api/projects/:id/versions           — list versions
 * POST /api/projects/:id/versions           — create version snapshot
 * GET  /api/projects/:id/versions/:versionId — get single version
 * GET  /api/projects/:id/versions/diff      — diff two versions
 * POST /api/projects/:id/rollback           — rollback to version
 */

import { Hono } from 'hono'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import { requireAuth } from '../middleware/auth'
import { db } from '../lib/db'

export const versionRoutes = new Hono()

versionRoutes.use('*', requireAuth)

async function getDbUser(clerkId: string) {
  return db.user.findUnique({ where: { clerkId } })
}

// Verify user has access to a project's team
async function requireProjectAccess(projectId: string, userId: string, minRole?: 'OWNER' | 'ADMIN' | 'EDITOR') {
  // Find the latest version to get teamId
  const version = await db.projectVersion.findFirst({
    where: { projectId },
    orderBy: { version: 'desc' },
  })
  if (!version) return null

  const member = await db.teamMember.findUnique({
    where: { teamId_userId: { teamId: version.teamId, userId } },
  })
  if (!member) return null

  if (minRole) {
    const hierarchy = { OWNER: 4, ADMIN: 3, EDITOR: 2, VIEWER: 1 }
    if (hierarchy[member.role] < hierarchy[minRole]) return null
  }

  return { member, teamId: version.teamId }
}

// ---------------------------------------------------------------------------
// GET /api/projects/:id/versions
// ---------------------------------------------------------------------------

versionRoutes.get('/:id/versions', async (c) => {
  const clerkId = c.get('clerkId') as string
  const projectId = c.req.param('id')

  const user = await getDbUser(clerkId)
  if (!user) return c.json({ error: 'User not found' }, 404)

  const access = await requireProjectAccess(projectId, user.id)
  if (!access) return c.json({ error: 'Access denied' }, 403)

  const versions = await db.projectVersion.findMany({
    where: { projectId },
    orderBy: { version: 'desc' },
    select: {
      id: true,
      projectId: true,
      userId: true,
      version: true,
      message: true,
      createdAt: true,
    },
  })

  return c.json({ versions })
})

// ---------------------------------------------------------------------------
// POST /api/projects/:id/versions — create snapshot
// ---------------------------------------------------------------------------

const createVersionSchema = z.object({
  teamId: z.string(),
  message: z.string().max(200).optional(),
  snapshot: z.record(z.unknown()),
})

versionRoutes.post('/:id/versions', zValidator('json', createVersionSchema), async (c) => {
  const clerkId = c.get('clerkId') as string
  const projectId = c.req.param('id')
  const { teamId, message, snapshot } = c.req.valid('json')

  const user = await getDbUser(clerkId)
  if (!user) return c.json({ error: 'User not found' }, 404)

  // Verify team membership
  const member = await db.teamMember.findUnique({
    where: { teamId_userId: { teamId, userId: user.id } },
  })
  if (!member) return c.json({ error: 'Not a member of this team' }, 403)
  if (member.role === 'VIEWER') return c.json({ error: 'Viewers cannot create versions' }, 403)

  // Get current max version for this project
  const latest = await db.projectVersion.findFirst({
    where: { projectId },
    orderBy: { version: 'desc' },
  })
  const nextVersion = (latest?.version ?? 0) + 1

  const version = await db.projectVersion.create({
    data: {
      teamId,
      projectId,
      userId: user.id,
      version: nextVersion,
      message,
      snapshot,
    },
  })

  // Record activity
  await db.teamActivity.create({
    data: {
      teamId,
      userId: user.id,
      action: 'version_created',
      description: message || `Version ${nextVersion} saved`,
      metadata: { projectId, versionId: version.id, version: nextVersion },
    },
  })

  return c.json({ version }, 201)
})

// ---------------------------------------------------------------------------
// GET /api/projects/:id/versions/:versionId — single version
// ---------------------------------------------------------------------------

versionRoutes.get('/:id/versions/:versionId', async (c) => {
  const clerkId = c.get('clerkId') as string
  const projectId = c.req.param('id')
  const versionId = c.req.param('versionId')

  const user = await getDbUser(clerkId)
  if (!user) return c.json({ error: 'User not found' }, 404)

  const access = await requireProjectAccess(projectId, user.id)
  if (!access) return c.json({ error: 'Access denied' }, 403)

  const version = await db.projectVersion.findFirst({
    where: { id: versionId, projectId },
  })
  if (!version) return c.json({ error: 'Version not found' }, 404)

  return c.json({ version })
})

// ---------------------------------------------------------------------------
// GET /api/projects/:id/diff?from=:versionId&to=:versionId
// ---------------------------------------------------------------------------

const diffQuerySchema = z.object({
  from: z.string(),
  to: z.string(),
})

versionRoutes.get('/:id/diff', zValidator('query', diffQuerySchema), async (c) => {
  const clerkId = c.get('clerkId') as string
  const projectId = c.req.param('id')
  const { from: fromId, to: toId } = c.req.valid('query')

  const user = await getDbUser(clerkId)
  if (!user) return c.json({ error: 'User not found' }, 404)

  const access = await requireProjectAccess(projectId, user.id)
  if (!access) return c.json({ error: 'Access denied' }, 403)

  // Check cached diff
  const cachedDiff = await db.versionDiff.findFirst({
    where: { fromVersionId: fromId, toVersionId: toId },
  })
  if (cachedDiff) return c.json({ diff: cachedDiff })

  const [fromVersion, toVersion] = await Promise.all([
    db.projectVersion.findFirst({ where: { id: fromId, projectId } }),
    db.projectVersion.findFirst({ where: { id: toId, projectId } }),
  ])

  if (!fromVersion || !toVersion) return c.json({ error: 'Version not found' }, 404)

  // Compute simple diff
  const diff = computeDiff(
    fromVersion.snapshot as Record<string, unknown>,
    toVersion.snapshot as Record<string, unknown>
  )

  const savedDiff = await db.versionDiff.create({
    data: {
      fromVersionId: fromId,
      toVersionId: toId,
      diff,
      summary: `${diff.added.length} added, ${diff.modified.length} modified, ${diff.removed.length} removed`,
    },
  })

  return c.json({ diff: savedDiff })
})

function computeDiff(
  fromSnap: Record<string, unknown>,
  toSnap: Record<string, unknown>
): { added: string[]; modified: string[]; removed: string[]; changes: Record<string, { from: unknown; to: unknown }> } {
  const fromKeys = new Set(Object.keys(fromSnap))
  const toKeys = new Set(Object.keys(toSnap))

  const added = [...toKeys].filter((k) => !fromKeys.has(k))
  const removed = [...fromKeys].filter((k) => !toKeys.has(k))
  const modified: string[] = []
  const changes: Record<string, { from: unknown; to: unknown }> = {}

  for (const key of fromKeys) {
    if (toKeys.has(key)) {
      const fromVal = JSON.stringify(fromSnap[key])
      const toVal = JSON.stringify(toSnap[key])
      if (fromVal !== toVal) {
        modified.push(key)
        changes[key] = { from: fromSnap[key], to: toSnap[key] }
      }
    }
  }

  return { added, modified, removed, changes }
}

// ---------------------------------------------------------------------------
// POST /api/projects/:id/rollback — rollback to version
// ---------------------------------------------------------------------------

const rollbackSchema = z.object({
  versionId: z.string(),
  message: z.string().max(200).optional(),
})

versionRoutes.post('/:id/rollback', zValidator('json', rollbackSchema), async (c) => {
  const clerkId = c.get('clerkId') as string
  const projectId = c.req.param('id')
  const { versionId, message } = c.req.valid('json')

  const user = await getDbUser(clerkId)
  if (!user) return c.json({ error: 'User not found' }, 404)

  const access = await requireProjectAccess(projectId, user.id, 'EDITOR')
  if (!access) return c.json({ error: 'Access denied or insufficient permissions' }, 403)

  const targetVersion = await db.projectVersion.findFirst({
    where: { id: versionId, projectId },
  })
  if (!targetVersion) return c.json({ error: 'Version not found' }, 404)

  // Get current max version
  const latest = await db.projectVersion.findFirst({
    where: { projectId },
    orderBy: { version: 'desc' },
  })
  const nextVersion = (latest?.version ?? 0) + 1

  // Create new version with old snapshot
  const rollbackVersion = await db.projectVersion.create({
    data: {
      teamId: access.teamId,
      projectId,
      userId: user.id,
      version: nextVersion,
      message: message || `Rolled back to v${targetVersion.version}`,
      snapshot: targetVersion.snapshot as Record<string, unknown>,
    },
  })

  await db.teamActivity.create({
    data: {
      teamId: access.teamId,
      userId: user.id,
      action: 'version_rollback',
      description: `Rolled back to v${targetVersion.version}`,
      metadata: { projectId, fromVersion: latest?.version, toVersion: targetVersion.version },
    },
  })

  return c.json({
    message: `Rolled back to v${targetVersion.version}`,
    newVersion: rollbackVersion,
  })
})
