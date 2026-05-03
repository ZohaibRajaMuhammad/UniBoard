# 06 — NAVIGATION & MENUS
### The Complete Deep Dive: Mobile Navigation Patterns, Hamburgers, Bottom Tabs & Drawers

---

## 1. Navigation Pattern Selection Guide

Choosing the wrong navigation pattern is the most common mobile UX mistake. Use this matrix:

| Pattern | Items | User Goal | Mental Model |
|---------|-------|-----------|-------------|
| **Bottom Tab Bar** | 3–5 | Frequent switching | App (native feel) |
| **Top Navigation** | 3–6 | Browsing, discovery | Website |
| **Hamburger Drawer** | 6+ | Secondary access | Utility |
| **Full-Screen Menu** | 3–8 | Immersive, branded | Editorial/Portfolio |
| **Mega Menu** | Many | E-commerce, complex | Directory |
| **Tabbed Content** | 3–6 | Content organization | Dashboard |

**The golden rule:** Primary actions should be visible and reachable without opening anything. Hidden navigation reduces engagement by 40%.

---

## 2. Bottom Tab Bar (The Best Mobile Pattern)

### 2.1 Complete Implementation

```html
<nav class="bottom-nav" role="navigation" aria-label="Main navigation">
  <a href="/" class="bottom-nav__item active" aria-current="page">
    <svg class="bottom-nav__icon" aria-hidden="true" viewBox="0 0 24 24">
      <path d="M3 12L12 3l9 9M5 10v9h5v-5h4v5h5v-9" 
            stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round"/>
    </svg>
    <span class="bottom-nav__label">Home</span>
  </a>
  
  <a href="/search" class="bottom-nav__item">
    <svg class="bottom-nav__icon" aria-hidden="true" viewBox="0 0 24 24">
      <circle cx="11" cy="11" r="8" stroke="currentColor" fill="none" stroke-width="2"/>
      <path d="M21 21l-4.35-4.35" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    </svg>
    <span class="bottom-nav__label">Search</span>
  </a>
  
  <!-- Center action button (FAB-style) -->
  <button class="bottom-nav__item bottom-nav__item--center" aria-label="Create new post">
    <span class="bottom-nav__center-icon" aria-hidden="true">+</span>
  </button>
  
  <a href="/notifications" class="bottom-nav__item">
    <!-- Badge example -->
    <span class="bottom-nav__icon-wrapper">
      <svg class="bottom-nav__icon" aria-hidden="true" viewBox="0 0 24 24">
        <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" 
              stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round"/>
      </svg>
      <span class="bottom-nav__badge" aria-label="3 notifications">3</span>
    </span>
    <span class="bottom-nav__label">Alerts</span>
  </a>
  
  <a href="/profile" class="bottom-nav__item">
    <img class="bottom-nav__avatar" src="avatar.jpg" alt="" aria-hidden="true">
    <span class="bottom-nav__label">Profile</span>
  </a>
</nav>

<!-- Spacer to prevent content hiding behind fixed nav -->
<div class="bottom-nav-spacer"></div>
```

```css
/* ================================================
   BOTTOM TAB BAR
   ================================================ */

.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  
  display: flex;
  align-items: stretch;
  
  /* Safe area for notched devices */
  padding-bottom: env(safe-area-inset-bottom);
  padding-left:  env(safe-area-inset-left);
  padding-right: env(safe-area-inset-right);
  
  /* Glassmorphism style */
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border-top: 1px solid rgba(0, 0, 0, 0.08);
  
  z-index: 100;
  
  /* Prevent text selection */
  user-select: none;
  -webkit-user-select: none;
}

.bottom-nav__item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  
  flex: 1;
  min-height: 56px;
  padding: 8px 4px;
  
  text-decoration: none;
  color: var(--text-muted, #6b7280);
  font-size: 10px;
  font-weight: 500;
  letter-spacing: 0.025em;
  
  border: none;
  background: none;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  
  transition: color 0.2s, transform 0.15s;
  
  /* Touch feedback */
  &:active {
    transform: scale(0.92);
  }
}

.bottom-nav__item.active,
.bottom-nav__item[aria-current="page"] {
  color: var(--primary, #2563eb);
}

.bottom-nav__icon {
  width: 24px;
  height: 24px;
  stroke-width: 1.5;
  transition: transform 0.3s var(--ease-spring, cubic-bezier(0.34, 1.56, 0.64, 1));
}

.bottom-nav__item.active .bottom-nav__icon {
  transform: scale(1.1);
  stroke-width: 2;
}

/* Active indicator pill */
.bottom-nav__item.active::before {
  content: '';
  position: absolute;
  top: 6px;
  width: 32px;
  height: 2px;
  border-radius: 1px;
  background: var(--primary, #2563eb);
}

/* Center FAB-style button */
.bottom-nav__item--center {
  position: relative;
  margin-top: -16px; /* float above bar */
}

.bottom-nav__center-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  background: var(--primary, #2563eb);
  border-radius: 50%;
  color: white;
  font-size: 28px;
  font-weight: 300;
  line-height: 1;
  box-shadow: 0 4px 16px rgba(37, 99, 235, 0.5);
  transition: transform 0.2s var(--ease-spring), box-shadow 0.2s;
}

.bottom-nav__item--center:active .bottom-nav__center-icon {
  transform: scale(0.92);
  box-shadow: 0 2px 8px rgba(37, 99, 235, 0.4);
}

/* Badge */
.bottom-nav__icon-wrapper {
  position: relative;
}

.bottom-nav__badge {
  position: absolute;
  top: -4px;
  right: -6px;
  background: var(--error, #ef4444);
  color: white;
  font-size: 9px;
  font-weight: 700;
  min-width: 16px;
  height: 16px;
  border-radius: 8px;
  padding-inline: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid var(--surface, white);
}

/* Avatar in nav */
.bottom-nav__avatar {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid transparent;
  transition: border-color 0.2s;
}

.bottom-nav__item.active .bottom-nav__avatar {
  border-color: var(--primary, #2563eb);
}

/* Spacer */
.bottom-nav-spacer {
  height: calc(56px + env(safe-area-inset-bottom));
}

/* Only show on mobile */
@media (min-width: 64em) {
  .bottom-nav { display: none; }
  .bottom-nav-spacer { display: none; }
}

/* Dark mode */
@media (prefers-color-scheme: dark) {
  .bottom-nav {
    background: rgba(15, 23, 42, 0.9);
    border-top-color: rgba(255, 255, 255, 0.08);
  }
}
```

---

## 3. Hamburger Menu + Drawer

### 3.1 Accessible Hamburger Button

```html
<button
  class="hamburger"
  id="nav-toggle"
  aria-controls="mobile-nav"
  aria-expanded="false"
  aria-label="Open navigation menu"
>
  <span class="hamburger__bar"></span>
  <span class="hamburger__bar"></span>
  <span class="hamburger__bar"></span>
</button>
```

```css
.hamburger {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  width: 44px;
  height: 44px;
  padding: 12px 10px;
  background: none;
  border: none;
  cursor: pointer;
  border-radius: 8px;
  -webkit-tap-highlight-color: transparent;
  transition: background 0.2s;
  
  &:hover { background: var(--surface-hover); }
  &:active { background: var(--surface-active); }
}

.hamburger__bar {
  display: block;
  width: 100%;
  height: 2px;
  background: currentColor;
  border-radius: 1px;
  transform-origin: center;
  transition:
    transform  0.3s cubic-bezier(0.23, 1, 0.32, 1),
    opacity    0.3s ease,
    top        0.3s ease;
}

/* Animated to X when open */
.hamburger[aria-expanded="true"] .hamburger__bar:nth-child(1) {
  transform: translateY(8px) rotate(45deg);
}
.hamburger[aria-expanded="true"] .hamburger__bar:nth-child(2) {
  opacity: 0;
  transform: scaleX(0);
}
.hamburger[aria-expanded="true"] .hamburger__bar:nth-child(3) {
  transform: translateY(-8px) rotate(-45deg);
}
```

### 3.2 Side Drawer Navigation

```html
<!-- Overlay -->
<div class="drawer-overlay" id="nav-overlay" aria-hidden="true"></div>

<!-- Drawer -->
<nav
  class="drawer"
  id="mobile-nav"
  aria-label="Main navigation"
  aria-hidden="true"
  role="dialog"
  aria-modal="true"
>
  <!-- Drawer header -->
  <div class="drawer__header">
    <a href="/" class="drawer__logo">Brand</a>
    <button class="drawer__close" aria-label="Close navigation" id="nav-close">
      <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
        <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>
    </button>
  </div>
  
  <!-- Navigation links -->
  <ul class="drawer__nav" role="list">
    <li><a href="/" class="drawer__link active">Home</a></li>
    <li>
      <!-- Expandable section -->
      <button class="drawer__link drawer__link--expand" aria-expanded="false">
        Products
        <svg class="drawer__chevron" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
          <path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
      </button>
      <ul class="drawer__subnav" role="list" aria-hidden="true">
        <li><a href="/products/a" class="drawer__sublink">Product A</a></li>
        <li><a href="/products/b" class="drawer__sublink">Product B</a></li>
      </ul>
    </li>
    <li><a href="/about" class="drawer__link">About</a></li>
    <li><a href="/blog" class="drawer__link">Blog</a></li>
    <li><a href="/contact" class="drawer__link">Contact</a></li>
  </ul>
  
  <!-- Drawer footer (CTA) -->
  <div class="drawer__footer">
    <a href="/signup" class="btn btn--primary btn--full">Get Started</a>
    <a href="/login" class="btn btn--ghost btn--full">Sign In</a>
  </div>
</nav>
```

```css
/* ================================================
   DRAWER NAVIGATION
   ================================================ */

.drawer-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  z-index: 199;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.3s;
}

.drawer-overlay.open {
  opacity: 1;
  pointer-events: all;
}

.drawer {
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  width: min(320px, 85vw);
  
  background: var(--surface, white);
  z-index: 200;
  
  display: flex;
  flex-direction: column;
  
  /* Safe areas */
  padding-top: env(safe-area-inset-top);
  padding-left: env(safe-area-inset-left);
  padding-bottom: max(var(--space-md), env(safe-area-inset-bottom));
  
  /* Slide in from left */
  transform: translateX(-100%);
  transition: transform 0.35s cubic-bezier(0.32, 0.72, 0, 1);
  
  /* Shadow */
  box-shadow: 8px 0 32px rgba(0, 0, 0, 0.2);
  
  /* Scroll if content overflows */
  overflow-y: auto;
  overscroll-behavior: contain;
}

.drawer.open {
  transform: translateX(0);
}

.drawer__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-md) var(--space-md) var(--space-sm);
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}

.drawer__close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border: none;
  background: none;
  border-radius: 8px;
  cursor: pointer;
  color: var(--text);
  -webkit-tap-highlight-color: transparent;
  
  &:active { background: var(--surface-hover); }
}

.drawer__nav {
  list-style: none;
  padding: var(--space-sm) 0;
  flex: 1;
  overflow-y: auto;
}

.drawer__link {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: 14px var(--space-md);
  color: var(--text);
  text-decoration: none;
  font-size: var(--text-base);
  font-weight: 500;
  border: none;
  background: none;
  width: 100%;
  cursor: pointer;
  border-left: 3px solid transparent;
  transition: background 0.15s, color 0.15s, border-color 0.15s;
  
  -webkit-tap-highlight-color: transparent;
  
  &:active,
  &:hover { background: var(--surface-hover); }
  
  &.active {
    color: var(--primary);
    border-left-color: var(--primary);
    background: var(--primary-alpha-10, rgba(37,99,235,0.08));
  }
}

.drawer__link--expand {
  justify-content: space-between;
}

.drawer__chevron {
  flex-shrink: 0;
  transition: transform 0.25s;
}

.drawer__link--expand[aria-expanded="true"] .drawer__chevron {
  transform: rotate(180deg);
}

.drawer__subnav {
  list-style: none;
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.3s ease;
}

.drawer__subnav.open {
  max-height: 400px; /* larger than any realistic content */
}

.drawer__sublink {
  display: block;
  padding: 12px var(--space-md) 12px calc(var(--space-md) + 16px);
  color: var(--text-muted);
  text-decoration: none;
  font-size: var(--text-sm);
  transition: color 0.15s, background 0.15s;
  
  &:hover, &:active { 
    background: var(--surface-hover);
    color: var(--text);
  }
}

.drawer__footer {
  padding: var(--space-md);
  border-top: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
  flex-shrink: 0;
}
```

```javascript
/* ================================================
   DRAWER JAVASCRIPT
   ================================================ */

class DrawerNav {
  constructor() {
    this.toggle = document.getElementById('nav-toggle');
    this.drawer = document.getElementById('mobile-nav');
    this.overlay = document.getElementById('nav-overlay');
    this.close = document.getElementById('nav-close');
    
    this.toggle.addEventListener('click', () => this.open());
    this.close.addEventListener('click', () => this.close_());
    this.overlay.addEventListener('click', () => this.close_());
    
    // Close on escape key
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && this.isOpen) this.close_();
    });
    
    // Expandable sections
    document.querySelectorAll('.drawer__link--expand').forEach(btn => {
      btn.addEventListener('click', () => this.toggleSection(btn));
    });
    
    // Swipe to close
    let startX = 0;
    this.drawer.addEventListener('touchstart', e => {
      startX = e.touches[0].clientX;
    }, { passive: true });
    
    this.drawer.addEventListener('touchend', e => {
      const dx = e.changedTouches[0].clientX - startX;
      if (dx < -50) this.close_(); // swipe left to close
    }, { passive: true });
    
    this.isOpen = false;
  }
  
  open() {
    this.isOpen = true;
    this.drawer.classList.add('open');
    this.overlay.classList.add('open');
    this.drawer.removeAttribute('aria-hidden');
    this.toggle.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
    
    // Focus first link
    this.drawer.querySelector('a, button')?.focus();
  }
  
  close_() {
    this.isOpen = false;
    this.drawer.classList.remove('open');
    this.overlay.classList.remove('open');
    this.drawer.setAttribute('aria-hidden', 'true');
    this.toggle.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
    this.toggle.focus();
  }
  
  toggleSection(btn) {
    const isExpanded = btn.getAttribute('aria-expanded') === 'true';
    const subnav = btn.nextElementSibling;
    
    btn.setAttribute('aria-expanded', String(!isExpanded));
    subnav.setAttribute('aria-hidden', String(isExpanded));
    subnav.classList.toggle('open', !isExpanded);
  }
}

const nav = new DrawerNav();
```

---

## 4. Top Navigation Bar

```html
<header class="top-nav">
  <div class="top-nav__inner container">
    <!-- Logo -->
    <a href="/" class="top-nav__logo" aria-label="Brand — Home">
      <img src="logo.svg" alt="Brand" width="120" height="36">
    </a>
    
    <!-- Desktop navigation links -->
    <nav class="top-nav__links" aria-label="Primary navigation">
      <a href="/" class="top-nav__link active">Home</a>
      <a href="/products" class="top-nav__link">Products</a>
      <a href="/about" class="top-nav__link">About</a>
      <a href="/blog" class="top-nav__link">Blog</a>
    </nav>
    
    <!-- Actions -->
    <div class="top-nav__actions">
      <a href="/login" class="btn btn--ghost btn--sm">Sign In</a>
      <a href="/signup" class="btn btn--primary btn--sm">Get Started</a>
      
      <!-- Mobile hamburger -->
      <button class="hamburger" id="nav-toggle" aria-label="Open menu" aria-expanded="false">
        <span class="hamburger__bar"></span>
        <span class="hamburger__bar"></span>
        <span class="hamburger__bar"></span>
      </button>
    </div>
  </div>
</header>
```

```css
.top-nav {
  position: sticky;
  top: 0;
  z-index: 100;
  
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  
  /* Account for notched devices */
  padding-top: env(safe-area-inset-top);
}

.top-nav__inner {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  height: 64px;
}

.top-nav__logo {
  flex-shrink: 0;
  text-decoration: none;
}

.top-nav__links {
  display: none; /* Hidden on mobile */
  align-items: center;
  gap: var(--space-xs);
  flex: 1;
  justify-content: center;
  
  @media (min-width: 64em) {
    display: flex;
  }
}

.top-nav__link {
  padding: 8px 14px;
  color: var(--text-secondary);
  text-decoration: none;
  font-size: var(--text-sm);
  font-weight: 500;
  border-radius: 8px;
  transition: color 0.2s, background 0.2s;
  
  &:hover { 
    background: var(--surface-hover);
    color: var(--text); 
  }
  
  &.active {
    color: var(--primary);
    background: var(--primary-alpha-10);
  }
}

.top-nav__actions {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  margin-inline-start: auto;
}

/* Hide desktop CTAs on mobile */
@media (max-width: 63.9375em) {
  .top-nav__actions .btn {
    display: none;
  }
}

/* Hide hamburger on desktop */
@media (min-width: 64em) {
  .hamburger {
    display: none;
  }
}
```

---

## 5. Tab Bar (Horizontal Scrolling Tabs)

```html
<div class="tabs" role="tablist" aria-label="Content sections">
  <button role="tab" class="tab active" aria-selected="true" aria-controls="panel-1">All</button>
  <button role="tab" class="tab" aria-selected="false" aria-controls="panel-2">Design</button>
  <button role="tab" class="tab" aria-selected="false" aria-controls="panel-3">Development</button>
  <button role="tab" class="tab" aria-selected="false" aria-controls="panel-4">Marketing</button>
  <button role="tab" class="tab" aria-selected="false" aria-controls="panel-5">Business</button>
</div>
```

```css
.tabs {
  display: flex;
  overflow-x: auto;
  overflow-y: hidden;
  scrollbar-width: none;
  scroll-snap-type: x mandatory;
  scroll-behavior: smooth;
  
  /* Edge fade to hint at more content */
  -webkit-mask-image: linear-gradient(
    to right, 
    transparent 0%, 
    black 5%, 
    black 95%, 
    transparent 100%
  );
  mask-image: linear-gradient(
    to right,
    transparent 0%,
    black 5%,
    black 95%,
    transparent 100%
  );
  
  border-bottom: 2px solid var(--border);
  gap: var(--space-xs);
  padding-inline: var(--space-md);
}

.tabs::-webkit-scrollbar { display: none; }

.tab {
  flex-shrink: 0;
  scroll-snap-align: start;
  
  padding: 12px 16px;
  background: none;
  border: none;
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--text-muted);
  cursor: pointer;
  white-space: nowrap;
  
  position: relative;
  transition: color 0.2s;
  -webkit-tap-highlight-color: transparent;
  
  &::after {
    content: '';
    position: absolute;
    bottom: -2px;
    left: 0;
    right: 0;
    height: 2px;
    background: var(--primary);
    transform: scaleX(0);
    transition: transform 0.25s var(--ease-spring);
    border-radius: 1px 1px 0 0;
  }
  
  &[aria-selected="true"] {
    color: var(--primary);
    
    &::after {
      transform: scaleX(1);
    }
  }
  
  &:active { opacity: 0.7; }
}
```

---

## 6. Breadcrumbs (Mobile-Aware)

```html
<nav aria-label="Breadcrumb">
  <ol class="breadcrumb">
    <li class="breadcrumb__item">
      <a href="/" class="breadcrumb__link">Home</a>
    </li>
    <li class="breadcrumb__item">
      <a href="/products" class="breadcrumb__link">Products</a>
    </li>
    <li class="breadcrumb__item" aria-current="page">
      <span class="breadcrumb__current">iPhone Case</span>
    </li>
  </ol>
</nav>
```

```css
.breadcrumb {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px;
  list-style: none;
  font-size: var(--text-sm);
  
  /* Scroll horizontally on mobile instead of wrapping */
  @media (max-width: 48em) {
    flex-wrap: nowrap;
    overflow-x: auto;
    scrollbar-width: none;
  }
}

.breadcrumb__item {
  display: flex;
  align-items: center;
  gap: 4px;
  white-space: nowrap;
  
  /* Separator */
  &:not(:last-child)::after {
    content: '/';
    color: var(--text-muted);
  }
  
  /* On mobile: collapse middle items */
  @media (max-width: 30em) {
    &:not(:first-child):not(:last-child):not(:nth-last-child(2)) {
      display: none;
    }
    
    /* Show ellipsis instead */
    &:nth-last-child(3)::before {
      content: '…';
      color: var(--text-muted);
    }
  }
}

.breadcrumb__link {
  color: var(--text-muted);
  text-decoration: none;
  padding: 4px 0;
  
  &:hover { color: var(--primary); text-decoration: underline; }
}

.breadcrumb__current {
  color: var(--text);
  font-weight: 500;
}
```

---

*Next: `07_FORMS_AND_INPUTS.md` — Mobile keyboards, input types, validation UX, autofill.*
