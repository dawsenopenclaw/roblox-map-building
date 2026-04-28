/**
 * Changelog data for the "What's New" marketing page.
 *
 * Each entry is framed as a user benefit — never an implementation detail —
 * because this copy runs on a public marketing page and is designed to sell
 * the April 2026 ForjeGames 2.0 release.
 */

export type ChangelogCategory =
  | 'AI'
  | 'Editor'
  | 'Real-time'
  | 'Marketplace'
  | 'Payments'
  | 'Growth'
  | 'Security'
  | 'Plugin'
  | 'Marketing'

export type ChangelogBadge = 'New' | 'Improved' | 'Security'

export interface ChangelogEntry {
  id: string
  category: ChangelogCategory
  title: string
  description: string
  /** ISO-8601 date string. */
  date: string
  badge?: ChangelogBadge
  /** Lucide icon name (exported from `lucide-react`). */
  icon?: string
  /** Bullet points shown when the card is expanded. */
  details: string[]
  /** Competitor or product names this feature was inspired by. */
  inspiredBy?: string[]
  /** Optional link to the related docs page. */
  docsHref?: string
}

export const RELEASE_META = {
  version: 'ForjeGames 3.0',
  releaseDate: 'April 2026',
  stats: {
    linesOfCode: '28,000+',
    featureCount: 34,
    vulnerabilityCount: 0,
  },
} as const

export const CHANGELOG: ChangelogEntry[] = [
  // ── v3.0.0 — April 27, 2026 ────────────────────────────────────────

  // 29. v5.0.0 Plugin — In-Plugin AI Chat
  {
    id: 'plugin-v5-ai-chat',
    category: 'Plugin',
    title: 'AI chat built right into Studio',
    description:
      'The v5.0.0 plugin update brings a full AI chat panel inside Roblox Studio. Describe what you want, and it builds without you ever leaving the viewport.',
    date: '2026-04-27',
    badge: 'New',
    icon: 'MessageSquare',
    details: [
      'Full AI chat panel docked inside Roblox Studio',
      'Build maps, scripts, and UI without switching windows',
      'Conversation history persists across Studio sessions',
      'Supports all 200+ specialist agents directly in-plugin',
    ],
    docsHref: '/docs/plugin',
  },

  // 30. MCP Integration
  {
    id: 'mcp-integration',
    category: 'Plugin',
    title: 'Build Roblox games from Claude Code or Cursor',
    description:
      'ForjeGames now works as a full MCP server. Connect from Claude Code, Cursor, or any MCP-compatible client and build Roblox games with your favorite AI tools.',
    date: '2026-04-27',
    badge: 'New',
    icon: 'Terminal',
    details: [
      'Full Model Context Protocol server with 200+ Studio operations',
      'Works with Claude Code, Cursor, Windsurf, and any MCP client',
      'Chain ForjeGames with other MCP tools for advanced workflows',
      'Same quality and specialist routing as the web editor',
    ],
    inspiredBy: ['Model Context Protocol', 'Cursor', 'Claude Code'],
    docsHref: '/docs/mcp',
  },

  // 31. API Key System
  {
    id: 'api-key-system',
    category: 'AI',
    title: 'Programmatic access via API keys',
    description:
      'Generate API keys from your dashboard and build on top of ForjeGames programmatically. Automate builds, integrate with CI/CD, or build your own tools.',
    date: '2026-04-27',
    badge: 'New',
    icon: 'Key',
    details: [
      'Generate and manage API keys from the settings page',
      'Scoped permissions — read-only, build, or full access',
      'Rate-limited per key with usage analytics in your dashboard',
      'Perfect for automated pipelines and custom integrations',
    ],
    docsHref: '/docs/api-keys',
  },

  // 32. Quality Overhaul — Part Limits + Specialists
  {
    id: 'quality-overhaul',
    category: 'AI',
    title: 'Builds just got 3-8x more detailed',
    description:
      'We raised part limits across the board and added specialist AI routing for every prompt type. Your builds now come out with dramatically more detail and variety.',
    date: '2026-04-27',
    badge: 'Improved',
    icon: 'TrendingUp',
    details: [
      'Part limits raised 3-8x across all build types',
      'Specialist AI routing matches every prompt to the best agent',
      'Multi-part detailing — no more single-part walls or floors',
      'Quality scoring ensures builds meet a minimum detail threshold',
    ],
  },

  // 33. 10 New AI Specialists
  {
    id: 'ten-new-specialists',
    category: 'AI',
    title: '10 new AI specialists join the team',
    description:
      'GUI, NPC, terrain, lighting, vehicles, weapons, pets, audio, scripting, and game systems — each with a dedicated specialist agent trained on thousands of Roblox examples.',
    date: '2026-04-27',
    badge: 'New',
    icon: 'Users',
    details: [
      'GUI specialist for menus, HUDs, and shop interfaces',
      'NPC agent handles pathfinding, dialogue, and behavior trees',
      'Terrain specialist for realistic landscapes and biomes',
      'Lighting, vehicles, weapons, pets, audio, scripting, and game systems agents',
    ],
  },

  // 34. Reliability — Auto-retry + Error Handling
  {
    id: 'reliability-improvements',
    category: 'Real-time',
    title: 'Rock-solid reliability under the hood',
    description:
      'Auto-retry on rate limits, better error messages, and SSE reconnect fixes. The AI pipeline now handles failures gracefully so your builds never stall.',
    date: '2026-04-27',
    badge: 'Improved',
    icon: 'RefreshCw',
    details: [
      'Automatic retry with exponential backoff on rate limits',
      'Clear, actionable error messages instead of cryptic failures',
      'SSE stream reconnection fixes — no more frozen progress bars',
      'Build success rate pushed above 99.5%',
    ],
  },

  // ── v2.0.0 — Earlier April 2026 ────────────────────────────────────

  // 1. Automated Playtest Loop
  {
    id: 'automated-playtest-loop',
    category: 'AI',
    title: 'Games that test themselves',
    description:
      'Launch your build and watch ForjeGames playtest it for you — spotting broken jumps, missing collisions, and soft-locks before a human ever opens Studio.',
    date: '2026-04-01',
    badge: 'New',
    icon: 'PlayCircle',
    details: [
      'AI plays through every new build automatically and records what worked',
      'Catches softlocks, unreachable areas, and script errors in seconds',
      'Generates a fix-it report you can apply with a single click',
      'Run unlimited playtests on Pro and above — no extra tokens charged',
    ],
    inspiredBy: ['Rosebud AI', 'Ludo.ai'],
    docsHref: '/docs/playtest-loop',
  },

  // 2. Image Generation Pipeline
  {
    id: 'image-generation-pipeline',
    category: 'AI',
    title: 'Concept art to Roblox in one click',
    description:
      'Type a prompt, get a stylized concept image, and watch it turn into a playable Roblox scene — all without leaving the editor.',
    date: '2026-04-02',
    badge: 'New',
    icon: 'Image',
    details: [
      'Text-to-image powered by Fal.ai Flux Pro tuned for Roblox aesthetics',
      'Generated images feed directly into our Image-to-Map pipeline',
      'Style presets for low-poly, voxel, realistic, and anime looks',
      'Every image is saved to your asset library for reuse',
    ],
    inspiredBy: ['Midjourney', 'Sora'],
    docsHref: '/docs/image-generation',
  },

  // 3. Free Prompt Enhancement API
  {
    id: 'prompt-enhancement',
    category: 'AI',
    title: 'Better prompts. For free. Forever.',
    description:
      'Turn a rough idea into a detailed build instruction with one click. Prompt enhancement is completely free — it does not burn a single token from your balance.',
    date: '2026-04-02',
    badge: 'New',
    icon: 'Wand2',
    details: [
      'Expands a three-word idea into a full multi-step build plan',
      'Learns from your past builds to match your creative style',
      'Runs on a dedicated free-tier model — zero cost to every user',
      'Toggle on or off in the chat panel whenever you want full control',
    ],
    docsHref: '/docs/prompt-enhance',
  },

  // 4. Site Bug Fixes
  {
    id: 'site-polish',
    category: 'Editor',
    title: 'Hundreds of tiny papercuts — gone',
    description:
      'We spent a week hunting down every glitch, alignment bug, and flash-of-unstyled-content across the site. Everything feels noticeably snappier and calmer.',
    date: '2026-04-03',
    badge: 'Improved',
    icon: 'Sparkles',
    details: [
      'Fixed layout shift on first load across marketing pages',
      'Corrected focus outlines on every interactive element for accessibility',
      'Smoother page transitions and nav animations',
      'Improved dark-mode contrast for readability under fluorescent light',
    ],
  },

  // 5. Canvas Editor
  {
    id: 'canvas-editor',
    category: 'Editor',
    title: 'Draw your game into existence',
    description:
      'Sketch a layout on a freeform canvas and ForjeGames will build it as a real Roblox scene. Rooms, terrain, obstacles — whatever you can doodle.',
    date: '2026-04-03',
    badge: 'New',
    icon: 'PenTool',
    details: [
      'Infinite zoomable canvas with pen, shapes, and annotation tools',
      'Label areas ("lava", "boss room") and AI respects your intent',
      'Real-time preview of the generated scene as you draw',
      'Export your sketch as PNG to share or document your design',
    ],
    inspiredBy: ['tldraw', 'Excalidraw'],
    docsHref: '/docs/canvas-editor',
  },

  // 6. Studio Controller MCP
  {
    id: 'studio-mcp',
    category: 'Plugin',
    title: 'Claude takes the wheel of Roblox Studio',
    description:
      'Our Studio Controller lets AI agents directly manipulate your place — creating parts, wiring up scripts, and running tests without you clicking a single button.',
    date: '2026-04-04',
    badge: 'New',
    icon: 'Cpu',
    details: [
      '200+ Studio operations exposed over the Model Context Protocol',
      'Mass-create, tag, and property-edit instances at Studio native speed',
      'Safe sandbox mode that only edits what you explicitly approve',
      'Works with any MCP-aware AI, including Claude Code and Cursor',
    ],
    inspiredBy: ['Model Context Protocol', 'Cursor Composer'],
    docsHref: '/docs/mcp',
  },

  // 7. WebSocket Streaming
  {
    id: 'websocket-streaming',
    category: 'Real-time',
    title: 'Zero-lag streaming between editor and Studio',
    description:
      'Every build, edit, and playtest now flows over a persistent WebSocket. Round-trip latency dropped from 400ms to under 30ms.',
    date: '2026-04-04',
    badge: 'Improved',
    icon: 'Zap',
    details: [
      'Replaces long-polling with a single always-on connection',
      'Live token streaming for AI responses — see code as it is written',
      'Automatic reconnect with exponential backoff on flaky networks',
      'Powers the new live cursor presence feature for team editing',
    ],
    docsHref: '/docs/realtime',
  },

  // 8. Cloud Session Persistence
  {
    id: 'cloud-sessions',
    category: 'Real-time',
    title: 'Never lose a build again',
    description:
      'Your entire editor state — chat history, checkpoints, open panels — now syncs to the cloud and follows you across devices.',
    date: '2026-04-04',
    badge: 'New',
    icon: 'Cloud',
    details: [
      'Pick up where you left off on a new laptop in under two seconds',
      'Browser crash recovery with zero data loss',
      'Session sharing for collaborative debug sessions',
      'End-to-end encrypted and automatically pruned after 90 days',
    ],
    docsHref: '/docs/cloud-sessions',
  },

  // 9. Completion Sound + Clipboard Paste
  {
    id: 'completion-sound',
    category: 'Editor',
    title: 'A little "ding" when your build is done',
    description:
      'A satisfying chime the moment your AI build completes, plus paste any image from your clipboard straight into the prompt box.',
    date: '2026-04-05',
    badge: 'New',
    icon: 'Bell',
    details: [
      'Configurable completion sound — pick from 4 tones or mute entirely',
      'Ctrl+V any screenshot or image directly into the AI chat',
      'Tab-away and still get notified the instant your game is ready',
      'Tiny quality-of-life touches, huge productivity difference',
    ],
  },

  // 10. Security Audit
  {
    id: 'security-audit',
    category: 'Security',
    title: 'Zero known vulnerabilities',
    description:
      'We ran a full security audit across the codebase, supply chain, and infrastructure. Every finding was triaged and every critical was fixed.',
    date: '2026-04-05',
    badge: 'Security',
    icon: 'ShieldCheck',
    details: [
      'Independent audit of authentication, billing, and webhook handlers',
      'Supply-chain scan with Socket.dev on every dependency',
      'Content Security Policy tightened to strict-dynamic nonces',
      'Published security policy and coordinated disclosure program',
    ],
    docsHref: '/docs/security',
  },

  // 11. Pipeline Strengthening
  {
    id: 'pipeline-hardening',
    category: 'Security',
    title: 'Builds that always succeed',
    description:
      'Our AI generation pipeline is now redundant, resumable, and crash-proof. If a model stumbles, we reroute and retry — you never see the failure.',
    date: '2026-04-05',
    badge: 'Improved',
    icon: 'GitBranch',
    details: [
      'Automatic failover across Claude, GPT, and Gemini model providers',
      'Resumable multi-step jobs that survive server restarts',
      'Per-stage cost tracking so you know exactly where tokens go',
      'Build success rate jumped from 91% to 99.4% in one week',
    ],
  },

  // 12. Plugin loadstring Fix
  {
    id: 'plugin-loadstring-fix',
    category: 'Plugin',
    title: 'The Roblox Studio plugin just works',
    description:
      'We squashed a long-standing loadstring compatibility issue that affected users on certain Studio builds. The plugin now runs flawlessly on every version.',
    date: '2026-04-06',
    badge: 'Improved',
    icon: 'Plug',
    details: [
      'Rewrote the code-execution bridge to avoid loadstring entirely',
      'Compatible with Roblox Studio 2023.1 through today',
      'Faster cold-start when the plugin first initializes',
      'Clearer error messages when Studio is offline or sandboxed',
    ],
  },

  // 13. Robux Payments
  {
    id: 'robux-payments',
    category: 'Payments',
    title: 'Pay with Robux',
    description:
      'Your Roblox earnings can now fund your ForjeGames subscription. Turn the Robux you made on your last game into the AI that builds your next one.',
    date: '2026-04-06',
    badge: 'New',
    icon: 'Coins',
    details: [
      'Spend Robux directly — no DevEx conversion required',
      'Works on every plan from Pro to Team',
      'Transparent exchange rate published in your billing dashboard',
      'Full support for gift subscriptions paid in Robux',
    ],
    inspiredBy: ['Roblox Developer Exchange'],
    docsHref: '/docs/billing/robux',
  },

  // 14. Admin Dashboard
  {
    id: 'admin-dashboard',
    category: 'Editor',
    title: 'A command center for your studio',
    description:
      'See every build, every dollar, and every teammate at a glance. The new admin dashboard gives team owners full visibility with zero effort.',
    date: '2026-04-06',
    badge: 'New',
    icon: 'LayoutDashboard',
    details: [
      'Real-time cost and token consumption per team member',
      'Abuse and anomaly detection with one-click ban',
      'Export CSV reports for finance and investor updates',
      'Audit log of every AI action taken on your account',
    ],
    docsHref: '/docs/admin',
  },

  // 15. Checkpoint/Restore
  {
    id: 'checkpoints',
    category: 'Editor',
    title: 'Infinite undo across every build',
    description:
      'Every build is automatically checkpointed. Roll back to any previous version of your game with a single click — even if it was days ago.',
    date: '2026-04-07',
    badge: 'New',
    icon: 'History',
    details: [
      'Visual timeline of every build your AI has ever made',
      'One-click restore with side-by-side diff preview',
      'Branch from any checkpoint to explore alternate directions',
      'Up to 500 checkpoints kept per project on Studio plans',
    ],
    inspiredBy: ['Git', 'Figma Version History'],
    docsHref: '/docs/checkpoints',
  },

  // 16. Notifications + Referrals
  {
    id: 'notifications-referrals',
    category: 'Growth',
    title: 'Know the instant your game is ready',
    description:
      'Web push notifications deliver build alerts the moment they finish — even when ForjeGames is closed — plus a referral program that pays you in tokens.',
    date: '2026-04-07',
    badge: 'New',
    icon: 'BellRing',
    details: [
      'Real web push notifications on desktop and mobile',
      'Customize which events alert you: builds, deploys, earnings, team mentions',
      'Invite a friend, earn 10,000 tokens each when they subscribe',
      'Leaderboard for top referrers with bonus prizes every month',
    ],
    docsHref: '/docs/referrals',
  },

  // 17. OpenAI GPT Support
  {
    id: 'openai-support',
    category: 'AI',
    title: 'GPT-5 and Claude, side by side',
    description:
      'Pick the best brain for the job. ForjeGames now supports every major OpenAI model alongside Claude, with automatic failover when one provider has a hiccup.',
    date: '2026-04-07',
    badge: 'New',
    icon: 'Brain',
    details: [
      'Switch between Claude Opus, Claude Sonnet, and GPT-5 on every prompt',
      'Automatic routing picks the best model for your specific task',
      'Transparent pricing — see exactly what each model costs per run',
      'Bring-your-own-key option for enterprise customers',
    ],
    docsHref: '/docs/models',
  },

  // 18. PostHog Feature Flags
  {
    id: 'feature-flags',
    category: 'Growth',
    title: 'Ship features to a few, then everyone',
    description:
      'We can now roll out experimental features to a small slice of users, measure the impact, and promote the winners. You benefit from faster, safer releases.',
    date: '2026-04-07',
    badge: 'Improved',
    icon: 'Flag',
    details: [
      'Gradual rollouts of risky new features with instant rollback',
      'A/B tests for pricing, onboarding, and editor UX',
      'Opt in to the beta feature pool from your settings',
      'Runs privacy-respecting — no tracking for under-13 accounts',
    ],
  },

  // 19. Roblox Account Linking
  {
    id: 'roblox-account-link',
    category: 'Plugin',
    title: 'Sign in with your Roblox account',
    description:
      'Link your Roblox account to ForjeGames in seconds. Your games, avatar, and verified creator status sync instantly across both platforms.',
    date: '2026-04-08',
    badge: 'New',
    icon: 'UserCheck',
    details: [
      'Official OAuth-style link via Roblox Open Cloud',
      'Pull your existing places into ForjeGames with one click',
      'Badges on your profile for verified creators and DevEx earners',
      'Required for publishing directly to the Roblox Creator Store',
    ],
    docsHref: '/docs/account-linking',
  },

  // 20. Community Gallery Social
  {
    id: 'community-gallery',
    category: 'Marketplace',
    title: 'A feed of incredible games built by the community',
    description:
      'Every published build joins a browsable gallery. Follow your favorite creators, remix their games, and share your own in one click.',
    date: '2026-04-08',
    badge: 'New',
    icon: 'Users',
    details: [
      'Browse, like, and comment on every shared ForjeGames build',
      'Remix any public game as a starting point for your own',
      'Follow creators and get notified of their new drops',
      'Curated "Staff Picks" row refreshed every week',
    ],
    inspiredBy: ['CodePen', 'Replit Community'],
    docsHref: '/docs/community',
  },

  // 21. COPPA PostHog Lazy-Load
  {
    id: 'coppa-safe-analytics',
    category: 'Security',
    title: 'Safer for kids by default',
    description:
      'Analytics now lazy-load and are fully disabled for anyone under 13. Young creators get a cleaner, lighter, and completely tracker-free experience.',
    date: '2026-04-08',
    badge: 'Security',
    icon: 'ShieldAlert',
    details: [
      'Analytics scripts only load after confirmed adult consent',
      'Zero third-party trackers for under-13 accounts',
      'Lighter initial page weight for every user under the age gate',
      'Full COPPA audit trail for schools and parents',
    ],
  },

  // 22. Pixelmatch Visual Regression
  {
    id: 'visual-regression',
    category: 'Editor',
    title: 'Pixel-perfect regression detection',
    description:
      'Every pull request now runs through a visual regression checker. If a UI change causes a single unintended pixel to shift, we catch it before it ships.',
    date: '2026-04-08',
    badge: 'Improved',
    icon: 'Eye',
    details: [
      'Pixelmatch diffing across every screenshot in our test suite',
      'Flags layout, color, and spacing drift automatically',
      'Keeps the editor visually consistent across every release',
      'Reduces "it broke in production" moments to near zero',
    ],
  },

  // 23. Production Clerk Setup
  {
    id: 'clerk-production',
    category: 'Security',
    title: 'Enterprise-grade authentication',
    description:
      'Authentication is now running on production Clerk infrastructure with hardened session policies, brute-force protection, and instant revocation.',
    date: '2026-04-08',
    badge: 'Security',
    icon: 'Lock',
    details: [
      'SOC 2 Type II certified identity provider under the hood',
      'Device trust and session revocation from a single dashboard',
      'Magic links, passkeys, SSO, and MFA all supported',
      'Up to 99.99% authentication uptime SLA',
    ],
    docsHref: '/docs/auth',
  },

  // 24. i18n Multi-Language
  {
    id: 'i18n',
    category: 'Marketing',
    title: 'Speak your language',
    description:
      'ForjeGames now supports 10 languages out of the box. Every page, every prompt, every docs article translates instantly based on your browser preference.',
    date: '2026-04-09',
    badge: 'New',
    icon: 'Languages',
    details: [
      'Launched in English, Spanish, Portuguese, French, German, Japanese, Korean, Simplified Chinese, Turkish, and Russian',
      'AI responses automatically match your interface language',
      'Locale-aware pricing and currency display',
      'Community translation program for regional dialects coming soon',
    ],
    docsHref: '/docs/i18n',
  },

  // 25. Marketing Showcase Content
  {
    id: 'marketing-showcase',
    category: 'Marketing',
    title: 'A gallery of what ForjeGames can really do',
    description:
      'We filled the marketing site with real games, real screenshots, and real videos. See exactly what is possible before you spend a token.',
    date: '2026-04-09',
    badge: 'New',
    icon: 'Film',
    details: [
      '30+ showcase games with playable previews',
      'Interactive hero with animated screenshot tabs',
      'Testimonials from early access creators and studios',
      'Updated pricing comparison against every competitor',
    ],
    docsHref: '/showcase',
  },

  // 26. Mobile Responsive Editor
  {
    id: 'mobile-editor',
    category: 'Editor',
    title: 'Build games from your phone',
    description:
      'The full ForjeGames editor now works beautifully on mobile. Prompt, preview, and publish from a bus, a bed, or a beach.',
    date: '2026-04-09',
    badge: 'New',
    icon: 'Smartphone',
    details: [
      'Touch-optimized chat, viewport, and properties panels',
      'Bottom-sheet navigation that feels native',
      'Voice input for hands-free prompting on the go',
      'Full feature parity with the desktop editor',
    ],
    docsHref: '/docs/mobile',
  },

  // 27. Beta Program + Invite Codes
  {
    id: 'beta-program',
    category: 'Growth',
    title: 'Get early access to everything',
    description:
      'Join the ForjeGames Beta Program for first-look access to experimental features, monthly creator calls, and shareable invite codes for your friends.',
    date: '2026-04-09',
    badge: 'New',
    icon: 'Ticket',
    details: [
      'Opt in with a single click from your settings page',
      'Shareable invite codes for early access to new features',
      'Private Discord channel with the ForjeGames core team',
      'Influence the roadmap with weekly feature votes',
    ],
    docsHref: '/beta',
  },

  // 28. Documentation Site
  {
    id: 'docs-site',
    category: 'Marketing',
    title: 'Docs that actually help you ship',
    description:
      'A brand new documentation site with searchable guides, runnable examples, and integrated AI assistance. Every question has an answer two clicks away.',
    date: '2026-04-09',
    badge: 'New',
    icon: 'BookOpen',
    details: [
      'Full-text search across 200+ guides and API references',
      'Copy-paste code blocks with language-aware syntax highlighting',
      '"Ask ForjeGames" button on every page for AI-assisted answers',
      'Community contributions via public GitHub mirror',
    ],
    docsHref: '/docs',
  },
]

export const COMING_SOON: Array<{
  title: string
  description: string
  icon: string
  eta: string
}> = [
  {
    title: 'Live multiplayer editing',
    description:
      'Edit the same game with your team in real time, cursor-to-cursor, just like a Figma file.',
    icon: 'Users',
    eta: 'May 2026',
  },
  {
    title: 'One-click publish to Roblox',
    description:
      'Push a finished build straight to the Creator Store without opening Studio.',
    icon: 'Rocket',
    eta: 'May 2026',
  },
  {
    title: 'Voice cloning NPCs',
    description:
      'Give every NPC in your game a unique AI voice in under a minute.',
    icon: 'Mic',
    eta: 'June 2026',
  },
  {
    title: 'AI-generated cutscenes',
    description:
      'Describe a cinematic and ForjeGames animates it with camera work and dialogue.',
    icon: 'Clapperboard',
    eta: 'June 2026',
  },
]

export function groupByCategory(entries: ChangelogEntry[]): Record<ChangelogCategory, ChangelogEntry[]> {
  const groups = {} as Record<ChangelogCategory, ChangelogEntry[]>
  for (const entry of entries) {
    if (!groups[entry.category]) groups[entry.category] = []
    groups[entry.category].push(entry)
  }
  return groups
}

export function countByCategory(entries: ChangelogEntry[]): Record<ChangelogCategory | 'All', number> {
  const counts = { All: entries.length } as Record<ChangelogCategory | 'All', number>
  for (const entry of entries) {
    counts[entry.category] = (counts[entry.category] || 0) + 1
  }
  return counts
}

export function formatChangelogDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}
