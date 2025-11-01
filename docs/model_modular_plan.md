# Plan for Modularizing `models.js`

This document outlines the strategy for refactoring the monolithic `docs/js/models.js` file into smaller, more manageable modules. The goal is to improve code organization, maintainability, and clarity by separating concerns into three distinct modules: `models_data.js`, `models_ui.js`, and `models_ux.js`.

## 1. Module Responsibilities

### 1.1. `models_data.js` - The Data Layer

This module will be responsible for all data-related operations, including fetching, storing, and transforming data for the simulation.

-   **State Management:** Manages the core application state related to simulation data, such as `simulationData`, `lexicon`, and `processedSimulation`.
-   **Data Fetching:** Handles all network requests to fetch the simulation data and lexicon from their respective endpoints.
-   **Data Transformation:** Contains the logic for the transformation pipeline (`transformNotesToSimulationInput`) that converts raw notes into a structured format for the simulation.
-   **Simulation Logic:** Includes the core simulation algorithms (`update` method) that modify the data state, such as calculating synaptic weight changes.

### 1.2. `models_ui.js` - The Presentation Layer

This module will be responsible for rendering and updating the user interface based on the application state. It will not contain any business logic.

-   **DOM Manipulation:** Handles all direct interactions with the DOM, including creating, appending, and updating elements.
-   **Rendering Functions:** Contains all functions responsible for rendering specific parts of the UI, such as `renderConsentScreen`, `renderSimulationInterface`, `populateMetricsPanel`, and `populateControlsPanel`.
-   **Canvas Drawing:** Includes all canvas drawing logic, such as `drawSynapticView`, `drawNetworkView`, and `drawNeuron`.
-   **UI Updates:** Provides functions to update UI elements based on new data, such as `updateMetrics`.

### 1.3. `models_ux.js` - The Interaction Layer

This module will be responsible for handling all user interactions and managing the overall application flow. It will act as the controller, connecting the data layer and the presentation layer.

-   **Event Listeners:** Contains all event listener setup and handling, such as `addConsentListeners` and `addSimulationListeners`.
-   **Application Flow:** Manages the application's lifecycle, including initialization (`init`), the simulation loop (`simulationLoop`), and consent handling.
-   **User Input Handling:** Responds to user input from controls (e.g., sliders, buttons) and triggers the appropriate actions in the data or UI modules.
-   **Dependency Management:** Manages the loading and availability of external dependencies like `GreenhouseUtils`.

## 2. Code Mapping from `models.js` to New Modules

The following is a breakdown of how the existing code in `models.js` will be mapped to the new modules.

### 2.1. `models_data.js`

-   **State:**
    -   `state.simulationData`
    -   `state.lexicon`
    -   `state.processedSimulation`
    -   `state.synapticWeight`
    -   `state.neurotransmitters`
    -   `state.ionsCrossed`
    -   `state.learningMetric`
-   **Configuration:**
    -   `config.dataUrl`
    -   `config.lexiconUrl`
-   **Functions:**
    -   `loadData`
    -   `transformNotesToSimulationInput`
    -   `update` (simulation algorithm)

### 2.2. `models_ui.js`

-   **Functions:**
    -   `renderConsentScreen`
    -   `renderSimulationInterface`
    -   `populateMetricsPanel`
    -   `populateControlsPanel`
    -   `updateMetrics`
    -   `drawSynapticView`
    -   `drawNetworkView`
    -   `drawNeuron`
    -   `updateParticles`
    -   `resizeCanvas`
    -   `createElement`
    -   `loadCSS`

### 2.3. `models_ux.js`

-   **State:**
    -   `state.consentGiven`
    -   `state.simulationRunning`
    -   `state.isInitialized`
    -   `state.isLoading`
    -   `state.intensity`
    -   `state.speed`
    -   `state.isRunning`
    -   `state.animationFrameId`
    -   `state.mode`
-   **Functions:**
    -   `init`
    -   `addConsentListeners`
    -   `addSimulationListeners`
    -   `bindSimulationControls`
    -   `simulationLoop`
    -   `runSimulation`
    -   `getConfiguration`
    -   `observeAndReinitializeApp`
    -   `reinitialize`
    -   `loadDependencies` (and the main execution logic)

## 3. Module Interaction

The new modules will be designed to work together through a well-defined interface.

1.  **Initialization:** The main application entry point (`main` function, to be placed in `models_ux.js` or a new `main.js`) will initialize the `models_ux.js` module.
2.  **Data Flow:**
    -   `models_ux.js` will call `models_data.js` to load and process the simulation data.
    -   Once the data is ready, `models_ux.js` will pass it to `models_ui.js` to render the initial simulation interface.
3.  **User Interaction:**
    -   Event listeners in `models_ux.js` will capture user input.
    -   For actions that affect the simulation state (e.g., changing intensity), `models_ux.js` will call the appropriate functions in `models_data.js`.
    -   For actions that only affect the UI (e.g., switching views), `models_ux.js` will call the appropriate functions in `models_ui.js`.
4.  **Simulation Loop:**
    -   The `simulationLoop` in `models_ux.js` will repeatedly call the `update` function in `models_data.js` to update the simulation state.
    -   After each update, it will call the relevant drawing functions in `models_ui.js` to reflect the new state on the canvas and in the metrics panel.

This separation will ensure that the data logic is decoupled from the presentation, making the code easier to understand, test, and maintain.
