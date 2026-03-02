# Greenhouse Test Harness Strategy

## Overview
The Greenhouse Test Harness is a browser-based simulation environment designed to execute repository unit tests in a context that mirrors the live production site (e.g., Wix/GitHub Pages). It solves the "dual-environment" challenge by allowing the same test files to run in Node.js (via `vm`) and in the browser (via a custom Proxy-based sandbox).

## Architecture

### 1. Browser-Based Sandbox (`docs/test_models.html`)
The harness implements a virtualized execution context using the `Proxy` API:
- **Global Isolation:** Each test file runs in a fresh sandbox, preventing state leakage and `assert` re-declaration errors.
- **DOM Virtualization:** The sandbox provides a `document` and `window` proxy.
- **Native API Compatibility:** A specialized "unwrapping" logic detects when proxied DOM nodes are passed to native browser APIs (like `ResizeObserver` or `insertBefore`) and automatically provides the underlying real DOM elements, preventing "Illegal invocation" errors.
- **Node.js Mocking:** Implements mocks for `require`, `module`, `fs`, `path`, and `vm` (using `runInContext` inside the browser) to support Node-style tests.

### 2. Standardized Test Factory (`createEnv`)
Unit tests have been refactored from static scripts to a factory-based pattern:
- **`createEnv`:** A helper function that detects the environment. In the browser harness, it uses the existing pre-initialized global state. In Node.js, it executes the target script within a provided `vm` context.
- **Decoupling:** This pattern decouples test logic from the script loading mechanism, making tests resilient to whether the application script was loaded via `<script>` tag or `fs.readFileSync`.

### 3. Production Resilience & Sentinel System
The harness includes a "React Update Simulator" and a dedicated test suite (`test_production_resilience.js`):
- **MutationObserver Integration:** Validates that `GreenhouseUtils.observeAndReinitializeApplication` correctly detects when the Wix/React framework removes a model's container.
- **Sentinel Polling:** Provides a fallback mechanism for browsers or situations where MutationObservers might be throttled or disconnected.
- **Auto-Recovery:** Ensures models re-initialize themselves automatically when their target DOM containers are re-injected.

## Key Changes
- **Unit Test Migration:** Over 50 unit tests migrated to the standardized factory pattern.
- **Harness Robustness:** Fixed illegal invocation errors and "window/global" accessor conflicts in the sandbox proxy.
- **Cross-Environment Compatibility:** Tests now run reliably in both headless CLI (Node) and interactive browser (Harness).
