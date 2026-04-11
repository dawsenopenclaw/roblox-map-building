# ForjeGames AI Quality + Intelligence Layer

> Status: landed April 10, 2026 — NEW files only, no edits to existing modules.

This doc describes the intelligence layer that sits BETWEEN the user's raw
prompt and the existing ForjeGames generators (build-planner, asset-director,
Meshy, FAL, luau-validator). Its purpose is to turn even low-context prompts
like `make a castle` or `tycoon game` into world-class outputs on the first
shot — and to automatically retry with better models when the first shot
fails a quality bar.

---

## TL;DR

```
           ┌────────────────────────┐
user ───►  │ low-context-amplifier  │  expand vague prompt → AmplifiedSpec
           └────────────┬───────────┘
                        ▼
           ┌────────────────────────┐
           │ prompt-templates/*     │  prepend expert brief per genre/mode
           └────────────┬───────────┘
                        ▼
           ┌────────────────────────┐
           │ retry-strategy.ts      │  withFallbackChain across models,
           │                        │  scored by quality-scorer on each try
           └────────────┬───────────┘
                        ▼
           ┌────────────────────────┐
           │ quality-scorer.ts      │  LLM-judged 0-100 score per output
           └────────────┬───────────┘
                        ▼
           ┌────────────────────────┐
           │ output-validator.ts    │  pre-flight luau/image/mesh checks
           └────────────┬───────────┘
                        ▼
           ┌────────────────────────┐
           │ theme-matcher.ts       │  filter assets that break the theme
           └────────────┬───────────┘
                        ▼
                    user ◄── polished output
```

---

## Modules

### 1. `src/lib/ai/quality-scorer.ts`

LLM-judged 0-100 scoring across five rubric axes:

| Axis | Weight (build mode) | Weight (script mode) |
|---|---|---|
| relevance | 0.20 | 0.20 |
| completeness | 0.25 | 0.20 |
| themeCoherence | 0.20 | 0.05 |
| technicalCorrectness | 0.25 | 0.45 |
| polish | 0.10 | 0.10 |

```ts
import { scoreOutput } from '@/lib/ai/quality-scorer'

const score = await scoreOutput({
  prompt: 'make a medieval castle',
  response: buildOutput,
  mode: 'build',
  theme: 'medieval-fantasy',
})

if (score.shouldRetry) {
  // total < 60 — retry with a stronger model
}
```

**Cost:** ~$0.0002 per call (Gemini Flash). **Latency:** <2s p95.

**Resilience:** If the provider fails or returns malformed JSON, the scorer
falls back to the existing `response-quality.ts` heuristic scorer so callers
always get a signal.

---

### 2. `src/lib/ai/retry-strategy.ts`

Three primitives:

| Function | When to use |
|---|---|
| `withSmartRetry` | One ask, swap models on failure, exponential backoff. |
| `withParallelRace` | "I need an answer ASAP" — fire N runners in parallel, first winner wins. |
| `withFallbackChain` | "Quality > availability" — walks Sonnet → Haiku → GPT-4o → Gemini, scored by `quality-scorer` on each step. |

```ts
import { withFallbackChain } from '@/lib/ai/retry-strategy'

const result = await withFallbackChain(
  (model) => callMyGenerator(model, prompt),
  {
    prompt,
    mode: 'build',
    theme: 'medieval-fantasy',
    minQuality: 75,
  },
)

console.log(result.model)          // which model won
console.log(result.quality.total)  // 0-100 score
console.log(result.history)        // every attempt with its score
```

The module also exposes `recordModelOutcome` / `getModelSuccessRate` so other
code can query per-model health (useful for dashboard widgets).

---

### 3. `src/lib/ai/prompt-templates/`

Expert prompt prefixes for every generation modality:

- `build-templates.ts` — 16 genres × 200-300 word expert briefs.
- `script-templates.ts` — 11 Luau script kinds with hard security rules.
- `mesh-templates.ts` — 8 Meshy wrappers with recommended settings.
- `audio-templates.ts` — 10 music moods, 15 SFX categories, 7 voice roles.
- `index.ts` — central barrel export.

```ts
import { resolveBuildTemplate, resolveScriptTemplate } from '@/lib/ai/prompt-templates'

const systemPrompt = resolveBuildTemplate('medieval-fantasy')
// → 300-word world-class medieval build brief with closing instruction
```

---

### 4. `src/lib/ai/theme-matcher.ts`

Pairs with the existing `theme-detector`. Given an asset description AND
the active theme id, returns a confidence score that the asset fits.

```ts
import { matchAssetToTheme, filterAssetsByTheme } from '@/lib/ai/theme-matcher'

const result = await matchAssetToTheme(
  { name: 'neon spaceship', description: 'A sleek sci-fi ship' },
  'medieval-fantasy',
)
// → { verdict: 'mismatch', confidence: 0.05, suggestedRewording: '...' }
```

Two-pass strategy:
1. **Lexical check** — $0, synchronous, uses theme-preset anchors + forbidden
   word list. Returns a verdict unless the confidence is in the 0.3-0.7
   uncertain band.
2. **LLM fallback** — only invoked for uncertain lexical verdicts. Costs
   ~$0.0001 per call.

---

### 5. `src/lib/ai/low-context-amplifier.ts`

The "rate-limited prompt agent" we kept promising. Detects vague prompts
via a local heuristic (word count + filler words + specificity signals)
and, if vague, calls Gemini to expand them into an `AmplifiedSpec`.

```ts
import { amplifyLowContext } from '@/lib/ai/low-context-amplifier'

const spec = await amplifyLowContext('make a castle')

spec.expertBrief        // 3-5 sentence expert brief
spec.genre              // 'medieval-fantasy'
spec.mood               // ['grand', 'noble', 'warm']
spec.estimatedParts     // 180
spec.technicalConstraints
```

Hard-bounded at 3 seconds. Heuristic fallback on any provider failure.
Rich prompts (vagueness < 0.3) pass through untouched — we never amplify
what doesn't need amplifying.

---

### 6. `src/lib/ai/output-validator.ts`

Uniform `{ valid, issues, suggestions, meta }` validator for three modalities:

```ts
import {
  validateLuauOutput,
  validateImageOutput,
  validateMeshOutput,
} from '@/lib/ai/output-validator'

const luau = validateLuauOutput(generatedCode)
// wraps existing luau-validator, adds hallucinated-API + service-declaration
// + balanced-keyword checks

const image = await validateImageOutput(imageUrl, { minWidth: 512 })
// HEAD/GET + content-type + size heuristic (tiny files are broken placeholders)

const mesh = await validateMeshOutput(assetId)
// hits Roblox cloud /assets/v1/assets/{id} and checks type + moderation state
```

---

### 7. Tests

All three of the hardest-to-get-right modules have Vitest unit tests with
mocked AI clients:

- `src/lib/ai/__tests__/quality-scorer.test.ts`
- `src/lib/ai/__tests__/retry-strategy.test.ts`
- `src/lib/ai/__tests__/low-context-amplifier.test.ts`

Run with `pnpm vitest run src/lib/ai/__tests__`.

---

## Integration example: polished build flow

Pseudo-code showing how to wire all seven modules into the existing build
pipeline WITHOUT editing any existing file:

```ts
import { amplifyLowContext } from '@/lib/ai/low-context-amplifier'
import { resolveBuildTemplate } from '@/lib/ai/prompt-templates'
import { withFallbackChain } from '@/lib/ai/retry-strategy'
import { filterAssetsByTheme } from '@/lib/ai/theme-matcher'
import { validateLuauOutput } from '@/lib/ai/output-validator'

async function polishedBuildFlow(userPrompt: string, themeId: string) {
  // 1. Amplify vague prompts.
  const spec = await amplifyLowContext(userPrompt)

  // 2. Prepend the expert template.
  const systemPrompt = resolveBuildTemplate(spec.genre)
  const finalPrompt = `${systemPrompt}\n\n${spec.expertBrief}`

  // 3. Walk the fallback chain, scored by quality-scorer.
  const result = await withFallbackChain(
    (model) => callExistingBuildPlanner(model, finalPrompt),
    {
      prompt: userPrompt,
      mode: 'build',
      theme: themeId,
      minQuality: 75,
    },
  )

  // 4. Filter assets against theme.
  const { accepted } = await filterAssetsByTheme(result.response.assets, themeId)

  // 5. Validate any Luau snippets before surfacing.
  const luauChecks = result.response.scripts.map(validateLuauOutput)

  return { ...result, assets: accepted, luauChecks }
}
```

---

## Cost estimates (per user prompt)

| Step | Typical cost |
|---|---|
| Low-context amplifier (Gemini Flash) | ~$0.0002 |
| Quality scorer per attempt | ~$0.0002 |
| Theme matcher (lexical only, most asset calls) | $0 |
| Theme matcher (LLM escalation, uncertain cases) | ~$0.0001 |
| Output validators | $0 (no LLM hop) |
| **Total intelligence overhead per build** | **< $0.001** |

For context, a single full build run on Claude Sonnet typically costs
$0.02-$0.08. The intelligence layer adds less than 5% overhead while
meaningfully raising the quality floor.

---

## Files landed

```
src/lib/ai/quality-scorer.ts
src/lib/ai/retry-strategy.ts
src/lib/ai/theme-matcher.ts
src/lib/ai/low-context-amplifier.ts
src/lib/ai/output-validator.ts
src/lib/ai/prompt-templates/build-templates.ts
src/lib/ai/prompt-templates/script-templates.ts
src/lib/ai/prompt-templates/mesh-templates.ts
src/lib/ai/prompt-templates/audio-templates.ts
src/lib/ai/prompt-templates/index.ts
src/lib/ai/__tests__/quality-scorer.test.ts
src/lib/ai/__tests__/retry-strategy.test.ts
src/lib/ai/__tests__/low-context-amplifier.test.ts
docs/AI_QUALITY.md
```

Nothing existing was edited — every file above is a fresh file on disk.
