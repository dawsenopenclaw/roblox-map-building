-- Add learning system fields to BuildFeedback for the reward/feedback loop
ALTER TABLE "BuildFeedback" ADD COLUMN "prompt" TEXT;
ALTER TABLE "BuildFeedback" ADD COLUMN "category" TEXT;
ALTER TABLE "BuildFeedback" ADD COLUMN "partCount" INTEGER;
ALTER TABLE "BuildFeedback" ADD COLUMN "userVote" BOOLEAN;
ALTER TABLE "BuildFeedback" ADD COLUMN "playtestPass" BOOLEAN;

-- Index for category-based retrieval (find best examples per genre)
CREATE INDEX "BuildFeedback_category_score_idx" ON "BuildFeedback"("category", "score");

-- Index for user-voted examples (highest signal)
CREATE INDEX "BuildFeedback_userVote_idx" ON "BuildFeedback"("userVote");
