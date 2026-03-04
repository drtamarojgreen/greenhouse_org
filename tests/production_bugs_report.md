# Production Bugs Report - Greenhouse Live Simulator

This report documents bugs and architectural issues identified in the production scripts during the development of the browser-native test harness. These issues were mitigated via runtime patches in the harness to avoid direct modification of production code.

## 1. ADHD Data Mapping Mismatch (neuro_app.js)
*   **Issue:** `neuro_app.js` expects `window.GreenhouseADHDData` to have a flat `enhancements` object for lookups, but the actual data provided by `neuro_adhd_data.js` uses a nested `categories` structure.
*   **Symptom:** `TypeError` when selecting scenarios or filtering enhancements.
*   **Mitigation:** The harness implements a `patchProductionGlobals` utility that automatically flattens the `categories` into an `enhancements` lookup table if it's missing.

## 2. Translation Service Failures (models_util.js)
*   **Issue:** `GreenhouseModelsUtil.t()` fails or returns `undefined` if the translation key is missing or if the language service is not fully initialized.
*   **Symptom:** UI elements (buttons, labels) showing as `undefined` or blank.
*   **Mitigation:** The harness patches `GreenhouseModelsUtil.t` to return the key itself as a fallback if the translation is unavailable.

## 3. Resilience Observer Race Condition (genetic.js / neuro.js)
*   **Issue:** The `observeAndReinitializeApplication` logic in `GreenhouseUtils.js` can be triggered before the `appInstance` is fully initialized, especially during rapid model switching.
*   **Symptom:** `Uncaught TypeError: can't access property "_resilienceObserver", appInstance is undefined`.
*   **Mitigation:** The harness `clearEnvironment` function systematically stops all intervals and animation frames, and deletes previous app instances to prevent the observer from firing on stale or partially initialized states.

## 4. Node-Specific Dependencies in Browser (Multiple Files)
*   **Issue:** Many repository tests and some utility scripts attempt to access Node.js globals like `process.env.NODE_ENV` or use `require()`.
*   **Symptom:** Fatal execution errors in the browser.
*   **Mitigation:** The harness provides minimal, safe shims for `window.process` and `window.require` to satisfy these checks without attempting full Node.js emulation.

## 5. Syntax Errors in Production Assets (tech.js)
*   **Issue:** `docs/js/tech.js` contained invalid syntax (duplicate assignment `let canvas = let canvas = ...`).
*   **Symptom:** Script failed to load, breaking the Tech model page.
*   **Fix:** This file was corrected directly as it was a clear syntax error blocking execution.
