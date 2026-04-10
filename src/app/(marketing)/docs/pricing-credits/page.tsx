import type { Metadata } from 'next'
import { createMetadata } from '@/lib/metadata'
import DocsLayout from '@/components/docs/DocsLayout'
import Callout from '@/components/docs/Callout'

export const metadata: Metadata = createMetadata({
  title: 'Pricing & Credits',
  description:
    'Understand how ForjeGames credits work: per-action costs, plan refills, top-ups, and which AI modes are most expensive.',
  path: '/docs/pricing-credits',
})

const TOC = [
  { id: 'what-are-credits', label: 'What are credits?' },
  { id: 'cost-per-mode', label: 'Cost per mode' },
  { id: 'plans', label: 'Plans & refills' },
  { id: 'top-ups', label: 'Top-ups' },
  { id: 'api-billing', label: 'API billing' },
  { id: 'budgeting', label: 'Budgeting tips' },
]

export default function PricingCreditsPage() {
  return (
    <DocsLayout
      eyebrow="Billing"
      title="Pricing & Credits"
      description="ForjeGames uses a credit system so you pay for what you use, not per seat."
      toc={TOC}
    >
      <h2 id="what-are-credits">What are credits?</h2>
      <p>
        Credits are the single unit of billing on ForjeGames. Every AI action — a chat
        turn, a voice transcription, a 3D mesh generation — costs a fixed number of
        credits. You top up either by subscribing to a monthly plan (which refills on
        the 1st) or by buying a one-time pack from the billing page.
      </p>
      <p>
        New accounts start with <strong>1,000 free credits</strong>, which is roughly
        40 Build actions. Free credits don&apos;t expire.
      </p>

      <h2 id="cost-per-mode">Cost per mode</h2>
      <p>
        Different AI modes run different models, so costs vary. These numbers are
        approximate and can shift slightly if a provider changes pricing — check the
        editor&apos;s credit-cost indicator for the live figure before you send.
      </p>
      <table>
        <thead>
          <tr><th>Mode</th><th>Typical cost</th><th>Notes</th></tr>
        </thead>
        <tbody>
          <tr><td>Build</td><td>20–40 credits</td><td>Depends on output size.</td></tr>
          <tr><td>Think</td><td>50–100 credits</td><td>Extended reasoning.</td></tr>
          <tr><td>Plan</td><td>3–6 credits</td><td>Text only.</td></tr>
          <tr><td>Image (vision)</td><td>30–60 credits</td><td>Plus upload.</td></tr>
          <tr><td>Script</td><td>10–25 credits</td><td>Per file.</td></tr>
          <tr><td>Terrain</td><td>15–30 credits</td><td>Scales with size.</td></tr>
          <tr><td>3D (mesh)</td><td>80–150 credits</td><td>Meshy AI pipeline.</td></tr>
          <tr><td>Debug</td><td>10–20 credits</td><td>Per iteration.</td></tr>
          <tr><td>Ideas</td><td>1–3 credits</td><td>Brainstorm only.</td></tr>
        </tbody>
      </table>

      <h2 id="plans">Plans & refills</h2>
      <p>See the <a href="/pricing">pricing page</a> for current plan tiers. In brief:</p>
      <ul>
        <li><strong>Free</strong> — 1,000 credits once, no refill.</li>
        <li><strong>Creator</strong> — 20,000 credits per month + priority queue.</li>
        <li><strong>Studio</strong> — 100,000 credits per month + API + team seats.</li>
      </ul>
      <p>
        Plan credits refill on the 1st of each month and don&apos;t roll over. Top-up
        credits never expire.
      </p>

      <Callout variant="info" title="Charity split">
        10% of every payment — subscription or top-up — goes directly to charity. You
        can see the running total on the homepage footer.
      </Callout>

      <h2 id="top-ups">Top-ups</h2>
      <p>
        Out of credits mid-session? Go to <em>Settings → Billing → Buy credits</em> and
        pick a pack. Top-up credits are added to your balance within seconds and used
        only <em>after</em> your monthly plan credits are depleted.
      </p>

      <h2 id="api-billing">API billing</h2>
      <p>
        If you use the <a href="/docs/api">REST API</a>, every request consumes the same
        credits as the equivalent editor action. API usage is billed against the same
        balance — there&apos;s no separate bucket. You can monitor real-time spend from
        <em> Dashboard → API Usage</em>.
      </p>

      <h2 id="budgeting">Budgeting tips</h2>
      <ul>
        <li>Use <strong>Plan</strong> to preview a build before committing to it.</li>
        <li>Use <strong>Script</strong> instead of Build when you only need code changes.</li>
        <li>
          Check <a href="/docs/marketplace">Marketplace</a> for a template — remixing
          costs zero credits.
        </li>
        <li>
          Set a monthly spend cap in <em>Settings → Billing → Spend limit</em> so you
          never get surprised.
        </li>
      </ul>
    </DocsLayout>
  )
}
