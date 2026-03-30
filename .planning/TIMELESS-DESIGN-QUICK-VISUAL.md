# ForjeGames Timeless Design — Quick Visual Reference

**Single page for designers, devs, and PMs.**

---

## 1. Color Palette (Copy-Paste)

### Dark Backgrounds
```
#0A0E27  Primary (page bg)
#1A1F3A  Secondary (elevated)
#151B32  Card surface
#2D3450  Tertiary (hover, borders)
```

### Text
```
#FFFFFF    Primary text (100%)
#E2E8F0    Secondary text (87%)
#94A3B8    Tertiary text (58%)
#64748B    Quaternary (disabled, 40%) — use sparingly
```

### Gold Accent (Signature)
```
#FFB81C    Primary (buttons, CTAs)
#FFC84D    Hover (15% lighter)
#E5A500    Active (15% darker)
#F5D16F    Subtle bg (light tint)
```

### Semantic Colors
```
#EF4444    Error
#10B981    Success
#F59E0B    Warning
#06B6D4    Info
```

---

## 2. Typography (Exact Values)

| Level | Size | Weight | Line Height |
|-------|------|--------|-------------|
| H1 | 48px | 700 | 56px |
| H2 | 36px | 600 | 44px |
| H3 | 28px | 600 | 36px |
| H4 | 20px | 600 | 28px |
| H5 | 16px | 600 | 24px |
| Body | 16px | 400 | 24px |
| Body-SM | 14px | 400 | 20px |
| Caption | 12px | 500 | 16px |
| Micro | 11px | 500 | 16px |
| Code | 13px | 500 | 20px |

**Fonts:**
- `'Inter', system-ui, -apple-system, sans-serif`
- `'JetBrains Mono', 'Monaco', monospace`

---

## 3. Spacing Grid (8px Base)

```
4px, 8px, 12px, 16px, 24px, 32px, 40px, 48px, 56px, 64px
```

**Component defaults:**
- Button: 8px 16px padding (36px height)
- Card: 16px padding (24px large)
- Form field gap: 16px
- Section gap: 48px (32px mobile)

---

## 4. Buttons (3 Variants)

### Primary (Gold)
```
Background:  #FFB81C
Text:        #0A0E27
Padding:     8px 16px (36px height)
Border:      None
Hover:       bg #FFC84D + glow
Active:      bg #E5A500
```

### Secondary (Dark)
```
Background:  #1A1F3A
Text:        #E2E8F0
Padding:     8px 16px (36px height)
Border:      1px #3B4563
Hover:       bg #2D3450, border #FFB81C
```

### Ghost (Minimal)
```
Background:  Transparent
Text:        #E2E8F0
Padding:     8px 12px
Border:      None
Hover:       bg #1A1F3A, text #FFB81C
```

---

## 5. Cards

```
Background:  #151B32
Border:      1px #3B4563
Padding:     16px
Radius:      8px
Hover:       bg #1F2640 + border #FFB81C
Shadow:      None (use border for depth)
```

---

## 6. Inputs

```
Background:  #0A0E27
Text:        #FFFFFF
Border:      1px #3B4563
Padding:     8px 12px
Height:      36px (base), 40px (large)
Focus:       Border #FFB81C + glow rgba(255, 184, 28, 0.2)
Error:       Border #EF4444
Disabled:    Border #2D3450, text #64748B
Placeholder: #64748B
```

---

## 7. Animations

### Durations
```
Hover/focus:     150-200ms
Standard:        250ms (most common)
Entry (modal):   300ms
Exit (modal):    200ms
```

### Easing (Default)
```
cubic-bezier(0.16, 1, 0.3, 1)  ← Use this everywhere
```

### Allowed Transforms
```
✓ transform: translateY()
✓ transform: scale()
✓ opacity
✓ border-color
✓ box-shadow (glow only)

✗ width, height, padding, margin (causes reflow)
✗ spinning spinners (use skeletons instead)
```

---

## 8. Responsive Breakpoints

```
320px   Mobile small
640px   Mobile large
1024px  Desktop
1400px  Max width container
```

**Mobile-first approach:**
- Base: 320px mobile
- Add features at 640px
- Enhance at 1024px

---

## 9. Focus States (WCAG AAA)

All interactive elements:
```
Outline:         2px solid #FFB81C
Outline-offset:  2px
No rounded corners on outline
```

---

## 10. Accessibility Checklist

- [ ] All text >7:1 contrast (WCAG AAA)
- [ ] Focus outlines visible on all platforms
- [ ] Keyboard Tab order natural (top-to-bottom, left-to-right)
- [ ] Labels on all inputs
- [ ] Alt text on images
- [ ] Escape closes modals
- [ ] Enter/Space activates buttons
- [ ] Motion: include `prefers-reduced-motion` media query

---

## 11. Component Checklist

**Core (Ship Week 1):**
- [ ] Buttons (primary, secondary, ghost)
- [ ] Inputs (text, textarea, select)
- [ ] Cards
- [ ] Badge
- [ ] Dropdown menu

**Essential (Ship Week 2):**
- [ ] Modal dialog
- [ ] Toast notification
- [ ] Skeleton (loading state)
- [ ] Tooltip
- [ ] Form group

**Nice-to-have (Week 3):**
- [ ] Tabs
- [ ] Accordion
- [ ] Table
- [ ] Breadcrumbs
- [ ] Pagination

---

## 12. What Makes It "Timeless"

1. **Typography carries design** — 80% is font choice, sizing, spacing
2. **One accent color** — Gold (#FFB81C) for everything
3. **Subtle animations** — 250ms smooth, never flashy
4. **Dark-first** — No light mode toggle (breaks cohesion)
5. **Consistent spacing** — 8px grid, always
6. **Generous whitespace** — 20%+ of viewport
7. **High contrast** — Text always readable
8. **No trends** — No neon, bright gradients, or glow
9. **Accessibility from day 1** — WCAG AAA built-in
10. **Works in 5 years** — Not just 5 months

---

## 13. Performance Targets

```
FCP:  < 1.2s  (First Contentful Paint)
LCP:  < 2.4s  (Largest Contentful Paint)
CLS:  < 0.1   (Cumulative Layout Shift)
TTI:  < 3.8s  (Time to Interactive)
Lighthouse: > 90 (mobile)
```

---

## 14. CSS Variables Template

```css
:root {
  /* Colors */
  --bg-primary: #0A0E27;
  --bg-secondary: #1A1F3A;
  --bg-card: #151B32;
  --bg-tertiary: #2D3450;

  --text-primary: #FFFFFF;
  --text-secondary: #E2E8F0;
  --text-tertiary: #94A3B8;
  --text-quaternary: #64748B;

  --accent-primary: #FFB81C;
  --accent-hover: #FFC84D;
  --accent-active: #E5A500;

  --error: #EF4444;
  --success: #10B981;
  --warning: #F59E0B;
  --info: #06B6D4;

  /* Typography */
  --font-sans: 'Inter', system-ui, -apple-system, sans-serif;
  --font-mono: 'JetBrains Mono', 'Monaco', monospace;

  /* Spacing */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 24px;
  --space-6: 32px;
  --space-8: 48px;

  /* Animation */
  --duration-subtle: 150ms;
  --duration-standard: 250ms;
  --duration-entrance: 300ms;
  --duration-exit: 200ms;
  --ease-smooth: cubic-bezier(0.16, 1, 0.3, 1);
}
```

---

## 15. Golden Rules

1. **Never hardcode colors** — always use CSS variables
2. **8px grid sacred** — only exception: 4px for tight spacing
3. **Weights: 400, 500, 600, 700 only** — nothing else
4. **1px borders always** — never 2px, never shadows
5. **250ms animation default** — only vary for special cases
6. **Dark mode is primary** — light mode TBD
7. **Contrast > everything** — test all text combos
8. **Consistency > creativity** — extend components, don't create
9. **Accessibility from start** — WCAG AAA, not later
10. **Timeless > trendy** — if unsure, make it simpler

---

**Version:** 1.0
**Status:** Production Ready
**Last Updated:** 2026-03-29

**Print this page.** Reference it daily. Build with it.
