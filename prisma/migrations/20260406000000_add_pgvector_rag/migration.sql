-- Enable pgvector extension (requires superuser or rds_superuser on hosted PG)
CREATE EXTENSION IF NOT EXISTS vector;

-- Roblox documentation chunks with vector embeddings for RAG retrieval
-- Guarded with IF NOT EXISTS because the table may already exist in
-- environments where it was created via `prisma db push` before migrations
-- were introduced. Safe on both shadow DB (fresh) and prod DB (may have it).
CREATE TABLE IF NOT EXISTS "RobloxDocChunk" (
    "id"         TEXT NOT NULL DEFAULT gen_random_uuid(),
    "category"   TEXT NOT NULL,
    "title"      TEXT NOT NULL,
    "content"    TEXT NOT NULL,
    "source"     TEXT NOT NULL DEFAULT '',
    "tags"       TEXT[] NOT NULL DEFAULT '{}',
    "embedding"  vector(768) NOT NULL,
    "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RobloxDocChunk_pkey" PRIMARY KEY ("id")
);

-- Unique constraint for upsert (category + title)
CREATE UNIQUE INDEX IF NOT EXISTS "RobloxDocChunk_category_title_key" ON "RobloxDocChunk"("category", "title");

-- IVFFlat index for fast cosine similarity search
-- lists = sqrt(expected_rows) — start with 50, rebuild when data grows past 2500 rows
CREATE INDEX IF NOT EXISTS "RobloxDocChunk_embedding_idx" ON "RobloxDocChunk"
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 50);

-- Category filter index for scoped searches
CREATE INDEX IF NOT EXISTS "RobloxDocChunk_category_idx" ON "RobloxDocChunk"("category");
