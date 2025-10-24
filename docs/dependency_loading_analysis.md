# Dependency Loading Architecture

## Overview

This document outlines the architecture for dependency loading in the Greenhouse static JavaScript applications. The system has been upgraded from a simple polling mechanism to a robust, promise-based dependency manager to improve performance, scalability, and maintainability.

## Implemented Solution: Promise-Based Dependency Manager

The chosen and implemented solution is a centralized, promise-based dependency manager, as detailed in the original analysis document's "Option 2". This approach provides a scalable and efficient way to handle script dependencies.

The canonical implementation can be found in: `docs/js/GreenhouseDependencyManager.js`.

### Core Concepts

The `GreenhouseDependencyManager` operates on a simple `register`/`waitFor` pattern:

1.  **Registration:** As each module (e.g., `GreenhouseUtils.js`) finishes loading, it registers itself with the manager by name.
    ```javascript
    // In GreenhouseUtils.js
    window.GreenhouseDependencyManager.register('utils', window.GreenhouseUtils);
    ```
2.  **Waiting:** Scripts that have dependencies use an `async/await` pattern to wait for the required modules to be registered.
    ```javascript
    // In scheduler.js
    (async function() {
        const GreenhouseUtils = await window.GreenhouseDependencyManager.waitFor('utils');
        // ... now it's safe to use GreenhouseUtils
    })();
    ```

### Key Features of the Implemented Manager

The `GreenhouseDependencyManager.js` implementation is robust and includes several features beyond the basic pattern:

-   **Centralized State:** Manages a map of all available dependencies.
-   **Promise-Based:** Avoids inefficient polling by using Promises that resolve when a dependency is registered.
-   **Timeout Handling:** Includes a configurable timeout to prevent applications from hanging indefinitely if a script fails to load.
-   **Event-Driven Notifications:** Dispatches custom events (e.g., `greenhouse:utils-ready`) when a dependency becomes available, allowing for reactive logic.
-   **Debugging and Status Utilities:** Provides functions (`getStatus()`, `getDebugInfo()`, `visualizeDependencies()`) to inspect the state of dependencies, which is invaluable for development and troubleshooting.
-   **Multiple Dependencies:** A `waitForMultiple()` method allows scripts to wait for a group of dependencies to be ready before executing.

## Rationale for Selection

This approach was chosen over simpler polling or event-based systems for the following reasons:

-   **Performance:** It eliminates the constant CPU usage of `setInterval` polling, leading to a faster and more efficient loading experience, especially on mobile devices.
-   **Scalability:** The centralized registry makes it easy to manage a growing number of scripts and complex dependency chains without code duplication.
-   **Maintainability:** It provides a single, clear, and predictable pattern for managing dependencies across the entire application.
-   **Error Handling:** The built-in timeout mechanism and clear promise rejections make it easier to diagnose loading failures.

## Historical Context: The Previous Polling Mechanism

Previously, scripts used an inefficient `setInterval` polling mechanism to check for the existence of `window.GreenhouseUtils`.

**Legacy Code Example (Now Deprecated):**
```javascript
(async function() {
    'use strict';
    await new Promise(resolve => {
        const interval = setInterval(() => {
            if (window.GreenhouseUtils) {
                clearInterval(interval);
                resolve();
            }
        }, 100);
    });
    // ...
})();
```

While functional, this pattern was inefficient and lacked scalability and proper error handling. The migration to the `GreenhouseDependencyManager` represents a significant architectural improvement and resolves this technical debt.
