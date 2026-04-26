import 'server-only'

import { db } from '@/lib/db'

export type TeamRole = 'owner' | 'admin' | 'editor' | 'viewer'

const HIERARCHY: TeamRole[] = ['viewer', 'editor', 'admin', 'owner']

export function canBuild(role: TeamRole): boolean {
  return role !== 'viewer'
}
export function canManageMembers(role: TeamRole): boolean {
  return role === 'owner' || role === 'admin'
}
export function canInvite(role: TeamRole): boolean {
  return role !== 'viewer'
}
export function canDeleteTeam(role: TeamRole): boolean {
  return role === 'owner'
}
export function canEditProject(role: TeamRole): boolean {
  return role !== 'viewer'
}
export function canLockZone(role: TeamRole): boolean {
  return role !== 'viewer'
}

export async function getTeamRole(
  teamId: string,
  userId: string,
): Promise<TeamRole | null> {
  const member = await db.teamMember.findUnique({
    where: { teamId_userId: { teamId, userId } },
    select: { role: true },
  })
  if (!member) return null
  return member.role.toLowerCase() as TeamRole
}

export async function requireTeamRole(
  teamId: string,
  userId: string,
  minRole: TeamRole,
): Promise<TeamRole> {
  const role = await getTeamRole(teamId, userId)
  if (!role) throw new Error('Not a team member')
  if (HIERARCHY.indexOf(role) < HIERARCHY.indexOf(minRole)) {
    throw new Error(`Requires ${minRole} role, you are ${role}`)
  }
  return role
}

/**
 * Resolve Clerk userId to internal User.id — throws if not found.
 */
export async function resolveUserId(clerkId: string): Promise<string> {
  const user = await db.user.findUnique({
    where: { clerkId },
    select: { id: true },
  })
  if (!user) throw new Error('User not found')
  return user.id
}

/**
 * Log a team activity.
 */
export async function logTeamActivity(
  teamId: string,
  userId: string | null,
  action: string,
  description: string,
  metadata?: Record<string, unknown>,
) {
  await db.teamActivity.create({
    data: {
      teamId,
      userId,
      action,
      description,
      metadata: metadata ?? undefined,
    },
  })
}
