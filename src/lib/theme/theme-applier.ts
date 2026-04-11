/**
 * Theme Applier — stub implementation.
 *
 * TODO(theme-applier): full implementation pending. This module is the
 * bridge between a `ThemePreset` (colors, materials, lighting, SFX flavor)
 * and a live project: it will eventually walk a project's build tree and
 * mutate lighting, skybox, material assignments, and UI accents so the
 * build matches its detected theme.
 *
 * For now, this file exists so `import { applyTheme }` resolves at build
 * time and downstream callers can be wired up ahead of the real
 * implementation landing.
 */

import { THEME_PRESETS, type ThemePreset } from './theme-presets'

/**
 * Minimal structural shape of a "project" as the theme applier sees it.
 * The real Project type lives in the Prisma schema / project service, but
 * the applier only needs an id to look up the build. Kept structural so we
 * don't pull in Prisma types from a shared module.
 */
export interface ThemeApplierProject {
  id: string
  name?: string
}

export interface ApplyThemeOptions {
  /**
   * When true, pre-existing lighting/material overrides on the project are
   * preserved. Default: false (applier is authoritative).
   */
  preserveOverrides?: boolean
}

export interface ApplyThemeResult {
  themeId: string
  applied: boolean
  /** Non-fatal warnings (unknown theme, missing project build, etc.) */
  warnings: string[]
}

/**
 * Look up a theme preset by id. Returns `undefined` if the id is not a
 * known preset so callers can fall back gracefully.
 */
export function getThemePreset(themeName: string): ThemePreset | undefined {
  return THEME_PRESETS[themeName]
}

/**
 * Apply a theme to a project.
 *
 * TODO(theme-applier): full implementation pending. Today this is a no-op
 * that validates the theme id and returns. When implemented it will:
 *   1. Look up the ThemePreset by id
 *   2. Load the project's latest build (from DB / cache)
 *   3. Patch Lighting (ambient, brightness, clock, fog, technology)
 *   4. Patch Skybox if the preset defines one
 *   5. Walk BaseParts and re-assign materials per the preset's material list
 *   6. Patch UI accent tokens (uiAccent, uiFontFamily)
 *   7. Persist the patched build
 */
export async function applyTheme(
  themeName: string,
  project: ThemeApplierProject,
  opts: ApplyThemeOptions = {},
): Promise<void> {
  // Reference `opts` so strict TS doesn't flag it as unused in the stub.
  void opts

  const preset = getThemePreset(themeName)
  if (!preset) {
    // TODO(theme-applier): surface this via the project's build-log stream
    // instead of console once the log bus is wired up.
    console.warn(
      `[theme-applier] Unknown theme "${themeName}" for project ${project.id}; skipping apply.`,
    )
    return
  }

  // TODO(theme-applier): walk the project's build tree and mutate lighting,
  // materials, skybox, and UI tokens according to `preset`. For now this is
  // a no-op so callers can be wired up without breaking the build.
}

/**
 * Verbose variant that returns structured status + warnings instead of
 * `void`. Useful for API routes that want to surface "what happened" back
 * to the UI without parsing logs.
 */
export async function applyThemeVerbose(
  themeName: string,
  project: ThemeApplierProject,
  opts: ApplyThemeOptions = {},
): Promise<ApplyThemeResult> {
  const warnings: string[] = []
  const preset = getThemePreset(themeName)
  if (!preset) {
    warnings.push(`unknown theme: ${themeName}`)
    return { themeId: themeName, applied: false, warnings }
  }
  await applyTheme(themeName, project, opts)
  return { themeId: preset.id, applied: true, warnings }
}
