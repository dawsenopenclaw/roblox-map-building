import type { Metadata } from 'next'
import Link from 'next/link'
import { createMetadata } from '@/lib/metadata'

export const metadata: Metadata = createMetadata({
  title: 'Terms of Service',
  description:
    'ForjeGames Terms of Service. Read the full terms and conditions governing your use of the platform, including subscription, AI content, and marketplace rules.',
  path: '/terms',
  noIndex: true,
})

const EFFECTIVE_DATE = 'March 28, 2026'
const COMPANY = 'ForjeGames LLC'
const OWNER = 'Dawsen Porter'
const EMAIL = 'legal@forjegames.com'
const ADDRESS = 'ForjeGames LLC, United States'

const sections = [
  { id: 'acceptance', title: '1. Acceptance & Age Requirements' },
  { id: 'account', title: '2. Account Security' },
  { id: 'service', title: '3. Service Description' },
  { id: 'tokens', title: '4. Token & Credit System' },
  { id: 'subscriptions', title: '5. Subscription Terms' },
  { id: 'ai-content', title: '6. AI-Generated Content Ownership' },
  { id: 'marketplace', title: '7. Marketplace Terms' },
  { id: 'plugins', title: '8. Plugin Developer Terms' },
  { id: 'aup', title: '9. Acceptable Use Policy' },
  { id: 'ip-dmca', title: '10. Intellectual Property & DMCA' },
  { id: 'privacy', title: '11. Privacy & Data' },
  { id: 'charity', title: '12. Charity Donation Disclosure' },
  { id: 'disclaimers', title: '13. Disclaimers & Limitation of Liability' },
  { id: 'indemnification', title: '14. Indemnification' },
  { id: 'disputes', title: '15. Dispute Resolution & Arbitration' },
  { id: 'termination', title: '16. Termination' },
  { id: 'modifications', title: '17. Modification of Terms' },
  { id: 'governing-law', title: '18. Governing Law' },
]

export default function TermsPage() {
  return (
    <article className="max-w-3xl">
      {/* ── Header ── */}
      <div className="mb-12">
        <div className="inline-flex items-center gap-2 bg-[#FFB81C]/10 border border-[#FFB81C]/20 rounded-full px-3 py-1 text-xs text-[#FFB81C] font-medium mb-5">
          Legal Document
        </div>
        <h1 className="text-3xl font-bold text-[#FAFAFA] mb-3">Terms of Service</h1>
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

      <p className="text-[#71717A] leading-relaxed mb-10">
        Please read these Terms of Service (&quot;Terms&quot;) carefully before using ForjeGames
        (the &quot;Service&quot;), operated by {COMPANY} (&quot;we,&quot; &quot;us,&quot; or
        &quot;our&quot;). By accessing or using the Service you agree to be bound by these Terms. If
        you do not agree, do not use the Service.
      </p>

      {/* ── Section 1 ── */}
      <section id="acceptance" className="scroll-mt-24 mt-12">
        <SectionHeading number="1" title="Acceptance &amp; Age Requirements" />
        <p className="text-[#71717A] leading-relaxed mb-4">
          By creating an account or using the Service you represent that (a) you have read and agree
          to these Terms; (b) you are at least 13 years old; and (c) if you are between 13 and 17
          years old, you have obtained verifiable parental or guardian consent as required under the
          Children&apos;s Online Privacy Protection Act (&quot;COPPA&quot;).
        </p>
        <p className="text-[#71717A] leading-relaxed mb-4">
          <strong className="text-[#FAFAFA] font-semibold">Users under 13.</strong> We do not
          knowingly collect personal information from children under 13 without verified parental
          consent. If you are under 13, a parent or legal guardian must complete our COPPA parental
          consent flow before you may access the Service. Parents may review, update, or delete their
          child&apos;s data at any time by contacting {EMAIL}.
        </p>
        <p className="text-[#71717A] leading-relaxed mb-4">
          <strong className="text-[#FAFAFA] font-semibold">Users 13&ndash;17 (minors).</strong> If
          you are between 13 and 17, your parent or legal guardian must review and accept these Terms
          on your behalf. By allowing you to use the Service, your parent or guardian agrees to these
          Terms and accepts responsibility for your use of the Service.
        </p>
        <p className="text-[#71717A] leading-relaxed">
          <strong className="text-[#FAFAFA] font-semibold">Users 18+.</strong> You represent you
          are an adult under the laws of your jurisdiction and may enter into a binding contract.
        </p>
      </section>

      <Divider />

      {/* ── Section 2 ── */}
      <section id="account" className="scroll-mt-24 mt-12">
        <SectionHeading number="2" title="Account Security" />
        <p className="text-[#71717A] leading-relaxed mb-4">
          You are responsible for maintaining the confidentiality of your account credentials. You
          agree to: (a) use a strong, unique password; (b) notify us immediately at {EMAIL} of any
          unauthorized use of your account; and (c) ensure that you log out at the end of each
          session on shared devices.
        </p>
        <p className="text-[#71717A] leading-relaxed mb-4">
          We will not be liable for any loss or damage arising from your failure to safeguard your
          credentials. You are fully responsible for all activity that occurs under your account.
        </p>
        <p className="text-[#71717A] leading-relaxed">
          We reserve the right to suspend or terminate accounts that show signs of unauthorized
          access, abuse, or violation of these Terms.
        </p>
      </section>

      <Divider />

      {/* ── Section 3 ── */}
      <section id="service" className="scroll-mt-24 mt-12">
        <SectionHeading number="3" title="Service Description" />
        <p className="text-[#71717A] leading-relaxed mb-4">
          ForjeGames is an AI-powered game development platform that assists users in creating Roblox
          game content including scripts, assets, models, and game logic (&quot;Generated
          Content&quot;). The Service uses large language models and generative AI to fulfill user
          requests.
        </p>
        <p className="text-[#71717A] leading-relaxed mb-4">
          The Service is provided as a software-as-a-service (&quot;SaaS&quot;) platform. We
          reserve the right to modify, suspend, or discontinue any feature or the entire Service at
          any time with or without notice.
        </p>
        <p className="text-[#71717A] leading-relaxed">
          ForjeGames is an independent third-party tool. It is not affiliated with, endorsed by, or
          sponsored by Roblox Corporation. Use of the Service must comply with Roblox
          Corporation&apos;s applicable terms of service and community standards.
        </p>
      </section>

      <Divider />

      {/* ── Section 4 ── */}
      <section id="tokens" className="scroll-mt-24 mt-12">
        <SectionHeading number="4" title="Token &amp; Credit System" />
        <p className="text-[#71717A] leading-relaxed mb-4">
          The Service uses a token/credit system (&quot;Forge Tokens&quot;) to meter AI generation
          usage. Forge Tokens may be (a) included with a paid subscription plan, (b) purchased as
          add-ons, or (c) awarded through promotions.
        </p>
        <p className="text-[#71717A] leading-relaxed mb-4">
          <strong className="text-[#FAFAFA] font-semibold">No cash value.</strong> Forge Tokens have
          no monetary value, are not redeemable for cash, and are non-transferable between accounts
          except where explicitly permitted by us.
        </p>
        <p className="text-[#71717A] leading-relaxed mb-4">
          <strong className="text-[#FAFAFA] font-semibold">Expiry.</strong> Add-on Forge Tokens
          purchased separately expire 12 months from purchase date. Subscription-included tokens
          expire at the end of each billing cycle and do not roll over unless explicitly stated in
          your plan.
        </p>
        <p className="text-[#71717A] leading-relaxed mb-4">
          <strong className="text-[#FAFAFA] font-semibold">No refunds on tokens.</strong> Forge
          Token purchases are final and non-refundable except as required by applicable law or as
          set out in Section 5 (Subscription Terms).
        </p>
        <p className="text-[#71717A] leading-relaxed">
          We reserve the right to adjust token pricing, generation costs, and allocation at any time
          with 30 days notice for material changes.
        </p>
      </section>

      <Divider />

      {/* ── Section 5 ── */}
      <section id="subscriptions" className="scroll-mt-24 mt-12">
        <SectionHeading number="5" title="Subscription Terms" />
        <p className="text-[#71717A] leading-relaxed mb-4">
          Paid subscriptions are billed in advance on a monthly or annual basis. Your subscription
          automatically renews at the end of each billing period unless cancelled before the renewal
          date.
        </p>
        <p className="text-[#71717A] leading-relaxed mb-4">
          <strong className="text-[#FAFAFA] font-semibold">
            ROSCA / California Auto-Renewal Law.
          </strong>{' '}
          In compliance with California&apos;s Automatic Renewal Law (Cal. Bus. &amp; Prof. Code §
          17600 et seq.) and the Restore Online Shoppers&apos; Confidence Act (ROSCA), we clearly
          disclose: (1) subscription terms and price; (2) cancellation policy; and (3) how to
          cancel. You may cancel your subscription at any time from your account Billing Settings
          with a single click — no phone call or email required.
        </p>
        <p className="text-[#71717A] leading-relaxed mb-4">
          <strong className="text-[#FAFAFA] font-semibold">Cancellation.</strong> Cancelling stops
          future charges. You retain access through the end of your current paid period. We do not
          provide prorated refunds for partial periods except where required by applicable law.
        </p>
        <p className="text-[#71717A] leading-relaxed mb-4">
          <strong className="text-[#FAFAFA] font-semibold">Refunds.</strong> Subscription payments
          are generally non-refundable. We may issue a refund in our sole discretion if you contact
          us within 7 days of the charge and have not meaningfully used the Service during that
          period. EU/UK consumers have a 14-day statutory cooling-off right for digital services not
          yet accessed.
        </p>
        <p className="text-[#71717A] leading-relaxed mb-4">
          <strong className="text-[#FAFAFA] font-semibold">Price changes.</strong> We will provide
          at least 30 days&apos; notice of any subscription price increase. Continued use after the
          effective date constitutes acceptance.
        </p>
        <p className="text-[#71717A] leading-relaxed">
          <strong className="text-[#FAFAFA] font-semibold">Payment processing.</strong> Payments
          are processed by Stripe, Inc. EU users may be required to complete Strong Customer
          Authentication (SCA/3D Secure) as required by PSD2.
        </p>
      </section>

      <Divider />

      {/* ── Section 6 ── */}
      <section id="ai-content" className="scroll-mt-24 mt-12">
        <SectionHeading number="6" title="AI-Generated Content Ownership" />
        <p className="text-[#71717A] leading-relaxed mb-4">
          <strong className="text-[#FAFAFA] font-semibold">Your ownership of outputs.</strong>{' '}
          Subject to your compliance with these Terms and applicable subscription requirements, we
          assign to you all right, title, and interest (if any) that we hold in Generated Content
          produced in response to your prompts. You may use, modify, publish, and commercialize
          Generated Content.
        </p>
        <p className="text-[#71717A] leading-relaxed mb-4">
          <strong className="text-[#FAFAFA] font-semibold">AI copyright uncertainty.</strong>{' '}
          AI-generated content occupies an evolving legal landscape. While we assign our rights, we
          make no warranty that Generated Content is free from third-party intellectual property
          claims or that it will qualify for copyright protection in your jurisdiction. You assume
          all risk associated with commercializing Generated Content.
        </p>
        <p className="text-[#71717A] leading-relaxed mb-4">
          <strong className="text-[#FAFAFA] font-semibold">Your inputs.</strong> You retain all
          rights in the prompts and materials you provide. By submitting inputs, you grant us a
          limited, worldwide, royalty-free license to process your inputs to provide the Service and
          to improve our AI models, unless you have opted out via account settings or by contacting{' '}
          {EMAIL}.
        </p>
        <p className="text-[#71717A] leading-relaxed mb-4">
          <strong className="text-[#FAFAFA] font-semibold">No inappropriate content.</strong> You
          may not use the Service to generate content that is illegal, hateful, sexually explicit,
          or violates any third-party rights. We may remove such content and suspend your account.
        </p>
        <p className="text-[#71717A] leading-relaxed">
          <strong className="text-[#FAFAFA] font-semibold">Roblox platform compliance.</strong>{' '}
          Generated Content intended for upload to Roblox must comply with Roblox&apos;s Community
          Standards and Terms of Use. We are not responsible for content rejected or moderated by
          Roblox.
        </p>
      </section>

      <Divider />

      {/* ── Section 7 ── */}
      <section id="marketplace" className="scroll-mt-24 mt-12">
        <SectionHeading number="7" title="Marketplace Terms" />
        <p className="text-[#71717A] leading-relaxed mb-4">
          The Service may include a marketplace where users buy and sell game assets, templates, and
          plugins (&quot;Marketplace&quot;).
        </p>
        <p className="text-[#71717A] leading-relaxed mb-4">
          <strong className="text-[#FAFAFA] font-semibold">Sellers.</strong> By listing items, you
          represent that you have all rights to sell or license such items and that they comply with
          these Terms and applicable law. You grant buyers a license to use purchased items as
          described in your listing.
        </p>
        <p className="text-[#71717A] leading-relaxed mb-4">
          <strong className="text-[#FAFAFA] font-semibold">Revenue share.</strong> We retain a
          platform fee (as displayed at time of listing) on each Marketplace transaction. Remaining
          proceeds are paid to sellers pursuant to our Seller Payout terms.
        </p>
        <p className="text-[#71717A] leading-relaxed mb-4">
          <strong className="text-[#FAFAFA] font-semibold">Prohibited listings.</strong> You may
          not list stolen assets, AI-generated content misrepresented as human-made, or items that
          infringe third-party IP. Violations may result in listing removal, account suspension, and
          chargebacks.
        </p>
        <p className="text-[#71717A] leading-relaxed">
          <strong className="text-[#FAFAFA] font-semibold">Disputes.</strong> We are not a party to
          transactions between buyers and sellers. Disputes between buyers and sellers should be
          resolved directly; we may intervene at our discretion.
        </p>
      </section>

      <Divider />

      {/* ── Section 8 ── */}
      <section id="plugins" className="scroll-mt-24 mt-12">
        <SectionHeading number="8" title="Plugin Developer Terms" />
        <p className="text-[#71717A] leading-relaxed mb-4">
          Developers who publish plugins or integrations to the ForjeGames platform
          (&quot;Developers&quot;) are additionally subject to our Plugin Developer Agreement,
          incorporated herein by reference.
        </p>
        <p className="text-[#71717A] leading-relaxed mb-4">
          <strong className="text-[#FAFAFA] font-semibold">License grant.</strong> By submitting a
          plugin, you grant us a worldwide, royalty-free, sublicensable license to distribute,
          display, and operate your plugin as part of the Service.
        </p>
        <p className="text-[#71717A] leading-relaxed mb-4">
          <strong className="text-[#FAFAFA] font-semibold">Prohibited plugin behaviors.</strong>{' '}
          Plugins must not: (a) collect user data beyond what is necessary for plugin functionality;
          (b) exfiltrate user credentials or tokens; (c) introduce malicious code; (d) circumvent
          our billing or authentication systems.
        </p>
        <p className="text-[#71717A] leading-relaxed">
          <strong className="text-[#FAFAFA] font-semibold">Review.</strong> We review plugins
          before publication and may reject or remove plugins at any time that do not meet our
          quality or security standards.
        </p>
      </section>

      <Divider />

      {/* ── Section 9 ── */}
      <section id="aup" className="scroll-mt-24 mt-12">
        <SectionHeading number="9" title="Acceptable Use Policy" />
        <p className="text-[#71717A] leading-relaxed mb-4">
          You agree not to use the Service to:
        </p>
        <ul className="space-y-2 text-[#71717A] leading-relaxed mb-4">
          {[
            'Violate any applicable law or regulation',
            'Infringe any intellectual property, privacy, or other rights of any person',
            'Generate, store, or transmit material that is sexually explicit, obscene, defamatory, or harassing',
            'Generate content exploiting or targeting minors',
            'Attempt to gain unauthorized access to any account, computer system, or network',
            'Reverse-engineer, decompile, or disassemble the Service',
            'Scrape, crawl, or harvest data from the Service without our written permission',
            'Introduce viruses, malware, or any code designed to disrupt, damage, or gain unauthorized access',
            'Impersonate any person or entity or misrepresent your affiliation',
            'Engage in fraudulent billing, chargebacks, or account sharing prohibited by your plan',
            'Generate spam, phishing content, or disinformation campaigns',
            'Use the Service to develop competing products or services without our written consent',
          ].map((item) => (
            <li key={item} className="flex gap-3">
              <span className="mt-1.5 w-1 h-1 rounded-full bg-[#FFB81C]/40 shrink-0" />
              {item}
            </li>
          ))}
        </ul>
        <p className="text-[#71717A] leading-relaxed">
          Full Acceptable Use details are available at{' '}
          <Link href="/acceptable-use" className="text-[#FFB81C] hover:underline">
            forjegames.com/acceptable-use
          </Link>
          .
        </p>
      </section>

      <Divider />

      {/* ── Section 10 ── */}
      <section id="ip-dmca" className="scroll-mt-24 mt-12">
        <SectionHeading number="10" title="Intellectual Property &amp; DMCA" />
        <p className="text-[#71717A] leading-relaxed mb-4">
          The Service, including its software, design, logos, and documentation, is owned by{' '}
          {COMPANY} and protected by copyright, trademark, and other intellectual property laws.
        </p>
        <p className="text-[#71717A] leading-relaxed mb-4">
          <strong className="text-[#FAFAFA] font-semibold">
            DMCA Notice &amp; Takedown.
          </strong>{' '}
          We respond to valid notices of copyright infringement under the Digital Millennium
          Copyright Act (17 U.S.C. § 512). If you believe content on the Service infringes your
          copyright, submit a compliant takedown notice to our designated agent. We will respond
          within 48 hours. See our{' '}
          <Link href="/dmca" className="text-[#FFB81C] hover:underline">
            DMCA Policy
          </Link>{' '}
          for full instructions.
        </p>
        <p className="text-[#71717A] leading-relaxed mb-4">
          <strong className="text-[#FAFAFA] font-semibold">Repeat infringers.</strong> We operate a
          repeat-infringer policy. Accounts that repeatedly infringe copyrights will be terminated.
        </p>
        <p className="text-[#71717A] leading-relaxed">
          <strong className="text-[#FAFAFA] font-semibold">Trademarks.</strong> &quot;ForjeGames&quot;
          and our logos are trademarks of {COMPANY}. You may not use our trademarks without prior
          written consent. &quot;Roblox&quot; is a trademark of Roblox Corporation; we are not
          affiliated with or endorsed by Roblox Corporation.
        </p>
      </section>

      <Divider />

      {/* ── Section 11 ── */}
      <section id="privacy" className="scroll-mt-24 mt-12">
        <SectionHeading number="11" title="Privacy &amp; Data" />
        <p className="text-[#71717A] leading-relaxed">
          Your use of the Service is subject to our{' '}
          <Link href="/privacy" className="text-[#FFB81C] hover:underline">
            Privacy Policy
          </Link>
          , which is incorporated into these Terms by reference. The Privacy Policy describes how we
          collect, use, and share information about you, including GDPR rights for EU residents,
          CCPA rights for California residents, and COPPA protections for users under 13.
        </p>
      </section>

      <Divider />

      {/* ── Section 12 ── */}
      <section id="charity" className="scroll-mt-24 mt-12">
        <SectionHeading number="12" title="Charity Donation Disclosure" />
        <div className="bg-[#FFB81C]/[0.06] border border-[#FFB81C]/20 rounded-2xl p-5 mb-5">
          <p className="text-sm font-semibold text-[#FFB81C] mb-2">Important Disclosure</p>
          <p className="text-sm text-[#71717A] leading-relaxed">
            10% of ForjeGames revenue is donated to charitable causes selected by {OWNER}. These
            donations are made by {COMPANY} — they are{' '}
            <strong className="text-[#FAFAFA]">not</strong> tax-deductible for customers. No
            portion of your subscription or purchase price constitutes a charitable contribution on
            your behalf.
          </p>
        </div>
        <p className="text-[#71717A] leading-relaxed">
          {COMPANY} is a for-profit LLC, not a registered 501(c)(3) nonprofit. The charitable
          donations are a voluntary business practice of {OWNER} and do not create any tax benefit
          for users. We may change the donation percentage, recipient charities, or this program at
          any time with notice on our website.
        </p>
      </section>

      <Divider />

      {/* ── Section 13 ── */}
      <section id="disclaimers" className="scroll-mt-24 mt-12">
        <SectionHeading number="13" title="Disclaimers &amp; Limitation of Liability" />
        <p className="text-[10px] font-semibold text-[#52525B] uppercase tracking-widest mb-3">
          Disclaimer of Warranties
        </p>
        <p className="text-[#71717A] leading-relaxed mb-6 text-sm">
          THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES
          OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF
          MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. WE DO NOT WARRANT
          THAT THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, OR FREE OF HARMFUL COMPONENTS.
        </p>
        <p className="text-[10px] font-semibold text-[#52525B] uppercase tracking-widest mb-3">
          Limitation of Liability
        </p>
        <p className="text-[#71717A] leading-relaxed mb-4 text-sm">
          TO THE MAXIMUM EXTENT PERMITTED BY LAW, IN NO EVENT SHALL{' '}
          {COMPANY.toUpperCase()}, ITS OFFICERS, DIRECTORS, EMPLOYEES, OR AGENTS BE LIABLE FOR ANY
          INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING LOST PROFITS,
          LOST DATA, OR BUSINESS INTERRUPTION, ARISING FROM YOUR USE OF THE SERVICE, EVEN IF WE HAVE
          BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.
        </p>
        <p className="text-[#71717A] leading-relaxed mb-4 text-sm">
          OUR TOTAL CUMULATIVE LIABILITY TO YOU FOR ALL CLAIMS ARISING FROM OR RELATING TO THESE
          TERMS OR THE SERVICE SHALL NOT EXCEED THE GREATER OF (A) THE AMOUNT YOU PAID US IN THE 12
          MONTHS PRECEDING THE CLAIM OR (B) US $100.
        </p>
        <p className="text-[#71717A] leading-relaxed">
          Some jurisdictions do not allow the exclusion or limitation of certain warranties or
          damages. To the extent such limitations are prohibited, they shall apply to the fullest
          extent permitted.
        </p>
      </section>

      <Divider />

      {/* ── Section 14 ── */}
      <section id="indemnification" className="scroll-mt-24 mt-12">
        <SectionHeading number="14" title="Indemnification" />
        <p className="text-[#71717A] leading-relaxed">
          You agree to indemnify, defend, and hold harmless {COMPANY}, its officers, directors,
          employees, and agents from and against any and all claims, damages, losses, costs, and
          expenses (including reasonable attorneys&apos; fees) arising from: (a) your use of the
          Service; (b) your violation of these Terms; (c) your violation of any third-party rights,
          including intellectual property rights; or (d) any Generated Content you create or
          publish.
        </p>
      </section>

      <Divider />

      {/* ── Section 15 ── */}
      <section id="disputes" className="scroll-mt-24 mt-12">
        <SectionHeading number="15" title="Dispute Resolution &amp; Arbitration" />
        <p className="text-[#71717A] leading-relaxed mb-4">
          <strong className="text-[#FAFAFA] font-semibold">Informal resolution first.</strong>{' '}
          Before initiating any legal proceeding, you agree to contact us at {EMAIL} and attempt to
          resolve the dispute informally for at least 30 days.
        </p>
        <p className="text-[#71717A] leading-relaxed mb-4">
          <strong className="text-[#FAFAFA] font-semibold">Binding arbitration.</strong> If
          informal resolution fails, any dispute, controversy, or claim arising out of or relating
          to these Terms or the Service shall be resolved by binding individual arbitration
          administered by the American Arbitration Association (&quot;AAA&quot;) under its Consumer
          Arbitration Rules, except as noted below.
        </p>
        <p className="text-[#71717A] leading-relaxed mb-4">
          <strong className="text-[#FAFAFA] font-semibold">Class action waiver.</strong> YOU AND{' '}
          {COMPANY.toUpperCase()} WAIVE THE RIGHT TO BRING OR PARTICIPATE IN A CLASS ACTION OR
          COLLECTIVE PROCEEDING. ALL DISPUTES MUST BE BROUGHT INDIVIDUALLY.
        </p>
        <p className="text-[#71717A] leading-relaxed mb-4">
          <strong className="text-[#FAFAFA] font-semibold">Small claims exception.</strong> Either
          party may bring an individual claim in small claims court if the claim qualifies.
        </p>
        <p className="text-[#71717A] leading-relaxed mb-4">
          <strong className="text-[#FAFAFA] font-semibold">EU/UK users.</strong> Nothing in this
          section limits your right to bring claims before your local courts under EU/UK consumer
          protection law, and you may use the EU Online Dispute Resolution platform at{' '}
          <a
            href="https://ec.europa.eu/consumers/odr"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#FFB81C] hover:underline"
          >
            ec.europa.eu/consumers/odr
          </a>
          .
        </p>
        <p className="text-[#71717A] leading-relaxed">
          <strong className="text-[#FAFAFA] font-semibold">COPPA arbitration exclusion.</strong>{' '}
          Disputes regarding children&apos;s data under COPPA are not subject to arbitration and
          may be brought in federal or state court.
        </p>
      </section>

      <Divider />

      {/* ── Section 16 ── */}
      <section id="termination" className="scroll-mt-24 mt-12">
        <SectionHeading number="16" title="Termination" />
        <p className="text-[#71717A] leading-relaxed mb-4">
          We may suspend or terminate your access to the Service at any time, with or without
          notice, for violation of these Terms, non-payment, fraudulent activity, or any reason in
          our sole discretion.
        </p>
        <p className="text-[#71717A] leading-relaxed mb-4">
          You may terminate your account at any time by cancelling your subscription in account
          settings and deleting your account. Upon termination, we will retain your data as
          described in our Privacy Policy and applicable law.
        </p>
        <p className="text-[#71717A] leading-relaxed">
          Sections 6 (AI Content Ownership), 10 (IP/DMCA), 13 (Disclaimers), 14 (Indemnification),
          15 (Disputes), and 18 (Governing Law) survive termination.
        </p>
      </section>

      <Divider />

      {/* ── Section 17 ── */}
      <section id="modifications" className="scroll-mt-24 mt-12">
        <SectionHeading number="17" title="Modification of Terms" />
        <p className="text-[#71717A] leading-relaxed mb-4">
          We reserve the right to modify these Terms at any time. We will notify you of material
          changes by email or in-app notice at least 30 days before the changes take effect (7 days
          for urgent legal/security updates). Continued use after the effective date constitutes
          acceptance of the revised Terms.
        </p>
        <p className="text-[#71717A] leading-relaxed">
          We maintain a version history of these Terms. If you object to any change, your sole
          remedy is to stop using the Service and cancel your subscription.
        </p>
      </section>

      <Divider />

      {/* ── Section 18 ── */}
      <section id="governing-law" className="scroll-mt-24 mt-12">
        <SectionHeading number="18" title="Governing Law" />
        <p className="text-[#71717A] leading-relaxed mb-4">
          These Terms are governed by the laws of the United States and the state of Wyoming (where{' '}
          {COMPANY} is registered), without regard to conflict-of-law principles. Subject to Section
          15, any litigation shall be brought in the federal or state courts located in Wyoming, and
          you consent to personal jurisdiction in such courts.
        </p>
        <p className="text-[#71717A] leading-relaxed">
          If you are an EU consumer, mandatory consumer protection laws of your country of residence
          also apply and are not overridden by this section.
        </p>
      </section>

      {/* ── Footer ── */}
      <div className="mt-14 pt-8 border-t border-white/[0.06]">
        <div className="bg-[#141414] border border-white/[0.07] rounded-2xl p-5 text-sm space-y-1">
          <p className="text-[#71717A]">
            <span className="text-[#FAFAFA] font-medium">Contact:</span> {ADDRESS}
          </p>
          <p className="text-[#71717A]">
            <span className="text-[#FAFAFA] font-medium">Legal inquiries:</span>{' '}
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

function Divider() {
  return <div className="border-t border-white/[0.04] mt-12" />
}
