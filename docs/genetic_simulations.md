# Genetic and Neuro Simulation Testing Issues

## Overview
The Greenhouse project uses a custom Node.js-based test runner (`tests/unit/run_js_unit_tests.js`) to execute frontend JavaScript simulations in a headless environment. While this allows for fast unit testing, it introduces several environmental and scoping challenges, particularly with the 3D-heavy Genetic and Neuro simulations.

## The `eval()` Scoping Problem
The core of the issue lies in how simulation modules are loaded. The test runner reads JS files from disk and executes them using `eval()`.

```javascript
// tests/unit/run_js_unit_tests.js
function loadModule(m) {
    // ...
    const code = fs.readFileSync(fullPath, 'utf8');
    try {
        eval(code);
    } catch (e) { }
}
```

This approach leads to **Lexical Shadowing** and **Global Scope Pollution** issues:
1.  **Variable Shadowing**: When a script uses `const` or `let` to define a global (e.g., `const GreenhouseGeneticConfig = { ... }`), and that script is `eval`'d inside a function, that variable is local to the `eval` context or the calling function, rather than being a true global.
2.  **Asynchronous Loss of Scope**: Many Greenhouse apps have an `async function main()` that continues executing after the initial `eval()` completes. If these apps rely on lexically scoped variables that were supposed to be global, they can lose access to them or find them partially overwritten by subsequent `eval()` calls for other modules.

### Places using `eval()` in Models
While most models avoid `eval()` for core logic, it is used in several infrastructure components:

| File | Usage | Context |
|------|-------|---------|
| `docs/js/models_ui_synapse.js` | `const cx = eval(...)` | Dynamic path calculation for synapse elements. |
| `tests/unit/run_js_unit_tests.js` | `eval(code)` | Primary module loader for the test suite. |
| `tests/unit/run_js_unit_tests.js` | `eval(fs.readFileSync(file, 'utf8'))` | Loading individual test files. |

## Simulation-Specific Gaps
The Genetic and Neuro simulations require a highly specific mock environment.

### 1. `GreenhouseGeneticConfig` and `GreenhouseNeuroConfig`
These objects must provide a `get(path)` and `set(path, value)` API. In the test environment, these can become "broken" (e.g., `this.config.get is not a function`) if the real configuration script overwrites the mock but fails to attach the `get` method to the window properly within the `eval` context.

### 2. Missing Browser APIs
The 3D simulations rely on several browser APIs not present in Node.js:
-   **Canvas 2D methods**: `ellipse()`, `createPattern()`.
-   **DOM Interfaces**: `HTMLElement`.
-   **Dynamic DOM Injection**: Simulations often use `innerHTML` to inject complex UI components. The `MockElement` must correctly parse these and provide discoverable children via `querySelector`.

## Recommendations for Future Refactoring
1.  **Move away from `eval()` for module loading**: Use a more robust virtual DOM environment like JSDOM which handles script execution and global scope more realistically.
2.  **Modularize Global Configs**: Refactor configurations to be more resilient to scope changes, or explicitly attach them to `window` using assignments (`window.Config = ...`) rather than lexical declarations at the top level.
3.  **Expand `genetic_neuro_mock.js`**: Continue to maintain specialized mocks for these complex systems to bridge the gap between headless Node and the browser.
