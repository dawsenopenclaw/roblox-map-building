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
      { name: 'Bank/Vault System', keywords: ['bank', 'vault', 'deposit', 'withdraw', 'interest', 'savings', 'bank account'],
        how: 'DataStore stores {wallet, bank, lastInterestTime}. Bank NPC with ProximityPrompt opens ScreenGui. Deposit/withdraw TextBox input + buttons. Interest: on join check os.time()-lastInterestTime, compute minutes elapsed, bank += bank*0.001*minutes. Max deposit limit (e.g. 1,000,000). RemoteEvent "BankAction" for deposit/withdraw. Separate wallet (spendable) from bank (earning interest).' },
      { name: 'Stock Market', keywords: ['stock', 'market', 'stock market', 'buy low', 'sell high', 'market prices', 'trading prices'],
        how: 'Server updates item prices every 60s via task.spawn loop. Random walk: newPrice = oldPrice + math.random(-10,10), clamp to [10, 500]. ModuleScript "StockData" holds current prices. SurfaceGui ticker scrolls prices horizontally (UIListLayout in horizontal ScrollingFrame with UIPageLayout). History: store last 20 prices per item, display as stacked Frame bars in ScreenGui graph.' },
      { name: 'Gambling/Spin Wheel', keywords: ['gambling', 'spin wheel', 'wheel spin', 'slot', 'gamble', 'chance', 'lucky spin'],
        how: 'DevProduct purchase triggers spin. Weighted random table: {item, chance, value}. Animate spinning wheel: ImageLabel of wheel rotates via TweenService (2 full spins + extra degrees to land on result). Pointer indicator at top. On complete: highlight winning segment, ParticleEmitter burst. Sound: spinning rattle + win chime. Server-side RNG to prevent exploitation.' },
      { name: 'Tax/Fee System', keywords: ['tax', 'fee', 'transaction fee', 'trade tax', 'sales tax', 'treasury'],
        how: 'On every trade/sale: deduct percentage (configurable, default 5-10%) from transaction. Tax goes to IntValue "ServerTreasury" in ServerStorage. Treasury funds community events or rewards. SurfaceGui admin display shows total collected. Tax rate adjustable by admin command. Apply to auction house fees, trade broker fees, shop markups.' },
      { name: 'Inflation System', keywords: ['inflation', 'economy inflation', 'price increase', 'economy growth'],
        how: 'Track totalCoinsEarned globally in DataStore (increment on every coin grant). Inflation multiplier = 1 + (totalCoinsEarned / 1000000). Apply multiplier to all shop prices. Display inflation index on economy dashboard. Soft cap: multiplier capped at 3x to prevent runaway inflation. Admin can manually adjust baseline.' },
      { name: 'Item Rarity Tiers', keywords: ['rarity', 'rarity tier', 'common', 'uncommon', 'rare', 'epic', 'legendary', 'item rarity', 'rarity color'],
        how: 'Rarity table: Common(60%, white), Uncommon(25%, green), Rare(10%, blue), Epic(4%, purple), Legendary(1%, gold). Roll: math.random(1,100). BillboardGui above item shows rarity color + name. ParticleEmitter color matches rarity (gold for Legendary, size=2). Inventory slots have colored borders via UIStroke. ScreenGui item tooltip shows rarity label with color.' },
      { name: 'Currency Converter', keywords: ['currency converter', 'exchange rate', 'convert currency', 'exchange currency'],
        how: 'Multiple currencies (Coins, Gems, Tokens). Exchange rates stored in ModuleScript, update every 5 minutes via server loop with slight random fluctuation. Converter NPC with ScreenGui: dropdown for from/to currency, amount TextBox, converted preview. Fee: 2% on each conversion. Server validates and performs atomic swap. Rate history stored last 10 values.' },
      { name: 'Salary/Wage System', keywords: ['salary', 'wage', 'passive income', 'paycheck', 'income', 'pay rate'],
        how: 'IntValue "Salary" per player set by job/role. task.spawn loop on server: every 60s iterate players, add Salary to coins, fire RemoteEvent "Payday" to show "+N coins" popup. Salary scales with job level. Admin can set custom salary. Show next paycheck timer in HUD. DataStore saves earned total for tax records.' },
      { name: 'Debt System', keywords: ['debt', 'loan', 'borrow', 'owe', 'interest debt', 'pay back'],
        how: 'DataStore stores {debt: 0, debtInterestRate: 0.05}. Borrow action: add to debt, grant coins. Every 5 minutes: debt += debt * interestRate (compound). Block certain actions (rebirth, VIP areas) while debt > 0. UI shows debt in red in HUD. Pay back via "Repay" NPC. Debt cap prevents infinite spiraling.' },
      { name: 'Economy Dashboard', keywords: ['economy dashboard', 'admin economy', 'server economy', 'total coins', 'economy stats'],
        how: 'Admin-only SurfaceGui on dedicated Part. OrderedDataStore GetSortedAsync for top earners. Display: total coins in circulation (sum all player coins — approximate via server IntValue tracking), average balance, inflation rate, top 5 earners. Refresh every 30s. Access restricted: check player:GetRankInGroup() or admin list. Color-coded metrics: green if healthy, red if inflated.' },
      { name: 'Coupon/Promo Code', keywords: ['coupon', 'promo code', 'discount code', 'voucher', 'redeem code'],
        how: 'DataStore "PromoCodes" stores {code: {reward, maxUses, usedBy[]}}. ScreenGui TextBox for code input + "Redeem" button. RemoteEvent "RedeemCode". Server: GetAsync code, check usedBy doesn\'t contain userId, check uses remaining, grant reward, add userId to usedBy array, SetAsync. Notification on success/fail. Admin creates codes via chat command.' },
      { name: 'Rent System', keywords: ['rent', 'rental', 'rent plot', 'pay rent', 'evict', 'property rent'],
        how: 'DataStore stores {plotOwner: userId, rentDue: os.time()+86400, rentAmount: 100}. Server checks rent daily: if os.time() > rentDue and plotOwner has insufficient coins → evict (clear plotOwner, remove furniture, notify). Pay rent: deduct coins, extend rentDue by 86400. Grace period 2 hours after due. Rent UI shows days remaining.' },
      { name: 'Black Market', keywords: ['black market', 'secret shop', 'hidden market', 'underground shop', 'illegal shop'],
        how: 'Hidden location accessible only with key item in inventory (server check). Shop rotates rare items every hour (random selection from exclusive pool). Higher prices (2-5x normal). No tax. Items disappear when stock (IntValue per item) reaches 0. Location hint given via secret NPC quest. BrickColor dark/neon aesthetic.' },
      { name: 'Investment System', keywords: ['investment', 'invest', 'venture', 'return on investment', 'passive gains'],
        how: 'Investment options: {name, minAmount, returnMultiplier, durationSeconds}. DataStore stores {investments: [{amount, returnTime, multiplier}]}. On join: check returnTime vs os.time(), grant amount*multiplier if ready. ScreenGui lists active investments with countdown timer. Risk variants: safe(1.2x, 24h), risky(3x, 8h, 30% chance of loss). Visual: coin bag model grows as investment matures.' },
      { name: 'Tip Jar', keywords: ['tip jar', 'tip player', 'tip coins', 'donate coins', 'player donation'],
        how: 'Physical jar Model per player plot with BillboardGui showing total tips received. ProximityPrompt "Leave a Tip". ScreenGui: amount input (10/50/100/custom). Server deducts from tipper, adds to recipient, updates jar IntValue "TotalTips". BillboardGui updates with animated coin particle burst. Tip log in DataStore for recipient to review.' },
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
      { name: 'Parry/Counter System', keywords: ['parry', 'counter', 'perfect block', 'riposte', 'timed block', 'counter attack'],
        how: 'BoolValue "Parrying" toggled by keybind (F). Server tracks parryStartTime per player. On damage: if Parrying=true and os.time()-parryStartTime < 0.2 → perfect parry: negate damage, stun attacker (WalkSpeed=0, no input 1s via BoolValue "Stunned"), play riposte animation, screen flash. Visual: spark ParticleEmitter + ring shockwave. Standard block (>0.2s): only reduce damage 80%.' },
      { name: 'Stamina-Based Combat', keywords: ['stamina combat', 'stamina attack', 'combat stamina', 'energy combat', 'exhaustion'],
        how: 'NumberValue "Stamina" 0-100 per player. Light attack costs 10, heavy attack costs 25, dodge costs 20, block drains 5/s. Regen: +15/s when idle. At 0: cannot attack or dodge, slow animation penalty. HUD bar depletes with UIGradient (green→yellow→red). Sound: heavy breathing below 20. Stamina upgrades via skill tree increase max and regen.' },
      { name: 'Elemental Damage', keywords: ['elemental', 'element', 'fire damage', 'ice damage', 'lightning damage', 'poison damage', 'element system', 'elemental weakness'],
        how: 'Elements: Fire, Ice, Lightning, Poison, Nature. Weakness chart in ModuleScript: {Fire={weakness="Ice",strong="Nature"}}. On hit: check attacker element vs defender element. Weakness = 1.5x damage. Resistance = 0.5x. Status: Fire→Burn(3 DoT ticks), Ice→Slow(50% speed 2s), Lightning→Stun(1s), Poison→DoT 5s, Nature→Root(cant move 1.5s). Status shown in HUD icon strip.' },
      { name: 'Critical Hit System', keywords: ['critical hit', 'crit', 'crit chance', 'critical strike', 'crit damage'],
        how: 'NumberValue "CritChance" per player (default 10, max 50). On attack: math.random(1,100) <= CritChance → crit. Crit damage = base * 2. Screen flash: white Frame Transparency 0→1 over 0.1s. Sound: high-pitched metallic clang. BillboardGui "CRITICAL!" in gold with scale tween (1→1.5→1). Crit upgrades via skill tree. Crit particles: gold sparks from impact point.' },
      { name: 'Armor/Defense System', keywords: ['armor', 'defense', 'defence', 'damage reduction', 'equipment armor', 'armor stats'],
        how: 'NumberValue "Defense" per player. Damage formula: actualDmg = max(1, rawDmg - Defense). Equipment slots (Head, Chest, Legs, Boots) each add defense value. Equip via inventory UI: drag to slot. HumanoidDescription or accessory attachment for visual. Defense breaks: if attacker has ArmorPierce attribute > Defense, bypass reduction. Show defense value in stats panel.' },
      { name: 'Status Effects', keywords: ['status effect', 'burn', 'freeze', 'stun', 'poison', 'bleed', 'slow', 'status condition'],
        how: 'ModuleScript "StatusEffects" defines each effect {duration, tickDmg, speedMult}. Apply via RemoteEvent with effectName. Server uses table per player to track active effects. task.spawn per effect: ticks DoT via TakeDamage, applies speed modifier, counts duration. Icon strip in HUD (ImageLabel per active effect). Effects stack: Burn+Poison = both DoTs running. Cleanse potion removes all.' },
      { name: 'Rage/Fury Mode', keywords: ['rage', 'fury', 'berserk', 'rage mode', 'fury mode', 'berserker'],
        how: 'NumberValue "RageMeter" 0-100. Fill: take damage +20, deal damage +5. At 100: activate Rage (RemoteEvent). Duration 10s: WalkSpeed*1.5, damage*2, incoming damage*0.5, red aura ParticleEmitter, red ColorCorrectionEffect. Timer ProgressBar in HUD counts down. On expiry: meter resets to 0, brief exhaustion (WalkSpeed halved 3s). Cannot activate again until fully depleted.' },
      { name: 'Stealth/Backstab', keywords: ['stealth', 'backstab', 'sneak', 'invisible stealth', 'assassin', 'rogue stealth'],
        how: 'Crouch key (C): BoolValue "Stealthed". Stealthed: WalkSpeed halved, footstep sounds quieter, character transparency 0.7 (LocalScript only — server still tracks position). AI pathfinding skips stealthed players within 10 studs. Backstab: attack while stealthed + behind target (dot product facing < -0.5) = 3x damage + guaranteed stun. Break stealth on attack or jump. Sound: cloth rustle on move while stealthy.' },
      { name: 'Area of Effect', keywords: ['area of effect', 'aoe', 'splash damage', 'explosion radius', 'aoe damage', 'blast radius'],
        how: 'On AoE trigger: workspace:GetPartBoundsInRadius(hitPos, radius) returns parts. Filter for Humanoid-containing models. Damage falloff: fullDmg at center, linear falloff to 0 at edge (dmg * (1 - distance/radius)). BodyVelocity knockback scaled by inverse distance. Visual: transparent sphere Part expands (TweenService size 0→radius*2) then Debris. ParticleEmitter burst. Apply per-character once using table guard.' },
      { name: 'Healing System', keywords: ['heal', 'healing', 'health regen', 'heal over time', 'heal spell', 'regeneration'],
        how: 'Types: instant heal (Humanoid.Health += amount), HoT (task.spawn ticks N times over duration), area heal (AoE check for allies). Green ParticleEmitter at target, "+" numbers in green BillboardGui float up. Cannot exceed MaxHealth (clamp). Heal source cooldowns tracked per player. Heal potion: DevProduct or craft item. Group buff: HoT applied to all nearby allies within range.' },
      { name: 'Revive System', keywords: ['revive', 'down state', 'downed', 'teammate revive', 'respawn teammate'],
        how: 'On Humanoid health = 0: enter Downed state instead of respawn. WalkSpeed=0, cannot attack, crawl animation. BillboardGui "DOWN - 10s" countdown. Alive teammate ProximityPrompt "Revive (hold 3s)" on downed player. On successful hold: health restored to 30%, downed state cleared. If countdown expires: full death, standard respawn. Solo mode: no revive.' },
      { name: 'Weapon Switching Hotbar', keywords: ['weapon switch', 'weapon hotbar', 'equip weapon', 'weapon select', 'weapon swap'],
        how: 'Max 3 weapons. HUD hotbar: 3 slots numbered 1-3. UserInputService keybinds (1/2/3) or click slot. On switch: Humanoid:UnequipTools(), then equip selected weapon Tool. Each weapon slot shows icon ImageLabel + name + ammo count. Active slot gold border. Server validates ownership of each weapon. Switching animation: brief raised hand frame.' },
      { name: 'Combo Multiplier', keywords: ['combo multiplier', 'hit streak', 'damage multiplier', 'combo damage', 'multiplier combo'],
        how: 'NumberValue "ComboCount" and "ComboTimer" per player. On hit: ComboCount+1, reset ComboTimer to 1.5s (task.delay resets it). ComboTimer reaches 0: reset count. DamageMultiplier = 1 + (ComboCount * 0.1), capped at 3x. UI: large TextLabel showing combo (1x, 2x, etc) with shake animation on each increment. Sound pitch escalates. Visual: streak trail behind attacks at high combo.' },
      { name: 'Ranged Headshot', keywords: ['headshot', 'head shot', 'aim head', 'sniper headshot', 'head hitbox'],
        how: 'Raycast from Camera.CFrame. On hit: check if hit Part.Name == "Head" or Part:IsDescendantOf(character.Head). Headshot = 2x damage + special sound (thwack) + BillboardGui "HEADSHOT" yellow text. No headshot on melee range. Sniper scope zoom (FieldOfView 10-30) enables headshot detection. Track headshot stats per match.' },
      { name: 'Pet Combat', keywords: ['pet attack', 'pet combat', 'pet fight', 'companion attack', 'pet battle'],
        how: 'Pet model follows player. Pet has configured {damage, range, attackRate}. task.spawn loop: find nearest enemy within pet.range using workspace:GetPartBoundsInRadius. If found: pet orients toward it (AlignOrientation), plays attack animation, TakeDamage on target after 0.3s. CooldownTimer per pet between attacks. Pet stats scale with pet rarity (Legendary pets = 3x damage). Pet HP: pet dies if hit, respawns in 30s.' },
      { name: 'Turret/Sentry', keywords: ['turret', 'sentry', 'auto turret', 'sentry gun', 'tower turret', 'auto attack tower'],
        how: 'Placeable Model with BasePart and rotating Part "Barrel". Server loop: find nearest enemy in 40 stud range. Rotate barrel CFrame toward target (AlignOrientation). Fire projectile (spawn Part, BodyVelocity toward target, Touched=damage, Debris 3s). Rate of fire: 1 shot/s. HP IntValue: takes damage if enemies attack it. Destroy on 0 HP, refund 50% cost. Visual: muzzle flash ImageLabel.' },
      { name: 'Poison Cloud', keywords: ['poison cloud', 'gas cloud', 'toxic cloud', 'poison zone', 'cloud damage'],
        how: 'Spawn transparent green Part (Size 10x5x10, Transparency 0.5, Neon material). ParticleEmitter inside: green particles, Rate=30, slow rise. Touched: apply Poison status effect (DoT, -5HP/s). Cloud lasts 5s then Transparency tweens to 1 and Debris. Can be thrown (projectile spawns cloud at landing). Multiple clouds stack DoT. Wind: BodyVelocity 5 studs/s in wind direction drifts cloud.' },
      { name: 'Execution/Finisher', keywords: ['execution', 'finisher', 'execute', 'finishing move', 'final blow', 'kill animation'],
        how: 'When enemy HP < 10%: BillboardGui "FINISH HIM" appears. ProximityPrompt on enemy "Execute". On interact: camera zooms in (TweenService FieldOfView 70→40), play special animation on attacker, enemy Death particle burst. Guaranteed kill. Bonus XP: +200. Screen slow motion 0.5s (Heartbeat wait scaled). Other players see notification "{player} executed {enemy}". Not available in PvP by default.' },
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
      { name: 'Tab System', keywords: ['tab system', 'tabs', 'tab bar', 'tab menu', 'tabbed ui'],
        how: 'Horizontal Frame with TextButton tabs (UIListLayout horizontal). Each tab linked to child Frame with content. Click tab: hide all Frames, show linked Frame. Active indicator: Frame at bottom of tab (gold, 2px height, TweenService position to active tab). Tab can have notification badge (small red circle with count).' },
      { name: 'Modal/Popup System', keywords: ['modal', 'popup', 'dialog box', 'overlay modal', 'popup system'],
        how: 'ScreenGui "Modals". Dark overlay Frame (Transparency 0.5, black, full screen). Centered content Frame. Open: TweenService scale from 0→1 (UDim2 size). Close: scale 1→0. Queue: table of pending modals, show next after close. Click outside to close (overlay InputBegan). ESC key closes. Z-index stacking.' },
      { name: 'Tooltip System', keywords: ['tooltip', 'hover tooltip', 'item tooltip', 'description tooltip'],
        how: 'LocalScript: each hoverable GuiObject has .MouseEnter/.MouseLeave connections. MouseEnter: clone tooltip Frame template, position near cursor (Mouse.X+10, Mouse.Y+10), show. MouseLeave: Destroy tooltip. Tooltip content: title (bold) + description (wrapped). Clamp to screen edges to prevent overflow. Short delay (0.3s) before showing to avoid flicker on fast hover.' },
      { name: 'Drag & Drop', keywords: ['drag drop', 'drag and drop', 'draggable item', 'drag item', 'inventory drag'],
        how: 'InputBegan on slot: if MouseButton1 → start drag. Clone item ImageLabel follows Mouse.X/Mouse.Y via RenderStepped. InputEnded: find slot under cursor (GuiService:GetGuiObjectsAtPosition), validate swap server-side via RemoteEvent "SwapItems". If invalid target: snap back to origin with TweenService. Show ghost outline at origin during drag.' },
      { name: 'Progress Bar', keywords: ['progress bar', 'loading bar', 'fill bar', 'progress fill'],
        how: 'Frame bg + inner Frame (fill). Size.X.Scale = value/maxValue. TweenService Size tween for smooth update. UIGradient on fill: green(high)→yellow(mid)→red(low). TextLabel centered shows percentage or value. Pulse animation at 100% (TweenService alpha flicker). Optional glow: UIStroke color matches gradient zone.' },
      { name: 'Radial Menu', keywords: ['radial menu', 'pie menu', 'circular menu', 'wheel menu', 'radial ui'],
        how: 'ScreenGui appears on hold key (E/Q). 8 ImageButtons positioned via math.sin/cos (radius 80px from center). Mouse angle from center = math.atan2(mouseY-centerY, mouseX-centerX). Highlight sector within 45° arc. Release key: activate highlighted. Cancel if released on center. Fade in/out via TweenService transparency. Each item has icon + label appearing on hover.' },
      { name: 'Search/Filter Bar', keywords: ['search bar', 'filter bar', 'search items', 'search inventory', 'search filter'],
        how: 'TextBox above ScrollingFrame. TextChanged:Connect with 0.3s debounce (task.delay cancel/restart). On search: iterate all child GuiObjects, hide if item name doesn\'t contain lowercase query (Visible=false). Show "No results" TextLabel if all hidden. Clear button (X ImageButton) resets. Case-insensitive: lower both strings.' },
      { name: 'Pagination', keywords: ['pagination', 'paging', 'page system', 'next page', 'page navigation'],
        how: 'Array of all items. itemsPerPage = N. currentPage = 1. Show items [(page-1)*N+1 to page*N]. Previous/Next buttons (disable if at edges). "Page X of Y" TextLabel. On page change: clear displayed items, render next slice. UIPageLayout alternative for automatic paging with TweenInfo animation between pages.' },
      { name: 'Confirmation Dialog', keywords: ['confirmation', 'confirm dialog', 'are you sure', 'confirm action', 'yes no dialog'],
        how: 'Function ShowConfirm(message, callback). Creates modal Frame: message TextLabel + "Yes" (green) and "No" (red) TextButtons. Yes.Activated: close modal, call callback(true). No.Activated: close modal, call callback(false). Press ESC: callback(false). Prevent double-click: disable buttons after first click until resolved. Stack-safe: queue if another confirmation is active.' },
      { name: 'Toast Queue', keywords: ['toast', 'toast queue', 'notification queue', 'stacked notifications', 'notification stack'],
        how: 'ScreenGui top-center. UIListLayout (Vertical, Padding 5). Queue table. ShowToast(text, type, duration): create Frame (slide in from top via TweenService Y offset), append to UIList. Auto-remove after duration: TweenService slide out then Destroy. Types: success=green, error=red, info=blue, warning=yellow. Max 5 visible, queue rest. First-in-first-out.' },
      { name: 'Star Rating', keywords: ['star rating', 'rating stars', 'rate item', 'five star', 'review rating'],
        how: '5 ImageButton stars. Click index N: fill stars 1-N (gold ImageColor3), empty N+1-5 (gray). Half-star: mouse X within star left half = half (ImageLabel overlay 50% width). RemoteEvent "Rate" sends rating to server. Store ratings in DataStore as {total, count}, compute average. Display average with fractional star fill (ImageLabel clip). "1,234 ratings" label.' },
      { name: 'Accordion Menu', keywords: ['accordion', 'expand collapse', 'collapsible menu', 'foldout', 'expandable list'],
        how: 'UIListLayout vertical. Each item: header Frame (TextButton) + content Frame (ClipsDescendants=true). Default content height = 0. Click header: toggle. Open: TweenService content Frame size to full height, rotate arrow icon 180°. Close: tween to 0. Multiple items can be open. Parent ScrollingFrame auto-adjusts height via UIListLayout padding.' },
      { name: 'Color Picker UI', keywords: ['color picker', 'hsv picker', 'color wheel ui', 'color selector'],
        how: 'ScreenGui Frame: circular ImageLabel (color wheel image asset). Click position → angle for Hue (math.atan2), distance from center for Saturation. Brightness slider: vertical Frame with gradient, click Y position for Value. Preview swatch: Frame with Color3.fromHSV(h,s,v). Apply button. Hex code TextBox input (parse "#RRGGBB"). Used in paint systems, customization.' },
      { name: 'Keybind Display', keywords: ['keybind', 'key bindings', 'keybind ui', 'controls display', 'rebind keys'],
        how: 'ScreenGui Settings tab. Grid of action→key pairs. Each row: action TextLabel + key Frame (TextButton showing current key). Click key frame: enter "Press any key" state (flash animation). UserInputService.InputBegan: capture next key, update display. Save to DataStore keybinds table. Apply: replace existing connections with new key. Reset to defaults button.' },
      { name: 'World Map UI', keywords: ['world map', 'map screen', 'map ui', 'travel map', 'zone map'],
        how: 'ScreenGui Frame with ImageLabel of map art. Player dot: Frame positioned via map coordinate mapping (worldPos → mapUV). Update dot position via RenderStepped using lerp for smoothness. Clickable zone Labels/ImageButtons for fast travel (ProximityPrompt or direct teleport if unlocked). Fog of war: dark overlay Frames per zone that fade when zone visited (DataStore tracks explored). Legend panel.' },
      { name: 'Crafting Grid UI', keywords: ['crafting grid', 'recipe grid', 'craft ui', '3x3 grid', 'crafting table ui'],
        how: '3x3 grid of ImageButton slots + output slot. Drag from inventory to slots. Pattern match: serialize grid into string key ("woodironwood..." = some recipe). ModuleScript recipe lookup: table[pattern] = result. Show result in output slot. Craft button: validate have materials, consume from inventory, grant output. Unknown pattern: output slot empty. Clear button resets grid.' },
      { name: 'Stat Allocation UI', keywords: ['stat allocation', 'stat points', 'attribute points', 'spend points', 'stat build'],
        how: 'On level up: grant stat points (IntValue "StatPoints"). ScreenGui: rows per stat (Strength, Agility, Intelligence, etc.) with current value + +/- buttons. Preview: show pending allocation in yellow before confirm. Confirm: RemoteEvent "AllocateStats" sends delta table. Server validates total delta <= available points. Apply multipliers immediately. Respec: unlock via item/payment, resets all.' },
      { name: 'Chat Bubble Custom', keywords: ['chat bubble', 'overhead chat bubble', 'custom chat bubble', 'chat overhead'],
        how: 'BillboardGui parented to character Head (StudsOffset Y=2). TextLabel with UICorner (rounded, white bg). On chat event: set Text, animate in (TweenService scale 0→1), typewriter effect (loop adding chars). Auto-size: TextBounds drives Frame size. Fade out after 5s (TweenService Transparency 0→1). Queue: multiple messages cycle. Word wrap enabled, max 3 lines.' },
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
      { name: 'Dialogue Tree', keywords: ['dialogue tree', 'branching dialogue', 'conversation tree', 'dialogue choices', 'npc conversation'],
        how: 'ModuleScript: tree = {id, text, choices: [{text, next, condition, action}]}. condition: function checking player state (has item, quest done). action: function that runs on choice (give item, start quest). LocalScript renders: NPC text BillboardGui or bottom ScreenGui dialog box, choice buttons. Traverse by ID. DataStore tracks visited branches for story continuity.' },
      { name: 'NPC Schedule', keywords: ['npc schedule', 'npc routine', 'npc daily', 'npc timetable', 'npc location schedule'],
        how: 'Schedule table: {{startHour=6, endHour=9, location="Home"}, {startHour=9, endHour=17, location="Shop"}}. Server Heartbeat: check Lighting.ClockTime vs schedule entries. When time crosses threshold: NPC PathfindingService to new location. BoolValue "AtLocation" set on arrival. Animation changes by location (idle vs work animations). Dialogue changes per location.' },
      { name: 'Merchant Restock', keywords: ['restock', 'shop restock', 'inventory restock', 'merchant restock', 'item refresh'],
        how: 'IntValue per shop item tracking current stock. DataStore saves stock levels. task.spawn loop: every N seconds (common=300s, rare=3600s), increment stock up to maxStock. On purchase: decrement stock, check > 0 server-side. ScreenGui shows stock count per item. "Out of Stock" grays out button. Restock notification via RemoteEvent when stock replenishes while player watches.' },
      { name: 'Boss Phases', keywords: ['boss phases', 'boss phase', 'phase transition', 'boss health phase', 'phase change'],
        how: 'NumberValues for HP thresholds {0.75, 0.5, 0.25}. Humanoid.HealthChanged:Connect → check ratio against phases table. Phase transition: brief invincibility (1s), screen flash, new animation, changed attack pattern (swap ModuleScript config), spawn minions, change aura ParticleEmitter color. Phase 4 (desperation <25%): double attack speed, new special move. Sound sting per transition.' },
      { name: 'NPC Emotions', keywords: ['npc emotion', 'npc mood', 'npc happy', 'npc angry', 'npc expression'],
        how: 'BillboardGui above NPC head with emoji TextLabel. StringValue "Mood" drives emoji (Happy="😊", Angry="😠", Scared="😨", Neutral="😐"). Triggers: Happy=player buys item, Angry=player attacks, Scared=monster nearby (magnitude check 20 studs), Neutral=idle 10s. TweenService scale bounce on mood change. Angry NPCs refuse to trade, Scared NPCs run away.' },
      { name: 'Guard AI', keywords: ['guard ai', 'guard npc', 'restricted area', 'security guard', 'forbidden zone'],
        how: 'Guard patrols boundary. If player enters restricted zone (Region3 check or Part.Touched): RemoteEvent "Warning" to player ("This area is restricted!"), guard faces player. If player stays 3s: chase begins (PathfindingService, faster WalkSpeed=20). On catch: teleport player out or apply penalty. Guard radio sound during chase. Guard calls "backup" after 10s chase (spawns second guard).' },
      { name: 'Companion AI', keywords: ['companion', 'follower', 'ai companion', 'helper ai', 'companion npc'],
        how: 'Model follows player via PathfindingService (recompute path every 2s). Commands via ProximityPrompt radial menu: Stay(anchor in place), Follow(resume), Attack(target enemy). Companion attacks nearest enemy when in combat range (aggro radius 15). Has own HP (shown in HUD corner). Inventory table for held items. On death: waits 30s then respawns at player location. Mood system affects performance.' },
      { name: 'Crowd AI', keywords: ['crowd', 'crowd npc', 'pedestrian', 'ambient npc', 'random walker'],
        how: 'Spawn 10-20 NPC models in designated area. Each has random walk loop: pick random point within radius (math.random offset from center), MoveTo, wait 2-5s, pick new point. Separation steering: check nearby NPC positions, apply small offset force away from any too-close. Despawn if no player within 100 studs (LOD). Interact: click NPC for random greeting dialogue from pool.' },
      { name: 'Training Dummy', keywords: ['training dummy', 'practice dummy', 'combat dummy', 'damage test', 'dps check'],
        how: 'Model with Humanoid (MaxHealth=99999). Never dies: on health hit 0, restore to max. Track damage received: IntValue increments, BillboardGui shows total damage. DPS meter: damage in last 5 seconds, reset counter every 5s. Hit numbers float up (BillboardGui TweenService). Reset button (ProximityPrompt "Reset Stats"). Material: Neon or indicator of activity. Combo practice mode.' },
      { name: 'Quest Board NPC', keywords: ['quest board', 'random quest', 'quest bulletin', 'mission board', 'notice board'],
        how: 'SurfaceGui on board Part showing 5 available quests (random from pool of 20). Each card: quest name + description + reward + difficulty stars. ProximityPrompt "View Board". Click quest to accept (add to DataStore active quests). Quest pool refreshes daily (os.date day check). Completed quest checkmark. NPC standing nearby gives bonus dialogue for certain quests.' },
      { name: 'Blacksmith NPC', keywords: ['blacksmith', 'forge npc', 'weapon smith', 'upgrade npc', 'smith'],
        how: 'ProximityPrompt "Visit Blacksmith". ScreenGui: tabs for Upgrade/Repair/Craft. Upgrade: select equipped weapon, show current stats + next level stats, coin cost = level^2 * 50. On upgrade: play hammer animation (Animation on NPC), item "returns" (disabled 2s delay visual), stats apply. Repair: restore durability. Craft: recipe system with materials. Anvil sound effects.' },
      { name: 'Rescue NPC', keywords: ['rescue', 'rescue npc', 'save npc', 'trapped npc', 'escort npc'],
        how: 'NPCs in cages/buildings have BoolValue "Rescued"=false. Interact with key item or interaction (ProximityPrompt "Free"). On rescue: Rescued=true, NPC follows player (companion AI). Deliver NPC to safe zone (Touched on zone Part). Reward: coins + item + XP. Quest tracker shows N/total rescued. All NPCs rescued = bonus achievement. NPC says thank-you dialogue on delivery.' },
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
      { name: 'Mastery System', keywords: ['mastery', 'weapon mastery', 'skill mastery', 'mastery level', 'mastery xp'],
        how: 'Each weapon/tool has separate XP track in DataStore under "mastery_{toolName}". Gain mastery XP on use/kills. Mastery thresholds 1-10: {0,100,300,600,1000,1500,2100,2800,3600,4500}. On level up: unlock passive ability or boost (mastery 3=+10% damage, 7=special ability). Mastery level shown in BillboardGui near tool icon. Different from player level — per-item progression.' },
      { name: 'Prestige Stars', keywords: ['prestige stars', 'prestige rank', 'star rank', 'prestige badge'],
        how: 'IntValue "PrestigeStars" (0-10). Each prestige grants 1 star. BillboardGui shows star icons above player name (gold ★ per star, empty ☆ for remaining). Stars provide passive global bonuses: each star = +5% all earnings. Visual flair: silver name at 3 stars, gold at 7 stars, rainbow at 10 stars via ColorSequence cycling TextLabel color. Leaderboard sorts by prestige then coins.' },
      { name: 'Skill Tree', keywords: ['skill tree', 'talent tree', 'ability tree', 'skill unlock tree', 'perk tree'],
        how: 'ScreenGui: node graph layout (positions hardcoded per design). Each node: ImageButton with skill icon, TextLabel name, cost. Lines (Frame rotated) between connected nodes. Locked: grayscale, locked icon. Unlock: require parent unlocked + skill points (IntValue). DataStore stores table of unlocked IDs. Respec: pay fee, reset all, refund points. Preview: hover shows tooltip with stat effects.' },
      { name: 'Quest Chain', keywords: ['quest chain', 'quest story', 'sequential quest', 'quest series', 'storyline quest'],
        how: 'Array of quest IDs in sequence. DataStore "questChain_N" tracks current chain index per player. On quest complete: auto-offer next quest (dialogue popup). Chain unlocks specific rewards at end. Story beats: NPC dialogue changes at each chain stage. Cinematic triggers at chain milestones. Optional branch quests don\'t block main chain. Completion awards unique item unavailable elsewhere.' },
      { name: 'Reputation System', keywords: ['reputation', 'faction reputation', 'faction rank', 'standing', 'rep system'],
        how: 'IntValue "Reputation_{factionName}" per faction (-100 to 100). Actions affect rep: helping faction NPC +10, attacking faction member -20. Rep tiers: Hostile(<-50), Unfriendly(<0), Neutral(0-25), Friendly(25-60), Honored(60-85), Exalted(85-100). NPC shop prices scale: Hostile=200%, Exalted=70%. Quest availability gates behind rep thresholds. BillboardGui faction icon color shows standing.' },
      { name: 'Collection Log', keywords: ['collection log', 'collection', 'codex', 'bestiary', 'item log', 'discovery log'],
        how: 'DataStore table "collection" = set of found item IDs. On first obtain: add to set, show "New Discovery!" toast. ScreenGui: grid of all possible items (200+ entries), gray if not found (silhouette image), color if found. Filter by category (enemies, items, locations). Completion % shown. Reward every 25% completion. Hovering found items shows lore description.' },
      { name: 'World Bosses', keywords: ['world boss', 'server boss', 'open world boss', 'global boss', 'boss event'],
        how: 'Server scheduler: spawn world boss every 30 min (os.time() modulo check). Announce to server via RemoteEvent ("World Boss has appeared at {location}!"). Boss Model in designated area, extra high HP (scales with player count). All players can damage simultaneously. Aggro: boss targets highest DPS. On death: loot table rolls per participant who dealt >100 damage. Shared XP proportional to contribution.' },
      { name: 'Dungeon System', keywords: ['dungeon', 'instance', 'instanced dungeon', 'party dungeon', 'dungeon run'],
        how: 'Reserve private server via TeleportService:ReserveServer(). Load dungeon map from ServerStorage on arrival. Rooms: sequential Parts as doors, locked until previous room clear. Room clear = all enemies dead. Boss room at end. Timer for speed-run score. Loot chest on boss death. TeleportService return party to lobby on completion or full wipe. Dungeon level gating: require party average level >= min.' },
      { name: 'Mining System', keywords: ['mining', 'mine', 'ore', 'dig', 'pickaxe', 'ore mine'],
        how: 'Rock nodes: Model with ClickDetector + IntValue "Health". Tool "Pickaxe": click rock → decrement health, play hit animation, debris particles. Health 0: rock breaks (all Parts Transparency=1 CanCollide=false), ore Part drops (sphere with ore material). Smelt at furnace NPC: ore → bar (2s animation). Ore types by zone: Stone, Copper, Iron, Gold, Diamond. Depth zones increase ore quality.' },
      { name: 'Cooking System', keywords: ['cooking', 'recipe cooking', 'food buff', 'cook food', 'meal buff'],
        how: 'Campfire/stove Part with ProximityPrompt. ScreenGui: ingredient slots (3). Place items from inventory. Recipe matching: ingredient set = recipe key. Unknown combo: "Nothing happened". Cook button: 2s animation (steam particles, sizzle sound). Result: food item granting buffs on eat (Speed+20 10min, Health regen 5min, Damage+15% 8min). DataStore tracks discovered recipes in collection.' },
      { name: 'Enchanting System', keywords: ['enchant', 'enchanting', 'enchantment', 'enchant item', 'magic enchant'],
        how: 'Enchanting table NPC/station. Select item + enchant material. Outcome: weighted random from available enchants for item type. Success rate (80% base, -10% per enchant already on item). Enchants: +Damage%, +Speed%, +Lifesteal, +CritChance. Fail: 20% chance remove random existing enchant. Max 3 enchants per item. Enchant tooltips in inventory hover. Ancient enchant materials = rare higher-tier enchants.' },
      { name: 'Tutorial System', keywords: ['tutorial', 'onboarding', 'new player', 'tutorial guide', 'guided tutorial'],
        how: 'DataStore flag "tutorialComplete". New players: forced sequence of steps. Each step: disable non-tutorial UI, show spotlight (dark overlay with circular hole via UICorner clipping), arrow indicator pointing to target element, dialogue text. Step advance: detect required action (move WASD, click button, collect item). Skip option after step 3. Reward on completion. Return player to main game.' },
      { name: 'Exploration Rewards', keywords: ['exploration', 'discover area', 'explore reward', 'hidden area reward', 'exploration bonus'],
        how: 'Invisible Parts in hidden/off-path areas with Part:SetAttribute("ExploreID", "cave_01"). Touched: check DataStore if already found. First discovery: add to found set, grant reward (coins + item), show "New Area Discovered!" cinematic text. ScreenGui exploration log shows N/total found. Hidden areas behind waterfalls, underground, high elevation. Clues via environment design (glowing objects, paths).' },
      { name: 'Endless Mode', keywords: ['endless mode', 'infinite mode', 'survival mode', 'endless wave', 'infinite scaling'],
        how: 'Wave counter IntValue. Each wave: spawn enemies (count = 5 + wave*2). Enemy HP scales: baseHP * (1.1^wave). Speed scales: baseSpeed + wave*0.2, capped. On all enemies dead: wave complete, brief 10s break, reward (coins = wave*25). Leaderboard (OrderedDataStore) tracks highest wave reached. Endless until all players dead. Milestone waves (10, 25, 50): miniboss appears.' },
      { name: 'New Game Plus', keywords: ['new game plus', 'ng+', 'carry over', 'new game harder', 'second playthrough'],
        how: 'On story completion: offer NG+. Kept: cosmetics, pet collection, titles. Reset: story flags, zone unlocks, equipment. Bonuses: 2x XP rate, unique NG+ item drops, harder enemy variants (different Model, extra abilities). DataStore: "ngPlus" IntValue tracks cycle. Enemies show "+" icon in BillboardGui name. Unique NG+-only story dialogue reveals lore secrets.' },
      { name: 'Weekly Boss Rush', keywords: ['boss rush', 'weekly boss', 'timed boss', 'boss gauntlet', 'boss challenge'],
        how: 'Available only certain days (os.date wday check: e.g. Fri-Sun). 5 sequential boss fights, no checkpoint. Lives: 3 shared. Clear time tracked (tick() per run). OrderedDataStore leaderboard for fastest clears. Unique currency reward scaling with clear time: under 5min=gold tier. Weekly reset: leaderboard clears Monday. Exclusive cosmetics purchasable with boss rush currency.' },
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
      { name: 'Biome System', keywords: ['biome', 'biomes', 'zone biome', 'environment biome', 'terrain biome', 'biome transition'],
        how: 'Invisible Part regions define biomes (Workspace:GetPartBoundsInBox). Player position checked on Heartbeat. Enter new biome: swap BGM (crossfade 2s), change Lighting.Atmosphere properties, spawn biome-specific enemies from ServerStorage. Biome table: {Forest, Desert, Snow, Volcanic, Ocean}. Each has ambient sounds, particle effects, enemy types, exclusive drops. BillboardGui zone name appears on transition.' },
      { name: 'Destructible Environment', keywords: ['destructible', 'breakable environment', 'destructible wall', 'breakable terrain', 'destroy environment'],
        how: 'Parts have IntValue "HP". On damage (Touched by projectile or explosion): HP -= damage. At 0: break into 6-12 fragments (spawn smaller Parts with random BodyVelocity, matching material/color). Debris:AddItem(fragment, 5). Respawn timer: original Part reappears at 30s via task.delay (reset HP, Transparency 0). Crack Decal stages: swap Decal texture at 66% HP and 33% HP.' },
      { name: 'Trap System', keywords: ['trap', 'spike trap', 'pressure plate', 'arrow trap', 'trap system', 'floor trap'],
        how: 'Pressure plate Part (Touched) triggers linked trap. Types: Spike(Parts rise from floor via TweenService, CanCollide=true, damage on Touched), Arrow(spawn projectile Part with BodyVelocity), Swinging Axe(HingeConstraint AngularVelocity oscillate). Cooldown per trap (IntValue "CooldownEnd"). One-time traps vs repeating. Disarm: ProximityPrompt while crouched, requires item.' },
      { name: 'Secret Room', keywords: ['secret room', 'hidden room', 'secret passage', 'hidden door', 'secret area'],
        how: 'Hidden trigger: Part or ClickDetector disguised as environment (torch, bookshelf). On interact: hidden wall Part Transparency tweens 0→1, CanCollide=false, revealing passage behind. Sound: stone grinding. Light flickers. Optional puzzle: must pull 2 levers in correct order (BoolValue tracking). Room contains rare loot chest. DataStore tracks if player discovered it (one-time reward).' },
      { name: 'Moving Platforms', keywords: ['moving platform', 'platform movement', 'tween platform', 'moving floor', 'oscillating platform'],
        how: 'Platform Part tweens between two CFrame waypoints via TweenService (TweenInfo EasingStyle Sine, Reverses=true, RepeatCount=-1). Player stands on platform: CFrame delta applied to player HumanoidRootPart each Heartbeat (position delta from previous frame). Platform variants: linear, circular (CFrame rotated each tick), falling (one-way, respawn 5s). Multiple platforms create timing puzzles.' },
      { name: 'Lava/Hazard Zones', keywords: ['lava', 'hazard zone', 'danger zone', 'acid', 'toxic zone', 'kill zone'],
        how: 'Hazard Part with Touched event. On enter: apply continuous damage (-10/s) via task.spawn loop while player in part (TouchEnded cancels loop). Part effects: Neon material, SurfaceAppearance with molten texture, bright orange PointLight. Visual warning: warning stripes Decal. Edge glow. Safe paths between hazards. Damage type determines death animation. Lava: fiery particles on death.' },
      { name: 'Bridge System', keywords: ['bridge', 'extendable bridge', 'bridge extend', 'drawbridge', 'bridge activate'],
        how: 'Bridge segments: array of Parts, initially transparent (CanCollide=false). Extend: TweenService each segment appearing sequentially (0.2s delay each, Transparency 1→0, CanCollide=true). Retract: reverse. Trigger: lever Part ClickDetector or pressure plate. One-directional (trigger only from one side) or bidirectional. Retract timer: 10s after last player crosses (Touched detection). Sound: wooden creaking.' },
      { name: 'Gravity Zone', keywords: ['gravity zone', 'low gravity', 'high gravity', 'gravity change', 'anti gravity'],
        how: 'Region Part with BoolValue "LowGravity". Touched: apply BodyForce to character HumanoidRootPart (upward for low-g: magnitude = character mass * (196.2 - targetGravity)). TouchEnded: remove BodyForce. Visual: upside-down particles, swirling dust. Low-g zones: jump height 3x, float animation (custom Idle). High-g zones: WalkSpeed reduced 30%, crouched pose. Workspace.Gravity unchanged (only override via BodyForce).' },
      { name: 'Underwater Zone', keywords: ['underwater', 'ocean zone', 'swim zone', 'dive zone', 'water area'],
        how: 'Region3 or water Part Touched triggers underwater state. On enter: ColorCorrectionEffect (blue tint, decreased brightness), BlurEffect slight, muffled sound (volume * 0.4 + pitch -0.3), bubble ParticleEmitter on character. Oxygen bar: NumberValue 100→0 over 30s. At 0: take 5 damage/s. Surface (TouchEnded or Y > waterLevel): restore all effects, oxygen regens. Swim animation: Humanoid swim state.' },
      { name: 'Conveyor Belt World', keywords: ['conveyor world', 'factory conveyor', 'moving belt', 'production line', 'assembly line'],
        how: 'Conveyor Part: BasePart with AssemblyLinearVelocity applied to objects resting on it. Touched: add character or Part to "on conveyor" table, apply velocity each Heartbeat. TouchEnded: remove from table. Direction: Part.CFrame.LookVector * speed. Branching conveyors: switch Parts redirect at junction (toggle direction on timer). Item sorters: if item has specific attribute, divert to different branch.' },
      { name: 'Cannon/Launcher', keywords: ['cannon', 'launcher', 'catapult', 'launch player', 'ball launcher'],
        how: 'Seat (Seat instance) in cannon barrel. Aim: camera rotation drives barrel CFrame via AlignOrientation. Activate button (ProximityPrompt or TextButton): eject player from seat, apply BodyVelocity (barrel.CFrame.LookVector * force). Arc: upward component. Sound: boom. Smoke ParticleEmitter burst. Landing: crater particle. Safe zone around landing (damage on non-soft landing). Launch preview: trajectory arc using math (parabola calculation shown as Part chain).' },
      { name: 'Breakable Floor', keywords: ['breakable floor', 'cracking floor', 'glass floor', 'floor crack', 'falling floor'],
        how: 'Floor Parts with IntValue "Cracks" starting at 0. Character weight on Touched: Cracks+=1 after 0.5s delay. Crack stages: Cracks=1 swap Decal to crack1.png, Cracks=2 to crack2.png. Cracks=3: Part falls (Anchored=false, CanCollide=true, applies gravity). Debris:AddItem(part, 3). Replacement Part spawns at position after 10s. Sound: creak on step, break on fall.' },
      { name: 'Zipline World', keywords: ['zipline world', 'zip line travel', 'cable car', 'wire ride', 'zipline network'],
        how: 'Network of Attachment pairs connected by Beam (visual rope). ProximityPrompt at start Attachment. On grab: AlignPosition lerps character from start to end over duration (distance/speed). Character faces direction of travel. Arms raised animation. Release early with Jump key (interrupt lerp). Bidirectional option: prompt at both ends. Sound: whoosh with pitch shift based on speed.' },
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
      { name: 'Friend System', keywords: ['friend system', 'friends list', 'add friend', 'friend request', 'player friends'],
        how: 'DataStore "friends_{userId}" = {requests=[],confirmed=[]}. Send request: RemoteEvent adds to target requests list. Accept: move to confirmed, mutual add. Decline: remove from requests. Online status: MessagingService presence or check if userId in Players. UI: friends panel showing avatar thumbnail (Players:GetUserThumbnailAsync), online indicator (green dot). Jump to friend: TeleportService to their server (requires server ID from MessagingService).' },
      { name: 'Guild/Clan System', keywords: ['guild', 'clan', 'guild system', 'clan system', 'guild bank', 'guild chat'],
        how: 'DataStore "guilds" table: {id, name, leader, members[], bankCoins, perks[]}. Create guild: pay 500 coins, pick name. Join: invitation or open guilds list. Max 50 members. Guild bank: members deposit, leader manages withdrawals. Guild XP from member activities. Perks unlock at XP thresholds: +5% XP gain, shared resource bonus, guild chat channel. Guild tag [CLAN] in BillboardGui nametag.' },
      { name: 'Spectator Mode', keywords: ['spectator', 'spectate', 'watch player', 'observer mode', 'ghost mode'],
        how: 'Dead players: Camera.CameraType=Scriptable. UI: Previous/Next player arrows. Camera follows target Character.Head via RenderStepped (offset + 5 studs behind). Cycle through alive players list. HUD overlay shows "SPECTATING [Name]". No interaction (click, tools disabled). Optional free-cam mode: WASD moves camera independently. Exit spectator when respawned.' },
      { name: 'Player Trading Market', keywords: ['player trade', 'player market', 'trading post', 'player auction', 'item trading'],
        how: 'Both players open trade window via ProximityPrompt or request. Left panel: own offered items (drag from inventory). Right panel: partner offered items (real-time sync via RemoteEvent). Both click "Ready" → 3-2-1 countdown. Both must confirm → server atomically swaps items (deduct from A add to B, deduct from B add to A). Cancel: one player closes = abort. Session timeout 60s.' },
      { name: 'Tournament System', keywords: ['tournament', 'bracket', 'elimination', 'competition', 'ranked tournament'],
        how: 'Bracket: 8 or 16 player single-elimination. Queue via ScreenGui "Join Tournament". When slots filled: auto-create bracket (TournamentService ModuleScript). Pairs teleported to PvP arena (reserved server). Winner advances. Server communicates results via MessagingService. Semi-finals and finals announced to server chat. Prizes scale: 1st place biggest, podium top 3 all rewarded.' },
      { name: 'Mentor System', keywords: ['mentor', 'mentorship', 'guide player', 'tutor system', 'mentor reward'],
        how: 'Veteran players (level > 50) opt-in as mentors. New players (< level 10) matched with available mentor. Matched via DataStore queue. Mentor follows mentee (companion-style). Mentor earns bonus XP (1.5x) while mentee is active. Mentee earns bonus XP (1.2x). Tutorial hints from mentor perspective. Mentorship ends when mentee reaches level 15. Review system: rate mentor after completion.' },
      { name: 'Player Titles', keywords: ['title', 'player title', 'name title', 'earned title', 'honorific'],
        how: 'DataStore stores {earnedTitles=[], selectedTitle=""}. Titles earned from achievements: "Dragon Slayer" from boss kill, "Speed Demon" from race win, etc. ScreenGui title selector: scroll through earned titles, click to equip. Selected title shown in BillboardGui under player name (smaller, gold text). Special titles: seasonal, limited events. Admin-only titles for moderators.' },
      { name: 'Social Score', keywords: ['social score', 'reputation score', 'player reputation', 'karma', 'trust score'],
        how: 'IntValue "SocialScore" 0-1000 (default 500=neutral). Gains: fair trades +5, completing co-op +3, mentor session +10, upvoting others +1. Losses: reports accepted -20, trade cancels -2, being rude (admin manual) -15. Score affects matchmaking priority: high-score players matched together. Shop discount: >750 score = 5% discount. Low-score (<300): cannot trade or access social features.' },
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
      { name: 'Screen Shake Variants', keywords: ['screen shake variants', 'shake intensity', 'explosion shake', 'earthquake shake', 'impact shake'],
        how: 'ShakeCamera(magnitude, duration) function. Small(0.1 mag, 0.1s): melee hits. Medium(0.3, 0.3s): explosions, ability hits. Large(0.6, 0.5s): earthquake, boss slam. RenderStepped: offset Camera.CFrame by CFrame.new(random*mag, random*mag, 0) with linear decay (lerp toward 0 over duration). Multiple simultaneous shakes: queue and sum offsets. LocalScript via RemoteEvent trigger.' },
      { name: 'Slow Motion', keywords: ['slow motion', 'slow mo', 'bullet time', 'time slow', 'time dilation'],
        how: 'workspace:SetAttribute("TimeScale", 0.3) on clients via RemoteEvent. LocalScript reads TimeScale each Heartbeat, adjusts game simulation via AnimationTrack:AdjustSpeed() on character animations. Camera FOV tweens 70→60. ColorCorrectionEffect desaturation -0.3. Sound pitch -0.2. Duration 2s then restore. Use sparingly: heavy attacks, killshots, boss deaths. Cannot nest slow motions (check active flag).' },
      { name: 'Hit Stop', keywords: ['hit stop', 'hitstop', 'freeze on hit', 'impact freeze', 'hit pause'],
        how: 'On heavy hit: freeze attacker and defender for 0.05-0.1s. Pause: set WalkSpeed=0, freeze AnimationTrack (AdjustSpeed 0). Resume: restore after delay. Enhances impact feel without visual effects. Scale duration with damage: light=0.03s, heavy=0.08s, critical=0.12s. LocalScript handles freeze for local player, server handles NPCs. Cannot be stacked.' },
      { name: 'Motion Blur Effect', keywords: ['motion blur', 'blur trail', 'speed blur', 'movement blur'],
        how: 'LocalScript: on high-speed movement (velocity magnitude > 25), every 2 frames clone character model parts as transparent overlay (Transparency 0.6). Each clone follows with 1-frame lag. Remove clone after 5 frames. Creates ghost trail illusion. Color same as character. Disable during idle. BlurEffect in Lighting also increased (Size 0→8 via TweenService during sprint).' },
      { name: 'Impact Spark', keywords: ['impact spark', 'hit spark', 'melee spark', 'weapon spark', 'strike spark'],
        how: 'On melee hit: spawn 6-10 small Parts (Size 0.1) at hit position. Each with random BodyVelocity outward (direction = (hitPart.Position - hitPoint).Unit + random offset) * 20 force. Color: yellow/white for metal, red/orange for fire, blue for magic. Transparency 0.3, Neon material. Debris:AddItem(spark, 0.3). Total spawn time: 0.05s. Bright PointLight flash (0.1s Lifetime via TweenService Brightness 5→0).' },
      { name: 'Electricity Effect', keywords: ['electricity', 'electric effect', 'lightning bolt', 'electric beam', 'shock visual'],
        how: 'Beam between two Attachments (on character and target). Beam.Segments=5, jagged texture (lightning texture asset). Blue-white ColorSequence. Flicker: task.spawn loop toggling Enabled at irregular intervals (task.wait(math.random(0.02, 0.1))). Width pulsed via TweenService. Multiple beams for chain lightning. PointLight at each end with matching color. ZAP sound at origin.' },
      { name: 'Smoke Trail', keywords: ['smoke trail', 'smoke effect', 'exhaust smoke', 'smoke projectile', 'trail smoke'],
        how: 'ParticleEmitter attached to moving object (projectile, vehicle exhaust). Properties: Texture=smoke, Color=gray/black, Rate=50, Speed=NumberRange(2,5), Lifetime=NumberRange(0.5,1.5), Size=NumberSequence(1→6), Transparency=NumberSequence(0→0.8→1), RotSpeed up. Parent to Part. On projectile: destroy ParticleEmitter but let existing particles finish (Enabled=false, Debris 2s). Wind offset: Drag=0.3.' },
      { name: 'Teleport VFX', keywords: ['teleport vfx', 'warp effect', 'blink effect', 'teleport visual'],
        how: 'On teleport: at origin — spawn cylinder of light (Part, Neon material, 0.5 radius, 10 height, CFrame rotates 360 over 0.5s via TweenService). ParticleEmitter burst Rate=200 for 0.1s. Sound: whoosh. White flash Frame in ScreenGui (Transparency 0→1 over 0.15s). At destination: same cylinder + particles appear. Player materializes (Transparency tween 1→0 over 0.3s). Entire sequence 0.8s.' },
      { name: 'Level Up VFX', keywords: ['level up vfx', 'level up effect', 'level up visual', 'ding effect', 'rank up effect'],
        how: 'Ring of light: ImageLabel circle texture, scale TweenService 0→300px over 0.5s with Transparency 0→1. "LEVEL UP!" TextLabel floats up (+100px Y TweenService) and fades. Golden ParticleEmitter burst from character (Rate=100 for 0.5s, gold color). Chime sound plays. Camera slight zoom out then back. Other players see radial glow from leveling player. Disable other UI briefly.' },
      { name: 'Footprint System', keywords: ['footprint', 'footprints', 'step print', 'mud print', 'sand print'],
        how: 'LocalScript: Raycast from each foot position (L/R from HumanoidRootPart ±0.5 X) downward. On hit: place Decal on surface at hit normal. Decal texture varies by surface material (mud, sand, snow footprint). Transparency starts 0, fades over 10s via table of {decal, createdTime} cleaned each second. Max 50 footprints (remove oldest). Only on walkable materials, not wood/metal.' },
      { name: 'Water Splash', keywords: ['water splash', 'splash effect', 'water entry', 'splash vfx'],
        how: 'On entering water (Touched or Y < waterLevel): spawn ring of Parts outward at water surface (8 small wedge Parts around circumference, BodyVelocity outward). ParticleEmitter spray upward: blue/white droplets, Rate=100 for 0.3s. Sound: splash (pitch varies by speed of entry). Second smaller splash on exit. Ripple: ImageLabel circle at water surface, scale 0→200px, fade. Debris 2s.' },
      { name: 'Glass Break', keywords: ['glass break', 'shatter', 'glass shatter', 'break glass', 'window break'],
        how: 'Glass Part (Transparency 0.2, smooth material, SurfaceAppearance glass). On impact (Touched by projectile or force > threshold): spawn 8-12 triangular wedge Parts at glass Part position with random BodyVelocity outward (5-15 force) + random BodyAngularVelocity. Original Part: Transparency=1, CanCollide=false immediately. Shard color matches glass. High-pitched shattering SFX. Debris:AddItem(shards, 3). No respawn for single panes.' },
      { name: 'Weather Particles', keywords: ['weather particles', 'rain particles', 'snow particles', 'falling leaves', 'weather vfx'],
        how: 'LocalScript: Atmosphere child of camera attachment. Rain: gray elongated Parts or ParticleEmitter (vertical lines, high rate, short lifetime, BodyVelocity downward). Snow: white sphere particles, slow drift, random horizontal movement. Leaves: green/brown irregular Part-textured particles, spinning (AngularVelocity). Pollen: tiny yellow spheres floating. Intensity slider: adjusts Rate and particle count. Wind direction shifts horizontal velocity.' },
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
      { name: 'Profile System', keywords: ['player profile', 'profile page', 'stat profile', 'profile gui', 'player card'],
        how: 'ScreenGui "Profile" Frame: ViewportFrame showing character avatar (WorldModel + character clone), player name + level, join date, total playtime. Stats grid: kills, deaths, quests completed, hours played. Bio: TextBox (editable, save to DataStore "profile_{userId}"). View other players: click their name in leaderboard. Public data via DataStoreService SharedDataStore. Titles/badges strip display.' },
      { name: 'Ban System', keywords: ['ban', 'ban player', 'ban system', 'kick ban', 'admin ban'],
        how: 'DataStore "Bans": {[userId] = {reason, bannedBy, expires}}. On PlayerAdded: GetAsync ban key, if found and os.time() < expires: Kick player with ban reason + expiry. Permanent bans: expires = math.huge. Admin command "!ban [player] [duration] [reason]". Unban: RemoveAsync. Audit log: append each ban action to OrderedDataStore. UI: admin panel lists active bans with unban buttons.' },
      { name: 'Cross-Server Data', keywords: ['cross server', 'global data', 'server broadcast', 'server message', 'global event'],
        how: 'MessagingService:PublishAsync("GlobalEvent", {type, data}). Subscribe on game start: MessagingService:SubscribeAsync("GlobalEvent", callback). Use cases: global announcements, boss spawn notifications, player achievements broadcast. Rate limit: 150 messages/min. Data size limit 1KB. For player data sync between servers: use DataStore (not MessagingService). Fire to specific servers via private topics.' },
      { name: 'Analytics Tracking', keywords: ['analytics', 'tracking', 'telemetry', 'player analytics', 'game analytics'],
        how: 'Log table in DataStore: append events {type, timestamp, data}. Events: session_start, session_end, level_up, purchase, death (with position), quest_complete. Batch writes: collect events, flush to DataStore every 60s to avoid throttling. Admin dashboard reads analytics DataStore via GetSortedAsync. Death heatmap: bucket positions to 10-stud grid, count deaths per cell, display as intensity map.' },
      { name: 'Undo/Redo Stack', keywords: ['undo', 'redo', 'undo redo', 'ctrl z', 'build undo'],
        how: 'Table "undoStack" (max 20 entries) and "redoStack". Each entry: {action, data} (e.g. {action="place", data={partCFrame, partProps}}). On action: push to undoStack, clear redoStack. Ctrl+Z (UserInputService): pop from undoStack, perform inverse action (delete placed part), push to redoStack. Ctrl+Y: pop redoStack, redo. Serialize full state snapshots for complex actions. Cap memory at 20.' },
      { name: 'Auto-Save Indicator', keywords: ['auto save', 'saving indicator', 'save indicator', 'save status', 'cloud save'],
        how: 'ScreenGui corner element: spinning circle ImageLabel (TweenService rotation) + "Saving..." TextLabel. Show when DataStore write starts. On pcall success: swap to checkmark icon + "Saved" green text, fade after 2s. On error: red X + "Save Failed" + retry button. Track last save time: "Last saved 2m ago" text updates every 30s. Never interrupt gameplay for saves (always async).' },
      { name: 'Offline Progress', keywords: ['offline progress', 'idle earnings', 'offline gain', 'passive offline', 'away earnings'],
        how: 'DataStore stores lastOnlineTime = os.time() on PlayerRemoving. On PlayerAdded: elapsed = os.time() - lastOnlineTime (capped at 8h max). Grant: coins += idleRate * elapsed/60. Popup on join: "Welcome back! You earned +N coins while away." IdleRate based on upgrades. Cap prevents abuse. Display breakdown (time away, rate, total earned). Animation: coins raining from sky for 2s.' },
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
      { name: 'Ragdoll System', keywords: ['ragdoll', 'death ragdoll', 'physics death', 'limp body', 'ragdoll physics'],
        how: 'On death: unanchor all character Parts (Anchored=false). Add BallSocketConstraints between limb joints (LowerTorso-UpperTorso, UpperArm-LowerArm etc). Remove Motor6D joints (disable them). Apply BodyVelocity impulse from damage direction (knockback into ragdoll). Humanoid:ChangeState(Dead). Debris or respawn after 3s. Re-enable Motor6Ds on respawn, remove BallSockets. LocalScript for visual-only ragdoll.' },
      { name: 'Jetpack', keywords: ['jetpack', 'jet pack', 'rocket pack', 'hover jetpack', 'fly jetpack'],
        how: 'Tool "Jetpack" as backpack accessory. Hold Space: BodyForce upward (mass * 196.2 * 1.5 for hover, higher for ascent). Fuel: NumberValue 100→0 draining at 2/s while active. Refuel at stations. ParticleEmitter exhaust at jetpack Part (fire/smoke). Sound: engine hum. Tilt character slightly (AlignOrientation offset) while moving. Deactivate at fuel 0 (brief warning flicker). HUD fuel bar.' },
      { name: 'Teleport Dash', keywords: ['teleport dash', 'blink dash', 'blink ability', 'short teleport', 'phase dash'],
        how: 'Keybind Q or double-tap direction. Raycast 10 studs in look direction, check for obstacles. Clear: teleport character CFrame. Blocked: teleport to last clear point before obstacle. Effect: trail of afterimage frames (transparent character clones, Debris 0.2s) at each position. Immune to damage during dash (BoolValue "Dashing"). 3s cooldown, shown in HUD. Sound: woosh.' },
      { name: 'Ground Pound', keywords: ['ground pound', 'stomp', 'slam', 'aerial slam', 'air slam'],
        how: 'Aerial only (check Humanoid state = Jumping or Freefall). Shift key: BodyVelocity Vector3.new(0,-80,0) plus cancel horizontal momentum. Landing: AoE damage in 8 stud radius (workspace:GetPartBoundsInRadius), knockback outward. Shockwave: ring Part scales 0→16 over 0.3s, transparent. Camera shake Medium. Sound: heavy impact. Crater: temporary dark circle Decal. Cooldown 4s.' },
      { name: 'Ice Skating', keywords: ['ice skating', 'ice slide', 'slippery ice', 'ice movement', 'skating physics'],
        how: 'Detect ice material: Raycast down, check material == Enum.Material.Ice or Part:GetAttribute("Slippery"). Apply sliding momentum: on Heartbeat, current velocity direction maintained (BodyVelocity = prevVelocity * 0.98 instead of 0). Direction changes slowly (lerp turning). Speed builds up gradually. WalkSpeed feels slippery (input response delay). Custom skate animation. Falling: if turn too sharp, stumble animation.' },
      { name: 'Ladder Climbing', keywords: ['ladder', 'climb ladder', 'ladder system', 'wall ladder', 'rope ladder'],
        how: 'Ladder Parts with BoolValue "IsLadder". Raycast forward: if hit ladder Part, enter climb state. Climb state: Humanoid.WalkSpeed=0, apply BodyPosition Y offset based on W/S input (climb speed 5). AlignOrientation keeps character facing ladder. At top: exit state when Y > ladder top. At bottom: exit state. No jump while climbing. Custom climb animation. D-pad horizontal: shimmy sideways if ladder wide enough.' },
      { name: 'Ledge Grab', keywords: ['ledge grab', 'ledge hang', 'grab ledge', 'cliff hang', 'edge grab'],
        how: 'Raycast forward from chest height + Raycast forward from head height. If chest hits wall and head clears = ledge detected. Enter hang state: BodyPosition aligns hands to edge, AlignOrientation faces wall. W/Space to pull up (tween CFrame up + forward). A/D to shimmy (move horizontal along edge). Fall if S. Cooldown 0.5s after drop. Hang animation. Cannot hang while holding heavy weapon.' },
      { name: 'Trampoline', keywords: ['trampoline', 'bouncy', 'super bounce', 'spring floor', 'bounce high'],
        how: 'Part with Touched event. On touch: check if player descending (Velocity.Y < 0). Apply BodyVelocity upward: force = -Velocity.Y * 1.5 (bounce back with energy). Consecutive bounces: track lastBounceTime, if < 0.5s add bonus multiplier (up to 3x max). ParticleEmitter burst at impact. Stretch animation (character squish/stretch). Sound: boing. Cool down per player: prevent ground-bounce exploit.' },
      { name: 'Quicksand', keywords: ['quicksand', 'sink', 'sinking', 'mud trap', 'slow sink'],
        how: 'Quicksand Part Touched: enter sink state. BodyPosition moves character down (-1 stud/s). WalkSpeed halved. Particles: sand rising around character. Struggle mechanic: spamming Jump key slows sinking rate (each jump -0.3s/stud). Fully sunk (Y below surface): kill character or teleport to edge. Escape: rope item or nearby platform to grab (ProximityPrompt). Sand texture with SurfaceAppearance.' },
      { name: 'Magnetic Boots', keywords: ['magnetic boots', 'wall walk', 'ceiling walk', 'gravity boots', 'sticky boots'],
        how: 'GamePass or item. Toggle with G key. When active: Raycast in multiple directions (down, sides, forward). Hit surface: rotate character CFrame to align with surface normal (AlignOrientation). Apply BodyForce opposing surface normal (keeps character "stuck"). WalkSpeed adjusts for wall walking. Camera follows character orientation. Disable near water or magnetic fields. Power meter depletes.' },
      { name: 'Parachute', keywords: ['parachute', 'glide', 'chute', 'skydive', 'parachute deploy'],
        how: 'Tool or auto-deploy at height > 50 studs airborne. Activate: spawn canopy Part above character (TweenService scale 0→4). BodyVelocity clamps fall speed to -10 studs/s. Horizontal movement via WASD (BodyVelocity X/Z). Steer animation: arms out. Land: remove canopy + BodyVelocity. Damage reduction on landing. Cannot attack while deployed. Wind pushes in direction. Cut cord to fall fast.' },
      { name: 'Hook Shot', keywords: ['hook shot', 'grappling hook', 'rope hook', 'hook pull', 'hook swing'],
        how: 'Tool. Activate: Raycast from camera to crosshair. If hit solid surface within 60 studs: attach RopeConstraint from HumanoidRootPart Attachment to hit Part Attachment (or fixed position Attachment). BodyPosition pulls toward hit point (MaxForce high). At arrival: release constraint. Swing: disable pull, let physics + rope simulate swing arc. Release on tool deactivate. Rope Beam visual. Sound: thunk on attach.' },
      { name: 'Charge Jump', keywords: ['charge jump', 'power jump', 'hold to jump', 'charged jump', 'super jump charge'],
        how: 'Hold Space: JumpPower builds up (0→2s charge). Charge meter in HUD: ProgressBar grows. Color changes green→gold at max. On release: Humanoid.JumpPower = baseJump + chargeJump (max 3x base). Dust explosion at launch. Sound: whoosh intensity scales with charge. Cannot move while charging (WalkSpeed=0). Cancel: release without enough charge (<0.3s) = normal jump. Cooldown 1s.' },
      { name: 'Surfing/Skating Board', keywords: ['surfing', 'skateboard', 'skate', 'board ride', 'surf board'],
        how: 'VehicleSeat on board Model. Physics: SpringConstraint for board hover (1 stud above ground). Board tilts with steering (AlignOrientation offset). Tricks: detect airborne + rotation input, track spin degrees. Land tricks: score points, show trick name BillboardGui. Rail grind: Raycast detects rail Part, BodyPosition aligns to rail CFrame path. Speed builds downhill (gravity assist). Wipeout on high-speed collision.' },
      { name: 'Portal Gun', keywords: ['portal gun', 'portal', 'teleport portal', 'two portals', 'portal system'],
        how: 'Tool. Left click: place orange portal at raycast hit surface. Right click: place blue portal. Each portal: Part (oval, Neon material) flat on surface, with Attachment. On character Touched portal: CFrame to other portal, rotate to exit normal. Preview: transparent oval ghost at aim point. Surface check: no portals on moving parts. Limit: one of each color. Portal pair linked by color attribute.' },
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
