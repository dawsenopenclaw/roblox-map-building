/**
 * Server-side PostHog Node.js client wrapper.
 * Initializes the PostHog client for server-side analytics.
 * Returns null if POSTHOG_KEY is not configured.
 */

import { PostHog } from 'posthog-node'

let client: PostHog | null = null

/**
 * Get or initialize the PostHog client.
 * Returns null if POSTHOG_KEY env var is not set.
 */
export function getPostHogClient(): PostHog | null {
  // If no API key, skip initialization
  if (!process.env.POSTHOG_KEY) {
    return null
  }

  // Lazy init on first call
  if (!client) {
    try {
      client = new PostHog(process.env.POSTHOG_KEY, {
        host: process.env.POSTHOG_HOST || 'https://app.posthog.com',
        flushAt: 10,
        flushInterval: 10000,
        fetch: fetch,
      })
    } catch (error) {
      // If initialization fails, log and return null — never throw
      console.error('Failed to initialize PostHog client:', error)
      return null
    }
  }

  return client
}

/**
 * Flush any pending events (call on shutdown).
 */
export async function flushPostHog(): Promise<void> {
  if (!client) return
  try {
    await client.flush()
  } catch (error) {
    console.error('Failed to flush PostHog events:', error)
  }
}
