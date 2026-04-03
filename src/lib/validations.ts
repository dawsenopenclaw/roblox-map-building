import { z } from 'zod'

// ── Common ────────────────────────────────────────────────────────────────────

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})

// ── AI ────────────────────────────────────────────────────────────────────────

export const chatMessageSchema = z.object({
  message: z.string().min(1, 'message is required').max(4000, 'message exceeds 4000 characters'),
  conversationId: z.string().optional(),
  model: z.string().optional(),
  stream: z.boolean().optional(),
  gameContext: z.any().optional(),
  studioContext: z.any().optional(),
  lastError: z.string().optional(),
  retryAttempt: z.number().optional(),
  previousCode: z.string().optional(),
  history: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string(),
  })).optional(),
  messages: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string(),
  })).optional(),
})

export const meshGenerateSchema = z.object({
  prompt: z.string().min(1, 'prompt is required').max(2000),
  quality: z.enum(['draft', 'standard', 'premium']).optional(),
  withTextures: z.boolean().optional(),
})

export const textureGenerateSchema = z.object({
  prompt: z.string().min(1, 'prompt is required').max(2000),
  resolution: z.enum(['512', '1024', '2048']).optional(),
  seamless: z.boolean().optional(),
})

export const feedbackBodySchema = z
  .object({
    messageId: z.string().min(1, 'messageId is required'),
    rating: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]).optional(),
    thumbsUp: z.boolean().optional(),
    comment: z.string().max(500).optional(),
  })
  .refine((b) => b.rating !== undefined || b.thumbsUp !== undefined, {
    message: 'At least one of rating or thumbsUp is required',
  })

// ── Marketplace ───────────────────────────────────────────────────────────────

export const templateSubmitSchema = z.object({
  title: z.string().min(1, 'title is required').max(100),
  description: z.string().min(1, 'description is required').max(2000),
  priceCents: z
    .number({ required_error: 'priceCents is required' })
    .int('priceCents must be an integer')
    .min(0, 'priceCents must be non-negative')
    .max(99999, 'priceCents exceeds maximum'),
  category: z.string().min(1, 'category is required'),
  rbxmFileUrl: z.string().url('rbxmFileUrl must be a valid URL').optional(),
  thumbnailUrl: z.string().url('thumbnailUrl must be a valid URL').optional(),
  tags: z.array(z.string()).max(20).optional(),
  screenshots: z
    .array(
      z.object({
        url: z.string().url(),
        altText: z.string().max(200).optional(),
        sortOrder: z.number().int().optional(),
      }),
    )
    .max(5, 'maximum 5 screenshots allowed')
    .optional(),
})

export const reviewSchema = z.object({
  rating: z
    .number({ required_error: 'rating is required' })
    .int('rating must be an integer')
    .min(1, 'rating must be at least 1')
    .max(5, 'rating must be at most 5'),
  body: z.string().max(2000).optional(),
})

export const reviewResponseSchema = z.object({
  reviewId: z.string().min(1, 'reviewId is required'),
  response: z.string().min(1, 'response is required').max(2000),
})

// ── User settings ─────────────────────────────────────────────────────────────

export const settingsSchema = z.object({
  displayName: z.string().max(50).optional(),
  bio: z.string().max(500).optional(),
})

// ── Gamification ──────────────────────────────────────────────────────────────

/**
 * Only the subset of XPEventType values that are safe to receive directly from
 * a client. Server-internal types (ACHIEVEMENT, STREAK_BONUS, SALE,
 * TEMPLATE_PUBLISHED, REVIEW_GIVEN) are explicitly excluded.
 */
export const earnXpSchema = z.object({
  type: z.enum(['BUILD', 'DAILY_LOGIN', 'MARKETPLACE_BROWSE', 'COMMUNITY_SHARE']),
})

export const achievementUnlockSchema = z.object({
  slug: z.string().min(1, 'slug is required'),
})

export const streakSchema = z.object({
  type: z.enum(['login', 'build']),
})

// ── Agents ────────────────────────────────────────────────────────────────────

export const agentCallSchema = z.object({
  action: z.enum(['call', 'chain', 'auto']),
  agentId: z.string().optional(),
  agentIds: z.array(z.string()).max(5, 'Maximum chain length is 5').optional(),
  prompt: z.string().min(1, 'prompt is required').max(8000),
  chainContext: z.string().optional(),
  dryRun: z.boolean().optional().default(false),
  followChain: z.boolean().optional().default(false),
  feedback: z
    .object({
      agentId: z.string(),
      rating: z.string(),
      output: z.string().optional(),
      prompt: z.string(),
    })
    .optional(),
})

// ── Studio ────────────────────────────────────────────────────────────────────

export const studioAuthClaimSchema = z.object({
  code: z.string().min(1, 'code is required'),
  placeId: z.union([z.string(), z.number()]).optional(),
  placeName: z.string().optional(),
  pluginVer: z.string().optional(),
})

export const studioConnectSchema = z.object({
  token: z.string().min(1, 'token is required'),
  placeId: z.union([z.string(), z.number()]).transform(String),
  placeName: z.string().optional(),
  pluginVersion: z.string().optional(),
})

export const studioScreenshotSchema = z.object({
  sessionId: z.string().min(1, 'sessionId is required'),
  image: z.string().min(1, 'image is required'),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
})

export const studioUpdateSchema = z
  .object({
    sessionId: z.string().optional(),
    sessionToken: z.string().optional(),
    timestamp: z.number().optional(),
    changes: z
      .array(z.object({ type: z.string(), data: z.record(z.unknown()), timestamp: z.number().optional() }))
      .optional(),
    source: z.string().optional(),
    placeId: z.string().optional(),
    jobId: z.string().optional(),
    event: z.string().optional(),
    /** Workspace snapshot sent with workspace_snapshot events */
    snapshot: z.record(z.unknown()).optional(),
  })
  .refine((b) => b.sessionId ?? b.sessionToken, { message: 'sessionId is required' })

// ── Admin ─────────────────────────────────────────────────────────────────────

export const adminCharityCreateSchema = z.object({
  slug: z.string().min(1, 'slug is required').max(100),
  name: z.string().min(1, 'name is required').max(200),
  description: z.string().optional().default(''),
  url: z.string().optional().default(''),
})

export const adminTemplateRejectSchema = z.object({
  reason: z.string().optional(),
})

export const adminUserUpdateSchema = z.object({
  role: z.enum(['USER', 'ADMIN', 'CREATOR', 'MODERATOR']).optional(),
  tier: z.enum(['FREE', 'HOBBY', 'CREATOR', 'STUDIO']).optional(),
  banned: z.boolean().optional(),
  refundTokens: z.boolean().optional(),
})

// ── Business ──────────────────────────────────────────────────────────────────

export const teamInviteSchema = z.object({
  email: z.string().email('Valid email is required'),
  role: z.enum(['OWNER', 'ADMIN', 'DEVELOPER', 'VIEWER']),
  tokensAllotment: z.number().int().positive().optional(),
})

export const teamUpdateMemberSchema = z.object({
  memberId: z.string().min(1, 'memberId is required'),
  role: z.enum(['OWNER', 'ADMIN', 'DEVELOPER', 'VIEWER']).optional(),
  tokensAllotment: z.number().int().positive().optional(),
  status: z.enum(['ACTIVE', 'SUSPENDED']).optional(),
})

const HEX_COLOR = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/

export const whiteLabelBrandingSchema = z.object({
  logoUrl:      z.string().url().nullable().optional(),
  faviconUrl:   z.string().url().nullable().optional(),
  primaryColor: z.string().regex(HEX_COLOR, 'Must be a hex color e.g. #D4AF37').optional(),
  accentColor:  z.string().regex(HEX_COLOR, 'Must be a hex color e.g. #FFB81C').optional(),
  companyName:  z.string().min(2).max(80).optional(),
  tagline:      z.string().max(160).nullable().optional(),
  customDomain: z.string().min(4).max(253).nullable().optional(),
})

export const whiteLabelAgentSchema = z.object({
  agentId: z.string().min(1, 'agentId is required'),
  enabled: z.boolean().optional(),
  systemPrompt: z.string().max(4000).optional(),
})

export const whiteLabelDomainSchema = z.object({
  domain: z.string().min(1, 'domain is required'),
})

// ── Email ─────────────────────────────────────────────────────────────────────

export const emailUnsubscribeSchema = z.object({
  token: z.string().min(8, 'token is required'),
})

// ── Notifications ─────────────────────────────────────────────────────────────

export const notificationMarkReadSchema = z.object({
  ids: z.array(z.string().max(64)).optional(),
  markAll: z.boolean().optional(),
})

export const notificationDeleteSchema = z.object({
  id: z.string().min(1, 'id is required').max(64),
})

// ── Marketplace Connect ───────────────────────────────────────────────────────

// Allowed origins for Stripe Connect return/refresh URLs.
// Must start with the app's own origin to prevent open redirect abuse.
const ALLOWED_REDIRECT_ORIGINS = [
  'https://forjegames.com',
  'https://www.forjegames.com',
  'https://app.forjegames.com',
  // Allow localhost and preview URLs only in non-production environments
  ...(process.env.NODE_ENV !== 'production'
    ? ['http://localhost:3000', 'http://localhost:3001']
    : []),
  ...(process.env.NEXT_PUBLIC_APP_URL ? [process.env.NEXT_PUBLIC_APP_URL] : []),
]

function isAllowedRedirectUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return ALLOWED_REDIRECT_ORIGINS.some((origin) => {
      const allowed = new URL(origin)
      return parsed.protocol === allowed.protocol && parsed.host === allowed.host
    })
  } catch {
    return false
  }
}

export const connectOnboardSchema = z.object({
  returnUrl: z
    .string()
    .url()
    .refine(isAllowedRedirectUrl, { message: 'returnUrl must be on an allowed ForjeGames domain' })
    .optional(),
  refreshUrl: z
    .string()
    .url()
    .refine(isAllowedRedirectUrl, { message: 'refreshUrl must be on an allowed ForjeGames domain' })
    .optional(),
})

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Parse and validate a request body against a Zod schema.
 *
 * On success  → `{ ok: true,  data: T }`
 * On failure  → `{ ok: false, error: string, status: number }`
 *
 * Usage pattern:
 *   const parsed = await parseBody(req, mySchema)
 *   if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: parsed.status })
 *   const { fieldA, fieldB } = parsed.data
 */
export async function parseBody<T extends z.ZodTypeAny>(
  req: Request,
  schema: T,
): Promise<
  | { ok: true; data: z.infer<T> }
  | { ok: false; error: string; status: number }
> {
  let raw: unknown
  try {
    raw = await req.json()
  } catch {
    return { ok: false, error: 'Invalid JSON body', status: 400 }
  }

  const result = schema.safeParse(raw)
  if (!result.success) {
    const message = result.error.errors
      .map((e) => `${e.path.join('.') || 'body'}: ${e.message}`)
      .join(', ')
    return { ok: false, error: message, status: 422 }
  }

  return { ok: true, data: result.data }
}
