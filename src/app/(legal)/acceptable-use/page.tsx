import type { Metadata } from 'next'
import Link from 'next/link'
import { createMetadata } from '@/lib/metadata'

export const metadata: Metadata = createMetadata({
  title: 'Acceptable Use Policy',
  description:
    'ForjeGames Acceptable Use Policy. Rules for safe and legal use of the platform, covering prohibited content, AI generation rules, and enforcement procedures.',
  path: '/acceptable-use',
  noIndex: true,
})

const EFFECTIVE_DATE = 'March 28, 2026'
const COMPANY = 'ForjeGames LLC'
const EMAIL = 'abuse@forjegames.com'

const sections = [
  { id: 'prohibited-content', title: '1. Prohibited Content' },
  { id: 'prohibited-technical', title: '2. Prohibited Technical Activities' },
  { id: 'ai-rules', title: '3. AI Generation Rules' },
  { id: 'roblox', title: '4. Roblox Platform Compliance' },
  { id: 'reporting', title: '5. Reporting Violations' },
  { id: 'export', title: '6. Export Controls & Sanctions' },
  { id: 'enforcement', title: '7. Enforcement' },
]

export default function AcceptableUsePage() {
  return (
    <article className="max-w-3xl">
      {/* ── Header ── */}
      <div className="mb-12">
        <div className="inline-flex items-center gap-2 bg-[#FFB81C]/10 border border-[#FFB81C]/20 rounded-full px-3 py-1 text-xs text-[#FFB81C] font-medium mb-5">
          Usage Policy
        </div>
        <h1 className="text-3xl font-bold text-[#FAFAFA] mb-3">Acceptable Use Policy</h1>
        <p className="text-[#71717A] text-sm">
          Effective: <span className="text-[#FAFAFA]">{EFFECTIVE_DATE}</span>
          &nbsp;&middot;&nbsp;{COMPANY}
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
                className="text-sm text-[#71717A] hover:text-[#FFB81C] transition-colors block py-1"
              >
                {s.title}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <p className="text-[#71717A] leading-relaxed mb-4">
        This Acceptable Use Policy (&quot;AUP&quot;) governs your use of the ForjeGames platform and
        all services operated by {COMPANY}. By using ForjeGames, you agree to comply with this AUP.
        Violations may result in account suspension or termination, removal of content, and reporting
        to appropriate authorities.
      </p>
      <p className="text-[#71717A] leading-relaxed mb-10">
        This AUP supplements our{' '}
        <Link href="/terms" className="text-[#FFB81C] hover:underline">
          Terms of Service
        </Link>
        . In case of conflict, the Terms of Service prevail.
      </p>

      {/* ── Section 1 ── */}
      <section id="prohibited-content" className="scroll-mt-24 mt-12">
        <SectionHeading number="1" title="Prohibited Content" />
        <p className="text-[#71717A] leading-relaxed mb-6">
          You may not use ForjeGames to generate, store, upload, share, or distribute content that:
        </p>

        <SubHeading label="A. Is Illegal" />
        <ul className="space-y-2 text-[#71717A] leading-relaxed mb-7">
          {[
            'Violates any federal, state, or local law or regulation',
            'Facilitates illegal activity including fraud, theft, or unauthorized access to systems',
            'Violates export control laws or sanctions programs (see Section 6)',
            'Constitutes or facilitates human trafficking, exploitation, or slavery',
          ].map((item) => (
            <li key={item} className="flex gap-3">
              <span className="mt-1.5 w-1 h-1 rounded-full bg-[#FFB81C]/40 shrink-0" />
              {item}
            </li>
          ))}
        </ul>

        <SubHeading label="B. Harms Children" />
        <ul className="space-y-2 text-[#71717A] leading-relaxed mb-7">
          {[
            'Contains child sexual abuse material (CSAM) — zero tolerance, immediately reported to NCMEC and law enforcement',
            'Targets, solicits, grooms, or exploits minors',
            'Circumvents our COPPA age verification or parental consent systems',
          ].map((item) => (
            <li key={item} className="flex gap-3">
              <span className="mt-1.5 w-1 h-1 rounded-full bg-[#FFB81C]/40 shrink-0" />
              {item}
            </li>
          ))}
        </ul>

        <SubHeading label="C. Violates Privacy or Intellectual Property" />
        <ul className="space-y-2 text-[#71717A] leading-relaxed mb-7">
          {[
            'Infringes any copyright, trademark, patent, trade secret, or other IP rights',
            'Contains another person\'s personal information without consent ("doxxing")',
            "Violates any person's right to privacy",
            'Publishes unauthorized recordings or images of private individuals',
          ].map((item) => (
            <li key={item} className="flex gap-3">
              <span className="mt-1.5 w-1 h-1 rounded-full bg-[#FFB81C]/40 shrink-0" />
              {item}
            </li>
          ))}
        </ul>

        <SubHeading label="D. Is Harmful, Hateful, or Deceptive" />
        <ul className="space-y-2 text-[#71717A] leading-relaxed">
          {[
            'Is defamatory, libelous, or makes false statements of fact about real people',
            'Constitutes hate speech targeting protected characteristics (race, ethnicity, religion, gender, sexual orientation, disability, etc.)',
            'Glorifies or promotes violence, terrorism, or self-harm',
            'Is sexually explicit, obscene, or pornographic',
            'Constitutes harassment, bullying, or threatening behavior toward any person',
            'Creates deepfakes or synthetic media designed to deceive or harm',
            'Spreads disinformation, misinformation, or coordinated inauthentic behavior',
          ].map((item) => (
            <li key={item} className="flex gap-3">
              <span className="mt-1.5 w-1 h-1 rounded-full bg-[#FFB81C]/40 shrink-0" />
              {item}
            </li>
          ))}
        </ul>
      </section>

      <Divider />

      {/* ── Section 2 ── */}
      <section id="prohibited-technical" className="scroll-mt-24 mt-12">
        <SectionHeading number="2" title="Prohibited Technical Activities" />
        <p className="text-[#71717A] leading-relaxed mb-5">
          You may not use ForjeGames to:
        </p>
        <ul className="space-y-2 text-[#71717A] leading-relaxed">
          {[
            'Attempt unauthorized access to any account, system, or network',
            'Conduct penetration testing, vulnerability scanning, or security research on our systems without written authorization',
            'Introduce or distribute viruses, ransomware, malware, spyware, or any malicious code',
            'Launch denial-of-service (DoS/DDoS) attacks against any target',
            'Scrape, crawl, or harvest data from the Service via bots, spiders, or automated tools without our written permission',
            'Reverse engineer, decompile, or disassemble the Service or any component thereof',
            'Circumvent any rate limits, authentication, or access controls',
            'Use the Service to generate spam at scale or conduct phishing campaigns',
            'Mine cryptocurrency or conduct other resource-intensive computations not intended by the Service',
            'Resell or white-label the Service without an explicit written agreement',
          ].map((item) => (
            <li key={item} className="flex gap-3">
              <span className="mt-1.5 w-1 h-1 rounded-full bg-[#FFB81C]/40 shrink-0" />
              {item}
            </li>
          ))}
        </ul>
      </section>

      <Divider />

      {/* ── Section 3 ── */}
      <section id="ai-rules" className="scroll-mt-24 mt-12">
        <SectionHeading number="3" title="AI Generation Rules" />
        <p className="text-[#71717A] leading-relaxed mb-5">
          When using AI generation features, you additionally may not:
        </p>
        <ul className="space-y-2 text-[#71717A] leading-relaxed">
          {[
            'Attempt to jailbreak, prompt-inject, or otherwise manipulate AI models to produce prohibited content',
            'Generate synthetic identities for fraudulent purposes',
            'Create AI-generated academic work submitted as your own without disclosure (academic dishonesty)',
            'Generate content designed to impersonate real people in misleading ways',
            'Use AI outputs to build competing AI services that replicate ForjeGames functionality',
            "Generate content that violates Roblox Corporation's Community Standards — including weapons of mass destruction content, extremist content, or graphic violence",
          ].map((item) => (
            <li key={item} className="flex gap-3">
              <span className="mt-1.5 w-1 h-1 rounded-full bg-[#FFB81C]/40 shrink-0" />
              {item}
            </li>
          ))}
        </ul>
      </section>

      <Divider />

      {/* ── Section 4 ── */}
      <section id="roblox" className="scroll-mt-24 mt-12">
        <SectionHeading number="4" title="Roblox Platform Compliance" />
        <p className="text-[#71717A] leading-relaxed">
          Content generated via ForjeGames intended for upload to Roblox must comply with Roblox
          Corporation&apos;s{' '}
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
          . ForjeGames is an independent tool — we are not responsible for content rejected by
          Roblox&apos;s moderation systems or violations of Roblox&apos;s policies.
        </p>
      </section>

      <Divider />

      {/* ── Section 5 ── */}
      <section id="reporting" className="scroll-mt-24 mt-12">
        <SectionHeading number="5" title="Reporting Violations" />
        <p className="text-[#71717A] leading-relaxed mb-5">
          Report AUP violations to{' '}
          <a href={`mailto:${EMAIL}`} className="text-[#FFB81C] hover:underline">
            {EMAIL}
          </a>
          . Include:
        </p>
        <ul className="space-y-2 text-[#71717A] leading-relaxed mb-5">
          {[
            'The specific URL or identifier of the violating content',
            'A description of the violation',
            'Any supporting evidence',
          ].map((item) => (
            <li key={item} className="flex gap-3">
              <span className="mt-1.5 w-1 h-1 rounded-full bg-[#FFB81C]/40 shrink-0" />
              {item}
            </li>
          ))}
        </ul>
        <p className="text-[#71717A] leading-relaxed mb-4">
          We investigate all reports and aim to respond within 48 hours. We do not tolerate
          retaliation against good-faith reporters.
        </p>
        <div className="bg-[#141414] border border-white/[0.07] rounded-2xl p-5">
          <p className="text-sm font-semibold text-[#FAFAFA] mb-2">CSAM Reporting</p>
          <p className="text-sm text-[#71717A] leading-relaxed">
            Any suspected child sexual exploitation material is immediately reported to the National
            Center for Missing and Exploited Children (NCMEC) CyberTipline and relevant law
            enforcement.
          </p>
        </div>
      </section>

      <Divider />

      {/* ── Section 6 ── */}
      <section id="export" className="scroll-mt-24 mt-12">
        <SectionHeading number="6" title="Export Controls &amp; Sanctions" />
        <p className="text-[#71717A] leading-relaxed mb-5">
          The Service may not be used by persons or entities in embargoed countries or territories,
          or listed on U.S. government sanctions lists (OFAC SDN List, BIS Entity List, etc.). Access
          from the following jurisdictions is blocked:
        </p>
        <ul className="space-y-2 text-[#71717A] leading-relaxed mb-5">
          {[
            'North Korea (DPRK)',
            'Iran',
            'Syria',
            'Cuba',
            'Crimea (Ukraine/Russia disputed region)',
            'Russia (sanctioned entities and individuals)',
            'Any other jurisdiction subject to comprehensive U.S. sanctions',
          ].map((item) => (
            <li key={item} className="flex gap-3">
              <span className="mt-1.5 w-1 h-1 rounded-full bg-[#FFB81C]/40 shrink-0" />
              {item}
            </li>
          ))}
        </ul>
        <p className="text-[#71717A] leading-relaxed">
          Attempting to circumvent geo-blocks via VPNs or proxies to evade sanctions is a violation
          of U.S. law and these Terms.
        </p>
      </section>

      <Divider />

      {/* ── Section 7 ── */}
      <section id="enforcement" className="scroll-mt-24 mt-12">
        <SectionHeading number="7" title="Enforcement" />
        <p className="text-[#71717A] leading-relaxed mb-5">
          {COMPANY} reserves the right to investigate and take action against AUP violations at our
          sole discretion, including:
        </p>
        <ul className="space-y-2 text-[#71717A] leading-relaxed mb-5">
          {[
            'Removing or disabling violating content',
            'Issuing warnings',
            'Suspending or permanently terminating accounts',
            'Reporting violations to law enforcement or regulatory authorities',
            'Pursuing civil remedies',
          ].map((item) => (
            <li key={item} className="flex gap-3">
              <span className="mt-1.5 w-1 h-1 rounded-full bg-[#FFB81C]/40 shrink-0" />
              {item}
            </li>
          ))}
        </ul>
        <p className="text-[#71717A] leading-relaxed">
          We are not obligated to monitor all content but reserve the right to do so. Enforcement
          decisions are final unless successfully appealed through our dispute resolution process.
        </p>
      </section>

      {/* ── Footer ── */}
      <div className="mt-14 pt-8 border-t border-white/[0.06]">
        <div className="bg-[#141414] border border-white/[0.07] rounded-2xl p-5 text-sm space-y-1">
          <p className="text-[#71717A]">
            <span className="text-[#FAFAFA] font-medium">Report abuse:</span>{' '}
            <a href={`mailto:${EMAIL}`} className="text-[#FFB81C] hover:underline">
              {EMAIL}
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

function SectionHeading({ number, title }: { number: string; title: string }) {
  return (
    <h2 className="flex items-baseline gap-3 text-xl font-bold text-[#FAFAFA] mb-5 pb-3 border-b border-white/[0.06]">
      <span className="text-[#FFB81C] font-bold text-base tabular-nums">{number}.</span>
      <span dangerouslySetInnerHTML={{ __html: title }} />
    </h2>
  )
}

function SubHeading({ label }: { label: string }) {
  return (
    <h3 className="text-sm font-semibold text-[#FAFAFA] uppercase tracking-wider mb-3 mt-6">
      {label}
    </h3>
  )
}

function Divider() {
  return <div className="border-t border-white/[0.04] mt-12" />
}
