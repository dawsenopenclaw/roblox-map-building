import { headers } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { db } from '@/lib/db'

// ─── Meshy webhook payload shapes ─────────────────────────────────────────────

type MeshyStatus = 'SUCCEEDED' | 'FAILED' | 'EXPIRED'

interface MeshyTextureUrls {
  base_color?: string
  normal?: string
  roughness?: string
  metallic?: string
}

interface MeshyWebhookPayload {
  // Task identifiers
  id: string
  task_id?: string

  // Status — Meshy sends SUCCEEDED | FAILED | EXPIRED
  status: MeshyStatus

  // Result data (present on SUCCEEDED)
  model_urls?: {
    glb?: string
    fbx?: string
    obj?: string
    usdz?: string
  }
  thumbnail_url?: string
  video_url?: string
  texture_urls?: MeshyTextureUrls[]
  poly_count?: number
  file_size?: number

  // Error data (present on FAILED / EXPIRED)
  task_error?: {
    message?: string
  }

  // Timing
  started_at?: number
  finished_at?: number
  created_at?: number
}

// ─── Signature verification ───────────────────────────────────────────────────
//
// Meshy signs outbound webhooks with an HMAC-SHA256 signature sent in the
// "x-meshy-signature" header as "sha256=<hex>". We verify it with our secret
// stored in MESHY_WEBHOOK_SECRET. If the env var is absent (local dev /
// early setup) we skip verification and log a warning.

async function verifyMeshySignature(body: string, signature: string | null): Promise<boolean> {
  const secret = process.env.MESHY_WEBHOOK_SECRET
  if (!secret) {
    console.warn('[meshy-webhook] MESHY_WEBHOOK_SECRET not set — skipping signature verification')
    return true
  }

  if (!signature) return false

  // Strip "sha256=" prefix if present
  const rawSig = signature.startsWith('sha256=') ? signature.slice(7) : signature

  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const mac = await crypto.subtle.sign('HMAC', key, encoder.encode(body))
  const computed = Array.from(new Uint8Array(mac))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')

  // Constant-time comparison (crypto.subtle does not expose timingSafeEqual)
  if (computed.length !== rawSig.length) return false
  let diff = 0
  for (let i = 0; i < computed.length; i++) {
    diff |= computed.charCodeAt(i) ^ rawSig.charCodeAt(i)
  }
  return diff === 0
}

// ─── POST /api/webhooks/meshy ─────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const body = await req.text()
  const headerPayload = await headers()
  const signature = headerPayload.get('x-meshy-signature')

  // Verify authenticity
  const isValid = await verifyMeshySignature(body, signature)
  if (!isValid) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  let payload: MeshyWebhookPayload
  try {
    payload = JSON.parse(body) as MeshyWebhookPayload
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  // Meshy sends the task ID as either `id` or `task_id`
  const meshyTaskId = payload.task_id ?? payload.id
  if (!meshyTaskId) {
    return NextResponse.json({ error: 'Missing task_id' }, { status: 400 })
  }

  try {
    // Look up the asset by Meshy task ID
    const asset = await db.generatedAsset.findUnique({
      where: { meshyTaskId },
      select: { id: true, userId: true, status: true, createdAt: true },
    })

    if (!asset) {
      // Unknown task — return 200 so Meshy does not retry indefinitely
      console.warn('[meshy-webhook] Received event for unknown task:', meshyTaskId)
      return NextResponse.json({ received: true })
    }

    // Guard: skip if already in a terminal state
    if (asset.status === 'ready' || asset.status === 'failed') {
      return NextResponse.json({ received: true })
    }

    switch (payload.status) {
      case 'SUCCEEDED': {
        const meshUrl = payload.model_urls?.glb ?? payload.model_urls?.fbx ?? null
        const textureSet = payload.texture_urls?.[0] ?? null

        // Compute generation time in ms from Meshy timestamps
        const generationMs =
          payload.started_at && payload.finished_at
            ? payload.finished_at - payload.started_at
            : payload.created_at && payload.finished_at
              ? payload.finished_at - payload.created_at
              : null

        await db.generatedAsset.update({
          where: { id: asset.id },
          data: {
            status: 'ready',
            meshUrl,
            thumbnailUrl: payload.thumbnail_url ?? null,
            polyCount: payload.poly_count ?? null,
            fileSize: payload.file_size ?? null,
            albedoUrl: textureSet?.base_color ?? null,
            normalUrl: textureSet?.normal ?? null,
            roughnessUrl: textureSet?.roughness ?? null,
            metallicUrl: textureSet?.metallic ?? null,
            generationMs,
            errorMessage: null,
          },
        })

        // Notify the user their asset is ready
        await db.notification.create({
          data: {
            userId: asset.userId,
            type: 'BUILD_COMPLETE',
            title: '3D Asset Ready',
            body: `Your 3D model is ready${payload.poly_count ? ` (${payload.poly_count.toLocaleString()} polys)` : ''}. Open the editor to preview and use it.`,
            actionUrl: '/editor',
          },
        }).catch((notifErr) => {
          // Non-fatal — asset is ready regardless
          console.warn('[meshy-webhook] Failed to create notification:', notifErr)
        })

        // Log for future pipeline steps (optimization, CDN upload, Roblox registration)
        console.info('[meshy-webhook] Asset ready:', {
          assetId: asset.id,
          userId: asset.userId,
          meshUrl,
          polyCount: payload.poly_count,
        })

        break
      }

      case 'FAILED': {
        const errorMessage = payload.task_error?.message ?? 'Meshy generation failed'
        await db.generatedAsset.update({
          where: { id: asset.id },
          data: {
            status: 'failed',
            errorMessage,
          },
        })

        console.warn('[meshy-webhook] Asset generation failed:', {
          assetId: asset.id,
          meshyTaskId,
          errorMessage,
        })

        break
      }

      case 'EXPIRED': {
        await db.generatedAsset.update({
          where: { id: asset.id },
          data: {
            status: 'failed',
            errorMessage: 'Meshy task expired — generation timed out',
          },
        })

        console.warn('[meshy-webhook] Asset task expired:', {
          assetId: asset.id,
          meshyTaskId,
        })

        break
      }

      default: {
        // Unknown status — log for observability, do not error
        console.info('[meshy-webhook] Unhandled status:', {
          status: payload.status,
          meshyTaskId,
          assetId: asset.id,
        })
      }
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[meshy-webhook] Error processing event:', { meshyTaskId, message })
    Sentry.captureException(err, {
      tags: { webhook: 'meshy', status: payload.status },
      extra: { meshyTaskId },
    })
    // Return 200 so Meshy does not retry — the error is captured in Sentry.
    // A 5xx causes indefinite retries which could thrash the DB on a persistent error.
    return NextResponse.json({ received: true })
  }

  return NextResponse.json({ received: true })
}
