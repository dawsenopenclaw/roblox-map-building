// =============================================================================
// UI/GUI DevForum Knowledge Base
// Extracted from 40+ DevForum posts, tutorials, and community resources
// Covers: toggle buttons, close buttons, shops, inventory, health bars,
//         draggable frames, notifications, button feedback, responsive scaling,
//         scrolling content, animations, color schemes
// =============================================================================

export const UI_DEVFORUM_KNOWLEDGE = `
================================================================================
ROBLOX UI/GUI COMPLETE KNOWLEDGE BASE — DevForum Research
================================================================================

## TABLE OF CONTENTS
1. TOGGLE BUTTON PATTERN (open/close any GUI)
2. CLOSE BUTTON PATTERN (X button with hover)
3. SHOP GUI COMPLETE PATTERN
4. INVENTORY GUI COMPLETE PATTERN
5. HEALTH BAR PATTERN
6. DRAGGABLE FRAMES
7. NOTIFICATION/TOAST SYSTEM
8. BUTTON FEEDBACK (click sound, hover, press animation)
9. RESPONSIVE SCALING (mobile/tablet/desktop)
10. SCROLLING CONTENT
11. ANIMATION BEST PRACTICES
12. COLOR SCHEMES THAT WORK
13. UIGRADIENT ANIMATIONS (shimmer, glow, rainbow)
14. COMMON MISTAKES TO AVOID

================================================================================
## 1. TOGGLE BUTTON PATTERN
================================================================================

PURPOSE: A button that stays visible on screen and opens/closes a panel.

### CRITICAL RULE
NEVER parent the toggle button INSIDE the frame it controls.
If the button is inside the frame, it disappears when the frame is hidden.
The button must be a SIBLING of the frame, both under the same ScreenGui.

### GUI Hierarchy:
  ScreenGui (in StarterGui)
    TextButton "ToggleBtn" (AnchorPoint 0,0.5; Position {0.02,0},{0.5,0}; Size {0,40},{0,40})
    Frame "MainPanel" (Visible = false initially; AnchorPoint 0.5,0.5; Position {0.5,0},{0.5,0}; Size {0.6,0},{0.7,0})
      -- panel contents go here

### SIMPLEST TOGGLE (recommended):
\`\`\`lua
-- LocalScript inside ToggleBtn
local button = script.Parent
local panel = button.Parent:WaitForChild("MainPanel")

button.MouseButton1Click:Connect(function()
    panel.Visible = not panel.Visible
end)
\`\`\`

### TOGGLE WITH TWEEN ANIMATION:
\`\`\`lua
-- LocalScript inside ToggleBtn
local TweenService = game:GetService("TweenService")
local button = script.Parent
local panel = button.Parent:WaitForChild("MainPanel")
local isOpen = false

local openPos = UDim2.new(0.5, 0, 0.5, 0)
local closedPos = UDim2.new(0.5, 0, 1.5, 0) -- off-screen below

local tweenInfo = TweenInfo.new(0.3, Enum.EasingStyle.Quad, Enum.EasingDirection.Out)

button.MouseButton1Click:Connect(function()
    isOpen = not isOpen
    if isOpen then
        panel.Visible = true
        panel.Position = closedPos
        TweenService:Create(panel, tweenInfo, {Position = openPos}):Play()
    else
        local closeTween = TweenService:Create(panel, tweenInfo, {Position = closedPos})
        closeTween:Play()
        closeTween.Completed:Connect(function()
            panel.Visible = false
        end)
    end
end)
\`\`\`

### TOGGLE WITH KEYBOARD SHORTCUT:
\`\`\`lua
local UserInputService = game:GetService("UserInputService")
local panel = script.Parent:WaitForChild("MainPanel")

UserInputService.InputBegan:Connect(function(input, gameProcessed)
    if gameProcessed then return end
    if input.KeyCode == Enum.KeyCode.E then
        panel.Visible = not panel.Visible
    end
end)
\`\`\`

### TOGGLE WITH OPEN/CLOSE BUTTON SWAP:
\`\`\`lua
-- Two buttons: "Open" (visible) and "Close" (hidden)
local function toggleUI()
    script.Parent.Open.Visible = not script.Parent.Open.Visible
    script.Parent.Close.Visible = not script.Parent.Close.Visible
    script.Parent.MainPanel.Visible = script.Parent.Close.Visible
end
script.Parent.Open.MouseButton1Click:Connect(toggleUI)
script.Parent.Close.MouseButton1Click:Connect(toggleUI)
\`\`\`

================================================================================
## 2. CLOSE BUTTON PATTERN (X Button)
================================================================================

### GUI Hierarchy:
  Frame "Panel"
    TextButton "CloseBtn" (Text = "X")
      -- Position: top-right corner
      -- AnchorPoint: 1, 0
      -- Position: {1, -5}, {0, 5}  (5px padding from edges)
      -- Size: {0, 30}, {0, 30}
      -- BackgroundColor3: Color3.fromRGB(200, 50, 50) or transparent
      -- TextColor3: Color3.fromRGB(255, 255, 255)
      -- Font: Enum.Font.GothamBold
      -- TextSize: 18
      -- BorderSizePixel: 0
    UICorner (CornerRadius: UDim.new(0, 6))

### CLOSE BUTTON WITH HOVER EFFECT:
\`\`\`lua
-- LocalScript inside CloseBtn
local TweenService = game:GetService("TweenService")
local button = script.Parent
local panel = button.Parent

local normalColor = Color3.fromRGB(60, 60, 60)
local hoverColor = Color3.fromRGB(200, 50, 50)
local pressColor = Color3.fromRGB(160, 30, 30)
local tweenInfo = TweenInfo.new(0.15, Enum.EasingStyle.Quad)

button.BackgroundColor3 = normalColor

button.MouseEnter:Connect(function()
    TweenService:Create(button, tweenInfo, {BackgroundColor3 = hoverColor}):Play()
end)

button.MouseLeave:Connect(function()
    TweenService:Create(button, tweenInfo, {BackgroundColor3 = normalColor}):Play()
end)

button.MouseButton1Down:Connect(function()
    TweenService:Create(button, tweenInfo, {BackgroundColor3 = pressColor}):Play()
end)

button.MouseButton1Up:Connect(function()
    TweenService:Create(button, tweenInfo, {BackgroundColor3 = hoverColor}):Play()
end)

button.MouseButton1Click:Connect(function()
    panel.Visible = false
end)
\`\`\`

### CLOSE WITH SLIDE-OUT ANIMATION:
\`\`\`lua
local TweenService = game:GetService("TweenService")
local button = script.Parent
local panel = button.Parent
local originalPos = panel.Position
local offScreenPos = UDim2.new(panel.Position.X.Scale, panel.Position.X.Offset, 1.5, 0)
local tweenInfo = TweenInfo.new(0.25, Enum.EasingStyle.Back, Enum.EasingDirection.In)

button.MouseButton1Click:Connect(function()
    local tween = TweenService:Create(panel, tweenInfo, {Position = offScreenPos})
    tween:Play()
    tween.Completed:Connect(function()
        panel.Visible = false
        panel.Position = originalPos
    end)
end)
\`\`\`

================================================================================
## 3. SHOP GUI COMPLETE PATTERN
================================================================================

### GUI Hierarchy:
  ScreenGui "ShopGUI" (in StarterGui)
    TextButton "OpenShopBtn" (always visible, e.g. bottom-right)
      -- Text: "Shop" or icon
      -- Position: {0.9, 0}, {0.9, 0}
      -- Size: {0, 80}, {0, 40}
    Frame "ShopFrame" (Visible = false)
      -- AnchorPoint: 0.5, 0.5
      -- Position: {0.5, 0}, {0.5, 0}
      -- Size: {0.7, 0}, {0.75, 0}
      -- BackgroundColor3: Color3.fromRGB(30, 30, 30)
      -- BorderSizePixel: 0
      UICorner (CornerRadius: UDim.new(0, 12))
      TextLabel "Title"
        -- Text: "SHOP"
        -- Position: {0.5, 0}, {0, 0}
        -- Size: {1, 0}, {0, 50}
        -- AnchorPoint: 0.5, 0
        -- BackgroundTransparency: 1
        -- TextColor3: Color3.fromRGB(255, 255, 255)
        -- Font: Enum.Font.GothamBold
        -- TextSize: 24
      TextButton "CloseBtn"
        -- Text: "X"
        -- AnchorPoint: 1, 0
        -- Position: {1, -8}, {0, 8}
        -- Size: {0, 32}, {0, 32}
      Frame "CategoryBar"
        -- Position: {0, 0}, {0, 55}
        -- Size: {1, 0}, {0, 40}
        UIListLayout (FillDirection: Horizontal, Padding: UDim.new(0, 5))
        TextButton "WeaponsTab" (Text: "Weapons")
        TextButton "ArmorTab" (Text: "Armor")
        TextButton "PetsTab" (Text: "Pets")
      ScrollingFrame "ItemGrid"
        -- Position: {0, 10}, {0, 105}
        -- Size: {1, -20}, {1, -115}
        -- CanvasSize: {0, 0}, {0, 0} (auto-sized)
        -- ScrollBarThickness: 6
        -- BackgroundTransparency: 1
        UIGridLayout
          -- CellSize: UDim2.new(0, 120, 0, 150)
          -- CellPadding: UDim2.new(0, 10, 0, 10)
        -- Item Template (clone for each item):
        Frame "ItemTemplate" (Visible = false)
          -- Size: set by UIGridLayout
          -- BackgroundColor3: Color3.fromRGB(45, 45, 45)
          UICorner (CornerRadius: UDim.new(0, 8))
          ImageLabel "Icon"
            -- Position: {0.5, 0}, {0, 10}
            -- Size: {0.8, 0}, {0, 80}
            -- AnchorPoint: 0.5, 0
            -- BackgroundTransparency: 1
          TextLabel "ItemName"
            -- Position: {0.5, 0}, {0, 95}
            -- AnchorPoint: 0.5, 0
            -- Size: {0.9, 0}, {0, 20}
            -- TextColor3: Color3.fromRGB(255, 255, 255)
            -- Font: Enum.Font.Gotham
            -- TextSize: 14
          TextButton "BuyBtn"
            -- Position: {0.5, 0}, {1, -35}
            -- AnchorPoint: 0.5, 0
            -- Size: {0.8, 0}, {0, 28}
            -- BackgroundColor3: Color3.fromRGB(0, 170, 80)
            -- Text: "$50"
            -- TextColor3: Color3.fromRGB(255, 255, 255)
            -- Font: Enum.Font.GothamBold
            UICorner (CornerRadius: UDim.new(0, 6))

### OPEN/CLOSE SHOP SCRIPTS:
\`\`\`lua
-- LocalScript in OpenShopBtn
local openBtn = script.Parent
local shopFrame = openBtn.Parent:WaitForChild("ShopFrame")

openBtn.MouseButton1Click:Connect(function()
    shopFrame.Visible = true
end)
\`\`\`

\`\`\`lua
-- LocalScript in CloseBtn
local closeBtn = script.Parent
local shopFrame = closeBtn.Parent

closeBtn.MouseButton1Click:Connect(function()
    shopFrame.Visible = false
end)
\`\`\`

### CURRENCY SYSTEM (Server):
\`\`\`lua
-- Script in ServerScriptService (LeaderstatsScript)
game.Players.PlayerAdded:Connect(function(player)
    local leaderstats = Instance.new("Folder")
    leaderstats.Name = "leaderstats"
    leaderstats.Parent = player

    local cash = Instance.new("IntValue")
    cash.Name = "Cash"
    cash.Value = 100
    cash.Parent = leaderstats
end)
\`\`\`

### BUY BUTTON (Client -> Server):
\`\`\`lua
-- LocalScript on BuyBtn
local button = script.Parent
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local buyEvent = ReplicatedStorage:WaitForChild("BuyItemEvent")
local itemName = button.Parent.Name -- or stored in an attribute

button.MouseButton1Click:Connect(function()
    buyEvent:FireServer(itemName)
end)
\`\`\`

### PURCHASE HANDLER (Server):
\`\`\`lua
-- Script in ServerScriptService (ShopServerHandler)
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local buyEvent = ReplicatedStorage:WaitForChild("BuyItemEvent")

local itemPrices = {
    ["IronSword"] = 50,
    ["GoldArmor"] = 150,
    ["FirePet"] = 300,
}

buyEvent.OnServerEvent:Connect(function(player, itemName)
    local price = itemPrices[itemName]
    local leaderstats = player:FindFirstChild("leaderstats")
    local cash = leaderstats and leaderstats:FindFirstChild("Cash")

    if not price or not cash then return end

    if cash.Value >= price then
        cash.Value = cash.Value - price

        local toolTemplate = ReplicatedStorage:FindFirstChild(itemName)
        if toolTemplate then
            local newTool = toolTemplate:Clone()
            newTool.Parent = player.Backpack
            -- Also add to StarterGear so they keep it on respawn
            local gearCopy = toolTemplate:Clone()
            gearCopy.Parent = player.StarterGear
        end
    end
end)
\`\`\`

### CATEGORY TAB SWITCHING:
\`\`\`lua
-- LocalScript for category tabs
local categories = script.Parent:WaitForChild("CategoryBar")
local itemGrid = script.Parent:WaitForChild("ItemGrid")
local activeColor = Color3.fromRGB(0, 170, 80)
local inactiveColor = Color3.fromRGB(60, 60, 60)

for _, tab in ipairs(categories:GetChildren()) do
    if tab:IsA("TextButton") then
        tab.MouseButton1Click:Connect(function()
            -- Reset all tabs
            for _, t in ipairs(categories:GetChildren()) do
                if t:IsA("TextButton") then
                    t.BackgroundColor3 = inactiveColor
                end
            end
            tab.BackgroundColor3 = activeColor

            -- Show/hide items by category
            for _, item in ipairs(itemGrid:GetChildren()) do
                if item:IsA("Frame") then
                    local cat = item:GetAttribute("Category")
                    item.Visible = (cat == tab.Name) or (tab.Name == "AllTab")
                end
            end
        end)
    end
end
\`\`\`

### ROBUX PURCHASE (Developer Products):
\`\`\`lua
-- LocalScript for Robux buy button
local MarketplaceService = game:GetService("MarketplaceService")
local productId = 123456789 -- your developer product ID

script.Parent.MouseButton1Click:Connect(function()
    MarketplaceService:PromptProductPurchase(game.Players.LocalPlayer, productId)
end)
\`\`\`

\`\`\`lua
-- Server Script: ProcessReceipt handler
local MarketplaceService = game:GetService("MarketplaceService")
local Players = game:GetService("Players")

local productRewards = {
    [123456789] = "CoolSword",
}

MarketplaceService.ProcessReceipt = function(receiptInfo)
    local player = Players:GetPlayerByUserId(receiptInfo.PlayerId)
    if not player then
        return Enum.ProductPurchaseDecision.NotProcessedYet
    end

    local rewardName = productRewards[receiptInfo.ProductId]
    if rewardName then
        local template = game:GetService("ReplicatedStorage"):FindFirstChild(rewardName)
        if template then
            template:Clone().Parent = player.Backpack
            template:Clone().Parent = player.StarterGear
        end
    end

    return Enum.ProductPurchaseDecision.PurchaseGranted
end
\`\`\`

### SECURITY: All money/item validation MUST happen server-side.
Never trust the client. Always validate prices and inventory server-side.

================================================================================
## 4. INVENTORY GUI COMPLETE PATTERN
================================================================================

### GUI Hierarchy:
  ScreenGui "InventoryGUI"
    Frame "Hotbar" (always visible at bottom)
      -- AnchorPoint: 0.5, 1
      -- Position: {0.5, 0}, {1, -10}
      -- Size: {0, 320}, {0, 60}
      -- BackgroundColor3: Color3.fromRGB(25, 25, 25)
      -- BackgroundTransparency: 0.3
      UIListLayout (FillDirection: Horizontal, Padding: UDim.new(0, 4))
      UICorner (CornerRadius: UDim.new(0, 8))
      Frame "Slot1" through "Slot6"
        -- Size: {0, 50}, {0, 50}
        -- BackgroundColor3: Color3.fromRGB(40, 40, 40)
        UICorner (CornerRadius: UDim.new(0, 6))
        UIStroke (Color: Color3.fromRGB(20, 20, 20), Thickness: 2)
        ImageLabel "ItemImage"
          -- Size: {0.8, 0}, {0.8, 0}
          -- AnchorPoint: 0.5, 0.5
          -- Position: {0.5, 0}, {0.5, 0}
          -- BackgroundTransparency: 1
    Frame "Bag" (Visible = false, opened with G key)
      -- AnchorPoint: 0.5, 0.5
      -- Position: {0.5, 0}, {0.4, 0}
      -- Size: {0.5, 0}, {0.5, 0}
      -- BackgroundColor3: Color3.fromRGB(30, 30, 30)
      UICorner (CornerRadius: UDim.new(0, 10))
      ScrollingFrame "ItemList"
        -- Size: {1, -20}, {1, -60}
        -- Position: {0, 10}, {0, 50}
        -- BackgroundTransparency: 1
        -- CanvasSize: {0, 0}, {0, 0}
        -- AutomaticCanvasSize: Enum.AutomaticSize.Y
        UIGridLayout
          -- CellSize: UDim2.new(0, 60, 0, 60)
          -- CellPadding: UDim2.new(0, 5, 0, 5)
      Frame "ItemTemplate" (Visible = false, clone for items)
        ImageLabel "ItemImage"
    Frame "SlotDragger" (invisible drag proxy)
      -- Size: {0, 50}, {0, 50}
      -- Visible: false
      -- ZIndex: 100
      ImageLabel "ItemImage"

### CORE INVENTORY LOGIC:
\`\`\`lua
-- Disable default backpack
game:GetService("StarterGui"):SetCoreGuiEnabled(Enum.CoreGuiType.Backpack, false)
\`\`\`

### HOTBAR KEYBIND EQUIP:
\`\`\`lua
local UserInputService = game:GetService("UserInputService")
local player = game.Players.LocalPlayer
local character = player.Character or player.CharacterAdded:Wait()
local humanoid = character:WaitForChild("Humanoid")
local backpack = player.Backpack

local keySlotMap = {
    [Enum.KeyCode.One] = 1,
    [Enum.KeyCode.Two] = 2,
    [Enum.KeyCode.Three] = 3,
    [Enum.KeyCode.Four] = 4,
    [Enum.KeyCode.Five] = 5,
    [Enum.KeyCode.Six] = 6,
}

UserInputService.InputBegan:Connect(function(input, processed)
    if processed then return end
    local slot = keySlotMap[input.KeyCode]
    if slot then
        for _, tool in ipairs(backpack:GetChildren()) do
            if tool:IsA("Tool") and tool:GetAttribute("Slot") == slot then
                humanoid:EquipTool(tool)
                return
            end
        end
        -- If already equipped in that slot, unequip
        for _, tool in ipairs(character:GetChildren()) do
            if tool:IsA("Tool") and tool:GetAttribute("Slot") == slot then
                humanoid:UnequipTools()
                return
            end
        end
    end
end)
\`\`\`

### BAG TOGGLE (G key):
\`\`\`lua
UserInputService.InputBegan:Connect(function(input, processed)
    if processed then return end
    if input.KeyCode == Enum.KeyCode.G then
        bag.Visible = not bag.Visible
    end
end)
\`\`\`

### SLOT HIGHLIGHT ON EQUIP:
\`\`\`lua
-- When equipping, highlight the active slot
local function highlightSlot(slotNum)
    for _, slot in ipairs(hotbar:GetChildren()) do
        if slot:IsA("Frame") then
            local stroke = slot:FindFirstChild("UIStroke")
            if stroke then
                stroke.Color = Color3.fromRGB(20, 20, 20) -- default
            end
        end
    end
    local activeSlot = hotbar:FindFirstChild("Slot" .. tostring(slotNum))
    if activeSlot then
        local stroke = activeSlot:FindFirstChild("UIStroke")
        if stroke then
            stroke.Color = Color3.fromRGB(255, 255, 255) -- active highlight
        end
    end
end
\`\`\`

### AUTO-SIZE SCROLLINGFRAME FOR BAG:
\`\`\`lua
local gridLayout = scrollingFrame:FindFirstChild("UIGridLayout")
gridLayout:GetPropertyChangedSignal("AbsoluteContentSize"):Connect(function()
    scrollingFrame.CanvasSize = UDim2.new(0, 0, 0, gridLayout.AbsoluteContentSize.Y)
end)
\`\`\`

================================================================================
## 5. HEALTH BAR PATTERN
================================================================================

### GUI Hierarchy:
  ScreenGui "HealthGUI" (ResetOnSpawn = true)
    Frame "HealthContainer"
      -- AnchorPoint: 0.5, 1
      -- Position: {0.5, 0}, {1, -80}
      -- Size: {0.3, 0}, {0, 25}
      -- BackgroundColor3: Color3.fromRGB(30, 30, 30)
      UICorner (CornerRadius: UDim.new(0, 6))
      Frame "HealthBar" (the fill)
        -- Position: {0, 0}, {0, 0}
        -- Size: {1, 0}, {1, 0}  (100% = full health)
        -- BackgroundColor3: Color3.fromRGB(0, 200, 0) (green)
        UICorner (CornerRadius: UDim.new(0, 6))
      Frame "DamageBar" (shadow/trail behind health bar)
        -- Same size as HealthBar but tweens slower
        -- BackgroundColor3: Color3.fromRGB(200, 50, 50)
        -- ZIndex behind HealthBar
      TextLabel "HealthText"
        -- Size: {1, 0}, {1, 0}
        -- BackgroundTransparency: 1
        -- Text: "100/100"
        -- TextColor3: Color3.fromRGB(255, 255, 255)
        -- Font: Enum.Font.GothamBold
        -- TextSize: 14
        -- ZIndex: 3

### SMOOTH TWEENED HEALTH BAR:
\`\`\`lua
-- LocalScript inside HealthBar
local TweenService = game:GetService("TweenService")
local player = game.Players.LocalPlayer
local character = player.Character or player.CharacterAdded:Wait()
local humanoid = character:WaitForChild("Humanoid")

local healthBar = script.Parent
local damageBar = healthBar.Parent:FindFirstChild("DamageBar")
local healthText = healthBar.Parent:FindFirstChild("HealthText")

local currentTween = nil
local damageTween = nil

local function updateHealthBar()
    local healthPercent = math.clamp(humanoid.Health / humanoid.MaxHealth, 0, 1)

    -- Cancel previous tween
    if currentTween then currentTween:Cancel() end
    if damageTween then damageTween:Cancel() end

    -- Fast tween for main bar
    currentTween = TweenService:Create(
        healthBar,
        TweenInfo.new(0.2, Enum.EasingStyle.Quad, Enum.EasingDirection.Out),
        {Size = UDim2.fromScale(healthPercent, 1)}
    )
    currentTween:Play()

    -- Slow tween for damage trail
    if damageBar then
        task.delay(0.3, function()
            damageTween = TweenService:Create(
                damageBar,
                TweenInfo.new(0.5, Enum.EasingStyle.Quad, Enum.EasingDirection.Out),
                {Size = UDim2.fromScale(healthPercent, 1)}
            )
            damageTween:Play()
        end)
    end

    -- Color shift: green at full, yellow at half, red at low
    healthBar.BackgroundColor3 = Color3.fromHSV(healthPercent * 0.3, 1, 1)

    -- Update text
    if healthText then
        healthText.Text = math.round(humanoid.Health) .. "/" .. math.round(humanoid.MaxHealth)
    end
end

updateHealthBar()
humanoid:GetPropertyChangedSignal("Health"):Connect(updateHealthBar)
humanoid:GetPropertyChangedSignal("MaxHealth"):Connect(updateHealthBar)
\`\`\`

### COLOR FORMULA:
Color3.fromHSV(healthPercent * 0.3, 1, 1)
  - healthPercent = 1.0 (full): Hue 0.3 = GREEN
  - healthPercent = 0.5 (half): Hue 0.15 = YELLOW
  - healthPercent = 0.0 (dead): Hue 0.0 = RED

================================================================================
## 6. DRAGGABLE FRAMES
================================================================================

### BASIC DRAGGABLE (with touch support):
\`\`\`lua
-- LocalScript inside the Frame you want draggable
local UserInputService = game:GetService("UserInputService")
local Players = game:GetService("Players")

local frame = script.Parent
local mouse = Players.LocalPlayer:GetMouse()

local hovered = false
local holding = false
local moveCon = nil
local initialX, initialY, uiInitialPos

local function drag()
    if not holding then
        if moveCon then moveCon:Disconnect() end
        return
    end
    local dx = initialX - mouse.X
    local dy = initialY - mouse.Y
    frame.Position = uiInitialPos - UDim2.new(0, dx, 0, dy)
end

frame.MouseEnter:Connect(function() hovered = true end)
frame.MouseLeave:Connect(function() hovered = false end)

UserInputService.InputBegan:Connect(function(input)
    if input.UserInputType == Enum.UserInputType.MouseButton1
    or input.UserInputType == Enum.UserInputType.Touch then
        holding = hovered
        if holding then
            initialX, initialY = mouse.X, mouse.Y
            uiInitialPos = frame.Position
            moveCon = mouse.Move:Connect(drag)
        end
    end
end)

UserInputService.InputEnded:Connect(function(input)
    if input.UserInputType == Enum.UserInputType.MouseButton1
    or input.UserInputType == Enum.UserInputType.Touch then
        holding = false
    end
end)
\`\`\`

### DRAGGABLE WITH BOUNDARY CLAMPING:
\`\`\`lua
-- Keeps frame within screen bounds (uses Scale positioning)
local viewportSize = workspace.Camera.ViewportSize

local function drag()
    if not holding then
        if moveCon then moveCon:Disconnect() end
        return
    end
    local dx = (initialX - mouse.X) / viewportSize.X
    local dy = (initialY - mouse.Y) / viewportSize.Y
    local pos = uiInitialPos - UDim2.new(dx, 0, dy, 0)
    frame.Position = UDim2.new(
        math.clamp(pos.X.Scale, 0, 1 - frame.Size.X.Scale), 0,
        math.clamp(pos.Y.Scale, 0, 1 - frame.Size.Y.Scale), 0
    )
end
\`\`\`

### TITLEBAR-ONLY DRAGGING:
If you only want the frame draggable by its title bar:
\`\`\`lua
local titleBar = frame:WaitForChild("TitleBar")
titleBar.MouseEnter:Connect(function() hovered = true end)
titleBar.MouseLeave:Connect(function() hovered = false end)
-- Remove the frame.MouseEnter/MouseLeave connections
\`\`\`

================================================================================
## 7. NOTIFICATION/TOAST SYSTEM
================================================================================

### GUI Hierarchy:
  ScreenGui "NotificationGUI" (DisplayOrder = 100)
    Frame "NotificationContainer"
      -- AnchorPoint: 1, 0
      -- Position: {1, -10}, {0, 10}
      -- Size: {0, 300}, {1, -20}
      -- BackgroundTransparency: 1
      UIListLayout
        -- Padding: UDim.new(0, 5)
        -- SortOrder: Enum.SortOrder.LayoutOrder
        -- VerticalAlignment: Enum.VerticalAlignment.Top
    Frame "ToastTemplate" (Visible = false)
      -- Size: {1, 0}, {0, 60}
      -- BackgroundColor3: Color3.fromRGB(35, 35, 35)
      UICorner (CornerRadius: UDim.new(0, 8))
      UIStroke (Color: Color3.fromRGB(60, 60, 60), Thickness: 1)
      TextLabel "Title"
        -- Position: {0, 15}, {0, 8}
        -- Size: {1, -30}, {0, 20}
        -- Font: Enum.Font.GothamBold
        -- TextSize: 14
        -- TextColor3: Color3.fromRGB(255, 255, 255)
      TextLabel "Message"
        -- Position: {0, 15}, {0, 30}
        -- Size: {1, -30}, {0, 22}
        -- Font: Enum.Font.Gotham
        -- TextSize: 12
        -- TextColor3: Color3.fromRGB(180, 180, 180)

### TOAST NOTIFICATION MODULE:
\`\`\`lua
-- ModuleScript "NotificationModule" in ReplicatedStorage
local TweenService = game:GetService("TweenService")
local Debris = game:GetService("Debris")

local module = {}

function module.ShowToast(container, template, title, message, duration)
    duration = duration or 3

    local toast = template:Clone()
    toast.Name = "Toast_" .. tick()
    toast.Title.Text = title
    toast.Message.Text = message
    toast.Visible = true
    toast.Parent = container

    -- Slide in from right
    local targetPos = toast.Position
    toast.Position = targetPos + UDim2.new(0, 300, 0, 0)
    TweenService:Create(toast, TweenInfo.new(0.3, Enum.EasingStyle.Quad, Enum.EasingDirection.Out), {
        Position = targetPos
    }):Play()

    -- Auto-dismiss
    task.delay(duration, function()
        if toast and toast.Parent then
            local fadeTween = TweenService:Create(toast, TweenInfo.new(0.3, Enum.EasingStyle.Quad), {
                Position = targetPos + UDim2.new(0, 300, 0, 0),
                BackgroundTransparency = 1
            })
            fadeTween:Play()
            fadeTween.Completed:Connect(function()
                toast:Destroy()
            end)
        end
    end)

    return toast
end

function module.ShowSuccess(container, template, message)
    local toast = module.ShowToast(container, template, "Success", message, 3)
    toast.BackgroundColor3 = Color3.fromRGB(25, 60, 35)
    toast.UIStroke.Color = Color3.fromRGB(0, 170, 80)
end

function module.ShowError(container, template, message)
    local toast = module.ShowToast(container, template, "Error", message, 5)
    toast.BackgroundColor3 = Color3.fromRGB(60, 25, 25)
    toast.UIStroke.Color = Color3.fromRGB(200, 50, 50)
end

function module.ShowInfo(container, template, message)
    local toast = module.ShowToast(container, template, "Info", message, 3)
    toast.BackgroundColor3 = Color3.fromRGB(25, 35, 60)
    toast.UIStroke.Color = Color3.fromRGB(50, 100, 200)
end

return module
\`\`\`

### SERVER-TRIGGERED NOTIFICATIONS:
\`\`\`lua
-- Server: Fire to specific player
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local notifyEvent = ReplicatedStorage:WaitForChild("NotifyEvent")
notifyEvent:FireClient(player, "Purchase Complete", "You bought Iron Sword!")
\`\`\`

\`\`\`lua
-- Client: Listen and display
local notifyEvent = game.ReplicatedStorage:WaitForChild("NotifyEvent")
local NotificationModule = require(game.ReplicatedStorage.NotificationModule)

notifyEvent.OnClientEvent:Connect(function(title, message)
    NotificationModule.ShowToast(container, template, title, message, 3)
end)
\`\`\`

================================================================================
## 8. BUTTON FEEDBACK (Click Sound, Hover, Press Animation)
================================================================================

### SOUND SETUP:
Parent a Sound object to the button OR to SoundService/Workspace.
Common sound IDs from DevForum recommendations:
  - Click: rbxassetid://6895079853 (soft click)
  - Hover: rbxassetid://6895079853 (lighter click)
  - Error: rbxassetid://6895079853 (buzz)

### COMPLETE BUTTON FEEDBACK SYSTEM:
\`\`\`lua
-- LocalScript: ButtonFeedback module
local TweenService = game:GetService("TweenService")

local function setupButtonFeedback(button, options)
    options = options or {}
    local clickSound = options.clickSound -- Sound instance
    local hoverSound = options.hoverSound -- Sound instance
    local originalSize = button.Size
    local originalColor = button.BackgroundColor3

    -- Hover: slight grow + color shift
    local hoverTweenInfo = TweenInfo.new(0.15, Enum.EasingStyle.Quad)
    local growSize = UDim2.new(
        originalSize.X.Scale * 1.05, originalSize.X.Offset,
        originalSize.Y.Scale * 1.05, originalSize.Y.Offset
    )

    button.MouseEnter:Connect(function()
        TweenService:Create(button, hoverTweenInfo, {Size = growSize}):Play()
        if hoverSound then hoverSound:Play() end
    end)

    button.MouseLeave:Connect(function()
        TweenService:Create(button, hoverTweenInfo, {Size = originalSize}):Play()
    end)

    -- Press: shrink + darken
    local pressSize = UDim2.new(
        originalSize.X.Scale * 0.95, originalSize.X.Offset,
        originalSize.Y.Scale * 0.95, originalSize.Y.Offset
    )

    button.MouseButton1Down:Connect(function()
        TweenService:Create(button, TweenInfo.new(0.05), {Size = pressSize}):Play()
    end)

    button.MouseButton1Up:Connect(function()
        TweenService:Create(button, hoverTweenInfo, {Size = growSize}):Play()
    end)

    -- Click sound
    button.MouseButton1Click:Connect(function()
        if clickSound then clickSound:Play() end
    end)
end

return setupButtonFeedback
\`\`\`

### HOVER SOUND PATTERN:
\`\`\`lua
-- Simplest: Sound as child of script
local button = script.Parent
local sound = Instance.new("Sound")
sound.SoundId = "rbxassetid://6895079853"
sound.Volume = 0.3
sound.Parent = button

button.MouseEnter:Connect(function()
    sound:Play()
end)
\`\`\`

### CLICK WITH VISUAL PULSE:
\`\`\`lua
local TweenService = game:GetService("TweenService")
local button = script.Parent

button.MouseButton1Click:Connect(function()
    -- Quick shrink then bounce back
    local shrink = TweenService:Create(button, TweenInfo.new(0.05), {
        Size = UDim2.new(
            button.Size.X.Scale * 0.9, button.Size.X.Offset,
            button.Size.Y.Scale * 0.9, button.Size.Y.Offset
        )
    })
    shrink:Play()
    shrink.Completed:Wait()

    TweenService:Create(button, TweenInfo.new(0.15, Enum.EasingStyle.Back, Enum.EasingDirection.Out), {
        Size = button.Size
    }):Play()
end)
\`\`\`

### TEXT LABEL FADE ON HOVER:
\`\`\`lua
local TweenService = game:GetService("TweenService")
local button = script.Parent
local label = button:FindFirstChildOfClass("TextLabel")

button.MouseEnter:Connect(function()
    TweenService:Create(label, TweenInfo.new(0.2, Enum.EasingStyle.Quad), {
        TextTransparency = 0.4
    }):Play()
end)

button.MouseLeave:Connect(function()
    TweenService:Create(label, TweenInfo.new(0.2, Enum.EasingStyle.Quad), {
        TextTransparency = 0
    }):Play()
end)
\`\`\`

================================================================================
## 9. RESPONSIVE SCALING (Mobile/Tablet/Desktop)
================================================================================

### KEY PRINCIPLES:
1. Use SCALE (0-1 range) for Position and Size, not Offset for main frames
2. Use UIAspectRatioConstraint to maintain proportions
3. Use AnchorPoint for centered positioning
4. Test on iPhone 4S, iPad, and 1920x1080

### UIAspectRatioConstraint:
\`\`\`
-- Add as child of any Frame to maintain ratio
UIAspectRatioConstraint
  AspectRatio: 2 (width:height = 2:1)
  AspectType: Enum.AspectType.FitWithinMaxSize
  DominantAxis: Enum.DominantAxis.Width
\`\`\`

Without constraint: 300x150 frame becomes 131x90 on small screens (distorted).
With constraint: 300x150 stays at 2:1 ratio (131x65 on small screens).

### VIEWPORT-BASED SCALING:
\`\`\`lua
-- LocalScript: auto-scale UI based on viewport
local camera = workspace.CurrentCamera
local gui = script.Parent -- ScreenGui
local uiScale = Instance.new("UIScale")
uiScale.Parent = gui

local BASE_RESOLUTION = Vector2.new(1920, 1080)

local function updateScale()
    local viewport = camera.ViewportSize
    local scaleX = viewport.X / BASE_RESOLUTION.X
    local scaleY = viewport.Y / BASE_RESOLUTION.Y
    uiScale.Scale = math.min(scaleX, scaleY)
end

camera:GetPropertyChangedSignal("ViewportSize"):Connect(updateScale)
updateScale()
\`\`\`

### HYBRID APPROACH (Scale + Offset):
- Use Scale for position (relative to screen)
- Use Offset for fixed gaps and padding (e.g., 10px margin)
- Example: Position = {0.5, 0}, {0.5, -20} (centered with 20px up nudge)

### SCROLLINGFRAME EXCEPTION:
ScrollingFrame children should use OFFSET for sizing, not Scale.
Scale causes items to resize relative to CanvasSize, breaking layouts.

### MOBILE BUTTON MINIMUM SIZE:
Touch targets should be at least 44x44 pixels (Apple HIG guideline).
In Roblox: Size = {0, 44}, {0, 44} minimum for mobile-friendly buttons.

================================================================================
## 10. SCROLLING CONTENT
================================================================================

### AUTO-SIZING CANVAS:
\`\`\`lua
-- Auto-resize ScrollingFrame canvas to fit content
local scrollFrame = script.Parent
local layout = scrollFrame:FindFirstChildOfClass("UIGridLayout")
    or scrollFrame:FindFirstChildOfClass("UIListLayout")

local function updateCanvas()
    scrollFrame.CanvasSize = UDim2.new(
        0, layout.AbsoluteContentSize.X,
        0, layout.AbsoluteContentSize.Y
    )
end

layout:GetPropertyChangedSignal("AbsoluteContentSize"):Connect(updateCanvas)
updateCanvas()
\`\`\`

### SCROLLINGFRAME PROPERTIES:
\`\`\`
ScrollingFrame:
  ScrollBarThickness: 6 (thin, modern look)
  ScrollBarImageColor3: Color3.fromRGB(100, 100, 100)
  ScrollBarImageTransparency: 0.3
  TopImage: "" (removes arrow)
  MidImage: "rbxassetid://0" (clean bar)
  BottomImage: "" (removes arrow)
  CanvasSize: UDim2.new(0, 0, 0, 0) (set dynamically)
  AutomaticCanvasSize: Enum.AutomaticSize.Y (or set manually)
  ElasticBehavior: Enum.ElasticBehavior.Always
  ScrollingDirection: Enum.ScrollingDirection.Y
\`\`\`

### GRID LAYOUT IN SCROLLINGFRAME:
\`\`\`
UIGridLayout:
  CellSize: UDim2.new(0, 100, 0, 100) -- USE OFFSET, not Scale
  CellPadding: UDim2.new(0, 8, 0, 8)
  SortOrder: Enum.SortOrder.LayoutOrder
  FillDirection: Enum.FillDirection.Horizontal
  FillDirectionMaxCells: 4 -- items per row
\`\`\`

### LIST LAYOUT IN SCROLLINGFRAME:
\`\`\`
UIListLayout:
  Padding: UDim.new(0, 5)
  SortOrder: Enum.SortOrder.LayoutOrder
  FillDirection: Enum.FillDirection.Vertical
  HorizontalAlignment: Enum.HorizontalAlignment.Center
\`\`\`

================================================================================
## 11. ANIMATION BEST PRACTICES
================================================================================

### RECOMMENDED TWEEN DURATIONS:
- Button hover: 0.1 - 0.2 seconds
- Panel open/close: 0.2 - 0.35 seconds
- Health bar update: 0.2 seconds
- Damage trail: 0.5 seconds
- Notification slide-in: 0.25 - 0.35 seconds
- Color transitions: 0.15 - 0.3 seconds
- Loading shimmer: 1 - 2 seconds (repeating)

### RECOMMENDED EASING STYLES:
- Button hover: Enum.EasingStyle.Quad, Out
- Panel slide in: Enum.EasingStyle.Quad, Out (or Back for bounce)
- Panel slide out: Enum.EasingStyle.Quad, In (or Back, In for snap)
- Health bar: Enum.EasingStyle.Quad, Out
- Fade effects: Enum.EasingStyle.Linear
- Bounce: Enum.EasingStyle.Back, Out
- Shimmer/glow: Enum.EasingStyle.Linear (looping)

### SLIDE-IN FROM OFF-SCREEN:
\`\`\`lua
local TweenService = game:GetService("TweenService")
local panel = script.Parent
local targetPos = panel.Position
local offScreen = UDim2.new(targetPos.X.Scale, targetPos.X.Offset, 1.5, 0) -- below screen

local function slideIn()
    panel.Position = offScreen
    panel.Visible = true
    TweenService:Create(panel, TweenInfo.new(0.3, Enum.EasingStyle.Back, Enum.EasingDirection.Out), {
        Position = targetPos
    }):Play()
end

local function slideOut()
    local tween = TweenService:Create(panel, TweenInfo.new(0.25, Enum.EasingStyle.Back, Enum.EasingDirection.In), {
        Position = offScreen
    })
    tween:Play()
    tween.Completed:Connect(function()
        panel.Visible = false
    end)
end
\`\`\`

### FADE IN/OUT:
\`\`\`lua
local function fadeIn(guiObject, duration)
    guiObject.BackgroundTransparency = 1
    guiObject.Visible = true
    TweenService:Create(guiObject, TweenInfo.new(duration or 0.3), {
        BackgroundTransparency = 0
    }):Play()
end

local function fadeOut(guiObject, duration)
    local tween = TweenService:Create(guiObject, TweenInfo.new(duration or 0.3), {
        BackgroundTransparency = 1
    })
    tween:Play()
    tween.Completed:Connect(function()
        guiObject.Visible = false
    end)
end
\`\`\`

### CANCEL PREVIOUS TWEENS:
Always cancel/override running tweens before starting new ones.
\`\`\`lua
if currentTween then currentTween:Cancel() end
currentTween = TweenService:Create(...)
currentTween:Play()
\`\`\`

### GUIOBJECT BUILT-IN TWEENS:
You can also use the built-in methods instead of TweenService:
\`\`\`lua
guiObject:TweenPosition(UDim2.new(...), Enum.EasingDirection.Out, Enum.EasingStyle.Quad, 0.3, true)
guiObject:TweenSize(UDim2.new(...), Enum.EasingDirection.Out, Enum.EasingStyle.Quad, 0.3, true)
guiObject:TweenSizeAndPosition(size, pos, easingDir, easingStyle, time, override)
\`\`\`
The 'true' parameter = override existing tweens.

================================================================================
## 12. COLOR SCHEMES THAT WORK
================================================================================

### DARK THEME (Most Popular in Roblox):
  Background:      Color3.fromRGB(20, 20, 20) to (35, 35, 35)
  Panel/Card:       Color3.fromRGB(40, 45, 50) to (55, 55, 60)
  Border/Stroke:    Color3.fromRGB(60, 60, 65)
  Text Primary:     Color3.fromRGB(255, 255, 255)
  Text Secondary:   Color3.fromRGB(180, 180, 185)
  Text Muted:       Color3.fromRGB(120, 120, 125)
  Accent Green:     Color3.fromRGB(0, 170, 80)
  Accent Blue:      Color3.fromRGB(50, 100, 200)
  Accent Red:       Color3.fromRGB(200, 50, 50)
  Accent Gold:      Color3.fromRGB(212, 175, 55)
  Accent Purple:    Color3.fromRGB(130, 80, 200)

### DESIGN RULES:
1. NEVER use pure black (0,0,0) as background - use (20,20,20) to (30,30,30)
2. Use WHITE text on dark backgrounds - colored text is hard to read
3. Cool tones (blue, purple, green) work best as accents on dark UIs
4. Avoid bright/neon colors that hurt eyes - use muted, desaturated versions
5. Create depth with subtle transparency differences, not drastic color shifts
6. UIStroke adds clean borders: Thickness 1-2, slightly lighter than background

### LIGHT THEME:
  Background:      Color3.fromRGB(240, 240, 245)
  Panel/Card:       Color3.fromRGB(255, 255, 255)
  Border:           Color3.fromRGB(200, 200, 205)
  Text Primary:     Color3.fromRGB(30, 30, 35)
  Text Secondary:   Color3.fromRGB(100, 100, 105)

### BUTTON COLORS:
  Primary (Buy/Confirm):  Color3.fromRGB(0, 170, 80) -- green
  Danger (Delete/Cancel):  Color3.fromRGB(200, 50, 50) -- red
  Neutral (Close/Back):    Color3.fromRGB(60, 60, 65) -- gray
  Info (Help/Details):     Color3.fromRGB(50, 100, 200) -- blue
  Premium/Special:         Color3.fromRGB(212, 175, 55) -- gold

### HOVER STATE FORMULA:
  Normal:  original color
  Hover:   lighten by ~15-20% (add 30-40 to each RGB channel)
  Press:   darken by ~10% (subtract 20-30 from each channel)

================================================================================
## 13. UIGRADIENT ANIMATIONS
================================================================================

### SHIMMER/LOADING EFFECT:
\`\`\`lua
local TweenService = game:GetService("TweenService")
local gradient = script.Parent:FindFirstChild("UIGradient")

-- Setup: UIGradient with Color = ColorSequence of (dark, light, dark)
-- Rotation: 45

local tweenInfo = TweenInfo.new(1, Enum.EasingStyle.Linear, Enum.EasingDirection.Out, -1) -- -1 = infinite repeat
local shimmerTween = TweenService:Create(gradient, tweenInfo, {
    Offset = Vector2.new(1, 0)
})

gradient.Offset = Vector2.new(-1, 0)
shimmerTween:Play()
\`\`\`

### SHINE SWEEP EFFECT:
\`\`\`lua
-- UIGradient Color: ColorSequence (button color, white highlight, button color)
-- Rotation: 45 degrees
local gradient = script.Parent.UIGradient
local TweenService = game:GetService("TweenService")
local tweenInfo = TweenInfo.new(1, Enum.EasingStyle.Circular, Enum.EasingDirection.Out)

local function playSweep()
    gradient.Offset = Vector2.new(-1, 0)
    local tween = TweenService:Create(gradient, tweenInfo, {Offset = Vector2.new(1, 0)})
    tween:Play()
    tween.Completed:Wait()
    task.wait(2.5) -- pause between sweeps
    playSweep()
end
playSweep()
\`\`\`

### HOVER GRADIENT REVEAL:
\`\`\`lua
-- UIGradient starts offset to hide color
local button = script.Parent
local gradient = button.UIGradient
local TweenService = game:GetService("TweenService")
local tweenInfo = TweenInfo.new(0.5, Enum.EasingStyle.Exponential, Enum.EasingDirection.Out)

gradient.Offset = Vector2.new(-1, 0)

button.MouseEnter:Connect(function()
    TweenService:Create(gradient, tweenInfo, {Offset = Vector2.new(0, 0)}):Play()
end)

button.MouseLeave:Connect(function()
    TweenService:Create(gradient, tweenInfo, {Offset = Vector2.new(1, 0)}):Play()
end)
\`\`\`

### SHIMMER MODULE (Shime):
\`\`\`lua
-- Using the Shime module for easy shimmer effects
local Shime = require(game.ReplicatedStorage.Shime)
local shimmer = Shime.new(script.Parent) -- applies to any GuiObject
shimmer:Play()

-- Advanced: Shime.new(parent, time, easingStyle, easingDirection, repeatCount, reverses, delayTime)
local shimmer = Shime.new(script.Parent, 1.5, Enum.EasingStyle.Linear, Enum.EasingDirection.Out, -1, false, 0)
shimmer:Play()

-- Customize:
shimmer:GetFrame() -- returns the internal Frame
shimmer:GetGradient() -- returns the UIGradient for color changes
shimmer:Pause()
shimmer:Stop()
\`\`\`

================================================================================
## 14. COMMON MISTAKES TO AVOID
================================================================================

1. BUTTON INSIDE TOGGLED FRAME: The toggle button becomes invisible when
   the frame is hidden. Always keep toggle buttons OUTSIDE the frame.

2. REFERENCING StarterGui INSTEAD OF PlayerGui: StarterGui is the template.
   At runtime, use player.PlayerGui for the actual live GUI instances.

3. SCALE IN SCROLLINGFRAME CHILDREN: Using Scale for sizes inside a
   ScrollingFrame causes items to resize with CanvasSize. Use Offset.

4. NOT CANCELING PREVIOUS TWEENS: Rapid clicks stack tweens. Always
   cancel/override with the 'true' parameter or track and cancel manually.

5. CLIENT-SIDE CURRENCY: Never validate purchases on the client.
   Exploiters can bypass client checks. Always use RemoteEvents + server validation.

6. PURE BLACK BACKGROUNDS: (0,0,0) looks harsh. Use (20-30, 20-30, 20-30)
   for a softer, more professional dark theme.

7. NOT SETTING ResetOnSpawn: Health bar GUIs need ResetOnSpawn = true
   so they reconnect to the new Humanoid on respawn.

8. SOUND NOT PARENTED: Sounds must be parented to Workspace, SoundService,
   or a visible GUI element to play. Orphaned sounds produce no audio.

9. MISSING AnchorPoint: Without AnchorPoint set, Position refers to
   the top-left corner. Set AnchorPoint = (0.5, 0.5) for centered positioning.

10. FORGETTING TOUCH INPUT: Only checking MouseButton1 ignores mobile.
    Always also check Enum.UserInputType.Touch for mobile compatibility.

11. FAST OPEN/CLOSE BUG: Rapid clicking during tween causes stuck states.
    Use debounce or cancel active tweens before starting new ones:
    \`\`\`lua
    local debounce = false
    button.MouseButton1Click:Connect(function()
        if debounce then return end
        debounce = true
        -- do animation
        task.wait(0.3)
        debounce = false
    end)
    \`\`\`

12. SCROLLBAR OVERLAP: UIGridLayout items can clip into the scrollbar area.
    Add padding to ScrollingFrame or reduce content width by ScrollBarThickness.
`;

// =============================================================================
// Relevance Matcher
// =============================================================================

const UI_SECTION_KEYWORDS: Record<string, string[]> = {
  'TOGGLE BUTTON': [
    'toggle', 'open close', 'open/close', 'show hide', 'show/hide',
    'menu button', 'sidebar', 'panel button', 'open button', 'hamburger',
    'visibility toggle', 'on off', 'switch panel'
  ],
  'CLOSE BUTTON': [
    'close button', 'x button', 'close btn', 'dismiss', 'exit button',
    'close panel', 'close gui', 'close frame', 'close menu', 'close window'
  ],
  'SHOP GUI': [
    'shop', 'store', 'buy', 'purchase', 'sell', 'marketplace', 'vendor',
    'merchant', 'currency', 'coins', 'cash', 'price', 'gamepass',
    'developer product', 'robux', 'in-game shop', 'item shop'
  ],
  'INVENTORY GUI': [
    'inventory', 'backpack', 'bag', 'hotbar', 'slot', 'equip', 'unequip',
    'item grid', 'storage', 'gear', 'loadout', 'toolbar', 'items list',
    'tool bar', 'weapon slot'
  ],
  'HEALTH BAR': [
    'health bar', 'hp bar', 'health gui', 'hit points', 'damage bar',
    'health display', 'health indicator', 'status bar', 'mana bar',
    'stamina bar', 'energy bar', 'progress bar', 'xp bar', 'experience bar'
  ],
  'DRAGGABLE FRAMES': [
    'draggable', 'drag', 'moveable', 'movable', 'resize', 'resizable',
    'window', 'floating', 'reposition', 'move gui', 'drag frame'
  ],
  'NOTIFICATION/TOAST': [
    'notification', 'toast', 'popup', 'alert', 'message popup', 'banner',
    'snackbar', 'announcement', 'info popup', 'warning popup', 'success message',
    'error message', 'notify player'
  ],
  'BUTTON FEEDBACK': [
    'button sound', 'click sound', 'hover effect', 'hover sound', 'press effect',
    'button animation', 'feedback', 'button response', 'click effect',
    'mouse enter', 'mouse leave', 'pulse', 'bounce button'
  ],
  'RESPONSIVE SCALING': [
    'responsive', 'mobile', 'tablet', 'scaling', 'screen size', 'device',
    'resolution', 'viewport', 'UIScale', 'aspect ratio', 'fit all devices',
    'cross-platform', 'adaptive', 'phone'
  ],
  'SCROLLING CONTENT': [
    'scroll', 'scrolling', 'scrollframe', 'ScrollingFrame', 'canvas',
    'list layout', 'grid layout', 'UIGridLayout', 'UIListLayout',
    'overflow', 'scrollbar', 'content list'
  ],
  'ANIMATION BEST PRACTICES': [
    'tween', 'animation', 'animate', 'TweenService', 'slide', 'fade',
    'transition', 'easing', 'smooth', 'motion', 'lerp', 'interpolate',
    'slide in', 'slide out', 'pop in', 'pop out'
  ],
  'COLOR SCHEMES': [
    'color', 'colour', 'theme', 'dark theme', 'light theme', 'palette',
    'color scheme', 'RGB', 'Color3', 'background color', 'accent color',
    'dark mode', 'style', 'design'
  ],
  'UIGRADIENT ANIMATIONS': [
    'gradient', 'UIGradient', 'shimmer', 'glow', 'shine', 'rainbow',
    'loading effect', 'skeleton', 'sparkle', 'gleam'
  ],
  'COMMON MISTAKES': [
    'mistake', 'error', 'bug', 'issue', 'problem', 'fix', 'wrong',
    'not working', 'broken', 'common error', 'pitfall', 'gotcha', 'debug'
  ],
};

/**
 * Returns relevant UI knowledge sections based on the user's prompt.
 * Matches keywords to extract only the sections the AI needs for the current build.
 */
export function getRelevantUIKnowledge(prompt: string): string {
  const lower = prompt.toLowerCase();
  const matchedSections: string[] = [];

  // Always include common mistakes - prevents bad patterns
  let includeMistakes = false;

  for (const [sectionName, keywords] of Object.entries(UI_SECTION_KEYWORDS)) {
    const matches = keywords.some(kw => lower.includes(kw));
    if (matches) {
      if (sectionName === 'COMMON MISTAKES') {
        includeMistakes = true;
      } else {
        matchedSections.push(sectionName);
      }
    }
  }

  // Broad GUI/UI requests get everything
  const isBroadUIRequest = /\b(gui|ui|interface|menu|hud|screen)\b/i.test(prompt)
    && matchedSections.length === 0;

  if (isBroadUIRequest) {
    return UI_DEVFORUM_KNOWLEDGE;
  }

  if (matchedSections.length === 0) {
    return ''; // Not a UI-related prompt
  }

  // Extract matched sections from the knowledge base
  const sections: string[] = [];
  for (const sectionName of matchedSections) {
    const sectionHeader = `## ${/\d+/.test(sectionName) ? sectionName : ''}`;
    // Find section by searching for its title pattern
    const regex = new RegExp(
      `={5,}\\s*\\n## \\d+\\.\\s*${escapeRegex(sectionName)}\\s*\\n={5,}([\\s\\S]*?)(?=\\n={5,}\\s*\\n## \\d+|$)`,
    );
    const match = UI_DEVFORUM_KNOWLEDGE.match(regex);
    if (match) {
      sections.push(match[0]);
    }
  }

  // Always append common mistakes for UI requests
  if (sections.length > 0) {
    const mistakesRegex = /={5,}\s*\n## 14\.\s*COMMON MISTAKES[\s\S]*$/;
    const mistakesMatch = UI_DEVFORUM_KNOWLEDGE.match(mistakesRegex);
    if (mistakesMatch) {
      sections.push(mistakesMatch[0]);
    }
  }

  if (sections.length === 0) {
    // Fallback: return full knowledge if we matched keywords but couldn't extract
    return UI_DEVFORUM_KNOWLEDGE;
  }

  return `[UI/GUI Knowledge — Matched: ${matchedSections.join(', ')}]\n\n${sections.join('\n\n')}`;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\\/]/g, '\\$&');
}
