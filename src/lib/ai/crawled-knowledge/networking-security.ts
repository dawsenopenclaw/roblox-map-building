// Crawled from Roblox Creator Hub — Apr 29 2026
// Sources: /docs/scripting/events/remote, /docs/scripting/module (encapsulation)
// + security best practices from DevForum knowledge

export const NETWORKING_SECURITY = `
=== REMOTE EVENTS & FUNCTIONS (CLIENT-SERVER NETWORKING) ===

Roblox is multiplayer by default. Client and server communicate via:
  - RemoteEvent    → one-way, fire-and-forget (no yield)
  - UnreliableRemoteEvent → one-way, trades ordering/reliability for performance
                           Use for non-critical continuous data (position spam, VFX)
  - RemoteFunction → two-way, sender yields waiting for response

All remotes MUST be in a location both sides can see: ReplicatedStorage (standard),
Workspace, or inside a Tool.

--- QUICK REFERENCE ---

Client → Server (RemoteEvent):
  CLIENT:  remoteEvent:FireServer(arg1, arg2)
  SERVER:  remoteEvent.OnServerEvent:Connect(function(player, arg1, arg2) end)
           -- NOTE: first arg is always the Player object automatically

Server → Client (RemoteEvent):
  SERVER:  remoteEvent:FireClient(player, arg1, arg2)
  CLIENT:  remoteEvent.OnClientEvent:Connect(function(arg1, arg2) end)

Server → All Clients (RemoteEvent):
  SERVER:  remoteEvent:FireAllClients(arg1, arg2)
  CLIENT:  remoteEvent.OnClientEvent:Connect(function(arg1, arg2) end)

Client → Server → Client (RemoteFunction):
  CLIENT:  local result = remoteFunction:InvokeServer(args)  -- YIELDS
  SERVER:  remoteFunction.OnServerInvoke = function(player, args) return val end

Server → Client → Server (RemoteFunction) — AVOID:
  -- Dangerous: if client disconnects, server errors. If client never returns, server hangs.
  -- Use RemoteEvent (FireClient) instead for server→client messages.

--- CODE EXAMPLES ---

Setup (server Script in ServerScriptService):
  local RS = game:GetService("ReplicatedStorage")
  local re = RS:WaitForChild("MyEvent")

  re.OnServerEvent:Connect(function(player, action, data)
    print(player.Name, "fired:", action, data)
  end)

Firing from client (LocalScript):
  local RS = game:GetService("ReplicatedStorage")
  local re = RS:WaitForChild("MyEvent")
  re:FireServer("BuyItem", { itemId = "sword_01" })

Broadcast to all (server Script):
  re:FireAllClients("GameStarted", { mapName = "Castle" })

RemoteFunction example:
  -- Server
  remoteFunction.OnServerInvoke = function(player, itemId)
    local item = getItemFromDatabase(itemId)
    return item  -- returned to client
  end

  -- Client
  local item = remoteFunction:InvokeServer("sword_01")
  print(item.name)

--- ARGUMENT LIMITATIONS ---

What CAN be passed: numbers, strings, booleans, tables, Instances, Enums, Vector3,
                    CFrame, Color3, UDim2, and other Roblox data types

What CANNOT:
  - Functions: arrive as nil on the other side
  - Non-replicated Instances: ServerStorage items → nil on client
  - Client-created parts not replicated → nil on server

Table gotchas:
  - Tables are COPIED, not referenced (table identity changes)
  - Metatables are STRIPPED — only raw data survives
  - Non-string indices (Instances, userdata) → converted to string keys
  - Avoid mixed tables (numeric + string keys in same table)
  - Avoid nil values in arrays (breaks ipairs)

SAFE table patterns:
  -- Numeric-only (array)
  re:FireServer({"Sword", "Shield"})

  -- String-key only (dictionary)
  re:FireServer({ CharName = "Hero", CharClass = "Warrior" })

  -- NOT recommended (mixed):
  re:FireServer({ "Sword", CharName = "Hero" })

--- SECURITY: SERVER AUTHORITY (CRITICAL) ---

The GOLDEN RULE: NEVER trust the client. The server is the source of truth.

EXPLOIT PATTERNS TO BLOCK:

1. Client should REQUEST, server should VALIDATE and EXECUTE:
   -- WRONG (trusting client values):
   re.OnServerEvent:Connect(function(player, newHealth)
     player.Character.Humanoid.Health = newHealth  -- exploitable!
   end)

   -- RIGHT (server calculates):
   re.OnServerEvent:Connect(function(player, action)
     if action == "Heal" and hasPotion(player) then
       removePotion(player)
       local hum = player.Character and player.Character:FindFirstChild("Humanoid")
       if hum then hum.Health = math.min(hum.Health + 50, hum.MaxHealth) end
     end
   end)

2. Validate player ownership before acting:
   re.OnServerEvent:Connect(function(player, targetPartName)
     -- Verify the target belongs to the player
     local char = player.Character
     if not char then return end
     local part = char:FindFirstChild(targetPartName)
     if not part then return end  -- reject if not found on their character
     -- safe to proceed
   end)

3. Validate data types and ranges:
   re.OnServerEvent:Connect(function(player, amount)
     if type(amount) ~= "number" then return end
     if amount <= 0 or amount > 100 then return end
     if amount ~= math.floor(amount) then return end  -- integers only
     -- safe to use amount
   end)

4. Never expose ServerStorage or server secrets to clients

5. Key checks on incoming events:
   -- Type check
   if typeof(arg) ~= "Vector3" then return end
   -- Range check
   if (arg - player.Character.HumanoidRootPart.Position).Magnitude > 50 then
     return  -- too far away, likely exploiting
   end
   -- Cooldown check
   if os.time() - lastActionTime[player.UserId] < 1 then return end

--- RATE LIMITING PATTERN ---

local lastFire = {}
local COOLDOWN = 0.5  -- seconds

remoteEvent.OnServerEvent:Connect(function(player, ...)
  local now = os.time()
  if lastFire[player.UserId] and (now - lastFire[player.UserId]) < COOLDOWN then
    warn(player.Name .. " is firing too fast")
    return
  end
  lastFire[player.UserId] = now
  -- process event
end)

-- Cleanup on player leave
game.Players.PlayerRemoving:Connect(function(player)
  lastFire[player.UserId] = nil
end)

--- REPLICATION RULES ---

What replicates Server → Client automatically:
  - All Instances parented to Workspace, ReplicatedStorage, ReplicatedFirst
  - Property changes on replicated Instances
  - Humanoid states, character movement

What DOES NOT replicate:
  - ServerStorage, ServerScriptService contents (invisible to client)
  - Instances created in LocalScripts (client-local only, server sees nil)
  - Local property changes in LocalScripts (not sent to server)

Network ownership:
  - Server owns all anchored parts
  - Clients get "network ownership" of parts near their character
  - Use BasePart:SetNetworkOwner(player) to assign manually
  - Use BasePart:SetNetworkOwnershipAuto() to let engine decide
  - GOTCHA: physics-heavy vehicles should have SetNetworkOwner(driverPlayer)

--- BINDABLE EVENTS (same-side communication) ---

BindableEvent: server→server or client→client only
BindableFunction: same-side function call

  -- Usage
  local be = Instance.new("BindableEvent")
  be.Event:Connect(function(data) print(data) end)
  be:Fire("hello")
  be:Destroy()  -- cleanup

Common pattern: use BindableEvents inside ModuleScripts for clean APIs:
  local M = {}
  local be = Instance.new("BindableEvent")
  M.OnTriggered = be.Event  -- expose as event
  function M.trigger(data) be:Fire(data) end
  return M

--- SINGLE REMOTE PATTERN (efficient architecture) ---

Instead of many RemoteEvents, use one with an ID:
  -- Client fires with action ID
  remoteEvent:FireServer("Action_BuyItem", { id = "sword" })
  remoteEvent:FireServer("Action_UsePotion", {})

  -- Server routes by ID
  local handlers = {
    Action_BuyItem = function(player, data) ... end,
    Action_UsePotion = function(player, data) ... end,
  }

  remoteEvent.OnServerEvent:Connect(function(player, actionId, data)
    local handler = handlers[actionId]
    if handler then
      handler(player, data)
    else
      warn("Unknown action:", actionId)
    end
  end)

--- EXPLOIT PREVENTION CHECKLIST ---

Server-side:
  [x] Validate ALL incoming data (type, range, ownership)
  [x] Rate limit all RemoteEvents (per player cooldowns)
  [x] Never trust client positions — verify proximity server-side
  [x] Never trust client damage values — calculate damage server-side
  [x] Check player has required items/permissions before acting
  [x] Sanitize string inputs (use TextService:FilterStringAsync for chat)
  [x] Use pcall on all DataStore calls
  [x] Keep game logic in ServerScriptService (never ReplicatedStorage)

Client-side:
  [x] Only handle UI updates from server events — don't run game logic
  [x] Use WaitForChild() for all cross-boundary references
  [x] Don't store sensitive values (prices, damage) in LocalScripts

--- UNRELIABLE REMOTE EVENTS ---

UnreliableRemoteEvent works exactly like RemoteEvent but:
  - No guaranteed ordering
  - No guaranteed delivery
  - Much lower bandwidth cost

Use for: continuous position updates, non-critical particles/VFX, heartbeat pings
Avoid for: purchases, damage, state changes, anything that must arrive

  -- Same API as RemoteEvent:
  unreliableRE:FireServer(pos)
  unreliableRE.OnServerEvent:Connect(function(player, pos) end)
`;
