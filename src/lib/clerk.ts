import { auth } from '@clerk/nextjs/server'
import { db } from './db'

export async function getAuthUser() {
  const { userId } = await auth()
  if (!userId) return null
  return db.user.findUnique({
    where: { clerkId: userId },
    include: { subscription: true, tokenBalance: true },
  })
}

export async function requireAuthUser() {
  const user = await getAuthUser()
  if (!user) throw new Error('Unauthorized')
  return user
}
