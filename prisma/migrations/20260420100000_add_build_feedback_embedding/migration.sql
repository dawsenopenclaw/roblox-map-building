-- Add vector embedding column to BuildFeedback for semantic similarity search
-- Uses same 768-dim vectors as RobloxDocChunk (Gemini text-embedding-004)
ALTER TABLE "BuildFeedback" ADD COLUMN "embedding" vector(768);

-- Add buildType to track what kind of generation this was (build, script, terrain, image, mesh)
ALTER TABLE "BuildFeedback" ADD COLUMN "buildType" TEXT DEFAULT 'build';

-- IVFFlat cosine index for fast similarity search
-- lists=20 is appropriate for tables under 10K rows; increase to 50+ at scale
CREATE INDEX "BuildFeedback_embedding_idx" ON "BuildFeedback" USING ivfflat ("embedding" vector_cosine_ops) WITH (lists = 20);

-- Index for buildType-filtered queries
CREATE INDEX "BuildFeedback_buildType_score_idx" ON "BuildFeedback"("buildType", "score");
