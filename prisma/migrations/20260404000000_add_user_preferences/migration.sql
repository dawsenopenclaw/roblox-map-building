-- AddColumn: User.preferences (nullable JSON for theme/font/accent cross-device sync)
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "preferences" JSONB;
