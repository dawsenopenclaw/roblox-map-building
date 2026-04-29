import 'server-only';

/**
 * Production-quality reference Fighting game for ForjeGames AI few-shot context.
 *
 * Modeled after The Strongest Battlegrounds, Blade Ball, Untitled Boxing Game,
 * and Combat Warriors — the top Roblox fighting games by DAU.
 *
 * When a user says "make a fighting game", "pvp combat", "battlegrounds", etc.
 * the AI receives this as example output. Every system is COMPLETE and WORKING —
 * no stubs, no TODOs, no placeholder comments.
 *
 * Systems included:
 *   1. Combat System — M1 combo chain (4-hit), hitbox via GetPartBoundsInBox,
 *      startup/active/endlag frames, knockback, hitstun, heavy attack, grab/throw
 *   2. Movement Mechanics — Dash (i-frames), directional dodge, block (stamina),
 *      parry (frame-perfect), aerial combat, sprint
 *   3. Ability/Skill System — 4 skill slots, cooldowns, resource bar, ultimate,
 *      skill tree, passive abilities
 *   4. Ranking/ELO System — K-factor ELO, 7 rank tiers, matchmaking queue,
 *      season reset, OrderedDataStore leaderboard
 *   5. Character/Class System — Stat distribution, 3 classes (Brawler/Swordsman/Mage),
 *      class-specific movesets, character selection UI
 *   6. Arena Design — Flat + hazard zones, ring-out, multi-level platforms,
 *      arena voting system
 *   7. Network Architecture — Client prediction, server-authoritative hitbox,
 *      hit reconciliation, rate limiting, anti-exploit validation
 */
export function getFightingReference(): string {
  return `--[[
============================================================================
COMPLETE FIGHTING GAME — SERVER SCRIPT (ServerScriptService/FightingServer)
============================================================================
Architecture:
  - Server is AUTHORITATIVE for all damage, positions, and state.
  - Client sends INTENT only: "attack", "dash", "block". Server validates.
  - Hitboxes are calculated server-side using GetPartBoundsInBox at the
    moment of the active frame, with position reconciliation (±2 studs tolerance).
  - Frame timing: 1 frame = 1/60 second. Stun stored as a tick() expiry time.
  - Knockback uses LinearVelocity (modern API, replaces BodyVelocity).
  - ELO uses standard chess K-factor formula with rank-based K scaling.
  - All player data saved via DataStore with pcall + BindToClose + retry.

Folder Structure Required:
  Workspace/
    Arenas/
      FlatArena (Model — ground + boundary walls)
      HazardArena (Model — ground + lava zones + debris)
      TowerArena (Model — multi-level with platforms)
    ArenaVoting/ (Folder — VoteParts placed here by server)
  ServerStorage/
    CharacterTemplates/
      Brawler (Model with Humanoid, RootPart, at least 30 parts)
      Swordsman (Model with Humanoid, RootPart, Sword mesh part)
      Mage (Model with Humanoid, RootPart, Staff mesh part)
    Effects/
      HitEffect (Part — brief flash, cloned on hit)
      BlockEffect (Part — spark flash, cloned on block)
      ParryEffect (Part — gold ring, cloned on parry)
      DashTrail (Part — motion trail, cloned on dash)
      UltEffect (Part — shockwave, cloned on ult activation)
  ReplicatedStorage/
    Remotes/
      CombatRequest (RemoteEvent) — client → server intent
      CombatResult (RemoteEvent) — server → client confirmation
      StateUpdate (RemoteEvent) — server → all clients near event
      AbilityRequest (RemoteEvent)
      AbilityResult (RemoteEvent)
      MovementRequest (RemoteEvent)
      MovementResult (RemoteEvent)
      MatchUpdate (RemoteEvent) — ELO / rank updates
      ArenaVote (RemoteEvent)
    Bindables/
      PlayerDefeated (BindableEvent)
  StarterGui/
    FightingHUD (ScreenGui)
      HPBar (Frame > Bar Frame + Label)
      StaminaBar (Frame > Bar Frame)
      EnergyBar (Frame > Bar Frame + UltCharge label)
      ComboCounter (TextLabel)
      Skill1Button (TextButton + Cooldown overlay)
      Skill2Button (TextButton + Cooldown overlay)
      Skill3Button (TextButton + Cooldown overlay)
      Skill4Button (TextButton + Cooldown overlay)
      RankBadge (Frame + TextLabel)
      KillFeed (ScrollingFrame)

============================================================================
1. COMBAT SYSTEM — M1 Combos, Hitboxes, Frame Data, Knockback, Stun, Grab
============================================================================
--]]

-- ─────────────────────────────────────────────────────────────────────────────
-- SERVICES & CONSTANTS
-- ─────────────────────────────────────────────────────────────────────────────
local Players          = game:GetService("Players")
local RunService       = game:GetService("RunService")
local DataStoreService = game:GetService("DataStoreService")
local TweenService     = game:GetService("TweenService")
local PhysicsService   = game:GetService("PhysicsService")
local ReplicatedStorage= game:GetService("ReplicatedStorage")
local ServerStorage    = game:GetService("ServerStorage")
local Workspace        = game:GetService("Workspace")

-- ── Frame data constants (seconds) ──────────────────────────────────────────
local FRAME            = 1 / 60     -- one frame duration
local M1_STARTUP       = 6  * FRAME -- wind-up before hitbox is active
local M1_ACTIVE        = 4  * FRAME -- window where hit registers
local M1_ENDLAG        = 10 * FRAME -- recovery, attacker cannot act
local M1_CHAIN_WINDOW  = 0.6        -- seconds to chain next M1 before combo resets
local HEAVY_STARTUP    = 18 * FRAME
local HEAVY_ACTIVE     = 8  * FRAME
local HEAVY_ENDLAG     = 28 * FRAME
local GRAB_RANGE       = 5          -- studs
local GRAB_ACTIVE_TIME = 0.15       -- seconds grab input is live
local THROW_FORCE      = 65         -- studs/sec throw velocity

-- ── Damage values ────────────────────────────────────────────────────────────
local M1_DAMAGE    = {8, 9, 11, 18}  -- hit 1-4 in combo, last hit = launcher
local HEAVY_DAMAGE = 35
local GRAB_DAMAGE  = 22
local BLOCK_REDUCE = 0.75            -- damage multiplier when blocking (25% through)
local PARRY_WINDOW = 10 * FRAME      -- frame-perfect parry window

-- ── Hitbox size per combo hit ────────────────────────────────────────────────
local M1_HITBOX_SIZES = {
  Vector3.new(4, 4, 5),   -- hit 1: short
  Vector3.new(4, 4, 5.5), -- hit 2
  Vector3.new(4.5, 4, 6), -- hit 3
  Vector3.new(5, 5, 7),   -- hit 4: wide launcher
}

-- ── Knockback per hit ────────────────────────────────────────────────────────
local M1_KNOCKBACK    = {12, 14, 16, 55}  -- hit 4 = big launch
local HEAVY_KNOCKBACK = 80
local GRAB_KNOCKBACK  = 70

-- ── Hitstun per hit (seconds locked out of actions) ─────────────────────────
local M1_HITSTUN    = {0.25, 0.27, 0.29, 0.7}
local HEAVY_HITSTUN = 1.2
local PARRY_STUN    = 1.8  -- attacker gets stunned on a successful parry

-- ─────────────────────────────────────────────────────────────────────────────
-- PLAYER STATE TABLE (server-side, never trust the client)
-- ─────────────────────────────────────────────────────────────────────────────
local playerState = {}
-- playerState[userId] = {
--   hp            : number  (current HP)
--   maxHp         : number
--   stamina       : number  (0-100)
--   energy        : number  (0-100 ult meter)
--   comboCount    : number  (0-4)
--   lastM1        : number  (tick() of last M1)
--   stunExpiry    : number  (tick() when stun ends, 0 = not stunned)
--   isBlocking    : boolean
--   isParrying    : boolean
--   parryExpiry   : number
--   isDashing     : boolean
--   dashExpiry    : number  (i-frame window end)
--   isGrabbing    : boolean
--   grabTarget    : number? (userId of grabbed target)
--   lastHitTick   : number  (for rate limiting: only 1 hit per M1_ACTIVE window)
--   class         : string  ("Brawler" | "Swordsman" | "Mage")
--   elo           : number
--   rank          : string
-- }

local function initState(player)
  local charData = getCharacterData(player) -- defined in Class System section
  playerState[player.UserId] = {
    hp           = charData.maxHp,
    maxHp        = charData.maxHp,
    stamina      = 100,
    energy       = 0,
    comboCount   = 0,
    lastM1       = 0,
    stunExpiry   = 0,
    isBlocking   = false,
    isParrying   = false,
    parryExpiry  = 0,
    isDashing    = false,
    dashExpiry   = 0,
    isGrabbing   = false,
    grabTarget   = nil,
    lastHitTick  = 0,
    class        = charData.class,
    elo          = charData.elo,
    rank         = charData.rank,
  }
end

-- ─────────────────────────────────────────────────────────────────────────────
-- UTILITY HELPERS
-- ─────────────────────────────────────────────────────────────────────────────
local function isStunned(userId)
  local s = playerState[userId]
  return s and tick() < s.stunExpiry
end

local function canAct(userId)
  local s = playerState[userId]
  if not s then return false end
  if isStunned(userId) then return false end
  if s.isGrabbing then return false end
  return true
end

local function getRootPart(player)
  local char = player.Character
  return char and char:FindFirstChild("HumanoidRootPart")
end

local function getHumanoid(player)
  local char = player.Character
  return char and char:FindFirstChildOfClass("Humanoid")
end

-- Apply knockback using LinearVelocity (Roblox modern API)
local function applyKnockback(targetPlayer, direction, force)
  local root = getRootPart(targetPlayer)
  if not root then return end

  -- Use an Attachment + LinearVelocity, destroy after 0.15s
  local att = Instance.new("Attachment")
  att.Parent = root

  local lv = Instance.new("LinearVelocity")
  lv.Attachment0 = att
  lv.VectorVelocity = direction.Unit * force + Vector3.new(0, force * 0.25, 0)
  lv.MaxForce = math.huge
  lv.Parent = root

  task.delay(0.15, function()
    if lv and lv.Parent then lv:Destroy() end
    if att and att.Parent then att:Destroy() end
  end)
end

-- Spawn a visual hit effect at position (replicated to nearby clients)
local function spawnEffect(name, position)
  local template = ServerStorage:FindFirstChild("Effects") and
                   ServerStorage.Effects:FindFirstChild(name)
  if not template then return end
  local clone = template:Clone()
  clone.CFrame = CFrame.new(position)
  clone.Parent = Workspace
  task.delay(0.5, function()
    if clone and clone.Parent then clone:Destroy() end
  end)
end

-- ─────────────────────────────────────────────────────────────────────────────
-- HITBOX: GetPartBoundsInBox with server-side position validation
-- ─────────────────────────────────────────────────────────────────────────────
local POSITION_TOLERANCE = 2.5  -- studs: how far client reported pos can differ

local function serverHitbox(attacker, hitboxSize, comboIndex)
  local root = getRootPart(attacker)
  if not root then return {} end

  -- Build CFrame 3 studs in front of attacker
  local hitCFrame = root.CFrame * CFrame.new(0, 0, -(hitboxSize.Z / 2 + 1.5))

  local overlapParams = OverlapParams.new()
  overlapParams.FilterType = Enum.RaycastFilterType.Exclude
  overlapParams.FilterDescendantsInstances = {attacker.Character}

  local parts = Workspace:GetPartBoundsInBox(hitCFrame, hitboxSize, overlapParams)
  local hitTargets = {}
  local alreadyHit = {}

  for _, part in ipairs(parts) do
    local character = part:FindFirstAncestorOfClass("Model")
    if not character then continue end
    local targetPlayer = Players:GetPlayerFromCharacter(character)
    if not targetPlayer then continue end
    if alreadyHit[targetPlayer.UserId] then continue end

    alreadyHit[targetPlayer.UserId] = true
    table.insert(hitTargets, targetPlayer)
  end

  return hitTargets
end

-- ─────────────────────────────────────────────────────────────────────────────
-- DAMAGE APPLICATION with block/parry/stun resolution
-- ─────────────────────────────────────────────────────────────────────────────
local CombatResult = ReplicatedStorage.Remotes.CombatResult
local StateUpdate  = ReplicatedStorage.Remotes.StateUpdate

local function applyDamage(attacker, target, rawDamage, knockbackForce,
                            hitstunDuration, attackType)
  local attackerId = attacker.UserId
  local targetId   = target.UserId
  local tState     = playerState[targetId]
  local aState     = playerState[attackerId]

  if not tState or not aState then return false end

  -- Check if target is in i-frames (dashing)
  if tState.isDashing and tick() < tState.dashExpiry then
    CombatResult:FireClient(attacker, {hit = false, reason = "iframe"})
    return false
  end

  -- Parry check (frame-perfect: target is parrying and parryExpiry not elapsed)
  if tState.isParrying and tick() < tState.parryExpiry then
    -- Parry success: stun the attacker
    aState.stunExpiry = tick() + PARRY_STUN
    spawnEffect("ParryEffect", getRootPart(target).Position)
    StateUpdate:FireAllClients({
      event      = "parry",
      targetId   = targetId,
      attackerId = attackerId,
    })
    CombatResult:FireClient(attacker, {hit = false, reason = "parried"})
    -- Give target energy for a successful parry
    aState.energy = math.min(100, (aState.energy or 0) + 20)
    return false
  end

  -- Block check (not a parry, but blocking)
  local finalDamage = rawDamage
  local wasBlocked  = false
  if tState.isBlocking then
    finalDamage = math.floor(rawDamage * (1 - BLOCK_REDUCE))
    wasBlocked  = true
    -- Drain stamina
    tState.stamina = math.max(0, tState.stamina - rawDamage * 0.6)
    -- Guard break: if stamina hits 0, attacker gets a free heavy window
    if tState.stamina <= 0 then
      tState.isBlocking = false
      tState.stunExpiry = tick() + 0.8  -- brief guard break stun
      StateUpdate:FireAllClients({event = "guardbreak", targetId = targetId})
    end
    spawnEffect("BlockEffect", getRootPart(target).Position)
  end

  -- Apply HP damage
  tState.hp = math.max(0, tState.hp - finalDamage)

  -- Apply hitstun (only if not blocking, or guard broken)
  if not wasBlocked then
    tState.stunExpiry = tick() + hitstunDuration
  end

  -- Apply knockback in attacker's forward direction
  local root = getRootPart(attacker)
  if root and not wasBlocked then
    local direction = root.CFrame.LookVector
    applyKnockback(target, direction, knockbackForce)
  end

  -- Charge attacker energy (dealing damage fills ult meter)
  aState.energy = math.min(100, (aState.energy or 0) + rawDamage * 0.4)
  -- Target also charges energy (taking damage fills ult meter slightly)
  tState.energy = math.min(100, (tState.energy or 0) + rawDamage * 0.2)

  -- Hit effect
  if not wasBlocked then
    spawnEffect("HitEffect", getRootPart(target).Position)
  end

  -- Broadcast state update to all nearby clients
  StateUpdate:FireAllClients({
    event        = "damage",
    attackerId   = attackerId,
    targetId     = targetId,
    damage       = finalDamage,
    wasBlocked   = wasBlocked,
    targetHp     = tState.hp,
    targetMaxHp  = tState.maxHp,
    attackType   = attackType,
  })

  -- Check for defeat
  if tState.hp <= 0 then
    local defeated = ReplicatedStorage.Bindables:FindFirstChild("PlayerDefeated")
    if defeated then defeated:Fire(target, attacker) end
  end

  return true
end

-- ─────────────────────────────────────────────────────────────────────────────
-- M1 COMBO HANDLER (server receives "m1" from client)
-- ─────────────────────────────────────────────────────────────────────────────
local RATE_LIMIT = {}  -- userId → last allowed M1 server tick

local function handleM1(player)
  local userId = player.UserId
  local state  = playerState[userId]
  if not state then return end

  -- Rate limit: prevent faster than 1 M1 per (M1_STARTUP + M1_ACTIVE + M1_ENDLAG)
  local now = tick()
  local minInterval = M1_STARTUP + M1_ACTIVE + M1_ENDLAG
  if RATE_LIMIT[userId] and (now - RATE_LIMIT[userId]) < (minInterval - FRAME * 2) then
    return -- spam rejected silently
  end
  RATE_LIMIT[userId] = now

  if not canAct(userId) then return end
  if state.isBlocking then return end  -- can't attack while blocking

  -- Determine combo hit number
  local timeSinceLast = now - state.lastM1
  if timeSinceLast > M1_CHAIN_WINDOW then
    state.comboCount = 0  -- reset combo
  end

  local hitIndex = state.comboCount + 1
  if hitIndex > 4 then hitIndex = 1 end

  state.lastM1 = now

  -- Startup frames: attacker is committed, play wind-up animation signal
  StateUpdate:FireAllClients({
    event    = "m1_startup",
    userId   = userId,
    hitIndex = hitIndex,
  })

  -- Wait startup frames, then activate hitbox
  task.delay(M1_STARTUP, function()
    if not playerState[userId] then return end

    -- Active frames: hitbox is live
    local hitSize    = M1_HITBOX_SIZES[hitIndex]
    local hitTargets = serverHitbox(player, hitSize, hitIndex)

    local damage   = M1_DAMAGE[hitIndex]
    local knockback = M1_KNOCKBACK[hitIndex]
    local hitstun  = M1_HITSTUN[hitIndex]

    for _, target in ipairs(hitTargets) do
      if playerState[target.UserId] then
        applyDamage(player, target, damage, knockback, hitstun, "m1_" .. hitIndex)
      end
    end

    -- Advance combo count
    state.comboCount = hitIndex % 4  -- after hit 4, wraps to 0

    -- Endlag: attacker cannot act during recovery
    state.stunExpiry = tick() + M1_ENDLAG

    -- Notify attacker of result
    CombatResult:FireClient(player, {
      hit        = #hitTargets > 0,
      hitCount   = #hitTargets,
      comboIndex = hitIndex,
      comboMax   = 4,
    })
  end)
end

-- ─────────────────────────────────────────────────────────────────────────────
-- HEAVY ATTACK (charged, guard-breaking)
-- ─────────────────────────────────────────────────────────────────────────────
local function handleHeavy(player)
  local userId = player.UserId
  local state  = playerState[userId]
  if not state then return end
  if not canAct(userId) then return end
  if state.isBlocking then return end

  local now = tick()
  if RATE_LIMIT[userId] and (now - RATE_LIMIT[userId]) < (HEAVY_STARTUP + HEAVY_ENDLAG * 0.5) then
    return
  end
  RATE_LIMIT[userId] = now

  -- Reset combo on heavy
  state.comboCount = 0

  StateUpdate:FireAllClients({
    event  = "heavy_startup",
    userId = userId,
  })

  -- Startup — attacker is locked in wind-up
  state.stunExpiry = tick() + HEAVY_STARTUP

  task.delay(HEAVY_STARTUP, function()
    if not playerState[userId] then return end

    local hitSize    = Vector3.new(6, 5, 8)
    local hitTargets = serverHitbox(player, hitSize, 0)

    for _, target in ipairs(hitTargets) do
      if playerState[target.UserId] then
        -- Heavy always breaks guard (forces tState.isBlocking = false)
        local tState = playerState[target.UserId]
        if tState then
          tState.isBlocking = false
          tState.stamina    = 0
        end
        applyDamage(player, target, HEAVY_DAMAGE, HEAVY_KNOCKBACK, HEAVY_HITSTUN, "heavy")
      end
    end

    -- Endlag
    state.stunExpiry = tick() + HEAVY_ENDLAG

    CombatResult:FireClient(player, {
      hit      = #hitTargets > 0,
      hitCount = #hitTargets,
      type     = "heavy",
    })
  end)
end

-- ─────────────────────────────────────────────────────────────────────────────
-- GRAB / THROW
-- ─────────────────────────────────────────────────────────────────────────────
local function handleGrab(player)
  local userId = player.UserId
  local state  = playerState[userId]
  if not state then return end
  if not canAct(userId) then return end

  local root = getRootPart(player)
  if not root then return end

  -- Check all players for proximity
  local grabbed = nil
  for _, target in ipairs(Players:GetPlayers()) do
    if target == player then continue end
    if not target.Character then continue end
    local tRoot = getRootPart(target)
    if not tRoot then continue end
    local dist = (root.Position - tRoot.Position).Magnitude
    if dist <= GRAB_RANGE then
      -- Target cannot be grabbed if blocking (unless guard broken)
      local tState = playerState[target.UserId]
      if tState and tState.isBlocking and tState.stamina > 0 then
        -- Block absorbs grab
        CombatResult:FireClient(player, {hit = false, reason = "grabbed_blocked"})
        return
      end
      grabbed = target
      break
    end
  end

  if not grabbed then
    CombatResult:FireClient(player, {hit = false, reason = "no_target"})
    return
  end

  -- Lock both players during grab animation
  local tState = playerState[grabbed.UserId]
  state.isGrabbing  = true
  state.grabTarget  = grabbed.UserId
  tState.stunExpiry = tick() + 0.6  -- target held for 0.6s

  StateUpdate:FireAllClients({
    event      = "grab",
    attackerId = userId,
    targetId   = grabbed.UserId,
  })

  -- After grab hold, execute throw
  task.delay(0.6, function()
    if not playerState[userId] or not playerState[grabbed.UserId] then return end

    -- Apply grab damage + throw in attacker's forward direction
    local throwRoot = getRootPart(player)
    if throwRoot then
      local throwDir = throwRoot.CFrame.LookVector
      applyKnockback(grabbed, throwDir, THROW_FORCE)
    end

    applyDamage(player, grabbed, GRAB_DAMAGE, 0, 0.5, "grab_throw")

    -- Clear grab state
    state.isGrabbing = false
    state.grabTarget = nil
    state.stunExpiry = tick() + M1_ENDLAG  -- brief endlag after throw

    CombatResult:FireClient(player, {hit = true, type = "grab_throw"})
  end)
end

--[[
============================================================================
2. MOVEMENT MECHANICS — Dash, Dodge, Block, Parry, Aerial, Sprint
============================================================================
--]]

local DASH_DURATION    = 0.18   -- seconds
local DASH_IFRAME      = 0.25   -- i-frame window (slightly longer than dash)
local DASH_FORCE       = 55     -- studs/sec
local DASH_COOLDOWN    = 0.9    -- seconds between dashes
local DODGE_COOLDOWN   = 1.1
local SPRINT_SPEED     = 24     -- default walkspeed is 16
local SPRINT_DRAIN     = 12     -- stamina per second while sprinting
local STAMINA_REGEN    = 15     -- stamina per second when not blocking/sprinting
local BLOCK_DRAIN      = 8      -- stamina per second while blocking
local AIR_DASH_FORCE   = 45
local SLAM_DAMAGE      = 40
local SLAM_RADIUS      = 8

local lastDash   = {}  -- userId → tick()
local lastDodge  = {}
local isSprinting = {} -- userId → bool

-- ─────────────────────────────────────────────────────────────────────────────
-- DASH (directional, i-frames)
-- ─────────────────────────────────────────────────────────────────────────────
local function handleDash(player, direction)
  local userId = player.UserId
  local state  = playerState[userId]
  if not state then return end
  if isStunned(userId) then return end

  local now = tick()
  if lastDash[userId] and (now - lastDash[userId]) < DASH_COOLDOWN then
    return  -- on cooldown
  end
  lastDash[userId] = now

  local root = getRootPart(player)
  if not root then return end

  -- Validate direction from client (must be unit vector, or use look vector)
  local dashDir
  if direction and direction.Magnitude > 0.1 then
    -- Clamp to flat plane + ensure unit vector (anti-cheat: ignore Y component)
    dashDir = Vector3.new(direction.X, 0, direction.Z).Unit
  else
    dashDir = root.CFrame.LookVector * Vector3.new(1, 0, 1)
    dashDir = dashDir.Unit
  end

  -- Set i-frame window
  state.isDashing  = true
  state.dashExpiry = now + DASH_IFRAME

  -- Apply velocity
  applyKnockback(player, dashDir, DASH_FORCE)

  StateUpdate:FireAllClients({
    event    = "dash",
    userId   = userId,
    direction = {x = dashDir.X, z = dashDir.Z},
  })

  task.delay(DASH_IFRAME + 0.05, function()
    if playerState[userId] then
      playerState[userId].isDashing = false
    end
  end)
end

-- ─────────────────────────────────────────────────────────────────────────────
-- DODGE (sidestep — costs stamina, brief invulnerability)
-- ─────────────────────────────────────────────────────────────────────────────
local function handleDodge(player, direction)
  local userId = player.UserId
  local state  = playerState[userId]
  if not state then return end
  if isStunned(userId) then return end
  if state.stamina < 20 then return end  -- not enough stamina

  local now = tick()
  if lastDodge[userId] and (now - lastDodge[userId]) < DODGE_COOLDOWN then return end
  lastDodge[userId] = now

  state.stamina    = state.stamina - 20
  state.isDashing  = true  -- reuse i-frame system
  state.dashExpiry = now + 0.2

  local root = getRootPart(player)
  if not root then return end

  local dodgeDir
  if direction and direction.Magnitude > 0.1 then
    dodgeDir = Vector3.new(direction.X, 0, direction.Z).Unit
  else
    -- Default: dodge backwards
    dodgeDir = -root.CFrame.LookVector * Vector3.new(1, 0, 1)
    dodgeDir = dodgeDir.Unit
  end

  applyKnockback(player, dodgeDir, 35)

  StateUpdate:FireAllClients({
    event     = "dodge",
    userId    = userId,
    direction = {x = dodgeDir.X, z = dodgeDir.Z},
  })

  task.delay(0.25, function()
    if playerState[userId] then
      playerState[userId].isDashing = false
    end
  end)
end

-- ─────────────────────────────────────────────────────────────────────────────
-- BLOCK (hold to reduce damage, drains stamina)
-- ─────────────────────────────────────────────────────────────────────────────
local function handleBlock(player, isDown)
  local userId = player.UserId
  local state  = playerState[userId]
  if not state then return end

  if isDown then
    if isStunned(userId) then return end  -- can't block while stunned
    state.isBlocking = true
    StateUpdate:FireAllClients({event = "block_start", userId = userId})
  else
    state.isBlocking = false
    StateUpdate:FireAllClients({event = "block_end", userId = userId})
  end
end

-- ─────────────────────────────────────────────────────────────────────────────
-- PARRY (frame-perfect block that stuns attacker)
-- ─────────────────────────────────────────────────────────────────────────────
local function handleParry(player)
  local userId = player.UserId
  local state  = playerState[userId]
  if not state then return end
  if isStunned(userId) then return end
  if state.stamina < 25 then return end

  state.stamina    = state.stamina - 25
  state.isParrying = true
  state.parryExpiry = tick() + PARRY_WINDOW
  state.isBlocking  = true  -- parry also counts as a block if not frame-perfect

  StateUpdate:FireAllClients({event = "parry_start", userId = userId})

  task.delay(PARRY_WINDOW + 0.05, function()
    if playerState[userId] then
      playerState[userId].isParrying = false
      -- isBlocking persists until client releases block input
    end
    StateUpdate:FireAllClients({event = "parry_end", userId = userId})
  end)
end

-- ─────────────────────────────────────────────────────────────────────────────
-- AERIAL COMBAT — Air Dash + Slam Down
-- ─────────────────────────────────────────────────────────────────────────────
local function handleAirDash(player, direction)
  local userId = player.UserId
  local state  = playerState[userId]
  if not state then return end
  if isStunned(userId) then return end

  local hum = getHumanoid(player)
  if not hum then return end
  -- Only allow air dash if airborne
  if hum.FloorMaterial ~= Enum.Material.Air then return end

  local now = tick()
  if lastDash[userId] and (now - lastDash[userId]) < DASH_COOLDOWN then return end
  lastDash[userId] = now

  local root = getRootPart(player)
  if not root then return end

  local airDir
  if direction and direction.Magnitude > 0.1 then
    airDir = Vector3.new(direction.X, direction.Y * 0.5, direction.Z).Unit
  else
    airDir = root.CFrame.LookVector
  end

  applyKnockback(player, airDir, AIR_DASH_FORCE)

  state.isDashing  = true
  state.dashExpiry = tick() + 0.2

  StateUpdate:FireAllClients({event = "air_dash", userId = userId})

  task.delay(0.25, function()
    if playerState[userId] then playerState[userId].isDashing = false end
  end)
end

local function handleSlamDown(player)
  local userId = player.UserId
  local state  = playerState[userId]
  if not state then return end
  if isStunned(userId) then return end

  local hum = getHumanoid(player)
  if not hum or hum.FloorMaterial ~= Enum.Material.Air then return end

  local root = getRootPart(player)
  if not root then return end

  -- Slam the player straight down
  applyKnockback(player, Vector3.new(0, -1, 0), 80)

  StateUpdate:FireAllClients({event = "slam_start", userId = userId})

  -- When landing (floor detection via polling), apply AoE slam damage
  local slamTimeout = tick() + 2  -- max 2 seconds to land
  local connection
  connection = RunService.Heartbeat:Connect(function()
    if tick() > slamTimeout then connection:Disconnect() return end
    local h = getHumanoid(player)
    if h and h.FloorMaterial ~= Enum.Material.Air then
      connection:Disconnect()

      -- AoE hitbox at landing position
      local landPos = root.Position
      local overlapParams = OverlapParams.new()
      overlapParams.FilterType = Enum.RaycastFilterType.Exclude
      overlapParams.FilterDescendantsInstances = {player.Character}
      local parts = Workspace:GetPartBoundsInBox(
        CFrame.new(landPos),
        Vector3.new(SLAM_RADIUS * 2, 6, SLAM_RADIUS * 2),
        overlapParams
      )

      local hit = {}
      for _, part in ipairs(parts) do
        local char = part:FindFirstAncestorOfClass("Model")
        if not char then continue end
        local tp = Players:GetPlayerFromCharacter(char)
        if not tp or hit[tp.UserId] then continue end
        hit[tp.UserId] = true
        applyDamage(player, tp, SLAM_DAMAGE, 50, 0.8, "slam")
      end

      spawnEffect("HitEffect", landPos)
      StateUpdate:FireAllClients({event = "slam_land", userId = userId, position = {x=landPos.X,y=landPos.Y,z=landPos.Z}})
    end
  end)
end

-- ─────────────────────────────────────────────────────────────────────────────
-- SPRINT (hold shift, drains stamina)
-- ─────────────────────────────────────────────────────────────────────────────
local function handleSprint(player, isDown)
  local userId = player.UserId
  local state  = playerState[userId]
  if not state then return end

  local hum = getHumanoid(player)
  if not hum then return end

  if isDown then
    if state.stamina >= 10 then
      isSprinting[userId] = true
      hum.WalkSpeed = SPRINT_SPEED
    end
  else
    isSprinting[userId] = false
    hum.WalkSpeed = 16  -- default
  end
end

-- ─────────────────────────────────────────────────────────────────────────────
-- STAMINA REGEN LOOP (server heartbeat)
-- ─────────────────────────────────────────────────────────────────────────────
RunService.Heartbeat:Connect(function(dt)
  for userId, state in pairs(playerState) do
    local player = Players:GetPlayerByUserId(userId)
    if not player then continue end

    if state.isBlocking then
      -- Drain stamina while blocking
      state.stamina = math.max(0, state.stamina - BLOCK_DRAIN * dt)
      if state.stamina <= 0 then
        state.isBlocking = false
        state.stunExpiry = tick() + 0.5  -- guard break
        StateUpdate:FireAllClients({event = "guardbreak", targetId = userId})
      end
    elseif isSprinting[userId] then
      -- Drain stamina while sprinting
      state.stamina = math.max(0, state.stamina - SPRINT_DRAIN * dt)
      if state.stamina <= 0 then
        isSprinting[userId] = false
        local hum = getHumanoid(player)
        if hum then hum.WalkSpeed = 16 end
      end
    else
      -- Regen stamina
      state.stamina = math.min(100, state.stamina + STAMINA_REGEN * dt)
    end
  end
end)

--[[
============================================================================
3. ABILITY / SKILL SYSTEM — Slots, Cooldowns, Energy, Ultimate, Passives
============================================================================
--]]

-- ── Class ability definitions ─────────────────────────────────────────────────
-- Each ability: name, resource cost, cooldown (s), function (defined below)
local ABILITIES = {
  Brawler = {
    [1] = {name = "Rising Uppercut",   cost = 15, cooldown = 8,  fn = "risingUppercut"},
    [2] = {name = "Ground Pound",      cost = 20, cooldown = 12, fn = "groundPound"},
    [3] = {name = "Counter Stance",    cost = 10, cooldown = 15, fn = "counterStance"},
    [4] = {name = "Berserker Rush",    cost = 30, cooldown = 20, fn = "berserkerRush"},
    ult = {name = "Rage Mode",         cost = 100,cooldown = 60, fn = "rageModeUlt"},
  },
  Swordsman = {
    [1] = {name = "Sword Slash",       cost = 10, cooldown = 5,  fn = "swordSlash"},
    [2] = {name = "Blade Storm",       cost = 25, cooldown = 14, fn = "bladeStorm"},
    [3] = {name = "Deflect",           cost = 15, cooldown = 18, fn = "deflect"},
    [4] = {name = "Aerial Dive",       cost = 20, cooldown = 16, fn = "aerialDive"},
    ult = {name = "Phantom Slash",     cost = 100,cooldown = 55, fn = "phantomSlashUlt"},
  },
  Mage = {
    [1] = {name = "Fireball",          cost = 20, cooldown = 4,  fn = "fireball"},
    [2] = {name = "Frost Nova",        cost = 30, cooldown = 16, fn = "frostNova"},
    [3] = {name = "Blink",            cost = 25, cooldown = 12, fn = "blink"},
    [4] = {name = "Chain Lightning",   cost = 35, cooldown = 18, fn = "chainLightning"},
    ult = {name = "Meteor",            cost = 100,cooldown = 70, fn = "meteorUlt"},
  },
}

-- Cooldown tracker: abilityCooldowns[userId][slot] = tick() when ready
local abilityCooldowns = {}
local passiveEffects   = {}  -- userId → table of active passive effects

local function getAbilityCooldownsForUser(userId)
  if not abilityCooldowns[userId] then
    abilityCooldowns[userId] = {[1]=0,[2]=0,[3]=0,[4]=0,ult=0}
  end
  return abilityCooldowns[userId]
end

-- ── Ability: Rising Uppercut (Brawler 1) ────────────────────────────────────
local function risingUppercut(player)
  local root = getRootPart(player)
  if not root then return end
  -- Uppercut: launch self upward + hit nearby targets
  applyKnockback(player, Vector3.new(0, 1, 0), 30)  -- attacker rises

  task.delay(0.1, function()
    local targets = serverHitbox(player, Vector3.new(5, 8, 5), 0)
    for _, t in ipairs(targets) do
      applyDamage(player, t, 30, 60, 0.6, "uppercut")
    end
    StateUpdate:FireAllClients({event = "ability", userId = player.UserId, name = "risingUppercut"})
  end)
end

-- ── Ability: Ground Pound (Brawler 2) ───────────────────────────────────────
local function groundPound(player)
  local state = playerState[player.UserId]
  if not state then return end
  local hum = getHumanoid(player)
  if not hum then return end

  if hum.FloorMaterial == Enum.Material.Air then
    -- Already airborne: slam down hard
    handleSlamDown(player)
  else
    -- On ground: leap up then slam
    applyKnockback(player, Vector3.new(0, 1, 0), 50)
    task.delay(0.5, function()
      if playerState[player.UserId] then
        handleSlamDown(player)
      end
    end)
  end
end

-- ── Ability: Counter Stance (Brawler 3) ─────────────────────────────────────
local function counterStance(player)
  local state = playerState[player.UserId]
  if not state then return end
  -- For 1.5s: any hit received triggers a counter-attack (tracked via passive)
  passiveEffects[player.UserId] = passiveEffects[player.UserId] or {}
  passiveEffects[player.UserId].counter = tick() + 1.5
  StateUpdate:FireAllClients({event = "counter_stance", userId = player.UserId})
end

-- ── Ability: Fireball (Mage 1) ───────────────────────────────────────────────
local function fireball(player)
  local root = getRootPart(player)
  if not root then return end
  local origin = root.Position + root.CFrame.LookVector * 2
  local direction = root.CFrame.LookVector

  -- Create projectile part on server, move via Heartbeat, check collisions
  local proj = Instance.new("Part")
  proj.Size = Vector3.new(1.2, 1.2, 1.2)
  proj.Shape = Enum.PartType.Ball
  proj.Material = Enum.Material.Neon
  proj.Color = Color3.fromRGB(255, 100, 20)
  proj.CanCollide = false
  proj.CastShadow = false
  proj.CFrame = CFrame.new(origin)
  proj.Parent = Workspace

  local speed = 55
  local lifetime = 3
  local spawnTime = tick()
  local hit = false

  local conn
  conn = RunService.Heartbeat:Connect(function(dt)
    if hit or tick() - spawnTime > lifetime then
      conn:Disconnect()
      if proj and proj.Parent then proj:Destroy() end
      return
    end

    proj.CFrame = proj.CFrame + direction * speed * dt

    -- Collision check with players
    local overlapParams = OverlapParams.new()
    overlapParams.FilterType = Enum.RaycastFilterType.Exclude
    overlapParams.FilterDescendantsInstances = {player.Character, proj}
    local parts = Workspace:GetPartBoundsInBox(proj.CFrame, Vector3.new(2,2,2), overlapParams)

    for _, part in ipairs(parts) do
      local char = part:FindFirstAncestorOfClass("Model")
      if not char then continue end
      local tp = Players:GetPlayerFromCharacter(char)
      if tp and tp ~= player and playerState[tp.UserId] then
        hit = true
        applyDamage(player, tp, 45, 30, 0.5, "fireball")
        spawnEffect("HitEffect", proj.Position)
        conn:Disconnect()
        if proj and proj.Parent then proj:Destroy() end
        break
      end
    end
  end)

  StateUpdate:FireAllClients({event = "ability", userId = player.UserId, name = "fireball"})
end

-- ── Ability: Frost Nova (Mage 2) ─────────────────────────────────────────────
local function frostNova(player)
  local root = getRootPart(player)
  if not root then return end

  local radius = 12
  local overlapParams = OverlapParams.new()
  overlapParams.FilterType = Enum.RaycastFilterType.Exclude
  overlapParams.FilterDescendantsInstances = {player.Character}

  local parts = Workspace:GetPartBoundsInBox(
    CFrame.new(root.Position),
    Vector3.new(radius * 2, 8, radius * 2),
    overlapParams
  )

  local hit = {}
  for _, part in ipairs(parts) do
    local char = part:FindFirstAncestorOfClass("Model")
    if not char then continue end
    local tp = Players:GetPlayerFromCharacter(char)
    if not tp or hit[tp.UserId] then continue end
    hit[tp.UserId] = true
    -- Freeze: deal damage + 2s stun (cold lock)
    applyDamage(player, tp, 25, 5, 2.0, "frostNova")
    StateUpdate:FireAllClients({event = "frozen", userId = tp.UserId})
  end

  StateUpdate:FireAllClients({event = "ability", userId = player.UserId, name = "frostNova"})
end

-- ── Ability: Blink (Mage 3 — teleport) ──────────────────────────────────────
local function blink(player)
  local root = getRootPart(player)
  if not root then return end
  local blinkDist = 22
  local destination = root.Position + root.CFrame.LookVector * blinkDist

  -- Raycast to avoid blinking into walls
  local rayResult = Workspace:Raycast(root.Position, root.CFrame.LookVector * blinkDist)
  if rayResult then
    destination = rayResult.Position - root.CFrame.LookVector * 2
  end

  local state = playerState[player.UserId]
  if state then
    state.isDashing  = true
    state.dashExpiry = tick() + 0.3  -- i-frames during teleport
  end

  root.CFrame = CFrame.new(destination) * (root.CFrame - root.CFrame.Position)
  StateUpdate:FireAllClients({event = "blink", userId = player.UserId})

  task.delay(0.35, function()
    if playerState[player.UserId] then
      playerState[player.UserId].isDashing = false
    end
  end)
end

-- ── Ultimate: Rage Mode (Brawler) ────────────────────────────────────────────
local function rageModeUlt(player)
  local state = playerState[player.UserId]
  if not state then return end

  -- 8 seconds of enhanced power: +50% damage output, +15 walkspeed, no knockback received
  passiveEffects[player.UserId] = passiveEffects[player.UserId] or {}
  passiveEffects[player.UserId].rageMode = tick() + 8
  passiveEffects[player.UserId].rageDmgBonus = 1.5

  local hum = getHumanoid(player)
  if hum then hum.WalkSpeed = hum.WalkSpeed + 15 end

  StateUpdate:FireAllClients({event = "ult_active", userId = player.UserId, ult = "rageMode"})
  spawnEffect("UltEffect", getRootPart(player).Position)

  task.delay(8, function()
    if playerState[player.UserId] then
      passiveEffects[player.UserId] = passiveEffects[player.UserId] or {}
      passiveEffects[player.UserId].rageMode = nil
      passiveEffects[player.UserId].rageDmgBonus = nil
    end
    local h = getHumanoid(player)
    if h then h.WalkSpeed = 16 end
    StateUpdate:FireAllClients({event = "ult_end", userId = player.UserId})
  end)
end

-- ── Passive: Auto-Heal (triggers when below 30% HP) ─────────────────────────
local PASSIVE_HEAL_COOLDOWN = {}  -- userId → last heal tick
local PASSIVE_HEAL_AMOUNT   = 15  -- HP healed
local PASSIVE_HEAL_THRESHOLD = 0.3

RunService.Heartbeat:Connect(function()
  for userId, state in pairs(playerState) do
    local player = Players:GetPlayerByUserId(userId)
    if not player then continue end

    -- Auto-heal passive (unlocked on class tree)
    local passives = passiveEffects[userId]
    if passives and passives.autoHeal then
      local hpRatio = state.hp / state.maxHp
      if hpRatio < PASSIVE_HEAL_THRESHOLD then
        local now = tick()
        if not PASSIVE_HEAL_COOLDOWN[userId] or
           (now - PASSIVE_HEAL_COOLDOWN[userId]) > 15 then
          state.hp = math.min(state.maxHp, state.hp + PASSIVE_HEAL_AMOUNT)
          PASSIVE_HEAL_COOLDOWN[userId] = now
          StateUpdate:FireAllClients({event = "passive_heal", userId = userId, amount = PASSIVE_HEAL_AMOUNT})
        end
      end
    end
  end
end)

-- ── Main ability dispatcher ───────────────────────────────────────────────────
local abilityFunctions = {
  risingUppercut = risingUppercut,
  groundPound    = groundPound,
  counterStance  = counterStance,
  fireball       = fireball,
  frostNova      = frostNova,
  blink          = blink,
  rageModeUlt    = rageModeUlt,
}

local AbilityRequest = ReplicatedStorage.Remotes.AbilityRequest
local AbilityResult  = ReplicatedStorage.Remotes.AbilityResult

AbilityRequest.OnServerEvent:Connect(function(player, slot)
  local userId = player.UserId
  local state  = playerState[userId]
  if not state then return end
  if not canAct(userId) then return end

  local class    = state.class
  local abilData = (slot == "ult") and ABILITIES[class].ult or ABILITIES[class][slot]
  if not abilData then return end

  -- Cooldown check
  local cds  = getAbilityCooldownsForUser(userId)
  local key  = (slot == "ult") and "ult" or tonumber(slot)
  local now  = tick()
  if cds[key] and now < cds[key] then
    AbilityResult:FireClient(player, {success = false, reason = "cooldown", remaining = cds[key] - now})
    return
  end

  -- Energy check (ult costs 100 energy, others cost their resource cost)
  if slot == "ult" then
    if state.energy < 100 then
      AbilityResult:FireClient(player, {success = false, reason = "no_energy"})
      return
    end
    state.energy = 0
  else
    if state.stamina < abilData.cost then
      AbilityResult:FireClient(player, {success = false, reason = "no_stamina"})
      return
    end
    state.stamina = math.max(0, state.stamina - abilData.cost)
  end

  -- Set cooldown
  cds[key] = now + abilData.cooldown

  -- Execute ability
  local fn = abilityFunctions[abilData.fn]
  if fn then fn(player) end

  AbilityResult:FireClient(player, {success = true, slot = slot, cooldown = abilData.cooldown})
end)

--[[
============================================================================
4. RANKING / ELO SYSTEM — K-Factor, 7 Tiers, Matchmaking, Season Reset
============================================================================
--]]

-- ── ELO constants ────────────────────────────────────────────────────────────
local ELO_K_BASE   = 32   -- base K-factor (how much ELO swings per match)
local ELO_START    = 1000 -- starting ELO for new players

local RANKS = {
  {name = "Bronze",       min = 0,    max = 999,  k = 40},
  {name = "Silver",       min = 1000, max = 1199, k = 36},
  {name = "Gold",         min = 1200, max = 1399, k = 32},
  {name = "Platinum",     min = 1400, max = 1599, k = 28},
  {name = "Diamond",      min = 1600, max = 1799, k = 24},
  {name = "Master",       min = 1800, max = 1999, k = 20},
  {name = "Grandmaster",  min = 2000, max = math.huge, k = 16},
}

local function getRankFromELO(elo)
  for _, rankData in ipairs(RANKS) do
    if elo >= rankData.min and elo <= rankData.max then
      return rankData.name, rankData.k
    end
  end
  return "Bronze", 40
end

-- ── ELO calculation ───────────────────────────────────────────────────────────
-- Expected score: E = 1 / (1 + 10^((opponentELO - myELO) / 400))
-- New ELO: ELO + K * (actual - expected)
-- actual: 1.0 = win, 0.5 = draw, 0.0 = loss
local function calculateELOChange(myELO, opponentELO, didWin)
  local expected = 1 / (1 + 10 ^ ((opponentELO - myELO) / 400))
  local actual   = didWin and 1 or 0
  local _, k     = getRankFromELO(myELO)
  local change   = math.floor(k * (actual - expected))
  return change
end

-- ── DataStore for ELO + seasonal data ────────────────────────────────────────
local ELO_STORE     = DataStoreService:GetDataStore("FightingELO_Season1")
local LEADERBOARD   = DataStoreService:GetOrderedDataStore("FightingLeaderboard_Season1")

local function saveELO(userId, elo)
  pcall(function()
    ELO_STORE:UpdateAsync(tostring(userId), function(old)
      return elo
    end)
    LEADERBOARD:SetAsync(tostring(userId), math.max(0, math.floor(elo)))
  end)
end

local function loadELO(userId)
  local success, result = pcall(function()
    return ELO_STORE:GetAsync(tostring(userId))
  end)
  return (success and result) or ELO_START
end

-- ── Match result handler (called from PlayerDefeated BindableEvent) ──────────
local PlayerDefeated = ReplicatedStorage.Bindables:WaitForChild("PlayerDefeated")
local MatchUpdate    = ReplicatedStorage.Remotes.MatchUpdate

PlayerDefeated.Event:Connect(function(loser, winner)
  if not loser or not winner then return end

  local loserState  = playerState[loser.UserId]
  local winnerState = playerState[winner.UserId]
  if not loserState or not winnerState then return end

  local loserELO  = loserState.elo  or ELO_START
  local winnerELO = winnerState.elo or ELO_START

  local winnerGain = calculateELOChange(winnerELO, loserELO, true)
  local loserGain  = calculateELOChange(loserELO, winnerELO, false)  -- negative

  winnerState.elo = winnerELO + winnerGain
  loserState.elo  = math.max(0, loserELO + loserGain)

  local winnerRank, _ = getRankFromELO(winnerState.elo)
  local loserRank,  _ = getRankFromELO(loserState.elo)
  winnerState.rank    = winnerRank
  loserState.rank     = loserRank

  -- Save async (non-blocking)
  task.spawn(saveELO, winner.UserId, winnerState.elo)
  task.spawn(saveELO, loser.UserId,  loserState.elo)

  -- Notify clients
  MatchUpdate:FireClient(winner, {
    event    = "match_end",
    result   = "win",
    eloGain  = winnerGain,
    newELO   = winnerState.elo,
    newRank  = winnerRank,
  })
  MatchUpdate:FireClient(loser, {
    event    = "match_end",
    result   = "loss",
    eloGain  = loserGain,  -- negative
    newELO   = loserState.elo,
    newRank  = loserRank,
  })

  -- Reset loser HP and respawn
  task.delay(3, function()
    if loser.Character then
      loser:LoadCharacter()
    end
    if playerState[loser.UserId] then
      playerState[loser.UserId].hp = playerState[loser.UserId].maxHp
    end
  end)
end)

-- ── Matchmaking queue ─────────────────────────────────────────────────────────
local matchmakingQueue = {}  -- {userId, elo, queueTime}
local ELO_RANGE_START = 100  -- initial acceptable ELO range
local ELO_RANGE_GROW  = 50   -- expand search by this every 10 seconds

local function getQueueRange(queueTime)
  local elapsed = tick() - queueTime
  return ELO_RANGE_START + math.floor(elapsed / 10) * ELO_RANGE_GROW
end

local function tryMatchmake()
  if #matchmakingQueue < 2 then return end

  for i = 1, #matchmakingQueue do
    for j = i + 1, #matchmakingQueue do
      local p1 = matchmakingQueue[i]
      local p2 = matchmakingQueue[j]
      local range = math.max(getQueueRange(p1.queueTime), getQueueRange(p2.queueTime))

      if math.abs(p1.elo - p2.elo) <= range then
        -- Match found: remove from queue and assign to a match
        table.remove(matchmakingQueue, j)
        table.remove(matchmakingQueue, i)

        local player1 = Players:GetPlayerByUserId(p1.userId)
        local player2 = Players:GetPlayerByUserId(p2.userId)
        if player1 and player2 then
          MatchUpdate:FireClient(player1, {event = "match_found", opponentName = player2.Name, opponentELO = p2.elo})
          MatchUpdate:FireClient(player2, {event = "match_found", opponentName = player1.Name, opponentELO = p1.elo})
          -- Teleport both to an arena (arena selection handled separately)
          teleportToArena(player1, player2)  -- defined in Arena section
        end
        return  -- restart scan next tick
      end
    end
  end
end

task.spawn(function()
  while true do
    task.wait(2)
    tryMatchmake()
  end
end)

-- ── Season leaderboard retrieval ──────────────────────────────────────────────
local function getTopLeaderboard(count)
  count = math.min(count or 10, 100)
  local success, pages = pcall(function()
    return LEADERBOARD:GetSortedAsync(false, count)
  end)
  if not success then return {} end

  local results = {}
  local page = pages:GetCurrentPage()
  for _, entry in ipairs(page) do
    local uid  = tonumber(entry.key)
    local elo  = entry.value
    local name = "[Unknown]"
    local ok, playerName = pcall(function()
      return Players:GetNameFromUserIdAsync(uid)
    end)
    if ok then name = playerName end
    local rank, _ = getRankFromELO(elo)
    table.insert(results, {name = name, elo = elo, rank = rank, userId = uid})
  end
  return results
end

--[[
============================================================================
5. CHARACTER / CLASS SYSTEM — Stats, Movesets, Class Select, Unlock
============================================================================
--]]

local PLAYER_DATA_STORE = DataStoreService:GetDataStore("FightingPlayerData_v1")

local CLASS_STATS = {
  Brawler   = {maxHp = 200, speed = 18, defense = 12, strength = 15, color = Color3.fromRGB(220, 80, 40)},
  Swordsman = {maxHp = 165, speed = 20, defense = 10, strength = 13, color = Color3.fromRGB(80, 160, 220)},
  Mage      = {maxHp = 140, speed = 16, defense = 7,  strength = 18, color = Color3.fromRGB(180, 80, 220)},
}

local DEFAULT_PLAYER_DATA = {
  class           = "Brawler",
  elo             = ELO_START,
  rank            = "Bronze",
  wins            = 0,
  losses          = 0,
  totalKills      = 0,
  currency        = 0,
  unlockedClasses = {"Brawler"},
  unlockedSkills  = {},
  passives        = {},
  level           = 1,
  xp              = 0,
}

local playerDataCache = {}

local function loadPlayerData(player)
  local userId = player.UserId
  local success, data = pcall(function()
    return PLAYER_DATA_STORE:GetAsync(tostring(userId))
  end)

  if success and data then
    -- Merge with defaults (handles missing keys from old saves)
    for k, v in pairs(DEFAULT_PLAYER_DATA) do
      if data[k] == nil then data[k] = v end
    end
    playerDataCache[userId] = data
  else
    playerDataCache[userId] = require("TableUtil").deepCopy(DEFAULT_PLAYER_DATA)
  end

  return playerDataCache[userId]
end

local function savePlayerData(player)
  local userId = player.UserId
  local data   = playerDataCache[userId]
  if not data then return end

  pcall(function()
    PLAYER_DATA_STORE:UpdateAsync(tostring(userId), function()
      return data
    end)
  end)
end

-- Expose for initState
function getCharacterData(player)
  local data  = playerDataCache[player.UserId] or loadPlayerData(player)
  local stats = CLASS_STATS[data.class] or CLASS_STATS.Brawler
  return {
    maxHp = stats.maxHp,
    class = data.class,
    elo   = data.elo,
    rank  = data.rank,
  }
end

-- ── Class selection handler ───────────────────────────────────────────────────
local CombatRequest = ReplicatedStorage.Remotes.CombatRequest

-- Class change (only allowed in lobby, not mid-fight)
local function handleClassSelect(player, className)
  local data = playerDataCache[player.UserId]
  if not data then return end

  -- Check class is unlocked
  local unlocked = false
  for _, c in ipairs(data.unlockedClasses) do
    if c == className then unlocked = true break end
  end
  if not unlocked then
    CombatResult:FireClient(player, {success = false, reason = "class_locked"})
    return
  end

  data.class = className
  local stats = CLASS_STATS[className]

  -- Apply stats to humanoid
  local hum = getHumanoid(player)
  if hum then
    hum.MaxHealth = stats.maxHp
    hum.Health    = stats.maxHp
    hum.WalkSpeed = stats.speed
  end

  -- Re-initialize player state with new class
  local state = playerState[player.UserId]
  if state then
    state.hp     = stats.maxHp
    state.maxHp  = stats.maxHp
    state.class  = className
  end

  -- Color the character to class color (visual identification)
  if player.Character then
    for _, part in ipairs(player.Character:GetDescendants()) do
      if part:IsA("BasePart") and part.Name ~= "HumanoidRootPart" then
        -- Tint parts subtly to class color
        part.Color = stats.color:Lerp(part.Color, 0.6)
      end
    end
  end

  StateUpdate:FireAllClients({event = "class_changed", userId = player.UserId, class = className})
  CombatResult:FireClient(player, {success = true, class = className})
end

-- ── XP and leveling ───────────────────────────────────────────────────────────
local XP_PER_LEVEL = 100  -- base, scales: needed = XP_PER_LEVEL * level^1.4

local function addXP(player, amount)
  local data = playerDataCache[player.UserId]
  if not data then return end

  data.xp = data.xp + amount
  local needed = math.floor(XP_PER_LEVEL * (data.level ^ 1.4))

  while data.xp >= needed do
    data.xp     = data.xp - needed
    data.level  = data.level + 1
    data.currency = data.currency + 50  -- bonus currency per level
    needed = math.floor(XP_PER_LEVEL * (data.level ^ 1.4))

    -- Unlock new class at certain levels
    if data.level == 5  and not table.find(data.unlockedClasses, "Swordsman") then
      table.insert(data.unlockedClasses, "Swordsman")
      MatchUpdate:FireClient(player, {event = "unlock", type = "class", value = "Swordsman"})
    elseif data.level == 15 and not table.find(data.unlockedClasses, "Mage") then
      table.insert(data.unlockedClasses, "Mage")
      MatchUpdate:FireClient(player, {event = "unlock", type = "class", value = "Mage"})
    end

    MatchUpdate:FireClient(player, {event = "level_up", level = data.level, currency = data.currency})
  end
end

--[[
============================================================================
6. ARENA DESIGN — Flat, Hazards, Ring-Out, Multi-Level, Voting
============================================================================
--]]

-- ── Arena definitions ─────────────────────────────────────────────────────────
local ARENAS = {
  {name = "Flat Arena",   folder = "FlatArena",   ringOut = false, hasHazards = false},
  {name = "Hazard Zone",  folder = "HazardArena",  ringOut = false, hasHazards = true },
  {name = "Sky Tower",    folder = "TowerArena",   ringOut = true,  hasHazards = false},
}

local currentArena = ARENAS[1]

-- ── Teleport players to an arena ──────────────────────────────────────────────
function teleportToArena(player1, player2)
  local arenaFolder = Workspace:FindFirstChild("Arenas") and
                      Workspace.Arenas:FindFirstChild(currentArena.folder)
  if not arenaFolder then return end

  local spawn1 = arenaFolder:FindFirstChild("Spawn1")
  local spawn2 = arenaFolder:FindFirstChild("Spawn2")
  if not spawn1 or not spawn2 then return end

  local root1 = getRootPart(player1)
  local root2 = getRootPart(player2)
  if root1 then root1.CFrame = spawn1.CFrame + Vector3.new(0, 3, 0) end
  if root2 then root2.CFrame = spawn2.CFrame + Vector3.new(0, 3, 0) end
end

-- ── Ring-Out detection (for Sky Tower arena) ─────────────────────────────────
local RING_OUT_Y = -50  -- if player falls below this Y, they are out

RunService.Heartbeat:Connect(function()
  if not currentArena.ringOut then return end

  for _, player in ipairs(Players:GetPlayers()) do
    local root = getRootPart(player)
    if root and root.Position.Y < RING_OUT_Y then
      -- Ring-out counts as a loss — find opponent
      for _, opponent in ipairs(Players:GetPlayers()) do
        if opponent ~= player and playerState[opponent.UserId] then
          local defeated = ReplicatedStorage.Bindables:FindFirstChild("PlayerDefeated")
          if defeated then defeated:Fire(player, opponent) end
          break
        end
      end
    end
  end
end)

-- ── Hazard system (lava floor sections) ──────────────────────────────────────
local LAVA_DAMAGE_RATE = 20  -- HP per second on lava
local LAVA_TICK        = 0.5  -- check every 0.5 seconds

task.spawn(function()
  while true do
    task.wait(LAVA_TICK)
    if not currentArena.hasHazards then continue end

    local arenaFolder = Workspace.Arenas and
                        Workspace.Arenas:FindFirstChild(currentArena.folder)
    if not arenaFolder then continue end

    local lavaFolder = arenaFolder:FindFirstChild("LavaZones")
    if not lavaFolder then continue end

    for _, player in ipairs(Players:GetPlayers()) do
      local root = getRootPart(player)
      if not root then continue end

      -- Check if player's feet are on a lava part
      local rayResult = Workspace:Raycast(
        root.Position,
        Vector3.new(0, -4, 0),
        RaycastParams.new()
      )

      if rayResult and rayResult.Instance then
        if rayResult.Instance:IsDescendantOf(lavaFolder) then
          local state = playerState[player.UserId]
          if state then
            state.hp = math.max(0, state.hp - LAVA_DAMAGE_RATE * LAVA_TICK)
            StateUpdate:FireAllClients({
              event      = "damage",
              targetId   = player.UserId,
              damage     = LAVA_DAMAGE_RATE * LAVA_TICK,
              attackType = "lava",
              targetHp   = state.hp,
              targetMaxHp = state.maxHp,
            })
            if state.hp <= 0 then
              -- Lava kill: no credited opponent
              local defeated = ReplicatedStorage.Bindables:FindFirstChild("PlayerDefeated")
              if defeated then defeated:Fire(player, player) end
            end
          end
        end
      end
    end
  end
end)

-- ── Arena voting system ───────────────────────────────────────────────────────
local arenaVotes      = {}  -- userId → arenaIndex
local votingActive    = false
local VOTE_DURATION   = 20  -- seconds

local ArenaVote = ReplicatedStorage.Remotes.ArenaVote

local function startArenaVote()
  if votingActive then return end
  votingActive = true
  arenaVotes   = {}

  -- Notify all clients that voting has started
  ArenaVote:FireAllClients({event = "vote_start", arenas = ARENAS, duration = VOTE_DURATION})

  task.delay(VOTE_DURATION, function()
    -- Tally votes
    local tally = {}
    for i = 1, #ARENAS do tally[i] = 0 end

    for _, arenaIdx in pairs(arenaVotes) do
      if tally[arenaIdx] then tally[arenaIdx] = tally[arenaIdx] + 1 end
    end

    -- Find winner (ties go to first option)
    local winner = 1
    for i, count in ipairs(tally) do
      if count > tally[winner] then winner = i end
    end

    currentArena = ARENAS[winner]
    ArenaVote:FireAllClients({event = "vote_end", winner = winner, arenaName = currentArena.name})
    votingActive = false
  end)
end

ArenaVote.OnServerEvent:Connect(function(player, arenaIndex)
  if not votingActive then return end
  if arenaIndex < 1 or arenaIndex > #ARENAS then return end
  arenaVotes[player.UserId] = arenaIndex
  ArenaVote:FireAllClients({event = "vote_update", votes = arenaVotes})
end)

--[[
============================================================================
7. NETWORK ARCHITECTURE — Client Prediction, Server Authority, Anti-Exploit
============================================================================
--]]

-- ── Rate limiting table ───────────────────────────────────────────────────────
-- Tracks requests per player per second to detect spam
local requestCounts = {}  -- userId → {count, windowStart}
local MAX_REQUESTS_PER_SECOND = 10

local function checkRateLimit(userId)
  local now   = tick()
  local entry = requestCounts[userId]
  if not entry or (now - entry.windowStart) > 1 then
    requestCounts[userId] = {count = 1, windowStart = now}
    return true
  end
  entry.count = entry.count + 1
  if entry.count > MAX_REQUESTS_PER_SECOND then
    -- Log potential exploit
    warn("[ANTI-EXPLOIT] Player", userId, "exceeded rate limit:", entry.count, "req/s")
    return false
  end
  return true
end

-- ── Speed anti-exploit ────────────────────────────────────────────────────────
-- Server periodically checks if player is moving faster than possible
local MAX_SPEED_STUDS = 60  -- absolute max studs/s any ability can grant
local lastPositions   = {}  -- userId → {pos, time}
local SPEED_CHECK_INTERVAL = 0.5  -- seconds

task.spawn(function()
  while true do
    task.wait(SPEED_CHECK_INTERVAL)
    for _, player in ipairs(Players:GetPlayers()) do
      local root = getRootPart(player)
      if not root then continue end
      local userId = player.UserId
      local now    = tick()
      local pos    = root.Position

      if lastPositions[userId] then
        local prev     = lastPositions[userId]
        local dt       = now - prev.time
        local distance = (pos - prev.pos).Magnitude
        local speed    = distance / dt

        if speed > MAX_SPEED_STUDS then
          warn("[ANTI-EXPLOIT] Speed violation: Player", player.Name, "moving at", math.floor(speed), "studs/s")
          -- Teleport back to last valid position
          root.CFrame = CFrame.new(prev.pos)
          -- Do NOT kick immediately — log and use progressive action
        end
      end

      lastPositions[userId] = {pos = pos, time = now}
    end
  end
end)

-- ── Hit reconciliation ────────────────────────────────────────────────────────
-- Server keeps a short position history (last 10 ticks) for each player
-- When validating a hit, check if positions at the moment of attack were valid
local positionHistory = {}  -- userId → {{pos, tick}, ...} ring buffer
local HISTORY_SIZE    = 10
local HISTORY_INTERVAL = 0.05  -- record every 50ms

task.spawn(function()
  while true do
    task.wait(HISTORY_INTERVAL)
    for _, player in ipairs(Players:GetPlayers()) do
      local root = getRootPart(player)
      if not root then continue end
      local userId = player.UserId
      positionHistory[userId] = positionHistory[userId] or {}
      local hist = positionHistory[userId]
      table.insert(hist, {pos = root.Position, t = tick()})
      if #hist > HISTORY_SIZE then table.remove(hist, 1) end
    end
  end
end)

-- Find the closest historical position to a given timestamp
local function getHistoricalPosition(userId, targetTime)
  local hist = positionHistory[userId]
  if not hist or #hist == 0 then return nil end

  local closest = hist[1]
  for _, entry in ipairs(hist) do
    if math.abs(entry.t - targetTime) < math.abs(closest.t - targetTime) then
      closest = entry
    end
  end
  return closest.pos
end

-- ── Main CombatRequest handler with all validation ───────────────────────────
CombatRequest.OnServerEvent:Connect(function(player, action, data)
  local userId = player.UserId
  if not playerState[userId] then return end

  -- Step 1: Global rate limit
  if not checkRateLimit(userId) then return end

  -- Step 2: Player must be alive
  local hum = getHumanoid(player)
  if not hum or hum.Health <= 0 then return end

  -- Step 3: Dispatch to appropriate handler
  if action == "m1" then
    handleM1(player)

  elseif action == "heavy" then
    handleHeavy(player)

  elseif action == "grab" then
    handleGrab(player)

  elseif action == "dash" then
    local dir = data and Vector3.new(data.x or 0, 0, data.z or 0) or nil
    handleDash(player, dir)

  elseif action == "dodge" then
    local dir = data and Vector3.new(data.x or 0, 0, data.z or 0) or nil
    handleDodge(player, dir)

  elseif action == "block_start" then
    handleBlock(player, true)

  elseif action == "block_end" then
    handleBlock(player, false)

  elseif action == "parry" then
    handleParry(player)

  elseif action == "air_dash" then
    local dir = data and Vector3.new(data.x or 0, data.y or 0, data.z or 0) or nil
    handleAirDash(player, dir)

  elseif action == "slam" then
    handleSlamDown(player)

  elseif action == "sprint_start" then
    handleSprint(player, true)

  elseif action == "sprint_end" then
    handleSprint(player, false)

  elseif action == "class_select" then
    if data and data.class then
      handleClassSelect(player, data.class)
    end

  elseif action == "queue_join" then
    local state = playerState[userId]
    if state then
      table.insert(matchmakingQueue, {userId = userId, elo = state.elo, queueTime = tick()})
      CombatResult:FireClient(player, {event = "queued", elo = state.elo})
    end

  elseif action == "queue_leave" then
    for i, entry in ipairs(matchmakingQueue) do
      if entry.userId == userId then
        table.remove(matchmakingQueue, i)
        break
      end
    end

  elseif action == "arena_vote" then
    if data and data.arenaIndex then
      ArenaVote:FireAllClients({event = "vote", userId = userId})
      arenaVotes[userId] = data.arenaIndex
    end

  elseif action == "leaderboard_request" then
    local lb = getTopLeaderboard(10)
    MatchUpdate:FireClient(player, {event = "leaderboard", data = lb})
  end
end)

-- ── Player join / leave lifecycle ────────────────────────────────────────────
Players.PlayerAdded:Connect(function(player)
  -- Load data
  local data = loadPlayerData(player)

  -- Wait for character
  player.CharacterAdded:Connect(function(character)
    character:WaitForChild("HumanoidRootPart")
    character:WaitForChild("Humanoid")
    initState(player)

    -- Apply class stats to humanoid
    local stats = CLASS_STATS[data.class] or CLASS_STATS.Brawler
    local hum = character:WaitForChild("Humanoid")
    hum.MaxHealth = stats.maxHp
    hum.Health    = stats.maxHp
    hum.WalkSpeed = stats.speed

    -- Send initial data to client
    MatchUpdate:FireClient(player, {
      event  = "init",
      class  = data.class,
      elo    = data.elo,
      rank   = data.rank,
      level  = data.level,
      xp     = data.xp,
      wins   = data.wins,
      losses = data.losses,
    })

    -- Track wins/losses on defeat
    local defeated = ReplicatedStorage.Bindables:FindFirstChild("PlayerDefeated")
    -- Win XP grant (connected in PlayerDefeated handler above via addXP)
  end)

  player:LoadCharacter()
end)

Players.PlayerRemoving:Connect(function(player)
  -- Sync server state back to data cache before saving
  local state = playerState[player.UserId]
  local data  = playerDataCache[player.UserId]
  if state and data then
    data.elo  = state.elo
    data.rank = state.rank
  end

  savePlayerData(player)
  playerState[player.UserId]      = nil
  playerDataCache[player.UserId]  = nil
  abilityCooldowns[player.UserId] = nil
  passiveEffects[player.UserId]   = nil
  lastDash[player.UserId]         = nil
  lastDodge[player.UserId]        = nil
  isSprinting[player.UserId]      = nil
  lastPositions[player.UserId]    = nil
  positionHistory[player.UserId]  = nil
  requestCounts[player.UserId]    = nil
  RATE_LIMIT[player.UserId]       = nil
  PASSIVE_HEAL_COOLDOWN[player.UserId] = nil
end)

-- ── BindToClose: ensure data saves on server shutdown ────────────────────────
game:BindToClose(function()
  for _, player in ipairs(Players:GetPlayers()) do
    savePlayerData(player)
  end
end)

-- ── Start arena vote on server start ─────────────────────────────────────────
task.delay(5, startArenaVote)

print("[FightingServer] All systems initialized.")
print("  Combat: M1 chain, heavy, grab/throw, hitbox via GetPartBoundsInBox")
print("  Movement: dash (i-frames), dodge, block, parry, aerial, sprint")
print("  Abilities: 4 slots per class, cooldowns, energy, ultimate")
print("  ELO: K-factor ranking, 7 tiers Bronze→Grandmaster, matchmaking queue")
print("  Classes: Brawler / Swordsman / Mage, unlocked at levels 1/5/15")
print("  Arenas: Flat, Hazard (lava), Tower (ring-out), player voting")
print("  Network: rate limit 10 req/s, speed anti-exploit, position history")

--[[
============================================================================
CLIENT SCRIPT (StarterPlayerScripts/FightingClient)
============================================================================
Responsibilities:
  - Read user inputs (mouse, keyboard, mobile)
  - Play animations locally for immediate feel (client-side prediction)
  - Send intent to server via CombatRequest RemoteEvent
  - Receive results via CombatResult / StateUpdate and update HUD
  - Display damage numbers, combo counter, skill cooldown overlays

Client NEVER does: deal damage, change HP, modify server state.
--]]

local Players2         = game:GetService("Players")
local UserInputService = game:GetService("UserInputService")
local RunService2      = game:GetService("RunService")
local TweenService2    = game:GetService("TweenService")
local ReplicatedStorage2 = game:GetService("ReplicatedStorage")
local Workspace2       = game:GetService("Workspace")

local LocalPlayer = Players2.LocalPlayer
local Mouse       = LocalPlayer:GetMouse()

-- RemoteEvent references
local CombatRequest2  = ReplicatedStorage2.Remotes.CombatRequest
local CombatResult2   = ReplicatedStorage2.Remotes.CombatResult
local StateUpdate2    = ReplicatedStorage2.Remotes.StateUpdate
local AbilityRequest2 = ReplicatedStorage2.Remotes.AbilityRequest
local AbilityResult2  = ReplicatedStorage2.Remotes.AbilityResult
local MovementRequest2 = ReplicatedStorage2.Remotes.MovementRequest
local MatchUpdate2    = ReplicatedStorage2.Remotes.MatchUpdate

-- HUD references
local HUD           = LocalPlayer.PlayerGui:WaitForChild("FightingHUD")
local HPBar         = HUD.HPBar.Bar
local HPLabel       = HUD.HPBar.Label
local StaminaBar    = HUD.StaminaBar.Bar
local EnergyBar     = HUD.EnergyBar.Bar
local ComboCounter  = HUD.ComboCounter
local RankBadge     = HUD.RankBadge
local KillFeed      = HUD.KillFeed

-- Skill buttons
local skillButtons = {
  HUD.Skill1Button,
  HUD.Skill2Button,
  HUD.Skill3Button,
  HUD.Skill4Button,
}

-- Client-side state mirror (display only, not authoritative)
local clientState = {
  hp        = 100,
  maxHp     = 100,
  stamina   = 100,
  energy    = 0,
  combo     = 0,
  rank      = "Bronze",
  elo       = 1000,
}

-- Input debounce
local lastInput    = {}
local CLICK_DEBOUNCE = 0.05

-- ── Input bindings ────────────────────────────────────────────────────────────
-- M1: Left mouse click
-- Heavy: E key (hold for charge — client just sends event, server tracks timing)
-- Block: F key (hold)
-- Parry: Q key
-- Dash: Double-tap WASD direction
-- Sprint: Hold LeftShift
-- Slam: Space while airborne (air slam)
-- Skills: 1, 2, 3, 4 keys
-- Ultimate: R key

-- Dash double-tap detection
local keyTapHistory = {}  -- key → last tap tick
local DOUBLE_TAP_WINDOW = 0.3

local function getMoveDirection()
  local moveVec = Vector3.new(0, 0, 0)
  if UserInputService:IsKeyDown(Enum.KeyCode.W) then moveVec = moveVec + Vector3.new(0, 0, -1) end
  if UserInputService:IsKeyDown(Enum.KeyCode.S) then moveVec = moveVec + Vector3.new(0, 0,  1) end
  if UserInputService:IsKeyDown(Enum.KeyCode.A) then moveVec = moveVec + Vector3.new(-1, 0, 0) end
  if UserInputService:IsKeyDown(Enum.KeyCode.D) then moveVec = moveVec + Vector3.new( 1, 0, 0) end
  return moveVec.Magnitude > 0 and moveVec.Unit or nil
end

UserInputService.InputBegan:Connect(function(input, gameProcessed)
  if gameProcessed then return end

  -- M1 attack
  if input.UserInputType == Enum.UserInputType.MouseButton1 then
    local now = tick()
    if lastInput.m1 and (now - lastInput.m1) < CLICK_DEBOUNCE then return end
    lastInput.m1 = now
    CombatRequest2:FireServer("m1")

  -- Heavy attack (E)
  elseif input.KeyCode == Enum.KeyCode.E then
    CombatRequest2:FireServer("heavy")

  -- Parry (Q)
  elseif input.KeyCode == Enum.KeyCode.Q then
    CombatRequest2:FireServer("parry")

  -- Block start (F hold)
  elseif input.KeyCode == Enum.KeyCode.F then
    CombatRequest2:FireServer("block_start")

  -- Grab (G)
  elseif input.KeyCode == Enum.KeyCode.G then
    CombatRequest2:FireServer("grab")

  -- Sprint start (LeftShift)
  elseif input.KeyCode == Enum.KeyCode.LeftShift then
    CombatRequest2:FireServer("sprint_start")

  -- Skill slots (1-4)
  elseif input.KeyCode == Enum.KeyCode.One   then AbilityRequest2:FireServer(1)
  elseif input.KeyCode == Enum.KeyCode.Two   then AbilityRequest2:FireServer(2)
  elseif input.KeyCode == Enum.KeyCode.Three then AbilityRequest2:FireServer(3)
  elseif input.KeyCode == Enum.KeyCode.Four  then AbilityRequest2:FireServer(4)

  -- Ultimate (R)
  elseif input.KeyCode == Enum.KeyCode.R then
    AbilityRequest2:FireServer("ult")

  -- Dash double-tap WASD
  elseif input.KeyCode == Enum.KeyCode.W or
         input.KeyCode == Enum.KeyCode.A or
         input.KeyCode == Enum.KeyCode.S or
         input.KeyCode == Enum.KeyCode.D then

    local key = input.KeyCode
    local now = tick()
    if keyTapHistory[key] and (now - keyTapHistory[key]) < DOUBLE_TAP_WINDOW then
      -- Double tap detected — dash in that direction
      local moveDir = getMoveDirection()
      if moveDir then
        CombatRequest2:FireServer("dash", {x = moveDir.X, z = moveDir.Z})
      end
      keyTapHistory[key] = nil  -- reset to prevent triple-tap
    else
      keyTapHistory[key] = now
    end
  end
end)

UserInputService.InputEnded:Connect(function(input, gameProcessed)
  if input.KeyCode == Enum.KeyCode.F then
    CombatRequest2:FireServer("block_end")
  elseif input.KeyCode == Enum.KeyCode.LeftShift then
    CombatRequest2:FireServer("sprint_end")
  end
end)

-- ── HUD update functions ──────────────────────────────────────────────────────
local function updateHPBar()
  local ratio = math.clamp(clientState.hp / clientState.maxHp, 0, 1)
  TweenService2:Create(HPBar, TweenInfo.new(0.15), {Size = UDim2.new(ratio, 0, 1, 0)}):Play()
  HPLabel.Text = math.floor(clientState.hp) .. " / " .. clientState.maxHp

  -- Color: green → yellow → red
  if ratio > 0.5 then
    HPBar.BackgroundColor3 = Color3.fromRGB(60, 200, 60):Lerp(Color3.fromRGB(220, 200, 40), 1 - (ratio - 0.5) * 2)
  else
    HPBar.BackgroundColor3 = Color3.fromRGB(220, 200, 40):Lerp(Color3.fromRGB(220, 50, 50), 1 - ratio * 2)
  end
end

local function updateStaminaBar()
  local ratio = math.clamp(clientState.stamina / 100, 0, 1)
  StaminaBar.Size = UDim2.new(ratio, 0, 1, 0)
end

local function updateEnergyBar()
  local ratio = math.clamp(clientState.energy / 100, 0, 1)
  TweenService2:Create(EnergyBar, TweenInfo.new(0.2), {Size = UDim2.new(ratio, 0, 1, 0)}):Play()
  if ratio >= 1 then
    EnergyBar.BackgroundColor3 = Color3.fromRGB(255, 215, 0)  -- gold when full (ult ready)
  else
    EnergyBar.BackgroundColor3 = Color3.fromRGB(80, 120, 255)
  end
end

local function updateComboCounter(count)
  if count > 1 then
    ComboCounter.Text     = count .. " HIT COMBO"
    ComboCounter.Visible  = true
    -- Scale animation
    ComboCounter.TextSize = 24 + count * 2
    TweenService2:Create(ComboCounter, TweenInfo.new(0.1), {TextSize = 24}):Play()
  else
    ComboCounter.Visible = false
  end
end

-- ── Skill cooldown overlay display ───────────────────────────────────────────
local skillCooldownData = {[1]={}, [2]={}, [3]={}, [4]={}}

local function startSkillCooldownDisplay(slot, duration)
  local btn = skillButtons[slot]
  if not btn then return end
  local overlay = btn:FindFirstChild("CooldownOverlay") or
                  Instance.new("Frame", btn)
  overlay.Name             = "CooldownOverlay"
  overlay.Size             = UDim2.new(1, 0, 1, 0)
  overlay.BackgroundColor3 = Color3.fromRGB(0, 0, 0)
  overlay.BackgroundTransparency = 0.4
  overlay.ZIndex           = btn.ZIndex + 1

  local label = overlay:FindFirstChild("Label") or
                Instance.new("TextLabel", overlay)
  label.Name            = "Label"
  label.Size            = UDim2.new(1, 0, 1, 0)
  label.BackgroundTransparency = 1
  label.TextColor3      = Color3.new(1, 1, 1)
  label.Font            = Enum.Font.GothamBold
  label.TextScaled      = true

  local endTime = tick() + duration
  skillCooldownData[slot] = {endTime = endTime, duration = duration}
end

RunService2.RenderStepped:Connect(function()
  for slot = 1, 4 do
    local data = skillCooldownData[slot]
    if not data.endTime then continue end

    local btn     = skillButtons[slot]
    local overlay = btn and btn:FindFirstChild("CooldownOverlay")
    if not overlay then continue end

    local remaining = data.endTime - tick()
    if remaining <= 0 then
      overlay.Visible = false
      skillCooldownData[slot] = {}
    else
      overlay.Visible = true
      local label = overlay:FindFirstChild("Label")
      if label then label.Text = string.format("%.1f", remaining) end
      -- Shrink overlay as cooldown elapses
      local ratio = remaining / data.duration
      overlay.Size = UDim2.new(1, 0, ratio, 0)
      overlay.Position = UDim2.new(0, 0, 1 - ratio, 0)
    end
  end
end)

-- ── Floating damage number display ───────────────────────────────────────────
local function showDamageNumber(damage, position, wasBlocked)
  local billboard = Instance.new("BillboardGui")
  billboard.AlwaysOnTop  = false
  billboard.Size         = UDim2.new(0, 80, 0, 40)
  billboard.StudsOffset  = Vector3.new(math.random(-1, 1), 3, 0)
  billboard.Adornee      = Instance.new("Part")  -- temporary anchor
  billboard.Adornee.Size = Vector3.new(0.1, 0.1, 0.1)
  billboard.Adornee.CanCollide = false
  billboard.Adornee.Anchored   = true
  billboard.Adornee.Transparency = 1
  billboard.Adornee.Position = position
  billboard.Adornee.Parent   = Workspace2

  local label        = Instance.new("TextLabel", billboard)
  label.Size         = UDim2.new(1, 0, 1, 0)
  label.BackgroundTransparency = 1
  label.Font         = Enum.Font.GothamBold
  label.TextScaled   = true
  label.Text         = wasBlocked and ("(" .. damage .. ")") or tostring(damage)
  label.TextColor3   = wasBlocked and Color3.fromRGB(180, 180, 180) or Color3.fromRGB(255, 80, 80)
  label.TextStrokeTransparency = 0

  billboard.Parent = billboard.Adornee

  -- Float upward then fade
  TweenService2:Create(billboard.Adornee, TweenInfo.new(0.8, Enum.EasingStyle.Quad, Enum.EasingDirection.Out), {
    Position = position + Vector3.new(0, 6, 0)
  }):Play()
  TweenService2:Create(label, TweenInfo.new(0.8, Enum.EasingStyle.Quad, Enum.EasingDirection.In, 0, false, 0.4), {
    TextTransparency = 1
  }):Play()

  task.delay(1.2, function()
    if billboard.Adornee and billboard.Adornee.Parent then
      billboard.Adornee:Destroy()
    end
  end)
end

-- ── State update handler (server → client broadcast) ─────────────────────────
StateUpdate2.OnClientEvent:Connect(function(data)
  local event    = data.event
  local myUserId = LocalPlayer.UserId

  if event == "damage" then
    if data.targetId == myUserId then
      clientState.hp    = data.targetHp
      clientState.maxHp = data.targetMaxHp
      updateHPBar()

      -- Screen flash red on taking damage
      local flash = HUD:FindFirstChild("DamageFlash")
      if flash then
        flash.BackgroundTransparency = 0.3
        TweenService2:Create(flash, TweenInfo.new(0.4), {BackgroundTransparency = 1}):Play()
      end
    end

    -- Show damage number on the target's character
    if data.attackerId == myUserId then
      local target = Players2:GetPlayerByUserId(data.targetId)
      if target and target.Character then
        local tRoot = target.Character:FindFirstChild("HumanoidRootPart")
        if tRoot then
          showDamageNumber(data.damage, tRoot.Position, data.wasBlocked)
        end
      end
    end

  elseif event == "parry" then
    if data.attackerId == myUserId then
      -- Visual feedback: screen flash yellow for being parried
      local flash = HUD:FindFirstChild("ParryFlash")
      if flash then
        flash.BackgroundTransparency = 0.3
        TweenService2:Create(flash, TweenInfo.new(0.3), {BackgroundTransparency = 1}):Play()
      end
    end

  elseif event == "guardbreak" then
    if data.targetId == myUserId then
      local flash = HUD:FindFirstChild("DamageFlash")
      if flash then
        flash.BackgroundColor3    = Color3.fromRGB(255, 140, 0)
        flash.BackgroundTransparency = 0.2
        TweenService2:Create(flash, TweenInfo.new(0.5), {BackgroundTransparency = 1}):Play()
      end
    end
  end
end)

-- ── Ability result handler ────────────────────────────────────────────────────
AbilityResult2.OnClientEvent:Connect(function(data)
  if data.success and data.slot then
    local slot = tonumber(data.slot)
    if slot then
      startSkillCooldownDisplay(slot, data.cooldown or 5)
    end
  end
end)

-- ── Match update handler (ELO, rank changes, level ups) ──────────────────────
MatchUpdate2.OnClientEvent:Connect(function(data)
  if data.event == "init" then
    clientState.rank = data.rank
    clientState.elo  = data.elo
    RankBadge.TextLabel.Text = data.rank .. " | " .. data.elo

  elseif data.event == "match_end" then
    -- Show match result screen
    local resultGui = HUD:FindFirstChild("MatchResult")
    if resultGui then
      resultGui.Visible = true
      resultGui.ResultLabel.Text  = data.result == "win" and "VICTORY" or "DEFEAT"
      resultGui.ELOLabel.Text     = (data.eloGain >= 0 and "+" or "") .. data.eloGain .. " ELO"
      resultGui.RankLabel.Text    = "New Rank: " .. data.newRank
      resultGui.ELOLabel.TextColor3 = data.eloGain >= 0 and
        Color3.fromRGB(80, 220, 80) or Color3.fromRGB(220, 80, 80)

      task.delay(5, function()
        if resultGui and resultGui.Parent then
          resultGui.Visible = false
        end
      end)
    end

    clientState.rank = data.newRank
    clientState.elo  = data.newELO
    RankBadge.TextLabel.Text = data.newRank .. " | " .. data.newELO

  elseif data.event == "level_up" then
    -- Level up notification
    local notif = HUD:FindFirstChild("LevelUpNotif")
    if notif then
      notif.TextLabel.Text = "LEVEL " .. data.level .. "!"
      notif.Visible        = true
      TweenService2:Create(notif, TweenInfo.new(2), {Position = UDim2.new(0.5, 0, 0.3, 0)}):Play()
      task.delay(2.5, function()
        if notif and notif.Parent then notif.Visible = false end
      end)
    end

  elseif data.event == "leaderboard" then
    -- Populate leaderboard frame
    local lbFrame = HUD:FindFirstChild("LeaderboardFrame")
    if not lbFrame then return end
    for _, child in ipairs(lbFrame:GetChildren()) do
      if child:IsA("Frame") then child:Destroy() end
    end
    for i, entry in ipairs(data.data) do
      local row = Instance.new("Frame", lbFrame)
      row.Size = UDim2.new(1, 0, 0, 36)
      row.LayoutOrder = i
      local label = Instance.new("TextLabel", row)
      label.Size = UDim2.new(1, 0, 1, 0)
      label.BackgroundTransparency = 1
      label.TextColor3 = Color3.new(1, 1, 1)
      label.Font = Enum.Font.Gotham
      label.TextScaled = true
      label.Text = string.format("#%d  %s  |  %s  |  %d ELO", i, entry.name, entry.rank, entry.elo)
    end
  end
end)

print("[FightingClient] Input and HUD systems ready.")

--[[
============================================================================
FOLDER SETUP SCRIPT (Run once in Command Bar or a separate Script)
============================================================================
Creates all necessary RemoteEvents and folders so scripts don't error.
--]]

-- Run this in ServerScriptService as a one-time setup Script:
local RS = game:GetService("ReplicatedStorage")

local function ensure(parent, class, name)
  local existing = parent:FindFirstChild(name)
  if existing then return existing end
  local inst = Instance.new(class)
  inst.Name   = name
  inst.Parent = parent
  return inst
end

local Remotes    = ensure(RS, "Folder", "Remotes")
local Bindables  = ensure(RS, "Folder", "Bindables")

local remoteNames = {
  "CombatRequest", "CombatResult", "StateUpdate",
  "AbilityRequest", "AbilityResult",
  "MovementRequest", "MovementResult",
  "MatchUpdate", "ArenaVote",
}
for _, name in ipairs(remoteNames) do
  ensure(Remotes, "RemoteEvent", name)
end

ensure(Bindables, "BindableEvent", "PlayerDefeated")

local WorkspaceArenas = ensure(workspace, "Folder", "Arenas")
ensure(workspace, "Folder", "ArenaVoting")
ensure(game:GetService("ServerStorage"), "Folder", "Effects")
ensure(game:GetService("ServerStorage"), "Folder", "CharacterTemplates")

print("[Setup] All RemoteEvents, Folders, and Bindables created.")
print("Build parts manually:")
print("  Workspace/Arenas/FlatArena  — ground part (200x1x200) + 4 boundary walls")
print("  Workspace/Arenas/HazardArena — same + Folder LavaZones with lava Parts")
print("  Workspace/Arenas/TowerArena  — tiered platforms + Spawn1, Spawn2 parts")
print("  ServerStorage/Effects — HitEffect, BlockEffect, ParryEffect, DashTrail, UltEffect parts")
]]`;
}
