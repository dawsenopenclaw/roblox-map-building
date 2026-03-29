/**
 * Team Collaboration API
 * POST /api/teams                              — create team
 * GET  /api/teams                              — list user's teams
 * GET  /api/teams/:id                          — get team details
 * POST /api/teams/:id/invite                   — invite member
 * GET  /api/teams/invite/:token                — accept invite
 * PUT  /api/teams/:id/members/:memberId/role   — update member role
 * DELETE /api/teams/:id/members/:memberId      — remove member
 * GET  /api/teams/:id/zones                    — list locked zones
 * POST /api/teams/:id/zones/lock               — lock a zone
 * DELETE /api/teams/:id/zones/:zoneId          — unlock zone
 */

import { Hono } from 'hono'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import { requireAuth } from '../middleware/auth'
import { db } from '../lib/db'
import { notifyTeamInvite } from '../lib/notifications'

export const teamRoutes = new Hono()

teamRoutes.use('*', requireAuth)

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50)
}

async function getDbUser(clerkId: string) {
  return db.user.findUnique({ where: { clerkId } })
}

async function requireTeamMember(teamId: string, userId: string, minRole?: 'OWNER' | 'ADMIN' | 'EDITOR') {
  const member = await db.teamMember.findUnique({
    where: { teamId_userId: { teamId, userId } },
  })
  if (!member) return null

  if (minRole) {
    const hierarchy = { OWNER: 4, ADMIN: 3, EDITOR: 2, VIEWER: 1 }
    if (hierarchy[member.role] < hierarchy[minRole]) return null
  }

  return member
}

// ---------------------------------------------------------------------------
// POST /api/teams — create team
// ---------------------------------------------------------------------------

const createTeamSchema = z.object({
  name: z.string().min(2).max(50),
  description: z.string().max(200).optional(),
})

teamRoutes.post('/', zValidator('json', createTeamSchema), async (c) => {
  const clerkId = c.get('clerkId') as string
  const { name, description } = c.req.valid('json')

  const user = await getDbUser(clerkId)
  if (!user) return c.json({ error: 'User not found' }, 404)

  // Generate unique slug
  let slug = slugify(name)
  const existing = await db.team.findUnique({ where: { slug } })
  if (existing) slug = `${slug}-${Date.now().toString(36)}`

  const team = await db.team.create({
    data: {
      name,
      description,
      slug,
      ownerId: user.id,
      members: {
        create: {
          userId: user.id,
          role: 'OWNER',
        },
      },
    },
    include: { members: true },
  })

  return c.json({ team }, 201)
})

// ---------------------------------------------------------------------------
// GET /api/teams — list user's teams
// ---------------------------------------------------------------------------

teamRoutes.get('/', async (c) => {
  const clerkId = c.get('clerkId') as string
  const user = await getDbUser(clerkId)
  if (!user) return c.json({ error: 'User not found' }, 404)

  const memberships = await db.teamMember.findMany({
    where: { userId: user.id },
    include: {
      team: {
        include: {
          _count: { select: { members: true } },
        },
      },
    },
    orderBy: { joinedAt: 'desc' },
  })

  return c.json({
    teams: memberships.map((m) => ({
      ...m.team,
      memberCount: m.team._count.members,
      myRole: m.role,
    })),
  })
})

// ---------------------------------------------------------------------------
// GET /api/teams/invite/:token — accept invite
// MUST be registered before GET /:id to prevent Hono matching "invite" as :id
// ---------------------------------------------------------------------------

teamRoutes.get('/invite/:token', async (c) => {
  const clerkId = c.get('clerkId') as string
  const token = c.req.param('token')

  const user = await getDbUser(clerkId)
  if (!user) return c.json({ error: 'User not found' }, 404)

  const invite = await db.teamInvite.findUnique({
    where: { token },
    include: { team: true },
  })

  if (!invite) return c.json({ error: 'Invalid invite link' }, 404)
  if (invite.status !== 'PENDING') return c.json({ error: `Invite is ${invite.status.toLowerCase()}` }, 400)
  if (invite.expiresAt < new Date()) {
    await db.teamInvite.update({ where: { id: invite.id }, data: { status: 'EXPIRED' } })
    return c.json({ error: 'Invite has expired' }, 400)
  }

  // Check not already a member
  const existing = await db.teamMember.findUnique({
    where: { teamId_userId: { teamId: invite.teamId, userId: user.id } },
  })
  if (existing) return c.json({ error: 'Already a member of this team' }, 409)

  // Accept invite
  const [, newMember] = await db.$transaction([
    db.teamInvite.update({
      where: { id: invite.id },
      data: { status: 'ACCEPTED', acceptedAt: new Date() },
    }),
    db.teamMember.create({
      data: { teamId: invite.teamId, userId: user.id, role: invite.role },
    }),
    db.teamActivity.create({
      data: {
        teamId: invite.teamId,
        userId: user.id,
        action: 'member_joined',
        description: `${user.displayName || user.email} joined the team`,
      },
    }),
  ])

  return c.json({ message: 'Joined team successfully', member: newMember, team: invite.team })
})

// ---------------------------------------------------------------------------
// GET /api/teams/:id — team details
// ---------------------------------------------------------------------------

teamRoutes.get('/:id', async (c) => {
  const clerkId = c.get('clerkId') as string
  const teamId = c.req.param('id')

  const user = await getDbUser(clerkId)
  if (!user) return c.json({ error: 'User not found' }, 404)

  const member = await requireTeamMember(teamId, user.id)
  if (!member) return c.json({ error: 'Not a member of this team' }, 403)

  const team = await db.team.findUnique({
    where: { id: teamId },
    include: {
      members: {
        orderBy: { joinedAt: 'asc' },
      },
      invites: {
        where: { status: 'PENDING' },
        orderBy: { createdAt: 'desc' },
      },
      activities: {
        orderBy: { createdAt: 'desc' },
        take: 20,
      },
    },
  })

  if (!team) return c.json({ error: 'Team not found' }, 404)

  return c.json({ team, myRole: member.role })
})

// ---------------------------------------------------------------------------
// POST /api/teams/:id/invite — invite member
// ---------------------------------------------------------------------------

const inviteSchema = z.object({
  email: z.string().email().optional(),
  role: z.enum(['ADMIN', 'EDITOR', 'VIEWER']).default('EDITOR'),
})

teamRoutes.post('/:id/invite', zValidator('json', inviteSchema), async (c) => {
  const clerkId = c.get('clerkId') as string
  const teamId = c.req.param('id')
  const { email, role } = c.req.valid('json')

  const user = await getDbUser(clerkId)
  if (!user) return c.json({ error: 'User not found' }, 404)

  const member = await requireTeamMember(teamId, user.id, 'ADMIN')
  if (!member) return c.json({ error: 'Insufficient permissions' }, 403)

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

  const invite = await db.teamInvite.create({
    data: {
      teamId,
      invitedBy: user.id,
      email,
      role,
      expiresAt,
    },
  })

  const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/team/join/${invite.token}`

  // If invitee is an existing user, send in-app notification
  if (email) {
    const invitee = await db.user.findUnique({ where: { email }, select: { id: true } })
    if (invitee) {
      const team = await db.team.findUnique({ where: { id: teamId }, select: { name: true } })
      const inviterUser = await db.user.findUnique({
        where: { id: user.id },
        select: { displayName: true, username: true },
      })
      const inviterName = inviterUser?.displayName ?? inviterUser?.username ?? 'A team member'

      notifyTeamInvite(invitee.id, {
        teamName: team?.name ?? 'a team',
        inviterName,
        inviteToken: invite.token,
        role,
      }).catch(() => {})
    }
  }

  return c.json({ invite, inviteUrl }, 201)
})

// ---------------------------------------------------------------------------
// PUT /api/teams/:id/members/:memberId/role — update role
// ---------------------------------------------------------------------------

const updateRoleSchema = z.object({
  role: z.enum(['ADMIN', 'EDITOR', 'VIEWER']),
})

teamRoutes.put('/:id/members/:memberId/role', zValidator('json', updateRoleSchema), async (c) => {
  const clerkId = c.get('clerkId') as string
  const teamId = c.req.param('id')
  const memberId = c.req.param('memberId')
  const { role } = c.req.valid('json')

  const user = await getDbUser(clerkId)
  if (!user) return c.json({ error: 'User not found' }, 404)

  const requester = await requireTeamMember(teamId, user.id, 'ADMIN')
  if (!requester) return c.json({ error: 'Insufficient permissions' }, 403)

  const targetMember = await db.teamMember.findFirst({
    where: { id: memberId, teamId },
  })
  if (!targetMember) return c.json({ error: 'Member not found' }, 404)

  // Can't change owner role
  if (targetMember.role === 'OWNER') {
    return c.json({ error: 'Cannot change owner role' }, 400)
  }

  // Only owners can touch other admins (promote or demote)
  if ((targetMember.role === 'ADMIN' || role === 'ADMIN') && requester.role !== 'OWNER') {
    return c.json({ error: 'Only owners can assign or remove the admin role' }, 403)
  }

  const updated = await db.teamMember.update({
    where: { id: memberId },
    data: { role },
  })

  await db.teamActivity.create({
    data: {
      teamId,
      userId: user.id,
      action: 'role_changed',
      description: `Role updated to ${role}`,
      metadata: { memberId, newRole: role },
    },
  })

  return c.json({ member: updated })
})

// ---------------------------------------------------------------------------
// DELETE /api/teams/:id/members/:memberId — remove member
// ---------------------------------------------------------------------------

teamRoutes.delete('/:id/members/:memberId', async (c) => {
  const clerkId = c.get('clerkId') as string
  const teamId = c.req.param('id')
  const memberId = c.req.param('memberId')

  const user = await getDbUser(clerkId)
  if (!user) return c.json({ error: 'User not found' }, 404)

  const requester = await requireTeamMember(teamId, user.id, 'ADMIN')
  if (!requester) return c.json({ error: 'Insufficient permissions' }, 403)

  const targetMember = await db.teamMember.findFirst({
    where: { id: memberId, teamId },
  })
  if (!targetMember) return c.json({ error: 'Member not found' }, 404)
  if (targetMember.role === 'OWNER') return c.json({ error: 'Cannot remove owner' }, 400)

  await db.teamMember.delete({ where: { id: memberId } })

  return c.json({ message: 'Member removed' })
})

// ---------------------------------------------------------------------------
// GET /api/teams/:id/zones — list locked zones
// ---------------------------------------------------------------------------

teamRoutes.get('/:id/zones', async (c) => {
  const clerkId = c.get('clerkId') as string
  const teamId = c.req.param('id')

  const user = await getDbUser(clerkId)
  if (!user) return c.json({ error: 'User not found' }, 404)

  const member = await requireTeamMember(teamId, user.id)
  if (!member) return c.json({ error: 'Not a member' }, 403)

  // Auto-expire stale locks
  await db.zoneLock.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  })

  const locks = await db.zoneLock.findMany({
    where: { member: { teamId } },
    include: { member: true },
  })

  return c.json({ zones: locks })
})

// ---------------------------------------------------------------------------
// POST /api/teams/:id/zones/lock — lock a zone
// ---------------------------------------------------------------------------

const lockZoneSchema = z.object({
  zoneId: z.string(),
  zoneName: z.string().optional(),
  durationMinutes: z.number().min(1).max(480).default(30),
})

teamRoutes.post('/:id/zones/lock', zValidator('json', lockZoneSchema), async (c) => {
  const clerkId = c.get('clerkId') as string
  const teamId = c.req.param('id')
  const { zoneId, zoneName, durationMinutes } = c.req.valid('json')

  const user = await getDbUser(clerkId)
  if (!user) return c.json({ error: 'User not found' }, 404)

  const member = await requireTeamMember(teamId, user.id, 'EDITOR')
  if (!member) return c.json({ error: 'Insufficient permissions' }, 403)

  const expiresAt = new Date(Date.now() + durationMinutes * 60 * 1000)
  const now = new Date()

  // Check for an active lock held by a different member
  const existingLock = await db.zoneLock.findUnique({ where: { zoneId } })
  if (existingLock && existingLock.expiresAt > now && existingLock.teamMemberId !== member.id) {
    return c.json({ error: 'Zone already locked by another member' }, 409)
  }

  // Upsert: re-lock own zone or claim an expired lock
  const lock = await db.zoneLock.upsert({
    where: { zoneId },
    update: { teamMemberId: member.id, zoneName, expiresAt },
    create: { teamMemberId: member.id, zoneId, zoneName, expiresAt },
  })
  return c.json({ lock }, 201)
})

// ---------------------------------------------------------------------------
// DELETE /api/teams/:id/zones/:zoneId — unlock zone
// ---------------------------------------------------------------------------

teamRoutes.delete('/:id/zones/:zoneId', async (c) => {
  const clerkId = c.get('clerkId') as string
  const teamId = c.req.param('id')
  const zoneId = c.req.param('zoneId')

  const user = await getDbUser(clerkId)
  if (!user) return c.json({ error: 'User not found' }, 404)

  const member = await requireTeamMember(teamId, user.id)
  if (!member) return c.json({ error: 'Not a member' }, 403)

  const lock = await db.zoneLock.findUnique({ where: { zoneId } })
  if (!lock) return c.json({ error: 'Zone not locked' }, 404)

  // Only the locking member or admins can unlock
  if (lock.teamMemberId !== member.id) {
    const isAdmin = await requireTeamMember(teamId, user.id, 'ADMIN')
    if (!isAdmin) return c.json({ error: 'Can only unlock your own zones' }, 403)
  }

  await db.zoneLock.delete({ where: { zoneId } })
  return c.json({ message: 'Zone unlocked' })
})
