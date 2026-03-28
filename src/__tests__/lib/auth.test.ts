import { describe, it, expect, vi } from 'vitest'

// Mock Clerk before importing auth
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn().mockResolvedValue({ userId: 'user_clerk_123' }),
}))

import { isUnder13, getClerkUserId } from '@/lib/auth'
import { generateConsentToken, hashToken } from '@/lib/tokens'

describe('isUnder13', () => {
  it('returns true for a child born less than 13 years ago', () => {
    const elevenYearsAgo = new Date()
    elevenYearsAgo.setFullYear(elevenYearsAgo.getFullYear() - 11)
    expect(isUnder13(elevenYearsAgo)).toBe(true)
  })

  it('returns true for someone born exactly 12 years ago today', () => {
    const twelveYearsAgo = new Date()
    twelveYearsAgo.setFullYear(twelveYearsAgo.getFullYear() - 12)
    // Born today, 12 years ago — still under 13
    expect(isUnder13(twelveYearsAgo)).toBe(true)
  })

  it('returns false for someone who just turned 13 today', () => {
    const thirteenYearsAgo = new Date()
    thirteenYearsAgo.setFullYear(thirteenYearsAgo.getFullYear() - 13)
    // Born exactly 13 years ago today — NOT under 13
    expect(isUnder13(thirteenYearsAgo)).toBe(false)
  })

  it('returns false for a 25-year-old adult', () => {
    const twentyFiveYearsAgo = new Date()
    twentyFiveYearsAgo.setFullYear(twentyFiveYearsAgo.getFullYear() - 25)
    expect(isUnder13(twentyFiveYearsAgo)).toBe(false)
  })

  it('returns false for someone born 13 years and 1 day ago', () => {
    const moreThan13YearsAgo = new Date()
    moreThan13YearsAgo.setFullYear(moreThan13YearsAgo.getFullYear() - 13)
    moreThan13YearsAgo.setDate(moreThan13YearsAgo.getDate() - 1)
    expect(isUnder13(moreThan13YearsAgo)).toBe(false)
  })

  it('boundary: born one day before the 13-year cutoff → still under 13', () => {
    const almostThirteen = new Date()
    almostThirteen.setFullYear(almostThirteen.getFullYear() - 13)
    almostThirteen.setDate(almostThirteen.getDate() + 1)
    expect(isUnder13(almostThirteen)).toBe(true)
  })
})

describe('generateConsentToken', () => {
  it('generates a token and expiry', () => {
    const { token, expires } = generateConsentToken()

    expect(typeof token).toBe('string')
    expect(token.length).toBe(64) // 32 bytes hex = 64 chars
    expect(expires).toBeInstanceOf(Date)
  })

  it('expiry is approximately 48 hours from now', () => {
    const before = Date.now()
    const { expires } = generateConsentToken()
    const after = Date.now()

    const expectedMs = 48 * 60 * 60 * 1000
    const expiresMs = expires.getTime()

    expect(expiresMs).toBeGreaterThanOrEqual(before + expectedMs - 1000)
    expect(expiresMs).toBeLessThanOrEqual(after + expectedMs + 1000)
  })

  it('generates unique tokens on each call', () => {
    const { token: t1 } = generateConsentToken()
    const { token: t2 } = generateConsentToken()
    const { token: t3 } = generateConsentToken()

    expect(t1).not.toBe(t2)
    expect(t2).not.toBe(t3)
    expect(t1).not.toBe(t3)
  })
})

describe('hashToken', () => {
  it('produces a consistent SHA-256 hex digest', () => {
    const token = 'abc123testtoken'
    const hash1 = hashToken(token)
    const hash2 = hashToken(token)

    expect(hash1).toBe(hash2)
    expect(hash1).toMatch(/^[a-f0-9]{64}$/)
  })

  it('different tokens produce different hashes', () => {
    const h1 = hashToken('token_one')
    const h2 = hashToken('token_two')

    expect(h1).not.toBe(h2)
  })

  it('hashing is one-way — hashed value differs from original', () => {
    const original = 'my_secret_token'
    const hashed = hashToken(original)

    expect(hashed).not.toBe(original)
    expect(hashed.length).toBe(64)
  })
})

describe('Age gate routing logic', () => {
  it('user under 13 requires parental consent flow', () => {
    const dob = new Date()
    dob.setFullYear(dob.getFullYear() - 9)
    const requiresConsent = isUnder13(dob)
    expect(requiresConsent).toBe(true)
  })

  it('user 13+ proceeds to standard onboarding', () => {
    const dob = new Date()
    dob.setFullYear(dob.getFullYear() - 16)
    const requiresConsent = isUnder13(dob)
    expect(requiresConsent).toBe(false)
  })
})

describe('getClerkUserId', () => {
  it('returns the Clerk user ID from auth()', async () => {
    const userId = await getClerkUserId()
    expect(userId).toBe('user_clerk_123')
  })
})
