export default function ConsentDeniedPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-[#141414] border border-white/10 rounded-xl p-8 shadow-xl">
          <div className="text-5xl mb-4">🗑️</div>
          <h2 className="text-2xl font-bold text-white mb-3">Consent Denied</h2>
          <p className="text-gray-300">
            The account has been deleted as requested. No personal data has been retained.
          </p>
          <p className="text-gray-400 text-xs mt-6">
            If you have any questions, contact us at{' '}
            <a href="mailto:support@forjegames.com" className="text-[#D4AF37]">
              support@forjegames.com
            </a>
          </p>
          <a
            href="/"
            className="inline-block mt-6 text-sm text-[#D4AF37] hover:underline"
          >
            Return to ForjeGames
          </a>
        </div>
      </div>
    </div>
  )
}
