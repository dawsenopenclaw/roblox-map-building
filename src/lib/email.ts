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

let _resend: Resend | null = null
function getResend(): Resend {
  if (!_resend) {
    _resend = new Resend(serverEnv.RESEND_API_KEY || '')
  }
  return _resend
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
}) {
  const approveUrl = `${appUrl}/api/onboarding/parental-consent/verify?token=${token}&action=approve`
  const denyUrl = `${appUrl}/api/onboarding/parental-consent/verify?token=${token}&action=deny`

  try {
    return await getResend().emails.send({
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
  } catch (err) {
    console.error('[email] sendParentalConsentEmail failed:', err)
  }
}

// ─── Welcome ──────────────────────────────────────────────────────────────────

export async function sendWelcomeEmail({
  email,
  name,
}: {
  email: string
  name: string
}) {
  try {
    return await getResend().emails.send({
      from: FROM,
      to: email,
      subject: `Welcome to ForjeGames, ${name}! Here are 1,000 free tokens`,
      react: WelcomeEmail({ name }),
    })
  } catch (err) {
    console.error('[email] sendWelcomeEmail failed:', err)
  }
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
  try {
    return await getResend().emails.send({
      from: FROM,
      to: email,
      subject: `Your ${buildType} "${buildName}" is ready!`,
      react: BuildCompleteEmail({ buildType, buildName, buildId, thumbnailUrl }),
    })
  } catch (err) {
    console.error('[email] sendBuildCompleteEmail failed:', err)
  }
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
  try {
    return await getResend().emails.send({
      from: FROM,
      to: email,
      subject: isVeryLow
        ? `Only ${tokenCount} tokens left — top up now`
        : `You have ${tokenCount} tokens remaining on ForjeGames`,
      react: TokenLowEmail({ name, tokenCount }),
    })
  } catch (err) {
    console.error('[email] sendTokenLowEmail failed:', err)
  }
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

  try {
    return await getResend().emails.send({
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
  } catch (err) {
    console.error('[email] sendSaleNotificationEmail failed:', err)
  }
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
  try {
    return await getResend().emails.send({
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
  } catch (err) {
    console.error('[email] sendWeeklyDigestEmail failed:', err)
  }
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

  try {
    return await getResend().emails.send({
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
  } catch (err) {
    console.error('[email] sendCharityUpdateEmail failed:', err)
  }
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
}) {
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amountDueCents / 100)

  try {
    return await getResend().emails.send({
      from: FROM,
      to: email,
      subject: `Payment failed — update your billing to keep ForjeGames active`,
      react: DunningEmail({ name, amountDue: formatted, invoiceUrl, nextAttemptAt }),
    })
  } catch (err) {
    console.error('[email] sendDunningEmail failed:', err)
  }
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
}) {
  const daysLeft = trialEndDate
    ? Math.max(0, Math.ceil((trialEndDate.getTime() - Date.now()) / 86_400_000))
    : 3

  try {
    return await getResend().emails.send({
      from: FROM,
      to: email,
      subject: `Your free trial ends in ${daysLeft} day${daysLeft !== 1 ? 's' : ''} — upgrade to keep building`,
      react: TrialEndingEmail({ name, daysLeft, trialEndDate, upgradeUrl }),
    })
  } catch (err) {
    console.error('[email] sendTrialEndingEmail failed:', err)
  }
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
}) {
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amountDueCents / 100)

  try {
    return await getResend().emails.send({
      from: FROM,
      to: email,
      subject: `Action required: complete your ${formatted} ForjeGames payment`,
      react: PaymentActionRequiredEmail({ name, amountDue: formatted, paymentUrl }),
    })
  } catch (err) {
    console.error('[email] sendPaymentActionRequiredEmail failed:', err)
  }
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
  try {
    return await getResend().emails.send({
      from: FROM,
      to: email,
      subject: `We miss you, ${name} — come back and get ${bonusTokens} free tokens`,
      react: ReEngagementEmail({ name, daysInactive, bonusTokens }),
    })
  } catch (err) {
    console.error('[email] sendReEngagementEmail failed:', err)
  }
}
