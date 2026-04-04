/**
 * BullMQ job queue for async 3D asset generation.
 *
 * Queue name: "asset-generation"
 *
 * Job types:
 *   mesh-generation   — text-to-3D mesh via Meshy AI
 *   texture-generation — PBR texture set via Fal AI
 *   blender-optimize  — mesh optimization pipeline via Blender
 *   roblox-upload     — upload finalized asset to Roblox Open Cloud
 *
 * Uses the ioredis connection from src/lib/redis.ts.
 * Redis URL priority: REDIS_URL → UPSTASH_REDIS_REST_URL (as a compat alias).
 *
 * Export surface:
 *   assetQueue       — the BullMQ Queue instance
 *   addJob()         — enqueue a typed job
 *   getJobStatus()   — poll job state + progress
 *   setupWorker()    — register job processors (call in a dedicated worker process)
 */

import 'server-only'
import { Queue, Worker, Job, QueueEvents } from 'bullmq'
import type { ConnectionOptions } from 'bullmq'
import { z } from 'zod'

// ── Redis connection ──────────────────────────────────────────────────────────

function buildConnection(): ConnectionOptions {
  const redisUrl =
    process.env.REDIS_URL ??
    process.env.UPSTASH_REDIS_REST_URL

  if (!redisUrl || redisUrl.trim().length < 10) {
    // No valid Redis URL — BullMQ will fail at enqueue time, not at import time
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[job-queue] REDIS_URL not set — BullMQ operations will fail at runtime')
    }
    return { host: 'localhost', port: 6379 }
  }

  // ioredis accepts a full URL string directly
  const url = new URL(redisUrl)
  const conn: ConnectionOptions & { password?: string; tls?: object } = {
    host:     url.hostname,
    port:     Number(url.port) || 6379,
    username: url.username || undefined,
    password: url.password || undefined,
  }

  // Enable TLS for rediss:// scheme (Upstash, Render, Railway)
  if (url.protocol === 'rediss:') {
    conn.tls = {}
  }

  return conn
}

const redisConnection = buildConnection()

// ── Job type definitions ──────────────────────────────────────────────────────

export type JobType =
  | 'mesh-generation'
  | 'texture-generation'
  | 'blender-optimize'
  | 'roblox-upload'

// Per-type payload schemas

const meshGenerationPayloadSchema = z.object({
  type:     z.literal('mesh-generation'),
  prompt:   z.string().min(1).max(2000),
  quality:  z.enum(['draft', 'standard', 'premium']).default('standard'),
  polyTarget: z.number().int().min(500).max(50_000).default(5_000),
  artStyle: z.string().default('low-poly'),
  userId:   z.string(),
})

const textureGenerationPayloadSchema = z.object({
  type:       z.literal('texture-generation'),
  prompt:     z.string().min(1).max(2000),
  resolution: z.number().int().default(1024),
  seamless:   z.boolean().default(true),
  meshJobId:  z.string().optional(),
  userId:     z.string(),
})

const blenderOptimizePayloadSchema = z.object({
  type:        z.literal('blender-optimize'),
  meshUrl:     z.string().url(),
  targetTris:  z.number().int().min(100).max(100_000).default(10_000),
  exportFormat: z.enum(['glb', 'fbx', 'obj']).default('glb'),
  userId:      z.string(),
})

const robloxUploadPayloadSchema = z.object({
  type:       z.literal('roblox-upload'),
  assetPath:  z.string(),
  assetName:  z.string().max(250),
  creatorId:  z.string(),
  assetType:  z.enum(['Model', 'MeshPart', 'Image']).default('Model'),
  userId:     z.string(),
})

export type MeshGenerationPayload   = z.infer<typeof meshGenerationPayloadSchema>
export type TextureGenerationPayload = z.infer<typeof textureGenerationPayloadSchema>
export type BlenderOptimizePayload  = z.infer<typeof blenderOptimizePayloadSchema>
export type RobloxUploadPayload     = z.infer<typeof robloxUploadPayloadSchema>

/** MeshGenerationPayload extended with the _assetId field injected by startMeshPipeline */
export interface MeshGenerationPayloadWithAsset extends MeshGenerationPayload {
  /** Injected by startMeshPipeline — the GeneratedAsset.id to update */
  _assetId?: string
}

export type JobPayload =
  | MeshGenerationPayload
  | TextureGenerationPayload
  | BlenderOptimizePayload
  | RobloxUploadPayload

// Result shapes per job type

export interface MeshGenerationResult {
  meshUrl:      string | null
  thumbnailUrl: string | null
  polyCount:    number | null
  taskId:       string
}

export interface TextureGenerationResult {
  albedo:    string | null
  normal:    string | null
  roughness: string | null
  metallic:  string | null
}

export interface BlenderOptimizeResult {
  outputUrl:  string
  triCount:   number
  fileSizeMb: number
}

export interface RobloxUploadResult {
  assetId:      string
  rbxAssetUrl:  string
  operationId:  string
}

export type JobResult =
  | MeshGenerationResult
  | TextureGenerationResult
  | BlenderOptimizeResult
  | RobloxUploadResult

// ── Queue instance ────────────────────────────────────────────────────────────

const QUEUE_NAME = 'asset-generation'

export const assetQueue = new Queue<JobPayload, JobResult, JobType>(QUEUE_NAME, {
  connection: redisConnection,
  defaultJobOptions: {
    attempts:    3,
    backoff:     { type: 'exponential', delay: 2_000 },
    removeOnComplete: { count: 500 },  // keep last 500 completed jobs for status polling
    removeOnFail:     { count: 200 },
  },
})

const _queueEvents = new QueueEvents(QUEUE_NAME, { connection: redisConnection })

// ── addJob ────────────────────────────────────────────────────────────────────

export interface AddJobOptions {
  /** Override default BullMQ job priority (lower = higher priority) */
  priority?: number
  /** Delay before processing starts, in milliseconds */
  delayMs?: number
  /** Link to a parent job — child runs after parent completes */
  parentJobId?: string
}

/**
 * Enqueues a typed asset-generation job.
 *
 * @returns The BullMQ job ID (use with getJobStatus to poll progress)
 */
export async function addJob(
  payload: JobPayload,
  opts: AddJobOptions = {}
): Promise<string> {
  const jobName = payload.type as JobType

  const job = await assetQueue.add(jobName, payload, {
    priority: opts.priority,
    delay:    opts.delayMs,
    ...(opts.parentJobId
      ? { parent: { id: opts.parentJobId, queue: `bull:${QUEUE_NAME}` } }
      : {}),
  })

  return job.id ?? `${jobName}-${Date.now()}`
}

// ── getJobStatus ──────────────────────────────────────────────────────────────

export type JobStatusState =
  | 'waiting'
  | 'active'
  | 'completed'
  | 'failed'
  | 'delayed'
  | 'unknown'

export interface JobStatus {
  jobId:       string
  type:        JobType | null
  state:       JobStatusState
  /** 0–100 */
  progress:    number
  /** Only present when state === 'completed' */
  result:      JobResult | null
  /** Only present when state === 'failed' */
  failReason:  string | null
  /** ISO timestamp when the job was created */
  createdAt:   string | null
  /** ISO timestamp when the job finished (completed or failed) */
  finishedAt:  string | null
}

/**
 * Fetches the current status of a job by ID.
 *
 * Returns state: 'unknown' if the job has been cleaned from Redis
 * (completed jobs are kept for 500 entries, failed for 200).
 */
export async function getJobStatus(jobId: string): Promise<JobStatus> {
  const job = await Job.fromId<JobPayload, JobResult, JobType>(assetQueue, jobId)

  if (!job) {
    return {
      jobId,
      type:       null,
      state:      'unknown',
      progress:   0,
      result:     null,
      failReason: null,
      createdAt:  null,
      finishedAt: null,
    }
  }

  const state     = await job.getState()
  const progress  = typeof job.progress === 'number' ? job.progress : 0
  const result    = state === 'completed' ? (job.returnvalue ?? null) : null
  const failReason = state === 'failed' ? (job.failedReason ?? null) : null

  const createdAt  = job.timestamp  ? new Date(job.timestamp).toISOString()        : null
  const finishedAt = job.finishedOn ? new Date(job.finishedOn).toISOString()       : null

  return {
    jobId,
    type:       (job.name as JobType) ?? null,
    state:      (state as JobStatusState) ?? 'unknown',
    progress,
    result,
    failReason,
    createdAt,
    finishedAt,
  }
}

// ── Worker setup ──────────────────────────────────────────────────────────────

export type JobProcessor<T extends JobPayload = JobPayload> = (
  job: Job<T, JobResult, JobType>
) => Promise<JobResult>

export interface WorkerProcessors {
  'mesh-generation'?:    JobProcessor<MeshGenerationPayload>
  'texture-generation'?: JobProcessor<TextureGenerationPayload>
  'blender-optimize'?:   JobProcessor<BlenderOptimizePayload>
  'roblox-upload'?:      JobProcessor<RobloxUploadPayload>
}

/**
 * Registers job processors and starts the BullMQ Worker.
 *
 * Call this from a dedicated worker process (e.g. scripts/worker.ts),
 * not from the Next.js app server — workers run long-lived background jobs.
 *
 * @example
 * // scripts/worker.ts
 * import { setupWorker } from '@/lib/job-queue'
 * setupWorker({
 *   'mesh-generation': async (job) => { ... },
 *   'texture-generation': async (job) => { ... },
 * })
 */
export function setupWorker(processors: WorkerProcessors): Worker<JobPayload, JobResult, JobType> {
  const worker = new Worker<JobPayload, JobResult, JobType>(
    QUEUE_NAME,
    async (job) => {
      const processor = processors[job.name as JobType]

      if (!processor) {
        throw new Error(`No processor registered for job type: ${job.name}`)
      }

      // Cast is safe — BullMQ guarantees job.name matches the payload we enqueued
      return (processor as JobProcessor)(job as Job<JobPayload, JobResult, JobType>)
    },
    {
      connection: redisConnection,
      concurrency: 5,
    }
  )

  worker.on('completed', (_job) => {
    // Completion is tracked via Redis progress state; no console output needed
  })

  worker.on('failed', (job, err) => {
    console.error(`[job-queue] Failed job ${job?.id} (${job?.name}): ${err.message}`)
  })

  worker.on('error', (err) => {
    console.error('[job-queue] Worker error:', err)
  })

  return worker
}
