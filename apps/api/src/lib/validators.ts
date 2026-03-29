/**
 * Shared Zod schemas for all API endpoints.
 * Import the schema you need and pass to zValidator() or validate() middleware.
 */

import { z } from 'zod'

// ---------------------------------------------------------------------------
// Primitives
// ---------------------------------------------------------------------------

/** cuid2-compatible ID (starts with a letter, 25 chars) — or Prisma cuid1 (25 chars starting with 'c') */
export const idSchema = z
  .string()
  .min(1)
  .regex(/^[a-z][a-z0-9]{10,}$/i, 'Invalid ID format')

// ---------------------------------------------------------------------------
// Pagination / listing
// ---------------------------------------------------------------------------

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  cursor: z.string().optional(),
})

// ---------------------------------------------------------------------------
// Search
// ---------------------------------------------------------------------------

export const searchSchema = z.object({
  query: z.string().min(1).max(200),
  filters: z.record(z.string(), z.unknown()).optional(),
  sort: z.enum(['relevance', 'newest', 'oldest', 'popular', 'price_asc', 'price_desc']).optional().default('relevance'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})

// ---------------------------------------------------------------------------
// AI generation
// ---------------------------------------------------------------------------

export const aiGenerateSchema = z.object({
  prompt: z.string().min(3).max(2000),
  mode: z.enum(['terrain', 'city', 'assets', 'full-game']),
  confirmed: z.boolean().default(false),
  quality: z.enum(['draft', 'standard', 'high']).optional().default('standard'),
  maxTokens: z.number().int().min(100).max(8000).optional(),
  options: z
    .object({
      style: z.string().max(100).optional(),
      buildingCount: z.number().int().min(1).max(50).optional(),
      assetCount: z.number().int().min(1).max(50).optional(),
      assetTypes: z.array(z.string().max(50)).max(20).optional(),
      size: z
        .object({
          width: z.number().int().min(10).max(10000),
          height: z.number().int().min(10).max(10000),
        })
        .optional(),
      zones: z.array(z.string().max(50)).max(20).optional(),
    })
    .optional(),
})

// ---------------------------------------------------------------------------
// Voice input
// ---------------------------------------------------------------------------

export const voiceInputSchema = z.union([
  /** Multipart — validated at the handler level; this covers the JSON branch */
  z.object({
    text: z.string().min(1).max(1000),
  }),
  /** Fallback: accept either field */
  z.object({
    transcript: z.string().min(1).max(1000),
  }),
])

// ---------------------------------------------------------------------------
// Image upload (JSON branch — multipart is validated inline in the handler)
// ---------------------------------------------------------------------------

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] as const

export const imageUploadSchema = z.object({
  imageUrl: z.string().url().optional(),
  prompt: z.string().max(500).optional(),
  /** Only used when caller sends metadata in JSON alongside a file reference */
  mimeType: z.enum(ALLOWED_IMAGE_TYPES).optional(),
  maxSizeBytes: z.number().int().min(1).max(10 * 1024 * 1024).optional(),
  dimensions: z
    .object({
      maxWidth: z.number().int().min(1).max(8192).optional(),
      maxHeight: z.number().int().min(1).max(8192).optional(),
    })
    .optional(),
})

// ---------------------------------------------------------------------------
// Template marketplace
// ---------------------------------------------------------------------------

export const templateSubmitSchema = z.object({
  title: z.string().min(3).max(100),
  description: z.string().min(10).max(2000),
  category: z.enum(['terrain', 'city', 'asset', 'script', 'full-game', 'other']),
  price: z.number().int().min(0).max(100000), // in cents
  screenshots: z.array(z.string().url()).min(1).max(10),
  tags: z.array(z.string().max(30)).max(10).optional(),
  isPublic: z.boolean().optional().default(true),
})

// ---------------------------------------------------------------------------
// Reviews
// ---------------------------------------------------------------------------

export const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  text: z.string().min(10).max(2000),
  templateId: z.string().min(1),
})

// ---------------------------------------------------------------------------
// Teams
// ---------------------------------------------------------------------------

export const teamCreateSchema = z.object({
  name: z.string().min(2).max(50),
  description: z.string().max(200).optional(),
})

export const teamInviteSchema = z.object({
  email: z.string().email().optional(),
  role: z.enum(['ADMIN', 'EDITOR', 'VIEWER']).default('EDITOR'),
  /** Pass a pre-generated invite link token to regenerate / resend */
  linkToken: z.string().optional(),
})

// ---------------------------------------------------------------------------
// API keys
// ---------------------------------------------------------------------------

const VALID_API_SCOPES = ['full', 'terrain-only', 'assets-only', 'read-only'] as const

export const apiKeyCreateSchema = z.object({
  name: z.string().min(1).max(80).trim(),
  scopes: z.array(z.enum(VALID_API_SCOPES)).min(1).default(['read-only']),
  expiresAt: z
    .string()
    .datetime({ message: 'expiresAt must be an ISO 8601 datetime string' })
    .optional()
    .transform((v) => (v ? new Date(v) : undefined)),
})

// ---------------------------------------------------------------------------
// Webhooks
// ---------------------------------------------------------------------------

const VALID_WEBHOOK_EVENTS = [
  'build.completed',
  'build.failed',
  'template.sold',
  'template.reviewed',
  'token.low',
  'token.depleted',
  'subscription.changed',
  'team.member_joined',
  'achievement.unlocked',
] as const

export const webhookCreateSchema = z.object({
  url: z
    .string()
    .url()
    .refine((u) => u.startsWith('https://'), { message: 'Webhook URL must use HTTPS' }),
  events: z
    .array(z.enum(VALID_WEBHOOK_EVENTS))
    .min(1, 'At least one event is required')
    .default([...VALID_WEBHOOK_EVENTS]),
})

export const webhookUpdateSchema = z.object({
  active: z.boolean().optional(),
  events: z
    .array(z.enum(VALID_WEBHOOK_EVENTS))
    .min(1, 'At least one event is required')
    .optional(),
})

export const webhookTestSchema = z.object({
  event: z.enum(VALID_WEBHOOK_EVENTS).optional(),
})

// ---------------------------------------------------------------------------
// Referrals
// ---------------------------------------------------------------------------

export const referralTrackSchema = z.object({
  code: z
    .string()
    .min(4)
    .max(20)
    .regex(/^[A-Z0-9]+$/, 'Referral code must be uppercase alphanumeric'),
  newUserId: z.string().min(1),
})

// ---------------------------------------------------------------------------
// Re-exports for convenience
// ---------------------------------------------------------------------------

export type PaginationInput = z.infer<typeof paginationSchema>
export type SearchInput = z.infer<typeof searchSchema>
export type AiGenerateInput = z.infer<typeof aiGenerateSchema>
export type VoiceInput = z.infer<typeof voiceInputSchema>
export type ImageUploadInput = z.infer<typeof imageUploadSchema>
export type TemplateSubmitInput = z.infer<typeof templateSubmitSchema>
export type ReviewInput = z.infer<typeof reviewSchema>
export type TeamCreateInput = z.infer<typeof teamCreateSchema>
export type TeamInviteInput = z.infer<typeof teamInviteSchema>
export type ApiKeyCreateInput = z.infer<typeof apiKeyCreateSchema>
export type WebhookCreateInput = z.infer<typeof webhookCreateSchema>
export type WebhookUpdateInput = z.infer<typeof webhookUpdateSchema>
export type WebhookTestInput = z.infer<typeof webhookTestSchema>
export type ReferralTrackInput = z.infer<typeof referralTrackSchema>
