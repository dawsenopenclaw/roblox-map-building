import { TopLoadingBar } from '@/components/TopLoadingBar'
import { ForjeLoadingScreen } from '@/components/ForjeLogo'

/**
 * Marketing-section loading state.
 * Shows the ForjeGames wordmark with a left-to-right letter reveal
 * animation while marketing pages stream in.
 */
export default function MarketingLoading() {
  return (
    <>
      <TopLoadingBar />
      <div className="loading-enter">
        <ForjeLoadingScreen />
      </div>
    </>
  )
}
