ALTER TABLE "TokenBalance" ADD CONSTRAINT "balance_non_negative" CHECK (balance >= 0);
ALTER TABLE "TemplateReview" ADD CONSTRAINT "rating_range" CHECK (rating >= 1 AND rating <= 5);
ALTER TABLE "TemplatePurchase" ADD CONSTRAINT "amount_non_negative" CHECK ("amountCents" >= 0);
ALTER TABLE "TemplatePurchase" ADD CONSTRAINT "platform_fee_non_negative" CHECK ("platformFeeCents" >= 0);
ALTER TABLE "TemplatePurchase" ADD CONSTRAINT "creator_payout_non_negative" CHECK ("creatorPayoutCents" >= 0);
ALTER TABLE "UserXP" ADD CONSTRAINT "total_xp_non_negative" CHECK ("totalXp" >= 0);
ALTER TABLE "UserXP" ADD CONSTRAINT "daily_xp_non_negative" CHECK ("dailyXpToday" >= 0);
ALTER TABLE "CreatorAccount" ADD CONSTRAINT "pending_balance_non_negative" CHECK ("pendingBalanceCents" >= 0);
