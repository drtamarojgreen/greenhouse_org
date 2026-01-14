# Comprehensive Testing Plan for the "Models" Page and Associated Views

This document outlines a strategy for creating comprehensive unit, integration, and performance tests for the "Models" page javascript components and its associated model view pages. The goal is to ensure the reliability, correctness, robustness, and performance of the application's logic.

## 1. Core Components to Test

The "Models" page is primarily loaded and orchestrated by `models.js`, which in turn loads a number of other modules. The key components to test are:

*   **`models.js` (Loader)**: The main script that loads all other dependencies for the table of contents.
*   **`GreenhouseModelsUX` (`models_ux.js`)**: Handles user experience, interactions, and the main initialization of the application.
*   **`GreenhouseModelsUI` (`models_ui.js`)**: Manages the overall user interface, including the 3D environment and overlays.
*   **`GreenhouseModelsData` (`models_data.js`)**: Responsible for fetching, parsing, and managing the data used in the simulation.
*   **`GreenhouseModels3DMath` (`models_3d_math.js`)**: Provides utility functions for 3D calculations, projections, etc.
*   **Individual Model Pages**: Pathway, Neuro, Genetic, and Synapse pages, each with their own loaders and rendering logic.

## 2. Testing Strategy: Models Page (Table of Contents)

The testing strategy will be based on the existing test framework (`TestFramework.js`) and assertion library (`assertion_library.js`).

### 2.1. `models.js` (Loader)

*   **Test Suite: `Models Page Loader`**
    *   **Test Case**: It should correctly capture the `data-base-url` attribute from the script tag.
    *   **Test Case**: It should call `GreenhouseUtils.loadScript` for each dependent script in the correct order.
    *   **Test Case**: It should handle `GreenhouseUtils` load failures gracefully.
    *   **Test Case**: It should define `window.GreenhouseModels.reinitialize` after successful loading.
    *   **Test Case**: It should fetch and parse the `models_toc.json` manifest to generate interactive buttons.
    *   **Test Case (Bug Hunt)**: It should handle a missing or malformed `models_toc.json` by displaying an error message instead of crashing.
    *   **Test Case**: It should attach click handlers to each button that correctly navigate to the corresponding model page, verifying the `window.location` change.
    *   **Test Case**: It should apply correct ARIA attributes (`role="button"`, `aria-label`) to each generated button for accessibility.

### 2.2. `GreenhouseModelsUX`

*   **Test Suite: `GreenhouseModelsUX`**
    *   **Test Case**: `init()` should call the initialization methods of other components (`GreenhouseModelsUI.init()`, `GreenhouseModelsData.load()`).
    *   **Test Case**: `reinitialize()` should correctly reset the application state, clear canvases, and reset data stores.
    *   **Test Case**: Event handlers for mouse movements should correctly update camera/view angles.
    *   **Test Case (Bug Hunt)**: Test event handlers with unexpected event data (e.g., a click event with no coordinates, touch events on a desktop).

### 2.3. `GreenhouseModelsUI`

*   **Test Suite: `GreenhouseModelsUI`**
    *   **Test Case**: `init()` should create the main canvas and append it to the correct DOM element.
    *   **Test Case**: The `render()` loop should be started on `init()` and stopped on `destroy()`.
    *   **Test Case**: `render()` should call the drawing methods for different scene elements in the correct order.
    *   **Test Case (Aesthetics Check)**: Using a mock canvas context, assert that `ctx.fillStyle` and `ctx.strokeStyle` are set to the correct design token colors before drawing.

### 2.4. `GreenhouseModelsData`

*   **Test Suite: `GreenhouseModelsData`**
    *   **Test Case**: It should correctly parse valid data fetched from the server.
    *   **Test Case (Bug Hunt)**: It should handle malformed data (e.g., missing fields, incorrect data types) by returning a default state or throwing a specific error.
    *   **Test Case (Bug Hunt)**: It should handle network errors (e.g., 404, 500) from `fetch` gracefully.

### 2.5. `GreenhouseModels3DMath`

*   **Test Suite: `GreenhouseModels3DMath`**
    *   **Test Case**: `project3DTo2D()` should correctly project a 3D point to 2D coordinates.
    *   **Test Case**: Test vector and matrix multiplication functions for correctness against known values.
    *   **Test Case (Bug Hunt)**: Test with invalid inputs (`null`, `undefined`, non-numeric) to ensure functions return predictable values (e.g., zero vector) instead of `NaN`.

## 3. Testing Strategy: Individual Model Pages

### 3.1. Pathway Page

*   **Test Suite: `Pathway Page Loader & Viewer`**
    *   **Test Case**: Verify the script loading order: `models_util.js`, `models_3d_math.js`, `brain_mesh_realistic.js` must be loaded before `pathway_viewer.js`.
    *   **Test Case**: Mock the script loader to assert that `neuro_ui_3d_geometry.js` is **never** in the list of scripts to be loaded.
    *   **Test Case**: Confirm that console warnings are logged if `baseUrl` or `targetSelector` are missing.
    *   **Test Case**: Confirm `GreenhousePathwayViewer.init` is called with a valid, structured configuration object (e.g., `{ baseUrl: '...', targetSelector: '...' }`).
    *   **Test Case**: Verify the pathway selector UI is rendered and populated with pathway options.

### 3.2. Neuro Page

*   **Test Suite: `Neuro Page Application`**
    *   **Test Case**: It should initialize using a dedicated `neuroConfig` object. Mock `window._greenhouseNeuroAttributes` to ensure it is ignored.
    *   **Test Case**: Confirm that dependency loading relies exclusively on `GreenhouseDependencyManager` and does not contain any `setTimeout` or `setInterval` polling logic.
    *   **Test Case**: Mock the script loader to assert that no script with "genetic" in its name is loaded.
    *   **Test Case**: After a mocked successful load, check that `window.GreenhouseNeuroApp` and its core modules are defined and not `undefined`.

### 3.3. Genetic Page

*   **Test Suite: `Genetic Page Application`**
    *   **Test Case**: It should initialize using a dedicated `geneticConfig` object.
    *   **Test Case**: Mock the script loader to assert that `neuro_ui_3d_geometry.js` is **not** loaded.
    *   **Test Case**: When the target selector is missing from the DOM, assert that a specific, user-friendly error is thrown.
    *   **Test Case**: Verify the loading overlay is added to the DOM on init and removed on success.

### 3.4. Synapse Page

*   **Test Suite: `Synapse Page Rendering`**
    *   **Test Case**: Mock the canvas context and verify the rendering pipeline by checking the precise order of draw calls: `drawBackground`, `drawMembraneChannels`, `drawKinases`, `drawVesicles`.
    *   **Test Case**: Simulate clicks on the legend and assert that the `visible` flag for the corresponding element type is toggled in the application's state.
    *   **Test Case**: Test `drawSynapticView` with various states (e.g., no vesicles, many receptors) and ensure it runs without errors.
    *   **Test Case**: Check that label positions are recalculated when the canvas size changes, preventing overlaps.
    *   **Test Case**: Mock `requestAnimationFrame` to ensure it's called for animations, not `setInterval`.

## 4. Cross-Cutting Concerns

### 4.1. Integration Testing
*   **Test Suite: `Page Navigation and Isolation`**
    *   **Test Case**: Simulate a complete user journey: Load the Models TOC, click the "Neuro" button, and verify that the Neuro page loads correctly.
    *   **Test Case**: Load the Neuro page, then navigate to the Genetic page. Use a DOM mock to ensure that any UI or listeners from the Neuro page are properly cleaned up and do not interfere with the Genetic page.
    *   **Test Case**: Verify that shared utilities like `models_3d_math.js` loaded by one page are available to the next page without being re-fetched.

### 4.2. Performance Testing
*   **Test Suite: `Application Performance`**
    *   **Test Case**: Measure the total script load time for each model page. It should remain under a defined threshold (e.g., 1.5 seconds on a throttled connection).
    *   **Test Case**: Monitor the `requestAnimationFrame` callback timing. The average frames per second (FPS) should not drop below 50 during typical animations.
    *   **Test Case (Memory Leaks)**: Programmatically navigate between all model pages 100 times. Use browser performance tools (`performance.memory`) to snapshot the JS heap size and ensure it does not grow unboundedly.

### 4.3. Accessibility (A11y) Testing
*   **Test Suite: `Accessibility Compliance`**
    *   **Test Case**: For the Models TOC, verify all buttons have `role="button"` and a descriptive `aria-label`.
    *   **Test Case**: All interactive elements (buttons, selectors) must be focusable and operable via keyboard (Enter/Space keys).
    *   **Test Case**: Use an automated tool to check that all text and UI elements meet WCAG AA color contrast ratios against their backgrounds.

### 4.4. Visual Regression Testing
*   **Strategy**: Implement snapshot testing for key UI states.
    *   For each model page, render the view with a fixed, deterministic dataset.
    *   Capture the canvas content as a PNG image (`canvas.toDataURL()`).
    *   Compare the resulting image to a previously approved "snapshot" image. The test fails if the images differ by more than a small tolerance, preventing unintended visual changes.

## 5. Mocking

To isolate components and test them in a controlled environment, we will need mocks for:

*   **DOM**: A mock `document` and `window` object. This includes mocking `script` tag attributes, `window.location`, and element selectors.
*   **Canvas Context**: A mock 2D context that records drawing calls, their order, and their parameters.
*   **`fetch` API**: To test data loading, the `fetch` API should be mocked to return predefined valid or invalid data.
*   **Module Dependencies**: Mock dependencies like `GreenhouseUtils` and `GreenhouseDependencyManager` to control script loading behavior.
*   **Timers and Animation**: Mock `setTimeout`, `setInterval`, and `requestAnimationFrame` to test asynchronous logic and animations without relying on real time.
*   **CSS Variables**: For testing style compliance, provide mock values for design tokens.
