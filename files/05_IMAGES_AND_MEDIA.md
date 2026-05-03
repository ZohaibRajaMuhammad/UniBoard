# 05 — IMAGES & MEDIA
### The Complete Deep Dive: Responsive Images, Lazy Loading, Video & Zero-CLS Media

---

## 1. Why Images Are Your #1 Performance Problem

Images account for **70–80% of page weight** on most websites. On mobile:
- Slow connections (3G/4G) make large images catastrophic for LCP
- Rendering unoptimized images wastes battery and data
- Missing `width`/`height` attributes cause Cumulative Layout Shift (CLS)
- Wrong format (JPEG on a logo) wastes bytes that WebP would serve better

Getting images right is the single highest-impact mobile performance optimization.

---

## 2. The Modern Image Format Hierarchy

| Format | Use Case | Compression | Transparency | Animation |
|--------|----------|-------------|--------------|-----------|
| **AVIF** | Photos, complex images | Best (30–50% smaller than WebP) | ✅ | ✅ |
| **WebP** | Photos, illustrations | Excellent (25–35% smaller than JPEG) | ✅ | ✅ |
| **JPEG** | Photos (fallback) | Good | ❌ | ❌ |
| **PNG** | Screenshots, pixel art | OK | ✅ | ❌ |
| **SVG** | Icons, logos, illustrations | Vector = scales infinitely | ✅ | ✅ |
| **GIF** | Never — use WebP/AVIF | Poor | Limited | ✅ |

**Strategy:** Serve AVIF → WebP → JPEG/PNG fallback using `<picture>`.

---

## 3. The Complete `<picture>` Pattern

### 3.1 Format Negotiation + Responsive Sizes

```html
<picture>
  <!-- AVIF: best compression, Chrome/Firefox/Safari 16+ -->
  <source
    type="image/avif"
    srcset="
      image-400w.avif   400w,
      image-800w.avif   800w,
      image-1200w.avif 1200w,
      image-1600w.avif 1600w
    "
    sizes="
      (max-width: 480px)  100vw,
      (max-width: 768px)  100vw,
      (max-width: 1024px) 80vw,
      60vw
    "
  >
  
  <!-- WebP: excellent compression, broad support -->
  <source
    type="image/webp"
    srcset="
      image-400w.webp   400w,
      image-800w.webp   800w,
      image-1200w.webp 1200w,
      image-1600w.webp 1600w
    "
    sizes="
      (max-width: 480px)  100vw,
      (max-width: 768px)  100vw,
      (max-width: 1024px) 80vw,
      60vw
    "
  >
  
  <!-- JPEG: universal fallback -->
  <img
    src="image-800w.jpg"
    srcset="
      image-400w.jpg   400w,
      image-800w.jpg   800w,
      image-1200w.jpg 1200w,
      image-1600w.jpg 1600w
    "
    sizes="
      (max-width: 480px)  100vw,
      (max-width: 768px)  100vw,
      (max-width: 1024px) 80vw,
      60vw
    "
    alt="Descriptive alt text that explains the image content"
    
    <!-- CRITICAL: Prevents CLS — set to intrinsic dimensions -->
    width="1600"
    height="900"
    
    <!-- Above-fold: eager. Below-fold: lazy -->
    loading="lazy"
    decoding="async"
    
    <!-- Fetchpriority for hero/LCP images -->
    fetchpriority="high"
  >
</picture>
```

### 3.2 Art Direction (Different Crop Per Breakpoint)

Art direction shows a **completely different image** at different breakpoints — not just a different size:

```html
<picture>
  <!-- Mobile: portrait crop, subject centered -->
  <source
    media="(max-width: 480px)"
    srcset="hero-mobile.webp 480w"
    type="image/webp"
  >
  
  <!-- Tablet: square crop -->
  <source
    media="(max-width: 768px)"
    srcset="hero-tablet.webp 768w"
    type="image/webp"
  >
  
  <!-- Desktop: wide landscape crop -->
  <source
    media="(min-width: 769px)"
    srcset="hero-desktop.webp 1600w"
    type="image/webp"
  >
  
  <img
    src="hero-desktop.jpg"
    alt="Team working in our bright, open office"
    width="1600"
    height="900"
    fetchpriority="high"
  >
</picture>
```

### 3.3 The `sizes` Attribute Explained

`sizes` tells the browser what rendered size the image will be **before** downloading it:

```html
sizes="
  (max-width: 480px)  100vw,    ← On phones: image is 100% viewport wide
  (max-width: 768px)  100vw,    ← On tablets portrait: still full width  
  (max-width: 1024px) 50vw,     ← On tablets landscape: 50% viewport
  (max-width: 1280px) 33vw,     ← On small desktops: 1/3 viewport
  400px                          ← On large desktops: fixed 400px
"
```

**Common mistake:** Leaving `sizes` at the default `100vw` when the image isn't full-width. On a 1920px screen with a 400px card image, the browser would download the 1920px version without `sizes`.

---

## 4. Lazy Loading

### 4.1 Native Lazy Loading

```html
<!-- Native lazy loading — supported in all modern browsers -->
<img 
  src="below-fold.jpg" 
  loading="lazy"
  alt="..."
  width="800" 
  height="600"
>

<!-- Above the fold: always eager -->
<img 
  src="hero.jpg" 
  loading="eager"   <!-- or just omit loading="" -->
  fetchpriority="high"
  alt="..."
  width="1600" 
  height="900"
>
```

### 4.2 The LCP Image — Critical Handling

The Largest Contentful Paint image needs special treatment:

```html
<!-- In <head>: preload the LCP image -->
<link
  rel="preload"
  as="image"
  href="hero-800w.webp"
  imagesrcset="hero-400w.webp 400w, hero-800w.webp 800w, hero-1200w.webp 1200w"
  imagesizes="100vw"
  type="image/webp"
>

<!-- In <body>: the actual image -->
<img
  src="hero-800w.jpg"
  srcset="hero-400w.webp 400w, hero-800w.webp 800w, hero-1200w.webp 1200w"
  sizes="100vw"
  alt="..."
  width="1600"
  height="900"
  loading="eager"
  fetchpriority="high"
  decoding="sync"
>
```

### 4.3 Intersection Observer Lazy Loading (For Backgrounds)

Native `loading="lazy"` doesn't work for CSS background images. Use Intersection Observer:

```javascript
class LazyLoader {
  constructor(selector = '[data-lazy-bg]', options = {}) {
    this.observer = new IntersectionObserver(
      this.handleIntersection.bind(this),
      {
        rootMargin: '200px 0px', // start loading 200px before viewport
        threshold: 0,
        ...options
      }
    );
    
    document.querySelectorAll(selector).forEach(el => {
      this.observer.observe(el);
    });
  }
  
  handleIntersection(entries) {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const src = el.dataset.lazyBg;
        
        el.style.backgroundImage = `url(${src})`;
        el.classList.add('lazy-loaded');
        
        this.observer.unobserve(el);
      }
    });
  }
}

// Usage
new LazyLoader('[data-lazy-bg]');
```

```html
<!-- HTML -->
<div 
  class="hero-section"
  data-lazy-bg="hero-bg.webp"
  style="background-size: cover; background-position: center;"
>
  ...
</div>
```

---

## 5. Preventing Cumulative Layout Shift (CLS)

CLS is caused by images and media without reserved space. The browser doesn't know how tall an image is until it loads — causing content below to jump.

### 5.1 Always Set `width` and `height`

```html
<!-- ❌ WRONG — causes CLS -->
<img src="photo.jpg" alt="...">

<!-- ✅ CORRECT — browser reserves space before image loads -->
<img src="photo.jpg" alt="..." width="800" height="600">
```

Even if you use CSS to make images `width: 100%`, the browser uses the `width`/`height` ratio to reserve the correct amount of space.

### 5.2 The `aspect-ratio` CSS Technique

```css
/* Reliable CLS prevention for any image */
.image-container {
  position: relative;
  aspect-ratio: 16 / 9; /* matches image's natural ratio */
  overflow: hidden;
  background: var(--surface-muted); /* placeholder color while loading */
}

.image-container img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* When image loads, fade it in */
.image-container img {
  opacity: 0;
  transition: opacity 0.3s;
}
.image-container img.loaded {
  opacity: 1;
}
```

```javascript
// Fade in images when loaded
document.querySelectorAll('img').forEach(img => {
  if (img.complete) {
    img.classList.add('loaded');
  } else {
    img.addEventListener('load', () => img.classList.add('loaded'));
  }
});
```

### 5.3 Shimmer Placeholder (Skeleton Loading)

```css
/* Animated shimmer placeholder */
.skeleton {
  background: linear-gradient(
    90deg,
    var(--surface-muted) 0%,
    var(--surface-shimmer) 50%,
    var(--surface-muted) 100%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
}

@keyframes shimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

:root {
  --surface-muted:   #f0f0f0;
  --surface-shimmer: #e0e0e0;
}

@media (prefers-color-scheme: dark) {
  :root {
    --surface-muted:   #2a2a2a;
    --surface-shimmer: #3a3a3a;
  }
}

/* Usage */
.image-placeholder {
  aspect-ratio: 16 / 9;
  border-radius: var(--radius-md);
  width: 100%;
}
```

---

## 6. SVG — The Perfect Responsive Format

### 6.1 Inline SVG for Icons

```html
<!-- Inline SVG: colorable via CSS, no extra request -->
<button class="icon-btn" aria-label="Close">
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" 
          stroke-linecap="round" stroke-linejoin="round"/>
  </svg>
</button>
```

```css
.icon-btn {
  color: var(--text); /* controls SVG stroke/fill via currentColor */
  width: 44px;
  height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.icon-btn:hover {
  color: var(--primary); /* SVG color changes automatically */
}
```

### 6.2 SVG Sprites System

```html
<!-- Hidden sprite sheet (can be in external file) -->
<svg xmlns="http://www.w3.org/2000/svg" style="display: none;">
  <symbol id="icon-home" viewBox="0 0 24 24">
    <path d="M3 12L12 3l9 9M5 10v9a1 1 0 001 1h5v-5h4v5h5a1 1 0 001-1v-9" 
          stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round"/>
  </symbol>
  
  <symbol id="icon-search" viewBox="0 0 24 24">
    <circle cx="11" cy="11" r="8" stroke="currentColor" fill="none" stroke-width="2"/>
    <path d="M21 21l-4.35-4.35" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
  </symbol>
  
  <symbol id="icon-heart" viewBox="0 0 24 24">
    <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 000-7.78z" 
          stroke="currentColor" fill="none" stroke-width="2"/>
  </symbol>
</svg>

<!-- Usage anywhere in the document -->
<svg class="icon" aria-hidden="true">
  <use href="#icon-home"/>
</svg>
```

```css
.icon {
  width: 1em;     /* scales with font-size */
  height: 1em;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  flex-shrink: 0;
}

/* Size variants */
.icon--sm  { width: 16px; height: 16px; }
.icon--md  { width: 24px; height: 24px; }
.icon--lg  { width: 32px; height: 32px; }
.icon--xl  { width: 48px; height: 48px; }
```

### 6.3 Responsive SVG Illustrations

```html
<!-- SVG that scales to container -->
<div class="illustration-wrapper">
  <svg viewBox="0 0 800 600" xmlns="http://www.w3.org/2000/svg">
    <!-- SVG content -->
  </svg>
</div>
```

```css
.illustration-wrapper {
  max-width: 600px;
  margin-inline: auto;
}

.illustration-wrapper svg {
  width: 100%;
  height: auto; /* maintains aspect ratio */
}

/* Responsive element visibility within SVG */
@media (max-width: 480px) {
  .svg-detail { display: none; } /* hide complex details on mobile */
}
```

---

## 7. Video — Responsive & Performance-Aware

### 7.1 The `<video>` Element

```html
<div class="video-wrapper">
  <video
    width="1280"
    height="720"
    controls
    preload="metadata"        <!-- only load metadata, not full video -->
    poster="video-poster.webp" <!-- show image before play -->
    playsinline               <!-- prevent fullscreen on iOS autoplay -->
    muted                     <!-- required for autoplay -->
  >
    <!-- Multiple formats for browser compatibility -->
    <source src="video.av1.mp4" type="video/mp4; codecs=av01.0.05M.08">
    <source src="video.webm" type="video/webm; codecs=vp9">
    <source src="video.mp4" type="video/mp4">
    
    <!-- Captions for accessibility -->
    <track kind="captions" src="captions-en.vtt" srclang="en" label="English" default>
    
    <!-- Fallback for no-video support -->
    <p>Your browser doesn't support video. <a href="video.mp4">Download it here</a>.</p>
  </video>
</div>
```

```css
.video-wrapper {
  aspect-ratio: 16 / 9;
  overflow: hidden;
  border-radius: var(--radius-lg);
  background: #000;
}

.video-wrapper video {
  width: 100%;
  height: 100%;
  object-fit: contain;
}
```

### 7.2 Autoplay Background Video

```html
<!-- Background video (muted + autoplay required) -->
<div class="video-bg-wrapper">
  <video
    class="video-bg"
    autoplay
    loop
    muted
    playsinline
    preload="auto"
    aria-hidden="true"   <!-- decorative, hide from screen readers -->
  >
    <source src="bg-video.webm" type="video/webm">
    <source src="bg-video.mp4" type="video/mp4">
  </video>
  
  <!-- Overlay content -->
  <div class="video-bg__content">
    <h1>...</h1>
  </div>
</div>
```

```css
.video-bg-wrapper {
  position: relative;
  overflow: hidden;
  min-height: 100dvh;
}

.video-bg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  z-index: 0;
}

.video-bg__content {
  position: relative;
  z-index: 1;
}

/* Pause background video for users who prefer reduced motion */
@media (prefers-reduced-motion: reduce) {
  .video-bg {
    display: none; /* or pause with JS */
  }
}

/* On slow connections or data-save: show poster instead */
@media (prefers-reduced-data: reduce) {
  .video-bg {
    display: none;
  }
}
```

### 7.3 Responsive Embed (YouTube/Vimeo)

```css
/* The classic padding-top trick */
.embed-responsive {
  position: relative;
  padding-top: 56.25%; /* 16:9 ratio (9/16 = 0.5625) */
  height: 0;
  overflow: hidden;
}

.embed-responsive iframe {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  border: 0;
}

/* Modern aspect-ratio approach */
.embed-responsive-modern {
  aspect-ratio: 16 / 9;
  width: 100%;
}

.embed-responsive-modern iframe {
  width: 100%;
  height: 100%;
  border: 0;
}
```

---

## 8. The Image Optimization Checklist

### Build Process

```bash
# Node.js: Sharp (fastest image processing library)
npm install sharp

# Generate all sizes and formats
const sharp = require('sharp');

async function processImage(input, output) {
  const widths = [400, 800, 1200, 1600];
  const formats = ['avif', 'webp', 'jpeg'];
  
  for (const width of widths) {
    for (const format of formats) {
      await sharp(input)
        .resize(width, null, { withoutEnlargement: true })
        .toFormat(format, {
          quality: format === 'avif' ? 60 : 80,
          effort: format === 'avif' ? 6 : undefined,
        })
        .toFile(`${output}-${width}w.${format === 'jpeg' ? 'jpg' : format}`);
    }
  }
}
```

### Pre-Deployment Checklist

```
IMAGES:
□ Every <img> has width and height attributes
□ Every <img> has descriptive alt text (or alt="" if decorative)
□ Above-fold images: loading="eager" fetchpriority="high"
□ Below-fold images: loading="lazy" decoding="async"
□ Hero/LCP image is preloaded in <head>
□ AVIF and WebP variants generated for all photos
□ srcset and sizes attributes set correctly
□ No image wider than its max rendered size

FORMATS:
□ Photos: AVIF/WebP/JPEG (not PNG)
□ Icons: SVG (inline or sprite)
□ Logos: SVG
□ Screenshots with text: PNG (lossless)
□ No GIFs (use WebP/AVIF animation)

PERFORMANCE:
□ No image > 200KB for mobile
□ Hero image ≤ 100KB
□ Total image payload ≤ 1MB for mobile
□ All images compressed (check with Squoosh.app)
□ CLS score 0 (check with Lighthouse)
```

---

*Next: `06_NAVIGATION_AND_MENUS.md` — Mobile navigation patterns, hamburger menus, bottom tabs, drawers.*
