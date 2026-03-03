# Production Bugs Report

This report documents identified bugs and architectural flaws in the Greenhouse production scripts that require resolution by the production development team.

## 1. Genetic Simulation Initialization Race Condition
**File:** `docs/js/genetic.js`
**Status:** Identified
**Description:** The script calls the `main()` execution entry point before defining the `window.GreenhouseGenetic` global API object. This causes a race condition where resilience utilities (like `observeAndReinitializeApplication` and `startSentinel` in `GreenhouseUtils.js`) may attempt to access properties on `window.GreenhouseGenetic` before it has been initialized, leading to `TypeError: appInstance is undefined`.
**Recommendation:** Move the assignment of `window.GreenhouseGenetic` to occur before the call to `main()`.

## 2. Missing Defensive Checks in Resilience Utilities
**File:** `docs/js/GreenhouseUtils.js`
**Status:** Identified
**Description:** The functions `observeAndReinitializeApplication` and `startSentinel` do not perform null/undefined checks on the `appInstance` argument before attempting to access or set properties like `_resilienceObserver` and `_sentinelInterval`. This leads to crashes if an application script (such as `genetic.js`) triggers these utilities before its global instance is fully established.
**Recommendation:** Add `if (!appInstance) return;` or similar defensive checks at the beginning of these functions.

## 3. Dependency Manager Registration Race
**File:** `docs/test_models.html` (and potentially other production HTML pages)
**Status:** Resolved in Test Harness (requires production audit)
**Description:** `GreenhouseUtils.js` attempts to register itself with `window.GreenhouseDependencyManager` upon loading. If the manager script is loaded after the utilities script, the registration fails silently, causing subsequent dependent applications (like `neuro.js` or `emotion.js`) to time out while waiting for the 'utils' dependency.
**Recommendation:** Ensure `GreenhouseDependencyManager.js` is always loaded before `GreenhouseUtils.js` in all production HTML entry points.

## 4. Test Framework Hook Inheritance Failure
**File:** `docs/js/test_framework.js`
**Status:** Identified (Workaround implemented in harness)
**Description:** The `describe` implementation in the lightweight testing framework does not maintain parent-child relationships between suites. Consequently, `beforeEach` and `afterEach` hooks defined in a parent `describe` block are not executed for tests in nested `describe` blocks. This breaks integration tests that rely on hierarchical setup logic.
**Recommendation:** Update the `describe` function to set a `parent` property on nested suites and ensure `runTest` recursively collects and executes hooks from the entire suite hierarchy.

## 5. Missing Assertion Method: `assert.fail`
**File:** `docs/js/assertion_library.js`
**Status:** Identified (Fallback implemented in harness)
**Description:** Several unit tests (e.g., `test_mobile_integration.js`) call `assert.fail()`, but this method is not defined in the production assertion library. This causes tests to crash with `TypeError: assert.fail is not a function` when an assertion failure is manually triggered.
**Recommendation:** Add a `fail(message)` method to the `assert` object that unconditionally throws an `AssertionError`.
