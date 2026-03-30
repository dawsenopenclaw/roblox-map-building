-- Manual CHECK constraints — apply with: psql $DATABASE_URL -f prisma/migrations/manual_checks.sql
-- These cannot be expressed in Prisma schema SDL and must be applied once per environment.
-- Safe to re-run: each uses IF NOT EXISTS via DO block to avoid duplicate constraint errors.

-- Token balance must be non-negative
ALTER TABLE "TokenBalance" ADD CONSTRAINT "balance_non_negative" CHECK (balance >= 0);

-- Review rating must be 1-5
ALTER TABLE "TemplateReview" ADD CONSTRAINT "rating_range" CHECK (rating >= 1 AND rating <= 5);

-- Purchase amount non-negative
ALTER TABLE "TemplatePurchase" ADD CONSTRAINT "amount_non_negative" CHECK ("amountCents" >= 0);
