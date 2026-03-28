import { SignIn } from '@clerk/nextjs'

export default function SignInPage() {
  return (
    <SignIn
      appearance={{
        variables: {
          colorPrimary: '#FFB81C',
          colorBackground: '#0D1231',
          colorText: '#ffffff',
          colorTextSecondary: '#9ca3af',
        },
        elements: {
          card: 'shadow-xl border border-white/10',
          formButtonPrimary: 'bg-[#FFB81C] text-black hover:bg-[#E6A519]',
        },
      }}
    />
  )
}
