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

--- TABLE LIBRARY — FULL REFERENCE ---

table.freeze(t)              -- makes table read-only (errors on write). Returns t.
table.clone(t)               -- shallow copy. Does NOT copy nested tables.
table.find(t, val, init?)    -- returns index of val in array, or nil
table.create(n, val?)        -- creates array of n elements, optionally filled with val
table.move(a1, f, e, t, a2?) -- moves elements a1[f..e] into a2 starting at t

Examples:
  -- freeze (read-only config)
  local Config = table.freeze({ MAX_PLAYERS = 10, MAP = "City" })
  -- Config.MAX_PLAYERS = 5  --> ERROR: attempt to modify read-only table

  -- clone before modifying shared data
  local base = { hp = 100, speed = 16 }
  local hero = table.clone(base)
  hero.speed = 20  -- doesn't affect base

  -- find in array
  local fruits = {"apple", "banana", "cherry"}
  local idx = table.find(fruits, "banana")  --> 2

  -- create pre-allocated array
  local slots = table.create(50, false)  -- 50 booleans all false

  -- move: copy array slice
  local src = {1,2,3,4,5}
  local dst = {10,20,30}
  table.move(src, 2, 4, 2, dst)  -- dst becomes {10,2,3,4}

RULE: Use table.freeze() on all config/constant modules returned by require().
RULE: Use table.clone() instead of looping to copy arrays.
RULE: Use table.find() instead of manual search loops.

--- STRING LIBRARY — PATTERNS ---

string.split(s, sep)         -- Roblox extension, splits into array
string.format(fmt, ...)      -- C-style formatting
string.match(s, pattern)     -- returns captures, or nil
string.gmatch(s, pattern)    -- iterator over all matches
string.gsub(s, pattern, rep) -- global substitute, returns new string + count
string.sub(s, i, j?)         -- substring
string.find(s, pattern, init?, plain?) -- returns start, end positions
string.byte(s, i?)           -- char code
string.char(...)             -- chars from codes
string.rep(s, n, sep?)       -- repeat string
string.reverse(s)            -- reverse
string.upper(s), string.lower(s)
string.len(s)                -- same as #s

string.format patterns:
  %d  integer        %i  integer
  %f  float          %.2f  float 2 decimals
  %s  string         %q  quoted string (safe for Luau)
  %x  hex lowercase  %X  hex uppercase
  %05d  zero-padded  %-10s  left-aligned

Examples:
  -- split CSV
  local parts = string.split("a,b,c", ",")  --> {"a","b","c"}

  -- format money display
  local coins = 12345
  local display = string.format("$%d", coins)  --> "$12345"
  local precise = string.format("%.2f", 3.14159)  --> "3.14"

  -- match: extract number from string
  local s = "Score: 450 pts"
  local n = string.match(s, "%d+")  --> "450" (string, use tonumber())

  -- gmatch: iterate words
  for word in string.gmatch("hello world foo", "%S+") do
    print(word)  -- "hello", "world", "foo"
  end

  -- gsub: sanitize chat
  local clean = string.gsub(input, "[<>]", "")

Lua patterns (NOT regex):
  %a  letter    %d  digit    %s  whitespace
  %l  lowercase %u  uppercase %p  punctuation
  %w  alphanumeric %c  control
  .   any char  *  0+  +  1+  ?  0 or 1  -  0+ lazy
  ^   anchor start  $  anchor end
  [set]  character class  [^set]  negated

--- MEMORY LEAK AVOIDANCE ---

RULE: Every :Connect() must be stored and :Disconnect()ed when done.
RULE: Never create connections inside loops without tracking them.
RULE: Use :Once() for one-shot connections — auto-disconnects.
RULE: Use Debris service for auto-cleanup instead of manual Destroy().

Pattern — tracked connections:
  local connections: {RBXScriptConnection} = {}

  connections[#connections+1] = part.Touched:Connect(function(hit)
    -- handler
  end)

  -- cleanup on player leave or object destroy
  local function cleanup()
    for _, conn in connections do
      conn:Disconnect()
    end
    table.clear(connections)
  end

Pattern — maid / janitor (common community pattern):
  local Maid = {}
  Maid.__index = Maid

  function Maid.new()
    return setmetatable({ _tasks = {} }, Maid)
  end

  function Maid:Add(conn)
    self._tasks[#self._tasks + 1] = conn
    return conn
  end

  function Maid:Destroy()
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

Pattern — Debris service:
  local Debris = game:GetService("Debris")
  local effect = Instance.new("Part")
  effect.Parent = workspace
  Debris:AddItem(effect, 5)  -- auto-destroyed after 5 seconds. No need to track.

Pattern — table cleanup:
  -- DON'T: let tables grow forever
  -- DO: clear when no longer needed
  table.clear(myTable)  -- removes all entries, reuses memory

  -- DON'T: store player data after they leave
  game.Players.PlayerRemoving:Connect(function(player)
    playerData[player.UserId] = nil  -- explicit nil, GC can collect
  end)

Common memory leak sources:
  1. Connections not disconnected when character/player leaves
  2. Tables holding Instance refs that were Destroy()ed
  3. RunService.Heartbeat connected for one-shot logic (use task.delay instead)
  4. Humanoid.Died connection left live after character respawn
  5. GUI event connections not cleaned when Frame is destroyed

--- PERFORMANCE TIPS ---

1. Cache locals — globals/service calls are slow:
  -- BAD: repeated global lookup every frame
  game:GetService("RunService").Heartbeat:Connect(function()
    local pos = game.Workspace.Player.HumanoidRootPart.Position  -- 4 global lookups
  end)

  -- GOOD: cache at top of script
  local RunService = game:GetService("RunService")
  local Workspace = game:GetService("Workspace")
  local hrp = character:WaitForChild("HumanoidRootPart")
  RunService.Heartbeat:Connect(function()
    local pos = hrp.Position  -- 1 local lookup
  end)

2. Avoid #table in hot loops (recomputes each call):
  local n = #myTable
  for i = 1, n do ... end

3. Use type hints + --!strict for JIT optimization:
  --!strict
  --!optimize 2     -- enables Luau optimizer (max = 2). Reduces overhead.

4. Prefer local functions over closures in tight loops:
  local function processItem(item) ... end  -- defined once
  for _, v in items do processItem(v) end   -- no closure allocation

5. Avoid string concatenation in loops — use table.concat:
  -- BAD
  local result = ""
  for _, s in parts do result = result .. s end  -- creates N intermediate strings

  -- GOOD
  local buf = {}
  for i, s in parts do buf[i] = s end
  local result = table.concat(buf)

6. dupclosure — Luau optimization for repeated closures:
  -- Luau automatically shares closures that don't capture unique upvalues.
  -- You benefit automatically with --!optimize 2.
  -- Avoid creating new functions inside loops unnecessarily.

7. Batch Instance property writes:
  -- BAD: triggers 3 separate render updates
  part.Size = Vector3.new(4,4,4)
  part.CFrame = CFrame.new(0,5,0)
  part.Color = Color3.new(1,0,0)

  -- GOOD: use BulkMoveTo or set all at once via a single parent assignment
  -- Or, set properties before parenting to workspace

8. Use workspace:BulkMoveTo() for moving many parts:
  local parts = { part1, part2, part3 }
  local cframes = { cf1, cf2, cf3 }
  workspace:BulkMoveTo(parts, cframes, Enum.BulkMoveMode.FireAllEvents)

9. Reduce part count — use Unions, MeshParts, and special shapes over many BaseParts.

10. Profile with microprofiler: Ctrl+F6 in Studio. Look for long Heartbeat spikes.

--- ADVANCED METATABLES ---

__newindex — intercept writes:
  local proxy = {}
  local data = {}
  setmetatable(proxy, {
    __newindex = function(t, k, v)
      print("Setting", k, "=", v)
      data[k] = v  -- write to shadow table
    end,
    __index = data,  -- reads come from data
  })
  proxy.x = 10  --> prints "Setting x = 10"
  print(proxy.x)  --> 10

__tostring — custom string conversion:
  local Vec2 = {}
  Vec2.__index = Vec2
  Vec2.__tostring = function(self)
    return string.format("Vec2(%g, %g)", self.x, self.y)
  end
  function Vec2.new(x, y)
    return setmetatable({ x = x, y = y }, Vec2)
  end
  local v = Vec2.new(3, 4)
  print(tostring(v))  --> "Vec2(3, 4)"

__len — custom # operator:
  local Bag = {}
  Bag.__index = Bag
  Bag.__len = function(self) return self._size end
  function Bag.new() return setmetatable({ _size = 0, _items = {} }, Bag) end
  function Bag:add(item) self._size += 1; self._items[self._size] = item end
  local b = Bag.new(); b:add("apple")
  print(#b)  --> 1

Proxy table — read-only enforcement:
  local function readOnly(t)
    return setmetatable({}, {
      __index = t,
      __newindex = function(_, k, _)
        error("Attempt to modify read-only table key: " .. tostring(k), 2)
      end,
      __len = function() return #t end,
    })
  end
  local CONSTANTS = readOnly({ GRAVITY = -196.2, MAX_SPEED = 50 })
  -- CONSTANTS.GRAVITY = 0  --> ERROR

Full metamethod list:
  __index(t, k)         -- read missing key (table or function)
  __newindex(t, k, v)   -- write missing key
  __add(a, b)           -- a + b
  __sub(a, b)           -- a - b
  __mul(a, b)           -- a * b
  __div(a, b)           -- a / b
  __mod(a, b)           -- a % b
  __pow(a, b)           -- a ^ b
  __unm(a)              -- -a
  __idiv(a, b)          -- a // b (floor div)
  __band, __bor, __bxor, __bnot, __shl, __shr  -- bitwise (Luau)
  __concat(a, b)        -- a .. b
  __len(t)              -- #t
  __eq(a, b)            -- a == b
  __lt(a, b)            -- a < b
  __le(a, b)            -- a <= b
  __call(t, ...)        -- t(...)
  __tostring(t)         -- tostring(t)

--- MODULE SCRIPT CIRCULAR DEPENDENCY AVOIDANCE ---

PROBLEM: Module A requires Module B which requires Module A → infinite loop / error.

WRONG:
  -- ModuleA.lua
  local B = require(script.Parent.ModuleB)  -- B requires A → deadlock

SOLUTIONS:

1. Lazy require (require inside function, not at top level):
  -- ModuleA.lua
  local A = {}
  function A.doThing()
    local B = require(script.Parent.ModuleB)  -- only loads when called
    B.helper()
  end
  return A

2. Extract shared state into a third module (preferred):
  -- SharedState.lua (no dependencies)
  return { players = {}, score = 0 }

  -- ModuleA.lua
  local State = require(SharedState)  -- no circular dep

  -- ModuleB.lua
  local State = require(SharedState)  -- same

3. Dependency injection — pass dependencies as function args:
  -- ModuleA.lua
  local A = {}
  function A.init(moduleB)
    A._b = moduleB
  end
  return A

  -- Main script
  local A = require(ModuleA)
  local B = require(ModuleB)
  A.init(B)

4. Event-based decoupling — modules communicate via BindableEvents instead of direct require.

RULE: If two modules need each other, extract their shared data/logic into a third module.
RULE: Never require() at the top level of two modules that depend on each other.

--- BUFFER TYPE (Luau binary data) ---

buffer is a Luau native type for raw binary data. Faster than strings for binary I/O,
network packets, save data serialization, and large numeric arrays.

Creating buffers:
  local buf = buffer.create(16)      -- 16 bytes, zero-initialized
  local buf2 = buffer.fromstring("hello")  -- from string
  local str = buffer.tostring(buf)   -- back to string

Reading/writing (all offsets are 0-based byte positions):
  buffer.writeu8(buf, offset, value)   -- unsigned 8-bit int
  buffer.writeu16(buf, offset, value)  -- unsigned 16-bit int
  buffer.writeu32(buf, offset, value)  -- unsigned 32-bit int
  buffer.writei8(buf, offset, value)   -- signed 8-bit
  buffer.writei16(buf, offset, value)
  buffer.writei32(buf, offset, value)
  buffer.writef32(buf, offset, value)  -- 32-bit float
  buffer.writef64(buf, offset, value)  -- 64-bit float
  buffer.writestring(buf, offset, str, count?)

  buffer.readu8(buf, offset)    -- read unsigned 8-bit
  buffer.readu16(buf, offset)
  buffer.readu32(buf, offset)
  buffer.readi8(buf, offset)
  buffer.readi16(buf, offset)
  buffer.readi32(buf, offset)
  buffer.readf32(buf, offset)
  buffer.readf64(buf, offset)
  buffer.readstring(buf, offset, count)  -- returns string

  buffer.len(buf)               -- size in bytes
  buffer.copy(dst, dstOffset, src, srcOffset?, count?)  -- copy between buffers
  buffer.fill(buf, offset, value, count?)  -- fill with byte value

Example — compact player save data:
  local function serializePlayer(hp: number, coins: number, level: number): buffer
    local buf = buffer.create(12)  -- 4 bytes each
    buffer.writef32(buf, 0, hp)
    buffer.writeu32(buf, 4, coins)
    buffer.writeu8(buf, 8, level)
    return buf
  end

  local function deserializePlayer(buf: buffer)
    return {
      hp = buffer.readf32(buf, 0),
      coins = buffer.readu32(buf, 4),
      level = buffer.readu8(buf, 8),
    }
  end

Use buffers when:
  - Sending binary data over RemoteEvents (more efficient than tables)
  - Serializing/deserializing DataStore save data
  - Working with large numeric arrays where table overhead is too high
  - Implementing custom binary protocols

typeof(buffer.create(1)) --> "buffer"

--- TYPEOF() VS TYPE() ---

type(v)    -- Lua standard: returns "nil","boolean","number","string","table","function","thread","userdata"
typeof(v)  -- Roblox extension: returns Roblox-specific type names

typeof() returns where type() returns "userdata" or "table":
  typeof(Vector3.new())     --> "Vector3"       (type() → "userdata")
  typeof(CFrame.new())      --> "CFrame"        (type() → "userdata")
  typeof(Color3.new())      --> "Color3"        (type() → "userdata")
  typeof(Instance.new("Part")) --> "Instance"   (type() → "userdata")
  typeof(Enum.Material.Concrete) --> "EnumItem" (type() → "userdata")
  typeof(workspace)         --> "Instance"
  typeof(buffer.create(1))  --> "buffer"        (type() → "buffer" in Luau)
  typeof(coroutine.create(function()end)) --> "thread"

For Roblox types, ALWAYS use typeof(), never type():
  -- BAD: always returns "userdata" for Roblox types
  if type(v) == "Vector3" then ... end  -- NEVER true

  -- GOOD
  if typeof(v) == "Vector3" then ... end

  -- checking for Instance subclass: use :IsA()
  if typeof(v) == "Instance" and v:IsA("BasePart") then ... end

Quick reference:
  Value                   type()       typeof()
  nil                     "nil"        "nil"
  true/false              "boolean"    "boolean"
  42                      "number"     "number"
  "hello"                 "string"     "string"
  {}                      "table"      "table"
  function()end           "function"   "function"
  coroutine               "thread"     "thread"
  Vector3.new()           "userdata"   "Vector3"
  CFrame.new()            "userdata"   "CFrame"
  Instance.new("Part")    "userdata"   "Instance"
  Enum.Material.Concrete  "userdata"   "EnumItem"
  buffer.create(4)        "buffer"     "buffer"

--- INSTANCE ATTRIBUTES ---

Attributes store arbitrary values ON instances — like custom properties.
They replicate to all clients automatically (server-set). Types supported:
  string, boolean, number, UDim, UDim2, BrickColor, Color3, Vector2,
  Vector3, CFrame, NumberRange, Rect, Font

Set/Get:
  part:SetAttribute("Health", 100)
  part:SetAttribute("Tag", "Enemy")
  part:SetAttribute("Alive", true)

  local hp = part:GetAttribute("Health")      -- returns value or nil
  local all = part:GetAttributes()            -- returns {[name]: value} table

Delete:
  part:SetAttribute("Health", nil)            -- set to nil to remove

Change signal:
  part:GetAttributeChangedSignal("Health"):Connect(function()
    local newHp = part:GetAttribute("Health")
    print("Health changed to", newHp)
  end)

  -- Changed fires for ANY attribute change:
  part.AttributeChanged:Connect(function(attrName)
    print(attrName, "changed to", part:GetAttribute(attrName))
  end)

Common patterns:

Pattern — server sets, client reads:
  -- Server
  part:SetAttribute("OwnerId", player.UserId)
  part:SetAttribute("Damage", 25)

  -- Client (LocalScript)
  local dmg = part:GetAttribute("Damage")

Pattern — attribute-driven config (no extra ModuleScripts needed):
  -- Place attributes on a config Part in workspace
  -- Any script can read them without require()
  local ConfigPart = workspace:WaitForChild("Config")
  local difficulty = ConfigPart:GetAttribute("Difficulty") or "Normal"

Pattern — tagging with attributes vs CollectionService:
  -- Use CollectionService tags for TYPE (what something IS)
  -- Use attributes for STATE (what something HAS/IS DOING)
  CollectionService:AddTag(part, "Hazard")      -- it IS a hazard
  part:SetAttribute("Damage", 50)               -- it does 50 damage

GOTCHA: Attributes are NOT the same as instance properties. They don't appear
in the Properties panel by default — enable "Show Instance Attributes" in Studio.

--- TASK.SPAWN vs COROUTINE.WRAP vs TASK.DEFER ---

All three run code concurrently, but behave differently:

task.spawn(fn, ...)
  - Runs fn immediately on the NEXT RESUMPTION POINT in the same step
  - No overhead from coroutine management — preferred for fire-and-forget
  - Errors are caught and printed (won't crash calling code)
  - Returns the thread
  - USE WHEN: you want to run something "now but not blocking"

  task.spawn(function()
    task.wait(1)
    print("done after 1s")
  end)
  print("this prints first")  --> "this prints first", then "done after 1s"

task.defer(fn, ...)
  - Runs fn at the END of the current resumption step (after current code finishes)
  - Useful when you need to wait for all current synchronous code to complete
  - Lower priority than task.spawn
  - USE WHEN: you want to run something after the current frame/event handler finishes

  task.defer(function()
    print("deferred")
  end)
  print("immediate")  -- "immediate" first, then "deferred"

coroutine.wrap(fn) / coroutine.create(fn)
  - Lower-level manual control — you manage resume/yield yourself
  - coroutine.wrap returns a function; each call resumes the coroutine
  - coroutine.create returns thread; use coroutine.resume() manually
  - Errors propagate differently (coroutine.resume returns false + error)
  - USE WHEN: you need a generator pattern, or manual step-by-step control

  local gen = coroutine.wrap(function()
    for i = 1, 3 do coroutine.yield(i) end
  end)
  print(gen())  --> 1
  print(gen())  --> 2
  print(gen())  --> 3

task.delay(t, fn, ...)
  - Schedules fn to run after t seconds
  - Returns thread (can be cancelled with task.cancel())
  - USE WHEN: you want a delayed one-shot action without a loop

  local thread = task.delay(5, function()
    print("5 seconds later")
  end)
  -- task.cancel(thread)  -- cancel if needed before it fires

Decision table:
  Need                                              Use
  -------------------------------------------------------
  Fire-and-forget, runs soon                        task.spawn
  Run after current event handler finishes          task.defer
  Run after N seconds                               task.delay
  Generator / step-by-step iteration                coroutine.wrap
  Manual coroutine control with error handling      coroutine.create + coroutine.resume
  Cancel a scheduled task                           task.delay → task.cancel(thread)

NEVER use:
  spawn()    -- deprecated, inconsistent timing
  wait()     -- deprecated, use task.wait()
  delay()    -- deprecated, use task.delay()
  coroutine.yield(n)  -- don't yield with a time; use task.wait(n) in a task.spawn
`;
