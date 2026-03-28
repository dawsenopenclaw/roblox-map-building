export default function ParentalConsentSuccessPage() {
  return (
    <div className="min-h-screen bg-[#0A0E27] flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-[#0D1231] border border-white/10 rounded-xl p-8 shadow-xl">
          <div className="text-5xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-white mb-3">Account Approved!</h2>
          <p className="text-gray-400">
            Thank you for approving this account. Tell your child they can now log in to RobloxForge.
          </p>
          <p className="text-gray-500 text-xs mt-6">
            You can revoke consent at any time by emailing{' '}
            <a href="mailto:privacy@robloxforge.com" className="text-[#FFB81C]">
              privacy@robloxforge.com
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
