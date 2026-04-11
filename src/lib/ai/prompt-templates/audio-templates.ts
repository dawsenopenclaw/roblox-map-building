/**
 * audio-templates.ts
 *
 * Prompt templates for FAL audio generation: music, SFX, voice.
 *
 * Key insight: FAL's music model (stable-audio / musicgen) responds best to
 * prompts that describe GENRE + INSTRUMENTATION + TEMPO + MOOD, in that
 * order. SFX prompts want SUBJECT + DURATION + ENVIRONMENT. Voice prompts
 * want TONE + PACING + EMOTION + CONTEXT.
 */

// ───────────────────────────────────────────────────────────────────────────
// Music templates
// ───────────────────────────────────────────────────────────────────────────

export type MusicMood =
  | 'epic-heroic'
  | 'dark-foreboding'
  | 'peaceful-exploration'
  | 'mysterious-ambient'
  | 'tense-combat'
  | 'victory-fanfare'
  | 'cyberpunk-synth'
  | 'tropical-upbeat'
  | 'western-frontier'
  | 'retro-8bit'

export interface MusicTemplate {
  id: MusicMood
  /** The full FAL prompt. */
  prompt: string
  /** Default duration in seconds. */
  durationSeconds: number
  /** Whether the track should loop cleanly. */
  loopable: boolean
}

export const MUSIC_TEMPLATES: Record<MusicMood, MusicTemplate> = {
  'epic-heroic': {
    id: 'epic-heroic',
    prompt:
      'Epic orchestral heroic fantasy soundtrack, soaring French horns and strings, thundering timpani and taiko drums, 120 BPM, triumphant major key, cinematic Hans Zimmer style, inspiring and grand',
    durationSeconds: 60,
    loopable: true,
  },
  'dark-foreboding': {
    id: 'dark-foreboding',
    prompt:
      'Dark foreboding ambient soundtrack, deep cello drones, sparse minor-key piano, distant choir whispers, 60 BPM, unsettling tension, Bloodborne / Dark Souls inspired, no percussion',
    durationSeconds: 90,
    loopable: true,
  },
  'peaceful-exploration': {
    id: 'peaceful-exploration',
    prompt:
      'Peaceful exploration soundtrack, soft acoustic guitar and flute, gentle bells, wind chimes, 80 BPM, warm major key, Studio Ghibli / Zelda Breath of the Wild vibe, pastoral and calming',
    durationSeconds: 90,
    loopable: true,
  },
  'mysterious-ambient': {
    id: 'mysterious-ambient',
    prompt:
      'Mysterious ambient drone, ethereal synth pads, distant wind textures, sparse glockenspiel, 55 BPM, suspended tonality, otherworldly, no clear melody, cinematic background',
    durationSeconds: 120,
    loopable: true,
  },
  'tense-combat': {
    id: 'tense-combat',
    prompt:
      'Tense combat soundtrack, driving electric cello ostinato, aggressive percussion, brass stabs, 140 BPM, minor key, adrenaline-pumping, relentless forward motion',
    durationSeconds: 90,
    loopable: true,
  },
  'victory-fanfare': {
    id: 'victory-fanfare',
    prompt:
      'Triumphant victory fanfare, bright brass section, crashing cymbals, rising string runs, 130 BPM, resolving to major tonic, celebratory and conclusive',
    durationSeconds: 8,
    loopable: false,
  },
  'cyberpunk-synth': {
    id: 'cyberpunk-synth',
    prompt:
      'Cyberpunk synthwave soundtrack, arpeggiated analog synths, gated reverb drums, distorted bass, 110 BPM, neon-soaked dystopian mood, Blade Runner inspired, rain ambience in background',
    durationSeconds: 90,
    loopable: true,
  },
  'tropical-upbeat': {
    id: 'tropical-upbeat',
    prompt:
      'Tropical upbeat soundtrack, steel drums, ukulele, marimba, shaker, 115 BPM, major key, sunny island vibe, Mario Sunshine inspired, bright and playful',
    durationSeconds: 60,
    loopable: true,
  },
  'western-frontier': {
    id: 'western-frontier',
    prompt:
      'Western frontier soundtrack, acoustic guitar with tremolo, lonesome harmonica, banjo, distant whistle melody, 90 BPM, Ennio Morricone inspired, wide open vista mood',
    durationSeconds: 60,
    loopable: true,
  },
  'retro-8bit': {
    id: 'retro-8bit',
    prompt:
      'Retro 8-bit chiptune soundtrack, square-wave lead melody, triangle-wave bass, noise-channel percussion, 150 BPM, catchy hook, NES Mega Man inspired, upbeat and nostalgic',
    durationSeconds: 45,
    loopable: true,
  },
}

// ───────────────────────────────────────────────────────────────────────────
// SFX templates
// ───────────────────────────────────────────────────────────────────────────

export type SfxCategory =
  | 'ui-click'
  | 'ui-confirm'
  | 'ui-error'
  | 'coin-pickup'
  | 'powerup'
  | 'door-open'
  | 'sword-swing'
  | 'gun-shot'
  | 'explosion'
  | 'footstep-wood'
  | 'footstep-stone'
  | 'ambient-forest'
  | 'ambient-city'
  | 'water-splash'
  | 'magic-cast'

export interface SfxTemplate {
  id: SfxCategory
  prompt: string
  durationSeconds: number
}

export const SFX_TEMPLATES: Record<SfxCategory, SfxTemplate> = {
  'ui-click': { id: 'ui-click', prompt: 'Crisp UI button click, short plastic tap, 50ms duration, bright attack, no reverb, clean', durationSeconds: 0.1 },
  'ui-confirm': { id: 'ui-confirm', prompt: 'Pleasant UI confirmation chime, rising two-note arpeggio, bell timbre, 300ms, slight reverb', durationSeconds: 0.4 },
  'ui-error': { id: 'ui-error', prompt: 'UI error buzz, low descending tone, 200ms, slightly distorted, warning feel', durationSeconds: 0.3 },
  'coin-pickup': { id: 'coin-pickup', prompt: 'Bright metallic coin pickup, single chime with slight pitch shimmer, 200ms, arcade style', durationSeconds: 0.25 },
  powerup: { id: 'powerup', prompt: 'Energetic powerup sound, rising synth sweep with sparkle layer, 800ms, triumphant', durationSeconds: 0.8 },
  'door-open': { id: 'door-open', prompt: 'Heavy wooden door creaking open, old iron hinges, 1.5 second duration, close-mic recording', durationSeconds: 1.5 },
  'sword-swing': { id: 'sword-swing', prompt: 'Sharp sword swing whoosh through air, metal ring at start, 400ms, no impact', durationSeconds: 0.4 },
  'gun-shot': { id: 'gun-shot', prompt: 'Punchy pistol gunshot, close mic, sharp crack, slight room tail, 300ms', durationSeconds: 0.3 },
  explosion: { id: 'explosion', prompt: 'Large explosion, low rumble punch + debris crackle, 2 second tail, cinematic', durationSeconds: 2.0 },
  'footstep-wood': { id: 'footstep-wood', prompt: 'Single heavy footstep on creaky wooden floorboard, 150ms, close mic', durationSeconds: 0.15 },
  'footstep-stone': { id: 'footstep-stone', prompt: 'Single footstep on hard stone floor, boot sole impact, slight echo, 150ms', durationSeconds: 0.15 },
  'ambient-forest': { id: 'ambient-forest', prompt: 'Peaceful forest ambience, birdsong, distant wind through leaves, gentle rustling, no music, loopable', durationSeconds: 30 },
  'ambient-city': { id: 'ambient-city', prompt: 'Busy modern city ambience, distant traffic, occasional horn, muffled crowds, no music, loopable', durationSeconds: 30 },
  'water-splash': { id: 'water-splash', prompt: 'Medium water splash, object hitting pond surface, 500ms, natural reverb tail', durationSeconds: 0.5 },
  'magic-cast': { id: 'magic-cast', prompt: 'Magical spell cast, shimmering crystalline build-up, whoosh release, 1 second, fantasy RPG feel', durationSeconds: 1.0 },
}

// ───────────────────────────────────────────────────────────────────────────
// Voice templates
// ───────────────────────────────────────────────────────────────────────────

export type VoiceRole =
  | 'narrator-epic'
  | 'narrator-calm'
  | 'quest-giver'
  | 'merchant'
  | 'villain'
  | 'companion'
  | 'announcer'

export interface VoiceTemplate {
  id: VoiceRole
  /** System/reference description for FAL voice models. */
  reference: string
  /** Default voice id when using a pre-trained voice library. */
  voiceId: string
  /** Recommended speed (0.5 - 2.0). */
  speed: number
}

export const VOICE_TEMPLATES: Record<VoiceRole, VoiceTemplate> = {
  'narrator-epic': { id: 'narrator-epic', reference: 'Deep masculine epic narrator, slow pacing, dramatic pauses, cinematic movie-trailer tone', voiceId: 'narrator-male-deep', speed: 0.9 },
  'narrator-calm': { id: 'narrator-calm', reference: 'Warm gentle narrator, medium pacing, friendly teacher tone, reassuring', voiceId: 'narrator-neutral', speed: 1.0 },
  'quest-giver': { id: 'quest-giver', reference: 'Grizzled older character, gruff voice, deliberate speech, slight gravelly texture, medieval innkeeper', voiceId: 'old-male-gruff', speed: 0.95 },
  merchant: { id: 'merchant', reference: 'Chipper friendly shopkeeper, upbeat pace, slight accent, sing-song sales pitch tone', voiceId: 'male-merchant', speed: 1.1 },
  villain: { id: 'villain', reference: 'Sinister whispering villain, slow deliberate pacing, cold menacing tone, slight reverb', voiceId: 'villain-male', speed: 0.85 },
  companion: { id: 'companion', reference: 'Friendly young companion, energetic, medium-high pitch, enthusiastic', voiceId: 'companion-youth', speed: 1.1 },
  announcer: { id: 'announcer', reference: 'Sports-style announcer, loud energetic delivery, punchy emphasis on key words', voiceId: 'announcer-male', speed: 1.15 },
}

export function resolveMusicTemplate(moodHint: string | undefined): MusicTemplate {
  const hint = (moodHint ?? '').toLowerCase()
  if (hint.includes('dark') || hint.includes('foreboding') || hint.includes('horror')) return MUSIC_TEMPLATES['dark-foreboding']
  if (hint.includes('epic') || hint.includes('heroic') || hint.includes('fantasy')) return MUSIC_TEMPLATES['epic-heroic']
  if (hint.includes('cyber') || hint.includes('synth')) return MUSIC_TEMPLATES['cyberpunk-synth']
  if (hint.includes('tropical') || hint.includes('beach') || hint.includes('island')) return MUSIC_TEMPLATES['tropical-upbeat']
  if (hint.includes('western') || hint.includes('frontier')) return MUSIC_TEMPLATES['western-frontier']
  if (hint.includes('combat') || hint.includes('battle') || hint.includes('fight')) return MUSIC_TEMPLATES['tense-combat']
  if (hint.includes('victory') || hint.includes('win')) return MUSIC_TEMPLATES['victory-fanfare']
  if (hint.includes('retro') || hint.includes('8bit') || hint.includes('chiptune')) return MUSIC_TEMPLATES['retro-8bit']
  if (hint.includes('mystery') || hint.includes('ambient')) return MUSIC_TEMPLATES['mysterious-ambient']
  return MUSIC_TEMPLATES['peaceful-exploration']
}
