-- AddColumn: User.preferences (nullable JSON for theme/font/accent cross-device sync)
-- Guarded because the User table was originally created via `prisma db push`
-- and has no CREATE TABLE migration in history — so the shadow DB used by
-- `migrate dev` will not have it.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'User') THEN
    ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "preferences" JSONB;
  END IF;
END $$;
