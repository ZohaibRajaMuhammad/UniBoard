# 04 — TOUCH & INTERACTION
### The Complete Deep Dive: Gestures, Targets, Feedback & Mobile UX Patterns

---

## 1. The Anatomy of a Touch Interaction

A mobile touch interaction goes through these phases:

```
touchstart → touchmove → touchend → (300ms delay) → click
```

The 300ms delay was historically added by browsers to detect double-taps. Modern browsers eliminate it automatically when `width=device-width` is set in the viewport meta tag — but you should still be aware of it for legacy support.

```css
/* Eliminate any remaining tap delay */
html {
  touch-action: manipulation; /* disables double-tap zoom, removes delay */
}

/* Or per-element */
button, a, [role="button"] {
  touch-action: manipulation;
}
```

---

## 2. Touch Target Sizing — The Complete Guide

### 2.1 Standards Reference

| Authority | Minimum | Recommended Spacing |
|-----------|---------|-------------------|
| Apple Human Interface Guidelines | 44×44pt | 8pt between targets |
| Google Material Design 3 | 48×48dp | 8dp between targets |
| WCAG 2.5.5 (Level AA) | 44×44px | N/A |
| WCAG 2.5.8 (Level AA, 2.2+) | 24×24px | Or 24px spacing |

**Use 48×48px as your baseline. Never go below 44×44px.**

### 2.2 Making Small Elements Tappable

```css
/* Method 1: Padding expansion */
.icon-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;   /* visual size */
  height: 24px;
  padding: 12px; /* expands tap area to 48×48px */
  margin: -12px; /* compensate for layout impact */
  border: none;
  background: none;
  cursor: pointer;
  border-radius: var(--radius-full);
  color: inherit;
}

/* Method 2: Pseudo-element expansion (no layout impact) */
.small-link {
  position: relative;
}

.small-link::after {
  content: '';
  position: absolute;
  inset: -12px; /* expands tap area 12px in all directions */
  border-radius: inherit;
}

/* Method 3: CSS custom property for dynamic expansion */
.tappable {
  --tap-expansion: max(0px, calc((44px - 100%) / 2));
  padding: var(--tap-expansion);
  margin: calc(-1 * var(--tap-expansion));
}
```

### 2.3 Touch Target Spacing

Adjacent targets should have at least 8px space between them:

```css
/* Navigation items with proper spacing */
.nav-items {
  display: flex;
  gap: 8px; /* minimum gap between targets */
}

/* Tag/chip components */
.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tag {
  min-height: 44px;
  padding-inline: 16px;
  display: inline-flex;
  align-items: center;
  border-radius: var(--radius-full);
}
```

---

## 3. The Thumb Zone — Designing for Real Hands

Research by Steven Hoober shows that 49% of users hold their phone with one hand, and 75% of interactions use the thumb alone. This creates distinct reach zones:

```
┌─────────────┐
│  ╔═══════╗  │  ← Hard to reach (stretch zone)
│  ║ X X X ║  │    Avoid primary CTAs here
│  ╠═══════╣  │
│  ║ X X X ║  │  ← Natural zone (comfortable)
│  ╠═══════╣  │    Best for primary content
│  ║ X X X ║  │
│  ╠═══════╣  │  ← Easy reach (thumb zone)
│  ║ X X X ║  │    PRIMARY CTAs GO HERE
│  ╚═══════╝  │
│  [_______]  │  ← Home area
└─────────────┘
```

### 3.1 Applying Thumb Zone Principles

```css
/* Primary CTA — keep in bottom 40% of screen */
.primary-action {
  position: fixed;
  bottom: max(var(--space-lg), env(safe-area-inset-bottom) + var(--space-md));
  left: var(--space-md);
  right: var(--space-md);
  z-index: 50;
}

/* Bottom sheet trigger */
.fab {
  position: fixed;
  bottom: max(80px, calc(env(safe-area-inset-bottom) + 64px));
  right: var(--space-lg);
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: var(--primary);
  color: white;
  border: none;
  cursor: pointer;
  box-shadow: var(--shadow-xl);
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s var(--ease-spring), box-shadow 0.2s;
}

.fab:active {
  transform: scale(0.94);
  box-shadow: var(--shadow-md);
}
```

---

## 4. Touch Feedback — Visual, Motion & Haptic

### 4.1 CSS Touch Feedback States

```css
/* The fundamental touch feedback stack */
.interactive {
  /* Base state */
  cursor: pointer;
  user-select: none;         /* prevent text selection on tap */
  -webkit-user-select: none;
  
  /* Remove tap highlight on mobile (replace with custom) */
  -webkit-tap-highlight-color: transparent;
  
  /* Smooth transitions */
  transition:
    transform       var(--duration-fast) var(--ease-out),
    background-color var(--duration-fast) var(--ease-out),
    box-shadow      var(--duration-fast) var(--ease-out),
    opacity         var(--duration-fast) var(--ease-out);
}

/* Touch/click active state */
.interactive:active {
  transform: scale(0.96);
  opacity: 0.85;
}

/* Button press effect */
.button-press:active {
  transform: translateY(2px);
  box-shadow: var(--shadow-xs);
}

/* Ripple-like scale effect */
.scale-press:active {
  transform: scale(0.95);
}

/* Inset press (physical button feel) */
.inset-press {
  box-shadow: var(--shadow-md), inset 0 0 0 0 rgba(0,0,0,0);
  transition: box-shadow 0.15s, transform 0.15s;
}
.inset-press:active {
  box-shadow: var(--shadow-xs), inset 0 2px 4px rgba(0,0,0,0.1);
  transform: translateY(1px);
}
```

### 4.2 The Ripple Effect (Pure CSS)

```css
/* Material Design-style ripple */
.ripple {
  position: relative;
  overflow: hidden;
}

.ripple::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 5px;
  height: 5px;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 50%;
  transform: translate(-50%, -50%) scale(0);
  opacity: 0;
  pointer-events: none;
}

.ripple:active::after {
  animation: ripple-effect 0.4s ease-out forwards;
}

@keyframes ripple-effect {
  to {
    transform: translate(-50%, -50%) scale(60);
    opacity: 0;
  }
}
```

### 4.3 Haptic Feedback (JavaScript)

```javascript
/**
 * Trigger haptic feedback on supported devices
 * Requires: https://developer.mozilla.org/en-US/docs/Web/API/Vibration_API
 */
const Haptics = {
  // Light tap — confirmations, selections
  light() {
    if ('vibrate' in navigator) navigator.vibrate(10);
  },
  
  // Medium — successful actions
  medium() {
    if ('vibrate' in navigator) navigator.vibrate(20);
  },
  
  // Heavy — errors, important alerts
  heavy() {
    if ('vibrate' in navigator) navigator.vibrate([30, 10, 30]);
  },
  
  // Success pattern
  success() {
    if ('vibrate' in navigator) navigator.vibrate([15, 10, 25]);
  },
  
  // Error pattern
  error() {
    if ('vibrate' in navigator) navigator.vibrate([50, 20, 50, 20, 50]);
  },
  
  // Warning
  warning() {
    if ('vibrate' in navigator) navigator.vibrate([40, 30, 10]);
  }
};

// Usage
document.querySelector('.buy-button').addEventListener('click', () => {
  Haptics.success();
  // ... process purchase
});

document.querySelector('.delete-button').addEventListener('click', () => {
  Haptics.heavy();
  // ... confirm delete
});
```

---

## 5. Gesture Recognition

### 5.1 Native Scroll Snapping

```css
/* Horizontal scroll snapping (carousels, onboarding) */
.snap-container {
  display: flex;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  scroll-behavior: smooth;
  -webkit-overflow-scrolling: touch; /* iOS momentum scrolling */
  gap: var(--space-md);
  padding-inline: var(--space-md);
  
  /* Hide scrollbar visually */
  scrollbar-width: none;
}
.snap-container::-webkit-scrollbar { display: none; }

.snap-item {
  scroll-snap-align: start;  /* or center */
  flex-shrink: 0;
  width: clamp(280px, 80vw, 400px);
}

/* Vertical snapping (full-screen sections) */
.snap-sections {
  height: 100dvh;
  overflow-y: scroll;
  scroll-snap-type: y mandatory;
  scroll-behavior: smooth;
}

.snap-section {
  height: 100dvh;
  scroll-snap-align: start;
  scroll-snap-stop: always; /* prevent skipping sections */
}
```

### 5.2 Swipe Detection (Vanilla JS)

```javascript
class SwipeDetector {
  constructor(element, handlers = {}) {
    this.element = element;
    this.handlers = handlers;
    this.startX = 0;
    this.startY = 0;
    this.startTime = 0;
    
    this.threshold = 50;   // minimum swipe distance (px)
    this.maxTime = 300;    // maximum swipe duration (ms)
    this.maxVertical = 100; // maximum vertical drift (px)
    
    element.addEventListener('touchstart', this.onStart.bind(this), { passive: true });
    element.addEventListener('touchend', this.onEnd.bind(this), { passive: true });
  }
  
  onStart(e) {
    const touch = e.changedTouches[0];
    this.startX = touch.clientX;
    this.startY = touch.clientY;
    this.startTime = Date.now();
  }
  
  onEnd(e) {
    const touch = e.changedTouches[0];
    const dx = touch.clientX - this.startX;
    const dy = touch.clientY - this.startY;
    const dt = Date.now() - this.startTime;
    
    // Must be fast enough, long enough, and mostly horizontal
    if (dt > this.maxTime) return;
    if (Math.abs(dy) > this.maxVertical) return;
    if (Math.abs(dx) < this.threshold) return;
    
    const direction = dx > 0 ? 'right' : 'left';
    
    if (direction === 'right' && this.handlers.onSwipeRight) {
      this.handlers.onSwipeRight(e);
    } else if (direction === 'left' && this.handlers.onSwipeLeft) {
      this.handlers.onSwipeLeft(e);
    }
  }
  
  destroy() {
    this.element.removeEventListener('touchstart', this.onStart);
    this.element.removeEventListener('touchend', this.onEnd);
  }
}

// Usage
const swiper = new SwipeDetector(document.querySelector('.carousel'), {
  onSwipeLeft:  () => carousel.next(),
  onSwipeRight: () => carousel.prev(),
});
```

### 5.3 Pull-to-Refresh Implementation

```javascript
class PullToRefresh {
  constructor(container, onRefresh) {
    this.container = container;
    this.onRefresh = onRefresh;
    this.threshold = 80;
    this.startY = 0;
    this.pulling = false;
    
    this.indicator = this.createIndicator();
    container.prepend(this.indicator);
    
    container.addEventListener('touchstart', this.onStart.bind(this), { passive: true });
    container.addEventListener('touchmove', this.onMove.bind(this), { passive: false });
    container.addEventListener('touchend', this.onEnd.bind(this), { passive: true });
  }
  
  createIndicator() {
    const el = document.createElement('div');
    el.className = 'ptr-indicator';
    el.innerHTML = '<div class="ptr-spinner"></div>';
    el.style.cssText = `
      height: 0;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: height 0.2s;
    `;
    return el;
  }
  
  onStart(e) {
    if (this.container.scrollTop === 0) {
      this.startY = e.touches[0].clientY;
      this.pulling = true;
    }
  }
  
  onMove(e) {
    if (!this.pulling) return;
    const dy = e.touches[0].clientY - this.startY;
    if (dy > 0) {
      e.preventDefault();
      const resistance = dy > this.threshold ? 
        this.threshold + (dy - this.threshold) * 0.3 : dy;
      this.indicator.style.height = `${Math.min(resistance, 80)}px`;
    }
  }
  
  async onEnd() {
    if (!this.pulling) return;
    this.pulling = false;
    
    const h = parseInt(this.indicator.style.height);
    if (h >= this.threshold) {
      this.indicator.style.height = '60px';
      await this.onRefresh();
    }
    
    this.indicator.style.height = '0';
  }
}
```

---

## 6. Scroll Behavior

### 6.1 Smooth Scroll and Anchor Navigation

```css
/* Smooth scroll globally */
html { scroll-behavior: smooth; }

/* Respect reduced motion */
@media (prefers-reduced-motion: reduce) {
  html { scroll-behavior: auto; }
}

/* Offset for fixed headers */
:root { --header-height: 64px; }

html {
  scroll-padding-top: var(--header-height);
}

/* Section-specific offset */
#section {
  scroll-margin-top: var(--header-height);
}
```

### 6.2 Overscroll Behavior

```css
/* Prevent body scroll when modal/drawer is open */
body.modal-open {
  overflow: hidden;
  /* iOS fix — prevent rubber-band scrolling */
  position: fixed;
  width: 100%;
  /* Save scroll position before fixing */
  top: calc(-1 * var(--scroll-y, 0));
}

/* Contain scroll within element (don't propagate to body) */
.modal-content {
  overscroll-behavior: contain;
  overflow-y: auto;
}

/* Prevent pull-to-refresh (Chrome Android) */
body {
  overscroll-behavior-y: none;
}

/* Horizontal scroll container — prevent vertical scroll leak */
.horizontal-scroll {
  overflow-x: auto;
  overflow-y: hidden;
  overscroll-behavior-x: contain;
}
```

```javascript
// JavaScript: Save/restore scroll position when fixing body
function lockScroll() {
  const scrollY = window.scrollY;
  document.documentElement.style.setProperty('--scroll-y', `${scrollY}px`);
  document.body.classList.add('modal-open');
}

function unlockScroll() {
  const scrollY = parseInt(
    document.documentElement.style.getPropertyValue('--scroll-y') || '0'
  );
  document.body.classList.remove('modal-open');
  document.body.style.top = '';
  window.scrollTo(0, scrollY);
}
```

### 6.3 Virtual Scrolling (for Long Lists)

When rendering 1000+ items, DOM size kills performance. Virtual scrolling renders only visible items:

```javascript
class VirtualList {
  constructor(container, items, itemHeight, renderItem) {
    this.container = container;
    this.items = items;
    this.itemHeight = itemHeight;
    this.renderItem = renderItem;
    
    this.visibleCount = Math.ceil(container.clientHeight / itemHeight) + 2;
    this.bufferCount = 3; // extra items above and below viewport
    
    // Create spacer elements
    this.topSpacer = document.createElement('div');
    this.bottomSpacer = document.createElement('div');
    
    container.prepend(this.topSpacer);
    container.append(this.bottomSpacer);
    
    container.addEventListener('scroll', this.render.bind(this), { passive: true });
    this.render();
  }
  
  render() {
    const scrollTop = this.container.scrollTop;
    const startIndex = Math.max(0, 
      Math.floor(scrollTop / this.itemHeight) - this.bufferCount
    );
    const endIndex = Math.min(
      this.items.length,
      startIndex + this.visibleCount + this.bufferCount * 2
    );
    
    // Update spacers
    this.topSpacer.style.height = `${startIndex * this.itemHeight}px`;
    this.bottomSpacer.style.height = `${(this.items.length - endIndex) * this.itemHeight}px`;
    
    // Clear existing rendered items (between spacers)
    const children = [...this.container.children];
    children.slice(1, -1).forEach(c => c.remove());
    
    // Render visible items
    const fragment = document.createDocumentFragment();
    for (let i = startIndex; i < endIndex; i++) {
      fragment.appendChild(this.renderItem(this.items[i], i));
    }
    
    this.topSpacer.after(fragment);
  }
}
```

---

## 7. Mobile-Specific Interaction Patterns

### 7.1 Bottom Sheet

```css
.bottom-sheet-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  z-index: 200;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.3s var(--ease-out);
}

.bottom-sheet {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: var(--surface);
  border-radius: 24px 24px 0 0;
  padding: 0 var(--space-md) max(var(--space-md), env(safe-area-inset-bottom));
  z-index: 201;
  transform: translateY(100%);
  transition: transform 0.4s var(--ease-spring);
  max-height: 90dvh;
  overflow-y: auto;
  overscroll-behavior: contain;
  
  /* Drag handle */
  &::before {
    content: '';
    display: block;
    width: 40px;
    height: 4px;
    border-radius: 2px;
    background: var(--border);
    margin: 12px auto 20px;
  }
}

/* Open state */
.bottom-sheet-overlay.open {
  opacity: 1;
  pointer-events: all;
}

.bottom-sheet.open {
  transform: translateY(0);
}
```

### 7.2 Action Sheet (iOS-style)

```css
.action-sheet {
  position: fixed;
  bottom: 0;
  left: var(--space-sm);
  right: var(--space-sm);
  margin-bottom: max(var(--space-sm), env(safe-area-inset-bottom));
  z-index: 300;
  transform: translateY(calc(100% + 20px));
  transition: transform 0.35s var(--ease-spring);
}

.action-sheet.open {
  transform: translateY(0);
}

.action-sheet__list {
  background: var(--surface);
  border-radius: 16px;
  overflow: hidden;
  margin-bottom: 8px;
}

.action-sheet__item {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 18px;
  font-size: var(--text-lg);
  border: none;
  background: none;
  width: 100%;
  cursor: pointer;
  transition: background 0.15s;
  border-bottom: 1px solid var(--border);
  color: var(--primary);
  
  &:last-child { border-bottom: none; }
  &:active { background: var(--surface-hover); }
  &.destructive { color: var(--error); }
}

.action-sheet__cancel {
  display: block;
  width: 100%;
  padding: 18px;
  background: var(--surface);
  border-radius: 16px;
  border: none;
  font-size: var(--text-lg);
  font-weight: 600;
  color: var(--primary);
  cursor: pointer;
  
  &:active { background: var(--surface-hover); }
}
```

### 7.3 Long Press Detection

```javascript
class LongPress {
  constructor(element, callback, duration = 500) {
    this.callback = callback;
    this.duration = duration;
    this.timer = null;
    this.fired = false;
    
    element.addEventListener('touchstart', this.start.bind(this), { passive: true });
    element.addEventListener('touchend', this.clear.bind(this), { passive: true });
    element.addEventListener('touchmove', this.clear.bind(this), { passive: true });
    element.addEventListener('contextmenu', e => e.preventDefault()); // prevent native menu
  }
  
  start(e) {
    this.fired = false;
    this.timer = setTimeout(() => {
      this.fired = true;
      this.callback(e);
    }, this.duration);
  }
  
  clear() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }
}

// Usage
const longPress = new LongPress(
  document.querySelector('.list-item'),
  (e) => {
    showContextMenu(e.touches[0].clientX, e.touches[0].clientY);
    Haptics.medium();
  }
);
```

---

## 8. Accessibility for Touch Interfaces

```css
/* Focus styles that work for both keyboard and touch */
:focus-visible {
  outline: 3px solid var(--primary);
  outline-offset: 3px;
}

/* Remove focus ring for mouse/touch (only show for keyboard) */
:focus:not(:focus-visible) {
  outline: none;
}

/* Increase touch target for checkbox/radio without changing layout */
input[type="checkbox"],
input[type="radio"] {
  width: 20px;
  height: 20px;
  margin: 0;
  
  /* Expand touch area */
  position: relative;
}

input[type="checkbox"]::before,
input[type="radio"]::before {
  content: '';
  position: absolute;
  inset: -12px;
}

/* Disabled state — clear visual + no interaction */
:disabled,
[aria-disabled="true"] {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
  touch-action: none;
}
```

---

*Next: `05_IMAGES_AND_MEDIA.md` — Responsive images, lazy loading, video, and zero-CLS media.*
