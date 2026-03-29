import { PostHog } from 'posthog-node'
import { clientEnv } from './env'

let _client: PostHog | null = null

export function getPostHogClient() {
  if (!clientEnv.NEXT_PUBLIC_POSTHOG_KEY) return null
  if (!_client) {
    _client = new PostHog(clientEnv.NEXT_PUBLIC_POSTHOG_KEY, {
      host: clientEnv.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com',
      flushAt: 20,
      flushInterval: 10000,
    })
  }
  return _client
}

export async function captureEvent(
  distinctId: string,
  event: string,
  properties?: Record<string, unknown>
) {
  const client = getPostHogClient()
  if (!client) return
  client.capture({ distinctId, event, properties: { ...properties, $app: 'robloxforge' } })
}

export async function identifyUser(
  distinctId: string,
  properties: { email?: string; tier?: string; isUnder13?: boolean }
) {
  const client = getPostHogClient()
  if (!client) return
  client.identify({ distinctId, properties })
}
