-- Add Roblox identity fields to User
-- Guarded because the User table was originally created via `prisma db push`
-- and has no CREATE TABLE migration in history — so the shadow DB used by
-- `migrate dev` will not have it. IF NOT EXISTS clauses on the columns also
-- make this safe to re-run on a DB that already has them (from db push).
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'User') THEN
    ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "robloxUserId" TEXT;
    ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "robloxUsername" TEXT;
    ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "robloxDisplayName" TEXT;
    ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "robloxAvatarUrl" TEXT;
    ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "robloxVerifiedAt" TIMESTAMP(3);

    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'User_robloxUserId_key') THEN
      CREATE UNIQUE INDEX "User_robloxUserId_key" ON "User"("robloxUserId");
    END IF;
  END IF;
END $$;
