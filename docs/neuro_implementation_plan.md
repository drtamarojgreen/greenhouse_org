# Neuro Implementation Plan

## Overview
This document outlines the plan for creating a new page `/neuro/` on the website. This page will be dedicated to a 3D visualization of neuron growth demonstrated via a Genetic Algorithm (GA). Unlike the main `models.html` page, which focuses on various 2D/3D representations of mental health models, this page will focus solely on the 3D simulation of network evolution.

## Goals
1.  **Create `/neuro/` Page**: A new HTML entry point (`docs/neuro/index.html`) that loads the necessary components.
2.  **Implement Genetic Algorithm Simulation**: Since the original Python-based genetic algorithms (`tools/genetic_ml`) are not available in the client-side environment, we will implement a JavaScript-based simulation. This simulation will demonstrate "growth" by evolving a network of neurons over time.
    *   **Evolution**: Neurons will sprout connections, and connections will be strengthened or pruned based on a fitness function (e.g., signal propagation efficiency).
    *   **Growth**: New neurons may be added ("neurogenesis") in later generations or based on available space.
3.  **3D Visualization**: Reuse and adapt the existing 3D rendering logic (`models_ui_3d.js` and `models_3d_math.js`) to visualize this dynamic growth process.

## File Structure

### New Files
*   `docs/neuro/index.html`: The main HTML file for the Neuro page. It will look similar to `models.html` but simplified to focus on the 3D view.
*   `docs/js/neuro_app.js`: The main entry point script for the Neuro page. It will handle initialization and dependency loading, similar to `models.js` but lighter.
*   `docs/js/neuro_ga.js`: A new module containing the Genetic Algorithm logic. It will manage the population (network configurations), fitness evaluation, and evolution steps (mutation/crossover).
*   `docs/js/neuro_ui_3d.js`: A modified version of `models_ui_3d.js` specifically for the Neuro page. It will need to interface with `neuro_ga.js` instead of the static `models_data.js`. (Alternatively, we can subclass or configure `models_ui_3d.js` if possible, but a separate file might be cleaner to avoid regressions in the main app).

### Existing Files to Reuse
*   `docs/js/models_3d_math.js`: Core 3D projection and math utilities.
*   `docs/js/GreenhouseUtils.js`: Utility functions for loading scripts and DOM manipulation.
*   `docs/css/`: Reuse existing styles where appropriate.

## Implementation Steps

### 1. Preparation & Setup
*   Create the `docs/neuro/` directory.
*   Create `docs/neuro/index.html` with a basic structure, including the canvas container and loading the necessary scripts.

### 2. Genetic Algorithm (GA) Logic (`neuro_ga.js`)
*   **State**: Define the "genome" as the set of connections and weights between neurons.
*   **Initialization**: create a random sparse network.
*   **Simulation Loop**:
    *   **Step**: Propagate signals through the network.
    *   **Evaluate**: Calculate "fitness" based on how well signals travel (e.g., maximizing activity in target regions while minimizing energy/connections).
    *   **Evolve**:
        *   *Pruning*: Remove weak connections.
        *   *Growth*: Add new connections (synaptogenesis) between nearby active neurons.
        *   *Neurogenesis* (Optional): Add new neurons in empty spaces.
*   **API**: Provide methods like `initialize()`, `step()`, `getNetworkState()` for the UI to consume.

### 3. 3D Visualization (`neuro_ui_3d.js`)
*   Clone/Adapt `models_ui_3d.js`.
*   Remove dependencies on `GreenhouseModelsData` and `GreenhouseModelsUI` (the complex 2D UI).
*   Instead of reading `this.state.networkLayout` once, it should read the dynamic state from `neuro_ga.js` on every frame or generation update.
*   Add visual cues for growth: e.g., new connections appearing, neurons growing in size or brightness.

### 4. Integration (`neuro_app.js`)
*   Orchestrate the loading of `models_3d_math.js`, `neuro_ga.js`, and `neuro_ui_3d.js`.
*   Start the simulation loop.

### 5. Review & Refine
*   Ensure the 3D view works smoothly.
*   Verify the "growth" effect is visible and understandable.
*   Complete pre-commit checks.

## Pre-Commit Steps
*   Complete pre commit steps (Ensuring no self-code review is performed and no text is saved to memory without consent).

## Submission
*   Request User Review.
*   Submit the changes.
