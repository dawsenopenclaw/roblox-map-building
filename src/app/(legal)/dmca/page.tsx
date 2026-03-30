import type { Metadata } from 'next'
import { createMetadata } from '@/lib/metadata'

export const metadata: Metadata = createMetadata({
  title: 'DMCA Policy',
  description: 'ForjeGames DMCA copyright takedown policy. Submit infringement notices to our designated agent. 48-hour response SLA with counter-notification instructions.',
  path: '/dmca',
  noIndex: true,
})

const EFFECTIVE_DATE = 'March 28, 2026'
const AGENT_EMAIL = 'dmca@forjegames.com'
const AGENT_NAME = 'Dawsen Porter'
const COMPANY = 'ForjeGames LLC'
const ADDRESS = 'ForjeGames LLC, 30 N Gould St Ste R, Sheridan, WY 82801, [Complete Physical Address Required — Update Before Launch]'

export default function DmcaPage() {
  return (
    <article className="prose prose-invert prose-sm max-w-none">
      {/* Header */}
      <div className="mb-10">
        <div className="inline-flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-full px-3 py-1 text-xs text-red-400 font-medium mb-4">
          DMCA Policy
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">DMCA Copyright Policy</h1>
        <p className="text-gray-300 text-sm">
          Effective: {EFFECTIVE_DATE} &nbsp;·&nbsp; {COMPANY}
        </p>
      </div>

      {/* SLA Banner */}
      <div className="bg-[#FFB81C]/10 border border-[#FFB81C]/20 rounded-xl p-4 mb-8 not-prose flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-[#FFB81C]/20 flex items-center justify-center shrink-0 mt-0.5">
          <span className="text-[#FFB81C] text-xs font-bold">48h</span>
        </div>
        <div>
          <p className="text-sm font-semibold text-white">48-Hour Response SLA</p>
          <p className="text-sm text-gray-300 mt-0.5">
            We commit to acknowledging all valid DMCA takedown notices within 48 hours of receipt and
            to taking action on verified notices promptly.
          </p>
        </div>
      </div>

      <p className="text-gray-300 leading-relaxed">
        {COMPANY} respects intellectual property rights and complies with the Digital Millennium
        Copyright Act (17 U.S.C. § 512) (&quot;DMCA&quot;). If you believe content on ForjeGames
        infringes your copyright, follow the process below.
      </p>

      {/* ─── Designated Agent ─── */}
      <section className="mt-10">
        <h2 className="text-xl font-bold text-white border-b border-white/10 pb-2 mb-4">
          Designated Copyright Agent
        </h2>
        <div className="bg-white/5 border border-white/10 rounded-lg p-5 not-prose text-sm space-y-1">
          <p><strong className="text-white">Agent:</strong> {AGENT_NAME}</p>
          <p><strong className="text-white">Company:</strong> {COMPANY}</p>
          <p><strong className="text-white">Address:</strong> {ADDRESS}</p>
          <p>
            <strong className="text-white">Email:</strong>{' '}
            <a href={`mailto:${AGENT_EMAIL}`} className="text-[#FFB81C] hover:underline">
              {AGENT_EMAIL}
            </a>
          </p>
          <p className="text-gray-400 text-xs mt-3">
            * Our designated agent is registered with the U.S. Copyright Office per 17 U.S.C.
            § 512(c)(2). See our registration documentation for Form HAL filing details.
          </p>
        </div>
      </section>

      {/* ─── Takedown Notice ─── */}
      <section className="mt-10">
        <h2 className="text-xl font-bold text-white border-b border-white/10 pb-2 mb-4">
          How to Submit a Takedown Notice
        </h2>
        <p>
          To submit a valid DMCA takedown notice, send a written notification to our designated agent
          at <a href={`mailto:${AGENT_EMAIL}`} className="text-[#FFB81C] hover:underline">{AGENT_EMAIL}</a>{' '}
          that includes <strong className="text-white">all of the following</strong> elements
          required by 17 U.S.C. § 512(c)(3):
        </p>

        <ol className="space-y-3 mt-4">
          <li className="text-gray-300">
            <strong className="text-white">1. Identification of the copyrighted work.</strong>{' '}
            Identify the copyrighted work you claim has been infringed. If multiple works, you may
            provide a representative list.
          </li>
          <li className="text-gray-300">
            <strong className="text-white">2. Identification of the infringing material.</strong>{' '}
            Provide the specific URL(s) or sufficient identifying information to allow us to locate
            the allegedly infringing content on our platform.
          </li>
          <li className="text-gray-300">
            <strong className="text-white">3. Your contact information.</strong>{' '}
            Your full name, address, telephone number, and email address.
          </li>
          <li className="text-gray-300">
            <strong className="text-white">4. Good faith statement.</strong>{' '}
            A statement that you have a good faith belief that use of the material in the manner
            complained of is not authorized by the copyright owner, its agent, or the law.
          </li>
          <li className="text-gray-300">
            <strong className="text-white">5. Accuracy statement.</strong>{' '}
            A statement that the information in the notification is accurate, and under penalty of
            perjury, that you are the copyright owner or authorized to act on behalf of the owner.
          </li>
          <li className="text-gray-300">
            <strong className="text-white">6. Signature.</strong>{' '}
            A physical or electronic signature of the copyright owner or authorized representative.
          </li>
        </ol>

        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mt-6 not-prose">
          <p className="text-sm text-red-400 font-medium">Warning: Misrepresentation</p>
          <p className="text-sm text-gray-300 mt-1">
            Under 17 U.S.C. § 512(f), knowingly making material misrepresentations in a DMCA
            notice may subject you to liability for damages, including costs and attorneys&apos;
            fees. Abuse of the DMCA process may result in your notice being rejected and your
            access to the Service terminated.
          </p>
        </div>
      </section>

      {/* ─── Our Process ─── */}
      <section className="mt-10">
        <h2 className="text-xl font-bold text-white border-b border-white/10 pb-2 mb-4">
          Our Takedown Process
        </h2>

        <div className="not-prose space-y-3">
          {[
            {
              step: '1',
              title: 'Receipt (0h)',
              desc: `We receive your notice at ${AGENT_EMAIL}.`,
            },
            {
              step: '2',
              title: 'Acknowledgment (within 48h)',
              desc: 'We send an acknowledgment email confirming receipt and our assigned ticket number.',
            },
            {
              step: '3',
              title: 'Review',
              desc: 'We review the notice for completeness and validity under 17 U.S.C. § 512(c)(3). Incomplete notices will be returned with guidance.',
            },
            {
              step: '4',
              title: 'Action',
              desc: 'For valid notices, we remove or disable access to the infringing content promptly. We notify the user who uploaded the content.',
            },
            {
              step: '5',
              title: 'Counter-notification',
              desc: 'The user has the right to submit a counter-notification. If no counter-notification is received within 10 business days, the content remains disabled.',
            },
          ].map(({ step, title, desc }) => (
            <div key={step} className="flex gap-4 p-4 bg-white/5 border border-white/10 rounded-lg">
              <div className="w-8 h-8 rounded-full bg-[#FFB81C]/20 text-[#FFB81C] font-bold text-sm flex items-center justify-center shrink-0">
                {step}
              </div>
              <div>
                <p className="text-white font-medium text-sm">{title}</p>
                <p className="text-gray-300 text-sm mt-1">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Counter-notification ─── */}
      <section className="mt-10">
        <h2 className="text-xl font-bold text-white border-b border-white/10 pb-2 mb-4">
          Counter-Notification Process
        </h2>
        <p>
          If you believe your content was removed due to mistake or misidentification, you may submit
          a counter-notification under 17 U.S.C. § 512(g)(3). Send your counter-notification to{' '}
          <a href={`mailto:${AGENT_EMAIL}`} className="text-[#FFB81C] hover:underline">{AGENT_EMAIL}</a>{' '}
          including:
        </p>
        <ol className="space-y-2 mt-4 text-gray-300">
          <li>1. Identification of the removed content and its location before removal</li>
          <li>2. A statement under penalty of perjury that you have a good faith belief the content was removed due to mistake or misidentification</li>
          <li>3. Your name, address, telephone number, and email address</li>
          <li>4. A statement consenting to jurisdiction of the federal district court in your district (or the Western District of Texas if outside the US), and that you will accept service of process from the complaining party</li>
          <li>5. Your physical or electronic signature</li>
        </ol>
        <p className="mt-4">
          Upon receiving a valid counter-notification, we will forward it to the original complainant.
          If the complainant does not file a court action within 10-14 business days, we may restore
          the content.
        </p>
      </section>

      {/* ─── Repeat Infringers ─── */}
      <section className="mt-10">
        <h2 className="text-xl font-bold text-white border-b border-white/10 pb-2 mb-4">
          Repeat Infringer Policy
        </h2>
        <p>
          {COMPANY} maintains a repeat-infringer policy in compliance with 17 U.S.C. § 512(i)(1)(A).
          We will terminate the accounts of users who are repeat copyright infringers in appropriate
          circumstances. Specifically:
        </p>
        <ul className="space-y-1 text-gray-300 mt-3">
          <li>First verified infringement: Content removal + warning</li>
          <li>Second verified infringement: Content removal + 30-day account suspension</li>
          <li>Third verified infringement: Permanent account termination</li>
        </ul>
        <p className="mt-4">
          We reserve the right to terminate accounts sooner for egregious infringement or bad faith.
        </p>
      </section>

      {/* ─── Footer ─── */}
      <div className="mt-10 pt-6 border-t border-white/10">
        <p className="text-sm text-gray-400">
          <strong className="text-gray-300">DMCA Agent:</strong>{' '}
          <a href={`mailto:${AGENT_EMAIL}`} className="text-[#FFB81C] hover:underline">{AGENT_EMAIL}</a>
          &nbsp;·&nbsp;
          <strong className="text-gray-300">Last updated:</strong> {EFFECTIVE_DATE}
        </p>
      </div>
    </article>
  )
}
