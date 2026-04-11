# Asset Director

## What is it

The Asset Director is the AI orchestration layer that turns a single user prompt into a fully-populated playable scene with custom meshes, audio, voice, and textures — zero manual steps.

It lives at `src/lib/asset-director.ts` and is exposed to the editor chat via `POST /api/ai/asset-director` (SSE stream).

## Why it exists

Before the director: the user types `"make a medieval village with a blacksmith shop and ambient music"` and the AI emits Luau that uses default Roblox parts and zero audio. The village looks and feels generic.

After the director: the same prompt detects intents like `{mesh: "ornate anvil"}, {mesh: "sword in stone"}, {music: "medieval tavern ambient"}, {sfx: "hammer on anvil"}`, fans them out in parallel to the Meshy/Fal pipelines, and wires the generated Roblox asset ids back into the build. One prompt, a complete custom scene.

## Flow

```
                     ┌─────────────────────┐
                     │  User prompt        │
                     │  (chat message)     │
                     └──────────┬──────────┘
                                │
                                ▼
                     ┌─────────────────────┐
                     │  detectAssetIntents │   ← callAI (Gemini/Groq), JSON mode
                     │  (LLM + Zod)        │
                     └──────────┬──────────┘
                                │
                                ▼
                     ┌─────────────────────┐
                     │ gateIntentsByCredits│   ← getTokenBalance + cost matrix
                     │ (drop enhancements) │
                     └──────────┬──────────┘
                                │
              ┌─────────────────┼─────────────────┐
              ▼                 ▼                 ▼
        ┌──────────┐      ┌──────────┐      ┌──────────┐
        │  mesh    │      │  music   │      │   sfx    │   (Promise.allSettled)
        │ pipeline │      │ pipeline │      │ pipeline │
        └────┬─────┘      └────┬─────┘      └────┬─────┘
             │                 │                 │
             └─────────────────┼─────────────────┘
                               │
                               ▼
                     ┌─────────────────────┐
                     │  aggregated         │
                     │  AssetDirectorResult│
                     │  + spendTokens()    │
                     └─────────────────────┘
```

## Cost matrix

| Intent type | Credits per asset | Notes                                         |
|-------------|-------------------|-----------------------------------------------|
| `mesh`      | 50                | Meshy text-to-3D, most expensive              |
| `music`     | 30                | Fal AI music generation (~30 sec clip)        |
| `texture`   | 20                | Fal text-to-texture (not yet wired — stubbed) |
| `voice`     | 15                | Fal TTS / ElevenLabs                          |
| `sfx`       | 10                | Fal short audio generation                    |

Average directed build (4 intents: 1 mesh + 1 music + 2 sfx) = **100 credits** per prompt.

Worst case (8 intents, all mesh) = **400 credits**.

The director hard-caps at **8 intents per call** and drops `enhancement` priority intents before critical ones when the user's balance is tight.

## How to wire it into the chat route

NOTE: the user-bug agent owns `src/app/(app)/editor/hooks/useChat.ts`. Do NOT edit that file directly. Once their bug fixes land, add the following integration:

1. Inside `useChat.ts`'s `sendMessage` handler, after the normal chat POST succeeds but before setting the assistant message as final:

```ts
// Kick off asset generation in parallel with code generation.
const assetController = new AbortController()
const assetPromise = fetch('/api/ai/asset-director', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ prompt: userMessage, sessionId }),
  signal: assetController.signal,
})
```

2. Parse the SSE stream. On `intent` event, add placeholder rows to the chat UI. On `progress` events, flip each row's status icon. On `complete`, merge the `assetId` values into the emitted Luau code (replacing placeholder part names with `game:GetService("InsertService"):LoadAsset(assetId)` calls).

3. On chat abort (user clicks "stop"), call `assetController.abort()` to propagate cancellation through the director to every downstream pipeline.

4. Render any `earlyExitReason` from the final payload as an info banner so users understand why no generation happened (e.g. "Insufficient credits — top up to use Asset Director").

## Limits & gotchas

- **Meshy wall-clock**: each mesh takes 2-5 minutes. The director does NOT block on completion; it returns once every job has settled. The API route's `maxDuration = 600` (10 min) covers the worst case.
- **Roblox audio moderation**: uploaded audio is moderated asynchronously. A `completed` result means the asset exists in the creator's inventory, not that it has passed moderation yet.
- **Credit spend timing**: credits are deducted AFTER generation, only for `completed` jobs. Failed jobs cost nothing. This means a malicious user could theoretically spam intents they know will fail; the per-user 5/hour rate limit on the route is the backstop.
- **Intent detection is fallible**: the LLM can miss obvious assets or hallucinate weird ones. The Zod validator strips anything malformed, and the max-8 cap prevents runaway fan-out, but the intent-detection prompt at `src/lib/asset-director-prompts.ts` is the main tuning surface — iterate there first when results feel off.
- **Texture pipeline**: still a stub. Texture intents currently return `{status: 'failed', error: 'Texture pipeline not yet wired'}`. Remove the TODO in `dispatchIntent` once `texture-pipeline.ts` ships.
- **Dynamic pipeline imports**: `mesh-pipeline` and `audio-pipeline` are loaded via dynamic `import()` so the director file compiles even if those modules haven't landed yet. The module shapes are declared locally in `asset-director.ts` (`MeshPipelineModule`, `AudioPipelineModule`) — keep those in sync with the real exports.
- **Abort semantics**: the `AbortSignal` is forwarded to each pipeline call. Pipelines are expected to honour it (cancel the Meshy task, close the Fal stream). If a pipeline ignores the signal, the director still marks the job failed once the route's overall `maxDuration` is hit.
