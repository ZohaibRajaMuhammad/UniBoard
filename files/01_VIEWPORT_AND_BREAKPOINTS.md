# 01 — VIEWPORT & BREAKPOINTS
### The Complete Deep Dive: Pixel-Perfect Rendering Across Every Device

---

## 1. The Viewport: What It Actually Is

The **viewport** is the visible area of the browser window. Without the viewport meta tag, mobile browsers render the page at a virtual desktop width (typically 980px) then scale it down — producing tiny, unusable text.

### 1.1 The Non-Negotiable Meta Tag

```html
<meta name="viewport" content="width=device-width, initial-scale=1">
```

**Each attribute explained:**

| Attribute | Value | What It Does |
|-----------|-------|--------------|
| `width` | `device-width` | Sets viewport to device's screen width in CSS pixels |
| `initial-scale` | `1` | 1:1 ratio between CSS pixels and device pixels |

### 1.2 What NOT to Add (And Why)

```html
<!-- ❌ WRONG — breaks accessibility -->
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
```

`user-scalable=no` and `maximum-scale=1` **violate WCAG 1.4.4** (Resize Text). They prevent visually impaired users from zooming. iOS 10+ partially ignores these, but Android browsers still obey them.

**Never restrict zoom.** Design your interface to work zoomed — it will also be a better interface.

---

## 2. CSS Pixels vs. Device Pixels vs. Physical Pixels

Understanding this prevents blurry images and confused layout calculations.

```
Physical pixels: The actual LED dots on the screen hardware
Device pixels:   CSS abstraction. iPhone 14 = 390 CSS px wide
DPR:             Device Pixel Ratio — how many physical pixels per CSS pixel
```

| Device | CSS Width | Physical Width | DPR |
|--------|-----------|---------------|-----|
| iPhone SE | 375px | 750px | 2x |
| iPhone 14 | 390px | 1170px | 3x |
| iPhone 14 Pro Max | 430px | 1290px | 3x |
| Samsung Galaxy S24 | 360px | 1080px | 3x |
| Samsung Galaxy S24 Ultra | 412px | 1440px | 3.5x |
| iPad Air | 820px | 1640px | 2x |
| iPad Pro 12.9" | 1024px | 2048px | 2x |

**Practical implication:** A 100px CSS element on a 3x DPR device is 300 physical pixels. Your raster images need to be 3× their displayed size to appear crisp. See `05_IMAGES_AND_MEDIA.md` for the full solution.

---

## 3. The Complete Breakpoint System

### 3.1 Why `em` Over `px` for Breakpoints

When a user increases browser font size (e.g., from 16px to 20px), `em`-based breakpoints fire at correspondingly larger viewport widths. `px` breakpoints stay fixed, making content cramped at large font sizes.

```css
/* 
  Reference conversions (assume 16px base):
  320px  = 20em
  480px  = 30em
  640px  = 40em
  768px  = 48em
  1024px = 64em
  1280px = 80em
  1536px = 96em
*/
```

### 3.2 The 5-Tier Professional Breakpoint System

```css
/* ================================================
   BREAKPOINT TOKENS
   Named after use cases, not devices
   ================================================ */

:root {
  --bp-xs:  20em;   /* 320px — minimum supported phone */
  --bp-sm:  30em;   /* 480px — large phones, landscape small phones */
  --bp-md:  48em;   /* 768px — tablets portrait */
  --bp-lg:  64em;   /* 1024px — tablets landscape, small laptops */
  --bp-xl:  80em;   /* 1280px — desktop */
  --bp-2xl: 96em;   /* 1536px — large desktop / ultrawide */
}

/* Usage pattern */
.element {
  /* Mobile first — no query */
  font-size: 1rem;
  padding: 1rem;
  flex-direction: column;
}

@media (min-width: 30em) {  /* 480px */
  .element {
    font-size: 1.0625rem;
  }
}

@media (min-width: 48em) {  /* 768px */
  .element {
    font-size: 1.125rem;
    padding: 1.5rem;
    flex-direction: row;
  }
}

@media (min-width: 64em) {  /* 1024px */
  .element {
    font-size: 1.25rem;
    padding: 2rem;
  }
}
```

### 3.3 Sass/SCSS Mixin System (If Using a Preprocessor)

```scss
// Breakpoint map
$breakpoints: (
  'xs':  320px,
  'sm':  480px,
  'md':  768px,
  'lg':  1024px,
  'xl':  1280px,
  '2xl': 1536px
);

// Mobile-first (min-width) mixin
@mixin respond-up($bp) {
  $value: map-get($breakpoints, $bp);
  @media (min-width: #{$value / 16}em) {
    @content;
  }
}

// Desktop-first (max-width) — use sparingly
@mixin respond-down($bp) {
  $value: map-get($breakpoints, $bp) - 1;
  @media (max-width: #{$value / 16}em) {
    @content;
  }
}

// Range mixin
@mixin respond-between($min, $max) {
  $min-val: map-get($breakpoints, $min);
  $max-val: map-get($breakpoints, $max) - 1;
  @media (min-width: #{$min-val / 16}em) and (max-width: #{$max-val / 16}em) {
    @content;
  }
}

// Usage
.hero-title {
  font-size: 2rem;

  @include respond-up('md') { font-size: 3rem; }
  @include respond-up('xl') { font-size: 4.5rem; }
}
```

---

## 4. Orientation Media Queries

```css
/* Portrait mode (taller than wide) */
@media (orientation: portrait) {
  .hero {
    min-height: 100svh;
  }
}

/* Landscape mode (wider than tall) */
@media (orientation: landscape) {
  .hero {
    min-height: 100svw; /* use width since height is small */
  }
  
  /* Adjust navigation for landscape phones */
  .bottom-nav {
    display: none; /* hide bottom nav — use side nav instead */
  }
  
  .side-nav {
    display: flex;
  }
}

/* Landscape specifically on phones (not tablets) */
@media (orientation: landscape) and (max-height: 500px) {
  .mobile-landscape-adjusted {
    /* Handle iPhone landscape — header is tall relative to screen */
    --header-height: 48px; /* reduce header */
  }
}
```

---

## 5. The Viewport Height Problem (and the DVH Solution)

`100vh` on mobile includes the browser's URL bar. When the URL bar hides on scroll, `100vh` elements suddenly look too tall. This causes jarring layout jumps.

```css
/* ❌ Old way — causes height jumps on mobile */
.hero {
  height: 100vh;
}

/* ✅ Modern solution — use dynamic viewport units */
.hero {
  /* svh = small viewport height (URL bar visible) */
  /* lvh = large viewport height (URL bar hidden) */
  /* dvh = dynamic — updates as URL bar shows/hides */
  height: 100dvh;
}

/* Fallback for older browsers */
.hero {
  height: 100vh;           /* fallback */
  height: 100dvh;          /* override for supporting browsers */
}

/* The full set of modern viewport units */
.full-width  { width: 100dvw; }  /* dynamic viewport width */
.full-height { height: 100dvh; } /* dynamic viewport height */
.full-inline { width: 100dvi; }  /* inline axis (usually width) */
.full-block  { height: 100dvb; } /* block axis (usually height) */
```

**Browser support:** All major browsers as of 2023. Use `@supports` for graceful degradation:

```css
.hero {
  min-height: 100vh; /* universal fallback */
}

@supports (height: 100dvh) {
  .hero {
    min-height: 100dvh;
  }
}
```

---

## 6. CSS Container Queries — Complete Implementation Guide

Container queries let components respond to their container's size rather than the viewport. This enables truly reusable, context-aware components.

### 6.1 Basic Container Query Setup

```css
/* Step 1: Define a containment context */
.card-container {
  container-type: inline-size; /* respond to width only */
  container-name: card;        /* optional name for specificity */
}

/* Step 2: Query the container */
.card {
  /* Mobile layout (narrow container) */
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

@container card (min-width: 400px) {
  .card {
    flex-direction: row;
    gap: 2rem;
  }
}

@container card (min-width: 600px) {
  .card {
    padding: 2rem;
  }
  
  .card__title {
    font-size: 1.5rem;
  }
}
```

### 6.2 Container Query Units

```css
/* cqw = 1% of container's inline size (width) */
/* cqh = 1% of container's block size (height) */
/* cqi = 1% of container's inline size */
/* cqb = 1% of container's block size */
/* cqmin = smaller of cqi and cqb */
/* cqmax = larger of cqi and cqb */

.card-container {
  container-type: inline-size;
}

.card__title {
  /* Font size relative to card container width */
  font-size: clamp(1rem, 5cqw, 2rem);
}

.card__image {
  width: 30cqw; /* 30% of container width */
  max-width: 200px;
}
```

### 6.3 Real-World Container Query Example: Product Card

```html
<div class="product-grid">
  <div class="product-wrapper"> <!-- containment context -->
    <article class="product-card">
      <img class="product-card__image" src="..." alt="...">
      <div class="product-card__body">
        <h3 class="product-card__name">Product Name</h3>
        <p class="product-card__desc">Description...</p>
        <div class="product-card__footer">
          <span class="product-card__price">$49.99</span>
          <button class="product-card__btn">Add to Cart</button>
        </div>
      </div>
    </article>
  </div>
</div>
```

```css
/* The grid — purely layout, knows nothing about card internals */
.product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 280px), 1fr));
  gap: 1.5rem;
}

/* Containment context */
.product-wrapper {
  container-type: inline-size;
  container-name: product;
}

/* Default: narrow card (vertical layout) */
.product-card {
  display: flex;
  flex-direction: column;
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid var(--border);
}

.product-card__image {
  width: 100%;
  aspect-ratio: 4 / 3;
  object-fit: cover;
}

.product-card__body {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  flex: 1;
}

.product-card__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: auto;
}

/* Wide card: switch to horizontal layout */
@container product (min-width: 480px) {
  .product-card {
    flex-direction: row;
  }
  
  .product-card__image {
    width: 45%;
    aspect-ratio: 1;
  }
  
  .product-card__body {
    padding: 1.5rem;
  }
}

/* Very wide: featured card */
@container product (min-width: 700px) {
  .product-card__image {
    width: 50%;
    aspect-ratio: auto;
  }
  
  .product-card__name {
    font-size: 1.5rem;
  }
}
```

---

## 7. Media Features Beyond Width

### 7.1 Pointer & Hover Detection

```css
/* Fine pointer = mouse. Coarse pointer = touch/finger */
@media (pointer: fine) {
  /* Mouse users — enable smaller targets, hover effects */
  .dropdown { display: block; }
  .tooltip { display: inline; }
}

@media (pointer: coarse) {
  /* Touch users — larger targets, no hover-dependent UI */
  .tap-target {
    min-height: 48px;
    min-width: 48px;
  }
}

/* Device has hover capability */
@media (hover: hover) {
  .card:hover {
    transform: translateY(-4px);
    box-shadow: var(--shadow-lg);
  }
}

/* Device cannot hover (touch) */
@media (hover: none) {
  /* Remove hover-dependent UI patterns */
  .hover-menu { display: none; }
  .touch-menu  { display: flex; }
}
```

### 7.2 Preference Queries

```css
/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}

/* Color scheme */
@media (prefers-color-scheme: dark) {
  :root {
    --bg:      #0f172a;
    --surface: #1e293b;
    --text:    #f1f5f9;
    --border:  #334155;
  }
}

/* High contrast */
@media (prefers-contrast: high) {
  :root {
    --border: currentColor;
  }
  
  button {
    border: 2px solid currentColor;
  }
}

/* Forced colors (Windows High Contrast Mode) */
@media (forced-colors: active) {
  .card {
    border: 1px solid ButtonText;
  }
  
  .icon {
    forced-color-adjust: none; /* preserve icon colors */
  }
}

/* Transparency preference */
@media (prefers-reduced-transparency: reduce) {
  .glass-card {
    background: var(--surface); /* remove blur/transparency */
    backdrop-filter: none;
  }
}

/* Data saver */
@media (prefers-reduced-data: reduce) {
  .decorative-image {
    display: none;
  }
  
  .hero {
    background-image: none; /* skip decorative background image */
  }
}
```

### 7.3 Display Mode (PWA Detection)

```css
/* When installed as PWA */
@media (display-mode: standalone) {
  .install-banner { display: none; }
  .pwa-back-button { display: flex; } /* provide own navigation */
}

/* In browser */
@media (display-mode: browser) {
  .install-banner { display: flex; }
}
```

---

## 8. The `@layer` System for Breakpoint Organization

Use CSS Cascade Layers to organize responsive styles cleanly:

```css
/* Define layer order (lower = lower specificity) */
@layer reset, base, layout, components, utilities, overrides;

@layer base {
  body {
    font-size: 1rem;
    line-height: 1.6;
  }
}

@layer layout {
  .container {
    max-width: 80rem;
    margin-inline: auto;
    padding-inline: var(--space-md);
  }
}

@layer components {
  .card {
    padding: 1rem;
    
    @media (min-width: 48em) {
      padding: 2rem;
    }
  }
}

@layer utilities {
  .hidden-mobile {
    @media (max-width: 47.9375em) { display: none !important; }
  }
  
  .hidden-desktop {
    @media (min-width: 48em) { display: none !important; }
  }
}
```

---

## 9. Debugging Breakpoints

### 9.1 Visual Breakpoint Indicator (Development Only)

```css
/* Shows current breakpoint in corner during development */
body::before {
  content: 'xs';
  position: fixed;
  top: 0;
  left: 0;
  background: red;
  color: white;
  padding: 4px 8px;
  font-size: 12px;
  font-family: monospace;
  z-index: 99999;
  pointer-events: none;
}

@media (min-width: 30em)  { body::before { content: 'sm'; background: orange; } }
@media (min-width: 48em)  { body::before { content: 'md'; background: blue; } }
@media (min-width: 64em)  { body::before { content: 'lg'; background: green; } }
@media (min-width: 80em)  { body::before { content: 'xl'; background: purple; } }
@media (min-width: 96em)  { body::before { content: '2xl'; background: teal; } }
```

### 9.2 JavaScript Breakpoint Sync

```javascript
// Sync CSS breakpoints to JavaScript
const breakpoints = {
  xs:  '(min-width: 0px)',
  sm:  '(min-width: 480px)',
  md:  '(min-width: 768px)',
  lg:  '(min-width: 1024px)',
  xl:  '(min-width: 1280px)',
};

// Get current breakpoint
function getCurrentBreakpoint() {
  return Object.entries(breakpoints)
    .reverse()
    .find(([, query]) => window.matchMedia(query).matches)?.[0] ?? 'xs';
}

// React to breakpoint changes
function onBreakpointChange(bp, callback) {
  const mq = window.matchMedia(breakpoints[bp]);
  mq.addEventListener('change', (e) => callback(e.matches));
  return () => mq.removeEventListener('change', callback);
}

// Usage
const cleanup = onBreakpointChange('md', (isTablet) => {
  console.log('Tablet or above:', isTablet);
});
```

---

*Next: `02_FLUID_TYPOGRAPHY_AND_SPACING.md` — Master fluid, zero-query responsive typography.*
