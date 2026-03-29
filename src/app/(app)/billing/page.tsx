import Link from 'next/link'

export default function BillingPage() {
  const plan = 'Free'
  const planDescription = '3 builds/month · Basic AI'
  const tokens = 100
  const tokenLimit = 150

  const tokenPercent = Math.min(100, Math.round((tokens / tokenLimit) * 100))

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-white">Billing</h1>
      </div>

      <div className="space-y-4">
        {/* Current Plan */}
        <div className="bg-[#0D1231] border border-white/10 rounded-2xl p-6">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Current Plan</p>
          <p className="text-2xl font-bold text-white">{plan}</p>
          <p className="text-gray-400 text-sm mt-1">{planDescription}</p>
          <Link
            href="/pricing"
            className="inline-flex items-center gap-1 mt-4 text-sm font-semibold text-[#FFB81C] hover:text-[#E6A519] transition-colors"
          >
            Upgrade to Creator <span aria-hidden>→</span>
          </Link>
        </div>

        {/* Token Balance */}
        <div className="bg-[#0D1231] border border-white/10 rounded-2xl p-6">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Token Balance</p>
          <p className="text-4xl font-bold text-[#FFB81C]">{tokens.toLocaleString()}</p>
          <p className="text-gray-500 text-sm mt-1">of {tokenLimit.toLocaleString()} remaining</p>
          <div className="mt-4 h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#FFB81C] rounded-full transition-all"
              style={{ width: `${tokenPercent}%` }}
            />
          </div>
          <p className="text-gray-600 text-xs mt-2">{tokens} / {tokenLimit}</p>
          <Link
            href="/pricing"
            className="inline-flex items-center gap-1 mt-4 text-sm font-semibold text-white/70 hover:text-white border border-white/20 hover:border-white/40 px-4 py-2 rounded-xl transition-colors"
          >
            Buy More Tokens
          </Link>
        </div>

        {/* Payment History */}
        <div className="bg-[#0D1231] border border-white/10 rounded-2xl p-6">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Payment History</p>
          <p className="text-gray-500 text-sm">No payments yet — upgrade to see billing history.</p>
        </div>
      </div>
    </div>
  )
}
