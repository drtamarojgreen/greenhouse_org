# Frontend Coding Guidelines for Cross-Browser Compatibility

## 1. Introduction

This document provides a set of coding guidelines and best practices for all frontend development at Greenhouse for Mental Health. The purpose of these guidelines is to ensure that our web applications provide a consistent, high-quality, and performant user experience across all supported browsers. Adhering to these practices will help us proactively prevent cross-browser compatibility issues.

## 2. General Principles

- **Test Continuously**: Test your changes on the latest versions of Chrome, Firefox, and Safari during development. Do not wait until the end of a project to check for browser-specific bugs.
- **Prioritize Graceful Degradation**: Modern features are encouraged, but they must degrade gracefully. If a feature is not supported in a browser, it should not break the page layout or prevent the user from completing their task. Always provide a fallback.
- **Write Maintainable Code**: Avoid overly complex or brittle code. Write simple, readable code that is easy for other developers to understand and maintain.

## 3. CSS Guidelines

### 3.1. Provide Vendor Prefixes and Fallbacks for Modern Properties

When using modern CSS features that are not universally supported, you must provide vendor prefixes for key browsers (especially Safari) and a sensible fallback for browsers where the feature is unsupported.

**Example: `backdrop-filter`**
```css
/* WRONG */
.my-element {
    backdrop-filter: blur(10px);
}

/* RIGHT */
.my-element {
    /* 1. Provide a fallback for browsers that don't support the filter. */
    background-color: rgba(255, 255, 255, 0.5);

    /* 2. Add the -webkit- prefix for Safari. */
    -webkit-backdrop-filter: blur(10px);
    backdrop-filter: blur(10px);
}
```

### 3.2. Ensure Correct Property Order for Fallbacks

When using advanced techniques like `background-clip: text`, the order of properties is critical for the fallback to work correctly. The basic `color` property must be defined *before* the `background-clip` rules.

**Example: `background-clip: text`**
```css
/* WRONG - The solid color will always override the gradient. */
.gradient-text {
    background: linear-gradient(90deg, #357438, #9400FF);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    color: #357438; /* This overrides the effect */
}

/* RIGHT */
.gradient-text {
    /* 1. The fallback color is defined first. */
    color: #357438;

    /* 2. The gradient and clipping properties will override the color
          only in browsers that support them. */
    background: linear-gradient(90deg, #357438, #9400FF);
    -webkit-background-clip: text;
    background-clip: text; /* Include the unprefixed version too */
    -webkit-text-fill-color: transparent;
}
```

### 3.3. Avoid Overly Specific Selectors

Avoid using extremely long, auto-generated CSS selectors (e.g., from a visual editor). They are brittle and can easily break. Prefer simple, reusable class-based selectors.

- **Prefer**: `.appointment-button`
- **Avoid**: `body #SITE_CONTAINER #masterPage div #comp-1234 button`

## 4. JavaScript Guidelines

### 4.1. Use `requestAnimationFrame` for High-Frequency DOM Updates

Do not update element styles or positions directly inside high-frequency event listeners like `mousemove` or `scroll`. This causes performance issues. Instead, store the latest values (e.g., mouse coordinates) in a variable and update the DOM within a `requestAnimationFrame` loop.

**Example: `mousemove`**
```javascript
// WRONG - Causes stuttering animation
window.addEventListener('mousemove', (e) => {
    myElement.style.left = `${e.clientX}px`;
});

// RIGHT - Smooth animation
let latestX = 0;
window.addEventListener('mousemove', (e) => {
    latestX = e.clientX; // Just store the value
});

function updatePosition() {
    myElement.style.left = `${latestX}px`; // Update DOM in animation frame
    requestAnimationFrame(updatePosition);
}
requestAnimationFrame(updatePosition); // Start the loop
```

### 4.2. Use `animationend` or `transitionend` for Cleanup

When you need to run JavaScript after a CSS animation or transition completes, do not use `setTimeout` with a hardcoded duration. This is brittle. Instead, listen for the `animationend` or `transitionend` events on the element.

**Example: Cleaning up a temporary element**
```javascript
// WRONG - Breaks if CSS animation duration changes
myElement.classList.add('fade-out-animation');
setTimeout(() => {
    myElement.remove();
}, 500); // 500ms is a magic number

// RIGHT - Always works, regardless of CSS timing
myElement.classList.add('fade-out-animation');
myElement.addEventListener('animationend', () => {
    myElement.remove();
}, { once: true }); // Use { once: true } to auto-cleanup the listener
```
