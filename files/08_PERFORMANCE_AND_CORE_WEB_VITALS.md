# 08 — PERFORMANCE & CORE WEB VITALS
### The Complete Deep Dive: LCP, CLS, INP, Font Loading, CSS Containment & Production Optimization

---

## 1. Why Performance Is a Mobile UX Issue

Performance on mobile is **not** just about speed. It directly shapes experience:

- A 1-second delay in page load reduces conversions by 7%
- 53% of mobile users abandon a site that takes more than 3 seconds to load
- On a mid-range Android device on 4G, your MacBook-fast site may feel sluggish
- Low-end devices (the majority of global mobile users) have 4–10× slower CPUs

**The performance budget for mobile:**
- Time to Interactive (TTI): < 3.8 seconds on 4G
- Total JS: < 300KB compressed
- Total CSS: < 100KB compressed
- Total images (above fold): < 200KB

---

## 2. Core Web Vitals — The Complete Guide

Google uses these three metrics as ranking signals. They measure real user experience, not synthetic benchmarks.

### 2.1 LCP — Largest Contentful Paint

**What:** Time until the largest visible element (image, text block, video poster) is rendered.
**Target:** ≤ 2.5 seconds (Good), 2.5–4s (Needs Improvement), > 4s (Poor)

The LCP element is almost always:
- A hero `<img>` or `<picture>`
- A large `<h1>` text block
- A background image via CSS
- A video `poster` image

#### Optimizing LCP

```html
<!-- Step 1: Identify your LCP element and preload it -->
<head>
  <link
    rel="preload"
    as="image"
    href="hero-800w.webp"
    imagesrcset="hero-400w.webp 400w, hero-800w.webp 800w, hero-1200w.webp 1200w"
    imagesizes="100vw"
    fetchpriority="high"
  >
  
  <!-- Also preload your critical font -->
  <link rel="preload" href="/fonts/brand-700.woff2" as="font" type="font/woff2" crossorigin>
  
  <!-- Preconnect to third-party origins -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="dns-prefetch" href="https://cdn.example.com">
</head>

<body>
  <!-- Step 2: Mark LCP image as eager with high priority -->
  <img
    src="hero-800w.jpg"
    srcset="hero-400w.webp 400w, hero-800w.webp 800w, hero-1200w.webp 1200w"
    sizes="100vw"
    alt="..."
    width="1600"
    height="900"
    loading="eager"
    fetchpriority="high"
    decoding="sync"        <!-- don't defer decoding for LCP element -->
  >
</body>
```

```css
/* Step 3: Eliminate render-blocking resources */

/* Critical CSS: inline in <head> */
/* This is your above-fold CSS only — ~14KB max */

/* ---- Critical Inline CSS ---- */
:root { --primary: #2563eb; --bg: #fff; --text: #111; }
*, *::before, *::after { box-sizing: border-box; margin: 0; }
body { 
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
  background: var(--bg); 
  color: var(--text);
  line-height: 1.6;
}
.hero {
  min-height: 100dvh;
  display: flex;
  align-items: center;
  padding: 2rem;
}
```

```javascript
// Step 4: Load non-critical CSS asynchronously
// Method 1: loadCSS pattern
const link = document.createElement('link');
link.rel = 'stylesheet';
link.href = '/styles/main.css';
document.head.appendChild(link);

// Method 2: HTML preload trick (widely used)
// <link rel="preload" href="main.css" as="style" onload="this.rel='stylesheet'">
// <noscript><link rel="stylesheet" href="main.css"></noscript>
```

### 2.2 CLS — Cumulative Layout Shift

**What:** The total amount of unexpected layout movement during page load. 
**Target:** ≤ 0.1 (Good), 0.1–0.25 (Needs Improvement), > 0.25 (Poor)

**Score formula:** `CLS = impact_fraction × distance_fraction` per shift, summed.

#### The Top 6 CLS Causes and Fixes

```html
<!-- CAUSE 1: Images without dimensions -->
<!-- ❌ -->
<img src="photo.jpg" alt="...">
<!-- ✅ -->
<img src="photo.jpg" alt="..." width="800" height="600">

<!-- CAUSE 2: Ads and embeds without reserved space -->
<!-- ❌ -->
<div class="ad-slot"></div>
<!-- ✅ -->
<div class="ad-slot" style="min-height: 250px;"></div>

<!-- CAUSE 3: Web fonts causing FOUT -->
<!-- In CSS: always use font-display: swap or optional -->
```

```css
/* CAUSE 3: Web font FOUT */
@font-face {
  font-family: 'Brand';
  src: url('/fonts/brand.woff2') format('woff2');
  /* swap: shows fallback immediately, swaps when loaded */
  /* optional: only uses web font if loaded within ~100ms */
  font-display: optional; /* best for CLS — no swap shift */
}

/* Size-adjust to match fallback font metrics */
@font-face {
  font-family: 'Brand-Fallback';
  src: local('Arial');
  size-adjust: 94%;
  ascent-override: 88%;
  descent-override: 22%;
  line-gap-override: 0%;
}

body {
  font-family: 'Brand', 'Brand-Fallback', sans-serif;
}

/* CAUSE 4: Dynamically injected content above existing content */
/* Always inject below the fold, or reserve space */

/* CAUSE 5: Animation that changes layout properties */
/* ❌ Animating height, width, top, left causes reflow */
.bad-animation { transition: height 0.3s; }

/* ✅ Animate transform and opacity only (GPU-accelerated, no reflow) */
.good-animation { transition: transform 0.3s, opacity 0.3s; }

/* CAUSE 6: Late-loading iframes/embeds */
.embed-container {
  aspect-ratio: 16 / 9; /* reserves space before content loads */
}
```

```javascript
// Measure CLS in production (Real User Monitoring)
import { onCLS } from 'web-vitals';

onCLS(metric => {
  console.log('CLS:', metric.value);
  
  // Send to analytics
  sendToAnalytics({
    name: 'CLS',
    value: metric.value,
    id: metric.id,
    page: window.location.pathname
  });
});
```

### 2.3 INP — Interaction to Next Paint

**What:** Measures responsiveness. The 98th percentile interaction latency (how long from interaction to visual update).
**Target:** ≤ 200ms (Good), 200–500ms (Needs Improvement), > 500ms (Poor)

INP replaced FID (First Input Delay) in March 2024.

#### Optimizing INP

```javascript
// PROBLEM: Long tasks block the main thread and delay paint

// ❌ Long synchronous task
button.addEventListener('click', () => {
  const results = heavyDataProcessing(largeDataset); // blocks for 500ms
  renderResults(results);
});

// ✅ Yield to browser between heavy tasks
button.addEventListener('click', async () => {
  // Immediately show loading state
  showLoadingState();
  
  // Yield to let browser paint the loading state
  await scheduler.yield?.() ?? new Promise(r => setTimeout(r, 0));
  
  // Process in chunks
  const results = await processInChunks(largeDataset);
  renderResults(results);
});

// Scheduler.yield() polyfill
async function yieldToMain() {
  if ('scheduler' in window && 'yield' in scheduler) {
    return scheduler.yield();
  }
  return new Promise(resolve => setTimeout(resolve, 0));
}

// Break long tasks into chunks
async function processInChunks(data, chunkSize = 50) {
  const results = [];
  
  for (let i = 0; i < data.length; i += chunkSize) {
    const chunk = data.slice(i, i + chunkSize);
    results.push(...processChunk(chunk));
    
    // Yield every chunk to keep INP responsive
    await yieldToMain();
  }
  
  return results;
}
```

```css
/* CSS that helps INP */

/* GPU-accelerate elements that will animate */
.will-animate {
  will-change: transform, opacity;
}

/* Use contain to limit style recalculation scope */
.isolated-component {
  contain: layout style; /* changes here don't affect outside */
}

/* Use content-visibility to skip rendering off-screen content */
.lazy-section {
  content-visibility: auto;
  contain-intrinsic-size: auto 500px; /* estimated height */
}
```

---

## 3. CSS Performance Techniques

### 3.1 CSS Containment

```css
/* contain: restrict what the browser needs to recalculate */

/* layout: element's size/position doesn't affect siblings */
.card {
  contain: layout;
}

/* style: CSS counters/properties are scoped to element */
.component {
  contain: style;
}

/* paint: element's children don't paint outside it (like overflow: hidden) */
.clipped-component {
  contain: paint;
}

/* size: element's size is independent of children */
.fixed-size-box {
  contain: size;
}

/* strict: all containment — maximum performance */
.completely-isolated {
  contain: strict;
}

/* content: layout + style + paint (most useful combo) */
.article-card {
  contain: content; /* = layout + style + paint */
}
```

### 3.2 `content-visibility` — The Big Win

```css
/* Skip rendering off-screen sections */

/* Auto: renders when near viewport, defers when far */
.article-body,
.below-fold-section,
.product-list,
.comment-section {
  content-visibility: auto;
  /* 
    CRITICAL: Provide estimated size to prevent CLS.
    Browser uses this as placeholder height while section is off-screen.
    Measure actual rendered height and use a close estimate.
  */
  contain-intrinsic-size: auto 600px;
}

/* Fallback for browsers without content-visibility support */
@supports not (content-visibility: auto) {
  .article-body { /* regular styles */ }
}
```

**Performance impact:** On a page with 10 product cards, `content-visibility: auto` can reduce rendering time by 50–70% on first load.

### 3.3 `@layer` for CSS Organization and Performance

```css
/* Define layers — lower priority layers can be overridden by higher */
@layer reset, tokens, base, layout, components, utilities, overrides;

/* Each layer is independent — reduces specificity conflicts */
@layer tokens {
  :root {
    --primary: #2563eb;
    /* all design tokens */
  }
}

@layer base {
  body { font-family: var(--font-sans); }
  h1, h2, h3, h4 { font-weight: 700; }
}

@layer components {
  .card { 
    padding: var(--space-md);
    border-radius: var(--radius-lg);
  }
}

/* Overrides layer — always wins regardless of specificity */
@layer overrides {
  .no-padding { padding: 0 !important; }
}
```

### 3.4 Efficient Animations (Zero Jank)

```css
/* ✅ Only animate transform and opacity */
/* These run on the compositor thread — no layout/paint needed */

.fade-in {
  animation: fadeIn 0.3s var(--ease-out) both;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}

.slide-up {
  animation: slideUp 0.4s var(--ease-spring) both;
}

@keyframes slideUp {
  from { transform: translateY(20px); opacity: 0; }
  to   { transform: translateY(0); opacity: 1; }
}

.scale-in {
  animation: scaleIn 0.3s var(--ease-spring) both;
}

@keyframes scaleIn {
  from { transform: scale(0.9); opacity: 0; }
  to   { transform: scale(1); opacity: 1; }
}

/* Stagger children */
.stagger-children > * {
  opacity: 0;
  transform: translateY(16px);
  animation: slideUp 0.4s var(--ease-spring) both;
}

.stagger-children > *:nth-child(1) { animation-delay: 0.05s; }
.stagger-children > *:nth-child(2) { animation-delay: 0.10s; }
.stagger-children > *:nth-child(3) { animation-delay: 0.15s; }
.stagger-children > *:nth-child(4) { animation-delay: 0.20s; }
.stagger-children > *:nth-child(5) { animation-delay: 0.25s; }

/* ❌ Never animate these — they trigger layout */
/* width, height, top, left, right, bottom, margin, padding, 
   font-size, border-width, display */

/* ❌ Avoid — triggers paint */
/* background-color, color, box-shadow, border-color, visibility */
/* (OK for short durations with GPU hint) */

/* GPU hint for background animations */
.animated-bg {
  will-change: background-color;
  transition: background-color 0.2s;
}
```

### 3.5 The `will-change` Property — Use Sparingly

```css
/* ✅ Apply only to elements that WILL animate */
.modal {
  will-change: transform, opacity;
}

/* Apply before animation, remove after */
.animated-card {
  transition: transform 0.3s;
}

.animated-card:hover {
  transform: translateY(-4px);
}

/* JavaScript approach: add/remove will-change around animation */
```

```javascript
// Add will-change before animation, remove after
function animateWithHint(element) {
  element.style.willChange = 'transform, opacity';
  
  element.addEventListener('transitionend', () => {
    element.style.willChange = 'auto';
  }, { once: true });
  
  // Trigger animation
  requestAnimationFrame(() => {
    element.classList.add('animated');
  });
}
```

---

## 4. JavaScript Performance

### 4.1 Code Splitting

```javascript
// Dynamic imports — load JS only when needed

// ❌ Load everything upfront
import { PhotoEditor } from './photo-editor.js';
import { VideoPlayer } from './video-player.js';
import { Charts } from './charts.js';

// ✅ Load on demand
async function initPhotoEditor() {
  const { PhotoEditor } = await import('./photo-editor.js');
  return new PhotoEditor();
}

// Load on user interaction
document.getElementById('edit-photo').addEventListener('click', async () => {
  const editor = await initPhotoEditor();
  editor.open();
});

// Prefetch for likely-needed modules
// (loads in background after critical content)
const link = document.createElement('link');
link.rel = 'prefetch';
link.href = '/js/photo-editor.js';
document.head.appendChild(link);
```

### 4.2 Defer Non-Critical Scripts

```html
<!-- Critical scripts: inline or in <head> with no defer/async -->
<script>
  // Tiny inline scripts: analytics init, feature detection
  window.__analytics = { queue: [] };
</script>

<!-- Deferred scripts: load after HTML parsed, execute in order -->
<script src="main.js" defer></script>

<!-- Async scripts: load and execute ASAP, no order guarantee -->
<!-- Use for truly independent scripts like analytics -->
<script src="analytics.js" async></script>

<!-- Load after page is interactive -->
<script>
  window.addEventListener('load', () => {
    // Chatbot, live chat widget, non-critical third parties
    const script = document.createElement('script');
    script.src = 'https://chat.example.com/widget.js';
    document.body.appendChild(script);
  });
</script>

<!-- Or use requestIdleCallback -->
<script>
  requestIdleCallback(() => {
    import('./non-critical-feature.js');
  }, { timeout: 5000 });
</script>
```

### 4.3 Event Delegation (Performance Pattern)

```javascript
// ❌ Attach listener to each item (memory leak risk, slow on large lists)
document.querySelectorAll('.list-item').forEach(item => {
  item.addEventListener('click', handleItemClick);
});

// ✅ Single listener on parent (event delegation)
document.getElementById('list').addEventListener('click', e => {
  const item = e.target.closest('.list-item');
  if (item) handleItemClick(item, e);
});
```

### 4.4 Debounce and Throttle

```javascript
// Debounce: fire only after N ms of silence
// Use for: search input, resize handlers, validation
function debounce(fn, delay = 300) {
  let timer;
  return function(...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

// Throttle: fire at most once per N ms
// Use for: scroll handlers, mousemove, touchmove
function throttle(fn, limit = 100) {
  let lastCall = 0;
  return function(...args) {
    const now = Date.now();
    if (now - lastCall >= limit) {
      lastCall = now;
      return fn.apply(this, args);
    }
  };
}

// Usage
const searchInput = document.getElementById('search');
searchInput.addEventListener('input', debounce(handleSearch, 300));

window.addEventListener('scroll', throttle(handleScroll, 16), { passive: true });
window.addEventListener('resize', debounce(handleResize, 200));
```

### 4.5 `requestAnimationFrame` for Visual Updates

```javascript
// ❌ DOM reads/writes in a loop cause forced reflow
function badAnimation() {
  const elements = document.querySelectorAll('.item');
  elements.forEach(el => {
    const height = el.offsetHeight; // READ — forces layout
    el.style.height = `${height * 2}px`; // WRITE — invalidates layout
    // Next read in next iteration forces reflow again
  });
}

// ✅ Batch reads then writes
function goodAnimation() {
  const elements = document.querySelectorAll('.item');
  
  // Batch all reads
  const heights = [...elements].map(el => el.offsetHeight);
  
  // Then batch all writes
  requestAnimationFrame(() => {
    elements.forEach((el, i) => {
      el.style.height = `${heights[i] * 2}px`;
    });
  });
}

// ✅ Animation loop with RAF
function animate(timestamp) {
  // Update state based on timestamp
  const progress = (timestamp % 2000) / 2000;
  element.style.transform = `translateX(${progress * 100}px)`;
  
  requestAnimationFrame(animate);
}

requestAnimationFrame(animate);
```

---

## 5. Resource Loading Strategy

### 5.1 The Complete `<head>` Template

```html
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  
  <!-- STEP 1: Inline critical CSS (above-fold only, ~14KB max) -->
  <style>
    /* Critical CSS here — see MASTER guide Part 10 */
  </style>
  
  <!-- STEP 2: Preconnect to third-party origins -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="dns-prefetch" href="https://api.example.com">
  
  <!-- STEP 3: Preload LCP image -->
  <link
    rel="preload"
    as="image"
    href="hero-800w.webp"
    imagesrcset="hero-400w.webp 400w, hero-800w.webp 800w"
    imagesizes="100vw"
    fetchpriority="high"
  >
  
  <!-- STEP 4: Preload critical font -->
  <link rel="preload" href="/fonts/brand-700.woff2" as="font" type="font/woff2" crossorigin>
  
  <!-- STEP 5: Load non-critical CSS asynchronously -->
  <link rel="preload" href="/styles/main.css" as="style" onload="this.onload=null;this.rel='stylesheet'">
  <noscript><link rel="stylesheet" href="/styles/main.css"></noscript>
  
  <!-- STEP 6: Prefetch likely next pages -->
  <link rel="prefetch" href="/products">
  <link rel="prefetch" href="/about">
  
  <!-- STEP 7: Deferred scripts -->
  <script src="/js/main.js" defer></script>
  
  <!-- Title, meta tags, OG, favicon -->
  <title>Page Title</title>
  <meta name="description" content="...">
  
  <!-- PWA -->
  <link rel="manifest" href="/manifest.json">
  <meta name="theme-color" content="#2563eb">
  <meta name="apple-mobile-web-app-capable" content="yes">
</head>
```

### 5.2 Resource Hints Reference

```html
<!-- preconnect: establish connection early (DNS + TCP + TLS) -->
<!-- Use for: CDNs, API servers, font providers you'll definitely use -->
<link rel="preconnect" href="https://example.com">

<!-- dns-prefetch: DNS lookup only (lighter than preconnect) -->
<!-- Use for: third parties you might not actually use -->
<link rel="dns-prefetch" href="https://example.com">

<!-- preload: fetch critical resource immediately -->
<!-- Use for: LCP image, critical fonts, above-fold CSS/JS -->
<link rel="preload" href="critical.css" as="style">
<link rel="preload" href="hero.webp" as="image">
<link rel="preload" href="font.woff2" as="font" crossorigin>

<!-- prefetch: fetch for future navigation (low priority) -->
<!-- Use for: next page JS/CSS bundles, likely clicked resources -->
<link rel="prefetch" href="/next-page.js" as="script">

<!-- modulepreload: preload ES module + its imports -->
<link rel="modulepreload" href="/js/main.module.js">
```

---

## 6. Measuring Performance

### 6.1 Real User Monitoring (RUM)

```javascript
import { onCLS, onINP, onLCP, onFCP, onTTFB } from 'web-vitals';

function sendToAnalytics({ name, value, id, rating }) {
  // Send to your analytics endpoint
  fetch('/api/vitals', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      metric: name,
      value: Math.round(name === 'CLS' ? value * 1000 : value),
      rating,
      id,
      url: window.location.href,
      userAgent: navigator.userAgent,
      connection: navigator.connection?.effectiveType,
      timestamp: Date.now(),
    }),
    keepalive: true // survives page unload
  });
}

// Measure all Core Web Vitals
onCLS(sendToAnalytics);
onINP(sendToAnalytics);
onLCP(sendToAnalytics);
onFCP(sendToAnalytics);
onTTFB(sendToAnalytics);
```

### 6.2 Performance Observer

```javascript
// Observe long tasks (> 50ms) that hurt INP
const observer = new PerformanceObserver(list => {
  list.getEntries().forEach(entry => {
    if (entry.duration > 50) {
      console.warn('Long task detected:', {
        duration: entry.duration,
        startTime: entry.startTime,
        attribution: entry.attribution,
      });
    }
  });
});

observer.observe({ entryTypes: ['longtask'] });

// Observe layout shifts
const clsObserver = new PerformanceObserver(list => {
  list.getEntries().forEach(entry => {
    if (!entry.hadRecentInput) {
      console.log('Layout shift:', {
        score: entry.value,
        sources: entry.sources?.map(s => s.node?.nodeName),
      });
    }
  });
});

clsObserver.observe({ entryTypes: ['layout-shift'] });
```

### 6.3 Lighthouse CI — Automate Performance Gating

```json
// lighthouserc.json
{
  "ci": {
    "collect": {
      "url": ["http://localhost:3000/", "http://localhost:3000/products"],
      "numberOfRuns": 3,
      "settings": {
        "preset": "desktop",
        "throttlingMethod": "simulate",
        "screenEmulation": {
          "mobile": true,
          "width": 390,
          "height": 844,
          "deviceScaleFactor": 3
        }
      }
    },
    "assert": {
      "assertions": {
        "categories:performance":    ["error", {"minScore": 0.9}],
        "categories:accessibility":  ["error", {"minScore": 0.9}],
        "categories:best-practices": ["error", {"minScore": 0.9}],
        "categories:seo":            ["warn", {"minScore": 0.9}],
        "first-contentful-paint":    ["error", {"maxNumericValue": 2000}],
        "largest-contentful-paint":  ["error", {"maxNumericValue": 2500}],
        "cumulative-layout-shift":   ["error", {"maxNumericValue": 0.1}],
        "interactive":               ["error", {"maxNumericValue": 3800}],
        "total-blocking-time":       ["warn",  {"maxNumericValue": 300}]
      }
    },
    "upload": {
      "target": "temporary-public-storage"
    }
  }
}
```

---

## 7. Build-Time Optimization Checklist

### Vite Configuration (Recommended Build Tool)

```javascript
// vite.config.js
import { defineConfig } from 'vite';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  build: {
    // Target modern browsers — smaller bundle
    target: ['es2020', 'edge88', 'firefox78', 'chrome87', 'safari14'],
    
    // Enable CSS code splitting
    cssCodeSplit: true,
    
    // Minification
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,      // remove console.log in prod
        drop_debugger: true,
        passes: 2,
      },
    },
    
    // Chunk strategy
    rollupOptions: {
      output: {
        // Vendor chunk for stable caching
        manualChunks: {
          vendor: ['react', 'react-dom'],
          utils:  ['lodash-es', 'date-fns'],
        },
        
        // Content-hash filenames for long-term caching
        chunkFileNames:  'js/[name]-[hash].js',
        entryFileNames:  'js/[name]-[hash].js',
        assetFileNames:  'assets/[name]-[hash][extname]',
      },
    },
    
    // Warn on large chunks
    chunkSizeWarningLimit: 300, // KB
  },
  
  plugins: [
    // Analyze bundle size
    visualizer({ open: true, gzipSize: true }),
  ],
});
```

### Complete Performance Checklist

```
CRITICAL PATH
□ Inline critical CSS (above-fold, < 14KB)
□ Defer all non-critical CSS
□ Defer all JS with defer or async
□ Preload LCP image
□ Preload critical fonts (max 2 font files)
□ Preconnect to third-party origins

LCP OPTIMIZATION
□ LCP image is served in WebP/AVIF
□ LCP image has fetchpriority="high"
□ LCP image has loading="eager"
□ No redirect chains for LCP resource
□ Server response time (TTFB) < 600ms
□ LCP element has no render-blocking ancestors

CLS PREVENTION
□ All images have width + height attributes
□ All embeds/ads have min-height reserved
□ Font-display: optional (or swap + size-adjust)
□ No DOM injections above existing content
□ Animations use only transform + opacity

INP OPTIMIZATION
□ No long tasks (> 50ms) on main thread
□ Heavy computation split with yield points
□ Event handlers are lightweight
□ Third-party scripts don't block interaction
□ Input handlers use passive: true where possible

JAVASCRIPT
□ Total JS < 300KB compressed
□ Code splitting implemented for routes
□ Dynamic imports for non-critical features
□ No unused JS (tree-shaken)
□ Lodash → lodash-es (tree-shakeable)

CSS
□ Total CSS < 100KB compressed
□ No unused CSS (PurgeCSS or similar)
□ CSS containment applied to isolated components
□ content-visibility: auto on below-fold sections

NETWORK
□ HTTP/3 or HTTP/2 enabled on server
□ Brotli compression enabled (better than gzip)
□ Long cache headers for static assets
□ CDN for static assets and images
□ Service Worker for repeat visits (optional but impactful)
```

---

## 8. Service Worker for Offline & Instant Repeat Visits

```javascript
// service-worker.js

const CACHE_NAME = 'app-v1';
const STATIC_ASSETS = [
  '/',
  '/styles/main.css',
  '/js/main.js',
  '/fonts/brand-700.woff2',
  '/offline.html',
];

// Install: cache static assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: stale-while-revalidate strategy
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  
  event.respondWith(
    caches.match(event.request).then(cached => {
      const networkFetch = fetch(event.request).then(response => {
        // Update cache with fresh response
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => {
        // Network failed — serve offline page for navigation requests
        if (event.request.mode === 'navigate') {
          return caches.match('/offline.html');
        }
      });
      
      // Return cached version immediately, update in background
      return cached || networkFetch;
    })
  );
});
```

```javascript
// Register service worker (in main.js)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(reg => console.log('SW registered:', reg.scope))
      .catch(err => console.error('SW registration failed:', err));
  });
}
```

---

*All 8 deep-dive files complete. Return to `MASTER_RESPONSIVE_GUIDE.md` for the full overview and quick-win checklist.*
