'use client'

export default function ParentalConsentSuccessPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-[#141414] border border-white/10 rounded-xl p-8 shadow-xl">
          <div className="text-5xl mb-4"><span aria-hidden="true">✅</span></div>
          <h2 className="text-2xl font-bold text-white mb-3">Account Approved!</h2>
          <p className="text-gray-300">
            Thank you for approving this account. Tell your child they can now log in to ForjeGames.
          </p>
          <p className="text-gray-400 text-xs mt-6">
            You can revoke consent at any time by emailing{' '}
            <a href="mailto:support@forjegames.com" className="text-[#D4AF37]">
              support@forjegames.com
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
