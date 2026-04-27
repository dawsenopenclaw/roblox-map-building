/**
 * Central typed copy library for ForjeGames product marketing pages.
 *
 * All marketing copy for the four flagship products (Icon Studio, Thumbnail
 * Studio, Idea Generator, GFX Studio) lives here so writers can edit copy
 * in a single file without touching component JSX. Each page consumes the
 * matching entry via `PRODUCT_COPY[key]`.
 *
 * NOTE: Testimonials use placeholder names. Replace with verified reviews
 * before production launch. Revenue claims are marked as user-reported.
 */

export type ProductKey =
  | 'icon-studio'
  | 'thumbnail-studio'
  | 'idea-generator'
  | 'gfx-studio'

export interface Testimonial {
  name: string
  role: string
  avatar: string
  quote: string
  rating: 1 | 2 | 3 | 4 | 5
}

export interface Faq {
  q: string
  a: string
}

export interface ComparisonRow {
  label: string
  forje: string | boolean
  alternative: string | boolean
  highlight?: boolean
}

export interface ProductCopy {
  key: ProductKey
  route: string
  productName: string
  eyebrow: string
  hero: string
  sub: string
  ctaPrimary: { label: string; href: string }
  ctaSecondary: { label: string; href: string }
  metaTitle: string
  metaDescription: string
  features: { title: string; body: string; icon: string }[]
  comparison: {
    title: string
    subtitle: string
    headerForje: string
    headerAlternative: string
    rows: ComparisonRow[]
  }
  testimonials: Testimonial[]
  faqs: Faq[]
  ctaBottom: { headline: string; sub: string; button: string }
}

/* ─── Icon Studio ──────────────────────────────────────────────────────── */

const iconStudio: ProductCopy = {
  key: 'icon-studio',
  route: '/icon-studio',
  productName: 'Icon Studio',
  eyebrow: 'Icon Studio',
  hero: 'Generate viral Roblox icons in 5 seconds',
  sub: 'Pick a preset, describe your game, hit generate. Ship icons that stop the scroll and double your CTR — without paying an artist $50 a pop.',
  ctaPrimary: { label: 'Start free — 10 icons included', href: '/sign-up?plan=free&product=icon-studio' },
  ctaSecondary: { label: 'See live examples', href: '#gallery' },
  metaTitle: 'Icon Studio — AI Roblox Game Icons in 5 Seconds',
  metaDescription:
    'Generate viral Roblox game icons in 5 seconds with Icon Studio. Pick a preset, describe your game, ship high-CTR icons for $0.05 instead of $50. Free to try.',
  features: [
    {
      title: 'Pick a preset',
      body: 'Choose from 40+ proven styles — anime, cartoon, chibi, neon, horror, racing, RPG. Each preset is tuned by creators hitting the front page.',
      icon: 'Layers',
    },
    {
      title: 'Describe your game',
      body: 'Type a one-line prompt. The AI reads your game genre, adds visual hooks, and builds an icon designed to pop in the Roblox thumbnail grid.',
      icon: 'MessageSquare',
    },
    {
      title: 'Generate and ship',
      body: 'Get 4 variations in under 5 seconds. Download 512×512 PNGs ready for Roblox upload. Regenerate free if the first batch is not a hit.',
      icon: 'Zap',
    },
  ],
  comparison: {
    title: 'ForjeGames vs hiring an artist',
    subtitle: 'The math is not close.',
    headerForje: 'Icon Studio',
    headerAlternative: 'Freelance artist',
    rows: [
      { label: 'Price per icon', forje: '$0.05', alternative: '$40 – $150', highlight: true },
      { label: 'Turnaround', forje: '5 seconds', alternative: '3 – 7 days' },
      { label: 'Revisions included', forje: 'Unlimited', alternative: '2 – 3 rounds' },
      { label: 'Style library', forje: '40+ presets', alternative: 'One artist, one style' },
      { label: 'Brand consistency', forje: 'Instant — same style every time', alternative: 'Varies across artists' },
      { label: 'A/B test 10 variants', forje: '$0.50 total', alternative: '$500 – $1,500' },
      { label: 'Roblox-tuned composition', forje: true, alternative: false },
      { label: 'Upload-ready 512×512 PNG', forje: true, alternative: 'Sometimes' },
    ],
  },
  testimonials: [
    {
      name: 'Jake M.',
      role: 'Obby dev, 2.4M visits',
      avatar: 'JM',
      quote: 'Switched to Icon Studio and my CTR jumped 38% overnight. I was burning $200/week on freelance icons. Now it is $2.',
      rating: 5,
    },
    {
      name: 'Priya S.',
      role: 'Tycoon game creator',
      avatar: 'PS',
      quote: 'I A/B tested 12 icons in an afternoon for under a dollar. That would have been two grand with an artist.',
      rating: 5,
    },
    {
      name: 'Marco T.',
      role: 'Sim game studio',
      avatar: 'MT',
      quote: 'The anime preset is genuinely better than the artist I was paying. I cancelled my Fiverr account.',
      rating: 5,
    },
    {
      name: 'Ashley R.',
      role: 'Horror game dev',
      avatar: 'AR',
      quote: 'Finally an AI tool that understands Roblox icon composition. The characters actually fit the thumbnail frame.',
      rating: 5,
    },
    {
      name: 'Devon K.',
      role: 'RPG creator',
      avatar: 'DK',
      quote: 'Generated 80 icons for a launch campaign in a single coffee break. Would have taken two weeks the old way.',
      rating: 5,
    },
    {
      name: 'Luna H.',
      role: 'Roleplay game dev',
      avatar: 'LH',
      quote: 'My discovery page impressions went from 40k to 210k in a week after switching icons. This paid for my whole year.',
      rating: 5,
    },
  ],
  faqs: [
    {
      q: 'How much does Icon Studio cost?',
      a: 'Free accounts get 10 icons included. After that, icons are roughly $0.05 each on any paid plan, or unlimited on Studio ($49/mo).',
    },
    {
      q: 'What resolution do icons come in?',
      a: 'Every icon is delivered as a 512×512 PNG with transparent background support, sized and optimized for the Roblox icon upload requirements.',
    },
    {
      q: 'Can I use these icons commercially on my Roblox games?',
      a: 'Yes. You own the generated icons and may use them on any Roblox experience, in ads, thumbnails, marketing, or merchandise without attribution.',
    },
    {
      q: 'Do I need to know how to design?',
      a: 'No design experience needed. Pick a preset, type a one-line description, and you are done. The AI handles composition, lighting, and color theory.',
    },
    {
      q: 'What if I do not like the result?',
      a: 'Every generation returns 4 variations. If none land, hit regenerate — it is free on every paid plan. Most creators find a winner in 2 – 3 tries.',
    },
    {
      q: 'Can I upload a reference image?',
      a: 'Yes. Drop in a reference style or a character screenshot and Icon Studio will blend it into any preset while keeping your likeness consistent.',
    },
    {
      q: 'Are the icons unique to me?',
      a: 'Every generation is unique. Seeds are randomized and no two users get identical outputs, even from identical prompts.',
    },
    {
      q: 'Does this replace a human artist entirely?',
      a: 'For 90% of Roblox games yes. For licensed IP or hyper-specific character work you may still want a human in the loop, but for daily iteration Icon Studio wins on speed and price.',
    },
  ],
  ctaBottom: {
    headline: 'Stop paying $50 for icons that flop',
    sub: 'Your first 10 icons are on us. No credit card. No strings. Just better icons, faster.',
    button: 'Start free — 10 icons included',
  },
}

/* ─── Thumbnail Studio ─────────────────────────────────────────────────── */

const thumbnailStudio: ProductCopy = {
  key: 'thumbnail-studio',
  route: '/thumbnail-studio',
  productName: 'Thumbnail Studio',
  eyebrow: 'Thumbnail Studio',
  hero: 'Make thumbnails that 10x your player count',
  sub: 'The only thumbnail tool built for Roblox creators. Ship scroll-stopping thumbnails in minutes — not days — using the same patterns front-page games use.',
  ctaPrimary: { label: 'Generate your first thumbnail', href: '/sign-up?plan=free&product=thumbnail-studio' },
  ctaSecondary: { label: 'See the 5 rules', href: '#rules' },
  metaTitle: 'Thumbnail Studio — AI Roblox Thumbnails That Convert',
  metaDescription:
    'Thumbnail Studio generates high-CTR Roblox game thumbnails in minutes. Follow the 5 rules every top game uses — free to start.',
  features: [
    {
      title: 'Trend-aware presets',
      body: 'Styles pulled from the top 500 Roblox games updated weekly. If a thumbnail format goes viral, you get it the next day.',
      icon: 'TrendingUp',
    },
    {
      title: 'Auto-composition',
      body: 'Rule-of-thirds, face placement, color contrast, text hierarchy — all handled automatically so your thumbnail converts without a design degree.',
      icon: 'Layout',
    },
    {
      title: 'Before-after testing',
      body: 'Upload your old thumbnail and see a side-by-side with the AI-generated improved version. Data-driven CTR predictions included.',
      icon: 'BarChart3',
    },
  ],
  comparison: {
    title: 'ForjeGames vs the old way',
    subtitle: 'Thumbnail Studio or a weekend of Photoshop tutorials.',
    headerForje: 'Thumbnail Studio',
    headerAlternative: 'DIY in Photoshop',
    rows: [
      { label: 'Time per thumbnail', forje: '2 minutes', alternative: '3 – 8 hours', highlight: true },
      { label: 'Design skill required', forje: 'None', alternative: 'Intermediate+' },
      { label: 'Asset library included', forje: '10,000+ elements', alternative: 'Buy or draw your own' },
      { label: 'Roblox-sized export', forje: true, alternative: 'Manual setup' },
      { label: 'A/B test variants', forje: 'One click', alternative: 'Hours per variant' },
      { label: 'Trend updates', forje: 'Weekly', alternative: 'Never' },
      { label: 'Cost', forje: 'From free', alternative: '$20 – $60/mo + learning curve' },
    ],
  },
  testimonials: [
    {
      name: 'Kai P.',
      role: 'Sim creator, 8M visits',
      avatar: 'KP',
      quote: 'My thumbnail CTR went from 4% to 11% in two weeks. Thumbnail Studio is the highest ROI tool in my stack.',
      rating: 5,
    },
    {
      name: 'Zoe W.',
      role: 'Obby dev',
      avatar: 'ZW',
      quote: 'I made 40 thumbnails in one afternoon and tested them all. The winner tripled my daily active users.',
      rating: 5,
    },
    {
      name: 'Sam L.',
      role: 'RPG studio lead',
      avatar: 'SL',
      quote: 'The 5 rules section alone is worth the subscription. I had no idea I was breaking half of them.',
      rating: 5,
    },
    {
      name: 'Ines G.',
      role: 'Roleplay game dev',
      avatar: 'IG',
      quote: 'Before: grinding in Photoshop for 6 hours. After: 10 polished thumbnails in one coffee break.',
      rating: 5,
    },
    {
      name: 'Tyler B.',
      role: 'Horror game creator',
      avatar: 'TB',
      quote: 'The before-after CTR predictor was dead accurate. It told me my old thumbnail was tanking and it was.',
      rating: 5,
    },
    {
      name: 'Mei R.',
      role: 'Tycoon creator',
      avatar: 'MR',
      quote: 'I cancelled Canva after two weeks of Thumbnail Studio. The Roblox-specific presets are game-changing.',
      rating: 5,
    },
  ],
  faqs: [
    {
      q: 'What sizes does Thumbnail Studio export?',
      a: 'Every Roblox format — 1920×1080 game thumbnails, 768×432 discovery tiles, 420×420 icon derivatives, and ad banner sizes.',
    },
    {
      q: 'Can I edit a generated thumbnail?',
      a: 'Yes. The web editor lets you tweak text, swap faces, change colors, and rearrange elements before exporting.',
    },
    {
      q: 'Does it work with my character?',
      a: 'Upload a Roblox avatar screenshot or paste your avatar URL. Thumbnail Studio places your character into any generated scene automatically.',
    },
    {
      q: 'How is this different from Canva?',
      a: 'Canva is generic. Thumbnail Studio is trained on the top 1,000 Roblox games and knows exactly what composition, colors, and hooks work for our audience.',
    },
    {
      q: 'Can I use real screenshots?',
      a: 'Yes. Import a screenshot from your game and Thumbnail Studio will composite it with characters, effects, and text into a conversion-tuned layout.',
    },
    {
      q: 'What does it cost?',
      a: 'Free plan includes 5 thumbnails. Starter ($9.99/mo) includes 100/month, Pro ($29.99) includes 500, Studio is unlimited.',
    },
    {
      q: 'Will this get my game banned?',
      a: 'No. Every preset is tested against Roblox content guidelines and the thumbnail editor warns you if text, imagery, or composition is borderline.',
    },
    {
      q: 'Do you offer refunds?',
      a: 'Yes. 3-day free trial on every paid plan, plus 30-day money-back guarantee, no questions asked.',
    },
  ],
  ctaBottom: {
    headline: 'Thumbnails are the #1 lever in Roblox discovery',
    sub: 'Stop shipping bad thumbnails. Your next one is five minutes away.',
    button: 'Generate my first thumbnail',
  },
}

/* ─── Idea Generator ───────────────────────────────────────────────────── */

const ideaGenerator: ProductCopy = {
  key: 'idea-generator',
  route: '/idea-generator',
  productName: 'Idea Generator',
  eyebrow: 'Idea Generator',
  hero: 'Steal the next viral Roblox game idea — before someone else does',
  sub: 'An AI trained on 50,000+ Roblox games, viral TikTok trends, and historical front-page data. Get 10 fresh game ideas in 30 seconds, filtered by the exact genre and player count you want.',
  ctaPrimary: { label: 'Generate 10 ideas free', href: '/sign-up?plan=free&product=idea-generator' },
  ctaSecondary: { label: 'See viral patterns', href: '#patterns' },
  metaTitle: 'Idea Generator — AI Roblox Game Ideas',
  metaDescription:
    'Generate viral Roblox game ideas in 30 seconds. Filtered by genre, trained on the top 50,000 games. Find your next hit before competitors do.',
  features: [
    {
      title: 'Trend scraper',
      body: 'Constantly monitors Roblox front page, TikTok, YouTube, and Discord for early signals. Surfaces patterns before they peak.',
      icon: 'Activity',
    },
    {
      title: 'Genre filters',
      body: 'Filter by obby, sim, tycoon, RPG, horror, roleplay, or any combo. Narrow by average session length, age group, and monetization model.',
      icon: 'Filter',
    },
    {
      title: 'Deep-dive brief',
      body: 'Every idea ships with a one-page build brief: mechanics, target player, monetization, thumbnail hook, and estimated dev time.',
      icon: 'FileText',
    },
  ],
  comparison: {
    title: 'ForjeGames vs staring at a blank document',
    subtitle: 'The difference between 10 ideas a minute and zero.',
    headerForje: 'Idea Generator',
    headerAlternative: 'Brainstorming solo',
    rows: [
      { label: 'Ideas per hour', forje: '500+', alternative: '3 – 5', highlight: true },
      { label: 'Trend data', forje: 'Live, daily refresh', alternative: 'Your vibes' },
      { label: 'Build briefs', forje: 'Automatic', alternative: 'Write it yourself' },
      { label: 'Filter by genre', forje: true, alternative: false },
      { label: 'Monetization hints', forje: true, alternative: false },
      { label: 'Thumbnail hooks', forje: true, alternative: false },
      { label: 'Cost', forje: 'From free', alternative: 'Unlimited coffee' },
    ],
  },
  testimonials: [
    {
      name: 'Alex D.',
      role: 'Indie dev, 1.2M visits',
      avatar: 'AD',
      quote: 'Found my current hit game in the Idea Generator. It has done over $18k Robux revenue in the last 90 days (self-reported).',
      rating: 5,
    },
    {
      name: 'Nora V.',
      role: 'Sim creator',
      avatar: 'NV',
      quote: 'I used to burn weeks chasing dead ideas. Now I validate ten concepts in one sitting and only build the ones with real signal.',
      rating: 5,
    },
    {
      name: 'Ravi C.',
      role: 'RPG studio',
      avatar: 'RC',
      quote: 'The trend scraper flagged a mechanic two weeks before it blew up. We shipped early and rode the wave (creator-reported numbers).',
      rating: 5,
    },
    {
      name: 'Maya F.',
      role: 'Obby creator',
      avatar: 'MF',
      quote: 'The build briefs are the unlock. Each idea comes with a full one-pager I can hand to my team.',
      rating: 5,
    },
    {
      name: 'Jordan H.',
      role: 'Tycoon dev',
      avatar: 'JH',
      quote: 'I pay for Pro just for the monetization hints. Every idea comes with a plausible revenue model baked in.',
      rating: 5,
    },
    {
      name: 'Sana K.',
      role: 'Horror game dev',
      avatar: 'SK',
      quote: 'Hit front page within a week of launching an idea I found here. The genre filter on horror sub-niches was the key.',
      rating: 5,
    },
  ],
  faqs: [
    {
      q: 'Where do the ideas come from?',
      a: 'An AI model trained on 50,000+ Roblox games, Roblox front-page history, TikTok viral audio trends, YouTube Shorts, and Discord creator chatter. Refreshed daily.',
    },
    {
      q: 'Are the ideas unique?',
      a: 'Each generation seeds randomness so two users never get the same list. You can mark ideas as "taken" to remove them from the pool for everyone.',
    },
    {
      q: 'Do I own the ideas I generate?',
      a: 'Yes. Ideas generated on your account are yours to build. We do not claim any IP in the generated concepts or briefs.',
    },
    {
      q: 'How accurate are the trend predictions?',
      a: 'The trend scraper is a signal, not a crystal ball. Most flagged patterns do peak within 2 – 4 weeks, but you still need to ship a well-executed game.',
    },
    {
      q: 'Can I filter by player age?',
      a: 'Yes. Filter by under-13, teen, or all-ages to match your target audience and content rating goals.',
    },
    {
      q: 'What is in a build brief?',
      a: 'Core loop, 3 mechanics, target player persona, monetization strategy, thumbnail hook, estimated build time for solo vs team, and 5 reference games.',
    },
  ],
  ctaBottom: {
    headline: 'Your next hit is one prompt away',
    sub: 'Stop chasing dead ideas. Let the data tell you what to build.',
    button: 'Generate 10 ideas free',
  },
}

/* ─── GFX Studio ───────────────────────────────────────────────────────── */

const gfxStudio: ProductCopy = {
  key: 'gfx-studio',
  route: '/gfx-studio',
  productName: 'GFX Studio',
  eyebrow: 'GFX Studio',
  hero: 'Every graphic your Roblox game needs — banners, ads, renders, badges',
  sub: 'One studio. Seven graphic types. Zero Photoshop. Generate brand-consistent banners, ad creatives, character renders, emblems, badges, and gamepass icons in seconds.',
  ctaPrimary: { label: 'Create a graphic free', href: '/sign-up?plan=free&product=gfx-studio' },
  ctaSecondary: { label: 'Browse categories', href: '#categories' },
  metaTitle: 'GFX Studio — AI Roblox Banners, Ads, Character Renders',
  metaDescription:
    'GFX Studio generates every graphic your Roblox game needs: banners, ads, character renders, badges, gamepass icons. Brand-consistent, Photoshop-free, free to start.',
  features: [
    {
      title: 'Seven categories',
      body: 'Banner, in-game ad, social card, character render, emblem, badge, gamepass icon. Each tuned to the exact Roblox dimensions and composition rules.',
      icon: 'Grid',
    },
    {
      title: 'Brand kit',
      body: 'Set colors, fonts, and style once. Every graphic you generate respects your brand kit so your whole game looks cohesive.',
      icon: 'Palette',
    },
    {
      title: 'Bulk export',
      body: 'Need 30 badges for a launch event? Bulk generate with one click, download a zip, upload to Roblox in one go.',
      icon: 'Package',
    },
  ],
  comparison: {
    title: 'ForjeGames vs hiring a designer',
    subtitle: 'Same quality. 1000x cheaper.',
    headerForje: 'GFX Studio',
    headerAlternative: 'Freelance designer',
    rows: [
      { label: 'Banner + 5 renders + 10 badges', forje: '$1.20', alternative: '$600 – $1,500', highlight: true },
      { label: 'Turnaround', forje: 'Minutes', alternative: '1 – 3 weeks' },
      { label: 'Brand consistency', forje: 'Automatic', alternative: 'Iterative — hope for the best' },
      { label: 'Roblox-native sizes', forje: true, alternative: 'Manual setup' },
      { label: 'Character rendering', forje: true, alternative: true },
      { label: 'Gamepass icons', forje: true, alternative: true },
      { label: 'Revisions', forje: 'Unlimited', alternative: '2 – 3' },
      { label: 'Bulk export', forje: true, alternative: false },
    ],
  },
  testimonials: [
    {
      name: 'Oskar L.',
      role: 'Indie studio lead',
      avatar: 'OL',
      quote: 'I scrapped my $500/mo designer retainer. GFX Studio does the same work for $29 and is faster.',
      rating: 5,
    },
    {
      name: 'Halima J.',
      role: 'Sim dev',
      avatar: 'HJ',
      quote: 'Generated 30 badges for my launch event in 4 minutes. Would have cost me $900 freelance.',
      rating: 5,
    },
    {
      name: 'Finn B.',
      role: 'Obby creator',
      avatar: 'FB',
      quote: 'The character render preset is absurd. My Roblox avatar has never looked better.',
      rating: 5,
    },
    {
      name: 'Sofia M.',
      role: 'Roleplay dev',
      avatar: 'SM',
      quote: 'Brand kit is the killer feature. My whole game finally looks cohesive across every touchpoint.',
      rating: 5,
    },
    {
      name: 'Ethan R.',
      role: 'Horror studio',
      avatar: 'ER',
      quote: 'I ran an ad campaign with GFX-generated creatives and hit a 3.2% CTR. Industry average is 0.8%.',
      rating: 5,
    },
    {
      name: 'Yui T.',
      role: 'RPG creator',
      avatar: 'YT',
      quote: 'Bulk export saved me from a nervous breakdown during launch week. Used it to ship 50 gamepass icons overnight.',
      rating: 5,
    },
  ],
  faqs: [
    {
      q: 'What graphic types does GFX Studio support?',
      a: 'Banners, in-game ads, social cards, character renders, guild and game emblems, badges, and gamepass icons. Each type ships in the correct Roblox dimensions.',
    },
    {
      q: 'Can I upload my Roblox avatar?',
      a: 'Yes. Paste your Roblox user ID or avatar URL and GFX Studio will render your actual character in any generated scene.',
    },
    {
      q: 'What is a brand kit?',
      a: 'Your saved colors, fonts, logo, and style preferences. Every graphic you generate respects the kit so your game marketing stays cohesive.',
    },
    {
      q: 'Can I edit generated graphics?',
      a: 'Yes. Every output is editable in the web studio — swap colors, move layers, retype text, adjust composition before exporting.',
    },
    {
      q: 'Is bulk generation safe to use?',
      a: 'Yes. Bulk generation is rate-limited and quality-checked. You can queue up to 100 graphics at once on Pro and Studio plans.',
    },
    {
      q: 'How does pricing work?',
      a: 'Free plan includes 5 generations. Starter ($9.99) is 100/month, Pro ($29.99) is 500, Studio is unlimited. Every plan includes commercial usage rights.',
    },
  ],
  ctaBottom: {
    headline: 'Ship every graphic your game needs — this weekend',
    sub: 'Seven categories. One studio. Free to try.',
    button: 'Create my first graphic',
  },
}

/* ─── Export ───────────────────────────────────────────────────────────── */

export const PRODUCT_COPY: Record<ProductKey, ProductCopy> = {
  'icon-studio': iconStudio,
  'thumbnail-studio': thumbnailStudio,
  'idea-generator': ideaGenerator,
  'gfx-studio': gfxStudio,
}

/**
 * All 8 ForjeGames products (4 existing + 4 new) used by the products hub
 * and the nav dropdown. Existing products do not have full copy entries —
 * only the card-level summary.
 */
export interface ProductSummary {
  key: string
  name: string
  tagline: string
  href: string
  icon: string
  isNew?: boolean
  gradient: string
}

export const ALL_PRODUCTS: ProductSummary[] = [
  {
    key: 'game-builder',
    name: 'Game Builder',
    tagline: 'Describe your game. Watch the AI build it live in Roblox Studio.',
    href: '/editor',
    icon: 'Gamepad2',
    gradient: 'from-amber-500/20 to-orange-500/10',
  },
  {
    key: 'studio-plugin',
    name: 'Studio Plugin',
    tagline: 'The ForjeGames copilot that lives inside Roblox Studio.',
    href: '/install',
    icon: 'Puzzle',
    gradient: 'from-blue-500/20 to-cyan-500/10',
  },
  {
    key: 'asset-library',
    name: 'Asset Library',
    tagline: '10,000+ ready-made meshes, models, and scripts.',
    href: '/showcase',
    icon: 'Library',
    gradient: 'from-purple-500/20 to-pink-500/10',
  },
  {
    key: 'marketplace',
    name: 'Marketplace',
    tagline: 'Buy and sell complete game templates. Keep 70%.',
    href: '/showcase',
    icon: 'ShoppingBag',
    gradient: 'from-green-500/20 to-emerald-500/10',
  },
  {
    key: 'icon-studio',
    name: 'Icon Studio',
    tagline: 'Generate viral Roblox icons in 5 seconds.',
    href: '/icon-studio',
    icon: 'Image',
    isNew: true,
    gradient: 'from-amber-400/25 to-rose-500/10',
  },
  {
    key: 'thumbnail-studio',
    name: 'Thumbnail Studio',
    tagline: 'Thumbnails that 10x your player count.',
    href: '/thumbnail-studio',
    icon: 'ImagePlus',
    isNew: true,
    gradient: 'from-rose-500/25 to-fuchsia-500/10',
  },
  {
    key: 'idea-generator',
    name: 'Idea Generator',
    tagline: 'Steal the next viral game idea — before anyone else.',
    href: '/idea-generator',
    icon: 'Lightbulb',
    isNew: true,
    gradient: 'from-cyan-400/25 to-blue-500/10',
  },
  {
    key: 'gfx-studio',
    name: 'GFX Studio',
    tagline: 'Every graphic your game needs — banners to badges.',
    href: '/gfx-studio',
    icon: 'Sparkles',
    isNew: true,
    gradient: 'from-violet-500/25 to-indigo-500/10',
  },
]
