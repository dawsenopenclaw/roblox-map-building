/**
 * prompt-templates/index.ts
 *
 * Central barrel export for all prompt template libraries.
 * Consumers should import from `@/lib/ai/prompt-templates` so individual
 * template files remain an implementation detail.
 */

export {
  BUILD_TEMPLATES,
  resolveBuildTemplate,
  type Genre,
} from './build-templates'

export {
  SCRIPT_TEMPLATES,
  resolveScriptTemplate,
  type ScriptKind,
} from './script-templates'

export {
  MESH_TEMPLATES,
  resolveMeshTemplate,
  type MeshStyle,
  type MeshTemplate,
} from './mesh-templates'

export {
  MUSIC_TEMPLATES,
  SFX_TEMPLATES,
  VOICE_TEMPLATES,
  resolveMusicTemplate,
  type MusicMood,
  type MusicTemplate,
  type SfxCategory,
  type SfxTemplate,
  type VoiceRole,
  type VoiceTemplate,
} from './audio-templates'
