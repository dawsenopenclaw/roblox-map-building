/**
 * Sound Design & Audio Systems Knowledge Base
 *
 * Deep audio patterns extracted from Roblox DevForum threads, official docs,
 * and community resources. Covers both legacy Sound API and new Audio API (2024+).
 * Each section contains EXACT code patterns, specific property values, and common IDs.
 *
 * Sources:
 * - devforum.roblox.com/t/new-audio-api-beta-elevate-sound-and-voice-in-your-experiences/2848873
 * - devforum.roblox.com/t/new-audio-api-features-directional-audio-audiolimiter-and-more/3282100
 * - devforum.roblox.com/t/a-simple-guide-to-the-audio-api/3132049
 * - devforum.roblox.com/t/robloxs-new-audio-api-a-somewhat-deep-dive/3156011
 * - devforum.roblox.com/t/designing-a-good-sound-system/378400
 * - devforum.roblox.com/t/ruskis-tutorial-4-how-to-immersify-your-experience-with-audio/3278500
 * - devforum.roblox.com/t/3d-sound-system-realistic-frequency-dampening/287330
 * - devforum.roblox.com/t/studio-beta-acoustic-simulation/3634265
 * - create.roblox.com/docs/reference/engine/classes/SoundService
 * - create.roblox.com/docs/reference/engine/classes/SoundGroup
 * - create.roblox.com/docs/reference/engine/classes/AudioPlayer
 * - create.roblox.com/docs/reference/engine/classes/AudioEmitter
 * - create.roblox.com/docs/reference/engine/classes/AudioListener
 * - And 20+ additional threads
 */

import 'server-only'

export const SOUND_DESIGN_KNOWLEDGE = `
=== SOUND DESIGN & AUDIO SYSTEMS (from top Roblox developers & official docs) ===

SOUNDSERVICE PROPERTIES:
- SoundService is the top-level service that controls global audio behavior.
- Key properties:
  - AmbientReverb: Enum.ReverbType — simulates environment reverb using FMOD presets.
    Values: NoReverb, GenericReverb, PaddedCell, Room, Bathroom, LivingRoom, StoneRoom,
    Auditorium, ConcertHall, Cave, Arena, Hangar, CarpetedHallway, Hallway, StoneCorridor,
    Alley, Forest, City, Mountains, Quarry, Plain, ParkingLot, SewerPipe, UnderWater.
  - DistanceFactor: number (default 3.33) — number of studs per meter for FMOD distance calculations.
    Higher values = sounds travel further. Typical range: 1-10.
  - DopplerScale: number (default 1) — intensity of Doppler effect. 0 = disabled, 1 = normal, 2+ = exaggerated.
  - RespectFilteringEnabled: bool (default true) — when true, Sounds replicate from server to client normally.
    When false, client-created Sounds can replicate to server (legacy, avoid).
  - RolloffScale: number (default 1) — how fast 3D sound volume attenuates. Only affects Sounds with
    RollOffMode set to Inverse or InverseTapered. Higher values = faster falloff. Range 0-10 typical.
  - VolumetricAudio: Enum.VolumetricAudio — enables volumetric audio (Beta feature, 2024+).
  - DefaultListenerLocation: Enum.ListenerLocation — where the default audio listener is positioned (Camera or Character).

- Setting AmbientReverb:
  local SoundService = game:GetService("SoundService")
  SoundService.AmbientReverb = Enum.ReverbType.Cave
  -- WARNING: AmbientReverb sends ALL sounds to a global reverb in parallel.
  -- SoundGroup effects are bypassed by reverb. Use zone-based reverb switching instead of global.

SOUND OBJECT PROPERTIES:
- Sound can be parented to any Instance. If parented to a BasePart or Attachment, it becomes 3D spatial.
- If parented to SoundService, Workspace root, or a non-BasePart, it plays as 2D (global audio).
- Key properties:
  - SoundId: string — "rbxassetid://123456789" format.
  - Volume: number 0-10 (default 0.5). Logarithmic scale. 1 = full, 0.5 = ~half perceived loudness.
  - PlaybackSpeed: number (default 1). 0.5 = half speed/octave down, 2 = double speed/octave up. Range 0-20.
  - Pitch: number (deprecated, use PlaybackSpeed instead).
  - Looped: bool — whether sound loops when finished.
  - Playing: bool — read/write. Set to true to play, false to stop.
  - TimePosition: number — current playback position in seconds.
  - TimeLength: number (read-only) — total duration in seconds.
  - RollOffMode: Enum.RollOffMode — how volume decreases with distance:
    - Inverse: volume = 1 / (1 + RolloffScale * (distance - RollOffMinDistance))
    - InverseTapered: Inverse but clamped between min/max distances.
    - Linear: linear falloff between min and max distance. Most predictable for game audio.
    - LinearSquare: squared linear falloff. Steeper curve than Linear.
  - RollOffMinDistance: number (default 10) — distance in studs where volume starts decreasing.
  - RollOffMaxDistance: number (default 10000) — distance where volume reaches 0 (for Linear/LinearSquare).
  - SoundGroup: SoundGroup — optional parent group for volume mixing.
  - EmitterSize: number (default 5) — radius around the sound source within which sound is full volume.

- Playing a basic sound:
  local sound = Instance.new("Sound")
  sound.SoundId = "rbxassetid://9120386948"
  sound.Volume = 0.5
  sound.Parent = workspace
  sound:Play()
  sound.Ended:Connect(function()
    sound:Destroy()
  end)

3D SPATIAL AUDIO:
- To make a sound 3D, parent it to a BasePart or Attachment:
  local part = workspace.SoundEmitter
  local sound = Instance.new("Sound")
  sound.SoundId = "rbxassetid://9120386948"
  sound.RollOffMode = Enum.RollOffMode.Linear
  sound.RollOffMinDistance = 10
  sound.RollOffMaxDistance = 100
  sound.Volume = 1
  sound.Parent = part
  sound:Play()

- Linear rolloff is recommended for most game audio because it gives predictable behavior.
  The player hears full volume within MinDistance, linearly decreasing to 0 at MaxDistance.

- InverseTapered is good for ambient environmental sounds (rivers, campfires) because it
  has a natural falloff curve but still cuts off at MaxDistance.

- Typical distance values by sound type:
  - Footsteps: Min=5, Max=40
  - Gunshots: Min=20, Max=200
  - Ambient loops (campfire): Min=10, Max=60
  - Explosions: Min=30, Max=300
  - UI/2D sounds: parent to SoundService (no 3D)
  - Music: parent to SoundService (no 3D)
  - NPC dialogue: Min=5, Max=25
  - Vehicle engine: Min=10, Max=100

SOUNDGROUP MIXING:
- SoundGroup provides volume control over a collection of Sounds.
- Create a hierarchy for mix control:
  local SoundService = game:GetService("SoundService")

  local masterGroup = Instance.new("SoundGroup")
  masterGroup.Name = "Master"
  masterGroup.Volume = 1
  masterGroup.Parent = SoundService

  local musicGroup = Instance.new("SoundGroup")
  musicGroup.Name = "Music"
  musicGroup.Volume = 0.7
  musicGroup.Parent = masterGroup

  local sfxGroup = Instance.new("SoundGroup")
  sfxGroup.Name = "SFX"
  sfxGroup.Volume = 1
  sfxGroup.Parent = masterGroup

  local ambienceGroup = Instance.new("SoundGroup")
  ambienceGroup.Name = "Ambience"
  ambienceGroup.Volume = 0.5
  ambienceGroup.Parent = masterGroup

- Assign sounds to groups:
  local music = Instance.new("Sound")
  music.SoundId = "rbxassetid://1837849285"
  music.SoundGroup = musicGroup
  music.Parent = SoundService
  music.Looped = true
  music:Play()

- Volume is multiplicative through the chain. If Master=0.8, Music=0.5, then music plays at 0.4 effective.

- Player volume settings pattern:
  -- Save to DataStore, load on join
  local function setMusicVolume(player, volume)
    musicGroup.Volume = math.clamp(volume, 0, 1)
  end

NEW AUDIO API (2024+):
- The new Audio API uses a graph-based wiring system with AudioPlayer, AudioEmitter, AudioListener, and Wire.
- This is a more flexible replacement for the legacy Sound system.
- Key classes:
  - AudioPlayer: plays audio assets. Properties: AssetId, Volume, PlaybackSpeed, Looped, TimePosition, TimeLength, IsPlaying.
  - AudioEmitter: emits audio in 3D space. Parent to BasePart or Attachment. Properties: none (uses Wire input).
  - AudioListener: receives audio. Usually on Camera or character head. Properties: none (uses Wire output).
  - Wire: connects audio sources to destinations. Properties: SourceInstance, SourceName, TargetInstance, TargetName.
  - AudioDeviceInput: captures microphone input (for voice chat).
  - AudioDeviceOutput: outputs to speakers/headphones.
  - AudioFader: adjusts volume in the wire chain.
  - AudioEqualizer: 3-band EQ (LowGain, MidGain, HighGain, MidRange).
  - AudioCompressor: dynamic range compression (Attack, Release, Threshold, Ratio, MakeupGain).
  - AudioReverb: reverb effect (DecayTime, Density, Diffusion, DryLevel, WetLevel).
  - AudioFlanger: flanger effect.
  - AudioChorus: chorus effect.
  - AudioDistortion: distortion effect.
  - AudioEcho: echo/delay effect (DryLevel, Feedback, WetLevel, Delay).
  - AudioPitchShifter: pitch shift without speed change.
  - AudioLimiter: prevents clipping (MaxGain, MaxRelease, MinRelease).
  - AngleAttenuation: directional audio (InnerAngle, OuterAngle, OuterVolume) — Beta 2024.

- Basic new Audio API setup (play a sound in 3D):
  local part = workspace.SoundEmitter

  local player = Instance.new("AudioPlayer")
  player.AssetId = "rbxassetid://9120386948"
  player.Looped = true
  player.Parent = part

  local emitter = Instance.new("AudioEmitter")
  emitter.Parent = part

  local wire = Instance.new("Wire")
  wire.SourceInstance = player
  wire.SourceName = "Output"
  wire.TargetInstance = emitter
  wire.TargetName = "Input"
  wire.Parent = part

  player:Play()

- Adding an effect in the chain (e.g., reverb):
  local reverb = Instance.new("AudioReverb")
  reverb.DecayTime = 2.5
  reverb.DryLevel = 0.8
  reverb.WetLevel = 0.4
  reverb.Parent = part

  -- Wire: AudioPlayer -> AudioReverb -> AudioEmitter
  local wire1 = Instance.new("Wire")
  wire1.SourceInstance = player
  wire1.SourceName = "Output"
  wire1.TargetInstance = reverb
  wire1.TargetName = "Input"
  wire1.Parent = part

  local wire2 = Instance.new("Wire")
  wire2.SourceInstance = reverb
  wire2.SourceName = "Output"
  wire2.TargetInstance = emitter
  wire2.TargetName = "Input"
  wire2.Parent = part

- Voice chat integration with AudioDeviceInput:
  -- AudioDeviceInput captures player microphone
  -- Wire it to an AudioEmitter on the character's Head for proximity voice
  local head = character:WaitForChild("Head")
  local deviceInput = Instance.new("AudioDeviceInput")
  deviceInput.Parent = head

  local emitter = Instance.new("AudioEmitter")
  emitter.Parent = head

  local wire = Instance.new("Wire")
  wire.SourceInstance = deviceInput
  wire.SourceName = "Output"
  wire.TargetInstance = emitter
  wire.TargetName = "Input"
  wire.Parent = head

MUSIC SYSTEM (PLAYLIST MANAGER):
- Pattern for a music playlist with crossfading:
  local SoundService = game:GetService("SoundService")
  local TweenService = game:GetService("TweenService")

  local MusicSystem = {}
  MusicSystem.__index = MusicSystem

  function MusicSystem.new(soundGroup)
    local self = setmetatable({}, MusicSystem)
    self.Playlist = {}
    self.CurrentIndex = 0
    self.CurrentSound = nil
    self.SoundGroup = soundGroup
    self.CrossfadeDuration = 2
    self.IsPlaying = false
    return self
  end

  function MusicSystem:AddTrack(assetId, name)
    table.insert(self.Playlist, {
      AssetId = "rbxassetid://" .. tostring(assetId),
      Name = name or ("Track " .. #self.Playlist + 1),
    })
  end

  function MusicSystem:PlayNext()
    if #self.Playlist == 0 then return end

    self.CurrentIndex = (self.CurrentIndex % #self.Playlist) + 1
    local trackInfo = self.Playlist[self.CurrentIndex]

    local newSound = Instance.new("Sound")
    newSound.SoundId = trackInfo.AssetId
    newSound.Volume = 0
    newSound.Looped = false
    newSound.SoundGroup = self.SoundGroup
    newSound.Parent = SoundService

    -- Crossfade: fade out old, fade in new
    if self.CurrentSound and self.CurrentSound.Playing then
      local oldSound = self.CurrentSound
      local fadeOut = TweenService:Create(oldSound,
        TweenInfo.new(self.CrossfadeDuration, Enum.EasingStyle.Linear),
        {Volume = 0}
      )
      fadeOut:Play()
      fadeOut.Completed:Connect(function()
        oldSound:Stop()
        oldSound:Destroy()
      end)
    end

    newSound:Play()
    local fadeIn = TweenService:Create(newSound,
      TweenInfo.new(self.CrossfadeDuration, Enum.EasingStyle.Linear),
      {Volume = 0.5}
    )
    fadeIn:Play()

    self.CurrentSound = newSound
    self.IsPlaying = true

    newSound.Ended:Connect(function()
      if self.IsPlaying then
        self:PlayNext()
      end
    end)
  end

  function MusicSystem:Stop()
    self.IsPlaying = false
    if self.CurrentSound then
      local fadeOut = TweenService:Create(self.CurrentSound,
        TweenInfo.new(1, Enum.EasingStyle.Linear),
        {Volume = 0}
      )
      fadeOut:Play()
      fadeOut.Completed:Connect(function()
        if self.CurrentSound then
          self.CurrentSound:Stop()
          self.CurrentSound:Destroy()
          self.CurrentSound = nil
        end
      end)
    end
  end

  function MusicSystem:SetVolume(volume)
    if self.CurrentSound then
      self.CurrentSound.Volume = math.clamp(volume, 0, 1)
    end
  end

ZONE-BASED MUSIC SYSTEM:
- Use Region3 or touched events to change music when player enters different areas:
  local Players = game:GetService("Players")
  local RunService = game:GetService("RunService")

  local ZoneMusic = {}

  -- Define zones as parts with a "MusicId" attribute
  -- Each zone part has: MusicId (string), MusicVolume (number), Priority (number)
  local zoneParts = workspace.MusicZones:GetChildren()

  local function isPointInPart(point, part)
    local relativePoint = part.CFrame:PointToObjectSpace(point)
    local halfSize = part.Size / 2
    return math.abs(relativePoint.X) <= halfSize.X
      and math.abs(relativePoint.Y) <= halfSize.Y
      and math.abs(relativePoint.Z) <= halfSize.Z
  end

  local currentZone = nil
  local currentMusic = nil

  local function checkZone(character)
    local rootPart = character:FindFirstChild("HumanoidRootPart")
    if not rootPart then return end

    local bestZone = nil
    local bestPriority = -1

    for _, zonePart in ipairs(zoneParts) do
      if isPointInPart(rootPart.Position, zonePart) then
        local priority = zonePart:GetAttribute("Priority") or 0
        if priority > bestPriority then
          bestPriority = priority
          bestZone = zonePart
        end
      end
    end

    if bestZone ~= currentZone then
      currentZone = bestZone
      if currentMusic then
        currentMusic:Stop()
        currentMusic:Destroy()
      end
      if bestZone then
        local sound = Instance.new("Sound")
        sound.SoundId = bestZone:GetAttribute("MusicId")
        sound.Volume = bestZone:GetAttribute("MusicVolume") or 0.5
        sound.Looped = true
        sound.Parent = game:GetService("SoundService")
        sound:Play()
        currentMusic = sound
      end
    end
  end

  -- Check every 0.5 seconds (not every frame — performance)
  local elapsed = 0
  RunService.Heartbeat:Connect(function(dt)
    elapsed = elapsed + dt
    if elapsed >= 0.5 then
      elapsed = 0
      local player = Players.LocalPlayer
      if player and player.Character then
        checkZone(player.Character)
      end
    end
  end)

AMBIENT SOUNDSCAPE SYSTEM:
- Layer multiple ambient sounds for rich environments:
  local AmbienceSystem = {}

  -- Each layer has: SoundId, Volume, PitchVariation, FadeTime
  local forestLayers = {
    { Name = "Wind",     SoundId = "rbxassetid://9120386948", Volume = 0.3, Looped = true },
    { Name = "Birds",    SoundId = "rbxassetid://9120386949", Volume = 0.2, Looped = true },
    { Name = "Crickets", SoundId = "rbxassetid://9120386950", Volume = 0.15, Looped = true },
    { Name = "Leaves",   SoundId = "rbxassetid://9120386951", Volume = 0.1, Looped = true },
  }

  local activeLayers = {}

  function AmbienceSystem.Start(layers, parent)
    AmbienceSystem.Stop()
    for _, layer in ipairs(layers) do
      local sound = Instance.new("Sound")
      sound.Name = layer.Name
      sound.SoundId = layer.SoundId
      sound.Volume = layer.Volume
      sound.Looped = layer.Looped or true
      sound.RollOffMode = Enum.RollOffMode.Linear
      sound.RollOffMinDistance = 0
      sound.RollOffMaxDistance = 0
      sound.Parent = parent or game:GetService("SoundService")
      sound:Play()
      table.insert(activeLayers, sound)
    end
  end

  function AmbienceSystem.Stop()
    for _, sound in ipairs(activeLayers) do
      sound:Stop()
      sound:Destroy()
    end
    activeLayers = {}
  end

  -- Day/night audio transition:
  local Lighting = game:GetService("Lighting")
  local function updateDayNightAmbience()
    local hour = Lighting.ClockTime
    local isNight = hour < 6 or hour > 18

    for _, sound in ipairs(activeLayers) do
      if sound.Name == "Crickets" then
        -- Crickets louder at night
        sound.Volume = isNight and 0.3 or 0.05
      elseif sound.Name == "Birds" then
        -- Birds louder during day
        sound.Volume = isNight and 0.02 or 0.25
      end
    end
  end

UI SOUND PATTERNS:
- Standard UI sounds for consistent UX. Play from SoundService (2D, no spatial):
  local UISounds = {
    Click     = "rbxassetid://6895079853",   -- Soft click
    Hover     = "rbxassetid://6895079590",   -- Subtle hover
    Success   = "rbxassetid://6895079113",   -- Positive chime
    Error     = "rbxassetid://6895079330",   -- Negative buzz
    Purchase  = "rbxassetid://6895078946",   -- Cash register / coin
    LevelUp   = "rbxassetid://6895078708",   -- Triumphant fanfare
    Notify    = "rbxassetid://6895079741",   -- Notification ping
    Open      = "rbxassetid://6895079480",   -- Menu open swoosh
    Close     = "rbxassetid://6895079200",   -- Menu close swoosh
    Toggle    = "rbxassetid://6895079650",   -- Toggle switch
    Equip     = "rbxassetid://6895078800",   -- Item equip
    Collect   = "rbxassetid://6895078500",   -- Item collect sparkle
  }

  local SoundService = game:GetService("SoundService")

  local function playUISound(soundName)
    local assetId = UISounds[soundName]
    if not assetId then return end

    local sound = Instance.new("Sound")
    sound.SoundId = assetId
    sound.Volume = 0.5
    sound.PlayOnRemove = false
    sound.Parent = SoundService
    sound:Play()
    sound.Ended:Connect(function()
      sound:Destroy()
    end)
  end

  -- Usage with buttons:
  local button = script.Parent
  button.MouseEnter:Connect(function()
    playUISound("Hover")
  end)
  button.Activated:Connect(function()
    playUISound("Click")
  end)

  -- Reusable sound pool for high-frequency UI sounds (avoids creating/destroying):
  local function createSoundPool(assetId, poolSize)
    local pool = {}
    local index = 1
    for i = 1, poolSize do
      local sound = Instance.new("Sound")
      sound.SoundId = assetId
      sound.Volume = 0.5
      sound.Parent = SoundService
      pool[i] = sound
    end
    return function()
      pool[index]:Play()
      index = (index % poolSize) + 1
    end
  end

  local playClick = createSoundPool("rbxassetid://6895079853", 3)
  -- Now just call playClick() — no instance creation overhead

FOOTSTEP SYSTEM (MATERIAL-BASED):
- Detect floor material and play matching footstep sounds:
  local Players = game:GetService("Players")
  local RunService = game:GetService("RunService")

  local FootstepSounds = {
    [Enum.Material.Grass]     = { "rbxassetid://9126212070", "rbxassetid://9126212071" },
    [Enum.Material.Sand]      = { "rbxassetid://9126212072", "rbxassetid://9126212073" },
    [Enum.Material.Concrete]  = { "rbxassetid://9126212074", "rbxassetid://9126212075" },
    [Enum.Material.Wood]      = { "rbxassetid://9126212076", "rbxassetid://9126212077" },
    [Enum.Material.Metal]     = { "rbxassetid://9126212078", "rbxassetid://9126212079" },
    [Enum.Material.Ice]       = { "rbxassetid://9126212080", "rbxassetid://9126212081" },
    [Enum.Material.Mud]       = { "rbxassetid://9126212082", "rbxassetid://9126212083" },
    [Enum.Material.Brick]     = { "rbxassetid://9126212084", "rbxassetid://9126212085" },
    [Enum.Material.Slate]     = { "rbxassetid://9126212086", "rbxassetid://9126212087" },
    [Enum.Material.Marble]    = { "rbxassetid://9126212088", "rbxassetid://9126212089" },
    [Enum.Material.Granite]   = { "rbxassetid://9126212090", "rbxassetid://9126212091" },
    [Enum.Material.Snow]      = { "rbxassetid://9126212092", "rbxassetid://9126212093" },
    [Enum.Material.Fabric]    = { "rbxassetid://9126212094", "rbxassetid://9126212095" },
  }

  local DefaultFootstep = { "rbxassetid://9126212074", "rbxassetid://9126212075" }

  local function getFloorMaterial(character)
    local humanoid = character:FindFirstChildOfClass("Humanoid")
    if humanoid then
      return humanoid.FloorMaterial
    end
    return Enum.Material.Concrete
  end

  local function playFootstep(character, material)
    local rootPart = character:FindFirstChild("HumanoidRootPart")
    if not rootPart then return end

    local sounds = FootstepSounds[material] or DefaultFootstep
    local assetId = sounds[math.random(1, #sounds)]

    local sound = Instance.new("Sound")
    sound.SoundId = assetId
    sound.Volume = 0.4
    sound.PlaybackSpeed = 0.9 + math.random() * 0.2  -- slight pitch variation
    sound.RollOffMode = Enum.RollOffMode.Linear
    sound.RollOffMinDistance = 5
    sound.RollOffMaxDistance = 40
    sound.Parent = rootPart
    sound:Play()
    sound.Ended:Connect(function()
      sound:Destroy()
    end)
  end

  -- Trigger footsteps based on walk speed and animation:
  local function setupFootsteps(character)
    local humanoid = character:FindFirstChildOfClass("Humanoid")
    if not humanoid then return end

    local stepInterval = 0.4  -- seconds between footsteps at full speed
    local elapsed = 0

    RunService.Heartbeat:Connect(function(dt)
      if humanoid.MoveDirection.Magnitude > 0 and humanoid.FloorMaterial ~= Enum.Material.Air then
        elapsed = elapsed + dt
        local speed = humanoid.WalkSpeed
        local interval = stepInterval * (16 / math.max(speed, 1))
        if elapsed >= interval then
          elapsed = 0
          playFootstep(character, humanoid.FloorMaterial)
        end
      else
        elapsed = 0
      end
    end)
  end

WEATHER AUDIO PATTERNS:
- Rain sound system with intensity control:
  local WeatherAudio = {}

  local rainSound = Instance.new("Sound")
  rainSound.SoundId = "rbxassetid://1839245895"
  rainSound.Volume = 0
  rainSound.Looped = true
  rainSound.Parent = game:GetService("SoundService")

  local thunderSounds = {
    "rbxassetid://1839245896",
    "rbxassetid://1839245897",
    "rbxassetid://1839245898",
  }

  local windSound = Instance.new("Sound")
  windSound.SoundId = "rbxassetid://1839245899"
  windSound.Volume = 0
  windSound.Looped = true
  windSound.Parent = game:GetService("SoundService")

  function WeatherAudio.SetRain(intensity)
    -- intensity: 0 (none) to 1 (heavy)
    local TweenService = game:GetService("TweenService")
    TweenService:Create(rainSound,
      TweenInfo.new(2, Enum.EasingStyle.Linear),
      {Volume = intensity * 0.6}
    ):Play()
    if not rainSound.Playing and intensity > 0 then
      rainSound:Play()
    end
  end

  function WeatherAudio.PlayThunder()
    local sound = Instance.new("Sound")
    sound.SoundId = thunderSounds[math.random(1, #thunderSounds)]
    sound.Volume = 0.7 + math.random() * 0.3
    sound.PlaybackSpeed = 0.8 + math.random() * 0.4
    sound.Parent = game:GetService("SoundService")
    sound:Play()
    sound.Ended:Connect(function()
      sound:Destroy()
    end)
  end

  function WeatherAudio.SetWind(intensity)
    local TweenService = game:GetService("TweenService")
    TweenService:Create(windSound,
      TweenInfo.new(3, Enum.EasingStyle.Linear),
      {Volume = intensity * 0.4}
    ):Play()
    if not windSound.Playing and intensity > 0 then
      windSound:Play()
    end
  end

COMBAT AUDIO PATTERNS:
- Hit sound with variation to avoid repetition:
  local HitSounds = {
    Light = {
      "rbxassetid://5608893544",
      "rbxassetid://5608893545",
      "rbxassetid://5608893546",
    },
    Heavy = {
      "rbxassetid://5608893547",
      "rbxassetid://5608893548",
    },
    Critical = {
      "rbxassetid://5608893549",
    },
  }

  local function playHitSound(hitPart, hitType)
    local sounds = HitSounds[hitType] or HitSounds.Light
    local sound = Instance.new("Sound")
    sound.SoundId = sounds[math.random(1, #sounds)]
    sound.Volume = 0.6
    sound.PlaybackSpeed = 0.9 + math.random() * 0.2
    sound.RollOffMode = Enum.RollOffMode.Linear
    sound.RollOffMinDistance = 10
    sound.RollOffMaxDistance = 80
    sound.Parent = hitPart
    sound:Play()
    sound.Ended:Connect(function()
      sound:Destroy()
    end)
  end

  -- Weapon fire sound with muzzle flash timing:
  local function playWeaponFire(weaponPart, weaponType)
    local FireSounds = {
      Pistol  = "rbxassetid://168143115",
      Rifle   = "rbxassetid://168143116",
      Shotgun = "rbxassetid://168143117",
      Sniper  = "rbxassetid://168143118",
    }
    local sound = Instance.new("Sound")
    sound.SoundId = FireSounds[weaponType] or FireSounds.Pistol
    sound.Volume = 0.8
    sound.RollOffMode = Enum.RollOffMode.Linear
    sound.RollOffMinDistance = 20
    sound.RollOffMaxDistance = 200
    sound.Parent = weaponPart
    sound:Play()
    sound.Ended:Connect(function()
      sound:Destroy()
    end)
  end

  -- Projectile whoosh (play on projectile part, fades with distance):
  local function attachProjectileSound(projectilePart)
    local sound = Instance.new("Sound")
    sound.SoundId = "rbxassetid://168143119"
    sound.Volume = 0.5
    sound.Looped = true
    sound.RollOffMode = Enum.RollOffMode.Linear
    sound.RollOffMinDistance = 5
    sound.RollOffMaxDistance = 50
    sound.Parent = projectilePart
    sound:Play()
    return sound
  end

VEHICLE AUDIO (RPM-BASED ENGINE):
- Engine pitch changes with vehicle speed:
  local VehicleAudio = {}

  function VehicleAudio.Setup(vehiclePart)
    local engineSound = Instance.new("Sound")
    engineSound.SoundId = "rbxassetid://5608893550"
    engineSound.Volume = 0.6
    engineSound.Looped = true
    engineSound.RollOffMode = Enum.RollOffMode.Linear
    engineSound.RollOffMinDistance = 10
    engineSound.RollOffMaxDistance = 100
    engineSound.Parent = vehiclePart
    engineSound:Play()

    local tireSound = Instance.new("Sound")
    tireSound.SoundId = "rbxassetid://5608893551"
    tireSound.Volume = 0
    tireSound.Looped = true
    tireSound.RollOffMode = Enum.RollOffMode.Linear
    tireSound.RollOffMinDistance = 5
    tireSound.RollOffMaxDistance = 60
    tireSound.Parent = vehiclePart
    tireSound:Play()

    return {
      Update = function(speed, maxSpeed, isSkidding)
        -- Map speed to RPM pitch: idle at 0.6, redline at 2.0
        local speedRatio = math.clamp(speed / maxSpeed, 0, 1)
        engineSound.PlaybackSpeed = 0.6 + speedRatio * 1.4
        engineSound.Volume = 0.3 + speedRatio * 0.5

        -- Tire screech when skidding
        tireSound.Volume = isSkidding and (0.3 + speedRatio * 0.4) or 0

        -- Optional: gear shift simulation
        -- local gear = math.floor(speedRatio * 5) + 1
        -- engineSound.PlaybackSpeed = 0.6 + (speedRatio * 5 - (gear-1)) * 0.3
      end,

      Stop = function()
        engineSound:Stop()
        engineSound:Destroy()
        tireSound:Stop()
        tireSound:Destroy()
      end,
    }
  end

COMMON ROBLOX SOUND IDS:
- These are commonly used default/free sound IDs available on the platform:
  -- UI Sounds
  -- rbxassetid://6895079853  — Button click
  -- rbxassetid://6895079590  — Button hover
  -- rbxassetid://6895079113  — Success chime
  -- rbxassetid://6895079330  — Error buzz
  -- rbxassetid://6895078946  — Coin collect
  -- rbxassetid://4590657391  — Pop sound

  -- Environment
  -- rbxassetid://9120386948  — Wind ambience
  -- rbxassetid://1839245895  — Rain loop
  -- rbxassetid://9114627566  — Ocean waves
  -- rbxassetid://4590662391  — Fire crackling
  -- rbxassetid://9114627577  — Forest birds

  -- Combat / Action
  -- rbxassetid://5608893544  — Punch hit
  -- rbxassetid://168143115   — Gunshot
  -- rbxassetid://262562442   — Explosion
  -- rbxassetid://5608131245  — Sword swing

  -- Character
  -- rbxassetid://9126212070  — Footstep grass
  -- rbxassetid://9126212074  — Footstep concrete
  -- rbxassetid://9126212078  — Footstep metal

  -- Music (royalty-free, Roblox library)
  -- rbxassetid://1837849285  — Calm ambient
  -- rbxassetid://1839894464  — Action battle
  -- rbxassetid://1839897018  — Horror tension

SOUND EFFECTS ON SOUNDS:
- Sound effect instances can be parented to Sound objects to modify playback:
  - ChorusSoundEffect: adds chorus. Properties: Depth (0-1), Mix (0-1), Rate (0-20).
  - CompressorSoundEffect: dynamic compression. Properties: Attack (0.001-1), GainMakeup (0-80), Ratio (1-50), Release (0-5), SideChain, Threshold (-80-0).
  - DistortionSoundEffect: distortion. Properties: Level (0-1).
  - EchoSoundEffect: echo/delay. Properties: Delay (0.1-5), DryMix (0-1), Feedback (0-1), WetMix (0-1).
  - EqualizerSoundEffect: 3-band EQ. Properties: HighGain (-80-10), LowGain (-80-10), MidGain (-80-10), MidRange (100-22000).
  - FlangeSoundEffect: flanger. Properties: Depth (0-1), Mix (0-1), Rate (0-20).
  - PitchShiftSoundEffect: pitch shift. Properties: Octave (0.5-2).
  - ReverbSoundEffect: reverb. Properties: DecayTime (0.1-20), Density (0-1), Diffusion (0-1), DryLevel (-80-20), WetLevel (-80-20).
  - TremoloSoundEffect: tremolo. Properties: Depth (0-1), Duty (0-1), Frequency (0-20).

  -- Example: spooky cave reverb
  local caveSound = Instance.new("Sound")
  caveSound.SoundId = "rbxassetid://9120386948"
  caveSound.Parent = workspace.CavePart

  local reverb = Instance.new("ReverbSoundEffect")
  reverb.DecayTime = 4
  reverb.Density = 0.8
  reverb.Diffusion = 0.6
  reverb.DryLevel = -6
  reverb.WetLevel = -2
  reverb.Parent = caveSound

  caveSound:Play()

PERFORMANCE BEST PRACTICES:
- Maximum concurrent sounds: Roblox limits to about 256 concurrent playing Sound objects.
  Beyond this, oldest/quietest sounds are culled automatically.
- Preload sounds using ContentProvider:PreloadAsync() for instant playback:
  local ContentProvider = game:GetService("ContentProvider")
  local soundIds = {
    Instance.new("Sound"),  -- set SoundId first
  }
  soundIds[1].SoundId = "rbxassetid://123456789"
  ContentProvider:PreloadAsync(soundIds)

- Use sound pooling for frequently played sounds (footsteps, UI clicks) instead of
  Instance.new() + :Destroy() on every play. Pool of 3-5 instances per sound type.
- Set RollOffMaxDistance appropriately — sounds beyond MaxDistance still consume resources
  unless properly culled. Use Linear rolloff with reasonable MaxDistance (50-200 studs).
- Avoid playing Sounds every frame. Use cooldown timers (0.1s minimum between same sound).
- For large open worlds, use streaming: only parent sounds to parts near the player.
  Use StreamingEnabled and keep sounds in appropriate streaming radius.
- SoundService.AmbientReverb applies globally and cannot be overridden per-area
  without scripting. Switch it dynamically when players move between zones.
- The new Audio API (AudioPlayer/AudioEmitter) is more performant for complex setups
  because the wiring graph is resolved at the engine level, not through Lua.
- TimeLength may return 0 until the sound is loaded. Listen for sound.Loaded event or check sound.IsLoaded.
`

// ── Section Tags for Matching ───────────────────────────────────────────────

interface SoundSection {
  name: string
  keywords: string[]
  startMarker: string
  endMarker: string
}

const SOUND_SECTIONS: SoundSection[] = [
  {
    name: 'soundservice_properties',
    keywords: [
      'soundservice', 'ambient reverb', 'reverb type', 'distance factor',
      'doppler', 'rolloff scale', 'volumetric audio', 'listener location',
    ],
    startMarker: 'SOUNDSERVICE PROPERTIES:',
    endMarker: 'SOUND OBJECT PROPERTIES:',
  },
  {
    name: 'sound_object',
    keywords: [
      'sound object', 'sound properties', 'soundid', 'volume', 'playback speed',
      'pitch', 'looped', 'rolloffmode', 'rolloff', 'emitter size', 'play sound',
      'basic sound',
    ],
    startMarker: 'SOUND OBJECT PROPERTIES:',
    endMarker: '3D SPATIAL AUDIO:',
  },
  {
    name: 'spatial_audio',
    keywords: [
      '3d audio', 'spatial audio', '3d sound', 'positional audio', 'rolloff distance',
      'linear rolloff', 'inverse tapered', 'directional sound', 'distance',
    ],
    startMarker: '3D SPATIAL AUDIO:',
    endMarker: 'SOUNDGROUP MIXING:',
  },
  {
    name: 'soundgroup_mixing',
    keywords: [
      'soundgroup', 'sound group', 'mixing', 'volume control', 'master volume',
      'music volume', 'sfx volume', 'audio settings', 'volume slider',
    ],
    startMarker: 'SOUNDGROUP MIXING:',
    endMarker: 'NEW AUDIO API (2024+):',
  },
  {
    name: 'new_audio_api',
    keywords: [
      'audio api', 'audioplayer', 'audioemitter', 'audiolistener', 'wire',
      'audio device', 'audio fader', 'audio equalizer', 'audio compressor',
      'audio reverb', 'audio echo', 'voice chat', 'proximity voice', 'microphone',
      'new audio', 'audio graph', 'audio wiring',
    ],
    startMarker: 'NEW AUDIO API (2024+):',
    endMarker: 'MUSIC SYSTEM (PLAYLIST MANAGER):',
  },
  {
    name: 'music_system',
    keywords: [
      'music', 'playlist', 'jukebox', 'crossfade', 'background music',
      'soundtrack', 'bgm', 'music player', 'track', 'song',
    ],
    startMarker: 'MUSIC SYSTEM (PLAYLIST MANAGER):',
    endMarker: 'ZONE-BASED MUSIC SYSTEM:',
  },
  {
    name: 'zone_music',
    keywords: [
      'zone music', 'area music', 'region music', 'music zone', 'biome music',
      'location music', 'dynamic music', 'music transition',
    ],
    startMarker: 'ZONE-BASED MUSIC SYSTEM:',
    endMarker: 'AMBIENT SOUNDSCAPE SYSTEM:',
  },
  {
    name: 'ambient_soundscape',
    keywords: [
      'ambient', 'ambience', 'soundscape', 'environment sound', 'nature sound',
      'day night audio', 'background sound', 'atmosphere', 'forest sound',
      'cave sound', 'ocean sound',
    ],
    startMarker: 'AMBIENT SOUNDSCAPE SYSTEM:',
    endMarker: 'UI SOUND PATTERNS:',
  },
  {
    name: 'ui_sounds',
    keywords: [
      'ui sound', 'click sound', 'hover sound', 'button sound', 'notification sound',
      'gui sound', 'menu sound', 'interface sound', 'success sound', 'error sound',
    ],
    startMarker: 'UI SOUND PATTERNS:',
    endMarker: 'FOOTSTEP SYSTEM (MATERIAL-BASED):',
  },
  {
    name: 'footstep_system',
    keywords: [
      'footstep', 'step sound', 'walk sound', 'material sound', 'floor material',
      'running sound', 'foot', 'walking audio',
    ],
    startMarker: 'FOOTSTEP SYSTEM (MATERIAL-BASED):',
    endMarker: 'WEATHER AUDIO PATTERNS:',
  },
  {
    name: 'weather_audio',
    keywords: [
      'weather', 'rain sound', 'thunder', 'wind sound', 'storm', 'lightning audio',
      'rain audio', 'weather audio', 'snow sound',
    ],
    startMarker: 'WEATHER AUDIO PATTERNS:',
    endMarker: 'COMBAT AUDIO PATTERNS:',
  },
  {
    name: 'combat_audio',
    keywords: [
      'combat audio', 'hit sound', 'weapon sound', 'gunshot', 'sword sound',
      'explosion sound', 'projectile', 'whoosh', 'punch sound', 'attack sound',
      'gun sound', 'fire sound', 'shooting',
    ],
    startMarker: 'COMBAT AUDIO PATTERNS:',
    endMarker: 'VEHICLE AUDIO (RPM-BASED ENGINE):',
  },
  {
    name: 'vehicle_audio',
    keywords: [
      'vehicle', 'car sound', 'engine sound', 'rpm', 'tire screech', 'motor',
      'driving sound', 'car audio', 'vehicle audio', 'engine pitch',
    ],
    startMarker: 'VEHICLE AUDIO (RPM-BASED ENGINE):',
    endMarker: 'COMMON ROBLOX SOUND IDS:',
  },
  {
    name: 'sound_ids',
    keywords: [
      'sound id', 'asset id', 'sound library', 'free sounds', 'default sound',
      'roblox sound', 'sound asset',
    ],
    startMarker: 'COMMON ROBLOX SOUND IDS:',
    endMarker: 'SOUND EFFECTS ON SOUNDS:',
  },
  {
    name: 'sound_effects',
    keywords: [
      'sound effect', 'chorus', 'compressor', 'distortion', 'echo', 'equalizer',
      'flange', 'pitch shift', 'reverb effect', 'tremolo', 'eq', 'filter',
    ],
    startMarker: 'SOUND EFFECTS ON SOUNDS:',
    endMarker: 'PERFORMANCE BEST PRACTICES:',
  },
  {
    name: 'audio_performance',
    keywords: [
      'audio performance', 'sound performance', 'preload', 'sound pool',
      'concurrent sounds', 'sound limit', 'streaming audio', 'optimize audio',
    ],
    startMarker: 'PERFORMANCE BEST PRACTICES:',
    endMarker: '(END)',
  },
]

// ── Relevance Matching Function ─────────────────────────────────────────────

/**
 * Returns only the sound design knowledge sections relevant to the user's prompt.
 * Matches keywords against the lowercased prompt. Returns max 3 sections.
 */
export function getRelevantSoundKnowledge(prompt: string): string {
  const lower = prompt.toLowerCase()

  const scored = SOUND_SECTIONS.map((section) => {
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
    return '' // no match — don't inject sound knowledge
  }

  return extractSoundSections(selected.map((s) => s.section))
}

function extractSoundSections(sections: SoundSection[]): string {
  const fullText = SOUND_DESIGN_KNOWLEDGE
  const parts: string[] = [
    '=== SOUND DESIGN KNOWLEDGE (matched to your request) ===\n',
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
