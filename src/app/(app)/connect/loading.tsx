export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-950">
      <div
        className="h-6 w-6 rounded-full border-2"
        style={{
          borderColor: '#D4AF37 transparent transparent transparent',
          animation:   'spin 0.7s linear infinite',
        }}
      />
    </div>
  )
}
