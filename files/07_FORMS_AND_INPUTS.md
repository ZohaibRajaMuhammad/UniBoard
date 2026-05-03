# 07 — FORMS & INPUTS
### The Complete Deep Dive: Mobile Keyboards, Input Types, Validation UX & Autofill

---

## 1. Why Mobile Forms Are Different

Mobile form failures cause the highest abandonment rates of any UI pattern. The pain points:

- **Wrong keyboard appears** — user has to switch keyboard to enter data
- **iOS zooms in on focus** — if font-size < 16px
- **Labels disappear** — placeholder-only labels cause confusion on fill
- **Errors show too late** — user fills entire form then sees all errors
- **Tap targets too small** — users tap wrong field, get frustrated
- **Autocorrect ruins inputs** — names, emails, passwords get "corrected"

Every issue is solvable with correct HTML attributes.

---

## 2. The Mobile Keyboard System

### 2.1 Input Type → Keyboard Mapping

| `type` | Keyboard on Mobile | Use For |
|--------|-------------------|---------|
| `text` | Standard QWERTY | Names, generic text |
| `email` | QWERTY + @ and .com | Email addresses |
| `tel` | Numeric keypad | Phone numbers |
| `number` | Numeric | Quantities, amounts |
| `search` | QWERTY + search button | Search queries |
| `url` | QWERTY + / and .com | Website URLs |
| `password` | QWERTY + toggle | Passwords |
| `date` | Date picker | Dates |
| `time` | Time picker | Times |
| `month` | Month/Year picker | Credit card expiry |

### 2.2 `inputmode` — The Keyboard Specialist

`inputmode` controls the keyboard **without changing validation behavior**:

| `inputmode` | Keyboard | Best For |
|-------------|---------|---------|
| `text` | Standard QWERTY | Default |
| `numeric` | Pure digits 0–9 | PINs, codes |
| `decimal` | Digits + decimal point | Prices, measurements |
| `tel` | Phone number pad | Card numbers, phone |
| `email` | Email-optimized | Email |
| `url` | URL-optimized | URLs |
| `search` | Search with go key | Search |
| `none` | No keyboard | Custom pickers |

```html
<!-- Credit card number: shows numeric keypad, allows any text -->
<input 
  type="text" 
  inputmode="numeric" 
  pattern="[0-9\s]{13,19}"
  autocomplete="cc-number"
  placeholder="1234 5678 9012 3456"
>

<!-- ZIP code: numeric pad, allows letters for non-US -->
<input 
  type="text"
  inputmode="numeric"
  autocomplete="postal-code"
  pattern="[0-9]{5}(-[0-9]{4})?"
>

<!-- Price: shows decimal keyboard -->
<input
  type="text"
  inputmode="decimal"
  pattern="[0-9]*\.?[0-9]{0,2}"
  placeholder="0.00"
>

<!-- OTP/PIN: pure numeric -->
<input
  type="text"
  inputmode="numeric"
  pattern="[0-9]*"
  maxlength="6"
  autocomplete="one-time-code"
>
```

### 2.3 Prevent Autocorrect / Autocapitalize

```html
<!-- Name fields -->
<input type="text" 
  autocomplete="given-name"
  autocapitalize="words"    <!-- capitalize each word -->
  autocorrect="off"         <!-- don't autocorrect names -->
  spellcheck="false"
>

<!-- Username: no correction -->
<input type="text"
  autocomplete="username"
  autocapitalize="none"     <!-- no auto-capitalization -->
  autocorrect="off"
  spellcheck="false"
>

<!-- Search: correction helpful -->
<input type="search"
  autocapitalize="none"     <!-- but no auto-capitalize -->
  autocorrect="on"
  spellcheck="true"
>

<!-- Password: no correction ever -->
<input type="password"
  autocomplete="current-password"
  autocapitalize="none"
  autocorrect="off"
  spellcheck="false"
>

<!-- Code / API key -->
<input type="text"
  autocomplete="off"
  autocapitalize="none"
  autocorrect="off"
  spellcheck="false"
  data-lpignore="true"      <!-- ignore LastPass -->
  data-form-type="other"    <!-- ignore Dashlane -->
>
```

---

## 3. The Autofill System (Complete)

Correct `autocomplete` values are critical for:
1. Browser autofill (one-tap form fill)
2. Password manager integration
3. iOS QuickType suggestions

```html
<!-- Complete checkout form with full autocomplete -->
<form autocomplete="on">
  <!-- Personal info -->
  <input autocomplete="name">
  <input autocomplete="given-name">
  <input autocomplete="family-name">
  <input autocomplete="email">
  <input autocomplete="tel">
  
  <!-- Address -->
  <input autocomplete="street-address">
  <input autocomplete="address-line1">
  <input autocomplete="address-line2">
  <input autocomplete="address-level2">  <!-- city -->
  <input autocomplete="address-level1">  <!-- state/province -->
  <input autocomplete="postal-code">
  <input autocomplete="country">
  
  <!-- Payment -->
  <input autocomplete="cc-name">
  <input autocomplete="cc-number">
  <input autocomplete="cc-exp">         <!-- combined MM/YY -->
  <input autocomplete="cc-exp-month">   <!-- separate month -->
  <input autocomplete="cc-exp-year">    <!-- separate year -->
  <input autocomplete="cc-csc">         <!-- CVV -->
  
  <!-- Auth -->
  <input autocomplete="username">
  <input autocomplete="current-password" type="password">
  <input autocomplete="new-password" type="password">
  <input autocomplete="one-time-code">  <!-- OTP -->
</form>
```

---

## 4. The Complete Mobile Form System

### 4.1 CSS Foundation

```css
/* ================================================
   MOBILE FORM SYSTEM
   ================================================ */

/* Reset all inputs */
input,
select,
textarea {
  /* Critical: prevents iOS zoom on focus */
  font-size: max(16px, 1rem);
  font-family: inherit;
  color: inherit;
  
  /* Remove browser defaults */
  -webkit-appearance: none;
  appearance: none;
  
  /* Box model */
  box-sizing: border-box;
  margin: 0;
}

/* ---- FORM GROUP ---- */
.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
  position: relative;
}

/* ---- LABEL ---- */
.form-label {
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--text-secondary, #374151);
  line-height: 1.4;
}

.form-label .required {
  color: var(--error, #ef4444);
  margin-inline-start: 2px;
}

/* ---- INPUT BASE ---- */
.form-input,
.form-select,
.form-textarea {
  width: 100%;
  padding: 14px 16px;
  font-size: max(16px, 1rem); /* prevents iOS zoom */
  line-height: 1.5;
  
  background: var(--surface, white);
  border: 2px solid var(--border, #e5e7eb);
  border-radius: 12px;
  
  color: var(--text, #111827);
  transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
  
  /* Remove tap highlight */
  -webkit-tap-highlight-color: transparent;
  
  &::placeholder {
    color: var(--text-placeholder, #9ca3af);
  }
  
  /* Focus state */
  &:focus {
    outline: none;
    border-color: var(--primary, #2563eb);
    box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.12);
    background: var(--surface-focus, white);
  }
  
  /* Error state */
  &.error,
  &[aria-invalid="true"] {
    border-color: var(--error, #ef4444);
    background: var(--error-bg, #fef2f2);
    
    &:focus {
      box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.12);
    }
  }
  
  /* Success state */
  &.success,
  &[aria-invalid="false"] {
    border-color: var(--success, #10b981);
    
    &:focus {
      box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.12);
    }
  }
  
  /* Disabled state */
  &:disabled {
    background: var(--surface-muted, #f9fafb);
    color: var(--text-muted, #6b7280);
    cursor: not-allowed;
    opacity: 0.7;
  }
  
  /* Read only */
  &:read-only {
    background: var(--surface-muted, #f9fafb);
    cursor: default;
  }
}

/* ---- SELECT ---- */
.form-select-wrapper {
  position: relative;
}

.form-select-wrapper::after {
  content: '';
  position: absolute;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
  width: 0;
  height: 0;
  border-left: 5px solid transparent;
  border-right: 5px solid transparent;
  border-top: 6px solid var(--text-muted, #6b7280);
  pointer-events: none;
}

.form-select {
  padding-right: 44px; /* space for custom arrow */
  cursor: pointer;
  background-image: none; /* remove default arrow */
}

/* ---- TEXTAREA ---- */
.form-textarea {
  resize: vertical;
  min-height: 120px;
  line-height: 1.6;
}

/* ---- HELPER TEXT ---- */
.form-helper {
  font-size: var(--text-xs);
  color: var(--text-muted, #6b7280);
  line-height: 1.4;
}

.form-error {
  font-size: var(--text-xs);
  color: var(--error, #ef4444);
  font-weight: 500;
  line-height: 1.4;
  display: flex;
  align-items: center;
  gap: 4px;
  
  &::before {
    content: '⚠';
    font-size: 10px;
  }
}
```

### 4.2 Floating Label Input

```css
/* Floating label pattern */
.floating-group {
  position: relative;
}

.floating-input {
  width: 100%;
  padding: 22px 16px 10px; /* extra top padding for label */
  font-size: max(16px, 1rem);
  border: 2px solid var(--border);
  border-radius: 12px;
  background: var(--surface);
  transition: border-color 0.2s, box-shadow 0.2s;
  
  &:focus { 
    outline: none;
    border-color: var(--primary);
    box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.12);
  }
}

.floating-label {
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  font-size: max(16px, 1rem);
  color: var(--text-placeholder);
  pointer-events: none;
  transition: 
    top 0.2s,
    font-size 0.2s,
    color 0.2s,
    transform 0.2s;
  transform-origin: left top;
}

/* Float label when: focused or has value */
.floating-input:focus ~ .floating-label,
.floating-input:not(:placeholder-shown) ~ .floating-label {
  top: 12px;
  transform: translateY(0) scale(0.75);
  color: var(--primary);
}

.floating-input:not(:focus):not(:placeholder-shown) ~ .floating-label {
  color: var(--text-secondary);
}

/* Placeholder must be empty but present for :placeholder-shown */
/* <input placeholder=" "> */
```

---

## 5. Validation UX Patterns

### 5.1 Progressive Validation

The UX principle: **validate on blur, show errors inline, clear errors on fix**.

```javascript
class FormValidator {
  constructor(form) {
    this.form = form;
    this.validators = new Map();
    this.touched = new Set();
    
    // Validate on blur (not on every keystroke)
    form.addEventListener('blur', e => {
      if (e.target.matches('input, select, textarea')) {
        this.touched.add(e.target);
        this.validateField(e.target);
      }
    }, true);
    
    // Clear error while typing in touched field
    form.addEventListener('input', e => {
      if (this.touched.has(e.target)) {
        this.validateField(e.target, { silent: true });
      }
    });
    
    // Validate all on submit
    form.addEventListener('submit', e => {
      e.preventDefault();
      const isValid = this.validateAll();
      if (isValid) this.onSuccess(new FormData(form));
    });
  }
  
  addRule(fieldName, rules) {
    this.validators.set(fieldName, rules);
    return this;
  }
  
  validateField(field, { silent = false } = {}) {
    const rules = this.validators.get(field.name);
    if (!rules) return true;
    
    let error = null;
    for (const [rule, config] of Object.entries(rules)) {
      error = this.checkRule(field.value, rule, config);
      if (error) break;
    }
    
    if (!silent) {
      error ? this.showError(field, error) : this.showSuccess(field);
    } else {
      if (!error) this.clearError(field);
    }
    
    return !error;
  }
  
  validateAll() {
    let isValid = true;
    this.form.querySelectorAll('input, select, textarea').forEach(field => {
      this.touched.add(field);
      if (!this.validateField(field)) {
        isValid = false;
      }
    });
    
    // Focus first error
    if (!isValid) {
      this.form.querySelector('[aria-invalid="true"]')?.focus();
    }
    
    return isValid;
  }
  
  checkRule(value, rule, config) {
    switch (rule) {
      case 'required':
        return !value.trim() ? config.message || 'This field is required' : null;
      
      case 'email':
        return !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
          ? config.message || 'Please enter a valid email address'
          : null;
      
      case 'minLength':
        return value.length < config.value
          ? config.message || `Must be at least ${config.value} characters`
          : null;
      
      case 'maxLength':
        return value.length > config.value
          ? config.message || `Must be no more than ${config.value} characters`
          : null;
      
      case 'pattern':
        return !config.regex.test(value)
          ? config.message || 'Invalid format'
          : null;
      
      case 'match':
        const matchField = this.form.querySelector(`[name="${config.field}"]`);
        return matchField && value !== matchField.value
          ? config.message || 'Fields do not match'
          : null;
        
      default:
        return null;
    }
  }
  
  showError(field, message) {
    field.setAttribute('aria-invalid', 'true');
    field.classList.add('error');
    field.classList.remove('success');
    
    const errorId = `${field.id || field.name}-error`;
    field.setAttribute('aria-describedby', errorId);
    
    let errorEl = document.getElementById(errorId);
    if (!errorEl) {
      errorEl = document.createElement('p');
      errorEl.id = errorId;
      errorEl.className = 'form-error';
      errorEl.setAttribute('role', 'alert');
      field.closest('.form-group')?.appendChild(errorEl);
    }
    
    errorEl.textContent = message;
  }
  
  showSuccess(field) {
    field.setAttribute('aria-invalid', 'false');
    field.classList.remove('error');
    field.classList.add('success');
    this.clearError(field);
  }
  
  clearError(field) {
    const errorId = `${field.id || field.name}-error`;
    document.getElementById(errorId)?.remove();
    if (!field.classList.contains('error')) {
      field.removeAttribute('aria-invalid');
    }
  }
  
  onSuccess(data) {
    // Override this method
    console.log('Form submitted:', Object.fromEntries(data));
  }
}

// Usage
const validator = new FormValidator(document.getElementById('signup-form'));

validator
  .addRule('email', {
    required: { message: 'Email is required' },
    email:    { message: 'Please enter a valid email' }
  })
  .addRule('password', {
    required:  { message: 'Password is required' },
    minLength: { value: 8, message: 'Password must be at least 8 characters' },
    pattern:   { 
      regex: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      message: 'Must include uppercase, lowercase, and a number'
    }
  })
  .addRule('confirm_password', {
    required: { message: 'Please confirm your password' },
    match:    { field: 'password', message: 'Passwords do not match' }
  });
```

### 5.2 Password Strength Meter

```html
<div class="form-group">
  <label class="form-label" for="password">Password</label>
  <div class="password-wrapper">
    <input
      type="password"
      id="password"
      name="password"
      class="form-input"
      autocomplete="new-password"
      aria-describedby="password-strength"
    >
    <button type="button" class="password-toggle" aria-label="Show password">
      <!-- Eye icon -->
    </button>
  </div>
  
  <div class="strength-meter" id="password-strength" aria-live="polite">
    <div class="strength-bar">
      <div class="strength-fill" data-strength="0"></div>
    </div>
    <span class="strength-label">Enter a password</span>
  </div>
</div>
```

```css
.password-wrapper {
  position: relative;
}

.password-toggle {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  width: 36px;
  height: 36px;
  border: none;
  background: none;
  cursor: pointer;
  color: var(--text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  
  &:hover { color: var(--text); }
}

.strength-bar {
  height: 4px;
  background: var(--border);
  border-radius: 2px;
  overflow: hidden;
}

.strength-fill {
  height: 100%;
  border-radius: 2px;
  transition: width 0.4s var(--ease-smooth), background 0.4s;
  
  &[data-strength="0"] { width: 0; }
  &[data-strength="1"] { width: 25%; background: var(--error, #ef4444); }
  &[data-strength="2"] { width: 50%; background: #f59e0b; }
  &[data-strength="3"] { width: 75%; background: #3b82f6; }
  &[data-strength="4"] { width: 100%; background: var(--success, #10b981); }
}

.strength-label {
  font-size: var(--text-xs);
  color: var(--text-muted);
}
```

---

## 6. Specialized Mobile Input Patterns

### 6.1 OTP / PIN Input

```html
<div class="otp-group" role="group" aria-label="One-time password">
  <input class="otp-input" type="text" inputmode="numeric" maxlength="1" 
         pattern="[0-9]" autocomplete="one-time-code" aria-label="Digit 1">
  <input class="otp-input" type="text" inputmode="numeric" maxlength="1"
         pattern="[0-9]" aria-label="Digit 2">
  <input class="otp-input" type="text" inputmode="numeric" maxlength="1"
         pattern="[0-9]" aria-label="Digit 3">
  <span class="otp-separator">—</span>
  <input class="otp-input" type="text" inputmode="numeric" maxlength="1"
         pattern="[0-9]" aria-label="Digit 4">
  <input class="otp-input" type="text" inputmode="numeric" maxlength="1"
         pattern="[0-9]" aria-label="Digit 5">
  <input class="otp-input" type="text" inputmode="numeric" maxlength="1"
         pattern="[0-9]" aria-label="Digit 6">
</div>
```

```css
.otp-group {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  justify-content: center;
}

.otp-input {
  width: 52px;
  height: 60px;
  font-size: 1.5rem;
  font-weight: 700;
  text-align: center;
  border: 2px solid var(--border);
  border-radius: 12px;
  background: var(--surface);
  caret-color: var(--primary);
  transition: border-color 0.2s, box-shadow 0.2s;
  
  &:focus {
    border-color: var(--primary);
    box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.12);
    outline: none;
  }
  
  &.filled {
    border-color: var(--primary);
    background: var(--primary-alpha-05);
  }
}
```

```javascript
// Auto-advance OTP inputs
document.querySelectorAll('.otp-input').forEach((input, index, inputs) => {
  input.addEventListener('input', e => {
    const value = e.target.value.replace(/\D/g, '').slice(-1);
    e.target.value = value;
    
    if (value) {
      input.classList.add('filled');
      inputs[index + 1]?.focus();
    }
  });
  
  input.addEventListener('keydown', e => {
    if (e.key === 'Backspace' && !input.value) {
      inputs[index - 1]?.focus();
    }
  });
  
  // Handle paste
  input.addEventListener('paste', e => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '');
    if (pasted.length >= inputs.length) {
      e.preventDefault();
      [...pasted].slice(0, inputs.length).forEach((char, i) => {
        inputs[i].value = char;
        inputs[i].classList.add('filled');
      });
      inputs[inputs.length - 1]?.focus();
    }
  });
});
```

---

## 7. Mobile Form Layout Patterns

### 7.1 Full Form Layout

```css
/* Complete form layout */
.form {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

/* Side-by-side on tablet+ */
.form-row {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-md);
  
  @media (min-width: 30em) {
    grid-template-columns: 1fr 1fr;
  }
}

/* Full-width item in a form-row */
.form-row .form-group--full {
  grid-column: 1 / -1;
}

/* Divider */
.form-divider {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  color: var(--text-muted);
  font-size: var(--text-sm);
  
  &::before, &::after {
    content: '';
    flex: 1;
    height: 1px;
    background: var(--border);
  }
}

/* Submit area */
.form-actions {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  margin-top: var(--space-sm);
  
  @media (min-width: 30em) {
    flex-direction: row-reverse;
  }
}
```

---

*Next: `08_PERFORMANCE_AND_CORE_WEB_VITALS.md` — LCP, CLS, INP, CSS containment, and production optimization.*
