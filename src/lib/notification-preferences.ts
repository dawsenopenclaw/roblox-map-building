import 'server-only'

import type { NotificationType, NotificationChannel } from '@prisma/client'
import { db } from './db'

// ─── Default preferences ─────────────────────────────────────────────────────

/** Default channel settings per notification type. */
export const DEFAULT_PREFERENCES: Record<NotificationType, Record<NotificationChannel, boolean>> = {
  BUILD_COMPLETE:       { EMAIL: true,  SMS: false, PUSH: true,  IN_APP: true },
  BUILD_FAILED:         { EMAIL: true,  SMS: false, PUSH: true,  IN_APP: true },
  TOKEN_LOW:            { EMAIL: true,  SMS: false, PUSH: true,  IN_APP: true },
  TOKEN_DEPLETED:       { EMAIL: true,  SMS: true,  PUSH: true,  IN_APP: true },
  SALE:                 { EMAIL: true,  SMS: true,  PUSH: true,  IN_APP: true },
  REFERRAL_EARNED:      { EMAIL: true,  SMS: false, PUSH: true,  IN_APP: true },
  TEAM_INVITE:          { EMAIL: true,  SMS: false, PUSH: true,  IN_APP: true },
  ACHIEVEMENT_UNLOCKED: { EMAIL: false, SMS: false, PUSH: true,  IN_APP: true },
  SYSTEM:               { EMAIL: true,  SMS: false, PUSH: false, IN_APP: true },
  WEEKLY_DIGEST:        { EMAIL: true,  SMS: false, PUSH: false, IN_APP: false },
  TEMPLATE_PURCHASED:   { EMAIL: true,  SMS: false, PUSH: true,  IN_APP: true },
  PAYOUT_COMPLETED:     { EMAIL: true,  SMS: true,  PUSH: true,  IN_APP: true },
  REVIEW_RECEIVED:      { EMAIL: true,  SMS: false, PUSH: true,  IN_APP: true },
  PAYOUT_FAILED:        { EMAIL: true,  SMS: true,  PUSH: true,  IN_APP: true },
}

// ─── Types ───────────────────────────────────────────────────────────────────

export type PreferenceMap = Record<
  NotificationType,
  Record<NotificationChannel, boolean>
>

export interface UserPreferencesResult {
  preferences: PreferenceMap
  phone: string | null
  hasPhone: boolean
  marketingEmailsOptOut: boolean
}

// ─── Queries ─────────────────────────────────────────────────────────────────

/**
 * Get a user's full notification preference map, merging saved prefs with defaults.
 */
export async function getUserPreferences(userId: string): Promise<UserPreferencesResult> {
  const [user, saved] = await Promise.all([
    db.user.findUnique({
      where: { id: userId },
      select: { phone: true, marketingEmailsOptOut: true },
    }),
    db.notificationPreference.findMany({
      where: { userId },
    }),
  ])

  // Start with defaults
  const preferences = structuredClone(DEFAULT_PREFERENCES) as PreferenceMap

  // Override with saved preferences
  for (const pref of saved) {
    if (preferences[pref.type] && pref.channel in preferences[pref.type]) {
      preferences[pref.type][pref.channel] = pref.enabled
    }
  }

  return {
    preferences,
    phone: user?.phone ?? null,
    hasPhone: Boolean(user?.phone),
    marketingEmailsOptOut: user?.marketingEmailsOptOut ?? false,
  }
}

/**
 * Check if a specific channel is enabled for a notification type.
 */
export async function isChannelEnabled(
  userId: string,
  type: NotificationType,
  channel: NotificationChannel,
): Promise<boolean> {
  const saved = await db.notificationPreference.findUnique({
    where: { userId_type_channel: { userId, type, channel } },
  })

  if (saved) return saved.enabled

  // Fall back to default
  return DEFAULT_PREFERENCES[type]?.[channel] ?? false
}

/**
 * Update a single preference.
 */
export async function updatePreference(
  userId: string,
  type: NotificationType,
  channel: NotificationChannel,
  enabled: boolean,
) {
  return db.notificationPreference.upsert({
    where: { userId_type_channel: { userId, type, channel } },
    create: { userId, type, channel, enabled },
    update: { enabled },
  })
}

/**
 * Bulk update preferences — upserts all provided entries.
 */
export async function bulkUpdatePreferences(
  userId: string,
  updates: Array<{ type: NotificationType; channel: NotificationChannel; enabled: boolean }>,
) {
  return db.$transaction(
    updates.map(({ type, channel, enabled }) =>
      db.notificationPreference.upsert({
        where: { userId_type_channel: { userId, type, channel } },
        create: { userId, type, channel, enabled },
        update: { enabled },
      })
    )
  )
}

/**
 * Update the user's phone number for SMS notifications.
 */
export async function updatePhone(userId: string, phone: string | null) {
  return db.user.update({
    where: { id: userId },
    data: { phone },
  })
}

/**
 * Get all enabled channels for a specific notification type + user.
 */
export async function getEnabledChannels(
  userId: string,
  type: NotificationType,
): Promise<NotificationChannel[]> {
  const { preferences, hasPhone } = await getUserPreferences(userId)
  const typePrefs = preferences[type]
  if (!typePrefs) return ['IN_APP']

  const channels: NotificationChannel[] = []

  if (typePrefs.IN_APP) channels.push('IN_APP')
  if (typePrefs.EMAIL) channels.push('EMAIL')
  if (typePrefs.SMS && hasPhone) channels.push('SMS')
  if (typePrefs.PUSH) channels.push('PUSH')

  return channels
}
