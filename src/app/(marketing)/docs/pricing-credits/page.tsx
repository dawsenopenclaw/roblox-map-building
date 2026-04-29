import type { Metadata } from 'next'
import { createMetadata } from '@/lib/metadata'
import DocsLayout from '@/components/docs/DocsLayout'
import Callout from '@/components/docs/Callout'

export const metadata: Metadata = createMetadata({
  title: 'Pricing & Credits',
  description:
    'Understand how ForjeGames tokens work: per-action costs, plan refills, top-ups, and which AI modes are most expensive.',
  path: '/docs/pricing-credits',
})

const TOC = [
  { id: 'what-are-tokens', label: 'What are tokens?' },
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
      <h2 id="what-are-tokens">What are tokens?</h2>
      <p>
        Tokens are the single unit of billing on ForjeGames. Every AI action — a chat
        turn, a voice transcription, a 3D mesh generation — costs a fixed number of
        tokens. You top up either by subscribing to a monthly plan (which refills on
        the 1st) or by buying a one-time pack from the billing page.
      </p>
      <p>
        New accounts start with <strong>1,000 free tokens</strong>, which is roughly
        40 Build actions. Free tokens don&apos;t expire.
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
          <tr><td>Build</td><td>20–40 tokens</td><td>Depends on output size.</td></tr>
          <tr><td>Think</td><td>50–100 tokens</td><td>Extended reasoning.</td></tr>
          <tr><td>Plan</td><td>3–6 tokens</td><td>Text only.</td></tr>
          <tr><td>Image (vision)</td><td>30–60 tokens</td><td>Plus upload.</td></tr>
          <tr><td>Script</td><td>10–25 tokens</td><td>Per file.</td></tr>
          <tr><td>Terrain</td><td>15–30 tokens</td><td>Scales with size.</td></tr>
          <tr><td>3D (mesh)</td><td>80–150 tokens</td><td>Meshy AI pipeline.</td></tr>
          <tr><td>Debug</td><td>10–20 tokens</td><td>Per iteration.</td></tr>
          <tr><td>Ideas</td><td>1–3 tokens</td><td>Brainstorm only.</td></tr>
        </tbody>
      </table>

      <h2 id="plans">Plans & refills</h2>
      <p>See the <a href="/pricing">pricing page</a> for current plan tiers. In brief:</p>
      <ul>
        <li><strong>Test Drive (Free)</strong> — 1,000 tokens once. Props &amp; small builds only.</li>
        <li><strong>Builder ($25/mo)</strong> — 15,000 tokens/month. 25% game depth.</li>
        <li><strong>Creator ($50/mo)</strong> — 40,000 tokens/month. 50% game depth.</li>
        <li><strong>Pro ($150/mo)</strong> — 100,000 tokens/month. 75% game depth.</li>
        <li><strong>Studio ($200/mo)</strong> — 200,000 tokens/month. 100% game depth — full game building.</li>
      </ul>
      <p>
        <strong>Game depth</strong> determines how complete a game you can build each month.
        Higher tiers unlock bigger, more complex builds with more systems (scripting, UI, lighting,
        terrain, NPCs, etc). All paid plans include a 3-day free trial.
      </p>
      <p>
        Plan tokens refill on the 1st of each month and don&apos;t roll over. Top-up
        tokens never expire.
      </p>

      <Callout variant="info" title="Charity split">
        10% of every payment — subscription or top-up — goes directly to charity. You
        can see the running total on the homepage footer.
      </Callout>

      <h2 id="top-ups">Top-ups</h2>
      <p>
        Out of tokens mid-session? Go to <em>Settings → Billing → Buy tokens</em> and
        pick a pack. Top-up tokens are added to your balance within seconds and used
        only <em>after</em> your monthly plan tokens are depleted.
      </p>

      <h2 id="api-billing">API billing</h2>
      <p>
        If you use the <a href="/docs/api">REST API</a>, every request consumes the same
        tokens as the equivalent editor action. API usage is billed against the same
        balance — there&apos;s no separate bucket. You can monitor real-time spend from
        <em> Dashboard → API Usage</em>.
      </p>

      <h2 id="budgeting">Budgeting tips</h2>
      <ul>
        <li>Use <strong>Plan</strong> to preview a build before committing to it.</li>
        <li>Use <strong>Script</strong> instead of Build when you only need code changes.</li>
        <li>
          Check <a href="/docs/marketplace">Marketplace</a> for a template — remixing
          costs zero tokens.
        </li>
        <li>
          Set a monthly spend cap in <em>Settings → Billing → Spend limit</em> so you
          never get surprised.
        </li>
      </ul>
    </DocsLayout>
  )
}
