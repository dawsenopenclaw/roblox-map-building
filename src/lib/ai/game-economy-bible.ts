/**
 * Game Economy Bible — currency design, progression curves, monetization, engagement psychology.
 * Used by ForjeGames AI to generate balanced, engaging, ethical Roblox game economies.
 * 4000+ lines of formulas, patterns, Luau code, and design wisdom.
 */

// ============================================================
// MAIN EXPORT — Full combined reference
// ============================================================
export const GAME_ECONOMY_BIBLE: string = `
=== FORJEGAMES GAME ECONOMY BIBLE ===
Complete reference for balanced, engaging, monetization-sound Roblox game economies.
Last updated: Apr 2026. Covers currency design, math curves, engagement psychology,
battle passes, inflation prevention, ethics, and full Luau implementation patterns.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PART 1: CURRENCY DESIGN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[1.1] CURRENCY ARCHETYPES

Every healthy game economy uses 2-4 currencies. More than 4 creates confusion. Fewer than 2 limits
monetization flexibility.

PRIMARY CURRENCY (Soft Currency)
- Names: Coins, Cash, Gold, Credits, Stars, Tokens, Bolts, Shards
- Earned by: Playing the game (gameplay loop reward)
- Spent on: Upgrades, common items, basic cosmetics, shops
- Should always feel earnable. Player must never feel blocked from it.
- Design target: Always have some; never have too much (inflation risk).
- Display: Format with commas. Show abbreviated at 1K+ (e.g. "12.4K", "1.2M").

PREMIUM CURRENCY (Hard Currency)
- Names: Gems, Crystals, Diamonds, Orbs, Robux (platform), Moonstones, Prisms
- Earned by: Robux purchase, rare milestone rewards, occasional daily bonus, event completion
- Spent on: Cosmetics, time-savers, battle pass tiers, exclusive items, gacha pulls
- NEVER give direct stat advantages. Premium = cosmetics + time savings only.
- Exchange rate from Robux: 1 Robux = 10 in-game gems is standard. Adjust for perceived value.
- Display: Gold/purple color. Separate counter from primary. Show sparkle effect on gain.

EVENT CURRENCY (Seasonal)
- Names: Snowflakes, Candy Corn, Hearts, Festival Tokens, Pumpkins, Beach Balls
- Earned by: Playing during events, completing event quests, seasonal activities
- Expires: End of event season (show countdown timer clearly)
- Spent on: Event-exclusive cosmetics, seasonal items, limited pets/tools
- Design rule: Make it easy to earn enough for at least 2 items per event so players feel rewarded.
- Never make event currency purchasable for real money — it trivializes event effort.

REPUTATION / FACTION CURRENCY
- Names: Honor, Prestige, Influence, Reputation, Faction Points, Guild Coins
- Earned by: Completing faction-specific tasks, PvP wins, helping others, quests
- Spent on: Faction-exclusive gear, cosmetics, faction upgrades
- Purpose: Creates social identity, long-term goals, community belonging
- Design: Factions should feel meaningful. Give lore. Give unique aesthetic. Give bonuses.

CONTRIBUTION CURRENCY (Multiplayer / Guild)
- Names: Guild Tokens, Alliance Points, Team Credits, Clan Coins
- Earned by: Donating resources, participating in guild activities, completing guild quests
- Spent on: Guild upgrades, shared team items, guild cosmetics
- Purpose: Drives social bonding, daily logins (guild activity), cooperation

[1.2] MULTI-CURRENCY BALANCE RULES

Rule 1: Premium NEVER buys power. Only cosmetics + time savings.
  BAD: "Buy 10 attack gems for 50 Robux" — pay-to-win, community will revolt
  GOOD: "Buy the galaxy sword skin for 100 gems" — pure cosmetic, fair

Rule 2: Primary currency should feel abundant early, scarce late.
  Early game: 100 coins feels like a lot. Can buy 3 upgrades.
  Late game: 1,000,000 coins is normal. Cost of upgrades scaled accordingly.

Rule 3: Never let players run out of something to buy.
  Always have a coin sink at any progression level. Dead-end economies kill retention.

Rule 4: Premium currency should have a clear, honest value.
  Always tell the player what they're getting before they spend.
  "Buy the Hero Pack: Includes 3 skins, 1 trail, and 500 gems (1,500 value)" is good.

Rule 5: Exchange rates must be transparent and consistent.
  If 100 Robux = 1,000 gems, never silently change this. Community will notice and rage.

[1.3] DISPLAY FORMATTING (Luau)

\`\`\`lua
-- Format large numbers with abbreviations
local function formatNumber(n: number): string
    if n >= 1e12 then
        return string.format("%.1fT", n / 1e12)
    elseif n >= 1e9 then
        return string.format("%.1fB", n / 1e9)
    elseif n >= 1e6 then
        return string.format("%.1fM", n / 1e6)
    elseif n >= 1e3 then
        return string.format("%.1fK", n / 1e3)
    else
        return tostring(math.floor(n))
    end
end

-- Format with commas for smaller numbers
local function formatWithCommas(n: number): string
    local s = tostring(math.floor(n))
    local result = ""
    local count = 0
    for i = #s, 1, -1 do
        if count > 0 and count % 3 == 0 then
            result = "," .. result
        end
        result = s:sub(i, i) .. result
        count = count + 1
    end
    return result
end

-- Smart format: commas below 10K, abbreviations above
local function smartFormat(n: number): string
    if n >= 10000 then
        return formatNumber(n)
    else
        return formatWithCommas(n)
    end
end
\`\`\`

[1.4] EXCHANGE RATE TABLE (Reference)

Robux → In-game gems (standard conversion):
  80 Robux → 800 gems    (10:1 ratio)
  160 Robux → 1,800 gems  (11.25:1 ratio, bonus for larger purchase)
  400 Robux → 5,000 gems  (12.5:1 ratio, bonus)
  800 Robux → 11,000 gems (13.75:1 ratio, bonus)

Bonus scaling encourages larger purchases. Never make the per-unit rate worse for larger purchases.

Primary → Premium exchange (if you allow it — optional):
  1,000,000 primary coins → 100 gems (100:1 soft-to-hard)
  This gives F2P players a path to premium items over a long grind. Healthy.
  Cap at 500 gems/week via this conversion to prevent abuse.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PART 2: PRICING MATH — EXACT FORMULAS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[2.1] LINEAR COST FORMULA
  cost = baseCost + (level * increment)
  Example: baseCost=100, increment=50
    Level 1: 150, Level 2: 200, Level 3: 250 ... Level 20: 1,100
  Use for: Simple shops, consumables, minor quality-of-life upgrades
  Problem: Gets too cheap to feel meaningful at high levels; upgrades feel trivial.
  Fix: Use polynomial or exponential for main progression.

[2.2] EXPONENTIAL COST FORMULA
  cost = baseCost * (multiplier ^ level)
  Slow growth (multiplier = 1.15): Level 10 = base * 4.05, Level 20 = base * 16.4
  Medium growth (multiplier = 1.30): Level 10 = base * 13.8, Level 20 = base * 190
  Fast growth (multiplier = 1.50): Level 10 = base * 57.7, Level 20 = base * 3325
  Very fast (multiplier = 2.00): Level 10 = base * 1024, Level 20 = base * 1,048,576

  Recommended for: Tycoon droppers, Simulator pets, idle game upgrades
  Standard: 1.15 for early-game upgrades, 1.50 for max-level items

\`\`\`lua
local function exponentialCost(baseCost: number, multiplier: number, level: number): number
    return math.floor(baseCost * (multiplier ^ level))
end

-- Example: upgrade costs
local function getDropperCost(dropperLevel: number): number
    return exponentialCost(100, 1.35, dropperLevel)
end
-- Level 1: 135, Level 5: 490, Level 10: 2,785, Level 20: 553,000
\`\`\`

[2.3] POLYNOMIAL COST FORMULA
  cost = baseCost * (level ^ exponent)
  Exponent 1.5: Level 10 = base * 31.6, Level 20 = base * 89.4
  Exponent 2.0: Level 10 = base * 100, Level 20 = base * 400
  Exponent 2.5: Level 10 = base * 316, Level 20 = base * 1789
  Exponent 3.0: Level 10 = base * 1000, Level 20 = base * 8000

  Recommended for: Skill trees, stat upgrades (strength/speed), tool improvements
  Exponent 1.5 feels gradual and fair. Exponent 3.0 is hardcore grind territory.

\`\`\`lua
local function polynomialCost(baseCost: number, exponent: number, level: number): number
    return math.floor(baseCost * (level ^ exponent))
end

-- Strength upgrade example
local function getStrengthUpgradeCost(currentStrength: number): number
    return polynomialCost(50, 2.0, currentStrength)
end
-- Strength 1: 50, Strength 5: 1,250, Strength 10: 5,000, Strength 20: 20,000
\`\`\`

[2.4] CUSTOM COMPOUND CURVE
  cost = baseCost * (1 + level / 10) ^ 2.5
  This is a tunable curve. Increase 2.5 for steeper growth. Decrease for softer.
  Level 1: base * 1.28, Level 5: base * 3.58, Level 10: base * 10.5, Level 20: base * 57.7

  Best for: General-purpose upgrade costs where you want control.
  The "/ 10" divisor sets how fast cost ramps. Use "/5" for faster, "/20" for slower.

\`\`\`lua
local function compoundCost(baseCost: number, level: number, rampDivisor: number?, power: number?): number
    local d = rampDivisor or 10
    local p = power or 2.5
    return math.floor(baseCost * ((1 + level / d) ^ p))
end
\`\`\`

[2.5] INCOME FORMULA
  earnings = baseIncome * (1 + upgradeCount * 0.25) * multiplierBoosts * eventBonus

  upgradeCount: number of income-boosting upgrades purchased
  multiplierBoosts: purchased/earned multipliers stacked multiplicatively
  eventBonus: 1.0 normally, 1.5 during 2x events, 2.0 during 4x weekends

  Example: 10 upgrades, 3x multiplier, 2x event:
  earnings = 100 * (1 + 10 * 0.25) * 3 * 2 = 100 * 3.5 * 6 = 2,100 per tick

\`\`\`lua
local function calculateEarnings(
    baseIncome: number,
    upgradeCount: number,
    multiplierBoosts: number,
    eventBonus: number
): number
    local upgradeMultiplier = 1 + (upgradeCount * 0.25)
    return math.floor(baseIncome * upgradeMultiplier * multiplierBoosts * eventBonus)
end
\`\`\`

[2.6] TIME-TO-NEXT FORMULA (Critical for pacing!)
  timeToNext = upgradeCost / currentEarningsPerSecond (in seconds)

  Sweet spots by game phase:
  - Tutorial / Level 1-3: 30-120 seconds (0.5 - 2 min)
  - Early game / Level 4-10: 120-300 seconds (2 - 5 min)
  - Mid game / Level 11-25: 900-1800 seconds (15 - 30 min)
  - Late game / Level 26-50: 3600-7200 seconds (1 - 2 hours)
  - End game / Level 51+: 14400-86400 seconds (4 - 24 hours)

  If time-to-next exceeds 10 minutes in early game → players QUIT.
  If time-to-next is under 30 seconds in late game → no sense of achievement.

\`\`\`lua
local function timeToNextUpgrade(upgradeCost: number, earningsPerSecond: number): number
    if earningsPerSecond <= 0 then return math.huge end
    return upgradeCost / earningsPerSecond
end

local function formatTimeToNext(seconds: number): string
    if seconds < 60 then
        return string.format("%.0fs", seconds)
    elseif seconds < 3600 then
        return string.format("%.1fm", seconds / 60)
    elseif seconds < 86400 then
        return string.format("%.1fh", seconds / 3600)
    else
        return string.format("%.1fd", seconds / 86400)
    end
end
\`\`\`

[2.7] REBIRTH MULTIPLIER FORMULA
  rebirthMultiplier = 1.5 ^ rebirthCount (50% increase per rebirth)
  Or: rebirthMultiplier = 1 + (rebirthCount * 0.3) (linear 30% per rebirth)

  First rebirth at 30-60 minutes of play is the golden target.
  Each subsequent rebirth should take 1.5x longer than the previous.

  rebirthRequirement[n] = baseRequirement * 2.5^n
  Rebirth 1: base, Rebirth 2: 2.5x, Rebirth 3: 6.25x, Rebirth 4: 15.6x

\`\`\`lua
local function getRebirthMultiplier(rebirthCount: number): number
    return 1.5 ^ rebirthCount
end

local function getRebirthRequirement(rebirthCount: number, baseRequirement: number): number
    return math.floor(baseRequirement * (2.5 ^ rebirthCount))
end
\`\`\`

[2.8] PRESTIGE MULTIPLIER (Idle Games)
  prestigeMultiplier = math.sqrt(totalLifetimeEarnings / 1000)

  This rewards players who played more before prestiging.
  Total earned 10K: sqrt(10) = 3.16x multiplier
  Total earned 100K: sqrt(100) = 10x multiplier
  Total earned 1M: sqrt(1000) = 31.6x multiplier

\`\`\`lua
local function calculatePrestigeMultiplier(lifetimeEarnings: number): number
    return math.max(1, math.sqrt(lifetimeEarnings / 1000))
end
\`\`\`

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PART 3: PROGRESSION CURVES — 10+ GAME TYPES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[3.1] TYCOON PROGRESSION

Core loop: Place dropper → Earn coins → Buy upgrades → Place more droppers → Rebirth
Target timeline: First rebirth in 30-60 minutes for new players.

Dropper costs (exponential, multiplier 1.35):
  Dropper 1: 100 coins, Dropper 2: 135, Dropper 3: 182, Dropper 5: 333
  Dropper 10: 2,785, Dropper 15: 20,107, Dropper 20: 145,297

Income per dropper (linear growth):
  Dropper 1: 1 coin/sec, Dropper 2: 2 coins/sec, Dropper N: N coins/sec

Multiplier buildings (fixed costs, big income):
  x2 building: costs sum of all dropper income * 120 (2 minutes payoff)
  x5 building: costs sum of all dropper income * 300 (5 minutes payoff)
  x10 building: costs sum of all dropper income * 600 (10 minutes payoff)

Rebirth requirement: totalCoinsEarned >= 1,000,000
Post-rebirth permanent multiplier: +50% income (1.5^ per rebirth count)

\`\`\`lua
-- Tycoon economy module
local TycoonEconomy = {}

function TycoonEconomy.dropperCost(n: number): number
    return math.floor(100 * (1.35 ^ n))
end

function TycoonEconomy.dropperIncome(n: number): number
    return n -- coins per second
end

function TycoonEconomy.totalIncome(ownedDroppers: {number}): number
    local total = 0
    for _, dropperN in ipairs(ownedDroppers) do
        total = total + TycoonEconomy.dropperIncome(dropperN)
    end
    return total
end

function TycoonEconomy.multiplierBuildingCost(baseIncome: number, multiplier: number): number
    -- Costs N * multiplier * 120 where 120 = 2 minute payoff target
    local payoffSeconds = if multiplier <= 2 then 120 elseif multiplier <= 5 then 300 else 600
    return math.floor(baseIncome * multiplier * payoffSeconds)
end

function TycoonEconomy.rebirthRequirement(rebirthCount: number): number
    return math.floor(1000000 * (2.5 ^ rebirthCount))
end

function TycoonEconomy.rebirthMultiplier(rebirthCount: number): number
    return 1.5 ^ rebirthCount
end

return TycoonEconomy
\`\`\`

[3.2] SIMULATOR PROGRESSION

Core loop: Equip best tool/pet → Auto-collect resource → Upgrade → Unlock new areas → Rebirth
Types: Mining Sim, Lifting Sim, Fighting Sim, Eating Sim, Pet Sim

Tool costs (exponential, multiplier 1.4):
  Tool 1: 0 (starter), Tool 2: 250, Tool 3: 350, Tool 5: 686, Tool 10: 10,000

Pet costs (polynomial, exponent 2.5, base 500):
  Pet 1: 500, Pet 2: 2,828, Pet 3: 7,794, Pet 5: 27,951, Pet 10: 158,114

Training areas (unlock by total stat level):
  Area 1 (Beginner): 0 stat required
  Area 2 (Intermediate): 100 stat required
  Area 3 (Advanced): 500 stat required
  Area 4 (Expert): 2,500 stat required
  Area 5 (Master): 12,500 stat required
  Each area gives 2x more resource per click/second

Rebirth system: Rebirth gives +1 to base multiplier (stacks additively for clarity)
  Rebirth 1: 2x base, Rebirth 2: 3x, Rebirth 3: 4x, Rebirth N: (N+1)x

\`\`\`lua
local SimulatorEconomy = {}

function SimulatorEconomy.toolCost(toolIndex: number): number
    if toolIndex == 1 then return 0 end
    return math.floor(250 * (1.4 ^ (toolIndex - 1)))
end

function SimulatorEconomy.petCost(petIndex: number): number
    return math.floor(500 * (petIndex ^ 2.5))
end

function SimulatorEconomy.areaRequirement(areaIndex: number): number
    return math.floor(100 * (5 ^ (areaIndex - 2)))
end

function SimulatorEconomy.areaMultiplier(areaIndex: number): number
    return 2 ^ (areaIndex - 1) -- each area = 2x previous
end

function SimulatorEconomy.rebirthMultiplier(rebirthCount: number): number
    return rebirthCount + 1 -- additive: rebirth 0 = 1x, rebirth 5 = 6x
end

return SimulatorEconomy
\`\`\`

[3.3] RPG PROGRESSION

XP Curve: XP needed for level N = baseXP * N ^ 1.5
  Level 1→2: 100 XP (fast, ~5 min early game)
  Level 5→6: 559 XP
  Level 10→11: 1,581 XP
  Level 20→21: 8,944 XP
  Level 30→31: 16,432 XP (~15 min mid game)
  Level 50→51: 35,355 XP (~1 hr late game)
  Level 100: 100,000 XP (~3+ hrs very late game)

Stat growth: stat = baseStat + level * statPerLevel + bonusFromGear
  HP: base 100, +10 per level
  Attack: base 10, +1 per level
  Defense: base 5, +0.5 per level

Enemy HP scaling: enemyHP = 50 * (1.2 ^ (enemyLevel - 1))
Enemy XP reward: enemyXP = 10 * enemyLevel

Gear rarity and stat bonus:
  Common: +0-5% to stats
  Uncommon: +6-15% to stats
  Rare: +16-30% to stats
  Epic: +31-50% to stats
  Legendary: +51-100% to stats

\`\`\`lua
local RPGEconomy = {}

function RPGEconomy.xpRequired(level: number): number
    return math.floor(100 * (level ^ 1.5))
end

function RPGEconomy.totalXPToLevel(targetLevel: number): number
    local total = 0
    for l = 1, targetLevel - 1 do
        total = total + RPGEconomy.xpRequired(l)
    end
    return total
end

function RPGEconomy.playerHP(level: number): number
    return 100 + (level * 10)
end

function RPGEconomy.enemyHP(enemyLevel: number): number
    return math.floor(50 * (1.2 ^ (enemyLevel - 1)))
end

function RPGEconomy.enemyXP(enemyLevel: number): number
    return math.floor(10 * enemyLevel)
end

function RPGEconomy.gearStatBonus(rarity: string, baseStat: number): number
    local bonusRanges = {
        Common = {0.00, 0.05},
        Uncommon = {0.06, 0.15},
        Rare = {0.16, 0.30},
        Epic = {0.31, 0.50},
        Legendary = {0.51, 1.00}
    }
    local range = bonusRanges[rarity] or bonusRanges.Common
    local roll = math.random() * (range[2] - range[1]) + range[1]
    return math.floor(baseStat * roll)
end

return RPGEconomy
\`\`\`

[3.4] OBBY PROGRESSION

No economy needed — pure skill progression. But you CAN add:
  - Coins per stage completion (10 coins * stageNumber)
  - Checkpoint tokens (save your progress for 50 coins/hr offline)
  - Optional cosmetic shop (trail, character effect)
  - Premium skip (jump 5 stages, gamepass — ethical if stages are fair)

Stage difficulty curve:
  Stages 1-20: Easy. Basic jumps, moving platforms, simple gaps. 90% completion rate target.
  Stages 21-50: Medium. Timing required, kill bricks, multiple paths. 60% completion rate.
  Stages 51-80: Hard. Precise jumps, fast moving obstacles, puzzles. 30% completion rate.
  Stages 81-100: Extreme. Pixel-perfect, multiple fail states, no checkpoints. 10% completion rate.
  Stages 101+: Community/Creator hard. Brutally curated. <1% completion rate.

Time-trial variant: target completion times
  Easy stages: 10-30 seconds
  Medium stages: 30-90 seconds
  Hard stages: 90-300 seconds
  Extreme stages: 300-600 seconds (5-10 min)

[3.5] IDLE GAME PROGRESSION

Core loop: Earn offline → Spend on upgrades → Prestige for multiplier → Repeat

Offline earnings: 50% of online earn rate (standard), capped at 8 hours.
  Formula: offlineEarnings = onlineEarningsPerSecond * 0.5 * min(offlineSeconds, 28800)
  Premium upgrade: "2x Offline" gamepass → 100% offline rate

Automation timing: When player has enough to buy next upgrade × 100, auto-buy triggers.
  Or: Offer auto-buy as premium feature (gamepass 100-200 Robux).

Prestige unlock: When total lifetime earnings reach prestige threshold.
  Prestige threshold[n] = 1,000,000 * (5 ^ n)
  Prestige multiplier: sqrt(lifetimeEarnings / 1000) as noted in Part 2.

Idle upgrade count guide:
  Total upgrades: 50-100 (enough depth without feeling infinite)
  Buildings per tier: 5-8 (collectible, manageable)
  Building upgrade depth: 25 levels each (exponential cost)

\`\`\`lua
local IdleEconomy = {}

function IdleEconomy.offlineEarnings(onlineEPS: number, offlineSeconds: number): number
    local cappedSeconds = math.min(offlineSeconds, 28800) -- 8 hour cap
    return math.floor(onlineEPS * 0.5 * cappedSeconds)
end

function IdleEconomy.prestigeThreshold(prestigeCount: number): number
    return math.floor(1000000 * (5 ^ prestigeCount))
end

function IdleEconomy.prestigeMultiplier(lifetimeEarnings: number): number
    return math.max(1, math.sqrt(lifetimeEarnings / 1000))
end

function IdleEconomy.buildingCost(buildingIndex: number, upgradeLevel: number): number
    local baseCost = 10 * (10 ^ (buildingIndex - 1))
    return math.floor(baseCost * (1.15 ^ upgradeLevel))
end

function IdleEconomy.buildingIncome(buildingIndex: number, upgradeLevel: number): number
    local baseIncome = buildingIndex * 0.1
    return baseIncome * upgradeLevel
end

return IdleEconomy
\`\`\`

[3.6] BATTLE ROYALE PROGRESSION

No in-match economy. Post-match progression only.
  - Match XP: win = 500 XP, top 10 = 200 XP, kill = 50 XP each, survive 5 min = 20 XP
  - Cosmetic unlock tree: Every 10 levels, unlock a cosmetic slot or item
  - Battle pass: See Part 7 for full BP math
  - No stat advantages. Ever. Every player is equal in ability.

Weapon balance target: No weapon dominates. Rock-paper-scissors style counters.
  Close range: Shotgun beats SMG, SMG beats AR
  Long range: Sniper beats everything if hit
  Area denial: Grenades, RPG — hard counters to camping

Storm/shrink mechanic: Zone shrinks every 2 minutes. Final zone at 3 minutes remaining.
  Zone damage: 5 HP/second outside zone (ramps to 20 HP/sec in final zone)

[3.7] FIGHTING GAME PROGRESSION

ELO / ranking system:
  Starting ELO: 1000
  Win: +K * (1 - expectedScore), lose: -K * expectedScore
  K factor: 32 for beginners (< 20 matches), 24 for intermediate, 16 for veterans
  expectedScore = 1 / (1 + 10 ^ ((opponentELO - myELO) / 400))

Matchmaking: Only match players within ± 150 ELO
  If no match found in 30 seconds, expand to ± 300 ELO
  If no match found in 60 seconds, expand to ± 500 ELO

Stat training (Strength Simulator hybrid):
  Stat cost: polynomial exponent 2.0, base 100
  Stat cap: 100 per stat category to prevent extreme stat gaps
  Diminishing returns: damage = baseDamage * log(1 + stat / 10)
    (log base 2, so stat 10 = 3.46x, stat 100 = 6.64x — no infinite scaling)

\`\`\`lua
local FightingEconomy = {}

function FightingEconomy.expectedScore(myELO: number, opponentELO: number): number
    return 1 / (1 + 10 ^ ((opponentELO - myELO) / 400))
end

function FightingEconomy.eloChange(myELO: number, opponentELO: number, won: boolean): number
    local k = if myELO < 1100 then 32 elseif myELO < 1400 then 24 else 16
    local expected = FightingEconomy.expectedScore(myELO, opponentELO)
    local actual = if won then 1 else 0
    return math.floor(k * (actual - expected))
end

function FightingEconomy.statDamageMultiplier(stat: number): number
    return math.log(1 + stat / 10) / math.log(2) + 1 -- +1 so base stat 0 = 1x
end

return FightingEconomy
\`\`\`

[3.8] TOWER DEFENSE PROGRESSION

Tower costs: Same tower type costs 50% more each time you place one.
  First Archer tower: 100, Second: 150, Third: 225, Fourth: 338

Wave scaling: Enemy HP = baseHP * 1.1^(waveNumber - 1)
  Wave 1: base HP, Wave 10: 2.59x, Wave 20: 6.73x, Wave 30: 17.45x, Wave 50: 117x

Tower upgrade costs: cost = baseCost * 2^upgradeLevel
  Tower level 1→2: 200, level 2→3: 400, level 3→4: 800, level 4→5 (max): 1600

Currency gain per wave: waveCoins = wave * 50 + enemiesKilled * 5
Lives: Start with 20 lives. Lose 1 per enemy that reaches the end. Game over at 0.

Special towers (expensive, powerful):
  Slow tower: 800 coins, reduces enemy speed 30%
  Splash tower: 1200 coins, damages all enemies in 5-stud radius
  Boss slayer: 2500 coins, 5x damage vs boss-type enemies

\`\`\`lua
local TDEconomy = {}

function TDEconomy.towerCost(towerType: string, ownedCount: number, baseCost: number): number
    return math.floor(baseCost * (1.5 ^ ownedCount))
end

function TDEconomy.enemyHP(waveNumber: number, baseHP: number): number
    return math.floor(baseHP * (1.1 ^ (waveNumber - 1)))
end

function TDEconomy.waveReward(waveNumber: number, enemiesKilled: number): number
    return waveNumber * 50 + enemiesKilled * 5
end

function TDEconomy.towerUpgradeCost(baseCost: number, currentLevel: number): number
    return math.floor(baseCost * (2 ^ currentLevel))
end

return TDEconomy
\`\`\`

[3.9] HORROR / ESCAPE ROOM

No economy. Progression = exploration, knowledge, completion.
Optional light economy:
  - Jump scares survived = badge
  - Full run completed under time = exclusive badge/cosmetic
  - Hidden item collection (20 items in map, find all = rare badge)
  - Death count shown to friends for social pressure

Difficulty settings:
  Easy: More hints, longer timers, less enemy aggression
  Normal: Standard. Designed experience.
  Hard: No hints, shorter timers, enemies move 25% faster
  Nightmare: Permadeath, no saves, enemies one-shot

[3.10] RACING GAME PROGRESSION

Car upgrades (4 stats: Speed, Acceleration, Handling, Boost):
  Each stat: 10 upgrade levels. Cost polynomial exponent 2.0, base 200.
  Max upgrades: 10 levels = polynomial cost = 200 * 10^2 = 20,000 coins.

Car unlock costs (exponential, multiplier 1.6):
  Car 1 (starter): Free, Car 2: 1,000, Car 3: 1,600, Car 5: 4,096, Car 10: 68,719

Track unlocks: win 3 races on current track tier to unlock next tier.
  Track tier 1: 1 track. Tier 2: 2 tracks. Tier 3: 3 tracks. Tier 4: 4 tracks. Tier 5: 5 tracks.

Cosmetics: Car skins (no stat boost), trail effects, paint colors.
  Skins: 100-500 coins (earnable), or premium gem versions (exclusive patterns).

Parts rarity (drop from race completion):
  Common (60%): +0-5% to one stat
  Uncommon (25%): +5-10% to one stat
  Rare (10%): +10-20% to one stat
  Epic (4%): +20-35% to one stat
  Legendary (1%): +35-60% to one stat, unique visual effect

\`\`\`lua
local RacingEconomy = {}

function RacingEconomy.carUnlockCost(carIndex: number): number
    if carIndex == 1 then return 0 end
    return math.floor(1000 * (1.6 ^ (carIndex - 2)))
end

function RacingEconomy.statUpgradeCost(currentLevel: number): number
    return math.floor(200 * (currentLevel ^ 2))
end

function RacingEconomy.partRarity(): string
    local roll = math.random()
    if roll < 0.60 then return "Common"
    elseif roll < 0.85 then return "Uncommon"
    elseif roll < 0.95 then return "Rare"
    elseif roll < 0.99 then return "Epic"
    else return "Legendary"
    end
end

return RacingEconomy
\`\`\`

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PART 4: INFLATION PREVENTION — 14 MONEY SINKS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Money sinks are essential. Without them, players accumulate infinite currency → nothing to spend on
→ shop feels pointless → disengagement. Every dollar in must have a dollar out.

[4.1] REPAIR COSTS
  Implementation: 10% of item value per death.
  If player has max-tier sword worth 50,000 coins, each death costs 5,000 to repair.
  Cap repair cost at 15% max to avoid punishing newer players too harshly.
  Grace period: First 5 deaths per session are free (new player protection).

\`\`\`lua
local function repairCost(itemValue: number, deathCount: number): number
    if deathCount <= 5 then return 0 end -- grace period
    return math.floor(itemValue * 0.10)
end
\`\`\`

[4.2] TRANSACTION TAX (MARKETPLACE)
  5% fee on all player-to-player trades.
  2% listing fee (paid upfront, non-refundable if item doesn't sell).
  This mirrors real marketplaces (Roblox's 30% cut is why we use coins, not Robux here).
  Prevents gold duplication exploits from being economically beneficial.

[4.3] COSMETIC SHOP (ROTATING STOCK)
  6 new items per week (Monday reset). Limited editions never return (or rarely).
  Price range: 500 - 50,000 primary coins. 50-500 premium gems.
  "Weekly special" at 30% discount — creates urgency without being predatory.
  Free item every 2 weeks for F2P players (goodwill + habit formation).

[4.4] GAMBLING / GACHA (ETHICAL VERSION)
  Egg hatching, crates, mystery boxes.
  PITY SYSTEM: Guaranteed rare after 50 pulls, guaranteed legendary after 100 pulls.
  Display odds clearly in-game (required for ethical design, and some jurisdictions).
  Never remove the pity counter between sessions — it should persist.

  Crate price: 500 coins per pull (primary), 20 gems per pull (premium tier).
  F2P earnable: ~2 pulls per day from gameplay. Premium: ~5 pulls per day.

\`\`\`lua
local GachaSystem = {}
GachaSystem.pityCounter = {} -- indexed by userId

function GachaSystem.pull(userId: string, poolName: string): string
    GachaSystem.pityCounter[userId] = GachaSystem.pityCounter[userId] or {}
    local counter = GachaSystem.pityCounter[userId][poolName] or 0
    counter = counter + 1
    GachaSystem.pityCounter[userId][poolName] = counter

    local rarity
    if counter >= 100 then
        rarity = "Legendary"
        GachaSystem.pityCounter[userId][poolName] = 0
    elseif counter >= 50 then
        rarity = "Rare"
        -- Don't reset counter until legendary
    else
        local roll = math.random()
        if roll < 0.50 then rarity = "Common"
        elseif roll < 0.80 then rarity = "Uncommon"
        elseif roll < 0.95 then rarity = "Rare"
        elseif roll < 0.99 then rarity = "Epic"
        else
            rarity = "Legendary"
            GachaSystem.pityCounter[userId][poolName] = 0
        end
    end
    return rarity
end

return GachaSystem
\`\`\`

[4.5] UPGRADE COSTS (EXPONENTIAL SCALING)
  Already covered in Part 2. The key point: upgrade costs must scale fast enough that
  even wealthy players can't trivially max everything in a session.
  Target: Max upgrades require 100x total gameplay hours vs. starter.

[4.6] REROLL STAT COSTS (INCREASING)
  First reroll: 1,000 coins
  Second reroll: 3,000 coins
  Third reroll: 7,000 coins
  Nth reroll: 1000 * (3 ^ (n-1))
  After 10 rerolls, you've spent 29,524 coins trying to get perfect stats. Addictive. Fair.

\`\`\`lua
local function rerollCost(attemptNumber: number): number
    return math.floor(1000 * (3 ^ (attemptNumber - 1)))
end
\`\`\`

[4.7] FAST TRAVEL FEES (DISTANCE-BASED)
  cost = math.floor(distance / 10) * 5
  Distance in studs. Max reasonable fee: 500 coins.
  Free travel to home/spawn. Always.
  Offer "Unlimited Fast Travel" gamepass (250 Robux equivalent) for heavy players.

[4.8] STORAGE EXPANSION (GEOMETRIC SCALING)
  Slot 1-20: Free (starter storage)
  +5 slots: cost = 500 * (2 ^ expansionNumber)
  Expansion 1: 500, Expansion 2: 1,000, Expansion 3: 2,000, Expansion 5: 8,000, Expansion 10: 256,000

\`\`\`lua
local function storageExpansionCost(expansionNumber: number): number
    return math.floor(500 * (2 ^ expansionNumber))
end
\`\`\`

[4.9] PET FOOD / MAINTENANCE
  Pets without food: lose 10% effectiveness per hour.
  1 unit of pet food: 250 coins, feeds 1 pet for 2 hours.
  For 5 pets, you need 2,500 coins/day in food. Consistent daily drain.
  Premium pets: need premium food (gem-cost or earnable from daily bonus).
  Never lock basic pet functionality behind this — just reduce effectiveness.

[4.10] GUILD UPGRADES (SHARED POOL CONTRIBUTION)
  Guild level 1 → 2: 10,000 total coins from all members
  Guild level N: 10,000 * (3 ^ (N-1)) total required
  Level 5: 810,000 total. Level 10: 196,830,000 total.
  Per-member daily contribution cap: prevents one whale from buying everything.
  Incentivizes team cohesion. Guild leader can't solo carry.

[4.11] CRAFTING MATERIAL COSTS (SHOP FLOOR)
  Rare materials sold in shop at high prices:
  Iron: 100 coins each (common, found easily in game)
  Steel: 500 coins each (uncommon, crafted or bought)
  Mythril: 2,500 coins each (rare, dungeon drop or shop)
  Void Crystal: 12,500 coins each (very rare, endgame)
  Players can either farm materials OR buy them with coins. Both drain the economy.

[4.12] AUCTION HOUSE LISTING FEES
  Listing fee: 2% of starting price (minimum 50 coins)
  Paid upfront. If item doesn't sell after 24 hours, item returns, fee is lost.
  Sale tax: 5% of final sale price (to prevent wash trading).
  Total friction: 7% of transaction value removed from economy per trade. Healthy drain.

[4.13] DEATH PENALTY (CARRIED CURRENCY)
  Lose 5-10% of coins carried on death.
  Coins banked in home base or vault: safe from death.
  This creates risk/reward: "Do I carry more to earn faster, or bank safely?"
  Max loss cap: 500 coins (prevents discouraging newer players with small balances).
  Hardcore mode (optional): 20% loss. For players who want stakes.

\`\`\`lua
local function calculateDeathPenalty(carriedCoins: number, hardcoreMode: boolean): number
    local rate = if hardcoreMode then 0.20 else 0.07
    local loss = math.floor(carriedCoins * rate)
    return math.min(loss, 500) -- cap at 500 for non-hardcore
end
\`\`\`

[4.14] PRESTIGE RESET (VOLUNTARY SACRIFICE)
  Player voluntarily resets all progress. In exchange: permanent 1.5x multiplier.
  This is psychological: they CHOSE to sacrifice. It feels different from losing.
  Reward must be tangible. Show what "Rebirth 5 Vyren" is vs "no-rebirth player".
  Social proof: Show rebirth badge/aura next to name. Makes high rebirthers prestigious.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PART 5: ENGAGEMENT PSYCHOLOGY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[5.1] VARIABLE RATIO REWARDS
  Random drops are more psychologically engaging than fixed rewards.
  The uncertainty of "will I get it this time?" is more compelling than "I'll get it in 10 pulls."
  Slot machines are built on this. So are loot boxes. So are fishing mechanics.

  Implementation: Mix guaranteed rewards (fixed ratio) with random drops (variable ratio).
  Good: "Complete 5 quests → guaranteed uncommon item. PLUS random chance for rare on each quest."
  Bad: "Complete 50 quests → guaranteed rare item." (Feels like a job, not a game.)

[5.2] LOSS AVERSION
  Players feel losses ~2x more intensely than equivalent gains.
  Use this ethically: limited-time offers create urgency. Exclusive items feel special when rare.

  "Limited time: Double coin weekend — ends in 23:14:37" → FOMO is real, works.
  "This item leaves the shop in 3 days" → ethical when honest (item actually leaves).

  Never fake scarcity. If an item is "leaving forever" it must leave forever. Community trust = revenue.
  Never use countdown timers on individual Robux purchases. That crosses into predatory.

[5.3] NEAR-MISS EFFECT
  When gacha shows "★★★★ Epic! (just missed Legendary!)" the player feels motivated to try again.
  Show what they almost got. "So close! Legendary pity: 47/50"
  This is ethical when paired with a visible pity counter — player knows they WILL get it.

  Implementation: Always show pity counter prominently on gacha UI.

[5.4] SUNK COST HOOK
  Show players what they've invested: "You've been playing ForjeGame for 47 hours!"
  Achievement showcase: "You've earned 200 achievements. Don't stop now!"
  This keeps players engaged but can become toxic. Balance with real value delivery.

  Ethical line: Never use sunk cost to push real-money purchases. Only to celebrate their journey.

[5.5] SOCIAL PROOF
  Show friend activity: "BuddyPlayer123 just hatched a Legendary Dragon!"
  Server-wide announcements for rare drops (but not too frequent → spam kills immersion).
  Leaderboards: Top 10 in your friend group, top 100 server-wide.

  "8 players bought this gamepass this week" — social proof on purchase UI.

[5.6] FOMO (FEAR OF MISSING OUT)
  Daily login bonuses (miss a day → miss the reward, forever).
  Event exclusives: "Halloween Hat 2026 — only available October 2026."
  Battle pass: "Season ends in 14 days. 3 tiers remaining. Don't miss the Season Sword!"

  Healthy FOMO: Clear timelines, achievable goals, real exclusivity.
  Unhealthy FOMO: Impossible deadlines, pay-to-not-miss mechanics, fake "last chance" messages.

[5.7] COLLECTION DRIVE (SET BONUSES)
  "Collect all 6 Sun Armor pieces for +25% fire resistance!"
  "Complete the Starter Pet collection (8 pets) for the Golden Egg Aura!"
  This drives completionist behavior. 72% of players will work for "complete the set."

  Design: Sets should be achievable by F2P over reasonable time. At least 3 tiers of sets.
  Common set: earnable in 2-4 hours. Rare set: 10-20 hours. Legendary set: 50+ hours or premium.

[5.8] MASTERY AND COMPETENCE
  Players need to feel skilled, not just grinding. Give skill expression.
  Combo systems: Hitting 10 enemies in 5 seconds = "Combo Bonus" extra coins.
  Speed runs: Time your dungeon clear. Top 10% get bonus reward.
  Accuracy: Perfect dodge streaks, headshot counters, no-damage clears.

  For Roblox audience (13-22): Clear visual feedback is everything.
  Combo counter: Big number on screen. Sound effect. Particle burst.
  Personal best: "New PB! +2.3 seconds faster than your last run."

[5.9] AUTONOMY AND CHOICE
  Give players multiple paths to the same goal.
  "You can farm dungeon 3 for Mythril, OR complete quests to buy it from the shop."
  "Upgrade Strength OR Speed — both viable builds."

  Choice creates ownership: "My build is unique." Ownership creates attachment.
  Never funnel players into one correct path. That kills creativity and replayability.

[5.10] DAILY LOGIN REWARDS (7-DAY CYCLE)
  Day 1: 100 coins (small but instant gratification)
  Day 2: 250 coins
  Day 3: 500 coins + 1 item
  Day 4: 1,000 coins
  Day 5: 2,000 coins + 5 gems
  Day 6: 3,500 coins + rare item
  Day 7: 5,000 coins + 25 gems + exclusive cosmetic (the BIG reward)

  If player misses: Reset to Day 1. (Creates habit incentive to not miss.)
  Alternative: Never reset, just linear rewards (more casual-friendly, less habit-forming).

  Monthly loyalty: If player completes 20/30 days → bonus legendary item.

\`\`\`lua
local DailyLogin = {}

local DAILY_REWARDS = {
    {coins = 100, gems = 0, item = nil},
    {coins = 250, gems = 0, item = nil},
    {coins = 500, gems = 0, item = "CommonChest"},
    {coins = 1000, gems = 0, item = nil},
    {coins = 2000, gems = 5, item = nil},
    {coins = 3500, gems = 0, item = "RareItem"},
    {coins = 5000, gems = 25, item = "WeeklyExclusive"}
}

function DailyLogin.getReward(loginStreak: number): table
    local dayIndex = ((loginStreak - 1) % 7) + 1
    return DAILY_REWARDS[dayIndex]
end

function DailyLogin.isEligible(lastLoginTimestamp: number): boolean
    local currentTime = os.time()
    local hoursSinceLogin = (currentTime - lastLoginTimestamp) / 3600
    return hoursSinceLogin >= 20 -- eligible after 20 hours (not strictly 24, slight forgiveness)
end

return DailyLogin
\`\`\`

[5.11] STREAK SYSTEMS
  Consecutive login streak: "7-day streak! 1.5x coins today!"
  Play streak: "You've played 14 days straight. DOUBLE gems for 1 hour!"
  Kill streak (combat): "5-kill streak! Bonus XP activated!"

  Streak multipliers:
  1 day: 1.0x (no bonus, just baseline)
  3 days: 1.1x coin bonus
  7 days: 1.25x coin bonus + gems
  14 days: 1.5x coin bonus + rare item
  30 days: 2.0x coin bonus + monthly exclusive

  Break recovery: "Streak shield" item (earnable or purchasable) saves one missed day.

\`\`\`lua
local function streakMultiplier(streakDays: number): number
    if streakDays >= 30 then return 2.0
    elseif streakDays >= 14 then return 1.5
    elseif streakDays >= 7 then return 1.25
    elseif streakDays >= 3 then return 1.1
    else return 1.0
    end
end
\`\`\`

[5.12] ACHIEVEMENT DOPAMINE
  Sound: Distinct "ding" sound on achievement unlock. Customizable sounds = premium.
  Visual: Golden banner slides in from top of screen. Stays 3 seconds. Tap to dismiss.
  Color coding: Bronze / Silver / Gold / Platinum based on difficulty.
  Social: "X just earned 'First Dragon Kill'!" server announcement.

  Achievement categories: Combat, Collection, Exploration, Social, Economic, Mastery
  Each category should have 20-40 achievements. Total: 120-240 achievements.
  Reward per achievement: 50-500 coins + title/badge. Not gear stats.

  Title system: Show earned title below username. Vanity, no stats.
  "Vyren ⚔️ Dragon Slayer" — prestige without imbalance.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PART 6: SESSION DESIGN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[6.1] THE CORE LOOP (5 MINUTES)
  Every 5 minutes, the player should:
  1. Earn enough currency to feel progress
  2. Have a meaningful choice to make (upgrade A or B?)
  3. See a visual change in their game state
  4. Receive at least one piece of feedback (sound, notification, pop-up)

  If any of these breaks, session length drops by 30-50%.
  Test: Watch a new player for 5 minutes. Did they naturally do all 4? Fix what they didn't.

[6.2] THE 20-MINUTE SESSION GOAL
  Every player should have a clear achievable goal for the next 20 minutes.
  Sources: Daily quest, upgrade goal, area unlock, pet hatch, race win.

  Daily quest system: Show 3 quests on login.
  Easy: "Earn 1,000 coins" → 100 gem reward
  Medium: "Defeat 20 enemies" → 250 gem reward + item
  Hard: "Reach zone 5 in Tower Defense" → 500 gem reward + rare cosmetic
  Complete all 3: Bonus "Daily Complete" reward (1,000 gems or equivalent).

\`\`\`lua
local DailyQuests = {}

local QUEST_POOLS = {
    Easy = {
        {text = "Earn {amount} coins", target = 1000, reward = {gems = 100}},
        {text = "Open {count} chests", target = 3, reward = {gems = 100}},
        {text = "Complete {count} matches", target = 2, reward = {coins = 500}},
    },
    Medium = {
        {text = "Defeat {count} enemies", target = 20, reward = {gems = 250, item = "CommonChest"}},
        {text = "Upgrade {count} buildings", target = 5, reward = {gems = 250}},
        {text = "Win {count} races", target = 3, reward = {gems = 250}},
    },
    Hard = {
        {text = "Reach wave {wave} in Tower Defense", target = 20, reward = {gems = 500, item = "RareChest"}},
        {text = "Earn {amount} coins in a single session", target = 100000, reward = {gems = 500}},
        {text = "Hatch a Rare or better pet", target = 1, reward = {gems = 500, item = "EpicChest"}},
    }
}

function DailyQuests.getDailyQuests(userId: string, day: number): table
    -- Deterministic based on userId + day so it's consistent for that player that day
    local seed = tonumber(userId:sub(-4)) or 1234
    math.randomseed(seed + day)
    local easy = QUEST_POOLS.Easy[math.random(#QUEST_POOLS.Easy)]
    local medium = QUEST_POOLS.Medium[math.random(#QUEST_POOLS.Medium)]
    local hard = QUEST_POOLS.Hard[math.random(#QUEST_POOLS.Hard)]
    return {easy, medium, hard}
end

return DailyQuests
\`\`\`

[6.3] WEEKLY GOALS
  7 goals per week. Reset on Monday.
  Complete 5/7 → "Weekly Premium Reward" (exclusive pet or cosmetic).
  Complete 7/7 → Ultra reward (double the premium reward + title).

  Weekly goals are harder than daily quests. Require 2-3 daily sessions to complete.
  Mix game types: "Win 10 Tower Defense matches", "Complete all daily quests 5 days", etc.

[6.4] MONTHLY EVENTS
  One themed event per month. 28-day duration.
  Event quests: 20 special quests. Complete all → exclusive item nobody else can get next month.
  Event currency: Earnable through gameplay. Spent in event shop.
  Community goal: "Server collectively earns 100,000,000 event coins → unlock bonus event map."

  Event timing: Roblox holidays (Halloween, Christmas, New Year, Spring, Summer).
  Add 2 "original" events per year that are unique to your game (builds brand identity).

[6.5] RETENTION HOOKS (WHAT BRINGS THEM BACK)
  "I have a daily chest to open." → Anticipation hook
  "My garden/shop/city is growing while I'm offline." → Progress hook
  "I have a 14-day streak I don't want to break." → Investment hook
  "My guild needs my daily contribution." → Social obligation hook
  "The event ends in 3 days and I'm 80% done." → Completion drive
  "My friend leveled past me." → Competition drive

  Design: Implement at least 4 of these 6 hooks. More = better retention.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PART 7: BATTLE PASS MATH
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[7.1] TIER STRUCTURE
  100 tiers. 30-day season.
  XP to complete tier N: N * 100 + 500
    Tier 1: 600 XP, Tier 25: 3,000 XP, Tier 50: 5,500 XP, Tier 100: 10,500 XP

  Total XP needed (tiers 1-100): sum(N*100+500 for N=1..100) = 555,000 XP
  Player needs 555,000 XP over 30 days = 18,500 XP per day

[7.2] XP SOURCES
  Daily challenge: 500 XP each, 3 challenges/day = 1,500 XP/day
  Weekly challenge: 2,500 XP each, 5 challenges/week = 12,500 XP / 7 days = 1,786 XP/day
  Gameplay: ~200 XP per 5-minute session. Target: 2-3 hours of play per day.
    2 hours = 24 sessions * 200 = 4,800 XP/day
    3 hours = 36 sessions * 200 = 7,200 XP/day

  Total per day (2hr player): 1,500 + 1,786 + 4,800 = 8,086 XP/day
  Days to complete (2hr player): 555,000 / 8,086 = 68.6 days
  → With 2hr/day, a F2P player CANNOT complete free tier in 30 days (intentional, creates urgency for premium).

  Premium adjustment: Premium track gives 2x XP gain.
  With premium (2hr/day): 555,000 / (8,086 * 2) = 34.3 days (just completable).
  Target: Premium players can finish with 2 hrs/day. F2P players need 4+ hrs/day.

\`\`\`lua
local BattlePass = {}

function BattlePass.xpForTier(tier: number): number
    return tier * 100 + 500
end

function BattlePass.totalXPNeeded(upToTier: number): number
    local total = 0
    for t = 1, upToTier do
        total = total + BattlePass.xpForTier(t)
    end
    return total
end

function BattlePass.currentTier(totalXP: number): number
    local xpRemaining = totalXP
    local tier = 0
    while xpRemaining > 0 do
        tier = tier + 1
        local needed = BattlePass.xpForTier(tier)
        if xpRemaining < needed then break end
        xpRemaining = xpRemaining - needed
    end
    return tier
end

function BattlePass.xpForCurrentTier(totalXP: number, tier: number): number
    local xpUsedBefore = BattlePass.totalXPNeeded(tier - 1)
    return totalXP - xpUsedBefore
end

return BattlePass
\`\`\`

[7.3] REWARD DESIGN
  Free track: Every other tier. Coins, gems, basic cosmetics.
  Premium track: Every tier. All free rewards PLUS: exclusive cosmetics, premium currency, rare items.

  Milestone rewards (every 10 tiers on premium):
    Tier 10: Unique particle effect
    Tier 20: Exclusive weapon skin
    Tier 30: Character accessory
    Tier 40: Unique chat bubble
    Tier 50: Pet/companion with exclusive animation
    Tier 60: Weapon trail effect
    Tier 70: Title badge
    Tier 80: Exclusive map or area access
    Tier 90: Signature emote
    Tier 100: Season Champion title + cosmetic bundle worth 3x cost

[7.4] PRICING
  Battle pass cost: 400 Robux (equivalent to ~$5 USD)
  Premium + XP boost bundle: 800 Robux (~$10 USD)
  "Level Up" pack: 200 Robux for 10 tiers skipped (do not price higher than 20 Robux/tier)

  Value math: Tier 100 rewards should be worth minimum 3x the purchase price in perceived value.
  If BP costs 400 Robux and rewards include 200 Robux in gems + 15 exclusive items → very good value.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PART 8: MONETIZATION ETHICS (ROBLOX / KIDS AUDIENCE)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[8.1] CORE ETHICAL PRINCIPLES

PRINCIPLE 1: NEVER PAY-TO-WIN
  Paying players must NOT have combat/progression stat advantages over F2P players.
  ALLOWED: Cosmetics, time-savers, quality-of-life, extra content, more of a thing.
  NOT ALLOWED: +attack from Robux, stat bonuses from paid items, exclusive content that blocks gameplay.

  Test: A max-Robux player vs. a skilled F2P veteran — the skilled player should be able to win.

PRINCIPLE 2: VALUE CLARITY
  Always show what the player gets before they spend any currency.
  Show the item preview. List every item in the bundle. No "mystery purchases" for real money.
  For in-game currency purchases: previews are still good practice but less critical.

PRINCIPLE 3: NO PREDATORY MECHANICS FOR MINORS
  Countdown timers creating urgency on REAL MONEY purchases → predatory.
  "Only 2 left!" fake scarcity → predatory.
  Removing the ability to compare prices → predatory.
  Auto-renewing subscriptions without clear notice → predatory.

  Countdown timers on free event items → ethical (it's just the event timeline).
  "Sale ends Sunday" on a standard sale → ethical (honest timing).

PRINCIPLE 4: TRANSPARENT ODDS
  Gacha / loot boxes must show drop rates clearly in-game.
  Format: "Legendary: 1% | Epic: 4% | Rare: 15% | Uncommon: 30% | Common: 50%"
  This is law in several countries. Be ahead of regulations, not behind them.

PRINCIPLE 5: ACCESSIBLE F2P PATH
  Every item in the game should be theoretically earnable by F2P players.
  Premium items: earnable through gameplay at a reasonable pace.
  Exclusive limited items: the exception (1-2 per year max). These are fine — they reward active players.

[8.2] GAMEPASS PRICING GUIDE

Gamepass tiers:
  $5 (~50 Robux): Quality of life. Double carry capacity, keep coins on death, auto-sell.
  $10 (~100 Robux): Significant convenience. 2x offline earnings, extra daily quests, auto-buy toggle.
  $20 (~200 Robux): Major content. New game area, exclusive quest chain, unique building/tool.
  $50 (~500 Robux): Mega pack. Multiple areas + exclusive cosmetics + lifetime perks.

Never charge more than $10 for a single cosmetic item (unless it's a massive bundle).
Best practice: Multiple price points so every budget can find value.

[8.3] DEV PRODUCT PRICING GUIDE

Small purchase (25-100 Robux):
  Uses: 50 coins, 500 coins, energy refill, single loot box key, small gem pack.
  Target: Impulse purchase. Should be purchasable without much thought.

Medium purchase (250-500 Robux):
  Uses: XP boost (24 hr), premium currency bundle, equipment box, event currency pack.
  Target: Considered purchase. Offer clear value comparison.

Large purchase (1000+ Robux):
  Uses: Starter pack (big value bundle), season pass, mega gem pack.
  Target: High-value buyer. Show the savings vs. buying separately.

[8.4] PREMIUM BENEFITS (ROBLOX PREMIUM SUBSCRIPTION)
  Roblox Premium players subscribe through Roblox directly.
  Reward them in your game without locking core gameplay.

  Good Premium benefits:
    +10% bonus coins on all earnings
    1 extra daily quest slot
    Access to Premium-only cosmetic color
    15% shop discount on coin-priced items
    "Premium" badge next to name (social status)

  Bad Premium benefits:
    +20% attack stat (pay-to-win)
    Exclusive game zones (blocks core gameplay)
    Faster respawn (combat advantage)

[8.5] STARTER PACK STRATEGY
  The starter pack is the most impactful first-purchase nudge.
  Show it once to new players (day 1 or 2). Never spam it.

  Good starter pack ($5 Robux equivalent):
    "New Player Bundle: 2,500 gems + 5 rare items + Starter Trail effect"
    Show the value: "Worth 4,500 gems if bought separately. 44% off!"
    Available for first 7 days only. After that, it's gone.

  This leverages: Loss aversion (leaving money on table), FOMO (7 days only), value clarity.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PART 9: COMPLETE LUAU ECONOMY MODULE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

\`\`\`lua
-- GameEconomy.lua
-- Master economy module for Roblox games
-- Compatible with Roblox DataStoreService and RemoteEvents

local GameEconomy = {}

-- ================================
-- CURRENCY MANAGEMENT
-- ================================

local DEFAULT_CURRENCIES = {
    coins = 0,
    gems = 0,
    eventTokens = 0,
    reputation = 0
}

function GameEconomy.getDefaultWallet(): table
    local wallet = {}
    for k, v in pairs(DEFAULT_CURRENCIES) do
        wallet[k] = v
    end
    return wallet
end

function GameEconomy.addCurrency(wallet: table, currency: string, amount: number): boolean
    if not wallet[currency] then return false end
    wallet[currency] = wallet[currency] + amount
    return true
end

function GameEconomy.spendCurrency(wallet: table, currency: string, amount: number): boolean
    if not wallet[currency] then return false end
    if wallet[currency] < amount then return false end
    wallet[currency] = wallet[currency] - amount
    return true
end

function GameEconomy.formatCurrency(amount: number): string
    if amount >= 1e12 then return string.format("%.1fT", amount / 1e12)
    elseif amount >= 1e9 then return string.format("%.1fB", amount / 1e9)
    elseif amount >= 1e6 then return string.format("%.1fM", amount / 1e6)
    elseif amount >= 1e3 then return string.format("%.1fK", amount / 1e3)
    else return tostring(math.floor(amount))
    end
end

-- ================================
-- UPGRADE SYSTEM
-- ================================

GameEconomy.UpgradeCurves = {}

function GameEconomy.UpgradeCurves.linear(base: number, increment: number, level: number): number
    return math.floor(base + level * increment)
end

function GameEconomy.UpgradeCurves.exponential(base: number, mult: number, level: number): number
    return math.floor(base * (mult ^ level))
end

function GameEconomy.UpgradeCurves.polynomial(base: number, exp: number, level: number): number
    return math.floor(base * (level ^ exp))
end

function GameEconomy.UpgradeCurves.compound(base: number, level: number, rampDiv: number?, power: number?): number
    local d = rampDiv or 10
    local p = power or 2.5
    return math.floor(base * ((1 + level / d) ^ p))
end

-- ================================
-- INCOME SYSTEM
-- ================================

function GameEconomy.calculateIncome(
    baseIncome: number,
    upgradeCount: number,
    multiplierBoosts: number,
    eventBonus: number
): number
    local upgradeMultiplier = 1 + (upgradeCount * 0.25)
    return math.floor(baseIncome * upgradeMultiplier * multiplierBoosts * eventBonus)
end

function GameEconomy.timeToAfford(cost: number, incomePerSecond: number): number
    if incomePerSecond <= 0 then return math.huge end
    return cost / incomePerSecond
end

-- ================================
-- REBIRTH SYSTEM
-- ================================

function GameEconomy.rebirthMultiplier(count: number): number
    return 1.5 ^ count
end

function GameEconomy.rebirthRequirement(count: number, base: number): number
    return math.floor(base * (2.5 ^ count))
end

-- ================================
-- GACHA SYSTEM (Ethical with Pity)
-- ================================

GameEconomy.Gacha = {}

local RARITY_WEIGHTS = {
    {rarity = "Legendary", weight = 1},
    {rarity = "Epic",      weight = 4},
    {rarity = "Rare",      weight = 15},
    {rarity = "Uncommon",  weight = 30},
    {rarity = "Common",    weight = 50},
}

local PITY_RARE_THRESHOLD = 50
local PITY_LEGENDARY_THRESHOLD = 100

function GameEconomy.Gacha.pull(pityCount: number): (string, number)
    local newPity = pityCount + 1

    -- Hard pity
    if newPity >= PITY_LEGENDARY_THRESHOLD then
        return "Legendary", 0
    end

    -- Soft pity (guaranteed rare or better at 50)
    if newPity >= PITY_RARE_THRESHOLD then
        local roll = math.random(1, 20) -- 1 in 20 chance of legendary when in soft pity
        if roll == 1 then return "Legendary", 0 end
        return "Rare", newPity
    end

    -- Normal pull
    local total = 0
    for _, entry in ipairs(RARITY_WEIGHTS) do
        total = total + entry.weight
    end

    local roll = math.random(1, total)
    local accumulated = 0
    for _, entry in ipairs(RARITY_WEIGHTS) do
        accumulated = accumulated + entry.weight
        if roll <= accumulated then
            if entry.rarity == "Legendary" then
                return entry.rarity, 0 -- reset pity on legendary
            end
            return entry.rarity, newPity
        end
    end

    return "Common", newPity
end

-- ================================
-- DAILY QUEST SYSTEM
-- ================================

GameEconomy.DailyQuests = {}

local QUEST_TEMPLATES = {
    Easy = {
        {id = "earn_coins", text = "Earn {n} Coins", ranges = {500, 2000}, reward = {coins = 0, gems = 50}},
        {id = "open_chests", text = "Open {n} Chests", ranges = {2, 5}, reward = {coins = 200, gems = 25}},
        {id = "kill_enemies", text = "Defeat {n} Enemies", ranges = {10, 25}, reward = {coins = 300, gems = 30}},
    },
    Medium = {
        {id = "earn_coins_big", text = "Earn {n} Coins", ranges = {10000, 50000}, reward = {coins = 0, gems = 150}},
        {id = "upgrade_building", text = "Upgrade {n} Buildings", ranges = {3, 8}, reward = {coins = 1000, gems = 100}},
        {id = "win_matches", text = "Win {n} Matches", ranges = {3, 7}, reward = {coins = 500, gems = 200}},
    },
    Hard = {
        {id = "hatch_pet", text = "Hatch a {rarity} Pet", ranges = {1, 1}, reward = {coins = 2000, gems = 500}},
        {id = "reach_wave", text = "Reach Wave {n} in Tower Defense", ranges = {15, 30}, reward = {coins = 3000, gems = 400}},
        {id = "rebirth", text = "Perform a Rebirth", ranges = {1, 1}, reward = {coins = 5000, gems = 1000}},
    }
}

function GameEconomy.DailyQuests.generateForPlayer(userId: string, dayNumber: number): table
    -- Seed so it's deterministic per player per day
    local seed = (tonumber(string.sub(userId, -6)) or 999999) + dayNumber * 31337
    math.randomseed(seed)

    local quests = {}
    for tier, pool in pairs(QUEST_TEMPLATES) do
        local quest = pool[math.random(#pool)]
        local n = math.random(quest.ranges[1], quest.ranges[2])
        table.insert(quests, {
            id = quest.id,
            text = quest.text:gsub("{n}", tostring(n)):gsub("{rarity}", "Rare"),
            target = n,
            tier = tier,
            reward = quest.reward,
            progress = 0,
            completed = false
        })
    end
    return quests
end

function GameEconomy.DailyQuests.updateProgress(quest: table, eventType: string, amount: number): boolean
    if quest.completed then return false end
    if quest.id == eventType then
        quest.progress = math.min(quest.progress + amount, quest.target)
        if quest.progress >= quest.target then
            quest.completed = true
            return true -- newly completed
        end
    end
    return false
end

-- ================================
-- LOGIN STREAK SYSTEM
-- ================================

GameEconomy.LoginStreak = {}

local STREAK_REWARDS = {
    [1] = {coins = 100, gems = 0},
    [2] = {coins = 250, gems = 0},
    [3] = {coins = 500, gems = 2},
    [4] = {coins = 1000, gems = 0},
    [5] = {coins = 2000, gems = 5},
    [6] = {coins = 3500, gems = 10},
    [7] = {coins = 5000, gems = 25, bonus = "WeeklyExclusive"},
}

function GameEconomy.LoginStreak.getReward(streakDay: number): table
    local dayIndex = ((streakDay - 1) % 7) + 1
    return STREAK_REWARDS[dayIndex]
end

function GameEconomy.LoginStreak.streakMultiplier(days: number): number
    if days >= 30 then return 2.0
    elseif days >= 14 then return 1.5
    elseif days >= 7 then return 1.25
    elseif days >= 3 then return 1.1
    else return 1.0
    end
end

function GameEconomy.LoginStreak.checkEligibility(lastLoginTimestamp: number): boolean
    local now = os.time()
    local hoursSince = (now - lastLoginTimestamp) / 3600
    return hoursSince >= 20 -- 20-hour minimum to be generous
end

function GameEconomy.LoginStreak.wouldBreak(lastLoginTimestamp: number): boolean
    local now = os.time()
    local hoursSince = (now - lastLoginTimestamp) / 3600
    return hoursSince >= 48 -- break after 48 hours missed
end

-- ================================
-- BATTLE PASS SYSTEM
-- ================================

GameEconomy.BattlePass = {}

function GameEconomy.BattlePass.xpForTier(tier: number): number
    return tier * 100 + 500
end

function GameEconomy.BattlePass.totalXPForTier(targetTier: number): number
    local total = 0
    for t = 1, targetTier do
        total = total + GameEconomy.BattlePass.xpForTier(t)
    end
    return total
end

function GameEconomy.BattlePass.currentTierFromXP(totalXP: number): number
    local remaining = totalXP
    for tier = 1, 100 do
        local needed = GameEconomy.BattlePass.xpForTier(tier)
        if remaining < needed then
            return tier, remaining, needed
        end
        remaining = remaining - needed
    end
    return 100, 0, 0
end

function GameEconomy.BattlePass.xpFromSession(sessionMinutes: number, isPremium: boolean): number
    local base = math.floor(sessionMinutes / 5) * 200 -- 200 XP per 5 min
    return if isPremium then base * 2 else base
end

-- ================================
-- ECONOMY HEALTH MONITOR
-- ================================

GameEconomy.HealthMonitor = {}

function GameEconomy.HealthMonitor.checkInflation(
    totalCoinsInCirculation: number,
    activePlayers: number,
    averageLevel: number
): table
    local coinsPerPlayer = totalCoinsInCirculation / math.max(activePlayers, 1)
    local expectedCoinsAtLevel = 1000 * (2 ^ (averageLevel / 10))
    local inflationRatio = coinsPerPlayer / expectedCoinsAtLevel

    local status = "healthy"
    local recommendation = ""

    if inflationRatio > 3.0 then
        status = "severe_inflation"
        recommendation = "Add more coin sinks immediately. Consider a coin drain event."
    elseif inflationRatio > 2.0 then
        status = "moderate_inflation"
        recommendation = "Increase shop prices or add a rotating luxury shop."
    elseif inflationRatio > 1.5 then
        status = "mild_inflation"
        recommendation = "Monitor. May naturally resolve as high-level content is added."
    elseif inflationRatio < 0.5 then
        status = "deflation"
        recommendation = "Increase coin drop rates or add a bonus coin event."
    end

    return {
        status = status,
        inflationRatio = inflationRatio,
        coinsPerPlayer = coinsPerPlayer,
        recommendation = recommendation
    }
end

return GameEconomy
\`\`\`

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PART 10: GAME TYPE ECONOMY TEMPLATES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[10.1] TYCOON ECONOMY TEMPLATE

Game: TycoonTemplate
Currencies: Coins (primary), Gems (premium)
Session target: 30-60 min first rebirth
Monetization: Double-coin gamepass (200R), Exclusive dropper pack (400R), Auto-collect gamepass (150R)

Configuration:
  baseCost = 100, multiplier = 1.35
  baseIncome = 1 coin/sec per dropper level
  rebirthBase = 1,000,000 coins
  rebirthMultiplier = 1.5x per rebirth

Money sinks: Upgrade costs (primary), Rebirth requirement, Cosmetic shop
Engagement hooks: Rebirth milestone, daily bonus, dropper collection drive

\`\`\`lua
local TycoonTemplate = {
    currencies = {
        primary = {name = "Coins", icon = "💰", startAmount = 0},
        premium = {name = "Gems", icon = "💎", startAmount = 0},
    },
    upgrades = {
        dropper = {baseCost = 100, multiplier = 1.35, incomeFormula = "level"},
        multiplierX2 = {cost = 12000, effect = 2.0},
        multiplierX5 = {cost = 50000, effect = 5.0},
        multiplierX10 = {cost = 150000, effect = 10.0},
    },
    rebirth = {
        requirement = 1000000,
        requirementScaling = 2.5,
        multiplierGain = 1.5,
    },
    gamepasses = {
        doubleCoins = {robuxCost = 200, effect = "2x coin gain", type = "permanent"},
        autoCollect = {robuxCost = 150, effect = "Auto-collect from all droppers", type = "permanent"},
        exclusiveDropper = {robuxCost = 400, effect = "Golden Dropper: 50 coins/sec", type = "permanent"},
    }
}
\`\`\`

[10.2] SIMULATOR ECONOMY TEMPLATE

Game: SimulatorTemplate
Currencies: Power (primary), Diamonds (premium), Stars (event)
Session target: Visible stat growth each 5-minute session

Configuration:
  toolCosts = polynomial exponent 2.0, base 500
  petCosts = polynomial exponent 2.5, base 1000
  areas = 6 areas, each 5x stat requirement of previous
  rebirths = additive (+1 base multiplier per rebirth)

\`\`\`lua
local SimulatorTemplate = {
    currencies = {
        primary = {name = "Power", icon = "⚡", startAmount = 0},
        premium = {name = "Diamonds", icon = "💠", startAmount = 0},
        event = {name = "Stars", icon = "⭐", seasonal = true},
    },
    tools = {
        baseCost = 500,
        costExponent = 2.0,
        powerPerTool = {1, 2, 5, 12, 30, 75, 185, 460, 1150, 2880} -- per tool index
    },
    pets = {
        baseCost = 1000,
        costExponent = 2.5,
        maxEquipped = 3,
        bonusPerPet = 0.20 -- 20% boost per equipped pet
    },
    areas = {
        requirements = {0, 100, 500, 2500, 12500, 62500},
        incomeMultipliers = {1, 2, 4, 8, 16, 32}
    },
    rebirth = {
        requirement = 100000, -- total power earned
        requirementScaling = 5,
        multiplierGain = 1 -- additive, so rebirths add +1 each time
    }
}
\`\`\`

[10.3] RPG ECONOMY TEMPLATE

Game: RPGTemplate
Currencies: Gold (primary), Crystals (premium), Honor (reputation)
Progression: Level 1-100, gear tiers (Common → Legendary)

\`\`\`lua
local RPGTemplate = {
    currencies = {
        primary = {name = "Gold", icon = "🪙", startAmount = 100},
        premium = {name = "Crystals", icon = "🔮", startAmount = 0},
        reputation = {name = "Honor", icon = "🏅", startAmount = 0},
    },
    leveling = {
        baseXP = 100,
        exponent = 1.5,
        maxLevel = 100
    },
    stats = {
        hp = {base = 100, perLevel = 10},
        attack = {base = 10, perLevel = 1},
        defense = {base = 5, perLevel = 0.5},
        speed = {base = 16, perLevel = 0} -- studs/sec, no scaling
    },
    gearRarity = {"Common", "Uncommon", "Rare", "Epic", "Legendary"},
    gearDropRates = {0.50, 0.30, 0.15, 0.04, 0.01},
    questRewards = {
        easy = {gold = 100, xp = 50},
        medium = {gold = 500, xp = 200},
        hard = {gold = 2000, xp = 800},
        legendary = {gold = 10000, xp = 5000, crystals = 10}
    }
}
\`\`\`

[10.4] BATTLE PASS TEMPLATE

Usable as an add-on to any game type.

\`\`\`lua
local BattlePassTemplate = {
    tierCount = 100,
    duration = 30, -- days
    cost = {
        free = 0,
        premium = 400, -- Robux
        premiumPlus = 800, -- Robux, includes 10 tier skips
    },
    xpSources = {
        dailyChallenge = {xp = 500, count = 3},
        weeklyChallenge = {xp = 2500, count = 5},
        gameplayPerSession = {xp = 200, sessionMinutes = 5},
        winBonus = {xp = 100},
    },
    premiumBonus = {
        xpMultiplier = 2.0,
        exclusiveMilestones = {10, 20, 30, 40, 50, 60, 70, 80, 90, 100},
    },
    freeRewards = {
        -- Every other tier gets a reward on free track
        evenTiers = true,
        rewardTypes = {"coins", "gems", "cosmetics", "items"}
    }
}
\`\`\`

[10.5] IDLE ECONOMY TEMPLATE

\`\`\`lua
local IdleTemplate = {
    currencies = {
        primary = {name = "Coins", icon = "💰", startAmount = 0},
        premium = {name = "Gems", icon = "💎", startAmount = 0},
    },
    buildings = {
        count = 8,
        names = {"Lemonade Stand", "Cookie Bakery", "Pizza Shop", "Game Arcade",
                 "Car Wash", "Shopping Mall", "Airport", "Space Station"},
        baseCosts = {10, 100, 1100, 12000, 130000, 1400000, 20000000, 300000000},
        baseIncome = {0.1, 0.5, 4, 20, 100, 400, 2500, 25000}, -- per second at upgrade 0
        upgradeCostMultiplier = 1.15
    },
    offline = {
        rate = 0.50, -- 50% of online rate
        maxDuration = 28800, -- 8 hours max
        premiumRate = 1.00, -- 100% with gamepass
        premiumGamepassCost = 250 -- Robux
    },
    prestige = {
        threshold = 1000000,
        thresholdScaling = 5,
        multiplierFormula = "sqrt(lifetimeEarnings / 1000)"
    }
}
\`\`\`

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PART 11: ANTI-CHEAT ECONOMIC PROTECTION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[11.1] SERVER-SIDE VALIDATION

All economy transactions MUST happen on the server. Never trust the client for currency changes.

\`\`\`lua
-- Server-side economy validation
local EconomyValidator = {}

-- Maximum coins a player can legitimately earn per minute
-- Used to detect exploit/speed-hack
local MAX_COINS_PER_MINUTE = {
    early = 5000,   -- level 1-10
    mid = 50000,    -- level 11-30
    late = 500000,  -- level 31-60
    endgame = 10000000 -- level 61+
}

function EconomyValidator.validateEarnRate(
    coinsEarned: number,
    timeElapsedSeconds: number,
    playerLevel: number
): boolean
    local coinsPerMinute = coinsEarned / (timeElapsedSeconds / 60)
    local maxAllowed

    if playerLevel <= 10 then maxAllowed = MAX_COINS_PER_MINUTE.early
    elseif playerLevel <= 30 then maxAllowed = MAX_COINS_PER_MINUTE.mid
    elseif playerLevel <= 60 then maxAllowed = MAX_COINS_PER_MINUTE.late
    else maxAllowed = MAX_COINS_PER_MINUTE.endgame
    end

    return coinsPerMinute <= maxAllowed * 1.5 -- 50% buffer for legitimate spikes
end

function EconomyValidator.validatePurchase(
    wallet: table,
    currency: string,
    cost: number
): boolean
    if not wallet[currency] then return false end
    if wallet[currency] < cost then return false end
    if cost <= 0 then return false end -- prevent free purchases from bugs
    if cost > 1e15 then return false end -- sanity check for overflow
    return true
end

function EconomyValidator.validateCurrencyAmount(amount: number): boolean
    return amount >= 0 and amount <= 1e15 and amount == amount -- NaN check
end

return EconomyValidator
\`\`\`

[11.2] TRANSACTION LOGGING

Log all significant transactions for audit and exploit detection.

\`\`\`lua
local TransactionLog = {}
local httpService = game:GetService("HttpService")

function TransactionLog.record(
    userId: string,
    transactionType: string, -- "earn", "spend", "purchase", "transfer"
    currency: string,
    amount: number,
    reason: string,
    context: table?
): string
    local entry = {
        id = httpService:GenerateGUID(false),
        userId = userId,
        type = transactionType,
        currency = currency,
        amount = amount,
        reason = reason,
        timestamp = os.time(),
        context = context or {}
    }

    -- Store to DataStore (abbreviated — implement full persistence separately)
    -- LogDataStore:SetAsync(entry.id, entry)

    return entry.id
end

return TransactionLog
\`\`\`

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PART 12: ECONOMY DESIGN CHECKLIST
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Before publishing ANY game economy, check:

CURRENCY DESIGN
☐ 2-4 currencies defined with clear purpose for each
☐ Primary currency feels earnable in first 5 minutes
☐ Premium currency cannot buy stat advantages
☐ Exchange rates are explicit and consistent
☐ Currency displays formatted correctly (no "1000000" — should be "1M")

PRICING MATH
☐ Early upgrade takes 1-2 minutes to afford (at base income)
☐ Mid-game upgrade takes 15-30 minutes to afford
☐ Late-game upgrade takes 1-2 hours to afford
☐ No "dead zones" where there's nothing to spend on
☐ Cost curves tested across full progression arc

INFLATION PREVENTION
☐ At least 4 active money sinks
☐ Economy tested at 100x expected player progression
☐ Shop always has something relevant to buy at every wealth level
☐ Repair/maintenance costs balanced against earn rate

ENGAGEMENT
☐ Daily login rewards implemented and tested
☐ Daily quest system with 3 tiers
☐ Achievement system with 60+ achievements
☐ Battle pass or equivalent seasonal content

MONETIZATION ETHICS
☐ No pay-to-win elements (all purchases audit passed)
☐ Drop rates displayed clearly
☐ Pity system implemented for gacha
☐ Starter pack shown once, not repeatedly
☐ No countdown timers on direct Robux purchases
☐ F2P path exists for all items (even if slow)

TECHNICAL
☐ All currency changes server-side validated
☐ Transaction logging implemented
☐ Earn rate validation prevents exploit inflation
☐ DataStore persistence tested with server restart

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PART 13: PSYCHOLOGICAL TRIGGERS IN UX
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[13.1] NOTIFICATION DESIGN
  "You can afford the next upgrade!" — actionable, immediate
  "Your offline earnings: +12,450 coins!" — pleasant surprise
  "3 days left in the event!" — healthy urgency
  "BuddyPlayer123 just surpassed you on the leaderboard!" — social pressure
  "Achievement unlocked: First Rebirth!" — milestone celebration

  Never: "BUY NOW! LIMITED TIME!" in system notifications (spam, not engagement)

[13.2] SHOP UI PSYCHOLOGY
  Most expensive item in top-right or top-center (anchoring effect)
  "Best Value" badge on mid-tier bundle (drives mid-tier purchases, highest volume)
  Show items leaving the shop soon at top of list with timer
  Before/after comparison on upgrades: "Your income: 100/sec → 350/sec"
  Wishlist feature: "Mark for later" reduces abandonment

[13.3] ONBOARDING ECONOMY
  First minute: Give player their first currency automatically (don't make them earn it)
  First 5 minutes: Guide to first purchase — make it free or nearly free
  First 10 minutes: First significant upgrade that visibly changes gameplay
  First 30 minutes: First rebirth opportunity or major milestone
  First session end: Show "while you're away, you'll earn X coins" — anticipation hook

[13.4] RE-ENGAGEMENT NOTIFICATIONS
  "It's been 2 days. Your farm has been growing — come collect!"
  "Your streak is at 6 days. Don't miss tomorrow for the big day 7 reward!"
  "Weekend event starts in 1 hour! Exclusive items available!"

[13.5] CELEBRATION MOMENTS
  Every major milestone gets:
    - Sound effect (distinct, satisfying)
    - Screen flash or particle burst
    - Badge/title unlock notification
    - Social shout-out to server (opt-in)

  Celebration moments by milestone:
  - First upgrade purchased
  - First 1,000 coins
  - First 10 levels
  - First pet / tool upgrade
  - First rebirth
  - First legendary item
  - Level 50
  - Level 100 (max)
  - Top 10 on leaderboard

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PART 14: ADVANCED ECONOMY PATTERNS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[14.1] DUAL PRESTIGE SYSTEM (Advanced Tycoon/Simulator)
  Layer 1: Rebirth — reset within a season. Quick, happens every 30-60 min initially.
  Layer 2: Ascension — resets rebirths too. Happens every 5-10 hours. Major milestone.
  Layer 3: Legacy — resets ascensions. Happens every 50+ hours. Endgame only.

  Each layer gives different permanent bonuses:
  Rebirth: +50% income multiplier
  Ascension: New visual aura + cosmetic unlock + larger income bonus
  Legacy: Unique title + massive multiplier + exclusive area access

[14.2] SEASONAL ECONOMY RESET
  Every 90 days: Full economy reset for ALL players.
  Why: Prevents wealth gap from becoming insurmountable. Keeps game fresh.
  Compensation: Top players keep cosmetics, titles, and badges. Only currency/gear resets.
  Announcement: 2-week warning. Give top players exclusive "Season X Champion" badge.

  This is used by games like Diablo (seasons), Path of Exile (leagues), RuneScape (leagues).
  Creates fresh start excitement + competitive drives everyone back on day 1.

[14.3] GUILD ECONOMY
  Guild treasury: Shared pool. Members donate coins.
  Guild upgrades: Uses treasury. Benefits all members.
  Guild quests: Earn guild coins. Spend on guild-exclusive items.
  Guild shop: Items unavailable anywhere else (social exclusivity).

  Guild tier system (based on treasury contributions over season):
  Bronze: 0-100K contributed
  Silver: 100K-1M contributed
  Gold: 1M-10M contributed
  Platinum: 10M-100M contributed
  Diamond: 100M+ contributed

  Each tier unlocks better guild upgrades and shop items.

[14.4] PLAYER-DRIVEN MARKETPLACE
  Players list items for sale. Other players buy with primary currency.
  Transaction fee: 7% (2% listing + 5% sale tax) — economy drain.
  Price floor: Minimum 10% of shop value (prevents undercutting to zero).
  Price ceiling: Maximum 500% of shop value (prevents artificial scarcity).

  Market health metrics to monitor:
  - Average transaction volume per day
  - Price index for 5 benchmark items (track inflation)
  - Listings vs. sales ratio (low = healthy, high = too many sellers)

[14.5] SKILL TREE ECONOMY
  Skill points: 1 per level. Use on skill tree.
  Skill nodes: 200 total. Player can max 100 (forced choices).
  Respec cost: 50% of total skill points * 1,000 coins per point
    (e.g., 50 skill points spent = 25,000 coins to respec)
  Increasing respec costs encourage commitment but allow flexibility.

\`\`\`lua
local function respecCost(skillPointsSpent: number, coinsPerPoint: number?): number
    local cpp = coinsPerPoint or 1000
    return math.floor(skillPointsSpent * 0.5 * cpp)
end
\`\`\`

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PART 15: ECONOMY BALANCING GUIDE (ITERATIVE)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Step 1: Set income baseline
  Decide: How many coins does a new player earn in their first minute?
  Target: 50-200 coins/minute. Name this B.

Step 2: Set first upgrade cost
  Target: Player can afford first upgrade in 1-3 minutes.
  First upgrade cost: B * 2 (2 minutes to afford).

Step 3: Set early game pacing
  Upgrades 2-10 should each take roughly 2x longer than the previous.
  Cost[n] = Cost[1] * 1.5^(n-1) (rough guide)

Step 4: Scale income with upgrades
  After each upgrade, income should increase by 25-50%.
  Verify: time-to-next-upgrade stays in the sweet spot range (Part 2.6).

Step 5: Playtesting loop
  Play your own game. Time each upgrade. Feel the pacing.
  Too fast early: Increase multiplier. Too slow: Decrease.
  This requires real playtesting, not just math.

Step 6: Economy simulation
  Run a 3-hour simulation:
  Every minute: calculate income earned, upgrades purchased, current level.
  Check: Is the player still progressing at hour 3? Is there still content?
  If they've maxed everything in < 1 hour: Add more content or slow multiplier.
  If they're stuck at hour 1: Reduce costs or increase income.

Step 7: Live monitoring
  After launch, check:
  - Average session length (target: 20-40 min for casual, 60+ for dedicated)
  - Day 1 retention (target: >40%)
  - Day 7 retention (target: >15%)
  - Revenue per user (track but don't obsess early)
  - Common drop-off points (where do players quit? Fix that first.)
`

// ============================================================
// SUBSET EXPORTS
// ============================================================

export const ECONOMY_CURRENCY: string = `
=== CURRENCY DESIGN SUBSET ===

CURRENCY TYPES:
1. Primary (Coins/Cash/Gold) — earned through gameplay, spent on upgrades
2. Premium (Gems/Crystals) — from Robux or rare drops, cosmetics + time savers only
3. Event (Snowflakes/Candy) — seasonal, expires, never purchasable for real money
4. Reputation (Honor/Prestige) — faction/social currency, drives community
5. Guild (Guild Coins) — shared pool, contribution-based

BALANCE RULES:
- Premium NEVER buys power. Cosmetics + time savings only.
- Primary = always earnable, never fully depleted by design
- Display: commas below 10K, abbreviations above (1.2K, 4.5M, 2.1B)
- Exchange: 1 Robux = 10 in-game gems (standard). Scale bonuses for larger purchases.

EXCHANGE RATE TABLE:
  80R → 800 gems (10:1)
  160R → 1,800 gems (11.25:1)
  400R → 5,000 gems (12.5:1)
  800R → 11,000 gems (13.75:1)

LUAU FORMAT CODE:
  local function formatNumber(n)
    if n >= 1e6 then return string.format("%.1fM", n/1e6)
    elseif n >= 1e3 then return string.format("%.1fK", n/1e3)
    else return tostring(math.floor(n)) end
  end

MULTI-CURRENCY DESIGN PRINCIPLES:
- Never more than 4 currencies (confusion threshold)
- Each currency needs its own earn path AND spend path
- Secondary currencies only introduced after primary is understood (tutorial gate)
- Premium-to-primary conversion: cap at 500 gems/week via conversion to prevent abuse
- Dead-end economies kill retention: always have something to spend on at every wealth level
`

export const ECONOMY_PROGRESSION: string = `
=== PROGRESSION CURVES SUBSET ===

UPGRADE COST FORMULAS:
  Linear: cost = baseCost + (level * increment)
    Use for: consumables, minor upgrades

  Exponential: cost = baseCost * (multiplier ^ level)
    1.15x = slow ramp, 1.35x = medium, 1.50x = fast, 2.0x = extreme
    Use for: tycoon droppers, idle buildings, simulator tools

  Polynomial: cost = baseCost * (level ^ exponent)
    1.5 exp = gradual, 2.0 exp = medium, 2.5 exp = fast, 3.0 exp = hardcore
    Use for: RPG stats, skill upgrades, character progression

  Compound: cost = baseCost * ((1 + level/10) ^ 2.5)
    Tunable: change divisor and power for custom feel
    Use for: general-purpose upgrades

TIME-TO-NEXT SWEET SPOTS:
  Tutorial (levels 1-3): 30-120 seconds
  Early game (levels 4-10): 2-5 minutes
  Mid game (levels 11-25): 15-30 minutes
  Late game (levels 26-50): 1-2 hours
  End game (51+): 4-24 hours

GAME TYPE TARGETS:
  Tycoon: First rebirth at 30-60 min. Cost multiplier 1.35. Income = level coins/sec.
  Simulator: Area unlock by stat threshold (5x each area). Rebirths additive +1 multiplier.
  RPG: XP = 100 * level^1.5. Levels 1-10 fast (5min), 10-30 medium, 30-50 slow.
  Idle: 50% offline rate, 8hr cap. Prestige = sqrt(lifetimeEarnings/1000) multiplier.
  Tower Defense: Enemy HP = base * 1.1^wave. Tower costs +50% each purchase of same type.
  Racing: Car costs exponential 1.6x. Stat upgrades polynomial 2.0.
  Battle Royale: No in-match economy. Post-match cosmetic unlock only.

REBIRTH / PRESTIGE FORMULAS:
  Rebirth multiplier: 1.5^rebirthCount (50% per rebirth)
  Rebirth requirement: base * 2.5^rebirthCount (each rebirth takes 2.5x longer)
  Prestige multiplier: sqrt(lifetimeEarnings / 1000) — rewards more playtime before prestige

INCOME FORMULA:
  earnings = baseIncome * (1 + upgradeCount * 0.25) * multiplierBoosts * eventBonus
  event multipliers: normal 1.0, 2x event 2.0, 4x event 4.0
`

export const ECONOMY_MONETIZATION: string = `
=== MONETIZATION SUBSET ===

ETHICS FIRST:
  NEVER pay-to-win. Zero stat advantages from real money.
  ALWAYS show what you get before purchase.
  NEVER fake scarcity or countdown timers on Robux items.
  ALWAYS display gacha odds clearly.
  ALWAYS have a F2P path for every item.

GAMEPASS PRICING:
  ~50 Robux ($1): Cosmetic item, minor UI change
  ~100 Robux ($2): QoL upgrade (auto-sell, extra slots)
  ~200 Robux ($5): Significant convenience (2x offline, auto-buy)
  ~400 Robux ($10): Major feature (exclusive area, unique tool)
  ~800 Robux ($20): Premium pack (multiple areas + cosmetics)

DEVPRODUCT PRICING:
  25-100 Robux: Small packs (500 coins, 50 gems, energy refill)
  250-500 Robux: Medium packs (XP boost 24h, gem bundles)
  1000+ Robux: Mega packs (starter bundle, season pass, large gem pack)

STARTER PACK STRATEGY:
  Show once on day 1 or 2. Never spam.
  Format: "New Player Bundle: 2,500 gems + 5 rare items + Trail Effect — 44% off!"
  Available 7 days only. Creates urgency without predatory tactics.

PREMIUM BENEFITS (Roblox subscription):
  Good: +10% coins earned, 1 extra daily quest, premium badge, 15% shop discount
  Bad: +attack stat, exclusive gameplay zones, faster respawn (combat advantage)

BATTLE PASS:
  Free tier: Every other tier, decent rewards
  Premium: 400 Robux, 2x XP, every tier, exclusive milestone cosmetics
  Tier skip: 200 Robux for 10 tiers (20R/tier max)
  Season Champion reward (tier 100): worth 3x the BP cost in perceived value

GACHA ETHICS:
  Pity counter: visible, persistent, guaranteed rare at 50, legendary at 100
  Display odds in UI: "Legendary: 1% | Epic: 4% | Rare: 15%"
  Never remove pity counter between sessions
  F2P earnable: ~2 pulls/day. Premium track: ~5 pulls/day.
`

export const ECONOMY_ENGAGEMENT: string = `
=== ENGAGEMENT PSYCHOLOGY SUBSET ===

THE 6 CORE HOOKS (implement minimum 4):
  1. Daily chest to open (anticipation)
  2. Offline growth visible on return (progress)
  3. Streak that hurts to break (investment)
  4. Guild daily contribution (social obligation)
  5. Event with deadline (completion drive)
  6. Friend on leaderboard (competition)

PSYCHOLOGICAL TRIGGERS:
  Variable ratio: Random drops more addictive than fixed. Mix guaranteed + random.
  Loss aversion: Limited-time offers work. Players fear missing more than they desire gaining.
  Near-miss: "Pity: 47/100 to Legendary!" shows progress, motivates next pull.
  Collection drive: "Collect all 6 armor pieces for set bonus" — 72% of players complete sets.
  Sunk cost: Show "47 hours played, 200 achievements" — celebrates journey, not a purchase pusher.
  Social proof: "8 players bought this gamepass this week" in shop UI.

DAILY LOGIN REWARDS (7-DAY CYCLE):
  Day 1: 100 coins | Day 2: 250 | Day 3: 500 coins + item
  Day 4: 1,000 | Day 5: 2,000 coins + 5 gems
  Day 6: 3,500 coins + rare item | Day 7: 5,000 coins + 25 gems + exclusive
  Reset on miss (or use non-reset for more casual games)
  Monthly loyalty: 20/30 days → legendary bonus

STREAK MULTIPLIERS:
  3 days: 1.1x | 7 days: 1.25x + gems | 14 days: 1.5x + item | 30 days: 2.0x + monthly exclusive
  Streak shield item: Saves one missed day. Earnable or small purchase (~50R).

SESSION GOALS:
  5-minute loop: Earn → Spend → Earn more → Visual feedback → Sound/notification
  20-minute goal: Daily quest + upgrade milestone + area unlock
  Daily quests: Easy (50 gems reward) / Medium (150 gems) / Hard (500 gems) / Complete all 3 (bonus)
  Weekly goals: 7 quests, complete 5/7 → premium reward, 7/7 → ultra reward

ACHIEVEMENT DESIGN:
  Categories: Combat, Collection, Exploration, Social, Economic, Mastery
  Per category: 20-40 achievements (total 120-240)
  Rewards: Coins + titles/badges (never stat gear)
  Server announcement for rare achievements (social proof in action)

ONBOARDING ECONOMY:
  Minute 1: Auto-gift starting coins (don't make them earn first)
  Minute 1-5: Guide first free/cheap purchase
  Minute 5-10: First visible upgrade impact
  Minute 10-30: First milestone (rebirth preview, level 10, first area unlock)
  End of session: Show offline earnings preview (anticipation hook for return)
`

export const ECONOMY_FORMULAS: string = `
=== MATH FORMULAS SUBSET ===

COST CURVES:
  Linear:      cost = base + (level * increment)
  Exponential: cost = base * (mult ^ level)          -- common mults: 1.15, 1.35, 1.50
  Polynomial:  cost = base * (level ^ exp)            -- common exps: 1.5, 2.0, 2.5
  Compound:    cost = base * ((1 + level/10) ^ 2.5)   -- tunable

INCOME:
  earnings = baseIncome * (1 + upgradeCount * 0.25) * multiplierStack * eventBonus

TIME-TO-NEXT:
  seconds = upgradeCost / earningsPerSecond

REBIRTH:
  rebirthMultiplier = 1.5 ^ rebirthCount
  rebirthRequirement[n] = baseRequirement * (2.5 ^ n)

PRESTIGE (IDLE):
  prestigeMultiplier = sqrt(lifetimeEarnings / 1000)

ELO (FIGHTING/COMPETITIVE):
  expected = 1 / (1 + 10 ^ ((opponentELO - myELO) / 400))
  change = K * (actual - expected)    -- K=32 <20 games, K=24 medium, K=16 veteran
  actual = 1 if win, 0 if lose

ENEMY SCALING:
  Tower Defense HP: base * (1.1 ^ (wave - 1))
  RPG enemy HP: 50 * (1.2 ^ (enemyLevel - 1))
  RPG XP reward: 10 * enemyLevel

RPG LEVELING:
  xpNeeded[level] = 100 * (level ^ 1.5)
  Total XP to level N = sum(xpNeeded[1..N-1])

BATTLE PASS XP:
  xpForTier[n] = n * 100 + 500
  Total for tier 100 = 555,000 XP

STAT DIMINISHING RETURNS (FIGHTING):
  damageMultiplier = log2(1 + stat/10) + 1
  stat=10 → 4.46x, stat=50 → 7.64x, stat=100 → 9.46x (not infinite)

REROLL COSTS (INCREASING):
  cost[n] = 1000 * (3 ^ (n-1))
  Attempt 1: 1K, 2: 3K, 3: 9K, 5: 81K, 10: 19.7M

STORAGE EXPANSION:
  cost[n] = 500 * (2 ^ n)
  Expansion 1: 1K, 3: 4K, 5: 16K, 8: 128K

DEATH PENALTY:
  loss = min(floor(carriedCoins * 0.07), 500)   -- normal mode
  loss = min(floor(carriedCoins * 0.20), 5000)  -- hardcore mode

GACHA PITY:
  Pull 1-49: Normal rates (Legendary 1%, Epic 4%, Rare 15%, Uncommon 30%, Common 50%)
  Pull 50+: Guaranteed Rare minimum (soft pity)
  Pull 100: Guaranteed Legendary (hard pity, reset counter)

OFFLINE EARNINGS:
  earned = onlineEPS * 0.50 * min(offlineSeconds, 28800)
`

export const ECONOMY_TEMPLATES: string = `
=== GAME TYPE ECONOMY TEMPLATES SUBSET ===

TYCOON TEMPLATE:
  Currencies: Coins + Gems
  Dropper costs: 100 * 1.35^n (exponential)
  Income: level coins/sec per dropper
  Multiplier buildings: income * multiplier * payoffSeconds
  Rebirth at: 1,000,000 coins earned. Multiplier: 1.5x per rebirth.
  Gamepasses: 2x coins (200R), Auto-collect (150R), Exclusive dropper (400R)
  Money sinks: Upgrade costs, Cosmetic shop, Optional: marketplace

SIMULATOR TEMPLATE:
  Currencies: Power + Diamonds + Event Stars
  Tool costs: polynomial exp 2.0, base 500
  Pet costs: polynomial exp 2.5, base 1000
  Areas: 6 areas, 5x stat requirement per area, 2x income per area
  Rebirth: additive +1 multiplier each rebirth (simple, readable)

RPG TEMPLATE:
  Currencies: Gold + Crystals + Honor
  XP curve: 100 * level^1.5
  Stats: HP 100+10/level, Attack 10+1/level, Defense 5+0.5/level
  Gear rarity drops: Common 50%, Uncommon 30%, Rare 15%, Epic 4%, Legendary 1%
  Quest rewards: easy 100G/50XP, medium 500G/200XP, hard 2K/800, legendary 10K/5K+10crystals

IDLE TEMPLATE:
  8 buildings, costs multiply 10x per building tier
  Offline: 50% rate, 8hr max. Premium upgrade: 100% rate (250R gamepass)
  Prestige multiplier: sqrt(lifetimeEarnings/1000)
  Prestige threshold: 1M * 5^prestigeCount

BATTLE ROYALE TEMPLATE:
  No in-match economy. Post-match XP only.
  Win: 500 XP, Top 10: 200 XP, Kill: 50 XP, Survive 5 min: 20 XP
  Cosmetic unlock: every 10 levels
  Battle pass: 100 tiers, 30 days, 400R premium

TOWER DEFENSE TEMPLATE:
  Wave enemies: HP = base * 1.1^(wave-1)
  Tower cost: base * 1.5^(owned count of same type) — purchase inflation
  Tower upgrade: baseCost * 2^upgradeLevel
  Wave reward: wave * 50 + kills * 5

RACING TEMPLATE:
  Car unlocks: exponential 1.6x, starting at 1,000 coins
  Stat upgrades (4 stats, 10 levels): polynomial 2.0, base 200
  Parts drop on race completion: Common 60%, Uncommon 25%, Rare 10%, Epic 4%, Legendary 1%
  Track unlocks: win 3 races on current tier to unlock next tier

UNIVERSAL MONEY SINK PACK (add any/all):
  Repair costs (10% item value per death)
  Transaction tax (7% marketplace fee)
  Pet food (250 coins per pet per 2 hrs)
  Reroll costs (increasing: 1K * 3^attempt)
  Storage expansion (500 * 2^expansion)
  Fast travel (distance/10 * 5 coins, max 500)
  Gacha / egg hatching (500 coins per pull)
  Cosmetic shop (rotating weekly, 500-50K coins)
`
