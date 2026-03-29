// This page is shown after the parent clicks the consent email link.
// Actual token verification is handled by the API route:
// GET /api/onboarding/parental-consent/verify?token=...
// which redirects to /onboarding/parental-consent/success on success.

export default function ParentalConsentVerifyPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-[#141414] border border-white/10 rounded-xl p-8 shadow-xl">
          <h2 className="text-xl font-bold text-white mb-3">Verifying consent...</h2>
          <p className="text-gray-300 text-sm">Please wait while we process your approval.</p>
        </div>
      </div>
    </div>
  )
}
