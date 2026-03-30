import {
  PrismaClient,
  UserRole,
  SubscriptionTier,
  SubscriptionStatus,
  TemplateCategory,
  TemplateStatus,
  TokenTransactionType,
  DonationStatus,
  PayoutStatus,
  XPTier,
  XPEventType,
  ScanStatus,
  TeamRole,
  EarningStatus,
  AchievementCategory,
} from '@prisma/client'

const prisma = new PrismaClient()

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Returns a Date that is `daysAgo` days before now, with an optional hour offset */
function daysAgo(days: number, hourOffset = 0): Date {
  const d = new Date()
  d.setDate(d.getDate() - days)
  d.setHours(d.getHours() - hourOffset)
  return d
}

/** Random integer between min and max inclusive */
function rand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

// ─── Achievement definitions (mirrors src/lib/achievements.ts) ───────────────

const ACHIEVEMENTS = [
  // FIRST_STEPS (6)
  {
    slug: 'first-build',
    name: 'First Creation',
    description: 'Complete your first build',
    icon: '🏗️',
    category: AchievementCategory.FIRST_STEPS,
    xpReward: 50,
    condition: { type: 'BUILD_COUNT', threshold: 1 },
  },
  {
    slug: 'first-publish',
    name: 'Published!',
    description: 'Publish your first template to the marketplace',
    icon: '🚀',
    category: AchievementCategory.FIRST_STEPS,
    xpReward: 100,
    condition: { type: 'PUBLISH_COUNT', threshold: 1 },
  },
  {
    slug: 'profile-complete',
    name: 'Identity',
    description: 'Complete your profile with username, display name, and avatar',
    icon: '🪪',
    category: AchievementCategory.FIRST_STEPS,
    xpReward: 25,
    condition: { type: 'PROFILE_COMPLETE' },
  },
  {
    slug: 'first-purchase',
    name: 'Shopper',
    description: 'Purchase your first marketplace template',
    icon: '🛒',
    category: AchievementCategory.FIRST_STEPS,
    xpReward: 25,
    condition: { type: 'PURCHASE_COUNT', threshold: 1 },
  },
  {
    slug: 'first-review',
    name: 'Critic',
    description: 'Leave your first review',
    icon: '⭐',
    category: AchievementCategory.FIRST_STEPS,
    xpReward: 25,
    condition: { type: 'REVIEW_COUNT', threshold: 1 },
  },
  {
    slug: 'first-sale',
    name: 'First Dollar',
    description: 'Make your first marketplace sale',
    icon: '💰',
    category: AchievementCategory.FIRST_STEPS,
    xpReward: 150,
    condition: { type: 'SALE_COUNT', threshold: 1 },
  },

  // VELOCITY (5)
  {
    slug: 'build-10',
    name: 'Prolific',
    description: 'Complete 10 builds',
    icon: '⚡',
    category: AchievementCategory.VELOCITY,
    xpReward: 100,
    condition: { type: 'BUILD_COUNT', threshold: 10 },
  },
  {
    slug: 'build-50',
    name: 'Build Machine',
    description: 'Complete 50 builds',
    icon: '🔥',
    category: AchievementCategory.VELOCITY,
    xpReward: 300,
    condition: { type: 'BUILD_COUNT', threshold: 50 },
  },
  {
    slug: 'build-100',
    name: 'Century',
    description: 'Complete 100 builds',
    icon: '💯',
    category: AchievementCategory.VELOCITY,
    xpReward: 500,
    condition: { type: 'BUILD_COUNT', threshold: 100 },
  },
  {
    slug: 'speed-builder',
    name: 'Speed Builder',
    description: 'Complete 5 builds in a single day',
    icon: '🏎️',
    category: AchievementCategory.VELOCITY,
    xpReward: 150,
    condition: { type: 'BUILDS_IN_DAY', threshold: 5 },
  },
  {
    slug: 'weekend-warrior',
    name: 'Weekend Warrior',
    description: 'Complete builds on both Saturday and Sunday in the same weekend',
    icon: '🗓️',
    category: AchievementCategory.VELOCITY,
    xpReward: 75,
    condition: { type: 'WEEKEND_BUILDS' },
  },

  // MARKETPLACE (6)
  {
    slug: 'publish-5',
    name: 'Template Pack',
    description: 'Publish 5 templates',
    icon: '📦',
    category: AchievementCategory.MARKETPLACE,
    xpReward: 200,
    condition: { type: 'PUBLISH_COUNT', threshold: 5 },
  },
  {
    slug: 'sales-10',
    name: 'Merchant',
    description: 'Make 10 sales',
    icon: '🏪',
    category: AchievementCategory.MARKETPLACE,
    xpReward: 300,
    condition: { type: 'SALE_COUNT', threshold: 10 },
  },
  {
    slug: 'sales-100',
    name: 'Top Seller',
    description: 'Make 100 sales',
    icon: '🏆',
    category: AchievementCategory.MARKETPLACE,
    xpReward: 1000,
    condition: { type: 'SALE_COUNT', threshold: 100 },
  },
  {
    slug: 'five-star',
    name: 'Five Star',
    description: 'Receive a 5-star review on your template',
    icon: '🌟',
    category: AchievementCategory.MARKETPLACE,
    xpReward: 75,
    condition: { type: 'RECEIVE_FIVE_STAR' },
  },
  {
    slug: 'perfect-rating',
    name: 'Perfect Rating',
    description: 'Maintain a 5-star average with 10+ reviews',
    icon: '✨',
    category: AchievementCategory.MARKETPLACE,
    xpReward: 500,
    condition: { type: 'PERFECT_RATING', minReviews: 10 },
  },
  {
    slug: 'hundred-dollars',
    name: 'Three Figures',
    description: 'Earn $100 from marketplace sales',
    icon: '💵',
    category: AchievementCategory.MARKETPLACE,
    xpReward: 400,
    condition: { type: 'TOTAL_EARNED_CENTS', threshold: 10000 },
  },

  // COMMUNITY (5)
  {
    slug: 'referral-1',
    name: 'Recruiter',
    description: 'Refer your first user',
    icon: '🤝',
    category: AchievementCategory.COMMUNITY,
    xpReward: 200,
    condition: { type: 'REFERRAL_COUNT', threshold: 1 },
  },
  {
    slug: 'referral-10',
    name: 'Evangelist',
    description: 'Refer 10 users',
    icon: '📣',
    category: AchievementCategory.COMMUNITY,
    xpReward: 500,
    condition: { type: 'REFERRAL_COUNT', threshold: 10 },
  },
  {
    slug: 'helpful-reviewer',
    name: 'Helpful Reviewer',
    description: 'Leave 10 reviews',
    icon: '💬',
    category: AchievementCategory.COMMUNITY,
    xpReward: 150,
    condition: { type: 'REVIEW_COUNT', threshold: 10 },
  },
  {
    slug: 'purchase-10',
    name: 'Collector',
    description: 'Purchase 10 templates',
    icon: '🗃️',
    category: AchievementCategory.COMMUNITY,
    xpReward: 100,
    condition: { type: 'PURCHASE_COUNT', threshold: 10 },
  },
  {
    slug: 'creator-connect',
    name: 'Creator Connect',
    description: 'Connect your Stripe account for payouts',
    icon: '💳',
    category: AchievementCategory.COMMUNITY,
    xpReward: 50,
    condition: { type: 'STRIPE_CONNECTED' },
  },

  // QUALITY (4)
  {
    slug: 'xp-500',
    name: 'Apprentice',
    description: 'Reach Apprentice tier (500 XP)',
    icon: '🎓',
    category: AchievementCategory.QUALITY,
    xpReward: 0,
    condition: { type: 'XP_THRESHOLD', threshold: 500 },
  },
  {
    slug: 'xp-2000',
    name: 'Builder Tier',
    description: 'Reach Builder tier (2,000 XP)',
    icon: '🔨',
    category: AchievementCategory.QUALITY,
    xpReward: 0,
    condition: { type: 'XP_THRESHOLD', threshold: 2000 },
  },
  {
    slug: 'xp-5000',
    name: 'Master Tier',
    description: 'Reach Master tier (5,000 XP)',
    icon: '🎖️',
    category: AchievementCategory.QUALITY,
    xpReward: 0,
    condition: { type: 'XP_THRESHOLD', threshold: 5000 },
  },
  {
    slug: 'xp-15000',
    name: 'Legend Tier',
    description: 'Reach Legend tier (15,000 XP)',
    icon: '🏅',
    category: AchievementCategory.QUALITY,
    xpReward: 0,
    condition: { type: 'XP_THRESHOLD', threshold: 15000 },
  },

  // EXPLORATION (4)
  {
    slug: 'streak-7',
    name: 'Week Warrior',
    description: 'Maintain a 7-day login streak',
    icon: '🔥',
    category: AchievementCategory.EXPLORATION,
    xpReward: 100,
    condition: { type: 'LOGIN_STREAK', threshold: 7 },
  },
  {
    slug: 'streak-30',
    name: 'Monthly Legend',
    description: 'Maintain a 30-day login streak',
    icon: '🗓️',
    category: AchievementCategory.EXPLORATION,
    xpReward: 300,
    condition: { type: 'LOGIN_STREAK', threshold: 30 },
  },
  {
    slug: 'streak-100',
    name: 'Centurion',
    description: 'Maintain a 100-day login streak',
    icon: '💎',
    category: AchievementCategory.EXPLORATION,
    xpReward: 1000,
    condition: { type: 'LOGIN_STREAK', threshold: 100 },
  },
  {
    slug: 'all-categories',
    name: 'Explorer',
    description: 'Publish a template in all 6 categories',
    icon: '🗺️',
    category: AchievementCategory.EXPLORATION,
    xpReward: 500,
    condition: { type: 'ALL_CATEGORIES' },
  },
]

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log('Seeding development database with comprehensive demo data...')

  // ── 1. Upsert all 30 achievements ─────────────────────────────────────────
  console.log('  Creating achievements...')
  const achievementRecords: Record<string, string> = {}
  for (const ach of ACHIEVEMENTS) {
    const record = await prisma.achievement.upsert({
      where: { slug: ach.slug },
      update: {
        name: ach.name,
        description: ach.description,
        icon: ach.icon,
        category: ach.category,
        xpReward: ach.xpReward,
        condition: ach.condition,
      },
      create: {
        slug: ach.slug,
        name: ach.name,
        description: ach.description,
        icon: ach.icon,
        category: ach.category,
        xpReward: ach.xpReward,
        condition: ach.condition,
      },
    })
    achievementRecords[ach.slug] = record.id
  }
  console.log(`    ${ACHIEVEMENTS.length} achievements upserted`)

  // ── 2. Demo users ──────────────────────────────────────────────────────────
  console.log('  Creating demo users...')

  // Dawsen Porter — admin, Mythic, Studio
  const dawsen = await prisma.user.upsert({
    where: { email: 'dawsen@forjegames.dev' },
    update: {},
    create: {
      clerkId: 'demo_clerk_dawsen_001',
      email: 'dawsen@forjegames.dev',
      username: 'dawsenporter',
      displayName: 'Dawsen Porter',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=dawsen',
      role: UserRole.ADMIN,
      createdAt: daysAgo(90),
    },
  })

  // Alex Chen — Creator tier, Builder rank
  const alex = await prisma.user.upsert({
    where: { email: 'alex.chen@demo.forjegames.dev' },
    update: {},
    create: {
      clerkId: 'demo_clerk_alexchen_002',
      email: 'alex.chen@demo.forjegames.dev',
      username: 'alexbuilds',
      displayName: 'Alex Chen',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alexchen',
      role: UserRole.CREATOR,
      createdAt: daysAgo(75),
    },
  })

  // Sarah Kim — Hobby tier, Apprentice rank, new
  const sarah = await prisma.user.upsert({
    where: { email: 'sarah.kim@demo.forjegames.dev' },
    update: {},
    create: {
      clerkId: 'demo_clerk_sarahkim_003',
      email: 'sarah.kim@demo.forjegames.dev',
      username: 'sarahkimdev',
      displayName: 'Sarah Kim',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sarahkim',
      role: UserRole.USER,
      createdAt: daysAgo(14),
    },
  })

  // Marcus Johnson — Studio tier, Legend rank, top creator
  const marcus = await prisma.user.upsert({
    where: { email: 'marcus.johnson@demo.forjegames.dev' },
    update: {},
    create: {
      clerkId: 'demo_clerk_marcusj_004',
      email: 'marcus.johnson@demo.forjegames.dev',
      username: 'marcusjbuilds',
      displayName: 'Marcus Johnson',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=marcus',
      role: UserRole.CREATOR,
      createdAt: daysAgo(88),
    },
  })

  // Luna Rodriguez — Free tier, Novice rank
  const luna = await prisma.user.upsert({
    where: { email: 'luna.rodriguez@demo.forjegames.dev' },
    update: {},
    create: {
      clerkId: 'demo_clerk_lunar_005',
      email: 'luna.rodriguez@demo.forjegames.dev',
      username: 'lunarod',
      displayName: 'Luna Rodriguez',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=luna',
      role: UserRole.USER,
      createdAt: daysAgo(7),
    },
  })

  const allUsers = [dawsen, alex, sarah, marcus, luna]
  console.log(`    ${allUsers.length} users upserted`)

  // ── 3. Subscriptions ───────────────────────────────────────────────────────
  console.log('  Creating subscriptions...')
  const subConfigs = [
    { user: dawsen, tier: SubscriptionTier.STUDIO, customerId: 'cus_demo_dawsen_001', subId: 'sub_demo_dawsen_001' },
    { user: alex, tier: SubscriptionTier.CREATOR, customerId: 'cus_demo_alex_002', subId: 'sub_demo_alex_002' },
    { user: sarah, tier: SubscriptionTier.HOBBY, customerId: 'cus_demo_sarah_003', subId: 'sub_demo_sarah_003' },
    { user: marcus, tier: SubscriptionTier.STUDIO, customerId: 'cus_demo_marcus_004', subId: 'sub_demo_marcus_004' },
    { user: luna, tier: SubscriptionTier.FREE, customerId: 'cus_demo_luna_005', subId: null },
  ]

  for (const cfg of subConfigs) {
    await prisma.subscription.upsert({
      where: { userId: cfg.user.id },
      update: {},
      create: {
        userId: cfg.user.id,
        stripeCustomerId: cfg.customerId,
        stripeSubscriptionId: cfg.subId,
        tier: cfg.tier,
        status: SubscriptionStatus.ACTIVE,
        currentPeriodStart: daysAgo(15),
        currentPeriodEnd: daysAgo(-15), // 15 days from now
      },
    })
  }

  // ── 4. Token balances & transaction history ────────────────────────────────
  console.log('  Creating token balances and transaction history...')

  const tokenConfigs = [
    { user: dawsen, balance: 8_450, lifetimeEarned: 12_000, lifetimeSpent: 3_550 },
    { user: alex, balance: 2_100, lifetimeEarned: 4_800, lifetimeSpent: 2_700 },
    { user: sarah, balance: 350, lifetimeEarned: 500, lifetimeSpent: 150 },
    { user: marcus, balance: 15_780, lifetimeEarned: 22_500, lifetimeSpent: 6_720 },
    { user: luna, balance: 1000, lifetimeEarned: 1000, lifetimeSpent: 0 },
  ]

  for (const cfg of tokenConfigs) {
    const existing = await prisma.tokenBalance.findUnique({ where: { userId: cfg.user.id } })
    if (existing) continue

    const tb = await prisma.tokenBalance.create({
      data: {
        userId: cfg.user.id,
        balance: cfg.balance,
        lifetimeEarned: cfg.lifetimeEarned,
        lifetimeSpent: cfg.lifetimeSpent,
        rolloverTokens: Math.floor(cfg.balance * 0.1),
      },
    })

    // Subscription grant on signup
    await prisma.tokenTransaction.create({
      data: {
        balanceId: tb.id,
        type: TokenTransactionType.SUBSCRIPTION_GRANT,
        amount: 1000,
        description: 'Welcome bonus — 1,000 free tokens',
        createdAt: cfg.user.createdAt,
      },
    })

    // Scatter realistic transactions over last 90 days
    if (cfg.user.id === dawsen.id) {
      const txns = [
        { type: TokenTransactionType.PURCHASE, amount: 2000, desc: 'Token pack — 2,000 tokens', daysBack: 80 },
        { type: TokenTransactionType.BONUS, amount: 250, desc: 'Referral bonus', daysBack: 72 },
        { type: TokenTransactionType.SPEND, amount: -800, desc: 'AI build: Medieval Castle', daysBack: 65 },
        { type: TokenTransactionType.PURCHASE, amount: 5000, desc: 'Token pack — 5,000 tokens', daysBack: 55 },
        { type: TokenTransactionType.SPEND, amount: -1200, desc: 'AI build: City District', daysBack: 48 },
        { type: TokenTransactionType.SPEND, amount: -450, desc: 'AI build: Tycoon Layout', daysBack: 40 },
        { type: TokenTransactionType.BONUS, amount: 100, desc: 'Streak bonus — 30 days', daysBack: 35 },
        { type: TokenTransactionType.SPEND, amount: -600, desc: 'AI build: Horror Map', daysBack: 28 },
        { type: TokenTransactionType.SUBSCRIPTION_GRANT, amount: 500, desc: 'Monthly subscription grant', daysBack: 15 },
        { type: TokenTransactionType.SPEND, amount: -300, desc: 'AI build: Racing Track', daysBack: 7 },
      ]
      for (const t of txns) {
        await prisma.tokenTransaction.create({
          data: { balanceId: tb.id, type: t.type, amount: t.amount, description: t.desc, createdAt: daysAgo(t.daysBack) },
        })
      }
    } else if (cfg.user.id === marcus.id) {
      const txns = [
        { type: TokenTransactionType.PURCHASE, amount: 5000, desc: 'Token pack — 5,000 tokens', daysBack: 85 },
        { type: TokenTransactionType.SPEND, amount: -1500, desc: 'AI build: Simulator Kit', daysBack: 78 },
        { type: TokenTransactionType.PURCHASE, amount: 10000, desc: 'Token pack — 10,000 tokens', daysBack: 60 },
        { type: TokenTransactionType.BONUS, amount: 500, desc: 'Top Creator monthly bonus', daysBack: 55 },
        { type: TokenTransactionType.SPEND, amount: -2000, desc: 'AI build: UI Kit Pro', daysBack: 45 },
        { type: TokenTransactionType.SPEND, amount: -1200, desc: 'AI build: NPC System', daysBack: 30 },
        { type: TokenTransactionType.SUBSCRIPTION_GRANT, amount: 500, desc: 'Monthly subscription grant', daysBack: 15 },
        { type: TokenTransactionType.SPEND, amount: -500, desc: 'AI build: Sound Pack', daysBack: 5 },
      ]
      for (const t of txns) {
        await prisma.tokenTransaction.create({
          data: { balanceId: tb.id, type: t.type, amount: t.amount, description: t.desc, createdAt: daysAgo(t.daysBack) },
        })
      }
    } else if (cfg.user.id === alex.id) {
      const txns = [
        { type: TokenTransactionType.PURCHASE, amount: 2000, desc: 'Token pack — 2,000 tokens', daysBack: 70 },
        { type: TokenTransactionType.SPEND, amount: -500, desc: 'AI build: Fantasy Forest', daysBack: 62 },
        { type: TokenTransactionType.BONUS, amount: 100, desc: 'Referral bonus', daysBack: 50 },
        { type: TokenTransactionType.SPEND, amount: -800, desc: 'AI build: Modern City', daysBack: 38 },
        { type: TokenTransactionType.SUBSCRIPTION_GRANT, amount: 250, desc: 'Monthly subscription grant', daysBack: 15 },
      ]
      for (const t of txns) {
        await prisma.tokenTransaction.create({
          data: { balanceId: tb.id, type: t.type, amount: t.amount, description: t.desc, createdAt: daysAgo(t.daysBack) },
        })
      }
    } else if (cfg.user.id === sarah.id) {
      await prisma.tokenTransaction.create({
        data: { balanceId: tb.id, type: TokenTransactionType.BONUS, amount: 100, description: 'New user welcome bonus', createdAt: daysAgo(14) },
      })
      await prisma.tokenTransaction.create({
        data: { balanceId: tb.id, type: TokenTransactionType.SPEND, amount: -150, description: 'AI build: First project', createdAt: daysAgo(10) },
      })
    }
    // Luna gets only the signup grant (already created above)
  }

  // ── 5. Creator accounts ────────────────────────────────────────────────────
  console.log('  Creating creator accounts...')
  const creatorConfigs = [
    {
      user: dawsen,
      stripeAccountId: 'acct_demo_dawsen_001',
      totalEarnedCents: 18_750_00,
      pendingBalanceCents: 1_200_00,
    },
    {
      user: alex,
      stripeAccountId: 'acct_demo_alex_002',
      totalEarnedCents: 3_420_00,
      pendingBalanceCents: 340_00,
    },
    {
      user: marcus,
      stripeAccountId: 'acct_demo_marcus_003',
      totalEarnedCents: 48_920_00,
      pendingBalanceCents: 2_800_00,
    },
  ]

  for (const cfg of creatorConfigs) {
    const existing = await prisma.creatorAccount.findUnique({ where: { userId: cfg.user.id } })
    if (!existing) {
      await prisma.creatorAccount.create({
        data: {
          userId: cfg.user.id,
          stripeAccountId: cfg.stripeAccountId,
          chargesEnabled: true,
          payoutsEnabled: true,
          detailsSubmitted: true,
          totalEarnedCents: cfg.totalEarnedCents,
          pendingBalanceCents: cfg.pendingBalanceCents,
          lastPayoutAt: daysAgo(10),
        },
      })
    }
  }

  // ── 6. XP records ─────────────────────────────────────────────────────────
  console.log('  Creating XP records...')
  const xpConfigs = [
    { user: dawsen, totalXp: 28_500, tier: XPTier.MYTHIC },
    { user: alex, totalXp: 3_200, tier: XPTier.BUILDER },
    { user: sarah, totalXp: 620, tier: XPTier.APPRENTICE },
    { user: marcus, totalXp: 19_800, tier: XPTier.LEGEND },
    { user: luna, totalXp: 75, tier: XPTier.NOVICE },
  ]

  const xpRecords: Record<string, string> = {}
  for (const cfg of xpConfigs) {
    const existing = await prisma.userXP.findUnique({ where: { userId: cfg.user.id } })
    if (existing) {
      xpRecords[cfg.user.id] = existing.id
      continue
    }
    const xp = await prisma.userXP.create({
      data: {
        userId: cfg.user.id,
        totalXp: cfg.totalXp,
        tier: cfg.tier,
        dailyXpToday: rand(50, 300),
        dailyXpDate: new Date(),
      },
    })
    xpRecords[cfg.user.id] = xp.id

    // XP events for context
    const events: Array<{ type: XPEventType; amount: number; daysBack: number }> = [
      { type: XPEventType.DAILY_LOGIN, amount: 10, daysBack: 3 },
      { type: XPEventType.BUILD, amount: 100, daysBack: 5 },
      { type: XPEventType.ACHIEVEMENT, amount: 150, daysBack: 8 },
      { type: XPEventType.STREAK_BONUS, amount: 50, daysBack: 14 },
    ]
    if (cfg.user.id === marcus.id || cfg.user.id === dawsen.id) {
      events.push({ type: XPEventType.SALE, amount: 200, daysBack: 2 })
      events.push({ type: XPEventType.PUBLISH, amount: 100, daysBack: 20 })
    }
    for (const ev of events) {
      await prisma.xPEvent.create({
        data: { userXpId: xp.id, type: ev.type, amount: ev.amount, createdAt: daysAgo(ev.daysBack) },
      })
    }
  }

  // ── 7. Streaks ─────────────────────────────────────────────────────────────
  console.log('  Creating streak data...')
  const streakConfigs = [
    { user: dawsen, loginStreak: 42, buildStreak: 18, longestLogin: 67, longestBuild: 24, totalLogins: 88, totalBuilds: 215 },
    { user: alex, loginStreak: 12, buildStreak: 5, longestLogin: 21, longestBuild: 9, totalLogins: 72, totalBuilds: 63 },
    { user: sarah, loginStreak: 3, buildStreak: 1, longestLogin: 3, longestBuild: 1, totalLogins: 14, totalBuilds: 4 },
    { user: marcus, loginStreak: 89, buildStreak: 34, longestLogin: 89, longestBuild: 34, totalLogins: 87, totalBuilds: 312 },
    { user: luna, loginStreak: 2, buildStreak: 0, longestLogin: 2, longestBuild: 0, totalLogins: 7, totalBuilds: 0 },
  ]

  for (const cfg of streakConfigs) {
    const existing = await prisma.streak.findUnique({ where: { userId: cfg.user.id } })
    if (!existing) {
      await prisma.streak.create({
        data: {
          userId: cfg.user.id,
          loginStreak: cfg.loginStreak,
          buildStreak: cfg.buildStreak,
          longestLoginStreak: cfg.longestLogin,
          longestBuildStreak: cfg.longestBuild,
          lastLoginDate: daysAgo(0),
          lastBuildDate: daysAgo(cfg.buildStreak > 0 ? 1 : 5),
          totalLogins: cfg.totalLogins,
          totalBuilds: cfg.totalBuilds,
        },
      })
    }
  }

  // ── 8. Templates ───────────────────────────────────────────────────────────
  console.log('  Creating marketplace templates...')

  const templateDefs = [
    {
      creator: marcus,
      title: 'Medieval Castle Pack',
      slug: 'medieval-castle-pack',
      description:
        'A complete medieval castle build kit with towers, ramparts, dungeons, and interior rooms. Includes over 200 modular pieces, pre-configured lighting, atmospheric fog, and ambient audio. Perfect for RPG, adventure, or fantasy games. Full documentation included.',
      category: TemplateCategory.MAP_TEMPLATE,
      priceCents: 14_99,
      downloads: 1247,
      averageRating: 4.8,
      reviewCount: 89,
      tags: ['medieval', 'castle', 'fantasy', 'rpg', 'modular'],
      createdDaysAgo: 85,
    },
    {
      creator: alex,
      title: 'Modern City Starter',
      slug: 'modern-city-starter',
      description:
        'Jump-start your city simulator with this professionally designed urban layout. Includes 60+ building assets, road systems, traffic lights, parks, and a day/night cycle. Optimized for performance with LOD support and mobile-friendly asset counts.',
      category: TemplateCategory.MAP_TEMPLATE,
      priceCents: 9_99,
      downloads: 892,
      averageRating: 4.5,
      reviewCount: 54,
      tags: ['city', 'urban', 'simulator', 'modern', 'buildings'],
      createdDaysAgo: 70,
    },
    {
      creator: marcus,
      title: 'Tycoon Game Kit',
      slug: 'tycoon-game-kit',
      description:
        'The complete tycoon framework used in top-charting Roblox games. Features a robust economy system, upgrade UI, padlock mechanic, conveyor belts, droppers, and automated collection. Drop-in ready with detailed configuration guide.',
      category: TemplateCategory.GAME_TEMPLATE,
      priceCents: 24_99,
      downloads: 2103,
      averageRating: 4.9,
      reviewCount: 187,
      tags: ['tycoon', 'economy', 'simulator', 'framework', 'popular'],
      createdDaysAgo: 80,
    },
    {
      creator: dawsen,
      title: 'Fantasy Forest Map',
      slug: 'fantasy-forest-map',
      description:
        'An enchanted forest environment with glowing trees, mystical creatures, winding paths, and hidden clearings. Free to use for any project. Includes day/night cycle and ambient sound pack. One of the most downloaded free maps on the platform.',
      category: TemplateCategory.MAP_TEMPLATE,
      priceCents: 0,
      downloads: 3456,
      averageRating: 4.2,
      reviewCount: 312,
      tags: ['fantasy', 'forest', 'free', 'nature', 'environment'],
      createdDaysAgo: 88,
    },
    {
      creator: marcus,
      title: 'Neon Racing Track',
      slug: 'neon-racing-track',
      description:
        'A futuristic neon-lit racing circuit with banked turns, jumps, boost pads, and animated trackside elements. Includes vehicle physics tuning, lap timer script, and multiplayer lobby system. Six track variations bundled.',
      category: TemplateCategory.MAP_TEMPLATE,
      priceCents: 4_99,
      downloads: 567,
      averageRating: 4.7,
      reviewCount: 43,
      tags: ['racing', 'neon', 'futuristic', 'multiplayer', 'vehicles'],
      createdDaysAgo: 60,
    },
    {
      creator: alex,
      title: 'UI Kit Pro',
      slug: 'ui-kit-pro',
      description:
        'A complete UI component library for Roblox games. Includes inventory panels, shop screens, quest trackers, minimaps, health bars, notifications, settings menus, and 40+ reusable components. Fully documented with Luau API.',
      category: TemplateCategory.UI_KIT,
      priceCents: 19_99,
      downloads: 1823,
      averageRating: 4.6,
      reviewCount: 142,
      tags: ['ui', 'interface', 'components', 'professional', 'inventory'],
      createdDaysAgo: 72,
    },
    {
      creator: marcus,
      title: 'NPC Behavior Pack',
      slug: 'npc-behavior-pack',
      description:
        'Advanced NPC AI behaviors including patrol routes, line-of-sight detection, group formations, dialogue trees, and merchant logic. All behaviors are modular and stackable. Tested with 50+ concurrent NPCs at stable performance.',
      category: TemplateCategory.SCRIPT,
      priceCents: 12_99,
      downloads: 445,
      averageRating: 4.4,
      reviewCount: 38,
      tags: ['npc', 'ai', 'behavior', 'script', 'enemies'],
      createdDaysAgo: 55,
    },
    {
      creator: dawsen,
      title: 'Sound Effects Bundle',
      slug: 'sound-effects-bundle',
      description:
        'Over 150 curated sound effects across 12 categories: combat, UI clicks, ambient, footsteps, magic, vehicles, nature, and more. All audio is royalty-free and Roblox ToS compliant. Includes a SoundManager script for easy integration.',
      category: TemplateCategory.SOUND,
      priceCents: 7_99,
      downloads: 678,
      averageRating: 4.3,
      reviewCount: 67,
      tags: ['audio', 'sound', 'sfx', 'bundle', 'music'],
      createdDaysAgo: 65,
    },
    {
      creator: marcus,
      title: 'Simulator Starter Kit',
      slug: 'simulator-starter-kit',
      description:
        'The ultimate starting point for any simulator game. Includes pet system, tool equip/upgrade system, rebirth mechanic, prestige rewards, leaderboard, shop UI, and DataStore2-compatible save system. Powers multiple top-100 Roblox games.',
      category: TemplateCategory.GAME_TEMPLATE,
      priceCents: 29_99,
      downloads: 1567,
      averageRating: 4.8,
      reviewCount: 203,
      tags: ['simulator', 'pets', 'rebirth', 'leaderboard', 'popular'],
      createdDaysAgo: 82,
    },
    {
      creator: alex,
      title: 'Horror Map Template',
      slug: 'horror-map-template',
      description:
        'A spine-chilling horror environment with flickering lights, jump scare triggers, creaking door animations, fog effects, and an atmospheric soundtrack. Includes a basic chase AI script and three distinct horror zone presets.',
      category: TemplateCategory.MAP_TEMPLATE,
      priceCents: 14_99,
      downloads: 234,
      averageRating: 4.1,
      reviewCount: 28,
      tags: ['horror', 'scary', 'atmosphere', 'jumpscares', 'dark'],
      createdDaysAgo: 45,
    },
  ]

  const templateRecords: Record<string, string> = {}
  for (const def of templateDefs) {
    const existing = await prisma.template.findUnique({ where: { slug: def.slug } })
    if (existing) {
      templateRecords[def.slug] = existing.id
      continue
    }
    const tpl = await prisma.template.create({
      data: {
        creatorId: def.creator.id,
        title: def.title,
        slug: def.slug,
        description: def.description,
        category: def.category,
        status: TemplateStatus.PUBLISHED,
        priceCents: def.priceCents,
        downloads: def.downloads,
        averageRating: def.averageRating,
        reviewCount: def.reviewCount,
        tags: def.tags,
        thumbnailUrl: `https://placehold.co/600x400/1a1a2e/ffffff?text=${encodeURIComponent(def.title)}`,
        featuredAt: def.averageRating >= 4.7 ? daysAgo(def.createdDaysAgo - 5) : null,
        createdAt: daysAgo(def.createdDaysAgo),
      },
    })
    templateRecords[def.slug] = tpl.id
  }
  console.log(`    ${templateDefs.length} templates upserted`)

  // ── 9. Purchases & Reviews ─────────────────────────────────────────────────
  console.log('  Creating purchases and reviews...')

  // Helper to create a purchase (skip if duplicate)
  async function createPurchase(templateSlug: string, buyer: { id: string }, amountCents: number, daysBack: number) {
    const templateId = templateRecords[templateSlug]
    if (!templateId) return null
    const existing = await prisma.templatePurchase.findUnique({
      where: { templateId_buyerId: { templateId, buyerId: buyer.id } },
    })
    if (existing) return existing
    return prisma.templatePurchase.create({
      data: {
        templateId,
        buyerId: buyer.id,
        amountCents,
        platformFeeCents: Math.floor(amountCents * 0.15),
        creatorPayoutCents: Math.floor(amountCents * 0.85),
        payoutStatus: PayoutStatus.PAID,
        stripePaymentIntentId: `pi_demo_${templateSlug}_${buyer.id.slice(-6)}_${daysBack}`,
        createdAt: daysAgo(daysBack),
      },
    })
  }

  // Dawsen buys several templates
  const p1 = await createPurchase('tycoon-game-kit', dawsen, 24_99, 78)
  const p2 = await createPurchase('simulator-starter-kit', dawsen, 29_99, 60)
  const p3 = await createPurchase('npc-behavior-pack', dawsen, 12_99, 45)
  const p4 = await createPurchase('ui-kit-pro', dawsen, 19_99, 30)

  // Alex buys a few
  const p5 = await createPurchase('tycoon-game-kit', alex, 24_99, 65)
  const p6 = await createPurchase('simulator-starter-kit', alex, 29_99, 50)

  // Sarah buys one
  const p7 = await createPurchase('fantasy-forest-map', sarah, 0, 10) // free

  // Marcus buys from others
  const p8 = await createPurchase('ui-kit-pro', marcus, 19_99, 68)
  const p9 = await createPurchase('horror-map-template', marcus, 14_99, 40)

  // Luna gets the free one
  const p10 = await createPurchase('fantasy-forest-map', luna, 0, 5)

  // 5 demo reviews
  const reviewDefs = [
    {
      purchase: p1,
      templateSlug: 'tycoon-game-kit',
      reviewer: dawsen,
      rating: 5,
      body: 'Absolutely incredible kit. Cut my development time in half. The economy system is battle-tested and the documentation is some of the best I have seen on the platform. Worth every penny.',
      daysBack: 72,
    },
    {
      purchase: p5,
      templateSlug: 'tycoon-game-kit',
      reviewer: alex,
      rating: 5,
      body: 'Saved me weeks of work. The conveyor and dropper systems work exactly as expected. Highly recommend for anyone building a tycoon game.',
      daysBack: 60,
    },
    {
      purchase: p2,
      templateSlug: 'simulator-starter-kit',
      reviewer: dawsen,
      rating: 5,
      body: 'The pet system alone is worth the price. Rebirth and prestige worked out of the box. Marcus clearly knows what top-charting games need.',
      daysBack: 55,
    },
    {
      purchase: p8,
      templateSlug: 'ui-kit-pro',
      reviewer: marcus,
      rating: 4,
      body: 'Solid UI kit with a lot of variety. A few components need tweaking for mobile but overall a great foundation. Saves a ton of time on the boring parts.',
      daysBack: 62,
    },
    {
      purchase: p9,
      templateSlug: 'horror-map-template',
      reviewer: marcus,
      rating: 4,
      body: 'Really atmospheric. The jump scare system is clever and easy to customize. Would love more zone presets in a future update.',
      daysBack: 35,
    },
  ]

  for (const r of reviewDefs) {
    if (!r.purchase) continue
    const templateId = templateRecords[r.templateSlug]
    if (!templateId) continue
    const existing = await prisma.templateReview.findUnique({ where: { purchaseId: r.purchase.id } })
    if (!existing) {
      await prisma.templateReview.create({
        data: {
          templateId,
          reviewerId: r.reviewer.id,
          purchaseId: r.purchase.id,
          rating: r.rating,
          body: r.body,
          createdAt: daysAgo(r.daysBack),
        },
      })
    }
  }

  // ── 10. Creator earnings ───────────────────────────────────────────────────
  console.log('  Creating creator earnings...')
  const earningDefs = [
    { user: marcus, templateName: 'Tycoon Game Kit', amountCents: 24_99, daysBack: 65 },
    { user: marcus, templateName: 'Tycoon Game Kit', amountCents: 24_99, daysBack: 60 },
    { user: marcus, templateName: 'Simulator Starter Kit', amountCents: 29_99, daysBack: 50 },
    { user: marcus, templateName: 'Simulator Starter Kit', amountCents: 29_99, daysBack: 45 },
    { user: marcus, templateName: 'Neon Racing Track', amountCents: 4_99, daysBack: 40 },
    { user: marcus, templateName: 'NPC Behavior Pack', amountCents: 12_99, daysBack: 35 },
    { user: alex, templateName: 'Modern City Starter', amountCents: 9_99, daysBack: 68 },
    { user: alex, templateName: 'UI Kit Pro', amountCents: 19_99, daysBack: 62 },
    { user: alex, templateName: 'UI Kit Pro', amountCents: 19_99, daysBack: 50 },
    { user: dawsen, templateName: 'Sound Effects Bundle', amountCents: 7_99, daysBack: 55 },
    { user: dawsen, templateName: 'Sound Effects Bundle', amountCents: 7_99, daysBack: 42 },
  ]

  const existingEarningsCount = await prisma.creatorEarning.count({ where: { userId: { in: allUsers.map((u) => u.id) } } })
  if (existingEarningsCount === 0) {
    for (const e of earningDefs) {
      await prisma.creatorEarning.create({
        data: {
          userId: e.user.id,
          templateName: e.templateName,
          amountCents: e.amountCents,
          netCents: Math.floor(e.amountCents * 0.85),
          status: EarningStatus.PAID,
          paidAt: daysAgo(e.daysBack - 5),
          createdAt: daysAgo(e.daysBack),
        },
      })
    }
  }

  // ── 11. Charity donations — $124,567 total ─────────────────────────────────
  console.log('  Creating charity donation records...')

  const charityOrgs = [
    { slug: 'code-org', name: 'Code.org' },
    { slug: 'st-jude', name: "St. Jude Children's Research Hospital" },
    { slug: 'doctors-without-borders', name: 'Doctors Without Borders' },
    { slug: 'ocean-conservancy', name: 'Ocean Conservancy' },
  ]

  // $124,567 total across all users — distribute in chunks
  const donationBatches = [
    // Marcus — biggest spender, biggest donor
    { user: marcus, charity: charityOrgs[0], amountCents: 28_400_00, daysBack: 80, status: DonationStatus.COMPLETED },
    { user: marcus, charity: charityOrgs[1], amountCents: 18_200_00, daysBack: 55, status: DonationStatus.COMPLETED },
    { user: marcus, charity: charityOrgs[2], amountCents: 12_000_00, daysBack: 30, status: DonationStatus.COMPLETED },
    // Dawsen
    { user: dawsen, charity: charityOrgs[0], amountCents: 22_300_00, daysBack: 75, status: DonationStatus.COMPLETED },
    { user: dawsen, charity: charityOrgs[3], amountCents: 15_800_00, daysBack: 40, status: DonationStatus.COMPLETED },
    // Alex
    { user: alex, charity: charityOrgs[1], amountCents: 8_967_00, daysBack: 65, status: DonationStatus.COMPLETED },
    // Sarah
    { user: sarah, charity: charityOrgs[2], amountCents: 1_200_00, daysBack: 10, status: DonationStatus.COMPLETED },
    // Luna
    { user: luna, charity: charityOrgs[3], amountCents: 500_00, daysBack: 4, status: DonationStatus.COMPLETED },
    // Pending/processing
    { user: marcus, charity: charityOrgs[0], amountCents: 5_000_00, daysBack: 2, status: DonationStatus.PROCESSING },
    { user: dawsen, charity: charityOrgs[1], amountCents: 12_200_00, daysBack: 1, status: DonationStatus.PENDING },
  ]
  // Total above: 28400+18200+12000+22300+15800+8967+1200+500+5000+12200 = 124,567 ✓

  const existingDonationCount = await prisma.charityDonation.count({ where: { userId: { in: allUsers.map((u) => u.id) } } })
  if (existingDonationCount === 0) {
    for (const d of donationBatches) {
      await prisma.charityDonation.create({
        data: {
          userId: d.user.id,
          charitySlug: d.charity.slug,
          charityName: d.charity.name,
          amountCents: d.amountCents,
          status: d.status,
          processedAt: d.status === DonationStatus.COMPLETED ? daysAgo(d.daysBack - 1) : null,
          createdAt: daysAgo(d.daysBack),
        },
      })
    }
  }

  // ── 12. Achievements unlocked for demo users ───────────────────────────────
  console.log('  Unlocking achievements for demo users...')

  async function unlockAchievement(userId: string, slug: string, daysBack: number) {
    const achievementId = achievementRecords[slug]
    if (!achievementId) return
    await prisma.userAchievement.upsert({
      where: { userId_achievementId: { userId, achievementId } },
      update: {},
      create: { userId, achievementId, unlockedAt: daysAgo(daysBack) },
    })
  }

  // Dawsen — Mythic, 90 days old, heavy user. Almost everything.
  const dawsenAchievements = [
    'first-build', 'first-publish', 'profile-complete', 'first-purchase', 'first-review', 'first-sale',
    'build-10', 'build-50', 'build-100', 'speed-builder', 'weekend-warrior',
    'publish-5', 'sales-10', 'sales-100', 'five-star', 'hundred-dollars',
    'referral-1', 'helpful-reviewer', 'purchase-10', 'creator-connect',
    'xp-500', 'xp-2000', 'xp-5000', 'xp-15000',
    'streak-7', 'streak-30',
  ]
  for (const slug of dawsenAchievements) {
    await unlockAchievement(dawsen.id, slug, rand(5, 85))
  }

  // Marcus — Legend, top creator, most achievements
  const marcusAchievements = [
    'first-build', 'first-publish', 'profile-complete', 'first-purchase', 'first-review', 'first-sale',
    'build-10', 'build-50', 'build-100', 'speed-builder', 'weekend-warrior',
    'publish-5', 'sales-10', 'sales-100', 'five-star', 'perfect-rating', 'hundred-dollars',
    'referral-1', 'referral-10', 'helpful-reviewer', 'purchase-10', 'creator-connect',
    'xp-500', 'xp-2000', 'xp-5000', 'xp-15000',
    'streak-7', 'streak-30', 'streak-100',
    'all-categories',
  ]
  for (const slug of marcusAchievements) {
    await unlockAchievement(marcus.id, slug, rand(3, 87))
  }

  // Alex — Builder rank, 3 templates published
  const alexAchievements = [
    'first-build', 'first-publish', 'profile-complete', 'first-purchase', 'first-review', 'first-sale',
    'build-10', 'speed-builder',
    'publish-5', 'sales-10', 'five-star',
    'referral-1', 'creator-connect',
    'xp-500', 'xp-2000',
    'streak-7',
  ]
  for (const slug of alexAchievements) {
    await unlockAchievement(alex.id, slug, rand(5, 72))
  }

  // Sarah — Apprentice, new user
  const sarahAchievements = ['first-build', 'profile-complete', 'first-purchase', 'xp-500']
  for (const slug of sarahAchievements) {
    await unlockAchievement(sarah.id, slug, rand(1, 14))
  }

  // Luna — Novice, just joined
  await unlockAchievement(luna.id, 'profile-complete', 5)
  await unlockAchievement(luna.id, 'first-purchase', 4)

  // ── 13. Game scans with genome data ───────────────────────────────────────
  console.log('  Creating game scans...')

  const scanDefs = [
    {
      user: dawsen,
      robloxUrl: 'https://www.roblox.com/games/606849621',
      robloxPlaceId: '606849621',
      gameName: 'Pet Simulator X',
      daysBack: 45,
      genome: {
        gameType: 'Pet Simulator',
        targetAge: '8-14',
        sessionLength: '45-90 minutes',
        monetizationModel: 'Gamepasses + Robux Shop',
        progressionPace: 'Fast early, gated later',
        zoneDensity: 'High — 12+ zones',
        artStyle: 'Colorful Cartoon',
        retentionDriver: 'Pet collection + trading',
        estimatedDau: '250,000-400,000',
        engagementLoop: 'Collect pets → hatch eggs → rebirth → new zone',
        updateCadence: 'Weekly major updates',
        communitySize: 'Mega (1M+ Discord)',
        scores: {
          retention: 95, monetization: 92, socialFeatures: 78,
          progressionDepth: 88, contentVariety: 85, visualPolish: 82,
          audioQuality: 70, accessibility: 75, performance: 80, replayability: 90,
        },
        genreAverages: {
          retention: 72, monetization: 68, socialFeatures: 60,
          progressionDepth: 65, contentVariety: 62, visualPolish: 70,
        },
        recommendations: [
          'Add trading system to boost community engagement',
          'Weekly limited pets drive FOMO and spike DAU',
          'Leaderboard resets create recurring engagement events',
          'Discord-exclusive pets boost server growth',
        ],
      },
    },
    {
      user: marcus,
      robloxUrl: 'https://www.roblox.com/games/2753915549',
      robloxPlaceId: '2753915549',
      gameName: 'Adopt Me!',
      daysBack: 30,
      genome: {
        gameType: 'Social Roleplay + Pet Collection',
        targetAge: '7-12',
        sessionLength: '60-180 minutes',
        monetizationModel: 'Robux Shop + Battle Pass',
        progressionPace: 'Casual — no hard progression wall',
        zoneDensity: 'Medium — 5-8 zones',
        artStyle: 'Soft Pastel Cartoon',
        retentionDriver: 'Social bonding + seasonal events',
        estimatedDau: '500,000-900,000',
        engagementLoop: 'Care for pets → earn Bucks → buy eggs → trade → social',
        updateCadence: 'Bi-weekly seasonal events',
        communitySize: 'Mega (5M+ Discord)',
        scores: {
          retention: 97, monetization: 88, socialFeatures: 95,
          progressionDepth: 60, contentVariety: 80, visualPolish: 90,
          audioQuality: 78, accessibility: 95, performance: 85, replayability: 88,
        },
        genreAverages: {
          retention: 72, monetization: 68, socialFeatures: 60,
          progressionDepth: 65, contentVariety: 62, visualPolish: 70,
        },
        recommendations: [
          'Seasonal holidays are the #1 retention driver — plan 12 months out',
          'Trading economy keeps long-term players engaged',
          'Co-op caregiving loops drive session length',
          'Accessibility is key — COPPA-compliant design maximizes the demographic',
        ],
      },
    },
    {
      user: dawsen,
      robloxUrl: 'https://www.roblox.com/games/1537690962',
      robloxPlaceId: '1537690962',
      gameName: 'Bee Swarm Simulator',
      daysBack: 15,
      genome: {
        gameType: 'Idle Simulator + Collection',
        targetAge: '10-16',
        sessionLength: '30-60 minutes',
        monetizationModel: 'Robux Shop (cosmetics + boosts)',
        progressionPace: 'Long-term grind with milestone rewards',
        zoneDensity: 'Medium — 6-9 zones',
        artStyle: 'Stylized Cartoon',
        retentionDriver: 'Bee collection + quest chains',
        estimatedDau: '80,000-150,000',
        engagementLoop: 'Collect pollen → make honey → buy bees → unlock quests',
        updateCadence: 'Monthly major updates',
        communitySize: 'Large (500K+ Discord)',
        scores: {
          retention: 85, monetization: 72, socialFeatures: 55,
          progressionDepth: 92, contentVariety: 78, visualPolish: 80,
          audioQuality: 88, accessibility: 70, performance: 90, replayability: 82,
        },
        genreAverages: {
          retention: 72, monetization: 68, socialFeatures: 60,
          progressionDepth: 65, contentVariety: 62, visualPolish: 70,
        },
        recommendations: [
          'Quest chains are the most powerful long-term retention mechanic here',
          'Onett codes drive traffic spikes — integrate a code system early',
          'Honey as currency creates satisfying idle loops',
          'Sound design is exceptional — invest in custom audio',
        ],
      },
    },
  ]

  for (const def of scanDefs) {
    const existing = await prisma.gameScan.findFirst({ where: { robloxPlaceId: def.robloxPlaceId, userId: def.user.id } })
    if (existing) continue

    const scan = await prisma.gameScan.create({
      data: {
        userId: def.user.id,
        robloxUrl: def.robloxUrl,
        robloxPlaceId: def.robloxPlaceId,
        gameName: def.gameName,
        status: ScanStatus.COMPLETE,
        createdAt: daysAgo(def.daysBack),
      },
    })

    await prisma.gameGenome.create({
      data: {
        scanId: scan.id,
        gameType: def.genome.gameType,
        targetAge: def.genome.targetAge,
        sessionLength: def.genome.sessionLength,
        monetizationModel: def.genome.monetizationModel,
        progressionPace: def.genome.progressionPace,
        zoneDensity: def.genome.zoneDensity,
        artStyle: def.genome.artStyle,
        retentionDriver: def.genome.retentionDriver,
        estimatedDau: def.genome.estimatedDau,
        engagementLoop: def.genome.engagementLoop,
        updateCadence: def.genome.updateCadence,
        communitySize: def.genome.communitySize,
        scores: def.genome.scores,
        genreAverages: def.genome.genreAverages,
        recommendations: def.genome.recommendations,
      },
    })
  }

  // ── 14. Teams ──────────────────────────────────────────────────────────────
  console.log('  Creating demo teams...')

  // Team 1: Brainrot Studios
  let brainrotTeam = await prisma.team.findUnique({ where: { slug: 'brainrot-studios' } })
  if (!brainrotTeam) {
    brainrotTeam = await prisma.team.create({
      data: {
        name: 'Brainrot Studios',
        slug: 'brainrot-studios',
        description: 'Building the next generation of simulator games. Known for high-polish titles targeting 8-16 year olds.',
        ownerId: dawsen.id,
        createdAt: daysAgo(80),
      },
    })

    // Members
    await prisma.teamMember.create({
      data: { teamId: brainrotTeam.id, userId: dawsen.id, role: TeamRole.OWNER, joinedAt: daysAgo(80) },
    })
    await prisma.teamMember.create({
      data: { teamId: brainrotTeam.id, userId: alex.id, role: TeamRole.EDITOR, joinedAt: daysAgo(75) },
    })
    await prisma.teamMember.create({
      data: { teamId: brainrotTeam.id, userId: sarah.id, role: TeamRole.VIEWER, joinedAt: daysAgo(12) },
    })

    // Activities
    await prisma.teamActivity.create({
      data: {
        teamId: brainrotTeam.id,
        userId: dawsen.id,
        action: 'TEAM_CREATED',
        description: 'Created the team Brainrot Studios',
        createdAt: daysAgo(80),
      },
    })
    await prisma.teamActivity.create({
      data: {
        teamId: brainrotTeam.id,
        userId: dawsen.id,
        action: 'MEMBER_ADDED',
        description: 'Added Alex Chen as Editor',
        createdAt: daysAgo(75),
      },
    })
    await prisma.teamActivity.create({
      data: {
        teamId: brainrotTeam.id,
        userId: alex.id,
        action: 'VERSION_SAVED',
        description: 'Saved version 3 of Medieval City Project',
        metadata: { projectId: 'proj_medieval_city', version: 3 },
        createdAt: daysAgo(20),
      },
    })
    await prisma.teamActivity.create({
      data: {
        teamId: brainrotTeam.id,
        userId: dawsen.id,
        action: 'VERSION_SAVED',
        description: 'Saved version 7 of Tycoon Island Project',
        metadata: { projectId: 'proj_tycoon_island', version: 7 },
        createdAt: daysAgo(5),
      },
    })
  }

  // Team 2: Forge Builders
  let forgeTeam = await prisma.team.findUnique({ where: { slug: 'forge-builders' } })
  if (!forgeTeam) {
    forgeTeam = await prisma.team.create({
      data: {
        name: 'Forge Builders',
        slug: 'forge-builders',
        description: 'Elite Roblox development collective. Specializing in tycoons, simulators, and marketplace templates.',
        ownerId: marcus.id,
        createdAt: daysAgo(82),
      },
    })

    await prisma.teamMember.create({
      data: { teamId: forgeTeam.id, userId: marcus.id, role: TeamRole.OWNER, joinedAt: daysAgo(82) },
    })
    await prisma.teamMember.create({
      data: { teamId: forgeTeam.id, userId: dawsen.id, role: TeamRole.ADMIN, joinedAt: daysAgo(78) },
    })

    await prisma.teamActivity.create({
      data: {
        teamId: forgeTeam.id,
        userId: marcus.id,
        action: 'TEAM_CREATED',
        description: 'Created the team Forge Builders',
        createdAt: daysAgo(82),
      },
    })
    await prisma.teamActivity.create({
      data: {
        teamId: forgeTeam.id,
        userId: marcus.id,
        action: 'TEMPLATE_PUBLISHED',
        description: 'Published Simulator Starter Kit v2.1',
        metadata: { templateSlug: 'simulator-starter-kit' },
        createdAt: daysAgo(10),
      },
    })

    // Project versions for Forge Builders
    const forgeMembers = await prisma.teamMember.findMany({ where: { teamId: forgeTeam.id } })
    const marcusMember = forgeMembers.find((m) => m.userId === marcus.id)
    const dawsenForgeMember = forgeMembers.find((m) => m.userId === dawsen.id)

    if (marcusMember) {
      for (let v = 1; v <= 5; v++) {
        await prisma.projectVersion.create({
          data: {
            teamId: forgeTeam.id,
            projectId: 'proj_sim_kit_v2',
            userId: marcus.id,
            version: v,
            message: `v${v}: ${['Initial structure', 'Pet system added', 'Rebirth mechanic', 'Shop UI polish', 'DataStore integration'][v - 1]}`,
            snapshot: { version: v, timestamp: daysAgo(55 - v * 8).toISOString(), components: ['pets', 'economy', 'ui', 'data'].slice(0, v) },
            createdAt: daysAgo(55 - v * 8),
          },
        })
      }
    }

    if (dawsenForgeMember) {
      for (let v = 1; v <= 3; v++) {
        await prisma.projectVersion.create({
          data: {
            teamId: forgeTeam.id,
            projectId: 'proj_horror_update',
            userId: dawsen.id,
            version: v,
            message: `v${v}: ${['Base map layout', 'Jump scare triggers', 'AI chase system'][v - 1]}`,
            snapshot: { version: v, timestamp: daysAgo(35 - v * 5).toISOString(), zones: v },
            createdAt: daysAgo(35 - v * 5),
          },
        })
      }
    }
  }

  // ── 15. Notifications ──────────────────────────────────────────────────────
  console.log('  Creating notifications...')
  const notifDefs = [
    {
      user: marcus,
      type: 'SALE' as const,
      title: 'New Sale — Tycoon Game Kit',
      body: 'Alex Chen purchased Tycoon Game Kit for $24.99. Your payout: $21.24.',
      read: true,
      daysBack: 60,
    },
    {
      user: marcus,
      type: 'SALE' as const,
      title: 'New Sale — Simulator Starter Kit',
      body: 'Dawsen Porter purchased Simulator Starter Kit for $29.99. Your payout: $25.49.',
      read: true,
      daysBack: 50,
    },
    {
      user: dawsen,
      type: 'ACHIEVEMENT_UNLOCKED' as const,
      title: 'Achievement Unlocked — Century',
      body: 'You completed 100 builds! You earned 500 XP.',
      read: true,
      daysBack: 40,
    },
    {
      user: alex,
      type: 'ACHIEVEMENT_UNLOCKED' as const,
      title: 'Achievement Unlocked — Speed Builder',
      body: 'You completed 5 builds in a single day! You earned 150 XP.',
      read: false,
      daysBack: 3,
    },
    {
      user: sarah,
      type: 'SYSTEM' as const,
      title: 'Welcome to ForjeGames!',
      body: 'Your account is set up and ready. Start your first build or explore the marketplace.',
      read: true,
      daysBack: 14,
    },
    {
      user: luna,
      type: 'SYSTEM' as const,
      title: 'Welcome to ForjeGames!',
      body: 'Your account is set up and ready. Start your first build or explore the marketplace.',
      read: false,
      daysBack: 7,
    },
    {
      user: marcus,
      type: 'WEEKLY_DIGEST' as const,
      title: 'Your Weekly Digest',
      body: 'This week: 8 sales, $189.92 earned, 340 XP gained, 89-day streak maintained.',
      read: false,
      daysBack: 1,
    },
  ]

  const existingNotifCount = await prisma.notification.count({ where: { userId: { in: allUsers.map((u) => u.id) } } })
  if (existingNotifCount === 0) {
    for (const n of notifDefs) {
      await prisma.notification.create({
        data: {
          userId: n.user.id,
          type: n.type,
          title: n.title,
          body: n.body,
          read: n.read,
          readAt: n.read ? daysAgo(n.daysBack - 1) : null,
          createdAt: daysAgo(n.daysBack),
        },
      })
    }
  }

  // ── Summary ────────────────────────────────────────────────────────────────
  const [userCount, templateCount, achievementCount, donationTotal] = await Promise.all([
    prisma.user.count(),
    prisma.template.count(),
    prisma.achievement.count(),
    prisma.charityDonation.aggregate({ _sum: { amountCents: true } }),
  ])

  const totalDonatedDollars = ((donationTotal._sum.amountCents ?? 0) / 100).toFixed(2)

  console.log('\n✓ Seed complete!')
  console.log(`  Users:              ${userCount}`)
  console.log(`  Templates:          ${templateCount}`)
  console.log(`  Achievements:       ${achievementCount}`)
  console.log(`  Total donated:      $${totalDonatedDollars}`)
  console.log(`  Teams:              2 (Brainrot Studios, Forge Builders)`)
  console.log(`  Game scans:         3`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
