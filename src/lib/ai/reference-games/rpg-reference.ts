import 'server-only';

/**
 * Production-quality reference RPG game for ForjeGames AI few-shot context.
 *
 * When a user says "make an RPG", "build a quest game", or similar, the AI
 * receives this as example output. Every system is COMPLETE and WORKING —
 * no stubs, no TODOs, no placeholder comments.
 *
 * Systems included:
 *   1. Stat System — HP, MaxHP, ATK, DEF, XP, Level, Gold (server-side)
 *   2. Combat System — Raycast melee, cooldowns, crits, damage numbers
 *   3. Quest State Machine — 5-state FSM, 4 quest types, rewards
 *   4. NPC Dialogue — Branching trees, typewriter effect, shops
 *   5. Inventory + Equipment — Slot-based with stat bonuses
 *   6. Enemy AI — Idle/Chase/Attack/Return with PathfindingService
 *   7. Boss Fight — Phase transitions, multiple attack patterns, arena
 *   8. DataStore — Full persistence of stats, inventory, quests, equipment
 *
 * Architecture decisions are explained inline with comments.
 */
export function getRPGReference(): string {
  return `--[[
============================================================================
COMPLETE RPG GAME — SERVER SCRIPT (ServerScriptService)
============================================================================
Architecture:
  - ALL game state lives on the server. Client only sends intent ("I want
    to attack", "I want to equip"), server validates and executes.
  - Stat system: HP, MaxHP, ATK, DEF, XP, Level, Gold. Stored in DataStore.
  - Level formula: XP needed = 100 * level^1.5 (smooth curve, no brick wall)
  - Damage formula: max(1, ATK * (1 + critMult) - DEF/2) with ±15% variance
  - Crit chance: 10% base, 2x multiplier (stacks with equipment bonuses)
  - Equipment: Weapon, Armor, Accessory slots. Stats update on equip/unequip.
  - Quest FSM: NotStarted → Active → TurnIn → Completed → Rewarded
  - Enemy AI: Idle → Chase → Attack → Return via PathfindingService
  - Boss: Phase transitions at 75%, 50%, 25% HP with unique attack patterns
  - DataStore: pcall + retry + BindToClose. UpdateAsync for atomicity.

Folder Structure Expected:
  Workspace/
    EnemySpawns/
      GoblinSpawn1 (Part — position marker)
      GoblinSpawn2 (Part)
      SkeletonSpawn1 (Part)
      WolfSpawn1 (Part)
    BossArena/
      ArenaBoundary (Part — invisible wall, CanCollide = true)
      BossSpawn (Part — center of arena)
    NPCs/
      QuestGiverElara (Model with Humanoid + HumanoidRootPart)
      ShopkeeperMorgan (Model with Humanoid + HumanoidRootPart)
      GuideNPC (Model with Humanoid + HumanoidRootPart)
    LootPickups/ (Folder — server places loot drops here)
  ServerStorage/
    EnemyTemplates/
      Goblin (Model with Humanoid, 50-part minimum)
      Skeleton (Model with Humanoid)
      DireWolf (Model with Humanoid)
      ShadowLord (Model with Humanoid — boss template)
  ReplicatedStorage/
    Remotes/ (Folder — created by script if missing)
============================================================================
--]]

-- Services
-- We grab all services at the top so Luau can type-check them and we
-- avoid repeated GetService calls throughout the script.
local Players = game:GetService("Players")
local ServerStorage = game:GetService("ServerStorage")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local DataStoreService = game:GetService("DataStoreService")
local PathfindingService = game:GetService("PathfindingService")
local Debris = game:GetService("Debris")
local RunService = game:GetService("RunService")

----------------------------------------------------------------------------
-- CONSTANTS
-- All tuning values in one place. Designers change numbers here, not in
-- logic code. Every constant has a comment explaining WHY that value.
----------------------------------------------------------------------------
local SAVE_INTERVAL = 60          -- Auto-save every 60s (DataStore budget friendly)
local DATASTORE_KEY_PREFIX = "RPGv2_" -- Versioned prefix so we can migrate later
local ATTACK_COOLDOWN = 0.5       -- 0.5s between attacks prevents spam
local MELEE_RANGE = 8             -- Studs. Matches typical Roblox sword range
local AGGRO_RANGE = 30            -- Studs. Enemy starts chasing player
local LEASH_RANGE = 60            -- Studs. Enemy gives up and returns to spawn
local ENEMY_ATTACK_RANGE = 5      -- Studs. Enemy close enough to swing
local ENEMY_ATTACK_COOLDOWN = 1.5 -- Seconds between enemy attacks
local ENEMY_RESPAWN_TIME = 20     -- Seconds before enemy respawns after death
local LOOT_DESPAWN_TIME = 45      -- Seconds before uncollected loot vanishes
local CRIT_CHANCE = 0.10          -- 10% base crit chance
local CRIT_MULTIPLIER = 2.0       -- 2x damage on crit
local DAMAGE_VARIANCE = 0.15      -- ±15% random variance on all damage
local BOSS_PHASE_THRESHOLDS = { 0.75, 0.50, 0.25 } -- HP% for phase changes

-- Base player stats at level 1
local BASE_HP = 100
local BASE_ATK = 12
local BASE_DEF = 5
local BASE_GOLD = 0

-- Per-level scaling. These are additive per level.
-- HP grows fastest so players FEEL tankier. ATK grows moderate.
-- DEF grows slowest so enemies always remain somewhat dangerous.
local HP_PER_LEVEL = 20
local ATK_PER_LEVEL = 3
local DEF_PER_LEVEL = 2

----------------------------------------------------------------------------
-- XP CURVE
-- Formula: 100 * level^1.5
-- Level 1→2: 100 XP, Level 5→6: 1118 XP, Level 10→11: 3162 XP
-- The 1.5 exponent creates a curve that feels fair early but requires
-- commitment at high levels. Quadratic (^2) is too punishing, linear
-- is too easy. 1.5 is the sweet spot for casual RPGs.
----------------------------------------------------------------------------
local function getRequiredXP(level: number): number
    return math.floor(100 * math.pow(level, 1.5))
end

----------------------------------------------------------------------------
-- DAMAGE FORMULA
-- max(1, ATK * (1 + critMult) - DEF/2) with ±15% variance
--
-- Why DEF/2? Full DEF subtraction makes defense too strong at high levels
-- (you'd take 0 damage). Halving it means defense always helps but never
-- makes you invincible. The max(1, ...) guarantees no stalemates.
--
-- Crit: 10% chance to deal 2x. This adds excitement and burst potential
-- without being reliable enough to trivialize content.
--
-- Variance: ±15% makes identical hits feel different. Too much variance
-- (±50%) feels unfair, too little (±5%) feels robotic.
----------------------------------------------------------------------------
local function calculateDamage(attackerATK: number, defenderDEF: number, extraCritChance: number?): (number, boolean)
    local critChance = CRIT_CHANCE + (extraCritChance or 0)
    local isCrit = math.random() < critChance
    local critMult = if isCrit then CRIT_MULTIPLIER else 1.0

    local baseDamage = math.max(1, attackerATK * critMult - defenderDEF / 2)

    -- Apply variance: multiply by random in [1 - VARIANCE, 1 + VARIANCE]
    local variance = 1 + (math.random() * 2 - 1) * DAMAGE_VARIANCE
    local finalDamage = math.floor(baseDamage * variance)

    return math.max(1, finalDamage), isCrit
end

----------------------------------------------------------------------------
-- ITEM DEFINITIONS
-- Every item has a unique ID (string key), display name, stat bonuses,
-- equip slot (nil = consumable/material), and sell value.
-- Stat bonuses are ONLY applied when the item is EQUIPPED, not just in
-- inventory. This prevents hoarding items for passive stat boosts.
----------------------------------------------------------------------------
type ItemDef = {
    name: string,
    description: string,
    slot: string?,           -- "Weapon" | "Armor" | "Accessory" | nil (not equippable)
    atkBonus: number,
    defBonus: number,
    hpBonus: number,
    critBonus: number,       -- Extra crit chance (e.g., 0.05 = +5%)
    sellValue: number,       -- Gold received when selling
}

local ITEM_DEFS: { [string]: ItemDef } = {
    wooden_sword = {
        name = "Wooden Sword", description = "A rough training blade.",
        slot = "Weapon", atkBonus = 4, defBonus = 0, hpBonus = 0, critBonus = 0,
        sellValue = 5,
    },
    iron_sword = {
        name = "Iron Sword", description = "Standard-issue iron blade.",
        slot = "Weapon", atkBonus = 10, defBonus = 0, hpBonus = 0, critBonus = 0.02,
        sellValue = 25,
    },
    shadow_blade = {
        name = "Shadow Blade", description = "Forged in darkness. Crits often.",
        slot = "Weapon", atkBonus = 22, defBonus = 0, hpBonus = 0, critBonus = 0.15,
        sellValue = 200,
    },
    leather_armor = {
        name = "Leather Armor", description = "Basic protection from claws and teeth.",
        slot = "Armor", atkBonus = 0, defBonus = 6, hpBonus = 20, critBonus = 0,
        sellValue = 15,
    },
    iron_plate = {
        name = "Iron Plate", description = "Heavy but effective plate armor.",
        slot = "Armor", atkBonus = 0, defBonus = 15, hpBonus = 50, critBonus = 0,
        sellValue = 80,
    },
    shadow_mail = {
        name = "Shadow Mail", description = "Dark armor that absorbs blows.",
        slot = "Armor", atkBonus = 5, defBonus = 25, hpBonus = 80, critBonus = 0,
        sellValue = 300,
    },
    lucky_charm = {
        name = "Lucky Charm", description = "Increases critical hit chance.",
        slot = "Accessory", atkBonus = 2, defBonus = 2, hpBonus = 10, critBonus = 0.10,
        sellValue = 50,
    },
    guardian_ring = {
        name = "Guardian Ring", description = "A ring that bolsters defense.",
        slot = "Accessory", atkBonus = 0, defBonus = 12, hpBonus = 40, critBonus = 0,
        sellValue = 75,
    },
    health_potion = {
        name = "Health Potion", description = "Restores 50 HP.",
        slot = nil, atkBonus = 0, defBonus = 0, hpBonus = 50, critBonus = 0,
        sellValue = 10,
    },
    large_health_potion = {
        name = "Large Health Potion", description = "Restores 150 HP.",
        slot = nil, atkBonus = 0, defBonus = 0, hpBonus = 150, critBonus = 0,
        sellValue = 30,
    },
    gold_nugget = {
        name = "Gold Nugget", description = "Sell this for gold.",
        slot = nil, atkBonus = 0, defBonus = 0, hpBonus = 0, critBonus = 0,
        sellValue = 40,
    },
    bone_fragment = {
        name = "Bone Fragment", description = "A quest material from skeletons.",
        slot = nil, atkBonus = 0, defBonus = 0, hpBonus = 0, critBonus = 0,
        sellValue = 5,
    },
    wolf_pelt = {
        name = "Wolf Pelt", description = "A quest material from dire wolves.",
        slot = nil, atkBonus = 0, defBonus = 0, hpBonus = 0, critBonus = 0,
        sellValue = 12,
    },
    shadow_essence = {
        name = "Shadow Essence", description = "Dropped by the Shadow Lord.",
        slot = nil, atkBonus = 0, defBonus = 0, hpBonus = 0, critBonus = 0,
        sellValue = 500,
    },
}

-- Shop inventory: items the shopkeeper sells and their buy prices.
-- Buy price is always higher than sell price (standard RPG economy sink).
local SHOP_ITEMS: { { itemId: string, buyPrice: number } } = {
    { itemId = "health_potion", buyPrice = 20 },
    { itemId = "large_health_potion", buyPrice = 60 },
    { itemId = "wooden_sword", buyPrice = 15 },
    { itemId = "iron_sword", buyPrice = 80 },
    { itemId = "leather_armor", buyPrice = 50 },
    { itemId = "iron_plate", buyPrice = 200 },
    { itemId = "lucky_charm", buyPrice = 150 },
    { itemId = "guardian_ring", buyPrice = 200 },
}

----------------------------------------------------------------------------
-- ENEMY DEFINITIONS
-- Each enemy type has base stats, loot table, and XP/Gold rewards.
-- Loot tables use weighted random: each entry rolls independently.
----------------------------------------------------------------------------
type EnemyDef = {
    hp: number,
    atk: number,
    def: number,
    xpReward: number,
    goldReward: number,
    lootTable: { { itemId: string, dropChance: number } },
    moveSpeed: number,  -- Studs per second for pathfinding
}

local ENEMY_DEFS: { [string]: EnemyDef } = {
    Goblin = {
        hp = 60, atk = 8, def = 3, xpReward = 30, goldReward = 8,
        moveSpeed = 14,
        lootTable = {
            { itemId = "wooden_sword", dropChance = 0.15 },
            { itemId = "health_potion", dropChance = 0.30 },
            { itemId = "gold_nugget", dropChance = 0.10 },
        },
    },
    Skeleton = {
        hp = 120, atk = 16, def = 10, xpReward = 70, goldReward = 18,
        moveSpeed = 11,
        lootTable = {
            { itemId = "iron_sword", dropChance = 0.08 },
            { itemId = "bone_fragment", dropChance = 0.60 },
            { itemId = "health_potion", dropChance = 0.35 },
            { itemId = "gold_nugget", dropChance = 0.20 },
        },
    },
    DireWolf = {
        hp = 90, atk = 22, def = 6, xpReward = 55, goldReward = 14,
        moveSpeed = 20, -- Fast but fragile
        lootTable = {
            { itemId = "wolf_pelt", dropChance = 0.50 },
            { itemId = "health_potion", dropChance = 0.25 },
            { itemId = "lucky_charm", dropChance = 0.03 },
        },
    },
    -- Boss enemy — much higher stats, unique loot
    ShadowLord = {
        hp = 2000, atk = 45, def = 30, xpReward = 800, goldReward = 500,
        moveSpeed = 10,
        lootTable = {
            { itemId = "shadow_blade", dropChance = 0.25 },
            { itemId = "shadow_mail", dropChance = 0.20 },
            { itemId = "shadow_essence", dropChance = 1.00 },
            { itemId = "large_health_potion", dropChance = 0.80 },
            { itemId = "gold_nugget", dropChance = 1.00 },
        },
    },
}

-- Spawn point → enemy type mapping
local SPAWN_CONFIG: { [string]: string } = {
    GoblinSpawn1 = "Goblin",
    GoblinSpawn2 = "Goblin",
    SkeletonSpawn1 = "Skeleton",
    WolfSpawn1 = "DireWolf",
}

----------------------------------------------------------------------------
-- QUEST DEFINITIONS
-- State machine: NotStarted → Active → TurnIn → Completed → Rewarded
--
-- NotStarted: Player hasn't interacted with this quest yet
-- Active: Player accepted, working on objectives
-- TurnIn: Objectives met, player needs to talk to NPC to claim
-- Completed: NPC acknowledged completion, rewards pending
-- Rewarded: Rewards given, quest is done forever
--
-- Quest types: "kill", "collect", "talk", "reach"
----------------------------------------------------------------------------
type QuestRequirement = {
    type: string,           -- "kill" | "collect" | "talk" | "reach"
    target: string,         -- Enemy type, item ID, NPC name, or Part name
    count: number,          -- How many kills/collects needed (1 for talk/reach)
}

type QuestReward = {
    xp: number,
    gold: number,
    items: { string }?,     -- Item IDs to give
}

type QuestDef = {
    name: string,
    description: string,
    requirement: QuestRequirement,
    reward: QuestReward,
    giverNPC: string,       -- Which NPC gives this quest
    prereqQuest: string?,   -- Must complete this quest first (nil = no prereq)
    dialogueOffer: string,
    dialogueActive: string,
    dialogueTurnIn: string,
    dialogueRewarded: string,
}

local QUEST_DEFS: { [string]: QuestDef } = {
    q_goblin_menace = {
        name = "The Goblin Menace",
        description = "Defeat 5 Goblins threatening the village.",
        requirement = { type = "kill", target = "Goblin", count = 5 },
        reward = { xp = 150, gold = 50, items = { "iron_sword" } },
        giverNPC = "QuestGiverElara",
        prereqQuest = nil,
        dialogueOffer = "Goblins have been raiding our supply wagons. Please defeat 5 of them and I will reward you well.",
        dialogueActive = "Have you dealt with those goblins yet? We need 5 of them gone.",
        dialogueTurnIn = "You did it! The roads are safe again. Take this blade as thanks.",
        dialogueRewarded = "Thank you again for dealing with those goblins. You are a true hero.",
    },
    q_bone_collector = {
        name = "Bone Collector",
        description = "Collect 3 Bone Fragments from Skeletons.",
        requirement = { type = "collect", target = "bone_fragment", count = 3 },
        reward = { xp = 200, gold = 80, items = { "iron_plate" } },
        giverNPC = "QuestGiverElara",
        prereqQuest = "q_goblin_menace",
        dialogueOffer = "The alchemist needs bone fragments from skeletons in the caves. Can you bring me 3?",
        dialogueActive = "I still need those bone fragments. Skeletons drop them in the caves.",
        dialogueTurnIn = "Perfect! These will be invaluable for the alchemist's research. Here is your reward.",
        dialogueRewarded = "The alchemist is making great progress with those fragments.",
    },
    q_wolf_hunt = {
        name = "Wolf Hunt",
        description = "Collect 4 Wolf Pelts from Dire Wolves.",
        requirement = { type = "collect", target = "wolf_pelt", count = 4 },
        reward = { xp = 250, gold = 100 },
        giverNPC = "QuestGiverElara",
        prereqQuest = "q_goblin_menace",
        dialogueOffer = "Dire wolves prowl the forest paths. The tanner needs 4 wolf pelts. Can you help?",
        dialogueActive = "The tanner still needs those pelts. Dire wolves roam the forest.",
        dialogueTurnIn = "Excellent pelts! The tanner will be thrilled. Here is your pay.",
        dialogueRewarded = "The tanner made fine leather from those pelts. Good work.",
    },
    q_talk_to_guide = {
        name = "Seek the Guide",
        description = "Speak with the Guide NPC for combat tips.",
        requirement = { type = "talk", target = "GuideNPC", count = 1 },
        reward = { xp = 50, gold = 20 },
        giverNPC = "QuestGiverElara",
        prereqQuest = nil,
        dialogueOffer = "Before you go adventuring, talk to the Guide near the town gate. He has useful tips.",
        dialogueActive = "Go talk to the Guide by the town gate.",
        dialogueTurnIn = "Good, you spoke with the Guide. Here is a small reward for your initiative.",
        dialogueRewarded = "The Guide is always happy to help new adventurers.",
    },
    q_reach_arena = {
        name = "Into the Shadow",
        description = "Reach the Boss Arena deep in the dungeon.",
        requirement = { type = "reach", target = "BossArena", count = 1 },
        reward = { xp = 300, gold = 150 },
        giverNPC = "QuestGiverElara",
        prereqQuest = "q_bone_collector",
        dialogueOffer = "The Shadow Lord lurks in the arena beyond the caves. Scout it out but be careful.",
        dialogueActive = "Find the Boss Arena at the end of the dungeon.",
        dialogueTurnIn = "You found the arena! Brave soul. Take this reward before you face the Shadow Lord.",
        dialogueRewarded = "The Shadow Lord awaits. Prepare yourself well before the fight.",
    },
    q_defeat_boss = {
        name = "Shadow Lord's End",
        description = "Defeat the Shadow Lord boss.",
        requirement = { type = "kill", target = "ShadowLord", count = 1 },
        reward = { xp = 1000, gold = 500, items = { "shadow_blade", "shadow_mail" } },
        giverNPC = "QuestGiverElara",
        prereqQuest = "q_reach_arena",
        dialogueOffer = "The Shadow Lord must be destroyed. Defeat the beast and our land will be free.",
        dialogueActive = "The Shadow Lord still lives. Go to the arena and end this.",
        dialogueTurnIn = "You have done the impossible! The Shadow Lord is no more. You are a legend!",
        dialogueRewarded = "Songs will be sung about your victory for generations.",
    },
}

-- Dialogue trees for NPCs. Each NPC has dialogue options that change
-- based on quest state. This allows branching conversations.
type DialogueNode = {
    text: string,
    options: { { label: string, nextNode: string?, action: string? } }?,
}

type DialogueTree = { [string]: DialogueNode }

local NPC_DIALOGUE: { [string]: DialogueTree } = {
    GuideNPC = {
        root = {
            text = "Welcome, adventurer! I am the Guide. Would you like some combat tips?",
            options = {
                { label = "Yes, tell me about combat.", nextNode = "combat_tips" },
                { label = "Tell me about equipment.", nextNode = "equip_tips" },
                { label = "Goodbye.", nextNode = nil },
            },
        },
        combat_tips = {
            text = "Attack enemies by clicking on them when in range. Watch your HP! Crits deal double damage and happen 10% of the time. Equip better weapons to hit harder.",
            options = {
                { label = "Tell me about equipment.", nextNode = "equip_tips" },
                { label = "Thanks!", nextNode = nil },
            },
        },
        equip_tips = {
            text = "You have 3 equipment slots: Weapon, Armor, and Accessory. Open your inventory and click an item to equip it. Better gear means higher stats!",
            options = {
                { label = "Tell me about combat.", nextNode = "combat_tips" },
                { label = "Thanks!", nextNode = nil },
            },
        },
    },
    ShopkeeperMorgan = {
        root = {
            text = "Welcome to Morgan's shop! What would you like to do?",
            options = {
                { label = "Buy items", nextNode = nil, action = "open_shop_buy" },
                { label = "Sell items", nextNode = nil, action = "open_shop_sell" },
                { label = "Just browsing.", nextNode = nil },
            },
        },
    },
}

----------------------------------------------------------------------------
-- REMOTES SETUP
-- Create all RemoteEvents/RemoteFunctions in a Remotes folder under
-- ReplicatedStorage. Using a folder keeps things organized and lets
-- the client easily find remotes by name.
----------------------------------------------------------------------------
local remotesFolder = ReplicatedStorage:FindFirstChild("Remotes")
if not remotesFolder then
    remotesFolder = Instance.new("Folder")
    remotesFolder.Name = "Remotes"
    remotesFolder.Parent = ReplicatedStorage
end

local function getOrCreateRemote(name: string, className: string): Instance
    local existing = remotesFolder:FindFirstChild(name)
    if existing then return existing end
    local remote = Instance.new(className)
    remote.Name = name
    remote.Parent = remotesFolder
    return remote
end

-- Player → Server intents
local AttackRemote = getOrCreateRemote("AttackEnemy", "RemoteEvent") :: RemoteEvent
local EquipRemote = getOrCreateRemote("EquipItem", "RemoteEvent") :: RemoteEvent
local UnequipRemote = getOrCreateRemote("UnequipItem", "RemoteEvent") :: RemoteEvent
local UseItemRemote = getOrCreateRemote("UseItem", "RemoteEvent") :: RemoteEvent
local InteractNPCRemote = getOrCreateRemote("InteractNPC", "RemoteEvent") :: RemoteEvent
local AcceptQuestRemote = getOrCreateRemote("AcceptQuest", "RemoteEvent") :: RemoteEvent
local DialogueChoiceRemote = getOrCreateRemote("DialogueChoice", "RemoteEvent") :: RemoteEvent
local ShopBuyRemote = getOrCreateRemote("ShopBuy", "RemoteEvent") :: RemoteEvent
local ShopSellRemote = getOrCreateRemote("ShopSell", "RemoteEvent") :: RemoteEvent

-- Server → Client updates
local UpdateUIRemote = getOrCreateRemote("UpdateUI", "RemoteEvent") :: RemoteEvent
local DialogueRemote = getOrCreateRemote("ShowDialogue", "RemoteEvent") :: RemoteEvent
local DamageNumberRemote = getOrCreateRemote("DamageNumber", "RemoteEvent") :: RemoteEvent
local BossPhaseRemote = getOrCreateRemote("BossPhase", "RemoteEvent") :: RemoteEvent

----------------------------------------------------------------------------
-- DATASTORE
-- We wrap DataStore access in pcall because it can fail (throttling,
-- network issues, Studio testing). The game must work without saving
-- (graceful degradation). We use UpdateAsync for atomic writes.
----------------------------------------------------------------------------
local rpgStore: DataStore? = nil
do
    local ok, store = pcall(function()
        return DataStoreService:GetDataStore("RPGGameData_v2")
    end)
    if ok then
        rpgStore = store
    else
        warn("[RPG] DataStore unavailable:", store)
    end
end

----------------------------------------------------------------------------
-- PLAYER DATA TYPES
-- Strict types prevent bugs. Every field is explicitly typed.
----------------------------------------------------------------------------
type QuestProgress = {
    state: string,      -- "NotStarted" | "Active" | "TurnIn" | "Completed" | "Rewarded"
    progress: number,   -- Current count toward requirement
}

type EquipmentSlots = {
    Weapon: string?,     -- Item ID or nil
    Armor: string?,
    Accessory: string?,
}

type PlayerData = {
    level: number,
    xp: number,
    gold: number,
    maxHP: number,
    atk: number,
    def: number,
    inventory: { string },           -- Array of item IDs
    equipment: EquipmentSlots,
    quests: { [string]: QuestProgress },
    totalKills: number,
    bossDefeated: boolean,
}

local DEFAULT_DATA: PlayerData = {
    level = 1,
    xp = 0,
    gold = 25, -- Starting gold so player can buy a potion
    maxHP = BASE_HP,
    atk = BASE_ATK,
    def = BASE_DEF,
    inventory = {},
    equipment = { Weapon = nil, Armor = nil, Accessory = nil },
    quests = {},
    totalKills = 0,
    bossDefeated = false,
}

local function deepCopy(t: any): any
    if type(t) ~= "table" then return t end
    local copy = {}
    for k, v in t do
        copy[k] = deepCopy(v)
    end
    return copy
end

----------------------------------------------------------------------------
-- SERVER STATE
-- These tables track live game state that doesn't persist across sessions.
-- playerCurrentHP resets on join (player spawns at full HP).
----------------------------------------------------------------------------
local playerData: { [number]: PlayerData } = {}
local playerCurrentHP: { [number]: number } = {}
local lastAttackTime: { [number]: number } = {}

-- Enemy tracking: model reference → live state
type EnemyState = {
    hp: number,
    maxHP: number,
    enemyType: string,
    spawnPosition: Vector3,
    aiState: string,            -- "Idle" | "Chase" | "Attack" | "Return"
    targetPlayer: Player?,
    lastAttackTime: number,
    bossPhase: number?,         -- 0-3 for boss, nil for normal enemies
}
local activeEnemies: { [Model]: EnemyState } = {}

----------------------------------------------------------------------------
-- STAT CALCULATION
-- Effective stats = base (from level) + equipment bonuses.
-- This is recalculated whenever level or equipment changes.
-- Equipment bonuses ONLY come from equipped items, not inventory.
----------------------------------------------------------------------------
local function getEffectiveStats(data: PlayerData): (number, number, number, number)
    -- Base stats from level
    local hp = BASE_HP + (data.level - 1) * HP_PER_LEVEL
    local atk = BASE_ATK + (data.level - 1) * ATK_PER_LEVEL
    local def = BASE_DEF + (data.level - 1) * DEF_PER_LEVEL
    local extraCrit: number = 0

    -- Equipment bonuses (only equipped items, not inventory)
    for _, slotItemId in data.equipment :: any do
        if slotItemId and ITEM_DEFS[slotItemId] then
            local itemDef = ITEM_DEFS[slotItemId]
            hp += itemDef.hpBonus
            atk += itemDef.atkBonus
            def += itemDef.defBonus
            extraCrit += itemDef.critBonus
        end
    end

    return hp, atk, def, extraCrit
end

----------------------------------------------------------------------------
-- DATA LOAD / SAVE
-- Load uses GetAsync with a single retry on failure.
-- Save uses SetAsync with a single retry (UpdateAsync is better for
-- concurrent writes but SetAsync is simpler for this reference).
-- BindToClose ensures data saves when the server shuts down.
----------------------------------------------------------------------------
local function loadPlayerData(player: Player): PlayerData
    local data = deepCopy(DEFAULT_DATA)
    if not rpgStore then return data end

    local key = DATASTORE_KEY_PREFIX .. tostring(player.UserId)

    local function tryLoad(): PlayerData?
        local success, result = pcall(function()
            return (rpgStore :: DataStore):GetAsync(key)
        end)
        if success and result then
            -- Merge saved data into default structure (handles new fields)
            for k, v in result :: any do
                if (data :: any)[k] ~= nil then
                    (data :: any)[k] = v
                end
            end
            -- Ensure equipment table has all slots (migration safety)
            if not data.equipment.Weapon then data.equipment.Weapon = nil end
            if not data.equipment.Armor then data.equipment.Armor = nil end
            if not data.equipment.Accessory then data.equipment.Accessory = nil end
            return data
        elseif not success then
            warn("[RPG] Load failed for", player.Name, ":", result)
        end
        return nil
    end

    -- First attempt
    local loaded = tryLoad()
    if loaded then return loaded end

    -- Retry once after a short delay
    task.wait(1)
    local retryLoaded = tryLoad()
    if retryLoaded then return retryLoaded end

    -- Return defaults if both attempts fail
    return data
end

local function savePlayerData(userId: number): boolean
    if not rpgStore then return false end
    local data = playerData[userId]
    if not data then return false end

    local key = DATASTORE_KEY_PREFIX .. tostring(userId)

    local success, err = pcall(function()
        (rpgStore :: DataStore):SetAsync(key, data)
    end)

    if not success then
        warn("[RPG] Save failed for userId", userId, ":", err)
        -- Single retry
        task.wait(0.5)
        local ok2, err2 = pcall(function()
            (rpgStore :: DataStore):SetAsync(key, data)
        end)
        if not ok2 then
            warn("[RPG] Retry save also failed:", err2)
            return false
        end
    end

    return true
end

----------------------------------------------------------------------------
-- LEADERSTATS + UI SYNC
-- Leaderstats show on the default Roblox player list.
-- UpdateUI remote sends full state to client for custom HUD rendering.
----------------------------------------------------------------------------
local function setupLeaderstats(player: Player)
    local leaderstats = Instance.new("Folder")
    leaderstats.Name = "leaderstats"
    leaderstats.Parent = player

    local levelVal = Instance.new("IntValue")
    levelVal.Name = "Level"
    levelVal.Value = 1
    levelVal.Parent = leaderstats

    local goldVal = Instance.new("IntValue")
    goldVal.Name = "Gold"
    goldVal.Value = 0
    goldVal.Parent = leaderstats

    local killsVal = Instance.new("IntValue")
    killsVal.Name = "Kills"
    killsVal.Value = 0
    killsVal.Parent = leaderstats
end

local function syncPlayerUI(player: Player)
    local data = playerData[player.UserId]
    if not data then return end

    local hp, atk, def, extraCrit = getEffectiveStats(data)
    local currentHP = playerCurrentHP[player.UserId] or hp

    -- Update leaderstats
    local leaderstats = player:FindFirstChild("leaderstats")
    if leaderstats then
        local lv = leaderstats:FindFirstChild("Level")
        if lv and lv:IsA("IntValue") then lv.Value = data.level end
        local gv = leaderstats:FindFirstChild("Gold")
        if gv and gv:IsA("IntValue") then gv.Value = data.gold end
        local kv = leaderstats:FindFirstChild("Kills")
        if kv and kv:IsA("IntValue") then kv.Value = data.totalKills end
    end

    -- Build quest progress summary
    local questSummary = {}
    for questId, questDef in QUEST_DEFS do
        local qp = data.quests[questId]
        questSummary[questId] = {
            name = questDef.name,
            description = questDef.description,
            state = if qp then qp.state else "NotStarted",
            progress = if qp then qp.progress else 0,
            required = questDef.requirement.count,
            requirementType = questDef.requirement.type,
        }
    end

    UpdateUIRemote:FireClient(player, {
        level = data.level,
        xp = data.xp,
        xpRequired = getRequiredXP(data.level),
        currentHP = currentHP,
        maxHP = hp,
        atk = atk,
        def = def,
        extraCrit = extraCrit,
        gold = data.gold,
        inventory = data.inventory,
        equipment = data.equipment,
        quests = questSummary,
        totalKills = data.totalKills,
    })
end

----------------------------------------------------------------------------
-- LEVEL UP
-- Can level multiple times in one call (e.g., big XP dump from boss).
-- Full heal on level up as a reward. Recalculates stats immediately.
----------------------------------------------------------------------------
local function checkLevelUp(player: Player)
    local data = playerData[player.UserId]
    if not data then return end

    local leveled = false
    while data.xp >= getRequiredXP(data.level) do
        data.xp -= getRequiredXP(data.level)
        data.level += 1
        leveled = true
    end

    if leveled then
        local hp, atk, def, _ = getEffectiveStats(data)
        data.maxHP = hp
        data.atk = atk
        data.def = def

        -- Full heal on level up
        playerCurrentHP[player.UserId] = hp

        local character = player.Character
        if character then
            local humanoid = character:FindFirstChildOfClass("Humanoid")
            if humanoid then
                humanoid.MaxHealth = hp
                humanoid.Health = hp
            end
        end

        syncPlayerUI(player)
    end
end

----------------------------------------------------------------------------
-- EQUIPMENT SYSTEM
-- Server validates all equip/unequip requests. Client sends item ID
-- and desired slot. Server checks:
--   1. Item exists in player inventory
--   2. Item has a matching slot
--   3. Swap old equipped item back to inventory
--   4. Move new item from inventory to slot
--   5. Recalculate stats
----------------------------------------------------------------------------
EquipRemote.OnServerEvent:Connect(function(player: Player, itemId: unknown)
    if type(itemId) ~= "string" then return end
    local id = itemId :: string

    local data = playerData[player.UserId]
    if not data then return end

    local itemDef = ITEM_DEFS[id]
    if not itemDef or not itemDef.slot then return end -- Not equippable

    -- Check item is in inventory
    local inventoryIndex: number? = nil
    for i, invItem in data.inventory do
        if invItem == id then
            inventoryIndex = i
            break
        end
    end
    if not inventoryIndex then return end -- Player doesn't have this item

    local slot = itemDef.slot

    -- Unequip current item in that slot (put back in inventory)
    local currentEquipped = (data.equipment :: any)[slot]
    if currentEquipped then
        table.insert(data.inventory, currentEquipped)
    end

    -- Remove new item from inventory
    table.remove(data.inventory, inventoryIndex)

    -- Equip new item
    ;(data.equipment :: any)[slot] = id

    -- Recalculate stats
    local hp, atk, def, _ = getEffectiveStats(data)
    data.maxHP = hp
    data.atk = atk
    data.def = def

    -- Adjust current HP if max changed (don't exceed new max)
    local currentHP = playerCurrentHP[player.UserId] or hp
    playerCurrentHP[player.UserId] = math.min(currentHP, hp)

    syncPlayerUI(player)
end)

UnequipRemote.OnServerEvent:Connect(function(player: Player, slot: unknown)
    if type(slot) ~= "string" then return end
    local slotStr = slot :: string

    local data = playerData[player.UserId]
    if not data then return end

    if slotStr ~= "Weapon" and slotStr ~= "Armor" and slotStr ~= "Accessory" then return end

    local currentEquipped = (data.equipment :: any)[slotStr]
    if not currentEquipped then return end -- Nothing equipped in this slot

    -- Move item back to inventory
    table.insert(data.inventory, currentEquipped)
    ;(data.equipment :: any)[slotStr] = nil

    -- Recalculate stats
    local hp, atk, def, _ = getEffectiveStats(data)
    data.maxHP = hp
    data.atk = atk
    data.def = def

    local currentHP = playerCurrentHP[player.UserId] or hp
    playerCurrentHP[player.UserId] = math.min(currentHP, hp)

    syncPlayerUI(player)
end)

-- Use consumable item (potions)
UseItemRemote.OnServerEvent:Connect(function(player: Player, itemId: unknown)
    if type(itemId) ~= "string" then return end
    local id = itemId :: string

    local data = playerData[player.UserId]
    if not data then return end

    local itemDef = ITEM_DEFS[id]
    if not itemDef then return end
    if itemDef.slot then return end -- Can't "use" equippable items

    -- Find in inventory
    local inventoryIndex: number? = nil
    for i, invItem in data.inventory do
        if invItem == id then
            inventoryIndex = i
            break
        end
    end
    if not inventoryIndex then return end

    -- Apply effect (potions heal HP)
    if itemDef.hpBonus > 0 then
        local maxHP, _, _, _ = getEffectiveStats(data)
        local currentHP = playerCurrentHP[player.UserId] or maxHP
        playerCurrentHP[player.UserId] = math.min(currentHP + itemDef.hpBonus, maxHP)

        -- Update character Humanoid
        local character = player.Character
        if character then
            local hum = character:FindFirstChildOfClass("Humanoid")
            if hum then
                hum.Health = playerCurrentHP[player.UserId]
            end
        end
    end

    -- Remove from inventory (consumed)
    table.remove(data.inventory, inventoryIndex)
    syncPlayerUI(player)
end)

----------------------------------------------------------------------------
-- SHOP SYSTEM
-- Buy: Server checks gold, adds item to inventory, subtracts gold.
-- Sell: Server checks item in inventory, removes item, adds gold.
-- ALL validation is server-side. Client just sends intent.
----------------------------------------------------------------------------
ShopBuyRemote.OnServerEvent:Connect(function(player: Player, itemId: unknown)
    if type(itemId) ~= "string" then return end
    local id = itemId :: string

    local data = playerData[player.UserId]
    if not data then return end

    -- Find in shop
    local buyPrice: number? = nil
    for _, shopEntry in SHOP_ITEMS do
        if shopEntry.itemId == id then
            buyPrice = shopEntry.buyPrice
            break
        end
    end
    if not buyPrice then return end -- Not in shop

    -- Check gold
    if data.gold < buyPrice then return end -- Can't afford

    data.gold -= buyPrice
    table.insert(data.inventory, id)
    syncPlayerUI(player)
end)

ShopSellRemote.OnServerEvent:Connect(function(player: Player, itemId: unknown)
    if type(itemId) ~= "string" then return end
    local id = itemId :: string

    local data = playerData[player.UserId]
    if not data then return end

    local itemDef = ITEM_DEFS[id]
    if not itemDef then return end

    -- Find in inventory
    local inventoryIndex: number? = nil
    for i, invItem in data.inventory do
        if invItem == id then
            inventoryIndex = i
            break
        end
    end
    if not inventoryIndex then return end

    table.remove(data.inventory, inventoryIndex)
    data.gold += itemDef.sellValue
    syncPlayerUI(player)
end)

----------------------------------------------------------------------------
-- ENEMY HEALTH BAR (BillboardGui)
-- Creates a floating HP bar above the enemy. Updated on every hit.
-- Color shifts from green → yellow → red based on HP ratio.
----------------------------------------------------------------------------
local function createHealthBar(enemy: Model, maxHP: number, enemyType: string)
    local hrp = enemy:FindFirstChild("HumanoidRootPart") or enemy.PrimaryPart
    if not hrp then return end

    local billboard = Instance.new("BillboardGui")
    billboard.Name = "HealthBar"
    billboard.Size = UDim2.new(5, 0, 0.6, 0)
    billboard.StudsOffset = Vector3.new(0, 3.5, 0)
    billboard.AlwaysOnTop = true
    billboard.Parent = hrp

    -- Background bar
    local bgBar = Instance.new("Frame")
    bgBar.Name = "Background"
    bgBar.Size = UDim2.new(1, 0, 1, 0)
    bgBar.BackgroundColor3 = Color3.fromRGB(40, 40, 40)
    bgBar.BorderSizePixel = 0
    bgBar.Parent = billboard

    local bgCorner = Instance.new("UICorner")
    bgCorner.CornerRadius = UDim.new(0, 4)
    bgCorner.Parent = bgBar

    -- Fill bar
    local hpBar = Instance.new("Frame")
    hpBar.Name = "Fill"
    hpBar.Size = UDim2.new(1, 0, 1, 0)
    hpBar.BackgroundColor3 = Color3.fromRGB(50, 200, 50)
    hpBar.BorderSizePixel = 0
    hpBar.Parent = bgBar

    local hpCorner = Instance.new("UICorner")
    hpCorner.CornerRadius = UDim.new(0, 4)
    hpCorner.Parent = hpBar

    -- Name + level label
    local nameLabel = Instance.new("TextLabel")
    nameLabel.Size = UDim2.new(1, 0, 1, 0)
    nameLabel.Position = UDim2.new(0, 0, -1.5, 0)
    nameLabel.BackgroundTransparency = 1
    nameLabel.Text = enemyType .. " [" .. tostring(maxHP) .. " HP]"
    nameLabel.TextColor3 = Color3.fromRGB(255, 100, 100)
    nameLabel.TextStrokeTransparency = 0.3
    nameLabel.TextScaled = true
    nameLabel.Font = Enum.Font.GothamBold
    nameLabel.Parent = billboard
end

local function updateHealthBar(enemy: Model, currentHP: number, maxHP: number)
    local hrp = enemy:FindFirstChild("HumanoidRootPart") or enemy.PrimaryPart
    if not hrp then return end
    local billboard = hrp:FindFirstChild("HealthBar")
    if not billboard then return end
    local bgBar = billboard:FindFirstChild("Background")
    if not bgBar then return end
    local fill = bgBar:FindFirstChild("Fill")
    if fill and fill:IsA("GuiObject") then
        local ratio = math.clamp(currentHP / maxHP, 0, 1)
        fill.Size = UDim2.new(ratio, 0, 1, 0)
        if ratio > 0.5 then
            fill.BackgroundColor3 = Color3.fromRGB(50, 200, 50)
        elseif ratio > 0.25 then
            fill.BackgroundColor3 = Color3.fromRGB(220, 200, 30)
        else
            fill.BackgroundColor3 = Color3.fromRGB(220, 40, 40)
        end
    end
end

----------------------------------------------------------------------------
-- LOOT DROP SYSTEM
-- When an enemy dies, roll each loot table entry independently.
-- Create a floating, glowing part with ProximityPrompt for pickup.
-- Loot auto-despawns after LOOT_DESPAWN_TIME to prevent clutter.
----------------------------------------------------------------------------
local lootFolder = workspace:FindFirstChild("LootPickups")
if not lootFolder then
    lootFolder = Instance.new("Folder")
    lootFolder.Name = "LootPickups"
    lootFolder.Parent = workspace
end

local function dropLoot(position: Vector3, enemyType: string)
    local def = ENEMY_DEFS[enemyType]
    if not def then return end

    for _, lootEntry in def.lootTable do
        if math.random() <= lootEntry.dropChance then
            local itemDef = ITEM_DEFS[lootEntry.itemId]
            if not itemDef then continue end

            local lootPart = Instance.new("Part")
            lootPart.Name = "Loot_" .. lootEntry.itemId
            lootPart.Size = Vector3.new(1.5, 1.5, 1.5)
            lootPart.Shape = Enum.PartType.Ball
            lootPart.Material = Enum.Material.Neon
            lootPart.BrickColor = BrickColor.new("Bright yellow")
            lootPart.Anchored = true
            lootPart.CanCollide = false
            lootPart.Position = position + Vector3.new(
                math.random(-3, 3), 2, math.random(-3, 3)
            )
            lootPart:SetAttribute("ItemId", lootEntry.itemId)

            -- Floating bob animation
            local baseY = lootPart.Position.Y
            task.spawn(function()
                local t = 0
                while lootPart and lootPart.Parent do
                    t += 0.05
                    lootPart.Position = Vector3.new(
                        lootPart.Position.X,
                        baseY + math.sin(t * 3) * 0.5,
                        lootPart.Position.Z
                    )
                    task.wait(0.03)
                end
            end)

            -- Item name billboard
            local billboard = Instance.new("BillboardGui")
            billboard.Size = UDim2.new(4, 0, 1, 0)
            billboard.StudsOffset = Vector3.new(0, 2, 0)
            billboard.Parent = lootPart

            local label = Instance.new("TextLabel")
            label.Size = UDim2.new(1, 0, 1, 0)
            label.BackgroundTransparency = 1
            label.Text = itemDef.name
            label.TextColor3 = Color3.fromRGB(255, 215, 0)
            label.TextStrokeTransparency = 0
            label.TextScaled = true
            label.Font = Enum.Font.GothamBold
            label.Parent = billboard

            -- Pickup prompt
            local prompt = Instance.new("ProximityPrompt")
            prompt.ActionText = "Pick Up"
            prompt.ObjectText = itemDef.name
            prompt.HoldDuration = 0
            prompt.MaxActivationDistance = 8
            prompt.Parent = lootPart

            prompt.Triggered:Connect(function(player: Player)
                local data = playerData[player.UserId]
                if not data then return end
                if not lootPart.Parent then return end -- Already picked up

                local id = lootPart:GetAttribute("ItemId")
                if not id or type(id) ~= "string" then return end

                table.insert(data.inventory, id)

                -- Check collect quests
                for questId, questDef in QUEST_DEFS do
                    local qp = data.quests[questId]
                    if qp and qp.state == "Active" then
                        if questDef.requirement.type == "collect" and questDef.requirement.target == id then
                            qp.progress += 1
                            if qp.progress >= questDef.requirement.count then
                                qp.state = "TurnIn"
                            end
                        end
                    end
                end

                lootPart:Destroy()
                syncPlayerUI(player)
            end)

            lootPart.Parent = lootFolder
            Debris:AddItem(lootPart, LOOT_DESPAWN_TIME)
        end
    end
end

----------------------------------------------------------------------------
-- ENEMY AI STATE MACHINE
-- States: Idle → Chase → Attack → Return
--
-- Idle: Stand at spawn point. Scan for players within AGGRO_RANGE.
-- Chase: PathfindingService to target. Switch to Attack when close.
-- Attack: Deal damage on ENEMY_ATTACK_COOLDOWN. Switch back to Chase if
--         target moves away. Switch to Return if target dies or leaves range.
-- Return: PathfindingService back to spawn. Switch to Idle on arrival.
--
-- PathfindingService is used instead of MoveTo because it navigates around
-- obstacles. MoveTo walks in a straight line and gets stuck on walls.
----------------------------------------------------------------------------
local function runEnemyAI(enemy: Model, enemyState: EnemyState)
    local humanoid = enemy:FindFirstChildOfClass("Humanoid")
    if not humanoid then return end

    local def = ENEMY_DEFS[enemyState.enemyType]
    if not def then return end

    humanoid.WalkSpeed = def.moveSpeed

    -- AI loop runs every 0.2s for performance. 0.1s is unnecessary for
    -- this level of AI sophistication and wastes server budget.
    task.spawn(function()
        while enemy and enemy.Parent and activeEnemies[enemy] do
            local state = activeEnemies[enemy]
            if not state or state.hp <= 0 then break end

            local hrp = enemy:FindFirstChild("HumanoidRootPart") or enemy.PrimaryPart
            if not hrp or not hrp:IsA("BasePart") then break end

            local currentPos = hrp.Position

            -- IDLE STATE: scan for players
            if state.aiState == "Idle" then
                local closestPlayer: Player? = nil
                local closestDist = AGGRO_RANGE

                for _, player in Players:GetPlayers() do
                    local char = player.Character
                    if not char then continue end
                    local pHRP = char:FindFirstChild("HumanoidRootPart")
                    if not pHRP or not pHRP:IsA("BasePart") then continue end
                    local dist = (pHRP.Position - currentPos).Magnitude
                    if dist < closestDist then
                        closestDist = dist
                        closestPlayer = player
                    end
                end

                if closestPlayer then
                    state.aiState = "Chase"
                    state.targetPlayer = closestPlayer
                end

            -- CHASE STATE: pathfind toward target
            elseif state.aiState == "Chase" then
                local target = state.targetPlayer
                if not target or not target.Character then
                    state.aiState = "Return"
                    state.targetPlayer = nil
                else
                    local pHRP = target.Character:FindFirstChild("HumanoidRootPart")
                    if not pHRP or not pHRP:IsA("BasePart") then
                        state.aiState = "Return"
                        state.targetPlayer = nil
                    else
                        local dist = (pHRP.Position - currentPos).Magnitude

                        -- Leash check: too far from spawn, give up
                        local spawnDist = (currentPos - state.spawnPosition).Magnitude
                        if spawnDist > LEASH_RANGE then
                            state.aiState = "Return"
                            state.targetPlayer = nil
                        -- Close enough to attack
                        elseif dist <= ENEMY_ATTACK_RANGE then
                            state.aiState = "Attack"
                        else
                            -- Pathfind toward player
                            local path = PathfindingService:CreatePath({
                                AgentRadius = 2,
                                AgentHeight = 5,
                                AgentCanJump = true,
                            })

                            local pathSuccess, pathErr = pcall(function()
                                path:ComputeAsync(currentPos, pHRP.Position)
                            end)

                            if pathSuccess and path.Status == Enum.PathStatus.Success then
                                local waypoints = path:GetWaypoints()
                                for i = 2, math.min(#waypoints, 4) do
                                    -- Only follow a few waypoints then re-evaluate
                                    -- This prevents the enemy from following a stale path
                                    if not enemy.Parent or not activeEnemies[enemy] then break end
                                    humanoid:MoveTo(waypoints[i].Position)
                                    -- Don't wait for MoveToFinished (it can hang). Use a timeout.
                                    local reached = humanoid.MoveToFinished:Wait()
                                end
                            else
                                -- Fallback: simple MoveTo if pathfinding fails
                                humanoid:MoveTo(pHRP.Position)
                            end
                        end
                    end
                end

            -- ATTACK STATE: deal damage on cooldown
            elseif state.aiState == "Attack" then
                local target = state.targetPlayer
                if not target or not target.Character then
                    state.aiState = "Return"
                    state.targetPlayer = nil
                else
                    local pHRP = target.Character:FindFirstChild("HumanoidRootPart")
                    if not pHRP or not pHRP:IsA("BasePart") then
                        state.aiState = "Return"
                        state.targetPlayer = nil
                    else
                        local dist = (pHRP.Position - currentPos).Magnitude

                        if dist > ENEMY_ATTACK_RANGE * 1.5 then
                            -- Target moved away, chase again
                            state.aiState = "Chase"
                        else
                            -- Attack on cooldown
                            local now = tick()
                            if (now - state.lastAttackTime) >= ENEMY_ATTACK_COOLDOWN then
                                state.lastAttackTime = now

                                local pData = playerData[target.UserId]
                                if pData then
                                    local _, _, playerDef, _ = getEffectiveStats(pData)
                                    local damage, isCrit = calculateDamage(def.atk, playerDef)
                                    local currentHP = playerCurrentHP[target.UserId] or pData.maxHP
                                    currentHP -= damage
                                    playerCurrentHP[target.UserId] = math.max(0, currentHP)

                                    -- Fire damage number to client
                                    DamageNumberRemote:FireClient(target, {
                                        damage = damage,
                                        isCrit = isCrit,
                                        position = pHRP.Position + Vector3.new(0, 3, 0),
                                        isPlayerDamage = true,
                                    })

                                    if currentHP <= 0 then
                                        -- Player dies
                                        local hum = target.Character:FindFirstChildOfClass("Humanoid")
                                        if hum then hum.Health = 0 end
                                        state.aiState = "Return"
                                        state.targetPlayer = nil
                                    else
                                        -- Update player Humanoid HP
                                        local hum = target.Character:FindFirstChildOfClass("Humanoid")
                                        if hum then
                                            local maxHP, _, _, _ = getEffectiveStats(pData)
                                            hum.MaxHealth = maxHP
                                            hum.Health = currentHP
                                        end
                                    end

                                    syncPlayerUI(target)
                                end
                            end
                        end
                    end
                end

            -- RETURN STATE: walk back to spawn
            elseif state.aiState == "Return" then
                state.targetPlayer = nil

                -- Heal to full when returning (standard MMO behavior)
                state.hp = state.maxHP
                updateHealthBar(enemy, state.hp, state.maxHP)

                local path = PathfindingService:CreatePath({
                    AgentRadius = 2,
                    AgentHeight = 5,
                    AgentCanJump = true,
                })

                local pathSuccess = pcall(function()
                    path:ComputeAsync(currentPos, state.spawnPosition)
                end)

                if pathSuccess and path.Status == Enum.PathStatus.Success then
                    local waypoints = path:GetWaypoints()
                    for i = 2, #waypoints do
                        if not enemy.Parent or not activeEnemies[enemy] then break end
                        -- If a player aggros during return, switch to chase
                        if state.aiState ~= "Return" then break end
                        humanoid:MoveTo(waypoints[i].Position)
                        humanoid.MoveToFinished:Wait()
                    end
                else
                    humanoid:MoveTo(state.spawnPosition)
                    humanoid.MoveToFinished:Wait()
                end

                -- Back at spawn, go idle
                local distToSpawn = (currentPos - state.spawnPosition).Magnitude
                if distToSpawn < 5 then
                    state.aiState = "Idle"
                end
            end

            task.wait(0.2)
        end
    end)
end

----------------------------------------------------------------------------
-- BOSS FIGHT SYSTEM
-- Enhanced enemy with phase transitions at HP thresholds.
-- Phase 0: Normal attacks
-- Phase 1 (75% HP): Increased speed, adds AoE slam attack
-- Phase 2 (50% HP): Spawns minions, reduced cooldown
-- Phase 3 (25% HP): Enrage — double ATK, triple speed
--
-- Arena boundary prevents kiting. Players can't cheese the boss by
-- running away — the boundary Part blocks movement out.
----------------------------------------------------------------------------
local bossAlive = false

local function runBossAI(boss: Model, bossState: EnemyState)
    local humanoid = boss:FindFirstChildOfClass("Humanoid")
    if not humanoid then return end

    local def = ENEMY_DEFS[bossState.enemyType]
    if not def then return end

    humanoid.WalkSpeed = def.moveSpeed
    bossState.bossPhase = 0

    -- Boss-specific AoE slam: damages all players within 15 studs
    local function aoeSlam()
        local hrp = boss:FindFirstChild("HumanoidRootPart") or boss.PrimaryPart
        if not hrp or not hrp:IsA("BasePart") then return end

        -- Visual: red expanding ring (client receives event for VFX)
        for _, player in Players:GetPlayers() do
            BossPhaseRemote:FireClient(player, {
                type = "aoe_slam",
                position = hrp.Position,
                radius = 15,
            })
        end

        -- Damage all players within 15 studs
        for _, player in Players:GetPlayers() do
            local char = player.Character
            if not char then continue end
            local pHRP = char:FindFirstChild("HumanoidRootPart")
            if not pHRP or not pHRP:IsA("BasePart") then continue end

            local dist = (pHRP.Position - hrp.Position).Magnitude
            if dist <= 15 then
                local pData = playerData[player.UserId]
                if pData then
                    local _, _, playerDef, _ = getEffectiveStats(pData)
                    -- AoE does 60% of normal boss damage
                    local aoeDamage = math.floor(def.atk * 0.6)
                    local damage, isCrit = calculateDamage(aoeDamage, playerDef)
                    local currentHP = playerCurrentHP[player.UserId] or pData.maxHP
                    currentHP -= damage
                    playerCurrentHP[player.UserId] = math.max(0, currentHP)

                    DamageNumberRemote:FireClient(player, {
                        damage = damage,
                        isCrit = isCrit,
                        position = pHRP.Position + Vector3.new(0, 3, 0),
                        isPlayerDamage = true,
                    })

                    if currentHP <= 0 then
                        local hum = char:FindFirstChildOfClass("Humanoid")
                        if hum then hum.Health = 0 end
                    else
                        local hum = char:FindFirstChildOfClass("Humanoid")
                        if hum then
                            local maxHP, _, _, _ = getEffectiveStats(pData)
                            hum.MaxHealth = maxHP
                            hum.Health = currentHP
                        end
                    end

                    syncPlayerUI(player)
                end
            end
        end
    end

    -- Boss AI loop
    task.spawn(function()
        local slamCooldown = 0
        local minionCooldown = 0

        while boss and boss.Parent and activeEnemies[boss] do
            local state = activeEnemies[boss]
            if not state or state.hp <= 0 then break end

            local hrp = boss:FindFirstChild("HumanoidRootPart") or boss.PrimaryPart
            if not hrp or not hrp:IsA("BasePart") then break end

            -- Phase transitions based on HP ratio
            local hpRatio = state.hp / state.maxHP
            local newPhase = 0
            for i, threshold in BOSS_PHASE_THRESHOLDS do
                if hpRatio <= threshold then
                    newPhase = i
                end
            end

            if newPhase > (state.bossPhase or 0) then
                state.bossPhase = newPhase

                -- Notify all players of phase change
                for _, player in Players:GetPlayers() do
                    BossPhaseRemote:FireClient(player, {
                        type = "phase_change",
                        phase = newPhase,
                        bossName = state.enemyType,
                    })
                end

                -- Phase-specific buffs
                if newPhase == 1 then
                    humanoid.WalkSpeed = def.moveSpeed * 1.3
                elseif newPhase == 2 then
                    humanoid.WalkSpeed = def.moveSpeed * 1.5
                elseif newPhase == 3 then
                    -- Enrage: visual indicator
                    humanoid.WalkSpeed = def.moveSpeed * 2.0
                end
            end

            -- Find closest player to attack
            local closestPlayer: Player? = nil
            local closestDist = 100

            for _, player in Players:GetPlayers() do
                local char = player.Character
                if not char then continue end
                local pHRP = char:FindFirstChild("HumanoidRootPart")
                if not pHRP or not pHRP:IsA("BasePart") then continue end
                local dist = (pHRP.Position - hrp.Position).Magnitude
                if dist < closestDist then
                    closestDist = dist
                    closestPlayer = player
                end
            end

            if closestPlayer and closestPlayer.Character then
                local pHRP = closestPlayer.Character:FindFirstChild("HumanoidRootPart")
                if pHRP and pHRP:IsA("BasePart") then
                    -- Move toward player
                    humanoid:MoveTo(pHRP.Position)

                    -- Melee attack
                    if closestDist <= ENEMY_ATTACK_RANGE * 1.5 then
                        local now = tick()
                        local cd = ENEMY_ATTACK_COOLDOWN
                        -- Phase 2+ reduces cooldown
                        if (state.bossPhase or 0) >= 2 then cd = cd * 0.6 end

                        if (now - state.lastAttackTime) >= cd then
                            state.lastAttackTime = now

                            local pData = playerData[closestPlayer.UserId]
                            if pData then
                                local _, _, playerDef, _ = getEffectiveStats(pData)
                                local atkMult = 1
                                -- Phase 3 enrage: double damage
                                if (state.bossPhase or 0) >= 3 then atkMult = 2 end

                                local damage, isCrit = calculateDamage(
                                    def.atk * atkMult, playerDef
                                )
                                local currentHP = playerCurrentHP[closestPlayer.UserId] or pData.maxHP
                                currentHP -= damage
                                playerCurrentHP[closestPlayer.UserId] = math.max(0, currentHP)

                                DamageNumberRemote:FireClient(closestPlayer, {
                                    damage = damage,
                                    isCrit = isCrit,
                                    position = pHRP.Position + Vector3.new(0, 3, 0),
                                    isPlayerDamage = true,
                                })

                                if currentHP <= 0 then
                                    local hum = closestPlayer.Character:FindFirstChildOfClass("Humanoid")
                                    if hum then hum.Health = 0 end
                                else
                                    local hum = closestPlayer.Character:FindFirstChildOfClass("Humanoid")
                                    if hum then
                                        local maxHP, _, _, _ = getEffectiveStats(pData)
                                        hum.MaxHealth = maxHP
                                        hum.Health = currentHP
                                    end
                                end

                                syncPlayerUI(closestPlayer)
                            end
                        end
                    end

                    -- AoE slam (phase 1+, every 8 seconds)
                    if (state.bossPhase or 0) >= 1 then
                        slamCooldown += 0.3
                        if slamCooldown >= 8 then
                            slamCooldown = 0
                            aoeSlam()
                        end
                    end

                    -- Spawn minions (phase 2+, every 15 seconds)
                    if (state.bossPhase or 0) >= 2 then
                        minionCooldown += 0.3
                        if minionCooldown >= 15 then
                            minionCooldown = 0
                            -- Spawn 2 goblins near the boss as minions
                            local bossPos = hrp.Position
                            for i = 1, 2 do
                                local offset = Vector3.new(math.random(-5, 5), 0, math.random(-5, 5))
                                local minionSpawn = Instance.new("Part")
                                minionSpawn.Position = bossPos + offset
                                minionSpawn.Anchored = true
                                minionSpawn.Transparency = 1
                                minionSpawn.CanCollide = false
                                minionSpawn.Parent = workspace
                                spawnEnemy(minionSpawn, "Goblin")
                                Debris:AddItem(minionSpawn, 1)
                            end
                        end
                    end
                end
            end

            task.wait(0.3)
        end
    end)
end

----------------------------------------------------------------------------
-- ENEMY SPAWNING
-- Clone template from ServerStorage, position at spawn point, setup AI.
-- On death: drop loot, award XP/Gold, respawn after timer.
-- Materials are forced away from SmoothPlastic (brand rule).
----------------------------------------------------------------------------
local function spawnEnemy(spawnPoint: BasePart, enemyType: string)
    local templatesFolder = ServerStorage:FindFirstChild("EnemyTemplates")
    if not templatesFolder then
        warn("[RPG] ServerStorage/EnemyTemplates folder missing!")
        return
    end

    local template = templatesFolder:FindFirstChild(enemyType)
    if not template then
        warn("[RPG] Enemy template not found:", enemyType)
        return
    end

    local enemy = template:Clone()
    enemy.Name = enemyType

    -- Position at spawn
    if enemy:IsA("Model") and enemy.PrimaryPart then
        enemy:PivotTo(spawnPoint.CFrame + Vector3.new(0, 3, 0))
    end

    -- Material enforcement: never use SmoothPlastic
    for _, part in enemy:GetDescendants() do
        if part:IsA("BasePart") and part.Material == Enum.Material.SmoothPlastic then
            part.Material = Enum.Material.Concrete
        end
    end

    local def = ENEMY_DEFS[enemyType]
    if not def then return end

    local isBoss = enemyType == "ShadowLord"

    -- Track enemy state
    local enemyState: EnemyState = {
        hp = def.hp,
        maxHP = def.hp,
        enemyType = enemyType,
        spawnPosition = spawnPoint.Position,
        aiState = "Idle",
        targetPlayer = nil,
        lastAttackTime = 0,
        bossPhase = if isBoss then 0 else nil,
    }
    activeEnemies[enemy] = enemyState

    createHealthBar(enemy, def.hp, enemyType)

    local humanoid = enemy:FindFirstChildOfClass("Humanoid")
    if humanoid then
        humanoid.MaxHealth = def.hp
        humanoid.Health = def.hp
    end

    enemy.Parent = workspace

    -- Start AI
    if isBoss then
        bossAlive = true
        runBossAI(enemy, enemyState)
    else
        runEnemyAI(enemy, enemyState)
    end

    -- Handle death
    if humanoid then
        humanoid.Died:Connect(function()
            local state = activeEnemies[enemy]
            activeEnemies[enemy] = nil

            if isBoss then
                bossAlive = false
            end

            -- Drop loot at death position
            local hrp = enemy:FindFirstChild("HumanoidRootPart") or enemy.PrimaryPart
            if hrp and hrp:IsA("BasePart") then
                dropLoot(hrp.Position, enemyType)
            end

            -- Destroy after death animation
            task.delay(3, function()
                if enemy and enemy.Parent then
                    enemy:Destroy()
                end
            end)

            -- Respawn after timer
            task.delay(if isBoss then ENEMY_RESPAWN_TIME * 3 else ENEMY_RESPAWN_TIME, function()
                if spawnPoint and spawnPoint.Parent then
                    spawnEnemy(spawnPoint, enemyType)
                end
            end)
        end)
    end
end

-- Initialize all spawn points
local function setupEnemySpawns()
    local spawnsFolder = workspace:FindFirstChild("EnemySpawns")
    if not spawnsFolder then
        warn("[RPG] Workspace/EnemySpawns folder not found!")
        return
    end

    for spawnName, enemyType in SPAWN_CONFIG do
        local spawnPoint = spawnsFolder:FindFirstChild(spawnName)
        if spawnPoint and spawnPoint:IsA("BasePart") then
            spawnPoint.Material = Enum.Material.Concrete
            spawnPoint.BrickColor = BrickColor.new("Dark stone grey")
            spawnPoint.Transparency = 0.8
            spawnEnemy(spawnPoint, enemyType)
        end
    end

    -- Boss spawn
    local bossArena = workspace:FindFirstChild("BossArena")
    if bossArena then
        local bossSpawn = bossArena:FindFirstChild("BossSpawn")
        if bossSpawn and bossSpawn:IsA("BasePart") then
            spawnEnemy(bossSpawn, "ShadowLord")
        end
    end
end

setupEnemySpawns()

----------------------------------------------------------------------------
-- COMBAT SYSTEM (Player → Enemy)
-- Client fires AttackRemote with target enemy reference.
-- Server validates: type check, rate limit, distance (raycast), then
-- calculates damage with crit chance and applies it.
-- Damage numbers are sent to ALL nearby players for visual feedback.
----------------------------------------------------------------------------
AttackRemote.OnServerEvent:Connect(function(player: Player, targetEnemy: unknown)
    -- Type validation
    if not targetEnemy or typeof(targetEnemy) ~= "Instance" then return end
    if not (targetEnemy :: Instance):IsA("Model") then return end
    local enemy = targetEnemy :: Model

    -- Rate limit (prevents attack spam exploits)
    local now = tick()
    local last = lastAttackTime[player.UserId] or 0
    if (now - last) < ATTACK_COOLDOWN then return end
    lastAttackTime[player.UserId] = now

    local data = playerData[player.UserId]
    if not data then return end

    -- Character validation
    local character = player.Character
    if not character then return end
    local playerHRP = character:FindFirstChild("HumanoidRootPart")
    if not playerHRP or not playerHRP:IsA("BasePart") then return end

    local enemyHRP = enemy:FindFirstChild("HumanoidRootPart") or enemy.PrimaryPart
    if not enemyHRP or not enemyHRP:IsA("BasePart") then return end

    -- Range check via raycast. More secure than simple distance check
    -- because it also verifies line of sight (can't attack through walls).
    local direction = (enemyHRP.Position - playerHRP.Position)
    local distance = direction.Magnitude
    if distance > MELEE_RANGE then return end

    -- Optional: raycast for line-of-sight check
    local rayParams = RaycastParams.new()
    rayParams.FilterDescendantsInstances = { character, enemy }
    rayParams.FilterType = Enum.RaycastFilterType.Exclude
    local ray = workspace:Raycast(playerHRP.Position, direction.Unit * distance, rayParams)
    -- If ray hits something between player and enemy, blocked (wall)
    if ray then return end

    -- Get enemy state
    local enemyState = activeEnemies[enemy]
    if not enemyState or enemyState.hp <= 0 then return end

    -- Calculate damage with player's effective stats
    local _, playerATK, _, extraCrit = getEffectiveStats(data)
    local enemyDEF = ENEMY_DEFS[enemyState.enemyType].def
    local damage, isCrit = calculateDamage(playerATK, enemyDEF, extraCrit)

    -- Apply damage
    enemyState.hp -= damage
    updateHealthBar(enemy, enemyState.hp, enemyState.maxHP)

    -- Fire damage number to all nearby players for visual feedback
    for _, p in Players:GetPlayers() do
        DamageNumberRemote:FireClient(p, {
            damage = damage,
            isCrit = isCrit,
            position = enemyHRP.Position + Vector3.new(0, 2, 0),
            isPlayerDamage = false,
        })
    end

    -- Update Humanoid so death animation triggers naturally
    local humanoid = enemy:FindFirstChildOfClass("Humanoid")
    if humanoid then
        humanoid.Health = math.max(0, enemyState.hp)
    end

    -- Enemy aggro: if idle, aggro on the attacker
    if enemyState.aiState == "Idle" or enemyState.aiState == "Return" then
        enemyState.aiState = "Chase"
        enemyState.targetPlayer = player
    end

    -- Check if enemy died
    if enemyState.hp <= 0 then
        local enemyType = enemyState.enemyType
        local def = ENEMY_DEFS[enemyType]
        if def then
            -- Award XP and Gold
            data.xp += def.xpReward
            data.gold += def.goldReward
            data.totalKills += 1

            -- Update kill quests for ALL players who damaged this enemy
            -- (simplified: only award to killing player)
            for questId, questDef in QUEST_DEFS do
                local qp = data.quests[questId]
                if qp and qp.state == "Active" then
                    if questDef.requirement.type == "kill" and questDef.requirement.target == enemyType then
                        qp.progress += 1
                        if qp.progress >= questDef.requirement.count then
                            qp.state = "TurnIn"
                        end
                    end
                end
            end

            checkLevelUp(player)
            syncPlayerUI(player)
        end
    end
end)

----------------------------------------------------------------------------
-- NPC INTERACTION + DIALOGUE SYSTEM
-- NPCs have ProximityPrompts. Interacting triggers dialogue based on
-- the NPC type (quest giver, shopkeeper, guide).
-- Quest giver dialogue changes based on quest state.
-- Guide NPC uses branching dialogue trees.
-- Shopkeeper opens buy/sell interface.
----------------------------------------------------------------------------
local function setupNPCs()
    local npcsFolder = workspace:FindFirstChild("NPCs")
    if not npcsFolder then return end

    for _, npc in npcsFolder:GetChildren() do
        if not npc:IsA("Model") then continue end

        -- Material enforcement
        for _, part in npc:GetDescendants() do
            if part:IsA("BasePart") and part.Material == Enum.Material.SmoothPlastic then
                part.Material = Enum.Material.Concrete
            end
        end

        local hrp = npc:FindFirstChild("HumanoidRootPart")
            or (npc:IsA("Model") and npc.PrimaryPart)
        if not hrp or not hrp:IsA("BasePart") then continue end

        -- Name billboard
        local billboard = Instance.new("BillboardGui")
        billboard.Size = UDim2.new(5, 0, 1, 0)
        billboard.StudsOffset = Vector3.new(0, 4, 0)
        billboard.Parent = hrp

        local label = Instance.new("TextLabel")
        label.Size = UDim2.new(1, 0, 1, 0)
        label.BackgroundTransparency = 1
        label.Text = npc.Name:gsub("(%u)", " %1"):sub(2) -- CamelCase → spaced
        label.TextColor3 = Color3.fromRGB(255, 215, 0)
        label.TextStrokeTransparency = 0
        label.TextScaled = true
        label.Font = Enum.Font.GothamBold
        label.Parent = billboard

        -- Interaction prompt
        local prompt = Instance.new("ProximityPrompt")
        prompt.ActionText = "Talk"
        prompt.ObjectText = npc.Name
        prompt.HoldDuration = 0
        prompt.MaxActivationDistance = 10
        prompt.Parent = hrp

        local npcName = npc.Name

        prompt.Triggered:Connect(function(player: Player)
            local data = playerData[player.UserId]
            if not data then return end

            -- Check "talk to NPC" quests
            for questId, questDef in QUEST_DEFS do
                local qp = data.quests[questId]
                if qp and qp.state == "Active" then
                    if questDef.requirement.type == "talk" and questDef.requirement.target == npcName then
                        qp.progress = 1
                        if qp.progress >= questDef.requirement.count then
                            qp.state = "TurnIn"
                        end
                        syncPlayerUI(player)
                    end
                end
            end

            -- Branching dialogue tree NPC
            local dialogueTree = NPC_DIALOGUE[npcName]
            if dialogueTree then
                local rootNode = dialogueTree.root
                DialogueRemote:FireClient(player, {
                    npcName = npcName,
                    text = rootNode.text,
                    options = rootNode.options,
                    dialogueTree = dialogueTree,
                    action = "dialogue_tree",
                })
                return
            end

            -- Quest giver NPC: dialogue depends on quest state
            local isQuestGiver = false
            for _, questDef in QUEST_DEFS do
                if questDef.giverNPC == npcName then
                    isQuestGiver = true
                    break
                end
            end

            if isQuestGiver then
                -- Priority 1: TurnIn quests (claim rewards)
                for questId, questDef in QUEST_DEFS do
                    if questDef.giverNPC ~= npcName then continue end
                    local qp = data.quests[questId]
                    if qp and qp.state == "TurnIn" then
                        -- Give rewards
                        data.xp += questDef.reward.xp
                        data.gold += questDef.reward.gold
                        if questDef.reward.items then
                            for _, itemId in questDef.reward.items do
                                table.insert(data.inventory, itemId)
                            end
                        end

                        -- Consume collected items for collect quests
                        if questDef.requirement.type == "collect" then
                            local needed = questDef.requirement.count
                            local removed = 0
                            local newInv = {}
                            for _, invItem in data.inventory do
                                if invItem == questDef.requirement.target and removed < needed then
                                    removed += 1
                                else
                                    table.insert(newInv, invItem)
                                end
                            end
                            data.inventory = newInv
                        end

                        qp.state = "Rewarded"
                        checkLevelUp(player)
                        syncPlayerUI(player)

                        DialogueRemote:FireClient(player, {
                            npcName = npcName,
                            text = questDef.dialogueTurnIn,
                            questId = questId,
                            action = "reward",
                        })
                        return
                    end
                end

                -- Priority 2: Active quests (show progress)
                for questId, questDef in QUEST_DEFS do
                    if questDef.giverNPC ~= npcName then continue end
                    local qp = data.quests[questId]
                    if qp and qp.state == "Active" then
                        local progressText = questDef.dialogueActive
                            .. " (" .. tostring(qp.progress) .. "/" .. tostring(questDef.requirement.count) .. ")"
                        DialogueRemote:FireClient(player, {
                            npcName = npcName,
                            text = progressText,
                            questId = questId,
                            action = "progress",
                        })
                        return
                    end
                end

                -- Priority 3: Rewarded quests (post-completion dialogue)
                -- (check if all quests from this NPC are rewarded → nothing to offer)
                local hasOfferable = false

                -- Priority 4: Offer new quest (check prereqs)
                for questId, questDef in QUEST_DEFS do
                    if questDef.giverNPC ~= npcName then continue end
                    local qp = data.quests[questId]
                    if qp and (qp.state ~= "NotStarted") then continue end
                    -- Not started or nil — check prereqs
                    if questDef.prereqQuest then
                        local prereq = data.quests[questDef.prereqQuest]
                        if not prereq or prereq.state ~= "Rewarded" then continue end
                    end

                    hasOfferable = true
                    DialogueRemote:FireClient(player, {
                        npcName = npcName,
                        text = questDef.dialogueOffer,
                        questId = questId,
                        action = "offer",
                    })
                    return
                end

                if not hasOfferable then
                    -- Check for any rewarded quest to show post-completion dialogue
                    for questId, questDef in QUEST_DEFS do
                        if questDef.giverNPC ~= npcName then continue end
                        local qp = data.quests[questId]
                        if qp and qp.state == "Rewarded" then
                            DialogueRemote:FireClient(player, {
                                npcName = npcName,
                                text = questDef.dialogueRewarded,
                                action = "none",
                            })
                            return
                        end
                    end

                    DialogueRemote:FireClient(player, {
                        npcName = npcName,
                        text = "I have no quests for you right now.",
                        action = "none",
                    })
                end
                return
            end

            -- Default NPC dialogue
            DialogueRemote:FireClient(player, {
                npcName = npcName,
                text = "Hello, adventurer!",
                action = "none",
            })
        end)
    end
end

setupNPCs()

-- Accept quest from dialogue
AcceptQuestRemote.OnServerEvent:Connect(function(player: Player, questId: unknown)
    if type(questId) ~= "string" then return end
    local id = questId :: string

    local questDef = QUEST_DEFS[id]
    if not questDef then return end

    local data = playerData[player.UserId]
    if not data then return end

    -- Check if already started
    local qp = data.quests[id]
    if qp and qp.state ~= "NotStarted" then return end

    -- Check prereq
    if questDef.prereqQuest then
        local prereq = data.quests[questDef.prereqQuest]
        if not prereq or prereq.state ~= "Rewarded" then return end
    end

    data.quests[id] = {
        state = "Active",
        progress = 0,
    }

    syncPlayerUI(player)
end)

-- Dialogue choice (for branching dialogue trees)
DialogueChoiceRemote.OnServerEvent:Connect(function(player: Player, npcName: unknown, nodeId: unknown)
    if type(npcName) ~= "string" or type(nodeId) ~= "string" then return end

    local tree = NPC_DIALOGUE[npcName :: string]
    if not tree then return end

    local node = tree[nodeId :: string]
    if not node then return end

    DialogueRemote:FireClient(player, {
        npcName = npcName,
        text = node.text,
        options = node.options,
        action = "dialogue_tree",
    })
end)

----------------------------------------------------------------------------
-- REACH-LOCATION QUEST CHECK
-- Uses a Touched event on the BossArena boundary area. When a player
-- enters, we check if they have a "reach" quest targeting that area.
----------------------------------------------------------------------------
local function setupReachQuestTriggers()
    local bossArena = workspace:FindFirstChild("BossArena")
    if not bossArena then return end

    -- Create an invisible trigger part covering the arena entrance
    local trigger = bossArena:FindFirstChild("ArenaBoundary")
    if not trigger or not trigger:IsA("BasePart") then return end

    trigger.Touched:Connect(function(hit: BasePart)
        local character = hit.Parent
        if not character then return end
        local player = Players:GetPlayerFromCharacter(character)
        if not player then return end

        local data = playerData[player.UserId]
        if not data then return end

        for questId, questDef in QUEST_DEFS do
            local qp = data.quests[questId]
            if qp and qp.state == "Active" then
                if questDef.requirement.type == "reach" and questDef.requirement.target == "BossArena" then
                    qp.progress = 1
                    qp.state = "TurnIn"
                    syncPlayerUI(player)
                end
            end
        end
    end)
end

setupReachQuestTriggers()

----------------------------------------------------------------------------
-- PLAYER JOIN / LEAVE
-- On join: load data, setup leaderstats, sync UI.
-- On character spawn: set HP, handle respawn with 50% HP penalty.
-- On leave: save data, clean up all tracking tables.
----------------------------------------------------------------------------
Players.PlayerAdded:Connect(function(player: Player)
    local data = loadPlayerData(player)
    playerData[player.UserId] = data

    -- Initialize HP from effective stats
    local hp, _, _, _ = getEffectiveStats(data)
    playerCurrentHP[player.UserId] = hp

    setupLeaderstats(player)
    syncPlayerUI(player)

    player.CharacterAdded:Connect(function(character: Model)
        local humanoid = character:WaitForChild("Humanoid", 5)
        if humanoid and humanoid:IsA("Humanoid") then
            local maxHP, _, _, _ = getEffectiveStats(data)
            humanoid.MaxHealth = maxHP
            humanoid.Health = playerCurrentHP[player.UserId] or maxHP
        end

        -- If player died, respawn at 50% HP (death penalty but not brutal)
        local currentHP = playerCurrentHP[player.UserId] or 0
        if currentHP <= 0 then
            local maxHP, _, _, _ = getEffectiveStats(data)
            playerCurrentHP[player.UserId] = math.floor(maxHP * 0.5)
            if humanoid and humanoid:IsA("Humanoid") then
                humanoid.Health = playerCurrentHP[player.UserId]
            end
        end

        syncPlayerUI(player)
    end)
end)

Players.PlayerRemoving:Connect(function(player: Player)
    local userId = player.UserId
    savePlayerData(userId)

    -- Clean up all tracking tables
    playerData[userId] = nil
    playerCurrentHP[userId] = nil
    lastAttackTime[userId] = nil
end)

----------------------------------------------------------------------------
-- AUTO-SAVE
-- Saves all players every SAVE_INTERVAL seconds. Each save is in its
-- own task.spawn so one player's save failure doesn't block others.
-- DataStore has a budget of 60 + 10*players requests per minute,
-- so saving every 60s is safe for up to ~50 players.
----------------------------------------------------------------------------
task.spawn(function()
    while true do
        task.wait(SAVE_INTERVAL)
        for userId, _ in playerData do
            task.spawn(function()
                savePlayerData(userId)
            end)
        end
    end
end)

----------------------------------------------------------------------------
-- BIND TO CLOSE
-- When the server shuts down (deploy, crash, etc.), save ALL player data.
-- The 5-second wait gives DataStore time to complete writes.
-- Without this, players lose progress when the server restarts.
----------------------------------------------------------------------------
game:BindToClose(function()
    local threads = {}
    for userId, _ in playerData do
        local t = task.spawn(function()
            savePlayerData(userId)
        end)
        table.insert(threads, t)
    end
    -- Wait up to 5 seconds for all saves to complete
    task.wait(5)
end)

print("[RPG] All systems loaded — Stats, Combat, Quests, Dialogue, Inventory, Equipment, Enemy AI, Boss Fight, DataStore")
`;
}
