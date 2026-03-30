import 'server-only'

/**
 * Server-side PostHog client (posthog-node).
 *
 * Returns a singleton PostHog instance if POSTHOG_API_KEY is configured,
 * otherwise returns null so callers can skip gracefully.
 */

import { PostHog } from 'posthog-node'

let client: PostHog | null = null

export function getPostHogClient(): PostHog | null {
  const apiKey = process.env.POSTHOG_API_KEY
  if (!apiKey) return null

  if (!client) {
    client = new PostHog(apiKey, {
      host: process.env.POSTHOG_HOST ?? 'https://app.posthog.com',
      // Flush immediately on serverless — no persistent worker
      flushAt: 1,
      flushInterval: 0,
    })
  }

  return client
}
