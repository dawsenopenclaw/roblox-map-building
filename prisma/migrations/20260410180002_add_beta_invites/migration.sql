/*
  Warnings:

  - You are about to drop the column `embedding` on the `RobloxDocChunk` table. All the data in the column will be lost.

  NOTE: this migration is authored to be idempotent so it can be re-run
  safely against databases where it already applied partially (e.g. a
  previous failed deploy). All CREATE / DROP / ALTER statements are
  guarded with IF [NOT] EXISTS or wrapped in DO blocks.
*/
-- DropIndex
DROP INDEX IF EXISTS "RobloxDocChunk_embedding_idx";

-- AlterTable
ALTER TABLE "RobloxDocChunk" DROP COLUMN IF EXISTS "embedding";

-- AlterTable
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "betaAccess" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'BetaInvite'
    ) THEN
        CREATE TABLE "BetaInvite" (
            "id" TEXT NOT NULL,
            "code" TEXT NOT NULL,
            "createdById" TEXT,
            "usedById" TEXT,
            "usedAt" TIMESTAMP(3),
            "expiresAt" TIMESTAMP(3),
            "maxUses" INTEGER NOT NULL DEFAULT 1,
            "useCount" INTEGER NOT NULL DEFAULT 0,
            "bonusCredits" INTEGER NOT NULL DEFAULT 0,
            "cohort" TEXT,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

            CONSTRAINT "BetaInvite_pkey" PRIMARY KEY ("id")
        );
    END IF;
END $$;

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "BetaInvite_code_key" ON "BetaInvite"("code");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "BetaInvite_code_idx" ON "BetaInvite"("code");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "BetaInvite_cohort_idx" ON "BetaInvite"("cohort");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "AuditLog_userId_createdAt_idx" ON "AuditLog"("userId", "createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "TemplateFork_userId_idx" ON "TemplateFork"("userId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "TemplateFork_forkedItemId_idx" ON "TemplateFork"("forkedItemId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "TemplateLike_userId_idx" ON "TemplateLike"("userId");

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM pg_constraint WHERE conname = 'BetaInvite_createdById_fkey'
    ) THEN
        ALTER TABLE "BetaInvite"
            ADD CONSTRAINT "BetaInvite_createdById_fkey"
            FOREIGN KEY ("createdById") REFERENCES "User"("id")
            ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM pg_constraint WHERE conname = 'BetaInvite_usedById_fkey'
    ) THEN
        ALTER TABLE "BetaInvite"
            ADD CONSTRAINT "BetaInvite_usedById_fkey"
            FOREIGN KEY ("usedById") REFERENCES "User"("id")
            ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;
