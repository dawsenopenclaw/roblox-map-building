/**
 * Email sending via Resend with BullMQ queue for batch operations.
 * Templates live in src/lib/email-templates/ (React Email).
 * IMPORTANT: This file is legacy. Prefer src/lib/email.ts instead.
 */

/**
 * Escape HTML special characters to prevent injection
 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }
  return text.replace(/[&<>"']/g, (char) => map[char])
}

export type EmailTemplate =
  | 'welcome'
  | 'verification'
  | 'coppa-consent'
  | 'build-complete'
  | 'token-low'
  | 'sale-notification'
  | 'weekly-digest'
  | 're-engagement-day7'
  | 're-engagement-day30'
  | 'referral-earned'
  | 'featured-creator'
  | 'charity-update'

export interface SendEmailOptions {
  to: string
  template: EmailTemplate
  subject: string
  data?: Record<string, unknown>
}

const RESEND_API_URL = 'https://api.resend.com/emails'
const FROM_ADDRESS = 'noreply@forjegames.com'
const FROM_NAME = 'ForjeGames'

/**
 * Send a single transactional email via Resend.
 * In production, prefer enqueueing via the BullMQ queue below.
 */
export async function sendEmail(opts: SendEmailOptions): Promise<{ id: string } | null> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.warn('[email] RESEND_API_KEY not set — skipping email send')
    return null
  }

  const html = renderTemplate(opts.template, opts.data ?? {})

  try {
    const res = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `${FROM_NAME} <${FROM_ADDRESS}>`,
        to: [opts.to],
        subject: opts.subject,
        html,
      }),
    })

    if (!res.ok) {
      const errBody = await res.text()
      console.error('[email] Resend error', res.status, errBody)
      return null
    }

    const json = (await res.json()) as { id: string }
    return json
  } catch (err) {
    console.error('[email] Failed to send email', err)
    return null
  }
}

/**
 * Enqueue an email for batch delivery via BullMQ.
 * Falls back to direct send if Redis/BullMQ is unavailable.
 */
export async function enqueueEmail(opts: SendEmailOptions): Promise<void> {
  try {
    const { redis } = await import('./redis')
    const jobKey = `email:queue:${Date.now()}:${Math.random()}`
    await redis.set(jobKey, JSON.stringify(opts), 'EX', 3600)
    // In a full deployment, a BullMQ worker would pick this up.
    // For now, we process inline to keep the system functional.
    await sendEmail(opts)
  } catch {
    // Fallback to direct send
    await sendEmail(opts)
  }
}

/**
 * Render a simple HTML email body for the given template.
 * In production, replace with React Email renderToStaticMarkup().
 */
function renderTemplate(template: EmailTemplate, data: Record<string, unknown>): string {
  const base = (title: string, body: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0a0e2e; color: #fff; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
    .logo { font-size: 24px; font-weight: 800; color: #FFB81C; margin-bottom: 32px; }
    .card { background: #0D1231; border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 32px; }
    h1 { color: #fff; font-size: 24px; margin: 0 0 16px; }
    p { color: #9CA3AF; line-height: 1.6; margin: 0 0 16px; }
    .btn { display: inline-block; background: #FFB81C; color: #000; font-weight: 700; padding: 12px 24px; border-radius: 12px; text-decoration: none; }
    .footer { margin-top: 32px; color: #4B5563; font-size: 12px; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">ForjeGames</div>
    <div class="card">${body}</div>
    <div class="footer">ForjeGames &bull; <a href="https://forjegames.com/unsubscribe" style="color:#4B5563">Unsubscribe</a></div>
  </div>
</body>
</html>`

  switch (template) {
    case 'welcome':
      return base(
        'Welcome to ForjeGames',
        `<h1>Welcome, ${escapeHtml(String(data.name ?? 'Creator'))}!</h1>
         <p>You're now part of the ForjeGames community. Build amazing Roblox games with AI-powered tools.</p>
         <a href="https://forjegames.com/dashboard" class="btn">Go to Dashboard</a>`
      )

    case 'verification':
      return base(
        'Verify your email',
        `<h1>Verify your email</h1>
         <p>Click the button below to verify your email address.</p>
         <a href="${data.verificationUrl}" class="btn">Verify Email</a>
         <p style="margin-top:16px;font-size:12px;">This link expires in 24 hours.</p>`
      )

    case 'coppa-consent':
      return base(
        'Parental consent required',
        `<h1>Parental Consent Required</h1>
         <p>Your child has signed up for ForjeGames. Please review and approve their account.</p>
         <a href="${data.consentUrl}" class="btn">Review & Approve</a>`
      )

    case 'build-complete':
      return base(
        'Your build is ready!',
        `<h1>Build Complete!</h1>
         <p>Your map "<strong>${escapeHtml(String(data.buildName ?? 'Untitled'))}</strong>" has finished processing.</p>
         <a href="${escapeHtml(String(data.downloadUrl ?? 'https://forjegames.com/dashboard'))}" class="btn">Download Build</a>`
      )

    case 'token-low':
      return base(
        'Your token balance is low',
        `<h1>Tokens Running Low</h1>
         <p>You have <strong>${data.balance ?? 0} tokens</strong> remaining. Top up to keep building.</p>
         <a href="https://forjegames.com/tokens" class="btn">Buy Tokens</a>`
      )

    case 'sale-notification':
      return base(
        'You made a sale!',
        `<h1>You made a sale!</h1>
         <p>"${escapeHtml(String(data.templateName))}" was purchased for <strong>$${escapeHtml(String(data.amount))}</strong>.</p>
         <p>Your earnings: <strong>$${escapeHtml(String(data.net))}</strong> (after platform fee).</p>
         <a href="https://forjegames.com/earnings" class="btn">View Earnings</a>`
      )

    case 'weekly-digest':
      return base(
        'Your weekly summary',
        `<h1>Your weekly summary</h1>
         <p>Here's what happened this week:</p>
         <ul style="color:#9CA3AF;padding-left:20px">
           <li>${data.builds ?? 0} builds completed</li>
           <li>${data.sales ?? 0} template sales</li>
           <li>$${data.revenue ?? '0.00'} earned</li>
         </ul>
         <a href="https://forjegames.com/dashboard" class="btn">View Dashboard</a>`
      )

    case 're-engagement-day7':
      return base(
        "We miss you!",
        `<h1>It's been a week...</h1>
         <p>You haven't built anything in 7 days. Jump back in — your next map is waiting.</p>
         <a href="https://forjegames.com/dashboard" class="btn">Start Building</a>`
      )

    case 're-engagement-day30':
      return base(
        'Come back and build something amazing',
        `<h1>Long time no see!</h1>
         <p>It's been 30 days since your last build. We've added new features you'll love.</p>
         <a href="https://forjegames.com/dashboard" class="btn">See What's New</a>`
      )

    case 'referral-earned':
      return base(
        'Referral bonus earned!',
        `<h1>You earned a referral bonus!</h1>
         <p>Someone signed up using your referral link. You've received <strong>100 tokens</strong>.</p>
         <a href="https://forjegames.com/referrals" class="btn">View Referrals</a>`
      )

    case 'featured-creator':
      return base(
        "You're a featured creator!",
        `<h1>Congratulations!</h1>
         <p>Your templates have been featured on the ForjeGames marketplace.</p>
         <a href="https://forjegames.com/marketplace" class="btn">View Marketplace</a>`
      )

    case 'charity-update':
      return base(
        'Your charity contribution',
        `<h1>Impact Update</h1>
         <p>Your purchase contributed <strong>$${data.amount}</strong> to <strong>${data.charity}</strong>.</p>
         <a href="https://forjegames.com/charity" class="btn">See Your Impact</a>`
      )

    default:
      return base('ForjeGames', `<h1>Notification</h1><p>You have a new notification from ForjeGames.</p>`)
  }
}
