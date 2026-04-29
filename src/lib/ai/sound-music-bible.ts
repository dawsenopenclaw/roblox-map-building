/**
 * Sound & Music Bible — audio system design, SFX implementation, music systems, ambient soundscapes.
 * ForjeGames AI Knowledge Base
 */

export const SOUND_MUSIC_BIBLE: string = `
=== SOUND & MUSIC BIBLE: COMPLETE ROBLOX AUDIO SYSTEM ===

PHILOSOPHY:
Audio is 50% of immersion. Bad audio = players leave. Great audio = players stay 3x longer.
Every game needs: ambient loop, UI sounds, action feedback, music zones.
Rule: if something moves, hits, or changes — it makes a sound.
Rule: sounds must feel responsive — play within 16ms of trigger.
Rule: never silence. Background always present. Silence = game feels dead.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 1: ROBLOX SOUND INSTANCE — EVERY PROPERTY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CREATING A SOUND:
local snd = Instance.new("Sound")
snd.Parent = game.SoundService  -- 2D global
-- OR --
snd.Parent = somePart            -- 3D positional

CORE PROPERTIES:
  SoundId          = "rbxassetid://12345678"  -- asset ID string, must be rbxassetid:// prefix
  Volume           = 0.5          -- range 0 to 10, default 0.5 — most sounds between 0.3-1.0
  PlaybackSpeed    = 1.0          -- range 0.1 to 10, 1.0 = normal pitch/speed
  Looped           = false        -- true = loops forever until stopped
  Playing          = false        -- set true to play, false to stop
  TimePosition     = 0            -- current playback position in seconds
  TimeLength       = 0            -- read-only: total duration in seconds
  IsPlaying        = false        -- read-only: currently playing
  IsPaused         = false        -- read-only: currently paused
  RespectFilteringEnabled = true  -- always true in modern Roblox

ROLLOFF (3D SPATIAL) PROPERTIES:
  RollOffMode = Enum.RollOffMode.Inverse  -- most natural for most sounds
    .Inverse         -- volume drops as 1/distance, most common
    .Linear          -- volume drops linearly, good for UI sounds with range
    .InverseTapered  -- inverse but tapers to zero at max distance (best for music)
    .LinearSquare    -- linear falloff squared, very sharp cutoff

  RollOffMinDistance = 10   -- distance where volume starts dropping (studs)
  RollOffMaxDistance = 80   -- distance where sound is inaudible

ROLLOFF PRESETS BY SOUND TYPE:
  Footstep:     Min=4,  Max=25,  Mode=Inverse
  Gunshot:      Min=15, Max=150, Mode=Inverse
  Explosion:    Min=25, Max=300, Mode=InverseTapered
  Ambient loop: Min=8,  Max=60,  Mode=InverseTapered
  Machinery:    Min=10, Max=80,  Mode=Inverse
  Dialog/voice: Min=4,  Max=20,  Mode=Linear
  Waterfall:    Min=12, Max=90,  Mode=InverseTapered
  Door creak:   Min=3,  Max=20,  Mode=Linear
  Spell cast:   Min=8,  Max=50,  Mode=Inverse
  Music (2D):   Min=0,  Max=0    -- parent to SoundService, no rolloff

PLAYBACK METHODS:
  snd:Play()    -- starts from beginning (or TimePosition if set)
  snd:Stop()    -- stops and resets TimePosition to 0
  snd:Pause()   -- pauses, preserves TimePosition
  snd:Resume()  -- resumes from paused position

EVENTS:
  snd.Ended:Connect(function() end)   -- fires when sound finishes
  snd.Loaded:Connect(function() end)  -- fires when asset fully loaded
  snd.Paused:Connect(function() end)
  snd.Resumed:Connect(function() end)
  snd.Stopped:Connect(function() end)
  snd.DidLoop:Connect(function(soundId, numOfTimesLooped) end)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 2: SOUND EFFECTS (SoundEffect INSTANCES)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Parent SoundEffect instances directly inside a Sound instance.
Multiple effects can stack. Order matters (processed top to bottom).

--- ReverbSoundEffect ---
Used for: caves, dungeons, large rooms, cathedrals, tunnels
local rev = Instance.new("ReverbSoundEffect")
rev.Parent = snd
rev.DecayTime  = 1.5    -- seconds of reverb tail. Cave=3.0, Room=0.8, Cathedral=5.0, Tunnel=2.5
rev.Density    = 1.0    -- 0-1, diffusion of reverb. High=washy, Low=distinct echoes
rev.Diffusion  = 1.0    -- 0-1, spread of reverb. Cathedral=1.0, Tile room=0.5
rev.DryLevel   = 0.0    -- dB gain of dry (original) signal. 0 = unity
rev.WetLevel   = -6.0   -- dB gain of wet (reverb) signal. -6 = natural mix

REVERB PRESETS:
  Small bathroom:    DecayTime=0.4, Density=0.8, Diffusion=0.7, DryLevel=0,  WetLevel=-8
  Medium room:       DecayTime=0.8, Density=0.9, Diffusion=0.9, DryLevel=0,  WetLevel=-6
  Large hall:        DecayTime=2.5, Density=1.0, Diffusion=1.0, DryLevel=0,  WetLevel=-3
  Cathedral:         DecayTime=5.0, Density=1.0, Diffusion=1.0, DryLevel=0,  WetLevel=-2
  Cave:              DecayTime=3.0, Density=0.7, Diffusion=0.5, DryLevel=0,  WetLevel=-4
  Dungeon:           DecayTime=2.0, Density=0.8, Diffusion=0.6, DryLevel=0,  WetLevel=-5
  Outdoor/forest:    DecayTime=0.3, Density=0.5, Diffusion=0.5, DryLevel=0,  WetLevel=-12
  Underwater:        DecayTime=1.8, Density=1.0, Diffusion=0.8, DryLevel=-4, WetLevel=-3

--- EchoSoundEffect ---
Used for: canyons, large empty spaces, hallways
local echo = Instance.new("EchoSoundEffect")
echo.Parent   = snd
echo.Delay    = 0.3   -- seconds between echoes. Canyon=0.5, Hallway=0.15, Stadium=0.4
echo.Feedback = 0.5   -- 0-1, how much each echo repeats. 0.7 = many echoes, 0.2 = one echo
echo.DryLevel = 0.0   -- dB gain of original signal
echo.WetLevel = -6.0  -- dB gain of echo signal

ECHO PRESETS:
  Canyon:   Delay=0.5,  Feedback=0.6, DryLevel=0, WetLevel=-4
  Hallway:  Delay=0.15, Feedback=0.3, DryLevel=0, WetLevel=-8
  Stadium:  Delay=0.4,  Feedback=0.5, DryLevel=0, WetLevel=-5
  Alley:    Delay=0.2,  Feedback=0.4, DryLevel=0, WetLevel=-6

--- DistortionSoundEffect ---
Used for: radio chatter, damaged speakers, industrial, monster voices
local dist = Instance.new("DistortionSoundEffect")
dist.Parent = snd
dist.Level = 0.5  -- 0-1. 0.1=subtle grit, 0.5=heavy distort, 1.0=extreme fuzz

DISTORTION LEVELS:
  Slight grit (radio):    0.1
  Walkie-talkie:          0.25
  Damaged speaker:        0.5
  Industrial/monster:     0.7
  Extreme fuzz:           0.9

--- PitchShiftSoundEffect ---
Used for: slow motion, speed changes, alien voices, pitch randomization
local pitch = Instance.new("PitchShiftSoundEffect")
pitch.Parent = snd
pitch.Octave = 1.0  -- multiplier. 0.5=one octave down, 2.0=one octave up, 1.0=unchanged

PITCH SHIFT VALUES:
  One octave down:   0.5
  Minor third down:  0.84
  Normal:            1.0
  Minor third up:    1.19
  Perfect fifth up:  1.5
  One octave up:     2.0

NOTE: Use PlaybackSpeed for quick pitch variation, PitchShiftSoundEffect for permanent pitch change.

--- EqualizerSoundEffect ---
Used for: underwater (cut highs), phone call (cut lows+highs), muffled through wall
local eq = Instance.new("EqualizerSoundEffect")
eq.Parent    = snd
eq.HighGain  = 0    -- dB gain for high frequencies (treble). Range -14 to +14
eq.LowGain   = 0    -- dB gain for low frequencies (bass). Range -14 to +14
eq.MidGain   = 0    -- dB gain for mid frequencies. Range -14 to +14
eq.MidRange  = 0    -- frequency center of the mid band in Hz? (Roblox uses 0-1 normalized)

EQ PRESETS:
  Underwater:       HighGain=-10, LowGain=3,   MidGain=-4   -- muffled, boomy
  Phone call:       HighGain=-8,  LowGain=-8,  MidGain=4    -- tinny telephone
  Muffled door:     HighGain=-8,  LowGain=-2,  MidGain=-3   -- through a wall
  Bass boost:       HighGain=0,   LowGain=8,   MidGain=0    -- thumpy
  Treble boost:     HighGain=8,   LowGain=0,   MidGain=0    -- bright/harsh
  Radio:            HighGain=-6,  LowGain=-10, MidGain=3    -- AM radio sound
  In your head:     HighGain=-12, LowGain=6,   MidGain=-6   -- inner voice effect

--- ChorusSoundEffect ---
Used for: ethereal/magical ambience, choir vocals, dream sequences
local chorus = Instance.new("ChorusSoundEffect")
chorus.Parent = snd
chorus.Depth  = 0.5   -- 0-1, depth of chorus modulation
chorus.Mix    = 0.5   -- 0-1, wet/dry mix
chorus.Rate   = 1.0   -- modulation rate in Hz

CHORUS PRESETS:
  Subtle thickening:  Depth=0.2, Mix=0.3, Rate=0.5
  Lush chorus:        Depth=0.6, Mix=0.6, Rate=1.0
  Dream/ethereal:     Depth=0.8, Mix=0.7, Rate=0.3
  Magic sparkle:      Depth=0.9, Mix=0.8, Rate=2.0

--- CompressorSoundEffect ---
Used for: dialog to keep consistent volume, master bus compression
local comp = Instance.new("CompressorSoundEffect")
comp.Parent    = snd
comp.Attack    = 0.003  -- seconds before compression kicks in
comp.Release   = 0.25   -- seconds before compression releases
comp.Ratio     = 4.0    -- compression ratio (4:1 = gentle, 10:1 = heavy)
comp.Threshold = -20    -- dB level where compression starts

--- TremoloSoundEffect ---
Used for: flickering mechanical sounds, unstable power, horror ambience
local trem = Instance.new("TremoloSoundEffect")
trem.Parent = snd
trem.Depth  = 0.5  -- 0-1, depth of volume oscillation
trem.Duty   = 0.5  -- 0-1, proportion of cycle at full volume
trem.Frequency = 5.0  -- oscillations per second

TREMOLO PRESETS:
  Subtle pulse:    Depth=0.2, Duty=0.5, Frequency=2.0
  Flickering:      Depth=0.7, Duty=0.4, Frequency=8.0
  Heartbeat:       Depth=0.9, Duty=0.2, Frequency=1.2
  Horror stutter:  Depth=1.0, Duty=0.3, Frequency=15.0

--- FlangeSoundEffect ---
Used for: sci-fi sounds, jet flyby, psychedelic effects
local flange = Instance.new("FlangeSoundEffect")
flange.Parent = snd
flange.Depth  = 0.45   -- 0-1
flange.Mix    = 0.45   -- 0-1
flange.Rate   = 0.25   -- Hz

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 3: SOUNDSERVICE & SOUNDGROUP HIERARCHY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SOUNDSERVICE PROPERTIES:
  game.SoundService.AmbientReverb = Enum.ReverbType.NoReverb  -- global reverb type
    .NoReverb, .GenericReverb, .PaddedCell, .Room, .Bathroom, .LivingRoom
    .StoneRoom, .Auditorium, .ConcertHall, .Cave, .Arena, .Hangar
    .CarpetedHallway, .Hallway, .StoneCorridor, .Alley, .Forest
    .City, .Mountains, .Quarry, .Plain, .ParkingLot, .SewerPipe
    .UnderWater, .SmallRoom, .MediumRoom, .LargeRoom, .MediumHall
    .LargeHall, .Plate

  game.SoundService.AmbientReverbDistance = 50  -- max distance for reverb effect
  game.SoundService.DistanceFactor = 3.4        -- studs per meter for 3D audio
  game.SoundService.DopplerScale = 1.0          -- doppler effect multiplier
  game.SoundService.RespectFilteringEnabled = true

SOUNDGROUP HIERARCHY (RECOMMENDED SETUP):
  SoundService
  ├── SoundGroup "Master"        (Volume = 1.0)
  │   ├── SoundGroup "Music"     (Volume = 0.35) -- background music, quieter than SFX
  │   │   ├── SoundGroup "Ambient_Music"    (zone ambient tracks)
  │   │   ├── SoundGroup "Combat_Music"     (battle tracks)
  │   │   └── SoundGroup "Cutscene_Music"   (cinematic moments)
  │   ├── SoundGroup "SFX"       (Volume = 0.75)
  │   │   ├── SoundGroup "Footsteps"   (Volume = 0.6)
  │   │   ├── SoundGroup "Combat"      (Volume = 0.9)
  │   │   ├── SoundGroup "UI"          (Volume = 0.7)
  │   │   ├── SoundGroup "Environment" (Volume = 0.8)
  │   │   └── SoundGroup "Vehicles"    (Volume = 0.85)
  │   └── SoundGroup "Ambient"   (Volume = 0.5) -- looping background atmosphere
  │       ├── SoundGroup "Nature"
  │       ├── SoundGroup "Indoor"
  │       └── SoundGroup "Weather"

CREATING SOUNDGROUPS:
local masterGroup = Instance.new("SoundGroup")
masterGroup.Name = "Master"
masterGroup.Volume = 1.0
masterGroup.Parent = game.SoundService

ASSIGNING SOUNDS TO GROUPS:
snd.SoundGroup = game.SoundService.Master.SFX.Footsteps

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 4: SFX LIBRARY — 200+ SOUND CATEGORIES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

--- FOOTSTEPS SYSTEM ---

MATERIAL DETECTION:
local function getGroundMaterial(character)
    local rootPart = character:FindFirstChild("HumanoidRootPart")
    if not rootPart then return Enum.Material.Plastic end
    local rayOrigin = rootPart.Position
    local rayDirection = Vector3.new(0, -4, 0)
    local rayParams = RaycastParams.new()
    rayParams.FilterDescendantsInstances = {character}
    rayParams.FilterType = Enum.RaycastFilterType.Exclude
    local result = workspace:Raycast(rayOrigin, rayDirection, rayParams)
    if result then
        return result.Material, result.Instance
    end
    return Enum.Material.Plastic, nil
end

FOOTSTEP SOUNDS BY MATERIAL:
  Grass:        SoundId = "rbxassetid://6042053684"   -- soft crunch
  Dirt:         SoundId = "rbxassetid://6042053684"   -- similar to grass, slightly heavier
  Wood:         SoundId = "rbxassetid://6042311843"   -- hollow thud/clop
  Metal:        SoundId = "rbxassetid://6042313256"   -- ring, clink
  Stone/Brick:  SoundId = "rbxassetid://6042307152"   -- hard clack
  Sand:         SoundId = "rbxassetid://6042319591"   -- soft shff
  Snow:         SoundId = "rbxassetid://6042322855"   -- crunch, squeak
  Gravel:       SoundId = "rbxassetid://6042316088"   -- scatter, crunch
  Concrete:     SoundId = "rbxassetid://6042307152"   -- sharp clack, like stone
  Glass:        SoundId = "rbxassetid://6042313256"   -- light tap
  Water:        SoundId = "rbxassetid://6042316088"   -- splash
  Ice:          SoundId = "rbxassetid://6042313256"   -- slide tap
  Fabric:       SoundId = "rbxassetid://6042053684"   -- soft muffled
  Marble:       SoundId = "rbxassetid://6042307152"   -- sharp resonant

FOOTSTEP IMPLEMENTATION:
local MATERIAL_SOUNDS = {
    [Enum.Material.Grass]         = {id="rbxassetid://6042053684", vol=0.4},
    [Enum.Material.Dirt]          = {id="rbxassetid://6042053684", vol=0.5},
    [Enum.Material.Wood]          = {id="rbxassetid://6042311843", vol=0.6},
    [Enum.Material.WoodPlanks]    = {id="rbxassetid://6042311843", vol=0.6},
    [Enum.Material.Metal]         = {id="rbxassetid://6042313256", vol=0.7},
    [Enum.Material.DiamondPlate]  = {id="rbxassetid://6042313256", vol=0.7},
    [Enum.Material.SmoothPlastic] = {id="rbxassetid://6042307152", vol=0.5},
    [Enum.Material.Slate]         = {id="rbxassetid://6042307152", vol=0.65},
    [Enum.Material.Cobblestone]   = {id="rbxassetid://6042316088", vol=0.6},
    [Enum.Material.Brick]         = {id="rbxassetid://6042307152", vol=0.6},
    [Enum.Material.Sand]          = {id="rbxassetid://6042319591", vol=0.35},
    [Enum.Material.Snow]          = {id="rbxassetid://6042322855", vol=0.45},
    [Enum.Material.Glacier]       = {id="rbxassetid://6042313256", vol=0.4},
    [Enum.Material.Ice]           = {id="rbxassetid://6042313256", vol=0.4},
    [Enum.Material.Gravel]        = {id="rbxassetid://6042316088", vol=0.55},
}

local footstepSound = Instance.new("Sound")
footstepSound.Parent = character.HumanoidRootPart
footstepSound.RollOffMinDistance = 4
footstepSound.RollOffMaxDistance = 25
footstepSound.RollOffMode = Enum.RollOffMode.Linear

local lastStepTime = 0
local function playFootstep(humanoid)
    local now = tick()
    local speed = humanoid.WalkSpeed
    local interval = speed > 14 and 0.3 or 0.45  -- run vs walk cadence
    if now - lastStepTime < interval then return end
    lastStepTime = now
    local mat, inst = getGroundMaterial(humanoid.Parent)
    local data = MATERIAL_SOUNDS[mat] or {id="rbxassetid://6042307152", vol=0.5}
    footstepSound.SoundId = data.id
    footstepSound.Volume = data.vol * (0.8 + math.random() * 0.4)  -- ±20% variation
    footstepSound.PlaybackSpeed = 0.9 + math.random() * 0.2        -- ±10% pitch
    footstepSound:Play()
end

FOOTSTEP TRIGGER: connect to Humanoid.Running event
  humanoid.Running:Connect(function(speed)
      if speed > 0.5 then
          -- start footstep loop
      else
          -- stop footstep loop
      end
  end)

JUMP LAND SOUND:
  local landSound = Instance.new("Sound")
  landSound.SoundId = "rbxassetid://6042311843"
  landSound.Volume = 0.7
  landSound.PlaybackSpeed = 0.8 + math.random() * 0.3
  humanoid:GetPropertyChangedSignal("FloorMaterial"):Connect(function()
      if humanoid.FloorMaterial ~= Enum.Material.Air then
          landSound:Play()  -- triggers when landing
      end
  end)

--- COMBAT SOUNDS ---

MELEE WEAPONS:
  Sword swing (light):   Volume=0.6, PlaybackSpeed=1.0-1.2 random, rolloff min=5 max=35
  Sword swing (heavy):   Volume=0.8, PlaybackSpeed=0.85-1.05 random, rolloff min=8 max=50
  Sword hit metal:       Volume=0.9, PlaybackSpeed=0.9-1.1 random
  Sword hit flesh:       Volume=0.7, PlaybackSpeed=0.95-1.05 random
  Sword block/parry:     Volume=1.0, PlaybackSpeed=1.0-1.15 random
  Axe swing:             Volume=0.7, PlaybackSpeed=0.8-1.0 random
  Axe impact wood:       Volume=0.9, PlaybackSpeed=0.9-1.1 random
  Hammer swing:          Volume=0.6, PlaybackSpeed=0.9-1.1 random
  Hammer impact:         Volume=1.0, PlaybackSpeed=0.8-0.95 random (heavy thud)
  Punch:                 Volume=0.6, PlaybackSpeed=1.0-1.2 random
  Kick:                  Volume=0.5, PlaybackSpeed=0.95-1.15 random
  Whip crack:            Volume=0.9, PlaybackSpeed=1.0-1.1 random
  Staff/pole swing:      Volume=0.5, PlaybackSpeed=1.0-1.2 random
  Staff impact:          Volume=0.8, PlaybackSpeed=0.9-1.1 random
  Knife stab:            Volume=0.5, PlaybackSpeed=1.1-1.3 random
  Chainsaw:              Volume=1.0, Looped=true, PlaybackSpeed=0.95-1.05 random

RANGED WEAPONS:
  Bow draw:              Volume=0.5, PlaybackSpeed=0.9-1.1 (charge sound, looped while held)
  Arrow release:         Volume=0.6, PlaybackSpeed=1.0-1.15
  Arrow in flight:       Volume=0.3, PlaybackSpeed=1.0-1.1, rolloff min=2 max=30
  Arrow impact wood:     Volume=0.7, PlaybackSpeed=0.95-1.05
  Arrow impact metal:    Volume=0.8, PlaybackSpeed=1.0-1.1
  Arrow impact flesh:    Volume=0.6, PlaybackSpeed=0.95-1.05
  Crossbow fire:         Volume=0.7, PlaybackSpeed=0.95-1.05
  Crossbow reload:       Volume=0.5, PlaybackSpeed=0.9-1.1
  Throwing knife throw:  Volume=0.4, PlaybackSpeed=1.0-1.2
  Throwing knife impact: Volume=0.6, PlaybackSpeed=1.0-1.15

FIREARMS:
  Pistol shot:           Volume=0.95, PlaybackSpeed=1.0-1.05, rolloff min=15 max=150
  Pistol shot (silenced): Volume=0.4, PlaybackSpeed=1.0, rolloff min=5 max=40
  Rifle shot:            Volume=1.0, PlaybackSpeed=0.98-1.02, rolloff min=20 max=250
  Shotgun blast:         Volume=1.0, PlaybackSpeed=0.95-1.05, rolloff min=20 max=200
  Sniper rifle:          Volume=1.0, PlaybackSpeed=0.97-1.03, rolloff min=30 max=400
  SMG burst:             Volume=0.85, PlaybackSpeed=0.98-1.02
  Minigun spin-up:       Volume=0.9, Looped=true, PlaybackSpeed=1.0
  Minigun fire:          Volume=1.0, Looped=true, PlaybackSpeed=1.0-1.02
  Pistol reload:         Volume=0.5, PlaybackSpeed=0.95-1.05
  Rifle reload:          Volume=0.6, PlaybackSpeed=0.95-1.05
  Clip insert:           Volume=0.5, PlaybackSpeed=0.9-1.1
  Slide rack:            Volume=0.6, PlaybackSpeed=0.95-1.05
  Empty click:           Volume=0.3, PlaybackSpeed=1.0-1.1
  Shell casings:         Volume=0.3, PlaybackSpeed=1.0-1.3 random

BULLET IMPACTS:
  Metal: Volume=0.7, PlaybackSpeed=1.0-1.2, also play spark particle
  Wood:  Volume=0.6, PlaybackSpeed=0.9-1.1, play wood chip particle
  Stone: Volume=0.7, PlaybackSpeed=0.9-1.1, play dust particle
  Flesh: Volume=0.5, PlaybackSpeed=0.95-1.05
  Water: Volume=0.6, PlaybackSpeed=0.9-1.1, play splash particle
  Sand:  Volume=0.4, PlaybackSpeed=0.9-1.1, play sand puff particle
  Glass: Volume=0.8, PlaybackSpeed=1.0-1.2, play glass shatter particle

EXPLOSIONS:
  Small explosion (grenade): Volume=1.0, PlaybackSpeed=0.95-1.05, rolloff min=25 max=300
  Medium explosion:          Volume=1.0, PlaybackSpeed=0.9-1.0,   rolloff min=40 max=500
  Large explosion:           Volume=1.0, PlaybackSpeed=0.85-0.95, rolloff min=60 max=800
  Distant explosion:         Volume=0.4, PlaybackSpeed=0.8-0.9   -- low rumble only
  Explosion tail:            Volume=0.7, Looped for ~2s then fade out (debris settling)

EXPLOSION IMPLEMENTATION:
  Layer 1: Initial bang (short, loud, full frequency)
  Layer 2: Pressure wave (very short, low freq, plays 0.05s after bang)
  Layer 3: Debris / settling (looped, fades over 2 seconds)
  Camera shake: shake magnitude = 1.0 / (distance * 0.1), duration = 0.5s

--- UI SOUNDS ---

BUTTON INTERACTIONS:
  Hover:            Volume=0.3, PlaybackSpeed=1.2-1.4 (high, soft tick)
  Click:            Volume=0.5, PlaybackSpeed=1.0-1.1 (satisfying pop)
  Click (negative): Volume=0.5, PlaybackSpeed=0.7-0.8 (lower, heavier)
  Toggle on:        Volume=0.4, PlaybackSpeed=1.1
  Toggle off:       Volume=0.4, PlaybackSpeed=0.85
  Slider move:      Volume=0.2, PlaybackSpeed=0.9-1.1 (continuous ticking while dragging)
  Dropdown open:    Volume=0.4, PlaybackSpeed=1.0-1.05 (whoosh down)
  Dropdown close:   Volume=0.3, PlaybackSpeed=1.0-1.05 (whoosh up, reversed)
  Checkbox check:   Volume=0.4, PlaybackSpeed=1.1-1.2 (crisp tick)
  Checkbox uncheck: Volume=0.3, PlaybackSpeed=0.9-1.0

FEEDBACK SOUNDS:
  Success:          Volume=0.6, plays ascending 3-note chime
  Error/fail:       Volume=0.6, plays descending buzz/tone
  Warning:          Volume=0.5, plays 2-note alert tone
  Info/notification: Volume=0.4, plays single soft chime
  Level up:         Volume=0.8, plays triumphant fanfare (2-3 seconds)
  Achievement:      Volume=0.7, plays sparkle + chord progression
  Rare achievement: Volume=0.9, plays extended fanfare
  Purchase success: Volume=0.7, plays satisfying coin jingle + cash register
  Purchase fail:    Volume=0.5, plays negative buzz

MENU TRANSITIONS:
  Menu open:    Volume=0.4, PlaybackSpeed=1.0, short whoosh/slide in
  Menu close:   Volume=0.3, PlaybackSpeed=1.0, reverse whoosh
  Page turn:    Volume=0.3, PlaybackSpeed=1.0-1.1, paper shuffle
  Panel slide:  Volume=0.3, PlaybackSpeed=0.95-1.05, mechanical slide

INVENTORY/SHOP:
  Item pickup:        Volume=0.5, bright click/collect
  Item equip:         Volume=0.5, cloth or metal equip sound
  Item drop:          Volume=0.4, thud/drop
  Item use:           Volume=0.5, activation sound
  Item break:         Volume=0.6, crumble/snap
  Coin collect:       Volume=0.5, bright jingle
  Multiple coins:     Volume=0.6, cascade jingles (rapid succession)
  Currency spend:     Volume=0.5, cash register or whoosh out
  Chest open:         Volume=0.7, creak + contents shuffle
  Loot reveal:        Volume=0.6, shimmer + reveal chime

TIMER/COUNTDOWN:
  Countdown tick:     Volume=0.4, crisp click each second
  Final 5 seconds:    Volume=0.6, accelerating ticks
  Time up:            Volume=0.8, buzzer or gong
  Respawn countdown:  Volume=0.3, soft ping each second

--- NATURE & ENVIRONMENT SOUNDS ---

WEATHER SYSTEMS:
  Wind (calm):
    SoundId = ambient wind loop
    Volume = 0.2, Looped = true
    PlaybackSpeed = 0.9-1.1 (slowly varies with wind intensity)
    Parent = SoundService (2D global)
    EQ: HighGain=-3 (softens harshness)

  Wind (moderate):
    Volume = 0.4
    PlaybackSpeed = 0.95-1.1
    Occasional wind gust SFX on top (non-looped)

  Wind (storm):
    Volume = 0.7
    PlaybackSpeed = 1.0-1.15
    Add DistortionSoundEffect Level=0.05

  Rain (drizzle):
    Volume = 0.25, Looped = true
    Parent = SoundService (2D)
    Add subtle ReverbSoundEffect for outdoor feel

  Rain (moderate):
    Volume = 0.45, Looped = true
    Additional drip sounds on surfaces near player

  Rain (heavy/storm):
    Volume = 0.7, Looped = true
    Thunder: separate non-looped sounds, random delay after lightning
    Thunder volume varies with distance (0.3 to 1.0)

  Snow falling:
    Volume = 0.15, Looped = true — very quiet hiss
    Wind on top at 0.3 volume

THUNDER SYSTEM:
  Thunder comes in 3 types:
  1. Close strike (within 500 studs):  Volume=1.0, low rumble then crack, PlaybackSpeed=0.95-1.05
  2. Medium (500-2000 studs):          Volume=0.6, mostly rumble, PlaybackSpeed=0.85-0.95
  3. Distant (2000+ studs):            Volume=0.25, pure low rumble, PlaybackSpeed=0.75-0.85

  Trigger after lightning flash:
    delay = lightningDistance / 340  -- speed of sound in studs (approx)
    wait(delay)
    thunder:Play()

WATER SOUNDS:
  Stream/creek (small):  Volume=0.4, rolloff min=5 max=40, gentle babble loop
  River (medium):        Volume=0.6, rolloff min=8 max=60, moderate rush loop
  River (large/fast):    Volume=0.8, rolloff min=10 max=80, powerful rush loop
  Waterfall (small):     Volume=0.6, rolloff min=8 max=60
  Waterfall (large):     Volume=0.9, rolloff min=15 max=100
  Ocean waves:           Volume=0.5, rolloff min=10 max=120 (or 2D global near beach)
  Lake (calm):           Volume=0.2, occasional gentle lap sounds
  Puddle splash:         Volume=0.4, PlaybackSpeed=0.9-1.2, triggered when stepped in
  Underwater ambient:    Volume=0.5, 2D global, + EQ HighGain=-10 LowGain=3

FIRE SOUNDS:
  Candle/small flame:  Volume=0.2, rolloff min=3 max=15, soft crackle loop
  Campfire:            Volume=0.5, rolloff min=5 max=30, pop+crackle loop
  Bonfire:             Volume=0.7, rolloff min=8 max=50, intense roar loop
  Furnace/forge:       Volume=0.8, rolloff min=5 max=40, deep roar loop
  Fire spreading:      Transition between small → large sounds over time
  Fire out:            Volume=0.4, sizzle/extinguish sound

WIND IN TREES/LEAVES:
  Light breeze leaves: Volume=0.25, rolloff min=3 max=20, soft rustle
  Strong wind trees:   Volume=0.5, rolloff min=5 max=35, louder whoosh+rustle
  Branch creak:        Volume=0.3, PlaybackSpeed=0.8-1.1 random, occasional non-looped

WILDLIFE SOUNDS:
  Birds (day):         Volume=0.35, random timing, multiple species, rolloff min=8 max=60
  Owl (night):         Volume=0.4, random timing every 5-20 seconds, rolloff min=5 max=50
  Crickets (night):    Volume=0.3, Looped, global or area-based
  Frogs (near water):  Volume=0.35, Looped + random individual croaks
  Wolf howl:           Volume=0.6, PlaybackSpeed=0.9-1.1, rolloff min=20 max=200
  Bear growl:          Volume=0.8, rolloff min=8 max=60
  Horse whinny:        Volume=0.7, rolloff min=8 max=80
  Crow caw:            Volume=0.5, random timing, rolloff min=10 max=70
  Eagle screech:       Volume=0.6, rolloff min=15 max=120

--- MECHANICAL & INDUSTRIAL SOUNDS ---

DOORS:
  Light door open:    Volume=0.5, PlaybackSpeed=0.95-1.05 — light wood creak + swing
  Light door close:   Volume=0.5, PlaybackSpeed=0.95-1.05 — click shut
  Heavy door open:    Volume=0.7, PlaybackSpeed=0.85-0.95 — heavy wood groan
  Heavy door close:   Volume=0.8, PlaybackSpeed=0.85-0.95 — heavy thud slam
  Metal door open:    Volume=0.8, PlaybackSpeed=0.9-1.05 — metal scrape + creak
  Metal door close:   Volume=0.9, PlaybackSpeed=0.9-1.0 — metal clang
  Safe/vault open:    Volume=0.9, PlaybackSpeed=0.85-0.95 — heavy mechanism clicks
  Sliding door:       Volume=0.5, PlaybackSpeed=0.95-1.05 — slide whoosh + stop
  Trapdoor open:      Volume=0.7, PlaybackSpeed=0.9-1.0 — snap/bang
  Door locked:        Volume=0.4, PlaybackSpeed=1.0-1.1 — jiggle/rattle
  Door creak (idle):  Volume=0.3, PlaybackSpeed=0.85-1.1 random, triggered by wind

ELEVATOR:
  Motor start:        Volume=0.6, PlaybackSpeed=0.9-1.0
  Motor loop:         Volume=0.45, Looped, PlaybackSpeed=0.98-1.02
  Motor stop:         Volume=0.5, PlaybackSpeed=0.9-1.0
  Ding/arrive:        Volume=0.7, PlaybackSpeed=1.0
  Doors open:         Volume=0.5, PlaybackSpeed=0.95-1.05
  Doors close:        Volume=0.5, PlaybackSpeed=0.95-1.05
  Cable tension:      Volume=0.2, Looped while moving, low squeak

MACHINERY:
  Conveyor belt:      Volume=0.5, Looped, rolloff min=6 max=40
  Gear turning:       Volume=0.4, Looped, PlaybackSpeed varies with speed
  Piston pump:        Volume=0.7, Looped, rhythmic chug-chug
  Generator:          Volume=0.6, Looped, deep hum
  Electric motor:     Volume=0.4, Looped, high whine
  Hydraulic press:    Volume=0.8, PlaybackSpeed=0.9-1.0, non-looped per cycle
  Hydraulic hiss:     Volume=0.5, short hiss on each cycle
  Steam release:      Volume=0.7, PlaybackSpeed=0.95-1.05, hiss burst
  Alarm:              Volume=0.9, Looped, alternating tones
  Siren (police):     Volume=1.0, Looped, classic wail
  Siren (industrial): Volume=0.9, Looped, steady buzz

COMPUTERS & ELECTRONICS:
  Computer beep:      Volume=0.3, PlaybackSpeed=1.0-1.3 random
  Keyboard typing:    Volume=0.3, PlaybackSpeed=0.9-1.3 random per keypress
  Scanner:            Volume=0.4, scan beep + motor
  Printer:            Volume=0.5, Looped while printing
  Server hum:         Volume=0.3, Looped, data center background
  TV static:          Volume=0.4, Looped
  Power-up:           Volume=0.5, ascending electronic hum
  Power-down:         Volume=0.5, descending electronic hum

--- MAGIC & FANTASY SOUNDS ---

SPELL CASTING:
  Fireball cast:      Volume=0.8, whoosh + ignite crackle
  Fireball travel:    Volume=0.5, Looped fire hiss while flying
  Fireball impact:    Volume=0.9, explosion + crackle
  Ice bolt cast:      Volume=0.7, crystalline whoosh
  Ice impact:         Volume=0.8, shatter + freeze
  Lightning bolt:     Volume=1.0, crack + sizzle
  Wind spell:         Volume=0.7, powerful gust
  Earth spell:        Volume=0.9, rumble + crack
  Water spell:        Volume=0.7, splash + gurgle
  Dark magic:         Volume=0.8, low rumble + distorted tone
  Light magic:        Volume=0.7, pure bell + shimmer
  Healing spell:      Volume=0.6, ascending chime + soft warmth
  Shield spell:       Volume=0.7, energy barrier hum + power up
  Teleport out:       Volume=0.8, whoosh inward + pop
  Teleport in:        Volume=0.8, pop + whoosh outward
  Invisibility:       Volume=0.5, fade shimmer
  Reveal from invis:  Volume=0.5, reverse shimmer
  Enchant item:       Volume=0.6, magical shimmer + chime
  Curse:              Volume=0.7, dark tone + crackle

PORTALS & RIFTS:
  Portal idle:        Volume=0.4, Looped, humming vortex energy
  Portal activate:    Volume=0.8, power surge + snap
  Portal deactivate:  Volume=0.7, power down + implode
  Step through portal: Volume=0.6, warping rush

POTIONS & CONSUMABLES:
  Uncork:             Volume=0.4, pop
  Pour/drink:         Volume=0.3, glug sounds
  Bottle shatter:     Volume=0.5, glass break
  Potion effect:      Volume=0.5, bubbling + shimmer
  Potion explosion:   Volume=0.8, pop + splash + effect

--- VEHICLE SOUNDS ---

CAR/LAND VEHICLE:
  Engine idle:        Volume=0.6, Looped, PlaybackSpeed=0.95-1.05 (subtle variation)
  Engine rev:         Volume=0.8, PlaybackSpeed scales with RPM (0.8-2.0)
  Engine high rev:    Volume=0.9, PlaybackSpeed=1.8-2.2
  Tire screech:       Volume=0.8, PlaybackSpeed=0.9-1.1, triggered at high turn speed
  Tire on gravel:     Volume=0.4, Looped while driving on gravel
  Horn:               Volume=0.9, PlaybackSpeed=0.98-1.02
  Car crash (small):  Volume=0.8, crunch + glass
  Car crash (major):  Volume=1.0, massive crunch + multiple layers
  Gear shift:         Volume=0.3, mechanical click
  Door open:          Volume=0.5, car door creak
  Door close:         Volume=0.6, car door thud

FLYING VEHICLES:
  Propeller start:    Volume=0.7, slow to fast spin-up
  Propeller idle:     Volume=0.6, Looped
  Propeller full:     Volume=0.9, Looped, higher PlaybackSpeed
  Helicopter blades:  Volume=0.8, Looped, characteristic chop
  Jet engine idle:    Volume=0.7, Looped, turbine whine
  Jet engine thrust:  Volume=1.0, Looped, PlaybackSpeed=1.0-1.3 with throttle
  Sonic boom:         Volume=1.0, non-looped bang when breaking sound barrier

WATER VEHICLES:
  Boat motor (small): Volume=0.5, Looped, outboard putt-putt
  Boat motor (large): Volume=0.7, Looped, deep throb
  Hull through water: Volume=0.4, Looped, rushing water
  Anchor drop:        Volume=0.7, chain rattle + splash

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 5: AMBIENT SOUNDSCAPE SYSTEM
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

AMBIENT DESIGN PHILOSOPHY:
Never silence. Every zone needs 3 layers:
  Layer 1: Base tone  (constant, very low volume — 0.1-0.2)
  Layer 2: Zone loop  (characteristic sound of the area — 0.3-0.5)
  Layer 3: Stingers   (random one-shots that add life — 0.2-0.4)

--- FOREST AMBIENT ---
Layer 1: Low wind rustle loop, Volume=0.15, global 2D
Layer 2: Bird chorus loop, Volume=0.3, multiple overlapping tracks
Layer 3 (random every 5-30s):
  - Single bird call, various species
  - Branch snap/creak
  - Rustling bushes (nearby animal)
  - Distant woodpecker
Day vs Night version:
  Day:   Birds + wind, bright and alive
  Night: Crickets (Looped 0.3) + owl calls + silence is more present

FOREST IMPLEMENTATION:
local ForestAmbient = {
    base = {id="...", volume=0.15, looped=true},
    zone = {id="...", volume=0.3,  looped=true},
    stingers = {
        {id="...", weight=10, vol=0.3, pitchRange={0.9,1.1}},  -- bird 1
        {id="...", weight=8,  vol=0.25,pitchRange={0.85,1.05}}, -- bird 2
        {id="...", weight=3,  vol=0.2, pitchRange={0.8,1.0}},   -- branch
        {id="...", weight=4,  vol=0.2, pitchRange={0.9,1.1}},   -- rustle
    },
    stingerInterval = {min=6, max=25},
}

--- CAVE AMBIENT ---
Layer 1: Deep rumble/tone, Volume=0.2, 2D or very wide rolloff
Layer 2: Dripping water, random timing, multiple drip sources
Layer 3: Distant cave sounds (random):
  - Rock fall/slide
  - Distant water rush
  - Echoey creak
  - Wind through tunnels
Effects: All cave sounds get heavy ReverbSoundEffect (DecayTime=2.5, WetLevel=-3)
         EchoSoundEffect (Delay=0.4, Feedback=0.45) on stingers

DRIP SYSTEM:
local function startDrips(caveArea)
    for i = 1, 5 do  -- 5 drip sources
        local drip = Instance.new("Sound")
        drip.SoundId = "rbxassetid://..."
        drip.Volume = 0.2 + math.random() * 0.2
        drip.RollOffMinDistance = 3
        drip.RollOffMaxDistance = 20
        -- parent to a random stalactite/part in cave
        drip.Parent = caveArea:GetChildren()[math.random(#caveArea:GetChildren())]
        local rev = Instance.new("ReverbSoundEffect")
        rev.DecayTime = 2.5
        rev.WetLevel = -3
        rev.Parent = drip
        task.spawn(function()
            while true do
                wait(2 + math.random() * 4)  -- drip every 2-6 seconds
                drip.PlaybackSpeed = 0.8 + math.random() * 0.4
                drip:Play()
            end
        end)
    end
end

--- UNDERWATER AMBIENT ---
Layer 1: Muffled pressure tone, Volume=0.3, 2D
Layer 2: Bubble stream loop, Volume=0.2
Layer 3: Random ocean ambience stingers:
  - Whale call (distant, rare)
  - School of fish movement
  - Bubbles burst
  - Creaking metal (shipwreck area)
EQ on ALL sounds: HighGain=-10, LowGain=3, MidGain=-4 (underwater muffling)
Reverb: DecayTime=1.8, Density=1.0, WetLevel=-3

--- CITY/URBAN AMBIENT ---
Layer 1: Distant traffic hum, Volume=0.25, 2D
Layer 2: Urban activity loop (voices, movement), Volume=0.3, 2D
Layer 3 (random):
  - Car honk, rolloff min=15 max=100
  - Distant siren
  - Crowd conversation burst
  - Dog bark, rolloff min=10 max=60
  - Construction noise
  - Newspaper/trash blow
  - Vendor call
Time-based variation:
  Rush hour (7-9am, 5-7pm): More traffic, more voices, Vol *= 1.5
  Night (10pm-5am): Reduce to 20% volume, add occasional drunk voices, car passing

--- DUNGEON AMBIENT ---
Layer 1: Evil low drone, Volume=0.2, 2D — establishes dread
Layer 2: Chains/metal loop, Volume=0.15, distant
Layer 3 (random):
  - Distant moan
  - Chain rattle
  - Dripping
  - Distant boom/impact
  - Skittering (rats)
  - Door groan
  - Distant scream (rare, for horror)
Heavy reverb on everything: DecayTime=2.0, WetLevel=-4

--- MARKETPLACE AMBIENT ---
Layer 1: Crowd murmur loop, Volume=0.35, 2D
Layer 2: Market activity (haggling, goods movement), Volume=0.25
Layer 3 (random):
  - Vendor shout ("Get your wares!")
  - Coin exchange jingle
  - Crowd laugh
  - Animal (chickens, horse)
  - Barrel roll/crate movement
  - Bell (shop door)

--- SPACE AMBIENT ---
Layer 1: Ship/station hum, Volume=0.2, 2D — no air, only structure-conducted sound
Layer 2: Subtle electronic ambience, Volume=0.15
Layer 3 (random, very sparse):
  - Structural creak
  - Distant alarm
  - System beep
  - Ventilation pulse
NOTE: In space, explosions and most sounds are very muted. Only inside-ship sounds are full volume.
Outside in space (EVA): near silence, only suit sounds + radio crackle (DistortionSoundEffect)

--- HAUNTED/HORROR AMBIENT ---
Layer 1: Low sub-bass drone, Volume=0.2 — felt more than heard
Layer 2: Unsettling reversed/warped loop, Volume=0.15
Layer 3 (random, timed for jump scare potential):
  - Whisper (hard to discern words)
  - Distant voice calling player's name
  - Knocking
  - Footstep above player (when player is alone)
  - Baby crying (distant)
  - Music box (brief, fades)
  - Piano chord (discordant)
Techniques:
  TremoloSoundEffect on drones (Frequency=0.5, Depth=0.3) — creates unease
  PitchShiftSoundEffect (Octave=0.7) on all ambient — lower = more threatening
  ReverbSoundEffect (DecayTime=3.0) on everything

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 6: MUSIC SYSTEMS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

MUSIC DESIGN PRINCIPLES:
- Background music should support the experience, not distract from it
- Loop points must be seamless (avoid audible pop at loop)
- Player should not consciously notice music unless it's a moment of triumph/drama
- Dynamic music reacts to game state: calm → tension → combat → victory
- Default music volume: 0.35 (SFX should always be louder than music)

--- ZONE-BASED MUSIC SYSTEM ---

IMPLEMENTATION WITH TRIGGER VOLUMES:
local musicTracks = {
    forest = {
        normal = "rbxassetid://...",
        combat = "rbxassetid://...",
        boss   = "rbxassetid://...",
    },
    dungeon = {
        normal = "rbxassetid://...",
        combat = "rbxassetid://...",
        boss   = "rbxassetid://...",
    },
    town = {
        normal  = "rbxassetid://...",
        evening = "rbxassetid://...",
    },
}

local currentTrack = nil
local targetTrack = nil
local crossfadeTween = nil
local FADE_TIME = 1.5  -- seconds for crossfade

local musicA = Instance.new("Sound")
musicA.Name = "MusicA"
musicA.Looped = true
musicA.Volume = 0
musicA.Parent = game.SoundService

local musicB = Instance.new("Sound")
musicB.Name = "MusicB"
musicB.Looped = true
musicB.Volume = 0
musicB.Parent = game.SoundService

local activeMusicSlot = musicA
local inactiveMusicSlot = musicB

local function crossfadeTo(soundId, targetVolume)
    targetVolume = targetVolume or 0.35
    if currentTrack == soundId then return end
    currentTrack = soundId

    inactiveMusicSlot.SoundId = soundId
    inactiveMusicSlot.Volume = 0
    inactiveMusicSlot:Play()

    -- Fade out active, fade in inactive
    local fadeOut = game:GetService("TweenService"):Create(
        activeMusicSlot,
        TweenInfo.new(FADE_TIME, Enum.EasingStyle.Linear),
        {Volume = 0}
    )
    local fadeIn = game:GetService("TweenService"):Create(
        inactiveMusicSlot,
        TweenInfo.new(FADE_TIME, Enum.EasingStyle.Linear),
        {Volume = targetVolume}
    )
    fadeOut:Play()
    fadeIn:Play()
    fadeOut.Completed:Connect(function()
        activeMusicSlot:Stop()
        -- swap slots
        local temp = activeMusicSlot
        activeMusicSlot = inactiveMusicSlot
        inactiveMusicSlot = temp
    end)
end

ZONE TRIGGER SETUP:
local function setupMusicZone(triggerPart, trackId, volume)
    triggerPart.Touched:Connect(function(hit)
        local player = game.Players:GetPlayerFromCharacter(hit.Parent)
        if player and player == game.Players.LocalPlayer then
            crossfadeTo(trackId, volume)
        end
    end)
    triggerPart.TouchEnded:Connect(function(hit)
        local player = game.Players:GetPlayerFromCharacter(hit.Parent)
        if player and player == game.Players.LocalPlayer then
            -- fade to previous zone music or default
        end
    end)
end

--- DYNAMIC LAYERED MUSIC ---

CONCEPT: Multiple stems that play simultaneously, volume controlled independently:
  Stem 1: "Base"    — always playing, melodic foundation
  Stem 2: "Rhythm"  — drums/percussion, add during exploration
  Stem 3: "Combat"  — intense layer, add during fighting
  Stem 4: "Tension" — strings/suspense layer, add during danger
  Stem 5: "Victory" — triumphant layer, brief sting on success

All stems MUST be the same BPM and loop length for perfect sync.

local stems = {
    base    = Instance.new("Sound"),
    rhythm  = Instance.new("Sound"),
    combat  = Instance.new("Sound"),
    tension = Instance.new("Sound"),
}

-- All stems play simultaneously, synced
-- Volumes:
--   Peaceful: base=0.35, rhythm=0.0, combat=0.0, tension=0.0
--   Exploring: base=0.35, rhythm=0.25, combat=0.0, tension=0.0
--   Danger:    base=0.35, rhythm=0.25, combat=0.0, tension=0.3
--   Combat:    base=0.2,  rhythm=0.35, combat=0.4, tension=0.1
--   Boss:      base=0.2,  rhythm=0.4,  combat=0.5, tension=0.3

local function setMusicState(state)
    local TweenService = game:GetService("TweenService")
    local ti = TweenInfo.new(2.0, Enum.EasingStyle.Linear)
    local targets = {
        peaceful  = {base=0.35, rhythm=0.0,  combat=0.0, tension=0.0},
        exploring = {base=0.35, rhythm=0.25, combat=0.0, tension=0.0},
        danger    = {base=0.35, rhythm=0.25, combat=0.0, tension=0.3},
        combat    = {base=0.2,  rhythm=0.35, combat=0.4, tension=0.1},
        boss      = {base=0.2,  rhythm=0.4,  combat=0.5, tension=0.3},
    }
    local target = targets[state]
    if not target then return end
    for name, vol in pairs(target) do
        TweenService:Create(stems[name], ti, {Volume=vol}):Play()
    end
end

--- PLAYLIST SYSTEM ---

PURPOSE: Cycle through multiple tracks in a zone without repeating.

local function createPlaylist(trackList, volume)
    local playlist = {
        tracks = trackList,
        currentIndex = 0,
        playedIndices = {},
        volume = volume or 0.35,
    }

    local function pickNextTrack()
        -- reset if all played
        if #playlist.playedIndices >= #playlist.tracks then
            playlist.playedIndices = {}
        end
        local available = {}
        for i, _ in ipairs(playlist.tracks) do
            local played = false
            for _, pi in ipairs(playlist.playedIndices) do
                if pi == i then played = true; break end
            end
            if not played then table.insert(available, i) end
        end
        local idx = available[math.random(#available)]
        table.insert(playlist.playedIndices, idx)
        return playlist.tracks[idx]
    end

    local sound = Instance.new("Sound")
    sound.Volume = playlist.volume
    sound.Parent = game.SoundService

    local function playNext()
        sound.SoundId = pickNextTrack()
        sound:Play()
        sound.Ended:Connect(playNext)  -- auto-advance
    end

    playNext()
    return sound
end

--- BOSS FIGHT MUSIC SYSTEM ---

PHASES:
  Phase 0 (encounter): Boss intro sting (non-looped, dramatic hit)
  Phase 1 (normal):    Boss battle loop track 1 (intense, rhythmic)
  Phase 2 (50% HP):    Crossfade to track 2 (faster, more intense, additional instruments)
  Phase 3 (25% HP):    Crossfade to track 3 (most intense, may add choir/screaming)
  Victory:             Victory fanfare sting (non-looped)
  Death/fail:          Defeat sting (non-looped, somber)

local bossMusic = {
    intro      = Instance.new("Sound"),
    phase1     = Instance.new("Sound"),
    phase2     = Instance.new("Sound"),
    phase3     = Instance.new("Sound"),
    victory    = Instance.new("Sound"),
    defeat     = Instance.new("Sound"),
}

local function onBossEncounter()
    -- Stop all music immediately
    for _, snd in pairs(bossMusic) do snd:Stop() end
    bossMusic.intro.Looped = false
    bossMusic.intro:Play()
    bossMusic.intro.Ended:Connect(function()
        bossMusic.phase1.Looped = true
        bossMusic.phase1:Play()
    end)
end

local function onBossPhaseChange(phase)
    if phase == 2 then
        crossfadeTo(bossMusic.phase2.SoundId)
    elseif phase == 3 then
        crossfadeTo(bossMusic.phase3.SoundId)
    end
end

--- VOLUME MANAGEMENT & USER PREFERENCES ---

DEFAULT VOLUMES:
  Master Music: 0.35
  Master SFX:   0.75
  Master:       1.0

SAVING PREFERENCES (DataStore):
local DataStoreService = game:GetService("DataStoreService")
local prefsStore = DataStoreService:GetDataStore("AudioPreferences")

local function saveAudioPrefs(userId, prefs)
    local success, err = pcall(function()
        prefsStore:SetAsync(tostring(userId), {
            musicVolume = prefs.musicVolume,
            sfxVolume   = prefs.sfxVolume,
            masterVolume = prefs.masterVolume,
        })
    end)
    if not success then warn("Failed to save audio prefs:", err) end
end

local function loadAudioPrefs(userId)
    local success, data = pcall(function()
        return prefsStore:GetAsync(tostring(userId))
    end)
    if success and data then
        return data
    end
    return {musicVolume=0.35, sfxVolume=0.75, masterVolume=1.0}  -- defaults
end

-- Apply preferences to SoundGroups
local function applyAudioPrefs(prefs)
    local SS = game.SoundService
    if SS:FindFirstChild("Master") then
        SS.Master.Volume = prefs.masterVolume or 1.0
        if SS.Master:FindFirstChild("Music") then
            SS.Master.Music.Volume = prefs.musicVolume or 0.35
        end
        if SS.Master:FindFirstChild("SFX") then
            SS.Master.SFX.Volume = prefs.sfxVolume or 0.75
        end
    end
end

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 7: 3D SPATIAL AUDIO — ADVANCED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

POSITIONAL AUDIO FUNDAMENTALS:
Parent sound to the Part that produces it.
Roblox automatically handles position tracking as Part moves.
The "listener" is at the player's camera position (Camera.CFrame).
Volume = 1 / (1 + (distance - minDist) * (1 / (maxDist - minDist)))  -- Inverse mode

MULTI-SOURCE SOUND PLACEMENT:
For large objects (waterfall, machinery), place multiple sounds at different points:
  local positions = {
      Vector3.new(0, 5, 0),   -- top
      Vector3.new(0, 0, 0),   -- middle
      Vector3.new(0, -5, 0),  -- bottom
  }
  for _, pos in ipairs(positions) do
      local part = Instance.new("Part")
      part.Size = Vector3.one
      part.CFrame = CFrame.new(pos)
      part.Anchored = true
      part.CanCollide = false
      part.Transparency = 1
      part.Parent = model
      local snd = Instance.new("Sound")
      snd.SoundId = "rbxassetid://..."
      snd.Volume = 0.4  -- lower per-source since multiple sources
      snd.Looped = true
      snd.RollOffMinDistance = 5
      snd.RollOffMaxDistance = 40
      snd.Parent = part
      snd:Play()
  end

--- DOPPLER EFFECT SIMULATION ---

Roblox has DopplerScale in SoundService but manual implementation gives more control:
local function updateDoppler(sound, sourcePart, listenerPosition)
    local velocity = sourcePart.Velocity
    local toListener = (listenerPosition - sourcePart.Position).Unit
    local radialVelocity = velocity:Dot(toListener)  -- positive = moving toward
    -- speed of sound = ~340 m/s, but in Roblox studs we use ~1020 studs/s
    local dopplerFactor = (1020 + radialVelocity) / 1020
    dopplerFactor = math.clamp(dopplerFactor, 0.5, 2.0)
    sound.PlaybackSpeed = dopplerFactor
end

-- Run in RenderStepped or Heartbeat:
game:GetService("RunService").Heartbeat:Connect(function()
    local camera = workspace.CurrentCamera
    updateDoppler(engineSound, vehiclePart, camera.CFrame.Position)
end)

--- AUDIO OCCLUSION SYSTEM ---

PURPOSE: Sounds are quieter/muffled when there's a wall between source and player

local function calculateOcclusion(soundSource, listenerPosition)
    local direction = listenerPosition - soundSource.Position
    local distance = direction.Magnitude
    local rayParams = RaycastParams.new()
    rayParams.FilterDescendantsInstances = {soundSource.Parent}
    rayParams.FilterType = Enum.RaycastFilterType.Exclude
    local result = workspace:Raycast(soundSource.Position, direction, rayParams)
    if result then
        -- Wall hit — apply occlusion
        local wallThickness = 1  -- estimate
        local occlusionFactor = 0.5  -- reduce volume by 50%
        return occlusionFactor
    end
    return 1.0  -- no occlusion
end

local function applyOcclusion(sound, soundPart, listenerPos)
    local occFactor = calculateOcclusion(soundPart, listenerPos)
    sound.Volume = sound.Volume * occFactor
    -- Also apply EQ to muffle high frequencies through walls
    local eq = sound:FindFirstChildOfClass("EqualizerSoundEffect")
    if not eq then
        eq = Instance.new("EqualizerSoundEffect")
        eq.Parent = sound
    end
    eq.HighGain = occFactor < 1 and -8 or 0
    eq.MidGain  = occFactor < 1 and -3 or 0
end

OCCLUSION PERFORMANCE NOTE:
Don't raycast every frame. Use a timer — check every 0.1 seconds:
local lastOcclusionCheck = 0
game:GetService("RunService").Heartbeat:Connect(function()
    if tick() - lastOcclusionCheck < 0.1 then return end
    lastOcclusionCheck = tick()
    -- run occlusion checks
end)

--- REVERB ZONES ---

Create volume parts to define reverb areas:
local function createReverbZone(zonePart, reverbSettings)
    zonePart.Touched:Connect(function(hit)
        local player = game.Players:GetPlayerFromCharacter(hit.Parent)
        if player and player == game.Players.LocalPlayer then
            game.SoundService.AmbientReverb = reverbSettings.reverbType
        end
    end)
    zonePart.TouchEnded:Connect(function(hit)
        local player = game.Players:GetPlayerFromCharacter(hit.Parent)
        if player and player == game.Players.LocalPlayer then
            game.SoundService.AmbientReverb = Enum.ReverbType.NoReverb
        end
    end)
end

-- Cave zone:
createReverbZone(caveVolume, {reverbType = Enum.ReverbType.Cave})
-- Cathedral:
createReverbZone(cathedralVolume, {reverbType = Enum.ReverbType.ConcertHall})
-- Forest:
createReverbZone(forestVolume, {reverbType = Enum.ReverbType.Forest})

DISTANCE-BASED REVERB ADJUSTMENT:
-- Apply different reverb depending on how deep in cave
local function getCaveDepthReverb(depthFactor)
    -- depthFactor: 0 = cave entrance, 1 = deepest point
    local decayTime = 0.8 + depthFactor * 2.5  -- 0.8 at entrance, 3.3 deep inside
    return decayTime
end

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 8: IMPLEMENTATION PATTERNS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

--- PRELOADING SOUNDS ---

Critical sounds should be preloaded before the game starts to prevent first-play delay:
local ContentProvider = game:GetService("ContentProvider")

local criticalSounds = {
    "rbxassetid://...",  -- gunshot
    "rbxassetid://...",  -- explosion
    "rbxassetid://...",  -- level up
    "rbxassetid://...",  -- UI click
    "rbxassetid://...",  -- death
}

local function preloadAudio()
    -- Create temporary Sound instances for preloading
    local soundInstances = {}
    for _, id in ipairs(criticalSounds) do
        local snd = Instance.new("Sound")
        snd.SoundId = id
        table.insert(soundInstances, snd)
    end
    ContentProvider:PreloadAsync(soundInstances)
    -- Clean up temp instances
    for _, snd in ipairs(soundInstances) do snd:Destroy() end
end

task.spawn(preloadAudio)

--- SOUND POOLING (OBJECT POOL PATTERN) ---

Don't create/destroy sounds constantly for frequent SFX (bullets, footsteps).
Instead maintain a pool of pre-created sounds:

local SoundPool = {}
SoundPool.__index = SoundPool

function SoundPool.new(soundId, poolSize, parent)
    local self = setmetatable({}, SoundPool)
    self.pool = {}
    self.index = 1
    for i = 1, poolSize do
        local snd = Instance.new("Sound")
        snd.SoundId = soundId
        snd.Parent = parent or game.SoundService
        table.insert(self.pool, snd)
    end
    return self
end

function SoundPool:Play(volume, pitch)
    local snd = self.pool[self.index]
    self.index = (self.index % #self.pool) + 1
    snd.Volume = volume or 0.5
    snd.PlaybackSpeed = pitch or 1.0
    snd:Play()
    return snd
end

-- Usage:
local bulletImpactPool = SoundPool.new("rbxassetid://...", 10, workspace)
-- When bullet hits:
bulletImpactPool:Play(0.7, 0.9 + math.random() * 0.2)

--- RANDOM VARIATION HELPER ---

Always randomize pitch and volume slightly for natural feel:
local function playVaried(sound, baseVolume, basePitch, volVariance, pitchVariance)
    volVariance   = volVariance   or 0.15
    pitchVariance = pitchVariance or 0.1
    sound.Volume       = baseVolume  * (1 + (math.random() - 0.5) * 2 * volVariance)
    sound.PlaybackSpeed = basePitch  * (1 + (math.random() - 0.5) * 2 * pitchVariance)
    sound:Play()
end

-- Example: footstep with ±15% volume and ±10% pitch
playVaried(footstepSound, 0.5, 1.0, 0.15, 0.10)

--- COOLDOWN PREVENTION ---

Prevent same sound from stacking or retriggering too quickly:
local soundCooldowns = {}
local SOUND_COOLDOWN = 0.05  -- seconds

local function playSoundCooled(sound, cooldownKey)
    cooldownKey = cooldownKey or sound.SoundId
    local now = tick()
    if soundCooldowns[cooldownKey] and now - soundCooldowns[cooldownKey] < SOUND_COOLDOWN then
        return  -- skip, too recent
    end
    soundCooldowns[cooldownKey] = now
    sound:Play()
end

--- CLIENT-SERVER AUDIO ARCHITECTURE ---

RULE: Play sounds on the client immediately (no lag), but use RemoteEvents for
      sounds that all players should hear (explosions, world events).

CLIENT-SIDE (LocalScript) — immediate feedback:
  - Footsteps (only local player needs to hear their own)
  - UI sounds
  - Combat sounds for the local player's actions

SERVER → ALL CLIENTS (RemoteEvent) — world events:
  - Explosions
  - Spell effects
  - Environmental triggers (doors, machines)
  - Other players' combat sounds

REMOTE EVENT PATTERN:
-- Server:
local PlaySoundRemote = game.ReplicatedStorage:FindFirstChild("PlaySound")
    or Instance.new("RemoteEvent", game.ReplicatedStorage)
PlaySoundRemote.Name = "PlaySound"

local function broadcastSound(soundId, position, volume, pitch)
    PlaySoundRemote:FireAllClients({
        soundId  = soundId,
        position = position,
        volume   = volume or 0.7,
        pitch    = pitch or 1.0,
    })
end

-- Client (LocalScript):
PlaySoundRemote.OnClientEvent:Connect(function(data)
    local snd = Instance.new("Sound")
    snd.SoundId = data.soundId
    snd.Volume = data.volume
    snd.PlaybackSpeed = data.pitch
    snd.RollOffMinDistance = 10
    snd.RollOffMaxDistance = 100
    -- Create a temp part at the position for 3D audio
    local part = Instance.new("Part")
    part.CFrame = CFrame.new(data.position)
    part.Anchored = true
    part.CanCollide = false
    part.Transparency = 1
    part.Size = Vector3.one
    part.Parent = workspace
    snd.Parent = part
    snd:Play()
    snd.Ended:Connect(function()
        part:Destroy()  -- cleanup after sound finishes
    end)
    -- Safety destroy after max 10 seconds
    game:GetService("Debris"):AddItem(part, 10)
end)

--- FADE UTILITIES ---

local TweenService = game:GetService("TweenService")

local function fadeIn(sound, targetVolume, duration)
    sound.Volume = 0
    if not sound.IsPlaying then sound:Play() end
    TweenService:Create(
        sound,
        TweenInfo.new(duration or 1.0, Enum.EasingStyle.Linear),
        {Volume = targetVolume or 0.5}
    ):Play()
end

local function fadeOut(sound, duration, stopAfter)
    local tween = TweenService:Create(
        sound,
        TweenInfo.new(duration or 1.0, Enum.EasingStyle.Linear),
        {Volume = 0}
    )
    tween:Play()
    if stopAfter then
        tween.Completed:Connect(function() sound:Stop() end)
    end
end

local function crossfade(fromSound, toSound, duration, targetVolume)
    fadeOut(fromSound, duration, true)
    toSound.SoundId = toSound.SoundId  -- ensure loaded
    fadeIn(toSound, targetVolume or 0.35, duration)
end

--- EXPONENTIAL FADE (MORE NATURAL THAN LINEAR) ---

-- Linear fade sounds unnatural. Use exponential:
local function exponentialFadeOut(sound, duration)
    local startVolume = sound.Volume
    local startTime = tick()
    local conn
    conn = game:GetService("RunService").Heartbeat:Connect(function()
        local elapsed = tick() - startTime
        local t = math.min(elapsed / duration, 1)
        -- Exponential decay
        sound.Volume = startVolume * (1 - t) ^ 2
        if t >= 1 then
            sound:Stop()
            sound.Volume = 0
            conn:Disconnect()
        end
    end)
end

--- DISTANCE-BASED LOD (LEVEL OF DETAIL) ---

Skip playing sounds that would be inaudible anyway:
local function shouldPlaySound(soundPart, minAudibleVolume)
    minAudibleVolume = minAudibleVolume or 0.05
    local camera = workspace.CurrentCamera
    local distance = (soundPart.Position - camera.CFrame.Position).Magnitude
    -- Check if sound would be audible at this distance
    -- (simplified inverse rolloff calculation)
    local maxDist = 80  -- typical max
    local minDist = 10  -- typical min
    if distance > maxDist then return false end
    local vol = 1 / (1 + math.max(0, distance - minDist) / minDist)
    return vol > minAudibleVolume
end

--- MEMORY MANAGEMENT ---

When a game area unloads (streaming), destroy sounds. Recreate on load:
local function cleanupAreaSounds(folder)
    for _, obj in ipairs(folder:GetDescendants()) do
        if obj:IsA("Sound") then
            obj:Stop()
            -- Don't destroy — let folder:Destroy() handle it
        end
    end
end

-- Use StreamingEnabled + Workspace.StreamingEnabled events:
workspace:GetPropertyChangedSignal("StreamingEnabled"):Connect(function()
    -- Re-initialize ambient sounds if needed
end)

-- Use CollectionService to tag "AmbientSound" parts and manage them:
local CollectionService = game:GetService("CollectionService")
CollectionService:GetInstanceAddedSignal("AmbientSound"):Connect(function(part)
    -- Part loaded — start its ambient sound
    local snd = part:FindFirstChildOfClass("Sound")
    if snd then snd:Play() end
end)
CollectionService:GetInstanceRemovedSignal("AmbientSound"):Connect(function(part)
    -- Part unloaded — sound automatically stops with it
end)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 9: GAME-GENRE AUDIO TEMPLATES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

--- BATTLE ROYALE / SHOOTER ---

REQUIRED AUDIO SYSTEMS:
1. Zone gun sounds (3D, accurate positioning — critical for gameplay)
2. Footstep material detection (wood floors give away sneaking)
3. Zone shrink warning sound (ticking/siren when outside safe zone)
4. Gunshot direction indicator (gun sound louder from the direction of shooter)
5. Vehicle sounds (cars, motorcycles, helicopters)
6. UI: ping, death, kill confirmed
7. Ambient: wind for open areas, specific zone ambience

CRITICAL: Gun sounds must be CLIENT-AUTHORITATIVE for no-lag feedback.
          Server verifies hit, but client plays sound immediately on shoot.

--- RPG / ADVENTURE ---

REQUIRED AUDIO SYSTEMS:
1. Zone-based music with seamless transitions
2. NPC dialog (voice lines or text sounds)
3. Inventory sounds (equip, unequip, use)
4. Combat SFX per weapon type
5. Magic spell sounds
6. Level up / achievement fanfares
7. Day/night ambient transition
8. Town/outdoor/dungeon/cave ambiences

NPC CONVERSATION SOUNDS (text bubbles):
When NPC dialog shows, play:
- Text "typing" sound as text appears letter by letter
- Different tones per NPC personality (high = young/excited, low = old/wise)
- Conversation end sound

--- HORROR ---

REQUIRED AUDIO SYSTEMS:
1. Absolute silence as default (amplifies dread)
2. Heartbeat system that speeds up near threats
3. Jump scare stingers (loud, sudden, placed carefully)
4. Dynamic horror ambient (gets worse as player progresses)
5. Environmental storytelling sounds (crying, whispers, dragging)
6. Monster sounds (growl, heavy breathing, footsteps)
7. Player breathing (speeds up when scared/running)

HEARTBEAT SYSTEM:
local heartbeatSound = Instance.new("Sound")
heartbeatSound.SoundId = "rbxassetid://..."
heartbeatSound.Volume = 0
heartbeatSound.Looped = true
heartbeatSound.Parent = game.SoundService
heartbeatSound:Play()

local function updateHeartbeat(stressLevel)
    -- stressLevel: 0 = calm, 1 = maximum fear
    heartbeatSound.Volume = stressLevel * 0.6
    heartbeatSound.PlaybackSpeed = 0.7 + stressLevel * 0.8  -- slow to fast
end

TENSION BUILD:
As player approaches scary thing:
- Low hum gets louder
- Heartbeat increases
- High frequency "anxiety" tone fades in
- Just before jump scare: brief near-silence (0.5s)
- THEN: loud sudden sound (the jump scare)

--- RACING GAME ---

REQUIRED AUDIO SYSTEMS:
1. Engine sounds (idle, low rev, high rev, redline)
2. Tire screech (turning at speed, braking)
3. Collision sounds (small bump to major crash)
4. Opponent engines (3D, hear them approach)
5. Crowd/ambience at track
6. Countdown sound (3-2-1-GO)
7. Lap complete / position change sounds
8. Music that matches race intensity

ENGINE SYSTEM:
-- Map RPM (0-8000) to PlaybackSpeed (0.8-2.2)
local function rpmToPlaybackSpeed(rpm)
    local normalized = rpm / 8000  -- 0 to 1
    return 0.8 + normalized * 1.4  -- 0.8 to 2.2
end

-- Layer 2 engine sounds:
-- "idle" loop at low volume always
-- "high rev" loop that fades in as RPM increases
local engineIdle = Instance.new("Sound")
engineIdle.Looped = true
local engineRev = Instance.new("Sound")
engineRev.Looped = true
engineRev.Volume = 0  -- starts silent

local function updateEngineAudio(rpm)
    local speed = rpmToPlaybackSpeed(rpm)
    engineIdle.PlaybackSpeed = speed
    engineRev.PlaybackSpeed = speed
    -- Crossfade between idle and rev
    local revMix = math.clamp((rpm - 2000) / 4000, 0, 1)
    engineIdle.Volume = (1 - revMix) * 0.7
    engineRev.Volume = revMix * 0.9
end

--- OBBY (OBSTACLE COURSE) ---

REQUIRED AUDIO SYSTEMS:
1. Jump sound (springy, satisfying)
2. Land sound (thud, material-based)
3. Death/fail sound (comical or dramatic)
4. Checkpoint reached (achievement chime)
5. Stage complete (fanfare)
6. Moving platforms (mechanical loop sounds)
7. Hazard sounds (spikes, fire, electricity)
8. Background music (upbeat, looped, not annoying after 1000th death)

KEY: Death sound must be satisfying, not frustrating.
     Make it slightly comical → player laughs instead of rage quits.

--- TYCOON ---

REQUIRED AUDIO SYSTEMS:
1. Money earn sounds (cash register, coin collect)
2. Building construction (place thud + sparkle)
3. Conveyor/production loop sounds
4. Upgrade purchased (power up sound)
5. Visitor arrival (door bell)
6. Machine operation loops (specific per machine type)
7. Background music (looping, pleasant, not annoying — this plays for hours)
8. Idle machine warning (soft alarm when not producing)

TYCOON MUSIC REQUIREMENT: Must loop perfectly at ~2-3 min length.
Players spend 20+ minutes in tycoons. Music cannot be annoying.
Test: listen to loop 50 times. If still tolerable, it passes.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 10: PERFORMANCE & OPTIMIZATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SOUND COUNT LIMITS:
- Mobile devices: keep active sounds under 24 simultaneously
- PC: can handle 48+ active sounds
- Looped ambient sounds: max 6-8 simultaneous
- Positional SFX: max 16 simultaneously
- Limit check: use game:GetService("SoundService"):FindFirstChildOfClass("Sound") count

PERFORMANCE TRICKS:
1. Distance culling: don't play sounds farther than their max rolloff distance
2. Cooldown: skip sounds that would play within 0.05s of the same sound
3. Pool reuse: 10-sound pool for rapid-fire SFX (bullets, footsteps)
4. Skip quiet sounds: if calculated volume < 0.05, skip playing entirely
5. LOD: distant areas use simpler/fewer ambient sounds
6. Streaming: ambient sounds only loaded when area is streamed in

MEMORY:
- Sound instances don't hold audio data in memory — they stream from Roblox CDN
- Multiple Sound instances with the same SoundId only load the audio data once
- Destroy unused Sound instances: snd:Destroy() — frees the instance, not the CDN cache

AUDIO DRIVER CONSIDERATIONS:
- Some mobile devices have audio latency of 100-200ms
- Account for this in time-critical audio (combat feedback)
- Prefer client-side sounds for all player actions to minimize perceived latency

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 11: COMPLETE AUDIO SETUP SCRIPT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Full game audio initialization (place in StarterPlayerScripts):

-- AudioManager.lua (LocalScript in StarterPlayerScripts)
local SoundService = game:GetService("SoundService")
local RunService = game:GetService("RunService")
local TweenService = game:GetService("TweenService")
local Players = game:GetService("Players")
local player = Players.LocalPlayer

-- ═══════ SOUNDGROUP HIERARCHY ═══════
local function setupSoundGroups()
    local groups = {
        {name="Master",      vol=1.0,  parent=SoundService},
        {name="Music",       vol=0.35, parent="Master"},
        {name="SFX",         vol=0.75, parent="Master"},
        {name="Ambient",     vol=0.5,  parent="Master"},
        {name="Footsteps",   vol=0.6,  parent="SFX"},
        {name="Combat",      vol=0.9,  parent="SFX"},
        {name="UI",          vol=0.7,  parent="SFX"},
        {name="Environment", vol=0.8,  parent="SFX"},
        {name="Weather",     vol=0.6,  parent="Ambient"},
        {name="Nature",      vol=0.7,  parent="Ambient"},
    }
    local created = {}
    for _, g in ipairs(groups) do
        local sg = Instance.new("SoundGroup")
        sg.Name = g.name
        sg.Volume = g.vol
        if type(g.parent) == "string" then
            sg.Parent = created[g.parent] or SoundService
        else
            sg.Parent = g.parent
        end
        created[g.name] = sg
    end
    return created
end

-- ═══════ AMBIENT SOUND SETUP ═══════
local function createAmbientSound(soundId, volume, looped, group)
    local snd = Instance.new("Sound")
    snd.SoundId = soundId
    snd.Volume = volume
    snd.Looped = looped ~= false
    snd.SoundGroup = group
    snd.Parent = SoundService
    return snd
end

-- ═══════ ZONE MANAGER ═══════
local ZoneManager = {}
ZoneManager.currentZone = nil
ZoneManager.sounds = {}

function ZoneManager:enterZone(zoneName)
    if self.currentZone == zoneName then return end
    local prevZone = self.currentZone
    self.currentZone = zoneName
    -- Fade out previous
    if prevZone and self.sounds[prevZone] then
        for _, snd in pairs(self.sounds[prevZone]) do
            TweenService:Create(snd, TweenInfo.new(1.5), {Volume=0}):Play()
        end
    end
    -- Fade in new
    if self.sounds[zoneName] then
        for _, snd in pairs(self.sounds[zoneName]) do
            snd:Play()
            local targetVol = snd:GetAttribute("BaseVolume") or 0.3
            snd.Volume = 0
            TweenService:Create(snd, TweenInfo.new(1.5), {Volume=targetVol}):Play()
        end
    end
end

-- ═══════ STINGER SYSTEM ═══════
local StingerSystem = {}
StingerSystem.active = false
StingerSystem.currentConfig = nil

function StingerSystem:startZone(config)
    self.active = true
    self.currentConfig = config
    self:_scheduleNext()
end

function StingerSystem:stop()
    self.active = false
    self.currentConfig = nil
end

function StingerSystem:_scheduleNext()
    if not self.active or not self.currentConfig then return end
    local cfg = self.currentConfig
    local interval = cfg.interval.min + math.random() * (cfg.interval.max - cfg.interval.min)
    task.delay(interval, function()
        if not self.active then return end
        self:_playStinger()
        self:_scheduleNext()
    end)
end

function StingerSystem:_playStinger()
    local cfg = self.currentConfig
    if not cfg or #cfg.stingers == 0 then return end
    -- Weighted random selection
    local totalWeight = 0
    for _, s in ipairs(cfg.stingers) do totalWeight = totalWeight + (s.weight or 1) end
    local r = math.random() * totalWeight
    local cumulative = 0
    local selected = cfg.stingers[1]
    for _, s in ipairs(cfg.stingers) do
        cumulative = cumulative + (s.weight or 1)
        if r <= cumulative then selected = s; break end
    end
    local snd = Instance.new("Sound")
    snd.SoundId = selected.id
    snd.Volume = selected.vol or 0.3
    snd.PlaybackSpeed = selected.pitchRange
        and (selected.pitchRange[1] + math.random() * (selected.pitchRange[2] - selected.pitchRange[1]))
        or 1.0
    snd.Parent = SoundService
    snd:Play()
    snd.Ended:Connect(function() snd:Destroy() end)
    game:GetService("Debris"):AddItem(snd, 15)
end

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 12: QUICK REFERENCE — BY USE CASE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

"Add footstep sounds":
  → Use FOOTSTEPS SYSTEM above
  → Ray down from HumanoidRootPart to detect material
  → Play matching sound with ±20% volume, ±10% pitch variation
  → Interval based on WalkSpeed (faster = shorter interval)

"Add background music":
  → Create 2 Sound instances in SoundService (musicA, musicB)
  → Use crossfadeTo() pattern for zone transitions
  → Set Looped=true, Volume=0.35
  → Parent to Music SoundGroup

"Add ambient cave sounds":
  → Drip system: 5 Sound instances parented to cave parts, random 2-6s timing
  → Add ReverbSoundEffect (DecayTime=2.5, WetLevel=-3) to drips
  → Set SoundService.AmbientReverb = Enum.ReverbType.Cave on zone entry

"Add explosion":
  → RemoteEvent from server to all clients
  → Client creates temp Part at position, parents Sound to it
  → Play bang + debris loop + camera shake
  → game:GetService("Debris"):AddItem(part, 5)

"Add UI sounds":
  → LocalScript in StarterGui
  → 2D sounds: Parent = SoundService (no rolloff)
  → Connect to button.MouseButton1Click and .MouseEnter
  → Keep volume low (0.3-0.5) so they don't overpower game audio

"Add rain":
  → Looped Sound in SoundService, Volume=0.4
  → Connect to weather system (ServerScript broadcasts weather state)
  → Fade in/out using TweenService on weather change
  → Optional: add drip sounds near roofs/overhangs

"Add monster/enemy sounds":
  → Parent sounds to monster's HumanoidRootPart
  → Idle breathing: Looped, Volume=0.2, rolloff min=5 max=30
  → Growl: random timer 5-20s, PlaybackSpeed=0.85-1.1 random
  → Attack: trigger on animation event
  → Death: trigger on Humanoid.Died event

"Add 3D positional sound to object":
  → local snd = Instance.new("Sound")
  → snd.Parent = thePart  (not SoundService)
  → Set RollOffMinDistance and RollOffMaxDistance
  → Set RollOffMode = Enum.RollOffMode.Inverse
  → snd.Looped = true; snd:Play()

"Make sounds not stack/spam":
  → Use soundCooldowns table with tick() check
  → Minimum 0.05s between same sound
  → For continuous actions (holding fire): use single looped sound, not rapid Play() calls

"Save player audio preferences":
  → DataStore key: "AudioPrefs_" .. userId
  → Store: musicVolume (0-1), sfxVolume (0-1), masterVolume (0-1)
  → Apply to SoundGroups on load
  → GUI slider connects to SoundGroup.Volume directly

"Add reverb to a zone":
  → Option 1: SoundService.AmbientReverb (global, changes everything)
  → Option 2: ReverbSoundEffect on individual sounds (more control)
  → Option 3: ReverbSoundEffect on SoundGroup (affects all children)
  → Best practice: use AmbientReverb for zone entry/exit via trigger volumes

COMMON MISTAKES TO AVOID:
1. Playing sounds on server (Sound:Play() in Script) — no one hears it
   FIX: Use RemoteEvent or put sounds in LocalScript
2. Parenting Sound to SoundService for 3D audio — no position
   FIX: Parent to the part that emits the sound
3. Creating new Sound instance every time a SFX plays — memory leak
   FIX: Use sound pool or single instance with :Play() calls
4. Not setting Looped=false on one-shot sounds — they loop forever if not stopped
   FIX: Always set Looped=false for non-ambient sounds
5. Setting Volume > 1 thinking it will be louder — can distort/clip
   FIX: Max volume = 1.0 for most sounds, use SoundGroup volumes to balance
6. No audio preloading — first-play silence
   FIX: ContentProvider:PreloadAsync() at game start
7. All sounds same pitch — sounds robotic/artificial
   FIX: Always add ±10-20% pitch variation
8. Music volume too high — drowns out SFX
   FIX: Music default = 0.35, SFX default = 0.75
9. Not considering mobile audio latency
   FIX: Client-side sounds for all player actions
10. Ambient sounds playing when player is nowhere near them
    FIX: Distance check before playing, use streaming-aware sound management
`

export const SOUND_SFX_LIBRARY: string = `
=== SFX QUICK REFERENCE LIBRARY ===

COMBAT SFX RECIPES:
─────────────────
Sword Swing:
  PlaybackSpeed = 1.0 + math.random() * 0.2  -- 1.0 to 1.2
  Volume = 0.6
  RollOff: min=5, max=35
  Effects: none needed

Sword Hit Metal:
  PlaybackSpeed = 0.9 + math.random() * 0.2
  Volume = 0.9
  Optional: PitchShiftSoundEffect Octave=0.95 for deeper ring

Explosion (medium):
  Layer 1 - Bang:    Vol=1.0, pitch=0.95-1.05
  Layer 2 - Rumble:  Vol=0.7, pitch=0.8-0.9, delay=0.05s
  Layer 3 - Debris:  Vol=0.5, pitch=0.85-0.95, Looped, fades over 2s
  Camera shake: magnitude = clamp(50 / distance, 0, 1), duration = 0.6s
  RollOff: min=25, max=300

Gunshot (pistol):
  Volume = 0.95, pitch = 1.0-1.05
  RollOff: min=15, max=150
  Tail: brief reverb (DecayTime=0.5) to simulate bullet crack

FOOTSTEP QUICK TABLE:
────────────────────
Grass:   vol=0.4, pitch=0.85-1.1,  interval_walk=0.45, interval_run=0.30
Wood:    vol=0.6, pitch=0.9-1.1,   interval_walk=0.45, interval_run=0.30
Metal:   vol=0.7, pitch=0.95-1.1,  interval_walk=0.45, interval_run=0.28
Stone:   vol=0.65,pitch=0.9-1.1,   interval_walk=0.45, interval_run=0.30
Sand:    vol=0.35,pitch=0.85-1.05, interval_walk=0.50, interval_run=0.35
Snow:    vol=0.45,pitch=0.8-1.05,  interval_walk=0.50, interval_run=0.35
Gravel:  vol=0.55,pitch=0.85-1.1,  interval_walk=0.45, interval_run=0.30
Water:   vol=0.6, pitch=0.9-1.1,   interval_walk=0.45, interval_run=0.28

UI SFX QUICK TABLE:
──────────────────
hover:          vol=0.25, pitch=1.2-1.4 (bright tick)
click:          vol=0.45, pitch=1.0-1.1 (satisfying pop)
success:        vol=0.6,  pitch=1.0     (ascending 3-tone chime)
error:          vol=0.55, pitch=0.85    (descending buzz)
level_up:       vol=0.75, pitch=1.0     (triumphant fanfare, 2s)
achievement:    vol=0.65, pitch=1.0     (sparkle + chord, 1.5s)
purchase:       vol=0.65, pitch=1.05    (coin jingle, 0.8s)
notification:   vol=0.4,  pitch=1.1     (soft single chime, 0.5s)
menu_open:      vol=0.35, pitch=1.0     (whoosh in, 0.2s)
menu_close:     vol=0.30, pitch=0.9     (whoosh out, 0.2s)

AMBIENT QUICK SETUPS:
────────────────────
Forest (day):    wind_loop vol=0.15 + birds_loop vol=0.25 + stingers every 8-20s
Forest (night):  crickets_loop vol=0.3 + owl stingers every 10-30s
Cave:            drip_system (5 sources, 2-6s intervals) + deep rumble vol=0.2 + heavy reverb
Ocean:           wave_loop vol=0.5 + seagull stingers every 5-20s + wind vol=0.2
City:            traffic_loop vol=0.25 + crowd_loop vol=0.2 + event stingers every 4-12s
Dungeon:         evil_drone vol=0.2 + chain_loop vol=0.15 + horror stingers every 12-35s
`

export const SOUND_MUSIC_SYSTEMS: string = `
=== MUSIC SYSTEMS REFERENCE ===

CROSSFADE PATTERN (essential):
───────────────────────────────
Two Sound slots (A and B), always:
- Active slot: playing at target volume
- Inactive slot: silent, ready
On zone change:
  1. Set inactive slot SoundId to new track
  2. inactive:Play() — starts silent
  3. Tween active slot Volume → 0 over 1.5s
  4. Tween inactive slot Volume → 0.35 over 1.5s
  5. After fade: active:Stop(), swap active/inactive references

DYNAMIC LAYERING SETUP:
───────────────────────
Create 4-5 synced Sound instances:
  stem_base:    always vol=0.35
  stem_rhythm:  vol=0  (add for exploration)
  stem_combat:  vol=0  (add during fighting)
  stem_tension: vol=0  (add near danger)
  stem_boss:    vol=0  (only during boss fights)

All stems MUST:
  - Be same BPM
  - Be same exact loop length (or multiples of each other)
  - Start simultaneously: stem_base:Play() then immediately others:Play()

State transitions (TweenService, 2s linear):
  PEACEFUL:   base=0.35, rhythm=0,    combat=0,   tension=0
  EXPLORING:  base=0.35, rhythm=0.2,  combat=0,   tension=0
  DANGER:     base=0.3,  rhythm=0.2,  combat=0,   tension=0.25
  COMBAT:     base=0.2,  rhythm=0.3,  combat=0.4, tension=0.1
  BOSS:       base=0.2,  rhythm=0.35, combat=0.5, tension=0.3

PLAYLIST (no-repeat):
─────────────────────
Tracks = {"id1","id2","id3","id4","id5"}
played = {}

function nextTrack():
  if #played == #Tracks: played = {}
  available = [t for t in Tracks if t not in played]
  pick = available[random(1, #available)]
  played.append(pick)
  return pick

Auto-advance: sound.Ended → playNext()

BOSS MUSIC FLOW:
────────────────
1. On encounter: stop all → play intro sting (non-looped)
2. intro.Ended → start phase1 loop
3. boss HP 50%: crossfade to phase2 loop
4. boss HP 25%: crossfade to phase3 loop
5. boss defeated: stop all → play victory sting
6. player died: stop all → play defeat sting

VOLUME BALANCE (master reference):
────────────────────────────────────
Master:    1.0
Music:     0.35  (quiet enough to hear over SFX)
SFX:       0.75
Ambient:   0.5
Footsteps: 0.6  (audible but not distracting)
Combat:    0.9  (punchy and responsive)
UI:        0.7
`

export const SOUND_AMBIENT: string = `
=== AMBIENT SOUNDSCAPE RECIPES ===

RULE: 3 layers minimum — base tone + zone loop + random stingers

FOREST (DAY):
  Base:     Low wind rumble, vol=0.12, 2D global, always running
  Zone:     Birdsong chorus loop, vol=0.28, 2D
  Stingers: [birds(x5 variants), branch_snap, rustle] every 6-22s

FOREST (NIGHT):
  Base:     Crickets loop, vol=0.3, 2D
  Zone:     Gentle night wind, vol=0.15
  Stingers: [owl_hoot, distant_wolf, cricket_swell] every 10-35s

CAVE:
  Base:     Sub-bass drone, vol=0.18, 2D
  Zone:     Water drips (5 sources on cave parts, 2-6s each)
  Stingers: [rock_fall, distant_water, chain_rattle] every 15-40s
  FX:       Heavy reverb on everything (DecayTime=2.5)

UNDERWATER:
  Base:     Pressure muffled hum, vol=0.25, 2D
  Zone:     Bubble stream, vol=0.2, looped
  Stingers: [distant_whale, fish_school, bubble_burst] every 20-60s
  FX:       EQ HighGain=-10 on ALL sounds

DUNGEON:
  Base:     Evil low drone, vol=0.2, 2D
  Zone:     Distant chains/metal, vol=0.15, looped
  Stingers: [distant_moan, chain_rattle, drip, distant_boom] every 12-35s

CITY:
  Base:     Traffic hum, vol=0.22, 2D
  Zone:     Urban crowd murmur, vol=0.3, looped
  Stingers: [car_horn, siren, crowd_burst, dog_bark] every 4-12s

SPACE STATION:
  Base:     Engine/hull vibration hum, vol=0.18, 2D
  Zone:     Electronic ambience, vol=0.12, looped
  Stingers: [structural_creak, alarm_blip, vent_pulse] every 20-50s

MARKETPLACE:
  Base:     Crowd murmur, vol=0.35, 2D
  Zone:     Trading activity sounds, vol=0.2
  Stingers: [vendor_shout, coins_exchange, crowd_laugh, animal] every 4-10s

STINGER WEIGHT SYSTEM:
  Each stinger has weight (higher = more frequent)
  Total all weights, pick random 0-total, walk cumulative sum
  More common sounds get higher weight (birds=10, rare wolf=1)
`

export const SOUND_3D_AUDIO: string = `
=== 3D SPATIAL AUDIO REFERENCE ===

ROLLOFF QUICK REFERENCE:
────────────────────────
                    Min   Max   Mode
Whisper:             2    12    Linear
Footstep:            4    25    Linear
Conversation:        4    20    Linear
Small SFX:           5    30    Inverse
Ambient machine:    10    80    Inverse
Music (zone):        8    60    InverseTapered
Gunshot:            15   150    Inverse
Explosion:          25   300    InverseTapered
Industrial:         10    80    Inverse
Waterfall:          12    90    InverseTapered

PART-ATTACHED SOUND SETUP:
───────────────────────────
local snd = Instance.new("Sound")
snd.Parent = part                      -- KEY: parent to part, not SoundService
snd.RollOffMode = Enum.RollOffMode.Inverse
snd.RollOffMinDistance = 8
snd.RollOffMaxDistance = 60
snd.Volume = 0.6
snd.Looped = true
snd:Play()

MULTI-POINT SOURCE (for large objects):
─────────────────────────────────────
For waterfall, large fire, machinery spanning many studs:
Place 3-5 invisible anchor parts at different points on the object.
Each anchor gets its own Sound instance at vol/numAnchors.
Result: Sound seems to come from the whole object, not a single point.

OCCLUSION (wall blocking sound):
──────────────────────────────────
Check every 0.1s (not every frame — expensive):
  Ray from soundPart → listenerPosition
  If ray hits something: reduce volume 50%, apply EQ HighGain=-8
  If clear: full volume, EQ HighGain=0

DOPPLER (moving sound source):
───────────────────────────────
radialVel = sourcePart.Velocity:Dot((listener - source).Unit)
speed_factor = (1020 + radialVel) / 1020
sound.PlaybackSpeed = clamp(speed_factor, 0.5, 2.0)
Run in Heartbeat, not RenderStepped (physics accuracy)

REVERB ZONES (using AmbientReverb):
────────────────────────────────────
Use invisible trigger Part.Touched events:
Cave entry:    SoundService.AmbientReverb = Enum.ReverbType.Cave
Cave exit:     SoundService.AmbientReverb = Enum.ReverbType.NoReverb
Large hall:    SoundService.AmbientReverb = Enum.ReverbType.ConcertHall
Forest:        SoundService.AmbientReverb = Enum.ReverbType.Forest
StoneCorridor: SoundService.AmbientReverb = Enum.ReverbType.StoneCorridor

DISTANCE CULLING:
──────────────────
Before playing any 3D sound:
  local dist = (part.Position - camera.CFrame.Position).Magnitude
  if dist > sound.RollOffMaxDistance then return end  -- don't play, inaudible
`

export const SOUND_IMPLEMENTATION: string = `
=== IMPLEMENTATION PATTERNS CHEATSHEET ===

MINIMAL WORKING AUDIO SETUP (copy-paste ready):
─────────────────────────────────────────────────
-- LocalScript in StarterPlayerScripts

local SS = game:GetService("SoundService")
local TS = game:GetService("TweenService")
local Players = game:GetService("Players")
local player = Players.LocalPlayer

-- Background music
local music = Instance.new("Sound")
music.Name = "BGMusic"
music.SoundId = "rbxassetid://YOUR_MUSIC_ID"
music.Volume = 0.35
music.Looped = true
music.Parent = SS
music:Play()

-- UI click sound
local uiClick = Instance.new("Sound")
uiClick.SoundId = "rbxassetid://YOUR_CLICK_ID"
uiClick.Volume = 0.45
uiClick.Parent = SS

-- Wire to all buttons
for _, btn in ipairs(player.PlayerGui:GetDescendants()) do
    if btn:IsA("GuiButton") then
        btn.MouseButton1Click:Connect(function()
            uiClick.PlaybackSpeed = 1.0 + math.random() * 0.1
            uiClick:Play()
        end)
    end
end

SOUND POOLING (10-instance pool):
──────────────────────────────────
local function makePool(soundId, size)
    local pool, idx = {}, 1
    for i=1,size do
        local s=Instance.new("Sound")
        s.SoundId=soundId
        s.Parent=SS
        pool[i]=s
    end
    return {
        play=function(vol, pitch)
            local s=pool[idx]
            idx=(idx%size)+1
            s.Volume=vol or 0.5
            s.PlaybackSpeed=pitch or 1.0
            s:Play()
        end
    }
end

local bulletPool = makePool("rbxassetid://...", 10)
bulletPool.play(0.7, 0.9+math.random()*0.2)

RANDOM VARIATION (one-liner):
──────────────────────────────
local function playRandom(s,v,p)
    s.Volume=v*(0.85+math.random()*0.3)
    s.PlaybackSpeed=p*(0.9+math.random()*0.2)
    s:Play()
end

COOLDOWN GUARD:
───────────────
local lastPlayed={}
local function playCooled(snd, key, cooldown)
    local now=tick()
    if now-(lastPlayed[key] or 0) < (cooldown or 0.05) then return end
    lastPlayed[key]=now
    snd:Play()
end

CROSSFADE:
──────────
local function xfade(from, to, dur, vol)
    TS:Create(from,TweenInfo.new(dur or 1.5),{Volume=0}):Play()
    to.Volume=0; to:Play()
    TS:Create(to,TweenInfo.new(dur or 1.5),{Volume=vol or 0.35}):Play()
end

FOOTSTEP LOOP:
──────────────
local MATS = {
    [Enum.Material.Grass]={id="rbxassetid://...",v=0.4},
    [Enum.Material.Wood]={id="rbxassetid://...",v=0.6},
    [Enum.Material.Metal]={id="rbxassetid://...",v=0.7},
    [Enum.Material.Slate]={id="rbxassetid://...",v=0.65},
}
local stepSnd=Instance.new("Sound")
stepSnd.RollOffMinDistance=4
stepSnd.RollOffMaxDistance=25
local lastStep=0

local function step(char, speed)
    if tick()-lastStep < (speed>14 and 0.3 or 0.45) then return end
    lastStep=tick()
    local rp=RaycastParams.new()
    rp.FilterDescendantsInstances={char}
    rp.FilterType=Enum.RaycastFilterType.Exclude
    local hit=workspace:Raycast(char.HumanoidRootPart.Position,Vector3.new(0,-4,0),rp)
    local mat=hit and hit.Material or Enum.Material.Plastic
    local d=MATS[mat] or {id="rbxassetid://...",v=0.5}
    stepSnd.SoundId=d.id
    stepSnd.Volume=d.v*(0.8+math.random()*0.4)
    stepSnd.PlaybackSpeed=0.9+math.random()*0.2
    stepSnd.Parent=char.HumanoidRootPart
    stepSnd:Play()
end

player.CharacterAdded:Connect(function(char)
    char:WaitForChild("Humanoid").Running:Connect(function(spd)
        if spd>0.5 then step(char,spd) end
    end)
end)

BROADCAST SOUND (server→all clients):
──────────────────────────────────────
-- Server Script:
local RE=Instance.new("RemoteEvent",game.ReplicatedStorage)
RE.Name="PlayWorldSound"
RE:FireAllClients({id="rbxassetid://...",pos=explosion.Position,vol=1.0,pitch=1.0,minR=25,maxR=300})

-- LocalScript:
game.ReplicatedStorage.PlayWorldSound.OnClientEvent:Connect(function(d)
    local p=Instance.new("Part")
    p.CFrame=CFrame.new(d.pos); p.Size=Vector3.one
    p.Anchored=true; p.CanCollide=false; p.Transparency=1
    p.Parent=workspace
    local s=Instance.new("Sound")
    s.SoundId=d.id; s.Volume=d.vol; s.PlaybackSpeed=d.pitch
    s.RollOffMinDistance=d.minR; s.RollOffMaxDistance=d.maxR
    s.Parent=p; s:Play()
    s.Ended:Connect(function() p:Destroy() end)
    game:GetService("Debris"):AddItem(p,12)
end)

PRELOAD CRITICAL SOUNDS:
─────────────────────────
local CP=game:GetService("ContentProvider")
local function preload(ids)
    local snds={}
    for _,id in ipairs(ids) do
        local s=Instance.new("Sound"); s.SoundId=id
        table.insert(snds,s)
    end
    CP:PreloadAsync(snds)
    for _,s in ipairs(snds) do s:Destroy() end
end
task.spawn(function()
    preload({"rbxassetid://ID1","rbxassetid://ID2","rbxassetid://ID3"})
end)

SAVE AUDIO PREFS:
──────────────────
-- Server: DataStore
-- Client sends preferences via RemoteFunction
-- Server saves: {music=0.35, sfx=0.75, master=1.0}
-- On join: load prefs, FireClient to set volumes
-- Client applies: SoundService.Master.Volume = prefs.master etc.
`

export const SOUND_ADVANCED_PATTERNS: string = `
=== ADVANCED AUDIO PATTERNS ===

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 13: PROCEDURAL AUDIO TECHNIQUES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

--- WEATHER SYSTEM AUDIO ---

Full weather audio system: clear → cloudy → rain → storm → clear cycle

local WeatherAudio = {}
WeatherAudio.state = "clear"
WeatherAudio.transitionTime = 8.0  -- seconds to fully transition

-- Sound instances
local windLight  = Instance.new("Sound"); windLight.Looped = true
local windHeavy  = Instance.new("Sound"); windHeavy.Looped = true
local rainLight  = Instance.new("Sound"); rainLight.Looped = true
local rainHeavy  = Instance.new("Sound"); rainHeavy.Looped = true
local thunderRef = Instance.new("Sound")  -- one-shot, replayed

for _, s in ipairs({windLight, windHeavy, rainLight, rainHeavy, thunderRef}) do
    s.Volume = 0
    s.Parent = game.SoundService
end

-- Play all loops silently so they're in sync
windLight:Play(); windHeavy:Play(); rainLight:Play(); rainHeavy:Play()

local WEATHER_VOLUMES = {
    clear  = {wL=0.12, wH=0.0,  rL=0.0,  rH=0.0},
    cloudy = {wL=0.20, wH=0.05, rL=0.0,  rH=0.0},
    rain   = {wL=0.25, wH=0.15, rL=0.35, rH=0.0},
    storm  = {wL=0.15, wH=0.55, rL=0.2,  rH=0.6},
}

local function transitionWeather(newState)
    WeatherAudio.state = newState
    local target = WEATHER_VOLUMES[newState]
    if not target then return end
    local ti = TweenInfo.new(WeatherAudio.transitionTime, Enum.EasingStyle.Sine)
    local TS = game:GetService("TweenService")
    TS:Create(windLight, ti, {Volume=target.wL}):Play()
    TS:Create(windHeavy, ti, {Volume=target.wH}):Play()
    TS:Create(rainLight, ti, {Volume=target.rL}):Play()
    TS:Create(rainHeavy, ti, {Volume=target.rH}):Play()
end

-- Thunder: server fires RemoteEvent with strike position and intensity
-- Client calculates delay based on distance:
local function playThunder(strikePos, intensity)
    local camera = workspace.CurrentCamera
    local dist = (strikePos - camera.CFrame.Position).Magnitude
    local delay = dist / 1120  -- studs per second (approx speed of sound in studs)
    delay = math.clamp(delay, 0, 8)
    task.delay(delay, function()
        thunderRef.Volume = intensity * math.clamp(1 - dist/800, 0.15, 1.0)
        thunderRef.PlaybackSpeed = 0.85 + math.random() * 0.2
        thunderRef:Play()
    end)
end

--- CROWD SYSTEM ---

Dynamic crowd audio: scales with how many players are near a location.

local CrowdSystem = {}
CrowdSystem.sources = {}
CrowdSystem.UPDATE_INTERVAL = 0.5

local crowdIdle   = Instance.new("Sound")  -- murmur loop
local crowdActive = Instance.new("Sound")  -- louder chatter loop
local crowdExcite = Instance.new("Sound")  -- cheering loop
crowdIdle.Looped   = true
crowdActive.Looped = true
crowdExcite.Looped = true
crowdIdle.Volume   = 0
crowdActive.Volume = 0
crowdExcite.Volume = 0
for _, s in ipairs({crowdIdle, crowdActive, crowdExcite}) do s:Play() end

local function updateCrowdAudio(crowdDensity)
    -- crowdDensity: 0 = empty, 1 = full/excited
    local TS = game:GetService("TweenService")
    local ti = TweenInfo.new(2.0, Enum.EasingStyle.Sine)
    TS:Create(crowdIdle,   ti, {Volume = math.clamp(0.3 - crowdDensity*0.2, 0, 0.3)}):Play()
    TS:Create(crowdActive, ti, {Volume = math.clamp(crowdDensity * 0.35, 0, 0.35)}):Play()
    TS:Create(crowdExcite, ti, {Volume = math.clamp((crowdDensity-0.6)*0.5, 0, 0.25)}):Play()
end

-- Count nearby players:
local function getLocalCrowdDensity(center, radius)
    local count = 0
    for _, p in ipairs(game.Players:GetPlayers()) do
        local char = p.Character
        if char then
            local root = char:FindFirstChild("HumanoidRootPart")
            if root and (root.Position - center).Magnitude < radius then
                count = count + 1
            end
        end
    end
    return math.min(count / 10, 1.0)  -- normalize, max at 10 players
end

task.spawn(function()
    while true do
        task.wait(CrowdSystem.UPDATE_INTERVAL)
        local cam = workspace.CurrentCamera
        local density = getLocalCrowdDensity(cam.CFrame.Position, 50)
        updateCrowdAudio(density)
    end
end)

--- HEARTBEAT/STRESS AUDIO SYSTEM ---

Track player stress and modulate audio atmosphere:

local StressSystem = {}
StressSystem.level = 0       -- 0 = calm, 1 = maximum stress
StressSystem.targetLevel = 0

-- Audio driven by stress:
local heartbeat    = Instance.new("Sound")
local breathingFast = Instance.new("Sound")
local anxietyTone  = Instance.new("Sound")
heartbeat.Looped    = true
breathingFast.Looped = true
anxietyTone.Looped  = true
heartbeat.Volume    = 0
breathingFast.Volume = 0
anxietyTone.Volume  = 0
heartbeat:Play()
breathingFast:Play()
anxietyTone:Play()

local function updateStressAudio(stress)
    StressSystem.level = stress
    local TS = game:GetService("TweenService")
    local ti = TweenInfo.new(1.0, Enum.EasingStyle.Sine)
    -- Heartbeat: starts at stress 0.2, max at 1.0
    heartbeat.PlaybackSpeed = 0.6 + stress * 1.0  -- slow to fast
    TS:Create(heartbeat, ti, {Volume = math.clamp((stress - 0.2) * 0.75, 0, 0.6)}):Play()
    -- Fast breathing: kicks in at stress 0.4
    TS:Create(breathingFast, ti, {Volume = math.clamp((stress - 0.4) * 0.5, 0, 0.3)}):Play()
    -- Anxiety tone: high freq whine, stress 0.6+
    TS:Create(anxietyTone, ti, {Volume = math.clamp((stress - 0.6) * 0.4, 0, 0.2)}):Play()
    anxietyTone.PlaybackSpeed = 0.8 + stress * 0.4
end

-- Stressors:
-- Nearby enemy:   +0.3 stress
-- Low health:     +0.4 stress
-- Being shot at:  +0.5 stress
-- Darkness:       +0.1 stress
-- Quiet safe room: -0.1 per second

--- DIALOGUE / VOICE LINE SYSTEM ---

For NPC dialog or cutscene voices:

local DialogSystem = {}

local function playDialogLine(npcPart, voiceId, subtitleText, duration)
    local snd = Instance.new("Sound")
    snd.SoundId = voiceId
    snd.Volume = 0.8
    snd.RollOffMinDistance = 5
    snd.RollOffMaxDistance = 30
    snd.RollOffMode = Enum.RollOffMode.Linear
    snd.Parent = npcPart
    snd:Play()
    -- Show subtitle
    -- (handled by UI system)
    -- Clean up
    snd.Ended:Connect(function() snd:Destroy() end)
    game:GetService("Debris"):AddItem(snd, duration + 2)
    return snd
end

-- Text-to-typewriter sound effect (each letter triggers soft click):
local typeSound = Instance.new("Sound")
typeSound.SoundId = "rbxassetid://..."  -- soft keyboard click
typeSound.Volume = 0.2
typeSound.Parent = game.SoundService

local function playTypewriterSound(text, typingSpeed)
    typingSpeed = typingSpeed or 0.04  -- seconds per character
    local displayedChars = 0
    for i = 1, #text do
        displayedChars = i
        local char = text:sub(i, i)
        if char ~= " " and char ~= "\n" then
            typeSound.PlaybackSpeed = 0.9 + math.random() * 0.2
            typeSound:Play()
        end
        task.wait(typingSpeed)
    end
end

--- MUSIC REACTIVE VISUAL SYNC ---

Sync visual elements (lights, particles) to music beat:
-- Requires knowing the BPM of the track

local function createBeatSyncer(bpm, onBeat, onOffbeat)
    local beatInterval = 60 / bpm
    local offbeatInterval = beatInterval / 2
    task.spawn(function()
        local beatCount = 0
        while true do
            beatCount = beatCount + 1
            if onBeat then onBeat(beatCount) end
            task.wait(offbeatInterval)
            if onOffbeat then onOffbeat(beatCount) end
            task.wait(offbeatInterval)
        end
    end)
end

-- Example: pulse a light on the beat
createBeatSyncer(120, function(beat)
    -- On beat: light up
    for _, light in ipairs(discoLights) do
        light.Brightness = 5
    end
    task.delay(0.1, function()
        for _, light in ipairs(discoLights) do
            light.Brightness = 1
        end
    end)
end)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 14: AUDIO FOR SPECIFIC ROBLOX MECHANICS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

--- RESPAWN AUDIO ---

On death: play death sound immediately (client-side)
While dead: muffled/echoey version of ambient (EQ HighGain=-6, reverb increase)
Respawn countdown: 3-2-1 countdown ticks (higher pitch = approaching respawn)
Respawn: whoosh/teleport sound + ambient returns to normal

local function onPlayerDied()
    -- Immediate death sound
    local deathSnd = Instance.new("Sound")
    deathSnd.SoundId = "rbxassetid://..."
    deathSnd.Volume = 0.8
    deathSnd.Parent = game.SoundService
    deathSnd:Play()
    game:GetService("Debris"):AddItem(deathSnd, 3)
    -- Muffle game audio while dead
    local masterGroup = game.SoundService:FindFirstChild("Master")
    if masterGroup then
        local eq = Instance.new("EqualizerSoundEffect")
        eq.HighGain = -8
        eq.LowGain = 2
        eq.MidGain = -3
        eq.Parent = masterGroup
        -- Store reference to remove on respawn
        deathEQ = eq
    end
end

local function onPlayerRespawned()
    -- Remove muffling
    if deathEQ then deathEQ:Destroy(); deathEQ = nil end
    -- Respawn whoosh
    local respawnSnd = Instance.new("Sound")
    respawnSnd.SoundId = "rbxassetid://..."
    respawnSnd.Volume = 0.7
    respawnSnd.Parent = game.SoundService
    respawnSnd:Play()
    game:GetService("Debris"):AddItem(respawnSnd, 3)
end

--- TOOL/WEAPON EQUIP/UNEQUIP AUDIO ---

Separate sounds for equip vs unequip for every weapon type:

SWORD:
  Equip:   "shhhking!" metal draw sound, Vol=0.6, PlaybackSpeed=0.95-1.05
  Unequip: "shhhk" metal sheath sound, Vol=0.5, PlaybackSpeed=0.9-1.0

BOW:
  Equip:   wood creak + string tension sound, Vol=0.4
  Unequip: reverse creak, Vol=0.35

STAFF/WAND:
  Equip:   magical shimmer ascending, Vol=0.5
  Unequip: brief descending shimmer, Vol=0.4

TOOL PATTERN:
local tool = script.Parent
tool.Equipped:Connect(function()
    local equipSnd = tool:FindFirstChild("EquipSound")
    if equipSnd then
        equipSnd.PlaybackSpeed = 0.95 + math.random() * 0.1
        equipSnd:Play()
    end
end)
tool.Unequipped:Connect(function()
    local unequipSnd = tool:FindFirstChild("UnequipSound")
    if unequipSnd then
        unequipSnd.PlaybackSpeed = 0.90 + math.random() * 0.1
        unequipSnd:Play()
    end
end)

--- SWIMMING AUDIO ---

Detect when player enters/exits water:
  Enter water: splash + underwater ambient starts
  While swimming: muffled EQ + bubble sounds
  Exit water: dripping sounds

local isInWater = false
local underwaterAmbient = Instance.new("Sound")
underwaterAmbient.Looped = true
underwaterAmbient.Volume = 0
underwaterAmbient.Parent = game.SoundService

local function onSwimStateChanged(swimming)
    local TS = game:GetService("TweenService")
    local ti = TweenInfo.new(0.5)
    if swimming and not isInWater then
        isInWater = true
        -- Splash in
        local splash = Instance.new("Sound")
        splash.SoundId = "rbxassetid://..."
        splash.Volume = 0.7
        splash.Parent = game.SoundService
        splash:Play()
        game:GetService("Debris"):AddItem(splash, 3)
        -- Underwater ambient
        TS:Create(underwaterAmbient, ti, {Volume=0.4}):Play()
        underwaterAmbient:Play()
        -- Apply underwater EQ to Master group
        local masterEQ = Instance.new("EqualizerSoundEffect")
        masterEQ.Name = "UnderwaterEQ"
        masterEQ.HighGain = -10
        masterEQ.LowGain = 3
        masterEQ.MidGain = -4
        masterEQ.Parent = game.SoundService:FindFirstChild("Master") or game.SoundService
    elseif not swimming and isInWater then
        isInWater = false
        -- Splash out
        local splash = Instance.new("Sound")
        splash.SoundId = "rbxassetid://..."
        splash.Volume = 0.6
        splash.Parent = game.SoundService
        splash:Play()
        game:GetService("Debris"):AddItem(splash, 3)
        -- Remove underwater EQ
        local eq = game.SoundService:FindFirstChild("Master")
            and game.SoundService.Master:FindFirstChild("UnderwaterEQ")
        if eq then eq:Destroy() end
        -- Fade out underwater ambient
        TS:Create(underwaterAmbient, ti, {Volume=0}):Play()
    end
end

-- Check humanoid state:
player.CharacterAdded:Connect(function(char)
    local humanoid = char:WaitForChild("Humanoid")
    humanoid:GetPropertyChangedSignal("FloorMaterial"):Connect(function()
        onSwimStateChanged(humanoid.FloorMaterial == Enum.Material.Water)
    end)
end)

--- VEHICLE ENTER/EXIT AUDIO ---

Each vehicle type has:
  - Get in:       door open (if car), seat belt click, engine sputters on
  - Idle:         engine idle loop (low vol, looped)
  - Acceleration: engine pitch rises with speed
  - Gear shifts:  brief mechanical click at each gear threshold (optional)
  - Braking:      tire squeal at high speed braking
  - Crash:        layered crash sounds based on severity
  - Get out:      engine off sound, door close

local VehicleAudio = {}

function VehicleAudio:init(seatPart, vehicleType)
    local audioConfig = {
        car        = {idle="rbxassetid://...", rev="rbxassetid://...", screech="rbxassetid://..."},
        boat       = {idle="rbxassetid://...", rev="rbxassetid://..."},
        helicopter = {idle="rbxassetid://...", rev="rbxassetid://..."},
    }
    local cfg = audioConfig[vehicleType] or audioConfig.car
    self.engineIdle = Instance.new("Sound")
    self.engineIdle.SoundId = cfg.idle
    self.engineIdle.Looped = true
    self.engineIdle.Volume = 0.5
    self.engineIdle.Parent = seatPart
    self.engineIdle:Play()

    self.engineRev = Instance.new("Sound")
    self.engineRev.SoundId = cfg.rev
    self.engineRev.Looped = true
    self.engineRev.Volume = 0
    self.engineRev.Parent = seatPart
    self.engineRev:Play()
end

function VehicleAudio:update(speed, maxSpeed)
    local normalized = math.clamp(speed / maxSpeed, 0, 1)
    self.engineIdle.PlaybackSpeed = 0.8 + normalized * 0.6
    self.engineRev.PlaybackSpeed  = 0.9 + normalized * 1.0
    self.engineIdle.Volume = (1 - normalized * 0.5) * 0.5
    self.engineRev.Volume  = normalized * 0.8
end

function VehicleAudio:destroy()
    if self.engineIdle then self.engineIdle:Destroy() end
    if self.engineRev   then self.engineRev:Destroy()  end
end

--- SPELL CHARGE AUDIO ---

Build-up sound that grows as player charges a spell/shot:

local chargeSound  = Instance.new("Sound")
chargeSound.SoundId = "rbxassetid://..."  -- energy build-up loop
chargeSound.Looped  = true
chargeSound.Volume  = 0

local function onChargeStart()
    chargeSound:Play()
    chargeSound.Volume = 0
    chargeSound.PlaybackSpeed = 0.8
end

local function onChargeUpdate(chargePercent)
    -- chargePercent: 0 to 1
    chargeSound.Volume = chargePercent * 0.7
    chargeSound.PlaybackSpeed = 0.8 + chargePercent * 0.4  -- pitch rises while charging
end

local function onChargeRelease(chargePercent)
    chargeSound:Stop()
    -- Play release sound, pitch based on charge
    local releaseSnd = Instance.new("Sound")
    releaseSnd.SoundId = "rbxassetid://..."
    releaseSnd.Volume = 0.6 + chargePercent * 0.4
    releaseSnd.PlaybackSpeed = 0.9 + chargePercent * 0.4
    releaseSnd.Parent = game.SoundService
    releaseSnd:Play()
    game:GetService("Debris"):AddItem(releaseSnd, 3)
end

local function onChargeCancelled()
    chargeSound:Stop()
    -- Play cancel sound (deflate/release energy)
    local cancelSnd = Instance.new("Sound")
    cancelSnd.SoundId = "rbxassetid://..."
    cancelSnd.Volume = 0.4
    cancelSnd.PlaybackSpeed = 0.7  -- lower pitch for cancelled
    cancelSnd.Parent = game.SoundService
    cancelSnd:Play()
    game:GetService("Debris"):AddItem(cancelSnd, 2)
end

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 15: SOUND DESIGN FOR SPECIFIC GAME ELEMENTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

--- COLLECTIBLES ---

Coins:         Bright jingle, short (0.3s). Stack: 3 rapid jingles for 3-coin pickup. Vol=0.5, pitch=1.1-1.3 random
Stars:         Ascending sparkle + held note. Vol=0.6. PlaybackSpeed=0.95-1.05
Gems/crystals: Crystalline chime. Vol=0.5, pitch=1.0-1.2 based on gem tier
Health pickup: Warm chord + body sound. Vol=0.6
Ammo pickup:   Metallic click + brief power-up. Vol=0.4
Key:           Magical chime + jingle. Vol=0.5
Chest open:    Creak + sparkle + item reveal (3 layered sounds). Vol=0.7
Rare item:     Extended fanfare (1.5s), distinct from common. Vol=0.8

COLLECTION FEEDBACK:
  Play sound immediately (client-side prediction, confirm with server later).
  If server denies: play reject sound + visual effect.

--- BUILDING/CONSTRUCTION ---

Place part:      Satisfying thud + quick sparkle. Vol=0.5, pitch=0.9-1.1 based on part size
Delete part:     Soft dissolve/vanish sound. Vol=0.4
Resize part:     Stretching/elastic sound while resizing. Vol=0.3
Rotate part:     Soft whoosh during rotation. Vol=0.25
Connect/snap:    Click when parts snap together. Vol=0.5
Build complete:  Brief success chime. Vol=0.6

For large builds (100+ parts placed): add occasional "build progress" sting at 25%, 50%, 75%, 100%

--- ELEVATORS & MOVING PLATFORMS ---

ELEVATOR:
  Motor start:      Vol=0.6, PlaybackSpeed=0.9 ramping to 1.0
  Travel loop:      Vol=0.45, Looped, subtle motor hum + cable
  Motor stop:       Vol=0.5, PlaybackSpeed=1.0 decelerating
  Floor arrival:    Vol=0.7, ding sound (classic elevator bell)
  Door open:        Vol=0.5, smooth slide
  Door close:       Vol=0.5, smooth slide + bump

MOVING PLATFORM (continuous):
  Platform on:      Vol=0.4, brief activation sound
  Moving loop:      Vol=0.3, Looped, mechanical movement
  Direction change: Vol=0.4, brief mechanical clunk
  Platform off:     Vol=0.4, brief deactivation sound

ROTATING PLATFORM:
  Rotation loop:    Vol=0.3, Looped, gear/motor sound
  Speed-based pitch: PlaybackSpeed scales with angular velocity

--- TRAPS & HAZARDS ---

SPIKE TRAP:
  Pre-warning (0.5s before):  Vol=0.5, brief mechanical click
  Extend:                      Vol=0.8, spike slam sound
  Retract:                     Vol=0.5, reverse mechanical
  Hit player:                  Vol=0.7, pierce + pain sound

LASER:
  Laser idle loop:   Vol=0.3, Looped, electric hum
  Laser activate:    Vol=0.8, power surge + beam on
  Laser hit:         Vol=0.7, burn sizzle
  Laser deactivate:  Vol=0.5, power down

FALLING BLOCK:
  Wobble warning:    Vol=0.4, subtle creak before falling
  Fall:              Vol=0.7, whoosh/rush as it falls
  Impact:            Vol=1.0, massive thud + crack, based on size

FIRE TRAP:
  Fire idle:         Vol=0.3, Looped, low crackle
  Fire surge:        Vol=0.8, burst of flame sound
  Burn player:       Vol=0.6, brief burn/pain sound
  Fire extinguish:   Vol=0.5, sizzle/steam

ELECTRIC FLOOR:
  Idle buzz:         Vol=0.3, Looped, electrical hum
  Activation:        Vol=0.9, loud ZAP
  Player hit:        Vol=0.8, electric shock
  Cooldown:          Vol=0.2, fading crackle

--- PORTALS & TELEPORTERS ---

STANDARD TELEPORTER:
  Idle hum:    Vol=0.3, Looped, on telepad part, rolloff min=5 max=30
  Activate:    Vol=0.7, energy power-up on player step
  Teleport out: Vol=0.8, whoosh inward + pop — play at origin
  Teleport in:  Vol=0.8, pop + whoosh outward — play at destination

PORTAL (PERSISTENT):
  Portal open animation: Vol=0.9, power surge + dimensional tear sound
  Portal idle loop:      Vol=0.4, Looped, humming vortex, rolloff min=8 max=60
  Enter portal:          Vol=0.7, warping rush (rising pitch)
  Exit portal:           Vol=0.7, expanding rush (falling pitch)
  Portal close:          Vol=0.9, implosion sound

--- TREES, GRASS, DESTRUCTIBLES ---

BREAKABLE CRATE:
  Small crate: Vol=0.6, wood crack + scatter, PlaybackSpeed=1.0-1.2
  Large crate: Vol=0.8, heavy crack + clatter, PlaybackSpeed=0.85-1.0
  Metal box:   Vol=0.9, metal crumple + crash

TREE CHOP:
  Axe hit:        Vol=0.8, wood thud per hit
  Tree creaking:  Vol=0.6, starts after 3-4 hits, creak loop
  Tree falling:   Vol=0.9, crash + whoosh + ground impact

GLASS BREAK:
  Small glass:   Vol=0.6, light shatter, PlaybackSpeed=1.1-1.3
  Window:        Vol=0.8, full window shatter cascade
  Bottle:        Vol=0.7, pop + tinkle
  Glass floor:   Vol=0.9, massive shatter

ROCK/STONE BREAK:
  Small rock:    Vol=0.6, crack + scatter, PlaybackSpeed=1.0-1.2
  Large boulder: Vol=0.9, deep crack + rumble

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 16: AUDIO DEBUGGING & TESTING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

COMMON AUDIO BUGS AND FIXES:

BUG: Sound plays but player can't hear it
CAUSE: Sound parented to SoundService plays globally; if it has rolloff settings, wrong.
FIX: If 2D sound (UI, music), no rolloff needed; parent to SoundService is correct.
     If 3D positional sound, must parent to a Part in workspace.

BUG: Sound plays on server but no one hears it
CAUSE: Sound:Play() called from a server Script. Audio doesn't replicate to clients.
FIX: Use RemoteEvent to fire clients and play sound locally.
     OR: Parent sound to workspace/part (replicates), but Play() must still be client-side.

BUG: Sound randomly stops
CAUSE: Looped=false and sound reached its end.
FIX: Set Looped=true for ambient/background sounds.

BUG: Sound stutters/pops on loop
CAUSE: Asset's loop points aren't clean, or audio file isn't trimmed correctly.
FIX: Use assets specifically designed for looping (no silence at end, clean loop point).
     Add fade-in/fade-out (0.05s) around loop point using TweenService.

BUG: All sounds suddenly louder after zone change
CAUSE: SoundGroup volumes being stacked or not resetting.
FIX: Always reset SoundGroup volumes before applying new zone settings.

BUG: Echo/reverb persists after leaving cave
CAUSE: SoundService.AmbientReverb not reset on zone exit.
FIX: Ensure TouchEnded on reverb zone resets to Enum.ReverbType.NoReverb.

BUG: Music changes too abruptly
CAUSE: Using :Stop()/:Play() directly instead of crossfade.
FIX: Always use crossfade (1.5-2s TweenService on Volume).

BUG: Sounds pile up causing performance issues
CAUSE: Creating new Sound instances for every SFX without cleanup.
FIX: Use sound pool, or Debris:AddItem(sound, 5) for one-shot sounds.

BUG: Gun sounds delayed from visual effect
CAUSE: Sound fired from server (RemoteEvent delay) instead of client.
FIX: Client plays sound immediately on input; server validates hit separately.

BUG: Footstep sound plays while player is in the air
CAUSE: Not checking if humanoid is on ground before playing.
FIX: Check humanoid.FloorMaterial ~= Enum.Material.Air before playing footstep.

TESTING CHECKLIST:
[ ] All ambient loops play when entering their zones
[ ] All ambient loops stop/fade when leaving zones
[ ] No two identical sounds play simultaneously (cooldown working)
[ ] Footsteps change material correctly (test all material types)
[ ] Music crossfades smoothly (no pop, no silence gap)
[ ] Boss music plays intro sting, transitions per phase
[ ] UI sounds play on every button interaction
[ ] Volume preferences persist across sessions
[ ] 3D sounds have correct positional audio (louder when close, quieter when far)
[ ] Reverb zones apply and remove correctly
[ ] No sounds play from incorrect position (world origin bug)
[ ] Mobile performance: < 24 active sounds at once
[ ] All one-shot sounds cleaned up after playing (Debris or .Ended:Destroy())
[ ] Explosions heard by all nearby players (RemoteEvent firing correctly)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 17: ROBLOX AUDIO ASSET ID PATTERNS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ASSET ID RULES:
  Always use: "rbxassetid://NUMBERHERE"
  Never use: "http://", "/", bare numbers, or any other format
  Example valid: "rbxassetid://507776681"
  Example invalid: "507776681", "rbxasset://507776681"

FREE AUDIO POLICY:
  As of 2022, Roblox requires audio to be uploaded by the creator or be "free" audio.
  All audio assets have owner-based permissions.
  Use Roblox's free audio library (search in Creator Hub) for safe-to-use sounds.
  Creator-uploaded audio: only works if uploaded by you or made public.

AUDIO UPLOAD REQUIREMENTS:
  Max file size: 20MB
  Supported formats: .mp3, .ogg, .flac, .wav
  Recommended: .ogg for best quality-to-size ratio, .mp3 for compatibility
  For looping: ensure clean loop points, normalize to -3dB peak

SETTING SOUND ID FROM MARKETPLACE:
  local snd = Instance.new("Sound")
  snd.SoundId = "rbxassetid://507776681"
  -- Always provide fallback for missing assets:
  snd.Loaded:Connect(function()
      if snd.TimeLength == 0 then
          warn("Sound failed to load: " .. snd.SoundId)
          snd.SoundId = "rbxassetid://FALLBACK_ID"
      end
  end)

CONTENT PROVIDER EVENTS FOR AUDIO:
  game:GetService("ContentProvider").RequestQueueSize  -- how many assets pending
  -- Track loading progress:
  local total = #soundList
  local loaded = 0
  game:GetService("ContentProvider"):PreloadAsync(soundInstances, function(assetId, status)
      loaded = loaded + 1
      -- Update loading bar: loaded/total
  end)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 18: AUDIO DESIGN BY AUDIENCE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

FOR KIDS (age 7-12):
  Music: bright, major key, simple melodies, upbeat tempo
  SFX: cartoonish, exaggerated, satisfying
  Avoid: harsh dissonance, loud jump scares, realistic gore sounds, sustained tension music
  Death sounds: comical, not disturbing
  Level up: very satisfying, big fanfare
  Examples: think Minecraft, Roblox default sounds, Mario

FOR TEENS (age 13-17):
  Music: more complex, can include minor keys, varied genres
  SFX: more realistic but still stylized
  Can include: mild tension, combat sounds
  Avoid: extreme horror, very disturbing sounds
  Key: audio should feel "cool" not childish

FOR ALL ROBLOX (ForjeGames target):
  Default to teen-appropriate audio
  Music: genre fits the game type
  SFX: satisfying and responsive
  Key requirement: audio must feel GOOD to interact with
  Test: close your eyes, listen for 30s — does it feel like a quality game?

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 19: EMERGENCY AUDIO SETUP (30 MINUTES)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

If you need to add audio to a game quickly, minimum viable audio setup:

PRIORITY ORDER:
1. Background music (1 track, looped, 0.35 volume) — 5 min
2. UI click sound (one sound, 0.45 volume, pitch vary) — 5 min
3. Jump sound (one sound, 0.5 volume) — 3 min
4. Landing sound (one sound, triggered by FloorMaterial change) — 3 min
5. Footstep (simple version, single sound, no material detection) — 5 min
6. Zone ambient loop (if applicable) — 5 min
7. Death sound — 2 min
8. Level up / achievement sound — 2 min

This gives a game from silence to "feels alive" in under 30 minutes.
Each additional hour adds more polish: material footsteps, zone music, combat SFX, etc.

ABSOLUTE MINIMUM SCRIPT:
─────────────────────────
-- LocalScript, StarterPlayerScripts
-- Add this to give a game baseline audio in under 5 minutes

local SS = game:GetService("SoundService")
local sounds = {
    music   = {id="rbxassetid://...", vol=0.35, loop=true},
    click   = {id="rbxassetid://...", vol=0.45, loop=false},
    jump    = {id="rbxassetid://...", vol=0.5,  loop=false},
    land    = {id="rbxassetid://...", vol=0.55, loop=false},
    levelup = {id="rbxassetid://...", vol=0.75, loop=false},
}

local instances = {}
for name, data in pairs(sounds) do
    local s = Instance.new("Sound")
    s.SoundId = data.id
    s.Volume = data.vol
    s.Looped = data.loop
    s.Parent = SS
    instances[name] = s
    if data.loop then s:Play() end
end

local player = game.Players.LocalPlayer
player.CharacterAdded:Connect(function(char)
    local hum = char:WaitForChild("Humanoid")
    local root = char:WaitForChild("HumanoidRootPart")
    instances.jump.Parent = root
    instances.land.Parent = root
    hum.Jumping:Connect(function(active)
        if active then instances.jump:Play() end
    end)
    local prevFloor = Enum.Material.Air
    hum:GetPropertyChangedSignal("FloorMaterial"):Connect(function()
        local mat = hum.FloorMaterial
        if prevFloor == Enum.Material.Air and mat ~= Enum.Material.Air then
            instances.land.PlaybackSpeed = 0.9 + math.random() * 0.2
            instances.land:Play()
        end
        prevFloor = mat
    end)
end)

-- Wire UI clicks
for _, btn in ipairs(player.PlayerGui:GetDescendants()) do
    if btn:IsA("GuiButton") then
        btn.MouseButton1Click:Connect(function()
            instances.click.PlaybackSpeed = 1.0 + math.random() * 0.15
            instances.click:Play()
        end)
    end
end

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 20: AUDIO MASTERCLASS — QUALITY BENCHMARKS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

WHAT SEPARATES GOOD FROM GREAT AUDIO:

GOOD game audio:
  - Has sounds for major actions
  - Music plays in background
  - No silence (ambient loop exists)
  - Volume levels roughly balanced

GREAT game audio:
  - Every action has layered, varied sounds (not just one sound per action)
  - Music dynamically responds to game state
  - 3D spatial audio positioned correctly
  - Ambient soundscapes layered with stingers
  - Sounds vary in pitch and volume on each play
  - Crossfades between music zones
  - Player preferences saved
  - No sound pops or clicks at loop points
  - Reverb matches environment (cave sounds echo, outdoor doesn't)
  - Boss fights have multi-phase music
  - Audio provides gameplay information (footstep on metal = floor type)
  - UI sounds feel satisfying, not annoying

ROBLOX TOP GAMES AUDIO ANALYSIS:
  Brookhaven:  Ambient radio music, zone-based songs, minimal SFX — gets by on music quality
  Adopt Me:    Bright cheerful music, satisfying UI sounds, pet sounds
  Blox Fruits: Combat SFX heavy, multiple weapon types, boss music
  Arsenal:     Tight gun SFX, fast UI, minimal ambient — shooter feel
  Tower of Hell: Simple but effective — success fanfares drive motivation

WHAT ForjeGames BUILDS SHOULD HAVE (minimum):
1. Background music loop (game-appropriate genre)
2. Jump + land sounds
3. UI click/hover (if there's UI)
4. Action feedback sounds (whatever main action is)
5. Ambient loop (appropriate to setting)
6. Success/achievement sound (if game has objectives)

VOLUME MIXING PHILOSOPHY:
  The goal is a mix that sounds like a professional game.
  Not too loud (exhausting), not too quiet (dead feeling).
  Test on headphones AND laptop speakers.
  Mobile volumes: reduce SFX by ~10%, music sounds fine.
  Final mix: no single sound should surprise or hurt when it plays.
  Close your eyes: the audio tells you what's happening in the game.

FINAL CHECKLIST — AUDIO QUALITY AUDIT:
[ ] Every main action has a sound
[ ] No sound causes audio fatigue after 10 minutes of play
[ ] Music loops are seamless (no click at loop point)
[ ] All 3D sounds positioned correctly (come from right direction)
[ ] Volume is consistent — no sudden loud outliers
[ ] Pitch variation applied to all repeated sounds
[ ] Ambient loops running in appropriate areas
[ ] Music transitions are smooth (crossfade, not cut)
[ ] Mobile performance verified (< 24 active sounds)
[ ] Memory cleanup in place (Debris or .Ended cleanup)
[ ] User volume preferences implemented and saved
[ ] Audio tested on headphones, speakers, and mobile
`
