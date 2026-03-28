export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0A0E27] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-[#FFB81C]">RobloxForge</h1>
          <p className="text-gray-400 text-sm mt-1">AI-powered game development</p>
        </div>
        {children}
      </div>
    </div>
  )
}
