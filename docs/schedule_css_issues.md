# Comprehensive CSS Analysis and Recommendations for /schedule/

This document provides a consolidated summary of three different CSS analysis reports for the `/schedule/` page, along with specific recommendations for refactoring `docs/css/schedule.css`.

## Report 1: W3C CSS Validation Summary

A W3C CSS validation check was performed against CSS level 3 + SVG, resulting in **91 errors** and **1200 warnings**.

### Key Findings
- **False Positives from Modern/Experimental Features:** The majority of errors and warnings are not critical bugs but are due to the validator's inability to parse modern CSS features. This includes:
    - **Experimental APIs:** The View Transitions API (`@view-transition`, `::view-transition`, etc.) is not recognized.
    - **CSS Custom Properties (Variables):** The validator cannot statically check the validity of `var()` outputs, leading to hundreds of warnings.
    - **Newer CSS Modules:** Properties like `container-type` and units like `1cqw` from the Container Queries spec are flagged as unknown.
- **Legitimate Issues to Investigate:**
    - **Invalid `mix-blend-mode` value:** `plus-lighter` is not a standard value.
    - **Vendor Prefixes and Deprecated Properties:** While expected, the high number of vendor-prefixed properties and deprecated properties like `clip` suggests a need for better CSS post-processing and modernization.

---

## Report 2: Project Wallace CSS Code Quality Summary

This report provides an opinionated score on the overall quality of the CSS, focusing on maintainability, complexity, and performance.

- **Maintainability Score:** 58/100 (Medium)
- **Complexity Score:** 71/100 (Medium)
- **Performance Score:** 56/100 (Medium)

### Key Findings
- **High Complexity:** The CSS suffers from overly complex selectors (up to 43 complexity points) and high specificity, with **13.5% of selectors using IDs**. This makes the CSS difficult to override and maintain.
- **Poor Maintainability:** A very large ruleset containing **417 declarations** (mostly CSS variables) makes it hard to manage theme properties. The report also notes that over 60% of selectors are more complex than the most common selector pattern in the file.
- **Performance Issues:**
    - **Filesize:** At **309 kB**, the CSS file is quite large.
    - **Declaration Duplication:** **55.8% of declarations are duplicated**, indicating a lack of abstraction and reusable classes.
    - **Embedded Content:** 11 embedded items (mostly SVGs) contribute 6.47 kB to the filesize.

---

## Report 3: Project Wallace CSS Analyzer (Detailed Metrics)

This report provides a deep dive into the raw metrics of the stylesheet.

### Key Metrics
- **Total Lines of Code:** 8,493
- **Selectors:** 2,156 total selectors, with 1,636 being unique.
- **Declarations:** 6,170 total declarations.
- **`!important` Usage:** 195 instances of `!important` (3.16% of declarations), which is a sign of specificity issues.
- **Custom Properties:** 753 custom properties are defined.
- **Units:** `px` is the most used unit (1,221 times), indicating a potential lack of responsive units in some areas.

---

## Specific Recommendations for `docs/css/schedule.css`

Based on the analysis of the reports and a manual review of `docs/css/schedule.css`, here are actionable recommendations to improve the stylesheet.

### 1. Adopt a Naming Convention (like BEM)
The current CSS uses a mix of ID selectors, generic tag selectors, and some class-based selectors. This leads to inconsistent specificity and makes the code hard to reason about.

**Recommendation:** Refactor the CSS to follow a consistent naming convention like BEM (Block, Element, Modifier).

*Example: Refactoring form styles*
```css
/* --- BEFORE --- */
#greenhouse-app-container form { ... }
#greenhouse-app-container .form-control { ... }
#greenhouse-app-container .greenhouse-btn-primary { ... }

/* --- AFTER (BEM Style) --- */
.schedule-form { ... } /* Block */
.schedule-form__control { ... } /* Element */
.schedule-form__button--primary { ... } /* Modifier */
```

### 2. Consolidate and Abstract Common Styles
There is significant code duplication. For example, `.service-a`, `.service-b`, and `.service-c` are defined twice with the same values. Table styles are also repeated.

**Recommendation:** Create reusable utility classes and consolidate component styles.

- **Remove Duplicated Service Color Classes:** Define them only once.
- **Refactor Button Styles:** Create a single base `.btn` class and use modifiers for variations.
```css
/* Base button style */
.btn {
    padding: 0.75rem 1.5rem;
    border: 1px solid transparent;
    border-radius: 4px;
    cursor: pointer;
    font-size: 1rem;
    font-weight: 600;
    transition: all 0.2s ease;
}

/* Modifier for primary button */
.btn--primary {
    background-color: var(--primary-green, #357438);
    color: var(--white, #fff);
}
.btn--primary:hover {
    background-color: var(--primary-green-dark, #2a5a2c);
}

/* Modifier for secondary button */
.btn--secondary {
    background-color: transparent;
    border-color: var(--border-color, #ced4da);
    color: var(--text-dark, #212529);
}
.btn--secondary:hover {
    background-color: #f8f9fa;
}
```
- **Consolidate Table Styles:** The styles for `.schedule-table` and `table:not(.schedule-table)` are very similar. They could be merged into a base `.table` class with modifiers for specific variations.

### 3. Reduce Specificity and Remove ID Selectors
The heavy use of `#greenhouse-app-container` as a prefix for almost every rule makes the CSS rigid. High-specificity selectors force the use of `!important` and make overrides difficult.

**Recommendation:**
- Remove the `#greenhouse-app-container` ID prefix from all selectors. Scope the styles using a top-level class on the container instead (e.g., `.greenhouse-schedule-app`).
- Replace complex selectors like `table tr:nth-child(odd) td:nth-child(even)` with simpler classes applied directly to the elements (e.g., `.cell--shaded`). This is more readable and performant.

### 4. Organize the CSS File Structure
The file lacks a clear, organized structure, with related styles scattered throughout.

**Recommendation:** Structure the file with clear comment blocks for different sections.
```css
/* ==========================================================================
   1. Design System & Variables (if any are local)
   ========================================================================== */

/* ==========================================================================
   2. Base & Generic Styles (e.g., body, form resets)
   ========================================================================== */

/* ==========================================================================
   3. Utility Classes (e.g., .text-center, .margin-top-20)
   ========================================================================== */

/* ==========================================================================
   4. Component: Forms
   ========================================================================== */

/* ==========================================================================
   5. Component: Buttons
   ========================================================================== */

/* ==========================================================================
   6. Component: Tables / Schedule
   ========================================================================== */

/* ==========================================================================
   7. Component: Modal
   ========================================================================== */
```
