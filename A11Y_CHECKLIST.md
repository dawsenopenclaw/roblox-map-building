# Accessibility Checklist for ForjeGames Development
**Quick Reference for Developers**

## Before You Commit

### Images
- [ ] Every `<img>` has a meaningful `alt` attribute
- [ ] Alt text is descriptive (e.g., "gold-themed UI button" not "button.png")
- [ ] Decorative images use `alt=""` and `aria-hidden="true"`

### Forms
- [ ] Every `<input>`, `<textarea>`, `<select>` has an associated `<label>`
- [ ] Use `<label htmlFor="inputId">` pattern, don't wrap inputs in labels
- [ ] Grouped inputs use `<fieldset>` + `<legend>`
- [ ] Placeholder text is NOT a substitute for labels

### Buttons & Links
- [ ] `<button>` elements for actions, `<a>` for navigation
- [ ] All buttons have visible text or `aria-label`
- [ ] All links have visible text (no "click here")
- [ ] No `onClick` handlers on `<div>` or `<span>`

### Modals & Dialogs
- [ ] Modal has `role="dialog"` and `aria-label`
- [ ] Backdrop has `role="presentation"` and `aria-hidden="true"`
- [ ] Focus is trapped inside modal (tab cycles through modal elements only)
- [ ] Escape key closes modal

### Keyboard Navigation
- [ ] All interactive elements are keyboard accessible
- [ ] Tab order flows logically (left-to-right, top-to-bottom)
- [ ] Focus indicator is visible (gold 2px outline)
- [ ] No keyboard traps

### Headings
- [ ] One `<h1>` per page
- [ ] Heading levels don't skip (h1 → h2, not h1 → h3)
- [ ] Headings describe content, not styled `<div>`

### Color & Contrast
- [ ] Text contrast is 4.5:1 (normal text) or 3:1 (large text)
- [ ] Don't rely on color alone to convey meaning
- [ ] Test with WebAIM Contrast Checker
- [ ] Check in both light and dark modes

### Motion & Animations
- [ ] Animations respect `prefers-reduced-motion`
- [ ] Critical information is not conveyed via animation only
- [ ] No auto-playing video/audio
- [ ] No flashing content (>3 flashes per second)

### Skip Links
- [ ] Skip-to-content link exists and is first focusable element
- [ ] Skip link targets `#main-content` (or similar)
- [ ] Target element exists and is focusable

### ARIA
- [ ] `aria-label` on icon-only buttons
- [ ] `aria-expanded` on collapsible sections
- [ ] `aria-live="polite"` on dynamic content
- [ ] `aria-hidden="true"` on decorative elements
- [ ] Don't over-use ARIA; prefer semantic HTML

### Testing
- [ ] [ ] Test with keyboard only (no mouse)
- [ ] [ ] Test with screen reader (NVDA on Windows, VoiceOver on Mac)
- [ ] [ ] Inspect with axe DevTools browser extension
- [ ] [ ] Check with WebAIM Contrast Checker
- [ ] [ ] Verify mobile touch targets are 44×44px minimum

---

## Common Patterns

### Form Input Group
```tsx
<fieldset>
  <legend>Position</legend>
  <div className="grid grid-cols-3 gap-2">
    {(['x', 'y', 'z'] as const).map((axis) => (
      <div key={axis}>
        <label htmlFor={`pos-${axis}`}>{axis.toUpperCase()}</label>
        <input id={`pos-${axis}`} type="number" />
      </div>
    ))}
  </div>
</fieldset>
```

### Icon Button
```tsx
<button aria-label="Close menu" onClick={handleClose}>
  <X className="w-4 h-4" />
</button>
```

### Modal Dialog
```tsx
<>
  <div className="fixed inset-0" onClick={handleClose} role="presentation" aria-hidden="true" />
  <div role="dialog" aria-label="Confirm action">
    {/* modal content */}
  </div>
</>
```

### Image with Alt
```tsx
<img
  src="/templates/medieval-castle.png"
  alt="Medieval castle template with stone towers and drawbridge"
  loading="lazy"
/>
```

---

## Red Flags 🚩

❌ `<div onClick={...}>` — Use `<button>` instead
❌ `<p>Label</p> <input ...>` — Use `<label htmlFor="id">` instead
❌ `<img alt="image">` — Write a descriptive alt text
❌ `<img>` (no alt) — Add alt text or `alt=""` + `aria-hidden="true"`
❌ `placeholder="Name"` only — Add a `<label>` too
❌ No visible focus indicator — Apply focus:outline globally
❌ Only color to indicate error — Add text "Error: ..." too
❌ h1 → h3 jump — Use h1 → h2 → h3 progression
❌ Modal with no backdrop — Add overlay with proper semantics
❌ Animations that ignore `prefers-reduced-motion` — Wrap in `matchMedia` check

---

## Resources

- **Audit Report:** `WCAG_AUDIT_REPORT.md` (see codebase root)
- **WCAG 2.1 Quick Ref:** https://www.w3.org/WAI/WCAG21/quickref/
- **axe DevTools:** https://www.deque.com/axe/devtools/
- **WebAIM:** https://webaim.org/

---

## Questions?

1. **"Should I use a `<div>` with `role="button"`?"**
   → No, use `<button>`. It has better semantics and keyboard support out of the box.

2. **"Can placeholder text replace a label?"**
   → No. Placeholder disappears when typing. Always use `<label>`.

3. **"Do decorative images need alt text?"**
   → No. Use `alt=""` and `aria-hidden="true"` to hide them from screen readers.

4. **"How do I test with a screen reader?"**
   → Windows: NVDA (free), JAWS (paid). macOS: VoiceOver (free, built-in).

5. **"Is focus visible gold outline good enough?"**
   → Yes, 2px gold outline meets WCAG 2.4.7 criteria. Check `app/globals.css`:
   ```css
   :focus-visible { outline: 2px solid var(--gold-light); outline-offset: 2px; }
   ```

---
