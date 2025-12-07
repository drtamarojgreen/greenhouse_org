# Neuro Implementation Plan

## Overview
This document outlines the plan for creating a new page `/neuro/` on the website. This page will be dedicated to a 3D visualization of neuron growth demonstrated via a Genetic Algorithm (GA).

## Goals
1.  **Create `/neuro/` Page**: A new HTML entry point (`docs/neuro/index.html`) that loads the necessary components for *local development*.
2.  **Implement Genetic Algorithm Simulation**: A JavaScript-based simulation (`docs/js/neuro_ga.js`) demonstrating network evolution.
3.  **3D Visualization**: Adapt existing 3D rendering logic (`models_ui_3d.js`) into `docs/js/neuro_ui_3d.js` to visualize this growth.
4.  **Wix Integration**: Ensure the new application can be embedded into the Wix-hosted production site.

## File Structure

### New Files
*   `docs/neuro/index.html`: **Local Development Mock.** A standalone HTML file to test the application outside of Wix. It will mimic the DOM structure expected by the app.
*   `docs/js/neuro_app.js`: **Main Application Entry Point.** Handles initialization, dependency loading, and mounting the application into the target DOM element.
*   `docs/js/neuro_ga.js`: **Simulation Logic.** Implements the Genetic Algorithm (population, fitness, evolution).
*   `docs/js/neuro_ui_3d.js`: **Visualization.** Handles the 3D rendering of the network.

### Existing Files to Reuse
*   `docs/js/greenhouse.js`: **Loader.** Needs update to route `/neuro/` requests to `neuro_app.js`.
*   `docs/js/models_3d_math.js`: Core 3D projection and math utilities.
*   `docs/js/GreenhouseUtils.js`: Utility functions for loading scripts and DOM manipulation.

## Implementation Steps

### 1. Local Development Setup
*   Create the `docs/neuro/` directory.
*   Create `docs/neuro/index.html` containing a mock container element (e.g., `<div id="neuro-app-container"></div>`).
*   Create `docs/js/neuro_app.js` which:
    *   Accepts a target selector (e.g., via data attributes or config).
    *   Loads dependencies (`neuro_ga.js`, `neuro_ui_3d.js`).
    *   Initializes the app within the target container.

### 2. Genetic Algorithm (GA) Logic (`neuro_ga.js`)
*   Implement the "genome" (network weights/connections).
*   Implement the simulation loop (propagate, evaluate, evolve).
*   Expose a state object for the UI to consume.

### 3. 3D Visualization (`neuro_ui_3d.js`)
*   Adapt `models_ui_3d.js` to read from the `neuro_ga.js` state.
*   Implement visual cues for growth (synaptogenesis, neurogenesis).

### 4. Wix Integration Strategy
This is the critical path for production deployment.
*   **Wix Page Creation**: A new page (slug `/neuro`) must be created in the Wix editor.
*   **Greenhouse Loader Update**: Update `docs/js/greenhouse.js`:
    *   Add a configuration entry for `neuroPagePath: '/neuro/'`.
    *   Define the `selectors.neuro` to target the specific Wix element where the app should inject itself (e.g., a specific Column Strip or Section).
    *   Add a `loadNeuroApplication()` function that calls `loadApplication('neuro', 'neuro_app.js', config.selectors.neuro, ...)`.
    *   Update the `initialize()` function to check `window.location.pathname.includes(config.neuroPagePath)`.

### 5. Review & Refine
*   Verify local development via `docs/neuro/index.html`.
*   Verify the integration logic by reviewing the changes to `greenhouse.js`.

## Pre-Commit Steps
*   Complete pre commit steps (Ensuring no self-code review is performed and no text is saved to memory without consent).

## Submission
*   Request User Review.
*   Submit the changes.
