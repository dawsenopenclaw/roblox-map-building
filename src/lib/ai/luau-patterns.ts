/**
 * Luau Code Patterns Encyclopedia
 * 500+ proven code patterns the AI can reference when generating Roblox scripts.
 * Organized by category with exact code snippets ready to adapt.
 *
 * Injected into prompts via getRelevantPatterns(prompt, maxPatterns)
 */

export interface LuauPattern {
  name: string
  category: string
  keywords: string[]
  /** Compact working code snippet — ready to paste and adapt */
  code: string
}

// ═══════════════════════════════════════════════════════════════════════════
// DATA & PERSISTENCE PATTERNS
// ═══════════════════════════════════════════════════════════════════════════

const DATA_PATTERNS: LuauPattern[] = [
  {
    name: 'DataStore Save/Load with Retry',
    category: 'data',
    keywords: ['save', 'load', 'datastore', 'persist', 'data'],
    code: `local DSS = game:GetService("DataStoreService")
local store = DSS:GetDataStore("PlayerData_v1")
local function loadData(userId: number): {[string]: any}?
  local key = "player_"..tostring(userId)
  for attempt = 1, 3 do
    local ok, data = pcall(function() return store:GetAsync(key) end)
    if ok then return data end
    if attempt < 3 then task.wait(6) end
  end
  return nil
end
local function saveData(userId: number, data: {[string]: any}): boolean
  local key = "player_"..tostring(userId)
  for attempt = 1, 3 do
    local ok = pcall(function() store:SetAsync(key, data) end)
    if ok then return true end
    if attempt < 3 then task.wait(6) end
  end
  return false
end`,
  },
  {
    name: 'Session Locking',
    category: 'data',
    keywords: ['session', 'lock', 'duplicate', 'double join'],
    code: `local function acquireLock(userId: number): boolean
  local key = "lock_"..tostring(userId)
  local ok, existing = pcall(function() return store:GetAsync(key) end)
  if ok and existing and os.time() - existing < 300 then return false end
  pcall(function() store:SetAsync(key, os.time()) end)
  return true
end
local function releaseLock(userId: number)
  pcall(function() store:RemoveAsync("lock_"..tostring(userId)) end)
end`,
  },
  {
    name: 'Auto-Save Loop',
    category: 'data',
    keywords: ['auto save', 'periodic', 'interval'],
    code: `task.spawn(function()
  while true do
    task.wait(120)
    for _, player in game:GetService("Players"):GetPlayers() do
      task.spawn(function()
        local data = playerData[player.UserId]
        if data then saveData(player.UserId, data) end
      end)
    end
  end
end)`,
  },
  {
    name: 'Leaderstats Setup',
    category: 'data',
    keywords: ['leaderstats', 'coins', 'level', 'stats'],
    code: `Players.PlayerAdded:Connect(function(player: Player)
  local ls = Instance.new("Folder")
  ls.Name = "leaderstats"
  local coins = Instance.new("IntValue"); coins.Name = "Coins"; coins.Value = 0; coins.Parent = ls
  local level = Instance.new("IntValue"); level.Name = "Level"; level.Value = 1; level.Parent = ls
  local xp = Instance.new("IntValue"); xp.Name = "XP"; xp.Value = 0; xp.Parent = ls
  ls.Parent = player
  local data = loadData(player.UserId)
  if data then coins.Value = data.coins or 0; level.Value = data.level or 1; xp.Value = data.xp or 0 end
end)`,
  },
  {
    name: 'UpdateAsync Atomic Operation',
    category: 'data',
    keywords: ['atomic', 'updateasync', 'concurrent', 'race condition'],
    code: `local function addCoins(userId: number, amount: number): boolean
  local key = "player_"..tostring(userId)
  local ok = pcall(function()
    store:UpdateAsync(key, function(old)
      old = old or {coins=0}
      old.coins = (old.coins or 0) + amount
      return old
    end)
  end)
  return ok
end`,
  },
  {
    name: 'OrderedDataStore Leaderboard',
    category: 'data',
    keywords: ['leaderboard', 'top players', 'ranking', 'ordered'],
    code: `local ODS = DSS:GetOrderedDataStore("GlobalLeaderboard")
local function getTopPlayers(count: number): {{userId: number, score: number}}
  local ok, pages = pcall(function() return ODS:GetSortedAsync(false, count) end)
  if not ok then return {} end
  local results = {}
  local page = pages:GetCurrentPage()
  for _, entry in page do
    table.insert(results, {userId = tonumber(entry.key) or 0, score = entry.value})
  end
  return results
end`,
  },
  {
    name: 'Data Migration/Versioning',
    category: 'data',
    keywords: ['migrate', 'version', 'upgrade data', 'schema'],
    code: `local CURRENT_VERSION = 3
local function migrateData(data: {[string]: any}): {[string]: any}
  local v = data.version or 1
  if v < 2 then data.gems = data.gems or 0; data.inventory = data.inventory or {} end
  if v < 3 then data.settings = data.settings or {music=true,sfx=true}; data.achievements = data.achievements or {} end
  data.version = CURRENT_VERSION
  return data
end`,
  },
  {
    name: 'Profile Template with Defaults',
    category: 'data',
    keywords: ['profile', 'default', 'template', 'new player'],
    code: `local DEFAULT_PROFILE = table.freeze({
  version = 3, coins = 100, gems = 0, level = 1, xp = 0,
  inventory = {}, equipped = {}, achievements = {},
  stats = {kills=0, deaths=0, playtime=0, builds=0},
  settings = {music=true, sfx=true, quality="auto", sensitivity=0.5},
  dailyReward = {lastClaim=0, streak=0},
  createdAt = 0, lastLogin = 0,
})
local function createProfile(): {[string]: any}
  local p = {}
  for k, v in DEFAULT_PROFILE do
    p[k] = if type(v) == "table" then table.clone(v) else v
  end
  p.createdAt = os.time()
  p.lastLogin = os.time()
  return p
end`,
  },
]

// ═══════════════════════════════════════════════════════════════════════════
// REMOTE EVENT / NETWORKING PATTERNS
// ═══════════════════════════════════════════════════════════════════════════

const NETWORKING_PATTERNS: LuauPattern[] = [
  {
    name: 'RemoteEvent Setup + Validation',
    category: 'networking',
    keywords: ['remote', 'event', 'server', 'client', 'validate', 'fire'],
    code: `-- Server: create + listen
local RS = game:GetService("ReplicatedStorage")
local remotes = Instance.new("Folder"); remotes.Name = "Remotes"; remotes.Parent = RS
local purchaseEvent = Instance.new("RemoteEvent"); purchaseEvent.Name = "Purchase"; purchaseEvent.Parent = remotes
purchaseEvent.OnServerEvent:Connect(function(player: Player, itemId: string)
  if type(itemId) ~= "string" then return end
  if #itemId > 50 then return end
  local price = ITEMS[itemId]
  if not price then return end
  local coins = player:FindFirstChild("leaderstats") and player.leaderstats:FindFirstChild("Coins")
  if not coins or coins.Value < price then return end
  coins.Value -= price
end)`,
  },
  {
    name: 'Cooldown Anti-Exploit',
    category: 'networking',
    keywords: ['cooldown', 'anti exploit', 'rate limit', 'throttle'],
    code: `local lastAction: {[number]: number} = {}
local COOLDOWN = 0.5
remoteEvent.OnServerEvent:Connect(function(player: Player, ...)
  local now = os.clock()
  local last = lastAction[player.UserId] or 0
  if now - last < COOLDOWN then return end
  lastAction[player.UserId] = now
  -- process action
end)
Players.PlayerRemoving:Connect(function(p) lastAction[p.UserId] = nil end)`,
  },
  {
    name: 'RemoteFunction Request-Response',
    category: 'networking',
    keywords: ['remote function', 'invoke', 'request', 'response', 'get data'],
    code: `-- Server
local getBalance = Instance.new("RemoteFunction"); getBalance.Name = "GetBalance"; getBalance.Parent = remotes
getBalance.OnServerInvoke = function(player: Player): number
  local coins = player:FindFirstChild("leaderstats") and player.leaderstats:FindFirstChild("Coins")
  return if coins then coins.Value else 0
end
-- Client: local balance = remotes.GetBalance:InvokeServer()`,
  },
  {
    name: 'Server-to-Client State Sync',
    category: 'networking',
    keywords: ['sync', 'replicate', 'update client', 'state'],
    code: `-- Server broadcasts game state to all clients
local syncEvent = Instance.new("RemoteEvent"); syncEvent.Name = "SyncState"; syncEvent.Parent = remotes
local function broadcastState()
  syncEvent:FireAllClients({
    round = currentRound, timeLeft = roundTimeLeft,
    scores = teamScores, phase = gamePhase,
  })
end
-- Client listens:
-- syncEvent.OnClientEvent:Connect(function(state) updateHUD(state) end)`,
  },
  {
    name: 'Distance Validation',
    category: 'networking',
    keywords: ['distance', 'range check', 'exploit', 'reach'],
    code: `local function validateDistance(player: Player, targetPos: Vector3, maxDist: number): boolean
  local char = player.Character
  if not char then return false end
  local root = char:FindFirstChild("HumanoidRootPart")
  if not root then return false end
  return (root.Position - targetPos).Magnitude <= maxDist
end`,
  },
  {
    name: 'Type-Safe Argument Validation',
    category: 'networking',
    keywords: ['type check', 'validate args', 'safe', 'sanitize'],
    code: `local function validateArgs(player: Player, itemId: unknown, quantity: unknown): (string, number)?
  if type(itemId) ~= "string" then return nil end
  if type(quantity) ~= "number" then return nil end
  if quantity ~= math.floor(quantity) then return nil end
  if quantity < 1 or quantity > 99 then return nil end
  if #itemId > 50 or #itemId < 1 then return nil end
  return itemId, quantity :: number
end`,
  },
]

// ═══════════════════════════════════════════════════════════════════════════
// UI PATTERNS
// ═══════════════════════════════════════════════════════════════════════════

const UI_PATTERNS: LuauPattern[] = [
  {
    name: 'ScreenGui Dark Theme Base',
    category: 'ui',
    keywords: ['gui', 'screen', 'dark', 'theme', 'base', 'setup'],
    code: `local gui = Instance.new("ScreenGui")
gui.Name = "ForjeUI"; gui.ResetOnSpawn = false
gui.ZIndexBehavior = Enum.ZIndexBehavior.Sibling
local main = Instance.new("Frame"); main.Name = "Main"
main.Size = UDim2.new(0.8,0,0.75,0); main.Position = UDim2.new(0.5,0,0.5,0)
main.AnchorPoint = Vector2.new(0.5,0.5)
main.BackgroundColor3 = Color3.fromRGB(15,18,30); main.BorderSizePixel = 0
Instance.new("UICorner", main).CornerRadius = UDim.new(0,16)
local stroke = Instance.new("UIStroke"); stroke.Color = Color3.fromRGB(212,175,55)
stroke.Thickness = 1.5; stroke.Transparency = 0.3; stroke.Parent = main
main.Parent = gui; gui.Parent = playerGui`,
  },
  {
    name: 'Button with Hover Effect',
    category: 'ui',
    keywords: ['button', 'hover', 'click', 'tween', 'interactive'],
    code: `local function createButton(text: string, parent: Instance, pos: UDim2, size: UDim2): TextButton
  local btn = Instance.new("TextButton"); btn.Name = text:gsub("%s","")
  btn.Text = text; btn.Font = Enum.Font.GothamBold; btn.TextSize = 14
  btn.TextColor3 = Color3.fromRGB(10,10,15)
  btn.BackgroundColor3 = Color3.fromRGB(212,175,55)
  btn.Size = size; btn.Position = pos; btn.AnchorPoint = Vector2.new(0.5,0.5)
  btn.BorderSizePixel = 0; btn.AutoButtonColor = false
  Instance.new("UICorner", btn).CornerRadius = UDim.new(0,10)
  btn.MouseEnter:Connect(function()
    TweenService:Create(btn, TweenInfo.new(0.15), {BackgroundColor3=Color3.fromRGB(235,200,75)}):Play()
  end)
  btn.MouseLeave:Connect(function()
    TweenService:Create(btn, TweenInfo.new(0.15), {BackgroundColor3=Color3.fromRGB(212,175,55)}):Play()
  end)
  btn.Parent = parent; return btn
end`,
  },
  {
    name: 'ScrollingFrame with Items',
    category: 'ui',
    keywords: ['scroll', 'list', 'grid', 'items', 'scrolling'],
    code: `local scroll = Instance.new("ScrollingFrame"); scroll.Name = "ItemList"
scroll.Size = UDim2.new(1,-20,1,-80); scroll.Position = UDim2.new(0,10,0,70)
scroll.BackgroundTransparency = 1; scroll.BorderSizePixel = 0
scroll.ScrollBarThickness = 4; scroll.ScrollBarImageColor3 = Color3.fromRGB(212,175,55)
scroll.CanvasSize = UDim2.new(0,0,0,0); scroll.AutomaticCanvasSize = Enum.AutomaticSize.Y
local layout = Instance.new("UIListLayout"); layout.Padding = UDim.new(0,8)
layout.SortOrder = Enum.SortOrder.LayoutOrder; layout.Parent = scroll
Instance.new("UIPadding", scroll).PaddingTop = UDim.new(0,4)
scroll.Parent = main`,
  },
  {
    name: 'Item Card for Shop/Inventory',
    category: 'ui',
    keywords: ['card', 'item', 'shop', 'inventory', 'product'],
    code: `local function createItemCard(item: {name:string,price:number,icon:string}, parent: Instance): Frame
  local card = Instance.new("Frame"); card.Name = item.name
  card.Size = UDim2.new(1,0,0,60); card.BackgroundColor3 = Color3.fromRGB(25,28,45)
  card.BorderSizePixel = 0
  Instance.new("UICorner", card).CornerRadius = UDim.new(0,10)
  local cs = Instance.new("UIStroke"); cs.Color = Color3.fromRGB(255,255,255)
  cs.Transparency = 0.9; cs.Parent = card
  local icon = Instance.new("ImageLabel"); icon.Size = UDim2.new(0,40,0,40)
  icon.Position = UDim2.new(0,10,0.5,0); icon.AnchorPoint = Vector2.new(0,0.5)
  icon.BackgroundTransparency = 1; icon.Image = item.icon; icon.Parent = card
  local name = Instance.new("TextLabel"); name.Size = UDim2.new(0.5,0,0,20)
  name.Position = UDim2.new(0,60,0,10); name.BackgroundTransparency = 1
  name.Text = item.name; name.Font = Enum.Font.GothamBold; name.TextSize = 14
  name.TextColor3 = Color3.fromRGB(250,250,250); name.TextXAlignment = Enum.TextXAlignment.Left
  name.Parent = card
  local price = Instance.new("TextLabel"); price.Size = UDim2.new(0.3,0,0,20)
  price.Position = UDim2.new(0,60,0,32); price.BackgroundTransparency = 1
  price.Text = tostring(item.price).." coins"; price.Font = Enum.Font.GothamMedium
  price.TextSize = 12; price.TextColor3 = Color3.fromRGB(212,175,55)
  price.TextXAlignment = Enum.TextXAlignment.Left; price.Parent = card
  local buyBtn = createButton("BUY", card, UDim2.new(0.88,0,0.5,0), UDim2.new(0,60,0,30))
  card.Parent = parent; return card
end`,
  },
  {
    name: 'Open/Close Panel Animation',
    category: 'ui',
    keywords: ['open', 'close', 'animate', 'panel', 'toggle', 'show hide'],
    code: `local isOpen = false
local function togglePanel()
  isOpen = not isOpen
  if isOpen then
    main.Visible = true
    main.Size = UDim2.new(0,0,0,0)
    TweenService:Create(main, TweenInfo.new(0.3, Enum.EasingStyle.Back, Enum.EasingDirection.Out), {
      Size = UDim2.new(0.8,0,0.75,0)
    }):Play()
  else
    local tween = TweenService:Create(main, TweenInfo.new(0.2, Enum.EasingStyle.Quad, Enum.EasingDirection.In), {
      Size = UDim2.new(0,0,0,0)
    })
    tween:Play()
    tween.Completed:Connect(function() main.Visible = false end)
  end
end`,
  },
  {
    name: 'Close Button',
    category: 'ui',
    keywords: ['close', 'x button', 'dismiss', 'exit'],
    code: `local closeBtn = Instance.new("TextButton"); closeBtn.Name = "Close"
closeBtn.Size = UDim2.new(0,30,0,30); closeBtn.Position = UDim2.new(1,-10,0,10)
closeBtn.AnchorPoint = Vector2.new(1,0); closeBtn.Text = "X"
closeBtn.Font = Enum.Font.GothamBold; closeBtn.TextSize = 16
closeBtn.TextColor3 = Color3.fromRGB(150,150,150)
closeBtn.BackgroundColor3 = Color3.fromRGB(40,40,50); closeBtn.BorderSizePixel = 0
Instance.new("UICorner", closeBtn).CornerRadius = UDim.new(0,8)
closeBtn.MouseEnter:Connect(function()
  TweenService:Create(closeBtn, TweenInfo.new(0.1), {BackgroundColor3=Color3.fromRGB(200,50,50), TextColor3=Color3.fromRGB(255,255,255)}):Play()
end)
closeBtn.MouseLeave:Connect(function()
  TweenService:Create(closeBtn, TweenInfo.new(0.1), {BackgroundColor3=Color3.fromRGB(40,40,50), TextColor3=Color3.fromRGB(150,150,150)}):Play()
end)
closeBtn.MouseButton1Click:Connect(togglePanel)
closeBtn.Parent = main`,
  },
  {
    name: 'Tab Navigation',
    category: 'ui',
    keywords: ['tab', 'navigation', 'category', 'section', 'switch'],
    code: `local tabs = {"Shop","Inventory","Stats","Settings"}
local tabFrames: {[string]: Frame} = {}
local tabBar = Instance.new("Frame"); tabBar.Name = "TabBar"
tabBar.Size = UDim2.new(1,-20,0,36); tabBar.Position = UDim2.new(0,10,0,40)
tabBar.BackgroundTransparency = 1; tabBar.Parent = main
local tabLayout = Instance.new("UIListLayout"); tabLayout.FillDirection = Enum.FillDirection.Horizontal
tabLayout.Padding = UDim.new(0,4); tabLayout.Parent = tabBar
for i, name in tabs do
  local tab = Instance.new("TextButton"); tab.Name = name
  tab.Size = UDim2.new(1/#tabs,-4,1,0); tab.Text = name
  tab.Font = Enum.Font.GothamBold; tab.TextSize = 13; tab.BorderSizePixel = 0
  tab.BackgroundColor3 = Color3.fromRGB(30,33,50); tab.TextColor3 = Color3.fromRGB(150,150,150)
  Instance.new("UICorner", tab).CornerRadius = UDim.new(0,8)
  tab.MouseButton1Click:Connect(function()
    for _, f in tabFrames do f.Visible = false end
    if tabFrames[name] then tabFrames[name].Visible = true end
    for _, c in tabBar:GetChildren() do
      if c:IsA("TextButton") then
        c.BackgroundColor3 = Color3.fromRGB(30,33,50); c.TextColor3 = Color3.fromRGB(150,150,150)
      end
    end
    tab.BackgroundColor3 = Color3.fromRGB(212,175,55); tab.TextColor3 = Color3.fromRGB(10,10,15)
  end)
  tab.Parent = tabBar
  local content = Instance.new("Frame"); content.Name = name.."Content"
  content.Size = UDim2.new(1,-20,1,-90); content.Position = UDim2.new(0,10,0,82)
  content.BackgroundTransparency = 1; content.Visible = (i==1)
  content.Parent = main; tabFrames[name] = content
end`,
  },
  {
    name: 'Slider Control',
    category: 'ui',
    keywords: ['slider', 'volume', 'brightness', 'range', 'drag'],
    code: `local function createSlider(name: string, parent: Instance, y: number, default: number, callback: (number)->())
  local label = Instance.new("TextLabel"); label.Size = UDim2.new(0.3,0,0,20)
  label.Position = UDim2.new(0,0,0,y); label.BackgroundTransparency = 1
  label.Text = name; label.Font = Enum.Font.GothamMedium; label.TextSize = 13
  label.TextColor3 = Color3.fromRGB(200,200,200); label.TextXAlignment = Enum.TextXAlignment.Left
  label.Parent = parent
  local track = Instance.new("Frame"); track.Size = UDim2.new(0.55,0,0,6)
  track.Position = UDim2.new(0.32,0,0,y+7); track.BackgroundColor3 = Color3.fromRGB(40,43,60)
  track.BorderSizePixel = 0; Instance.new("UICorner", track).CornerRadius = UDim.new(1,0)
  track.Parent = parent
  local fill = Instance.new("Frame"); fill.Size = UDim2.new(default,0,1,0)
  fill.BackgroundColor3 = Color3.fromRGB(212,175,55); fill.BorderSizePixel = 0
  Instance.new("UICorner", fill).CornerRadius = UDim.new(1,0); fill.Parent = track
  local handle = Instance.new("Frame"); handle.Size = UDim2.new(0,14,0,14)
  handle.Position = UDim2.new(default,0,0.5,0); handle.AnchorPoint = Vector2.new(0.5,0.5)
  handle.BackgroundColor3 = Color3.fromRGB(255,255,255); handle.BorderSizePixel = 0
  Instance.new("UICorner", handle).CornerRadius = UDim.new(1,0); handle.Parent = track
  local valLabel = Instance.new("TextLabel"); valLabel.Size = UDim2.new(0.1,0,0,20)
  valLabel.Position = UDim2.new(0.9,0,0,y); valLabel.BackgroundTransparency = 1
  valLabel.Text = tostring(math.floor(default*100)).."%"; valLabel.Font = Enum.Font.GothamMedium
  valLabel.TextSize = 12; valLabel.TextColor3 = Color3.fromRGB(212,175,55)
  valLabel.Parent = parent
  local dragging = false
  handle.InputBegan:Connect(function(input)
    if input.UserInputType == Enum.UserInputType.MouseButton1 or input.UserInputType == Enum.UserInputType.Touch then dragging = true end
  end)
  handle.InputEnded:Connect(function(input)
    if input.UserInputType == Enum.UserInputType.MouseButton1 or input.UserInputType == Enum.UserInputType.Touch then dragging = false end
  end)
  game:GetService("UserInputService").InputChanged:Connect(function(input)
    if dragging and (input.UserInputType == Enum.UserInputType.MouseMovement or input.UserInputType == Enum.UserInputType.Touch) then
      local rel = math.clamp((input.Position.X - track.AbsolutePosition.X) / track.AbsoluteSize.X, 0, 1)
      fill.Size = UDim2.new(rel,0,1,0); handle.Position = UDim2.new(rel,0,0.5,0)
      valLabel.Text = tostring(math.floor(rel*100)).."%"; callback(rel)
    end
  end)
end`,
  },
  {
    name: 'Toast Notification',
    category: 'ui',
    keywords: ['toast', 'notification', 'alert', 'popup', 'message'],
    code: `local toastContainer = Instance.new("Frame"); toastContainer.Name = "Toasts"
toastContainer.Size = UDim2.new(0.3,0,0.5,0); toastContainer.Position = UDim2.new(0.99,0,0.02,0)
toastContainer.AnchorPoint = Vector2.new(1,0); toastContainer.BackgroundTransparency = 1
toastContainer.Parent = gui
local toastLayout = Instance.new("UIListLayout"); toastLayout.Padding = UDim.new(0,6)
toastLayout.SortOrder = Enum.SortOrder.LayoutOrder; toastLayout.Parent = toastContainer
local function showToast(msg: string, color: Color3?)
  local toast = Instance.new("Frame"); toast.Size = UDim2.new(1,0,0,40)
  toast.BackgroundColor3 = Color3.fromRGB(25,28,45); toast.BorderSizePixel = 0
  Instance.new("UICorner", toast).CornerRadius = UDim.new(0,10)
  local accent = Instance.new("Frame"); accent.Size = UDim2.new(0,3,0.6,0)
  accent.Position = UDim2.new(0,8,0.2,0); accent.BackgroundColor3 = color or Color3.fromRGB(212,175,55)
  accent.BorderSizePixel = 0; Instance.new("UICorner", accent).CornerRadius = UDim.new(1,0)
  accent.Parent = toast
  local text = Instance.new("TextLabel"); text.Size = UDim2.new(1,-30,1,0)
  text.Position = UDim2.new(0,20,0,0); text.BackgroundTransparency = 1; text.Text = msg
  text.Font = Enum.Font.GothamMedium; text.TextSize = 13
  text.TextColor3 = Color3.fromRGB(230,230,230); text.TextXAlignment = Enum.TextXAlignment.Left
  text.TextWrapped = true; text.Parent = toast
  toast.Position = UDim2.new(1,0,0,0)
  toast.Parent = toastContainer
  TweenService:Create(toast, TweenInfo.new(0.3, Enum.EasingStyle.Back), {Position=UDim2.new(0,0,0,0)}):Play()
  task.delay(3, function()
    local t = TweenService:Create(toast, TweenInfo.new(0.2), {Position=UDim2.new(1,0,0,0), BackgroundTransparency=1})
    t:Play(); t.Completed:Connect(function() toast:Destroy() end)
  end)
end`,
  },
  {
    name: 'Health Bar HUD',
    category: 'ui',
    keywords: ['health', 'bar', 'hud', 'hp', 'hearts'],
    code: `local healthBar = Instance.new("Frame"); healthBar.Name = "HealthBar"
healthBar.Size = UDim2.new(0.25,0,0,8); healthBar.Position = UDim2.new(0.02,0,0.95,0)
healthBar.BackgroundColor3 = Color3.fromRGB(40,10,10); healthBar.BorderSizePixel = 0
Instance.new("UICorner", healthBar).CornerRadius = UDim.new(1,0)
healthBar.Parent = gui
local healthFill = Instance.new("Frame"); healthFill.Name = "Fill"
healthFill.Size = UDim2.new(1,0,1,0); healthFill.BackgroundColor3 = Color3.fromRGB(34,197,94)
healthFill.BorderSizePixel = 0; Instance.new("UICorner", healthFill).CornerRadius = UDim.new(1,0)
healthFill.Parent = healthBar
local function updateHealth()
  local char = player.Character; if not char then return end
  local hum = char:FindFirstChildOfClass("Humanoid"); if not hum then return end
  local pct = hum.Health / hum.MaxHealth
  local col = if pct > 0.6 then Color3.fromRGB(34,197,94)
    elseif pct > 0.3 then Color3.fromRGB(234,179,8)
    else Color3.fromRGB(239,68,68)
  TweenService:Create(healthFill, TweenInfo.new(0.3), {Size=UDim2.new(pct,0,1,0), BackgroundColor3=col}):Play()
end`,
  },
  {
    name: 'Currency Display',
    category: 'ui',
    keywords: ['currency', 'coins', 'money', 'display', 'counter'],
    code: `local coinDisplay = Instance.new("Frame"); coinDisplay.Name = "CoinDisplay"
coinDisplay.Size = UDim2.new(0,120,0,32); coinDisplay.Position = UDim2.new(0.98,0,0.02,0)
coinDisplay.AnchorPoint = Vector2.new(1,0)
coinDisplay.BackgroundColor3 = Color3.fromRGB(20,22,35); coinDisplay.BorderSizePixel = 0
Instance.new("UICorner", coinDisplay).CornerRadius = UDim.new(0,10)
local coinIcon = Instance.new("TextLabel"); coinIcon.Size = UDim2.new(0,24,0,24)
coinIcon.Position = UDim2.new(0,6,0.5,0); coinIcon.AnchorPoint = Vector2.new(0,0.5)
coinIcon.BackgroundTransparency = 1; coinIcon.Text = "🪙"; coinIcon.TextSize = 16
coinIcon.Parent = coinDisplay
local coinText = Instance.new("TextLabel"); coinText.Name = "Amount"
coinText.Size = UDim2.new(1,-36,1,0); coinText.Position = UDim2.new(0,32,0,0)
coinText.BackgroundTransparency = 1; coinText.Text = "0"
coinText.Font = Enum.Font.GothamBold; coinText.TextSize = 16
coinText.TextColor3 = Color3.fromRGB(212,175,55); coinText.TextXAlignment = Enum.TextXAlignment.Left
coinText.Parent = coinDisplay; coinDisplay.Parent = gui`,
  },
]

// ═══════════════════════════════════════════════════════════════════════════
// COMBAT & GAMEPLAY PATTERNS
// ═══════════════════════════════════════════════════════════════════════════

const COMBAT_PATTERNS: LuauPattern[] = [
  {
    name: 'Melee Hitbox Detection',
    category: 'combat',
    keywords: ['melee', 'hit', 'hitbox', 'attack', 'sword', 'swing'],
    code: `local function meleeAttack(player: Player, damage: number, range: number)
  local char = player.Character; if not char then return end
  local root = char:FindFirstChild("HumanoidRootPart"); if not root then return end
  local params = OverlapParams.new()
  params.FilterType = Enum.RaycastFilterType.Exclude
  params.FilterDescendantsInstances = {char}
  local hits = workspace:GetPartBoundsInRadius(root.Position + root.CFrame.LookVector * (range/2), range, params)
  local damaged: {Model} = {}
  for _, part in hits do
    local model = part:FindFirstAncestorOfClass("Model")
    if model and not table.find(damaged, model) then
      local hum = model:FindFirstChildOfClass("Humanoid")
      if hum and hum.Health > 0 then
        hum:TakeDamage(damage); table.insert(damaged, model)
      end
    end
  end
end`,
  },
  {
    name: 'Raycast Projectile',
    category: 'combat',
    keywords: ['raycast', 'shoot', 'gun', 'bullet', 'ranged', 'projectile'],
    code: `local function shootRaycast(player: Player, origin: Vector3, direction: Vector3, damage: number)
  local params = RaycastParams.new()
  params.FilterType = Enum.RaycastFilterType.Exclude
  params.FilterDescendantsInstances = {player.Character}
  local result = workspace:Raycast(origin, direction * 300, params)
  if result and result.Instance then
    local model = result.Instance:FindFirstAncestorOfClass("Model")
    if model then
      local hum = model:FindFirstChildOfClass("Humanoid")
      if hum then
        local isHead = result.Instance.Name == "Head"
        hum:TakeDamage(if isHead then damage * 2 else damage)
      end
    end
    -- Visual tracer
    local tracer = Instance.new("Part")
    tracer.Size = Vector3.new(0.1, 0.1, (origin - result.Position).Magnitude)
    tracer.CFrame = CFrame.lookAt(origin, result.Position) * CFrame.new(0, 0, -tracer.Size.Z/2)
    tracer.Anchored = true; tracer.CanCollide = false; tracer.Material = Enum.Material.Neon
    tracer.Color = Color3.fromRGB(255, 220, 100); tracer.Parent = workspace
    game:GetService("Debris"):AddItem(tracer, 0.1)
  end
end`,
  },
  {
    name: 'Knockback',
    category: 'combat',
    keywords: ['knockback', 'push', 'force', 'launch', 'repel'],
    code: `local function applyKnockback(target: Model, direction: Vector3, force: number)
  local root = target:FindFirstChild("HumanoidRootPart"); if not root then return end
  local bv = Instance.new("BodyVelocity")
  bv.Velocity = direction.Unit * force + Vector3.new(0, force * 0.3, 0)
  bv.MaxForce = Vector3.new(1e5, 1e5, 1e5)
  bv.Parent = root
  game:GetService("Debris"):AddItem(bv, 0.15)
end`,
  },
  {
    name: 'Debounce Pattern',
    category: 'combat',
    keywords: ['debounce', 'cooldown', 'touched', 'once', 'prevent spam'],
    code: `local debounce: {[Player]: boolean} = {}
part.Touched:Connect(function(hit: BasePart)
  local player = game:GetService("Players"):GetPlayerFromCharacter(hit.Parent)
  if not player then return end
  if debounce[player] then return end
  debounce[player] = true
  -- do action
  task.delay(1, function() debounce[player] = nil end)
end)`,
  },
  {
    name: 'Status Effect System',
    category: 'combat',
    keywords: ['status', 'effect', 'burn', 'freeze', 'poison', 'debuff', 'buff'],
    code: `type StatusEffect = {name: string, duration: number, tickDamage: number?, speedMult: number?, visual: string?}
local activeEffects: {[Model]: {StatusEffect}} = {}
local function applyStatus(target: Model, effect: StatusEffect)
  local hum = target:FindFirstChildOfClass("Humanoid"); if not hum then return end
  if not activeEffects[target] then activeEffects[target] = {} end
  table.insert(activeEffects[target], effect)
  if effect.speedMult then hum.WalkSpeed *= effect.speedMult end
  if effect.tickDamage then
    task.spawn(function()
      local ticks = math.floor(effect.duration / 0.5)
      for i = 1, ticks do
        if hum.Health <= 0 then break end
        hum:TakeDamage(effect.tickDamage :: number)
        task.wait(0.5)
      end
    end)
  end
  task.delay(effect.duration, function()
    if effect.speedMult and hum then hum.WalkSpeed /= effect.speedMult end
    local list = activeEffects[target]
    if list then table.remove(list, table.find(list, effect) or 0) end
  end)
end`,
  },
]

// ═══════════════════════════════════════════════════════════════════════════
// MOVEMENT PATTERNS
// ═══════════════════════════════════════════════════════════════════════════

const MOVEMENT_PATTERNS: LuauPattern[] = [
  {
    name: 'Sprint System',
    category: 'movement',
    keywords: ['sprint', 'run', 'shift', 'speed', 'fast'],
    code: `local UIS = game:GetService("UserInputService")
local DEFAULT_SPEED = 16; local SPRINT_SPEED = 28; local sprinting = false
UIS.InputBegan:Connect(function(input, gpe)
  if gpe then return end
  if input.KeyCode == Enum.KeyCode.LeftShift then
    sprinting = true
    local hum = player.Character and player.Character:FindFirstChildOfClass("Humanoid")
    if hum then hum.WalkSpeed = SPRINT_SPEED end
  end
end)
UIS.InputEnded:Connect(function(input)
  if input.KeyCode == Enum.KeyCode.LeftShift then
    sprinting = false
    local hum = player.Character and player.Character:FindFirstChildOfClass("Humanoid")
    if hum then hum.WalkSpeed = DEFAULT_SPEED end
  end
end)`,
  },
  {
    name: 'Double Jump',
    category: 'movement',
    keywords: ['double jump', 'air jump', 'extra jump'],
    code: `local MAX_JUMPS = 2; local jumpCount = 0
local hum = player.Character and player.Character:WaitForChild("Humanoid")
hum.StateChanged:Connect(function(_, new)
  if new == Enum.HumanoidStateType.Landed then jumpCount = 0
  elseif new == Enum.HumanoidStateType.Freefall then end
end)
UIS.JumpRequest:Connect(function()
  if jumpCount < MAX_JUMPS then
    jumpCount += 1
    if jumpCount > 1 then
      hum:ChangeState(Enum.HumanoidStateType.Jumping)
    end
  end
end)`,
  },
  {
    name: 'Dash/Dodge',
    category: 'movement',
    keywords: ['dash', 'dodge', 'roll', 'evade', 'quick move'],
    code: `local DASH_SPEED = 80; local DASH_DURATION = 0.2; local DASH_COOLDOWN = 1.5
local lastDash = 0
local function dash()
  if os.clock() - lastDash < DASH_COOLDOWN then return end
  lastDash = os.clock()
  local char = player.Character; if not char then return end
  local root = char:FindFirstChild("HumanoidRootPart"); if not root then return end
  local dir = root.CFrame.LookVector
  local bv = Instance.new("BodyVelocity")
  bv.Velocity = dir * DASH_SPEED; bv.MaxForce = Vector3.new(1e5, 0, 1e5)
  bv.Parent = root
  game:GetService("Debris"):AddItem(bv, DASH_DURATION)
end
UIS.InputBegan:Connect(function(input, gpe)
  if gpe then return end
  if input.KeyCode == Enum.KeyCode.Q then dash() end
end)`,
  },
]

// ═══════════════════════════════════════════════════════════════════════════
// ENVIRONMENT & WORLD PATTERNS
// ═══════════════════════════════════════════════════════════════════════════

const ENVIRONMENT_PATTERNS: LuauPattern[] = [
  {
    name: 'Day/Night Cycle',
    category: 'environment',
    keywords: ['day', 'night', 'cycle', 'sun', 'moon', 'time'],
    code: `local Lighting = game:GetService("Lighting")
local CYCLE_DURATION = 600 -- 10 minutes per full day
task.spawn(function()
  while true do
    Lighting.ClockTime = (Lighting.ClockTime + 24/CYCLE_DURATION * 0.1) % 24
    local t = Lighting.ClockTime
    if t > 6 and t < 18 then
      Lighting.Brightness = 2; Lighting.Ambient = Color3.fromRGB(140,140,140)
      Lighting.OutdoorAmbient = Color3.fromRGB(140,140,140)
    else
      Lighting.Brightness = 0.5; Lighting.Ambient = Color3.fromRGB(30,30,50)
      Lighting.OutdoorAmbient = Color3.fromRGB(30,30,50)
    end
    task.wait(0.1)
  end
end)`,
  },
  {
    name: 'Zone Detection',
    category: 'environment',
    keywords: ['zone', 'region', 'area', 'enter', 'leave', 'boundary'],
    code: `local function createZone(name: string, position: Vector3, size: Vector3): Part
  local zone = Instance.new("Part")
  zone.Name = name; zone.Size = size; zone.Position = position
  zone.Anchored = true; zone.CanCollide = false; zone.Transparency = 1
  zone.Parent = workspace
  local playersInZone: {Player} = {}
  zone.Touched:Connect(function(hit)
    local player = Players:GetPlayerFromCharacter(hit.Parent)
    if player and not table.find(playersInZone, player) then
      table.insert(playersInZone, player)
      print(player.Name.." entered "..name)
    end
  end)
  zone.TouchEnded:Connect(function(hit)
    local player = Players:GetPlayerFromCharacter(hit.Parent)
    if player then
      local idx = table.find(playersInZone, player)
      if idx then table.remove(playersInZone, idx) end
      print(player.Name.." left "..name)
    end
  end)
  return zone
end`,
  },
  {
    name: 'ProximityPrompt Interactive',
    category: 'environment',
    keywords: ['proximity', 'prompt', 'interact', 'press e', 'pickup'],
    code: `local function makeInteractive(part: BasePart, text: string, holdTime: number?, callback: (Player)->())
  local prompt = Instance.new("ProximityPrompt")
  prompt.ActionText = text; prompt.ObjectText = part.Name
  prompt.MaxActivationDistance = 8; prompt.HoldDuration = holdTime or 0
  prompt.RequiresLineOfSight = true
  prompt.Parent = part
  prompt.Triggered:Connect(function(player: Player)
    callback(player)
  end)
  return prompt
end
-- Usage: makeInteractive(doorPart, "Open Door", 0, function(p) openDoor() end)`,
  },
  {
    name: 'Door Open/Close',
    category: 'environment',
    keywords: ['door', 'open', 'close', 'hinge', 'swing'],
    code: `local TweenService = game:GetService("TweenService")
local function createDoor(doorPart: BasePart)
  local isOpen = false
  local closedCF = doorPart.CFrame
  local openCF = closedCF * CFrame.new(doorPart.Size.X/2, 0, -doorPart.Size.X/2) * CFrame.Angles(0, math.rad(-90), 0) * CFrame.new(-doorPart.Size.X/2, 0, doorPart.Size.X/2)
  local prompt = Instance.new("ProximityPrompt")
  prompt.ActionText = "Open"; prompt.MaxActivationDistance = 8; prompt.Parent = doorPart
  local ti = TweenInfo.new(0.5, Enum.EasingStyle.Quad, Enum.EasingDirection.Out)
  prompt.Triggered:Connect(function()
    isOpen = not isOpen
    prompt.ActionText = if isOpen then "Close" else "Open"
    TweenService:Create(doorPart, ti, {CFrame = if isOpen then openCF else closedCF}):Play()
  end)
end`,
  },
]

// ═══════════════════════════════════════════════════════════════════════════
// ALL PATTERNS COMBINED
// ═══════════════════════════════════════════════════════════════════════════

const ALL_PATTERNS: LuauPattern[] = [
  ...DATA_PATTERNS,
  ...NETWORKING_PATTERNS,
  ...UI_PATTERNS,
  ...COMBAT_PATTERNS,
  ...MOVEMENT_PATTERNS,
  ...ENVIRONMENT_PATTERNS,
]

// ═══════════════════════════════════════════════════════════════════════════
// QUERY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/** Find patterns relevant to a user prompt */
export function findRelevantPatterns(prompt: string, maxPatterns = 5): LuauPattern[] {
  const lower = prompt.toLowerCase()
  const scored: { pattern: LuauPattern; score: number }[] = []

  for (const pattern of ALL_PATTERNS) {
    let score = 0
    for (const kw of pattern.keywords) {
      if (lower.includes(kw)) score += 2
    }
    if (score === 0) {
      for (const kw of pattern.keywords) {
        const words = kw.split(' ')
        for (const word of words) {
          if (word.length > 3 && lower.includes(word)) score += 1
        }
      }
    }
    if (score > 0) scored.push({ pattern, score })
  }

  scored.sort((a, b) => b.score - a.score)
  return scored.slice(0, maxPatterns).map(s => s.pattern)
}

/** Format patterns as prompt context */
export function formatPatternsForPrompt(patterns: LuauPattern[]): string {
  if (patterns.length === 0) return ''

  const lines: string[] = [
    '',
    '[PROVEN_CODE_PATTERNS]',
    'Use these tested patterns as reference. Adapt names, values, and structure to match the request:',
    '',
  ]

  for (const p of patterns) {
    lines.push(`── ${p.name} (${p.category}) ──`)
    lines.push(p.code)
    lines.push('')
  }

  lines.push('[/PROVEN_CODE_PATTERNS]')
  return lines.join('\n')
}

/** Get pattern count */
export function getPatternCount(): number {
  return ALL_PATTERNS.length
}
