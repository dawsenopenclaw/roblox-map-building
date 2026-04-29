/**
 * UI/UX Bible — 50+ complete GUI layouts with exact UDim2 positioning,
 * animations, and component library for ForjeGames AI.
 * Teaches the AI how to build professional Roblox GUIs.
 */

// ============================================================
// SECTION 1 — CORE UI/UX BIBLE (overview + philosophy)
// ============================================================
export const UI_UX_BIBLE: string = `
=== FORJEGAMES ROBLOX UI/UX BIBLE ===
Complete reference for professional GUI creation in Roblox Studio.

--- FUNDAMENTAL RULES ---
1. NEVER use BackgroundTransparency=1 on a parent and expect children to be visible — the frame is still there, just invisible, but clips nothing.
2. ALWAYS set BorderSizePixel=0 on every Frame/ImageLabel/TextLabel unless you specifically want a border. The default border is ugly.
3. ALWAYS use UICorner for rounded elements. CornerRadius=UDim.new(0,8) is standard. Use UDim.new(1,0) for circles.
4. ZIndex controls draw order. Higher = on top. Parent ZIndex does NOT automatically propagate to children in all cases — set ZIndex explicitly on important elements.
5. AnchorPoint defines the pivot. AnchorPoint=Vector2.new(0.5,0.5) + Position=UDim2.new(0.5,0,0.5,0) = perfectly centered.
6. Use UDim2.new(scale, offset, scale, offset). Scale is 0-1 (proportion of parent). Offset is pixels.
7. SizeConstraint=Enum.SizeConstraint.RelativeXY (default) — both axes relative to parent.
8. AutomaticSize=Enum.AutomaticSize.Y on frames with UIListLayout lets the frame grow to fit content.
9. ClipsDescendants=true on ScrollingFrame and any frame where children should be cropped.
10. LayoutOrder on children controls sort order inside UIListLayout/UIGridLayout.

--- MODERN UI PRINCIPLES ---
- Dark theme is dominant in Roblox games (dark backgrounds feel premium/immersive)
- Semi-transparent backgrounds (BackgroundTransparency=0.3 to 0.5) with blur feel modern
- Rounded corners everywhere (UICorner CornerRadius=UDim.new(0,8) to UDim.new(0,16))
- Subtle borders via UIStroke (Thickness=1, Color=white at 0.1-0.2 alpha via BackgroundTransparency is not how UIStroke works — UIStroke has its own color)
- Gradients via UIGradient add depth without extra parts
- Padding via UIPadding keeps content from hitting edges (8-16px on all sides)
- Consistent spacing: 4px micro, 8px small, 12px medium, 16px standard, 24px large, 32px section
- Font hierarchy: GothamBold for titles, GothamMedium for labels, Gotham for body
- Text shadow effect: duplicate TextLabel offset by 1-2px, darker color, lower ZIndex

--- CLASS REFERENCE ---
ScreenGui          — root container, parent to PlayerGui. ResetOnSpawn=false for persistent UIs.
Frame              — basic container. Has background color, corner, stroke.
TextLabel          — display text. No interaction.
TextButton         — clickable text. Fires MouseButton1Click.
ImageLabel         — display image. Use ImageColor3 to tint.
ImageButton        — clickable image.
ScrollingFrame     — scrollable container. Set CanvasSize, ScrollBarThickness=6, ScrollBarImageColor3.
UIListLayout       — stacks children vertically or horizontally. Padding between items.
UIGridLayout       — arranges children in a grid. CellSize, CellPadding.
UIPadding          — adds padding inside a frame. PaddingLeft/Right/Top/Bottom as UDim.
UICorner           — rounds corners. CornerRadius as UDim.
UIStroke           — outline/border. Thickness (pixels), Color (Color3), ApplyStrokeMode.
UIGradient         — color/transparency gradient. Color (ColorSequence), Rotation (degrees), Offset (Vector2).
UIAspectRatioConstraint — forces aspect ratio. AspectRatio (number), DominantAxis.
UISizeConstraint   — clamps size. MinSize/MaxSize as Vector2.
ViewportFrame      — renders 3D content inside a 2D frame. Use for item previews.
BillboardGui       — world-space GUI attached to a part. Always faces camera.
SurfaceGui         — GUI rendered on a part's surface.
SelectionBox       — highlights selected parts. Not a GUI class but useful in UI context.

--- UDIM2 CHEAT SHEET ---
Full screen:              UDim2.new(1,0,1,0)
Half width, full height:  UDim2.new(0.5,0,1,0)
300px wide, 50px tall:    UDim2.new(0,300,0,50)
80% wide, auto height:    UDim2.new(0.8,0,0,40) -- fixed pixel height
Top-left corner:          Position=UDim2.new(0,0,0,0), AnchorPoint=Vector2.new(0,0)
Top-right corner:         Position=UDim2.new(1,0,0,0), AnchorPoint=Vector2.new(1,0)
Bottom-left corner:       Position=UDim2.new(0,0,1,0), AnchorPoint=Vector2.new(0,1)
Bottom-right corner:      Position=UDim2.new(1,0,1,0), AnchorPoint=Vector2.new(1,1)
Top-center:               Position=UDim2.new(0.5,0,0,0), AnchorPoint=Vector2.new(0.5,0)
Bottom-center:            Position=UDim2.new(0.5,0,1,0), AnchorPoint=Vector2.new(0.5,1)
Dead center:              Position=UDim2.new(0.5,0,0.5,0), AnchorPoint=Vector2.new(0.5,0.5)
Offset from edge (16px):  Position=UDim2.new(0,16,0,16)

--- TWEENSERVICE ANIMATION SYNTAX ---
local TweenService = game:GetService("TweenService")
local info = TweenInfo.new(
  0.3,                          -- duration in seconds
  Enum.EasingStyle.Quad,        -- easing style (Quad, Cubic, Bounce, Elastic, Back, Sine, Expo, Circ)
  Enum.EasingDirection.Out,     -- direction (In, Out, InOut)
  0,                            -- repeat count (0=once, -1=infinite)
  false,                        -- reverses (true=ping-pong)
  0                             -- delay before start
)
local tween = TweenService:Create(frame, info, {
  Size = UDim2.new(0.4, 0, 0.06, 0),
  Position = UDim2.new(0.5, 0, 0.5, 0),
  BackgroundTransparency = 0,
  BackgroundColor3 = Color3.fromRGB(255,215,0),
})
tween:Play()
tween.Completed:Connect(function() end)

Common easing combos:
- Slide in:    Quad, Out, 0.25s
- Bounce:      Bounce, Out, 0.5s
- Elastic pop: Elastic, Out, 0.4s
- Snap:        Cubic, Out, 0.15s
- Smooth fade: Sine, InOut, 0.3s
- Spring:      Back, Out, 0.35s

--- COLOR PALETTES ---
DARK THEME (default for most games):
  Primary:       Color3.fromRGB(212, 175, 55)   -- gold
  Secondary:     Color3.fromRGB(180, 140, 30)   -- dark gold
  Accent:        Color3.fromRGB(255, 220, 80)   -- bright gold
  Background:    Color3.fromRGB(10, 10, 10)     -- near black
  Surface:       Color3.fromRGB(20, 20, 25)     -- dark surface
  SurfaceRaised: Color3.fromRGB(30, 30, 38)     -- card background
  SurfaceHigh:   Color3.fromRGB(45, 45, 55)     -- elevated element
  Border:        Color3.fromRGB(60, 60, 75)     -- subtle border
  Text:          Color3.fromRGB(240, 240, 240)  -- main text
  TextSecondary: Color3.fromRGB(160, 160, 175)  -- muted text
  TextDisabled:  Color3.fromRGB(90, 90, 105)    -- disabled text
  Success:       Color3.fromRGB(50, 200, 100)   -- green
  Warning:       Color3.fromRGB(255, 180, 30)   -- amber
  Error:         Color3.fromRGB(240, 60, 60)    -- red
  Info:          Color3.fromRGB(60, 140, 255)   -- blue

FANTASY THEME:
  Primary:       Color3.fromRGB(150, 80, 220)   -- purple
  Secondary:     Color3.fromRGB(100, 50, 160)   -- dark purple
  Accent:        Color3.fromRGB(200, 130, 255)  -- light purple
  Background:    Color3.fromRGB(8, 5, 20)       -- deep space purple
  Surface:       Color3.fromRGB(18, 12, 35)
  SurfaceRaised: Color3.fromRGB(28, 20, 50)
  SurfaceHigh:   Color3.fromRGB(42, 30, 70)
  Border:        Color3.fromRGB(80, 50, 120)
  Text:          Color3.fromRGB(235, 225, 255)
  TextSecondary: Color3.fromRGB(170, 150, 210)
  Success:       Color3.fromRGB(80, 220, 160)
  Warning:       Color3.fromRGB(255, 190, 50)
  Error:         Color3.fromRGB(255, 70, 70)
  Info:          Color3.fromRGB(80, 180, 255)

SCI-FI THEME:
  Primary:       Color3.fromRGB(0, 200, 255)    -- cyan
  Secondary:     Color3.fromRGB(0, 140, 200)
  Accent:        Color3.fromRGB(80, 230, 255)
  Background:    Color3.fromRGB(5, 8, 15)       -- deep navy
  Surface:       Color3.fromRGB(10, 15, 28)
  SurfaceRaised: Color3.fromRGB(15, 22, 40)
  SurfaceHigh:   Color3.fromRGB(22, 32, 55)
  Border:        Color3.fromRGB(0, 80, 120)
  Text:          Color3.fromRGB(200, 235, 255)
  TextSecondary: Color3.fromRGB(120, 170, 210)
  Success:       Color3.fromRGB(0, 255, 180)
  Warning:       Color3.fromRGB(255, 200, 0)
  Error:         Color3.fromRGB(255, 50, 80)
  Info:          Color3.fromRGB(100, 150, 255)

HORROR THEME:
  Primary:       Color3.fromRGB(180, 0, 0)      -- blood red
  Secondary:     Color3.fromRGB(120, 0, 0)
  Accent:        Color3.fromRGB(220, 40, 40)
  Background:    Color3.fromRGB(5, 3, 3)        -- near black
  Surface:       Color3.fromRGB(12, 8, 8)
  SurfaceRaised: Color3.fromRGB(20, 13, 13)
  SurfaceHigh:   Color3.fromRGB(30, 18, 18)
  Border:        Color3.fromRGB(60, 25, 25)
  Text:          Color3.fromRGB(220, 200, 200)
  TextSecondary: Color3.fromRGB(150, 120, 120)
  Success:       Color3.fromRGB(100, 180, 80)
  Warning:       Color3.fromRGB(200, 150, 0)
  Error:         Color3.fromRGB(255, 0, 0)
  Info:          Color3.fromRGB(100, 120, 200)

LIGHT THEME (casual/kids):
  Primary:       Color3.fromRGB(80, 140, 255)   -- bright blue
  Secondary:     Color3.fromRGB(50, 100, 220)
  Accent:        Color3.fromRGB(130, 180, 255)
  Background:    Color3.fromRGB(245, 247, 252)  -- off white
  Surface:       Color3.fromRGB(255, 255, 255)
  SurfaceRaised: Color3.fromRGB(240, 243, 250)
  SurfaceHigh:   Color3.fromRGB(225, 230, 245)
  Border:        Color3.fromRGB(200, 210, 230)
  Text:          Color3.fromRGB(20, 25, 40)
  TextSecondary: Color3.fromRGB(90, 100, 130)
  Success:       Color3.fromRGB(40, 180, 80)
  Warning:       Color3.fromRGB(220, 150, 0)
  Error:         Color3.fromRGB(220, 50, 50)
  Info:          Color3.fromRGB(60, 130, 240)

--- TYPOGRAPHY SCALE ---
Title:      TextSize=28, Font=Enum.Font.GothamBold,   TextColor3=Color3.fromRGB(240,240,240)
Heading:    TextSize=22, Font=Enum.Font.GothamBold,   TextColor3=Color3.fromRGB(240,240,240)
Subheading: TextSize=18, Font=Enum.Font.GothamMedium, TextColor3=Color3.fromRGB(220,220,220)
Body:       TextSize=14, Font=Enum.Font.Gotham,       TextColor3=Color3.fromRGB(200,200,200)
Caption:    TextSize=12, Font=Enum.Font.Gotham,       TextColor3=Color3.fromRGB(160,160,175)
Tiny:       TextSize=10, Font=Enum.Font.Gotham,       TextColor3=Color3.fromRGB(120,120,140)
Button:     TextSize=14, Font=Enum.Font.GothamMedium, TextColor3=Color3.fromRGB(255,255,255)
Number:     TextSize=20, Font=Enum.Font.GothamBold,   TextColor3=Color3.fromRGB(212,175,55)
Price:      TextSize=16, Font=Enum.Font.GothamBold,   TextColor3=Color3.fromRGB(255,215,0)

--- RARITY SYSTEM ---
Common:    BorderColor=Color3.fromRGB(180,180,180), GlowColor=Color3.fromRGB(200,200,200)
Uncommon:  BorderColor=Color3.fromRGB(30,200,30),   GlowColor=Color3.fromRGB(50,220,50)
Rare:      BorderColor=Color3.fromRGB(0,100,255),   GlowColor=Color3.fromRGB(30,140,255)
Epic:      BorderColor=Color3.fromRGB(150,0,255),   GlowColor=Color3.fromRGB(180,50,255)
Legendary: BorderColor=Color3.fromRGB(255,185,0),   GlowColor=Color3.fromRGB(255,210,50)
Mythic:    BorderColor=Color3.fromRGB(255,30,30),   GlowColor=Color3.fromRGB(255,80,80)
Divine:    BorderColor=Color3.fromRGB(255,255,100),  GlowColor=Color3.fromRGB(255,255,180)

Rarity border usage:
  UIStroke.Thickness = 2
  UIStroke.Color = (rarity color above)
  UIStroke.ApplyStrokeMode = Enum.ApplyStrokeMode.Border

--- Z-INDEX LAYERING STRATEGY ---
Layer 1  (1-10):   Background, map, world elements (not GUI)
Layer 2  (10-20):  Base HUD panels (health bar background, resource counters)
Layer 3  (20-30):  HUD content (text, icons, bar fills)
Layer 4  (30-50):  Secondary panels (minimap, quest log, chat)
Layer 5  (50-100): Popup panels (shop, inventory, settings)
Layer 6  (100-150): Modal dialogs (confirmations, purchases)
Layer 7  (150-200): Notifications, toasts, floating damage numbers
Layer 8  (200+):   Critical alerts, loading screens, cinematic UI

--- SCROLLINGFRAME SETUP ---
ScrollingFrame properties:
  Size:                    UDim2.new(1,0,1,0)          -- fill parent
  CanvasSize:              UDim2.new(0,0,0,0)           -- start at 0, let UIListLayout auto-resize
  AutomaticCanvasSize:     Enum.AutomaticSize.Y         -- auto-grow canvas
  ScrollBarThickness:      6                            -- thin scrollbar
  ScrollBarImageColor3:    Color3.fromRGB(100,100,120)  -- scrollbar color
  ScrollBarImageTransparency: 0.3
  ScrollingDirection:      Enum.ScrollingDirection.Y    -- vertical scroll
  BackgroundTransparency:  1                            -- invisible background
  BorderSizePixel:         0
  ClipsDescendants:        true                         -- clip content

Inside ScrollingFrame, add UIListLayout:
  UIListLayout.Padding:        UDim.new(0,8)            -- space between items
  UIListLayout.FillDirection:  Enum.FillDirection.Vertical
  UIListLayout.HorizontalAlignment: Enum.HorizontalAlignment.Center
  UIListLayout.SortOrder:      Enum.SortOrder.LayoutOrder

--- MOBILE CONSIDERATIONS ---
Minimum tap target: 44x44 pixels (UDim2.new(0,44,0,44))
Thumb zone (reachable without moving hand): bottom 40% of screen, left and right edges
Safe zones: avoid top 10% (notch), bottom 10% (home bar gesture area)
Use UDim2 scale values so UI adapts to all screen sizes
Test on 768x1024 (tablet) and 390x844 (phone) aspect ratios
Virtual joystick: bottom-left, Size=UDim2.new(0,120,0,120), Position=UDim2.new(0,20,1,-140)
Action buttons: bottom-right, Size=UDim2.new(0,60,0,60), spaced 70px apart
`;

// ============================================================
// SECTION 2 — HUD LAYOUTS
// ============================================================
export const UI_HUD_LAYOUTS: string = `
=== HUD LAYOUTS FOR 10 GAME TYPES ===

--- HUD TYPE 1: TYCOON HUD ---
Purpose: Show money, multiplier, rebirth count, collect button
Layout: Money top-right, multiplier below it, rebirth badge top-left, collect button bottom-center

[MONEY DISPLAY — top right]
Frame "MoneyPanel":
  Parent:               ScreenGui
  Size:                 UDim2.new(0,200,0,50)
  Position:             UDim2.new(1,-216,0,16)
  AnchorPoint:          Vector2.new(0,0)
  BackgroundColor3:     Color3.fromRGB(15,15,20)
  BackgroundTransparency: 0.2
  BorderSizePixel:      0
  ZIndex:               20

  UICorner:
    CornerRadius:       UDim.new(0,10)

  UIStroke:
    Thickness:          1
    Color:              Color3.fromRGB(212,175,55)
    ApplyStrokeMode:    Enum.ApplyStrokeMode.Border

  UIPadding:
    PaddingLeft:        UDim.new(0,10)
    PaddingRight:       UDim.new(0,10)
    PaddingTop:         UDim.new(0,6)
    PaddingBottom:      UDim.new(0,6)

ImageLabel "CoinIcon":
  Parent:               MoneyPanel
  Size:                 UDim2.new(0,28,0,28)
  Position:             UDim2.new(0,0,0.5,0)
  AnchorPoint:          Vector2.new(0,0.5)
  Image:                "rbxassetid://6034684950"   -- coin icon
  BackgroundTransparency: 1
  ZIndex:               21

TextLabel "MoneyAmount":
  Parent:               MoneyPanel
  Size:                 UDim2.new(1,-36,1,0)
  Position:             UDim2.new(0,36,0,0)
  BackgroundTransparency: 1
  Text:                 "$1,250,000"
  TextSize:             20
  Font:                 Enum.Font.GothamBold
  TextColor3:           Color3.fromRGB(255,215,50)
  TextXAlignment:       Enum.TextXAlignment.Right
  TextYAlignment:       Enum.TextYAlignment.Center
  ZIndex:               21

[MULTIPLIER BADGE — below money]
Frame "MultiplierPanel":
  Parent:               ScreenGui
  Size:                 UDim2.new(0,120,0,32)
  Position:             UDim2.new(1,-136,0,74)
  AnchorPoint:          Vector2.new(0,0)
  BackgroundColor3:     Color3.fromRGB(180,80,0)
  BackgroundTransparency: 0.1
  BorderSizePixel:      0
  ZIndex:               20

  UICorner:
    CornerRadius:       UDim.new(0,8)

TextLabel "MultiplierText":
  Parent:               MultiplierPanel
  Size:                 UDim2.new(1,0,1,0)
  Position:             UDim2.new(0,0,0,0)
  BackgroundTransparency: 1
  Text:                 "x2.5 MULTIPLIER"
  TextSize:             13
  Font:                 Enum.Font.GothamBold
  TextColor3:           Color3.fromRGB(255,240,180)
  TextXAlignment:       Enum.TextXAlignment.Center
  TextYAlignment:       Enum.TextYAlignment.Center
  ZIndex:               21

[REBIRTH BADGE — top left]
Frame "RebirthBadge":
  Parent:               ScreenGui
  Size:                 UDim2.new(0,110,0,38)
  Position:             UDim2.new(0,16,0,16)
  AnchorPoint:          Vector2.new(0,0)
  BackgroundColor3:     Color3.fromRGB(80,0,160)
  BackgroundTransparency: 0.1
  BorderSizePixel:      0
  ZIndex:               20

  UICorner:
    CornerRadius:       UDim.new(0,10)

  UIStroke:
    Thickness:          1.5
    Color:              Color3.fromRGB(180,100,255)
    ApplyStrokeMode:    Enum.ApplyStrokeMode.Border

TextLabel "RebirthLabel":
  Parent:               RebirthBadge
  Size:                 UDim2.new(1,0,0.5,0)
  Position:             UDim2.new(0,0,0,0)
  BackgroundTransparency: 1
  Text:                 "REBIRTH"
  TextSize:             10
  Font:                 Enum.Font.GothamBold
  TextColor3:           Color3.fromRGB(200,160,255)
  TextXAlignment:       Enum.TextXAlignment.Center
  ZIndex:               21

TextLabel "RebirthCount":
  Parent:               RebirthBadge
  Size:                 UDim2.new(1,0,0.5,0)
  Position:             UDim2.new(0,0,0.5,0)
  BackgroundTransparency: 1
  Text:                 "VII"
  TextSize:             18
  Font:                 Enum.Font.GothamBold
  TextColor3:           Color3.fromRGB(255,255,255)
  TextXAlignment:       Enum.TextXAlignment.Center
  ZIndex:               21

[COLLECT BUTTON — bottom center, animated]
TextButton "CollectButton":
  Parent:               ScreenGui
  Size:                 UDim2.new(0,220,0,56)
  Position:             UDim2.new(0.5,0,1,-80)
  AnchorPoint:          Vector2.new(0.5,0)
  BackgroundColor3:     Color3.fromRGB(212,175,55)
  BorderSizePixel:      0
  Text:                 "COLLECT $50,000"
  TextSize:             16
  Font:                 Enum.Font.GothamBold
  TextColor3:           Color3.fromRGB(20,15,0)
  ZIndex:               25
  AutoButtonColor:      false   -- handle hover manually

  UICorner:
    CornerRadius:       UDim.new(0,14)

  UIStroke:
    Thickness:          2
    Color:              Color3.fromRGB(255,240,120)
    ApplyStrokeMode:    Enum.ApplyStrokeMode.Border

Collect button pulse animation script (LocalScript):
  local btn = script.Parent
  local TweenService = game:GetService("TweenService")
  local function pulse()
    local grow = TweenService:Create(btn, TweenInfo.new(0.5,Enum.EasingStyle.Sine,Enum.EasingDirection.InOut), {Size=UDim2.new(0,230,0,60)})
    local shrink = TweenService:Create(btn, TweenInfo.new(0.5,Enum.EasingStyle.Sine,Enum.EasingDirection.InOut), {Size=UDim2.new(0,220,0,56)})
    grow:Play()
    grow.Completed:Connect(function() shrink:Play() end)
    shrink.Completed:Connect(function() pulse() end)
  end
  pulse()

--- HUD TYPE 2: RPG HUD ---
Purpose: Health bar, mana bar, XP bar, hotbar, minimap, quest tracker
Layout: Bars bottom-left, hotbar bottom-center, minimap top-right, quest top-left

[HEALTH BAR]
Frame "HealthBarContainer":
  Parent:               ScreenGui
  Size:                 UDim2.new(0,260,0,22)
  Position:             UDim2.new(0,16,1,-120)
  AnchorPoint:          Vector2.new(0,0)
  BackgroundColor3:     Color3.fromRGB(15,15,15)
  BackgroundTransparency: 0.2
  BorderSizePixel:      0
  ZIndex:               20

  UICorner:
    CornerRadius:       UDim.new(0,11)

Frame "HealthBarBackground":
  Parent:               HealthBarContainer
  Size:                 UDim2.new(1,-4,1,-4)
  Position:             UDim2.new(0,2,0,2)
  BackgroundColor3:     Color3.fromRGB(40,0,0)
  BackgroundTransparency: 0
  BorderSizePixel:      0
  ZIndex:               21
  ClipsDescendants:     true

  UICorner:
    CornerRadius:       UDim.new(0,9)

Frame "HealthBarFill":
  Parent:               HealthBarBackground
  Size:                 UDim2.new(0.75,0,1,0)   -- 75% health
  Position:             UDim2.new(0,0,0,0)
  BackgroundColor3:     Color3.fromRGB(220,40,40)
  BackgroundTransparency: 0
  BorderSizePixel:      0
  ZIndex:               22

  UICorner:
    CornerRadius:       UDim.new(0,9)

  UIGradient:
    Color:              ColorSequence.new({
                          ColorSequenceKeypoint.new(0, Color3.fromRGB(255,80,80)),
                          ColorSequenceKeypoint.new(1, Color3.fromRGB(180,20,20))
                        })
    Rotation:           0

TextLabel "HealthText":
  Parent:               HealthBarContainer
  Size:                 UDim2.new(1,0,1,0)
  Position:             UDim2.new(0,0,0,0)
  BackgroundTransparency: 1
  Text:                 "❤  150 / 200"
  TextSize:             12
  Font:                 Enum.Font.GothamBold
  TextColor3:           Color3.fromRGB(255,255,255)
  TextXAlignment:       Enum.TextXAlignment.Center
  TextYAlignment:       Enum.TextYAlignment.Center
  ZIndex:               23

[MANA BAR — below health]
Frame "ManaBarContainer":
  Parent:               ScreenGui
  Size:                 UDim2.new(0,260,0,18)
  Position:             UDim2.new(0,16,1,-94)
  AnchorPoint:          Vector2.new(0,0)
  BackgroundColor3:     Color3.fromRGB(15,15,15)
  BackgroundTransparency: 0.2
  BorderSizePixel:      0
  ZIndex:               20

  UICorner:
    CornerRadius:       UDim.new(0,9)

Frame "ManaBarFill":
  Parent:               ManaBarContainer (inside background frame similar to health)
  Size:                 UDim2.new(0.6,0,1,-4)
  Position:             UDim2.new(0,2,0,2)
  BackgroundColor3:     Color3.fromRGB(40,80,220)
  BorderSizePixel:      0
  ZIndex:               22

  UICorner:
    CornerRadius:       UDim.new(0,7)

  UIGradient:
    Color:              ColorSequence.new({
                          ColorSequenceKeypoint.new(0, Color3.fromRGB(80,140,255)),
                          ColorSequenceKeypoint.new(1, Color3.fromRGB(30,60,200))
                        })

[XP BAR — thin bar at very bottom]
Frame "XPBarContainer":
  Parent:               ScreenGui
  Size:                 UDim2.new(0,260,0,8)
  Position:             UDim2.new(0,16,1,-70)
  AnchorPoint:          Vector2.new(0,0)
  BackgroundColor3:     Color3.fromRGB(20,20,20)
  BackgroundTransparency: 0
  BorderSizePixel:      0
  ZIndex:               20

  UICorner:
    CornerRadius:       UDim.new(0,4)

Frame "XPBarFill":
  Parent:               XPBarContainer
  Size:                 UDim2.new(0.42,0,1,0)   -- 42% to next level
  BackgroundColor3:     Color3.fromRGB(255,200,0)
  BorderSizePixel:      0
  ZIndex:               21

  UICorner:
    CornerRadius:       UDim.new(0,4)

  UIGradient:
    Color:              ColorSequence.new({
                          ColorSequenceKeypoint.new(0, Color3.fromRGB(255,230,80)),
                          ColorSequenceKeypoint.new(1, Color3.fromRGB(200,150,0))
                        })

TextLabel "XPLabel":
  Parent:               ScreenGui
  Size:                 UDim2.new(0,260,0,16)
  Position:             UDim2.new(0,16,1,-82)
  BackgroundTransparency: 1
  Text:                 "Level 24  •  4,200 / 10,000 XP"
  TextSize:             11
  Font:                 Enum.Font.Gotham
  TextColor3:           Color3.fromRGB(160,160,175)
  TextXAlignment:       Enum.TextXAlignment.Left
  ZIndex:               20

[HOTBAR — bottom center]
Frame "Hotbar":
  Parent:               ScreenGui
  Size:                 UDim2.new(0,480,0,64)
  Position:             UDim2.new(0.5,0,1,-80)
  AnchorPoint:          Vector2.new(0.5,0)
  BackgroundColor3:     Color3.fromRGB(15,15,20)
  BackgroundTransparency: 0.2
  BorderSizePixel:      0
  ZIndex:               20

  UICorner:
    CornerRadius:       UDim.new(0,12)

  UIStroke:
    Thickness:          1
    Color:              Color3.fromRGB(60,60,80)
    ApplyStrokeMode:    Enum.ApplyStrokeMode.Border

  UIPadding:
    PaddingLeft:        UDim.new(0,8)
    PaddingRight:       UDim.new(0,8)
    PaddingTop:         UDim.new(0,8)
    PaddingBottom:      UDim.new(0,8)

  UIListLayout:
    FillDirection:      Enum.FillDirection.Horizontal
    Padding:            UDim.new(0,6)
    VerticalAlignment:  Enum.VerticalAlignment.Center
    HorizontalAlignment: Enum.HorizontalAlignment.Center

Hotbar slot (repeat x8):
Frame "Slot1":
  Parent:               Hotbar
  Size:                 UDim2.new(0,48,0,48)
  BackgroundColor3:     Color3.fromRGB(30,30,40)
  BackgroundTransparency: 0
  BorderSizePixel:      0
  ZIndex:               21

  UICorner:
    CornerRadius:       UDim.new(0,8)

  UIStroke:
    Thickness:          1.5
    Color:              Color3.fromRGB(212,175,55)   -- gold for equipped/selected
    ApplyStrokeMode:    Enum.ApplyStrokeMode.Border

  ImageLabel "ItemIcon":
    Size:               UDim2.new(0.75,0,0.75,0)
    Position:           UDim2.new(0.5,0,0.45,0)
    AnchorPoint:        Vector2.new(0.5,0.5)
    BackgroundTransparency: 1
    Image:              "rbxassetid://..."
    ZIndex:             22

  TextLabel "KeybindLabel":
    Size:               UDim2.new(1,0,0,14)
    Position:           UDim2.new(0,0,0,-1)
    BackgroundTransparency: 1
    Text:               "1"
    TextSize:           10
    Font:               Enum.Font.GothamBold
    TextColor3:         Color3.fromRGB(180,180,200)
    TextXAlignment:     Enum.TextXAlignment.Left
    ZIndex:             23

  TextLabel "StackCount":
    Size:               UDim2.new(1,0,0,14)
    Position:           UDim2.new(0,0,1,-13)
    BackgroundTransparency: 1
    Text:               "x12"
    TextSize:           10
    Font:               Enum.Font.GothamBold
    TextColor3:         Color3.fromRGB(255,255,255)
    TextXAlignment:     Enum.TextXAlignment.Right
    ZIndex:             23

[MINIMAP — top right]
Frame "MinimapFrame":
  Parent:               ScreenGui
  Size:                 UDim2.new(0,180,0,180)
  Position:             UDim2.new(1,-196,0,16)
  AnchorPoint:          Vector2.new(0,0)
  BackgroundColor3:     Color3.fromRGB(10,10,15)
  BackgroundTransparency: 0.1
  BorderSizePixel:      0
  ZIndex:               30

  UICorner:
    CornerRadius:       UDim.new(1,0)   -- full circle

  UIStroke:
    Thickness:          2
    Color:              Color3.fromRGB(80,80,100)
    ApplyStrokeMode:    Enum.ApplyStrokeMode.Border

ViewportFrame "MinimapView":
  Parent:               MinimapFrame
  Size:                 UDim2.new(1,-8,1,-8)
  Position:             UDim2.new(0,4,0,4)
  BackgroundTransparency: 1
  ZIndex:               31

  UICorner:
    CornerRadius:       UDim.new(1,0)

ImageLabel "PlayerDot":
  Parent:               MinimapFrame
  Size:                 UDim2.new(0,10,0,10)
  Position:             UDim2.new(0.5,0,0.5,0)
  AnchorPoint:          Vector2.new(0.5,0.5)
  BackgroundTransparency: 1
  Image:                "rbxassetid://6034954897"   -- arrow/dot
  ImageColor3:          Color3.fromRGB(0,200,255)
  ZIndex:               35

[QUEST TRACKER — top left]
Frame "QuestTracker":
  Parent:               ScreenGui
  Size:                 UDim2.new(0,240,0,120)
  Position:             UDim2.new(0,16,0,60)
  AnchorPoint:          Vector2.new(0,0)
  BackgroundColor3:     Color3.fromRGB(12,12,18)
  BackgroundTransparency: 0.2
  BorderSizePixel:      0
  ZIndex:               30

  UICorner:
    CornerRadius:       UDim.new(0,10)

  UIStroke:
    Thickness:          1
    Color:              Color3.fromRGB(212,175,55)
    ApplyStrokeMode:    Enum.ApplyStrokeMode.Border

  UIPadding:
    PaddingLeft:        UDim.new(0,12)
    PaddingRight:       UDim.new(0,12)
    PaddingTop:         UDim.new(0,10)
    PaddingBottom:      UDim.new(0,10)

  UIListLayout:
    FillDirection:      Enum.FillDirection.Vertical
    Padding:            UDim.new(0,6)

TextLabel "QuestTitle":
  Parent:               QuestTracker
  Size:                 UDim2.new(1,0,0,18)
  BackgroundTransparency: 1
  Text:                 "⚔ Defeat the Goblin King"
  TextSize:             13
  Font:                 Enum.Font.GothamBold
  TextColor3:           Color3.fromRGB(255,215,50)
  TextXAlignment:       Enum.TextXAlignment.Left
  ZIndex:               31

TextLabel "QuestProgress1":
  Parent:               QuestTracker
  Size:                 UDim2.new(1,0,0,14)
  BackgroundTransparency: 1
  Text:                 "✓ Collect 10 Goblin Ears (10/10)"
  TextSize:             11
  Font:                 Enum.Font.Gotham
  TextColor3:           Color3.fromRGB(50,200,80)
  TextXAlignment:       Enum.TextXAlignment.Left
  ZIndex:               31

TextLabel "QuestProgress2":
  Parent:               QuestTracker
  Size:                 UDim2.new(1,0,0,14)
  BackgroundTransparency: 1
  Text:                 "◌ Find the Goblin Cave (0/1)"
  TextSize:             11
  Font:                 Enum.Font.Gotham
  TextColor3:           Color3.fromRGB(160,160,175)
  TextXAlignment:       Enum.TextXAlignment.Left
  ZIndex:               31

TextLabel "QuestProgress3":
  Parent:               QuestTracker
  Size:                 UDim2.new(1,0,0,14)
  BackgroundTransparency: 1
  Text:                 "◌ Defeat Goblin King (0/1)"
  TextSize:             11
  Font:                 Enum.Font.Gotham
  TextColor3:           Color3.fromRGB(160,160,175)
  TextXAlignment:       Enum.TextXAlignment.Left
  ZIndex:               31

--- HUD TYPE 3: OBBY HUD ---
Purpose: Stage counter, timer, death count, checkpoint marker
Layout: Stage top-center, timer top-right, deaths top-left

[STAGE DISPLAY — top center, large and clear]
Frame "StageDisplay":
  Parent:               ScreenGui
  Size:                 UDim2.new(0,220,0,54)
  Position:             UDim2.new(0.5,0,0,16)
  AnchorPoint:          Vector2.new(0.5,0)
  BackgroundColor3:     Color3.fromRGB(12,12,18)
  BackgroundTransparency: 0.15
  BorderSizePixel:      0
  ZIndex:               20

  UICorner:
    CornerRadius:       UDim.new(0,12)

  UIStroke:
    Thickness:          2
    Color:              Color3.fromRGB(255,215,50)
    ApplyStrokeMode:    Enum.ApplyStrokeMode.Border

TextLabel "StageLabelSmall":
  Parent:               StageDisplay
  Size:                 UDim2.new(1,0,0.4,0)
  Position:             UDim2.new(0,0,0,6)
  BackgroundTransparency: 1
  Text:                 "STAGE"
  TextSize:             11
  Font:                 Enum.Font.GothamBold
  TextColor3:           Color3.fromRGB(180,160,80)
  TextXAlignment:       Enum.TextXAlignment.Center
  ZIndex:               21

TextLabel "StageNumber":
  Parent:               StageDisplay
  Size:                 UDim2.new(1,0,0.55,0)
  Position:             UDim2.new(0,0,0.4,0)
  BackgroundTransparency: 1
  Text:                 "47 / 100"
  TextSize:             22
  Font:                 Enum.Font.GothamBold
  TextColor3:           Color3.fromRGB(255,235,80)
  TextXAlignment:       Enum.TextXAlignment.Center
  ZIndex:               21

[TIMER — top right]
Frame "TimerPanel":
  Parent:               ScreenGui
  Size:                 UDim2.new(0,130,0,44)
  Position:             UDim2.new(1,-146,0,16)
  AnchorPoint:          Vector2.new(0,0)
  BackgroundColor3:     Color3.fromRGB(12,12,18)
  BackgroundTransparency: 0.15
  BorderSizePixel:      0
  ZIndex:               20

  UICorner:
    CornerRadius:       UDim.new(0,10)

TextLabel "TimerIcon":
  Parent:               TimerPanel
  Size:                 UDim2.new(0,30,1,0)
  Position:             UDim2.new(0,8,0,0)
  BackgroundTransparency: 1
  Text:                 "⏱"
  TextSize:             20
  TextXAlignment:       Enum.TextXAlignment.Left
  TextYAlignment:       Enum.TextYAlignment.Center
  ZIndex:               21

TextLabel "TimerValue":
  Parent:               TimerPanel
  Size:                 UDim2.new(1,-44,1,0)
  Position:             UDim2.new(0,40,0,0)
  BackgroundTransparency: 1
  Text:                 "2:34.71"
  TextSize:             20
  Font:                 Enum.Font.GothamBold
  TextColor3:           Color3.fromRGB(255,255,255)
  TextXAlignment:       Enum.TextXAlignment.Left
  TextYAlignment:       Enum.TextYAlignment.Center
  ZIndex:               21

[DEATHS COUNTER — top left]
Frame "DeathsPanel":
  Parent:               ScreenGui
  Size:                 UDim2.new(0,120,0,44)
  Position:             UDim2.new(0,16,0,16)
  AnchorPoint:          Vector2.new(0,0)
  BackgroundColor3:     Color3.fromRGB(18,8,8)
  BackgroundTransparency: 0.15
  BorderSizePixel:      0
  ZIndex:               20

  UICorner:
    CornerRadius:       UDim.new(0,10)

  UIStroke:
    Thickness:          1
    Color:              Color3.fromRGB(150,30,30)
    ApplyStrokeMode:    Enum.ApplyStrokeMode.Border

TextLabel "DeathsLabel":
  Parent:               DeathsPanel
  Size:                 UDim2.new(1,0,0.45,0)
  Position:             UDim2.new(0,0,0,4)
  BackgroundTransparency: 1
  Text:                 "💀  DEATHS"
  TextSize:             10
  Font:                 Enum.Font.GothamBold
  TextColor3:           Color3.fromRGB(180,80,80)
  TextXAlignment:       Enum.TextXAlignment.Center
  ZIndex:               21

TextLabel "DeathsCount":
  Parent:               DeathsPanel
  Size:                 UDim2.new(1,0,0.5,0)
  Position:             UDim2.new(0,0,0.48,0)
  BackgroundTransparency: 1
  Text:                 "127"
  TextSize:             20
  Font:                 Enum.Font.GothamBold
  TextColor3:           Color3.fromRGB(255,120,120)
  TextXAlignment:       Enum.TextXAlignment.Center
  ZIndex:               21

[CHECKPOINT NOTIFICATION — center screen, brief popup]
Frame "CheckpointPopup":
  Parent:               ScreenGui
  Size:                 UDim2.new(0,280,0,60)
  Position:             UDim2.new(0.5,0,0.25,0)
  AnchorPoint:          Vector2.new(0.5,0)
  BackgroundColor3:     Color3.fromRGB(30,120,40)
  BackgroundTransparency: 0.1
  BorderSizePixel:      0
  ZIndex:               100
  Visible:              false   -- shown via tween when checkpoint hit

  UICorner:
    CornerRadius:       UDim.new(0,14)

TextLabel "CheckpointText":
  Parent:               CheckpointPopup
  Size:                 UDim2.new(1,0,1,0)
  BackgroundTransparency: 1
  Text:                 "✓  CHECKPOINT SAVED!"
  TextSize:             20
  Font:                 Enum.Font.GothamBold
  TextColor3:           Color3.fromRGB(200,255,210)
  TextXAlignment:       Enum.TextXAlignment.Center
  TextYAlignment:       Enum.TextYAlignment.Center
  ZIndex:               101

--- HUD TYPE 4: SIMULATOR HUD ---
Purpose: Resource counters (multiple), boost timer, pet display, rebirth
Layout: Resources top panel, boost bottom-left, pets bottom-right

[RESOURCE COUNTER ROW — top center]
Frame "ResourcePanel":
  Parent:               ScreenGui
  Size:                 UDim2.new(0,420,0,52)
  Position:             UDim2.new(0.5,0,0,12)
  AnchorPoint:          Vector2.new(0.5,0)
  BackgroundColor3:     Color3.fromRGB(12,12,18)
  BackgroundTransparency: 0.15
  BorderSizePixel:      0
  ZIndex:               20

  UICorner:
    CornerRadius:       UDim.new(0,12)

  UIStroke:
    Thickness:          1
    Color:              Color3.fromRGB(50,50,65)
    ApplyStrokeMode:    Enum.ApplyStrokeMode.Border

  UIPadding:
    PaddingLeft:        UDim.new(0,8)
    PaddingRight:       UDim.new(0,8)
    PaddingTop:         UDim.new(0,6)
    PaddingBottom:      UDim.new(0,6)

  UIListLayout:
    FillDirection:      Enum.FillDirection.Horizontal
    Padding:            UDim.new(0,0)
    VerticalAlignment:  Enum.VerticalAlignment.Center
    HorizontalAlignment: Enum.HorizontalAlignment.Center

Resource item (repeat for each resource, equal width):
Frame "CoinsResource":
  Parent:               ResourcePanel
  Size:                 UDim2.new(0.33,0,1,0)
  BackgroundTransparency: 1
  ZIndex:               21

  UIListLayout:
    FillDirection:      Enum.FillDirection.Horizontal
    Padding:            UDim.new(0,4)
    VerticalAlignment:  Enum.VerticalAlignment.Center
    HorizontalAlignment: Enum.HorizontalAlignment.Center

  ImageLabel "Icon":
    Size:               UDim2.new(0,24,0,24)
    BackgroundTransparency: 1
    Image:              "rbxassetid://6034684950"
    ZIndex:             22

  TextLabel "Amount":
    Size:               UDim2.new(0,90,0,30)
    BackgroundTransparency: 1
    Text:               "2.4M"
    TextSize:           16
    Font:               Enum.Font.GothamBold
    TextColor3:         Color3.fromRGB(255,215,50)
    TextXAlignment:     Enum.TextXAlignment.Left
    TextYAlignment:     Enum.TextYAlignment.Center
    ZIndex:             22

[BOOST TIMER — bottom left]
Frame "BoostPanel":
  Parent:               ScreenGui
  Size:                 UDim2.new(0,200,0,70)
  Position:             UDim2.new(0,16,1,-90)
  AnchorPoint:          Vector2.new(0,0)
  BackgroundColor3:     Color3.fromRGB(15,10,30)
  BackgroundTransparency: 0.1
  BorderSizePixel:      0
  ZIndex:               20

  UICorner:
    CornerRadius:       UDim.new(0,12)

  UIStroke:
    Thickness:          1.5
    Color:              Color3.fromRGB(100,50,200)
    ApplyStrokeMode:    Enum.ApplyStrokeMode.Border

TextLabel "BoostTitle":
  Parent:               BoostPanel
  Size:                 UDim2.new(1,0,0,22)
  Position:             UDim2.new(0,0,0,8)
  BackgroundTransparency: 1
  Text:                 "⚡ 2x COINS BOOST"
  TextSize:             13
  Font:                 Enum.Font.GothamBold
  TextColor3:           Color3.fromRGB(180,120,255)
  TextXAlignment:       Enum.TextXAlignment.Center
  ZIndex:               21

Frame "BoostTimerBar":
  Parent:               BoostPanel
  Size:                 UDim2.new(0.9,0,0,8)
  Position:             UDim2.new(0.05,0,0,34)
  BackgroundColor3:     Color3.fromRGB(30,15,50)
  BackgroundTransparency: 0
  BorderSizePixel:      0
  ZIndex:               21

  UICorner:
    CornerRadius:       UDim.new(0,4)

  Frame "BoostFill":
    Size:               UDim2.new(0.65,0,1,0)
    BackgroundColor3:   Color3.fromRGB(130,60,255)
    BorderSizePixel:    0
    ZIndex:             22

    UICorner:
      CornerRadius:     UDim.new(0,4)

TextLabel "BoostTimeLeft":
  Parent:               BoostPanel
  Size:                 UDim2.new(1,0,0,20)
  Position:             UDim2.new(0,0,0,46)
  BackgroundTransparency: 1
  Text:                 "Expires in  4:22"
  TextSize:             12
  Font:                 Enum.Font.Gotham
  TextColor3:           Color3.fromRGB(160,140,200)
  TextXAlignment:       Enum.TextXAlignment.Center
  ZIndex:               21

[PET DISPLAY — bottom right]
Frame "PetDisplay":
  Parent:               ScreenGui
  Size:                 UDim2.new(0,200,0,70)
  Position:             UDim2.new(1,-216,1,-90)
  AnchorPoint:          Vector2.new(0,0)
  BackgroundColor3:     Color3.fromRGB(12,12,18)
  BackgroundTransparency: 0.15
  BorderSizePixel:      0
  ZIndex:               20

  UICorner:
    CornerRadius:       UDim.new(0,12)

  UIListLayout:
    FillDirection:      Enum.FillDirection.Horizontal
    Padding:            UDim.new(0,6)
    VerticalAlignment:  Enum.VerticalAlignment.Center
    HorizontalAlignment: Enum.HorizontalAlignment.Center

Pet slot (x3):
Frame "PetSlot1":
  Parent:               PetDisplay
  Size:                 UDim2.new(0,54,0,54)
  BackgroundColor3:     Color3.fromRGB(25,25,35)
  BorderSizePixel:      0
  ZIndex:               21

  UICorner:
    CornerRadius:       UDim.new(0,10)

  UIStroke:
    Thickness:          2
    Color:              Color3.fromRGB(255,185,0)   -- legendary rarity
    ApplyStrokeMode:    Enum.ApplyStrokeMode.Border

  ImageLabel "PetIcon":
    Size:               UDim2.new(0.8,0,0.8,0)
    Position:           UDim2.new(0.5,0,0.5,0)
    AnchorPoint:        Vector2.new(0.5,0.5)
    BackgroundTransparency: 1
    ZIndex:             22

  TextLabel "PetMultiplier":
    Size:               UDim2.new(1,0,0,14)
    Position:           UDim2.new(0,0,1,-14)
    BackgroundColor3:   Color3.fromRGB(0,0,0)
    BackgroundTransparency: 0.4
    Text:               "x8.5"
    TextSize:           10
    Font:               Enum.Font.GothamBold
    TextColor3:         Color3.fromRGB(255,220,80)
    TextXAlignment:     Enum.TextXAlignment.Center
    ZIndex:             23

    UICorner:
      CornerRadius:     UDim.new(0,4)

--- HUD TYPE 5: HORROR HUD ---
Purpose: Minimal UI, flashlight battery, sanity meter, item hints
Layout: Battery bar bottom-left, sanity indicator subtle top-left, interaction prompt center-bottom

[FLASHLIGHT BATTERY — bottom left, very minimal]
Frame "BatteryHud":
  Parent:               ScreenGui
  Size:                 UDim2.new(0,140,0,32)
  Position:             UDim2.new(0,20,1,-60)
  AnchorPoint:          Vector2.new(0,0)
  BackgroundTransparency: 1
  BorderSizePixel:      0
  ZIndex:               20

TextLabel "BatteryIcon":
  Parent:               BatteryHud
  Size:                 UDim2.new(0,20,1,0)
  Position:             UDim2.new(0,0,0,0)
  BackgroundTransparency: 1
  Text:                 "🔦"
  TextSize:             16
  TextYAlignment:       Enum.TextYAlignment.Center
  ZIndex:               21

Frame "BatteryBarBg":
  Parent:               BatteryHud
  Size:                 UDim2.new(1,-28,0,8)
  Position:             UDim2.new(0,24,0.5,0)
  AnchorPoint:          Vector2.new(0,0.5)
  BackgroundColor3:     Color3.fromRGB(30,30,30)
  BackgroundTransparency: 0.3
  BorderSizePixel:      0
  ZIndex:               21

  UICorner:
    CornerRadius:       UDim.new(0,4)

Frame "BatteryBarFill":
  Parent:               BatteryBarBg
  Size:                 UDim2.new(0.3,0,1,0)   -- 30% battery left — use red
  BackgroundColor3:     Color3.fromRGB(220,40,40)
  BorderSizePixel:      0
  ZIndex:               22

  UICorner:
    CornerRadius:       UDim.new(0,4)

[SANITY METER — top left, very faint]
Frame "SanityFrame":
  Parent:               ScreenGui
  Size:                 UDim2.new(0,120,0,20)
  Position:             UDim2.new(0,20,0,20)
  BackgroundTransparency: 1
  ZIndex:               20

TextLabel "SanityLabel":
  Parent:               SanityFrame
  Size:                 UDim2.new(1,0,1,0)
  BackgroundTransparency: 1
  Text:                 "SANITY: ██████░░░░"
  TextSize:             11
  Font:                 Enum.Font.Gotham
  TextColor3:           Color3.fromRGB(160,100,100)
  TextXAlignment:       Enum.TextXAlignment.Left
  ZIndex:               21

When sanity drops below 30%, add screen-edge vignette:
  Frame "SanityVignette":
    Size:               UDim2.new(1,0,1,0)
    BackgroundTransparency: 1
    UIGradient on parent to make edges dark
    ZIndex:             5
    BackgroundColor3:   Color3.fromRGB(80,0,0)

[INTERACTION PROMPT — center bottom]
Frame "InteractPrompt":
  Parent:               ScreenGui
  Size:                 UDim2.new(0,260,0,48)
  Position:             UDim2.new(0.5,0,1,-90)
  AnchorPoint:          Vector2.new(0.5,0)
  BackgroundColor3:     Color3.fromRGB(10,10,12)
  BackgroundTransparency: 0.2
  BorderSizePixel:      0
  ZIndex:               50
  Visible:              false

  UICorner:
    CornerRadius:       UDim.new(0,10)

  UIStroke:
    Thickness:          1
    Color:              Color3.fromRGB(80,60,60)
    ApplyStrokeMode:    Enum.ApplyStrokeMode.Border

Frame "KeyBadge":
  Parent:               InteractPrompt
  Size:                 UDim2.new(0,32,0,32)
  Position:             UDim2.new(0,12,0.5,0)
  AnchorPoint:          Vector2.new(0,0.5)
  BackgroundColor3:     Color3.fromRGB(50,50,55)
  BorderSizePixel:      0
  ZIndex:               51

  UICorner:
    CornerRadius:       UDim.new(0,6)

  UIStroke:
    Thickness:          1
    Color:              Color3.fromRGB(120,110,110)
    ApplyStrokeMode:    Enum.ApplyStrokeMode.Border

  TextLabel "KeyText":
    Size:               UDim2.new(1,0,1,0)
    BackgroundTransparency: 1
    Text:               "E"
    TextSize:           16
    Font:               Enum.Font.GothamBold
    TextColor3:         Color3.fromRGB(200,200,200)
    TextXAlignment:     Enum.TextXAlignment.Center
    TextYAlignment:     Enum.TextYAlignment.Center
    ZIndex:             52

TextLabel "InteractText":
  Parent:               InteractPrompt
  Size:                 UDim2.new(1,-60,1,0)
  Position:             UDim2.new(0,52,0,0)
  BackgroundTransparency: 1
  Text:                 "Open Locker"
  TextSize:             14
  Font:                 Enum.Font.GothamMedium
  TextColor3:           Color3.fromRGB(200,190,190)
  TextXAlignment:       Enum.TextXAlignment.Left
  TextYAlignment:       Enum.TextYAlignment.Center
  ZIndex:               51

--- HUD TYPE 6: RACING HUD ---
Purpose: Speedometer, lap/position, minimap, lap time, countdown
Layout: Speed bottom-center, position top-left, minimap top-right, lap time top-center

[SPEEDOMETER — bottom center]
Frame "SpeedoFrame":
  Parent:               ScreenGui
  Size:                 UDim2.new(0,180,0,70)
  Position:             UDim2.new(0.5,0,1,-90)
  AnchorPoint:          Vector2.new(0.5,0)
  BackgroundColor3:     Color3.fromRGB(8,8,12)
  BackgroundTransparency: 0.1
  BorderSizePixel:      0
  ZIndex:               20

  UICorner:
    CornerRadius:       UDim.new(0,14)

  UIStroke:
    Thickness:          1.5
    Color:              Color3.fromRGB(0,180,255)
    ApplyStrokeMode:    Enum.ApplyStrokeMode.Border

TextLabel "SpeedValue":
  Parent:               SpeedoFrame
  Size:                 UDim2.new(1,0,0.6,0)
  Position:             UDim2.new(0,0,0.05,0)
  BackgroundTransparency: 1
  Text:                 "187"
  TextSize:             32
  Font:                 Enum.Font.GothamBold
  TextColor3:           Color3.fromRGB(255,255,255)
  TextXAlignment:       Enum.TextXAlignment.Center
  ZIndex:               21

TextLabel "SpeedUnit":
  Parent:               SpeedoFrame
  Size:                 UDim2.new(1,0,0.3,0)
  Position:             UDim2.new(0,0,0.68,0)
  BackgroundTransparency: 1
  Text:                 "KM/H"
  TextSize:             12
  Font:                 Enum.Font.GothamBold
  TextColor3:           Color3.fromRGB(0,180,255)
  TextXAlignment:       Enum.TextXAlignment.Center
  ZIndex:               21

[POSITION DISPLAY — top left]
Frame "PositionFrame":
  Parent:               ScreenGui
  Size:                 UDim2.new(0,120,0,60)
  Position:             UDim2.new(0,16,0,16)
  AnchorPoint:          Vector2.new(0,0)
  BackgroundColor3:     Color3.fromRGB(8,8,12)
  BackgroundTransparency: 0.15
  BorderSizePixel:      0
  ZIndex:               20

  UICorner:
    CornerRadius:       UDim.new(0,12)

TextLabel "PositionNumber":
  Parent:               PositionFrame
  Size:                 UDim2.new(1,0,0.65,0)
  Position:             UDim2.new(0,0,0,6)
  BackgroundTransparency: 1
  Text:                 "2nd"
  TextSize:             28
  Font:                 Enum.Font.GothamBold
  TextColor3:           Color3.fromRGB(220,220,220)
  TextXAlignment:       Enum.TextXAlignment.Center
  ZIndex:               21

TextLabel "LapDisplay":
  Parent:               PositionFrame
  Size:                 UDim2.new(1,0,0.35,0)
  Position:             UDim2.new(0,0,0.65,0)
  BackgroundTransparency: 1
  Text:                 "LAP  2 / 3"
  TextSize:             12
  Font:                 Enum.Font.GothamBold
  TextColor3:           Color3.fromRGB(160,160,175)
  TextXAlignment:       Enum.TextXAlignment.Center
  ZIndex:               21

[RACE COUNTDOWN — center screen, huge]
Frame "CountdownFrame":
  Parent:               ScreenGui
  Size:                 UDim2.new(0,200,0,200)
  Position:             UDim2.new(0.5,0,0.5,0)
  AnchorPoint:          Vector2.new(0.5,0.5)
  BackgroundTransparency: 1
  ZIndex:               200
  Visible:              false

TextLabel "CountdownNumber":
  Parent:               CountdownFrame
  Size:                 UDim2.new(1,0,1,0)
  BackgroundTransparency: 1
  Text:                 "3"
  TextSize:             120
  Font:                 Enum.Font.GothamBold
  TextColor3:           Color3.fromRGB(255,215,50)
  TextXAlignment:       Enum.TextXAlignment.Center
  TextYAlignment:       Enum.TextYAlignment.Center
  ZIndex:               201

--- HUD TYPE 7: FIGHTING HUD ---
Purpose: Health bars (both players), stamina, combo counter, ability cooldowns
Layout: Player health bottom-left, enemy health bottom-right, stamina bar below health, combo center-top

[PLAYER HEALTH BAR — bottom left, wide]
Frame "PlayerHealthOuter":
  Parent:               ScreenGui
  Size:                 UDim2.new(0,320,0,36)
  Position:             UDim2.new(0,20,1,-80)
  AnchorPoint:          Vector2.new(0,0)
  BackgroundColor3:     Color3.fromRGB(10,10,15)
  BackgroundTransparency: 0
  BorderSizePixel:      0
  ZIndex:               20

  UICorner:
    CornerRadius:       UDim.new(0,10)

  UIStroke:
    Thickness:          2
    Color:              Color3.fromRGB(60,60,80)
    ApplyStrokeMode:    Enum.ApplyStrokeMode.Border

Frame "PlayerHealthFill":
  Parent:               PlayerHealthOuter
  Size:                 UDim2.new(0.8,0,0.7,0)
  Position:             UDim2.new(0,3,0.15,0)
  BackgroundColor3:     Color3.fromRGB(60,200,60)
  BorderSizePixel:      0
  ZIndex:               21

  UICorner:
    CornerRadius:       UDim.new(0,7)

  UIGradient:
    Color:              ColorSequence.new({
                          ColorSequenceKeypoint.new(0, Color3.fromRGB(100,255,100)),
                          ColorSequenceKeypoint.new(1, Color3.fromRGB(30,160,30))
                        })

TextLabel "PlayerNameTag":
  Parent:               PlayerHealthOuter
  Size:                 UDim2.new(1,0,1,0)
  Position:             UDim2.new(0,8,0,0)
  BackgroundTransparency: 1
  Text:                 "VYREN  HP: 800/1000"
  TextSize:             13
  Font:                 Enum.Font.GothamBold
  TextColor3:           Color3.fromRGB(255,255,255)
  TextXAlignment:       Enum.TextXAlignment.Left
  TextYAlignment:       Enum.TextYAlignment.Center
  ZIndex:               22

[ENEMY HEALTH BAR — bottom right, mirrored]
Frame "EnemyHealthOuter":
  Parent:               ScreenGui
  Size:                 UDim2.new(0,320,0,36)
  Position:             UDim2.new(1,-340,1,-80)
  AnchorPoint:          Vector2.new(0,0)
  BackgroundColor3:     Color3.fromRGB(10,10,15)
  BackgroundTransparency: 0
  BorderSizePixel:      0
  ZIndex:               20

  UICorner:
    CornerRadius:       UDim.new(0,10)

  Frame "EnemyHealthFill":
    Size:               UDim2.new(0.65,0,0.7,0)
    Position:           UDim2.new(0.35,0,0.15,0)   -- anchored right side fills left
    BackgroundColor3:   Color3.fromRGB(220,40,40)
    BorderSizePixel:    0
    ZIndex:             21

    UICorner:
      CornerRadius:     UDim.new(0,7)

    UIGradient:
      Color:            ColorSequence.new({
                          ColorSequenceKeypoint.new(0, Color3.fromRGB(255,80,80)),
                          ColorSequenceKeypoint.new(1, Color3.fromRGB(160,20,20))
                        })

TextLabel "EnemyNameTag":
  Parent:               EnemyHealthOuter
  Size:                 UDim2.new(1,-8,1,0)
  BackgroundTransparency: 1
  Text:                 "HP: 650/1000  SHADOW KNIGHT"
  TextSize:             13
  Font:                 Enum.Font.GothamBold
  TextColor3:           Color3.fromRGB(255,255,255)
  TextXAlignment:       Enum.TextXAlignment.Right
  TextYAlignment:       Enum.TextYAlignment.Center
  ZIndex:               22

[COMBO COUNTER — center top]
Frame "ComboFrame":
  Parent:               ScreenGui
  Size:                 UDim2.new(0,200,0,70)
  Position:             UDim2.new(0.5,0,0.1,0)
  AnchorPoint:          Vector2.new(0.5,0)
  BackgroundTransparency: 1
  ZIndex:               30
  Visible:              false   -- show when combo > 2

TextLabel "ComboCount":
  Parent:               ComboFrame
  Size:                 UDim2.new(1,0,0.65,0)
  BackgroundTransparency: 1
  Text:                 "12"
  TextSize:             48
  Font:                 Enum.Font.GothamBold
  TextColor3:           Color3.fromRGB(255,215,50)
  TextXAlignment:       Enum.TextXAlignment.Center
  ZIndex:               31

TextLabel "ComboLabel":
  Parent:               ComboFrame
  Size:                 UDim2.new(1,0,0.35,0)
  Position:             UDim2.new(0,0,0.65,0)
  BackgroundTransparency: 1
  Text:                 "HIT COMBO!"
  TextSize:             16
  Font:                 Enum.Font.GothamBold
  TextColor3:           Color3.fromRGB(255,150,50)
  TextXAlignment:       Enum.TextXAlignment.Center
  ZIndex:               31

[ABILITY COOLDOWN ROW — bottom center, above hotbar]
Frame "AbilityRow":
  Parent:               ScreenGui
  Size:                 UDim2.new(0,280,0,60)
  Position:             UDim2.new(0.5,0,1,-155)
  AnchorPoint:          Vector2.new(0.5,0)
  BackgroundTransparency: 1
  ZIndex:               25

  UIListLayout:
    FillDirection:      Enum.FillDirection.Horizontal
    Padding:            UDim.new(0,8)
    HorizontalAlignment: Enum.HorizontalAlignment.Center
    VerticalAlignment:  Enum.VerticalAlignment.Center

Ability slot (x4):
Frame "AbilitySlot1":
  Parent:               AbilityRow
  Size:                 UDim2.new(0,56,0,56)
  BackgroundColor3:     Color3.fromRGB(15,15,20)
  BorderSizePixel:      0
  ZIndex:               26

  UICorner:
    CornerRadius:       UDim.new(0,10)

  UIStroke:
    Thickness:          2
    Color:              Color3.fromRGB(80,80,120)
    ApplyStrokeMode:    Enum.ApplyStrokeMode.Border

  ImageLabel "AbilityIcon":
    Size:               UDim2.new(0.75,0,0.75,0)
    Position:           UDim2.new(0.5,0,0.45,0)
    AnchorPoint:        Vector2.new(0.5,0.5)
    BackgroundTransparency: 1
    ZIndex:             27

  Frame "CooldownOverlay":
    Size:               UDim2.new(1,0,0.6,0)   -- shrinks as cooldown expires (clip with UICorner)
    Position:           UDim2.new(0,0,1,0)
    AnchorPoint:        Vector2.new(0,1)
    BackgroundColor3:   Color3.fromRGB(0,0,0)
    BackgroundTransparency: 0.4
    BorderSizePixel:    0
    ZIndex:             28

    UICorner:
      CornerRadius:     UDim.new(0,10)

  TextLabel "CooldownTimer":
    Size:               UDim2.new(1,0,1,0)
    BackgroundTransparency: 1
    Text:               "3.2"
    TextSize:           14
    Font:               Enum.Font.GothamBold
    TextColor3:         Color3.fromRGB(255,255,255)
    TextXAlignment:     Enum.TextXAlignment.Center
    TextYAlignment:     Enum.TextYAlignment.Center
    ZIndex:             29

--- HUD TYPE 8: TOWER DEFENSE HUD ---
Purpose: Wave indicator, money, lives, selected tower info, build toggle
Layout: Wave/money/lives top bar, tower info bottom-left, build menu right side

[TOP BAR — wave/money/lives]
Frame "TDTopBar":
  Parent:               ScreenGui
  Size:                 UDim2.new(0.7,0,0,52)
  Position:             UDim2.new(0.5,0,0,8)
  AnchorPoint:          Vector2.new(0.5,0)
  BackgroundColor3:     Color3.fromRGB(10,10,15)
  BackgroundTransparency: 0.1
  BorderSizePixel:      0
  ZIndex:               20

  UICorner:
    CornerRadius:       UDim.new(0,12)

  UIStroke:
    Thickness:          1
    Color:              Color3.fromRGB(50,50,70)
    ApplyStrokeMode:    Enum.ApplyStrokeMode.Border

  UIListLayout:
    FillDirection:      Enum.FillDirection.Horizontal
    HorizontalAlignment: Enum.HorizontalAlignment.Center
    VerticalAlignment:  Enum.VerticalAlignment.Center
    Padding:            UDim.new(0,0)

Stat item (repeat x3 — Wave, Money, Lives):
Frame "WaveStat":
  Parent:               TDTopBar
  Size:                 UDim2.new(0.33,0,1,0)
  BackgroundTransparency: 1
  ZIndex:               21

  UIListLayout:
    FillDirection:      Enum.FillDirection.Horizontal
    HorizontalAlignment: Enum.HorizontalAlignment.Center
    VerticalAlignment:  Enum.VerticalAlignment.Center
    Padding:            UDim.new(0,6)

  TextLabel "WaveIcon":
    Size:               UDim2.new(0,22,0,22)
    BackgroundTransparency: 1
    Text:               "🌊"
    TextSize:           18
    TextYAlignment:     Enum.TextYAlignment.Center
    ZIndex:             22

  Frame "WaveTextGroup":
    Size:               UDim2.new(0,80,1,0)
    BackgroundTransparency: 1
    ZIndex:             22

    TextLabel "WaveLabel":
      Size:             UDim2.new(1,0,0.4,0)
      BackgroundTransparency: 1
      Text:             "WAVE"
      TextSize:         10
      Font:             Enum.Font.GothamBold
      TextColor3:       Color3.fromRGB(130,130,155)
      TextXAlignment:   Enum.TextXAlignment.Left
      ZIndex:           23

    TextLabel "WaveValue":
      Size:             UDim2.new(1,0,0.6,0)
      Position:         UDim2.new(0,0,0.4,0)
      BackgroundTransparency: 1
      Text:             "14 / 30"
      TextSize:         16
      Font:             Enum.Font.GothamBold
      TextColor3:       Color3.fromRGB(255,255,255)
      TextXAlignment:   Enum.TextXAlignment.Left
      ZIndex:           23

[SEND WAVE BUTTON — top center right]
TextButton "SendWaveBtn":
  Parent:               ScreenGui
  Size:                 UDim2.new(0,160,0,40)
  Position:             UDim2.new(1,-176,0,18)
  BackgroundColor3:     Color3.fromRGB(220,60,0)
  BorderSizePixel:      0
  Text:                 "⏩ SEND WAVE"
  TextSize:             14
  Font:                 Enum.Font.GothamBold
  TextColor3:           Color3.fromRGB(255,255,255)
  ZIndex:               25

  UICorner:
    CornerRadius:       UDim.new(0,10)

--- HUD TYPE 9: SURVIVAL HUD ---
Purpose: Health, hunger, thirst, temperature, radiation (optional), inventory hotbar
Layout: All status bars bottom-left stacked, hotbar bottom-center

[SURVIVAL STATS PANEL]
Frame "SurvivalStats":
  Parent:               ScreenGui
  Size:                 UDim2.new(0,220,0,150)
  Position:             UDim2.new(0,16,1,-170)
  AnchorPoint:          Vector2.new(0,0)
  BackgroundColor3:     Color3.fromRGB(10,12,10)
  BackgroundTransparency: 0.2
  BorderSizePixel:      0
  ZIndex:               20

  UICorner:
    CornerRadius:       UDim.new(0,12)

  UIPadding:
    PaddingLeft:        UDim.new(0,12)
    PaddingRight:       UDim.new(0,12)
    PaddingTop:         UDim.new(0,10)
    PaddingBottom:      UDim.new(0,10)

  UIListLayout:
    FillDirection:      Enum.FillDirection.Vertical
    Padding:            UDim.new(0,8)
    VerticalAlignment:  Enum.VerticalAlignment.Top

Stat bar template (repeat for Health, Hunger, Thirst, Temperature):
Frame "HealthStat":
  Parent:               SurvivalStats
  Size:                 UDim2.new(1,0,0,22)
  BackgroundTransparency: 1
  ZIndex:               21

  TextLabel "StatIcon":
    Size:               UDim2.new(0,18,1,0)
    Position:           UDim2.new(0,0,0,0)
    BackgroundTransparency: 1
    Text:               "❤"
    TextSize:           14
    TextYAlignment:     Enum.TextYAlignment.Center
    ZIndex:             22

  Frame "StatBarBg":
    Size:               UDim2.new(1,-26,0,10)
    Position:           UDim2.new(0,22,0.5,0)
    AnchorPoint:        Vector2.new(0,0.5)
    BackgroundColor3:   Color3.fromRGB(25,25,25)
    BorderSizePixel:    0
    ZIndex:             22

    UICorner:
      CornerRadius:     UDim.new(0,5)

    Frame "StatFill":
      Size:             UDim2.new(0.75,0,1,0)
      BackgroundColor3: Color3.fromRGB(200,40,40)  -- red for health
      BorderSizePixel:  0
      ZIndex:           23

      UICorner:
        CornerRadius:   UDim.new(0,5)

Colors per stat type:
  Health:      Color3.fromRGB(200,40,40)   -- red
  Hunger:      Color3.fromRGB(180,120,40)  -- orange/brown
  Thirst:      Color3.fromRGB(40,140,220)  -- blue
  Temperature: Color3.fromRGB(220,100,40)  -- warm orange (cold = blue)

--- HUD TYPE 10: IDLE/CLICKER HUD ---
Purpose: Big number display, upgrades sidebar, offline earnings popup, prestige button
Layout: Big number center-top, upgrades scrollable panel right side, click/tap area center

[MAIN RESOURCE DISPLAY — large center top]
Frame "MainCounterFrame":
  Parent:               ScreenGui
  Size:                 UDim2.new(0,380,0,80)
  Position:             UDim2.new(0.5,0,0,10)
  AnchorPoint:          Vector2.new(0.5,0)
  BackgroundColor3:     Color3.fromRGB(12,12,18)
  BackgroundTransparency: 0.1
  BorderSizePixel:      0
  ZIndex:               20

  UICorner:
    CornerRadius:       UDim.new(0,16)

  UIStroke:
    Thickness:          1.5
    Color:              Color3.fromRGB(212,175,55)
    ApplyStrokeMode:    Enum.ApplyStrokeMode.Border

TextLabel "BigNumber":
  Parent:               MainCounterFrame
  Size:                 UDim2.new(1,0,0.6,0)
  Position:             UDim2.new(0,0,0.05,0)
  BackgroundTransparency: 1
  Text:                 "1.47 Septillion"
  TextSize:             28
  Font:                 Enum.Font.GothamBold
  TextColor3:           Color3.fromRGB(255,220,60)
  TextXAlignment:       Enum.TextXAlignment.Center
  ZIndex:               21

TextLabel "PerSecond":
  Parent:               MainCounterFrame
  Size:                 UDim2.new(1,0,0.35,0)
  Position:             UDim2.new(0,0,0.62,0)
  BackgroundTransparency: 1
  Text:                 "per second: 824.5T"
  TextSize:             14
  Font:                 Enum.Font.Gotham
  TextColor3:           Color3.fromRGB(160,155,110)
  TextXAlignment:       Enum.TextXAlignment.Center
  ZIndex:               21

[UPGRADES SIDEBAR — right panel]
Frame "UpgradesSidebar":
  Parent:               ScreenGui
  Size:                 UDim2.new(0,240,0.7,0)
  Position:             UDim2.new(1,0,0.15,0)
  AnchorPoint:          Vector2.new(1,0)
  BackgroundColor3:     Color3.fromRGB(10,10,15)
  BackgroundTransparency: 0.05
  BorderSizePixel:      0
  ZIndex:               20

  UICorner (only left corners — trick via asymmetric frame not natively possible, use full radius):
    CornerRadius:       UDim.new(0,14)

  UIStroke:
    Thickness:          1
    Color:              Color3.fromRGB(45,45,60)
    ApplyStrokeMode:    Enum.ApplyStrokeMode.Border

ScrollingFrame "UpgradesScroll":
  Parent:               UpgradesSidebar
  Size:                 UDim2.new(1,0,1,-50)
  Position:             UDim2.new(0,0,0,50)
  BackgroundTransparency: 1
  BorderSizePixel:      0
  ScrollBarThickness:   4
  ScrollBarImageColor3: Color3.fromRGB(80,80,100)
  AutomaticCanvasSize:  Enum.AutomaticSize.Y
  CanvasSize:           UDim2.new(0,0,0,0)
  ZIndex:               21

  UIPadding:
    PaddingLeft:        UDim.new(0,10)
    PaddingRight:       UDim.new(0,14)
    PaddingTop:         UDim.new(0,8)
    PaddingBottom:      UDim.new(0,8)

  UIListLayout:
    FillDirection:      Enum.FillDirection.Vertical
    Padding:            UDim.new(0,8)

Upgrade card template:
Frame "UpgradeCard":
  Parent:               UpgradesScroll
  Size:                 UDim2.new(1,0,0,72)
  BackgroundColor3:     Color3.fromRGB(18,18,26)
  BorderSizePixel:      0
  ZIndex:               22

  UICorner:
    CornerRadius:       UDim.new(0,10)

  ImageLabel "UpgradeIcon":
    Size:               UDim2.new(0,48,0,48)
    Position:           UDim2.new(0,10,0.5,0)
    AnchorPoint:        Vector2.new(0,0.5)
    BackgroundTransparency: 1
    ZIndex:             23

  TextLabel "UpgradeName":
    Size:               UDim2.new(1,-130,0,22)
    Position:           UDim2.new(0,66,0,10)
    BackgroundTransparency: 1
    Text:               "Auto Clicker"
    TextSize:           13
    Font:               Enum.Font.GothamBold
    TextColor3:         Color3.fromRGB(220,220,230)
    TextXAlignment:     Enum.TextXAlignment.Left
    ZIndex:             23

  TextLabel "UpgradeLevel":
    Size:               UDim2.new(1,-130,0,16)
    Position:           UDim2.new(0,66,0,34)
    BackgroundTransparency: 1
    Text:               "Level 47  •  +2.4T/s"
    TextSize:           11
    Font:               Enum.Font.Gotham
    TextColor3:         Color3.fromRGB(130,130,150)
    TextXAlignment:     Enum.TextXAlignment.Left
    ZIndex:             23

  TextButton "BuyButton":
    Size:               UDim2.new(0,60,0,30)
    Position:           UDim2.new(1,-68,0.5,0)
    AnchorPoint:        Vector2.new(0,0.5)
    BackgroundColor3:   Color3.fromRGB(212,175,55)
    BorderSizePixel:    0
    Text:               "1.2T"
    TextSize:           12
    Font:               Enum.Font.GothamBold
    TextColor3:         Color3.fromRGB(15,12,0)
    ZIndex:             24

    UICorner:
      CornerRadius:     UDim.new(0,8)

[OFFLINE EARNINGS POPUP]
Frame "OfflinePopup":
  Parent:               ScreenGui
  Size:                 UDim2.new(0,320,0,220)
  Position:             UDim2.new(0.5,0,0.5,0)
  AnchorPoint:          Vector2.new(0.5,0.5)
  BackgroundColor3:     Color3.fromRGB(15,15,22)
  BackgroundTransparency: 0
  BorderSizePixel:      0
  ZIndex:               150

  UICorner:
    CornerRadius:       UDim.new(0,18)

  UIStroke:
    Thickness:          2
    Color:              Color3.fromRGB(212,175,55)
    ApplyStrokeMode:    Enum.ApplyStrokeMode.Border

TextLabel "OfflineTitle":
  Parent:               OfflinePopup
  Size:                 UDim2.new(1,0,0,40)
  Position:             UDim2.new(0,0,0,16)
  BackgroundTransparency: 1
  Text:                 "Welcome Back!"
  TextSize:             22
  Font:                 Enum.Font.GothamBold
  TextColor3:           Color3.fromRGB(255,215,50)
  TextXAlignment:       Enum.TextXAlignment.Center
  ZIndex:               151

TextLabel "OfflineSubtitle":
  Parent:               OfflinePopup
  Size:                 UDim2.new(1,0,0,24)
  Position:             UDim2.new(0,0,0,56)
  BackgroundTransparency: 1
  Text:                 "You were gone for  3h 27m"
  TextSize:             14
  Font:                 Enum.Font.Gotham
  TextColor3:           Color3.fromRGB(160,160,175)
  TextXAlignment:       Enum.TextXAlignment.Center
  ZIndex:               151

TextLabel "EarningsAmount":
  Parent:               OfflinePopup
  Size:                 UDim2.new(1,0,0,50)
  Position:             UDim2.new(0,0,0,90)
  BackgroundTransparency: 1
  Text:                 "+  8.42 Quadrillion"
  TextSize:             28
  Font:                 Enum.Font.GothamBold
  TextColor3:           Color3.fromRGB(80,220,80)
  TextXAlignment:       Enum.TextXAlignment.Center
  ZIndex:               151

TextButton "CollectOfflineBtn":
  Parent:               OfflinePopup
  Size:                 UDim2.new(0.7,0,0,48)
  Position:             UDim2.new(0.15,0,1,-64)
  BackgroundColor3:     Color3.fromRGB(212,175,55)
  BorderSizePixel:      0
  Text:                 "COLLECT EARNINGS"
  TextSize:             16
  Font:                 Enum.Font.GothamBold
  TextColor3:           Color3.fromRGB(15,12,0)
  ZIndex:               152

  UICorner:
    CornerRadius:       UDim.new(0,12)
`;

// ============================================================
// SECTION 3 — SHOP / STORE LAYOUTS
// ============================================================
export const UI_SHOP_LAYOUTS: string = `
=== SHOP & STORE LAYOUTS ===

--- SHOP LAYOUT 1: GRID SHOP (3x4 items) ---
Standard shop: category tabs, item grid, purchase modal.

[SHOP CONTAINER — full screen overlay]
Frame "ShopBackground":
  Size:                 UDim2.new(1,0,1,0)
  BackgroundColor3:     Color3.fromRGB(0,0,0)
  BackgroundTransparency: 0.5
  ZIndex:               50

Frame "ShopPanel":
  Size:                 UDim2.new(0,720,0,540)
  Position:             UDim2.new(0.5,0,0.5,0)
  AnchorPoint:          Vector2.new(0.5,0.5)
  BackgroundColor3:     Color3.fromRGB(14,14,20)
  BackgroundTransparency: 0
  BorderSizePixel:      0
  ZIndex:               51
  UICorner CornerRadius: UDim.new(0,18)
  UIStroke Thickness:   1.5, Color: Color3.fromRGB(55,55,75)

[SHOP HEADER — top 60px of panel]
Frame "ShopHeader":
  Size:                 UDim2.new(1,0,0,60)
  BackgroundColor3:     Color3.fromRGB(18,18,26)
  ZIndex:               52
  UICorner CornerRadius: UDim.new(0,18)
  UIGradient Rotation:  90, Color: ColorSequence dark purple to surface

TextLabel "ShopTitle":
  Size:                 UDim2.new(1,-220,1,0)
  Position:             UDim2.new(0,20,0,0)
  Text:                 "ITEM SHOP"
  TextSize:             22
  Font:                 Enum.Font.GothamBold
  TextColor3:           Color3.fromRGB(255,215,50)
  TextXAlignment:       Enum.TextXAlignment.Left
  TextYAlignment:       Enum.TextYAlignment.Center
  ZIndex:               53

Frame "CurrencyDisplay":
  Size:                 UDim2.new(0,160,0,36)
  Position:             UDim2.new(1,-210,0.5,0)
  AnchorPoint:          Vector2.new(0,0.5)
  BackgroundColor3:     Color3.fromRGB(25,22,10)
  ZIndex:               53
  UICorner CornerRadius: UDim.new(0,10)
  UIStroke Color:       Color3.fromRGB(150,120,20), Thickness: 1
  UIListLayout Horizontal, Padding: UDim.new(0,6), centered

  ImageLabel "CoinIcon": Size=UDim2.new(0,22,0,22), BackgroundTransparency=1
  TextLabel "CoinAmt":   Text="12,450", TextSize=16, Font=GothamBold, TextColor3=Color3.fromRGB(255,215,50)

TextButton "CloseBtn":
  Size:                 UDim2.new(0,36,0,36)
  Position:             UDim2.new(1,-48,0.5,0)
  AnchorPoint:          Vector2.new(0,0.5)
  BackgroundColor3:     Color3.fromRGB(60,25,25)
  Text:                 "x"
  TextColor3:           Color3.fromRGB(255,120,120)
  Font:                 Enum.Font.GothamBold
  UICorner CornerRadius: UDim.new(0,8)
  ZIndex:               53

[LIMITED TIME OFFER BANNER — below header if active]
Frame "LimitedBanner":
  Size:                 UDim2.new(1,-24,0,36)
  Position:             UDim2.new(0,12,0,66)
  BackgroundColor3:     Color3.fromRGB(160,40,0)
  ZIndex:               53
  UICorner CornerRadius: UDim.new(0,10)
  UIGradient Rotation:  45, warm red gradient

  TextLabel "LimitedText":  Text="LIMITED SALE — 50% OFF ALL WEAPONS"
    TextSize=13, Font=GothamBold, TextColor3=Color3.fromRGB(255,240,200)
    TextXAlignment=Left, offset 44px from left for icon
  TextLabel "TimerText":    Text="Ends in 02:14:38"
    Position right side, TextColor3=Color3.fromRGB(255,220,150)

[CATEGORY TABS — horizontal row]
Frame "CategoryTabs":
  Size:                 UDim2.new(1,0,0,44)
  Position:             UDim2.new(0,0,0,108)  -- shifts down if banner active
  BackgroundColor3:     Color3.fromRGB(12,12,18)
  ZIndex:               52
  UIListLayout Horizontal, Padding=UDim.new(0,2), Left-aligned, UIPadding PaddingLeft=12

TextButton "TabActive":   Size=UDim2.new(0,110,0,32), BackgroundColor3=Color3.fromRGB(212,175,55)
  TextColor3=dark, Font=GothamBold, UICorner=8
TextButton "TabInactive": Size=UDim2.new(0,100,0,32), BackgroundColor3=Color3.fromRGB(25,25,35)
  TextColor3=Color3.fromRGB(160,160,175), Font=GothamMedium, UICorner=8

[ITEM GRID — 3 columns, scrollable]
ScrollingFrame "ItemGrid":
  Size:                 UDim2.new(1,-24,1,-168)
  Position:             UDim2.new(0,12,0,160)
  BackgroundTransparency: 1
  ScrollBarThickness:   5, ScrollBarImageColor3=Color3.fromRGB(80,80,100)
  AutomaticCanvasSize:  Enum.AutomaticSize.Y
  ZIndex:               52

  UIGridLayout:
    CellSize:           UDim2.new(0,210,0,180)
    CellPadding:        UDim2.new(0,12,0,12)
    HorizontalAlignment: Enum.HorizontalAlignment.Center

Item Card:
Frame "ItemCard":
  Size:                 UDim2.new(0,210,0,180)
  BackgroundColor3:     Color3.fromRGB(20,20,30)
  UICorner CornerRadius: UDim.new(0,12)
  UIStroke Thickness:   1.5, Color=rarity color (see rarity system)
  ZIndex:               53

  ImageLabel "ItemPreview":
    Size:               UDim2.new(1,0,0.55,0)
    BackgroundColor3:   Color3.fromRGB(15,15,22)
    UICorner CornerRadius: UDim.new(0,12)
    ZIndex:             54

  Frame "RarityBar":    Size=UDim2.new(1,0,0,4), Position=UDim2.new(0,0,0.55,0)
    BackgroundColor3=rarity color, ZIndex=55

  TextLabel "ItemName":
    Size:               UDim2.new(1,-16,0,22)
    Position:           UDim2.new(0,8,0.59,0)
    TextSize:           14, Font=GothamBold, TextColor3=white, TextXAlignment=Left
    ZIndex:             54

  TextLabel "RarityTag":
    Size:               UDim2.new(1,-16,0,16)
    Position:           UDim2.new(0,8,0.74,0)
    TextSize:           11, Font=GothamMedium, TextColor3=rarity color
    ZIndex:             54

  TextButton "BuyBtn":
    Size:               UDim2.new(1,-16,0,32)
    Position:           UDim2.new(0,8,1,-40)
    BackgroundColor3:   Color3.fromRGB(212,175,55)
    Text:               "2,500", TextSize=14, Font=GothamBold
    TextColor3:         Color3.fromRGB(15,12,0)
    UICorner CornerRadius: UDim.new(0,8)
    ZIndex:             55

  Frame "OwnedOverlay": BackgroundTransparency=0.4, black, UICorner=12, Visible=false
    TextLabel "OWNED": TextColor3=green, TextSize=18, centered

[PURCHASE CONFIRMATION MODAL]
Frame "PurchaseModal":
  Size:                 UDim2.new(0,380,0,260)
  Position:             UDim2.new(0.5,0,0.5,0)
  AnchorPoint:          Vector2.new(0.5,0.5)
  BackgroundColor3:     Color3.fromRGB(16,16,22)
  ZIndex:               160
  UICorner CornerRadius: UDim.new(0,18)
  UIStroke Color:       Color3.fromRGB(212,175,55), Thickness=2

  TextLabel "Title":    "Confirm Purchase", TextSize=20, GothamBold, white, center
  TextLabel "ItemName": item + rarity, TextSize=16, rarity color, center
  TextLabel "Price":    "2,500 Coins", TextSize=24, GothamBold, gold, center
  TextLabel "Balance":  "Balance after: 9,950", TextSize=13, dim, center

  TextButton "ConfirmBtn":
    Size:               UDim2.new(0.42,0,0,44)
    Position:           UDim2.new(0.06,0,1,-60)
    BackgroundColor3:   Color3.fromRGB(50,180,80)
    Text:               "CONFIRM", Font=GothamBold, TextColor3=white
    UICorner CornerRadius: UDim.new(0,10)

  TextButton "CancelBtn":
    Size:               UDim2.new(0.42,0,0,44)
    Position:           UDim2.new(0.52,0,1,-60)
    BackgroundColor3:   Color3.fromRGB(50,30,30)
    Text:               "CANCEL", TextColor3=Color3.fromRGB(200,100,100)
    UICorner CornerRadius: UDim.new(0,10)
    UIStroke Color:     Color3.fromRGB(150,50,50), Thickness=1

[BUNDLE DEAL POPUP]
Frame "BundlePopup":
  Size:                 UDim2.new(0,480,0,360)
  Position:             UDim2.new(0.5,0,0.5,0)
  AnchorPoint:          Vector2.new(0.5,0.5)
  BackgroundColor3:     Color3.fromRGB(12,10,25)
  ZIndex:               170
  UICorner CornerRadius: UDim.new(0,20)
  UIStroke Color:       Color3.fromRGB(255,185,0), Thickness=2.5

  Frame "GoldTopBar":   Size=UDim2.new(1,0,0,5), BackgroundColor3=Color3.fromRGB(255,185,0), ZIndex=171
  TextLabel "BundleLabel": "EXCLUSIVE BUNDLE", TextSize=11, GothamBold, gold, center
  TextLabel "BundleTitle": "Starter Hero Pack", TextSize=26, GothamBold, white, center

  Frame "ItemsRow":     Size=UDim2.new(0.9,0,0,100), UIListLayout Horizontal, centered
    Bundle item cards (x4): Size=UDim2.new(0,85,0,90), UICorner=10, UIStroke=rarity
      ImageLabel for item icon, TextLabel for name at bottom

  TextLabel "OriginalPrice": "Value: 10,000" with strikethrough decoration, dim red
  TextLabel "BundlePrice":   "4,500  (55% OFF)", TextSize=26, green

  TextButton "BuyBundleBtn":
    Size:               UDim2.new(0.6,0,0,50)
    Position:           UDim2.new(0.2,0,1,-68)
    BackgroundColor3:   Color3.fromRGB(212,175,55)
    Text:               "BUY BUNDLE", TextSize=18, GothamBold
    UICorner CornerRadius: UDim.new(0,14)

  TextButton "SkipBtn": "No thanks", TextColor3=dim gray, BackgroundTransparency=1

[DAILY DEALS ROTATION]
Frame "DailyDealsPanel":
  Size:                 UDim2.new(0,680,0,200)
  Position:             UDim2.new(0.5,0,0.5,0)
  AnchorPoint:          Vector2.new(0.5,0.5)
  BackgroundColor3:     Color3.fromRGB(14,14,20)
  ZIndex:               51
  UICorner CornerRadius: UDim.new(0,16)

  TextLabel "DailyTitle": "DAILY DEALS", gold, GothamBold, TextSize=18
  TextLabel "RefreshTimer": "Refreshes in 11:42:18", dim, right-aligned

  Frame "DealsRow":     Size=UDim2.new(1,-24,0,130), Position=UDim2.new(0,12,0,50)
    UIListLayout Horizontal, Padding=UDim.new(0,10)

    Daily deal card (x4): Size=UDim2.new(0,148,1,0)
      BackgroundColor3=Color3.fromRGB(18,18,26), UICorner=12
      ImageLabel item preview (top 60%)
      TextLabel "DiscountBadge": "-30%", Position top-right, BackgroundColor3=red, UICorner=6
        TextSize=12, Font=GothamBold, TextColor3=white, Size=UDim2.new(0,44,0,22)
      TextLabel itemName, TextLabel priceStruck, TextLabel newPrice (green)
      TextButton "BuyDeal": green button, full width bottom
`;

// ============================================================
// SECTION 4 — INVENTORY SYSTEMS
// ============================================================
export const UI_INVENTORY: string = `
=== INVENTORY SYSTEMS ===

--- FULL INVENTORY PANEL: 4x7 GRID + EQUIPMENT PAPER-DOLL ---

[WRAPPER]
Frame "InventoryBG":    Size=UDim2.new(1,0,1,0), BackgroundTransparency=0.5, black, ZIndex=50
Frame "InventoryPanel":
  Size:                 UDim2.new(0,780,0,540)
  Position:             UDim2.new(0.5,0,0.5,0)
  AnchorPoint:          Vector2.new(0.5,0.5)
  BackgroundColor3:     Color3.fromRGB(14,14,20)
  ZIndex:               51
  UICorner CornerRadius: UDim.new(0,18)
  UIStroke Color:       Color3.fromRGB(50,50,68), Thickness=1.5

[LEFT PANEL: PAPER-DOLL EQUIPMENT — 240px wide]
Frame "EquipmentSide":
  Size:                 UDim2.new(0,240,1,0)
  BackgroundColor3:     Color3.fromRGB(10,10,16)
  ZIndex:               52
  UICorner CornerRadius: UDim.new(0,18)

TextLabel "EquipTitle":
  Size:                 UDim2.new(1,0,0,44)
  Text:                 "EQUIPMENT"
  TextSize:             13, Font=GothamBold
  TextColor3:           Color3.fromRGB(160,160,180)
  TextXAlignment:       Center, TextYAlignment: Center

ViewportFrame "CharPreview":
  Size:                 UDim2.new(0.8,0,0.35,0)
  Position:             UDim2.new(0.1,0,0.1,0)
  BackgroundColor3:     Color3.fromRGB(18,18,26)
  UICorner CornerRadius: UDim.new(0,12)
  (renders player character)

Equipment Slots (position relative to EquipmentSide):
Each slot: Size=UDim2.new(0,50,0,50), BackgroundColor3=Color3.fromRGB(22,22,32)
           UICorner CornerRadius=UDim.new(0,10), UIStroke Thickness=1.5 (color = rarity of item)
           Contains: ImageLabel for item icon, TextLabel for slot name (10px, bottom)

Slot positions (all anchored at 0,0):
  HeadSlot:      Position=UDim2.new(0.5,-25,0.08,0)       -- top center
  ChestSlot:     Position=UDim2.new(0.5,-25,0.30,0)       -- chest center
  BellySlot:     Position=UDim2.new(0.5,-25,0.50,0)       -- mid center
  LegsSlot:      Position=UDim2.new(0.5,-25,0.68,0)       -- lower center
  WeaponSlot:    Position=UDim2.new(0.05,0,0.34,0)         -- left arm
  OffhandSlot:   Position=UDim2.new(0.72,0,0.34,0)         -- right arm
  Ring1Slot:     Position=UDim2.new(0.05,0,0.55,0)
  Ring2Slot:     Position=UDim2.new(0.72,0,0.55,0)

Frame "StatsSummary":
  Size:                 UDim2.new(0.9,0,0,110)
  Position:             UDim2.new(0.05,0,0.72,0)
  BackgroundColor3:     Color3.fromRGB(16,16,24)
  UICorner CornerRadius: UDim.new(0,10)
  UIPadding all sides:  UDim.new(0,10)
  UIListLayout Vertical, Padding=UDim.new(0,4)

  Stat rows (ATK, DEF, SPD, HP, CRIT):
  Each row is Frame Size=UDim2.new(1,0,0,18) containing:
    TextLabel left: stat name, TextSize=12, GothamBold, dim color
    TextLabel right: stat value, TextSize=12, GothamBold, gold color

[RIGHT PANEL: ITEM GRID — fills remainder]
Frame "ItemGridSide":
  Size:                 UDim2.new(1,-240,1,0)
  Position:             UDim2.new(0,240,0,0)
  BackgroundTransparency: 1
  ZIndex:               52

[TOOLBAR: SEARCH + SORT + CAPACITY]
Frame "InventoryToolbar":
  Size:                 UDim2.new(1,0,0,48)
  BackgroundTransparency: 1
  ZIndex:               53
  UIPadding Left=12, Right=12, Top=8
  UIListLayout Horizontal, Padding=UDim.new(0,8), VerticalAlignment=Center

Frame "SearchBar":
  Size:                 UDim2.new(0,200,0,32)
  BackgroundColor3:     Color3.fromRGB(22,22,30)
  UICorner CornerRadius: UDim.new(0,8)
  UIStroke Color:       Color3.fromRGB(50,50,65), Thickness=1
  ZIndex:               54

  TextLabel "SearchIcon": Position left, Text="", TextSize=14, ZIndex=55
  TextBox "SearchInput":
    Size=UDim2.new(1,-30,1,0), Position=UDim2.new(0,28,0,0)
    PlaceholderText="Search items...", PlaceholderColor3=dim gray
    TextSize=13, Font=Gotham, ClearTextOnFocus=false
    ZIndex:             55

TextButton "SortBtn":
  Size:                 UDim2.new(0,110,0,32)
  BackgroundColor3:     Color3.fromRGB(22,22,30)
  Text:                 "Sort: Rarity v"
  TextSize:             12, Font=GothamMedium
  UICorner CornerRadius: UDim.new(0,8)

TextLabel "CapacityText":
  Size:                 UDim2.new(0,120,0,32)
  Text:                 "45 / 100 slots"
  TextSize:             12, TextColor3=dim, TextXAlignment=Right

[GRID SCROLL — fills remaining height]
ScrollingFrame "InvScroll":
  Size:                 UDim2.new(1,-12,1,-56)
  Position:             UDim2.new(0,6,0,50)
  BackgroundTransparency: 1
  ScrollBarThickness:   5, ScrollBarImageColor3=dim
  AutomaticCanvasSize:  Enum.AutomaticSize.Y
  ZIndex:               53

  UIGridLayout:
    CellSize:           UDim2.new(0,72,0,72)
    CellPadding:        UDim2.new(0,8,0,8)
    HorizontalAlignment: Enum.HorizontalAlignment.Left

  UIPadding Left=6, Top=6, Bottom=6

Inventory Slot (repeat for each item):
Frame "InvSlot":
  Size:                 UDim2.new(0,72,0,72)
  BackgroundColor3:     Color3.fromRGB(20,20,28)
  UICorner CornerRadius: UDim.new(0,10)
  UIStroke Thickness:   1.5, Color=rarity color
  ZIndex:               54

  ImageLabel "ItemImg":
    Size:               UDim2.new(0.75,0,0.75,0)
    Position:           UDim2.new(0.5,0,0.45,0)
    AnchorPoint:        Vector2.new(0.5,0.5)
    BackgroundTransparency: 1
    ZIndex:             55

  TextLabel "StackCount":
    Size:               UDim2.new(1,-4,0,16)
    Position:           UDim2.new(0,2,1,-16)
    BackgroundColor3:   Color3.fromRGB(0,0,0), BackgroundTransparency=0.45
    Text:               "x5", TextSize=11, Font=GothamBold, white, right-aligned
    UICorner CornerRadius: UDim.new(0,5)
    ZIndex:             56

  Frame "EquippedDot":
    Size:               UDim2.new(0,10,0,10)
    Position:           UDim2.new(0,3,0,3)
    BackgroundColor3:   Color3.fromRGB(80,220,80)
    UICorner CornerRadius: UDim.new(1,0)
    Visible:            false  -- show when equipped
    ZIndex:             56

[ITEM TOOLTIP — follows mouse cursor]
Frame "Tooltip":
  Size:                 UDim2.new(0,220,0,200)
  BackgroundColor3:     Color3.fromRGB(15,15,22)
  BorderSizePixel:      0
  ZIndex:               200
  Visible:              false
  UICorner CornerRadius: UDim.new(0,12)
  UIStroke Color:       rarity-based color, Thickness=1.5
  UIPadding all:        UDim.new(0,12)
  UIListLayout Vertical, Padding=UDim.new(0,5)

Tooltip children (in order):
  TextLabel "TipName":    TextSize=16, GothamBold, white
  TextLabel "TipRarity":  TextSize=12, GothamMedium, rarity color
  Frame "Divider1":       Size=UDim2.new(1,0,0,1), BackgroundColor3=Color3.fromRGB(50,50,65)
  TextLabel "TipDesc":    TextSize=12, Gotham, TextColor3=dim, TextWrapped=true
  Frame "Divider2":       same
  TextLabel "TipStats":   TextSize=12, GothamMedium, white (multiline stats)
  TextButton "TipEquip":  Size=UDim2.new(1,0,0,30), BackgroundColor3=green, "EQUIP", GothamBold

Tooltip script pattern:
  MouseEnter on each slot -> show tooltip at mouse pos
  MouseLeave on each slot -> hide tooltip
  Track with UserInputService.InputChanged for mouse position
  Clamp to viewport: x=math.min(mouseX+16, viewW-236), y=math.min(mouseY+16, viewH-216)

[DRAG AND DROP PATTERN]
OnMouseButton1Down: record dragItem, create drag ghost frame following cursor
OnMouseButton1Up: detect target slot, swap items, destroy ghost
Ghost frame: same size as slot (72x72), BackgroundTransparency=0.5, ZIndex=300
Swap logic: if target slot has item -> swap; if empty -> move; if same slot -> cancel
Visual feedback: target slot gets UIStroke highlight (cyan, Thickness=2) on hover
`;

// ============================================================
// SECTION 5 — SOCIAL UI
// ============================================================
export const UI_SOCIAL: string = `
=== SOCIAL UI COMPONENTS ===

--- LEADERBOARD PANEL ---
Frame "LeaderboardPanel":
  Size:                 UDim2.new(0,320,0,480)
  Position:             UDim2.new(1,0,0.5,0)
  AnchorPoint:          Vector2.new(0,0.5)
  BackgroundColor3:     Color3.fromRGB(12,12,18)
  ZIndex:               40
  UICorner CornerRadius: UDim.new(0,16)
  UIStroke Color:       Color3.fromRGB(50,50,68), Thickness=1.5

TextLabel "LBTitle":
  Size:                 UDim2.new(1,0,0,48)
  Text:                 "LEADERBOARD"
  TextSize:             18, Font=GothamBold
  TextColor3:           Color3.fromRGB(255,215,50)
  TextXAlignment:       Center, TextYAlignment: Center
  ZIndex:               41

Frame "TabRow":
  Size:                 UDim2.new(1,0,0,36)
  Position:             UDim2.new(0,0,0,48)
  BackgroundColor3:     Color3.fromRGB(10,10,16)
  UIListLayout Horizontal, centered, Padding=UDim.new(0,4)
  UIPadding Left=8

  TextButton "AllTimeTab":  active style, Size=UDim2.new(0,90,0,28)
  TextButton "WeeklyTab":   inactive style
  TextButton "FriendsTab":  inactive style

ScrollingFrame "LBScroll":
  Size:                 UDim2.new(1,0,1,-90)
  Position:             UDim2.new(0,0,0,90)
  BackgroundTransparency: 1
  ScrollBarThickness:   4
  AutomaticCanvasSize:  Enum.AutomaticSize.Y
  ZIndex:               41
  UIPadding Left=10, Right=14, Top=6, Bottom=6
  UIListLayout Vertical, Padding=UDim.new(0,4)

Leaderboard row (repeat, alternating bg):
Frame "LBRow1":
  Size:                 UDim2.new(1,0,0,52)
  BackgroundColor3:     Color3.fromRGB(18,18,26)  -- odd rows
  UICorner CornerRadius: UDim.new(0,10)
  ZIndex:               42

  TextLabel "RankNum":
    Size:               UDim2.new(0,36,1,0)
    Position:           UDim2.new(0,8,0,0)
    Text:               "1"
    TextSize:           18, Font=GothamBold
    TextColor3:         Color3.fromRGB(255,215,50)  -- gold for 1st
    TextYAlignment:     Center

  Color logic:
    Rank 1: TextColor3=Color3.fromRGB(255,215,50)  -- gold
    Rank 2: TextColor3=Color3.fromRGB(192,192,192)  -- silver
    Rank 3: TextColor3=Color3.fromRGB(205,127,50)   -- bronze
    Rank 4+: TextColor3=Color3.fromRGB(160,160,175) -- normal

  ImageLabel "Avatar":
    Size:               UDim2.new(0,36,0,36)
    Position:           UDim2.new(0,48,0.5,0)
    AnchorPoint:        Vector2.new(0,0.5)
    BackgroundColor3:   Color3.fromRGB(30,30,40)
    UICorner CornerRadius: UDim.new(1,0)   -- circle avatar
    ZIndex:             43

  TextLabel "PlayerName":
    Size:               UDim2.new(1,-180,0,22)
    Position:           UDim2.new(0,92,0.3,0)
    Text:               "PlayerName123"
    TextSize:           14, Font=GothamBold, white
    TextXAlignment:     Left
    ZIndex:             43

  TextLabel "PlayerScore":
    Size:               UDim2.new(0,90,1,0)
    Position:           UDim2.new(1,-100,0,0)
    Text:               "1,420,500"
    TextSize:           14, Font=GothamBold
    TextColor3:         Color3.fromRGB(255,215,50)
    TextXAlignment:     Right, TextYAlignment: Center
    ZIndex:             43

  Frame "PlayerHighlight":  -- only for local player's row
    Size:               UDim2.new(1,0,1,0)
    BackgroundColor3:   Color3.fromRGB(50,40,15)
    BackgroundTransparency: 0.5
    UICorner CornerRadius: UDim.new(0,10)
    UIStroke Color:     Color3.fromRGB(212,175,55), Thickness=1
    ZIndex:             41  -- behind row content

--- FRIEND LIST PANEL ---
Frame "FriendPanel":
  Size:                 UDim2.new(0,280,0,420)
  BackgroundColor3:     Color3.fromRGB(12,12,18)
  UICorner CornerRadius: UDim.new(0,16)
  UIStroke Color:       Color3.fromRGB(50,50,68), Thickness=1.5
  ZIndex:               40

TextLabel "FriendTitle":
  Text:                 "FRIENDS  (7 Online)"
  TextSize:             16, Font=GothamBold, gold

Frame "TabRow": Online tab | All Friends tab

ScrollingFrame "FriendScroll":
  AutomaticCanvasSize:  Enum.AutomaticSize.Y
  UIListLayout Vertical, Padding=UDim.new(0,4)

Friend row:
Frame "FriendRow":
  Size:                 UDim2.new(1,0,0,54)
  BackgroundColor3:     Color3.fromRGB(18,18,26)
  UICorner CornerRadius: UDim.new(0,10)
  ZIndex:               41

  ImageLabel "FriendAvatar": Size=UDim2.new(0,38,0,38), UICorner=circle, ZIndex=42

  Frame "OnlineDot":
    Size:               UDim2.new(0,12,0,12)
    Position:           UDim2.new(0,40,0.5,4)
    AnchorPoint:        Vector2.new(0.5,0)
    BackgroundColor3:   Color3.fromRGB(60,220,60)   -- online = green
    UICorner CornerRadius: UDim.new(1,0)
    UIStroke Color:     dark bg color, Thickness=2
    ZIndex:             43

  TextLabel "FriendName":   TextSize=13, GothamBold, white, left
  TextLabel "FriendStatus":
    Text:               "Playing: Sword Fight RPG"
    TextSize:           11, Gotham, TextColor3=dim, left
    ZIndex:             42

  TextButton "JoinBtn":
    Size:               UDim2.new(0,60,0,28)
    Position:           UDim2.new(1,-68,0.5,0)
    AnchorPoint:        Vector2.new(0,0.5)
    BackgroundColor3:   Color3.fromRGB(40,120,220)
    Text:               "JOIN"
    TextSize:           12, Font=GothamBold, white
    UICorner CornerRadius: UDim.new(0,7)
    ZIndex:             42

--- TRADE WINDOW ---
Frame "TradeWindow":
  Size:                 UDim2.new(0,660,0,460)
  Position:             UDim2.new(0.5,0,0.5,0)
  AnchorPoint:          Vector2.new(0.5,0.5)
  BackgroundColor3:     Color3.fromRGB(14,14,20)
  ZIndex:               100
  UICorner CornerRadius: UDim.new(0,18)

TextLabel "TradeTitle":   "TRADE REQUEST", TextSize=20, GothamBold, white, center

Frame "YourSide":         Size=UDim2.new(0.48,0,0.8,0), Position=UDim2.new(0.01,0,0.12,0)
  BackgroundColor3=Color3.fromRGB(10,20,10), UICorner=12
  TextLabel "YourLabel":  "Your Offer", green, GothamBold
  UIGridLayout: CellSize=UDim2.new(0,70,0,70), CellPadding=UDim2.new(0,6,0,6)
  (shows 4x3 grid of draggable item slots)

Frame "TheirSide":        Size=UDim2.new(0.48,0,0.8,0), Position=UDim2.new(0.51,0,0.12,0)
  BackgroundColor3=Color3.fromRGB(20,10,10), UICorner=12
  TextLabel "TheirLabel": "Their Offer", red, GothamBold
  (same grid, read-only)

Frame "TradeActions":     bottom strip
  TextButton "AcceptBtn": Size=UDim2.new(0.35,0,0,44), green, "ACCEPT TRADE"
  TextButton "DeclineBtn": Size=UDim2.new(0.25,0,0,44), red, "DECLINE"
  TextLabel "TradeStatus": "Waiting for confirmation...", dim, center

--- PARTY INVITE POPUP ---
Frame "PartyInvite":
  Size:                 UDim2.new(0,340,0,160)
  Position:             UDim2.new(0.5,0,0,100)
  AnchorPoint:          Vector2.new(0.5,0)
  BackgroundColor3:     Color3.fromRGB(16,16,24)
  ZIndex:               150
  UICorner CornerRadius: UDim.new(0,14)
  UIStroke Color:       Color3.fromRGB(60,140,255), Thickness=2

TextLabel "InviteText":   "PlayerXYZ invited you to their party!", TextSize=14, white, center, TextWrapped=true
TextButton "AcceptParty": Size=UDim2.new(0.44,0,0,40), blue, "JOIN PARTY"
TextButton "DeclineParty": Size=UDim2.new(0.3,0,0,40), dark red, "DECLINE"
TextLabel "InviteTimer":  "Expires in 25s", TextSize=12, dim, center

Animation: slide down from above screen on arrival
  Start Position: UDim2.new(0.5,0,-0.2,0), AnchorPoint=Vector2.new(0.5,0)
  Tween to: UDim2.new(0.5,0,0,100), TweenInfo=Bounce Out 0.5s

--- EMOTE WHEEL ---
Frame "EmoteWheelBG":
  Size:                 UDim2.new(0,300,0,300)
  Position:             UDim2.new(0.5,0,0.5,0)
  AnchorPoint:          Vector2.new(0.5,0.5)
  BackgroundTransparency: 1
  ZIndex:               80

Center button:
Frame "WheelCenter":
  Size:                 UDim2.new(0,60,0,60)
  Position:             UDim2.new(0.5,0,0.5,0)
  AnchorPoint:          Vector2.new(0.5,0.5)
  BackgroundColor3:     Color3.fromRGB(20,20,28)
  UICorner CornerRadius: UDim.new(1,0)
  UIStroke Color:       Color3.fromRGB(80,80,100), Thickness=2
  ZIndex:               81

8 emote buttons arranged in circle (radius ~100px from center):
Positions (AnchorPoint=Vector2.new(0.5,0.5)):
  Top:          Position=UDim2.new(0.5,0,0.15,0)
  TopRight:     Position=UDim2.new(0.78,0,0.25,0)
  Right:        Position=UDim2.new(0.88,0,0.5,0)
  BottomRight:  Position=UDim2.new(0.78,0,0.75,0)
  Bottom:       Position=UDim2.new(0.5,0,0.85,0)
  BottomLeft:   Position=UDim2.new(0.22,0,0.75,0)
  Left:         Position=UDim2.new(0.12,0,0.5,0)
  TopLeft:      Position=UDim2.new(0.22,0,0.25,0)

Each emote button:
Frame "EmoteBtn_Wave":
  Size:                 UDim2.new(0,70,0,70)
  BackgroundColor3:     Color3.fromRGB(18,18,28)
  UICorner CornerRadius: UDim.new(1,0)
  UIStroke Color:       Color3.fromRGB(60,60,80), Thickness=1.5
  ZIndex:               81

  TextLabel "EmoteIcon":  Text="👋", TextSize=28, centered, ZIndex=82
  TextLabel "EmoteName":  Text="Wave", TextSize=10, below icon, dim, ZIndex=82
  (hover -> scale 1.15, UIStroke turns gold)
`;

// ============================================================
// SECTION 6 — COMBAT UI
// ============================================================
export const UI_COMBAT: string = `
=== COMBAT UI COMPONENTS ===

--- BOSS HEALTH BAR — top center, dramatic ---
Frame "BossBarContainer":
  Size:                 UDim2.new(0,600,0,60)
  Position:             UDim2.new(0.5,0,0,20)
  AnchorPoint:          Vector2.new(0.5,0)
  BackgroundColor3:     Color3.fromRGB(8,8,12)
  BackgroundTransparency: 0.05
  ZIndex:               30
  UICorner CornerRadius: UDim.new(0,14)
  UIStroke Color:       Color3.fromRGB(60,0,0), Thickness=2

  UIGradient:
    Color:              ColorSequence (edges dark, center slightly lighter)
    Rotation:           90

TextLabel "BossName":
  Size:                 UDim2.new(1,0,0,22)
  Position:             UDim2.new(0,0,0,4)
  Text:                 "SHADOW KING MALACHAR"
  TextSize:             14, Font=GothamBold
  TextColor3:           Color3.fromRGB(220,100,100)
  TextXAlignment:       Center
  ZIndex:               31

Frame "BossBarOuter":
  Size:                 UDim2.new(0.9,0,0,14)
  Position:             UDim2.new(0.05,0,0,28)
  BackgroundColor3:     Color3.fromRGB(25,5,5)
  UICorner CornerRadius: UDim.new(0,7)
  ClipsDescendants:     true
  ZIndex:               31

Frame "BossBarFill":
  Size:                 UDim2.new(0.72,0,1,0)  -- 72% HP
  BackgroundColor3:     Color3.fromRGB(200,20,20)
  UICorner CornerRadius: UDim.new(0,7)
  ZIndex:               32

  UIGradient:
    Color:              ColorSequence dark red to bright red
    Rotation:           0

Frame "BossBarShield":  -- second fill for shield/guard HP on top of main bar
  Size:                 UDim2.new(0.3,0,0.5,0)  -- shield layer
  Position:             UDim2.new(0.42,0,0.25,0)
  BackgroundColor3:     Color3.fromRGB(80,120,220)
  UICorner CornerRadius: UDim.new(0,3)
  ZIndex:               33

TextLabel "BossHPText":
  Size:                 UDim2.new(1,0,0,16)
  Position:             UDim2.new(0,0,1,-18)
  Text:                 "Phase 2  |  72,000 / 100,000"
  TextSize:             11, Font=GothamBold
  TextColor3:           Color3.fromRGB(180,80,80)
  TextXAlignment:       Center
  ZIndex:               31

Phase indicator dots:
Frame "PhaseIndicators":
  Size:                 UDim2.new(0,80,0,8)
  Position:             UDim2.new(1,-92,0.5,-4)
  UIListLayout Horizontal, Padding=UDim.new(0,4), centered

  Phase dot (x3): Size=UDim2.new(0,16,0,8)
    BackgroundColor3: active=Color3.fromRGB(220,80,80), inactive=Color3.fromRGB(40,15,15)
    UICorner CornerRadius: UDim.new(0,4)

--- DAMAGE NUMBERS (floating) ---
Template for floating damage text (spawned via script, not pre-built):
TextLabel "DmgNumber":
  Parent:               PlayerGui (not in existing frame)
  Size:                 UDim2.new(0,80,0,30)
  Position:             UDim2.new(screenX,0,screenY,0)   -- convert 3D pos to 2D
  BackgroundTransparency: 1
  Text:                 "-1,250"
  TextSize:             22 (crits: 28, heals: 20)
  Font:                 Enum.Font.GothamBold
  TextColor3:           Color3.fromRGB(255,80,80)   -- damage=red, crit=yellow, heal=green, mana=blue
  TextXAlignment:       Center
  ZIndex:               200

Damage number animation:
  1. Spawn at world position converted to screen (workspace.CurrentCamera:WorldToScreenPoint)
  2. TweenService: move up 80px over 1.2s with Sine Out
  3. TweenService: fade TextTransparency 0 -> 1 over last 0.4s
  4. TweenService: scale from 0.5 -> 1.2 -> 1.0 in first 0.3s (Elastic Out)
  5. Destroy after 1.2s

Color by type:
  Normal damage:    Color3.fromRGB(255,90,90)
  Critical hit:     Color3.fromRGB(255,215,50), TextSize+6, "CRIT! -2,500"
  Heal:             Color3.fromRGB(60,220,80)
  Mana drain:       Color3.fromRGB(80,140,255)
  Poison/DoT:       Color3.fromRGB(100,200,50)
  Block/Immune:     Color3.fromRGB(160,160,175), "BLOCKED"
  Miss:             Color3.fromRGB(130,130,145), TextSize-4, "MISS"

--- KILL FEED — top right ---
Frame "KillFeedContainer":
  Size:                 UDim2.new(0,280,0,200)
  Position:             UDim2.new(1,-296,0,20)
  BackgroundTransparency: 1
  ZIndex:               35

  UIListLayout:
    FillDirection:      Enum.FillDirection.Vertical
    Padding:            UDim.new(0,4)
    VerticalAlignment:  Enum.VerticalAlignment.Top
    SortOrder:          Enum.SortOrder.LayoutOrder

Kill entry (spawned dynamically, fades out after 4s):
Frame "KillEntry":
  Size:                 UDim2.new(1,0,0,28)
  BackgroundColor3:     Color3.fromRGB(10,10,15)
  BackgroundTransparency: 0.3
  UICorner CornerRadius: UDim.new(0,8)
  ZIndex:               36
  LayoutOrder:          (timestamp, newest first)

  UIListLayout Horizontal, Padding=UDim.new(0,6), VerticalAlignment=Center, Left-aligned
  UIPadding Left=8

  TextLabel "KillerName": TextSize=12, GothamBold, Color3.fromRGB(255,150,150) if enemy
  ImageLabel "WeaponIcon": Size=UDim2.new(0,20,0,20), BackgroundTransparency=1
  TextLabel "KilledName":  TextSize=12, GothamBold, white if ally

  Fade-out animation after 4s:
    TweenService: BackgroundTransparency 0.3 -> 1, TextTransparency 0 -> 1, over 0.8s
    Then: Destroy()

--- COMBO COUNTER ---
Frame "ComboDisplay":
  Size:                 UDim2.new(0,200,0,80)
  Position:             UDim2.new(0.5,0,0.08,0)
  AnchorPoint:          Vector2.new(0.5,0)
  BackgroundTransparency: 1
  ZIndex:               30
  Visible:              false  -- show when combo >= 3

TextLabel "ComboNum":
  Size:                 UDim2.new(1,0,0.65,0)
  BackgroundTransparency: 1
  Text:                 "15"  -- updated by script
  TextSize:             56
  Font:                 Enum.Font.GothamBold
  TextColor3:           Color3.fromRGB(255,215,50)
  TextXAlignment:       Center
  ZIndex:               31

TextLabel "ComboLabel":
  Size:                 UDim2.new(1,0,0.35,0)
  Position:             UDim2.new(0,0,0.65,0)
  BackgroundTransparency: 1
  Text:                 "COMBO!"
  TextSize:             18
  Font:                 Enum.Font.GothamBold
  TextColor3:           Color3.fromRGB(255,140,50)
  TextXAlignment:       Center
  ZIndex:               31

Color escalation at combo milestones:
  3-9:   TextColor3=Color3.fromRGB(255,215,50)  -- gold
  10-19: TextColor3=Color3.fromRGB(255,140,50)  -- orange
  20-29: TextColor3=Color3.fromRGB(255,80,80)   -- red
  30+:   TextColor3=Color3.fromRGB(200,80,255), UIStroke glow effect

Each new hit: scale 1.4 -> 1.0 Elastic Out 0.3s, color pulse

--- STATUS EFFECT ICONS — above health bar ---
Frame "StatusEffects":
  Size:                 UDim2.new(0,200,0,36)
  Position:             UDim2.new(0,20,1,-160)   -- just above health bar
  BackgroundTransparency: 1
  ZIndex:               22

  UIListLayout Horizontal, Padding=UDim.new(0,4), VerticalAlignment=Center

Status icon (spawned per effect):
Frame "StatusBurning":
  Size:                 UDim2.new(0,34,0,34)
  BackgroundColor3:     Color3.fromRGB(40,15,5)
  UICorner CornerRadius: UDim.new(0,8)
  UIStroke Color:       Color3.fromRGB(220,80,20), Thickness=1.5
  ZIndex:               23

  ImageLabel "StatusIcon": fire emoji or image, centered, Size=0.7
  TextLabel "StatusDuration":
    Size:               UDim2.new(1,0,0,12)
    Position:           UDim2.new(0,0,1,-12)
    BackgroundColor3:   Color3.fromRGB(0,0,0), BackgroundTransparency=0.4
    Text:               "3s", TextSize=9, Font=GothamBold, white, center
    UICorner CornerRadius: UDim.new(0,4)
    ZIndex:             24

Effect colors:
  Burning:    UIStroke Color=Color3.fromRGB(220,80,20)
  Frozen:     UIStroke Color=Color3.fromRGB(100,180,255)
  Poisoned:   UIStroke Color=Color3.fromRGB(80,200,50)
  Stunned:    UIStroke Color=Color3.fromRGB(255,220,0)
  Shielded:   UIStroke Color=Color3.fromRGB(100,150,255)
  Buffed:     UIStroke Color=Color3.fromRGB(200,255,100)
`;

// ============================================================
// SECTION 7 — UI COMPONENT LIBRARY
// ============================================================
export const UI_COMPONENTS: string = `
=== UI COMPONENT LIBRARY ===
Reusable components you can copy-paste into any UI.

--- BUTTON VARIANTS ---

[PRIMARY BUTTON — gold, main CTA]
TextButton "PrimaryBtn":
  Size:                 UDim2.new(0,180,0,46)
  BackgroundColor3:     Color3.fromRGB(212,175,55)
  BorderSizePixel:      0
  Font:                 Enum.Font.GothamBold
  TextSize:             15
  TextColor3:           Color3.fromRGB(15,12,0)
  AutoButtonColor:      false
  UICorner CornerRadius: UDim.new(0,12)
  UIStroke:             none (clean)
  ZIndex:               (as needed)

  Hover state (MouseEnter):
    TweenService: BackgroundColor3 -> Color3.fromRGB(235,200,80), Size -> +4px wider, 0.12s Quad Out
  Press state (MouseButton1Down):
    TweenService: BackgroundColor3 -> Color3.fromRGB(180,145,30), Size -> -4px narrower, 0.08s Quad Out
  Release (MouseButton1Up):
    Back to hover state colors, 0.1s

[SECONDARY BUTTON — outlined, no fill]
TextButton "SecondaryBtn":
  Size:                 UDim2.new(0,160,0,42)
  BackgroundColor3:     Color3.fromRGB(0,0,0)
  BackgroundTransparency: 1
  BorderSizePixel:      0
  Font:                 Enum.Font.GothamMedium
  TextSize:             14
  TextColor3:           Color3.fromRGB(212,175,55)
  UICorner CornerRadius: UDim.new(0,10)
  UIStroke:             Thickness=1.5, Color=Color3.fromRGB(212,175,55), ApplyStrokeMode=Border

  Hover state: BackgroundTransparency 1 -> 0.8, BackgroundColor3=Color3.fromRGB(40,32,5)

[DANGER BUTTON — red, destructive actions]
TextButton "DangerBtn":
  BackgroundColor3:     Color3.fromRGB(180,30,30)
  TextColor3:           Color3.fromRGB(255,220,220)
  UICorner CornerRadius: UDim.new(0,10)

[GHOST BUTTON — invisible bg, text only]
TextButton "GhostBtn":
  BackgroundTransparency: 1
  TextColor3:           Color3.fromRGB(180,180,200)
  Font:                 Enum.Font.Gotham
  (hover: TextColor3 -> white)

[ICON BUTTON — square, icon only]
TextButton "IconBtn":
  Size:                 UDim2.new(0,44,0,44)
  BackgroundColor3:     Color3.fromRGB(22,22,30)
  UICorner CornerRadius: UDim.new(0,10)
  UIStroke:             Thickness=1, Color=Color3.fromRGB(50,50,65)

  ImageLabel inside:    Size=UDim2.new(0.6,0,0.6,0), centered

[TOGGLE SWITCH]
Frame "ToggleContainer":
  Size:                 UDim2.new(0,52,0,28)
  BackgroundColor3:     Color3.fromRGB(200,50,50)  -- off state
  UICorner CornerRadius: UDim.new(1,0)  -- full pill shape

Frame "ToggleKnob":
  Size:                 UDim2.new(0,22,0,22)
  Position:             UDim2.new(0,3,0.5,0)   -- off: left side
  AnchorPoint:          Vector2.new(0,0.5)
  BackgroundColor3:     Color3.fromRGB(255,255,255)
  UICorner CornerRadius: UDim.new(1,0)  -- circle

Toggle ON:
  TweenService: Container BackgroundColor3 -> Color3.fromRGB(50,180,80), 0.2s Quad Out
  TweenService: Knob Position -> UDim2.new(1,-25,0.5,0), 0.2s Quad Out

Toggle OFF:
  TweenService: Container BackgroundColor3 -> Color3.fromRGB(200,50,50), 0.2s Quad Out
  TweenService: Knob Position -> UDim2.new(0,3,0.5,0), 0.2s Quad Out

[SLIDER]
Frame "SliderTrack":
  Size:                 UDim2.new(0.8,0,0,8)
  BackgroundColor3:     Color3.fromRGB(25,25,35)
  UICorner CornerRadius: UDim.new(1,0)

Frame "SliderFill":
  Size:                 UDim2.new(0.65,0,1,0)  -- 65% value
  BackgroundColor3:     Color3.fromRGB(212,175,55)
  UICorner CornerRadius: UDim.new(1,0)

Frame "SliderThumb":
  Size:                 UDim2.new(0,20,0,20)
  Position:             UDim2.new(0.65,0,0.5,0)
  AnchorPoint:          Vector2.new(0.5,0.5)
  BackgroundColor3:     Color3.fromRGB(255,255,255)
  UICorner CornerRadius: UDim.new(1,0)
  UIStroke Color:       Color3.fromRGB(212,175,55), Thickness=2
  ZIndex:               (track + 1)

Slider drag script:
  local isDragging = false
  SliderThumb.MouseButton1Down:Connect(function() isDragging = true end)
  UserInputService.InputEnded:Connect(function(i) if i.UserInputType==Enum.UserInputType.MouseButton1 then isDragging=false end end)
  UserInputService.InputChanged:Connect(function(i)
    if isDragging and i.UserInputType==Enum.UserInputType.MouseMovement then
      local trackAbsPos = SliderTrack.AbsolutePosition.X
      local trackWidth = SliderTrack.AbsoluteSize.X
      local relX = math.clamp((i.Position.X - trackAbsPos) / trackWidth, 0, 1)
      SliderFill.Size = UDim2.new(relX,0,1,0)
      SliderThumb.Position = UDim2.new(relX,0,0.5,0)
      -- fire value changed callback with relX
    end
  end)

[PROGRESS BAR — generic]
Frame "ProgressTrack":
  Size:                 UDim2.new(1,0,0,12)
  BackgroundColor3:     Color3.fromRGB(20,20,28)
  UICorner CornerRadius: UDim.new(0,6)

Frame "ProgressFill":
  Size:                 UDim2.new(0,0,1,0)   -- starts at 0, tweened to target
  BackgroundColor3:     (themed color)
  UICorner CornerRadius: UDim.new(0,6)
  UIGradient:           left=bright, right=slightly darker

  UIGradient:
    Color:              ColorSequence.new({
                          ColorSequenceKeypoint.new(0, brightColor),
                          ColorSequenceKeypoint.new(1, darkerColor)
                        })
    Rotation:           0

Progress fill animation:
  TweenService:Create(ProgressFill, TweenInfo.new(0.8, Enum.EasingStyle.Quad, Enum.EasingDirection.Out),
    { Size = UDim2.new(targetPercent, 0, 1, 0) }):Play()

TextLabel "ProgressLabel":  above/inside track, shows "47 / 100" or "47%"

[CARD COMPONENT — general info card]
Frame "Card":
  Size:                 UDim2.new(0,280,0,160)
  BackgroundColor3:     Color3.fromRGB(18,18,26)
  UICorner CornerRadius: UDim.new(0,14)
  UIStroke Color:       Color3.fromRGB(45,45,60), Thickness=1
  UIPadding all:        UDim.new(0,16)
  UIListLayout Vertical, Padding=UDim.new(0,8)

  TextLabel "CardTitle":  TextSize=16, GothamBold, white
  TextLabel "CardSubtitle": TextSize=13, Gotham, dim
  Frame "CardContent":    flex, BackgroundTransparency=1

[BADGE / CHIP — small label tag]
Frame "Badge":
  Size:                 UDim2.new(0,70,0,22)
  BackgroundColor3:     (semantic color at 0.2 alpha feel — use solid Color3)
  UICorner CornerRadius: UDim.new(1,0)
  UIPadding Left=8, Right=8

  TextLabel:            TextSize=11, GothamBold, text=badge label

Badge color presets:
  Success:  BackgroundColor3=Color3.fromRGB(20,60,30),  TextColor3=Color3.fromRGB(80,220,100)
  Warning:  BackgroundColor3=Color3.fromRGB(60,40,0),   TextColor3=Color3.fromRGB(255,190,50)
  Error:    BackgroundColor3=Color3.fromRGB(60,10,10),  TextColor3=Color3.fromRGB(255,90,90)
  Info:     BackgroundColor3=Color3.fromRGB(10,30,60),  TextColor3=Color3.fromRGB(80,160,255)
  Rarity:   BackgroundColor3=dark rarity color,         TextColor3=bright rarity color

[NOTIFICATION TOAST — bottom right popup]
Frame "Toast":
  Size:                 UDim2.new(0,320,0,72)
  Position:             UDim2.new(1,16,1,-88)  -- starts offscreen right
  AnchorPoint:          Vector2.new(0,0)
  BackgroundColor3:     Color3.fromRGB(20,20,28)
  ZIndex:               180
  UICorner CornerRadius: UDim.new(0,14)
  UIStroke Color:       (matches type color), Thickness=1.5

  UIPadding Left=14, Right=14, Top=12, Bottom=12
  UIListLayout Horizontal, Padding=UDim.new(0,10), VerticalAlignment=Center

  Frame "ToastAccent":
    Size:               UDim2.new(0,4,1,0)
    Position:           UDim2.new(0,0,0,0)
    BackgroundColor3:   (type color — green/red/gold/blue)
    UICorner CornerRadius: UDim.new(0,14)
    ZIndex:             181

  Frame "ToastContent":  UIListLayout Vertical, Padding=UDim.new(0,2)
    TextLabel "ToastTitle":   TextSize=14, GothamBold, white
    TextLabel "ToastMessage": TextSize=12, Gotham, dim

  TextButton "ToastClose":
    Size:               UDim2.new(0,20,0,20)
    Position:           UDim2.new(1,-4,0,4)
    AnchorPoint:        Vector2.new(1,0)
    BackgroundTransparency: 1
    Text:               "x", TextSize=12, dim
    ZIndex:             181

Toast entrance animation:
  Start: Position=UDim2.new(1,16,1,-88)
  Slide to: UDim2.new(1,-336,1,-88), TweenInfo Cubic Out 0.3s
  After 3.5s: slide back out to start position, then Destroy

Toast queue: store array, space each 82px higher than previous

[MODAL / DIALOG WRAPPER — reusable]
Frame "ModalWrapper":
  Size:                 UDim2.new(1,0,1,0)
  BackgroundColor3:     Color3.fromRGB(0,0,0)
  BackgroundTransparency: 0.55
  ZIndex:               (baseZIndex)

Frame "Modal":
  Size:                 UDim2.new(0,targetW,0,targetH)
  Position:             UDim2.new(0.5,0,0.5,0)
  AnchorPoint:          Vector2.new(0.5,0.5)
  BackgroundColor3:     Color3.fromRGB(16,16,22)
  UICorner CornerRadius: UDim.new(0,18)
  UIStroke Color:       Color3.fromRGB(50,50,68), Thickness=1.5
  ZIndex:               (baseZIndex + 1)

Modal entrance: Scale from 0.85 -> 1.0, BackgroundTransparency 0 fade, 0.25s Back Out
Modal exit: Scale 1.0 -> 0.85, fade out 0.2s, then Visible=false, then reset

[DROPDOWN MENU]
Frame "DropdownContainer":
  Size:                 UDim2.new(0,200,0,40)
  ZIndex:               90

TextButton "DropdownTrigger":
  Size:                 UDim2.new(1,0,1,0)
  BackgroundColor3:     Color3.fromRGB(22,22,30)
  UICorner CornerRadius: UDim.new(0,10)
  UIStroke Color:       Color3.fromRGB(50,50,65), Thickness=1
  Text:                 "Select Option v"
  TextSize:             13, Font=GothamMedium
  TextXAlignment:       Left  (with UIPadding Left=12)
  ZIndex:               91

Frame "DropdownList":
  Size:                 UDim2.new(1,0,0,0)   -- height auto-expands when open
  Position:             UDim2.new(0,0,1,4)
  BackgroundColor3:     Color3.fromRGB(22,22,30)
  UICorner CornerRadius: UDim.new(0,10)
  UIStroke Color:       Color3.fromRGB(50,50,65), Thickness=1
  ClipsDescendants:     true
  Visible:              false
  ZIndex:               92
  AutomaticSize:        Enum.AutomaticSize.Y

  UIListLayout Vertical, Padding=UDim.new(0,0)

  TextButton "Option1":
    Size:               UDim2.new(1,0,0,36)
    BackgroundTransparency: 1
    Text:               "Option 1"
    TextSize:           13, Font=GothamMedium
    TextXAlignment:     Left, UIPadding Left=12
    ZIndex:             93
    (hover: BackgroundColor3=Color3.fromRGB(30,30,42), BackgroundTransparency=0)

Open/close animation:
  Open:  DropdownList Visible=true, tween Size.Y from 0 to totalOptionsHeight, 0.2s Quad Out
  Close: tween Size.Y back to 0, 0.15s Quad In, then Visible=false

[TEXTBOX WITH LABEL]
Frame "InputGroup":
  Size:                 UDim2.new(0,280,0,68)
  BackgroundTransparency: 1
  UIListLayout Vertical, Padding=UDim.new(0,4)

  TextLabel "InputLabel":
    Size:               UDim2.new(1,0,0,18)
    Text:               "Username"
    TextSize:           12, Font=GothamBold
    TextColor3:         Color3.fromRGB(160,160,180)
    TextXAlignment:     Left

  Frame "InputBorder":
    Size:               UDim2.new(1,0,0,40)
    BackgroundColor3:   Color3.fromRGB(18,18,26)
    UICorner CornerRadius: UDim.new(0,10)
    UIStroke Color:     Color3.fromRGB(50,50,65), Thickness=1.5

    TextBox "Input":
      Size:             UDim2.new(1,-24,1,0)
      Position:         UDim2.new(0,12,0,0)
      BackgroundTransparency: 1
      PlaceholderText:  "Enter username..."
      PlaceholderColor3: Color3.fromRGB(70,70,90)
      TextSize:         14, Font=Gotham
      TextColor3:       white
      ClearTextOnFocus: false

    Focused state (Focused event):
      UIStroke Color -> Color3.fromRGB(212,175,55)
    Unfocused (FocusLost event):
      UIStroke Color -> Color3.fromRGB(50,50,65)

[LOADING SPINNER]
Frame "SpinnerFrame":
  Size:                 UDim2.new(0,48,0,48)
  BackgroundTransparency: 1

ImageLabel "SpinnerArc":
  Size:                 UDim2.new(1,0,1,0)
  BackgroundTransparency: 1
  Image:                "rbxassetid://4965945816"   -- arc/ring image
  ImageColor3:          Color3.fromRGB(212,175,55)
  ZIndex:               (as needed)

Spinner rotation script:
  local RunService = game:GetService("RunService")
  local angle = 0
  RunService.RenderStepped:Connect(function(dt)
    angle = angle + dt * 200   -- 200 degrees per second
    SpinnerArc.Rotation = angle % 360
  end)

[LOADING DOTS ANIMATION — "Loading..."]
Frame "LoadingDots":
  Size:                 UDim2.new(0,80,0,20)
  BackgroundTransparency: 1
  UIListLayout Horizontal, Padding=UDim.new(0,6), centered

Dot (x3): Frame Size=UDim2.new(0,10,0,10), UICorner=circle, BackgroundColor3=gold

Dots animation script:
  local dots = {dot1, dot2, dot3}
  local function animateDot(dot, delay)
    task.delay(delay, function()
      while true do
        TweenService:Create(dot, TweenInfo.new(0.4,Enum.EasingStyle.Sine,Enum.EasingDirection.InOut), {Size=UDim2.new(0,14,0,14)}):Play()
        task.wait(0.4)
        TweenService:Create(dot, TweenInfo.new(0.4,Enum.EasingStyle.Sine,Enum.EasingDirection.InOut), {Size=UDim2.new(0,10,0,10)}):Play()
        task.wait(0.8)
      end
    end)
  end
  animateDot(dots[1], 0)
  animateDot(dots[2], 0.15)
  animateDot(dots[3], 0.3)

[AVATAR DISPLAY with border]
Frame "AvatarFrame":
  Size:                 UDim2.new(0,64,0,64)
  BackgroundColor3:     Color3.fromRGB(20,20,28)
  UICorner CornerRadius: UDim.new(1,0)
  UIStroke Color:       Color3.fromRGB(212,175,55), Thickness=2.5
  ClipsDescendants:     true

  ImageLabel "AvatarImg":
    Size:               UDim2.new(1,0,1,0)
    BackgroundTransparency: 1
    Image:              ("https://www.roblox.com/headshot-thumbnail/image?userId=" .. userId .. "&width=150&height=150&format=png")

  Frame "LevelBadge":
    Size:               UDim2.new(0,26,0,18)
    Position:           UDim2.new(0.5,0,1,-2)
    AnchorPoint:        Vector2.new(0.5,1)
    BackgroundColor3:   Color3.fromRGB(212,175,55)
    UICorner CornerRadius: UDim.new(0,6)

    TextLabel: Text="24", TextSize=11, GothamBold, dark color, centered
`;

// ============================================================
// SECTION 8 — ANIMATION RECIPES
// ============================================================
export const UI_ANIMATIONS: string = `
=== ANIMATION RECIPES ===
All animations use TweenService unless noted. Format: property -> targetValue, EasingStyle, direction, duration.

--- ENTRANCE ANIMATIONS ---

[SLIDE IN FROM TOP]
Initial: Position=UDim2.new(0.5,0,-0.15,0), AnchorPoint=Vector2.new(0.5,0)
Target:  Position=UDim2.new(0.5,0,0.05,0)
TweenInfo: duration=0.35, Cubic Out

[SLIDE IN FROM BOTTOM]
Initial: Position=UDim2.new(0.5,0,1.1,0), AnchorPoint=Vector2.new(0.5,1)
Target:  Position=UDim2.new(0.5,0,0.9,0)
TweenInfo: duration=0.35, Cubic Out

[SLIDE IN FROM LEFT]
Initial: Position=UDim2.new(-0.5,0,0.5,0), AnchorPoint=Vector2.new(0,0.5)
Target:  Position=UDim2.new(0.02,0,0.5,0)
TweenInfo: duration=0.3, Quad Out

[SLIDE IN FROM RIGHT]
Initial: Position=UDim2.new(1.3,0,0.5,0), AnchorPoint=Vector2.new(1,0.5)
Target:  Position=UDim2.new(0.98,0,0.5,0)
TweenInfo: duration=0.3, Quad Out

[FADE IN]
Initial: BackgroundTransparency=1, TextTransparency=1 (set all children transparent)
Target:  BackgroundTransparency=0, TextTransparency=0
TweenInfo: duration=0.25, Sine InOut

[SCALE IN (pop)]
Initial: Size=UDim2.new(0,0,0,0), AnchorPoint=Vector2.new(0.5,0.5)
Target:  Size=UDim2.new(normalW,0,normalH,0)
TweenInfo: duration=0.4, Back Out  (produces slight overshoot)

[SCALE IN (elastic)]
Same as scale in but: duration=0.5, Elastic Out  (more dramatic bounce)

--- EXIT ANIMATIONS ---

[SLIDE OUT TO TOP]
Target:  Position=UDim2.new(0.5,0,-0.2,0), Cubic In, 0.25s
After:   Visible=false

[FADE AND SHRINK OUT]
Target:  BackgroundTransparency=1, Size=shrink 10%, Sine InOut, 0.2s
After:   Visible=false

[DROP OUT (fall down, gravity feel)]
Step 1: TweenInfo Cubic In 0.3s, Position Y+5% (pause at top)
Step 2: TweenInfo Cubic In 0.15s, Position Y off-screen bottom
After:  Visible=false

--- HOVER & INTERACTION EFFECTS ---

[HOVER SCALE]
MouseEnter:
  TweenService:Create(frame, TweenInfo.new(0.12, Enum.EasingStyle.Quad, Enum.EasingDirection.Out),
    { Size = normalSize + UDim2.new(0.02,0,0.02,0) }):Play()
MouseLeave:
  TweenService:Create(frame, TweenInfo.new(0.12, Enum.EasingStyle.Quad, Enum.EasingDirection.Out),
    { Size = normalSize }):Play()

[HOVER GLOW (UIStroke pulse)]
MouseEnter: UIStroke Color -> bright, Thickness -> 2.5
MouseLeave: UIStroke Color -> normal, Thickness -> 1.5
Both: 0.12s Sine Out

[PRESS EFFECT]
MouseButton1Down:
  TweenService:Create(btn, TweenInfo.new(0.08, Enum.EasingStyle.Quad, Enum.EasingDirection.In),
    { Size = normalSize - UDim2.new(0.01,0,0,4),
      BackgroundColor3 = darkenColor(normalColor, 0.8) }):Play()
MouseButton1Up:
  TweenService:Create(btn, TweenInfo.new(0.15, Enum.EasingStyle.Back, Enum.EasingDirection.Out),
    { Size = normalSize,
      BackgroundColor3 = normalColor }):Play()

--- FEEDBACK ANIMATIONS ---

[NOTIFICATION SLIDE + BOUNCE]
1. Set Visible=true, Position=UDim2.new(0.5,0,-0.1,0)
2. Tween to final Y position, Bounce Out, 0.6s
3. Wait 3 seconds
4. Tween BackgroundTransparency=0 -> 1, Sine InOut, 0.4s
5. Visible=false

[SUCCESS CELEBRATION FLASH]
1. Create green overlay frame (full size, ZIndex=400)
2. Tween BackgroundTransparency 0.6 -> 1, 0.4s Sine Out
3. Destroy

[DAMAGE SHAKE (screen/frame)]
local originalPos = frame.Position
local function shake()
  local offsets = {4,-4,3,-3,2,-2,1,-1,0}
  for _, offset in ipairs(offsets) do
    frame.Position = originalPos + UDim2.new(0, offset, 0, 0)
    task.wait(0.025)
  end
  frame.Position = originalPos
end
task.spawn(shake)

[HEALTH BAR DAMAGE FLASH]
1. Store current HealthBarFill BackgroundColor3
2. TweenService: BackgroundColor3 -> Color3.fromRGB(255,255,255), 0.05s Quad In
3. TweenService: BackgroundColor3 -> red, 0.2s Quad Out
4. Simultaneously tween Size down to new HP percentage

[LEVEL UP CELEBRATION]
1. Show large text "LEVEL UP!" center screen, ZIndex=300
2. TweenService: TextSize 20 -> 48, Back Out 0.5s
3. Flash gold background pulse (0.5s fade in then out)
4. Optional: spawn confetti particles (BillboardGui with particle frames)
5. After 2s: slide up and fade out

[XP BAR FILL ANIMATION]
TweenService:Create(xpFill, TweenInfo.new(0.8, Enum.EasingStyle.Quad, Enum.EasingDirection.Out),
  { Size = UDim2.new(newPercentage, 0, 1, 0) }):Play()

If level up (fill goes past 100%):
1. Fill to 100% quickly (0.3s)
2. Flash fill white
3. Reset to 0% instantly (no tween)
4. Fill to overflow amount (0.5s)
5. Show level up celebration

[NUMBER COUNT UP ANIMATION]
local function countUp(label, startNum, endNum, duration)
  local startTime = tick()
  local conn
  conn = game:GetService("RunService").RenderStepped:Connect(function()
    local elapsed = tick() - startTime
    local t = math.min(elapsed / duration, 1)
    -- Ease Out Quad
    local easedT = 1 - (1 - t)^2
    local current = math.floor(startNum + (endNum - startNum) * easedT)
    label.Text = formatNumber(current)
    if t >= 1 then conn:Disconnect() end
  end)
end

[COIN COLLECT ANIMATION (coin flies to counter)]
1. Spawn ImageLabel of coin at world position converted to screen coords
2. TweenService: Position moves to coin counter location, 0.4s Cubic In
3. Scale 1.0 -> 0.3 as it reaches target
4. On Completed: counter does quick scale pulse 1.0 -> 1.2 -> 1.0, 0.2s Elastic Out
5. Destroy coin image

[CONFETTI BURST]
local function spawnConfetti(parent, count)
  count = count or 30
  local colors = {
    Color3.fromRGB(255,215,50), Color3.fromRGB(255,80,80),
    Color3.fromRGB(80,200,255), Color3.fromRGB(80,220,80),
    Color3.fromRGB(200,80,255)
  }
  for i = 1, count do
    local piece = Instance.new("Frame")
    piece.Parent = parent
    piece.Size = UDim2.new(0, math.random(6,14), 0, math.random(6,14))
    piece.Position = UDim2.new(0.5, math.random(-20,20), 0.5, math.random(-20,20))
    piece.AnchorPoint = Vector2.new(0.5,0.5)
    piece.BackgroundColor3 = colors[math.random(#colors)]
    piece.BorderSizePixel = 0
    piece.ZIndex = 500
    piece.Rotation = math.random(0,360)
    local corner = Instance.new("UICorner")
    corner.CornerRadius = UDim.new(0, math.random(0,3))
    corner.Parent = piece
    -- Animate outward and downward
    local targetX = math.random(-300,300)
    local targetY = math.random(-100,300)
    TweenService:Create(piece, TweenInfo.new(1.2, Enum.EasingStyle.Quad, Enum.EasingDirection.Out), {
      Position = UDim2.new(0.5, targetX, 0.5, targetY),
      BackgroundTransparency = 1,
      Rotation = piece.Rotation + math.random(-180,180)
    }):Play()
    game:GetService("Debris"):AddItem(piece, 1.3)
  end
end

--- PROGRESS & LOADING ---

[LOADING SCREEN TRANSITION]
Frame "LoadingScreen":
  Size=UDim2.new(1,0,1,0), BackgroundColor3=near black, ZIndex=1000

ImageLabel "LoadingLogo": centered, fade in 0.5s
TextLabel "LoadingTip":   bottom center, "Loading... 67%"
Frame "LoadingBar":       bottom strip, fills from 0 to 100%

Exit: Tween BackgroundTransparency 0 -> 1 over 0.5s, then Visible=false, Destroy

[SKELETON LOADING (placeholder shimmer)]
Frame "SkeletonLine":
  BackgroundColor3:     Color3.fromRGB(25,25,35)
  UICorner CornerRadius: UDim.new(0,6)

Shimmer animation:
  UIGradient on skeleton frame
  Tween Offset from Vector2.new(-1,0) to Vector2.new(1,0), repeat infinite, 1.5s Sine InOut
  Color: dark to slightly lighter to dark (creates moving highlight effect)
`;

// ============================================================
// SECTION 9 — MOBILE-SPECIFIC UI
// ============================================================
export const UI_MOBILE: string = `
=== MOBILE-SPECIFIC UI PATTERNS ===

--- CORE MOBILE PRINCIPLES ---
Minimum tap target:    44x44 pixels absolute (UDim2.new(0,44,0,44) minimum)
Thumb reach zones:
  Safe zone (easy):    Bottom 40% of screen, left and right thirds
  Stretch zone:        Bottom 60%, center
  Danger zone (hard):  Top 30% of screen (use only for passive indicators)
  Unreachable:         Top 10%, bottom 5% (notch + gesture areas)

Safe area margins:
  iOS notch top:       UDim.new(0,44) from top
  iOS home bar bottom: UDim.new(0,34) from bottom
  Android status bar:  UDim.new(0,24) from top
  Rule of thumb:       Always offset 50px from screen edges on mobile

Screen size targets:
  Phone portrait:      390x844 (iPhone 14 standard)
  Phone landscape:     844x390
  Tablet portrait:     768x1024
  Tablet landscape:    1024x768

--- VIRTUAL JOYSTICK (movement) ---
Frame "JoystickOuter":
  Size:                 UDim2.new(0,120,0,120)
  Position:             UDim2.new(0,20,1,-150)
  AnchorPoint:          Vector2.new(0,0)
  BackgroundColor3:     Color3.fromRGB(255,255,255)
  BackgroundTransparency: 0.7
  BorderSizePixel:      0
  ZIndex:               50
  UICorner CornerRadius: UDim.new(1,0)   -- perfect circle
  UIStroke Color:       Color3.fromRGB(255,255,255), BackgroundTransparency=0.5, Thickness=2

Frame "JoystickInner":
  Size:                 UDim2.new(0,52,0,52)
  Position:             UDim2.new(0.5,0,0.5,0)
  AnchorPoint:          Vector2.new(0.5,0.5)
  BackgroundColor3:     Color3.fromRGB(255,255,255)
  BackgroundTransparency: 0.4
  UICorner CornerRadius: UDim.new(1,0)
  ZIndex:               51

Joystick script pattern:
  local outerCenter = Vector2.new(JoystickOuter.AbsolutePosition.X + 60, JoystickOuter.AbsolutePosition.Y + 60)
  local maxRadius = 44  -- pixels from center

  UserInputService.TouchMoved:Connect(function(touch)
    local delta = touch.Position - outerCenter
    local clamped = delta.Magnitude > maxRadius and (delta.Unit * maxRadius) or delta
    JoystickInner.Position = UDim2.new(0.5, clamped.X, 0.5, clamped.Y)
    -- normalize clamped / maxRadius to get -1..1 movement vector
    local moveVector = clamped / maxRadius
    -- apply to character: HumanoidRootPart or use character controller
  end)

  UserInputService.TouchEnded:Connect(function()
    JoystickInner.Position = UDim2.new(0.5,0,0.5,0)  -- snap back to center
  end)

--- ACTION BUTTONS (right side, mobile) ---
Frame "ActionButtons":
  Size:                 UDim2.new(0,200,0,200)
  Position:             UDim2.new(1,-220,1,-220)
  AnchorPoint:          Vector2.new(0,0)
  BackgroundTransparency: 1
  ZIndex:               50

Jump button:
TextButton "JumpBtn":
  Size:                 UDim2.new(0,70,0,70)
  Position:             UDim2.new(0.5,0,1,-74)
  AnchorPoint:          Vector2.new(0.5,0)
  BackgroundColor3:     Color3.fromRGB(255,255,255)
  BackgroundTransparency: 0.25
  Text:                 "JUMP"
  TextSize:             12
  Font:                 Enum.Font.GothamBold
  TextColor3:           Color3.fromRGB(255,255,255)
  UICorner CornerRadius: UDim.new(1,0)
  ZIndex:               51

Attack button:
TextButton "AttackBtn":
  Size:                 UDim2.new(0,64,0,64)
  Position:             UDim2.new(0,0,0.5,-32)
  BackgroundColor3:     Color3.fromRGB(220,60,60)
  BackgroundTransparency: 0.2
  Text:                 "ATK"
  Font:                 Enum.Font.GothamBold
  TextSize:             12
  TextColor3:           white
  UICorner CornerRadius: UDim.new(1,0)
  ZIndex:               51

Sprint button:
TextButton "SprintBtn":
  Size:                 UDim2.new(0,56,0,56)
  Position:             UDim2.new(1,-60,1,-60)
  BackgroundColor3:     Color3.fromRGB(60,120,220)
  BackgroundTransparency: 0.25
  Text:                 "RUN"
  TextSize:             11
  UICorner CornerRadius: UDim.new(1,0)
  ZIndex:               51

--- MOBILE HUD ADAPTATIONS ---

Mobile health bar position adjustment:
  Desktop: Position=UDim2.new(0,16,1,-120)  -- bottom left
  Mobile:  Position=UDim2.new(0,16,1,-160)  -- higher up to avoid home bar

  Detection:
    local isMobile = UserInputService.TouchEnabled and not UserInputService.KeyboardEnabled
    if isMobile then
      healthBar.Position = UDim2.new(0,16,1,-160)
    end

Mobile shop button (large, thumb-friendly):
TextButton "MobileShopBtn":
  Size:                 UDim2.new(0,64,0,64)
  Position:             UDim2.new(0,16,1,-230)  -- above action buttons
  BackgroundColor3:     Color3.fromRGB(212,175,55)
  UICorner CornerRadius: UDim.new(0,14)
  ZIndex:               20

--- PORTRAIT vs LANDSCAPE LAYOUTS ---

Portrait layout (phone upright, 390x844):
  HUD takes up bottom 30% of screen
  Minimap: small, top-right corner, 120x120px
  Resource display: top-center strip, full width

Landscape layout (phone sideways, 844x390):
  HUD compressed to bottom 20% (less height available)
  Joystick: bottom-left, smaller (100x100)
  Action btns: bottom-right, smaller (56x56)
  Minimap: top-right, 100x100px max

Layout switch script:
  local camera = workspace.CurrentCamera
  local function updateLayout()
    local viewport = camera.ViewportSize
    if viewport.X > viewport.Y then
      -- Landscape
      applyLandscapeLayout()
    else
      -- Portrait
      applyPortraitLayout()
    end
  end
  camera:GetPropertyChangedSignal("ViewportSize"):Connect(updateLayout)
  updateLayout()

--- GESTURE HINTS ---
Frame "SwipeHint":
  Size:                 UDim2.new(0,200,0,40)
  Position:             UDim2.new(0.5,0,0.8,0)
  AnchorPoint:          Vector2.new(0.5,0)
  BackgroundColor3:     Color3.fromRGB(0,0,0)
  BackgroundTransparency: 0.4
  UICorner CornerRadius: UDim.new(0,20)
  ZIndex:               100

  TextLabel "HintText":
    Text:               "← Swipe to open inventory →"
    TextSize:           13, Font=GothamMedium
    TextColor3:         Color3.fromRGB(220,220,220)
    TextXAlignment:     Center, TextYAlignment: Center
    BackgroundTransparency: 1
    ZIndex:             101

Show for 3s then fade out. Don't show again if UserDataStore has "hintSeen"=true.

--- TOUCH FEEDBACK INDICATOR ---
When player taps screen: spawn brief circle animation at tap point
Frame "TapRipple":
  Size:                 UDim2.new(0,0,0,0)
  Position:             UDim2.new(0, tapX, 0, tapY)
  AnchorPoint:          Vector2.new(0.5,0.5)
  BackgroundColor3:     Color3.fromRGB(255,255,255)
  BackgroundTransparency: 0.5
  UICorner CornerRadius: UDim.new(1,0)
  ZIndex:               500
  BorderSizePixel:      0

Animate: Size 0 -> UDim2.new(0,60,0,60), BackgroundTransparency 0.5 -> 1, 0.4s Quad Out
Then: Destroy

--- SAFE AREA FRAME WRAPPER ---
Frame "SafeAreaWrapper":
  Size:                 UDim2.new(1,0,1,0)
  BackgroundTransparency: 1

  UIPadding:
    PaddingTop:         UDim.new(0,50)    -- status bar + notch
    PaddingBottom:      UDim.new(0,34)   -- home bar
    PaddingLeft:        UDim.new(0,16)
    PaddingRight:       UDim.new(0,16)

All game UI should be parented inside SafeAreaWrapper on mobile to avoid overlap with system UI.

--- MOBILE SCROLLING IMPROVEMENTS ---
ScrollingFrame mobile settings:
  ScrollingEnabled:     true
  ScrollBarThickness:   0   -- hide scrollbar on mobile (touch scroll is obvious)
  ElasticBehavior:      Enum.ElasticBehavior.WhenScrollable  -- rubber band effect
  ScrollingDirection:   Enum.ScrollingDirection.Y

Inertia: Roblox handles inertia for touch scrolling automatically.

--- PINCH TO ZOOM (camera zoom on mobile) ---
local UserInputService = game:GetService("UserInputService")
local startPinchDist = nil
local startZoom = workspace.CurrentCamera.FieldOfView

UserInputService.InputBegan:Connect(function(input)
  if input.UserInputType == Enum.UserInputType.Touch then
    local touches = UserInputService:GetTouchesOnScreen()
    if #touches == 2 then
      startPinchDist = (touches[1].Position - touches[2].Position).Magnitude
      startZoom = workspace.CurrentCamera.FieldOfView
    end
  end
end)

UserInputService.InputChanged:Connect(function(input)
  if input.UserInputType == Enum.UserInputType.Touch then
    local touches = UserInputService:GetTouchesOnScreen()
    if #touches == 2 and startPinchDist then
      local currentDist = (touches[1].Position - touches[2].Position).Magnitude
      local zoomFactor = startPinchDist / currentDist
      workspace.CurrentCamera.FieldOfView = math.clamp(startZoom * zoomFactor, 30, 90)
    end
  end
end)

--- MOBILE KEYBOARD AVOIDANCE ---
When TextBox is focused on mobile, keyboard covers ~40-50% of screen.
Raise the entire UI frame upward to keep input visible:
  TextBox.Focused:Connect(function()
    TweenService:Create(mainFrame, TweenInfo.new(0.3, Enum.EasingStyle.Quad, Enum.EasingDirection.Out),
      { Position = mainFrame.Position - UDim2.new(0,0,0.25,0) }):Play()
  end)
  TextBox.FocusLost:Connect(function()
    TweenService:Create(mainFrame, TweenInfo.new(0.3, Enum.EasingStyle.Quad, Enum.EasingDirection.Out),
      { Position = originalPosition }):Play()
  end)
`;

// ============================================================
// SECTION 10 — DIALOG / CUTSCENE + SETTINGS
// ============================================================

/**
 * NPC Dialog, cutscene letterbox, and settings panel.
 */
export const UI_DIALOG_SETTINGS: string = `
=== NPC DIALOG + CUTSCENE + SETTINGS ===

--- NPC DIALOG BOX ---
Classic dialog: bottom of screen, portrait + name + typewriter text + choice buttons.

Frame "DialogBox":
  Size:                 UDim2.new(0.85,0,0,160)
  Position:             UDim2.new(0.5,0,1,-180)
  AnchorPoint:          Vector2.new(0.5,0)
  BackgroundColor3:     Color3.fromRGB(10,10,16)
  BackgroundTransparency: 0.1
  BorderSizePixel:      0
  ZIndex:               80
  UICorner CornerRadius: UDim.new(0,16)
  UIStroke Color:       Color3.fromRGB(212,175,55), Thickness=1.5

Frame "PortraitFrame":
  Parent:               DialogBox
  Size:                 UDim2.new(0,110,0,110)
  Position:             UDim2.new(0,-55,0.5,0)
  AnchorPoint:          Vector2.new(0.5,0.5)
  BackgroundColor3:     Color3.fromRGB(18,18,26)
  UICorner CornerRadius: UDim.new(0,14)
  UIStroke Color:       Color3.fromRGB(212,175,55), Thickness=2
  ZIndex:               82

  ImageLabel "PortraitImg":
    Size:               UDim2.new(1,0,1,0)
    BackgroundTransparency: 1
    UICorner CornerRadius: UDim.new(0,14)
    ZIndex:             83

Frame "DialogContent":
  Parent:               DialogBox
  Size:                 UDim2.new(1,-80,1,0)
  Position:             UDim2.new(0,70,0,0)
  BackgroundTransparency: 1
  ZIndex:               81
  UIPadding Top=14, Bottom=12, Right=16

TextLabel "NPCName":
  Parent:               DialogContent
  Size:                 UDim2.new(1,0,0,22)
  BackgroundTransparency: 1
  Text:                 "Elder Thornwick"
  TextSize:             15, Font=GothamBold
  TextColor3:           Color3.fromRGB(255,215,50)
  TextXAlignment:       Left
  ZIndex:               82

TextLabel "DialogText":
  Parent:               DialogContent
  Size:                 UDim2.new(1,0,0,70)
  Position:             UDim2.new(0,0,0,26)
  BackgroundTransparency: 1
  Text:                 ""  -- filled by typewriter script
  TextSize:             14, Font=Gotham
  TextColor3:           Color3.fromRGB(220,220,230)
  TextXAlignment:       Left, TextYAlignment: Top
  TextWrapped:          true
  ZIndex:               82

TextButton "AdvanceBtn":
  Parent:               DialogContent
  Size:                 UDim2.new(0,80,0,24)
  Position:             UDim2.new(1,-80,1,-26)
  BackgroundColor3:     Color3.fromRGB(212,175,55)
  Text:                 "Next ▶"
  TextSize:             12, Font=GothamBold
  TextColor3:           Color3.fromRGB(15,12,0)
  UICorner CornerRadius: UDim.new(0,8)
  ZIndex:               83

Typewriter script:
  local function typewriter(label, fullText, speed)
    speed = speed or 0.04  -- seconds per character
    label.Text = ""
    for i = 1, #fullText do
      label.Text = string.sub(fullText, 1, i)
      task.wait(speed)
    end
  end
  task.spawn(function() typewriter(DialogText, "Young adventurer, the ancient seal weakens...") end)

[CHOICE BUTTONS — appear below dialog when choices available]
Frame "ChoicesFrame":
  Size:                 UDim2.new(0.85,0,0,110)
  Position:             UDim2.new(0.5,0,1,-300)
  AnchorPoint:          Vector2.new(0.5,0)
  BackgroundTransparency: 1
  ZIndex:               80
  UIListLayout Vertical, Padding=UDim.new(0,6), HorizontalAlignment=Center

Choice button (x2-4):
TextButton "Choice1":
  Size:                 UDim2.new(0.8,0,0,40)
  BackgroundColor3:     Color3.fromRGB(20,20,30)
  BorderSizePixel:      0
  Text:                 "1. Accept the quest"
  TextSize:             14, Font=GothamMedium
  TextColor3:           Color3.fromRGB(220,220,230)
  TextXAlignment:       Left
  UICorner CornerRadius: UDim.new(0,10)
  UIStroke Color:       Color3.fromRGB(60,60,80), Thickness=1
  UIPadding Left=16
  ZIndex:               81

  Hover: BackgroundColor3 -> Color3.fromRGB(30,28,50), UIStroke -> gold, 0.12s

--- CUTSCENE LETTERBOX ---
Frame "Letterbox":
  Parent:               ScreenGui
  Size:                 UDim2.new(1,0,1,0)
  BackgroundTransparency: 1
  ZIndex:               90

Frame "LetterboxTop":
  Size:                 UDim2.new(1,0,0.12,0)
  Position:             UDim2.new(0,0,-0.12,0)  -- starts hidden above screen
  BackgroundColor3:     Color3.fromRGB(0,0,0)
  ZIndex:               91

Frame "LetterboxBottom":
  Size:                 UDim2.new(1,0,0.12,0)
  Position:             UDim2.new(0,0,1.12,0)  -- starts hidden below screen
  BackgroundColor3:     Color3.fromRGB(0,0,0)
  ZIndex:               91

Enter cutscene:
  TweenService:Create(LetterboxTop, TweenInfo.new(0.5,Enum.EasingStyle.Quad,Enum.EasingDirection.Out),
    { Position=UDim2.new(0,0,0,0) }):Play()
  TweenService:Create(LetterboxBottom, TweenInfo.new(0.5,Enum.EasingStyle.Quad,Enum.EasingDirection.Out),
    { Position=UDim2.new(0,0,0.88,0) }):Play()

Exit cutscene:
  TweenService:Create(LetterboxTop, TweenInfo.new(0.4,Enum.EasingStyle.Quad,Enum.EasingDirection.In),
    { Position=UDim2.new(0,0,-0.12,0) }):Play()
  TweenService:Create(LetterboxBottom, TweenInfo.new(0.4,Enum.EasingStyle.Quad,Enum.EasingDirection.In),
    { Position=UDim2.new(0,0,1.12,0) }):Play()

Cutscene subtitle:
TextLabel "CutsceneSubtitle":
  Size:                 UDim2.new(0.8,0,0.08,0)
  Position:             UDim2.new(0.5,0,0.9,0)
  AnchorPoint:          Vector2.new(0.5,0)
  BackgroundTransparency: 1
  Text:                 "Three years ago..."
  TextSize:             18, Font=Enum.Font.GothamMedium
  TextColor3:           Color3.fromRGB(220,215,200)
  TextXAlignment:       Center, TextYAlignment: Center
  ZIndex:               92

Skip button (top right, fades in after 2s):
TextButton "SkipCutscene":
  Size:                 UDim2.new(0,100,0,32)
  Position:             UDim2.new(1,-116,0,16)
  BackgroundColor3:     Color3.fromRGB(20,20,25)
  BackgroundTransparency: 0.3
  Text:                 "Skip ▶▶"
  TextSize:             12, Font=GothamMedium
  TextColor3:           Color3.fromRGB(180,180,190)
  UICorner CornerRadius: UDim.new(0,8)
  UIStroke Color:       Color3.fromRGB(60,60,75), Thickness=1
  ZIndex:               92

--- SETTINGS PANEL ---
Frame "SettingsPanel":
  Size:                 UDim2.new(0,520,0,560)
  Position:             UDim2.new(0.5,0,0.5,0)
  AnchorPoint:          Vector2.new(0.5,0.5)
  BackgroundColor3:     Color3.fromRGB(14,14,20)
  ZIndex:               60
  UICorner CornerRadius: UDim.new(0,18)
  UIStroke Color:       Color3.fromRGB(50,50,68), Thickness=1.5

TextLabel "SettingsTitle":
  Size:                 UDim2.new(1,0,0,56)
  Text:                 "SETTINGS"
  TextSize:             22, Font=GothamBold
  TextColor3:           white, TextXAlignment=Center, TextYAlignment=Center
  ZIndex:               61

[LEFT NAV TABS — vertical]
Frame "SettingsNav":
  Size:                 UDim2.new(0,140,1,-56)
  Position:             UDim2.new(0,0,0,56)
  BackgroundColor3:     Color3.fromRGB(10,10,16)
  UICorner on left side
  UIListLayout Vertical, Padding=UDim.new(0,4)
  UIPadding all=8

Nav tab (repeat: Graphics, Audio, Controls, Account, Gameplay):
TextButton "NavGraphics":
  Size:                 UDim2.new(1,0,0,40)
  BackgroundColor3:     Color3.fromRGB(212,175,55)  -- active
  Text:                 "Graphics"
  TextSize:             13, Font=GothamBold
  TextColor3:           Color3.fromRGB(15,12,0)
  UICorner CornerRadius: UDim.new(0,8)
  ZIndex:               62

TextButton "NavAudio":
  BackgroundTransparency: 1
  TextColor3:           Color3.fromRGB(160,160,180)
  Font:                 Enum.Font.GothamMedium
  (hover: BackgroundColor3=Color3.fromRGB(25,25,35), BackgroundTransparency=0)

[CONTENT AREA — right side]
Frame "SettingsContent":
  Size:                 UDim2.new(1,-156,1,-72)
  Position:             UDim2.new(0,148,0,64)
  BackgroundTransparency: 1
  ZIndex:               61
  UIPadding Left=8, Right=16
  UIListLayout Vertical, Padding=UDim.new(0,16)

Section heading:
TextLabel "SectionHeading":
  Size:                 UDim2.new(1,0,0,20)
  Text:                 "GRAPHICS"
  TextSize:             11, Font=GothamBold
  TextColor3:           Color3.fromRGB(130,130,150)
  TextXAlignment:       Left
  ZIndex:               62

Setting row template:
Frame "SettingRow":
  Size:                 UDim2.new(1,0,0,44)
  BackgroundColor3:     Color3.fromRGB(18,18,26)
  UICorner CornerRadius: UDim.new(0,10)
  ZIndex:               62
  UIPadding Left=14, Right=14

  TextLabel "SettingName":
    Size:               UDim2.new(0.55,0,0,20)
    Position:           UDim2.new(0,0,0.5,0)
    AnchorPoint:        Vector2.new(0,0.5)
    Text:               "Render Quality"
    TextSize:           13, Font=GothamMedium, white, Left-aligned
    ZIndex:             63

  TextLabel "SettingDesc":
    Size:               UDim2.new(0.55,0,0,14)
    Position:           UDim2.new(0,0,0.5,10)
    AnchorPoint:        Vector2.new(0,0)
    Text:               "Current: High"
    TextSize:           11, Font=Gotham, dim, Left-aligned
    ZIndex:             63

  -- Control on right side (slider, toggle, or dropdown) positioned:
  -- Size=UDim2.new(0.4,0,0,32), Position=UDim2.new(0.58,0,0.5,0), AnchorPoint=Vector2.new(0,0.5)

Graphics settings rows:
  Render Quality:   Slider (Low/Med/High/Ultra or 1-10 scale)
  Shadows:          Toggle ON/OFF
  Particles:        Toggle ON/OFF
  Anti-Aliasing:    Toggle ON/OFF
  View Distance:    Slider

Audio settings rows:
  Master Volume:    Slider 0-100%
  Music Volume:     Slider 0-100%
  SFX Volume:       Slider 0-100%
  Ambient Volume:   Slider 0-100%

Controls settings rows:
  Camera Sensitivity: Slider
  Invert Y Axis:    Toggle
  Auto Sprint:      Toggle
  Aim Assist:       Toggle (shows only on mobile)

Gameplay settings rows:
  Show Damage Numbers: Toggle
  Show Username Tags:  Toggle
  Chat Filter:         Toggle
  Language:            Dropdown

[SETTINGS FOOTER — action buttons]
Frame "SettingsFooter":
  Size:                 UDim2.new(1,0,0,56)
  Position:             UDim2.new(0,0,1,-56)
  BackgroundColor3:     Color3.fromRGB(10,10,16)
  UICorner on bottom corners
  UIListLayout Horizontal, Right-aligned, Padding=UDim.new(0,10)
  UIPadding Right=16, top/bottom=10

  TextButton "ResetDefaults": Size=UDim2.new(0,140,0,36), secondary style, "Reset to Default"
  TextButton "SaveSettings":  Size=UDim2.new(0,120,0,36), primary style (gold), "Save"
  TextButton "CloseSettings": Size=UDim2.new(0,100,0,36), ghost style, "Close"
`;

// ============================================================
// ECONOMY UI + QUICK REFERENCE
// ============================================================

export const UI_ECONOMY: string = `
=== ECONOMY UI COMPONENTS ===

--- CURRENCY HUD COUNTER (animated) ---
Frame "CurrencyHUD":
  Size:                 UDim2.new(0,160,0,36)
  Position:             UDim2.new(1,-176,0,12)
  BackgroundColor3:     Color3.fromRGB(15,13,5)
  BackgroundTransparency: 0.1
  UICorner CornerRadius: UDim.new(0,10)
  UIStroke Color:       Color3.fromRGB(120,95,10), Thickness=1
  ZIndex:               20

  UIListLayout Horizontal, Padding=UDim.new(0,6), VerticalAlignment=Center, centered

  ImageLabel "CurrIcon": Size=UDim2.new(0,24,0,24), BackgroundTransparency=1
  TextLabel "CurrAmount":
    Text:               "12,450"
    TextSize:           16, Font=GothamBold
    TextColor3:         Color3.fromRGB(255,215,50)
    ZIndex:             21

+/- Popup (spawns on currency change):
TextLabel "CurrDelta":
  Size:                 UDim2.new(0,80,0,22)
  Position:             above currency display
  BackgroundTransparency: 1
  Text:                 "+500" or "-200"
  TextSize:             16, Font=GothamBold
  TextColor3:           Color3.fromRGB(80,220,80) for gain, red for loss
  ZIndex:               22

Animation:
  1. Spawn at Position of currency display
  2. Tween upward 30px + TextTransparency 0 -> 1 over 1.2s Sine Out
  3. Destroy

--- TRANSACTION RECEIPT ---
Frame "TransactionPopup":
  Size:                 UDim2.new(0,300,0,200)
  Position:             UDim2.new(0.5,0,0.5,0)
  AnchorPoint:          Vector2.new(0.5,0.5)
  BackgroundColor3:     Color3.fromRGB(14,14,20)
  UICorner CornerRadius: UDim.new(0,16)
  UIStroke Color:       Color3.fromRGB(50,180,80), Thickness=2  -- green for success
  ZIndex:               130

  TextLabel "TxIcon":      "✓", TextSize=40, green, center
  TextLabel "TxTitle":     "Purchase Complete!", GothamBold, white, TextSize=18
  TextLabel "TxItem":      item name, dim, TextSize=13
  TextLabel "TxAmount":    "-2,500 Coins", red, TextSize=16
  TextLabel "TxBalance":   "New balance: 9,950", dim, TextSize=12
  TextButton "TxClose":    "OK", gold, Size=UDim2.new(0.5,0,0,40), center

Entrance: Scale 0 -> 1.05 -> 1.0, Back Out 0.5s
Auto-dismiss after 3s if not clicked.

--- PRICE DISPLAY PATTERNS ---

Original + Sale price:
  Frame contains two TextLabels stacked:
  TextLabel "OldPrice": Text="3,000", TextSize=13, TextColor3=dim red
    Decoration: Frame "Strikethrough": Size=UDim2.new(1,0,0,1), Position=UDim2.new(0,0,0.5,0)
    BackgroundColor3=dim red
  TextLabel "NewPrice": Text="1,500", TextSize=18, GothamBold, TextColor3=green

  Discount badge (top-right of item):
  Frame "DiscountBadge": Size=UDim2.new(0,44,0,22)
    BackgroundColor3=Color3.fromRGB(220,30,30), UICorner=UDim.new(0,6)
    TextLabel "-50%": TextSize=12, GothamBold, white

Free item:
  TextLabel "FreeLabel": Text="FREE!", TextSize=18, GothamBold, TextColor3=green

Robux price:
  ImageLabel "RobuxIcon": Size=UDim2.new(0,20,0,20), Image=Robux image asset
  TextLabel "RobuxAmt":   Text="80", GothamBold, TextColor3=Color3.fromRGB(0,176,111)

--- AUCTION HOUSE ---
Frame "AuctionPanel":
  Size:                 UDim2.new(0,720,0,520)
  BackgroundColor3:     Color3.fromRGB(14,14,20)
  UICorner CornerRadius: UDim.new(0,18)
  ZIndex:               60

Header: "AUCTION HOUSE", Search bar, Sort/Filter buttons, My Listings tab

ScrollingFrame "AuctionList":
  Size:                 UDim2.new(1,-24,1,-100)
  Position:             UDim2.new(0,12,0,92)
  UIListLayout Vertical, Padding=UDim.new(0,6)

Auction row:
Frame "AuctionRow":
  Size:                 UDim2.new(1,0,0,64)
  BackgroundColor3:     Color3.fromRGB(18,18,26)
  UICorner CornerRadius: UDim.new(0,10)
  ZIndex:               61

  ImageLabel "ItemImg":     Size=UDim2.new(0,52,0,52), left-aligned, UICorner=8, rarity UIStroke
  TextLabel "ItemName":     TextSize=14, GothamBold, white
  TextLabel "SellerName":   TextSize=11, dim, "by PlayerXYZ"
  TextLabel "BidAmount":    TextSize=16, GothamBold, gold, right side
  TextButton "BidBtn":      Size=UDim2.new(0,70,0,32), "BID", blue, right side
  TextButton "BuyNowBtn":   Size=UDim2.new(0,80,0,32), "BUY NOW", gold, right side

Time remaining indicator:
  TextLabel "TimeLeft": Text="2h 14m left", TextColor3=dim orange if < 30min (urgency)

=== QUICK REFERENCE CARD ===

Most used sizes at a glance:
  Full screen:        UDim2.new(1,0,1,0)
  Top bar 50px:       UDim2.new(1,0,0,50)
  Side panel 240px:   UDim2.new(0,240,1,0)
  HUD bar:            UDim2.new(0,260,0,22)
  Button standard:    UDim2.new(0,160,0,44)
  Button small:       UDim2.new(0,100,0,36)
  Icon button:        UDim2.new(0,44,0,44)
  Card:               UDim2.new(0,280,0,160)
  Modal:              UDim2.new(0,400,0,300)
  Toast:              UDim2.new(0,320,0,72)
  Slot (inventory):   UDim2.new(0,72,0,72)
  Slot (hotbar):      UDim2.new(0,52,0,52)
  Avatar:             UDim2.new(0,64,0,64)
  Tag/badge:          UDim2.new(0,70,0,22)

Most used corner radii:
  Pill:               UDim.new(1,0)     -- fully round (works on any size)
  Button:             UDim.new(0,10)    -- standard button
  Card:               UDim.new(0,14)    -- panel/card
  Large panel:        UDim.new(0,18)    -- modal/shop
  Slot:               UDim.new(0,8)     -- small item slot
  Bar:                UDim.new(0,6)     -- progress/health bar
  Tiny:               UDim.new(0,4)     -- small tag

Most used fonts:
  Titles/Headings:    Enum.Font.GothamBold
  Labels/Buttons:     Enum.Font.GothamMedium
  Body/Description:   Enum.Font.Gotham
  Numbers (large):    Enum.Font.GothamBold
  Fun/Arcade style:   Enum.Font.Bangers or Enum.Font.LuckiestGuy
  Fantasy style:      Enum.Font.FredokaOne
  Retro style:        Enum.Font.SourceSansBold

ZIndex quick guide:
  Base HUD:     10-30
  Panels:       40-60
  Modals:       100-150
  Notifications: 150-200
  Loading/Crit: 200+

Common UIGradient patterns:
  Top-to-bottom dark vignette:
    Color = ColorSequence.new({
      ColorSequenceKeypoint.new(0, Color3.fromRGB(0,0,0)),
      ColorSequenceKeypoint.new(1, Color3.new(0,0,0))
    })
    Transparency = NumberSequence.new({
      NumberSequenceKeypoint.new(0, 0.8),
      NumberSequenceKeypoint.new(1, 0)
    })
    Rotation = 90

  Gold shimmer:
    Color = ColorSequence.new({
      ColorSequenceKeypoint.new(0, Color3.fromRGB(180,130,0)),
      ColorSequenceKeypoint.new(0.5, Color3.fromRGB(255,215,50)),
      ColorSequenceKeypoint.new(1, Color3.fromRGB(180,130,0))
    })
    Rotation = 45

  Background panel gradient:
    Color = ColorSequence.new({
      ColorSequenceKeypoint.new(0, Color3.fromRGB(22,20,35)),
      ColorSequenceKeypoint.new(1, Color3.fromRGB(14,14,20))
    })
    Rotation = 135

Number formatting function:
  local function formatNumber(n)
    if n >= 1e18 then return string.format("%.2fQQ", n/1e18)
    elseif n >= 1e15 then return string.format("%.2fQ", n/1e15)
    elseif n >= 1e12 then return string.format("%.2fT", n/1e12)
    elseif n >= 1e9  then return string.format("%.2fB", n/1e9)
    elseif n >= 1e6  then return string.format("%.2fM", n/1e6)
    elseif n >= 1e3  then return string.format("%.1fK", n/1e3)
    else return tostring(math.floor(n))
    end
  end

Color3 utility:
  local function darken(c, factor)  -- factor 0-1
    return Color3.new(c.R*factor, c.G*factor, c.B*factor)
  end
  local function lerp(a, b, t)
    return Color3.new(a.R + (b.R-a.R)*t, a.G + (b.G-a.G)*t, a.B + (b.B-a.B)*t)
  end
`;


