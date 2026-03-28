import { PrismaClient, UserRole, SubscriptionTier, SubscriptionStatus } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding development database...')

  const user = await prisma.user.upsert({
    where: { email: 'dev@robloxforge.dev' },
    update: {},
    create: {
      clerkId: 'dev_clerk_id_placeholder',
      email: 'dev@robloxforge.dev',
      username: 'devuser',
      displayName: 'Dev User',
      role: UserRole.USER,
    },
  })

  await prisma.subscription.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id,
      stripeCustomerId: 'cus_dev_placeholder',
      tier: SubscriptionTier.FREE,
      status: SubscriptionStatus.ACTIVE,
    },
  })

  await prisma.tokenBalance.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id,
      balance: 100,
      lifetimeEarned: 100,
      lifetimeSpent: 0,
      rolloverTokens: 0,
    },
  })

  console.log('Seed complete. Dev user created:', user.email)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
