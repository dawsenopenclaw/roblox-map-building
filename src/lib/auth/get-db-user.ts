/**
 * Resolve the current Clerk session into the internal database User row.
 *
 * Many tables (Subscription, TokenBalance, Project, etc.) reference
 * `User.id` (a cuid) — NOT `User.clerkId` (the Clerk session ID like
 * `user_2abc...`). Code that passes the Clerk session ID directly to
 * `spendTokens()`, Prisma writes, etc. will fail at runtime with
 * "user not found" or foreign-key errors.
 *
 * This helper is the single source of truth for the resolution. Use it at
 * the top of every authenticated API route that needs to do anything with
 * the database beyond reading the Clerk identity.
 *
 * @example
 *   import { getDbUserOrUnauthorized } from '@/lib/auth/get-db-user'
 *
 *   export async function POST(req: NextRequest) {
 *     const result = await getDbUserOrUnauthorized()
 *     if ('response' in result) return result.response
 *     const { user, clerkId } = result
 *     // Now use user.id (the cuid) — never the clerkId — for spendTokens
 *     await spendTokens(user.id, 100, 'chat')
 *   }
 */
import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

import { db } from '@/lib/db'

export interface DbUserResolution {
  /** The internal database User row (id is the cuid, NOT the clerkId). */
  user: { id: string; clerkId: string }
  /** The raw Clerk session id, in case the caller needs it for Clerk APIs. */
  clerkId: string
}

export interface DbUserUnauthorized {
  response: NextResponse
}

/**
 * Resolve the current Clerk session into a `{ user, clerkId }` pair.
 *
 * Returns either the resolved row or a `{ response }` shape that the caller
 * should immediately `return` from the route handler. This pattern keeps the
 * happy-path code free of nested ifs while still forcing the caller to handle
 * the unauthenticated / not-yet-synced cases explicitly.
 *
 * Failure modes:
 * - No Clerk session     → 401 Unauthorized
 * - Clerk session but no DB row yet (webhook not yet delivered) → 404
 *   "Account not synced". The Clerk webhook is the source of truth for
 *   creating the DB row; if this fires it usually means the webhook is
 *   delayed or the env var `CLERK_WEBHOOK_SECRET` is missing in production.
 */
export async function getDbUserOrUnauthorized(): Promise<DbUserResolution | DbUserUnauthorized> {
  const { userId: clerkId } = await auth()
  if (!clerkId) {
    return {
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    }
  }

  const user = await db.user.findUnique({
    where: { clerkId },
    select: { id: true, clerkId: true },
  })

  if (!user) {
    return {
      response: NextResponse.json(
        {
          error: 'Account not synced. The Clerk webhook may be delayed — please retry in a moment.',
        },
        { status: 404 },
      ),
    }
  }

  return { user, clerkId }
}

/**
 * Throwing variant for places that already wrap their handler in a try/catch
 * that maps thrown errors to HTTP responses (e.g. WebSocket message handlers
 * that don't return a NextResponse). Prefer `getDbUserOrUnauthorized` in
 * REST handlers.
 */
export async function getDbUserOrThrow(): Promise<DbUserResolution> {
  const { userId: clerkId } = await auth()
  if (!clerkId) {
    const err = new Error('Unauthorized') as Error & { status: number }
    err.status = 401
    throw err
  }

  const user = await db.user.findUnique({
    where: { clerkId },
    select: { id: true, clerkId: true },
  })

  if (!user) {
    const err = new Error('Account not synced — please retry') as Error & { status: number }
    err.status = 404
    throw err
  }

  return { user, clerkId }
}
