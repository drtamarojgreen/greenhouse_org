# Dependency Loading Pattern Analysis & Recommendations

## Current Implementation Analysis

### 1. Script Initialization & Dependency Loading Pattern

The current implementation in `scheduler.js` uses a polling mechanism to wait for dependencies:

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

### 2. Critique Assessment

**Rating: 7/10** - The critique is accurate and well-founded.

**Strengths:**
- ✅ Uses IIFE to prevent global namespace pollution
- ✅ Robust - will eventually find the dependency
- ✅ Simple to understand and implement
- ✅ Works reliably in various loading scenarios

**Weaknesses:**
- ❌ Inefficient polling mechanism (100ms intervals)
- ❌ Unnecessary CPU usage and battery drain
- ❌ Not scalable for multiple dependencies
- ❌ No timeout mechanism (could poll indefinitely)
- ❌ Architectural inconsistency with modern patterns

## Current Architecture Overview

### Loading Sequence
1. **greenhouse.js** - Main loader, depends on GreenhouseUtils
2. **GreenhouseUtils.js** - Core utilities, loaded first
3. **scheduler.js** - Polls for GreenhouseUtils availability
4. **schedulerUI.js** - Loaded by scheduler.js via GreenhouseUtils.loadScript()
5. **App-specific scripts** - Loaded dynamically as needed

### Dependency Chain
```
GreenhouseUtils.js (foundation)
    ↓
greenhouse.js (orchestrator)
    ↓
scheduler.js (polls for GreenhouseUtils)
    ↓
schedulerUI.js + App scripts (loaded via GreenhouseUtils.loadScript)
```

## Recommended Improvements

### Option 1: Event-Based Dependency System (Recommended)

Replace polling with a custom event system:

```javascript
// In GreenhouseUtils.js - add at the end
window.dispatchEvent(new CustomEvent('greenhouse:utils-ready', {
    detail: { utils: window.GreenhouseUtils }
}));

// In scheduler.js - replace polling with:
(async function() {
    'use strict';

    await new Promise(resolve => {
        if (window.GreenhouseUtils) {
            resolve();
        } else {
            const handleReady = () => {
                document.removeEventListener('greenhouse:utils-ready', handleReady);
                resolve();
            };
            document.addEventListener('greenhouse:utils-ready', handleReady);

            // Timeout fallback
            setTimeout(() => {
                document.removeEventListener('greenhouse:utils-ready', handleReady);
                if (window.GreenhouseUtils) {
                    resolve();
                } else {
                    console.error('Scheduler: GreenhouseUtils failed to load within timeout');
                    resolve(); // Continue anyway to prevent hanging
                }
            }, 10000);
        }
    });
    // ...
})();
```

### Option 2: Promise-Based Dependency Manager

Create a centralized dependency manager:

```javascript
// New file: DependencyManager.js
window.GreenhouseDependencies = {
    _dependencies: new Map(),
    _promises: new Map(),

    register(name, value) {
        this._dependencies.set(name, value);
        if (this._promises.has(name)) {
            this._promises.get(name).resolve(value);
            this._promises.delete(name);
        }
        window.dispatchEvent(new CustomEvent(`greenhouse:${name}-ready`, { detail: value }));
    },

    waitFor(name, timeout = 10000) {
        if (this._dependencies.has(name)) {
            return Promise.resolve(this._dependencies.get(name));
        }

        if (!this._promises.has(name)) {
            let resolve, reject;
            const promise = new Promise((res, rej) => {
                resolve = res;
                reject = rej;
            });
            promise.resolve = resolve;
            promise.reject = reject;
            this._promises.set(name, promise);

            setTimeout(() => {
                if (this._promises.has(name)) {
                    this._promises.get(name).reject(new Error(`Dependency ${name} not available within ${timeout}ms`));
                    this._promises.delete(name);
                }
            }, timeout);
        }

        return this._promises.get(name);
    }
};

// Usage in GreenhouseUtils.js:
window.GreenhouseDependencies.register('utils', window.GreenhouseUtils);

// Usage in scheduler.js:
const GreenhouseUtils = await window.GreenhouseDependencies.waitFor('utils');
```

### Option 3: Module Loading Order Management

Enhance the existing `loadScript` function to handle dependencies:

```javascript
// Enhanced loadScript in GreenhouseUtils.js
async function loadScript(scriptName, baseUrl, attributes = {}, dependencies = []) {
    // Wait for dependencies first
    for (const dep of dependencies) {
        await waitForDependency(dep);
    }

    // Then load the script (existing logic)
    // ...
}

async function waitForDependency(depName) {
    return new Promise((resolve, reject) => {
        const checkDependency = () => {
            if (window[depName]) {
                resolve(window[depName]);
            } else {
                setTimeout(checkDependency, 50); // Reduced polling interval
            }
        };

        checkDependency();

        // Timeout after 10 seconds
        setTimeout(() => {
            reject(new Error(`Dependency ${depName} not available`));
        }, 10000);
    });
}
```

## Implementation Priority

### Phase 1: Immediate Improvements (Low Risk)
1. **Add timeout to existing polling** - Prevent infinite polling
2. **Reduce polling interval** - From 100ms to 50ms for better responsiveness
3. **Add error handling** - Graceful degradation if dependencies fail

### Phase 2: Event-Based System (Medium Risk)
1. **Implement Option 1** - Event-based dependency loading
2. **Update all dependent scripts** - Replace polling with event listeners
3. **Add comprehensive error handling** - Timeout and fallback mechanisms

### Phase 3: Full Dependency Manager (Higher Risk)
1. **Implement Option 2** - Complete dependency management system
2. **Refactor all scripts** - Use centralized dependency manager
3. **Add development tools** - Dependency visualization and debugging

## Benefits of Recommended Approach

### Performance Benefits
- **Eliminates continuous polling** - Reduces CPU usage
- **Faster initialization** - Immediate response to dependency availability
- **Better battery life** - Especially important for mobile users

### Architectural Benefits
- **Scalable** - Easy to add new dependencies
- **Maintainable** - Centralized dependency management
- **Debuggable** - Clear dependency chain and error messages
- **Modern** - Follows contemporary JavaScript patterns

### Developer Experience
- **Clear error messages** - When dependencies fail to load
- **Timeout handling** - Prevents hanging applications
- **Event-driven** - More predictable execution flow

## Migration Strategy

### Step 1: Backward Compatible Enhancement
```javascript
// Enhanced polling with timeout and events
await new Promise(resolve => {
    if (window.GreenhouseUtils) {
        resolve();
        return;
    }

    // Listen for ready event
    const handleReady = () => {
        document.removeEventListener('greenhouse:utils-ready', handleReady);
        resolve();
    };
    document.addEventListener('greenhouse:utils-ready', handleReady);

    // Fallback polling with timeout
    let attempts = 0;
    const maxAttempts = 100; // 10 seconds at 100ms intervals
    const interval = setInterval(() => {
        attempts++;
        if (window.GreenhouseUtils) {
            clearInterval(interval);
            document.removeEventListener('greenhouse:utils-ready', handleReady);
            resolve();
        } else if (attempts >= maxAttempts) {
            clearInterval(interval);
            document.removeEventListener('greenhouse:utils-ready', handleReady);
            console.error('Scheduler: GreenhouseUtils not available after timeout');
            resolve(); // Continue anyway
        }
    }, 100);
});
```

### Step 2: Full Event System
Replace polling entirely with event-based system once all dependencies support it.

## Conclusion

The current polling mechanism, while functional, represents a technical debt that should be addressed. The event-based approach (Option 1) provides the best balance of:
- **Low implementation risk**
- **Significant performance improvement**
- **Modern architectural patterns**
- **Backward compatibility during transition**

The recommended approach maintains the robustness of the current system while eliminating its inefficiencies and providing a foundation for future scalability.
