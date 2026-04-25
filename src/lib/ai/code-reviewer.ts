/**
 * AI Code Reviewer — Automatic security, performance, and quality analysis
 * for generated Luau scripts. Runs as a fast second pass after generation.
 *
 * Unique to ForjeGames — no competitor has automated code review.
 * Uses the FAST model tier for speed (Groq/Flash).
 */

import 'server-only'

export interface CodeReviewResult {
  security: CodeReviewGrade
  performance: CodeReviewGrade
  reliability: CodeReviewGrade
  multiplayer: CodeReviewGrade
  overall: CodeReviewGrade
  issues: CodeReviewIssue[]
  suggestions: string[]
}

export interface CodeReviewGrade {
  grade: string // 'A+' | 'A' | 'A-' | 'B+' | 'B' | 'B-' | 'C+' | 'C' | 'C-' | 'D' | 'F'
  score: number // 0-100
}

export interface CodeReviewIssue {
  severity: 'critical' | 'warning' | 'info'
  category: 'security' | 'performance' | 'reliability' | 'multiplayer'
  message: string
  line?: number
}

// ─── Static analysis (fast, no AI needed) ────────────────────────────────────

const STATIC_CHECKS: Array<{
  pattern: RegExp
  category: CodeReviewIssue['category']
  severity: CodeReviewIssue['severity']
  message: string
}> = [
  // Security
  {
    pattern: /loadstring/i,
    category: 'security',
    severity: 'critical',
    message: 'loadstring() is a security risk — can execute arbitrary code',
  },
  {
    pattern: /\.OnServerEvent:Connect\(function\([^)]*\)\s*\n[^}]*(?!typeof|type\()(?!if\s)/m,
    category: 'security',
    severity: 'warning',
    message: 'Server event handler may not validate client input — always validate data from FireServer',
  },
  {
    pattern: /HttpService:GetAsync|HttpService:PostAsync/,
    category: 'security',
    severity: 'warning',
    message: 'HTTP requests should use pcall() and validate responses',
  },

  // Performance
  {
    pattern: /while\s+true\s+do[\s\S]*?(?:Instance\.new|Clone\(\))/m,
    category: 'performance',
    severity: 'warning',
    message: 'Creating instances in a loop — may cause lag. Consider object pooling.',
  },
  {
    pattern: /GetDescendants\(\)/,
    category: 'performance',
    severity: 'info',
    message: 'GetDescendants() is expensive on large trees — cache results or use tags',
  },
  {
    pattern: /\.Touched:Connect/,
    category: 'performance',
    severity: 'info',
    message: 'Touched events fire frequently — add debounce to prevent spam',
  },
  {
    pattern: /wait\(\)/,
    category: 'performance',
    severity: 'warning',
    message: 'Deprecated wait() — use task.wait() instead',
  },
  {
    pattern: /spawn\(\)/,
    category: 'performance',
    severity: 'warning',
    message: 'Deprecated spawn() — use task.spawn() instead',
  },

  // Reliability
  {
    pattern: /(?:DataStore|OrderedDataStore).*(?!pcall)/,
    category: 'reliability',
    severity: 'warning',
    message: 'DataStore calls should be wrapped in pcall() — they can throw',
  },
  {
    pattern: /\.Died:Connect\(function/,
    category: 'reliability',
    severity: 'info',
    message: 'Died connections should be cleaned up on respawn to prevent leaks',
  },
  {
    pattern: /game\.Players\.LocalPlayer/,
    category: 'reliability',
    severity: 'info',
    message: 'LocalPlayer is nil in ServerScripts — ensure this is in a LocalScript',
  },

  // Multiplayer
  {
    pattern: /workspace\.\w+\.(Position|CFrame|Size)\s*=/,
    category: 'multiplayer',
    severity: 'warning',
    message: 'Direct workspace property changes from LocalScript won\'t replicate — use RemoteEvents',
  },
  {
    pattern: /game\.Players\.LocalPlayer[\s\S]*?\.leaderstats/m,
    category: 'multiplayer',
    severity: 'warning',
    message: 'Leaderstats should be managed on the server to prevent exploits',
  },
]

/**
 * Run a fast static code review — no AI call needed.
 * Returns grades and issues based on pattern matching.
 */
export function reviewCode(code: string): CodeReviewResult {
  const issues: CodeReviewIssue[] = []

  // Run static checks
  for (const check of STATIC_CHECKS) {
    if (check.pattern.test(code)) {
      issues.push({
        severity: check.severity,
        category: check.category,
        message: check.message,
      })
    }
  }

  // Additional connection leak detection
  const connectCount = (code.match(/:Connect\(/g) || []).length
  const disconnectCount = (code.match(/:Disconnect\(\)|:Destroy\(\)/g) || []).length
  if (connectCount > 3 && disconnectCount === 0) {
    issues.push({
      severity: 'warning',
      category: 'reliability',
      message: `${connectCount} event connections with no Disconnect/Destroy — potential memory leak`,
    })
  }

  // Check for pcall usage around error-prone APIs
  const datastoreUsage = (code.match(/DataStore|GetAsync|SetAsync|UpdateAsync/g) || []).length
  const pcallUsage = (code.match(/pcall\(/g) || []).length
  if (datastoreUsage > 0 && pcallUsage === 0) {
    issues.push({
      severity: 'critical',
      category: 'reliability',
      message: 'DataStore calls without pcall() — will crash on network errors',
    })
  }

  // Calculate grades
  const securityIssues = issues.filter(i => i.category === 'security')
  const performanceIssues = issues.filter(i => i.category === 'performance')
  const reliabilityIssues = issues.filter(i => i.category === 'reliability')
  const multiplayerIssues = issues.filter(i => i.category === 'multiplayer')

  const security = calculateGrade(securityIssues)
  const performance = calculateGrade(performanceIssues)
  const reliability = calculateGrade(reliabilityIssues)
  const multiplayer = calculateGrade(multiplayerIssues)

  const overallScore = Math.round((security.score + performance.score + reliability.score + multiplayer.score) / 4)

  // Build suggestions
  const suggestions: string[] = []
  if (securityIssues.some(i => i.severity === 'critical')) {
    suggestions.push('Add input validation to all RemoteEvent handlers')
  }
  if (performanceIssues.length > 0) {
    suggestions.push('Consider adding debounce patterns and object pooling')
  }
  if (connectCount > 3 && disconnectCount === 0) {
    suggestions.push('Store connections and disconnect them when objects are destroyed')
  }
  if (!code.includes('pcall') && (code.includes('DataStore') || code.includes('HttpService'))) {
    suggestions.push('Wrap fallible API calls in pcall() for error handling')
  }

  return {
    security,
    performance,
    reliability,
    multiplayer,
    overall: { grade: scoreToGrade(overallScore), score: overallScore },
    issues,
    suggestions,
  }
}

function calculateGrade(issues: CodeReviewIssue[]): CodeReviewGrade {
  let score = 100
  for (const issue of issues) {
    if (issue.severity === 'critical') score -= 25
    else if (issue.severity === 'warning') score -= 10
    else score -= 3
  }
  score = Math.max(0, score)
  return { grade: scoreToGrade(score), score }
}

function scoreToGrade(score: number): string {
  if (score >= 97) return 'A+'
  if (score >= 93) return 'A'
  if (score >= 90) return 'A-'
  if (score >= 87) return 'B+'
  if (score >= 83) return 'B'
  if (score >= 80) return 'B-'
  if (score >= 77) return 'C+'
  if (score >= 73) return 'C'
  if (score >= 70) return 'C-'
  if (score >= 60) return 'D'
  return 'F'
}

/**
 * Format review result as a display card for the chat UI.
 */
export function formatReviewCard(review: CodeReviewResult): string {
  const parts = [
    `Security: ${review.security.grade}`,
    `Performance: ${review.performance.grade}`,
    `Reliability: ${review.reliability.grade}`,
    `Multiplayer: ${review.multiplayer.grade}`,
  ]

  let card = `Code Review: ${review.overall.grade} | ${parts.join(' | ')}`

  if (review.issues.length > 0) {
    const criticals = review.issues.filter(i => i.severity === 'critical')
    const warnings = review.issues.filter(i => i.severity === 'warning')
    if (criticals.length > 0) card += `\n${criticals.length} critical issue${criticals.length > 1 ? 's' : ''}`
    if (warnings.length > 0) card += `\n${warnings.length} warning${warnings.length > 1 ? 's' : ''}`
  }

  if (review.suggestions.length > 0) {
    card += '\nSuggestions: ' + review.suggestions.join('; ')
  }

  return card
}
