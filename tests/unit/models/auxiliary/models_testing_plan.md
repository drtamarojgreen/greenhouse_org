# Unit Testing Plan for the "Models" Page

This document outlines a strategy for creating comprehensive unit tests for the "Models" page javascript components. The goal is to ensure the reliability, correctness, and robustness of the application's logic.

## 1. Core Components to Test

The "Models" page is primarily loaded and orchestrated by `models.js`, which in turn loads a number of other modules. The key components to test are:

*   **`models.js` (Loader)**: The main script that loads all other dependencies.
*   **`GreenhouseModelsUX` (`models_ux.js`)**: Handles user experience, interactions, and the main initialization of the application.
*   **`GreenhouseModelsUI` (`models_ui.js`)**: Manages the overall user interface, including the 3D environment and overlays.
*   **`GreenhouseModelsData` (`models_data.js`)**: Responsible for fetching, parsing, and managing the data used in the simulation.
*   **`GreenhouseModels3DMath` (`models_3d_math.js`)**: Provides utility functions for 3D calculations, projections, etc.

## 2. Testing Strategy

The testing strategy will be based on the existing test framework (`TestFramework.js`) and assertion library (`assertion_library.js`). Each major component will have its own test suite (`describe` block).

### 2.1. `models.js` (Loader)

The loader's primary responsibility is to load other scripts. The tests should focus on ensuring this process is robust.

*   **Test Suite: `Models Page Loader`**
    *   **Test Case**: It should correctly capture the `data-base-url` attribute from the script tag.
    *   **Test Case**: It should call `GreenhouseUtils.loadScript` for each of the required dependent scripts in the correct order.
    *   **Test Case**: It should handle the case where `GreenhouseUtils` fails to load.
    *   **Test Case**: It should define `window.GreenhouseModels.reinitialize` after successful loading.

### 2.2. `GreenhouseModelsUX`

This component is responsible for the application's lifecycle and user interactions.

*   **Test Suite: `GreenhouseModelsUX`**
    *   **Test Case**: `init()` should call the initialization methods of other components (e.g., `GreenhouseModelsUI.init()`).
    *   **Test Case**: `reinitialize()` should correctly reset the application state.
    *   **Test Case**: Event handlers (e.g., for button clicks, mouse movements) should be correctly attached to the DOM elements.
    *   **Test Case (Bug Hunt)**: Test how event handlers respond to unexpected event data (e.g., a click event with no coordinates).

### 2.3. `GreenhouseModelsUI`

This component manages the visual aspects of the application.

*   **Test Suite: `GreenhouseModelsUI`**
    *   **Test Case**: `init()` should create the main canvas element and other UI components.
    *   **Test Case**: The `render()` loop should be started on initialization.
    *   **Test Case**: `render()` should call the drawing methods for different scene elements (e.g., `drawBrain()`, `drawSynapses()`).
    *   **Test Case (Aesthetics Check)**: By using a mock canvas context that records drawing calls, we can assert that specific visual elements are drawn with the expected properties (e.g., `ctx.fillStyle` is set to the correct color before drawing a synapse, `ctx.fillRect` is called with the correct coordinates for a UI panel).

### 2.4. `GreenhouseModelsData`

This component handles data.

*   **Test Suite: `GreenhouseModelsData`**
    *   **Test Case**: It should correctly parse data fetched from the server.
    *   **Test Case (Bug Hunt)**: It should handle malformed or incomplete data without crashing.
    *   **Test Case**: It should provide methods to access the parsed data in a structured way.

### 2.5. `GreenhouseModels3DMath`

This component should be tested as a pure utility library.

*   **Test Suite: `GreenhouseModels3DMath`**
    *   **Test Case**: `project3DTo2D()` should correctly project a 3D point to 2D coordinates.
    *   **Test Case**: Test with edge cases, such as points behind the camera or at the edge of the clipping plane.
    *   **Test Case (Bug Hunt)**: Test with invalid inputs (e.g., `null` or `undefined` for coordinates) to ensure it doesn't result in `NaN` or other errors.

## 3. Mocking

To isolate the components and test them in a controlled environment, we will need to use mocks for:

*   **DOM**: A mock `document` and `window` object will be needed, similar to the existing tests.
*   **Canvas Context**: A mock 2D context that records drawing calls will be essential for testing the UI components.
*   **`fetch` API**: To test data loading, the `fetch` API should be mocked to return predefined data.
*   **Module Dependencies**: When testing a component, its dependencies on other modules should be mocked to ensure the test is focused on a single unit of functionality.
