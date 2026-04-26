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

  // ════════════════════════════════════════════════════════════════════
  // AUDIO & MUSIC
  // ════════════════════════════════════════════════════════════════════
  {
    name: 'Audio & Music',
    systems: [
      { name: 'Dynamic Music', keywords: ['dynamic music', 'adaptive music', 'combat music', 'zone music', 'music transition', 'bgm change'],
        how: 'ModuleScript "MusicConfig": {zone="Forest", trackId=123, combatTrackId=456}. State machine: idle vs combat (tracked via BoolValue "InCombat" server-side). TweenService volume 1→0 on current track, swap SoundId, TweenService volume 0→1. Crossfade 2s. Boss zone: override with boss music. On player death: sorrowful sting. Victory: fanfare sting. Queue next track if playlist mode.' },
      { name: 'Positional Audio', keywords: ['positional audio', 'spatial sound', '3d audio', 'sound distance', 'ambient sound'],
        how: 'Sound parented to Part in workspace. RollOffMode=InverseTapered, RollOffMaxDistance per sound type (campfire=30, machinery=60, waterfall=80). RollOffMinDistance=5. Volume based on sound type. Multiple ambient sources around map. Use SoundGroup "Ambient" for group volume control. No emitter needed (automatic positional audio). Test: walk toward source, verify volume gradient.' },
      { name: 'Material Footstep Audio', keywords: ['footstep sound', 'material sound', 'step sound', 'walk sound', 'running sound', 'material footstep'],
        how: 'LocalScript: Humanoid.Running:Connect(speed). Every 0.4s/speed steps: Raycast down from HumanoidRootPart. material = hit.Instance.Material. Play from MaterialSounds table: {Grass=rbxasset://..., Wood=rbxasset://..., Metal=rbxasset://...}. Pitch: math.random(90,110)/100 for variation. Volume scales with speed (run louder than walk). Separate sounds for jump launch and land.' },
      { name: 'Combat Sound System', keywords: ['combat sound', 'hit sound', 'weapon sound', 'sfx combat', 'attack sound'],
        how: 'SFX table: {swing=id, hit=id, miss=id, block=id, critHit=id, death=id}. Play swing on attack animate start. Hit: play on HumanoidTakeDamage, pitch random 0.9-1.1. Miss: whoosh sound if no target hit. Block clang: on block event. CritHit: unique higher-impact sound. Death: groan + thud. All sounds in SoundGroup "Combat" for master volume. Sound attenuation via Part-parented Sounds for nearby players.' },
      { name: 'Ambient Layers', keywords: ['ambient layer', 'ambient sound', 'background ambience', 'nature sound', 'ambient loop'],
        how: 'Base drone: constant looped Sound (low volume, nature/wind). Random events: table of {soundId, minInterval, maxInterval}. task.spawn per event type: task.wait(math.random(min,max)), play sound at random position near player, repeat. Examples: birds (10-30s), wind gust (15-25s), distant thunder (60-120s in storms). Fade ambient during intense music. Zone-specific ambience via biome system trigger.' },
      { name: 'Music Jukebox', keywords: ['jukebox', 'music player', 'song select', 'music box', 'playlist'],
        how: 'Physical jukebox Model with ProximityPrompt. ScreenGui: horizontal ScrollingFrame of track cards (ImageLabel album art + TextLabel title + artist). Click track: Play selected Sound in workspace (shared ambient). Volume slider. Next/Previous buttons. Loop toggle. Now Playing: BillboardGui on jukebox shows current track. Coins to skip: DevProduct optional. Track list in ModuleScript.' },
      { name: 'Victory Fanfare', keywords: ['victory sound', 'fanfare', 'win sound', 'success music', 'win jingle'],
        how: 'Short Sound (2-3s, Looped=false) played at full volume on win/achievement. LocalScript: on RemoteEvent "Victory" → play fanfare Sound in SoundService (not positional). Overlay current BGM: tween BGM volume 1→0.2, play fanfare, after fanfare: tween BGM back. Different fanfares per event type: round win, achievement unlock, boss defeat, level up. Pitch variations per tier of achievement.' },
      { name: 'Horror Audio', keywords: ['horror sound', 'horror audio', 'scary sound', 'jumpscare sound', 'suspense sound'],
        how: 'Heartbeat: Sound looped, pitch = 0.5 + (maxDanger-distance)/maxDanger * 1.0 (faster near danger). Whispers: random Sound from whisper pool plays quietly every 30-90s during exploration. Stinger: sudden loud Sound (violin screech, bass drop) on monster reveal or jumpscare. Silence technique: fade all sounds before jumpscare (contrast effect). Ambient drone that modulates tension.' },
      { name: 'Vehicle Engine Sound', keywords: ['engine sound', 'car sound', 'vehicle sound', 'engine rev', 'motor sound'],
        how: 'Sound parented to VehicleSeat. Idle: low-pitch Sound looped (Pitch 0.5). On throttle: TweenService Pitch toward 1.0 + throttle*0.5. On decelerate: Pitch drops back to idle. Gear shift: brief Sound at certain speed thresholds. Brake screech: play screech Sound when braking from high speed. Rev limiter sound at max RPM. External drivers hear positional engine sound.' },
      { name: 'UI Sound Design', keywords: ['ui sound', 'button sound', 'click sound', 'menu sound', 'ui sfx'],
        how: 'SoundGroup "UI" (volume 0.6). LocalScript attaches sounds to GuiObjects: click=small pop, hover=subtle tick (UserInputService MouseMoved check on GuiObject), menu open=whoosh in, menu close=whoosh out, purchase=cash register cha-ching, error=low buzz, notification ping=bright chime. All sounds in ReplicatedStorage AudioLibrary ModuleScript with playSound helper function.' },
    ],
  },

  // ════════════════════════════════════════════════════════════════════
  // CAMERA SYSTEMS
  // ════════════════════════════════════════════════════════════════════
  {
    name: 'Camera Systems',
    systems: [
      { name: 'Third Person Lock', keywords: ['third person', 'camera lock', 'behind camera', 'tps camera', 'over shoulder camera'],
        how: 'LocalScript: Camera.CameraType=Enum.CameraType.Scriptable. RenderStepped: calculate desired CFrame = character.HumanoidRootPart.CFrame * CFrame.new(0,2,-6). TweenService lerp camera toward desired CFrame each frame (smoothing 0.1). Mouse.X/Y influence: add small horizontal/vertical offset to look-at point. FieldOfView 70. Character always faces camera direction.' },
      { name: 'Top Down Camera', keywords: ['top down', 'top down camera', 'overhead camera', 'birds eye', 'isometric top'],
        how: 'Camera.CameraType=Scriptable. CFrame = CFrame.new(player.Position + Vector3.new(0,50,0), player.Position). Update position each Heartbeat following player X/Z. Rotation locked. Scroll wheel: adjust height (zoom) 20-80 studs. Strategy game feel. Terrain rendered flat below. Character movement: click-to-move (Mouse.Hit on terrain, set target position). No character following camera by default — top-down movement.' },
      { name: 'Isometric Camera', keywords: ['isometric', 'iso camera', 'diagonal camera', 'rpg camera', '45 degree camera'],
        how: 'Fixed 45-degree angle, CFrame = player.CFrame * CFrame.Angles(math.rad(-30),math.rad(45),0) * CFrame.new(0,0,-20). Camera.CameraType=Scriptable. Follow player position, rotation stays locked. Scroll zoom: adjust back-offset 10-40. Pixel art or low-poly aesthetic common. Character movement: camera-relative (W=northeast, S=southwest). UICorner depth perception maintained.' },
      { name: 'Cinematic Camera', keywords: ['cinematic camera', 'scripted camera', 'camera path', 'camera animation', 'cutscene camera'],
        how: 'Sequence of CFrame keyframes with timestamps. Camera.CameraType=Scriptable. TweenService between keyframes (TweenInfo with EasingStyle.Sine). Letterbox: two black Frame bars top and bottom (UDim2 size tweens from 0→0.1 height). Disable player input during cinematic (UserInputService:SetModalEnabled or hide character). Skip button (screen click after 1s). Return Camera.CameraType=Custom when done.' },
      { name: 'Security Camera', keywords: ['security camera', 'cctv', 'camera view', 'surveillance camera', 'camera cycle'],
        how: 'Array of camera CFrames placed in workspace (or CameraPoint Parts). LocalScript: cycle through cameras via timer (5s each) or player input (Previous/Next keybinds). Camera.CameraType=Scriptable, CFrame set to each camera point. VHS/static effect: ImageLabel with grain texture semi-transparent overlay. Timestamp overlay TextLabel. Beep sound on camera switch. Monitor Part shows ViewportFrame of camera view.' },
      { name: 'First Person Lock', keywords: ['first person', 'fps camera', 'first person lock', 'locked first person', 'fps mode'],
        how: 'Camera.CameraMode=Enum.CameraMode.LockFirstPerson. Hide character upper body: make character Parts transparent except arms. Viewmodel: separate arm model parented to camera, follows Camera.CFrame. Weapon viewmodel position/animation separate from world weapon. Head bob: sine wave offset on RenderStepped based on WalkSpeed. Lean: Q/E keys tilt camera roll axis slightly.' },
      { name: 'Photo Mode', keywords: ['photo mode', 'screenshot mode', 'camera mode', 'photo capture', 'photo filter'],
        how: 'Toggle P key: freeze character (WalkSpeed=0), Camera.CameraType=Scriptable, free-float WASD camera movement. UI: depth of field slider (DepthOfFieldEffect Intensity 0-1), filter buttons (ColorCorrectionEffect presets), FOV slider. Capture: ScreenshotHud or guide player to Print Screen. Hide all HUD elements during photo mode. "PHOTO MODE" TextLabel. Exit restores all settings.' },
      { name: 'Camera Zoom Lock', keywords: ['zoom lock', 'zoom restrict', 'camera distance', 'forced zoom', 'indoor camera'],
        how: 'Zone trigger Parts with attributes: CameraMinZoom=2, CameraMaxZoom=10. On zone enter: game.Players.LocalPlayer.CameraMinZoomDistance = zone.CameraMinZoom. On zone exit: restore defaults (0.5, 400). Force close zoom in buildings (max 5 studs), wide zoom in boss rooms (force 15+ studs). Smooth transition: TweenService camera position lerp when limit changes.' },
      { name: 'Shoulder Camera', keywords: ['shoulder camera', 'over shoulder', 'shoulder offset', 'aim camera', 'fortnite camera'],
        how: 'Camera.CameraType=Scriptable. RenderStepped: CFrame = character.HumanoidRootPart.CFrame * CFrame.new(2,1,-6) (right shoulder). Aim mode (right click): tighten to CFrame.new(0.5,0.5,-3), FOV 55. Toggle shoulder: T key flips X offset (-2 for left). Character faces camera look direction in aim mode. Crosshair ImageLabel shows in aim mode. Return to default CameraType on disable.' },
      { name: 'Split Screen', keywords: ['split screen', 'local multiplayer camera', 'two player screen', 'shared screen', 'coop camera'],
        how: 'Two ViewportFrames: left (Position UDim2(0,0,0,0) Size UDim2(0.5,0,1,0)) and right (Position UDim2(0.5,0,0,0) Size UDim2(0.5,0,1,0)). Each ViewportFrame has WorldModel with character clone. Camera in each ViewportFrame follows respective player. Requires LocalMultiplayer context or two controllers. Vertical divider line Frame. Each player has own HUD positioned in their half.' },
    ],
  },

  // ════════════════════════════════════════════════════════════════════
  // MOBILE & INPUT
  // ════════════════════════════════════════════════════════════════════
  {
    name: 'Mobile & Input',
    systems: [
      { name: 'Virtual Joystick', keywords: ['virtual joystick', 'mobile joystick', 'on screen joystick', 'touch joystick', 'virtual stick'],
        how: 'ScreenGui: outer circle Frame (fixed position bottom-left). Inner circle Frame starts at center. InputBegan on outer → start tracking. InputChanged: inner Frame position = clamp(offset, outerRadius). Normalized direction = (innerPos - outerCenter).Unit. Feed to Humanoid MoveDirection via ContextActionService or direct WalkDirection. InputEnded: inner snaps back to center, movement stops.' },
      { name: 'Mobile Action Buttons', keywords: ['mobile buttons', 'touch buttons', 'action buttons mobile', 'ability buttons mobile', 'tap buttons'],
        how: 'ScreenGui bottom-right. ImageButton grid (2x2 or radial). Each button: action name label + cooldown overlay Frame (dark, clips from bottom). On tap: fire RemoteEvent for action. Cooldown: TweenService overlay from full height to 0. Tap feedback: brief scale animation (0.9→1). Auto-layout adapts to platform check (UserInputService.TouchEnabled). Haptic feedback via HapticService.' },
      { name: 'Swipe Detection', keywords: ['swipe', 'swipe gesture', 'swipe direction', 'touch swipe', 'gesture swipe'],
        how: 'InputBegan (Touch type): record start position + time. InputEnded: delta = endPos - startPos. If magnitude > 50px AND time < 0.3s: swipe detected. Direction: math.atan2(delta.Y, delta.X) → 4 or 8 directional bucketing. Actions: swipe left=dodge left, swipe right=dodge right, swipe up=jump, swipe down=crouch. Visualize with brief arrow indicator.' },
      { name: 'Pinch Zoom', keywords: ['pinch zoom', 'pinch gesture', 'two finger zoom', 'mobile zoom', 'touch zoom'],
        how: 'Track two simultaneous touches (InputBegan per touch, table indexed by UserInputState). InputChanged: calculate distance between two touch positions. Scale change: currentDist/prevDist → multiply camera zoom offset. TweenService smooth zoom via CameraMinZoomDistance adjustment. Pinch in = zoom in (min 2 studs), pinch out = zoom out (max 20). Reset on either finger released.' },
      { name: 'Long Press', keywords: ['long press', 'hold tap', 'press hold', 'tap hold', 'sustained tap'],
        how: 'InputBegan (Touch on element): start task.delay(0.5, callback). InputEnded before 0.5s: cancel delay (task.cancel). On 0.5s completion: trigger long-press action (open context menu, show details). Visual feedback: ring progress animation around tap point (Frame circle fills over 0.5s). Haptic pulse at 0.3s (HapticService). Different from click (which fires on InputEnded < 0.5s).' },
      { name: 'Double Tap', keywords: ['double tap', 'double click', 'tap twice', 'double touch'],
        how: 'Track lastTapTime per input target. InputBegan: if os.clock()-lastTapTime < 0.3 → double tap action. Else: single tap (delayed 0.3s to check for double). Cancel single if double detected. Double tap on joystick: sprint toggle. Double tap on ability button: cancel. Double tap on ground: ping location. Feedback: ripple animation at tap point.' },
      { name: 'Context Menu', keywords: ['context menu', 'long press menu', 'radial context', 'touch context menu', 'right click menu'],
        how: 'Long press on object (0.5s hold). Radial menu appears at touch position with 4-8 options: Inspect, Pick Up, Attack, Interact, Trade. Option icons around center circle. Slide finger to option, release to activate. Dismiss: tap elsewhere or swipe away. PC: right-click on object. Options contextual to object type (enemy = Attack/Run, item = Pick Up/Inspect).' },
      { name: 'Haptic Feedback', keywords: ['haptic', 'vibration', 'controller vibrate', 'rumble', 'haptic feedback'],
        how: 'HapticService:SetMotor(player, UserInputType.Gamepad1, VibrationMotor.Large, intensity). Patterns: hit=short strong pulse (0.8, 0.1s), damage=medium (0.5, 0.2s), pickup=gentle tap (0.3, 0.05s), explosion=long rumble (1.0, 0.5s). Use ContextActionService to detect gamepad connected. task.delay to stop vibration. Mobile: limited haptic via platform APIs (limited support in Roblox).' },
      { name: 'Adaptive UI', keywords: ['adaptive ui', 'responsive ui', 'platform detection', 'mobile ui', 'desktop ui'],
        how: 'LocalScript on StarterGui: check UserInputService.TouchEnabled/GamepadEnabled/KeyboardEnabled. Mobile: larger buttons (UDim2 size *1.4), virtual joystick visible, action buttons grid bottom-right, simplified HUD. Desktop: standard button sizes, keyboard shortcut labels, minimap larger. Gamepad: highlight focus system (SelectionImageObject), D-pad navigation between GuiObjects. Dynamic AnchorPoint and Position adjustments.' },
      { name: 'Gyroscope Aim', keywords: ['gyroscope', 'tilt aim', 'motion aim', 'gyro aim', 'tilt control'],
        how: 'UserInputService:GetDeviceRotation() for mobile tilt data. On aim mode activate: track rotation delta each frame. Map tilt pitch/yaw to camera offset (sensitivity configurable). Deadzone: small tilt ignored. Sensitivity slider in settings. Combine with virtual joystick for movement. Reset calibration on button press (zero out current rotation as reference). Only active on mobile (platform check).' },
    ],
  },

  // ════════════════════════════════════════════════════════════════════
  // BUILDING & SANDBOX ADVANCED
  // ════════════════════════════════════════════════════════════════════
  {
    name: 'Building & Sandbox Advanced',
    systems: [
      { name: 'Free Build Mode', keywords: ['free build', 'sandbox build', 'build mode', 'creative mode', 'build system'],
        how: 'Toggle build mode button. Ghost preview Part follows Mouse.Hit, snapped to grid (2/4/8 stud options via R key cycle). Left click: place Part. Right click: delete targeted Part. Part palette: ScreenGui ScrollingFrame of Part sizes + materials. Rotation: hold alt + scroll or Q/E keys for 15/45/90 degree increments. Undo/redo stack. Server validates placement inside owned plot before confirming.' },
      { name: 'Terrain Editor Tool', keywords: ['terrain editor', 'terrain tool', 'terrain sculpt', 'raise lower terrain', 'paint terrain'],
        how: 'Tool with terrain editing modes: Raise, Lower, Smooth, Flatten, Paint. Brush: sphere radius 4-20 studs (scroll to adjust). Raycast to terrain hit point. Raise: workspace.Terrain:FillBall(pos, radius, material). Lower: ReplaceMaterial with Air. Smooth: average heights in region. Paint: ReplaceMaterial to selected material. Flatten: WriteVoxels at constant Y. Undo: store voxel snapshot before each stroke.' },
      { name: 'Furniture Placement', keywords: ['furniture', 'place furniture', 'home furniture', 'room design', 'furniture system'],
        how: 'Catalog ScreenGui: categories (Seating, Tables, Decor, Lighting). Click item: ghost preview follows mouse. Wall-snap detection: Raycast from item sides, if wall within 0.5 studs → snap to wall CFrame. Floor-snap: Raycast down, align Y to floor. Rotate 90° with R. Place with click. Furniture has {Name, Size, WallMountable, Cost} config. Max items per plot (100). View neighbor houses for inspiration.' },
      { name: 'Wiring System', keywords: ['wiring', 'logic gates', 'wire connect', 'signal wire', 'redstone'],
        how: 'Wire Tool: click source Part (e.g. button), then target Part (e.g. door). Server creates signal connection table {source, target, logic}. Source fires signal (BoolValue "Signal" changes). Logic gates: AND (both inputs true), OR (either true), NOT (inverts). Beam visual between connected parts. Target receives signal and triggers action. Delete wire: wire tool + right click connection.' },
      { name: 'Paint Tool Advanced', keywords: ['paint tool', 'paint part', 'color part', 'spray paint', 'fill paint'],
        how: 'Tool modes: Single (click one Part), Fill (all connected same-material Parts BFS algorithm), Gradient (two colors across selection), Pattern. Color palette: 24 swatches + custom Color3Picker. Raycast for target Part. Single: change Part.Color. Fill: BFS neighbors sharing same color. Gradient: sort by axis, lerp color. Undo: store {Part, previousColor} table, Ctrl+Z restore.' },
      { name: 'Clone Tool', keywords: ['clone tool', 'copy paste', 'duplicate place', 'stamp tool', 'place copy'],
        how: 'Select mode: click Part or drag box to multi-select. Clone mode: selected Parts cloned as ghost group following mouse. Maintain relative positions. Click to stamp (place copies). Retain all Part properties (Color, Material, Size, Attributes). R key rotates entire group. Flip with F key. Server validates each placement. Group saved as "Stamp" for reuse in session.' },
      { name: 'Resize Tool', keywords: ['resize tool', 'scale tool', 'resize part', 'adjust size', 'drag resize'],
        how: 'Select Part → show 6 handle arrows (one per face: +X/-X +Y/-Y +Z/-Z). Drag handle: move in axis direction, Part.Size increases/decreases on that axis. Maintain pivot (opposite face stays fixed). Minimum size 0.2 studs. Snap to 0.5 stud increments (shift for finer 0.1). Update ghost preview. Confirm on release. Server validates final size is valid. Show size dimensions in TextLabel.' },
      { name: 'Save Build', keywords: ['save build', 'save creation', 'save map', 'save structure', 'build save'],
        how: 'Iterate all Parts in player plot. For each: serialize {Name, Position, Size, CFrame, Color, Material, Transparency, CanCollide, Attributes}. HttpService:JSONEncode table. DataStore:SetAsync("build_{userId}_{slot}", json). Multiple slots (5 saves). Save indicator UI. Load: decode JSON, recreate each Part with stored properties (Instance.new, apply all props). Delete unused Parts first.' },
      { name: 'Share Build Code', keywords: ['share build', 'build code', 'share creation', 'copy build', 'build share'],
        how: 'Generate shareable code: encode serialized build JSON as base64 or short hash ID. Store under public DataStore key "shared_{id}" with expiry. Copy code to clipboard (SetClipboard via rbxInternalPlugin if available, else display in TextBox for manual copy). Import: TextBox input field, fetch from DataStore by ID, deserialize and load onto player plot. Rate limit: 3 shares per day per player.' },
      { name: 'Blueprint Preview', keywords: ['blueprint', 'build preview', 'ghost build', 'preview build', 'hologram build'],
        how: 'Before placing: show all Parts in build as transparent blue ghosts (Transparency 0.7, blue tint ColorCorrectionEffect on each Part). Confirm button materializes (Transparency to 0, remove tint). Cancel removes ghosts. Check placement validity: Raycast each ghost Part, if overlap with non-owned Part → tint red (invalid). Parts that overlap owner plot boundary also red. "X invalid, Y valid" counter in UI.' },
    ],
  },

  // ════════════════════════════════════════════════════════════════════
  // SCORING & COMPETITION
  // ════════════════════════════════════════════════════════════════════
  {
    name: 'Scoring & Competition',
    systems: [
      { name: 'Point System', keywords: ['points', 'score points', 'earn points', 'point system', 'score system'],
        how: 'IntValue "Points" in leaderstats. Award on actions: kills +100, assists +50, objectives +200, special feats +500. Bonus multipliers (2x weekends, 1.5x streaks). Real-time leaderboard sidebar updates via RemoteEvent. Session points vs total points (separate IntValues). End of round: show points breakdown screen with individual action contributions. Top scorer announcement.' },
      { name: 'Kill/Death Ratio', keywords: ['kd ratio', 'kdr', 'kill death', 'kills deaths', 'stats tracker'],
        how: 'IntValues "Kills" and "Deaths" per player (session + all-time in DataStore). KDR = Kills/math.max(Deaths,1) formatted to 2 decimal places. Tab scoreboard: columns for Name, Kills, Deaths, KDR, Assists. Sort by KDR or Kills. Reset session on round end, cumulative saves to DataStore. Milestone badges at 1.0, 2.0, 5.0 KDR. Career stats screen shows progression over time.' },
      { name: 'MVP System', keywords: ['mvp', 'most valuable player', 'player of the round', 'best player', 'mvp award'],
        how: 'Track score/performance metrics each round. On round end: server determines MVP (highest combined score). RemoteEvent "MVPAward": zoom camera on MVP player (Scriptable camera), golden ParticleEmitter burst, "MVP" TextLabel overlay center screen. MVP name announced in chat. MVP earns +2x reward coins. Highlight MVP in results screen with star icon. Previous round MVP badge in BillboardGui.' },
      { name: 'Kill Streak System', keywords: ['kill streak', 'streak bonus', 'consecutive kills', 'streak reward', 'death streak'],
        how: 'IntValue "KillStreak" per player. Increment on kill, reset on death. Streak milestones trigger rewards/announcements: 3 kills="Killing Spree" +50 coins, 5="Rampage" ability unlock 30s, 10="Unstoppable" reward + server announcement, 20="Godlike" all effects + permanent round. UI: streak counter HUD with fire effect at high streaks. Enemy killed by high-streak player: bonus XP for killer.' },
      { name: 'Bounty System', keywords: ['bounty', 'bounty hunter', 'target player', 'bounty reward', 'marked player'],
        how: 'Player with highest kill streak gets "Bounty" BoolValue=true. BillboardGui skull icon above bounty player visible to all. Marker on minimap. Bounty = last kill streak count * 100 coins. Killing bounty: claim reward, inherit half their streak, bounty announcement. New bounty if someone surpasses. Multiple bounties possible (top 3 streaks). Bounty resets on death regardless.' },
      { name: 'Accuracy Tracking', keywords: ['accuracy', 'aim accuracy', 'shots fired', 'hit rate', 'aim stats'],
        how: 'IntValues "ShotsFired" and "ShotsHit" per player. Increment fired on attack, hit on confirmed hit. Accuracy = ShotsHit/math.max(ShotsFired,1)*100. Display in stats panel. Accuracy bonuses: >80% accuracy = +5% damage. Accuracy leaderboard end of round. Career stats: lifetime accuracy. Heat-map of shots missed vs hit. Accuracy mastery awards special crosshair cosmetics.' },
      { name: 'Time Attack', keywords: ['time attack', 'speed challenge', 'fastest time', 'race time', 'challenge timer'],
        how: 'Challenge: complete sequence (collect items, touch checkpoints) as fast as possible. Timer: tick() start on first input. Format: mm:ss.ms. Best time: DataStore per player, OrderedDataStore for global leaderboard. Ghost of best time (CFrame recording 0.05s intervals, played back on challenge start). Medal tiers: Gold/Silver/Bronze based on thresholds. Personal best indicator on HUD.' },
      { name: 'Score Multiplier', keywords: ['score multiplier', 'combo score', 'multiplier score', 'x2 score', 'point multiplier'],
        how: 'NumberValue "ScoreMultiplier" (1x base). Combo actions within 5s increase multiplier: 2x→3x→4x (capped). Decay: no action for 5s → decrease by 1x step. Actions that build multiplier: kills, captures, assists, skill shots. Display: large multiplier TextLabel center-top with color (white→yellow→orange→red). Sound pitch increases with multiplier. Score grandiosity scales: explosion particles on high-mult actions.' },
      { name: 'Elo/Ranked System', keywords: ['elo', 'ranked', 'skill rating', 'competitive', 'matchmaking rating', 'rank system'],
        how: 'IntValue "Elo" (default 1000). Win vs higher Elo: +32. Win vs lower: +16. Loss vs higher: -8. Loss vs lower: -24. K-factor halves after 30 games (more stable). OrderedDataStore for ranked leaderboard. Rank tiers: Bronze(<1200), Silver(1200-1500), Gold(1500-1800), Platinum(1800-2100), Diamond(2100-2400), Master(2400+). Rank icon BillboardGui. Placement matches: first 10 = calibration.' },
      { name: 'Seasonal Rankings', keywords: ['season rank', 'seasonal leaderboard', 'ranked season', 'competitive season', 'season reset'],
        how: 'Season = 30-day period. Separate IntValue "SeasonElo" resets each season (starts at 800 for all). Placement matches 5 per season. Season end: archive results to OrderedDataStore "season_{N}", grant cosmetic rewards by rank tier achieved, announce top 10 players. Season pass progress resets. New season announcement 48h before. Season N number tracked in DataStore global config.' },
      { name: 'Competitive Match History', keywords: ['match history', 'game history', 'past matches', 'match record', 'performance history'],
        how: 'DataStore stores last 20 matches per player: {date, result, score, kills, deaths, map, duration}. ScreenGui "Match History" tab: ScrollingFrame with match entries. Click match: expand detail panel showing round timeline (events logged), final scoreboard screenshot (captured via ScreenshotHud or reconstructed from data), replay option if CFrame recording stored. Win/loss color coding.' },
    ],
  },

  // ════════════════════════════════════════════════════════════════════
  // ADVANCED MECHANICS & SYSTEMS
  // ════════════════════════════════════════════════════════════════════
  {
    name: 'Advanced Mechanics',
    systems: [
      { name: 'Inventory Weight System', keywords: ['inventory weight', 'carry weight', 'encumbrance', 'weight limit', 'item weight'],
        how: 'Each item has WeightValue attribute. Player NumberValue "CarryWeight" sums all equipped+carried item weights. Max weight (100 base, increases with Strength stat). At 80%: WalkSpeed -10%. At 100%: cannot pick up more, movement heavily penalized. HUD weight bar: green→yellow→red. Drop heaviest item prompt when over limit. Bag/backpack items increase max weight.' },
      { name: 'Durability System', keywords: ['durability', 'item durability', 'weapon durability', 'break item', 'repair item'],
        how: 'IntValue "Durability" on each item (max 100). Decreases on use (weapon: -1/hit, armor: -1/10 damage taken). At 50%: yellow warning in HUD. At 20%: red + screen edge warning. At 0%: item breaks (BoolValue "Broken"=true), equipment slot disabled. Repair: Blacksmith NPC or repair kit item (restore full durability). Visual degradation: Part transparency increases as durability falls.' },
      { name: 'Hunger/Thirst System', keywords: ['hunger', 'thirst', 'food system', 'hunger meter', 'survival hunger'],
        how: 'NumberValues "Hunger" and "Thirst" (100 each). Hunger -1/2min, Thirst -1/min. Below 50: WalkSpeed -5. Below 20: health regen stops. Below 5: -1HP/5s. Eating food: +N Hunger. Drinking: +N Thirst. HUD bars with fork/droplet icons. Sources: food items, water wells (ProximityPrompt), rivers (Touched). Boost foods overfill to 120 temporarily.' },
      { name: 'Temperature System', keywords: ['temperature', 'cold', 'heat', 'body temperature', 'weather temperature'],
        how: 'NumberValue "Temperature" (37=normal, range 0-45). Cold zones: -0.5/s. Hot zones: +0.5/s. Normal zones drift toward 37. Below 30: WalkSpeed -10, blue ColorCorrectionEffect. Above 40: health drains, red tint. Clothing items modify tolerance. Fire sources warm nearby players (+0.3/s in 10 stud radius).' },
      { name: 'Stealth Detection Meter', keywords: ['detection meter', 'alert level', 'stealth level', 'suspicion meter', 'noise meter'],
        how: 'Guard NPCs have "AlertLevel" 0-100. Player noise: walking metal=+5/s, running=+15/s, crouching=0. Visual cone: Raycast from guard eyes. AlertLevel 0-30: unaware. 30-60: suspicious (guard looks around). 60-80: alert (investigates). 80-100: combat. Decay out of sight: -5/s. Multiple guards share AlertLevel via table.' },
      { name: 'Day-Based Events', keywords: ['day event', 'daily event', 'rotating event', 'calendar event', 'weekday event'],
        how: 'os.date("*t").wday (1=Sun, 7=Sat). Event schedule: {[2]="Monday2xXP", [7]="SaturdayBossRaid"}. Hourly check: apply current day event. Banner ScreenGui shows active event. Admin override via chat command. Events: 2x XP days, tournament openings, boss raids, drop parties. Announce 30s before via RemoteEvent.' },
      { name: 'Territory Control', keywords: ['territory', 'capture point', 'capture zone', 'control point', 'territory control'],
        how: 'Capture zone Part with IntValue "CaptureProgress" (0-100) and StringValue "Owner". Players in zone (GetPartBoundsInBox count): progress +5/s per player advantage. Contesting: no progress. At 100: zone captured. Captured zones grant team bonus spawns/resources. Domination win: hold all zones 60s. HUD shows zone status.' },
      { name: 'Knockback Physics', keywords: ['knockback physics', 'hit reaction', 'stagger', 'physics knockback', 'impact physics'],
        how: 'On hit: direction = (victim.Position - attacker.Position).Unit. Apply AssemblyLinearVelocity to HumanoidRootPart: force = direction * damage * 0.5. Duration: force applied 0.15s. Stagger animation plays. Air knockback: higher if target airborne. Wall collision: bonus impact damage + bounce back. Mass affects: heavier characters knocked back less (multiply by 1/mass factor).' },
      { name: 'Loot Rarity Roll', keywords: ['loot roll', 'rarity roll', 'drop chance', 'random loot', 'loot rng'],
        how: 'WeightedRandom: table {item, weight}. Sum all weights. Roll math.random(1, total). Iterate: subtract weights until 0. Luck modifier: multiply rare item weights by Luck value. Pity system: if N rolls without Legendary, guarantee next (DataStore tracks pity counter). Display probabilities in codex. Server-side RNG only.' },
      { name: 'Zone Transition Effects', keywords: ['zone transition', 'area transition', 'map transition', 'region change', 'zone loading'],
        how: 'Transition Part Touched: fade screen to black (Frame Transparency 1→0 over 0.5s). Server teleports to new zone spawn. ContentProvider:PreloadAsync. Fade back in. Zone name TextLabel floats in from bottom, lingers 2s, fades. Play zone ambient music crossfade. BoolValue "Transitioning" prevents double-teleport. Zone metadata: {name, music, ambience, fog, lighting}.' },
      { name: 'Procedural Quest Generator', keywords: ['procedural quest', 'random quest', 'generated quest', 'dynamic quest', 'auto quest'],
        how: 'Templates: kill_{enemy}_x{N}, collect_{item}_x{N}, reach_{location}, escort_{npc}. Fill with random params from available types. Generate 3 daily via date-seeded math.random. Difficulty scales: easy(N=3-5), medium(N=5-10), hard(N=10-20). Rewards scale with difficulty. Unique titles from adjective+noun combos. DataStore stores generated params for tracking.' },
      { name: 'Object Pooling', keywords: ['object pool', 'part pool', 'performance pool', 'recycle parts', 'pool system'],
        how: 'Pre-spawn N Parts in ServerStorage. Pool tables: {available=[], inUse=[]}. GetFromPool(): pop available, configure, parent to workspace. ReturnToPool(): reset, parent back to ServerStorage. Apply to: bullets, damage numbers, enemy models, particle hosts. Auto-expand pool if empty. Prevents constant Instance.new/Destroy GC pressure.' },
      { name: 'Challenge Mode', keywords: ['challenge mode', 'hard mode', 'modifier challenge', 'game modifier', 'challenge run'],
        how: 'Opt-in challenge modes before entering game: OneHit(die in 1 hit), NoHeal(no healing items), SpeedRun(timer), Blindfolded(reduced visibility via BlurEffect), Pacifist(no kills). Modifiers stack: OneHit+SpeedRun = extra hard. Each completion awards challenge-specific badge/cosmetic. DataStore tracks which modifiers cleared. Leaderboard per modifier combination.' },
      { name: 'Event Feed System', keywords: ['event feed', 'game log', 'action log', 'combat log', 'activity feed'],
        how: 'ScreenGui corner: scrolling TextLabel list (UIListLayout). RemoteEvent "LogEvent" from server: {text, color, icon}. Messages: kills, captures, item found, level up, boss spawn. Auto-expire after 8s (TweenService fade + Destroy). Max 8 entries visible. Pause on hover (mouse over feed). Color-coded: red=combat, gold=achievement, blue=system, green=item. Click entry to pan camera to event location.' },
      { name: 'Crafting Blueprint System', keywords: ['craft blueprint', 'recipe book', 'discover recipe', 'recipe discovery', 'craft recipe'],
        how: 'Recipes: unknown until discovered. Discovery: combine items that match recipe accidentally ("You discovered: Iron Sword!"). DataStore "knownRecipes_{userId}" set. Recipe book ScreenGui: known recipes in color, undiscovered as "???". Hint system: after 5 failed crafting attempts, show partial hint (first ingredient). Master crafter achievement: know all recipes. Recipe sharing: send hint to guild members.' },
    ],
  },

  // ════════════════════════════════════════════════════════════════════
  // FARMING & SIMULATION
  // ════════════════════════════════════════════════════════════════════
  {
    name: 'Farming & Simulation',
    systems: [
      { name: 'Crop Growth Stages', keywords: ['crop stage', 'plant stage', 'grow stage', 'plant growth', 'seed sprout'],
        how: 'Crop has 5 stages: Seed, Sprout, Sapling, Mature, Harvest-Ready. DataStore timer per crop (os.time() + stageDuration). Check on Heartbeat or join. Visual: swap Model per stage (scale + color TweenService). Stage config: {duration=300, modelName="Wheat_Stage2"}. Water requirement: if unwatered, timer pauses. Fertilizer halves growth time (halve remaining duration).' },
      { name: 'Animal System', keywords: ['animal', 'animal farm', 'livestock', 'chicken', 'cow farm', 'pet animal'],
        how: 'Animal Models wander within pen boundary (magnitude check from center). Produce on timer: DataStore tracks lastProduce. Collect via ProximityPrompt (chicken→egg, cow→milk). Feed: food item Touched by animal → happy animation + halve produce timer. Animals die if unfed 24h. Breed: two fed adults near each other → baby spawns after 300s. Baby grows to adult after 600s.' },
      { name: 'Water/Irrigation System', keywords: ['irrigation', 'watering', 'water crops', 'watering can', 'sprinkler'],
        how: 'Watering can Tool (capacity 10 units, refill at well ProximityPrompt 3s). Activate on crop: decrement water count, set BoolValue "Watered"=true. Unwatered crops pause growth timer. Sprinkler: Part that auto-waters crops within 15 studs every 120s (needs power generator). Rain weather event: auto-waters all outdoor crops. Drip irrigation upgrade: slower but perpetual water.' },
      { name: 'Market Price Display', keywords: ['price display', 'market board', 'price board', 'item prices', 'sell prices'],
        how: 'SurfaceGui on board Part. Rows: item icon + name + current price + change arrow (up=green, down=red). Prices from server ModuleScript, update every 5min with random walk. Best sell time indicator (lowest supply = highest price). Players post buy orders at custom prices (DataStore pending orders). Price history bar chart using stacked Frames.' },
      { name: 'Greenhouse Growing', keywords: ['greenhouse', 'indoor farm', 'plant indoor', 'grow house', 'hydroponics'],
        how: 'Enclosed glass structure (SurfaceAppearance glass roof). Plants inside grow 1.5x faster (greenhouse warmth modifier). Auto-irrigation: pipe chain Parts auto-water on 120s timer. Exotic crops only growable indoors. Temperature control panel ScreenGui: adjust temp for crop type. Pest event: mites reduce yield 30% unless treated with pesticide item.' },
      { name: 'Fishing System Advanced', keywords: ['fishing rod', 'fish type', 'fish rarity', 'fishing spot', 'bait fishing'],
        how: 'Fishing zones: Part regions with different fish tables ({freshwater}, {ocean}, {lava}). Bait type modifies fish probabilities. Rod tier: Basic/Pro/Master affects catch speed and rare chance. Cast: Raycast to water. Bobber physics: sphere with BodyVelocity lands in water. Random bite time 3-15s (bait reduces min). Reel timing: QTE window 0.5s. Miss = lose bait. Catch shown in BillboardGui.' },
      { name: 'Orchard System', keywords: ['orchard', 'fruit tree', 'tree harvest', 'apple tree', 'tree fruit'],
        how: 'Tree Models with fruit Parts hanging from branches (spawn after 600s timer). Harvest via Tool swing or ClickDetector. Season cycle: spring=blossom (particle flowers), summer=fruit grows, fall=harvest ends, winter=bare. Grafting: interact two different tree types = hybrid fruit tree (unique item). Fallen fruit (uncollected 300s): Debris. Tree HP: chop with axe for wood + destroy tree.' },
    ],
  },

  // ════════════════════════════════════════════════════════════════════
  // PUZZLES & EXPLORATION
  // ════════════════════════════════════════════════════════════════════
  {
    name: 'Puzzles & Exploration',
    systems: [
      { name: 'Switch Puzzle', keywords: ['switch puzzle', 'lever puzzle', 'button puzzle', 'sequence puzzle', 'pressure puzzle'],
        how: 'N levers/buttons with BoolValue "State". Some puzzles: all must be ON. Some: specific sequence (track clickOrder array). Some: one switch affects others (toggle neighbors). Solution check function called on each switch flip. Success: door opens, reward spawns, particle burst. Failure: wrong sequence = reset all after 2s delay. Hint system: NPC gives clue if failed 3 times.' },
      { name: 'Maze Generation', keywords: ['maze', 'labyrinth', 'maze generation', 'random maze', 'procedural maze'],
        how: 'Grid of cells (each has 4 walls). Recursive backtracker algorithm: mark cell visited, randomly visit unvisited neighbors, remove shared wall. Server generates on round start (seed stored). Render: Parts as walls (anchored). Path illuminated by PointLights every 10 cells. Minimap reveals as player explores (fog of war squares removed). Exit: reaching end cell with prize chest.' },
      { name: 'Lock and Key', keywords: ['lock', 'key', 'locked door', 'key item', 'unlock door'],
        how: 'Door Part BoolValue "Locked"=true. Key: Item in inventory with StringValue "KeyId" matching door attribute "RequiredKey". On ProximityPrompt "Unlock": server checks player has key, if yes: Locked=false, door opens (TweenService), key consumed from inventory. Key types: Master Key opens all, colored keys per zone. Key drops from specific enemies/chests.' },
      { name: 'Pressure Plate Puzzle', keywords: ['pressure plate', 'weight puzzle', 'plate puzzle', 'block puzzle', 'push block'],
        how: 'Pressure plate Parts: Touched by any Part/character → BoolValue "Pressed"=true. TouchEnded resets if no parts touching (use GetTouchingParts to verify empty). Linked actions: door open, platform rise, fire trap disable. Puzzle: need multiple plates pressed simultaneously (use coroutine checks). Heavy object: spawn pushable Part (Anchored=false) that can hold plate. Reset: puzzle fails if any plate unpressed.' },
      { name: 'Password/Code Input', keywords: ['code puzzle', 'password puzzle', 'combination lock', 'number code', 'cipher'],
        how: 'SurfaceGui keypad on Part: 10 TextButtons (0-9) + Enter. LocalScript tracks input string. On Enter: RemoteEvent "SubmitCode" sends to server. Server checks against stored answer (never store on client). Correct: door opens, reward granted. Wrong: error sound, display "WRONG - N attempts left". Lockout after 3 fails for 30s. Admin can change codes via DataStore.' },
      { name: 'Mirror Puzzle', keywords: ['mirror puzzle', 'light beam', 'laser puzzle', 'reflect beam', 'laser mirror'],
        how: 'Laser source Part emits Beam in forward direction. Raycast along beam: if hits Mirror Part, calculate reflection (Vector3.reflect using mirror normal). Create new Beam segment in reflected direction. Chain reflections up to 5 bounces. Target Part: if beam reaches it, activate (door opens). Rotate mirrors: ClickDetector rotates Part 45° each click. BoolValue "Locked" on mirrors in combat zones.' },
      { name: 'Sliding Block Puzzle', keywords: ['sliding puzzle', 'slide puzzle', 'block slide', 'tile puzzle', 'sokoban'],
        how: 'Grid of Part slots. Some slots occupied by movable blocks. Click block + direction arrow: if path clear in that direction, TweenService slides block to edge. Goal: push all colored blocks onto matching colored target squares. State encoded as string for win detection. Undo: store move history, reverse on button. Shuffle: reset on "Restart". Multiple difficulty levels.' },
      { name: 'Timed Mechanism', keywords: ['timed mechanism', 'timer puzzle', 'timer door', 'countdown door', 'time limited'],
        how: 'Mechanism (door, platform) activates for N seconds after trigger. Activation: button press, enemy kill, item use. Timer shown: BillboardGui countdown above mechanism. Audio: ticking sound accelerates as timer expires. Must reach destination before close. Speedrun challenge: shortest time to complete chain of timed mechanisms. Cooperative: multiple players must press buttons simultaneously.' },
      { name: 'Invisible Path', keywords: ['invisible path', 'hidden path', 'reveal path', 'secret path', 'invisible bridge'],
        how: 'Path Parts: Transparency=1, CanCollide=true (invisible but solid). Reveal mechanic: special item (torch, goggles) makes them semi-visible (Transparency 0.6) to player via LocalScript. Or: Touched reveals segment temporarily (Transparency 1→0.3 for 5s, then fade back). Wrong step: step off path = fall into void. Audio clue: faint chime from correct path direction.' },
      { name: 'Symbol/Rune Puzzle', keywords: ['symbol puzzle', 'rune puzzle', 'glyph puzzle', 'symbol match', 'memory puzzle'],
        how: 'N symbols displayed briefly (2s) then hidden. Player must activate them in shown order. Symbols: ImageButton floor tiles with icon texture. Correct order: bright flash + sound. Wrong: all reset + rumble + try again. Difficulty scales: 3→5→7→9 symbols. DataStore tracks puzzle completion for one-time reward. Symbols cycle each server reset (seeded random new order).' },
      { name: 'Water Level Puzzle', keywords: ['water level', 'flood puzzle', 'water rise', 'drain water', 'water gate'],
        how: 'Room with rising water: Terrain.Water or transparent Part ascending (TweenService Y position). Activate pump (ProximityPrompt) to drain: TweenService water level down. Timer: water rises 1 stud/s. Player must activate all valves before drowning. Platforms at different heights. Objects float on water (BodyBuoyancy or manual BodyForce). Exit unlocks when water drained.' },
      { name: 'Boss Door Lock', keywords: ['boss door', 'key boss', 'sealed door', 'boss entrance', 'locked boss room'],
        how: 'Large ornate door Part (Transparency 0, CanCollide=true). BoolValue "Sealed". Requirements: N monsters killed (IntValue), specific item held, puzzle solved. Progress bar BillboardGui on door shows completion. On all requirements met: dramatic unlock sequence (glow, shake, sound), door Transparency→1 CanCollide=false. Point of no return: once entered, no leaving until boss defeated.' },
      { name: 'Exploration Map Reveal', keywords: ['map reveal', 'fog of war', 'explore map', 'discovered map', 'map visibility'],
        how: 'World divided into N grid cells. DataStore "explored_{userId}" stores Set of cell IDs visited. World map ScreenGui: covered cells shown as dark overlay Frame. On cell enter (Heartbeat position check): add cell ID to set, remove overlay Frame (TweenService fade). Percentage explored shown. Full exploration reward. Share explored map with guild (merge sets). Minimap also uses same system.' },
      { name: 'Collectible Tokens', keywords: ['collectible', 'collect token', 'star collect', 'coin collect', 'collect all'],
        how: 'N tokens placed around map (Parts with rotating animation via CFrame each Heartbeat + BillboardGui glow). Touched: remove Part, add to DataStore "collected_{userId}" set, increment counter. HUD shows N/Total collected. Area completion: all tokens in zone collected = bonus chest spawns. Server tracks collection (Destroy on collect, no respawn). New area unlocks at collection milestones.' },
    ],
  },

  // ════════════════════════════════════════════════════════════════════
  // ADMIN & MODERATION
  // ════════════════════════════════════════════════════════════════════
  {
    name: 'Admin & Moderation',
    systems: [
      { name: 'Admin Panel GUI', keywords: ['admin panel', 'admin gui', 'mod panel', 'admin ui', 'admin dashboard'],
        how: 'ScreenGui only for admins (check userId against admin list or group rank). Tabs: Players, Economy, World, Logs. Players tab: list all online players with Kick/Ban/Mute/Teleport/Give buttons. Economy: adjust global multipliers, reset economies. World: toggle events, change time, weather. Logs: recent admin actions. RemoteFunction for each action (double server-side verify).' },
      { name: 'Mute System', keywords: ['mute', 'mute player', 'silence player', 'chat mute', 'voice mute'],
        how: 'DataStore "muted_{userId}" = {expires, reason}. On PlayerAdded: check mute, if active filter all chat messages (TextChatService:FilterStringAsync produces empty). Chat commands: !mute [player] [minutes] [reason]. Timed mute auto-expires. HUD notice to muted player ("You are muted for N minutes"). Mute log in admin panel. Perma-mute option.' },
      { name: 'Report System', keywords: ['report', 'report player', 'player report', 'abuse report', 'flag player'],
        how: 'ScreenGui "Report" via context menu (right-click player name or button). Reason dropdown: Exploiting, Harassment, Inappropriate, Other. TextBox for details. RemoteEvent: store report in DataStore "reports" with {reporter, target, reason, timestamp, serverJobId}. Auto-kick if 3 reports in 5 min (server-level threshold). Admin panel shows pending reports. Ban follow-up after review.' },
      { name: 'Chat Filter', keywords: ['chat filter', 'profanity filter', 'word filter', 'chat moderation', 'filter words'],
        how: 'TextChatService:FilterStringAsync(text, fromPlayer, filterContext). Always await result. Use filtered text for display. Custom additional filter: local banned word list, replace with "****". Rate limit: max 3 messages/5s per player. Spam detection: identical messages within 10s = mute 60s. Flood prevention: if > 5 messages/10s = temporary mute. Admin bypass flag.' },
      { name: 'Admin Teleport', keywords: ['admin teleport', 'tp player', 'teleport to', 'goto player', 'bring player'],
        how: 'Admin commands: !tp [admin] [target] (teleport admin to target), !bring [target] (bring target to admin), !goto [player] (admin goto), !tpall [location] (everyone to location). Confirmation for destructive teleports. Visual effect: TeleportVFX at both source and destination. Log all teleports with timestamp and admin name. Non-admin players cannot use these commands (server-side check).' },
      { name: 'Server Announcement', keywords: ['announcement', 'server announcement', 'broadcast message', 'admin broadcast', 'server message'],
        how: 'Admin command !announce [message]. ScreenGui top-center: large Frame with message TextLabel slides down from top (TweenService). Gold border, semi-transparent dark background. Auto-dismiss after 8s or player X button. RemoteEvent fires to all players simultaneously. Voice announcement option (TextToSpeech if enabled). Supports color codes (parse [red]text[/red] tags). Log announcements.' },
      { name: 'Whitelist System', keywords: ['whitelist', 'allowlist', 'whitelist system', 'beta access', 'exclusive access'],
        how: 'DataStore "whitelist" Set of userIds. PlayerAdded: GetAsync whitelist, if userId not in set → Kick("This game is in closed beta. Visit [link] to sign up."). Admin can add/remove via !whitelist add [userId]. Group members auto-whitelisted: Players:GetRankInGroup(groupId) >= rank. GamePass owners bypass whitelist. Waitlist: tracking interested players in separate DataStore.' },
      { name: 'Spectate Command', keywords: ['spectate command', 'admin spectate', 'observe player', 'watch player', 'follow player'],
        how: 'Admin command !spectate [player]. Camera.CameraType=Scriptable. Camera.CameraSubject = target character. Transparent mode: admin character Transparency=1 CanCollide=false. Follow: camera stays behind target. No-clip: admin passes through walls. Exit: !unspectate restores character. Target player unaware they are being watched. Shows player position, stats overlay in admin UI corner.' },
    ],
  },

  // ════════════════════════════════════════════════════════════════════
  // PERFORMANCE & OPTIMIZATION
  // ════════════════════════════════════════════════════════════════════
  {
    name: 'Performance & Optimization',
    systems: [
      { name: 'LOD System', keywords: ['lod', 'level of detail', 'distance culling', 'draw distance', 'optimize distance'],
        how: 'Level of Detail: Part groups at different detail levels. task.spawn loop every 5s: iterate all LOD models, check distance to nearest player. Distance < 50: show high detail (LOD0), 50-150: medium (LOD1), >150: hide or show low-poly placeholder (LOD2). Swap via ModelLod1/2/3 children Visible toggle. Use for: trees, buildings, decorations. Threshold configurable per model.' },
      { name: 'Chunk Loading', keywords: ['chunk loading', 'streaming parts', 'load chunks', 'world chunks', 'map streaming'],
        how: 'Divide world into 50x50 stud chunks (grid). Track player chunk position. Load chunks within 3 chunk radius (server clone from ReplicatedStorage). Unload chunks > 5 away (Destroy or move to ServerStorage). DataStore stores player-modified chunk data. Smooth loading: prioritize chunks ahead of movement direction. Streaming Enabled in Explorer settings assists with client-side streaming.' },
      { name: 'Frame Rate Monitor', keywords: ['fps monitor', 'frame rate', 'performance monitor', 'fps display', 'lag monitor'],
        how: 'LocalScript RenderStepped: track delta time, compute FPS = 1/deltaTime. Rolling average: last 60 frames. Display: ScreenGui top-right small TextLabel "FPS: 60". Color: green>50, yellow>30, red<30. Extended stats: ping (stats.Network.ServerFrameTime * 1000), memory (game:GetService("Stats").HeartbeatTimeMs). Toggle with F9 or admin only. Log FPS drops to DataStore for debugging.' },
      { name: 'Memory Management', keywords: ['memory', 'memory management', 'garbage collect', 'memory cleanup', 'memory leak'],
        how: 'Periodic cleanup: task.spawn loop every 60s. Remove orphaned Parts (no model parent, far from players). Disconnect unused RemoteEvent connections stored in array (table of {connection} with :Disconnect() on cleanup). Debris:AddItem for temporary objects with timeout. Workspace ChildAdded monitoring: alert if non-whitelisted Part added (exploit detection). Memory budget display in admin panel.' },
      { name: 'Network Throttling', keywords: ['network throttle', 'rate limit remote', 'remote throttle', 'anti exploit network', 'remote limit'],
        how: 'Per-player rate tables: {["RemoteName"] = {count=0, resetTime=0}}. On RemoteEvent fire: check count < maxPerSecond. If exceeded: ignore + log potential exploit. Reset count each second (os.clock() based). Critical remotes (purchase): additional server validation + receipt system. Debounce expensive operations: batch multiple rapid requests into single server call.' },
      { name: 'Async Loading Screen', keywords: ['async loading', 'load screen', 'content preload', 'asset loading', 'loading assets'],
        how: 'ReplicatedFirst LocalScript. ScreenGui covers screen with logo + progress bar. ContentProvider:PreloadAsync(assets_table, callback). Callback per asset: update progress = loaded/total. Assets to preload: all Sound IDs, key texture assets, critical Models. Meanwhile: game.Loaded:Wait() ensures place is loaded. Minimum display time 2s (aesthetic). Tips rotate every 3s during loading.' },
      { name: 'Anti-Exploit System', keywords: ['anti exploit', 'anti cheat', 'exploit detection', 'cheat detection', 'security check'],
        how: 'Server-side validation on all RemoteEvents (never trust client values). Speed check: if character moved > maxSpeed * dt distance since last check → teleport back + log. Damage check: if client claims hit but server raycast disagrees → ignore. DataStore sanity check: values within valid ranges before saving. Suspicious activity log: too many remote calls, impossible actions. Auto-kick after 3 violations.' },
      { name: 'Performance Benchmark', keywords: ['benchmark', 'performance test', 'stress test', 'performance benchmark', 'load test'],
        how: 'Admin command !benchmark. Spawns 50 NPCs moving simultaneously, 100 Parts with physics, 20 simultaneous TweenService tweens. Measures: server Heartbeat time, client FPS, memory usage. Run for 30s. Report: average FPS, min FPS, peak server ms, memory delta. Compare against baseline. Output to admin panel and print. Help identify which systems cause lag spikes.' },
      { name: 'DataStore Request Queue', keywords: ['datastore queue', 'request queue', 'datastore throttle', 'save queue', 'async queue'],
        how: 'All DataStore operations go through queue system. Queue: FIFO table of {key, value, operation, callback}. Process loop: dequeue one request, pcall DataStore operation, call callback with result, wait 6s (API rate limit safe). Priority queue: critical saves (PlayerRemoving) jump to front. Retry on failure up to 3 times with exponential backoff. Log all failures.' },
      { name: 'Client-Side Prediction', keywords: ['client prediction', 'movement prediction', 'lag compensation', 'input lag', 'prediction'],
        how: 'LocalScript handles immediate character response to input (no wait for server). Server corrects position if delta > threshold. For abilities: play animation immediately client-side, send RemoteEvent to server. Server validates and either confirms (no visual change) or corrects (snap to server position). Reduces perceived input lag. For hit detection: client reports hit, server raycasts to verify within tolerance window.' },
      { name: 'Adaptive Quality', keywords: ['adaptive quality', 'auto quality', 'dynamic quality', 'fps adaptive', 'quality scaling'],
        how: 'Monitor client FPS each 5s. If FPS < 30 for 10s: reduce Lighting.GlobalShadows=false, reduce ParticleEmitter Rate by 50%, reduce MaxActiveSounds. If FPS < 20: set workspace.StreamingEnabled further limits, hide distant decorative Parts. Recovery: if FPS > 50 for 30s: restore settings incrementally. Player can override in settings. Notify: "Performance mode enabled" toast.' },
      { name: 'Server Health Monitor', keywords: ['server health', 'server monitor', 'heartbeat monitor', 'server lag', 'server performance'],
        how: 'task.spawn loop on server: every 5s log game:GetService("Stats").HeartbeatTimeMs. If Heartbeat > 33ms (below 30fps): log warning, reduce non-critical task frequencies. Alert admin via MessagingService if server health critically low. Track player count vs performance: plot N players → Heartbeat ms to find capacity limits. Auto-restart server at max age (86400s) via TeleportService.' },
      { name: 'Remote Event Manager', keywords: ['remote manager', 'event manager', 'remote events', 'event system', 'signal system'],
        how: 'ModuleScript "RemoteManager": single folder of RemoteEvents/Functions in ReplicatedStorage. GetEvent(name): creates if missing, returns event. All remotes accessed through this module (no scattered Instance.new). Middleware: wrap all OnServerEvent with logging, rate limiting, validation. Client module mirrors with :FireServer wrappers. Simplifies adding new events and centralizes security.' },
      { name: 'State Machine', keywords: ['state machine', 'game state', 'fsm', 'finite state', 'state manager'],
        how: 'ModuleScript StateMachine: {states={}, current="idle", transitions={}}. AddState(name, {onEnter, onExit, onUpdate}). AddTransition(from, to, condition). Update each Heartbeat: check conditions, fire transitions. States: idle, combat, stunned, dead, cutscene. Enter/Exit callbacks handle animation changes, speed adjustments. Used for character behavior, game phases, NPC AI. Prevents invalid state combinations.' },
      { name: 'Signal/Event Bus', keywords: ['signal', 'event bus', 'observer pattern', 'signal system', 'pub sub'],
        how: 'ModuleScript "Signal": {connections={}}. Signal.new(): returns signal object. :Connect(callback): adds to connections table. :Fire(args): calls all connections. :Disconnect(connection): remove from table. :Once(callback): auto-disconnects after first fire. Used instead of BindableEvent to avoid Instance overhead. Useful for decoupled systems (combat → UI, progression → audio). No memory leaks if disconnected properly.' },
      { name: 'Debug Console', keywords: ['debug console', 'debug panel', 'developer console', 'debug mode', 'dev console'],
        how: 'Admin-only ScreenGui: TextBox input + output ScrollingFrame. Commands: /pos (print position), /time (server time), /players (list), /clear (clear console), /lua [code] (execute server Lua via loadstring — ADMIN ONLY, high risk). Output captures print() via redirect. Toggle with backtick key. Color-coded output: errors=red, warnings=yellow, info=white. Command history (up/down arrows).' },
      { name: 'Pathfinding Manager', keywords: ['pathfinding', 'npc path', 'pathfinding service', 'navigation', 'npc navigation'],
        how: 'ModuleScript wrapping PathfindingService. ComputePath(start, goal, agentParams): returns waypoints table. FollowPath(humanoid, waypoints): iterates MoveTo with timeout per waypoint. Stuck detection: if position not changed > 2s, recompute. Cache paths: same start+goal within 2s reuses result. Multiple NPCs: stagger recompute calls (task.wait(0.1) between) to avoid server spike. Obstacle avoidance via AgentRadius param.' },
      { name: 'Visual Theme System', keywords: ['theme system', 'ui theme', 'color theme', 'visual theme', 'style system'],
        how: 'ModuleScript "Theme": {primary=Color3.fromHex("#D4AF37"), bg=Color3.fromHex("#0a0a0a"), text=Color3.new(1,1,1), accent=Color3.fromHex("#FFD700")}. All UI elements reference Theme module. Theme.Apply(frame, "primary") sets BackgroundColor3. Alternate themes: Dark, Light, Colorblind. Player saves theme preference in DataStore. Admin creates seasonal themes (Halloween, Christmas). Single theme change updates all UI.' },
      { name: 'Input Mapping System', keywords: ['input mapping', 'key mapping', 'control mapping', 'remap controls', 'custom controls'],
        how: 'ModuleScript "InputMap": default action→key table {["Jump"]=Enum.KeyCode.Space, ["Dash"]=Enum.KeyCode.Q}. Bindable: player remaps via Settings UI (press key to bind). Save to DataStore. Apply: all input detection uses InputMap[action] instead of hardcoded keys. Controller support: separate gamepad map {["Jump"]=Enum.KeyCode.ButtonA}. Conflict detection: warn if same key bound to two actions. Reset to defaults button.' },
      { name: 'Game Config System', keywords: ['game config', 'server config', 'game settings', 'server settings', 'configuration'],
        how: 'ModuleScript "Config" in ServerScriptService: {maxPlayers=10, roundTime=300, enemyDamageMultiplier=1, dropRates={}, enabledFeatures={PvP=true, Trading=true}}. Single source of truth for all tuneable values. Admin can hot-reload config via chat command (require() clears cache). A/B testing: config variant loaded per server based on JobId hash. Environment-specific: different values for test vs production place.' },
    ],
  },

  // ════════════════════════════════════════════════════════════════════
  // FISHING SYSTEMS
  // ════════════════════════════════════════════════════════════════════
  {
    name: 'Fishing Systems',
    systems: [
      { name: 'Rod Casting', keywords: ['fishing', 'fish', 'rod', 'cast', 'fishing rod', 'cast line'],
        how: 'Tool "FishingRod" with Handle. Activate: play cast animation, spawn invisible Part "Bobber" at camera lookvector * castPower (10-30 studs). Bobber has BodyPosition to float at water Y level. Beam from rod tip to bobber. Wait random 3-8s then bobber dips (TweenService Y -= 1 stud, bounce). Player clicks during dip window (1.5s) → catch. Miss window → bobber resets. Sound: splash on land, bubble loop while waiting, reel sound on catch.' },
      { name: 'Fish Rarity Tiers', keywords: ['fish rarity', 'rare fish', 'legendary fish', 'fish types', 'fish tier'],
        how: 'Fish table: {name, rarity, weight, value, icon}. Rarities: Common(50%), Uncommon(25%), Rare(15%), Epic(8%), Legendary(2%). Roll math.random(1,100) on catch. Legendary: gold ParticleEmitter burst, screen shake, "LEGENDARY CATCH!" BillboardGui. Each fish has Model shown briefly on catch. Fish log ScreenGui: grid of all fish silhouettes, colored when caught. Completion rewards at 25/50/75/100%.' },
      { name: 'Bait System', keywords: ['bait', 'fishing bait', 'worm', 'lure', 'bait box'],
        how: 'Bait inventory: IntValue per bait type. Bait types: {Worm: rarityBoost=0, Shrimp: rarityBoost=10, GoldenLure: rarityBoost=30}. Select bait in ScreenGui before casting. Each cast consumes 1 bait. rarityBoost shifts roll: effectiveRoll = math.random(1,100) - baitBoost. Buy bait from shop NPC. No bait = cannot fish. BillboardGui on rod tip shows equipped bait icon.' },
      { name: 'Fishing Spots', keywords: ['fishing spot', 'fishing zone', 'fishing area', 'fish pond', 'fishing hole'],
        how: 'Invisible Part zones in water with StringValue "FishPool" containing comma-separated fish names available. Different spots = different fish. Rare spots glow (Neon circle under water, transparency 0.6). Some spots require quest unlock or level. SurfaceGui label "Fishing Spot" with fish silhouettes. Cooldown per spot: 30s after catching, spot "depleted" visual (darker water) then restocks. Server tracks depletion per spot.' },
      { name: 'Fishing Minigame', keywords: ['fishing minigame', 'fishing qte', 'reel in', 'fishing challenge', 'catch fish minigame'],
        how: 'On bite: ScreenGui minigame appears. Moving bar bounces left-right in meter. Green zone = catch zone (size varies by fish rarity: Legendary=tiny). Player holds click to reel (bar moves toward fish). Release to let bar drift back. Fish stamina bar depletes when bar in green zone. If bar exits meter bounds → line breaks, fish escapes. Timer: 15s max. Sound: reel clicking, line tension twang. Perfect catch (never left green) = bonus XP.' },
    ],
  },

  // ════════════════════════════════════════════════════════════════════
  // FARMING & AGRICULTURE
  // ════════════════════════════════════════════════════════════════════
  {
    name: 'Farming & Agriculture',
    systems: [
      { name: 'Plot Grid System', keywords: ['farm plot', 'plot grid', 'farming plot', 'garden plot', 'crop plot'],
        how: 'Player owns plot: Part grid N x M (e.g. 6x6). Each cell = 4x4 stud Part "PlotCell" with StringValue "State" (empty/planted/growing/ready). Click empty cell → plant menu. Visual: brown Concrete when empty, green sprout Model when planted, full crop Model when ready. DataStore saves grid state as 2D array. Plot purchase via shop NPC. Adjacency bonus: same crop type neighbors = +10% growth speed.' },
      { name: 'Seed Planting', keywords: ['seed', 'plant', 'planting', 'sow', 'seed bag', 'plant seed'],
        how: 'Seed inventory: table {seedName: count}. ProximityPrompt on empty plot cell "Plant Seed". ScreenGui seed selector: grid of owned seeds with icons + count. Select seed → server validates ownership, deducts 1 seed, sets cell State="planted", stores seedType + plantTime in cell StringValue. Spawn small sprout Model (3 green Parts). Sound: dirt shuffle. Seeds bought from shop or found in loot.' },
      { name: 'Growth Stages', keywords: ['growth', 'crop growth', 'grow stages', 'plant stages', 'growing crops'],
        how: 'Each crop has growthTime (seconds). Stages: Sprout(0-25%), Growing(25-50%), Mature(50-75%), Ready(75-100%). Server task.spawn loop checks all planted cells every 30s: elapsed = os.time() - plantTime, stage = math.floor(elapsed/growthTime * 4). Swap Model per stage (taller, more leaves). Ready stage: golden sparkle ParticleEmitter. BillboardGui shows growth % bar above crop. Offline growth: calculates elapsed time on join.' },
      { name: 'Watering System', keywords: ['water', 'watering', 'watering can', 'irrigate', 'water crops'],
        how: 'Tool "WateringCan" with Handle. Activate near crop: play pour animation, blue ParticleEmitter water drops. Each crop has BoolValue "Watered" reset daily. Watered crops grow 2x speed. Un-watered crops: 0.5x speed, wilting animation (Parts tilt slightly via CFrame rotation). Auto-sprinkler upgrade: waters all plots every hour. Sound: water splash. Visual: wet soil = darker brown Concrete material.' },
      { name: 'Harvesting', keywords: ['harvest', 'pick crop', 'collect crop', 'harvest crop', 'gather crop'],
        how: 'ProximityPrompt on Ready crops "Harvest". Server: validate State="ready", grant crop item to inventory (table in DataStore), reset cell to empty, chance of bonus crop (10% double harvest). Animation: player reaches down, crop pops with green ParticleEmitter, "+1 Carrot" BillboardGui floats up. Some crops regrow (berries): reset to Growing stage instead of empty. Sickle tool: harvest 3x3 area at once.' },
      { name: 'Season System', keywords: ['season', 'seasons', 'spring', 'summer', 'autumn', 'winter', 'seasonal'],
        how: 'Server IntValue "CurrentSeason" cycles: Spring→Summer→Autumn→Winter. Duration: configurable (300s per season for fast games, 3600s for long). Each crop has allowedSeasons table. Planting wrong season: warning UI, 50% yield. Season changes: Lighting.ColorCorrection shifts (spring=bright, winter=blue), Terrain snow in winter (FillBlock white material), leaf particles in autumn. Season indicator in HUD corner.' },
    ],
  },

  // ════════════════════════════════════════════════════════════════════
  // COOKING & RESTAURANT
  // ════════════════════════════════════════════════════════════════════
  {
    name: 'Cooking & Restaurant',
    systems: [
      { name: 'Ingredient Collection', keywords: ['ingredient', 'ingredients', 'collect ingredient', 'food item', 'cooking material'],
        how: 'Ingredients spawn in world as small Part models with BillboardGui label. ProximityPrompt "Collect". Server adds to inventory table {ingredient: count}. Respawn after 60s. Categories: Vegetables (garden), Meat (hunting), Spices (shop), Fish (fishing). Each ingredient has icon ImageLabel. Ingredient bag UI: ScreenGui ScrollingFrame showing all collected with counts. Weight limit optional.' },
      { name: 'Recipe Crafting', keywords: ['recipe', 'cook', 'cooking', 'craft food', 'recipe book', 'make food'],
        how: 'Recipes table: {name, ingredients:{Flour=2, Egg=1, Sugar=1}, cookTime=10, result="Cake", quality="base"}. Cooking station Part with ProximityPrompt. ScreenGui recipe list: show only recipes with at least 1 required ingredient owned. Select recipe → progress bar (cookTime seconds). Server validates ingredients, deducts, grants result. New recipes unlocked by finding Recipe Scroll items or leveling cooking skill.' },
      { name: 'Food Quality Ratings', keywords: ['food quality', 'dish quality', 'star rating food', 'cooking quality', 'meal quality'],
        how: 'Quality tiers: 1-5 stars. Base quality from recipe. Modifiers: +1 star if all ingredients are "Fresh" (collected < 300s ago), +1 star if player cooking level >= recipe level + 5, -1 star if missing optional ingredient. Quality affects: sell price multiplier (1x-3x), buff duration (1x-2x), visual (1 star = plain, 5 star = gold particles + special Model). BillboardGui shows stars above served dish.' },
      { name: 'Restaurant Serving', keywords: ['restaurant', 'serve', 'customer', 'waiter', 'serve food', 'diner'],
        how: 'NPC customers spawn at door, walk to empty seat (PathfindingService to chair Part). BillboardGui thought bubble shows wanted dish icon. Player brings correct dish (Tool) to table → ProximityPrompt "Serve". Match check: dish == wanted. Correct: customer eats (wait 5s), pays coins (quality-scaled), leaves. Wrong: angry emote, no pay. Timer: customer leaves if not served in 60s. Satisfaction meter affects future customer frequency.' },
      { name: 'Kitchen Stations', keywords: ['kitchen', 'stove', 'oven', 'cutting board', 'kitchen station', 'cooking station'],
        how: 'Multiple station Parts: Stove (frying/boiling), Oven (baking), CuttingBoard (chopping), Mixer (blending). Each recipe requires specific station. ProximityPrompt per station. Some recipes need multiple stations in sequence (chop→mix→bake). Station in-use: BoolValue prevents double-use, smoke/steam ParticleEmitter while cooking. Upgrade stations: faster cook time, unlock advanced recipes. Sound: sizzle, chop, oven ding.' },
    ],
  },

  // ════════════════════════════════════════════════════════════════════
  // EGG HATCHING & PETS
  // ════════════════════════════════════════════════════════════════════
  {
    name: 'Egg Hatching & Pets',
    systems: [
      { name: 'Egg Tiers', keywords: ['egg tier', 'egg type', 'common egg', 'rare egg', 'mythic egg', 'egg shop'],
        how: 'Egg types: {name, cost, pets:[{pet,chance}], hatchTime, model}. Common Egg(free, basic pets), Rare Egg(500 coins, better pool), Epic Egg(2000, epic pets), Mythic Egg(10000, legendary chance). Each egg: distinct Model (size, color, glow). Display on pedestals with BillboardGui showing name + cost + "Hatch!" button. DevProduct for premium eggs. Egg inventory in DataStore.' },
      { name: 'Hatch Meter', keywords: ['hatch meter', 'hatch progress', 'incubate', 'hatch bar', 'hatching progress'],
        how: 'After purchasing egg: ScreenGui progress bar appears. Progress increases by walking (Humanoid.MoveDirection.Magnitude > 0 each Heartbeat: progress += 1). Or by playing minigames (+50 per game). Progress target: Common=100, Rare=300, Epic=800, Mythic=2000. Bar fills with egg-colored gradient. At 100%: auto-trigger hatch animation. Multiple eggs can be incubating (show slots, active egg fills fastest). Offline progress: none (encourages play).' },
      { name: 'Rarity Rolls', keywords: ['rarity roll', 'gacha', 'pet roll', 'hatch rarity', 'random pet', 'lucky roll'],
        how: 'Weighted random: table of {pet, weight}. Total weight = sum all. Roll = math.random(1, totalWeight). Iterate table subtracting weights until roll <= 0. Luck multiplier: shift weights (double Legendary weight). Display odds in ScreenGui before purchase (legally required in some regions). Animation: spinning reel of pet icons, slows to land on result. Duplicate protection optional: pity system after N hatches without rare.' },
      { name: 'Shiny Variants', keywords: ['shiny', 'shiny pet', 'golden pet', 'rainbow pet', 'special variant'],
        how: 'Every pet has 1/1000 chance to be Shiny on hatch. Shiny: alternate color palette (gold/rainbow), +50% stat boost, special ParticleEmitter (sparkles). BillboardGui shows star icon next to name. Shiny indicator in inventory (golden border UIStroke). Separate "Shiny" BoolValue in pet data. Trading shinies: 10x value. Shiny-only leaderboard. Shiny hunt event: 2x shiny chance for limited time.' },
      { name: 'Pet Index / Pokedex', keywords: ['pet index', 'pokedex', 'pet collection', 'pet catalog', 'pet log', 'creature index'],
        how: 'ScreenGui "Pet Index": grid of all possible pets. Discovered pets: full color icon + name + stats. Undiscovered: dark silhouette + "???". Completion counter: "47/120 Discovered". Milestone rewards: 25%=title, 50%=exclusive pet, 75%=badge, 100%=legendary reward. Filter tabs by egg source or rarity. Each entry: click for detail view showing 3D ViewportFrame of pet model, stats, rarity, how to obtain. DataStore tracks discovered set.' },
    ],
  },

  // ════════════════════════════════════════════════════════════════════
  // PRISON & JAILBREAK
  // ════════════════════════════════════════════════════════════════════
  {
    name: 'Prison & Jailbreak',
    systems: [
      { name: 'Team System (Cops vs Criminals)', keywords: ['prison', 'jailbreak', 'cops', 'criminals', 'police', 'prisoner', 'inmate'],
        how: 'Three teams: Prisoner(orange), Police(blue), Criminal(red-escaped). Team assignment on join via Team objects. Prisoner spawn inside prison walls. Police spawn in station. Criminal = escaped prisoner (team change on leaving prison bounds). Police tools: Handcuffs, Taser. Prisoner tools: none initially. Leaderboard shows team. Team-colored overhead BillboardGui. Team chat via TextChatService channels.' },
      { name: 'Escape Routes', keywords: ['escape', 'escape route', 'tunnel', 'vent', 'sewer escape', 'prison escape'],
        how: 'Multiple escape paths: Sewer(crawl through Part tunnel, Touched triggers at entrance), Vent(small Parts player crawls through, size check), Wall Breach(breakable wall Part, HP reduced by pickaxe hits), Helicopter Pad(requires keycard). Each route: difficulty rating, required items. ProximityPrompt at route entrance. Server validates: player is Prisoner team, has required items. On escape: team changes to Criminal, alarm Sound plays for all, timer for police to respond.' },
      { name: 'Prison Tools & Items', keywords: ['pickaxe prison', 'keycard', 'prison tool', 'prison item', 'handcuffs', 'taser'],
        how: 'Prisoners find items in hidden spots (ClickDetector on objects). Pickaxe: breaks walls (10 hits). Keycard: opens locked doors (ProximityPrompt). Hammer: breaks vent covers. Rope: climb walls. Items in Backpack, confiscated on arrest (Backpack:ClearAllChildren). Police tools always equipped: Handcuffs(touch to arrest, 2s hold), Taser(ranged stun 1s, 10 stud range). Donut: heals police +25HP.' },
      { name: 'Criminal Gameplay', keywords: ['rob', 'robbery', 'heist', 'criminal activity', 'crime', 'steal'],
        how: 'Escaped criminals can rob locations: Bank(vault door timer 30s, bag fills with cash over 60s), Jewelry Store(smash glass cases ClickDetector, grab items), Gas Station(intimidate NPC cashier via ProximityPrompt hold 5s). Each robbery: alarm triggers, police notified via RemoteEvent, bounty increases. Cooldown per location: 300s. Cash deposited at Criminal Base (Part zone). Higher bounty = more police XP for arrest.' },
      { name: 'Arrest System', keywords: ['arrest', 'handcuff', 'jail', 'caught', 'send to jail', 'bust'],
        how: 'Police tool "Handcuffs". Touch Criminal/Prisoner outside bounds: RemoteEvent "Arrest". Server: validate police team, target is criminal, within 5 studs. On arrest: target teleported to jail cell SpawnLocation, team set to Prisoner, tools confiscated, arrest cooldown 3s. Arresting officer gets bounty reward (coins). Jail timer: 30s default + bounty bonus time. Timer shown in ScreenGui. Bail option: pay coins to reduce timer.' },
    ],
  },

  // ════════════════════════════════════════════════════════════════════
  // MINING & EXCAVATION
  // ════════════════════════════════════════════════════════════════════
  {
    name: 'Mining & Excavation',
    systems: [
      { name: 'Breakable Rocks', keywords: ['mine', 'mining', 'rock', 'ore', 'break rock', 'mine rock', 'dig'],
        how: 'Rock Parts with IntValue "HP" (10-100). Player Tool "Pickaxe" with Activate: raycast forward 6 studs, if hit rock Part → HP -= pickaxeDamage. Visual: small debris Parts fly out (BodyVelocity random direction, Debris 1s). Sound: rock clink. At HP=0: rock shatters (all debris fly, ParticleEmitter dust burst), grant ore to inventory. Rock respawns after 60s (Transparency tween 1→0). Bigger rocks = more HP = better ore.' },
      { name: 'Ore Tiers', keywords: ['ore tier', 'ore type', 'copper', 'iron', 'gold ore', 'diamond ore', 'ore rarity'],
        how: 'Ore table: {Stone(common, value=1, gray), Coal(common, value=2, black), Copper(uncommon, value=5, orange), Iron(uncommon, value=10, silver), Gold(rare, value=50, gold), Diamond(epic, value=200, cyan), Mythril(legendary, value=1000, purple)}. Rock color hints at ore inside. Rarity weighted by depth zone. Each ore: distinct Part color + BillboardGui name on pickup. Ore smelted into bars at furnace for higher value or crafting.' },
      { name: 'Depth Zones', keywords: ['depth', 'mine depth', 'underground', 'cave', 'deep mine', 'mine level'],
        how: 'Mine descends vertically. Zones by Y coordinate: Surface(Y>0, Stone/Coal), Shallow(Y -50 to 0, +Copper/Iron), Deep(Y -150 to -50, +Gold), Abyss(Y < -150, +Diamond/Mythril). Each zone: different Lighting (darker deeper, ColorCorrection saturation decreases), different ambient Sound, different rock HP multiplier. Elevator Part at surface: ProximityPrompt to travel to deepest unlocked zone. Zone unlock: mine N rocks in previous zone.' },
      { name: 'Pickaxe Upgrades', keywords: ['pickaxe upgrade', 'better pickaxe', 'mining tool', 'pickaxe tier', 'upgrade tool'],
        how: 'Pickaxe tiers: Wood(dmg=1), Stone(dmg=2, cost=100), Iron(dmg=5, cost=500), Gold(dmg=10, cost=2000), Diamond(dmg=25, cost=10000), Mythril(dmg=50, cost=50000). Upgrade at Blacksmith NPC. Server validates coins + current tier. Each tier: different Tool model (color, size scale), swing animation speed increases. Special abilities at high tiers: Gold=chance double ore, Diamond=area mine (3 rocks), Mythril=auto-collect radius.' },
      { name: 'Smelting & Furnace', keywords: ['smelt', 'smelting', 'furnace', 'refine', 'forge', 'smelt ore'],
        how: 'Furnace Part with ProximityPrompt. ScreenGui: input slot (ore) + fuel slot (coal) + output slot (bar). Smelt: 1 ore + 1 coal = 1 bar (10s timer, progress bar). Bars worth 3x ore value. Bars used in crafting recipes. Auto-smelt upgrade: furnace processes queue while player mines. Visual: fire ParticleEmitter inside furnace while active, smoke from chimney. Sound: crackling fire, metal ding on complete.' },
    ],
  },

  // ════════════════════════════════════════════════════════════════════
  // PET EVOLUTION
  // ════════════════════════════════════════════════════════════════════
  {
    name: 'Pet Evolution',
    systems: [
      { name: 'Evolution Trees', keywords: ['evolve', 'evolution', 'pet evolve', 'transform pet', 'upgrade pet', 'evolution tree'],
        how: 'Each pet species has evolution chain: Stage1 → Stage2 → Stage3. Evolution requirements: {level, items, coins}. Stage1 "Flame Pup" (level 10 + 5 FireStones) → Stage2 "Flame Wolf" → Stage3 "Flame Dragon". Model changes per stage (bigger, more detail). Stats multiply: Stage2=2x, Stage3=4x base. ScreenGui evolution tree: visual flowchart showing current stage, next requirements. Cannot un-evolve. Sound: dramatic evolution sequence with light burst.' },
      { name: 'Pet Merge Mechanics', keywords: ['merge', 'pet merge', 'fuse', 'combine pets', 'pet fusion'],
        how: 'Merge 3 identical pets → 1 higher-tier pet. Merge station: ProximityPrompt on altar Part. ScreenGui: 3 input slots + arrow + output preview. Drag pets from inventory to slots. All 3 must be same species + same tier. Result: next rarity tier (3 Common = 1 Uncommon). Visual: 3 pets float above altar (BodyPosition), spiral inward (TweenService), flash → new pet appears. 10% chance of bonus: skip tier (3 Common → 1 Rare). DataStore deducts 3, adds 1.' },
      { name: 'Pet Stat Boosts', keywords: ['pet stats', 'pet power', 'pet level', 'pet strength', 'level up pet'],
        how: 'Each pet has stats: {damage, speed, luck, stamina}. Level up: XP from walking, fighting, minigames. XP to next level = level * 100. On level up: stats increase by base * 0.1. Stat allocation: per level grant 2 stat points, player distributes. ScreenGui pet stats panel: bars per stat, level number, XP progress bar. Cap at level 50. Prestige system: reset to level 1 with permanent +10% stat bonus.' },
      { name: 'Elemental Pet Types', keywords: ['elemental pet', 'pet element', 'fire pet', 'water pet', 'earth pet', 'element type'],
        how: 'Elements: Fire, Water, Earth, Air, Lightning, Dark, Light. Each pet has element StringValue. Weakness chart: Fire>Earth>Lightning>Water>Fire, Air>Dark>Light>Air. Battle bonus: 1.5x damage vs weak element. Visual: pet has element-colored ParticleEmitter aura. Element icon in BillboardGui. Hybrid pets (two elements) from special merges. ScreenGui element chart shows matchups. Some areas boost specific elements (+25% stats in matching biome).' },
    ],
  },

  // ════════════════════════════════════════════════════════════════════
  // GUILD & CLAN SYSTEM
  // ════════════════════════════════════════════════════════════════════
  {
    name: 'Guild & Clan System',
    systems: [
      { name: 'Guild Creation', keywords: ['guild', 'clan', 'create guild', 'make clan', 'guild system', 'faction'],
        how: 'RemoteEvent "CreateGuild": server validates unique name, player has 1000 coins, not in existing guild. DataStore "Guilds" stores {name, leader, members:[], bank:0, level:1, createdAt}. Player DataStore stores guildId. Max 50 members. Guild tag above name in BillboardGui "[TAG] PlayerName". ScreenGui guild panel: member list, settings (leader only), leave button. Guild chat channel via TextChatService.' },
      { name: 'Guild Invites', keywords: ['guild invite', 'clan invite', 'join guild', 'recruit', 'guild request'],
        how: 'Leader/officers send invite: RemoteEvent "GuildInvite" with target userId. Target gets ScreenGui popup: "Join [GuildName]? Yes/No". Accept: server adds to members array, notifies all online members via RemoteEvent. Deny: notify sender. Request system: non-members request to join, leader approves from pending list. Auto-decline if guild full. Kick member: leader RemoteEvent "GuildKick", remove from members, notify kicked player.' },
      { name: 'Guild Bank', keywords: ['guild bank', 'clan bank', 'guild treasury', 'guild donate', 'guild funds'],
        how: 'Guild DataStore field "bank" (number). Members deposit via ScreenGui: TextBox amount + "Deposit" button. RemoteEvent "GuildDeposit": server deducts from player, adds to guild bank. Withdrawal: leader only, with configurable daily limit. Bank log: table of {player, amount, action, timestamp} stored last 50 entries. Display bank balance in guild panel. Bank funds used for guild upgrades, guild quests entry fee, guild wars buy-in.' },
      { name: 'Guild Quests', keywords: ['guild quest', 'clan quest', 'guild mission', 'guild objective', 'guild challenge'],
        how: 'Weekly guild quests generated server-side: {objective:"Collect 10000 coins collectively", progress:0, target:10000, reward:{guildXP:500, memberCoins:200}}. All member contributions tracked. ScreenGui quest board shows active quests with progress bars. On completion: rewards distributed to all online members, guild XP added. Quest difficulty scales with guild level. 3 active quests max. Refresh on Monday 00:00 UTC.' },
      { name: 'Guild Wars', keywords: ['guild war', 'clan war', 'guild battle', 'guild vs guild', 'clan battle'],
        how: 'Challenge system: leader sends war challenge to another guild via ScreenGui. Both leaders accept → war starts. Duration: 24 hours. Score: member kills + objectives completed. War arena: instanced map (TeleportService ReservedServer). 5v5 format: each guild sends 5 members. Best of 3 rounds. Winner guild: coins from loser bank (10% of loser bank, capped). War history in guild panel. Cooldown: 48h between wars per guild.' },
    ],
  },

  // ════════════════════════════════════════════════════════════════════
  // DAILY QUESTS & OBJECTIVES
  // ════════════════════════════════════════════════════════════════════
  {
    name: 'Daily Quests & Objectives',
    systems: [
      { name: 'Quest Board', keywords: ['quest board', 'daily quest', 'daily mission', 'quest list', 'mission board'],
        how: 'SurfaceGui on board Part in spawn area. Shows 3 daily quests + 1 weekly quest. Quests generated on server at 00:00 UTC: random selection from quest pool weighted by player level. Quest pool: {type:"collect", target:"Coin", count:50}, {type:"defeat", target:"Zombie", count:10}, {type:"craft", target:"Sword", count:1}. Click quest for details. Active quests shown in HUD sidebar. Max 3 daily active at once.' },
      { name: 'Random Objectives', keywords: ['random objective', 'random quest', 'random mission', 'objective generator', 'quest variety'],
        how: 'Objective generator ModuleScript: templates [{verb:"Collect", noun:"{item}", count:"{N}"}, {verb:"Defeat", noun:"{enemy}", count:"{N}"}]. Fill from tables: items=["Coins","Gems","Fish"], enemies=["Zombie","Spider","Boss"]. Count scaled by player level (level*5 for collect, level*2 for defeat). Ensures variety: track last 5 generated, never repeat. Difficulty modifier: Easy(0.5x count, 0.5x reward), Normal(1x), Hard(2x count, 3x reward).' },
      { name: 'Quest Completion Rewards', keywords: ['quest reward', 'mission reward', 'complete quest', 'quest completion', 'objective reward'],
        how: 'On objective reached: RemoteEvent "QuestComplete" fires to client. ScreenGui celebration: golden frame slides in with reward list. Rewards: coins(base * difficulty), XP(50-500), items(chance of rare drop), quest tokens(for quest shop). Sound: triumphant fanfare. Auto-collect: rewards added immediately server-side. Daily completion bonus: finish all 3 dailies = bonus chest (extra random reward). Progress resets at 00:00 UTC.' },
      { name: 'Streak Bonuses', keywords: ['streak', 'daily streak', 'login streak', 'consecutive days', 'streak bonus', 'streak reward'],
        how: 'DataStore stores {lastQuestDay: dayNumber, streak: N}. Day = math.floor(os.time()/86400). On daily quest completion: if lastQuestDay == today-1 → streak += 1, else if lastQuestDay < today-1 → streak = 1. Streak multiplier: rewards * (1 + streak * 0.1), capped at 3x (streak 20). Streak display: flame icon + number in HUD. Milestones: 7-day = exclusive item, 30-day = title, 100-day = legendary pet. Streak freeze item: purchased, prevents reset for 1 missed day.' },
    ],
  },

  // ════════════════════════════════════════════════════════════════════
  // SEASONAL EVENTS
  // ════════════════════════════════════════════════════════════════════
  {
    name: 'Seasonal Events',
    systems: [
      { name: 'Holiday Themes', keywords: ['holiday', 'christmas', 'halloween', 'easter', 'valentine', 'holiday event', 'holiday theme'],
        how: 'Server checks os.date for holiday range. Halloween (Oct 15-Nov 5): orange/purple Lighting, fog Atmosphere density 0.5, pumpkin Models replace lamps, spooky ambient Sound. Christmas (Dec 10-Jan 5): snow terrain, red/green decorations, Santa NPC, gift boxes. Easter (Mar-Apr): pastel colors, egg hunt. Valentine (Feb 10-15): pink particles, heart Models. Theme ModuleScript holds holiday configs: {lighting, decorations[], npcs[], music}. Revert to default after event.' },
      { name: 'Limited Event Items', keywords: ['limited item', 'event exclusive', 'seasonal item', 'event item', 'limited edition'],
        how: 'Event items: unique Models/Tools available only during event period. Shop NPC "Event Vendor" spawns during event only. Items marked "LIMITED" with countdown timer in shop GUI. After event: items remain in inventory but cannot be obtained again. Visual flair: special UIStroke pulsing border in inventory, "EVENT" tag. DataStore stores acquisition timestamp. Some items tradeable (high trade value post-event), some soulbound.' },
      { name: 'Event Currency', keywords: ['event currency', 'event token', 'event coin', 'seasonal currency', 'candy', 'snowflake'],
        how: 'Separate IntValue "EventTokens" (name matches event: "Candy" for Halloween, "Snowflakes" for Christmas). Earned from event-specific activities: collecting spawned items in world, event quests, event minigames. Cannot be converted to regular currency. Expires after event (reset to 0 or convert at 10:1 ratio to coins). HUD shows event currency with themed icon. Sound: special chime on collect.' },
      { name: 'Event Shop', keywords: ['event shop', 'seasonal shop', 'event store', 'holiday shop', 'event vendor'],
        how: 'Special NPC with themed Model (witch for Halloween, elf for Christmas). ProximityPrompt opens event ScreenGui. Items priced in event currency. Categories: Cosmetics (skins, trails), Pets (event-exclusive), Tools (themed weapons), Consumables (temporary buffs). Limited stock per item (IntValue count, shown in GUI). Countdown timer at top: "Event ends in 3d 12h". Best items most expensive to encourage grinding. Server validates event is active before any purchase.' },
    ],
  },

  // ════════════════════════════════════════════════════════════════════
  // ACHIEVEMENT TREES
  // ════════════════════════════════════════════════════════════════════
  {
    name: 'Achievement Trees',
    systems: [
      { name: 'Branching Achievements', keywords: ['achievement', 'achievement tree', 'achievement branch', 'unlock achievement', 'achievement path'],
        how: 'Achievement tree ModuleScript: nodes [{id, name, description, requirement:{type,target,count}, parent:id|null, reward, rarity}]. Tree structure: root achievements (no parent) → children unlock when parent completed. ScreenGui: visual tree with lines connecting nodes. Completed=gold, available=white, locked=gray. Click node for details. Server tracks completion in DataStore bitfield or table. Fire "AchievementUnlocked" RemoteEvent on completion.' },
      { name: 'Milestone Rewards', keywords: ['milestone', 'achievement reward', 'achievement milestone', 'progress reward', 'milestone unlock'],
        how: 'Global achievement counter: total achievements completed (IntValue). Milestones at 10, 25, 50, 100, 200, 500. Each milestone: escalating reward (coins, exclusive items, titles, badges). ScreenGui milestone display: progress bar to next milestone with reward preview. On milestone hit: full-screen celebration (confetti ParticleEmitter, "MILESTONE!" text scales up), reward chest animation. DataStore stores milestones claimed.' },
      { name: 'Achievement Rarity Badges', keywords: ['badge', 'achievement badge', 'rarity badge', 'trophy', 'rare achievement'],
        how: 'Each achievement has rarity based on % of players who completed it (server tracks globally). Rarities: Common(>50%), Uncommon(25-50%), Rare(10-25%), Epic(5-10%), Legendary(<5%). Badge color: bronze/silver/gold/purple/red. Display in player profile ScreenGui: badge showcase (top 6 rarest). BillboardGui option: show rarest badge above head. Achievement comparison: visit other player profile to compare. Global leaderboard: most rare achievements.' },
      { name: 'Secret Achievements', keywords: ['secret achievement', 'hidden achievement', 'mystery achievement', 'discovery achievement'],
        how: 'Subset of achievements with description hidden until discovered: "???" in achievement tree. Hints: vague clue text "Do something unexpected at the volcano". Triggered by obscure actions: visit hidden location, perform specific emote sequence, find all easter eggs. On unlock: special notification "SECRET FOUND!" with unique sound. Extra XP reward (3x normal). Achievement list shows "5 Secrets Remaining". Encourages exploration and community sharing of discoveries.' },
    ],
  },

  // ════════════════════════════════════════════════════════════════════
  // CRAFTING SYSTEM
  // ════════════════════════════════════════════════════════════════════
  {
    name: 'Crafting System',
    systems: [
      { name: 'Material Gathering', keywords: ['gather', 'material', 'resource', 'collect material', 'gather resource', 'forage'],
        how: 'Resources in world: Trees (chop with axe, drop Wood), Rocks (mine with pickaxe, drop Stone/Ore), Plants (interact, drop Herbs/Fiber), Animals (defeat, drop Hide/Meat). Each resource: Part model with IntValue HP, respawn timer. Tool required matching resource type. Gathering gives 1-3 materials per hit (random). Gathering skill: levels up with use, higher level = more drops + faster gather. Inventory ModuleScript tracks all materials as {name:count} table.' },
      { name: 'Recipe Discovery', keywords: ['recipe discovery', 'discover recipe', 'learn recipe', 'recipe unlock', 'experiment craft'],
        how: 'Two systems: known recipes (unlocked by finding Recipe Scroll items or NPC teaching) and experimental crafting (place any 2-4 items in crafting grid, if combination matches hidden recipe → discover it permanently). DataStore stores discovered recipe IDs. Unknown recipes show as "???" in recipe book with hint ("Combine something hard with something hot"). First discovery bonus: extra XP + "Pioneer" achievement. Share discoveries in chat notification.' },
      { name: 'Workbench Stations', keywords: ['workbench', 'crafting table', 'anvil', 'loom', 'crafting station'],
        how: 'Station types: Basic Workbench (wood items), Anvil (metal items, needs smelted bars), Loom (fabric/rope items), Alchemy Table (potions), Enchanting Table (add effects to equipment). Each station Part with ProximityPrompt. Station ScreenGui: shows only recipes available at this station. Higher tier stations unlock at player crafting level thresholds. Station upgrade: player builds improved station (more recipes, faster craft). Sound: unique per station (hammering, weaving, bubbling).' },
      { name: 'Item Quality Crafting', keywords: ['item quality', 'craft quality', 'quality level', 'masterwork', 'crafting quality'],
        how: 'Crafted items roll quality: Normal(60%), Fine(25%), Superior(10%), Masterwork(5%). Quality affects stats: Fine=+20%, Superior=+50%, Masterwork=+100%. Factors improving quality: crafting skill level (each level +1% to roll), material quality (rare materials shift odds), station tier. Visual: quality name prefix + colored glow (white/green/blue/gold). Masterwork items: unique particle trail, BillboardGui "MASTERWORK" tag. Cannot re-roll quality; craft again for another chance.' },
    ],
  },

  // ════════════════════════════════════════════════════════════════════
  // HOUSING & DECORATION
  // ════════════════════════════════════════════════════════════════════
  {
    name: 'Housing & Decoration',
    systems: [
      { name: 'Plot Ownership', keywords: ['house plot', 'own plot', 'buy plot', 'plot ownership', 'home plot', 'player house'],
        how: 'Plot Parts in housing zone with BillboardGui "For Sale - 5000 Coins" or "Owned by PlayerName". ProximityPrompt "Buy Plot". Server: validate no existing plot owned, coins >= price, assign plot to userId in DataStore. Plot boundary: invisible walls (CanCollide true, Transparency 1) prevent trespassing. Owner can toggle visitors (BoolValue "AllowVisitors"). Plot size tiers: Small(20x20), Medium(30x30), Large(40x40). Upgrade size at NPC.' },
      { name: 'Furniture Placement', keywords: ['furniture', 'place furniture', 'decorate', 'decoration', 'furnish', 'interior design'],
        how: 'Build mode toggle (keybind B). ScreenGui furniture catalog: owned items in grid. Select item → ghost Model follows mouse (Transparency 0.5, green=valid, red=invalid placement). Click to place: server validates within plot bounds + no overlap (GetPartBoundsInBox check). Placed items stored in DataStore as {itemId, CFrame}. Rotation: R key rotates 90°. Move: click placed item to pick up. Delete: select + Delete key. Grid snap: positions snap to 1-stud grid.' },
      { name: 'Room Templates', keywords: ['room template', 'house template', 'preset room', 'starter house', 'house layout'],
        how: 'Pre-built room layouts: {name:"Cozy Cabin", parts:[{size,pos,color,material}...], furniture:[{item,cframe}...]}. Apply template: ProximityPrompt at plot or button in ScreenGui. Server: clear existing plot contents, spawn all template parts + furniture. Templates: Starter Shack(free), Modern Loft(1000), Castle Room(5000), Space Station(10000). Player can modify after applying. Save custom layout as personal template (1 slot free, more slots purchasable).' },
      { name: 'Visitor System', keywords: ['visit house', 'visitor', 'house visit', 'tour house', 'visit player', 'open house'],
        how: 'Visit other plots: ScreenGui "Visit" button opens player list. Select player → teleport to their plot entrance. Owner controls: AllowVisitors toggle, whitelist/blacklist. Visitor counter: IntValue tracks total visits, shown on BillboardGui. Like system: visitors can "Like" once (heart button), like count displayed. Most-liked houses on leaderboard. Visitor book: SurfaceGui on Part in house, shows recent visitor names with timestamps.' },
    ],
  },

  // ════════════════════════════════════════════════════════════════════
  // AUCTION HOUSE (ADVANCED)
  // ════════════════════════════════════════════════════════════════════
  {
    name: 'Auction House Advanced',
    systems: [
      { name: 'Item Listing', keywords: ['list item', 'auction listing', 'sell item', 'create listing', 'post auction'],
        how: 'ScreenGui at Auction NPC: "List Item" tab. Select from inventory → set starting price + buyout price + duration (6h/12h/24h). RemoteEvent "CreateListing": server validates ownership, removes item from inventory, stores listing in DataStore "AuctionListings" {id, seller, item, startPrice, buyoutPrice, currentBid, highestBidder, endTime}. Listing fee: 5% of starting price (anti-spam). Max 5 active listings per player.' },
      { name: 'Bidding System', keywords: ['bid', 'auction bid', 'place bid', 'outbid', 'highest bid'],
        how: 'Browse listings in ScreenGui ScrollingFrame with sort/filter. Click listing → detail view with current bid, time remaining, bid history. "Bid" button: TextBox for amount, minimum = currentBid + 10% increment. Server validates: bid > current, bidder has coins, not own listing. Deduct bid amount from bidder, refund previous highest bidder. On auction end (server timer): grant item to winner, coins to seller minus 10% fee. If no bids: return item to seller.' },
      { name: 'Buyout System', keywords: ['buyout', 'instant buy', 'buy now', 'instant purchase'],
        how: 'Listings have optional buyoutPrice. "Buy Now" button in listing detail. Server: validate coins >= buyoutPrice, instantly complete auction (skip timer). Refund any current highest bidder. Transfer item to buyer, coins minus 10% fee to seller. Remove listing from DataStore. Notification to seller: "Your {item} sold for {buyoutPrice}!" via RemoteEvent. Popular items: buyout within seconds (price discovery).' },
      { name: 'Auction Search & Filter', keywords: ['auction search', 'auction filter', 'search listing', 'find item', 'browse auction'],
        how: 'ScreenGui search bar (TextBox + magnifying glass icon). Filter dropdowns: Category (Weapons/Armor/Materials/Pets), Rarity (Common-Legendary), Price Range (min/max TextBox), Sort By (Price Low→High, Time Remaining, Recently Listed). Server processes search: GetSortedAsync for ordered results, filter in memory. Pagination: 20 per page, Next/Prev buttons. Saved searches: bookmark filter combos. "Watch" button on items: notify when new listing appears.' },
    ],
  },

  // ════════════════════════════════════════════════════════════════════
  // SOCIAL FEATURES
  // ════════════════════════════════════════════════════════════════════
  {
    name: 'Social Features',
    systems: [
      { name: 'Friend List', keywords: ['friend', 'friend list', 'add friend', 'friend system', 'friends'],
        how: 'Uses Players:GetFriendsAsync(userId) for Roblox friends. Custom in-game friends: DataStore stores friendsList per player. Send request: RemoteEvent "FriendRequest". Recipient gets popup. Accept: both players add each other to lists. ScreenGui friends panel: online friends (green dot) + offline (gray). Click friend: options (Join Server, Visit House, Send Gift, Unfriend). Show friend count in profile. Best friends: top 3 most interacted.' },
      { name: 'Party System', keywords: ['party', 'group up', 'party invite', 'team up', 'squad'],
        how: 'Create party: RemoteEvent "CreateParty". Leader invites via ScreenGui player list. Max 4 members. Party HUD: member portraits (ViewportFrame of character) + HP bars in top-left corner. Party benefits: shared XP (split evenly), see party members on minimap (special color dot), party chat channel. Leave party: button or disconnect. Leader transfer: if leader leaves, next member becomes leader. Party disbanded when < 2 members. TeleportService: party travels together to new servers.' },
      { name: 'Chat Channels', keywords: ['chat channel', 'global chat', 'local chat', 'trade chat', 'chat system'],
        how: 'TextChatService channels: Global(all players on server), Local(within 50 studs, magnitude check), Trade("WTS/WTB" prefix required), Party(party members only), Guild(guild members only). Channel selector: tab buttons above chat window. Different colors per channel: Global=white, Local=yellow, Trade=green, Party=cyan, Guild=purple. Mute player: right-click name → "Mute" stores in local table. Chat filter: TextChatService built-in + custom word list.' },
      { name: 'Emote System', keywords: ['emote', 'dance', 'wave', 'sit emote', 'emote wheel'],
        how: 'Emote table: {name, animationId, icon, category}. Categories: Greetings(wave, bow), Dances(shuffle, spin), Actions(sit, lay, push-up), Funny(chicken, robot). Trigger: /e command in chat or emote wheel UI (radial menu, hold E key). Play Animation on Humanoid.Animator. Looping emotes: stop on movement. Some emotes purchasable (DevProduct). Emote favorites: player pins top 8 to quick wheel. Custom emotes: premium feature.' },
      { name: 'Gift Sending', keywords: ['gift', 'send gift', 'give item', 'gift player', 'present'],
        how: 'ScreenGui "Send Gift": select recipient from friends/nearby list, select item from inventory or purchase gift wrap (DevProduct). Confirm → RemoteEvent "SendGift". Server: validate sender owns item, recipient exists, not blocked. Remove from sender, add to recipient inbox (not direct inventory). Recipient notification: "You received a gift from {player}!" + gift box animation (3D model opens with sparkles). Gift log in DataStore. Daily gift limit: 5 per day (anti-exploit).' },
      { name: 'Player Profile Card', keywords: ['profile', 'player card', 'player profile', 'bio', 'profile card'],
        how: 'ScreenGui profile panel: player thumbnail (Players:GetUserThumbnailAsync), display name, level, guild tag, title, playtime, join date. Stats section: total kills, quests completed, achievements earned. Badge showcase: top 6 rarest achievements with colored frames. Bio TextBox (50 char limit, saved DataStore). View others: click player in world → "View Profile" ProximityPrompt. Compare stats option. Profile background themes purchasable.' },
      { name: 'Player Reporting', keywords: ['report', 'report player', 'report abuse', 'player report', 'flag player'],
        how: 'Right-click player name or "Report" button in profile. ScreenGui report form: dropdown reason (Hacking, Toxicity, Scamming, Inappropriate Name, Other), TextBox description (200 char). RemoteEvent "ReportPlayer". Server stores in DataStore "Reports" {reporter, reported, reason, description, timestamp, serverJobId}. Anti-spam: max 3 reports per player per hour. Confirmation: "Report submitted, thank you." Admin panel: review queue with action buttons.' },
      { name: 'Social Hub / Lobby', keywords: ['social hub', 'lobby', 'hangout', 'social space', 'chill zone'],
        how: 'Dedicated map area with: dance floor (Neon color-cycling Parts), seating areas (bench Models), jukebox (ProximityPrompt to queue songs, Sound objects), photo booth (camera angle + screenshot), mini-games (tic-tac-toe board, chess board SurfaceGui), food/drink NPC vendor, stage for performances. No combat allowed (damage disabled in zone). Ambient music. Seasonal decorations rotate. Central fountain meeting point. Teleport portals to game zones.' },
    ],
  },

  // ════════════════════════════════════════════════════════════════════
  // TYCOON SYSTEMS
  // ════════════════════════════════════════════════════════════════════
  {
    name: 'Tycoon Systems',
    systems: [
      { name: 'Dropper & Conveyor', keywords: ['dropper', 'conveyor', 'tycoon dropper', 'ore dropper', 'conveyor belt'],
        how: 'Dropper Part spawns resource Part every 2s (task.spawn loop: clone template, parent to workspace, CFrame = dropper position - Vector3.new(0,2,0)). Conveyor: long Part with Velocity = Vector3.new(0,0,-10) on surface. Resource Part slides along conveyor via BasePart.Velocity or BodyVelocity. Upgrade dropper: spawn rate decrease (2s→1s→0.5s), resource value increase. Visual: machine Model with spinning gear Parts (CFrame rotation loop). Sound: mechanical hum.' },
      { name: 'Tycoon Buttons', keywords: ['tycoon button', 'buy button', 'upgrade pad', 'purchase button', 'unlock button'],
        how: 'Neon Part on ground with SurfaceGui showing item name + price. ProximityPrompt or Touched event. On purchase: validate coins >= price, deduct coins, Destroy button, spawn unlocked item (building/machine/upgrade). Buttons appear in sequence (button 2 visible only after button 1 purchased). Visual: green glow when affordable, red when too expensive. Each button in DataStore for persistence. Sound: cash register cha-ching on buy.' },
      { name: 'Tycoon Base Building', keywords: ['tycoon base', 'tycoon plot', 'tycoon building', 'factory building', 'base upgrade'],
        how: 'Player claims plot (Touched pad assigns ownership). Base starts empty. Purchase buttons unlock: walls, floor upgrades, machines, decorations. Each unlock: server spawns pre-positioned Parts from template folder. DataStore stores list of purchased unlockIds. On rejoin: iterate purchased list, spawn all. Base expansion: later buttons unlock adjacent area. Model hierarchy: PlotFolder > Buildings > individual Parts. Walls/roof give passive bonuses.' },
      { name: 'Collector & Sell Pad', keywords: ['collector', 'sell pad', 'collect resources', 'sell resources', 'tycoon sell'],
        how: 'Sell pad: Part at end of conveyor. Touched by resource Part: Destroy resource, add value to player coins (IntValue in leaderstats). BillboardGui "+$50" floats up (TweenService Y offset). Auto-collector upgrade: invisible Region3 around base, collects all loose resource Parts every 1s, adds values. Sell multiplier upgrades: 2x, 5x, 10x (stored in DataStore). Sound: coin clink. Visual: resource Part shrinks on contact then Debris.' },
      { name: 'Rebirth/Prestige Tycoon', keywords: ['tycoon rebirth', 'tycoon prestige', 'reset tycoon', 'tycoon restart'],
        how: 'When player reaches income threshold: "Rebirth" button appears. On rebirth: destroy all base buildings, reset coins to 0, increment Rebirth counter (IntValue in leaderstats). Bonus: all earnings multiplied by 1 + (rebirths * 0.5). Some items persist across rebirths (marked "Permanent"). New rebirth-only items unlock at rebirth milestones. Visual: dramatic explosion of base, rebuilds from scratch. Rebirth shop: spend rebirth tokens on permanent upgrades.' },
      { name: 'Income Display', keywords: ['income display', 'money per second', 'earnings display', 'revenue counter', 'income counter'],
        how: 'Server tracks income rate per player: sum of all dropper values / dropper intervals. BillboardGui or SurfaceGui on base showing "$X/sec" updating every second. ScreenGui HUD element: current coins + income rate. History graph: ScreenGui with Frame bars showing last 60s of earnings. Total earned stat in DataStore. Milestone celebrations: "$1M earned!" notification with fireworks ParticleEmitter. Leaderboard: sort by income rate.' },
    ],
  },

  // ════════════════════════════════════════════════════════════════════
  // SIMULATOR MECHANICS
  // ════════════════════════════════════════════════════════════════════
  {
    name: 'Simulator Mechanics',
    systems: [
      { name: 'Click/Tap Mechanic', keywords: ['clicker', 'click simulator', 'tap', 'clicking game', 'click power'],
        how: 'Tool or ScreenGui button. Each click: RemoteEvent "Click". Server: increment resource by clickPower (IntValue, upgradeable). Visual: number popup "+{power}" at click point (BillboardGui, TweenService float up + fade). Click combo: rapid clicks within 0.5s each build multiplier (2x, 3x...). Auto-clicker detection: if clicks > 20/sec, flag and ignore excess. Upgrade clickPower at shop. Prestige resets power but gives permanent multiplier.' },
      { name: 'Backpack/Capacity System', keywords: ['backpack', 'capacity', 'bag', 'storage capacity', 'bag upgrade', 'backpack upgrade'],
        how: 'IntValue "BackpackSize" (default 100). Collecting resources: current += resourceValue. When current >= BackpackSize: "Backpack Full!" notification, cannot collect more. Must sell at sell pad to empty. Upgrade backpack: shop tiers (100→250→500→1000→5000→unlimited). Visual: character carries bag Model that grows with fill level. Progress bar in HUD shows current/max. Auto-sell pet: companion that sells when full.' },
      { name: 'Zone Unlocking', keywords: ['zone unlock', 'area unlock', 'unlock zone', 'zone gate', 'zone portal', 'new area'],
        how: 'Invisible wall Parts with SurfaceGui "Requires 10,000 Coins to Enter". ProximityPrompt "Unlock Zone". Server validates coins or level. On unlock: remove wall, play unlock animation (walls slide apart via TweenService), store in DataStore. Each zone: better resources, harder enemies, new NPCs. Zone progression: 5-10 zones getting harder. Teleport shortcut to unlocked zones via ScreenGui map. First-time zone entry: camera pan showing the zone.' },
      { name: 'Auto-Farm/Idle Mechanic', keywords: ['auto farm', 'idle', 'afk farm', 'auto collect', 'idle game', 'offline progress'],
        how: 'Toggle "Auto-Farm" in ScreenGui (unlocked via gamepass or in-game purchase). When enabled: server task.spawn loop fires click event every 0.5s automatically. Idle multiplier: reduced rate (50%) when auto-farming to incentivize active play. Offline earnings: on rejoin, calculate minutes since last save, grant offlineMinutes * incomePerMinute * 0.1 (10% of active rate). Cap offline earnings at 8 hours. Notification: "While you were away, you earned $X!"' },
      { name: 'World/Dimension Hopping', keywords: ['dimension', 'world hop', 'parallel world', 'alternate dimension', 'realm'],
        how: 'Multiple game worlds accessible via portal. Each world: different theme, resources, enemies, economy. Portal Part (swirling ParticleEmitter): ProximityPrompt "Travel to Ice Realm". TeleportService:TeleportToPlaceAsync to sub-place, or swap map content in same server. Progress carries across dimensions (shared DataStore). Dimension-exclusive items incentivize visiting all. World map ScreenGui shows all dimensions with unlock status.' },
      { name: 'Leaderboard Races', keywords: ['race leaderboard', 'first to', 'competition', 'race to top', 'global race'],
        how: 'Timed event: "First to 1,000,000 coins wins!" Server-wide race starts at set time. OrderedDataStore tracks participant scores, updates every 30s. Live leaderboard SurfaceGui in spawn shows top 10. Rewards: 1st place = exclusive item + 10K coins, top 10 = coins + badge. Duration: 1-24 hours. Anti-cheat: validate coin gains against maximum possible rate. Announce winner globally via RemoteEvent "RaceWinner" + celebration effects.' },
    ],
  },

  // ════════════════════════════════════════════════════════════════════
  // VEHICLE & TRANSPORT ADVANCED
  // ════════════════════════════════════════════════════════════════════
  {
    name: 'Vehicle & Transport Advanced',
    systems: [
      { name: 'Vehicle Garage', keywords: ['garage', 'vehicle garage', 'car garage', 'vehicle storage', 'park car'],
        how: 'Garage building with door that opens (TweenService Part position). ProximityPrompt "Open Garage". ScreenGui vehicle selector: grid of owned vehicles with stats. Select → vehicle spawns at garage exit point. Only 1 vehicle out at a time (Destroy previous). DataStore stores owned vehicle IDs. Buy vehicles from dealer NPC. Customize: color picker per vehicle part. Premium garage: more slots, faster spawn.' },
      { name: 'Vehicle Customization', keywords: ['car customize', 'vehicle paint', 'car mod', 'vehicle upgrade', 'car parts'],
        how: 'Customization station Part. ProximityPrompt opens ScreenGui with categories: Paint (color picker → apply to all body Parts), Wheels (swap wheel Models), Spoiler (toggle), Underglow (Neon Part beneath, color choice), Decals (ImageLabel on sides), Performance (speed/handling/brake upgrades via VehicleSeat properties). Each customization costs coins. Preview before buying. Save config per vehicle in DataStore. "Reset to Default" option.' },
      { name: 'Fuel System', keywords: ['fuel', 'gas', 'refuel', 'fuel tank', 'gas station', 'fuel gauge'],
        how: 'NumberValue "Fuel" per vehicle (max 100). Driving consumes fuel: Heartbeat loop deducts fuel based on Throttle input. At 0: vehicle stops (MaxSpeed = 0). Gas station: ProximityPrompt "Refuel ($50)". Server validates coins, sets Fuel to 100. HUD fuel gauge: horizontal bar with gradient (green→yellow→red). Warning at 20%: flashing icon + sound. Fuel upgrades: larger tank (150, 200). Jerry can item: refuel anywhere once.' },
      { name: 'Traffic System', keywords: ['traffic', 'traffic light', 'road rules', 'npc cars', 'traffic system'],
        how: 'Traffic lights: Model with 3 Neon circles (red/yellow/green). Server cycles: Green(15s) → Yellow(3s) → Red(12s). Sync lights at intersections. NPC vehicles: pre-placed car Models on invisible rails (CFrame path via for loop of waypoints). NPCs stop at red lights (check nearest light state). Player running red: fine ($100 deducted), police notification. Road markings: Decals on road Parts (lane lines, stop lines, crosswalks).' },
      { name: 'Boat & Water Vehicle', keywords: ['boat', 'water vehicle', 'ship', 'sailboat', 'jet ski', 'water craft'],
        how: 'Boat Model with VehicleSeat. Float: BodyPosition constrained to water Y level (Heartbeat: if pos.Y < waterLevel, BodyPosition.Position = Vector3.new(pos.X, waterLevel, pos.Z)). Bobbing: slight Y oscillation via math.sin(tick()). Wake effect: ParticleEmitter at stern when moving. Speed: BodyVelocity in look direction * throttle. Turn: BodyAngularVelocity on Y axis. Anchor: toggle stops all forces. Damage from collision (check velocity on Touched).' },
      { name: 'Aircraft & Flying', keywords: ['airplane', 'aircraft', 'helicopter', 'fly', 'plane', 'flying vehicle'],
        how: 'Aircraft Model with VehicleSeat. Flight: BodyVelocity for thrust (forward = lookVector * speed), BodyGyro for orientation. Controls: W/S = pitch, A/D = roll, Q/E = yaw. Throttle: speed ramps 0→maxSpeed. Lift: if speed > stallSpeed, BodyForce counteracts gravity. Stall below stallSpeed: nose drops. Landing gear: toggle, Parts move down via TweenService. Engine sound: pitch scales with speed. Propeller: Part with CFrame rotation loop. Altitude HUD display.' },
    ],
  },

  // ════════════════════════════════════════════════════════════════════
  // WEATHER & TIME SYSTEMS
  // ════════════════════════════════════════════════════════════════════
  {
    name: 'Weather & Time Systems',
    systems: [
      { name: 'Dynamic Weather', keywords: ['weather', 'rain', 'snow', 'storm', 'weather system', 'dynamic weather'],
        how: 'Server weather state: Clear/Cloudy/Rain/Storm/Snow. Transition every 5-10 min (random). On change: RemoteEvent to all clients. Rain: ParticleEmitter attached to camera (falling blue dots, Rate=200). Storm: rain + Lightning (bright flash via ColorCorrection Brightness spike 0.5s + thunder Sound). Snow: white particles, slower fall. Fog: Atmosphere Density increases. Puddle decals appear during rain. Weather affects gameplay: rain = slippery (-20% traction), snow = slow (-10% speed).' },
      { name: 'Day/Night Cycle', keywords: ['day night', 'time cycle', 'sun', 'moon', 'day cycle', 'night cycle'],
        how: 'Server task.spawn loop: Lighting.ClockTime += 0.01 every 0.5s (1 full day = ~12 min real time). Dawn(5-7): warm ColorCorrection, birds Sound. Day(7-17): bright, full visibility. Dusk(17-19): orange tint. Night(19-5): dark, stars visible (SpaceTexture skybox), streetlamps auto-on (PointLight Enabled toggle), moon glow. Gameplay: nocturnal enemies spawn at night, shops close, different NPC dialogue. HUD clock display shows current time.' },
      { name: 'Wind System', keywords: ['wind', 'breeze', 'wind direction', 'wind effect', 'windy'],
        how: 'Server NumberValue "WindSpeed" (0-50) and Vector3Value "WindDirection". Affects: tree canopy Parts sway (CFrame oscillation scaled by wind), ParticleEmitter drift direction, flag Parts wave, player movement (slight push BodyVelocity in wind direction if WindSpeed > 30). Visual: leaf particles in air during high wind. Sound: wind howl volume scales with speed. Kite/sail items benefit from wind. Weather connection: storms = high wind.' },
      { name: 'Temperature System', keywords: ['temperature', 'heat', 'cold', 'freeze', 'overheat', 'thermal'],
        how: 'NumberValue "Temperature" per player. Biome-based: desert=hot, tundra=cold, normal=neutral. Exposure: temperature drifts toward biome temp over time. Effects: too cold(<20) = screen frost overlay (ImageLabel), movement slow, health drain. Too hot(>80) = heat shimmer overlay, stamina drain. Counter: warm clothing (equip reduces cold rate), cooling items. Camp fire: proximity warms player. HUD thermometer bar with blue-green-red gradient. Shelter (under roof) stabilizes temperature.' },
    ],
  },

  // ════════════════════════════════════════════════════════════════════
  // INVENTORY & EQUIPMENT ADVANCED
  // ════════════════════════════════════════════════════════════════════
  {
    name: 'Inventory & Equipment Advanced',
    systems: [
      { name: 'Equipment Slots', keywords: ['equipment', 'equip slot', 'armor slot', 'gear slot', 'equipment screen', 'wear gear'],
        how: 'Slots: Head, Chest, Legs, Boots, Weapon, Shield, Accessory1, Accessory2. ScreenGui character silhouette with slot frames around it. Drag item from inventory to slot (InputBegan drag, InputEnded drop). Server validates: item matches slot type, player owns item. On equip: apply stat bonuses (defense, speed, damage), attach visual Model to character (HumanoidDescription or welded accessory). Unequip: remove bonuses, remove visual. DataStore saves equipped item IDs.' },
      { name: 'Inventory Sorting', keywords: ['sort inventory', 'inventory sort', 'organize inventory', 'auto sort', 'inventory filter'],
        how: 'Sort buttons in inventory ScreenGui: "By Rarity" (Legendary first), "By Type" (weapons, armor, materials grouped), "By Recent" (newest first), "By Value" (highest sell price first). Sort function: table.sort with comparator per sort mode. Filter: search TextBox + category tabs (All, Weapons, Armor, Materials, Consumables). Filtered items hidden (Visible=false). Pinned items: star icon, always appear first regardless of sort.' },
      { name: 'Loot Crate / Chest', keywords: ['loot crate', 'chest', 'treasure chest', 'loot box', 'reward chest', 'open crate'],
        how: 'Chest Model in world or earned from quests. ProximityPrompt "Open Chest" or click in inventory. Server rolls N items from weighted loot table (1-5 items per chest). Animation: chest Model lid rotates open (TweenService CFrame), items fly out one by one (spawn Part, BodyVelocity upward, BillboardGui with name+rarity). ScreenGui reveal: items appear sequentially with rarity flash (gold for Legendary). Sound: creak open, item reveal chime escalating pitch. Duplicate protection optional.' },
      { name: 'Item Enchanting', keywords: ['enchant', 'enchanting', 'enchantment', 'imbue', 'enchant item', 'magic upgrade'],
        how: 'Enchanting table station with ProximityPrompt. ScreenGui: item slot + enchantment scroll slot + "Enchant" button. Enchantment scrolls: found as rare loot (Fire Enchant, Speed Enchant, Lifesteal Enchant). Each enchantment: adds special effect to weapon/armor. Fire: attacks burn (DoT 3s), Speed: +15% movement, Lifesteal: heal 10% of damage dealt. Items can have max 2 enchantments. Chance of failure (destroys scroll, not item): 20% base, reduced by Enchanting skill level.' },
      { name: 'Item Durability', keywords: ['durability', 'item break', 'repair', 'item condition', 'weapon durability'],
        how: 'NumberValue "Durability" per equipped item (max 100). Usage decreases: weapon attack=-1, armor hit taken=-1. At 0: item breaks (red flash, cracking sound), stats deactivated, must repair. Repair at blacksmith NPC: cost = item value * (1 - durability/100). Or use repair kit consumable (+50 durability). HUD shows durability bar per equipped item. Warning at 20%: icon flashes. Unbreakable trait on rare items.' },
      { name: 'Item Set Bonuses', keywords: ['set bonus', 'armor set', 'item set', 'collection bonus', 'matching gear'],
        how: 'Sets: groups of items (Dark Knight Helm + Chest + Legs + Boots). DataStore tracks equipped set pieces. On equip change: count matching set pieces. Bonuses: 2-piece=+10% HP, 3-piece=+15% damage, 4-piece=unique ability (e.g., shadow dash). ScreenGui set panel: shows all sets, owned pieces highlighted, bonus thresholds. Visual: full set = special aura ParticleEmitter. Mixing sets: only highest single set bonus applies (no stacking different sets).' },
    ],
  },

  // ════════════════════════════════════════════════════════════════════
  // TRANSPORTATION & TRAVEL
  // ════════════════════════════════════════════════════════════════════
  {
    name: 'Transportation & Travel',
    systems: [
      { name: 'Fast Travel / Waypoints', keywords: ['fast travel', 'waypoint', 'teleport point', 'travel point', 'warp'],
        how: 'Waypoint Parts in each zone with ProximityPrompt "Discover Waypoint". On discover: store waypointId in DataStore discoveredWaypoints table. SurfaceGui on waypoint shows zone name. ScreenGui map: click discovered waypoint → confirm teleport → CFrame player to waypoint position. Undiscovered waypoints: "???" on map. Cost: free or small coin fee per travel. Cooldown 10s between fast travels. Visual: beam of light at waypoint locations.' },
      { name: 'Train / Rail System', keywords: ['train', 'rail', 'railroad', 'subway', 'train station', 'railway'],
        how: 'Track: Parts forming rail path with CFrame waypoints. Train Model moves along waypoints (TweenService CFrame between points, constant speed). Stops at stations for 10s (doors open: Part slides via TweenService). Player boards: ProximityPrompt "Board Train", weld to seat. ScreenGui shows next stop + ETA. Multiple train lines (colors). Schedule: trains depart every 60s. Sound: horn on departure, rail clacking loop while moving. Station platform Model with bench + sign.' },
      { name: 'Mount System', keywords: ['mount', 'horse', 'ride mount', 'riding', 'mount system', 'rideable'],
        how: 'Mount Model with Humanoid (no health bar display). Mount in inventory. Summon: keybind (M) or ScreenGui button. Spawn mount at player position. Player sits: Seat in mount model. Mount WalkSpeed > player (32 vs 16). Dismount: jump key (destroy mount or store). Mount types: Horse(speed), Dragon(fly), Wolf(dash ability). Mount customization: saddle color, armor. Feed mount to keep happiness (affects speed). DataStore stores active mount + customizations.' },
      { name: 'Elevator System', keywords: ['elevator', 'lift', 'floor select', 'elevator system', 'go up'],
        how: 'Elevator Part platform with walls. Player steps on: ProximityPrompt "Call Elevator" or automatic via Touched. ScreenGui floor selector: buttons 1-N. On select: doors close (Parts slide inward via TweenService), platform moves to target Y (TweenService position, 3s per floor). Doors open at destination. Floor indicator: SurfaceGui number updates during travel. Sound: ding on arrival, hum while moving. Weight limit optional: max 4 players (count Touched humanoids).' },
    ],
  },

  // ════════════════════════════════════════════════════════════════════
  // BOSS & DUNGEON SYSTEMS
  // ════════════════════════════════════════════════════════════════════
  {
    name: 'Boss & Dungeon Systems',
    systems: [
      { name: 'Dungeon Generator', keywords: ['dungeon', 'procedural dungeon', 'random dungeon', 'dungeon crawl', 'roguelike'],
        how: 'Grid-based room generation: NxN grid, start room at center. Walk algorithm: random direction, place room if empty. Room templates: table of pre-built room Models (fight room, treasure room, puzzle room, boss room). Connect rooms with corridor Parts. Entrance at first room, boss at furthest room. Populate: enemies scale with dungeon level. Loot: better at deeper rooms. Reset on completion. Party enters together via TeleportService ReservedServer.' },
      { name: 'Boss Phases', keywords: ['boss phase', 'boss stage', 'boss mechanic', 'boss pattern', 'multi phase boss'],
        how: 'Boss Humanoid with high MaxHealth. Phase transitions at HP thresholds: Phase1(100-75%): basic attacks. Phase2(75-50%): new attack pattern + minion spawns. Phase3(50-25%): enrage (speed+damage up, red aura). Phase4(25-0%): desperation (AoE attacks, arena hazards). Each phase: different Animation set, different attack cooldowns, visual change (ParticleEmitter color shift). Transition: boss invulnerable 3s, dramatic pose, screen shake, phase announcement text.' },
      { name: 'Dungeon Loot Table', keywords: ['dungeon loot', 'dungeon reward', 'dungeon treasure', 'boss loot', 'dungeon drop'],
        how: 'Per-dungeon loot table: {boss:{items:[{name,chance,rarity}]}, chests:{items:[]}, mobs:{items:[]}}. Boss guaranteed 1+ drops. Chest: ProximityPrompt, rolls from chest table. Mob: roll on death. Difficulty scaling: higher dungeon level = better loot table (shift weights toward rarer items). First-clear bonus: extra guaranteed rare item on first dungeon completion. Weekly lockout on boss loot (prevents farming, DataStore tracks last clear timestamp).' },
      { name: 'Arena Wave Survival', keywords: ['wave survival', 'arena survival', 'horde mode', 'endless waves', 'survive waves'],
        how: 'Enclosed arena. Waves: enemyCount = 3 + wave * 2. Enemy HP scales: baseHP * (1 + wave * 0.2). Spawn from multiple spawn points around edges. Between waves: 15s rest, shop NPC appears (buy ammo/health). Boss wave every 5th wave. Scoring: kills + wave reached + time survived. Leaderboard for highest wave. Rewards: coins per wave, bonus at milestones (wave 10, 25, 50). Game over when all players dead. Revive tokens purchasable.' },
      { name: 'Raid Party System', keywords: ['raid', 'raid party', 'raid boss', 'raid group', 'group boss'],
        how: 'Raid requires party of 4-8 players. Queue at raid entrance: party leader initiates, all members confirm. TeleportService to ReservedServer raid instance. Raid: 3-5 rooms of trash mobs + 1 final boss. Roles: tank (taunt aggro), healer (group heal), DPS. Loot: personal (each player rolls own drops). Weekly lockout per raid tier. Raid difficulty tiers: Normal/Hard/Mythic with scaled HP/damage/rewards. Wipe (all dead) = restart from last checkpoint.' },
    ],
  },

  // ════════════════════════════════════════════════════════════════════
  // TUTORIAL & ONBOARDING
  // ════════════════════════════════════════════════════════════════════
  {
    name: 'Tutorial & Onboarding',
    systems: [
      { name: 'Step-by-Step Tutorial', keywords: ['tutorial', 'onboarding', 'new player', 'first time', 'tutorial system', 'guide'],
        how: 'DataStore BoolValue "TutorialComplete". On first join: tutorial sequence starts. Steps stored in ModuleScript: [{text, highlight:Instance, action:"click"|"move"|"interact", nextCondition}]. ScreenGui: dark overlay with cutout around highlighted element. Arrow indicator pointing at target. Text box at bottom with NPC avatar + instruction text. Advance on action completion. Skip button (set TutorialComplete=true). Reward on completion: starter pack items.' },
      { name: 'Hint / Tooltip System', keywords: ['hint', 'game hint', 'help tooltip', 'contextual hint', 'tip system'],
        how: 'Context-aware hints: if player stands still >15s near quest NPC → show hint "Talk to the NPC! Press E". If inventory full for 30s → "Your backpack is full! Visit the sell pad." Hints queue: table of pending hints, show one at a time. ScreenGui: bottom-center Frame slides up, auto-dismiss 5s. "Don\'t show again" checkbox stores preference in DataStore. Hint conditions checked via Heartbeat polling every 5s. Max 1 hint per 30s to avoid spam.' },
      { name: 'Quest Arrow / Waypoint Marker', keywords: ['quest arrow', 'waypoint marker', 'objective marker', 'quest marker', 'guide arrow'],
        how: 'Active quest has target position. ScreenGui: arrow ImageLabel always points toward target (math.atan2 between screen-projected target pos and center). If target off-screen: arrow at screen edge pointing toward it. If target visible: floating diamond marker above target (BillboardGui). Distance text "150m" updates each frame. Multiple markers: stack with priority (main quest = gold, side quest = silver, event = purple). Marker disappears on quest completion.' },
      { name: 'Practice Mode / Sandbox', keywords: ['practice', 'sandbox mode', 'training area', 'practice area', 'training dummy'],
        how: 'Dedicated zone with: training dummies (Humanoid models that regenerate HP, don\'t fight back), target range (targets at various distances for ranged practice), obstacle course (practice movement), crafting bench with free materials. No death penalty in zone. Stats don\'t count toward leaderboards. Entry: portal or ScreenGui button. Useful for testing new weapons/abilities before real combat. Timer shows how long practicing. NPC trainer gives combat tips.' },
    ],
  },

  // ════════════════════════════════════════════════════════════════════
  // COSMETICS & CUSTOMIZATION
  // ════════════════════════════════════════════════════════════════════
  {
    name: 'Cosmetics & Customization',
    systems: [
      { name: 'Skin / Outfit System', keywords: ['skin', 'outfit', 'costume', 'character skin', 'player skin', 'cosmetic skin'],
        how: 'Skins table: {id, name, rarity, shirtId, pantsId, bodyColors, accessories:[]}. DataStore stores owned skins + equipped skin. Apply: HumanoidDescription properties set from skin config. ScreenGui wardrobe: grid of owned skins with preview (ViewportFrame showing character with skin applied). Equip button. Skin sources: shop purchase, event reward, achievement unlock, crate drop. Preview before purchase. Favorite skins pinned to top.' },
      { name: 'Trail / Footprint Effect', keywords: ['trail', 'footprint', 'walk trail', 'movement trail', 'trail effect'],
        how: 'Trail instance attached between two Attachments on character (UpperBody top → LowerBody bottom). Trail properties: Color (ColorSequence), Lifetime 0.5s, Width 1. Trails unlocked via shop/achievements. Footprints: on each step (Humanoid.Running event), spawn flat Part at foot position (Debris 3s), Decal on top with footprint image. Trail selector ScreenGui: preview each trail type. Equip one at a time. Some trails: fire, rainbow, sparkle, ice, shadow.' },
      { name: 'Title / Name Tag', keywords: ['title', 'name tag', 'player title', 'name title', 'overhead title'],
        how: 'BillboardGui above character Head: TextLabel with player name + optional title below in smaller colored text. Titles earned from achievements, events, purchases. DataStore stores unlockedTitles table + equippedTitle. ScreenGui title selector: list with preview. Rarity-colored title text: Common=white, Rare=blue, Legendary=gold. Some titles animated: Rainbow cycles Hue, Glowing pulses transparency. Title sources: "Dragon Slayer" (defeat boss), "Whale" (spend 100K coins), "OG" (play since launch day).' },
      { name: 'Kill Effect', keywords: ['kill effect', 'death effect', 'elimination effect', 'kill animation'],
        how: 'On defeating enemy: custom visual effect plays at death location. Effect types: Explosion(default, ParticleEmitter burst), Disintegrate(character parts Transparency tween 0→1 sequentially), Freeze(character turns ice blue, shatters into Parts with BodyVelocity), Lightning(bolt strikes from above, flash), Black Hole(sphere shrinks, pulls nearby loose Parts). Equip via cosmetics ScreenGui. Earn from PvP milestones or shop. Sound per effect type.' },
      { name: 'Emote Dances', keywords: ['dance emote', 'custom dance', 'dance moves', 'emote dance', 'dance animation'],
        how: 'Dance catalog: {name, animationId, duration, looping, category}. Categories: Popular, Funny, Celebration, Classic. Trigger: /e dance or emote wheel. Play Animation with looping priority. Cancel on movement (Humanoid.MoveDirection.Magnitude > 0). Dance floor detection: if on Part tagged "DanceFloor", boost effect (disco lights, music syncs). Group dance: if 3+ players same dance within 10 studs, sync start + bonus XP. Purchasable dances via DevProduct.' },
      { name: 'Weapon Skins', keywords: ['weapon skin', 'gun skin', 'sword skin', 'weapon cosmetic', 'tool skin'],
        how: 'Each weapon base model has variant skins: different Texture/Color applied to Parts. Skins table: {weaponId, skinId, name, rarity, colors:{}, textures:{}}. Apply: iterate weapon model Parts, set BrickColor/Material per skin config. ScreenGui weapon skin selector: grid per owned weapon, click skin to preview in ViewportFrame. Skin does NOT change stats (cosmetic only). Sources: crate drops, battle pass, shop. "Inspect" view: rotate weapon model in 3D.' },
    ],
  },

  // ════════════════════════════════════════════════════════════════════
  // BATTLE PASS & PROGRESSION
  // ════════════════════════════════════════════════════════════════════
  {
    name: 'Battle Pass & Progression',
    systems: [
      { name: 'Battle Pass Track', keywords: ['battle pass', 'season pass', 'pass track', 'reward track', 'tier system'],
        how: 'Pass: 50 tiers. XP per tier: tier * 100. Free track: basic rewards at tiers 1,5,10,20,30,40,50. Premium track (DevProduct $4.99): reward at every tier + exclusive final reward. XP sources: daily quests, challenges, gameplay. ScreenGui: horizontal scrolling tier track, current tier highlighted, free/premium rows. Claim button on completed tiers. Season duration: 30 days. At season end: unclaimed rewards auto-granted, progress resets, new season content.' },
      { name: 'XP / Level System', keywords: ['xp', 'experience', 'level up', 'leveling', 'experience points', 'xp system'],
        how: 'IntValue "XP" and "Level" in leaderstats. XP to next level: level * 150. On XP gain: check if XP >= threshold → Level += 1, XP -= threshold, fire "LevelUp" RemoteEvent. Level up: full-screen golden flash, sound fanfare, "+1 Stat Point" popup. XP sources: quests(50-500), kills(10-50), crafting(5-20), exploration(25 per new area). HUD XP bar: filled portion with percentage text. Double XP events: server-wide multiplier for limited time.' },
      { name: 'Weekly Challenges', keywords: ['weekly challenge', 'weekly quest', 'weekly mission', 'weekly objective', 'challenge list'],
        how: 'Reset every Monday 00:00 UTC. 7 challenges generated from pool: {description:"Deal 5000 total damage", type:"cumulative_damage", target:5000, reward:{xp:500, coins:1000}}. Tracked server-side, progress synced via RemoteEvent. ScreenGui challenge tab: list with progress bars. Complete all 7: mega bonus (battle pass XP + exclusive item). Difficulty auto-scales with player level. Cannot reroll (prevents cherry-picking easy ones). Push notification when challenge completed.' },
      { name: 'Mastery / Skill Tree', keywords: ['skill tree', 'mastery', 'talent tree', 'perk tree', 'ability tree'],
        how: 'Tree structure: root → branches → nodes. Each node: {name, cost:skillPoints, effect, prerequisite:nodeId}. Skill points earned per level (1 per level). Categories: Combat(damage, crit, speed), Survival(HP, regen, defense), Utility(luck, gathering speed, XP bonus). ScreenGui: visual tree with connecting lines, nodes light up when purchased. Click node: preview effect + cost. Respec: costly reset of all points (coins or premium item). Max points < total nodes (forces specialization).' },
    ],
  },

  // ════════════════════════════════════════════════════════════════════
  // MAP & ZONE DESIGN
  // ════════════════════════════════════════════════════════════════════
  {
    name: 'Map & Zone Design',
    systems: [
      { name: 'Spawn Plaza', keywords: ['spawn', 'spawn area', 'spawn plaza', 'starting area', 'hub area'],
        how: 'Central hub at (0,0,0). Circular plaza (Marble material, 40 stud radius). Features: fountain Model in center, 4 directional paths leading to game zones, NPC shops around edges, leaderboard displays, noticeboard SurfaceGui with announcements, portal arches to each zone. Safe zone: no damage, no PvP. Ambient music: calm loop. Lighting: bright, welcoming (Atmosphere low density, warm ColorCorrection). SpawnLocation Parts spread around plaza.' },
      { name: 'Zone Transition / Portal', keywords: ['zone portal', 'zone transition', 'area portal', 'zone gate', 'biome portal'],
        how: 'Portal Model: stone arch frame + swirling ParticleEmitter inside (circular motion, zone-themed color). SurfaceGui: zone name + level requirement + "Enter" label. ProximityPrompt "Enter {ZoneName}". Server: validate player level >= zoneMinLevel. On enter: screen fade to black (TweenService ScreenGui overlay Transparency 0→1→0), CFrame player to zone spawn point. Loading text during transition. Each zone: distinct Lighting, Terrain, ambience. Return portal in each zone back to hub.' },
      { name: 'Safe Zone / No-PvP Area', keywords: ['safe zone', 'no pvp', 'peaceful zone', 'protected area', 'no combat zone'],
        how: 'Invisible Part zone with tag "SafeZone". Player enters (Touched or magnitude check): set BoolValue "InSafeZone"=true. While in safe zone: damage events check attacker/target safe zone status, if either is in safe zone → cancel damage. Visual: border glow (Neon ring at ground level, green). HUD indicator: shield icon when in safe zone. NPC shops only in safe zones. PvP flagging: player can toggle PvP outside safe zone, cannot toggle inside.' },
      { name: 'Hidden / Secret Area', keywords: ['hidden area', 'secret area', 'secret room', 'hidden room', 'easter egg location'],
        how: 'Disguised entrance: breakable wall (looks identical to surroundings but has ClickDetector or lower HP), underwater cave, behind waterfall (walk through transparent Part). Secret area contains: exclusive chest, rare NPC, unique item, lore text SurfaceGui. Discovery: DataStore stores found secrets per player. Achievement: "Explorer" for finding all secrets. Hints: NPC dialogue mentions "strange wall in the cave" vaguely. No map marker (truly hidden). Community discovers and shares.' },
      { name: 'Destructible Environment', keywords: ['destructible', 'breakable wall', 'destroy environment', 'break objects', 'destroyable'],
        how: 'Breakable objects: tagged Parts with IntValue "HP" and BoolValue "Breakable". On hit by weapon: HP -= damage. Crack decals appear at HP thresholds (75%, 50%, 25%). At 0: shatter into 5-10 small Parts (random sizes, BodyVelocity outward, Debris 3s). Drop loot from loot table. Respawn after 120s (clone from template in ServerStorage). Types: crates(5HP, common loot), boulders(20HP, stone/ore), walls(50HP, passage behind). Sound: wood crack, stone crumble, glass shatter per material.' },
    ],
  },

  // ════════════════════════════════════════════════════════════════════
  // TOWER DEFENSE ADVANCED
  // ════════════════════════════════════════════════════════════════════
  {
    name: 'Tower Defense Advanced',
    systems: [
      { name: 'Tower Placement Grid', keywords: ['tower placement', 'tower grid', 'place tower', 'tower spot', 'td placement'],
        how: 'Path defined by CFrame waypoints. Placeable area: grid of cells (4x4 stud each) adjacent to path. Ghost preview: transparent tower Model follows mouse position, snapped to grid. Green=valid, Red=invalid (on path, on existing tower, out of range). Click to place: RemoteEvent "PlaceTower" with gridPos + towerType. Server validates: cell empty, player has coins. Spawn tower model at grid position. DataStore per match (not persistent). Sell: click tower, "Sell" button returns 75% cost.' },
      { name: 'Tower Upgrade System', keywords: ['tower upgrade', 'upgrade tower', 'tower level', 'tower path', 'td upgrade'],
        how: 'Each tower has 3 upgrade paths (e.g., Damage, Range, Special). Max 5 levels per path. Cost escalates: baseCost * 1.5^level. Click placed tower → ScreenGui upgrade panel: 3 buttons with cost + effect preview. Server validates coins, increments tower level. Visual per level: size slightly larger, color shift, particle effect at max level. Level 5 of any path: ultimate ability (e.g., Damage path 5: double shot). Cannot max all 3 paths (force choice: max 2 paths fully).' },
      { name: 'Enemy Waves & Spawning', keywords: ['enemy wave', 'wave spawn', 'td wave', 'mob wave', 'spawn wave'],
        how: 'Wave config table: [{wave:1, enemies:[{type:"Zombie", count:10, interval:1s, hp:100}]}, {wave:5, enemies:[{type:"Boss", count:1, hp:5000}]}]. Between waves: 15s prep time (countdown timer). Spawn: clone enemy model from ServerStorage, set Humanoid HP, start pathfinding along waypoints. Enemy reaches end: lives -= 1 (IntValue "Lives", starts at 20). Game over at 0 lives. Wave indicator: "Wave 5/30" in HUD. Fast-forward button: skip prep time.' },
      { name: 'TD Enemy Types', keywords: ['td enemy', 'enemy type', 'fast enemy', 'armored enemy', 'flying enemy', 'td mob'],
        how: 'Enemy types: Normal(standard speed/HP), Fast(2x speed, low HP), Armored(0.5x speed, 3x HP, reduces tower damage by flat amount), Flying(ignores ground path, goes straight to end — only anti-air towers hit them), Healer(heals nearby enemies +5HP/s), Splitter(on death spawns 2 mini versions), Boss(huge HP, periodic shield 5s). Each type: distinct model, BillboardGui type icon. Spawn mixed types in later waves. Type-specific tower bonuses (fire tower 2x vs armored).' },
      { name: 'Tower Types', keywords: ['tower type', 'archer tower', 'cannon tower', 'ice tower', 'td tower'],
        how: 'Tower catalog: Archer(fast, single target, low damage, cheap), Cannon(slow, AoE splash, medium damage), Ice(slow enemies in range by 50%, no damage), Lightning(chain hits 3 targets, moderate damage), Sniper(huge range, high damage, very slow), Farm(generates coins per wave, no attack), Mortar(hits ground area after delay, high damage). Each tower: distinct model + attack animation + sound. Balance: no single tower wins — combine types for synergy.' },
      { name: 'TD Economy & Lives', keywords: ['td economy', 'tower defense money', 'td coins', 'td lives', 'td income'],
        how: 'Starting coins: 500. Earn coins: per enemy kill (value = enemyHP / 10), wave completion bonus (wave * 50), farm tower income. Spend: place towers + upgrades. Lives start at 20. Lost per leak: 1 for normal, 2 for boss. Gain lives: rare, only from specific milestones or items. No-leak bonus: +100 coins if entire wave killed. Economy display in HUD: coins + lives prominently shown. Interest: between waves, earn 5% of current coins as interest (incentivizes saving).' },
    ],
  },

  // ════════════════════════════════════════════════════════════════════
  // SURVIVAL GAME SYSTEMS
  // ════════════════════════════════════════════════════════════════════
  {
    name: 'Survival Game Systems',
    systems: [
      { name: 'Hunger & Thirst', keywords: ['hunger', 'thirst', 'food bar', 'water bar', 'survival needs', 'starve'],
        how: 'NumberValues "Hunger" and "Thirst" (max 100, start 100). Heartbeat drain: -1 every 10s (hunger), -1.5 every 10s (thirst). Running drains faster (2x rate). At 0 hunger: health drain -2/s. At 0 thirst: health drain -3/s + screen desaturation. Eat food: hunger += foodValue (Apple=20, Steak=50). Drink: thirst += drinkValue (Water=30, Juice=50). HUD: two vertical bars (brown=hunger, blue=thirst). Warning sound at 20%. Cooking increases food value 2x raw value.' },
      { name: 'Shelter Building', keywords: ['shelter', 'build shelter', 'survival base', 'survival building', 'camp'],
        how: 'Craft building pieces: Wall(10 Wood), Floor(8 Wood), Roof(12 Wood), Door(6 Wood + 2 Metal). Place mode: ghost piece follows mouse, snaps to grid, snaps to existing pieces (proximity check). Server validates placement + material cost. Shelter benefits: blocks rain (no "Wet" debuff), sleeping bag inside (time skip + heal), storage chest (persistent DataStore inventory). Decay: structures lose 1 HP/hour if not maintained (repair with materials). Raiders: other players can break structures (PvP server).' },
      { name: 'Campfire / Warmth', keywords: ['campfire', 'fire', 'warmth', 'torch', 'camp fire', 'keep warm'],
        how: 'Craft Campfire: 5 Wood + 2 Stone. Place in world. Fire: PointLight (warm orange, Range 15) + ParticleEmitter (fire particles). Warmth radius: 12 studs. Players within radius: temperature increases toward comfortable zone. Cooking: ProximityPrompt on campfire "Cook" when holding raw food → cooked food (better stats). Fuel: burns 5 minutes per Wood added (ProximityPrompt "Add Fuel"). No fuel = fire dies (light off, no warmth). Torch: portable, 3 min fuel, held as Tool.' },
      { name: 'Resource Gathering (Survival)', keywords: ['chop tree', 'gather wood', 'mine stone', 'survival resource', 'survival gather'],
        how: 'Trees: Parts with IntValue "Wood" (5-15). Axe tool: Activate → raycast → if tree Part, Wood -= 1, grant 1 Wood. At 0: tree falls (Part anchored=false, BodyVelocity push), Debris 5s. Stump remains, tree regrows in 120s. Rocks: similar with Pickaxe, drops Stone/Flint/Ore. Bushes: hand-gather (ProximityPrompt "Forage"), drops Berries/Fiber. Each resource: specific Tool required (or hand-gather at 3x time). Gathering animation per tool type. Sound: chop, clink, rustle.' },
      { name: 'Day/Night Survival', keywords: ['night survival', 'survive night', 'night danger', 'night time survival', 'darkness danger'],
        how: 'Day: safe, gather resources, build. Night (Lighting.ClockTime 19-5): hostile mobs spawn (Zombies/Wolves) in darkness away from light sources. Mob spawn rate increases each night (night 1: 5 mobs, night 10: 20 mobs). Light sources prevent spawning within radius (campfire=15 studs, torch=8, lamp=20). Player in complete darkness: "Fear" effect (screen vignette darkens, heartbeat sound, movement speed -20%). Survive night: morning reward chest spawns at base. Night counter in HUD.' },
      { name: 'Crafting Recipes (Survival)', keywords: ['survival craft', 'craft weapon', 'craft tool', 'survival recipe', 'primitive craft'],
        how: 'Progression: Stone Age → Metal Age → Advanced. Early crafts: Stone Axe(2 Stone + 3 Wood), Campfire(5 Wood + 2 Stone), Bandage(3 Fiber). Metal: Iron Axe(2 Iron Bar + 2 Wood, requires forge), Sword(3 Iron Bar + 1 Wood), Armor(5 Iron Bar). Advanced: Gun(5 Metal + 2 Gunpowder + 1 Glass), Radio(3 Metal + 2 Wire + 1 Battery). Recipe book ScreenGui: tabs per age, locked until materials found. Auto-unlock recipe when holding all required ingredients. Craft time: 1-10s with progress bar.' },
      { name: 'Status Effects (Survival)', keywords: ['bleeding', 'infection', 'cold', 'wet', 'broken bone', 'survival status'],
        how: 'Status effects: Bleeding(-2HP/s until bandaged), Infection(from zombie hit, -1HP/s, cured by Medicine), Cold(below freezing biome, -1HP/s + slow, warmed by fire), Wet(in rain without shelter, reduces warmth rate), Broken Bone(from fall damage > 50%, WalkSpeed halved, cured by Splint). Active effects: icon strip in HUD with timers. Multiple can stack. Some effects apply others (Wet→Cold faster). Anti-poison, anti-bleed, anti-infection items craftable. Sound: specific per status (shivering, heartbeat, dripping).' },
    ],
  },

  // ════════════════════════════════════════════════════════════════════
  // MARKETPLACE & TRADING ADVANCED
  // ════════════════════════════════════════════════════════════════════
  {
    name: 'Marketplace & Trading Advanced',
    systems: [
      { name: 'Player Shops / Stalls', keywords: ['player shop', 'player stall', 'player store', 'set up shop', 'vendor stall'],
        how: 'Player rents stall in marketplace zone (ProximityPrompt "Rent Stall - $500/day"). Stall Model with SurfaceGui sign (customizable name). Owner stocks items from inventory: ScreenGui drag items to stall slots, set price per item. Buyers: ProximityPrompt "Browse Shop" → ScreenGui showing stall items with prices. Buy: coins transfer seller→buyer automatically (even offline). Revenue stored in DataStore "PendingRevenue", collected on login. Max 6 items per stall. Stall expires if rent unpaid.' },
      { name: 'Trade Verification', keywords: ['trade verify', 'trade confirm', 'safe trade', 'trade window', 'secure trade'],
        how: 'Two-panel trade ScreenGui: left=your offer, right=their offer. Both players drag items from inventory to offer panel. "Ready" checkbox per player. Both ready: 5s countdown + final confirmation dialog ("CONFIRM TRADE? You give: X, You receive: Y"). Server atomic swap: in single pcall, remove items from both, add crossed items. If either side fails: full rollback. Trade log in DataStore: {timestamp, player1, player2, items1, items2}. Anti-scam: last-second item removal resets countdown. Value warning if trade is heavily lopsided.' },
      { name: 'Price History / Graphs', keywords: ['price history', 'price graph', 'item history', 'price tracker', 'market graph'],
        how: 'Track every sale: DataStore "PriceHistory" per item stores last 100 sales {price, timestamp}. ScreenGui graph: X=time, Y=price. Draw with Frame bars (height = normalized price). Average price line: mean of last 20 sales. Trend indicator: arrow up (price rising) or down (falling). Time periods: 1 day, 7 days, 30 days. Help players know fair price. Tooltip on hover shows exact sale price + date. Accessible from auction house item detail view.' },
      { name: 'Escrow / Middleman', keywords: ['escrow', 'middleman', 'secure payment', 'trade escrow', 'safe exchange'],
        how: 'For high-value trades: escrow system. Both parties deposit items/coins into escrow (server holds temporarily in DataStore "EscrowHolds"). 24h review period: either party can cancel (full refund). After 24h: if both confirmed, complete exchange. If disputed: admin review queue. Escrow fee: 2% of total value (anti-abuse). ScreenGui escrow panel: status tracker (Deposited → Review → Complete/Cancelled). Notification on status change.' },
    ],
  },

  // ════════════════════════════════════════════════════════════════════
  // SPORTS & ATHLETICS
  // ════════════════════════════════════════════════════════════════════
  {
    name: 'Sports & Athletics',
    systems: [
      { name: 'Soccer / Football', keywords: ['soccer', 'football', 'kick ball', 'soccer game', 'football game', 'goal'],
        how: 'Ball Part (Ball shape, CanCollide true, CustomPhysicalProperties low friction). Kick: player Touched + moving toward ball → BodyVelocity in player look direction * kickPower. Goals: Part trigger zones at each end. Ball enters goal zone (Touched): score +1 for scoring team, ball reset to center. Two teams (Team objects). Match timer: 300s. Scoreboard SurfaceGui. Offside optional. Goalkeeper NPC or player. Sound: kick thud, crowd cheer on goal, whistle on start/end.' },
      { name: 'Basketball', keywords: ['basketball', 'hoop', 'shoot ball', 'basketball game', 'dunk'],
        how: 'Ball Part (Ball shape). Pick up: ProximityPrompt on ball, welds to hand. Shoot: keybind (LMB), release ball with BodyVelocity = lookVector * power + upVector * arcHeight. Power: hold duration (0.5-2s) determines force. Hoop: Part ring with net mesh, goal detection (ball passes through cylinder Region3 above rim). Dunk: if within 3 studs of hoop, jump + click = slam animation, guaranteed score. 2-point/3-point line distance check. Shot clock: 24s timer per possession.' },
      { name: 'Swimming / Water Sports', keywords: ['swim', 'swimming', 'water sport', 'dive', 'underwater', 'pool'],
        how: 'Water zone: transparent blue Part (CanCollide false) at water level. Player enters water: switch to swim mode (Humanoid.FloorMaterial == nil + position.Y < waterLevel). Swim controls: WASD moves horizontally, Space = ascend, Shift = descend. Speed: WalkSpeed * 0.6 in water. Breath: NumberValue "Oxygen" 100, drains -5/s underwater, refills instantly at surface. At 0: health drain -10/s. HUD oxygen bar when underwater. Swim animation. Splash ParticleEmitter on surface entry.' },
      { name: 'Parkour / Freerunning', keywords: ['parkour', 'freerun', 'wall run', 'wall jump', 'vault', 'parkour system'],
        how: 'Wall run: raycast sideways while jumping near wall → apply BodyVelocity along wall + slight upward for 1s. Wall jump: during wall run, jump launches perpendicular + up. Vault: running toward waist-height obstacle (raycast forward, hit height < 4 studs) → auto-vault animation (character lifts over). Ledge grab: raycast forward hits ledge at head height → hang (WalkSpeed=0, BodyPosition at ledge), press Space to climb up. Speed momentum: chaining moves preserves speed. Visual: dust puffs on land.' },
      { name: 'Archery Range', keywords: ['archery', 'bow arrow', 'archery range', 'target practice', 'archery game'],
        how: 'Bow Tool: hold click to draw (power increases 0→100 over 2s, bow animation bends). Release: spawn Arrow Part with BodyVelocity = lookVector * power * 2. Arrow gravity: BodyForce downward simulates arc. Arrow Touched: stick into surface (Anchor=true, CFrame adjusted to face velocity direction). Target boards at various distances: ring zones (bullseye=100pts, inner=50, outer=25). SurfaceGui shows score. Round: 10 arrows, total score tracked. Leaderboard for best round.' },
    ],
  },

  // ════════════════════════════════════════════════════════════════════
  // EDUCATION & LEARNING GAMES
  // ════════════════════════════════════════════════════════════════════
  {
    name: 'Education & Learning Games',
    systems: [
      { name: 'Quiz / Trivia System', keywords: ['quiz', 'trivia', 'question', 'quiz game', 'trivia game', 'knowledge'],
        how: 'Question bank ModuleScript: [{question:"What is 7*8?", options:["54","56","58","62"], correct:2}]. Round: display question on large SurfaceGui or ScreenGui. 4 answer pads on ground (Parts with BillboardGui showing option). Stand on pad to answer. Timer: 15s per question. Correct: +100 points, green flash. Wrong: 0 points, red flash, show correct answer. 10 questions per round. Leaderboard at end. Categories: Math, Science, History, Roblox. Random order, no repeats per game.' },
      { name: 'Typing Speed Challenge', keywords: ['typing', 'typing speed', 'type race', 'typing game', 'typing challenge'],
        how: 'ScreenGui: TextLabel shows target sentence. TextBox below for player input. Timer starts on first keystroke. Track: WPM = (charCount/5) / (timeElapsed/60). Accuracy = correctChars / totalChars * 100. Color feedback: typed chars turn green (correct) or red (wrong). Complete sentence: show WPM + accuracy. Leaderboard: highest WPM with >95% accuracy. Difficulty levels: Easy(common words), Medium(longer words), Hard(technical terms). Race mode: multiple players type same sentence, progress bars show positions.' },
      { name: 'Puzzle Solving', keywords: ['puzzle', 'puzzle game', 'brain teaser', 'logic puzzle', 'riddle'],
        how: 'Puzzle types: Sliding tile (3x3 grid, one empty slot, click adjacent to swap, solve image), Pattern sequence (show 3 shapes, pick 4th from options), Maze (overhead camera, navigate Part character through), Code lock (find clues in room to get 4-digit code). Each puzzle: ProximityPrompt to start, ScreenGui interface, timer, hints available (costs coins, 3 hints max). Complete: reward chest + puzzle XP. Daily puzzle: new puzzle each day, streak bonus. Difficulty adaptive: easier if player fails 3x.' },
      { name: 'Memory Match Game', keywords: ['memory game', 'match game', 'card flip', 'memory match', 'pair matching'],
        how: 'Grid of face-down card Parts (4x4 = 8 pairs). Click card (ClickDetector): flip over (TweenService rotate 180°, show face Decal). Click second card: if match → both stay face-up, ParticleEmitter sparkle, +10 points. No match: both flip back after 1s. Track moves count. Timer optional. Win: all pairs found. Scoring: fewer moves = more points. Multiplayer: take turns, player with most pairs wins. Card themes: animals, fruits, Roblox items. Difficulty: 4x4, 5x5, 6x6 grids.' },
    ],
  },

  // ════════════════════════════════════════════════════════════════════
  // MUSIC & RHYTHM GAMES
  // ════════════════════════════════════════════════════════════════════
  {
    name: 'Music & Rhythm Games',
    systems: [
      { name: 'Rhythm / Beat Game', keywords: ['rhythm', 'beat', 'music game', 'rhythm game', 'note hit', 'beat saber'],
        how: 'Notes fall from top of screen toward hit zone at bottom (4 lanes: D,F,J,K keys). ScreenGui: 4 lane Frame columns. Note = ImageLabel moving downward (TweenService Y position). Hit zone: highlighted row at bottom. On key press: check if note within ±0.15s of hit zone. Perfect(±0.05s)=300pts, Great(±0.1s)=200pts, Good(±0.15s)=100pts, Miss=0+combo reset. Combo multiplier: streak of non-miss hits. Sound: note sound on hit. Song: table of {time, lane} beat entries synced to Sound object.' },
      { name: 'DJ / Music Mixer', keywords: ['dj', 'music mixer', 'music maker', 'mix music', 'beat maker', 'sound board'],
        how: 'ScreenGui sound board: grid of buttons (4x4), each mapped to a Sound (kick, snare, hihat, bass, synth, etc.). Click button: play Sound. Loop toggle: button stays active, Sound loops. Volume slider per sound. Record button: captures button presses with timestamps into sequence table. Playback: iterate sequence, fire sounds at recorded times. Save/load beats in DataStore. Share: play to nearby players (RemoteEvent broadcasts sequence, recipients play sounds locally). BPM slider adjusts playback speed.' },
      { name: 'Concert / Stage System', keywords: ['concert', 'stage', 'performance', 'music stage', 'live performance'],
        how: 'Stage Model: elevated platform, speaker Models on sides, spotlight Parts (SpotLight instances, colored, aim at center stage). Performer steps on stage: triggered "Performance Mode" — camera angles shift for audience, stage lights activate (cycling colors via task.spawn loop). Instruments: Guitar/Drums/Piano Tools with playing animations. Audience area: seats, glow sticks (Neon Part toggled by keybind). Applause: after performance, audience press E for clap sound. Tip jar: coins donated to performer.' },
      { name: 'Dance Floor System', keywords: ['dance floor', 'disco', 'dance party', 'dance floor lights', 'dance club'],
        how: 'Floor: grid of Parts (8x8). Color cycle: task.spawn loop changes each Part BrickColor randomly every 0.5s (staggered for wave effect). Overhead disco ball: reflective Ball Part rotating (CFrame:Angles loop) with SpotLight. Music: Sound object with playlist (queue of SoundIds). Song controls: SurfaceGui on DJ booth (play/pause/skip/volume). Players on floor: auto-play dance animation if standing still > 3s. Light show: synchronized color changes with beat (analyze Sound.PlaybackLoudness).' },
    ],
  },

  // ════════════════════════════════════════════════════════════════════
  // STEALTH & INFILTRATION
  // ════════════════════════════════════════════════════════════════════
  {
    name: 'Stealth & Infiltration',
    systems: [
      { name: 'Line of Sight / Vision Cones', keywords: ['vision cone', 'line of sight', 'los', 'guard vision', 'sight detection', 'patrol vision'],
        how: 'Guard NPCs have vision cone: angle (60°) and range (30 studs). Server Heartbeat: for each guard, check all players: calculate angle between guard lookVector and direction to player (dot product). If angle < coneAngle/2 AND distance < range AND raycast unobstructed → player DETECTED. Visual: optional transparent cone Part for debug (Transparency 0.7, yellow). Detection states: Unaware → Suspicious (yellow, investigate) → Alert (red, chase). Detection meter fills gradually, resets when out of sight.' },
      { name: 'Noise System', keywords: ['noise', 'sound detection', 'stealth noise', 'footstep noise', 'loud noise'],
        how: 'Each player action has noise value: walking=1, running=3, jumping=5, shooting=10, breaking glass=8. Guards check noise: if noise source within hearingRange (20 studs), alert level increases. Crouching: noise halved. Carpet/grass surface: noise halved again. Noisy environment (machinery): masks noise below threshold. Visual: expanding ring Part at noise origin (Transparency 0.5→1 over 1s, size expands). HUD noise meter: bar shows current noise level. Silent takedown: kills without noise if from behind.' },
      { name: 'Security Camera System', keywords: ['security camera', 'cctv', 'camera system', 'surveillance', 'camera detection'],
        how: 'Camera Models mounted on walls: rotating Part (CFrame:Angles loop, sweeps 90° arc over 5s, then back). Detection: same cone check as guards but from camera position/angle. On detect: alarm triggers (Sound, all guards enter Alert state, doors lock for 30s). Counter: disable camera by shooting/hacking (ProximityPrompt hold 5s from behind). Camera room: player can hack to see all camera ViewportFrames + disable remotely. Visual: red PointLight on active camera, green when disabled. Loop hole: timing the sweep to pass through gap.' },
      { name: 'Disguise System', keywords: ['disguise', 'costume stealth', 'blend in', 'undercover', 'stealth disguise'],
        how: 'Find disguise items in environment: Guard Uniform, Lab Coat, Janitor Outfit. Equip: HumanoidDescription changes to match NPC type. While disguised: guards ignore you (skip detection check if player wearing matching zone disguise). Restrictions: cannot run (breaks disguise), cannot use weapons (breaks disguise), must stay in appropriate zone (guard uniform only works in guard areas). Timer: disguise lasts 120s or until broken. ScreenGui shows disguise timer + warning when near wrong zone.' },
    ],
  },

  // ════════════════════════════════════════════════════════════════════
  // ECONOMY SIMULATION
  // ════════════════════════════════════════════════════════════════════
  {
    name: 'Economy Simulation',
    systems: [
      { name: 'Supply & Demand', keywords: ['supply demand', 'dynamic pricing', 'market simulation', 'price fluctuation', 'economy sim'],
        how: 'Each item has supply (total in circulation) and demand (purchases per hour). Price formula: basePrice * (demand/supply) clamped to [0.5x, 5x]. Server recalculates every 5 minutes. High demand + low supply = price spikes. Market crash: if supply exceeds demand 10x, price tanks to floor. SurfaceGui market board: shows top items with price arrows (up/down/stable). Players influence: selling floods supply, buying increases demand. Savvy players buy low, sell high. Historical price graph.' },
      { name: 'Job / Employment System', keywords: ['job', 'employment', 'work', 'career', 'job system', 'occupation'],
        how: 'Jobs: Miner, Fisher, Chef, Guard, Merchant, Builder. Apply at job board NPC. Each job: specific tasks (Miner: mine N rocks/day, Guard: patrol route). Job pays salary every 60s (scales with job level 1-10). Job XP: completing tasks levels up job, increasing salary + unlocking perks. Switch jobs: 24h cooldown. Job uniform: HumanoidDescription changes while working. Perk examples: Miner gets 2x ore, Fisher catches faster, Chef cooks instantly. ScreenGui job panel: current job, tasks, XP progress, salary info.' },
      { name: 'Real Estate System', keywords: ['real estate', 'buy house', 'property market', 'rent income', 'property value'],
        how: 'Properties: pre-built houses/shops in world. Each property: DataStore stores {owner, value, rentPrice}. Buy: at Property NPC, pay listed price. Own: collect rent from NPC tenants every hour (passive income). Property value fluctuates: +5% each time someone buys a property in same zone, -2% each time someone sells. Upgrade property (costs coins): increases rent and value. Sell property: get current market value. Max 3 properties per player. SurfaceGui on each property shows status. Eviction: if owner doesn\'t log in for 7 days, property goes back to market.' },
      { name: 'Business / Company System', keywords: ['business', 'company', 'start business', 'run business', 'entrepreneur'],
        how: 'Create business: 5000 coins + business license. Business types: Shop(sell items to players), Factory(produce items automatically), Service(complete tasks for others). ScreenGui business dashboard: revenue, expenses, inventory, employees (hire NPC workers, salary cost). Revenue: automatic NPC customers buy from shop every 5 minutes (rate scales with location + quality). Upgrades: better location, advertising (increases customer rate), larger inventory. Profit = revenue - salary - rent. Compete with other player businesses in same category.' },
    ],
  },

  // ════════════════════════════════════════════════════════════════════
  // BUILDING TOOLS & SANDBOX CREATIVE
  // ════════════════════════════════════════════════════════════════════
  {
    name: 'Building Tools & Sandbox Creative',
    systems: [
      { name: 'Block Placement (Minecraft-style)', keywords: ['block place', 'block building', 'voxel', 'block game', 'block world', 'place block'],
        how: 'Grid-based: 4x4x4 stud blocks. Hotbar: 9 slots with different block types (Grass, Stone, Wood, Glass, etc.). Place: raycast from camera, highlight target face (ghost block preview), click to place block at grid position. Remove: right-click on block, destroy with breaking animation (crack decals, Part debris). Block inventory: carry max 999 of each type. Craft blocks from materials. Save player builds in DataStore as table of {pos, blockType}. Load on join. Creative mode: unlimited blocks.' },
      { name: 'Paint / Color Tool', keywords: ['paint tool', 'color tool', 'paint block', 'color block', 'painting'],
        how: 'Tool mode: Color Picker ScreenGui (HSV wheel + brightness slider). Click any owned Part: BrickColor changes to selected color. Material picker: dropdown (Concrete, Wood, Brick, Metal, etc.), click Part to change Material. Cost: free in creative, 1 coin per Part in survival. Eyedropper: hold Alt + click Part = copy its color+material. Fill: hold Shift + click = change all connected Parts of same color. Undo: Ctrl+Z reverts last 10 color changes (stack in table).' },
      { name: 'Resize / Transform Tool', keywords: ['resize tool', 'scale tool', 'move tool', 'rotate tool', 'transform tool'],
        how: 'Select Part (click). Handles appear: Move(arrow handles on X/Y/Z axes), Rotate(circle handles around axes), Scale(box handles at corners). Drag handle: TweenService updates Part CFrame/Size in real-time. Grid snap: configurable (1, 0.5, 0.25 studs). Rotation snap: 15° increments. Constraints: minimum size 0.5, maximum 100 studs per axis. Multi-select: hold Shift + click multiple Parts. Group move: all selected move together preserving relative positions. Undo/redo stack.' },
      { name: 'Blueprint / Copy-Paste', keywords: ['blueprint', 'copy paste', 'duplicate build', 'save build', 'template build'],
        how: 'Select region: click two corners to define 3D box. Copy: serialize all Parts inside box as table {relativePos, size, color, material, name}. Paste: ghost preview of entire build follows mouse, click to place at cursor. Rotate before placing: R key rotates 90°. Save as blueprint: named template in DataStore "Blueprints". Share blueprints: code system (8-char random code). Load blueprint: enter code, preview in ViewportFrame, place in world. Blueprint limits: max 200 Parts per blueprint.' },
      { name: 'Weld / Constraint Tool', keywords: ['weld tool', 'constraint', 'hinge', 'spring', 'joint tool'],
        how: 'Connect Parts with physics constraints. Select tool type: Weld(rigid join), Hinge(rotation axis), Spring(bouncy connection), Rope(flexible hanging). Click Part A, then click Part B: create constraint between them. Hinge: set axis by clicking face of Part A. Spring: adjust stiffness/damping in properties panel. Rope: set length. Delete constraint: click constraint visualization (beam/indicator). Group constraints: all constraints in a Model travel together. Test: toggle physics simulation to see constraints in action.' },
    ],
  },

  // ════════════════════════════════════════════════════════════════════
  // COLLECTION & COMPLETIONIST
  // ════════════════════════════════════════════════════════════════════
  {
    name: 'Collection & Completionist',
    systems: [
      { name: 'Card Collection', keywords: ['card collect', 'trading card', 'card game', 'card pack', 'card collection'],
        how: 'Cards: {id, name, rarity, image, stats:{attack,defense}, set}. Card packs: DevProduct or in-game currency, contains 5 random cards (weighted). Collection book ScreenGui: grid showing all cards, owned highlighted, unowned grayed. Completion by set: full set = bonus (e.g., complete "Dragon Set" = exclusive dragon pet). Card trading between players via trade system. Card battling: simple compare stats, higher wins. Duplicate cards: combine 5 dupes = upgrade to next rarity. Total collection progress percentage displayed.' },
      { name: 'Stamp / Sticker Album', keywords: ['stamp', 'sticker', 'album', 'collect stamp', 'sticker book', 'stamp book'],
        how: 'Stamps earned from: visiting locations (auto-grant on enter zone), completing challenges, beating bosses, seasonal events. Album ScreenGui: page layout with empty stamp slots. Earned stamps: ImageLabel fills slot with stamp graphic. Stamps per category: Exploration, Combat, Social, Events. Page completion: fill entire page = reward. Full album = ultimate reward + permanent title. Stamps are permanent (never lost). BillboardGui on stamp locations shows stamp icon before collection. Sound: satisfying stamp press on earn.' },
      { name: 'Creature Compendium', keywords: ['compendium', 'bestiary', 'creature log', 'enemy log', 'monster index'],
        how: 'Every enemy/creature encountered gets logged. ScreenGui compendium: grid of creature portraits. First encounter: silhouette + "???" (DataStore records seen). After defeating 1: basic info (name, HP). After defeating 10: full info (drops, weaknesses, locations). After defeating 100: expert entry (lore text, hidden drops). Completion rewards at 25/50/75/100% entries. Each entry: 3D ViewportFrame of creature model + stats panel. Sort by: zone, rarity, defeated count. Rare creatures: special golden border.' },
      { name: 'Fossil / Artifact Dig', keywords: ['fossil', 'artifact', 'dig', 'excavation', 'dig site', 'archaeology'],
        how: 'Dig sites: Parts in specific locations with Decal "X marks the spot". Shovel Tool: Activate on dig site → minigame (ScreenGui: grid of tiles, click to reveal, find artifact pieces among dirt tiles without hitting rocks). Complete minigame: grant fossil/artifact item. Each artifact part of a set (e.g., 4 T-Rex bones = complete T-Rex skeleton). Display in museum (player-owned or communal). Completed sets: mount on display stand Model, grant coins + XP. Dig sites respawn weekly. Rare artifacts: golden glow, unique sound on discovery.' },
    ],
  },

  // ════════════════════════════════════════════════════════════════════
  // ROYALE / BATTLE ROYALE
  // ════════════════════════════════════════════════════════════════════
  {
    name: 'Royale / Battle Royale',
    systems: [
      { name: 'Shrinking Zone', keywords: ['shrinking zone', 'storm circle', 'safe zone shrink', 'battle royale zone', 'closing circle'],
        how: 'Zone: circular safe area defined by center Vector3 + radius NumberValue. Shrink phases: [{delay:60, shrinkTime:30, newRadius:200}, {delay:45, shrinkTime:25, newRadius:100}, ...]. Outside zone: damage -5HP/s (increases each phase). Visual: translucent cylinder Part (Neon, red, Transparency 0.8) at zone edge, shrinks via TweenService Scale. Minimap: circle overlay shows current zone + next zone. Warning: "Zone shrinking in 30s!" notification. Final zone: radius 10 studs, forces final fight.' },
      { name: 'Loot Spawning (BR)', keywords: ['loot spawn br', 'floor loot', 'weapon spawn', 'random loot', 'loot distribution'],
        how: 'Loot spawn points: Parts tagged "LootSpawn" at pre-placed positions across map. On match start: iterate all spawn points, roll random item from loot table, spawn item Model at position. Loot tiers: Common(gray, 50%), Uncommon(green, 30%), Rare(blue, 15%), Epic(purple, 4%), Legendary(gold, 1%). Items: weapons, shields, healing, ammo. ProximityPrompt "Pick Up" on each item. Sound: pickup chime. Despawn uncollected items in 120s. Visual: rarity-colored glow beneath item.' },
      { name: 'Bus / Drop System', keywords: ['battle bus', 'drop', 'skydive', 'deploy', 'br drop', 'landing'],
        how: 'Pre-game: 60s lobby (players in waiting area). Match start: all players teleported to "bus" (invisible platform at Y=500, moving in random direction across map at speed 50 studs/s). Players jump off: keybind Space → freefall (BodyVelocity downward + slight forward drift). Parachute/glider: auto-deploy at Y=100 (or manual earlier), slow descent (BodyVelocity Y=-20). Land: remove flying state, normal movement. Camera: third-person during drop. Map overview: minimap shows bus path before drop.' },
      { name: 'Kill Feed / Elimination', keywords: ['kill feed', 'elimination', 'br kill', 'player eliminated', 'last standing'],
        how: 'On player death: RemoteEvent "PlayerEliminated" to all. Kill feed ScreenGui: top-right, scrolling list of "[Killer] eliminated [Victim]" (white text, slide in from right, fade after 5s). Eliminated player: drop all inventory items at death position. Spectate: eliminated players can watch remaining players (camera follows via ScreenGui player selector). Win condition: last player/team alive. Win screen: champion spotlight, stats (kills, damage, survival time). Placement: "#5 / 20 players" shown on elimination.' },
      { name: 'Storm Damage & Warning', keywords: ['storm damage', 'zone damage', 'outside zone', 'storm warning', 'gas damage'],
        how: 'Players outside safe zone: Heartbeat check distance from zone center vs radius. If outside: damage tick every 1s, amount scales per phase (Phase1: 1HP/s, Phase2: 3HP/s, Phase3: 5HP/s, Final: 10HP/s). Visual: red screen vignette pulsing, ColorCorrection red tint, fog increases. Sound: ominous wind howl, heartbeat at low HP. Healing in storm: possible but outpaced by late-phase damage. Storm notification: "STORM APPROACHING" 30s before shrink, directional indicator showing nearest safe zone edge.' },
      { name: 'BR Inventory / Loadout', keywords: ['br inventory', 'br loadout', 'weapon slot', 'br backpack', 'quick swap'],
        how: 'Max 5 weapon slots + 1 healing slot. HUD hotbar: 6 slots at bottom. Pick up item: auto-equip to empty slot, or swap if full (drop current for new). Rarity priority: auto-swap lower rarity for higher of same weapon type. Quick swap: number keys 1-6 or scroll wheel. Drop item: keybind G drops currently held item at feet. Ammo: shared pool per ammo type (light, medium, heavy, shells). Inventory ScreenGui: shows all items with stats, swap by dragging. No crafting in BR (pre-made items only).' },
    ],
  },

  // ════════════════════════════════════════════════════════════════════
  // INFECTION / ZOMBIE GAMES
  // ════════════════════════════════════════════════════════════════════
  {
    name: 'Infection / Zombie Games',
    systems: [
      { name: 'Infection Tag', keywords: ['infection', 'infected', 'infection tag', 'zombie tag', 'convert player'],
        how: 'Two teams: Survivors(green) and Infected(red). Round start: 1 random player becomes Infected. Infected touches Survivor: Survivor converts to Infected team (RemoteEvent "Infect"). Converted: character appearance changes (green skin via BodyColors, torn clothes), WalkSpeed slightly faster (+2). Last survivor wins. Timer: 180s, if survivors remain = they win. Round-based: 5 rounds, track wins per player. Infected see survivors through walls (BillboardGui visible). Survivors can barricade (push Parts to block doors).' },
      { name: 'Zombie Horde AI', keywords: ['zombie horde', 'zombie ai', 'undead horde', 'zombie swarm', 'horde mode zombie'],
        how: 'Zombie spawner: clone from ServerStorage, set random appearance (BodyColors green/gray, torn MeshPart accessories). AI: detect nearest player within 60 studs (GetPartBoundsInRadius), PathfindingService to target. Stuck detection: if position unchanged > 3s, re-path. Attack: within 5 studs, play swing animation, TakeDamage on player. Horde behavior: multiple zombies converge from different directions. Special zombies every 5th wave: Fast(2x speed), Tank(5x HP slow), Spitter(ranged projectile). Sound: groans(ambient), scream(on detect player), splat(on death).' },
      { name: 'Barricade System', keywords: ['barricade', 'board up', 'block door', 'fortify', 'barrier build'],
        how: 'Barricade spots: tagged Frames at windows/doors. ProximityPrompt "Board Up" (requires 5 Wood). Creates plank Parts across opening (WeldConstraint to frame). Planks have IntValue HP (3 hits from zombies to break). Zombies attack barricades before entering. Repair: ProximityPrompt "Repair" (+1 plank HP per Wood spent). Max 3 planks per opening. Visual: wooden planks with nail Models. Sound: hammer on build, wood crack on zombie hit. Strategic: choose which openings to barricade (not enough wood for all).' },
      { name: 'Safe Room / Extraction', keywords: ['safe room', 'extraction', 'escape point', 'extraction zone', 'helicopter escape'],
        how: 'Objective: reach extraction point before timer expires. Extraction: Part zone at map edge, active only in final 60s of round. Helicopter Model descends (TweenService Y position), door opens. Players enter zone: "Extracting... 5s" progress bar. Successful extraction = full reward. Miss extraction = reduced reward. Safe rooms mid-map: locked door (find key), inside: health kit, ammo, brief respite. Safe room door auto-locks after 30s (no camping). BillboardGui waypoint marker shows extraction location when active.' },
      { name: 'Survivor Loadout', keywords: ['survivor weapon', 'zombie weapon', 'survival loadout', 'weapon shop zombie', 'equip survivor'],
        how: 'Between rounds: weapon shop ScreenGui. Buy weapons with earned coins: Pistol(free, low damage, unlimited ammo), Shotgun(500, high close damage, slow), Rifle(1000, balanced), Sniper(2000, one-shot zombies), Minigun(5000, rapid fire). Also: Medkit(200, heal 50HP), Grenade(300, AoE), Turret(1500, auto-shoots). Weapons persist across rounds in same match. Ammo: weapon comes with starting ammo, buy more at shop. Loadout displayed on character (visible weapon model).' },
    ],
  },

  // ════════════════════════════════════════════════════════════════════
  // PET SIMULATOR ADVANCED
  // ════════════════════════════════════════════════════════════════════
  {
    name: 'Pet Simulator Advanced',
    systems: [
      { name: 'Pet Equip Slots', keywords: ['pet slot', 'equip pet', 'pet equip', 'active pet', 'pet limit', 'pet slots'],
        how: 'Max equipped pets: starts at 3 (upgrade to 6 via gamepass or in-game milestone). Equipped pets follow player in formation (V-shape behind, BodyPosition offsets calculated per slot). ScreenGui pet bar: horizontal slots showing equipped pet icons. Drag from inventory to equip. Unequip: drag out of slot. Equipped pets: active stats applied (damage boost, luck boost, coin multiplier). Unequipped pets: in storage, no passive benefit. Best pets: auto-equip option sorts by stat value and equips top N.' },
      { name: 'Pet Inventory / Storage', keywords: ['pet storage', 'pet inventory', 'pet box', 'pet bank', 'store pets'],
        how: 'Pet inventory ScreenGui: grid of pet icons sorted by rarity (Legendary first). Capacity: starts at 50, upgrade to 100/200/500. At capacity: cannot hatch new eggs (blocked with warning). Delete pet: select + "Release" button (confirm dialog). Batch select: checkbox per pet, "Release Selected" for mass delete. Lock valuable pets: click lock icon prevents accidental release. Sort: by rarity, by level, by name, by damage. Filter: by element type, by equipped status. Pet count: "47/100" at top.' },
      { name: 'Pet Trading', keywords: ['trade pet', 'pet trade', 'swap pets', 'pet exchange', 'trade system pets'],
        how: 'Trade request: click player → "Trade" option. Two-panel ScreenGui: each side shows 6 pet slots. Drag pets from inventory to trade panel. Both players see each other\'s offers. Value calculator: shows estimated total value of each side (sum of pet rarity values). "Ready" button per player. Both ready: 5s countdown + final confirm. Server validates ownership, atomic swap. Trade history log. Anti-scam: flash warning if value difference > 50%. Rate limit: 5 trades per 10 minutes. Block list: prevent trade requests from specific players.' },
      { name: 'Pet Abilities', keywords: ['pet ability', 'pet skill', 'pet power', 'pet special', 'pet active ability'],
        how: 'Each pet has passive ability + active ability. Passives: +10% coins, +5% XP, +2 luck, +15% damage. Actives (cooldown-based): Coin Magnet(pull all coins in 30 stud radius, 60s CD), Double Collect(next 10 collections are 2x, 120s CD), Speed Boost(player speed +50% for 15s, 90s CD), Shield(absorb 1 hit, 180s CD). Active triggered by keybind (R) for currently selected pet. Cooldown shown on pet HUD icon. Rarer pets: stronger abilities + shorter cooldowns. Evolution unlocks upgraded ability version.' },
      { name: 'Pet Daycare / Training', keywords: ['pet daycare', 'pet training', 'train pet', 'pet gym', 'pet upgrade', 'pet xp farm'],
        how: 'Daycare building: ProximityPrompt opens ScreenGui with 6 training slots. Place pet in slot + select training type (Damage Training, Speed Training, Luck Training). Training takes real time: 1 hour = +1 stat point. Premium training: 2x speed. Collect when done: notification "Your pet finished training!" Max training: stat cap per rarity (Common=10 bonus stats, Legendary=50). Cannot use pet while in daycare. Multiple pets can train simultaneously. Offline training: continues while logged off (timestamp comparison on login).' },
      { name: 'Golden / Rainbow Enchant', keywords: ['golden pet', 'rainbow enchant', 'enchant pet', 'pet enchant', 'upgrade pet rarity'],
        how: 'Enchant system: convert normal pet → Golden (2x stats) → Rainbow (3x stats) → Dark Matter (5x stats). Golden: sacrifice 3 of same pet at Enchant Altar. Rainbow: sacrifice 3 Golden of same pet. Dark Matter: sacrifice 3 Rainbow of same pet. Animation: pets placed on altar pedestals, swirl inward, bright flash, new enchanted pet emerges. Enchanted pet: distinct visual (golden shimmer, rainbow color cycle, dark particle aura). Stats multiply base values. Enchanted pets shown with special border in inventory. Cannot un-enchant.' },
    ],
  },

  // ════════════════════════════════════════════════════════════════════
  // STORY & NARRATIVE SYSTEMS
  // ════════════════════════════════════════════════════════════════════
  {
    name: 'Story & Narrative Systems',
    systems: [
      { name: 'Cutscene System', keywords: ['cutscene', 'cinematic', 'camera animation', 'story scene', 'scripted scene'],
        how: 'Camera waypoints: table of {CFrame, duration, easingStyle}. On cutscene trigger: disable player controls (humanoid WalkSpeed=0), hide HUD. Camera CFrame tweened between waypoints sequentially (TweenService). Dialogue: text overlays appear during specific segments (typewriter effect). NPC animations play at scripted times. Letterbox: black bars at top/bottom (Frame elements, TweenService height). Skip button after 2s. Resume: restore controls, re-enable HUD. Trigger: ProximityPrompt, quest completion, zone entry.' },
      { name: 'Lore / Codex System', keywords: ['lore', 'codex', 'lore entry', 'story log', 'world lore', 'lore book'],
        how: 'Lore entries: ModuleScript table [{id, title, text, category, discoveryCondition}]. Categories: World History, Characters, Creatures, Locations. Discover: find lore scrolls in world (ClickDetector on scroll Part), complete quests, defeat bosses. On discover: "New Codex Entry!" notification. ScreenGui codex: book-style layout with tabs per category. Undiscovered entries show "???". Reading lore grants small XP reward. Total discovered: "23/50 Entries". Complete category: bonus reward. Lore hints at secret locations and boss weaknesses.' },
      { name: 'Branching Storyline', keywords: ['branching story', 'story choice', 'narrative choice', 'story branch', 'choose path'],
        how: 'Story nodes: ModuleScript tree {id, narration, choices:[{text, consequence, nextNodeId}]}. Consequence types: give item, change reputation, unlock area, alter NPC dialogue. DataStore stores current node + all past choices. Major choices: 2-3 options with different outcomes (help villain = villain allies later, betray villain = harder fight but hero allies). ScreenGui choice screen: dramatic pause, options with brief preview of direction. Cannot undo choices. Multiple endings based on accumulated choices. Replay value: different paths on second playthrough.' },
      { name: 'Flashback / Memory System', keywords: ['flashback', 'memory', 'past event', 'backstory', 'time flashback'],
        how: 'Trigger: interact with specific objects (old photo, landmark, NPC dialogue option "Tell me about the past"). Transition: screen ripple effect (ImageLabel distortion + ColorCorrection desaturate). Flashback scene: teleport to past version of area (different Models, different Lighting, sepia tone). Player observes as ghost (Transparency 0.5, cannot interact). NPC actors perform scripted scene (MoveTo waypoints + animations + dialogue). After: return to present, unlock new knowledge/quest. 3-5 flashbacks per story arc.' },
      { name: 'Reputation System', keywords: ['reputation', 'faction rep', 'standing', 'allegiance', 'reputation level'],
        how: 'Factions: {name, currentRep:0, tiers:[{threshold:0, title:"Neutral"}, {threshold:100, title:"Friendly"}, {threshold:500, title:"Honored"}, {threshold:1000, title:"Exalted"}]}. Gain rep: complete faction quests (+25-100), turn in faction items (+10 each). Lose rep: attack faction NPCs (-50), help rival faction (-25). Rep tier unlocks: Friendly=shop discount 10%, Honored=exclusive quests, Exalted=unique mount + title. Multiple factions: some rival (gaining rep with one loses with another). ScreenGui faction panel: bars showing each faction standing.' },
      { name: 'Journal / Quest Log', keywords: ['journal', 'quest log', 'quest journal', 'quest tracker', 'mission log'],
        how: 'ScreenGui journal: left panel = quest list (Active / Completed tabs). Right panel = selected quest details (description, objectives checklist, rewards preview). Active quest tracking: pin quest to HUD sidebar showing current objective + progress. Auto-track newest quest. Max 5 tracked simultaneously. Completed quests: grayed but readable for lore. Objective types: collect(X/10), talk to NPC(checkbox), defeat(X/5), reach location(checkbox). Sort: by priority (main quest first), by zone, by type. Quest chain indicator: "Part 2 of 5".' },
    ],
  },

  // ════════════════════════════════════════════════════════════════════
  // MODULAR GAME SYSTEMS
  // ════════════════════════════════════════════════════════════════════
  {
    name: 'Modular Game Systems',
    systems: [
      { name: 'Round-Based Match System', keywords: ['round system', 'match system', 'game round', 'round timer', 'match lobby'],
        how: 'Game phases: Lobby(30s, players join)→Intermission(10s, teleport to map)→Active(180s, gameplay)→Results(15s, show winner)→reset. IntValue "GamePhase" on server. Phase timer: task.wait(duration). Phase transitions: RemoteEvent "PhaseChanged" to all clients for UI updates. Map voting: during Lobby, show 3 random map options, players click to vote (SurfaceGui). Winning map loaded (clone from ServerStorage). Players teleported to SpawnLocations in active map. On round end: teleport all back to lobby. Stats: kills/deaths tracked per round.' },
      { name: 'Lobby / Waiting Room', keywords: ['lobby', 'waiting room', 'game lobby', 'pre-game', 'waiting area'],
        how: 'Lobby map: small area with: player counter SurfaceGui ("5/12 Players"), countdown timer display, map vote boards, practice area (target dummies), cosmetic preview, leaderboard display. Minimum players to start: configurable (default 2). Timer: starts when minimum reached (30s countdown). Late joiners: added if round hasn\'t started. ScreenGui: "Waiting for players..." or "Game starting in 15s". Lobby music: calm ambient. Player list: visible on SurfaceGui with team assignment preview.' },
      { name: 'Map Rotation System', keywords: ['map rotation', 'map select', 'map pool', 'random map', 'map vote'],
        how: 'Map pool: folder in ServerStorage with 5-10 complete map Models. Rotation: random or voted. Vote system: 3 random maps shown as options (SurfaceGui with preview image + name). Players stand on vote pad (count players on each pad after 15s). Winner = most votes (tie = random). Load map: clone winning map Model, parent to workspace at (0,0,0). Unload: Destroy current map Model after round. Map metadata: ModuleScript per map {name, maxPlayers, gamemode, spawnLocations}. History: don\'t repeat last 2 maps.' },
      { name: 'Spectator System', keywords: ['spectator', 'spectate', 'watch game', 'observer', 'camera spectate'],
        how: 'Eliminated/dead players enter spectator mode. Character hidden (Destroy). Camera follows alive players: cycle through with Q/E keys. Camera modes: follow(behind player), free(WASD fly cam), overhead(top-down). ScreenGui: spectated player name + health bar + kill count. Cannot interact with game world. Chat: spectators can only see spectator chat (prevent ghosting). Leave spectate: "Return to Lobby" button. Auto-assign spectator on death. In lobby: can spectate active match.' },
      { name: 'Replay / Kill Cam', keywords: ['replay', 'kill cam', 'death cam', 'replay system', 'instant replay'],
        how: 'On death: 5s replay from killer\'s perspective. Record: server stores last 5s of all player CFrames (ring buffer, 30 entries/s). On kill: package killer\'s CFrame history + action data. Send to victim via RemoteEvent. Client: replay camera follows killer CFrame sequence. Slow-motion: 0.5x playback speed. Visual: slight desaturation + "ELIMINATED BY [name]" text overlay. Skip button after 2s. After replay: normal respawn or spectate. Performance: only store active combat moments, discard idle frames.' },
      { name: 'Anti-Cheat Framework', keywords: ['anti cheat', 'exploit detection', 'cheat prevention', 'anti exploit', 'hack detection'],
        how: 'Server-side validation on ALL game actions. Speed check: Heartbeat tracks player position, if distance/dt > maxSpeed*1.5 → teleport back + strike. Damage validation: server confirms raycast hit before applying damage. Teleport detection: if player moves > 50 studs in one frame → flag. Remote spam: rate limit all RemoteEvents (max 30/s per player). Value tampering: leaderstats only modified server-side, client values are display-only. Strike system: 3 strikes = auto-kick. Log violations to DataStore for admin review. Obfuscate client-side code.' },
    ],
  },

  // ════════════════════════════════════════════════════════════════════
  // MINIGAME COLLECTION
  // ════════════════════════════════════════════════════════════════════
  {
    name: 'Minigame Collection',
    systems: [
      { name: 'Obby Race', keywords: ['obby race', 'obstacle race', 'parkour race', 'speed run', 'race obby'],
        how: 'Timed obstacle course. Start pad: Touched starts timer. Obstacles: jump gaps, dodge spinning Parts (CFrame rotation loop), moving platforms (TweenService ping-pong), disappearing Parts (Transparency cycle), wall jumps. Checkpoints: Parts that save progress (Touched stores last checkpoint CFrame). Fall = respawn at last checkpoint. Finish pad: stop timer, show completion time. Leaderboard: OrderedDataStore for best times. Ghost: replay best run as transparent character for reference. Personal best display.' },
      { name: 'Color Floor / Musical Chairs', keywords: ['color floor', 'musical chairs', 'color game', 'floor is lava', 'random floor'],
        how: 'Platform grid: NxN colored Parts. Server picks random safe color every 5s. Announcement: "Safe color: BLUE!" (ScreenGui + BillboardGui). Players rush to safe color Parts. After 3s: all non-safe colored Parts become CanCollide=false (players fall). Falling = elimination. Round narrows: fewer Parts remain each round. Last standing wins. Between rounds: all Parts restore. Speed increases: safe period shrinks (5s→4s→3s→2s). Visual: safe Parts glow (PointLight), danger Parts flash red before dropping. Sound: dramatic countdown beeps.' },
      { name: 'King of the Hill', keywords: ['king of hill', 'hill control', 'capture point', 'control zone', 'hold the point'],
        how: 'Central elevated platform. Players fight to stay on top. Scoring: every 1s on platform = +1 point. Push others off: on contact, BodyVelocity knockback. Powerups spawn around arena: Speed Boost, Super Jump, Shield, Mega Push. Win: first to 100 points. HUD: current points per player, platform indicator (who\'s on top). Visual: platform glows with current king\'s team color. Sound: crowd cheer when new king takes over. Anti-camping: after 30s continuous control, platform shrinks slightly.' },
      { name: 'Spleef / Floor Destroy', keywords: ['spleef', 'floor destroy', 'break floor', 'dig floor', 'spleef game'],
        how: 'Arena with destructible floor grid (4x4 stud Parts, 15x15 grid = 225 Parts). Each player has Tool: click Part → Destroy it (or CanCollide=false + Transparency tween). Fall through hole = eliminated. Strategy: destroy floor around opponents, avoid destroying your own path. Multiple layers: 3 floors, fall through one = land on next. Last player standing wins. Timer: 120s, if >1 alive = most Parts destroyed wins. Sound: crumble on destroy. Visual: cracks appear before full destroy (0.3s warning).' },
      { name: 'Simon Says', keywords: ['simon says', 'simon game', 'follow command', 'do what simon says', 'command game'],
        how: 'Server NPC "Simon" issues commands via BillboardGui + ScreenGui: "Simon says JUMP!", "Simon says SIT!", "DANCE!" (no simon says = trap). Players must perform action within 3s. Detection: Jump(Humanoid.StateChanged to Jumping), Sit(Humanoid:SetStateEnabled Seated), Dance(detect emote). If player does action without "Simon says" prefix → eliminated. If player doesn\'t do "Simon says" action → eliminated. Rounds get faster (5s→4s→3s→2s→1s delay between commands). Last player wins. 15 command varieties.' },
      { name: 'Hide and Seek', keywords: ['hide seek', 'hide and seek', 'hiding game', 'seeker game', 'prop hunt'],
        how: 'Roles: 1 Seeker, rest Hiders. 30s hiding phase: seeker blindfolded (black ScreenGui overlay), hiders scatter. Seek phase: 180s. Seeker finds hiders (ProximityPrompt "Tag" within 5 studs). Tagged = eliminated (join seeker team or spectate). Hiders: can use disguise (Prop Hunt variant: transform into objects like chairs/crates by clicking them). Seeker: flashlight Tool (SpotLight). Last hider wins (or time expires = hiders win). Footstep sounds: louder when seeker is near. Heartbeat sound: proximity-based audio fear.' },
    ],
  },

  // ════════════════════════════════════════════════════════════════════
  // MAGIC & SPELL SYSTEMS
  // ════════════════════════════════════════════════════════════════════
  {
    name: 'Magic & Spell Systems',
    systems: [
      { name: 'Spell Book / Spell Slots', keywords: ['spell book', 'spell slot', 'magic spell', 'learn spell', 'spell list'],
        how: 'Spell book ModuleScript: [{name:"Fireball", manaCost:20, damage:50, range:40, cooldown:5, animation:"Cast", element:"Fire", level:1}]. Player DataStore stores learnedSpells table. Learn spells: find spell scrolls, buy from mage NPC, level up rewards. Equip: max 4 active spell slots (hotbar 1-4). ScreenGui spell bar: 4 slots with icon + cooldown overlay + mana cost label. Unlearned spells: "???" in spell book. Spell upgrade: use 3 scrolls of same spell = upgraded version (+50% damage, -20% mana cost).' },
      { name: 'Mana System', keywords: ['mana', 'magic points', 'mp', 'mana bar', 'mana regen', 'magic energy'],
        how: 'NumberValue "Mana" (default max 100). Each spell costs mana. Insufficient mana: cast fails, "Not enough mana!" text. Regen: +5/s naturally, +10/s while standing still. Mana potions: consumable +50 mana instant. HUD mana bar: blue gradient, positioned below health bar. Upgrades: max mana increases with level (+10 per level). Equipment bonuses: mage robes +20 max mana, staffs +2 mana regen. At 0 mana: minor visual effect (character slightly desaturated). Meditation pose: sit emote = 3x mana regen rate.' },
      { name: 'Projectile Spells', keywords: ['fireball', 'ice bolt', 'magic projectile', 'spell projectile', 'cast spell attack'],
        how: 'Cast: play animation, spawn projectile Part at hand position. Projectile: BodyVelocity in camera lookVector * speed. Visual per element: Fireball(orange Neon sphere, fire ParticleEmitter trail), IceBolt(cyan Glass, frost trail), Lightning(yellow Neon, chain to nearby targets). On hit (Touched): TakeDamage + status effect (Fire=Burn, Ice=Slow, Lightning=Stun). Splash damage optional (GetPartBoundsInRadius). Projectile lifetime: 3s then Debris. Sound: whoosh on cast, impact sound per element. Homing upgrade: slight CFrame correction toward nearest enemy.' },
      { name: 'Area Spells / Ritual', keywords: ['area spell', 'ritual', 'magic circle', 'aoe spell', 'ground spell', 'magic area'],
        how: 'Cast: aim at ground (mouse raycast to floor). Spawn magic circle at hit position: flat cylinder Part (Neon, spell color, Transparency 0.3) + decal with rune pattern. After channel time (1-3s, interruptible): spell activates. Effects in radius: Heal Circle(allies +5HP/s for 5s, green), Fire Rain(enemies -10HP/s, red, falling fire particles), Freeze Zone(enemies slowed 50%, blue, frost floor), Shield Dome(transparent sphere blocks projectiles 5s). Circle fades after duration. Sound: mystical hum during channel, activation burst. Visible to all players.' },
      { name: 'Summoning System', keywords: ['summon', 'summon creature', 'conjure', 'familiar', 'summon minion', 'necromancy'],
        how: 'Summon spell: high mana cost (50+), long cooldown (60s). Spawn creature Model at target position with Humanoid. Summoned creature AI: attack nearest enemy (pathfind + melee/ranged). Duration: 30s then despawns (fade out). Types: Skeleton Warrior(melee, medium HP), Fire Elemental(ranged, AoE, low HP), Stone Golem(tank, slow, high HP), Spirit Wolf(fast, flanks enemies). Max 2 summons active. Summon dies: cooldown resets. Visual: magic circle on ground → creature rises from it. Owner nameplate: "{Player}\'s Skeleton".' },
    ],
  },

  // ════════════════════════════════════════════════════════════════════
  // SPACE & SCI-FI SYSTEMS
  // ════════════════════════════════════════════════════════════════════
  {
    name: 'Space & Sci-Fi Systems',
    systems: [
      { name: 'Space Station Interior', keywords: ['space station', 'station interior', 'space base', 'orbital station', 'space hub'],
        how: 'Zero-gravity areas: BodyForce counters gravity (Y force = mass * 196.2). Player floats, movement via BodyVelocity in input direction. Magnetic boots toggle: walk normally on designated floor Parts (tagged "MagFloor"). Airlock system: door Parts with ProximityPrompt, outer door requires suit check. Oxygen: NumberValue drains in unpressurized areas (-2/s). Refill at O2 stations. Interior: Metal/DiamondPlate materials, Neon accent lighting, viewport windows (Glass) showing space skybox. Sound: spacey ambient hum, hiss on airlock cycle.' },
      { name: 'Planet Exploration', keywords: ['planet', 'space explore', 'alien planet', 'planet surface', 'space travel planet'],
        how: 'Multiple planets: different environments/Terrain/gravity. Travel: ship cockpit → select planet on star map ScreenGui → loading screen → spawn on planet surface. Each planet: unique Terrain (Mars=red Sand, Ice Planet=Ice+Snow, Jungle=Grass+green), unique gravity (BodyForce modifier), unique atmosphere (Atmosphere settings), unique resources (mine alien ores). Planet completion: discover all resources + defeat planet boss + find artifacts. Star map shows visited planets (colored) vs unexplored (gray). Each planet: distinct ambient soundtrack.' },
      { name: 'Laser / Energy Weapons', keywords: ['laser', 'laser gun', 'energy weapon', 'blaster', 'sci fi weapon', 'plasma'],
        how: 'Laser Tool: Activate → raycast from barrel. Instant hit (no travel time). Visual: Beam instance from barrel to hit point (Neon color, Width 0.5, FadeLength 0.5, lifetime 0.1s for flash effect). Hit: TakeDamage + small spark ParticleEmitter at impact. Energy ammo: "Charge" NumberValue (max 100), each shot costs 5-20 depending on weapon. Recharge: slow passive regen (+2/s) or use energy cell item. Overheat: rapid fire depletes charge fast, at 0 = forced cooldown 3s. Sound: pew/zap per weapon type. Scope: optional zoom (FieldOfView tween).' },
      { name: 'Shield Generator', keywords: ['shield generator', 'energy shield', 'force field', 'barrier generator', 'shield system'],
        how: 'Placeable shield generator Part. On activate: spawn transparent sphere (ForceField material, team color, Transparency 0.5) around area (radius 15 studs). Shield HP: IntValue, absorbs incoming damage (damage deducted from shield HP, not player HP). At 0: shield breaks (shatter animation: Parts fly outward, Debris). Regen: shield HP recovers +5/s when not taking damage for 5s. Generator destroyable: enemies can target it (exposed Part, 100 HP). Upgrade: larger radius, more HP, faster regen. One active per team. Sound: energy hum while active, crackle on hit.' },
      { name: 'Alien Creature Taming', keywords: ['tame alien', 'alien pet', 'creature tame', 'space creature', 'alien companion'],
        how: 'Alien creatures on planets: unique Models per planet biome. Tame: approach carefully (crouch to avoid scaring), use Food item matching creature diet (RemoteEvent "OfferFood"). Trust meter: feed multiple times (3-5 depending on rarity). Meter in BillboardGui above creature. Max trust: creature becomes pet (follows player, BodyPosition offset). Each alien has unique ability: Glowbug(light source), Rockback(mining bonus), Floater(carry player over gaps). DataStore stores tamed creatures per player. Release: free tamed creature back to wild.' },
    ],
  },

  // ════════════════════════════════════════════════════════════════════
  // MERCHANT & SHOP ADVANCED
  // ════════════════════════════════════════════════════════════════════
  {
    name: 'Merchant & Shop Advanced',
    systems: [
      { name: 'Rotating Stock Shop', keywords: ['rotating shop', 'daily shop', 'shop refresh', 'rotating stock', 'item rotation'],
        how: 'Shop refreshes stock every 6h. Server: seed random with math.floor(os.time()/21600) for deterministic daily rotation. Pool of 50+ items, show 8 per rotation. Featured item slot: always one rare+ item. SurfaceGui clock shows "Refreshes in 2h 15m". Items not purchased carry over (different weight next rotation). "Notify Me" button per item: fires RemoteEvent when item appears in future rotation. Pricing: some items discounted randomly (10-30% off, shown with strikethrough original price). Season exclusives only appear during matching season.' },
      { name: 'Traveling Merchant NPC', keywords: ['traveling merchant', 'wandering trader', 'rare vendor', 'special merchant', 'mystery merchant'],
        how: 'Rare NPC spawns at random location every 30-60 minutes. Announcement: "A mysterious merchant has appeared!" (all players). NPC Model: hooded figure with unique cart Model. Sells exclusive items not in regular shops (unique crafting materials, rare cosmetics, one-time buffs). Accepts special currency (Ancient Coins found in dungeons). Despawns after 10 minutes or when stock sold out. Location hint: general area ("spotted near the eastern forest"). BillboardGui "?" marker visible when within 100 studs. Sound: mystical chime when near.' },
      { name: 'Bundle / Package Deals', keywords: ['bundle', 'package deal', 'starter pack', 'value pack', 'item bundle'],
        how: 'Bundles: predefined groups of items sold together at discount. Config: {name:"Warrior Starter Pack", items:["Iron Sword","Shield","Health Potion x5","Armor Set"], individualTotal:2500, bundlePrice:1500, savings:"40%"}. ScreenGui shop tab "Bundles": card layout showing bundle contents + savings percentage. One-time purchase (DataStore tracks purchased bundles). DevProduct bundles: real money. In-game bundles: coins. "Best Value" tag on highest savings bundle. Limited-time bundles expire with countdown timer.' },
      { name: 'Black Friday / Sale Event', keywords: ['sale event', 'discount', 'sale', 'black friday', 'shop sale', 'price cut'],
        how: 'Admin-triggered or scheduled sale event. All/selected shop items get discount multiplier (0.5 = 50% off). Visual: red "SALE" tag on discounted items, original price crossed out. Shop banner: "MEGA SALE - 50% OFF EVERYTHING!" with festive colors. Duration: 24-72h. Flash sales: specific items 70% off for 1h only (urgency). ScreenGui notification when sale starts. Revenue tracking: compare purchases during sale vs normal. Limit purchases: max 5 of each item during sale to prevent hoarding.' },
      { name: 'NPC Bargaining / Haggle', keywords: ['bargain', 'haggle', 'negotiate price', 'haggle npc', 'bargain price'],
        how: 'At specific merchant NPCs: "Haggle" button next to buy. ScreenGui haggle interface: NPC starting price at top, player offer TextBox. Submit offer: if offer >= 70% of asking price, NPC accepts. If 50-69%: NPC counter-offers (midpoint). If < 50%: NPC refuses ("That\'s insulting!"). Each round: NPC may lower price slightly (max 3 rounds). Charisma stat: higher charisma = NPC accepts lower offers. Critical haggle (1% chance): NPC gives item free ("Take it, you remind me of my son"). Failed haggle: price increases 10% temporarily.' },
      { name: 'VIP / Premium Shop', keywords: ['vip shop', 'premium shop', 'exclusive shop', 'gamepass shop', 'vip store'],
        how: 'Separate shop area accessible only to VIP gamepass holders (MarketplaceService:UserOwnsGamePassAsync check). Door with "VIP ONLY" SurfaceGui, non-VIP gets "Purchase VIP to enter" prompt (PromptGamePassPurchase). Inside: exclusive items not available elsewhere, 20% discount on regular items, premium cosmetics. VIP exclusive pets with unique abilities. Monthly VIP reward chest (DataStore tracks last claim, claimable once per 30 days). VIP badge above head (BillboardGui star icon). VIP-only chat color (gold name).' },
    ],
  },

  // ════════════════════════════════════════════════════════════════════
  // CLAN TERRITORY & WARS
  // ════════════════════════════════════════════════════════════════════
  {
    name: 'Clan Territory & Wars',
    systems: [
      { name: 'Territory Control', keywords: ['territory', 'control zone', 'capture territory', 'territory war', 'zone control', 'turf war'],
        how: 'Map divided into 10-20 territories (Part zones with SurfaceGui showing owner clan name + color). Capture: stand on territory flag (central Part) for 30s uncontested. Progress bar: fills while capturing, resets if enemy enters. Owning territory: passive income for clan (coins per 5 min per territory). Territory defense: owner clan spawns at territory. Map ScreenGui: color-coded territories showing all clan ownership. Territory bonuses: resource territories give 2x gathering, shop territories give discount. Daily reset: contested territories go neutral at midnight.' },
      { name: 'War Declaration', keywords: ['declare war', 'war declaration', 'clan war start', 'war challenge', 'challenge clan'],
        how: 'Clan leader opens ScreenGui war panel, selects target clan, stakes wager (coins from clan bank). Target clan leader receives notification + must accept/decline within 24h. Decline: no penalty. Accept: war begins at scheduled time (both leaders pick from available slots). War parameters: team size (5v5, 10v10), map (random or voted), best of 3/5 rounds. During war: participants teleported to war arena (ReservedServer). Non-participants can spectate. Winner: receives wager + loser territory. War cooldown: 48h between wars for same clans.' },
      { name: 'Clan Base Building', keywords: ['clan base', 'clan headquarters', 'clan home', 'faction base', 'clan build'],
        how: 'Each clan gets base plot (larger than player plots: 80x80 studs). Clan leader + officers can build. Budget: clan bank funds construction. Buildings: Barracks(+2 member spawn points), Workshop(crafting bonus), Vault(increased bank storage), War Room(view territory map), Training Ground(+XP for sparring). Each building: pre-built Model spawned at chosen position within plot. Upgrade buildings: 3 levels each (size+benefit increase). Enemy raids: other clans can attack base during war (destroy buildings for advantage). Rebuild cost: 50% of original.' },
      { name: 'Clan Reputation / Ranking', keywords: ['clan rank', 'clan reputation', 'clan leaderboard', 'top clan', 'clan tier'],
        how: 'Global clan leaderboard: sorted by Clan Power (composite score). Power = (memberCount * 10) + (totalWealth / 100) + (warWins * 50) + (territoriesOwned * 100) + (questsCompleted * 5). Tiers: Bronze(0-500), Silver(500-2000), Gold(2000-5000), Diamond(5000-15000), Champion(15000+). Tier benefits: higher tier = more member slots, better clan quests, exclusive clan cosmetics (banner, tag color). SurfaceGui leaderboard in spawn shows top 10 clans. Weekly reset of some points to keep competition active.' },
      { name: 'Alliance System', keywords: ['alliance', 'ally clan', 'faction alliance', 'peace treaty', 'alliance system'],
        how: 'Clan leader sends alliance request to another clan (max 2 allies). Accepted: allied clans cannot attack each other, shared territory benefits (can traverse ally territory without contest), joint quests available (require members from both clans). Alliance ScreenGui: shows allied clans + shared stats. Break alliance: 48h cooldown before can attack former ally. Betrayal mechanic: breaking alliance during war = reputation penalty. Alliance chat channel: shared TextChatService channel. Visual: ally members have green nameplate instead of white.' },
    ],
  },

  // ════════════════════════════════════════════════════════════════════
  // EXPLORATION & DISCOVERY
  // ════════════════════════════════════════════════════════════════════
  {
    name: 'Exploration & Discovery',
    systems: [
      { name: 'Fog of War / Map Reveal', keywords: ['fog of war', 'map reveal', 'explore map', 'undiscovered area', 'map discovery'],
        how: 'Minimap/world map: unexplored areas covered by dark overlay (ImageLabel black). Player movement reveals area in radius (15 studs): server updates explored grid in DataStore (2D boolean array, 10-stud resolution). On minimap: revealed areas show terrain, unrevealed show black. Percentage explored: "42% Discovered" text. Milestone rewards at 25/50/75/100%. Scout ability: temporarily reveals larger radius (50 studs for 10s). Bird\'s eye items: reveal entire zone. Shared map: party members share revealed areas. Fog persists between sessions.' },
      { name: 'Treasure Map / Clue Trail', keywords: ['treasure map', 'treasure hunt', 'clue', 'clue trail', 'treasure trail', 'scavenger hunt'],
        how: 'Treasure map item: ScreenGui shows hand-drawn style map (ImageLabel) with X marking treasure location. Map shows landmarks but no minimap coordinates (player must visually match landmarks). Clue trail variant: sequence of riddle SurfaceGuis at locations, each pointing to next. Dig at X: Shovel tool + interact at correct position (±5 studs tolerance). Reward: rare items, large coin reward, exclusive cosmetic. Map sources: quest reward, rare drop, NPC purchase. Difficulty: easy maps show more detail, hard maps are vague sketches. One treasure per map (consumed on dig).' },
      { name: 'Collectible Orbs / Hidden Items', keywords: ['collectible', 'hidden collectible', 'orb', 'star coin', 'collect all', 'hidden item'],
        how: 'Collectibles placed throughout world: small glowing Parts (Ball shape, Neon material, rotating via CFrame loop). Categories: Red Orbs(easy, visible), Blue Orbs(medium, slightly hidden), Gold Orbs(hard, very hidden). Touched: collect (Destroy on client, RemoteEvent to server). DataStore: table of collected orbIds. Counter: "47/100 Red, 12/50 Blue, 3/25 Gold". Rewards at milestones. Map markers: option to show nearby uncollected (togglable). Sound: satisfying ping on collect, pitch rises with streak. Reset option for speedrun challenge.' },
      { name: 'Environmental Puzzles', keywords: ['environmental puzzle', 'pressure plate', 'lever puzzle', 'switch puzzle', 'dungeon puzzle'],
        how: 'Puzzle types: Pressure Plates(step on in correct order, incorrect resets), Lever Sequence(flip levers matching symbol pattern shown on wall SurfaceGui), Push Block(move Part to target position on grid, magnitude check), Light Beam(rotate mirror Parts to reflect beam to target — Beam instance between mirrors), Color Match(torch Parts must all match target color via ClickDetector cycling R→G→B). Solve: door opens (TweenService Part position) or treasure chest activates. Hint system: faded SurfaceGui shows partial solution after 3 failed attempts. Sound: mechanism clicks on correct step, buzz on wrong.' },
      { name: 'Teleport Network / Portal Hub', keywords: ['teleport network', 'portal hub', 'warp network', 'portal system', 'teleport hub'],
        how: 'Central hub room with ring of portal arches. Each portal: destination SurfaceGui label + image preview + unlock status. Unlocked by visiting destination first (walking to portal at destination activates return link). ScreenGui fast travel menu: list of unlocked destinations, click to teleport (2s channel time, interruptible). Network map: web diagram showing connections. Two-way: unlock from either end. Premium shortcut: direct teleport from anywhere (no hub required). Animation: step through portal, screen flash, appear at destination. Sound: magical whoosh. Cooldown: 30s between teleports.' },
      { name: 'Underwater Exploration', keywords: ['underwater', 'ocean explore', 'dive', 'submarine', 'deep sea', 'ocean floor'],
        how: 'Underwater zone: blue-tinted Lighting (ColorCorrection blue shift), reduced visibility (Atmosphere high density). Oxygen system: NumberValue 100, drains -3/s underwater. Refill: surface, air bubbles (collectible Parts that restore +20), oxygen tank equipment (+60s). Swimming: WASD + Space/Shift for up/down. Submarine vehicle: enclosed, unlimited oxygen, lights (SpotLight), storage. Sea creatures: decorative fish (scripted patrol paths), dangerous sharks (chase if too close). Treasure: shipwrecks with chests, coral caves, ancient ruins. Depth meter: HUD shows current Y depth.' },
    ],
  },

  // ════════════════════════════════════════════════════════════════════
  // ECONOMY SINKS & BALANCE
  // ════════════════════════════════════════════════════════════════════
  {
    name: 'Economy Sinks & Balance',
    systems: [
      { name: 'Item Repair Cost', keywords: ['repair cost', 'maintenance', 'item upkeep', 'repair fee', 'equipment maintenance'],
        how: 'All equipment degrades with use (durability system). Repair costs scale with item rarity: Common=10 coins, Rare=100, Legendary=1000. Progressive cost: each repair costs 10% more than previous (encourages eventual replacement). Auto-repair toggle: deduct coins automatically when durability < 20%. Broken item: 50% stats until repaired. Economy impact: major coin sink, prevents inflation. Repair NPC: blacksmith with ProximityPrompt. Sound: hammer on anvil. Visual: sparks during repair animation.' },
      { name: 'Cosmetic Sink', keywords: ['cosmetic purchase', 'vanity item', 'cosmetic sink', 'cosmetic shop', 'appearance cost'],
        how: 'Expensive cosmetics that don\'t affect gameplay: Name Colors(5000 coins), Chat Bubbles(3000), Kill Effects(10000), Trails(7500), Titles(2000-50000), Pet Skins(15000), Housing Decorations(500-20000). New cosmetics added monthly to maintain interest. Limited edition: available for 7 days then gone forever (FOMO drives purchases). Preview all cosmetics before buying (ViewportFrame + character preview). "Own X/Y" counter per category. Complete collection bonuses. Major economy sink: absorbs excess coins from wealthy players.' },
      { name: 'Gambling / Risk System', keywords: ['gambling sink', 'coin flip', 'risk reward', 'double or nothing', 'casino'],
        how: 'Casino NPC or zone. Games: Coin Flip(50/50, 2x return), Dice Roll(higher number wins, 3x return), Color Wheel(pick color, varying odds: 2x/5x/20x). House edge: all games have slight house advantage (48% actual win rate on "50/50"). Bet limits: min 10, max 10000 coins. Cooldown: 5s between bets (prevent addiction-speed). Sound: slot machine jingle, dice roll, coin clink. Visual: animated wheel/dice. Warning: "Gambling can be addictive" message. Daily loss limit: max 50000 coins lost per day. Major economy sink for endgame players.' },
      { name: 'Property Tax / Upkeep', keywords: ['property tax', 'upkeep cost', 'maintenance fee', 'daily cost', 'plot upkeep'],
        how: 'Owned properties cost daily upkeep: Small Plot=50/day, Medium=150/day, Large=500/day. Deducted automatically on login (check os.time() since last deduction, charge for missed days up to 7). Cannot go negative: if insufficient coins, property enters "Delinquent" state (visual: warning sign, some features disabled). 7 days delinquent: property repossessed (cleared, put back on market). Upkeep notification: "Property tax due: $150" on login. Discount: consecutive payment streak -10% (max -50%). Encourages active play.' },
      { name: 'Respec / Reset Cost', keywords: ['respec cost', 'reset stats', 'skill reset', 'stat reset', 'respec fee'],
        how: 'Reset allocated stat/skill points. First respec: free. Subsequent: escalating cost (100, 500, 2000, 10000, 50000 coins). Or purchasable Respec Token (DevProduct or rare drop). ScreenGui confirmation: "Reset all stat points? Cost: 2000 coins. Are you sure?" Server validates coins, resets all allocations to unspent points. Cannot partially respec (all or nothing). Alternative: respec at specific milestone (every 10 levels = free respec). Economic purpose: absorbs coins from players who experiment with builds frequently.' },
      { name: 'Enchant Failure / Material Loss', keywords: ['enchant fail', 'upgrade fail', 'material loss', 'crafting failure', 'break on upgrade'],
        how: 'High-tier enchanting/upgrading has failure chance. Success rates: +1 to +5 = 90%, +6 to +10 = 50%, +11 to +15 = 20%. Failure: materials consumed but no upgrade. Critical failure (5% of failures): item destroyed entirely. Protection scroll: prevents item destruction on critical fail (consumed). ScreenGui upgrade screen: shows success rate prominently + "Use Protection? (1 Scroll)" checkbox. Safety net: after 5 consecutive failures, next attempt guaranteed success. Major material sink: failed attempts still consume expensive crafting materials.' },
    ],
  },

  // ════════════════════════════════════════════════════════════════════
  // ACCESSIBILITY & QOL
  // ════════════════════════════════════════════════════════════════════
  {
    name: 'Accessibility & QOL',
    systems: [
      { name: 'Colorblind Mode', keywords: ['colorblind', 'accessibility color', 'color blind mode', 'color assist', 'deuteranopia'],
        how: 'Settings toggle: Colorblind Mode (Off, Deuteranopia, Protanopia, Tritanopia). When enabled: add distinct shape indicators alongside color (e.g., red=circle, green=triangle, blue=square). Rarity indicators: use patterns (stripes/dots/stars) in addition to colors. Enemy health bars: add percentage text. Chat names: underline style varies by team. ColorCorrection adjustments: shift problematic hues. Preview in settings before applying. Persist in DataStore. Affects all UI elements via Theme module integration.' },
      { name: 'Screen Reader Support', keywords: ['screen reader', 'narration', 'text to speech', 'accessibility narrate', 'blind accessible'],
        how: 'TextChatService messages can convey all important game events as text. All UI buttons have descriptive Name property for screen reader tools. Notification text: always includes full context ("You earned 50 coins from defeating Zombie Level 3"). Sound cues: distinct sounds for different event types (coin collect = clink, damage = thud, level up = fanfare, quest complete = trumpet). Navigation: Tab key cycles through interactive UI elements with highlight. Gamepad support: full navigation without mouse.' },
      { name: 'Auto-Save Indicator', keywords: ['auto save', 'save indicator', 'save icon', 'data saved', 'save status'],
        how: 'Visual indicator in HUD corner: spinning disk/cloud icon during save, checkmark when complete. Auto-save triggers: every 60s, on significant event (level up, purchase, quest complete), on PlayerRemoving. Unsaved changes warning: if player tries to leave during save → "Saving data..." delay. Save status: "Last saved: 30s ago" tooltip on hover. Error handling: if save fails, retry 3x with exponential backoff, show warning "Save failed, retrying..." in red. Sound: subtle click on successful save.' },
      { name: 'Ping / Latency Display', keywords: ['ping', 'latency', 'ping display', 'connection quality', 'lag indicator'],
        how: 'Client LocalScript: every 5s, fire RemoteEvent "Ping" to server with os.clock() timestamp. Server immediately fires back with same timestamp. Client: latency = (os.clock() - sentTimestamp) * 1000 (ms). Display: small text in corner "32ms" with color (green<50, yellow<100, red>100). Connection quality icon: 4 bars like phone signal. At high ping: show "Connection Issues" warning. Log: track average ping over session for diagnostics. Option to hide in settings.' },
      { name: 'Control Remapping', keywords: ['remap controls', 'custom controls', 'rebind key', 'control settings', 'key config'],
        how: 'Settings → Controls tab. Grid: Action name | Current Key | "Rebind" button. Click Rebind → "Press any key..." state. UserInputService.InputBegan: capture keycode, update binding. Validate: no duplicate bindings (warn if conflict). Default bindings: WASD=move, Space=jump, E=interact, R=ability, Tab=inventory, M=map. Save to DataStore keybinds table. Apply: all input checks reference keybinds table instead of hardcoded keys. "Reset to Defaults" button. Controller support: separate gamepad bindings tab.' },
      { name: 'Performance Settings', keywords: ['graphics settings', 'quality settings', 'fps setting', 'performance option', 'low quality mode'],
        how: 'Settings → Graphics tab. Presets: Low, Medium, High, Ultra. Adjustable: Shadows(on/off = GlobalShadows), Particles(reduce Rate to 25%), Draw Distance(StreamingMinRadius 64→256), Post Processing(Bloom/ColorCorrection on/off), Grass/Foliage(Terrain decoration on/off). Apply immediately on change. Auto-detect: on first join, benchmark 5s, select preset based on average FPS. Show current FPS counter (optional toggle). Save preference in DataStore. Warning: "Ultra" label shows "May reduce performance on older devices".' },
    ],
  },

  // ════════════════════════════════════════════════════════════════════
  // CLICKER / IDLE GAME SYSTEMS
  // ════════════════════════════════════════════════════════════════════
  {
    name: 'Clicker / Idle Game Systems',
    systems: [
      { name: 'Auto-Clicker / Auto-Farm Upgrades', keywords: ['auto click', 'auto clicker', 'auto farm upgrade', 'passive click', 'afk upgrade'],
        how: 'Upgrade tiers: Manual Only → Auto-Click 1/s(500 coins) → 2/s(2000) → 5/s(10000) → 10/s(50000). Each tier: server task.spawn loop fires resource gain at configured rate while player is in game. Purchase at upgrade NPC. ScreenGui shows current auto-rate. Offline auto: disabled by default. Premium offline auto: gamepass, earns at 10% of active auto rate. Anti-AFK: after 20 minutes idle, auto-rate drops to 0 until player moves. Visual: machine Model animation speed matches auto-rate.' },
      { name: 'Multiplier Stacking', keywords: ['multiplier', 'stack multiplier', 'boost multiplier', 'coin multiplier', 'multiply earnings'],
        how: 'Multiple multiplier sources stack multiplicatively: Base(1x) * Pet(1.5x) * Gamepass(2x) * Event(2x) * Rebirth(1+0.5*rebirths) = total. ScreenGui breakdown: list all active multipliers with values. Total multiplier displayed prominently: "x12.5 EARNINGS". Temporary multipliers: potions (2x for 15 min), events (server-wide 2x). Each source: NumberValue or calculated from DataStore. Cap total at 100x to prevent inflation explosion. Visual: multiplier text gets bigger/more colorful at higher values. Sound: power-up chime when multiplier increases.' },
      { name: 'Offline Progress Calculation', keywords: ['offline progress', 'offline earnings', 'away earnings', 'idle earnings', 'offline income'],
        how: 'On player join: lastOnline = DataStore timestamp. elapsed = os.time() - lastOnline. offlineEarnings = elapsed * incomePerSecond * offlineMultiplier(0.1). Cap: max 8 hours (28800s) of offline earnings. ScreenGui popup on join: "While you were away (3h 22m), you earned $45,230!" with collect button. Premium offline: gamepass increases multiplier to 0.5 (5x more). Breakdown: show income sources. Option to watch ad (DevProduct) to double offline earnings. Offline earnings don\'t count toward leaderboard scores.' },
      { name: 'Prestige / Ascension System', keywords: ['prestige system', 'ascension', 'new game plus', 'reset progress', 'prestige rewards'],
        how: 'At maximum level or income threshold: "Prestige" button unlocks. On prestige: ALL progress resets (coins, upgrades, zones). Gain: Prestige Points (PP) based on total lifetime earnings. PP spent at Prestige Shop: permanent multipliers, exclusive upgrades, cosmetics, faster progression. Each prestige: faster to reach threshold again (due to permanent bonuses). Prestige counter in leaderboard. ScreenGui prestige panel: estimated PP gain, shop preview, confirmation. Visual: dramatic reset animation (world rebuilds). Max prestige: unlimited, but diminishing returns on PP.' },
      { name: 'Upgrade Tree (Idle)', keywords: ['upgrade tree idle', 'idle upgrades', 'passive upgrade', 'unlock upgrade', 'upgrade path idle'],
        how: 'Tree of upgrades branching from center. Nodes: {name, cost, effect, prerequisite}. Categories: Production(increase income per click/auto), Efficiency(reduce costs), Expansion(unlock new areas/resources), Special(unique abilities). ScreenGui: visual tree with lines connecting nodes. Purchased: gold glow. Available: white border. Locked: gray, shows prerequisite. Costs scale exponentially: baseCost * 1.15^timesPurchased. Some nodes: repeatable (buy multiple times, each more expensive). Reset tree: prestige or respec item. Auto-purchase toggle: buys cheapest available node automatically.' },
    ],
  },

  // ════════════════════════════════════════════════════════════════════
  // MYSTERY & DETECTIVE GAMES
  // ════════════════════════════════════════════════════════════════════
  {
    name: 'Mystery & Detective Games',
    systems: [
      { name: 'Murder Mystery Roles', keywords: ['murder mystery', 'murderer', 'sheriff', 'innocent', 'murder game', 'mystery role'],
        how: 'Round start: randomly assign roles. 1 Murderer(gets knife Tool), 1 Sheriff(gets gun Tool), rest Innocent. Murderer: must kill all innocents without being caught. Sheriff: must identify and shoot murderer. Innocent: survive, pick up gun if sheriff dies. Knife: melee kill (Touched). Gun: raycast, 1 shot kills. If sheriff shoots innocent: sheriff dies. Roles hidden: no nameplate role display. Dead players: spectate. Round: 180s or until murderer/innocents win. HUD: role display (only your role), alive count, timer.' },
      { name: 'Clue / Evidence System', keywords: ['clue', 'evidence', 'investigate', 'detective clue', 'find evidence', 'investigation'],
        how: 'Crime scene: designated area with interactable objects. Evidence items: Parts with ProximityPrompt "Investigate" (magnifying glass icon). On investigate: ScreenGui evidence popup showing image + description. Evidence types: Fingerprint(points to suspect), Weapon(narrows method), Witness Statement(NPC dialogue), CCTV Footage(short replay). Evidence board ScreenGui: pin collected evidence, draw connections. 5+ correct connections: can "Accuse" suspect. Wrong accusation: penalty (lose turn/points). Sound: investigation "hmm" + notepad scribble.' },
      { name: 'Voting / Accusation', keywords: ['vote player', 'accuse', 'voting round', 'town meeting', 'vote out'],
        how: 'Meeting called: all players teleported to meeting area. Discussion phase: 30s, players argue in chat. Vote phase: 15s, ScreenGui shows all alive players as vote targets. Click to vote. Skip option. Majority vote: accused player eliminated (removed from round). Tie or skip majority: nobody eliminated. After vote: reveal eliminated player\'s role. Return to gameplay. Emergency meeting: limited uses (1 per player per game). Dead players: cannot vote or speak. Results screen shows vote distribution.' },
      { name: 'Impostor / Among Us Style', keywords: ['impostor', 'among us', 'sus', 'crewmate', 'sabotage', 'vent'],
        how: 'Roles: Crewmates(majority) and Impostors(1-2). Crewmates: complete tasks (minigames at stations — wiring puzzle, card swipe, asteroids shoot). Impostors: fake tasks, kill crewmates (proximity + cooldown), sabotage (disable lights=dark screen for crew, lock doors=CanCollide true on doors for 10s). Vent: impostors can teleport between vent locations (ProximityPrompt, CFrame to destination). Report body: Touched dead character Part → emergency meeting. Win: crew completes all tasks or votes out all impostors. Impostor wins: kills enough for majority. Task bar: ProgressBar showing global crew task completion.' },
    ],
  },

  // ════════════════════════════════════════════════════════════════════
  // GACHA & LOOTBOX SYSTEMS
  // ════════════════════════════════════════════════════════════════════
  {
    name: 'Gacha & Lootbox Systems',
    systems: [
      { name: 'Banner / Rate-Up System', keywords: ['banner', 'rate up', 'featured', 'gacha banner', 'limited banner', 'pull rate'],
        how: 'Banners: time-limited gacha events (7-14 days) with featured items at boosted rates. Config: {name, endTime, featuredItems:[{id, boostedRate:5}], regularPool:[]}. Featured item: rate increased from 0.5% to 5%. SurfaceGui/ScreenGui banner display: featured item art + "Rate Up!" tag + countdown timer. Pity system: guaranteed featured item within 90 pulls. Pull history: DataStore stores last 200 pulls for player review. Multi-pull: 10x pull with one guaranteed rare+ (saves time). Sound: dramatic reveal per rarity (common=soft, legendary=orchestra hit).' },
      { name: 'Pity / Mercy System', keywords: ['pity system', 'mercy pull', 'guaranteed pull', 'soft pity', 'hard pity'],
        how: 'Track pulls since last highest-rarity item: IntValue "PityCounter". Soft pity: after 75 pulls, rate increases by 5% per pull. Hard pity: at 90 pulls, guaranteed highest rarity (100% rate). Counter resets on any highest-rarity pull (whether by luck or pity). Display: "89/90 to guaranteed" in pull screen. Cross-banner: pity carries between banners of same type (character pity vs weapon pity separate). Prevents infinite bad luck. Communicate odds clearly: "4.5% chance at 80+ pulls" transparency. DataStore: pityCounter persists across sessions.' },
      { name: 'Wish / Pull Animation', keywords: ['pull animation', 'gacha animation', 'wish animation', 'summon animation', 'reveal animation'],
        how: 'Single pull: shooting star animation (Part trails across sky, explosion at landing). Color: matches rarity (white→green→blue→purple→gold). Multi-pull: sequential reveals, each with brief pause. Skip button after seeing all. Camera: zooms to summoning circle (ground decal + ParticleEmitter). Rarity escalation: starts subdued, screen cracks/flashes for epic+. Legendary: special unique animation (dragon flies across, lightning strikes, etc.). Sound: building crescendo, climax based on rarity. Social: nearby players see your pull result as floating notification.' },
      { name: 'Gacha Currency System', keywords: ['gacha currency', 'pull currency', 'primogem', 'star quartz', 'summon ticket'],
        how: 'Two pull currencies: free(earned in-game) and premium(purchased with Robux/DevProduct). Free: earned from daily quests(50/day), achievements(100-500), events(200-1000). Premium: bought in packs (100=$0.99, 1000=$8.99, 5000=$39.99). Pull cost: 1 pull = 160 free currency or 160 premium. 10-pull: 1440 (10% discount). Monthly pass: DevProduct, grants 90 free currency/day for 30 days (best value). Exchange rate: premium currency cannot be earned, preserving value. HUD display: both currencies prominently shown.' },
      { name: 'Duplicate / Constellation System', keywords: ['duplicate', 'constellation', 'dupe system', 'character dupe', 'star up', 'dupe bonus'],
        how: 'Pulling duplicate: instead of useless copy, grants upgrade material. Characters: dupe = +1 Constellation (max 6). Each constellation: specific bonus (+20% damage at C1, new ability at C2, +30% HP at C4, transform ultimate at C6). Items: dupe = Stardust currency. Stardust shop: buy other items/characters directly (high cost). DataStore tracks constellation level per character. ScreenGui constellation screen: star map showing unlocked nodes. Sound: special reveal for first constellation upgrade. Value: every pull has purpose, no true waste.' },
    ],
  },

  // ════════════════════════════════════════════════════════════════════
  // PHOTOGRAPHY & MEDIA
  // ════════════════════════════════════════════════════════════════════
  {
    name: 'Photography & Media',
    systems: [
      { name: 'Photo Mode / Screenshot', keywords: ['photo mode', 'screenshot', 'camera mode', 'photo capture', 'picture mode'],
        how: 'Toggle: keybind (P) enters photo mode. Hide all HUD (ScreenGui Enabled=false). Free camera: WASD + mouse look (custom camera script). Controls ScreenGui (minimal): FOV slider, Roll angle, Filter (color presets via ColorCorrection), Depth of Field toggle + focus distance, Time of day slider (Lighting.ClockTime). Pose: freeze player animation. Frame: capture (client-side, no actual image API but can signal screenshot tool). Sticker/text overlay: ImageLabel/TextLabel draggable on screen. Exit: same keybind. Used for social media sharing.' },
      { name: 'Photo Gallery / Album', keywords: ['photo gallery', 'album', 'photo album', 'save photo', 'photo collection'],
        how: 'Photos stored as metadata: {timestamp, location:CFrame, filter, dayTime, caption, playerPosition}. DataStore saves last 50 photo entries. Gallery ScreenGui: grid of "photos" (ViewportFrame recreating the scene from stored CFrame + settings is too complex, so use: screenshot thumbnail as ImageLabel if available, or scenic text description). Caption: player-written 100-char description. Share: generate link code, others can view gallery. Like system: visitors can heart photos. Best photos: weekly contest, community voted, winner gets reward.' },
      { name: 'Video Recording Cue', keywords: ['video', 'record', 'clip', 'highlight', 'gameplay clip'],
        how: 'Highlight detection: on notable events (epic kill, level up, rare drop, close call), fire RemoteEvent "HighlightMoment" to client. Client: show brief "HIGHLIGHT!" text overlay (golden, 0.5s). If player has recording software: this serves as visual cue to clip. Instant replay: store last 10s of camera CFrames + key events. Replay button: plays back with cinematic camera angles (auto-generated: over-shoulder, zoom on action, slow-mo on impact). Used for content creation. Share: replay data code for others to watch.' },
    ],
  },

  // ════════════════════════════════════════════════════════════════════
  // NPC COMPANIONS & FOLLOWERS
  // ════════════════════════════════════════════════════════════════════
  {
    name: 'NPC Companions & Followers',
    systems: [
      { name: 'Companion AI', keywords: ['companion', 'npc companion', 'ai companion', 'follower npc', 'helper npc', 'buddy'],
        how: 'Companion Model with Humanoid (no damage taken from environment). Follows player: BodyPosition offset behind player (Vector3.new(-3, 0, -3)), updates every Heartbeat. Combat: attacks player\'s target (same enemy player is fighting), basic AI: pathfind to enemy, melee/ranged attack, return to player when enemy dead. Dialogue: periodic quips ("Look out!" when enemy spawns, "Nice!" on player level up). Dismissable: ScreenGui button to dismiss/summon. Health: companion has HP, retreats at low HP, heals over time. Different companions: warrior, healer, ranged. Only 1 active.' },
      { name: 'NPC Hire System', keywords: ['hire npc', 'mercenary', 'hire worker', 'npc worker', 'hire helper'],
        how: 'Hire NPCs at tavern/guild hall. Types: Fighter(deals damage, 500 coins/hr), Gatherer(auto-collects resources in radius, 300/hr), Porter(increases backpack capacity +100, 200/hr). Hire screen: NPC portraits with stats + hourly cost. Coins deducted every 60s from player while NPC active. Fire: dismiss NPC (no refund for current hour). Max 2 hired NPCs. NPC quality tiers: Bronze(1x stats), Silver(1.5x, more expensive), Gold(2x, premium). DataStore stores active hires + remaining time. NPC disappears when player leaves (re-hire on return).' },
      { name: 'Pet Dialogue / Personality', keywords: ['pet dialogue', 'pet talk', 'pet personality', 'companion chat', 'pet speech'],
        how: 'Each pet species has personality traits: {mood, chattiness, humor}. Dialogue pool per personality: idle remarks ("I\'m hungry!"), combat callouts ("Behind you!"), discovery reactions ("Ooh shiny!"), encouragement ("You can do it!"). Trigger: random chance every 60s (chattiness affects frequency). Display: BillboardGui speech bubble above pet, typewriter text, auto-dismiss 4s. Mood system: happiness NumberValue affected by feeding, playing minigame with pet, time equipped. Low mood: sad dialogue, reduced stat bonuses. High mood: enthusiastic dialogue, bonus stats.' },
      { name: 'Mount Combat', keywords: ['mounted combat', 'fight on mount', 'cavalry', 'mounted attack', 'horseback combat'],
        how: 'While mounted: access mounted weapon set (Lance, Bow from horseback). Lance: high damage charge attack (bonus damage proportional to mount speed). Bow: normal ranged but with mount speed benefit for drive-by attacks. Mount takes damage separately from rider (mount HP bar above mount). If mount HP reaches 0: dismount forced, mount despawns (cooldown to resummon). Mount armor: equippable, adds defense to mount. Mounted dash: special ability, short burst of speed + knockback to nearby enemies. Cannot use ground-only abilities while mounted.' },
    ],
  },

  // ════════════════════════════════════════════════════════════════════
  // MODDING & USER GENERATED CONTENT
  // ════════════════════════════════════════════════════════════════════
  {
    name: 'Modding & User Generated Content',
    systems: [
      { name: 'Custom Map Editor', keywords: ['map editor', 'custom map', 'level editor', 'map creator', 'build map'],
        how: 'In-game editor mode: fly camera, toolbar of Parts/Models. Place/move/delete Parts with handles. Save map: serialize all Parts as JSON-like table {parts:[{size,pos,color,material,name}]}. DataStore stores maps per player. Share: map code system (8-char code). Others can load and play your map. Rating: after playing, rate 1-5 stars. Featured maps: admin-picked or highest rated. Map browser: ScreenGui with search + filters + preview (ViewportFrame). Version history: keep last 3 saves. Play test: toggle between edit and play mode. Part limit: 500 per map (free), 2000 (premium).' },
      { name: 'Custom Game Mode Creator', keywords: ['custom game mode', 'game creator', 'user game', 'custom rules', 'game maker'],
        how: 'ScreenGui game mode editor: set rules without code. Options: team count(1-4), round time(30-600s), win condition(most kills/first to N/last standing/score), respawn(yes/no, delay), gravity(0.5x-3x), walkspeed(8-32), health(50-500), weapons(toggle each), powerups(toggle each). Save as game mode: name + rules table in DataStore. Host: create private server with custom mode. Browse community modes: list with ratings. Editor generates ModuleScript-compatible config that standard round system reads. Cannot inject scripts (safety).' },
      { name: 'Skin / Asset Creator', keywords: ['skin creator', 'custom skin', 'design skin', 'create cosmetic', 'asset creator'],
        how: 'In-game skin editor: select base item (sword, armor, pet). Customize: color per part section (head, body, limbs), material per section, pattern overlays (stripe, dots, stars — Decal presets), nameplate text. Preview in ViewportFrame. Submit for review: stored in DataStore "PendingAssets". Admin approval queue. Approved: available in marketplace for other players to buy (creator earns 70% of sale price). Reject: feedback message to creator. Content guidelines displayed during creation. Anti-inappropriate: banned color combos, text filter on names.' },
      { name: 'Replay Sharing System', keywords: ['replay share', 'share game', 'game replay', 'watch replay', 'replay code'],
        how: 'Record match: server stores all player actions as event stream [{tick, playerId, action, data}]. Compress: delta encoding (only store changes). Save: DataStore + unique replay code (8 chars). Share code: paste in ScreenGui replay browser. Watch: client plays back events, spawning NPCs that mimic original players. Camera: free cam or follow specific player. Speed controls: 0.5x, 1x, 2x, skip to timestamp. Bookmark highlights: mark interesting moments during playback. Storage limit: keep last 20 replays per player. Public replays: opt-in, browseable by others, sorted by rating.' },
    ],
  },

  // ════════════════════════════════════════════════════════════════════
  // ANTI-GRIEF & MODERATION TOOLS
  // ════════════════════════════════════════════════════════════════════
  {
    name: 'Anti-Grief & Moderation Tools',
    systems: [
      { name: 'Vote Kick', keywords: ['vote kick', 'kick player', 'votekick', 'remove player', 'kick vote'],
        how: 'Initiate: ScreenGui "Vote Kick" against target player. Requires 3+ online players. Vote prompt sent to all others: "{Player} wants to kick {Target}. Reason: {reason}. Vote: Yes/No". 30s vote window. Threshold: >60% Yes votes = kick. Kicked player: teleported out, 15-minute rejoin cooldown for that server. Abuse prevention: each player can initiate 1 vote per 10 minutes. If vote fails: initiator cannot re-target same player for 30 min. Log all vote kicks to DataStore for admin review.' },
      { name: 'Chat Filter / Toxicity', keywords: ['chat filter', 'toxicity filter', 'bad word', 'profanity filter', 'chat moderation'],
        how: 'Roblox TextChatService has built-in filter. Additional custom layer: ModuleScript banned phrases (update without code deploy via DataStore "BannedPhrases"). On chat message: check against custom list (exact + fuzzy match for l33t speak). Violation: replace message with "***", increment warnings counter. 3 warnings: auto-mute 10 minutes. 5 warnings: auto-mute 1 hour. Persistent offenders: flag for admin review. Positive reinforcement: helpful messages tracked, reward "Friendly Player" badge at 100 positive interactions.' },
      { name: 'Grief Prevention Zones', keywords: ['grief prevention', 'protected zone', 'anti grief', 'building protection', 'no destroy zone'],
        how: 'Player-owned areas: only owner can modify Parts within bounds. Server validates: on any Part operation (place/move/destroy), check if Part is within another player\'s protected zone AND actor is not owner → reject. Shared access: owner can add collaborators (DataStore whitelist). Public areas: admin-only modification. Collision: cannot push other players (CustomPhysicalProperties with infinite friction or BodyPosition resistance). Item dropping: disabled near other player bases. Build permission levels: None/View/Interact/Build/Admin.' },
      { name: 'Admin Command System', keywords: ['admin command', 'admin tool', 'moderator', 'admin panel', 'mod commands'],
        how: 'Admin list: table of userIds in ModuleScript + DataStore (hot-updateable). Commands via chat prefix "!": !kick(player, reason), !ban(player, duration, reason), !mute(player, duration), !tp(player, destination), !give(player, item, amount), !announce(message), !warn(player, message). Parse: split by space, match command, validate args. Log all commands: DataStore "AdminLog" {admin, command, target, timestamp}. ScreenGui admin panel: buttons for common actions, player list with quick-action dropdown. Rank levels: Mod(kick/mute), Admin(ban/give), Owner(all).' },
      { name: 'Automated Behavior Detection', keywords: ['auto detect', 'behavior detection', 'bot detection', 'exploit detect', 'auto ban'],
        how: 'Server monitors: RemoteEvent fire rate (>50/s = bot), movement pattern (perfectly straight lines = pathfinding exploit), economy anomalies (gaining coins faster than maximum possible rate), damage output (exceeding weapon maximum). Detection: flag account, log evidence (timestamps + values). Thresholds: warning(1 flag per 5 min), auto-kick(3 flags per 10 min), temp-ban(kicked 3x = 24h ban). False positive protection: threshold buffer + admin review queue for bans. Appeal: banned players see link to appeal form. Evidence packet saved for admin review.' },
    ],
  },

  // ════════════════════════════════════════════════════════════════════
  // PLATFORMER SYSTEMS
  // ════════════════════════════════════════════════════════════════════
  {
    name: 'Platformer Systems',
    systems: [
      { name: 'Double Jump / Wall Jump', keywords: ['double jump', 'wall jump', 'extra jump', 'air jump', 'jump boost'],
        how: 'Double jump: UserInputService detects Space while Humanoid.FloorMaterial == nil (in air). Apply upward BodyVelocity (Velocity = Vector3.new(0, jumpForce, 0), MaxForce = Vector3.one * 1e5, Debris 0.15s). Track jumps with IntValue "JumpsRemaining" (reset to 2 on land). Triple jump upgrade: JumpsRemaining = 3. Visual: puff ParticleEmitter at feet on each air jump. Sound: whoosh, softer each subsequent jump. Wall jump: raycast sideways while in air + near wall, if hit → launch perpendicular + up. Wall slide: slow descent while touching wall (reduced gravity BodyForce).' },
      { name: 'Checkpoint System', keywords: ['checkpoint', 'save point', 'respawn point', 'checkpoint flag', 'progress save'],
        how: 'Checkpoint Parts at intervals along course. Touched event: if player reaches new checkpoint (index > current), save checkpoint CFrame in player data. On death: respawn at last checkpoint (CFrame player to saved position). Visual: flag Model (Cyl pole + wedge flag Part). Inactive: white flag. Active: green flag + glow PointLight. Sound: checkpoint chime. DataStore: save last checkpoint index for persistence. "Restart" button: reset to first checkpoint. Checkpoint counter in HUD: "Checkpoint 5/12". Per-player (not shared) checkpoints.' },
      { name: 'Moving Platforms', keywords: ['moving platform', 'platform move', 'sliding platform', 'platform puzzle', 'elevator platform'],
        how: 'Platform Part moves between 2+ waypoints. Movement: TweenService ping-pong between CFrame waypoints (TweenInfo RepeatCount=-1, Reverses=true). Player standing on platform: moves with it (Touched → WeldConstraint to platform, TouchEnded → remove weld). Types: horizontal slide, vertical elevator, circular orbit (CFrame:Angles rotation path), disappearing (Transparency cycle, CanCollide toggle). Timing challenge: platforms appear/disappear on interval. Speed varies: slow=easy, fast=hard. Sound: mechanical hum while moving.' },
      { name: 'Collectible Coins / Stars', keywords: ['platformer coin', 'collect star', 'platform collectible', 'coin collect', 'floating coin'],
        how: 'Small Part collectibles (Cyl for coins, Ball for stars) floating in air. Hover: slight Y oscillation via CFrame loop (math.sin). Rotate: CFrame Y rotation loop. Touched by player: collect (Destroy local, RemoteEvent to server). Grant: +1 coin/star to player count. BillboardGui "+1" floats up and fades. Sound: ascending pitch coin collect (vary by streak). Placement: along paths, on platforms, in tricky spots. Counter: "47/100 Coins" in HUD. 100% collection: special reward. Respawn on stage restart.' },
      { name: 'Hazards / Traps', keywords: ['trap', 'hazard', 'spike', 'lava floor', 'kill brick', 'danger zone'],
        how: 'Kill bricks: red Neon Parts, Touched = instant death (Humanoid.Health = 0). Lava: red-orange Neon floor, same kill mechanic + fire ParticleEmitter. Spikes: sharp wedge Parts that pop up on timer (TweenService Y position). Saw blades: rotating disc Parts (CFrame rotation loop) that deal damage on contact. Falling rocks: scripted to fall when player passes trigger Part (anchor=false on Touched). Laser grid: Beam instances that toggle on/off (gap timing). Crusher: Part moves up/down, kills between floor and crusher. Sound: unique per hazard.' },
      { name: 'Boss Platform Fight', keywords: ['platform boss', 'boss fight platformer', 'jump boss', 'dodge boss', 'platformer boss'],
        how: 'Boss arena: enclosed area, boss Model at far end. Boss attacks: projectiles (Part with BodyVelocity toward player, dodge by jumping), ground slam (floor tiles flash red, then kill 1s later — dodge by jumping to safe tiles), laser sweep (horizontal Beam moves up, duck or jump over). Boss takes damage: jump on head (Touched on boss top Part = -1 HP) or use projectile weapons. 3 hits to defeat. Between hits: boss becomes invulnerable, new attack pattern. On defeat: boss explodes (ParticleEmitter), door opens to next area. Dramatic music during fight.' },
    ],
  },

  // ════════════════════════════════════════════════════════════════════
  // SEASONAL CONTENT & EVENTS ADVANCED
  // ════════════════════════════════════════════════════════════════════
  {
    name: 'Seasonal Content & Events Advanced',
    systems: [
      { name: 'Event Pass / Ticket System', keywords: ['event pass', 'event ticket', 'entry ticket', 'event entry', 'premium event'],
        how: 'Special events require entry ticket. Free ticket: 1 per day (DataStore last claim timestamp). Premium tickets: DevProduct purchase (5 for $1.99). Ticket consumed on event entry. Event instances: ReservedServer per group of players. Event types: raid boss, treasure hunt, PvP tournament, obstacle course. ScreenGui event lobby: shows upcoming events with start times, ticket cost, reward preview. No ticket = spectate only. Event history: DataStore logs participation + rewards earned. Leaderboard: per-event performance ranking.' },
      { name: 'Community Goal', keywords: ['community goal', 'global goal', 'server goal', 'collective challenge', 'community event'],
        how: 'Server-wide or global objective: "Collectively defeat 10,000 enemies this week!" Progress: MessagingService broadcasts increments across all servers. Global counter: DataStore key "CommunityGoal_Week42" incremented atomically (UpdateAsync). Display: giant SurfaceGui in spawn showing progress bar + current count. Milestones: at 25%/50%/75%/100%, all online players get instant reward. 100% completion: exclusive item unlocked for all who contributed. Contribution tracking: per-player DataStore stores individual contribution for reward scaling. New goal each week.' },
      { name: 'World Boss Event', keywords: ['world boss', 'server boss', 'public boss', 'raid event', 'mega boss'],
        how: 'Scheduled: every 2 hours, announced 5 minutes prior via RemoteEvent "WorldBossIncoming". Boss spawns in designated arena: massive Model (3-5x player size), Humanoid with 100,000+ HP. All online players can participate. DPS contribution tracked per player (DataStore during fight). Boss mechanics: AoE ground slam (floor circles), projectile barrage, add spawns every 25%. On defeat: loot distributed proportional to contribution (top DPS = best loot). Timer: 10 minutes to defeat, or boss despawns (fail). Resurrection during fight: automatic after 5s. Leaderboard: top damage dealers shown post-fight.' },
      { name: 'Countdown / Hype Timer', keywords: ['countdown', 'hype timer', 'event countdown', 'new content timer', 'countdown clock'],
        how: 'For upcoming content/events: SurfaceGui countdown clock in spawn area. Shows: days:hours:minutes:seconds until event. BillboardGui hologram of upcoming content preview (ViewportFrame with rotating model of new item/area). Daily teasers: DataStore-driven SurfaceGui that changes text/image daily ("3 days: A new challenger approaches...", "2 days: They say it breathes fire...", "1 day: TOMORROW."). Notification: push when countdown < 1h. At 0: content unlocks automatically (server swaps in new content from ServerStorage). Confetti + trumpet sound + announcement screen on launch.' },
      { name: 'Limited-Time Challenge', keywords: ['limited challenge', 'timed challenge', 'time challenge', 'speed challenge', 'rush event'],
        how: 'Pop-up events lasting 15-60 minutes. Types: Speed Run(complete obby fastest), Kill Rush(most enemies in time), Collection Frenzy(most collectibles gathered), Survival(last standing in shrinking zone). Announce: server-wide RemoteEvent + ScreenGui popup "CHALLENGE STARTING IN 30s!". Auto-opt-in: all players in relevant zone. Scoring: real-time leaderboard (ScreenGui sidebar). End: freeze scores, announce top 3, distribute rewards (1st/2nd/3rd get scaling prizes, all participants get participation reward). Cooldown: next challenge in 45 min. History: DataStore logs results.' },
    ],
  },

  // ════════════════════════════════════════════════════════════════════
  // ECONOMY ADVANCED FEATURES
  // ════════════════════════════════════════════════════════════════════
  {
    name: 'Economy Advanced Features',
    systems: [
      { name: 'Token/Ticket Redemption', keywords: ['token redeem', 'ticket prize', 'prize shop', 'redeem tokens', 'arcade tickets'],
        how: 'Earn tokens from minigames (5-100 per game based on score). Token counter: IntValue in leaderstats. Prize shop: NPC with ScreenGui showing prize items with token costs. Prizes: cosmetics(50-500 tokens), consumables(10-30), exclusive pets(1000+), limited items(5000+). Cannot buy tokens directly (must earn through gameplay). Token cap: max 99,999 to prevent inflation. ScreenGui shows token animation: "+25 Tokens" after each minigame. Prize display: physical Models on shelves behind counter with SurfaceGui price tags.' },
      { name: 'Lending / Borrowing', keywords: ['lend', 'borrow', 'loan item', 'lend item', 'temporary trade'],
        how: 'Lend item to friend: select item + recipient + duration (1h/4h/24h). Server: move item from lender to borrower inventory with BoolValue "Borrowed" + NumberValue "ReturnTime". Borrower can use item normally. At ReturnTime: server auto-returns item to lender (even if borrower offline — DataStore pending returns). Borrower cannot trade/sell/destroy borrowed items. Early return: borrower can return via ProximityPrompt or ScreenGui button. Collateral: optional, borrower deposits coins held until return. Late return: 2x collateral taken.' },
      { name: 'Reward Multiplier Events', keywords: ['2x coins', 'double xp', 'multiplier event', 'bonus weekend', '2x event'],
        how: 'Server-wide multiplier: NumberValue "EventMultiplier" (default 1). Admin or schedule sets to 2 (or 3, 5 for special occasions). Applies to: coin gains, XP gains, drop rates. Duration: 1-72 hours. Announcement: "2X COINS ACTIVE!" permanent banner in HUD (gold text, pulsing). Countdown: time remaining shown. Stacks with personal multipliers (pet, gamepass). Sound: power-up chime on event start. Schedule: weekends = 2x, holidays = 3x, milestones (1M total visits) = 5x for 24h. ScreenGui event popup explains what is boosted.' },
      { name: 'Achievement Currency', keywords: ['achievement points', 'achievement currency', 'achievement shop', 'merit points', 'honor points'],
        how: 'Separate currency earned ONLY from achievements. Cannot be bought or traded. Points per achievement scaled by difficulty: Easy=10, Medium=50, Hard=200, Secret=500. Achievement shop: exclusive items purchasable only with achievement points. Items: unique cosmetics, permanent stat boosts, convenience upgrades. Prevent pay-to-win: achievement currency ensures these rewards come from skill/time investment. ScreenGui: achievement points displayed with badge icon. Points persist permanently (never spent, only accumulated — shops check total points not balance). Milestone tiers at 100/500/1000/5000 points unlock shop tiers.' },
      { name: 'Mystery Box / Lucky Dip', keywords: ['mystery box', 'lucky dip', 'random reward', 'surprise box', 'mystery reward'],
        how: 'Physical mystery box Part in world (colorful wrapped present Model). Cost: coins or earned from quests. Open: ProximityPrompt → server rolls from weighted table. Possible contents: coins (50% chance, 1-5x cost), rare item (30%, value exceeds cost), junk (15%, funny useless items — great for laughs), jackpot (5%, high-value item worth 10-50x cost). Opening animation: box shakes, lid pops off (TweenService), item rises from box (BodyVelocity up + spotlight), reveal with rarity flash. Sound: drum roll during open, result jingle matches rarity. Daily free box: one free per day.' },
    ],
  },

  // ════════════════════════════════════════════════════════════════════
  // SANDBOX DESTRUCTION & PHYSICS
  // ════════════════════════════════════════════════════════════════════
  {
    name: 'Sandbox Destruction & Physics',
    systems: [
      { name: 'Ragdoll System', keywords: ['ragdoll', 'ragdoll physics', 'ragdoll death', 'limp body', 'physics body'],
        how: 'On death or trigger: convert R15 character to ragdoll. Method: set all Motor6D joints to BallSocketConstraint (or HingeConstraint per joint type). Disable Humanoid.AutoRotate, Humanoid:SetStateEnabled(GettingUp, false). Each limb becomes physics-driven. Velocity from last movement carries into ragdoll (realistic fall direction). Duration: 3s then either reset (stand up) or respawn. Sound: thud on body hitting ground. Ragdoll on: death, strong knockback, stun effects, comedic moments. Toggle in settings (some players dislike it).' },
      { name: 'Explosive Barrel / Chain Reaction', keywords: ['explosive barrel', 'explosion chain', 'chain reaction', 'barrel explosion', 'explode'],
        how: 'Red barrel Parts scattered in environment. On hit (weapon damage or explosion): barrel HP -= damage. At 0: Explosion instance (BlastRadius 15, BlastPressure 500000, DestroyJointRadiusPercent 0). Chain: explosion hits nearby barrels, triggering them too. Debris: barrel shatters into 6-8 small Parts with BodyVelocity outward. Fire ParticleEmitter at explosion center (2s). Sound: boom + metal debris clink. Deals damage to players/NPCs in radius. Strategic placement: near enemy groups for chain reaction combos. Respawn barrels after 120s.' },
      { name: 'Cannon / Catapult', keywords: ['cannon', 'catapult', 'launch', 'trebuchet', 'cannon fire'],
        how: 'Cannon Model with barrel Part. VehicleSeat to aim (A/D rotates Y axis, W/S adjusts elevation angle). Fire: keybind (F) spawns cannonball Part (Ball shape, Metal material) at barrel end with BodyVelocity in barrel lookVector * power. Cannonball: Touched = Explosion(BlastRadius 10). Gravity affects trajectory (parabolic arc). Power charge: hold F to increase power (0.5-3s hold = different ranges). Sound: boom on fire, whistle during flight, explosion on impact. Catapult variant: same physics but Medieval aesthetic, loads Part into scoop, release flings.' },
      { name: 'Physics Playground', keywords: ['physics playground', 'physics sandbox', 'physics toy', 'wrecking ball', 'physics fun'],
        how: 'Area with physics-interactive objects: domino line (tall thin Parts, tip first → chain falls), wrecking ball (Ball on RopeConstraint attached to ceiling, swing into structures), bowling (Ball launched at Pin parts via BodyVelocity), Jenga tower (stacked small Parts, remove one via ClickDetector without toppling), marble run (Ball rolling through ramp/funnel Parts). All objects: Anchored=false, CollisionGroup set to interact. Reset button: restores all objects to original CFrame. Physics quality: server authoritative, client prediction for responsiveness. Sound: impact thuds, rolling, clattering.' },
      { name: 'Building Demolition', keywords: ['demolish', 'demolition', 'tear down', 'wreck building', 'destroy building'],
        how: 'Pre-built structures made of many unanchored Parts (WeldConstraint holding them together). Weld HP: IntValue per weld. Damage to weld: explosions and heavy impacts break welds. When weld breaks: connected Parts become loose (fall under gravity). Chain collapse: upper Parts lose support → fall → impact breaks more welds below. Controlled demolition: place charges at key structural welds (ProximityPrompt "Place Charge"), trigger all at once for satisfying collapse. Debris cleanup: loose Parts Debris:AddItem after 10s. Scoring: most Parts knocked down = highest score. Slow-motion replay of best demolition.' },
      { name: 'Grapple / Rope Physics', keywords: ['grapple', 'rope', 'grappling hook', 'swing', 'rope swing'],
        how: 'Grapple Tool: Activate → raycast from player toward mouse position (max range 60 studs). If hit surface: spawn RopeConstraint between character and hit point. Swing physics: character swings as pendulum (RopeConstraint Length = distance to hit). Shorten rope: W key decreases Length (pull toward anchor). Release: jump key detaches rope. Speed boost: release at bottom of swing for maximum velocity (conservation of momentum). Visual: Beam between hand and anchor point. Sound: whoosh while swinging, rope creak. Cooldown: 1s after release before can grapple again.' },
    ],
  },

  // ════════════════════════════════════════════════════════════════════
  // STRATEGY & RESOURCE MANAGEMENT
  // ════════════════════════════════════════════════════════════════════
  {
    name: 'Strategy & Resource Management',
    systems: [
      { name: 'Resource Nodes & Respawn', keywords: ['resource node', 'resource respawn', 'resource point', 'gathering node', 'node respawn'],
        how: 'Resource nodes: Parts placed in world tagged by type (Wood, Stone, Iron, Gold, Crystal). Each node: IntValue "Remaining" (3-10 harvests). Interact: Tool hit or ProximityPrompt → grant resource, decrement Remaining. At 0: node depletes (visual: Part becomes dark + Transparency 0.5). Respawn timer: 120-600s depending on rarity. On respawn: full reset, visual restore. Randomized locations: each server seed slightly shifts node positions (not always same spot). Mini-map markers for discovered nodes. Competition: first-come-first-served, no reservations.' },
      { name: 'Army / Unit Management', keywords: ['army', 'unit', 'troops', 'command army', 'unit management', 'strategy army'],
        how: 'Recruit units at barracks: {type:"Swordsman", cost:100, hp:50, damage:10, speed:12}. Unit cap: based on supply (start 10, upgrade to 50). Spawn units: click location on field, units pathfind there. Group select: drag rectangle on ground Part (Region3 check). Commands: Move(click location), Attack(click enemy), Patrol(two points, walk back and forth), Guard(stand at position, attack enemies in range). Formation: units auto-arrange in grid around command point. Unit health shown as small BillboardGui bars. Killed units: respawn at barracks after cooldown.' },
      { name: 'Base Defense / Siege', keywords: ['base defense', 'siege', 'defend base', 'castle siege', 'wall defense'],
        how: 'Defender builds walls/towers in preparation phase (30-60s). Attacker waves spawn after prep. Walls: Parts with IntValue HP, enemies attack walls to break through. Towers: auto-attack enemies in range (projectile Parts). Gate: main entry, highest HP, must be breached for attackers to win. Defender tools: repair walls (ProximityPrompt, costs resources), deploy traps (spike strips, pitfalls), call reinforcement NPC waves. Attacker tools: siege weapons (catapult damages walls at range), ladder (lets units climb walls). Win: attacker destroys core OR timer expires (defender wins).' },
      { name: 'Tech / Research Tree', keywords: ['tech tree', 'research', 'unlock tech', 'technology', 'upgrade research'],
        how: 'Research panel ScreenGui: tree diagram of technologies. Each tech: {name, cost:{coins, time}, requires:[techIds], effect}. Research: select tech, pay cost, wait researchTime (real seconds, 30-300). Progress bar shows completion. Effects: unlock new units, unlock new buildings, improve stats (+10% damage globally), unlock abilities. Only one research active at time (queue optional upgrade). Era system: research enough techs in current era to unlock next era\'s tree. Visual: completed techs glow, available pulse, locked are dimmed. Cannot rush research (patience-based progression).' },
      { name: 'Supply Chain / Production', keywords: ['supply chain', 'production', 'factory production', 'manufacture', 'production line'],
        how: 'Buildings produce resources over time. Farm → Food (1/min). Mine → Stone (1/min). Lumber Mill → Wood (1/min). Smelter: consumes 2 Stone → produces 1 Metal (2 min). Armory: consumes 3 Metal → produces 1 Weapon (5 min). Chain: output of one building feeds input of next. ScreenGui production overview: flowchart showing all buildings with production rates, bottleneck highlighting (red if input insufficient). Upgrade buildings: faster rate, larger output buffer. Workers: assign NPC workers to buildings for bonus. Storage limit per resource: build warehouses for more capacity.' },
      { name: 'Diplomacy / Trade Routes', keywords: ['diplomacy', 'trade route', 'trade agreement', 'peace', 'war declaration strategy'],
        how: 'Between player-controlled bases/factions. Diplomacy panel ScreenGui: list all other players/factions with relationship status (War/Neutral/Friendly/Allied). Actions: Propose Peace(stop attacks), Trade Agreement(shared resource access, both benefit), Alliance(mutual defense), Declare War(enables attacking). Trade routes: if Trade Agreement active, caravan NPC travels between bases periodically carrying resources (both players receive bonus resources per trip). Routes vulnerable: enemies can ambush caravans on the path. Broken agreements: reputation penalty, 24h cooldown before new agreements.' },
    ],
  },

  // ════════════════════════════════════════════════════════════════════
  // ADVANCED PET FEATURES
  // ════════════════════════════════════════════════════════════════════
  {
    name: 'Advanced Pet Features',
    systems: [
      { name: 'Pet Accessory / Fashion', keywords: ['pet accessory', 'pet hat', 'pet outfit', 'pet fashion', 'dress pet'],
        how: 'Pet accessories: small Parts/MeshParts welded to pet model. Categories: Hats(top of head), Necklace(neck area), Wings(back), Aura(ParticleEmitter around body). Each accessory: {name, slot, model, rarity, statBonus}. Equip: ScreenGui pet customization panel, drag accessory to slot. Some accessories: stat bonuses (+5% damage, +10% luck). Sources: crafting, shop, event rewards, gacha. Preview in ViewportFrame before equipping. Outfit presets: save 3 combos for quick swap. Fashion contests: periodic event where players vote on best-dressed pet.' },
      { name: 'Pet Breeding', keywords: ['breed', 'pet breed', 'combine pets', 'breed system', 'offspring', 'baby pet'],
        how: 'Select 2 pets of same species. Breeding station: ProximityPrompt opens ScreenGui with parent slots. Both parents must be max level. Cost: coins + breeding token (rare item). Result: offspring inherits random traits from both parents. Offspring rarity: weighted average of parents (two Legendaries rarely produce below Epic). Unique traits: color blending (parent colors mix), stat inheritance (random parent stat per category). Breeding cooldown: 24h per pet. Offspring starts at level 1. Rare mutation chance (1%): unique color pattern not available otherwise. DataStore: family tree tracking parentage.' },
      { name: 'Pet Battles (PvP)', keywords: ['pet pvp', 'pet battle pvp', 'pet fight player', 'pet duel', 'pet versus'],
        how: 'Challenge player: RemoteEvent "PetBattleChallenge". Both accept → battle screen. Turn-based: each pet has 4 moves (Attack, Special, Defend, Heal). Stats determine damage: attacker.damage - defender.defense = damage dealt. Element matchups apply (1.5x advantage, 0.5x disadvantage). HP bars per pet. 3v3 format: each player selects 3 pets, send out one at a time, switch on KO. Turn timer: 15s or auto-defend. Winner: all opponent pets KO\'d. Reward: battle points currency for exclusive shop items. Rank system: Bronze→Silver→Gold→Diamond→Champion based on win record.' },
      { name: 'Pet Housing / Habitat', keywords: ['pet house', 'pet habitat', 'pet room', 'pet home', 'pet den'],
        how: 'Each pet has preferred habitat type: Forest, Ocean, Mountain, Desert, Sky. Habitat slots in player\'s pet area. Build habitat: 500 coins, select type. Assign pet to matching habitat: happiness bonus (+20%), stat boost (+10%). Wrong habitat: no bonus. Habitat decorations: plants, toys, food bowls (purchasable from shop, grant additional bonuses). Visit pet in habitat: ScreenGui shows pet animated in habitat with decorations. Multiple habitats: unlock more slots at player level milestones. Habitat level: earn XP from assigned pets, unlock better decorations at higher levels.' },
      { name: 'Pet Expedition / Auto-Farm', keywords: ['pet expedition', 'pet auto farm', 'pet mission', 'send pet', 'pet adventure'],
        how: 'Send idle pets (not equipped) on expeditions. Expedition board ScreenGui: missions with requirements (pet level, pet element, expedition duration). Assign 1-3 pets. Duration: 1h/4h/8h (real time, offline OK). Rewards: coins, materials, rare items (better with higher rarity pets + matching element). Success rate: based on combined pet power vs mission difficulty. Failure: reduced rewards, no pet loss. Collect on return: ScreenGui shows expedition results with item reveals. Max 3 expeditions simultaneously. DataStore: stores active expeditions with start time, calculates on collection.' },
    ],
  },

  // ════════════════════════════════════════════════════════════════════
  // NARRATIVE & WORLD BUILDING
  // ════════════════════════════════════════════════════════════════════
  {
    name: 'Narrative & World Building',
    systems: [
      { name: 'NPC Relationship / Affinity', keywords: ['npc relationship', 'affinity', 'friendship npc', 'npc trust', 'relationship level'],
        how: 'Each NPC has relationship value per player (0-100). Increase: give gifts (NPC-preferred items), complete their quests, talk daily. Decrease: attack NPC, steal from NPC, fail quests. Tiers: Stranger(0-20), Acquaintance(20-40), Friend(40-60), Close Friend(60-80), Best Friend(80-100). Each tier unlocks: new dialogue options, personal quests, discounts at their shop, gift items. Heart icon above NPC shows current tier (gray→green→blue→purple→gold). Daily interaction cap (3 gifts, 1 quest) prevents speed-running. DataStore stores per-NPC-per-player relationships.' },
      { name: 'Day-Night NPC Behavior', keywords: ['npc day night', 'npc sleep', 'npc behavior time', 'npc home', 'npc schedule time'],
        how: 'NPC schedules linked to Lighting.ClockTime. Morning(6-9): NPCs walk to workplace (PathfindingService). Day(9-17): NPCs at stations (shopkeeper behind counter, guard on patrol route, farmer at field). Evening(17-20): NPCs socialize (walk to tavern/plaza, group animations). Night(20-6): NPCs go home (enter house door, despawn until morning). Closed shops: SurfaceGui shows "CLOSED - Open 9AM". Night guard NPCs: only active at night, patrol with torch. Moon phases affect certain NPCs (werewolf NPC at full moon). Dialogue changes by time: "Good morning!" vs "Late night, huh?"' },
      { name: 'Environmental Storytelling', keywords: ['environmental story', 'world lore', 'visual narrative', 'story through environment', 'show dont tell'],
        how: 'Tell story through placed objects, not just dialogue. Examples: abandoned campsite (overturned chairs, scattered items) hints at sudden evacuation. Claw marks on walls (Decals) suggest monster attack. Journal pages (SurfaceGui on Part) scattered in ruins reveal history. Graveyard headstones with dates tell timeline of plague. Trail of footprints (Decals) leads to hidden area. Burned village with charred Parts tells of dragon attack. Faded mural (ImageLabel on wall) shows ancient civilization. Each environmental detail: clickable ProximityPrompt "Examine" reveals player thought ("These scratches look recent...").' },
      { name: 'Faction War / World State', keywords: ['faction war', 'world state', 'dynamic world', 'world change', 'faction control'],
        how: 'Two+ factions compete for map control. World state: DataStore tracks which faction controls each zone (updated by player actions — kills, quests, donations). Zone appearance changes: winning faction\'s banners hang, NPC guards match faction, shop inventory reflects faction. Frontline zones: contested, PvP enabled, special quest objectives (capture flag, eliminate leader). Player contributes to faction by: quests in faction territory, PvP kills, resource donations. Server recalculates control every hour. Map UI: color-coded zones showing faction control. Losing faction: rallying bonuses to prevent steamroll (+25% stats in contested zones).' },
      { name: 'Prophecy / Destiny System', keywords: ['prophecy', 'destiny', 'chosen one', 'fate', 'prophecy system'],
        how: 'On first join: generate player "Prophecy" from template: "The {adjective} {noun} shall {verb} the {place} and {outcome}." Adjective: based on first action taken. Noun: based on first item obtained. Verb: evolves based on playstyle (combat-focused="conquer", social="unite", explorer="discover"). Place: most-visited zone. Outcome: hidden until fulfilled. Prophecy revealed gradually: pieces unlock at milestones. ScreenGui prophecy scroll: shows revealed portions, "???" for hidden. Fulfillment: when all conditions met → special event + unique reward. Each player gets unique prophecy. Shareable: compare with friends.' },
    ],
  },

  // ════════════════════════════════════════════════════════════════════
  // AUTOMATION & FACTORY SYSTEMS
  // ════════════════════════════════════════════════════════════════════
  {
    name: 'Automation & Factory Systems',
    systems: [
      { name: 'Conveyor Belt Network', keywords: ['conveyor network', 'belt system', 'item transport', 'factory conveyor', 'logistics belt'],
        how: 'Conveyor Parts: long thin Parts with surface Velocity property (Vector3 along belt direction). Items placed on conveyor: pushed by Velocity. Connect conveyors: place end-to-end, items transfer between. Splitter: 1 belt → 2 outputs (alternating items left/right). Merger: 2 belts → 1 output (first-come). Corner pieces: velocity changes direction via angled Part. Speed tiers: Slow(5 studs/s, free), Medium(15, 500 coins), Fast(30, 2000 coins). Visual: animated texture (scrolling arrow Decal via TextureOffset loop). Sound: rubber belt hum. Blueprint: save conveyor layouts for copy-paste.' },
      { name: 'Auto-Miner / Auto-Collector', keywords: ['auto miner', 'auto collector', 'automatic mining', 'drone mine', 'auto gather'],
        how: 'Machines that automatically gather resources. Auto-Miner Model: placed near resource node, task.spawn loop every 10s extracts 1 resource (deducts from node, adds to storage). Storage bin: IntValue capacity (50 default, upgradeable). Full storage: stops until collected. Collector drone: small floating Part that flies between resource nodes and storage (TweenService path). Upgrade: faster extraction (10s→5s→2s), larger storage (50→100→500). Cost: escalating per machine. ScreenGui shows all machine statuses: resource type, storage fill, active/inactive. Power system optional: machines require fuel (coal = 100 operations).' },
      { name: 'Factory Production Line', keywords: ['production line', 'assembly line', 'factory line', 'manufacture', 'auto produce'],
        how: 'Chain: input chest → processing machine → output chest. Machine types: Furnace(ore→bar), Sawmill(log→plank), Assembler(2+ materials→product). Each machine: input/output slots (IntValue tracking items). Processing time: 5-30s per item. Queue: if input has items and output has space, auto-process. Multiple machines chained: output of Furnace feeds Assembler. ScreenGui factory dashboard: flowchart of all machines with throughput stats (items/min). Bottleneck highlight: slowest machine in chain shown in red. Upgrade machines: faster processing, batch processing (2 items at once).' },
      { name: 'Power / Energy Grid', keywords: ['power grid', 'energy', 'generator', 'electricity', 'power system'],
        how: 'Machines require power. Generator Models: Coal(10 power, burns 1 coal/min), Solar(5 power, free but day-only), Nuclear(50 power, expensive). Power grid: total generation vs total consumption. If consumption > generation: random machines shut off. Power lines: visual Beam between generator and machines (decorative). ScreenGui power panel: bar showing generation/consumption, list of consumers. Battery: stores excess power (capacity 100), used when generation dips. Upgrade: higher-tier generators. Power priority: set which machines get power first when supply is limited. Brown-out warning: flicker Lighting when power is critical.' },
      { name: 'Pipe / Fluid System', keywords: ['pipe', 'fluid', 'water pipe', 'oil pipe', 'pipe system', 'pipeline'],
        how: 'Transport fluids between machines. Pipe Parts: Cyl shape connecting machines. Fluid types: Water, Oil, Lava, Acid (color-coded contents visible through transparent pipe). Flow rate: amount per second based on pipe tier (1/s, 5/s, 20/s). Pumps: required to push fluid uphill (BodyForce analog). Valves: toggle flow on/off (BoolValue). Tank storage: hold fluid buffer (capacity varies). Fluid used in: cooling machines (Water), fuel (Oil), crafting (Acid for etching). Leaks: damaged pipes (from attacks or wear) lose fluid until repaired. ScreenGui: pipeline diagram showing flow rates and tank levels.' },
      { name: 'Drone / Robot Workers', keywords: ['drone worker', 'robot worker', 'automation drone', 'worker bot', 'automated worker'],
        how: 'Programmable drones: small Model bots that perform tasks. Program via ScreenGui: simple command list [Collect(resource, location), Deliver(location), Mine(node), Build(blueprint)]. Drone executes commands in sequence loop. Pathfinding: PathfindingService to each waypoint. Capacity: carries 10 items max (upgrade to 50). Speed: 16 studs/s (upgrade to 32). Battery: NumberValue drains while active, recharge at station (20s). Max drones: 2 (free), 5 (premium). ScreenGui drone manager: status per drone (active task, location, battery, cargo). Idle drones return to home station. Sound: quiet electric hum.' },
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
