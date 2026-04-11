/**
 * Server-side SVG text overlay renderer.
 *
 * FAL image models famously can't render legible in-image text. Instead of
 * re-prompting until we get lucky (expensive + slow), we generate the
 * background separately and then composite a crisp SVG text layer on top.
 *
 * This module returns a 1920×1080 SVG string whose text can be:
 *   - positioned (top, bottom, left-bar, none)
 *   - sized (huge, mega)
 *   - styled (outlined, shadowed, gradient, neon)
 *
 * The SVG is designed to composite cleanly on top of the generated FAL
 * image either client-side (<img> stacked in a div) or server-side via
 * sharp.composite() with an SVG buffer.
 *
 * Design goals:
 *   - Zero dependencies, pure string output.
 *   - Auto-wrapping for longer headlines so the caller doesn't have to
 *     compute line breaks.
 *   - Readable from a 256×144 thumbnail crop — stroke widths are tuned for
 *     the Roblox game listing thumbnail size.
 */

import type { ThumbnailComposition } from './thumbnail-presets'

export const THUMBNAIL_WIDTH = 1920
export const THUMBNAIL_HEIGHT = 1080

export interface RenderTextOverlayParams {
  text: string
  style: ThumbnailComposition['textStyle']
  position: ThumbnailComposition['textPosition']
  size: ThumbnailComposition['textSize']
  color: string
  /** Optional second accent used by gradient and neon styles. */
  accentColor?: string
}

interface LayoutRect {
  x: number
  y: number
  width: number
  height: number
  anchor: 'start' | 'middle' | 'end'
  rotate?: number
}

// ─── Font sizing ────────────────────────────────────────────────────────────
// Numbers are in pixel space of the 1920×1080 canvas. They were hand-tuned to
// remain readable when the thumbnail is scaled down to Roblox's tiny
// game-listing size (about 256×144).

const FONT_SIZE: Record<'huge' | 'mega', number> = {
  huge: 150,
  mega: 220,
}

const STROKE_WIDTH: Record<'huge' | 'mega', number> = {
  huge: 10,
  mega: 14,
}

// ─── Text wrapping ─────────────────────────────────────────────────────────

/**
 * Very fast heuristic word-wrapper. We don't have font metrics on the server,
 * so we approximate using an average glyph width derived from the font size.
 * For a bold sans-serif at pixel size P the average advance is ~0.55*P, which
 * gets us within one character of ideal wrapping on short headlines.
 */
export function wrapHeadline(
  text: string,
  fontSize: number,
  maxWidth: number,
): string[] {
  const avgGlyph = fontSize * 0.55
  const charsPerLine = Math.max(4, Math.floor(maxWidth / avgGlyph))
  const words = text.trim().split(/\s+/).filter(Boolean)
  const lines: string[] = []
  let current = ''

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word
    if (candidate.length <= charsPerLine) {
      current = candidate
    } else {
      if (current) lines.push(current)
      // If a single word is longer than charsPerLine, hard-split it.
      if (word.length > charsPerLine) {
        for (let i = 0; i < word.length; i += charsPerLine) {
          lines.push(word.slice(i, i + charsPerLine))
        }
        current = ''
      } else {
        current = word
      }
    }
  }
  if (current) lines.push(current)
  return lines.length ? lines : [text]
}

// ─── Layout per position ───────────────────────────────────────────────────

function computeLayout(
  position: ThumbnailComposition['textPosition'],
  fontSize: number,
  lineCount: number,
): LayoutRect {
  const padding = 80
  const lineHeight = fontSize * 1.15
  const totalTextHeight = lineHeight * lineCount

  switch (position) {
    case 'top':
      return {
        x: THUMBNAIL_WIDTH / 2,
        y: padding + fontSize * 0.85,
        width: THUMBNAIL_WIDTH - padding * 2,
        height: totalTextHeight,
        anchor: 'middle',
      }
    case 'bottom':
      return {
        x: THUMBNAIL_WIDTH / 2,
        y: THUMBNAIL_HEIGHT - padding - totalTextHeight + fontSize * 0.85,
        width: THUMBNAIL_WIDTH - padding * 2,
        height: totalTextHeight,
        anchor: 'middle',
      }
    case 'left-bar':
      return {
        x: padding,
        y: THUMBNAIL_HEIGHT / 2 - totalTextHeight / 2 + fontSize * 0.85,
        width: THUMBNAIL_WIDTH * 0.4,
        height: totalTextHeight,
        anchor: 'start',
      }
    case 'none':
    default:
      return {
        x: 0,
        y: 0,
        width: 0,
        height: 0,
        anchor: 'start',
      }
  }
}

// ─── SVG escaping ──────────────────────────────────────────────────────────

export function escapeSvg(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

// ─── Style-specific SVG fragments ───────────────────────────────────────────

interface StyleFragments {
  defs: string
  textAttrs: string
  shadowLayer: (line: string, x: number, y: number, anchor: string) => string
}

function buildStyle(
  style: ThumbnailComposition['textStyle'],
  color: string,
  accent: string,
  fontSize: number,
): StyleFragments {
  const stroke = STROKE_WIDTH[fontSize >= 200 ? 'mega' : 'huge']
  const fontFamily =
    '"Arial Black", "Impact", "Anton", "Helvetica Neue", sans-serif'

  const commonTextAttrs = `font-family='${fontFamily}' font-size='${fontSize}' font-weight='900' letter-spacing='-2' paint-order='stroke'`

  switch (style) {
    case 'outlined': {
      return {
        defs: '',
        textAttrs: `${commonTextAttrs} fill='${color}' stroke='#000000' stroke-width='${stroke}' stroke-linejoin='round'`,
        shadowLayer: () => '',
      }
    }
    case 'shadowed': {
      return {
        defs: `<filter id='ts-shadow' x='-20%' y='-20%' width='140%' height='140%'><feDropShadow dx='8' dy='10' stdDeviation='6' flood-color='#000000' flood-opacity='0.85'/></filter>`,
        textAttrs: `${commonTextAttrs} fill='${color}' filter='url(#ts-shadow)'`,
        shadowLayer: () => '',
      }
    }
    case 'gradient': {
      return {
        defs: `<linearGradient id='ts-grad' x1='0' y1='0' x2='0' y2='1'>
          <stop offset='0%' stop-color='${color}'/>
          <stop offset='100%' stop-color='${accent}'/>
        </linearGradient>
        <filter id='ts-grad-shadow' x='-20%' y='-20%' width='140%' height='140%'>
          <feDropShadow dx='6' dy='8' stdDeviation='5' flood-color='#000000' flood-opacity='0.8'/>
        </filter>`,
        textAttrs: `${commonTextAttrs} fill='url(#ts-grad)' stroke='#000000' stroke-width='${stroke}' stroke-linejoin='round' filter='url(#ts-grad-shadow)'`,
        shadowLayer: () => '',
      }
    }
    case 'neon': {
      return {
        defs: `<filter id='ts-neon' x='-50%' y='-50%' width='200%' height='200%'>
          <feGaussianBlur in='SourceGraphic' stdDeviation='8' result='blur1'/>
          <feGaussianBlur in='SourceGraphic' stdDeviation='18' result='blur2'/>
          <feMerge>
            <feMergeNode in='blur2'/>
            <feMergeNode in='blur1'/>
            <feMergeNode in='SourceGraphic'/>
          </feMerge>
        </filter>`,
        textAttrs: `${commonTextAttrs} fill='${color}' stroke='${accent}' stroke-width='${Math.round(stroke / 2)}' filter='url(#ts-neon)'`,
        shadowLayer: () => '',
      }
    }
  }
}

// ─── Public API ────────────────────────────────────────────────────────────

export interface RenderedOverlay {
  /** Full SVG document string, 1920×1080. */
  svg: string
  /** Base64 data URI — convenient for <img src=...>. */
  dataUri: string
  /** Number of lines the text was wrapped to. */
  lineCount: number
}

/**
 * Render the text overlay as a full-canvas SVG. Empty string is returned
 * when `position === 'none'` or text is blank — callers should treat that
 * as "no overlay needed".
 */
export function renderTextOverlay(
  params: RenderTextOverlayParams,
): RenderedOverlay {
  const { text, style, position, size, color } = params
  const accent = params.accentColor ?? '#000000'

  if (position === 'none' || !text.trim()) {
    const emptySvg = `<svg xmlns='http://www.w3.org/2000/svg' width='${THUMBNAIL_WIDTH}' height='${THUMBNAIL_HEIGHT}' viewBox='0 0 ${THUMBNAIL_WIDTH} ${THUMBNAIL_HEIGHT}'></svg>`
    return {
      svg: emptySvg,
      dataUri: `data:image/svg+xml;base64,${Buffer.from(emptySvg).toString('base64')}`,
      lineCount: 0,
    }
  }

  const fontSize = FONT_SIZE[size]

  // Constrain wrap width by position — left-bar is narrower.
  const wrapWidth =
    position === 'left-bar' ? THUMBNAIL_WIDTH * 0.4 : THUMBNAIL_WIDTH - 160
  const lines = wrapHeadline(text.toUpperCase(), fontSize, wrapWidth)
  const layout = computeLayout(position, fontSize, lines.length)
  const styleFrag = buildStyle(style, color, accent, fontSize)
  const lineHeight = fontSize * 1.15

  const tspans = lines
    .map((line, i) => {
      const dy = i === 0 ? 0 : lineHeight
      return `<tspan x='${layout.x}' dy='${dy}'>${escapeSvg(line)}</tspan>`
    })
    .join('')

  const svg =
    `<svg xmlns='http://www.w3.org/2000/svg' width='${THUMBNAIL_WIDTH}' height='${THUMBNAIL_HEIGHT}' viewBox='0 0 ${THUMBNAIL_WIDTH} ${THUMBNAIL_HEIGHT}'>` +
    `<defs>${styleFrag.defs}</defs>` +
    `<text x='${layout.x}' y='${layout.y}' text-anchor='${layout.anchor}' ${styleFrag.textAttrs}>${tspans}</text>` +
    `</svg>`

  return {
    svg,
    dataUri: `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`,
    lineCount: lines.length,
  }
}
