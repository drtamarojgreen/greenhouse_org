# Pathway Application: Status and Go-Forward Plan

This document outlines the current status of the Pathway application, summarizes the accomplishments to date, and defines the immediate next steps to resolve a critical blocking issue.

## 1. Current Status & Critical Blocker

The development of the neural pathway visualization is currently **blocked**.

*   **Core Issue:** The `pathway.js` script is failing to initialize on the live production website.
*   **Error Message:** The browser console shows a fatal error: `Pathway App: Initialization failed: Error: Could not capture script attributes.`
*   **Impact:** This error prevents the script from reading its necessary configuration parameters (like target DOM selectors and base URLs). As a result, the entire application fails to load, and no visualization is rendered. All work on feature enhancements is halted until this is resolved.

## 2. Accomplishments to Date

Significant progress was made on the broader Genetic Neural Evolution Simulation platform before the current blocker was encountered.

### ROI Highlighting Feature (Completed)
*   **Enabled ROI Highlighting:** Implemented the core feature to highlight specific Regions of Interest (ROI) on the 3D brain model, allowing visual focus on the brain region targeted by the currently active gene.
*   **Data Structure Refactoring:** The `brainShell.faces` data structure was refactored to associate 3D geometry with specific anatomical regions, a critical prerequisite for the feature.
*   **Code Centralization:** Rendering logic was centralized into a single `drawBrainShell` function to improve maintainability.
*   **Dynamic Highlighting Logic:** The `drawBrainShell` function was updated to accept an `activeGene` parameter and dynamically color faces belonging to the target ROI.
*   **Visual Enhancement:** A "bright glowing neon green" highlight was achieved by bypassing standard lighting for the targeted ROI, making it appear emissive.
*   **Application-Wide Integration:** All calls to `drawBrainShell` were updated to the new function signature.
*   **Automated Visual Verification:** A Playwright test was created to automate screenshot capture and verification of the ROI highlighting feature.

### Initial Scaffolding
*   The initial file structure for the `synapse` and `pathway` applications was created, including `synapse.js`, `pathway.js`, and their corresponding HTML test harnesses.

## 3. Proposed Next Steps (The Plan)

The immediate and sole focus is to resolve the `pathway.js` initialization failure.

1.  **Analyze `pathway.js` Initialization:**
    *   Review `apps/frontend/pathway/pathway.js` to identify the precise code used to find its own `<script>` element and read its `data-*` attributes. This is the code that is currently failing.

2.  **Compare with Working Implementations:**
    *   Analyze the initialization sequence of known working scripts like `genetic.js` and `neuro.js`.
    *   Specifically, investigate whether they employ a timed delay (e.g., `setTimeout`), a `DOMContentLoaded` event listener, or another mechanism to ensure the DOM is fully parsed and the script element is available before attempting to access it. This investigation is prompted by the user's question regarding a five-second delay in other scripts.

3.  **Implement and Verify the Fix:**
    *   Based on the analysis, implement a robust solution in `pathway.js`. This will likely involve wrapping the attribute-capturing logic in a `setTimeout` or an appropriate event listener to prevent the race condition.
    *   Once the change is implemented, the fix will be verified by observing the live site to confirm that the initialization error is gone and the application proceeds to the next stage of execution.
