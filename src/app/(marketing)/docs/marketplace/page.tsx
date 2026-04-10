import type { Metadata } from 'next'
import { createMetadata } from '@/lib/metadata'
import DocsLayout from '@/components/docs/DocsLayout'
import Callout from '@/components/docs/Callout'

export const metadata: Metadata = createMetadata({
  title: 'Marketplace — Buy & Sell Templates',
  description:
    'Browse remixable ForjeGames game templates, buy any template with credits, or publish your own and earn 80% on every sale.',
  path: '/docs/marketplace',
})

const TOC = [
  { id: 'overview', label: 'Overview' },
  { id: 'browsing', label: 'Browsing templates' },
  { id: 'buying', label: 'Buying a template' },
  { id: 'remixing', label: 'Remixing' },
  { id: 'publishing', label: 'Publishing your own' },
  { id: 'payouts', label: 'Payouts & revenue share' },
  { id: 'guidelines', label: 'Content guidelines' },
]

export default function MarketplacePage() {
  return (
    <DocsLayout
      eyebrow="Integrations"
      title="Marketplace"
      description="A curated store of Roblox game templates built in ForjeGames. Browse, remix, and publish your own."
      toc={TOC}
    >
      <h2 id="overview">Overview</h2>
      <p>
        The Marketplace is a place for creators to share and sell fully-working
        ForjeGames projects. Every listing is a complete game you can remix with one
        click — unlike a traditional asset pack, you get the map, scripts, UI, and
        chat history that produced it.
      </p>

      <h2 id="browsing">Browsing templates</h2>
      <p>
        Go to <a href="/marketplace">forjegames.com/marketplace</a>. You can filter by
        category (Tycoon, Obby, Simulator, RPG, Minigame, Roleplay), by price, and by
        whether the listing includes source scripts. Every card shows a preview
        thumbnail and a short AI-generated summary of what the game does.
      </p>

      <h2 id="buying">Buying a template</h2>
      <p>
        Click a listing to see details: screenshots, mechanics, asset count, and credit
        price. Hit <strong>Buy</strong>, confirm the credit cost, and the template is
        added to your account instantly. You can remix it as many times as you want.
      </p>

      <Callout variant="info">
        Purchases are final — we can&apos;t refund a template once it&apos;s in your
        library because you already have the source. If a listing is broken, contact
        support and we&apos;ll investigate.
      </Callout>

      <h2 id="remixing">Remixing</h2>
      <p>
        From your library, click <strong>Remix</strong> on any purchased template. This
        creates a new project in the editor with the full map, scripts, and chat history
        already loaded. You can then use any AI mode to modify it — changing the theme,
        mechanics, characters, anything.
      </p>

      <h2 id="publishing">Publishing your own</h2>
      <ol>
        <li>Open the project you want to publish in the editor.</li>
        <li>Click <em>Share → Publish to Marketplace</em>.</li>
        <li>
          Fill in the listing: title, category, description, thumbnail, price in
          credits (0 is allowed for free templates).
        </li>
        <li>
          Decide whether to include chat history. Including it helps buyers understand
          how the game was built and boosts sales.
        </li>
        <li>Submit for review. Most listings are approved within 24 hours.</li>
      </ol>

      <h2 id="payouts">Payouts & revenue share</h2>
      <p>
        Creators earn <strong>80%</strong> of the credit price on every sale. Credits
        accumulate in a separate <em>Earnings</em> wallet that you can either spend
        inside ForjeGames or cash out.
      </p>
      <p>
        Cash-out is available once your balance exceeds the equivalent of $25 USD.
        Payouts are made via Stripe Connect — weekly, in your local currency.
      </p>

      <Callout variant="success" title="Charity split">
        10% of every ForjeGames payment goes to charity. That includes marketplace
        sales. The creator&apos;s 80% is unaffected.
      </Callout>

      <h2 id="guidelines">Content guidelines</h2>
      <ul>
        <li>Templates must be something <em>you</em> built in ForjeGames.</li>
        <li>No infringing content (trademarked characters, copyrighted IP).</li>
        <li>No gore, sexual content, or gambling mechanics.</li>
        <li>
          Listings must include a working playable build — we test every submission
          before approval.
        </li>
      </ul>
    </DocsLayout>
  )
}
