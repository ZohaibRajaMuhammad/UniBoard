# 02 — FLUID TYPOGRAPHY & SPACING
### The Complete Deep Dive: Zero-Query, Perfectly-Scaled Type and Space for Every Screen

---

## 1. The Problem With Fixed Sizes

Traditional responsive typography requires multiple media queries — set a font size, override it at breakpoints, repeat. This creates:
- Jarring size jumps (text suddenly changes size at 768px)
- Maintenance complexity (multiple values to update everywhere)
- Gaps between breakpoints (sub-optimal sizing between defined points)

**The solution: fluid everything with `clamp()`.**

---

## 2. The `clamp()` Function — Deep Understanding

```css
clamp(minimum, preferred, maximum)
```

- **minimum** — Never goes below this (in any viewport)
- **preferred** — A `vw`-based value that scales with viewport width
- **maximum** — Never exceeds this (caps at large viewports)

### 2.1 How to Calculate the Preferred Value

Use this formula to create a clamp that scales between two specific breakpoints:

```
preferred = (target_max - target_min) / (bp_max - bp_min) * 100vw 
            + (target_min - bp_min * slope)
```

Example: Scale from 1rem (16px) at 320px viewport to 1.5rem (24px) at 1280px viewport:

```
slope = (24 - 16) / (1280 - 320) = 8 / 960 = 0.00833...
intercept = 16 - 320 * 0.00833 = 16 - 2.667 = 13.333px

preferred = 0.8333vw + 0.8333rem
```

So: `clamp(1rem, 0.8333vw + 0.8333rem, 1.5rem)`

**Use a clamp generator:** https://clamp.font-size.app or Utopia.fyi — these do the math for you.

### 2.2 Complete Professional Type Scale

```css
/* ================================================
   PROFESSIONAL FLUID TYPE SCALE
   Scales from 320px viewport → 1280px viewport
   Based on a Minor Third (1.2) modular scale
   ================================================ */

:root {
  /* Type scale — fluid from mobile to desktop */
  --text-xs:    clamp(0.694rem,  0.664rem + 0.149vw, 0.800rem);  /* 11px → 12.8px */
  --text-sm:    clamp(0.833rem,  0.793rem + 0.196vw, 0.960rem);  /* 13.3px → 15.4px */
  --text-base:  clamp(1.000rem,  0.950rem + 0.250vw, 1.150rem);  /* 16px → 18.4px */
  --text-lg:    clamp(1.200rem,  1.136rem + 0.318vw, 1.440rem);  /* 19.2px → 23px */
  --text-xl:    clamp(1.440rem,  1.363rem + 0.386vw, 1.728rem);  /* 23px → 27.6px */
  --text-2xl:   clamp(1.728rem,  1.615rem + 0.563vw, 2.074rem);  /* 27.6px → 33.2px */
  --text-3xl:   clamp(2.074rem,  1.920rem + 0.769vw, 2.488rem);  /* 33.2px → 39.8px */
  --text-4xl:   clamp(2.488rem,  2.274rem + 1.071vw, 2.986rem);  /* 39.8px → 47.8px */
  --text-5xl:   clamp(2.986rem,  2.693rem + 1.464vw, 3.583rem);  /* 47.8px → 57.3px */
  --text-hero:  clamp(3.583rem,  3.183rem + 2.000vw, 5.000rem);  /* 57.3px → 80px */

  /* Line heights */
  --leading-tight:  1.2;
  --leading-snug:   1.375;
  --leading-normal: 1.6;
  --leading-relaxed: 1.75;
  --leading-loose:  2;

  /* Letter spacing */
  --tracking-tight:  -0.05em;
  --tracking-normal:  0em;
  --tracking-wide:    0.025em;
  --tracking-wider:   0.05em;
  --tracking-widest:  0.1em;
}

/* Applied typography styles */
h1 { 
  font-size: var(--text-hero); 
  line-height: var(--leading-tight);
  letter-spacing: var(--tracking-tight);
  font-weight: 800;
}
h2 { 
  font-size: var(--text-4xl); 
  line-height: var(--leading-tight);
  font-weight: 700;
}
h3 { 
  font-size: var(--text-2xl); 
  line-height: var(--leading-snug);
  font-weight: 700;
}
h4 { 
  font-size: var(--text-xl); 
  line-height: var(--leading-snug);
  font-weight: 600;
}
h5 { 
  font-size: var(--text-lg); 
  line-height: var(--leading-normal);
  font-weight: 600;
}
h6 { 
  font-size: var(--text-base); 
  line-height: var(--leading-normal);
  font-weight: 600;
}
p, li, td {
  font-size: var(--text-base);
  line-height: var(--leading-normal);
}
small, caption {
  font-size: var(--text-sm);
  line-height: var(--leading-normal);
}
```

---

## 3. The Fluid Spacing Scale

The same `clamp()` approach applied to spacing creates a design system where gaps, padding, and margins all scale proportionally across screen sizes.

```css
/* ================================================
   FLUID SPACING SCALE
   Every space token scales from mobile to desktop
   ================================================ */

:root {
  /* 
    Naming: --space-{size}
    Values: clamp(mobile-size, fluid-midpoint, desktop-size)
  */
  --space-3xs: clamp(0.125rem, 0.125rem + 0vw,    0.125rem); /* 2px  — fixed */
  --space-2xs: clamp(0.25rem,  0.225rem + 0.125vw, 0.375rem); /* 4px  → 6px */
  --space-xs:  clamp(0.5rem,   0.45rem  + 0.25vw,  0.75rem);  /* 8px  → 12px */
  --space-sm:  clamp(0.75rem,  0.675rem + 0.375vw, 1.125rem); /* 12px → 18px */
  --space-md:  clamp(1rem,     0.9rem   + 0.5vw,   1.5rem);   /* 16px → 24px */
  --space-lg:  clamp(1.5rem,   1.35rem  + 0.75vw,  2.25rem);  /* 24px → 36px */
  --space-xl:  clamp(2rem,     1.8rem   + 1vw,     3rem);     /* 32px → 48px */
  --space-2xl: clamp(3rem,     2.7rem   + 1.5vw,   4.5rem);   /* 48px → 72px */
  --space-3xl: clamp(4rem,     3.6rem   + 2vw,     6rem);     /* 64px → 96px */
  --space-4xl: clamp(6rem,     5.4rem   + 3vw,     9rem);     /* 96px → 144px */

  /* One-up pairs: sm→md, md→lg (for larger jumps) */
  --space-sm-md: clamp(0.75rem, 0.45rem + 1.5vw, 1.5rem);
  --space-md-lg: clamp(1rem,    0.625rem + 1.875vw, 2rem);
  --space-lg-xl: clamp(1.5rem,  0.9rem + 3vw, 3rem);
  --space-xl-2xl: clamp(2rem,   1.125rem + 4.375vw, 4.5rem);
}
```

---

## 4. Spacing Application Patterns

### 4.1 Section Spacing

```css
/* Use larger space tokens for section-level spacing */
section {
  padding-block: var(--space-3xl); /* large top/bottom padding */
}

/* Hero sections get extra breathing room */
.hero {
  padding-block: var(--space-4xl);
}

/* Tight sections (features, stats) */
.compact-section {
  padding-block: var(--space-xl);
}
```

### 4.2 Component Internal Spacing

```css
/* Card component — consistent internal rhythm */
.card {
  padding: var(--space-lg);          /* internal padding */
  border-radius: var(--space-sm);    /* proportional border radius */
}

.card__header {
  margin-block-end: var(--space-md); /* space below header */
}

.card__body {
  /* Stack elements with consistent gap */
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

/* Button component */
.button {
  padding-block:  var(--space-xs);
  padding-inline: var(--space-md);
  gap: var(--space-2xs);            /* between icon and label */
}

.button--lg {
  padding-block:  var(--space-sm);
  padding-inline: var(--space-lg);
}
```

### 4.3 The Stack and Flow Pattern (Vertical Rhythm)

```css
/* Stack — adds consistent space between children */
.stack {
  display: flex;
  flex-direction: column;
}

.stack > * + * {
  margin-block-start: var(--stack-gap, var(--space-md));
}

/* Usage */
.card .stack { --stack-gap: var(--space-sm); }
.article .stack { --stack-gap: var(--space-lg); }

/* Flow — for prose content */
.flow > * + * {
  margin-block-start: var(--flow-space, 1em);
}

/* Override for headings — more space above */
.flow > h2 { --flow-space: var(--space-xl); }
.flow > h3 { --flow-space: var(--space-lg); }
.flow > pre { --flow-space: var(--space-lg); }
```

---

## 5. Font Loading: Performance Without Flash

### 5.1 The Three Strategies

**Strategy 1: System Font Stack (fastest, generic)**
```css
:root {
  --font-sans: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, 
               Roboto, 'Helvetica Neue', Arial, sans-serif;
  --font-mono: ui-monospace, 'Cascadia Code', 'Source Code Pro', 
               Menlo, Consolas, 'DejaVu Sans Mono', monospace;
}
```

**Strategy 2: Variable Font (best balance)**
```html
<!-- Single file, weight axis 100–900, no flash -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap" rel="stylesheet">
```

```css
@font-face {
  font-family: 'Inter';
  src: url('/fonts/Inter-Variable.woff2') format('woff2-variations');
  font-weight: 100 900;
  font-display: swap; /* show text immediately with fallback font */
  font-style: normal;
}
```

**Strategy 3: Self-Hosted Optimized (best performance + privacy)**
```css
/* Subset to Latin only, preload critical weights */
@font-face {
  font-family: 'Brand Font';
  src: url('/fonts/brand-400.woff2') format('woff2');
  font-weight: 400;
  font-display: optional; /* never causes layout shift */
  unicode-range: U+0000-00FF, U+0131, U+0152-0153; /* Latin subset */
}

@font-face {
  font-family: 'Brand Font';
  src: url('/fonts/brand-700.woff2') format('woff2');
  font-weight: 700;
  font-display: optional;
}
```

```html
<!-- Preload critical font files -->
<link rel="preload" href="/fonts/brand-400.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/fonts/brand-700.woff2" as="font" type="font/woff2" crossorigin>
```

### 5.2 Eliminating Font Flash (FOUT)

The `font-display: optional` strategy combined with size-adjust:

```css
/* Adjusted fallback font matches web font metrics */
@font-face {
  font-family: 'Brand Font Fallback';
  src: local('Arial');
  size-adjust: 96%;          /* match x-height */
  ascent-override: 90%;      /* match cap height */
  descent-override: 21%;     /* match descenders */
  line-gap-override: 0%;
}

body {
  font-family: 'Brand Font', 'Brand Font Fallback', sans-serif;
}
```

---

## 6. Advanced Typography Techniques

### 6.1 Fluid Display Typography

For hero text that needs to fill the screen dramatically:

```css
/* Viewport-based title that always fits */
.display-title {
  font-size: clamp(3rem, 10vw, 8rem);
  line-height: 1;
  letter-spacing: -0.04em; /* tight at large sizes */
}

/* Text that fills full container width */
.fill-title {
  font-size: clamp(2rem, 8vw, 6rem);
  white-space: nowrap;
  /* JavaScript-based approach for perfect fit: */
  /* font-size calculated to match container width exactly */
}
```

### 6.2 Responsive Text Truncation

```css
/* Single line truncation */
.truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Multi-line truncation */
.truncate-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.truncate-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Responsive clamping — show more on wider screens */
.dynamic-clamp {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

@media (min-width: 48em) {
  .dynamic-clamp {
    -webkit-line-clamp: 4;
  }
}

@media (min-width: 64em) {
  .dynamic-clamp {
    -webkit-line-clamp: unset; /* show all */
    overflow: visible;
  }
}
```

### 6.3 Hyphenation and Text Breaking

```css
/* Prose content — enable intelligent hyphenation */
article p,
.prose {
  hyphens: auto;
  hyphenate-limit-chars: 6 3 3; /* min word, min before break, min after break */
  overflow-wrap: break-word;    /* break unbreakable long strings */
  word-break: break-word;       /* legacy support */
}

/* Headings — never hyphenate */
h1, h2, h3, h4, h5, h6 {
  hyphens: manual;              /* only break at &shy; entities */
  overflow-wrap: break-word;
}

/* Code — never wrap */
code, pre {
  white-space: pre;
  overflow-x: auto;
  word-break: normal;
  overflow-wrap: normal;
}

/* Monospaced within prose */
p code {
  white-space: pre-wrap;        /* wrap inline code in prose */
}
```

### 6.4 Balanced Headlines

```css
/* CSS text-wrap: balance (Chrome 114+, Firefox 121+) */
h1, h2, h3, h4 {
  text-wrap: balance; /* evenly distribute line lengths */
}

/* Pretty wrapping for body text */
p {
  text-wrap: pretty; /* avoid orphans (single word on last line) */
}
```

---

## 7. The Complete Design Token System

A production-ready token system combining typography and spacing:

```css
/* ================================================
   COMPLETE DESIGN TOKEN SYSTEM
   Import this as your single source of truth
   ================================================ */

:root {
  /* ---- TYPOGRAPHY ---- */
  
  /* Scale */
  --text-xs:   clamp(0.694rem, 0.664rem + 0.149vw, 0.800rem);
  --text-sm:   clamp(0.833rem, 0.793rem + 0.196vw, 0.960rem);
  --text-base: clamp(1.000rem, 0.950rem + 0.250vw, 1.150rem);
  --text-lg:   clamp(1.200rem, 1.136rem + 0.318vw, 1.440rem);
  --text-xl:   clamp(1.440rem, 1.363rem + 0.386vw, 1.728rem);
  --text-2xl:  clamp(1.728rem, 1.615rem + 0.563vw, 2.074rem);
  --text-3xl:  clamp(2.074rem, 1.920rem + 0.769vw, 2.488rem);
  --text-4xl:  clamp(2.986rem, 2.693rem + 1.464vw, 3.583rem);
  --text-hero: clamp(3.583rem, 3.183rem + 2.000vw, 5.000rem);
  
  /* Leading (line-height) */
  --leading-none:    1;
  --leading-tight:   1.2;
  --leading-snug:    1.375;
  --leading-normal:  1.6;
  --leading-relaxed: 1.75;
  --leading-loose:   2;
  
  /* Tracking (letter-spacing) */
  --tracking-tightest: -0.05em;
  --tracking-tight:    -0.025em;
  --tracking-normal:    0em;
  --tracking-wide:      0.025em;
  --tracking-wider:     0.05em;
  --tracking-widest:    0.1em;
  --tracking-ultra:     0.25em;
  
  /* Font weight */
  --weight-thin:       100;
  --weight-extralight: 200;
  --weight-light:      300;
  --weight-normal:     400;
  --weight-medium:     500;
  --weight-semibold:   600;
  --weight-bold:       700;
  --weight-extrabold:  800;
  --weight-black:      900;

  /* ---- SPACING ---- */
  --space-3xs: clamp(0.25rem,  0.225rem + 0.125vw, 0.375rem);
  --space-2xs: clamp(0.5rem,   0.45rem  + 0.25vw,  0.75rem);
  --space-xs:  clamp(0.75rem,  0.675rem + 0.375vw, 1.125rem);
  --space-sm:  clamp(1rem,     0.9rem   + 0.5vw,   1.5rem);
  --space-md:  clamp(1.5rem,   1.35rem  + 0.75vw,  2.25rem);
  --space-lg:  clamp(2rem,     1.8rem   + 1vw,     3rem);
  --space-xl:  clamp(3rem,     2.7rem   + 1.5vw,   4.5rem);
  --space-2xl: clamp(4rem,     3.6rem   + 2vw,     6rem);
  --space-3xl: clamp(6rem,     5.4rem   + 3vw,     9rem);

  /* ---- BORDER RADIUS ---- */
  --radius-xs:   4px;
  --radius-sm:   8px;
  --radius-md:   12px;
  --radius-lg:   16px;
  --radius-xl:   24px;
  --radius-2xl:  32px;
  --radius-full: 9999px;

  /* ---- SHADOWS ---- */
  --shadow-xs:  0 1px 2px rgba(0,0,0,0.05);
  --shadow-sm:  0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06);
  --shadow-md:  0 4px 6px rgba(0,0,0,0.07), 0 2px 4px rgba(0,0,0,0.06);
  --shadow-lg:  0 10px 15px rgba(0,0,0,0.1), 0 4px 6px rgba(0,0,0,0.05);
  --shadow-xl:  0 20px 25px rgba(0,0,0,0.1), 0 10px 10px rgba(0,0,0,0.04);
  --shadow-2xl: 0 25px 50px rgba(0,0,0,0.25);

  /* ---- TRANSITIONS ---- */
  --duration-fast:   150ms;
  --duration-normal: 250ms;
  --duration-slow:   400ms;
  --duration-slower: 600ms;
  
  --ease-in:      cubic-bezier(0.4, 0, 1, 1);
  --ease-out:     cubic-bezier(0, 0, 0.2, 1);
  --ease-in-out:  cubic-bezier(0.4, 0, 0.2, 1);
  --ease-spring:  cubic-bezier(0.34, 1.56, 0.64, 1); /* bouncy */
  --ease-smooth:  cubic-bezier(0.25, 0.46, 0.45, 0.94);
}
```

---

## 8. Testing Typography

### 8.1 The Readability Checklist

- [ ] Body text is ≥ 16px at all breakpoints
- [ ] Line length is 45–75 characters (ch units)
- [ ] Line height is 1.5–1.75 for body text
- [ ] Heading hierarchy is visually clear at every breakpoint
- [ ] No text disappears due to color contrast (WCAG AA: 4.5:1 minimum)
- [ ] Text is readable in bold, at 200% zoom, and with high contrast mode

### 8.2 Ideal Line Length

```css
/* Constrain prose to optimal reading width */
.prose {
  max-width: 65ch;    /* ~65 characters — optimal readability */
  margin-inline: auto;
}

.prose-narrow {
  max-width: 45ch;    /* tight, focused, short-form content */
}

.prose-wide {
  max-width: 80ch;    /* data-heavy, technical content */
}
```

---

*Next: `03_LAYOUT_SYSTEMS.md` — Master CSS Grid, Flexbox, and intrinsic layout for zero-query responsive design.*
