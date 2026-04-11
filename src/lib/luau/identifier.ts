/**
 * Luau identifier safety helper.
 *
 * When user-supplied strings (currency names, item names, NPC names, etc.)
 * are interpolated directly into generated Luau source, they must form a
 * valid Luau identifier, otherwise the emitted script will fail to compile
 * in Roblox Studio. This helper sanitises arbitrary input so it is always
 * safe to interpolate into positions like `local ${x} = {}` or `${x}Service`.
 *
 * Rules (applied in order):
 *   1. Strip any character that is not an ASCII letter, digit, or underscore.
 *   2. If the result starts with a digit, prefix it with `_`.
 *   3. If the result is a Lua/Luau reserved keyword, append `_var`.
 *   4. If the result is empty (e.g. input was all punctuation), return
 *      the provided fallback.
 *
 * The fallback is assumed to already be a valid identifier — callers should
 * pass a hard-coded literal such as `'Coins'` or `'MainShop'`.
 */

const LUA_RESERVED_KEYWORDS: ReadonlySet<string> = new Set([
  'and',
  'break',
  'do',
  'else',
  'elseif',
  'end',
  'false',
  'for',
  'function',
  'if',
  'in',
  'local',
  'nil',
  'not',
  'or',
  'repeat',
  'return',
  'then',
  'true',
  'until',
  'while',
])

export function safeLuaIdentifier(input: string, fallback: string): string {
  const stripped = String(input ?? '').replace(/[^A-Za-z0-9_]/g, '')
  if (stripped.length === 0) return fallback

  let result = stripped
  if (/^[0-9]/.test(result)) {
    result = `_${result}`
  }
  if (LUA_RESERVED_KEYWORDS.has(result)) {
    result = `${result}_var`
  }
  return result
}

export { LUA_RESERVED_KEYWORDS }
