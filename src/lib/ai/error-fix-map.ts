/**
 * error-fix-map.ts
 *
 * Comprehensive mapping of common Roblox/Luau runtime errors to their fixes.
 * Used by the retry/debug system to automatically fix AI-generated code that
 * fails in Roblox Studio.
 *
 * When the plugin captures an error from Studio output, we match it against
 * ERROR_FIX_MAP to find the most relevant fix and optionally apply an
 * automatic code transformation via autoFixFn.
 *
 * Each entry includes:
 *   - pattern:     RegExp matching the Studio error message
 *   - category:    classification for grouping/filtering
 *   - description: human-readable explanation of what went wrong
 *   - fix:         actionable description of the code change needed
 *   - autoFixFn:   optional (code: string) => string that applies the fix
 */

// ── Types ──────────────────────────────────────────────────────────────────

export type ErrorCategory = 'syntax' | 'api' | 'runtime' | 'permission' | 'type'

export interface ErrorFixEntry {
  pattern: RegExp
  category: ErrorCategory
  description: string
  fix: string
  autoFixFn?: (code: string) => string
}

export interface MatchedFix {
  entry: ErrorFixEntry
  match: RegExpMatchArray
}

// ── Helpers ────────────────────────────────────────────────────────────────

/** Replace all occurrences of `wait()` / `wait(n)` with `task.wait()` / `task.wait(n)` */
function replaceWait(code: string): string {
  // Avoid replacing inside comments or strings (good-enough heuristic)
  return code.replace(/\bwait\s*\(/g, 'task.wait(')
}

/** Replace `spawn(fn)` with `task.spawn(fn)` */
function replaceSpawn(code: string): string {
  return code.replace(/\bspawn\s*\(/g, 'task.spawn(')
}

/** Replace `delay(n, fn)` with `task.delay(n, fn)` */
function replaceDelay(code: string): string {
  return code.replace(/\bdelay\s*\(/g, 'task.delay(')
}

/** Convert BrickColor.new("X") to Color3 equivalent when assigned to Color3 property */
function brickColorToColor3(code: string): string {
  // Replace BrickColor.new("name") with BrickColor.new("name").Color when used with Color3 props
  return code.replace(
    /(\.\s*(?:Color|BackgroundColor3|BorderColor3|TextColor3|ImageColor3|PlaceholderColor3)\s*=\s*)BrickColor\.new\(([^)]+)\)/g,
    '$1BrickColor.new($2).Color'
  )
}

/** Convert Color3.new(255, 0, 0) style to Color3.fromRGB(255, 0, 0) when values > 1 */
function fixColor3Range(code: string): string {
  return code.replace(
    /Color3\.new\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/g,
    (_match, r, g, b) => {
      const rn = parseInt(r), gn = parseInt(g), bn = parseInt(b)
      if (rn > 1 || gn > 1 || bn > 1) {
        return `Color3.fromRGB(${r}, ${g}, ${b})`
      }
      return _match
    }
  )
}

/** Wrap code in pcall if it uses HttpService:GetAsync/PostAsync without one */
function wrapHttpInPcall(code: string): string {
  // Only wrap if there's no pcall already around the http call
  if (code.includes('HttpService') && !code.includes('pcall')) {
    return code.replace(
      /(local\s+\w+\s*=\s*HttpService\s*:\s*(?:GetAsync|PostAsync|RequestAsync)\s*\([^)]*\))/g,
      'local success, $1_result = pcall(function() return $1_inner end)\n-- TODO: handle success/failure'
    )
  }
  return code
}

// ── Error Fix Map ──────────────────────────────────────────────────────────

export const ERROR_FIX_MAP: ErrorFixEntry[] = [
  // ═══════════════════════════════════════════════════════════════════════
  // SYNTAX ERRORS
  // ═══════════════════════════════════════════════════════════════════════

  {
    pattern: /Expected\s+'end'\s+\(to close .+ at line (\d+)\)/i,
    category: 'syntax',
    description: 'Unbalanced block: missing `end` keyword to close a do/if/for/while/function block.',
    fix: 'Add the missing `end` keyword at the appropriate indentation level to close the block started at the indicated line.',
    autoFixFn: (code) => {
      // Count block openers vs closers; append `end` if imbalanced
      const openers = (code.match(/\b(do|then|function\s*\(|repeat)\b/g) || []).length
      const closers = (code.match(/\bend\b/g) || []).length
      const untils = (code.match(/\buntil\b/g) || []).length
      const needed = openers - closers - untils
      if (needed > 0) {
        return code + '\n' + 'end\n'.repeat(needed)
      }
      return code
    },
  },

  {
    pattern: /Expected\s+(?:'[^']+')?\s*(?:got|near)\s+'<eof>'/i,
    category: 'syntax',
    description: 'Unexpected end of file. Usually a missing `end`, `)`, or `]`.',
    fix: 'Check for unbalanced blocks, parentheses, or brackets and add the missing closing token.',
    autoFixFn: (code) => {
      const openers = (code.match(/\b(do|then|function\s*\(|repeat)\b/g) || []).length
      const closers = (code.match(/\bend\b/g) || []).length
      const untils = (code.match(/\buntil\b/g) || []).length
      const needed = openers - closers - untils
      if (needed > 0) {
        return code + '\n' + 'end\n'.repeat(needed)
      }
      return code
    },
  },

  {
    pattern: /Expected\s+'then'\s+when\s+parsing/i,
    category: 'syntax',
    description: 'Missing `then` keyword after `if` condition.',
    fix: 'Add `then` after the if/elseif condition.',
    autoFixFn: (code) => {
      // Fix `if <cond>\n` without `then`
      return code.replace(
        /\b(if\s+.+?)\s*\n(\s*)/g,
        (match, cond, indent) => {
          if (!cond.includes('then')) {
            return `${cond} then\n${indent}`
          }
          return match
        }
      )
    },
  },

  {
    pattern: /Expected\s+'do'\s+when\s+parsing/i,
    category: 'syntax',
    description: 'Missing `do` keyword after `for`/`while` loop header.',
    fix: 'Add `do` after the for/while loop condition.',
    autoFixFn: (code) => {
      return code.replace(
        /\b(for\s+.+?)\s*\n(\s*)/g,
        (match, header, indent) => {
          if (!header.includes(' do')) {
            return `${header} do\n${indent}`
          }
          return match
        }
      ).replace(
        /\b(while\s+.+?)\s*\n(\s*)/g,
        (match, header, indent) => {
          if (!header.includes(' do')) {
            return `${header} do\n${indent}`
          }
          return match
        }
      )
    },
  },

  {
    pattern: /Incomplete statement.*expected assignment or function call/i,
    category: 'syntax',
    description: 'Statement is incomplete -- usually a stray expression or missing operator.',
    fix: 'Ensure each line is either a variable assignment, function call, or control structure. Remove stray expressions.',
  },

  {
    pattern: /malformed\s+number/i,
    category: 'syntax',
    description: 'A number literal is malformed (e.g., double dot `1..2` or trailing letters).',
    fix: 'Fix the number literal to use valid Luau syntax. Use `..` only for string concatenation.',
  },

  // ═══════════════════════════════════════════════════════════════════════
  // API ERRORS — Hallucinated / Wrong Members
  // ═══════════════════════════════════════════════════════════════════════

  {
    pattern: /(\w+)\s+is not a valid member of\s+(\w+)/i,
    category: 'api',
    description: 'Attempted to access a property or child that does not exist on this instance. Often caused by AI hallucinating Roblox API members.',
    fix: 'Check the Roblox API docs for the correct property/method name on the target class. Use FindFirstChild() for dynamic children instead of dot notation.',
    autoFixFn: (code) => {
      // Convert direct child access like `workspace.NonExistent` to FindFirstChild pattern
      // when accessing children that aren't standard properties
      return code
        // Fix common hallucination: .Humanoid on non-character models
        .replace(/\.Humanoid\b(?!\s*[=(])/g, ':FindFirstChildWhichIsA("Humanoid")')
    },
  },

  {
    pattern: /ServerScriptService is not a valid member of DataModel/i,
    category: 'api',
    description: 'A LocalScript or client-side code tried to access ServerScriptService, which is server-only.',
    fix: 'If this is client code, it cannot access ServerScriptService. Move server logic to a Script in ServerScriptService and communicate via RemoteEvents.',
    autoFixFn: (code) => {
      return code.replace(
        /game\s*[.:]\s*(?:GetService\s*\(\s*["'])?ServerScriptService["']?\s*\)?/g,
        'game:GetService("ReplicatedStorage") -- NOTE: moved from ServerScriptService (server-only)'
      )
    },
  },

  {
    pattern: /ServerStorage is not a valid member of DataModel/i,
    category: 'api',
    description: 'Client code tried to access ServerStorage, which is only visible to server scripts.',
    fix: 'Use ReplicatedStorage instead of ServerStorage for assets that need to be accessed by both client and server.',
    autoFixFn: (code) => {
      return code.replace(
        /game\s*[.:]\s*(?:GetService\s*\(\s*["'])?ServerStorage["']?\s*\)?/g,
        'game:GetService("ReplicatedStorage") -- NOTE: moved from ServerStorage (server-only)'
      )
    },
  },

  {
    pattern: /Players\.LocalPlayer is not available/i,
    category: 'api',
    description: 'A server Script tried to use Players.LocalPlayer, which only exists on the client.',
    fix: 'Server scripts must get players from Players:GetPlayers() or event connections like Players.PlayerAdded. Remove LocalPlayer references.',
    autoFixFn: (code) => {
      // Replace LocalPlayer pattern in server scripts with a PlayerAdded handler
      if (code.includes('game.Players.LocalPlayer') || code.includes('game:GetService("Players").LocalPlayer')) {
        return code
          .replace(
            /(?:game\.Players|game:GetService\s*\(\s*["']Players["']\s*\))\.LocalPlayer/g,
            '-- ERROR: LocalPlayer is client-only. Use Players.PlayerAdded for server scripts\nnil --[[ was LocalPlayer ]]'
          )
      }
      return code
    },
  },

  {
    pattern: /Unable to assign property\s+(\w+)\.\s+(.+)/i,
    category: 'type',
    description: 'Tried to assign a value of the wrong type to a property.',
    fix: 'Check the Roblox API docs for the expected type of this property. Common mistakes: assigning string to Color3, number to Vector3, BrickColor to Color3.',
  },

  {
    pattern: /invalid argument #(\d+)\s+to '(\w+)'\s+\((\w+) expected, got (\w+)\)/i,
    category: 'type',
    description: 'Wrong argument type passed to a function.',
    fix: 'Check the function signature and pass the correct type. Commonly: Vector3.new needs numbers, CFrame.new needs Vector3 or numbers.',
  },

  {
    pattern: /invalid argument #(\d+)\s+\((\w+) expected, got (\w+)\)/i,
    category: 'type',
    description: 'Type mismatch in function argument.',
    fix: 'Pass the correct type for this argument position.',
  },

  // ═══════════════════════════════════════════════════════════════════════
  // RUNTIME ERRORS
  // ═══════════════════════════════════════════════════════════════════════

  {
    pattern: /attempt to index nil with '(\w+)'/i,
    category: 'runtime',
    description: 'Tried to access a property on a nil value. The variable was never assigned or FindFirstChild returned nil.',
    fix: 'Add nil checks before accessing properties. Use `if obj then obj.Property end` or `obj and obj.Property`. For FindFirstChild, use WaitForChild() if the object may load later.',
    autoFixFn: (code) => {
      // Convert FindFirstChild to WaitForChild for common patterns
      return code.replace(
        /(\w+)\s*=\s*(\w+):FindFirstChild\(([^)]+)\)\s*\n(\s*)(\1\.\w+)/g,
        '$1 = $2:WaitForChild($3)\n$4$5'
      )
    },
  },

  {
    pattern: /attempt to call a nil value/i,
    category: 'runtime',
    description: 'Tried to call something that is nil -- usually a misspelled function name or accessing a method on a wrong type.',
    fix: 'Verify the function/method name exists. Check that you are using `:` for methods and `.` for module functions.',
    autoFixFn: (code) => {
      // Fix common colon vs dot confusion for Roblox methods
      return code
        .replace(/\.Clone\(\)/g, ':Clone()')
        .replace(/\.Destroy\(\)/g, ':Destroy()')
        .replace(/\.FindFirstChild\(/g, ':FindFirstChild(')
        .replace(/\.WaitForChild\(/g, ':WaitForChild(')
        .replace(/\.GetService\(/g, ':GetService(')
        .replace(/\.GetChildren\(\)/g, ':GetChildren()')
        .replace(/\.GetDescendants\(\)/g, ':GetDescendants()')
        .replace(/\.IsA\(/g, ':IsA(')
        .replace(/\.Connect\(/g, ':Connect(')
        .replace(/\.PlayLocalSound\(/g, ':PlayLocalSound(')
        .replace(/\.Play\(\)/g, ':Play()')
    },
  },

  {
    pattern: /Argument (\d+) missing or nil/i,
    category: 'runtime',
    description: 'A required argument was not provided to a function or constructor.',
    fix: 'Check the function signature in the Roblox API docs and provide all required arguments.',
  },

  {
    pattern: /attempt to perform arithmetic.*on\s+(\w+)/i,
    category: 'runtime',
    description: 'Tried to do math on a non-numeric value (e.g., adding a string to a number).',
    fix: 'Ensure both operands are numbers. Use tonumber() to convert strings, or fix the variable to hold a number.',
    autoFixFn: (code) => {
      // Wrap common .Value accesses with tonumber
      return code.replace(
        /(\w+\.Value)\s*([+\-*/])\s*/g,
        'tonumber($1) $2 '
      )
    },
  },

  {
    pattern: /attempt to compare\s+(\w+)\s*[<>=]+\s*(\w+)/i,
    category: 'runtime',
    description: 'Tried to compare incompatible types.',
    fix: 'Make sure both sides of the comparison are the same type. Use tonumber() or tostring() for conversions.',
  },

  {
    pattern: /attempt to concatenate\s+(\w+)\s+with\s+(\w+)/i,
    category: 'runtime',
    description: 'Tried to concatenate incompatible types (e.g., string .. nil).',
    fix: 'Use tostring() on non-string values before concatenation, or check for nil first.',
    autoFixFn: (code) => {
      // Add tostring wrapping on non-string concat operands where obvious
      return code.replace(
        /\.\.\s*(\w+\.(?:Value|Position|Name))/g,
        '.. tostring($1)'
      )
    },
  },

  {
    pattern: /table index is nil/i,
    category: 'runtime',
    description: 'Attempted to use nil as a table key.',
    fix: 'Ensure the key variable is assigned a value before using it to index a table.',
  },

  {
    pattern: /stack overflow/i,
    category: 'runtime',
    description: 'Infinite recursion or deeply nested calls exceeded the stack limit.',
    fix: 'Add a recursion depth limit or base case to recursive functions. Check for circular references.',
  },

  {
    pattern: /Maximum re-entrancy depth.*exceeded/i,
    category: 'runtime',
    description: 'A property change listener triggered itself recursively.',
    fix: 'Add a guard variable (e.g., `local updating = false`) to prevent re-entrant property change handlers.',
    autoFixFn: (code) => {
      // Add re-entrancy guard to Changed connections
      if (code.includes(':GetPropertyChangedSignal(') && !code.includes('updating')) {
        return `local _updating = false\n` + code.replace(
          /(:GetPropertyChangedSignal\([^)]+\):Connect\(function\(\))/g,
          '$1\n\tif _updating then return end\n\t_updating = true'
        ) + '\n-- Remember to set _updating = false at end of handler'
      }
      return code
    },
  },

  // ═══════════════════════════════════════════════════════════════════════
  // PERMISSION / SECURITY ERRORS
  // ═══════════════════════════════════════════════════════════════════════

  {
    pattern: /HTTP\s*requests?\s+(?:are|is)\s+not\s+enabled/i,
    category: 'permission',
    description: 'HttpService.HttpEnabled is false. HTTP requests are disabled by default in Roblox.',
    fix: 'Enable HttpService in Studio: Game Settings > Security > Allow HTTP Requests. In code, the script cannot enable this programmatically.',
  },

  {
    pattern: /Cannot load string/i,
    category: 'permission',
    description: 'loadstring() is disabled. Roblox disables dynamic code execution by default.',
    fix: 'Avoid loadstring(). Rewrite the logic using ModuleScripts or data-driven patterns instead of dynamic code evaluation.',
    autoFixFn: (code) => {
      // Remove loadstring calls and add a comment
      return code.replace(
        /loadstring\(([^)]+)\)\s*\(\)/g,
        '-- ERROR: loadstring is disabled in Roblox. Rewrite without dynamic code evaluation.\n-- Was: loadstring($1)()'
      )
    },
  },

  {
    pattern: /Insufficient permissions/i,
    category: 'permission',
    description: 'The script does not have permission for this operation (e.g., accessing restricted services).',
    fix: 'Ensure the code runs in the correct context (server vs client) and the game has the required permissions enabled.',
  },

  {
    pattern: /Script is not a LuaSourceContainer/i,
    category: 'permission',
    description: 'Tried to set Source on something that is not a script, or tried to create a Script at runtime (not allowed in published games).',
    fix: 'Scripts cannot be created or have their Source modified at runtime. Use ModuleScripts loaded via require() instead.',
  },

  // ═══════════════════════════════════════════════════════════════════════
  // TYPE / VALUE ERRORS
  // ═══════════════════════════════════════════════════════════════════════

  {
    pattern: /(\w+)\s+is not a valid\s+Enum(?:Item)?/i,
    category: 'type',
    description: 'An invalid Enum value was used. The AI may have hallucinated an Enum member name.',
    fix: 'Check the correct Enum values in the Roblox API. Common mistake: using Enum.Material.Concrete instead of Enum.Material.Concrete (case-sensitive), or using a value that does not exist.',
    autoFixFn: (code) => {
      // Fix common enum mistakes
      return code
        .replace(/Enum\.Material\.Smooth\b/g, 'Enum.Material.SmoothPlastic')
        .replace(/Enum\.Material\.Glass\b(?!y)/g, 'Enum.Material.Glass')
        .replace(/Enum\.Material\.Stone\b/g, 'Enum.Material.Slate')
        .replace(/Enum\.KeyCode\.Space\b/g, 'Enum.KeyCode.Space')
        .replace(/Enum\.SortOrder\.Name\b/g, 'Enum.SortOrder.Name')
        .replace(/Enum\.Font\.Arial\b/g, 'Enum.Font.Arial')
    },
  },

  {
    pattern: /(\w+)\s+is not a valid\s+EnumType/i,
    category: 'type',
    description: 'Referenced an Enum type that does not exist.',
    fix: 'Verify the Enum type name in the Roblox API documentation. Check spelling and capitalization.',
  },

  {
    pattern: /Unable to cast\s+(\w+)\s+to\s+(\w+)/i,
    category: 'type',
    description: 'Roblox cannot convert between these types automatically.',
    fix: 'Explicitly convert the value. Common cases: use Color3.fromRGB() instead of Color3.new() with 0-255 values, use Vector3.new() from individual numbers.',
    autoFixFn: fixColor3Range,
  },

  {
    pattern: /BrickColor is not a valid value for property.*Color3/i,
    category: 'type',
    description: 'Assigned a BrickColor to a Color3 property.',
    fix: 'Use Color3 values for Color3 properties. Convert via BrickColor.new("name").Color or use Color3.fromRGB() directly.',
    autoFixFn: brickColorToColor3,
  },

  // ═══════════════════════════════════════════════════════════════════════
  // DEPRECATION WARNINGS (that become errors in strict mode)
  // ═══════════════════════════════════════════════════════════════════════

  {
    pattern: /['"]?wait['"]?\s+is not a valid member|'wait' is deprecated/i,
    category: 'api',
    description: 'wait() is deprecated. Use task.wait() instead.',
    fix: 'Replace all wait() calls with task.wait(). Replace wait(n) with task.wait(n).',
    autoFixFn: replaceWait,
  },

  {
    pattern: /['"]?spawn['"]?\s+is not a valid member|'spawn' is deprecated/i,
    category: 'api',
    description: 'spawn() is deprecated. Use task.spawn() instead.',
    fix: 'Replace spawn(fn) with task.spawn(fn).',
    autoFixFn: replaceSpawn,
  },

  {
    pattern: /['"]?delay['"]?\s+is not a valid member|'delay' is deprecated/i,
    category: 'api',
    description: 'delay() is deprecated. Use task.delay() instead.',
    fix: 'Replace delay(t, fn) with task.delay(t, fn).',
    autoFixFn: replaceDelay,
  },

  // ═══════════════════════════════════════════════════════════════════════
  // COMMON ROBLOX ANTI-PATTERNS
  // ═══════════════════════════════════════════════════════════════════════

  {
    pattern: /Part is not a valid member of (?:StarterGui|PlayerGui|ScreenGui)/i,
    category: 'api',
    description: 'Tried to parent a 3D Part into a GUI container. Parts belong in Workspace, not GUI.',
    fix: 'Parent Parts to workspace or a Model in workspace. GUI containers only hold GuiObjects (Frame, TextLabel, etc.).',
    autoFixFn: (code) => {
      return code
        .replace(/\.Parent\s*=\s*game\.StarterGui\b/g, '.Parent = workspace')
        .replace(/\.Parent\s*=\s*game:GetService\s*\(\s*["']StarterGui["']\s*\)/g, '.Parent = workspace')
    },
  },

  {
    pattern: /(?:TextLabel|Frame|ScreenGui)\s+is not a valid member of\s+Workspace/i,
    category: 'api',
    description: 'Tried to parent a GUI element into Workspace. GUI elements belong in StarterGui or PlayerGui.',
    fix: 'Parent GUI objects to game.StarterGui, player.PlayerGui, or inside a SurfaceGui/BillboardGui attached to a Part.',
    autoFixFn: (code) => {
      return code.replace(
        /(\.Parent\s*=\s*)workspace\b/g,
        (match, prefix) => {
          // Only fix if the previous lines suggest this is a GUI element
          return match // conservative: don't auto-fix since we need context
        }
      )
    },
  },

  {
    pattern: /Workspace is not a valid parent for ScreenGui/i,
    category: 'api',
    description: 'ScreenGui must be parented to StarterGui or PlayerGui, not Workspace.',
    fix: 'Parent ScreenGui to game.StarterGui (for auto-replication) or player.PlayerGui (for direct control).',
    autoFixFn: (code) => {
      return code.replace(
        /(ScreenGui[^]*?\.Parent\s*=\s*)workspace/g,
        '$1game:GetService("StarterGui")'
      )
    },
  },

  {
    pattern: /Infinite yield possible on '([^']+):WaitForChild\("([^"]+)"\)'/i,
    category: 'runtime',
    description: 'WaitForChild is waiting indefinitely because the child does not exist or has not been created yet.',
    fix: 'Add a timeout: WaitForChild("Name", 5). Check that the child actually exists or will be created. Use FindFirstChild() if the child is optional.',
    autoFixFn: (code) => {
      // Add 5-second timeout to WaitForChild calls that don't have one
      return code.replace(
        /:WaitForChild\(\s*("[^"]+")\s*\)(?!\s*--)/g,
        ':WaitForChild($1, 5)'
      )
    },
  },

  {
    pattern: /Transform is not a valid member of Motor6D/i,
    category: 'api',
    description: 'Motor6D uses C0/C1/Part0/Part1 properties, not Transform.',
    fix: 'Use Motor6D.C0 and Motor6D.C1 for the CFrame offsets, or Motor6D.Part0/Part1 for the connected parts.',
  },

  {
    pattern: /SetPrimaryPartCFrame is not a valid member/i,
    category: 'api',
    description: 'SetPrimaryPartCFrame was deprecated. Use PivotTo() instead.',
    fix: 'Replace model:SetPrimaryPartCFrame(cf) with model:PivotTo(cf).',
    autoFixFn: (code) => {
      return code.replace(
        /:SetPrimaryPartCFrame\s*\(/g,
        ':PivotTo('
      )
    },
  },

  {
    pattern: /FindFirstChildOfClass is not a valid member/i,
    category: 'api',
    description: 'FindFirstChildOfClass may not exist on this instance type, or it is misspelled.',
    fix: 'Use FindFirstChildWhichIsA() for inheritance-aware search, or FindFirstChild() with IsA() check.',
    autoFixFn: (code) => {
      return code.replace(
        /:FindFirstChildOfClass\(/g,
        ':FindFirstChildWhichIsA('
      )
    },
  },

  {
    pattern: /game\.Workspace/i,
    category: 'api',
    description: 'Using game.Workspace instead of the global `workspace` variable.',
    fix: 'Use the global `workspace` variable instead of game.Workspace for cleaner code.',
    // Not auto-fixing because this is more of a style issue and game.Workspace does work
  },

  {
    pattern: /TweenService:Create\b.*invalid/i,
    category: 'api',
    description: 'TweenService:Create() called with invalid arguments.',
    fix: 'TweenService:Create(instance, TweenInfo.new(...), {property = value}). Ensure the property names in the goal table actually exist on the instance.',
  },

  {
    pattern: /Property "([^"]+)" is not a valid property of "([^"]+)"/i,
    category: 'api',
    description: 'Tried to tween or set a property that does not exist on this instance type.',
    fix: 'Check the Roblox API for valid properties on this class. Common mistakes: Transparency on Model (use individual part transparency), Position on Model (use PivotTo).',
  },

  {
    pattern: /Cannot store Dictionary in DataStore/i,
    category: 'api',
    description: 'DataStore values must be JSON-serializable. Tables with mixed keys or non-serializable values will fail.',
    fix: 'Use HttpService:JSONEncode() to verify the data is serializable. Remove Instance references, functions, and mixed table types.',
    autoFixFn: (code) => {
      // Wrap DataStore:SetAsync value in JSONEncode/JSONDecode roundtrip
      return code.replace(
        /(:SetAsync\s*\([^,]+,\s*)(\w+)(\s*\))/g,
        '$1game:GetService("HttpService"):JSONDecode(game:GetService("HttpService"):JSONEncode($2))$3'
      )
    },
  },

  {
    pattern: /attempt to index nil with 'Character'/i,
    category: 'runtime',
    description: 'Player.Character is nil. The character has not spawned yet or has been removed.',
    fix: 'Use player.Character or player.CharacterAdded:Wait() to wait for the character to load.',
    autoFixFn: (code) => {
      return code.replace(
        /(\w+)\.Character\./g,
        '($1.Character or $1.CharacterAdded:Wait()).'
      )
    },
  },

  {
    pattern: /RunService\.RenderStepped can only be used from local scripts/i,
    category: 'permission',
    description: 'RenderStepped is client-only. Server scripts cannot use it.',
    fix: 'Use RunService.Heartbeat on the server instead of RenderStepped.',
    autoFixFn: (code) => {
      return code.replace(/RunService\.RenderStepped/g, 'RunService.Heartbeat')
        .replace(/RunService:BindToRenderStep\(/g, 'RunService.Heartbeat:Connect(function() -- was BindToRenderStep\n')
    },
  },

  {
    pattern: /Model:MoveTo is not a valid member/i,
    category: 'api',
    description: 'Model:MoveTo() does not exist. Use Model:PivotTo() for CFrame-based movement.',
    fix: 'Replace model:MoveTo(position) with model:PivotTo(CFrame.new(position)).',
    autoFixFn: (code) => {
      return code.replace(
        /:MoveTo\(([^)]+)\)/g,
        ':PivotTo(CFrame.new($1))'
      )
    },
  },
]

// ── Lookup Functions ───────────────────────────────────────────────────────

/**
 * Find the best matching fix for a given error message.
 * Returns the first match (entries are ordered by specificity).
 */
export function findFix(errorMessage: string): MatchedFix | null {
  for (const entry of ERROR_FIX_MAP) {
    const match = errorMessage.match(entry.pattern)
    if (match) {
      return { entry, match }
    }
  }
  return null
}

/**
 * Find ALL matching fixes for a given error message.
 * Useful when an error could match multiple patterns.
 */
export function findAllFixes(errorMessage: string): MatchedFix[] {
  const results: MatchedFix[] = []
  for (const entry of ERROR_FIX_MAP) {
    const match = errorMessage.match(entry.pattern)
    if (match) {
      results.push({ entry, match })
    }
  }
  return results
}

/**
 * Apply all auto-fixable fixes for the given errors to the code.
 * Returns the fixed code and a list of fixes that were applied.
 *
 * Applies fixes iteratively -- each fix operates on the output of the
 * previous one. If an autoFixFn does not change the code, it is skipped
 * in the report.
 */
export function applyAutoFixes(
  code: string,
  errors: string[]
): { code: string; applied: Array<{ error: string; fix: string }> } {
  let current = code
  const applied: Array<{ error: string; fix: string }> = []
  const seenCategories = new Set<string>()

  for (const errorMsg of errors) {
    const result = findFix(errorMsg)
    if (!result) continue
    if (!result.entry.autoFixFn) continue

    // Deduplicate: don't apply the same pattern category twice
    const key = result.entry.pattern.source
    if (seenCategories.has(key)) continue
    seenCategories.add(key)

    const fixed = result.entry.autoFixFn(current)
    if (fixed !== current) {
      current = fixed
      applied.push({
        error: errorMsg,
        fix: result.entry.fix,
      })
    }
  }

  return { code: current, applied }
}

/**
 * Generate a prompt supplement describing errors and their fixes.
 * Used to augment the AI retry prompt so the model knows exactly what to fix.
 */
export function generateFixPrompt(errors: string[]): string {
  const fixes: string[] = []

  for (const errorMsg of errors) {
    const result = findFix(errorMsg)
    if (result) {
      fixes.push(
        `ERROR: ${errorMsg}\n` +
        `CAUSE: ${result.entry.description}\n` +
        `FIX: ${result.entry.fix}`
      )
    } else {
      fixes.push(`ERROR: ${errorMsg}\nCAUSE: Unknown\nFIX: Investigate the error and fix the code.`)
    }
  }

  return fixes.join('\n\n')
}
