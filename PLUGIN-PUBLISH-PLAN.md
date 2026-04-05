# ForjeGames Plugin — Creator Store Publish Plan

**Plugin file:** `public/plugin/ForjeGames.rbxmx`
**Version:** 4.6.0
**Date:** 2026-04-04

---

## BLOCKER: Code Must Be Fixed Before Submission

Roblox moderates plugins for banned patterns. ForjeGames.rbxmx uses TWO flagged patterns that cause automatic rejection:

| Line | Pattern | Policy Violation |
|------|---------|-----------------|
| 2206 | `loadstring(data.code)` | Banned — "obscuring engine features / remote code execution" |
| 2776 | `InsertService:LoadAsset(tonumber(assetId))` | Banned — "requiring remote assets" |

**These WILL get the plugin rejected or the account banned.**

### Fix Strategy

**loadstring (line 2206):**
The `execute_luau` command receives arbitrary code strings from the ForjeGames server and runs them.
This is the plugin's core power feature — but it cannot exist in a public Creator Store release.

Option A (Recommended): Ship two builds.
- **Creator Store build** — remove `execute_luau` entirely. Use only structured commands (set_property, insert_asset, delete_instance, etc). The structured command fallback already exists at line 2216.
- **Direct install build** — the current .rbxmx with loadstring, distributed via forjegames.com/plugin as a manual download.

Option B: Replace loadstring with a whitelist executor (only allows known command types, no arbitrary code). Safer but loses AI-generated Luau flexibility.

**InsertService:LoadAsset (line 2776):**
This is used to load marketplace assets by asset ID. The ban is specifically on assets that *load other scripts/viruses* at runtime, but Roblox's automated scanner flags any `InsertService:LoadAsset` call.

Fix: Keep the call but add a comment block explaining it is used for legitimate marketplace asset insertion. In practice, human reviewers often approve this with context. If it still gets flagged, replace with `game:GetObjects()` for trusted asset IDs only, or handle asset loading server-side via Open Cloud and insert pre-validated instances.

---

## Step-by-Step Publish Process

### Step 1 — Fix the code (1-2 hours)

1. Create `ForjeGames-store.rbxmx` — Creator Store safe build with loadstring removed.
2. The `execute_luau` sync handler at line 2203 should route to `executeStructuredCommand` only.
3. Optionally remove `InsertService:LoadAsset` or add a clear comment.
4. Test the store build in Studio — auth, connect, basic map building must work.

### Step 2 — Prepare metadata assets (30 min)

- **Icon:** 512x512 PNG, square, no transparency required but allowed. Dark background (#050810), gold ForjeGames logo. Save as `plugin-icon-512.png`.
- **Thumbnails (optional, up to 5):** 1920x1080 or 512x512 screenshots showing the plugin panel open in Studio. Show: login screen, connected state, a build being applied.
- **Title:** `ForjeGames — AI Game Builder` (50 chars max recommended)
- **Description:** see draft below

### Step 3 — Upload via Studio (5 min)

1. Open Studio.
2. File > Open Local... > select `ForjeGames-store.rbxmx`
3. In Explorer, right-click the `ForjeGames` Script.
4. Select **Publish as Plugin** from the Plugins menu.
5. Upload icon (512x512).
6. Set Name and Description.
7. Click Submit.
8. Note the asset ID and the Creator Dashboard link.

### Step 4 — Configure distribution via Creator Dashboard (10 min)

1. Open `https://create.roblox.com/dashboard/creations?activeTab=Plugin`
2. Find the ForjeGames plugin.
3. Go to **Configure > Distribution**.
4. Toggle **Distribute on Creator Store** ON.
5. Leave pricing as **Free** (USD Pricing field empty / $0).
6. Optionally upload up to 5 thumbnails.
7. Click **Save**.

### Step 5 — Moderation review

- Roblox runs automated + human review.
- Typical turnaround: **a few hours** for automated pass, up to 24-48h for human review if flagged.
- No email notification — check Creator Dashboard for status.
- If rejected, you get a reason code. Fix and resubmit.

---

## Auto-Update Behavior

Roblox does NOT auto-push plugin updates to users. When you publish a new version:

- Users who installed it see an **update prompt** the next time they open Studio.
- They must click "Update" manually in the Toolbox > Creations.
- The asset ID stays the same — you overwrite the existing asset.

**To push an update:**
In Studio, right-click the plugin script > Save as Plugin > check "Overwrite an existing asset" > select the ForjeGames asset ID.

For urgent hotfixes, you can post a notice in your game/Discord since there is no force-update mechanism.

---

## Pricing — Can It Be Free?

Yes. The default is free. Set **USD Pricing = Free** (default) in the Creator Dashboard.

To charge money later:
- Requires government ID verification + Stripe seller account.
- Minimum price is **$4.99**.
- Takes up to 7 days to get seller account approved.
- Recommendation: launch free, build user base, add premium tier later if warranted.

---

## Account Requirements

- Must be ID-verified OR phone-verified to be discoverable in search (unverified accounts have limited discoverability).
- Unverified accounts: 2 plugins per 30 days max. Verified: 10 plugins per 30 days.
- To sell for USD: government ID required + Stripe seller account (not needed for free).

---

## Creator Store Listing Draft Description

```
ForjeGames is an AI-powered game builder for Roblox Studio.

Connect your Studio to forjegames.com and describe what you want to build in plain English. 
The AI generates Luau commands and applies them directly in your scene — no copy-paste, 
no scripting required.

Features:
• Natural language to Studio actions
• Real-time sync between browser and Studio
• Insert marketplace assets by name
• Set properties, parent/move/delete instances
• Full undo/redo support via ChangeHistoryService
• Dark UI with one-click toggle from the toolbar

How it works:
1. Install this plugin
2. Go to forjegames.com/editor
3. Enter the 6-character code shown in the plugin
4. Start building with AI

Free to use. Requires a forjegames.com account.
```

---

## Timeline Estimate

| Task | Time |
|------|------|
| Fix loadstring (remove from store build) | 1-2 hours |
| Create icon (512x512) | 30 min |
| Upload + configure on Creator Dashboard | 15 min |
| Roblox moderation review | 2-48 hours |
| **Total to live on Creator Store** | **~1 day** |

---

## Common Rejection Reasons (from Roblox moderation policy)

1. `loadstring()` present — automatic flag
2. `InsertService:LoadAsset()` — may flag depending on reviewer
3. `require(assetId)` with numeric ID — banned
4. Obfuscated code — will reject
5. Large unused strings/repeated code — may reject
6. Icon/thumbnail violates community rules (no adult content, hate symbols, etc.)
7. Description is misleading or promises features that aren't in the plugin

---

## Files to Create

- `public/plugin/ForjeGames-store.rbxmx` — cleaned build without loadstring
- `public/plugin/plugin-icon-512.png` — 512x512 icon for listing
- `public/plugin/screenshots/` — optional, up to 5 1920x1080 images
