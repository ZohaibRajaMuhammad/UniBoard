# 03 — LAYOUT SYSTEMS
### The Complete Deep Dive: CSS Grid, Flexbox & Intrinsic Layouts for Zero-Query Responsive Design

---

## 1. The Modern Layout Philosophy

The goal of modern responsive layout is **intrinsic design** — layouts that naturally adapt to their content and container without relying on explicit breakpoints. When done correctly, you write layout once and it works everywhere.

The three tools that make this possible:
1. **CSS Grid** — two-dimensional layout, macro structure
2. **Flexbox** — one-dimensional layout, component internals
3. **Logical Properties** — writing-mode-aware layout

---

## 2. CSS Grid — Complete Reference

### 2.1 The `auto-fit` vs `auto-fill` Pattern

```css
/* auto-fit: columns collapse when empty — fills available space */
.auto-fit-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 280px), 1fr));
  gap: var(--space-md);
}

/* auto-fill: empty columns remain — doesn't stretch items */
.auto-fill-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--space-md);
}
```

**When to use which:**
- `auto-fit` → When you want items to fill the full row (stretching)
- `auto-fill` → When you want items to maintain their size and not stretch

### 2.2 The `min()` Trick for True Responsiveness

Without `min()`, items won't shrink below `minmax`'s minimum — causing overflow on narrow screens:

```css
/* ❌ Breaks on narrow screens — items won't go below 280px */
grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));

/* ✅ Items shrink to 100% when container is narrower than 280px */
grid-template-columns: repeat(auto-fit, minmax(min(100%, 280px), 1fr));
```

### 2.3 Named Grid Lines and Areas

```css
/* Page-level layout with named areas */
.page-layout {
  display: grid;
  grid-template-areas:
    "header  header"
    "sidebar main"
    "footer  footer";
  grid-template-columns: 280px 1fr;
  grid-template-rows: auto 1fr auto;
  min-height: 100dvh;
}

/* On mobile: stack everything */
@media (max-width: 48em) {
  .page-layout {
    grid-template-areas:
      "header"
      "main"
      "sidebar"
      "footer";
    grid-template-columns: 1fr;
    grid-template-rows: auto 1fr auto auto;
  }
}

.page-header  { grid-area: header; }
.page-sidebar { grid-area: sidebar; }
.page-main    { grid-area: main; }
.page-footer  { grid-area: footer; }
```

### 2.4 The Pancake Stack (Header + Flexible Content + Footer)

```css
/* Classic sticky footer layout — works at any height */
.site-wrapper {
  display: grid;
  grid-template-rows: auto 1fr auto;
  min-height: 100dvh;
}

/* Header: auto height */
/* Main: takes all remaining space (1fr) */
/* Footer: auto height */
```

### 2.5 The Holy Grail Layout

```css
.holy-grail {
  display: grid;
  grid-template:
    "header header  header"  auto
    "nav    main    aside"   1fr
    "footer footer  footer"  auto
    / 200px  1fr    200px;
  min-height: 100dvh;
  gap: var(--space-md);
}

/* Collapse to single column on mobile */
@media (max-width: 64em) {
  .holy-grail {
    grid-template:
      "header" auto
      "nav"    auto
      "main"   1fr
      "aside"  auto
      "footer" auto
      / 1fr;
  }
}
```

### 2.6 Subgrid — The Game Changer

Subgrid lets nested elements align to the parent grid:

```css
/* Parent grid */
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 300px), 1fr));
  gap: var(--space-md);
}

/* Cards that inherit parent columns */
.card {
  display: grid;
  grid-row: span 3; /* occupy 3 rows */
  grid-template-rows: subgrid; /* inherit parent row tracks */
}

/* Now all card sections align across the row */
.card__header { /* row 1 — always same height across all cards */ }
.card__body   { /* row 2 — stretches to fill */ }
.card__footer { /* row 3 — always at bottom */ }
```

### 2.7 Dense Auto-Placement

```css
/* Fill visual gaps in masonry-style layouts */
.masonry-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 240px), 1fr));
  grid-auto-flow: dense; /* fill holes left by spanning items */
  gap: var(--space-sm);
}

/* Featured items span multiple columns */
.masonry-grid .featured {
  grid-column: span 2;
}

/* Tall items span multiple rows */
.masonry-grid .tall {
  grid-row: span 2;
}
```

### 2.8 CSS Grid Alignment Cheat Sheet

```css
/* Container-level alignment */
.grid {
  /* Horizontal alignment of the entire grid within container */
  justify-content: start | end | center | stretch | space-between | space-around | space-evenly;
  
  /* Vertical alignment of the entire grid within container */
  align-content: start | end | center | stretch | space-between | space-around | space-evenly;

  /* Horizontal alignment of items within their cells */
  justify-items: start | end | center | stretch;
  
  /* Vertical alignment of items within their cells */
  align-items: start | end | center | stretch | baseline;

  /* Shorthand: align-content / justify-content */
  place-content: center space-between;
  
  /* Shorthand: align-items / justify-items */
  place-items: center stretch;
}

/* Individual item overrides */
.grid-item {
  justify-self: start | end | center | stretch;
  align-self: start | end | center | stretch | baseline;
  place-self: center; /* both axes */
}
```

---

## 3. Flexbox — Complete Reference

### 3.1 The Flex Mental Model

Flexbox operates on a single axis (the **main axis**). Everything else is perpendicular (the **cross axis**). `flex-direction` controls which axis is which.

```css
.flex-container {
  display: flex;
  
  /* Main axis direction */
  flex-direction: row | row-reverse | column | column-reverse;
  
  /* Does content wrap to next line? */
  flex-wrap: nowrap | wrap | wrap-reverse;

  /* Main axis alignment */
  justify-content: flex-start | flex-end | center | space-between | space-around | space-evenly;

  /* Cross axis alignment */
  align-items: stretch | flex-start | flex-end | center | baseline;

  /* Cross axis alignment when wrapping */
  align-content: flex-start | flex-end | center | space-between | stretch;

  /* Gap between items */
  gap: 1rem;              /* both axes */
  row-gap: 1rem;          /* between rows */
  column-gap: 1rem;       /* between columns */
}
```

### 3.2 The `flex` Shorthand Decoded

```css
/* flex: grow shrink basis */

flex: 1;          /* flex: 1 1 0%   — grow, shrink, start from 0 */
flex: auto;       /* flex: 1 1 auto — grow, shrink, start from content size */
flex: none;       /* flex: 0 0 auto — rigid, doesn't grow or shrink */
flex: initial;    /* flex: 0 1 auto — shrinks but doesn't grow */

/* Named patterns */
.grow-equally   { flex: 1; }       /* all items same size */
.grow-from-size { flex: auto; }    /* items grow proportionally from their natural size */
.fixed-size     { flex: none; }    /* item stays its natural size */
.shrinkable     { flex: initial; } /* shrinks but won't grow */

/* Proportional growth */
.sidebar { flex: 1; }              /* 1/4 of available space */
.main    { flex: 3; }              /* 3/4 of available space */
```

### 3.3 The Intrinsic Sidebar Layout

No media queries — the sidebar wraps naturally when the container is narrow:

```css
.sidebar-layout {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-md);
}

/* Sidebar */
.sidebar-layout > .sidebar {
  flex-grow: 1;
  flex-basis: 260px; /* preferred width — sidebar exists above this */
  min-width: 0;      /* allow shrinking below content size */
}

/* Main content */
.sidebar-layout > .main {
  flex-grow: 999;    /* takes massively more space than sidebar */
  flex-basis: 0;     /* starts from zero and grows */
  min-inline-size: 50%; /* wraps when would be less than 50% */
  min-width: 0;
}
```

**How it works:**
- Wide container: sidebar takes 260px, main takes the rest
- Narrow container (< 520px): main's 50% min-inline-size forces wrap — both become 100% wide

### 3.4 Flex Alignment Patterns

```css
/* Center anything — the classic */
.center {
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Space elements to opposite ends */
.space-between {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* Push last item to end */
.push-end {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}
.push-end > :last-child {
  margin-inline-start: auto; /* pushes last child to far end */
}

/* Cluster — wrap items like words */
.cluster {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-sm);
  align-items: center;
}
```

---

## 4. Practical Layout Patterns

### 4.1 The Switcher — Horizontal Until It Doesn't Fit

```css
/* Switches from horizontal to vertical at a threshold */
.switcher {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-md);
}

.switcher > * {
  flex-grow: 1;
  /* When items would be narrower than threshold, they wrap */
  flex-basis: calc((var(--threshold, 30rem) - 100%) * 999);
}

/* Usage */
.two-col-switcher {
  --threshold: 40rem; /* wraps below 40rem (640px) */
}
```

### 4.2 The Reel — Horizontal Scrolling

Perfect for carousels, tag lists, media thumbnails:

```css
.reel {
  display: flex;
  gap: var(--space-sm);
  overflow-x: auto;
  overflow-y: hidden;
  
  /* Smooth scrolling */
  scroll-behavior: smooth;
  scroll-snap-type: x mandatory;
  
  /* Hide scrollbar visually but keep it functional */
  scrollbar-width: none;
  -ms-overflow-style: none;
  
  /* Prevent content from shrinking */
  & > * {
    flex-shrink: 0;
    scroll-snap-align: start;
  }
}

.reel::-webkit-scrollbar {
  display: none;
}

/* Fixed-width reel items */
.reel > * {
  width: clamp(280px, 80vw, 400px); /* max 80vw on mobile */
}
```

### 4.3 The Cover — Full-Screen Section

```css
.cover {
  display: flex;
  flex-direction: column;
  min-height: 100dvh;
  padding: var(--space-xl);
  
  /* Safe areas for notched devices */
  padding-top: max(var(--space-xl), env(safe-area-inset-top));
  padding-bottom: max(var(--space-xl), env(safe-area-inset-bottom));
}

/* Center principal element */
.cover > .cover__principal {
  margin-block: auto; /* pushes this element to vertical center */
}
```

### 4.4 The Frame — Maintain Aspect Ratio

```css
.frame {
  aspect-ratio: 16 / 9;
  overflow: hidden;
  position: relative;
}

.frame > * {
  width: 100%;
  height: 100%;
  object-fit: cover;  /* for images/video */
  position: absolute;
  inset: 0;
}

/* Common frame ratios */
.frame--square     { aspect-ratio: 1; }
.frame--portrait   { aspect-ratio: 3 / 4; }
.frame--landscape  { aspect-ratio: 4 / 3; }
.frame--wide       { aspect-ratio: 16 / 9; }
.frame--ultrawide  { aspect-ratio: 21 / 9; }
.frame--cinema     { aspect-ratio: 2.39 / 1; }
```

### 4.5 The Imposter — Centered Overlay

```css
/* Center element on top of another (tooltips, badges, loading states) */
.imposter-wrapper {
  position: relative;
}

.imposter {
  position: absolute;
  
  /* Center horizontally and vertically */
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  
  /* Or with inset + margin auto */
  inset: 0;
  margin: auto;
  width: fit-content;
  height: fit-content;
}
```

---

## 5. Logical Properties — Writing-Mode Aware Layout

Logical properties replace physical directions (top/right/bottom/left) with writing-mode-aware equivalents. This is essential for internationalization and is simply the more correct modern approach.

```css
/* Physical → Logical equivalents */

/* Margins */
margin-top     → margin-block-start
margin-bottom  → margin-block-end
margin-left    → margin-inline-start
margin-right   → margin-inline-end
margin-top + margin-bottom → margin-block
margin-left + margin-right → margin-inline

/* Padding */
padding-top    → padding-block-start
padding-bottom → padding-block-end
padding-left   → padding-inline-start
padding-right  → padding-inline-end

/* Border */
border-top    → border-block-start
border-bottom → border-block-end

/* Sizing */
width  → inline-size
height → block-size
max-width  → max-inline-size
min-height → min-block-size

/* Position */
top    → inset-block-start
bottom → inset-block-end
left   → inset-inline-start
right  → inset-inline-end

/* Shorthand */
inset: 0; /* replaces top: 0; right: 0; bottom: 0; left: 0 */
```

**Real-world example:**

```css
/* ❌ Physical properties — breaks for RTL languages */
.card {
  padding-left: 1.5rem;
  padding-right: 1.5rem;
  border-left: 4px solid var(--accent);
  margin-bottom: 1rem;
}

/* ✅ Logical properties — works for all writing modes */
.card {
  padding-inline: 1.5rem;
  border-inline-start: 4px solid var(--accent);
  margin-block-end: 1rem;
}
```

---

## 6. The Complete Layout Utility System

A composable, utility-based layout system with no dependencies:

```css
/* ================================================
   LAYOUT UTILITY CLASSES
   ================================================ */

/* Container */
.container {
  max-inline-size: var(--container-width, 80rem);
  margin-inline: auto;
  padding-inline: var(--space-md);
}
.container--narrow { --container-width: 60rem; }
.container--wide   { --container-width: 96rem; }
.container--full   { --container-width: 100%; }

/* ---- GRID LAYOUTS ---- */

/* Auto grid — cards, galleries, features */
.grid-auto {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, var(--grid-min, 280px)), 1fr));
  gap: var(--grid-gap, var(--space-md));
}

/* Fixed column grids */
.grid-2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: var(--space-md); }
.grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--space-md); }
.grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: var(--space-md); }

/* Make fixed grids responsive */
@media (max-width: 48em) {
  .grid-3, .grid-4 { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 30em) {
  .grid-2, .grid-3, .grid-4 { grid-template-columns: 1fr; }
}

/* ---- FLEX LAYOUTS ---- */

.flex       { display: flex; }
.flex-col   { display: flex; flex-direction: column; }
.flex-wrap  { flex-wrap: wrap; }
.flex-1     { flex: 1; }
.flex-none  { flex: none; }
.flex-auto  { flex: auto; }

/* Alignment shortcuts */
.items-start    { align-items: flex-start; }
.items-end      { align-items: flex-end; }
.items-center   { align-items: center; }
.items-stretch  { align-items: stretch; }
.items-baseline { align-items: baseline; }

.justify-start   { justify-content: flex-start; }
.justify-end     { justify-content: flex-end; }
.justify-center  { justify-content: center; }
.justify-between { justify-content: space-between; }
.justify-around  { justify-content: space-around; }
.justify-evenly  { justify-content: space-evenly; }

/* ---- GAP UTILITIES ---- */
.gap-3xs { gap: var(--space-3xs); }
.gap-2xs { gap: var(--space-2xs); }
.gap-xs  { gap: var(--space-xs); }
.gap-sm  { gap: var(--space-sm); }
.gap-md  { gap: var(--space-md); }
.gap-lg  { gap: var(--space-lg); }
.gap-xl  { gap: var(--space-xl); }

/* ---- DISPLAY UTILITIES ---- */
.block        { display: block; }
.inline-block { display: inline-block; }
.inline       { display: inline; }
.hidden       { display: none; }
.contents     { display: contents; }

/* Responsive show/hide */
@media (max-width: 47.9375em) {
  .hide-mobile  { display: none !important; }
}
@media (min-width: 48em) {
  .hide-tablet  { display: none !important; }
}
@media (min-width: 64em) {
  .hide-desktop { display: none !important; }
}
@media (max-width: 63.9375em) {
  .show-desktop-only { display: none !important; }
}

/* ---- POSITION UTILITIES ---- */
.relative { position: relative; }
.absolute { position: absolute; }
.fixed    { position: fixed; }
.sticky   { position: sticky; }
.inset-0  { inset: 0; }

/* ---- SIZE UTILITIES ---- */
.w-full    { width: 100%; }
.h-full    { height: 100%; }
.min-h-screen   { min-height: 100dvh; }
.max-w-full     { max-width: 100%; }
.w-fit          { width: fit-content; }
.h-fit          { height: fit-content; }

/* ---- OVERFLOW ---- */
.overflow-hidden { overflow: hidden; }
.overflow-auto   { overflow: auto; }
.overflow-scroll { overflow: scroll; }
.overflow-x-auto { overflow-x: auto; overflow-y: hidden; }
.truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
```

---

## 7. Aspect Ratio Layouts

```css
/* ================================================
   RESPONSIVE ASPECT RATIO SYSTEM
   ================================================ */

/* Two-column with fixed image aspect ratio */
.media-object {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-lg);
  align-items: center;
}

.media-object__image {
  aspect-ratio: 4 / 3;
  overflow: hidden;
  border-radius: var(--radius-lg);
}

.media-object__image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* Flip image order on alternating items */
.media-object:nth-child(even) .media-object__image {
  order: 2;
}

/* Stack on mobile */
@media (max-width: 48em) {
  .media-object {
    grid-template-columns: 1fr;
  }
  
  .media-object:nth-child(even) .media-object__image {
    order: 0; /* reset order */
  }
}
```

---

*Next: `04_TOUCH_AND_INTERACTION.md` — Touch targets, gestures, mobile UX patterns.*
