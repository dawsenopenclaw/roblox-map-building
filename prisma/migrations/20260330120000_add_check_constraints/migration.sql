-- Migration: add_check_constraints + cascade_rule_fixes
-- Phase 13.5 — Data integrity constraints + safer FK cascade rules
-- Rollback: see comments below each statement

-- ─── Cascade rule fixes ────────────────────────────────────────────────────
-- These four FKs were CASCADE; changed to SET NULL because the child rows
-- are shared/audit data that must survive user deletion.

-- TemplateReview.reviewerId: reviews affect template averageRating — must not vanish
-- Rollback: ALTER TABLE "TemplateReview" ALTER COLUMN "reviewerId" SET NOT NULL;
--           ALTER TABLE "TemplateReview" DROP CONSTRAINT "TemplateReview_reviewerId_fkey";
--           ALTER TABLE "TemplateReview" ADD CONSTRAINT "TemplateReview_reviewerId_fkey"
--             FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE CASCADE;
ALTER TABLE "TemplateReview" ALTER COLUMN "reviewerId" DROP NOT NULL;
ALTER TABLE "TemplateReview" DROP CONSTRAINT IF EXISTS "TemplateReview_reviewerId_fkey";
ALTER TABLE "TemplateReview" ADD CONSTRAINT "TemplateReview_reviewerId_fkey"
  FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- TeamInvite.invitedBy: pending invites must survive inviter deletion
-- Rollback: ALTER TABLE "TeamInvite" ALTER COLUMN "invitedBy" SET NOT NULL;
--           ALTER TABLE "TeamInvite" DROP CONSTRAINT "TeamInvite_invitedBy_fkey";
--           ALTER TABLE "TeamInvite" ADD CONSTRAINT "TeamInvite_invitedBy_fkey"
--             FOREIGN KEY ("invitedBy") REFERENCES "User"("id") ON DELETE CASCADE;
ALTER TABLE "TeamInvite" ALTER COLUMN "invitedBy" DROP NOT NULL;
ALTER TABLE "TeamInvite" DROP CONSTRAINT IF EXISTS "TeamInvite_invitedBy_fkey";
ALTER TABLE "TeamInvite" ADD CONSTRAINT "TeamInvite_invitedBy_fkey"
  FOREIGN KEY ("invitedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- TeamActivity.userId: activity log is audit data — must survive user deletion
-- Rollback: ALTER TABLE "TeamActivity" ALTER COLUMN "userId" SET NOT NULL;
--           ALTER TABLE "TeamActivity" DROP CONSTRAINT "TeamActivity_userId_fkey";
--           ALTER TABLE "TeamActivity" ADD CONSTRAINT "TeamActivity_userId_fkey"
--             FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE;
ALTER TABLE "TeamActivity" ALTER COLUMN "userId" DROP NOT NULL;
ALTER TABLE "TeamActivity" DROP CONSTRAINT IF EXISTS "TeamActivity_userId_fkey";
ALTER TABLE "TeamActivity" ADD CONSTRAINT "TeamActivity_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ProjectVersion.userId: version history is team-owned — must survive member deletion
-- Rollback: ALTER TABLE "ProjectVersion" ALTER COLUMN "userId" SET NOT NULL;
--           ALTER TABLE "ProjectVersion" DROP CONSTRAINT "ProjectVersion_userId_fkey";
--           ALTER TABLE "ProjectVersion" ADD CONSTRAINT "ProjectVersion_userId_fkey"
--             FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE;
ALTER TABLE "ProjectVersion" ALTER COLUMN "userId" DROP NOT NULL;
ALTER TABLE "ProjectVersion" DROP CONSTRAINT IF EXISTS "ProjectVersion_userId_fkey";
ALTER TABLE "ProjectVersion" ADD CONSTRAINT "ProjectVersion_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Ensures token balances can never go negative.
-- Rollback: ALTER TABLE "TokenBalance" DROP CONSTRAINT "balance_non_negative";
ALTER TABLE "TokenBalance" ADD CONSTRAINT "balance_non_negative" CHECK (balance >= 0);

-- Ensures review ratings are always in the valid 1-5 range.
-- Rollback: ALTER TABLE "TemplateReview" DROP CONSTRAINT "rating_range";
ALTER TABLE "TemplateReview" ADD CONSTRAINT "rating_range" CHECK (rating >= 1 AND rating <= 5);

-- Ensures purchase amounts are never negative.
-- Rollback: ALTER TABLE "TemplatePurchase" DROP CONSTRAINT "amount_non_negative";
ALTER TABLE "TemplatePurchase" ADD CONSTRAINT "amount_non_negative" CHECK ("amountCents" >= 0);

-- Ensures platform fee is never negative (a zero fee is valid for free templates).
-- Rollback: ALTER TABLE "TemplatePurchase" DROP CONSTRAINT "platform_fee_non_negative";
ALTER TABLE "TemplatePurchase" ADD CONSTRAINT "platform_fee_non_negative" CHECK ("platformFeeCents" >= 0);

-- Ensures creator payout is never negative.
-- Rollback: ALTER TABLE "TemplatePurchase" DROP CONSTRAINT "creator_payout_non_negative";
ALTER TABLE "TemplatePurchase" ADD CONSTRAINT "creator_payout_non_negative" CHECK ("creatorPayoutCents" >= 0);

-- Ensures creator payout never exceeds the total purchase amount (fee + payout <= amount).
-- Rollback: ALTER TABLE "TemplatePurchase" DROP CONSTRAINT "payout_within_amount";
ALTER TABLE "TemplatePurchase" ADD CONSTRAINT "payout_within_amount"
  CHECK ("platformFeeCents" + "creatorPayoutCents" <= "amountCents");
