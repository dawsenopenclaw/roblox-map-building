-- Add Newsletter and GeneratedAsset tables
-- Idempotent: safe to re-run on existing databases

-- ─── Newsletter ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "Newsletter" (
    "id" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "htmlContent" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "scheduledAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "recipientCount" INTEGER,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Newsletter_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "Newsletter_status_createdAt_idx"
    ON "Newsletter"("status", "createdAt");

DO $$ BEGIN
    ALTER TABLE "Newsletter"
        ADD CONSTRAINT "Newsletter_createdById_fkey"
        FOREIGN KEY ("createdById") REFERENCES "User"("id")
        ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- ─── GeneratedAsset ─────────────────────────────────────────────────────────
-- The base table was created in 0_init. This block is dual-purpose:
-- 1. CREATE TABLE IF NOT EXISTS — handles a fresh database (full table)
-- 2. ALTER TABLE ADD COLUMN IF NOT EXISTS — handles existing databases by
--    adding the new audio/generic provider fields without touching the base
--    columns. CREATE TABLE IF NOT EXISTS alone is a no-op on existing tables
--    and would silently leave them missing the new columns.

CREATE TABLE IF NOT EXISTS "GeneratedAsset" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "style" TEXT NOT NULL DEFAULT 'default',
    "status" TEXT NOT NULL DEFAULT 'queued',

    -- Meshy
    "meshyTaskId" TEXT,
    "meshUrl" TEXT,
    "thumbnailUrl" TEXT,
    "polyCount" INTEGER,

    -- Textures
    "albedoUrl" TEXT,
    "normalUrl" TEXT,
    "roughnessUrl" TEXT,
    "metallicUrl" TEXT,

    -- Roblox
    "robloxAssetId" TEXT,

    -- Audio + generic provider fields
    "externalTaskId" TEXT,
    "sourceUrl" TEXT,
    "moderationState" TEXT,
    "durationMs" INTEGER,
    "metadata" JSONB,

    -- Quality
    "qualityScore" DOUBLE PRECISION,
    "fileSize" INTEGER,

    -- Metadata
    "tokensCost" INTEGER NOT NULL DEFAULT 0,
    "generationMs" INTEGER,
    "errorMessage" TEXT,

    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "GeneratedAsset_pkey" PRIMARY KEY ("id")
);

-- Additive ALTERs for existing databases (no-op on fresh DB where the table
-- was just created with all columns above).
ALTER TABLE "GeneratedAsset" ADD COLUMN IF NOT EXISTS "externalTaskId" TEXT;
ALTER TABLE "GeneratedAsset" ADD COLUMN IF NOT EXISTS "sourceUrl" TEXT;
ALTER TABLE "GeneratedAsset" ADD COLUMN IF NOT EXISTS "moderationState" TEXT;
ALTER TABLE "GeneratedAsset" ADD COLUMN IF NOT EXISTS "durationMs" INTEGER;
ALTER TABLE "GeneratedAsset" ADD COLUMN IF NOT EXISTS "metadata" JSONB;
ALTER TABLE "GeneratedAsset" ADD COLUMN IF NOT EXISTS "completedAt" TIMESTAMP(3);

-- The `style` column was originally NOT NULL with no default in 0_init.
-- The Prisma schema now declares @default("default"). Add the default so new
-- inserts that omit `style` (e.g. audio assets) succeed.
ALTER TABLE "GeneratedAsset" ALTER COLUMN "style" SET DEFAULT 'default';

-- Unique constraint on meshyTaskId
DO $$ BEGIN
    CREATE UNIQUE INDEX "GeneratedAsset_meshyTaskId_key"
        ON "GeneratedAsset"("meshyTaskId");
EXCEPTION
    WHEN duplicate_table THEN NULL;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS "GeneratedAsset_userId_idx"
    ON "GeneratedAsset"("userId");

CREATE INDEX IF NOT EXISTS "GeneratedAsset_status_idx"
    ON "GeneratedAsset"("status");

CREATE INDEX IF NOT EXISTS "GeneratedAsset_meshyTaskId_idx"
    ON "GeneratedAsset"("meshyTaskId");

CREATE INDEX IF NOT EXISTS "GeneratedAsset_userId_status_idx"
    ON "GeneratedAsset"("userId", "status");

CREATE INDEX IF NOT EXISTS "GeneratedAsset_userId_createdAt_idx"
    ON "GeneratedAsset"("userId", "createdAt");

CREATE INDEX IF NOT EXISTS "GeneratedAsset_userId_type_createdAt_idx"
    ON "GeneratedAsset"("userId", "type", "createdAt");

-- Foreign key to User with cascade delete
DO $$ BEGIN
    ALTER TABLE "GeneratedAsset"
        ADD CONSTRAINT "GeneratedAsset_userId_fkey"
        FOREIGN KEY ("userId") REFERENCES "User"("id")
        ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;
