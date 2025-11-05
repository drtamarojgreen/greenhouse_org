# Greenhouse Models Application: Implementation Plan

This document outlines the architecture and implementation of the Greenhouse Models application, a sophisticated, multi-layered simulation tool designed to visualize concepts of neuroplasticity.

## 1. Core Architecture: A Multi-Layered, Event-Driven Model

The application is architected as a modular system with a clear separation of concerns, comprising four primary layers:

1.  **Data Layer (`models_data.js`):** Responsible for fetching, processing, and managing all simulation data.
2.  **UI Layer (`models_ui.js`, `models_ui_*.js`):** Handles all DOM manipulation and canvas rendering. It is a purely presentational layer.
3.  **UX Layer (`models_ux.js`):** The central controller that manages application state, handles user interactions, and orchestrates the data and UI layers.
4.  **Loader (`models.js`):** The entry point script that waits for external data and initiates the application.

## 2. Component Breakdown and Responsibilities

### 2.1. `models.js`: The Application Loader

-   **Purpose:** Acts as the initial entry point when loaded by `greenhouse.js`.
-   **Functionality:**
    -   It does not contain any application logic itself.
    -   Its sole responsibility is to wait for the `greenhouseModelsDataReady` event, which is dispatched by an external script (presumably a Velo script on the Wix page) that fetches the initial data.
    -   Once the event is received, it dynamically loads the `models_ui.js` and `models_ux.js` scripts.
    -   It then initializes the main UI and UX modules, passing the fetched data to them.

### 2.2. `models_data.js`: The Data Engine

-   **Purpose:** Manages all data-related operations for the simulation.
-   **Functionality:**
    -   Fetches simulation data and a domain lexicon from predefined JSON endpoints.
    -   Contains a sophisticated `transformNotesToSimulationInput` function that processes raw text notes into a structured simulation format (nodes, synapses, events).
    -   Provides an `update` function to modify the simulation state based on user interactions.
    -   Exposes its functionality through the global `window.GreenhouseModelsData` object.

### 2.3. `models_util.js`: The Utility Belt

-   **Purpose:** Provides common helper functions used across the UI layer.
-   **Functionality:**
    -   `createElement`: A robust utility for creating and configuring DOM elements.
    -   `parseDynamicPath`: A specialized function for parsing and evaluating dynamic SVG path strings, allowing for responsive canvas drawings.

### 2.4. `models_ui.js`: The Master UI Controller

-   **Purpose:** Orchestrates the entire user interface.
-   **Functionality:**
    -   Initializes the UI by mixing in the specialized rendering modules (`models_ui_brain.js`, `models_ui_environment.js`, `models_ui_synapse.js`).
    -   Renders the initial consent screen.
    -   Renders the main simulation interface, which is divided into multiple canvas-based visualizations and control panels.
    -   Manages the creation, sizing, and clearing of all canvas elements.
    -   Exposes its functionality through the global `window.GreenhouseModelsUI` object.

### 2.5. Specialized UI Rendering Modules (`models_ui_*.js`)

-   **`models_ui_brain.js`:** Responsible for rendering the neural network visualization, including neurons and action potentials.
-   **`models_ui_environment.js`:** Renders the environmental factors visualization, including genetic and community influences.
-   **`models_ui_synapse.js`:** Renders the detailed synaptic cleft visualization, including vesicles, receptors, and neurotransmitter particles.

### 2.6. `models_ux.js`: The Application Core

-   **Purpose:** Acts as the central nervous system of the application, managing state and user interaction.
-   **Functionality:**
    -   Initializes the entire application, orchestrating the loading of data and the rendering of the UI.
    -   Manages a comprehensive state object that tracks the status of the consent screen, simulation parameters (intensity, speed), and the state of each visualization.
    -   Binds all event listeners for user interactions, including the consent checkbox, start button, and all simulation controls (sliders, buttons, dropdowns).
    -   Contains the main `simulationLoop` logic, which updates the application state on each frame and triggers the UI to redraw.
    -   Exposes its functionality through the global `window.GreenhouseModelsUX` object.

## 3. Execution Flow

1.  **Loading:** The main `greenhouse.js` script loads `docs/js/models.js` on the `/models` page.
2.  **Data Fetching (External):** A Velo script on the Wix page fetches the initial models data and dispatches the `greenhouseModelsDataReady` event.
3.  **Initialization:** `models.js` catches the event and loads `models_ui.js` and `models_ux.js`.
4.  **UX Takeover:** `models_ux.js` is initialized. It, in turn, initializes `models_data.js` to load the simulation data and `models_ui.js` to render the consent screen.
5.  **User Consent:** The user interacts with the consent screen. `models_ux.js` listens for the "start" button click.
6.  **Simulation Start:** Upon consent, `models_ux.js` directs `models_ui.js` to render the main simulation interface. It then binds all simulation control listeners.
7.  **Interaction Loop:** The user interacts with the simulation controls. `models_ux.js` updates the application state in response to these interactions and runs the `simulationLoop`.
8.  **Rendering:** On each tick of the `simulationLoop`, `models_ux.js` calls the appropriate rendering functions in `models_ui.js`, which in turn use the specialized `models_ui_*.js` modules to redraw the canvases based on the current state.

## 4. Synchronization Analysis

This section details the alignment between the documented implementation and the actual state of the code in the branch.

### What is In Sync

-   **Velo Script (`apps/frontend/models/Models.js`):** The implementation of this script is in sync with its intended purpose. It correctly fetches data from the three specified endpoints and exposes it on the `window._greenhouseModelsData` object.
-   **Browser Script Architecture (`docs/js/models_*.js`):** The modular architecture of the browser scripts (`models.js`, `models_data.js`, `models_ui.js`, `models_ux.js`, etc.) is in sync with the documentation. The roles and responsibilities of each module are accurately described.
-   **Documentation Accuracy:** The `docs/models_implementation_plan3.md` file accurately describes the intended architecture and the individual responsibilities of each script.

### What is Not In Sync

-   **The Critical Communication Link:** There is a major disconnect between the Velo script and the browser-side loader script, which prevents the application from functioning.
    -   **The Problem:** The Velo script (`apps/frontend/models/Models.js`) successfully fetches the data, but it **does not dispatch the `greenhouseModelsDataReady` event**. The browser script (`docs/js/models.js`) is designed to **wait exclusively for this event**.
    -   **The Consequence:** Because the event is never fired, the browser script will wait indefinitely and will never proceed to load the UI and UX modules (`models_ui.js`, `models_ux.js`). As a result, the entire simulation will fail to initialize, and the page will remain blank.
-   **Execution Flow Mismatch:** The documented "Execution Flow" is therefore **not in sync** with the actual code. Step 2, "Data Fetching (External)," is incomplete because it omits the crucial event dispatch. This breaks the entire chain of events described in steps 3 through 8.
