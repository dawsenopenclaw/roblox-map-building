/**
 * Game Systems Knowledge Base — 200+ Roblox game systems the AI knows how to build.
 *
 * This is NOT a template library. This is KNOWLEDGE — compact descriptions of
 * how to implement every common Roblox game system. The AI uses this as reference
 * material to generate code for ANY request, not just preset genres.
 *
 * Format: category → system name → implementation blueprint (compact)
 * Each blueprint is ~2-5 lines describing the key components, services, and patterns.
 *
 * Injected into the AI prompt via getGameSystemKnowledge(intent, category).
 * Only the RELEVANT systems are injected (not all 200+) to save tokens.
 */

export interface GameSystem {
  name: string
  /** Compact implementation blueprint — what services, instances, patterns to use */
  how: string
  /** Keywords that trigger this system being injected */
  keywords: string[]
}

export interface SystemCategory {
  name: string
  systems: GameSystem[]
}

const GAME_SYSTEMS: SystemCategory[] = [
  // ════════════════════════════════════════════════════════════════════
  // CURRENCY & ECONOMY
  // ════════════════════════════════════════════════════════════════════
  {
    name: 'Currency & Economy',
    systems: [
      { name: 'Basic Currency', keywords: ['coin', 'cash', 'money', 'currency', 'gold'],
        how: 'IntValue in leaderstats Folder. DataStoreService save on PlayerRemoving. pcall all GetAsync/SetAsync. Auto-save every 60s via task.spawn loop.' },
      { name: 'Multi-Currency', keywords: ['gem', 'diamond', 'token', 'multiple currency'],
        how: 'Multiple IntValues in leaderstats (Coins, Gems, Tickets). Shared DataStore key "p_{userId}" storing table {coins=0, gems=0}. json encode/decode.' },
      { name: 'Premium Currency', keywords: ['robux', 'premium', 'gamepass currency', 'paid currency'],
        how: 'DevProduct for purchasing premium currency. MarketplaceService:PromptProductPurchase(). ProcessReceipt callback. Store pending receipts in DataStore to handle edge cases.' },
      { name: 'Trading System', keywords: ['trade', 'trading', 'exchange', 'swap'],
        how: 'RemoteEvent "TradeRequest". Server validates both players have items. Atomic swap: deduct from both, add to both in single pcall. Trade cooldown 30s. UI: two-panel Frame showing each player items.' },
      { name: 'Auction House', keywords: ['auction', 'marketplace', 'sell', 'buy listing'],
        how: 'DataStore "Auctions" with listings {seller, item, price, expiry}. RemoteFunction to list/buy/cancel. Server validates ownership before listing. Sorted by price. 10% fee on sale.' },
      { name: 'Daily Rewards', keywords: ['daily', 'reward', 'streak', 'login bonus', 'daily login'],
        how: 'DataStore stores {lastClaim: os.time(), streak: 1}. On join: if os.time()-lastClaim >= 86400, increment streak (reset if >172800). Rewards table [50,75,100,150,200,300,500]. ScreenGui with day cards.' },
      { name: 'Donation System', keywords: ['donate', 'donation', 'tip'],
        how: 'DevProduct for each amount (10,50,100,500). BillboardGui above player head showing total donated. Leaderboard for top donors. Sound effect on donate.' },
      { name: 'Rebirth System', keywords: ['rebirth', 'prestige', 'reset', 'new game plus'],
        how: 'IntValue "Rebirths" in leaderstats. Cost = baseAmount * 2^rebirths. On rebirth: reset coins to 0, increment rebirths, multiply all earnings by 1+rebirths*0.5. Confirmation GUI before rebirth.' },
      { name: 'Coin Magnet', keywords: ['coin magnet', 'attract coins', 'magnet', 'coin pull', 'magnet upgrade'],
        how: 'Invisible sphere around player (magnitude check every 0.1s). Coins within range fly toward player via TweenService position tween (0.3s). Upgrade increases range (10→30 studs). Visual: yellow trail on attracted coins via Trail instance.' },
      { name: 'Luck/Multiplier System', keywords: ['luck', 'luck multiplier', 'drop rate', 'rarity boost', 'luck potion'],
        how: 'NumberValue "Luck" (default 1.0) per player. Gamepasses/potions increase temporarily (task.delay to reset). Affects: weighted random rolls multiplied by Luck value (luck=2 doubles rare chance). HUD display shows current luck. Color changes from white→gold at high luck.' },
      { name: 'Crop/Farm Market', keywords: ['sell crops', 'farm market', 'sell farm', 'crop value', 'farm economy'],
        how: 'Market NPC with ProximityPrompt. Sell screen: ScrollingFrame listing player crops with quantity. Price per unit varies by crop rarity. "Sell All" button. Server validates inventory, deducts crops, adds coins. Price fluctuation: random modifier 0.8-1.2 per crop that changes every 5 minutes. Persist in DataStore.' },
    ],
  },

  // ════════════════════════════════════════════════════════════════════
  // COMBAT & DAMAGE
  // ════════════════════════════════════════════════════════════════════
  {
    name: 'Combat & Damage',
    systems: [
      { name: 'Melee Combat', keywords: ['sword', 'melee', 'slash', 'hit', 'attack', 'combat'],
        how: 'Tool with Handle. Activate event → play Animation, enable hitbox for 0.3s. Region3 or GetTouchingParts for hit detection. Cooldown 0.5s. Damage via Humanoid:TakeDamage(). Knockback via BodyVelocity 0.15s.' },
      { name: 'Ranged Combat', keywords: ['gun', 'shoot', 'projectile', 'ranged', 'bow', 'bullet'],
        how: 'Tool. Activate → cast ray from camera. If hit Humanoid, TakeDamage. Visual: small Part traveling along ray path. Bullet drop optional. Ammo IntValue. Reload animation 1.5s.' },
      { name: 'Health System', keywords: ['health', 'hp', 'damage', 'heal', 'health bar'],
        how: 'Humanoid.MaxHealth. BillboardGui health bar above head: Frame bg + colored Frame (width = health/maxHealth). Color gradient green→yellow→red. Heal via Humanoid.Health += amount.' },
      { name: 'Knockback', keywords: ['knockback', 'push', 'force', 'launch'],
        how: 'BodyVelocity on HumanoidRootPart. Velocity = direction * force. MaxForce = Vector3.one * 1e5. Debris:AddItem(bv, 0.15). Apply after damage.' },
      { name: 'Skill/Ability System', keywords: ['skill', 'ability', 'spell', 'power', 'ultimate'],
        how: 'ModuleScript "Skills" with table of {name, cooldown, damage, range, animation}. RemoteEvent "UseSkill". Server checks cooldown via tick(). Visual effects via ParticleEmitter. Cooldown shown on UI button.' },
      { name: 'PvP Arena', keywords: ['pvp', 'arena', 'duel', '1v1', 'versus'],
        how: 'Queue system: RemoteEvent "JoinQueue". Server matches 2 players. Teleport to arena. 3-2-1 countdown. Track kills. First to 5 wins. Teleport back. Reward winner.' },
      { name: 'Boss Fight', keywords: ['boss', 'boss fight', 'raid', 'boss battle'],
        how: 'Large Model with Humanoid (high HP). AI: patrol → detect player in range → chase → attack pattern (3 moves cycling). Health phases at 75%/50%/25% change behavior. Loot drop on death. Respawn timer.' },
      { name: 'Tower Defense', keywords: ['tower defense', 'td', 'turret', 'wave', 'defend'],
        how: 'Path: series of CFrame waypoints. Enemies spawn, walk path via Humanoid:MoveTo. Towers: ClickDetector to place. Each tower: Region3 scan for enemies, attack nearest. Waves: spawn count increases. Currency per kill.' },
      { name: 'Weapon Upgrade Tree', keywords: ['weapon upgrade', 'sword upgrade', 'gun upgrade', 'weapon level', 'blacksmith'],
        how: 'Config table {level, damage, speed, special_effect}. Upgrade at blacksmith NPC (ProximityPrompt). Server checks coins >= cost, deducts, increments weapon level in DataStore. Visual changes per level: size scale, particle color, trail color. Max level 10.' },
      { name: 'Capture the Flag', keywords: ['capture the flag', 'ctf', 'flag', 'flag capture'],
        how: 'Two team bases with flag Part (BrickColor team color). Touch enemy flag → weld to HumanoidRootPart via WeldConstraint. Return to own base (Touched) → score +1 point. On death: flag drops (unweld, Part.CFrame = death position). Own flag must be at base to score.' },
      { name: 'Team Deathmatch', keywords: ['team deathmatch', 'tdm', 'team kills', 'team score'],
        how: 'Two teams, colored SpawnLocations at team bases. Kill = +1 to team IntValue score. Respawn 5s delay (task.wait). Match timer 300s. Team with most kills wins. Score displayed via BillboardGui at each base. RemoteEvent syncs scores to all clients.' },
      { name: 'Shield/Block System', keywords: ['shield', 'block', 'parry', 'guard', 'deflect'],
        how: 'Tool or keybind (F) activates block. BoolValue "Blocking" set server-side. On damage: if Blocking=true, reduce damage by 80%, play block sound, spark ParticleEmitter at impact point. Perfect block (within 0.15s of attack): full reflect, attacker stunned 0.5s. Stamina cost while holding block.' },
      { name: 'Loot Drop System', keywords: ['loot drop', 'item drop', 'loot', 'drop item', 'loot bag'],
        how: 'On enemy death: roll weighted random table for each potential drop. Spawn physical Part items at death position with slight random BodyVelocity outward. BillboardGui shows item name/rarity. Touched by player → RemoteEvent → server adds to inventory. Despawn uncollected items after 60s via Debris:AddItem.' },
    ],
  },

  // ════════════════════════════════════════════════════════════════════
  // UI & GUI SYSTEMS
  // ════════════════════════════════════════════════════════════════════
  {
    name: 'UI & GUI',
    systems: [
      { name: 'Shop GUI', keywords: ['shop', 'store', 'buy', 'purchase', 'shop gui'],
        how: 'ScreenGui > Frame (dark bg). ScrollingFrame with UIGridLayout. Item cards: ImageLabel + TextLabel name + TextLabel price + TextButton "Buy". RemoteEvent "Purchase". Server validates coins >= price.' },
      { name: 'Inventory GUI', keywords: ['inventory', 'backpack', 'items', 'inventory gui'],
        how: 'ScreenGui > Frame. ScrollingFrame with UIGridLayout (5 columns). Slot = ImageButton with item icon. Click to equip/use. Data: table in DataStore. RemoteEvent "EquipItem".' },
      { name: 'Settings GUI', keywords: ['settings', 'options', 'preferences', 'settings gui'],
        how: 'ScreenGui > Frame. Sections: Audio (volume slider), Graphics (quality dropdown), Controls (keybind display). Sliders: Frame with draggable inner Frame. Save to DataStore. Apply immediately.' },
      { name: 'Dialog System', keywords: ['dialog', 'dialogue', 'npc talk', 'conversation', 'npc dialog'],
        how: 'ProximityPrompt on NPC (distance 8). ScreenGui dialog box at bottom. TypewriterEffect: spawn loop adding chars. Choice buttons. Branching: table {text, choices: [{text, next}]}. Advance with click.' },
      { name: 'HUD', keywords: ['hud', 'heads up', 'game ui', 'status bar'],
        how: 'ScreenGui with multiple Frames positioned around edges. Top: currency display. Bottom-left: health/stamina bars. Top-right: minimap (ViewportFrame). Bottom-center: hotbar. All use UICorner+UIStroke.' },
      { name: 'Notification System', keywords: ['notification', 'toast', 'alert', 'popup', 'announce'],
        how: 'ScreenGui > Frame anchored top-center. Queue system: new notifications slide in from top, auto-dismiss after 3s. TweenService slide animation. Types: success(green), error(red), info(blue), warning(yellow).' },
      { name: 'Leaderboard GUI', keywords: ['leaderboard', 'scoreboard', 'ranking', 'top players'],
        how: 'ScreenGui > Frame. Header row. ScrollingFrame with UIListLayout. Each row: rank number + player name + score. Update every 5s. OrderedDataStore for persistence. Top 100.' },
      { name: 'Loading Screen', keywords: ['loading', 'loading screen', 'splash'],
        how: 'ReplicatedFirst LocalScript. ScreenGui covers entire screen. Logo center. Progress bar. ContentProvider:PreloadAsync(assets). Remove when done. game:IsLoaded() check.' },
      { name: 'Minimap', keywords: ['minimap', 'map', 'radar'],
        how: 'ViewportFrame in corner of screen. WorldModel clone of terrain/buildings (simplified). Camera positioned top-down. Player dot indicator. Update camera position to follow player every frame.' },
    ],
  },

  // ════════════════════════════════════════════════════════════════════
  // NPC & AI
  // ════════════════════════════════════════════════════════════════════
  {
    name: 'NPC & AI',
    systems: [
      { name: 'NPC Patrol', keywords: ['npc', 'patrol', 'guard', 'walk around', 'wander'],
        how: 'Model with Humanoid. Waypoints: table of Vector3. task.spawn loop: MoveTo each point, MoveToFinished:Wait(), task.wait(2), next point. Loop back to first.' },
      { name: 'Enemy AI', keywords: ['enemy', 'ai', 'chase', 'hostile', 'mob'],
        how: 'States: idle/patrol/chase/attack. Detect player: magnitude < 50. Chase: MoveTo player position every 0.5s. Attack: if magnitude < 5, TakeDamage. Return to patrol if player escapes range.' },
      { name: 'NPC Shop', keywords: ['npc shop', 'vendor', 'merchant', 'shopkeeper'],
        how: 'ProximityPrompt on NPC model. Triggers shop ScreenGui via RemoteEvent. NPC has BillboardGui with name. Shop items in ModuleScript config table.' },
      { name: 'Pet System', keywords: ['pet', 'companion', 'follow', 'pet system'],
        how: 'Small Model that follows player. BodyPosition to stay near HumanoidRootPart + offset. AlignOrientation to face player direction. Rarity system: Common/Rare/Epic/Legendary with color-coded BillboardGui.' },
      { name: 'Pet Egg Hatching', keywords: ['egg', 'hatch', 'gacha', 'egg hatching'],
        how: 'ClickDetector on egg model. DevProduct purchase. Random pet from weighted table. Hatching animation: egg shakes (CFrame oscillation), cracks (Decal swap), reveals pet. Inventory save to DataStore.' },
      { name: 'Quest System', keywords: ['quest', 'mission', 'task', 'objective'],
        how: 'ModuleScript with quest definitions: {id, title, description, objectives: [{type:"collect",target:"Coin",count:10}], rewards: {coins:100}}. Track progress in DataStore. BillboardGui "!" over quest givers.' },
      { name: 'Spawner System', keywords: ['spawner', 'spawn enemies', 'mob spawner', 'wave spawner'],
        how: 'Part as spawn point. Config: mob model, interval (5s), max alive (10), range (100). task.spawn loop: if alive < max and player in range, clone mob, parent to workspace. Track alive count.' },
    ],
  },

  // ════════════════════════════════════════════════════════════════════
  // PROGRESSION & GAME LOOPS
  // ════════════════════════════════════════════════════════════════════
  {
    name: 'Progression & Game Loops',
    systems: [
      { name: 'Level/XP System', keywords: ['level', 'xp', 'experience', 'level up'],
        how: 'IntValues: Level, XP in leaderstats. XP needed = level * 100. On XP change: if >= needed, level += 1, XP -= needed. Level up effect: ParticleEmitter burst + sound. Unlock abilities per level.' },
      { name: 'Achievement System', keywords: ['achievement', 'badge', 'unlock', 'trophy'],
        how: 'BadgeService:AwardBadge(). ModuleScript defining achievements: {id, name, condition, badgeId}. Check conditions on events (first kill, 100 coins, etc). Notification popup on earn.' },
      { name: 'Upgrade System', keywords: ['upgrade', 'improve', 'level up stat', 'boost'],
        how: 'Config table: {Speed={cost=100,mult=1.5}, Damage={cost=200,mult=2}}. RemoteEvent "Upgrade". Server: check coins >= cost, deduct, apply multiplier. Save upgrades to DataStore. UI: buttons with cost labels.' },
      { name: 'Tycoon Buttons', keywords: ['tycoon button', 'buy button', 'unlock', 'tycoon upgrade'],
        how: 'Part with ClickDetector + BillboardGui showing cost. On click: check coins >= cost, deduct, destroy button, make purchased item visible (Transparency 0). Chain: each button reveals next.' },
      { name: 'Dropper/Conveyor', keywords: ['dropper', 'conveyor', 'factory', 'tycoon machine'],
        how: 'Dropper: spawn Part every 2s at dropper position. Conveyor: VectorForce or BodyVelocity on parts moving them forward. Collector: Touched event, destroy part, add value to coins. Upgrade: faster drops, higher value.' },
      { name: 'Checkpoint System', keywords: ['checkpoint', 'save point', 'respawn', 'obby checkpoint'],
        how: 'SpawnLocation parts along obby. Touched → set player RespawnLocation = this checkpoint. Save checkpoint index to DataStore. Visual: green glow when activated. Number label.' },
      { name: 'Timer/Speedrun', keywords: ['timer', 'speedrun', 'race timer', 'countdown'],
        how: 'Server tracks start time per player. Display: TextLabel updating every frame via RenderStepped. Format: minutes:seconds.milliseconds. Save best time to OrderedDataStore. Global leaderboard.' },
      { name: 'Zone Unlock', keywords: ['zone', 'area', 'unlock area', 'region'],
        how: 'Invisible Part as zone boundary. Touched: check if player has required level/coins. If yes, allow entry. If no, push back with BodyVelocity. Locked zones: visible barrier (ForceField or glass wall).' },
      { name: 'Battle Pass', keywords: ['battle pass', 'battlepass', 'season pass', 'pass tiers', 'pass rewards'],
        how: '50 tiers. XP earned from playing increments IntValue "BattlePassXP". Each tier threshold = tier * 500 XP. Reward tables: free_track[tier] and premium_track[tier]. GamePass unlocks premium track. ScreenGui: horizontal progress bar with tier icons. Weekly challenges grant bonus XP.' },
      { name: 'Daily Challenges', keywords: ['daily challenge', 'daily quest', 'daily mission', 'daily task', 'daily objectives'],
        how: 'Table of challenge templates [{description, type, target, reward}]. 3 selected daily via math.random seeded by math.floor(os.time()/86400). Track progress per player in DataStore. Reset at midnight UTC (os.time() % 86400 check). UI: checklist ScreenGui with progress bars per challenge.' },
      { name: 'Seasonal Events', keywords: ['seasonal event', 'holiday event', 'limited time event', 'event season', 'event shop'],
        how: 'Date-checked: os.date table checks month/day range. Load holiday decorations from ServerStorage:Clone() when active. Limited-time shop items in separate event shop GUI. Event currency (separate IntValue). Leaderboard for event score via OrderedDataStore. Auto-cleanup: decorations Destroy() when event ends.' },
    ],
  },

  // ════════════════════════════════════════════════════════════════════
  // WORLD & ENVIRONMENT
  // ════════════════════════════════════════════════════════════════════
  {
    name: 'World & Environment',
    systems: [
      { name: 'Day/Night Cycle', keywords: ['day night', 'time of day', 'sun', 'day cycle', 'lighting'],
        how: 'Lighting.ClockTime. task.spawn loop: increment by 0.01 every 0.1s. Cycle 0→24. Adjust Ambient, OutdoorAmbient, Brightness per time. Optional: Atmosphere instance for fog.' },
      { name: 'Weather System', keywords: ['weather', 'rain', 'snow', 'storm', 'fog'],
        how: 'ParticleEmitter attached to camera for rain/snow. Atmosphere instance for fog. Lighting changes for storms (darker, blue tint). Sound for rain/thunder. Random weather changes every 5 min.' },
      { name: 'Terrain Generation', keywords: ['terrain', 'landscape', 'hills', 'terrain gen'],
        how: 'workspace.Terrain:FillRegion() or WriteVoxels(). Perlin noise for height: math.noise(x*0.01, z*0.01)*50. Materials by height: Water<0, Sand<5, Grass<30, Rock<60, Snow>60.' },
      { name: 'Door System', keywords: ['door', 'open door', 'close door', 'sliding door'],
        how: 'ProximityPrompt on door Part. Toggle open/close. Open: TweenService move Part up/sideways. Close: tween back. Sound effect. Optional: require key item or level.' },
      { name: 'Elevator', keywords: ['elevator', 'lift', 'moving platform'],
        how: 'Platform Part. TweenService between floor positions. ProximityPrompt "Call Elevator". Players stand on it (welded or CFrame update). Floor indicator GUI.' },
      { name: 'Teleporter', keywords: ['teleport', 'portal', 'warp', 'fast travel'],
        how: 'Two Parts linked. Touched on Part A → CFrame player to Part B position. Cooldown 3s per player. Visual: ParticleEmitter + Neon material. Sound effect on teleport.' },
      { name: 'Destructible Objects', keywords: ['destroy', 'breakable', 'destructible', 'break'],
        how: 'Part with IntValue "Health". On hit: decrease health. At 0: break into smaller parts (6 random wedges with BodyVelocity outward). Debris:AddItem for cleanup. Respawn after 30s.' },
      { name: 'Vehicle System', keywords: ['vehicle', 'car', 'drive', 'seat', 'motorcycle'],
        how: 'VehicleSeat as driver seat. Constraints: HingeConstraint for wheels (AngularVelocity from throttle). SpringConstraint for suspension. BodyForce for engine. Steer via HingeConstraint servo angle.' },
    ],
  },

  // ════════════════════════════════════════════════════════════════════
  // MULTIPLAYER & SOCIAL
  // ════════════════════════════════════════════════════════════════════
  {
    name: 'Multiplayer & Social',
    systems: [
      { name: 'Team System', keywords: ['team', 'teams', 'red vs blue', 'team select'],
        how: 'Teams service with BrickColor teams. Auto-assign or ScreenGui selector. Team spawn: SpawnLocation with TeamColor. Team-specific areas. Team scores.' },
      { name: 'Party System', keywords: ['party', 'group', 'squad', 'invite'],
        how: 'RemoteEvent "InviteToParty". Server manages party table {leader, members[]}. Max 4. Shared XP bonus. Teleport together. Party chat channel.' },
      { name: 'Chat Commands', keywords: ['chat command', 'admin command', '/command'],
        how: 'Players.PlayerAdded → player.Chatted:Connect. Parse message: if starts with "/" split by space. Command table: {["/speed"] = function(player, args)}. Admin check for dangerous commands.' },
      { name: 'Voting System', keywords: ['vote', 'poll', 'vote map', 'map vote'],
        how: 'RemoteEvent "Vote". Server: options table, track votes per player (1 vote each). Timer 30s. ScreenGui with option buttons + vote counts. On timer end: pick winner, load map.' },
      { name: 'Private Server', keywords: ['private server', 'vip server'],
        how: 'TeleportService:ReserveServer() for private instances. GamePass check for VIP. Custom settings per server (difficulty, rules). Server list GUI.' },
    ],
  },

  // ════════════════════════════════════════════════════════════════════
  // EFFECTS & POLISH
  // ════════════════════════════════════════════════════════════════════
  {
    name: 'Effects & Polish',
    systems: [
      { name: 'Camera Shake', keywords: ['camera shake', 'screen shake', 'impact'],
        how: 'Offset CurrentCamera CFrame by random small values (0.1-0.5 studs). Decay over 0.3s. Trigger on explosion, hit, landing. Use RenderStepped for smooth shake.' },
      { name: 'Particle Effects', keywords: ['particle', 'effect', 'vfx', 'sparkle', 'explosion effect'],
        how: 'ParticleEmitter: set Rate, Speed, Lifetime, Color, Size, Texture. Attach to Part. For burst: Emit(50) then set Rate=0. Common: fire(warm colors), magic(purple+blue), healing(green).' },
      { name: 'Sound System', keywords: ['sound', 'music', 'audio', 'sfx', 'background music'],
        how: 'Sound in SoundService for BGM (Looped=true). Sound in Parts for positional audio. SoundGroup for volume control. Crossfade between tracks: TweenService volume 1→0 and 0→1.' },
      { name: 'Screen Effects', keywords: ['blur', 'color correction', 'bloom', 'screen effect'],
        how: 'BlurEffect in Lighting (Size 0→24 for damage). ColorCorrectionEffect for tinting (red flash on hit). Bloom for glow. SunRays for atmosphere. TweenService to animate.' },
      { name: 'Trail Effect', keywords: ['trail', 'streak', 'motion trail'],
        how: 'Trail instance. Attach to two Attachments on a Part (top and bottom). Set Color, Lifetime, Transparency. Add to sword swings, running, dashing.' },
      { name: 'Footstep Sounds', keywords: ['footstep', 'walk sound', 'step sound'],
        how: 'Humanoid.Running:Connect. Detect material via Raycast down. Play material-specific sound (grass, concrete, wood, metal). Randomize pitch slightly for variety.' },
      { name: 'Achievement Popup', keywords: ['achievement popup', 'achievement notification', 'unlock popup', 'badge popup'],
        how: 'ScreenGui notification Frame anchored right-center. TweenService slides in from right (UDim2 X 1→0.7) + scale (0.8→1). Gold frame, icon ImageLabel, title TextLabel, description TextLabel. Auto-dismiss after 4s (TweenService slide out). Queue system: table of pending popups, show next after dismiss. Sound effect on appear.' },
      { name: 'Damage Indicator Direction', keywords: ['damage direction', 'hit direction', 'damage arrow', 'damage indicator'],
        how: 'On TakeDamage: calculate angle from victim HumanoidRootPart to attacker. Use math.atan2 to get screen-space angle. Rotate arrow Frame by that angle. Red semi-transparent arrow ImageLabel in ScreenGui. TweenService fade Transparency 0→1 over 2s then destroy.' },
      { name: 'Speed Lines Effect', keywords: ['speed lines', 'motion lines', 'fast effect', 'speed visual'],
        how: 'Multiple Beam instances radiating from center attachment. Enable during high speed (Humanoid.WalkSpeed > 30 or BodyVelocity magnitude check). Intensity (Width0/Width1) scales with speed. ColorSequence white→transparent. LocalScript in StarterPlayerScripts updating each frame.' },
    ],
  },

  // ════════════════════════════════════════════════════════════════════
  // MONETIZATION
  // ════════════════════════════════════════════════════════════════════
  {
    name: 'Monetization',
    systems: [
      { name: 'GamePass System', keywords: ['gamepass', 'game pass', 'premium feature'],
        how: 'MarketplaceService:UserOwnsGamePassAsync(player.UserId, passId). Check on join + cache result. Grant perks: 2x coins, VIP area access, special items. PromptGamePassPurchase for buying.' },
      { name: 'DevProduct System', keywords: ['dev product', 'developer product', 'microtransaction'],
        how: 'MarketplaceService.ProcessReceipt callback (CRITICAL: must return PurchaseGranted). Save receipt to DataStore to handle edge cases. Products: coin packs, instant upgrades, cosmetics.' },
      { name: 'VIP System', keywords: ['vip', 'premium', 'exclusive', 'vip area'],
        how: 'GamePass for VIP. Perks: exclusive area (check on Touched), name tag color, 2x earnings, VIP chat tag, special emotes. BillboardGui crown/star above VIP players.' },
      { name: 'Donation Board', keywords: ['donation board', 'donate board', 'tip jar'],
        how: 'SurfaceGui on Part. List of DevProducts (10,50,100,500 Robux). Button for each. On purchase: update board with donor name + amount. Persist top donors in DataStore.' },
    ],
  },

  // ════════════════════════════════════════════════════════════════════
  // DATA & PERSISTENCE
  // ════════════════════════════════════════════════════════════════════
  {
    name: 'Data & Persistence',
    systems: [
      { name: 'DataStore Save System', keywords: ['save', 'data', 'datastore', 'persist', 'save data'],
        how: 'DataStoreService:GetDataStore("PlayerData_v2"). Key: "user_"..userId. Save table: {coins, level, inventory, settings}. HttpService:JSONEncode/Decode. Auto-save 60s. Save on leave. pcall ALL operations.' },
      { name: 'Inventory System', keywords: ['inventory', 'items', 'storage', 'bag'],
        how: 'Table: {[itemId] = {count, equipped}}. Save to DataStore as JSON. Max slots (50 default). Stack identical items. RemoteEvent for equip/use/drop. Server validates all operations.' },
      { name: 'Settings Save', keywords: ['save settings', 'player settings', 'preferences'],
        how: 'DataStore "Settings". Table: {musicVolume, sfxVolume, sensitivity, quality, keybinds}. RemoteEvent "UpdateSetting". Apply on join. Default values for new players.' },
      { name: 'Global Leaderboard', keywords: ['global leaderboard', 'all time', 'top players globally'],
        how: 'OrderedDataStore. SetAsync(userId, score) on meaningful events. GetSortedAsync(false, 100) for top 100. Display in ScreenGui. Cache 60s to avoid throttling.' },
      { name: 'Session Lock', keywords: ['session lock', 'data lock', 'double join', 'duplicate data', 'session guard'],
        how: 'DataStore key "lock_{userId}" stores os.time() on join. On join: GetAsync lock key, if exists and os.time()-lock < 300 → warn player "already in game" and kick. SetAsync lock on join. RemoveAsync on PlayerRemoving. Prevents data duplication from double-join or server crash edge cases.' },
      { name: 'Data Migration', keywords: ['data migration', 'data version', 'save migration', 'data upgrade'],
        how: 'Version number stored in save table ("version" key, default 1). On load: compare to current version constant. Run migration functions in order: v1→v2 renames keys, adds new fields with defaults, removes obsolete keys. Never lose data — always migrate forward. Log migrations via print.' },
      { name: 'DataStore Backup', keywords: ['data backup', 'backup save', 'rollback data', 'data restore'],
        how: 'On each save: write to primary key "p_{userId}" and backup key "backup_{userId}" (with timestamp attribute). On load failure: pcall primary, if error → load backup. Backup rotates: keep last 3 saves via keys backup_0/1/2, cycle with modulo. Admin command to force restore from backup.' },
    ],
  },

  // ════════════════════════════════════════════════════════════════════
  // BUILDING & CREATION
  // ════════════════════════════════════════════════════════════════════
  {
    name: 'Building & Creation',
    systems: [
      { name: 'Placement System', keywords: ['place', 'build mode', 'placement', 'sandbox build'],
        how: 'Ghost preview: clone model, set transparency 0.5, follow mouse via Mouse.Hit. Snap to grid: round position to nearest N studs. Click to place: clone and anchor. Delete mode: click to remove. Save placements to DataStore.' },
      { name: 'Color Picker', keywords: ['color picker', 'paint', 'customize color'],
        how: 'ScreenGui with HSV wheel (ImageButton with color wheel image). Click position → angle for Hue, distance for Saturation. Brightness slider. Preview square. Apply to selected Part.Color.' },
      { name: 'Character Customization', keywords: ['character', 'customize', 'avatar', 'outfit', 'skin'],
        how: 'ScreenGui with category tabs (Hair, Face, Shirt, Pants, Accessories). ViewportFrame showing character preview. Click item → apply to character. Save outfit to DataStore. HumanoidDescription for applying.' },
      { name: 'Paint System', keywords: ['paint', 'spray', 'decal', 'texture'],
        how: 'Tool mode. Raycast from mouse. On click: change hit Part Color3 or apply Decal. Color palette UI. Size selector for area painting. Undo stack (last 20 changes).' },
    ],
  },

  // ════════════════════════════════════════════════════════════════════
  // MOVEMENT & PHYSICS
  // ════════════════════════════════════════════════════════════════════
  {
    name: 'Movement & Physics',
    systems: [
      { name: 'Double Jump', keywords: ['double jump', 'multi jump', 'air jump'],
        how: 'LocalScript in StarterPlayerScripts. Track jumps: Humanoid.StateChanged → Jumping increments counter, Landed resets. If counter < maxJumps (2): Humanoid:ChangeState(Jumping). BodyVelocity upward impulse.' },
      { name: 'Dash/Sprint', keywords: ['dash', 'sprint', 'run', 'speed boost', 'dodge'],
        how: 'UserInputService: bind shift/Q to dash. On press: Humanoid.WalkSpeed *= 2 for 0.3s. Cooldown 2s. Trail effect during dash. Sound effect. Stamina cost optional.' },
      { name: 'Wall Jump', keywords: ['wall jump', 'wall climb', 'parkour'],
        how: 'Raycast sideways from character. If wall detected and character airborne: allow jump off wall. Apply BodyVelocity away from wall + upward. Animation: character faces wall briefly.' },
      { name: 'Grapple Hook', keywords: ['grapple', 'hook', 'swing', 'rope'],
        how: 'Tool. On activate: Raycast from camera. If hit: create RopeConstraint between player and hit point. BodyPosition to pull toward point. Release on tool deactivate.' },
      { name: 'Flying System', keywords: ['fly', 'flight', 'levitate', 'hover'],
        how: 'BodyVelocity + BodyGyro on HumanoidRootPart. WASD = horizontal velocity. Space/Shift = up/down. Camera-relative movement. Toggle on/off. Particle trail while flying.' },
      { name: 'Swimming', keywords: ['swim', 'water', 'underwater', 'dive'],
        how: 'Detect water: Raycast down, check Terrain material = Water. In water: reduce gravity (BodyForce upward), slower WalkSpeed, bubble ParticleEmitter, oxygen bar depleting.' },
      { name: 'Slide/Crouch', keywords: ['slide', 'crouch', 'sliding', 'crouch mechanic', 'low ceiling'],
        how: 'UserInputService bind C key. On press: Humanoid.HipHeight reduces from 2→0.5, camera TweenService lowers, WalkSpeed halved. Slide trigger: if sprinting when crouching, BodyVelocity forward impulse (magnitude*1.5) + LinearVelocity for 0.5s. Stand up: check Raycast upward for clearance before restoring HipHeight.' },
      { name: 'Rope Swing', keywords: ['rope swing', 'swing', 'rope', 'vine swing', 'parkour swing'],
        how: 'RopeConstraint between player HumanoidRootPart Attachment and ceiling Attachment. Player grabs via ProximityPrompt. Physics takes over (no BodyVelocity, let constraint simulate). Release: destroy constraint at velocity peak for max distance. Detect peak via velocity magnitude decreasing. Parkour combo with wall jump.' },
      { name: 'Bounce Pad', keywords: ['bounce pad', 'bounce', 'jump pad', 'launch pad', 'spring pad'],
        how: 'Part with Touched event. On player touch: apply BodyVelocity in Part.CFrame.UpVector direction. Force scales by Part BrickColor: green=50, yellow=100, red=200. Debris:AddItem(bv, 0.2). Sound (spring/boing) + ParticleEmitter burst on bounce. Cooldown 0.5s per player to prevent multi-trigger.' },
      { name: 'Conveyor Belt', keywords: ['conveyor belt', 'moving floor', 'conveyor', 'treadmill', 'moving ground'],
        how: 'Part with VectorForce or AssemblyLinearVelocity set on Touching players. Use Touched + TouchEnded to track players on belt. Apply lateral velocity in belt direction each Heartbeat while on belt. Configurable speed + direction (Part.CFrame.LookVector * speed). Useful for factory tycoons, obstacle courses.' },
      { name: 'Zipline', keywords: ['zipline', 'zip line', 'cable slide', 'wire slide'],
        how: 'Two Attachment endpoints with Beam visual (rope). ProximityPrompt at start. On grab: AlignPosition constraint pulls character along line via Lerp (alpha 0→1 over duration). Character faces direction of travel. Release early with Jump key. Sound: whoosh during slide. Can be one-way or bidirectional (prompt at both ends).' },
    ],
  },

  // ════════════════════════════════════════════════════════════════════
  // ADVANCED SYSTEMS — what makes games go viral (Lemonade-level+)
  // ════════════════════════════════════════════════════════════════════
  {
    name: 'Advanced & Viral Systems',
    systems: [
      { name: 'Stamina Bar', keywords: ['stamina', 'energy', 'endurance', 'stamina bar'],
        how: 'Frame bg + inner Frame as fill. Width = stamina/maxStamina. UIGradient green→blue. Sprint drains, regen when idle. Smooth TweenService width change. Camera shake when depleted.' },
      { name: 'Farming System', keywords: ['farm', 'crop', 'plant', 'harvest', 'farming'],
        how: 'Dirt Part + ClickDetector → BillboardGui with crop selector. On pick: clone crop model, parent to dirt. Stages: seed→sprout→grown (scale tween + color change). Harvest on ProximityPrompt. Soil darkens when planted (Color3 change).' },
      { name: 'Vehicle Selection UI', keywords: ['car select', 'vehicle select', 'car picker', 'vehicle menu'],
        how: 'ScreenGui with horizontal ScrollingFrame. Car cards: ViewportFrame showing 3D model preview + name + stats (speed/handling/accel). Select button. Owned/locked state. UICorner + hover tween on cards.' },
      { name: 'Settings UI with Sliders', keywords: ['settings slider', 'brightness slider', 'fov slider', 'volume slider'],
        how: 'ScreenGui sections: Audio (music+sfx sliders), Video (brightness slider, quality dropdown), Controls (sensitivity, keybind display). Slider: Frame track + draggable Frame knob (InputBegan/InputChanged/InputEnded). Toggle: Frame bg + circle that tweens left↔right. Save to DataStore.' },
      { name: 'Barrier/Force Field', keywords: ['barrier', 'force field', 'push back', 'wall push', 'invisible wall'],
        how: 'Transparent Part + Touched event. On touch: BodyVelocity away from barrier center. Adjustable force. Visual: ForceField effect or colored Neon Part. Optionally requires level/coins to pass.' },
      { name: 'Crate/Lootbox System', keywords: ['crate', 'lootbox', 'chest', 'open crate', 'gacha'],
        how: 'Model with ProximityPrompt. On interact: DevProduct purchase → server roll weighted random table → reveal animation (spin/flip/glow). Rarity tiers with color-coded BillboardGui. Save to inventory DataStore.' },
      { name: 'Crafting System', keywords: ['craft', 'recipe', 'combine', 'forge', 'crafting'],
        how: 'ScreenGui: recipe list (ScrollingFrame) + ingredient slots (drag from inventory) + craft button. Server validates player has materials. Deduct materials, grant result. ModuleScript recipe table: {output, inputs: [{item, count}]}.' },
      { name: 'Fishing System', keywords: ['fish', 'fishing', 'rod', 'catch', 'fishing rod'],
        how: 'Tool (fishing rod). Activate → cast animation + projectile (bobber). Wait random 3-10s. Bite indicator (bobber dips). Click to reel → random fish from weighted table by location. Fish go to inventory. Rod upgrades increase rare fish chance.' },
      { name: 'Morphing/Transformation', keywords: ['morph', 'transform', 'skin', 'character morph'],
        how: 'ProximityPrompt on morph pad. Clone target character model. Apply via Humanoid:ReplaceBodyPartR15() or swap character model entirely. Store current morph. Reset button. Preview before applying.' },
      { name: 'Cutscene System', keywords: ['cutscene', 'cinematic', 'camera animation', 'intro'],
        how: 'Camera.CameraType = Scriptable. TweenService CFrame between keypoints. Letterbox bars (two black frames top/bottom). Dialog text overlay. Duration-based progression. Return camera to Custom when done.' },
      { name: 'Emote System', keywords: ['emote', 'dance', 'animation', 'gesture'],
        how: 'ScreenGui radial menu (circular button arrangement). Each button loads an Animation:Play() on Humanoid:LoadAnimation(). Stop previous before playing new. Keybind support (1-9). Cool animated GUI with icons.' },
      { name: 'Backpack/Hotbar', keywords: ['hotbar', 'backpack', 'toolbar', 'item bar'],
        how: 'ScreenGui bottom-center. 9 slots (Frame + ImageLabel). Numbered 1-9. UserInputService keybinds. Highlight selected slot (gold border). Equip/unequip on click or key. Drag to rearrange (InputBegan tracking).' },
      { name: 'Proximity Chat Bubble', keywords: ['chat bubble', 'overhead chat', 'proximity chat'],
        how: 'BillboardGui above character head. TextLabel with UICorner. Appears on chat, fades after 5s. TweenService opacity animation. Size scales with text length. Only visible within 50 studs.' },
      { name: 'Round/Match System', keywords: ['round', 'match', 'game round', 'round system', 'intermission'],
        how: 'States: Intermission(30s) → MapVote(15s) → Teleport → Playing(120s) → Results(10s) → loop. Timer displayed on ScreenGui. RemoteEvent syncs state to clients. Award XP/coins on results based on performance.' },
      { name: 'Kill Feed/Event Feed', keywords: ['kill feed', 'event feed', 'death log', 'kill log'],
        how: 'ScreenGui top-right. UIListLayout vertical. New entries slide in from right (TweenService). Auto-remove after 5s. Format: "PlayerA eliminated PlayerB". Color-coded: kills=red, events=gold, system=gray.' },
      { name: 'Damage Numbers', keywords: ['damage number', 'floating damage', 'hit number', 'damage popup'],
        how: 'On damage: create BillboardGui at hit position. TextLabel with damage amount. TweenService: float upward (Y +3 studs over 0.8s) + fade (Transparency 0→1). Random X offset for spread. Crit = larger + gold color.' },
      { name: 'Cooldown Indicator', keywords: ['cooldown', 'ability cooldown', 'cooldown ui', 'skill cooldown'],
        how: 'ImageLabel for ability icon. Overlay Frame (dark, semi-transparent) that shrinks from full height to 0 over cooldown duration. TextLabel showing remaining seconds. Sweep effect using ClipsDescendants + TweenService.' },
      { name: 'Combo System', keywords: ['combo', 'hit combo', 'combo counter', 'streak'],
        how: 'Track hits within 2s window. Counter increments, resets after timeout. UI: large TextLabel center-screen "3x COMBO!" with scale tween (1→1.5→1). Higher combos = multiplied damage/XP. Sound pitch increases with combo.' },
      { name: 'Rebirth/Prestige UI', keywords: ['rebirth ui', 'prestige ui', 'ascend'],
        how: 'ScreenGui with dramatic presentation. Current multiplier + next multiplier preview. Cost display. "REBIRTH" button with glow animation. On rebirth: screen flash (white Frame, fade in/out), reset currency, increment multiplier. Particle burst effect.' },
      { name: 'Map Voting', keywords: ['map vote', 'vote map', 'map selection'],
        how: 'ScreenGui: 3 map options as cards with ViewportFrame previews. Click to vote. Live vote counts per option. Timer 15s. Server picks winner (most votes). Teleport all players. Tie = random.' },
    ],
  },

  // ════════════════════════════════════════════════════════════════════
  // RACING & VEHICLES
  // ════════════════════════════════════════════════════════════════════
  {
    name: 'Racing & Vehicles',
    systems: [
      { name: 'Racing Lap System', keywords: ['racing', 'lap', 'laps', 'race track', 'lap counter', 'race position', 'finish line'],
        how: 'Waypoints table of Parts along track. Invisible trigger Parts at each waypoint (Touched). Server tracks per-player: {currentWaypoint, lapsCompleted, position}. Finish line detection via Touched on final Part. Results screen: OrderedDataStore sorts finish times. BillboardGui shows "1st/2nd/3rd" above players in real time.' },
      { name: 'Drift Mechanic', keywords: ['drift', 'drifting', 'drift score', 'drift boost', 'car drift'],
        how: 'VehicleSeat throttle + steer values. Detect sideways velocity: dot product of HumanoidRootPart.Velocity and HumanoidRootPart.CFrame.RightVector. If |dot| > threshold (8) AND speed > 20 → drifting. Drift score accumulates per second. Smoke ParticleEmitter on rear wheel Attachments during drift. Boost reward (BodyVelocity impulse) after drift chain ends.' },
      { name: 'Nitro/Boost System', keywords: ['nitro', 'boost', 'turbo', 'speed boost', 'nos', 'boost pickup'],
        how: 'BodyVelocity impulse in look direction on boost. Cooldown 10s (tick() tracking). Charge by collecting pickup Parts (Touched → add charge) or drifting. Visual effects: fire ParticleEmitter at exhaust, TweenService FOV increase (70→90) via Camera.FieldOfView, Beam speed lines from front.' },
      { name: 'Lap Timer & Ghost', keywords: ['lap timer', 'ghost car', 'ghost lap', 'best lap', 'ghost race'],
        how: 'Record player CFrame + timestamp every 0.1s into table during lap. On next lap: spawn transparent clone, replay CFrame table via TweenService sequence. Best lap time + CFrame table persisted in DataStore. Ghost only visible to that player (LocalScript filtering). Lap time TextLabel in HUD.' },
      { name: 'Vehicle Upgrade Shop', keywords: ['vehicle upgrade', 'car upgrade', 'car stats', 'car shop', 'vehicle stats', 'handling upgrade'],
        how: 'Config table per vehicle {speed=1, handling=1, turbo=0, armor=1} each stat 1-10. Upgrade cost = stat^2 * baseCost, multiplies with each level. ViewportFrame preview of vehicle in shop GUI. Apply upgrades: VehicleSeat MaxSpeed and Torque properties. Save upgrades to DataStore per vehicle.' },
    ],
  },

  // ════════════════════════════════════════════════════════════════════
  // HORROR & SURVIVAL
  // ════════════════════════════════════════════════════════════════════
  {
    name: 'Horror & Survival',
    systems: [
      { name: 'Jumpscare System', keywords: ['jumpscare', 'jump scare', 'horror scare', 'scare', 'horror'],
        how: 'Invisible trigger Part + Touched. On trigger: fullscreen white/black ImageLabel flash (Transparency 0→1 over 0.3s). Loud Sound played in player (Volume 1, RollOffMaxDistance 0 for global). Camera shake (offset CFrame random values). 2s cooldown per player stored in table to prevent spam.' },
      { name: 'Chase AI', keywords: ['chase ai', 'monster chase', 'horror ai', 'enemy chase', 'stalker ai'],
        how: 'NPC states: idle→alert→chase→lost. Alert: player in FOV (dot product of LookVector to playerDir > 0.7) AND magnitude < 60. Chase: PathfindingService:CreatePath(), ComputeAsync to player, follow waypoints. WalkSpeed 24 during chase. Lost state: return to patrol after 10s idle (no player sighting). Sound effects per state.' },
      { name: 'Hiding Mechanic', keywords: ['hide', 'hiding', 'closet', 'hiding spot', 'stealth hide'],
        how: 'ProximityPrompt on hiding spot Parts (closet, bed, box). On hide: character Transparency=1 on all Parts, Camera.CameraSubject switches to hiding spot CameraValue. Server marks player as hidden in table. AI pathfinding skips hidden players (check table before targeting). Exit via ProximityPrompt re-press.' },
      { name: 'Sanity System', keywords: ['sanity', 'insanity', 'mental health', 'horror sanity', 'hallucination'],
        how: 'NumberValue "Sanity" 0-100 per player. Drains: near monster -5/s, in dark area (no nearby PointLight) -2/s, alone -1/s. Restore: in lit safe zones +3/s. Below 30: BlurEffect Size increases (TweenService), ColorCorrectionEffect shifts blue. Below 10: jumpscare chance on heartbeat. Restore via light sources and safe zones.' },
      { name: 'Flashlight Tool', keywords: ['flashlight', 'torch', 'flashlight battery', 'horror light'],
        how: 'Tool with SpotLight child (Range 40, Angle 45, Brightness 5). Toggle E key: SpotLight.Enabled. Battery NumberValue 100→0 draining over 120s. Recharge at generator stations (ProximityPrompt, 3s hold). Flicker effect when battery < 20: task.spawn loop toggling Enabled rapidly with random short intervals.' },
      { name: 'Generator Puzzle', keywords: ['generator', 'generator puzzle', 'power generator', 'activate generator', 'escape puzzle'],
        how: 'N generators scattered (config: generatorCount=4). Each has ProximityPrompt "Hold to Start" (HoldDuration=3). On activate: play sound, Part BrickColor turns green, increment IntValue "GeneratorsActive". When all activated: door Parts Transparency=1 CanCollide=false, PointLights turn on, escape path revealed via TweenService.' },
    ],
  },

  // ════════════════════════════════════════════════════════════════════
  // ANIME & POWER SYSTEMS
  // ════════════════════════════════════════════════════════════════════
  {
    name: 'Anime & Power Systems',
    systems: [
      { name: 'Power Awakening', keywords: ['awakening', 'power awakening', 'power unlock', 'transform unlock', 'ability unlock'],
        how: 'Requirements table {level=50, questComplete=true}. On trigger: Camera.CameraType=Scriptable, zoom in TweenService. Screen flash (white ImageLabel). Aura ParticleEmitter appears on HumanoidRootPart (size increases). New abilities added to player config. Each tier has color theme (blue→red→gold). Save awakened state to DataStore.' },
      { name: 'Aura/Effect System', keywords: ['aura', 'power aura', 'ki aura', 'energy aura', 'battle aura'],
        how: 'Multiple ParticleEmitter layers on HumanoidRootPart: base aura (low rate), power aura (medium), rage aura (high rate burst). Color sequence based on power level (blue→purple→red→gold). Rate and Size increase during charging (hold input). SelectionBox or PointLight to add glow. All emitters managed by server, replicated.' },
      { name: 'Transformation Sequence', keywords: ['transformation', 'transform', 'super form', 'power up sequence', 'powerup cutscene'],
        how: 'Camera.CameraType=Scriptable, pan around character via TweenService keyframes. Screen flash. Swap accessory via HumanoidDescription (hair color, accessory ids). ParticleEmitter burst (Rate 500 for 1s then 0). Sound (power up SFX). Apply new stat multipliers to ModuleScript config. Revert on toggle or timer.' },
      { name: 'Combo Attack Chain', keywords: ['combo chain', 'combo attack', 'combo window', 'attack chain', 'timing combo'],
        how: 'Table of {animation, damage, knockback, timingWindow}. On attack input: if within timingWindow (0.3-0.5s) of last hit → advance chain index, else reset to 0. Play animation[index], apply damage*comboMultiplier. Miss timing → reset combo, lower damage. Screen shake intensity scales with combo depth. Sound pitch increases per hit.' },
      { name: 'Stand/Summon System', keywords: ['stand', 'summon', 'familiar', 'spirit summon', 'companion summon'],
        how: 'Model cloned from ServerStorage on summon (E key toggle). AlignPosition: Stand follows player at offset (+5 studs right). AlignOrientation: faces same direction as player. Own RemoteEvents per ability (Q/E/R for stand moves). Cooldown table per ability. Destroy model on de-summon. Only one active (check if already summoned).' },
    ],
  },

  // ════════════════════════════════════════════════════════════════════
  // ROLEPLAY & SOCIAL
  // ════════════════════════════════════════════════════════════════════
  {
    name: 'Roleplay & Social',
    systems: [
      { name: 'Job System', keywords: ['job', 'jobs', 'occupation', 'work', 'salary', 'job board'],
        how: 'Table of jobs {name, uniform, salaryPerMinute, tasks}. Job board with ProximityPrompt per job. On pick: apply HumanoidDescription uniform, set StringValue "Job". task.spawn loop pays salary every 60s (IntValue += salaryPerMinute). Quit button in HUD. Fire via admin/NPC. Save current job to DataStore.' },
      { name: 'Phone/Tablet UI', keywords: ['phone ui', 'phone app', 'tablet ui', 'in-game phone', 'mobile ui'],
        how: 'ScreenGui "Phone" with draggable outer Frame (InputBegan/Changed/Ended for drag). Inner app grid. Apps: contacts (player list), messages (DataStore conversations), settings, camera (Screenshot via ScreenGui). Minimize to corner via TweenService scale. Notification badges (IntValue per app). Back button navigation.' },
      { name: 'House System', keywords: ['house', 'home', 'housing', 'plot house', 'player house', 'furniture'],
        how: 'Plot Parts (24x24 foundation) in workspace per player slot. Placement mode: ghost preview clone follows mouse (Mouse.Hit). Grid snapping: math.floor(pos/4)*4. Furniture catalog in ScreenGui (ScrollingFrame). Serialize layout: {name, cframe, size, color, material} table per piece. Save to DataStore. TeleportService for visiting other players houses.' },
      { name: 'Roleplay Name Tag', keywords: ['name tag', 'role tag', 'custom name', 'display name', 'rp tag'],
        how: 'BillboardGui above head (StudsOffset Y=2.5). Custom TextBox input for display name. Role dropdown (Doctor/Police/Civilian/etc). Frame color coded by role (red=police, white=doctor, blue=civilian). TextLabel for name + smaller TextLabel for role title. Persist both in DataStore.' },
      { name: 'Emote Wheel', keywords: ['emote wheel', 'emote menu', 'radial emote', 'hold emote', 'gesture wheel'],
        how: 'Hold E key: show radial ScreenGui (8 ImageButton segments arranged in circle via UDim2 sin/cos positioning). Mouse direction from center picks segment (math.atan2 of mouse delta from center). Highlight hovered segment. Release E: play selected Animation. Cancel: release on center. Each segment has icon + emote name label.' },
    ],
  },

  // ════════════════════════════════════════════════════════════════════
  // BASE BUILDING & STRATEGY
  // ════════════════════════════════════════════════════════════════════
  {
    name: 'Base Building & Strategy',
    systems: [
      { name: 'Plot/Land System', keywords: ['plot', 'land', 'claim plot', 'land claim', 'player plot'],
        how: 'Predefined plot Parts in workspace (named "Plot1", "Plot2"...). Claim via ProximityPrompt (1 plot per player). Owner stored in DataStore + Part:SetAttribute("Owner", userId). Boundary enforcement: position clamped inside plot AABB on Heartbeat. BillboardGui shows owner name. Release on leave or "Abandon" button.' },
      { name: 'Grid Placement System', keywords: ['grid placement', 'grid build', 'place on grid', 'snap grid', 'build grid'],
        how: 'Mouse.Hit position snapped: math.floor(pos/gridSize + 0.5)*gridSize per axis. Ghost preview: transparent clone follows snapped position. Click to place: Instance:Clone(), anchor, parent to player plot. R key: rotate 90° (CFrame * CFrame.Angles(0, math.pi/2, 0)). X key: delete mode (click to remove placed parts). Validate inside plot bounds before placing.' },
      { name: 'Blueprint System', keywords: ['blueprint', 'save build', 'load build', 'share build', 'build template'],
        how: 'Serialize current build: iterate plot children, store [{name, cframe, size, color, material}]. Save to DataStore as JSON string under key "blueprint_{userId}_{slotId}". Load: decode JSON, recreate each Part with stored properties. Share: store under public key "shared_{blueprintId}", others load via ID. ScreenGui slot picker.' },
      { name: 'Resource Gathering', keywords: ['resource', 'gather', 'harvest resource', 'chop tree', 'mine rock', 'resource node'],
        how: 'Clickable resource nodes (tree, rock, ore) with ClickDetector. On click: play animation, yield resources after 1s (RemoteEvent → server adds to inventory). IntValue "Health" on node depletes per harvest. Respawn timer 30-120s (task.delay). Visual depletion: TweenService size shrink + Transparency increase. Respawn: reset size, Transparency=0.' },
      { name: 'Tower Merge System', keywords: ['tower merge', 'merge tower', 'combine towers', 'merge upgrade', 'tower combine'],
        how: 'Two identical towers adjacent (magnitude < 6): show merge prompt (BillboardGui button). On merge: destroy both, create next tier tower. Tier increases: damage*1.5, range*1.2 per tier. Visual: Part size *1.2, BrickColor changes per tier (green→blue→purple→gold). Max tier 5. Track tier in Part:SetAttribute("Tier").' },
    ],
  },

  // ════════════════════════════════════════════════════════════════════
  // MINIGAMES & PARTY
  // ════════════════════════════════════════════════════════════════════
  {
    name: 'Minigames & Party',
    systems: [
      { name: 'Obby Section Generator', keywords: ['obby', 'obstacle course', 'obby generator', 'obby stages', 'parkour course'],
        how: 'Series of platform Parts at increasing difficulty. Gap between platforms increases with stage (2→8 studs). Moving platforms: TweenService ping-pong between two positions. Spinner obstacles: HingeConstraint with AngularVelocity motor. Kill bricks: Part Touched → Humanoid.Health=0. Checkpoint SpawnLocations every 5 stages. Stage counter BillboardGui.' },
      { name: 'Trivia Game', keywords: ['trivia', 'quiz', 'trivia game', 'quiz game', 'question game'],
        how: 'Question bank table [{question, choices: [4 strings], correct: 1-4}]. Round: RemoteEvent shows question + 4 TextButton choices to all players. 15s timer CountdownLabel. On answer: server validates, +100 score for correct. 10 rounds total. Winner = highest score. ScreenGui results screen with final rankings.' },
      { name: 'Simon Says', keywords: ['simon says', 'simon', 'follow leader', 'copy leader', 'pattern game'],
        how: 'Leader broadcasts command via RemoteEvent ("Jump", "Touch Red", "Dance"). Players must perform within 3s. Detect jump: Humanoid.StateChanged to Jumping. Touch color: Part.Touched check Part BrickColor. Emote: AnimationTrack check. Wrong action or timeout: eliminate player (Kick to lobby or spectate mode). Last player wins.' },
      { name: 'Musical Chairs', keywords: ['musical chairs', 'music chairs', 'chair game', 'musical game'],
        how: 'Seats (Seat instances) in circle. Sound plays (Looped=true). Server stops sound at random interval (10-20s). Players rush to sit (Seat.Occupant check). After 2s: eliminate player with no seat (teleport to spectate area). Remove one Seat per round (Destroy). Last player seated wins. Round start/end UI.' },
      { name: 'Freeze Tag', keywords: ['freeze tag', 'frozen', 'freeze game', 'tag freeze', 'ice tag'],
        how: 'Two teams: Taggers and Runners. Tagger Touched Runner: RemoteEvent → set Runner Humanoid.WalkSpeed=0, apply ForceField visual (blue tint). Runner touches frozen teammate: unfreeze (WalkSpeed restore, ForceField remove). Timer 120s. Taggers win if all Runners frozen simultaneously. Runners win if timer expires. Score tracked.' },
    ],
  },
]

// ═══════════════════════════════════════════════════════════════════════
// Query functions — find relevant systems for a user prompt
// ═══════════════════════════════════════════════════════════════════════

/** Find all game systems relevant to a user's prompt */
export function findRelevantSystems(prompt: string, maxSystems = 12): GameSystem[] {
  const lower = prompt.toLowerCase()
  const scored: { system: GameSystem; score: number }[] = []

  for (const category of GAME_SYSTEMS) {
    for (const system of category.systems) {
      let score = 0
      for (const kw of system.keywords) {
        if (lower.includes(kw)) score += 2
      }
      // Partial keyword matching
      if (score === 0) {
        for (const kw of system.keywords) {
          const words = kw.split(' ')
          for (const word of words) {
            if (word.length > 3 && lower.includes(word)) score += 1
          }
        }
      }
      if (score > 0) scored.push({ system, score })
    }
  }

  scored.sort((a, b) => b.score - a.score)
  return scored.slice(0, maxSystems).map(s => s.system)
}

/** Format systems as prompt context for the AI */
export function formatSystemKnowledge(systems: GameSystem[]): string {
  if (systems.length === 0) return ''

  const lines: string[] = [
    '',
    '[GAME_SYSTEM_KNOWLEDGE]',
    'You know how to build these systems. Use this knowledge to generate better code:',
    '',
  ]

  for (const s of systems) {
    lines.push(`${s.name}: ${s.how}`)
  }

  lines.push('')
  lines.push('[/GAME_SYSTEM_KNOWLEDGE]')
  return lines.join('\n')
}

/** Get total system count */
export function getSystemCount(): number {
  return GAME_SYSTEMS.reduce((sum, cat) => sum + cat.systems.length, 0)
}

/** Get all category names */
export function getCategories(): string[] {
  return GAME_SYSTEMS.map(c => c.name)
}

// ═══════════════════════════════════════════════════════════════════════
// Dynamic Learning — add new systems discovered from user builds
// ═══════════════════════════════════════════════════════════════════════

const dynamicSystems: GameSystem[] = []

/** Learn a new system from a successful build the AI hasn't seen before */
export function learnNewSystem(
  name: string,
  how: string,
  keywords: string[],
  category?: string,
): void {
  // Don't add duplicates
  if (dynamicSystems.find(s => s.name === name)) return
  if (GAME_SYSTEMS.some(c => c.systems.some(s => s.name === name))) return

  dynamicSystems.push({ name, how, keywords })
  console.log(`[GameSystems] Learned new system: "${name}" (${keywords.join(', ')})`)
}

/** Extract system patterns from successful build code */
export function extractNewSystemFromCode(prompt: string, code: string, score: number): void {
  if (score < 70) return // Only learn from good builds
  if (code.length < 200) return // Too short to be a real system

  const lower = prompt.toLowerCase()

  // Check if this build uses patterns we don't have a system for
  const hasDataStore = code.includes('DataStoreService')
  const hasRemoteEvent = code.includes('RemoteEvent')
  const hasScreenGui = code.includes('ScreenGui')
  const hasHumanoid = code.includes('Humanoid')
  const hasTween = code.includes('TweenService')
  const hasParticle = code.includes('ParticleEmitter')
  const hasProximity = code.includes('ProximityPrompt')

  // Build a compact description of what this code does
  const techniques: string[] = []
  if (hasDataStore) techniques.push('DataStore persistence')
  if (hasRemoteEvent) techniques.push('client-server RemoteEvent')
  if (hasScreenGui) techniques.push('ScreenGui UI')
  if (hasHumanoid) techniques.push('Humanoid interaction')
  if (hasTween) techniques.push('TweenService animations')
  if (hasParticle) techniques.push('ParticleEmitter effects')
  if (hasProximity) techniques.push('ProximityPrompt interaction')

  if (techniques.length < 2) return // Too simple to learn from

  // Extract keywords from the prompt
  const words = lower.replace(/[^a-z\s]/g, '').split(/\s+/).filter(w => w.length > 3)
  const uniqueWords = [...new Set(words)].slice(0, 5)

  // Check if we already have a matching system
  const existing = findRelevantSystems(prompt, 1)
  if (existing.length > 0 && existing[0].name.toLowerCase().includes(uniqueWords[0])) return

  const systemName = prompt.slice(0, 50).replace(/^(build|create|make|add)\s*/i, '').trim()
  const how = `Uses: ${techniques.join(', ')}. Pattern from successful build (score ${score}/100).`

  learnNewSystem(systemName, how, uniqueWords)
}

/** Get all systems including dynamically learned ones */
export function getAllSystems(): GameSystem[] {
  const all: GameSystem[] = []
  for (const cat of GAME_SYSTEMS) {
    all.push(...cat.systems)
  }
  all.push(...dynamicSystems)
  return all
}

/** Enhanced findRelevantSystems that includes dynamic systems */
export function findAllRelevantSystems(prompt: string, maxSystems = 12): GameSystem[] {
  const lower = prompt.toLowerCase()
  const allSystems = getAllSystems()
  const scored: { system: GameSystem; score: number }[] = []

  for (const system of allSystems) {
    let score = 0
    for (const kw of system.keywords) {
      if (lower.includes(kw)) score += 2
    }
    if (score === 0) {
      for (const kw of system.keywords) {
        const words = kw.split(' ')
        for (const word of words) {
          if (word.length > 3 && lower.includes(word)) score += 1
        }
      }
    }
    if (score > 0) scored.push({ system, score })
  }

  scored.sort((a, b) => b.score - a.score)
  return scored.slice(0, maxSystems).map(s => s.system)
}
