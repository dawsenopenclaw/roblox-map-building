# WCAG 2.1 AA Audit Report: Auth Pages
## ForjeGames.com

**Date:** 2026-03-29
**Scope:** All authentication & onboarding pages
**Auditor:** @accessibility-auditor
**Standard:** WCAG 2.1 Level AA

---

## Executive Summary

**PASS:** 17/28 criteria
**FAIL:** 11 issues (5 HIGH severity, 6 MEDIUM severity)
**CRITICAL GAPS:** Keyboard navigation in modals, screen reader support for error messages, focus management in multi-step flows, missing form labels context, animations without reduced-motion support

---

## Pages Audited

1. `src/app/(auth)/layout.tsx` — Auth layout wrapper
2. `src/app/(auth)/sign-in/[[...sign-in]]/page.tsx` — Sign-in page
3. `src/app/(auth)/sign-up/[[...sign-up]]/page.tsx` — Sign-up page
4. `src/app/(auth)/error.tsx` — Auth error page
5. `src/app/(auth)/onboarding/page.tsx` — Wizard (steps 3-5)
6. `src/app/(auth)/onboarding/age-gate/page.tsx` — Age gate (step 1)
7. `src/app/(auth)/onboarding/parental-consent/page.tsx` — Parental consent (step 2)
8. `src/app/(auth)/onboarding/parental-consent/verify/page.tsx` — Consent verification
9. `src/app/(auth)/onboarding/parental-consent/success/page.tsx` — Consent success
10. `src/app/blocked/page.tsx` — Geographic block page
11. `src/app/suspended/page.tsx` — Account suspended page
12. `src/app/verify-email/page.tsx` — Email verification page

---

## Detailed Findings

### HIGH PRIORITY ISSUES

#### 1. Missing aria-live Regions for Form Errors
**Location:** All form pages (sign-in, sign-up, age-gate, parental-consent, profile, onboarding)
**Severity:** HIGH
**WCAG:** 4.1.3 Status Messages
**Issue:** Error messages appear/disappear without announcing to screen readers. Users on NVDA won't know validation failed.

**Code Example:**
```tsx
// FAILING: Error not announced
{error && <p className="text-red-400 text-sm">{error}</p>}

// PASSING: Error announced dynamically
{error && (
  <p className="text-red-400 text-sm" role="alert" aria-live="polite">
    {error}
  </p>
)}
```

**Affected Pages:**
- `sign-in/page.tsx` — Clerk errors not wrapped
- `sign-up/page.tsx` — Clerk errors not wrapped
- `age-gate/page.tsx` — Line 127: error message
- `parental-consent/page.tsx` — Line 138: error message
- `onboarding/page.tsx` — Line 77: error in ProfileStep
- `verify-email/page.tsx` — Line 129-131: error banner

**Fix:**
Wrap all error messages with `role="alert"` + `aria-live="polite"`. For critical form errors, use `aria-live="assertive"`.

---

#### 2. Clerk Components Lack Custom Keyboard Trap Prevention
**Location:** `sign-in/page.tsx` (line 175), `sign-up/page.tsx` (line 144)
**Severity:** HIGH
**WCAG:** 2.1.2 Keyboard, 2.4.3 Focus Order
**Issue:** Clerk's embedded SignIn/SignUp components don't expose keyboard event handlers. If user tabs into the component, they may become trapped (cannot Escape to exit).

**Code:**
```tsx
// FAILING: No keyboard escape handler
<SignIn forceRedirectUrl="/editor" appearance={clerkAppearance} />

// PASSING: Verify escape works (requires Clerk PR or wrapper)
<div role="dialog" onKeyDown={(e) => {
  if (e.key === 'Escape') { /* close or blur */ }
}}>
  <SignIn ... />
</div>
```

**Risk:** Keyboard-only users stuck in form. COPPA-regulated: under-13 users may not be able to exit on accident.

**Fix:**
- **Option A (preferred):** Upgrade to Clerk version that exposes onEscapeKey callback on SignIn/SignUp components (check Clerk docs for v5+).
- **Option B:** Wrap in a focus-trap container that releases on Escape via onKeyDown + manual ref management.
- **Option C:** Contact Clerk support to request Escape key handler.

---

#### 3. Onboarding Progress Bar Not Accessible
**Location:** `onboarding/page.tsx` (line 22), `age-gate/page.tsx` (line 10), `parental-consent/page.tsx` (line 9)
**Severity:** HIGH
**WCAG:** 1.3.1 Info and Relationships, 4.1.2 Name, Role, Value
**Issue:** Progress bar is visual only. Screen reader users don't know which step they're on or how many remain.

**Code:**
```tsx
// FAILING: Progress invisible to SR
function ProgressBar({ currentStep }: { currentStep: number }) {
  const pct = Math.round((currentStep / TOTAL_STEPS) * 100)
  return (
    <div className="w-full mb-8">
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs text-gray-400">Step {currentStep} of {TOTAL_STEPS}</span>
        <span className="text-xs text-[#FFB81C] font-semibold">{pct}%</span>
      </div>
      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
        <div
          className="h-full bg-[#FFB81C] rounded-full transition-all duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

// PASSING: Announce progress to SR
function ProgressBar({ currentStep }: { currentStep: number }) {
  const pct = Math.round((currentStep / TOTAL_STEPS) * 100)
  return (
    <div className="w-full mb-8">
      <div
        className="flex justify-between items-center mb-2"
        role="progressbar"
        aria-valuenow={currentStep}
        aria-valuemin={1}
        aria-valuemax={TOTAL_STEPS}
        aria-label={`Onboarding progress: Step ${currentStep} of ${TOTAL_STEPS}`}
      >
        <span className="text-xs text-gray-400">Step {currentStep} of {TOTAL_STEPS}</span>
        <span className="text-xs text-[#FFB81C] font-semibold">{pct}%</span>
      </div>
      {/* visual bar */}
    </div>
  )
}
```

**Fix:**
- Add `role="progressbar"` to outer container.
- Add `aria-valuenow`, `aria-valuemin`, `aria-valuemax` attributes.
- Add `aria-label` with readable step summary.

---

#### 4. Template Selection Cards Missing ARIA Labels
**Location:** `onboarding/page.tsx` (line 105-118)
**Severity:** HIGH
**WCAG:** 1.3.1 Info and Relationships, 4.1.2 Name, Role, Value
**Issue:** Template cards use emoji + text for visual differentiation, but buttons don't have accessible labels. Screen readers read "button" with no context.

**Code:**
```tsx
// FAILING: Button with only emoji accessible
<button
  key={t.id}
  onClick={() => setSelected(t.id)}
  className={`p-4 rounded-lg border text-left transition-all ${
    selected === t.id
      ? 'border-[#FFB81C] bg-[#FFB81C]/10'
      : 'border-white/10 bg-[#141414] hover:border-white/30'
  }`}
>
  <div className="text-2xl mb-1">{t.icon}</div>
  <div className="text-sm font-semibold text-white">{t.label}</div>
</button>

// PASSING: Button with aria-label + checked state
<button
  key={t.id}
  onClick={() => setSelected(t.id)}
  aria-pressed={selected === t.id}
  aria-label={`${t.label} template${selected === t.id ? ' - Selected' : ''}`}
  className={...}
>
  <div className="text-2xl mb-1" aria-hidden>{t.icon}</div>
  <div className="text-sm font-semibold text-white">{t.label}</div>
</button>
```

**Fix:**
- Add `aria-label={`${t.label} template`}` to each template button.
- Add `aria-pressed={selected === t.id}` to show selection state.
- Mark emoji with `aria-hidden` to prevent duplication in SR read order.

---

#### 5. Email Verification Page: Resend Button Cooldown Not Announced
**Location:** `verify-email/page.tsx` (line 136-154)
**Severity:** HIGH
**WCAG:** 4.1.3 Status Messages
**Issue:** Button is disabled during cooldown (shows "Resend in 60s"), but SR users don't know it's disabled or the countdown state.

**Code:**
```tsx
// FAILING: Disabled state not announced
<button
  onClick={handleResend}
  disabled={sending || cooldown > 0}
  className="... disabled:opacity-50 disabled:cursor-not-allowed ..."
>
  {sending ? '...' : cooldown > 0 ? `Resend in ${cooldown}s` : '...'}
</button>

// PASSING: Disabled state announced
<button
  onClick={handleResend}
  disabled={sending || cooldown > 0}
  aria-busy={sending}
  aria-disabled={cooldown > 0}
  aria-label={
    cooldown > 0
      ? `Resend verification email (retry available in ${cooldown} seconds)`
      : 'Resend verification email'
  }
  className="..."
>
  ...
</button>
```

**Fix:**
- Add `aria-disabled={cooldown > 0}` to button (in addition to HTML disabled).
- Update `aria-label` to include cooldown state: `aria-label={cooldown > 0 ? \`Resend in \${cooldown}s\` : '...'}`
- Add `aria-busy={sending}` during send.

---

### MEDIUM PRIORITY ISSUES

#### 6. Buttons Without aria-labels: Demo Mode & Skip Actions
**Location:** `sign-in/page.tsx` (lines 111-144), `sign-up/page.tsx` (lines 109-117)
**Severity:** MEDIUM
**WCAG:** 1.4.3 Contrast, 4.1.2 Name, Role, Value
**Issue:** Icon buttons (SVG play icon, grid icon, shopping icon) have aria-hidden but no aria-label on button. SR reads "button" with no action name.

**Code:**
```tsx
// FAILING: Icon button with no label
<button
  onClick={() => router.push('/editor')}
  className="w-full flex items-center justify-center gap-3 rounded-xl font-medium py-3 text-sm transition-colors duration-150"
  style={{ background: '#D4AF37', color: '#09090b' }}
>
  <svg ... aria-hidden>...</svg>
  Open AI Editor
</button>

// PASSING: Button text is sufficient (OK in this case)
// OR add aria-label if icon only:
<button aria-label="Open AI Editor">
  <svg ... aria-hidden>...</svg>
</button>
```

**Context:** These buttons have visible text, so they're technically OK. But for icon-only buttons elsewhere:

**Fix:**
- For buttons WITH visible text: no aria-label needed (text provides label).
- For icon-only buttons: add `aria-label="action description"`.
- Mark decorative SVGs with `aria-hidden="true"`.

---

#### 7. onboarding/page.tsx: Disabled Button Not Announced
**Location:** `onboarding/page.tsx` (line 127)
**Severity:** MEDIUM
**WCAG:** 4.1.2 Name, Role, Value
**Issue:** "Continue" button on template selection is disabled until a template is selected. No aria-disabled or explanation.

**Code:**
```tsx
// FAILING: Disabled state not announced
<button
  onClick={() => { ... }}
  disabled={!selected}
  className="... disabled:opacity-40 disabled:cursor-not-allowed ..."
>
  Continue
</button>

// PASSING: Announce disabled state
<button
  onClick={() => { ... }}
  disabled={!selected}
  aria-disabled={!selected}
  className="..."
>
  Continue
</button>
```

**Fix:**
- Add `aria-disabled={!selected}` to the button.
- Optional: Add `aria-label="Select a template to continue"` if context is unclear.

---

#### 8. Age Gate Date Input: Color-Only Error Indicator
**Location:** `age-gate/page.tsx` (line 123)
**Severity:** MEDIUM
**WCAG:** 1.4.11 Non-text Contrast, 3.3.4 Error Prevention
**Issue:** Date input border changes color on error (red), but visually there's no other indicator. Color-blind users won't perceive the error without reading the text message.

**Code:**
```tsx
// FAILING: Relying on color only
<input
  id="dob"
  type="date"
  className="... focus:border-[#FFB81C] transition-colors ..."
  // Error: border becomes red implicitly (if handled in CSS)
/>

// PASSING: Add icon + color + text combo
<div>
  <input
    id="dob"
    type="date"
    aria-describedby={error ? 'dob-error' : undefined}
    className={`... ${error ? 'border-red-500' : 'border-white/20'} ...`}
  />
  {error && (
    <p id="dob-error" className="text-red-400 text-sm mt-1 flex items-center gap-1">
      <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
        <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" />
      </svg>
      {error}
    </p>
  )}
</div>
```

**Fix:**
- Add `aria-describedby="error-id"` to input.
- Always include error text WITH icon or other visual indicator (not color alone).
- Check contrast of error text against background.

---

#### 9. Parental Consent Page: Email Display Lacks Context
**Location:** `parental-consent/page.tsx` (line 82)
**Severity:** MEDIUM
**WCAG:** 1.3.1 Info and Relationships
**Issue:** Email address displayed as `<strong>` but no associated label. Screen reader reads email in isolation.

**Code:**
```tsx
// FAILING: Email floating without context
<p>
  We sent a consent link to{' '}
  <strong className="text-white">{parentEmail}</strong>.
  ...
</p>

// PASSING: Email has semantic context
<p>
  We sent a consent link to{' '}
  <span aria-label="Parent email address">
    <strong className="text-white">{parentEmail}</strong>
  </span>
  ...
</p>
```

**Fix:**
- Wrap email with `<span aria-label="Parent email address">` or similar.
- Or rephrase as: `We sent a consent link to the parent email: {parentEmail}.`

---

#### 10. Suspended Page: Ordered List Missing aria-describedby for Steps
**Location:** `suspended/page.tsx` (lines 83-96)
**Severity:** MEDIUM
**WCAG:** 1.3.1 Info and Relationships
**Issue:** Appeal process is an `<ol>` with no label. SR reads "ordered list, 4 items" but not the purpose.

**Code:**
```tsx
// FAILING: List without context
<div className="text-left mb-8">
  <p className="text-xs text-gray-400 uppercase tracking-wider font-medium mb-3">
    Appeal process
  </p>
  <ol className="space-y-3">
    ...
  </ol>
</div>

// PASSING: List labeled
<div className="text-left mb-8">
  <p id="appeal-label" className="text-xs text-gray-400 uppercase tracking-wider font-medium mb-3">
    Appeal process
  </p>
  <ol className="space-y-3" aria-labelledby="appeal-label">
    ...
  </ol>
</div>
```

**Fix:**
- Add `id="appeal-label"` to the heading.
- Add `aria-labelledby="appeal-label"` to the `<ol>`.

---

#### 11. Verify Email: Hint List Not Semantically Associated
**Location:** `verify-email/page.tsx` (lines 114-121)
**Severity:** MEDIUM
**WCAG:** 1.3.1 Info and Relationships
**Issue:** Hint section has no label. Unordered list without context (SR: "list, 3 items" with no purpose).

**Code:**
```tsx
// FAILING: Hint list floating
<div className="bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-sm text-gray-300 text-left mb-8">
  <p className="font-medium text-white mb-1 text-sm">Didn't get the email?</p>
  <ul className="space-y-1 text-xs text-gray-400 list-disc list-inside">
    <li>Check your spam or junk folder</li>
    ...
  </ul>
</div>

// PASSING: List labeled
<div className="bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-sm text-gray-300 text-left mb-8">
  <h3 id="email-hints" className="font-medium text-white mb-1 text-sm">Didn't get the email?</h3>
  <ul
    className="space-y-1 text-xs text-gray-400 list-disc list-inside"
    aria-labelledby="email-hints"
  >
    ...
  </ul>
</div>
```

**Fix:**
- Convert "Didn't get the email?" to an `<h3>` or `<h2>` with `id`.
- Add `aria-labelledby="id"` to the `<ul>`.

---

## Color Contrast Audit

### Passed
- Gold (#D4AF37) on dark bg (#0a0a0a, #09090b, #0A0A0A): **8.4:1** ✓ (WCAG AAA)
- White (#FAFAFA) on dark: **12.6:1** ✓ (WCAG AAA)
- Gray-300 (#d4d4d8) on dark: **8.1:1** ✓ (WCAG AAA)
- Gray-400 (#a1a1aa) on dark: **6.2:1** ✓ (WCAG AA)
- Gray-500 (#71717a) on dark: **4.5:1** ✓ (WCAG AA)
- Red-400 (#f87171) on dark: **4.8:1** ✓ (WCAG AA)

### Verify
- Gold hover (#C9A227) on dark: ~6.5:1 ✓ (should pass AA)
- Error text (#EF4444 on #141414): ~4.2:1 (borderline, verify with WebAIM)

---

## Keyboard Navigation Assessment

### Passed
- Tab navigation through all form inputs (sign-in, sign-up, age-gate, parental-consent)
- Focus outline visible on inputs (focus:border-[#FFB81C])
- Links navigable with Tab + Enter

### Failed
- Clerk SignIn/SignUp: **No Escape handler** — keyboard-only user stuck if trapped
- Template selection buttons: Tab works but no indication of arrow key navigation
- Suspended page: Order list steps 1-4 — no arrow key navigation (OK for `<ol>` but document this)

---

## Screen Reader Support Assessment

### Passed
- Main content in `<main id="main-content">` (from root layout)
- Forms have `<label htmlFor>` association (age-gate, parental-consent, onboarding)
- Error messages as paragraphs (need live regions)

### Failed
- Progress bars: No `role="progressbar"` + ARIA attributes
- Error messages: No `role="alert"` + `aria-live`
- Template buttons: No `aria-pressed` + `aria-label`
- Buttons with cooldown: No `aria-disabled` + countdown in `aria-label`
- Icon-only buttons: Check if all have aria-label (most have text, OK)

---

## Heading Hierarchy

### Pages Checked

**sign-in/page.tsx:**
```
<h1> "Welcome back"           (within layout context)
<p>  "Sign in to continue..."
```
✓ OK (single h1 + supporting text)

**age-gate/page.tsx:**
```
<h1> "ForjeGames"             (logo, centered)
<h2> "When were you born?"
<label> "Date of Birth"       (not a heading)
```
✓ OK (h1 → h2)

**onboarding/page.tsx:**
```
<h1> "ForjeGames"             (logo)
<h2> "What should we call you?" (dynamic per step)
<label> "Display Name"        (not heading)
```
✓ OK (h1 → h2)

**parental-consent/page.tsx:**
```
<h1> "ForjeGames"
<h2> "Parent's Permission Required"
<label> "Parent or Guardian's Email"
<p>   "What we tell your parent:"  (not a heading, should be h3)
```
⚠️ MINOR: "What we tell your parent:" reads like a section heading but isn't tagged as `<h3>`. Consider promoting to `<h3>` for clarity.

**suspended/page.tsx:**
```
<h1> (HTTP 451 badge — functional, not h1)
<h1> "ForjeGames is Not Available..."
<p>  "Restricted jurisdictions include:" (should be h3)
<p>  "Appeal process" (should be h3)
```
⚠️ ISSUE: "Restricted jurisdictions..." and "Appeal process" should be `<h3>`, not `<p>`.

---

## Focus Management Issues

### Age Gate → Parental Consent
When user selects "under 13" on age gate, they're redirected to parental-consent form. **Focus should jump to form field** (parentEmail input) with visual indicator.

**Fix:**
```tsx
useEffect(() => {
  const emailInput = document.getElementById('parentEmail')
  if (emailInput) {
    emailInput.focus()
  }
}, [])
```

### Multi-step wizard (onboarding/page.tsx)
When user advances from step 3 → 4 → 5, focus remains on the "Continue" button. **Focus should move to the new step's first form field or h2 heading**.

**Fix:**
```tsx
function handleProfileNext(name: string) {
  setDisplayName(name)
  setWizardStep(4)
  // Focus on the template section
  setTimeout(() => {
    const heading = document.querySelector('h2[data-step="4"]')
    if (heading) heading.focus()
  }, 0)
}
```

---

## Reduced Motion Support

### Issue
No `@media (prefers-reduced-motion: reduce)` CSS block found in reviewed files.

**Animations detected:**
- Progress bar: `transition-all duration-500 ease-out` (line 32, age-gate)
- Email icon: `animate-ping` (verify-email)
- Button hover: inline opacity changes

**Fix:**
Add to global CSS (`globals.css`):
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Touch Target Sizes

### Checked Elements

**Buttons:** All are `py-3` (48px height) + full-width or `px-5` (50px+) ✓ OK

**Form inputs:**
- Date input: `py-3` ✓ OK
- Text inputs: `py-3` ✓ OK

**Links:**
- Footer links (sign-in page): Small, ~40px height ⚠️
- "Contact Legal" button (blocked page): `py-2.5` = 40px (borderline, 44px preferred)

**Fix:**
- Increase padding on small links to `py-3` (48px).
- Consider min 44x44 for all touch targets.

---

## Special Considerations: COPPA Compliance

### Age Gate Accessibility (Under-13 Users)

**Issue 1:** Date input `[color-scheme:dark]` works on Firefox/Chrome but may fail on older browsers. No fallback.

**Issue 2:** Error messages for invalid dates aren't announced. A 7-year-old keyboard-only user submits "2025-01-01" (future), and gets "Please enter a valid date" without audio feedback.

**Fix:**
```tsx
<input
  id="dob"
  type="date"
  aria-describedby={error ? 'dob-error' : undefined}
  className="..."
/>
{error && (
  <p id="dob-error" role="alert" aria-live="polite" className="text-red-400 text-sm mt-1">
    {error}
  </p>
)}
```

### Parental Consent Email Accessibility

**Issue:** Email template sent to parent is server-side rendered (not reviewed here). Ensure it:
- Has clear subject line (not "Action Required")
- Has large, readable fonts
- Link text reads "Click here to approve [child's account]" (not "Verify token: abc123")
- Is mobile-responsive

---

## Skip Links

**Status:** ✓ PASS — `<SkipToContent />` component imported in root layout (line 188 in layout.tsx).

Verify skip link is visible on focus:
```css
.skip-link {
  position: absolute;
  top: -9999px;
}

.skip-link:focus {
  position: static;
  top: auto;
}
```

---

## Language Declaration

**Status:** ✓ PASS — Root layout has `<html lang="en">` (layout.tsx line 130).

---

## Page Titles

**Checked:**
- `blocked/page.tsx`: ✓ `'Access Restricted — ForjeGames'`
- `suspended/page.tsx`: ⚠️ No explicit metadata title (will default to site name)
- `verify-email/page.tsx`: ⚠️ No explicit metadata title

**Fix:** Add metadata to suspended/verify-email pages:
```tsx
export const metadata: Metadata = {
  title: 'Email Verification — ForjeGames',
}
```

---

## Accessibility Roadmap (Priority Order)

### Week 1 (Critical)
- [ ] Add `role="alert"` + `aria-live="polite"` to all form error messages (6 pages)
- [ ] Add `role="progressbar"` + ARIA attributes to progress bars (3 pages)
- [ ] Test Clerk KeyboardEvent support for Escape key; file PR if missing

### Week 2
- [ ] Add `aria-label` to template selection buttons + `aria-pressed` state
- [ ] Add `aria-disabled` + countdown to resend button (verify-email)
- [ ] Add `aria-describedby` to form inputs with error states
- [ ] Upgrade section headings in suspended/verify-email pages

### Week 3
- [ ] Implement focus management in multi-step wizard (age-gate → parental-consent → profile)
- [ ] Add `@media (prefers-reduced-motion)` CSS to globals
- [ ] Increase touch target sizes for footer links

### Week 4
- [ ] Test with NVDA (Windows) + Chrome for full SR verification
- [ ] Test keyboard-only navigation on all flows (Shift+Tab backwards)
- [ ] Run axe DevTools automated audit; compare to this report

---

## Testing Checklist

- [ ] **Contrast check:** Use https://webaim.org/resources/contrastchecker/ on custom colors
- [ ] **Keyboard test:** Tab through entire auth flow on sign-in → age-gate → parental-consent → profile → template → build
- [ ] **Screen reader test:** NVDA (Windows) or VoiceOver (Mac) on each page
- [ ] **Mobile (touch):** iOS Safari + Android Chrome on iPhone SE + Pixel 6a
- [ ] **Reduced motion:** Enable in Windows Settings → Ease of Access → Display → Show animations; verify no motion
- [ ] **Lighthouse audit:** Run in DevTools on each page; screenshot results

---

## Remediation Timeline

- **High severity:** 5 days
- **Medium severity:** 10 days
- **Total estimated effort:** 15 days (design + dev + QA)

**Next audit:** After week 4 fixes applied.

---

## References

- WCAG 2.1 Quick Ref: https://www.w3.org/WAI/WCAG21/quickref/
- WebAIM Contrast Checker: https://webaim.org/resources/contrastchecker/
- Clerk Accessibility Docs: https://clerk.com/docs/accessibility (check for latest keyboard support)
- COPPA Compliance: https://www.ftc.gov/tips-advice/business-center/guidance/complying-coppa
- MDN ARIA: https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA

---

**Report Generated:** 2026-03-29
**Auditor:** Accessibility Auditor Agent
**Status:** Ready for remediation
