/**
 * GUI Quality Auditor — Ensures generated UI code meets PSX/Adopt Me quality standards.
 *
 * Scans generated Luau UI code and checks for:
 * 1. Dark theme (not default gray)
 * 2. UICorner on frames/buttons
 * 3. TweenService animations
 * 4. Close button
 * 5. Proper fonts (GothamBold/GothamMedium)
 * 6. Hover effects on buttons
 * 7. Scale sizing (not all fixed pixel)
 * 8. ChangeHistoryService wrapping
 * 9. ResetOnSpawn = false
 * 10. UIPadding on containers
 *
 * Returns a score 0-100 and list of issues with auto-fix suggestions.
 * Runs alongside the build auditor on UI-intent builds.
 */

export interface GuiAuditIssue {
  check: string
  passed: boolean
  severity: 'error' | 'warning' | 'info'
  message: string
  fix?: string
}

export interface GuiAuditResult {
  score: number
  issues: GuiAuditIssue[]
  isGuiCode: boolean
  summary: string
}

/**
 * Audit generated Luau code for GUI quality.
 * Only runs meaningful checks if code appears to be UI-related.
 */
export function auditGui(code: string): GuiAuditResult {
  const issues: GuiAuditIssue[] = []

  // First, detect if this is GUI code at all
  const isGuiCode = /ScreenGui|StarterGui|TextButton|TextLabel|Frame|ScrollingFrame|ImageButton|ImageLabel/i.test(code)
  if (!isGuiCode) {
    return { score: 100, issues: [], isGuiCode: false, summary: 'Not UI code — skipped' }
  }

  // 1. Dark theme check — default gray (163,162,165) or white backgrounds are bad
  const hasDefaultGray = /Color3\.fromRGB\s*\(\s*163\s*,\s*162\s*,\s*165\s*\)/.test(code)
  const hasWhiteBg = /BackgroundColor3\s*=\s*Color3\.fromRGB\s*\(\s*(?:255|240|230)\s*,\s*(?:255|240|230)\s*,\s*(?:255|240|230)\s*\)/.test(code)
  const hasDarkTheme = /Color3\.fromRGB\s*\(\s*(?:[12]\d|3[0-5])\s*,\s*(?:[12]\d|3[0-5])\s*,\s*(?:[12]\d|3[0-8])\s*\)/.test(code)
  issues.push({
    check: 'dark_theme',
    passed: hasDarkTheme && !hasDefaultGray && !hasWhiteBg,
    severity: hasDefaultGray || hasWhiteBg ? 'error' : 'warning',
    message: hasDarkTheme ? 'Dark theme colors detected' : 'No dark theme colors found — UI will look like a dev placeholder',
    fix: hasDefaultGray ? 'Replace Color3.fromRGB(163,162,165) with Color3.fromRGB(20,20,20) for background' : undefined,
  })

  // 2. UICorner check
  const hasUICorner = /UICorner|addCorner/.test(code)
  const frameCount = (code.match(/Instance\.new\s*\(\s*["']Frame["']\s*\)/g) || []).length
  const cornerCount = (code.match(/UICorner|addCorner/g) || []).length
  issues.push({
    check: 'ui_corner',
    passed: hasUICorner && cornerCount >= Math.max(1, Math.floor(frameCount * 0.5)),
    severity: hasUICorner ? 'info' : 'error',
    message: hasUICorner ? `${cornerCount} UICorner instances for ${frameCount} frames` : 'No UICorner found — all frames will have sharp corners',
    fix: !hasUICorner ? 'Add UICorner with CornerRadius UDim.new(0, 8) to every Frame and Button' : undefined,
  })

  // 3. TweenService animations
  const hasTween = /TweenService|TweenInfo/.test(code)
  const tweenCount = (code.match(/TweenService:Create|:Create\(/g) || []).length
  issues.push({
    check: 'animations',
    passed: hasTween,
    severity: hasTween ? 'info' : 'warning',
    message: hasTween ? `${tweenCount} TweenService animations found` : 'No TweenService animations — UI will feel static and cheap',
    fix: !hasTween ? 'Add TweenService:Create(frame, TweenInfo.new(0.3, Enum.EasingStyle.Exponential), {Position = ...}) for open/close' : undefined,
  })

  // 4. Close button
  const hasCloseBtn = /close|Close|"X"|makeCloseBtn/i.test(code) && /TextButton|ImageButton/.test(code)
  issues.push({
    check: 'close_button',
    passed: hasCloseBtn,
    severity: hasCloseBtn ? 'info' : 'warning',
    message: hasCloseBtn ? 'Close button detected' : 'No close/X button found — user can\'t dismiss the panel',
    fix: !hasCloseBtn ? 'Add a TextButton with text "X" in top-right corner, Position UDim2.new(1,-38,0,8), Size UDim2.new(0,30,0,30)' : undefined,
  })

  // 5. Font quality
  const hasGotham = /GothamBold|GothamMedium|GothamSemibold|FredokaOne/.test(code)
  const hasDefaultFont = /Font\.SourceSans|Font\.Legacy/.test(code)
  issues.push({
    check: 'font_quality',
    passed: hasGotham && !hasDefaultFont,
    severity: hasDefaultFont ? 'error' : hasGotham ? 'info' : 'warning',
    message: hasGotham ? 'Premium fonts (Gotham family) in use' : 'Using default/legacy fonts — looks unprofessional',
    fix: !hasGotham ? 'Use Enum.Font.GothamBold for titles (size 20-24), Enum.Font.GothamMedium for body (14-16)' : undefined,
  })

  // 6. Hover effects
  const hasHover = /MouseEnter|MouseLeave|Hover|hover/.test(code)
  const buttonCount = (code.match(/TextButton|ImageButton/g) || []).length
  issues.push({
    check: 'hover_effects',
    passed: hasHover,
    severity: hasHover ? 'info' : 'warning',
    message: hasHover ? 'Hover effects detected on interactive elements' : `${buttonCount} buttons with no hover effects — feels unresponsive`,
    fix: !hasHover ? 'Add btn.MouseEnter:Connect → TweenService color/scale change, btn.MouseLeave:Connect → revert' : undefined,
  })

  // 7. Scale vs pixel sizing
  const scaleMatches = (code.match(/UDim2\.new\s*\(\s*0\.\d/g) || []).length
  const pixelMatches = (code.match(/UDim2\.new\s*\(\s*0\s*,\s*\d{3,}/g) || []).length
  const usesScale = scaleMatches > pixelMatches
  issues.push({
    check: 'responsive_sizing',
    passed: usesScale,
    severity: usesScale ? 'info' : 'warning',
    message: usesScale ? `${scaleMatches} scale-based sizes vs ${pixelMatches} fixed-pixel` : 'Mostly fixed-pixel sizing — won\'t scale on different screen sizes',
    fix: !usesScale ? 'Use UDim2.new(0.5, 0, 0.3, 0) scale values instead of fixed pixel UDim2.new(0, 500, 0, 300)' : undefined,
  })

  // 8. ChangeHistoryService
  const hasCHS = /ChangeHistoryService/.test(code)
  issues.push({
    check: 'change_history',
    passed: hasCHS,
    severity: hasCHS ? 'info' : 'warning',
    message: hasCHS ? 'ChangeHistoryService wrapping present' : 'No ChangeHistoryService — changes won\'t be undoable in Studio',
  })

  // 9. ResetOnSpawn
  const hasResetOnSpawn = /ResetOnSpawn\s*=\s*false/.test(code)
  issues.push({
    check: 'reset_on_spawn',
    passed: hasResetOnSpawn,
    severity: hasResetOnSpawn ? 'info' : 'error',
    message: hasResetOnSpawn ? 'ResetOnSpawn = false set' : 'Missing ResetOnSpawn = false — GUI will disappear when player respawns',
    fix: 'Add screenGui.ResetOnSpawn = false after creating the ScreenGui',
  })

  // 10. UIPadding
  const hasPadding = /UIPadding|addPadding/.test(code)
  issues.push({
    check: 'padding',
    passed: hasPadding,
    severity: hasPadding ? 'info' : 'info',
    message: hasPadding ? 'UIPadding present for proper spacing' : 'No UIPadding — elements may touch frame edges',
  })

  // 11. UIStroke (bonus)
  const hasStroke = /UIStroke|addStroke/.test(code)
  issues.push({
    check: 'stroke_borders',
    passed: hasStroke,
    severity: 'info',
    message: hasStroke ? 'UIStroke borders for depth' : 'No UIStroke — consider adding subtle borders for depth',
  })

  // 12. Gold accent
  const hasGoldAccent = /212\s*,\s*175\s*,\s*55|D4AF37|GOLD/.test(code)
  issues.push({
    check: 'gold_accent',
    passed: hasGoldAccent,
    severity: 'info',
    message: hasGoldAccent ? 'Gold accent color (#D4AF37) in use' : 'No gold accent — consider adding for premium feel',
  })

  // Score calculation
  const weights: Record<string, number> = {
    dark_theme: 15, ui_corner: 12, animations: 12, close_button: 8,
    font_quality: 10, hover_effects: 10, responsive_sizing: 8,
    change_history: 5, reset_on_spawn: 10, padding: 3, stroke_borders: 4, gold_accent: 3,
  }

  let score = 0
  let maxScore = 0
  for (const issue of issues) {
    const weight = weights[issue.check] || 5
    maxScore += weight
    if (issue.passed) score += weight
  }

  const normalizedScore = Math.round((score / maxScore) * 100)

  const failedChecks = issues.filter(i => !i.passed && i.severity !== 'info')
  const summary = failedChecks.length === 0
    ? `GUI quality: ${normalizedScore}/100 — meets PSX standards`
    : `GUI quality: ${normalizedScore}/100 — ${failedChecks.length} issues: ${failedChecks.map(i => i.check).join(', ')}`

  return { score: normalizedScore, issues, isGuiCode: true, summary }
}

/**
 * Quick check: is this code UI-related?
 */
export function isGuiCode(code: string): boolean {
  return /ScreenGui|StarterGui|TextButton|TextLabel|Frame|ScrollingFrame/.test(code)
}

/**
 * Format audit result for chat message
 */
export function formatGuiAuditForChat(result: GuiAuditResult): string {
  if (!result.isGuiCode) return ''
  if (result.score >= 80) return ''  // Good enough, don't clutter chat

  const fixes = result.issues
    .filter(i => !i.passed && i.fix)
    .map(i => `- ${i.fix}`)
    .slice(0, 3)

  if (fixes.length === 0) return ''

  return `\n\n*UI quality: ${result.score}/100. To improve:*\n${fixes.join('\n')}`
}
