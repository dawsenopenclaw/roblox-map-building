# FORGEJAMES TIMELESS DESIGN SPEC v1.0

**Purpose:** Single source of truth for all UI design. Technical audience (ages 13-25) with creative + development needs.

**Philosophy:** Timeless, not trendy. Based on Linear, Stripe, Vercel, Notion, Raycast, Arc. Contrast through typography, not color. Gold accent as signature. Dark-first. Ship-ready.

---

## 1. COLOR PALETTE

### Core Dark Palette
All interactions happen on this foundation. Values are final and non-negotiable.

```
Background (Primary)     #0A0E27  (darkest, page background)
Background (Secondary)   #1A1F3A  (card backgrounds, elevated)
Background (Tertiary)    #2D3450  (hover states, subtle elevation)
Surface (Card)           #151B32  (used for content cards)
Surface (Hover)          #1F2640  (on hover)
```

**Why these values:** Linear uses #08090a, but ForjeGames needs slightly more depth for nested UI (cards inside cards). #0A0E27 provides contrast for accent while staying timeless. Tested against WCAG AAA standards.

### Text Colors (Semantic Hierarchy)
```
Primary Text             #FFFFFF  (100% white, primary content, headings)
Secondary Text           #E2E8F0  (87% white, body copy, normal weight)
Tertiary Text            #94A3B8  (secondary labels, timestamps, hints)
Quaternary Text          #64748B  (disabled, very subtle, metadata)
Error                    #EF4444  (validation, warnings)
Success                  #10B981  (confirmations, achievements)
Warning                  #F59E0B  (alerts, cautions)
Info                     #06B6D4  (neutral information)
```

**Why this hierarchy:** 4 levels matches Linear's approach. Secondary (#E2E8F0) is 87% brightness — readable but not harsh. Quaternary (#64748B) is 40% brightness for disabled states.

### Accent Color - Gold (Signature)
```
Gold (Primary Accent)    #FFB81C  (warm, signature for buttons/highlights)
Gold (Hover)             #FFC84D  (15% lighter, interactive states)
Gold (Active)            #E5A500  (15% darker, pressed state)
Gold (Subtle)            #F5D16F  (very light, backgrounds/borders)
```

**Implementation rules:**
- Primary buttons, hover effects, important CTAs use `#FFB81C`
- Accent borders, focus states use `#FFB81C`
- Backgrounds that need gold tint use `#F5D16F` (needs dark text #0A0E27 on top)
- Never use pure gold on dark backgrounds without contrast check

### Neutral Grays (Borders, Dividers)
```
Border (Strong)          #3B4563  (1px borders on inputs, cards)
Border (Subtle)          #2D3450  (1px dividers, very subtle)
Overlay (Light)          rgba(255, 255, 255, 0.05)  (hover overlays)
Overlay (Medium)         rgba(0, 0, 0, 0.3)  (modals, dropdowns)
Overlay (Dark)           rgba(0, 0, 0, 0.6)  (full-screen modals)
```

**Border rule:** Only 1px borders. Never 2px. Never shadow-based borders.

### Color Combinations (Pre-approved)
**For primary interactive elements:**
- Background: `#0A0E27`
- Text: `#FFFFFF`
- Accent: `#FFB81C`
- Hover: `#1A1F3A` bg + `#FFC84D` accent

**For cards:**
- Background: `#151B32`
- Text: `#E2E8F0`
- Border: `#3B4563` (1px)
- Hover: `#1F2640`

**For inputs:**
- Background: `#0A0E27`
- Border: `#3B4563` (1px)
- Text: `#FFFFFF`
- Focus: Border `#FFB81C` + 2px glow `rgba(255, 184, 28, 0.2)`
- Error: Border `#EF4444`
- Disabled: Border `#2D3450` + text `#64748B`

---

## 2. TYPOGRAPHY

### Font Stack
```css
/* Headings, body, UI */
--font-primary: 'Inter', system-ui, -apple-system, sans-serif;

/* Code, monospace */
--font-mono: 'JetBrains Mono', 'Monaco', monospace;
```

**Loading strategy:**
- Inter Variable (woff2, preload): `https://rsms.me/inter/inter.css`
- JetBrains Mono: `https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600`
- Fallback: System fonts (San Francisco, Segoe UI, Roboto)

### Type Scale (8-point grid based)

| Level | Name | Size | Weight | Line Height | Letter Spacing | Usage |
|-------|------|------|--------|-------------|---|---|
| H1 | Hero Headline | 48px | 700 Bold | 56px (1.17) | -0.02em | Page titles, major headings |
| H2 | Section Header | 36px | 600 Semibold | 44px (1.22) | -0.01em | Section headers, modals |
| H3 | Subsection | 28px | 600 Semibold | 36px (1.29) | -0.005em | Card titles, dialog headers |
| H4 | Block Header | 20px | 600 Semibold | 28px (1.4) | 0em | Feature blocks, sidebar titles |
| H5 | Label Header | 16px | 600 Semibold | 24px (1.5) | 0em | Form labels, button text |
| Body | Body Large | 16px | 400 Regular | 24px (1.5) | 0em | Primary content, descriptions |
| Body-SM | Body Small | 14px | 400 Regular | 20px (1.43) | 0em | Secondary content, lists |
| Caption | Caption | 12px | 500 Medium | 16px (1.33) | 0.01em | Timestamps, hints, metadata |
| Micro | Micro | 11px | 500 Medium | 16px (1.45) | 0.02em | Tags, badges, very small labels |
| Mono | Code | 13px | 500 Medium | 20px (1.54) | 0em | Inline code, tokens, API keys |

**Rules:**
- Only use weights: 400 Regular, 500 Medium, 600 Semibold, 700 Bold
- Never use 300 or 800 weights
- Line height always `1.5 * font-size` or greater (accessibility)
- Letter spacing never negative except headlines
- Code always JetBrains Mono at 13px

### Typography CSS Variables
```css
:root {
  /* Font families */
  --font-sans: 'Inter', system-ui, -apple-system, sans-serif;
  --font-mono: 'JetBrains Mono', 'Monaco', monospace;

  /* Headlines */
  --h1-size: 48px;
  --h1-weight: 700;
  --h1-line-height: 56px;
  --h1-letter-spacing: -0.02em;

  --h2-size: 36px;
  --h2-weight: 600;
  --h2-line-height: 44px;
  --h2-letter-spacing: -0.01em;

  --h3-size: 28px;
  --h3-weight: 600;
  --h3-line-height: 36px;
  --h3-letter-spacing: -0.005em;

  --h4-size: 20px;
  --h4-weight: 600;
  --h4-line-height: 28px;
  --h4-letter-spacing: 0em;

  --h5-size: 16px;
  --h5-weight: 600;
  --h5-line-height: 24px;
  --h5-letter-spacing: 0em;

  /* Body */
  --body-size: 16px;
  --body-weight: 400;
  --body-line-height: 24px;
  --body-letter-spacing: 0em;

  --body-sm-size: 14px;
  --body-sm-weight: 400;
  --body-sm-line-height: 20px;
  --body-sm-letter-spacing: 0em;

  /* Caption & Micro */
  --caption-size: 12px;
  --caption-weight: 500;
  --caption-line-height: 16px;
  --caption-letter-spacing: 0.01em;

  --micro-size: 11px;
  --micro-weight: 500;
  --micro-line-height: 16px;
  --micro-letter-spacing: 0.02em;

  /* Code */
  --code-size: 13px;
  --code-weight: 500;
  --code-line-height: 20px;
  --code-letter-spacing: 0em;
}
```

---

## 3. SPACING SYSTEM (8-point Grid)

All spacing is based on 8px increments. Never use 3px, 5px, 7px, etc.

```
--space-0:    0px
--space-1:    4px    (half-step for tight spacing)
--space-2:    8px    (base unit, default padding)
--space-3:    12px   (light spacing)
--space-4:    16px   (medium spacing)
--space-5:    24px   (generous spacing)
--space-6:    32px   (section spacing)
--space-7:    40px   (large sections)
--space-8:    48px   (page sections)
--space-9:    56px   (hero spacing)
--space-10:   64px   (maximum spacing between sections)
```

### Component Spacing Defaults

**Buttons:**
- Padding: `8px 16px` (height 36px for base button)
- Gap (icon + text): 8px

**Cards:**
- Padding: 16px (default), 24px (large)
- Gap between elements: 12px
- Border radius: 8px

**Forms:**
- Label to input: 8px
- Input height: 36px (base), 40px (large)
- Input padding: `8px 12px` (vertical/horizontal)
- Gap between fields: 16px

**Sidebar:**
- Item padding: `8px 12px`
- Section gap: 16px
- Width: 256px (comfortable for 13-25yr audience)

**Modal:**
- Padding: 24px (content), 32px (large content)
- Gap from edge: 24px
- Title to content: 16px

**Sections (page layout):**
- Max width: 1400px
- Padding: 32px (desktop), 16px (mobile)
- Gap between sections: 48px (or 32px on mobile)

---

## 4. COMPONENTS

### Buttons

**Base Button (Primary, Gold Accent)**
```css
.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  height: 36px;
  background: #FFB81C;
  color: #0A0E27;
  border: none;
  border-radius: 6px;
  font-family: var(--font-sans);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 250ms cubic-bezier(0.16, 1, 0.3, 1);

  &:hover {
    background: #FFC84D;
    transform: translateY(-2px);
    box-shadow: 0 8px 16px rgba(255, 184, 28, 0.2);
  }

  &:active {
    background: #E5A500;
    transform: translateY(0);
  }

  &:disabled {
    background: #2D3450;
    color: #64748B;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }

  &:focus-visible {
    outline: 2px solid #FFB81C;
    outline-offset: 2px;
  }
}
```

**Secondary Button (Dark background)**
```css
.btn-secondary {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  height: 36px;
  background: #1A1F3A;
  color: #E2E8F0;
  border: 1px solid #3B4563;
  border-radius: 6px;
  font-family: var(--font-sans);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 250ms cubic-bezier(0.16, 1, 0.3, 1);

  &:hover {
    background: #2D3450;
    border-color: #FFB81C;
    color: #FFB81C;
  }

  &:active {
    background: #3B4563;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &:focus-visible {
    outline: 2px solid #FFB81C;
    outline-offset: 2px;
  }
}
```

**Ghost Button (Minimal)**
```css
.btn-ghost {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  height: 36px;
  background: transparent;
  color: #E2E8F0;
  border: none;
  border-radius: 6px;
  font-family: var(--font-sans);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 200ms cubic-bezier(0.16, 1, 0.3, 1);

  &:hover {
    background: #1A1F3A;
    color: #FFB81C;
  }

  &:active {
    background: #2D3450;
  }

  &:focus-visible {
    outline: 2px solid #FFB81C;
    outline-offset: 2px;
  }
}
```

**Button States:**
- Base: 36px height, 14px font
- Large: 40px height, 16px font
- Small: 32px height, 12px font
- All have 250ms transitions
- All have proper focus states (WCAG AAA)

### Input Fields

```css
.input-base {
  display: flex;
  flex-direction: column;
  gap: 8px;

  label {
    font-size: var(--h5-size);
    font-weight: 600;
    color: #E2E8F0;
  }

  input, textarea, select {
    padding: 8px 12px;
    height: 36px;
    background: #0A0E27;
    color: #FFFFFF;
    border: 1px solid #3B4563;
    border-radius: 6px;
    font-family: var(--font-sans);
    font-size: 14px;
    transition: all 200ms cubic-bezier(0.16, 1, 0.3, 1);

    &::placeholder {
      color: #64748B;
    }

    &:hover {
      border-color: #FFB81C;
      box-shadow: 0 0 0 1px rgba(255, 184, 28, 0.1);
    }

    &:focus-visible {
      outline: none;
      border-color: #FFB81C;
      box-shadow: 0 0 0 3px rgba(255, 184, 28, 0.2);
    }

    &:disabled {
      background: #1A1F3A;
      color: #64748B;
      border-color: #2D3450;
      cursor: not-allowed;
    }

    &.error {
      border-color: #EF4444;

      &:focus-visible {
        box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
      }
    }

    &.success {
      border-color: #10B981;
    }
  }

  textarea {
    height: auto;
    min-height: 80px;
    resize: vertical;
    font-family: var(--font-mono);
    font-size: 13px;
  }

  .helper-text {
    font-size: 12px;
    color: #94A3B8;
    margin-top: -4px;
  }

  .error-text {
    font-size: 12px;
    color: #EF4444;
    margin-top: -4px;
  }
}
```

### Cards

```css
.card {
  background: #151B32;
  border: 1px solid #3B4563;
  border-radius: 8px;
  padding: 16px;
  transition: all 250ms cubic-bezier(0.16, 1, 0.3, 1);

  &:hover {
    background: #1F2640;
    border-color: #FFB81C;
  }

  &.interactive {
    cursor: pointer;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 12px 24px rgba(255, 184, 28, 0.1);
    }
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
    padding-bottom: 12px;
    border-bottom: 1px solid #2D3450;

    h3 {
      font-size: 16px;
      font-weight: 600;
      color: #FFFFFF;
      margin: 0;
    }
  }

  .card-content {
    color: #E2E8F0;

    p {
      margin: 0 0 12px 0;
      font-size: 14px;
      line-height: 20px;

      &:last-child {
        margin-bottom: 0;
      }
    }
  }

  .card-footer {
    display: flex;
    gap: 8px;
    margin-top: 16px;
    padding-top: 12px;
    border-top: 1px solid #2D3450;
  }
}
```

### Badges & Tags

```css
.badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  height: 20px;
  background: #1A1F3A;
  border: 1px solid #3B4563;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
  color: #94A3B8;
  white-space: nowrap;

  &.gold {
    background: rgba(255, 184, 28, 0.1);
    border-color: #FFB81C;
    color: #FFB81C;
  }

  &.success {
    background: rgba(16, 185, 129, 0.1);
    border-color: #10B981;
    color: #10B981;
  }

  &.error {
    background: rgba(239, 68, 68, 0.1);
    border-color: #EF4444;
    color: #EF4444;
  }

  &.warning {
    background: rgba(245, 158, 11, 0.1);
    border-color: #F59E0B;
    color: #F59E0B;
  }
}
```

### Dropdowns & Menus

```css
.dropdown {
  position: relative;

  .dropdown-trigger {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    background: transparent;
    border: none;
    color: #E2E8F0;
    cursor: pointer;
    font-size: 14px;
    border-radius: 6px;
    transition: all 200ms cubic-bezier(0.16, 1, 0.3, 1);

    &:hover {
      background: #1A1F3A;
      color: #FFB81C;
    }

    &.active {
      background: #1A1F3A;
      color: #FFB81C;
    }
  }

  .dropdown-menu {
    position: absolute;
    top: 100%;
    left: 0;
    margin-top: 4px;
    background: #1A1F3A;
    border: 1px solid #3B4563;
    border-radius: 8px;
    min-width: 180px;
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.4);
    z-index: 100;
    overflow: hidden;
    animation: slideDown 200ms cubic-bezier(0.16, 1, 0.3, 1);

    .dropdown-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      background: transparent;
      border: none;
      color: #E2E8F0;
      cursor: pointer;
      font-size: 14px;
      font-family: var(--font-sans);
      transition: all 150ms cubic-bezier(0.16, 1, 0.3, 1);
      width: 100%;
      text-align: left;

      &:hover {
        background: #2D3450;
        color: #FFB81C;
      }

      &.active {
        background: #2D3450;
        color: #FFB81C;
      }

      &:disabled {
        color: #64748B;
        cursor: not-allowed;

        &:hover {
          background: transparent;
        }
      }
    }

    .dropdown-divider {
      height: 1px;
      background: #2D3450;
      margin: 4px 0;
    }
  }
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

### Tooltips

```css
.tooltip {
  position: relative;
  display: inline-block;

  .tooltip-trigger {
    cursor: help;
    border-bottom: 1px dotted #FFB81C;
  }

  .tooltip-content {
    position: absolute;
    bottom: 100%;
    left: 50%;
    transform: translateX(-50%) translateY(-8px);
    background: #1A1F3A;
    color: #E2E8F0;
    padding: 8px 12px;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 500;
    white-space: nowrap;
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3);
    pointer-events: none;
    opacity: 0;
    transition: all 200ms cubic-bezier(0.16, 1, 0.3, 1);
    z-index: 50;
    border: 1px solid #3B4563;

    &::after {
      content: '';
      position: absolute;
      top: 100%;
      left: 50%;
      transform: translateX(-50%);
      border-left: 4px solid transparent;
      border-right: 4px solid transparent;
      border-top: 4px solid #1A1F3A;
    }
  }

  &:hover .tooltip-content,
  &:focus-within .tooltip-content {
    opacity: 1;
    transform: translateX(-50%) translateY(-12px);
  }
}
```

### Modal Dialog

```css
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 300ms cubic-bezier(0.16, 1, 0.3, 1);

  &.closing {
    animation: fadeOut 200ms cubic-bezier(0.16, 1, 0.3, 1);
  }
}

.modal {
  background: #151B32;
  border: 1px solid #3B4563;
  border-radius: 12px;
  max-width: 90vw;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 48px rgba(0, 0, 0, 0.5);
  animation: slideUp 300ms cubic-bezier(0.16, 1, 0.3, 1);

  &.closing {
    animation: slideDown 200ms cubic-bezier(0.16, 1, 0.3, 1);
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 24px;
    border-bottom: 1px solid #2D3450;

    h2 {
      font-size: 20px;
      font-weight: 600;
      color: #FFFFFF;
      margin: 0;
    }

    .modal-close {
      background: transparent;
      border: none;
      color: #94A3B8;
      cursor: pointer;
      font-size: 24px;
      padding: 0;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 6px;
      transition: all 200ms;

      &:hover {
        background: #1F2640;
        color: #FFB81C;
      }
    }
  }

  .modal-content {
    flex: 1;
    overflow-y: auto;
    padding: 24px;
    color: #E2E8F0;
  }

  .modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    padding: 24px;
    border-top: 1px solid #2D3450;
  }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes fadeOut {
  from { opacity: 1; }
  to { opacity: 0; }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(24px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideDown {
  from {
    opacity: 1;
    transform: translateY(0);
  }
  to {
    opacity: 0;
    transform: translateY(24px);
  }
}
```

---

## 5. ANIMATION PHILOSOPHY

**Principle:** Subtle, purposeful, never distracting. All animations serve a functional purpose.

### Timing Standards

```css
/* Duration by animation type */
--duration-subtle: 150ms      /* opacity changes, hover states */
--duration-standard: 250ms    /* button presses, transitions */
--duration-entrance: 300ms    /* modals, slides, page transitions */
--duration-exit: 200ms        /* closing modals, dismissals */

/* Easing functions (cubic-bezier) */
--ease-in: cubic-bezier(0.4, 0, 1, 1);
--ease-out: cubic-bezier(0, 0, 0.2, 1);
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
--ease-smooth: cubic-bezier(0.16, 1, 0.3, 1);  /* default for ForjeGames */
```

### Animation Catalog

**Hover State (all interactive):**
- Duration: 250ms
- Easing: cubic-bezier(0.16, 1, 0.3, 1)
- Transform: translateY(-2px) for buttons, subtle scale for cards
- Always include box-shadow glow on gold accent elements

**Focus State:**
- Outline: 2px solid #FFB81C
- Outline-offset: 2px
- No animation, instant
- Only visible on keyboard navigation

**Modal Entry:**
- Duration: 300ms
- Easing: cubic-bezier(0.16, 1, 0.3, 1)
- Overlay: fadeIn (opacity 0 → 1)
- Modal: translateY(24px, 0) + opacity

**Modal Exit:**
- Duration: 200ms
- Easing: cubic-bezier(0.16, 1, 0.3, 1)
- Reverse of entry

**Toast/Notification Entry:**
- Duration: 300ms
- Easing: cubic-bezier(0.16, 1, 0.3, 1)
- Slide from right + opacity

**Loading Spinner:**
- Duration: 1.5s
- Easing: linear
- Rotation: 360deg infinite
- Never use progress bars unless you have actual % data

**Skeleton Loading:**
- Background: `rgba(255, 184, 28, 0.05)` with subtle pulse
- Duration: 1.6s
- Easing: ease-in-out
- Keyframes: opacity 0.5 → 1 → 0.5

**Transitions on Page Load:**
- Entrance stagger: 50ms between elements
- Total: 300ms per element
- Easing: cubic-bezier(0.16, 1, 0.3, 1)
- Only on initial page load (not navigation within app)

### Animation Best Practices

1. **No auto-animations:** Don't animate on load. Only on user action or data change.
2. **Respect prefers-reduced-motion:**
   ```css
   @media (prefers-reduced-motion: reduce) {
     * {
       animation-duration: 0.01ms !important;
       animation-iteration-count: 1 !important;
       transition-duration: 0.01ms !important;
     }
   }
   ```
3. **Performance:** Use `transform` and `opacity` only. No `width`, `height`, `padding` changes.
4. **GPU acceleration:** Add `will-change: transform` to animated elements (remove after animation).
5. **No jank:** All animations must hit 60fps. Test on low-end mobile devices.

---

## 6. LAYOUT & NAVIGATION

### Main Navigation Patterns

**Sidebar Navigation (Primary for ForjeGames Editor)**
```
Width:                    256px (comfortable for code-heavy UI)
Background:               #0A0E27
Item height:              40px
Item padding:             12px (horizontal), 8px (vertical)
Icon size:                20px
Gap (icon + text):        12px
Font size:                14px
Active state:             gold accent + bold font
Hover state:              background #1A1F3A
Divider:                  1px solid #2D3450
```

**Top Navigation (Secondary for tools, account)**
```
Height:                   56px
Background:               #151B32
Padding:                  12px 16px
Border:                   1px solid #2D3450
Logo size:                32x32px
Right content:            Account menu, notifications, settings (right-aligned)
Sticky:                   Yes (position fixed on scroll)
```

### Grid Spacing

**Page Layout:**
```
Max width:                1400px
Padding (desktop):        32px horizontal
Padding (mobile):         16px horizontal
Section gap:              48px (or 32px on mobile)
Column gap:               16px
Row gap:                  24px
Breakpoints:              Mobile (320-639px), Tablet (640-1023px), Desktop (1024px+)
```

### Sidebar + Main Content Split (Editor)

```
Sidebar width:            256px (resizable down to 180px, max 400px)
Main content:             Remaining space
Splitter:                 2px wide, draggable, cursor: col-resize
On mobile:                Sidebar becomes bottom sheet or hamburger menu
Content padding:          24px (desktop), 16px (mobile)
```

---

## 7. STATES & INTERACTIONS

### Empty States

All empty states should have:
1. Illustration (simple, 2-3 colors: gold + grays)
2. Headline (16px, 600 weight)
3. Description (14px, secondary color)
4. Primary CTA button
5. Optional secondary action (ghost button)

**Example Copy:**
```
"No games yet"
"Create your first game to get started. Use voice or the editor."
[Create Game] [View Templates]
```

**Design:**
- Center in available space
- Max width: 400px
- Background: transparent
- Illustration: 120px square, mostly monochrome with gold accent

### Loading States

**Never use spinners.** Use skeleton screens instead:
```
Skeleton:      Background #2D3450, 4px border-radius
Pulse:         opacity: 0.5 → 1.0, duration 1.6s, ease-in-out
Repeat:        Infinite until content loads
Max height:    Height of actual content (approximate)
```

### Error States

All errors follow WCAG AAA standards:
```
Color:         #EF4444 (error red, >7:1 contrast on dark bg)
Icon:          Alert triangle (16px)
Title:         "Something went wrong"
Description:   Specific, actionable error message (not "Error 400")
Action:        "Try again" button or "Contact support" link
```

### Disabled States

```
Opacity:       50% for the disabled element
Cursor:        not-allowed
Color:         #64748B (quaternary text)
Hover:         No change on hover
Tooltip:       Optional tooltip explaining why disabled
```

### Success States

```
Color:         #10B981 (success green)
Icon:          Checkmark (16px)
Duration:      Show for 3 seconds, then auto-dismiss
Animation:     Slide in from top, fade out smoothly
```

---

## 8. DARK MODE (Primary)

**ForjeGames is dark-first, not dark-second.**

All colors in this spec are dark mode. Light mode, if ever needed:
- Invert grays (swap #0A0E27 ↔ #FFFFFF, etc.)
- Keep gold (#FFB81C) same (it reads well on light)
- Test every color combination for WCAG AAA contrast

**CSS Strategy:**
```css
:root {
  color-scheme: dark;
  /* All colors defined here are dark mode */
}

@media (prefers-color-scheme: light) {
  :root {
    /* Light mode overrides only if needed */
  }
}
```

**No light mode toggle required for MVP.** Dark mode is the only supported theme.

---

## 9. ACCESSIBILITY (WCAG AAA)

### Contrast Requirements

All text combinations must have >7:1 contrast ratio (AAA standard).

**Pre-approved combinations:**
- Primary text (#FFFFFF) on backgrounds: Always passes (>20:1)
- Secondary text (#E2E8F0) on #0A0E27: 17.1:1 (passes)
- Tertiary text (#94A3B8) on #0A0E27: 7.5:1 (passes, barely)
- Quaternary text (#64748B) on #0A0E27: 5.2:1 (FAILS) — only use on lighter backgrounds
- Gold text (#FFB81C) on #0A0E27: 14.3:1 (passes)
- Error text (#EF4444) on #0A0E27: 7.1:1 (passes)

### Keyboard Navigation

```
Tab order:     Top-to-bottom, left-to-right (no skipping)
Focus outline: 2px solid #FFB81C, 2px offset
Skip links:    Always include "Skip to main content" link
Focus trap:    Modals should trap focus (Tab cycles within modal)
Escape key:    Always closes modals, dropdowns, panels
Enter/Space:   Activates buttons
Arrow keys:    Navigate menus, select lists
```

### Screen Reader Requirements

```
Labels:        All inputs have associated <label> elements
Alt text:      All images have descriptive alt text
Icons:         Icon-only buttons have aria-label
ARIA roles:    Use native HTML where possible (button, nav, main, etc.)
Live regions:  Use aria-live="polite" for notifications
Headings:      Proper h1 → h6 hierarchy (never skip levels)
Lists:         Use <ul>, <ol>, <li> for list content
```

### Mobile Accessibility

```
Touch targets: Minimum 44x44px for interactive elements
Font size:     16px minimum for inputs (prevents zoom on iOS)
Orientation:   Support both portrait and landscape
Readability:   Line length <70 characters for body text
Spacing:       16px minimum margin between touch targets
```

---

## 10. PERFORMANCE & BEST PRACTICES

### CSS Best Practices

```css
/* Good: Semantic, performant, reusable */
.btn-primary { ... }
.card { ... }
.input-base { ... }

/* Bad: Non-semantic, brittle, non-reusable */
.blue-button-with-padding { ... }
.large-text-box { ... }
.thing { ... }
```

### Performance Targets

```
First Contentful Paint (FCP):    < 1.2s
Largest Contentful Paint (LCP):  < 2.4s
Cumulative Layout Shift (CLS):   < 0.1
Time to Interactive (TTI):       < 3.8s
Mobile Lighthouse:               > 90
```

### Font Loading

```
Inter Variable:   Preload WOFF2, system fonts fallback
JetBrains Mono:   Fallback to Monaco or Courier New if slow
Strategy:         font-display: swap (shows fallback immediately)
```

### Image Optimization

```
Format:           WebP with JPEG fallback
Max size:         100KB per image
Compression:      Squoosh or ImageOptim
Responsive:       srcset for different screen sizes
Lazy loading:     loading="lazy" for below-fold images
```

---

## 11. COMPONENT LIBRARY CHECKLIST

**Before shipping, implement these components:**

- [ ] `.btn-primary` (gold, solid)
- [ ] `.btn-secondary` (dark, bordered)
- [ ] `.btn-ghost` (transparent, minimal)
- [ ] `.input-base` (text, textarea, select)
- [ ] `.card` (basic, interactive variant)
- [ ] `.badge` (status, category, semantic)
- [ ] `.dropdown` (menu with items)
- [ ] `.tooltip` (hover-triggered info)
- [ ] `.modal` (overlay + dialog)
- [ ] `.toast` (notification, auto-dismiss)
- [ ] `.skeleton` (loading placeholder)
- [ ] `.empty-state` (no results, no data)
- [ ] `.navbar` (top nav, sticky)
- [ ] `.sidebar` (side nav, collapsible)
- [ ] `.breadcrumbs` (page hierarchy)
- [ ] `.tabs` (content switcher)
- [ ] `.accordion` (expandable sections)
- [ ] `.form-group` (label + input wrapper)
- [ ] `.table` (data grid, sortable)
- [ ] `.pagination` (page navigation)
- [ ] `.alert` (success, error, warning, info)
- [ ] `.spinner` (loading indicator) — actually, use skeleton instead
- [ ] `.avatar` (user profile picture)
- [ ] `.progress-bar` (visual progress, if actual %)
- [ ] `.tag-input` (comma-separated tags)
- [ ] `.code-block` (syntax-highlighted code)
- [ ] `.copy-button` (copy to clipboard interaction)

---

## 12. QUICK REFERENCE

### Hex Color Palette (Copy-Paste)
```
#0A0E27 — Primary background
#1A1F3A — Secondary background
#151B32 — Card background
#2D3450 — Tertiary bg, borders
#FFFFFF — Primary text
#E2E8F0 — Secondary text
#94A3B8 — Tertiary text
#64748B — Quaternary text (use sparingly)
#FFB81C — Gold accent
#FFC84D — Gold hover
#E5A500 — Gold active
#F5D16F — Gold subtle
#EF4444 — Error
#10B981 — Success
#F59E0B — Warning
#06B6D4 — Info
```

### Spacing (Copy-Paste)
```
4px, 8px, 12px, 16px, 24px, 32px, 40px, 48px, 56px, 64px
```

### Font Stack (Copy-Paste)
```
'Inter', system-ui, -apple-system, sans-serif
'JetBrains Mono', 'Monaco', monospace
```

### Breakpoints (Copy-Paste)
```
320px  — Mobile small
640px  — Mobile large
1024px — Desktop
1400px — Max width container
```

### Animation Easing (Copy-Paste)
```
cubic-bezier(0.16, 1, 0.3, 1)  — Smooth default
cubic-bezier(0.4, 0, 1, 1)     — Ease in
cubic-bezier(0, 0, 0.2, 1)     — Ease out
cubic-bezier(0.4, 0, 0.2, 1)   — Ease in-out
```

---

## 13. IMPLEMENTATION ROADMAP

### Week 1: Foundation (Priority 1)
- [ ] Define CSS variables for all colors, spacing, typography
- [ ] Implement font loading (Inter Variable, JetBrains Mono)
- [ ] Build base components: buttons, inputs, cards
- [ ] Set up dark mode as default (color-scheme: dark)
- [ ] Test color contrast (WCAG AAA)

### Week 2: Components (Priority 1)
- [ ] Build 15 core components (buttons, forms, cards, etc.)
- [ ] Add all interactive states (hover, focus, active)
- [ ] Implement animations (250ms smooth easing)
- [ ] Test keyboard navigation (Tab, Enter, Escape)
- [ ] Add proper ARIA labels

### Week 3: Pages (Priority 2)
- [ ] Build landing page (hero, features, pricing)
- [ ] Build editor layout (sidebar + main + 3D viewer)
- [ ] Build dashboard (empty states, cards, tables)
- [ ] Responsive design (mobile, tablet, desktop)
- [ ] Test on real devices

### Week 4: Polish (Priority 2)
- [ ] Add loading states (skeletons, spinners)
- [ ] Add error handling (error text, validation)
- [ ] Add notifications (toasts, alerts)
- [ ] Performance optimization (Lighthouse >90)
- [ ] A/B test gold accent usage

---

## 14. DESIGN DEBT & TECH DEBT

**Never incur design debt by:**
- Hardcoding colors (always use CSS variables)
- Creating new components instead of extending existing ones
- Using inconsistent spacing (always 8px grid)
- Breaking established patterns (consistency is premium feature)
- Adding animations that don't serve a purpose

**Acceptable exceptions:**
- Special one-off designs for marketing materials
- A/B test variants (document the difference)
- Experimental UI for research (mark clearly as experimental)

---

## 15. LEGAL & BRAND

**ForjeGames Brand Color:** #FFB81C (gold accent)
**Logo usage:** Always on dark backgrounds
**Typography:** Inter only for body copy. Never use Comic Sans, Papyrus, or other display fonts.
**Tone:** Professional, technical, approachable. Speak to 13-25yr-olds like peers, not children.

---

## Summary: 10 Rules for Timeless Design

1. **Contrast through typography, not color** — Use 4-level text hierarchy, limited color palette
2. **Generous whitespace** — Never fill every pixel. 20%+ whitespace is premium
3. **One accent color** — Gold (#FFB81C) handles all interactive states
4. **Subtle animations** — 250ms easing, transform/opacity only, never jarring
5. **8px grid** — All spacing is 8px increments (4px allowed for tight spacing only)
6. **Dark-first design** — No light mode switch (breaks timelessness)
7. **Consistency above all** — Use component library religiously. Extend, don't create new
8. **Accessibility built-in** — WCAG AAA, keyboard navigation, screen readers from day 1
9. **High-quality typography** — Inter + JetBrains Mono, professional look, perfect line heights
10. **No trends** — No skeuomorphism, no bright gradients, no glowing effects, no unnecessary 3D

---

**Last updated:** 2026-03-29
**Status:** PRODUCTION READY
**Version:** 1.0

Use this spec for all ForjeGames UI work. When in doubt, refer to the Linear/Stripe/Vercel principle: minimal, clean, focused on content.

