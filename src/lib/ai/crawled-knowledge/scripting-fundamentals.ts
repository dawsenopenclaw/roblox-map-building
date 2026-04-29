// Crawled from Roblox Creator Hub — Apr 29 2026
// Sources: /docs/scripting, /docs/luau, /docs/luau/type-checking,
//          /docs/scripting/locations, /docs/scripting/module, /docs/scripting/events

export const SCRIPTING_FUNDAMENTALS = `
=== LUAU LANGUAGE FUNDAMENTALS ===

Luau is derived from Lua 5.1 with extras: optional typing, string interpolation,
generalized iteration, performance improvements. All valid Lua 5.1 is valid Luau.

--- VARIABLES & SCOPE ---
Always use local. Global vars are slow and leak state.
  local x = 10
  local name = "Vyren"
  local isAlive = true
  local nothing = nil  -- nil evaluates false in conditionals

String interpolation (Luau):
  local msg = \`Hello {name}, you have {x} coins!\`

--- TYPES (Luau gradual typing) ---
Inference modes (first line of script):
  --!nocheck     -- no type checking
  --!nonstrict   -- only checks explicitly annotated vars (DEFAULT)
  --!strict      -- checks everything

Annotations:
  local foo: string = "bar"
  local x: number = 5
  local part: Part = Instance.new("Part")
  local mat: Enum.Material = part.Material
  local maybe: string? = nil  -- optional (string or nil)

Function types:
  local function add(x: number, y: number): number
    return x + y
  end
  type AddFn = (x: number, y: number) -> number

Table types:
  local nums: {number} = {1, 2, 3}
  local map: {[string]: number} = {score = 100}
  type Car = { Speed: number, Drive: (Car) -> () }

Generics:
  type List<T> = {T}
  local names: List<string> = {"Alice", "Bob"}
  type State<T> = { Key: string, Value: T }

Unions & intersections:
  type StrOrNum = number | string
  type Both = TypeA & TypeB

Export types from ModuleScripts:
  export type Cat = { Name: string, Meow: (Cat) -> () }

Type cast with ::
  local n = 1
  local s = n :: any  -- cast to any

--- DATA TYPES ---
Primitive: nil, boolean, number (64-bit float), string
Tables: arrays (1-based!) and dictionaries

  local arr = {"a", "b", "c"}
  print(arr[1])  --> "a"

  local dict = { name = "hero", hp = 100 }
  print(dict.name)  --> "hero"

Iteration:
  for i, v in ipairs(arr) do ... end      -- arrays (ordered)
  for k, v in pairs(dict) do ... end      -- dicts
  for k, v in dict do ... end             -- Luau generalized (same as pairs)

Table methods:
  table.insert(t, val)
  table.remove(t, index)
  table.concat(t, sep)
  table.sort(t, compareFn)
  table.find(t, val)

--- CONTROL STRUCTURES ---
  if condition then
    -- ...
  elseif other then
    -- ...
  else
    -- ...
  end

  while condition do ... end

  repeat
    -- ...
  until condition

  for i = 1, 10 do ... end
  for i = 10, 1, -1 do ... end  -- countdown

  -- break exits any loop
  -- continue (Luau) skips to next iteration

--- FUNCTIONS ---
  local function greet(name: string): string
    return "Hello " .. name
  end

  -- Variadic
  local function sum(...: number): number
    local total = 0
    for _, v in {...} do total += v end
    return total
  end

  -- Anonymous / lambda
  local double = function(x) return x * 2 end

  -- Multiple return values
  local function divide(a, b)
    if b == 0 then return nil, "division by zero" end
    return a / b, nil
  end
  local result, err = divide(10, 2)

--- ERROR HANDLING ---
ALWAYS wrap network calls, DataStore, and risky code in pcall:
  local success, result = pcall(function()
    return dangerousCall()
  end)
  if not success then
    warn("Error:", result)
  end

xpcall with traceback:
  local ok, err = xpcall(function()
    error("oops")
  end, function(e)
    return debug.traceback(e, 2)
  end)

--- TASK LIBRARY (modern, replaces wait/spawn/delay) ---
  task.wait(seconds)          -- yield current thread
  task.spawn(fn, ...)         -- fire and forget (next resumption)
  task.defer(fn, ...)         -- defer to end of current step
  task.delay(t, fn, ...)      -- schedule after t seconds
  task.cancel(thread)         -- cancel scheduled task

NEVER use bare wait() — use task.wait() instead.
NEVER use spawn() — use task.spawn() instead.

--- COROUTINES ---
  local co = coroutine.create(function()
    for i = 1, 3 do
      coroutine.yield(i)
    end
  end)
  coroutine.resume(co)  --> 1
  coroutine.resume(co)  --> 2

  -- wrap creates a function that resumes automatically
  local gen = coroutine.wrap(function()
    coroutine.yield(1)
    coroutine.yield(2)
  end)
  print(gen())  --> 1
  print(gen())  --> 2

--- METATABLES ---
  local Animal = {}
  Animal.__index = Animal

  function Animal.new(name, sound)
    return setmetatable({ name = name, sound = sound }, Animal)
  end

  function Animal:speak()
    print(self.name .. " says " .. self.sound)
  end

  local cat = Animal.new("Cat", "Meow")
  cat:speak()

Metamethods: __index, __newindex, __add, __sub, __mul, __div,
             __eq, __lt, __le, __len, __tostring, __call

--- SCRIPT TYPES & LOCATIONS ---

Script (server or client depending on RunContext):
  - Legacy RunContext (default) = server-only, runs in Workspace/ServerScriptService
  - RunContext = Server: also runs in ReplicatedStorage (not recommended)
  - RunContext = Client: runs in ReplicatedStorage (recommended pattern)

LocalScript:
  - Always client-only, no RunContext setting
  - Use in StarterGui, StarterCharacterScripts, StarterPlayerScripts, StarterPack

ModuleScript:
  - Shared code, loaded with require()
  - No RunContext, runs wherever it's required from
  - Returns once, cached — same reference on subsequent requires (per side)

RECOMMENDED LAYOUT:
  ReplicatedStorage/
    Modules/         ← ModuleScripts accessible by both server + client
  ServerScriptService/
    Server.server.luau   ← one server Script with RunContext=Server
    ServerModules/       ← server-only ModuleScripts
  StarterPlayerScripts/
    Client.client.luau   ← LocalScript or Script(RunContext=Client)

LOCATION TABLE:
  Workspace              → server scripts for objects (legacy RunContext)
  ReplicatedFirst        → minimum scripts for loading screen (client)
  ReplicatedStorage      → shared ModuleScripts; Scripts(Client) ok
  ServerScriptService    → server Scripts and server ModuleScripts
  ServerStorage          → server-side objects, server ModuleScripts only
  StarterPlayer/StarterCharacterScripts → LocalScripts, run on char spawn
  StarterPlayer/StarterPlayerScripts    → LocalScripts, run on player join
  StarterGui             → LocalScripts for UI
  StarterPack            → LocalScripts for Tools

KEY GOTCHA: ReplicatedStorage scripts run on BOTH server and client if you
don't use RunContext. Use WaitForChild() in client scripts for safety.

--- MODULE SCRIPTS PATTERNS ---

Basic module:
  -- ModuleScript in ReplicatedStorage
  local M = {}
  M.SPEED = 16
  function M.greet(name) return "Hi " .. name end
  return M

Requiring:
  local M = require(game:GetService("ReplicatedStorage"):WaitForChild("M"))
  M.greet("Vyren")

Always use WaitForChild() in LocalScripts — order of replication isn't guaranteed.
require() runs module once, caches result. Modifying returned table affects all requirers.

Data sharing pattern:
  local Config = {}
  Config.MagSize = 20
  Config.Damage = { Head = 50, Torso = 40, Body = 25 }
  return Config

Encapsulation pattern (network manager):
  local Net = {}
  local re = game:GetService("ReplicatedStorage"):WaitForChild("RemoteEvent")
  function Net.fire(id, ...) re:FireServer(id, ...) end
  return Net

--- EVENTS ---
Connect:
  local conn = part.Touched:Connect(function(hit)
    print("Touched by", hit.Name)
  end)

Disconnect:
  conn:Disconnect()

One-time connection:
  part.Touched:Once(function(hit) print("First touch:", hit.Name) end)

Wait for event:
  local hit = part.Touched:Wait()  -- yields until fires, returns args

Common built-in events:
  game.Players.PlayerAdded:Connect(function(player) end)
  game.Players.PlayerRemoving:Connect(function(player) end)
  player.CharacterAdded:Connect(function(char) end)
  player.CharacterRemoving:Connect(function(char) end)
  part.Touched:Connect(function(otherPart) end)
  part.TouchEnded:Connect(function(otherPart) end)
  humanoid.Died:Connect(function() end)
  humanoid.HealthChanged:Connect(function(health) end)

RunService events (frame loops):
  game:GetService("RunService").Heartbeat:Connect(function(dt) end)
  game:GetService("RunService").Stepped:Connect(function(t, dt) end)
  game:GetService("RunService").RenderStepped:Connect(function(dt) end)  -- client only

Deferred events: new default behavior defers handler execution to
next resumption point. Use :ConnectParallel() for parallel lua.

--- KEY SERVICES ---
  game:GetService("Players")           -- player management
  game:GetService("RunService")        -- frame events, IsServer/IsClient
  game:GetService("ReplicatedStorage") -- shared storage
  game:GetService("ServerScriptService")
  game:GetService("ServerStorage")
  game:GetService("Workspace")         -- 3D world (also: workspace global)
  game:GetService("Lighting")          -- lighting/atmosphere
  game:GetService("SoundService")
  game:GetService("TweenService")
  game:GetService("UserInputService")  -- input (client)
  game:GetService("DataStoreService")  -- persistence (server)
  game:GetService("HttpService")       -- HTTP, JSON encode/decode
  game:GetService("CollectionService") -- tag system
  game:GetService("PhysicsService")    -- collision groups
  game:GetService("MarketplaceService")-- purchases

Useful globals:
  game  (= DataModel)
  workspace  (shortcut for game.Workspace)
  script  (the script itself)
  print(...), warn(...), error(msg, level)
  typeof(v)  -- returns Roblox type names (e.g. "Instance", "Vector3")
  type(v)    -- returns Lua type names
  tostring(v), tonumber(v)
  math.huge, math.pi, math.abs, math.floor, math.ceil, math.max, math.min
  math.random(min, max)
  string.format, string.find, string.gsub, string.sub, string.upper, string.lower
  table.insert, table.remove, table.sort, table.find, table.concat, table.unpack
  os.time(), os.clock()
  tick()  -- (deprecated, prefer os.clock())

Instance API:
  Instance.new("PartName", parent)
  inst:Clone()
  inst:Destroy()
  inst.Parent = someParent
  inst:FindFirstChild("Name", recursive?)
  inst:WaitForChild("Name", timeout?)
  inst:GetChildren()
  inst:GetDescendants()
  inst:IsA("ClassName")
  inst:GetFullName()
  inst.Changed:Connect(function(prop) end)
  inst:GetPropertyChangedSignal("PropName"):Connect(fn)
`;
