import type { Metadata } from 'next'
import { createMetadata } from '@/lib/metadata'

export const metadata: Metadata = createMetadata({
  title: 'DMCA Policy',
  description:
    'ForjeGames DMCA copyright takedown policy. Submit infringement notices to our designated agent. 48-hour response SLA with counter-notification instructions.',
  path: '/dmca',
  noIndex: true,
})

const EFFECTIVE_DATE = 'March 28, 2026'
const AGENT_EMAIL = 'dmca@forjegames.com'
const AGENT_NAME = 'Dawsen Porter'
const COMPANY = 'ForjeGames LLC'
const ADDRESS =
  'ForjeGames LLC, 30 N Gould St Ste R, Sheridan, WY 82801'

const sections = [
  { id: 'agent', title: 'Designated Copyright Agent' },
  { id: 'takedown', title: 'How to Submit a Takedown Notice' },
  { id: 'process', title: 'Our Takedown Process' },
  { id: 'counter', title: 'Counter-Notification Process' },
  { id: 'repeat', title: 'Repeat Infringer Policy' },
]

const takedownSteps = [
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
]

export default function DmcaPage() {
  return (
    <article className="max-w-3xl">
      {/* ── Header ── */}
      <div className="mb-12">
        <div className="inline-flex items-center gap-2 bg-[#FFB81C]/10 border border-[#FFB81C]/20 rounded-full px-3 py-1 text-xs text-[#FFB81C] font-medium mb-5">
          DMCA Policy
        </div>
        <h1 className="text-3xl font-bold text-[#FAFAFA] mb-3">DMCA Copyright Policy</h1>
        <p className="text-[#71717A] text-sm">
          Effective: <span className="text-[#FAFAFA]">{EFFECTIVE_DATE}</span>
          &nbsp;&middot;&nbsp;{COMPANY}
        </p>
      </div>

      {/* ── 48h SLA Banner ── */}
      <div className="bg-[#FFB81C]/[0.06] border border-[#FFB81C]/20 rounded-2xl p-5 mb-10 flex items-start gap-4">
        <div className="w-10 h-10 rounded-full bg-[#FFB81C]/15 flex items-center justify-center shrink-0">
          <span className="text-[#FFB81C] text-xs font-bold tabular-nums">48h</span>
        </div>
        <div>
          <p className="text-sm font-semibold text-[#FAFAFA] mb-1">48-Hour Response SLA</p>
          <p className="text-sm text-[#71717A] leading-relaxed">
            We commit to acknowledging all valid DMCA takedown notices within 48 hours of receipt
            and to taking action on verified notices promptly.
          </p>
        </div>
      </div>

      {/* ── Table of Contents ── */}
      <nav
        aria-label="Table of contents"
        className="bg-[#141414] border border-white/[0.07] rounded-2xl p-6 mb-12"
      >
        <p className="text-[10px] font-semibold text-[#52525B] uppercase tracking-widest mb-4">
          Table of Contents
        </p>
        <ol className="space-y-0.5">
          {sections.map((s) => (
            <li key={s.id}>
              <a
                href={`#${s.id}`}
                className="text-sm text-[#71717A] hover:text-[#FFB81C] transition-colors block py-1"
              >
                {s.title}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <p className="text-[#71717A] leading-relaxed mb-10">
        {COMPANY} respects intellectual property rights and complies with the Digital Millennium
        Copyright Act (17 U.S.C. § 512) (&quot;DMCA&quot;). If you believe content on ForjeGames
        infringes your copyright, follow the process below.
      </p>

      {/* ── Designated Agent ── */}
      <section id="agent" className="scroll-mt-24 mt-12">
        <SectionHeading title="Designated Copyright Agent" />
        <div className="bg-[#141414] border border-white/[0.07] rounded-2xl p-5 text-sm space-y-2">
          <p className="text-[#71717A]">
            <span className="text-[#FAFAFA] font-medium">Agent:</span> {AGENT_NAME}
          </p>
          <p className="text-[#71717A]">
            <span className="text-[#FAFAFA] font-medium">Company:</span> {COMPANY}
          </p>
          <p className="text-[#71717A]">
            <span className="text-[#FAFAFA] font-medium">Address:</span> {ADDRESS}
          </p>
          <p className="text-[#71717A]">
            <span className="text-[#FAFAFA] font-medium">Email:</span>{' '}
            <a href={`mailto:${AGENT_EMAIL}`} className="text-[#FFB81C] hover:underline">
              {AGENT_EMAIL}
            </a>
          </p>
          <p className="text-[#52525B] text-xs pt-2 border-t border-white/[0.05]">
            Our designated agent is registered with the U.S. Copyright Office per 17 U.S.C.
            § 512(c)(2). See our registration documentation for Form HAL filing details.
          </p>
        </div>
      </section>

      <Divider />

      {/* ── Takedown Notice ── */}
      <section id="takedown" className="scroll-mt-24 mt-12">
        <SectionHeading title="How to Submit a Takedown Notice" />
        <p className="text-[#71717A] leading-relaxed mb-6">
          To submit a valid DMCA takedown notice, send a written notification to our designated agent
          at{' '}
          <a href={`mailto:${AGENT_EMAIL}`} className="text-[#FFB81C] hover:underline">
            {AGENT_EMAIL}
          </a>{' '}
          that includes <strong className="text-[#FAFAFA] font-semibold">all of the following</strong>{' '}
          elements required by 17 U.S.C. § 512(c)(3):
        </p>

        <ol className="space-y-4">
          {[
            [
              '1. Identification of the copyrighted work',
              'Identify the copyrighted work you claim has been infringed. If multiple works, you may provide a representative list.',
            ],
            [
              '2. Identification of the infringing material',
              'Provide the specific URL(s) or sufficient identifying information to allow us to locate the allegedly infringing content on our platform.',
            ],
            [
              '3. Your contact information',
              'Your full name, address, telephone number, and email address.',
            ],
            [
              '4. Good faith statement',
              'A statement that you have a good faith belief that use of the material in the manner complained of is not authorized by the copyright owner, its agent, or the law.',
            ],
            [
              '5. Accuracy statement',
              'A statement that the information in the notification is accurate, and under penalty of perjury, that you are the copyright owner or authorized to act on behalf of the owner.',
            ],
            [
              '6. Signature',
              'A physical or electronic signature of the copyright owner or authorized representative.',
            ],
          ].map(([label, desc], i) => (
            <li
              key={i}
              className="bg-[#141414] border border-white/[0.07] rounded-xl p-4 flex gap-4"
            >
              <span className="w-7 h-7 rounded-full bg-[#FFB81C]/15 text-[#FFB81C] font-bold text-xs flex items-center justify-center shrink-0 tabular-nums">
                {i + 1}
              </span>
              <div>
                <p className="text-[#FAFAFA] font-medium text-sm mb-1">{(label as string).replace(/^\d+\. /, '')}</p>
                <p className="text-[#71717A] text-sm leading-relaxed">{desc as string}</p>
              </div>
            </li>
          ))}
        </ol>

        <div className="bg-[#141414] border border-white/[0.07] rounded-2xl p-5 mt-6">
          <p className="text-sm font-semibold text-[#FAFAFA] mb-2">Warning: Misrepresentation</p>
          <p className="text-sm text-[#71717A] leading-relaxed">
            Under 17 U.S.C. § 512(f), knowingly making material misrepresentations in a DMCA notice
            may subject you to liability for damages, including costs and attorneys&apos; fees. Abuse
            of the DMCA process may result in your notice being rejected and your access to the
            Service terminated.
          </p>
        </div>
      </section>

      <Divider />

      {/* ── Our Process ── */}
      <section id="process" className="scroll-mt-24 mt-12">
        <SectionHeading title="Our Takedown Process" />
        <div className="space-y-3">
          {takedownSteps.map(({ step, title, desc }) => (
            <div
              key={step}
              className="flex gap-4 bg-[#141414] border border-white/[0.07] rounded-xl p-4"
            >
              <div className="w-8 h-8 rounded-full bg-[#FFB81C]/15 text-[#FFB81C] font-bold text-sm flex items-center justify-center shrink-0 tabular-nums">
                {step}
              </div>
              <div>
                <p className="text-[#FAFAFA] font-medium text-sm mb-1">{title}</p>
                <p className="text-[#71717A] text-sm leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <Divider />

      {/* ── Counter-notification ── */}
      <section id="counter" className="scroll-mt-24 mt-12">
        <SectionHeading title="Counter-Notification Process" />
        <p className="text-[#71717A] leading-relaxed mb-5">
          If you believe your content was removed due to mistake or misidentification, you may submit
          a counter-notification under 17 U.S.C. § 512(g)(3). Send your counter-notification to{' '}
          <a href={`mailto:${AGENT_EMAIL}`} className="text-[#FFB81C] hover:underline">
            {AGENT_EMAIL}
          </a>{' '}
          including:
        </p>
        <ol className="space-y-3">
          {[
            'Identification of the removed content and its location before removal',
            'A statement under penalty of perjury that you have a good faith belief the content was removed due to mistake or misidentification',
            'Your name, address, telephone number, and email address',
            'A statement consenting to jurisdiction of the federal district court in your district (or the Western District of Texas if outside the US), and that you will accept service of process from the complaining party',
            'Your physical or electronic signature',
          ].map((item, i) => (
            <li key={i} className="flex gap-3 text-[#71717A]">
              <span className="mt-0.5 w-5 h-5 rounded-full bg-[#FFB81C]/15 text-[#FFB81C] font-bold text-xs flex items-center justify-center shrink-0 tabular-nums">
                {i + 1}
              </span>
              <span className="leading-relaxed">{item}</span>
            </li>
          ))}
        </ol>
        <p className="text-[#71717A] leading-relaxed mt-5">
          Upon receiving a valid counter-notification, we will forward it to the original
          complainant. If the complainant does not file a court action within 10&ndash;14 business
          days, we may restore the content.
        </p>
      </section>

      <Divider />

      {/* ── Repeat Infringers ── */}
      <section id="repeat" className="scroll-mt-24 mt-12">
        <SectionHeading title="Repeat Infringer Policy" />
        <p className="text-[#71717A] leading-relaxed mb-5">
          {COMPANY} maintains a repeat-infringer policy in compliance with 17 U.S.C. §
          512(i)(1)(A). We will terminate the accounts of users who are repeat copyright infringers
          in appropriate circumstances. Specifically:
        </p>
        <div className="space-y-3">
          {[
            ['First verified infringement', 'Content removal + warning'],
            ['Second verified infringement', 'Content removal + 30-day account suspension'],
            ['Third verified infringement', 'Permanent account termination'],
          ].map(([label, action]) => (
            <div
              key={label}
              className="bg-[#141414] border border-white/[0.07] rounded-xl px-5 py-4 flex items-center justify-between gap-4"
            >
              <span className="text-sm text-[#71717A]">{label}</span>
              <span className="text-sm text-[#FAFAFA] font-medium shrink-0">{action}</span>
            </div>
          ))}
        </div>
        <p className="text-[#71717A] leading-relaxed mt-5">
          We reserve the right to terminate accounts sooner for egregious infringement or bad faith.
        </p>
      </section>

      {/* ── Footer ── */}
      <div className="mt-14 pt-8 border-t border-white/[0.06]">
        <div className="bg-[#141414] border border-white/[0.07] rounded-2xl p-5 text-sm space-y-1">
          <p className="text-[#71717A]">
            <span className="text-[#FAFAFA] font-medium">DMCA Agent:</span>{' '}
            <a href={`mailto:${AGENT_EMAIL}`} className="text-[#FFB81C] hover:underline">
              {AGENT_EMAIL}
            </a>
          </p>
          <p className="text-[#71717A]">
            <span className="text-[#FAFAFA] font-medium">Last updated:</span> {EFFECTIVE_DATE}
          </p>
        </div>
      </div>
    </article>
  )
}

function SectionHeading({ title }: { title: string }) {
  return (
    <h2 className="flex items-baseline gap-3 text-xl font-bold text-[#FAFAFA] mb-5 pb-3 border-b border-white/[0.06]">
      <span className="text-[#FFB81C] font-bold text-base">&mdash;</span>
      {title}
    </h2>
  )
}

function Divider() {
  return <div className="border-t border-white/[0.04] mt-12" />
}
