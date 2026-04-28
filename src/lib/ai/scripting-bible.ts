/**
 * SCRIPTING BIBLE — THE definitive reference for scripting ANY game system in Roblox Luau.
 *
 * This is NOT code. This is DESIGN KNOWLEDGE the AI reads to understand how to write
 * unique, complete, production-quality game systems from scratch every time.
 *
 * Sections:
 *   1. 50 Complete System Designs (architecture, data, remotes, edge cases, anti-exploit)
 *   2. Data Architecture Patterns (DataStore, caching, migration, cross-server)
 *   3. Client-Server Communication Patterns (remotes, validation, security)
 *   4. UI Design Patterns (layout, navigation, animation, responsive)
 *   5. Performance Optimization Bible (budgets, memory, network, rendering)
 *   6. Effect Recipes (50 visual/audio effects with exact properties)
 */

import 'server-only'

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SECTION 1: 50 COMPLETE SYSTEM DESIGNS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const SYSTEM_DESIGNS = `
=== 50 COMPLETE GAME SYSTEM DESIGNS ===
Each system: data schema, remotes, server logic, client logic, edge cases, anti-exploit, connections.
Use these to write UNIQUE implementations every time — never copy-paste, always adapt to the game's theme.

────────────────────────────────────────────────────────────
1. CURRENCY SYSTEM (coins, gems, premium currency)
────────────────────────────────────────────────────────────
DATA: Store per-player: { coins: number, gems: number, premiumCurrency: number, lifetimeEarned: number, lifetimeSpent: number }. Keep transaction log as array of { type, amount, source, timestamp } — cap at last 50 entries.
REMOTES: GetBalance (RemoteFunction — returns all currencies), CurrencyChanged (RemoteEvent — server→client notification), PurchaseRequest (RemoteEvent — client→server for premium currency).
SERVER: All currency changes happen server-side ONLY. Functions: addCurrency(player, type, amount, source), spendCurrency(player, type, amount, reason) → returns boolean. spendCurrency checks balance >= amount BEFORE deducting. Use a transaction lock (simple boolean flag per player) to prevent double-spend race conditions.
CLIENT: Displays currency in top bar HUD. Listens to CurrencyChanged event to update UI. NEVER stores authoritative balance — always receives from server. Animates number changes with tween (count up/down effect). Shows +/- floating text at earn/spend location.
EDGE CASES: Negative balance (clamp to 0), overflow (cap at 999,999,999), simultaneous purchases (transaction lock), player leaves mid-transaction (save current state), NaN from bad math (validate all arithmetic).
ANTI-EXPLOIT: NEVER let client set currency values. Validate all earn sources (did player actually kill that NPC? did they actually complete that quest?). Rate-limit earn requests — max 10 currency changes per second per player. Log suspicious spikes (earning 10x normal rate = flag for review).
CONNECTIONS: Shop system reads balance for affordability. Quest system calls addCurrency on completion. Trading system calls spendCurrency/addCurrency atomically. Leaderboard reads lifetimeEarned.

────────────────────────────────────────────────────────────
2. INVENTORY SYSTEM (slots, stacking, weight, categories)
────────────────────────────────────────────────────────────
DATA: Store as dictionary: { items: { [slotIndex]: { id: string, quantity: number, metadata: {} } }, maxSlots: number, categories: { weapons: slotIndex[], armor: slotIndex[], consumables: slotIndex[] } }. Each item has a definition in a shared ItemDatabase module: { id, name, description, category, maxStack, weight, rarity, icon, sellPrice, usable, tradeable }.
REMOTES: GetInventory (RemoteFunction), InventoryUpdated (RemoteEvent — delta updates, not full sync), UseItem (RemoteEvent), DropItem (RemoteEvent), MoveItem (RemoteEvent — for rearranging), SplitStack (RemoteEvent).
SERVER: Maintains authoritative inventory per player. addItem(player, itemId, quantity) — finds existing stack or empty slot, respects maxStack, returns overflow count. removeItem(player, itemId, quantity) — removes from first matching stack. moveItem(player, fromSlot, toSlot) — swaps or merges. splitStack(player, slot, splitAmount) — creates new stack in empty slot.
CLIENT: Renders grid of slots. Drag-and-drop for rearranging (fires MoveItem). Right-click context menu: Use, Drop, Split, Info. Tooltip on hover shows item details. Filter tabs by category. Sort button (by name, rarity, quantity). Search bar for large inventories.
EDGE CASES: Inventory full when receiving quest reward (queue overflow items, notify player). Stacking items with different metadata (don't stack — treat as unique). Dropping items in unloaded terrain (spawn at last valid position). Player disconnects during trade (rollback both inventories).
ANTI-EXPLOIT: Validate slot indices (must be 1..maxSlots). Validate item IDs against ItemDatabase (reject unknown IDs). Validate quantities (must be positive integers, no floats). Rate-limit MoveItem (max 20/sec to prevent inventory manipulation scripts). Server tracks item origins — flag items that appear from nowhere.
CONNECTIONS: Equipment system reads from inventory to equip. Shop system adds/removes items. Crafting system consumes and creates items. Trading system transfers between players.

────────────────────────────────────────────────────────────
3. EQUIPMENT SYSTEM (head/chest/legs/weapon/accessory, stat bonuses)
────────────────────────────────────────────────────────────
DATA: Store equipped items per slot: { head: itemId|nil, chest: itemId|nil, legs: itemId|nil, weapon: itemId|nil, accessory1: itemId|nil, accessory2: itemId|nil }. Each equipment item in ItemDatabase has: { stats: { attack: N, defense: N, speed: N, health: N }, levelReq: N, classReq: string|nil, setId: string|nil }. Set bonuses: { setId: { 2: bonusStats, 4: bonusStats, 6: bonusStats } }.
REMOTES: EquipItem (RemoteEvent — itemId, slot), UnequipItem (RemoteEvent — slot), GetEquipment (RemoteFunction), StatsUpdated (RemoteEvent — sends computed stats).
SERVER: On equip: validate item exists in inventory, validate level/class requirements, remove from inventory, place in equipment slot, return previous item to inventory if slot occupied, recalculate all stats. Stat calculation: base stats + sum(all equipped stats) + set bonuses + buff modifiers. Apply stats to character (Humanoid.MaxHealth, walkspeed modifier, etc.).
CLIENT: Paper-doll display showing equipped items on character silhouette. Click inventory item → highlight valid equipment slots. Stat comparison tooltip (green = better, red = worse). Visual equipment on character model using Accessories/MeshParts.
EDGE CASES: Equipping item that would break set bonus (warn player). Unequipping when inventory is full (block with message). Level-up enabling new equipment (notify). Duplicate equip requests (idempotent — check if already equipped). Equipment with durability (track uses, break at 0).
ANTI-EXPLOIT: Server validates ALL equip requirements. Never trust client-sent stat values. Recalculate stats server-side on every change. Validate item actually exists in player's inventory before equipping. Log equipment changes for rollback.
CONNECTIONS: Inventory system provides items. Combat system reads weapon stats. Health system reads defense/HP. Visual system renders equipment on character.

────────────────────────────────────────────────────────────
4. SHOP/STORE SYSTEM (catalog, categories, pricing, discounts)
────────────────────────────────────────────────────────────
DATA: ShopCatalog module: { [shopId]: { name, npcId, items: { itemId, price, currency, stock, restockTime, discount, levelReq }[] } }. Per-player purchase tracking: { [itemId]: { totalBought: N, lastBuyTime: N } } for limited items and cooldowns.
REMOTES: OpenShop (RemoteFunction — shopId → returns catalog with player-specific prices), BuyItem (RemoteEvent — shopId, itemId, quantity), SellItem (RemoteEvent — itemId, quantity), ShopUpdated (RemoteEvent — stock changes).
SERVER: On buy: validate shop exists, item in shop, player can afford, player meets level req, stock available, not on cooldown. Deduct currency, add item to inventory, decrement stock, record purchase. On sell: validate item in inventory, calculate sell price (usually 50% of buy price, modified by charisma/skill), add currency, remove item. Restock timer: check on shop open, replenish items whose restockTime has elapsed.
CLIENT: Grid/list layout with item icons, names, prices, owned count. Buy button grayed out if can't afford or doesn't meet requirements. Quantity selector for stackable items. Sell tab showing inventory items with sell prices. Discount badges (red "SALE" tag). Category tabs (Weapons, Armor, Potions, Special).
EDGE CASES: Buying last stock item simultaneously (server atomic check). Buying with full inventory (reject with message). NPC shop destroyed during browse (close UI). Price changes while shop is open (refresh on buy attempt). Selling quest items (mark as unsellable).
ANTI-EXPLOIT: All pricing is server-authoritative. Client never sends price — server looks up price from catalog. Validate quantity > 0 and is integer. Rate-limit purchases (max 5/sec). Track rapid buy-sell patterns (potential duplication exploit). Validate shopId corresponds to a shop the player is near.
CONNECTIONS: Currency system for payment. Inventory system for item storage. NPC system for shop NPCs. Quest system for quest-locked items.

────────────────────────────────────────────────────────────
5. TRADING SYSTEM (request, offer, confirm, anti-scam)
────────────────────────────────────────────────────────────
DATA: Active trades stored in server memory (not DataStore — trades are ephemeral): { tradeId: { player1: { userId, offers: {itemId, qty}[], confirmed: bool }, player2: { userId, offers: {itemId, qty}[], confirmed: bool }, state: "negotiating"|"confirming"|"completed"|"cancelled", startTime: N } }. Trade history in DataStore for dispute resolution: last 20 trades per player.
REMOTES: RequestTrade (RemoteEvent — targetPlayerId), AcceptTradeRequest (RemoteEvent), DeclineTrade (RemoteEvent), AddToTrade (RemoteEvent — itemId, quantity), RemoveFromTrade (RemoteEvent — itemId), ConfirmTrade (RemoteEvent), CancelTrade (RemoteEvent), TradeUpdated (RemoteEvent — server→both clients).
SERVER: Trade flow: Request → Accept → Negotiate (add/remove items) → Both Confirm → Execute. On confirm: if other player already confirmed, execute trade. If not, mark this player as confirmed. On execute: verify BOTH players still have all offered items, atomic swap (remove from both, add to both). If any item missing, cancel trade.
CLIENT: Split-screen UI: your offer on left, their offer on right. Drag items from inventory to trade panel. See other player's offered items update in real-time. Confirm button with 3-second countdown and "Are you sure?" for valuable items. Show item rarity colors. Total value estimation.
EDGE CASES: Player disconnects during trade (cancel, return items). Player moves too far from trade partner (cancel). Item used/dropped during trade (cancel if offered item missing). Both confirm simultaneously (race condition — use server lock). Trade timeout after 120 seconds of inactivity.
ANTI-EXPLOIT: Lock offered items in inventory (can't use, drop, or trade elsewhere while in active trade). Server validates every add/remove action against actual inventory. Prevent "last-second swap" by resetting both confirmations when either player modifies offers. 3-second confirm delay gives time to review. Rate-limit trade requests (max 1 per 10 seconds per player). Log all completed trades.
CONNECTIONS: Inventory system (move items between players). Currency system (if allowing currency in trades). Social system (must be friends or nearby). Achievement system (first trade, 100 trades, etc.).

────────────────────────────────────────────────────────────
6. CRAFTING SYSTEM (recipes, materials, workbench, discovery)
────────────────────────────────────────────────────────────
DATA: RecipeDatabase module: { [recipeId]: { inputs: {itemId, qty}[], output: {itemId, qty}, craftTime: N, stationReq: string|nil, skillReq: {skill: string, level: N}|nil, discoverable: bool } }. Per-player: { knownRecipes: recipeId[], craftingSkill: { [skill]: { level, xp } } }. Station types: Anvil, Furnace, Alchemy Table, Workbench, Enchanting Table.
REMOTES: GetRecipes (RemoteFunction — returns known recipes), CraftItem (RemoteEvent — recipeId), DiscoverRecipe (RemoteEvent — triggered by placing items in discovery slots), CraftingProgress (RemoteEvent — server→client progress updates).
SERVER: On craft: validate recipe known, materials in inventory, near correct station, meet skill requirements. Remove materials, start craft timer (use task.delay, NOT wait). On timer complete: add output item, grant crafting XP. Discovery: when player places combination of items in discovery slots, check all unknown recipes for matching inputs. If match found, add to knownRecipes and grant bonus XP. Skill leveling: XP thresholds per level, higher skill = faster craft time, chance for bonus output.
CLIENT: Recipe book UI with categories (Weapons, Armor, Potions, Food, Materials). Each recipe shows: icon, name, required materials (grayed if missing), craft button. Crafting progress bar during crafting. Discovery panel: 4 empty slots, "Try Combination" button. Visual feedback: sparks on anvil, bubbles in cauldron.
EDGE CASES: Disconnect during crafting (complete on rejoin if timer would have finished). Multiple craft queues (allow 1 active craft per station type). Crafting with items in trade lock (reject). Recipe that produces item player already has max of (warn before crafting). Materials consumed but crash before output given (recovery system — check "pending crafts" on join).
ANTI-EXPLOIT: Validate recipe exists and is known. Validate all materials present BEFORE removing any. Validate player is within 20 studs of required station. Rate-limit craft attempts. Server-side craft timer (client can show timer but server decides when it's done). Don't reveal undiscovered recipe hints to client.
CONNECTIONS: Inventory for materials and output. Skill system for crafting levels. Station objects in world. Mining/farming for gathering materials.

────────────────────────────────────────────────────────────
7. PET SYSTEM (hatching, following, leveling, evolution)
────────────────────────────────────────────────────────────
DATA: PetDatabase module: { [petId]: { name, rarity, baseStats: {speed, power, luck}, maxLevel, evolutionId: petId|nil, evolutionLevel: N }. Per-player: { pets: { [uniquePetId]: { petId, level, xp, equipped: bool, nickname } }, maxPets: N, activePetSlots: N (1-3) }. Egg types: { [eggId]: { cost, currency, petChances: { petId: weight }[] } }.
REMOTES: HatchEgg (RemoteEvent — eggId), EquipPet (RemoteEvent — uniquePetId), UnequipPet (RemoteEvent — uniquePetId), EvolvePet (RemoteEvent — uniquePetId), DeletePet (RemoteEvent — uniquePetId), PetUpdated (RemoteEvent — server→client), GetPets (RemoteFunction).
SERVER: Hatching: weighted random selection from egg's pet table. Rarity weights: Common 60%, Uncommon 25%, Rare 10%, Epic 4%, Legendary 1%. Create pet instance with level 1, add to player's pet collection. Equipping: attach to player character using AlignPosition + AlignOrientation constraints (NOT BodyPosition — deprecated). Max 3 equipped pets. Leveling: pets gain XP when owner earns XP/currency. Formula: petXP = playerXPGained * petPowerMultiplier. Evolution: at max level, if pet has evolutionId, transform into evolved form with boosted stats.
CLIENT: Pet inventory grid showing all owned pets with rarity borders (Common=gray, Uncommon=green, Rare=blue, Epic=purple, Legendary=gold). Equipped pets have star badge. Egg hatching animation: egg shakes 3 times, cracks, burst of particles, pet reveal with rarity-colored background. Pet follows player with smooth movement (lerp to offset position behind player).
EDGE CASES: Pet collection full when hatching (warn before purchase). Equipping 4th pet (must unequip one first). Evolving equipped pet (unequip, evolve, re-equip). Player falls off map with pet (teleport pet to spawn). Pet stuck on geometry (reset position to player every 5 seconds if distance > 50 studs).
ANTI-EXPLOIT: Server rolls egg RNG (NEVER client). Validate egg purchase affordability server-side. Validate pet ownership before equip/evolve/delete. Rate-limit hatch requests (max 3 per second for auto-hatch). Pet stats calculated server-side. Don't send RNG seed to client.
CONNECTIONS: Currency for egg purchases. Following system uses physics constraints. Combat pets boost damage. Luck stat affects drop rates in other systems. Trading for pet exchanges.

────────────────────────────────────────────────────────────
8. MOUNT/VEHICLE SYSTEM (spawn, ride, fuel, damage, despawn)
────────────────────────────────────────────────────────────
DATA: VehicleDatabase: { [vehicleId]: { name, model: string (asset path), speed, acceleration, turnSpeed, maxHealth, fuelCapacity, fuelConsumption, seats, type: "land"|"air"|"water" } }. Per-player: { ownedVehicles: vehicleId[], activeVehicle: vehicleId|nil, vehicleFuel: { [vehicleId]: number } }.
REMOTES: SpawnVehicle (RemoteEvent — vehicleId), DespawnVehicle (RemoteEvent), RefuelVehicle (RemoteEvent), VehicleDamage (RemoteEvent — server→client), EnterVehicle (RemoteEvent), ExitVehicle (RemoteEvent).
SERVER: On spawn: validate ownership, no existing active vehicle, create VehicleModel at spawn pad. Use VehicleSeat for driver, Seat parts for passengers. Apply BodyVelocity/BodyGyro or VectorForce/AlignOrientation for movement. Fuel system: decrement fuel based on distance traveled (server-side calculation every 1 second). At 0 fuel, vehicle slows to stop. Damage: track HP, visual damage at 50% and 25%. Destruction at 0 HP — explosion effect, 30 second respawn cooldown.
CLIENT: Vehicle HUD: speedometer, fuel gauge, health bar, minimap. Enter/exit prompt when near vehicle. Camera switches to vehicle follow cam (offset behind and above). Mobile controls: virtual joystick for steering, buttons for brake/boost. Sound engine: pitch scales with speed.
EDGE CASES: Player joins with active vehicle from previous session (spawn it). Two players trying to enter same seat (first one wins). Vehicle falls off map (teleport to nearest road/spawn). Passenger disconnects (remove from seat). Vehicle owner leaves (despawn after 30 seconds or transfer to passenger). Spawning vehicle inside a building (detect collision, offset position).
ANTI-EXPLOIT: Speed cap enforced server-side (teleport vehicle back if moving faster than max speed + 10%). Validate vehicle ownership on every action. Prevent spawning multiple vehicles. Fuel tracked server-side only. Damage dealt server-side only. Position validation for vehicles (same as player anti-teleport checks).
CONNECTIONS: Currency for fuel/repairs/purchases. Race system reads vehicle stats. Housing system has garage. Combat system for vehicle weapons.

────────────────────────────────────────────────────────────
9. HOUSING/PLOT SYSTEM (buy, build, furniture, visit, upgrade)
────────────────────────────────────────────────────────────
DATA: PlotDatabase: { plotSize: Vector3, plotPrice: number, upgradePrices: number[] (expand plot), maxFurniture: number per tier }. Per-player: { hasPlot: bool, plotTier: number (0-5), furniture: { [uniqueId]: { furnitureId, position: CFrame, color: Color3|nil } }[], plotSettings: { allowVisitors: bool, lockDoors: bool, theme: string } }. FurnitureDatabase: { [furnitureId]: { name, model, category, price, size: Vector3, interactable: bool } }.
REMOTES: BuyPlot (RemoteEvent), PlaceFurniture (RemoteEvent — furnitureId, CFrame), MoveFurniture (RemoteEvent — uniqueId, CFrame), RemoveFurniture (RemoteEvent — uniqueId), UpgradePlot (RemoteEvent), VisitPlot (RemoteEvent — userId), GetPlotData (RemoteFunction).
SERVER: Plot assignment: reserved area in workspace per player (use plot grid system or teleport to personal plot server). Furniture placement: validate CFrame is within plot bounds, no overlapping, player owns furniture item, within furniture limit. Snap to grid (1-stud grid for most, 0.25 for fine placement). Save all furniture positions to DataStore on change (debounced — save at most once per 10 seconds).
CLIENT: Build mode UI: furniture catalog on left, rotate/move tools, grid snap toggle, delete button. Place preview with green (valid) / red (invalid) ghost model. Click to confirm placement. Visit mode: browse friends' plots, teleport there, can view but not modify. Decoration categories: Furniture, Walls, Floors, Lighting, Outdoor, Special.
EDGE CASES: Player places furniture then goes over limit from downgrade (don't remove, just block new placement). Visiting plot whose owner is offline (load from DataStore). Multiple visitors editing simultaneously (host-only editing). Plot save data corruption (keep last 3 backups, load newest valid). Furniture model deleted from game (replace with placeholder "missing" cube).
ANTI-EXPLOIT: Server validates all placements (bounds, collision, ownership). Rate-limit placement (max 5 per second). Validate CFrame values are finite (no NaN/Inf). Prevent placing furniture at impossible positions (underground, above height limit). Don't allow editing other players' plots.
CONNECTIONS: Currency for purchases. Inventory for furniture items (or direct catalog purchase). Social system for visiting. Achievements for decoration milestones.

────────────────────────────────────────────────────────────
10. FARMING SYSTEM (plant, water, grow stages, harvest, seasons)
────────────────────────────────────────────────────────────
DATA: CropDatabase: { [cropId]: { name, seedPrice, stages: { duration, model }[], harvestYield: {itemId, minQty, maxQty}, waterNeeded: number per stage, season: string|"all", xpGain: number } }. Per-player farm plots: { [plotIndex]: { cropId: string|nil, stage: number, waterLevel: number, plantedTime: number, lastWatered: number, fertilized: bool } }. farmingSkill: { level, xp }.
REMOTES: PlantSeed (RemoteEvent — plotIndex, cropId), WaterCrop (RemoteEvent — plotIndex), HarvestCrop (RemoteEvent — plotIndex), FertilizeCrop (RemoteEvent — plotIndex), GetFarmData (RemoteFunction), CropUpdated (RemoteEvent — plotIndex, newState).
SERVER: Growth calculation: on any interaction or periodic check (every 60 seconds), calculate elapsed time since planting, advance stages based on time + water level. Each stage requires X seconds AND minimum water level. Water depletes over time (1 unit per stage-duration). Unwatered crops pause growth (don't die, just stall). Fertilizer: 2x growth speed. Harvest: validate crop at final stage, roll yield quantity (minQty..maxQty, farming skill adds bonus), add items to inventory, clear plot. Season system: crop can only be planted in matching season (or "all" for year-round).
CLIENT: Farm view with grid of soil plots. Each plot shows current crop model at current stage, water indicator (drops icon — blue=watered, yellow=needs water, red=dry). Plant menu: filtered by season, shows seed cost, grow time, yield. Watering can tool: click plot to water. Harvest: click mature crop (golden glow effect). Growth progress bar above each crop.
EDGE CASES: Server restart mid-growth (recalculate stages from plantedTime on load). Planting wrong season crop (reject with seasonal message). Harvesting with full inventory (drop items or warn). Water overflow (cap at max, extra water wasted). Multiple crops maturing at once (batch notifications). Player offline for days (crops advance to maximum possible stage when they return — they don't regress or die unless you want a hardcore mode).
ANTI-EXPLOIT: Growth timers are server-authoritative (calculated from timestamps, not client timers). Validate plotIndex in range. Validate cropId exists and season matches. Rate-limit watering (max 1 per plot per 5 seconds). Don't let client send harvestTime.
CONNECTIONS: Inventory for seeds and harvested items. Cooking system uses harvested ingredients. Shop sells seeds. Currency from selling crops. Season system (day/night cycle). XP/leveling for farming skill.

────────────────────────────────────────────────────────────
11. FISHING SYSTEM (cast, wait, bite, reel, fish types, sell)
────────────────────────────────────────────────────────────
DATA: FishDatabase: { [fishId]: { name, rarity, basePrice, minWeight, maxWeight, zones: string[], timeOfDay: "day"|"night"|"all", baitPreference: string|nil, xpGain: number } }. ZoneDatabase: { [zoneId]: { fishTable: { fishId: weight }[], difficulty: number } }. Per-player: { fishingRod: rodId, bait: { baitId: quantity }, fishingSkill: { level, xp }, fishCaught: { [fishId]: count } }.
REMOTES: CastLine (RemoteEvent — direction), ReelIn (RemoteEvent — timing data), FishBite (RemoteEvent — server→client notification), CatchResult (RemoteEvent — server→client fish data), GetFishingData (RemoteFunction).
SERVER: Cast: validate player near water, has rod equipped, has bait. Start bite timer: random 3-15 seconds (modified by bait type and fishing skill). On bite: notify client, start 3-second window for reel. Reel minigame (server-side): generate target timing, client sends their timing, server calculates accuracy. Catch chance: base 60% + (skill * 2%) + (bait bonus) - (fish difficulty). On catch: roll fish from zone table, roll weight in range, add to inventory, grant XP. Weight affects sell price: price = basePrice * (weight / avgWeight).
CLIENT: Casting animation: rod swings, line flies out, bobber lands in water. Waiting phase: bobber bobs gently, ambient sounds. Bite notification: bobber dunks, exclamation mark, sound cue. Reel minigame: timing bar or button mash (varies by rod type). Catch display: fish model with name, weight, rarity, and "New!" if first catch. Collection book showing all fish with silhouettes for uncaught.
EDGE CASES: Casting on land (reject — raycast to check water surface). Player moves during fishing (cancel cast). Fish bite while inventory full (catch still possible but auto-sell). Rod breaks at durability 0 (if durability system exists). Multiple players fishing same spot (independent rolls, not shared pool). AFK fishing (add CAPTCHA-style challenge after 5 consecutive casts without movement).
ANTI-EXPLOIT: Bite timing is server-controlled (client can't force instant bite). Reel timing validated server-side (client sends input, server judges). Fish selection is server-side RNG. Validate player is actually near water (position check + raycast). Rate-limit cast (one active cast at a time, minimum 2 second gap). Detect auto-fishing scripts (reaction time analysis — human reaction is 200-500ms, bot is <50ms).
CONNECTIONS: Inventory for fish storage. Currency from selling fish. Cooking system uses fish as ingredients. Achievements for collection. Leaderboard for biggest fish.

────────────────────────────────────────────────────────────
12. MINING SYSTEM (ores, tools, tiers, smelting, sell)
────────────────────────────────────────────────────────────
DATA: OreDatabase: { [oreId]: { name, tier, health: number (hits to break), dropItems: {itemId, qty, chance}[], respawnTime: number, toolReq: number (min pickaxe tier), xpGain: number } }. ToolDatabase: { [pickaxeId]: { name, tier, damage: number, speed: number, range: number, price: number } }. SmeltingRecipes: { [inputOreId]: { outputIngotId: string, smeltTime: number, fuelCost: number } }. Per-player: { miningSkill: { level, xp }, equippedPickaxe: pickaxeId, oreInventory: { [oreId]: count } }.
REMOTES: SwingPickaxe (RemoteEvent — target ore instance), SmeltOre (RemoteEvent — oreId, quantity), SellIngots (RemoteEvent — ingotId, quantity), GetMiningData (RemoteFunction), OreRespawned (RemoteEvent — server→client).
SERVER: Mining: validate player near ore (within pickaxe range + 2 studs), pickaxe tier >= ore tier, not on cooldown. Decrement ore health by pickaxe damage. At 0 health: roll drops (each has independent chance), add to inventory, grant XP, start respawn timer. Ore respawn: after timer, restore ore model + health. Shared ores: all players can mine same ore, first to deplete gets drops (or shared drops for each swing). Smelting: validate has ores and fuel, start timer, produce ingots on completion.
CLIENT: Mining animation: pickaxe swing with hit VFX (rock particles, screen shake). Ore visual feedback: cracks appear at 75%, 50%, 25% health. Health bar above ore. Respawn effect: glow and grow animation. Smelting furnace UI: input slot, fuel slot, output slot, progress bar. Mine area lighting (dark tunnels with torch glow).
EDGE CASES: Two players deplete ore on same frame (first processed wins, second gets "already depleted" message). Player disconnects mid-smelt (complete smelt on rejoin if time elapsed). Ore node inside terrain after terrain update (position validation on spawn). Tool breaks during mining (if durability exists). Inventory full from ore drops (notify, don't lose drops — queue them).
ANTI-EXPLOIT: Server validates proximity to ore on every swing. Server tracks ore health (client shows visual but server is authoritative). Rate-limit swings to pickaxe speed (can't swing faster than tool allows). Validate target is actually an ore node (not another player's part). Prevent mining from impossible angles (inside walls).
CONNECTIONS: Inventory for ores and ingots. Currency from selling. Crafting system uses ingots. Shop sells pickaxes. Equipment system for tool equipping.

────────────────────────────────────────────────────────────
13. COOKING SYSTEM (recipes, ingredients, buffs, skill level)
────────────────────────────────────────────────────────────
DATA: RecipeDatabase: { [recipeId]: { name, ingredients: {itemId, qty}[], output: {itemId, qty}, cookTime: number, skillReq: number, buff: {stat, amount, duration}|nil, xpGain: number } }. CookedFoodItems extend ItemDatabase with: { consumable: true, buff: {stat, amount, duration}, hungerRestore: number }. Per-player: { cookingSkill: { level, xp }, knownRecipes: recipeId[], hunger: number (0-100) }.
REMOTES: CookRecipe (RemoteEvent — recipeId), EatFood (RemoteEvent — itemId), DiscoverRecipe (RemoteEvent), GetCookingData (RemoteFunction), CookingComplete (RemoteEvent — server→client).
SERVER: Cooking: validate near cooking station, has ingredients, knows recipe, meets skill level. Remove ingredients, start cook timer. On complete: add cooked item, grant XP. Eating: validate item in inventory, is consumable. Remove item, apply buff (modify player stats for duration using task.delay to remove), restore hunger. Skill benefits: higher skill = faster cooking, chance for "perfect" dish (double buff duration), unlock new recipes.
CLIENT: Cooking station UI: recipe list on left (filtered by known/have ingredients), ingredient display, cook button with timer. Eating: use from inventory, eating animation, buff icon appears in HUD with countdown timer. Active buffs bar at top of screen. Recipe discovery: drag ingredients to experimentation pot.
EDGE CASES: Buff stacking (same buff refreshes duration, different buffs stack). Eating while at full hunger (allow for buff but no hunger restore). Cooking during combat (allow if near station, or block in combat zones). Player logs out with active buff (save remaining duration, restore on rejoin). Perfect dish RNG on disconnect (resolve on server, deliver result on rejoin).
ANTI-EXPLOIT: Cook timer is server-side. Buff application is server-side. Validate food item exists and is consumable before eating. Rate-limit eating (max 1 per second). Don't let client send buff values. Validate proximity to cooking station.
CONNECTIONS: Farming for raw ingredients. Fishing for fish ingredients. Inventory for storage. Status effects system for buff application. Health system for hunger.

────────────────────────────────────────────────────────────
14. COMBAT — MELEE (swing, hitbox, combo, parry, stamina)
────────────────────────────────────────────────────────────
DATA: WeaponDatabase: { [weaponId]: { name, type: "sword"|"axe"|"spear"|"fist", baseDamage: N, swingSpeed: N, range: N, comboChain: N (2-5 hits), staminaCost: N, knockback: N } }. Per-player combat state (server memory, NOT DataStore): { stamina: N, maxStamina: N, staminaRegen: N/sec, comboCounter: N, lastSwingTime: N, isBlocking: bool, isStunned: bool, invincibilityFrames: bool }.
REMOTES: SwingWeapon (RemoteEvent — direction), Block (RemoteEvent — start/stop), Dodge (RemoteEvent — direction), HitConfirm (RemoteEvent — server→client hit feedback), CombatState (RemoteEvent — server→client state updates).
SERVER: Swing: validate not stunned, not on cooldown (lastSwingTime + swingSpeed), has stamina. Create server-side hitbox: use GetPartBoundsInBox or Raycast (NOT touched events — too unreliable). Hitbox positioned at weapon tip, size based on weapon range. Check all characters in hitbox, apply damage considering defense. Combo: track consecutive hits within 1.5x swing speed window. Each combo hit deals escalating damage (100%, 110%, 125%, 150% for 4-hit combo). Final combo hit has bonus knockback/stun. Parry: if defender starts blocking within 0.3 seconds of being hit, attacker is stunned for 0.5 seconds and takes no damage. Stamina: each swing costs stamina, blocking costs stamina on hit received, dodging costs stamina. Regen when not in combat for 3 seconds.
CLIENT: Swing animation plays immediately on input (client prediction). Hit VFX: slash trail, impact particles, screen shake (attacker and defender). Block animation: weapon raised, shield glow. Parry flash (gold/white burst). Dodge: quick dash with invincibility frames (0.3 seconds). Combo counter display. Stamina bar below health bar.
EDGE CASES: Hitting multiple targets in one swing (damage each independently). Swing connecting after target dies (skip). Combo reset on miss (reset counter). Block during combo (cancel combo). Two players parrying each other simultaneously (both stunned). Stamina at 0 (can't attack, forced slow walk, vulnerability state).
ANTI-EXPLOIT: Server creates hitbox — client NEVER reports hits. Validate swing timing against weapon speed. Validate stamina is sufficient. Server tracks all combat states. Client-sent dodge direction validated against player facing. Damage calculations entirely server-side. Rate-limit swing requests to weapon speed + 10% tolerance.
CONNECTIONS: Equipment system for weapon stats. Health system for damage/death. Status effects for stun/knockback. XP system for combat experience. Animation system for attack/block/dodge animations.

────────────────────────────────────────────────────────────
15. COMBAT — RANGED (projectile, ammo, reload, accuracy, drop)
────────────────────────────────────────────────────────────
DATA: RangedWeaponDatabase: { [weaponId]: { name, type: "bow"|"gun"|"crossbow"|"staff", baseDamage, fireRate (shots/sec), magazineSize, reloadTime, projectileSpeed, bulletDrop (studs/sec gravity), spread (degrees), ammoType, range, headshotMultiplier } }. Per-player: { equippedRanged: weaponId, ammo: { [ammoType]: count }, currentMag: number, isReloading: bool }.
REMOTES: Shoot (RemoteEvent — origin, direction), Reload (RemoteEvent), ShotResult (RemoteEvent — server→client hit/miss), AmmoUpdate (RemoteEvent — server→client).
SERVER: Shoot: validate not reloading, has ammo in magazine, not on fire-rate cooldown. Decrement magazine. Server performs raycast from player's camera position in sent direction (with validation — direction must roughly match player facing). Apply spread: random offset within spread angle. Apply bullet drop for long range (gravity on projectile path). If hit: calculate distance, apply damage falloff (100% at 0-50%, 75% at 50-80%, 50% at 80-100% of range). Headshot detection: check if hit part is Head. Reload: start timer, on complete refill magazine (deduct from ammo reserve).
CLIENT: Shoot: muzzle flash, sound, recoil animation (camera kick up, weapon kick back). Projectile tracer visible to all players. Hit marker (crosshair flash) on confirmed hit. Kill feed for eliminations. Reload animation with sound. Ammo counter in HUD (magazine/reserve). Crosshair expands during movement, shrinks when standing still. ADS (aim down sights): reduced FOV, reduced spread, slower movement.
EDGE CASES: Shooting through thin walls (raycast should use filtered raycast with ignore list). Player moves behind cover after shot fired (server uses shooter's position at time of shot — favor the shooter). Magazine empty but player mashes shoot (play "click" sound, auto-reload). Switching weapons during reload (cancel reload). Headshot on unanchored parts (only count Head part of Humanoid characters).
ANTI-EXPLOIT: Server raycasts — not client. Validate origin matches player position (within 5 studs tolerance for latency). Validate direction is normalized. Rate-limit shots to fire rate. Check ammo count server-side. Maximum range check. Reject shots from impossible positions (inside walls). Validate reload isn't faster than weapon allows.
CONNECTIONS: Equipment for weapon selection. Inventory for ammo. Health system for damage dealing. Combat system for damage calculation. Animation system for shoot/reload.

────────────────────────────────────────────────────────────
16. COMBAT — MAGIC (spells, mana, cooldowns, AoE, channeling)
────────────────────────────────────────────────────────────
DATA: SpellDatabase: { [spellId]: { name, element: "fire"|"ice"|"lightning"|"earth"|"dark"|"light"|"arcane", manaCost, cooldown, castTime (0 for instant), damage, range, aoeRadius (0 for single target), duration (for DoT/HoT), statusEffect: statusId|nil, projectileSpeed (0 for instant hit), levelReq, classReq } }. Per-player: { mana: N, maxMana: N, manaRegen: N/sec, knownSpells: spellId[], spellCooldowns: { [spellId]: timestamp }, isCasting: bool, castTarget: spellId|nil }.
REMOTES: CastSpell (RemoteEvent — spellId, targetPosition|targetPlayerId), CancelCast (RemoteEvent), SpellEffect (RemoteEvent — server→all clients in range for VFX), ManaUpdate (RemoteEvent — server→caster).
SERVER: Cast: validate spell known, mana sufficient, off cooldown, not already casting, target in range. Instant spells: apply immediately. Channeled spells: start cast timer, player can't move (or moves at 50% speed), interrupted if hit with stun. On cast complete: deduct mana, set cooldown, apply effect. AoE: get all characters within radius of target position, apply damage/effect to each. Damage calculation: baseDamage * elementMultiplier * (1 + magicPower/100). Element matchups: fire > ice > lightning > earth > fire (2x damage on weakness, 0.5x on resistance).
CLIENT: Cast animation based on element (fire = hands glow orange, ice = frost particles). Projectile spells: visible projectile with element-specific trail. AoE indicator: circle on ground showing blast radius before cast completes. Hit effects per element: fire = flames, ice = frozen overlay, lightning = electrical arcs, earth = rock eruption. Mana bar below health (blue by default). Spell bar at bottom: 1-8 keybinds with icons, cooldown overlay (grey sweep), mana cost shown.
EDGE CASES: Target moves out of range during cast (complete cast at target's new position if within 2x range, else fizzle). Self-targeting healing spells (valid target = self). AoE hitting allies (configurable friendly fire). Mana regen during cast (pause regen while casting). Cooldown reset on failed cast (refund cooldown but not mana). Chain spells (e.g., lightning bouncing to 3 targets — each bounce reduces damage 20%).
ANTI-EXPLOIT: Server validates all spell effects. Client NEVER applies damage. Validate mana server-side. Cooldown tracking server-side only. Validate target position is within line of sight (raycast check). Validate spell is known and level requirement met. Rate-limit cast attempts.
CONNECTIONS: Status effects for debuffs. Health system for damage/healing. XP for spell mastery. Class system for spell access. Skill tree for spell upgrades.

────────────────────────────────────────────────────────────
17. HEALTH/DAMAGE SYSTEM (HP, defense, resistance, healing, death)
────────────────────────────────────────────────────────────
DATA: Per-player combat stats (computed from base + equipment + buffs): { health: N, maxHealth: N, defense: N, resistance: { fire: N, ice: N, lightning: N, poison: N }, healthRegen: N/sec, isAlive: bool, lastDamageTime: N, lastDamageSource: playerId|npcId }. Base stats per level: maxHealth = 100 + (level * 10), defense = 5 + (level * 2).
REMOTES: HealthChanged (RemoteEvent — server→client, newHealth, maxHealth, damageType), PlayerDied (RemoteEvent — server→client, killerInfo), Respawn (RemoteEvent — client→server request), HealPlayer (RemoteEvent — server→client visual only).
SERVER: Damage pipeline: rawDamage → apply defense (damage * (100 / (100 + defense))) → apply resistance (reduce by resistance% for matching element) → apply buffs (damage reduction buffs) → apply minimum (at least 1 damage) → subtract from health. Healing: add to health, cap at maxHealth. Health regen: passive regen when out of combat for 5 seconds (no damage received). Death: health <= 0, set isAlive = false, fire PlayerDied with killer attribution, disable character. Respawn: wait for respawn timer + player input, reset health to max, teleport to spawn.
CLIENT: Health bar: main bar (red/green), smooth tween on change, delayed ghost bar (white bar that catches up slowly to show recent damage). Floating damage numbers at hit location (color-coded: red=damage, green=heal, orange=fire, blue=ice). Death screen: grayscale post-processing, "You died" text, killer info, respawn countdown. Low health effects: red vignette, heartbeat sound, slightly desaturated screen.
EDGE CASES: Overkill damage (clamp to remaining health for kill attribution). Simultaneous lethal damage from two sources (first processed gets kill credit). Healing a dead player (reject). Damage during invincibility frames (reject). Overflow healing (cap at max, don't waste healer's resources). Negative defense from debuffs (amplifies damage). Respawning during boss fight (spawn outside arena, not inside).
ANTI-EXPLOIT: ALL damage goes through server pipeline. Client never modifies health. Validate damage source (is the supposed attacker actually in range and attacking?). Health value never sent from client to server. Validate respawn request (must actually be dead, must have waited respawn timer). Detect health discrepancies (flag if client reports different health than server tracks).
CONNECTIONS: Combat systems deal damage. Equipment provides defense. Buffs/debuffs modify stats. Respawn system handles revival. XP system awards kill XP. Leaderboard tracks kills/deaths.

────────────────────────────────────────────────────────────
18. STATUS EFFECTS (burn, freeze, poison, stun, buff, debuff)
────────────────────────────────────────────────────────────
DATA: StatusEffectDatabase: { [effectId]: { name, type: "buff"|"debuff", category: "dot"|"cc"|"stat_mod"|"utility", statChanges: { [stat]: number }, damagePerTick: N, tickInterval: N, duration: N, maxStacks: N, icon: string, particleEffect: string, immuneAfter: bool (prevent reapplication for X seconds) } }. Per-player: { activeEffects: { [effectId]: { stacks: N, remainingDuration: N, sourceId: playerId|npcId, appliedAt: N } } }.
REMOTES: EffectApplied (RemoteEvent — server→client, effectId, duration), EffectRemoved (RemoteEvent — server→client, effectId), EffectTick (RemoteEvent — server→client, effectId, damage/heal for VFX).
SERVER: Apply effect: check immunity, check max stacks (if already active, add stack or refresh duration based on effect config). Process effects every tick interval: DoT effects deal damage through health system. Stat modification effects: recalculate player stats including all active effects. CC effects: stun = disable movement/actions, freeze = disable movement but allow actions, slow = reduce walkspeed, silence = disable abilities. Remove effect when duration expires. Cleanse mechanic: certain abilities remove debuffs (remove all debuffs, or remove specific category).
CLIENT: Effect icons in HUD bar with stack count and duration countdown. Visual overlays: burn = fire particles on character, freeze = ice overlay + slow animation speed, poison = green tint + drip particles, stun = stars circling head. Sound cues on application and removal. Screen effects: burn = orange edges, freeze = frost on screen corners, poison = green vignette.
EDGE CASES: Same effect from different sources (stack or refresh based on config). Cleansing during tick (remove before tick damage). Death clears all effects. Effect that outlasts combat (persist or remove based on type). Effect on invincible target (block application). Effect that modifies max health (current health ratio preserved). Two opposing effects (fire + freeze = cancel both, or last applied wins).
ANTI-EXPLOIT: Effects applied and processed entirely server-side. Client receives notifications for visual only. Duration tracked server-side. Stat modifications applied server-side. Validate cleanse abilities are actually available to player.
CONNECTIONS: Combat systems apply effects. Health system processes DoT. Equipment provides resistance. Potion system cleanses effects. Cooking buffs are status effects. Boss mechanics apply unique effects.

────────────────────────────────────────────────────────────
19. XP/LEVELING SYSTEM (formula, curve, stat allocation)
────────────────────────────────────────────────────────────
DATA: Per-player: { level: N, currentXP: N, totalXP: N, statPoints: N (unspent), allocatedStats: { strength: N, intelligence: N, agility: N, vitality: N, luck: N } }. XP formula: xpForLevel = math.floor(100 * level^1.5) — Level 1 = 100 XP, Level 10 = 3,162 XP, Level 50 = 35,355 XP, Level 100 = 100,000 XP. Stat point gain: 3 per level. Max level: configurable (50, 100, or 200 typical).
REMOTES: GainXP (RemoteEvent — server→client, amount, source), LevelUp (RemoteEvent — server→client, newLevel, statPoints), AllocateStat (RemoteEvent — client→server, stat, points), GetPlayerStats (RemoteFunction).
SERVER: XP gain: add to currentXP, check if >= xpForNextLevel, if so: level up (increment level, reset currentXP to overflow, add stat points, recalculate base stats). Can chain multiple level-ups in one gain. Stat allocation: validate unspent points available, validate stat name, increment stat, apply to player. Stat effects: strength = melee damage, intelligence = magic power + mana, agility = speed + crit chance, vitality = max health + health regen, luck = drop rates + crit damage.
CLIENT: XP bar at top or bottom of screen, fills smoothly on gain. Level-up fanfare: burst of particles, level number pops up large, sound effect, chat message. Stat allocation UI: 5 stat columns with + buttons, preview of stat effects, confirm button. Stat breakdown tooltip showing base + equipment + buffs. XP gain floating text at gain source location.
EDGE CASES: XP gain that crosses multiple levels (loop through all level-ups). Stat respec (reset all points, refund — usually costs currency). Level cap reached (still track XP for prestige or just stop). Negative XP (never — clamp to 0). Very large XP gains (validate source, cap single-source gains). XP sharing in parties (divide evenly or by contribution).
ANTI-EXPLOIT: XP awards are server-authoritative ONLY. Validate XP sources (kill credit, quest completion, etc.). Rate-limit XP gain (flag if gaining faster than theoretically possible). Stat allocation validated server-side. Can't allocate more points than available. Log stat changes for rollback. Never let client send XP amount.
CONNECTIONS: Combat grants XP. Quests grant XP. Crafting/mining/fishing grant skill XP. Stats affect combat/equipment/abilities. Battle pass progression uses XP. Leaderboard shows levels.

────────────────────────────────────────────────────────────
20. SKILL TREE (branches, prerequisites, point cost, respec)
────────────────────────────────────────────────────────────
DATA: SkillTreeDatabase: { [treeId]: { name, branches: { [branchId]: { name, skills: { [skillId]: { name, description, icon, tier (0-5), pointCost (1-5), prereqs: skillId[], effects: { type, value }, maxRank (1-3) } } } } } }. Per-player: { unlockedSkills: { [skillId]: rank }, skillPoints: N, respecCount: N }. Trees per class: Warrior (Offense, Defense, Utility), Mage (Fire, Ice, Arcane), Archer (Marksmanship, Traps, Survival).
REMOTES: UnlockSkill (RemoteEvent — skillId), GetSkillTree (RemoteFunction), RespecTree (RemoteEvent), SkillUnlocked (RemoteEvent — server→client).
SERVER: Unlock: validate skill exists, player has enough points, prerequisites met (all prereq skills at max rank or minimum rank), correct class. Deduct points, add skill to unlocked list, apply effects. Effect types: passive_stat_boost, ability_unlock, ability_upgrade, passive_proc_chance, resource_modifier. Respec: refund all points, remove all skills, clear effects, charge currency (escalating cost per respec: 100, 500, 2000, 10000).
CLIENT: Visual skill tree: connected nodes with lines, unlocked = lit up (gold), available = outlined, locked = grayed out. Click node to see details panel (description, cost, effects, prereqs). Unlock button if affordable. Branch tabs at top. Hovering a locked skill highlights missing prereqs in red. Zoom in/out for large trees. Rank indicator (pips under skill icon).
EDGE CASES: Unlocking skill that enables an ability mid-combat (add ability immediately). Respec during active buff from skill (remove buff). Skill that modifies other skills (recalculate on any skill change). Different trees for different classes (validate class before showing tree). Re-entering tree after respec (all nodes reset to locked state).
ANTI-EXPLOIT: Server validates all prerequisite chains. Points deducted server-side. Effects applied server-side. Can't unlock skills from wrong class tree. Rate-limit unlock requests. Validate respec currency payment.
CONNECTIONS: Class system determines which trees are available. XP/leveling provides skill points. Combat stats modified by passive skills. Abilities unlocked by active skills. Currency for respec.

────────────────────────────────────────────────────────────
21. CLASS/ROLE SYSTEM (warrior, mage, archer — unique abilities)
────────────────────────────────────────────────────────────
DATA: ClassDatabase: { [classId]: { name, description, baseStats: {str, int, agi, vit, lck}, statGrowth: {str, int, agi, vit, lck} (per level), startingAbilities: abilityId[], startingEquipment: itemId[], classSkillTree: treeId, passiveBonus: string } }. Per-player: { class: classId, subclass: classId|nil (unlocked at level 30) }. Typical classes: Warrior (high HP, melee), Mage (high mana, spells), Archer (high agility, ranged), Healer (support, buffs), Assassin (high crit, stealth). Subclasses: Warrior → Berserker or Paladin, Mage → Pyromancer or Frost Mage, etc.
REMOTES: SelectClass (RemoteEvent — classId, during character creation), ChangeClass (RemoteEvent — classId, costs currency), SelectSubclass (RemoteEvent — subclassId), GetClassInfo (RemoteFunction).
SERVER: Class selection at character creation: set class, apply base stats, grant starting abilities and equipment, unlock class skill tree. Class change: validate level >= 10, charge currency, reset stat allocation, clear skill tree (refund points), apply new class. Subclass at level 30: permanent choice (or expensive to change), grants additional abilities and passive effects. Stat growth: on level up, add class-specific growth values to base stats.
CLIENT: Class selection screen: character silhouettes with class names, descriptions, stat radar charts, ability previews. In-game: class icon next to nameplate. Class-specific UI elements (mana bar for mages, stamina for warriors, combo points for assassins). Subclass selection: dramatic choice screen with side-by-side comparison.
EDGE CASES: Changing class with class-specific equipment equipped (unequip, return to inventory). Changing class with class-locked items in inventory (items remain but unusable). Selecting subclass during combat (block). Class balance patches (change database, existing players keep current stats until next level-up applies new growth).
ANTI-EXPLOIT: Class selection validated server-side. Stat growth applied server-side. Can't use abilities from wrong class. Equipment class restrictions enforced server-side. Class change cost validated.
CONNECTIONS: Skill tree per class. Equipment system for class-restricted gear. Combat abilities defined per class. Stat system base values from class. Party system benefits from class diversity.

────────────────────────────────────────────────────────────
22. QUEST SYSTEM (accept, track, objectives, complete, chain quests)
────────────────────────────────────────────────────────────
DATA: QuestDatabase: { [questId]: { name, description, giver: npcId, objectives: { type: "kill"|"collect"|"visit"|"interact"|"talk"|"craft"|"deliver", target, amount, description }[], rewards: { xp, currency: {type, amount}[], items: {itemId, qty}[] }, prereqQuests: questId[], prereqLevel: N, repeatable: bool, cooldown: N, chainNext: questId|nil, timeLimit: N|nil } }. Per-player: { activeQuests: { [questId]: { objectives: {current, required}[], startTime } }, completedQuests: questId[], dailyQuestResets: N }.
REMOTES: AcceptQuest (RemoteEvent — questId), AbandonQuest (RemoteEvent — questId), QuestProgress (RemoteEvent — server→client, questId, objectiveIndex, progress), QuestComplete (RemoteEvent — server→client, questId, rewards), GetQuests (RemoteFunction).
SERVER: Accept: validate NPC proximity, prerequisites met, not already active, not completed (unless repeatable). Track objectives: listen for relevant events (player kills enemy → check kill quests, player picks up item → check collect quests). Update progress atomically. Auto-complete when all objectives met (or require return to NPC). On complete: grant rewards, add to completedQuests, check if chainNext exists → auto-offer. Kill tracking: use tags (CollectionService) on NPCs. Collect tracking: monitor inventory changes. Visit tracking: Region3 or TouchPart triggers.
CLIENT: Quest tracker on right side of screen: active quests with checkable objectives. Quest log: full list with descriptions, rewards preview, progress. NPC quest indicators: "!" for available quest (yellow), "?" for ready to turn in (green), gray "!" for not yet available. Quest accept dialog: NPC portrait, story text, rewards list, Accept/Decline buttons. Completion: reward popup with items/XP/currency display. Chain quest: smooth transition to next quest dialog.
EDGE CASES: Killing enemy that counts for multiple quests (update all). Collecting quest item then dropping it (track actual inventory, not pickups). Quest NPC destroyed or moved (allow turn-in at any NPC of same type, or quest board). Time-limited quest expires (auto-abandon, return collected quest items). Disconnect during turn-in (save progress, complete on rejoin if conditions still met). Quest requires party (validate all members present).
ANTI-EXPLOIT: Objective progress tracked server-side ONLY. Validate kill credit (player must have dealt damage). Validate collection (item actually in inventory). Validate visit (player position near target). Rate-limit quest accept/abandon to prevent farming exploit with quest reward→abandon→re-accept loop. Cooldown on repeatable quests.
CONNECTIONS: NPC dialog system for quest givers. Combat for kill objectives. Inventory for collect objectives. Currency/XP for rewards. Achievement system for quest milestones. Daily rewards ties into daily quests.

────────────────────────────────────────────────────────────
23. ACHIEVEMENT SYSTEM (categories, progress, rewards, badges)
────────────────────────────────────────────────────────────
DATA: AchievementDatabase: { [achievementId]: { name, description, category: "combat"|"exploration"|"social"|"collection"|"progression", tiers: { requirement: N, reward: {xp, currency, item, badge} }[], trackingStat: string, icon: string, hidden: bool } }. Per-player: { achievements: { [achievementId]: { progress: N, currentTier: N, claimed: bool[] } }, totalAchievementPoints: N }.
REMOTES: AchievementUnlocked (RemoteEvent — server→client, achievementId, tier), ClaimReward (RemoteEvent — achievementId, tier), GetAchievements (RemoteFunction).
SERVER: Achievement tracking: hook into game events (kills, items collected, levels gained, quests completed, etc.). On event: update relevant achievement progress. Check if progress >= next tier requirement. If so: fire AchievementUnlocked, award automatic rewards (XP always), mark tier as claimable for item/currency rewards. Tiered achievements: "Kill Enemies" → Tier 1: 10 kills, Tier 2: 100 kills, Tier 3: 1000 kills. Achievement points: each tier grants points, total visible on profile.
CLIENT: Achievement notification: toast popup with icon, name, tier. Achievement menu: categories as tabs, each achievement shows progress bar, tiers with checkmarks, claim buttons for unclaimed rewards. Hidden achievements show "???" until first tier unlocked. Points total displayed on profile. Badge display on player nameplate (selected achievement badge).
EDGE CASES: Progress tracking across sessions (save to DataStore). Retroactive achievements on system update (recalculate on first login). Claiming reward with full inventory (queue item or grant currency equivalent). Achievement for thing that no longer exists in game (retire achievement, keep earned progress). Multiple tiers unlocking at once (process all, stack notifications).
ANTI-EXPLOIT: Progress tracked server-side. Claim validation server-side (must actually have reached tier). Can't claim same tier twice. Rate-limit claims.
CONNECTIONS: All game systems feed achievement progress. Badge system displays earned badges. Social system shares achievements. Leaderboard for achievement points.

────────────────────────────────────────────────────────────
24. DAILY REWARDS (streak, escalating rewards, reset)
────────────────────────────────────────────────────────────
DATA: DailyRewardTable: { [day]: { rewards: {type, amount, itemId?}[], isBonus: bool } } — typically 7 or 30 day cycle. Per-player: { lastClaimDate: string (YYYY-MM-DD), currentStreak: N, totalDaysClaimed: N, currentCycleDay: N }.
REMOTES: ClaimDailyReward (RemoteEvent), GetDailyRewardStatus (RemoteFunction — returns claimable, streak, rewards), DailyRewardClaimed (RemoteEvent — server→client, rewards).
SERVER: On claim: check if lastClaimDate is today → reject (already claimed). Check if lastClaimDate is yesterday → increment streak. Check if lastClaimDate is older → reset streak to 1. Grant rewards for current cycle day. Update lastClaimDate to today (use os.date in UTC). Cycle: day wraps around (day 8 → back to day 1, or continues to day 30 then resets). Streak bonuses: every 7-day streak grants bonus multiplier on that day's reward.
CLIENT: Daily reward UI on login: calendar/grid showing 7 or 30 days, current day highlighted, previous days checked, future days dimmed. Claim button with animation (chest opening, coin shower). Streak counter with fire effect. Missed day = broken streak visual. Timer showing time until next claim available.
EDGE CASES: Timezone handling (use UTC consistently). Player logs in at 11:59 PM and 12:01 AM (two claims, two different days — correct behavior). Claim during server shutdown (save immediately, not deferred). Date rollback attack (server tracks claims, not client). Multiple joins in same day (only first claim counts).
ANTI-EXPLOIT: Date calculated server-side using os.time()/os.date(). Client can't send claim time. Validate not already claimed today. Store claim history (last 7 dates) to prevent manipulation. Rate-limit claim attempts.
CONNECTIONS: Currency system for coin rewards. Inventory for item rewards. Achievement system for streak milestones. Notification system to remind players.

────────────────────────────────────────────────────────────
25. BATTLE PASS / SEASON PASS (tiers, XP, free vs premium)
────────────────────────────────────────────────────────────
DATA: SeasonConfig: { seasonId, name, startDate, endDate, maxTier: 100, xpPerTier: 1000 (escalating: tier * 1000), tiers: { [tierNum]: { freeReward: reward|nil, premiumReward: reward|nil } } }. Per-player: { currentSeason: seasonId, seasonXP: N, currentTier: N, isPremium: bool, claimedFreeTiers: N[], claimedPremiumTiers: N[] }.
REMOTES: GetBattlePass (RemoteFunction), ClaimTier (RemoteEvent — tier, track: "free"|"premium"), BuyPremium (RemoteEvent), BattlePassXP (RemoteEvent — server→client, xpGained, newTotal).
SERVER: XP sources: daily quests (large XP), weekly challenges (very large XP), playing (small passive XP). On XP gain: add to seasonXP, calculate tier = floor(totalXP / xpPerTier). Season end: lock claims, prepare next season. Premium: purchased with Robux/premium currency, retroactively unlocks all premium rewards up to current tier. Tier claiming: validate tier reached, track (free = always available, premium = only if isPremium), grant reward. XP curve: early tiers fast (500 XP), later tiers slow (2000 XP) — keeps casual players progressing while rewarding dedicated players.
CLIENT: Battle pass UI: horizontal tier track showing both free and premium rows. Scroll through tiers. Current tier highlighted with glow. Claim buttons on reached tiers. Premium locked with padlock icon (and "Buy Premium" button). Daily/weekly challenge list with progress. Season timer (days remaining). XP bar for current tier progress.
EDGE CASES: Season ends while player is offline (save unclaimed rewards, allow claim for 7 day grace period). Buying premium at tier 80 (retroactively unlock all 80 premium rewards). XP gained at max tier (wasted, or convert to currency). Season ID mismatch on old save data (migrate to current season). Multiple seasons active simultaneously (holiday event pass + regular pass).
ANTI-EXPLOIT: XP tracked server-side. Premium status tracked server-side. Validate purchase with Roblox's MarketplaceService. Can't claim tiers not yet reached. Can't claim premium rewards without premium status. Season dates server-authoritative (no client clock manipulation).
CONNECTIONS: Quest system for challenge objectives. Currency for premium purchase. Inventory for item rewards. Achievement system for pass milestones.

────────────────────────────────────────────────────────────
26. LEADERBOARD SYSTEM (daily, weekly, all-time, friends)
────────────────────────────────────────────────────────────
DATA: Use OrderedDataStore for each leaderboard: "Leaderboard_AllTime_Kills", "Leaderboard_Weekly_Kills", "Leaderboard_Daily_Coins". Key = tostring(userId), value = score. Per-player in regular DataStore: { leaderboardStats: { totalKills, totalCoins, highestLevel, bestTime, etc. } }. Reset schedules: daily = midnight UTC, weekly = Monday midnight UTC.
REMOTES: GetLeaderboard (RemoteFunction — category, timeframe, page), GetPlayerRank (RemoteFunction — category, timeframe), LeaderboardUpdated (RemoteEvent — server→client periodic refresh).
SERVER: Score update: on relevant event (kill, coin earn, etc.), update player's stat, then call OrderedDataStore:SetAsync(userId, newScore). Batch updates: don't write to OrderedDataStore on EVERY change — batch updates every 30-60 seconds per player. Fetch: GetSortedAsync(false, pageSize, minValue, maxValue) — returns sorted descending. Daily/weekly reset: cron job (scheduled script or external trigger) that creates new DataStore key with date prefix ("Daily_2026_04_27") rather than clearing old one.
CLIENT: Leaderboard UI: tabs for time period (Daily, Weekly, All-Time, Friends). Table showing rank, player name, avatar, score. Your rank highlighted (even if not on visible page). Category selector (Kills, Coins, Level, etc.). Top 3 have special styling (gold, silver, bronze). Refresh button with cooldown. Friends tab: filter to only show friends.
EDGE CASES: OrderedDataStore rate limits (60 req/min for sorted reads, 60 for writes — batch aggressively). Player not on leaderboard yet (show "Unranked"). Ties (same score = same rank). Very large leaderboards (only show top 100, player's neighborhood of 5 above/below). Cross-server leaderboard consistency (OrderedDataStore handles this naturally). Data corruption (validate scores before writing — no negatives, no NaN).
ANTI-EXPLOIT: Scores derived from server-tracked stats (never from client). Validate score increases are reasonable (flag jumps of >10x normal rate). Don't expose other players' userId through leaderboard (show display name only). Rate-limit leaderboard fetches (once per 10 seconds per player).
CONNECTIONS: All tracked stats feed into leaderboards. Achievement for reaching top 10. Currency rewards for daily/weekly top performers. Social system for friends leaderboard.

────────────────────────────────────────────────────────────
27. ROUND/MATCH SYSTEM (lobby, countdown, game, results, cleanup)
────────────────────────────────────────────────────────────
DATA: Server state machine: { phase: "intermission"|"countdown"|"active"|"ending"|"cleanup", currentMap: mapId|nil, roundNumber: N, timeRemaining: N, players: { [userId]: { team, alive, kills, deaths, score } }, settings: { intermissionTime: 30, countdownTime: 10, roundTime: 300, minPlayers: 2 } }. MapPool: { [mapId]: { name, spawns: { teamA: CFrame[], teamB: CFrame[] }, mapModel: Folder } }.
REMOTES: RoundState (RemoteEvent — server→all, phase, timeRemaining), PlayerEliminated (RemoteEvent — server→all), RoundResults (RemoteEvent — server→all, rankings), VoteMap (RemoteEvent — client→server, mapId).
SERVER: Phase loop: Intermission (30s, map vote, players join) → Countdown (10s, teleport to spawns, freeze) → Active (5 min game, track kills/deaths/objectives) → Ending (10s, show results) → Cleanup (5s, return to lobby, destroy map) → Intermission. Map selection: random from pool or player vote (top voted wins, tiebreak random). Player management: track who's in round, handle joins mid-round (spectator until next round), handle leaves (remove from tracking). Win conditions: most kills (FFA), last alive (elimination), first to X kills, time-based objectives.
CLIENT: Lobby area with waiting players. Countdown: map name display, teleport loading screen, "3, 2, 1, GO!" overlay. In-game HUD: timer, kill feed, scoreboard (Tab key), minimap. Round end: results screen with rankings, your stats, XP gained. Map vote: 3 map options with images, player vote counts.
EDGE CASES: Not enough players to start (extend intermission, show message). All players leave during round (end round, no winner). Player joins during countdown (add to round). Server crash during round (no recovery — players rejoin fresh). Map fails to load (skip to next map in pool). Last two players on same team in FFA (still compete).
ANTI-EXPLOIT: All game state server-authoritative. Kill tracking server-side. Teleport players server-side (prevent teleport exploits during map load). Freeze during countdown server-side (disable controls). Score tracking server-side.
CONNECTIONS: Team system for team assignment. Combat for kills. XP system for round rewards. Leaderboard for match statistics. Map system for level loading.

────────────────────────────────────────────────────────────
28. TEAM SYSTEM (auto-balance, team spawn, team colors, chat)
────────────────────────────────────────────────────────────
DATA: TeamConfig: { teams: { [teamId]: { name, color: BrickColor, spawnLocations: CFrame[], maxPlayers: N } }, autoBalance: bool, balanceThreshold: N (max player difference between teams) }. Per-player: { team: teamId, teamJoinTime: N }. Use Roblox's built-in Team service + TeamColor on SpawnLocations.
REMOTES: TeamChanged (RemoteEvent — server→client, playerId, teamId), RequestTeamChange (RemoteEvent — client→server, teamId), TeamChat (RemoteEvent — bidirectional).
SERVER: Auto-balance on player join: assign to team with fewest players. On player leave: check balance, prompt latest joiner on larger team to switch (or force-switch on respawn). Team spawning: use team-specific SpawnLocations (set TeamColor property to match). Team chat: filter messages through team channel — only same-team players receive. Team-based damage: check team before applying damage (friendly fire toggle). Score tracking per team (sum of player scores).
CLIENT: Team indicator: player nameplates colored by team. Team HUD: team name, color swatch, team score, teammate list with health bars. Team chat: separate chat channel with team color prefix. Spawn screen: highlight team spawn area. Team selection screen (if manual team selection allowed): team cards with player counts.
EDGE CASES: Odd number of players (one team has +1). Team switch during combat (queue for next respawn). All members of a team leave (that team auto-forfeits or game pauses). Player joining full team (reject, assign to other team). Mid-round team balance (controversial — usually only balance on new round).
ANTI-EXPLOIT: Team assignment validated server-side. Team chat filtered through server. Prevent team-switching abuse (cooldown of 60 seconds). Friendly fire toggle server-controlled.
CONNECTIONS: Round system for team-based modes. Combat for friendly fire checks. Chat for team channels. Spawn for team-specific locations.

────────────────────────────────────────────────────────────
29. SPECTATOR SYSTEM (follow player, free cam, no collision)
────────────────────────────────────────────────────────────
DATA: Per-player spectator state (server memory): { isSpectating: bool, spectateTarget: playerId|nil, spectateMode: "follow"|"freecam", allowedToSpectate: bool (dead or in spectator role) }.
REMOTES: EnterSpectate (RemoteEvent), ExitSpectate (RemoteEvent), CycleTarget (RemoteEvent — direction: "next"|"prev"), SwitchMode (RemoteEvent — "follow"|"freecam"), SpectateUpdate (RemoteEvent — server→client).
SERVER: On enter spectate: validate player is dead or has spectator role. Hide character (set Transparency, disable collision). Assign default target (first alive player). Cycle target: iterate through alive players list. Server tracks who each spectator is watching. On spectated player death: auto-cycle to next alive player. Anti-ghosting: spectators can't interact with game world, fire remotes for combat, or affect physics.
CLIENT: Follow mode: camera attached to target with offset (over shoulder or free orbit). Target info overlay: name, health, kills. Freecam mode: WASD movement, mouse look, shift = speed boost. No collision on spectator character. Keybinds: Left/Right arrow to cycle, M to switch mode, Esc to exit. Spectator UI: "SPECTATING: PlayerName" banner, target list.
EDGE CASES: All players dead (switch to freecam). Target disconnects (auto-cycle). Spectator spam-switching (rate-limit cycle to 0.5s). Freecam going out of bounds (invisible wall boundary). Spectating in non-combat game (after elimination in game show, etc.). Late joiner enters as spectator (if round already active).
ANTI-EXPLOIT: Spectator can't fire combat remotes (server rejects based on isSpectating flag). Spectator position doesn't affect game physics. Spectator can't reveal enemy positions to teammates (delay spectator view by 5 seconds in competitive modes). Hide spectator from game's player list for competitive integrity.
CONNECTIONS: Round/match system triggers spectating on death. Camera system for follow/freecam. Team system for spectate filtering.

────────────────────────────────────────────────────────────
30. RESPAWN SYSTEM (timer, selection, protection, loadout)
────────────────────────────────────────────────────────────
DATA: RespawnConfig: { respawnTime: N (seconds), spawnProtectionDuration: N (seconds), spawnLocations: { [spawnId]: { position: CFrame, type: "default"|"team"|"chosen", teamId: string|nil, unlocked: bool } } }. Per-player: { respawnTimer: N, spawnProtected: bool, selectedSpawn: spawnId|nil, lastDeathPosition: CFrame, loadout: { weapon, ability1, ability2 } }.
REMOTES: RespawnTimer (RemoteEvent — server→client, timeRemaining), SelectSpawn (RemoteEvent — client→server, spawnId), Respawned (RemoteEvent — server→client), SelectLoadout (RemoteEvent — client→server, loadout).
SERVER: On death: start respawn timer (5-15 seconds based on game mode). During timer: player can select spawn point and loadout. On timer complete + player input: teleport to selected spawn (or default), apply loadout, enable spawn protection (invincibility + visual glow for 3 seconds), re-enable character. Spawn protection: damage blocked for duration, removed early if player attacks. Spawn selection: validate spawn is unlocked and appropriate for team.
CLIENT: Death screen: timer countdown, spawn map (minimap with spawn point icons), loadout selection. Spawn preview: camera flies to selected spawn position. Respawn effect: screen fades from black, shield glow around character, "SPAWN PROTECTION" text. Loadout UI: weapon selection, ability selection, cosmetic preview.
EDGE CASES: All spawn points blocked by enemies (force-spawn at safest point). Spawn inside geometry (offset upward until clear space found). Respawn during round end (block respawn, show results). Very fast deaths (minimum 3 second respawn time even in instant-respawn modes). Spawn camping detection (if player dies within 3 seconds of spawning near same enemy, increase that enemy's visibility on minimap).
ANTI-EXPLOIT: Spawn teleport is server-initiated. Spawn protection managed server-side. Can't select invalid spawn points. Respawn timer can't be skipped by client. Position validation after spawn (detect immediate teleport exploitation).
CONNECTIONS: Health system triggers respawn on death. Team system for team spawns. Round system for spawn availability. Loadout system for pre-spawn equipment selection.

────────────────────────────────────────────────────────────
31. NPC DIALOG SYSTEM (trees, choices, conditions, rewards)
────────────────────────────────────────────────────────────
DATA: DialogDatabase: { [dialogId]: { npcId, name, portrait, nodes: { [nodeId]: { text: string, choices: { text, nextNode: nodeId|nil, condition: { type, value }|nil, action: { type, value }|nil }[] } }, startNode: nodeId } }. Conditions: hasItem, hasLevel, hasQuest, completedQuest, hasClass, hasCurrency. Actions: giveItem, giveCurrency, giveXP, startQuest, completeQuest, teleport, openShop.
REMOTES: StartDialog (RemoteEvent — npcId), ChooseOption (RemoteEvent — dialogId, nodeId, choiceIndex), CloseDialog (RemoteEvent), DialogUpdate (RemoteEvent — server→client, nodeId, text, choices).
SERVER: On start: validate player near NPC (within 10 studs), NPC exists, has dialog. Send start node text and available choices (filter by conditions). On choose: validate choice exists and conditions met. Execute action if any. Send next node. On close: clean up dialog state. Condition checking: server evaluates all conditions (never client). Action execution: server applies all rewards/effects.
CLIENT: Dialog UI: NPC portrait on left, dialog text with typewriter effect (reveal character by character), choice buttons at bottom. Camera zoom to NPC face during dialog. Player can't move during dialog (or walks slowly). Skip button to instantly show full text. Choice buttons highlight on hover. Animated speaking indicator on NPC. Close button (X) to exit conversation.
EDGE CASES: NPC destroyed during dialog (close dialog gracefully). Player walks too far from NPC (auto-close). Two players talking to same NPC simultaneously (independent dialog instances). Choice that gives item when inventory full (notify, don't lose item — retry on next interaction). Long dialog chains (save progress for multi-visit stories). Localization (dialog text lookup by language key).
ANTI-EXPLOIT: All conditions and actions server-evaluated. Choice validation server-side. Reward granting server-side. Rate-limit dialog interactions. Validate NPC proximity continuously during dialog.
CONNECTIONS: Quest system for quest-related dialog. Shop system for merchant dialog. Currency/inventory for rewards. NPC world placement.

────────────────────────────────────────────────────────────
32. NPC MERCHANT SYSTEM (stock, prices, buy/sell, restock)
────────────────────────────────────────────────────────────
DATA: MerchantDatabase: { [merchantId]: { npcId, name, shopId: string (links to ShopCatalog), buyMultiplier: N (sell price = item.price * buyMultiplier, typically 0.3-0.5), specialDialogOnOpen: dialogId|nil, restockInterval: N (seconds), personalizedPricing: bool } }. Per-merchant server state: { stock: { [itemId]: currentStock }, lastRestock: timestamp }. Personalized pricing: based on player reputation/level, price modifier of 0.8-1.2.
REMOTES: InteractMerchant (RemoteEvent — merchantId), BuyFromMerchant (RemoteEvent — merchantId, itemId, qty), SellToMerchant (RemoteEvent — merchantId, itemId, qty), MerchantStock (RemoteEvent — server→client stock updates).
SERVER: Open: validate proximity, load merchant catalog with current stock levels, send to client. Buy: validate stock > 0, player can afford, deduct currency, add item, decrement stock. Sell: validate player has item, item is sellable (not quest item), calculate price (itemBasePrice * buyMultiplier), add currency, remove item. Restock: periodic check every restockInterval, replenish depleted stock to max. Personalized prices: calculate modifier based on player's reputation with this merchant faction.
CLIENT: Merchant UI: opens through dialog first (optional greeting), then switches to shop layout. Two tabs: Buy and Sell. Buy tab: items with stock counts, prices, buy buttons. Sell tab: player's sellable inventory with sell prices. Merchant portrait and name. Stock indicator (In Stock / Low Stock / Out of Stock with color coding).
EDGE CASES: Stock depleted between opening shop and buying (reject with "out of stock"). Merchant NPC killed/despawned (close shop). Multiple players buying last stock item simultaneously (first-come first-served, atomic check). Selling items that the merchant "doesn't want" (category-based buy restrictions). Price changes during browse (refresh on transaction).
ANTI-EXPLOIT: Pricing entirely server-calculated. Stock tracked server-side. Validate merchantId and proximity. Rate-limit transactions. Log all merchant transactions for economy monitoring.
CONNECTIONS: Shop/store system for catalog data. Currency system for payments. Inventory for items. Dialog system for merchant greeting. Reputation/faction system for price modifiers.

────────────────────────────────────────────────────────────
33. NPC ENEMY AI (patrol, aggro, chase, attack, retreat, loot)
────────────────────────────────────────────────────────────
DATA: EnemyDatabase: { [enemyId]: { name, health, damage, attackSpeed, attackRange, aggroRange: N (studs), deaggroRange: N (aggroRange * 1.5), moveSpeed, lootTable: { itemId, dropChance, minQty, maxQty }[], xpReward, patrolRadius: N, respawnTime: N, abilities: abilityId[], resistances: {}, weaknesses: {} } }. AI State machine per NPC: { state: "idle"|"patrol"|"alert"|"chase"|"attack"|"retreat"|"dead", target: player|nil, homePosition: CFrame, currentPath: Path|nil, lastAttackTime: N, health: N }.
REMOTES: EnemyState (RemoteEvent — server→nearby clients for animation sync), EnemyDamaged (RemoteEvent — server→client for hit VFX), EnemyDied (RemoteEvent — server→clients for death animation + loot).
SERVER: AI loop (Heartbeat, batched — process 10 enemies per frame to spread load): Idle → patrol randomly within patrolRadius of home using PathfindingService. Alert → player enters aggroRange, turn to face, brief pause (0.5s). Chase → move toward target using pathfinding, recalculate path every 1-2 seconds. Attack → within attackRange, execute attack cycle (wind-up, damage frame, recovery). Retreat → health below 20%, move away from target for 3 seconds, then re-engage or heal. Dead → play death animation, spawn loot, start respawn timer. Loot: create physical drops at death position (or add directly to killing player's inventory). Path recalculation: every 2 seconds maximum (PathfindingService is expensive). Use :ComputeAsync() NOT :Compute() (async prevents server freezing).
CLIENT: Enemy nameplate: name, health bar, level. Attack telegraphing: wind-up animation before damage frame. Hit reaction: flinch animation, damage number. Death: ragdoll or dissolve effect, loot drop sparkle. Aggro indicator: exclamation mark when enemy spots you. Patrol: ambient idle animations (look around, scratch, sit).
EDGE CASES: Target goes behind solid wall (path around, not through — use pathfinding). Target on different floor/level (pathfinding handles this if navmesh is set up). Enemy stuck on geometry (if no path found for 5 seconds, teleport home). Multiple enemies aggro same player (limit simultaneous attackers to 3, others circle). Player logs out during combat (deaggro, return to patrol). Enemy falls off map (respawn at home).
ANTI-EXPLOIT: All AI runs server-side. Damage dealt by enemies is server-calculated. Loot distribution server-decided. Hit detection (enemy attacking player) uses server hitbox. Players can't manipulate enemy AI state.
CONNECTIONS: Health system for NPC health and player damage. Combat system for attack/defense. Loot connects to inventory. XP system for kill rewards. Quest system for kill objectives. Spawn management for respawning.

────────────────────────────────────────────────────────────
34. BOSS BATTLE SYSTEM (phases, mechanics, enrage, loot table)
────────────────────────────────────────────────────────────
DATA: BossDatabase: { [bossId]: { name, phases: { healthThreshold: N (percent), abilities: abilityId[], moveSpeed, attackPattern: string[], spawnAdds: enemyId[]|nil }[], enrageTimer: N (seconds, then boss goes berserk), lootTable: { [rarity]: { itemId, weight }[] }, minPlayers: N, arenaId: string, music: soundId } }. Boss state (server): { currentPhase, health, maxHealth, enraged, activePlayers: playerId[], startTime, damageDealers: { [playerId]: totalDamage } }.
REMOTES: BossPhaseChange (RemoteEvent — server→all, phaseIndex, abilities), BossAbility (RemoteEvent — server→all, abilityId, targetInfo), BossDefeated (RemoteEvent — server→all, lootDistribution), JoinBossFight (RemoteEvent — client→server).
SERVER: Boss phases: at health thresholds (75%, 50%, 25%), switch ability set, increase speed, spawn add enemies. Phase transition: brief invulnerability (2 seconds), dramatic animation, new music intensity. Enrage: after enrage timer expires, boss damage +100%, attack speed +50%, no more add spawns (pure DPS check). Loot: on death, calculate damage contribution per player, distribute loot proportionally (top damager gets guaranteed rare drop, others roll from table). Arena: teleport players in, lock exits, teleport out on completion/wipe. Wipe: all players dead = boss resets, players teleported to graveyard.
CLIENT: Boss health bar: massive bar at top of screen with phase markers. Phase transition cinematic: camera zoom, boss roar, screen shake. Ability telegraphs: red circles on ground for AoE, targeting laser for beam attacks, screen flash for unavoidable damage. Enrage warning: "BOSS ENRAGED!" text, red screen tint, faster music. Loot distribution: loot shower animation, items rolling for each player.
EDGE CASES: Player disconnects mid-fight (remove from active list, don't count for minimum). Boss stuck on arena geometry (built-in "unstuck" teleport to arena center every 10 seconds if path blocked). Phase skip (enough DPS to go from 100% to 40% in one burst — process all phase transitions in order). Enrage at 1% health (still enrages, don't skip). Boss kills all players except one AFK (check activity, kick inactive players). Loot for player who died but contributed (still eligible if contributed >5% damage).
ANTI-EXPLOIT: All boss mechanics server-authoritative. Damage tracking server-side. Loot distribution server-decided. Arena entry/exit server-controlled. Can't damage boss outside arena. Validate all player damage through combat system.
CONNECTIONS: Enemy AI (boss is advanced NPC). Health/damage system. Loot/inventory system. Party system for boss groups. Achievement for boss kills.

────────────────────────────────────────────────────────────
35. WAVE/HORDE SYSTEM (escalating difficulty, rest periods)
────────────────────────────────────────────────────────────
DATA: WaveConfig: { waves: { [waveNum]: { enemies: { enemyId, count, spawnDelay }[], duration: N|nil (time limit or until all killed), bonusReward: reward } }[], restDuration: N (between waves), difficultyScale: { healthMult: N per wave, damageMult: N per wave, speedMult: N per wave }, maxWaves: N|"infinite", spawnPoints: CFrame[] }. Server state: { currentWave, enemiesAlive, enemiesTotal, waveStartTime, isResting }.
REMOTES: WaveStart (RemoteEvent — server→all, waveNum, enemyInfo), WaveComplete (RemoteEvent — server→all, reward), EnemySpawned (RemoteEvent — server→all, enemyId, position), AllWavesComplete (RemoteEvent — victory).
SERVER: Wave flow: start wave → spawn enemies with staggered delay (don't spawn all at once — stagger 0.5-2 seconds apart) → track alive count → on all dead or time expired → rest period → next wave. Difficulty scaling: each wave multiplies enemy stats by cumulative scale. Wave 10 enemies have 2x health if healthMult = 1.1 per wave (1.1^10 ≈ 2.59). Spawn distribution: spread across multiple spawn points, don't clump. Rest period: 15-30 seconds for players to heal, repair, upgrade turrets, buy items. Infinite mode: after scripted waves end, procedurally generate waves with increasing difficulty.
CLIENT: Wave banner: "WAVE 3" with dramatic text animation. Enemy counter: "Enemies: 5/20". Wave progress bar. Rest timer: countdown with "NEXT WAVE IN: 15s" and prep shop. Victory screen after final wave. Defeat screen if all players die.
EDGE CASES: Player joins mid-wave (spawn them, they participate but reduced wave reward). All players dead (wave failed — restart wave or game over based on config). Enemies stuck in spawn area (move toward players after 10 seconds regardless). Wave 50+ with hundreds of enemies (performance — cap alive enemies at 30, queue rest). Server lag during large waves (reduce spawn count dynamically).
ANTI-EXPLOIT: Enemy spawning server-controlled. Wave progression server-tracked. Kill counting server-side. Rewards distributed server-side.
CONNECTIONS: Enemy AI for NPCs. Health/damage system. Currency for between-wave shop. Tower defense for turret upgrades. Round system (wave = sub-round).

────────────────────────────────────────────────────────────
36. TOWER DEFENSE (tower types, upgrade paths, targeting AI)
────────────────────────────────────────────────────────────
DATA: TowerDatabase: { [towerId]: { name, cost, damage, fireRate, range, targetingMode: "first"|"last"|"strongest"|"weakest"|"closest", upgrades: { [level]: { cost, damageBoost, rangeBoost, fireRateBoost, specialAbility: string|nil } }, maxLevel: 3-5, model: string } }. EnemyPath: ordered list of CFrame waypoints. Per-player tower state: { placedTowers: { [uniqueId]: { towerId, position, level, targetMode } }, currency: N }.
REMOTES: PlaceTower (RemoteEvent — towerId, CFrame), UpgradeTower (RemoteEvent — uniqueId), SellTower (RemoteEvent — uniqueId), ChangeTargeting (RemoteEvent — uniqueId, mode), TowerFired (RemoteEvent — server→clients for VFX).
SERVER: Placement: validate position is on valid placement zone (not on path, not overlapping another tower, within bounds), validate player can afford, deduct currency, create tower. Tower AI loop: every tower checks for enemies in range, selects target by mode, fires projectile at fire rate. Damage application: when projectile "hits" (instant for hitscan towers, delayed for projectile towers), apply damage to enemy. Sell: refund 50-75% of total investment. Upgrade: increase stats per upgrade table.
CLIENT: Placement mode: ghost tower at mouse position, green=valid, red=invalid. Range circle visualization. Tower menu: grid of available towers with cost/stats. Right-click tower: upgrade menu, sell button, targeting mode selector. Attack VFX: projectile effects (arrows, lasers, fireballs), hit effects on enemies. Tower animations: rotate toward target, recoil on fire. Enemy path visualization: glow line showing path.
EDGE CASES: Enemy reaches end of path (lives lost, enemy removed). Multiple towers targeting same enemy (each independently — may overkill). Tower placed then enemy pathing changes (tower remains, may become useless). Selling tower during wave (allowed, instant refund). All lives lost (game over, restart option). Enemy immune to certain tower type (element system).
ANTI-EXPLOIT: Placement validation server-side. Currency deduction server-side. Tower damage server-side. Can't place in invalid positions. Rate-limit placements. Validate tower ownership for upgrade/sell.
CONNECTIONS: Wave system for enemy spawning. Currency system for purchases. Upgrade system for tower progression.

────────────────────────────────────────────────────────────
37. TYCOON MECHANICS (droppers, conveyors, upgrades, rebirth)
────────────────────────────────────────────────────────────
DATA: TycoonConfig: { droppers: { [dropperId]: { name, cost, valuePerDrop, dropInterval, model, upgradeMultipliers } }, conveyors: { [conveyorId]: { speed, cost } }, upgrades: { [upgradeId]: { name, cost, type: "multiplier"|"auto_collect"|"new_dropper"|"speed", value } }, rebirthCost: formula, rebirthMultiplier: N }. Per-player: { tycoonLevel, currency, ownedDroppers, ownedUpgrades, rebirths, lifetimeEarned, tycoonPlotData }.
REMOTES: PurchaseButton (RemoteEvent — itemId, type: "dropper"|"upgrade"|"conveyor"), CollectDrop (RemoteEvent — dropId), Rebirth (RemoteEvent), GetTycoonData (RemoteFunction).
SERVER: Dropper system: each owned dropper spawns a Part at interval, Part has value attribute. Part rides conveyor (BodyVelocity or TweenService on anchored path). When Part touches collector: add value to player currency, destroy Part. Purchase buttons: floor pads that appear sequentially (next purchase unlocks next button location). Rebirth: validate can afford, reset all droppers/upgrades, multiply all future earnings, increment rebirth counter. Auto-collect upgrade: radius check instead of physical collection.
CLIENT: Tycoon base: pre-built plot with button pads appearing as available. Purchase feedback: button sinks, object spawns with build animation. Dropper visual: part appears, falls onto conveyor, moves to collector. Currency counter with gain-per-second display. Rebirth button: big dramatic button with confirmation. Upgrade effects visible (conveyor glows faster, dropper particles increase).
EDGE CASES: Dropped item falls off conveyor (destroy after 30 seconds or teleport back). Player leaves mid-drop (save currency, destroy active drops). 100+ drops on conveyor causing lag (limit max active drops per player to 50). Purchase button for something player already owns (hide or disable). Rebirth with active drops (collect all first, then rebirth).
ANTI-EXPLOIT: Currency tracked server-side. Purchase validation server-side. Drop values set by server (not client). Can't collect drops that aren't theirs (ownership check). Rate-limit collections. Validate proximity to collector.
CONNECTIONS: Currency system (tycoon IS a currency system). Rebirth is a prestige system. Upgrades connect to progression. Plot system for tycoon base.

────────────────────────────────────────────────────────────
38. SIMULATOR MECHANICS (click power, multipliers, areas, rebirths)
────────────────────────────────────────────────────────────
DATA: SimulatorConfig: { clickBaseValue: N, areas: { [areaId]: { name, requirePower: N, enemies: enemyConfig[], areaMultiplier: N } }, pets: { affect: "power"|"luck"|"speed" }, upgrades: { [upgradeId]: { cost: currencyType, multiplier, type } }, rebirthLevels: { [rebirthNum]: { cost, multiplier, unlocks } } }. Per-player: { power: N, coins: N, gems: N, currentArea: areaId, rebirths: N, multipliers: { click: N, passive: N, luck: N } }.
REMOTES: Click (RemoteEvent — target), AutoClick (RemoteEvent — toggle), UpgradePower (RemoteEvent — upgradeId), TeleportArea (RemoteEvent — areaId), Rebirth (RemoteEvent).
SERVER: Core loop: player clicks (or auto-clicks) → gain power based on clickPower * multipliers → reach power threshold → unlock next area → area has stronger enemies that give more coins → coins buy pet eggs → pets boost stats → eventually rebirth → start over with permanent multiplier. Click validation: max 20 clicks/second (normal humans). Auto-click: premium feature or earned upgrade, fixed rate (5/sec). Area gating: validate player power >= area requirement. Rebirth: cost increases exponentially, multiplier is permanent across rebirths.
CLIENT: Main screen: big clickable object/enemy with damage numbers. Power counter (large, animated). Area portal: visible gate with required power displayed. Pet following player (see pet system). Upgrade shop: accessible from any area. Leaderboard: power-based ranking. Rebirth button with dramatic confirmation. Area transition: whoosh effect, new environment loads.
EDGE CASES: Auto-clicker scripts (rate-limit to max human speed + 10%). Rapid area changes (cooldown between teleports). Rebirth at very high multiplier (cap at reasonable max like 1000x). Multiple players in same area (independent progression). Pet affecting click while in different area than player (use player's area multiplier).
ANTI-EXPLOIT: Click rate limited server-side. Power calculations server-side. Area access validated server-side. Purchase validation server-side. Detect auto-clicker patterns (perfectly even timing = bot, human timing has variance).
CONNECTIONS: Pet system for stat boosts. Currency for purchases. Rebirth is prestige. Leaderboard for competition. Daily rewards for engagement.

────────────────────────────────────────────────────────────
39. OBBY MECHANICS (checkpoints, kill bricks, timers, stage skip)
────────────────────────────────────────────────────────────
DATA: ObbyConfig: { stages: { [stageNum]: { spawnCFrame: CFrame, obstacles: string[], difficulty: 1-5, par time: N } }, totalStages: N, checkpointSaveInterval: N (save every N stages) }. Per-player: { currentStage: N, bestStage: N, bestTimes: { [stageNum]: N }, deaths: N, totalCompletions: N }.
REMOTES: CheckpointReached (RemoteEvent — server→client, stageNum), StageComplete (RemoteEvent — server→client, stageNum, time), ResetToCheckpoint (RemoteEvent — client→server), SkipStage (RemoteEvent — client→server, costs currency).
SERVER: Checkpoint: use TouchPart at each stage start. When player touches checkpoint: validate they haven't skipped stages (currentStage must be >= stageNum - 1), update currentStage, save periodically. Kill bricks: TouchPart with kill tag → Humanoid.Health = 0, respawn at last checkpoint. Timer: server tracks stage start time and completion time for leaderboards. Stage skip: validate player has currency, increment currentStage, teleport to next stage spawn.
CLIENT: Stage counter: "Stage 15/100" in HUD. Timer running for current stage. Death counter. Best time per stage. Checkpoint activation effect (sparkle, sound). Kill brick visual: red glow, pulsing. Stage skip button (premium feature). Leaderboard: fastest times per stage. Ghost replay of best run (advanced feature).
EDGE CASES: Player touches checkpoint while dead (ignore). Touching checkpoint for earlier stage (ignore — don't go backwards). Falling into void (kill, respawn at checkpoint). Kill brick touching player multiple times in one frame (debounce death — 0.5 second immunity after death). Stage geometry breaking mid-run (rare but handle gracefully — force teleport to checkpoint).
ANTI-EXPLOIT: Stage progression validated server-side (can't skip via teleport). Timer tracked server-side. Can't touch checkpoint without reaching it legitimately (position validation). Death handling server-side. Speed hacks detected by impossible stage clear times.
CONNECTIONS: Currency for stage skips. Leaderboard for time trials. Achievement for completion milestones. Daily rewards for daily play.

────────────────────────────────────────────────────────────
40. RACING MECHANICS (checkpoints, laps, positions, boost, drift)
────────────────────────────────────────────────────────────
DATA: RaceConfig: { tracks: { [trackId]: { name, checkpoints: CFrame[], totalLaps: N, boostPads: CFrame[], itemBoxes: CFrame[] } }, vehicles: { [vehicleId]: { topSpeed, acceleration, handling, driftBoost } } }. Per-race state: { racers: { [playerId]: { currentCheckpoint, currentLap, raceTime, position, finished } }, racePhase: "countdown"|"racing"|"finished" }.
REMOTES: RaceStart (RemoteEvent — server→all, trackId), CheckpointHit (RemoteEvent — server→client, checkpoint, lap), PositionUpdate (RemoteEvent — server→all, rankings), UseBoost (RemoteEvent — client→server), RaceFinish (RemoteEvent — server→all, rankings).
SERVER: Race flow: countdown (3, 2, 1, GO — hold vehicles with Anchor, then release) → racing (track checkpoints per player, calculate positions) → finish (first to complete all laps). Checkpoint validation: must hit checkpoints in order (prevent shortcutting). Position calculation: based on current lap + checkpoint progress. Boost: temporary speed increase (1.5x for 3 seconds), earned from drift, item pickup, or boost pad. Drift: detect sideways movement while turning (dot product of velocity and forward vector < threshold), accumulate drift charge, release for boost.
CLIENT: Racing HUD: position (1st, 2nd, etc.), lap counter, speedometer, minimap with track and other racers. Countdown overlay: "3… 2… 1… GO!" with engine revving. Boost indicator: charge bar that fills during drift. Speed lines effect during boost. Wrong way indicator if going backwards. Finish line: checkered flag animation, results screen with times.
EDGE CASES: Player goes wrong way (warn, don't teleport — let them correct). Player shortcuts across map (checkpoint order enforced). Vehicle destroyed during race (respawn at last checkpoint with 3 second penalty). All players disconnect except one (auto-win). Tie finish (compare times to millisecond). Player joins mid-race (spectator until next race).
ANTI-EXPLOIT: Checkpoint order enforced server-side. Vehicle speed capped server-side. Position calculation server-side. Can't skip checkpoints via teleport. Validate boost usage (can't boost without charge).
CONNECTIONS: Vehicle system for car physics. Round system for race flow. Leaderboard for best times. Currency for race rewards.

────────────────────────────────────────────────────────────
41. PARKOUR MOVEMENT (wall jump, double jump, dash, slide, ledge grab)
────────────────────────────────────────────────────────────
DATA: MovementConfig: { doubleJump: { enabled: bool, extraJumps: N, jumpPower: N }, wallJump: { enabled: bool, detectRange: N, jumpAngle: N }, dash: { enabled: bool, distance: N, cooldown: N, iFrames: bool }, slide: { enabled: bool, speedMultiplier: N, duration: N }, ledgeGrab: { enabled: bool, detectRange: N, climbSpeed: N } }. Per-player state: { jumpsRemaining: N, canDash: bool, dashCooldown: N, isSliding: bool, isGrabbing: bool }.
REMOTES: MovementAction (RemoteEvent — actionType, directionVector), MovementState (RemoteEvent — server→client state sync for other players).
SERVER: Double jump: client-initiated but server-validated (track jump count, max = 1 + extraJumps). Wall jump: client-initiated, server validates wall proximity (raycast from player in move direction, hit within detectRange). Dash: validate cooldown elapsed, apply velocity impulse in facing direction. Slide: validate on ground, apply speed boost and lower hitbox (resize Humanoid Hip Height or add crouching collision). Ledge grab: detect ledge above player (raycast up and forward), freeze position, allow climb input.
CLIENT: Client handles responsive input: double jump on spacebar in air, wall jump on spacebar near wall + facing wall, dash on Q/shift, slide on ctrl while moving, ledge grab auto-detects near edges. All inputs fire remotes for validation but apply movement locally for responsiveness (client prediction). Animations: flip on double jump, kick off wall, burst trail on dash, tuck animation on slide, hang and pull-up on ledge.
EDGE CASES: Wall jump infinite height (limit consecutive wall jumps to 3 without touching ground). Dash through walls (server raycast check — if destination is inside solid, cap at wall). Slide off cliff (transition to falling). Ledge grab on moving platform (update grab position with platform). Dash cooldown reset exploit (server tracks cooldown, not client).
ANTI-EXPLOIT: Server validates all movement actions (can't double jump more than allowed, can't dash faster than cooldown). Position correction: if player position diverges >10 studs from expected, rubber-band back. Wall proximity validated server-side for wall jumps. Dash distance capped.
CONNECTIONS: Character controller. Physics system. Animation system. Obby mechanics (movement abilities in obstacle courses).

────────────────────────────────────────────────────────────
42. SWIMMING/DIVING (oxygen, underwater movement, treasure)
────────────────────────────────────────────────────────────
DATA: WaterConfig: { swimSpeed: N, diveSpeed: N, surfaceSwimSpeed: N, maxOxygen: N (seconds), oxygenDrainRate: N/sec, oxygenRegenRate: N/sec (on surface), damageWhenEmpty: N/sec, waterRegions: { position, size }[] }. Per-player: { oxygen: N, isSwimming: bool, isDiving: bool, underwaterTime: N }. UnderwaterTreasure: { [treasureId]: { position, itemId, respawnTime, requiresDivingGear } }.
REMOTES: EnterWater (RemoteEvent — server→client), ExitWater (RemoteEvent — server→client), OxygenUpdate (RemoteEvent — server→client), TreasureCollected (RemoteEvent — bidirectional).
SERVER: Water detection: use Region3 or tagged water parts with Touched/TouchEnded. On enter water: switch to swim state, enable oxygen tracking. Surface swimming: normal oxygen regen. Diving: drain oxygen at oxygenDrainRate. At 0 oxygen: damage player at damageWhenEmpty per second. On exit water: start surface oxygen regen. Treasure: server tracks treasure spawns, validates collection proximity, grants items, starts respawn timer.
CLIENT: Water surface detection: change camera to follow water level. Swimming animation: breaststroke on surface, freestyle underwater. Oxygen bar appears when underwater (gradually depletes). Low oxygen warning: bar flashes red, heartbeat sound, screen edges darken. Underwater visual effects: blue tint overlay, bubble particles from player, light rays from surface, reduced visibility distance. Treasure glow: underwater sparkle on collectible items.
EDGE CASES: Player pushed into water by explosion (auto-detect water entry). Shallow water vs deep water (wade in shallow, swim in deep — check water depth). Leaving water while upside down (normalize orientation). Oxygen running out exactly as reaching surface (save player — give 0.5 second grace period). Swimming near the bottom (don't clip through terrain). Diving gear extends oxygen (equipment modifier).
ANTI-EXPLOIT: Oxygen tracked server-side. Water region detection server-side. Treasure collection validated server-side. Can't breathe underwater without depleting oxygen. Damage from empty oxygen applied server-side.
CONNECTIONS: Health system for drowning damage. Inventory for diving gear and treasure. Exploration achievements for underwater areas. Equipment system for dive gear.

────────────────────────────────────────────────────────────
43. DAY/NIGHT CYCLE (smooth time, light changes, NPC schedules)
────────────────────────────────────────────────────────────
DATA: CycleConfig: { realMinutesPerGameDay: N (typically 20-40), dawnTime: 6, dayTime: 8, duskTime: 18, nightTime: 20, ambientDay: Color3, ambientNight: Color3, sunlightDay: Color3, moonlightNight: Color3 }. NPC schedules: { [npcId]: { [timeRange]: behavior (patrol, sleep, shop, wander) } }. Game events: { [timeRange]: eventId (midnight boss spawn, dawn market opens, etc.) }.
REMOTES: TimeSync (RemoteEvent — server→clients periodic, currentTime).
SERVER: Master clock: update ClockTime on Lighting service every Heartbeat. Formula: Lighting.ClockTime = (Lighting.ClockTime + dt / (realMinutesPerGameDay * 60) * 24) % 24. Smooth transitions: ambient, outdoor ambient, brightness, shadow softness — all lerp based on time. NPC behavior: check current time against schedule, change AI state (go to bed, open shop, patrol). Game events: time-triggered spawns, shops opening/closing, special encounters.
CLIENT: Visual: sky changes automatically with ClockTime (Roblox handles skybox). Additional: street lamps turn on at dusk (PointLights enable), windows glow at night, fog increases at dawn/dusk. Sound: bird sounds during day, cricket sounds at night, crossfade during transitions. UI: optional clock display showing game time.
EDGE CASES: Server time desync with client (periodic sync remote, client interpolates). Player joining mid-cycle (send current time immediately). Very fast cycles (min 5 real minutes per game day for stability). Very slow cycles (max 120 real minutes). Time-locked content (door only opens at midnight — use server time check, not client). Pausing time for cutscenes (save and restore time progression).
ANTI-EXPLOIT: Server controls time. Client can't set ClockTime. NPC schedules evaluated server-side. Time-gated content validated server-side.
CONNECTIONS: NPC systems for schedules. Lighting system for visual changes. Weather system (weather + time of day). Shop system for business hours. Farming for growth rates.

────────────────────────────────────────────────────────────
44. WEATHER SYSTEM (rain, snow, storm, fog, wind — particles + lighting)
────────────────────────────────────────────────────────────
DATA: WeatherConfig: { weatherTypes: { [weatherId]: { name, particles: { emitter: ParticleEmitter props, attachment: "camera"|"sky" }, lighting: { Brightness, Ambient, FogEnd, FogColor, Atmosphere props }, sounds: { ambient: soundId, thunder: soundId|nil }, duration: {min, max}, effects: { wet (reduce friction), cold (slow), hot (faster thirst) } } }, transitionDuration: N (seconds to blend between weather), changeInterval: { min, max } }. Server state: { currentWeather, nextWeather, transitionProgress, lastChangeTime }.
REMOTES: WeatherChanged (RemoteEvent — server→all, weatherId, transitionTime), WeatherSync (RemoteEvent — server→joining player).
SERVER: Weather cycle: server picks weather randomly (weighted by biome/season), sets duration, transitions smoothly. Transition: over transitionDuration seconds, lerp all lighting properties from current to target. Weather effects on gameplay: rain = slippery surfaces (reduce friction), snow = slow movement, storm = periodic lightning strikes (damage in open areas), fog = reduced visibility (good for horror). Wind: affect projectile trajectories, push player slightly.
CLIENT: Rain: ParticleEmitter attached to camera with downward velocity, raindrop splash particles on surfaces, wet surface shader (increased reflection). Snow: slower particles, larger, drift with wind, snow accumulation on surfaces (white decal fade-in). Storm: dark clouds, lightning flash (screen flash + boom), heavy rain. Fog: adjust Atmosphere Density and FogEnd. Wind: particle drift direction, tree/flag animation, sound whoosh. Transition: all effects blend smoothly over transition duration.
EDGE CASES: Indoor areas (detect if player is under roof — raycast up, if hit within 20 studs = indoors, disable rain/snow particles). Weather during cutscene (pause weather transitions). Very rapid weather changes (minimum 2 minutes between changes). Weather affecting game balance (reduce effects in competitive modes). Server restart during transition (snap to target weather).
ANTI-EXPLOIT: Weather state is server-authoritative. Gameplay effects (slow, slip) applied server-side. Lightning damage server-calculated. Client only handles visuals/audio.
CONNECTIONS: Day/night cycle (night + storm = very dark). Farming (rain waters crops). Combat (lightning damage). Movement (slippery surfaces). Atmosphere/lighting system.

────────────────────────────────────────────────────────────
45. ANTI-CHEAT SYSTEM (speed, teleport, fly, noclip, value validation)
────────────────────────────────────────────────────────────
DATA: AntiCheatConfig: { checks: { speed: { maxSpeed: N, tolerance: 1.2, sampleInterval: 0.5 }, teleport: { maxDistancePerFrame: N, warningThreshold: 3 }, fly: { maxAirTime: N, groundCheckInterval: 0.2 }, noclip: { raycastInterval: 0.5 } }, punishments: { warning: "log", kick: "kick after N warnings", ban: "ban after N kicks" }, whitelistedPlayers: userId[] }. Per-player: { violations: { [type]: count }, warningCount: N, lastPositions: CFrame[] (ring buffer of last 10) }.
REMOTES: (No client-facing remotes — entirely server-side).
SERVER: Speed check: every 0.5 seconds, calculate distance moved vs theoretical max (walkspeed * dt * tolerance). If exceeded: increment speed violation, teleport back to last valid position. Teleport check: if distance between frames > maxDistancePerFrame (unless using legitimate teleport function), flag. Fly check: track time since last ground contact (Humanoid.FloorMaterial ~= Enum.Material.Air), if exceeds maxAirTime without jump velocity, flag. Noclip check: raycast from previous position to current position, if hits solid part that player passed through, flag. Value check: validate all NumberValue/IntValue children of player (leaderstats, etc.) haven't been modified by client — keep server-side mirror. Punishment escalation: warnings → kick → temp ban → permanent ban. Log everything for review.
CLIENT: (Client does nothing — all anti-cheat is server-side. DO NOT run anti-cheat on client — exploiters can disable it.)
EDGE CASES: Flung by physics (legitimate high speed — check if player was recently hit by part/explosion, give grace period). Legitimate teleports (game teleport functions, respawn — whitelist these). Server lag causing position jumps (account for dt, larger tolerance during lag spikes). Vehicles moving fast (different speed limits when seated). Admin/developer bypass (whitelist by userId).
ANTI-EXPLOIT: The anti-cheat IS the anti-exploit system. Key principle: NEVER rely on client for validation. All checks server-side. Don't tell the client they're being checked (silent detection). Don't tell exploiter what triggered the flag (generic kick message). Log violation details for manual review.
CONNECTIONS: All movement systems. Health system (validate health changes). Currency system (validate value changes). Admin system for manual bans.

────────────────────────────────────────────────────────────
46. ADMIN COMMANDS (kick, ban, tp, give, announce, god mode)
────────────────────────────────────────────────────────────
DATA: AdminConfig: { admins: { [userId]: rank (1=mod, 2=admin, 3=owner) }, commands: { [cmdName]: { rank: N, usage: string, description: string } }, banList: { [userId]: { reason, expiry, bannedBy } } }. Command list: kick, ban, unban, tp (teleport to player), bring (teleport player to you), give (item/currency), speed (set walkspeed), god (invincibility), noclip (toggle collision), fly (toggle flight), announce (server-wide message), shutdown (server), rejoin (force player rejoin), spectate, invisible, freeze, unfreeze, jail, unjail.
REMOTES: AdminCommand (RemoteEvent — command string), AdminResponse (RemoteEvent — server→admin, result), AdminLog (RemoteEvent — server→admins, action log).
SERVER: Parse command string: "!kick PlayerName reason here". Validate sender has sufficient rank for command. Execute command server-side. Log ALL admin actions (who, what, when, target). Ban persistence: save to DataStore, check on player join. Kick: Player:Kick(reason). Ban: add to DataStore ban list, kick immediately. Teleport: set player CFrame. God mode: set health to math.huge, listen for damage and reset. Fly: add BodyVelocity controlled by movement keys. Commands can target by partial username match.
CLIENT: Chat-based commands: type "!cmd" in chat. Auto-complete suggestions. Admin panel UI (optional): button list for common actions, player list for targeting, ban management, server stats. Command output: success/error messages in chat (admin-only visible). Action log feed for transparency.
EDGE CASES: Banning an admin (only higher-rank can ban lower-rank). Self-targeting (some commands work on self, others reject). Offline player ban (ban by userId directly). Partial name matches multiple players (list matches, require full name). Admin leaves during god mode (remove god mode). Banned player attempts rejoin (check on PlayerAdded, kick immediately with ban reason).
ANTI-EXPLOIT: Admin rank stored in server config, NOT client. Validate every command against sender's rank. Log everything. Rate-limit commands (max 5 per second). Never expose admin status to other players (unless you want admin indicator).
CONNECTIONS: All game systems (admin can modify any). Chat system for command input. DataStore for ban persistence. Logging for accountability.

────────────────────────────────────────────────────────────
47. CHAT SYSTEM (channels, whisper, team, global, filter)
────────────────────────────────────────────────────────────
DATA: ChatConfig: { channels: { [channelId]: { name, color, scope: "global"|"team"|"local"|"party", range: N (for local chat) } }, chatSettings: { messageMaxLength: 200, messageRateLimit: 3/sec, filterEnabled: true, bubbleChatEnabled: true } }. Per-player: { mutedPlayers: userId[], activeChannel: channelId, chatHistory: last 50 messages }.
REMOTES: SendMessage (RemoteEvent — message, channel), ReceiveMessage (RemoteEvent — server→clients, senderInfo, message, channel), WhisperMessage (RemoteEvent — targetUserId, message), SystemMessage (RemoteEvent — server→clients, message).
SERVER: On message: validate sender, rate-limit, apply TextService:FilterStringAsync() (REQUIRED — Roblox rejects games without chat filtering), route to appropriate channel recipients. Global: all players. Team: same team players. Local: players within range studs. Party: party members. Whisper: sender + recipient only. System messages: server announcements, join/leave notifications. Mute: server tracks mute list, silently drops messages from muted players for the muter.
CLIENT: Chat window: message list with channel color coding. Channel tabs: Global, Team, Local, Party. Input field with channel selector prefix (/g, /t, /l, /p, /w PlayerName). Whisper: purple/pink color. System messages: yellow. Bubble chat above player heads. Chat scroll, auto-scroll, scroll lock when reading history. Timestamp option. Emoji support.
EDGE CASES: Very long messages (truncate at maxLength). Rapid fire messages (rate-limit, reject excess). Filtered message returns all hashes (show "Message filtered" instead). Player mutes then unmutes (update immediately). Cross-server chat (use MessagingService for global chat across servers). Chat during loading screen (queue messages, display when ready). Unicode/emoji handling (Roblox TextService handles this).
ANTI-EXPLOIT: ALWAYS filter through TextService:FilterStringAsync(). Rate-limit messages. Max message length. Server routes all messages (no client-to-client direct messaging). Mute implementation server-side (not client-side ignore). Log chat for moderation.
CONNECTIONS: Team system for team chat. Party system for party chat. Admin system for muting/announcing. Social system for whispers.

────────────────────────────────────────────────────────────
48. FRIEND/PARTY SYSTEM (invite, join, shared rewards, teleport)
────────────────────────────────────────────────────────────
DATA: Per-player party state: { partyId: string|nil, partyMembers: userId[], partyLeader: userId, maxPartySize: 4-8 }. Party state (server memory): { [partyId]: { leader, members: userId[], settings: { sharedXP: bool, sharedLoot: bool, friendsOnly: bool } } }. Use Roblox's built-in Friend checking: Player:IsFriendsWith(userId).
REMOTES: InviteToParty (RemoteEvent — targetUserId), AcceptInvite (RemoteEvent — partyId), DeclineInvite (RemoteEvent — partyId), LeaveParty (RemoteEvent), KickFromParty (RemoteEvent — targetUserId, leader only), PartyUpdated (RemoteEvent — server→party members), TeleportToPartyMember (RemoteEvent — targetUserId).
SERVER: Invite: validate sender is leader or party has auto-invite, target is online and not in another party. Accept: add to party, notify all members. Leave: remove from party, if leader leaves, promote next member. Kick: leader only, remove target. Shared rewards: when any party member earns XP/loot, distribute portion to nearby party members (within 100 studs). XP split: each member gets 80% of normal XP (bonus for partying, not penalty). Loot: rolled independently per member with luck boost. Teleport: TeleportService:TeleportToPlaceInstance for cross-server join.
CLIENT: Party frame: member portraits with health bars, class icons. Invite: right-click player → "Invite to Party". Party settings accessible by leader. Distance indicators for far-away members. Waypoint markers on party members in minimap. Shared quest progress visible for party quests.
EDGE CASES: Invite to player in different server (use MessagingService to send cross-server invite, TeleportService to join). Party member disconnects (remove after 30 seconds, rejoin allowed within 5 minutes). Leader disconnects (auto-promote). Party during matchmaking (keep party together in team assignment). Party loot in raid (individual loot tables per player, influenced by party size).
ANTI-EXPLOIT: Party membership tracked server-side. Invite validation server-side. Reward distribution server-calculated. Can't join party without invite. Leader actions validated (kick, settings). Rate-limit invites (max 1 per 5 seconds per target).
CONNECTIONS: Social features (friends list). XP system for shared rewards. Loot/inventory for shared drops. Teleport system for party joining. Quest system for party quests.

────────────────────────────────────────────────────────────
49. GUILD/CLAN SYSTEM (create, invite, ranks, bank, wars)
────────────────────────────────────────────────────────────
DATA: GuildDatabase (DataStore): { [guildId]: { name, tag (3-4 letter abbreviation), leaderId, officers: userId[], members: userId[], maxMembers: N, level: N, xp: N, bank: { [currencyType]: N, items: {itemId, qty}[] }, perks: { [perkId]: level }, motd: string, createdAt: N } }. Per-player in their DataStore: { guildId: string|nil }. Guild perks: { XP boost, luck boost, extra inventory slots, exclusive shop, guild hall }.
REMOTES: CreateGuild (RemoteEvent — name, tag), InviteToGuild (RemoteEvent — targetUserId), JoinGuild (RemoteEvent — guildId), LeaveGuild (RemoteEvent), PromoteRank (RemoteEvent — targetUserId), DemoteRank (RemoteEvent — targetUserId), DepositToBank (RemoteEvent — type, amount), WithdrawFromBank (RemoteEvent — type, amount, leader/officer only), GetGuildInfo (RemoteFunction — guildId).
SERVER: Create: validate name unique (check existing guilds), charge creation fee, create guild data. Invite: validate sender is officer+, target has no guild. Join: validate guild exists, not full, player was invited or guild is open. Ranks: Member < Officer < Leader. Promote/demote: leader can promote to officer, demote officers. Bank: members deposit, officers+ withdraw. Perks: guild gains XP from member activity, level up unlocks perks. Guild wars: challenge another guild, track kills between members for a week, winning guild gets reward. Guild hall: special area only guild members can access.
CLIENT: Guild panel: member list with ranks, guild stats, bank contents. Guild chat channel. Guild tag next to player name. Guild recruitment board: list of open guilds with descriptions. Bank deposit/withdraw UI. Perk display with level progress. War scoreboard during active war.
EDGE CASES: Leader quits game permanently (after 30 days inactive, auto-promote highest-rank officer). Guild at max members (reject new joins). Multiple guilds with similar names (enforce uniqueness). Guild bank exploitation (withdrawal logs, limits per day). Cross-server guild data (DataStore handles this but cache for performance — refresh every 5 minutes). Guild dissolved (all members removed, bank items returned to leader, name freed after 7 days).
ANTI-EXPLOIT: All guild operations server-validated. Bank transactions logged and limited. Rank changes logged. Name/tag profanity filtered. Creation fee prevents spam guilds. Invite-only option prevents unwanted joins.
CONNECTIONS: Currency for guild bank. Social system for invites. Chat for guild channel. Achievement for guild milestones. XP system for guild leveling.

────────────────────────────────────────────────────────────
50. AUCTION HOUSE (list, bid, buyout, expiry, fees)
────────────────────────────────────────────────────────────
DATA: Auction storage (DataStore or cross-server via MessagingService + MemoryStoreService): { [auctionId]: { sellerId, itemId, quantity, startingBid, currentBid, currentBidderId, buyoutPrice, listingFee, expiryTime, status: "active"|"sold"|"expired"|"cancelled" } }. Per-player: { activeListings: auctionId[] (max 10-20), activeBids: auctionId[], auctionHistory: last 20 transactions }.
REMOTES: ListItem (RemoteEvent — itemId, qty, startBid, buyoutPrice, duration), PlaceBid (RemoteEvent — auctionId, bidAmount), Buyout (RemoteEvent — auctionId), CancelListing (RemoteEvent — auctionId), SearchAuctions (RemoteFunction — filters), GetMyAuctions (RemoteFunction), CollectSold (RemoteEvent — auctionId).
SERVER: List: validate item in inventory, remove from inventory, charge listing fee (5% of starting bid), create auction entry, set expiry (12h, 24h, or 48h). Bid: validate auction active, bid > currentBid + minimum increment (5%), refund previous bidder, hold new bidder's currency in escrow. Buyout: validate active, charge buyout price, immediately complete auction. Expiry: periodic check (every 60 seconds), expired auctions return item to seller. Collection: seller collects currency (minus 10% AH fee), buyer collects item. Search: filter by item name, category, price range, sort by price/time. Cross-server: use MemoryStoreService SortedMap for active listings (fast reads), DataStore for completed auction history.
CLIENT: Auction house UI: search bar, category filters, sort options, listing grid. Each listing: item icon, name, current bid, buyout price, time remaining, seller name. List item dialog: select from inventory, set prices, select duration. My auctions tab: active listings, sold items to collect, expired items to reclaim. Bid history on each listing. Outbid notification system.
EDGE CASES: Bid at exact expiry moment (server processes in order, first valid bid wins). Buyout while someone is bidding (buyout takes priority). Seller tries to bid on own item (reject). Item delisted from game (honor existing auctions, prevent new listings). Server shutdown during auction (MemoryStoreService persists, process on next server). Currency insufficient for bid (reject, free up escrow). Multiple simultaneous bids (atomic operations, use MemoryStoreService UpdateAsync for optimistic concurrency).
ANTI-EXPLOIT: All pricing server-validated. Escrow system prevents double-spending. Listing fee prevents spam listings. AH fee is a gold sink (prevents inflation). Rate-limit searches and bids. Validate item ownership before listing. Cross-server consistency via MemoryStoreService atomic operations.
CONNECTIONS: Inventory for items. Currency for bidding/buying. Economy balance (AH fees are primary gold sink). Notification system for outbid alerts. Social for checking seller reputation.
`

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SECTION 2: DATA ARCHITECTURE PATTERNS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const DATA_ARCHITECTURE = `
=== DATA ARCHITECTURE PATTERNS FOR ROBLOX LUAU ===

─── PLAYER SAVE DATA SCHEMAS ───

1. TYCOON GAME:
{ version: 1, currency: { coins: N, gems: N }, droppers: { [id]: { level, active } }, upgrades: ownedUpgradeIds[], rebirth: { count, multiplier }, plotData: { furniture: {id, cframe}[] }, settings: { music: bool, sfx: bool }, stats: { timePlayed, lifetimeEarned } }
DO NOT store: active drops (ephemeral), conveyor states (derived), visual effects state

2. RPG GAME:
{ version: 1, level: N, xp: N, class: classId, stats: { str, int, agi, vit, lck }, equipment: { head, chest, legs, weapon, acc1, acc2 }, inventory: { [slot]: { id, qty, meta } }, quests: { active: { [id]: progress }, completed: id[] }, skills: { [skillId]: rank }, position: { x, y, z } (optional — respawn at town if omitted) }
DO NOT store: computed stats (derive from base + equipment), buff timers (ephemeral), NPC states

3. SIMULATOR GAME:
{ version: 1, power: N, coins: N, gems: N, area: areaId, rebirths: N, pets: { [uid]: { id, level, xp, equipped } }, upgrades: { [id]: level }, multipliers: { click, auto, luck }, backpack: { size, items } }
DO NOT store: click count (derived from power), other players' data, leaderboard position

4. FIGHTING GAME:
{ version: 1, elo: N, wins: N, losses: N, characters: { [id]: { unlocked, level, skins } }, selectedCharacter: id, settings: { controls, sensitivity }, cosmetics: { [type]: equipped } }
DO NOT store: match state, opponent data, hitbox data

5. SURVIVAL GAME:
{ version: 1, health: N, hunger: N, thirst: N, inventory: { [slot]: {id, qty, durability} }, crafting: { knownRecipes: id[] }, base: { position, structures: {id, cframe, health}[] }, skills: { [id]: level }, day: N }
DO NOT store: world state (shared), mob positions, weather

6. RACING GAME:
{ version: 1, coins: N, vehicles: { [id]: { unlocked, upgrades, customization } }, selectedVehicle: id, records: { [trackId]: bestTime }, stats: { totalRaces, wins, podiums }, license: tier }
DO NOT store: race state, other racers' data, physics state

7. TOWER DEFENSE:
{ version: 1, coins: N, gems: N, towers: { [id]: { unlocked, level } }, maps: { [id]: { completed, stars, bestWave } }, loadout: towerId[] (selected 5-6 towers), stats: { totalWaves, totalKills } }
DO NOT store: placed tower positions (per-match), enemy state, wave progress

8. SOCIAL/HANGOUT GAME:
{ version: 1, coins: N, avatar: { outfit, accessories, emotes }, house: { tier, furniture: {id, cframe}[] }, friends: { favorites: userId[] }, badges: id[], chatColor: Color3, title: string }
DO NOT store: other players' positions, chat history, server list

9. HORROR GAME:
{ version: 1, progress: { chapter, checkpoint }, inventory: { [slot]: itemId }, notes: collectedNoteIds[], endings: unlockedEndingIds[], settings: { brightness, subtitles }, jumpscaresSurvived: N }
DO NOT store: monster positions, scare triggers, puzzle state (per-session)

10. BATTLE ROYALE:
{ version: 1, wins: N, kills: N, topPlacements: N, cosmetics: { skins, trails, emotes }, battlePass: { tier, xp, premium }, settings: { sensitivity, keybinds }, stats: { gamesPlayed, avgPlacement } }
DO NOT store: match state, zone position, other players' loadouts, loot positions

─── DATASTORE KEY STRATEGIES ───

SINGLE KEY PER PLAYER (recommended for most games):
Key: "Player_" .. tostring(userId)
Value: entire save data table (JSON serialized)
Pros: One read on join, one write on leave, atomic saves
Cons: 4MB limit (rarely an issue — most saves are 10-100KB), all-or-nothing save

MULTIPLE KEYS PER PLAYER (for large/complex games):
Keys: "Player_" .. userId .. "_Core", "Player_" .. userId .. "_Inventory", "Player_" .. userId .. "_Housing"
Pros: Can save subsystems independently, larger total capacity, partial load
Cons: Multiple reads on join, multiple writes on leave, potential inconsistency between keys

RECOMMENDATION: Start with single key. Only split if approaching 4MB or need independent save rates.

─── SESSION LOCKING PATTERN ───

PURPOSE: Prevent data loss when player joins new server before old server saves.

PATTERN:
1. On PlayerAdded: attempt to set a session lock in DataStore (key: "Lock_" .. userId, value: { serverId, lockTime })
2. Use UpdateAsync to atomically check if lock exists from another server
3. If lock exists and is < 30 seconds old: WAIT and retry (old server still saving)
4. If lock exists and is > 30 seconds old: STEAL lock (old server likely crashed)
5. If no lock: SET lock and proceed to load data
6. On PlayerRemoving: SAVE data, then RELEASE lock (set to nil)
7. On server shutdown (game:BindToClose): save ALL active players, release ALL locks

CRITICAL: Use UpdateAsync (NOT SetAsync) for lock operations — it provides atomic read-modify-write.

CODE CONCEPT:
local function acquireSessionLock(userId)
  local lockKey = "Lock_" .. tostring(userId)
  local acquired = false
  local retries = 0

  while not acquired and retries < 10 do
    local success = pcall(function()
      DataStore:UpdateAsync(lockKey, function(oldValue)
        if oldValue == nil or (os.time() - oldValue.lockTime > 30) then
          acquired = true
          return { serverId = game.JobId, lockTime = os.time() }
        else
          acquired = false
          return oldValue  -- don't change, another server has lock
        end
      end)
    end)
    if not acquired then
      retries += 1
      task.wait(2)
    end
  end
  return acquired
end

─── DATA MIGRATION (VERSIONING) ───

Every save MUST have a version field. When schema changes:

local CURRENT_VERSION = 3

local migrations = {
  [1] = function(data) -- v1 → v2: Added pets system
    data.pets = {}
    data.version = 2
    return data
  end,
  [2] = function(data) -- v2 → v3: Changed inventory from array to dict
    local newInventory = {}
    for i, item in data.inventory do
      newInventory[tostring(i)] = item
    end
    data.inventory = newInventory
    data.version = 3
    return data
  end,
}

local function migrateData(data)
  while data.version < CURRENT_VERSION do
    local migrator = migrations[data.version]
    if migrator then
      data = migrator(data)
    else
      warn("Missing migration for version", data.version)
      break
    end
  end
  return data
end

─── CACHING STRATEGY ───

Cache in server memory (module-scope table), read from DataStore only on:
1. Player join (initial load)
2. Explicit refresh request (rare — admin command, force reload)
3. Cross-server data request (check if stale, > 5 minute cache = refresh)

NEVER read DataStore during gameplay loops. Cache everything on join.
Write to DataStore on: Player leave, periodic auto-save (every 5 minutes), critical transactions (purchase), server shutdown.

Caching pattern:
local playerDataCache = {} -- { [userId]: { data: {}, dirty: bool, lastSave: N } }

function getData(userId) return playerDataCache[userId] and playerDataCache[userId].data end
function setDirty(userId) if playerDataCache[userId] then playerDataCache[userId].dirty = true end end
function needsSave(userId) return playerDataCache[userId] and playerDataCache[userId].dirty end

─── BACKUP STRATEGY ───

PRIMARY: DataStore "PlayerData"
SECONDARY: DataStore "PlayerData_Backup" — written to every 10 minutes (staggered per player to spread load)
TERTIARY: OrderedDataStore "PlayerData_Versions" — store timestamp of each save for point-in-time recovery

On load failure from primary:
1. Try primary 3 times with 2-second delay
2. If all fail: load from backup
3. If backup fails: create fresh data (NEVER let player play with nil data)
4. Log the failure for admin investigation

─── ORDERED DATASTORE FOR LEADERBOARDS ───

Efficient update pattern:
- Don't write on every stat change. Batch: update leaderboard every 60 seconds per player.
- Use pcall wrapper — OrderedDataStore has strict rate limits.
- Page size: GetSortedAsync(ascending=false, pageSize=100) for top 100.
- Player's own rank: no direct "get rank" API. Two approaches:
  A) Page through until found (expensive, avoid)
  B) Maintain approximate rank in regular DataStore, updated periodically
  C) Use a second OrderedDataStore sorted oppositely and count entries above

RATE LIMITS: 60 + (numPlayers * 10) requests per minute total for all DataStore types combined.
Ordered-specific: GetSortedAsync pages cost 1 request each. SetAsync costs 1 per write.

─── CROSS-SERVER DATA ───

MessagingService: fire-and-forget messages to all servers. Max 1KB per message, 150+60*numPlayers requests/min.
Use for: global announcements, cross-server trade notifications, guild updates, server shutdown notices.

MemoryStoreService: shared in-memory data across servers. Much faster than DataStore but data expires (max 45 days).
SortedMap: key-value with sorted access. Perfect for auction house, matchmaking queue.
Queue: FIFO queue for task distribution across servers.
HashSet: fast membership checks.

Use for: auction house listings, matchmaking queue, global events, server browser.

─── LARGE DATA HANDLING (4MB limit) ───

Most games never hit this. But if you do:
1. Split into multiple keys (see key strategies above)
2. Compress data: remove default values (if sword damage == default, don't store it)
3. Use short keys: { s = 10 } not { strength = 10 } (save bytes)
4. Chunk large arrays: if housing has 1000+ furniture items, store in chunks of 200
5. Purge old data: transaction logs older than 7 days, completed quests older than 30 days

Never store raw CFrame in DataStore — convert to { x, y, z, rx, ry, rz } (6 numbers instead of 12).
Never store Color3 as object — convert to { r, g, b } or hex string.
Never store Instance references — store IDs that map to instances.

─── CONFIGURATION DATA ───

Game settings that affect ALL players (spawn rates, shop prices, event toggles):
- Store in a separate DataStore "GameConfig" with key "Settings"
- Load on server start, cache forever
- Only writable by admin commands or dashboard
- Broadcast changes to all servers via MessagingService

Pattern:
local CONFIG_STORE = DataStoreService:GetDataStore("GameConfig")
local cachedConfig = nil

function getConfig()
  if not cachedConfig then
    cachedConfig = CONFIG_STORE:GetAsync("Settings") or DEFAULT_CONFIG
  end
  return cachedConfig
end
`

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SECTION 3: CLIENT-SERVER COMMUNICATION PATTERNS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const CLIENT_SERVER_PATTERNS = `
=== CLIENT-SERVER COMMUNICATION PATTERNS ===

─── 20 COMMON RemoteEvent PATTERNS (fire-and-forget) ───

1. DAMAGE NOTIFICATION (server→client): Server fires to damaged player with { amount, source, type, isCrit }. Client shows damage number, screen flash, sound.

2. CHAT MESSAGE (client→server→clients): Client fires with { message, channel }. Server filters, validates, routes to appropriate recipients.

3. ANIMATION PLAY (server→clients): Server fires to nearby clients with { animationId, character, speed }. Clients play animation on specified character.

4. SOUND EFFECT (server→clients): Server fires to nearby clients with { soundId, position, volume, pitch }. Clients play spatial sound.

5. PARTICLE EFFECT (server→clients): Server fires to nearby clients with { effectType, position, color, duration }. Clients create particle emitter.

6. UI NOTIFICATION (server→client): Server fires with { title, message, type: "info"|"success"|"warning"|"error", duration }. Client shows toast.

7. STATE CHANGE (server→clients): Server fires with { objectId, property, value }. Clients update local visual state (door opened, light toggled).

8. QUEST PROGRESS (server→client): Server fires with { questId, objectiveIndex, current, required }. Client updates quest tracker.

9. INVENTORY UPDATE (server→client): Server fires with { action: "add"|"remove"|"update", slotIndex, itemData }. Client updates inventory UI.

10. CURRENCY CHANGE (server→client): Server fires with { type, newAmount, change, source }. Client updates HUD, shows +/- animation.

11. LEVEL UP (server→client): Server fires with { newLevel, rewards, statPoints }. Client shows level-up celebration.

12. ACHIEVEMENT UNLOCK (server→client): Server fires with { achievementId, tier, rewards }. Client shows achievement toast.

13. PLAYER INPUT (client→server): Client fires with { action: "jump"|"ability"|"interact", data }. Server validates and processes.

14. EMOTE PLAY (client→server→clients): Client requests emote. Server validates cooldown, fires to all nearby clients to play animation.

15. BUILD PLACEMENT (client→server): Client fires with { itemId, CFrame }. Server validates position, creates object, confirms to client.

16. VOTE CAST (client→server): Client fires with { voteOption }. Server records vote, broadcasts updated tallies.

17. READY CHECK (bidirectional): Server fires "ready check" to all. Clients fire back "ready" or "not ready". Server tallies.

18. KNOCKBACK (server→client): Server fires with { direction, force }. Client applies visual knockback (server has already moved character).

19. SCREEN EFFECT (server→client): Server fires with { effect: "shake"|"flash"|"blur", intensity, duration }. Client applies post-processing effect.

20. DEATH/RESPAWN (server→client): Server fires with { killerName, deathType, respawnTime }. Client shows death screen.

─── 10 COMMON RemoteFunction PATTERNS (request-response) ───

1. BUY ITEM: Client requests { shopId, itemId, quantity }. Server validates affordability, stock, returns { success, newBalance, item }.

2. SELL ITEM: Client requests { itemId, quantity }. Server validates ownership, calculates price, returns { success, amountEarned }.

3. GET INVENTORY: Client requests {}. Server returns full inventory data. Used on UI open, NOT every frame.

4. CHECK AFFORDABILITY: Client requests { itemId }. Server returns { canAfford, price, missingAmount }. Used for UI display.

5. GET LEADERBOARD: Client requests { category, page }. Server fetches from OrderedDataStore, returns { entries: {rank, name, score}[], totalPages }.

6. VALIDATE PLACEMENT: Client requests { itemId, CFrame }. Server checks bounds and collisions, returns { valid, reason }.

7. GET QUEST LIST: Client requests { filter: "available"|"active"|"completed" }. Server returns filtered quest data.

8. GET PLAYER STATS: Client requests { targetUserId }. Server returns public stats { level, class, guild, achievements }.

9. TRADE OFFER: Client requests { targetUserId, offeredItems }. Server validates items, returns { tradeId, status }.

10. CRAFT PREVIEW: Client requests { recipeId }. Server returns { canCraft, missingMaterials, craftTime, output }.

─── RATE LIMITING ───

Pattern for per-remote, per-player rate limiting:

local rateLimits = {} -- { [player]: { [remoteName]: { count: N, resetTime: N } } }

local function checkRateLimit(player, remoteName, maxPerSecond)
  local userId = player.UserId
  rateLimits[userId] = rateLimits[userId] or {}
  rateLimits[userId][remoteName] = rateLimits[userId][remoteName] or { count = 0, resetTime = os.clock() + 1 }

  local limit = rateLimits[userId][remoteName]
  if os.clock() > limit.resetTime then
    limit.count = 0
    limit.resetTime = os.clock() + 1
  end

  limit.count += 1
  if limit.count > maxPerSecond then
    return false -- rate limited
  end
  return true
end

-- Usage in remote handler:
RemoteEvent.OnServerEvent:Connect(function(player, ...)
  if not checkRateLimit(player, "BuyItem", 5) then return end
  -- process request
end)

Recommended rate limits by remote type:
- Movement/input: 60/sec (matches Heartbeat rate)
- Combat actions: 10-20/sec
- UI actions (buy, sell, equip): 5/sec
- Chat messages: 3/sec
- Admin commands: 5/sec
- Expensive queries (leaderboard, search): 1/sec

─── PAYLOAD VALIDATION ───

ALWAYS validate EVERY field of client-sent data. Exploiters can send ANYTHING.

Validation checklist for every remote:
1. Type check: typeof(value) matches expected type
2. Range check: numbers within acceptable bounds
3. Enum check: string is one of allowed values
4. Nil check: required fields are not nil
5. Length check: strings within max length
6. Instance check: references point to valid game objects
7. Ownership check: player owns the thing they're acting on
8. Proximity check: player is near the thing they're interacting with
9. State check: action is valid in current game state
10. Cooldown check: enough time has passed since last action

Validation utility pattern:
local function validatePayload(data, schema)
  for field, rules in schema do
    local value = data[field]
    if rules.required and value == nil then return false, field .. " is required" end
    if value ~= nil then
      if rules.type and typeof(value) ~= rules.type then return false, field .. " wrong type" end
      if rules.min and value < rules.min then return false, field .. " below minimum" end
      if rules.max and value > rules.max then return false, field .. " above maximum" end
      if rules.enum and not table.find(rules.enum, value) then return false, field .. " invalid value" end
      if rules.maxLen and #tostring(value) > rules.maxLen then return false, field .. " too long" end
    end
  end
  return true, nil
end

─── BATCHING (MULTIPLE UPDATES IN ONE REMOTE) ───

Instead of firing 10 separate remotes for 10 inventory changes:

BAD:
for each change do
  InventoryUpdate:FireClient(player, change)
end

GOOD:
local batch = {}
for each change do
  table.insert(batch, change)
end
InventoryUpdate:FireClient(player, batch)

Client processes batch:
InventoryUpdate.OnClientEvent:Connect(function(changes)
  for _, change in changes do
    updateSlot(change.slot, change.item)
  end
end)

Batching rules:
- Batch UI updates that happen in same frame
- Batch NPC state updates for nearby NPCs (send one remote with all NPC data)
- Batch particle effects that trigger simultaneously
- Max batch size: ~50KB per remote fire (Roblox limits)
- Update frequency: 10-20 times per second max for continuous data (positions), 1-5 for events

─── CLIENT PREDICTION ───

For responsive feel, client predicts outcome and server corrects:

1. Client fires action (e.g., swing sword)
2. Client IMMEDIATELY plays animation and shows hit effect (prediction)
3. Server processes action, determines actual result
4. Server sends confirmation or correction
5. Client adjusts if prediction was wrong (rare for most actions)

Where to use prediction:
- Movement (client moves, server validates)
- Combat animations (play immediately, server confirms hit)
- Item pickup (play pickup animation, server confirms)
- UI interactions (optimistic update, server confirms)

Where NOT to use prediction:
- Currency changes (wait for server confirmation)
- Inventory changes (wait for server)
- Quest completion (wait for server)
- Any irreversible action (wait for server)

─── REPLICATION STRATEGY ───

What to replicate via remotes vs compute locally:

REPLICATE (server→client):
- Other players' health (for overhead health bars)
- Object state changes (doors, switches, traps)
- NPC positions and states (every 0.2-0.5 seconds, interpolate on client)
- Score/leaderboard updates
- Weather and time-of-day changes

COMPUTE LOCALLY:
- Camera position and rotation (never replicate camera)
- UI state (hover, scroll, input)
- Particle effects (server says "play fire at position", client creates particles)
- Sound effects (server says "play sound", client creates sound)
- Visual interpolation (smooth movement between server updates)

NEVER REPLICATE:
- Every frame of movement (too much bandwidth — let Roblox handle character replication)
- Mouse position (only send when needed, e.g., aiming)
- Internal client state (selected tab, scroll position)

─── ERROR HANDLING ───

RemoteFunction error handling:
-- Server
RemoteFunction.OnServerInvoke = function(player, ...)
  local success, result = pcall(function()
    return processRequest(player, ...)
  end)
  if not success then
    warn("[Remote Error]", result)
    return { success = false, error = "Server error" } -- generic message to client
  end
  return result
end

-- Client
local success, result = pcall(function()
  return RemoteFunction:InvokeServer(data)
end)
if not success then
  -- Server errored or timed out
  showErrorToast("Request failed, try again")
end

RemoteEvent fire-and-forget: no response needed, but server should:
1. pcall the handler (never let one player's bad data crash server)
2. Log errors with player info for debugging
3. Track error frequency per player (high error rate = likely exploiter)

─── SECURITY RULES — 20 THINGS TO VALIDATE ───

1. NEVER trust client-reported damage values (server calculates damage)
2. NEVER trust client-reported health values (server tracks health)
3. NEVER trust client-reported currency amounts (server tracks balance)
4. NEVER trust client-reported XP gains (server awards XP)
5. NEVER trust client-reported item IDs that don't exist in ItemDatabase
6. NEVER trust client-reported positions without proximity validation
7. NEVER trust client-reported timestamps (use server os.time())
8. NEVER trust client-reported other-player IDs without relationship verification
9. NEVER trust client-reported cooldown states (server tracks cooldowns)
10. NEVER trust client-reported inventory contents (server is authoritative)
11. ALWAYS validate that the player sending the remote is who they claim to be (first arg is always the player)
12. ALWAYS validate action is possible in current game state (can't buy from shop while dead)
13. ALWAYS validate target exists and is valid (NPC exists, item exists, player exists)
14. ALWAYS validate quantities are positive integers (no negative, no float, no zero for most actions)
15. ALWAYS validate string inputs against max length and character whitelist
16. ALWAYS validate CFrame values are finite (check for NaN, Inf using value == value and value ~= math.huge)
17. ALWAYS rate-limit every remote (see rate limiting section)
18. ALWAYS pcall remote handlers (malformed data shouldn't crash server)
19. ALWAYS log suspicious activity (don't just reject — track patterns)
20. ALWAYS use UpdateAsync for atomic operations (not separate Get + Set which has race conditions)

─── DEBUGGING REMOTES ───

Development-only debug system:
local DEBUG_REMOTES = false -- set true during development

local function wrapRemote(remote, handler)
  remote.OnServerEvent:Connect(function(player, ...)
    if DEBUG_REMOTES then
      print(string.format("[REMOTE] %s fired by %s with args:", remote.Name, player.Name), ...)
    end
    local success, err = pcall(handler, player, ...)
    if not success then
      warn(string.format("[REMOTE ERROR] %s from %s: %s", remote.Name, player.Name, err))
    end
  end)
end

Production logging: only log errors and suspicious patterns, not every remote fire.
Use a ring buffer (last 100 events per player) for crash investigation.
`

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SECTION 4: UI DESIGN PATTERNS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const UI_PATTERNS = `
=== UI DESIGN PATTERNS FOR ROBLOX LUAU ===

─── LAYOUT PATTERNS ───

TOP BAR (always visible HUD):
- Position: UDim2.new(0, 0, 0, 0), Size: UDim2.new(1, 0, 0, 48)
- Contents: Currency display (left), level/XP bar (center), settings button (right)
- Background: Semi-transparent black (0, 0, 0) with 0.3 transparency
- Use UIListLayout (Horizontal, Center) for auto-spacing
- Each element has UIPadding of 8px

BOTTOM BAR (action bar / ability bar):
- Position: UDim2.new(0.5, 0, 1, -60), Size: UDim2.new(0, 400, 0, 52), AnchorPoint: (0.5, 1)
- Contents: 4-8 ability/item slots in a row
- Each slot: 48x48 with 4px gap, rounded corners (UICorner 6px)
- Keybind label in top-left of each slot (Font: GothamBold, Size 10)
- Cooldown overlay: dark semi-transparent sweep animation

SIDE PANEL (inventory, quest log, character sheet):
- Position: UDim2.new(1, -320, 0, 60), Size: UDim2.new(0, 300, 0.8, -120)
- Slide in from right with TweenService (0.3 seconds, Quad EaseOut)
- Close button in top-right corner
- Scrollable content with UIListLayout (Vertical, 8px padding)
- Header bar with title and category tabs

MODAL / POPUP (confirmation, settings):
- Position: UDim2.new(0.5, 0, 0.5, 0), AnchorPoint: (0.5, 0.5)
- Size: UDim2.new(0, 400, 0, 300) — never more than 80% screen
- Background overlay: full-screen Frame with BackgroundTransparency 0.5, black
- Content centered in modal
- Close on background click or X button
- Entrance: Scale from 0.8 to 1 with 0.2s Back EaseOut

FULLSCREEN (shop, character creation, map):
- Size: UDim2.new(1, 0, 1, 0) with UIPadding of 48 on all sides
- Dim/blur the game world behind (not possible natively — use a dark overlay)
- Clear navigation: back button in top-left, title in top-center
- Transition: Fade in 0.3s

SPLIT VIEW (trade, comparison):
- Two panels side by side: left UDim2.new(0, 0, 0, 0) Size(0.5, 0, 1, 0), right UDim2.new(0.5, 0, 0, 0) Size(0.5, 0, 1, 0)
- Divider line between (1px Frame)
- Each panel independently scrollable

─── NAVIGATION PATTERNS ───

TABS: Horizontal row of TextButtons at top of panel.
- Active tab: bold text, bright color, underline (Frame below, 2px height)
- Inactive tab: normal text, dim color
- Switch content container below based on selected tab
- Max 5 tabs visible (use scroll for more)

BREADCRUMBS: For deep navigation (Shop > Weapons > Swords > Legendary):
- Horizontal text: "Shop > Weapons > Swords"
- Each segment is clickable TextButton
- Current page is not clickable (just TextLabel)
- Separator: " > " or " / "

BACK BUTTON: Top-left of any secondary screen.
- TextButton with "< Back" or arrow icon
- Returns to previous screen (maintain a navigation stack)

PAGE TRANSITIONS:
- Slide: current page slides out left, new page slides in from right
- Fade: current page fades out, new page fades in
- Duration: 0.2-0.3 seconds, avoid longer (feels sluggish)

─── INPUT COMPONENTS ───

BUTTON:
- Size: minimum 120x40 for desktop, 160x48 for mobile
- States: Default (normal color), Hover (slightly lighter, +5%), Press (slightly darker, scale to 0.95), Disabled (gray, 50% transparency)
- UICorner: 8px radius
- UIStroke: 1-2px border for secondary buttons
- Text: GothamBold, 16px, centered
- Sound: subtle click on press

TOGGLE:
- Size: 48x24 pill shape (UICorner = 12)
- Knob: 20x20 circle, slides left/right with tween
- ON: green background (#4ade80), knob right
- OFF: gray background (#6b7280), knob left
- Transition: 0.15s Quad EaseInOut

SLIDER:
- Track: 200x4 Frame, gray
- Fill: same size but colored, ClipDescendants with inner frame
- Knob: 16x16 circle on track, draggable
- Value label above or beside
- Snap to increments if needed

DROPDOWN:
- Closed: button showing selected value + down arrow
- Open: list below button with max 5 visible items + scroll
- Close on: select item, click outside, press Escape
- Selected item highlighted in list

TEXT INPUT:
- Use TextBox with placeholder text (PlaceholderText property)
- Size: full width of container, 40px height
- Border: 1px UIStroke, focus = blue border
- Max length: set via script (MaxLength property doesn't exist — truncate in Changed event)
- Clear button (X) on right when text present

SEARCH:
- TextInput with magnifying glass icon on left
- Debounced search: wait 0.3 seconds after typing stops before filtering
- Clear button on right
- Results update in real-time below

CHECKBOX:
- 20x20 square with rounded corners (UICorner 4px)
- Unchecked: border only
- Checked: filled with checkmark icon (✓)
- Label text to the right, clickable (whole row is clickable)

─── FEEDBACK PATTERNS ───

LOADING SPINNER:
- Circular indicator using ImageLabel with rotating animation
- Or custom: 3 dots bouncing in sequence
- Position: center of loading area
- Pair with "Loading..." text below

PROGRESS BAR:
- Background track: full width, gray, rounded corners
- Fill bar: left-aligned, colored (green/blue), rounded corners, ClipDescendants
- Width tweens to target value (0.3s Quad EaseOut)
- Optional percentage text inside or above
- Determinate (known progress) vs indeterminate (unknown — animated stripe pattern)

SUCCESS/ERROR TOAST:
- Position: top-center, UDim2.new(0.5, 0, 0, 16), AnchorPoint(0.5, 0)
- Entrance: slide down from above + fade in (0.2s)
- Duration: 3 seconds
- Exit: slide up + fade out (0.2s)
- Color: green for success, red for error, yellow for warning, blue for info
- Icon + text in horizontal layout
- Stack multiple toasts vertically

CONFIRMATION DIALOG:
- Modal with question text, two buttons: Confirm (primary color) and Cancel (gray)
- For dangerous actions (delete, sell all): make confirm button red, add "Type 'CONFIRM' to proceed"
- Auto-close after 30 seconds (treat as cancel)

─── ANIMATION PATTERNS ───

ENTRANCE ANIMATIONS:
- Slide In: start offscreen (X or Y offset), tween to final position. Duration 0.2-0.4s, Quad EaseOut
- Fade In: start at Transparency 1, tween to target transparency. Duration 0.2-0.3s
- Scale In: start at Size = 0 or Scale 0.8, tween to full size. Duration 0.2-0.3s, Back EaseOut (slight overshoot)
- Pop In: scale 0 → 1.1 → 1.0, two tweens chained. Total 0.3s

EXIT ANIMATIONS:
- Reverse of entrance (slide out, fade out, scale down)
- Slightly faster than entrance (0.15-0.25s)
- After animation completes: set Visible = false or Destroy

HOVER:
- Glow: increase ImageTransparency of glow overlay from 1 to 0.5
- Lift: tween Position.Y up by -4px and add drop shadow
- Color shift: tween BackgroundColor3 to slightly lighter shade
- Duration: 0.1-0.15s

PRESS:
- Squish: tween Size to 95% with AnchorPoint at center
- Darken: tween BackgroundColor3 to slightly darker shade
- Duration: 0.05-0.1s
- Bounce back on release: tween to 100% Size, 0.1s

CONTINUOUS:
- Pulse: loop Scale 1.0 → 1.05 → 1.0 (for attention/notification badges)
- Float: loop Position.Y ±4px (for floating items, pickups)
- Rotate: loop Rotation 0 → 360 (for loading spinners, collectibles)
- Glow pulse: loop ImageTransparency 0.3 → 0.7 → 0.3 (for interactive elements)

─── RESPONSIVE DESIGN ───

Mobile vs Desktop:
- Detect: UserInputService.TouchEnabled
- Mobile: larger buttons (minimum 48x48 touch target), bottom-aligned controls
- Desktop: smaller buttons OK (32x32 minimum), keyboard shortcuts shown
- Scale UI: Use Scale (UDim2 Scale components) for percentage-based sizing
- Breakpoints: screen width < 600px = mobile layout, > 600px = desktop layout

Touch targets:
- Minimum 44x44 pixels for touch (Apple HIG guideline)
- Add invisible hit area padding if visual button is smaller
- Space between touch targets: minimum 8px

Text scaling:
- Use TextScaled = true with UITextSizeConstraint (MinTextSize = 10, MaxTextSize = 24)
- Or fixed sizes: mobile = -2 from desktop size
- Never go below 12px for readability

─── COLOR SYSTEM ───

Define once, reference everywhere:
local Theme = {
  Primary = Color3.fromRGB(59, 130, 246),    -- Blue
  Secondary = Color3.fromRGB(99, 102, 241),   -- Indigo
  Success = Color3.fromRGB(34, 197, 94),       -- Green
  Warning = Color3.fromRGB(234, 179, 8),       -- Yellow
  Error = Color3.fromRGB(239, 68, 68),         -- Red

  BgPrimary = Color3.fromRGB(15, 15, 20),     -- Near black
  BgSecondary = Color3.fromRGB(25, 25, 35),   -- Dark gray
  BgTertiary = Color3.fromRGB(40, 40, 55),    -- Medium dark

  TextPrimary = Color3.fromRGB(255, 255, 255), -- White
  TextSecondary = Color3.fromRGB(156, 163, 175), -- Gray
  TextMuted = Color3.fromRGB(107, 114, 128),    -- Dim gray

  Border = Color3.fromRGB(55, 65, 81),        -- Subtle border

  Rarity = {
    Common = Color3.fromRGB(156, 163, 175),    -- Gray
    Uncommon = Color3.fromRGB(34, 197, 94),    -- Green
    Rare = Color3.fromRGB(59, 130, 246),       -- Blue
    Epic = Color3.fromRGB(168, 85, 247),       -- Purple
    Legendary = Color3.fromRGB(234, 179, 8),   -- Gold
    Mythic = Color3.fromRGB(239, 68, 68),      -- Red
  }
}

─── TYPOGRAPHY ───

Font families (Roblox Enum.Font):
- Headers: GothamBold (or GothamBlack for extra emphasis)
- Body text: Gotham (GothamMedium for slightly bolder)
- Monospace/code: RobotoMono
- Decorative: Bangers, FredokaOne, LuckiestGuy (for game titles)

Size scale:
- Title (H1): 28-32px
- Section header (H2): 22-24px
- Subsection (H3): 18-20px
- Body: 16px (default, most readable)
- Caption: 14px
- Label/Badge: 12px
- Fine print: 10px (minimum readable)

Line spacing: TextLabel has no line-height control. For multi-line, use multiple TextLabels stacked with 4px gap.

─── SPACING (4px grid) ───

All spacing values should be multiples of 4:
- Tight: 4px (between icon and label)
- Small: 8px (between list items, inner padding)
- Medium: 12px (between sections)
- Normal: 16px (standard padding)
- Large: 24px (between major sections)
- XLarge: 32px (page margins)
- XXLarge: 48px (between page sections)

UIPadding values: always 8, 12, or 16 for containers.
UIListLayout Padding: 4 for tight lists, 8 for normal, 12 for spaced.

─── COMMON GAME GUI LAYOUTS ───

HUD LAYOUT (always on screen):
┌──────────────────────────────────────────────────┐
│ [♥ 100/100]  [⚡ 50/50]    [Level 15]  [⚙ ☰] │  ← Top bar
│                                                   │
│                                          [Quest]  │  ← Right side tracker
│                                          [├─ Kill] │
│                                          [└─ 5/10]│
│                                                   │
│                                                   │
│                                                   │
│ [Chat]                                            │  ← Bottom left
│ ─────────                                         │
│ [1][2][3][4][5][6]              [Jump][Dash]      │  ← Bottom bar
└──────────────────────────────────────────────────┘

Top bar items:
- Health: UDim2.new(0, 16, 0, 8), Size(0, 150, 0, 32)
- Mana: UDim2.new(0, 180, 0, 8), Size(0, 120, 0, 32)
- Level: UDim2.new(0.5, -50, 0, 8), Size(0, 100, 0, 32)
- Settings: UDim2.new(1, -80, 0, 8), Size(0, 64, 0, 32)

SHOP LAYOUT:
┌──────────────────────────────────────────────────┐
│ [< Back]        SHOP TITLE          [Your Coins] │
│ ────────────────────────────────────────────────  │
│ [All] [Weapons] [Armor] [Potions] [Special]      │  ← Category tabs
│ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐             │
│ │ Icon │ │ Icon │ │ Icon │ │ Icon │              │  ← Item grid
│ │ Name │ │ Name │ │ Name │ │ Name │              │
│ │$100  │ │$250  │ │$500  │ │$1000 │              │
│ └──────┘ └──────┘ └──────┘ └──────┘              │
│ ┌──────┐ ┌──────┐                                │
│ │ Icon │ │ Icon │        [ITEM DETAILS PANEL]    │  ← Selected item info
│ │ Name │ │ Name │        Name: Iron Sword        │
│ │$1500 │ │$2000 │        Attack: +15             │
│ └──────┘ └──────┘        Req Level: 5            │
│                           [BUY - $250]           │
└──────────────────────────────────────────────────┘

INVENTORY LAYOUT:
┌──────────────────────────────────────────────────┐
│ INVENTORY               [Sort ▼] [Search 🔍]    │
│ [All] [Weapons] [Armor] [Materials] [Quest]      │
│ ┌────┐┌────┐┌────┐┌────┐┌────┐┌────┐┌────┐     │
│ │item││item││item││item││item││item││item│      │  ← 7 columns
│ │ x1 ││ x5 ││x12 ││ x1 ││ x3 ││ x1 ││ x8 │     │
│ └────┘└────┘└────┘└────┘└────┘└────┘└────┘      │
│ ┌────┐┌────┐┌────┐┌────┐┌────┐┌────┐┌────┐     │
│ │item││item││item││    ││    ││    ││    │      │  ← Empty slots
│ │x99 ││ x1 ││ x2 ││    ││    ││    ││    │      │
│ └────┘└────┘└────┘└────┘└────┘└────┘└────┘      │
│                                                   │
│ Slots: 14/28          Total Weight: 45/100       │
└──────────────────────────────────────────────────┘

Item slot size: 64x64 with 4px gap. UIGridLayout with 7 columns.
`

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SECTION 5: PERFORMANCE OPTIMIZATION BIBLE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const PERFORMANCE_BIBLE = `
=== PERFORMANCE OPTIMIZATION BIBLE FOR ROBLOX ===

─── PART COUNT BUDGETS ───

Target frame rates: 60 FPS on PC, 30 FPS on mobile.

Part count guidelines by device:
- High-end PC: 50,000 parts comfortable, up to 100,000 with streaming
- Mid-range PC: 20,000-30,000 parts
- Mobile (high-end): 10,000-15,000 parts
- Mobile (low-end): 5,000-8,000 parts

Rules of thumb:
- Each part with a script: costs 10x a scriptless part in performance
- MeshParts: slightly cheaper than basic Parts for complex shapes (fewer triangles)
- Unions: expensive on first load (CSG computation), then similar to MeshParts
- Terrain: very efficient for large landscapes (voxel-based, LOD built-in)
- Transparent parts: more expensive than opaque (alpha sorting)
- Neon material: expensive (bloom post-processing)

Optimization strategies:
- Use StreamingEnabled (default in modern Roblox) for large worlds
- Set StreamingMinRadius and StreamingTargetRadius appropriately
- Anchor parts that don't need physics (Anchored = true)
- Use CollisionGroup to disable unnecessary collision checks
- Merge small detail parts into MeshParts where possible

─── INSTANCE.NEW OPTIMIZATION ───

CRITICAL: Set ALL properties BEFORE setting Parent. Every property change on a parented instance triggers replication/rendering updates.

BAD (12 replication events):
local part = Instance.new("Part")
part.Parent = workspace          -- triggers replication
part.Size = Vector3.new(4, 1, 8) -- triggers replication again
part.Position = Vector3.new(0, 5, 0) -- again
part.Color = Color3.new(1, 0, 0) -- again
part.Material = Enum.Material.Concrete -- again
part.Anchored = true             -- again

GOOD (1 replication event):
local part = Instance.new("Part")
part.Size = Vector3.new(4, 1, 8)
part.Position = Vector3.new(0, 5, 0)
part.Color = Color3.new(1, 0, 0)
part.Material = Enum.Material.Concrete
part.Anchored = true
part.Parent = workspace          -- ONE replication event with all properties

This applies to ALL instances: Parts, Frames, TextLabels, ParticleEmitters, etc.

─── EVENT CONNECTION CLEANUP ───

Every :Connect() returns a RBXScriptConnection. ALWAYS disconnect when done.

Pattern 1 — Manual tracking:
local connections = {}
table.insert(connections, part.Touched:Connect(onTouch))
table.insert(connections, player.CharacterAdded:Connect(onChar))

-- Cleanup:
for _, conn in connections do
  conn:Disconnect()
end
table.clear(connections)

Pattern 2 — Maid/Janitor class:
local Maid = {}
Maid.__index = Maid

function Maid.new()
  return setmetatable({ _tasks = {} }, Maid)
end

function Maid:Add(task)
  table.insert(self._tasks, task)
  return task
end

function Maid:Cleanup()
  for _, task in self._tasks do
    if typeof(task) == "RBXScriptConnection" then
      task:Disconnect()
    elseif typeof(task) == "Instance" then
      task:Destroy()
    elseif type(task) == "function" then
      task()
    end
  end
  table.clear(self._tasks)
end

-- Usage:
local maid = Maid.new()
maid:Add(part.Touched:Connect(handler))
maid:Add(particle) -- instance to destroy
-- Later:
maid:Cleanup() -- disconnects all, destroys all

COMMON LEAK: Forgetting to disconnect PlayerRemoving when player leaves.
COMMON LEAK: Creating new connections in Heartbeat without disconnecting old ones.
COMMON LEAK: Connecting to events on instances that get Destroyed but connection persists.

─── HEARTBEAT vs RENDERSTEPPED vs STEPPED ───

RunService.Heartbeat: fires AFTER physics simulation, 60 times/sec.
- Use for: game logic, AI updates, cooldown checks, periodic saves
- Server + Client
- Most common loop event

RunService.RenderStepped: fires BEFORE rendering, 60 times/sec.
- Use for: camera updates, UI that tracks 3D positions, visual-only effects
- CLIENT ONLY (errors on server)
- Avoid heavy computation (delays frame rendering)

RunService.Stepped: fires BEFORE physics, 60 times/sec.
- Use for: physics manipulation before simulation (applying forces)
- Server + Client
- Rarely needed — Heartbeat is usually better

Performance cost:
- Empty Heartbeat connection: ~0.001ms/frame
- Simple logic in Heartbeat: 0.01-0.1ms/frame
- Heavy logic in Heartbeat: avoid — use throttling (run every N frames)

Throttling pattern:
local frameCount = 0
RunService.Heartbeat:Connect(function(dt)
  frameCount += 1
  if frameCount % 3 == 0 then -- run every 3rd frame (20Hz instead of 60Hz)
    processAI()
  end
end)

─── SPATIAL QUERY OPTIMIZATION ───

From fastest to slowest:
1. workspace:Raycast() — single ray, very fast. Use for: line-of-sight, ground check, projectiles.
2. workspace:GetPartBoundsInBox(cframe, size) — find parts in box region. Use for: AoE detection, room detection.
3. workspace:GetPartBoundsInRadius(position, radius) — find parts in sphere. Use for: explosion radius, aggro range.
4. workspace:GetPartsInPart(part) — find overlapping parts. Use for: trigger zones, collision detection.
5. Region3 + workspace:FindPartsInRegion3() — DEPRECATED but still works. Prefer GetPartBoundsInBox.

RaycastParams for filtering:
local params = RaycastParams.new()
params.FilterType = Enum.RaycastFilterType.Exclude
params.FilterDescendantsInstances = { character, ignoreParts }
params.RespectCanCollide = false -- set true to only hit collidable parts

local result = workspace:Raycast(origin, direction * distance, params)
if result then
  print(result.Instance, result.Position, result.Normal)
end

OverlapParams for spatial queries:
local overlapParams = OverlapParams.new()
overlapParams.FilterType = Enum.RaycastFilterType.Exclude
overlapParams.FilterDescendantsInstances = { workspace.Map.Decorations }

local parts = workspace:GetPartBoundsInRadius(position, 20, overlapParams)

Performance tips:
- Cache RaycastParams/OverlapParams objects (don't create new each frame)
- Limit spatial query frequency (every 0.2-0.5s for AI, not every frame)
- Use collision groups instead of filter lists when possible (much faster)
- Reduce query range to minimum needed

─── MEMORY MANAGEMENT ───

1. Weak tables: prevent memory leaks from cached references.
   local cache = setmetatable({}, { __mode = "v" }) -- values are weak, GC'd when no other refs

2. Destroy properly: call :Destroy() on instances you're done with. This:
   - Disconnects all event connections on the instance
   - Removes from parent
   - Marks for garbage collection
   Just setting Parent = nil does NOT disconnect events.

3. Avoid circular references:
   BAD: objectA.ref = objectB; objectB.ref = objectA -- never GC'd
   FIX: use weak references or explicitly nil out refs when done

4. Table reuse: Instead of creating new tables every frame, reuse:
   local tempVector = {} -- reuse this table
   function getPos()
     tempVector[1], tempVector[2], tempVector[3] = part.Position.X, part.Position.Y, part.Position.Z
     return tempVector
   end

5. String interning: Lua interns short strings. Avoid creating many unique strings.
   BAD: "Player_" .. tostring(userId) .. "_Stat_" .. statName -- new string each call
   OK for occasional use, BAD in loops

─── NETWORK OPTIMIZATION ───

1. Minimize remote fires: batch updates (see communication patterns section).
2. Delta compression: only send CHANGES, not full state.
   BAD: send all 50 NPC positions every frame
   GOOD: send only NPCs whose position changed since last update
3. Reduce remote payload size:
   - Use short keys ({ h = 100 } not { health = 100 })
   - Omit default values
   - Round floats to needed precision (math.floor(value * 100) / 100 for 2 decimal places)
4. Remote fire frequency:
   - Continuous data (positions): max 20/second
   - Events (damage, pickup): as they happen
   - UI updates: max 5/second
   - Leaderboard: every 10-30 seconds
5. Replication settings: Set ReplicationFocus for important areas, StreamingEnabled for large maps.

─── RENDERING OPTIMIZATION ───

1. StreamingEnabled: enable for any map larger than 200x200 studs. Set reasonable radius.
2. Level of Detail (LOD): Roblox handles this automatically for MeshParts. For manual control, use RenderFidelity.
3. Render distance: move distant objects to ServerStorage or use streaming. Parts beyond render distance still cost memory if loaded.
4. Transparency sorting: minimize overlapping transparent parts (expensive alpha blend). Use opaque materials when possible.
5. Lighting: reduce number of PointLights/SpotLights. Each light adds a render pass. Use SurfaceLights for area lighting (cheaper). Max recommended: 20-30 dynamic lights visible at once.
6. Shadow settings: GlobalShadows is expensive. Reduce shadow map resolution in Lighting properties for better performance.
7. Post-processing: BloomEffect, BlurEffect, ColorCorrectionEffect — each adds render cost. Use sparingly on mobile.

─── PHYSICS OPTIMIZATION ───

1. Anchor everything that doesn't need to move: Anchored = true. Huge performance savings.
2. Collision groups: put non-interacting objects in groups that don't collide.
   PhysicsService:RegisterCollisionGroup("Drops")
   PhysicsService:CollisionGroupSetCollidable("Drops", "Drops", false) -- drops don't collide with each other
3. Massless parts: set Massless = true for parts welded to moving assemblies (clothing, accessories). Reduces physics calculations.
4. CanCollide vs CanTouch vs CanQuery:
   - CanCollide = false: physics ignores, saves collision calculation
   - CanTouch = false: Touched event doesn't fire, saves event overhead
   - CanQuery = false: spatial queries (Raycast, GetPartBoundsInBox) skip it, saves query time
5. WeldConstraint vs Motor6D: WeldConstraint is cheaper (no joint simulation). Use Motor6D only for animated joints.
6. Network ownership: server-owned physics = more accurate but more network traffic. Client-owned = responsive but exploitable. Set NetworkOwnership for vehicles/projectiles to the interacting player.

─── SCRIPT OPTIMIZATION ───

1. Cache service references:
   BAD: game:GetService("Players") -- every call has overhead
   GOOD: local Players = game:GetService("Players") -- once at top

2. Cache instance lookups:
   BAD: workspace.Map.Building.Door.Handle -- traverses tree each time
   GOOD: local handle = workspace.Map.Building.Door.Handle -- once

3. Avoid global lookups:
   BAD: print, wait, Vector3 -- global lookup each use
   GOOD: local print = print; local Vector3 = Vector3 -- localize once
   (Note: modern Luau optimizes most built-in globals, but still good practice)

4. Table operations:
   - table.insert at end: O(1) — fast
   - table.insert at beginning: O(n) — avoid
   - table.remove from end: O(1) — fast
   - table.remove from middle: O(n) — avoid, use swap-and-pop
   - Dictionary lookup: O(1) — very fast, prefer over array search

5. String concatenation:
   BAD in loops: str = str .. "more" -- creates new string each time, O(n²)
   GOOD: table.insert(parts, "more"); result = table.concat(parts) -- O(n)

6. Avoid closures in hot loops:
   BAD: for i = 1, 1000 do task.spawn(function() process(i) end) end -- 1000 closures
   GOOD: for i = 1, 1000 do processSync(i) end -- or use coroutine pool

7. Minimize closures in connections:
   Each :Connect(function() ... end) creates a closure. For frequently-connected events, define the function once:
   local function onTouch(hit) ... end
   part.Touched:Connect(onTouch) -- reuses same function reference

─── 20 COMMON LAG SOURCES AND FIXES ───

1. Too many unanchored parts → Anchor everything that doesn't need physics
2. Touched events on many parts → Use spatial queries instead of Touched for detection
3. while wait() do loops → Use Heartbeat or task.wait() with throttling
4. FindFirstChild in loops → Cache the reference once
5. Remote spam (client firing every frame) → Throttle client-side, rate-limit server-side
6. Creating instances in Heartbeat → Pool instances, reuse them
7. Large terrain writes → Chunk terrain generation across multiple frames
8. Too many PointLights → Reduce to 20-30 visible, use SurfaceLights
9. Unoptimized raycasts → Cache RaycastParams, reduce frequency, limit distance
10. Memory leaks from undisconnected events → Maid/Janitor pattern (see above)
11. Humanoid on non-character models → Don't add Humanoid to anything that's not a character
12. Excessive TweenService usage → Batch tweens, limit concurrent to 50
13. String building in loops → Use table.concat
14. Deep instance hierarchy traversal → Cache paths, use tags (CollectionService)
15. Physics on decorative parts → Set Anchored=true, CanCollide=false
16. Too many GUI elements → Virtualize scrolling lists (only render visible items)
17. Constant DataStore reads → Cache on join, never read during gameplay
18. Large script replication → Use ModuleScripts (loaded on demand)
19. Particle emitter with Rate=1000 → Max Rate=100, use Burst for impact effects
20. Calling GetChildren/GetDescendants in loops → Cache the list, update on ChildAdded/Removed

─── MICROPROFILER READING GUIDE ───

Open with Ctrl+F6 (or Ctrl+Shift+F6 for detailed).

Key labels to watch:
- "Heartbeat" — game logic scripts. Should be < 5ms total.
- "Render" — visual rendering. Should be < 8ms for 60fps (16ms total frame budget).
- "Physics" — physics simulation. Should be < 4ms.
- "Network Receive/Send" — remote traffic. Spikes = too many remotes.
- "GC" (Garbage Collection) — memory cleanup. Spikes = creating too many temporary objects.

If total frame time > 16ms: you're below 60fps. Find the biggest bar and optimize that system.

Profiling pattern:
debug.profilebegin("MySystem")
-- code to profile
debug.profileend()
-- Now "MySystem" shows up in MicroProfiler
`

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SECTION 6: EFFECT RECIPES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const EFFECT_RECIPES = `
=== 50 VISUAL/AUDIO EFFECT RECIPES ===
Each recipe: technique, exact properties, duration, paired sound, when to use.

1. FIRE:
Technique: ParticleEmitter on attachment inside part.
Properties: Texture = "rbxassetid://296874871", Color = ColorSequence: orange→red, Size = NumberSequence: 2→0, Lifetime = NumberRange(0.5, 1), Rate = 50, Speed = NumberRange(3, 5), SpreadAngle = Vector2.new(30, 30), LightEmission = 1, LightInfluence = 0.
Duration: Continuous while active.
Sound: Crackling fire loop (rbxassetid://148878166 or similar).
Use: Campfires, burning buildings, fire spell, lava areas, fire enchant on weapons.

2. SMOKE:
Technique: ParticleEmitter.
Properties: Texture = "rbxassetid://296874871" (same cloud), Color = ColorSequence: gray, Size = NumberSequence: 1→5 (grows), Lifetime = NumberRange(2, 4), Rate = 20, Speed = NumberRange(1, 3), Transparency = NumberSequence: 0→1 (fades out), Drag = 2.
Duration: Continuous.
Sound: None (or subtle hiss).
Use: Chimneys, aftermath of explosion, fog machine, cooking pot, steam vents.

3. STEAM:
Technique: ParticleEmitter.
Properties: Texture = cloud, Color = white, Size = NumberSequence: 0.5→2, Lifetime = NumberRange(1, 2), Rate = 30, Speed = NumberRange(2, 5) (upward), Transparency = NumberSequence: 0.3→1, LightEmission = 0.5.
Duration: Continuous.
Sound: Hissing steam.
Use: Hot springs, cooking, industrial pipes, geyser.

4. EXPLOSION:
Technique: Part-based (sphere) + ParticleEmitter burst + PointLight flash.
Properties: Sphere part scales from 1→20→0 over 0.5 seconds (TweenService). Fire-colored particles with Burst(0, 50, 0). PointLight Range 30→0, Brightness 5→0 over 0.3 seconds. Debris: small parts flying outward with random rotation.
Duration: 0.5-1 second.
Sound: BOOM (rbxassetid://262562442 or similar).
Use: Grenade, death explosion, building destruction, rocket impact, firework.

5. MAGIC SPARKLE:
Technique: ParticleEmitter with sparkle texture.
Properties: Texture = rbxassetid://6490035152 (star/sparkle), Color = ColorSequence: match element color (blue for ice, red for fire), Size = NumberSequence: 0.3→0, Lifetime = NumberRange(0.3, 0.8), Rate = 40, Speed = NumberRange(1, 3), SpreadAngle = Vector2.new(180, 180), LightEmission = 1, Rotation = NumberRange(0, 360), RotSpeed = NumberRange(-200, 200).
Duration: While casting or enchanted.
Sound: Subtle chime/shimmer.
Use: Enchanting, magic aura, fairy dust, item glow, spell charge.

6. HEAL GLOW:
Technique: ParticleEmitter (green rising particles) + Part glow.
Properties: Color = green ColorSequence, Texture = cross or plus shape, Size = NumberSequence: 0.5→0, Speed = NumberRange(3, 6) (upward), Rate = 30, LightEmission = 1. Wrap character in semi-transparent green sphere that fades.
Duration: 1-2 seconds.
Sound: Gentle chime ascending tone.
Use: Healing spell, potion use, regeneration, health restore.

7. LEVEL UP BURST:
Technique: Ring of particles expanding outward + vertical pillar of light.
Properties: Emitter 1 (ring): Speed = 20, SpreadAngle = 360 x-axis only, Lifetime = 0.5, Size = 1→0. Emitter 2 (pillar): Speed = 30 upward, SpreadAngle = 5, golden color, Lifetime = 1.5. PointLight yellow, Brightness 10→0 over 1 second. Camera shake 0.3 seconds.
Duration: 2 seconds.
Sound: Triumphant fanfare chord + sparkle.
Use: Level up, evolution, prestige, unlock.

8. COIN COLLECT:
Technique: Part shrinks toward player + sparkle trail.
Properties: Coin part tweens Position to player head, tweens Size to 0, tweens Transparency to 1 over 0.3 seconds. Trail effect (yellow sparkle) follows coin. On arrival: small burst of gold particles.
Duration: 0.3-0.5 seconds.
Sound: "Cha-ching" coin sound (short, satisfying).
Use: Picking up currency, collecting drops, tycoon collector.

9. DAMAGE FLASH:
Technique: Red overlay frame + character highlight.
Properties: Full-screen Frame with BackgroundColor3 = red, BackgroundTransparency tweens 0.7→1 over 0.15 seconds. Hit character's parts: Highlight Instance with FillTransparency = 0.5, FillColor = red, depthMode = Occluded, lasts 0.1 seconds.
Duration: 0.1-0.2 seconds.
Sound: Impact thud or slash (varies by damage type).
Use: Taking damage from any source.

10. DEATH DISSOLVE:
Technique: Character parts turn transparent + emit particles + fall apart.
Properties: Each body part: Transparency tweens 0→1 over 1.5 seconds. ParticleEmitter on each part: emission = 20, color = black/gray, size shrinks, lifetime 0.5. Remove WeldConstraints with 0.1 second stagger (ragdoll effect before dissolving). Optional: parts turn to ash texture before dissolving.
Duration: 1.5-2 seconds.
Sound: Low ethereal whoosh.
Use: Enemy death, player death (stylized), disintegration effect.

11. TELEPORT SWIRL:
Technique: Ring of particles spiraling inward at departure, outward at arrival.
Properties: Particles orbit around center: use rotating attachment parent + speed. Color = purple/blue, Size = 1→0 (departure) or 0→1 (arrival). Rate = 100 for 0.5 seconds. Ground decal with magic circle texture fading in/out.
Duration: 1 second per phase (departure + arrival).
Sound: Whoosh + magical hum.
Use: Teleport pads, fast travel, spawn, ability.

12. SPEED TRAIL:
Technique: Trail instance attached to character + motion blur.
Properties: Trail on HumanoidRootPart: Color = white/blue, Lifetime = 0.3, MinLength = 5, Transparency = NumberSequence: 0→1. Alternative: afterimage (clone character model at intervals, each clone fades out quickly).
Duration: While speed boost is active.
Sound: Wind rushing.
Use: Sprint, dash, speed power-up, racing boost.

13. ICE CRYSTAL:
Technique: Part-based crystals (wedges and blocks with Neon material + ice blue).
Properties: Spawn 5-8 wedge parts at angles from impact point, scale from 0→full size over 0.3 seconds. Color = Color3.fromRGB(150, 220, 255). Material = Glass or Neon. Add PointLight with blue tint. Frost particles on surface.
Duration: Impact: 0.3s growth. Persist for spell duration (3-5 seconds). Melt: transparency 0→1 over 1 second.
Sound: Crystalline crackle + ice shatter.
Use: Ice spell impact, frozen enemy, ice wall, ice trap.

14. LIGHTNING BOLT:
Technique: Beam instance between two Attachments with jagged path, or Part-based segmented line.
Properties: Create 8-12 small neon parts (size 0.2 x 0.2 x random 3-8 studs) placed end-to-end with random offsets at joints. Color = white with blue tint. Add PointLight at each joint (Range 15, Brightness 5). Flash entire screen white for 0.05 seconds. All parts appear simultaneously, fade over 0.2 seconds.
Duration: 0.1-0.3 seconds (lightning is fast).
Sound: Thunder CRACK (sharp, immediate).
Use: Lightning spell, storm weather, electrical trap, Zeus attack, taser.

15. SHIELD BUBBLE:
Technique: Semi-transparent sphere around character.
Properties: Sphere MeshPart or Part with Shape=Ball. Size slightly larger than character (7x7x7). Material = ForceField or Glass. Transparency = 0.6. Color = blue/cyan. SurfaceLight inside for glow. Rotate slowly (0.5 rev/sec). Hexagonal texture overlay (optional). Ripple effect on hit: scale pulse 1→1.1→1 over 0.2 seconds.
Duration: Ability duration (3-10 seconds).
Sound: Hum/resonance loop. On hit: electrical zap.
Use: Shield ability, spawn protection, boss immunity phase, force field.

16. POISON CLOUD:
Technique: ParticleEmitter with large spread + colored fog.
Properties: Texture = cloud, Color = green/yellow gradient, Size = 3→6, Transparency = 0.3→0.8, Lifetime = 2-4, Rate = 20, Speed = 1-2, SpreadAngle = 180x180, Drag = 3. Add Atmosphere change in local area (green tint) using ColorCorrection.
Duration: Spell duration (5-10 seconds).
Sound: Bubbling hiss.
Use: Poison spell, swamp area, toxic gas trap, alchemy gone wrong.

17. BLOOD SPLATTER:
Technique: ParticleEmitter burst + decal on surfaces. (NOTE: Roblox guidelines — use alternate colors like black/oil if blood is too graphic for your audience.)
Properties: Particles: red/dark red, burst 20, speed 5-10 in hit direction, size 0.3→0, lifetime 0.3. Decal on hit surface: dark splatter texture, fades over 5 seconds. Small red parts (0.3 studs) scatter on ground.
Duration: Impact: instant. Cleanup: 5-10 seconds.
Sound: Wet impact.
Use: Critical hit, death (mature games), oil splash (kid-friendly alternative).

18. DUST KICK:
Technique: ParticleEmitter at feet on landing/running.
Properties: Color = terrain color (brown for dirt, gray for stone), Size = 0.5→2, Transparency = 0→1, Lifetime = 0.5-1, Speed = 2-4 (outward from feet), Rate = 0 (use Emit() burst on land). Burst 10 particles on hard landing, 3 particles per footstep while running on dirt.
Duration: Per-step or per-landing.
Sound: Thud on land, soft crunch on step.
Use: Landing from jump, running on terrain, vehicle wheel spin, explosion aftermath.

19. WATER SPLASH:
Technique: ParticleEmitter burst (upward) + ring ripple.
Properties: Particles: blue-white, burst 30, speed 5-10 upward, gravity influenced, size 0.3→0, lifetime 0.5. Ring: flat cylinder Part scales outward 0→10 studs diameter, transparency 0→1 over 0.5 seconds. Droplet parts that arc and fall back down.
Duration: 0.5-1 second.
Sound: Splash (varies with size).
Use: Jumping in water, fishing, water spell, cannonball, rain hitting surface.

20. LAVA BUBBLE:
Technique: Part-based sphere rising from surface + pop.
Properties: Sphere part (orange/red neon) rises slowly from lava surface (Y velocity 2-5), grows slightly, at peak: destroy with burst of 8 orange particles. Glow: PointLight inside (orange, range 10). Create new bubbles at random positions every 0.5-2 seconds.
Duration: Each bubble: 1-2 seconds. Continuous generation.
Sound: Bubbling/gurgling ambient loop. Pop on burst.
Use: Lava pools, volcanic areas, furnace, fire pit.

21. SNOWFALL:
Technique: ParticleEmitter attached to camera (client-side for performance).
Properties: Texture = white circle, Color = white, Size = 0.1-0.3, Lifetime = 5-8, Rate = 50 (light) to 200 (blizzard), Speed = 3-8 (downward), SpreadAngle = Vector2.new(40, 0), Drag = 1, RotSpeed = random, Acceleration = Vector3.new(wind_x, 0, wind_z).
Duration: Weather duration.
Sound: Gentle wind.
Use: Winter weather, snow biome, Christmas event.

22. RAIN DROPS:
Technique: ParticleEmitter for falling rain + surface splash emitters.
Properties: Rain: Texture = streak, Color = light blue, Size = 0.05x2 (thin long), Lifetime = 0.5, Rate = 200, Speed = 40-60 (fast downward), SpreadAngle = Vector2.new(10, 10). Splash: separate emitters on ground parts, small burst on contact point.
Duration: Weather duration.
Sound: Rain ambient loop (light/heavy variants).
Use: Rainy weather, indoor dripping, dramatic scenes.

23. LEAF FALL:
Technique: ParticleEmitter with leaf texture + drifting motion.
Properties: Texture = leaf shape, Color = green/orange/brown sequence (seasonal), Size = 0.5-1, Lifetime = 3-6, Rate = 5-15, Speed = 1-3, Drag = 2, RotSpeed = NumberRange(-100, 100), Acceleration = Vector3.new(random_wind, -1, random_wind).
Duration: Continuous (autumn biome or wind event).
Sound: Gentle rustling.
Use: Forest areas, autumn theme, wind effects, peaceful ambiance.

24. CHERRY BLOSSOM:
Technique: Same as leaf fall but pink petals.
Properties: Texture = petal shape, Color = pink to light pink, Size = 0.3-0.5, Lifetime = 4-8, Rate = 10-30, very gentle speed, heavy drag (floaty). RotSpeed slow and graceful.
Duration: Continuous in garden/Japanese themed areas.
Sound: Gentle wind chimes.
Use: Japanese gardens, spring theme, romantic/peaceful areas.

25. FIREFLY GLOW:
Technique: Small neon parts with PointLights, random movement via scripted position updates.
Properties: Part: Size = 0.2, Shape = Ball, Material = Neon, Color = warm yellow-green. PointLight: Range = 8, Brightness oscillates 0→3→0 over 2 seconds (glow pulse). Movement: sine wave path with random offsets, speed 2-5 studs/sec.
Duration: Night time only (tie to day/night cycle).
Sound: None (or very faint ambient buzz if many).
Use: Night forests, magical areas, swamps, garden paths.

26. NEON PULSE:
Technique: Part color/brightness oscillation using TweenService loop.
Properties: Material = Neon. Color tweens between two shades (e.g., blue→cyan→blue). PointLight brightness tweens 1→3→1. Tween style: Sine, RepeatCount = -1, Reverses = true, duration 1-3 seconds.
Duration: Continuous.
Sound: Low electronic hum (optional).
Use: Sci-fi panels, gaming machines, neon signs, futuristic buildings, rave/club.

27. HOLOGRAM FLICKER:
Technique: Part with rapid transparency oscillation + scan lines.
Properties: Base part: SurfaceGui with repeating horizontal lines (thin Frames). Transparency flickers between 0.3 and 0.6 randomly (script, not tween — irregular). Color = cyan/blue. Every 2-5 seconds: glitch effect (rapid position jitter ±0.1 studs for 0.1 seconds, color flash to white).
Duration: Continuous while hologram active.
Sound: Static buzz (very quiet).
Use: Sci-fi displays, holographic NPCs, futuristic UI in world, projectors.

28. GHOST FADE:
Technique: Character transparency oscillation + floating movement.
Properties: All character parts: Transparency tweens between 0.5 and 0.9 over 2 seconds (looping). WalkSpeed reduced. Position Y oscillates ±0.5 studs (floating). Trail instance: white, very transparent (0.8), lifetime 1. Optional: afterimage every 0.5 seconds (clone, fade, destroy).
Duration: While ghost effect active.
Sound: Ethereal whisper.
Use: Ghost NPCs, death spectator mode, invisibility ability (partially visible to allies), haunted area.

29. RAINBOW ARC:
Technique: Series of arched beam parts (7 colors) or Beam instance.
Properties: 7 thin arched parts: red, orange, yellow, green, blue, indigo, violet. Each arc slightly larger radius than the one below. Use CFrame math: position parts along semicircle. Material = Neon, Transparency = 0.3. Or use 7 Beam instances with curved CurveSize.
Duration: Appears over 2 seconds (parts fade in bottom to top), lasts 10-30 seconds, fades over 2 seconds.
Sound: Magical chime/harp.
Use: After rain weather clears, magical event, pot of gold quest, celebration.

30. STAR BURST:
Technique: Parts/particles exploding outward in star pattern.
Properties: 12-20 small neon parts (yellow/white) fly outward from center at high speed (50-100 studs/sec), each with Trail. Parts shrink and fade over 0.5 seconds. Central flash: PointLight brightness 10→0 over 0.2 seconds.
Duration: 0.5 seconds.
Sound: Sparkling whoosh.
Use: Power-up collect, star earned, achievement unlock, critical hit.

31. CONFETTI:
Technique: ParticleEmitter burst with colorful rectangles.
Properties: Texture = small rectangle, Color = random from (red, blue, green, yellow, pink, orange), Size = 0.2-0.5, Lifetime = 2-4, Burst count = 100, Speed = 10-20 upward, SpreadAngle = 60, Drag = 3, RotSpeed = NumberRange(-360, 360), Acceleration = Vector3.new(0, -10, 0) for gravity.
Duration: Burst + 3 second settle.
Sound: Party horn/popper.
Use: Victory, celebration, achievement, party, event start.

32. BALLOON POP:
Technique: Balloon part scales down rapidly + burst particles.
Properties: Balloon part: Size tweens to 1.3x over 0.05 seconds, then to 0 over 0.05 seconds (quick inflate then vanish). Burst: 15 small colored particles matching balloon color, speed 8-15, random directions, fade quickly. Optional: small string part falls.
Duration: 0.1 seconds + 0.5 second particle settle.
Sound: Pop! (sharp, short).
Use: Balloon decoration interaction, obby, party game, pop mechanic.

33. GLASS SHATTER:
Technique: Replace glass part with many small triangular parts that fly outward.
Properties: Pre-fragment: create 15-30 small wedge/corner parts matching glass color and transparency. On shatter: unanchor fragments, apply random velocity (5-15 outward + some up), add spin. Fragments: CanCollide for 2 seconds (bounce on ground), then fade and destroy.
Duration: Shatter instant, fragments settle over 2 seconds, cleanup at 3 seconds.
Sound: Glass breaking (sharp, crystalline).
Use: Window breaking, ice wall destruction, crystal smash, potion bottle break.

34. WOOD SPLINTER:
Technique: Similar to glass shatter but with brown/tan elongated parts.
Properties: Fragments: long thin parts (0.1 x 0.1 x 0.5-1.5), brown/tan color, Material = Wood. Random velocity with more horizontal spread. Some sawdust particles (small tan, high drag, fade quickly). Fewer fragments than glass (8-15).
Duration: Instant + 2 second settle.
Sound: Wood cracking/snapping.
Use: Door breaking, wooden structure destruction, tree chopping, weapon hit on wood.

35. METAL SPARK:
Technique: ParticleEmitter burst at contact point.
Properties: Texture = small bright point, Color = orange to yellow, Size = 0.1-0.2, Lifetime = 0.2-0.5, Burst count = 20, Speed = 10-20, SpreadAngle = 90, LightEmission = 1, Acceleration = Vector3.new(0, -20, 0) (gravity pulls sparks down). PointLight flash: orange, range 8, 0.1 second.
Duration: 0.3 seconds.
Sound: Metallic clang/ping.
Use: Sword hitting metal, bullet ricochet, anvil smithing, grinding, welding.

36. LASER BEAM:
Technique: Beam instance or thin Part between two points.
Properties: Part: thin cylinder (0.1 radius, length = distance between points), Material = Neon, Color = red/green/blue. Beam: Width0 = 0.3, Width1 = 0.3, LightEmission = 1, TextureMode = Stretch. PointLight at origin: matching color, range 10. Hit point: small explosion particles. Optional: beam width pulses slightly.
Duration: 0.1 seconds for shot, sustained for continuous beam.
Sound: Pew (shot) or continuous hum (beam).
Use: Sci-fi weapons, laser traps, laser pointer, sci-fi defense turrets.

37. ENERGY BALL:
Technique: Sphere Part + particles orbiting around it.
Properties: Sphere: Material = Neon, color matches element (blue for ice, red for fire), size = 2-4 studs. ParticleEmitter on surface: matching color, rate 30, speed inward (negative or orbital), small size. Inner glow: PointLight range 15, brightness 3. Movement: projectile velocity toward target, trail behind.
Duration: Flight time (0.5-2 seconds based on distance).
Sound: Charge up whirr → launch whoosh → impact boom.
Use: Magic projectile, hadouken, spirit bomb (charge mechanic), ki blast.

38. PORTAL VORTEX:
Technique: Spinning ring of particles + central glow + suction effect.
Properties: Outer ring: particles orbit in circle (use rotating attachment), purple/blue, size 0.5, rate 60. Inner: dark center (black sphere, size 3), purple PointLight. Suction: nearby loose parts slowly drift toward portal (BodyForce toward center). Scale: grows from 0 to full size over 1 second.
Duration: While portal active.
Sound: Deep resonant hum + occasional whoosh.
Use: Dimension portal, dungeon entrance, teleport destination, boss summon, void effect.

39. TIME SLOW (bullet time):
Technique: Client-side visual effect (does NOT actually slow server time).
Properties: ColorCorrection: Saturation = -0.5, Brightness = -0.05. BlurEffect: Size = 4. Camera FOV: reduce by 5. Animate character movement at 50% speed (modify animation speed on client). Sound pitch: reduce ambient sounds to 50% pitch. Particles: reduce emission rate visually.
Duration: Ability duration (2-5 seconds).
Sound: Low-pitched ambient drone, heartbeat.
Use: Dodge ability, sniper aim, cutscene dramatic moment, power-up.

40. GRAVITY FLIP:
Technique: Invert player gravity using VectorForce or BodyForce.
Properties: Apply downward force = -2 * workspace.Gravity (effectively gravity upward). Camera: smoothly rotate 180 degrees over 0.5 seconds. Visual: floating particles around player (upward-moving debris). Hair/clothing physics would naturally invert. Screen effect: slight color shift.
Duration: Ability or zone duration.
Sound: Whoompf (deep bass drop on flip) + floating ambient.
Use: Gravity zones in obby, special ability, alien planet, puzzle mechanic.

41. BUBBLE FLOAT:
Technique: Semi-transparent sphere around character + gentle upward drift.
Properties: Bubble: sphere Part, Material = Glass, Transparency = 0.7, Size slightly larger than character (7x7x7). Apply upward BodyForce (counteract gravity + gentle lift). Bubble surface: SurfaceGui with animated rainbow sheen (optional). Wobble: slight random position offset.
Duration: Until popped or expired.
Sound: Bubbly hum. Pop sound on end.
Use: Underwater mobility, flying power-up, protection bubble, bubble gum ability.

42. TORNADO FUNNEL:
Technique: Rotating cone of particles + debris.
Properties: ParticleEmitters at multiple heights: brown/gray particles, high rate, circular motion (rotating attachments). Debris: small parts orbiting (use BodyForce centripetal + tangential). Cone shape: wider at top, narrow at bottom. Height: 30-50 studs. PointLight at base (flickering). Pull nearby loose parts inward.
Duration: Weather event duration.
Sound: Loud rushing wind, increasing intensity near center.
Use: Weather event, boss attack, environmental hazard, windmill power.

43. EARTHQUAKE SHAKE:
Technique: Camera offset oscillation + falling debris.
Properties: Camera CFrame offset: random X/Y within ±0.5 studs, 30Hz oscillation, amplitude ramps up then down. Dust particles from ceiling. Small rocks (parts) fall from above. Cracks: spawn thin dark decals on ground surface. Screen: slight blur during shake.
Duration: 2-10 seconds.
Sound: Deep rumbling, building creaks, rock falling.
Use: Boss stomp, earthquake event, explosion aftershock, cave collapse.

44. AURORA WAVE:
Technique: Large semi-transparent curved Part above skyline with color animation.
Properties: Large Part (200x1x50) at height 200+. Material = Neon or Glass. Transparency = 0.6-0.8. Color tweens through green→cyan→purple→pink over 10 seconds (loop). Gentle wave movement: sine-based position oscillation. Multiple overlapping sheets for depth. LightEmission = 0.5.
Duration: Night-time event or northern biome permanent.
Sound: Ethereal ambient tone.
Use: Northern lights, magical sky, night ambiance, special event backdrop.

45. CRYSTAL GROW:
Technique: Parts scale from 0 to full size with staggered timing.
Properties: 5-8 crystal parts (wedges, different sizes and angles), Material = Glass or Neon, Color = cyan/purple/pink. Each crystal: Size tweens from 0→full over 0.3 seconds, staggered 0.1 seconds apart (bottom ones first, top ones last). PointLight inside each crystal. Sparkle particles on surface.
Duration: Growth: 1 second. Persist until destroyed.
Sound: Crystalline chime ascending.
Use: Ice wall, crystal barrier, mineral growth, cave decoration, magic trap.

46. VINE SPREAD:
Technique: Parts (cylinders = vines, spheres = leaves) that extend along surfaces.
Properties: Vine = thin cylinder parts (0.2 diameter) that grow along surface (tween size in length direction). Branch at random intervals. Leaves = small green ellipsoid parts at branch points. Growth speed: 5-10 studs/second. Color = dark green vine, lighter green leaves. Material = Grass or Fabric.
Duration: Growth: 2-5 seconds. Persist until cut/removed.
Sound: Organic creaking/growing.
Use: Nature spell, overgrowth, root attack, climbing vine, jungle trap.

47. SHADOW MELT:
Technique: Character dissolves into ground shadow.
Properties: Character parts darken (color → black over 0.5 seconds). Flatten: scale Y to 0 over 1 second (character compresses downward). Dark puddle: flat ellipsoid part on ground, grows as character shrinks. Smoke particles: dark, low, spreading outward. When emerging: reverse the entire process.
Duration: Melt: 1 second. Travel as shadow. Emerge: 1 second.
Sound: Dark whoosh on melt, reverse whoosh on emerge.
Use: Shadow stealth ability, villain entrance/exit, dark magic, teleport variant.

48. LIGHT RAY (god ray):
Technique: Transparent cone/cylinder Part angled from above.
Properties: Long thin cone Part (2x2x50), Material = Neon, Transparency = 0.85, Color = warm yellow/white. Position angled from sky. Multiple rays at slightly different angles. Dust motes: tiny particles drifting slowly within the light beam. PointLight at base where ray hits ground.
Duration: Continuous or timed (10-30 seconds).
Sound: Gentle choir/ambient pad.
Use: Sacred area, treasure spotlight, NPC divine entrance, blessing effect, window light.

49. PLASMA ARC:
Technique: Multiple Beam instances with jittered control points.
Properties: 3-5 Beam instances between two attachments. Each beam: Width 0.1-0.3, LightEmission = 1, Color = cyan/purple. CurveSize0/CurveSize1 updated every 0.05 seconds to random values (-3 to 3), creating a dancing/crackling effect. PointLight at each end: blue-purple, flickering brightness.
Duration: While connection active (tesla coil, energy transfer, tether).
Sound: Electrical crackling/buzzing.
Use: Tesla coil, energy weapon, electrical connection, mad scientist lab, lightning tether.

50. FROST SPREAD:
Technique: Expanding ice decals + ice crystal parts + fog.
Properties: Central impact point: ice decals spread outward on surfaces (scale 0→full over 1 second, multiple decals in expanding ring). Ice crystals (small wedge parts) sprout from surface at edges. Frost fog: low-lying white particles with high drag. Blue-tinted PointLight. Affected parts get blue tint overlay (Highlight instance with FillColor = ice blue, FillTransparency = 0.7).
Duration: Spread: 1-2 seconds. Persist: spell duration (5-10 seconds). Thaw: reverse over 2 seconds.
Sound: Crackling ice formation, wind chill.
Use: Ice spell ground effect, freezing floor trap, winter zone entry, ice boss phase.
`

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SECTION 7: LUAU CODE PATTERNS & IDIOMS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const LUAU_CODE_PATTERNS = `
=== LUAU CODE PATTERNS & IDIOMS ===
Patterns every Roblox script should follow. Use these to write idiomatic, bug-free Luau.

─── MODULE SCRIPT ARCHITECTURE ───

Every system should be a ModuleScript. Structure:

-- Services at top (cached)
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local RunService = game:GetService("RunService")
local DataStoreService = game:GetService("DataStoreService")
local CollectionService = game:GetService("CollectionService")
local TweenService = game:GetService("TweenService")
local Debris = game:GetService("Debris")

-- Constants
local MAX_HEALTH = 100
local REGEN_RATE = 5 -- per second
local DAMAGE_COOLDOWN = 0.5

-- Module table
local HealthSystem = {}
HealthSystem.__index = HealthSystem

-- Constructor
function HealthSystem.new(player: Player)
  local self = setmetatable({}, HealthSystem)
  self.player = player
  self.health = MAX_HEALTH
  self.maxHealth = MAX_HEALTH
  self._connections = {}
  return self
end

-- Methods
function HealthSystem:TakeDamage(amount: number, source: string)
  self.health = math.clamp(self.health - amount, 0, self.maxHealth)
  if self.health <= 0 then
    self:_onDeath(source)
  end
end

function HealthSystem:Heal(amount: number)
  self.health = math.clamp(self.health + amount, 0, self.maxHealth)
end

-- Private methods (prefix with _)
function HealthSystem:_onDeath(source: string)
  -- handle death
end

-- Cleanup (ALWAYS implement this)
function HealthSystem:Destroy()
  for _, conn in self._connections do
    conn:Disconnect()
  end
  table.clear(self._connections)
end

return HealthSystem

─── SERVICE PATTERN ───

For singleton systems (one instance per server):

local CurrencyService = {}

local playerBalances = {} -- { [userId]: { coins: N, gems: N } }

function CurrencyService:Init()
  -- Called once on server start
  Players.PlayerAdded:Connect(function(player)
    self:_loadBalance(player)
  end)
  Players.PlayerRemoving:Connect(function(player)
    self:_saveBalance(player)
    playerBalances[player.UserId] = nil
  end)
end

function CurrencyService:GetBalance(player: Player, currencyType: string): number
  local data = playerBalances[player.UserId]
  return data and data[currencyType] or 0
end

function CurrencyService:AddCurrency(player: Player, currencyType: string, amount: number, source: string): boolean
  if amount <= 0 then return false end
  local data = playerBalances[player.UserId]
  if not data then return false end
  data[currencyType] = (data[currencyType] or 0) + amount
  -- Fire client notification
  return true
end

function CurrencyService:SpendCurrency(player: Player, currencyType: string, amount: number, reason: string): boolean
  if amount <= 0 then return false end
  local data = playerBalances[player.UserId]
  if not data then return false end
  if (data[currencyType] or 0) < amount then return false end
  data[currencyType] = data[currencyType] - amount
  return true
end

return CurrencyService

─── DATASTORE PATTERNS ───

Safe DataStore access (ALWAYS use pcall):

local DataStore = DataStoreService:GetDataStore("PlayerData_v1")

local function loadData(userId: number)
  local success, result = pcall(function()
    return DataStore:GetAsync("Player_" .. tostring(userId))
  end)
  if success then
    return result -- may be nil for new players
  else
    warn("[DataStore] Failed to load for", userId, ":", result)
    return nil
  end
end

local function saveData(userId: number, data: {})
  local success, err = pcall(function()
    DataStore:SetAsync("Player_" .. tostring(userId), data)
  end)
  if not success then
    warn("[DataStore] Failed to save for", userId, ":", err)
  end
  return success
end

-- UpdateAsync for atomic read-modify-write:
local function updateData(userId: number, modifier: (old: {}?) -> {})
  local success, err = pcall(function()
    DataStore:UpdateAsync("Player_" .. tostring(userId), modifier)
  end)
  return success
end

-- BindToClose for guaranteed save on shutdown:
game:BindToClose(function()
  local threads = {}
  for userId, data in playerBalances do
    table.insert(threads, task.spawn(function()
      saveData(userId, data)
    end))
  end
  -- Wait up to 30 seconds for all saves
  task.wait(30)
end)

─── REMOTE SETUP PATTERNS ───

Creating and using remotes:

-- Server script: create remotes
local Remotes = Instance.new("Folder")
Remotes.Name = "Remotes"
Remotes.Parent = ReplicatedStorage

local function createRemoteEvent(name: string): RemoteEvent
  local remote = Instance.new("RemoteEvent")
  remote.Name = name
  remote.Parent = Remotes
  return remote
end

local function createRemoteFunction(name: string): RemoteFunction
  local remote = Instance.new("RemoteFunction")
  remote.Name = name
  remote.Parent = Remotes
  return remote
end

local BuyItemEvent = createRemoteEvent("BuyItem")
local GetInventoryFunc = createRemoteFunction("GetInventory")

-- Server handlers:
BuyItemEvent.OnServerEvent:Connect(function(player: Player, itemId: string, quantity: number)
  -- Validate types
  if typeof(itemId) ~= "string" then return end
  if typeof(quantity) ~= "number" or quantity < 1 or quantity ~= math.floor(quantity) then return end
  -- Process purchase...
end)

GetInventoryFunc.OnServerInvoke = function(player: Player)
  return getPlayerInventory(player)
end

-- Client usage:
local Remotes = ReplicatedStorage:WaitForChild("Remotes")
local BuyItemEvent = Remotes:WaitForChild("BuyItem")
local GetInventoryFunc = Remotes:WaitForChild("GetInventory")

BuyItemEvent:FireServer("iron_sword", 1)
local inventory = GetInventoryFunc:InvokeServer()

─── COLLISION SERVICE SETUP ───

local PhysicsService = game:GetService("PhysicsService")

-- Register groups
PhysicsService:RegisterCollisionGroup("Players")
PhysicsService:RegisterCollisionGroup("Enemies")
PhysicsService:RegisterCollisionGroup("Projectiles")
PhysicsService:RegisterCollisionGroup("Drops")
PhysicsService:RegisterCollisionGroup("Triggers") -- non-collidable triggers

-- Set collisions
PhysicsService:CollisionGroupSetCollidable("Players", "Players", true)
PhysicsService:CollisionGroupSetCollidable("Players", "Enemies", true)
PhysicsService:CollisionGroupSetCollidable("Players", "Projectiles", true)
PhysicsService:CollisionGroupSetCollidable("Players", "Drops", true)
PhysicsService:CollisionGroupSetCollidable("Enemies", "Enemies", false)   -- enemies don't collide with each other
PhysicsService:CollisionGroupSetCollidable("Projectiles", "Projectiles", false) -- projectiles pass through each other
PhysicsService:CollisionGroupSetCollidable("Drops", "Drops", false)       -- drops don't stack on each other
PhysicsService:CollisionGroupSetCollidable("Triggers", "Players", false)  -- trigger zones
PhysicsService:CollisionGroupSetCollidable("Triggers", "Enemies", false)
PhysicsService:CollisionGroupSetCollidable("Triggers", "Projectiles", false)
PhysicsService:CollisionGroupSetCollidable("Triggers", "Drops", false)

-- Apply to parts:
part.CollisionGroup = "Drops"

─── COLLECTIONSERVICE TAG PATTERN ───

Use tags for game objects instead of naming conventions:

-- Tag enemies in Studio or via script
CollectionService:AddTag(enemyModel, "Enemy")
CollectionService:AddTag(npcModel, "NPC")
CollectionService:AddTag(lootDrop, "Loot")
CollectionService:AddTag(interactable, "Interactable")

-- Process all tagged objects (handles streaming — works with StreamingEnabled):
local function onEnemyAdded(enemy: Instance)
  -- Initialize enemy AI
  local aiModule = require(enemy:FindFirstChild("AIController"))
  if aiModule then
    aiModule:Start()
  end
end

local function onEnemyRemoved(enemy: Instance)
  -- Cleanup enemy AI
  local aiModule = enemy:FindFirstChild("AIController")
  if aiModule then
    require(aiModule):Stop()
  end
end

-- Handle existing + future tagged instances
for _, enemy in CollectionService:GetTagged("Enemy") do
  onEnemyAdded(enemy)
end
CollectionService:GetInstanceAddedSignal("Enemy"):Connect(onEnemyAdded)
CollectionService:GetInstanceRemovedSignal("Enemy"):Connect(onEnemyRemoved)

─── TWEEN PATTERNS ───

local TweenService = game:GetService("TweenService")

-- Basic tween:
local tweenInfo = TweenInfo.new(
  0.5,                      -- Duration
  Enum.EasingStyle.Quad,    -- EasingStyle
  Enum.EasingDirection.Out, -- EasingDirection
  0,                        -- RepeatCount (0 = no repeat, -1 = forever)
  false,                    -- Reverses
  0                         -- DelayTime
)

local tween = TweenService:Create(part, tweenInfo, {
  Position = Vector3.new(0, 10, 0),
  Transparency = 0.5,
  Color = Color3.fromRGB(255, 0, 0),
})
tween:Play()

-- Wait for completion:
tween.Completed:Wait()

-- Chained tweens (sequence):
local function tweenSequence(instance, steps)
  for _, step in steps do
    local info = TweenInfo.new(step.duration, step.easing or Enum.EasingStyle.Quad, step.direction or Enum.EasingDirection.Out)
    local t = TweenService:Create(instance, info, step.props)
    t:Play()
    t.Completed:Wait()
  end
end

-- Looping pulse (for glowing effects):
local pulseInfo = TweenInfo.new(1, Enum.EasingStyle.Sine, Enum.EasingDirection.InOut, -1, true)
TweenService:Create(pointLight, pulseInfo, { Brightness = 3 }):Play()

-- Common easing styles:
-- Quad Out: smooth deceleration (best for UI slide-in)
-- Back Out: overshoot then settle (best for pop-in effects)
-- Bounce Out: bounce at end (playful, cartoony)
-- Sine InOut: smooth symmetrical (best for loops)
-- Linear: constant speed (for progress bars, timers)
-- Elastic Out: spring effect (for emphasis)

─── PATHFINDING PATTERN ───

local PathfindingService = game:GetService("PathfindingService")

local function moveNPCTo(humanoid: Humanoid, rootPart: BasePart, targetPosition: Vector3): boolean
  local path = PathfindingService:CreatePath({
    AgentRadius = 2,
    AgentHeight = 5,
    AgentCanJump = true,
    AgentCanClimb = false,
    WaypointSpacing = 4,
    Costs = {
      Water = 20,   -- avoid water
      Mud = 5,      -- slightly avoid mud
    }
  })

  local success, err = pcall(function()
    path:ComputeAsync(rootPart.Position, targetPosition)
  end)

  if not success or path.Status ~= Enum.PathStatus.Success then
    return false
  end

  local waypoints = path:GetWaypoints()
  for i = 2, #waypoints do -- skip first waypoint (current position)
    local waypoint = waypoints[i]

    if waypoint.Action == Enum.PathWaypointAction.Jump then
      humanoid.Jump = true
    end

    humanoid:MoveTo(waypoint.Position)

    -- Wait for movement or timeout
    local reached = humanoid.MoveToFinished:Wait()
    if not reached then
      return false -- stuck
    end
  end

  return true
end

-- Path re-computation pattern for chasing:
local function chaseTarget(humanoid, rootPart, target)
  while target and target.Parent do
    local targetPos = target.Position
    moveNPCTo(humanoid, rootPart, targetPos)
    -- Don't recompute every frame — only when target moves significantly
    if (target.Position - targetPos).Magnitude > 10 then
      break -- recompute path
    end
    task.wait(0.5)
  end
end

─── HITBOX / COMBAT DETECTION ───

Server-side hitbox creation (NEVER use Touched for combat):

-- Raycast-based (for projectiles, melee swings):
local function meleeHitCheck(attacker: Player, swingDirection: Vector3, range: number, angle: number): {Player}
  local char = attacker.Character
  if not char then return {} end
  local rootPart = char:FindFirstChild("HumanoidRootPart")
  if not rootPart then return {} end

  local origin = rootPart.Position
  local hitPlayers = {}

  for _, player in Players:GetPlayers() do
    if player == attacker then continue end
    local targetChar = player.Character
    if not targetChar then continue end
    local targetRoot = targetChar:FindFirstChild("HumanoidRootPart")
    if not targetRoot then continue end
    local targetHumanoid = targetChar:FindFirstChildOfClass("Humanoid")
    if not targetHumanoid or targetHumanoid.Health <= 0 then continue end

    local toTarget = targetRoot.Position - origin
    local distance = toTarget.Magnitude
    if distance > range then continue end

    -- Angle check (is target in front of attacker?)
    local dot = rootPart.CFrame.LookVector:Dot(toTarget.Unit)
    if dot < math.cos(math.rad(angle / 2)) then continue end

    -- Line-of-sight check (optional — for melee, often skip)
    local rayResult = workspace:Raycast(origin, toTarget, RaycastParams.new())
    if rayResult and rayResult.Instance:IsDescendantOf(targetChar) then
      table.insert(hitPlayers, player)
    end
  end

  return hitPlayers
end

-- Box-based (for AoE):
local function aoeCheck(position: Vector3, size: Vector3): {Model}
  local params = OverlapParams.new()
  params.FilterType = Enum.RaycastFilterType.Include
  params.FilterDescendantsInstances = { workspace }

  local parts = workspace:GetPartBoundsInBox(CFrame.new(position), size, params)
  local hitCharacters = {}
  local seen = {}

  for _, part in parts do
    local char = part:FindFirstAncestorOfClass("Model")
    if char and char:FindFirstChildOfClass("Humanoid") and not seen[char] then
      seen[char] = true
      table.insert(hitCharacters, char)
    end
  end

  return hitCharacters
end

─── PROMISE / ASYNC PATTERNS ───

Luau doesn't have native Promises, but common pattern:

-- Simple callback chain:
local function doAsync(callback)
  task.spawn(function()
    local result = heavyOperation()
    callback(result)
  end)
end

-- Coroutine-based sequential async:
local function loadPlayerData(player)
  local data = nil
  local thread = coroutine.running()

  task.spawn(function()
    local success, result = pcall(function()
      return DataStore:GetAsync("Player_" .. player.UserId)
    end)
    data = success and result or nil
    task.spawn(thread) -- resume waiting thread
  end)

  coroutine.yield() -- wait for data
  return data
end

-- Parallel execution (wait for all):
local function waitForAll(tasks: {() -> any}): {any}
  local results = {}
  local remaining = #tasks

  for i, taskFn in tasks do
    task.spawn(function()
      results[i] = taskFn()
      remaining -= 1
    end)
  end

  while remaining > 0 do
    task.wait()
  end

  return results
end

─── ATTRIBUTE SYSTEM PATTERN ───

Use Attributes for data on instances (visible in Explorer, replicated automatically):

-- Set attributes on a model:
enemyModel:SetAttribute("Health", 100)
enemyModel:SetAttribute("MaxHealth", 100)
enemyModel:SetAttribute("Level", 5)
enemyModel:SetAttribute("EnemyType", "Skeleton")
enemyModel:SetAttribute("LootTable", "skeleton_loot") -- reference to config

-- Read attributes:
local health = enemyModel:GetAttribute("Health")
local enemyType = enemyModel:GetAttribute("EnemyType")

-- Listen for attribute changes:
enemyModel:GetAttributeChangedSignal("Health"):Connect(function()
  local newHealth = enemyModel:GetAttribute("Health")
  updateHealthBar(newHealth)
end)

-- Advantages over Value objects:
-- 1. No need to create NumberValue/StringValue instances
-- 2. Replicate automatically (server→client)
-- 3. Type-safe (number, string, boolean, CFrame, Color3, Vector3, etc.)
-- 4. Visible in Properties panel in Studio
-- 5. Can be set in Studio without scripts

─── SPAWN AND OBJECT POOL PATTERN ───

For frequently created/destroyed objects (projectiles, effects, drops):

local ObjectPool = {}
ObjectPool.__index = ObjectPool

function ObjectPool.new(template: Instance, initialSize: number)
  local self = setmetatable({}, ObjectPool)
  self._template = template
  self._available = {}
  self._active = {}

  -- Pre-create objects
  for i = 1, initialSize do
    local obj = template:Clone()
    obj.Parent = nil -- not in workspace
    table.insert(self._available, obj)
  end

  return self
end

function ObjectPool:Get(): Instance
  local obj = table.remove(self._available)
  if not obj then
    -- Pool exhausted — create new
    obj = self._template:Clone()
  end
  self._active[obj] = true
  return obj
end

function ObjectPool:Return(obj: Instance)
  if not self._active[obj] then return end
  self._active[obj] = nil
  obj.Parent = nil -- remove from workspace
  -- Reset object state here (position, color, etc.)
  table.insert(self._available, obj)
end

function ObjectPool:Destroy()
  for _, obj in self._available do
    obj:Destroy()
  end
  for obj in self._active do
    obj:Destroy()
  end
  table.clear(self._available)
  table.clear(self._active)
end

-- Usage:
local bulletPool = ObjectPool.new(bulletTemplate, 50)
local bullet = bulletPool:Get()
bullet.CFrame = spawnCFrame
bullet.Parent = workspace
-- ... later when bullet hits or expires:
bulletPool:Return(bullet)

─── DEBOUNCE PATTERN ───

local debounces = {}

local function debounce(key: string, cooldown: number): boolean
  if debounces[key] then return false end
  debounces[key] = true
  task.delay(cooldown, function()
    debounces[key] = nil
  end)
  return true
end

-- Usage:
part.Touched:Connect(function(hit)
  local player = Players:GetPlayerFromCharacter(hit.Parent)
  if not player then return end
  if not debounce("touch_" .. player.UserId, 1) then return end
  -- Process touch (only once per second per player)
end)

─── SIGNAL / EVENT EMITTER PATTERN ───

Custom event system (for module-to-module communication without remotes):

local Signal = {}
Signal.__index = Signal

function Signal.new()
  return setmetatable({ _listeners = {} }, Signal)
end

function Signal:Connect(callback: (...any) -> ()): { Disconnect: () -> () }
  local listener = { callback = callback, connected = true }
  table.insert(self._listeners, listener)
  return {
    Disconnect = function()
      listener.connected = false
    end
  }
end

function Signal:Fire(...)
  for _, listener in self._listeners do
    if listener.connected then
      task.spawn(listener.callback, ...)
    end
  end
end

function Signal:Wait()
  local thread = coroutine.running()
  local conn
  conn = self:Connect(function(...)
    conn.Disconnect()
    task.spawn(thread, ...)
  end)
  return coroutine.yield()
end

function Signal:Destroy()
  table.clear(self._listeners)
end

-- Usage:
local onPlayerDied = Signal.new()
onPlayerDied:Connect(function(player, killerName)
  updateLeaderboard(player, killerName)
end)
onPlayerDied:Fire(player, "Zombie")

─── ZONE / REGION DETECTION ───

Detect when players enter/leave zones:

local ZoneService = {}
local activeZones = {} -- { [zoneId]: { part, players, onEnter, onLeave } }

function ZoneService:CreateZone(zonePart: BasePart, onEnter: (Player) -> (), onLeave: (Player) -> ())
  local zoneId = zonePart:GetFullName()
  activeZones[zoneId] = {
    part = zonePart,
    players = {},
    onEnter = onEnter,
    onLeave = onLeave,
  }
end

-- Check zones every 0.5 seconds (cheaper than Touched events):
RunService.Heartbeat:Connect(function()
  -- Throttle to ~2 checks per second
  -- (full implementation would track frame count)
  for zoneId, zone in activeZones do
    local params = OverlapParams.new()
    params.FilterType = Enum.RaycastFilterType.Include
    params.FilterDescendantsInstances = { workspace }

    local parts = workspace:GetPartsInPart(zone.part, params)
    local currentPlayers = {}

    for _, part in parts do
      local player = Players:GetPlayerFromCharacter(part.Parent)
      if player then
        currentPlayers[player] = true
        if not zone.players[player] then
          zone.players[player] = true
          zone.onEnter(player)
        end
      end
    end

    -- Check for players who left
    for player in zone.players do
      if not currentPlayers[player] then
        zone.players[player] = nil
        zone.onLeave(player)
      end
    end
  end
end)

─── STRING FORMATTING PATTERNS ───

-- Number formatting (1234567 → "1,234,567"):
local function formatNumber(n: number): string
  local formatted = tostring(math.floor(n))
  local result = ""
  for i = #formatted, 1, -1 do
    result = formatted:sub(i, i) .. result
    if (#formatted - i + 1) % 3 == 0 and i > 1 then
      result = "," .. result
    end
  end
  return result
end

-- Abbreviate large numbers (1500 → "1.5K", 2300000 → "2.3M"):
local function abbreviateNumber(n: number): string
  if n >= 1e12 then return string.format("%.1fT", n / 1e12)
  elseif n >= 1e9 then return string.format("%.1fB", n / 1e9)
  elseif n >= 1e6 then return string.format("%.1fM", n / 1e6)
  elseif n >= 1e3 then return string.format("%.1fK", n / 1e3)
  else return tostring(math.floor(n))
  end
end

-- Time formatting (125 seconds → "2:05"):
local function formatTime(seconds: number): string
  local mins = math.floor(seconds / 60)
  local secs = math.floor(seconds % 60)
  return string.format("%d:%02d", mins, secs)
end

-- Time formatting with hours (3725 → "1:02:05"):
local function formatTimeFull(seconds: number): string
  local hours = math.floor(seconds / 3600)
  local mins = math.floor((seconds % 3600) / 60)
  local secs = math.floor(seconds % 60)
  if hours > 0 then
    return string.format("%d:%02d:%02d", hours, mins, secs)
  end
  return string.format("%d:%02d", mins, secs)
end
`

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SECTION 8: GAME BALANCE FORMULAS & TUNING REFERENCE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const GAME_BALANCE_FORMULAS = `
=== GAME BALANCE FORMULAS & TUNING REFERENCE ===
Mathematical formulas for game balance. Use these to generate unique but well-balanced game systems.

─── XP CURVES ───

Linear: xpForLevel = baseXP * level
  Level 10 = 1,000 XP. Level 50 = 5,000 XP. Level 100 = 10,000 XP.
  Problem: feels too easy at high levels. Players blast through end-game.

Polynomial: xpForLevel = baseXP * level ^ exponent
  Exponent 1.5 (gentle curve): Level 10 = 3,162. Level 50 = 35,355. Level 100 = 100,000.
  Exponent 2.0 (standard): Level 10 = 10,000. Level 50 = 250,000. Level 100 = 1,000,000.
  Exponent 2.5 (steep): Level 10 = 31,622. Level 50 = 1,767,767. Level 100 = 10,000,000.
  Best for: RPGs, tycoons, simulators. 1.5 for casual, 2.0 for standard, 2.5 for hardcore.

Exponential: xpForLevel = baseXP * multiplier ^ level
  multiplier = 1.1: Level 10 = 259. Level 50 = 11,739. Level 100 = 1,378,061.
  multiplier = 1.15: Level 10 = 405. Level 50 = 108,366. Level 100 = 117,390,853.
  Problem: becomes impossibly steep. Good for prestige/rebirth systems where levels reset.

Sigmoid: xpForLevel = maxXP / (1 + e^(-k*(level - midpoint)))
  Slow start, fast middle, slow end. Good for battle pass progression.
  k = 0.1, midpoint = 50: gentle S-curve. k = 0.2: steeper.

RECOMMENDATION: Use polynomial 1.5 for most games. Feels fair, not too grindy.

─── CURRENCY ECONOMY ───

Earn rates by game type:
  Tycoon: 1-10 coins/second early game, 100-1000/second late game (before rebirth)
  RPG: 10-50 coins per enemy kill, 100-500 per quest, 1000+ per boss
  Simulator: 1-5 per click early, 100-500 per click late
  Battle Royale: 50-200 per match, 500+ for win

Spend sinks (CRITICAL — without sinks, inflation kills economy):
  Equipment: 50-80% of player spending
  Consumables: 10-20% (potions, ammo, food)
  Cosmetics: 5-15%
  Convenience: 5-10% (teleport, fast travel, respec)
  Auction house fees: 5-15% tax on all trades

Price scaling:
  Weapon tiers: Tier 1 = 100, Tier 2 = 500, Tier 3 = 2,000, Tier 4 = 8,000, Tier 5 = 30,000
  General formula: price = baseCost * 3.5 ^ (tier - 1)
  Sell price: 20-40% of buy price (NEVER 50%+ or players profit from buy-sell loops)

Dual currency design:
  Soft currency (coins): earned freely, spent on gameplay items
  Hard currency (gems): earned slowly or purchased with Robux, spent on cosmetics/convenience
  NEVER sell power for hard currency (pay-to-win kills games)
  OK to sell: cosmetics, XP boosts (time savers), inventory expansion, cosmetic pets

─── DAMAGE FORMULAS ───

Simple subtraction: finalDamage = attack - defense
  Problem: high defense = zero damage (too powerful). Low defense = meaningless.

Percentage reduction: finalDamage = attack * (100 / (100 + defense))
  defense = 0: 100% damage. defense = 50: 67% damage. defense = 100: 50% damage. defense = 200: 33% damage.
  This is the BEST general formula. Defense always matters but never blocks 100%.

Armor class: if attackRoll (1-20 + modifier) >= armorClass, hit for full damage
  Classic D&D style. Binary hit/miss feels dramatic but can be frustrating.

Hybrid: finalDamage = max(1, attack * (100 / (100 + defense)) - flatReduction)
  Percentage reduction + flat reduction for heavy armor. Minimum 1 damage prevents immortality.

Critical hits: critDamage = baseDamage * critMultiplier (typically 1.5x-2.5x)
  Crit chance: 5% base, up to 30% with gear/skills. Higher than 30% feels less special.

Damage ranges: actual damage = baseDamage * random(0.85, 1.15)
  Adds variance. 15% spread is standard. Higher = more random (PvE OK), lower = more skill-based (PvP).

─── DROP RATE TABLES ───

Standard rarity distribution:
  Common: 50-60% drop chance
  Uncommon: 25-30%
  Rare: 10-15%
  Epic: 3-5%
  Legendary: 0.5-1%
  Mythic: 0.01-0.1% (ultra rare, optional tier)

Weighted random selection:
  weights = { Common = 600, Uncommon = 250, Rare = 100, Epic = 40, Legendary = 10 }
  totalWeight = sum of all weights (1000)
  roll = math.random(1, totalWeight)
  iterate through weights, subtract each from roll, first that goes <= 0 is selected

Pity system (guarantee rare within N attempts):
  Track failed attempts per player per loot source.
  After N attempts without rare+, guarantee next drop is rare+ (or increase chance by 10% per attempt).
  N = 50-100 for legendary, N = 20-30 for epic.
  Prevents extremely unlucky streaks that cause rage-quit.

Boss loot: always drop SOMETHING unique. Boss with no loot = boss nobody fights.
  100% chance of one item from boss table. Additional items at lower chance.

─── STAT GROWTH FORMULAS ───

Flat growth: stat = baseStat + (level * growthPerLevel)
  Example: HP = 100 + (level * 10). Level 50 = 600 HP.
  Simple, predictable, easy to balance.

Percentage growth: stat = baseStat * (1 + growthRate) ^ level
  Example: HP = 100 * 1.03^level. Level 50 = 438 HP.
  Exponential — gets very large at high levels. Good for tycoon-style games.

Diminishing returns: stat = baseStat + growthFactor * sqrt(level)
  Example: HP = 100 + 50 * sqrt(level). Level 50 = 453 HP. Level 100 = 600 HP.
  High levels give less per level. Discourages excessive grinding of one stat.

Soft cap / hard cap:
  Soft cap: after threshold, each point gives 50% less. E.g., speed soft cap at 30, each point above gives half benefit.
  Hard cap: absolute maximum. E.g., speed hard cap at 50, can't go higher regardless of gear/buffs.
  ALWAYS have hard caps. Without them, exploits create absurd values.

─── COOLDOWN & TIMING ───

Ability cooldowns:
  Basic attacks: 0.5-1.5 seconds
  Strong abilities: 3-8 seconds
  Ultimate abilities: 30-120 seconds
  Defensive (dodge, shield): 2-5 seconds
  Healing: 5-15 seconds
  Mobility (dash, teleport): 3-10 seconds

Resource regeneration:
  Health regen: 1-3% of max per second (out of combat), 0% in combat
  Mana regen: 2-5% of max per second (always)
  Stamina regen: 10-20% per second (when not using stamina)
  Hunger drain: 1 point per 30-60 seconds (if hunger system exists)

Respawn timers:
  Casual/fun: 3-5 seconds
  Competitive: 5-10 seconds
  Hardcore: 15-30 seconds
  Battle royale: no respawn (eliminated)

─── MATCHMAKING & DIFFICULTY ───

ELO rating system:
  New player: start at 1000
  Expected outcome: E = 1 / (1 + 10^((opponentELO - playerELO) / 400))
  After match: newELO = oldELO + K * (actualResult - expectedResult)
    where actualResult = 1 for win, 0 for loss, 0.5 for draw
    K = 32 for new players, K = 16 for established players
  Match quality: aim for 40-60% expected win rate (close matches)

Difficulty scaling:
  Enemy health: baseHP * (1 + playerLevel * 0.1)
  Enemy damage: baseDamage * (1 + playerLevel * 0.05)
  Enemy count: base + floor(playerLevel / 10)
  Loot quality: higher level = higher rarity chance

Rubber banding (keep games close):
  Losing player gets subtle advantage (5-10% damage boost, slightly faster respawn)
  Don't make it obvious — players hate feeling "cheated"
  Only in casual modes, NEVER in competitive/ranked

─── ENGAGEMENT FORMULAS ───

Session pacing:
  First 5 minutes: hook (immediate reward, quick tutorial, first achievement)
  5-15 minutes: core loop (main gameplay established, first meaningful choice)
  15-30 minutes: first milestone (significant upgrade, story beat, level up)
  30-60 minutes: second hook (new mechanic unlocked, harder content, social feature)
  60+ minutes: investment (housing, guilds, long-term goals)

Reward schedule:
  Constant: every action gives reward (clicking in simulator). High engagement, low meaning.
  Variable ratio: random chance of reward (loot drops). Highest addiction potential.
  Fixed interval: reward every X time (daily rewards). Drives daily return.
  Variable interval: random timing (rare spawns). Keeps players watching.

BEST PRACTICE: Mix all four. Constant for basic actions, variable ratio for loot, fixed interval for dailies, variable interval for rare events.

Retention mechanics:
  Day 1: Daily rewards, tutorial completion bonus
  Day 7: Weekly challenge rewards, first major milestone
  Day 30: Monthly rewards, guild features unlock
  Day 90: Season pass completion, rare cosmetics
`

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SECTION 9: COMPLETE ARCHITECTURE BLUEPRINTS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const ARCHITECTURE_BLUEPRINTS = `
=== COMPLETE ARCHITECTURE BLUEPRINTS ===
Full folder structures and script organization for different game types.

─── STANDARD RPG ARCHITECTURE ───

game
├── ServerScriptService
│   ├── Server.server.lua        -- Boot script: requires all services, calls :Init()
│   ├── Services/
│   │   ├── DataService.lua      -- DataStore loading/saving/session lock
│   │   ├── CombatService.lua    -- All damage calculation, hit detection
│   │   ├── InventoryService.lua -- Add/remove/move items
│   │   ├── QuestService.lua     -- Quest tracking, completion
│   │   ├── LootService.lua      -- Drop tables, loot generation
│   │   ├── NPCService.lua       -- NPC spawning, AI coordination
│   │   ├── ShopService.lua      -- Buy/sell handling
│   │   └── AdminService.lua     -- Admin commands
│   └── RemoteHandlers/
│       ├── CombatRemotes.lua    -- Validate combat actions
│       ├── InventoryRemotes.lua -- Validate inventory actions
│       ├── QuestRemotes.lua     -- Validate quest actions
│       └── ShopRemotes.lua      -- Validate shop actions
├── ReplicatedStorage
│   ├── Remotes/                 -- RemoteEvents + RemoteFunctions (created by server)
│   ├── Shared/
│   │   ├── ItemDatabase.lua     -- All item definitions
│   │   ├── QuestDatabase.lua    -- All quest definitions
│   │   ├── EnemyDatabase.lua    -- All enemy definitions
│   │   ├── Constants.lua        -- Game-wide constants
│   │   └── Types.lua            -- Type definitions for shared data
│   └── Assets/
│       ├── Weapons/             -- Weapon models
│       ├── Armor/               -- Armor models
│       ├── Effects/             -- Particle effect templates
│       └── UI/                  -- UI templates
├── StarterPlayerScripts
│   ├── Client.client.lua        -- Boot script: requires all controllers
│   └── Controllers/
│       ├── CameraController.lua -- Camera management
│       ├── InputController.lua  -- Keybind handling
│       ├── CombatController.lua -- Client prediction, animations
│       ├── UIController.lua     -- UI management, transitions
│       └── SoundController.lua  -- Sound/music management
├── StarterGui
│   ├── HUD/                     -- Always-visible UI
│   │   ├── HealthBar
│   │   ├── ManaBar
│   │   ├── ActionBar
│   │   ├── QuestTracker
│   │   └── Minimap
│   └── Menus/                   -- Toggled UI
│       ├── Inventory
│       ├── Equipment
│       ├── QuestLog
│       ├── Map
│       ├── Settings
│       └── Shop
└── Workspace
    ├── Map/                     -- World geometry (terrain, buildings)
    ├── NPCs/                    -- NPC models (spawned by NPCService)
    ├── Interactables/           -- Doors, chests, switches
    └── SpawnLocations/          -- Player spawn points

BOOT ORDER (Server.server.lua):
1. DataService:Init() -- must be first (other services need data)
2. InventoryService:Init()
3. CombatService:Init()
4. QuestService:Init()
5. NPCService:Init()
6. ShopService:Init()
7. AdminService:Init()
8. RemoteHandlers -- set up after all services ready

─── STANDARD TYCOON ARCHITECTURE ───

game
├── ServerScriptService
│   ├── TycoonServer.server.lua
│   ├── Services/
│   │   ├── DataService.lua
│   │   ├── TycoonService.lua      -- Plot assignment, dropper management
│   │   ├── CurrencyService.lua    -- Coins, gems, rebirth currency
│   │   ├── UpgradeService.lua     -- Track and apply upgrades
│   │   └── RebirthService.lua     -- Rebirth logic, multiplier calculation
│   └── Remotes/
│       └── TycoonRemotes.lua
├── ReplicatedStorage
│   ├── Shared/
│   │   ├── TycoonConfig.lua       -- All dropper/upgrade/rebirth definitions
│   │   └── Constants.lua
│   └── Assets/
│       ├── Droppers/              -- Dropper models
│       ├── Conveyors/             -- Conveyor models
│       └── Decorations/           -- Plot decorations
├── StarterPlayerScripts
│   └── TycoonClient.client.lua    -- Purchase handling, UI updates, local effects
├── StarterGui
│   ├── TycoonHUD/                 -- Currency display, earnings/sec
│   ├── UpgradeMenu/               -- Available upgrades
│   └── RebirthMenu/               -- Rebirth screen
└── Workspace
    ├── Plots/                     -- Pre-placed plot areas (Plot_1, Plot_2, etc.)
    │   ├── Plot_1/
    │   │   ├── Baseplate
    │   │   ├── SpawnLocation
    │   │   ├── PurchaseButtons/   -- Button pads (unlocked sequentially)
    │   │   ├── Droppers/          -- Active dropper models
    │   │   └── Collector          -- Where drops convert to currency
    │   └── Plot_2/ ...
    └── Lobby/                     -- Waiting area, leaderboard

─── STANDARD SIMULATOR ARCHITECTURE ───

game
├── ServerScriptService
│   ├── SimServer.server.lua
│   ├── Services/
│   │   ├── DataService.lua
│   │   ├── ClickService.lua       -- Process clicks, apply multipliers
│   │   ├── PetService.lua         -- Pet hatching, equipping, leveling
│   │   ├── AreaService.lua        -- Area unlocking, teleportation
│   │   ├── RebirthService.lua     -- Rebirth logic
│   │   └── UpgradeService.lua     -- Permanent and temporary upgrades
├── ReplicatedStorage
│   ├── Shared/
│   │   ├── PetDatabase.lua        -- All pet definitions, rarity weights
│   │   ├── EggDatabase.lua        -- Egg types and costs
│   │   ├── AreaDatabase.lua       -- Area requirements and multipliers
│   │   ├── UpgradeDatabase.lua    -- Upgrade costs and effects
│   │   └── Constants.lua
│   └── Assets/
│       ├── Pets/                  -- Pet models
│       ├── Eggs/                  -- Egg models
│       └── Effects/               -- Hatch effects, upgrade effects
├── StarterPlayerScripts
│   └── SimClient.client.lua       -- Click detection, pet display, animations
├── StarterGui
│   ├── SimHUD/                    -- Power display, coin display, area name
│   ├── PetInventory/              -- Pet grid, equip/delete
│   ├── EggHatchUI/                -- Hatching animation
│   ├── ShopUI/                    -- Upgrades, game passes
│   └── Codes/                     -- Promo code redemption
└── Workspace
    ├── Areas/
    │   ├── Starter_Area/
    │   │   ├── ClickableObjects/  -- Things to click for power
    │   │   ├── EggDisplays/       -- Egg pedestals to buy
    │   │   ├── Portal/            -- Teleport to next area
    │   │   └── Decorations/
    │   ├── Forest_Area/ ...
    │   └── Volcano_Area/ ...
    └── Lobby/                     -- Spawn, leaderboard, codes sign

─── COMMUNICATION FLOW DIAGRAM ───

CLIENT                          SERVER
  |                               |
  |--- SwingWeapon(direction) --->|
  |    [play anim immediately]    |--- validate position, cooldown
  |                               |--- create hitbox (GetPartBoundsInBox)
  |                               |--- check each character in hitbox
  |                               |--- calculate damage for each hit
  |                               |
  |<-- HitConfirm(target, dmg) ---|
  |    [show hit VFX]             |
  |                               |--- update target health
  |                               |--- fire HealthChanged to target
  |                               |
  |                               |--- if target health <= 0:
  |                               |    fire PlayerDied to target
  |                               |    fire KillCredit to attacker
  |                               |    award XP, update leaderboard
  |                               |    start respawn timer

─── SERVICE COMMUNICATION PATTERN ───

Services should communicate through a central event bus, NOT direct requires:

-- EventBus module (ReplicatedStorage/Shared/EventBus.lua):
local EventBus = {}
local listeners = {} -- { [eventName]: callback[] }

function EventBus:Listen(eventName: string, callback: (...any) -> ())
  listeners[eventName] = listeners[eventName] or {}
  table.insert(listeners[eventName], callback)
end

function EventBus:Fire(eventName: string, ...)
  for _, callback in listeners[eventName] or {} do
    task.spawn(callback, ...)
  end
end

-- Usage in services:
-- CombatService:
EventBus:Fire("PlayerKilledEnemy", player, enemyId, xpReward)

-- QuestService:
EventBus:Listen("PlayerKilledEnemy", function(player, enemyId, xpReward)
  self:UpdateKillQuests(player, enemyId)
end)

-- AchievementService:
EventBus:Listen("PlayerKilledEnemy", function(player, enemyId)
  self:IncrementStat(player, "total_kills", 1)
end)

-- LootService:
EventBus:Listen("PlayerKilledEnemy", function(player, enemyId)
  self:RollLoot(player, enemyId)
end)

BENEFITS: Services don't need to know about each other. Adding new features just means adding new listeners.

─── CONFIGURATION DRIVEN DESIGN ───

Never hard-code game values in scripts. Always use configuration modules:

-- ReplicatedStorage/Shared/Config/WeaponConfig.lua
return {
  IronSword = {
    name = "Iron Sword",
    damage = 15,
    swingSpeed = 0.8,
    range = 6,
    comboChain = 3,
    staminaCost = 10,
    knockback = 5,
    rarity = "Common",
    price = 100,
    levelReq = 1,
    description = "A basic iron sword. Reliable and sturdy.",
  },
  SteelLongsword = {
    name = "Steel Longsword",
    damage = 28,
    swingSpeed = 1.0,
    range = 7,
    comboChain = 4,
    staminaCost = 15,
    knockback = 8,
    rarity = "Uncommon",
    price = 500,
    levelReq = 10,
    description = "Forged from quality steel. Extended reach.",
  },
  -- ... 50+ weapons
}

EVERY game value should be in a config module:
- Weapon stats: WeaponConfig
- Enemy stats: EnemyConfig
- Quest definitions: QuestConfig
- Shop inventory: ShopConfig
- XP curve: ProgressionConfig
- UI colors/sizes: UIConfig

This makes balancing easy — change one number, affects entire game.

─── ERROR RECOVERY ARCHITECTURE ───

Every service should have fallback behavior:

local function safeCall(func, fallback, ...)
  local success, result = pcall(func, ...)
  if success then
    return result
  else
    warn("[SafeCall] Error:", result)
    if fallback then
      return fallback
    end
    return nil
  end
end

-- DataService fallback chain:
function DataService:LoadPlayer(player)
  -- Try primary DataStore
  local data = safeCall(DataStore.GetAsync, nil, DataStore, "Player_" .. player.UserId)
  if data then return data end

  -- Try backup DataStore
  data = safeCall(BackupStore.GetAsync, nil, BackupStore, "Player_" .. player.UserId)
  if data then
    warn("[Data] Loaded from backup for", player.Name)
    return data
  end

  -- Create fresh data (never let player play with nil)
  warn("[Data] Creating fresh data for", player.Name)
  return self:CreateDefaultData(player)
end

─── TESTING PATTERNS ───

In-game testing without framework:

local TestRunner = {}

function TestRunner:Run()
  local passed, failed = 0, 0

  -- Test currency operations
  local function test(name, condition)
    if condition then
      passed += 1
    else
      failed += 1
      warn("[TEST FAIL]", name)
    end
  end

  -- Currency tests
  local testData = { coins = 100 }
  test("Spend exact balance", CurrencyService:SpendCurrency(testData, "coins", 100))
  test("Balance is zero", testData.coins == 0)
  test("Can't overspend", not CurrencyService:SpendCurrency(testData, "coins", 1))
  test("Add currency", CurrencyService:AddCurrency(testData, "coins", 50) and testData.coins == 50)

  -- Damage formula tests
  test("Zero defense = full damage", DamageCalc(100, 0) == 100)
  test("100 defense = half damage", DamageCalc(100, 100) == 50)
  test("Negative damage clamped", DamageCalc(-10, 0) == 0)

  print(string.format("[TESTS] %d passed, %d failed", passed, failed))
end

return TestRunner
`

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SECTION 10: ANTI-PATTERN REFERENCE (WHAT NOT TO DO)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const ANTI_PATTERNS = `
=== ANTI-PATTERN REFERENCE — WHAT NOT TO DO ===
Every mistake listed here has been made by thousands of Roblox developers. Avoid them all.

─── SCRIPTING ANTI-PATTERNS ───

1. USING wait() INSTEAD OF task.wait():
   BAD: wait(1) -- deprecated, minimum 0.03s, yields to Heartbeat unevenly
   GOOD: task.wait(1) -- precise, modern, correct

2. USING game.Workspace INSTEAD OF workspace:
   BAD: game.Workspace -- works but verbose
   OK: workspace -- global shorthand
   BEST: local ws = game:GetService("Workspace") -- explicit, no ambiguity

3. USING spawn() INSTEAD OF task.spawn():
   BAD: spawn(function() end) -- deprecated, deferred, unreliable timing
   GOOD: task.spawn(function() end) -- immediate, predictable

4. USING delay() INSTEAD OF task.delay():
   BAD: delay(1, function() end) -- deprecated
   GOOD: task.delay(1, function() end) -- modern

5. USING Instance.new("X", parent):
   BAD: Instance.new("Part", workspace) -- sets parent before properties
   GOOD: local p = Instance.new("Part"); p.Size = ...; p.Parent = workspace

6. USING :FindFirstChild() IN HOT LOOPS:
   BAD: RunService.Heartbeat:Connect(function() local h = char:FindFirstChild("Humanoid") end)
   GOOD: local humanoid = char:WaitForChild("Humanoid") -- cache once

7. POLLING WITH while true do:
   BAD: while true do task.wait(1); checkSomething() end -- wastes resources
   GOOD: Use events: something.Changed:Connect(handler)

8. NOT DISCONNECTING EVENTS:
   BAD: part.Touched:Connect(handler) -- leaks if part destroyed but connection lives
   GOOD: local conn = part.Touched:Connect(handler); later: conn:Disconnect()

9. STORING REFERENCES TO DESTROYED INSTANCES:
   BAD: local ref = part; part:Destroy(); print(ref.Name) -- errors
   GOOD: Set ref = nil when destroying

10. USING string.format WITHOUT pcall FOR USER INPUT:
    BAD: string.format("Hello %s", userInput) -- could crash with malformed input
    GOOD: tostring(userInput) -- safe coercion

─── ARCHITECTURE ANTI-PATTERNS ───

11. ONE GIANT SCRIPT:
    BAD: 5000-line server script that does everything
    GOOD: Separate ModuleScripts per system, boot script requires them

12. CLIENT-AUTHORITATIVE GAMEPLAY:
    BAD: Client calculates damage, sends "I dealt 9999 damage" to server
    GOOD: Client sends "I swung my weapon", server calculates damage

13. STORING GAMEPLAY STATE IN WORKSPACE INSTANCE NAMES:
    BAD: part.Name = "Health_75" -- fragile, no type safety
    GOOD: Use Attributes: part:SetAttribute("Health", 75)

14. USING GLOBALSCRIPTS (Script in Workspace):
    BAD: Script inside a Part in Workspace
    GOOD: Scripts in ServerScriptService, LocalScripts in StarterPlayerScripts

15. CIRCULAR MODULE DEPENDENCIES:
    BAD: ModuleA requires ModuleB, ModuleB requires ModuleA
    GOOD: Use an EventBus or dependency injection pattern

16. NOT USING TYPES:
    BAD: function foo(a, b, c) -- what are these?
    GOOD: function foo(player: Player, itemId: string, quantity: number): boolean

17. TRUSTING RemoteEvent ARGUMENT ORDER:
    BAD: Assuming arg1 is always a string because "that's what the client sends"
    GOOD: typeof(arg1) == "string" check on EVERY argument

18. SAVING ON EVERY CHANGE:
    BAD: DataStore:SetAsync() every time player picks up a coin
    GOOD: Cache in memory, auto-save every 5 minutes + save on leave

19. NOT HANDLING PlayerRemoving:
    BAD: No save on disconnect — data lost
    GOOD: Players.PlayerRemoving:Connect(saveAndCleanup)
    ALSO: game:BindToClose(saveAllPlayers) for server shutdown

20. USING WHILE LOOPS FOR TIMERS:
    BAD: while cooldown > 0 do cooldown -= task.wait() end
    GOOD: local endTime = os.clock() + cooldownDuration; if os.clock() >= endTime then ready end

─── UI ANTI-PATTERNS ───

21. TEXT NOT SCALED:
    BAD: TextLabel.TextSize = 24 -- tiny on 4K, huge on mobile
    GOOD: TextScaled = true with UITextSizeConstraint

22. HARDCODED POSITIONS:
    BAD: Frame.Position = UDim2.new(0, 500, 0, 300) -- breaks on different resolutions
    GOOD: Use Scale: UDim2.new(0.5, 0, 0.5, 0) with AnchorPoint

23. UI NOT ACCESSIBLE ON MOBILE:
    BAD: Tiny buttons, hover-dependent tooltips
    GOOD: 44px minimum touch targets, tap-to-show tooltips

24. NO LOADING STATES:
    BAD: UI shows empty/broken while data loads
    GOOD: Show loading spinner until data arrives

25. BLOCKING THE RENDER THREAD WITH UI:
    BAD: Creating 1000 UI elements in one frame
    GOOD: Batch creation across frames or virtualize (only render visible items)

─── NETWORKING ANTI-PATTERNS ───

26. FIRING REMOTES EVERY FRAME:
    BAD: RunService.Heartbeat:Connect(function() remote:FireServer(mousePos) end)
    GOOD: Throttle to 10-20 fires per second, batch data

27. SENDING FULL STATE EVERY UPDATE:
    BAD: Send all 50 NPC positions every update
    GOOD: Send only changed positions (delta updates)

28. NOT RATE-LIMITING REMOTES:
    BAD: Any client can spam 1000 requests per second
    GOOD: Server-side rate limiter (see patterns section)

29. REMOTE FUNCTION WITHOUT TIMEOUT:
    BAD: RemoteFunction:InvokeClient(player) -- if client never responds, server thread hangs
    GOOD: NEVER use InvokeClient. Use RemoteEvent fire-and-forget instead.
    NOTE: InvokeClient is dangerous because exploiter can yield forever, leaking server threads.

30. SENDING INSTANCES OVER REMOTES:
    BAD: remote:FireClient(player, workspacePart) -- fragile, breaks with streaming
    GOOD: Send identifiers (part name/ID), client finds the instance locally

─── PERFORMANCE ANTI-PATTERNS ───

31. PHYSICS ON DECORATIVE PARTS:
    BAD: 5000 unanchored decoration parts
    GOOD: Anchor everything that doesn't need to move

32. TOUCHED EVENTS FOR DETECTION:
    BAD: 100 kill bricks with Touched events
    GOOD: Use spatial queries on player position (cheaper)

33. NOT USING STREAMING:
    BAD: Entire 500,000 part map loaded for every player
    GOOD: Enable StreamingEnabled, set appropriate radius

34. HUMANOID ON NON-CHARACTERS:
    BAD: Adding Humanoid to decoration models "for health bars"
    GOOD: Use BillboardGui for health bars on non-character models

35. CREATING PARTS IN LOOPS WITHOUT CLEANUP:
    BAD: Every second, create a new effect part (never destroyed)
    GOOD: Use Debris:AddItem(part, lifetime) or explicit cleanup
`

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SECTION 11: ROBLOX API QUICK REFERENCE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const API_QUICK_REFERENCE = `
=== ROBLOX API QUICK REFERENCE ===
Most commonly used APIs with correct syntax. Use this to avoid API errors.

─── SERVICES ───

local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local ServerStorage = game:GetService("ServerStorage")
local ServerScriptService = game:GetService("ServerScriptService")
local StarterGui = game:GetService("StarterGui")
local RunService = game:GetService("RunService")
local TweenService = game:GetService("TweenService")
local Debris = game:GetService("Debris")
local DataStoreService = game:GetService("DataStoreService")
local CollectionService = game:GetService("CollectionService")
local PathfindingService = game:GetService("PathfindingService")
local MarketplaceService = game:GetService("MarketplaceService")
local SoundService = game:GetService("SoundService")
local UserInputService = game:GetService("UserInputService") -- CLIENT ONLY
local ContextActionService = game:GetService("ContextActionService") -- CLIENT ONLY
local HttpService = game:GetService("HttpService")
local TextService = game:GetService("TextService")
local TeleportService = game:GetService("TeleportService")
local MessagingService = game:GetService("MessagingService")
local MemoryStoreService = game:GetService("MemoryStoreService")
local PhysicsService = game:GetService("PhysicsService")
local ProximityPromptService = game:GetService("ProximityPromptService")
local BadgeService = game:GetService("BadgeService")

─── PLAYER ───

Players.PlayerAdded:Connect(function(player: Player)
  player.CharacterAdded:Connect(function(character: Model)
    local humanoid = character:WaitForChild("Humanoid")
    local rootPart = character:WaitForChild("HumanoidRootPart")
    -- character is ready
  end)
end)

Players.PlayerRemoving:Connect(function(player: Player)
  -- save data, cleanup
end)

player.UserId -- unique number ID
player.Name -- display name
player.DisplayName -- custom display name
player.Team -- current team
player:Kick("reason") -- disconnect player
player:GetMouse() -- CLIENT ONLY, deprecated — use UserInputService
player:IsInGroup(groupId) -- check Roblox group membership
player:GetRankInGroup(groupId) -- get rank number in group

─── HUMANOID ───

humanoid.Health -- current health
humanoid.MaxHealth -- max health
humanoid.WalkSpeed -- movement speed (default 16)
humanoid.JumpPower -- jump force (default 50, or use JumpHeight)
humanoid.JumpHeight -- jump height in studs (alternative to JumpPower)
humanoid:TakeDamage(amount) -- reduce health (respects ForceField)
humanoid.Died:Connect(function() end)
humanoid:MoveTo(position) -- make NPC walk to position
humanoid.MoveToFinished:Connect(function(reached) end)
humanoid:EquipTool(tool) -- force equip a tool
humanoid:UnequipTools() -- unequip all tools
humanoid:AddAccessory(accessory) -- add hat/accessory to character
humanoid:ChangeState(Enum.HumanoidStateType.Physics) -- ragdoll
humanoid:SetStateEnabled(Enum.HumanoidStateType.Jumping, false) -- disable jumping

─── TWEENSERVICE ───

local info = TweenInfo.new(duration, easingStyle, easingDirection, repeatCount, reverses, delayTime)
local tween = TweenService:Create(instance, info, propertyTable)
tween:Play()
tween:Pause()
tween:Cancel()
tween.Completed:Connect(function(playbackState) end)
tween.Completed:Wait()

-- Easing styles: Linear, Sine, Back, Quad, Quart, Quint, Bounce, Elastic, Exponential, Circular, Cubic
-- Easing directions: In, Out, InOut

─── RAYCASTING ───

local params = RaycastParams.new()
params.FilterType = Enum.RaycastFilterType.Exclude -- or Include
params.FilterDescendantsInstances = { character }
params.RespectCanCollide = true
params.IgnoreWater = false

local result = workspace:Raycast(origin, direction * distance, params)
if result then
  result.Instance -- what was hit
  result.Position -- exact hit point (Vector3)
  result.Normal -- surface normal at hit point (Vector3)
  result.Material -- material at hit point (Enum.Material)
  result.Distance -- distance from origin to hit
end

─── SPATIAL QUERIES ───

local overlapParams = OverlapParams.new()
overlapParams.FilterType = Enum.RaycastFilterType.Exclude
overlapParams.FilterDescendantsInstances = { character }

-- Box query:
local parts = workspace:GetPartBoundsInBox(cframe, size, overlapParams)

-- Sphere query:
local parts = workspace:GetPartBoundsInRadius(position, radius, overlapParams)

-- Overlap query:
local parts = workspace:GetPartsInPart(triggerPart, overlapParams)

─── DATASTORESERVICE ───

local store = DataStoreService:GetDataStore("StoreName")
local orderedStore = DataStoreService:GetOrderedDataStore("LeaderboardName")

-- Basic operations (ALWAYS wrap in pcall):
local success, data = pcall(store.GetAsync, store, key)
local success, err = pcall(store.SetAsync, store, key, value)
local success, err = pcall(store.UpdateAsync, store, key, function(old)
  -- return new value (nil = don't update)
  return newValue
end)
local success, err = pcall(store.RemoveAsync, store, key)

-- Ordered DataStore (for leaderboards):
local success, pages = pcall(orderedStore.GetSortedAsync, orderedStore, false, 100) -- descending, page size 100
if success then
  while true do
    for _, entry in pages:GetCurrentPage() do
      print(entry.key, entry.value) -- key = userId string, value = score
    end
    if pages.IsFinished then break end
    pages:AdvanceToNextPageAsync()
  end
end

─── PART CREATION REFERENCE ───

local part = Instance.new("Part")
part.Name = "MyPart"
part.Size = Vector3.new(4, 1, 8)
part.CFrame = CFrame.new(0, 5, 0) -- position + rotation
part.Color = Color3.fromRGB(255, 128, 0)
part.Material = Enum.Material.Concrete
part.Anchored = true
part.CanCollide = true
part.CanTouch = true -- for Touched events
part.CanQuery = true -- for raycasts
part.Transparency = 0 -- 0 = opaque, 1 = invisible
part.Reflectance = 0 -- 0 to 1
part.Shape = Enum.PartType.Block -- Block, Ball, Cylinder, Wedge, CornerWedge
part.TopSurface = Enum.SurfaceType.Smooth
part.BottomSurface = Enum.SurfaceType.Smooth
part.Parent = workspace -- ALWAYS SET PARENT LAST

-- Common materials:
Enum.Material.Concrete -- default rough surface
Enum.Material.Brick -- textured brick
Enum.Material.Wood -- warm wood grain
Enum.Material.Metal -- shiny metal
Enum.Material.Glass -- transparent, reflective
Enum.Material.Neon -- self-illuminating (GLOW!)
Enum.Material.Grass -- organic green
Enum.Material.Sand -- granular texture
Enum.Material.Ice -- slippery, translucent
Enum.Material.Fabric -- soft, cloth-like
Enum.Material.Marble -- smooth stone
Enum.Material.Granite -- rough stone
Enum.Material.DiamondPlate -- industrial floor
Enum.Material.ForceField -- energy shield look

─── SOUND ───

local sound = Instance.new("Sound")
sound.SoundId = "rbxassetid://123456789"
sound.Volume = 0.5 -- 0 to 10
sound.Pitch = 1 -- playback speed/pitch
sound.Looped = false
sound.RollOffMode = Enum.RollOffMode.InverseTapered -- for 3D positional
sound.RollOffMaxDistance = 100
sound.RollOffMinDistance = 10
sound.Parent = part -- parent to part for 3D positioning
sound:Play()
sound.Ended:Connect(function() end)

-- For UI/global sounds, parent to SoundService
sound.Parent = SoundService

─── PROXIMITY PROMPT ───

local prompt = Instance.new("ProximityPrompt")
prompt.ActionText = "Open Chest"
prompt.ObjectText = "Treasure Chest"
prompt.KeyboardKeyCode = Enum.KeyCode.E
prompt.HoldDuration = 0 -- seconds to hold (0 = instant)
prompt.MaxActivationDistance = 10
prompt.RequiresLineOfSight = true
prompt.Parent = part

prompt.Triggered:Connect(function(player: Player)
  -- Player activated the prompt
end)

─── MARKETPLACESERVICE (Robux purchases) ───

-- Developer Products (one-time purchase, can buy multiple):
MarketplaceService:PromptProductPurchase(player, productId)

MarketplaceService.ProcessReceipt = function(receiptInfo)
  local player = Players:GetPlayerByUserId(receiptInfo.PlayerId)
  if player then
    -- Grant the product (coins, items, etc.)
    return Enum.ProductPurchaseDecision.PurchaseGranted
  end
  return Enum.ProductPurchaseDecision.NotProcessedYet
end

-- Game Passes (one-time permanent purchase):
MarketplaceService:PromptGamePassPurchase(player, gamePassId)
local ownsPass = MarketplaceService:UserOwnsGamePassAsync(player.UserId, gamePassId)

-- Process receipt is CRITICAL: if you return NotProcessedYet, Roblox will retry.
-- ALWAYS save receipt to DataStore to prevent duplicate grants.

─── TEXTSERVICE (chat filtering — REQUIRED) ───

local function filterText(text: string, fromUserId: number, toUserId: number): string
  local success, filtered = pcall(function()
    local result = TextService:FilterStringAsync(text, fromUserId)
    return result:GetChatForUserAsync(toUserId)
  end)
  return success and filtered or "***"
end

-- For display to all users:
local function filterForBroadcast(text: string, fromUserId: number): string
  local success, filtered = pcall(function()
    local result = TextService:FilterStringAsync(text, fromUserId)
    return result:GetNonChatStringForBroadcastAsync()
  end)
  return success and filtered or "***"
end
`

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SECTION 12: SYSTEM INTEGRATION PATTERNS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const SYSTEM_INTEGRATION = `
=== SYSTEM INTEGRATION PATTERNS ===
How different systems connect together in real games. Use this to build cohesive game experiences.

─── RPG SYSTEM WEB ───

In a typical RPG, systems are deeply interconnected:

COMBAT → HEALTH: Combat deals damage through Health system
COMBAT → XP: Kills grant XP through XP system
COMBAT → LOOT: Kill triggers loot roll through Loot system
COMBAT → QUEST: Kill updates kill quest objectives
COMBAT → ACHIEVEMENT: Kill increments "total kills" stat
COMBAT → STATUS: Attacks can apply status effects (burn, stun)
COMBAT → EQUIPMENT: Weapon stats determine damage output

INVENTORY → EQUIPMENT: Items move from inventory to equipment slots
INVENTORY → CRAFTING: Materials consumed from inventory
INVENTORY → TRADING: Items transferred between players
INVENTORY → QUEST: Quest items tracked in inventory
INVENTORY → SHOP: Items bought go to inventory, sold come from inventory

QUEST → CURRENCY: Quest completion awards currency
QUEST → XP: Quest completion awards XP
QUEST → INVENTORY: Quest completion awards items
QUEST → DIALOG: NPCs give and complete quests through dialog
QUEST → ACHIEVEMENT: Quest completion counts toward achievement
QUEST → REPUTATION: Quest completion increases faction reputation

XP → LEVEL: XP accumulation triggers level ups
LEVEL → STATS: Level up grants stat points
LEVEL → SKILLS: Level up grants skill points
LEVEL → EQUIPMENT: Level gates equipment requirements
LEVEL → AREAS: Level gates area access
LEVEL → QUESTS: Level gates quest availability

Integration rule: NEVER have System A directly modify System B's data.
Instead, System A fires an event, and System B listens for it and updates itself.

─── TYCOON SYSTEM WEB ───

DROPPER → CONVEYOR → COLLECTOR → CURRENCY
  Dropper creates item → Conveyor moves it → Collector converts to currency
  Each step is a separate system that communicates through physical interaction

CURRENCY → PURCHASE → DROPPER/UPGRADE
  Currency enables purchases → Purchases unlock new droppers or upgrades
  Purchase buttons appear sequentially (next button appears when previous is bought)

UPGRADE → DROPPER: Multiplier upgrades affect dropper output value
UPGRADE → CONVEYOR: Speed upgrades affect conveyor speed
UPGRADE → COLLECTOR: Range upgrades affect collector radius

REBIRTH → CURRENCY: Rebirth costs currency and resets it
REBIRTH → MULTIPLIER: Rebirth grants permanent income multiplier
REBIRTH → UNLOCK: Rebirth unlocks new dropper tiers and upgrades
REBIRTH → PRESTIGE: Rebirth currency buys permanent perks

─── SIMULATOR SYSTEM WEB ───

CLICK → POWER: Click gives power based on multipliers
POWER → AREA: Power unlocks higher areas
AREA → ENEMIES: Area contains clickable objects/enemies
ENEMIES → COINS: Destroying enemies gives coins (scaled by area)
COINS → EGGS: Coins buy pet eggs
EGGS → PETS: Eggs hatch into pets
PETS → MULTIPLIER: Equipped pets multiply power/coins/luck
MULTIPLIER → CLICK: Higher multiplier = more power per click (loop!)

REBIRTH → MULTIPLIER: Rebirth gives permanent multiplier
REBIRTH → RESET: Rebirth resets power, coins, area progress
REBIRTH → UNLOCK: Rebirth unlocks new areas, pets, eggs

─── EVENT-DRIVEN INTEGRATION EXAMPLE ───

Here's how a single player action flows through multiple systems:

PLAYER KILLS ENEMY:
1. CombatService detects kill (final damage reduces HP to 0)
2. CombatService fires EventBus("EnemyKilled", { player, enemyId, enemyLevel, damage dealt })
3. Listeners respond:
   a. XPService: grants XP based on enemy level + player level difference
   b. LootService: rolls drop table, creates loot drops or adds to inventory
   c. QuestService: checks all active kill quests, updates matching objectives
   d. AchievementService: increments "total_kills", "kills_this_session", checks thresholds
   e. CombatLogService: records kill for stats/leaderboard
   f. PetService: grants pet XP (if player has pets equipped)
   g. ComboService: increments kill combo counter (bonus rewards at 5, 10, 25 kills)
   h. SoundService: plays kill sound effect
   i. VFXService: plays death animation on enemy
   j. NPCService: starts enemy respawn timer

Each listener is independent. Adding a new system just means adding a new listener.
Removing a system just means removing its listener. No other code changes needed.

─── SAVE DATA COMPOSITION ───

When multiple systems need to save data, compose into a single save:

function DataService:CompileSaveData(player: Player)
  return {
    version = CURRENT_DATA_VERSION,
    -- Core
    level = XPService:GetLevel(player),
    xp = XPService:GetXP(player),
    class = ClassService:GetClass(player),

    -- Currency
    currencies = CurrencyService:GetAllBalances(player),

    -- Inventory + Equipment
    inventory = InventoryService:Serialize(player),
    equipment = EquipmentService:Serialize(player),

    -- Progression
    quests = QuestService:Serialize(player),
    achievements = AchievementService:Serialize(player),
    skills = SkillService:Serialize(player),

    -- Social
    guildId = GuildService:GetGuildId(player),

    -- Settings
    settings = SettingsService:Serialize(player),

    -- Stats
    stats = StatsService:Serialize(player),

    -- Timestamps
    lastSave = os.time(),
    totalPlayTime = StatsService:GetTotalPlayTime(player),
  }
end

function DataService:LoadSaveData(player: Player, data)
  data = self:MigrateData(data) -- handle version upgrades

  XPService:Deserialize(player, data)
  ClassService:Deserialize(player, data)
  CurrencyService:Deserialize(player, data)
  InventoryService:Deserialize(player, data)
  EquipmentService:Deserialize(player, data)
  QuestService:Deserialize(player, data)
  AchievementService:Deserialize(player, data)
  SkillService:Deserialize(player, data)
  SettingsService:Deserialize(player, data)
  StatsService:Deserialize(player, data)
end

Each service handles its own serialization/deserialization.
DataService just coordinates the save/load.

─── UI INTEGRATION PATTERNS ───

UI should NEVER modify game state directly. Always go through remotes.

PATTERN: UI → Remote → Service → Data → Event → UI Update

Example (buying an item):
1. Player clicks "Buy" button in ShopUI
2. ShopUI fires BuyItem RemoteEvent with (itemId, quantity)
3. Server ShopService receives, validates, processes purchase
4. ShopService calls CurrencyService:SpendCurrency()
5. ShopService calls InventoryService:AddItem()
6. Both services fire update events to client
7. Client ShopUI updates coin display (from CurrencyChanged event)
8. Client InventoryUI updates item grid (from InventoryUpdated event)

The UI components don't need to know about each other.
They each listen for their own update events independently.

─── CROSS-SYSTEM VALIDATION ───

When an action requires multiple systems to agree:

function ShopService:BuyItem(player, itemId, quantity)
  -- 1. Validate item exists in shop
  local shopItem = ShopDatabase:GetItem(itemId)
  if not shopItem then return false, "Item not found" end

  -- 2. Validate level requirement (XP system)
  if XPService:GetLevel(player) < shopItem.levelReq then
    return false, "Level too low"
  end

  -- 3. Validate affordability (Currency system)
  local totalCost = shopItem.price * quantity
  if not CurrencyService:CanAfford(player, shopItem.currency, totalCost) then
    return false, "Can't afford"
  end

  -- 4. Validate inventory space (Inventory system)
  if not InventoryService:HasSpace(player, quantity) then
    return false, "Inventory full"
  end

  -- 5. Validate stock (Shop system)
  if shopItem.stock and shopItem.currentStock < quantity then
    return false, "Out of stock"
  end

  -- ALL validations passed — now execute atomically
  CurrencyService:SpendCurrency(player, shopItem.currency, totalCost, "shop_purchase")
  InventoryService:AddItem(player, itemId, quantity)
  if shopItem.stock then
    shopItem.currentStock -= quantity
  end

  EventBus:Fire("ItemPurchased", player, itemId, quantity, totalCost)
  return true, "Success"
end

KEY: Validate ALL conditions BEFORE modifying ANY data.
If any validation fails, nothing changes. This prevents partial state corruption.
`

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SECTION 13: COMPLETE GAME TEMPLATES (10 genres, minimal viable system list)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const GAME_TEMPLATES = `
=== COMPLETE GAME TEMPLATES — WHAT TO BUILD FOR EACH GENRE ===
For each game type: minimum systems needed, optional systems for polish, and the build order.

─── 1. TYCOON TEMPLATE ───

MINIMUM SYSTEMS (in build order):
1. Plot assignment (assign plot to player on join)
2. Currency system (single currency: coins)
3. Purchase button system (floor pads that unlock sequentially)
4. Dropper system (spawns parts at interval)
5. Conveyor system (moves parts with BodyVelocity or TweenService)
6. Collector system (converts parts to coins on touch)
7. Upgrade system (speed, value, auto-collect)
8. DataStore save/load

POLISH SYSTEMS:
- Rebirth system (reset for multiplier)
- Prestige currency (earned from rebirth)
- Pet system (cosmetic followers)
- Leaderboard (richest players)
- Daily rewards
- Codes system (promotional codes for free currency)
- VIP gamepass (2x earnings)
- Music system (background tycoon music)

BUILD ORDER: Plot → Currency → Buttons → Droppers → Conveyors → Collector → Upgrades → Save
Time estimate: 30-60 minutes for minimum, 2-3 hours for full game

─── 2. SIMULATOR TEMPLATE ───

MINIMUM SYSTEMS:
1. Click detection (tool or click part)
2. Power/strength counter
3. Coin system (earn from clicking enemies/objects)
4. Area system (unlocked by power threshold)
5. Basic upgrade shop (click multiplier, auto-click)
6. Pet system (eggs + hatching + equip)
7. Rebirth system
8. DataStore save/load

POLISH SYSTEMS:
- Leaderboard (power ranking)
- Codes system
- Trading system (pet trading)
- Daily rewards
- Battle pass / season pass
- Gamepasses (auto-click, 2x luck, extra pet slots)
- World bosses (community click events)
- Backpack system (limited carry capacity → upgrades)

BUILD ORDER: Click → Power → Coins → Areas → Upgrades → Pets → Rebirth → Save
Time estimate: 30-60 minutes for minimum

─── 3. RPG TEMPLATE ───

MINIMUM SYSTEMS:
1. Health/damage system
2. Combat (melee or magic, one type minimum)
3. XP/leveling
4. Basic inventory (weapons, potions)
5. Equipment (weapon slot minimum)
6. NPC enemies (patrol, aggro, attack, loot)
7. Basic shop (buy weapons, potions)
8. Respawn system
9. DataStore save/load

POLISH SYSTEMS:
- Quest system (kill quests, collect quests)
- Skill tree
- Class system (warrior/mage/archer)
- Crafting
- Pet companions
- Boss battles
- Housing
- Guild system
- Achievement system
- Status effects (burn, freeze, poison)
- Day/night cycle
- Weather system

BUILD ORDER: Health → Combat → Enemies → XP → Inventory → Equipment → Shop → Respawn → Save
Time estimate: 1-2 hours for minimum, full RPG is an ongoing project

─── 4. OBBY TEMPLATE ───

MINIMUM SYSTEMS:
1. Checkpoint system (TouchParts at each stage)
2. Kill brick system (parts that kill on touch)
3. Stage counter UI
4. Respawn at checkpoint
5. DataStore save (highest stage reached)

POLISH SYSTEMS:
- Timer (per-stage and total)
- Leaderboard (fastest completion, highest stage)
- Stage skip (purchasable or earned)
- Moving obstacles (TweenService animated)
- Difficulty rating per stage
- Coil/gravity coil/speed coil shop
- Daily rewards
- Cosmetics (trail colors, hats)

BUILD ORDER: Checkpoints → Kill bricks → UI → Respawn → Save
Time estimate: 15-30 minutes for minimum

─── 5. TOWER DEFENSE TEMPLATE ───

MINIMUM SYSTEMS:
1. Enemy path system (waypoints, enemies follow path)
2. Wave system (spawn enemies in waves)
3. Tower placement (click grid to place)
4. Tower targeting AI (find nearest enemy, shoot)
5. Tower damage (reduce enemy health)
6. Currency (earn from kills, spend on towers)
7. Lives system (enemies reaching end = lose lives)
8. Round flow (wave start → enemies → wave complete → shop time → next wave)

POLISH SYSTEMS:
- Tower upgrades (3-5 levels per tower)
- Tower targeting modes (first, last, strongest, weakest)
- Multiple tower types (basic, sniper, splash, slow)
- Tower selling (refund partial cost)
- Difficulty modes (easy, normal, hard, nightmare)
- Boss waves
- Multiplayer (shared map, individual towers)
- Leaderboard (highest wave)
- Endless mode

BUILD ORDER: Path → Enemies → Waves → Placement → Towers → Damage → Currency → Lives
Time estimate: 1-2 hours for minimum

─── 6. FIGHTING GAME TEMPLATE ───

MINIMUM SYSTEMS:
1. Health system
2. Melee combat (punch, kick, or weapon)
3. Hitbox detection (server-side)
4. Knockback
5. Respawn system
6. Round/match system (1v1 or FFA)
7. Lobby/queue

POLISH SYSTEMS:
- Combo system (chain attacks)
- Special moves/abilities
- Block/parry
- Character selection
- ELO matchmaking
- Leaderboard (wins, ELO)
- Spectator system
- Cosmetics
- Emotes

BUILD ORDER: Health → Combat → Hitbox → Knockback → Respawn → Rounds → Lobby
Time estimate: 1-2 hours for minimum

─── 7. SURVIVAL GAME TEMPLATE ───

MINIMUM SYSTEMS:
1. Health system
2. Hunger/thirst system (drain over time)
3. Inventory (limited slots)
4. Resource gathering (trees, rocks, ores)
5. Crafting (basic tools, weapons, shelter)
6. Day/night cycle
7. Enemy spawning (zombies, animals)
8. Building system (walls, floors, doors)
9. DataStore save/load

POLISH SYSTEMS:
- Weather system
- Cooking system
- Vehicle system
- Trading
- Electricity/power system
- Farming
- Taming animals
- Multiplayer base raiding
- Clan system
- Map/minimap

BUILD ORDER: Health → Hunger → Inventory → Gathering → Crafting → Day/Night → Enemies → Building → Save
Time estimate: 2-4 hours for minimum

─── 8. RACING GAME TEMPLATE ───

MINIMUM SYSTEMS:
1. Vehicle physics (VehicleSeat + constraints)
2. Track with checkpoints
3. Lap counter
4. Position tracking (who's in 1st, 2nd, etc.)
5. Race flow (lobby → countdown → race → results)
6. Timer (race time, best time)

POLISH SYSTEMS:
- Multiple tracks
- Vehicle selection/customization
- Boost pads
- Item boxes (Mario Kart style)
- Drift boost mechanic
- Leaderboard (best times)
- Vehicle upgrades (speed, handling)
- Multiplayer lobby
- Ghost replay (race against your best time)

BUILD ORDER: Vehicle → Track → Checkpoints → Laps → Positions → Race flow → Timer
Time estimate: 1-2 hours for minimum

─── 9. HORROR GAME TEMPLATE ───

MINIMUM SYSTEMS:
1. Dark lighting (Lighting.Brightness = 0, fog, atmosphere)
2. Flashlight tool
3. Monster AI (patrol, chase, kill)
4. Key/door puzzle system (find key to unlock door)
5. Checkpoint/save system
6. Jumpscare system (triggered by proximity or action)
7. Sound design (ambient, footsteps, monster sounds, music stings)

POLISH SYSTEMS:
- Multiple chapters/levels
- Inventory (keys, items, notes)
- Collectible notes (lore)
- Multiple endings
- Hiding mechanic (closet, under bed)
- Sanity meter
- Co-op multiplayer
- Monster variety (different AI behaviors)
- Puzzle variety (code locks, pattern matching)

BUILD ORDER: Lighting → Flashlight → Monster AI → Keys/Doors → Checkpoints → Jumpscares → Sound
Time estimate: 1-2 hours for minimum

─── 10. BATTLE ROYALE TEMPLATE ───

MINIMUM SYSTEMS:
1. Lobby system (waiting for players)
2. Match start (teleport to map, countdown)
3. Shrinking zone (safe zone gets smaller over time)
4. Weapon system (find and equip weapons on map)
5. Health/shield system
6. Elimination detection
7. Last player standing = victory
8. Loot spawns (random weapon placement on map)

POLISH SYSTEMS:
- Squad system (duos, trios, quads)
- Weapon rarity tiers
- Healing items (medkits, shields)
- Building (Fortnite-style)
- Spectating (after death)
- Kill feed
- Storm warning
- Supply drops (airdrops with rare loot)
- Vehicle spawns
- Cosmetics (skins, emotes)
- Battle pass
- Leaderboard (wins, kills, K/D ratio)

BUILD ORDER: Lobby → Match start → Zone → Weapons → Health → Elimination → Victory → Loot
Time estimate: 2-4 hours for minimum

─── UNIVERSAL SYSTEMS (add to ANY game) ───

These systems work in every game type and always improve the experience:

1. SETTINGS MENU: Music volume, SFX volume, graphics quality, controls display
2. CODES SYSTEM: Promotional codes for free items/currency (drives social sharing)
3. DAILY REWARDS: Simple 7-day cycle, brings players back daily
4. LEADERBOARD: Show top players (always motivating)
5. LOADING SCREEN: Custom loading screen with tips (hide default Roblox loading)
6. ANTI-CHEAT: At minimum: speed check, teleport check, value validation
7. DATASTORE: Save player progress (even for session-based games, save cosmetics/stats)
8. MOBILE SUPPORT: Touch controls, larger buttons, optimized part count
9. SOUND DESIGN: Background music, ambient sounds, UI sounds, action sounds
10. TUTORIAL: Brief intro showing controls and core mechanic (max 30 seconds)
`

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SECTION 14: MONETIZATION PATTERNS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const MONETIZATION_PATTERNS = `
=== MONETIZATION PATTERNS FOR ROBLOX ===
How to implement ethical monetization that players appreciate.

─── GAMEPASS IMPLEMENTATION ───

Gamepasses are one-time purchases that give permanent benefits.
Use MarketplaceService:UserOwnsGamePassAsync(userId, passId) to check ownership.

Common gamepasses (every game should have 2-5):
1. VIP Pass (R$99-199): 2x currency, VIP badge, VIP chat color, VIP server access
2. Auto-Farm/Auto-Click (R$49-99): automates repetitive action (click, farm, collect)
3. Extra Storage (R$49): double inventory/pet slots
4. Speed Boost (R$29): permanent 1.5x walkspeed
5. Radio Pass (R$49): play custom music in-game

Implementation pattern:
-- Server: check on join
local function applyGamepasses(player)
  local function check(passId, callback)
    task.spawn(function()
      local success, owns = pcall(MarketplaceService.UserOwnsGamePassAsync, MarketplaceService, player.UserId, passId)
      if success and owns then
        callback(player)
      end
    end)
  end

  check(VIP_PASS_ID, function(p)
    p:SetAttribute("VIP", true)
    p:SetAttribute("CurrencyMultiplier", 2)
  end)

  check(SPEED_PASS_ID, function(p)
    p:SetAttribute("SpeedBoost", true)
    -- Applied when character spawns
  end)
end

-- Listen for mid-game purchases:
MarketplaceService.PromptGamePassPurchaseFinished:Connect(function(player, passId, purchased)
  if purchased then
    applyGamepassEffect(player, passId)
  end
end)

─── DEVELOPER PRODUCT IMPLEMENTATION ───

Developer Products are repeatable purchases (buy multiple times).

Common developer products:
1. Currency packs: 100 coins (R$5), 500 coins (R$19), 2000 coins (R$49), 10000 coins (R$149)
2. Revive/Continue: R$5 to respawn immediately or continue a run
3. Reroll/Spin: R$10 to reroll pet egg, loot drop, or slot machine
4. Skip Stage: R$5 to skip current obby stage
5. Boost (timed): R$25 for 30 minutes of 2x XP/coins

Implementation:
-- Server: ProcessReceipt callback (REQUIRED)
local processedReceipts = {} -- prevent double-processing

MarketplaceService.ProcessReceipt = function(receipt)
  local key = receipt.PlayerId .. "_" .. receipt.PurchaseId
  if processedReceipts[key] then
    return Enum.ProductPurchaseDecision.PurchaseGranted
  end

  local player = Players:GetPlayerByUserId(receipt.PlayerId)
  if not player then
    return Enum.ProductPurchaseDecision.NotProcessedYet
  end

  local productId = receipt.ProductId
  local granted = false

  if productId == COINS_100_ID then
    CurrencyService:AddCurrency(player, "coins", 100, "purchase")
    granted = true
  elseif productId == COINS_500_ID then
    CurrencyService:AddCurrency(player, "coins", 500, "purchase")
    granted = true
  elseif productId == REVIVE_ID then
    RespawnService:InstantRevive(player)
    granted = true
  elseif productId == BOOST_30MIN_ID then
    BoostService:ActivateBoost(player, "2x_xp", 1800) -- 30 minutes
    granted = true
  end

  if granted then
    processedReceipts[key] = true
    -- Save receipt to DataStore for persistence
    saveReceipt(receipt.PlayerId, receipt.PurchaseId)
    return Enum.ProductPurchaseDecision.PurchaseGranted
  end

  return Enum.ProductPurchaseDecision.NotProcessedYet
end

─── ETHICAL MONETIZATION RULES ───

DO:
- Sell cosmetics (skins, trails, emotes, chat colors, pets)
- Sell convenience (auto-farm, speed, extra storage)
- Sell time savers (XP boosts, skip waiting)
- Offer everything earnable through gameplay (just faster with purchase)
- Show exact purchase before buying (no loot boxes with hidden odds)
- Keep free experience complete and fun

DON'T:
- Sell power (pay-to-win kills games — players leave)
- Gate core content behind paywall (main story, essential areas)
- Use manipulative dark patterns (countdown timers creating false urgency)
- Make game unplayable without purchases (too slow, too hard without paying)
- Hide odds for random purchases (Roblox ToS requires disclosure)
- Target young children with aggressive monetization

PRICING PSYCHOLOGY:
- Most popular price points: R$5, R$25, R$49, R$99, R$199
- Anchor with a high-priced "Ultimate Pack" to make medium packs look reasonable
- Bundle items for 10-20% discount vs individual purchase
- First-purchase bonus (2x value on first buy) drives initial conversion
- Limited-time items create urgency (but use sparingly and honestly)
`

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SECTION 15: ADVANCED LUAU TECHNIQUES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const ADVANCED_LUAU = `
=== ADVANCED LUAU TECHNIQUES ===

─── TYPE ANNOTATIONS ───

Luau supports type annotations for better code quality:

type PlayerData = {
  level: number,
  xp: number,
  inventory: { [string]: number },
  equipment: {
    weapon: string?,
    armor: string?,
    accessory: string?,
  },
  settings: {
    music: boolean,
    sfx: boolean,
    sensitivity: number,
  },
}

type ItemDefinition = {
  id: string,
  name: string,
  description: string,
  category: "weapon" | "armor" | "consumable" | "material" | "quest",
  rarity: "common" | "uncommon" | "rare" | "epic" | "legendary",
  maxStack: number,
  price: number,
  stats: { attack: number?, defense: number?, speed: number? }?,
}

-- Function type annotations:
local function calculateDamage(attacker: Player, defender: Player, weaponId: string): (number, boolean)
  -- returns damage amount and whether it was a critical hit
  return damage, isCrit
end

-- Generic-style patterns (Luau doesn't have full generics but you can annotate):
local function findInTable(tbl: {any}, predicate: (any) -> boolean): any?
  for _, v in tbl do
    if predicate(v) then return v end
  end
  return nil
end

─── METATABLES FOR OOP ───

Luau OOP pattern with full inheritance:

-- Base class
local Entity = {}
Entity.__index = Entity

function Entity.new(name: string, health: number)
  return setmetatable({
    name = name,
    health = health,
    maxHealth = health,
    alive = true,
  }, Entity)
end

function Entity:TakeDamage(amount: number)
  self.health = math.max(0, self.health - amount)
  if self.health <= 0 and self.alive then
    self.alive = false
    self:OnDeath()
  end
end

function Entity:OnDeath()
  -- Override in subclass
end

-- Subclass
local Enemy = setmetatable({}, { __index = Entity })
Enemy.__index = Enemy

function Enemy.new(name: string, health: number, damage: number, lootTable: string)
  local self = Entity.new(name, health)
  setmetatable(self, Enemy)
  self.damage = damage
  self.lootTable = lootTable
  self.state = "idle"
  return self
end

function Enemy:OnDeath()
  -- Override parent behavior
  self.state = "dead"
  LootService:RollLoot(self.lootTable)
end

function Enemy:Attack(target)
  target:TakeDamage(self.damage)
end

─── TABLE MANIPULATION UTILITIES ───

-- Deep copy (for DataStore data that needs modification without affecting original):
local function deepCopy(original)
  local copy = {}
  for key, value in original do
    if type(value) == "table" then
      copy[key] = deepCopy(value)
    else
      copy[key] = value
    end
  end
  return copy
end

-- Merge tables (shallow):
local function merge(base, override)
  local result = {}
  for k, v in base do result[k] = v end
  for k, v in override do result[k] = v end
  return result
end

-- Filter array:
local function filter(tbl, predicate)
  local result = {}
  for _, v in tbl do
    if predicate(v) then
      table.insert(result, v)
    end
  end
  return result
end

-- Map array:
local function map(tbl, transform)
  local result = {}
  for i, v in tbl do
    result[i] = transform(v, i)
  end
  return result
end

-- Reduce array:
local function reduce(tbl, reducer, initial)
  local acc = initial
  for _, v in tbl do
    acc = reducer(acc, v)
  end
  return acc
end

-- Shuffle array (Fisher-Yates):
local function shuffle(tbl)
  local n = #tbl
  for i = n, 2, -1 do
    local j = math.random(1, i)
    tbl[i], tbl[j] = tbl[j], tbl[i]
  end
  return tbl
end

-- Weighted random selection:
local function weightedRandom(weights: { [string]: number }): string
  local total = 0
  for _, weight in weights do
    total += weight
  end
  local roll = math.random() * total
  for item, weight in weights do
    roll -= weight
    if roll <= 0 then
      return item
    end
  end
  -- Fallback (shouldn't reach here):
  for item in weights do return item end
  error("Empty weights table")
end

─── COROUTINE PATTERNS ───

-- Task queue (process items one per frame to avoid lag spikes):
local function processQueue(items, processFunc, itemsPerFrame)
  itemsPerFrame = itemsPerFrame or 1
  local index = 1

  local conn
  conn = RunService.Heartbeat:Connect(function()
    for _ = 1, itemsPerFrame do
      if index > #items then
        conn:Disconnect()
        return
      end
      processFunc(items[index])
      index += 1
    end
  end)
end

-- Usage: spawn 100 enemies across 100 frames instead of all at once
processQueue(enemySpawnPositions, function(pos)
  spawnEnemy(pos)
end, 1)

-- Timeout wrapper (prevent infinite yields):
local function withTimeout(seconds: number, func: () -> any): (boolean, any)
  local result = nil
  local done = false

  task.spawn(function()
    result = func()
    done = true
  end)

  local start = os.clock()
  while not done and (os.clock() - start) < seconds do
    task.wait()
  end

  return done, result
end

-- Usage:
local success, data = withTimeout(5, function()
  return DataStore:GetAsync(key)
end)

─── CFRAME MATH CHEATSHEET ───

-- Position only:
CFrame.new(x, y, z)

-- Position + look at target:
CFrame.lookAt(fromPosition, targetPosition)

-- Position + orientation (angles in radians):
CFrame.new(x, y, z) * CFrame.Angles(rx, ry, rz)

-- Degrees to radians:
math.rad(degrees)

-- Get forward/right/up vectors:
local lookVector = cframe.LookVector     -- forward direction
local rightVector = cframe.RightVector   -- right direction
local upVector = cframe.UpVector         -- up direction

-- Offset relative to CFrame:
local inFront = cframe * CFrame.new(0, 0, -5) -- 5 studs in front
local above = cframe * CFrame.new(0, 5, 0)    -- 5 studs above
local toRight = cframe * CFrame.new(5, 0, 0)  -- 5 studs to the right

-- Interpolation (smooth movement between two CFrames):
local blended = startCFrame:Lerp(endCFrame, alpha) -- alpha 0-1

-- Rotate around axis:
CFrame.fromAxisAngle(Vector3.new(0, 1, 0), angle) -- rotate around Y axis

-- Extract position:
local position = cframe.Position -- Vector3

-- CFrame multiplication order:
-- cframe1 * cframe2 applies cframe2 IN cframe1's LOCAL SPACE
-- This means: translate/rotate relative to cframe1's orientation

-- Common pattern: orbit camera around target:
local angle = tick() * rotationSpeed
local offset = CFrame.new(0, height, distance) -- behind and above
local cameraCFrame = CFrame.new(targetPosition) * CFrame.Angles(0, angle, 0) * offset

─── COLOR UTILITIES ───

-- Create colors:
Color3.fromRGB(255, 128, 0)      -- from 0-255 values
Color3.fromHSV(0.5, 1, 1)        -- from hue/saturation/value (0-1 each)
Color3.new(1, 0.5, 0)             -- from 0-1 float values
BrickColor.new("Bright red")      -- from BrickColor name

-- Lerp colors:
local blended = color1:Lerp(color2, 0.5) -- halfway between

-- Color to/from hex (useful for config):
local function hexToColor3(hex: string): Color3
  hex = hex:gsub("#", "")
  return Color3.fromRGB(
    tonumber(hex:sub(1, 2), 16),
    tonumber(hex:sub(3, 4), 16),
    tonumber(hex:sub(5, 6), 16)
  )
end

-- Rainbow color from time:
local function rainbowColor(t: number): Color3
  return Color3.fromHSV(t % 1, 1, 1)
end
`

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SECTION 16: SOUND DESIGN REFERENCE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const SOUND_DESIGN_REFERENCE = `
=== SOUND DESIGN REFERENCE FOR ROBLOX ===
Complete guide to implementing professional sound in any game.

─── SOUND CATEGORIES & IMPLEMENTATION ───

Every game needs these sound categories:

1. MUSIC (background):
   - Menu/lobby music: calm, inviting, loopable (60-120 seconds)
   - Gameplay music: matches game mood (action, exploration, tension)
   - Boss music: intense, dramatic, higher tempo
   - Victory/defeat: short stingers (5-15 seconds)
   - Implementation: Sound in SoundService, Looped = true, Volume = 0.3-0.5
   - Crossfade between tracks (fade out current over 1s, fade in new over 1s)

2. AMBIENT (environmental):
   - Forest: birds chirping, wind through leaves, distant water
   - Cave: dripping water, echoing footsteps, wind howl
   - City: crowd murmur, distant traffic, wind between buildings
   - Ocean: waves crashing, seagulls, wind
   - Night: crickets, owl hoots, wind
   - Implementation: Sound parented to region trigger Part, RollOff for 3D positioning
   - Layer 2-3 ambient sounds for richness

3. SFX (sound effects):
   - UI: button click, hover, menu open/close, error buzz, success chime, notification ding
   - Combat: sword swing, hit impact (varies by material), shield block, spell cast, bow release
   - Movement: footsteps (varies by material), jump, land, swim, climb
   - Interaction: door open/close, chest open, item pickup, craft complete, lever pull
   - Feedback: level up fanfare, achievement unlock, quest complete, death sound
   - Implementation: Sound in relevant Part or character, Volume = 0.5-1.0

─── FOOTSTEP SYSTEM ───

Professional footstep implementation:

Server/Client (client for responsiveness):
- Detect ground material: Humanoid.FloorMaterial
- Map material to sound set: { Grass = grassSounds, Concrete = concreteSounds, Wood = woodSounds, ... }
- Each set has 3-5 variations to avoid repetition
- Play on Humanoid.Running event (when speed > 0)
- Step interval: 0.35-0.45 seconds at WalkSpeed 16 (scale with speed)
- Volume: 0.3-0.5, RollOff for 3D
- Pitch variation: random 0.9-1.1 per step for naturalness

Material sound mappings:
- Grass/Leaves: soft rustling
- Concrete/Brick/Slate: hard tap
- Wood/WoodPlanks: hollow clunk
- Metal/DiamondPlate: metallic clang
- Sand: soft crunch
- Snow/Ice: crisp crunch
- Water: splash
- Glass: sharp tap
- Fabric: muffled step

─── DYNAMIC MUSIC SYSTEM ───

Layers-based approach (most flexible):

-- Base layer: always playing (ambient, melodic, calm)
-- Action layer: fades in during combat, fades out when combat ends
-- Tension layer: fades in during stealth/danger, low rumble
-- Boss layer: overrides all, dramatic

local function setMusicState(state: "calm" | "combat" | "boss" | "tension")
  local targets = {
    calm = { base = 0.4, action = 0, tension = 0, boss = 0 },
    combat = { base = 0.2, action = 0.5, tension = 0, boss = 0 },
    tension = { base = 0.3, action = 0, tension = 0.4, boss = 0 },
    boss = { base = 0, action = 0, tension = 0, boss = 0.5 },
  }

  local target = targets[state]
  -- Tween each layer's volume to target over 2 seconds
  for layerName, volume in target do
    TweenService:Create(layers[layerName], TweenInfo.new(2), { Volume = volume }):Play()
  end
end

─── SOUND PROPERTY CHEATSHEET ───

Sound:
  Volume: 0-10 (default 0.5, game sounds typically 0.3-1.0)
  Pitch / PlaybackSpeed: 0.1-10 (1 = normal, 2 = double speed/pitch)
  Looped: boolean
  RollOffMode: InverseTapered (realistic distance falloff)
  RollOffMinDistance: 10 (full volume within this range)
  RollOffMaxDistance: 100 (silent beyond this range)
  SoundGroup: parent to SoundGroup for volume control categories

SoundGroup (organize sounds by category):
  Master → Music (Volume = 0.5)
         → SFX (Volume = 0.8)
         → Ambient (Volume = 0.4)
         → UI (Volume = 0.6)
  Player settings adjust SoundGroup volumes.

─── AUDIO TIPS ───

1. NEVER play sounds at Volume > 1.0 unless intentionally loud (explosion).
2. Randomize pitch slightly (0.9-1.1) to avoid robotic repetition.
3. Use SoundGroups for player volume control.
4. 3D sounds: parent to the Part making the sound.
5. UI sounds: parent to SoundService or PlayerGui (not positional).
6. Don't overlap the same sound — either stop previous or ignore new play.
7. Use TimePosition to resume music from where it stopped.
8. Silence is a tool — quiet moments make loud moments more impactful.
9. Sound budget: max ~20 simultaneous sounds for performance.
10. Test on low-end devices — some mobile devices distort with too many concurrent sounds.
`

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// COMBINED EXPORT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const SCRIPTING_BIBLE = `
${SYSTEM_DESIGNS}

${DATA_ARCHITECTURE}

${CLIENT_SERVER_PATTERNS}

${UI_PATTERNS}

${PERFORMANCE_BIBLE}

${EFFECT_RECIPES}

${LUAU_CODE_PATTERNS}

${GAME_BALANCE_FORMULAS}

${ARCHITECTURE_BLUEPRINTS}

${ANTI_PATTERNS}

${API_QUICK_REFERENCE}

${SYSTEM_INTEGRATION}

${GAME_TEMPLATES}

${MONETIZATION_PATTERNS}

${ADVANCED_LUAU}

${SOUND_DESIGN_REFERENCE}
`

// ── Section getters for targeted injection ──────────────────────────────────────

export function getSystemDesign(systemName: string): string {
  // Find the section in SYSTEM_DESIGNS that matches the system name
  const sections = SYSTEM_DESIGNS.split('────────────────────────────────────────────────────────────')
  for (const section of sections) {
    if (section.toLowerCase().includes(systemName.toLowerCase())) {
      return section.trim()
    }
  }
  return ''
}

export function getSystemDesignsForTaskType(taskType: string): string {
  // Return relevant system designs based on task type
  const typeMapping: Record<string, string[]> = {
    'script': ['CURRENCY', 'INVENTORY', 'EQUIPMENT', 'QUEST', 'XP/LEVELING', 'HEALTH/DAMAGE', 'STATUS EFFECTS', 'ANTI-CHEAT', 'ADMIN'],
    'economy': ['CURRENCY', 'SHOP', 'TRADING', 'AUCTION', 'CRAFTING', 'DAILY REWARDS', 'BATTLE PASS'],
    'combat': ['MELEE', 'RANGED', 'MAGIC', 'HEALTH/DAMAGE', 'STATUS EFFECTS', 'BOSS BATTLE'],
    'npc': ['NPC DIALOG', 'NPC MERCHANT', 'NPC ENEMY AI', 'BOSS BATTLE', 'WAVE/HORDE'],
    'ui': ['UI DESIGN PATTERNS', 'SHOP', 'INVENTORY', 'QUEST', 'ACHIEVEMENT'],
    'building': ['HOUSING/PLOT', 'TOWER DEFENSE', 'TYCOON'],
    'terrain': ['DAY/NIGHT', 'WEATHER', 'FARMING'],
    'vehicle': ['MOUNT/VEHICLE', 'RACING'],
    'pet': ['PET SYSTEM', 'SIMULATOR'],
    'audio': ['EFFECT RECIPES'],
    'lighting': ['DAY/NIGHT', 'WEATHER', 'EFFECT RECIPES'],
  }

  const relevantSystems = typeMapping[taskType] || []
  const results: string[] = []

  for (const systemName of relevantSystems) {
    const design = getSystemDesign(systemName)
    if (design) {
      results.push(design)
    }
  }

  // Cap at 8000 chars to avoid context overflow
  const combined = results.join('\n\n')
  return combined.length > 8000 ? combined.slice(0, 8000) : combined
}

export function getDataArchitecture(): string {
  return DATA_ARCHITECTURE
}

export function getClientServerPatterns(): string {
  return CLIENT_SERVER_PATTERNS
}

export function getUIPatterns(): string {
  return UI_PATTERNS
}

export function getPerformanceBible(): string {
  return PERFORMANCE_BIBLE
}

export function getEffectRecipes(): string {
  return EFFECT_RECIPES
}

export function getEffectRecipe(effectName: string): string {
  const effects = EFFECT_RECIPES.split(/\d+\.\s+[A-Z]/)
  for (const effect of effects) {
    if (effect.toLowerCase().includes(effectName.toLowerCase())) {
      return effect.trim()
    }
  }
  return ''
}

export function getLuauCodePatterns(): string {
  return LUAU_CODE_PATTERNS
}

export function getGameBalanceFormulas(): string {
  return GAME_BALANCE_FORMULAS
}

export function getArchitectureBlueprints(): string {
  return ARCHITECTURE_BLUEPRINTS
}

export function getAntiPatterns(): string {
  return ANTI_PATTERNS
}

export function getApiQuickReference(): string {
  return API_QUICK_REFERENCE
}

export function getSystemIntegration(): string {
  return SYSTEM_INTEGRATION
}

export function getGameTemplates(): string {
  return GAME_TEMPLATES
}

export function getMonetizationPatterns(): string {
  return MONETIZATION_PATTERNS
}

export function getAdvancedLuau(): string {
  return ADVANCED_LUAU
}

export function getSoundDesignReference(): string {
  return SOUND_DESIGN_REFERENCE
}

/**
 * Get a targeted slice of the scripting bible based on what the AI is building.
 * This avoids injecting the full 200K+ character bible and instead gives
 * the most relevant 6000-8000 characters for the task at hand.
 */
export function getScriptingBibleForContext(context: string): string {
  const lower = context.toLowerCase()
  const sections: string[] = []

  // Always include client-server patterns (universal)
  sections.push(CLIENT_SERVER_PATTERNS.slice(0, 2000))

  // Add relevant system designs
  if (['combat', 'fight', 'attack', 'weapon', 'sword', 'damage', 'health', 'pvp'].some(k => lower.includes(k))) {
    sections.push(getSystemDesignsForTaskType('combat'))
  }
  if (['shop', 'buy', 'sell', 'store', 'currency', 'coin', 'economy', 'price'].some(k => lower.includes(k))) {
    sections.push(getSystemDesignsForTaskType('economy'))
  }
  if (['npc', 'enemy', 'boss', 'ai', 'pathfind', 'dialog', 'quest'].some(k => lower.includes(k))) {
    sections.push(getSystemDesignsForTaskType('npc'))
  }
  if (['pet', 'hatch', 'egg', 'follow', 'mount', 'vehicle'].some(k => lower.includes(k))) {
    sections.push(getSystemDesignsForTaskType('pet'))
  }
  if (['ui', 'gui', 'interface', 'hud', 'menu', 'button', 'layout'].some(k => lower.includes(k))) {
    sections.push(UI_PATTERNS.slice(0, 4000))
  }
  if (['datastore', 'save', 'data', 'persist', 'load'].some(k => lower.includes(k))) {
    sections.push(DATA_ARCHITECTURE.slice(0, 4000))
  }
  if (['effect', 'particle', 'vfx', 'visual', 'fire', 'explosion', 'sparkle'].some(k => lower.includes(k))) {
    sections.push(EFFECT_RECIPES.slice(0, 4000))
  }
  if (['performance', 'lag', 'optimize', 'fps', 'memory'].some(k => lower.includes(k))) {
    sections.push(PERFORMANCE_BIBLE.slice(0, 4000))
  }
  if (['balance', 'formula', 'xp', 'level', 'damage formula', 'drop rate'].some(k => lower.includes(k))) {
    sections.push(GAME_BALANCE_FORMULAS.slice(0, 4000))
  }
  if (['tycoon', 'simulator', 'obby', 'rpg', 'tower defense', 'horror', 'racing', 'survival', 'battle royale', 'fighting'].some(k => lower.includes(k))) {
    sections.push(GAME_TEMPLATES.slice(0, 4000))
  }
  if (['robux', 'gamepass', 'monetize', 'developer product', 'purchase'].some(k => lower.includes(k))) {
    sections.push(MONETIZATION_PATTERNS.slice(0, 3000))
  }
  if (['sound', 'audio', 'music', 'footstep', 'sfx'].some(k => lower.includes(k))) {
    sections.push(SOUND_DESIGN_REFERENCE.slice(0, 3000))
  }

  // If nothing matched, give general patterns
  if (sections.length <= 1) {
    sections.push(LUAU_CODE_PATTERNS.slice(0, 3000))
    sections.push(API_QUICK_REFERENCE.slice(0, 3000))
  }

  const combined = sections.join('\n\n')
  return combined.length > 8000 ? combined.slice(0, 8000) : combined
}
