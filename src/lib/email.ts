// server-only removed — breaks prerender
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
} from './email-templates'

let _resend: Resend | null = null
function getResend(): Resend {
  if (!_resend) {
    _resend = new Resend(serverEnv.RESEND_API_KEY || '')
  }
  return _resend
}

const FROM = 'ForjeGames <noreply@ForjeGames.com>'
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
}) {
  const approveUrl = `${appUrl}/api/onboarding/parental-consent/verify?token=${token}&action=approve`
  const denyUrl = `${appUrl}/api/onboarding/parental-consent/verify?token=${token}&action=deny`

  return getResend().emails.send({
    from: FROM,
    to: parentEmail,
    subject: `Parental consent required for ${childName}'s ForjeGames account`,
    react: ParentalConsentEmail({
      childName,
      parentEmail,
      approveUrl,
      denyUrl,
    }),
  })
}

// ─── Welcome ──────────────────────────────────────────────────────────────────

export async function sendWelcomeEmail({
  email,
  name,
}: {
  email: string
  name: string
}) {
  return getResend().emails.send({
    from: FROM,
    to: email,
    subject: `Welcome to ForjeGames, ${name}! Here are 100 free tokens`,
    react: WelcomeEmail({ name }),
  })
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
}) {
  return getResend().emails.send({
    from: FROM,
    to: email,
    subject: `Your ${buildType} "${buildName}" is ready!`,
    react: BuildCompleteEmail({ buildType, buildName, buildId, thumbnailUrl }),
  })
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
}) {
  const isVeryLow = tokenCount <= 5
  return getResend().emails.send({
    from: FROM,
    to: email,
    subject: isVeryLow
      ? `Only ${tokenCount} tokens left — top up now`
      : `You have ${tokenCount} tokens remaining on ForjeGames`,
    react: TokenLowEmail({ name, tokenCount }),
  })
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
}) {
  const fee = platformFee ?? saleAmount * 0.1
  const net = saleAmount - fee
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(net)

  return getResend().emails.send({
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
}) {
  return getResend().emails.send({
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
}) {
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(totalDonatedThisMonth)

  return getResend().emails.send({
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
}) {
  return getResend().emails.send({
    from: FROM,
    to: email,
    subject: `We miss you, ${name} — come back and get ${bonusTokens} free tokens`,
    react: ReEngagementEmail({ name, daysInactive, bonusTokens }),
  })
}
