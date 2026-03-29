'use client'
import { useState } from 'react'

const REFERRAL_URL = 'forjegames.com/ref/YOUR_CODE'

export default function ReferralsPage() {
  const [copied, setCopied] = useState(false)

  function copyLink() {
    navigator.clipboard.writeText(`https://${REFERRAL_URL}`).catch(() => {
      const el = document.createElement('textarea')
      el.value = `https://${REFERRAL_URL}`
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
    }).finally(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  function shareOnTwitter() {
    const text = encodeURIComponent(`Join me on Forje Games! Sign up with my link and we both earn rewards: https://${REFERRAL_URL}`)
    window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank')
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-6">Referrals</h1>

      {/* Referral Link Card */}
      <div className="bg-[#0D1231] border border-white/10 rounded-2xl p-6 mb-6">
        <p className="text-gray-400 text-sm mb-4">Share your link to earn rewards</p>

        <div className="bg-[#111640] border border-white/10 rounded-xl px-4 py-3 font-mono text-sm text-gray-300 mb-4">
          {REFERRAL_URL}
        </div>

        <div className="flex gap-3">
          <button
            onClick={copyLink}
            className="bg-[#FFB81C] hover:bg-[#E6A519] text-black font-bold px-5 py-2.5 rounded-xl text-sm transition-colors"
          >
            {copied ? 'Copied!' : 'Copy Link'}
          </button>
          <button
            onClick={shareOnTwitter}
            className="bg-white/5 hover:bg-white/10 text-white font-medium px-5 py-2.5 rounded-xl text-sm transition-colors border border-white/10"
          >
            Share on Twitter
          </button>
        </div>

        <p className="text-gray-500 text-xs mt-4">
          You earn: <span className="text-[#FFB81C]">$1 per signup</span> + <span className="text-[#FFB81C]">20% of their subscription forever</span>
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-[#0D1231] border border-white/10 rounded-2xl p-5">
          <p className="text-gray-500 text-xs mb-1">Total Referrals</p>
          <p className="text-white text-2xl font-bold">0</p>
        </div>
        <div className="bg-[#0D1231] border border-white/10 rounded-2xl p-5">
          <p className="text-gray-500 text-xs mb-1">Total Earned</p>
          <p className="text-white text-2xl font-bold">$0.00</p>
        </div>
      </div>

      {/* How it works */}
      <div className="bg-[#0D1231] border border-white/10 rounded-2xl p-6">
        <h2 className="text-white font-semibold mb-5">How it works</h2>
        <div className="flex flex-col gap-4">
          {[
            'Share your unique link',
            'Friends sign up through your link',
            'You earn $1 instantly + 20% of their subscription',
          ].map((step, i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="w-7 h-7 rounded-full bg-[#FFB81C]/10 border border-[#FFB81C]/20 flex items-center justify-center text-[#FFB81C] font-bold text-xs flex-shrink-0">
                {i + 1}
              </div>
              <p className="text-gray-300 text-sm">{step}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
