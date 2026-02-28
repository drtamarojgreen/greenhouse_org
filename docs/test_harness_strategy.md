# Greenhouse Test Harness Strategy

## Overview
This document outlines the plan for hardening the Greenhouse Live Simulator Test Harness to support robust, isolated execution of the repository's unit tests within a browser environment.

## 1. Harness Lifecycle Hooks

The harness (`docs/test_models.html`) will be updated to implement a rigorous setup and teardown lifecycle for every test case.

### BeforeTest(testContext)
**Purpose**: Prepare a pristine environment for a single test file.
- **Sandbox Creation**: Generate a fresh `mockGlobal` object for every test file.
- **Global Binding**: Explicitly bind native constructors (`Set`, `Map`, `Promise`, `Audio`, etc.) and functions (`setTimeout`, `fetch`) to the original `window` to prevent "Illegal invocation" errors and context-loss bugs.
- **Infrastructure Injection**: Pre-load `assert` and `TestFramework` into the sandbox so they are available without requiring manual `require` calls in every test.
- **DOM Isolation**: Ensure the `#model-container` is cleared and any previous test-added elements are removed.

### AfterTest(testContext)
**Purpose**: Clean up the environment to prevent cross-test contamination.
- **Resource Disposal**: Clear all pending `setTimeout`, `setInterval`, and `requestAnimationFrame` calls.
- **Event Cleanup**: Remove all event listeners attached to the sandbox's `window` and `document`.
- **State Reset**: Reset the `GreenhouseBioStatus` bridge and any other shared application state.
- **DOM Reset**: Wipe the temporary DOM and reset `document.body` classes/attributes modified during the test.

## 2. Sweeping Changes for Unit Tests

To ensure the ~99 unit tests run reliably in the browser-based harness, the following patterns must be standardized across the test suite:

### A. Namespace Isolation
- **Problem**: Many tests use top-level `const` or `let` for common variables (e.g., `const { assert } = require(...)`). When run sequentially in the same scope, this causes `SyntaxError`.
- **Solution**: The harness will use `vm.runInNewContext` or separate `<iframe>` execution for each test file. Tests must avoid assuming a completely shared global scope with other test files.

### B. Dependency Resolution
- **Problem**: Node.js relative paths (e.g., `require('../utils/assertion_library.js')`) do not resolve natively in the browser.
- **Solution**: The harness's `require` mock will be updated to handle a centralized mapping of utility paths. Tests should be updated to use standard relative paths that the harness can intercept and map to `docs/js/`.

### C. Browser Global Access
- **Problem**: Tests often mock `document` or `window` manually.
- **Solution**: Tests should favor using the virtualized `document` and `window` provided by the harness. Sweeping updates will remove redundant mocks inside individual test files to rely on the harness's standardized environment.

### D. Asynchronous Completion
- **Problem**: Some tests finish before their async operations (like animations) complete.
- **Solution**: Tests involving animations or delayed transitions must be updated to use the `done()` callback or return a `Promise`.

## 3. Implementation Plan

1.  **Refactor `docs/test_models.html`**:
    - Implement `createSandbox()` utility.
    - Implement `runTestWithIsolation(file)` which calls `BeforeTest`, executes the file in a new context, and calls `AfterTest`.
2.  **Harden `vm` Emulation**:
    - Fix the `document` method binding issue where `addEventListener` was occasionally lost.
    - Ensure `performance.now()` and other timing APIs are stable.
3.  **Automated Verification**:
    - Use Playwright to run the full suite and capture a "Perfect 99/99" report.
