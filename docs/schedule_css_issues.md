# Corrected CSS Analysis and Targeted Fixes for /schedule/

This document provides a targeted plan to fix the CSS styling issues on the `/schedule/` page. The recommendations below are based on the actual HTML structure of the page and **do not** invent or "hallucinate" new CSS classes. The goal is to make the existing styles in `docs/css/schedule.css` apply correctly.

---

## **CRITICAL ISSUE: Why The CSS Does Not Work**

The fundamental problem is that the styles in `docs/css/schedule.css` are written to target a parent element with the ID `#greenhouse-app-container`. However, based on the HTML provided, this ID does not exist anywhere on the live page.

Instead, the application components are injected into generic Wix containers. For example:
- The Patient View is inside `<div id="comp-mf2vtvp31">`.
- The Calendar is inside `<div id="greenhouse-patient-app-calendar-container">`.
- The Patient Form is inside `<div id="greenhouse-patient-form">`.

Because the parent selector `#greenhouse-app-container` is missing, the browser ignores almost all of the CSS rules.

---

## **Targeted Solution: Use Existing Selectors**

To fix this, we must replace the incorrect parent ID with selectors that actually exist on the page. Since the application components have unique and stable IDs, we can use those as the new basis for our CSS selectors. This is a direct, practical fix.

### Concrete Refactoring Examples for `docs/css/schedule.css`

The following "Before" and "After" examples show exactly how to change the CSS selectors to match the real HTML.

#### Example 1: Fixing the Patient Form Styles

- **Problem:** The form styles rely on `#greenhouse-app-container`.
- **Existing HTML:** The form and its container have the ID `#greenhouse-patient-form`.
- **Targeted Fix:** Replace `#greenhouse-app-container` with `#greenhouse-patient-form`.

**Before:**
```css
/* --- Form Wrapper --- */
#greenhouse-app-container form {
    background-color: var(--form-bg, #ffffff);
    padding: var(--spacing-xl, 2rem);
    /* ... */
}

/* --- Form Labels --- */
#greenhouse-app-container label {
    display: block;
    /* ... */
}
```

**After (Targeting Existing ID):**
```css
/* --- Form Wrapper --- */
/* Use the actual ID of the form's container */
#greenhouse-patient-form form {
    background-color: var(--form-bg, #ffffff);
    padding: var(--spacing-xl, 2rem);
    /* ... */
}

/* --- Form Labels --- */
/* Descend from the correct ID */
#greenhouse-patient-form label {
    display: block;
    /* ... */
}
```

#### Example 2: Fixing the Calendar Styles (Corrected Example)

- **Problem:** Calendar styles, including those for `.schedule-table`, depend on the non-existent `#greenhouse-app-container`.
- **Existing HTML:** The calendar has its own unique container with the ID `#greenhouse-patient-app-calendar-container`.
- **Targeted Fix:** Use `#greenhouse-patient-app-calendar-container` as the new parent selector for all calendar-related styles.

**Before:**
```css
#greenhouse-app-container .calendar-header {
    display: flex;
    /* ... */
}

/* This rule was also incorrectly scoped in the original CSS file */
#greenhouse-app-container .schedule-table {
    width: 100%;
    /* ... */
}
```

**After (Targeting Existing ID):**
```css
/* Use the actual ID of the calendar's container for the header */
#greenhouse-patient-app-calendar-container .calendar-header {
    display: flex;
    /* ... */
}

/* Also scope the schedule-table to the correct calendar container ID */
#greenhouse-patient-app-calendar-container .schedule-table {
    width: 100%;
    /* ... */
}
```

### Summary of Action Plan

To fix the CSS, the developer should:
1.  Open `docs/css/schedule.css`.
2.  Perform a "find and replace" to change all instances of `#greenhouse-app-container` to the more specific component IDs as shown above (`#greenhouse-patient-form`, `#greenhouse-patient-app-calendar-container`, etc.).
3.  For shared styles that apply to multiple components, group them under a common selector list (e.g., `#greenhouse-patient-form, #greenhouse-patient-app-calendar-container { ... }`) or target unique classes that are present on the elements.

This approach is a direct, practical solution that respects the existing HTML structure.
