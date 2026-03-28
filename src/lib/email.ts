import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendParentalConsentEmail({
  parentEmail,
  childName,
  token,
}: {
  parentEmail: string
  childName: string
  token: string
}) {
  const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/onboarding/parental-consent/verify?token=${token}`
  return resend.emails.send({
    from: 'RobloxForge <noreply@robloxforge.com>',
    to: parentEmail,
    subject: `Parental consent required for ${childName}'s RobloxForge account`,
    html: `
      <div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;background:#0A0E27;color:white;padding:32px;border-radius:12px">
        <h1 style="color:#FFB81C;margin-bottom:16px">Parental Consent Required</h1>
        <p>Your child <strong>${childName}</strong> (under 13) has signed up for RobloxForge, an AI-powered Roblox game development platform.</p>
        <p>Under the Children's Online Privacy Protection Act (COPPA), we need your consent before ${childName} can use our service.</p>
        <p style="margin:24px 0">
          <a href="${verifyUrl}" style="background:#FFB81C;color:black;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold">Approve Account</a>
        </p>
        <p style="color:#9ca3af;font-size:14px">This link expires in 48 hours. If you did not create this account, you can safely ignore this email.</p>
        <p style="color:#9ca3af;font-size:12px">RobloxForge collects only the minimum data necessary to provide the service. We never sell data. See our <a href="${process.env.NEXT_PUBLIC_APP_URL}/privacy" style="color:#FFB81C">Privacy Policy</a>.</p>
      </div>
    `,
  })
}
