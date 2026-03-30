import type { Metadata } from 'next'
import { createMetadata } from '@/lib/metadata'

export const metadata: Metadata = createMetadata({
  title: 'Privacy Policy',
  description: 'How ForjeGames collects, uses, and protects your personal data. GDPR, CCPA, and COPPA compliant. Covers data retention, cookies, and your full privacy rights.',
  path: '/privacy',
  noIndex: true,
})

const EFFECTIVE_DATE = 'March 28, 2026'
const COMPANY = 'ForjeGames LLC'
const EMAIL = 'privacy@forjegames.com'
const DPA_EMAIL = 'dpa@forjegames.com'

export default function PrivacyPage() {
  return (
    <article className="prose prose-invert prose-sm max-w-none">
      {/* Header */}
      <div className="mb-10">
        <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-3 py-1 text-xs text-blue-400 font-medium mb-4">
          Privacy Document
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">Privacy Policy</h1>
        <p className="text-gray-300 text-sm">
          Effective: {EFFECTIVE_DATE} &nbsp;·&nbsp; {COMPANY}
        </p>
        <p className="text-gray-300 text-sm mt-2">
          Questions? Contact us at{' '}
          <a href={`mailto:${EMAIL}`} className="text-[#FFB81C] hover:underline">
            {EMAIL}
          </a>
        </p>
      </div>

      <p className="text-gray-300 leading-relaxed">
        {COMPANY} (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) is committed to protecting
        your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your
        information when you use ForjeGames (the &quot;Service&quot;). Please read this policy
        carefully. By using the Service, you agree to the practices described here.
      </p>

      {/* ─── 1. Information We Collect ─── */}
      <section className="mt-10">
        <h2 className="text-xl font-bold text-white border-b border-white/10 pb-2 mb-4">
          1. Information We Collect
        </h2>

        <h3 className="text-base font-semibold text-white mt-4 mb-2">A. Information You Provide</h3>
        <ul className="space-y-1 text-gray-300">
          <li><strong className="text-white">Account data:</strong> email address, username, display name, profile photo</li>
          <li><strong className="text-white">Payment data:</strong> billing address, payment method (processed by Stripe — we never store raw card numbers)</li>
          <li><strong className="text-white">Prompts &amp; inputs:</strong> text, images, and files you submit to the AI generation system</li>
          <li><strong className="text-white">Communications:</strong> support tickets, emails, feedback</li>
          <li><strong className="text-white">Age verification data:</strong> date of birth (for COPPA compliance) and, for users under 13, parent/guardian email and consent records</li>
        </ul>

        <h3 className="text-base font-semibold text-white mt-4 mb-2">B. Information Collected Automatically</h3>
        <ul className="space-y-1 text-gray-300">
          <li><strong className="text-white">Usage data:</strong> pages visited, features used, generation history, token consumption</li>
          <li><strong className="text-white">Device data:</strong> browser type, operating system, screen resolution, IP address</li>
          <li><strong className="text-white">Log data:</strong> server logs, error reports, timestamps</li>
          <li><strong className="text-white">Cookies &amp; tracking:</strong> session cookies (required), analytics cookies (optional, consent-gated in EU)</li>
        </ul>

        <h3 className="text-base font-semibold text-white mt-4 mb-2">C. Information from Third Parties</h3>
        <ul className="space-y-1 text-gray-300">
          <li><strong className="text-white">Clerk (authentication):</strong> OAuth profile data if you sign in with Google or other providers</li>
          <li><strong className="text-white">Stripe:</strong> payment status, subscription state</li>
          <li><strong className="text-white">Roblox:</strong> if you connect your Roblox account, we receive your Roblox username and user ID</li>
        </ul>
      </section>

      {/* ─── 2. How We Use Your Information ─── */}
      <section className="mt-10">
        <h2 className="text-xl font-bold text-white border-b border-white/10 pb-2 mb-4">
          2. How We Use Your Information
        </h2>
        <div className="overflow-x-auto not-prose">
          <table className="w-full text-sm border border-white/10 rounded-lg overflow-hidden">
            <thead>
              <tr className="bg-white/5">
                <th className="text-left px-4 py-3 text-gray-300 font-medium">Purpose</th>
                <th className="text-left px-4 py-3 text-gray-300 font-medium">Legal Basis (GDPR)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
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
              ].map(([purpose, basis]) => (
                <tr key={purpose} className="hover:bg-white/5">
                  <td className="px-4 py-3 text-gray-300">{purpose}</td>
                  <td className="px-4 py-3 text-gray-300">{basis}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ─── 3. Sharing ─── */}
      <section className="mt-10">
        <h2 className="text-xl font-bold text-white border-b border-white/10 pb-2 mb-4">
          3. How We Share Your Information
        </h2>
        <p>We do not sell your personal information. We share data only as follows:</p>
        <ul className="space-y-2 text-gray-300">
          <li>
            <strong className="text-white">Service providers:</strong> Stripe (payments), Clerk
            (auth), Anthropic (AI), Meshy (3D generation), Fal.ai (image generation), Sentry (error
            tracking), PostHog (analytics), Resend (email), Vercel (hosting). These processors
            handle data on our behalf under Data Processing Agreements.
          </li>
          <li>
            <strong className="text-white">Legal requirements:</strong> We may disclose data when
            required by law, subpoena, court order, or to protect our legal rights.
          </li>
          <li>
            <strong className="text-white">Business transfers:</strong> In connection with a merger,
            acquisition, or sale of assets, your data may be transferred. We will notify you before
            your data is transferred and subject to different privacy policies.
          </li>
          <li>
            <strong className="text-white">With your consent:</strong> Any other sharing requires
            your explicit consent.
          </li>
        </ul>
      </section>

      {/* ─── 4. Retention ─── */}
      <section className="mt-10">
        <h2 className="text-xl font-bold text-white border-b border-white/10 pb-2 mb-4">
          4. Data Retention
        </h2>
        <div className="overflow-x-auto not-prose">
          <table className="w-full text-sm border border-white/10 rounded-lg overflow-hidden">
            <thead>
              <tr className="bg-white/5">
                <th className="text-left px-4 py-3 text-gray-300 font-medium">Data Type</th>
                <th className="text-left px-4 py-3 text-gray-300 font-medium">Retention Period</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {[
                ['Account data', 'Until account deletion + 30 days'],
                ['Generation history / prompts', '2 years or until deletion request'],
                ['Payment records', '7 years (tax/legal requirement)'],
                ['COPPA parental consent records', '5 years (FTC requirement)'],
                ['Security/fraud logs', '2 years'],
                ['Analytics data', '13 months (PostHog default)'],
                ['Marketing consent records', 'Until withdrawn + 3 years'],
              ].map(([type, period]) => (
                <tr key={type} className="hover:bg-white/5">
                  <td className="px-4 py-3 text-gray-300">{type}</td>
                  <td className="px-4 py-3 text-gray-300">{period}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ─── 5. Security ─── */}
      <section className="mt-10">
        <h2 className="text-xl font-bold text-white border-b border-white/10 pb-2 mb-4">
          5. Security Measures
        </h2>
        <p>We implement industry-standard safeguards including:</p>
        <ul className="space-y-1 text-gray-300">
          <li>TLS 1.2+ encryption for all data in transit</li>
          <li>AES-256 encryption for sensitive data at rest</li>
          <li>Hashed passwords (we never store plaintext passwords)</li>
          <li>Role-based access controls for internal staff</li>
          <li>Regular security audits and dependency scanning (Sentry)</li>
          <li>Stripe PCI DSS Level 1 compliance for payment data</li>
        </ul>
        <p className="mt-4">
          No system is 100% secure. In the event of a data breach that affects your rights, we will
          notify you within 72 hours as required by GDPR Article 33, and within timeframes required
          by applicable state laws.
        </p>
      </section>

      {/* ─── 6. GDPR ─── */}
      <section id="gdpr" className="mt-10 scroll-mt-24">
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-6 mb-6 not-prose">
          <p className="text-sm font-semibold text-blue-400 uppercase tracking-wider mb-3">
            EU / EEA / UK Residents — GDPR Rights
          </p>
          <p className="text-sm text-gray-300 mb-4">
            If you are in the EU, EEA, or United Kingdom, the General Data Protection Regulation
            (GDPR) or UK GDPR applies. You have the following rights:
          </p>
          <ul className="space-y-2 text-sm text-gray-300">
            <li>
              <strong className="text-white">Right of Access (Art. 15):</strong> Request a copy of
              the personal data we hold about you.
            </li>
            <li>
              <strong className="text-white">Right to Rectification (Art. 16):</strong> Request
              correction of inaccurate or incomplete data.
            </li>
            <li>
              <strong className="text-white">Right to Erasure / &quot;Right to be Forgotten&quot; (Art. 17):</strong>{' '}
              Request deletion of your personal data, subject to legal retention obligations.
            </li>
            <li>
              <strong className="text-white">Right to Restriction (Art. 18):</strong> Request that
              we restrict processing of your data in certain circumstances.
            </li>
            <li>
              <strong className="text-white">Right to Data Portability (Art. 20):</strong> Receive
              your data in a structured, machine-readable format. Data export is coming soon —
              in the meantime, contact us at privacy@forjegames.com to request your data manually.
            </li>
            <li>
              <strong className="text-white">Right to Object (Art. 21):</strong> Object to
              processing based on legitimate interests, including profiling and direct marketing.
            </li>
            <li>
              <strong className="text-white">Right to Withdraw Consent:</strong> Where processing is
              based on consent, you may withdraw at any time without affecting prior processing.
            </li>
            <li>
              <strong className="text-white">Right to Lodge a Complaint:</strong> You may lodge a
              complaint with your local supervisory authority (e.g., ICO in the UK, CNIL in France).
            </li>
          </ul>
          <p className="text-sm text-gray-300 mt-4">
            To exercise any right, contact us at{' '}
            <a href={`mailto:${DPA_EMAIL}`} className="text-[#FFB81C] hover:underline">
              {DPA_EMAIL}
            </a>
            . We will respond within 30 days. Identity verification may be required.
          </p>
          <p className="text-sm text-gray-300 mt-2">
            <strong className="text-white">International transfers:</strong> We transfer data from
            the EU/UK to the US. We rely on the EU-US Data Privacy Framework and Standard
            Contractual Clauses (SCCs) as our legal transfer mechanism.
          </p>
          <p className="text-sm text-gray-300 mt-2">
            <strong className="text-white">Data Protection Agreement:</strong> Enterprise and B2B
            customers may request a Data Processing Agreement (DPA) at{' '}
            <a href={`mailto:${DPA_EMAIL}`} className="text-[#FFB81C] hover:underline">
              {DPA_EMAIL}
            </a>
            .
          </p>
        </div>
      </section>

      {/* ─── 7. CCPA ─── */}
      <section id="ccpa" className="mt-10 scroll-mt-24">
        <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-6 mb-6 not-prose">
          <p className="text-sm font-semibold text-purple-400 uppercase tracking-wider mb-3">
            California Residents — CCPA / CPRA Rights
          </p>
          <p className="text-sm text-gray-300 mb-4">
            The California Consumer Privacy Act (CCPA) as amended by the California Privacy Rights
            Act (CPRA) grants California residents the following rights:
          </p>
          <ul className="space-y-2 text-sm text-gray-300">
            <li>
              <strong className="text-white">Right to Know:</strong> Request disclosure of the
              categories and specific pieces of personal information we have collected, used,
              disclosed, and sold in the past 12 months.
            </li>
            <li>
              <strong className="text-white">Right to Delete:</strong> Request deletion of personal
              information we have collected, subject to certain exceptions.
            </li>
            <li>
              <strong className="text-white">Right to Correct:</strong> Request correction of
              inaccurate personal information.
            </li>
            <li>
              <strong className="text-white">Right to Opt-Out of Sale/Sharing:</strong> We do not
              sell personal information. We do not share personal information for cross-context
              behavioral advertising without consent. Contact privacy@forjegames.com to update your cookie preferences.
            </li>
            <li>
              <strong className="text-white">Right to Limit Sensitive PI Use:</strong> Limit our use
              and disclosure of sensitive personal information to permitted purposes.
            </li>
            <li>
              <strong className="text-white">Right to Non-Discrimination:</strong> We will not
              discriminate against you for exercising CCPA rights.
            </li>
          </ul>
          <p className="text-sm text-gray-300 mt-4">
            To submit a CCPA request, contact us at{' '}
            <a href={`mailto:${EMAIL}`} className="text-[#FFB81C] hover:underline">
              {EMAIL}
            </a>{' '}
            with subject &quot;CCPA Request.&quot; We will respond within 45 days (extendable by
            45 days with notice). An authorized agent may submit on your behalf with written
            permission.
          </p>
          <p className="text-sm text-gray-300 mt-2">
            <strong className="text-white">Do Not Sell or Share My Personal Information:</strong>{' '}
            We do not sell personal information. Contact us at {EMAIL} to opt out of any sharing.
          </p>
        </div>
      </section>

      {/* ─── 8. COPPA ─── */}
      <section id="coppa" className="mt-10 scroll-mt-24">
        <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-6 mb-6 not-prose">
          <p className="text-sm font-semibold text-green-400 uppercase tracking-wider mb-3">
            Children Under 13 — COPPA Compliance
          </p>
          <p className="text-sm text-gray-300 mb-3">
            The Children&apos;s Online Privacy Protection Act (COPPA) applies to children under 13
            in the United States. We take the following steps to protect children&apos;s privacy:
          </p>
          <ul className="space-y-2 text-sm text-gray-300">
            <li>
              <strong className="text-white">Verifiable parental consent required:</strong> Before
              a child under 13 may use the Service, we collect verifiable parental consent via email
              verification and payment card confirmation (FTC-approved methods).
            </li>
            <li>
              <strong className="text-white">Data minimization:</strong> We collect only the minimum
              data necessary to provide the Service. For under-13 accounts, we do not collect
              location, behavioral advertising data, or unnecessary profile information.
            </li>
            <li>
              <strong className="text-white">No behavioral advertising to children:</strong> We do
              not serve targeted advertising to users under 13.
            </li>
            <li>
              <strong className="text-white">No AI training on children&apos;s data:</strong> Prompts
              and outputs from under-13 accounts are excluded from AI model training.
            </li>
            <li>
              <strong className="text-white">Parental rights:</strong> Parents may at any time: (a)
              review the child&apos;s data; (b) request correction or deletion; (c) revoke consent
              and close the account. Contact {EMAIL} to exercise these rights.
            </li>
            <li>
              <strong className="text-white">Consent record retention:</strong> Parental consent
              records are retained for 5 years per FTC guidance.
            </li>
            <li>
              <strong className="text-white">Third-party disclosure:</strong> We do not disclose
              children&apos;s personal information to third parties except as necessary to provide the
              Service, and only to processors that agree to COPPA-compliant data handling.
            </li>
          </ul>
          <p className="text-sm text-gray-300 mt-4">
            If you believe we have inadvertently collected personal information from a child under
            13 without consent, contact {EMAIL} immediately. We will delete the information promptly.
          </p>
        </div>
      </section>

      {/* ─── 9. Cookies ─── */}
      <section className="mt-10">
        <h2 className="text-xl font-bold text-white border-b border-white/10 pb-2 mb-4">
          9. Cookies &amp; Tracking Technologies
        </h2>
        <div className="overflow-x-auto not-prose">
          <table className="w-full text-sm border border-white/10 rounded-lg overflow-hidden">
            <thead>
              <tr className="bg-white/5">
                <th className="text-left px-4 py-3 text-gray-300 font-medium">Cookie Type</th>
                <th className="text-left px-4 py-3 text-gray-300 font-medium">Purpose</th>
                <th className="text-left px-4 py-3 text-gray-300 font-medium">Can Opt Out?</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {[
                ['Strictly necessary', 'Auth sessions, CSRF protection', 'No — required'],
                ['Functional', 'Preferences, language settings', 'Yes'],
                ['Analytics (PostHog)', 'Usage stats, feature improvement', 'Yes (EU: consent required)'],
                ['Error tracking (Sentry)', 'Crash reports', 'Yes'],
              ].map(([type, purpose, opt]) => (
                <tr key={type} className="hover:bg-white/5">
                  <td className="px-4 py-3 text-gray-300">{type}</td>
                  <td className="px-4 py-3 text-gray-300">{purpose}</td>
                  <td className="px-4 py-3 text-gray-300">{opt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4">
          EU/UK users are shown a cookie consent banner on first visit. Cookie preferences can be
          managed via the consent banner shown on your first visit, or by contacting{' '}
          <a href="mailto:privacy@forjegames.com" className="text-[#FFB81C] hover:underline">
            privacy@forjegames.com
          </a>.
        </p>
      </section>

      {/* ─── 10. Contact ─── */}
      <section className="mt-10">
        <h2 className="text-xl font-bold text-white border-b border-white/10 pb-2 mb-4">
          10. Contact &amp; Data Controller
        </h2>
        <p>
          {COMPANY} is the data controller for personal data processed by the Service.
        </p>
        <div className="bg-white/5 border border-white/10 rounded-lg p-4 mt-4 not-prose text-sm text-gray-300 space-y-1">
          <p><strong className="text-white">Company:</strong> {COMPANY}</p>
          <p><strong className="text-white">Owner:</strong> Dawsen Porter</p>
          <p><strong className="text-white">Registered address:</strong> [Your Business Address] (GDPR Art. 13 — update before launch)</p>
          <p><strong className="text-white">Privacy inquiries:</strong>{' '}
            <a href={`mailto:${EMAIL}`} className="text-[#FFB81C] hover:underline">{EMAIL}</a>
          </p>
          <p><strong className="text-white">DPA / GDPR inquiries:</strong>{' '}
            <a href={`mailto:${DPA_EMAIL}`} className="text-[#FFB81C] hover:underline">{DPA_EMAIL}</a>
          </p>
          <p><strong className="text-white">Last updated:</strong> {EFFECTIVE_DATE}</p>
        </div>
      </section>
    </article>
  )
}
