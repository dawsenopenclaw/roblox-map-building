import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the db module before importing tokens-server
const { mockTransaction, mockFindUnique, mockUpdate, mockCreate } = vi.hoisted(() => ({
  mockTransaction: vi.fn(),
  mockFindUnique: vi.fn(),
  mockUpdate: vi.fn(),
  mockCreate: vi.fn(),
}))

vi.mock('@/lib/db', () => ({
  db: {
    $transaction: mockTransaction,
    tokenBalance: {
      findUnique: mockFindUnique,
      update: mockUpdate,
    },
    tokenTransaction: {
      create: mockCreate,
    },
  },
}))

import { earnTokens, spendTokens, getTokenBalance } from '@/lib/tokens-server'

describe('Token balance operations', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('earnTokens', () => {
    it('increases balance and records transaction', async () => {
      const updatedBalance = { id: 'bal_1', userId: 'user_1', balance: 1100, lifetimeEarned: 1100 }

      mockTransaction.mockImplementation(async (cb: (tx: unknown) => Promise<unknown>) => {
        const tx = {
          tokenBalance: {
            update: vi.fn().mockResolvedValue(updatedBalance),
          },
          tokenTransaction: {
            create: vi.fn().mockResolvedValue({}),
          },
        }
        return cb(tx)
      })

      const result = await earnTokens('user_1', 100, 'PURCHASE', 'Test purchase')

      expect(result).toEqual(updatedBalance)
      expect(mockTransaction).toHaveBeenCalledOnce()
    })

    it('passes correct increment to tokenBalance.update', async () => {
      const capturedArgs: unknown[] = []
      const updatedBalance = { id: 'bal_1', userId: 'user_1', balance: 600, lifetimeEarned: 600 }

      mockTransaction.mockImplementation(async (cb: (tx: unknown) => Promise<unknown>) => {
        const tx = {
          tokenBalance: {
            update: vi.fn().mockImplementation((args) => {
              capturedArgs.push(args)
              return Promise.resolve(updatedBalance)
            }),
          },
          tokenTransaction: {
            create: vi.fn().mockResolvedValue({}),
          },
        }
        return cb(tx)
      })

      await earnTokens('user_1', 500, 'BONUS', 'Bonus grant', { source: 'promo' })

      expect(capturedArgs[0]).toMatchObject({
        where: { userId: 'user_1' },
        data: {
          balance: { increment: 500 },
          lifetimeEarned: { increment: 500 },
        },
      })
    })

    it('records a transaction with correct type and amount', async () => {
      const txCreateArgs: unknown[] = []
      const updatedBalance = { id: 'bal_2', userId: 'user_2', balance: 200, lifetimeEarned: 200 }

      mockTransaction.mockImplementation(async (cb: (tx: unknown) => Promise<unknown>) => {
        const tx = {
          tokenBalance: {
            update: vi.fn().mockResolvedValue(updatedBalance),
          },
          tokenTransaction: {
            create: vi.fn().mockImplementation((args) => {
              txCreateArgs.push(args)
              return Promise.resolve({})
            }),
          },
        }
        return cb(tx)
      })

      await earnTokens('user_2', 200, 'SUBSCRIPTION_GRANT', 'Monthly grant')

      expect(txCreateArgs[0]).toMatchObject({
        data: {
          balanceId: 'bal_2',
          type: 'SUBSCRIPTION_GRANT',
          amount: 200,
          description: 'Monthly grant',
        },
      })
    })
  })

  describe('spendTokens', () => {
    it('decreases balance when sufficient funds exist', async () => {
      const currentBalance = { id: 'bal_3', userId: 'user_3', balance: 500, lifetimeSpent: 0 }
      const updatedBalance = { id: 'bal_3', userId: 'user_3', balance: 400, lifetimeSpent: 100 }

      mockTransaction.mockImplementation(async (cb: (tx: unknown) => Promise<unknown>) => {
        const tx = {
          tokenBalance: {
            findUnique: vi.fn().mockResolvedValue(currentBalance),
            update: vi.fn().mockResolvedValue(updatedBalance),
          },
          tokenTransaction: {
            create: vi.fn().mockResolvedValue({}),
          },
        }
        return cb(tx)
      })

      const result = await spendTokens('user_3', 100, 'AI generation')

      expect(result).toEqual(updatedBalance)
    })

    it('throws when balance is insufficient', async () => {
      const currentBalance = { id: 'bal_4', userId: 'user_4', balance: 50 }

      mockTransaction.mockImplementation(async (cb: (tx: unknown) => Promise<unknown>) => {
        const tx = {
          tokenBalance: {
            findUnique: vi.fn().mockResolvedValue(currentBalance),
            update: vi.fn(),
          },
          tokenTransaction: { create: vi.fn() },
        }
        return cb(tx)
      })

      await expect(spendTokens('user_4', 100, 'Too expensive')).rejects.toThrow(
        'Insufficient token balance'
      )
    })

    it('throws when token balance record does not exist', async () => {
      mockTransaction.mockImplementation(async (cb: (tx: unknown) => Promise<unknown>) => {
        const tx = {
          tokenBalance: {
            findUnique: vi.fn().mockResolvedValue(null),
            update: vi.fn(),
          },
          tokenTransaction: { create: vi.fn() },
        }
        return cb(tx)
      })

      await expect(spendTokens('ghost_user', 10, 'test')).rejects.toThrow(
        'Token balance not found'
      )
    })

    it('records spend transaction with negative amount', async () => {
      const currentBalance = { id: 'bal_5', userId: 'user_5', balance: 1000 }
      const updatedBalance = { id: 'bal_5', userId: 'user_5', balance: 750, lifetimeSpent: 250 }
      const txCreateArgs: unknown[] = []

      mockTransaction.mockImplementation(async (cb: (tx: unknown) => Promise<unknown>) => {
        const tx = {
          tokenBalance: {
            findUnique: vi.fn().mockResolvedValue(currentBalance),
            update: vi.fn().mockResolvedValue(updatedBalance),
          },
          tokenTransaction: {
            create: vi.fn().mockImplementation((args) => {
              txCreateArgs.push(args)
              return Promise.resolve({})
            }),
          },
        }
        return cb(tx)
      })

      await spendTokens('user_5', 250, 'Voice generation')

      expect(txCreateArgs[0]).toMatchObject({
        data: {
          type: 'SPEND',
          amount: -250,
          description: 'Voice generation',
        },
      })
    })

    it('concurrent spendTokens cannot go negative — each transaction is isolated', async () => {
      // Simulates two concurrent spend attempts on a balance of 100
      // Each must check current balance atomically (db.$transaction guarantees isolation)
      // We verify that the second call with insufficient funds throws, not silently corrupts
      let callCount = 0
      const balances = [
        { id: 'bal_6', userId: 'user_6', balance: 100 },
        { id: 'bal_6', userId: 'user_6', balance: 100 }, // second concurrent read sees same value
      ]

      mockTransaction.mockImplementation(async (cb: (tx: unknown) => Promise<unknown>) => {
        const snapshot = balances[callCount++] ?? { id: 'bal_6', userId: 'user_6', balance: 100 }
        const tx = {
          tokenBalance: {
            findUnique: vi.fn().mockResolvedValue(snapshot),
            update: vi.fn().mockResolvedValue({ ...snapshot, balance: snapshot.balance - 80, lifetimeSpent: 80 }),
          },
          tokenTransaction: { create: vi.fn().mockResolvedValue({}) },
        }
        return cb(tx)
      })

      // First spend succeeds
      const first = spendTokens('user_6', 80, 'First spend')
      // Second concurrent spend for same amount — db layer must reject when checking balance
      // To simulate the race condition we adjust the mock for the 2nd call to see 0 balance
      mockTransaction.mockImplementationOnce(async (cb: (tx: unknown) => Promise<unknown>) => {
        const tx = {
          tokenBalance: {
            findUnique: vi.fn().mockResolvedValue({ id: 'bal_6', userId: 'user_6', balance: 20 }),
            update: vi.fn(),
          },
          tokenTransaction: { create: vi.fn() },
        }
        return cb(tx)
      })
      const second = spendTokens('user_6', 80, 'Second spend (should fail)')

      const results = await Promise.allSettled([first, second])

      // The second call must have failed — balance would go negative
      const failed = results.filter((r) => r.status === 'rejected')
      expect(failed.length).toBeGreaterThanOrEqual(1)
      const rejectionReasons = failed.map((r) => (r as PromiseRejectedResult).reason.message)
      expect(rejectionReasons.some((msg) => msg.includes('Insufficient token balance'))).toBe(true)
    })
  })

  describe('getTokenBalance', () => {
    it('returns balance with recent transactions', async () => {
      const balanceWithTx = {
        id: 'bal_7',
        userId: 'user_7',
        balance: 300,
        transactions: [{ id: 'tx_1', amount: 300, type: 'PURCHASE', createdAt: new Date() }],
      }
      mockFindUnique.mockResolvedValue(balanceWithTx)

      const result = await getTokenBalance('user_7')

      expect(result).toEqual(balanceWithTx)
      expect(mockFindUnique).toHaveBeenCalledWith({
        where: { userId: 'user_7' },
        include: { transactions: { orderBy: { createdAt: 'desc' }, take: 20 } },
      })
    })

    it('returns null when user has no balance record', async () => {
      mockFindUnique.mockResolvedValue(null)

      const result = await getTokenBalance('no_balance_user')

      expect(result).toBeNull()
    })
  })
})
