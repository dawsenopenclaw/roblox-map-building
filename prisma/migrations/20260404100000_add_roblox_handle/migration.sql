-- AddColumn: User.robloxHandle (nullable string for Roblox connected account)
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "robloxHandle" TEXT;
