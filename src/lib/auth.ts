import { auth } from '@clerk/nextjs/server'

export async function getClerkUserId(): Promise<string | null> {
  const { userId } = await auth()
  return userId
}

export function isUnder13(dateOfBirth: Date): boolean {
  const today = new Date()
  const thirteenYearsAgo = new Date(Date.UTC(
    today.getUTCFullYear() - 13, today.getUTCMonth(), today.getUTCDate()
  ))
  const dobUTC = new Date(Date.UTC(
    dateOfBirth.getUTCFullYear(), dateOfBirth.getUTCMonth(), dateOfBirth.getUTCDate()
  ))
  return dobUTC > thirteenYearsAgo
}
