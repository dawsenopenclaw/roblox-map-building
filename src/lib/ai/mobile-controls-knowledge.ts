/**
 * Mobile Controls & Touch Input Knowledge Base
 *
 * Deep mobile/touch patterns extracted from Roblox DevForum threads, official docs,
 * and community resources. Covers UserInputService touch events, virtual joysticks,
 * gesture detection, safe areas, cross-platform input, and mobile UI best practices.
 *
 * Sources:
 * - devforum.roblox.com/t/full-release-introducing-preferredinput-and-improved-touch-capabilities/3750890
 * - devforum.roblox.com/t/thumbstick-module-easy-mobile-touchscreen-joystick/3474175
 * - devforum.roblox.com/t/notched-screen-support-full-release/2074324
 * - devforum.roblox.com/t/touch-improvements-for-contextactionservice/546946
 * - devforum.roblox.com/t/studio-beta-introducing-multi-touch-simulation/4410227
 * - devforum.roblox.com/t/userinputservice-detection-for-mobile-controls/178050
 * - devforum.roblox.com/t/getting-the-delta-of-userinputservicetouchpinch/651761
 * - devforum.roblox.com/t/what-is-the-best-way-to-detect-when-a-swipe-happened/2309946
 * - devforum.roblox.com/t/creating-a-camera-movement-system-thats-mobile-compatible/1391619
 * - devforum.roblox.com/t/contextactionservice-or-gui-buttons-for-mobile-support/502039
 * - devforum.roblox.com/t/custom-mobile-joystick/2816526
 * - devforum.roblox.com/t/how-to-approach-making-a-custom-joystick/1820176
 * - devforum.roblox.com/t/more-reliable-way-of-detecting-if-someone-is-mobile/1639011
 * - create.roblox.com/docs/reference/engine/classes/UserInputService
 * - create.roblox.com/docs/reference/engine/classes/ContextActionService
 * - create.roblox.com/docs/reference/engine/classes/GuiService
 * - And 15+ additional threads
 */

import 'server-only'

export const MOBILE_CONTROLS_KNOWLEDGE = `
=== MOBILE CONTROLS & TOUCH INPUT (from top Roblox developers & official docs) ===

PLATFORM DETECTION:
- Detecting the player's platform is CRITICAL for adapting UI and controls.
- UserInputService.TouchEnabled: bool — true if the device supports touch input.
  WARNING: Windows 11 touch-screen PCs also return true. Do NOT use alone for "is mobile".
- UserInputService.KeyboardEnabled: bool — true if keyboard is available.
- UserInputService.MouseEnabled: bool — true if mouse is available.
- UserInputService.GamepadEnabled: bool — true if gamepad is connected.
- UserInputService.AccelerometerEnabled: bool — true if accelerometer is present (phones/tablets).
- UserInputService.GyroscopeEnabled: bool — true if gyroscope is present.
- GuiService:IsTenFootInterface(): bool — true on Xbox/TV (10-foot UI mode).

- BEST platform detection pattern (2025+):
  local UIS = game:GetService("UserInputService")
  local GuiService = game:GetService("GuiService")

  local function getPlatform()
      if GuiService:IsTenFootInterface() then
          return "Console"
      elseif UIS.TouchEnabled and not UIS.MouseEnabled and not UIS.KeyboardEnabled then
          return "Mobile"
      elseif UIS.TouchEnabled and UIS.MouseEnabled then
          return "TouchPC"  -- Windows touch laptop/tablet
      else
          return "PC"
      end
  end

- PreferredInput API (2025+): Roblox introduced UserInputService.PreferredInput which
  exposes the primary input type available to the player. This is more reliable than
  checking individual input types. Values: Enum.PreferredInput.Touch, Mouse, Gamepad, etc.
  local preferredInput = UIS:GetPreferredInput()

- RUNTIME detection (input can change mid-session, e.g. plugging in controller):
  UIS.LastInputTypeChanged:Connect(function(inputType)
      if inputType == Enum.UserInputType.Touch then
          showMobileUI()
      elseif inputType == Enum.UserInputType.Keyboard or inputType == Enum.UserInputType.MouseMovement then
          showPCUI()
      elseif inputType == Enum.UserInputType.Gamepad1 then
          showConsoleUI()
      end
  end)

TOUCH EVENT BASICS:
- UserInputService provides these touch events (CLIENT-SIDE ONLY):
  - TouchStarted(touch: InputObject, gameProcessedEvent: bool) — finger touches screen
  - TouchMoved(touch: InputObject, gameProcessedEvent: bool) — finger moves on screen
  - TouchEnded(touch: InputObject, gameProcessedEvent: bool) — finger lifts off screen
  - TouchTapInWorld(position: Vector2, processedByUI: bool) — tap on 3D world
  - TouchTap(touchPositions: {Vector2}, gameProcessedEvent: bool) — quick tap gesture
  - TouchLongPress(touchPositions: {Vector2}, state: Enum.UserInputState, gameProcessedEvent: bool)
  - TouchPan(touchPositions: {Vector2}, totalTranslation: Vector2, velocity: Vector2, state, gpe)
  - TouchPinch(touchPositions: {Vector2}, scale: number, velocity: number, state, gpe)
  - TouchRotate(touchPositions: {Vector2}, rotation: number, velocity: number, state, gpe)
  - TouchSwipe(swipeDirection: Enum.SwipeDirection, numberOfTouches: number, gpe: bool)

- InputObject properties for touch:
  - Position: Vector3 — X,Y = screen coords, Z = 0 for touch
  - Delta: Vector3 — change since last frame (X,Y movement)
  - UserInputType: Enum.UserInputType.Touch
  - UserInputState: Begin, Change, End, Cancel

- ALWAYS check gameProcessedEvent (gpe):
  If gpe is true, the input was consumed by a GUI element. Ignore it for game logic.
  UIS.TouchStarted:Connect(function(touch, gpe)
      if gpe then return end  -- consumed by UI button/textbox
      -- handle game touch here
  end)

- Multi-touch tracking:
  local activeTouches = {}
  UIS.TouchStarted:Connect(function(input, gpe)
      if gpe then return end
      activeTouches[input] = true
  end)
  UIS.TouchEnded:Connect(function(input)
      activeTouches[input] = nil
  end)
  -- Count active touches:
  local count = 0
  for _ in pairs(activeTouches) do count += 1 end

VIRTUAL JOYSTICK IMPLEMENTATION:
- Roblox provides a default DynamicThumbstick that appears when a player touches
  the lower-left region of the screen. It can be replaced with a custom one.

- To DISABLE default mobile controls:
  local PlayerModule = require(game.Players.LocalPlayer.PlayerScripts:WaitForChild("PlayerModule"))
  local controls = PlayerModule:GetControls()
  controls:Disable()  -- disables all default controls (movement + camera)

- Or selectively via StarterPlayer properties:
  StarterPlayer.DevTouchMovementMode = Enum.DevTouchMovementMode.Scriptable
  StarterPlayer.DevTouchCameraMovementMode = Enum.DevTouchCameraMovementMode.Scriptable

- Custom joystick architecture:
  1. Outer circle (background ring) — Frame with circular shape
  2. Inner circle (thumb knob) — Frame inside outer, follows touch
  3. Touch zone — invisible frame covering drag area
  4. Dead zone — small radius where input registers as zero

- COMPLETE custom joystick implementation:
  -- LocalScript in StarterPlayerScripts
  local UIS = game:GetService("UserInputService")
  local Players = game:GetService("Players")
  local RunService = game:GetService("RunService")

  local player = Players.LocalPlayer
  local gui = player:WaitForChild("PlayerGui")

  -- Create joystick UI
  local screenGui = Instance.new("ScreenGui")
  screenGui.Name = "JoystickGui"
  screenGui.ResetOnSpawn = false
  screenGui.Parent = gui

  local outerCircle = Instance.new("Frame")
  outerCircle.Name = "OuterCircle"
  outerCircle.Size = UDim2.fromOffset(120, 120)
  outerCircle.Position = UDim2.new(0, 80, 1, -180)
  outerCircle.AnchorPoint = Vector2.new(0.5, 0.5)
  outerCircle.BackgroundColor3 = Color3.fromRGB(0, 0, 0)
  outerCircle.BackgroundTransparency = 0.6
  outerCircle.Parent = screenGui

  local outerCorner = Instance.new("UICorner")
  outerCorner.CornerRadius = UDim.new(0.5, 0)
  outerCorner.Parent = outerCircle

  local innerCircle = Instance.new("Frame")
  innerCircle.Name = "InnerCircle"
  innerCircle.Size = UDim2.fromOffset(50, 50)
  innerCircle.Position = UDim2.new(0.5, 0, 0.5, 0)
  innerCircle.AnchorPoint = Vector2.new(0.5, 0.5)
  innerCircle.BackgroundColor3 = Color3.fromRGB(255, 255, 255)
  innerCircle.BackgroundTransparency = 0.3
  innerCircle.Parent = outerCircle

  local innerCorner = Instance.new("UICorner")
  innerCorner.CornerRadius = UDim.new(0.5, 0)
  innerCorner.Parent = innerCircle

  -- Joystick logic
  local joystickActive = false
  local joystickInput = nil
  local moveDirection = Vector3.new(0, 0, 0)
  local outerRadius = 60  -- half of outerCircle size
  local deadZone = 0.15   -- 15% dead zone

  local function getJoystickVector(touchPos)
      local center = outerCircle.AbsolutePosition + outerCircle.AbsoluteSize / 2
      local offset = Vector2.new(touchPos.X - center.X, touchPos.Y - center.Y)
      local magnitude = offset.Magnitude
      local maxDist = outerRadius

      if magnitude < maxDist * deadZone then
          return Vector2.new(0, 0), Vector2.new(0, 0)
      end

      local clamped = magnitude > maxDist and (offset / magnitude) * maxDist or offset
      local normalized = offset / maxDist
      normalized = Vector2.new(
          math.clamp(normalized.X, -1, 1),
          math.clamp(normalized.Y, -1, 1)
      )
      return normalized, clamped
  end

  -- Touch zone covers left half of screen
  local touchZone = Instance.new("Frame")
  touchZone.Size = UDim2.new(0.4, 0, 0.5, 0)
  touchZone.Position = UDim2.new(0, 0, 0.5, 0)
  touchZone.BackgroundTransparency = 1
  touchZone.Parent = screenGui

  touchZone.InputBegan:Connect(function(input)
      if input.UserInputType == Enum.UserInputType.Touch then
          joystickActive = true
          joystickInput = input
          outerCircle.Position = UDim2.fromOffset(input.Position.X, input.Position.Y)
          outerCircle.Visible = true
      end
  end)

  UIS.TouchMoved:Connect(function(input)
      if joystickActive and input == joystickInput then
          local normalized, clamped = getJoystickVector(input.Position)
          innerCircle.Position = UDim2.new(0.5, clamped.X, 0.5, clamped.Y)
          moveDirection = Vector3.new(normalized.X, 0, normalized.Y)
      end
  end)

  UIS.TouchEnded:Connect(function(input)
      if input == joystickInput then
          joystickActive = false
          joystickInput = nil
          innerCircle.Position = UDim2.new(0.5, 0, 0.5, 0)
          moveDirection = Vector3.new(0, 0, 0)
          outerCircle.Visible = false
      end
  end)

  -- Apply movement each frame
  RunService.Heartbeat:Connect(function()
      local humanoid = player.Character and player.Character:FindFirstChildOfClass("Humanoid")
      if humanoid and moveDirection.Magnitude > 0 then
          local camera = workspace.CurrentCamera
          local camCF = camera.CFrame
          local forward = camCF.LookVector * Vector3.new(1, 0, 1)
          local right = camCF.RightVector * Vector3.new(1, 0, 1)
          forward = forward.Unit
          right = right.Unit
          humanoid:Move(forward * -moveDirection.Z + right * moveDirection.X)
      end
  end)

MOBILE BUTTON LAYOUT:
- Thumb reach zones: Bottom corners are the most accessible on mobile.
  Left thumb: lower-left quadrant (movement joystick).
  Right thumb: lower-right quadrant (action buttons, jump).
  AVOID: top center (hard to reach), corners near notch area.

- Minimum button sizes for mobile:
  48x48 pixels MINIMUM for tap targets (Apple HIG + Google Material).
  In Roblox UDim2: UDim2.fromOffset(48, 48) or larger.
  Recommended: 56-64px for action buttons, 72px+ for important CTAs.

- Button spacing: At least 8px gap between adjacent buttons to prevent mis-taps.

- Standard mobile button layout pattern:
  -- Jump button (bottom-right)
  local jumpBtn = Instance.new("ImageButton")
  jumpBtn.Size = UDim2.fromOffset(70, 70)
  jumpBtn.Position = UDim2.new(1, -90, 1, -100)
  jumpBtn.AnchorPoint = Vector2.new(0.5, 0.5)
  jumpBtn.Image = "rbxassetid://JUMP_ICON"
  jumpBtn.BackgroundTransparency = 0.5

  -- Action buttons (stacked above jump, right side)
  local actionBtn1 = Instance.new("ImageButton")
  actionBtn1.Size = UDim2.fromOffset(56, 56)
  actionBtn1.Position = UDim2.new(1, -160, 1, -100)

  local actionBtn2 = Instance.new("ImageButton")
  actionBtn2.Size = UDim2.fromOffset(56, 56)
  actionBtn2.Position = UDim2.new(1, -90, 1, -180)

- Use UIListLayout or UIGridLayout for consistent button spacing:
  local layout = Instance.new("UIGridLayout")
  layout.CellSize = UDim2.fromOffset(56, 56)
  layout.CellPadding = UDim2.fromOffset(10, 10)
  layout.Parent = actionButtonContainer

SCREEN SIZE ADAPTATION:
- Roblox GUI supports two measurement systems:
  Scale (0-1 fraction of parent): UDim2.fromScale(0.5, 0.5) = center of parent
  Offset (exact pixels): UDim2.fromOffset(200, 100) = exact 200x100 px

- BEST PRACTICE: Use Scale for positions, Offset for sizes (or a mix).
  Buttons at Scale positions adapt to screen size, but Offset sizes stay readable.
  UDim2.new(0.9, 0, 0.9, -60) = 90% right, 90% down minus 60px

- AbsoluteSize: Read-only property showing actual pixel size of any GuiObject.
  local screenSize = screenGui.AbsoluteSize  -- actual screen resolution in pixels
  if screenSize.X < 600 then
      -- small phone: make UI elements bigger relative to screen
  end

- workspace.CurrentCamera.ViewportSize: Vector2 — actual viewport resolution.
  local vp = workspace.CurrentCamera.ViewportSize
  local isSmallScreen = vp.X < 600 or vp.Y < 400

- UIAspectRatioConstraint: Maintains aspect ratio regardless of screen shape.
  local arc = Instance.new("UIAspectRatioConstraint")
  arc.AspectRatio = 1  -- square
  arc.Parent = circularButton

- UISizeConstraint: Clamps element size to min/max bounds.
  local sc = Instance.new("UISizeConstraint")
  sc.MinSize = Vector2.new(48, 48)
  sc.MaxSize = Vector2.new(120, 120)
  sc.Parent = button

- TextScaled = true on TextLabels/TextButtons makes text auto-fit container size.
  Use with UITextSizeConstraint for min/max font size:
  local tsc = Instance.new("UITextSizeConstraint")
  tsc.MinTextSize = 12
  tsc.MaxTextSize = 24
  tsc.Parent = textLabel

SAFE AREAS (NOTCH, HOME INDICATOR, STATUS BAR):
- Modern phones have notches, dynamic islands, rounded corners, and home indicators
  that overlap the screen. Roblox handles this via GuiInset and ScreenInsets.

- GuiService:GetGuiInset(): returns Vector2 topLeftInset, Vector2 bottomRightInset
  This tells you how many pixels the core UI reserves (top bar, etc).
  local topLeft, bottomRight = GuiService:GetGuiInset()
  -- topLeft.Y is typically 36px (Roblox top bar height)

- ScreenGui.ScreenInsets (2023+): Controls how the ScreenGui handles device insets.
  Enum.ScreenInsets.CoreUISafeInsets — (DEFAULT) respects Roblox top bar + device safe area
  Enum.ScreenInsets.DeviceSafeInsets — respects only device safe area (ignores Roblox top bar)
  Enum.ScreenInsets.None — uses full screen, ignoring all insets (for backgrounds, effects)

- ScreenGui.IgnoreGuiInset (legacy): When true, the ScreenGui extends behind the top bar.
  Use ScreenInsets instead for new projects. IgnoreGuiInset is equivalent to ScreenInsets.None.

- Notch avoidance strategy:
  1. Use ScreenInsets = CoreUISafeInsets for interactive UI (buttons, text, HUD).
  2. Use ScreenInsets = None for full-screen backgrounds, effects, overlays.
  3. Never place tappable elements within 44px of screen edges on modern phones.

- Safe area implementation:
  local safeGui = Instance.new("ScreenGui")
  safeGui.ScreenInsets = Enum.ScreenInsets.CoreUISafeInsets
  safeGui.Parent = playerGui

  -- Full-screen background (behind notch)
  local bgGui = Instance.new("ScreenGui")
  bgGui.ScreenInsets = Enum.ScreenInsets.None
  bgGui.DisplayOrder = -1
  bgGui.Parent = playerGui

GESTURE DETECTION:
- Roblox provides built-in gesture events on UserInputService:

- SWIPE detection:
  UIS.TouchSwipe:Connect(function(direction, touchCount, gpe)
      if gpe then return end
      if direction == Enum.SwipeDirection.Left then
          -- swipe left (e.g., next page)
      elseif direction == Enum.SwipeDirection.Right then
          -- swipe right (e.g., previous page)
      elseif direction == Enum.SwipeDirection.Up then
          -- swipe up
      elseif direction == Enum.SwipeDirection.Down then
          -- swipe down
      end
  end)

- PINCH TO ZOOM:
  UIS.TouchPinch:Connect(function(touchPositions, scale, velocity, state, gpe)
      if gpe then return end
      if state == Enum.UserInputState.Change then
          -- scale > 1 means spreading (zoom in), < 1 means pinching (zoom out)
          local camera = workspace.CurrentCamera
          local currentFOV = camera.FieldOfView
          camera.FieldOfView = math.clamp(currentFOV / scale, 20, 90)
      end
  end)

- LONG PRESS:
  UIS.TouchLongPress:Connect(function(touchPositions, state, gpe)
      if gpe then return end
      if state == Enum.UserInputState.Begin then
          -- long press started — show context menu
      elseif state == Enum.UserInputState.End then
          -- long press released
      end
  end)

- DOUBLE TAP (custom, no built-in event):
  local lastTapTime = 0
  local DOUBLE_TAP_THRESHOLD = 0.3  -- seconds
  UIS.TouchTap:Connect(function(touchPositions, gpe)
      if gpe then return end
      local now = tick()
      if now - lastTapTime < DOUBLE_TAP_THRESHOLD then
          -- DOUBLE TAP detected!
          onDoubleTap(touchPositions[1])
          lastTapTime = 0
      else
          lastTapTime = now
      end
  end)

- PAN (drag gesture):
  UIS.TouchPan:Connect(function(touchPositions, totalTranslation, velocity, state, gpe)
      if gpe then return end
      if state == Enum.UserInputState.Begin then
          -- drag started
      elseif state == Enum.UserInputState.Change then
          -- totalTranslation is Vector2 of total drag distance from start
      elseif state == Enum.UserInputState.End then
          -- drag ended, velocity is Vector2 for inertia scrolling
      end
  end)

- ROTATE (two-finger rotation):
  UIS.TouchRotate:Connect(function(touchPositions, rotation, velocity, state, gpe)
      if gpe then return end
      -- rotation is in radians, apply to camera or object
  end)

MOBILE CAMERA CONTROLS:
- Default Roblox camera handles mobile with touch-to-rotate on the right side of screen.

- Custom mobile camera (touch-to-rotate + pinch-to-zoom):
  local camera = workspace.CurrentCamera
  camera.CameraType = Enum.CameraType.Scriptable
  local yaw, pitch = 0, 0
  local zoomDist = 15
  local sensitivity = 0.3

  -- Right-side touch for camera rotation
  UIS.TouchMoved:Connect(function(input, gpe)
      if gpe then return end
      if input.Position.X > workspace.CurrentCamera.ViewportSize.X * 0.4 then
          yaw = yaw - input.Delta.X * sensitivity
          pitch = math.clamp(pitch - input.Delta.Y * sensitivity, -80, 80)
      end
  end)

  UIS.TouchPinch:Connect(function(positions, scale, velocity, state, gpe)
      if gpe then return end
      if state == Enum.UserInputState.Change then
          zoomDist = math.clamp(zoomDist / scale, 5, 50)
      end
  end)

  RunService.RenderStepped:Connect(function()
      local char = player.Character
      if not char then return end
      local root = char:FindFirstChild("HumanoidRootPart")
      if not root then return end
      local targetPos = root.Position
      local cframe = CFrame.new(targetPos)
          * CFrame.Angles(0, math.rad(yaw), 0)
          * CFrame.Angles(math.rad(pitch), 0, 0)
          * CFrame.new(0, 0, zoomDist)
      camera.CFrame = cframe
  end)

- Auto-follow camera for mobile (smooth chase cam):
  local smoothSpeed = 5
  RunService.RenderStepped:Connect(function(dt)
      local root = player.Character and player.Character:FindFirstChild("HumanoidRootPart")
      if not root then return end
      local targetCF = CFrame.new(root.Position + Vector3.new(0, 8, 12), root.Position)
      camera.CFrame = camera.CFrame:Lerp(targetCF, math.min(1, smoothSpeed * dt))
  end)

CONTEXTACTIONSERVICE FOR MOBILE:
- ContextActionService auto-creates on-screen buttons when you bind to touch input.
  local CAS = game:GetService("ContextActionService")

  -- Bind action with auto-created mobile button:
  CAS:BindAction("Attack", function(actionName, inputState, inputObject)
      if inputState == Enum.UserInputState.Begin then
          performAttack()
      end
  end, true, Enum.KeyCode.E)  -- true = create touch button, E = keyboard key

  -- Customize the auto-created button:
  local button = CAS:GetButton("Attack")
  if button then
      button.Image = "rbxassetid://ATTACK_ICON"
      button.Size = UDim2.fromOffset(64, 64)
      button.Position = UDim2.new(1, -80, 1, -80)
  end

- Bind WITHOUT creating a touch button (handle via custom UI):
  CAS:BindAction("Interact", interactHandler, false, Enum.KeyCode.F)
  -- false = no auto button; wire your custom button to fire the same function

- SetPosition to arrange mobile buttons:
  CAS:SetPosition("Attack", UDim2.new(1, -80, 1, -80))
  CAS:SetTitle("Attack", "ATK")
  CAS:SetImage("Attack", "rbxassetid://123456")

- WARNING: Binding to Enum.UserInputType.Touch will intercept ALL touch input
  and can break the default thumbstick. Only do this for specialized controls.
  CAS:BindAction("CustomTouch", handler, false, Enum.UserInputType.Touch)

- ContextActionService vs custom GUI buttons:
  ContextActionService: Easier for cross-platform (auto-creates mobile buttons, maps to keys).
  Custom GUI: More control over look, animation, layout. Preferred for polished games.
  RECOMMENDATION: Use ContextActionService for prototyping, custom GUI for production.

MOBILE-SPECIFIC ROBLOX SETTINGS:
- StarterPlayer.DevTouchMovementMode:
  Enum.DevTouchMovementMode.UserChoice — player picks (default)
  Enum.DevTouchMovementMode.DynamicThumbstick — floating joystick
  Enum.DevTouchMovementMode.Thumbstick — fixed position joystick
  Enum.DevTouchMovementMode.ClickToMove — tap to walk
  Enum.DevTouchMovementMode.Scriptable — developer controls movement entirely

- StarterPlayer.DevTouchCameraMovementMode:
  Enum.DevTouchCameraMovementMode.UserChoice — player picks
  Enum.DevTouchCameraMovementMode.Classic — swipe to rotate
  Enum.DevTouchCameraMovementMode.Follow — auto-follows behind character

- Humanoid.AutoRotate = true/false — controls if character faces movement direction.
  On mobile, set to true so the character turns with joystick input.

- UserInputService.ModalEnabled = true — disables the default Roblox thumbstick and
  camera touch controls. Useful when showing a custom menu or UI that needs full touch.

MOBILE PERFORMANCE OPTIMIZATION:
- Reduce GUI instance count: Each Frame, TextLabel, ImageLabel has render cost.
  On mobile, keep total visible GUI instances under 200 for smooth 60fps.
- Avoid excessive Transparency: Semi-transparent overlapping elements are expensive.
  Each transparent layer requires an extra draw call. Limit to 2-3 stacked layers max.
- Use ImageLabel with prerendered assets instead of layered Frames with effects.
- Smaller textures: Mobile GPUs have less VRAM. Use 256x256 or 512x512 for UI icons,
  not 1024x1024. Use spritesheets where possible.
- TextScaled is expensive: It runs a binary search for font size every frame the text
  changes. Use fixed TextSize when possible, or cache with UITextSizeConstraint.
- Avoid RenderStepped for UI updates: Use Heartbeat instead. RenderStepped blocks rendering.
- Batch UI visibility changes: Hide a parent Frame to hide all children at once
  rather than toggling individual element visibility.

CROSS-PLATFORM INPUT HANDLING:
- Single codebase approach: Detect platform once, swap UI layout, keep game logic shared.

  local platform = getPlatform()  -- from detection section above

  if platform == "Mobile" then
      -- Show touch joystick, larger buttons
      joystickGui.Enabled = true
      actionButtons.Visible = true
  elseif platform == "Console" then
      -- Show gamepad prompts, navigation highlights
      gamepadHints.Visible = true
  else
      -- PC: hide mobile UI, show keyboard prompts
      joystickGui.Enabled = false
      keyboardHints.Visible = true
  end

- Unified input handler pattern:
  local function onAttack()
      -- game logic, same for all platforms
  end

  -- Keyboard
  UIS.InputBegan:Connect(function(input, gpe)
      if gpe then return end
      if input.KeyCode == Enum.KeyCode.E then onAttack() end
  end)

  -- Gamepad
  UIS.InputBegan:Connect(function(input, gpe)
      if input.KeyCode == Enum.KeyCode.ButtonX then onAttack() end
  end)

  -- Mobile button
  attackButton.Activated:Connect(onAttack)

- OR use ContextActionService for true cross-platform (recommended):
  CAS:BindAction("Attack", function(name, state)
      if state == Enum.UserInputState.Begin then onAttack() end
  end, true, Enum.KeyCode.E, Enum.KeyCode.ButtonX)
  -- Automatically creates mobile button + binds E key + binds X gamepad button

COMMON MOBILE MISTAKES:
- Buttons too small: Under 44x44px is nearly impossible to tap reliably. Use 48px+.
- Text too small: Under 12px is unreadable on phones. Minimum 14px for body, 18px for headers.
- Overlapping touch targets: Buttons too close together cause mis-taps. 8px+ gaps.
- Not checking gameProcessedEvent: Game actions fire when tapping UI buttons.
- Hardcoded pixel positions: UDim2.fromOffset(100, 500) breaks on different screen sizes.
  Use Scale-based positioning: UDim2.new(0.1, 0, 0.9, -50).
- Ignoring landscape vs portrait: Most phones play Roblox in landscape but tablets
  might be portrait. Always test both orientations.
- Not disabling mobile controls when showing menus: Players accidentally move
  when navigating shop/inventory UI. Set ModalEnabled = true during menus.
- Using too many ParticleEmitters near UI: Mobile GPUs struggle with particle overlap
  on top of semi-transparent UI layers.
- Not testing on actual mobile devices: Studio emulator doesn't catch all touch issues.
  Use Roblox mobile app + Studio playtesting for real device testing.
- Forgetting home indicator area on iPhone: Bottom ~34px of screen can trigger
  home gesture. Never place buttons there.
`

// ── Section Tags for Matching ───────────────────────────────────────────────

interface MobileSection {
  name: string
  keywords: string[]
  startMarker: string
  endMarker: string
}

const MOBILE_SECTIONS: MobileSection[] = [
  {
    name: 'platform_detection',
    keywords: [
      'platform detection', 'detect mobile', 'touch enabled', 'is mobile',
      'preferred input', 'last input type', 'ten foot interface', 'console detection',
      'device type', 'cross platform', 'accelerometer', 'gyroscope',
    ],
    startMarker: 'PLATFORM DETECTION:',
    endMarker: 'TOUCH EVENT BASICS:',
  },
  {
    name: 'touch_events',
    keywords: [
      'touch event', 'touch started', 'touch moved', 'touch ended', 'touch tap',
      'tap in world', 'touch input', 'multi-touch', 'multi touch', 'finger',
      'input object', 'input began',
    ],
    startMarker: 'TOUCH EVENT BASICS:',
    endMarker: 'VIRTUAL JOYSTICK IMPLEMENTATION:',
  },
  {
    name: 'virtual_joystick',
    keywords: [
      'joystick', 'thumbstick', 'virtual joystick', 'dynamic thumbstick',
      'analog stick', 'movement control', 'mobile joystick', 'dead zone',
      'deadzone', 'custom joystick',
    ],
    startMarker: 'VIRTUAL JOYSTICK IMPLEMENTATION:',
    endMarker: 'MOBILE BUTTON LAYOUT:',
  },
  {
    name: 'button_layout',
    keywords: [
      'button layout', 'mobile button', 'action button', 'jump button',
      'thumb reach', 'button size', 'tap target', 'button spacing',
      'mobile ui', 'mobile hud', 'hud layout',
    ],
    startMarker: 'MOBILE BUTTON LAYOUT:',
    endMarker: 'SCREEN SIZE ADAPTATION:',
  },
  {
    name: 'screen_adaptation',
    keywords: [
      'screen size', 'viewport', 'scale', 'offset', 'udim2', 'aspect ratio',
      'responsive', 'adaptive', 'absolute size', 'viewport size', 'text scaled',
      'ui constraint', 'size constraint',
    ],
    startMarker: 'SCREEN SIZE ADAPTATION:',
    endMarker: 'SAFE AREAS (NOTCH, HOME INDICATOR, STATUS BAR):',
  },
  {
    name: 'safe_areas',
    keywords: [
      'safe area', 'notch', 'gui inset', 'screen insets', 'ignore gui inset',
      'home indicator', 'status bar', 'dynamic island', 'rounded corner',
      'device safe', 'core ui safe',
    ],
    startMarker: 'SAFE AREAS (NOTCH, HOME INDICATOR, STATUS BAR):',
    endMarker: 'GESTURE DETECTION:',
  },
  {
    name: 'gesture_detection',
    keywords: [
      'gesture', 'swipe', 'pinch', 'zoom', 'long press', 'double tap',
      'pan', 'drag', 'rotate', 'pinch to zoom', 'swipe direction',
      'touch pinch', 'touch swipe', 'touch rotate',
    ],
    startMarker: 'GESTURE DETECTION:',
    endMarker: 'MOBILE CAMERA CONTROLS:',
  },
  {
    name: 'mobile_camera',
    keywords: [
      'mobile camera', 'touch camera', 'camera rotation', 'camera zoom',
      'pinch zoom camera', 'auto follow', 'chase cam', 'camera mobile',
      'touch to rotate', 'camera control',
    ],
    startMarker: 'MOBILE CAMERA CONTROLS:',
    endMarker: 'CONTEXTACTIONSERVICE FOR MOBILE:',
  },
  {
    name: 'context_action_service',
    keywords: [
      'context action', 'contextactionservice', 'bind action', 'mobile button',
      'touch button', 'set position', 'set image', 'get button',
      'cross platform input', 'action bind',
    ],
    startMarker: 'CONTEXTACTIONSERVICE FOR MOBILE:',
    endMarker: 'MOBILE-SPECIFIC ROBLOX SETTINGS:',
  },
  {
    name: 'mobile_settings',
    keywords: [
      'touch movement mode', 'touch camera mode', 'click to move',
      'auto rotate', 'modal enabled', 'scriptable movement', 'movement mode',
      'starter player', 'mobile settings',
    ],
    startMarker: 'MOBILE-SPECIFIC ROBLOX SETTINGS:',
    endMarker: 'MOBILE PERFORMANCE OPTIMIZATION:',
  },
  {
    name: 'mobile_performance',
    keywords: [
      'mobile performance', 'mobile optimization', 'gui performance', 'frame rate',
      'draw call', 'texture size', 'transparency', 'render', 'mobile fps',
      'mobile lag', 'optimize mobile',
    ],
    startMarker: 'MOBILE PERFORMANCE OPTIMIZATION:',
    endMarker: 'CROSS-PLATFORM INPUT HANDLING:',
  },
  {
    name: 'cross_platform',
    keywords: [
      'cross platform', 'cross-platform', 'pc and mobile', 'all platforms',
      'unified input', 'platform specific', 'keyboard and touch',
      'gamepad and touch', 'multi platform',
    ],
    startMarker: 'CROSS-PLATFORM INPUT HANDLING:',
    endMarker: 'COMMON MOBILE MISTAKES:',
  },
  {
    name: 'common_mistakes',
    keywords: [
      'mobile mistake', 'common mistake', 'mobile bug', 'too small',
      'overlapping', 'mis-tap', 'landscape', 'portrait', 'mobile testing',
      'mobile issue', 'mobile problem',
    ],
    startMarker: 'COMMON MOBILE MISTAKES:',
    endMarker: '(END)',
  },
]

// ── Relevance Matching Function ─────────────────────────────────────────────

/**
 * Returns only the mobile controls knowledge sections relevant to the user's prompt.
 * Matches keywords against the lowercased prompt. Returns max 3 sections.
 */
export function getRelevantMobileControlsKnowledge(prompt: string): string {
  const lower = prompt.toLowerCase()

  const scored = MOBILE_SECTIONS.map((section) => {
    let score = 0
    for (const kw of section.keywords) {
      if (lower.includes(kw)) {
        score += kw.includes(' ') ? 3 : 1
      }
    }
    return { section, score }
  })

  scored.sort((a, b) => b.score - a.score)

  const selected = scored.filter((s) => s.score > 0).slice(0, 3)

  if (selected.length === 0) {
    return '' // no match — don't inject mobile knowledge
  }

  return extractMobileSections(selected.map((s) => s.section))
}

function extractMobileSections(sections: MobileSection[]): string {
  const fullText = MOBILE_CONTROLS_KNOWLEDGE
  const parts: string[] = [
    '=== MOBILE CONTROLS KNOWLEDGE (matched to your request) ===\n',
  ]

  for (const section of sections) {
    const startIdx = fullText.indexOf(section.startMarker)
    if (startIdx === -1) continue

    let endIdx: number
    if (section.endMarker === '(END)') {
      endIdx = fullText.length
    } else {
      endIdx = fullText.indexOf(section.endMarker, startIdx)
      if (endIdx === -1) endIdx = fullText.length
    }

    parts.push(fullText.slice(startIdx, endIdx).trim())
    parts.push('')
  }

  return parts.join('\n')
}
