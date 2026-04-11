/**
 * Luau string literal safety helper.
 *
 * User-supplied descriptions and display strings that are embedded into
 * double-quoted Luau string literals must have backslashes, quotes,
 * newlines, and other control characters escaped. Otherwise the generated
 * Luau source is invalid or (worse) can break out of the literal and allow
 * injection of arbitrary code into the generated script.
 *
 * This helper returns an escaped body WITHOUT surrounding quotes, so callers
 * can do:  `"${safeLuaString(description)}"`  inside a template literal.
 *
 * Escapes applied:
 *   \  -> \\
 *   "  -> \"
 *   \n -> \n (literal two chars)
 *   \r -> \r
 *   \t -> \t
 *   Other control chars (< 0x20) are dropped.
 */
export function safeLuaString(input: string): string {
  const s = String(input ?? '')
  let out = ''
  for (let i = 0; i < s.length; i++) {
    const ch = s.charCodeAt(i)
    // Handle escape-worthy chars first
    if (ch === 0x5c /* \ */) {
      out += '\\\\'
      continue
    }
    if (ch === 0x22 /* " */) {
      out += '\\"'
      continue
    }
    if (ch === 0x0a /* \n */) {
      out += '\\n'
      continue
    }
    if (ch === 0x0d /* \r */) {
      out += '\\r'
      continue
    }
    if (ch === 0x09 /* \t */) {
      out += '\\t'
      continue
    }
    // Drop other control chars (including 0x00-0x08, 0x0b, 0x0c, 0x0e-0x1f, 0x7f)
    if (ch < 0x20 || ch === 0x7f) {
      continue
    }
    out += s[i]
  }
  return out
}
