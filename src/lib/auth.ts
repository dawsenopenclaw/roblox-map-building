import { auth } from '@clerk/nextjs/server'

export async function getClerkUserId(): Promise<string | null> {
  const { userId } = await auth()
  return userId
}

export function isUnder13(dateOfBirth: Date): boolean {
  const today = new Date()
  const thirteenYearsAgo = new Date(
    today.getFullYear() - 13,
    today.getMonth(),
    today.getDate()
  )
  const dobDateOnly = new Date(
    dateOfBirth.getFullYear(),
    dateOfBirth.getMonth(),
    dateOfBirth.getDate()
  )
  return dobDateOnly >= thirteenYearsAgo
}
