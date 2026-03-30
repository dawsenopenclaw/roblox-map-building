/**
 * Agent registry — 50+ specialized agent definitions for the ForjeGames orchestration system.
 *
 * Design rules:
 *  - Pure data module: no API calls, no side effects at import time
 *  - costPerCall is the *estimated* platform token spend (not Anthropic raw tokens)
 *  - model reflects the minimum capability tier required for the task
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export type AgentModel = 'claude-opus' | 'claude-sonnet' | 'claude-haiku'
export type AgentCategory = 'build' | 'analyze' | 'optimize' | 'research' | 'business' | 'growth'

export interface AgentDef {
  id: string
  name: string
  description: string
  /** Keywords that help the router match this agent to a user request */
  capabilities: string[]
  model: AgentModel
  /** Estimated ForjeGames platform token cost for a single call */
  costPerCall: number
  category: AgentCategory
  /** If true, this agent can accept the output of another agent as its input */
  chainable: boolean
  /** Agent IDs this agent typically hands off to after completing its task */
  defaultChain?: string[]
  /** Minimum subscription tier required to use this agent */
  minTier: 'FREE' | 'HOBBY' | 'CREATOR' | 'STUDIO'
}

// ─── Registry data ────────────────────────────────────────────────────────────

const REGISTRY: AgentDef[] = [
  // ─── BUILD (15) ─────────────────────────────────────────────────────────────

  {
    id: 'terrain-gen',
    name: 'Terrain Generator',
    description: 'Generates Roblox terrain from text descriptions: biomes, mountains, rivers, lakes, and custom heightmaps using Terrain:FillBlock/FillBall APIs.',
    capabilities: ['terrain', 'biome', 'landscape', 'heightmap', 'mountain', 'river', 'lake', 'forest', 'desert', 'snow', 'grass', 'water', 'valley', 'hill', 'flatten', 'raise'],
    model: 'claude-sonnet',
    costPerCall: 45,
    category: 'build',
    chainable: true,
    defaultChain: ['asset-placer', 'lighting-expert'],
    minTier: 'FREE',
  },
  {
    id: 'city-builder',
    name: 'City Builder',
    description: 'Designs and scripts entire city districts: road grids, building placement, zoning rules, pedestrian paths, and district theming for tycoons and simulators.',
    capabilities: ['city', 'building', 'district', 'road', 'street', 'urban', 'town', 'shop', 'house', 'skyscraper', 'plaza', 'park', 'residential', 'commercial'],
    model: 'claude-sonnet',
    costPerCall: 80,
    category: 'build',
    chainable: true,
    defaultChain: ['npc-creator', 'lighting-expert'],
    minTier: 'HOBBY',
  },
  {
    id: 'npc-creator',
    name: 'NPC Creator',
    description: 'Creates fully-scripted NPCs with patrol AI, dialogue trees, quest-giving, shopkeeper behaviour, and idle animations. Outputs server Luau scripts.',
    capabilities: ['npc', 'character', 'enemy', 'guard', 'villager', 'merchant', 'mob', 'ai', 'patrol', 'dialogue', 'shopkeeper', 'quest giver', 'spawn'],
    model: 'claude-sonnet',
    costPerCall: 60,
    category: 'build',
    chainable: true,
    defaultChain: ['script-writer'],
    minTier: 'FREE',
  },
  {
    id: 'script-writer',
    name: 'Luau Script Writer',
    description: 'Writes production-quality Luau scripts: ServerScripts, LocalScripts, ModuleScripts. Follows security best practices — server authority, no client trust, pcall wrapping.',
    capabilities: ['script', 'luau', 'code', 'function', 'module', 'server', 'client', 'remoteEvent', 'remoteFunction', 'datastore', 'profilestore', 'bindableEvent', 'coroutine', 'task'],
    model: 'claude-sonnet',
    costPerCall: 50,
    category: 'build',
    chainable: true,
    defaultChain: ['code-reviewer'],
    minTier: 'FREE',
  },
  {
    id: 'ui-designer',
    name: 'UI Designer',
    description: 'Builds Roblox ScreenGuis, BillboardGuis, and SurfaceGuis with full Luau scripts. Specialises in HUDs, shops, inventories, and leaderboards.',
    capabilities: ['ui', 'gui', 'hud', 'menu', 'screen', 'button', 'inventory', 'leaderboard', 'shop', 'dialog', 'frame', 'textlabel', 'imagelabel', 'tween', 'animation'],
    model: 'claude-sonnet',
    costPerCall: 55,
    category: 'build',
    chainable: true,
    defaultChain: ['script-writer'],
    minTier: 'FREE',
  },
  {
    id: 'lighting-expert',
    name: 'Lighting Expert',
    description: 'Configures Roblox Lighting service: Atmosphere, Bloom, ColorCorrection, SunRaysEffect, DepthOfField, and ShadowMap for cinematic looks.',
    capabilities: ['lighting', 'atmosphere', 'fog', 'sky', 'bloom', 'glow', 'ambient', 'shadow', 'sunrise', 'sunset', 'night', 'dusk', 'dawn', 'post processing', 'colorgrading'],
    model: 'claude-haiku',
    costPerCall: 20,
    category: 'build',
    chainable: true,
    defaultChain: [],
    minTier: 'FREE',
  },
  {
    id: 'audio-placer',
    name: 'Audio Placer',
    description: 'Places and configures Sound objects, ambient audio zones, music playlists, and spatial audio for immersive worlds.',
    capabilities: ['sound', 'music', 'audio', 'sfx', 'ambient', 'playlist', 'spatial', 'reverb', 'equalize', 'volume', 'looping'],
    model: 'claude-haiku',
    costPerCall: 15,
    category: 'build',
    chainable: false,
    minTier: 'FREE',
  },
  {
    id: 'particle-fx',
    name: 'Particle FX Artist',
    description: 'Creates ParticleEmitter, Trail, Beam, and SpecialMesh effects for spells, explosions, weather, and environmental ambience.',
    capabilities: ['particle', 'fire', 'smoke', 'sparkle', 'trail', 'beam', 'explosion', 'magic', 'weather', 'rain', 'snow', 'dust', 'glow', 'aura', 'vfx'],
    model: 'claude-haiku',
    costPerCall: 25,
    category: 'build',
    chainable: true,
    defaultChain: [],
    minTier: 'FREE',
  },
  {
    id: 'vehicle-builder',
    name: 'Vehicle Builder',
    description: 'Builds driveable vehicles using VehicleSeat, BodyMover, and constraint-based physics. Covers cars, boats, planes, and karts.',
    capabilities: ['vehicle', 'car', 'truck', 'boat', 'plane', 'kart', 'drive', 'seat', 'physics', 'bodyvelocity', 'constraint', 'wheel', 'engine'],
    model: 'claude-sonnet',
    costPerCall: 70,
    category: 'build',
    chainable: true,
    defaultChain: ['script-writer'],
    minTier: 'HOBBY',
  },
  {
    id: 'weapon-smith',
    name: 'Weapon Smith',
    description: 'Creates weapons with full tool scripts: swords, guns, staffs. Handles hitbox detection, damage, cooldowns, and visual feedback.',
    capabilities: ['weapon', 'sword', 'gun', 'tool', 'melee', 'ranged', 'hitbox', 'damage', 'attack', 'projectile', 'cooldown', 'combat'],
    model: 'claude-sonnet',
    costPerCall: 65,
    category: 'build',
    chainable: true,
    defaultChain: ['combat-system'],
    minTier: 'HOBBY',
  },
  {
    id: 'economy-designer',
    name: 'Economy Designer',
    description: 'Designs in-game economies: currency sinks, reward curves, shop pricing, daily rewards, and pass monetization that keeps players engaged without predatory loops.',
    capabilities: ['economy', 'currency', 'shop', 'price', 'reward', 'token', 'pass', 'gamepass', 'monetization', 'sink', 'inflation', 'store', 'daily'],
    model: 'claude-sonnet',
    costPerCall: 55,
    category: 'build',
    chainable: true,
    defaultChain: ['script-writer'],
    minTier: 'CREATOR',
  },
  {
    id: 'quest-writer',
    name: 'Quest Writer',
    description: 'Writes quest chains with objectives, branching dialogue, reward tables, and tracker UI. Outputs modular quest data tables and handler scripts.',
    capabilities: ['quest', 'mission', 'objective', 'story', 'task', 'reward', 'dialogue', 'npc', 'narrative', 'chain', 'tracker', 'progression'],
    model: 'claude-sonnet',
    costPerCall: 50,
    category: 'build',
    chainable: true,
    defaultChain: ['npc-creator', 'ui-designer'],
    minTier: 'HOBBY',
  },
  {
    id: 'combat-system',
    name: 'Combat System Builder',
    description: 'Builds full combat systems: server-authoritative hit detection, combo inputs, status effects, health bars, knockback, and anti-cheat guards.',
    capabilities: ['combat', 'pvp', 'fight', 'hitbox', 'combo', 'status', 'stun', 'knockback', 'health', 'shield', 'dodge', 'block', 'anti-cheat'],
    model: 'claude-sonnet',
    costPerCall: 90,
    category: 'build',
    chainable: true,
    defaultChain: ['script-writer', 'code-reviewer'],
    minTier: 'CREATOR',
  },
  {
    id: 'mesh-generator',
    name: 'Mesh Generator',
    description: 'Generates optimised 3D mesh descriptions and Meshy.ai prompts for custom props, characters, and environment pieces.',
    capabilities: ['mesh', '3d', 'model', 'prop', 'asset', 'obj', 'fbx', 'lowpoly', 'character', 'creature', 'environment', 'meshy'],
    model: 'claude-haiku',
    costPerCall: 30,
    category: 'build',
    chainable: false,
    minTier: 'CREATOR',
  },
  {
    id: 'texture-artist',
    name: 'Texture Artist',
    description: 'Generates Fal.ai texture prompts for PBR materials: albedo, normal, roughness, and metallic maps for any surface type.',
    capabilities: ['texture', 'material', 'pbr', 'surface', 'paint', 'skin', 'fabric', 'metal', 'wood', 'stone', 'fal', 'diffuse', 'normal map'],
    model: 'claude-haiku',
    costPerCall: 25,
    category: 'build',
    chainable: false,
    minTier: 'CREATOR',
  },

  // ─── ANALYZE (10) ───────────────────────────────────────────────────────────

  {
    id: 'game-dna-scanner',
    name: 'Game DNA Scanner',
    description: 'Deep-analyzes a competitor Roblox game by ID: extracts mechanics, monetization loops, player progression, retention hooks, and genre conventions.',
    capabilities: ['analyze', 'competitor', 'game', 'scan', 'reverse engineer', 'monetization', 'progression', 'retention', 'mechanic', 'loop'],
    model: 'claude-sonnet',
    costPerCall: 100,
    category: 'analyze',
    chainable: true,
    defaultChain: ['feature-predictor'],
    minTier: 'CREATOR',
  },
  {
    id: 'performance-auditor',
    name: 'Performance Auditor',
    description: 'Audits Luau scripts and build configurations for performance issues: part count, runservice loops, memory leaks, instance pooling gaps, and mobile frame-rate risks.',
    capabilities: ['performance', 'fps', 'lag', 'memory', 'optimize', 'part count', 'runservice', 'heartbeat', 'renderstepped', 'mobile', 'instance'],
    model: 'claude-sonnet',
    costPerCall: 45,
    category: 'analyze',
    chainable: true,
    defaultChain: ['cost-reducer'],
    minTier: 'FREE',
  },
  {
    id: 'code-reviewer',
    name: 'Code Reviewer',
    description: 'Reviews Luau code for security vulnerabilities, logic bugs, deprecated APIs, and style issues. Flags client-trust violations and missing pcall wrappers.',
    capabilities: ['review', 'security', 'bug', 'vulnerability', 'deprecated', 'pcall', 'server authority', 'remote event', 'sanitize', 'validate'],
    model: 'claude-sonnet',
    costPerCall: 40,
    category: 'analyze',
    chainable: false,
    minTier: 'FREE',
  },
  {
    id: 'security-checker',
    name: 'Security Checker',
    description: 'Identifies exploitable remote handlers, missing server-side validation, DataStore key injection risks, and anti-cheat gaps.',
    capabilities: ['security', 'exploit', 'remote', 'validation', 'datastore', 'cheat', 'injection', 'sanitize', 'fireremote', 'trust'],
    model: 'claude-sonnet',
    costPerCall: 50,
    category: 'analyze',
    chainable: false,
    minTier: 'HOBBY',
  },
  {
    id: 'accessibility-auditor',
    name: 'Accessibility Auditor',
    description: 'Reviews UI contrast ratios, text sizes, colorblind modes, screen reader labels, and mobile touch target sizing against WCAG-adapted Roblox guidelines.',
    capabilities: ['accessibility', 'contrast', 'colorblind', 'font size', 'mobile', 'touch target', 'screen reader', 'a11y', 'wcag'],
    model: 'claude-haiku',
    costPerCall: 20,
    category: 'analyze',
    chainable: false,
    minTier: 'FREE',
  },
  {
    id: 'seo-optimizer',
    name: 'SEO Optimizer',
    description: 'Optimizes Roblox game metadata: title, description, tags, genre, and thumbnail guidance to maximise organic discovery on the Roblox search and discovery feeds.',
    capabilities: ['seo', 'search', 'discovery', 'metadata', 'title', 'description', 'tag', 'thumbnail', 'genre', 'ranking', 'impression'],
    model: 'claude-haiku',
    costPerCall: 20,
    category: 'analyze',
    chainable: false,
    minTier: 'FREE',
  },
  {
    id: 'ux-analyzer',
    name: 'UX Analyzer',
    description: 'Evaluates onboarding flow, first-session experience, tutorial clarity, UI hierarchy, and player frustration points.',
    capabilities: ['ux', 'onboarding', 'tutorial', 'friction', 'first session', 'flow', 'user experience', 'clarity', 'confusion', 'drop-off'],
    model: 'claude-sonnet',
    costPerCall: 40,
    category: 'analyze',
    chainable: true,
    defaultChain: ['onboarding-optimizer'],
    minTier: 'HOBBY',
  },
  {
    id: 'monetization-advisor',
    name: 'Monetization Advisor',
    description: 'Advises on Roblox monetization: gamepass placement, Developer Product timing, VIP server pricing, bundle strategies, and ethical spend triggers for the 8-16 demographic.',
    capabilities: ['monetization', 'gamepass', 'developer product', 'robux', 'vip', 'bundle', 'upsell', 'revenue', 'conversion', 'arpu', 'ltv'],
    model: 'claude-sonnet',
    costPerCall: 60,
    category: 'analyze',
    chainable: false,
    minTier: 'CREATOR',
  },
  {
    id: 'player-behavior',
    name: 'Player Behavior Analyst',
    description: 'Interprets playtime data, session lengths, quit points, and feature engagement to produce actionable design recommendations.',
    capabilities: ['player', 'behavior', 'engagement', 'retention', 'session', 'playtime', 'analytics', 'churn', 'dau', 'mau', 'cohort'],
    model: 'claude-sonnet',
    costPerCall: 50,
    category: 'analyze',
    chainable: true,
    defaultChain: ['feature-predictor'],
    minTier: 'STUDIO',
  },
  {
    id: 'competitor-scanner',
    name: 'Competitor Scanner',
    description: 'Surveys the top-100 Roblox games in a target genre, extracts common patterns, identifies gaps, and produces a feature differentiation matrix.',
    capabilities: ['competitor', 'market', 'genre', 'top games', 'benchmark', 'differentiation', 'gap', 'trend', 'landscape'],
    model: 'claude-haiku',
    costPerCall: 35,
    category: 'analyze',
    chainable: true,
    defaultChain: ['game-dna-scanner'],
    minTier: 'CREATOR',
  },

  // ─── OPTIMIZE (8) ───────────────────────────────────────────────────────────

  {
    id: 'prompt-optimizer',
    name: 'Prompt Optimizer',
    description: 'Rewrites user prompts for maximum AI output quality: adds context, specifies constraints, and injects domain keywords to reduce token waste.',
    capabilities: ['prompt', 'rewrite', 'improve', 'quality', 'output', 'rephrase', 'context', 'instruction'],
    model: 'claude-haiku',
    costPerCall: 10,
    category: 'optimize',
    chainable: true,
    defaultChain: [],
    minTier: 'FREE',
  },
  {
    id: 'cache-manager',
    name: 'Cache Manager',
    description: 'Identifies repeated agent calls that could be cached, manages Redis TTL strategy, and reports cache hit rates to reduce platform token burn.',
    capabilities: ['cache', 'redis', 'ttl', 'hit rate', 'dedup', 'memoize', 'repeat', 'token saving'],
    model: 'claude-haiku',
    costPerCall: 8,
    category: 'optimize',
    chainable: false,
    minTier: 'HOBBY',
  },
  {
    id: 'cost-reducer',
    name: 'Cost Reducer',
    description: 'Audits a forje session token spend, identifies over-priced agent calls, and recommends model downgrades or prompt compression strategies.',
    capabilities: ['cost', 'token', 'spend', 'reduce', 'budget', 'model', 'downgrade', 'compress', 'efficiency'],
    model: 'claude-haiku',
    costPerCall: 12,
    category: 'optimize',
    chainable: false,
    minTier: 'FREE',
  },
  {
    id: 'bundle-optimizer',
    name: 'Bundle Optimizer',
    description: 'Analyzes Next.js bundle sizes, flags heavy client-side imports, and suggests dynamic import strategies to hit LCP < 2s targets.',
    capabilities: ['bundle', 'next.js', 'webpack', 'import', 'dynamic', 'lcp', 'performance', 'chunk', 'tree shaking'],
    model: 'claude-haiku',
    costPerCall: 15,
    category: 'optimize',
    chainable: false,
    minTier: 'CREATOR',
  },
  {
    id: 'query-optimizer',
    name: 'Query Optimizer',
    description: 'Reviews Prisma queries for N+1 patterns, missing indexes, unbounded selects, and transaction size issues against the ForjeGames Postgres schema.',
    capabilities: ['query', 'prisma', 'database', 'n+1', 'index', 'slow', 'postgres', 'transaction', 'join', 'select'],
    model: 'claude-sonnet',
    costPerCall: 35,
    category: 'optimize',
    chainable: false,
    minTier: 'CREATOR',
  },
  {
    id: 'asset-compressor',
    name: 'Asset Compressor',
    description: 'Advises on Roblox asset optimisation: texture resolution targets, mesh polygon budgets, audio bitrate settings, and decal atlas strategies.',
    capabilities: ['asset', 'compress', 'texture', 'resolution', 'polygon', 'lod', 'atlas', 'bitrate', 'filesize', 'budget'],
    model: 'claude-haiku',
    costPerCall: 15,
    category: 'optimize',
    chainable: false,
    minTier: 'FREE',
  },
  {
    id: 'load-balancer',
    name: 'Load Balancer Advisor',
    description: 'Reviews server architecture for Roblox server capacity, TeleportService routing, cross-server messaging patterns, and MessagingService usage.',
    capabilities: ['load balancer', 'server', 'teleport', 'cross-server', 'messaging', 'capacity', 'shard', 'scale'],
    model: 'claude-sonnet',
    costPerCall: 40,
    category: 'optimize',
    chainable: false,
    minTier: 'STUDIO',
  },
  {
    id: 'cdn-optimizer',
    name: 'CDN Optimizer',
    description: 'Optimises Vercel Edge, Cloudflare CDN rules, image caching headers, and API response caching for ForjeGames.com.',
    capabilities: ['cdn', 'vercel', 'cloudflare', 'cache', 'edge', 'header', 'image', 'api response', 'ttl'],
    model: 'claude-haiku',
    costPerCall: 15,
    category: 'optimize',
    chainable: false,
    minTier: 'STUDIO',
  },

  // ─── RESEARCH (7) ───────────────────────────────────────────────────────────

  {
    id: 'trend-finder',
    name: 'Trend Finder',
    description: 'Identifies emerging Roblox game genres, mechanic trends, and seasonal content opportunities by parsing the Trending and Featured feeds.',
    capabilities: ['trend', 'emerging', 'genre', 'seasonal', 'viral', 'popular', 'up and coming', 'discovery', 'forecast'],
    model: 'claude-haiku',
    costPerCall: 25,
    category: 'research',
    chainable: true,
    defaultChain: ['competitor-scanner'],
    minTier: 'FREE',
  },
  {
    id: 'marketplace-scout',
    name: 'Marketplace Scout',
    description: 'Searches the Roblox asset marketplace for suitable models, plugins, audio, and decals matching a description, returning top 5 candidates with IDs and ratings.',
    capabilities: ['marketplace', 'asset', 'search', 'model', 'plugin', 'audio', 'decal', 'free', 'rbxm', 'id'],
    model: 'claude-haiku',
    costPerCall: 15,
    category: 'research',
    chainable: false,
    minTier: 'FREE',
  },
  {
    id: 'tutorial-creator',
    name: 'Tutorial Creator',
    description: 'Writes step-by-step tutorials for ForjeGames features and Roblox development topics in the platform voice: concise, numbered, code-included.',
    capabilities: ['tutorial', 'guide', 'how to', 'documentation', 'step by step', 'example', 'walkthrough'],
    model: 'claude-haiku',
    costPerCall: 20,
    category: 'research',
    chainable: false,
    minTier: 'FREE',
  },
  {
    id: 'doc-writer',
    name: 'Doc Writer',
    description: 'Generates API documentation, README files, JSDoc comments, and Luau module docstrings from existing code.',
    capabilities: ['documentation', 'api docs', 'readme', 'jsdoc', 'comment', 'docstring', 'reference', 'spec'],
    model: 'claude-haiku',
    costPerCall: 20,
    category: 'research',
    chainable: false,
    minTier: 'FREE',
  },
  {
    id: 'changelog-generator',
    name: 'Changelog Generator',
    description: 'Produces developer-friendly changelogs from git diffs and Prisma migration files.',
    capabilities: ['changelog', 'release notes', 'git', 'diff', 'migration', 'version', 'update'],
    model: 'claude-haiku',
    costPerCall: 12,
    category: 'research',
    chainable: false,
    minTier: 'FREE',
  },
  {
    id: 'feedback-analyzer',
    name: 'Feedback Analyzer',
    description: 'Summarises player feedback, support tickets, and Discord messages into categorised actionable insights with sentiment scores.',
    capabilities: ['feedback', 'review', 'sentiment', 'player', 'support', 'discord', 'community', 'complaint', 'request'],
    model: 'claude-haiku',
    costPerCall: 20,
    category: 'research',
    chainable: true,
    defaultChain: ['feature-predictor'],
    minTier: 'HOBBY',
  },
  {
    id: 'feature-predictor',
    name: 'Feature Predictor',
    description: 'Predicts the highest-ROI next features to build based on player behavior data, competitor gaps, and platform trends. Outputs a prioritised roadmap.',
    capabilities: ['feature', 'roadmap', 'priority', 'predict', 'roi', 'next', 'build', 'plan', 'backlog'],
    model: 'claude-sonnet',
    costPerCall: 45,
    category: 'research',
    chainable: false,
    minTier: 'CREATOR',
  },

  // ─── BUSINESS (5) ───────────────────────────────────────────────────────────

  {
    id: 'llc-connector',
    name: 'LLC Connector',
    description: 'Bridges ForjeGames with the Flip or Flop LLC City game: syncs virtual property listings, business simulations, and player economy data.',
    capabilities: ['llc', 'flip or flop', 'business', 'property', 'virtual', 'sync', 'connect', 'economy', 'simulation'],
    model: 'claude-sonnet',
    costPerCall: 60,
    category: 'business',
    chainable: false,
    minTier: 'STUDIO',
  },
  {
    id: 'stripe-manager',
    name: 'Stripe Manager',
    description: 'Handles Stripe subscription changes, one-off charges, webhook event interpretation, and refund workflows for ForjeGames billing.',
    capabilities: ['stripe', 'billing', 'subscription', 'invoice', 'refund', 'webhook', 'payment', 'checkout'],
    model: 'claude-sonnet',
    costPerCall: 40,
    category: 'business',
    chainable: false,
    minTier: 'STUDIO',
  },
  {
    id: 'team-provisioner',
    name: 'Team Provisioner',
    description: 'Sets up team workspaces: invites members, assigns roles, configures shared API keys, and provisions per-seat token allowances.',
    capabilities: ['team', 'workspace', 'invite', 'role', 'permission', 'member', 'provision', 'seat', 'collaboration'],
    model: 'claude-haiku',
    costPerCall: 15,
    category: 'business',
    chainable: false,
    minTier: 'STUDIO',
  },
  {
    id: 'white-label-builder',
    name: 'White Label Builder',
    description: 'Generates white-label builds of ForjeGames features for studio partners: custom branding, isolated environments, and API key scoping.',
    capabilities: ['white label', 'partner', 'branding', 'custom', 'resell', 'studio', 'api', 'scope'],
    model: 'claude-sonnet',
    costPerCall: 80,
    category: 'business',
    chainable: false,
    minTier: 'STUDIO',
  },
  {
    id: 'partner-api',
    name: 'Partner API Designer',
    description: 'Designs and documents REST or webhook APIs for third-party integrations, LLC partners, and studio white-label customers.',
    capabilities: ['api', 'rest', 'webhook', 'integration', 'partner', 'endpoint', 'schema', 'openapi', 'sdk'],
    model: 'claude-sonnet',
    costPerCall: 55,
    category: 'business',
    chainable: true,
    defaultChain: ['doc-writer'],
    minTier: 'STUDIO',
  },

  // ─── GROWTH (5) ─────────────────────────────────────────────────────────────

  {
    id: 'referral-engine',
    name: 'Referral Engine',
    description: 'Designs and tunes referral programs: reward amounts, viral coefficient targets, fraud prevention, and Stripe-connected referral payouts.',
    capabilities: ['referral', 'viral', 'invite', 'growth', 'reward', 'share', 'coefficient', 'fraud', 'affiliate'],
    model: 'claude-sonnet',
    costPerCall: 40,
    category: 'growth',
    chainable: false,
    minTier: 'CREATOR',
  },
  {
    id: 'email-campaigner',
    name: 'Email Campaigner',
    description: 'Writes and schedules React Email campaigns via Resend: onboarding drips, re-engagement sequences, and announcement blasts.',
    capabilities: ['email', 'campaign', 'drip', 'onboarding', 're-engagement', 'newsletter', 'resend', 'react email', 'sequence'],
    model: 'claude-haiku',
    costPerCall: 20,
    category: 'growth',
    chainable: false,
    minTier: 'HOBBY',
  },
  {
    id: 'social-poster',
    name: 'Social Poster',
    description: 'Generates platform-tuned social copy for Twitter/X, Discord announcements, and TikTok scripts for Roblox game updates.',
    capabilities: ['social', 'twitter', 'discord', 'tiktok', 'post', 'announcement', 'copy', 'marketing', 'community'],
    model: 'claude-haiku',
    costPerCall: 15,
    category: 'growth',
    chainable: false,
    minTier: 'FREE',
  },
  {
    id: 'community-manager',
    name: 'Community Manager',
    description: 'Drafts community update posts, patch notes, event announcements, and moderation responses tailored to Roblox\'s 8-16 audience.',
    capabilities: ['community', 'update', 'patch notes', 'event', 'moderation', 'post', 'roblox', 'devforum', 'discord'],
    model: 'claude-haiku',
    costPerCall: 15,
    category: 'growth',
    chainable: false,
    minTier: 'FREE',
  },
  {
    id: 'onboarding-optimizer',
    name: 'Onboarding Optimizer',
    description: 'Redesigns first-run experiences for ForjeGames users: cuts activation time-to-value, increases tutorial completion, and reduces early churn.',
    capabilities: ['onboarding', 'activation', 'time to value', 'tutorial', 'first run', 'wizard', 'churn', 'aha moment'],
    model: 'claude-sonnet',
    costPerCall: 45,
    category: 'growth',
    chainable: false,
    minTier: 'CREATOR',
  },
]

// ─── Lookup helpers ───────────────────────────────────────────────────────────

/** Returns a copy of the full registry — never mutate the returned array */
export function getAllAgents(): AgentDef[] {
  return [...REGISTRY]
}

/** Returns one agent by id, or undefined */
export function getAgent(id: string): AgentDef | undefined {
  return REGISTRY.find((a) => a.id === id)
}

/** Returns all agents in a specific category */
export function getAgentsByCategory(category: AgentCategory): AgentDef[] {
  return REGISTRY.filter((a) => a.category === category)
}

/**
 * Returns the Anthropic model string for a given AgentDef model tier.
 * Update these strings as new Claude releases land.
 */
export function resolveModelId(model: AgentModel): string {
  switch (model) {
    case 'claude-opus':
      return 'claude-opus-4-5'
    case 'claude-sonnet':
      return 'claude-sonnet-4-5'
    case 'claude-haiku':
      return 'claude-haiku-3-5'
  }
}

/** Estimated cost in platform tokens for a model tier + message length */
export function estimateCallCost(agentDef: AgentDef, promptChars: number): number {
  // Base cost from registry + 1 token per ~200 chars of user prompt (rough Luau/text ratio)
  const promptSurcharge = Math.ceil(promptChars / 200)
  return agentDef.costPerCall + promptSurcharge
}
