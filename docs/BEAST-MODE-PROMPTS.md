# BEAST MODE PROMPTS — 10 Critical Missions

Each prompt is designed to paste into a FRESH Claude Code window.
Copy one, open a new window, paste it, let it run.

---

## MISSION 1: Plugin Feedback Loop (CRITICAL — you're flying blind)

```
You are working on ForjeGames at C:\dev\roblox-map-building. Read CLAUDE.md first.

MISSION: Make the Roblox Studio plugin report build results back to the server.

RIGHT NOW the server sends code to Studio and has NO IDEA if it worked. The plugin executes silently. We need a two-way feedback loop.

STEP 1: Read packages/studio-plugin/src/Sync.lua — understand how it receives and executes commands.

STEP 2: After the plugin executes a command (in executeStructuredCommands or the loadstring fallback), add a POST request back to the server:

POST /api/studio/build-result
{
  "sessionId": sessionId,
  "commandId": commandId,
  "success": true/false,
  "partCount": number (count parts created in the model),
  "error": string or nil (if it failed, what was the error),
  "executionTimeMs": number
}

The plugin should:
- Count how many parts were actually created (model:GetDescendants() filter BasePart)
- Catch any pcall errors during execution
- Send the result back within 2 seconds of execution
- NOT block the main thread (use task.spawn for the HTTP call)

STEP 3: Create the API route src/app/api/studio/build-result/route.ts that:
- Validates the session exists
- Stores the result in Postgres (create a build_results table if needed, or use prisma)
- Updates the build's quality score with real data
- If success=false, logs the error for the AI learning system (call logScriptError from src/lib/ai/error-learning.ts)

STEP 4: Update the Prisma schema if needed (prisma/schema.prisma) — add a BuildResult model with fields: id, sessionId visitorId, commandId, success, partCount, error, executionTimeMs, createdAt.

STEP 5: Run npx prisma generate after schema changes. Do NOT run prisma migrate — just generate the client.

STEP 6: Test by reading through the code flow. Make sure the plugin Lua is valid syntax.

STEP 7: Rebuild the plugin with: node packages/studio-plugin/build-plugin.js

Commit everything with a clear message. Push to master.

IMPORTANT:
- The plugin is Lua (Roblox Luau), not JavaScript
- Use pcall() for error handling in Lua
- Use HttpService:PostAsync() for the HTTP call
- The plugin already has the session ID and auth token available
- Keep the Lua simple — no complex error handling, just pcall + POST
- Max 2 background agents. Keep bash output short (| head -20).
```

---

## MISSION 2: Guaranteed First Build Success (CRITICAL — first impression is everything)

```
You are working on ForjeGames at C:\dev\roblox-map-building. Read CLAUDE.md first.

MISSION: Make the first build experience IMPOSSIBLE to fail. Right now a new user's first prompt is "Build me a modern house with a garden and driveway" which is complex and often fails. We need a guaranteed success path.

STEP 1: Read src/app/(app)/editor/components/OnboardingOverlay.tsx — understand the current onboarding flow.

STEP 2: Change the onboarding to a GUIDED first build:
- Instead of a text prompt, show 4 clickable cards: "Tree", "House", "Car", "Sword"
- Each card has an icon/emoji, a short description, and a "Build This!" button
- When clicked, it sends the prompt to the chat AND the build uses the instant template system (getInstantTemplate in src/app/api/ai/chat/route.ts) which is 100% reliable — zero API calls, always works

STEP 3: After the first build succeeds, show a celebration:
- Confetti animation (already exists: BuildSuccessCelebration in ChatPanel.tsx)
- Message: "Your first build! It's in Studio right now. Want to try something bigger?"
- 3 next-step buttons: "Build a Castle", "Build a Spaceship", "Type anything you want"

STEP 4: Track the first build in localStorage AND the server:
- Set localStorage flag: forje_first_build_complete = true
- POST to /api/gamification/achievements/check with achievement "first_build"
- This flag should skip the onboarding on future visits

STEP 5: Make the "first build" cards visually match the editor theme (dark bg, gold accents, clean). Use the existing design system — rgba backgrounds, gold #D4AF37, smooth animations.

STEP 6: If Studio is NOT connected, the first build should still work — show the code in the chat with a "Copy to Studio" button and the ManualBuildPanel. The experience should feel complete even without the plugin.

Test by reading through the flow. Commit and push.

IMPORTANT: 
- The instant templates (tree, house, car, sword) ALWAYS work — they're hardcoded Luau code, no AI needed
- Don't change the instant templates themselves, just wire the onboarding to use them
- Keep the UI clean and simple — 4 cards, not 20 options
- Max 2 background agents
```

---

## MISSION 3: Funnel Analytics with PostHog (CRITICAL — you can't improve what you can't measure)

```
You are working on ForjeGames at C:\dev\roblox-map-building. Read CLAUDE.md first.

MISSION: Add funnel analytics so we can track: signup → editor_opened → first_build → build_success → second_build → payment. We need to know WHERE users drop off.

Use PostHog (free tier: 1M events/month, no credit card needed).

STEP 1: Install PostHog
- npm install posthog-js posthog-node
- Create a PostHog provider component at src/components/PostHogProvider.tsx
- Add it to src/app/layout.tsx (client-side, wrap the app)
- Use the project API key from env: NEXT_PUBLIC_POSTHOG_KEY
- Host: https://us.i.posthog.com (or eu if needed)

STEP 2: Track these events (client-side, in the browser):

a) "signup_completed" — fire in src/app/(auth)/sign-up/[[...sign-up]]/page.tsx or the Clerk afterSignUp callback
b) "editor_opened" — fire in src/app/(app)/editor/SimplifiedEditor.tsx on mount
c) "first_build_started" — fire when user sends their FIRST message in useChat.ts
d) "build_sent" — fire when any build is sent (in useChat.ts when AI responds with code)
e) "build_success" — fire when Studio reports success (will come from plugin feedback — for now fire when executedInStudio=true in the chat response)
f) "second_build" — fire when message count > 1 build
g) "payment_started" — fire on checkout button click in pricing page
h) "payment_completed" — fire in the Stripe webhook success handler (server-side, use posthog-node)

STEP 3: Add user identification:
- On auth, call posthog.identify(userId, { email, plan, signupDate })
- On plan change, call posthog.capture('plan_changed', { from, to, price })

STEP 4: Add the NEXT_PUBLIC_POSTHOG_KEY env var to Vercel (just set it to empty string for now, the actual key gets created when Vyren signs up at posthog.com)

STEP 5: Make sure PostHog doesn't load in development (check NODE_ENV)

STEP 6: Add a simple /api/admin/analytics/funnel route that returns the funnel data from PostHog's API (or just let Vyren use the PostHog dashboard directly)

Commit and push. Include setup instructions in the commit message for how to get the PostHog key.

IMPORTANT:
- PostHog is the analytics tool, not a custom solution
- Client-side events use posthog-js, server-side use posthog-node
- Don't track PII (no names, no emails in events — just userId)
- Wrap all posthog calls in try/catch so analytics never breaks the app
- Max 2 background agents
```

---

## MISSION 4: Landing Page Demo Video Section (CRITICAL — show don't tell)

```
You are working on ForjeGames at C:\dev\roblox-map-building. Read CLAUDE.md first.

MISSION: Add a video demo section to the landing page that shows ForjeGames working in real-time. This is the #1 conversion lever — a 14 year old needs to SEE it work before they'll try it.

STEP 1: Read the current landing page at src/app/(marketing)/page.tsx (or wherever the home page is — check src/app/page.tsx too). Understand the existing sections and design system.

STEP 2: Create a new "See It In Action" section that goes ABOVE the pricing section (or right after the hero). It should contain:

a) Section header: "See It In Action" with a subheading "Type anything. Watch it build."

b) A video player container (16:9 aspect ratio) with:
   - A placeholder/thumbnail image showing a Studio viewport with a build
   - A big centered play button (gold circle with white triangle)
   - When clicked, embed a YouTube video or play a self-hosted video
   - Use a simple state toggle: thumbnail → iframe/video player
   - YouTube embed URL will be set via env var NEXT_PUBLIC_DEMO_VIDEO_URL (default to empty, show placeholder)

c) Below the video, show 3 "proof cards" in a row:
   - "200+ AI Specialists" with a brain icon
   - "Works in Roblox Studio" with a Studio icon  
   - "Free to Start" with a gift icon

d) If no video URL is set, show a static mockup instead:
   - A fake chat bubble: user says "build me a medieval castle"
   - A fake response with a screenshot/preview of a castle build
   - Use a CSS animation that types out the user message letter by letter

STEP 3: Make it responsive:
- Desktop: video takes 60% width, centered, max 800px
- Mobile: video takes full width with 16px padding
- Proof cards: 3 columns on desktop, stack on mobile

STEP 4: Style it to match the existing dark theme:
- Background: same dark gradient as rest of page
- Gold accents for the play button and card icons
- Subtle glass effect on the proof cards
- No new fonts or colors — use existing design system

STEP 5: Add the NEXT_PUBLIC_DEMO_VIDEO_URL env var placeholder in Vercel.

Commit and push. The section should look polished even without a real video (the animated mockup is the fallback).

IMPORTANT:
- Do NOT actually create a video — just build the section that displays one
- The animated chat mockup is the key fallback — make it look real
- Keep it under 200 lines of code — this is a section, not a page
- No external dependencies for the video player — just an iframe for YouTube
- Max 2 background agents
```

---

## MISSION 5: Make Free Tier LOUD on Pricing Page (CRITICAL — teens leave when they see $25 first)

```
You are working on ForjeGames at C:\dev\roblox-map-building. Read CLAUDE.md first.

MISSION: Redesign the pricing page so the FREE tier is the most prominent thing. Right now a 14-year-old sees $25/mo first and bounces. Rebirth is $8.99. We need to lead with FREE.

STEP 1: Read the current pricing page: src/app/(marketing)/pricing/page.tsx (or wherever it is — search for "pricing" in the (marketing) folder).

STEP 2: Restructure the pricing tiers:

a) FREE tier should be FIRST (leftmost on desktop, top on mobile)
   - Gold border, slightly larger than other cards
   - Big "FREE" badge at the top
   - "No credit card required" prominently displayed
   - Clear limits: "50 builds/month, 5 AI models, Community support"
   - CTA: "Start Building Free" (gold button, biggest on the page)

b) Add a "MOST POPULAR" badge on the Builder ($25) or Starter ($10) tier
   - Use a ribbon or highlighted border

c) Add a "14-Day Free Trial" banner ABOVE all pricing cards
   - Full width, gold background, white text
   - "Try any plan free for 14 days. No credit card. Cancel anytime."

d) Add token explainer below the tiers:
   - "What can I build with tokens?"
   - Simple grid: "1 token = 1 AI generation. 100 tokens = ~30 houses, 20 game scripts, 10 full games"
   - Make it visual with icons

STEP 3: Add a comparison table below the cards:
   - Feature rows: AI Models, Builds/month, 3D Generation, Script Generation, Priority Support, etc.
   - Check marks for included, X for not included
   - FREE column highlighted

STEP 4: Add social proof above pricing:
   - "Trusted by 100+ Roblox creators" (or whatever the real number is)
   - Even if small, showing a number builds trust

STEP 5: Make the "Start Free" CTA appear in 3 places:
   - Hero/top of page
   - On the FREE tier card
   - Sticky bottom bar on mobile

Keep the existing dark theme, gold accents. Make it responsive.

Commit and push.

IMPORTANT:
- Don't change actual prices or Stripe integration — just the visual layout
- The FREE tier must be impossible to miss
- A 14-year-old should understand every word on this page
- No jargon: "tokens" need explanation, "AI models" need context
- Max 2 background agents
```

---

## MISSION 6: Server-Side Session Persistence (CRITICAL — users lose everything on browser close)

```
You are working on ForjeGames at C:\dev\roblox-map-building. Read CLAUDE.md first.

MISSION: Chat sessions are only saved in browser localStorage. If a user closes their tab, clears their browser, or switches devices, ALL their build history is gone. We need server-side persistence.

STEP 1: Read src/app/(app)/editor/hooks/useChat.ts — understand how sessions are currently saved to localStorage.

STEP 2: Read src/lib/session-persistence.ts and src/app/api/sessions/ — there may already be a cloud session system. If it exists, check if it's actually wired into useChat.ts and working.

STEP 3: If cloud sessions exist but aren't wired:
- Wire them into useChat.ts — auto-save to server every 30 seconds and on page unload (beforeunload event)
- Auto-load from server on mount if localStorage is empty
- Merge server + local sessions (local wins if newer)

STEP 4: If cloud sessions DON'T exist, create them:
- API route: POST /api/sessions/save — saves session to Postgres
- API route: GET /api/sessions/load — loads all sessions for the authenticated user
- API route: DELETE /api/sessions/:id — deletes a session
- Prisma model: ChatSession { id, userId, title, messages (JSON), createdAt, updatedAt }

STEP 5: Add auto-save logic to useChat.ts:
- Debounced save (wait 5 seconds after last message before saving to reduce writes)
- Save on beforeunload (navigator.sendBeacon for reliability)
- Show a small "Saved" indicator in the UI when cloud save succeeds
- Graceful degradation: if server save fails, localStorage still works

STEP 6: Add session loading to the editor:
- On mount, if user is authenticated, fetch cloud sessions
- Merge with localStorage sessions
- Show in the LeftDrawer session list

Commit and push.

IMPORTANT:
- Check if session persistence already exists before building from scratch
- Use the user's Clerk ID for authentication
- Messages can be large — use JSON column, not individual rows
- Don't save images/files in sessions — just message text and metadata
- Max 2 background agents
```

---

## MISSION 7: Auth Route Rate Limiting (CRITICAL — security vulnerability)

```
You are working on ForjeGames at C:\dev\roblox-map-building. Read CLAUDE.md first.

MISSION: Sign-up, sign-in, and API routes have ZERO rate limiting. Someone can brute-force signups, enumerate users, or DDoS the auth system. The AI chat routes have rate limiting but auth was forgotten.

STEP 1: Read src/middleware.ts — understand the current rate limiting setup. Find where AI routes are rate-limited and auth routes are not.

STEP 2: Add rate limiting to these routes:
- /api/auth/* — 10 requests per minute per IP
- /sign-in/* — 20 requests per minute per IP  
- /sign-up/* — 5 requests per minute per IP (signups should be rare)
- /api/billing/* — 10 requests per minute per user
- /api/studio/connect — 5 requests per minute per user (prevents session spam)

STEP 3: Use the existing rate limiting mechanism if one exists (check for Upstash ratelimit, or a custom limiter). If not, use Upstash @upstash/ratelimit with the existing Redis connection.

STEP 4: Return proper 429 responses with Retry-After header. The response should be JSON: { error: "rate_limited", retryAfter: seconds }

STEP 5: Add rate limiting to the most expensive API routes if not already limited:
- /api/ai/chat — should already be limited, verify
- /api/ai/generate — verify
- /api/ai/3d-generate — verify

STEP 6: Test by reading through middleware.ts and verifying the rate limit rules are applied to the correct paths.

Commit and push.

IMPORTANT:
- Don't break existing auth flows — rate limits should be generous enough for normal use
- Use IP-based limiting for unauthenticated routes, user-based for authenticated
- Clerk handles actual auth security — this is about preventing abuse of YOUR endpoints
- Check if Upstash Redis is already configured before adding new connections
- Max 2 background agents
```

---

## MISSION 8: Welcome Email + Drip Campaign (CRITICAL — no re-engagement)

```
You are working on ForjeGames at C:\dev\roblox-map-building. Read CLAUDE.md first.

MISSION: When someone signs up, they get NO welcome email. When they churn, there's NO re-engagement. We need a welcome email and a 3-email drip sequence to bring users back.

STEP 1: Read src/lib/email.ts and src/app/api/webhooks/clerk/route.ts — understand the current email setup (Resend is the provider).

STEP 2: Check if there's already an email drip system. Search for "drip", "welcome email", "onboarding email" in the codebase.

STEP 3: Create or update the welcome email that fires on signup (Clerk user.created webhook):
- Subject: "Welcome to ForjeGames — let's build your first game"
- Body: Clean HTML email with:
  - ForjeGames logo
  - "Hey [name], welcome! You're one of our early creators."
  - "Here's how to get started in 60 seconds:"
  - Step 1: Open the editor (link)
  - Step 2: Type "build me a castle" 
  - Step 3: Watch it appear in Studio
  - Big CTA button: "Open the Editor" → forjegames.com/editor
  - Footer: unsubscribe link

STEP 4: Create a 3-email drip sequence (check if src/app/api/crons/email-drip/ exists):
- Day 1 (signup): Welcome email (above)
- Day 3: "Did you try building yet?" — shows 3 example builds with screenshots, CTA to editor
- Day 7: "Builders like you are creating amazing games" — social proof, shows what others built, CTA to editor

STEP 5: Each email should:
- Use Resend's API (already configured)
- Have proper unsubscribe handling
- Be HTML-formatted, mobile-responsive
- Track opens/clicks if Resend supports it
- NOT send if user already has 5+ builds (they're engaged, don't spam them)

STEP 6: The drip cron should run daily (check vercel.json for existing cron config, add if needed):
- Path: /api/crons/email-drip
- Schedule: every day at 10am UTC

Commit and push.

IMPORTANT:
- Resend is already configured — use existing setup, don't add new email providers
- Emails must have unsubscribe links (CAN-SPAM compliance, audience includes minors)
- Keep emails SHORT — teens don't read long emails
- Use the ForjeGames brand colors (gold #D4AF37 on dark)
- Check if the cron already exists before creating a new one
- Max 2 background agents
```

---

## MISSION 9: Silent Error Killer (CRITICAL — 121 catch blocks swallowing errors)

```
You are working on ForjeGames at C:\dev\roblox-map-building. Read CLAUDE.md first.

MISSION: There are 121+ silent catch {} blocks throughout the codebase that swallow errors without any user feedback or logging. Users hit errors and see blank screens. We need to fix the worst offenders.

STEP 1: Search the codebase for silent error patterns:
- grep for "catch {" and "catch()" with empty bodies
- grep for "catch (e) { }" and "catch { /* " 
- Focus on files that users interact with: components, API routes, hooks

STEP 2: Categorize by severity. Fix the TOP 20 worst ones — the ones that affect user-facing functionality:

Priority 1 — API routes (user gets no response):
- src/app/api/ai/chat/route.ts — any catch that returns nothing
- src/app/api/billing/ — payment errors that get swallowed
- src/app/api/studio/ — connection errors hidden from user

Priority 2 — Components (user sees blank/broken UI):
- src/components/editor/ChatPanel.tsx — rendering errors
- src/app/(app)/editor/ — editor crashes silently

Priority 3 — Hooks (state gets corrupted silently):
- src/app/(app)/editor/hooks/useChat.ts — message send failures
- src/app/(app)/editor/hooks/useStudioConnection.ts — connection drops

STEP 3: For each fix:
- If it's a user-facing error: add a toast notification or error message
- If it's a background error: add console.error with context
- If it's critical (payment, auth): add proper error response to the client
- NEVER just add console.log — add real error handling

STEP 4: Do NOT fix localStorage catches (those are intentionally silent for SSR compatibility) or analytics catches (non-critical). Only fix catches that affect core user flows.

STEP 5: Add a global error boundary if one doesn't exist:
- src/app/error.tsx — catches React rendering errors
- Shows a "Something went wrong" page with a "Try Again" button
- Logs the error to console (or Sentry if configured)

Commit with a clear message listing what was fixed.

IMPORTANT:
- Don't add error handling to EVERY catch — only the top 20 worst ones
- The goal is user feedback, not logging. Users need to know something went wrong.
- Use existing toast system if available (check for useToast or EditorToasts)
- Don't break SSR — some catches MUST stay silent (localStorage, window access)
- Max 2 background agents
```

---

## MISSION 10: Mobile Editor Touch Support (CRITICAL — 60% of Roblox users are mobile)

```
You are working on ForjeGames at C:\dev\roblox-map-building. Read CLAUDE.md first.

MISSION: The editor is barely usable on mobile phones. 60%+ of Roblox's audience uses mobile. The chat input is too small, buttons are hard to tap, and there's no consideration for safe areas (notch, home indicator).

STEP 1: Read these files and assess current mobile support:
- src/app/(app)/editor/SimplifiedEditor.tsx — main layout
- src/components/editor/ChatPanel.tsx — chat interface
- src/app/(app)/editor/components/EditorTopBar.tsx — header
- src/hooks/useMediaQuery.ts — check what breakpoint defines "mobile"

STEP 2: Fix the critical mobile issues:

a) INPUT AREA: The textarea and buttons need to be touch-friendly:
   - Minimum 44px touch targets on ALL buttons (Apple HIG standard)
   - Input textarea: minimum 48px height on mobile, 16px font (prevents iOS zoom)
   - Send button: 44x44px minimum
   - Plus/attach buttons: 44x44px minimum

b) SAFE AREAS: The input must not be hidden behind the iPhone notch or home bar:
   - Add env(safe-area-inset-bottom) padding to the input container
   - Add env(safe-area-inset-top) to the top bar
   - Test with: padding-bottom: calc(16px + env(safe-area-inset-bottom, 0px))

c) MESSAGE BUBBLES: Too wide on mobile, text too small:
   - AI bubbles: max-width 95% on mobile (not 90%)
   - User bubbles: max-width 88% on mobile
   - Font size: 15px minimum on mobile (14.5 is too small on phones)
   - Code blocks: horizontal scroll with -webkit-overflow-scrolling: touch

d) KEYBOARD HANDLING: When the virtual keyboard opens:
   - Chat should scroll up so input stays visible
   - Add visualViewport resize listener to handle keyboard
   - The input should stick to the keyboard top, not the screen bottom

e) TOP BAR: Make it compact on mobile:
   - Hide model selector text, show only icon
   - Reduce top bar height to 44px on mobile
   - Add hamburger menu for less-used features

STEP 3: Add the viewport meta tag if not present:
   <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover" />

STEP 4: Test by setting Chrome DevTools to iPhone 14 Pro (390x844) and verify:
   - All buttons are tappable
   - Input doesn't hide behind safe areas
   - Code blocks scroll horizontally
   - No horizontal overflow on the page

Commit and push.

IMPORTANT:
- Only fix mobile issues, don't change desktop layout
- Use the existing useIsMobile() hook for conditional styles
- Don't add a new CSS framework — use inline styles matching the existing pattern
- Focus on the EDITOR page only, not marketing pages
- Max 2 background agents
```

---

## HOW TO RUN THESE

1. Open a new Claude Code window
2. Copy ONE prompt above
3. Paste it
4. Let it run autonomously
5. Move to the next window with the next prompt

Run missions 1-5 first (highest priority). Then 6-10.

Missions 1, 3, and 4 can run in PARALLEL (they don't touch the same files).
Missions 2 and 5 can run in PARALLEL.
Missions 6-10 can run in PARALLEL after 1-5 are done.
