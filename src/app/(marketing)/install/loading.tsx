export default function InstallLoading() {
  return (
    <div
      className="flex min-h-screen items-center justify-center"
      style={{ background: '#0a0a0a' }}
    >
      <div
        className="h-10 w-10 animate-spin rounded-full border-[3px]"
        style={{ borderColor: '#2a2a2a', borderTopColor: '#c9a227' }}
      />
    </div>
  )
}
