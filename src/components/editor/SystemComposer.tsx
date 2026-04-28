'use client'

/**
 * SystemComposer — Visual game system picker.
 * Users check which systems they want, dependencies auto-resolve,
 * and the multi-script pipeline generates all systems integrated.
 *
 * Unique to ForjeGames — no competitor has this.
 * 400+ game systems covering every Roblox mechanic.
 */

import { useState, useCallback, useMemo } from 'react'

interface GameSystem {
  id: string
  name: string
  icon: string
  description: string
  dependencies: string[] // IDs of required systems
}

type SystemCategory =
  | 'Core'
  | 'Economy'
  | 'Combat'
  | 'Social'
  | 'Pets'
  | 'Tycoon'
  | 'Obby'
  | 'Simulator'
  | 'RPG'
  | 'Building'
  | 'Vehicles'
  | 'Environment'
  | 'UI'
  | 'Audio'
  | 'Monetization'
  | 'Events'
  | 'Advanced'

interface CategorizedSystem extends GameSystem {
  category: SystemCategory
}

const GAME_SYSTEMS: CategorizedSystem[] = [
  // ═══════════════════════════════════════════
  // CORE (30)
  // ═══════════════════════════════════════════
  { id: 'inventory', name: 'Inventory', icon: '🎒', description: 'Item storage, equipping, stacking', dependencies: [], category: 'Core' },
  { id: 'datastore', name: 'Data Save', icon: '💾', description: 'Player data persistence with DataStore2/ProfileService', dependencies: [], category: 'Core' },
  { id: 'spawning', name: 'Spawn System', icon: '📍', description: 'Spawn points, respawning, spawn selection', dependencies: [], category: 'Core' },
  { id: 'teams', name: 'Teams', icon: '👥', description: 'Team assignment, colors, balancing', dependencies: [], category: 'Core' },
  { id: 'rounds', name: 'Round System', icon: '🔄', description: 'Game rounds, timers, intermission', dependencies: [], category: 'Core' },
  { id: 'teleport', name: 'Teleportation', icon: '🌀', description: 'Place-to-place, zone warps', dependencies: [], category: 'Core' },
  { id: 'character-controller', name: 'Character Controller', icon: '🏃', description: 'Custom movement, sprint, crouch, prone', dependencies: [], category: 'Core' },
  { id: 'camera-system', name: 'Camera System', icon: '📷', description: 'First person, third person, top-down, isometric', dependencies: [], category: 'Core' },
  { id: 'input-system', name: 'Input System', icon: '🎮', description: 'Keybinds, gamepad, mobile controls, remapping', dependencies: [], category: 'Core' },
  { id: 'admin-commands', name: 'Admin Commands', icon: '🛠️', description: 'Kick, ban, teleport, god mode, fly commands', dependencies: [], category: 'Core' },
  { id: 'anti-cheat', name: 'Anti-Cheat', icon: '🛡️', description: 'Speed check, teleport detection, exploit prevention', dependencies: [], category: 'Core' },
  { id: 'server-list', name: 'Server List', icon: '📋', description: 'Server browser, player count, join specific server', dependencies: [], category: 'Core' },
  { id: 'vip-servers', name: 'VIP Servers', icon: '🔒', description: 'Private server creation and management', dependencies: [], category: 'Core' },
  { id: 'matchmaking', name: 'Matchmaking', icon: '🎯', description: 'Skill-based, queue system, lobby filling', dependencies: [], category: 'Core' },
  { id: 'tutorial', name: 'Tutorial System', icon: '📖', description: 'Step-by-step guide, arrows, highlights', dependencies: [], category: 'Core' },
  { id: 'permissions', name: 'Permissions', icon: '🔐', description: 'Role-based access, admin levels, mod tools', dependencies: [], category: 'Core' },
  { id: 'zone-system', name: 'Zone System', icon: '🗺️', description: 'Area detection, zone transitions, region triggers', dependencies: [], category: 'Core' },
  { id: 'collision-groups', name: 'Collision Groups', icon: '💥', description: 'Custom collision filtering between objects', dependencies: [], category: 'Core' },
  { id: 'physics-system', name: 'Physics System', icon: '⚡', description: 'Custom gravity, forces, ragdoll, constraints', dependencies: [], category: 'Core' },
  { id: 'animation-system', name: 'Animation System', icon: '🎬', description: 'Custom animations, blending, priorities', dependencies: [], category: 'Core' },
  { id: 'cooldown-system', name: 'Cooldown System', icon: '⏱️', description: 'Global cooldown manager for abilities and actions', dependencies: [], category: 'Core' },
  { id: 'event-system', name: 'Event System', icon: '📡', description: 'Custom event bus, RemoteEvents, RemoteFunctions', dependencies: [], category: 'Core' },
  { id: 'object-pooling', name: 'Object Pooling', icon: '♻️', description: 'Reusable object pool for performance', dependencies: [], category: 'Core' },
  { id: 'streaming-system', name: 'Streaming System', icon: '📶', description: 'StreamingEnabled optimization, part loading', dependencies: [], category: 'Core' },
  { id: 'replication', name: 'Replication', icon: '🔗', description: 'Custom state replication, sync across clients', dependencies: [], category: 'Core' },
  { id: 'command-bar', name: 'Command Bar', icon: '💻', description: 'In-game command input, slash commands', dependencies: [], category: 'Core' },
  { id: 'data-migration', name: 'Data Migration', icon: '📦', description: 'Version migration for saved player data', dependencies: ['datastore'], category: 'Core' },
  { id: 'session-locking', name: 'Session Locking', icon: '🔑', description: 'Prevent data duplication across servers', dependencies: ['datastore'], category: 'Core' },
  { id: 'soft-shutdown', name: 'Soft Shutdown', icon: '🔄', description: 'Graceful server shutdown with teleport', dependencies: ['teleport'], category: 'Core' },
  { id: 'player-profile', name: 'Player Profile', icon: '👤', description: 'Profile card, stats, avatar display', dependencies: ['datastore'], category: 'Core' },

  // ═══════════════════════════════════════════
  // ECONOMY (35)
  // ═══════════════════════════════════════════
  { id: 'currency', name: 'Currency', icon: '💰', description: 'Multiple currencies, earning, spending', dependencies: [], category: 'Economy' },
  { id: 'shop', name: 'Shop', icon: '🏪', description: 'Buy/sell items, currency, pricing', dependencies: ['inventory'], category: 'Economy' },
  { id: 'trading', name: 'Trading', icon: '🤝', description: 'Player-to-player item exchange', dependencies: ['inventory'], category: 'Economy' },
  { id: 'auction', name: 'Auction House', icon: '🏛️', description: 'Player marketplace, bidding, timer', dependencies: ['inventory', 'currency'], category: 'Economy' },
  { id: 'crafting', name: 'Crafting', icon: '🔨', description: 'Recipes, materials, workbenches', dependencies: ['inventory'], category: 'Economy' },
  { id: 'coin-system', name: 'Coin System', icon: '🪙', description: 'Collectible coins, floor spawns, magnet', dependencies: ['currency'], category: 'Economy' },
  { id: 'gem-system', name: 'Gem System', icon: '💎', description: 'Premium currency, harder to earn', dependencies: ['currency'], category: 'Economy' },
  { id: 'token-system', name: 'Token System', icon: '🎟️', description: 'Event tokens, seasonal currency', dependencies: ['currency'], category: 'Economy' },
  { id: 'cash-register', name: 'Cash Register', icon: '🧾', description: 'Interactive purchase counter for roleplay', dependencies: ['currency'], category: 'Economy' },
  { id: 'atm', name: 'ATM', icon: '🏧', description: 'Withdraw/deposit money, bank balance', dependencies: ['currency'], category: 'Economy' },
  { id: 'bank-vault', name: 'Bank Vault', icon: '🏦', description: 'Secure storage, robbable, interest', dependencies: ['currency'], category: 'Economy' },
  { id: 'stock-market', name: 'Stock Market', icon: '📈', description: 'Buy/sell stocks, price fluctuations', dependencies: ['currency'], category: 'Economy' },
  { id: 'spin-wheel', name: 'Spin Wheel', icon: '🎡', description: 'Luck-based spin for rewards', dependencies: ['currency'], category: 'Economy' },
  { id: 'slot-machine', name: 'Slot Machine', icon: '🎰', description: 'Gambling slots, jackpot, animations', dependencies: ['currency'], category: 'Economy' },
  { id: 'coin-flip', name: 'Coin Flip', icon: '🪙', description: 'Double or nothing coin flip game', dependencies: ['currency'], category: 'Economy' },
  { id: 'donation-system', name: 'Donation System', icon: '🎁', description: 'Donate currency to other players', dependencies: ['currency'], category: 'Economy' },
  { id: 'player-stalls', name: 'Player Stalls', icon: '🏕️', description: 'Set up your own shop stall', dependencies: ['inventory', 'currency'], category: 'Economy' },
  { id: 'vending-machine', name: 'Vending Machine', icon: '🥤', description: 'Quick-buy machine for items', dependencies: ['currency', 'inventory'], category: 'Economy' },
  { id: 'lemonade-stand', name: 'Lemonade Stand', icon: '🍋', description: 'Simple business roleplay stand', dependencies: ['currency'], category: 'Economy' },
  { id: 'pizza-shop', name: 'Pizza Shop', icon: '🍕', description: 'Pizza making, ordering, delivery', dependencies: ['currency'], category: 'Economy' },
  { id: 'restaurant', name: 'Restaurant', icon: '🍽️', description: 'Full restaurant with kitchen, serving, tables', dependencies: ['currency'], category: 'Economy' },
  { id: 'bakery', name: 'Bakery', icon: '🧁', description: 'Baking minigame, recipes, serving', dependencies: ['currency', 'crafting'], category: 'Economy' },
  { id: 'car-dealership', name: 'Car Dealership', icon: '🚘', description: 'Buy/sell vehicles from dealer', dependencies: ['currency', 'vehicles'], category: 'Economy' },
  { id: 'real-estate', name: 'Real Estate', icon: '🏠', description: 'Buy/sell houses, property ownership', dependencies: ['currency'], category: 'Economy' },
  { id: 'rent-system', name: 'Rent System', icon: '🔑', description: 'Recurring rent payments for property', dependencies: ['currency', 'real-estate'], category: 'Economy' },
  { id: 'tax-system', name: 'Tax System', icon: '📊', description: 'Income tax, sales tax, tax brackets', dependencies: ['currency'], category: 'Economy' },
  { id: 'salary-system', name: 'Salary System', icon: '💵', description: 'Periodic salary payments for jobs', dependencies: ['currency'], category: 'Economy' },
  { id: 'price-history', name: 'Price History', icon: '📉', description: 'Track item price changes over time', dependencies: ['auction'], category: 'Economy' },
  { id: 'supply-demand', name: 'Supply & Demand', icon: '⚖️', description: 'Dynamic pricing based on availability', dependencies: ['shop', 'currency'], category: 'Economy' },
  { id: 'lottery-system', name: 'Lottery System', icon: '🎱', description: 'Number picking, jackpot pool, draws', dependencies: ['currency'], category: 'Economy' },
  { id: 'crate-system', name: 'Crate System', icon: '📦', description: 'Loot crates with keys, rarity tiers', dependencies: ['inventory', 'currency'], category: 'Economy' },
  { id: 'black-market', name: 'Black Market', icon: '🕶️', description: 'Hidden shop with rare items, rotating stock', dependencies: ['shop'], category: 'Economy' },
  { id: 'pawn-shop', name: 'Pawn Shop', icon: '🏚️', description: 'Sell any item for quick cash', dependencies: ['inventory', 'currency'], category: 'Economy' },
  { id: 'bounty-board', name: 'Bounty Board', icon: '📜', description: 'Post and claim bounties for rewards', dependencies: ['currency'], category: 'Economy' },
  { id: 'job-system', name: 'Job System', icon: '👷', description: 'Available jobs, work tasks, payday', dependencies: ['currency'], category: 'Economy' },

  // ═══════════════════════════════════════════
  // COMBAT (45)
  // ═══════════════════════════════════════════
  { id: 'combat', name: 'Combat', icon: '⚔️', description: 'Health, damage, abilities, knockback', dependencies: [], category: 'Combat' },
  { id: 'weapons', name: 'Weapons', icon: '🗡️', description: 'Swords, guns, bows, ammo', dependencies: ['combat'], category: 'Combat' },
  { id: 'abilities', name: 'Abilities', icon: '✨', description: 'Cooldowns, mana, skill trees', dependencies: ['combat'], category: 'Combat' },
  { id: 'bossfights', name: 'Boss Fights', icon: '👹', description: 'Boss AI, phases, loot drops', dependencies: ['combat', 'npcs'], category: 'Combat' },
  { id: 'pvp', name: 'PvP Arena', icon: '🥊', description: 'Player vs player, matchmaking', dependencies: ['combat', 'teams'], category: 'Combat' },
  { id: 'tower-defense', name: 'Tower Defense', icon: '🗼', description: 'Towers, waves, paths, upgrades', dependencies: ['combat', 'currency'], category: 'Combat' },
  { id: 'sword-combat', name: 'Sword Combat', icon: '⚔️', description: 'Slash, thrust, parry, heavy attack', dependencies: ['combat'], category: 'Combat' },
  { id: 'gun-combat', name: 'Gun Combat', icon: '🔫', description: 'Shooting, recoil, reload, ADS', dependencies: ['combat'], category: 'Combat' },
  { id: 'bow-combat', name: 'Bow Combat', icon: '🏹', description: 'Draw, aim, arrow types, trajectory', dependencies: ['combat'], category: 'Combat' },
  { id: 'magic-combat', name: 'Magic Combat', icon: '🪄', description: 'Spells, elements, casting animations', dependencies: ['combat', 'abilities'], category: 'Combat' },
  { id: 'martial-arts', name: 'Martial Arts', icon: '🥋', description: 'Punches, kicks, combos, fighting styles', dependencies: ['combat'], category: 'Combat' },
  { id: 'dual-wielding', name: 'Dual Wielding', icon: '⚔️', description: 'Two weapons at once, mixed attacks', dependencies: ['weapons'], category: 'Combat' },
  { id: 'shield-blocking', name: 'Shield Blocking', icon: '🛡️', description: 'Block, shield bash, stamina drain', dependencies: ['combat'], category: 'Combat' },
  { id: 'dodge-rolling', name: 'Dodge Rolling', icon: '💨', description: 'I-frames, dodge direction, stamina cost', dependencies: ['combat'], category: 'Combat' },
  { id: 'combo-system', name: 'Combo System', icon: '🔥', description: 'Chain attacks, combo counter, finishers', dependencies: ['combat'], category: 'Combat' },
  { id: 'critical-hits', name: 'Critical Hits', icon: '💢', description: 'Crit chance, crit damage, headshots', dependencies: ['combat'], category: 'Combat' },
  { id: 'status-effects', name: 'Status Effects', icon: '☠️', description: 'Poison, burn, freeze, stun, bleed', dependencies: ['combat'], category: 'Combat' },
  { id: 'armor-system', name: 'Armor System', icon: '🛡️', description: 'Damage reduction, armor types, durability', dependencies: ['combat', 'inventory'], category: 'Combat' },
  { id: 'damage-types', name: 'Damage Types', icon: '⚡', description: 'Melee, ranged, magic, true damage', dependencies: ['combat'], category: 'Combat' },
  { id: 'mob-spawning', name: 'Mob Spawning', icon: '👾', description: 'Enemy spawn points, rates, despawn', dependencies: ['combat'], category: 'Combat' },
  { id: 'wave-survival', name: 'Wave Survival', icon: '🌊', description: 'Endless waves, difficulty scaling, breaks', dependencies: ['combat', 'mob-spawning'], category: 'Combat' },
  { id: 'zombie-ai', name: 'Zombie AI', icon: '🧟', description: 'Pathfinding zombies, types, horde behavior', dependencies: ['combat', 'mob-spawning'], category: 'Combat' },
  { id: 'pvp-ranking', name: 'PvP Ranking', icon: '🏆', description: 'Elo rating, ranked matches, seasons', dependencies: ['pvp'], category: 'Combat' },
  { id: 'duel-system', name: 'Duel System', icon: '🤺', description: '1v1 challenge, accept/decline, arena', dependencies: ['combat'], category: 'Combat' },
  { id: 'arena-matchmaking', name: 'Arena Matchmaking', icon: '🎯', description: 'Queue, skill matching, lobby timer', dependencies: ['pvp', 'matchmaking'], category: 'Combat' },
  { id: 'battle-royale', name: 'Battle Royale', icon: '🏝️', description: 'Shrinking zone, last one standing, loot', dependencies: ['combat', 'weapons'], category: 'Combat' },
  { id: 'hunger-games', name: 'Hunger Games', icon: '🌿', description: 'Cornucopia, survival, elimination', dependencies: ['combat', 'rounds'], category: 'Combat' },
  { id: 'capture-flag', name: 'Capture the Flag', icon: '🚩', description: 'Flag carry, base defense, scoring', dependencies: ['combat', 'teams'], category: 'Combat' },
  { id: 'king-of-hill', name: 'King of the Hill', icon: '👑', description: 'Hold point, contested, timer', dependencies: ['combat', 'teams'], category: 'Combat' },
  { id: 'domination', name: 'Domination', icon: '🔶', description: 'Multiple capture points, territory control', dependencies: ['combat', 'teams'], category: 'Combat' },
  { id: 'search-destroy', name: 'Search & Destroy', icon: '💣', description: 'Plant/defuse bomb, no respawn rounds', dependencies: ['combat', 'teams', 'rounds'], category: 'Combat' },
  { id: 'free-for-all', name: 'Free for All', icon: '🗡️', description: 'Everyone vs everyone, kill count', dependencies: ['combat'], category: 'Combat' },
  { id: 'team-deathmatch', name: 'Team Deathmatch', icon: '⚔️', description: 'Team kills, score limit, respawn', dependencies: ['combat', 'teams'], category: 'Combat' },
  { id: 'boss-ai-phases', name: 'Boss AI Phases', icon: '🎭', description: 'Multi-phase boss with changing attacks', dependencies: ['bossfights'], category: 'Combat' },
  { id: 'enemy-loot', name: 'Enemy Loot', icon: '💀', description: 'Loot tables, drop rates, rarity rolls', dependencies: ['combat', 'inventory'], category: 'Combat' },
  { id: 'aggro-system', name: 'Aggro System', icon: '😡', description: 'Threat management, taunt, aggro range', dependencies: ['combat'], category: 'Combat' },
  { id: 'stealth-system', name: 'Stealth System', icon: '🥷', description: 'Sneak, detection, backstab, visibility', dependencies: ['combat'], category: 'Combat' },
  { id: 'resurrection', name: 'Resurrection', icon: '💚', description: 'Revive downed players, revive timer', dependencies: ['combat'], category: 'Combat' },
  { id: 'killstreak', name: 'Killstreak', icon: '🔥', description: 'Killstreak rewards, announcements', dependencies: ['combat'], category: 'Combat' },
  { id: 'weapon-switching', name: 'Weapon Switching', icon: '🔄', description: 'Hotbar weapons, quick swap, loadouts', dependencies: ['weapons'], category: 'Combat' },
  { id: 'grenade-system', name: 'Grenades', icon: '💣', description: 'Frag, smoke, flash, molotov', dependencies: ['combat'], category: 'Combat' },
  { id: 'turrets', name: 'Turrets', icon: '🔫', description: 'Placeable turrets, auto-aim, ammo', dependencies: ['combat'], category: 'Combat' },
  { id: 'traps', name: 'Traps', icon: '⚠️', description: 'Bear traps, spike pits, tripwires', dependencies: ['combat'], category: 'Combat' },
  { id: 'friendly-fire', name: 'Friendly Fire', icon: '🤕', description: 'Team damage toggle, reduced damage', dependencies: ['combat', 'teams'], category: 'Combat' },
  { id: 'execution-system', name: 'Execution', icon: '💀', description: 'Finishing move on downed enemies', dependencies: ['combat'], category: 'Combat' },

  // ═══════════════════════════════════════════
  // SOCIAL (30)
  // ═══════════════════════════════════════════
  { id: 'npcs', name: 'NPCs', icon: '🧑', description: 'Dialogue, spawning, pathfinding', dependencies: [], category: 'Social' },
  { id: 'quests', name: 'Quests', icon: '📜', description: 'Objectives, tracking, rewards', dependencies: [], category: 'Social' },
  { id: 'friends', name: 'Friends', icon: '💬', description: 'Friend list, invites, party system', dependencies: [], category: 'Social' },
  { id: 'guilds', name: 'Guilds/Clans', icon: '🛡️', description: 'Clan creation, ranks, wars', dependencies: ['friends'], category: 'Social' },
  { id: 'emotes', name: 'Emotes', icon: '💃', description: 'Dance, wave, custom animations', dependencies: [], category: 'Social' },
  { id: 'chat-system', name: 'Chat System', icon: '💬', description: 'Custom chat, channels, colors, commands', dependencies: [], category: 'Social' },
  { id: 'private-messaging', name: 'Private Messaging', icon: '✉️', description: 'Whisper, DM, private chat', dependencies: ['chat-system'], category: 'Social' },
  { id: 'voice-chat-zones', name: 'Voice Chat Zones', icon: '🎙️', description: 'Proximity voice, voice rooms', dependencies: [], category: 'Social' },
  { id: 'dance-floor', name: 'Dance Floor', icon: '🕺', description: 'Dance area, sync dancing, DJ', dependencies: ['emotes'], category: 'Social' },
  { id: 'photo-booth', name: 'Photo Booth', icon: '📸', description: 'Pose, filters, screenshot area', dependencies: [], category: 'Social' },
  { id: 'selfie-camera', name: 'Selfie Camera', icon: '🤳', description: 'Selfie mode, stickers, share', dependencies: [], category: 'Social' },
  { id: 'social-hub', name: 'Social Hub', icon: '🏠', description: 'Central hangout area, activities', dependencies: [], category: 'Social' },
  { id: 'lobby', name: 'Lobby', icon: '🏢', description: 'Pre-game waiting area, activities', dependencies: [], category: 'Social' },
  { id: 'party-system', name: 'Party System', icon: '🎉', description: 'Create party, invite, shared queue', dependencies: ['friends'], category: 'Social' },
  { id: 'follow-system', name: 'Follow System', icon: '👣', description: 'Follow other players, followers count', dependencies: [], category: 'Social' },
  { id: 'block-system', name: 'Block System', icon: '🚫', description: 'Block players, hide from view', dependencies: [], category: 'Social' },
  { id: 'report-system', name: 'Report System', icon: '🚨', description: 'Report players, categories, evidence', dependencies: [], category: 'Social' },
  { id: 'vote-kick', name: 'Vote Kick', icon: '🗳️', description: 'Majority vote to remove player', dependencies: [], category: 'Social' },
  { id: 'emoji-chat', name: 'Emoji Chat', icon: '😀', description: 'Emoji picker in chat, reactions', dependencies: ['chat-system'], category: 'Social' },
  { id: 'bubble-chat', name: 'Bubble Chat', icon: '💭', description: 'Overhead chat bubbles, custom styling', dependencies: [], category: 'Social' },
  { id: 'overhead-display', name: 'Overhead Display', icon: '🏷️', description: 'Name, level, title above head', dependencies: [], category: 'Social' },
  { id: 'mail-system', name: 'Mail System', icon: '📬', description: 'Send/receive mail, attachments, inbox', dependencies: ['datastore'], category: 'Social' },
  { id: 'npc-dialogue-tree', name: 'Dialogue Trees', icon: '🌳', description: 'Branching dialogue, choices, outcomes', dependencies: ['npcs'], category: 'Social' },
  { id: 'npc-shopkeeper', name: 'NPC Shopkeeper', icon: '🧑‍💼', description: 'NPC that sells items with dialogue', dependencies: ['npcs', 'shop'], category: 'Social' },
  { id: 'npc-quest-giver', name: 'Quest Giver NPC', icon: '❗', description: 'NPC with quest markers and dialogue', dependencies: ['npcs', 'quests'], category: 'Social' },
  { id: 'relationship-system', name: 'Relationship', icon: '❤️', description: 'NPC affinity, friendship levels, gifts', dependencies: ['npcs'], category: 'Social' },
  { id: 'roleplaying', name: 'Roleplay System', icon: '🎭', description: 'Roleplay names, descriptions, actions', dependencies: [], category: 'Social' },
  { id: 'marriage-system', name: 'Marriage', icon: '💍', description: 'Marry other players, perks, ceremony', dependencies: ['friends'], category: 'Social' },
  { id: 'adoption-system', name: 'Adoption', icon: '👶', description: 'Adopt players, family system, house', dependencies: ['friends'], category: 'Social' },
  { id: 'clan-wars', name: 'Clan Wars', icon: '⚔️', description: 'Guild vs guild battles, territory', dependencies: ['guilds', 'combat'], category: 'Social' },

  // ═══════════════════════════════════════════
  // PETS (25)
  // ═══════════════════════════════════════════
  { id: 'pets', name: 'Pets', icon: '🐾', description: 'Following, leveling, hatching, rarity', dependencies: [], category: 'Pets' },
  { id: 'pet-following', name: 'Pet Following', icon: '🐕', description: 'Pet follows player, formation, offset', dependencies: ['pets'], category: 'Pets' },
  { id: 'pet-leveling', name: 'Pet Leveling', icon: '📈', description: 'Pet XP, level ups, stat growth', dependencies: ['pets'], category: 'Pets' },
  { id: 'pet-evolution', name: 'Pet Evolution', icon: '🦋', description: 'Evolve pets into stronger forms', dependencies: ['pets', 'pet-leveling'], category: 'Pets' },
  { id: 'pet-fusion', name: 'Pet Fusion', icon: '🔮', description: 'Combine pets for rarer versions', dependencies: ['pets'], category: 'Pets' },
  { id: 'pet-trading', name: 'Pet Trading', icon: '🤝', description: 'Trade pets with other players', dependencies: ['pets', 'trading'], category: 'Pets' },
  { id: 'pet-rarity', name: 'Pet Rarity', icon: '⭐', description: 'Common/Uncommon/Rare/Epic/Legendary/Mythic tiers', dependencies: ['pets'], category: 'Pets' },
  { id: 'egg-hatching', name: 'Egg Hatching', icon: '🥚', description: 'Buy eggs, hatch animation, random pet', dependencies: ['pets', 'currency'], category: 'Pets' },
  { id: 'lucky-eggs', name: 'Lucky Eggs', icon: '🌟', description: 'Increased rare pet chance from eggs', dependencies: ['egg-hatching'], category: 'Pets' },
  { id: 'golden-pets', name: 'Golden Pets', icon: '✨', description: 'Gold variant with boosted stats', dependencies: ['pets', 'pet-rarity'], category: 'Pets' },
  { id: 'rainbow-pets', name: 'Rainbow Pets', icon: '🌈', description: 'Ultra-rare rainbow variant', dependencies: ['pets', 'pet-rarity'], category: 'Pets' },
  { id: 'shiny-pets', name: 'Shiny Pets', icon: '💫', description: 'Alternate color, sparkle effects', dependencies: ['pets', 'pet-rarity'], category: 'Pets' },
  { id: 'pet-inventory', name: 'Pet Inventory', icon: '📋', description: 'Collection view, sorting, filtering', dependencies: ['pets'], category: 'Pets' },
  { id: 'pet-equipping', name: 'Pet Equipping', icon: '🎽', description: 'Equip active pets, max slots', dependencies: ['pets'], category: 'Pets' },
  { id: 'pet-abilities', name: 'Pet Abilities', icon: '⚡', description: 'Unique pet skills, passive effects', dependencies: ['pets', 'pet-leveling'], category: 'Pets' },
  { id: 'pet-storage', name: 'Pet Storage', icon: '🏠', description: 'Store unused pets, capacity upgrades', dependencies: ['pets'], category: 'Pets' },
  { id: 'pet-display', name: 'Pet Display', icon: '🖼️', description: 'Show off pets in display area', dependencies: ['pets'], category: 'Pets' },
  { id: 'pet-racing', name: 'Pet Racing', icon: '🏁', description: 'Race pets against others, tracks', dependencies: ['pets'], category: 'Pets' },
  { id: 'pet-battle', name: 'Pet Battle', icon: '⚔️', description: 'Turn-based pet fights, moves, types', dependencies: ['pets', 'combat'], category: 'Pets' },
  { id: 'pet-breeding', name: 'Pet Breeding', icon: '💕', description: 'Breed two pets for offspring', dependencies: ['pets'], category: 'Pets' },
  { id: 'pet-hunger', name: 'Pet Hunger', icon: '🍖', description: 'Feed pets, happiness affects stats', dependencies: ['pets'], category: 'Pets' },
  { id: 'pet-accessories', name: 'Pet Accessories', icon: '🎀', description: 'Hats, collars, outfits for pets', dependencies: ['pets', 'inventory'], category: 'Pets' },
  { id: 'pet-rename', name: 'Pet Rename', icon: '✏️', description: 'Custom pet names, name tags', dependencies: ['pets'], category: 'Pets' },
  { id: 'pet-index', name: 'Pet Index', icon: '📖', description: 'Pokedex-style collection tracker', dependencies: ['pets'], category: 'Pets' },
  { id: 'pet-multiplier', name: 'Pet Multiplier', icon: '✖️', description: 'Pets boost currency/XP earnings', dependencies: ['pets', 'currency'], category: 'Pets' },

  // ═══════════════════════════════════════════
  // TYCOON (25)
  // ═══════════════════════════════════════════
  { id: 'droppers', name: 'Tycoon Droppers', icon: '🏭', description: 'Conveyor belts, upgraders, collectors', dependencies: ['currency'], category: 'Tycoon' },
  { id: 'basic-dropper', name: 'Basic Dropper', icon: '⬇️', description: 'Part spawner, value, speed', dependencies: ['droppers'], category: 'Tycoon' },
  { id: 'upgrader', name: 'Upgrader', icon: '⬆️', description: 'Multiplies ore value on conveyor', dependencies: ['droppers'], category: 'Tycoon' },
  { id: 'conveyor-belt', name: 'Conveyor Belt', icon: '➡️', description: 'Moves parts along path', dependencies: ['droppers'], category: 'Tycoon' },
  { id: 'furnace', name: 'Furnace', icon: '🔥', description: 'Smelts ore, processes materials', dependencies: ['droppers'], category: 'Tycoon' },
  { id: 'collector-pad', name: 'Collector Pad', icon: '💰', description: 'Collects parts, adds to balance', dependencies: ['droppers'], category: 'Tycoon' },
  { id: 'rebirth-button', name: 'Rebirth Button', icon: '♻️', description: 'Reset tycoon for multiplier boost', dependencies: ['droppers'], category: 'Tycoon' },
  { id: 'tycoon-buttons', name: 'Tycoon Buttons', icon: '🔘', description: 'Purchasable buttons that unlock items', dependencies: ['currency'], category: 'Tycoon' },
  { id: 'wall-purchase', name: 'Wall Purchase', icon: '🧱', description: 'Buy walls/barriers in tycoon', dependencies: ['tycoon-buttons'], category: 'Tycoon' },
  { id: 'floor-purchase', name: 'Floor Purchase', icon: '🟫', description: 'Expand tycoon floor space', dependencies: ['tycoon-buttons'], category: 'Tycoon' },
  { id: 'machine-purchase', name: 'Machine Purchase', icon: '⚙️', description: 'Buy new machines and equipment', dependencies: ['tycoon-buttons'], category: 'Tycoon' },
  { id: 'employee-system', name: 'Employees', icon: '👷', description: 'Hire NPCs to auto-collect', dependencies: ['droppers', 'npcs'], category: 'Tycoon' },
  { id: 'production-line', name: 'Production Line', icon: '🏭', description: 'Multi-stage manufacturing process', dependencies: ['droppers'], category: 'Tycoon' },
  { id: 'factory-layout', name: 'Factory Layout', icon: '📐', description: 'Custom factory floor arrangement', dependencies: ['droppers'], category: 'Tycoon' },
  { id: 'ore-processing', name: 'Ore Processing', icon: '⛏️', description: 'Mine ores, smelt, sell bars', dependencies: ['droppers'], category: 'Tycoon' },
  { id: 'wood-processing', name: 'Wood Processing', icon: '🪵', description: 'Chop trees, saw planks, craft', dependencies: ['droppers'], category: 'Tycoon' },
  { id: 'food-processing', name: 'Food Processing', icon: '🍔', description: 'Cook, package, sell food items', dependencies: ['droppers'], category: 'Tycoon' },
  { id: 'auto-collect', name: 'Auto-Collect', icon: '🤖', description: 'Automatic resource collection', dependencies: ['droppers'], category: 'Tycoon' },
  { id: 'prestige-multiplier', name: 'Prestige Multiplier', icon: '⭐', description: 'Permanent multiplier from prestiges', dependencies: ['rebirth-button'], category: 'Tycoon' },
  { id: 'offline-earnings', name: 'Offline Earnings', icon: '😴', description: 'Earn while logged off', dependencies: ['droppers', 'datastore'], category: 'Tycoon' },
  { id: 'tycoon-pvp', name: 'Tycoon PvP', icon: '⚔️', description: 'Attack other tycoons, raid resources', dependencies: ['droppers', 'combat'], category: 'Tycoon' },
  { id: 'tycoon-research', name: 'Research Tree', icon: '🔬', description: 'Unlock upgrades through research', dependencies: ['droppers'], category: 'Tycoon' },
  { id: 'tycoon-quests', name: 'Tycoon Quests', icon: '📋', description: 'Production goals for bonus rewards', dependencies: ['droppers', 'quests'], category: 'Tycoon' },
  { id: 'tycoon-leaderboard', name: 'Tycoon Leaderboard', icon: '🏆', description: 'Rank by earnings, output, prestige', dependencies: ['droppers'], category: 'Tycoon' },
  { id: 'tycoon-decoration', name: 'Tycoon Decorations', icon: '🎨', description: 'Cosmetic items for your tycoon', dependencies: ['droppers'], category: 'Tycoon' },

  // ═══════════════════════════════════════════
  // OBBY (30)
  // ═══════════════════════════════════════════
  { id: 'obby', name: 'Obby Checkpoints', icon: '🏁', description: 'Stages, saves, skips', dependencies: [], category: 'Obby' },
  { id: 'kill-brick', name: 'Kill Brick', icon: '🟥', description: 'Touch = death, respawn at checkpoint', dependencies: ['obby'], category: 'Obby' },
  { id: 'lava-floor', name: 'Lava Floor', icon: '🌋', description: 'Lava that kills on contact', dependencies: ['obby'], category: 'Obby' },
  { id: 'moving-platform', name: 'Moving Platform', icon: '↔️', description: 'Platforms that move on paths', dependencies: ['obby'], category: 'Obby' },
  { id: 'disappearing-platform', name: 'Disappearing Platform', icon: '👻', description: 'Platforms that vanish after stepping', dependencies: ['obby'], category: 'Obby' },
  { id: 'spinning-platform', name: 'Spinning Platform', icon: '🔄', description: 'Rotating platforms, timing required', dependencies: ['obby'], category: 'Obby' },
  { id: 'conveyor-platform', name: 'Conveyor Platform', icon: '⏩', description: 'Platforms that push you sideways', dependencies: ['obby'], category: 'Obby' },
  { id: 'bouncing-pad', name: 'Bouncing Pad', icon: '🦘', description: 'Launch pad, trampoline, spring', dependencies: ['obby'], category: 'Obby' },
  { id: 'zipline', name: 'Zipline', icon: '🪢', description: 'Ride zipline between points', dependencies: ['obby'], category: 'Obby' },
  { id: 'wall-jump', name: 'Wall Jump', icon: '🧗', description: 'Jump between walls to climb', dependencies: ['obby'], category: 'Obby' },
  { id: 'ladder-climb', name: 'Ladder Climb', icon: '🪜', description: 'Climbable ladders and vines', dependencies: ['obby'], category: 'Obby' },
  { id: 'rope-swing', name: 'Rope Swing', icon: '🪢', description: 'Swing on ropes to cross gaps', dependencies: ['obby'], category: 'Obby' },
  { id: 'slide', name: 'Slide', icon: '🎢', description: 'Slide down slopes, tubes, spirals', dependencies: ['obby'], category: 'Obby' },
  { id: 'trampoline', name: 'Trampoline', icon: '🔵', description: 'Bounce higher with each jump', dependencies: ['obby'], category: 'Obby' },
  { id: 'teleporter-pad', name: 'Teleporter Pad', icon: '🌀', description: 'Step on pad to teleport elsewhere', dependencies: ['obby'], category: 'Obby' },
  { id: 'speed-boost-pad', name: 'Speed Boost Pad', icon: '⚡', description: 'Temporary speed increase on step', dependencies: ['obby'], category: 'Obby' },
  { id: 'gravity-flip', name: 'Gravity Flip', icon: '🔃', description: 'Walk on ceiling, flip gravity', dependencies: ['obby'], category: 'Obby' },
  { id: 'water-section', name: 'Water Section', icon: '🏊', description: 'Swimming section, air meter', dependencies: ['obby'], category: 'Obby' },
  { id: 'underwater-section', name: 'Underwater Section', icon: '🤿', description: 'Deep water, oxygen, currents', dependencies: ['obby'], category: 'Obby' },
  { id: 'timed-section', name: 'Timed Section', icon: '⏰', description: 'Complete before time runs out', dependencies: ['obby'], category: 'Obby' },
  { id: 'invisible-path', name: 'Invisible Path', icon: '👁️', description: 'Hidden platforms, memory challenge', dependencies: ['obby'], category: 'Obby' },
  { id: 'fake-walls', name: 'Fake Walls', icon: '🚪', description: 'Walk-through walls, hidden passages', dependencies: ['obby'], category: 'Obby' },
  { id: 'maze', name: 'Maze', icon: '🔀', description: 'Maze navigation, dead ends, clues', dependencies: ['obby'], category: 'Obby' },
  { id: 'parkour-wall', name: 'Parkour Wall', icon: '🏃', description: 'Wallrun, wall slides, ledge grab', dependencies: ['obby'], category: 'Obby' },
  { id: 'head-hitter', name: 'Head Hitter', icon: '⬛', description: 'Low ceiling that knocks you off', dependencies: ['obby'], category: 'Obby' },
  { id: 'checkpoint-flag', name: 'Checkpoint Flag', icon: '🚩', description: 'Flag-based checkpoint with save', dependencies: ['obby'], category: 'Obby' },
  { id: 'stage-skip', name: 'Stage Skip', icon: '⏭️', description: 'Skip stages with currency/pass', dependencies: ['obby', 'currency'], category: 'Obby' },
  { id: 'stage-select', name: 'Stage Select', icon: '📋', description: 'Jump to any unlocked stage', dependencies: ['obby'], category: 'Obby' },
  { id: 'obby-timer', name: 'Obby Timer', icon: '⏱️', description: 'Speedrun timer, personal best', dependencies: ['obby'], category: 'Obby' },
  { id: 'speed-run-leaderboard', name: 'Speed Run Board', icon: '🏆', description: 'Global fastest times leaderboard', dependencies: ['obby', 'obby-timer'], category: 'Obby' },

  // ═══════════════════════════════════════════
  // SIMULATOR (25)
  // ═══════════════════════════════════════════
  { id: 'simulator', name: 'Simulator Loop', icon: '🔁', description: 'Click-collect-upgrade-rebirth', dependencies: ['progression', 'currency'], category: 'Simulator' },
  { id: 'click-to-collect', name: 'Click to Collect', icon: '👆', description: 'Click objects to gather resources', dependencies: ['currency'], category: 'Simulator' },
  { id: 'auto-clicker', name: 'Auto-Clicker', icon: '🤖', description: 'Automatic clicking upgrade', dependencies: ['click-to-collect'], category: 'Simulator' },
  { id: 'multiplier-system', name: 'Multiplier System', icon: '✖️', description: 'Stack multipliers for earnings', dependencies: ['currency'], category: 'Simulator' },
  { id: 'backpack-capacity', name: 'Backpack Capacity', icon: '🎒', description: 'Limited carry, upgrade capacity', dependencies: ['currency'], category: 'Simulator' },
  { id: 'sell-area', name: 'Sell Area', icon: '💲', description: 'Walk to area to sell collected items', dependencies: ['backpack-capacity'], category: 'Simulator' },
  { id: 'training-area', name: 'Training Area', icon: '🏋️', description: 'Train stats by performing actions', dependencies: [], category: 'Simulator' },
  { id: 'strength-training', name: 'Strength Training', icon: '💪', description: 'Lift weights, punch bags, grow strong', dependencies: ['training-area'], category: 'Simulator' },
  { id: 'speed-training', name: 'Speed Training', icon: '🏃', description: 'Run on track, agility courses', dependencies: ['training-area'], category: 'Simulator' },
  { id: 'jump-training', name: 'Jump Training', icon: '⬆️', description: 'Trampoline, jump pads, height stat', dependencies: ['training-area'], category: 'Simulator' },
  { id: 'rebirth-system', name: 'Rebirth System', icon: '♻️', description: 'Reset progress for permanent boosts', dependencies: ['progression'], category: 'Simulator' },
  { id: 'prestige-system', name: 'Prestige System', icon: '⭐', description: 'Prestige layers, each with bonuses', dependencies: ['rebirth-system'], category: 'Simulator' },
  { id: 'rank-system', name: 'Rank System', icon: '🎖️', description: 'Named ranks, rank rewards, display', dependencies: ['progression'], category: 'Simulator' },
  { id: 'zone-unlocking', name: 'Zone Unlocking', icon: '🔓', description: 'Unlock new areas with stats/currency', dependencies: ['currency'], category: 'Simulator' },
  { id: 'area-progression', name: 'Area Progression', icon: '🗺️', description: 'Better resources in later areas', dependencies: ['zone-unlocking'], category: 'Simulator' },
  { id: 'tool-upgrades', name: 'Tool Upgrades', icon: '🔧', description: 'Better tools = faster collection', dependencies: ['currency'], category: 'Simulator' },
  { id: 'group-bonus', name: 'Group Bonus', icon: '👥', description: 'Bonus for joining Roblox group', dependencies: [], category: 'Simulator' },
  { id: 'vip-server-bonus', name: 'VIP Server Bonus', icon: '🌟', description: 'Extra multiplier in VIP servers', dependencies: [], category: 'Simulator' },
  { id: 'event-multiplier', name: 'Event Multiplier', icon: '🎊', description: 'Temporary boost during events', dependencies: ['multiplier-system'], category: 'Simulator' },
  { id: 'season-pass', name: 'Season Pass', icon: '🎫', description: 'Seasonal tier rewards, free + paid track', dependencies: ['progression'], category: 'Simulator' },
  { id: 'rebirth-tokens', name: 'Rebirth Tokens', icon: '🪙', description: 'Tokens earned from rebirthing', dependencies: ['rebirth-system'], category: 'Simulator' },
  { id: 'rebirth-shop', name: 'Rebirth Shop', icon: '🏪', description: 'Spend rebirth tokens on permanent items', dependencies: ['rebirth-tokens'], category: 'Simulator' },
  { id: 'world-system', name: 'World System', icon: '🌍', description: 'Multiple worlds with different themes', dependencies: ['zone-unlocking'], category: 'Simulator' },
  { id: 'merge-mechanic', name: 'Merge Mechanic', icon: '🔗', description: 'Combine items to upgrade them', dependencies: ['inventory'], category: 'Simulator' },
  { id: 'idle-system', name: 'Idle System', icon: '💤', description: 'Earn while idle, offline progress', dependencies: ['datastore'], category: 'Simulator' },

  // ═══════════════════════════════════════════
  // RPG (35)
  // ═══════════════════════════════════════════
  { id: 'character-creation', name: 'Character Creation', icon: '🧑‍🎨', description: 'Race, gender, appearance, name', dependencies: [], category: 'RPG' },
  { id: 'class-system', name: 'Class System', icon: '⚔️', description: 'Warrior, Mage, Archer, Healer, Assassin, Tank', dependencies: ['character-creation'], category: 'RPG' },
  { id: 'skill-tree', name: 'Skill Tree', icon: '🌳', description: 'Branching skill upgrades, talent points', dependencies: ['abilities'], category: 'RPG' },
  { id: 'talent-points', name: 'Talent Points', icon: '💡', description: 'Points earned per level for skills', dependencies: ['skill-tree', 'progression'], category: 'RPG' },
  { id: 'mana-system', name: 'Mana System', icon: '🔵', description: 'Mana pool, regen, cost, potions', dependencies: ['combat'], category: 'RPG' },
  { id: 'stamina-system', name: 'Stamina System', icon: '🟢', description: 'Stamina for running, dodging, attacking', dependencies: ['combat'], category: 'RPG' },
  { id: 'hp-regen', name: 'HP Regeneration', icon: '💚', description: 'Health regen rate, out-of-combat regen', dependencies: ['combat'], category: 'RPG' },
  { id: 'mp-regen', name: 'MP Regeneration', icon: '💙', description: 'Mana regen rate, meditation', dependencies: ['mana-system'], category: 'RPG' },
  { id: 'equipment-slots', name: 'Equipment Slots', icon: '👤', description: 'Head, chest, legs, feet, weapon, shield, ring, cape', dependencies: ['inventory'], category: 'RPG' },
  { id: 'enchanting', name: 'Enchanting', icon: '✨', description: 'Add magic effects to equipment', dependencies: ['equipment-slots'], category: 'RPG' },
  { id: 'gem-socketing', name: 'Gem Socketing', icon: '💎', description: 'Socket gems into gear for bonuses', dependencies: ['equipment-slots'], category: 'RPG' },
  { id: 'item-rarity', name: 'Item Rarity', icon: '🌈', description: 'Common/Uncommon/Rare/Epic/Legendary/Mythic', dependencies: ['inventory'], category: 'RPG' },
  { id: 'loot-tables', name: 'Loot Tables', icon: '📊', description: 'Weighted random loot generation', dependencies: ['inventory'], category: 'RPG' },
  { id: 'dungeon-generator', name: 'Dungeon Generator', icon: '🏰', description: 'Procedural dungeon rooms, corridors', dependencies: [], category: 'RPG' },
  { id: 'party-dungeon', name: 'Party Dungeon', icon: '🗡️', description: 'Group dungeon with roles, mechanics', dependencies: ['dungeon-generator', 'party-system'], category: 'RPG' },
  { id: 'raid-system', name: 'Raid System', icon: '👹', description: 'Large group content, multiple bosses', dependencies: ['party-dungeon', 'bossfights'], category: 'RPG' },
  { id: 'world-boss', name: 'World Boss', icon: '🐉', description: 'Open-world boss, server-wide event', dependencies: ['bossfights'], category: 'RPG' },
  { id: 'elite-enemies', name: 'Elite Enemies', icon: '⚡', description: 'Stronger mobs with special abilities', dependencies: ['mob-spawning'], category: 'RPG' },
  { id: 'xp-curve', name: 'XP Curve', icon: '📈', description: 'Exponential XP requirements per level', dependencies: ['progression'], category: 'RPG' },
  { id: 'level-cap', name: 'Level Cap', icon: '🔝', description: 'Maximum level, cap raises with updates', dependencies: ['progression'], category: 'RPG' },
  { id: 'prestige-class', name: 'Prestige Class', icon: '👑', description: 'Advanced class after max level', dependencies: ['class-system', 'level-cap'], category: 'RPG' },
  { id: 'profession-system', name: 'Professions', icon: '🛠️', description: 'Blacksmithing, alchemy, tailoring, cooking', dependencies: ['crafting'], category: 'RPG' },
  { id: 'mount-system', name: 'Mount System', icon: '🐴', description: 'Rideable mounts, speed boost, collection', dependencies: [], category: 'RPG' },
  { id: 'buff-debuff', name: 'Buff/Debuff', icon: '⬆️', description: 'Temporary stat boosts and reductions', dependencies: ['combat'], category: 'RPG' },
  { id: 'potion-system', name: 'Potions', icon: '🧪', description: 'Health, mana, buff, and utility potions', dependencies: ['inventory'], category: 'RPG' },
  { id: 'scroll-system', name: 'Scrolls', icon: '📜', description: 'Consumable spell scrolls, one-time use', dependencies: ['inventory'], category: 'RPG' },
  { id: 'weapon-proficiency', name: 'Weapon Proficiency', icon: '📊', description: 'Improve with weapons the more you use them', dependencies: ['weapons'], category: 'RPG' },
  { id: 'companion-system', name: 'Companions', icon: '🧝', description: 'NPC companions that fight alongside you', dependencies: ['npcs', 'combat'], category: 'RPG' },
  { id: 'reputation-system', name: 'Reputation', icon: '📊', description: 'Faction reputation, unlock rewards at ranks', dependencies: [], category: 'RPG' },
  { id: 'alignment-system', name: 'Alignment', icon: '⚖️', description: 'Good vs evil choices, karma system', dependencies: [], category: 'RPG' },
  { id: 'respawn-penalty', name: 'Respawn Penalty', icon: '💀', description: 'XP loss, item drop, or corpse run on death', dependencies: ['combat'], category: 'RPG' },
  { id: 'fast-travel', name: 'Fast Travel', icon: '🗺️', description: 'Teleport between discovered locations', dependencies: ['teleport'], category: 'RPG' },
  { id: 'map-fog', name: 'Fog of War', icon: '🌫️', description: 'Undiscovered map areas hidden', dependencies: [], category: 'RPG' },
  { id: 'fishing-rpg', name: 'RPG Fishing', icon: '🎣', description: 'Fishing with bait, rarity, minigame', dependencies: ['inventory'], category: 'RPG' },
  { id: 'cooking-system', name: 'Cooking', icon: '🍳', description: 'Cook food for buffs, recipes, ingredients', dependencies: ['inventory'], category: 'RPG' },

  // ═══════════════════════════════════════════
  // BUILDING (30)
  // ═══════════════════════════════════════════
  { id: 'plot-system', name: 'Plot System', icon: '📐', description: 'Assigned build plots per player', dependencies: [], category: 'Building' },
  { id: 'build-mode', name: 'Build Mode', icon: '🔨', description: 'Place objects, snap grid, free place', dependencies: ['plot-system'], category: 'Building' },
  { id: 'edit-mode', name: 'Edit Mode', icon: '✏️', description: 'Move, rotate, recolor placed objects', dependencies: ['build-mode'], category: 'Building' },
  { id: 'delete-mode', name: 'Delete Mode', icon: '🗑️', description: 'Remove placed objects, refund', dependencies: ['build-mode'], category: 'Building' },
  { id: 'rotate-tool', name: 'Rotate Tool', icon: '🔄', description: '90-degree rotation, free rotate', dependencies: ['build-mode'], category: 'Building' },
  { id: 'scale-tool', name: 'Scale Tool', icon: '↔️', description: 'Resize objects, min/max bounds', dependencies: ['build-mode'], category: 'Building' },
  { id: 'color-picker', name: 'Color Picker', icon: '🎨', description: 'Pick colors for building parts', dependencies: ['build-mode'], category: 'Building' },
  { id: 'material-picker', name: 'Material Picker', icon: '🧱', description: 'Choose materials: wood, brick, metal', dependencies: ['build-mode'], category: 'Building' },
  { id: 'furniture-placement', name: 'Furniture', icon: '🛋️', description: 'Place furniture, snap to floor/wall', dependencies: ['build-mode'], category: 'Building' },
  { id: 'wall-building', name: 'Wall Building', icon: '🧱', description: 'Build walls, door holes, windows', dependencies: ['build-mode'], category: 'Building' },
  { id: 'floor-building', name: 'Floor Building', icon: '🟫', description: 'Place floor tiles, patterns', dependencies: ['build-mode'], category: 'Building' },
  { id: 'roof-building', name: 'Roof Building', icon: '🏠', description: 'Roof styles: flat, gable, hip, dome', dependencies: ['build-mode'], category: 'Building' },
  { id: 'door-placement', name: 'Doors', icon: '🚪', description: 'Openable doors, locks, styles', dependencies: ['wall-building'], category: 'Building' },
  { id: 'window-placement', name: 'Windows', icon: '🪟', description: 'Window styles, glass, frames', dependencies: ['wall-building'], category: 'Building' },
  { id: 'stair-building', name: 'Stairs', icon: '🪜', description: 'Staircases, spiral, straight, L-shape', dependencies: ['build-mode'], category: 'Building' },
  { id: 'fence-building', name: 'Fences', icon: '🏗️', description: 'Fence types, gates, hedges', dependencies: ['build-mode'], category: 'Building' },
  { id: 'garden-placement', name: 'Garden', icon: '🌻', description: 'Plants, flowers, trees, decorations', dependencies: ['build-mode'], category: 'Building' },
  { id: 'pool-building', name: 'Pool', icon: '🏊', description: 'Swimming pool, shape, depth, water', dependencies: ['build-mode'], category: 'Building' },
  { id: 'multi-story', name: 'Multi-Story', icon: '🏢', description: 'Multiple floors, floor selector', dependencies: ['build-mode'], category: 'Building' },
  { id: 'blueprint-save', name: 'Blueprint Save', icon: '💾', description: 'Save build as reusable blueprint', dependencies: ['build-mode', 'datastore'], category: 'Building' },
  { id: 'blueprint-load', name: 'Blueprint Load', icon: '📂', description: 'Load and place saved blueprints', dependencies: ['blueprint-save'], category: 'Building' },
  { id: 'house-tour', name: 'House Tour', icon: '🏡', description: 'Visit other players\' builds', dependencies: ['plot-system'], category: 'Building' },
  { id: 'build-permissions', name: 'Build Permissions', icon: '🔒', description: 'Allow/deny others to build on plot', dependencies: ['plot-system'], category: 'Building' },
  { id: 'terrain-editing', name: 'Terrain Editing', icon: '⛰️', description: 'Raise, lower, flatten, paint terrain', dependencies: ['plot-system'], category: 'Building' },
  { id: 'lighting-system', name: 'Lighting', icon: '💡', description: 'Place lights, lamps, neon, color', dependencies: ['build-mode'], category: 'Building' },
  { id: 'painting-system', name: 'Paintings', icon: '🖼️', description: 'Hang art, custom images, frames', dependencies: ['build-mode'], category: 'Building' },
  { id: 'sandbox-mode', name: 'Sandbox Mode', icon: '🎮', description: 'Unlimited resources, free build', dependencies: ['build-mode'], category: 'Building' },
  { id: 'build-contest', name: 'Build Contest', icon: '🏆', description: 'Timed building competition, voting', dependencies: ['build-mode', 'rounds'], category: 'Building' },
  { id: 'undo-redo', name: 'Undo/Redo', icon: '↩️', description: 'Undo and redo building actions', dependencies: ['build-mode'], category: 'Building' },
  { id: 'copy-paste', name: 'Copy/Paste', icon: '📋', description: 'Duplicate placed objects', dependencies: ['build-mode'], category: 'Building' },

  // ═══════════════════════════════════════════
  // VEHICLES (40)
  // ═══════════════════════════════════════════
  { id: 'vehicles', name: 'Vehicles', icon: '🚗', description: 'Cars, boats, planes with controls', dependencies: [], category: 'Vehicles' },
  { id: 'car', name: 'Car', icon: '🚗', description: 'Drivable car, steering, braking', dependencies: ['vehicles'], category: 'Vehicles' },
  { id: 'truck', name: 'Truck', icon: '🚛', description: 'Heavy truck, cargo hauling', dependencies: ['vehicles'], category: 'Vehicles' },
  { id: 'bus', name: 'Bus', icon: '🚌', description: 'Passenger bus, route driving', dependencies: ['vehicles'], category: 'Vehicles' },
  { id: 'motorcycle', name: 'Motorcycle', icon: '🏍️', description: 'Fast bike, wheelies, leaning', dependencies: ['vehicles'], category: 'Vehicles' },
  { id: 'bicycle', name: 'Bicycle', icon: '🚲', description: 'Pedal-powered, tricks, BMX', dependencies: ['vehicles'], category: 'Vehicles' },
  { id: 'skateboard', name: 'Skateboard', icon: '🛹', description: 'Skateboard tricks, ramps, grinding', dependencies: ['vehicles'], category: 'Vehicles' },
  { id: 'atv', name: 'ATV', icon: '🏎️', description: 'Off-road four-wheeler', dependencies: ['vehicles'], category: 'Vehicles' },
  { id: 'tank', name: 'Tank', icon: '🪖', description: 'Military tank, turret, cannon', dependencies: ['vehicles', 'combat'], category: 'Vehicles' },
  { id: 'helicopter', name: 'Helicopter', icon: '🚁', description: 'Helicopter flight, hover, land', dependencies: ['vehicles'], category: 'Vehicles' },
  { id: 'airplane', name: 'Airplane', icon: '✈️', description: 'Fixed-wing flight, takeoff, landing', dependencies: ['vehicles'], category: 'Vehicles' },
  { id: 'jet', name: 'Jet', icon: '🛩️', description: 'Fast jet, afterburner, missiles', dependencies: ['vehicles'], category: 'Vehicles' },
  { id: 'rocket', name: 'Rocket', icon: '🚀', description: 'Rocket launch, space travel', dependencies: ['vehicles'], category: 'Vehicles' },
  { id: 'boat', name: 'Boat', icon: '🚤', description: 'Water vessel, waves, steering', dependencies: ['vehicles'], category: 'Vehicles' },
  { id: 'speedboat', name: 'Speedboat', icon: '🛥️', description: 'Fast boat, wake, jumping waves', dependencies: ['vehicles'], category: 'Vehicles' },
  { id: 'submarine', name: 'Submarine', icon: '🛟', description: 'Underwater vessel, dive, periscope', dependencies: ['vehicles'], category: 'Vehicles' },
  { id: 'hoverboard', name: 'Hoverboard', icon: '🛹', description: 'Floating board, tricks, boost', dependencies: ['vehicles'], category: 'Vehicles' },
  { id: 'train', name: 'Train', icon: '🚂', description: 'Train on tracks, stations, cargo', dependencies: ['vehicles'], category: 'Vehicles' },
  { id: 'minecart', name: 'Minecart', icon: '🛤️', description: 'Rail riding, mine exploration', dependencies: ['vehicles'], category: 'Vehicles' },
  { id: 'horse', name: 'Horse', icon: '🐎', description: 'Horse riding, gallop, jump', dependencies: ['vehicles'], category: 'Vehicles' },
  { id: 'dragon-mount', name: 'Dragon Mount', icon: '🐉', description: 'Fly on dragon, fire breath', dependencies: ['vehicles'], category: 'Vehicles' },
  { id: 'flying-carpet', name: 'Flying Carpet', icon: '🧞', description: 'Magic carpet flight', dependencies: ['vehicles'], category: 'Vehicles' },
  { id: 'broomstick', name: 'Broomstick', icon: '🧹', description: 'Fly on broomstick, quidditch-style', dependencies: ['vehicles'], category: 'Vehicles' },
  { id: 'mech-suit', name: 'Mech Suit', icon: '🤖', description: 'Pilotable mech, weapons, abilities', dependencies: ['vehicles', 'combat'], category: 'Vehicles' },
  { id: 'spaceship', name: 'Spaceship', icon: '🛸', description: 'Space flight, planets, docking', dependencies: ['vehicles'], category: 'Vehicles' },
  { id: 'go-kart', name: 'Go-Kart', icon: '🏎️', description: 'Small race car, drifting, items', dependencies: ['vehicles'], category: 'Vehicles' },
  { id: 'race-car', name: 'Race Car', icon: '🏁', description: 'Professional racing, lap times', dependencies: ['vehicles'], category: 'Vehicles' },
  { id: 'monster-truck', name: 'Monster Truck', icon: '🚙', description: 'Giant wheels, crush cars, jump', dependencies: ['vehicles'], category: 'Vehicles' },
  { id: 'fire-truck', name: 'Fire Truck', icon: '🚒', description: 'Fire hose, ladder, siren', dependencies: ['vehicles'], category: 'Vehicles' },
  { id: 'police-car', name: 'Police Car', icon: '🚔', description: 'Siren, lights, pursuit mode', dependencies: ['vehicles'], category: 'Vehicles' },
  { id: 'ambulance', name: 'Ambulance', icon: '🚑', description: 'Medical vehicle, siren, stretcher', dependencies: ['vehicles'], category: 'Vehicles' },
  { id: 'ice-cream-truck', name: 'Ice Cream Truck', icon: '🍦', description: 'Sell ice cream, music, route', dependencies: ['vehicles', 'currency'], category: 'Vehicles' },
  { id: 'taxi', name: 'Taxi', icon: '🚕', description: 'Pick up passengers, fare system', dependencies: ['vehicles', 'currency'], category: 'Vehicles' },
  { id: 'vehicle-customization', name: 'Vehicle Customization', icon: '🎨', description: 'Paint, decals, parts, upgrades', dependencies: ['vehicles'], category: 'Vehicles' },
  { id: 'nitro-boost', name: 'Nitro Boost', icon: '🔥', description: 'Speed boost with cooldown, recharge', dependencies: ['vehicles'], category: 'Vehicles' },
  { id: 'drift-system', name: 'Drift System', icon: '💨', description: 'Drifting mechanics, drift score', dependencies: ['vehicles'], category: 'Vehicles' },
  { id: 'fuel-system', name: 'Fuel System', icon: '⛽', description: 'Fuel consumption, gas stations', dependencies: ['vehicles'], category: 'Vehicles' },
  { id: 'vehicle-damage', name: 'Vehicle Damage', icon: '💥', description: 'Visual damage, performance loss', dependencies: ['vehicles'], category: 'Vehicles' },
  { id: 'repair-shop', name: 'Repair Shop', icon: '🔧', description: 'Fix damaged vehicles, cost', dependencies: ['vehicles', 'currency'], category: 'Vehicles' },
  { id: 'garage-storage', name: 'Garage Storage', icon: '🏗️', description: 'Store owned vehicles, capacity', dependencies: ['vehicles'], category: 'Vehicles' },

  // ═══════════════════════════════════════════
  // ENVIRONMENT (40)
  // ═══════════════════════════════════════════
  { id: 'daynight', name: 'Day/Night', icon: '🌙', description: 'Time cycle, lighting changes', dependencies: [], category: 'Environment' },
  { id: 'weather', name: 'Weather', icon: '🌧️', description: 'Rain, snow, fog, thunder', dependencies: [], category: 'Environment' },
  { id: 'farming', name: 'Farming', icon: '🌾', description: 'Planting, growing, harvesting', dependencies: ['inventory'], category: 'Environment' },
  { id: 'fishing', name: 'Fishing', icon: '🎣', description: 'Casting, reeling, fish rarity', dependencies: ['inventory'], category: 'Environment' },
  { id: 'mining', name: 'Mining', icon: '⛏️', description: 'Ore nodes, pickaxes, smelting', dependencies: ['inventory'], category: 'Environment' },
  { id: 'forest-biome', name: 'Forest', icon: '🌲', description: 'Dense trees, wildlife, paths', dependencies: [], category: 'Environment' },
  { id: 'desert-biome', name: 'Desert', icon: '🏜️', description: 'Sand dunes, cacti, heat', dependencies: [], category: 'Environment' },
  { id: 'snow-biome', name: 'Snow/Tundra', icon: '❄️', description: 'Snow, ice, cold mechanic', dependencies: [], category: 'Environment' },
  { id: 'swamp-biome', name: 'Swamp', icon: '🐊', description: 'Murky water, vines, fog', dependencies: [], category: 'Environment' },
  { id: 'jungle-biome', name: 'Jungle', icon: '🌴', description: 'Thick vegetation, canopy, rivers', dependencies: [], category: 'Environment' },
  { id: 'mountain-biome', name: 'Mountain', icon: '⛰️', description: 'Peaks, cliffs, altitude effects', dependencies: [], category: 'Environment' },
  { id: 'ocean-biome', name: 'Ocean', icon: '🌊', description: 'Open water, islands, sea life', dependencies: [], category: 'Environment' },
  { id: 'beach-biome', name: 'Beach', icon: '🏖️', description: 'Sandy shore, waves, shells', dependencies: [], category: 'Environment' },
  { id: 'cave-biome', name: 'Cave', icon: '🕳️', description: 'Underground caverns, crystals, darkness', dependencies: [], category: 'Environment' },
  { id: 'volcano-biome', name: 'Volcano', icon: '🌋', description: 'Lava flows, eruptions, ash', dependencies: [], category: 'Environment' },
  { id: 'floating-islands', name: 'Floating Islands', icon: '🏝️', description: 'Sky islands, bridges, clouds', dependencies: [], category: 'Environment' },
  { id: 'space-biome', name: 'Space', icon: '🌌', description: 'Zero gravity, stars, planets', dependencies: [], category: 'Environment' },
  { id: 'moon-surface', name: 'Moon Surface', icon: '🌙', description: 'Low gravity, craters, dust', dependencies: [], category: 'Environment' },
  { id: 'underwater-city', name: 'Underwater City', icon: '🏙️', description: 'Bubble domes, coral, fish', dependencies: [], category: 'Environment' },
  { id: 'crystal-cavern', name: 'Crystal Cavern', icon: '💎', description: 'Glowing crystals, reflections', dependencies: [], category: 'Environment' },
  { id: 'mushroom-forest', name: 'Mushroom Forest', icon: '🍄', description: 'Giant mushrooms, bioluminescence', dependencies: [], category: 'Environment' },
  { id: 'candy-land', name: 'Candy Land', icon: '🍬', description: 'Candy terrain, chocolate rivers', dependencies: [], category: 'Environment' },
  { id: 'neon-city', name: 'Neon City', icon: '🌃', description: 'Cyberpunk city, glowing signs', dependencies: [], category: 'Environment' },
  { id: 'medieval-village', name: 'Medieval Village', icon: '🏰', description: 'Stone buildings, market, castle', dependencies: [], category: 'Environment' },
  { id: 'modern-city', name: 'Modern City', icon: '🏙️', description: 'Skyscrapers, roads, traffic', dependencies: [], category: 'Environment' },
  { id: 'futuristic-city', name: 'Futuristic City', icon: '🌆', description: 'Hover cars, holograms, tech', dependencies: [], category: 'Environment' },
  { id: 'abandoned-town', name: 'Abandoned Town', icon: '🏚️', description: 'Decayed buildings, overgrowth', dependencies: [], category: 'Environment' },
  { id: 'haunted-forest', name: 'Haunted Forest', icon: '🌑', description: 'Spooky trees, fog, ghosts', dependencies: [], category: 'Environment' },
  { id: 'graveyard', name: 'Graveyard', icon: '🪦', description: 'Tombstones, crypts, eerie mood', dependencies: [], category: 'Environment' },
  { id: 'dungeon-env', name: 'Dungeon', icon: '🏰', description: 'Stone corridors, torches, cells', dependencies: [], category: 'Environment' },
  { id: 'castle-interior', name: 'Castle Interior', icon: '👑', description: 'Throne room, halls, chambers', dependencies: [], category: 'Environment' },
  { id: 'prison', name: 'Prison', icon: '🔒', description: 'Cells, yard, guard towers', dependencies: [], category: 'Environment' },
  { id: 'lab', name: 'Laboratory', icon: '🔬', description: 'Science lab, tubes, experiments', dependencies: [], category: 'Environment' },
  { id: 'space-station', name: 'Space Station', icon: '🛸', description: 'Airlocks, corridors, zero-g areas', dependencies: [], category: 'Environment' },
  { id: 'pirate-ship', name: 'Pirate Ship', icon: '🏴‍☠️', description: 'Ship deck, cannons, rigging', dependencies: [], category: 'Environment' },
  { id: 'school', name: 'School', icon: '🏫', description: 'Classrooms, gym, cafeteria, yard', dependencies: [], category: 'Environment' },
  { id: 'hospital', name: 'Hospital', icon: '🏥', description: 'Rooms, ER, surgery, waiting area', dependencies: [], category: 'Environment' },
  { id: 'mall', name: 'Shopping Mall', icon: '🛍️', description: 'Stores, food court, escalators', dependencies: [], category: 'Environment' },
  { id: 'amusement-park', name: 'Amusement Park', icon: '🎢', description: 'Rides, games, food stands', dependencies: [], category: 'Environment' },
  { id: 'campsite', name: 'Campsite', icon: '⛺', description: 'Tents, campfire, nature', dependencies: [], category: 'Environment' },

  // ═══════════════════════════════════════════
  // UI (35)
  // ═══════════════════════════════════════════
  { id: 'leaderboard', name: 'Leaderboard', icon: '🏆', description: 'Rankings, stats display', dependencies: [], category: 'UI' },
  { id: 'minimap', name: 'Minimap', icon: '🗺️', description: 'Map overlay, markers, zoom', dependencies: [], category: 'UI' },
  { id: 'healthbar', name: 'Health Bar', icon: '❤️', description: 'HP display, damage numbers', dependencies: ['combat'], category: 'UI' },
  { id: 'settings', name: 'Settings Menu', icon: '⚙️', description: 'Graphics, audio, controls', dependencies: [], category: 'UI' },
  { id: 'notifications', name: 'Notifications', icon: '🔔', description: 'Pop-ups, toasts, alerts', dependencies: [], category: 'UI' },
  { id: 'loading', name: 'Loading Screen', icon: '⏳', description: 'Progress bar, tips, branding', dependencies: [], category: 'UI' },
  { id: 'mana-bar', name: 'Mana Bar', icon: '🔵', description: 'MP display under health bar', dependencies: ['mana-system'], category: 'UI' },
  { id: 'stamina-bar', name: 'Stamina Bar', icon: '🟢', description: 'Stamina display, drain animation', dependencies: ['stamina-system'], category: 'UI' },
  { id: 'xp-bar', name: 'XP Bar', icon: '⭐', description: 'Experience progress to next level', dependencies: ['progression'], category: 'UI' },
  { id: 'shield-bar', name: 'Shield Bar', icon: '🛡️', description: 'Shield/armor HP overlay', dependencies: ['armor-system'], category: 'UI' },
  { id: 'hunger-bar', name: 'Hunger Bar', icon: '🍖', description: 'Food meter, starvation effects', dependencies: [], category: 'UI' },
  { id: 'thirst-bar', name: 'Thirst Bar', icon: '💧', description: 'Water meter, dehydration', dependencies: [], category: 'UI' },
  { id: 'temperature-gauge', name: 'Temperature', icon: '🌡️', description: 'Hot/cold meter, environment effects', dependencies: [], category: 'UI' },
  { id: 'compass', name: 'Compass', icon: '🧭', description: 'Direction indicator, waypoints', dependencies: [], category: 'UI' },
  { id: 'quest-tracker', name: 'Quest Tracker', icon: '📋', description: 'Active quest objectives on screen', dependencies: ['quests'], category: 'UI' },
  { id: 'achievement-popup', name: 'Achievement Pop-up', icon: '🏅', description: 'Animated achievement unlock notification', dependencies: ['achievements'], category: 'UI' },
  { id: 'level-up-animation', name: 'Level Up Animation', icon: '🎉', description: 'Flashy level up effect and sound', dependencies: ['progression'], category: 'UI' },
  { id: 'damage-numbers', name: 'Damage Numbers', icon: '💢', description: 'Floating damage text, colors by type', dependencies: ['combat'], category: 'UI' },
  { id: 'kill-feed', name: 'Kill Feed', icon: '💀', description: 'Who killed who, weapon icons', dependencies: ['combat'], category: 'UI' },
  { id: 'scoreboard', name: 'Scoreboard', icon: '📊', description: 'Team scores, K/D/A, stats', dependencies: ['teams'], category: 'UI' },
  { id: 'round-timer', name: 'Round Timer', icon: '⏰', description: 'Countdown timer for rounds', dependencies: ['rounds'], category: 'UI' },
  { id: 'spectator-ui', name: 'Spectator UI', icon: '👁️', description: 'Watch other players after death', dependencies: [], category: 'UI' },
  { id: 'death-screen', name: 'Death Screen', icon: '💀', description: 'Death overlay, respawn timer', dependencies: ['combat'], category: 'UI' },
  { id: 'victory-screen', name: 'Victory Screen', icon: '🏆', description: 'Win display, stats, rewards', dependencies: ['rounds'], category: 'UI' },
  { id: 'loading-tips', name: 'Loading Tips', icon: '💡', description: 'Gameplay tips during loading', dependencies: ['loading'], category: 'UI' },
  { id: 'tooltip-system', name: 'Tooltips', icon: '💬', description: 'Hover info for items, buttons', dependencies: [], category: 'UI' },
  { id: 'radial-menu', name: 'Radial Menu', icon: '⭕', description: 'Circular selection menu, quick access', dependencies: [], category: 'UI' },
  { id: 'action-bar', name: 'Action Bar', icon: '🎮', description: 'Ability hotbar, keybind slots', dependencies: ['abilities'], category: 'UI' },
  { id: 'hotbar', name: 'Hotbar', icon: '🔢', description: 'Quick-access item slots 1-9', dependencies: ['inventory'], category: 'UI' },
  { id: 'inventory-grid', name: 'Inventory Grid', icon: '📦', description: 'Grid-based inventory UI, drag/drop', dependencies: ['inventory'], category: 'UI' },
  { id: 'character-stats', name: 'Character Stats', icon: '📊', description: 'Stats screen, attributes, gear score', dependencies: ['progression'], category: 'UI' },
  { id: 'map-screen', name: 'Map Screen', icon: '🗺️', description: 'Full map view, markers, legend', dependencies: [], category: 'UI' },
  { id: 'phone-ui', name: 'Phone UI', icon: '📱', description: 'In-game phone, apps, contacts', dependencies: [], category: 'UI' },
  { id: 'tablet-ui', name: 'Tablet UI', icon: '📱', description: 'In-game tablet, map, messages', dependencies: [], category: 'UI' },
  { id: 'dialogue-ui', name: 'Dialogue UI', icon: '💬', description: 'NPC dialogue box, choices, portrait', dependencies: ['npcs'], category: 'UI' },

  // ═══════════════════════════════════════════
  // AUDIO (30)
  // ═══════════════════════════════════════════
  { id: 'bg-music', name: 'Background Music', icon: '🎵', description: 'Looping background soundtrack', dependencies: [], category: 'Audio' },
  { id: 'combat-music', name: 'Combat Music', icon: '⚔️', description: 'Intense music during fights', dependencies: ['combat'], category: 'Audio' },
  { id: 'boss-music', name: 'Boss Music', icon: '👹', description: 'Epic boss battle soundtrack', dependencies: ['bossfights'], category: 'Audio' },
  { id: 'ambient-sounds', name: 'Ambient Sounds', icon: '🌿', description: 'Environmental background audio', dependencies: [], category: 'Audio' },
  { id: 'footstep-sounds', name: 'Footstep Sounds', icon: '👣', description: 'Material-based footstep audio', dependencies: [], category: 'Audio' },
  { id: 'hit-sounds', name: 'Hit Sounds', icon: '💥', description: 'Impact sound effects on damage', dependencies: ['combat'], category: 'Audio' },
  { id: 'death-sound', name: 'Death Sound', icon: '💀', description: 'Sound effect on player death', dependencies: ['combat'], category: 'Audio' },
  { id: 'level-up-sound', name: 'Level Up Sound', icon: '🎉', description: 'Fanfare on level increase', dependencies: ['progression'], category: 'Audio' },
  { id: 'achievement-sound', name: 'Achievement Sound', icon: '🏅', description: 'Unlock sound for achievements', dependencies: ['achievements'], category: 'Audio' },
  { id: 'coin-pickup-sound', name: 'Coin Pickup', icon: '🪙', description: 'Satisfying coin collect sound', dependencies: ['currency'], category: 'Audio' },
  { id: 'door-sounds', name: 'Door Sounds', icon: '🚪', description: 'Open/close door audio', dependencies: [], category: 'Audio' },
  { id: 'weapon-swing', name: 'Weapon Swing', icon: '💨', description: 'Whoosh sound on melee attacks', dependencies: ['weapons'], category: 'Audio' },
  { id: 'gunshot-sounds', name: 'Gunshot Sounds', icon: '🔫', description: 'Firing, reload, empty clip', dependencies: ['gun-combat'], category: 'Audio' },
  { id: 'explosion-sounds', name: 'Explosion', icon: '💣', description: 'Boom effect, rumble, debris', dependencies: [], category: 'Audio' },
  { id: 'rain-sounds', name: 'Rain', icon: '🌧️', description: 'Rain patter, intensity levels', dependencies: ['weather'], category: 'Audio' },
  { id: 'thunder-sounds', name: 'Thunder', icon: '⛈️', description: 'Thunder cracks, rumbles', dependencies: ['weather'], category: 'Audio' },
  { id: 'wind-sounds', name: 'Wind', icon: '💨', description: 'Wind howling, breezes', dependencies: ['weather'], category: 'Audio' },
  { id: 'ocean-sounds', name: 'Ocean Waves', icon: '🌊', description: 'Wave crashes, calm seas', dependencies: [], category: 'Audio' },
  { id: 'bird-sounds', name: 'Bird Chirping', icon: '🐦', description: 'Daytime bird ambience', dependencies: [], category: 'Audio' },
  { id: 'cricket-sounds', name: 'Cricket Night', icon: '🦗', description: 'Nighttime cricket chirping', dependencies: [], category: 'Audio' },
  { id: 'fire-particles', name: 'Fire Effects', icon: '🔥', description: 'Fire particles, crackling sound', dependencies: [], category: 'Audio' },
  { id: 'smoke-effects', name: 'Smoke Effects', icon: '💨', description: 'Smoke particles, rising, fading', dependencies: [], category: 'Audio' },
  { id: 'sparkle-effects', name: 'Sparkles', icon: '✨', description: 'Sparkle particles, shimmer', dependencies: [], category: 'Audio' },
  { id: 'confetti-effects', name: 'Confetti', icon: '🎊', description: 'Celebration confetti burst', dependencies: [], category: 'Audio' },
  { id: 'heal-effect', name: 'Heal Effect', icon: '💚', description: 'Green glow, healing particles', dependencies: [], category: 'Audio' },
  { id: 'shield-effect', name: 'Shield Effect', icon: '🛡️', description: 'Bubble shield visual, crack on hit', dependencies: [], category: 'Audio' },
  { id: 'screen-shake', name: 'Screen Shake', icon: '📳', description: 'Camera shake on explosions, hits', dependencies: [], category: 'Audio' },
  { id: 'flash-effect', name: 'Flash Effect', icon: '⚡', description: 'Screen flash on damage, events', dependencies: [], category: 'Audio' },
  { id: 'slow-motion', name: 'Slow Motion', icon: '🐌', description: 'Time slowdown effect, bullet time', dependencies: [], category: 'Audio' },
  { id: 'jukebox', name: 'Jukebox', icon: '🎶', description: 'Player-controlled music player, playlists', dependencies: [], category: 'Audio' },

  // ═══════════════════════════════════════════
  // MONETIZATION (25)
  // ═══════════════════════════════════════════
  { id: 'gamepass', name: 'Game Passes', icon: '🎫', description: 'VIP, speed boost, double XP', dependencies: [], category: 'Monetization' },
  { id: 'devproducts', name: 'Dev Products', icon: '💎', description: 'Coins, gems, revives', dependencies: ['currency'], category: 'Monetization' },
  { id: 'premium', name: 'Premium Perks', icon: '👑', description: 'Roblox Premium benefits', dependencies: [], category: 'Monetization' },
  { id: 'battlepass', name: 'Battle Pass', icon: '🎖️', description: 'Seasons, tiers, exclusive rewards', dependencies: ['progression'], category: 'Monetization' },
  { id: 'dailyrewards', name: 'Daily Rewards', icon: '🎁', description: 'Login streaks, reward calendar', dependencies: [], category: 'Monetization' },
  { id: 'codes', name: 'Promo Codes', icon: '🔑', description: 'Redeem codes for items/currency', dependencies: ['inventory'], category: 'Monetization' },
  { id: 'gp-vip', name: 'GP: VIP', icon: '⭐', description: 'VIP badge, chat tag, perks', dependencies: ['gamepass'], category: 'Monetization' },
  { id: 'gp-speed', name: 'GP: Speed Boost', icon: '🏃', description: '+50% walkspeed permanently', dependencies: ['gamepass'], category: 'Monetization' },
  { id: 'gp-double-xp', name: 'GP: Double XP', icon: '📈', description: '2x experience from all sources', dependencies: ['gamepass', 'progression'], category: 'Monetization' },
  { id: 'gp-double-coins', name: 'GP: Double Coins', icon: '💰', description: '2x currency from all sources', dependencies: ['gamepass', 'currency'], category: 'Monetization' },
  { id: 'gp-fly', name: 'GP: Fly', icon: '🕊️', description: 'Ability to fly in game', dependencies: ['gamepass'], category: 'Monetization' },
  { id: 'gp-radio', name: 'GP: Radio', icon: '📻', description: 'Play audio IDs in-game', dependencies: ['gamepass'], category: 'Monetization' },
  { id: 'gp-custom-title', name: 'GP: Custom Title', icon: '🏷️', description: 'Custom overhead title text', dependencies: ['gamepass'], category: 'Monetization' },
  { id: 'dp-coins-small', name: 'DP: 100 Coins', icon: '🪙', description: 'Purchase 100 coins with Robux', dependencies: ['devproducts'], category: 'Monetization' },
  { id: 'dp-coins-large', name: 'DP: 1000 Coins', icon: '💰', description: 'Purchase 1000 coins with Robux', dependencies: ['devproducts'], category: 'Monetization' },
  { id: 'dp-skip-stage', name: 'DP: Skip Stage', icon: '⏭️', description: 'Skip current obby stage', dependencies: ['devproducts', 'obby'], category: 'Monetization' },
  { id: 'dp-extra-life', name: 'DP: Extra Life', icon: '💚', description: 'Instant revive on death', dependencies: ['devproducts'], category: 'Monetization' },
  { id: 'dp-crate-key', name: 'DP: Crate Key', icon: '🔑', description: 'Key to open loot crates', dependencies: ['devproducts', 'crate-system'], category: 'Monetization' },
  { id: 'premium-area', name: 'Premium Area', icon: '🌟', description: 'Exclusive zone for premium players', dependencies: ['premium'], category: 'Monetization' },
  { id: 'premium-daily', name: 'Premium Daily', icon: '📅', description: 'Extra daily bonus for premium', dependencies: ['premium', 'dailyrewards'], category: 'Monetization' },
  { id: 'limited-items', name: 'Limited Items', icon: '💫', description: 'Time-limited exclusive items', dependencies: ['inventory'], category: 'Monetization' },
  { id: 'seasonal-items', name: 'Seasonal Items', icon: '🎄', description: 'Holiday-themed exclusive items', dependencies: ['inventory'], category: 'Monetization' },
  { id: 'starter-pack', name: 'Starter Pack', icon: '📦', description: 'One-time bundle for new players', dependencies: ['devproducts'], category: 'Monetization' },
  { id: 'mega-pack', name: 'Mega Pack', icon: '🎁', description: 'Large value bundle, best deal', dependencies: ['devproducts'], category: 'Monetization' },
  { id: 'donation-board', name: 'Donation Board', icon: '🏆', description: 'Robux donation display, leaderboard', dependencies: [], category: 'Monetization' },

  // ═══════════════════════════════════════════
  // EVENTS (25)
  // ═══════════════════════════════════════════
  { id: 'halloween-event', name: 'Halloween Event', icon: '🎃', description: 'Spooky theme, costumes, candy', dependencies: [], category: 'Events' },
  { id: 'christmas-event', name: 'Christmas Event', icon: '🎄', description: 'Snow, gifts, Santa, decorations', dependencies: [], category: 'Events' },
  { id: 'easter-event', name: 'Easter Event', icon: '🥚', description: 'Egg hunt, bunny, spring theme', dependencies: [], category: 'Events' },
  { id: 'valentine-event', name: 'Valentine Event', icon: '💕', description: 'Hearts, love theme, pair activities', dependencies: [], category: 'Events' },
  { id: 'summer-event', name: 'Summer Event', icon: '☀️', description: 'Beach theme, water activities', dependencies: [], category: 'Events' },
  { id: 'winter-event', name: 'Winter Event', icon: '⛄', description: 'Snowball fights, ice skating', dependencies: [], category: 'Events' },
  { id: 'anniversary-event', name: 'Anniversary', icon: '🎂', description: 'Game birthday celebration', dependencies: [], category: 'Events' },
  { id: 'update-celebration', name: 'Update Celebration', icon: '🎊', description: 'New update launch event', dependencies: [], category: 'Events' },
  { id: 'limited-time-mode', name: 'Limited Time Mode', icon: '⏰', description: 'Temporary game mode, rotates', dependencies: ['rounds'], category: 'Events' },
  { id: 'event-currency', name: 'Event Currency', icon: '🎟️', description: 'Special currency for event shop', dependencies: ['currency'], category: 'Events' },
  { id: 'event-shop', name: 'Event Shop', icon: '🏪', description: 'Exclusive items for event currency', dependencies: ['event-currency', 'shop'], category: 'Events' },
  { id: 'event-leaderboard', name: 'Event Leaderboard', icon: '🏆', description: 'Rankings for event activities', dependencies: ['leaderboard'], category: 'Events' },
  { id: 'event-boss', name: 'Event Boss', icon: '👹', description: 'Limited-time boss with drops', dependencies: ['bossfights'], category: 'Events' },
  { id: 'trick-or-treat', name: 'Trick or Treat', icon: '🍬', description: 'Door-to-door candy collecting', dependencies: ['halloween-event'], category: 'Events' },
  { id: 'snowball-fight', name: 'Snowball Fight', icon: '❄️', description: 'Throw snowballs PvP minigame', dependencies: ['winter-event', 'combat'], category: 'Events' },
  { id: 'egg-hunt', name: 'Egg Hunt', icon: '🐣', description: 'Find hidden eggs, collection', dependencies: ['easter-event'], category: 'Events' },
  { id: 'fireworks-show', name: 'Fireworks Show', icon: '🎆', description: 'Scripted fireworks display', dependencies: [], category: 'Events' },
  { id: 'contest', name: 'Contest', icon: '🏅', description: 'Player competitions, judging, prizes', dependencies: [], category: 'Events' },
  { id: 'giveaway', name: 'Giveaway', icon: '🎁', description: 'Random winner selection, prizes', dependencies: [], category: 'Events' },
  { id: 'countdown-timer', name: 'Countdown Timer', icon: '⏳', description: 'New Year or event countdown', dependencies: [], category: 'Events' },
  { id: 'seasonal-decorations', name: 'Seasonal Decor', icon: '🎍', description: 'Auto-decorate map for holidays', dependencies: [], category: 'Events' },
  { id: 'event-quest-line', name: 'Event Quests', icon: '📜', description: 'Limited-time quest chain, story', dependencies: ['quests'], category: 'Events' },
  { id: 'double-xp-weekend', name: 'Double XP Weekend', icon: '📈', description: 'Server-wide XP boost event', dependencies: ['progression'], category: 'Events' },
  { id: 'treasure-hunt', name: 'Treasure Hunt', icon: '🗝️', description: 'Find hidden treasures on map', dependencies: [], category: 'Events' },
  { id: 'minigame-event', name: 'Minigame Event', icon: '🎮', description: 'Collection of party minigames', dependencies: ['rounds'], category: 'Events' },

  // ═══════════════════════════════════════════
  // ADVANCED (30)
  // ═══════════════════════════════════════════
  { id: 'progression', name: 'Leveling', icon: '📊', description: 'XP, levels, stat upgrades', dependencies: [], category: 'Advanced' },
  { id: 'achievements', name: 'Achievements', icon: '🏅', description: 'Badges, milestones, unlocks', dependencies: [], category: 'Advanced' },
  { id: 'rebirth', name: 'Rebirth/Prestige', icon: '♻️', description: 'Reset progress for multipliers', dependencies: ['progression'], category: 'Advanced' },
  { id: 'gacha', name: 'Egg Hatching', icon: '🥚', description: 'Lootboxes, rarity, luck boosts', dependencies: ['pets', 'currency'], category: 'Advanced' },
  { id: 'survival-mechanics', name: 'Survival', icon: '🏕️', description: 'Hunger, thirst, temperature, shelter', dependencies: [], category: 'Advanced' },
  { id: 'hunger-system', name: 'Hunger System', icon: '🍖', description: 'Eat to survive, starvation damage', dependencies: ['survival-mechanics'], category: 'Advanced' },
  { id: 'thirst-system', name: 'Thirst System', icon: '💧', description: 'Drink to survive, dehydration', dependencies: ['survival-mechanics'], category: 'Advanced' },
  { id: 'temperature-system', name: 'Temperature', icon: '🌡️', description: 'Hot/cold, clothing, shelter needed', dependencies: ['survival-mechanics'], category: 'Advanced' },
  { id: 'shelter-system', name: 'Shelter', icon: '🏠', description: 'Build shelter, warmth, protection', dependencies: ['survival-mechanics', 'build-mode'], category: 'Advanced' },
  { id: 'oxygen-system', name: 'Oxygen', icon: '🫁', description: 'Underwater/space oxygen meter', dependencies: [], category: 'Advanced' },
  { id: 'infection-system', name: 'Infection', icon: '🦠', description: 'Spread infection, cure, infected team', dependencies: ['combat'], category: 'Advanced' },
  { id: 'detective-system', name: 'Murder Mystery', icon: '🔍', description: 'Murderer, sheriff, innocents, clues', dependencies: ['rounds'], category: 'Advanced' },
  { id: 'voting-system', name: 'Voting System', icon: '🗳️', description: 'Map vote, mode vote, skip vote', dependencies: [], category: 'Advanced' },
  { id: 'spectating', name: 'Spectating', icon: '👁️', description: 'Watch game after elimination', dependencies: [], category: 'Advanced' },
  { id: 'replay-system', name: 'Replay System', icon: '📹', description: 'Record and replay gameplay', dependencies: [], category: 'Advanced' },
  { id: 'random-events', name: 'Random Events', icon: '🎲', description: 'Random world events, disasters, bonuses', dependencies: [], category: 'Advanced' },
  { id: 'day-cycle-events', name: 'Day Cycle Events', icon: '🌅', description: 'Events tied to in-game time', dependencies: ['daynight'], category: 'Advanced' },
  { id: 'wanted-system', name: 'Wanted System', icon: '🚨', description: 'Crime stars, police chase, bounty', dependencies: [], category: 'Advanced' },
  { id: 'jail-system', name: 'Jail System', icon: '🔒', description: 'Get arrested, serve time, escape', dependencies: ['wanted-system'], category: 'Advanced' },
  { id: 'heist-system', name: 'Heist System', icon: '💰', description: 'Plan and execute robberies', dependencies: ['wanted-system', 'currency'], category: 'Advanced' },
  { id: 'collection-log', name: 'Collection Log', icon: '📕', description: 'Track all discovered items, completion %', dependencies: ['inventory'], category: 'Advanced' },
  { id: 'daily-challenges', name: 'Daily Challenges', icon: '📋', description: 'New objectives each day, rewards', dependencies: ['quests'], category: 'Advanced' },
  { id: 'weekly-challenges', name: 'Weekly Challenges', icon: '📅', description: 'Harder weekly goals, better rewards', dependencies: ['quests'], category: 'Advanced' },
  { id: 'combo-multiplier', name: 'Combo Multiplier', icon: '🔥', description: 'Streak-based earning multiplier', dependencies: ['currency'], category: 'Advanced' },
  { id: 'lucky-system', name: 'Luck System', icon: '🍀', description: 'Luck stat, affects drops and hatching', dependencies: [], category: 'Advanced' },
  { id: 'crafting-table', name: 'Crafting Table', icon: '🪚', description: 'Interactive crafting station UI', dependencies: ['crafting'], category: 'Advanced' },
  { id: 'enchantment-table', name: 'Enchantment Table', icon: '🔮', description: 'Upgrade gear with magic', dependencies: ['enchanting'], category: 'Advanced' },
  { id: 'portal-system', name: 'Portals', icon: '🌀', description: 'Visible portals between areas', dependencies: ['teleport'], category: 'Advanced' },
  { id: 'procedural-gen', name: 'Procedural Gen', icon: '🎲', description: 'Randomly generated maps/dungeons', dependencies: [], category: 'Advanced' },
  { id: 'modding-system', name: 'Modding Support', icon: '🧩', description: 'User-created content, workshop', dependencies: [], category: 'Advanced' },
]

const CATEGORIES: SystemCategory[] = [
  'Core', 'Economy', 'Combat', 'Social', 'Pets', 'Tycoon', 'Obby',
  'Simulator', 'RPG', 'Building', 'Vehicles', 'Environment', 'UI',
  'Audio', 'Monetization', 'Events', 'Advanced',
]

interface SystemComposerProps {
  onGenerate: (prompt: string) => void
  loading?: boolean
}

export function SystemComposer({ onGenerate, loading }: SystemComposerProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [expanded, setExpanded] = useState(false)
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState<SystemCategory | 'All'>('All')

  const filtered = useMemo(() => {
    let systems = GAME_SYSTEMS as CategorizedSystem[]
    if (activeCategory !== 'All') systems = systems.filter(s => s.category === activeCategory)
    if (search.trim()) {
      const q = search.toLowerCase()
      systems = systems.filter(s => s.name.toLowerCase().includes(q) || s.description.toLowerCase().includes(q) || s.category.toLowerCase().includes(q))
    }
    return systems
  }, [search, activeCategory])

  const toggleSystem = useCallback((id: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
        // Auto-add dependencies
        const system = GAME_SYSTEMS.find(s => s.id === id)
        if (system) {
          for (const dep of system.dependencies) {
            next.add(dep)
          }
        }
      }
      return next
    })
  }, [])

  const handleGenerate = useCallback(() => {
    if (selected.size === 0) return
    const systems = GAME_SYSTEMS.filter(s => selected.has(s.id))
    const prompt = `Create a complete, integrated game system with the following components: ${systems.map(s => `${s.name} (${s.description})`).join(', ')}. All systems should work together — for example, if there's a shop and inventory, purchased items should go into inventory. Generate all the necessary Scripts, LocalScripts, and ModuleScripts. Use RemoteEvents for client-server communication.`
    onGenerate(prompt)
  }, [selected, onGenerate])

  if (!expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '6px 12px',
          borderRadius: 8,
          border: '1px solid rgba(212,175,55,0.2)',
          background: 'rgba(212,175,55,0.05)',
          color: '#D4AF37',
          fontSize: 12,
          fontWeight: 600,
          cursor: 'pointer',
          transition: 'all 0.15s',
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
        System Composer ({GAME_SYSTEMS.length} systems)
      </button>
    )
  }

  return (
    <div
      style={{
        background: 'rgba(10,12,24,0.95)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 12,
        padding: 16,
        backdropFilter: 'blur(20px)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: '#D4AF37' }}>
          Game System Composer ({GAME_SYSTEMS.length} systems)
        </span>
        <button
          onClick={() => setExpanded(false)}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#52525B',
            cursor: 'pointer',
            padding: 4,
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Search */}
      <div style={{ marginBottom: 10 }}>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search systems..."
          style={{
            width: '100%',
            padding: '8px 12px',
            borderRadius: 8,
            border: '1px solid rgba(255,255,255,0.08)',
            background: 'rgba(255,255,255,0.03)',
            color: '#E4E4E7',
            fontSize: 12,
            outline: 'none',
          }}
        />
      </div>

      {/* Category tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 10, flexWrap: 'wrap' }}>
        {(['All', ...CATEGORIES] as const).map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            style={{
              padding: '4px 10px',
              borderRadius: 6,
              border: 'none',
              background: activeCategory === cat ? 'rgba(212,175,55,0.15)' : 'rgba(255,255,255,0.03)',
              color: activeCategory === cat ? '#D4AF37' : '#71717A',
              fontSize: 10,
              fontWeight: activeCategory === cat ? 700 : 500,
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* System grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginBottom: 12, maxHeight: 340, overflowY: 'auto' }}>
        {filtered.map(system => {
          const isSelected = selected.has(system.id)
          const isDependency = !isSelected && Array.from(selected).some(sid => {
            const s = GAME_SYSTEMS.find(gs => gs.id === sid)
            return s?.dependencies.includes(system.id)
          })

          return (
            <button
              key={system.id}
              onClick={() => toggleSystem(system.id)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 2,
                padding: '8px 4px',
                borderRadius: 8,
                border: `1px solid ${isSelected ? 'rgba(212,175,55,0.4)' : isDependency ? 'rgba(212,175,55,0.15)' : 'rgba(255,255,255,0.06)'}`,
                background: isSelected ? 'rgba(212,175,55,0.1)' : 'rgba(255,255,255,0.02)',
                color: isSelected ? '#D4AF37' : '#A1A1AA',
                fontSize: 10,
                fontWeight: isSelected ? 600 : 400,
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              <span style={{ fontSize: 16 }}>{system.icon}</span>
              <span>{system.name}</span>
            </button>
          )
        })}
      </div>

      {/* Selected summary + generate button */}
      {selected.size > 0 && (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: '#71717A', flex: 1 }}>
            {selected.size} system{selected.size > 1 ? 's' : ''} selected
          </span>
          <button
            onClick={handleGenerate}
            disabled={loading}
            style={{
              padding: '6px 16px',
              borderRadius: 8,
              border: 'none',
              background: loading ? 'rgba(212,175,55,0.3)' : '#D4AF37',
              color: '#0a0a0a',
              fontSize: 12,
              fontWeight: 700,
              cursor: loading ? 'default' : 'pointer',
              transition: 'all 0.15s',
            }}
          >
            {loading ? 'Generating...' : 'Generate All'}
          </button>
        </div>
      )}
    </div>
  )
}
