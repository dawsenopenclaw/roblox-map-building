-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "public"."AchievementCategory" AS ENUM ('FIRST_STEPS', 'VELOCITY', 'MARKETPLACE', 'COMMUNITY', 'QUALITY', 'EXPLORATION', 'SOCIAL');

-- CreateEnum
CREATE TYPE "public"."ApiKeyTier" AS ENUM ('FREE', 'HOBBY', 'CREATOR', 'STUDIO');

-- CreateEnum
CREATE TYPE "public"."DonationStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "public"."EarningStatus" AS ENUM ('PENDING', 'PROCESSING', 'PAID', 'FAILED', 'REFUNDED', 'FROZEN');

-- CreateEnum
CREATE TYPE "public"."InviteStatus" AS ENUM ('PENDING', 'ACCEPTED', 'EXPIRED', 'REVOKED');

-- CreateEnum
CREATE TYPE "public"."NotificationChannel" AS ENUM ('EMAIL', 'SMS', 'PUSH', 'IN_APP');

-- CreateEnum
CREATE TYPE "public"."NotificationType" AS ENUM ('BUILD_COMPLETE', 'BUILD_FAILED', 'TOKEN_LOW', 'TOKEN_DEPLETED', 'SALE', 'REFERRAL_EARNED', 'TEAM_INVITE', 'ACHIEVEMENT_UNLOCKED', 'SYSTEM', 'WEEKLY_DIGEST', 'TEMPLATE_PURCHASED', 'PAYOUT_COMPLETED', 'REVIEW_RECEIVED', 'PAYOUT_FAILED');

-- CreateEnum
CREATE TYPE "public"."PayoutStatus" AS ENUM ('PENDING', 'PROCESSING', 'PAID', 'FAILED', 'REFUNDED', 'FROZEN');

-- CreateEnum
CREATE TYPE "public"."ReferralStatus" AS ENUM ('PENDING', 'CONVERTED', 'PAID', 'EXPIRED', 'INVALID');

-- CreateEnum
CREATE TYPE "public"."ScanStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETE', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."SubscriptionStatus" AS ENUM ('ACTIVE', 'PAST_DUE', 'CANCELED', 'TRIALING', 'INCOMPLETE', 'INCOMPLETE_EXPIRED', 'PAUSED', 'UNPAID');

-- CreateEnum
CREATE TYPE "public"."SubscriptionTier" AS ENUM ('FREE', 'HOBBY', 'CREATOR', 'STUDIO');

-- CreateEnum
CREATE TYPE "public"."TeamRole" AS ENUM ('OWNER', 'ADMIN', 'EDITOR', 'VIEWER');

-- CreateEnum
CREATE TYPE "public"."TemplateCategory" AS ENUM ('GAME_TEMPLATE', 'MAP_TEMPLATE', 'UI_KIT', 'SCRIPT', 'ASSET', 'SOUND', 'PLUGIN');

-- CreateEnum
CREATE TYPE "public"."TemplateStatus" AS ENUM ('DRAFT', 'PENDING_REVIEW', 'PUBLISHED', 'REJECTED', 'ARCHIVED', 'TAKEDOWN');

-- CreateEnum
CREATE TYPE "public"."TokenGrantJobStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "public"."TokenTransactionType" AS ENUM ('PURCHASE', 'SPEND', 'REFUND', 'BONUS', 'ROLLOVER', 'SUBSCRIPTION_GRANT', 'EXPIRY');

-- CreateEnum
CREATE TYPE "public"."UserRole" AS ENUM ('USER', 'ADMIN', 'CREATOR', 'MODERATOR');

-- CreateEnum
CREATE TYPE "public"."XPEventType" AS ENUM ('BUILD', 'PUBLISH', 'SALE', 'REFERRAL', 'ACHIEVEMENT', 'STREAK_BONUS', 'DAILY_LOGIN', 'REVIEW_GIVEN', 'PURCHASE');

-- CreateEnum
CREATE TYPE "public"."XPTier" AS ENUM ('NOVICE', 'APPRENTICE', 'BUILDER', 'MASTER', 'LEGEND', 'MYTHIC');

-- CreateTable
CREATE TABLE "public"."Achievement" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "category" "public"."AchievementCategory" NOT NULL,
    "xpReward" INTEGER NOT NULL DEFAULT 0,
    "condition" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Achievement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ApiKey" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "keyHash" TEXT NOT NULL,
    "prefix" TEXT NOT NULL,
    "scopes" TEXT[],
    "tier" "public"."ApiKeyTier" NOT NULL DEFAULT 'FREE',
    "revokedAt" TIMESTAMP(3),
    "lastUsedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "rotatedFromId" TEXT,
    "rotatedFromGraceEndsAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApiKey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ApiUsageRecord" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "apiKeyId" TEXT,
    "provider" TEXT NOT NULL,
    "operation" TEXT NOT NULL,
    "httpMethod" TEXT,
    "httpPath" TEXT,
    "statusCode" INTEGER,
    "tokensUsed" INTEGER NOT NULL DEFAULT 0,
    "costUsdMicro" INTEGER NOT NULL DEFAULT 0,
    "durationMs" INTEGER,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApiUsageRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "resourceId" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Build" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "buildType" TEXT NOT NULL DEFAULT 'general',
    "prompt" TEXT NOT NULL,
    "tokensUsed" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "projectId" TEXT,

    CONSTRAINT "Build_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CharityDonation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "stripeTransferId" TEXT,
    "charitySlug" TEXT NOT NULL,
    "charityName" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "sourcePurchaseId" TEXT,
    "status" "public"."DonationStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "processedAt" TIMESTAMP(3),

    CONSTRAINT "CharityDonation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ChatMessage" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "metadata" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChatMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ChatSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT 'New Chat',
    "aiMode" TEXT NOT NULL DEFAULT 'build',
    "model" TEXT NOT NULL DEFAULT 'claude-3-5-sonnet',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChatSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CreatorAccount" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "stripeAccountId" TEXT NOT NULL,
    "chargesEnabled" BOOLEAN NOT NULL DEFAULT false,
    "payoutsEnabled" BOOLEAN NOT NULL DEFAULT false,
    "detailsSubmitted" BOOLEAN NOT NULL DEFAULT false,
    "pendingBalanceCents" INTEGER NOT NULL DEFAULT 0,
    "totalEarnedCents" INTEGER NOT NULL DEFAULT 0,
    "lastPayoutAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CreatorAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CreatorEarning" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "templateId" TEXT,
    "templateName" TEXT,
    "amountCents" INTEGER NOT NULL,
    "netCents" INTEGER NOT NULL,
    "buyerId" TEXT,
    "status" "public"."EarningStatus" NOT NULL DEFAULT 'PENDING',
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CreatorEarning_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DailyCostSnapshot" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "providerCosts" JSONB NOT NULL,
    "totalCostUsdMicro" INTEGER NOT NULL,
    "totalRevenueMicro" INTEGER NOT NULL,
    "marginMicro" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyCostSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."GameGenome" (
    "id" TEXT NOT NULL,
    "scanId" TEXT NOT NULL,
    "gameType" TEXT NOT NULL,
    "targetAge" TEXT NOT NULL,
    "sessionLength" TEXT NOT NULL,
    "monetizationModel" TEXT NOT NULL,
    "progressionPace" TEXT NOT NULL,
    "zoneDensity" TEXT NOT NULL,
    "artStyle" TEXT NOT NULL,
    "retentionDriver" TEXT NOT NULL,
    "estimatedDau" TEXT NOT NULL,
    "engagementLoop" TEXT NOT NULL,
    "updateCadence" TEXT NOT NULL,
    "communitySize" TEXT NOT NULL,
    "scores" JSONB NOT NULL,
    "genreAverages" JSONB,
    "rawRobloxData" JSONB,
    "visionAnalysis" JSONB,
    "recommendations" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GameGenome_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."GameScan" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "robloxUrl" TEXT NOT NULL,
    "robloxPlaceId" TEXT,
    "gameName" TEXT,
    "status" "public"."ScanStatus" NOT NULL DEFAULT 'PENDING',
    "errorMsg" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GameScan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."GeneratedAsset" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "style" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'queued',
    "meshyTaskId" TEXT,
    "meshUrl" TEXT,
    "thumbnailUrl" TEXT,
    "polyCount" INTEGER,
    "albedoUrl" TEXT,
    "normalUrl" TEXT,
    "roughnessUrl" TEXT,
    "metallicUrl" TEXT,
    "robloxAssetId" TEXT,
    "qualityScore" DOUBLE PRECISION,
    "fileSize" INTEGER,
    "tokensCost" INTEGER NOT NULL DEFAULT 0,
    "generationMs" INTEGER,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GeneratedAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Gift" (
    "id" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "recipientEmail" TEXT NOT NULL,
    "giftType" TEXT NOT NULL,
    "tier" TEXT,
    "tokenAmount" INTEGER,
    "message" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "stripeSessionId" TEXT,
    "redeemCode" TEXT NOT NULL,
    "redeemedById" TEXT,
    "redeemedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Gift_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "public"."NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "actionUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."NotificationPreference" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "public"."NotificationType" NOT NULL,
    "channel" "public"."NotificationChannel" NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationPreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Project" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "teamId" TEXT,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ProjectVersion" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "userId" TEXT,
    "version" INTEGER NOT NULL,
    "message" TEXT,
    "snapshot" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjectVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Referral" (
    "id" TEXT NOT NULL,
    "referrerId" TEXT NOT NULL,
    "referredId" TEXT,
    "code" TEXT NOT NULL,
    "status" "public"."ReferralStatus" NOT NULL DEFAULT 'PENDING',
    "commissionCents" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "convertedAt" TIMESTAMP(3),

    CONSTRAINT "Referral_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."RobloxDocChunk" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT '',
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "embedding" vector(768) NOT NULL,

    CONSTRAINT "RobloxDocChunk_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Streak" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "loginStreak" INTEGER NOT NULL DEFAULT 0,
    "buildStreak" INTEGER NOT NULL DEFAULT 0,
    "longestLoginStreak" INTEGER NOT NULL DEFAULT 0,
    "longestBuildStreak" INTEGER NOT NULL DEFAULT 0,
    "lastLoginDate" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastBuildDate" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "totalLogins" INTEGER NOT NULL DEFAULT 0,
    "totalBuilds" INTEGER NOT NULL DEFAULT 0,
    "claimedMilestones" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Streak_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Subscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "stripeCustomerId" TEXT NOT NULL,
    "stripeSubscriptionId" TEXT,
    "stripePriceId" TEXT,
    "tier" "public"."SubscriptionTier" NOT NULL DEFAULT 'FREE',
    "status" "public"."SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "currentPeriodStart" TIMESTAMP(3),
    "currentPeriodEnd" TIMESTAMP(3),
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "trialEnd" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Team" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "slug" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Team_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TeamActivity" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TeamActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TeamInvite" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "invitedBy" TEXT,
    "email" TEXT,
    "token" TEXT NOT NULL,
    "role" "public"."TeamRole" NOT NULL DEFAULT 'EDITOR',
    "status" "public"."InviteStatus" NOT NULL DEFAULT 'PENDING',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeamInvite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TeamMember" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "public"."TeamRole" NOT NULL DEFAULT 'VIEWER',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeamMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Template" (
    "id" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" "public"."TemplateCategory" NOT NULL,
    "status" "public"."TemplateStatus" NOT NULL DEFAULT 'DRAFT',
    "priceCents" INTEGER NOT NULL DEFAULT 0,
    "rbxmFileUrl" TEXT,
    "thumbnailUrl" TEXT,
    "tags" TEXT[],
    "downloads" INTEGER NOT NULL DEFAULT 0,
    "averageRating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "reviewCount" INTEGER NOT NULL DEFAULT 0,
    "stripeProductId" TEXT,
    "stripePriceId" TEXT,
    "featuredAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "forkCount" INTEGER NOT NULL DEFAULT 0,
    "likeCount" INTEGER NOT NULL DEFAULT 0,
    "trending" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "viewCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Template_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TemplateFavorite" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TemplateFavorite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TemplateFork" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "originalItemId" TEXT NOT NULL,
    "forkedItemId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TemplateFork_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TemplateLike" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TemplateLike_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TemplatePurchase" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "stripePaymentIntentId" TEXT,
    "amountCents" INTEGER NOT NULL,
    "platformFeeCents" INTEGER NOT NULL,
    "creatorPayoutCents" INTEGER NOT NULL,
    "stripeTransferId" TEXT,
    "payoutStatus" "public"."PayoutStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TemplatePurchase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TemplateReview" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "reviewerId" TEXT,
    "purchaseId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "body" TEXT,
    "creatorResponse" TEXT,
    "respondedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TemplateReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TemplateScreenshot" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "altText" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TemplateScreenshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TokenBalance" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "balance" INTEGER NOT NULL DEFAULT 0,
    "lifetimeEarned" INTEGER NOT NULL DEFAULT 0,
    "lifetimeSpent" INTEGER NOT NULL DEFAULT 0,
    "rolloverTokens" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TokenBalance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TokenGrantJob" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "type" "public"."TokenTransactionType" NOT NULL,
    "description" TEXT NOT NULL,
    "metadata" JSONB,
    "invoiceId" TEXT,
    "sessionId" TEXT,
    "status" "public"."TokenGrantJobStatus" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TokenGrantJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TokenTransaction" (
    "id" TEXT NOT NULL,
    "balanceId" TEXT NOT NULL,
    "type" "public"."TokenTransactionType" NOT NULL,
    "amount" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TokenTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "clerkId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "username" TEXT,
    "displayName" TEXT,
    "avatarUrl" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "isUnder13" BOOLEAN NOT NULL DEFAULT false,
    "parentEmail" TEXT,
    "parentConsentAt" TIMESTAMP(3),
    "parentConsentToken" TEXT,
    "parentConsentTokenExp" TIMESTAMP(3),
    "role" "public"."UserRole" NOT NULL DEFAULT 'USER',
    "marketingEmailsOptOut" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "referralCode" TEXT,
    "monthlyReferralCount" INTEGER NOT NULL DEFAULT 0,
    "monthlyReferralMonth" TEXT NOT NULL DEFAULT '',
    "charityChoice" TEXT,
    "phone" TEXT,
    "bio" TEXT,
    "discordHandle" TEXT,
    "githubHandle" TEXT,
    "preferences" JSONB,
    "robloxAvatarUrl" TEXT,
    "robloxDisplayName" TEXT,
    "robloxHandle" TEXT,
    "robloxUserId" TEXT,
    "robloxUsername" TEXT,
    "robloxVerifiedAt" TIMESTAMP(3),
    "twitterHandle" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UserAchievement" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "achievementId" TEXT NOT NULL,
    "unlockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserAchievement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UserXP" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "totalXp" INTEGER NOT NULL DEFAULT 0,
    "tier" "public"."XPTier" NOT NULL DEFAULT 'NOVICE',
    "dailyXpToday" INTEGER NOT NULL DEFAULT 0,
    "dailyXpDate" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserXP_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."VersionDiff" (
    "id" TEXT NOT NULL,
    "fromVersionId" TEXT NOT NULL,
    "toVersionId" TEXT NOT NULL,
    "diff" JSONB NOT NULL,
    "summary" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VersionDiff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Waitlist" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'download_page',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Waitlist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."WebhookDelivery" (
    "id" TEXT NOT NULL,
    "endpointId" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "statusCode" INTEGER,
    "responseBody" TEXT,
    "attempt" INTEGER NOT NULL DEFAULT 1,
    "success" BOOLEAN NOT NULL DEFAULT false,
    "nextRetryAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WebhookDelivery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."WebhookEndpoint" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "secret" TEXT NOT NULL,
    "events" TEXT[],
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WebhookEndpoint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."XPEvent" (
    "id" TEXT NOT NULL,
    "userXpId" TEXT NOT NULL,
    "type" "public"."XPEventType" NOT NULL,
    "amount" INTEGER NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "XPEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ZoneLock" (
    "id" TEXT NOT NULL,
    "teamMemberId" TEXT NOT NULL,
    "zoneId" TEXT NOT NULL,
    "zoneName" TEXT,
    "lockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ZoneLock_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Achievement_slug_key" ON "public"."Achievement"("slug" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "ApiKey_keyHash_key" ON "public"."ApiKey"("keyHash" ASC);

-- CreateIndex
CREATE INDEX "ApiKey_prefix_idx" ON "public"."ApiKey"("prefix" ASC);

-- CreateIndex
CREATE INDEX "ApiKey_revokedAt_idx" ON "public"."ApiKey"("revokedAt" ASC);

-- CreateIndex
CREATE INDEX "ApiKey_rotatedFromGraceEndsAt_idx" ON "public"."ApiKey"("rotatedFromGraceEndsAt" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "ApiKey_rotatedFromId_key" ON "public"."ApiKey"("rotatedFromId" ASC);

-- CreateIndex
CREATE INDEX "ApiKey_userId_idx" ON "public"."ApiKey"("userId" ASC);

-- CreateIndex
CREATE INDEX "ApiKey_userId_revokedAt_idx" ON "public"."ApiKey"("userId" ASC, "revokedAt" ASC);

-- CreateIndex
CREATE INDEX "ApiUsageRecord_apiKeyId_createdAt_idx" ON "public"."ApiUsageRecord"("apiKeyId" ASC, "createdAt" ASC);

-- CreateIndex
CREATE INDEX "ApiUsageRecord_apiKeyId_idx" ON "public"."ApiUsageRecord"("apiKeyId" ASC);

-- CreateIndex
CREATE INDEX "ApiUsageRecord_createdAt_idx" ON "public"."ApiUsageRecord"("createdAt" ASC);

-- CreateIndex
CREATE INDEX "ApiUsageRecord_httpPath_createdAt_idx" ON "public"."ApiUsageRecord"("httpPath" ASC, "createdAt" ASC);

-- CreateIndex
CREATE INDEX "ApiUsageRecord_provider_idx" ON "public"."ApiUsageRecord"("provider" ASC);

-- CreateIndex
CREATE INDEX "ApiUsageRecord_userId_createdAt_idx" ON "public"."ApiUsageRecord"("userId" ASC, "createdAt" ASC);

-- CreateIndex
CREATE INDEX "ApiUsageRecord_userId_idx" ON "public"."ApiUsageRecord"("userId" ASC);

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "public"."AuditLog"("action" ASC);

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "public"."AuditLog"("createdAt" ASC);

-- CreateIndex
CREATE INDEX "AuditLog_resource_resourceId_createdAt_idx" ON "public"."AuditLog"("resource" ASC, "resourceId" ASC, "createdAt" ASC);

-- CreateIndex
CREATE INDEX "AuditLog_resource_resourceId_idx" ON "public"."AuditLog"("resource" ASC, "resourceId" ASC);

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "public"."AuditLog"("userId" ASC);

-- CreateIndex
CREATE INDEX "Build_createdAt_idx" ON "public"."Build"("createdAt" ASC);

-- CreateIndex
CREATE INDEX "Build_projectId_idx" ON "public"."Build"("projectId" ASC);

-- CreateIndex
CREATE INDEX "Build_userId_createdAt_idx" ON "public"."Build"("userId" ASC, "createdAt" ASC);

-- CreateIndex
CREATE INDEX "Build_userId_idx" ON "public"."Build"("userId" ASC);

-- CreateIndex
CREATE INDEX "CharityDonation_createdAt_idx" ON "public"."CharityDonation"("createdAt" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "CharityDonation_sourcePurchaseId_key" ON "public"."CharityDonation"("sourcePurchaseId" ASC);

-- CreateIndex
CREATE INDEX "CharityDonation_status_idx" ON "public"."CharityDonation"("status" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "CharityDonation_stripeTransferId_key" ON "public"."CharityDonation"("stripeTransferId" ASC);

-- CreateIndex
CREATE INDEX "CharityDonation_userId_idx" ON "public"."CharityDonation"("userId" ASC);

-- CreateIndex
CREATE INDEX "ChatMessage_sessionId_timestamp_idx" ON "public"."ChatMessage"("sessionId" ASC, "timestamp" ASC);

-- CreateIndex
CREATE INDEX "ChatSession_userId_updatedAt_idx" ON "public"."ChatSession"("userId" ASC, "updatedAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "CreatorAccount_stripeAccountId_key" ON "public"."CreatorAccount"("stripeAccountId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "CreatorAccount_userId_key" ON "public"."CreatorAccount"("userId" ASC);

-- CreateIndex
CREATE INDEX "CreatorEarning_buyerId_idx" ON "public"."CreatorEarning"("buyerId" ASC);

-- CreateIndex
CREATE INDEX "CreatorEarning_createdAt_idx" ON "public"."CreatorEarning"("createdAt" ASC);

-- CreateIndex
CREATE INDEX "CreatorEarning_status_idx" ON "public"."CreatorEarning"("status" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "CreatorEarning_templateId_buyerId_key" ON "public"."CreatorEarning"("templateId" ASC, "buyerId" ASC);

-- CreateIndex
CREATE INDEX "CreatorEarning_templateId_idx" ON "public"."CreatorEarning"("templateId" ASC);

-- CreateIndex
CREATE INDEX "CreatorEarning_userId_createdAt_idx" ON "public"."CreatorEarning"("userId" ASC, "createdAt" ASC);

-- CreateIndex
CREATE INDEX "CreatorEarning_userId_idx" ON "public"."CreatorEarning"("userId" ASC);

-- CreateIndex
CREATE INDEX "CreatorEarning_userId_status_idx" ON "public"."CreatorEarning"("userId" ASC, "status" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "DailyCostSnapshot_date_key" ON "public"."DailyCostSnapshot"("date" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "GameGenome_scanId_key" ON "public"."GameGenome"("scanId" ASC);

-- CreateIndex
CREATE INDEX "GameScan_createdAt_idx" ON "public"."GameScan"("createdAt" ASC);

-- CreateIndex
CREATE INDEX "GameScan_robloxPlaceId_idx" ON "public"."GameScan"("robloxPlaceId" ASC);

-- CreateIndex
CREATE INDEX "GameScan_robloxPlaceId_status_idx" ON "public"."GameScan"("robloxPlaceId" ASC, "status" ASC);

-- CreateIndex
CREATE INDEX "GameScan_status_idx" ON "public"."GameScan"("status" ASC);

-- CreateIndex
CREATE INDEX "GameScan_userId_createdAt_idx" ON "public"."GameScan"("userId" ASC, "createdAt" ASC);

-- CreateIndex
CREATE INDEX "GameScan_userId_idx" ON "public"."GameScan"("userId" ASC);

-- CreateIndex
CREATE INDEX "GameScan_userId_status_idx" ON "public"."GameScan"("userId" ASC, "status" ASC);

-- CreateIndex
CREATE INDEX "GeneratedAsset_meshyTaskId_idx" ON "public"."GeneratedAsset"("meshyTaskId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "GeneratedAsset_meshyTaskId_key" ON "public"."GeneratedAsset"("meshyTaskId" ASC);

-- CreateIndex
CREATE INDEX "GeneratedAsset_status_idx" ON "public"."GeneratedAsset"("status" ASC);

-- CreateIndex
CREATE INDEX "GeneratedAsset_userId_createdAt_idx" ON "public"."GeneratedAsset"("userId" ASC, "createdAt" ASC);

-- CreateIndex
CREATE INDEX "GeneratedAsset_userId_idx" ON "public"."GeneratedAsset"("userId" ASC);

-- CreateIndex
CREATE INDEX "GeneratedAsset_userId_status_idx" ON "public"."GeneratedAsset"("userId" ASC, "status" ASC);

-- CreateIndex
CREATE INDEX "Gift_expiresAt_idx" ON "public"."Gift"("expiresAt" ASC);

-- CreateIndex
CREATE INDEX "Gift_recipientEmail_idx" ON "public"."Gift"("recipientEmail" ASC);

-- CreateIndex
CREATE INDEX "Gift_redeemCode_idx" ON "public"."Gift"("redeemCode" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Gift_redeemCode_key" ON "public"."Gift"("redeemCode" ASC);

-- CreateIndex
CREATE INDEX "Gift_senderId_idx" ON "public"."Gift"("senderId" ASC);

-- CreateIndex
CREATE INDEX "Gift_status_idx" ON "public"."Gift"("status" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Gift_stripeSessionId_key" ON "public"."Gift"("stripeSessionId" ASC);

-- CreateIndex
CREATE INDEX "Notification_createdAt_idx" ON "public"."Notification"("createdAt" ASC);

-- CreateIndex
CREATE INDEX "Notification_userId_createdAt_idx" ON "public"."Notification"("userId" ASC, "createdAt" ASC);

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "public"."Notification"("userId" ASC);

-- CreateIndex
CREATE INDEX "Notification_userId_read_createdAt_idx" ON "public"."Notification"("userId" ASC, "read" ASC, "createdAt" ASC);

-- CreateIndex
CREATE INDEX "Notification_userId_read_idx" ON "public"."Notification"("userId" ASC, "read" ASC);

-- CreateIndex
CREATE INDEX "NotificationPreference_userId_idx" ON "public"."NotificationPreference"("userId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "NotificationPreference_userId_type_channel_key" ON "public"."NotificationPreference"("userId" ASC, "type" ASC, "channel" ASC);

-- CreateIndex
CREATE INDEX "Project_teamId_idx" ON "public"."Project"("teamId" ASC);

-- CreateIndex
CREATE INDEX "Project_userId_archived_idx" ON "public"."Project"("userId" ASC, "archived" ASC);

-- CreateIndex
CREATE INDEX "Project_userId_idx" ON "public"."Project"("userId" ASC);

-- CreateIndex
CREATE INDEX "ProjectVersion_createdAt_idx" ON "public"."ProjectVersion"("createdAt" ASC);

-- CreateIndex
CREATE INDEX "ProjectVersion_projectId_idx" ON "public"."ProjectVersion"("projectId" ASC);

-- CreateIndex
CREATE INDEX "ProjectVersion_teamId_idx" ON "public"."ProjectVersion"("teamId" ASC);

-- CreateIndex
CREATE INDEX "ProjectVersion_teamId_projectId_createdAt_idx" ON "public"."ProjectVersion"("teamId" ASC, "projectId" ASC, "createdAt" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "ProjectVersion_teamId_projectId_version_key" ON "public"."ProjectVersion"("teamId" ASC, "projectId" ASC, "version" ASC);

-- CreateIndex
CREATE INDEX "ProjectVersion_userId_idx" ON "public"."ProjectVersion"("userId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Referral_code_key" ON "public"."Referral"("code" ASC);

-- CreateIndex
CREATE INDEX "Referral_referredId_idx" ON "public"."Referral"("referredId" ASC);

-- CreateIndex
CREATE INDEX "Referral_referrerId_idx" ON "public"."Referral"("referrerId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Referral_referrerId_referredId_key" ON "public"."Referral"("referrerId" ASC, "referredId" ASC);

-- CreateIndex
CREATE INDEX "Referral_referrerId_status_idx" ON "public"."Referral"("referrerId" ASC, "status" ASC);

-- CreateIndex
CREATE INDEX "RobloxDocChunk_category_idx" ON "public"."RobloxDocChunk"("category" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "RobloxDocChunk_category_title_key" ON "public"."RobloxDocChunk"("category" ASC, "title" ASC);

-- CreateIndex
CREATE INDEX "RobloxDocChunk_embedding_idx" ON "public"."RobloxDocChunk"("embedding" ASC);

-- CreateIndex
CREATE INDEX "Streak_userId_idx" ON "public"."Streak"("userId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Streak_userId_key" ON "public"."Streak"("userId" ASC);

-- CreateIndex
CREATE INDEX "Subscription_status_currentPeriodEnd_idx" ON "public"."Subscription"("status" ASC, "currentPeriodEnd" ASC);

-- CreateIndex
CREATE INDEX "Subscription_status_idx" ON "public"."Subscription"("status" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_stripeCustomerId_key" ON "public"."Subscription"("stripeCustomerId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_stripeSubscriptionId_key" ON "public"."Subscription"("stripeSubscriptionId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_userId_key" ON "public"."Subscription"("userId" ASC);

-- CreateIndex
CREATE INDEX "Team_deletedAt_idx" ON "public"."Team"("deletedAt" ASC);

-- CreateIndex
CREATE INDEX "Team_ownerId_idx" ON "public"."Team"("ownerId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Team_slug_key" ON "public"."Team"("slug" ASC);

-- CreateIndex
CREATE INDEX "TeamActivity_createdAt_idx" ON "public"."TeamActivity"("createdAt" ASC);

-- CreateIndex
CREATE INDEX "TeamActivity_teamId_createdAt_idx" ON "public"."TeamActivity"("teamId" ASC, "createdAt" ASC);

-- CreateIndex
CREATE INDEX "TeamActivity_teamId_idx" ON "public"."TeamActivity"("teamId" ASC);

-- CreateIndex
CREATE INDEX "TeamActivity_userId_idx" ON "public"."TeamActivity"("userId" ASC);

-- CreateIndex
CREATE INDEX "TeamInvite_email_idx" ON "public"."TeamInvite"("email" ASC);

-- CreateIndex
CREATE INDEX "TeamInvite_expiresAt_idx" ON "public"."TeamInvite"("expiresAt" ASC);

-- CreateIndex
CREATE INDEX "TeamInvite_status_idx" ON "public"."TeamInvite"("status" ASC);

-- CreateIndex
CREATE INDEX "TeamInvite_teamId_idx" ON "public"."TeamInvite"("teamId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "TeamInvite_token_key" ON "public"."TeamInvite"("token" ASC);

-- CreateIndex
CREATE INDEX "TeamMember_teamId_idx" ON "public"."TeamMember"("teamId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "TeamMember_teamId_userId_key" ON "public"."TeamMember"("teamId" ASC, "userId" ASC);

-- CreateIndex
CREATE INDEX "TeamMember_userId_idx" ON "public"."TeamMember"("userId" ASC);

-- CreateIndex
CREATE INDEX "Template_averageRating_idx" ON "public"."Template"("averageRating" ASC);

-- CreateIndex
CREATE INDEX "Template_category_idx" ON "public"."Template"("category" ASC);

-- CreateIndex
CREATE INDEX "Template_createdAt_idx" ON "public"."Template"("createdAt" ASC);

-- CreateIndex
CREATE INDEX "Template_creatorId_createdAt_idx" ON "public"."Template"("creatorId" ASC, "createdAt" ASC);

-- CreateIndex
CREATE INDEX "Template_creatorId_idx" ON "public"."Template"("creatorId" ASC);

-- CreateIndex
CREATE INDEX "Template_creatorId_status_idx" ON "public"."Template"("creatorId" ASC, "status" ASC);

-- CreateIndex
CREATE INDEX "Template_deletedAt_idx" ON "public"."Template"("deletedAt" ASC);

-- CreateIndex
CREATE INDEX "Template_downloads_idx" ON "public"."Template"("downloads" ASC);

-- CreateIndex
CREATE INDEX "Template_featuredAt_idx" ON "public"."Template"("featuredAt" ASC);

-- CreateIndex
CREATE INDEX "Template_featured_idx" ON "public"."Template"("featured" ASC);

-- CreateIndex
CREATE INDEX "Template_forkCount_idx" ON "public"."Template"("forkCount" ASC);

-- CreateIndex
CREATE INDEX "Template_likeCount_idx" ON "public"."Template"("likeCount" ASC);

-- CreateIndex
CREATE INDEX "Template_priceCents_idx" ON "public"."Template"("priceCents" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Template_slug_key" ON "public"."Template"("slug" ASC);

-- CreateIndex
CREATE INDEX "Template_status_averageRating_idx" ON "public"."Template"("status" ASC, "averageRating" ASC);

-- CreateIndex
CREATE INDEX "Template_status_category_idx" ON "public"."Template"("status" ASC, "category" ASC);

-- CreateIndex
CREATE INDEX "Template_status_createdAt_idx" ON "public"."Template"("status" ASC, "createdAt" ASC);

-- CreateIndex
CREATE INDEX "Template_status_downloads_idx" ON "public"."Template"("status" ASC, "downloads" ASC);

-- CreateIndex
CREATE INDEX "Template_status_idx" ON "public"."Template"("status" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Template_stripePriceId_key" ON "public"."Template"("stripePriceId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Template_stripeProductId_key" ON "public"."Template"("stripeProductId" ASC);

-- CreateIndex
CREATE INDEX "Template_trending_idx" ON "public"."Template"("trending" ASC);

-- CreateIndex
CREATE INDEX "TemplateFavorite_userId_idx" ON "public"."TemplateFavorite"("userId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "TemplateFavorite_userId_itemId_key" ON "public"."TemplateFavorite"("userId" ASC, "itemId" ASC);

-- CreateIndex
CREATE INDEX "TemplateFork_originalItemId_idx" ON "public"."TemplateFork"("originalItemId" ASC);

-- CreateIndex
CREATE INDEX "TemplateLike_itemId_idx" ON "public"."TemplateLike"("itemId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "TemplateLike_userId_itemId_key" ON "public"."TemplateLike"("userId" ASC, "itemId" ASC);

-- CreateIndex
CREATE INDEX "TemplatePurchase_buyerId_createdAt_idx" ON "public"."TemplatePurchase"("buyerId" ASC, "createdAt" ASC);

-- CreateIndex
CREATE INDEX "TemplatePurchase_buyerId_idx" ON "public"."TemplatePurchase"("buyerId" ASC);

-- CreateIndex
CREATE INDEX "TemplatePurchase_createdAt_idx" ON "public"."TemplatePurchase"("createdAt" ASC);

-- CreateIndex
CREATE INDEX "TemplatePurchase_payoutStatus_idx" ON "public"."TemplatePurchase"("payoutStatus" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "TemplatePurchase_stripePaymentIntentId_key" ON "public"."TemplatePurchase"("stripePaymentIntentId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "TemplatePurchase_stripeTransferId_key" ON "public"."TemplatePurchase"("stripeTransferId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "TemplatePurchase_templateId_buyerId_key" ON "public"."TemplatePurchase"("templateId" ASC, "buyerId" ASC);

-- CreateIndex
CREATE INDEX "TemplatePurchase_templateId_idx" ON "public"."TemplatePurchase"("templateId" ASC);

-- CreateIndex
CREATE INDEX "TemplatePurchase_templateId_payoutStatus_idx" ON "public"."TemplatePurchase"("templateId" ASC, "payoutStatus" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "TemplateReview_purchaseId_key" ON "public"."TemplateReview"("purchaseId" ASC);

-- CreateIndex
CREATE INDEX "TemplateReview_rating_idx" ON "public"."TemplateReview"("rating" ASC);

-- CreateIndex
CREATE INDEX "TemplateReview_reviewerId_idx" ON "public"."TemplateReview"("reviewerId" ASC);

-- CreateIndex
CREATE INDEX "TemplateReview_templateId_createdAt_idx" ON "public"."TemplateReview"("templateId" ASC, "createdAt" ASC);

-- CreateIndex
CREATE INDEX "TemplateReview_templateId_idx" ON "public"."TemplateReview"("templateId" ASC);

-- CreateIndex
CREATE INDEX "TemplateReview_templateId_rating_idx" ON "public"."TemplateReview"("templateId" ASC, "rating" ASC);

-- CreateIndex
CREATE INDEX "TemplateScreenshot_templateId_idx" ON "public"."TemplateScreenshot"("templateId" ASC);

-- CreateIndex
CREATE INDEX "TemplateScreenshot_templateId_sortOrder_idx" ON "public"."TemplateScreenshot"("templateId" ASC, "sortOrder" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "TokenBalance_userId_key" ON "public"."TokenBalance"("userId" ASC);

-- CreateIndex
CREATE INDEX "TokenGrantJob_invoiceId_idx" ON "public"."TokenGrantJob"("invoiceId" ASC);

-- CreateIndex
CREATE INDEX "TokenGrantJob_sessionId_idx" ON "public"."TokenGrantJob"("sessionId" ASC);

-- CreateIndex
CREATE INDEX "TokenGrantJob_status_createdAt_idx" ON "public"."TokenGrantJob"("status" ASC, "createdAt" ASC);

-- CreateIndex
CREATE INDEX "TokenGrantJob_status_idx" ON "public"."TokenGrantJob"("status" ASC);

-- CreateIndex
CREATE INDEX "TokenGrantJob_userId_idx" ON "public"."TokenGrantJob"("userId" ASC);

-- CreateIndex
CREATE INDEX "TokenTransaction_balanceId_createdAt_idx" ON "public"."TokenTransaction"("balanceId" ASC, "createdAt" ASC);

-- CreateIndex
CREATE INDEX "TokenTransaction_balanceId_idx" ON "public"."TokenTransaction"("balanceId" ASC);

-- CreateIndex
CREATE INDEX "TokenTransaction_createdAt_idx" ON "public"."TokenTransaction"("createdAt" ASC);

-- CreateIndex
CREATE INDEX "TokenTransaction_type_idx" ON "public"."TokenTransaction"("type" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "User_clerkId_key" ON "public"."User"("clerkId" ASC);

-- CreateIndex
CREATE INDEX "User_deletedAt_idx" ON "public"."User"("deletedAt" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email" ASC);

-- CreateIndex
CREATE INDEX "User_parentConsentTokenExp_idx" ON "public"."User"("parentConsentTokenExp" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "User_parentConsentToken_key" ON "public"."User"("parentConsentToken" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "User_referralCode_key" ON "public"."User"("referralCode" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "User_robloxUserId_key" ON "public"."User"("robloxUserId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "public"."User"("username" ASC);

-- CreateIndex
CREATE INDEX "UserAchievement_achievementId_idx" ON "public"."UserAchievement"("achievementId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "UserAchievement_userId_achievementId_key" ON "public"."UserAchievement"("userId" ASC, "achievementId" ASC);

-- CreateIndex
CREATE INDEX "UserAchievement_userId_idx" ON "public"."UserAchievement"("userId" ASC);

-- CreateIndex
CREATE INDEX "UserXP_tier_idx" ON "public"."UserXP"("tier" ASC);

-- CreateIndex
CREATE INDEX "UserXP_totalXp_idx" ON "public"."UserXP"("totalXp" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "UserXP_userId_key" ON "public"."UserXP"("userId" ASC);

-- CreateIndex
CREATE INDEX "VersionDiff_fromVersionId_idx" ON "public"."VersionDiff"("fromVersionId" ASC);

-- CreateIndex
CREATE INDEX "VersionDiff_toVersionId_idx" ON "public"."VersionDiff"("toVersionId" ASC);

-- CreateIndex
CREATE INDEX "Waitlist_createdAt_idx" ON "public"."Waitlist"("createdAt" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Waitlist_email_key" ON "public"."Waitlist"("email" ASC);

-- CreateIndex
CREATE INDEX "Waitlist_source_idx" ON "public"."Waitlist"("source" ASC);

-- CreateIndex
CREATE INDEX "WebhookDelivery_createdAt_idx" ON "public"."WebhookDelivery"("createdAt" ASC);

-- CreateIndex
CREATE INDEX "WebhookDelivery_endpointId_idx" ON "public"."WebhookDelivery"("endpointId" ASC);

-- CreateIndex
CREATE INDEX "WebhookDelivery_endpointId_success_nextRetryAt_idx" ON "public"."WebhookDelivery"("endpointId" ASC, "success" ASC, "nextRetryAt" ASC);

-- CreateIndex
CREATE INDEX "WebhookDelivery_success_nextRetryAt_idx" ON "public"."WebhookDelivery"("success" ASC, "nextRetryAt" ASC);

-- CreateIndex
CREATE INDEX "WebhookEndpoint_active_idx" ON "public"."WebhookEndpoint"("active" ASC);

-- CreateIndex
CREATE INDEX "WebhookEndpoint_userId_idx" ON "public"."WebhookEndpoint"("userId" ASC);

-- CreateIndex
CREATE INDEX "XPEvent_createdAt_idx" ON "public"."XPEvent"("createdAt" ASC);

-- CreateIndex
CREATE INDEX "XPEvent_type_idx" ON "public"."XPEvent"("type" ASC);

-- CreateIndex
CREATE INDEX "XPEvent_userXpId_createdAt_idx" ON "public"."XPEvent"("userXpId" ASC, "createdAt" ASC);

-- CreateIndex
CREATE INDEX "XPEvent_userXpId_idx" ON "public"."XPEvent"("userXpId" ASC);

-- CreateIndex
CREATE INDEX "ZoneLock_expiresAt_idx" ON "public"."ZoneLock"("expiresAt" ASC);

-- CreateIndex
CREATE INDEX "ZoneLock_teamMemberId_idx" ON "public"."ZoneLock"("teamMemberId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "ZoneLock_zoneId_key" ON "public"."ZoneLock"("zoneId" ASC);

-- AddForeignKey
ALTER TABLE "public"."ApiKey" ADD CONSTRAINT "ApiKey_rotatedFromId_fkey" FOREIGN KEY ("rotatedFromId") REFERENCES "public"."ApiKey"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ApiKey" ADD CONSTRAINT "ApiKey_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ApiUsageRecord" ADD CONSTRAINT "ApiUsageRecord_apiKeyId_fkey" FOREIGN KEY ("apiKeyId") REFERENCES "public"."ApiKey"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ApiUsageRecord" ADD CONSTRAINT "ApiUsageRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Build" ADD CONSTRAINT "Build_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Build" ADD CONSTRAINT "Build_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CharityDonation" ADD CONSTRAINT "CharityDonation_sourcePurchaseId_fkey" FOREIGN KEY ("sourcePurchaseId") REFERENCES "public"."TemplatePurchase"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CharityDonation" ADD CONSTRAINT "CharityDonation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ChatMessage" ADD CONSTRAINT "ChatMessage_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "public"."ChatSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CreatorAccount" ADD CONSTRAINT "CreatorAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CreatorEarning" ADD CONSTRAINT "CreatorEarning_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CreatorEarning" ADD CONSTRAINT "CreatorEarning_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "public"."Template"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CreatorEarning" ADD CONSTRAINT "CreatorEarning_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GameGenome" ADD CONSTRAINT "GameGenome_scanId_fkey" FOREIGN KEY ("scanId") REFERENCES "public"."GameScan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GameScan" ADD CONSTRAINT "GameScan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GeneratedAsset" ADD CONSTRAINT "GeneratedAsset_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Gift" ADD CONSTRAINT "Gift_redeemedById_fkey" FOREIGN KEY ("redeemedById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Gift" ADD CONSTRAINT "Gift_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."NotificationPreference" ADD CONSTRAINT "NotificationPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Project" ADD CONSTRAINT "Project_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "public"."Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Project" ADD CONSTRAINT "Project_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProjectVersion" ADD CONSTRAINT "ProjectVersion_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "public"."Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProjectVersion" ADD CONSTRAINT "ProjectVersion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Referral" ADD CONSTRAINT "Referral_referredId_fkey" FOREIGN KEY ("referredId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Referral" ADD CONSTRAINT "Referral_referrerId_fkey" FOREIGN KEY ("referrerId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Streak" ADD CONSTRAINT "Streak_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Subscription" ADD CONSTRAINT "Subscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Team" ADD CONSTRAINT "Team_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TeamActivity" ADD CONSTRAINT "TeamActivity_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "public"."Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TeamActivity" ADD CONSTRAINT "TeamActivity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TeamInvite" ADD CONSTRAINT "TeamInvite_invitedBy_fkey" FOREIGN KEY ("invitedBy") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TeamInvite" ADD CONSTRAINT "TeamInvite_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "public"."Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TeamMember" ADD CONSTRAINT "TeamMember_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "public"."Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TeamMember" ADD CONSTRAINT "TeamMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Template" ADD CONSTRAINT "Template_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TemplateFavorite" ADD CONSTRAINT "TemplateFavorite_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "public"."Template"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TemplateFork" ADD CONSTRAINT "TemplateFork_forkedItemId_fkey" FOREIGN KEY ("forkedItemId") REFERENCES "public"."Template"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TemplateFork" ADD CONSTRAINT "TemplateFork_originalItemId_fkey" FOREIGN KEY ("originalItemId") REFERENCES "public"."Template"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TemplateLike" ADD CONSTRAINT "TemplateLike_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "public"."Template"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TemplatePurchase" ADD CONSTRAINT "TemplatePurchase_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TemplatePurchase" ADD CONSTRAINT "TemplatePurchase_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "public"."Template"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TemplateReview" ADD CONSTRAINT "TemplateReview_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "public"."TemplatePurchase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TemplateReview" ADD CONSTRAINT "TemplateReview_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TemplateReview" ADD CONSTRAINT "TemplateReview_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "public"."Template"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TemplateScreenshot" ADD CONSTRAINT "TemplateScreenshot_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "public"."Template"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TokenBalance" ADD CONSTRAINT "TokenBalance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TokenGrantJob" ADD CONSTRAINT "TokenGrantJob_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("clerkId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TokenTransaction" ADD CONSTRAINT "TokenTransaction_balanceId_fkey" FOREIGN KEY ("balanceId") REFERENCES "public"."TokenBalance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserAchievement" ADD CONSTRAINT "UserAchievement_achievementId_fkey" FOREIGN KEY ("achievementId") REFERENCES "public"."Achievement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserAchievement" ADD CONSTRAINT "UserAchievement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserXP" ADD CONSTRAINT "UserXP_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."VersionDiff" ADD CONSTRAINT "VersionDiff_fromVersionId_fkey" FOREIGN KEY ("fromVersionId") REFERENCES "public"."ProjectVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."VersionDiff" ADD CONSTRAINT "VersionDiff_toVersionId_fkey" FOREIGN KEY ("toVersionId") REFERENCES "public"."ProjectVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WebhookDelivery" ADD CONSTRAINT "WebhookDelivery_endpointId_fkey" FOREIGN KEY ("endpointId") REFERENCES "public"."WebhookEndpoint"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WebhookEndpoint" ADD CONSTRAINT "WebhookEndpoint_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."XPEvent" ADD CONSTRAINT "XPEvent_userXpId_fkey" FOREIGN KEY ("userXpId") REFERENCES "public"."UserXP"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ZoneLock" ADD CONSTRAINT "ZoneLock_teamMemberId_fkey" FOREIGN KEY ("teamMemberId") REFERENCES "public"."TeamMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;

