/**
 * game-dev-planner.ts — AI Game Development Partner
 *
 * When a user says "build me a tycoon game", instead of immediately generating,
 * the AI asks questions, understands the vision, creates a detailed game design
 * document, and THEN builds it phase by phase.
 *
 * Flow:
 * 1. User: "build me a tycoon game"
 * 2. AI: "What kind of tycoon? Factory? Restaurant? Theme park? What style?"
 * 3. User: "factory tycoon with conveyor belts"
 * 4. AI: "How many upgrade tiers? What currency? Any rebirth system?"
 * 5. User: "5 tiers, coins, yes rebirth"
 * 6. AI: [Creates GameDesignDoc] → shows plan for approval
 * 7. User: "build it"
 * 8. World planner + staged pipeline builds the entire game
 *
 * The key insight: PLANNING produces 10X better games than single-shot generation.
 */

import 'server-only'

// ─── Types ──────────────────────────────────────────────────────────────────

export interface GameDesignDoc {
  title: string
  genre: string
  subGenre: string
  description: string
  targetAudience: string
  style: 'vibrant' | 'fantasy' | 'scifi' | 'realistic' | 'candy' | 'neon' | 'medieval'

  // World
  zones: Array<{
    name: string
    purpose: string
    size: 'small' | 'medium' | 'large'
    features: string[]
  }>

  // Systems
  systems: Array<{
    name: string
    description: string
    priority: 'core' | 'important' | 'nice-to-have'
  }>

  // Monetization
  currency: { name: string; earnRate: string; spendOn: string[] }
  gamePasses: string[]
  devProducts: string[]

  // Player progression
  progression: {
    type: 'levels' | 'rebirth' | 'prestige' | 'tiers' | 'none'
    milestones: string[]
  }

  // UI needed
  uiScreens: string[]

  estimatedParts: number
  estimatedScriptLines: number
  buildPhases: string[]
}

export interface PlannerQuestion {
  id: string
  question: string
  options?: string[]
  type: 'choice' | 'text' | 'yesno'
  followUp?: Record<string, PlannerQuestion>
}

// ─── Question Trees Per Genre ───────────────────────────────────────────────

const GENRE_QUESTIONS: Record<string, PlannerQuestion[]> = {
  tycoon: [
    { id: 'subtype', question: 'What kind of tycoon? (factory, restaurant, theme park, mining, farm, military, hospital, school, custom)', type: 'text' },
    { id: 'currency', question: 'What should the main currency be called?', type: 'text', options: ['Coins', 'Cash', 'Gems', 'Bucks'] },
    { id: 'upgrades', question: 'How many upgrade tiers?', type: 'choice', options: ['3 (simple)', '5 (medium)', '10 (deep)', '20+ (extreme)'] },
    { id: 'rebirth', question: 'Include a rebirth/prestige system?', type: 'yesno' },
    { id: 'multiplayer', question: 'Should players see each other or have separate plots?', type: 'choice', options: ['Shared world', 'Separate plots', 'Both (visit others)'] },
  ],
  simulator: [
    { id: 'collectible', question: 'What do players collect? (gems, coins, pets, fish, bugs, orbs, custom)', type: 'text' },
    { id: 'pets', question: 'Include a pet system?', type: 'yesno' },
    { id: 'zones', question: 'How many zones/areas?', type: 'choice', options: ['3 (starter, mid, end)', '5 (with secrets)', '8+ (massive world)'] },
    { id: 'trading', question: 'Allow player trading?', type: 'yesno' },
    { id: 'rebirth', question: 'Include rebirth/prestige?', type: 'yesno' },
  ],
  rpg: [
    { id: 'setting', question: 'What setting? (medieval, sci-fi, anime, modern, post-apocalyptic, custom)', type: 'text' },
    { id: 'combat', question: 'Combat style?', type: 'choice', options: ['Melee (swords/axes)', 'Ranged (magic/guns)', 'Both', 'Turn-based', 'None (story only)'] },
    { id: 'classes', question: 'Include character classes? If yes, which?', type: 'text', options: ['Warrior/Mage/Archer', 'Custom classes', 'No classes'] },
    { id: 'quests', question: 'Quest system?', type: 'choice', options: ['Main story only', 'Main + side quests', 'Procedural/daily quests', 'All of the above'] },
    { id: 'bosses', question: 'Boss fights?', type: 'yesno' },
  ],
  obby: [
    { id: 'difficulty', question: 'Difficulty curve?', type: 'choice', options: ['Easy (kids)', 'Medium (casual)', 'Hard (challenge)', 'Extreme (rage game)'] },
    { id: 'stages', question: 'How many stages?', type: 'choice', options: ['5 (short)', '10 (medium)', '20 (long)', '50+ (mega obby)'] },
    { id: 'theme', question: 'Visual theme?', type: 'text', options: ['Rainbow/colorful', 'Space', 'Nature', 'Neon', 'Medieval', 'Custom'] },
    { id: 'rewards', question: 'Rewards for completing stages?', type: 'choice', options: ['Coins only', 'Coins + pets', 'Coins + skins + titles', 'Leaderboard only'] },
    { id: 'skipStage', question: 'Allow skipping stages (with Robux)?', type: 'yesno' },
  ],
  default: [
    { id: 'genre', question: 'What genre is your game? (tycoon, simulator, RPG, obby, horror, racing, fighting, social, custom)', type: 'text' },
    { id: 'players', question: 'How many players at once?', type: 'choice', options: ['1 (solo)', '2-4 (small group)', '10-20 (medium)', '50+ (large server)'] },
    { id: 'style', question: 'Visual style?', type: 'choice', options: ['Vibrant/colorful (like Pet Sim)', 'Fantasy/magical', 'Realistic', 'Neon/sci-fi', 'Cute/candy'] },
    { id: 'core', question: 'What\'s the CORE activity? What does the player DO most of the time?', type: 'text' },
  ],
}

// ─── Smart Question Detection ───────────────────────────────────────────────

/**
 * Detect the game genre from user's prompt and return relevant questions.
 */
export function getQuestionsForPrompt(prompt: string): { genre: string; questions: PlannerQuestion[]; answeredFromPrompt: Record<string, string> } {
  const lower = prompt.toLowerCase()
  let genre = 'default'
  const answered: Record<string, string> = {}

  if (/tycoon|factory|idle|millionaire|business/i.test(lower)) {
    genre = 'tycoon'
    // Extract answers from prompt
    if (/factory/i.test(lower)) answered.subtype = 'factory'
    if (/restaurant/i.test(lower)) answered.subtype = 'restaurant'
    if (/theme park/i.test(lower)) answered.subtype = 'theme park'
    if (/rebirth|prestige/i.test(lower)) answered.rebirth = 'yes'
  } else if (/simulator|sim|collect|pet/i.test(lower)) {
    genre = 'simulator'
    if (/pet/i.test(lower)) answered.pets = 'yes'
    if (/gem|coin|orb/i.test(lower)) answered.collectible = lower.match(/gem|coin|orb/i)?.[0] || 'gems'
  } else if (/rpg|quest|adventure|dungeon|fantasy/i.test(lower)) {
    genre = 'rpg'
    if (/medieval/i.test(lower)) answered.setting = 'medieval'
    if (/sci-?fi|space|futur/i.test(lower)) answered.setting = 'sci-fi'
    if (/anime/i.test(lower)) answered.setting = 'anime'
  } else if (/obby|obstacle|parkour|platformer/i.test(lower)) {
    genre = 'obby'
    if (/easy|kid/i.test(lower)) answered.difficulty = 'Easy (kids)'
    if (/hard|extreme|rage/i.test(lower)) answered.difficulty = 'Extreme (rage game)'
  }

  const questions = GENRE_QUESTIONS[genre] || GENRE_QUESTIONS.default
  // Filter out questions that were already answered from the prompt
  const unanswered = questions.filter(q => !answered[q.id])

  return { genre, questions: unanswered, answeredFromPrompt: answered }
}

/**
 * Format questions into a conversational AI response.
 */
export function formatQuestionsAsResponse(genre: string, questions: PlannerQuestion[], answeredFromPrompt: Record<string, string>): string {
  const genreDisplay = genre.charAt(0).toUpperCase() + genre.slice(1)

  let response = `I'd love to help you build a **${genreDisplay} game**! `

  if (Object.keys(answeredFromPrompt).length > 0) {
    response += `I picked up some details from your description:\n`
    for (const [key, val] of Object.entries(answeredFromPrompt)) {
      response += `- **${key}**: ${val}\n`
    }
    response += `\n`
  }

  response += `To build you the best possible game, I need to know a few more things:\n\n`

  for (let i = 0; i < Math.min(questions.length, 4); i++) {
    const q = questions[i]
    response += `**${i + 1}. ${q.question}**\n`
    if (q.options) {
      response += q.options.map(o => `   - ${o}`).join('\n') + '\n'
    }
    response += '\n'
  }

  response += `Just answer these and I'll create a full game plan for you to approve before I start building. Or say **"just build it"** and I'll use smart defaults!`

  return response
}

/**
 * Generate a complete game design document from user answers.
 */
export function generateDesignDoc(genre: string, answers: Record<string, string>, originalPrompt: string): GameDesignDoc {
  const title = `ForjeAI ${genre.charAt(0).toUpperCase() + genre.slice(1)} Game`

  // Default systems per genre
  const GENRE_SYSTEMS: Record<string, Array<{ name: string; description: string; priority: 'core' | 'important' | 'nice-to-have' }>> = {
    tycoon: [
      { name: 'Economy', description: 'Currency earning, spending, and display', priority: 'core' },
      { name: 'Dropper/Producer', description: 'Items drop on conveyor, collected for money', priority: 'core' },
      { name: 'Upgrades', description: 'Buy upgrades to increase production', priority: 'core' },
      { name: 'Shop UI', description: 'Purchase upgrades and items', priority: 'core' },
      { name: 'Data Saving', description: 'Save player progress across sessions', priority: 'core' },
      { name: 'Rebirth', description: 'Reset for multiplier bonus', priority: answers.rebirth === 'yes' ? 'important' : 'nice-to-have' },
      { name: 'Leaderboard', description: 'Top earners display', priority: 'important' },
      { name: 'Daily Rewards', description: 'Login streak bonuses', priority: 'nice-to-have' },
    ],
    simulator: [
      { name: 'Collection', description: 'Click/tap to collect items', priority: 'core' },
      { name: 'Backpack', description: 'Storage with upgradeable capacity', priority: 'core' },
      { name: 'Selling', description: 'Sell collected items for currency', priority: 'core' },
      { name: 'Zones', description: 'Progressive areas with better loot', priority: 'core' },
      { name: 'Pet System', description: 'Hatch, equip, and level pets', priority: answers.pets === 'yes' ? 'core' : 'nice-to-have' },
      { name: 'Trading', description: 'Trade items/pets with other players', priority: answers.trading === 'yes' ? 'important' : 'nice-to-have' },
      { name: 'Rebirth', description: 'Prestige for permanent bonuses', priority: answers.rebirth === 'yes' ? 'important' : 'nice-to-have' },
      { name: 'Data Saving', description: 'Save everything', priority: 'core' },
    ],
    rpg: [
      { name: 'Combat', description: `${answers.combat || 'Melee and ranged'} combat system`, priority: 'core' },
      { name: 'Stats/Levels', description: 'HP, damage, defense, XP, level ups', priority: 'core' },
      { name: 'Inventory', description: 'Weapons, armor, consumables', priority: 'core' },
      { name: 'Quests', description: `${answers.quests || 'Main + side quests'}`, priority: 'core' },
      { name: 'NPCs', description: 'Quest givers, merchants, enemies', priority: 'core' },
      { name: 'Boss Fights', description: 'Special enemies with mechanics', priority: answers.bosses === 'yes' ? 'important' : 'nice-to-have' },
      { name: 'Classes', description: answers.classes || 'Warrior, Mage, Archer', priority: 'important' },
      { name: 'Data Saving', description: 'Save character progress', priority: 'core' },
    ],
    obby: [
      { name: 'Checkpoints', description: 'Save progress at each stage', priority: 'core' },
      { name: 'Timer', description: 'Speedrun timer per stage and total', priority: 'important' },
      { name: 'Kill Brick', description: 'Lava/kill zones that reset to checkpoint', priority: 'core' },
      { name: 'Stage Rewards', description: answers.rewards || 'Coins per stage completion', priority: 'important' },
      { name: 'Leaderboard', description: 'Fastest times', priority: 'important' },
      { name: 'Skip Stage', description: 'Robux gamepass to skip', priority: answers.skipStage === 'yes' ? 'important' : 'nice-to-have' },
      { name: 'Shop', description: 'Buy trails, effects, pets', priority: 'nice-to-have' },
      { name: 'Data Saving', description: 'Save progress', priority: 'core' },
    ],
  }

  const systems = GENRE_SYSTEMS[genre] || GENRE_SYSTEMS.tycoon

  const GENRE_ZONES: Record<string, Array<{ name: string; purpose: string; size: 'small' | 'medium' | 'large'; features: string[] }>> = {
    tycoon: [
      { name: 'Spawn Lobby', purpose: 'Welcome area with tutorials', size: 'medium', features: ['Spawn point', 'Tutorial signs', 'Leaderboard'] },
      { name: 'Player Plot', purpose: 'Where the tycoon operates', size: 'large', features: ['Conveyor belt', 'Droppers', 'Collectors', 'Upgrade pads'] },
      { name: 'Shop Area', purpose: 'Purchase items and upgrades', size: 'medium', features: ['NPC shops', 'Upgrade displays', 'Premium area'] },
      { name: 'VIP Zone', purpose: 'Bonus area for premium players', size: 'small', features: ['Exclusive machines', 'Bonus multipliers'] },
    ],
    simulator: [
      { name: 'Hub World', purpose: 'Central area connecting all zones', size: 'medium', features: ['Sell pad', 'Shop', 'Leaderboard', 'Egg hatch area'] },
      { name: 'Starter Zone', purpose: 'Easy collection for new players', size: 'large', features: ['Common collectibles', 'Basic upgrade station'] },
      { name: 'Advanced Zone', purpose: 'Better loot for progressed players', size: 'large', features: ['Rare collectibles', 'Mini-boss'] },
      { name: 'VIP Zone', purpose: 'Premium zone with best loot', size: 'medium', features: ['Legendary collectibles', 'Auto-collect'] },
      { name: 'Boss Arena', purpose: 'Fight bosses for special drops', size: 'medium', features: ['Boss spawner', 'Reward chest'] },
    ],
    rpg: [
      { name: 'Starting Village', purpose: 'Tutorial and first quests', size: 'large', features: ['Quest NPCs', 'Basic shop', 'Training area'] },
      { name: 'Forest/Dungeon', purpose: 'First adventure area', size: 'large', features: ['Enemies', 'Loot chests', 'Boss room'] },
      { name: 'Town/Market', purpose: 'Trading and shopping hub', size: 'medium', features: ['Merchant NPCs', 'Auction house', 'Class trainer'] },
      { name: 'Castle/Stronghold', purpose: 'End-game content', size: 'large', features: ['Hard enemies', 'Final boss', 'Legendary loot'] },
    ],
    obby: [
      { name: 'Lobby', purpose: 'Start area with stage select', size: 'small', features: ['Stage select', 'Timer display', 'Shop'] },
      { name: 'Easy Stages (1-5)', purpose: 'Introductory obstacles', size: 'medium', features: ['Basic jumps', 'Simple paths'] },
      { name: 'Medium Stages (6-10)', purpose: 'Moderate challenge', size: 'medium', features: ['Moving platforms', 'Wall jumps', 'Balance beams'] },
      { name: 'Hard Stages (11-15)', purpose: 'Difficult obstacles', size: 'large', features: ['Tiny platforms', 'Timing puzzles', 'Invisible paths'] },
      { name: 'Victory Zone', purpose: 'Completion celebration', size: 'small', features: ['Trophy', 'Fireworks', 'Exclusive badge'] },
    ],
  }

  const zones = GENRE_ZONES[genre] || GENRE_ZONES.tycoon

  const uiScreens = [
    'Main HUD (currency, level, health)',
    'Shop/Store UI',
    'Inventory/Backpack',
    'Settings Menu',
    'Leaderboard',
  ]

  if (genre === 'rpg') uiScreens.push('Quest Log', 'Character Stats', 'Class Selection')
  if (genre === 'simulator') uiScreens.push('Pet Inventory', 'Egg Hatching UI', 'Trading UI')
  if (genre === 'tycoon') uiScreens.push('Upgrade Tree', 'Rebirth Confirmation', 'Daily Rewards')

  return {
    title,
    genre,
    subGenre: answers.subtype || answers.setting || genre,
    description: `A ${genre} game: ${originalPrompt}`,
    targetAudience: 'Roblox players age 8-18',
    style: (answers.style as GameDesignDoc['style']) || 'vibrant',
    zones,
    systems,
    currency: {
      name: answers.currency || 'Coins',
      earnRate: genre === 'tycoon' ? 'Passive (droppers)' : 'Active (collecting/killing)',
      spendOn: ['Upgrades', 'Items', 'Pets', 'Skips'],
    },
    gamePasses: ['2x Money', 'VIP Access', 'Auto-Collect', 'Extra Storage'],
    devProducts: ['100 Coins', '500 Coins', '2000 Coins', 'Skip Stage'],
    progression: {
      type: answers.rebirth === 'yes' ? 'rebirth' : 'levels',
      milestones: ['Reach Level 10', 'Unlock Zone 2', 'First Rebirth', 'Max Level'],
    },
    uiScreens,
    estimatedParts: zones.length * 800,
    estimatedScriptLines: systems.length * 300,
    buildPhases: [
      'Phase 1: World & Terrain',
      'Phase 2: Core Game Loop',
      'Phase 3: Economy & Shop',
      'Phase 4: UI & HUD',
      'Phase 5: Data Saving',
      'Phase 6: Polish & Effects',
    ],
  }
}

/**
 * Format design doc as a readable plan for user approval.
 */
export function formatDesignDocForUser(doc: GameDesignDoc): string {
  let plan = `# Game Plan: ${doc.title}\n\n`
  plan += `**Genre:** ${doc.genre} (${doc.subGenre})\n`
  plan += `**Style:** ${doc.style}\n`
  plan += `**Estimated:** ~${doc.estimatedParts} parts, ~${doc.estimatedScriptLines} lines of code\n\n`

  plan += `## Zones (${doc.zones.length})\n`
  for (const z of doc.zones) {
    plan += `- **${z.name}** (${z.size}) — ${z.purpose}\n`
    plan += `  Features: ${z.features.join(', ')}\n`
  }

  plan += `\n## Game Systems (${doc.systems.length})\n`
  for (const s of doc.systems) {
    const icon = s.priority === 'core' ? '**' : s.priority === 'important' ? '' : '~'
    plan += `- ${icon}${s.name}${icon}: ${s.description} [${s.priority}]\n`
  }

  plan += `\n## UI Screens\n`
  for (const ui of doc.uiScreens) {
    plan += `- ${ui}\n`
  }

  plan += `\n## Currency: ${doc.currency.name}\n`
  plan += `- Earning: ${doc.currency.earnRate}\n`
  plan += `- Spending on: ${doc.currency.spendOn.join(', ')}\n`

  plan += `\n## Monetization\n`
  plan += `- Game Passes: ${doc.gamePasses.join(', ')}\n`
  plan += `- Dev Products: ${doc.devProducts.join(', ')}\n`

  plan += `\n## Build Phases\n`
  for (const phase of doc.buildPhases) {
    plan += `- ${phase}\n`
  }

  plan += `\n---\n**Say "build it" to start, or tell me what to change!**`

  return plan
}

/**
 * Check if a message is answering planning questions.
 */
export function isPlanningResponse(message: string, conversationHistory: Array<{ role: string; content: string }>): boolean {
  // Check if the last AI message asked planning questions
  const lastAI = conversationHistory.slice().reverse().find(m => m.role === 'assistant')
  if (!lastAI) return false
  return lastAI.content.includes('To build you the best possible game') ||
    lastAI.content.includes('I need to know a few more things') ||
    lastAI.content.includes('Game Plan:')
}

/**
 * Check if user wants to skip planning and just build.
 */
export function wantsToSkipPlanning(message: string): boolean {
  return /\b(just build|build it|skip|go ahead|start building|make it|do it|execute|yes build)\b/i.test(message)
}
