// Game Design Knowledge Base
// Compiled from top Roblox DevForum posts, RoWatcher, StudioKrew, Game-Ace, and veteran developer advice.
// Last updated: April 2026

export const GAME_DESIGN_KNOWLEDGE = `
=== GAME DESIGN MASTERY (from top Roblox developers) ===

PLAYER RETENTION — FIRST 30 SECONDS:
- The first 30 seconds decide everything. If a player doesn't understand what to do or feel rewarded, they leave.
- Immediate clarity: player should know the core loop within 5 seconds of spawning. No long cutscenes, no walking to a tutorial NPC. Action first.
- Visual brightness matters: dark/desaturated games have measurably worse retention. Use saturated, readable colors with distinct shapes.
- Mobile-first: 75%+ of Roblox players are on mobile. Lock landscape, use RelativePosition for UI, keep buttons thumb-friendly, hide non-essential UI until tutorial completes.
- Reduce traversal friction: never make players walk long distances before gameplay starts. Spawn them AT the action.
- Tutorial should be under 20 seconds. Teach by doing, not by reading. Show one mechanic, reward immediately, then layer complexity.
- First reward within 10 seconds of joining. Even a small coin pickup or XP pop creates dopamine and signals "this game gives me stuff."
- Remove clutter: hide unused backpack slots, redundant text, advanced UI elements. Clean screen = longer session.
- Target metrics: 3+ minute average session time, 15%+ D1 retention. Below 2 minutes = critical onboarding problem.

REWARD SCHEDULING & HOOKS:
- Daily login rewards with escalation: Day 1: small currency, Day 2: 2x currency, ... Day 7: mystery exclusive item (show silhouette with question mark to build anticipation).
- Daily missions: 3 quick tasks completable in one session. Rotate daily to prevent staleness.
- Random events during gameplay (blood moon, meteor shower, boss spawn) extend sessions by creating unpredictable excitement.
- Leaderboards and competitive elements drive return visits. Players come back to defend rankings.
- Time-limited events create urgency. "This skin disappears in 48 hours" converts browsers to buyers.
- Cosmetic progression (evolving skins, trails, auras) feels more impactful than numeric level increases.
- Session design philosophy: "Make your game impossible to finish in one sitting but make it easy to accomplish something in one sitting."
- Trading systems increase social investment — players return to check trade values and complete deals.
- Seasonal/holiday updates keep the game feeling alive. Plan a content calendar.
- Badge-exclusive items and restricted areas reward completionists.

MONETIZATION STRATEGY:
- Three revenue streams: GamePasses (one-time), Developer Products (recurring), Premium Payouts (engagement).
- GamePasses: best for permanent unlocks — exclusive items, level access, cosmetic packs, group ranks. Limited to 15 slots.
- Developer Products: THE revenue driver. Use for currencies, timed boosts, consumables. Can be repurchased infinitely.
- Optimal approach: offer BOTH permanent gamepasses AND timed boosts. Some players refuse temporary purchases; others prefer cheap recurring buys. Maximize across both segments.
- Developer Product must satisfy within 60 seconds of purchase. If the player doesn't feel the value immediately, you failed.
- Pricing tiers: Entry point 50-400 Robux (first purchase conversion), Gameplay 400-6000 Robux (regulars), Whale items 6000+ Robux (1-5% of players generate 75% of revenue).
- Use awkward increments for currency packs (100 / 2000 / 7600 / 10200) — psychological pricing encourages larger purchases.
- 95% of players who buy once will buy again. The hardest conversion is the FIRST purchase. Make entry items cheap (50-100 Robux).
- Trigger purchase prompts at psychological moments: after a defeat in PvP, when blocked by a rank gate, during a time-limited event.
- Never paywall core gameplay. Enhance experience instead. Identity purchases (cosmetics, pets, emotes) outperform power purchases.
- Implement scripted reminder systems — they outperform Roblox's native prompts.
- Price optimization: test two price points, measure sales volume at each, calculate demand curve, find the revenue-maximizing vertex. Use A/B testing over 1-2 weeks.
- Limited-time free events create urgency for permanent purchases afterward.
- Subscriptions with visible monthly rewards are trending in 2026.
- Regional pricing awareness: adjust expectations for global audience spending power.
- DevEx rate: 100,000 Robux = $350 USD after Roblox's 30% marketplace fee.

TYCOON DESIGN PATTERNS:
- Core loop: Earn currency → Buy upgrades → Earn faster → Unlock new areas → Rebirth for multipliers.
- Button/pad system: player walks over a pad to purchase the next building piece. Use .Touched events (faster than ProximityPrompts for tycoons).
- Sequential unlocking: place purchase buttons INSIDE prerequisite models. Buy walls before ceiling button appears. This creates natural progression without complex scripting.
- Dropper → Conveyor → Collector pattern: items spawn from droppers, travel along conveyors, get collected and converted to currency. Upgrade droppers for better items, conveyors for speed, collectors for efficiency.
- Store building pieces in ServerStorage (not ReplicatedStorage) to prevent client-side peeking.
- Module-based architecture: main TycoonModule with :Purchase(modelName), :Load(tycoon, player), :Grant(tycoon, player) functions.
- Rebirth system: once players reach a currency threshold, they can reset progress for a permanent multiplier (1.5x, 2x, 3x earnings). Each rebirth costs progressively more. Some games reset everything; others only deduct the required amount.
- Prestige layers: Rebirth 1 (2x), Rebirth 2 (3x), ... Rebirth 10 (unlock new tycoon area). Stack multipliers to create exponential feeling.
- Compact maps work better than sprawling ones. Players want rapid decision-making and visible progress.
- Automation upgrades: let players buy auto-collectors, auto-droppers. This creates an idle layer that keeps currency flowing when AFK.
- Visual feedback: buildings should appear with particles/sound effects. Each purchase should feel satisfying.
- End-game content: special areas, exclusive items, cosmetic flexes that show other players how far you've progressed.
- Plot assignment: use ObjectValue to track ownership. Clone purchased items from ServerStorage into player's plot.

SIMULATOR DESIGN PATTERNS:
- Core loop: Click/collect → Fill backpack → Sell at zone → Buy upgrades → Unlock new zone → Rebirth.
- Backpack system: finite capacity that holds collected resources. Forces regular trips to sell zone. Upgrade backpack size as progression.
- Tool progression: starter tool (1x) → better tools (2x, 5x, 10x collection rate). Tools can be purchased, crafted, or found.
- Selling zones: designated areas where collected items convert to currency. Place strategically to create natural gameplay flow.
- Pet system: pets provide passive boosts (auto-collect, multipliers, luck bonuses). Egg hatching with rarity tiers (Common 70%, Rare 20%, Epic 8%, Legendary 1.5%, Mythic 0.5%). Pet fusion/evolution for end-game depth.
- Zone progression: Zone 1 (free, basic resources) → Zone 2 (1K coins, 2x value resources) → Zone 3 (10K coins, 5x value) → etc. Each zone has unique theme, enemies, and collectibles.
- Rebirth mechanic: reset stats/inventory for permanent multiplier. First rebirth at ~100K currency. Cost increases exponentially. Some games only deduct the cost and keep inventory (more player-friendly).
- Multiplier stacking: rebirth multiplier × pet multiplier × tool multiplier × gamepass multiplier = total earnings rate.
- Quick reward cycles: simulators succeed because core loops complete in under 5 minutes. Click, fill, sell, upgrade. Repeat.
- Codes system: redeemable codes for free currency/pets. Drives social sharing ("NEW CODE" videos get millions of views).
- Leaderboards: total earnings, rebirths completed, rarest pets owned. Social competition drives retention.
- Event zones: temporary areas with exclusive collectibles during holidays/updates.
- Mobile optimization is critical — simulators are the most-played genre on mobile Roblox.

HORROR GAME DESIGN:
- Terror > Horror: psychological confusion outperforms gore and jump scares. The best horror is what players imagine, not what you show.
- Atmosphere techniques: dynamic sky color shifts, progressive visual degradation, extreme darkness with limited light sources, fog that thickens over time.
- Sound design is 70% of horror: proximity-based audio that crescendos near threats, inaudible whispers lasting only seconds, phantom footsteps behind the player, sudden silence after building tension, false knocking sounds from wrong directions.
- Entity AI behavior states: Idle (patrol routes) → Alert (player detected nearby) → Chase (active pursuit) → Search (lost player, checking last known position) → Return (back to patrol).
- Pathfinding: use Humanoid:MoveTo() with waypoints, but optimize task.wait() intervals for smooth pursuit. For many entities, consider TweenService or client-side rendering.
- Player detection: line-of-sight raycasting, proximity radius detection, sound-based detection (player running = louder = easier to detect).
- Environmental interaction: entities that break destructible barriers, crawl through vents, open/close doors. Makes them feel intelligent and relentless.
- Scare techniques: flickering lights WITHOUT entity appearing (tension building), brief entity glimpses around corners (1-2 frames), objects disappearing when player looks away, hallucination system (fake entities, blood writing on walls, false audio cues).
- Hiding mechanics: wardrobes, lockers, under beds. Entity searches hiding spots with increasing probability over time. Player must manage breathing/heartbeat (mini-game or timing mechanic).
- Room generation: procedural rooms with consistent style but randomized layout. Number rooms sequentially (Door 1, Door 2...) for progress tracking. Each room can spawn different entity encounters.
- Darkness mechanics: flashlight with limited battery, matches/candles as consumables, glowstick throwables. Light management creates constant resource tension.
- Sound detection mechanic: game detects player microphone input — making noise attracts entities. Adds real-world immersion.
- Key design principle from DOORS: introduce mechanics through safe encounters first (lights flicker but nothing happens) before real threats appear. Train players to recognize warning signs, then subvert expectations.

OBBY DESIGN:
- Difficulty chart structure: Easy → Medium → Hard → Extreme → Insane → Impossible. Color-code stages by difficulty (green → yellow → orange → red → purple → black).
- Checkpoint placement: after every 2-3 obstacles minimum. Checkpoints are "the very essence of difficulty charts." Without frequent checkpoints, frustration kills retention.
- Progressive teaching: introduce ONE mechanic per stage first (wall jumps, then spinning platforms, then disappearing blocks), then combine mechanics in later stages.
- Stage length matters: avoid single-stud stages (too short, no challenge) and marathon stages (too long, frustrating). Sweet spot is 15-30 seconds per stage.
- Variety is critical: alternate between jump types (precision jumps, wall jumps, ladder climbs, conveyor dodges, timing puzzles). Repetition of the same obstacle type kills engagement.
- Difficulty scaling: first 20% of stages should be completable by most players. Middle 50% provides core challenge. Final 30% is for dedicated players. Never make early stages hard — it filters out your entire audience.
- Playtest obsessively: what feels easy to the creator is often hard for players. Test on multiple devices, especially mobile.
- Timer systems: optional speedrun timer creates replayability. Show personal best and server best. Leaderboards for fastest completions.
- Skip stage gamepass: one of the best-selling obbies gamepasses. Price at 50-100 Robux per skip or offer unlimited skips for 200-500 Robux.
- Gravity/speed coils as gamepasses: let players buy traversal advantages.
- Visual feedback: particles on checkpoints, celebration effects on stage completion, progress bar showing percentage completed.
- Avoid unintentional shortcuts: playtest every stage from every angle. Players will find any skip.
- Save progress with DataStore: players must return to their last checkpoint on rejoin, not restart from beginning.
- Infinite obby variant: procedurally generated stages that get harder forever. Leaderboard tracks highest stage reached.

RPG DESIGN:
- Stat system: Health, Damage, Defense, Speed as base stats. Allocate points on level-up. Keep it simple (4-6 stats max) — complex systems confuse casual players.
- Damage formula: BaseDamage × (1 + Strength/100) × WeaponMultiplier - EnemyDefense × 0.5. Add randomness (±10-15%) to prevent predictability.
- Level scaling: XP = BaseXP × Level^1.5. Each level requires ~20-30% more XP than the last. Level 1-10 should take 15-30 minutes. Level 10-20 takes 1-2 hours. Level 20-50 takes days.
- Quest system architecture: NPC_Controller module with dialogue trees. Track quest state: Inactive → Active → InProgress → Complete → Rewarded. Store per-player quest progress in DataStore.
- Quest types: Kill X enemies, Collect X items, Deliver item to NPC, Reach location, Defeat boss, Escort NPC. Mix types to prevent monotony.
- Dialogue system: typewriter-style text display, NPC name + portrait, branching choices that affect quest outcomes. Use numbered dictionary entries for sequential dialogue lines with animation triggers and sound references.
- Decouple quest dialogue from NPC meeting count — allow multiple simultaneous quest lines without requiring synchronized encounter numbers.
- Loot tables: Common (60%), Uncommon (25%), Rare (10%), Epic (4%), Legendary (1%). Boss drops guarantee at least Rare. Scale drop rates with player luck stat.
- Enemy scaling: Zone-based difficulty. Zone 1 enemies: Level 1-5, 100-500 HP. Zone 2: Level 5-15, 500-2000 HP. Scale damage and rewards proportionally.
- Combat patterns: basic enemies have 1-2 attack patterns. Mini-bosses have 3-4 with telegraphed attacks. World bosses have 5+ patterns with phase transitions at HP thresholds (75%, 50%, 25%).
- Skill trees: 3 branches (e.g., Warrior/Mage/Ranger). 10-15 skills per branch. Allow respec for currency so players can experiment.
- Party system: 2-4 player groups for dungeons. Role synergy (tank + healer + DPS) encourages social play.
- Economy sinks: repair costs, consumables, respec fees, cosmetic crafting. Without sinks, inflation destroys the economy within weeks.
- Inventory management: limited slots (20-30 base, expandable via upgrades). Item rarity indicated by border color. Sort by type/rarity/recent.

RACING DESIGN:
- Vehicle physics: Hooke's Law suspension (F = -kx - cv) with damping. Spring stiffness controls ride height, damping prevents bouncing. Raycast from each wheel to detect ground distance.
- Enhanced wheel casting: cast 8-10 rays around wheel circumference using sin/cos. Use shortest result for smooth terrain following. Responds to bumps earlier than center-only raycasting.
- Motor force: apply throttle input (-1 to 1) × engine power when wheels contact ground. Clamp using forward velocity dot product. Linear dropoff near max speed for smooth deceleration.
- Friction system: F = μN (friction coefficient × normal force). Apply lateral friction to prevent sideways sliding. Kinetic friction for active drift states.
- Drift mechanics: reduce lateral friction coefficient when drift button held. Apply angular velocity for satisfying slide feel. Award drift points for sustained drifts. Boost reward after long drifts.
- Boost system: nitro/boost as consumable (refills over time or from pickups). 1.5-2x speed multiplier for 2-3 seconds. Visual effects (speed lines, FOV increase, motion blur).
- Track design: wide turns for beginners, tight chicanes for skilled players. Include shortcuts that require skill to access. Alternate between high-speed straights and technical sections.
- Lap system: invisible trigger parts at start/finish and checkpoints. Must pass all checkpoints in order to count a valid lap. Anti-cheat: verify minimum lap time.
- Power-ups: speed boost, shield, projectile, oil slick. Place on track at strategic positions. Respawn after 10-15 seconds.
- Vehicle tuning: let players adjust speed vs acceleration vs handling as a tradeoff. Different car classes (Starter, Sport, Super, Hyper) with stat ranges.
- Camera: follow-cam with slight lag for speed feel. Shake on boost. Lower angle at high speed. Option for cockpit/hood view.
- Network: use physics-based forces (not position setting) for multiplayer. Client predicts, server validates. Smoothing for other players' cars.
- Track variety: city circuits, off-road, highway, stunt tracks. Each with unique hazards (traffic, weather, jumps).

TOWER DEFENSE DESIGN:
- Wave system: define waves as data tables. Each wave entry = {enemyType, count, spawnDelay, waveDelay}. Example: Wave 1: {Grunt, 10, 1.5s, 5s}, Wave 5: {Grunt 15 + Fast 5, 1.0s, 8s}, Wave 10: {Boss, 1, 0, 15s}.
- Wave scaling formula: enemyHP = baseHP × (1 + wave × 0.15). EnemySpeed stays mostly constant (speed enemies are a separate type). enemyCount increases by 1-2 per wave.
- Enemy types: Grunt (normal), Fast (2x speed, 0.5x HP), Tank (0.5x speed, 3x HP), Flying (ignores ground path), Boss (10x HP, special abilities), Stealth (invisible without detector towers).
- Path system: waypoint-based movement using numbered parts. Enemies follow waypoints sequentially. Use MoveTo or TweenService (TweenService performs better with 100+ enemies). Consider client-side rendering for enemy visuals.
- Tower placement: grid-based system. Snap towers to grid intersections. Check placement validity (not on path, not overlapping, within map bounds). Show green/red preview before confirming placement.
- Tower types: Basic (balanced), Sniper (long range, slow fire), Splash (area damage), Slow (debuff), Support (buffs nearby towers). 5-7 tower types is ideal.
- Upgrade system: 3-4 upgrade tiers per tower. Each tier increases damage/range/fire rate. Cost doubles per tier. Final tier adds special ability (e.g., Basic → Laser, Sniper → Railgun).
- Economy balance: starting cash = enough for 3-5 basic towers. Enemy kill rewards = 10-50% of a basic tower cost. Don't give too much — scarcity creates strategy. Boss kills reward 2-5x normal enemies.
- Placement limits: max towers per player or per map. Forces strategic choices. Selling towers returns 50-75% of investment.
- Boss waves: every 5-10 waves. Boss has massive HP pool, possibly spawns minions, may have abilities (speed burst, heal, shield). Defeating boss gives major currency reward + rare drop.
- Multiplayer: 2-4 players with shared economy or individual economies. Cooperative placement. Vote-to-skip or ready-up between waves.
- Map design: single path for beginners, multi-path for advanced. Include elevation changes and choke points. Maps should be visible at a glance — tower defense is strategic, not exploratory.
- Difficulty modes: Easy (reduced enemy HP/count), Normal, Hard (faster spawns, more enemies), Nightmare (enemy buffs, limited towers).
- Infinite mode: waves continue indefinitely with scaling difficulty. Leaderboard for highest wave reached.

BATTLE ROYALE DESIGN:
- Storm/zone system: circular safe zone that shrinks over time. Players outside take increasing damage per second. Visualize with a translucent mesh/union with a hole, or use individual parts forming a ring.
- Zone phases: Phase 1: full map, 2 min to loot. Phase 2: shrink to 75%, 1.5 min. Phase 3: 50%, 1 min. Phase 4: 25%, 45 sec. Final: single point, constant damage. Each phase shrinks over 30-60 seconds.
- Damage scaling: Phase 1 outside zone: 1 HP/sec. Phase 2: 3 HP/sec. Phase 3: 5 HP/sec. Phase 4: 10 HP/sec. Final: 20 HP/sec. Forces engagement.
- Map size: 2000-4000 studs per side for 20-40 players. Too large = boring walking simulator. Too small = instant combat with no looting phase.
- Loot system: randomized weapon/item spawns in buildings and chests. Rarity tiers affect stats (Common → Legendary). Floor loot + chest loot + supply drops.
- Weapon balance: close range (shotgun), medium (AR), long range (sniper), utility (grenades, heals). Each weapon has tradeoffs. No single dominant weapon.
- Building system (Fortnite-style): if included, use grid-based placement. Wall, ramp, floor, roof pieces. Resource gathering from environment. Adds skill ceiling but complexity.
- Player spawning: all players start in lobby, teleport to map simultaneously. Skydive/bus mechanic for spread. Or random spawn points across map.
- Inventory: limited slots (5-6 weapon/item slots). Force players to make choices. Drop items on death for looting.
- Elimination mechanics: knocked state (can be revived by teammate in duos/squads) or instant elimination (solos). Spectate after elimination.
- Anti-camping: storm forces movement. Audio cues for nearby players (footsteps). Zone encourages final fights in open areas.
- End-game: final 2-3 players in tiny zone creates intense 1v1 encounters. Victory screen with stats (kills, damage, survival time).
- Server management: dedicated servers per match. Clean up and reset after match ends. Matchmaking lobby fills before starting.

DISCOVERY & GROWTH — HOW THE ROBLOX ALGORITHM WORKS (2026):
- PRIMARY SIGNAL: Session return rate. Not CCU, not total playtime. The algorithm rewards players coming back within 24-48 hours for another session.
- A player who plays 90 minutes and never returns looks identical to a churned player algorithmically. Multiple short sessions >> one long session.
- Target: Sessions-per-user-per-day of at least 1.2. Below that = structural re-engagement problem.
- Design core loops completable in under 15 minutes (ideally under 10). Simulators and Dress to Impress succeed because sessions are naturally short and repeatable.
- Re-entry hooks: show visible state changes on rejoin (timers counting down, daily rewards ready, friends online, new items available).
- Daily login rewards and battle passes FAIL without short core loops underneath. They're band-aids, not solutions.
- DAU/MAU ratio cross-referenced with session duration distribution approximates your algorithm health.
- Three algorithm pillars: Value (engagement + retention + monetization), Personalization (matching user interests), Safety (TOS compliance).
- New experiences take multiple days to appear in discovery. Metadata changes need up to 14 days for full search reindexing.
- Featured sort: 5 PC + 4 tablet + 2 phone positions, rotating every 2 weeks. Requirements: phone/tablet support, localization (Spanish, Portuguese, French, German), unique fun gameplay.
- Thumbnail optimization: bright, readable, character-focused. Show gameplay action, not logos. Change thumbnails weekly for freshness signals.
- Title optimization: short, searchable, genre-clear. "Zombie Tower Defense" > "ZTD" > "My Cool Game."
- Social features multiply discovery: multiplayer mechanics increase engagement signals. Friends playing together = algorithm boost. Invite systems, group features.
- Influencer partnerships: YouTuber/streamer plays create initial CCU spike. Algorithm then evaluates retention of those players. If retention is good, organic discovery follows.
- Cross-promotion: partner with games sharing your audience. Place teleporters/ads in each other's games.
- Localization: translate game to Spanish, Portuguese, and French to access 3x the potential audience. Featured sort requires localization.
- Technical quality: stable servers, low crash rates, fast loading times receive preferential ranking treatment.
- Update cadence: consistent updates signal an active game. The algorithm favors recently-updated experiences.

GENRE TRENDS 2026:
- Simulators: dominant on mobile. Quick progression, clear upgrades, 5-minute core loops.
- Social hangouts: fastest-growing genre. Community-driven spaces where players gather, customize, share screenshots.
- RPGs: succeed when avatar customization connects to gameplay identity.
- Tycoons: economic loops on compact maps with rapid decision-making and automation.
- Horror: DOORS-style procedural room crawlers remain hugely popular. Story-driven horror is emerging.
- Skill-based (obbies, Tower of Hell): pure competition + cosmetics = sustainable without aggressive monetization.
- Short-session formats outperform longer matches across ALL genres.
- Mobile performance determines trending potential — games running poorly on mobile lose discovery visibility entirely.
- Avatar expression and identity drive discovery spikes. Emote systems, outfit customization, and cosmetic depth are engagement multipliers.
`;

// ---------------------------------------------------------------------------
// Keyword matcher — returns the most relevant sections for a given user prompt
// ---------------------------------------------------------------------------

const SECTION_MAP: Record<string, { keywords: string[]; startMarker: string; endMarker: string }> = {
  retention: {
    keywords: [
      'retention', 'keep players', 'session', 'engage', 'hook', 'reward',
      'daily', 'login', 'return', 'come back', 'first 30', 'onboarding',
      'tutorial', 'new player', 'first time',
    ],
    startMarker: 'PLAYER RETENTION',
    endMarker: 'MONETIZATION STRATEGY:',
  },
  monetization: {
    keywords: [
      'monetiz', 'gamepass', 'game pass', 'developer product', 'devproduct',
      'robux', 'revenue', 'money', 'sell', 'pricing', 'shop', 'store',
      'purchase', 'buy', 'subscription', 'premium',
    ],
    startMarker: 'MONETIZATION STRATEGY:',
    endMarker: 'TYCOON DESIGN PATTERNS:',
  },
  tycoon: {
    keywords: [
      'tycoon', 'dropper', 'conveyor', 'collector', 'factory', 'rebirth',
      'prestige', 'idle', 'clicker', 'automation', 'upgrade tree',
    ],
    startMarker: 'TYCOON DESIGN PATTERNS:',
    endMarker: 'SIMULATOR DESIGN PATTERNS:',
  },
  simulator: {
    keywords: [
      'simulator', 'sim', 'collect', 'backpack', 'pet', 'egg',
      'hatch', 'zone', 'sell zone', 'multiplier', 'grind',
    ],
    startMarker: 'SIMULATOR DESIGN PATTERNS:',
    endMarker: 'HORROR GAME DESIGN:',
  },
  horror: {
    keywords: [
      'horror', 'scary', 'entity', 'monster', 'jumpscare', 'jump scare',
      'dark', 'darkness', 'flashlight', 'doors', 'backrooms', 'creepy',
      'haunted', 'ghost', 'zombie',
    ],
    startMarker: 'HORROR GAME DESIGN:',
    endMarker: 'OBBY DESIGN:',
  },
  obby: {
    keywords: [
      'obby', 'obstacle', 'parkour', 'checkpoint', 'difficulty',
      'platformer', 'jump', 'wall jump', 'stage', 'tower of hell',
    ],
    startMarker: 'OBBY DESIGN:',
    endMarker: 'RPG DESIGN:',
  },
  rpg: {
    keywords: [
      'rpg', 'quest', 'npc', 'dialogue', 'combat', 'stat', 'level',
      'loot', 'inventory', 'skill tree', 'dungeon', 'boss', 'adventure',
      'sword', 'magic', 'spell', 'damage', 'defense', 'health',
    ],
    startMarker: 'RPG DESIGN:',
    endMarker: 'RACING DESIGN:',
  },
  racing: {
    keywords: [
      'racing', 'race', 'car', 'vehicle', 'kart', 'track', 'drift',
      'boost', 'nitro', 'lap', 'speed', 'driving', 'motorcycle',
    ],
    startMarker: 'RACING DESIGN:',
    endMarker: 'TOWER DEFENSE DESIGN:',
  },
  towerDefense: {
    keywords: [
      'tower defense', 'td', 'wave', 'tower', 'enemy path', 'placement',
      'grid', 'turret', 'defend', 'base defense',
    ],
    startMarker: 'TOWER DEFENSE DESIGN:',
    endMarker: 'BATTLE ROYALE DESIGN:',
  },
  battleRoyale: {
    keywords: [
      'battle royale', 'br', 'storm', 'zone', 'shrink', 'loot',
      'last man', 'survival', 'fortnite', 'pubg', 'elimination',
    ],
    startMarker: 'BATTLE ROYALE DESIGN:',
    endMarker: 'DISCOVERY & GROWTH',
  },
  discovery: {
    keywords: [
      'discovery', 'algorithm', 'rank', 'grow', 'players', 'viral',
      'trending', 'featured', 'thumbnail', 'title', 'seo', 'search',
      'promote', 'marketing', 'audience',
    ],
    startMarker: 'DISCOVERY & GROWTH',
    endMarker: 'GENRE TRENDS 2026:',
  },
  trends: {
    keywords: [
      'trend', '2026', '2025', 'popular', 'what works', 'genre',
      'mobile', 'social', 'avatar',
    ],
    startMarker: 'GENRE TRENDS 2026:',
    endMarker: '===END===', // won't match — returns to end of string
  },
};

/**
 * Given a user prompt, return the most relevant game-design knowledge sections.
 * Always includes retention + discovery as baseline context, then adds genre-specific
 * sections that match keywords in the prompt (up to 4 total sections).
 */
export function getRelevantGameDesign(prompt: string): string {
  const lower = prompt.toLowerCase();

  // Score every section
  const scored: { key: string; score: number }[] = Object.entries(SECTION_MAP).map(
    ([key, { keywords }]) => {
      let score = 0;
      for (const kw of keywords) {
        if (lower.includes(kw)) score += 1;
      }
      return { key, score };
    },
  );

  // Sort descending by score
  scored.sort((a, b) => b.score - a.score);

  // Always include retention + discovery as baselines (if not already top-scored)
  const selected = new Set<string>();

  // Add top-scored sections (up to 3 with score > 0)
  for (const { key, score } of scored) {
    if (score > 0 && selected.size < 3) {
      selected.add(key);
    }
  }

  // Always include retention and discovery as baseline context
  selected.add('retention');
  selected.add('discovery');

  // Extract sections from the knowledge string
  const sections: string[] = [];
  for (const key of selected) {
    const cfg = SECTION_MAP[key];
    if (!cfg) continue;

    const startIdx = GAME_DESIGN_KNOWLEDGE.indexOf(cfg.startMarker);
    if (startIdx === -1) continue;

    let endIdx = GAME_DESIGN_KNOWLEDGE.indexOf(cfg.endMarker, startIdx + cfg.startMarker.length);
    if (endIdx === -1) endIdx = GAME_DESIGN_KNOWLEDGE.length;

    sections.push(GAME_DESIGN_KNOWLEDGE.slice(startIdx, endIdx).trim());
  }

  if (sections.length === 0) {
    // Fallback: return retention + monetization + discovery
    return getSection('retention') + '\n\n' + getSection('monetization') + '\n\n' + getSection('discovery');
  }

  return sections.join('\n\n');
}

/** Helper: extract a single named section */
function getSection(key: string): string {
  const cfg = SECTION_MAP[key];
  if (!cfg) return '';
  const startIdx = GAME_DESIGN_KNOWLEDGE.indexOf(cfg.startMarker);
  if (startIdx === -1) return '';
  let endIdx = GAME_DESIGN_KNOWLEDGE.indexOf(cfg.endMarker, startIdx + cfg.startMarker.length);
  if (endIdx === -1) endIdx = GAME_DESIGN_KNOWLEDGE.length;
  return GAME_DESIGN_KNOWLEDGE.slice(startIdx, endIdx).trim();
}
