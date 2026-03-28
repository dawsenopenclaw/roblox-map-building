import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'

// Mock SWR before importing the component
const mockUseSWR = vi.fn()
vi.mock('swr', () => ({
  default: (...args: unknown[]) => mockUseSWR(...args),
}))

import { TokenBalanceWidget } from '@/components/TokenBalanceWidget'

describe('TokenBalanceWidget', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('loading state', () => {
    it('renders skeleton loading placeholders while fetching', () => {
      mockUseSWR.mockReturnValue({ data: undefined, isLoading: true })

      const { container } = render(<TokenBalanceWidget />)

      // Loading state renders animate-pulse wrapper
      const pulse = container.querySelector('.animate-pulse')
      expect(pulse).toBeTruthy()
    })

    it('does not render balance text while loading', () => {
      mockUseSWR.mockReturnValue({ data: undefined, isLoading: true })

      render(<TokenBalanceWidget />)

      expect(screen.queryByText('Token Balance')).not.toBeInTheDocument()
    })
  })

  describe('loaded state', () => {
    it('renders the balance correctly formatted with locale separators', () => {
      mockUseSWR.mockReturnValue({
        data: { balance: 12500, lifetimeSpent: 3200 },
        isLoading: false,
      })

      render(<TokenBalanceWidget />)

      // toLocaleString('en') produces "12,500" on most platforms
      expect(screen.getByText('Token Balance')).toBeInTheDocument()
      expect(screen.getByText(/12[,.]?500/)).toBeInTheDocument()
    })

    it('shows lifetime spent amount', () => {
      mockUseSWR.mockReturnValue({
        data: { balance: 5000, lifetimeSpent: 1500 },
        isLoading: false,
      })

      render(<TokenBalanceWidget />)

      expect(screen.getByText(/1[,.]?500 spent lifetime/i)).toBeInTheDocument()
    })

    it('shows 0 when balance is missing from API response', () => {
      mockUseSWR.mockReturnValue({ data: {}, isLoading: false })

      render(<TokenBalanceWidget />)

      expect(screen.getByText('0')).toBeInTheDocument()
    })

    it('shows 0 lifetime spent when not present in data', () => {
      mockUseSWR.mockReturnValue({ data: { balance: 100 }, isLoading: false })

      render(<TokenBalanceWidget />)

      expect(screen.getByText(/0 spent lifetime/i)).toBeInTheDocument()
    })

    it('renders 0 when data is null (unauthenticated / error)', () => {
      mockUseSWR.mockReturnValue({ data: null, isLoading: false })

      render(<TokenBalanceWidget />)

      const balanceEl = screen.getByText('0')
      expect(balanceEl).toBeInTheDocument()
    })
  })

  describe('SWR configuration', () => {
    it('polls at 30-second interval', () => {
      mockUseSWR.mockReturnValue({ data: { balance: 0 }, isLoading: false })

      render(<TokenBalanceWidget />)

      const [url, , options] = mockUseSWR.mock.calls[0]
      expect(url).toBe('/api/tokens/balance')
      expect(options).toMatchObject({ refreshInterval: 30000 })
    })
  })
})
