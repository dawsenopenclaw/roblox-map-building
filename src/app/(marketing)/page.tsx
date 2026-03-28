'use client'
import { useState } from 'react'
import Link from 'next/link'

const FEATURES = [
  {
    icon: '🎙️',
    title: 'Voice-to-Game',
    description: 'Speak your idea and watch it come to life. Say "build me a medieval castle" and get a playable Roblox environment in seconds.',
  },
  {
    icon: '🗺️',
    title: 'Image-to-Map',
    description: 'Drop any image — a photo, sketch, or screenshot — and our AI generates a complete Roblox map from it.',
  },
  {
    icon: '✨',
    title: 'AI Assets',
    description: 'Generate textures, props, scripts, and terrain with a single prompt. No Blender needed.',
  },
  {
    icon: '👥',
    title: 'Collaboration',
    description: 'Build with your team in real-time. Share projects, assign roles, and ship faster together.',
  },
  {
    icon: '🛒',
    title: 'Marketplace',
    description: 'Browse thousands of AI-generated assets from the community. Buy, sell, and remix everything.',
  },
  {
    icon: '📊',
    title: 'Analytics',
    description: 'Track your game\'s performance, player retention, and revenue. Data-driven iteration built in.',
  },
]

const STEPS = [
  {
    number: '01',
    title: 'Describe Your Vision',
    description: 'Use your voice or type a prompt. Describe the world you want to build — as simple or detailed as you like.',
  },
  {
    number: '02',
    title: 'AI Builds It',
    description: 'Our AI pipeline analyzes your input, searches the Roblox marketplace for assets, and assembles the scene.',
  },
  {
    number: '03',
    title: 'Deploy to Roblox',
    description: 'One click to push your creation directly into Roblox Studio. Play-test immediately, iterate fast.',
  },
]

const TESTIMONIALS = [
  {
    name: 'Alex R.',
    role: 'Indie Roblox Dev',
    avatar: 'AR',
    quote: 'I built my entire obby map in 20 minutes using voice commands. What used to take me a week now takes an afternoon. RobloxForge is insane.',
  },
  {
    name: 'Maya K.',
    role: 'Game Studio Owner',
    avatar: 'MK',
    quote: 'Our team ships 3x faster since adopting RobloxForge. The AI asset generation alone saves us hundreds of hours per project.',
  },
  {
    name: 'Jordan T.',
    role: 'Beginner Creator',
    avatar: 'JT',
    quote: 'I had zero Roblox experience. I described my dream game and RobloxForge built it. I got my first 1,000 players within a week.',
  },
]

const FAQS = [
  {
    q: 'Do I need to know how to code?',
    a: 'No. RobloxForge handles all the scripting. You describe what you want and we build it. If you do know Lua/Luau, you can refine and extend the generated code.',
  },
  {
    q: 'What is a token?',
    a: 'Tokens are the currency for AI operations. A simple terrain build costs ~50 tokens. A complex interactive game system might cost ~500. Free tier includes 500 tokens/month to get started.',
  },
  {
    q: 'Does RobloxForge work on mobile?',
    a: 'The web platform is fully mobile-responsive. Roblox Studio integration requires desktop.',
  },
  {
    q: 'Is my content safe?',
    a: 'All content is stored encrypted. You own everything you create — we never claim rights to your games or assets.',
  },
  {
    q: 'Does this comply with Roblox\'s Terms of Service?',
    a: 'Yes. RobloxForge is a third-party development tool, not a bot or exploit. We comply fully with Roblox\'s Developer Terms of Use.',
  },
  {
    q: 'Can I cancel anytime?',
    a: 'Yes. One-click cancellation in your billing settings. No penalties, no retention dark patterns. Your data stays accessible for 30 days after cancellation.',
  },
  {
    q: 'What is the 10% charity donation?',
    a: '10% of every dollar of revenue goes to a verified charity of your choice. You select the cause in your settings. This is a company commitment, not a tax deduction for customers.',
  },
  {
    q: 'Is there a free trial?',
    a: 'Yes — all paid plans include a 14-day free trial. No credit card required for the Free tier.',
  },
]

const CAUSES = [
  { name: 'Code.org', description: 'Teaching kids to code', icon: '💻' },
  { name: 'Games for Change', description: 'Gaming for social good', icon: '🎮' },
  { name: 'Child\'s Play', description: 'Games for children in hospitals', icon: '🏥' },
]

export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[#FFB81C]/5 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-20 pb-16 text-center">
          <div className="inline-flex items-center gap-2 bg-[#FFB81C]/10 border border-[#FFB81C]/20 rounded-full px-4 py-1.5 text-sm text-[#FFB81C] mb-8">
            <span className="w-2 h-2 rounded-full bg-[#FFB81C] animate-pulse" />
            Now in open beta — join 8,500+ creators
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-tight mb-6">
            Build Roblox Games in{' '}
            <span className="text-[#FFB81C]">Minutes,</span>
            <br />
            Not Months
          </h1>

          <p className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto mb-10">
            Speak your idea. Upload a reference image. Watch AI turn it into a playable Roblox
            game — complete with terrain, assets, and scripts.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <Link
              href="/sign-up"
              className="w-full sm:w-auto bg-[#FFB81C] hover:bg-[#E6A519] text-black font-bold text-lg px-8 py-4 rounded-xl transition-colors shadow-lg shadow-[#FFB81C]/20"
            >
              Start Building Free
            </Link>
            <a
              href="#demo"
              className="w-full sm:w-auto border border-white/20 hover:border-white/40 text-white font-medium text-lg px-8 py-4 rounded-xl transition-colors"
            >
              Watch Demo
            </a>
          </div>

          {/* Demo video placeholder */}
          <div id="demo" className="relative max-w-4xl mx-auto rounded-2xl overflow-hidden border border-white/10 bg-[#0D1231] aspect-video flex items-center justify-center">
            <div className="text-center">
              <div className="w-20 h-20 rounded-full bg-[#FFB81C]/20 border-2 border-[#FFB81C] flex items-center justify-center mx-auto mb-4 cursor-pointer hover:bg-[#FFB81C]/30 transition-colors">
                <svg className="w-8 h-8 text-[#FFB81C] ml-1" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M6.3 2.841A1.5 1.5 0 004 4.11v11.78a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                </svg>
              </div>
              <p className="text-gray-400 text-sm">Demo video — coming soon</p>
              <p className="text-gray-600 text-xs mt-1">See voice-to-game in under 60 seconds</p>
            </div>
          </div>
        </div>
      </section>

      {/* Social proof bar */}
      <section className="border-y border-white/10 bg-[#0D1231]/50 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { value: '8,500+', label: 'Creators' },
              { value: '45,000+', label: 'Games Built' },
              { value: '2.1M+', label: 'Hours Saved' },
              { value: '$124K', label: 'Donated to Charity' },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="text-2xl sm:text-3xl font-bold text-[#FFB81C]">{stat.value}</p>
                <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Everything You Need to Build
          </h2>
          <p className="text-gray-400 max-w-xl mx-auto">
            One platform. Every tool a Roblox creator needs — from your first game to a full studio.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="bg-[#0D1231] border border-white/10 rounded-2xl p-6 hover:border-[#FFB81C]/30 transition-colors group"
            >
              <div className="text-3xl mb-4">{feature.icon}</div>
              <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-[#FFB81C] transition-colors">
                {feature.title}
              </h3>
              <p className="text-gray-400 text-sm leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="bg-[#0D1231]/50 border-y border-white/10 py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">How It Works</h2>
            <p className="text-gray-400 max-w-xl mx-auto">
              From idea to playable game in three steps.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Connector lines (desktop) */}
            <div className="hidden md:block absolute top-8 left-1/3 right-1/3 h-px bg-gradient-to-r from-[#FFB81C]/50 to-[#FFB81C]/50" />

            {STEPS.map((step, i) => (
              <div key={step.number} className="text-center relative">
                <div className="w-16 h-16 rounded-2xl bg-[#FFB81C]/10 border border-[#FFB81C]/30 flex items-center justify-center mx-auto mb-6">
                  <span className="text-[#FFB81C] font-bold text-xl font-mono">{step.number}</span>
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">{step.title}</h3>
                <p className="text-gray-400 leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-24">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Simple Pricing</h2>
          <p className="text-gray-400 max-w-xl mx-auto">
            Start free. Scale when you need to. No surprises.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {[
            { tier: 'Free', price: '$0', tokens: '500 tokens/mo', cta: 'Get started', highlight: false },
            { tier: 'Hobby', price: '$4.99', tokens: '2,000 tokens/mo', cta: 'Start trial', highlight: false },
            { tier: 'Creator', price: '$14.99', tokens: '7,000 tokens/mo', cta: 'Start trial', highlight: true },
            { tier: 'Studio', price: '$49.99', tokens: '20,000 tokens/mo', cta: 'Start trial', highlight: false },
          ].map((plan) => (
            <div
              key={plan.tier}
              className={`rounded-2xl p-6 border ${
                plan.highlight
                  ? 'bg-[#FFB81C]/5 border-[#FFB81C]/40 ring-1 ring-[#FFB81C]/20'
                  : 'bg-[#0D1231] border-white/10'
              }`}
            >
              {plan.highlight && (
                <div className="text-xs font-semibold text-[#FFB81C] uppercase tracking-wider mb-3">
                  Most Popular
                </div>
              )}
              <p className="text-lg font-bold text-white mb-1">{plan.tier}</p>
              <p className="text-3xl font-bold text-white mb-1">
                {plan.price}
                <span className="text-sm text-gray-500 font-normal">/mo</span>
              </p>
              <p className="text-sm text-gray-400 mb-6">{plan.tokens}</p>
              <Link
                href="/pricing"
                className={`block text-center text-sm font-semibold py-2.5 rounded-lg transition-colors ${
                  plan.highlight
                    ? 'bg-[#FFB81C] hover:bg-[#E6A519] text-black'
                    : 'border border-white/20 hover:border-white/40 text-white'
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>

        <div className="text-center">
          <Link href="/pricing" className="text-[#FFB81C] hover:underline text-sm font-medium">
            View full pricing and feature comparison →
          </Link>
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-[#0D1231]/50 border-y border-white/10 py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Creators Love It</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="bg-[#0A0E27] border border-white/10 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-[#FFB81C]/20 flex items-center justify-center text-[#FFB81C] font-bold text-sm">
                    {t.avatar}
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm">{t.name}</p>
                    <p className="text-gray-500 text-xs">{t.role}</p>
                  </div>
                </div>
                <div className="flex gap-0.5 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-4 h-4 text-[#FFB81C]" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-gray-300 text-sm leading-relaxed">"{t.quote}"</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Charity section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-24">
        <div className="bg-gradient-to-br from-[#0D1231] to-[#111640] border border-[#FFB81C]/20 rounded-3xl p-8 sm:p-12 text-center">
          <div className="text-5xl mb-4">💛</div>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            10% of Every Dollar Goes to Charity
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Every subscription and token purchase sends 10% of revenue to a cause you choose.
            We've donated <span className="text-[#FFB81C] font-semibold">$124,000+</span> so far.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-2xl mx-auto mb-10">
            {CAUSES.map((cause) => (
              <div key={cause.name} className="bg-[#0A0E27] rounded-xl p-4 border border-white/10">
                <div className="text-2xl mb-2">{cause.icon}</div>
                <p className="text-white font-semibold text-sm">{cause.name}</p>
                <p className="text-gray-500 text-xs mt-1">{cause.description}</p>
              </div>
            ))}
          </div>

          <Link
            href="/sign-up"
            className="inline-block bg-[#FFB81C] hover:bg-[#E6A519] text-black font-bold px-8 py-4 rounded-xl transition-colors"
          >
            Build Something Good
          </Link>
          <p className="text-gray-600 text-xs mt-4">
            Charity donations are a company commitment. Not tax-deductible for customers. See{' '}
            <Link href="/terms#charity" className="hover:text-gray-400">Terms §12</Link>.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-[#0D1231]/50 border-t border-white/10 py-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-3">
            {FAQS.map((faq, i) => (
              <div
                key={i}
                className="bg-[#0A0E27] border border-white/10 rounded-xl overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full text-left px-6 py-5 flex items-center justify-between gap-4"
                >
                  <span className="text-white font-medium">{faq.q}</span>
                  <svg
                    className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform ${openFaq === i ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-5 text-gray-400 text-sm leading-relaxed border-t border-white/5">
                    <div className="pt-4">{faq.a}</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-24 text-center">
        <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">
          Ready to Build?
        </h2>
        <p className="text-xl text-gray-400 mb-10 max-w-xl mx-auto">
          Join 8,500+ creators. Start for free — no credit card required.
        </p>
        <Link
          href="/sign-up"
          className="inline-block bg-[#FFB81C] hover:bg-[#E6A519] text-black font-bold text-xl px-12 py-5 rounded-xl transition-colors shadow-2xl shadow-[#FFB81C]/20"
        >
          Start Building Free
        </Link>
        <p className="text-gray-600 text-sm mt-4">Free tier includes 500 tokens/month. No credit card required.</p>
      </section>
    </div>
  )
}
