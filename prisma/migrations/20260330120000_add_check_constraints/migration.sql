-- Migration: add_check_constraints + cascade_rule_fixes
-- Phase 13.5 — Data integrity constraints + safer FK cascade rules
-- Rollback: see comments below each statement
--
-- NOTE: This project was originally managed with `prisma db push`, so the
-- production DB already has the tables referenced here — but there are no
-- prior migration files that CREATE them. Each section is therefore wrapped
-- in a `DO $$ ... END $$` block guarded by an `information_schema.tables`
-- check so it:
--   (a) runs correctly against the real DB (where the tables exist), and
--   (b) silently no-ops on an empty shadow database used by `migrate dev`.
-- Once a baseline migration is generated (future work), the guards can be
-- removed. Do not delete them before that happens.

-- ─── Cascade rule fixes ────────────────────────────────────────────────────
-- These four FKs were CASCADE; changed to SET NULL because the child rows
-- are shared/audit data that must survive user deletion.

-- TemplateReview.reviewerId: reviews affect template averageRating — must not vanish
-- Rollback: ALTER TABLE "TemplateReview" ALTER COLUMN "reviewerId" SET NOT NULL;
--           ALTER TABLE "TemplateReview" DROP CONSTRAINT "TemplateReview_reviewerId_fkey";
--           ALTER TABLE "TemplateReview" ADD CONSTRAINT "TemplateReview_reviewerId_fkey"
--             FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE CASCADE;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'TemplateReview') THEN
    ALTER TABLE "TemplateReview" ALTER COLUMN "reviewerId" DROP NOT NULL;
    ALTER TABLE "TemplateReview" DROP CONSTRAINT IF EXISTS "TemplateReview_reviewerId_fkey";
    ALTER TABLE "TemplateReview" ADD CONSTRAINT "TemplateReview_reviewerId_fkey"
      FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- TeamInvite.invitedBy: pending invites must survive inviter deletion
-- Rollback: ALTER TABLE "TeamInvite" ALTER COLUMN "invitedBy" SET NOT NULL;
--           ALTER TABLE "TeamInvite" DROP CONSTRAINT "TeamInvite_invitedBy_fkey";
--           ALTER TABLE "TeamInvite" ADD CONSTRAINT "TeamInvite_invitedBy_fkey"
--             FOREIGN KEY ("invitedBy") REFERENCES "User"("id") ON DELETE CASCADE;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'TeamInvite') THEN
    ALTER TABLE "TeamInvite" ALTER COLUMN "invitedBy" DROP NOT NULL;
    ALTER TABLE "TeamInvite" DROP CONSTRAINT IF EXISTS "TeamInvite_invitedBy_fkey";
    ALTER TABLE "TeamInvite" ADD CONSTRAINT "TeamInvite_invitedBy_fkey"
      FOREIGN KEY ("invitedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- TeamActivity.userId: activity log is audit data — must survive user deletion
-- Rollback: ALTER TABLE "TeamActivity" ALTER COLUMN "userId" SET NOT NULL;
--           ALTER TABLE "TeamActivity" DROP CONSTRAINT "TeamActivity_userId_fkey";
--           ALTER TABLE "TeamActivity" ADD CONSTRAINT "TeamActivity_userId_fkey"
--             FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'TeamActivity') THEN
    ALTER TABLE "TeamActivity" ALTER COLUMN "userId" DROP NOT NULL;
    ALTER TABLE "TeamActivity" DROP CONSTRAINT IF EXISTS "TeamActivity_userId_fkey";
    ALTER TABLE "TeamActivity" ADD CONSTRAINT "TeamActivity_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- ProjectVersion.userId: version history is team-owned — must survive member deletion
-- Rollback: ALTER TABLE "ProjectVersion" ALTER COLUMN "userId" SET NOT NULL;
--           ALTER TABLE "ProjectVersion" DROP CONSTRAINT "ProjectVersion_userId_fkey";
--           ALTER TABLE "ProjectVersion" ADD CONSTRAINT "ProjectVersion_userId_fkey"
--             FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'ProjectVersion') THEN
    ALTER TABLE "ProjectVersion" ALTER COLUMN "userId" DROP NOT NULL;
    ALTER TABLE "ProjectVersion" DROP CONSTRAINT IF EXISTS "ProjectVersion_userId_fkey";
    ALTER TABLE "ProjectVersion" ADD CONSTRAINT "ProjectVersion_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- Ensures token balances can never go negative.
-- Rollback: ALTER TABLE "TokenBalance" DROP CONSTRAINT "balance_non_negative";
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'TokenBalance') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE table_schema = 'public' AND table_name = 'TokenBalance' AND constraint_name = 'balance_non_negative') THEN
      ALTER TABLE "TokenBalance" ADD CONSTRAINT "balance_non_negative" CHECK (balance >= 0);
    END IF;
  END IF;
END $$;

-- Ensures review ratings are always in the valid 1-5 range.
-- Rollback: ALTER TABLE "TemplateReview" DROP CONSTRAINT "rating_range";
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'TemplateReview') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE table_schema = 'public' AND table_name = 'TemplateReview' AND constraint_name = 'rating_range') THEN
      ALTER TABLE "TemplateReview" ADD CONSTRAINT "rating_range" CHECK (rating >= 1 AND rating <= 5);
    END IF;
  END IF;
END $$;

-- Ensures purchase amounts are never negative.
-- Rollback: ALTER TABLE "TemplatePurchase" DROP CONSTRAINT "amount_non_negative";
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'TemplatePurchase') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE table_schema = 'public' AND table_name = 'TemplatePurchase' AND constraint_name = 'amount_non_negative') THEN
      ALTER TABLE "TemplatePurchase" ADD CONSTRAINT "amount_non_negative" CHECK ("amountCents" >= 0);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE table_schema = 'public' AND table_name = 'TemplatePurchase' AND constraint_name = 'platform_fee_non_negative') THEN
      ALTER TABLE "TemplatePurchase" ADD CONSTRAINT "platform_fee_non_negative" CHECK ("platformFeeCents" >= 0);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE table_schema = 'public' AND table_name = 'TemplatePurchase' AND constraint_name = 'creator_payout_non_negative') THEN
      ALTER TABLE "TemplatePurchase" ADD CONSTRAINT "creator_payout_non_negative" CHECK ("creatorPayoutCents" >= 0);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE table_schema = 'public' AND table_name = 'TemplatePurchase' AND constraint_name = 'payout_within_amount') THEN
      ALTER TABLE "TemplatePurchase" ADD CONSTRAINT "payout_within_amount"
        CHECK ("platformFeeCents" + "creatorPayoutCents" <= "amountCents");
    END IF;
  END IF;
END $$;
