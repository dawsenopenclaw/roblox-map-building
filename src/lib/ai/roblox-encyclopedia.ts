/**
 * roblox-encyclopedia.ts
 * THE definitive Roblox building/scripting reference for ForjeGames AI.
 * 5000+ lines covering every Instance, Material, Color, Tween, Service, Luau pattern, and Build Recipe.
 *
 * Exports:
 *   ROBLOX_ENCYCLOPEDIA        — full combined reference string
 *   ENCYCLOPEDIA_INSTANCES     — Part 1: Every Roblox Instance type
 *   ENCYCLOPEDIA_MATERIALS     — Part 2: Every Material and its use
 *   ENCYCLOPEDIA_COLORS        — Part 3: Complete color theory
 *   ENCYCLOPEDIA_TWEENS        — Part 4: Every tween easing style
 *   ENCYCLOPEDIA_SERVICES      — Part 5: Complete game service reference
 *   ENCYCLOPEDIA_LUAU          — Part 6: Luau language deep reference
 *   ENCYCLOPEDIA_RECIPES       — Part 7: 100 common build recipes
 */

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PART 1: EVERY ROBLOX INSTANCE TYPE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const ENCYCLOPEDIA_INSTANCES = `
## ROBLOX INSTANCE ENCYCLOPEDIA — COMPLETE REFERENCE

### BASE PARTS & GEOMETRY

**Part** (BasePart)
The fundamental building block. A rectangular prism (box) used for walls, floors, platforms, props.
Key Properties: Size (Vector3), Position (Vector3), CFrame (position+rotation), Color (Color3), Material (Enum.Material), Transparency (0-1), Anchored (bool), CanCollide (bool), Shape (Block/Ball/Cylinder)
When to use: Default choice for any static geometry. Use Shape=Ball for spheres, Shape=Cylinder for pipes/columns.
Pattern: local p = Instance.new("Part") p.Size = Vector3.new(10,1,10) p.Position = Vector3.new(0,0.5,0) p.Anchored = true p.Material = Enum.Material.Concrete p.Color = Color3.fromRGB(180,170,160) p.Parent = workspace
Gotchas: Position is the CENTER of the part. A part at Y=0.5 with Size.Y=1 sits on the ground. Parts are NOT anchored by default — they fall with gravity.

**MeshPart** (BasePart)
A part with a custom 3D mesh from an uploaded asset. Used for organic shapes, characters, detailed props.
Key Properties: MeshId (string), TextureID (string), Size, CollisionFidelity (Default/Hull/Box/PreciseConvex), RenderFidelity (Automatic/Performance/Precise)
When to use: When basic Part shapes cannot represent the object (curved furniture, weapons, trees, characters).
Pattern: local mp = Instance.new("MeshPart") mp.MeshId = "rbxassetid://12345" mp.Size = Vector3.new(3,3,3) mp.Anchored = true mp.Parent = workspace
Gotchas: MeshParts need uploaded mesh assets. CollisionFidelity=PreciseConvex is expensive — use Hull or Box for most cases. Cannot change Shape at runtime like Part.

**UnionOperation** (BasePart)
Result of CSG (Constructive Solid Geometry) operations — Union, Negate, Intersect. Combines or subtracts parts.
Key Properties: Same as Part plus UsePartColor (bool), SmoothingAngle (0-180)
When to use: Creating complex shapes by combining/subtracting primitives (arches, L-shapes, holes in walls). SmoothingAngle > 0 hides seams between merged surfaces.
Pattern: Create in Studio via Union tool, or plugin:Union({partA, partB}). Code cannot create unions at runtime.
Gotchas: Unions can have rendering artifacts. High poly count from many operations. Cannot undo in code. UsePartColor=true lets you color individual faces.

**WedgePart** (BasePart)
A triangular prism — half a block cut diagonally. Essential for roofs, ramps, slopes.
Key Properties: Same as Part (Size, Position, CFrame, Color, Material)
When to use: Roofs (pitched), ramps, stairs, angled surfaces, decorative trim. The slope goes from full height on one face to zero on the opposite face.
Pattern: local w = Instance.new("WedgePart") w.Size = Vector3.new(10,4,8) w.CFrame = CFrame.new(0,10,0) w.Anchored = true w.Material = Enum.Material.Brick w.Parent = model
Gotchas: The slope direction is along the Z axis by default. Rotate with CFrame to orient the slope. The "top" face is the sloped surface.

**CornerWedgePart** (BasePart)
A pyramid-like corner piece — wedge cut on two axes. Used for roof corners, hip roofs, corner transitions.
Key Properties: Same as Part
When to use: Where two sloped roofs meet at a corner (hip roof corners), decorative pyramid tops, corner trim.
Pattern: local cw = Instance.new("CornerWedgePart") cw.Size = Vector3.new(4,4,4) cw.CFrame = CFrame.new(cornerX, roofY, cornerZ) cw.Anchored = true cw.Parent = model
Gotchas: Orientation is tricky — the corner point faces a specific direction. Test rotations to get the right corner alignment.

**TrussPart** (BasePart)
A climbable lattice/truss structure. Players can grab and climb it like a ladder.
Key Properties: Size (but only Y dimension matters for climb height), Style (removed in modern Roblox — always lattice look)
When to use: Ladders, scaffolding, industrial structures, fire escapes. Players auto-climb when touching it.
Pattern: local t = Instance.new("TrussPart") t.Size = Vector3.new(2,20,2) t.Position = Vector3.new(0,10,0) t.Anchored = true t.Parent = workspace
Gotchas: Only climbable on the front/back faces. Rotation determines which side is climbable.

**SpawnLocation** (BasePart)
Where players spawn/respawn. Has special spawn behavior built in.
Key Properties: TeamColor (BrickColor), Neutral (bool — if true, all teams can spawn), AllowTeamChangeOnTouch (bool), Duration (forcefield time in seconds)
When to use: Player spawn points. Place in Workspace. Set Neutral=true for free-for-all, or TeamColor to restrict to a team.
Pattern: local spawn = Instance.new("SpawnLocation") spawn.Size = Vector3.new(8,1,8) spawn.Position = Vector3.new(0,0.5,0) spawn.Anchored = true spawn.Neutral = true spawn.Duration = 5 spawn.Parent = workspace
Gotchas: Must be in Workspace (not in a Model that's not in Workspace). Duration=0 means no forcefield. Multiple spawns: random selection among valid ones.

**Terrain** (singleton in Workspace)
Voxel-based terrain system. Supports 50+ terrain materials at 4-stud resolution.
Key Properties: WaterWaveSize, WaterWaveSpeed, WaterTransparency, WaterReflectance, WaterColor, MaterialColors
Key Methods: FillBlock(cframe, size, material), FillBall(center, radius, material), FillCylinder(cframe, height, radius, material), FillWedge(cframe, size, material), FillRegion(region3, resolution, material), ReadVoxels, WriteVoxels, Clear()
When to use: Large-scale landscapes, ground surfaces, water bodies, caves. Much more performant than thousands of parts for terrain.
Pattern: workspace.Terrain:FillBlock(CFrame.new(0,-2,0), Vector3.new(200,4,200), Enum.Material.Grass)
Gotchas: 4-stud voxel resolution means small details impossible. FillBlock sizes snap to 4-stud grid. Water is a terrain material, not a separate system. Clear() destroys ALL terrain.

### CONTAINERS & ORGANIZATION

**Model** (Instance)
A container for grouping parts into a single logical object (a house, vehicle, NPC).
Key Properties: PrimaryPart (BasePart — used for Model:SetPrimaryPartCFrame and Model:GetBoundingBox), Name, WorldPivot
When to use: ALWAYS group related parts into Models. Every building, vehicle, prop should be a Model.
Pattern: local model = Instance.new("Model") model.Name = "MyCottage" model.Parent = workspace -- then parent all parts to model
Gotchas: Set PrimaryPart to the main/center part for reliable positioning. Model:MoveTo() uses PrimaryPart. Model:GetBoundingBox() returns CFrame + Size of bounding box. Without PrimaryPart, some operations fail silently.

**Folder** (Instance)
A pure organizational container — no spatial properties, no PrimaryPart.
Key Properties: Name only
When to use: Organizing scripts, values, or non-spatial objects. Grouping items in ReplicatedStorage or ServerStorage. Use Folder for organization, Model for physical objects.
Pattern: local folder = Instance.new("Folder") folder.Name = "Weapons" folder.Parent = game.ReplicatedStorage
Gotchas: Has no position/size. Cannot set PrimaryPart. Children don't inherit spatial grouping.

**Camera** (Instance)
Controls what the player sees. One Camera per client in Workspace.
Key Properties: CFrame (position+look direction), FieldOfView (70 default), CameraType (Custom/Scriptable/Fixed/Watch/Track/Follow/Orbital), CameraSubject (usually Humanoid), Focus
When to use: Cutscenes (CameraType=Scriptable), custom camera systems, viewport frames, menu cameras.
Pattern: local cam = workspace.CurrentCamera cam.CameraType = Enum.CameraType.Scriptable cam.CFrame = CFrame.new(0,20,30) * CFrame.Angles(math.rad(-30),0,0)
Gotchas: Only modify on the CLIENT (LocalScript). CameraType must be Scriptable for full manual control. Reset to Custom when done. FieldOfView affects perceived speed.

**WorldModel** (Instance)
A 3D world container used inside ViewportFrames. Like a mini Workspace.
Key Properties: Same as Model
When to use: 3D item previews in UI (inventory icons, shop previews). Place inside a ViewportFrame.
Pattern: local wm = Instance.new("WorldModel") wm.Parent = viewportFrame -- add parts/models as children of wm

### HUMANOID SYSTEM

**Humanoid** (Instance — child of character Model)
Controls character behavior — walking, jumping, health, death, animation.
Key Properties: Health, MaxHealth, WalkSpeed (16 default), JumpPower (50 default) or JumpHeight (7.2), HipHeight, AutoRotate, DisplayDistanceType, HealthDisplayDistance, NameDisplayDistance
Key Methods: MoveTo(position), TakeDamage(amount), EquipTool(tool), UnequipTools(), LoadAnimation(animation), GetAppliedDescription()
Key Events: Died, HealthChanged, Running, Jumping, FreeFalling, Touched, MoveToFinished
When to use: Player characters (auto-created), NPCs, any entity that walks/has health.
Pattern: local hum = character:FindFirstChildOfClass("Humanoid") hum.WalkSpeed = 20 hum.MaxHealth = 200 hum.Health = 200
Gotchas: Humanoid is CPU-expensive. Don't create hundreds for decoration — use AnimationController instead. WalkSpeed=0 freezes movement. JumpPower=0 prevents jumping. Set on server for authority.

**HumanoidRootPart** (BasePart — child of character Model)
The root/anchor part of a character. All physics forces act on this. It's the "driver" of movement.
Key Properties: Same as Part. Position = character position. CFrame = character position + facing direction.
When to use: Teleporting players (set CFrame), detecting position, applying forces, raycasting from character.
Pattern: character.HumanoidRootPart.CFrame = CFrame.new(0,10,0) -- teleport
Gotchas: NEVER destroy or unanchor HumanoidRootPart — breaks the character. Move characters by setting HumanoidRootPart.CFrame, not Position. Use CFrame for smooth teleporting.

**HumanoidDescription** (Instance)
Defines a character's appearance — body parts, clothing, animations, body colors.
Key Properties: HeadColor, TorsoColor, LeftArmColor, RightArmColor, LeftLegColor, RightLegColor, HairAccessory, HatAccessory, FaceAccessory, Shirt, Pants, Face, Head, Torso, LeftArm, RightArm, LeftLeg, RightLeg
When to use: NPC appearance, costume changes, character customization screens.
Pattern: local desc = Instance.new("HumanoidDescription") desc.Shirt = 607785311 desc.Pants = 607785498 humanoid:ApplyDescription(desc)

### SCRIPTS & CODE

**Script** (server-side)
Runs Luau code on the SERVER. Has full access to ServerStorage, ServerScriptService, DataStores, HTTP.
Key Properties: Source (code string — read-only at runtime), Enabled (bool), RunContext (Legacy/Server/Client)
When to use: Game logic, data saving, server-side validation, NPC AI, economy systems, anti-cheat.
Pattern: Place in ServerScriptService or inside a Model. Code accesses server services freely.
Gotchas: Cannot access Players.LocalPlayer, UserInputService, Camera, or other client-only APIs. RunContext=Server is the modern equivalent of the old "Script" class.

**LocalScript** (client-side)
Runs Luau code on the CLIENT. Has access to the local player, camera, input, GUI.
Key Properties: Source, Enabled
When to use: UI updates, camera effects, input handling, client-side visual effects, local sound.
Pattern: Place in StarterPlayerScripts, StarterCharacterScripts, or inside a ScreenGui in StarterGui.
Gotchas: Cannot access ServerStorage, ServerScriptService, or DataStores. NEVER trust client code for game logic — it can be exploited. Communicate with server via RemoteEvents.

**ModuleScript** (shared)
A reusable code module. Returns a value (usually a table of functions). Can run on both server and client.
Key Properties: Source
When to use: Shared utilities, config tables, class definitions, anything reused across multiple scripts.
Pattern: -- ModuleScript in ReplicatedStorage
  local M = {}
  function M.damage(target, amount) target.Humanoid:TakeDamage(amount) end
  return M
  -- Usage: local Combat = require(game.ReplicatedStorage.CombatModule)
Gotchas: require() caches the return value — first require() runs the code, subsequent calls return the cached table. This means module-level state is shared. Place in ReplicatedStorage for client+server access, ServerStorage for server-only.

### GUI / UI SYSTEM

**ScreenGui** (Instance — child of StarterGui or PlayerGui)
A 2D UI layer that covers the screen. All 2D UI elements go inside this.
Key Properties: ResetOnSpawn (bool — false to persist across deaths), IgnoreGuiInset (bool — true to cover topbar area), DisplayOrder (int — higher = renders on top), Enabled
When to use: Every UI screen: HUD, menus, inventory, shop, dialogue, notifications.
Pattern: local sg = Instance.new("ScreenGui") sg.ResetOnSpawn = false sg.Parent = player.PlayerGui
Gotchas: ScreenGuis in StarterGui are CLONED to PlayerGui on spawn. ResetOnSpawn=true means UI resets on death. IgnoreGuiInset=true needed for fullscreen overlays.

**BillboardGui** (Instance — child of BasePart or Attachment)
A 2D UI that floats in 3D space above a part, always facing the camera.
Key Properties: Adornee (BasePart), Size (UDim2), StudsOffset (Vector3), AlwaysOnTop (bool), MaxDistance (number)
When to use: Name tags above NPCs, health bars, item labels, waypoint markers, floating text.
Pattern: local bb = Instance.new("BillboardGui") bb.Size = UDim2.new(0,200,0,50) bb.StudsOffset = Vector3.new(0,3,0) bb.Adornee = npcHead bb.AlwaysOnTop = true bb.Parent = npcHead
Gotchas: Size is in pixels (offset) or relative to parent (scale). StudsOffset moves it relative to the adornee. MaxDistance limits render distance for performance.

**SurfaceGui** (Instance — child of BasePart)
A 2D UI rendered on the surface of a 3D part. Like a screen/display/label on a wall.
Key Properties: Face (Enum.NormalId — Top/Bottom/Front/Back/Left/Right), CanvasSize (Vector2), PixelsPerStud, AlwaysOnTop
When to use: In-game screens (TV, computer, billboard), interactive panels, signs, dashboards.
Pattern: local sg = Instance.new("SurfaceGui") sg.Face = Enum.NormalId.Front sg.CanvasSize = Vector2.new(800,600) sg.Parent = screenPart
Gotchas: CanvasSize determines the virtual resolution. Higher = sharper but more rendering cost. Interaction requires mouse events on the UI elements inside.

**Frame** (GuiObject)
A rectangular container for other UI elements. The div of Roblox UI.
Key Properties: Size (UDim2), Position (UDim2), AnchorPoint (Vector2), BackgroundColor3, BackgroundTransparency, BorderSizePixel, ClipsDescendants, LayoutOrder, ZIndex
When to use: Every UI layout container, panels, cards, sections, backgrounds.
Pattern: local f = Instance.new("Frame") f.Size = UDim2.new(0.5,0,0.3,0) f.Position = UDim2.new(0.25,0,0.35,0) f.BackgroundColor3 = Color3.fromRGB(30,30,30) f.BackgroundTransparency = 0.1 f.Parent = screenGui
Gotchas: UDim2 = {Scale, Offset} for X and Y. Scale is fraction of parent (0.5 = 50%). Offset is pixels. AnchorPoint shifts the origin (0.5,0.5 = centered).

**TextLabel** (GuiObject)
Displays non-interactive text.
Key Properties: Text, TextColor3, TextSize, Font (Enum.Font), FontFace, TextScaled (bool), TextWrapped (bool), TextXAlignment, TextYAlignment, RichText (bool — enables HTML-like tags)
When to use: Labels, titles, descriptions, stats display, any read-only text.
Pattern: local tl = Instance.new("TextLabel") tl.Text = "Health: 100" tl.TextColor3 = Color3.new(1,1,1) tl.TextSize = 24 tl.Font = Enum.Font.GothamBold tl.BackgroundTransparency = 1 tl.Size = UDim2.new(0,200,0,40) tl.Parent = frame

**TextButton** (GuiObject)
A clickable text element.
Key Properties: Same as TextLabel plus: Activated (event), MouseButton1Click (event), MouseButton1Down, MouseButton2Click, AutoButtonColor
When to use: Buttons, menu items, interactive elements, shop buy buttons.
Pattern: button.MouseButton1Click:Connect(function() print("Clicked!") end)
Gotchas: Activated fires on click AND touch AND gamepad select — preferred over MouseButton1Click for cross-platform.

**TextBox** (GuiObject)
A text input field. Player can type in it.
Key Properties: Same as TextLabel plus: ClearTextOnFocus, MultiLine, PlaceholderText, PlaceholderColor3, TextEditable, FocusLost (event — passes enterPressed bool), Focused (event)
When to use: Chat input, search bars, name input, code input, forms.
Pattern: textBox.FocusLost:Connect(function(enterPressed) if enterPressed then processInput(textBox.Text) end end)
Gotchas: FocusLost fires when clicking away too, not just Enter. Check enterPressed parameter. Filter user text with TextService:FilterStringAsync for chat.

**ImageLabel** (GuiObject)
Displays an image (non-interactive).
Key Properties: Image (string — rbxassetid://), ImageColor3, ImageTransparency, ScaleType (Stretch/Tile/Slice/Fit/Crop), SliceCenter (Rect for 9-slice), TileSize
When to use: Icons, backgrounds, decorative elements, profile pictures, item thumbnails.
Pattern: local il = Instance.new("ImageLabel") il.Image = "rbxassetid://12345" il.Size = UDim2.new(0,64,0,64) il.BackgroundTransparency = 1 il.ScaleType = Enum.ScaleType.Fit il.Parent = frame
Gotchas: ScaleType.Slice enables 9-slice scaling (corners don't stretch). Set SliceCenter to the Rect of the non-stretching border.

**ImageButton** (GuiObject)
A clickable image. Same as ImageLabel but with button events.
Key Properties: Same as ImageLabel + button events (Activated, MouseButton1Click, etc.) + HoverImage, PressedImage
When to use: Icon buttons, inventory slots, custom-styled buttons, shop item cards.

**ScrollingFrame** (GuiObject)
A scrollable container. Content can overflow and be scrolled vertically/horizontally.
Key Properties: CanvasSize (UDim2 — total scrollable area), ScrollBarThickness, ScrollBarImageColor3, AutomaticCanvasSize (Enum.AutomaticSize — None/X/Y/XY), ScrollingDirection
When to use: Inventory grids, chat logs, long lists, settings menus, any content that exceeds visible area.
Pattern: local sf = Instance.new("ScrollingFrame") sf.Size = UDim2.new(0.8,0,0.6,0) sf.CanvasSize = UDim2.new(0,0,0,0) sf.AutomaticCanvasSize = Enum.AutomaticSize.Y sf.ScrollBarThickness = 6 sf.Parent = screenGui
Gotchas: Set AutomaticCanvasSize=Y with a UIListLayout child for auto-sizing. Manual CanvasSize must be larger than Frame size or scrolling won't work.

**ViewportFrame** (GuiObject)
Renders a 3D scene inside a 2D UI element. Like a mini 3D viewport.
Key Properties: CurrentCamera (Camera), Ambient (Color3), LightColor (Color3), LightDirection (Vector3), ImageTransparency
When to use: 3D item previews (inventory, shop), character previews, minimap with 3D, model showcase.
Pattern: local vf = Instance.new("ViewportFrame") vf.Size = UDim2.new(0,200,0,200) local cam = Instance.new("Camera") cam.CFrame = CFrame.new(0,2,5) * CFrame.Angles(-0.3,0,0) cam.Parent = vf vf.CurrentCamera = cam local wm = Instance.new("WorldModel") wm.Parent = vf -- clone model into wm
Gotchas: Must set CurrentCamera or nothing renders. Objects must be parented to a WorldModel inside. Lighting is basic — only Ambient/LightColor/LightDirection, no post-processing.

### UI LAYOUT CONSTRAINTS

**UIListLayout** (UILayout — child of GuiObject)
Arranges siblings in a list (vertical or horizontal).
Key Properties: FillDirection (Vertical/Horizontal), HorizontalAlignment, VerticalAlignment, Padding (UDim), SortOrder (LayoutOrder/Name), Wraps (bool)
When to use: Vertical lists (settings, menus), horizontal toolbars, any linear arrangement.
Pattern: local ll = Instance.new("UIListLayout") ll.FillDirection = Enum.FillDirection.Vertical ll.Padding = UDim.new(0,8) ll.SortOrder = Enum.SortOrder.LayoutOrder ll.Parent = frame

**UIGridLayout** (UILayout)
Arranges siblings in a grid with fixed cell size.
Key Properties: CellSize (UDim2), CellPadding (UDim2), FillDirection, FillDirectionMaxCells, SortOrder, StartCorner
When to use: Inventory grids, image galleries, tile-based layouts, icon grids.
Pattern: local gl = Instance.new("UIGridLayout") gl.CellSize = UDim2.new(0,64,0,64) gl.CellPadding = UDim2.new(0,4,0,4) gl.Parent = gridFrame

**UICorner** (UIComponent)
Rounds the corners of a GuiObject.
Key Properties: CornerRadius (UDim)
Pattern: local c = Instance.new("UICorner") c.CornerRadius = UDim.new(0,8) c.Parent = frame
Gotchas: UDim.new(0.5,0) makes a perfect circle if the element is square. UDim.new(0,8) = 8px radius.

**UIStroke** (UIComponent)
Adds an outline/border to a GuiObject or text.
Key Properties: Color (Color3), Thickness (number), Transparency, ApplyStrokeMode (Border/Contextual), LineJoinMode (Round/Bevel/Miter)
When to use: Button outlines, text outlines, card borders, focus indicators.
Pattern: local s = Instance.new("UIStroke") s.Color = Color3.fromRGB(255,200,50) s.Thickness = 2 s.Parent = button
Gotchas: ApplyStrokeMode.Contextual applies to text on TextLabels/TextButtons. Border applies to the frame edge.

**UIPadding** (UIComponent)
Adds internal padding to a GuiObject (like CSS padding).
Key Properties: PaddingTop, PaddingBottom, PaddingLeft, PaddingRight (all UDim)
Pattern: local p = Instance.new("UIPadding") p.PaddingTop = UDim.new(0,12) p.PaddingLeft = UDim.new(0,12) p.PaddingRight = UDim.new(0,12) p.PaddingBottom = UDim.new(0,12) p.Parent = frame

**UIAspectRatioConstraint** (UIConstraint)
Forces a GuiObject to maintain a specific aspect ratio.
Key Properties: AspectRatio (number — width/height), AspectType (FitWithinMaxSize/ScaleWithParentSize), DominantAxis (Width/Height)
When to use: Square icons, 16:9 video frames, consistent card proportions.
Pattern: local ar = Instance.new("UIAspectRatioConstraint") ar.AspectRatio = 1 ar.Parent = iconFrame -- forces square

**UIFlexItem** (UIComponent)
Controls how an element grows/shrinks within a UIListLayout (flexbox-like).
Key Properties: FlexMode (None/Fill/Custom), GrowRatio, ShrinkRatio, ItemLineAlignment
When to use: Flexible layouts where some elements should expand to fill space.

**UIPageLayout** (UILayout)
Pages through child elements one at a time, with animated transitions.
Key Properties: Animated, Circular, EasingDirection, EasingStyle, GamepadInputEnabled, Padding, TweenTime
When to use: Onboarding screens, tabbed content, carousel/slider.
Pattern: pageLayout:JumpTo(page2Frame) or pageLayout:Next() / pageLayout:Previous()

**UITableLayout** (UILayout)
Arranges children in a table with rows and columns.
Key Properties: FillEmptySpaceColumns, FillEmptySpaceRows, MajorAxis, Padding, SortOrder
When to use: Data tables, stat comparisons, structured grid data.

**UISizeConstraint** (UIConstraint)
Limits min/max size of a GuiObject.
Key Properties: MaxSize (Vector2), MinSize (Vector2)
When to use: Responsive UI that shouldn't get too small or too large.

**UITextSizeConstraint** (UIConstraint)
Limits min/max text size when TextScaled=true.
Key Properties: MaxTextSize (int), MinTextSize (int)
When to use: Scaled text that should stay readable (min) and not get absurdly large (max).

### AUDIO

**Sound** (Instance — child of BasePart for 3D, or SoundService for 2D)
Plays audio. 3D spatial when parented to a part, 2D when parented to SoundService.
Key Properties: SoundId (string — rbxassetid://), Volume (0-10), PlaybackSpeed (1=normal, 2=double speed), Looped (bool), Playing (bool), TimePosition, RollOffMode (Inverse/Linear/InverseTanh), RollOffMaxDistance, RollOffMinDistance, SoundGroup
Key Methods: Play(), Stop(), Pause(), Resume()
Key Events: Played, Stopped, Ended, Loaded
When to use: SFX (in parts), music (in SoundService), ambient sound (in parts around the map).
Pattern: local s = Instance.new("Sound") s.SoundId = "rbxassetid://12345" s.Volume = 0.5 s.Looped = true s.Parent = workspace.Campfire s:Play()
Gotchas: Parent to SoundService for global/music sound. Parent to a Part for 3D positional audio. RollOffMaxDistance controls how far 3D sound travels. Must call :Play() — setting Playing=true also works but Play() is clearer.

**SoundGroup** (Instance — child of SoundService)
Groups sounds for collective volume control (like a mixer channel).
Key Properties: Volume (0-10)
When to use: Separate Music, SFX, Ambient, UI volume channels that players can adjust independently.
Pattern: local sfxGroup = Instance.new("SoundGroup") sfxGroup.Name = "SFX" sfxGroup.Volume = 0.8 sfxGroup.Parent = game:GetService("SoundService") -- Set sound.SoundGroup = sfxGroup

**Sound Effects** (children of Sound):
- **ReverbSoundEffect**: Adds room reverb. Properties: DecayTime, Density, Diffusion, DryLevel, WetLevel. Use for: indoor spaces, caves, large halls.
- **EchoSoundEffect**: Adds echo/delay. Properties: Delay, DryMix, Feedback, WetMix. Use for: canyons, mountains, large open spaces.
- **DistortionSoundEffect**: Distorts audio. Properties: Level. Use for: damaged radios, monster growls, electric guitar.
- **ChorusSoundEffect**: Adds chorus/detuning. Properties: Depth, Mix, Rate. Use for: ethereal/magical sounds, underwater, dream sequences.
- **FlangeSoundEffect**: Jet-like swoosh. Properties: Depth, Mix, Rate. Use for: sci-fi, swoosh effects, warping sounds.
- **CompressorSoundEffect**: Dynamic range compression. Properties: Attack, GainMakeup, Ratio, Release, Threshold. Use for: evening out loud/quiet sounds.
- **EqualizerSoundEffect**: 3-band EQ. Properties: HighGain, LowGain, MidGain, MidRange. Use for: muffled sounds (cut highs), tinny radio (cut lows), emphasis.

### LIGHTING & ATMOSPHERE

**PointLight** (Instance — child of BasePart or Attachment)
Emits light in all directions from a point.
Key Properties: Brightness (0-inf, default 1), Color (Color3), Range (studs, 0-60), Shadows (bool — expensive)
When to use: Lamps, candles, torches, ceiling lights, glowing objects. Most common light type.
Pattern: local pl = Instance.new("PointLight") pl.Brightness = 1.5 pl.Color = Color3.fromRGB(255,240,200) pl.Range = 16 pl.Shadows = false pl.Parent = lampPart
Gotchas: Shadows = true is expensive — use sparingly (1-3 shadow lights max). Range is hard cutoff. Brightness > 2 can wash out. Warm white = RGB(255,240,200).

**SpotLight** (Instance — child of BasePart or Attachment)
Emits a cone of light in one direction (out from the Front face of the parent Part).
Key Properties: Brightness, Color, Range, Angle (0-180 degrees, cone spread), Shadows, Face (which face of the parent to emit from)
When to use: Flashlights, stage lights, searchlights, desk lamps, car headlights, dramatic lighting.
Pattern: local sl = Instance.new("SpotLight") sl.Brightness = 2 sl.Color = Color3.fromRGB(255,255,240) sl.Range = 30 sl.Angle = 45 sl.Face = Enum.NormalId.Front sl.Parent = flashlightPart
Gotchas: Direction is determined by the parent Part's Face orientation. Rotate the part to aim the light.

**SurfaceLight** (Instance — child of BasePart)
Emits light from a face of a part, like a flat panel light.
Key Properties: Brightness, Color, Range, Angle, Shadows, Face
When to use: Fluorescent panels, neon signs, screen glow, ceiling panel lights, wall sconces.
Pattern: local sl = Instance.new("SurfaceLight") sl.Face = Enum.NormalId.Bottom sl.Brightness = 1 sl.Range = 12 sl.Parent = ceilingPanel

**Atmosphere** (Instance — child of Lighting)
Controls global atmospheric scattering (fog, haze, sky color blending).
Key Properties: Density (0-1, fog thickness), Offset (0-1, fog start distance), Color (Color3, fog tint), Decay (Color3, distance tint), Glare (0-1), Haze (0-1)
When to use: EVERY scene should have Atmosphere. Controls mood more than any other single setting.
Pattern: local atm = Instance.new("Atmosphere") atm.Density = 0.35 atm.Offset = 0.2 atm.Color = Color3.fromRGB(180,195,210) atm.Decay = Color3.fromRGB(120,140,170) atm.Haze = 0.1 atm.Glare = 0 atm.Parent = game:GetService("Lighting")
Gotchas: Density > 0.6 = very foggy. Offset pushes fog away from camera (higher = clearer near you). Color tints everything.

**Bloom** (PostEffect — child of Lighting or Camera)
Glow/bloom effect that makes bright areas bleed light.
Key Properties: Intensity (0-1), Size (0-56), Threshold (0-1 — only pixels brighter than this bloom)
When to use: Magical/fantasy scenes, neon-heavy environments, sunrise/sunset glow, softening harsh lighting.
Pattern: local b = Instance.new("BloomEffect") b.Intensity = 0.5 b.Size = 30 b.Threshold = 0.9 b.Parent = game:GetService("Lighting")
Gotchas: Threshold 0.9 = only very bright things bloom (subtle). Threshold 0.5 = everything blooms (strong/dreamy). Size controls spread.

**BlurEffect** (PostEffect)
Applies gaussian blur to the entire screen.
Key Properties: Size (0-56, blur amount)
When to use: Menu backgrounds, pause screens, depth-of-field substitute, dazed/drunk effects. Size 0 = no blur. Toggle Enabled for performance.

**ColorCorrectionEffect** (PostEffect)
Adjusts colors globally — contrast, saturation, tint, brightness.
Key Properties: Brightness (default 0), Contrast (default 0), Saturation (default 0 — -1 = grayscale), TintColor (Color3 — multiplied with scene)
When to use: Mood setting (warm tint for cozy, blue tint for horror), death screen (saturation -0.8), stylized looks.
Pattern: local cc = Instance.new("ColorCorrectionEffect") cc.TintColor = Color3.fromRGB(255,240,220) cc.Contrast = 0.1 cc.Saturation = 0.1 cc.Brightness = 0.02 cc.Parent = game:GetService("Lighting")
Gotchas: TintColor multiplies — pure white = no tint. Warm tint: slight orange. Cool tint: slight blue.

**DepthOfFieldEffect** (PostEffect)
Blurs objects far from a focal point (camera-like depth of field).
Key Properties: FarIntensity (0-1), FocusDistance (studs from camera), InFocusRadius (studs — range that stays sharp), NearIntensity (0-1)
When to use: Cinematic shots, cutscenes, menu backgrounds, photo mode.
Pattern: local dof = Instance.new("DepthOfFieldEffect") dof.FarIntensity = 0.5 dof.FocusDistance = 20 dof.InFocusRadius = 10 dof.NearIntensity = 0.3 dof.Parent = game:GetService("Lighting")

**SunRaysEffect** (PostEffect)
God rays / crepuscular rays emanating from the sun.
Key Properties: Intensity (0-1), Spread (0-1 — how far rays extend)
When to use: Forest scenes, cathedral windows, atmospheric daytime, dramatic lighting. Looks bad at night.
Pattern: local sr = Instance.new("SunRaysEffect") sr.Intensity = 0.15 sr.Spread = 0.3 sr.Parent = game:GetService("Lighting")

**Sky** (Instance — child of Lighting)
Controls the skybox appearance.
Key Properties: SkyboxBk, SkyboxDn, SkyboxFt, SkyboxLf, SkyboxRt, SkyboxUp (image IDs for 6 faces), StarCount, MoonSize, SunAngularSize, CelestialBodiesShown, MoonTextureId, SunTextureId
When to use: Custom skyboxes for themed environments, disabling celestial bodies, starfield customization.
Pattern: local sky = Instance.new("Sky") sky.StarCount = 5000 sky.CelestialBodiesShown = true sky.Parent = game:GetService("Lighting")

### PARTICLES & EFFECTS

**ParticleEmitter** (Instance — child of BasePart or Attachment)
Emits 2D billboard particles from a part's volume. The most versatile effect system.
Key Properties: Texture (image), Color (ColorSequence), Size (NumberSequence — size over lifetime), Transparency (NumberSequence), Lifetime (NumberRange), Rate (particles/sec), Speed (NumberRange), SpreadAngle (Vector2 — cone), Acceleration (Vector3 — gravity), RotSpeed (NumberRange), Rotation (NumberRange), LightEmission (0-1 — additive blend), LightInfluence (0-1), Drag (0-inf), EmissionDirection, Shape (Box/Sphere/Cylinder/Disc), ShapePartial (0-1)
When to use: Fire, smoke, sparks, dust, magic effects, rain, snow, leaves, confetti, any particle-based effect.
Pattern: local pe = Instance.new("ParticleEmitter") pe.Texture = "rbxassetid://12345" pe.Rate = 50 pe.Lifetime = NumberRange.new(1,2) pe.Speed = NumberRange.new(3,5) pe.Size = NumberSequence.new({NumberSequenceKeypoint.new(0,1), NumberSequenceKeypoint.new(1,0)}) pe.Color = ColorSequence.new(Color3.fromRGB(255,150,50), Color3.fromRGB(255,50,0)) pe.LightEmission = 0.8 pe.Parent = firePart
Gotchas: High Rate + long Lifetime = many particles = lag. Keep Rate * Lifetime < 500 for performance. LightEmission=1 makes particles additive (glow). NumberSequence defines value over particle lifetime (0=birth, 1=death).

**Fire** (Instance — legacy, child of BasePart)
Quick fire effect. Less customizable than ParticleEmitter but simpler to use.
Key Properties: Size (number), Heat (controls upward speed), Color (primary), SecondaryColor, TimeScale
When to use: Quick campfire, torch, burning effect when you don't need precise control.
Pattern: local f = Instance.new("Fire") f.Size = 5 f.Heat = 10 f.Color = Color3.fromRGB(255,160,40) f.SecondaryColor = Color3.fromRGB(255,80,20) f.Parent = logPart

**Smoke** (Instance — legacy, child of BasePart)
Quick smoke effect.
Key Properties: Size (spread), RiseVelocity, Opacity (0-1), Color, TimeScale
When to use: Chimneys, exhaust pipes, smoldering ruins, fog machines.

**Sparkles** (Instance — legacy, child of BasePart)
Sparkle/glitter effect.
Key Properties: SparkleColor (Color3), TimeScale, Enabled
When to use: Magical items, collectibles, power-ups, fairy dust.

**Beam** (Instance — connects two Attachments)
A textured beam stretched between two points in 3D space.
Key Properties: Attachment0, Attachment1 (the two endpoints), Texture, Color (ColorSequence), Transparency (NumberSequence), Width0, Width1, CurveSize0, CurveSize1 (bezier control), FaceCamera (bool), LightEmission, LightInfluence, Segments (smoothness), TextureLength, TextureMode, TextureSpeed
When to use: Laser beams, energy tethers, lightning bolts, bridges of light, connection lines, rope visualization.
Pattern: local a0 = Instance.new("Attachment") a0.Parent = partA local a1 = Instance.new("Attachment") a1.Parent = partB local beam = Instance.new("Beam") beam.Attachment0 = a0 beam.Attachment1 = a1 beam.Width0 = 1 beam.Width1 = 0.5 beam.Color = ColorSequence.new(Color3.fromRGB(0,150,255)) beam.LightEmission = 1 beam.FaceCamera = true beam.Parent = partA
Gotchas: Both Attachments must exist before setting them. CurveSize0/1 create bezier curves. Segments > 1 needed for curved beams.

**Trail** (Instance — child of BasePart, needs two Attachments)
Leaves a fading trail behind a moving object.
Key Properties: Attachment0, Attachment1, Texture, Color (ColorSequence), Transparency (NumberSequence), Lifetime (seconds before trail fades), MinLength, WidthScale (NumberSequence), LightEmission, FaceCamera
When to use: Sword swings, moving projectiles, character dash effects, vehicle exhaust trails.
Pattern: local a0 = Instance.new("Attachment") a0.Position = Vector3.new(0,0,-1) a0.Parent = swordBlade local a1 = Instance.new("Attachment") a1.Position = Vector3.new(0,0,1) a1.Parent = swordBlade local trail = Instance.new("Trail") trail.Attachment0 = a0 trail.Attachment1 = a1 trail.Lifetime = 0.3 trail.Color = ColorSequence.new(Color3.new(1,1,1)) trail.Transparency = NumberSequence.new({NumberSequenceKeypoint.new(0,0), NumberSequenceKeypoint.new(1,1)}) trail.Parent = swordBlade
Gotchas: The two Attachments define the width/orientation of the trail ribbon. Trail only appears when the part MOVES. Lifetime controls how long the trail persists.

### PHYSICS & CONSTRAINTS

**Attachment** (Instance — child of BasePart)
A point in space relative to a part. Used as anchor points for constraints, beams, trails.
Key Properties: CFrame (relative to parent part), Position (shortcut for CFrame.Position), Axis, SecondaryAxis, Visible (debug)
When to use: REQUIRED for all constraints, beams, trails. Position relative to parent part.
Pattern: local att = Instance.new("Attachment") att.Position = Vector3.new(0,2,0) att.Parent = part -- 2 studs above the part's center

**WeldConstraint** (Instance)
Rigidly connects two parts — they move as one. No relative movement allowed.
Key Properties: Part0, Part1, Enabled
When to use: Connecting parts that should move together (door to frame, weapon to hand, car body to wheels). Simpler than Motor6D.
Pattern: local wc = Instance.new("WeldConstraint") wc.Part0 = partA wc.Part1 = partB wc.Parent = partA
Gotchas: At least one part must be Anchored=false for the weld to have effect. If both anchored, no movement. If neither anchored, they fall together.

**HingeConstraint** (Instance — uses Attachments)
Allows rotation around a single axis (like a door hinge or wheel axle).
Key Properties: Attachment0, Attachment1, ActuatorType (None/Motor/Servo), AngularVelocity (for Motor), MotorMaxAcceleration, MotorMaxTorque, TargetAngle (for Servo), ServoMaxTorque, LimitsEnabled, UpperAngle, LowerAngle
When to use: Doors, wheels, windmills, propellers, hinged platforms, levers.
Pattern: -- Door hinge: Attachment on door at hinge point, Attachment on frame at same world position local hinge = Instance.new("HingeConstraint") hinge.Attachment0 = doorAtt hinge.Attachment1 = frameAtt hinge.ActuatorType = Enum.ActuatorType.Servo hinge.TargetAngle = 90 hinge.ServoMaxTorque = 10000 hinge.Parent = door

**PrismaticConstraint** (Instance — uses Attachments)
Allows sliding along a single axis (like a piston or sliding door).
Key Properties: Attachment0, Attachment1, ActuatorType (None/Motor/Servo), Velocity (for Motor), TargetPosition (for Servo), LimitsEnabled, UpperLimit, LowerLimit
When to use: Sliding doors, elevators, pistons, extending bridges, telescoping parts.

**SpringConstraint** (Instance — uses Attachments)
Simulates a spring between two parts.
Key Properties: Attachment0, Attachment1, Stiffness, Damping, FreeLength, LimitsEnabled, MinLength, MaxLength, Coils (visual), Radius (visual)
When to use: Suspension, bouncy platforms, shock absorbers, springboards.

**RopeConstraint** (Instance — uses Attachments)
Simulates a rope — parts can't exceed the rope Length but can be closer.
Key Properties: Attachment0, Attachment1, Length, Restitution, Thickness, Visible
When to use: Swing ropes, hanging objects, tow cables, chandeliers, rope bridges.

**BallSocketConstraint** (Instance — uses Attachments)
Allows rotation in all directions (like a shoulder joint or trailer hitch).
Key Properties: Attachment0, Attachment1, LimitsEnabled, UpperAngle, TwistLimitsEnabled, TwistLowerAngle, TwistUpperAngle
When to use: Ragdoll joints, trailer hitches, pendulums, wrecking balls, puppet limbs.

**AlignPosition** (Instance — uses Attachments)
Applies force to move a part toward a target position.
Key Properties: Attachment0 (the part to move), Attachment1 (target) or Position (Vector3 target), Mode (OneAttachment/TwoAttachment), MaxForce, MaxVelocity, Responsiveness, ApplyAtCenterOfMass, ForceLimitMode, ForceRelativeTo, ReactionForceEnabled, RigidityEnabled
When to use: Hovering objects, floating platforms, magnetic attraction, guided missiles, tractor beams.

**AlignOrientation** (Instance — uses Attachments)
Applies torque to align a part's orientation to a target.
Key Properties: Attachment0, Attachment1, Mode, MaxTorque, MaxAngularVelocity, Responsiveness, RigidityEnabled, ReactionTorqueEnabled, AlignType, PrimaryAxisOnly
When to use: Gyroscopic stabilization, auto-leveling platforms, look-at systems, camera rigs.

**VectorForce** (Instance — child of BasePart, uses Attachment)
Applies a constant force in a specific direction.
Key Properties: Attachment0, Force (Vector3), ApplyAtCenterOfMass, RelativeTo (Attachment/World)
When to use: Gravity modification, wind, thrust, constant push/pull forces.

**Legacy Body Movers** (deprecated but still functional):
- **BodyVelocity**: Sets velocity directly. Properties: Velocity (Vector3), MaxForce (Vector3), P (aggressiveness). Use VectorForce or LinearVelocity instead.
- **BodyPosition**: Moves to position. Properties: Position, MaxForce, D (damping), P. Use AlignPosition instead.
- **BodyForce**: Constant force. Properties: Force (Vector3). Use VectorForce instead.
- **BodyGyro**: Aligns orientation. Properties: CFrame (target), MaxTorque, D, P. Use AlignOrientation instead.
Gotchas: Legacy body movers still work but are deprecated. New code should use Attachment-based constraints. Legacy movers don't need Attachments but offer less control.

### INTERACTION

**ClickDetector** (Instance — child of BasePart or Model)
Makes a part clickable by the player's mouse.
Key Properties: MaxActivationDistance (studs), CursorIcon (image for custom cursor)
Key Events: MouseClick (player), MouseHoverEnter (player), MouseHoverLeave (player), RightMouseClick (player)
When to use: Simple click interactions (open door, pick up item, toggle switch). For mobile-friendly, prefer ProximityPrompt.
Pattern: local cd = Instance.new("ClickDetector") cd.MaxActivationDistance = 10 cd.Parent = doorPart cd.MouseClick:Connect(function(player) toggleDoor() end)
Gotchas: Only fires on the server in a Script. MaxActivationDistance is from character, not camera. Doesn't work on mobile easily — use ProximityPrompt instead.

**ProximityPrompt** (Instance — child of BasePart or Model)
Shows an interaction prompt when the player is near (E to interact, etc.). Works on all platforms.
Key Properties: ActionText ("Open", "Collect"), ObjectText ("Door", "Chest"), MaxActivationDistance, HoldDuration (seconds, 0 = instant), RequiresLineOfSight, KeyboardKeyCode, GamepadKeyCode, Style (Default/Custom), Exclusivity
Key Events: Triggered (player), TriggerEnded (player), PromptShown (player), PromptHidden (player)
When to use: ALL interactions in modern Roblox. Doors, NPCs, items, shops, vehicles. Better than ClickDetector because it works on mobile/gamepad.
Pattern: local pp = Instance.new("ProximityPrompt") pp.ActionText = "Open" pp.ObjectText = "Chest" pp.MaxActivationDistance = 8 pp.HoldDuration = 0.5 pp.Parent = chestPart pp.Triggered:Connect(function(player) openChest(player) end)

**Seat** (Instance — BasePart)
A part that players can sit on. Automatically welds the character when they touch it.
Key Properties: Disabled (bool), Occupant (Humanoid — read-only)
When to use: Chairs, benches, stools. Player touches it and sits automatically.
Gotchas: Players sit on touch — can be annoying. Set Disabled=true and use ProximityPrompt to control when sitting happens.

**VehicleSeat** (Instance — BasePart)
A seat that gives the player vehicle-like controls (throttle, steer).
Key Properties: Disabled, MaxSpeed, Torque, TurnSpeed, Throttle (-1 to 1, read from input), Steer (-1 to 1, read from input), Occupant
When to use: Driveable vehicles. The Steer/Throttle values update based on player WASD/arrow input.
Pattern: Connect to VehicleSeat property changes to drive HingeConstraints on wheels.

### TOOLS & INVENTORY

**Tool** (Instance — child of Backpack or Character)
An equippable item that goes in the player's hotbar and hand.
Key Properties: Name (displayed in hotbar), CanBeDropped, RequiresHandle (needs a child Part named "Handle"), ToolTip, Enabled, TextureId (hotbar icon)
Key Events: Activated (click while equipped), Deactivated, Equipped, Unequipped
When to use: Weapons, tools, items players hold (sword, pickaxe, wand, gun).
Pattern: local tool = Instance.new("Tool") tool.Name = "Magic Sword" tool.RequiresHandle = true local handle = Instance.new("Part") handle.Name = "Handle" handle.Size = Vector3.new(1,1,4) handle.Parent = tool tool.Parent = player.Backpack
Gotchas: Must have a child Part named "Handle" if RequiresHandle=true. Tool goes in Backpack (inventory) and moves to Character when equipped.

**Backpack** (Instance — child of Player)
The player's inventory. Contains Tools.
When to use: Accessed to give/remove tools from players. StarterPack contents are cloned here on spawn.

**StarterPack** (Instance — child of game)
Tools placed here are given to ALL players on spawn (cloned to their Backpack).
When to use: Default loadout — sword, tool, etc. that every player starts with.

### NETWORKING

**RemoteEvent** (Instance — in ReplicatedStorage)
One-way communication between server and client(s). Fire-and-forget.
Key Methods: FireServer(args...) — client → server. FireClient(player, args...) — server → client. FireAllClients(args...) — server → all clients.
Key Events: OnServerEvent (fires on server with player + args), OnClientEvent (fires on client with args)
When to use: Sending data one-way: client tells server about an action, server tells client about an update.
Pattern: -- Server: remote.OnServerEvent:Connect(function(player, action, data) end)
-- Client: remote:FireServer("buy", itemId)
Gotchas: NEVER trust data from FireServer — validate EVERYTHING on the server. Client can send anything. Rate-limit remote calls. Always include player parameter check.

**RemoteFunction** (Instance — in ReplicatedStorage)
Two-way communication — client calls server (or vice versa) and WAITS for a response.
Key Methods: InvokeServer(args...) — client calls server, waits for return. InvokeClient(player, args...) — server calls client, waits.
Key Callbacks: OnServerInvoke (function(player, args) return result end), OnClientInvoke
When to use: When the client needs a response (get player data, validate purchase, request info).
Gotchas: InvokeClient is DANGEROUS — client can hang indefinitely, freeze the server thread. Avoid server→client RemoteFunctions. Use RemoteEvent + RemoteEvent for server→client→server round trip instead. InvokeServer is fine.

**BindableEvent** (Instance)
Same-side communication (server↔server or client↔client). Like a custom event.
Key Methods: Fire(args...). Event: Event.
When to use: Decoupled server scripts communicating, event buses, plugin internal communication.
Pattern: bindable.Event:Connect(function(data) handleData(data) end) bindable:Fire({score = 100})

**BindableFunction** (Instance)
Same-side function call with return value.
Key Methods: Invoke(args...). Callback: OnInvoke.
When to use: One module exposing a function to another without require().

### DATA PERSISTENCE

**DataStoreService** (service)
Persistent key-value storage. Data survives server shutdowns. The primary save system.
Key Methods: GetDataStore(name), GetOrderedDataStore(name), GetGlobalDataStore()
DataStore Methods: GetAsync(key), SetAsync(key, value), UpdateAsync(key, callback), RemoveAsync(key), ListKeysAsync(prefix, pageSize)
When to use: Saving player data (coins, inventory, level, settings), global data (server configs, announcements).
Pattern: local ds = game:GetService("DataStoreService"):GetDataStore("PlayerData") local success, data = pcall(function() return ds:GetAsync("Player_" .. player.UserId) end)
Gotchas: ALWAYS wrap in pcall() — DataStore calls can fail. Rate limits: 60 + numPlayers*10 requests/min. Use UpdateAsync for atomic read-modify-write. SetAsync overwrites without reading. Data limit: 4MB per key (as JSON string). Save on PlayerRemoving AND BindToClose.

**OrderedDataStore** (from DataStoreService)
Like DataStore but values must be integers. Supports sorted retrieval.
Key Methods: GetSortedAsync(ascending, pageSize, minValue, maxValue) → DataStorePages
When to use: Leaderboards, rankings, high scores, any sorted numeric data.
Pattern: local ods = game:GetService("DataStoreService"):GetOrderedDataStore("Coins") local pages = ods:GetSortedAsync(false, 10) -- top 10, descending local data = pages:GetCurrentPage() for _, entry in ipairs(data) do print(entry.key, entry.value) end

**MemoryStoreService** (service)
Temporary shared storage across servers. Data expires after a set time (max 45 days).
Key Methods: GetQueue(name), GetHashMap(name), GetSortedMap(name)
When to use: Cross-server communication, matchmaking queues, temporary auction houses, global events, live leaderboards.
Pattern: local ms = game:GetService("MemoryStoreService") local queue = ms:GetQueue("Matchmaking") queue:AddAsync("PlayerData", 30) -- expires in 30 seconds
Gotchas: Data is NOT persistent — it expires. For permanent data, use DataStoreService. Rate limits are generous but exist.

### SERVICES (as Instances)

**Players** (service)
Manages connected players.
Key Events: PlayerAdded(player), PlayerRemoving(player)
Key Methods: GetPlayers(), GetPlayerByUserId(id), GetPlayerFromCharacter(model)
Key Properties: LocalPlayer (client only), MaxPlayers, RespawnTime
Child of each Player: Backpack, StarterGear, PlayerGui, PlayerScripts, Character (Model in workspace), leaderstats (Folder for leaderboard)

**Teams** (service)
Manages teams for team-based games.
Key Properties: Each Team has: Name, TeamColor (BrickColor), AutoAssignable
When to use: Team deathmatch, capture the flag, role assignment (cops vs robbers).

**Workspace** (service/container)
The 3D world. All visible parts, models, terrain live here.
Key Properties: Gravity (default 196.2), CurrentCamera, Terrain, StreamingEnabled, DistributedGameTime
Key Methods: Raycast(origin, direction, params), FindPartOnRay (deprecated — use Raycast)

**Lighting** (service)
Controls global lighting, time of day, and post-processing effects.
Key Properties: ClockTime (0-24, hour of day), TimeOfDay (string "14:30:00"), Ambient (Color3), OutdoorAmbient, Brightness, ColorShift_Bottom, ColorShift_Top, EnvironmentDiffuseScale, EnvironmentSpecularScale, ExposureCompensation, FogColor, FogEnd, FogStart, GeographicLatitude, GlobalShadows, Technology (Voxel/ShadowMap/Future — Future is best quality)
When to use: Set time of day, fog, ambient light, and host post-processing effects (Bloom, Blur, ColorCorrection, etc.).
Pattern: local lighting = game:GetService("Lighting") lighting.ClockTime = 14 lighting.Ambient = Color3.fromRGB(40,40,50) lighting.Technology = Enum.Technology.Future

**SoundService** (service)
Global audio settings and 2D sound host.
Key Properties: AmbientReverb (Enum.ReverbType), DistanceFactor, DopplerScale, RolloffScale, RespectFilteringEnabled
When to use: Host global music/sounds here (no spatial positioning). Configure reverb globally.

**ReplicatedStorage** (service/container)
Storage visible to both server and client. Modules, RemoteEvents, shared assets go here.
When to use: RemoteEvents/Functions, shared ModuleScripts, UI templates, shared configs, tool models.

**ServerStorage** (service/container)
Server-only storage. Clients cannot see or access this.
When to use: Server-only modules, map templates to clone, NPC templates, secret configs, server-side assets.

**ServerScriptService** (service/container)
Server-only scripts. The primary location for server Scripts.
When to use: All server-side game logic scripts go here. DataStore handlers, game loop, NPC controllers, anti-cheat.

**StarterGui** (service/container)
ScreenGuis placed here are cloned to each player's PlayerGui on spawn.
When to use: All UI — HUD, menus, health bars, inventory screens. Set ResetOnSpawn per ScreenGui.

**StarterPlayerScripts** (container inside StarterPlayer)
LocalScripts placed here run once when the player joins. Not reset on death.
When to use: Persistent client scripts — camera controllers, input handlers, music systems.

**StarterCharacterScripts** (container inside StarterPlayer)
LocalScripts/Scripts placed here are cloned into the character Model on every spawn.
When to use: Per-life scripts — custom animations, character effects, footstep sounds.

**ReplicatedFirst** (service/container)
Content here loads BEFORE anything else replicates. Used for loading screens.
When to use: Loading screen LocalScript + ScreenGui. Only place that guarantees code runs before the game world loads.
Pattern: -- LocalScript in ReplicatedFirst: local sg = script.Parent.LoadingScreen:Clone() sg.Parent = player.PlayerGui repeat task.wait() until game:IsLoaded() sg:Destroy()
`

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PART 2: EVERY MATERIAL AND ITS USE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const ENCYCLOPEDIA_MATERIALS = `
## ROBLOX MATERIALS ENCYCLOPEDIA — EVERY MATERIAL

### CORE BUILD MATERIALS

**Plastic** — Default Roblox material. Slight sheen, minimal texture. Looks toy-like/cartoony.
Typical RGB: Any — shows color accurately. Best for: Cartoony builds, toys, generic placeholder, UI-style worlds.
Pairs with: SmoothPlastic for contrast. Genre: Casual, tycoon, simulator.

**SmoothPlastic** — Completely smooth and matte. No texture at all. Clean modern look. (AVOID — Vyren hates this material. Use Concrete, Wood, Brick, or Metal instead.)
Typical RGB: Any. Best for: Almost never. Genre: N/A.

**Neon** — Self-illuminating, emits colored light. No shadows on its surface. Glows.
Typical RGB: Bright saturated colors — RGB(0,170,255) blue, RGB(255,50,100) pink, RGB(0,255,100) green, RGB(255,255,0) yellow.
Best for: Sci-fi lights, tron lines, glowing accents, buttons, indicators, magical runes, nightclub lighting.
Pairs with: Metal, DiamondPlate, Concrete (dark). Genre: Sci-fi, cyberpunk, fantasy, nightclub.
Gotcha: Neon parts cast colored light on nearby surfaces. Use small Neon parts for accent, not large walls.

**Wood** — Horizontal wood grain texture. Warm, natural feel.
Typical RGB: RGB(120,80,40) dark oak, RGB(180,140,80) pine, RGB(90,55,25) walnut, RGB(210,170,120) birch.
Best for: Floors, furniture, fences, cabins, medieval buildings, picture frames, shelves.
Pairs with: Brick, Concrete, Fabric, Glass. Genre: Medieval, cabin, rustic, residential, fantasy.

**WoodPlanks** — Individual plank pattern with visible board gaps. More rustic than Wood.
Typical RGB: Same as Wood but works best in medium tones. Best for: Decks, barn walls, old floors, docks, pirate ships, crates.
Pairs with: Wood, Brick, Metal, Cobblestone. Genre: Pirate, western, rustic, medieval.

**Marble** — Smooth stone with subtle veining. Elegant, expensive feel.
Typical RGB: RGB(240,235,230) white marble, RGB(180,175,170) gray marble, RGB(60,60,60) black marble, RGB(200,180,160) cream.
Best for: Pillars, statues, palace floors, bathrooms, countertops, grand staircases.
Pairs with: Gold Metal parts, Glass, Granite. Genre: Palace, classical, luxury, temple.

**Slate** — Rough, layered stone texture. Natural and rugged.
Typical RGB: RGB(80,80,85) dark slate, RGB(130,125,120) medium, RGB(100,95,90) blue-gray.
Best for: Castle walls, cliff faces, dungeon floors, stone paths, mountain rocks, roof tiles.
Pairs with: Brick, Cobblestone, Granite, Wood. Genre: Medieval, gothic, castle, dungeon.

**Concrete** — Smooth industrial concrete with subtle variation. Clean and modern.
Typical RGB: RGB(180,175,170) light concrete, RGB(140,135,130) medium, RGB(100,95,90) dark, RGB(200,195,190) white.
Best for: Modern buildings, foundations, sidewalks, bridges, bunkers, parking structures.
Pairs with: Metal, Glass, Brick, DiamondPlate. Genre: Modern, industrial, urban, military.

**Granite** — Speckled stone texture. Dense, natural, premium feel.
Typical RGB: RGB(150,140,135) gray, RGB(170,155,140) warm, RGB(100,90,85) dark.
Best for: Countertops, monument bases, tombstones, castle foundations, boulders.
Pairs with: Marble, Concrete, Slate, Metal. Genre: Classical, modern kitchen, memorial.

**Brick** — Repeating brick pattern with visible mortar lines. Classic building material.
Typical RGB: RGB(180,90,60) red brick, RGB(200,160,100) tan/yellow brick, RGB(140,130,120) gray brick, RGB(160,80,50) dark red.
Best for: Walls, chimneys, fireplaces, walkways, schools, warehouses, apartments.
Pairs with: Concrete, Wood, Metal, Glass. Genre: Urban, residential, industrial, school.

**Cobblestone** — Irregular rounded stone pattern. Old-world feel.
Typical RGB: RGB(140,135,130) gray, RGB(160,150,140) warm, RGB(110,105,100) dark.
Best for: Paths, roads, castle courtyards, medieval streets, well bases, old walls.
Pairs with: Brick, Wood, Slate, WoodPlanks. Genre: Medieval, village, fantasy, old town.

**Metal** — Brushed/industrial metal texture. Strong, modern, industrial.
Typical RGB: RGB(160,160,165) silver, RGB(80,80,85) dark steel, RGB(120,115,110) iron, RGB(200,180,60) gold, RGB(180,100,50) copper/bronze.
Best for: Beams, pipes, railings, machinery, vehicles, weapons, hinges, trim.
Pairs with: Concrete, Glass, DiamondPlate, Neon. Genre: Industrial, sci-fi, modern, military.

**CorrodedMetal** — Rusty, decayed metal. Weathered and aged.
Typical RGB: RGB(140,90,50) rust, RGB(100,70,40) dark rust, RGB(160,110,60) light rust.
Best for: Abandoned buildings, junkyards, post-apocalyptic, old pipes, wrecks, worn machinery.
Pairs with: Concrete (cracked), Wood (old), Slate. Genre: Post-apocalyptic, horror, abandoned, steampunk.

**DiamondPlate** — Textured metal with diamond tread pattern. Anti-slip industrial look.
Typical RGB: RGB(160,160,160) silver, RGB(100,100,100) dark, RGB(180,170,50) yellow safety.
Best for: Factory floors, truck beds, ramps, industrial stairs, military vehicles, utility panels.
Pairs with: Metal, Concrete, CorrodedMetal. Genre: Industrial, military, factory, utility.

**Foil** — Highly reflective, mirror-like metallic surface.
Typical RGB: RGB(200,200,210) chrome, RGB(220,200,60) gold foil, RGB(200,100,100) rose gold.
Best for: Mirrors (when paired with Reflectance), chrome accents, futuristic trim, jewelry.
Pairs with: Glass, Metal, Neon. Genre: Futuristic, luxury, sci-fi.

**Glass** — Transparent material. Use with Transparency property for see-through effect.
Typical RGB: RGB(200,220,240) clear blue, RGB(220,240,220) green tint, RGB(240,230,220) warm, RGB(255,255,255) clear.
Best for: Windows (Transparency 0.3-0.6), skylights, display cases, aquariums, bottles, sci-fi screens.
Pairs with: Metal, Wood, Concrete. Genre: Modern, sci-fi, residential, commercial.
Gotcha: Set Transparency to 0.3-0.7 for glass effect. 0 = opaque colored glass. Material alone doesn't make it transparent.

**Sand** — Granular, rough texture. Beach/desert feel.
Typical RGB: RGB(220,200,160) beach sand, RGB(200,180,130) desert, RGB(240,220,180) light sand.
Best for: Beaches, deserts, sandcastles, garden paths, zen gardens, terrain detail.
Pairs with: Grass, Rock, Water terrain. Genre: Beach, desert, tropical, sandbox.

**Fabric** — Soft, woven cloth texture.
Typical RGB: RGB(180,50,50) red cloth, RGB(50,50,150) blue, RGB(240,230,210) canvas, RGB(60,60,60) dark.
Best for: Flags, awnings, carpets, curtains, furniture upholstery, market stall covers, sails.
Pairs with: Wood, Brick, Metal (rods). Genre: Medieval market, residential, pirate, cozy.

**Ice** — Translucent, crystalline frozen surface with slight blue tint.
Typical RGB: RGB(200,220,240) light ice, RGB(150,200,230) blue ice, RGB(240,245,255) white ice.
Best for: Frozen lakes, icicles, ice caves, winter scenery, frozen food, magic ice.
Pairs with: Snow terrain, Glass, Neon (blue). Genre: Winter, arctic, frozen, ice kingdom.

### TERRAIN-ONLY MATERIALS (used with workspace.Terrain:Fill*)

**Grass** — Green ground cover. The default outdoor terrain.
Typical RGB: Terrain colors are set via Terrain.MaterialColors. Default is natural green.
Best for: Parks, fields, yards, forest floors, plains. The most common ground material.

**LeafyGrass** — Taller, leafier grass variant. More wild/natural than Grass.
Best for: Meadows, overgrown areas, forest undergrowth, savanna, swamps.

**Snow** — White snow coverage. Cold environment base.
Best for: Mountain tops, winter scenes, arctic environments, holiday builds.

**Mud** — Dark, wet earth. Transitional material.
Best for: Riverbanks, swamp edges, construction sites, rainy areas. Great for natural transitions between water and grass.

**Ground** — Dry, cracked earth. Arid environment.
Best for: Deserts, canyons, drought areas, wastelands, dry riverbeds.

**Rock** — Generic rock texture. Most common stone terrain.
Best for: Mountains, cliffs, cave walls, boulders, rocky shores.

**Basalt** — Dark volcanic rock. Columnar pattern.
Best for: Volcanic areas, dark cliffs, alien landscapes, dramatic rock formations.

**CrackedLava** — Glowing orange cracks in dark rock. Volcanic.
Best for: Volcanoes, lava fields, hell/underworld, fire biomes. Self-illuminating.

**Salt** — White crystalline flat terrain.
Best for: Salt flats, alien landscapes, dried lake beds, crystal caves.

**Limestone** — Light, smooth sedimentary rock.
Best for: Mediterranean cliffs, cave formations, light-colored mountains, ancient ruins.

**Sandstone** — Warm-toned layered rock. Desert canyon material.
Best for: Desert canyons, mesas, ancient temples, Egyptian themes, southwestern architecture.

**Pavement** — Smooth road/sidewalk surface.
Best for: Roads, sidewalks, parking lots, urban paths, plazas.

**Asphalt** — Dark road surface with slight texture.
Best for: Main roads, highways, runways, race tracks, basketball courts.

### NEWER MATERIALS (2023+)

**Cardboard** — Corrugated cardboard texture.
Typical RGB: RGB(180,150,100) natural, RGB(160,130,80) aged. Best for: Boxes, packaging, fort builds, cardboard-themed games, prototypes.
Pairs with: Wood, Fabric. Genre: Casual, creative, cardboard world.

**Carpet** — Soft carpet fiber texture.
Typical RGB: RGB(140,40,40) red carpet, RGB(60,60,100) navy, RGB(180,170,150) beige.
Best for: Indoor floors, hotel lobbies, living rooms, offices, stairs.
Pairs with: Wood (baseboards), Concrete (walls). Genre: Residential, hotel, theater.

**CeramicTiles** — Smooth tile grid pattern.
Typical RGB: RGB(240,240,240) white tile, RGB(200,220,230) blue tile, RGB(220,200,180) cream.
Best for: Bathrooms, kitchens, pool areas, hospitals, subway stations.
Pairs with: Marble, Concrete, Metal. Genre: Modern, hospital, bathroom, pool.

**ClayRoofTiles** — Terracotta roof tile pattern.
Typical RGB: RGB(180,90,50) terracotta, RGB(160,80,40) dark terra, RGB(200,120,70) light.
Best for: Mediterranean roofs, Spanish colonial, Tuscan villas, historical buildings.
Pairs with: Brick, Marble, Plaster. Genre: Mediterranean, Spanish, Italian.

**Plaster** — Smooth stucco/plaster wall texture.
Typical RGB: RGB(240,235,220) cream, RGB(230,220,200) warm white, RGB(200,190,170) aged.
Best for: Interior walls, Mediterranean exteriors, old buildings, smooth walls.
Pairs with: Wood (trim), ClayRoofTiles, Brick. Genre: Mediterranean, residential, classical.

**RoofShingles** — Overlapping shingle pattern for rooftops.
Typical RGB: RGB(60,60,60) dark gray, RGB(80,50,40) brown, RGB(100,40,40) red.
Best for: Residential roofs, cabins, suburban houses. Replaces WedgePart-only roofs.
Pairs with: Brick, Wood, Plaster. Genre: Residential, suburban, cabin.

**Rubber** — Matte rubber surface with slight grip texture.
Typical RGB: RGB(40,40,40) black rubber, RGB(80,80,80) gray. Best for: Tires, gym floors, handles, grips, bumpers, playground surfaces.
Pairs with: Metal, Concrete. Genre: Gym, playground, vehicle, industrial.

### MATERIAL SELECTION GUIDE BY GENRE

Medieval/Fantasy: Slate (walls), Cobblestone (floors), Wood (beams), WoodPlanks (doors), Brick (chimneys), Fabric (banners)
Modern/Urban: Concrete (structure), Glass (windows), Metal (trim), Brick (accent walls), CeramicTiles (bathrooms)
Sci-Fi/Cyberpunk: Metal (everything), Neon (lights), Glass (screens), DiamondPlate (floors), Concrete (dark, for contrast)
Horror/Abandoned: CorrodedMetal (pipes), Concrete (cracked walls), WoodPlanks (rotting floors), Slate (dungeon), Cobblestone (old paths)
Tropical/Beach: Sand, Wood (docks), WoodPlanks (huts), Fabric (sails), Grass terrain, LeafyGrass
Winter/Arctic: Ice, Snow terrain, Concrete (light), Glass (icicles), Metal (gray)
Western: WoodPlanks (buildings), Sand, Cobblestone (paths), CorrodedMetal (railings), Brick (saloon)
Industrial/Factory: DiamondPlate (floors), Metal (structures), CorrodedMetal (old equipment), Concrete (walls), Rubber (safety)
Luxury/Palace: Marble (floors/columns), Granite (counters), Glass, Metal (gold-tinted), Carpet (floors), Fabric (drapes)
`

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PART 3: COMPLETE COLOR THEORY FOR ROBLOX
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const ENCYCLOPEDIA_COLORS = `
## ROBLOX COLOR THEORY — COMPLETE REFERENCE

### 30 NAMED COLOR PALETTES WITH EXACT RGB VALUES

**1. Medieval Castle**
Primary: RGB(120,110,100) stone gray | Secondary: RGB(80,70,60) dark stone | Accent: RGB(160,40,40) banner red
Trim: RGB(60,50,40) iron | Wood: RGB(100,70,40) dark oak | Floor: RGB(90,85,80) dungeon stone

**2. Modern Minimalist**
Primary: RGB(240,240,240) white | Secondary: RGB(60,60,60) charcoal | Accent: RGB(0,120,200) blue pop
Trim: RGB(30,30,30) near-black | Wood: RGB(180,150,110) light oak | Glass: RGB(200,220,240) clear blue

**3. Fantasy Enchanted Forest**
Primary: RGB(40,80,40) deep green | Secondary: RGB(80,60,40) bark brown | Accent: RGB(180,100,255) magic purple
Trim: RGB(60,120,60) leaf green | Glow: RGB(100,255,150) fairy green | Stone: RGB(100,100,90) moss rock

**4. Horror Abandoned**
Primary: RGB(60,55,50) grim gray | Secondary: RGB(40,35,30) shadow | Accent: RGB(150,30,30) blood red
Trim: RGB(80,70,60) rust | Wood: RGB(70,55,35) rotting wood | Light: RGB(200,180,120) sickly yellow

**5. Tropical Paradise**
Primary: RGB(240,220,180) sand beige | Secondary: RGB(60,140,200) ocean blue | Accent: RGB(255,100,50) coral orange
Trim: RGB(100,70,40) palm brown | Leaf: RGB(50,160,50) tropical green | Water: RGB(80,200,220) lagoon

**6. Cyberpunk Neon**
Primary: RGB(20,20,30) dark city | Secondary: RGB(40,40,60) concrete | Accent: RGB(255,0,100) hot pink
Neon1: RGB(0,255,200) cyan | Neon2: RGB(255,50,255) magenta | Metal: RGB(60,60,70) dark steel

**7. Cozy Cottage**
Primary: RGB(210,190,160) warm cream | Secondary: RGB(140,100,60) wood brown | Accent: RGB(180,60,50) door red
Trim: RGB(245,240,230) off-white | Roof: RGB(100,80,60) dark wood | Garden: RGB(80,140,60) green

**8. Space Station**
Primary: RGB(200,200,210) white hull | Secondary: RGB(60,65,75) dark panels | Accent: RGB(0,200,255) blue light
Warning: RGB(255,200,0) yellow | Emergency: RGB(255,50,50) red | Glow: RGB(100,255,200) green status

**9. Western Frontier**
Primary: RGB(190,160,120) dusty tan | Secondary: RGB(130,90,50) dark wood | Accent: RGB(100,40,30) brick red
Sand: RGB(220,200,160) desert | Metal: RGB(120,100,80) old iron | Leather: RGB(140,80,40) saddle brown

**10. Underwater Kingdom**
Primary: RGB(30,60,100) deep blue | Secondary: RGB(40,100,120) teal | Accent: RGB(255,200,50) gold coral
Glow: RGB(80,200,180) bioluminescent | Sand: RGB(200,190,160) sea floor | Shell: RGB(240,180,200) pink pearl

**11. Volcanic Fortress**
Primary: RGB(50,40,35) dark basalt | Secondary: RGB(80,60,50) warm stone | Accent: RGB(255,100,0) lava orange
Glow: RGB(255,200,50) hot yellow | Rock: RGB(60,50,45) obsidian | Metal: RGB(100,80,60) bronze

**12. Winter Wonderland**
Primary: RGB(240,245,255) snow white | Secondary: RGB(180,200,220) ice blue | Accent: RGB(200,40,40) red scarf
Wood: RGB(120,80,50) cabin brown | Pine: RGB(40,80,50) evergreen | Frost: RGB(200,220,240) frost blue

**13. Steampunk**
Primary: RGB(140,110,70) brass | Secondary: RGB(80,60,40) dark wood | Accent: RGB(180,140,60) gold
Metal: RGB(100,100,105) steel | Copper: RGB(180,100,50) copper | Leather: RGB(100,60,30) dark leather

**14. Candy Land**
Primary: RGB(255,180,200) pink | Secondary: RGB(180,240,255) baby blue | Accent: RGB(255,230,100) lemon yellow
Green: RGB(150,255,150) mint | Purple: RGB(200,150,255) lavender | White: RGB(255,250,240) frosting

**15. Japanese Temple**
Primary: RGB(200,50,50) vermillion red | Secondary: RGB(50,45,40) dark wood | Accent: RGB(220,200,60) gold
White: RGB(240,235,225) paper white | Stone: RGB(160,155,145) gray | Roof: RGB(40,40,45) dark tile

**16. Egyptian Desert**
Primary: RGB(220,190,140) sandstone | Secondary: RGB(180,150,100) darker sand | Accent: RGB(0,100,180) lapis blue
Gold: RGB(220,180,50) pharaoh gold | Stone: RGB(200,190,170) limestone | Shadow: RGB(140,120,90) shade

**17. Pirate Cove**
Primary: RGB(130,90,50) ship wood | Secondary: RGB(80,65,40) dark planks | Accent: RGB(200,50,40) red flag
Gold: RGB(255,210,50) treasure | Rope: RGB(180,160,120) hemp | Sea: RGB(50,100,130) dark ocean

**18. Alien Planet**
Primary: RGB(80,50,120) alien purple | Secondary: RGB(40,80,60) strange green | Accent: RGB(200,255,0) acid green
Glow: RGB(0,255,200) xenon | Rock: RGB(70,60,80) dark alien stone | Sky: RGB(120,80,160) purple atmosphere

**19. Art Deco**
Primary: RGB(30,30,30) black | Secondary: RGB(240,220,180) cream | Accent: RGB(200,170,50) gold
Teal: RGB(0,120,120) deco teal | Silver: RGB(190,190,195) chrome | Rose: RGB(180,100,100) muted rose

**20. Jungle Ruins**
Primary: RGB(80,90,60) moss green | Secondary: RGB(140,130,110) weathered stone | Accent: RGB(200,180,60) gold idol
Vine: RGB(50,100,40) deep green | Stone: RGB(120,115,105) ruin gray | Earth: RGB(100,80,50) dirt

**21. Arctic Research Base**
Primary: RGB(220,225,230) white metal | Secondary: RGB(80,90,100) dark panels | Accent: RGB(255,150,0) safety orange
Blue: RGB(0,100,200) instrument blue | Red: RGB(200,30,30) emergency | Ice: RGB(180,210,240) glacier

**22. Haunted Mansion**
Primary: RGB(60,50,60) dark purple-gray | Secondary: RGB(80,60,50) old wood | Accent: RGB(100,200,100) ghostly green
Candle: RGB(255,200,100) candlelight | Dust: RGB(160,150,140) dusty | Curtain: RGB(100,30,40) dark red

**23. Racing Circuit**
Primary: RGB(40,40,40) asphalt black | Secondary: RGB(255,255,255) white line | Accent: RGB(255,0,0) racing red
Green: RGB(60,140,60) grass | Barrier: RGB(255,200,0) yellow | Tire: RGB(30,30,30) rubber black

**24. Cloud Kingdom**
Primary: RGB(255,250,240) cloud white | Secondary: RGB(200,210,230) sky blue | Accent: RGB(255,210,100) golden sun
Marble: RGB(240,235,245) white marble | Gold: RGB(220,190,70) divine gold | Rainbow: RGB(180,140,200) soft purple

**25. Swamp/Bayou**
Primary: RGB(60,70,40) murky green | Secondary: RGB(80,70,50) mud brown | Accent: RGB(150,180,50) lime moss
Water: RGB(50,70,40) dark swamp | Wood: RGB(90,75,55) cypress | Fog: RGB(120,130,100) haze

**26. Neon Arcade**
Primary: RGB(15,15,25) black | Secondary: RGB(30,30,50) dark blue | Accent: RGB(255,0,255) magenta
Cyan: RGB(0,255,255) | Yellow: RGB(255,255,0) | Green: RGB(0,255,0) | Red: RGB(255,0,0)

**27. Farm/Ranch**
Primary: RGB(200,50,50) barn red | Secondary: RGB(240,235,220) white fence | Accent: RGB(100,160,60) pasture green
Wood: RGB(150,110,60) fence post | Hay: RGB(220,200,120) straw | Dirt: RGB(140,110,70) path

**28. Military/Bunker**
Primary: RGB(80,85,70) olive drab | Secondary: RGB(60,60,55) dark green-gray | Accent: RGB(180,160,100) desert tan
Metal: RGB(100,100,95) gunmetal | Sand: RGB(195,180,140) camo tan | Black: RGB(30,30,30) tactical

**29. Royal Palace**
Primary: RGB(30,30,80) royal blue | Secondary: RGB(240,230,210) ivory | Accent: RGB(200,170,40) gold
Velvet: RGB(120,20,40) burgundy | Marble: RGB(245,240,235) white | Silver: RGB(200,200,210) polished

**30. Tron/Digital**
Primary: RGB(10,10,15) void black | Secondary: RGB(20,20,30) dark grid | Accent: RGB(0,200,255) tron blue
Orange: RGB(255,150,0) tron orange | White: RGB(240,240,250) grid white | Glow: RGB(0,255,200) data green

### COLOR HARMONY THEORY

**Complementary Colors** (opposite on color wheel — maximum contrast):
Red ↔ Cyan, Orange ↔ Blue, Yellow ↔ Purple, Green ↔ Magenta
Use for: Accent colors that pop. High energy, attention-grabbing. Example: blue building + orange door.

**Analogous Colors** (adjacent on color wheel — harmonious):
Red → Orange → Yellow, Blue → Cyan → Green, Purple → Magenta → Red
Use for: Cohesive, natural-looking palettes. Low contrast, calming. Example: forest with greens + yellow-greens.

**Triadic Colors** (120° apart — balanced vibrance):
Red + Yellow + Blue, Orange + Green + Purple, Cyan + Magenta + Yellow
Use for: Playful, cartoony, vibrant scenes. Good for kids' games. Example: playground with red slide, blue swings, yellow sandbox.

**Split-Complementary** (base + two colors adjacent to its complement):
Blue + Yellow-Orange + Red-Orange. Green + Red-Orange + Red-Purple.
Use for: Contrast with less tension than complementary. More nuanced. Example: green forest + warm sunset accents.

### SHADE AND TINT GENERATION

To darken a color (shade): Multiply each channel by 0.8 (20% darker) or 0.6 (40% darker)
  Example: RGB(200,100,50) → 20% darker → RGB(160,80,40)
  In Luau: local darker = Color3.new(c.R*0.8, c.G*0.8, c.B*0.8)

To lighten a color (tint): Lerp toward white by 20% or 40%
  Example: RGB(100,50,25) → 20% lighter → RGB(131,90,70) — add 20% of (255-channel)
  In Luau: local lighter = c:Lerp(Color3.new(1,1,1), 0.2)

To desaturate: Average all channels, then lerp toward that average
  local avg = (c.R + c.G + c.B) / 3
  local desat = Color3.new(c.R*0.7+avg*0.3, c.G*0.7+avg*0.3, c.B*0.7+avg*0.3)

### COLOR TEMPERATURE

Warm colors: Higher R, moderate G, lower B. Feel: cozy, inviting, energetic, close.
  Warm white: RGB(255,240,210). Warm accent: RGB(255,180,100). Sunset: RGB(255,130,50).
Cool colors: Lower R, moderate G, higher B. Feel: calm, professional, distant, cold.
  Cool white: RGB(220,230,255). Cool accent: RGB(100,180,255). Moonlight: RGB(150,170,220).
Neutral: R≈G≈B. Feel: sophisticated, clean, modern.

### MATERIAL × COLOR INTERACTIONS

**Neon + Bright Color** = Intense glow. RGB(0,170,255) on Neon = brilliant blue glow that lights surroundings.
**Neon + Dark Color** = Dim glow. RGB(50,20,0) on Neon = barely visible amber.
**Glass + Transparency** = Color tints the glass. RGB(100,200,255) at Transparency 0.5 = blue-tinted window.
**Metal + Light Color** = Shiny silver/chrome. RGB(200,200,210) on Metal = polished steel.
**Metal + Warm Color** = Gold/copper. RGB(200,170,60) on Metal = gold finish.
**Concrete + Dark Color** = Weathered look. RGB(100,95,90) on Concrete = aged sidewalk.
**Wood + Warm Color** = Natural wood. RGB(150,100,50) on Wood = realistic timber.
**Brick + Red Range** = Classic brick. RGB(180,80,55) on Brick = perfect red brick.
**Fabric + Saturated Color** = Rich textile. RGB(180,30,30) on Fabric = royal red cloth.

### COMMON COLOR MISTAKES TO AVOID

1. **All same brightness**: If wall, floor, trim, and roof are all RGB ~150, the build looks flat. Ensure at least 40+ difference between primary and secondary colors.
2. **Over-saturation**: Pure RGB(255,0,0) or RGB(0,255,0) looks unnatural. Real-world colors are muted. Use RGB(200,60,50) instead of RGB(255,0,0).
3. **No accent color**: Three shades of gray with no pop of color = boring. Every build needs at least one accent color (door, trim, sign, flower).
4. **Random colors**: Unrelated colors on adjacent parts = chaotic. Use a coherent palette (see 30 palettes above).
5. **Black outlines**: RGB(0,0,0) outlines look cartoony. Use RGB(40,35,30) or RGB(50,45,40) for softer dark trim.
6. **White = RGB(255,255,255)**: Pure white is too harsh. Use RGB(240,238,235) or RGB(245,242,238) for natural white.
7. **Same color for everything**: All walls same color = boring box. Use 2-3 shades of the same hue for depth.
8. **Ignoring light interaction**: Colors look different under warm vs cool lighting. Test colors with your scene's Lighting settings.

### COLOR ACCESSIBILITY

- Text needs 4.5:1 contrast ratio against background for readability
- Don't use color ALONE to convey information (add icons/text too)
- Red-green color blindness: avoid red vs green as only differentiator. Use shapes/patterns too.
- Neon text can be hard to read — ensure size is large enough
- Dark text on light background is more readable than light on dark for most users
`

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PART 4: EVERY TWEEN EASING STYLE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const ENCYCLOPEDIA_TWEENS = `
## TWEEN EASING STYLES — COMPLETE REFERENCE

### TweenInfo Constructor
TweenInfo.new(time, easingStyle, easingDirection, repeatCount, reverses, delayTime)
- time: Duration in seconds (default 1)
- easingStyle: Enum.EasingStyle (see below)
- easingDirection: Enum.EasingDirection.In, .Out, or .InOut
- repeatCount: 0 = play once, -1 = infinite, N = repeat N extra times
- reverses: true = play forward then backward each cycle
- delayTime: Seconds before tween starts

### EASING DIRECTIONS
- **In**: Starts slow, accelerates. Effect is felt at the START of the motion.
- **Out**: Starts fast, decelerates. Effect is felt at the END of the motion (most natural for UI).
- **InOut**: Slow start, fast middle, slow end. Smooth for longer animations.

### EASING STYLES

**Linear** — Constant speed, no acceleration. Robotic feel.
Best for: Progress bars, scrolling text, constant rotations, mechanical movements.
Feel: Mechanical, steady, predictable. Avoid for UI transitions (feels lifeless).

**Sine** — Gentle sinusoidal curve. Subtle easing.
Best for: Gentle UI fades, subtle floating animations, breathing effects.
In: Gentle slow start. Out: Gentle slow end. InOut: Very smooth, almost imperceptible easing.
Feel: Natural, organic, barely noticeable easing. The "safe default" for most animations.

**Quad** — Quadratic (t²). Moderate easing.
Best for: UI panel slides, camera movements, general-purpose easing.
In: Moderate acceleration. Out: Moderate deceleration. InOut: Smooth panel transitions.
Feel: Slightly snappier than Sine. Good all-purpose easing.

**Cubic** — Cubic (t³). Noticeable easing, stronger than Quad.
Best for: Emphasized transitions, dropdown menus, toast notifications.
Feel: Professional UI feel. Noticeable but not exaggerated.

**Quart** — Quartic (t⁴). Strong easing.
Best for: Dramatic reveals, impactful transitions, emphasis animations.
Feel: Strong snap. Items feel like they have momentum.

**Quint** — Quintic (t⁵). Very strong easing.
Best for: Premium UI animations, cinematic camera moves, dramatic reveals.
In: Very slow start with explosive acceleration. Out: Fast start that smoothly glides to stop.
Feel: Cinematic, premium, Apple-style smooth animations. Recommended for polished UI.

**Exponential** — Exponential curve. Extreme easing — the most dramatic smooth style.
Best for: Extremely dramatic transitions, zoom effects, warp speed.
In: Nearly stationary then explosive. Out: Fast start, loooong deceleration tail.
Feel: Very dramatic. Use sparingly. Good for "whoosh" effects.

**Circular** — Based on circular arc. Sharp transition.
Best for: Snappy UI animations, toggle switches, accordion expand/collapse.
Feel: Crisp, responsive. More abrupt transition than Quint but smoother than Back.

**Back** — Overshoots the target then returns. Spring-like overshoot.
Best for: Playful UI (buttons that pop), impact/slam effects, attention-grabbing entrances.
In: Pulls back before moving forward. Out: Overshoots target then settles back.
InOut: Pulls back, overshoots, then settles. Fun and energetic.
Feel: Bouncy, playful, impactful. Great for games aimed at younger audiences.

**Bounce** — Bounces at the end like a ball hitting the floor.
Best for: Items landing/dropping, notification popups, playful UI, coins/collectibles landing.
In: Bounces at start (unusual). Out: Bounces at end (most common use). InOut: Bounces at both ends.
Feel: Playful, physical, fun. Excellent for collectible pickup animations.

**Elastic** — Oscillates around the target like a spring with overshoot.
Best for: Springy buttons, wobbly UI elements, jelly/slime effects, cartoon-style animations.
In: Winds up then springs. Out: Overshoots and oscillates before settling. InOut: Both.
Feel: Cartoon-like, springy, exaggerated. Use for fun/casual games, avoid in serious/horror.

### TWEEN TARGET PROPERTIES (what you can tween)

Tweenable properties on Parts: Position, Size, CFrame, Color, Transparency, Reflectance, Orientation
Tweenable on GuiObjects: Position, Size, Rotation, BackgroundColor3, BackgroundTransparency, TextColor3, TextTransparency, ImageColor3, ImageTransparency, TextSize, AnchorPoint
Tweenable on Lights: Brightness, Color, Range
Tweenable on other: NumberValue.Value, Color3Value.Value, Sound.Volume, Sound.PlaybackSpeed

### COMMON TWEEN PATTERNS

**UI Slide In** (notification panel from right):
TweenInfo.new(0.4, Enum.EasingStyle.Quint, Enum.EasingDirection.Out)
{Position = UDim2.new(0.7, 0, 0.1, 0)}

**UI Fade In**:
TweenInfo.new(0.3, Enum.EasingStyle.Sine, Enum.EasingDirection.Out)
{BackgroundTransparency = 0} -- or TextTransparency = 0

**Button Hover Scale**:
TweenInfo.new(0.15, Enum.EasingStyle.Back, Enum.EasingDirection.Out)
{Size = originalSize * 1.1}

**Button Press Bounce**:
TweenInfo.new(0.2, Enum.EasingStyle.Bounce, Enum.EasingDirection.Out)
{Size = originalSize * 0.95}

**Door Opening** (HingeConstraint TargetAngle tween not supported — use CFrame):
TweenInfo.new(1.0, Enum.EasingStyle.Quad, Enum.EasingDirection.InOut)
{CFrame = openCFrame}

**Floating Hover** (loop):
TweenInfo.new(2, Enum.EasingStyle.Sine, Enum.EasingDirection.InOut, -1, true)
{Position = originalPos + Vector3.new(0, 1.5, 0)}

**Camera Cinematic Pan**:
TweenInfo.new(3, Enum.EasingStyle.Quint, Enum.EasingDirection.InOut)
{CFrame = targetCameraCFrame}

**Coin Collect Pop**:
TweenInfo.new(0.5, Enum.EasingStyle.Elastic, Enum.EasingDirection.Out)
{Size = Vector3.new(0,0,0), Transparency = 1}

**Health Bar Smooth Update**:
TweenInfo.new(0.3, Enum.EasingStyle.Quad, Enum.EasingDirection.Out)
{Size = UDim2.new(healthPercent, 0, 1, 0)}

**Day/Night Cycle Lighting**:
TweenInfo.new(60, Enum.EasingStyle.Linear, Enum.EasingDirection.In, -1, false)
{ClockTime = 24} -- loops every 60 seconds through full day

**Screen Shake** (not a tween — use RunService loop):
Use Heartbeat + math.random() to offset Camera CFrame, not TweenService.

### TWEEN CHAINING
TweenService:Create() returns a Tween object with :Play(), .Completed event.
Chain: tween1.Completed:Connect(function() tween2:Play() end)
Or: tween1.Completed:Wait() tween2:Play()
`

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PART 5: COMPLETE GAME SERVICE REFERENCE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const ENCYCLOPEDIA_SERVICES = `
## GAME SERVICES — COMPLETE METHOD REFERENCE

### DataStoreService
local DSS = game:GetService("DataStoreService")

**GetDataStore(name: string, scope?: string) → DataStore**
Returns a DataStore with the given name. Scope is optional partition key.

**DataStore:GetAsync(key: string) → any**
Retrieves the value for a key. Returns nil if not set. ALWAYS pcall this.
Pattern: local ok, data = pcall(function() return ds:GetAsync("Player_"..userId) end)
Budget: Counted against GET budget (60 + 10*playerCount per minute).

**DataStore:SetAsync(key: string, value: any, userIds?: {number}, options?: DataStoreSetOptions) → string**
Overwrites the key with the given value. Returns the version string.
Gotcha: Does NOT read-then-write atomically. Two SetAsync calls can race. Use UpdateAsync for atomic ops.

**DataStore:UpdateAsync(key: string, callback: (any, DataStoreKeyInfo) → (any, {number}, {})) → any**
Atomic read-modify-write. The callback receives current value and returns new value.
Pattern: ds:UpdateAsync("Player_"..userId, function(old) old = old or {coins=0, level=1} old.coins += 50 return old end)
This is the SAFEST way to modify data. Handles race conditions.

**DataStore:RemoveAsync(key: string) → any**
Deletes a key and returns its last value. Use for GDPR compliance / data deletion.

**DataStore:ListKeysAsync(prefix?: string, pageSize?: number, cursor?: string) → DataStoreKeyPages**
Lists all keys (optionally filtered by prefix). Returns pages you iterate with GetCurrentPage() / AdvanceToNextPageAsync().
Pattern: local pages = ds:ListKeysAsync("Player_", 100) local keys = pages:GetCurrentPage() for _, keyInfo in ipairs(keys) do print(keyInfo.KeyName) end

**DataStore:GetVersionAsync(key, version) / ListVersionsAsync(key, sortDirection, minDate, maxDate, pageSize)**
Version history. Retrieve previous versions of data for recovery/auditing.

**OrderedDataStore:GetSortedAsync(ascending: bool, pageSize: number, minValue?: number, maxValue?: number) → DataStorePages**
Returns entries sorted by integer value. Perfect for leaderboards.
Pattern: local ods = DSS:GetOrderedDataStore("Wins") local pages = ods:GetSortedAsync(false, 10) -- top 10
for rank, entry in ipairs(pages:GetCurrentPage()) do print(rank, entry.key, entry.value) end

### Players Service
local Players = game:GetService("Players")

**PlayerAdded(player: Player)** — Fires when any player joins. THE most important event.
Pattern: Players.PlayerAdded:Connect(function(player) loadData(player) setupLeaderstats(player) end)

**PlayerRemoving(player: Player)** — Fires when a player leaves. Save data here.
Pattern: Players.PlayerRemoving:Connect(function(player) saveData(player) end)

**GetPlayers() → {Player}** — Returns array of all connected players.
**GetPlayerByUserId(userId: number) → Player?** — Find player by ID.
**GetPlayerFromCharacter(character: Model) → Player?** — Find player from their character model.
**LocalPlayer** — CLIENT ONLY. The local player instance. nil on server.

**Player properties**: Name, UserId, DisplayName, Team, TeamColor, Character (Model), Backpack, PlayerGui, MembershipType, AccountAge
**Player events**: CharacterAdded(character), CharacterRemoving(character), Chatted(message)
**Player methods**: Kick(message), LoadCharacter(), GetMouse() (deprecated — use UserInputService)

### TweenService
local TS = game:GetService("TweenService")

**Create(instance: Instance, tweenInfo: TweenInfo, propertyTable: {[string]: any}) → Tween**
Creates a tween that animates properties of an instance over time.
Pattern: local tween = TS:Create(part, TweenInfo.new(1, Enum.EasingStyle.Quad, Enum.EasingDirection.Out), {Position = Vector3.new(0,10,0), Transparency = 0.5})
tween:Play()
Tween methods: Play(), Pause(), Cancel(). Events: Completed.

**GetValue(alpha: number, easingStyle: EasingStyle, easingDirection: EasingDirection) → number**
Pure math utility — returns the eased value for a given alpha (0-1). Useful for custom animations.
Pattern: local easedAlpha = TS:GetValue(0.5, Enum.EasingStyle.Quint, Enum.EasingDirection.Out)

### MarketplaceService
local MPS = game:GetService("MarketplaceService")

**PromptGamePassPurchase(player: Player, gamePassId: number)**
Shows purchase dialog for a game pass. Listen to PromptGamePassPurchaseFinished for result.

**UserOwnsGamePassAsync(userId: number, gamePassId: number) → boolean**
Check if player owns a game pass. ALWAYS pcall this. Cache the result.
Pattern: local owns = false pcall(function() owns = MPS:UserOwnsGamePassAsync(player.UserId, 12345) end) if owns then grantVIP(player) end

**PromptProductPurchase(player: Player, productId: number)**
Prompt purchase of a Developer Product (consumable, can buy multiple times).

**ProcessReceipt callback** — MUST be set to handle developer product purchases.
Pattern: MPS.ProcessReceipt = function(receiptInfo) local player = Players:GetPlayerByUserId(receiptInfo.PlayerId) if not player then return Enum.ProductPurchaseDecision.NotProcessedYet end grantProduct(player, receiptInfo.ProductId) return Enum.ProductPurchaseDecision.PurchaseGranted end
Gotcha: ProcessReceipt MUST return PurchaseGranted or NotProcessedYet. If it errors, Roblox will retry later. Make it idempotent.

**PromptPremiumPurchase(player)** — Prompt Roblox Premium subscription.
**GetProductInfo(assetId, infoType)** — Get asset/gamepass/product info (name, price, etc.).
**GetDeveloperProductsAsync()** — List all dev products. Returns Pages.

### BadgeService
local BS = game:GetService("BadgeService")

**AwardBadge(userId: number, badgeId: number) → boolean**
Awards a badge to a player. Returns true if successful. Will not re-award if already owned.
Pattern: local ok, result = pcall(function() return BS:AwardBadge(player.UserId, 12345) end)

**UserHasBadgeAsync(userId: number, badgeId: number) → boolean**
Check if player has a badge. Use before awarding to avoid unnecessary API calls.

**GetBadgeInfoAsync(badgeId: number) → table**
Returns badge info: Name, Description, IconImageId, IsEnabled.

### PathfindingService
local PFS = game:GetService("PathfindingService")

**CreatePath(agentParameters?: table) → Path**
Creates a pathfinding path with optional agent size/jump/climb settings.
agentParameters: {AgentRadius=2, AgentHeight=5, AgentCanJump=true, AgentCanClimb=false, WaypointSpacing=4, Costs={Water=20}}

**Path:ComputeAsync(start: Vector3, finish: Vector3)**
Computes the path between two points. Check Path.Status afterward.

**Path:GetWaypoints() → {PathWaypoint}**
Returns ordered waypoints. Each has Position (Vector3) and Action (Walk/Jump/Custom).

**Path.Blocked(blockedWaypointIndex: number)** — Event fires if path is blocked.

Pattern (complete NPC pathfinding):
local path = PFS:CreatePath({AgentRadius = 2, AgentHeight = 5, AgentCanJump = true})
path:ComputeAsync(npc.HumanoidRootPart.Position, targetPosition)
if path.Status == Enum.PathStatus.Success then
  local waypoints = path:GetWaypoints()
  for _, wp in ipairs(waypoints) do
    if wp.Action == Enum.PathWaypointAction.Jump then npc.Humanoid.Jump = true end
    npc.Humanoid:MoveTo(wp.Position)
    npc.Humanoid.MoveToFinished:Wait()
  end
end

### CollectionService
local CS = game:GetService("CollectionService")

**AddTag(instance: Instance, tag: string)** — Tags an instance.
**RemoveTag(instance: Instance, tag: string)** — Removes a tag.
**HasTag(instance: Instance, tag: string) → boolean** — Check if tagged.
**GetTagged(tag: string) → {Instance}** — Get ALL instances with this tag.
**GetTags(instance: Instance) → {string}** — Get all tags on an instance.
**GetInstanceAddedSignal(tag: string) → RBXScriptSignal** — Fires when any instance gets this tag.
**GetInstanceRemovedSignal(tag: string) → RBXScriptSignal** — Fires when tag is removed.

Pattern (tag-based system — e.g., all "Lava" tagged parts damage players):
for _, part in ipairs(CS:GetTagged("Lava")) do
  part.Touched:Connect(function(hit) local hum = hit.Parent:FindFirstChildOfClass("Humanoid") if hum then hum:TakeDamage(10) end end)
end
CS:GetInstanceAddedSignal("Lava"):Connect(function(part) -- setup touch handler for new lava parts end)

### PhysicsService
local PS = game:GetService("PhysicsService")

**RegisterCollisionGroup(name: string)** — Creates a collision group.
**CollisionGroupSetCollidable(group1: string, group2: string, collidable: boolean)** — Sets whether two groups collide.
**SetPartCollisionGroup(part: BasePart, groupName: string)** — Assigns a part to a collision group. (Or use part.CollisionGroup = "GroupName" directly.)

Pattern (players don't collide with each other):
PS:RegisterCollisionGroup("Players")
PS:RegisterCollisionGroup("Default")
PS:CollisionGroupSetCollidable("Players", "Players", false)
-- In CharacterAdded: for _, part in ipairs(character:GetDescendants()) do if part:IsA("BasePart") then part.CollisionGroup = "Players" end end

### UserInputService (CLIENT ONLY)
local UIS = game:GetService("UserInputService")

**InputBegan(input: InputObject, gameProcessed: boolean)** — Any input starts (key press, mouse click, touch).
**InputEnded(input: InputObject, gameProcessed: boolean)** — Input released.
**InputChanged(input: InputObject, gameProcessed: boolean)** — Input value changed (mouse move, gamepad stick).
**GetMouseLocation() → Vector2** — Current mouse position on screen.
**IsKeyDown(keyCode: Enum.KeyCode) → boolean** — Check if a key is currently held.
**TouchEnabled → boolean** — Is this a touch device?
**GamepadEnabled → boolean** — Is a gamepad connected?
**KeyboardEnabled → boolean** — Is a keyboard available?
**MouseEnabled → boolean** — Is a mouse available?

Pattern: UIS.InputBegan:Connect(function(input, gpe) if gpe then return end -- ignore if typing in chat/textbox
  if input.KeyCode == Enum.KeyCode.E then interact() end
  if input.UserInputType == Enum.UserInputType.MouseButton1 then attack() end
end)
Gotcha: ALWAYS check gameProcessedEvent (gpe). If true, the input was consumed by Roblox UI (chat, menu). Ignore it.

### ContextActionService (CLIENT ONLY)
local CAS = game:GetService("ContextActionService")

**BindAction(actionName: string, callback: function, createTouchButton: boolean, ...inputTypes)**
Binds a function to input(s). Can create a mobile touch button automatically.
callback receives (actionName, inputState, inputObject) → Enum.ContextActionResult

**UnbindAction(actionName: string)** — Removes the binding.

Pattern: CAS:BindAction("Sprint", function(name, state, input)
  if state == Enum.UserInputState.Begin then humanoid.WalkSpeed = 32
  elseif state == Enum.UserInputState.End then humanoid.WalkSpeed = 16 end
  return Enum.ContextActionResult.Sink
end, true, Enum.KeyCode.LeftShift, Enum.KeyCode.ButtonL2)
-- true = creates a touch button for mobile. Binds to Shift AND gamepad L2.

### RunService
local RS = game:GetService("RunService")

**Heartbeat(deltaTime: number)** — Fires every frame AFTER physics (both client and server). The main game loop event.
**RenderStepped(deltaTime: number)** — CLIENT ONLY. Fires every frame BEFORE rendering. Use for camera/visual updates.
**Stepped(time: number, deltaTime: number)** — Fires every frame BEFORE physics. Less common.
**IsClient() → boolean** — True on client.
**IsServer() → boolean** — True on server.
**IsStudio() → boolean** — True in Roblox Studio (not published game).

Pattern (smooth part rotation):
RS.Heartbeat:Connect(function(dt) part.CFrame = part.CFrame * CFrame.Angles(0, math.rad(90) * dt, 0) end)
Gotcha: RenderStepped only works in LocalScripts. Using it on server errors. Delta time (dt) varies — ALWAYS multiply by dt for frame-rate independent motion.

### TextService
local TS = game:GetService("TextService")

**FilterStringAsync(stringToFilter: string, fromUserId: number) → TextFilterResult**
MANDATORY for any user-generated text displayed to others. Roblox ToS requires this.
Pattern: local ok, result = pcall(function() return TS:FilterStringAsync(text, player.UserId) end)
if ok then
  local filtered = result:GetNonChatStringForBroadcastAsync() -- for public display
  -- or result:GetChatForUserAsync(targetUserId) -- for private message
end

**GetTextSize(text: string, textSize: number, font: Enum.Font, frameSize: Vector2) → Vector2**
Returns the pixel dimensions text would occupy. Useful for dynamic UI sizing.

### Debris Service
local Debris = game:GetService("Debris")

**AddItem(instance: Instance, lifetime: number)**
Schedules an instance to be destroyed after lifetime seconds. Fire-and-forget cleanup.
Pattern: Debris:AddItem(explosionEffect, 3) -- auto-destroy after 3 seconds
Use for: Temporary effects (explosions, particles, projectiles), dropped items, timed entities.
Gotcha: More reliable than task.delay + :Destroy() because it handles edge cases.

### ReplicatedFirst
Content here loads FIRST, before anything else replicates to the client.
Put your loading screen LocalScript + ScreenGui here.
Pattern: game:GetService("ReplicatedFirst"):RemoveDefaultLoadingScreen()
-- then show your custom loading screen until game:IsLoaded()

### HttpService (SERVER ONLY, enabled in Game Settings)
local HTTP = game:GetService("HttpService")

**JSONEncode(table) → string** — Serialize table to JSON.
**JSONDecode(string) → table** — Parse JSON to table.
**GenerateGUID(wrapInCurlyBraces?: boolean) → string** — Generate a UUID.
**GetAsync(url) → string** — HTTP GET (must enable in Game Settings > Security).
**PostAsync(url, data, contentType, compress, headers) → string** — HTTP POST.
Gotcha: HTTP requests only work in SERVER scripts (not LocalScripts). Must enable "Allow HTTP Requests" in game settings. Cannot call Roblox APIs (*.roblox.com is blocked).

### Chat Service
local Chat = game:GetService("Chat")
**SetBubbleChatSettings(settings: table)** — Configure bubble chat appearance.
Pattern: Chat:SetBubbleChatSettings({BubbleDuration = 10, MaxBubbles = 5, BackgroundColor3 = Color3.fromRGB(30,30,30), TextColor3 = Color3.new(1,1,1), TextSize = 16, Font = Enum.Font.GothamMedium})
Gotcha: Modern Roblox uses TextChatService instead of Chat for most functionality. Chat service is legacy but SetBubbleChatSettings still works.

### TextChatService (MODERN — replaces legacy Chat)
local TCS = game:GetService("TextChatService")
Handles all text chat: channels, commands, filtering, display.
TextChannels: RBXGeneral (default), RBXTeam, custom channels.
TextChatCommands: Built-in /e dance, /mute, etc. Can add custom commands.
Pattern: TCS.SendingMessage:Connect(function(msg) -- modify before send end)
TCS.MessageReceived:Connect(function(msg) -- react to messages end)
`

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PART 6: LUAU LANGUAGE DEEP REFERENCE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const ENCYCLOPEDIA_LUAU = `
## LUAU LANGUAGE — COMPLETE REFERENCE FOR ROBLOX

### TYPE ANNOTATIONS

-- Variable types
local name: string = "Vyren"
local count: number = 42
local alive: boolean = true
local data: {[string]: number} = {coins = 100, gems = 50}
local list: {number} = {1, 2, 3, 4, 5}
local optional: string? = nil -- nullable type

-- Function signatures
local function add(a: number, b: number): number
  return a + b
end

-- Type aliases
type PlayerData = {
  coins: number,
  level: number,
  inventory: {string},
  settings: {[string]: boolean},
}

-- Union types
type Result = string | number
type Callback = (player: Player, data: any) -> ()

-- Generic types
type Array<T> = {T}
type Map<K, V> = {[K]: V}
type Optional<T> = T | nil

-- Function type
type Predicate<T> = (T) -> boolean
type Transform<T, U> = (T) -> U

### TABLE PATTERNS

-- Array (ordered, integer keys)
local fruits = {"apple", "banana", "cherry"}
fruits[1] == "apple" -- 1-indexed!
#fruits == 3 -- length operator
table.insert(fruits, "date") -- append
table.remove(fruits, 2) -- remove at index 2

-- Dictionary (string keys)
local config = {
  maxPlayers = 10,
  mapName = "Arena",
  enabled = true,
}
config.maxPlayers -- dot access
config["mapName"] -- bracket access
for key, value in pairs(config) do print(key, value) end

-- Mixed table (avoid in new code — confusing)
local mixed = {"a", "b", key = "value"} -- array part + dict part

-- Nested tables
local players = {
  {name = "Player1", coins = 100},
  {name = "Player2", coins = 200},
}

-- Table as set
local activeEffects: {[string]: boolean} = {}
activeEffects["Shield"] = true
activeEffects["Speed"] = true
if activeEffects["Shield"] then print("Shielded!") end

-- Freezing tables (immutable)
local CONSTANTS = table.freeze({
  MAX_HEALTH = 100,
  WALK_SPEED = 16,
  JUMP_HEIGHT = 7.2,
})
-- CONSTANTS.MAX_HEALTH = 200 -- ERROR: table is frozen

### METATABLES AND OOP

-- Basic class pattern
local MyClass = {}
MyClass.__index = MyClass

function MyClass.new(name: string, health: number)
  local self = setmetatable({}, MyClass)
  self.Name = name
  self.Health = health
  self.MaxHealth = health
  return self
end

function MyClass:TakeDamage(amount: number)
  self.Health = math.max(0, self.Health - amount)
  if self.Health <= 0 then self:OnDeath() end
end

function MyClass:Heal(amount: number)
  self.Health = math.min(self.MaxHealth, self.Health + amount)
end

function MyClass:OnDeath()
  print(self.Name .. " died!")
end

-- Inheritance
local Boss = setmetatable({}, {__index = MyClass})
Boss.__index = Boss

function Boss.new(name: string, health: number, phase: number)
  local self = MyClass.new(name, health)
  setmetatable(self, Boss)
  self.Phase = phase
  return self
end

function Boss:OnDeath() -- override
  if self.Phase < 3 then
    self.Phase += 1
    self.Health = self.MaxHealth
    print(self.Name .. " enters phase " .. self.Phase)
  else
    print(self.Name .. " defeated for real!")
  end
end

-- Metamethod reference
__index    — Called when accessing missing key. Usually set to class table.
__newindex — Called when setting a new key. Use for read-only tables.
__tostring — Called by tostring(). Return a string representation.
__add      — a + b
__sub      — a - b
__mul      — a * b
__div      — a / b
__mod      — a % b
__pow      — a ^ b
__unm      — -a (unary minus)
__eq       — a == b
__lt       — a < b
__le       — a <= b
__len      — #a
__concat   — a .. b
__call     — a() (call table as function)
__iter     — for k, v in a do (custom iteration)

### STRING MANIPULATION

string.format(fmt, ...) — Printf-style formatting.
  string.format("Health: %d/%d", 75, 100) → "Health: 75/100"
  string.format("%.2f", 3.14159) → "3.14"
  string.format("%s has %d coins", "Vyren", 500) → "Vyren has 500 coins"
  %d = integer, %f = float, %s = string, %x = hex, %02d = zero-padded 2 digits

string.find(s, pattern, init?, plain?) → start, end, captures...
  string.find("Hello World", "World") → 7, 11
  string.find("abc123", "%d+") → 4, 6 (finds "123")

string.match(s, pattern) → captures or full match
  string.match("Player_12345", "Player_(%d+)") → "12345"

string.gmatch(s, pattern) → iterator
  for word in string.gmatch("one two three", "%w+") do print(word) end

string.gsub(s, pattern, replacement, maxReplacements?) → newString, count
  string.gsub("Hello World", "World", "Roblox") → "Hello Roblox", 1
  string.gsub("aaa", "a", "b", 2) → "bba", 2

string.sub(s, start, end?) — Substring (1-indexed, inclusive).
  string.sub("Hello", 1, 3) → "Hel"
  string.sub("Hello", -2) → "lo"

string.rep(s, n) — Repeat string n times.
string.reverse(s) — Reverse string.
string.upper(s) / string.lower(s) — Case conversion.
string.len(s) — Length (or #s).
string.byte(s, i?) — Character code at position. string.char(n) — Code to character.
string.split(s, delimiter) — Roblox extension. "a,b,c":split(",") → {"a","b","c"}

-- Pattern special characters:
. = any char, %a = letter, %d = digit, %w = alphanumeric, %s = whitespace
%l = lowercase, %u = uppercase, %p = punctuation
+ = 1 or more, * = 0 or more, - = 0 or more (lazy), ? = 0 or 1
^ = start anchor, $ = end anchor
[] = character class: [abc] = a or b or c, [a-z] = any lowercase
() = capture group

### MATH LIBRARY

math.floor(x) — Round down. math.floor(3.7) → 3
math.ceil(x) — Round up. math.ceil(3.2) → 4
math.round(x) — Roblox extension. Rounds to nearest integer.
math.abs(x) — Absolute value.
math.max(a, b, ...) / math.min(a, b, ...) — Maximum/minimum.
math.clamp(x, min, max) — Roblox extension. Clamps x between min and max.
  math.clamp(150, 0, 100) → 100
  math.clamp(-5, 0, 100) → 0

math.random() — Random float 0-1. math.random(n) — Random int 1-n. math.random(a, b) — Random int a-b.
math.randomseed(seed) — Seed the RNG (auto-seeded, usually not needed).
Random.new(seed?) — Better RNG. r:NextNumber(min?, max?), r:NextInteger(min, max)

math.noise(x, y?, z?) — Perlin noise. Returns -0.5 to 0.5. Use for procedural terrain, textures, movement.
  Pattern (procedural height): local height = math.noise(x/50, z/50) * 20 -- smooth hills
  Tip: Divide coords by scale factor. Larger divisor = smoother terrain. Add octaves for detail:
  local h = math.noise(x/100,z/100)*40 + math.noise(x/50,z/50)*20 + math.noise(x/25,z/25)*10

math.sin(x) / math.cos(x) / math.tan(x) — Trig (radians).
math.asin(x) / math.acos(x) / math.atan2(y, x) — Inverse trig.
math.rad(degrees) → radians. math.deg(radians) → degrees.
math.pi = 3.14159...
math.huge = infinity. -math.huge = negative infinity.

math.sqrt(x) — Square root.
math.exp(x) — e^x. math.log(x, base?) — Logarithm.
math.sign(x) — Roblox extension. Returns -1, 0, or 1.

-- Lerp (linear interpolation) — not built in, use this pattern:
local function lerp(a, b, t) return a + (b - a) * t end
-- t=0 returns a, t=1 returns b, t=0.5 returns midpoint

### COROUTINES AND TASK LIBRARY

-- task.spawn(func, args...) — Run immediately in a new thread (like coroutine.wrap + call)
task.spawn(function() while true do task.wait(1) updateUI() end end)

-- task.defer(func, args...) — Run next resumption cycle (after current thread yields)
task.defer(function() print("This runs after the current block finishes") end)

-- task.delay(seconds, func, args...) — Run after a delay
task.delay(5, function() print("5 seconds later") end)

-- task.wait(seconds?) → elapsedTime — Yield for at least N seconds (default = 1 frame)
task.wait(0.1) -- wait ~0.1 seconds (minimum 1 frame)
task.wait() -- wait exactly 1 frame

-- task.cancel(thread) — Cancel a spawned/delayed thread
local thread = task.delay(10, function() explode() end)
task.cancel(thread) -- cancels the delayed explosion

-- task.desynchronize() / task.synchronize() — Switch between parallel and serial execution
-- Used with Parallel Luau for multi-threaded scripts

-- Legacy equivalents (avoid in new code):
-- wait() → task.wait()
-- spawn() → task.spawn()
-- delay() → task.delay()
-- coroutine.wrap → task.spawn

### ERROR HANDLING

-- pcall — Protected call. Returns success boolean + results or error.
local success, result = pcall(function()
  return ds:GetAsync("key")
end)
if success then
  print("Got data:", result)
else
  warn("Error:", result) -- result is the error message string
end

-- xpcall — Protected call with custom error handler.
local success, result = xpcall(function()
  return riskyOperation()
end, function(err)
  warn("Caught error:", err)
  warn(debug.traceback()) -- print stack trace
  return "fallback value"
end)

-- error(message, level?) — Throw an error. level=2 blames the caller.
local function validateAge(age)
  if type(age) ~= "number" then error("age must be a number", 2) end
  if age < 0 then error("age cannot be negative", 2) end
end

-- warn(args...) — Print a warning (yellow in output).
-- assert(condition, message?) — Error if condition is falsy.
assert(player, "Player not found!") -- throws if player is nil

### ITERATION PATTERNS

-- ipairs: iterate array part in order (stops at first nil)
for i, v in ipairs({"a","b","c"}) do print(i, v) end -- 1 "a", 2 "b", 3 "c"

-- pairs: iterate all keys (unordered for dictionaries)
for k, v in pairs({x=1, y=2}) do print(k, v) end -- unordered

-- generalized for (Luau extension — fastest, use for arrays)
for i, v in {10, 20, 30} do print(i, v) end -- 1 10, 2 20, 3 30

-- numeric for
for i = 1, 10 do print(i) end -- 1 through 10
for i = 10, 1, -1 do print(i) end -- 10 down to 1
for i = 0, 1, 0.1 do print(i) end -- 0, 0.1, 0.2, ..., 1.0

-- while loop
while condition do task.wait() end

-- repeat-until (runs at least once)
repeat
  local input = getInput()
until input == "quit"

### CLOSURES AND UPVALUES

-- Functions capture variables from their enclosing scope
local function createCounter()
  local count = 0 -- upvalue captured by inner function
  return function()
    count += 1
    return count
  end
end
local counter = createCounter()
print(counter()) -- 1
print(counter()) -- 2
print(counter()) -- 3

-- Common pattern: event connections with captured variables
for i, button in ipairs(buttons) do
  button.Activated:Connect(function()
    print("Button " .. i .. " clicked") -- i is captured per iteration
  end)
end

### TABLE LIBRARY

table.insert(t, value) — Append to end. table.insert(t, pos, value) — Insert at position.
table.remove(t, pos?) — Remove at position (default = last element). Returns removed value.
table.sort(t, comp?) — Sort in-place. comp(a,b) returns true if a should come before b.
  table.sort(scores, function(a, b) return a > b end) -- descending
table.find(t, value, init?) — Roblox extension. Returns index of value or nil.
  local idx = table.find(inventory, "Sword") -- returns index or nil
table.create(count, value?) — Roblox extension. Pre-allocate array.
  local grid = table.create(100, 0) -- 100 zeros, pre-allocated
table.move(src, first, last, destFirst, dest?) — Copy range of elements.
table.freeze(t) → t — Make table read-only (deep freezes children? No — shallow only).
table.isfrozen(t) → boolean — Check if frozen.
table.concat(t, sep?, i?, j?) — Join array elements into string.
  table.concat({"a","b","c"}, ", ") → "a, b, c"
table.clear(t) — Remove all elements. Faster than creating new table.
table.clone(t) — Roblox extension. Shallow copy.
table.pack(...) → table with .n field for count.
table.unpack(t, i?, j?) → multiple values.

### BIT32 LIBRARY (bitwise operations)

bit32.band(a, b) — Bitwise AND. bit32.bor(a, b) — OR. bit32.bxor(a, b) — XOR.
bit32.bnot(a) — NOT. bit32.lshift(a, n) — Left shift. bit32.rshift(a, n) — Right shift.
bit32.extract(n, field, width?) — Extract bits. bit32.replace(n, v, field, width?) — Replace bits.

-- Flag/permission system using bits:
local FLAGS = { Admin = 1, Moderator = 2, VIP = 4, Builder = 8 }
local permissions = bit32.bor(FLAGS.Admin, FLAGS.VIP) -- Admin + VIP
local isAdmin = bit32.band(permissions, FLAGS.Admin) > 0 -- true

### PERFORMANCE PATTERNS

1. Cache service references at module level:
   local Players = game:GetService("Players") -- DO THIS
   -- NOT game:GetService("Players") every frame

2. Avoid creating closures in hot loops:
   -- BAD: RunService.Heartbeat:Connect(function(dt) workspace:FindFirstChild("Part") end)
   -- GOOD: local target = workspace:FindFirstChild("Part")
   --        RunService.Heartbeat:Connect(function(dt) use(target) end)

3. Use table.create for pre-allocated arrays:
   local results = table.create(1000) -- not {} which resizes repeatedly

4. Avoid table.insert in hot paths — direct index assignment is faster:
   results[i] = value -- faster than table.insert(results, value)

5. Use NumberSequence/ColorSequence instead of creating many tween steps.

6. Minimize Instance.new in loops — clone from templates instead:
   local template = ReplicatedStorage.Template
   for i = 1, 100 do local clone = template:Clone() clone.Parent = workspace end

7. Disconnect events when done:
   local conn = part.Touched:Connect(handler)
   -- later: conn:Disconnect()

8. Use :GetDescendants() sparingly — it creates a large table. Cache if possible.

9. Pool objects instead of creating/destroying repeatedly.

10. Use Parallel Luau (task.desynchronize/synchronize) for CPU-heavy math.
`

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PART 7: 100 COMMON BUILD RECIPES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const ENCYCLOPEDIA_RECIPES = `
## 100 BUILD RECIPES — CONSTRUCTION KNOWLEDGE

### HOUSES (10 types)

**1. Cottage (40-60 parts)**
Foundation: 3-stud tall Concrete slab, 1 stud wider than walls. Walls: 12-stud tall WoodPlanks with Brick lower half (wainscoting). Roof: Steep pitched WedgeParts in RoofShingles material, 1.5-stud overhang. Windows: 3x4 stud openings with Wood frames, Glass panes. Door: Arched top WoodPlanks door with iron Metal handle. Chimney: Brick stack on roof with Slate cap. Interior: 2 rooms (living + bedroom). Exterior: small garden with green sphere bushes, stone path, wooden fence.
Colors: Cream walls RGB(230,220,200), dark brown trim RGB(90,65,40), red door RGB(160,45,35), gray roof RGB(80,75,70).

**2. Mansion (100-200 parts)**
Foundation: 4-stud stepped Granite base. Walls: 3 stories, 12 studs each, Brick with Concrete quoins at corners. Roof: Complex hip roof with dormers, ClayRoofTiles or RoofShingles. Windows: Tall 3x6 stud windows with ornate frames, shutters on upper floors. Grand entrance: double doors with pillared portico, 4 Marble columns. Balcony: 2nd floor above entrance, Metal railings. Chimney: 2 chimneys at each end. Interior: 8+ rooms (foyer, dining, kitchen, living, library, 3 bedrooms, 2 bathrooms). Exterior: circular driveway, fountain, garden walls, lamp posts.
Colors: Warm brick RGB(180,120,80), white trim RGB(245,240,235), black roof RGB(50,45,40), green shutters RGB(50,80,50).

**3. Apartment Building (80-150 parts)**
Foundation: Concrete ground floor (commercial space). Walls: 4-6 stories, Brick or Plaster with horizontal band between each floor. Windows: Grid pattern, 3 per floor per side, uniform size with Metal frames. Entrance: Glass double doors with metal awning. Fire escape: Metal zig-zag stairs on one side. Roof: Flat with parapet, water tank, antenna. Each floor: 2 apartment units with visible windows and occasional balcony. Ground floor: shop front with large Glass windows and awning.
Colors: Tan brick RGB(190,170,140), dark frames RGB(50,50,55), red awning RGB(170,40,40).

**4. Log Cabin (35-50 parts)**
Foundation: Slate stone base. Walls: Horizontal WoodPlanks logs (round profile simulated by layered Parts). Roof: Steep A-frame, WoodPlanks with snow on top (white Part, 0.3 transparency). Door: Heavy Wood plank door. Windows: Small, 2x3 studs, simple frames. Porch: Covered front porch with log columns. Chimney: Cobblestone. Interior: Open floor plan, fireplace, loft area. Exterior: Firewood stack, rocking chair, animal pelts (Fabric).
Colors: Medium brown RGB(140,95,55), dark brown trim RGB(80,55,30), stone gray chimney RGB(120,115,105).

**5. Treehouse (45-70 parts)**
Tree: Large trunk (brown Cylinder Part, 4-stud diameter, 30 studs tall) with green sphere canopy (3-4 large green Balls). Platform: WoodPlanks platform 15-20 studs up, supported by diagonal wood braces. Walls: Partial walls (half-height) with window cutouts, no glass. Roof: Simple WedgePart roof or tarp (angled Fabric Part). Access: Rope ladder (thin Cylinders + horizontal rungs) or TrussPart ladder. Railing: Wood post + rail around platform edges. Extras: Tire swing (hanging Cylinder), pulley bucket, lantern (PointLight).
Colors: Bark brown RGB(100,70,40), green canopy RGB(60,120,50), weathered wood floor RGB(170,140,100).

**6. Houseboat (50-80 parts)**
Hull: Boat shape — wide flat bottom Part (Wood material) with tapered WedgeParts at bow. Deck: WoodPlanks surface with Metal railings. Cabin: Small 1-room house on deck (Wood walls, Glass windows). Roof: Flat or slight pitch. Wheelhouse: Small raised area at bow with controls (buttons, steering wheel). Mooring: Rope coils, cleats (small Metal Parts on deck edge). Water line: Hull partially submerged. Interior: Bed, small kitchen, table. Exterior: Fishing rod holder, life preserver ring, anchor.
Colors: White hull RGB(240,240,235), teak deck RGB(170,130,80), blue trim RGB(50,80,140), red accents RGB(180,40,40).

**7. Igloo (25-40 parts)**
Structure: Dome made of many white/ice-blue WedgeParts and Parts arranged in a hemisphere, 8-stud radius. Entrance: Low tunnel 3x3 studs. Material: Ice or Snow-colored Concrete. Interior: Single room with fur rug (Fabric Part), ice block seats, central fire pit (Fire effect). Exterior: Ice fishing hole nearby, sled, stored fish.
Colors: Snow white RGB(240,245,250), ice blue RGB(200,220,240), fur brown RGB(140,110,70).

**8. Castle Tower (60-90 parts)**
Base: 8x8 stud footprint, Slate walls, 30 studs tall. Floors: 3 levels connected by spiral staircase (rotating step Parts). Walls: 2-stud thick with arrow slit windows (narrow vertical openings). Top: Crenellated parapet (alternating Merlon/Crenel — tall/short wall segments). Roof: Conical top (cylinder + cone from WedgeParts). Door: Heavy Wood door with iron Metal studs. Interior: Ground = storage, Mid = living, Top = lookout. Extras: Torch sconces (PointLights), banner (Fabric), chain (thin Cylinder Parts).
Colors: Dark stone RGB(90,85,80), mortar lines RGB(110,105,100), banner red RGB(160,30,30), iron gray RGB(70,70,75).

**9. Modern Villa (80-120 parts)**
Foundation: Thin Concrete slab with clean edges. Walls: Flat Concrete with floor-to-ceiling Glass window walls. Roof: Flat with slight overhang, no visible pitch. Asymmetric design: L-shape or stacked boxes at different heights. Infinity pool: Blue Glass recessed part on one side. Garage: Visible through Glass door. Materials: Concrete, Glass, Metal trim (no Brick or Wood on exterior). Interior: Open plan, double-height living room, floating staircase (Concrete steps with no visible support). Exterior: Infinity pool, minimalist landscaping, concrete path, contemporary sculpture.
Colors: White concrete RGB(245,245,245), dark window frames RGB(40,40,40), warm wood interior RGB(180,150,110), pool blue RGB(100,200,220).

**10. Farmhouse (60-90 parts)**
Foundation: Cobblestone base. Walls: WoodPlanks with Brick chimney end. Roof: Metal corrugated (DiamondPlate at low angle). Porch: Wraparound front porch with Wood columns and railing. Windows: 6-pane style (Grid of thin Parts over Glass). Door: Screen door (wire mesh = thin Part with slight transparency). Interior: Kitchen (cast iron stove), dining, bedroom, bathroom. Exterior: Mailbox, weather vane, rocking chair, flower boxes, picket fence, barn red accent wall.
Colors: White siding RGB(245,240,235), red accent RGB(180,45,35), green shutters RGB(60,90,50), metal roof RGB(160,155,150).

### VEHICLES (10 types)

**11. Sedan Car (30-50 parts)**
Body: Main rectangular Part (6x3x12 studs) with WedgeParts for hood slope and trunk slope. Roof: Slightly narrower box on top. Wheels: 4 Cylinder Parts (black, 2-stud diameter) with Metal hubcap accent. Windows: Glass Parts on sides and windshield (angled). Bumpers: Metal front and rear. Headlights: 2 small Neon yellow Parts + SpotLights. Taillights: 2 small Neon red Parts. Door lines: Thin dark strips. Interior: 2 front seats, steering wheel (thin Cylinder), dashboard.
Colors: Body any solid color, black wheels RGB(30,30,30), chrome trim RGB(200,200,205), glass RGB(200,220,240).

**12. Sports Car (35-55 parts)**
Body: Low profile (2.5 studs tall), wide (7 studs), long (14 studs). Aggressive WedgePart angles on front and rear. Roof: Either hardtop or no roof (convertible). Large rear spoiler (angled Part). Side scoops: Indent details with Metal mesh. Wheels: Large 3-stud diameter, low-profile (short Cylinders). Exhaust: Dual pipes (small Cylinders at rear). Hood: Scoop or vent detail. Headlights: Angular, aggressive.
Colors: Racing red RGB(220,30,20) or yellow RGB(255,200,0), black accents RGB(25,25,25), carbon fiber dark gray.

**13. Bus (40-60 parts)**
Body: Large box (8x8x24 studs). Flat front face. Rows of windows on each side (8-10 per side). Wheels: 6 wheels (4 rear in dual configuration). Door: Folding door at front (2 narrow Parts). Interior: Rows of double seats, driver area, hand rails (thin Cylinders). Roof: Slightly rounded (thin Part on top). Route sign: SurfaceGui on front with TextLabel.
Colors: Yellow school bus RGB(255,200,0) or city bus RGB(230,230,230), black trim.

**14. Ambulance (35-50 parts)**
Body: Van shape — box body with rounded front (WedgeParts). Red cross / star of life: Neon red + on sides and roof. Lightbar: Roof-mounted bar with Neon red and blue Parts. Rear doors: Double doors. Wheels: 4, slightly larger than sedan. Interior: Stretcher, medical cabinet, driver area. Siren: Sound with wail effect.
Colors: White body RGB(240,240,240), red stripe RGB(200,30,30), orange stripe RGB(255,130,0).

**15. Fire Truck (50-70 parts)**
Body: Long (20+ studs), tall (6 studs body). Ladder: Extending ladder on top (rectangular Parts, telescoping). Hose reel: Cylinder Part on side. Bumper: Heavy Metal with push bar. Lightbar: Roof neon red. Wheels: 6 large wheels. Compartments: Panel doors on sides (detailing). Water tank: Internal (not visible, but noted). Bell or siren: Sound. Outrigger jacks: Deployable stabilizer legs.
Colors: Fire red RGB(200,30,20), chrome trim RGB(210,210,215), black wheels and base.

**16. Motorcycle (20-30 parts)**
Frame: Thin elongated Parts forming the chassis. Wheels: 2 thin Cylinders (front smaller, rear larger). Engine: Block of Metal Parts between wheels. Seat: Fabric Part, slightly angled. Handlebars: Thin Cylinder bent (2 Parts at angle) with grips. Exhaust: Chrome pipe (Cylinder) along one side. Headlight: Single Neon/SpotLight at front. Fender: Thin curved Parts over wheels.
Colors: Black frame RGB(25,25,25), chrome engine RGB(190,190,195), leather seat RGB(60,40,20).

**17. Speedboat (30-45 parts)**
Hull: Tapered shape — wide rear, narrow bow with WedgeParts. V-hull bottom. Deck: WoodPlanks or white Concrete. Windshield: Angled Glass. Seats: 2-4 bucket seats (small curved Parts). Engine: Outboard motor at rear (Metal box + propeller). Wake: ParticleEmitter behind boat (white spray). Steering wheel: Dashboard area with controls. Railing: Low Metal rails along sides.
Colors: White hull RGB(245,245,245), blue waterline RGB(0,80,160), teak deck RGB(170,120,70).

**18. Helicopter (40-60 parts)**
Fuselage: Egg-shaped body (main Part + WedgeParts for nose). Tail boom: Long thin Part extending backward. Main rotor: 2-4 blade Parts on top (can rotate with HingeConstraint Motor). Tail rotor: Small vertical rotor at tail end. Cockpit: Glass bubble front. Skids: 2 landing skid assemblies (horizontal tubes + vertical struts). Door: Sliding side door. Interior: Pilot + copilot seats, instrument panel.
Colors: Military olive RGB(80,85,70) or civilian white RGB(240,240,240) with color stripe.

**19. Biplane (35-55 parts)**
Wings: 2 sets (upper and lower), rectangular Parts with rounded tips. Struts: Vertical Parts connecting upper and lower wings. Fuselage: Cylinder or elongated Part. Propeller: 2-blade at nose (can spin). Tail: Horizontal stabilizer + vertical rudder (WedgeParts). Wheels: 2 front + 1 tail wheel, simple Cylinders. Cockpit: Open cockpit with small windshield. Wires: Thin Parts representing bracing wires between wings.
Colors: Red body RGB(180,30,25), cream wings RGB(240,235,220), black engine cowl RGB(35,35,35).

**20. Tank (50-80 parts)**
Hull: Low wide box (10x4x14 studs) with angled front (WedgePart). Turret: Rotating upper section (shorter, narrower box). Gun barrel: Long Cylinder extending from turret front. Tracks: Side panels with ribbed detail (repeating small Parts or textured surface). Road wheels: Row of small Cylinders along each side (5-7 per side). Hatches: Top hatches (thin Parts that could open). Armor details: Reactive armor blocks, spare track links, tools strapped on. Exhaust: Rear vents.
Colors: Military green RGB(75,80,60), dark tracks RGB(40,40,35), metal details RGB(100,100,95).

### FURNITURE (15 types)

**21. Dining Table (8-15 parts)**
Top: Flat Part 6x1x10 studs, Wood material. Legs: 4 cylinder or square Parts (0.5x3x0.5) at corners, slightly inset. Decorations: Runner cloth (Fabric Part down center), plate circles (small flat Cylinders), candle holder. Variation: Round table = Cylinder Part top.
Colors: Dark wood RGB(100,65,35), cloth white RGB(240,238,230).

**22. Office Desk (10-18 parts)**
Top: Flat Part 5x0.3x10, Wood or Concrete material. Legs: 2 panel sides (instead of 4 legs). Drawers: 3-drawer pedestal on one side (stacked thin Parts with Metal handle dots). Monitor: Screen Part on top (SurfaceGui capable). Keyboard: Small flat Part. Under-desk: Cable management tray (thin Part).
Colors: Light wood RGB(200,180,150) or white RGB(240,240,240), metal legs RGB(80,80,85).

**23. King Bed (12-20 parts)**
Frame: Base box 8x2x10 studs. Headboard: Tall back panel (8x5x0.5) with carved detail (attached smaller Parts). Mattress: Slightly smaller than frame, Fabric material, 1 stud thick. Pillows: 2-3 small rounded Parts at headboard end. Blanket: Fabric Part draped (angled slightly). Nightstand on each side. PointLight on nightstands (warm glow).
Colors: Wood frame RGB(120,80,45), white sheets RGB(245,243,240), blue blanket RGB(70,90,130), pillow white.

**24. Bunk Bed (15-25 parts)**
Frame: 4 vertical posts (0.5x10x0.5) connected by horizontal rails. Bottom bunk: Mattress at 2 studs high. Top bunk: Mattress at 7 studs high. Ladder: 3-4 rungs on one end. Guard rail: Top bunk has rail on open side. Each mattress: Fabric material with pillow.
Colors: Metal frame RGB(60,60,65) or wood RGB(150,110,60), mattress blue RGB(80,100,140).

**25. L-Shaped Couch (12-18 parts)**
Base: Two rectangular sections meeting at 90 degrees. Seat height: 2 studs. Back height: 3.5 studs. Arm rests: Each end. Cushions: Segmented Parts for individual cushion look. Throw pillows: 2-3 small Parts in accent color. Material: Fabric.
Colors: Gray fabric RGB(140,140,145) or brown leather RGB(120,70,35), accent pillow color.

**26. Recliner (10-15 parts)**
Seat: Padded box shape. Back: Slightly reclined angle. Arms: Thick padded armrests. Footrest: Extended Part at front (optional deployed position). Headrest: Small cushion at top. Material: Fabric or "leather" (Fabric in brown).
Colors: Dark brown RGB(80,50,25) or dark red RGB(120,30,30).

**27. Bookshelf (12-20 parts)**
Frame: Back panel + 2 sides + top + bottom (5 structural Parts). Shelves: 4-5 horizontal dividers. Books: Groups of colored thin Parts on each shelf, varying heights and widths. Some leaning. Decorative: Small clock, photo frame, small plant on one shelf.
Colors: Wood frame RGB(140,95,55), books various colors — red, blue, green, brown, yellow spines.

**28. Wardrobe (10-16 parts)**
Body: Tall box (5x8x2 studs). Doors: 2 front panel Parts (hinged look). Handles: 2 small Metal knobs or bars. Crown molding: Decorative strip at top. Base molding: Slight protrusion at bottom. Interior (if doors open): Hanging rod (thin Cylinder), shelf at top.
Colors: White RGB(240,238,235) or dark wood RGB(80,55,30), metal handles.

**29. TV Stand (8-12 parts)**
Body: Low cabinet (8x2x3 studs). Shelves: Open middle section for media player. Doors: 2 side cabinets with small handles. Top: TV (thin black Part with SurfaceGui showing colored screen). Legs: Short Metal hairpin legs or solid base. Cable hole: Small gap in back.
Colors: Matte black RGB(35,35,35) or white RGB(240,240,240), TV screen RGB(40,40,45).

**30. Kitchen Island (12-20 parts)**
Base cabinet: Long box (10x3x4 studs), Concrete or Wood. Countertop: Granite or Marble material, slightly overhanging base. Sink: Recessed area (slightly lower Part) with faucet (bent Cylinder). Bar stools: 2-3 on one side (see bar stool recipe). Cabinet doors: Panel details on front. Overhead: Pendant lights (small Parts + PointLights).
Colors: White base RGB(245,245,245), dark granite top RGB(50,50,55), chrome fixtures RGB(200,200,205).

**31. Bathroom Vanity (10-15 parts)**
Cabinet: Box (5x3x2.5 studs) with door fronts. Counter: Marble top with slight overhang. Sink basin: Recessed oval (Cylinder Part recessed into counter). Faucet: Small bent Cylinder chrome. Mirror: Flat Part above (Glass material, Reflectance 0.8). Wall-mounted lights: 2 small PointLights flanking mirror. Towel ring: Small Cylinder arc on side.
Colors: White cabinet RGB(245,245,245), marble counter RGB(235,230,225), chrome fixtures.

**32. Bar Stool (6-10 parts)**
Seat: Small disc (Cylinder, 2-stud diameter, 0.3 high). Legs: 4 angled Metal rods meeting at a central point. Footrest ring: Thin Cylinder at half height connecting all 4 legs. Back: Short backrest OR no back (counter stool). Cushion: Fabric top on seat in accent color.
Colors: Black metal legs RGB(35,35,35), brown leather seat RGB(100,60,30).

**33. Grand Piano (15-25 parts)**
Body: Curved shape approximated with Parts and WedgeParts. Lid: Angled open lid (thin Part propped up). Keys: Long white Part with smaller black Parts for sharps. Legs: 3 ornate turned legs. Pedals: 3 small Parts at base. Bench: Separate small padded seat.
Colors: Glossy black RGB(20,20,20) with Reflectance 0.3, white keys RGB(250,248,245), gold pedals.

**34. Pool Table (12-18 parts)**
Frame: Heavy Wood box (6x3x10 studs). Playing surface: Green Fabric flat top (5.5x0.2x9.5), recessed slightly. Rails: Wood bumper rails around edge. Pockets: 6 dark recessed circles (small black Cylinder Parts) at corners and mid-sides. Legs: 4 thick turned legs. Balls: 16 small sphere Parts on surface (white, colored, striped). Cue: Thin long Cylinder leaning against table.
Colors: Dark wood frame RGB(90,50,25), green felt RGB(40,120,50), ball colors various.

**35. Grandfather Clock (10-16 parts)**
Case: Tall narrow box (2x8x1.5 studs), Wood material. Hood: Slightly wider top section with decorative crown. Face: White circle (Cylinder) with SurfaceGui showing clock numbers. Pendulum: Behind Glass door (thin Part + Glass), visible through lower door. Weights: 2 small hanging Cylinder Parts. Base: Wider bottom section. Finials: Small decorative tops.
Colors: Dark mahogany RGB(80,40,20), white face RGB(250,248,240), gold hands/trim RGB(200,170,50).

### WEAPONS (10 types)

**36. Longsword (6-10 parts)**
Blade: Thin long Part (0.2x0.2x5 studs), Metal material, light gray. Guard: Cross-piece (0.15x0.6x1.5) perpendicular to blade. Grip: Cylinder (0.3x1.5) below guard, Wood or Fabric wrap. Pommel: Small sphere or cube at bottom. Fuller: Very thin darker line down blade center. Edge detail: Slight taper toward tip (WedgePart).
Colors: Steel blade RGB(190,190,195), gold guard RGB(200,175,50), brown grip RGB(80,50,25).

**37. Katana (5-8 parts)**
Blade: Slightly curved (use CFrame rotation), thin (0.15x0.12x4.5 studs), highly polished Metal. Tsuba (guard): Small disc (Cylinder 0.1x0.8). Tsuka (handle): Cylinder, wrapped look (Fabric material), slightly longer than Western sword. Habaki (blade collar): Small ring where blade meets guard. Saya (scabbard): Matching curved sheath Part.
Colors: Bright steel blade RGB(210,210,215), black handle RGB(25,25,25), gold guard RGB(190,170,50), red accent RGB(160,30,30).

**38. Battle Axe (8-12 parts)**
Shaft: Long Cylinder (0.4x5 studs), WoodPlanks material. Head: Curved blade shape (WedgePart + Part combination for crescent shape), Metal material. Counter-weight: Small spike or ball at shaft bottom. Leather wrap: Fabric section near grip area. Rivets: Small metal dots where head meets shaft.
Colors: Dark wood shaft RGB(90,60,30), dark steel head RGB(100,100,105), leather RGB(80,50,25).

**39. War Hammer (8-12 parts)**
Shaft: Thick Cylinder (0.5x4 studs), Metal reinforced Wood. Head: Rectangular box (1.5x1x1.5) on one side, spike (WedgePart) on other side, all Metal. Grip: Fabric wrap on lower shaft. Spike at top: Small pointed Part above head. Lanyard: Small loop at bottom.
Colors: Dark iron head RGB(70,70,75), oak shaft RGB(130,90,45), leather wrap RGB(90,55,25).

**40. Longbow (6-10 parts)**
Limbs: 2 slightly curved Parts (or bent using CFrame) forming the bow arc, Wood material. String: Thin Part (0.02x0.02) connecting limb tips. Grip: Central thicker section with Fabric wrap. Arrow rest: Small notch. Quiver (accessory): Cylinder with arrows (thin Parts) sticking out top.
Colors: Yew wood RGB(180,140,70), white string RGB(230,225,215), brown leather grip.

**41. Crossbow (10-15 parts)**
Stock: Angled WoodPlanks stock (like a rifle). Limbs: Horizontal bow limbs (2 Parts) at front. String: Thin Part across limbs. Track: Top rail where bolt sits. Trigger: Small Part underneath. Stirrup: Metal foot brace at front. Bolt: Small thin Part loaded.
Colors: Dark wood stock RGB(80,55,30), metal limbs RGB(110,110,115), leather accents.

**42. Magic Staff (8-14 parts)**
Shaft: Long Cylinder (0.35x6 studs), WoodPlanks material, gnarled look. Headpiece: Crystal cluster at top (3-4 angled transparent/Neon Parts in gemstone colors). Rings/bands: 2-3 thin Metal rings along shaft. Runes: Small Neon parts embedded in shaft. Particle effect: ParticleEmitter at top (magical sparkles). PointLight in crystal (colored glow).
Colors: Aged wood RGB(100,75,45), crystal purple RGB(150,50,200) or blue RGB(50,100,220), gold bands RGB(200,170,50).

**43. Dagger (5-8 parts)**
Blade: Short tapered Part (0.12x0.1x2 studs) with WedgePart tip, Metal material. Guard: Small cross-piece or ring. Grip: Short Cylinder with wrap pattern. Pommel: Small sphere. Sheath: Leather-colored Part.
Colors: Silver blade RGB(200,200,205), black grip RGB(30,30,30), brass guard RGB(180,160,60).

**44. Shield (6-10 parts)**
Face: Large disc or kite shape (Cylinder for round, diamond arrangement for kite). Rim: Metal ring around edge. Boss: Central raised dome (half-sphere Part). Arm straps: Back of shield, 2 thin Parts. Emblem: Contrasting color shape on face (cross, lion, dragon silhouette). Material: Metal face with Wood backing.
Colors: Blue face RGB(40,50,120), gold trim RGB(200,175,50), silver boss RGB(190,190,195).

**45. Trident (8-12 parts)**
Shaft: Long Cylinder (0.4x6 studs), Metal material. Center prong: Straight spike at top. Side prongs: 2 angled prongs (WedgeParts or rotated Parts) curving outward then upward. Base: Small pommel. Grip: Section with textured wrap. Coral/barnacle detail: Small rough Parts if underwater themed.
Colors: Sea-green Metal RGB(60,140,130), gold bands RGB(200,180,50), dark grip RGB(40,40,45).

### NATURE (10 types)

**46. Oak Tree (12-20 parts)**
Trunk: Cylinder Part, 2-stud diameter, 12-15 studs tall, WoodPlanks material in dark brown. Branches: 3-5 smaller Cylinders at angles from upper trunk. Canopy: 4-6 overlapping spheres (Part Shape=Ball) in varying greens, Size 8-12 studs. Root flares: 3-4 small WedgeParts at base. Knot hole: Small dark circle on trunk.
Colors: Bark RGB(90,65,35), canopy RGB(50,110,40), RGB(60,130,50), RGB(40,90,30) (varied).

**47. Palm Tree (8-12 parts)**
Trunk: Slightly tapered Cylinder, 1.5 stud diameter, 18-22 studs tall, leaning slightly (CFrame tilt). Ring texture: Horizontal bands (thin darker Parts every 2 studs up trunk). Fronds: 6-8 flat elongated Parts (12x0.1x2) angled downward from crown, Green. Coconuts: 2-3 small brown sphere Parts at crown base. No canopy sphere — palms have individual fronds.
Colors: Trunk RGB(160,130,80), fronds RGB(40,120,40), coconut RGB(120,80,40).

**48. Willow Tree (15-25 parts)**
Trunk: Short thick Cylinder (3 stud diameter, 8 studs tall) with split into 2-3 main branches. Hanging fronds: 15-20 thin vertical/slightly curved Parts (0.5x8x0.1) hanging from branch endpoints, LeafyGrass-colored. Ground pool: Often near water — add small blue Glass Part as pond. The drooping curtain effect is the signature.
Colors: Dark bark RGB(70,55,30), hanging fronds RGB(60,130,50) with slight yellow-green variation.

**49. Bush (4-8 parts)**
Body: 2-3 overlapping spheres (Part Shape=Ball) at ground level, Size 3-5 studs. Material: LeafyGrass or Grass-colored Concrete. Flowers (optional): 3-5 tiny colored sphere Parts (0.3 stud) nestled in the green. Base: Small dirt-colored disc underneath.
Colors: Green RGB(50,120,45), flowers — red RGB(200,50,50), yellow RGB(240,220,50), pink RGB(220,130,150).

**50. Flower Garden (15-25 parts)**
Bed: Flat brown rectangle (Mud-colored Concrete) as soil. Border: Small Cobblestone or Brick edge wall (0.5 studs tall). Flowers: 10-15 thin stems (0.1x1.5 Cylinder green) with small colored tops (0.3 sphere). Variety: 3-4 flower colors, varying heights. Butterfly: Optional tiny Part with ParticleEmitter. Watering can: Small prop.
Colors: Soil RGB(100,75,45), stems RGB(50,100,40), petals — red, yellow, purple, pink, white.

**51. Rock Formation (6-12 parts)**
Rocks: 5-8 Parts of varying sizes (2-8 studs), rotated randomly with CFrame.Angles for organic look. Material: Slate, Rock, or Granite. Arrangement: 2-3 large rocks as base, smaller rocks piled around. Moss: Thin green Parts on top surfaces. Ground scatter: Small pebble Parts around base.
Colors: Gray RGB(120,115,110) primary, darker RGB(90,85,80) variation, moss green RGB(70,100,50).

**52. Waterfall (10-18 parts)**
Cliff: Tall rock wall (Slate Parts, 20+ studs tall). Water flow: Vertical Part (Glass material, Transparency 0.4, blue-white) from top to bottom. Splash: ParticleEmitter at base (white spray). Pool: Blue Glass Part at bottom (Transparency 0.3). Mist: ParticleEmitter (white, low speed, high transparency). Rocks: Scattered at base and along cliff. Sound: Waterfall Sound parented to splash area.
Colors: Rock RGB(100,95,85), water RGB(150,200,230) semi-transparent, mist white.

**53. Campfire (8-15 parts)**
Ring: 6-8 small rock Parts (Slate, irregular sizes) in a circle, 4-stud diameter. Logs: 3-4 small WoodPlanks Cylinder Parts (0.5x3) arranged teepee or crosshatch. Fire: Fire instance on central Part, or ParticleEmitter with orange-red gradient. PointLight: Orange, Brightness 1.5, Range 15 for warm glow. Sparks: Second ParticleEmitter with small yellow particles drifting up. Sound: Crackling fire audio.
Colors: Rock gray RGB(110,105,100), logs RGB(100,70,35), fire glow (effect handles color).

**54. Pond (8-15 parts)**
Water surface: Flat Part (Glass or custom blue, Transparency 0.3-0.5), irregular shape (or circular). Rim: Mud/Ground colored Parts around edge, slightly raised. Lily pads: 3-5 small flat green discs (Cylinder, 0.05 tall) floating on surface. Reeds: 4-6 thin tall green Parts at one edge. Fish: Optional tiny orange Part beneath surface. Frog: Small green Part on a lily pad. Reflection: The water Part naturally catches environmental reflections.
Colors: Water RGB(80,130,160), lily pad RGB(40,100,40), mud edge RGB(100,80,50).

**55. Mushroom Cluster (6-12 parts)**
Large mushroom: Stem Cylinder (1x3 studs, beige) + cap (half-sphere Part, 3x1.5x3, red with white spots). Medium mushrooms: 2-3 at half scale. Small mushrooms: 3-4 tiny ones clustered around base. Spots: Small white sphere Parts on caps. Glow (optional): Neon material caps for fantasy/bioluminescent effect. Ground: Leaf litter (thin brown Parts).
Colors: Stem beige RGB(230,215,180), cap red RGB(200,50,40), spots white RGB(250,245,240). Or fantasy: Neon purple/blue/green.

### CHARACTERS (10 types)

**56. Knight (20-30 parts)**
Helmet: Cylinder/sphere with visor slit (thin dark Part). Chestplate: Torso-shaped Metal Part with raised center ridge. Pauldrons: Curved shoulder armor (half-sphere Parts). Gauntlets: Metal forearm pieces. Greaves: Metal shin guards. Chainmail skirt: Fabric Part below chestplate. Cape: WedgePart/angled Part behind. Sword: See longsword recipe. Shield: See shield recipe. Plume: Colored Fabric on helmet top.
Colors: Silver armor RGB(190,190,195), gold trim RGB(200,175,50), cape red RGB(160,30,30), leather RGB(90,55,25).

**57. Wizard (15-22 parts)**
Robe: Long Fabric Part covering torso to feet. Hat: Tall cone (WedgePart) with wide brim (flat Cylinder). Staff: See magic staff recipe. Belt: Thin Part at waist with pouch (small Part). Beard: White/gray Fabric Part from face. Book: Small Part on belt or in hand. Stars/moons: Small Neon decorations on robe. Cloak clasp: Small gem Part at neck.
Colors: Deep blue robe RGB(30,30,100) or purple RGB(60,20,100), gold stars RGB(220,200,60), white beard.

**58. Zombie (12-18 parts)**
Body: Standard humanoid shape but with asymmetry — one arm lower, lurching posture. Torn clothing: Ragged Fabric Parts (irregular edges simulated by small notched Parts). Skin: Pale green/gray Concrete material. Exposed bone: White Parts visible through torn areas. Missing parts: One eye darker/missing, jaw slightly displaced. Blood stains: Dark red-brown small Parts on clothes and ground. Shambling pose: Rotated limb CFrames.
Colors: Skin RGB(140,160,120), clothes RGB(80,75,65) tattered, blood RGB(100,30,20).

**59. Robot (18-28 parts)**
Head: Box or Cylinder with Neon eye visor (strip across front). Torso: Metal box with panel lines (thin darker Parts). Arms: Segmented Cylinder joints + box segments. Legs: Same segmented style. Hands: Simple clamp (2 Parts). Antenna: Thin Part on head. Chest panel: Detail with Neon indicators (small colored dots). Exhaust vents: Grid of small rectangles on back. Joints visible: Sphere Parts at elbows/knees.
Colors: Silver body RGB(180,180,185), dark joints RGB(60,60,65), Neon blue eyes/accents RGB(0,150,255).

**60. Alien (15-22 parts)**
Head: Oversized elongated sphere (Part Shape=Ball, 3x4x3 studs). Large eyes: 2 big dark sphere Parts (almond-shaped via CFrame scaling). Body: Thin/lanky proportions. Skin: Smooth gray or green material. Fingers: Long thin Parts (3-4 per hand). Suit (optional): Metallic bodysuit Parts. No nose, small mouth slit. Bioluminescent markings: Small Neon lines on skin.
Colors: Gray skin RGB(160,170,175) or green RGB(120,170,130), dark eyes RGB(20,20,25), Neon accents.

**61. Pirate (15-22 parts)**
Hat: Tricorn — 3 WedgeParts forming turned-up brim + skull emblem. Coat: Long Fabric coat below waist. Eyepatch: Small black Part over one eye. Hook hand: Small curved Metal Part replacing one hand. Peg leg: Cylinder WoodPlanks leg on one side. Belt: Wide belt with brass buckle. Cutlass: Short curved sword. Bandana: Fabric Part under hat. Earring: Small gold sphere. Beard: Rugged dark Fabric.
Colors: Dark coat RGB(50,30,30), hat brown RGB(40,30,20), gold accents RGB(200,175,50), red sash RGB(170,40,30).

**62. Ninja (12-18 parts)**
Full body: Black Fabric covering everything. Mask: Face covering leaving only eye slit. Eye band: Thin Part across eyes. Armor pieces: Thin Metal shoulder/chest guards over fabric. Katana: On back (see katana recipe). Throwing stars: Small flat cross-shaped Parts on belt. Belt/sash: Colored Fabric waist wrap. Arm wraps: Thin Fabric bands on forearms. Tabi boots: Split-toe boots (subtle detail).
Colors: All black RGB(20,20,20), metal armor RGB(50,50,55), accent color — red RGB(160,30,30) or blue RGB(30,30,160).

**63. Fairy (12-18 parts)**
Body: Small scale (70% normal humanoid size). Wings: 4 transparent Parts (Transparency 0.3-0.5, Neon material) in butterfly/dragonfly shape, attached to back. Dress: Leaf/petal-shaped Fabric Parts. Crown: Small flower/gem circlet. Wand: Thin Part with star tip (Neon). Glow: ParticleEmitter (sparkles, slow speed, small size). PointLight: Soft warm glow. Hair: Flowing colored Parts.
Colors: Pastel dress — pink RGB(255,180,200), green RGB(150,230,150), or blue RGB(180,210,255). Wing Neon, sparkle gold.

**64. Werewolf (18-25 parts)**
Body: Larger than normal humanoid, hunched posture. Fur: Dark Fabric/LeafyGrass-textured Parts. Claws: WedgePart fingers, sharp white tips. Snout: Extended face (Parts forming muzzle). Ears: Pointed triangular Parts on head. Teeth: Small white WedgeParts in jaw. Tail: Curved segmented Parts. Torn clothes: Remnant Fabric Parts (ripped shirt/pants). Eyes: Small Neon yellow Parts. Muscular bulk: Extra Parts on shoulders/chest.
Colors: Dark fur RGB(60,50,40), lighter chest RGB(100,85,65), Neon yellow eyes RGB(255,200,0), claw white.

**65. Ghost (8-14 parts)**
Body: Simple humanoid shape with lower body tapering (no legs — fades into point). Material: Glass or Neon with Transparency 0.4-0.6. Face: Simple eyes and mouth (dark Parts or Neon). Chain: Optional chain links (small connected Cylinder Parts). Glow: PointLight (pale blue/white, low brightness). Trail: Trail effect behind when moving. Arms: Extended forward or floating at sides. Hood: Optional hood/cowl shape. ParticleEmitter: Slow-rising mist particles.
Colors: Pale white-blue RGB(200,210,230) at Transparency 0.5, eyes dark RGB(20,20,40) or Neon green RGB(100,255,100).

### STRUCTURES (10 types)

**66. Bridge (25-40 parts)**
Type: Stone arch bridge. Abutments: Thick Brick/Slate pillars on each bank. Arch: Curved underside (multiple WedgeParts forming arc). Deck: Flat road surface (Cobblestone) on top. Railings: Stone wall railings on each side (1 stud thick, 3 studs tall). Posts: Decorative pillars on railing at regular intervals. Keystone: Central stone at arch peak. Width: 6-8 studs. Span: 20-30 studs. Under-arch detail: Voussoir stones (wedge-shaped blocks forming the arch).
Colors: Stone gray RGB(150,145,140), railing lighter RGB(170,165,160), road darker RGB(130,125,120).

**67. Lighthouse (30-50 parts)**
Tower: Tapered cylinder — wider at base (6 stud diameter), narrower at top (4 studs), 30-40 studs tall. Alternating stripes: Red and white horizontal bands (layered Parts). Gallery: External walkway at top with Metal railing. Lantern room: Glass-enclosed room at very top with central SpotLight (bright, rotating with HingeConstraint). Dome: Small cap above lantern room. Door: Heavy door at base. Windows: Small, scattered up the tower. Base: Rocky platform extending into water. Foundation: Concrete wider base.
Colors: White tower RGB(240,240,240), red stripes RGB(200,40,35), black gallery rail RGB(30,30,30).

**68. Windmill (25-40 parts)**
Tower: Tapered cylinder or box, 20 studs tall, Brick or Cobblestone material. Sails/Blades: 4 arms extending from top hub, each arm = long Part with lattice detail (thin cross Parts). The hub can rotate (HingeConstraint Motor, slow speed). Cap: Rotating top section (dome shape, WoodPlanks). Door: Ground level, arched Wood door. Windows: 2-3 small windows up the tower. Grain chute: Small angled Part exiting side. Base: Stone foundation wider than tower.
Colors: Brick tower RGB(180,150,120), white sails (Fabric material) RGB(240,235,225), wood cap RGB(130,90,50).

**69. Well (10-18 parts)**
Base: Circular Cobblestone wall, 4-stud diameter, 3 studs tall, open center. Roof: Small peaked roof over the well (2 WedgeParts on 2 vertical posts). Bucket: Small Part on rope (thin Cylinder chain down into well). Crank: Horizontal Cylinder handle on one post with HingeConstraint. Water: Blue Glass Part deep inside (2 studs below rim). Stone detail: Irregular-sized cobblestones around base.
Colors: Gray stone RGB(140,135,130), dark wood posts RGB(90,65,35), rope tan RGB(180,160,120), water blue.

**70. Market Stall (12-20 parts)**
Frame: 4 Wood post corners (0.5x6x0.5). Counter: Front-facing shelf (WoodPlanks, 4x1x6). Canopy: Angled Fabric roof with scalloped edge (striped colors). Display: Items on counter (small colored Parts — fruits, bottles, goods). Back wall: Partial WoodPlanks back. Sign: Part above with SurfaceGui text. Crates: 2-3 small WoodPlanks boxes on ground. Fabric draping on sides.
Colors: Wood frame RGB(140,100,55), canopy stripes — red RGB(180,40,35) + white RGB(245,240,230), goods varied.

**71. Gazebo (15-25 parts)**
Base: Octagonal or hexagonal raised platform (0.5 stud tall, Concrete or WoodPlanks, 10 stud diameter). Columns: 6-8 pillars at platform edges (Cylinder, 0.5x7 studs). Roof: Conical or multi-faceted peaked roof (WedgeParts arranged radially). Railing: Low railing between columns (3 studs tall). Steps: 2-3 steps at entrance. Bench: Optional built-in seating around interior perimeter. Decorative: Climbing vine (small green Parts on columns), hanging lantern at center.
Colors: White structure RGB(245,245,245), gray roof RGB(120,115,110), dark railing RGB(50,50,55).

**72. Watchtower (30-45 parts)**
Base: Square 8x8 stud footprint, Stone walls, 5 studs tall, solid. Second level: Slightly narrower, open archer windows. Top platform: Open-air observation deck with crenellated parapet. Ladder/stairs: Internal access between levels (TrussParts or step Parts). Roof: Optional conical or no roof. Flag: Fabric Part on top pole. Torch brackets: PointLights at each level. Arrow slits: Narrow vertical windows in lower walls. Foundation: Extended stone base.
Colors: Dark stone RGB(100,95,90), wood interior RGB(130,90,50), flag colors per team.

**73. Pier/Dock (15-25 parts)**
Platform: Long WoodPlanks walkway (4 studs wide, 20+ studs long) extending into water. Pilings: Cylinder posts (WoodPlanks, 0.8 diameter) every 4 studs under platform, extending into water and above deck as mooring posts. Railing: One or both sides, Wood posts + horizontal rails. Cleats: Small Metal tie-off points on edge. Rope coils: Small curved Parts on deck. Ladder: At end for climbing from water. Lantern: On end post with PointLight. Bumpers: Rubber edge pieces.
Colors: Weathered wood RGB(160,140,110), dark pilings RGB(90,75,55), rope tan, water blue beneath.

**74. Greenhouse (20-30 parts)**
Frame: Metal or Wood skeleton (thin Parts forming rectangular grid). Panels: Glass Parts (Transparency 0.3) filling the grid. Roof: Peaked Glass roof with ridge vent. Door: Glass door with Metal handle. Interior: Raised planting beds (WoodPlanks boxes with dirt-colored top), shelving, potting bench. Plants: Various green sphere/cone Parts in pots. Sprinkler/mist: ParticleEmitter for humidity effect. Light: Bright interior from Glass letting in light.
Colors: White Metal frame RGB(230,230,230), glass clear, interior dirt RGB(100,80,50), plants various greens.

**75. Amphitheater (25-40 parts)**
Stage: Raised flat platform (Concrete or WoodPlanks, 15x0.5x10 studs). Seating: Semi-circular tiered rows (5-8 rows of curved benches, each row 1 stud higher). Each row: Long curved Part. Backstage wall: Tall wall behind stage with columns. Entrance ways: 2-3 gaps in seating rows. Orchestra pit: Recessed area between stage and first row (optional). Lighting: SpotLights aimed at stage. Columns: Marble pillars flanking stage. Decorative: Statues in niches of back wall.
Colors: Stone seating RGB(180,175,170), stage wood RGB(150,110,60), marble columns RGB(240,235,230).

### PROPS (15 types)

**76. Lamp Post (6-10 parts)**
Pole: Tall Cylinder (0.3 diameter, 10-12 studs tall), Metal material. Base: Wider square or circular base (2x0.5x2). Arm: Curved L-shape at top (2 Parts). Lantern housing: Small box or sphere at arm end. Glass panels: Small Glass Parts in lantern. PointLight: Inside lantern, warm color, Brightness 1-2, Range 20. Cross bar: Decorative below arm.
Colors: Black iron RGB(35,35,35) or dark green RGB(30,50,30), warm light RGB(255,230,180).

**77. Park Bench (6-10 parts)**
Seat: 3 horizontal WoodPlanks slats (6x0.2x0.8 each, spaced 0.1 apart). Back: 3 similar slats at angle behind seat. Armrests: 2 Metal curved armrest supports. Legs: 2 ornate cast iron leg frames (Metal Parts forming the side profile). Bolts: Tiny dots where wood meets metal.
Colors: Natural wood slats RGB(160,130,80), black iron legs RGB(40,40,45).

**78. Mailbox (5-8 parts)**
Box: Rounded top rectangle (2x2x1.5 studs), Metal material. Flag: Small thin red Part on side (raised/lowered position). Post: Cylinder (0.4x4 studs), WoodPlanks. Door: Small front or back panel. Letters slot: Dark opening. Number: SurfaceGui with TextLabel (house number).
Colors: US style: Blue RGB(50,60,130) or classic red RGB(180,40,40), wood post RGB(120,85,50).

**79. Fire Hydrant (6-10 parts)**
Body: Cylinder (1.2x2.5 studs), Metal material. Cap: Dome top (half-sphere). Outlets: 2 side nozzle caps (small Cylinders protruding horizontally). Chains: Small connected Parts from cap to body. Pentagon nuts: Small Parts on outlets. Base: Wider foot ring at bottom. Paint: Slightly chipped look (2 colors — base + patches of different color).
Colors: Classic red RGB(200,40,30) or yellow RGB(230,200,0), silver caps RGB(180,180,185).

**80. Traffic Light (8-14 parts)**
Pole: Tall Cylinder (0.3x12 studs), Metal gray. Arm: Horizontal extension at top. Housing: Rectangular box (1.5x3x1) with visor hoods above each light. Lights: 3 sphere or Cylinder Parts — Red (top), Yellow (middle), Green (bottom). Active light: Neon material + PointLight. Inactive lights: Darker versions. Visor: Small WedgePart shade above each light. Control box: Small Part on pole.
Colors: Dark gray pole RGB(70,70,75), black housing RGB(30,30,30), lights: red RGB(255,30,20), yellow RGB(255,200,0), green RGB(0,200,50).

**81. Dumpster (8-12 parts)**
Body: Large open-top box (6x4x4 studs), Metal material. Lid: 2 hinged halves (one open, one closed for visual interest). Wheels: 4 small black Cylinders at bottom. Drain holes: Small dark circles on bottom. Side handles: Thin Cylinder grips for truck arms. Label: SurfaceGui with waste company text. Rust: CorrodedMetal patches.
Colors: Dark green RGB(40,70,40) or blue RGB(40,50,100), rust patches RGB(140,90,50).

**82. Vending Machine (10-16 parts)**
Body: Tall box (3x6x2.5 studs), Metal material. Glass front: Large Glass Part showing products. Products: Grid of small colored Parts visible inside (drinks/snacks). Coin slot: Small dark rectangle. Button panel: Grid of small Parts. Dispensing tray: Bottom opening. Brand label: SurfaceGui with text/logo at top. Light: Internal PointLight making products visible. Electric cord: Thin Part to wall.
Colors: White or red body RGB(200,40,35), glass front, product colors varied.

**83. Phone Booth (10-16 parts)**
Frame: Metal skeleton forming tall rectangular box (3x7x3 studs). Panels: Glass on 3 sides (Transparency 0.3). Door: One Glass panel that could open. Roof: Metal top with small dome light. Phone unit: Small box Part inside at hand height with Cylinder handset. Shelf: Small ledge under phone. Base: Concrete step up. Sign: "PHONE" text or phone icon (SurfaceGui).
Colors: Classic red RGB(200,40,35) for British style, or chrome/glass for modern.

**84. Fountain (15-25 parts)**
Basin: Large circular wall (ring shape — outer Cylinder minus inner, or layered Parts), 6-8 stud diameter, 2 studs tall, Marble material. Water: Blue Glass Part inside basin (Transparency 0.3). Center piece: Pedestal with statue/urn/sphere on top. Water jets: ParticleEmitter on center piece (white/blue particles arcing outward and down). Rim: Decorative lip on basin edge. Drain: Bottom visible through water. Lights: Underwater PointLights (blue/white). Sound: Water splashing sound.
Colors: White marble RGB(240,238,235), water blue RGB(100,170,220) semi-transparent, green patina on copper RGB(100,160,130).

**85. Statue (12-20 parts)**
Pedestal: 3-tiered base — large bottom (4x2x4), medium step (3x1x3), small top (2.5x1x2.5), all Marble/Granite. Figure: Simplified human form (torso box, head sphere, arm/leg Parts). Pose: Heroic stance or seated thinker. Material: Marble or Metal (bronze). Detail: Toga/robe draping (thin Parts), held object (sword/book/torch). Plaque: Small Part at base with SurfaceGui text. Patina: Slight green tint if bronze (CorrodedMetal).
Colors: White marble RGB(240,238,235) or bronze RGB(140,110,60), pedestal darker stone RGB(160,155,150).

**86. Swing Set (12-18 parts)**
A-Frame: 2 A-shaped supports (4 Parts each — 2 angled legs + crossbar). Top bar: Horizontal Cylinder connecting the two A-frames, Metal material, 8 studs wide. Swings: 2-3 swing seats — each has: 2 chain lines (thin Parts or Rope constraints), 1 seat (flat Part, 2x0.2x1, Rubber or Wood). Ground wear: Darker/depressed Part under each swing where feet drag. Total span: 8 studs wide, 8 studs tall.
Colors: Metal frame RGB(200,40,40) red or RGB(50,50,55) dark, chain silver RGB(180,180,185), seat brown or black.

**87. Slide (10-16 parts)**
Chute: Angled surface (long Part, 2 studs wide, 10+ studs long, angled at 30-40 degrees), Metal material. Sides: 2 raised edge walls on the chute (0.5 studs tall). Ladder: Back access ladder (TrussPart or step rungs). Platform: Small standing platform at top. Handrails: At top platform. Curved bottom: WedgePart at bottom for smooth landing. Steps: 6-8 step Parts up the back.
Colors: Yellow chute RGB(255,210,0) or blue RGB(50,100,200), red sides RGB(200,40,40), metal ladder silver.

**88. See-Saw (6-10 parts)**
Beam: Long plank (1x0.3x8 studs), WoodPlanks, balanced on center. Fulcrum: Triangular support at center (WedgePart or A-frame). Seats: 2 small flat Parts at each end. Handles: Thin vertical Cylinder + horizontal Cylinder at each end. Ground pads: Small rubber Parts under each end impact zone. Base: Metal or Concrete anchor on ground.
Colors: Wood plank RGB(180,140,80), metal fulcrum RGB(80,80,85), handle colors RGB(200,40,40) and RGB(50,50,200).

**89. Picnic Table (8-12 parts)**
Table top: Flat Part (6x0.3x3 studs), WoodPlanks. Benches: 2 attached bench Parts (6x0.3x1.5) on either side, lower than table. A-frame legs: 2 A-shaped supports under table connecting to benches. Cross brace: Horizontal Part connecting the two A-frames. All one unit — benches attached to table. Umbrella hole: Optional center hole for umbrella (separate: pole Cylinder + Fabric canopy).
Colors: Natural wood RGB(170,140,90), slightly weathered feel, umbrella red or blue striped.

**90. Bike Rack (6-10 parts)**
Base: Long flat Metal bar on ground (6x0.2x0.5). Loops: 5-7 inverted U-shaped hoops (each made of 3 Parts — 2 vertical + 1 curved top, or a Cylinder bent), evenly spaced along the base. Material: Metal, silver or black. Optional bike: Simplified 2-wheel frame leaning in one slot.
Colors: Silver metal RGB(180,180,185) or black RGB(40,40,45).

### FOOD & ITEMS (10 types)

**91. Pizza (6-10 parts)**
Base: Flat circle (Cylinder, 4x0.2 studs), beige for crust. Sauce: Slightly smaller red circle on top. Cheese: Yellow circle on top of sauce. Toppings: 4-6 small Parts — pepperoni (small red discs), mushroom (tiny gray), olive (tiny dark green), pepper (tiny green strips). Missing slice: One WedgePart cut out to show triangle gap. Crust edge: Slightly thicker ring around outer edge.
Colors: Crust RGB(220,190,130), sauce RGB(180,50,30), cheese RGB(240,210,80), pepperoni RGB(160,40,30).

**92. Burger (6-10 parts)**
Bun top: Half-sphere Part, warm brown. Sesame seeds: Tiny white dots on top (small Parts). Lettuce: Thin green Part extending beyond bun edges (ruffled look). Tomato: Thin red disc. Patty: Thick dark brown disc, slightly wider than bun. Cheese: Yellow thin Part, slightly draped over patty edges. Bun bottom: Flat disc, lighter brown. Stack order bottom-up: bun, patty, cheese, tomato, lettuce, bun-top.
Colors: Bun RGB(200,160,80), patty RGB(90,60,30), cheese RGB(255,210,50), lettuce RGB(80,160,50), tomato RGB(200,60,50).

**93. Cake (8-14 parts)**
Layers: 3 stacked Cylinders, each slightly different diameter (bottom biggest). Frosting: Slightly larger thin Cylinders between layers (cream-colored, protruding beyond cake). Topping: Strawberries (small red spheres), candles (thin Cylinders with Neon flame tips), chocolate drips (thin brown Parts on sides). Plate: White flat Cylinder beneath. Rose decorations: Small pink sphere clusters on top.
Colors: Cake brown RGB(180,130,80) or vanilla RGB(240,230,200), white frosting RGB(250,248,245), strawberry red, candle various.

**94. Sushi (8-14 parts)**
Plate: Small rectangular or round dark plate. Nigiri (2-3 pieces): Rice rectangle (white small Part) with fish slice on top (pink/red/orange thin Part). Maki rolls (4-6 pieces): Small Cylinders (dark green nori exterior, white rice ring, colored center). Soy sauce: Tiny dark dish (small brown Cylinder). Wasabi: Tiny green cone. Ginger: Small pink pile. Chopsticks: 2 thin long Parts.
Colors: Rice white RGB(245,243,238), salmon RGB(230,130,80), tuna RGB(180,60,60), nori RGB(30,40,30), plate dark RGB(40,35,30).

**95. Ice Cream Cone (5-8 parts)**
Cone: WedgePart or conical shape (tan, waffle texture — WoodPlanks material works), 1x2x1 studs. Scoops: 1-3 sphere Parts stacked (1.2 stud diameter each). Colors per scoop: Vanilla (cream), chocolate (brown), strawberry (pink). Drip: Small elongated Part running down one side (same color as a scoop). Sprinkles (optional): Tiny multicolored Parts on top scoop. Cherry: Small red sphere on very top.
Colors: Cone RGB(210,180,120), vanilla RGB(255,245,220), chocolate RGB(80,50,25), strawberry RGB(240,150,170).

**96. Taco (5-8 parts)**
Shell: Curved Part (or V-shaped from 2 angled Parts), golden brown, WoodPlanks material for texture. Meat: Brown filling visible at top. Lettuce: Green shredded strips (thin Parts extending above shell). Cheese: Yellow small Parts (shredded). Tomato: Small red cube Parts. Sour cream: White small Part on top. Shell cradles the fillings.
Colors: Shell RGB(220,180,100), meat RGB(120,80,40), lettuce RGB(80,160,50), cheese RGB(240,210,50).

**97. Hot Dog (5-8 parts)**
Bun: Elongated Part with split along top (2 Parts forming V-shape or one Part with dark line), warm bread color. Sausage: Cylinder sitting in bun split, slightly longer than bun (extends past each end). Mustard: Thin yellow zigzag line (small angled Parts) on top. Ketchup: Similar red line. Relish: Tiny green dots.
Colors: Bun RGB(210,180,120), sausage RGB(180,90,60), mustard RGB(240,210,0), ketchup RGB(200,40,30).

**98. Apple (3-5 parts)**
Body: Sphere Part (1.5 stud diameter), red with slight green gradient (or solid red). Stem: Tiny brown Cylinder on top (0.1x0.3). Leaf: Small green flat Part at stem base, angled slightly. Highlight: Slightly lighter patch (cosmetic — same Part with color variation in description). Dimples: Top and bottom slight inward (described, not modeled).
Colors: Red RGB(200,40,35), stem brown RGB(90,65,30), leaf green RGB(60,120,40). Or green apple: RGB(120,180,50).

**99. Potion Bottle (5-8 parts)**
Bottle: Cylinder (0.8x1.5 studs), Glass material, Transparency 0.3, colored liquid. Neck: Narrower Cylinder on top (0.4x0.5). Cork: Small Cylinder at top, brown (WoodPlanks). Liquid: Inner Part (slightly smaller, opaque, bright color — Neon for glowing). Label: Tiny SurfaceGui Part. Bubbles: ParticleEmitter with small rising bubbles. PointLight: Matching liquid color, low range (4 studs).
Colors: Glass tinted by liquid — red (health) RGB(200,30,30), blue (mana) RGB(30,80,200), green (poison) RGB(40,180,40), purple (mystery) RGB(140,40,200).

**100. Treasure Chest (10-16 parts)**
Base box: Rectangular (3x2x2 studs), WoodPlanks material, dark wood. Lid: Same width, half-height, with rounded top (WedgePart or Cylinder slice for dome). Hinges: 2 small Metal Parts on back edge. Latch: Metal clasp on front. Metal bands: 3 horizontal Metal strips across front and lid. Lock: Small Metal Part on latch. Interior (if open): Angled lid, gold coins (small yellow sphere/Cylinder Parts spilling out), gems (small colored Neon Parts), crown (golden ring + point Parts). Glow: PointLight inside (warm gold when open).
Colors: Dark wood RGB(90,60,30), metal bands RGB(80,75,65), gold coins RGB(230,200,50), gem colors varied.
`

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// COMBINED ENCYCLOPEDIA EXPORT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const ROBLOX_ENCYCLOPEDIA: string = [
  ENCYCLOPEDIA_INSTANCES,
  ENCYCLOPEDIA_MATERIALS,
  ENCYCLOPEDIA_COLORS,
  ENCYCLOPEDIA_TWEENS,
  ENCYCLOPEDIA_SERVICES,
  ENCYCLOPEDIA_LUAU,
  ENCYCLOPEDIA_RECIPES,
].join('\n\n')

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SECTION SELECTORS — for targeted injection based on task type
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/** Get relevant encyclopedia sections for a build task type */
export function getEncyclopediaForTaskType(taskType: string): string {
  switch (taskType) {
    case 'building':
    case 'prop':
      return [ENCYCLOPEDIA_MATERIALS, ENCYCLOPEDIA_COLORS, ENCYCLOPEDIA_RECIPES].join('\n\n')
    case 'terrain':
      return [ENCYCLOPEDIA_MATERIALS, ENCYCLOPEDIA_COLORS].join('\n\n')
    case 'script':
    case 'economy':
      return [ENCYCLOPEDIA_SERVICES, ENCYCLOPEDIA_LUAU].join('\n\n')
    case 'ui':
      return [ENCYCLOPEDIA_INSTANCES.slice(0, 4000), ENCYCLOPEDIA_TWEENS, ENCYCLOPEDIA_COLORS].join('\n\n')
    case 'lighting':
    case 'audio':
      return ENCYCLOPEDIA_INSTANCES.slice(0, 8000) // lighting/audio section is in first half
    case 'npc':
      return [ENCYCLOPEDIA_SERVICES.slice(0, 4000), ENCYCLOPEDIA_LUAU.slice(0, 4000), ENCYCLOPEDIA_RECIPES.slice(-3000)].join('\n\n')
    default:
      return ENCYCLOPEDIA_MATERIALS + '\n\n' + ENCYCLOPEDIA_COLORS
  }
}

/** Get a trimmed encyclopedia section for the provider's general injection (max ~4000 chars) */
export function getEncyclopediaSummary(userMessage: string): string {
  const lower = userMessage.toLowerCase()

  // Match keywords to relevant sections
  if (['material', 'texture', 'surface', 'brick', 'concrete', 'wood', 'metal', 'neon', 'glass'].some(k => lower.includes(k))) {
    return ENCYCLOPEDIA_MATERIALS.slice(0, 4000)
  }
  if (['color', 'colour', 'palette', 'rgb', 'shade', 'tint', 'theme'].some(k => lower.includes(k))) {
    return ENCYCLOPEDIA_COLORS.slice(0, 4000)
  }
  if (['tween', 'animate', 'animation', 'ease', 'bounce', 'elastic', 'transition'].some(k => lower.includes(k))) {
    return ENCYCLOPEDIA_TWEENS.slice(0, 4000)
  }
  if (['datastore', 'remote', 'service', 'pathfind', 'marketplace', 'badge', 'collection'].some(k => lower.includes(k))) {
    return ENCYCLOPEDIA_SERVICES.slice(0, 4000)
  }
  if (['luau', 'script', 'code', 'function', 'table', 'string', 'math', 'pcall', 'metatab', 'oop', 'class'].some(k => lower.includes(k))) {
    return ENCYCLOPEDIA_LUAU.slice(0, 4000)
  }
  if (['recipe', 'how to build', 'construct', 'house', 'car', 'tree', 'sword', 'table', 'chair', 'bridge', 'castle', 'tower'].some(k => lower.includes(k))) {
    return ENCYCLOPEDIA_RECIPES.slice(0, 4000)
  }
  if (['gui', 'ui', 'screen', 'frame', 'button', 'label', 'scroll', 'layout'].some(k => lower.includes(k))) {
    return ENCYCLOPEDIA_INSTANCES.slice(0, 4000)
  }

  // Default: return materials + colors summary (most universally useful)
  return ENCYCLOPEDIA_MATERIALS.slice(0, 2000) + '\n' + ENCYCLOPEDIA_COLORS.slice(0, 2000)
}
