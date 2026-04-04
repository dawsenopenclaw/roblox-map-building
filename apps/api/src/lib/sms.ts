/**
 * SMS notification service via Twilio for the API server.
 * Gracefully degrades if Twilio credentials aren't configured.
 */

let _client: import('twilio').Twilio | null = null

function getClient(): import('twilio').Twilio | null {
  if (_client) return _client

  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN

  if (!accountSid || !authToken) {
    return null
  }

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const twilio = require('twilio')
  _client = twilio(accountSid, authToken) as import('twilio').Twilio
  return _client
}

export async function sendSMS({
  to,
  body,
}: {
  to: string
  body: string
}): Promise<{ success: boolean; sid?: string; error?: string }> {
  const client = getClient()
  if (!client) {
    return { success: false, error: 'Twilio not configured' }
  }

  const from = process.env.TWILIO_FROM_NUMBER || ''
  if (!from) {
    return { success: false, error: 'TWILIO_FROM_NUMBER not set' }
  }

  try {
    const message = await client.messages.create({ to, from, body })
    return { success: true, sid: message.sid }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    console.error('[sms] Send failed:', msg)
    return { success: false, error: msg }
  }
}
