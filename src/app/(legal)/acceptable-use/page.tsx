import type { Metadata } from 'next'
import Link from 'next/link'
import { createMetadata } from '@/lib/metadata'

export const metadata: Metadata = createMetadata({
  title: 'Acceptable Use Policy',
  description: 'RobloxForge Acceptable Use Policy. Rules for safe and legal use of the platform.',
  path: '/acceptable-use',
  noIndex: true,
})

const EFFECTIVE_DATE = 'March 28, 2026'
const COMPANY = 'RobloxForge LLC'
const EMAIL = 'abuse@robloxforge.gg'

export default function AcceptableUsePage() {
  return (
    <article className="prose prose-invert prose-sm max-w-none">
      {/* Header */}
      <div className="mb-10">
        <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 rounded-full px-3 py-1 text-xs text-orange-400 font-medium mb-4">
          Usage Policy
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">Acceptable Use Policy</h1>
        <p className="text-gray-400 text-sm">
          Effective: {EFFECTIVE_DATE} &nbsp;·&nbsp; {COMPANY}
        </p>
      </div>

      <p className="text-gray-300 leading-relaxed">
        This Acceptable Use Policy (&quot;AUP&quot;) governs your use of the RobloxForge platform and
        all services operated by {COMPANY}. By using RobloxForge, you agree to comply with this AUP.
        Violations may result in account suspension or termination, removal of content, and reporting
        to appropriate authorities.
      </p>
      <p className="text-gray-300">
        This AUP supplements our{' '}
        <Link href="/terms" className="text-[#FFB81C] hover:underline">
          Terms of Service
        </Link>
        . In case of conflict, the Terms of Service prevail.
      </p>

      {/* ─── Prohibited Content ─── */}
      <section className="mt-10">
        <h2 className="text-xl font-bold text-white border-b border-white/10 pb-2 mb-4">
          1. Prohibited Content
        </h2>
        <p>You may not use RobloxForge to generate, store, upload, share, or distribute content that:</p>

        <h3 className="text-base font-semibold text-white mt-5 mb-3">A. Is Illegal</h3>
        <ul className="space-y-1 text-gray-300">
          <li>Violates any federal, state, or local law or regulation</li>
          <li>Facilitates illegal activity including fraud, theft, or unauthorized access to systems</li>
          <li>Violates export control laws or sanctions programs (see Section 6)</li>
          <li>Constitutes or facilitates human trafficking, exploitation, or slavery</li>
        </ul>

        <h3 className="text-base font-semibold text-white mt-5 mb-3">B. Harms Children</h3>
        <ul className="space-y-1 text-gray-300">
          <li>Contains child sexual abuse material (CSAM) — zero tolerance, immediately reported to NCMEC and law enforcement</li>
          <li>Targets, solicits, grooms, or exploits minors</li>
          <li>Circumvents our COPPA age verification or parental consent systems</li>
        </ul>

        <h3 className="text-base font-semibold text-white mt-5 mb-3">C. Violates Privacy or Intellectual Property</h3>
        <ul className="space-y-1 text-gray-300">
          <li>Infringes any copyright, trademark, patent, trade secret, or other IP rights</li>
          <li>Contains another person&apos;s personal information without consent (&quot;doxxing&quot;)</li>
          <li>Violates any person&apos;s right to privacy</li>
          <li>Publishes unauthorized recordings or images of private individuals</li>
        </ul>

        <h3 className="text-base font-semibold text-white mt-5 mb-3">D. Is Harmful, Hateful, or Deceptive</h3>
        <ul className="space-y-1 text-gray-300">
          <li>Is defamatory, libelous, or makes false statements of fact about real people</li>
          <li>Constitutes hate speech targeting protected characteristics (race, ethnicity, religion, gender, sexual orientation, disability, etc.)</li>
          <li>Glorifies or promotes violence, terrorism, or self-harm</li>
          <li>Is sexually explicit, obscene, or pornographic</li>
          <li>Constitutes harassment, bullying, or threatening behavior toward any person</li>
          <li>Creates deepfakes or synthetic media designed to deceive or harm</li>
          <li>Spreads disinformation, misinformation, or coordinated inauthentic behavior</li>
        </ul>
      </section>

      {/* ─── Prohibited Activities ─── */}
      <section className="mt-10">
        <h2 className="text-xl font-bold text-white border-b border-white/10 pb-2 mb-4">
          2. Prohibited Technical Activities
        </h2>
        <p>You may not use RobloxForge to:</p>
        <ul className="space-y-1 text-gray-300 mt-3">
          <li>Attempt unauthorized access to any account, system, or network</li>
          <li>Conduct penetration testing, vulnerability scanning, or security research on our systems without written authorization</li>
          <li>Introduce or distribute viruses, ransomware, malware, spyware, or any malicious code</li>
          <li>Launch denial-of-service (DoS/DDoS) attacks against any target</li>
          <li>Scrape, crawl, or harvest data from the Service via bots, spiders, or automated tools without our written permission</li>
          <li>Reverse engineer, decompile, or disassemble the Service or any component thereof</li>
          <li>Circumvent any rate limits, authentication, or access controls</li>
          <li>Use the Service to generate spam at scale or conduct phishing campaigns</li>
          <li>Mine cryptocurrency or conduct other resource-intensive computations not intended by the Service</li>
          <li>Resell or white-label the Service without an explicit written agreement</li>
        </ul>
      </section>

      {/* ─── AI-Specific ─── */}
      <section className="mt-10">
        <h2 className="text-xl font-bold text-white border-b border-white/10 pb-2 mb-4">
          3. AI Generation Rules
        </h2>
        <p>When using AI generation features, you additionally may not:</p>
        <ul className="space-y-1 text-gray-300 mt-3">
          <li>Attempt to jailbreak, prompt-inject, or otherwise manipulate AI models to produce prohibited content</li>
          <li>Generate synthetic identities for fraudulent purposes</li>
          <li>Create AI-generated academic work submitted as your own without disclosure (academic dishonesty)</li>
          <li>Generate content designed to impersonate real people in misleading ways</li>
          <li>Use AI outputs to build competing AI services that replicate RobloxForge functionality</li>
          <li>Generate content that violates Roblox Corporation&apos;s Community Standards — including weapons of mass destruction content, extremist content, or graphic violence</li>
        </ul>
      </section>

      {/* ─── Roblox Platform ─── */}
      <section className="mt-10">
        <h2 className="text-xl font-bold text-white border-b border-white/10 pb-2 mb-4">
          4. Roblox Platform Compliance
        </h2>
        <p>
          Content generated via RobloxForge intended for upload to Roblox must comply with
          Roblox Corporation&apos;s{' '}
          <a
            href="https://en.help.roblox.com/hc/en-us/articles/203313410"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#FFB81C] hover:underline"
          >
            Community Standards
          </a>{' '}
          and{' '}
          <a
            href="https://en.help.roblox.com/hc/en-us/articles/115004647846"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#FFB81C] hover:underline"
          >
            Terms of Use
          </a>
          . RobloxForge is an independent tool — we are not responsible for content rejected by
          Roblox&apos;s moderation systems or violations of Roblox&apos;s policies.
        </p>
      </section>

      {/* ─── Reporting ─── */}
      <section className="mt-10">
        <h2 className="text-xl font-bold text-white border-b border-white/10 pb-2 mb-4">
          5. Reporting Violations
        </h2>
        <p>
          Report AUP violations to{' '}
          <a href={`mailto:${EMAIL}`} className="text-[#FFB81C] hover:underline">
            {EMAIL}
          </a>
          . Include:
        </p>
        <ul className="space-y-1 text-gray-300 mt-3">
          <li>The specific URL or identifier of the violating content</li>
          <li>A description of the violation</li>
          <li>Any supporting evidence</li>
        </ul>
        <p className="mt-4">
          We investigate all reports and aim to respond within 48 hours. We do not tolerate
          retaliation against good-faith reporters.
        </p>
        <p>
          <strong className="text-white">CSAM reporting:</strong> Any suspected child sexual
          exploitation material is immediately reported to the National Center for Missing and
          Exploited Children (NCMEC) CyberTipline and relevant law enforcement.
        </p>
      </section>

      {/* ─── Export Control ─── */}
      <section className="mt-10">
        <h2 className="text-xl font-bold text-white border-b border-white/10 pb-2 mb-4">
          6. Export Controls &amp; Sanctions
        </h2>
        <p>
          The Service may not be used by persons or entities in embargoed countries or territories,
          or listed on U.S. government sanctions lists (OFAC SDN List, BIS Entity List, etc.).
          Access from the following jurisdictions is blocked:
        </p>
        <ul className="space-y-1 text-gray-300 mt-3">
          <li>North Korea (DPRK)</li>
          <li>Iran</li>
          <li>Syria</li>
          <li>Cuba</li>
          <li>Crimea (Ukraine/Russia disputed region)</li>
          <li>Russia (sanctioned entities and individuals)</li>
          <li>Any other jurisdiction subject to comprehensive U.S. sanctions</li>
        </ul>
        <p className="mt-4">
          Attempting to circumvent geo-blocks via VPNs or proxies to evade sanctions is a violation
          of U.S. law and these Terms.
        </p>
      </section>

      {/* ─── Enforcement ─── */}
      <section className="mt-10">
        <h2 className="text-xl font-bold text-white border-b border-white/10 pb-2 mb-4">
          7. Enforcement
        </h2>
        <p>
          {COMPANY} reserves the right to investigate and take action against AUP violations at our
          sole discretion, including:
        </p>
        <ul className="space-y-1 text-gray-300 mt-3">
          <li>Removing or disabling violating content</li>
          <li>Issuing warnings</li>
          <li>Suspending or permanently terminating accounts</li>
          <li>Reporting violations to law enforcement or regulatory authorities</li>
          <li>Pursuing civil remedies</li>
        </ul>
        <p className="mt-4">
          We are not obligated to monitor all content but reserve the right to do so. Enforcement
          decisions are final unless successfully appealed through our dispute resolution process.
        </p>
      </section>

      <div className="mt-10 pt-6 border-t border-white/10">
        <p className="text-sm text-gray-500">
          <strong className="text-gray-400">Report abuse:</strong>{' '}
          <a href={`mailto:${EMAIL}`} className="text-[#FFB81C] hover:underline">{EMAIL}</a>
          &nbsp;·&nbsp;
          <strong className="text-gray-400">Last updated:</strong> {EFFECTIVE_DATE}
        </p>
      </div>
    </article>
  )
}
