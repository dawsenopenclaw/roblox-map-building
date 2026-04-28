import type { Metadata } from 'next'
import Link from 'next/link'
import { createMetadata } from '@/lib/metadata'

export const metadata: Metadata = createMetadata({
  title: 'Affiliate Program — Earn $20 Per Referral',
  description:
    'Join the ForjeGames affiliate program. Earn $20 for every paid subscriber you refer. One-time payout via Stripe. No cap on earnings.',
  path: '/affiliates',
  keywords: [
    'ForjeGames affiliate',
    'Roblox AI builder affiliate program',
    'ForjeGames partner program',
    'earn money Roblox',
  ],
})

const BENEFITS = [
  {
    icon: '💰',
    title: '$20 Per Paid Subscriber',
    desc: 'Earn $20 for every person who subscribes to a paid plan through your link. One-time payout, no strings attached.',
  },
  {
    icon: '🔗',
    title: 'Unique Referral Link',
    desc: 'Get a personalized link (forjegames.com?via=you). Share it anywhere — YouTube, Twitter, Discord, TikTok.',
  },
  {
    icon: '📊',
    title: 'Real-Time Dashboard',
    desc: 'Track clicks, signups, conversions, and earnings in your ForjeGames dashboard. Full transparency.',
  },
  {
    icon: '💸',
    title: 'Fast Payouts',
    desc: 'Get paid via PayPal or Stripe. No minimum threshold. No earning cap.',
  },
  {
    icon: '🎨',
    title: 'Creator Assets',
    desc: 'Get social media templates, banner graphics, and demo videos to help you promote ForjeGames.',
  },
  {
    icon: '🏆',
    title: 'Top Affiliate Perks',
    desc: 'Top affiliates get free Studio tier access, early feature access, and co-marketing opportunities.',
  },
]

const STEPS = [
  { step: '1', title: 'Sign up', desc: 'Create your ForjeGames account (free). Your referral link is generated automatically.' },
  { step: '2', title: 'Share your link', desc: 'Post your referral link on YouTube, TikTok, Discord, Twitter — anywhere Roblox creators hang out.' },
  { step: '3', title: 'Get paid', desc: 'When someone subscribes to a paid plan through your link, you earn $20. Builder plan ($25/mo) pays $12.50. One-time per subscriber.' },
]

export default function AffiliatesPage() {
  return (
    <div className="relative min-h-screen" style={{ background: '#050810' }}>
      {/* Hero */}
      <div className="max-w-4xl mx-auto px-6 pt-32 pb-16 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#D4AF37]/20 bg-[#D4AF37]/5 mb-6">
          <span className="text-[#D4AF37] text-xs font-semibold">Partner Program</span>
        </div>

        <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4" style={{ letterSpacing: '-0.03em' }}>
          Earn <span style={{ color: '#D4AF37' }}>$20</span> per paid referral
        </h1>
        <p className="text-lg text-[#6B7699] max-w-2xl mx-auto mb-8">
          Share ForjeGames with your audience. When someone subscribes to a paid plan through your link,
          you get $20. One-time payout. No cap on earnings.
        </p>

        <div className="flex flex-wrap gap-4 justify-center">
          <Link
            href="/sign-up"
            className="inline-flex items-center gap-2 text-sm font-bold px-8 py-3 rounded-xl text-black transition-all hover:brightness-110"
            style={{
              background: 'linear-gradient(135deg, #D4AF37 0%, #C8962A 100%)',
              boxShadow: '0 0 30px rgba(212,175,55,0.3)',
            }}
          >
            Start Earning
          </Link>
          <Link
            href="/pricing"
            className="inline-flex items-center gap-2 text-sm font-medium px-8 py-3 rounded-xl text-zinc-300 border border-white/10 hover:bg-white/5 transition-colors"
          >
            View Plans
          </Link>
        </div>
      </div>

      {/* How it works */}
      <div className="max-w-4xl mx-auto px-6 pb-16">
        <h2 className="text-2xl font-bold text-white text-center mb-10">How it works</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {STEPS.map(({ step, title, desc }) => (
            <div key={step} className="text-center">
              <div className="w-10 h-10 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/20 flex items-center justify-center mx-auto mb-4">
                <span className="text-[#D4AF37] font-bold text-sm">{step}</span>
              </div>
              <h3 className="text-white font-semibold mb-2">{title}</h3>
              <p className="text-[#6B7699] text-sm">{desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Benefits grid */}
      <div className="max-w-4xl mx-auto px-6 pb-16">
        <h2 className="text-2xl font-bold text-white text-center mb-10">Why join?</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {BENEFITS.map(({ icon, title, desc }) => (
            <div
              key={title}
              className="p-5 rounded-xl border border-white/[0.06] hover:border-[#D4AF37]/20 transition-colors"
              style={{ background: 'rgba(10,12,24,0.6)' }}
            >
              <span className="text-2xl mb-3 block">{icon}</span>
              <h3 className="text-white font-semibold text-sm mb-1">{title}</h3>
              <p className="text-[#6B7699] text-xs leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="max-w-2xl mx-auto px-6 pb-24 text-center">
        <div
          className="rounded-2xl p-8 border border-[#D4AF37]/20"
          style={{ background: 'linear-gradient(135deg, rgba(212,175,55,0.05) 0%, rgba(212,175,55,0.02) 100%)' }}
        >
          <h2 className="text-2xl font-bold text-white mb-3">Ready to earn?</h2>
          <p className="text-[#6B7699] text-sm mb-6">
            Sign up for free, get your referral link, and earn $20 every time someone subscribes.
          </p>
          <Link
            href="/sign-up"
            className="inline-flex items-center gap-2 text-sm font-bold px-8 py-3 rounded-xl text-black transition-all hover:brightness-110"
            style={{
              background: 'linear-gradient(135deg, #D4AF37 0%, #C8962A 100%)',
              boxShadow: '0 0 20px rgba(212,175,55,0.25)',
            }}
          >
            Join the Affiliate Program
          </Link>
        </div>
      </div>
    </div>
  )
}
