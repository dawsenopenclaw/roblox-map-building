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
