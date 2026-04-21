// ─── Referral Code Generation ─────────────────────────────────────────────────
// Standalone utility for generating user-facing referral codes.
// For the full referral system (chains, commissions, milestones), see lib/growth/referral.ts.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generate a short, human-readable referral code (6 chars).
 * Excludes I/O/0/1 to prevent visual ambiguity.
 */
export function generateReferralCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // No I/O/0/1 to avoid confusion
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

/** Bonus credits granted to both referrer and referee on a successful referral. */
export const REFERRAL_BONUS_CREDITS = 500

/** Build the full referral link from a code. */
export function buildReferralUrl(code: string): string {
  return `https://forjegames.com/sign-up?ref=${code}`
}
