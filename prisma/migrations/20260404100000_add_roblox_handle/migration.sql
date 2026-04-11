-- AddColumn: User.robloxHandle (nullable string for Roblox connected account)
-- Guarded for the same reason as the preferences migration — the User table
-- was originally created via `prisma db push` and has no CREATE TABLE
-- migration in history.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'User') THEN
    ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "robloxHandle" TEXT;
  END IF;
END $$;
