import 'server-only'
import { Resend } from 'resend'
import { serverEnv, clientEnv } from './env'
import {
  WelcomeEmail,
  BuildCompleteEmail,
  TokenLowEmail,
  SaleNotificationEmail,
  WeeklyDigestEmail,
  ParentalConsentEmail,
  CharityUpdateEmail,
  ReEngagementEmail,
  DunningEmail,
  TrialEndingEmail,
  PaymentActionRequiredEmail,
} from './email-templates'

// ─── Email configuration guard ────────────────────────────────────────────────

const PLACEHOLDER_PATTERNS = [
  'placeholder',
  're_placeholder',
  'add_real_key',
  'your_key_here',
  'xxxxx',
]

function isEmailConfigured(): boolean {
  const key = serverEnv.RESEND_API_KEY
  if (!key || key.trim() === '') return false
  const lower = key.toLowerCase()
  return !PLACEHOLDER_PATTERNS.some((p) => lower.includes(p))
}

export type EmailResult =
  | { success: true; id?: string }
  | { success: false; reason: 'email_not_configured' | 'send_failed'; error?: unknown }

let _resend: Resend | null = null
function getResend(): Resend {
  if (!_resend) {
    _resend = new Resend(serverEnv.RESEND_API_KEY || '')
  }
  return _resend
}

/**
 * Guard wrapper — call before every Resend send().
 * Returns `{ success: false, reason: 'email_not_configured' }` instead of
 * crashing when RESEND_API_KEY is missing or still a placeholder value.
 */
function guardedSend(fn: () => Promise<unknown>): Promise<EmailResult> {
  if (!isEmailConfigured()) {
    console.warn(
      '[email] RESEND_API_KEY is not configured — skipping email send. ' +
        'Set RESEND_API_KEY in your .env.local to enable email delivery.'
    )
    return Promise.resolve({ success: false, reason: 'email_not_configured' })
  }
  return fn()
    .then(() => ({ success: true }) as EmailResult)
    .catch((error: unknown) => {
      console.error('[email] Send failed:', error)
      return { success: false, reason: 'send_failed', error } as EmailResult
    })
}

const FROM = 'ForjeGames <noreply@forjegames.com>'
const appUrl = clientEnv.NEXT_PUBLIC_APP_URL

// ─── Parental Consent ─────────────────────────────────────────────────────────

export async function sendParentalConsentEmail({
  parentEmail,
  childName,
  token,
}: {
  parentEmail: string
  childName: string
  token: string
}): Promise<EmailResult> {
  const approveUrl = `${appUrl}/api/onboarding/parental-consent/verify?token=${token}&action=approve`
  const denyUrl = `${appUrl}/api/onboarding/parental-consent/verify?token=${token}&action=deny`

  return guardedSend(() =>
    getResend().emails.send({
      from: FROM,
      to: parentEmail,
      subject: `Parental consent required for ${childName}'s ForjeGames account`,
      react: ParentalConsentEmail({ childName, parentEmail, approveUrl, denyUrl }),
    })
  )
}

// ─── Welcome ──────────────────────────────────────────────────────────────────

export async function sendWelcomeEmail({
  email,
  name,
}: {
  email: string
  name: string
}): Promise<EmailResult> {
  return guardedSend(() =>
    getResend().emails.send({
      from: FROM,
      to: email,
      subject: `Welcome to ForjeGames, ${name}! Here are 1,000 free tokens`,
      react: WelcomeEmail({ name }),
    })
  )
}

// ─── Build Complete ───────────────────────────────────────────────────────────

export async function sendBuildCompleteEmail({
  email,
  buildType,
  buildName,
  buildId,
  thumbnailUrl,
}: {
  email: string
  buildType: string
  buildName: string
  buildId: string
  thumbnailUrl?: string
}): Promise<EmailResult> {
  return guardedSend(() =>
    getResend().emails.send({
      from: FROM,
      to: email,
      subject: `Your ${buildType} "${buildName}" is ready!`,
      react: BuildCompleteEmail({ buildType, buildName, buildId, thumbnailUrl }),
    })
  )
}

// ─── Token Low ────────────────────────────────────────────────────────────────

export async function sendTokenLowEmail({
  email,
  name,
  tokenCount,
}: {
  email: string
  name: string
  tokenCount: number
}): Promise<EmailResult> {
  const isVeryLow = tokenCount <= 5
  return guardedSend(() =>
    getResend().emails.send({
      from: FROM,
      to: email,
      subject: isVeryLow
        ? `Only ${tokenCount} tokens left — top up now`
        : `You have ${tokenCount} tokens remaining on ForjeGames`,
      react: TokenLowEmail({ name, tokenCount }),
    })
  )
}

// ─── Sale Notification ────────────────────────────────────────────────────────

export async function sendSaleNotificationEmail({
  email,
  templateName,
  saleAmount,
  platformFee,
  monthlyTotal,
  salesThisMonth,
}: {
  email: string
  templateName: string
  saleAmount: number
  platformFee?: number
  monthlyTotal?: number
  salesThisMonth?: number
}): Promise<EmailResult> {
  const fee = platformFee ?? saleAmount * 0.1
  const net = saleAmount - fee
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(net)

  return guardedSend(() =>
    getResend().emails.send({
      from: FROM,
      to: email,
      subject: `${formatted} earned from "${templateName}"`,
      react: SaleNotificationEmail({
        templateName,
        saleAmount,
        platformFee: fee,
        monthlyTotal,
        salesThisMonth,
      }),
    })
  )
}

// ─── Weekly Digest ────────────────────────────────────────────────────────────

export async function sendWeeklyDigestEmail({
  email,
  name,
  buildsThisWeek,
  tokensUsed,
  earningsThisWeek,
  streakDays,
  trendingTemplates,
  communityHighlight,
}: {
  email: string
  name: string
  buildsThisWeek: number
  tokensUsed: number
  earningsThisWeek: number
  streakDays: number
  trendingTemplates?: Array<{ name: string; category: string; sales: number; thumbnailUrl?: string }>
  communityHighlight?: string
}): Promise<EmailResult> {
  return guardedSend(() =>
    getResend().emails.send({
      from: FROM,
      to: email,
      subject: `Your ForjeGames weekly digest — ${buildsThisWeek} builds this week`,
      react: WeeklyDigestEmail({
        name,
        buildsThisWeek,
        tokensUsed,
        earningsThisWeek,
        streakDays,
        trendingTemplates,
        communityHighlight,
      }),
    })
  )
}

// ─── Charity Update ───────────────────────────────────────────────────────────

export async function sendCharityUpdateEmail({
  email,
  month,
  totalDonatedThisMonth,
  totalDonatedAllTime,
  currentCauseName,
  currentCauseDescription,
  currentCauseUrl,
  communityContributors,
  buildsThisMonth,
  impactStats,
}: {
  email: string
  month?: string
  totalDonatedThisMonth: number
  totalDonatedAllTime: number
  currentCauseName: string
  currentCauseDescription: string
  currentCauseUrl: string
  communityContributors: number
  buildsThisMonth: number
  impactStats?: Array<{ label: string; value: string }>
}): Promise<EmailResult> {
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(totalDonatedThisMonth)

  return guardedSend(() =>
    getResend().emails.send({
      from: FROM,
      to: email,
      subject: `Together we've donated ${formatted} this month — your charity update`,
      react: CharityUpdateEmail({
        month,
        totalDonatedThisMonth,
        totalDonatedAllTime,
        currentCauseName,
        currentCauseDescription,
        currentCauseUrl,
        communityContributors,
        buildsThisMonth,
        impactStats,
      }),
    })
  )
}

// ─── Dunning (payment failed) ─────────────────────────────────────────────────

export async function sendDunningEmail({
  email,
  name,
  invoiceUrl,
  amountDueCents,
  nextAttemptAt,
}: {
  email: string
  name: string
  invoiceUrl?: string
  amountDueCents: number
  nextAttemptAt?: Date
}): Promise<EmailResult> {
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amountDueCents / 100)

  return guardedSend(() =>
    getResend().emails.send({
      from: FROM,
      to: email,
      subject: `Payment failed — update your billing to keep ForjeGames active`,
      react: DunningEmail({ name, amountDue: formatted, invoiceUrl, nextAttemptAt }),
    })
  )
}

// ─── Trial ending ──────────────────────────────────────────────────────────────

export async function sendTrialEndingEmail({
  email,
  name,
  trialEndDate,
  upgradeUrl,
}: {
  email: string
  name: string
  trialEndDate?: Date
  upgradeUrl: string
}): Promise<EmailResult> {
  const daysLeft = trialEndDate
    ? Math.max(0, Math.ceil((trialEndDate.getTime() - Date.now()) / 86_400_000))
    : 3

  return guardedSend(() =>
    getResend().emails.send({
      from: FROM,
      to: email,
      subject: `Your free trial ends in ${daysLeft} day${daysLeft !== 1 ? 's' : ''} — upgrade to keep building`,
      react: TrialEndingEmail({ name, daysLeft, trialEndDate, upgradeUrl }),
    })
  )
}

// ─── Payment action required (SCA / 3D Secure) ────────────────────────────────

export async function sendPaymentActionRequiredEmail({
  email,
  name,
  paymentUrl,
  amountDueCents,
}: {
  email: string
  name: string
  paymentUrl?: string
  amountDueCents: number
}): Promise<EmailResult> {
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amountDueCents / 100)

  return guardedSend(() =>
    getResend().emails.send({
      from: FROM,
      to: email,
      subject: `Action required: complete your ${formatted} ForjeGames payment`,
      react: PaymentActionRequiredEmail({ name, amountDue: formatted, paymentUrl }),
    })
  )
}

// ─── Re-engagement ────────────────────────────────────────────────────────────

export async function sendReEngagementEmail({
  email,
  name,
  daysInactive,
  bonusTokens = 50,
}: {
  email: string
  name: string
  daysInactive: number
  bonusTokens?: number
}): Promise<EmailResult> {
  return guardedSend(() =>
    getResend().emails.send({
      from: FROM,
      to: email,
      subject: `We miss you, ${name} — come back and get ${bonusTokens} free tokens`,
      react: ReEngagementEmail({ name, daysInactive, bonusTokens }),
    })
  )
}
