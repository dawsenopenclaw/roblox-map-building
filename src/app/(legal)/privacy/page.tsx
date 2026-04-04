import type { Metadata } from 'next'
import { createMetadata } from '@/lib/metadata'

export const metadata: Metadata = createMetadata({
  title: 'Privacy Policy',
  description:
    'How ForjeGames collects, uses, and protects your personal data. GDPR, CCPA, and COPPA compliant. Covers data retention, cookies, and your full privacy rights.',
  path: '/privacy',
  noIndex: true,
})

const EFFECTIVE_DATE = 'March 28, 2026'
const COMPANY = 'ForjeGames LLC'
const EMAIL = 'privacy@forjegames.com'
const DPA_EMAIL = 'dpa@forjegames.com'

const sections = [
  { id: 'collect', title: '1. Information We Collect' },
  { id: 'use', title: '2. How We Use Your Information' },
  { id: 'sharing', title: '3. How We Share Your Information' },
  { id: 'retention', title: '4. Data Retention' },
  { id: 'security', title: '5. Security Measures' },
  { id: 'gdpr', title: '6. GDPR — EU / EEA / UK Rights' },
  { id: 'ccpa', title: '7. CCPA — California Rights' },
  { id: 'coppa', title: '8. COPPA — Children Under 13' },
  { id: 'cookies', title: '9. Cookies & Tracking Technologies' },
  { id: 'contact', title: '10. Contact & Data Controller' },
]

export default function PrivacyPage() {
  return (
    <article className="max-w-3xl">
      {/* ── Header ── */}
      <div className="mb-12">
        <div className="inline-flex items-center gap-2 bg-[#D4AF37]/10 border border-[#D4AF37]/20 rounded-full px-3 py-1 text-xs text-[#D4AF37] font-medium mb-5">
          Privacy Document
        </div>
        <h1 className="text-3xl font-bold text-[#FAFAFA] mb-3">Privacy Policy</h1>
        <p className="text-[#71717A] text-sm">
          Effective: <span className="text-[#FAFAFA]">{EFFECTIVE_DATE}</span>
          &nbsp;&middot;&nbsp;{COMPANY}
        </p>
        <p className="text-[#71717A] text-sm mt-1">
          Questions?{' '}
          <a href={`mailto:${EMAIL}`} className="text-[#D4AF37] hover:underline">
            {EMAIL}
          </a>
        </p>
      </div>

      {/* ── Table of Contents ── */}
      <nav
        aria-label="Table of contents"
        className="bg-[#141414] border border-white/[0.07] rounded-2xl p-6 mb-12"
      >
        <p className="text-[10px] font-semibold text-[#52525B] uppercase tracking-widest mb-4">
          Table of Contents
        </p>
        <ol className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-0.5">
          {sections.map((s) => (
            <li key={s.id}>
              <a
                href={`#${s.id}`}
                className="text-sm text-[#71717A] hover:text-[#D4AF37] transition-colors block py-1"
              >
                {s.title}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <p className="text-[#71717A] leading-relaxed mb-10">
        {COMPANY} (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) is committed to protecting
        your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your
        information when you use ForjeGames (the &quot;Service&quot;). Please read this policy
        carefully. By using the Service, you agree to the practices described here.
      </p>

      {/* ── Section 1 ── */}
      <section id="collect" className="scroll-mt-24 mt-12">
        <SectionHeading number="1" title="Information We Collect" />

        <h3 className="text-sm font-semibold text-[#FAFAFA] uppercase tracking-wider mb-3">
          A. Information You Provide
        </h3>
        <ul className="space-y-2 text-[#71717A] leading-relaxed mb-7">
          {[
            ['Account data', 'email address, username, display name, profile photo'],
            [
              'Payment data',
              'billing address, payment method (processed by Stripe — we never store raw card numbers)',
            ],
            [
              'Prompts & inputs',
              'text, images, and files you submit to the AI generation system',
            ],
            ['Communications', 'support tickets, emails, feedback'],
            [
              'Age verification data',
              'date of birth (for COPPA compliance) and, for users under 13, parent/guardian email and consent records',
            ],
          ].map(([label, desc]) => (
            <li key={label} className="flex gap-3">
              <span className="mt-1.5 w-1 h-1 rounded-full bg-[#D4AF37]/40 shrink-0" />
              <span>
                <strong className="text-[#FAFAFA] font-medium">{label}:</strong> {desc}
              </span>
            </li>
          ))}
        </ul>

        <h3 className="text-sm font-semibold text-[#FAFAFA] uppercase tracking-wider mb-3">
          B. Information Collected Automatically
        </h3>
        <ul className="space-y-2 text-[#71717A] leading-relaxed mb-7">
          {[
            ['Usage data', 'pages visited, features used, generation history, token consumption'],
            ['Device data', 'browser type, operating system, screen resolution, IP address'],
            ['Log data', 'server logs, error reports, timestamps'],
            [
              'Cookies & tracking',
              'session cookies (required), analytics cookies (optional, consent-gated in EU)',
            ],
          ].map(([label, desc]) => (
            <li key={label} className="flex gap-3">
              <span className="mt-1.5 w-1 h-1 rounded-full bg-[#D4AF37]/40 shrink-0" />
              <span>
                <strong className="text-[#FAFAFA] font-medium">{label}:</strong> {desc}
              </span>
            </li>
          ))}
        </ul>

        <h3 className="text-sm font-semibold text-[#FAFAFA] uppercase tracking-wider mb-3">
          C. Information from Third Parties
        </h3>
        <ul className="space-y-2 text-[#71717A] leading-relaxed">
          {[
            [
              'Clerk (authentication)',
              'OAuth profile data if you sign in with Google or other providers',
            ],
            ['Stripe', 'payment status, subscription state'],
            [
              'Roblox',
              'if you connect your Roblox account, we receive your Roblox username and user ID',
            ],
          ].map(([label, desc]) => (
            <li key={label} className="flex gap-3">
              <span className="mt-1.5 w-1 h-1 rounded-full bg-[#D4AF37]/40 shrink-0" />
              <span>
                <strong className="text-[#FAFAFA] font-medium">{label}:</strong> {desc}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <Divider />

      {/* ── Section 2 ── */}
      <section id="use" className="scroll-mt-24 mt-12">
        <SectionHeading number="2" title="How We Use Your Information" />
        <div className="overflow-x-auto rounded-2xl border border-white/[0.07]">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-white/[0.04] border-b border-white/[0.07]">
                <th className="text-left px-5 py-3 text-[#71717A] font-medium">Purpose</th>
                <th className="text-left px-5 py-3 text-[#71717A] font-medium">
                  Legal Basis (GDPR)
                </th>
              </tr>
            </thead>
            <tbody>
              {[
                ['Provide and operate the Service', 'Contract performance'],
                ['Process payments and manage subscriptions', 'Contract performance'],
                ['AI generation (processing your prompts)', 'Contract performance'],
                ['Improve AI models and Service quality', 'Legitimate interest / Consent'],
                ['Send transactional emails (receipts, alerts)', 'Contract performance'],
                ['Send marketing emails (newsletters, promotions)', 'Consent (opt-in)'],
                ['Detect fraud and ensure security', 'Legitimate interest'],
                ['Comply with legal obligations (COPPA, GDPR, CCPA)', 'Legal obligation'],
                ['Respond to support requests', 'Legitimate interest / Contract'],
                ['Analytics and usage insights', 'Legitimate interest / Consent'],
              ].map(([purpose, basis], i) => (
                <tr
                  key={purpose}
                  className={`border-b border-white/[0.04] ${i % 2 === 0 ? '' : 'bg-white/[0.015]'}`}
                >
                  <td className="px-5 py-3 text-[#71717A]">{purpose}</td>
                  <td className="px-5 py-3 text-[#71717A]">{basis}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <Divider />

      {/* ── Section 3 ── */}
      <section id="sharing" className="scroll-mt-24 mt-12">
        <SectionHeading number="3" title="How We Share Your Information" />
        <p className="text-[#71717A] leading-relaxed mb-4">
          We do not sell your personal information. We share data only as follows:
        </p>
        <ul className="space-y-4 text-[#71717A] leading-relaxed">
          {[
            [
              'Service providers',
              'Stripe (payments), Clerk (auth), Anthropic (AI), Meshy (3D generation), Fal.ai (image generation), Sentry (error tracking), PostHog (analytics), Resend (email), Vercel (hosting). These processors handle data on our behalf under Data Processing Agreements.',
            ],
            [
              'Legal requirements',
              'We may disclose data when required by law, subpoena, court order, or to protect our legal rights.',
            ],
            [
              'Business transfers',
              'In connection with a merger, acquisition, or sale of assets, your data may be transferred. We will notify you before your data is transferred and subject to different privacy policies.',
            ],
            ['With your consent', 'Any other sharing requires your explicit consent.'],
          ].map(([label, desc]) => (
            <li key={label} className="flex gap-3">
              <span className="mt-1.5 w-1 h-1 rounded-full bg-[#D4AF37]/40 shrink-0" />
              <span>
                <strong className="text-[#FAFAFA] font-medium">{label}:</strong> {desc}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <Divider />

      {/* ── Section 4 ── */}
      <section id="retention" className="scroll-mt-24 mt-12">
        <SectionHeading number="4" title="Data Retention" />
        <div className="overflow-x-auto rounded-2xl border border-white/[0.07]">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-white/[0.04] border-b border-white/[0.07]">
                <th className="text-left px-5 py-3 text-[#71717A] font-medium">Data Type</th>
                <th className="text-left px-5 py-3 text-[#71717A] font-medium">
                  Retention Period
                </th>
              </tr>
            </thead>
            <tbody>
              {[
                ['Account data', 'Until account deletion + 30 days'],
                ['Generation history / prompts', '2 years or until deletion request'],
                ['Payment records', '7 years (tax/legal requirement)'],
                ['COPPA parental consent records', '5 years (FTC requirement)'],
                ['Security/fraud logs', '2 years'],
                ['Analytics data', '13 months (PostHog default)'],
                ['Marketing consent records', 'Until withdrawn + 3 years'],
              ].map(([type, period], i) => (
                <tr
                  key={type}
                  className={`border-b border-white/[0.04] ${i % 2 === 0 ? '' : 'bg-white/[0.015]'}`}
                >
                  <td className="px-5 py-3 text-[#71717A]">{type}</td>
                  <td className="px-5 py-3 text-[#71717A]">{period}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <Divider />

      {/* ── Section 5 ── */}
      <section id="security" className="scroll-mt-24 mt-12">
        <SectionHeading number="5" title="Security Measures" />
        <p className="text-[#71717A] leading-relaxed mb-4">
          We implement industry-standard safeguards including:
        </p>
        <ul className="space-y-2 text-[#71717A] leading-relaxed mb-5">
          {[
            'TLS 1.2+ encryption for all data in transit',
            'AES-256 encryption for sensitive data at rest',
            'Hashed passwords (we never store plaintext passwords)',
            'Role-based access controls for internal staff',
            'Regular security audits and dependency scanning (Sentry)',
            'Stripe PCI DSS Level 1 compliance for payment data',
          ].map((item) => (
            <li key={item} className="flex gap-3">
              <span className="mt-1.5 w-1 h-1 rounded-full bg-[#D4AF37]/40 shrink-0" />
              {item}
            </li>
          ))}
        </ul>
        <p className="text-[#71717A] leading-relaxed">
          No system is 100% secure. In the event of a data breach that affects your rights, we will
          notify you within 72 hours as required by GDPR Article 33, and within timeframes required
          by applicable state laws.
        </p>
      </section>

      <Divider />

      {/* ── Section 6 — GDPR ── */}
      <section id="gdpr" className="scroll-mt-24 mt-12">
        <SectionHeading number="6" title="GDPR — EU / EEA / UK Rights" />
        <div className="bg-[#141414] border border-white/[0.07] rounded-2xl p-6">
          <p className="text-[10px] font-semibold text-[#D4AF37] uppercase tracking-widest mb-4">
            EU / EEA / UK Residents
          </p>
          <p className="text-sm text-[#71717A] leading-relaxed mb-5">
            If you are in the EU, EEA, or United Kingdom, the General Data Protection Regulation
            (GDPR) or UK GDPR applies. You have the following rights:
          </p>
          <ul className="space-y-3 text-sm text-[#71717A] leading-relaxed mb-5">
            {[
              [
                'Right of Access (Art. 15)',
                'Request a copy of the personal data we hold about you.',
              ],
              [
                'Right to Rectification (Art. 16)',
                'Request correction of inaccurate or incomplete data.',
              ],
              [
                'Right to Erasure / "Right to be Forgotten" (Art. 17)',
                'Request deletion of your personal data, subject to legal retention obligations.',
              ],
              [
                'Right to Restriction (Art. 18)',
                'Request that we restrict processing of your data in certain circumstances.',
              ],
              [
                'Right to Data Portability (Art. 20)',
                'Receive your data in a structured, machine-readable format. Contact us to request your data manually.',
              ],
              [
                'Right to Object (Art. 21)',
                'Object to processing based on legitimate interests, including profiling and direct marketing.',
              ],
              [
                'Right to Withdraw Consent',
                'Where processing is based on consent, you may withdraw at any time without affecting prior processing.',
              ],
              [
                'Right to Lodge a Complaint',
                'You may lodge a complaint with your local supervisory authority (e.g., ICO in the UK, CNIL in France).',
              ],
            ].map(([label, desc]) => (
              <li key={label} className="flex gap-3">
                <span className="mt-1.5 w-1 h-1 rounded-full bg-[#D4AF37]/40 shrink-0" />
                <span>
                  <strong className="text-[#FAFAFA] font-medium">{label}:</strong> {desc}
                </span>
              </li>
            ))}
          </ul>
          <p className="text-sm text-[#71717A] leading-relaxed mb-3">
            To exercise any right, contact us at{' '}
            <a href={`mailto:${DPA_EMAIL}`} className="text-[#D4AF37] hover:underline">
              {DPA_EMAIL}
            </a>
            . We will respond within 30 days. Identity verification may be required.
          </p>
          <p className="text-sm text-[#71717A] leading-relaxed mb-3">
            <strong className="text-[#FAFAFA] font-medium">International transfers:</strong> We
            transfer data from the EU/UK to the US. We rely on the EU-US Data Privacy Framework and
            Standard Contractual Clauses (SCCs) as our legal transfer mechanism.
          </p>
          <p className="text-sm text-[#71717A] leading-relaxed">
            <strong className="text-[#FAFAFA] font-medium">Data Processing Agreement:</strong>{' '}
            Enterprise and B2B customers may request a DPA at{' '}
            <a href={`mailto:${DPA_EMAIL}`} className="text-[#D4AF37] hover:underline">
              {DPA_EMAIL}
            </a>
            .
          </p>
        </div>
      </section>

      <Divider />

      {/* ── Section 7 — CCPA ── */}
      <section id="ccpa" className="scroll-mt-24 mt-12">
        <SectionHeading number="7" title="CCPA — California Rights" />
        <div className="bg-[#141414] border border-white/[0.07] rounded-2xl p-6">
          <p className="text-[10px] font-semibold text-[#D4AF37] uppercase tracking-widest mb-4">
            California Residents — CCPA / CPRA
          </p>
          <p className="text-sm text-[#71717A] leading-relaxed mb-5">
            The California Consumer Privacy Act (CCPA) as amended by the California Privacy Rights
            Act (CPRA) grants California residents the following rights:
          </p>
          <ul className="space-y-3 text-sm text-[#71717A] leading-relaxed mb-5">
            {[
              [
                'Right to Know',
                'Request disclosure of the categories and specific pieces of personal information we have collected, used, disclosed, and sold in the past 12 months.',
              ],
              [
                'Right to Delete',
                'Request deletion of personal information we have collected, subject to certain exceptions.',
              ],
              [
                'Right to Correct',
                'Request correction of inaccurate personal information.',
              ],
              [
                'Right to Opt-Out of Sale/Sharing',
                'We do not sell personal information. We do not share personal information for cross-context behavioral advertising without consent.',
              ],
              [
                'Right to Limit Sensitive PI Use',
                'Limit our use and disclosure of sensitive personal information to permitted purposes.',
              ],
              [
                'Right to Non-Discrimination',
                'We will not discriminate against you for exercising CCPA rights.',
              ],
            ].map(([label, desc]) => (
              <li key={label} className="flex gap-3">
                <span className="mt-1.5 w-1 h-1 rounded-full bg-[#D4AF37]/40 shrink-0" />
                <span>
                  <strong className="text-[#FAFAFA] font-medium">{label}:</strong> {desc}
                </span>
              </li>
            ))}
          </ul>
          <p className="text-sm text-[#71717A] leading-relaxed">
            To submit a CCPA request, contact us at{' '}
            <a href={`mailto:${EMAIL}`} className="text-[#D4AF37] hover:underline">
              {EMAIL}
            </a>{' '}
            with subject &quot;CCPA Request.&quot; We will respond within 45 days (extendable by 45
            days with notice). An authorized agent may submit on your behalf with written permission.
          </p>
        </div>
      </section>

      <Divider />

      {/* ── Section 8 — COPPA ── */}
      <section id="coppa" className="scroll-mt-24 mt-12">
        <SectionHeading number="8" title="COPPA — Children Under 13" />
        <div className="bg-[#141414] border border-white/[0.07] rounded-2xl p-6">
          <p className="text-[10px] font-semibold text-[#D4AF37] uppercase tracking-widest mb-4">
            Children Under 13
          </p>
          <p className="text-sm text-[#71717A] leading-relaxed mb-5">
            The Children&apos;s Online Privacy Protection Act (COPPA) applies to children under 13
            in the United States. We take the following steps to protect children&apos;s privacy:
          </p>
          <ul className="space-y-3 text-sm text-[#71717A] leading-relaxed mb-5">
            {[
              [
                'Verifiable parental consent required',
                'Before a child under 13 may use the Service, we collect verifiable parental consent via email verification and payment card confirmation (FTC-approved methods).',
              ],
              [
                'Data minimization',
                'We collect only the minimum data necessary to provide the Service. For under-13 accounts, we do not collect location, behavioral advertising data, or unnecessary profile information.',
              ],
              [
                'No behavioral advertising to children',
                'We do not serve targeted advertising to users under 13.',
              ],
              [
                "No AI training on children's data",
                'Prompts and outputs from under-13 accounts are excluded from AI model training.',
              ],
              [
                'Parental rights',
                "Parents may at any time: (a) review the child's data; (b) request correction or deletion; (c) revoke consent and close the account. Contact " +
                  EMAIL +
                  ' to exercise these rights.',
              ],
              [
                'Consent record retention',
                'Parental consent records are retained for 5 years per FTC guidance.',
              ],
              [
                'Third-party disclosure',
                "We do not disclose children's personal information to third parties except as necessary to provide the Service, and only to processors that agree to COPPA-compliant data handling.",
              ],
            ].map(([label, desc]) => (
              <li key={label} className="flex gap-3">
                <span className="mt-1.5 w-1 h-1 rounded-full bg-[#D4AF37]/40 shrink-0" />
                <span>
                  <strong className="text-[#FAFAFA] font-medium">{label}:</strong> {desc}
                </span>
              </li>
            ))}
          </ul>
          <p className="text-sm text-[#71717A] leading-relaxed">
            If you believe we have inadvertently collected personal information from a child under 13
            without consent, contact{' '}
            <a href={`mailto:${EMAIL}`} className="text-[#D4AF37] hover:underline">
              {EMAIL}
            </a>{' '}
            immediately. We will delete the information promptly.
          </p>
        </div>
      </section>

      <Divider />

      {/* ── Section 9 ── */}
      <section id="cookies" className="scroll-mt-24 mt-12">
        <SectionHeading number="9" title="Cookies &amp; Tracking Technologies" />
        <div className="overflow-x-auto rounded-2xl border border-white/[0.07] mb-5">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-white/[0.04] border-b border-white/[0.07]">
                <th className="text-left px-5 py-3 text-[#71717A] font-medium">Cookie Type</th>
                <th className="text-left px-5 py-3 text-[#71717A] font-medium">Purpose</th>
                <th className="text-left px-5 py-3 text-[#71717A] font-medium">Can Opt Out?</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['Strictly necessary', 'Auth sessions, CSRF protection', 'No — required'],
                ['Functional', 'Preferences, language settings', 'Yes'],
                [
                  'Analytics (PostHog)',
                  'Usage stats, feature improvement',
                  'Yes (EU: consent required)',
                ],
                ['Error tracking (Sentry)', 'Crash reports', 'Yes'],
              ].map(([type, purpose, opt], i) => (
                <tr
                  key={type}
                  className={`border-b border-white/[0.04] ${i % 2 === 0 ? '' : 'bg-white/[0.015]'}`}
                >
                  <td className="px-5 py-3 text-[#71717A]">{type}</td>
                  <td className="px-5 py-3 text-[#71717A]">{purpose}</td>
                  <td className="px-5 py-3 text-[#71717A]">{opt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-[#71717A] leading-relaxed">
          EU/UK users are shown a cookie consent banner on first visit. Cookie preferences can be
          managed via the consent banner or by contacting{' '}
          <a href={`mailto:${EMAIL}`} className="text-[#D4AF37] hover:underline">
            {EMAIL}
          </a>
          .
        </p>
      </section>

      <Divider />

      {/* ── Section 10 ── */}
      <section id="contact" className="scroll-mt-24 mt-12">
        <SectionHeading number="10" title="Contact &amp; Data Controller" />
        <p className="text-[#71717A] leading-relaxed mb-5">
          {COMPANY} is the data controller for personal data processed by the Service.
        </p>
        <div className="bg-[#141414] border border-white/[0.07] rounded-2xl p-5 text-sm space-y-2">
          <p className="text-[#71717A]">
            <span className="text-[#FAFAFA] font-medium">Company:</span> {COMPANY}
          </p>
          <p className="text-[#71717A]">
            <span className="text-[#FAFAFA] font-medium">Owner:</span> Dawsen Porter
          </p>
          <p className="text-[#71717A]">
            <span className="text-[#FAFAFA] font-medium">Registered address:</span> [Your Business
            Address] (GDPR Art. 13 — update before launch)
          </p>
          <p className="text-[#71717A]">
            <span className="text-[#FAFAFA] font-medium">Privacy inquiries:</span>{' '}
            <a href={`mailto:${EMAIL}`} className="text-[#D4AF37] hover:underline">
              {EMAIL}
            </a>
          </p>
          <p className="text-[#71717A]">
            <span className="text-[#FAFAFA] font-medium">DPA / GDPR inquiries:</span>{' '}
            <a href={`mailto:${DPA_EMAIL}`} className="text-[#D4AF37] hover:underline">
              {DPA_EMAIL}
            </a>
          </p>
          <p className="text-[#71717A]">
            <span className="text-[#FAFAFA] font-medium">Last updated:</span> {EFFECTIVE_DATE}
          </p>
        </div>
      </section>
    </article>
  )
}

function SectionHeading({ number, title }: { number: string; title: string }) {
  return (
    <h2 className="flex items-baseline gap-3 text-xl font-bold text-[#FAFAFA] mb-5 pb-3 border-b border-white/[0.06]">
      <span className="text-[#D4AF37] font-bold text-base tabular-nums">{number}.</span>
      <span dangerouslySetInnerHTML={{ __html: title }} />
    </h2>
  )
}

function Divider() {
  return <div className="border-t border-white/[0.04] mt-12" />
}
